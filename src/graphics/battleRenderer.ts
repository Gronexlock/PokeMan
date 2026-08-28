import { PokemonInstance, TimePeriod, MoveSlot, StatusCondition } from '../core/types';
import { BattleEngine, BattleEventLog } from '../core/battleEngine';
import { AssetLoader } from './assetLoader';
import { ParticleSystem, ParticleType } from './particleSystem';

export type BattleMenuMode = 'MAIN' | 'MOVES' | 'BAG' | 'PARTY' | 'ANIMATING';

export class BattleRenderer {
  private loader: AssetLoader;
  public particleSystem: ParticleSystem;
  public menuMode: BattleMenuMode = 'MAIN';
  public selectedMoveIndex: number = 0;
  public selectedBagIndex: number = 0;
  public selectedMainMenuIndex: number = 0; // 0: Luchar, 1: Mochila, 2: Pokémon, 3: Huir
  public selectedPartyIndex: number = 0;

  // Caché interna de sprites asíncronos para batalla fluida a 60 FPS
  private oppSpriteCache: Map<string, HTMLImageElement> = new Map();
  private playerSpriteCache: Map<string, HTMLImageElement> = new Map();
  private iconCache: Map<string, HTMLImageElement> = new Map();
  private trainerAvatarCache: Map<string, HTMLImageElement> = new Map();

  // Animaciones de combate
  private playerAnimBounce: number = 0;
  private opponentAnimBounce: number = 0;
  private animTimer: number = 0;
  public currentMessage: string = "";
  public isAnimatingRound: boolean = false;

  // Colores por tipo para los botones de ataques
  private typeColors: Record<string, string> = {
    normal: '#a8a878',
    fire: '#f08030',
    water: '#6890f0',
    grass: '#78c850',
    electric: '#f8d030',
    ice: '#98d8d8',
    fighting: '#c03028',
    poison: '#a040a0',
    ground: '#e0c068',
    flying: '#a890f0',
    psychic: '#f85888',
    bug: '#a8b820',
    rock: '#b8a038',
    ghost: '#705898',
    dragon: '#7038f8',
    dark: '#705848',
    steel: '#b8b8d0',
    fairy: '#ee99ac'
  };

  constructor() {
    this.loader = AssetLoader.getInstance();
    this.particleSystem = new ParticleSystem();
  }

  public update(dt: number): void {
    this.animTimer += dt;
    this.playerAnimBounce = Math.sin(this.animTimer * 4) * 3;
    this.opponentAnimBounce = Math.cos(this.animTimer * 4) * 3;
    this.particleSystem.update(dt);
  }

  public triggerAttackAnimation(moveType: string, isPlayer: boolean, width: number, height: number): void {
    const plX = width * 0.26;
    const plY = height * 0.66 - 50;
    const oppX = width * 0.72;
    const oppY = height * 0.40 - 30;

    let pType: ParticleType = 'SLASH';
    const t = moveType.toLowerCase();

    if (t === 'fire') pType = 'FIRE';
    else if (t === 'water') pType = 'WATER';
    else if (t === 'grass') pType = 'GRASS';
    else if (t === 'electric') pType = 'ELECTRIC';
    else if (t === 'status_up') pType = 'STAT_UP';
    else if (t === 'status_down') pType = 'STAT_DOWN';

    if (isPlayer) {
      this.particleSystem.spawnAttackFX(pType, plX, plY, oppX, oppY);
    } else {
      this.particleSystem.spawnAttackFX(pType, oppX, oppY, plX, plY);
    }
  }

  /**
   * Precarga de forma asíncrona todos los sprites de la batalla actual (Showdown / PokeAPI CDN)
   */
  public preloadBattleSprites(battle: BattleEngine): void {
    if (battle.opponent_active) {
      const opp = battle.opponent_active;
      const isShiny = !!(opp as any).is_shiny;
      const key = `${opp.species_id}_${isShiny ? 'shiny' : 'norm'}`;
      if (!this.oppSpriteCache.has(key)) {
        this.loader.getPokemonSpriteFront(opp.species_id, isShiny).then(img => {
          this.oppSpriteCache.set(key, img);
        }).catch(() => {});
      }
    }

    if (battle.player_active) {
      const pl = battle.player_active;
      const isShiny = !!(pl as any).is_shiny;
      const key = `${pl.species_id}_${isShiny ? 'shiny' : 'norm'}`;
      if (!this.playerSpriteCache.has(key)) {
        this.loader.getPokemonSpriteBack(pl.species_id, isShiny).then(img => {
          this.playerSpriteCache.set(key, img);
        }).catch(() => {});
      }
    }

    // Precargar íconos de toda la party
    if (battle.player_party) {
      for (const p of battle.player_party) {
        const iconKey = `icon_${p.species_id}`;
        if (!this.iconCache.has(iconKey)) {
          this.loader.getPokemonIcon(p.species_id).then(img => {
            this.iconCache.set(iconKey, img);
          }).catch(() => {});
        }
      }
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    battle: BattleEngine,
    timePeriod: TimePeriod,
    width: number,
    height: number
  ): void {
    ctx.save();

    // Asegurar precarga continua sin bloquear
    this.preloadBattleSprites(battle);

    // Aplicar Screen Shake
    const shake = this.particleSystem.getShakeOffset();
    ctx.translate(shake.x, shake.y);

    // 1. Fondo Parallax del escenario de combate
    this.renderBattleBackground(ctx, timePeriod, width, height);

    // 2. Plataformas de combate
    this.renderBattlePlatforms(ctx, width, height);

    // 3. Sprites de Pokémon (GIFs animados desde Showdown / PokeAPI CDN)
    this.renderPokemonSprites(ctx, battle, width, height);

    // 4. Partículas y Efectos de Ataque
    this.particleSystem.render(ctx);

    // 5. HUDs de Vida y Estado (Jugador y Rival)
    this.renderHealthHuds(ctx, battle, width, height);

    // 6. Panel de Control Inferior (Menú / Movimientos / Mensajes)
    this.renderBattleControlPanel(ctx, battle, width, height);

    ctx.restore();
  }

  private renderBattleBackground(
    ctx: CanvasRenderingContext2D,
    timePeriod: TimePeriod,
    width: number,
    height: number
  ): void {
    // Gradiente del cielo
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.65);
    if (timePeriod === 'morning') {
      skyGrad.addColorStop(0, '#fbcfe8');
      skyGrad.addColorStop(0.5, '#fed7aa');
      skyGrad.addColorStop(1, '#fef08a');
    } else if (timePeriod === 'day') {
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(0.6, '#bae6fd');
      skyGrad.addColorStop(1, '#e0f2fe');
    } else if (timePeriod === 'sunset') {
      skyGrad.addColorStop(0, '#7c2d12');
      skyGrad.addColorStop(0.4, '#ea580c');
      skyGrad.addColorStop(1, '#fde047');
    } else {
      // Noche
      skyGrad.addColorStop(0, '#030712');
      skyGrad.addColorStop(0.6, '#0f172a');
      skyGrad.addColorStop(1, '#1e1b4b');
    }

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height * 0.65);

    // Cordillera de Andara en silueta (Parallax)
    ctx.fillStyle = timePeriod === 'night' ? '#111827' : '#047857';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.65);
    ctx.lineTo(width * 0.15, height * 0.40);
    ctx.lineTo(width * 0.35, height * 0.55);
    ctx.lineTo(width * 0.55, height * 0.35);
    ctx.lineTo(width * 0.80, height * 0.50);
    ctx.lineTo(width, height * 0.38);
    ctx.lineTo(width, height * 0.65);
    ctx.closePath();
    ctx.fill();

    // Suelo de combate
    const groundGrad = ctx.createLinearGradient(0, height * 0.65, 0, height);
    groundGrad.addColorStop(0, timePeriod === 'night' ? '#1e293b' : '#15803d');
    groundGrad.addColorStop(1, timePeriod === 'night' ? '#0f172a' : '#166534');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, height * 0.65, width, height * 0.35);
  }

  private renderBattlePlatforms(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Plataforma del oponente (Arriba a la derecha)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(width * 0.72, height * 0.45, 140, 38, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#86efac';
    ctx.beginPath();
    ctx.ellipse(width * 0.72, height * 0.43, 130, 32, 0, 0, Math.PI * 2);
    ctx.fill();

    // Plataforma del jugador (Abajo a la izquierda)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(width * 0.26, height * 0.70, 180, 48, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.ellipse(width * 0.26, height * 0.68, 170, 42, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderPokemonSprites(
    ctx: CanvasRenderingContext2D,
    battle: BattleEngine,
    width: number,
    height: number
  ): void {
    const opp = battle.opponent_active;
    const player = battle.player_active;

    // ─────────────────────────────────────────────────────────────
    // 1. SPRITE RIVAL (Frente Animado vía Showdown / PokeAPI CDN)
    // ─────────────────────────────────────────────────────────────
    if (opp && opp.current_hp > 0) {
      const isShiny = !!(opp as any).is_shiny;
      const key = `${opp.species_id}_${isShiny ? 'shiny' : 'norm'}`;
      let oppImg = this.oppSpriteCache.get(key);

      // Si aún no está en caché, cargarlo asíncronamente
      if (!oppImg) {
        this.loader.getPokemonSpriteFront(opp.species_id, isShiny).then(img => {
          this.oppSpriteCache.set(key, img);
        }).catch(() => {});
        // Fallback síncrono mientras descarga
        oppImg = this.loader.getImage(this.loader.getPokemonGifUrl(opp.species_id)) ||
                 this.loader.getImage(this.loader.getPokemonArtworkUrl(opp.species_id));
      }

      const oppX = width * 0.72 - 75;
      const oppY = height * 0.40 - 105 + this.opponentAnimBounce;

      if (opp.is_mega) {
        // Aura dorada y brillante de Mega Evolución
        ctx.save();
        ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
        ctx.beginPath();
        ctx.arc(oppX + 75, oppY + 75, 85, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(oppX + 75, oppY + 75, 92, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (oppImg && oppImg.complete && oppImg.naturalWidth > 0) {
        // Mantener proporción nativa del GIF animado
        const ratio = oppImg.naturalWidth / oppImg.naturalHeight;
        const drawH = 150;
        const drawW = drawH * ratio;
        ctx.drawImage(oppImg, oppX + (150 - drawW) / 2, oppY, drawW, drawH);
      } else {
        // Sombra de carga estilizada
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.beginPath();
        ctx.ellipse(oppX + 75, oppY + 75, 45, 45, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. SPRITE JUGADOR (Espalda Animada vía Showdown / PokeAPI CDN)
    // ─────────────────────────────────────────────────────────────
    if (player && player.current_hp > 0) {
      const isShiny = !!(player as any).is_shiny;
      const key = `${player.species_id}_${isShiny ? 'shiny' : 'norm'}`;
      let plImg = this.playerSpriteCache.get(key);

      // Si aún no está en caché, cargarlo asíncronamente
      if (!plImg) {
        this.loader.getPokemonSpriteBack(player.species_id, isShiny).then(img => {
          this.playerSpriteCache.set(key, img);
        }).catch(() => {});
        // Fallback síncrono mientras descarga
        plImg = this.loader.getImage(this.loader.getPokemonBackGifUrl(player.species_id)) ||
                this.loader.getImage(this.loader.getPokemonGifUrl(player.species_id));
      }

      const plX = width * 0.26 - 95;
      const plY = height * 0.66 - 145 + this.playerAnimBounce;

      if (player.is_mega) {
        // Aura azul/dorada de Mega Evolución
        ctx.save();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.beginPath();
        ctx.arc(plX + 95, plY + 85, 105, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(plX + 95, plY + 85, 115, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (plImg && plImg.complete && plImg.naturalWidth > 0) {
        const ratio = plImg.naturalWidth / plImg.naturalHeight;
        const drawH = 190;
        const drawW = drawH * ratio;
        ctx.drawImage(plImg, plX + (190 - drawW) / 2, plY, drawW, drawH);
      } else {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
        ctx.beginPath();
        ctx.ellipse(plX + 95, plY + 85, 55, 55, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private renderHealthHuds(
    ctx: CanvasRenderingContext2D,
    battle: BattleEngine,
    width: number,
    height: number
  ): void {
    const opp = battle.opponent_active;
    const player = battle.player_active;

    // HUD Rival (Arriba a la izquierda)
    if (opp) {
      const hudX = width * 0.08;
      const hudY = height * 0.12;
      this.drawHealthCard(ctx, hudX, hudY, 320, 76, opp, false);
    }

    // HUD Jugador (Abajo a la derecha)
    if (player) {
      const hudX = width * 0.58;
      const hudY = height * 0.50;
      this.drawHealthCard(ctx, hudX, hudY, 340, 90, player, true);
    }
  }

  private drawHealthCard(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    poke: PokemonInstance,
    showNumbers: boolean
  ): void {
    ctx.save();
    // Fondo de tarjeta con gradiente oscuro y bordes redondeados
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = poke.is_mega ? '#fbbf24' : 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = poke.is_mega ? 2 : 1;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    // Nombre y Nivel
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px "PokemonGBA", "Outfit", sans-serif';
    const nameStr = poke.nickname || poke.species_name;
    const megaTag = poke.is_mega ? ' ✨[MEGA]' : '';
    ctx.fillText(`${nameStr}${megaTag}`, x + 16, y + 26);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px "PokemonGBA", "Outfit", sans-serif';
    ctx.fillText(`Nv. ${poke.level}`, x + w - 65, y + 26);

    // Barra de Vida
    const barX = x + 45;
    const barY = y + 40;
    const barW = w - 60;
    const barH = 10;

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px "PokemonGBA", "Outfit", sans-serif';
    ctx.fillText('PS', x + 16, barY + 9);

    // Fondo barra
    ctx.fillStyle = '#334155';
    ctx.fillRect(barX, barY, barW, barH);

    // Porcentaje de HP
    const hpRatio = Math.max(0, Math.min(1, poke.current_hp / poke.max_hp));
    let barColor = '#22c55e'; // Verde
    if (hpRatio < 0.20) barColor = '#ef4444'; // Rojo
    else if (hpRatio < 0.50) barColor = '#eab308'; // Amarillo

    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, barW * hpRatio, barH);

    // Números de HP
    if (showNumbers) {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '12px "PokemonGBA", "Outfit", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${poke.current_hp} / ${poke.max_hp}`, x + w - 16, y + 68);
      ctx.textAlign = 'left';

      // Barra de EXP Azul
      const expBarY = y + 74;
      const expBarH = 4;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(barX, expBarY, barW, expBarH);

      const expRatio = Math.max(0, Math.min(1, (poke.current_exp || 0) / (poke.to_next_level_exp || 100)));
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(barX, expBarY, barW * expRatio, expBarH);

      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 9px "PokemonGBA", "Outfit", sans-serif';
      ctx.fillText('EXP', x + 16, expBarY + 5);
    }

    // Badge de estado alterado
    if (poke.status) {
      const statusLabels: Record<string, { label: string; color: string }> = {
        burn: { label: 'BRN', color: '#f97316' },
        paralysis: { label: 'PAR', color: '#eab308' },
        sleep: { label: 'SLP', color: '#94a3b8' },
        poison: { label: 'PSN', color: '#a855f7' },
        freeze: { label: 'FRZ', color: '#06b6d4' }
      };
      const info = statusLabels[poke.status] || { label: poke.status.toUpperCase(), color: '#64748b' };
      ctx.fillStyle = info.color;
      ctx.fillRect(x + 16, y + 54, 38, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px "PokemonGBA", "Outfit", sans-serif';
      ctx.fillText(info.label, x + 23, y + 67);
    }

    ctx.restore();
  }

  private renderBattleControlPanel(
    ctx: CanvasRenderingContext2D,
    battle: BattleEngine,
    width: number,
    height: number
  ): void {
    const panelY = height - 130;
    const panelH = 130;

    ctx.save();
    ctx.fillStyle = 'rgba(10, 15, 30, 0.96)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.fillRect(0, panelY, width, panelH);
    ctx.strokeRect(0, panelY, width, panelH);

    // 1. Mensajes de combate animados
    if (this.currentMessage) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px "PokemonGBA", "Outfit", sans-serif';
      ctx.fillText(this.currentMessage, 36, panelY + 50);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px "PokemonGBA", "Outfit", sans-serif';
      ctx.fillText('Presiona ENTER o Espacio para continuar...', 36, panelY + 85);
      ctx.restore();
      return;
    }

    // 2. Menú Principal de Comandos
    if (this.menuMode === 'MAIN') {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "PokemonGBA", "Outfit", sans-serif';
      ctx.fillText(`¿Qué debería hacer ${battle.player_active.species_name}?`, 40, panelY + 68);

      const options = [
        { label: '⚔️ LUCHAR', idx: 0, x: width * 0.50, y: panelY + 28 },
        { label: '🎒 MOCHILA', idx: 1, x: width * 0.74, y: panelY + 28 },
        { label: '🔄 POKÉMON', idx: 2, x: width * 0.50, y: panelY + 76 },
        { label: '🏃 HUIR', idx: 3, x: width * 0.74, y: panelY + 76 }
      ];

      for (const opt of options) {
        const isSel = opt.idx === this.selectedMainMenuIndex;
        ctx.fillStyle = isSel ? '#38bdf8' : 'rgba(30, 41, 59, 0.8)';
        ctx.fillRect(opt.x, opt.y, 180, 36);

        ctx.fillStyle = isSel ? '#0f172a' : '#ffffff';
        ctx.font = 'bold 14px "PokemonGBA", "Outfit", sans-serif';
        ctx.fillText(opt.label, opt.x + 20, opt.y + 24);
      }
    }

    // 3. Menú de Movimientos
    else if (this.menuMode === 'MOVES') {
      const moves = battle.player_active.moves;
      const positions = [
        { x: 30, y: panelY + 18 },
        { x: width * 0.40, y: panelY + 18 },
        { x: 30, y: panelY + 70 },
        { x: width * 0.40, y: panelY + 70 }
      ];

      for (let i = 0; i < 4; i++) {
        const pos = positions[i];
        const m = moves[i];
        const isSel = i === this.selectedMoveIndex;

        if (m) {
          const typeColor = this.typeColors[m.data.type] || '#64748b';
          ctx.fillStyle = isSel ? '#ffffff' : 'rgba(30, 41, 59, 0.9)';
          ctx.strokeStyle = typeColor;
          ctx.lineWidth = isSel ? 3 : 1;
          ctx.fillRect(pos.x, pos.y, 300, 44);
          ctx.strokeRect(pos.x, pos.y, 300, 44);

          // Nombre del ataque
          ctx.fillStyle = isSel ? '#0f172a' : '#ffffff';
          ctx.font = 'bold 15px "PokemonGBA", "Outfit", sans-serif';
          ctx.fillText(m.name, pos.x + 16, pos.y + 28);

          // PP
          ctx.fillStyle = isSel ? '#334155' : '#94a3b8';
          ctx.font = '13px "PokemonGBA", "Outfit", sans-serif';
          ctx.fillText(`PP: ${m.current_pp}/${m.max_pp}`, pos.x + 210, pos.y + 28);
        } else {
          ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
          ctx.fillRect(pos.x, pos.y, 300, 44);
          ctx.fillStyle = '#64748b';
          ctx.font = '14px "PokemonGBA", "Outfit", sans-serif';
          ctx.fillText('--', pos.x + 20, pos.y + 28);
        }
      }

      // Detalle del movimiento seleccionado a la derecha
      const selMove = moves[this.selectedMoveIndex];
      if (selMove) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px "PokemonGBA", "Outfit", sans-serif';
        ctx.fillText(`Tipo: ${selMove.data.type.toUpperCase()}`, width * 0.75, panelY + 36);
        ctx.fillText(`Poder: ${selMove.data.power || '-' }`, width * 0.75, panelY + 62);
        ctx.fillText(`Precisión: ${selMove.data.accuracy || '-' }%`, width * 0.75, panelY + 88);
      }
    }

    // 4. Mochila Interactiva de Combate (Poké Balls y Medicina)
    else if (this.menuMode === 'BAG') {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "PokemonGBA", "Outfit", sans-serif';
      ctx.fillText('🎒 MOCHILA DE COMBATE:', 36, panelY + 32);

      const items = [
        { label: '🔴 Poké Ball', action: 'BALL', ball_id: 'pokeball', desc: 'Atrapa Pokémon salvajes' },
        { label: '🔵 Super Ball', action: 'BALL', ball_id: 'greatball', desc: 'Ratio de captura x1.5' },
        { label: '🧪 Poción (+50 PS)', action: 'ITEM', item_id: 'potion', desc: 'Restaura 50 PS' },
        { label: '🧪 Superpoción (+100 PS)', action: 'ITEM', item_id: 'superpotion', desc: 'Restaura 100 PS' },
        { label: '↩️ Volver', action: 'BACK' }
      ];

      items.forEach((item, idx) => {
        const isSel = idx === this.selectedBagIndex;
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = 36 + col * 320;
        const y = panelY + 46 + row * 26;

        ctx.fillStyle = isSel ? '#38bdf8' : 'rgba(30, 41, 59, 0.85)';
        ctx.strokeStyle = isSel ? '#ffffff' : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = isSel ? 2 : 1;
        ctx.fillRect(x, y, 300, 24);
        ctx.strokeRect(x, y, 300, 24);

        ctx.fillStyle = isSel ? '#0f172a' : '#ffffff';
        ctx.font = isSel ? 'bold 12px "PokemonGBA", "Outfit", sans-serif' : '12px "PokemonGBA", "Outfit", sans-serif';
        ctx.fillText(item.label, x + 12, y + 17);
      });
    }

    // 5. Menú de Relevo Pokémon (PARTY con Íconos de PokéSprite)
    else if (this.menuMode === 'PARTY') {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px "PokemonGBA", "Outfit", sans-serif';
      ctx.fillText('🔄 SELECCIONA UN POKÉMON PARA RELEVO:', 30, panelY + 24);

      const party = battle.player_party;
      const cardW = 210;
      const cardH = 40;

      party.forEach((p, idx) => {
        const isSel = idx === this.selectedPartyIndex;
        const isActive = idx === battle.player_active_idx;
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const cx = 30 + col * (cardW + 12);
        const cy = panelY + 36 + row * (cardH + 6);

        ctx.fillStyle = isSel ? '#38bdf8' : isActive ? 'rgba(59, 130, 246, 0.4)' : 'rgba(30, 41, 59, 0.85)';
        ctx.strokeStyle = isSel ? '#ffffff' : isActive ? '#60a5fa' : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = isSel ? 2 : 1;
        ctx.fillRect(cx, cy, cardW, cardH);
        ctx.strokeRect(cx, cy, cardW, cardH);

        // Ícono de PokéSprite
        const iconKey = `icon_${p.species_id}`;
        const iconImg = this.iconCache.get(iconKey) || this.loader.getImage(this.loader.getPokemonIconUrl(p.species_id));
        let textOffset = 8;
        if (iconImg && iconImg.complete && iconImg.naturalWidth > 0) {
          ctx.drawImage(iconImg, cx + 4, cy + 4, 32, 32);
          textOffset = 40;
        }

        // Nombre y Nivel
        ctx.fillStyle = isSel ? '#0f172a' : '#ffffff';
        ctx.font = isSel ? 'bold 12px "PokemonGBA", "Outfit", sans-serif' : '12px "PokemonGBA", "Outfit", sans-serif';
        const pName = p.nickname || p.species_name;
        ctx.fillText(`${pName} Nv.${p.level}`, cx + textOffset, cy + 16);

        // Barra mini de PS
        const miniBarW = cardW - textOffset - 60;
        const miniBarH = 5;
        const miniBarX = cx + textOffset;
        const miniBarY = cy + 24;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(miniBarX, miniBarY, miniBarW, miniBarH);

        const r = Math.max(0, Math.min(1, p.current_hp / p.max_hp));
        ctx.fillStyle = r > 0.5 ? '#22c55e' : r > 0.2 ? '#eab308' : '#ef4444';
        ctx.fillRect(miniBarX, miniBarY, miniBarW * r, miniBarH);

        // Estado / Tag
        ctx.textAlign = 'right';
        ctx.fillStyle = isSel ? '#0f172a' : '#94a3b8';
        ctx.font = '10px "PokemonGBA", "Outfit", sans-serif';
        if (p.current_hp <= 0) {
          ctx.fillStyle = '#ef4444';
          ctx.fillText('FNT', cx + cardW - 8, cy + 18);
        } else if (isActive) {
          ctx.fillText('ACTIVO', cx + cardW - 8, cy + 18);
        } else {
          ctx.fillText(`${p.current_hp}/${p.max_hp}`, cx + cardW - 8, cy + 18);
        }
        ctx.textAlign = 'left';
      });

      // Botón Volver
      const backX = width - 110;
      const backY = panelY + panelH - 30;
      const isBackSel = this.selectedPartyIndex === party.length;
      ctx.fillStyle = isBackSel ? '#f59e0b' : 'rgba(30, 41, 59, 0.9)';
      ctx.fillRect(backX, backY, 90, 22);
      ctx.fillStyle = isBackSel ? '#0f172a' : '#f8fafc';
      ctx.font = 'bold 11px "PokemonGBA", "Outfit", sans-serif';
      ctx.fillText('↩️ Volver', backX + 16, backY + 15);
    }

    ctx.restore();
  }
}
