import { AssetLoader } from '../graphics/assetLoader';

export interface CharacterProfile {
  name: string;
  gender: 'female' | 'male';
  sprite: string;
}

export class CharacterSelectScreen {
  private loader: AssetLoader;
  public selectedSkinIndex: number = 0;
  public playerName: string = "Lucas";
  public isNaming: boolean = false;
  private animTimer: number = 0;

  public skins: { label: string; subLabel: string; sprite: string; gender: 'female' | 'male'; defaultName: string }[] = [
    { label: "Joven Blanco", subLabel: "León / Lucas", sprite: "young_guy.png", gender: "male", defaultName: "Lucas" },
    { label: "Joven Blanca", subLabel: "Aria / Clara", sprite: "player.png", gender: "female", defaultName: "Aria" },
    { label: "Joven Moreno", subLabel: "Mateo / Inti", sprite: "straw.png", gender: "male", defaultName: "Mateo" },
    { label: "Joven Morena", subLabel: "Samay / Maya", sprite: "young_girl.png", gender: "female", defaultName: "Samay" }
  ];

  constructor() {
    this.loader = AssetLoader.getInstance();
  }

  public selectNext(): void {
    this.selectedSkinIndex = (this.selectedSkinIndex + 1) % this.skins.length;
    this.playerName = this.skins[this.selectedSkinIndex].defaultName;
  }

  public selectPrev(): void {
    this.selectedSkinIndex = (this.selectedSkinIndex - 1 + this.skins.length) % this.skins.length;
    this.playerName = this.skins[this.selectedSkinIndex].defaultName;
  }

  public render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    this.animTimer += 0.016;
    ctx.save();

    // Fondo oscuro con degradado cósmico
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#030712');
    bg.addColorStop(0.5, '#0f172a');
    bg.addColorStop(1, '#1e1b4b');
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

    // Título Principal
    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 24px "PokemonGBA", "Outfit", sans-serif';
    ctx.fillText("PERFIL DEL ENTRENADOR", width / 2 + 20, 42);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "PokemonGBA", "Outfit", sans-serif';
    ctx.fillText("Elige tu apariencia y nombre antes de comenzar tu viaje por Andara", width / 2, 75);

    // Tarjetas de Selección de Skin
    const cardW = 184;
    const cardH = 230;
    const spacing = 20;
    const totalW = this.skins.length * cardW + (this.skins.length - 1) * spacing;
    const startX = (width - totalW) / 2;
    const startY = 105;

    this.skins.forEach((skin, idx) => {
      const isSel = idx === this.selectedSkinIndex;
      const x = startX + idx * (cardW + spacing);
      const y = startY;

      // Caja de la tarjeta
      if (isSel) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
      } else {
        ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
      }
      ctx.fillRect(x, y, cardW, cardH);
      ctx.strokeRect(x, y, cardW, cardH);

      // Sprite del personaje
      const pImg = this.loader.getImage(`/assets/sprites/gba/characters/${skin.sprite}`);
      if (pImg && pImg.complete && pImg.naturalWidth > 0) {
        const fw = pImg.width / 4;
        const fh = pImg.height / 4;
        ctx.drawImage(pImg, 0, 0, fw, fh, x + (cardW - 76) / 2, y + 20, 76, 90);
      } else {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(x + 52, y + 25, 80, 80);
      }

      // Nombre del arquetipo
      ctx.textAlign = 'center';
      ctx.fillStyle = isSel ? '#ffffff' : '#e2e8f0';
      ctx.font = isSel ? 'bold 15px "PokemonGBA", "Outfit", sans-serif' : '14px "PokemonGBA", "Outfit", sans-serif';
      ctx.fillText(skin.label, x + cardW / 2, y + 140);

      // Subtítulo sugerido
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px "PokemonGBA", "Outfit", sans-serif';
      ctx.fillText(skin.subLabel, x + cardW / 2, y + 162);

      // Píldora de Género
      const genderBg = skin.gender === 'female' ? '#f43f5e' : '#0284c7';
      ctx.fillStyle = genderBg;
      ctx.fillRect(x + (cardW - 90) / 2, y + 182, 90, 22);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "PokemonGBA", "Outfit", sans-serif';
      ctx.fillText(skin.gender === 'female' ? '♀ Femenino' : '♂ Masculino', x + cardW / 2, y + 197);
    });

    // Campo de Nombre
    const nameBoxY = startY + cardH + 30;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.fillRect(width / 2 - 180, nameBoxY, 360, 48);
    ctx.strokeRect(width / 2 - 180, nameBoxY, 360, 48);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "PokemonGBA", "Outfit", sans-serif';
    const cursor = Math.sin(this.animTimer * 5) > 0 ? '|' : '';
    ctx.fillText(`Nombre: ${this.playerName}${cursor}`, width / 2, nameBoxY + 31);

    // Controles en el pie
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "PokemonGBA", "Outfit", sans-serif';
    ctx.fillText("Usa las Flechas [← / →] para elegir aspecto • [ENTER / Z] Confirmar • [ESC / X] Volver", width / 2, height - 25);

    ctx.restore();
  }

  public getSelectedProfile(): CharacterProfile {
    const skin = this.skins[this.selectedSkinIndex];
    return {
      name: this.playerName,
      gender: skin.gender,
      sprite: skin.sprite
    };
  }
}
