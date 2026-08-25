import * as Phaser from 'phaser';
import { QuestManager, QuestNPC } from '../core/quests';
import { DialogueBoxPhaser } from '../ui/DialogueBoxPhaser';
import { MapManager } from '../overworld/MapManager';
import { WarpManager } from '../overworld/WarpManager';
import { InteractionManager } from '../overworld/InteractionManager';
import { PokemonCenter } from '../overworld/PokemonCenter';
import { PokeMartMenu, PlayerWallet } from '../overworld/PokeMartMenu';
import { TrainerManager, TrainerDefinition, GYM_ALTIPLANO_TRAINERS, BADGE_CUMBRE } from '../overworld/TrainerManager';
import { PCStorageUI } from '../overworld/PCStorageUI';
import { TrainerCardUI } from '../ui/TrainerCardUI';
import { SaveLoadUI } from '../ui/SaveLoadUI';
import { DayNightSystem } from '../overworld/DayNightSystem';
import { WeatherSystem } from '../overworld/WeatherSystem';
import { SurfManager } from '../overworld/SurfManager';
import { BattlePokemon } from '../core/battle';
import { SaveData } from '../core/types';

export interface OverworldSceneConfig {
  mapKey: string;
  mapJsonUrl: string;
  tilesetNameInTiled: string;
  tilesetImageKey: string;
  tilesetImageUrl: string;
  playerSpriteKey: string;
  playerSpriteUrl: string;
}

export class OverworldScene extends Phaser.Scene {
  // --- Referencias del Mapa y Capas de Tiled ---
  private map!: Phaser.Tilemaps.Tilemap;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private grassLayer!: Phaser.Tilemaps.TilemapLayer | null;
  private obstaclesLayer!: Phaser.Tilemaps.TilemapLayer;
  private overheadLayer!: Phaser.Tilemaps.TilemapLayer | null;

  // --- Entidad Jugador y Físicas ---
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private zKey!: Phaser.Input.Keyboard.Key;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    SHIFT: Phaser.Input.Keyboard.Key;
  };

  // --- Sistema de Misiones y NPCs ---
  public questManager!: QuestManager;
  private dialogueBox!: DialogueBoxPhaser;
  private npcSprites: { npcData: QuestNPC; sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle }[] = [];
  private readonly INTERACTION_DISTANCE = 48;

  // --- Gestores de Mapa e Interacción (Fase 1) ---
  public mapManager!: MapManager;
  public warpManager!: WarpManager;
  public interactionManager!: InteractionManager;

  // --- Servicios de Pueblo (Fase 3) ---
  public pokemonCenter!: PokemonCenter;
  public pokeMart!: PokeMartMenu;
  public trainerManager!: TrainerManager;

  // --- Sistemas de Gestión y Guardado (Fase 4) ---
  public pcStorage!: PCStorageUI;
  public trainerCard!: TrainerCardUI;
  public saveLoadUI!: SaveLoadUI;

  // --- Sistemas de Mundo Dinámico (Fase 5) ---
  public dayNightSystem!: DayNightSystem;
  public weatherSystem!: WeatherSystem;
  public surfManager!: SurfManager;

  /** Datos de identidad del jugador */
  public playerName: string = 'Red';
  public trainerId: string = '38492';
  public gender: 'male' | 'female' = 'male';
  public playTimeSeconds: number = 0;

  /** Equipo del jugador (se pasa al Centro y BattleScene) */
  public playerParty: BattlePokemon[] = [];

  /** Billetera / inventario del jugador */
  public playerWallet: PlayerWallet = {
    money: 3000,
    inventory: new Map([['poke_ball', 5], ['potion', 3]])
  };

  /** Medallas obtenidas */
  public badges: string[] = [];

  /** Clave del mapa / ciudad actual para el Poké Mart */
  public currentCityKey: string = 'villa_tranquimar';

  // --- Constantes de Movimiento y Encuentros ---
  private readonly WALK_SPEED = 140;
  private readonly RUN_SPEED = 240;
  private readonly ENCOUNTER_PROBABILITY = 0.10;

  // Control de posición en cuadrícula
  private lastTilePosition: { x: number; y: number } = { x: -1, y: -1 };
  private isEncounterTriggered: boolean = false;

  // --- Estado de Salto (Ledge / Desnivel) ---
  private isJumping: boolean = false;
  private currentFacing: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' = 'DOWN';

  constructor() {
    super({ key: 'OverworldScene' });
  }

  /**
   * 1. PRELOAD: Carga del JSON exportado de Tiled, el Tileset y los Sprites.
   */
  preload(): void {
    this.load.tilemapTiledJSON('route1_map', 'assets/maps/route1.json');
    this.load.image('andara_tileset', 'assets/tilesets/andara_tileset.png');
    this.load.spritesheet('player', 'assets/characters/player_walk.png', {
      frameWidth: 32,
      frameHeight: 48
    });
  }

  /**
   * 2. CREATE: Inicialización del Tilemap, Capas, NPCs, Diálogo, Colisiones, Cámara y Controles.
   */
  /**
   * Datos inyectados al cambiar de mapa (desde WarpManager.completeTransition).
   */
  init(data?: { mapKey?: string; spawnX?: number; spawnY?: number; facing?: string }): void {
    this._initData = data || {};
  }
  private _initData: { mapKey?: string; spawnX?: number; spawnY?: number; facing?: string } = {};

  create(): void {
    this.isEncounterTriggered = false;

    // Inicializar gestor de misiones y NPCs
    this.questManager = new QuestManager();

    // --- A. Creación del Tilemap ---
    this.map = this.make.tilemap({ key: 'route1_map' });
    const tileset = this.map.addTilesetImage('Tiled_Tileset_Name', 'andara_tileset');

    if (!tileset) {
      console.warn('Tileset no cargado directamente, generando fallback gráfico.');
    }

    // --- B. Creación de Capas ---
    if (tileset) {
      this.groundLayer = this.map.createLayer('Ground', tileset, 0, 0)!;
      this.grassLayer = this.map.createLayer('TallGrass', tileset, 0, 0);
      this.obstaclesLayer = this.map.createLayer('Obstacles', tileset, 0, 0)!;

      if (this.obstaclesLayer) {
        this.obstaclesLayer.setCollisionByProperty({ collides: true });
      }
    }

    // --- C. Spawn del Jugador ---
    let spawnX = 160;
    let spawnY = 160;
    const spawnPoint = this.map.findObject('SpawnObjects', obj => obj.name === 'PlayerSpawn');
    if (spawnPoint && spawnPoint.x !== undefined && spawnPoint.y !== undefined) {
      spawnX = spawnPoint.x;
      spawnY = spawnPoint.y;
    }

    this.player = this.physics.add.sprite(spawnX, spawnY, 'player', 0);
    this.player.setCollideWorldBounds(true);
    this.player.setSize(20, 16);
    this.player.setOffset(6, 32);

    if (this.obstaclesLayer) {
      this.physics.add.collider(this.player, this.obstaclesLayer);
    }

    // Capa de techos sobre el jugador
    if (tileset) {
      this.overheadLayer = this.map.createLayer('Overhead', tileset, 0, 0);
      if (this.overheadLayer) {
        this.overheadLayer.setDepth(10);
      }
    }

    // --- D. Spawn de NPCs en el Mapa ---
    this.spawnNPCs();

    // --- E. Configuración de Cámara ---
    this.setupCamera();

    // --- F. Animaciones del Jugador ---
    this.createPlayerAnimations();

    // --- G. Registro de Entradas del Teclado ---
    this.setupInputControls();

    // --- H. Cuadro de Diálogo Letra por Letra (Typewriter) ---
    this.dialogueBox = new DialogueBoxPhaser({
      scene: this,
      charDelayMs: 25,
      onLetterTyped: () => {
        // this.sound.play('text_blip', { volume: 0.2 });
      }
    });

    // --- I. WarpManager (Transiciones entre Mapas) ---
    this.warpManager = new WarpManager(this);
    this.warpManager.activateCooldown();
    this.warpManager.fadeIn(400);

    // --- J. InteractionManager (Letreros e Item Balls) ---
    this.interactionManager = new InteractionManager(this, this.dialogueBox);
    if (this.mapManager?.itemBalls) {
      this.interactionManager.spawnItemBalls(this.mapManager.itemBalls);
    }

    // --- K. Servicios de Pueblo (Fase 3) ---
    this.pokemonCenter = new PokemonCenter(this, this.dialogueBox);
    this.pokeMart = new PokeMartMenu(this);
    this.trainerManager = new TrainerManager(this);

    // --- L. Gestión y Guardado (Fase 4) ---
    this.pcStorage = new PCStorageUI(this);
    this.trainerCard = new TrainerCardUI(this);
    this.saveLoadUI = new SaveLoadUI(this);

    // --- M. Mundo Dinámico, Clima y Surf (Fase 5) ---
    this.dayNightSystem = new DayNightSystem(this, 10); // Iniciar a las 10:00 AM
    this.weatherSystem = new WeatherSystem(this, 'CLEAR');
    this.surfManager = new SurfManager(this, this.dialogueBox);

    // Inicializar equipo por defecto si está vacío
    if (this.playerParty.length === 0) {
      this.playerParty = [
        {
          id: 6, name: 'Charizard', types: ['fire', 'flying'], level: 36,
          currentHp: 110, maxHp: 110, attack: 84, defense: 78, spAttack: 109, spDefense: 85, speed: 100,
          moves: [
            { id: 'flamethrower', name: 'Lanzallamas', type: 'fire', category: 'special', power: 90, accuracy: 100, pp: 15, maxPp: 15 },
            { id: 'dragon_claw',  name: 'Garra Dragón', type: 'dragon', category: 'physical', power: 80, accuracy: 100, pp: 15, maxPp: 15 },
            { id: 'air_slash',    name: 'Tajo Aéreo',   type: 'flying', category: 'special', power: 75, accuracy: 95, pp: 15, maxPp: 15 },
            { id: 'slash',        name: 'Cuchillada',   type: 'normal', category: 'physical', power: 70, accuracy: 100, pp: 20, maxPp: 20 },
          ]
        },
        {
          id: 25, name: 'Pikachu', types: ['electric'], level: 12,
          currentHp: 42, maxHp: 42, attack: 30, defense: 22, spAttack: 28, spDefense: 24, speed: 35,
          moves: [
            { id: 'thunderbolt', name: 'Impactrueno', type: 'electric', category: 'special', power: 40, accuracy: 100, pp: 30, maxPp: 30 },
            { id: 'quickattack', name: 'Ataque Rápido', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 30, maxPp: 30, priority: 1 },
          ]
        }
      ];
    }

    // Cargar entrenadores del mapa actual
    const trainersForMap: TrainerDefinition[] = [];
    this.trainerManager.spawnTrainers(trainersForMap);
  }

  /**
   * Instancia los NPCs registrados para este mapa y configura sus hitboxes de colisión.
   */
  private spawnNPCs(): void {
    const npcs = this.questManager.getNPCsForMap('ceibo_lab').concat(
      this.questManager.getNPCsForMap('villa_tranquimar')
    );

    npcs.forEach(npc => {
      const worldX = npc.x * 32 + 16;
      const worldY = npc.y * 32 + 16;

      let npcSprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;

      if (this.textures.exists(npc.spriteKey)) {
        npcSprite = this.add.sprite(worldX, worldY, npc.spriteKey);
      } else {
        // Placeholder visual estilizado para el NPC
        npcSprite = this.add.rectangle(worldX, worldY, 24, 32, 0x9b59b6, 1);
        (npcSprite as Phaser.GameObjects.Rectangle).setStrokeStyle(2, 0x8e44ad);
      }

      // Etiqueta flotante con el nombre del NPC
      const nameTag = this.add.text(worldX, worldY - 26, npc.name, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 4, y: 2 }
      }).setOrigin(0.5);

      this.npcSprites.push({
        npcData: npc,
        sprite: npcSprite
      });
    });
  }

  /**
   * Configura la cámara principal para seguir al jugador suavemente y respetar los límites del mapa.
   */
  private setupCamera(): void {
    const camera = this.cameras.main;
    camera.startFollow(this.player, true, 0.1, 0.1);
    camera.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    camera.setZoom(2.5);
    camera.roundPixels = true;
  }

  /**
   * Inicializa el mapeo de teclas (Flechas, WASD, Shift, Espacio, Enter, Z).
   */
  private setupInputControls(): void {
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      this.zKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

      this.wasdKeys = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        SHIFT: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
      };
    }
  }

  /**
   * 3. UPDATE: Bucle de actualización por frame.
   */
  update(_time: number, delta: number): void {
    if (this.isEncounterTriggered) return;

    // Actualizar tiempo de juego (Fase 4)
    this.playTimeSeconds += delta / 1000;

    // A.1: Si hay alguna UI modal activa (PC, Ficha, Guardado, Tienda), enrutar su input y congelar jugador
    if (this.pcStorage?.visible) {
      this.player.setVelocity(0, 0);
      this.player.anims.stop();
      this.pcStorage.handleInput();
      return;
    }
    if (this.trainerCard?.visible) {
      this.player.setVelocity(0, 0);
      this.player.anims.stop();
      this.trainerCard.handleInput();
      return;
    }
    if (this.saveLoadUI?.visible) {
      this.player.setVelocity(0, 0);
      this.player.anims.stop();
      this.saveLoadUI.handleInput();
      return;
    }
    if (this.pokeMart?.visible) {
      this.player.setVelocity(0, 0);
      this.player.anims.stop();
      this.pokeMart.handleInput();
      return;
    }

    // A.2: Si hay un diálogo activo en pantalla, el movimiento se congela y Espacio avanza el texto
    if (this.dialogueBox && this.dialogueBox.isDialogueActive()) {
      this.player.setVelocity(0, 0);
      this.player.anims.stop();

      if (
        Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
        Phaser.Input.Keyboard.JustDown(this.enterKey) ||
        Phaser.Input.Keyboard.JustDown(this.zKey)
      ) {
        this.dialogueBox.handleSpacePress();
      }
      return;
    }

    // A.3: Teclas rápidas para abrir interfaces (Hotkeys)
    if (this.input.keyboard) {
      // 'C' -> Ficha de Entrenador (Trainer Card)
      if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C))) {
        this.openTrainerCard();
        return;
      }
      // 'P' -> PC de Almacenamiento
      if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P))) {
        this.openPCStorage();
        return;
      }
      // 'G' -> Guardar Partida (Save Screen)
      if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G))) {
        this.openSaveMenu();
        return;
      }
      // 'L' -> Cargar Partida (Load Screen)
      if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L))) {
        this.openLoadMenu();
        return;
      }
    }

    const actionPressed =
      Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
      Phaser.Input.Keyboard.JustDown(this.enterKey) ||
      Phaser.Input.Keyboard.JustDown(this.zKey);

    // B. Resolución de Acción (prioridad descendente)
    if (actionPressed) {
      // B.0: Comprobar Surf frente a agua (Fase 5)
      if (this.groundLayer && this.surfManager) {
        const surfStarted = this.surfManager.tryStartSurf(
          this.player, this.map, this.groundLayer, this.currentFacing
        );
        if (surfStarted) return;
      }

      // B.1: Item Ball cercana
      const pickedUp = this.interactionManager?.tryPickupItemBall(
        this.player.x, this.player.y,
        (itemName, qty) => {
          const qStr = qty > 1 ? `x${qty} ` : '';
          this.dialogueBox.startDialogue('📦 Objeto', [`¡${this.player.name ?? 'Encontraste'} ${qStr}${itemName}!`]);
        }
      );
      if (pickedUp) return;

      // B.2: Letrero cercano
      const signRead = this.interactionManager?.tryInteractWithSignpost(
        this.player.x, this.player.y,
        this.mapManager?.signposts ?? []
      );
      if (signRead) return;

      // B.3: NPC cercano
      const npcInteracted = this.tryInteractWithNearbyNPC();
      if (npcInteracted) return;
    }

    // C. Warps (comprobación pasiva por pisada — sin pulsar botón)
    if (this.warpManager && this.mapManager?.warps) {
      this.warpManager.checkAndTrigger(
        this.player.x,
        this.player.y,
        this.mapManager.warps,
        (result) => {
          this.isEncounterTriggered = true;
          this.player.setVelocity(0, 0);
          this.scene.restart({
            mapKey: result.targetMapKey,
            spawnX: result.targetX,
            spawnY: result.targetY,
            facing: result.facingDirection
          });
        }
      );
    }

    // F. Entrenadores (comprobación pasiva por visión, sin necesidad de pulsar botón)
    if (!this.trainerManager?.hasActiveBattle && !this.isJumping) {
      this.trainerManager?.update(
        this.player.x, this.player.y,
        this.map?.tileWidth ?? 32,
        (trainerDef) => {
          // El entrenador llegó al jugador: iniciar diálogo de desafío
          this.isEncounterTriggered = true;
          this.player.setVelocity(0, 0);

          this.dialogueBox.startDialogue(trainerDef.name, trainerDef.dialogueBefore, () => {
            // Iniciar BattleScene con el primer Pokémon del equipo del entrenador
            this.scene.launch('BattleScene', {
              playerPokemon: this.playerParty[0],
              playerParty:   this.playerParty,
              opponentPokemon: trainerDef.team[0],
              encounterType: 'trainer',
            });
            this.scene.pause();

            // Escuchar el fin del combate
            this.scene.get('BattleScene').events.once('battleEnd', (won: boolean) => {
              this.scene.resume();
              this.isEncounterTriggered = false;

              if (won) {
                this.trainerManager.markDefeated(trainerDef.id);
                // Diálogo post-combate + recompensas
                this.playerWallet.money += trainerDef.reward;
                const afterLines = [
                  ...trainerDef.dialogueAfter,
                  `¡Recibiste ${trainerDef.reward.toLocaleString()} ¥!`
                ];
                // Si es el Líder de Gimnasio, otorgar medalla
                if (trainerDef.aiTier === 'gym_leader') {
                  const badge = BADGE_CUMBRE;
                  if (!this.badges.includes(badge.id)) {
                    this.badges.push(badge.id);
                    afterLines.push(`¡Has recibido la ${badge.name}!`);
                  }
                }
                this.dialogueBox.startDialogue(trainerDef.name, afterLines);
              } else {
                this.trainerManager.releaseLock();
                this.dialogueBox.startDialogue('Sistema', ['¡Tu equipo fue derrotado!', 'Has vuelto al último Centro Pokémon visitado.']);
              }
            });
          });
        },
        this.game.loop.delta
      );
    }

    // G. Hints de proximidad de Item Balls
    this.interactionManager?.updateProximityHints(this.player.x, this.player.y);

    // H. Actualizaciones de Sistemas de Mundo Dinámico (Fase 5)
    this.dayNightSystem?.update(delta, this.player.x, this.player.y);
    this.weatherSystem?.update(delta);
    this.surfManager?.update(this.player.x, this.player.y, delta);

    // I. Movimiento del Jugador y Encuentros en Césped / Agua
    this.handlePlayerMovement();
    this.checkTallGrassEncounter();
  }

  /**
   * Detecta si hay un NPC frente al jugador o en un radio cercano de interacción.
   */
  private tryInteractWithNearbyNPC(): boolean {
    const playerX = this.player.x;
    const playerY = this.player.y;

    for (const item of this.npcSprites) {
      const npc = item.npcData;
      const distance = Phaser.Math.Distance.Between(playerX, playerY, item.sprite.x, item.sprite.y);

      if (distance <= this.INTERACTION_DISTANCE) {
        this.startNPCDialogue(npc);
        return true;
      }
    }

    return false;
  }

  /**
   * Inicia el diálogo letra por letra con el NPC y gestiona la transición de estados de la misión.
   */
  public startNPCDialogue(npc: QuestNPC): void {
    // 1. Obtener diálogos correspondientes al estado actual del NPC
    const sentences = this.questManager.getDialoguesForNPC(npc.id);

    // 2. Detener jugador
    this.player.setVelocity(0, 0);
    this.player.anims.stop();

    // 3. Abrir cuadro de diálogo letra por letra
    this.dialogueBox.startDialogue(npc.name, sentences, () => {
      // 4. Callback al finalizar todas las frases: Avanza estado y entrega recompensas
      const { newState, rewardClaimed } = this.questManager.advanceNPCState(npc.id);
      console.log(`[Quest] NPC '${npc.name}' avanzó a estado: ${newState}`);

      if (rewardClaimed && (rewardClaimed.money || rewardClaimed.items)) {
        // Diálogo breve de confirmación de recompensas
        let rewardText = '¡Has recibido: ';
        if (rewardClaimed.money) rewardText += `$${rewardClaimed.money} `;
        if (rewardClaimed.items) {
          rewardText += rewardClaimed.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
        }
        rewardText += '!';

        this.dialogueBox.startDialogue('Sistema', [rewardText]);
      }
    });
  }

  /**
   * Gestiona el movimiento en 4 direcciones y comprueba desniveles de salto (Ledge).
   */
  private handlePlayerMovement(): void {
    // Bloquear movimiento durante el salto
    if (this.isJumping) {
      this.player.setVelocity(0, 0);
      return;
    }

    const isSurfing = this.surfManager?.surfing ?? false;
    const isRunning = (this.cursors?.shift.isDown || this.wasdKeys?.SHIFT.isDown) && !isSurfing;
    const speed = isSurfing ? this.surfManager.SURF_SPEED : (isRunning ? this.RUN_SPEED : this.WALK_SPEED);

    let vx = 0;
    let vy = 0;

    const isLeft  = this.cursors?.left.isDown  || this.wasdKeys?.A.isDown;
    const isRight = this.cursors?.right.isDown || this.wasdKeys?.D.isDown;
    const isUp    = this.cursors?.up.isDown    || this.wasdKeys?.W.isDown;
    const isDown  = this.cursors?.down.isDown  || this.wasdKeys?.S.isDown;

    if (isLeft)       { vx = -speed; this.currentFacing = 'LEFT';  }
    else if (isRight) { vx =  speed; this.currentFacing = 'RIGHT'; }
    if (isUp)         { vy = -speed; this.currentFacing = 'UP';    }
    else if (isDown)  { vy =  speed; this.currentFacing = 'DOWN';  }

    if (vx !== 0 && vy !== 0) { vx *= 0.7071; vy *= 0.7071; }

    // --- Comprobación de Desembarque de Surf ---
    if (isSurfing && this.groundLayer && (vx !== 0 || vy !== 0)) {
      const dismounted = this.surfManager.tryDismount(
        this.player, this.map, this.groundLayer, this.currentFacing
      );
      if (dismounted) return;
    }

    // --- Comprobación de Ledge antes de aplicar velocidad ---
    if (!isSurfing && this.mapManager && (vx !== 0 || vy !== 0)) {
      const tileSize  = this.map?.tileWidth ?? 32;
      // Proyectamos 1 tile en la dirección actual para ver si hay un desnivel
      const lookAheadX = this.player.x + (vx > 0 ? tileSize : vx < 0 ? -tileSize : 0);
      const lookAheadY = this.player.y + (vy > 0 ? tileSize : vy < 0 ? -tileSize : 0);
      const tileX = this.map.worldToTileX(lookAheadX) ?? -1;
      const tileY = this.map.worldToTileY(lookAheadY) ?? -1;

      const ledge = this.mapManager.getLedgeAt(tileX, tileY);
      if (ledge && ledge.jumpDirection === this.currentFacing) {
        this.performLedgeJump(ledge.jumpDirection);
        return;
      }
    }

    this.player.setVelocity(vx, vy);

    if (vx < 0)      { this.player.anims.play('walk_left',  true); }
    else if (vx > 0) { this.player.anims.play('walk_right', true); }
    else if (vy < 0) { this.player.anims.play('walk_up',    true); }
    else if (vy > 0) { this.player.anims.play('walk_down',  true); }
    else             { this.player.anims.stop(); }
  }

  /**
   * Ejecuta el salto parabólico de desnivel (Ledge Jump).
   * El jugador salta 2 casillas hacia adelante con un arco visual usando dos Tweens encadenados.
   * La colisión se desactiva durante el salto para que pueda atravesar el borde.
   */
  private performLedgeJump(direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'): void {
    if (this.isJumping) return;
    this.isJumping = true;

    const tileSize = this.map?.tileWidth ?? 32;
    const jumpTiles = 2;

    // Calcular el destino final del salto (2 casillas en la dirección del ledge)
    const deltaX = direction === 'LEFT' ? -(tileSize * jumpTiles) : direction === 'RIGHT' ? (tileSize * jumpTiles) : 0;
    const deltaY = direction === 'DOWN' ? (tileSize * jumpTiles)  : direction === 'UP'   ? -(tileSize * jumpTiles) : 0;

    const targetX = this.player.x + deltaX;
    const targetY = this.player.y + deltaY;

    // Arco parabólico con dos tweens encadenados (subida + bajada)
    const arcHeight = 24; // Altura máxima del arco en píxeles

    this.player.setVelocity(0, 0);
    if (this.player.body) (this.player.body as Phaser.Physics.Arcade.Body).setEnable(false);

    // Animación de salto (se congela en el frame de caminata hacia abajo)
    this.player.anims.play('walk_down', true);

    // Fase 1: Subir al punto medio del arco
    this.tweens.add({
      targets: this.player,
      x: this.player.x + deltaX / 2,
      y: this.player.y + deltaY / 2 - arcHeight,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => {
        // Fase 2: Bajar al destino final
        this.tweens.add({
          targets: this.player,
          x: targetX,
          y: targetY,
          duration: 180,
          ease: 'Quad.easeIn',
          onComplete: () => {
            // Reactivar física y desbloquear movimiento
            if (this.player.body) (this.player.body as Phaser.Physics.Arcade.Body).setEnable(true);
            this.isJumping = false;
            this.player.anims.stop();
          }
        });
      }
    });
  }

  /**
   * Detección de césped alto y tirada del 10%.
   */
  private checkTallGrassEncounter(): void {
    const currentTileX = this.map.worldToTileX(this.player.x);
    const currentTileY = this.map.worldToTileY(this.player.y + 16);

    if (currentTileX === null || currentTileY === null) return;

    const hasMovedToNewTile =
      currentTileX !== this.lastTilePosition.x || currentTileY !== this.lastTilePosition.y;

    if (!hasMovedToNewTile) return;
    this.lastTilePosition = { x: currentTileX, y: currentTileY };

    const isMoving = this.player.body ? this.player.body.velocity.length() > 0 : false;
    if (!isMoving) return;

    // Comprobación en agua (Surf)
    if (this.surfManager?.surfing) {
      if (this.surfManager.checkWaterEncounter()) {
        const waterPkmn = this.surfManager.waterEncounters[
          Phaser.Math.Between(0, this.surfManager.waterEncounters.length - 1)
        ];
        this.triggerWildBattleEncounter({
          id: waterPkmn.id,
          name: waterPkmn.name,
          types: ['water'],
          level: Phaser.Math.Between(waterPkmn.levelRange[0], waterPkmn.levelRange[1]),
          currentHp: 35,
          maxHp: 35,
          attack: 20,
          defense: 25,
          speed: 28,
          moves: [
            { id: 'watergun', name: 'Pistola Agua', type: 'water', category: 'special', power: 40, accuracy: 100, pp: 25, maxPp: 25 },
            { id: 'tackle',   name: 'Placaje',      type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 35, maxPp: 35 },
          ]
        });
      }
      return;
    }

    let isStandingOnGrass = false;
    if (this.grassLayer) {
      const grassTile = this.grassLayer.getTileAt(currentTileX, currentTileY);
      if (grassTile && grassTile.index !== -1) {
        isStandingOnGrass = true;
      }
    }

    if (isStandingOnGrass) {
      const roll = Math.random();
      if (roll < this.ENCOUNTER_PROBABILITY) {
        this.triggerWildBattleEncounter();
      }
    }
  }

  private triggerWildBattleEncounter(customOpponent?: BattlePokemon): void {
    this.isEncounterTriggered = true;
    this.player.setVelocity(0, 0);
    this.player.anims.stop();

    const cam = this.cameras.main;
    cam.flash(300, 255, 255, 255, false, (_camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress === 1) {
        cam.fade(500, 0, 0, 0, false, (_cam2: Phaser.Cameras.Scene2D.Camera, fadeProgress: number) => {
          if (fadeProgress === 1) {
            this.scene.start('BattleScene', {
              playerPokemon: this.playerParty[0],
              playerParty: this.playerParty,
              opponentPokemon: customOpponent,
              encounterType: 'wild',
              mapName: this._initData.mapKey || 'Route1',
              weather: this.weatherSystem?.currentWeather ?? 'CLEAR'
            });
          }
        });
      }
    });
  }

  private createPlayerAnimations(): void {
    if (this.anims.exists('walk_down')) return;

    this.anims.create({
      key: 'walk_down',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });

    this.anims.create({
      key: 'walk_left',
      frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
      frameRate: 8,
      repeat: -1
    });

    this.anims.create({
      key: 'walk_right',
      frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11 }),
      frameRate: 8,
      repeat: -1
    });

    this.anims.create({
      key: 'walk_up',
      frames: this.anims.generateFrameNumbers('player', { start: 12, end: 15 }),
      frameRate: 8,
      repeat: -1
    });
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // MÉTODOS DE FASE 4: APERTURA DE INTERFACES Y GUARDADO
  // ──────────────────────────────────────────────────────────────────────────────

  /**
   * Abre la Ficha de Entrenador (TrainerCardUI).
   */
  public openTrainerCard(): void {
    if (!this.trainerCard) return;
    this.player.setVelocity(0, 0);
    this.player.anims.stop();

    this.trainerCard.open({
      playerName: this.playerName,
      trainerId: this.trainerId,
      gender: this.gender,
      money: this.playerWallet.money,
      playTimeSeconds: Math.floor(this.playTimeSeconds),
      pokedexSeen: 34,
      pokedexCaught: 12,
      badges: [...this.badges],
    });
  }

  /**
   * Abre el PC de Almacenamiento (PCStorageUI).
   */
  public openPCStorage(): void {
    if (!this.pcStorage) return;
    this.player.setVelocity(0, 0);
    this.player.anims.stop();

    this.pcStorage.open(this.playerParty);
  }

  /**
   * Abre la pantalla de Guardar Partida (SaveLoadUI en modo SAVE).
   */
  public openSaveMenu(): void {
    if (!this.saveLoadUI) return;
    this.player.setVelocity(0, 0);
    this.player.anims.stop();

    this.saveLoadUI.openSave(() => this.generateSaveData());
  }

  /**
   * Abre la pantalla de Cargar Partida (SaveLoadUI en modo LOAD).
   */
  public openLoadMenu(): void {
    if (!this.saveLoadUI) return;
    this.player.setVelocity(0, 0);
    this.player.anims.stop();

    this.saveLoadUI.openLoad((loadedData) => this.applyLoadedSaveData(loadedData));
  }

  /**
   * Genera el snapshot completo de SaveData con el estado actual del juego.
   */
  public generateSaveData(slotName: string = 'save_slot_1'): SaveData {
    const inventoryRecord: Record<string, number> = {};
    this.playerWallet.inventory.forEach((qty, id) => {
      inventoryRecord[id] = qty;
    });

    return {
      slot: slotName,
      player_name: this.playerName,
      gender: this.gender,
      badges: [...this.badges],
      money: this.playerWallet.money,
      current_map: this._initData.mapKey || 'route1_map',
      player_x: Math.floor(this.player.x),
      player_y: Math.floor(this.player.y),
      player_facing: this.currentFacing,
      party: this.playerParty.map(p => ({
        species_id: typeof p.id === 'number' ? p.id : 25,
        species_name: p.name,
        types: p.types,
        level: p.level,
        current_hp: p.currentHp,
        max_hp: p.maxHp,
        base_stats: { hp: p.maxHp, attack: p.attack, defense: p.defense, special_attack: p.spAttack || p.attack, special_defense: p.spDefense || p.defense, speed: p.speed },
        stats: { hp: p.maxHp, attack: p.attack, defense: p.defense, special_attack: p.spAttack || p.attack, special_defense: p.spDefense || p.defense, speed: p.speed },
        ivs: { hp: 31, attack: 31, defense: 31, special_attack: 31, special_defense: 31, speed: 31 },
        evs: { hp: 0, attack: 0, defense: 0, special_attack: 0, special_defense: 0, speed: 0 },
        base_nature: 'hardy',
        effective_nature: 'hardy',
        status: null,
        moves: p.moves.map(m => ({
          id: m.id,
          name: m.name,
          current_pp: m.pp,
          max_pp: m.maxPp || m.pp,
          data: { name: m.name, type: m.type, category: m.category, power: m.power, accuracy: m.accuracy, pp: m.pp }
        })),
        held_item: null
      })),
      pc_boxes: this.pcStorage ? (this.pcStorage.exportBoxes() as any) : [],
      inventory: inventoryRecord,
      story_flags: {},
      pokedex_seen: [25, 7, 74, 95, 111],
      pokedex_caught: [25],
      play_time_seconds: Math.floor(this.playTimeSeconds),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Restaura el estado del juego tras cargar una partida.
   */
  public applyLoadedSaveData(data: SaveData): void {
    this.playerName = data.player_name || this.playerName;
    this.gender = data.gender || this.gender;
    this.badges = data.badges || [];
    this.playerWallet.money = data.money ?? this.playerWallet.money;
    this.playTimeSeconds = data.play_time_seconds ?? 0;

    // Restaurar inventario
    if (data.inventory) {
      this.playerWallet.inventory.clear();
      Object.entries(data.inventory).forEach(([id, qty]) => {
        this.playerWallet.inventory.set(id, qty);
      });
    }

    // Restaurar equipo
    if (data.party && data.party.length > 0) {
      this.playerParty = data.party.map(p => ({
        id: p.species_id,
        name: p.species_name,
        types: p.types,
        level: p.level,
        currentHp: p.current_hp,
        maxHp: p.max_hp,
        attack: p.stats.attack,
        defense: p.stats.defense,
        spAttack: p.stats.special_attack,
        spDefense: p.stats.special_defense,
        speed: p.stats.speed,
        moves: p.moves.map(m => ({
          id: m.id,
          name: m.name,
          type: m.data.type,
          category: m.data.category,
          power: m.data.power || 40,
          accuracy: m.data.accuracy || 100,
          pp: m.current_pp,
          maxPp: m.max_pp
        }))
      }));
    }

    // Posicionar jugador en el mapa guardado
    if (data.player_x && data.player_y) {
      this.player.setPosition(data.player_x, data.player_y);
    }

    this.dialogueBox.startDialogue('Sistema', [
      `¡Bienvenido de nuevo, ${this.playerName}!`,
      'La partida se ha cargado correctamente.'
    ]);
  }
}

