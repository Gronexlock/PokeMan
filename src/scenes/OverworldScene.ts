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
import { AudioManager, BgmTrackKey } from '../audio';

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
  // --- Referencias del Mapa y Capas ---
  private mapWidthPx: number = 640;
  private mapHeightPx: number = 480;
  private currentCollisionMatrix: number[][] = [];
  private obstaclesGroup!: Phaser.Physics.Arcade.StaticGroup;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer | null;
  private grassLayer!: Phaser.Tilemaps.TilemapLayer | null;
  private obstaclesLayer!: Phaser.Tilemaps.TilemapLayer | null;
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
  public trainerId: string = '38492';
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
   * 1. PRELOAD: Carga de datos de mapas, tilesets GBA, casas, árboles y spritesheets de personajes.
   */
  preload(): void {
    // 1. Datos
    this.load.json('maps_data', '/data/maps_data.json');

    // 2. Personajes y NPCs (spritesheets de 512x512 = 4x4 frames de 128x128)
    this.load.spritesheet('player', '/assets/sprites/gba/characters/player.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('player_female', '/assets/sprites/gba/characters/hat_girl.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('npc_professor', '/assets/sprites/gba/characters/professor.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('npc_rival', '/assets/sprites/gba/characters/rival.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('npc_leader_rocio', '/assets/sprites/gba/characters/gym_leader_rocio.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('npc_leader_thiago', '/assets/sprites/gba/characters/gym_leader_thiago.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('npc_champion_renata', '/assets/sprites/gba/characters/champion_renata.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('npc_elite_inti', '/assets/sprites/gba/characters/elite_inti.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('npc_elite_marina', '/assets/sprites/gba/characters/elite_marina.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('npc_young_guy', '/assets/sprites/gba/characters/young_guy.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('npc_fisherman', '/assets/sprites/gba/characters/npc_fisherman.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('npc_young_girl', '/assets/sprites/gba/characters/young_girl.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('npc_hat_girl', '/assets/sprites/gba/characters/hat_girl.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('npc_blond', '/assets/sprites/gba/characters/blond.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('npc_purple_girl', '/assets/sprites/gba/characters/purple_girl.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('npc_bugcatcher', '/assets/sprites/gba/characters/npc_bugcatcher.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('npc_hiker', '/assets/sprites/gba/characters/npc_hiker.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('npc_swimmer', '/assets/sprites/gba/characters/npc_swimmer.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('npc_medium', '/assets/sprites/gba/characters/npc_medium.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('npc_lass', '/assets/sprites/gba/characters/npc_lass.png', { frameWidth: 128, frameHeight: 128 });

    // 2.5 Retratos y Sprites Auténticos de Entrenadores (Showdown)
    this.load.image('trainer_professor', '/assets/sprites/gba/trainers/trainer_professor.png');
    this.load.image('trainer_player_boy', '/assets/sprites/gba/trainers/trainer_player_boy.png');
    this.load.image('trainer_player_girl', '/assets/sprites/gba/trainers/trainer_player_girl.png');
    this.load.image('trainer_rival', '/assets/sprites/gba/trainers/trainer_rival.png');
    this.load.image('trainer_gym_rocio', '/assets/sprites/gba/trainers/trainer_gym_rocio.png');
    this.load.image('trainer_gym_thiago', '/assets/sprites/gba/trainers/trainer_gym_thiago.png');
    this.load.image('trainer_champion_renata', '/assets/sprites/gba/trainers/trainer_champion_renata.png');
    this.load.image('trainer_elite_inti', '/assets/sprites/gba/trainers/trainer_elite_inti.png');
    this.load.image('trainer_elite_marina', '/assets/sprites/gba/trainers/trainer_elite_marina.png');
    this.load.image('trainer_bugcatcher', '/assets/sprites/gba/trainers/trainer_bugcatcher.png');
    this.load.image('trainer_youngster', '/assets/sprites/gba/trainers/trainer_youngster.png');
    this.load.image('trainer_lass', '/assets/sprites/gba/trainers/trainer_lass.png');
    this.load.image('trainer_hiker', '/assets/sprites/gba/trainers/trainer_hiker.png');
    this.load.image('trainer_swimmer', '/assets/sprites/gba/trainers/trainer_swimmer.png');
    this.load.image('trainer_fisherman', '/assets/sprites/gba/trainers/trainer_fisherman.png');
    this.load.image('trainer_medium', '/assets/sprites/gba/trainers/trainer_medium.png');
    this.load.image('trainer_nurse', '/assets/sprites/gba/trainers/trainer_nurse.png');
    this.load.image('trainer_clerk', '/assets/sprites/gba/trainers/trainer_clerk.png');

    // 2.6 Retratos HD Oficiales estilo Ken Sugimori
    this.load.image('prof_ceibo_hd', '/assets/sprites/characters/hd/prof_ceibo.jpg');
    this.load.image('player_boy_hd', '/assets/sprites/characters/hd/player_boy.jpg');
    this.load.image('player_girl_hd', '/assets/sprites/characters/hd/player_girl.jpg');
    this.load.image('rival_nahuel_hd', '/assets/sprites/characters/hd/rival_nahuel.jpg');
    this.load.image('gym_rocio_hd', '/assets/sprites/characters/hd/gym_rocio.jpg');

    // 3. Estructuras, Árboles y Objetos GBA
    this.load.image('house_small', '/assets/sprites/gba/objects/house_small.png');
    this.load.image('house_small_alt', '/assets/sprites/gba/objects/house_small_alt.png');
    this.load.image('house_large', '/assets/sprites/gba/objects/house_large.png');
    this.load.image('hospital', '/assets/sprites/gba/objects/hospital.png');
    this.load.image('tree_green', '/assets/sprites/gba/objects/green_tree.png');
    this.load.image('tree_bushy', '/assets/sprites/gba/objects/green_tree_bushy.png');
    this.load.image('tree_small', '/assets/sprites/gba/objects/green_tree_small.png');
    this.load.image('grass_tile', '/assets/sprites/gba/objects/grass.png');
    this.load.image('grass_rock', '/assets/sprites/gba/objects/grassrock1.png');

    // 4. Tilesets y Aguas
    this.load.image('world_tileset', '/assets/sprites/gba/tilesets/world.png');
    this.load.image('coast_tileset', '/assets/sprites/gba/tilesets/coast.png');
    this.load.image('water_0', '/assets/sprites/gba/tilesets/water/0.png');
    this.load.image('water_1', '/assets/sprites/gba/tilesets/water/1.png');
    this.load.image('water_2', '/assets/sprites/gba/tilesets/water/2.png');
    this.load.image('water_3', '/assets/sprites/gba/tilesets/water/3.png');
  }

  /**
   * 2. CREATE: Inicialización del Mundo, Capas, NPCs, Diálogo, Colisiones, Cámara y Controles.
   */
  public playerName: string = 'Alex';
  public gender: 'boy' | 'girl' | 'male' | 'female' = 'boy';
  public playerGender: string = 'boy';
  public playerSpriteKey: string = 'player';
  public map!: Phaser.Tilemaps.Tilemap;

  init(data?: { mapKey?: string; spawnX?: number; spawnY?: number; facing?: string; playerName?: string; gender?: string; spriteKey?: string }): void {
    this._initData = data || {};
    if (data?.playerName) this.playerName = data.playerName;
    if (data?.gender) {
      this.playerGender = data.gender;
      this.gender = data.gender as any;
    }
    if (data?.spriteKey) this.playerSpriteKey = data.spriteKey;
  }
  private _initData: { mapKey?: string; spawnX?: number; spawnY?: number; facing?: string; playerName?: string; gender?: string; spriteKey?: string } = {};

  create(): void {
    this.isEncounterTriggered = false;

    // Inicializar gestor de misiones y NPCs
    this.questManager = new QuestManager();

    // --- A. Cargar datos del mapa actual ---
    const mapsJson = this.cache.json.get('maps_data')?.maps || {};
    const activeMap = this._initData.mapKey || 'villa_tranquimar';
    const mapDef = mapsJson[activeMap] || mapsJson['villa_tranquimar'] || {
      id: 'villa_tranquimar',
      display_name: 'Villa Tranquimar',
      width: 20,
      height: 15,
      biome: 'coastal_town',
      collision_matrix: [
        [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,1],
        [1,0,1,1,1,0,1,0,0,0,0,0,0,1,0,1,1,1,0,1],
        [1,0,1,5,1,0,0,0,0,0,0,0,0,0,0,1,5,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,1,1,1,1,0,0,0,0,1,1,1,1,0,0,0,1],
        [1,0,0,0,1,1,5,1,0,0,0,0,1,1,1,1,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [3,3,3,3,3,3,3,3,3,0,0,3,3,3,3,3,3,3,3,3],
        [3,3,3,3,3,3,3,3,3,0,0,3,3,3,3,3,3,3,3,3],
        [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3]
      ]
    };

    const matrix: number[][] = mapDef.collision_matrix;
    this.currentCollisionMatrix = matrix;
    const mapRows = matrix.length;
    const mapCols = mapRows > 0 ? matrix[0].length : 20;
    const tileSize = 32;
    this.mapWidthPx = mapCols * tileSize;
    this.mapHeightPx = mapRows * tileSize;

    // --- B. Renderizar Terreno de Overworld ---
    this.renderOverworldTerrain(mapDef, matrix, mapCols, mapRows, tileSize);

    // --- C. Spawn del Jugador y Físicas ---
    const spawnX = this._initData.spawnX || 300;
    const spawnY = this._initData.spawnY || 240;
    const activeSpriteKey = this.playerSpriteKey || (this.playerGender === 'girl' ? 'player_female' : 'player');

    this.player = this.physics.add.sprite(spawnX, spawnY, activeSpriteKey, 0);
    this.player.setDisplaySize(36, 36);
    this.player.setCollideWorldBounds(true);
    if (this.player.body) {
      this.player.body.setSize(60, 60);
      this.player.body.setOffset(34, 60);
    }
    this.player.setDepth(10);

    if (this.obstaclesGroup) {
      this.physics.add.collider(this.player, this.obstaclesGroup);
    }

    // --- D. Inicialización de MapManager y Metadatos ---
    this.mapManager = new MapManager(this);
    this.currentCityKey = activeMap;

    if (mapDef.warps && Array.isArray(mapDef.warps)) {
      this.mapManager.warps = mapDef.warps.map((w: any) => ({
        id: w.id || `warp_${w.x}_${w.y}`,
        x: (w.x ?? 0) * tileSize + tileSize / 2,
        y: (w.y ?? 0) * tileSize + tileSize / 2,
        width: tileSize,
        height: tileSize,
        targetMapKey: w.target_map_key || w.targetMapKey || 'villa_tranquimar',
        targetX: (w.target_x ?? w.targetX ?? 5) * tileSize + 16,
        targetY: (w.target_y ?? w.targetY ?? 5) * tileSize + 16,
        facingDirection: w.facing_direction || w.facingDirection || 'DOWN',
        transitionType: w.transition_type || 'door_fade'
      }));
    }

    if (mapDef.signposts && Array.isArray(mapDef.signposts)) {
      this.mapManager.signposts = mapDef.signposts.map((s: any) => ({
        id: s.id || `sign_${s.x}_${s.y}`,
        x: (s.x ?? 0) * tileSize + tileSize / 2,
        y: (s.y ?? 0) * tileSize + tileSize / 2,
        title: s.title || 'Letrero',
        text: s.text || ''
      }));
    }

    if (mapDef.item_balls && Array.isArray(mapDef.item_balls)) {
      this.mapManager.itemBalls = mapDef.item_balls.map((ib: any) => ({
        id: ib.id || `item_${ib.x}_${ib.y}`,
        x: (ib.x ?? 0) * tileSize + 16,
        y: (ib.y ?? 0) * tileSize + 16,
        itemId: ib.item_id || ib.itemId || 'potion',
        itemName: ib.item_name || ib.itemName || 'Poción',
        quantity: ib.quantity || 1
      }));
    }

    if (mapDef.ledges && Array.isArray(mapDef.ledges)) {
      this.mapManager.ledges = new Map();
      mapDef.ledges.forEach((l: any) => {
        const tx = l.tile_x ?? l.tileX ?? 0;
        const ty = l.tile_y ?? l.tileY ?? 0;
        this.mapManager.ledges.set(`${tx},${ty}`, {
          tileX: tx,
          tileY: ty,
          jumpDirection: l.jump_direction ?? l.jumpDirection ?? 'DOWN'
        });
      });
    }

    // --- E. Spawn de NPCs en el Mapa ---
    this.spawnNPCs();

    // --- F. Configuración de Cámara ---
    this.setupCamera();

    // --- G. Animaciones del Jugador ---
    this.createPlayerAnimations();

    // --- H. Registro de Entradas del Teclado ---
    this.setupInputControls();

    // --- I. Cuadro de Diálogo Letra por Letra (Typewriter) ---
    this.dialogueBox = new DialogueBoxPhaser({
      scene: this,
      charDelayMs: 25,
      onLetterTyped: () => {
        AudioManager.getInstance().playSfx('typewriter');
      }
    });

    // 7.1 — Iniciar BGM ambiental según mapa
    AudioManager.getInstance().playBgm(this.getMapBgmKey(activeMap));

    // --- J. WarpManager (Transiciones entre Mapas) ---
    this.warpManager = new WarpManager(this);
    this.warpManager.activateCooldown();
    this.warpManager.fadeIn(400);

    // --- K. InteractionManager (Letreros e Item Balls) ---
    this.interactionManager = new InteractionManager(this, this.dialogueBox);
    if (this.mapManager.itemBalls.length > 0) {
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
   * Renderiza el terreno base, caminos, agua animada, hierba alta y edificios con gráficos GBA pixel-art.
   */
  private renderOverworldTerrain(mapDef: any, matrix: number[][], cols: number, rows: number, ts: number): void {
    const bg = this.add.graphics();
    bg.setDepth(1);

    const isIndoor = mapDef.biome === 'indoor';
    const isCoast = mapDef.biome === 'coastal_town' || mapDef.id === 'villa_tranquimar';

    // 1. Suelo Base
    if (isIndoor) {
      bg.fillStyle(0xdfd2ba, 1);
      bg.fillRect(0, 0, cols * ts, rows * ts);
    } else {
      bg.fillStyle(0x4fa43e, 1);
      bg.fillRect(0, 0, cols * ts, rows * ts);
    }

    // Grupo estático de obstáculos para física de colisión
    this.obstaclesGroup = this.physics.add.staticGroup();

    // 2. Capa de Suelos, Senderos y Agua
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * ts;
        const y = r * ts;
        const val = matrix[r][c];

        if (isIndoor) {
          bg.lineStyle(1, 0xc6b69b, 0.4);
          bg.strokeRect(x, y, ts, ts);
          continue;
        }

        // Sendero de tierra continuo (código 0)
        if (val === 0) {
          const pathColor = isCoast ? 0xe5d3a5 : 0x8d6e63;
          bg.fillStyle(pathColor, 0.85);
          bg.fillRoundedRect(x + 1, y + 1, ts - 2, ts - 2, 4);

          // Detalles de piedritas y textura
          if ((c * 7 + r * 13) % 4 === 0) {
            bg.fillStyle(0x78553d, 0.35);
            bg.fillRect(x + 8, y + 10, 4, 3);
            bg.fillRect(x + 20, y + 22, 3, 2);
          }
        }

        // Playa / Arena costera
        if (isCoast && r === 11 && val !== 3) {
          bg.fillStyle(0xf0dfb6, 0.95);
          bg.fillRect(x, y + ts - 12, ts, 12);
          bg.fillStyle(0xffffff, 0.7);
          bg.fillRect(x, y + ts - 4, ts, 4);
        }

        // Hierba alta (código 2) con sprite de hierba GBA
        if (val === 2) {
          bg.fillStyle(0x3f8c32, 1);
          bg.fillRect(x, y, ts, ts);
          if (this.textures.exists('grass_tile')) {
            const gt = this.add.image(x + ts / 2, y + ts / 2, 'grass_tile');
            gt.setDisplaySize(32, 32);
            gt.setDepth(3);
          }
        }

        // Agua profunda (código 3) con animación GBA
        if (val === 3) {
          bg.fillStyle(0x0284c7, 1);
          bg.fillRect(x, y, ts, ts);

          const waterKey = `water_${(c + r) % 4}`;
          if (this.textures.exists(waterKey)) {
            const wImg = this.add.image(x + ts / 2, y + ts / 2, waterKey);
            wImg.setDisplaySize(32, 32);
            wImg.setDepth(2);
          }

          const obs = this.add.rectangle(x + ts / 2, y + ts / 2, ts, ts);
          obs.setVisible(false);
          this.physics.add.existing(obs, true);
          this.obstaclesGroup.add(obs);
        }

        // Desnivel / Ledge (código 4)
        if (val === 4) {
          bg.fillStyle(0x2e6b22, 1);
          bg.fillRect(x, y + ts - 16, ts, 4);
          bg.fillStyle(0x8b6932, 1);
          bg.fillRect(x, y + ts - 12, ts, 12);
          bg.fillStyle(0x000000, 0.25);
          bg.fillRect(x, y + ts, ts, 4);
        }

        // Obstáculo sólido genérico (código 1)
        if (val === 1) {
          const obs = this.add.rectangle(x + ts / 2, y + ts / 2, ts, ts);
          obs.setVisible(false);
          this.physics.add.existing(obs, true);
          this.obstaclesGroup.add(obs);
        }
      }
    }

    // 3. Estructuras y Casas GBA según Mapa (escalado pixel-perfect)
    if (mapDef.id === 'villa_tranquimar') {
      // Casa del Protagonista (2, 2) - Cabaña GBA 96x96
      if (this.textures.exists('house_small')) {
        const h1 = this.add.image(2 * ts + 48, 2 * ts + 48, 'house_small');
        h1.setDisplaySize(96, 96);
        h1.setDepth(5);
        bg.fillStyle(0x000000, 0.35);
        bg.fillRect(2 * ts + 10, 4 * ts + 20, 76, 12);
      }

      // Casa del Rival Nahuel (15, 2) - Cabaña GBA 96x96
      if (this.textures.exists('house_small_alt')) {
        const h2 = this.add.image(15 * ts + 48, 2 * ts + 48, 'house_small_alt');
        h2.setDisplaySize(96, 96);
        h2.setDepth(5);
        bg.fillStyle(0x000000, 0.35);
        bg.fillRect(15 * ts + 10, 4 * ts + 20, 76, 12);
      }

      // Laboratorio Pokémon del Profesor Ceibo (4, 6) - Edificio 144x128
      if (this.textures.exists('house_large')) {
        const h3 = this.add.image(5 * ts + 72, 6 * ts + 56, 'house_large');
        h3.setDisplaySize(144, 128);
        h3.setDepth(5);
        bg.fillStyle(0x000000, 0.35);
        bg.fillRect(5 * ts + 12, 8 * ts + 20, 120, 16);
      }

      // Muelle de madera con tablones y barco amarrado
      const dockCols = [9, 10];
      const dockRows = [12, 13, 14];
      for (const dr of dockRows) {
        for (const dc of dockCols) {
          const dx = dc * ts;
          const dy = dr * ts;
          bg.fillStyle(0x000000, 0.35);
          bg.fillRect(dx + 4, dy + 6, ts - 4, ts - 4);
          bg.fillStyle(0x8d5b32, 1);
          bg.fillRect(dx, dy, ts, ts);
          bg.lineStyle(1.5, 0x5c3a1e, 1);
          for (let i = 0; i < ts; i += 10) {
            bg.strokeLineShape(new Phaser.Geom.Line(dx, dy + i, dx + ts, dy + i));
          }
        }
      }

      // Barco pesquero amarrado
      const boatX = 11 * ts + 8;
      const boatY = 13 * ts + 6;
      bg.fillStyle(0xa0683c, 1);
      bg.fillEllipse(boatX + 24, boatY + 20, 56, 30);
      bg.fillStyle(0xdfc39e, 1);
      bg.fillRect(boatX + 10, boatY + 12, 28, 16);

      // Árboles Frondosos GBA en perímetro (64x80)
      const treePositions = [
        { x: 0, y: 1 }, { x: 0, y: 3 }, { x: 0, y: 5 }, { x: 0, y: 7 }, { x: 0, y: 9 },
        { x: 19, y: 1 }, { x: 19, y: 3 }, { x: 19, y: 5 }, { x: 19, y: 7 }, { x: 19, y: 9 },
        { x: 7, y: 2 }, { x: 12, y: 2 }, { x: 1, y: 7 }, { x: 18, y: 7 }
      ];

      treePositions.forEach(t => {
        if (this.textures.exists('tree_green')) {
          const tree = this.add.image(t.x * ts + 16, t.y * ts + 16, 'tree_green');
          tree.setDisplaySize(48, 64);
          tree.setDepth(t.y * ts + 32 > 10 ? 9 : 4);
        }
      });
    } else if (mapDef.id === 'pueblo_altiplano' || mapDef.id === 'solsticio_metropolis') {
      // Centro Pokémon con techo rojo
      if (this.textures.exists('hospital')) {
        const cp = this.add.image(3 * ts + 72, 2 * ts + 56, 'hospital');
        cp.setDisplaySize(144, 128);
        cp.setDepth(5);
      }
      // Poké Mart con techo azul
      if (this.textures.exists('house_small_alt')) {
        const pm = this.add.image(14 * ts + 48, 2 * ts + 48, 'house_small_alt');
        pm.setDisplaySize(96, 96);
        pm.setDepth(5);
      }
      for (let y = 1; y < rows - 2; y += 3) {
        if (this.textures.exists('tree_green')) {
          this.add.image(32, y * ts + 32, 'tree_green').setDisplaySize(48, 64).setDepth(5);
          this.add.image((cols - 2) * ts + 32, y * ts + 32, 'tree_green').setDisplaySize(48, 64).setDepth(5);
        }
      }
    } else {
      // Árboles genéricos para rutas y bosques
      for (let y = 1; y < rows; y += 3) {
        if (this.textures.exists('tree_green')) {
          this.add.image(32, y * ts + 32, 'tree_green').setDisplaySize(48, 64).setDepth(5);
          this.add.image((cols - 2) * ts + 32, y * ts + 32, 'tree_green').setDisplaySize(48, 64).setDepth(5);
        }
      }
    }
  }

  /**
   * Instancia los NPCs registrados para este mapa con sus avatares GBA pixel-art.
   */
  private spawnNPCs(): void {
    const activeMap = this._initData.mapKey || 'villa_tranquimar';
    let npcs = this.questManager.getNPCsForMap(activeMap);
    if (npcs.length === 0 && activeMap === 'villa_tranquimar') {
      npcs = this.questManager.getNPCsForMap('villa_tranquimar');
    }

    npcs.forEach(npc => {
      const worldX = npc.x * 32 + 16;
      const worldY = npc.y * 32 + 16;

      let npcSprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;

      if (this.textures.exists(npc.spriteKey)) {
        npcSprite = this.add.sprite(worldX, worldY, npc.spriteKey, 0);
        npcSprite.setDisplaySize(36, 36);
        npcSprite.setDepth(9);
      } else {
        npcSprite = this.add.rectangle(worldX, worldY, 24, 32, 0x9b59b6, 1);
        (npcSprite as Phaser.GameObjects.Rectangle).setStrokeStyle(2, 0x8e44ad);
        npcSprite.setDepth(9);
      }

      // Etiqueta flotante con el nombre del NPC
      const nameTag = this.add.text(worldX, worldY - 28, npc.name, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 5, y: 2 }
      }).setOrigin(0.5).setDepth(11);

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
    camera.setBounds(0, 0, this.mapWidthPx, this.mapHeightPx);
    this.physics.world.setBounds(0, 0, this.mapWidthPx, this.mapHeightPx);
    camera.setZoom(1.75);
    camera.roundPixels = true;
  }

  /**
   * Configura las animaciones de 4 direcciones para el spritesheet del protagonista GBA (chico o chica).
   */
  private createPlayerAnimations(): void {
    const activeKey = this.playerSpriteKey || (this.playerGender === 'girl' ? 'player_female' : 'player');

    // Eliminar animaciones previas para recargar con el spritesheet correspondiente
    this.anims.remove('walk_down');
    this.anims.remove('walk_left');
    this.anims.remove('walk_right');
    this.anims.remove('walk_up');

    this.anims.create({
      key: 'walk_down',
      frames: this.anims.generateFrameNumbers(activeKey, { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });
    this.anims.create({
      key: 'walk_left',
      frames: this.anims.generateFrameNumbers(activeKey, { start: 4, end: 7 }),
      frameRate: 8,
      repeat: -1
    });
    this.anims.create({
      key: 'walk_right',
      frames: this.anims.generateFrameNumbers(activeKey, { start: 8, end: 11 }),
      frameRate: 8,
      repeat: -1
    });
    this.anims.create({
      key: 'walk_up',
      frames: this.anims.generateFrameNumbers(activeKey, { start: 12, end: 15 }),
      frameRate: 8,
      repeat: -1
    });
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
      if (this.groundLayer && this.surfManager && this.map) {
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
        32,
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
    // Interacciones especiales de servicios
    if (npc.id.includes('joy') || npc.name.toLowerCase().includes('joy') || npc.name.toLowerCase().includes('enfermera')) {
      this.pokemonCenter.startHealingSequence(this.playerParty);
      return;
    }
    if (npc.id.includes('mart') || npc.name.toLowerCase().includes('tienda') || npc.name.toLowerCase().includes('tendero')) {
      this.pokeMart.open(this.currentCityKey, this.playerWallet);
      return;
    }

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
  private handlePlayerMovement(dt?: number): void {
    if (this.isJumping || this.isEncounterTriggered) return;

    const isRunning = this.wasdKeys?.SHIFT.isDown || this.cursors?.shift.isDown;
    const isSurfing = this.surfManager?.isPlayerSurfing() ?? false;
    const speed = isSurfing ? this.surfManager.SURF_SPEED : isRunning ? this.RUN_SPEED : this.WALK_SPEED;

    let vx = 0;
    let vy = 0;

    const isLeft = this.cursors?.left.isDown || this.wasdKeys?.A.isDown;
    const isRight = this.cursors?.right.isDown || this.wasdKeys?.D.isDown;
    const isUp = this.cursors?.up.isDown || this.wasdKeys?.W.isDown;
    const isDown = this.cursors?.down.isDown || this.wasdKeys?.S.isDown;

    if (isLeft)       { vx = -speed; this.currentFacing = 'LEFT';  }
    else if (isRight) { vx =  speed; this.currentFacing = 'RIGHT'; }
    if (isUp)         { vy = -speed; this.currentFacing = 'UP';    }
    else if (isDown)  { vy =  speed; this.currentFacing = 'DOWN';  }

    if (vx !== 0 && vy !== 0) { vx *= 0.7071; vy *= 0.7071; }

    // --- Comprobación de Desembarque de Surf ---
    if (isSurfing && (vx !== 0 || vy !== 0) && this.groundLayer && this.map) {
      this.surfManager.tryDismount(this.player, this.map, this.groundLayer, this.currentFacing);
    }

    // --- Comprobación de Ledge antes de aplicar velocidad ---
    if (!isSurfing && this.mapManager && (vx !== 0 || vy !== 0)) {
      const tileSize = 32;
      const lookAheadX = this.player.x + (vx > 0 ? tileSize : vx < 0 ? -tileSize : 0);
      const lookAheadY = this.player.y + (vy > 0 ? tileSize : vy < 0 ? -tileSize : 0);
      const tileX = Math.floor(lookAheadX / tileSize);
      const tileY = Math.floor(lookAheadY / tileSize);

      const ledge = this.mapManager.getLedgeAt(tileX, tileY);
      if (ledge && ledge.jumpDirection === this.currentFacing) {
        this.performLedgeJump(this.currentFacing);
        return;
      }
    }

    // Aplicar velocidad al cuerpo físico
    this.player.setVelocity(vx, vy);

    // Animaciones
    const prefix = this.playerSpriteKey === 'player_female' ? 'girl' : 'boy';
    if (vx !== 0 || vy !== 0) {
      const animKey = `${prefix}_walk_${this.currentFacing.toLowerCase()}`;
      if (this.anims.exists(animKey)) {
        this.player.anims.play(animKey, true);
      }
    } else {
      this.player.anims.stop();
    }
  }

  /**
   * Ejecuta el salto parabólico de 2 casillas al atravesar un desnivel (Ledge).
   * La colisión se desactiva durante el salto para que pueda atravesar el borde.
   */
  private performLedgeJump(direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'): void {
    if (this.isJumping) return;
    this.isJumping = true;

    // 7.3 — SFX salto de desnivel
    AudioManager.getInstance().playSfx('ledge_jump');

    const tileSize = 32;
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
    const currentTileX = Math.floor(this.player.x / 32);
    const currentTileY = Math.floor((this.player.y + 16) / 32);

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
    if (this.currentCollisionMatrix && this.currentCollisionMatrix[currentTileY]?.[currentTileX] === 2) {
      isStandingOnGrass = true;
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

    // 7.3 — SFX de alerta de encuentro
    AudioManager.getInstance().playSfx('exclamation');

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

  /**
   * Devuelve la clave de pista BGM según el identificador de mapa.
   */
  public getMapBgmKey(mapKey: string): BgmTrackKey {
    const key = mapKey.toLowerCase();
    if (key.includes('tranquimar')) return 'villa_tranquimar';
    if (key.includes('altiplano')) return 'pueblo_altiplano';
    if (key.includes('lab') || key.includes('ceibo')) return 'lab_ceibo';
    if (key.includes('center') || key.includes('centro')) return 'centro_pokemon';
    if (key.includes('mart') || key.includes('tienda')) return 'tienda_pokemon';
    if (key.includes('gym') || key.includes('gimnasio')) return 'gimnasio_altiplano';
    return 'ruta_1';
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

    const normalizedGender: 'male' | 'female' = (this.gender === 'girl' || this.gender === 'female') ? 'female' : 'male';

    this.trainerCard.open({
      playerName: this.playerName,
      trainerId: this.trainerId,
      gender: normalizedGender,
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

    const normalizedGender: 'male' | 'female' = (this.gender === 'girl' || this.gender === 'female') ? 'female' : 'male';

    return {
      slot: slotName,
      player_name: this.playerName,
      gender: normalizedGender,
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

