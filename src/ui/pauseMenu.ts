import { SaveData, PokemonInstance, SpeciesData } from '../core/types';
import { AssetLoader } from '../graphics/assetLoader';
import { AudioEngine } from '../audio/audioEngine';

export type PauseMenuTab = 'MAIN' | 'PARTY' | 'BAG' | 'POKEDEX' | 'OPTIONS';

export class PauseMenu {
  private loader: AssetLoader;
  private audio: AudioEngine;

  public activeTab: PauseMenuTab = 'MAIN';
  public selectedIndex: number = 0;
  public selectedPokedexIndex: number = 0;
  public selectedPartyMemberIndex: number = 0;
  public saveMessage: string = "";
  private saveMessageTimer: number = 0;

  // Colores de tipos oficiales
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

  public menuItems = [
    { label: "POKÉMON", tab: "PARTY" as PauseMenuTab, icon: "🐾" },
    { label: "MOCHILA", tab: "BAG" as PauseMenuTab, icon: "🎒" },
    { label: "POKÉDEX", tab: "POKEDEX" as PauseMenuTab, icon: "📖" },
    { label: "GUARDAR", tab: "MAIN" as PauseMenuTab, icon: "💾", isAction: true },
    { label: "SALIR AL TÍTULO", tab: "MAIN" as PauseMenuTab, icon: "🚪", isExit: true }
  ];

  constructor() {
    this.loader = AssetLoader.getInstance();
    this.audio = AudioEngine.getInstance();
  }

  public update(dt: number): void {
    if (this.saveMessageTimer > 0) {
      this.saveMessageTimer -= dt;
      if (this.saveMessageTimer <= 0) {
        this.saveMessage = "";
      }
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    saveData: SaveData,
    width: number,
    height: number
  ): void {
    ctx.save();

    // Fondo oscurecido con desenfoque
    ctx.fillStyle = 'rgba(3, 7, 18, 0.86)';
    ctx.fillRect(0, 0, width, height);

    if (this.activeTab === 'MAIN') {
      this.renderMainMenuDrawer(ctx, saveData, width, height);
    } else if (this.activeTab === 'PARTY') {
      this.renderPartyViewer(ctx, saveData.party, width, height);
    } else if (this.activeTab === 'BAG') {
      this.renderBagViewer(ctx, saveData.inventory, width, height);
    } else if (this.activeTab === 'POKEDEX') {
      this.renderPokedexViewer(ctx, width, height);
    }

    // Toast de guardado si está activo
    if (this.saveMessage) {
      ctx.fillStyle = '#22c55e';
      ctx.fillRect((width - 340) / 2, 24, 340, 44);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect((width - 340) / 2, 24, 340, 44);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px "PokemonGBA", "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.saveMessage, width / 2, 51);
      ctx.textAlign = 'left';
    }

    ctx.restore();
  }

  private renderMainMenuDrawer(
    ctx: CanvasRenderingContext2D,
    saveData: SaveData,
    width: number,
    height: number
  ): void {
    const drawerW = 340;
    const drawerH = 430;
    const drawerX = width - drawerW - 40;
    const drawerY = (height - drawerH) / 2;

    // Panel del menú con glassmorphism
    ctx.fillStyle = 'rgba(15, 23, 42, 0.97)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.fillRect(drawerX, drawerY, drawerW, drawerH);
    ctx.strokeRect(drawerX, drawerY, drawerW, drawerH);

    // Cabecera con datos del entrenador
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(drawerX, drawerY, drawerW, 64);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "PokemonGBA", "Outfit", sans-serif';
    ctx.fillText(`🎮 ${saveData.player_name}`, drawerX + 20, drawerY + 34);

    ctx.fillStyle = '#e0f2fe';
    ctx.font = '12px "PokemonGBA", "Outfit", sans-serif';
    ctx.fillText(`💰 $${saveData.money.toLocaleString()}  •  🏅 Medallas: ${saveData.badges.length}`, drawerX + 20, drawerY + 54);

    // Opciones del menú
    const itemH = 46;
    const startY = drawerY + 80;

    this.menuItems.forEach((item, idx) => {
      const isSel = idx === this.selectedIndex;
      const itemY = startY + idx * (itemH + 10);

      if (isSel) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(drawerX + 16, itemY, drawerW - 32, itemH);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 15px "PokemonGBA", "Outfit", sans-serif';
      } else {
        ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(drawerX + 16, itemY, drawerW - 32, itemH);
        ctx.strokeRect(drawerX + 16, itemY, drawerW - 32, itemH);

        ctx.fillStyle = '#f8fafc';
        ctx.font = '14px "PokemonGBA", "Outfit", sans-serif';
      }

      ctx.fillText(`${item.icon}  ${item.label}`, drawerX + 32, itemY + 29);
    });

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px "PokemonGBA", "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("Presiona ESC o X para volver", drawerX + drawerW / 2, drawerY + drawerH - 16);
    ctx.textAlign = 'left';
  }

  private renderPartyViewer(
    ctx: CanvasRenderingContext2D,
    party: PokemonInstance[],
    width: number,
    height: number
  ): void {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.98)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    const boxW = 860;
    const boxH = 480;
    const boxX = (width - boxW) / 2;
    const boxY = (height - boxH) / 2;

    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "PokemonGBA", "Outfit", sans-serif';
    ctx.fillText("🐾 EQUIPO POKÉMON", boxX + 30, boxY + 42);

    // Lista de 6 miembros
    for (let i = 0; i < 6; i++) {
      const poke = party[i];
      const isSel = i === this.selectedPartyMemberIndex;
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cardX = boxX + 30 + col * 405;
      const cardY = boxY + 65 + row * 125;
      const cardW = 390;
      const cardH = 112;

      if (poke) {
        ctx.fillStyle = isSel ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.7)';
        ctx.strokeStyle = isSel ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = isSel ? 2.5 : 1;
        ctx.fillRect(cardX, cardY, cardW, cardH);
        ctx.strokeRect(cardX, cardY, cardW, cardH);

        // Icono / Artwork
        const icon = this.loader.getImage(this.loader.getPokemonArtworkUrl(poke.species_id)) ||
                     this.loader.getImage(this.loader.getPokemonGifUrl(poke.species_id));
        if (icon && icon.complete && icon.naturalWidth > 0) {
          ctx.drawImage(icon, cardX + 10, cardY + 12, 60, 60);
        }

        // Nombre y Nivel
        ctx.fillStyle = isSel ? '#ffffff' : '#f1f5f9';
        ctx.font = 'bold 15px "PokemonGBA", "Outfit", sans-serif';
        const pName = poke.nickname || poke.species_name;
        ctx.fillText(`${pName}`, cardX + 80, cardY + 28);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 12px "PokemonGBA", "Outfit", sans-serif';
        ctx.fillText(`Nv. ${poke.level}`, cardX + cardW - 70, cardY + 28);

        // Barra HP
        const hpRatio = Math.max(0, Math.min(1, poke.current_hp / poke.max_hp));
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cardX + 80, cardY + 38, 200, 8);
        ctx.fillStyle = hpRatio < 0.2 ? '#ef4444' : hpRatio < 0.5 ? '#eab308' : '#22c55e';
        ctx.fillRect(cardX + 80, cardY + 38, 200 * hpRatio, 8);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px "PokemonGBA", "Outfit", sans-serif';
        ctx.fillText(`PS: ${poke.current_hp}/${poke.max_hp}  •  ${poke.effective_nature.toUpperCase()}`, cardX + 80, cardY + 62);

        // Tipos con píldoras de color
        let tx = cardX + 80;
        poke.types.forEach(t => {
          const tColor = this.typeColors[t] || '#64748b';
          ctx.fillStyle = tColor;
          ctx.fillRect(tx, cardY + 74, 56, 18);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px "PokemonGBA", "Outfit", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(t.toUpperCase(), tx + 28, cardY + 87);
          tx += 62;
        });
        ctx.textAlign = 'left';
      } else {
        // Slot vacío
        ctx.fillStyle = 'rgba(30, 41, 59, 0.3)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(cardX, cardY, cardW, cardH);
        ctx.strokeRect(cardX, cardY, cardW, cardH);

        ctx.fillStyle = '#64748b';
        ctx.font = '14px "PokemonGBA", "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("— Espacio Disponible —", cardX + cardW / 2, cardY + cardH / 2 + 5);
        ctx.textAlign = 'left';
      }
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "PokemonGBA", "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("Presiona ESC o X para volver", boxX + boxW / 2, boxY + boxH - 16);
    ctx.textAlign = 'left';
  }

  private renderBagViewer(
    ctx: CanvasRenderingContext2D,
    inventory: Record<string, number>,
    width: number,
    height: number
  ): void {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.98)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    const boxW = 800;
    const boxH = 460;
    const boxX = (width - boxW) / 2;
    const boxY = (height - boxH) / 2;

    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "PokemonGBA", "Outfit", sans-serif';
    ctx.fillText("🎒 MOCHILA DE AVENTURA", boxX + 30, boxY + 45);

    const itemsDb: Record<string, string> = {
      pokeball: "🔴 Poké Ball — Dispositivo para capturar Pokémon salvajes.",
      greatball: "🔵 Super Ball — Mayor ratio de captura x1.5.",
      ultraball: "🟡 Ultra Ball — Excelente ratio de captura x2.0.",
      potion: "🧪 Poción — Medicina que restaura 50 PS.",
      superpotion: "🧪 Superpoción — Medicina concentrada que restaura 100 PS.",
      adamant_mint: "🌿 Menta Firme — Hierba aromática que orienta la naturaleza al Ataque."
    };

    const entries = Object.entries(inventory);
    if (entries.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '15px "PokemonGBA", "Outfit", sans-serif';
      ctx.fillText("Tu mochila está vacía por ahora. ¡Consigue objetos en tu viaje!", boxX + 30, boxY + 120);
    } else {
      entries.forEach(([id, qty], idx) => {
        const desc = itemsDb[id] || `${id} — Objeto útil de exploración.`;
        const itemY = boxY + 80 + idx * 48;

        ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
        ctx.fillRect(boxX + 30, itemY, boxW - 60, 40);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.strokeRect(boxX + 30, itemY, boxW - 60, 40);

        ctx.fillStyle = '#f8fafc';
        ctx.font = '14px "PokemonGBA", "Outfit", sans-serif';
        ctx.fillText(`${desc}`, boxX + 45, itemY + 26);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 15px "PokemonGBA", "Outfit", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`x${qty}`, boxX + boxW - 45, itemY + 26);
        ctx.textAlign = 'left';
      });
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "PokemonGBA", "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("Presiona ESC o X para volver", boxX + boxW / 2, boxY + boxH - 16);
    ctx.textAlign = 'left';
  }

  private renderPokedexViewer(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    const pokedexDb = this.loader.getJson<Record<string, SpeciesData>>('pokedex.json') || {};
    const speciesList = Object.values(pokedexDb).sort((a, b) => a.id - b.id);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.98)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    const boxW = 880;
    const boxH = 490;
    const boxX = (width - boxW) / 2;
    const boxY = (height - boxH) / 2;

    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "PokemonGBA", "Outfit", sans-serif';
    ctx.fillText("📖 POKÉDEX REGIONAL DE ANDARA", boxX + 30, boxY + 42);

    // Lista desplazable a la izquierda
    const listW = 340;
    const listH = 390;
    const listX = boxX + 30;
    const listY = boxY + 60;

    ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
    ctx.fillRect(listX, listY, listW, listH);

    const visibleCount = 8;
    const startIdx = Math.max(0, Math.min(speciesList.length - visibleCount, this.selectedPokedexIndex - 3));

    for (let i = 0; i < visibleCount; i++) {
      const idx = startIdx + i;
      if (idx >= speciesList.length) break;
      const sp = speciesList[idx];
      const isSel = idx === this.selectedPokedexIndex;
      const itemY = listY + 8 + i * 46;

      if (isSel) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(listX + 6, itemY, listW - 12, 40);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 15px "PokemonGBA", "Outfit", sans-serif';
      } else {
        ctx.fillStyle = 'rgba(51, 65, 85, 0.7)';
        ctx.fillRect(listX + 6, itemY, listW - 12, 40);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '14px "PokemonGBA", "Outfit", sans-serif';
      }

      const numStr = `#${sp.id.toString().padStart(3, '0')}`;
      ctx.fillText(`${numStr}  ${sp.name}`, listX + 16, itemY + 26);
    }

    // Panel de detalles del Pokémon seleccionado a la derecha
    const selSpecies = speciesList[this.selectedPokedexIndex];
    if (selSpecies) {
      const detailX = boxX + listW + 50;
      const detailY = listY;
      const detailW = boxW - listW - 80;

      // Ilustración Oficial
      const artwork = this.loader.getImage(this.loader.getPokemonArtworkUrl(selSpecies.id)) ||
                      this.loader.getImage(this.loader.getPokemonGifUrl(selSpecies.id));
      if (artwork && artwork.complete && artwork.naturalWidth > 0) {
        ctx.drawImage(artwork, detailX + (detailW - 140) / 2, detailY + 10, 140, 140);
      }

      // Nombre y Número
      ctx.textAlign = 'center';
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 22px "PokemonGBA", "Outfit", sans-serif';
      ctx.fillText(`#${selSpecies.id.toString().padStart(3, '0')}  ${selSpecies.name}`, detailX + detailW / 2, detailY + 180);

      // Tipos con píldoras de color
      let totalPillsW = selSpecies.types.length * 70;
      let startPillX = detailX + (detailW - totalPillsW) / 2;
      selSpecies.types.forEach(t => {
        const col = this.typeColors[t] || '#64748b';
        ctx.fillStyle = col;
        ctx.fillRect(startPillX, detailY + 195, 64, 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px "PokemonGBA", "Outfit", sans-serif';
        ctx.fillText(t.toUpperCase(), startPillX + 32, detailY + 210);
        startPillX += 70;
      });

      // Estadísticas Base con barras visuales
      const statsList: { label: string; val: number; col: string }[] = [
        { label: "PS", val: selSpecies.stats.hp, col: '#ef4444' },
        { label: "ATQ", val: selSpecies.stats.attack, col: '#f97316' },
        { label: "DEF", val: selSpecies.stats.defense, col: '#eab308' },
        { label: "AT.ESP", val: selSpecies.stats.special_attack, col: '#3b82f6' },
        { label: "DF.ESP", val: selSpecies.stats.special_defense, col: '#22c55e' },
        { label: "VEL", val: selSpecies.stats.speed, col: '#ec4899' }
      ];

      ctx.textAlign = 'left';
      statsList.forEach((st, sIdx) => {
        const col = sIdx % 2;
        const row = Math.floor(sIdx / 2);
        const stX = detailX + 10 + col * 220;
        const stY = detailY + 235 + row * 26;

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px "PokemonGBA", "Outfit", sans-serif';
        ctx.fillText(`${st.label}: ${st.val}`, stX, stY + 12);

        // Barra de estadística
        const barMax = 160;
        const barRatio = Math.min(1.0, st.val / barMax);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(stX + 75, stY + 4, 120, 8);
        ctx.fillStyle = st.col;
        ctx.fillRect(stX + 75, stY + 4, 120 * barRatio, 8);
      });
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "PokemonGBA", "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("Usa las Flechas [↑ / ↓] para navegar • [ESC / X] Volver", boxX + boxW / 2, boxY + boxH - 14);
    ctx.textAlign = 'left';
  }

  public showSaveToast(msg: string = "¡Partida guardada con éxito!"): void {
    this.saveMessage = msg;
    this.saveMessageTimer = 2.5;
  }
}
