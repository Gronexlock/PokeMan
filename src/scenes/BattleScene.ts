import * as Phaser from 'phaser';
import { BattleManager, BattlePokemon, BattleStep, TurnResult, BattleMove } from '../core/battle';

export interface BattleSceneInitData {
  playerPokemon?: BattlePokemon;
  opponentPokemon?: BattlePokemon;
  encounterType?: 'wild' | 'trainer';
  mapName?: string;
}

export class BattleScene extends Phaser.Scene {
  // --- Core Battle Engine ---
  private battleManager!: BattleManager;

  // --- Sprites y Gráficos del Escenario ---
  private backgroundGraphics!: Phaser.GameObjects.Graphics;
  private playerSprite!: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite;
  private opponentSprite!: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite;

  // --- Elementos de UI: Barras de Vida y HUD ---
  // Oponente
  private oppNameText!: Phaser.GameObjects.Text;
  private oppLevelText!: Phaser.GameObjects.Text;
  private oppHpBarBg!: Phaser.GameObjects.Graphics;
  private oppHpBarFill!: Phaser.GameObjects.Graphics;
  private oppHpWidth: number = 180;
  private oppCurrentHpVisual: number = 0;

  // Jugador
  private playerNameText!: Phaser.GameObjects.Text;
  private playerLevelText!: Phaser.GameObjects.Text;
  private playerHpBarBg!: Phaser.GameObjects.Graphics;
  private playerHpBarFill!: Phaser.GameObjects.Graphics;
  private playerHpValueText!: Phaser.GameObjects.Text;
  private playerHpWidth: number = 180;
  private playerCurrentHpVisual: number = 0;

  // --- Elementos de UI: Cuadro de Diálogo Inferior ---
  private dialogueBox!: Phaser.GameObjects.Graphics;
  private dialogueText!: Phaser.GameObjects.Text;

  // --- Elementos de UI: Menú de 4 Movimientos ---
  private moveMenuContainer!: Phaser.GameObjects.Container;
  private moveButtons: {
    bg: Phaser.GameObjects.Graphics;
    nameText: Phaser.GameObjects.Text;
    ppText: Phaser.GameObjects.Text;
    typeText: Phaser.GameObjects.Text;
    moveIndex: number;
  }[] = [];
  private selectedMoveIndex: number = 0;
  private isMoveMenuOpen: boolean = false;
  private isProcessingTurn: boolean = false;

  // --- Teclas de Control ---
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private zKey!: Phaser.Input.Keyboard.Key;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super({ key: 'BattleScene' });
  }

  /**
   * 1. INIT: Recibe los datos del combate o genera Pokémon de prueba por defecto.
   */
  init(data: BattleSceneInitData): void {
    const defaultPlayer: BattlePokemon = data.playerPokemon || {
      id: 25,
      name: 'Pikachu',
      types: ['electric'],
      level: 12,
      currentHp: 42,
      maxHp: 42,
      attack: 30,
      defense: 22,
      spAttack: 28,
      spDefense: 24,
      speed: 35,
      moves: [
        { id: 'thunderbolt', name: 'Impactrueno', type: 'electric', category: 'special', power: 40, accuracy: 100, pp: 30 },
        { id: 'quickattack', name: 'Ataque Rápido', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 30, priority: 1 },
        { id: 'iron_tail', name: 'Cola Férrea', type: 'steel', category: 'physical', power: 100, accuracy: 75, pp: 15 },
        { id: 'thunder_wave', name: 'Onda Trueno', type: 'electric', category: 'status', power: 0, accuracy: 90, pp: 20 }
      ]
    };

    const defaultOpponent: BattlePokemon = data.opponentPokemon || {
      id: 7,
      name: 'Squirtle',
      types: ['water'],
      level: 11,
      currentHp: 44,
      maxHp: 44,
      attack: 24,
      defense: 30,
      spAttack: 25,
      spDefense: 28,
      speed: 20,
      moves: [
        { id: 'watergun', name: 'Pistola Agua', type: 'water', category: 'special', power: 40, accuracy: 100, pp: 25 },
        { id: 'tackle', name: 'Placaje', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 35 },
        { id: 'bubble', name: 'Burbuja', type: 'water', category: 'special', power: 40, accuracy: 100, pp: 30 },
        { id: 'withdraw', name: 'Refugio', type: 'water', category: 'status', power: 0, accuracy: 100, pp: 40 }
      ]
    };

    this.battleManager = new BattleManager(defaultPlayer, defaultOpponent);
    this.oppCurrentHpVisual = this.battleManager.opponent.currentHp;
    this.playerCurrentHpVisual = this.battleManager.player.currentHp;
    this.isProcessingTurn = false;
    this.isMoveMenuOpen = false;
    this.selectedMoveIndex = 0;
  }

  /**
   * 2. CREATE: Construcción de la interfaz visual, HUD, botones y listeners.
   */
  create(): void {
    const { width, height } = this.scale;

    // --- A. Fondo y Plataformas de Batalla ---
    this.createBattlefield(width, height);

    // --- B. Sprites de los Pokémon ---
    this.createCombatantSprites(width, height);

    // --- C. HUDs con Barras de Vida (Oponente y Jugador) ---
    this.createOpponentHUD(width);
    this.createPlayerHUD(width, height);

    // --- D. Cuadro de Diálogo Inferior ---
    this.createDialogueBox(width, height);

    // --- E. Menú de 4 Botones para Selección de Ataques ---
    this.createMoveSelectionMenu(width, height);

    // --- F. Configuración de Teclas ---
    this.setupKeyboardInput();

    // --- G. Inicio del Combate: Mensaje de Bienvenida ---
    this.startBattleIntro();
  }

  /**
   * Dibuja el fondo de combate y plataformas estéticas.
   */
  private createBattlefield(width: number, height: number): void {
    this.backgroundGraphics = this.add.graphics();

    // Cielo degradado / Fondo
    this.backgroundGraphics.fillGradientStyle(0x76b852, 0x76b852, 0x8DC26F, 0x8DC26F, 1);
    this.backgroundGraphics.fillRect(0, 0, width, height - 160);

    // Plataforma Oponente (Elipse superior derecha)
    this.backgroundGraphics.fillStyle(0xc8deb0, 1);
    this.backgroundGraphics.fillEllipse(width - 220, 200, 260, 80);
    this.backgroundGraphics.lineStyle(3, 0x8fa876, 1);
    this.backgroundGraphics.strokeEllipse(width - 220, 200, 260, 80);

    // Plataforma Jugador (Elipse inferior izquierda)
    this.backgroundGraphics.fillStyle(0xc8deb0, 1);
    this.backgroundGraphics.fillEllipse(200, 370, 320, 100);
    this.backgroundGraphics.lineStyle(3, 0x8fa876, 1);
    this.backgroundGraphics.strokeEllipse(200, 370, 320, 100);
  }

  /**
   * Crea las representaciones visuales de los contendientes.
   */
  private createCombatantSprites(width: number, _height: number): void {
    // Oponente (Frente)
    if (this.textures.exists('opponent_sprite')) {
      this.opponentSprite = this.add.sprite(width - 220, 170, 'opponent_sprite');
    } else {
      // Placeholder estilizado con gráficos si no existe la textura
      this.opponentSprite = this.add.rectangle(width - 220, 160, 100, 100, 0x3498db, 1);
      (this.opponentSprite as Phaser.GameObjects.Rectangle).setStrokeStyle(3, 0x2980b9);
    }

    // Jugador (Espalda)
    if (this.textures.exists('player_sprite_back')) {
      this.playerSprite = this.add.sprite(200, 330, 'player_sprite_back');
    } else {
      // Placeholder estilizado
      this.playerSprite = this.add.rectangle(200, 320, 110, 110, 0xf1c40f, 1);
      (this.playerSprite as Phaser.GameObjects.Rectangle).setStrokeStyle(3, 0xd4ac0d);
    }
  }

  /**
   * HUD del Oponente (Arriba a la Izquierda).
   */
  private createOpponentHUD(_width: number): void {
    const startX = 50;
    const startY = 50;

    // Caja de fondo del HUD
    const bg = this.add.graphics();
    bg.fillStyle(0xf8f9fa, 0.95);
    bg.fillRoundedRect(startX, startY, 280, 75, 10);
    bg.lineStyle(3, 0x2c3e50, 1);
    bg.strokeRoundedRect(startX, startY, 280, 75, 10);

    // Nombre y Nivel
    this.oppNameText = this.add.text(startX + 16, startY + 12, this.battleManager.opponent.name, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#1a1a1a',
      fontStyle: 'bold'
    });

    this.oppLevelText = this.add.text(startX + 200, startY + 14, `Nv.${this.battleManager.opponent.level}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#495057',
      fontStyle: 'bold'
    });

    // Barra de Vida
    this.add.text(startX + 16, startY + 45, 'PS', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#e74c3c',
      fontStyle: 'bold'
    });

    this.oppHpBarBg = this.add.graphics();
    this.oppHpBarBg.fillStyle(0x34495e, 1);
    this.oppHpBarBg.fillRoundedRect(startX + 48, startY + 45, this.oppHpWidth, 14, 4);

    this.oppHpBarFill = this.add.graphics();
    this.drawHpBar(this.oppHpBarFill, startX + 48, startY + 45, this.oppHpWidth, 14, 1.0);
  }

  /**
   * HUD del Jugador (Abajo a la Derecha).
   */
  private createPlayerHUD(width: number, height: number): void {
    const startX = width - 330;
    const startY = height - 265;

    // Caja de fondo del HUD
    const bg = this.add.graphics();
    bg.fillStyle(0xf8f9fa, 0.95);
    bg.fillRoundedRect(startX, startY, 290, 95, 10);
    bg.lineStyle(3, 0x2c3e50, 1);
    bg.strokeRoundedRect(startX, startY, 290, 95, 10);

    // Nombre y Nivel
    this.playerNameText = this.add.text(startX + 16, startY + 12, this.battleManager.player.name, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#1a1a1a',
      fontStyle: 'bold'
    });

    this.playerLevelText = this.add.text(startX + 210, startY + 14, `Nv.${this.battleManager.player.level}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#495057',
      fontStyle: 'bold'
    });

    // Barra de Vida
    this.add.text(startX + 16, startY + 45, 'PS', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#e74c3c',
      fontStyle: 'bold'
    });

    this.playerHpBarBg = this.add.graphics();
    this.playerHpBarBg.fillStyle(0x34495e, 1);
    this.playerHpBarBg.fillRoundedRect(startX + 48, startY + 45, this.playerHpWidth, 14, 4);

    this.playerHpBarFill = this.add.graphics();
    this.drawHpBar(this.playerHpBarFill, startX + 48, startY + 45, this.playerHpWidth, 14, 1.0);

    // Valor numérico de salud (ej: 42/42)
    const p = this.battleManager.player;
    this.playerHpValueText = this.add.text(startX + 150, startY + 68, `${p.currentHp} / ${p.maxHp}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#2c3e50',
      fontStyle: 'bold'
    });
  }

  /**
   * Cuadro de Diálogo Inferior para mostrar comentarios y mensajes de combate.
   */
  private createDialogueBox(width: number, height: number): void {
    const boxHeight = 150;
    const boxY = height - boxHeight - 10;
    const boxX = 10;
    const boxWidth = width - 20;

    this.dialogueBox = this.add.graphics();
    this.dialogueBox.fillStyle(0x2c3e50, 0.98);
    this.dialogueBox.fillRoundedRect(boxX, boxY, boxWidth, boxHeight, 12);
    this.dialogueBox.lineStyle(4, 0xecf0f1, 1);
    this.dialogueBox.strokeRoundedRect(boxX, boxY, boxWidth, boxHeight, 12);

    this.dialogueText = this.add.text(boxX + 30, boxY + 30, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#ffffff',
      lineSpacing: 10,
      wordWrap: { width: boxWidth - 60 }
    });
  }

  /**
   * Menú de 4 Botones en cuadrícula 2x2 para seleccionar ataques.
   */
  private createMoveSelectionMenu(width: number, height: number): void {
    this.moveMenuContainer = this.add.container(0, 0);
    this.moveMenuContainer.setVisible(false);

    const boxHeight = 150;
    const boxY = height - boxHeight - 10;
    const btnW = (width - 60) / 2;
    const btnH = 55;
    const gapX = 20;
    const gapY = 12;

    const moves = this.battleManager.player.moves;

    // Coordenadas para los 4 botones: [0: Top-Left, 1: Top-Right, 2: Bottom-Left, 3: Bottom-Right]
    const buttonPositions = [
      { x: 20, y: boxY + 15, idx: 0 },
      { x: 20 + btnW + gapX, y: boxY + 15, idx: 1 },
      { x: 20, y: boxY + 15 + btnH + gapY, idx: 2 },
      { x: 20 + btnW + gapX, y: boxY + 15 + btnH + gapY, idx: 3 }
    ];

    buttonPositions.forEach(pos => {
      const move = moves[pos.idx] as BattleMove | undefined;

      const btnBg = this.add.graphics();
      btnBg.setInteractive(new Phaser.Geom.Rectangle(pos.x, pos.y, btnW, btnH), Phaser.Geom.Rectangle.Contains);

      const nameText = this.add.text(pos.x + 16, pos.y + 16, move ? move.name : '-', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#2c3e50',
        fontStyle: 'bold'
      });

      const ppText = this.add.text(pos.x + btnW - 80, pos.y + 18, move ? `PP ${move.pp}` : '--', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#7f8c8d',
        fontStyle: 'bold'
      });

      const typeText = this.add.text(pos.x + 16, pos.y + 35, move ? move.type.toUpperCase() : '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        color: '#95a5a6',
        fontStyle: 'bold'
      });

      // Eventos de Mouse/Touch
      btnBg.on('pointerover', () => {
        if (!this.isProcessingTurn && this.isMoveMenuOpen) {
          this.selectedMoveIndex = pos.idx;
          this.updateMoveButtonsHighlight();
        }
      });

      btnBg.on('pointerdown', () => {
        if (!this.isProcessingTurn && this.isMoveMenuOpen && move) {
          this.selectedMoveIndex = pos.idx;
          this.confirmMoveSelection();
        }
      });

      this.moveButtons.push({
        bg: btnBg,
        nameText,
        ppText,
        typeText,
        moveIndex: pos.idx
      });

      this.moveMenuContainer.add([btnBg, nameText, ppText, typeText]);
    });

    this.updateMoveButtonsHighlight();
  }

  /**
   * Configuración de controles por teclado para navegar la UI.
   */
  private setupKeyboardInput(): void {
    if (!this.input.keyboard) return;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.zKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

    this.wasdKeys = {
      W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
  }

  /**
   * Bucle de actualización para capturar inputs de navegación en el menú de ataques.
   */
  update(): void {
    if (this.isProcessingTurn || !this.isMoveMenuOpen) return;

    // Navegación en cuadrícula 2x2:
    // [0] [1]
    // [2] [3]
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.wasdKeys.A)) {
      if (this.selectedMoveIndex % 2 === 1) {
        this.selectedMoveIndex -= 1;
        this.updateMoveButtonsHighlight();
      }
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.wasdKeys.D)) {
      if (this.selectedMoveIndex % 2 === 0 && this.selectedMoveIndex + 1 < this.battleManager.player.moves.length) {
        this.selectedMoveIndex += 1;
        this.updateMoveButtonsHighlight();
      }
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasdKeys.W)) {
      if (this.selectedMoveIndex >= 2) {
        this.selectedMoveIndex -= 2;
        this.updateMoveButtonsHighlight();
      }
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.wasdKeys.S)) {
      if (this.selectedMoveIndex + 2 < this.battleManager.player.moves.length) {
        this.selectedMoveIndex += 2;
        this.updateMoveButtonsHighlight();
      }
    }

    // Confirmación con Enter, Espacio o Z
    if (
      Phaser.Input.Keyboard.JustDown(this.enterKey) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
      Phaser.Input.Keyboard.JustDown(this.zKey)
    ) {
      this.confirmMoveSelection();
    }
  }

  /**
   * Actualiza el aspecto visual del botón seleccionado vs los no seleccionados.
   */
  private updateMoveButtonsHighlight(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const boxHeight = 150;
    const boxY = height - boxHeight - 10;
    const btnW = (width - 60) / 2;
    const btnH = 55;
    const gapX = 20;
    const gapY = 12;

    const positions = [
      { x: 20, y: boxY + 15 },
      { x: 20 + btnW + gapX, y: boxY + 15 },
      { x: 20, y: boxY + 15 + btnH + gapY },
      { x: 20 + btnW + gapX, y: boxY + 15 + btnH + gapY }
    ];

    this.moveButtons.forEach((btn, idx) => {
      const pos = positions[idx];
      btn.bg.clear();

      if (idx === this.selectedMoveIndex) {
        // Botón Seleccionado: Fondo dorado brillante / borde azul
        btn.bg.fillStyle(0xf1c40f, 1);
        btn.bg.fillRoundedRect(pos.x, pos.y, btnW, btnH, 8);
        btn.bg.lineStyle(3, 0xd35400, 1);
        btn.bg.strokeRoundedRect(pos.x, pos.y, btnW, btnH, 8);
        btn.nameText.setColor('#8a3b00');
        btn.ppText.setColor('#8a3b00');
      } else {
        // Botón Inactivo: Fondo blanco grisáceo
        btn.bg.fillStyle(0xffffff, 0.9);
        btn.bg.fillRoundedRect(pos.x, pos.y, btnW, btnH, 8);
        btn.bg.lineStyle(2, 0xbdc3c7, 1);
        btn.bg.strokeRoundedRect(pos.x, pos.y, btnW, btnH, 8);
        btn.nameText.setColor('#2c3e50');
        btn.ppText.setColor('#7f8c8d');
      }
    });
  }

  /**
   * Secuencia de entrada al combate.
   */
  private async startBattleIntro(): Promise<void> {
    this.isProcessingTurn = true;
    await this.displayDialogue(`¡Un ${this.battleManager.opponent.name} salvaje apareció!`);
    await this.delay(1200);
    await this.displayDialogue(`¡Adelante, ${this.battleManager.player.name}!`);
    await this.delay(1000);
    this.openMoveSelectionMenu();
  }

  /**
   * Abre el menú de 4 movimientos para que el jugador elija.
   */
  private openMoveSelectionMenu(): void {
    this.isMoveMenuOpen = true;
    this.isProcessingTurn = false;
    this.dialogueText.setText('');
    this.dialogueBox.setVisible(true);
    this.moveMenuContainer.setVisible(true);
    this.updateMoveButtonsHighlight();
  }

  /**
   * Confirma la selección del movimiento y ejecuta el turno en BattleManager.
   */
  private async confirmMoveSelection(): Promise<void> {
    const selectedMove = this.battleManager.player.moves[this.selectedMoveIndex];
    if (!selectedMove) return;

    // Cerrar menú y bloquear inputs
    this.isMoveMenuOpen = false;
    this.isProcessingTurn = true;
    this.moveMenuContainer.setVisible(false);

    // Ejecutar lógica del turno en BattleManager
    const turnResult = this.battleManager.executeTurn(this.selectedMoveIndex);

    // Animar la secuencia completa de pasos generados
    await this.animateTurnSequence(turnResult);

    // Si el combate terminó, salir; si no, reabrir menú para el siguiente turno
    if (!turnResult.isBattleOver) {
      this.openMoveSelectionMenu();
    } else {
      await this.delay(1500);
      this.cameras.main.fade(800, 0, 0, 0, false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress === 1) {
          this.scene.start('OverworldScene');
        }
      });
    }
  }

  /**
   * Itera y anima paso a paso todos los eventos del turno producidos por BattleManager.
   */
  private async animateTurnSequence(turnResult: TurnResult): Promise<void> {
    for (const step of turnResult.steps) {
      switch (step.type) {
        case 'USE_MOVE':
          await this.displayDialogue(step.message);
          await this.animateMoveExecution(step.actor);
          break;

        case 'MOVE_MISS':
          await this.displayDialogue(step.message);
          await this.delay(800);
          break;

        case 'DAMAGE':
          if (step.target && step.targetHpAfter !== undefined && step.targetMaxHp !== undefined) {
            await this.animateHpReduction(step.target, step.targetHpAfter, step.targetMaxHp);
          }
          break;

        case 'CRITICAL_HIT':
        case 'EFFECTIVENESS':
          await this.displayDialogue(step.message);
          await this.delay(900);
          break;

        case 'FAINT':
          await this.displayDialogue(step.message);
          await this.animateFaint(step.actor);
          break;

        case 'BATTLE_END':
          await this.displayDialogue(step.message);
          await this.delay(1200);
          break;

        case 'MESSAGE':
          await this.displayDialogue(step.message);
          await this.delay(800);
          break;
      }
    }
  }

  /**
   * Animación de ataque: Sacudida frontal y parpadeo del objetivo.
   */
  private async animateMoveExecution(attackerSide: 'player' | 'opponent'): Promise<void> {
    const attacker = attackerSide === 'player' ? this.playerSprite : this.opponentSprite;
    const defender = attackerSide === 'player' ? this.opponentSprite : this.playerSprite;

    const originalX = attacker.x;
    const deltaX = attackerSide === 'player' ? 30 : -30;

    // Embestida hacia adelante
    await this.tweenPromise({
      targets: attacker,
      x: originalX + deltaX,
      duration: 120,
      yoyo: true,
      ease: 'Power2'
    });

    // Parpadeo / Sacudida en el defensor
    const origDefX = defender.x;
    await this.tweenPromise({
      targets: defender,
      x: origDefX + 8,
      duration: 50,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.easeInOut'
    });
    defender.x = origDefX;
  }

  /**
   * Animación fluida de reducción de la barra de vida mediante Tween e interpolación de color.
   */
  public async animateHpReduction(target: 'player' | 'opponent', newHp: number, maxHp: number): Promise<void> {
    const isPlayer = target === 'player';
    const startHp = isPlayer ? this.playerCurrentHpVisual : this.oppCurrentHpVisual;
    const targetRatio = Math.max(0, newHp / maxHp);

    const hudData = {
      currentRatio: Math.max(0, startHp / maxHp),
      currentHp: startHp
    };

    await this.tweenPromise({
      targets: hudData,
      currentRatio: targetRatio,
      currentHp: newHp,
      duration: 800,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        if (isPlayer) {
          const startX = this.scale.width - 330;
          const startY = this.scale.height - 265;
          this.drawHpBar(this.playerHpBarFill, startX + 48, startY + 45, this.playerHpWidth, 14, hudData.currentRatio);
          this.playerHpValueText.setText(`${Math.ceil(hudData.currentHp)} / ${maxHp}`);
        } else {
          const startX = 50;
          const startY = 50;
          this.drawHpBar(this.oppHpBarFill, startX + 48, startY + 45, this.oppHpWidth, 14, hudData.currentRatio);
        }
      }
    });

    if (isPlayer) {
      this.playerCurrentHpVisual = newHp;
    } else {
      this.oppCurrentHpVisual = newHp;
    }
  }

  /**
   * Dibuja la barra de salud con el color correspondiente (Verde > 50%, Amarillo > 20%, Rojo <= 20%).
   */
  private drawHpBar(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    totalWidth: number,
    height: number,
    ratio: number
  ): void {
    graphics.clear();
    const clampedRatio = Phaser.Math.Clamp(ratio, 0, 1);
    const fillWidth = Math.max(0, totalWidth * clampedRatio);

    if (fillWidth <= 0) return;

    let barColor = 0x2ecc71; // Verde
    if (clampedRatio <= 0.20) {
      barColor = 0xe74c3c; // Rojo
    } else if (clampedRatio <= 0.50) {
      barColor = 0xf39c12; // Amarillo / Naranja
    }

    graphics.fillStyle(barColor, 1);
    graphics.fillRoundedRect(x, y, fillWidth, height, 4);
  }

  /**
   * Animación de debilitamiento (el sprite cae hacia abajo y se desvanece).
   */
  private async animateFaint(faintedSide: 'player' | 'opponent'): Promise<void> {
    const target = faintedSide === 'player' ? this.playerSprite : this.opponentSprite;

    await this.tweenPromise({
      targets: target,
      y: target.y + 60,
      alpha: 0,
      duration: 800,
      ease: 'Power2'
    });
  }

  /**
   * Muestra texto en el cuadro de diálogo.
   */
  private displayDialogue(text: string): Promise<void> {
    this.dialogueText.setText(text);
    return Promise.resolve();
  }

  /**
   * Helper para convertir un Phaser Tween en una Promise awaitable.
   */
  private tweenPromise(config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise(resolve => {
      this.tweens.add({
        ...config,
        onComplete: (tween, targets) => {
          if (config.onComplete) {
            config.onComplete(tween, targets);
          }
          resolve();
        }
      });
    });
  }

  /**
   * Helper para pausas temporales.
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => this.time.delayedCall(ms, resolve));
  }
}
