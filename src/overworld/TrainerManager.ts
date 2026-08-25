import * as Phaser from 'phaser';
import { BattlePokemon, BattleMove } from '../core/battle';
import { BattleScene } from '../scenes/BattleScene';

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

  /**
   * Instancia los sprites de una lista de entrenadores definidos para el mapa actual.
   * Los entrenadores ya derrotados se muestran pero no atacan.
   */
  public spawnTrainers(definitions: TrainerDefinition[]): void {
    this.clearTrainers();

    for (const def of definitions) {
      const container = this.scene.add.container(def.x, def.y);
      container.setDepth(8);

      // Sprite placeholder del entrenador
      const body = this.scene.add.graphics();
      body.fillStyle(this.getTierColor(def.aiTier), 1);
      body.fillRect(-12, -22, 24, 38);
      body.fillStyle(0x2c3e50, 1);
      body.fillCircle(0, -30, 10);

      // Nombre flotante encima
      const nameLabel = this.scene.add.text(0, -50, def.name, {
        fontFamily: 'Arial', fontSize: '11px', color: '#f1c40f',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5);

      // Ícono ! (oculto por defecto)
      const exclamation = this.scene.add.text(0, -68, '!', {
        fontFamily: 'Arial', fontSize: '22px', fontStyle: 'bold',
        color: '#e74c3c', stroke: '#2c3e50', strokeThickness: 3,
      }).setOrigin(0.5).setVisible(false);

      container.add([body, nameLabel, exclamation]);

      // Si ya fue derrotado, oscurecer
      if (def.defeated) {
        body.setAlpha(0.5);
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
// MEDALLA CUMBRE (resultado de vencer al Gimnasio Altiplano)
// ─────────────────────────────────────────────────────────────────────────────

export interface GymBadge {
  id: string;
  name: string;
  gymLeaderId: string;
  city: string;
  description: string;
}

export const BADGE_CUMBRE: GymBadge = {
  id: 'badge_cumbre',
  name: 'Medalla Cumbre',
  gymLeaderId: 'gym_altiplano_leader_rocio',
  city: 'Pueblo Altiplano',
  description: 'Otorgada por Rocío, Líder del Gimnasio Altiplano. Prueba la fortaleza ante el tipo Roca.',
};
