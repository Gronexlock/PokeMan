import { AssetLoader } from '../graphics/assetLoader';
import { ALL_STARTERS, StarterOption } from '../core/storyManager';

export class StarterSelectScreen {
  private loader: AssetLoader;
  public element: 'fire' | 'water' | 'grass' = 'fire';
  public selectedIndex: number = 0;

  constructor() {
    this.loader = AssetLoader.getInstance();
  }

  public setElement(element: 'fire' | 'water' | 'grass'): void {
    this.element = element;
    this.selectedIndex = 0;
  }

  public getStarters(): StarterOption[] {
    return ALL_STARTERS[this.element] || ALL_STARTERS.fire;
  }

  public getSelectedStarter(): StarterOption {
    const list = this.getStarters();
    return list[this.selectedIndex] || list[0];
  }

  public render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.save();

    // Fondo oscuro temático
    const typeColor = this.element === 'fire' ? '#f97316' :
                      this.element === 'water' ? '#38bdf8' : '#4ade80';

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#030712');
    bg.addColorStop(0.5, '#0f172a');
    bg.addColorStop(1, '#020617');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Botón Volver (Top-Left)
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.fillRect(36, 18, 130, 30);
    ctx.strokeRect(36, 18, 130, 30);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '12px "PokemonGBA", "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("◀ [ESC] VOLVER", 101, 38);

    // Título Principal Centrado
    ctx.textAlign = 'center';
    const typeTitle = this.element === 'fire' ? '🔥 INICIALES DE FUEGO' :
                      this.element === 'water' ? '💧 INICIALES DE AGUA' : '🌱 INICIALES DE PLANTA';

    ctx.fillStyle = typeColor;
    ctx.font = 'bold 24px "PokemonGBA", "Outfit", sans-serif';
    ctx.fillText(typeTitle, width / 2 + 25, 40);

    const starters = this.getStarters();

    // Grid 3x3 de selección (9 iniciales)
    const gridCols = 3;
    const itemW = 166;
    const itemH = 88;
    const gapX = 12;
    const gapY = 12;
    const startX = 36;
    const startY = 70;

    starters.forEach((sp, idx) => {
      const col = idx % gridCols;
      const row = Math.floor(idx / gridCols);
      const isSel = idx === this.selectedIndex;

      const x = startX + col * (itemW + gapX);
      const y = startY + row * (itemH + gapY);

      // Fondo de tarjeta
      if (isSel) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
      } else {
        ctx.fillStyle = 'rgba(30, 41, 59, 0.75)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
      }
      ctx.fillRect(x, y, itemW, itemH);
      ctx.strokeRect(x, y, itemW, itemH);

      // Imagen / Artwork oficial
      const artUrl = this.loader.getPokemonArtworkUrl(sp.species_id);
      let img = this.loader.getImage(artUrl);
      if (!img) {
        this.loader.loadImage(artUrl);
        img = this.loader.getImage(this.loader.getPokemonGifUrl(sp.species_id));
      }

      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, x + 6, y + 14, 56, 56);
      } else {
        // Fallback estilizado con circulo
        ctx.fillStyle = typeColor;
        ctx.beginPath();
        ctx.arc(x + 34, y + 44, 24, 0, Math.PI * 2);
        ctx.fill();
      }

      // Textos del Pokémon dentro de la tarjeta
      ctx.textAlign = 'left';
      ctx.fillStyle = isSel ? '#ffffff' : '#e2e8f0';
      ctx.font = isSel ? 'bold 12px "PokemonGBA", "Outfit", sans-serif' : '12px "PokemonGBA", "Outfit", sans-serif';
      ctx.fillText(sp.name, x + 66, y + 30);

      // Tag de Generación y Número
      ctx.fillStyle = isSel ? '#fbbf24' : '#94a3b8';
      ctx.font = '10px "PokemonGBA", "Outfit", sans-serif';
      ctx.fillText(`Gen ${sp.gen}`, x + 66, y + 48);
      ctx.fillText(`#${sp.species_id.toString().padStart(3, '0')}`, x + 66, y + 64);
    });

    // Panel de Detalles del Pokémon Seleccionado (Lado Derecho)
    const selPoke = starters[this.selectedIndex] || starters[0];
    const detailX = 582;
    const detailY = 70;
    const detailW = 342;
    const detailH = 405;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
    ctx.strokeStyle = typeColor;
    ctx.lineWidth = 2;
    ctx.fillRect(detailX, detailY, detailW, detailH);
    ctx.strokeRect(detailX, detailY, detailW, detailH);

    // Arte grande del Pokémon
    const bigArtUrl = this.loader.getPokemonArtworkUrl(selPoke.species_id);
    let bigImg = this.loader.getImage(bigArtUrl);
    if (!bigImg) {
      this.loader.loadImage(bigArtUrl);
      bigImg = this.loader.getImage(this.loader.getPokemonGifUrl(selPoke.species_id));
    }

    if (bigImg && bigImg.complete && bigImg.naturalWidth > 0) {
      ctx.drawImage(bigImg, detailX + (detailW - 130) / 2, detailY + 14, 130, 130);
    }

    // Nombre y tipo
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "PokemonGBA", "Outfit", sans-serif';
    ctx.fillText(`${selPoke.name}`, detailX + detailW / 2, detailY + 165);

    // Badges
    ctx.fillStyle = typeColor;
    ctx.font = 'bold 12px "PokemonGBA", "Outfit", sans-serif';
    ctx.fillText(`TIPO ${selPoke.type.toUpperCase()} • GENERACIÓN ${selPoke.gen}`, detailX + detailW / 2, detailY + 188);

    // Descripción con salto de línea automático
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px "PokemonGBA", "Outfit", sans-serif';
    const words = selPoke.description.split(' ');
    let line = '';
    let descY = detailY + 215;
    const maxDescW = detailW - 40;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxDescW && n > 0) {
        ctx.fillText(line, detailX + detailW / 2, descY);
        line = words[n] + ' ';
        descY += 18;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, detailX + detailW / 2, descY);

    // Línea divisoria
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(detailX + 25, detailY + 270);
    ctx.lineTo(detailX + detailW - 25, detailY + 270);
    ctx.stroke();

    // Movimientos iniciales de Nivel 5
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "PokemonGBA", "Outfit", sans-serif';
    ctx.fillText("SET INICIAL NIVEL 5 (31 IVS PERFECTOS)", detailX + detailW / 2, detailY + 295);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px "PokemonGBA", "Outfit", sans-serif';
    const move1 = selPoke.type === 'fire' ? 'Arañazo (Normal / 40 Pot)' : 'Placaje (Normal / 40 Pot)';
    const move2 = selPoke.type === 'water' ? 'Látigo (Baja Def Rival)' : 'Gruñido (Baja Atq Rival)';
    ctx.fillText(`⚔️ ${move1}`, detailX + detailW / 2, detailY + 325);
    ctx.fillText(`🛡️ ${move2}`, detailX + detailW / 2, detailY + 350);

    // Pie de Controles
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "PokemonGBA", "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("Usa las Flechas [← / → / ↑ / ↓] para navegar • [ENTER / Z] Elegir • [ESC / X] Volver", width / 2, height - 25);

    ctx.restore();
  }
}
