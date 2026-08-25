import * as Phaser from 'phaser';
import { BattlePokemon, BattleMove } from '../core/battle';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS DEL SISTEMA DE ALMACENAMIENTO PC
// ─────────────────────────────────────────────────────────────────────────────

export interface PCBox {
  id: number;
  name: string;
  wallpaperColor: number;
  pokemon: (BattlePokemon | null)[]; // 30 casillas (5 filas x 6 columnas)
}

export type PCMode = 'NAVIGATE' | 'ACTION_MENU' | 'HOLDING' | 'SUMMARY';
export type PCFocusArea = 'PARTY' | 'BOX' | 'BOX_HEADER';

/**
 * PCStorageUI — Sistema de Almacenamiento Pokémon en PC (8 Cajas).
 *
 * Responsabilidades:
 * - 8 cajas de 30 casillas cada una (240 Pokémon de capacidad).
 * - Depositar desde el equipo a la caja (protección: mínimo 1 Pokémon en equipo).
 * - Retirar desde la caja al equipo (protección: máximo 6 Pokémon en equipo).
 * - Mover e intercambiar Pokémon libremente entre equipo y cajas.
 * - Panel de Resumen/Datos detallados (Stats, Movimientos, Tipos, PS).
 * - Navegación intuitiva con Teclado (WASD/Flechas/Enter/Z/X/Esc) y Ratón.
 */
export class PCStorageUI {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private isVisible: boolean = false;

  // Cajas del PC (8 cajas de 30 casillas)
  public boxes: PCBox[] = [];
  public currentBoxIndex: number = 0;
  public readonly TOTAL_BOXES = 8;
  public readonly BOX_CAPACITY = 30; // 5 filas x 6 columnas

  // Referencia al equipo del jugador
  public partyRef: BattlePokemon[] = [];

  // Estado de navegación
  private mode: PCMode = 'NAVIGATE';
  private focusArea: PCFocusArea = 'BOX';
  private selectedPartyIndex: number = 0;
  private selectedBoxSlotIndex: number = 0; // 0..29

  // Pokémon sostenido en mano (para mover/intercambiar)
  private heldPokemon: BattlePokemon | null = null;
  private heldSource: { area: 'PARTY' | 'BOX'; index: number; boxIndex?: number } | null = null;

  // Elementos gráficos interactivos
  private boxGridGraphics: Phaser.GameObjects.Graphics[] = [];
  private partySlotsGraphics: Phaser.GameObjects.Graphics[] = [];
  private boxHeaderContainer!: Phaser.GameObjects.Container;
  private summaryContainer!: Phaser.GameObjects.Container;
  private actionMenuContainer!: Phaser.GameObjects.Container;
  private messageText!: Phaser.GameObjects.Text;

  // Teclas
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private zKey!: Phaser.Input.Keyboard.Key;
  private xKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;
  private tabKey!: Phaser.Input.Keyboard.Key;

  // Colores de cajas de PC temáticas de Andara
  private readonly BOX_THEMES = [
    { name: 'Pradera Tranquimar', color: 0x27ae60 },
    { name: 'Cumbre Altiplano',    color: 0xd35400 },
    { name: 'Costa Esmeralda',    color: 0x2980b9 },
    { name: 'Selva Nubosa',       color: 0x16a085 },
    { name: 'Metrópolis Solsticio',color: 0x8e44ad },
    { name: 'Volcán Telúrico',    color: 0xc0392b },
    { name: 'Caverna Zygarde',    color: 0x34495e },
    { name: 'Aurora Celestial',   color: 0x1abc9c },
  ];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initBoxes();
    this.setupKeyboard();
  }

  /**
   * Inicializa las 8 cajas con 30 slots vacíos cada una.
   */
  private initBoxes(): void {
    this.boxes = [];
    for (let i = 0; i < this.TOTAL_BOXES; i++) {
      const theme = this.BOX_THEMES[i] || { name: `Caja ${i + 1}`, color: 0x34495e };
      const slots: (BattlePokemon | null)[] = new Array(this.BOX_CAPACITY).fill(null);
      this.boxes.push({
        id: i + 1,
        name: theme.name,
        wallpaperColor: theme.color,
        pokemon: slots,
      });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // APERTURA Y CIERRE
  // ──────────────────────────────────────────────────────────────────────────────

  /**
   * Abre la interfaz del PC de Almacenamiento.
   * @param party - Referencia al equipo del jugador.
   * @param initialBoxes - Datos previos guardados de cajas (opcional).
   */
  public open(party: BattlePokemon[], initialBoxes?: (BattlePokemon | null)[][]): void {
    if (this.isVisible) return;
    this.partyRef = party;

    if (initialBoxes && initialBoxes.length > 0) {
      initialBoxes.forEach((boxSlots, idx) => {
        if (this.boxes[idx]) {
          this.boxes[idx].pokemon = [...boxSlots];
          while (this.boxes[idx].pokemon.length < this.BOX_CAPACITY) {
            this.boxes[idx].pokemon.push(null);
          }
        }
      });
    }

    this.isVisible = true;
    this.mode = 'NAVIGATE';
    this.focusArea = 'BOX';
    this.selectedPartyIndex = 0;
    this.selectedBoxSlotIndex = 0;
    this.heldPokemon = null;
    this.heldSource = null;

    this.buildUI();
  }

  public close(): void {
    if (this.container) this.container.destroy();
    this.isVisible = false;
    this.heldPokemon = null;
    this.heldSource = null;
  }

  public get visible(): boolean {
    return this.isVisible;
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // CONSTRUCCIÓN DE UI
  // ──────────────────────────────────────────────────────────────────────────────

  private buildUI(): void {
    if (this.container) this.container.destroy();
    const { width, height } = this.scene.scale;
    this.container = this.scene.add.container(0, 0).setDepth(100);

    // Fondo oscurecido con viñeta
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0f172a, 0.95);
    bg.fillRect(0, 0, width, height);
    this.container.add(bg);

    const mainPanelW = width - 40;
    const mainPanelH = height - 40;
    const px = 20, py = 20;

    // Marco principal retro-moderno
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x1e293b, 0.98);
    panel.fillRoundedRect(px, py, mainPanelW, mainPanelH, 16);
    panel.lineStyle(4, 0x38bdf8, 1);
    panel.strokeRoundedRect(px, py, mainPanelW, mainPanelH, 16);
    this.container.add(panel);

    // Barra de título
    const header = this.scene.add.graphics();
    header.fillStyle(0x0284c7, 1);
    header.fillRoundedRect(px + 2, py + 2, mainPanelW - 4, 48, { tl: 14, tr: 14, bl: 0, br: 0 });
    this.container.add(header);

    this.container.add(
      this.scene.add.text(px + 24, py + 24, '💻 SISTEMA DE ALMACENAMIENTO POKÉMON — ANDARA OS', {
        fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold', color: '#ffffff',
      }).setOrigin(0, 0.5)
    );

    // 1. Panel Izquierdo: Equipo Pokémon (Party)
    this.buildPartyPanel(px + 20, py + 65, 230, mainPanelH - 120);

    // 2. Panel Central: Caja de PC Actual (Box Grid 6x5)
    this.buildBoxPanel(px + 270, py + 65, mainPanelW - 290, mainPanelH - 120);

    // 3. Barra Inferior de Estado / Mensajes
    this.messageText = this.scene.add.text(px + mainPanelW / 2, py + mainPanelH - 25, 'Z/Enter: Seleccionar  |  X/Esc: Salir  |  TAB: Cambiar entre Equipo y Caja  |  ←/→: Cambiar de Caja', {
      fontFamily: 'Arial', fontSize: '12px', color: '#94a3b8', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.container.add(this.messageText);

    this.refreshAllHighlights();
  }

  // ──── PANEL DEL EQUIPO (IZQUIERDA) ────

  private buildPartyPanel(x: number, y: number, w: number, h: number): void {
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0f172a, 0.8);
    bg.fillRoundedRect(x, y, w, h, 12);
    bg.lineStyle(2, 0x475569, 1);
    bg.strokeRoundedRect(x, y, w, h, 12);
    this.container.add(bg);

    const title = this.scene.add.text(x + w / 2, y + 20, `🐾 EQUIPO (${this.partyRef.length}/6)`, {
      fontFamily: 'Arial', fontSize: '14px', fontStyle: 'bold', color: '#f8fafc'
    }).setOrigin(0.5);
    this.container.add(title);

    this.partySlotsGraphics = [];
    const slotH = 52;
    const startY = y + 42;

    for (let i = 0; i < 6; i++) {
      const slotY = startY + i * (slotH + 8);
      const slotContainer = this.scene.add.container(x + 10, slotY);

      const slotBg = this.scene.add.graphics();
      slotBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, w - 20, slotH), Phaser.Geom.Rectangle.Contains);
      const slotIdx = i;
      slotBg.on('pointerdown', () => {
        this.focusArea = 'PARTY';
        this.selectedPartyIndex = slotIdx;
        this.onSlotSelected();
      });
      slotBg.on('pointerover', () => {
        this.focusArea = 'PARTY';
        this.selectedPartyIndex = slotIdx;
        this.refreshAllHighlights();
      });

      slotContainer.add(slotBg);
      this.partySlotsGraphics.push(slotBg);

      const pkmn = this.partyRef[i] as BattlePokemon | undefined;
      if (pkmn) {
        // Poké Ball Icon
        const ballIcon = this.scene.add.graphics();
        ballIcon.fillStyle(0xef4444, 1);
        ballIcon.fillCircle(16, 26, 8);
        ballIcon.fillStyle(0xffffff, 1);
        ballIcon.fillRect(8, 26, 16, 8);
        ballIcon.lineStyle(1, 0x1e293b, 1);
        ballIcon.strokeCircle(16, 26, 8);
        slotContainer.add(ballIcon);

        const nameT = this.scene.add.text(32, 10, pkmn.name, {
          fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold', color: '#ffffff'
        });
        const lvlT = this.scene.add.text(w - 30, 12, `Nv.${pkmn.level}`, {
          fontFamily: 'Arial', fontSize: '11px', color: '#cbd5e1'
        }).setOrigin(1, 0);

        // Barra de vida mini
        const hpBarBg = this.scene.add.graphics();
        hpBarBg.fillStyle(0x334155, 1);
        hpBarBg.fillRect(32, 32, 120, 6);
        const hpBarFill = this.scene.add.graphics();
        const ratio = Math.max(0, pkmn.currentHp / pkmn.maxHp);
        hpBarFill.fillStyle(ratio > 0.5 ? 0x22c55e : ratio > 0.2 ? 0xeab308 : 0xef4444, 1);
        hpBarFill.fillRect(32, 32, 120 * ratio, 6);

        const hpText = this.scene.add.text(w - 30, 28, `${pkmn.currentHp}/${pkmn.maxHp}`, {
          fontFamily: 'Arial', fontSize: '10px', color: '#94a3b8'
        }).setOrigin(1, 0);

        slotContainer.add([nameT, lvlT, hpBarBg, hpBarFill, hpText]);
      } else {
        const emptyT = this.scene.add.text((w - 20) / 2, slotH / 2, '— Vacío —', {
          fontFamily: 'Arial', fontSize: '12px', color: '#64748b'
        }).setOrigin(0.5);
        slotContainer.add(emptyT);
      }

      this.container.add(slotContainer);
    }
  }

  // ──── PANEL DE LA CAJA (CENTRAL / DERECHA) ────

  private buildBoxPanel(x: number, y: number, w: number, h: number): void {
    const currentBox = this.boxes[this.currentBoxIndex];

    // Contenedor del Wallpaper de la caja
    const boxBg = this.scene.add.graphics();
    boxBg.fillStyle(currentBox.wallpaperColor, 0.25);
    boxBg.fillRoundedRect(x, y, w, h, 12);
    boxBg.lineStyle(2, currentBox.wallpaperColor, 1);
    boxBg.strokeRoundedRect(x, y, w, h, 12);
    this.container.add(boxBg);

    // Cabecera de la caja con selector (< Caja 1 / 8 >)
    this.boxHeaderContainer = this.scene.add.container(x, y + 10);

    const headerBg = this.scene.add.graphics();
    headerBg.fillStyle(0x0f172a, 0.85);
    headerBg.fillRoundedRect(w / 2 - 160, 0, 320, 36, 8);
    headerBg.lineStyle(2, 0x38bdf8, 1);
    headerBg.strokeRoundedRect(w / 2 - 160, 0, 320, 36, 8);
    this.boxHeaderContainer.add(headerBg);

    // Flecha izquierda
    const leftBtn = this.scene.add.text(w / 2 - 140, 18, '◀', {
      fontFamily: 'Arial', fontSize: '16px', color: '#38bdf8', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive();
    leftBtn.on('pointerdown', () => this.changeBox(-1));

    // Nombre de la caja
    const boxTitle = this.scene.add.text(w / 2, 18, `${currentBox.name} (${this.currentBoxIndex + 1}/${this.TOTAL_BOXES})`, {
      fontFamily: 'Arial', fontSize: '14px', fontStyle: 'bold', color: '#f8fafc'
    }).setOrigin(0.5);

    // Flecha derecha
    const rightBtn = this.scene.add.text(w / 2 + 140, 18, '▶', {
      fontFamily: 'Arial', fontSize: '16px', color: '#38bdf8', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive();
    rightBtn.on('pointerdown', () => this.changeBox(1));

    this.boxHeaderContainer.add([leftBtn, boxTitle, rightBtn]);
    this.container.add(this.boxHeaderContainer);

    // Cuadrícula 6 columnas x 5 filas (30 slots)
    this.boxGridGraphics = [];
    const cols = 6;
    const rows = 5;
    const slotW = (w - 60) / cols;
    const slotH = (h - 90) / rows;
    const startX = x + 30;
    const startY = y + 60;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const slotIdx = r * cols + c;
        const sx = startX + c * slotW;
        const sy = startY + r * slotH;

        const slotContainer = this.scene.add.container(sx, sy);
        const slotBg = this.scene.add.graphics();
        slotBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, slotW - 6, slotH - 6), Phaser.Geom.Rectangle.Contains);

        const thisIdx = slotIdx;
        slotBg.on('pointerdown', () => {
          this.focusArea = 'BOX';
          this.selectedBoxSlotIndex = thisIdx;
          this.onSlotSelected();
        });
        slotBg.on('pointerover', () => {
          this.focusArea = 'BOX';
          this.selectedBoxSlotIndex = thisIdx;
          this.refreshAllHighlights();
        });

        slotContainer.add(slotBg);
        this.boxGridGraphics.push(slotBg);

        const pkmn = currentBox.pokemon[slotIdx];
        if (pkmn) {
          // Sprite placeholder estilizado
          const icon = this.scene.add.graphics();
          icon.fillStyle(0x38bdf8, 1);
          icon.fillCircle((slotW - 6) / 2, (slotH - 6) / 2 - 6, 12);
          icon.fillStyle(0x0284c7, 1);
          icon.fillCircle((slotW - 6) / 2, (slotH - 6) / 2 - 6, 6);

          const nameT = this.scene.add.text((slotW - 6) / 2, (slotH - 6) - 14, pkmn.name, {
            fontFamily: 'Arial', fontSize: '10px', fontStyle: 'bold', color: '#ffffff'
          }).setOrigin(0.5);

          const lvlT = this.scene.add.text((slotW - 6) - 6, 4, `N.${pkmn.level}`, {
            fontFamily: 'Arial', fontSize: '9px', color: '#cbd5e1'
          }).setOrigin(1, 0);

          slotContainer.add([icon, nameT, lvlT]);
        }

        this.container.add(slotContainer);
      }
    }
  }

  // ──── ACTUALIZAR HIGHLIGHTS ────

  private refreshAllHighlights(): void {
    // 1. Party Slots
    this.partySlotsGraphics.forEach((bg, idx) => {
      bg.clear();
      const isSelected = this.focusArea === 'PARTY' && idx === this.selectedPartyIndex;
      const isHoldingOrigin = this.heldSource?.area === 'PARTY' && this.heldSource.index === idx;

      if (isHoldingOrigin) {
        bg.fillStyle(0xf59e0b, 0.4);
        bg.fillRoundedRect(0, 0, 210, 52, 8);
        bg.lineStyle(2, 0xfbbf24, 1);
        bg.strokeRoundedRect(0, 0, 210, 52, 8);
      } else if (isSelected) {
        bg.fillStyle(0x0284c7, 0.6);
        bg.fillRoundedRect(0, 0, 210, 52, 8);
        bg.lineStyle(3, 0x38bdf8, 1);
        bg.strokeRoundedRect(0, 0, 210, 52, 8);
      } else {
        bg.fillStyle(0x1e293b, 0.85);
        bg.fillRoundedRect(0, 0, 210, 52, 8);
        bg.lineStyle(1, 0x475569, 1);
        bg.strokeRoundedRect(0, 0, 210, 52, 8);
      }
    });

    // 2. Box Grid Slots
    const { width, height } = this.scene.scale;
    const mainPanelW = width - 40;
    const mainPanelH = height - 40;
    const slotW = (mainPanelW - 350) / 6;
    const slotH = (mainPanelH - 210) / 5;

    this.boxGridGraphics.forEach((bg, idx) => {
      bg.clear();
      const isSelected = this.focusArea === 'BOX' && idx === this.selectedBoxSlotIndex;
      const isHoldingOrigin =
        this.heldSource?.area === 'BOX' &&
        this.heldSource.boxIndex === this.currentBoxIndex &&
        this.heldSource.index === idx;

      if (isHoldingOrigin) {
        bg.fillStyle(0xf59e0b, 0.4);
        bg.fillRoundedRect(0, 0, slotW - 6, slotH - 6, 8);
        bg.lineStyle(2, 0xfbbf24, 1);
        bg.strokeRoundedRect(0, 0, slotW - 6, slotH - 6, 8);
      } else if (isSelected) {
        bg.fillStyle(0x0284c7, 0.6);
        bg.fillRoundedRect(0, 0, slotW - 6, slotH - 6, 8);
        bg.lineStyle(3, 0x38bdf8, 1);
        bg.strokeRoundedRect(0, 0, slotW - 6, slotH - 6, 8);
      } else {
        bg.fillStyle(0x0f172a, 0.6);
        bg.fillRoundedRect(0, 0, slotW - 6, slotH - 6, 8);
        bg.lineStyle(1, 0x334155, 1);
        bg.strokeRoundedRect(0, 0, slotW - 6, slotH - 6, 8);
      }
    });

    // Feedback en mensaje
    if (this.heldPokemon) {
      this.messageText.setText(`✊ Moviendo a ${this.heldPokemon.name}. Elige casilla de destino y pulsa Z/Enter.`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // ACCIONES Y LÓGICA DE ALMACENAMIENTO
  // ──────────────────────────────────────────────────────────────────────────────

  private onSlotSelected(): void {
    if (this.heldPokemon) {
      // Estamos en modo mover: soltar o intercambiar
      this.dropOrSwapPokemon();
      return;
    }

    // Obtener el Pokémon apuntado
    const target = this.getSelectedPokemon();
    if (!target) return;

    // Abrir menú de acciones para el Pokémon seleccionado
    this.openActionMenu(target);
  }

  private getSelectedPokemon(): BattlePokemon | null {
    if (this.focusArea === 'PARTY') {
      return this.partyRef[this.selectedPartyIndex] || null;
    } else if (this.focusArea === 'BOX') {
      return this.boxes[this.currentBoxIndex].pokemon[this.selectedBoxSlotIndex] || null;
    }
    return null;
  }

  private openActionMenu(pkmn: BattlePokemon): void {
    if (this.actionMenuContainer) this.actionMenuContainer.destroy();
    this.mode = 'ACTION_MENU';

    const { width, height } = this.scene.scale;
    const mw = 200, mh = 170;
    const mx = width / 2 - mw / 2, my = height / 2 - mh / 2;

    this.actionMenuContainer = this.scene.add.container(0, 0).setDepth(120);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0f172a, 0.98);
    bg.fillRoundedRect(mx, my, mw, mh, 10);
    bg.lineStyle(3, 0x38bdf8, 1);
    bg.strokeRoundedRect(mx, my, mw, mh, 10);
    this.actionMenuContainer.add(bg);

    const header = this.scene.add.text(mx + mw / 2, my + 20, pkmn.name, {
      fontFamily: 'Arial', fontSize: '15px', fontStyle: 'bold', color: '#f8fafc'
    }).setOrigin(0.5);
    this.actionMenuContainer.add(header);

    const isParty = this.focusArea === 'PARTY';
    const actions = isParty
      ? [
          { label: '📦 Depositar en Caja', fn: () => this.depositSelected() },
          { label: '✋ Mover',             fn: () => this.startHolding() },
          { label: '📊 Ver Datos',         fn: () => this.showSummary(pkmn) },
        ]
      : [
          { label: '🐾 Retirar al Equipo', fn: () => this.withdrawSelected() },
          { label: '✋ Mover',             fn: () => this.startHolding() },
          { label: '📊 Ver Datos',         fn: () => this.showSummary(pkmn) },
        ];

    actions.forEach((act, idx) => {
      const by = my + 50 + idx * 36;
      const btnBg = this.scene.add.graphics();
      btnBg.fillStyle(0x1e293b, 1);
      btnBg.fillRoundedRect(mx + 10, by, mw - 20, 30, 6);
      btnBg.lineStyle(1, 0x475569, 1);
      btnBg.strokeRoundedRect(mx + 10, by, mw - 20, 30, 6);

      const btnTxt = this.scene.add.text(mx + mw / 2, by + 15, act.label, {
        fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold', color: '#e2e8f0'
      }).setOrigin(0.5);

      btnBg.setInteractive(new Phaser.Geom.Rectangle(mx + 10, by, mw - 20, 30), Phaser.Geom.Rectangle.Contains);
      btnBg.on('pointerdown', () => {
        if (this.actionMenuContainer) this.actionMenuContainer.destroy();
        this.mode = 'NAVIGATE';
        act.fn();
      });
      btnBg.on('pointerover', () => {
        btnBg.clear();
        btnBg.fillStyle(0x0284c7, 1);
        btnBg.fillRoundedRect(mx + 10, by, mw - 20, 30, 6);
        btnTxt.setColor('#ffffff');
      });
      btnBg.on('pointerout', () => {
        btnBg.clear();
        btnBg.fillStyle(0x1e293b, 1);
        btnBg.fillRoundedRect(mx + 10, by, mw - 20, 30, 6);
        btnBg.lineStyle(1, 0x475569, 1);
        btnBg.strokeRoundedRect(mx + 10, by, mw - 20, 30, 6);
        btnTxt.setColor('#e2e8f0');
      });

      this.actionMenuContainer.add([btnBg, btnTxt]);
    });

    this.container.add(this.actionMenuContainer);
  }

  // ──── DEPOSITAR ────

  private depositSelected(): void {
    if (this.partyRef.length <= 1) {
      this.showMessage('⚠️ ¡No puedes depositar a tu único Pokémon!', '#ef4444');
      return;
    }

    const currentBox = this.boxes[this.currentBoxIndex];
    const freeSlotIdx = currentBox.pokemon.findIndex(p => p === null);

    if (freeSlotIdx === -1) {
      this.showMessage(`⚠️ La caja '${currentBox.name}' está llena. Cambia de caja.`, '#ef4444');
      return;
    }

    const [pkmn] = this.partyRef.splice(this.selectedPartyIndex, 1);
    currentBox.pokemon[freeSlotIdx] = pkmn;

    this.selectedPartyIndex = Math.max(0, this.selectedPartyIndex - 1);
    this.showMessage(`✅ ¡${pkmn.name} fue guardado en ${currentBox.name}!`, '#22c55e');
    this.buildUI();
  }

  // ──── RETIRAR ────

  private withdrawSelected(): void {
    if (this.partyRef.length >= 6) {
      this.showMessage('⚠️ Tu equipo ya tiene 6 Pokémon. Deposita uno primero.', '#ef4444');
      return;
    }

    const currentBox = this.boxes[this.currentBoxIndex];
    const pkmn = currentBox.pokemon[this.selectedBoxSlotIndex];
    if (!pkmn) return;

    currentBox.pokemon[this.selectedBoxSlotIndex] = null;
    this.partyRef.push(pkmn);

    this.showMessage(`✅ ¡${pkmn.name} se unió a tu equipo!`, '#22c55e');
    this.buildUI();
  }

  // ──── INICIAR AGARRE / MOVER ────

  private startHolding(): void {
    const target = this.getSelectedPokemon();
    if (!target) return;

    this.heldPokemon = target;
    this.heldSource = {
      area: this.focusArea as 'PARTY' | 'BOX',
      index: this.focusArea === 'PARTY' ? this.selectedPartyIndex : this.selectedBoxSlotIndex,
      boxIndex: this.currentBoxIndex,
    };

    this.refreshAllHighlights();
  }

  // ──── SOLTAR O INTERCAMBIAR ────

  private dropOrSwapPokemon(): void {
    if (!this.heldPokemon || !this.heldSource) return;

    // Destino
    const destArea = this.focusArea;
    const destIndex = destArea === 'PARTY' ? this.selectedPartyIndex : this.selectedBoxSlotIndex;
    const destBox = this.boxes[this.currentBoxIndex];

    const targetAtDest = destArea === 'PARTY' ? this.partyRef[destIndex] || null : destBox.pokemon[destIndex];

    // Caso 1: Movimiento dentro de la misma casilla (cancelar agarre)
    if (
      this.heldSource.area === destArea &&
      this.heldSource.index === destIndex &&
      (destArea !== 'BOX' || this.heldSource.boxIndex === this.currentBoxIndex)
    ) {
      this.heldPokemon = null;
      this.heldSource = null;
      this.refreshAllHighlights();
      return;
    }

    // Regla de seguridad: Si estamos retirando el último del equipo
    if (
      this.heldSource.area === 'PARTY' &&
      destArea === 'BOX' &&
      targetAtDest === null &&
      this.partyRef.length <= 1
    ) {
      this.showMessage('⚠️ ¡No puedes dejar tu equipo completamente vacío!', '#ef4444');
      return;
    }

    // Ejecutar intercambio
    // 1. Quitar de origen
    if (this.heldSource.area === 'PARTY') {
      if (targetAtDest) {
        this.partyRef[this.heldSource.index] = targetAtDest;
      } else {
        this.partyRef.splice(this.heldSource.index, 1);
      }
    } else {
      const srcBox = this.boxes[this.heldSource.boxIndex ?? 0];
      srcBox.pokemon[this.heldSource.index] = targetAtDest;
    }

    // 2. Colocar en destino
    if (destArea === 'PARTY') {
      if (destIndex < this.partyRef.length) {
        this.partyRef[destIndex] = this.heldPokemon;
      } else {
        this.partyRef.push(this.heldPokemon);
      }
    } else {
      destBox.pokemon[destIndex] = this.heldPokemon;
    }

    this.heldPokemon = null;
    this.heldSource = null;
    this.buildUI();
  }

  // ──── PANTALLA DE DATOS / RESUMEN ────

  private showSummary(pkmn: BattlePokemon): void {
    if (this.summaryContainer) this.summaryContainer.destroy();
    this.mode = 'SUMMARY';

    const { width, height } = this.scene.scale;
    const sw = 500, sh = 400;
    const sx = width / 2 - sw / 2, sy = height / 2 - sh / 2;

    this.summaryContainer = this.scene.add.container(0, 0).setDepth(130);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0f172a, 0.98);
    bg.fillRoundedRect(sx, sy, sw, sh, 14);
    bg.lineStyle(3, 0x38bdf8, 1);
    bg.strokeRoundedRect(sx, sy, sw, sh, 14);
    this.summaryContainer.add(bg);

    // Cabecera
    const headerBg = this.scene.add.graphics();
    headerBg.fillStyle(0x0284c7, 1);
    headerBg.fillRoundedRect(sx + 2, sy + 2, sw - 4, 42, { tl: 12, tr: 12, bl: 0, br: 0 });
    this.summaryContainer.add(headerBg);

    this.summaryContainer.add(
      this.scene.add.text(sx + sw / 2, sy + 22, `📊 RESUMEN: ${pkmn.name.toUpperCase()} (Nv.${pkmn.level})`, {
        fontFamily: 'Arial', fontSize: '15px', fontStyle: 'bold', color: '#ffffff'
      }).setOrigin(0.5)
    );

    // Tipos
    const typeStr = pkmn.types.map(t => t.toUpperCase()).join(' / ');
    this.summaryContainer.add(this.scene.add.text(sx + 30, sy + 60, `Tipo: ${typeStr}`, { fontFamily: 'Arial', fontSize: '13px', color: '#38bdf8', fontStyle: 'bold' }));
    this.summaryContainer.add(this.scene.add.text(sx + 30, sy + 84, `PS: ${pkmn.currentHp} / ${pkmn.maxHp}`, { fontFamily: 'Arial', fontSize: '13px', color: '#e2e8f0' }));

    // Estadísticas
    const statsX = sx + 30, statsY = sy + 115;
    this.summaryContainer.add(this.scene.add.text(statsX, statsY, `Ataque: ${pkmn.attack}`, { fontFamily: 'Arial', fontSize: '12px', color: '#cbd5e1' }));
    this.summaryContainer.add(this.scene.add.text(statsX, statsY + 22, `Defensa: ${pkmn.defense}`, { fontFamily: 'Arial', fontSize: '12px', color: '#cbd5e1' }));
    this.summaryContainer.add(this.scene.add.text(statsX, statsY + 44, `Atq. Esp: ${pkmn.spAttack ?? pkmn.attack}`, { fontFamily: 'Arial', fontSize: '12px', color: '#cbd5e1' }));
    this.summaryContainer.add(this.scene.add.text(statsX, statsY + 66, `Def. Esp: ${pkmn.spDefense ?? pkmn.defense}`, { fontFamily: 'Arial', fontSize: '12px', color: '#cbd5e1' }));
    this.summaryContainer.add(this.scene.add.text(statsX, statsY + 88, `Velocidad: ${pkmn.speed}`, { fontFamily: 'Arial', fontSize: '12px', color: '#cbd5e1' }));

    // Movimientos
    const movesX = sx + 240, movesY = sy + 115;
    this.summaryContainer.add(this.scene.add.text(movesX, movesY - 25, 'MOVIMIENTOS:', { fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold', color: '#f59e0b' }));

    pkmn.moves.forEach((m, i) => {
      const my = movesY + i * 36;
      const mBg = this.scene.add.graphics();
      mBg.fillStyle(0x1e293b, 1);
      mBg.fillRoundedRect(movesX, my, 220, 30, 6);
      mBg.lineStyle(1, 0x475569, 1);
      mBg.strokeRoundedRect(movesX, my, 220, 30, 6);

      const mName = this.scene.add.text(movesX + 10, my + 8, m.name, { fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold', color: '#ffffff' });
      const mPP = this.scene.add.text(movesX + 210, my + 8, `PP ${m.pp}`, { fontFamily: 'Arial', fontSize: '11px', color: '#94a3b8' }).setOrigin(1, 0);

      this.summaryContainer.add([mBg, mName, mPP]);
    });

    // Botón volver
    const closeBtn = this.scene.add.graphics();
    closeBtn.fillStyle(0x38bdf8, 1);
    closeBtn.fillRoundedRect(sx + sw / 2 - 60, sy + sh - 45, 120, 32, 8);
    closeBtn.setInteractive(new Phaser.Geom.Rectangle(sx + sw / 2 - 60, sy + sh - 45, 120, 32), Phaser.Geom.Rectangle.Contains);
    closeBtn.on('pointerdown', () => {
      this.summaryContainer.destroy();
      this.mode = 'NAVIGATE';
    });

    const closeTxt = this.scene.add.text(sx + sw / 2, sy + sh - 29, 'Volver (X/Esc)', {
      fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold', color: '#0f172a'
    }).setOrigin(0.5);

    this.summaryContainer.add([closeBtn, closeTxt]);
    this.container.add(this.summaryContainer);
  }

  // ──── CAMBIO DE CAJA (< >) ────

  private changeBox(dir: number): void {
    this.currentBoxIndex = (this.currentBoxIndex + dir + this.TOTAL_BOXES) % this.TOTAL_BOXES;
    this.buildUI();
  }

  private showMessage(msg: string, color: string = '#38bdf8'): void {
    if (!this.messageText) return;
    this.messageText.setText(msg).setColor(color);
    this.scene.time.delayedCall(3000, () => {
      if (this.messageText && !this.heldPokemon) {
        this.messageText.setText('Z/Enter: Seleccionar  |  X/Esc: Salir  |  TAB: Cambiar entre Equipo y Caja  |  ←/→: Cambiar de Caja').setColor('#94a3b8');
      }
    });
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // ENTRADA POR TECLADO
  // ──────────────────────────────────────────────────────────────────────────────

  private setupKeyboard(): void {
    if (!this.scene.input.keyboard) return;
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.enterKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.zKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.xKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.tabKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
  }

  public handleInput(): void {
    if (!this.isVisible) return;

    // Cerrar Resumen o Menú de Acción con X/Esc
    if (Phaser.Input.Keyboard.JustDown(this.xKey) || Phaser.Input.Keyboard.JustDown(this.escKey)) {
      if (this.mode === 'SUMMARY') {
        if (this.summaryContainer) this.summaryContainer.destroy();
        this.mode = 'NAVIGATE';
        return;
      }
      if (this.mode === 'ACTION_MENU') {
        if (this.actionMenuContainer) this.actionMenuContainer.destroy();
        this.mode = 'NAVIGATE';
        return;
      }
      if (this.heldPokemon) {
        // Cancelar agarre
        this.heldPokemon = null;
        this.heldSource = null;
        this.refreshAllHighlights();
        return;
      }
      this.close();
      return;
    }

    if (this.mode !== 'NAVIGATE') return;

    // Cambiar de área con TAB o flechas laterales en bordes
    if (Phaser.Input.Keyboard.JustDown(this.tabKey)) {
      this.focusArea = this.focusArea === 'PARTY' ? 'BOX' : 'PARTY';
      this.refreshAllHighlights();
      return;
    }

    const up = Phaser.Input.Keyboard.JustDown(this.cursors.up);
    const down = Phaser.Input.Keyboard.JustDown(this.cursors.down);
    const left = Phaser.Input.Keyboard.JustDown(this.cursors.left);
    const right = Phaser.Input.Keyboard.JustDown(this.cursors.right);
    const confirm =
      Phaser.Input.Keyboard.JustDown(this.enterKey) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
      Phaser.Input.Keyboard.JustDown(this.zKey);

    if (this.focusArea === 'PARTY') {
      if (up) {
        this.selectedPartyIndex = Math.max(0, this.selectedPartyIndex - 1);
        this.refreshAllHighlights();
      }
      if (down) {
        this.selectedPartyIndex = Math.min(5, this.selectedPartyIndex + 1);
        this.refreshAllHighlights();
      }
      if (right) {
        this.focusArea = 'BOX';
        this.refreshAllHighlights();
      }
      if (confirm) {
        this.onSlotSelected();
      }
    } else if (this.focusArea === 'BOX') {
      const cols = 6;
      const rows = 5;
      const c = this.selectedBoxSlotIndex % cols;
      const r = Math.floor(this.selectedBoxSlotIndex / cols);

      if (left) {
        if (c === 0) {
          this.focusArea = 'PARTY';
        } else {
          this.selectedBoxSlotIndex--;
        }
        this.refreshAllHighlights();
      }
      if (right) {
        if (c === cols - 1) {
          // Cambiar a siguiente caja
          this.changeBox(1);
          this.selectedBoxSlotIndex = r * cols;
        } else {
          this.selectedBoxSlotIndex++;
        }
        this.refreshAllHighlights();
      }
      if (up) {
        if (r > 0) this.selectedBoxSlotIndex -= cols;
        this.refreshAllHighlights();
      }
      if (down) {
        if (r < rows - 1) this.selectedBoxSlotIndex += cols;
        this.refreshAllHighlights();
      }
      if (confirm) {
        this.onSlotSelected();
      }
    }
  }

  /**
   * Exporta el estado de las 8 cajas para persistencia en SaveData.
   */
  public exportBoxes(): (BattlePokemon | null)[][] {
    return this.boxes.map(b => [...b.pokemon]);
  }
}
