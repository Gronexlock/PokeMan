import { AssetLoader } from '../graphics/assetLoader';

export type TitleMenuOption = 'NEW_GAME' | 'CONTINUE' | 'POKEDEX' | 'OPTIONS';

export class TitleScreen {
  public selectedIndex: number = 0;
  public options: { label: string; key: TitleMenuOption; icon: string }[] = [
    { label: "NUEVA PARTIDA", key: "NEW_GAME", icon: "🌟" },
    { label: "CONTINUAR", key: "CONTINUE", icon: "💾" },
    { label: "POKÉDEX REGIONAL", key: "POKEDEX", icon: "📖" },
    { label: "CONFIGURACIÓN", key: "OPTIONS", icon: "⚙️" }
  ];

  private animTimer: number = 0;

  public update(dt: number): void {
    this.animTimer += dt;
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    saveExists: boolean
  ): void {
    ctx.save();

    // 1. Fondo cósmico con partículas sutiles
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#030712');
    bgGrad.addColorStop(0.5, '#0f172a');
    bgGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Partículas de estrellas
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 40; i++) {
      const px = (Math.sin(i * 99 + this.animTimer * 0.2) * 0.5 + 0.5) * width;
      const py = (Math.cos(i * 33 + this.animTimer * 0.15) * 0.5 + 0.5) * height;
      const sz = (Math.sin(i + this.animTimer * 2) * 0.5 + 0.5) * 2 + 1;
      ctx.fillRect(px, py, sz, sz);
    }

    // 2. Título Principal
    const titleY = height * 0.26;
    ctx.textAlign = 'center';

    // Resplandor del título
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 46px "PokemonGBA", "Outfit", sans-serif';
    ctx.fillText("POKÉMON", width / 2, titleY);

    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 24px "PokemonGBA", "Outfit", sans-serif';
    ctx.fillText("✨ E C O S   D E   A N D A R A ✨", width / 2, titleY + 40);

    ctx.shadowBlur = 0; // Reset shadow
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "PokemonGBA", "Outfit", sans-serif';
    ctx.fillText("[ Edición HD-2.5D — TypeScript & Canvas Engine ]", width / 2, titleY + 70);

    // 3. Menú de opciones
    const menuStartY = height * 0.55;
    const itemHeight = 44;
    const itemWidth = 320;

    this.options.forEach((opt, idx) => {
      const isSel = idx === this.selectedIndex;
      const isContinueDisabled = opt.key === 'CONTINUE' && !saveExists;

      const itemX = (width - itemWidth) / 2;
      const itemY = menuStartY + idx * (itemHeight + 10);

      // Fondo de botón
      if (isSel) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(itemX, itemY, itemWidth, itemHeight);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 16px "PokemonGBA", "Outfit", sans-serif';
      } else {
        ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(itemX, itemY, itemWidth, itemHeight);
        ctx.strokeRect(itemX, itemY, itemWidth, itemHeight);

        ctx.fillStyle = isContinueDisabled ? '#64748b' : '#f8fafc';
        ctx.font = '15px "PokemonGBA", "Outfit", sans-serif';
      }

      ctx.textAlign = 'left';
      ctx.fillText(`${opt.icon}  ${opt.label}`, itemX + 24, itemY + 28);
    });

    // Pie de página con controles
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = '13px "PokemonGBA", "Outfit", sans-serif';
    ctx.fillText("Usa las Flechas [↑ / ↓] o WASD para navegar, y ENTER / ESPACIO para seleccionar", width / 2, height - 25);

    ctx.restore();
  }
}
