import * as Phaser from 'phaser';
import { QuestManager, QuestNPC } from '../core/quests';
import { DialogueBoxPhaser } from '../ui/DialogueBoxPhaser';
import { MapManager } from '../overworld/MapManager';
import { WarpManager } from '../overworld/WarpManager';
import { InteractionManager } from '../overworld/InteractionManager';

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

  // --- Constantes de Movimiento y Encuentros ---
  private readonly WALK_SPEED = 140;
  private readonly RUN_SPEED = 240;
  private readonly ENCOUNTER_PROBABILITY = 0.10; // 10% de probabilidad al pisar césped alto

  // Control de posición en cuadrícula para evitar disparar encuentros en cada frame
  private lastTilePosition: { x: number; y: number } = { x: -1, y: -1 };
  private isEncounterTriggered: boolean = false;

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
    // Activar cooldown al inicio para no retransportar al jugador nada más aparecer
    this.warpManager.activateCooldown();
    this.warpManager.fadeIn(400);

    // --- J. InteractionManager (Letreros e Item Balls) ---
    this.interactionManager = new InteractionManager(this, this.dialogueBox);
    // Instanciar Item Balls del mapa en pantalla usando los datos del MapManager
    if (this.mapManager?.itemBalls) {
      this.interactionManager.spawnItemBalls(this.mapManager.itemBalls);
    }
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
  update(_time: number, _delta: number): void {
    if (this.isEncounterTriggered) return;

    // A. Si hay un diálogo activo en pantalla, el movimiento se congela y Espacio avanza el texto
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

    const actionPressed =
      Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
      Phaser.Input.Keyboard.JustDown(this.enterKey) ||
      Phaser.Input.Keyboard.JustDown(this.zKey);

    // B. Resolución de Acción (prioridad descendente)
    if (actionPressed) {
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

    // D. Hints de proximidad de Item Balls
    this.interactionManager?.updateProximityHints(this.player.x, this.player.y);

    // E. Movimiento del Jugador y Encuentros en Césped Alto
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
   * Gestiona el movimiento en 4 direcciones.
   */
  private handlePlayerMovement(): void {
    const isRunning = this.cursors?.shift.isDown || this.wasdKeys?.SHIFT.isDown;
    const speed = isRunning ? this.RUN_SPEED : this.WALK_SPEED;

    let vx = 0;
    let vy = 0;

    const isLeft = this.cursors?.left.isDown || this.wasdKeys?.A.isDown;
    const isRight = this.cursors?.right.isDown || this.wasdKeys?.D.isDown;
    const isUp = this.cursors?.up.isDown || this.wasdKeys?.W.isDown;
    const isDown = this.cursors?.down.isDown || this.wasdKeys?.S.isDown;

    if (isLeft) vx = -speed;
    else if (isRight) vx = speed;

    if (isUp) vy = -speed;
    else if (isDown) vy = speed;

    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    this.player.setVelocity(vx, vy);

    if (vx < 0) {
      this.player.anims.play('walk_left', true);
    } else if (vx > 0) {
      this.player.anims.play('walk_right', true);
    } else if (vy < 0) {
      this.player.anims.play('walk_up', true);
    } else if (vy > 0) {
      this.player.anims.play('walk_down', true);
    } else {
      this.player.anims.stop();
    }
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

  private triggerWildBattleEncounter(): void {
    this.isEncounterTriggered = true;
    this.player.setVelocity(0, 0);
    this.player.anims.stop();

    const cam = this.cameras.main;
    cam.flash(300, 255, 255, 255, false, (_camera, progress) => {
      if (progress === 1) {
        cam.fade(500, 0, 0, 0, false, (_cam2, fadeProgress) => {
          if (fadeProgress === 1) {
            this.scene.start('BattleScene', {
              encounterType: 'wild',
              mapName: 'Route1'
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
}
