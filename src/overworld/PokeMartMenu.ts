import * as Phaser from 'phaser';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: 'ball' | 'medicine' | 'battle_item' | 'key_item';
  sellPrice?: number; // Precio de venta (default: floor(price / 2))
}

export interface PlayerWallet {
  money: number;
  inventory: Map<string, number>; // itemId → quantity
}

type MartState = 'MAIN_MENU' | 'BUY_LIST' | 'SELL_LIST' | 'QUANTITY_SELECT' | 'CONFIRM';

/**
 * Menú de la Tienda Pokémon (Poké Mart) en Phaser 3.
 *
 * Responsabilidades:
 * - Mostrar el catálogo de compra con descripción y precio.
 * - Selección de cantidad x1 / x5 / x10 / Max.
 * - Pantalla de venta: listar el inventario del jugador.
 * - Confirmar transacciones y actualizar dinero + inventario.
 */
export class PokeMartMenu {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private isVisible: boolean = false;

  // Estado de navegación
  private state: MartState = 'MAIN_MENU';
  private selectedIndex: number = 0;
  private selectedQuantity: number = 1;
  private quantityOptions: number[] = [1, 5, 10];
  private selectedQuantityIdx: number = 0;
  private pendingItem: ShopItem | null = null;

  // Wallet del jugador (inyectada externamente)
  private wallet!: PlayerWallet;

  // Texto de feedback de transacción
  private messageText!: Phaser.GameObjects.Text;

  // Catálogo del mapa actual (puede variar por ciudad)
  private catalog: ShopItem[] = [];

  // Slots UI activos en la lista
  private listSlots: Phaser.GameObjects.Container[] = [];
  private quantityContainer!: Phaser.GameObjects.Container;
  private confirmContainer!: Phaser.GameObjects.Container;

  // Teclas
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;
  private xKey!: Phaser.Input.Keyboard.Key;

  // Catálogos predefinidos por ciudad
  static readonly CATALOGS: Record<string, ShopItem[]> = {
    villa_tranquimar: [
      { id: 'poke_ball',   name: 'Poké Ball',   price: 200,  sellPrice: 100, description: 'Dispositivo básico para capturar Pokémon salvajes.',  category: 'ball'     },
      { id: 'potion',      name: 'Poción',       price: 300,  sellPrice: 150, description: 'Aerosol que restaura 20 PS a un Pokémon.',            category: 'medicine' },
      { id: 'antidote',    name: 'Antídoto',     price: 400,  sellPrice: 200, description: 'Cura el envenenamiento de un Pokémon.',               category: 'medicine' },
      { id: 'paralyze_heal',name: 'Paral-Cura',  price: 200,  sellPrice: 100, description: 'Cura la parálisis de un Pokémon.',                    category: 'medicine' },
    ],
    pueblo_altiplano: [
      { id: 'poke_ball',    name: 'Poké Ball',    price: 200,  sellPrice: 100, description: 'Dispositivo básico de captura.',                      category: 'ball'     },
      { id: 'great_ball',   name: 'Super Ball',   price: 600,  sellPrice: 300, description: 'Mayor tasa de captura que la Poké Ball.',             category: 'ball'     },
      { id: 'potion',       name: 'Poción',        price: 300,  sellPrice: 150, description: 'Restaura 20 PS a un Pokémon.',                        category: 'medicine' },
      { id: 'super_potion', name: 'Superpoción',  price: 700,  sellPrice: 350, description: 'Restaura 60 PS a un Pokémon.',                        category: 'medicine' },
      { id: 'antidote',     name: 'Antídoto',     price: 400,  sellPrice: 200, description: 'Cura el envenenamiento de un Pokémon.',               category: 'medicine' },
      { id: 'x_attack',     name: 'X Ataque',     price: 500,  sellPrice: 250, description: 'Aumenta el Ataque de un Pokémon durante el combate.', category: 'battle_item' },
    ],
    metro_solsticio: [
      { id: 'poke_ball',    name: 'Poké Ball',    price: 200,  sellPrice: 100, description: 'Dispositivo básico de captura.',                       category: 'ball'       },
      { id: 'great_ball',   name: 'Super Ball',   price: 600,  sellPrice: 300, description: 'Mayor tasa de captura.',                               category: 'ball'       },
      { id: 'ultra_ball',   name: 'Ultra Ball',   price: 1200, sellPrice: 600, description: 'Alta tasa de captura. Funciona bien con Pokémon fuertes.', category: 'ball'    },
      { id: 'hyper_potion', name: 'Hiperpoción',  price: 1200, sellPrice: 600, description: 'Restaura 120 PS a un Pokémon.',                         category: 'medicine'   },
      { id: 'full_heal',    name: 'Cura Total',   price: 600,  sellPrice: 300, description: 'Cura cualquier problema de estado.',                   category: 'medicine'   },
      { id: 'revive',       name: 'Revivir',       price: 1500, sellPrice: 750, description: 'Revive a un Pokémon debilitado con la mitad de sus PS.', category: 'medicine' },
      { id: 'x_sp_atk',    name: 'X Ataque Esp.', price: 500,  sellPrice: 250, description: 'Aumenta el Ataque Especial en combate.',               category: 'battle_item' },
    ],
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupKeyboard();
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // APERTURA Y CIERRE
  // ──────────────────────────────────────────────────────────────────────────────

  /**
   * Abre el menú del Poké Mart para una ciudad concreta.
   * @param cityKey  - Llave de ciudad para cargar el catálogo correcto (ej: 'pueblo_altiplano').
   * @param wallet   - Dinero e inventario del jugador.
   */
  public open(cityKey: string, wallet: PlayerWallet): void {
    if (this.isVisible) return;
    this.wallet = wallet;
    this.catalog = PokeMartMenu.CATALOGS[cityKey] ?? PokeMartMenu.CATALOGS['villa_tranquimar'];
    this.isVisible = true;
    this.state = 'MAIN_MENU';
    this.selectedIndex = 0;
    this.buildUI();
  }

  public close(): void {
    if (this.container) this.container.destroy();
    this.isVisible = false;
  }

  public get visible(): boolean { return this.isVisible; }

  // ──────────────────────────────────────────────────────────────────────────────
  // CONSTRUCCIÓN DE UI
  // ──────────────────────────────────────────────────────────────────────────────

  private buildUI(): void {
    if (this.container) this.container.destroy();
    const { width, height } = this.scene.scale;
    this.container = this.scene.add.container(0, 0).setDepth(100);

    // Panel de fondo oscuro
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, width, height);
    this.container.add(overlay);

    // Panel principal
    const pw = 680, ph = 480;
    const px = (width - pw) / 2, py = (height - ph) / 2;

    const panel = this.scene.add.graphics();
    panel.fillStyle(0x1a252f, 0.97);
    panel.fillRoundedRect(px, py, pw, ph, 16);
    panel.lineStyle(4, 0xecf0f1, 1);
    panel.strokeRoundedRect(px, py, pw, ph, 16);
    this.container.add(panel);

    // Encabezado de la tienda
    const header = this.scene.add.graphics();
    header.fillStyle(0x2980b9, 1);
    header.fillRoundedRect(px + 2, py + 2, pw - 4, 52, { tl: 14, tr: 14, bl: 0, br: 0 });
    this.container.add(header);
    this.container.add(this.scene.add.text(px + pw / 2, py + 28, '🏪 TIENDA POKÉMON', { fontFamily: 'Arial', fontSize: '20px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5));

    // Dinero del jugador
    const moneyText = this.scene.add.text(px + pw - 20, py + 28, `💰 ${this.wallet.money.toLocaleString()} ¥`, { fontFamily: 'Arial', fontSize: '15px', color: '#f1c40f', fontStyle: 'bold' }).setOrigin(1, 0.5);
    this.container.add(moneyText);

    // Pestañas COMPRAR / VENDER
    this.buildTabs(px, py);

    // Cuerpo: lista de ítems
    this.buildItemList(px, py, pw, ph);

    // Panel de descripción (columna derecha)
    this.buildDescriptionPanel(px + pw / 2, py + 65, pw / 2 - 10, ph - 100);

    // Mensaje de feedback (transacciones)
    this.messageText = this.scene.add.text(px + pw / 2, py + ph - 24, '', {
      fontFamily: 'Arial', fontSize: '14px', color: '#2ecc71', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.container.add(this.messageText);

    // Instrucciones de teclas
    this.container.add(this.scene.add.text(px + 20, py + ph - 24, '↑↓ Navegar  |  Z/Enter Seleccionar  |  X/Esc Cerrar', {
      fontFamily: 'Arial', fontSize: '11px', color: '#7f8c8d'
    }));

    this.showMainMenu();
  }

  private buildTabs(px: number, py: number): void {
    const tabs = [
      { label: '🛒 COMPRAR', state: 'BUY_LIST' as MartState },
      { label: '💼 VENDER',  state: 'SELL_LIST' as MartState },
    ];

    tabs.forEach((tab, i) => {
      const tx = px + 20 + i * 140, ty = py + 62;
      const bg = this.scene.add.graphics();
      bg.fillStyle(0x2c3e50, 1);
      bg.fillRoundedRect(tx, ty, 130, 32, 6);
      bg.lineStyle(2, 0x95a5a6, 1);
      bg.strokeRoundedRect(tx, ty, 130, 32, 6);

      const txt = this.scene.add.text(tx + 65, ty + 16, tab.label, { fontFamily: 'Arial', fontSize: '13px', color: '#ecf0f1', fontStyle: 'bold' }).setOrigin(0.5);

      bg.setInteractive(new Phaser.Geom.Rectangle(tx, ty, 130, 32), Phaser.Geom.Rectangle.Contains);
      bg.on('pointerdown', () => {
        this.state = tab.state;
        this.selectedIndex = 0;
        this.buildItemList(px, py + 62, 680, 480 - 100);
      });

      bg.on('pointerover', () => { bg.clear(); bg.fillStyle(0xd35400, 1); bg.fillRoundedRect(tx, ty, 130, 32, 6); txt.setColor('#f1c40f'); });
      bg.on('pointerout',  () => { bg.clear(); bg.fillStyle(0x2c3e50, 1); bg.fillRoundedRect(tx, ty, 130, 32, 6); bg.lineStyle(2, 0x95a5a6, 1); bg.strokeRoundedRect(tx, ty, 130, 32, 6); txt.setColor('#ecf0f1'); });

      this.container.add([bg, txt]);
    });
  }

  private buildItemList(px: number, py: number, pw: number, _ph: number): void {
    // Limpiar slots anteriores
    this.listSlots.forEach(s => s.destroy());
    this.listSlots = [];

    const items = this.state === 'SELL_LIST' ? this.buildSellableItems() : this.catalog;
    const listX = px + 20, listY = py + 108;
    const slotW = pw / 2 - 30, slotH = 44;

    items.forEach((item, i) => {
      const sy = listY + i * (slotH + 6);
      const slotContainer = this.scene.add.container(0, 0);

      const bg = this.scene.add.graphics();
      const isSelected = i === this.selectedIndex;
      bg.fillStyle(isSelected ? 0xd35400 : 0x2c3e50, 0.9);
      bg.fillRoundedRect(listX, sy, slotW, slotH, 8);
      bg.lineStyle(2, isSelected ? 0xf1c40f : 0x7f8c8d, 1);
      bg.strokeRoundedRect(listX, sy, slotW, slotH, 8);

      const nameT = this.scene.add.text(listX + 14, sy + 12, item.name, { fontFamily: 'Arial', fontSize: '15px', color: isSelected ? '#f1c40f' : '#ecf0f1', fontStyle: 'bold' });
      const price = this.state === 'SELL_LIST'
        ? `${(item.sellPrice ?? Math.floor(item.price / 2)).toLocaleString()} ¥`
        : `${item.price.toLocaleString()} ¥`;
      const priceT = this.scene.add.text(listX + slotW - 10, sy + 14, price, { fontFamily: 'Arial', fontSize: '13px', color: isSelected ? '#ffffff' : '#f39c12', fontStyle: 'bold' }).setOrigin(1, 0);

      bg.setInteractive(new Phaser.Geom.Rectangle(listX, sy, slotW, slotH), Phaser.Geom.Rectangle.Contains);
      const idx = i;
      bg.on('pointerover', () => { this.selectedIndex = idx; this.buildItemList(px, py, pw, 380); });
      bg.on('pointerdown', () => { this.selectedIndex = idx; this.onItemConfirm(); });

      slotContainer.add([bg, nameT, priceT]);
      this.container.add(slotContainer);
      this.listSlots.push(slotContainer);
    });
  }

  private buildDescriptionPanel(x: number, y: number, w: number, h: number): void {
    const items = this.state === 'SELL_LIST' ? this.buildSellableItems() : this.catalog;
    const item = items[this.selectedIndex];
    if (!item) return;

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x2c3e50, 0.5);
    bg.fillRoundedRect(x, y + 108, w - 10, h - 20, 10);
    this.container.add(bg);

    this.container.add(this.scene.add.text(x + 14, y + 126, item.name, { fontFamily: 'Arial', fontSize: '16px', color: '#f1c40f', fontStyle: 'bold' }));
    this.container.add(this.scene.add.text(x + 14, y + 152, item.description, { fontFamily: 'Arial', fontSize: '13px', color: '#bdc3c7', wordWrap: { width: w - 40 } }));

    const qty = this.wallet.inventory.get(item.id) ?? 0;
    this.container.add(this.scene.add.text(x + 14, y + 200, `En bolsa: ${qty}`, { fontFamily: 'Arial', fontSize: '13px', color: '#95a5a6' }));
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // MENÚ DE CANTIDAD
  // ──────────────────────────────────────────────────────────────────────────────

  private showQuantitySelector(item: ShopItem, mode: 'BUY' | 'SELL'): void {
    this.pendingItem = item;
    this.selectedQuantityIdx = 0;
    this.state = 'QUANTITY_SELECT';
    if (this.quantityContainer) this.quantityContainer.destroy();

    const { width, height } = this.scene.scale;
    const pw = 360, ph = 220;
    const px = (width - pw) / 2, py = (height - ph) / 2;

    const qc = this.scene.add.container(0, 0).setDepth(110);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a252f, 0.98);
    bg.fillRoundedRect(px, py, pw, ph, 14);
    bg.lineStyle(4, 0xf1c40f, 1);
    bg.strokeRoundedRect(px, py, pw, ph, 14);
    qc.add(bg);

    qc.add(this.scene.add.text(px + pw / 2, py + 28, `${mode === 'BUY' ? '🛒 Comprar' : '💼 Vender'}: ${item.name}`, { fontFamily: 'Arial', fontSize: '15px', color: '#ecf0f1', fontStyle: 'bold' }).setOrigin(0.5));

    const maxQty = mode === 'SELL' ? (this.wallet.inventory.get(item.id) ?? 0) : 99;
    const dynamicOptions = [1, 5, 10, maxQty].filter((v, i, a) => v > 0 && a.indexOf(v) === i);
    const labels = dynamicOptions.map((q, i) => i === dynamicOptions.length - 1 && q === maxQty ? `Máx (${q})` : `×${q}`);

    dynamicOptions.forEach((qty, i) => {
      const bx = px + 20 + i * (pw / dynamicOptions.length), by = py + 70;
      const bw = (pw / dynamicOptions.length) - 10, bh = 48;

      const btnBg = this.scene.add.graphics();
      btnBg.fillStyle(i === this.selectedQuantityIdx ? 0xf1c40f : 0x2c3e50, 1);
      btnBg.fillRoundedRect(bx, by, bw, bh, 8);
      btnBg.lineStyle(2, 0x7f8c8d, 1);
      btnBg.strokeRoundedRect(bx, by, bw, bh, 8);

      const lblT = this.scene.add.text(bx + bw / 2, by + bh / 2, labels[i], { fontFamily: 'Arial', fontSize: '14px', color: i === this.selectedQuantityIdx ? '#2c3e50' : '#ecf0f1', fontStyle: 'bold' }).setOrigin(0.5);

      btnBg.setInteractive(new Phaser.Geom.Rectangle(bx, by, bw, bh), Phaser.Geom.Rectangle.Contains);
      btnBg.on('pointerdown', () => this.confirmTransaction(item, dynamicOptions[i], mode));
      btnBg.on('pointerover', () => { btnBg.clear(); btnBg.fillStyle(0xd35400, 1); btnBg.fillRoundedRect(bx, by, bw, bh, 8); lblT.setColor('#f1c40f'); });

      qc.add([btnBg, lblT]);
    });

    // Resumen de coste
    const unitPrice = mode === 'BUY' ? item.price : (item.sellPrice ?? Math.floor(item.price / 2));
    qc.add(this.scene.add.text(px + pw / 2, py + 148, `Precio unitario: ${unitPrice.toLocaleString()} ¥`, { fontFamily: 'Arial', fontSize: '13px', color: '#bdc3c7' }).setOrigin(0.5));

    const cancelBg = this.scene.add.graphics();
    cancelBg.fillStyle(0x7f8c8d, 1);
    cancelBg.fillRoundedRect(px + pw / 2 - 55, py + 174, 110, 32, 8);
    cancelBg.setInteractive(new Phaser.Geom.Rectangle(px + pw / 2 - 55, py + 174, 110, 32), Phaser.Geom.Rectangle.Contains);
    cancelBg.on('pointerdown', () => { qc.destroy(); this.state = mode === 'BUY' ? 'BUY_LIST' : 'SELL_LIST'; });
    qc.add(cancelBg);
    qc.add(this.scene.add.text(px + pw / 2, py + 190, 'Cancelar', { fontFamily: 'Arial', fontSize: '13px', color: '#ecf0f1' }).setOrigin(0.5));

    this.quantityContainer = qc;
    this.container.add(qc);
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // TRANSACCIONES
  // ──────────────────────────────────────────────────────────────────────────────

  private onItemConfirm(): void {
    const items = this.state === 'SELL_LIST' ? this.buildSellableItems() : this.catalog;
    const item = items[this.selectedIndex];
    if (!item) return;
    const mode = this.state === 'SELL_LIST' ? 'SELL' : 'BUY';
    this.showQuantitySelector(item, mode);
  }

  private confirmTransaction(item: ShopItem, quantity: number, mode: 'BUY' | 'SELL'): void {
    if (this.quantityContainer) this.quantityContainer.destroy();

    if (mode === 'BUY') {
      const totalCost = item.price * quantity;
      if (this.wallet.money < totalCost) {
        this.showMessage(`¡No tienes suficiente dinero! (Necesitas ${totalCost.toLocaleString()} ¥)`, '#e74c3c');
        return;
      }
      this.wallet.money -= totalCost;
      const prev = this.wallet.inventory.get(item.id) ?? 0;
      this.wallet.inventory.set(item.id, prev + quantity);
      this.showMessage(`¡Compraste ${quantity}× ${item.name}! (-${totalCost.toLocaleString()} ¥)`, '#2ecc71');
    } else {
      const inBag = this.wallet.inventory.get(item.id) ?? 0;
      const actualQty = Math.min(quantity, inBag);
      if (actualQty <= 0) {
        this.showMessage(`¡No tienes ${item.name} para vender!`, '#e74c3c');
        return;
      }
      const gained = (item.sellPrice ?? Math.floor(item.price / 2)) * actualQty;
      this.wallet.money += gained;
      this.wallet.inventory.set(item.id, inBag - actualQty);
      this.showMessage(`¡Vendiste ${actualQty}× ${item.name}! (+${gained.toLocaleString()} ¥)`, '#f1c40f');
    }

    // Reconstruir lista para actualizar cantidades en bolsa
    const { width, height } = this.scene.scale;
    const px = (width - 680) / 2;
    this.buildItemList(px, (height - 480) / 2, 680, 380);
    this.state = mode === 'BUY' ? 'BUY_LIST' : 'SELL_LIST';
  }

  private buildSellableItems(): ShopItem[] {
    const result: ShopItem[] = [];
    this.wallet.inventory.forEach((qty, id) => {
      if (qty <= 0) return;
      const catalogMatch = Object.values(PokeMartMenu.CATALOGS)
        .flat()
        .find(c => c.id === id);
      if (catalogMatch) {
        result.push({ ...catalogMatch, sellPrice: catalogMatch.sellPrice ?? Math.floor(catalogMatch.price / 2) });
      }
    });
    return result;
  }

  private showMainMenu(): void {
    this.state = 'BUY_LIST';
    const { width, height } = this.scene.scale;
    const px = (width - 680) / 2;
    this.buildItemList(px, (height - 480) / 2, 680, 380);
  }

  private showMessage(msg: string, color: string = '#2ecc71'): void {
    if (!this.messageText) return;
    this.messageText.setText(msg).setColor(color);
    this.scene.time.delayedCall(2500, () => { if (this.messageText) this.messageText.setText(''); });
  }

  private setupKeyboard(): void {
    if (!this.scene.input.keyboard) return;
    this.cursors  = this.scene.input.keyboard.createCursorKeys();
    this.enterKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.escKey   = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.xKey     = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
  }

  /**
   * Procesar input de teclado — llamar desde el update() de la escena.
   */
  public handleInput(): void {
    if (!this.isVisible) return;

    if (Phaser.Input.Keyboard.JustDown(this.escKey) || Phaser.Input.Keyboard.JustDown(this.xKey)) {
      this.close();
      return;
    }

    if (this.state === 'BUY_LIST' || this.state === 'SELL_LIST') {
      const items = this.state === 'SELL_LIST' ? this.buildSellableItems() : this.catalog;
      if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
        this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        const { width, height } = this.scene.scale;
        this.buildItemList((width - 680) / 2, (height - 480) / 2, 680, 380);
      }
      if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
        this.selectedIndex = Math.min(items.length - 1, this.selectedIndex + 1);
        const { width, height } = this.scene.scale;
        this.buildItemList((width - 680) / 2, (height - 480) / 2, 680, 380);
      }
      if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
        this.onItemConfirm();
      }
    }
  }
}
