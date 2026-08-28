import * as Phaser from 'phaser';
import { BattleManager, BattlePokemon, BattleMove, BattleStep, TurnResult } from '../core/battle';
import { AudioManager } from '../audio';

export interface BattleSceneInitData {
  playerPokemon?: BattlePokemon;
  opponentPokemon?: BattlePokemon;
  playerParty?: BattlePokemon[];
  encounterType?: 'wild' | 'trainer';
  mapName?: string;
  trainerId?: string;
  weather?: string;
}

// ────────────────────────────────────────────────────────────────────────────────
// TIPOS INTERNOS DE UI
// ────────────────────────────────────────────────────────────────────────────────

type BattleMenuState = 'MAIN' | 'FIGHT' | 'PARTY' | 'BAG';

interface PartySlotUI {
  container: Phaser.GameObjects.Container;
  nameText: Phaser.GameObjects.Text;
  hpText: Phaser.GameObjects.Text;
  hpBar: Phaser.GameObjects.Graphics;
  pokemon: BattlePokemon;
  index: number;
}

interface BagItemUI {
  container: Phaser.GameObjects.Container;
  nameText: Phaser.GameObjects.Text;
  qtyText: Phaser.GameObjects.Text;
  itemId: string;
}

// ────────────────────────────────────────────────────────────────────────────────
// ESCENA DE BATALLA
// ────────────────────────────────────────────────────────────────────────────────

export class BattleScene extends Phaser.Scene {
  private battleManager!: BattleManager;
  private playerParty: BattlePokemon[] = [];

  // Sprites de combate
  private playerSprite!: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite;
  private opponentSprite!: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite;

  // HUD oponente
  private oppNameText!: Phaser.GameObjects.Text;
  private oppLevelText!: Phaser.GameObjects.Text;
  private oppHpBarBg!: Phaser.GameObjects.Graphics;
  private oppHpBarFill!: Phaser.GameObjects.Graphics;
  private readonly OPP_HP_WIDTH = 180;
  private oppCurrentHpVisual: number = 0;

  // HUD jugador
  private playerNameText!: Phaser.GameObjects.Text;
  private playerLevelText!: Phaser.GameObjects.Text;
  private playerHpBarBg!: Phaser.GameObjects.Graphics;
  private playerHpBarFill!: Phaser.GameObjects.Graphics;
  private playerHpValueText!: Phaser.GameObjects.Text;
  private readonly PLAYER_HP_WIDTH = 180;
  private playerCurrentHpVisual: number = 0;

  // EXP
  private expBarFill!: Phaser.GameObjects.Graphics;
  private expBarBg!: Phaser.GameObjects.Graphics;
  private readonly EXP_BAR_WIDTH = 200;
  private currentExpRatio: number = 0;

  // Diálogo
  private dialogueBox!: Phaser.GameObjects.Graphics;
  private dialogueText!: Phaser.GameObjects.Text;

  // Menú principal (4 opciones)
  private mainMenuContainer!: Phaser.GameObjects.Container;

  // Menú Luchar (4 moves)
  private moveMenuContainer!: Phaser.GameObjects.Container;
  private moveButtons: {
    bg: Phaser.GameObjects.Graphics;
    nameText: Phaser.GameObjects.Text;
    ppText: Phaser.GameObjects.Text;
    typeText: Phaser.GameObjects.Text;
    moveIndex: number;
  }[] = [];

  // Menú Pokémon (Party)
  private partyMenuContainer!: Phaser.GameObjects.Container;
  private partySlots: PartySlotUI[] = [];

  // Menú Mochila (Bag)
  private bagMenuContainer!: Phaser.GameObjects.Container;
  private bagItems: BagItemUI[] = [];
  private playerInventory: Map<string, { name: string; quantity: number }> = new Map([
    ['potion',       { name: 'Poción',        quantity: 3 }],
    ['super_potion', { name: 'Superpoción',    quantity: 1 }],
    ['poke_ball',    { name: 'Poké Ball',      quantity: 5 }],
    ['antidote',     { name: 'Antídoto',       quantity: 2 }],
  ]);

  // Estado de navegación
  private menuState: BattleMenuState = 'MAIN';
  private selectedMoveIndex: number = 0;
  private selectedPartyIndex: number = 0;
  private selectedBagIndex: number = 0;
  private isProcessingTurn: boolean = false;
  private catchAttemptInProgress: boolean = false;
  private isMegaToggled: boolean = false;
  private megaButtonBg!: Phaser.GameObjects.Graphics;
  private megaButtonText!: Phaser.GameObjects.Text;

  // Teclas
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private zKey!: Phaser.Input.Keyboard.Key;
  private xKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'BattleScene' });
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // INIT
  // ──────────────────────────────────────────────────────────────────────────────

  init(data: BattleSceneInitData): void {
    const defaultPlayer: BattlePokemon = data.playerPokemon || {
      id: 25, name: 'Pikachu', types: ['electric'], level: 12,
      currentHp: 42, maxHp: 42, attack: 30, defense: 22,
      spAttack: 28, spDefense: 24, speed: 35,
      moves: [
        { id: 'thunderbolt', name: 'Impactrueno', type: 'electric', category: 'special',  power: 40,  accuracy: 100, pp: 30 },
        { id: 'quickattack', name: 'Ataque Rápido', type: 'normal',  category: 'physical', power: 40,  accuracy: 100, pp: 30, priority: 1 },
        { id: 'iron_tail',   name: 'Cola Férrea',   type: 'steel',   category: 'physical', power: 100, accuracy: 75,  pp: 15 },
        { id: 'thunder_wave',name: 'Onda Trueno',   type: 'electric', category: 'status',  power: 0,   accuracy: 90,  pp: 20 },
      ]
    };

    const defaultOpponent: BattlePokemon = data.opponentPokemon || {
      id: 7, name: 'Squirtle', types: ['water'], level: 11,
      currentHp: 44, maxHp: 44, attack: 24, defense: 30,
      spAttack: 25, spDefense: 28, speed: 20,
      moves: [
        { id: 'watergun', name: 'Pistola Agua', type: 'water',  category: 'special',  power: 40, accuracy: 100, pp: 25 },
        { id: 'tackle',   name: 'Placaje',      type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 35 },
        { id: 'bubble',   name: 'Burbuja',      type: 'water',  category: 'special',  power: 40, accuracy: 100, pp: 30 },
        { id: 'withdraw', name: 'Refugio',      type: 'water',  category: 'status',   power: 0,  accuracy: 100, pp: 40 },
      ]
    };

    this.battleManager = new BattleManager(defaultPlayer, defaultOpponent, {
      isTrainerBattle: data.encounterType === 'trainer',
      weather: data.weather ?? 'CLEAR'
    });
    this.playerParty = data.playerParty || [defaultPlayer];
    this.encounterType = data.encounterType || 'wild';
    this.trainerId = data.trainerId || '';
    this.mapName = data.mapName || 'villa_tranquimar';
    this.oppCurrentHpVisual  = this.battleManager.opponent.currentHp;
    this.playerCurrentHpVisual = this.battleManager.player.currentHp;
    this.isProcessingTurn = false;
    this.menuState = 'MAIN';
  }

  /**
   * 1. PRELOAD: Carga dinámica de sprites de combate (front y back) para los Pokémon activos.
   */
  preload(): void {
    const opp = this.battleManager?.opponent;
    const player = this.battleManager?.player;

    if (opp?.id) {
      this.load.image(`pokemon_front_${opp.id}`, `/assets/sprites/battle/front/${opp.id}.png`);
    }
    if (player?.id) {
      this.load.image(`pokemon_back_${player.id}`, `/assets/sprites/battle/back/${player.id}.png`);
      this.load.image(`pokemon_front_${player.id}`, `/assets/sprites/battle/front/${player.id}.png`);
    }

    // Precargar starters y Pokémon frecuentes
    const commonIds = [1, 4, 6, 7, 9, 10, 16, 25, 72, 129, 183];
    for (const id of commonIds) {
      this.load.image(`pokemon_front_${id}`, `/assets/sprites/battle/front/${id}.png`);
      this.load.image(`pokemon_back_${id}`, `/assets/sprites/battle/back/${id}.png`);
    }

    // Precargar retratos y sprites de batalla de entrenadores GBA
    const trainerKeys = [
      'trainer_player_boy', 'trainer_player_girl', 'trainer_professor', 'trainer_rival',
      'trainer_gym_rocio', 'trainer_gym_thiago', 'trainer_elite_inti', 'trainer_elite_marina',
      'trainer_champion_renata', 'trainer_fisherman', 'trainer_hiker', 'trainer_bugcatcher',
      'trainer_swimmer', 'trainer_medium', 'trainer_lass'
    ];
    for (const tk of trainerKeys) {
      this.load.image(tk, `/assets/sprites/gba/trainers/${tk}.png`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // CREATE
  // ──────────────────────────────────────────────────────────────────────────────

  create(): void {
    const { width, height } = this.scale;

    this.createBattlefield(width, height);
    this.createCombatantSprites(width, height);
    this.createOpponentHUD();
    this.createPlayerHUD(width, height);
    this.createDialogueBox(width, height);
    this.createMainMenu(width, height);
    this.createMoveMenu(width, height);
    this.createPartyMenu(width, height);
    this.createBagMenu(width, height);
    this.setupKeyboard();

    // 7.2 — Iniciar BGM dinámico según tipo de combate
    AudioManager.getInstance().playBattleBgm(this.getBattleBgmType());

    this.startBattleIntro();
  }

  private getBattleBgmType(): 'wild' | 'trainer' | 'gym' {
    if (this.trainerId.includes('rocio') || this.trainerId.includes('gym') || this.trainerId.includes('leader')) {
      return 'gym';
    }
    return this.encounterType === 'trainer' ? 'trainer' : 'wild';
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // UPDATE — Navegación por teclado según el menú activo
  // ──────────────────────────────────────────────────────────────────────────────

  update(): void {
    if (this.isProcessingTurn) return;

    const up    = Phaser.Input.Keyboard.JustDown(this.cursors.up);
    const down  = Phaser.Input.Keyboard.JustDown(this.cursors.down);
    const left  = Phaser.Input.Keyboard.JustDown(this.cursors.left);
    const right = Phaser.Input.Keyboard.JustDown(this.cursors.right);
    const confirm = Phaser.Input.Keyboard.JustDown(this.enterKey) ||
                    Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
                    Phaser.Input.Keyboard.JustDown(this.zKey);
    const cancel  = Phaser.Input.Keyboard.JustDown(this.xKey) ||
                    Phaser.Input.Keyboard.JustDown(this.escKey);

    if (cancel && this.menuState !== 'MAIN') {
      AudioManager.getInstance().playSfx('cancel');
      this.showMainMenu();
      return;
    }

    switch (this.menuState) {
      case 'FIGHT':
        if (left  && this.selectedMoveIndex % 2 === 1) { this.selectedMoveIndex--; this.refreshMoveHighlight(); }
        if (right && this.selectedMoveIndex % 2 === 0 && this.selectedMoveIndex + 1 < this.battleManager.player.moves.length) { this.selectedMoveIndex++; this.refreshMoveHighlight(); }
        if (up    && this.selectedMoveIndex >= 2) { this.selectedMoveIndex -= 2; this.refreshMoveHighlight(); }
        if (down  && this.selectedMoveIndex + 2 < this.battleManager.player.moves.length) { this.selectedMoveIndex += 2; this.refreshMoveHighlight(); }
        if (confirm) { this.onMoveSelected(this.selectedMoveIndex); }
        break;

      case 'PARTY':
        if (up   && this.selectedPartyIndex > 0) { this.selectedPartyIndex--; this.refreshPartyHighlight(); }
        if (down && this.selectedPartyIndex < this.partySlots.length - 1) { this.selectedPartyIndex++; this.refreshPartyHighlight(); }
        if (confirm) { this.onPartyMemberSelected(this.selectedPartyIndex); }
        break;

      case 'BAG':
        if (up   && this.selectedBagIndex > 0) { this.selectedBagIndex--; this.refreshBagHighlight(); }
        if (down && this.selectedBagIndex < this.bagItems.length - 1) { this.selectedBagIndex++; this.refreshBagHighlight(); }
        if (confirm) { this.onBagItemSelected(this.selectedBagIndex); }
        break;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // CREACIÓN DE UI
  // ──────────────────────────────────────────────────────────────────────────────

  private createBattlefield(w: number, h: number): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x76b852, 0x76b852, 0x8DC26F, 0x8DC26F, 1);
    bg.fillRect(0, 0, w, h - 160);
    bg.fillStyle(0xc8deb0, 1);
    bg.fillEllipse(w - 220, 200, 260, 80);
    bg.lineStyle(3, 0x8fa876, 1);
    bg.strokeEllipse(w - 220, 200, 260, 80);
    bg.fillStyle(0xc8deb0, 1);
    bg.fillEllipse(200, 370, 320, 100);
    bg.lineStyle(3, 0x8fa876, 1);
    bg.strokeEllipse(200, 370, 320, 100);
  }

  private createCombatantSprites(w: number, _h: number): void {
    const opp = this.battleManager.opponent;
    const player = this.battleManager.player;

    const oppKey = `pokemon_front_${opp.id}`;
    const playerKey = `pokemon_back_${player.id}`;

    // Sombra del oponente
    this.add.ellipse(w - 220, 215, 130, 40, 0x000000, 0.25);

    if (this.textures.exists(oppKey)) {
      this.opponentSprite = this.add.sprite(w - 220, 150, oppKey);
      (this.opponentSprite as Phaser.GameObjects.Sprite).setScale(2.4);
    } else {
      this.opponentSprite = this.add.rectangle(w - 220, 160, 100, 100, 0x3498db, 1);
      (this.opponentSprite as Phaser.GameObjects.Rectangle).setStrokeStyle(3, 0x2980b9);
    }

    // Animación de respiración / flotación del oponente
    this.tweens.add({
      targets: this.opponentSprite,
      y: (this.opponentSprite.y as number) - 8,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Sombra del jugador
    this.add.ellipse(200, 380, 150, 45, 0x000000, 0.25);

    if (this.textures.exists(playerKey)) {
      this.playerSprite = this.add.sprite(200, 305, playerKey);
      (this.playerSprite as Phaser.GameObjects.Sprite).setScale(2.6);
    } else if (this.textures.exists(`pokemon_front_${player.id}`)) {
      this.playerSprite = this.add.sprite(200, 305, `pokemon_front_${player.id}`);
      (this.playerSprite as Phaser.GameObjects.Sprite).setScale(2.6);
    } else {
      this.playerSprite = this.add.rectangle(200, 320, 110, 110, 0xf1c40f, 1);
      (this.playerSprite as Phaser.GameObjects.Rectangle).setStrokeStyle(3, 0xd4ac0d);
    }

    // Animación de respiración del Pokémon del jugador
    this.tweens.add({
      targets: this.playerSprite,
      y: (this.playerSprite.y as number) - 6,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createOpponentHUD(): void {
    const sx = 50, sy = 50;
    const bg = this.add.graphics();
    bg.fillStyle(0xf8f9fa, 0.95);
    bg.fillRoundedRect(sx, sy, 280, 75, 10);
    bg.lineStyle(3, 0x2c3e50, 1);
    bg.strokeRoundedRect(sx, sy, 280, 75, 10);

    this.oppNameText  = this.add.text(sx + 16, sy + 12, this.battleManager.opponent.name, { fontFamily: 'Arial', fontSize: '20px', color: '#1a1a1a', fontStyle: 'bold' });
    this.oppLevelText = this.add.text(sx + 200, sy + 14, `Nv.${this.battleManager.opponent.level}`, { fontFamily: 'Arial', fontSize: '16px', color: '#495057', fontStyle: 'bold' });
    this.add.text(sx + 16, sy + 45, 'PS', { fontFamily: 'Arial', fontSize: '14px', color: '#e74c3c', fontStyle: 'bold' });
    this.oppHpBarBg   = this.add.graphics();
    this.oppHpBarBg.fillStyle(0x34495e, 1);
    this.oppHpBarBg.fillRoundedRect(sx + 48, sy + 45, this.OPP_HP_WIDTH, 14, 4);
    this.oppHpBarFill = this.add.graphics();
    this.drawHpBar(this.oppHpBarFill, sx + 48, sy + 45, this.OPP_HP_WIDTH, 14, 1.0);
  }

  private createPlayerHUD(w: number, h: number): void {
    const sx = w - 330, sy = h - 265;
    const bg = this.add.graphics();
    bg.fillStyle(0xf8f9fa, 0.95);
    bg.fillRoundedRect(sx, sy, 290, 110, 10);
    bg.lineStyle(3, 0x2c3e50, 1);
    bg.strokeRoundedRect(sx, sy, 290, 110, 10);

    const p = this.battleManager.player;
    this.playerNameText  = this.add.text(sx + 16, sy + 12, p.name, { fontFamily: 'Arial', fontSize: '20px', color: '#1a1a1a', fontStyle: 'bold' });
    this.playerLevelText = this.add.text(sx + 210, sy + 14, `Nv.${p.level}`,   { fontFamily: 'Arial', fontSize: '16px', color: '#495057', fontStyle: 'bold' });
    this.add.text(sx + 16, sy + 45, 'PS', { fontFamily: 'Arial', fontSize: '14px', color: '#e74c3c', fontStyle: 'bold' });

    this.playerHpBarBg   = this.add.graphics();
    this.playerHpBarBg.fillStyle(0x34495e, 1);
    this.playerHpBarBg.fillRoundedRect(sx + 48, sy + 45, this.PLAYER_HP_WIDTH, 14, 4);
    this.playerHpBarFill = this.add.graphics();
    this.drawHpBar(this.playerHpBarFill, sx + 48, sy + 45, this.PLAYER_HP_WIDTH, 14, 1.0);
    this.playerHpValueText = this.add.text(sx + 150, sy + 68, `${p.currentHp} / ${p.maxHp}`, { fontFamily: 'Arial', fontSize: '14px', color: '#2c3e50', fontStyle: 'bold' });

    // Barra de EXP (azul, debajo de la barra de vida)
    this.add.text(sx + 16, sy + 86, 'EXP', { fontFamily: 'Arial', fontSize: '11px', color: '#7f8c8d', fontStyle: 'bold' });
    this.expBarBg = this.add.graphics();
    this.expBarBg.fillStyle(0x34495e, 1);
    this.expBarBg.fillRect(sx + 48, sy + 90, this.EXP_BAR_WIDTH, 8);
    this.expBarFill = this.add.graphics();
    this.drawExpBar(this.expBarFill, sx + 48, sy + 90, this.EXP_BAR_WIDTH, 8, 0.3);
  }

  private createDialogueBox(w: number, h: number): void {
    const bx = 10, by = h - 160, bw = (w - 20) / 2 + 20, bh = 150;
    this.dialogueBox = this.add.graphics();
    this.dialogueBox.fillStyle(0x2c3e50, 0.98);
    this.dialogueBox.fillRoundedRect(bx, by, bw, bh, 12);
    this.dialogueBox.lineStyle(4, 0xecf0f1, 1);
    this.dialogueBox.strokeRoundedRect(bx, by, bw, bh, 12);
    this.dialogueText = this.add.text(bx + 30, by + 30, '', {
      fontFamily: 'Arial', fontSize: '20px', color: '#ffffff',
      lineSpacing: 8, wordWrap: { width: bw - 60 }
    });
  }

  // ──── Menú Principal (LUCHAR / POKÉMON / MOCHILA / HUIR) ────

  private createMainMenu(w: number, h: number): void {
    this.mainMenuContainer = this.add.container(0, 0);
    this.mainMenuContainer.setVisible(false);
    const labels = ['⚔️ LUCHAR', '🔄 POKÉMON', '🎒 MOCHILA', '🏃 HUIR'];
    const bw = (w - 20) / 2 - 10, bh = 65;
    const startX = w / 2 + 10, startY = h - 160;
    const positions = [
      { x: startX,      y: startY,       label: labels[0] },
      { x: startX + bw + 10, y: startY,       label: labels[1] },
      { x: startX,      y: startY + bh + 5, label: labels[2] },
      { x: startX + bw + 10, y: startY + bh + 5, label: labels[3] },
    ];

    const actions = [
      () => this.showFightMenu(),
      () => this.showPartyMenu(),
      () => this.showBagMenu(),
      () => this.tryRun(),
    ];

    positions.forEach((pos, i) => {
      const btnBg = this.add.graphics();
      btnBg.fillStyle(0x2c3e50, 0.96);
      btnBg.fillRoundedRect(pos.x, pos.y, bw, bh, 8);
      btnBg.lineStyle(3, 0x95a5a6, 1);
      btnBg.strokeRoundedRect(pos.x, pos.y, bw, bh, 8);

      const txt = this.add.text(pos.x + bw / 2, pos.y + bh / 2, pos.label, {
        fontFamily: 'Arial', fontSize: '17px', color: '#ffffff', fontStyle: 'bold'
      }).setOrigin(0.5);

      btnBg.setInteractive(new Phaser.Geom.Rectangle(pos.x, pos.y, bw, bh), Phaser.Geom.Rectangle.Contains);
      btnBg.on('pointerover', () => { btnBg.clear(); btnBg.fillStyle(0xf1c40f, 1); btnBg.fillRoundedRect(pos.x, pos.y, bw, bh, 8); txt.setColor('#2c3e50'); });
      btnBg.on('pointerout',  () => { btnBg.clear(); btnBg.fillStyle(0x2c3e50, 0.96); btnBg.fillRoundedRect(pos.x, pos.y, bw, bh, 8); btnBg.lineStyle(3, 0x95a5a6, 1); btnBg.strokeRoundedRect(pos.x, pos.y, bw, bh, 8); txt.setColor('#ffffff'); });
      btnBg.on('pointerdown', () => { if (!this.isProcessingTurn) actions[i](); });

      this.mainMenuContainer.add([btnBg, txt]);
    });
  }

  // ──── Menú Luchar (moves 2×2) ────

  private createMoveMenu(w: number, h: number): void {
    this.moveMenuContainer = this.add.container(0, 0);
    this.moveMenuContainer.setVisible(false);
    this.moveButtons = [];

    const bw = (w - 60) / 2, bh = 55, gapX = 20, gapY = 12;
    const startY = h - 150;

    [[0,0],[1,0],[0,1],[1,1]].forEach(([col, row], i) => {
      const px = 20 + col * (bw + gapX);
      const py = startY + 15 + row * (bh + gapY);
      const move = this.battleManager.player.moves[i] as BattleMove | undefined;

      const bg  = this.add.graphics();
      const txt = this.add.text(px + 16, py + 16, move?.name ?? '-',  { fontFamily: 'Arial', fontSize: '18px', color: '#2c3e50', fontStyle: 'bold' });
      const pp  = this.add.text(px + bw - 80, py + 18, move ? `PP ${move.pp}` : '--', { fontFamily: 'Arial', fontSize: '14px', color: '#7f8c8d', fontStyle: 'bold' });
      const typ = this.add.text(px + 16, py + 35, move?.type.toUpperCase() ?? '', { fontFamily: 'Arial', fontSize: '11px', color: '#95a5a6', fontStyle: 'bold' });

      bg.setInteractive(new Phaser.Geom.Rectangle(px, py, bw, bh), Phaser.Geom.Rectangle.Contains);
      bg.on('pointerover', () => { if (!this.isProcessingTurn) { this.selectedMoveIndex = i; this.refreshMoveHighlight(); } });
      bg.on('pointerdown', () => { if (!this.isProcessingTurn && move) this.onMoveSelected(i); });

      this.moveButtons.push({ bg, nameText: txt, ppText: pp, typeText: typ, moveIndex: i });
      this.moveMenuContainer.add([bg, txt, pp, typ]);
    });

    // Botón de activación de Mega-Evolución (✨ MEGA EVOLUCIÓN)
    const megaBtnX = w - 160, megaBtnY = startY - 18;
    this.megaButtonBg = this.add.graphics();
    this.drawMegaButton(false);

    this.megaButtonText = this.add.text(megaBtnX + 70, megaBtnY + 16, '✨ MEGA [M]', {
      fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);

    this.megaButtonBg.setInteractive(new Phaser.Geom.Rectangle(megaBtnX, megaBtnY, 140, 32), Phaser.Geom.Rectangle.Contains);
    this.megaButtonBg.on('pointerdown', () => this.toggleMegaEvolution());

    this.moveMenuContainer.add([this.megaButtonBg, this.megaButtonText]);
    this.refreshMoveHighlight();
  }

  private toggleMegaEvolution(): void {
    if (this.battleManager.player.isMega || this.battleManager.playerMegaUsed) return;
    this.isMegaToggled = !this.isMegaToggled;
    this.drawMegaButton(this.isMegaToggled);
  }

  private drawMegaButton(active: boolean): void {
    const { width, height } = this.scale;
    const megaBtnX = width - 160, megaBtnY = height - 150 - 18;
    this.megaButtonBg.clear();

    if (active) {
      this.megaButtonBg.fillStyle(0x059669, 1);
      this.megaButtonBg.fillRoundedRect(megaBtnX, megaBtnY, 140, 32, 8);
      this.megaButtonBg.lineStyle(2, 0x34d399, 1);
      this.megaButtonBg.strokeRoundedRect(megaBtnX, megaBtnY, 140, 32, 8);
    } else {
      this.megaButtonBg.fillStyle(0x334155, 0.9);
      this.megaButtonBg.fillRoundedRect(megaBtnX, megaBtnY, 140, 32, 8);
      this.megaButtonBg.lineStyle(1, 0x64748b, 1);
      this.megaButtonBg.strokeRoundedRect(megaBtnX, megaBtnY, 140, 32, 8);
    }
  }

  // ──── Menú Pokémon (Party) ────

  private createPartyMenu(w: number, h: number): void {
    this.partyMenuContainer = this.add.container(0, 0);
    this.partyMenuContainer.setVisible(false);
    this.partySlots = [];

    const panelW = w - 40, panelH = h - 40;
    const bg = this.add.graphics();
    bg.fillStyle(0x1a252f, 0.97);
    bg.fillRoundedRect(20, 20, panelW, panelH, 14);
    bg.lineStyle(4, 0xecf0f1, 1);
    bg.strokeRoundedRect(20, 20, panelW, panelH, 14);
    this.add.text(w / 2, 40, '🔄 SELECCIONAR POKÉMON', { fontFamily: 'Arial', fontSize: '18px', color: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);

    this.partyMenuContainer.add(bg);

    this.playerParty.forEach((pkmn, idx) => {
      const slotY = 70 + idx * 68;
      const slotContainer = this.add.container(40, slotY);

      const slotBg = this.add.graphics();
      slotBg.fillStyle(pkmn.currentHp > 0 ? 0x2c3e50 : 0x4a4a4a, 0.9);
      slotBg.fillRoundedRect(0, 0, panelW - 40, 58, 8);
      slotBg.lineStyle(2, 0x7f8c8d, 1);
      slotBg.strokeRoundedRect(0, 0, panelW - 40, 58, 8);

      const nameT = this.add.text(16, 10, `${pkmn.name} ${pkmn.currentHp <= 0 ? '(Debilitado)' : ''}`, { fontFamily: 'Arial', fontSize: '16px', color: pkmn.currentHp > 0 ? '#ffffff' : '#888888', fontStyle: 'bold' });
      const levelT = this.add.text(panelW - 110, 10, `Nv.${pkmn.level}`, { fontFamily: 'Arial', fontSize: '14px', color: '#bdc3c7' });
      const hpText = this.add.text(16, 34, `PS: ${pkmn.currentHp}/${pkmn.maxHp}`, { fontFamily: 'Arial', fontSize: '13px', color: '#ecf0f1' });

      const hpBarBg = this.add.graphics();
      hpBarBg.fillStyle(0x34495e, 1);
      hpBarBg.fillRect(100, 38, 140, 10);
      const hpBar = this.add.graphics();
      const ratio = Math.max(0, pkmn.currentHp / pkmn.maxHp);
      this.drawHpBar(hpBar, 100, 38, 140, 10, ratio);

      slotContainer.add([slotBg, nameT, levelT, hpText, hpBarBg, hpBar]);

      // Interactividad mouse
      slotBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, panelW - 40, 58), Phaser.Geom.Rectangle.Contains);
      slotBg.on('pointerover', () => { this.selectedPartyIndex = idx; this.refreshPartyHighlight(); });
      slotBg.on('pointerdown', () => { if (pkmn.currentHp > 0) this.onPartyMemberSelected(idx); });

      this.partyMenuContainer.add(slotContainer);
      this.partySlots.push({ container: slotContainer, nameText: nameT, hpText, hpBar, pokemon: pkmn, index: idx });
    });

    this.partyMenuContainer.add(this.partySlots.map(s => s.container));
  }

  // ──── Menú Mochila (Bag) ────

  private createBagMenu(w: number, h: number): void {
    this.bagMenuContainer = this.add.container(0, 0);
    this.bagMenuContainer.setVisible(false);
    this.bagItems = [];

    const panelW = w - 40, panelH = h - 40;
    const bg = this.add.graphics();
    bg.fillStyle(0x1a252f, 0.97);
    bg.fillRoundedRect(20, 20, panelW, panelH, 14);
    bg.lineStyle(4, 0xecf0f1, 1);
    bg.strokeRoundedRect(20, 20, panelW, panelH, 14);
    this.bagMenuContainer.add(bg);
    this.add.text(w / 2, 40, '🎒 MOCHILA', { fontFamily: 'Arial', fontSize: '18px', color: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);

    let idx = 0;
    this.playerInventory.forEach((item, itemId) => {
      const itemY = 70 + idx * 60;
      const slotContainer = this.add.container(40, itemY);

      const slotBg = this.add.graphics();
      slotBg.fillStyle(0x2c3e50, 0.9);
      slotBg.fillRoundedRect(0, 0, panelW - 40, 50, 8);
      slotBg.lineStyle(2, 0x7f8c8d, 1);
      slotBg.strokeRoundedRect(0, 0, panelW - 40, 50, 8);

      const nameT = this.add.text(16, 15, item.name, { fontFamily: 'Arial', fontSize: '16px', color: '#ffffff', fontStyle: 'bold' });
      const qtyT  = this.add.text(panelW - 100, 15, `× ${item.quantity}`, { fontFamily: 'Arial', fontSize: '16px', color: '#f1c40f', fontStyle: 'bold' });

      slotBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, panelW - 40, 50), Phaser.Geom.Rectangle.Contains);
      slotBg.on('pointerover', () => { this.selectedBagIndex = idx; this.refreshBagHighlight(); });
      slotBg.on('pointerdown', () => this.onBagItemSelected(idx));

      slotContainer.add([slotBg, nameT, qtyT]);
      this.bagMenuContainer.add(slotContainer);
      this.bagItems.push({ container: slotContainer, nameText: nameT, qtyText: qtyT, itemId });
      idx++;
    });
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // HELPERS DE RESALTADO (highlight)
  // ──────────────────────────────────────────────────────────────────────────────

  private refreshMoveHighlight(): void {
    const { width, height } = this.scale;
    const bw = (width - 60) / 2, bh = 55, gapX = 20, gapY = 12;
    const startY = height - 150;
    [[0,0],[1,0],[0,1],[1,1]].forEach(([col, row], i) => {
      const px = 20 + col * (bw + gapX);
      const py = startY + 15 + row * (bh + gapY);
      const btn = this.moveButtons[i];
      btn.bg.clear();
      if (i === this.selectedMoveIndex) {
        btn.bg.fillStyle(0xf1c40f, 1);
        btn.bg.fillRoundedRect(px, py, bw, bh, 8);
        btn.bg.lineStyle(3, 0xd35400, 1);
        btn.bg.strokeRoundedRect(px, py, bw, bh, 8);
        btn.nameText.setColor('#8a3b00');
        btn.ppText.setColor('#8a3b00');
      } else {
        btn.bg.fillStyle(0xffffff, 0.9);
        btn.bg.fillRoundedRect(px, py, bw, bh, 8);
        btn.bg.lineStyle(2, 0xbdc3c7, 1);
        btn.bg.strokeRoundedRect(px, py, bw, bh, 8);
        btn.nameText.setColor('#2c3e50');
        btn.ppText.setColor('#7f8c8d');
      }
    });
  }

  private refreshPartyHighlight(): void {
    this.partySlots.forEach((slot, i) => {
      const slotBg = slot.container.getAt(0) as Phaser.GameObjects.Graphics;
      slotBg.clear();
      const isSelected = i === this.selectedPartyIndex;
      slotBg.fillStyle(isSelected ? 0xd35400 : (slot.pokemon.currentHp > 0 ? 0x2c3e50 : 0x4a4a4a), 0.9);
      slotBg.fillRoundedRect(0, 0, this.scale.width - 80, 58, 8);
      slotBg.lineStyle(2, isSelected ? 0xf1c40f : 0x7f8c8d, 1);
      slotBg.strokeRoundedRect(0, 0, this.scale.width - 80, 58, 8);
    });
  }

  private refreshBagHighlight(): void {
    const panelW = this.scale.width - 40;
    this.bagItems.forEach((item, i) => {
      const slotBg = item.container.getAt(0) as Phaser.GameObjects.Graphics;
      slotBg.clear();
      const isSelected = i === this.selectedBagIndex;
      slotBg.fillStyle(isSelected ? 0xd35400 : 0x2c3e50, 0.9);
      slotBg.fillRoundedRect(0, 0, panelW - 40, 50, 8);
      slotBg.lineStyle(2, isSelected ? 0xf1c40f : 0x7f8c8d, 1);
      slotBg.strokeRoundedRect(0, 0, panelW - 40, 50, 8);
    });
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // NAVEGACIÓN DE MENÚS
  // ──────────────────────────────────────────────────────────────────────────────

  private showMainMenu(): void {
    this.menuState = 'MAIN';
    this.moveMenuContainer.setVisible(false);
    this.partyMenuContainer.setVisible(false);
    this.bagMenuContainer.setVisible(false);
    this.mainMenuContainer.setVisible(true);
    this.dialogueText.setText('¿Qué hará\n' + this.battleManager.player.name + '?');
  }

  private showFightMenu(): void {
    this.menuState = 'FIGHT';
    this.mainMenuContainer.setVisible(false);
    this.moveMenuContainer.setVisible(true);
    this.dialogueText.setText('Selecciona un movimiento.');
    this.refreshMoveHighlight();
  }

  private showPartyMenu(): void {
    this.menuState = 'PARTY';
    this.mainMenuContainer.setVisible(false);
    this.partyMenuContainer.setVisible(true);
    this.selectedPartyIndex = 0;
    this.refreshPartyHighlight();
    this.dialogueText.setText('¿A quién envías?');
  }

  private showBagMenu(): void {
    this.menuState = 'BAG';
    this.mainMenuContainer.setVisible(false);
    this.bagMenuContainer.setVisible(true);
    this.selectedBagIndex = 0;
    this.refreshBagHighlight();
    this.dialogueText.setText('¿Qué objeto usarás?');
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // ACCIONES DE COMBATE
  // ──────────────────────────────────────────────────────────────────────────────

  // 2.5 — Ejecutar ataque (con soporte para Mega-Evolución)
  private async onMoveSelected(moveIdx: number): Promise<void> {
    const move = this.battleManager.player.moves[moveIdx];
    if (!move) return;
    this.hideAllMenus();
    this.isProcessingTurn = true;
    const result = this.battleManager.executeTurn(moveIdx, undefined, {
      playerMega: this.isMegaToggled
    });
    this.isMegaToggled = false;
    this.drawMegaButton(false);
    await this.animateTurnSequence(result);
    this.finishTurn(result);
  }

  // 2.6 — Relevo de Pokémon
  private async onPartyMemberSelected(partyIdx: number): Promise<void> {
    const target = this.playerParty[partyIdx];
    if (!target || target.currentHp <= 0) {
      this.displayDialogue(`¡${target?.name ?? '???'} no puede combatir!`);
      return;
    }
    if (target === this.battleManager.player) {
      this.displayDialogue(`¡${target.name} ya está en combate!`);
      return;
    }
    this.hideAllMenus();
    this.isProcessingTurn = true;

    // Animación de vuelta: el sprite del jugador cae y se desvanece
    await this.animateFaint('player');
    await this.displayDialogue(`¡${this.battleManager.player.name}, vuelve!`);
    await this.delay(600);

    // Actualizar BattleManager con el nuevo Pokémon activo
    this.battleManager.player = { ...target, moves: [...target.moves] };

    // Actualizar HUD
    this.playerNameText.setText(target.name);
    this.playerLevelText.setText(`Nv.${target.level}`);
    this.playerHpValueText.setText(`${target.currentHp} / ${target.maxHp}`);
    this.drawHpBar(this.playerHpBarFill,
      this.scale.width - 330 + 48, this.scale.height - 265 + 45,
      this.PLAYER_HP_WIDTH, 14,
      target.currentHp / target.maxHp
    );
    this.playerCurrentHpVisual = target.currentHp;

    // El sprite vuelve a aparecer
    this.playerSprite.setAlpha(0);
    (this.playerSprite as Phaser.GameObjects.Rectangle).setFillStyle(0xf1c40f);
    this.tweens.add({ targets: this.playerSprite, alpha: 1, y: (this.playerSprite.y - 20), duration: 400, ease: 'Cubic.easeOut' });

    await this.displayDialogue(`¡Adelante, ${target.name}!`);
    await this.delay(600);

    // El oponente ataca en este turno (relevo consume el turno)
    const result = this.battleManager.executeTurn(0, undefined, { isPlayerSwitchOrItem: true });
    await this.animateTurnSequence(result);
    this.finishTurn(result);
  }

  // 2.7 — Uso de objeto (Mochila)
  private async onBagItemSelected(bagIdx: number): Promise<void> {
    const item = this.bagItems[bagIdx];
    if (!item) return;
    const inv = this.playerInventory.get(item.itemId);
    if (!inv || inv.quantity <= 0) {
      this.displayDialogue('¡No tienes más de ese objeto!');
      return;
    }

    this.hideAllMenus();
    this.isProcessingTurn = true;

    // Consumir el objeto
    inv.quantity--;
    item.qtyText.setText(`× ${inv.quantity}`);

    const isBall = item.itemId.includes('ball');

    if (isBall && !this.battleManager.is_trainer_battle) {
      // 2.8 — Lanzar Poké Ball
      await this.animatePokeBallThrow(item.itemId);
    } else if (!isBall) {
      // Usar objeto de curación en el Pokémon activo
      await this.useHealingItem(item.itemId, inv.name);
    } else {
      await this.displayDialogue('¡No puedes usar una Poké Ball en un combate de entrenador!');
      await this.delay(800);
    }

    if (!this.battleManager.isBattleOver) {
      // El oponente ataca después de que usamos el objeto (consume el turno)
      const oppMoveIdx = Math.floor(Math.random() * this.battleManager.opponent.moves.length);
      const result = this.battleManager.executeTurn(0, oppMoveIdx, { isPlayerSwitchOrItem: true });
      await this.animateTurnSequence(result);
      this.finishTurn(result);
    }
  }

  // 2.8 — Cinemática completa de captura con Poké Ball
  private async animatePokeBallThrow(ballId: string): Promise<void> {
    if (this.catchAttemptInProgress) return;
    this.catchAttemptInProgress = true;

    const opponent = this.battleManager.opponent;
    const startX = this.playerSprite.x;
    const startY = this.playerSprite.y - 30;
    const targetX = this.opponentSprite.x;
    const targetY = this.opponentSprite.y;

    // Regla de Diseño Fundamental de Andara: Los Legendarios son fuerzas divinas NO capturables
    const uncatchables = ['eternatus', 'zygarde', 'mewtwo', 'rayquaza', 'kyogre', 'groudon', 'arceus'];
    if (uncatchables.some(u => opponent.name.toLowerCase().includes(u))) {
      await this.displayDialogue(`¡La inmensa energía de ${opponent.name} rechaza las Poké Balls!`);
      AudioManager.getInstance().playSfx('ball_break');
      this.showMainMenu();
      return;
    }

    // Crear el sprite de la Poké Ball (gráfico circular)
    const ball = this.add.graphics();
    ball.fillStyle(0xe74c3c, 1);
    ball.fillCircle(0, 0, 10);
    ball.fillStyle(0xffffff, 1);
    ball.fillRect(-10, -1, 20, 11);
    ball.lineStyle(2, 0x2c3e50, 1);
    ball.strokeCircle(0, 0, 10);
    ball.x = startX;
    ball.y = startY;

    await this.displayDialogue(`¡${this.battleManager.player.name} lanzó una ${ballId === 'poke_ball' ? 'Poké Ball' : 'Poké Ball'}!`);
    AudioManager.getInstance().playSfx('ball_throw');

    // Trayectoria parabólica: Bezier curvo hacia el oponente
    const midX = (startX + targetX) / 2;
    const midY = Math.min(startY, targetY) - 80; // Arco alto

    await new Promise<void>(resolve => {
      this.tweens.add({
        targets: ball,
        x: targetX, y: targetY,
        duration: 700,
        ease: 'Quad.easeOut',
        onUpdate: (tween) => {
          // Rotación de la Poké Ball durante el vuelo
          ball.angle += 8;
          // Arco bezier manual
          const t = tween.progress;
          ball.x = (1-t)*(1-t)*startX + 2*(1-t)*t*midX + t*t*targetX;
          ball.y = (1-t)*(1-t)*startY + 2*(1-t)*t*midY + t*t*targetY;
        },
        onComplete: () => resolve()
      });
    });

    // Absorción: el Pokémon se encoge y la ball parpadea en rojo
    await this.tweenPromise({ targets: this.opponentSprite, scaleX: 0, scaleY: 0, alpha: 0.3, duration: 300, ease: 'Power2' });
    this.cameras.main.flash(200, 255, 0, 0);
    AudioManager.getInstance().playSfx('ball_bounce');
    (this.opponentSprite as Phaser.GameObjects.Rectangle).setAlpha(0);
    await this.delay(200);

    // Calcular probabilidad de captura
    const hpRatio = opponent.currentHp / opponent.maxHp;
    const catchRate = 0.55 - (hpRatio * 0.35); // Base 55%, menos si tiene más vida
    const shakes = Math.min(3, Math.floor(catchRate * 4));
    const caught = Math.random() < catchRate;

    // Animación de rebotes en el suelo (1 a 3 sacudidas)
    ball.y = targetY + 20;
    for (let s = 0; s < shakes; s++) {
      AudioManager.getInstance().playSfx('ball_wiggle');
      await this.tweenPromise({ targets: ball, angle: ball.angle + 25,  duration: 200, ease: 'Sine.easeInOut' });
      await this.tweenPromise({ targets: ball, angle: ball.angle - 25, duration: 200, ease: 'Sine.easeInOut' });
      await this.delay(100);
    }

    if (caught) {
      // ✅ Captura exitosa
      AudioManager.getInstance().playSfx('ball_catch');
      this.cameras.main.flash(400, 255, 255, 0);
      await this.displayDialogue(`¡${opponent.name} fue capturado!`);
      await this.delay(400);

      // Destellos de estrellas
      for (let i = 0; i < 6; i++) {
        const star = this.add.text(ball.x + Phaser.Math.Between(-40, 40), ball.y + Phaser.Math.Between(-40, 20), '✦', { fontSize: '18px', color: '#f1c40f' });
        this.tweens.add({ targets: star, alpha: 0, y: star.y - 30, duration: 600, onComplete: () => star.destroy() });
      }

      await this.displayDialogue(`¡${opponent.name} ha sido registrado en la Pokédex!`);
      this.battleManager.isBattleOver = true;
      this.battleManager.winner = 'player';
      await this.delay(1200);
      this.endBattle();
    } else {
      // ❌ Escape de la Poké Ball
      AudioManager.getInstance().playSfx('ball_break');
      await this.tweenPromise({ targets: ball, angle: ball.angle + 45, duration: 250, ease: 'Power2' });
      ball.destroy();
      // El Pokémon vuelve a aparecer
      (this.opponentSprite as Phaser.GameObjects.Rectangle).setAlpha(1).setScale(1);
      await this.tweenPromise({ targets: this.opponentSprite, scaleX: 1, scaleY: 1, alpha: 1, duration: 300 });
      await this.displayDialogue(`¡Oh! ¡${opponent.name} se liberó!`);
      await this.delay(500);
    }

    this.catchAttemptInProgress = false;
  }

  // Objeto curativo
  private async useHealingItem(itemId: string, itemName: string): Promise<void> {
    const player = this.battleManager.player;
    let healAmount = 0;
    if (itemId === 'potion')       healAmount = 20;
    if (itemId === 'super_potion') healAmount = 50;
    if (itemId === 'antidote')     healAmount = 0; // Cura estado (futura implementación)

    const before = player.currentHp;
    player.currentHp = Math.min(player.maxHp, player.currentHp + healAmount);
    const healed = player.currentHp - before;

    await this.displayDialogue(`¡${player.name} usó ${itemName}!`);
    await this.animateHpReduction('player', player.currentHp, player.maxHp);
    if (healed > 0) await this.displayDialogue(`¡${player.name} recuperó ${healed} PS!`);
    await this.delay(400);
  }

  // Huir
  private async tryRun(): Promise<void> {
    this.hideAllMenus();
    this.isProcessingTurn = true;
    const canEscape = !this.battleManager.is_trainer_battle;
    if (canEscape) {
      await this.displayDialogue(`¡${this.battleManager.player.name} huyó del combate!`);
      await this.delay(1000);
      this.endBattle();
    } else {
      await this.displayDialogue('¡No puedes huir de un combate de entrenador!');
      await this.delay(800);
      this.showMainMenu();
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // ANIMACIÓN DE PASOS DEL TURNO (pipeline async)
  // ──────────────────────────────────────────────────────────────────────────────

  private async animateTurnSequence(result: TurnResult): Promise<void> {
    for (const step of result.steps) {
      switch (step.type) {
        case 'USE_MOVE':
          await this.displayDialogue(step.message);
          if (step.move) {
            AudioManager.getInstance().playMoveSfx(step.move.type, step.move.category);
          }
          await this.animateMoveExecution(step.actor);
          break;
        case 'MOVE_MISS':
          await this.displayDialogue(step.message);
          await this.delay(700);
          break;
        case 'DAMAGE':
          if (step.effectiveness === 'super_effective') {
            AudioManager.getInstance().playSfx('super_effective');
          } else if (step.effectiveness === 'not_very_effective') {
            AudioManager.getInstance().playSfx('not_very_effective');
          } else if (step.effectiveness === 'immune') {
            AudioManager.getInstance().playSfx('immune');
          } else {
            AudioManager.getInstance().playSfx('normal_hit');
          }
          if (step.target && step.targetHpAfter !== undefined && step.targetMaxHp !== undefined) {
            await this.animateHpReduction(step.target, step.targetHpAfter, step.targetMaxHp);
          }
          break;
        case 'CRITICAL_HIT':
          AudioManager.getInstance().playSfx('crit_hit');
          await this.displayDialogue(step.message);
          await this.delay(800);
          break;
        case 'EFFECTIVENESS':
          await this.displayDialogue(step.message);
          await this.delay(800);
          break;
        case 'MEGA_EVOLUTION':
          AudioManager.getInstance().playSfx('mega_evolution');
          await this.animateMegaEvolution(step.actor, step.message);
          break;
        case 'WEATHER_EFFECT':
          await this.displayDialogue(step.message);
          await this.delay(700);
          break;
        case 'FAINT':
          AudioManager.getInstance().playSfx('faint');
          await this.displayDialogue(step.message);
          await this.animateFaint(step.actor);
          break;
        case 'BATTLE_END':
          await this.displayDialogue(step.message);
          // 2.9 — Animación de EXP si el jugador ganó
          if (result.winner === 'player') {
            AudioManager.getInstance().playVictoryBgm(this.getBattleBgmType());
            await this.animateExpGain();
          }
          break;
        case 'MESSAGE':
          await this.displayDialogue(step.message);
          await this.delay(700);
          break;
      }
    }
  }

  // 2.9 — Barra de EXP animada + subida de nivel
  private async animateExpGain(): Promise<void> {
    const opponent = this.battleManager.opponent;
    const expGained = Math.floor(opponent.level * 5 + 10); // Fórmula simplificada
    await this.displayDialogue(`¡${this.battleManager.player.name} ganó ${expGained} puntos de EXP!`);
    AudioManager.getInstance().playSfx('exp_gain');

    const sx = this.scale.width - 330 + 48, sy = this.scale.height - 265 + 90;
    const targetRatio = Math.min(1, this.currentExpRatio + expGained / 100);

    await this.tweenPromise({
      targets: { ratio: this.currentExpRatio },
      ratio: targetRatio,
      duration: 900,
      ease: 'Linear',
      onUpdate: (tween: Phaser.Tweens.Tween) => {
        const current = (tween.targets[0] as { ratio: number }).ratio;
        this.drawExpBar(this.expBarFill, sx, sy, this.EXP_BAR_WIDTH, 8, current);
      }
    });

    // ¿Sube de nivel?
    if (targetRatio >= 1) {
      this.currentExpRatio = 0;
      this.drawExpBar(this.expBarFill, sx, sy, this.EXP_BAR_WIDTH, 8, 0);
      this.battleManager.player.level++;
      this.playerLevelText.setText(`Nv.${this.battleManager.player.level}`);
      this.cameras.main.flash(500, 255, 255, 255);
      AudioManager.getInstance().playSfx('level_up');
      await this.displayDialogue(`¡${this.battleManager.player.name} subió al nivel ${this.battleManager.player.level}!`);
    } else {
      this.currentExpRatio = targetRatio;
    }
  }

  // 5.4 — Cinemática de Mega-Evolución
  private async animateMegaEvolution(side: 'player' | 'opponent', message: string): Promise<void> {
    const targetSprite = side === 'player' ? this.playerSprite : this.opponentSprite;
    const isPlayer = side === 'player';

    await this.displayDialogue(message);

    // 1. Flash prismático / arcoíris en cámara
    this.cameras.main.flash(400, 16, 185, 129);

    // 2. Destellos / Rayos de energía telúrica alrededor del sprite
    const burstParticles: Phaser.GameObjects.Text[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const dist = 50;
      const spark = this.add.text(
        targetSprite.x + Math.cos(angle) * dist,
        targetSprite.y + Math.sin(angle) * dist,
        '✨',
        { fontSize: '18px', color: '#fbbf24' }
      ).setOrigin(0.5);
      burstParticles.push(spark);

      this.tweens.add({
        targets: spark,
        x: targetSprite.x,
        y: targetSprite.y,
        alpha: 0,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 500,
        ease: 'Quad.easeIn',
        onComplete: () => spark.destroy()
      });
    }

    // 3. Pulsación del sprite con expansión
    await this.tweenPromise({
      targets: targetSprite,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 300,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    // 4. Actualizar textos de HUD con etiqueta [MEGA]
    if (isPlayer) {
      this.playerNameText.setText(`${this.battleManager.player.name} ✨`);
      (this.playerSprite as Phaser.GameObjects.Rectangle).setStrokeStyle(4, 0xf59e0b);
    } else {
      this.oppNameText.setText(`${this.battleManager.opponent.name} ✨`);
      (this.opponentSprite as Phaser.GameObjects.Rectangle).setStrokeStyle(4, 0xf59e0b);
    }

    await this.delay(600);
  }

  private async animateMoveExecution(side: 'player' | 'opponent'): Promise<void> {
    const attacker = side === 'player' ? this.playerSprite : this.opponentSprite;
    const defender = side === 'player' ? this.opponentSprite : this.playerSprite;
    const dx = side === 'player' ? 30 : -30;
    const origX = attacker.x;
    await this.tweenPromise({ targets: attacker, x: origX + dx, duration: 120, yoyo: true, ease: 'Power2' });
    const origDX = defender.x;
    await this.tweenPromise({ targets: defender, x: origDX + 8, duration: 50, yoyo: true, repeat: 3, ease: 'Sine.easeInOut' });
    defender.x = origDX;
  }

  public async animateHpReduction(target: 'player' | 'opponent', newHp: number, maxHp: number): Promise<void> {
    const isPlayer = target === 'player';
    const startHp  = isPlayer ? this.playerCurrentHpVisual : this.oppCurrentHpVisual;
    const startRatio = Math.max(0, startHp / maxHp);
    const targetRatio = Math.max(0, newHp / maxHp);
    const data = { ratio: startRatio, hp: startHp };

    await this.tweenPromise({
      targets: data,
      ratio: targetRatio,
      hp: newHp,
      duration: 800,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        if (isPlayer) {
          const sx = this.scale.width - 330 + 48, sy = this.scale.height - 265 + 45;
          this.drawHpBar(this.playerHpBarFill, sx, sy, this.PLAYER_HP_WIDTH, 14, data.ratio);
          this.playerHpValueText.setText(`${Math.ceil(data.hp)} / ${maxHp}`);
        } else {
          this.drawHpBar(this.oppHpBarFill, 50 + 48, 50 + 45, this.OPP_HP_WIDTH, 14, data.ratio);
        }
      }
    });

    if (isPlayer) this.playerCurrentHpVisual = newHp;
    else           this.oppCurrentHpVisual    = newHp;
  }

  private async animateFaint(side: 'player' | 'opponent'): Promise<void> {
    const target = side === 'player' ? this.playerSprite : this.opponentSprite;
    await this.tweenPromise({ targets: target, y: target.y + 60, alpha: 0, duration: 800, ease: 'Power2' });
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────────────────────────────────────

  private drawHpBar(g: Phaser.GameObjects.Graphics, x: number, y: number, totalW: number, h: number, ratio: number): void {
    g.clear();
    const w = Math.max(0, totalW * Phaser.Math.Clamp(ratio, 0, 1));
    if (w <= 0) return;
    g.fillStyle(ratio > 0.5 ? 0x2ecc71 : ratio > 0.2 ? 0xf39c12 : 0xe74c3c, 1);
    g.fillRoundedRect(x, y, w, h, 4);
  }

  private drawExpBar(g: Phaser.GameObjects.Graphics, x: number, y: number, totalW: number, h: number, ratio: number): void {
    g.clear();
    const w = Math.max(0, totalW * Phaser.Math.Clamp(ratio, 0, 1));
    if (w <= 0) return;
    g.fillStyle(0x3498db, 1);
    g.fillRect(x, y, w, h);
  }

  private displayDialogue(text: string): Promise<void> {
    this.dialogueText.setText(text);
    return Promise.resolve();
  }

  private hideAllMenus(): void {
    this.mainMenuContainer.setVisible(false);
    this.moveMenuContainer.setVisible(false);
    this.partyMenuContainer.setVisible(false);
    this.bagMenuContainer.setVisible(false);
  }

  private tweenPromise(cfg: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise(resolve => this.tweens.add({ ...cfg, onComplete: (tw, tgts) => { (cfg as any).onComplete?.(tw, tgts); resolve(); } }));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => this.time.delayedCall(ms, resolve));
  }

  private setupKeyboard(): void {
    if (!this.input.keyboard) return;
    this.cursors  = this.input.keyboard.createCursorKeys();
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.zKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.xKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.escKey   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  private async startBattleIntro(): Promise<void> {
    this.isProcessingTurn = true;
    if (this.encounterType === 'trainer') {
      await this.displayDialogue(`¡${this.battleManager.opponent.name} quiere combatir!`);
    } else {
      await this.displayDialogue(`¡Un ${this.battleManager.opponent.name} salvaje apareció!`);
    }
    await this.delay(1100);
    await this.displayDialogue(`¡Adelante, ${this.battleManager.player.name}!`);
    await this.delay(900);
    this.isProcessingTurn = false;
    this.showMainMenu();
  }

  private finishTurn(result: TurnResult): void {
    if (!result.isBattleOver) {
      this.showMainMenu();
    } else {
      this.time.delayedCall(1500, () => this.endBattle());
    }
  }

  private endBattle(): void {
    const playerWon = this.battleManager.winner === 'player';
    // 7.1 — Reanudar música ambiental del Overworld
    AudioManager.getInstance().resumePreviousOverworldBgm();

    this.cameras.main.fade(700, 0, 0, 0, false, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
      if (p < 1) return;
      if (this.encounterType === 'trainer') {
        // Emitir evento para que OverworldScene gestione recompensas post-combate
        this.events.emit('battleEnd', playerWon);
        this.scene.stop();
        if (this.scene.isPaused('OverworldScene')) {
          this.scene.resume('OverworldScene');
        }
      } else {
        this.scene.start('OverworldScene', {
          mapKey: this.mapName
        });
      }
    });
  }

  // Propiedades de tipo de encuentro (deben estar al inicio del update cycle)
  private encounterType: 'wild' | 'trainer' = 'wild';
  private trainerId: string = '';
  private mapName: string = 'villa_tranquimar';

  // Exponer para BattleManager
  get is_trainer_battle(): boolean { return this.battleManager.is_trainer_battle; }
}

