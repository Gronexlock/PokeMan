import * as Phaser from 'phaser';

export interface TrainerCardData {
  playerName: string;
  trainerId: string; // e.g. "38492"
  gender: 'male' | 'female';
  title?: string;
  money: number;
  playTimeSeconds: number;
  pokedexSeen: number;
  pokedexCaught: number;
  badges: string[]; // IDs de medallas obtenidas
  score?: number;
  rankStars?: number; // 0..5
}

export interface RegionBadgeInfo {
  id: string;
  name: string;
  leader: string;
  city: string;
  type: string;
  color: number;
  icon: string;
}

/**
 * TrainerCardUI — Ficha Oficial de Entrenador de la Región de Andara.
 *
 * Responsabilidades:
 * - Renderizar la Ficha de Entrenador con estilo holográfico / tarjeta de alta gama.
 * - Mostrar Avatar, Nombre, ID de 5 dígitos, Título, Dinero y Tiempo de juego.
 * - Vitrina interactiva con las 8 Medallas de Gimnasio de Andara (efecto brillante en las ganadas).
 * - Estadísticas de Pokédex y barra de progreso.
 * - Tooltips dinámicos al pasar el ratón por cada medalla.
 */
export class TrainerCardUI {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private isVisible: boolean = false;

  // Datos actuales
  private cardData!: TrainerCardData;

  // Medallas oficiales de la Región de Andara
  public static readonly ANDARA_BADGES: RegionBadgeInfo[] = [
    { id: 'badge_cumbre',    name: 'Medalla Cumbre',    leader: 'Rocío',          city: 'Pueblo Altiplano',    type: 'Roca',      color: 0xb8a038, icon: '⛰️' },
    { id: 'badge_corriente', name: 'Medalla Corriente', leader: 'Capitán Marino', city: 'Villa Tranquimar',   type: 'Agua',      color: 0x6890f0, icon: '💧' },
    { id: 'badge_brote',     name: 'Medalla Brote',     leader: 'Botánica Lía',   city: 'Bosque Nuboso',       type: 'Planta',    color: 0x78c850, icon: '🍃' },
    { id: 'badge_voltio',    name: 'Medalla Voltio',    leader: 'Ingeniero Volta',city: 'Metrópolis Solsticio',type: 'Eléctrico', color: 0xf8d030, icon: '⚡' },
    { id: 'badge_ceniza',    name: 'Medalla Ceniza',    leader: 'Maestro Fuego',  city: 'Volcán Telúrico',     type: 'Fuego',     color: 0xf08030, icon: '🔥' },
    { id: 'badge_sombra',    name: 'Medalla Sombra',    leader: 'Chamán Inti',    city: 'Ruinas Antiguas',     type: 'Fantasma',  color: 0x705898, icon: '👁️' },
    { id: 'badge_glaciar',   name: 'Medalla Glaciar',   leader: 'Escaladora Neve',city: 'Nevado Andino',       type: 'Hielo',     color: 0x98d8d8, icon: '❄️' },
    { id: 'badge_dragon',    name: 'Medalla Dragón',    leader: 'Guardián Drake', city: 'Templo Zygarde',      type: 'Dragón',    color: 0x7038f8, icon: '🐉' },
  ];

  // Teclas
  private escKey!: Phaser.Input.Keyboard.Key;
  private xKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private zKey!: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupKeyboard();
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // APERTURA Y CIERRE
  // ──────────────────────────────────────────────────────────────────────────────

  public open(data: TrainerCardData): void {
    if (this.isVisible) return;
    this.cardData = data;
    this.isVisible = true;
    this.buildUI();
  }

  public close(): void {
    if (this.container) this.container.destroy();
    this.isVisible = false;
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
    this.container = this.scene.add.container(0, 0).setDepth(110);

    // Fondo oscurecido
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, width, height);
    this.container.add(overlay);

    const cardW = 640;
    const cardH = 430;
    const cx = (width - cardW) / 2;
    const cy = (height - cardH) / 2;

    // Sombra de la tarjeta
    const cardShadow = this.scene.add.graphics();
    cardShadow.fillStyle(0x000000, 0.4);
    cardShadow.fillRoundedRect(cx + 8, cy + 8, cardW, cardH, 20);
    this.container.add(cardShadow);

    // Base de la tarjeta (degradado dorado/azul según rango de estrellas)
    const cardBg = this.scene.add.graphics();
    const badgeCount = this.cardData.badges.length;
    const isGoldCard = badgeCount >= 8;
    const isSilverCard = badgeCount >= 4;

    const baseColor1 = isGoldCard ? 0xd4af37 : isSilverCard ? 0x94a3b8 : 0x0284c7;
    const baseColor2 = isGoldCard ? 0x785e13 : isSilverCard ? 0x334155 : 0x0f172a;

    cardBg.fillGradientStyle(baseColor1, baseColor1, baseColor2, baseColor2, 1);
    cardBg.fillRoundedRect(cx, cy, cardW, cardH, 20);
    cardBg.lineStyle(4, isGoldCard ? 0xfef08a : 0x38bdf8, 1);
    cardBg.strokeRoundedRect(cx, cy, cardW, cardH, 20);
    this.container.add(cardBg);

    // Encabezado de la Tarjeta
    const headerBg = this.scene.add.graphics();
    headerBg.fillStyle(0x0f172a, 0.75);
    headerBg.fillRoundedRect(cx + 4, cy + 4, cardW - 8, 50, { tl: 18, tr: 18, bl: 0, br: 0 });
    this.container.add(headerBg);

    const titleText = this.scene.add.text(cx + 24, cy + 28, '💳 FICHA DE ENTRENADOR — ANDARA LEAGUE', {
      fontFamily: 'Arial', fontSize: '15px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0, 0.5);

    const idText = this.scene.add.text(cx + cardW - 24, cy + 28, `Nº ID: ${this.cardData.trainerId}`, {
      fontFamily: 'Arial', fontSize: '15px', fontStyle: 'bold', color: '#fcd34d',
    }).setOrigin(1, 0.5);

    this.container.add([titleText, idText]);

    // 1. Panel Superior Izquierdo: Avatar del Entrenador
    this.buildAvatarSection(cx + 30, cy + 70);

    // 2. Panel Superior Derecho: Datos Generales
    this.buildInfoSection(cx + 170, cy + 70, cardW - 200);

    // 3. Vitrina de las 8 Medallas de la Región
    this.buildBadgesSection(cx + 30, cy + 225, cardW - 60);

    // Pie con botón de cierre
    const footerText = this.scene.add.text(cx + cardW / 2, cy + cardH - 20, 'Pulsa X o ESC para cerrar', {
      fontFamily: 'Arial', fontSize: '12px', color: '#cbd5e1', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.container.add(footerText);

    // Animación de entrada con pop elástico
    this.container.setScale(0.95);
    this.container.setAlpha(0);
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 250,
      ease: 'Back.easeOut'
    });
  }

  // ──── SECCIÓN DE AVATAR ────

  private buildAvatarSection(x: number, y: number): void {
    const frame = this.scene.add.graphics();
    frame.fillStyle(0x0f172a, 0.85);
    frame.fillRoundedRect(x, y, 115, 135, 12);
    frame.lineStyle(2, 0x38bdf8, 1);
    frame.strokeRoundedRect(x, y, 115, 135, 12);
    this.container.add(frame);

    // Avatar gráfico estilizado
    const avatar = this.scene.add.graphics();
    const isMale = this.cardData.gender === 'male';
    const mainColor = isMale ? 0x2563eb : 0xdb2777;

    // Cuerpo
    avatar.fillStyle(mainColor, 1);
    avatar.fillRoundedRect(x + 22, y + 60, 70, 60, 10);
    // Cabeza
    avatar.fillStyle(0xfde047, 1);
    avatar.fillCircle(x + 57, y + 42, 22);
    // Gorra/Cabello
    avatar.fillStyle(mainColor, 1);
    avatar.fillCircle(x + 57, y + 30, 22);

    this.container.add(avatar);

    const genderLabel = this.scene.add.text(x + 57, y + 120, isMale ? '♂ CHICO' : '♀ CHICA', {
      fontFamily: 'Arial', fontSize: '10px', fontStyle: 'bold', color: '#cbd5e1'
    }).setOrigin(0.5);
    this.container.add(genderLabel);
  }

  // ──── SECCIÓN DE INFORMACIÓN DEL JUGADOR ────

  private buildInfoSection(x: number, y: number, w: number): void {
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0f172a, 0.75);
    bg.fillRoundedRect(x, y, w - 20, 135, 12);
    bg.lineStyle(1, 0x475569, 1);
    bg.strokeRoundedRect(x, y, w - 20, 135, 12);
    this.container.add(bg);

    // Nombre del Entrenador
    const nameLabel = this.scene.add.text(x + 20, y + 16, 'NOMBRE:', {
      fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold', color: '#94a3b8'
    });
    const nameVal = this.scene.add.text(x + 100, y + 14, this.cardData.playerName.toUpperCase(), {
      fontFamily: 'Arial', fontSize: '16px', fontStyle: 'bold', color: '#ffffff'
    });

    // Dinero
    const moneyLabel = this.scene.add.text(x + 20, y + 46, 'DINERO:', {
      fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold', color: '#94a3b8'
    });
    const moneyVal = this.scene.add.text(x + 100, y + 44, `${this.cardData.money.toLocaleString()} ¥`, {
      fontFamily: 'Arial', fontSize: '15px', fontStyle: 'bold', color: '#facc15'
    });

    // Pokédex
    const dexLabel = this.scene.add.text(x + 20, y + 74, 'POKÉDEX:', {
      fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold', color: '#94a3b8'
    });
    const dexVal = this.scene.add.text(
      x + 100, y + 74,
      `Vistos: ${this.cardData.pokedexSeen}  |  Atrapados: ${this.cardData.pokedexCaught}`, {
      fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold', color: '#38bdf8'
    });

    // Tiempo de Juego (HH:MM:SS)
    const timeFormatted = this.formatPlayTime(this.cardData.playTimeSeconds);
    const timeLabel = this.scene.add.text(x + 20, y + 102, 'TIEMPO:', {
      fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold', color: '#94a3b8'
    });
    const timeVal = this.scene.add.text(x + 100, y + 102, timeFormatted, {
      fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold', color: '#e2e8f0'
    });

    this.container.add([nameLabel, nameVal, moneyLabel, moneyVal, dexLabel, dexVal, timeLabel, timeVal]);
  }

  // ──── SECCIÓN DE LAS 8 MEDALLAS DE ANDARA ────

  private buildBadgesSection(x: number, y: number, w: number): void {
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0f172a, 0.85);
    bg.fillRoundedRect(x, y, w, 140, 14);
    bg.lineStyle(2, 0x38bdf8, 1);
    bg.strokeRoundedRect(x, y, w, 140, 14);
    this.container.add(bg);

    const badgeTitle = this.scene.add.text(
      x + 20, y + 16,
      `🏆 MEDALLAS DE GIMNASIO DE ANDARA (${this.cardData.badges.length} / 8)`, {
      fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold', color: '#facc15'
    });
    this.container.add(badgeTitle);

    // Texto de tooltip dinámico al hacer hover
    const tooltipText = this.scene.add.text(x + w - 20, y + 16, 'Pasa el ratón sobre una medalla para ver detalles', {
      fontFamily: 'Arial', fontSize: '11px', color: '#94a3b8', fontStyle: 'italic'
    }).setOrigin(1, 0);
    this.container.add(tooltipText);

    // 8 Medallas en fila horizontal
    const badgeW = (w - 40) / 8;
    const badgeY = y + 45;

    TrainerCardUI.ANDARA_BADGES.forEach((badge, idx) => {
      const bx = x + 20 + idx * badgeW + badgeW / 2;
      const hasBadge = this.cardData.badges.includes(badge.id);

      const slot = this.scene.add.container(bx, badgeY + 30);

      // Marco de la medalla
      const slotBg = this.scene.add.graphics();
      if (hasBadge) {
        // Medalla desbloqueada: brillante
        slotBg.fillStyle(badge.color, 0.35);
        slotBg.fillCircle(0, 0, 24);
        slotBg.lineStyle(3, badge.color, 1);
        slotBg.strokeCircle(0, 0, 24);

        // Ícono / Símbolo
        const iconText = this.scene.add.text(0, -2, badge.icon, {
          fontFamily: 'Arial', fontSize: '20px'
        }).setOrigin(0.5);

        // Brillo pulsante
        this.scene.tweens.add({
          targets: iconText,
          scaleX: 1.15,
          scaleY: 1.15,
          duration: 1200 + idx * 100,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });

        slot.add([slotBg, iconText]);
      } else {
        // Medalla bloqueada: silueta vacía
        slotBg.fillStyle(0x1e293b, 0.6);
        slotBg.fillCircle(0, 0, 24);
        slotBg.lineStyle(2, 0x475569, 1);
        slotBg.strokeCircle(0, 0, 24);

        const lockIcon = this.scene.add.text(0, 0, '🔒', {
          fontFamily: 'Arial', fontSize: '14px', color: '#64748b'
        }).setOrigin(0.5);

        slot.add([slotBg, lockIcon]);
      }

      // Nombre debajo
      const nameT = this.scene.add.text(0, 32, `#${idx + 1}`, {
        fontFamily: 'Arial', fontSize: '10px', fontStyle: 'bold', color: hasBadge ? '#ffffff' : '#64748b'
      }).setOrigin(0.5);
      slot.add(nameT);

      // Interactividad hover para tooltip
      slotBg.setInteractive(new Phaser.Geom.Circle(0, 0, 24), Phaser.Geom.Circle.Contains);
      slotBg.on('pointerover', () => {
        if (hasBadge) {
          tooltipText.setText(`✅ ${badge.name} (${badge.type}) — Líder: ${badge.leader} (${badge.city})`).setColor('#22c55e');
        } else {
          tooltipText.setText(`🔒 Medalla ${idx + 1} — Gimnasio de ${badge.city} (Líder: ${badge.leader})`).setColor('#94a3b8');
        }
      });
      slotBg.on('pointerout', () => {
        tooltipText.setText('Pasa el ratón sobre una medalla para ver detalles').setColor('#94a3b8');
      });

      this.container.add(slot);
    });
  }

  // ──── UTILIDADES ────

  private formatPlayTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  private setupKeyboard(): void {
    if (!this.scene.input.keyboard) return;
    this.escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.xKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.zKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
  }

  public handleInput(): void {
    if (!this.isVisible) return;

    if (
      Phaser.Input.Keyboard.JustDown(this.escKey) ||
      Phaser.Input.Keyboard.JustDown(this.xKey) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
      Phaser.Input.Keyboard.JustDown(this.zKey)
    ) {
      this.close();
    }
  }
}
