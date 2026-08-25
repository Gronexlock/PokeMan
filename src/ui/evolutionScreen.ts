import { PokemonInstance, SpeciesData } from '../core/types';
import { AssetLoader } from '../graphics/assetLoader';

export class EvolutionScreen {
  private loader: AssetLoader;
  public pokemon: PokemonInstance | null = null;
  public targetSpecies: SpeciesData | null = null;

  public animTimer: number = 0;
  public phase: 'INTRO' | 'PULSING' | 'FLASH' | 'REVEAL' | 'FINISHED' | 'CANCELLED' = 'INTRO';
  public onFinishedCallback?: () => void;

  constructor() {
    this.loader = AssetLoader.getInstance();
  }

  public startEvolution(
    pokemon: PokemonInstance,
    targetSpecies: SpeciesData,
    onFinished?: () => void
  ): void {
    this.pokemon = pokemon;
    this.targetSpecies = targetSpecies;
    this.animTimer = 0;
    this.phase = 'INTRO';
    this.onFinishedCallback = onFinished;
  }

  public update(dt: number): void {
    this.animTimer += dt;

    if (this.phase === 'INTRO' && this.animTimer > 2.0) {
      this.phase = 'PULSING';
      this.animTimer = 0;
    } else if (this.phase === 'PULSING' && this.animTimer > 5.5) {
      this.phase = 'FLASH';
      this.animTimer = 0;
    } else if (this.phase === 'FLASH' && this.animTimer > 0.6) {
      // Aplicar evolución en datos
      if (this.pokemon && this.targetSpecies) {
        this.pokemon.species_id = this.targetSpecies.id;
        this.pokemon.species_name = this.targetSpecies.name;
        this.pokemon.types = this.targetSpecies.types;
        // Recalcular salud proporcional
        const oldMax = this.pokemon.max_hp;
        const newHp = Math.floor(
          ((2 * this.targetSpecies.stats.hp + this.pokemon.ivs.hp + Math.floor(this.pokemon.evs.hp / 4)) * this.pokemon.level) / 100
        ) + this.pokemon.level + 10;
        this.pokemon.max_hp = newHp;
        this.pokemon.current_hp += (newHp - oldMax);
      }
      this.phase = 'REVEAL';
      this.animTimer = 0;
    } else if (this.phase === 'REVEAL' && this.animTimer > 4.0) {
      this.phase = 'FINISHED';
    }
  }

  public cancelEvolution(): boolean {
    if (this.phase === 'PULSING' || this.phase === 'INTRO') {
      this.phase = 'CANCELLED';
      this.animTimer = 0;
      return true;
    }
    return false;
  }

  public render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.pokemon || !this.targetSpecies) return;

    ctx.save();

    // 1. Fondo cósmico con gradiente estelar
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#020617');
    bg.addColorStop(0.5, '#0f172a');
    bg.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Partículas de luz estelar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 45; i++) {
      const px = ((Math.sin(i * 37 + this.animTimer * 0.4) + 1) / 2) * width;
      const py = ((Math.cos(i * 73 + this.animTimer * 0.3) + 1) / 2) * height;
      const sz = Math.sin(i + this.animTimer * 3) * 1.5 + 2;
      ctx.fillRect(px, py, sz, sz);
    }

    // 2. Título de la escena
    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 24px "PokemonGBA", "Outfit", sans-serif';
    ctx.fillText("✨ SECUENCIA DE EVOLUCIÓN ✨", width / 2, 60);

    // 3. Renderizado del Pokémon según la fase
    const centerX = width / 2;
    const centerY = height * 0.48;

    // Resplandor de fondo
    const glowRadius = 90 + Math.sin(this.animTimer * 6) * 20;
    const glow = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, glowRadius * 1.5);
    glow.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
    glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, glowRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    let showTarget = false;
    let scale = 1.0;
    let isSilhouette = false;

    if (this.phase === 'INTRO') {
      showTarget = false;
      scale = 1.0;
    } else if (this.phase === 'PULSING') {
      // Alternar rápidamente entre forma base y evolución
      const freq = 4 + this.animTimer * 2;
      showTarget = Math.sin(this.animTimer * freq) > 0;
      scale = 1.0 + Math.sin(this.animTimer * freq * 1.5) * 0.15;
      isSilhouette = true;
    } else if (this.phase === 'FLASH') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(0, 0, width, height);
      scale = 1.3;
      showTarget = true;
    } else {
      // REVEAL / FINISHED
      showTarget = true;
      scale = 1.15 + Math.sin(this.animTimer * 3) * 0.05;
    }

    const currentSpeciesId = showTarget ? this.targetSpecies.id : this.pokemon.species_id;
    const pokeImg = this.loader.getImage(this.loader.getPokemonArtworkUrl(currentSpeciesId)) ||
                    this.loader.getImage(this.loader.getPokemonGifUrl(currentSpeciesId));

    if (pokeImg && pokeImg.complete && pokeImg.naturalWidth > 0) {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);

      if (isSilhouette) {
        // Silueta blanca brillante
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 25;
      }

      ctx.drawImage(pokeImg, -90, -90, 180, 180);
      ctx.restore();
    }

    // 4. Caja de Diálogo Inferior
    const boxX = 60;
    const boxY = height - 130;
    const boxW = width - 120;
    const boxH = 100;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px "PokemonGBA", "Outfit", sans-serif';
    ctx.textAlign = 'center';

    const pokeName = this.pokemon.nickname || this.pokemon.species_name;

    if (this.phase === 'INTRO' || this.phase === 'PULSING') {
      ctx.fillText(`¡Anda! ¡Tu ${pokeName} está evolucionando!`, width / 2, boxY + 45);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px "PokemonGBA", "Outfit", sans-serif';
      ctx.fillText("[Presiona ESC o X para cancelar la evolución]", width / 2, boxY + 75);
    } else if (this.phase === 'CANCELLED') {
      ctx.fillText(`¿Eh? ¡${pokeName} detuvo su evolución!`, width / 2, boxY + 45);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '12px "PokemonGBA", "Outfit", sans-serif';
      ctx.fillText("[Presiona ESPACIO o ENTER para continuar]", width / 2, boxY + 75);
    } else {
      ctx.fillText(`¡Felicidades! ¡Tu Pokémon evolucionó a ${this.targetSpecies.name}!`, width / 2, boxY + 45);
      ctx.fillStyle = '#fbbf24';
      ctx.font = '13px "PokemonGBA", "Outfit", sans-serif';
      ctx.fillText(`Registrado en la Pokédex de Andara • [Presiona ENTER para continuar]`, width / 2, boxY + 75);
    }

    ctx.restore();
  }
}
