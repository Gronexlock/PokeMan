import * as Phaser from 'phaser';
import { SaveManager } from '../core/saveManager';
import { SaveData, PokemonInstance } from '../core/types';

export type SaveLoadMode = 'SAVE' | 'LOAD';

export interface SaveSlotMetadata {
  slot: string;
  name: string;
  exists: boolean;
  data: SaveData | null;
}

/**
 * SaveLoadUI — Sistema Visual de Guardado y Carga de Partida en Phaser 3.
 *
 * Responsabilidades:
 * - 3 Ranuras de guardado independientes (Ranura 1, 2, 3) con LocalStorage.
 * - Información rica por ranura: Nombre, Ubicación, Medallas, Dinero, Fecha y Hora.
 * - Animación visual de guardado con feedback ("Guardando... ¡Partida Guardada!").
 * - Diálogo de confirmación para sobreescribir o cargar partidas.
 * - Navegación fluida por Teclado y Ratón.
 */
export class SaveLoadUI {
  private scene: Phaser.Scene;
  private saveManager: SaveManager;
  private container!: Phaser.GameObjects.Container;
  private isVisible: boolean = false;

  // Modo actual: GUARDAR o CARGAR
  private mode: SaveLoadMode = 'SAVE';
  private selectedSlotIndex: number = 0;
  private readonly SLOTS = ['save_slot_1', 'save_slot_2', 'save_slot_3'];

  // Datos actuales del juego a guardar (si estamos en modo SAVE)
  private currentSaveDataGenerator: (() => SaveData) | null = null;
  private onLoadCallback: ((data: SaveData) => void) | null = null;

  // Elementos UI
  private slotContainers: Phaser.GameObjects.Container[] = [];
  private slotBackgrounds: Phaser.GameObjects.Graphics[] = [];
  private messageText!: Phaser.GameObjects.Text;
  private isSavingAnimation: boolean = false;

  // Teclas
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private zKey!: Phaser.Input.Keyboard.Key;
  private xKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.saveManager = new SaveManager();
    this.setupKeyboard();
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // APERTURA Y CIERRE
  // ──────────────────────────────────────────────────────────────────────────────

  /**
   * Abre la pantalla en modo GUARDAR.
   * @param saveDataGenerator - Función que devuelve el snapshot actual de SaveData.
   */
  public openSave(saveDataGenerator: () => SaveData): void {
    if (this.isVisible) return;
    this.mode = 'SAVE';
    this.currentSaveDataGenerator = saveDataGenerator;
    this.onLoadCallback = null;
    this.isVisible = true;
    this.selectedSlotIndex = 0;
    this.buildUI();
  }

  /**
   * Abre la pantalla en modo CARGAR.
   * @param onLoad - Callback ejecutado al confirmar la carga de una partida.
   */
  public openLoad(onLoad: (data: SaveData) => void): void {
    if (this.isVisible) return;
    this.mode = 'LOAD';
    this.onLoadCallback = onLoad;
    this.currentSaveDataGenerator = null;
    this.isVisible = true;
    this.selectedSlotIndex = 0;
    this.buildUI();
  }

  public close(): void {
    if (this.container) this.container.destroy();
    this.isVisible = false;
    this.isSavingAnimation = false;
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
    this.container = this.scene.add.container(0, 0).setDepth(120);

    // Fondo oscurecido
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x0f172a, 0.92);
    overlay.fillRect(0, 0, width, height);
    this.container.add(overlay);

    const pw = 680, ph = 460;
    const px = (width - pw) / 2, py = (height - ph) / 2;

    // Marco principal
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x1e293b, 0.98);
    panel.fillRoundedRect(px, py, pw, ph, 16);
    panel.lineStyle(4, this.mode === 'SAVE' ? 0x22c55e : 0x38bdf8, 1);
    panel.strokeRoundedRect(px, py, pw, ph, 16);
    this.container.add(panel);

    // Encabezado
    const header = this.scene.add.graphics();
    header.fillStyle(this.mode === 'SAVE' ? 0x15803d : 0x0369a1, 1);
    header.fillRoundedRect(px + 2, py + 2, pw - 4, 48, { tl: 14, tr: 14, bl: 0, br: 0 });
    this.container.add(header);

    const titleIcon = this.mode === 'SAVE' ? '💾 GUARDAR PARTIDA' : '📂 CARGAR PARTIDA';
    this.container.add(
      this.scene.add.text(px + pw / 2, py + 24, titleIcon, {
        fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold', color: '#ffffff'
      }).setOrigin(0.5)
    );

    // 3 Ranuras de Guardado
    this.buildSlotCards(px + 20, py + 65, pw - 40);

    // Mensaje de estado / feedback
    this.messageText = this.scene.add.text(px + pw / 2, py + ph - 25, '↑↓ Seleccionar Ranura  |  Z/Enter Confirmar  |  X/Esc Cancelar', {
      fontFamily: 'Arial', fontSize: '12px', color: '#94a3b8', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.container.add(this.messageText);

    this.refreshHighlight();
  }

  private buildSlotCards(x: number, y: number, w: number): void {
    this.slotContainers = [];
    this.slotBackgrounds = [];
    const slotH = 105;

    this.SLOTS.forEach((slotKey, idx) => {
      const sy = y + idx * (slotH + 12);
      const slotContainer = this.scene.add.container(x, sy);

      const slotBg = this.scene.add.graphics();
      slotBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, slotH), Phaser.Geom.Rectangle.Contains);

      const thisIdx = idx;
      slotBg.on('pointerdown', () => {
        if (this.isSavingAnimation) return;
        this.selectedSlotIndex = thisIdx;
        this.onConfirmSlot();
      });
      slotBg.on('pointerover', () => {
        if (this.isSavingAnimation) return;
        this.selectedSlotIndex = thisIdx;
        this.refreshHighlight();
      });

      slotContainer.add(slotBg);
      this.slotBackgrounds.push(slotBg);

      // Cargar datos existentes del slot
      const data = this.saveManager.loadGame(slotKey);

      // Título de Ranura
      const slotTitle = this.scene.add.text(16, 14, `RANURA ${idx + 1}`, {
        fontFamily: 'Arial', fontSize: '15px', fontStyle: 'bold', color: '#38bdf8'
      });
      slotContainer.add(slotTitle);

      if (data) {
        // Datos de la partida existente
        const nameText = this.scene.add.text(120, 14, `👤 ${data.player_name.toUpperCase()}`, {
          fontFamily: 'Arial', fontSize: '15px', fontStyle: 'bold', color: '#ffffff'
        });
        const badgeCount = data.badges?.length ?? 0;
        const badgesText = this.scene.add.text(w - 16, 14, `🏆 ${badgeCount}/8 Medallas`, {
          fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold', color: '#facc15'
        }).setOrigin(1, 0);

        const mapText = this.scene.add.text(16, 46, `📍 ${this.formatMapName(data.current_map)}`, {
          fontFamily: 'Arial', fontSize: '13px', color: '#cbd5e1'
        });
        const moneyText = this.scene.add.text(260, 46, `💰 ${(data.money ?? 0).toLocaleString()} ¥`, {
          fontFamily: 'Arial', fontSize: '13px', color: '#fcd34d'
        });

        // Formatear Fecha / Hora
        const dateFormatted = data.timestamp ? new Date(data.timestamp).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : '—';
        const timeText = this.scene.add.text(w - 16, 46, `🕒 ${dateFormatted}`, {
          fontFamily: 'Arial', fontSize: '12px', color: '#94a3b8'
        }).setOrigin(1, 0);

        // Equipo preview (nombres)
        const teamNames = (data.party ?? []).map(p => (p as any).name || (p as any).species_name || 'Pokémon').slice(0, 6).join('  •  ');
        const teamText = this.scene.add.text(16, 74, `🐾 ${teamNames || 'Sin Pokémon'}`, {
          fontFamily: 'Arial', fontSize: '12px', color: '#38bdf8', fontStyle: 'italic'
        });

        slotContainer.add([nameText, badgesText, mapText, moneyText, timeText, teamText]);
      } else {
        // Ranura Vacía
        const emptyText = this.scene.add.text(w / 2, slotH / 2, '— Ranura Vacía (Sin datos guardados) —', {
          fontFamily: 'Arial', fontSize: '14px', color: '#64748b', fontStyle: 'italic'
        }).setOrigin(0.5);
        slotContainer.add(emptyText);
      }

      this.container.add(slotContainer);
      this.slotContainers.push(slotContainer);
    });
  }

  // ──── ACTUALIZAR RESALTADO DE SLOTS ────

  private refreshHighlight(): void {
    const { width } = this.scene.scale;
    const w = 680 - 40;
    const slotH = 105;

    this.slotBackgrounds.forEach((bg, idx) => {
      bg.clear();
      const isSelected = idx === this.selectedSlotIndex;

      if (isSelected) {
        bg.fillStyle(this.mode === 'SAVE' ? 0x166534 : 0x0369a1, 0.7);
        bg.fillRoundedRect(0, 0, w, slotH, 10);
        bg.lineStyle(3, this.mode === 'SAVE' ? 0x4ade80 : 0x38bdf8, 1);
        bg.strokeRoundedRect(0, 0, w, slotH, 10);
      } else {
        bg.fillStyle(0x0f172a, 0.75);
        bg.fillRoundedRect(0, 0, w, slotH, 10);
        bg.lineStyle(1, 0x334155, 1);
        bg.strokeRoundedRect(0, 0, w, slotH, 10);
      }
    });
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // LÓGICA DE CONFIRMACIÓN Y GUARDADO / CARGA
  // ──────────────────────────────────────────────────────────────────────────────

  private onConfirmSlot(): void {
    const slotKey = this.SLOTS[this.selectedSlotIndex];

    if (this.mode === 'SAVE') {
      this.executeSave(slotKey);
    } else {
      this.executeLoad(slotKey);
    }
  }

  private executeSave(slotKey: string): void {
    if (!this.currentSaveDataGenerator) return;
    this.isSavingAnimation = true;

    this.messageText.setText('💾 Guardando datos en memoria...').setColor('#facc15');

    // Animación de flash suave
    this.scene.cameras.main.flash(200, 34, 197, 94);

    this.scene.time.delayedCall(400, () => {
      const dataToSave = this.currentSaveDataGenerator!();
      const success = this.saveManager.saveGame(slotKey, dataToSave);

      if (success) {
        this.messageText.setText(`✅ ¡Partida guardada con éxito en Ranura ${this.selectedSlotIndex + 1}!`).setColor('#22c55e');

        // Reconstruir lista para mostrar los nuevos datos guardados
        this.scene.time.delayedCall(800, () => {
          this.buildUI();
          this.isSavingAnimation = false;
        });
      } else {
        this.messageText.setText('❌ Error al guardar partida en LocalStorage.').setColor('#ef4444');
        this.isSavingAnimation = false;
      }
    });
  }

  private executeLoad(slotKey: string): void {
    const data = this.saveManager.loadGame(slotKey);

    if (!data) {
      this.messageText.setText('⚠️ Esta ranura está vacía. No hay datos que cargar.').setColor('#ef4444');
      return;
    }

    this.messageText.setText(`📂 Cargando partida de ${data.player_name}...`).setColor('#38bdf8');
    this.scene.cameras.main.flash(300, 56, 189, 248);

    this.scene.time.delayedCall(500, () => {
      this.close();
      if (this.onLoadCallback) {
        this.onLoadCallback(data);
      }
    });
  }

  private formatMapName(mapId?: string): string {
    if (!mapId) return 'Mundo de Andara';
    const names: Record<string, string> = {
      villa_tranquimar: 'Villa Tranquimar',
      route1_map:        'Ruta 1 (Sendero Costero)',
      pueblo_altiplano:  'Pueblo Altiplano',
      gym_altiplano:     'Gimnasio Altiplano',
      metro_solsticio:   'Metrópolis Solsticio',
      selva_nubosa:      'Selva Nubosa',
    };
    return names[mapId] ?? mapId;
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
  }

  public handleInput(): void {
    if (!this.isVisible || this.isSavingAnimation) return;

    if (Phaser.Input.Keyboard.JustDown(this.escKey) || Phaser.Input.Keyboard.JustDown(this.xKey)) {
      this.close();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.selectedSlotIndex = Math.max(0, this.selectedSlotIndex - 1);
      this.refreshHighlight();
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this.selectedSlotIndex = Math.min(this.SLOTS.length - 1, this.selectedSlotIndex + 1);
      this.refreshHighlight();
    }

    if (
      Phaser.Input.Keyboard.JustDown(this.enterKey) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
      Phaser.Input.Keyboard.JustDown(this.zKey)
    ) {
      this.onConfirmSlot();
    }
  }
}
