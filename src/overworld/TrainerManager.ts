import * as Phaser from 'phaser';
import { BattlePokemon, BattleMove } from '../core/battle';
import { BattleScene } from '../scenes/BattleScene';
import { AudioManager } from '../audio';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

export type TrainerAITier = 'rookie' | 'gym_pupil' | 'gym_leader' | 'rival' | 'elite_four' | 'champion';

export interface TrainerDefinition {
  id: string;
  name: string;
  title: string;
  aiTier: TrainerAITier;
  /** Posición del entrenador en el mapa (px) */
  x: number;
  y: number;
  /** Dirección que mira el entrenador en reposo */
  facing: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  /** Número de tiles de línea de visión */
  sightRange: number;
  team: BattlePokemon[];
  /** Diálogos antes del combate */
  dialogueBefore: string[];
  /** Diálogos tras ser derrotado */
  dialogueAfter: string[];
  /** Recompensa en dinero */
  reward: number;
  /** `true` si el jugador ya lo derrotó */
  defeated?: boolean;
}

type TrainerState =
  | 'IDLE'           // Mirando en su dirección, sin detectar al jugador
  | 'ALERTED'        // Ícono ! en pantalla, breve pausa antes de caminar
  | 'WALKING'        // Caminando hacia el jugador
  | 'INITIATING'     // En rango, iniciando diálogo
  | 'DEFEATED';      // Ya fue derrotado

// ─────────────────────────────────────────────────────────────────────────────
// GESTOR DE ENTRENADORES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TrainerManager — Sistema de Entrenadores con Línea de Visión.
 *
 * Responsabilidades:
 * - Renderizar sprites de entrenadores en el mapa.
 * - Detectar al jugador dentro del cono de visión (rectángulo en la dirección facing).
 * - Mostrar el ícono `!` y ejecutar la caminata automática hacia el jugador.
 * - Iniciar el diálogo de desafío y la transición a BattleScene.
 */
export class TrainerManager {
  private scene: Phaser.Scene;

  /** Registro interno de datos + sprite de cada entrenador */
  private trainers: Map<string, {
    def: TrainerDefinition;
    sprite: Phaser.GameObjects.Container;
    exclamation: Phaser.GameObjects.Text;
    state: TrainerState;
    walkTarget: { x: number; y: number } | null;
  }> = new Map();

  /** ID del entrenador que está en proceso de combate (evita doble trigger) */
  private lockedTrainerId: string | null = null;

  /** Mínima distancia para considerar que el entrenador "llegó" al jugador */
  private readonly REACH_DISTANCE = 48;

  /** Duración del ícono ! antes de caminar (ms) */
  private readonly ALERT_DURATION_MS = 700;

  /** Velocidad de caminata del entrenador (px/s) */
  private readonly WALK_SPEED = 100;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // INICIALIZACIÓN
  // ──────────────────────────────────────────────────────────────────────────────

  public getTrainerSpriteKey(def: TrainerDefinition): string {
    const id = (def.id || '').toLowerCase();
    const title = (def.title || '').toLowerCase();
    const name = (def.name || '').toLowerCase();

    // Líderes y Alto Mando / Campeona
    if (id.includes('rocio') || name.includes('rocío') || name.includes('rocio')) return 'npc_leader_rocio';
    if (id.includes('thiago') || name.includes('thiago')) return 'npc_leader_thiago';
    if (id.includes('inti') || name.includes('inti')) return 'npc_elite_inti';
    if (id.includes('marina') || name.includes('marina')) return 'npc_elite_marina';
    if (id.includes('renata') || name.includes('renata') || def.aiTier === 'champion') return 'npc_champion_renata';
    if (id.includes('rival') || id.includes('nahuel') || name.includes('nahuel') || def.aiTier === 'rival') return 'npc_rival';

    // NPCs por rol y entorno
    if (title.includes('pescador') || title.includes('marinero')) return 'npc_fisherman';
    if (title.includes('minero') || title.includes('montañero') || title.includes('excursionista') || title.includes('arqueólog')) return 'npc_hiker';
    if (title.includes('cazabicho') || title.includes('bichomani')) return 'npc_bugcatcher';
    if (title.includes('nadador') || title.includes('bañista') || title.includes('playero')) return 'npc_swimmer';
    if (title.includes('médium') || title.includes('medium') || title.includes('bruja') || title.includes('pitonisa')) return 'npc_medium';
    if (title.includes('chica') || title.includes('dama') || title.includes('estudiante')) return 'npc_lass';

    return 'npc_young_guy';
  }

  /**
   * Instancia los sprites de una lista de entrenadores definidos para el mapa actual.
   * Los entrenadores ya derrotados se muestran pero no atacan.
   */
  public spawnTrainers(definitions: TrainerDefinition[]): void {
    this.clearTrainers();

    for (const def of definitions) {
      const container = this.scene.add.container(def.x, def.y);
      container.setDepth(8);

      const spriteKey = this.getTrainerSpriteKey(def);
      const facingFrame = def.facing === 'UP' ? 12 : def.facing === 'LEFT' ? 4 : def.facing === 'RIGHT' ? 8 : 0;

      let body: Phaser.GameObjects.GameObject;
      if (this.scene.textures.exists(spriteKey)) {
        const sprite = this.scene.add.sprite(0, -6, spriteKey, facingFrame);
        sprite.setDisplaySize(36, 36);
        body = sprite;
      } else {
        const gfx = this.scene.add.graphics();
        gfx.fillStyle(this.getTierColor(def.aiTier), 1);
        gfx.fillRect(-12, -22, 24, 38);
        body = gfx;
      }

      // Sombra bajo el entrenador
      const shadow = this.scene.add.ellipse(0, 8, 20, 8, 0x000000, 0.35);

      // Nombre flotante encima
      const nameLabel = this.scene.add.text(0, -28, def.name, {
        fontFamily: 'PokemonGBA, Arial', fontSize: '11px', color: '#f1c40f',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5);

      // Ícono ! (oculto por defecto)
      const exclamation = this.scene.add.text(0, -46, '!', {
        fontFamily: 'Arial', fontSize: '20px', fontStyle: 'bold',
        color: '#e74c3c', stroke: '#ffffff', strokeThickness: 3,
      }).setOrigin(0.5).setVisible(false);

      container.add([shadow, body, nameLabel, exclamation]);

      // Si ya fue derrotado, oscurecer
      if (def.defeated) {
        if (body instanceof Phaser.GameObjects.Sprite) {
          body.setAlpha(0.6);
        } else if (body instanceof Phaser.GameObjects.Graphics) {
          body.setAlpha(0.5);
        }
      }

      this.trainers.set(def.id, {
        def,
        sprite: container,
        exclamation,
        state: def.defeated ? 'DEFEATED' : 'IDLE',
        walkTarget: null,
      });
    }
  }

  public clearTrainers(): void {
    this.trainers.forEach(t => t.sprite.destroy());
    this.trainers.clear();
    this.lockedTrainerId = null;
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // UPDATE — Llamar en el update() de OverworldScene
  // ──────────────────────────────────────────────────────────────────────────────

  /**
   * Actualiza la IA de todos los entrenadores.
   * @param playerX - Posición X del jugador.
   * @param playerY - Posición Y del jugador.
   * @param tileSize - Tamaño de tile del mapa en px (default 32).
   * @param onBattleStart - Callback para iniciar la escena de combate.
   * @param delta - Delta time en ms del frame actual.
   */
  public update(
    playerX: number,
    playerY: number,
    tileSize: number = 32,
    onBattleStart: (trainer: TrainerDefinition) => void,
    delta: number
  ): void {
    if (this.lockedTrainerId !== null) return; // Combate en curso

    this.trainers.forEach((t, id) => {
      if (t.state === 'DEFEATED') return;

      switch (t.state) {
        case 'IDLE':
          // Comprobar si el jugador está dentro de la línea de visión
          if (this.isPlayerInSight(t.def, playerX, playerY, tileSize)) {
            this.alertTrainer(id, playerX, playerY);
          }
          break;

        case 'WALKING':
          // Mover hacia el jugador
          if (t.walkTarget) {
            const dx = t.walkTarget.x - t.sprite.x;
            const dy = t.walkTarget.y - t.sprite.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= this.REACH_DISTANCE) {
              // Llegó al jugador — iniciar combate
              t.state = 'INITIATING';
              t.sprite.x = t.walkTarget.x;
              t.sprite.y = t.walkTarget.y;
              this.lockedTrainerId = id;
              this.scene.time.delayedCall(200, () => onBattleStart(t.def));
            } else {
              // Avanzar hacia el jugador actualizado
              const speed = this.WALK_SPEED * (delta / 1000);
              t.sprite.x += (dx / dist) * speed;
              t.sprite.y += (dy / dist) * speed;
              // Actualizar objetivo dinámicamente (el jugador se mueve)
              t.walkTarget = { x: playerX, y: playerY };
            }
          }
          break;
      }
    });
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // LÓGICA DE VISIÓN Y ALERTA
  // ──────────────────────────────────────────────────────────────────────────────

  /**
   * Comprueba si el jugador está dentro del rectángulo de visión del entrenador.
   * La visión es unidireccional: `sightRange` tiles en la dirección que mira el entrenador.
   */
  private isPlayerInSight(def: TrainerDefinition, playerX: number, playerY: number, tileSize: number): boolean {
    const sightPx = def.sightRange * tileSize;
    const tolerance = tileSize; // Ancho del cono de visión

    const diffX = playerX - def.x;
    const diffY = playerY - def.y;

    switch (def.facing) {
      case 'RIGHT': return diffX > 0 && diffX <= sightPx && Math.abs(diffY) < tolerance;
      case 'LEFT':  return diffX < 0 && diffX >= -sightPx && Math.abs(diffY) < tolerance;
      case 'DOWN':  return diffY > 0 && diffY <= sightPx && Math.abs(diffX) < tolerance;
      case 'UP':    return diffY < 0 && diffY >= -sightPx && Math.abs(diffX) < tolerance;
    }
    return false;
  }

  /**
   * Muestra el ícono `!` animado y después de un delay inicia la caminata.
   */
  private alertTrainer(id: string, playerX: number, playerY: number): void {
    const t = this.trainers.get(id);
    if (!t || t.state !== 'IDLE') return;

    t.state = 'ALERTED';
    t.exclamation.setVisible(true);

    // 7.3 — SFX de detección de entrenador
    AudioManager.getInstance().playSfx('exclamation');

    // Animación de timbre: el ícono sube y vuelve
    this.scene.tweens.add({
      targets: t.exclamation,
      y: t.exclamation.y - 10,
      duration: 200,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeOut',
    });

    // Flash de atención en cámara
    this.scene.cameras.main.shake(150, 0.003);

    // Esperar ALERT_DURATION_MS antes de caminar
    this.scene.time.delayedCall(this.ALERT_DURATION_MS, () => {
      t.exclamation.setVisible(false);
      t.state = 'WALKING';
      t.walkTarget = { x: playerX, y: playerY };
    });
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // DESPUÉS DEL COMBATE
  // ──────────────────────────────────────────────────────────────────────────────

  /**
   * Marca un entrenador como derrotado (se oscurece y no vuelve a atacar).
   * Llamar desde BattleScene cuando el jugador gana.
   */
  public markDefeated(trainerId: string): void {
    const t = this.trainers.get(trainerId);
    if (!t) return;
    t.state = 'DEFEATED';
    t.def.defeated = true;
    t.sprite.setAlpha(0.5);
    this.lockedTrainerId = null;
  }

  /**
   * Libera el lock de combate sin marcar como derrotado (por si el jugador pierde).
   */
  public releaseLock(): void {
    this.lockedTrainerId = null;
    // Si el entrenador que estaba en INITIATING perdió, volvemos a IDLE
    this.trainers.forEach(t => {
      if (t.state === 'INITIATING') {
        t.state = 'IDLE';
        // Regresar al entrenador a su posición original
        this.scene.tweens.add({
          targets: t.sprite,
          x: t.def.x,
          y: t.def.y,
          duration: 600,
          ease: 'Power2',
        });
      }
    });
  }

  // Colores de placeholder según rango de IA del entrenador
  private getTierColor(tier: TrainerAITier): number {
    const colors: Record<TrainerAITier, number> = {
      rookie:      0x7f8c8d,
      gym_pupil:   0x16a085,
      gym_leader:  0xf39c12,
      rival:       0x8e44ad,
      elite_four:  0xe74c3c,
      champion:    0xd4ac0d,
    };
    return colors[tier] ?? 0x7f8c8d;
  }

  public get hasActiveBattle(): boolean {
    return this.lockedTrainerId !== null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DATOS DEL GIMNASIO DE PUEBLO ALTIPLANO (FASE 3.4)
// ─────────────────────────────────────────────────────────────────────────────

const ROCK_MOVE = (name: string, power: number): BattleMove => ({
  id: name.toLowerCase().replace(' ', '_'),
  name,
  type: 'rock',
  category: 'physical',
  power,
  accuracy: 90,
  pp: 15,
  maxPp: 15,
});

const GROUND_MOVE = (name: string, power: number): BattleMove => ({
  id: name.toLowerCase().replace(' ', '_'),
  name,
  type: 'ground',
  category: 'physical',
  power,
  accuracy: 95,
  pp: 20,
  maxPp: 20,
});

/**
 * Entrenadores del Gimnasio de Pueblo Altiplano.
 * Líder: Rocío (especialista en tipo Roca).
 */
export const GYM_ALTIPLANO_TRAINERS: TrainerDefinition[] = [
  // ─── Pupilo 1 ───
  {
    id: 'gym_altiplano_pup1',
    name: 'Minero Javo',
    title: 'Minero',
    aiTier: 'gym_pupil',
    x: 200, y: 300,
    facing: 'DOWN',
    sightRange: 4,
    reward: 640,
    dialogueBefore: ['¡El poder de las rocas aplastará tus fantasmas!', '¡Prepárate para combatir!'],
    dialogueAfter:  ['No... mis rocas fallaron...'],
    team: [
      {
        id: 74, name: 'Geodude', types: ['rock', 'ground'], level: 10,
        currentHp: 40, maxHp: 40, attack: 28, defense: 30, speed: 12,
        spAttack: 16, spDefense: 16,
        moves: [
          ROCK_MOVE('Lanzarrocas', 50),
          GROUND_MOVE('Magnitud', 70),
          { id: 'tackle', name: 'Placaje', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 35, maxPp: 35 },
          { id: 'defense_curl', name: 'Rizo Defensa', type: 'normal', category: 'status', power: 0, accuracy: 100, pp: 40, maxPp: 40 },
        ]
      }
    ]
  },

  // ─── Pupilo 2 ───
  {
    id: 'gym_altiplano_pup2',
    name: 'Arqueóloga Fanny',
    title: 'Arqueóloga',
    aiTier: 'gym_pupil',
    x: 450, y: 220,
    facing: 'LEFT',
    sightRange: 5,
    reward: 800,
    dialogueBefore: ['¡Los fósiles del pasado renacen para aplastarte!'],
    dialogueAfter:  ['¡Imposible! Mi historia acaba aquí...'],
    team: [
      {
        id: 74, name: 'Geodude', types: ['rock', 'ground'], level: 11,
        currentHp: 44, maxHp: 44, attack: 30, defense: 32, speed: 13,
        spAttack: 16, spDefense: 16,
        moves: [
          ROCK_MOVE('Lanzarrocas', 50),
          GROUND_MOVE('Magnitud', 70),
          { id: 'headbutt', name: 'Cabezazo', type: 'normal', category: 'physical', power: 70, accuracy: 100, pp: 15, maxPp: 15 },
          { id: 'smack_down', name: 'Derribo', type: 'rock', category: 'physical', power: 50, accuracy: 100, pp: 15, maxPp: 15 },
        ]
      },
      {
        id: 111, name: 'Rhyhorn', types: ['ground', 'rock'], level: 10,
        currentHp: 48, maxHp: 48, attack: 32, defense: 36, speed: 10,
        spAttack: 14, spDefense: 14,
        moves: [
          ROCK_MOVE('Lanzarrocas', 50),
          GROUND_MOVE('Magnitud', 70),
          { id: 'stomp', name: 'Pisotón', type: 'normal', category: 'physical', power: 65, accuracy: 100, pp: 20, maxPp: 20 },
        ]
      }
    ]
  },

  // ─── Líder: Rocío ───
  {
    id: 'gym_altiplano_leader_rocio',
    name: 'Rocío',
    title: 'Líder de Gimnasio',
    aiTier: 'gym_leader',
    x: 480, y: 80,
    facing: 'DOWN',
    sightRange: 3,
    reward: 2400,
    dialogueBefore: [
      'Así que superaste a mis discípulos...',
      'Soy Rocío, Líder del Gimnasio Altiplano.',
      'Mis Pokémon son tan inamovibles como las montañas de Andara.',
      '¡No esperes que el tiempo los erosione en este combate!'
    ],
    dialogueAfter: [
      '...Increíble. Tienes el espíritu de un verdadero entrenador.',
      'Has superado la prueba de las Rocas de Andara.',
      '¡Acepta esta Medalla Cumbre como símbolo de tu victoria!'
    ],
    team: [
      {
        id: 74, name: 'Geodude', types: ['rock', 'ground'], level: 12,
        currentHp: 48, maxHp: 48, attack: 32, defense: 35, speed: 13,
        spAttack: 16, spDefense: 16,
        moves: [
          ROCK_MOVE('Lanzarrocas', 50),
          GROUND_MOVE('Terremoto', 100),
          { id: 'selfdestruct', name: 'Autodestrucción', type: 'normal', category: 'physical', power: 200, accuracy: 100, pp: 5, maxPp: 5 },
          { id: 'defense_curl', name: 'Rizo Defensa', type: 'normal', category: 'status', power: 0, accuracy: 100, pp: 40, maxPp: 40 },
        ]
      },
      {
        id: 95, name: 'Onix', types: ['rock', 'ground'], level: 14,
        currentHp: 38, maxHp: 38, attack: 26, defense: 70, speed: 30,
        spAttack: 14, spDefense: 20,
        moves: [
          ROCK_MOVE('Lanzarrocas', 50),
          GROUND_MOVE('Magnitud', 70),
          { id: 'bind', name: 'Constricción', type: 'normal', category: 'physical', power: 15, accuracy: 85, pp: 20, maxPp: 20 },
          { id: 'iron_tail', name: 'Cola Férrea', type: 'steel', category: 'physical', power: 100, accuracy: 75, pp: 15, maxPp: 15 },
        ]
      }
    ]
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// BASE DE DATOS COMPLETA DE LA LIGA DE ANDARA (8 GIMNASIOS, ALTO MANDO Y RENATA)
// ─────────────────────────────────────────────────────────────────────────────

export interface GymBadge {
  id: string;
  name: string;
  gymLeaderId: string;
  city: string;
  description: string;
}

export const ANDARA_GYM_BADGES: Record<string, GymBadge> = {
  badge_cumbre: {
    id: 'badge_cumbre',
    name: 'Medalla Cumbre',
    gymLeaderId: 'gym_altiplano_leader_rocio',
    city: 'Pueblo Altiplano',
    description: 'Otorgada por Rocío (Tierra/Roca). Prueba la solidez ante las alturas cordilleranas.'
  },
  badge_selva: {
    id: 'badge_selva',
    name: 'Medalla Selva',
    gymLeaderId: 'gym_yungas_leader_thiago',
    city: 'Villa Yungas',
    description: 'Otorgada por Thiago (Bicho/Planta). Reconoce la agilidad y adaptación en los bosques nublados.'
  },
  badge_arrecife: {
    id: 'badge_arrecife',
    name: 'Medalla Arrecife',
    gymLeaderId: 'gym_coralina_leader_marina',
    city: 'Puerto Coralina',
    description: 'Otorgada por Marina (Agua). Prueba la navegación ante las corrientes marinas.'
  },
  badge_ruinas: {
    id: 'badge_ruinas',
    name: 'Medalla Ruinas',
    gymLeaderId: 'gym_condorina_leader_inti',
    city: 'Ciudad Condorina',
    description: 'Otorgada por Inti (Psíquico/Fantasma). Refleja la sincronía con los ancestros.'
  },
  badge_vortice: {
    id: 'badge_vortice',
    name: 'Medalla Vórtice',
    gymLeaderId: 'gym_solsticio_leader_valeria',
    city: 'Metrópolis Solsticio',
    description: 'Otorgada por Valeria (Eléctrico/Acero). Desbloquea el Mega-Aro de Andara.'
  },
  badge_toxicidad: {
    id: 'badge_toxicidad',
    name: 'Medalla Toxicidad',
    gymLeaderId: 'gym_esmeralda_leader_kael',
    city: 'Cuenca Esmeralda',
    description: 'Otorgada por Kael (Veneno/Lucha). Demuestra resistencia ante la jungla amazónica.'
  },
  badge_magma: {
    id: 'badge_magma',
    name: 'Medalla Magma',
    gymLeaderId: 'gym_vulcania_leader_damian',
    city: 'Paso Vulcania',
    description: 'Otorgada por Damián (Fuego Sequía). Forja el temple en las faldas volcánicas.'
  },
  badge_glaciar: {
    id: 'badge_glaciar',
    name: 'Medalla Glaciar',
    gymLeaderId: 'gym_australes_leader_silvana',
    city: 'Cumbres Australes',
    description: 'Otorgada por Silvana (Hielo/Dragón). Abre las puertas hacia la Gran Liga de Andara.'
  }
};

export const BADGE_CUMBRE: GymBadge = ANDARA_GYM_BADGES.badge_cumbre;

export const ANDARA_MAJOR_TRAINERS: TrainerDefinition[] = [
  // ─── Gimnasio 2: Thiago (Villa Yungas) ───
  {
    id: 'gym_yungas_leader_thiago',
    name: 'Thiago',
    title: 'Líder de Gimnasio',
    aiTier: 'gym_leader',
    x: 400, y: 150,
    facing: 'DOWN',
    sightRange: 4,
    reward: 3500,
    dialogueBefore: [
      '¡Bienvenido a la densa selva de Villa Yungas!',
      'Soy Thiago. Mis Pokémon Bicho y Planta se mueven al ritmo del viento nublado.',
      '¿Podrás seguir la velocidad de mis alas y aguijones?'
    ],
    dialogueAfter: [
      '¡Qué corte tan limpio y certero!',
      'Has demostrado respeto y destreza en la selva.',
      '¡Te hago entrega de la Medalla Selva y la MT19 Gigadrenado!'
    ],
    team: [
      {
        id: 540, name: 'Sewaddle', types: ['bug', 'grass'], level: 19,
        currentHp: 52, maxHp: 52, attack: 30, defense: 38, speed: 28,
        moves: [
          { id: 'bug_bite', name: 'Picadura', type: 'bug', category: 'physical', power: 60, accuracy: 100, pp: 20, maxPp: 20 },
          { id: 'razor_leaf', name: 'Hoja Afilada', type: 'grass', category: 'physical', power: 55, accuracy: 95, pp: 25, maxPp: 25 },
        ]
      },
      {
        id: 193, name: 'Yanma', types: ['bug', 'flying'], level: 20,
        currentHp: 58, maxHp: 58, attack: 36, defense: 30, speed: 48,
        moves: [
          { id: 'quick_attack', name: 'Ataque Rápido', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 30, maxPp: 30 },
          { id: 'air_cutter', name: 'Aire Afilado', type: 'flying', category: 'special', power: 60, accuracy: 95, pp: 25, maxPp: 25 },
        ]
      },
      {
        id: 123, name: 'Scyther', types: ['bug', 'flying'], level: 22,
        currentHp: 68, maxHp: 68, attack: 56, defense: 42, speed: 54,
        moves: [
          { id: 'wing_attack', name: 'Ataque Ala', type: 'flying', category: 'physical', power: 60, accuracy: 100, pp: 35, maxPp: 35 },
          { id: 'fury_cutter', name: 'Corte Furia', type: 'bug', category: 'physical', power: 40, accuracy: 95, pp: 20, maxPp: 20 },
          { id: 'swords_dance', name: 'Danza Espada', type: 'normal', category: 'status', power: 0, accuracy: 100, pp: 20, maxPp: 20 },
        ]
      }
    ]
  },

  // ─── Campeona de la Liga: Renata ───
  {
    id: 'league_champion_renata',
    name: 'Renata',
    title: 'Campeona de Andara',
    aiTier: 'champion',
    x: 480, y: 120,
    facing: 'DOWN',
    sightRange: 3,
    reward: 15000,
    dialogueBefore: [
      'Has recorrido cada rincón de Andara, desde la costa de Tranquimar hasta las cumbres eternas.',
      'Siento el latido de la tierra en ti y en tus compañeros.',
      'Yo soy Renata, Guardiana de la Cordillera y Campeona de la Liga.',
      '¡Demuéstrame el lazo indomable que te une a tu equipo!'
    ],
    dialogueAfter: [
      'Una sincronía perfecta... las venas de Andara resuenan con tu triunfo.',
      'A partir de hoy, eres el nuevo Campeón de la Región de Andara.',
      '¡Que tu luz guíe a la siguiente generación de entrenadores!'
    ],
    team: [
      {
        id: 823, name: 'Corviknight', types: ['flying', 'steel'], level: 62,
        currentHp: 215, maxHp: 215, attack: 135, defense: 160, speed: 110,
        moves: [
          { id: 'brave_bird', name: 'Pájaro Osado', type: 'flying', category: 'physical', power: 120, accuracy: 100, pp: 15, maxPp: 15 },
          { id: 'iron_head', name: 'Cabeza de Hierro', type: 'steel', category: 'physical', power: 80, accuracy: 100, pp: 15, maxPp: 15 },
          { id: 'roost', name: 'Respiro', type: 'flying', category: 'status', power: 0, accuracy: 100, pp: 10, maxPp: 10 },
        ]
      },
      {
        id: 350, name: 'Milotic', types: ['water'], level: 63,
        currentHp: 210, maxHp: 210, attack: 100, defense: 130, speed: 125,
        moves: [
          { id: 'scald', name: 'Escaldar', type: 'water', category: 'special', power: 80, accuracy: 100, pp: 15, maxPp: 15 },
          { id: 'ice_beam', name: 'Rayo Hielo', type: 'ice', category: 'special', power: 90, accuracy: 100, pp: 10, maxPp: 10 },
          { id: 'recover', name: 'Recuperación', type: 'normal', category: 'status', power: 0, accuracy: 100, pp: 10, maxPp: 10 },
        ]
      },
      {
        id: 637, name: 'Volcarona', types: ['bug', 'fire'], level: 63,
        currentHp: 195, maxHp: 195, attack: 95, defense: 105, speed: 150,
        moves: [
          { id: 'bug_buzz', name: 'Zumbido', type: 'bug', category: 'special', power: 90, accuracy: 100, pp: 10, maxPp: 10 },
          { id: 'fiery_dance', name: 'Danza Llama', type: 'fire', category: 'special', power: 80, accuracy: 100, pp: 10, maxPp: 10 },
          { id: 'quiver_dance', name: 'Danza Aleteo', type: 'bug', category: 'status', power: 0, accuracy: 100, pp: 20, maxPp: 20 },
        ]
      },
      {
        id: 448, name: 'Lucario', types: ['fighting', 'steel'], level: 64,
        currentHp: 185, maxHp: 185, attack: 170, defense: 110, speed: 145,
        moves: [
          { id: 'close_combat', name: 'A Bocajarro', type: 'fighting', category: 'physical', power: 120, accuracy: 100, pp: 5, maxPp: 5 },
          { id: 'meteor_mash', name: 'Puño Meteoro', type: 'steel', category: 'physical', power: 90, accuracy: 90, pp: 10, maxPp: 10 },
          { id: 'extreme_speed', name: 'Velocidad Extrema', type: 'normal', category: 'physical', power: 80, accuracy: 100, pp: 5, maxPp: 5 },
        ]
      },
      {
        id: 282, name: 'Gardevoir', types: ['psychic', 'fairy'], level: 64,
        currentHp: 180, maxHp: 180, attack: 90, defense: 105, speed: 130,
        moves: [
          { id: 'moonblast', name: 'Fuerza Lunar', type: 'fairy', category: 'special', power: 95, accuracy: 100, pp: 15, maxPp: 15 },
          { id: 'psychic', name: 'Psíquico', type: 'psychic', category: 'special', power: 90, accuracy: 100, pp: 10, maxPp: 10 },
          { id: 'calm_mind', name: 'Paz Mental', type: 'psychic', category: 'status', power: 0, accuracy: 100, pp: 20, maxPp: 20 },
        ]
      },
      {
        id: 445, name: 'Garchomp', types: ['dragon', 'ground'], level: 65,
        currentHp: 240, maxHp: 240, attack: 205, defense: 150, speed: 165,
        isMega: true, megaStone: 'Garchompita',
        moves: [
          { id: 'earthquake', name: 'Terremoto', type: 'ground', category: 'physical', power: 100, accuracy: 100, pp: 10, maxPp: 10 },
          { id: 'dragon_claw', name: 'Garra Dragón', type: 'dragon', category: 'physical', power: 80, accuracy: 100, pp: 15, maxPp: 15 },
          { id: 'stone_edge', name: 'Roca Afilada', type: 'rock', category: 'physical', power: 100, accuracy: 80, pp: 5, maxPp: 5 },
          { id: 'swords_dance', name: 'Danza Espada', type: 'normal', category: 'status', power: 0, accuracy: 100, pp: 20, maxPp: 20 },
        ]
      }
    ]
  }
];
