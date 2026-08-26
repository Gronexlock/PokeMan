import { SaveData } from '../core/types';
import { AssetLoader } from '../graphics/assetLoader';
import { AudioEngine } from '../audio/audioEngine';

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: 'ball' | 'medicine' | 'item';
}

export class PokemartMenu {
  private loader: AssetLoader;
  private audio: AudioEngine;

  public activeTab: 'BUY' | 'SELL' = 'BUY';
  public selectedIndex: number = 0;
  public buyQuantity: number = 1;
  public isSelectingQuantity: boolean = false;
  public message: string = "¡Hola! ¿En qué puedo ayudarte hoy?";

  public catalog: ShopItem[] = [
    { id: 'pokeball', name: 'Poké Ball', price: 200, description: 'Dispositivo para capturar Pokémon salvajes.', category: 'ball' },
    { id: 'greatball', name: 'Super Ball', price: 600, description: 'Mayor ratio de captura que la Poké Ball normal.', category: 'ball' },
    { id: 'potion', name: 'Poción', price: 300, description: 'Medicina en aerosol que restaura 50 PS.', category: 'medicine' },
    { id: 'superpotion', name: 'Superpoción', price: 700, description: 'Medicina concentrada que restaura 100 PS.', category: 'medicine' },
    { id: 'adamant_mint', name: 'Menta Firme', price: 1500, description: 'Hierba aromática que orienta la naturaleza al Ataque.', category: 'item' }
  ];

  constructor() {
    this.loader = AssetLoader.getInstance();
    this.audio = AudioEngine.getInstance();
  }

  public open(): void {
    this.activeTab = 'BUY';
    this.selectedIndex = 0;
    this.buyQuantity = 1;
    this.isSelectingQuantity = false;
    this.message = "¡Hola! ¿Qué deseas comprar hoy?";
  }

  public render(
    ctx: CanvasRenderingContext2D,
    saveData: SaveData,
    width: number,
    height: number
  ): void {
    ctx.save();

    // Fondo oscurecido
    ctx.fillStyle = 'rgba(3, 7, 18, 0.88)';
    ctx.fillRect(0, 0, width, height);

    const boxW = 820;
    const boxH = 460;
    const boxX = (width - boxW) / 2;
    const boxY = (height - boxH) / 2;

    // Panel Principal
    ctx.fillStyle = 'rgba(15, 23, 42, 0.98)';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Cabecera Azul de Poké Mart estilo Esmeralda
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(boxX, boxY, boxW, 56);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "PokemonGBA", "Outfit", sans-serif';
    ctx.fillText("🏪 TIENDA POKÉMON (POKÉ MART)", boxX + 24, boxY + 36);

    // Saldo del jugador
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 15px "PokemonGBA", "Outfit", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`💰 Dinero: $${saveData.money.toLocaleString()}`, boxX + boxW - 24, boxY + 36);
    ctx.textAlign = 'left';

    // Lista de Catálogo a la Izquierda
    const listW = 440;
    const listH = 310;
    const listX = boxX + 24;
    const listY = boxY + 70;

    ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
    ctx.fillRect(listX, listY, listW, listH);

    this.catalog.forEach((item, idx) => {
      const isSel = idx === this.selectedIndex;
      const itemY = listY + 8 + idx * 56;

      if (isSel) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(listX + 6, itemY, listW - 12, 48);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 15px "PokemonGBA", "Outfit", sans-serif';
      } else {
        ctx.fillStyle = 'rgba(51, 65, 85, 0.7)';
        ctx.fillRect(listX + 6, itemY, listW - 12, 48);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '14px "PokemonGBA", "Outfit", sans-serif';
      }

      ctx.fillText(item.name, listX + 18, itemY + 30);

      // Precio
      ctx.textAlign = 'right';
      ctx.fillText(`$${item.price.toLocaleString()}`, listX + listW - 20, itemY + 30);
      ctx.textAlign = 'left';
    });

    // Panel Derecho: Detalles del Objeto Seleccionado
    const selItem = this.catalog[this.selectedIndex];
    const detailX = boxX + listW + 44;
    const detailY = listY;
    const detailW = boxW - listW - 68;

    ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
    ctx.fillRect(detailX, detailY, detailW, listH);

    if (selItem) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 18px "PokemonGBA", "Outfit", sans-serif';
      ctx.fillText(selItem.name, detailX + 16, detailY + 34);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px "PokemonGBA", "Outfit", sans-serif';
      ctx.fillText(`Precio Unitario: $${selItem.price}`, detailX + 16, detailY + 62);

      if (!saveData.inventory) saveData.inventory = {};
      const inBag = saveData.inventory[selItem.id] || 0;
      ctx.fillText(`En la Mochila: x${inBag}`, detailX + 16, detailY + 86);

      // Descripción
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '13px "PokemonGBA", "Outfit", sans-serif';
      ctx.fillText("Descripción:", detailX + 16, detailY + 125);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '12px "PokemonGBA", "Outfit", sans-serif';
      // Word wrap simple
      const words = selItem.description.split(' ');
      let line = '';
      let curY = detailY + 150;
      for (const w of words) {
        if (ctx.measureText(line + w).width > detailW - 32) {
          ctx.fillText(line, detailX + 16, curY);
          line = w + ' ';
          curY += 20;
        } else {
          line += w + ' ';
        }
      }
      ctx.fillText(line, detailX + 16, curY);

      // Cuadro de Selector de Cantidad si está activo
      if (this.isSelectingQuantity) {
        const totalCost = selItem.price * this.buyQuantity;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.fillRect(detailX + 12, detailY + 210, detailW - 24, 80);
        ctx.strokeRect(detailX + 12, detailY + 210, detailW - 24, 80);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 16px "PokemonGBA", "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Cantidad: ◀  ${this.buyQuantity}  ▶`, detailX + detailW / 2, detailY + 242);
        ctx.fillText(`Total: $${totalCost.toLocaleString()}`, detailX + detailW / 2, detailY + 270);
        ctx.textAlign = 'left';
      }
    }

    // Pie con Mensaje del Dependiente y Controles
    ctx.fillStyle = '#38bdf8';
    ctx.font = '13px "PokemonGBA", "Outfit", sans-serif';
    ctx.fillText(this.message, boxX + 24, boxY + boxH - 24);

    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText("[↑ / ↓] Elegir • [ENTER] Comprar • [ESC] Salir", boxX + boxW - 24, boxY + boxH - 24);
    ctx.textAlign = 'left';

    ctx.restore();
  }

  public handleInput(code: string, saveData: SaveData): boolean {
    const selItem = this.catalog[this.selectedIndex];

    if (this.isSelectingQuantity) {
      if (code === 'ArrowUp' || code === 'KeyW' || code === 'ArrowRight' || code === 'KeyD') {
        const maxAfford = Math.max(1, Math.floor(saveData.money / selItem.price));
        this.buyQuantity = Math.min(99, Math.min(maxAfford, this.buyQuantity + 1));
        this.audio.playSfx('select');
      } else if (code === 'ArrowDown' || code === 'KeyS' || code === 'ArrowLeft' || code === 'KeyA') {
        this.buyQuantity = Math.max(1, this.buyQuantity - 1);
        this.audio.playSfx('select');
      } else if (code === 'Enter' || code === 'Space' || code === 'KeyZ') {
        const total = selItem.price * this.buyQuantity;
        if (saveData.money >= total) {
          saveData.money -= total;
          if (!saveData.inventory) saveData.inventory = {};
          saveData.inventory[selItem.id] = (saveData.inventory[selItem.id] || 0) + this.buyQuantity;
          this.audio.playSfx('confirm');
          this.message = `¡Compraste ${this.buyQuantity}x ${selItem.name}! ¿Algo más?`;
          this.isSelectingQuantity = false;
        } else {
          this.audio.playSfx('cancel');
          this.message = "No tienes suficiente dinero para esta compra.";
        }
      } else if (code === 'Escape' || code === 'KeyX') {
        this.isSelectingQuantity = false;
        this.audio.playSfx('cancel');
      }
      return false; // Sigue en la tienda
    }

    if (code === 'ArrowUp' || code === 'KeyW') {
      this.selectedIndex = (this.selectedIndex - 1 + this.catalog.length) % this.catalog.length;
      this.audio.playSfx('select');
    } else if (code === 'ArrowDown' || code === 'KeyS') {
      this.selectedIndex = (this.selectedIndex + 1) % this.catalog.length;
      this.audio.playSfx('select');
    } else if (code === 'Enter' || code === 'Space' || code === 'KeyZ') {
      if (saveData.money >= selItem.price) {
        this.isSelectingQuantity = true;
        this.buyQuantity = 1;
        this.audio.playSfx('confirm');
      } else {
        this.audio.playSfx('cancel');
        this.message = "No tienes suficiente dinero para comprar este objeto.";
      }
    } else if (code === 'Escape' || code === 'KeyX') {
      this.audio.playSfx('cancel');
      return true; // Salir de la tienda al overworld
    }

    return false;
  }
}
