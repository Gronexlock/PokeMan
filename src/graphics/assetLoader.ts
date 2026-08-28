/**
 * AssetLoader — Singleton para carga y caché de todos los assets del juego.
 *
 * INTEGRACIÓN DE SPRITES CDN (Skyflyer Tutorial):
 *   • Pokémon Showdown  → sprites animados GIF (XY/ORAS/SV style)
 *   • PokeAPI GitHub    → sprites animados Gen 5 BW (649 Pokémon) + PNG estáticos
 *   • PokéSprite        → íconos de caja/menú (todas las formas y shinies)
 *
 * Jerarquía de fallback automático (sin configuración manual):
 *   Showdown GIF → PokeAPI GIF Gen5 → PokeAPI PNG estático → asset local
 */
export class AssetLoader {
  private static instance: AssetLoader;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  public dataCache: Map<string, any> = new Map();
  public isLoaded: boolean = false;
  public loadProgress: number = 0;

  // ─────────────────────────────────────────────────────────────────────────────
  // CDN — URLs base de cada fuente de sprites
  // Referencia: "CREATE YOUR OWN POKÉMON GAME FROM SCRATCH" — Skyflyer
  // https://www.youtube.com/watch?v=eUEQIDUPC_8
  // ─────────────────────────────────────────────────────────────────────────────
  private static readonly CDN = {
    // Pokémon Showdown — Sprites animados GIF (mejor calidad, incluye formas especiales)
    SHOWDOWN_FRONT:     'https://play.pokemonshowdown.com/sprites/ani/',
    SHOWDOWN_BACK:      'https://play.pokemonshowdown.com/sprites/ani-back/',
    SHOWDOWN_SHINY_F:   'https://play.pokemonshowdown.com/sprites/ani-shiny/',
    SHOWDOWN_SHINY_B:   'https://play.pokemonshowdown.com/sprites/ani-back-shiny/',

    // Pokémon Showdown — Retratos y Avatares de Entrenadores (+1000 personajes)
    SHOWDOWN_TRAINERS:  'https://play.pokemonshowdown.com/sprites/trainers/',

    // PokeAPI GitHub — Animados Gen 5 Black & White (primeros 649 Pokémon)
    POKEAPI_GEN5_F:     'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/',
    POKEAPI_GEN5_B:     'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/back/',

    // PokeAPI GitHub — Estáticos PNG (todos los Pokémon, siempre disponibles)
    POKEAPI_STATIC_F:   'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/',
    POKEAPI_STATIC_B:   'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/',
    POKEAPI_SHINY_F:    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/',
    POKEAPI_SHINY_B:    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/',

    // PokeAPI — Arte oficial HD (para pantallas de detalle y Pokédex)
    POKEAPI_ARTWORK:    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/',

    // PokéSprite — Íconos de caja/menú (para Pokédex, equipo, PC)
    POKESPRITE_ICON:    'https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen8/regular/',
    POKESPRITE_SHINY:   'https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen8/shiny/',
  } as const;

  private constructor() {}

  public static getInstance(): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader();
    }
    return AssetLoader.instance;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CARGA INICIAL DE ASSETS ESENCIALES
  // ─────────────────────────────────────────────────────────────────────────────

  public async loadAllEssentialAssets(onProgress?: (progress: number, asset: string) => void): Promise<void> {
    const jsonFiles = [
      'pokedex.json',
      'moves.json',
      'items.json',
      'maps_data.json',
      'dialogues.json',
      'trainers.json',
      'types.json',
      'mega_evolutions.json',
      'encounters.json'
    ];

    const characterSprites = [
      'player.png', 'professor.png', 'blond.png', 'hat_girl.png',
      'young_guy.png', 'purple_girl.png', 'straw.png', 'young_girl.png',
      'rival.png', 'gym_leader_rocio.png', 'gym_leader_thiago.png',
      'champion_renata.png', 'elite_inti.png', 'elite_marina.png',
      'npc_bugcatcher.png', 'npc_fisherman.png', 'npc_hiker.png',
      'npc_lass.png', 'npc_medium.png', 'npc_swimmer.png'
    ];

    const objectSprites = [
      'house_large.png', 'house_small.png', 'house_small_alt.png',
      'hospital.png', 'green_tree.png', 'green_tree_bushy.png',
      'green_tree_small.png', 'grass.png', 'grassrock1.png', 'grassrock2.png'
    ];

    const tilesetSprites = [
      'world.png', 'coast.png',
      'water/0.png', 'water/1.png', 'water/2.png', 'water/3.png'
    ];

    const totalAssets = jsonFiles.length + characterSprites.length + objectSprites.length + tilesetSprites.length;
    let completed = 0;

    const tick = (name: string) => {
      completed++;
      this.loadProgress = Math.min(1.0, completed / totalAssets);
      if (onProgress) onProgress(this.loadProgress, name);
    };

    // 1. JSONs
    await Promise.all(jsonFiles.map(async file => {
      try {
        const res = await fetch(`/data/${file}`);
        if (res.ok) this.dataCache.set(file, await res.json());
        else console.warn(`No se pudo cargar /data/${file}`);
      } catch (e) { console.warn(`Error al cargar /data/${file}:`, e); }
      tick(file);
    }));

    // 2. Spritesheets de personajes (locales — no bloquean si no existen)
    await Promise.all(characterSprites.map(async file => {
      await this.loadImage(`/assets/sprites/gba/characters/${file}`).catch(() => {});
      tick(file);
    }));

    // 3. Objetos del overworld
    await Promise.all(objectSprites.map(async file => {
      await this.loadImage(`/assets/sprites/gba/objects/${file}`).catch(() => {});
      tick(file);
    }));

    // 4. Tilesets
    await Promise.all(tilesetSprites.map(async file => {
      await this.loadImage(`/assets/sprites/gba/tilesets/${file}`).catch(() => {});
      tick(file);
    }));

    // 5. Fuente oficial Pokémon GBA
    try {
      const font = new FontFace('PokemonGBA', 'url(/assets/sprites/gba/fonts/pokemon_font.otf)');
      document.fonts.add(await font.load());
    } catch (e) {
      console.warn('No se pudo cargar la fuente PokemonGBA, usando fallback del sistema:', e);
    }

    this.isLoaded = true;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CARGA BASE DE IMÁGENES (con caché)
  // ─────────────────────────────────────────────────────────────────────────────

  public loadImage(src: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(src)) return Promise.resolve(this.imageCache.get(src)!);

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { this.imageCache.set(src, img); resolve(img); };
      img.onerror = () => { this.imageCache.set(src, img); resolve(img); };
      img.src = src;
    });
  }

  /**
   * Carga imagen con sistema de fallback en cascada.
   * Prueba cada URL en orden hasta que una cargue exitosamente.
   */
  private async loadWithFallback(urls: string[]): Promise<HTMLImageElement> {
    for (const url of urls) {
      if (this.imageCache.has(url) && this.imageCache.get(url)!.naturalWidth > 0) {
        return this.imageCache.get(url)!;
      }
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.crossOrigin = 'anonymous';
          el.onload = () => { if (el.naturalWidth > 0) resolve(el); else reject(); };
          el.onerror = () => reject();
          el.src = url;
        });
        this.imageCache.set(url, img);
        return img;
      } catch { /* continuar con el siguiente */ }
    }
    return new Image(); // fallback vacío — nunca rompe la ejecución
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS — Resolución de nombre Showdown a partir del species_id
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Convierte un species_id a nombre lowercase para Showdown/PokéSprite.
   * Ej: 6 → "charizard", 6 mega-x → "charizard-mega-x"
   */
  private idToName(speciesId: number, formSuffix?: string): string {
    const pokedex = this.dataCache.get('pokedex.json');
    let name = String(speciesId);
    if (pokedex) {
      const entry = pokedex[speciesId] ?? pokedex[String(speciesId)];
      if (entry?.name) name = entry.name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/-$/, '');
    }
    return formSuffix ? `${name}-${formSuffix}` : name;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SPRITES DE POKÉMON — API PRINCIPAL (asíncrona, con fallback automático)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Sprite FRONTAL animado del Pokémon (para lado del enemigo en batalla).
   * Fallback: Showdown → PokeAPI Gen5 GIF → PokeAPI PNG → local
   */
  public getPokemonSpriteFront(speciesId: number, shiny = false): Promise<HTMLImageElement> {
    const name = this.idToName(speciesId);
    if (shiny) {
      return this.loadWithFallback([
        `${AssetLoader.CDN.SHOWDOWN_SHINY_F}${name}.gif`,
        `${AssetLoader.CDN.POKEAPI_SHINY_F}${speciesId}.png`,
        `/assets/sprites/battle/shiny/${speciesId}.png`,
      ]);
    }
    return this.loadWithFallback([
      `${AssetLoader.CDN.SHOWDOWN_FRONT}${name}.gif`,
      `${AssetLoader.CDN.POKEAPI_GEN5_F}${speciesId}.gif`,
      `${AssetLoader.CDN.POKEAPI_STATIC_F}${speciesId}.png`,
      `/assets/sprites/battle/animated/${speciesId}.gif`,
    ]);
  }

  /**
   * Sprite TRASERO animado del Pokémon (para el Pokémon del jugador en batalla).
   * Fallback: Showdown Back → PokeAPI Gen5 Back → PokeAPI Back PNG → local
   */
  public getPokemonSpriteBack(speciesId: number, shiny = false): Promise<HTMLImageElement> {
    const name = this.idToName(speciesId);
    if (shiny) {
      return this.loadWithFallback([
        `${AssetLoader.CDN.SHOWDOWN_SHINY_B}${name}.gif`,
        `${AssetLoader.CDN.POKEAPI_SHINY_B}${speciesId}.png`,
        `/assets/sprites/battle/back/shiny/${speciesId}.png`,
      ]);
    }
    return this.loadWithFallback([
      `${AssetLoader.CDN.SHOWDOWN_BACK}${name}.gif`,
      `${AssetLoader.CDN.POKEAPI_GEN5_B}${speciesId}.gif`,
      `${AssetLoader.CDN.POKEAPI_STATIC_B}${speciesId}.png`,
      `/assets/sprites/battle/back/${speciesId}.gif`,
    ]);
  }

  /**
   * Ícono de caja/menú del Pokémon (PokéSprite → PokeAPI estático → local).
   * Ideal para Pokédex, pantalla de equipo y PC de almacenamiento.
   */
  public getPokemonIcon(speciesId: number, shiny = false): Promise<HTMLImageElement> {
    const name = this.idToName(speciesId);
    const base = shiny ? AssetLoader.CDN.POKESPRITE_SHINY : AssetLoader.CDN.POKESPRITE_ICON;
    return this.loadWithFallback([
      `${base}${name}.png`,
      `${AssetLoader.CDN.POKEAPI_STATIC_F}${speciesId}.png`,
      `/assets/sprites/icons/${speciesId}.png`,
    ]);
  }

  /**
   * Arte oficial HD del Pokémon (PokeAPI official-artwork → local).
   * Ideal para pantallas de selección de inicial, Pokédex detalle y evolución.
   */
  public getPokemonArtwork(speciesId: number): Promise<HTMLImageElement> {
    return this.loadWithFallback([
      `${AssetLoader.CDN.POKEAPI_ARTWORK}${speciesId}.png`,
      `${AssetLoader.CDN.POKEAPI_STATIC_F}${speciesId}.png`,
      `/assets/sprites/artwork/${speciesId}.png`,
    ]);
  }

  /**
   * Precarga en background los sprites de un lote de IDs (no bloquea el game loop).
   * Llámalo al cargar un mapa nuevo con los Pokémon que podrían aparecer en batalla.
   *
   * @example
   * // Al entrar al Pueblo Inicial, precargar iniciales y Pokémon de Ruta 1
   * loader.preloadPokemonSprites([1, 4, 7, 16, 19, 21]);
   */
  public preloadPokemonSprites(ids: number[], shiny = false): void {
    for (const id of ids) {
      this.getPokemonSpriteFront(id, shiny).catch(() => {});
      this.getPokemonSpriteBack(id, shiny).catch(() => {});
      this.getPokemonIcon(id, shiny).catch(() => {});
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MÉTODOS SÍNCRONOS LEGADOS (URL directa, sin fallback)
  // Mantienen compatibilidad con BattleRenderer y OverworldRenderer existentes.
  // Para nueva funcionalidad, usar los métodos async anteriores.
  // ─────────────────────────────────────────────────────────────────────────────

  /** URL directa del sprite frontal animado (Showdown) */
  public getPokemonGifUrl(speciesId: number): string {
    const name = this.idToName(speciesId);
    return `${AssetLoader.CDN.SHOWDOWN_FRONT}${name}.gif`;
  }

  /** URL directa del sprite trasero animado (Showdown) */
  public getPokemonBackGifUrl(speciesId: number): string {
    const name = this.idToName(speciesId);
    return `${AssetLoader.CDN.SHOWDOWN_BACK}${name}.gif`;
  }

  /** URL directa del artwork oficial HD (PokeAPI) */
  public getPokemonArtworkUrl(speciesId: number): string {
    return `${AssetLoader.CDN.POKEAPI_ARTWORK}${speciesId}.png`;
  }

  /** URL directa del ícono de caja/menú (PokéSprite) */
  public getPokemonIconUrl(speciesId: number): string {
    const name = this.idToName(speciesId);
    return `${AssetLoader.CDN.POKESPRITE_ICON}${name}.png`;
  }

  /**
   * Obtiene el avatar/retrato de un entrenador humano (Showdown CDN → local).
   * @param trainerKey Nombre o clase del entrenador (ej: "red", "cynthia", "hiker", "lass", "bugcatcher", "giovanni")
   */
  public getTrainerAvatar(trainerKey: string): Promise<HTMLImageElement> {
    const key = trainerKey.toLowerCase().replace(/\.png$/, '').replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
    return this.loadWithFallback([
      `${AssetLoader.CDN.SHOWDOWN_TRAINERS}${key}.png`,
      `/assets/sprites/gba/characters/${trainerKey}.png`,
      `/assets/sprites/trainers/${trainerKey}.png`,
      `/assets/sprites/gba/characters/${key}.png`,
    ]);
  }

  /** URL directa del avatar del entrenador (Showdown) */
  public getTrainerAvatarUrl(trainerKey: string): string {
    const key = trainerKey.toLowerCase().replace(/\.png$/, '').replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
    return `${AssetLoader.CDN.SHOWDOWN_TRAINERS}${key}.png`;
  }

  /** URL directa del retrato/mugshot de personaje (Showdown CDN con fallback local) */
  public getPortraitUrl(portraitKey: string): string {
    const key = portraitKey.toLowerCase().replace(/\.png$/, '').replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
    return `${AssetLoader.CDN.SHOWDOWN_TRAINERS}${key}.png`;
  }

  /** URL del grito sonoro del Pokémon (PokeAPI CDN → local) */
  public getCryUrl(speciesId: number): string {
    // Primero intenta local, si no, PokeAPI media (audio)
    return `/assets/audio/cries/${speciesId}.ogg`;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ACCESORES DE CACHÉ
  // ─────────────────────────────────────────────────────────────────────────────

  public getImage(src: string): HTMLImageElement | undefined {
    return this.imageCache.get(src);
  }

  public getJson<T = any>(filename: string): T {
    return this.dataCache.get(filename);
  }
}
