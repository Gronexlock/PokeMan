export class AssetLoader {
  private static instance: AssetLoader;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  public dataCache: Map<string, any> = new Map();
  public isLoaded: boolean = false;
  public loadProgress: number = 0;

  private constructor() {}

  public static getInstance(): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader();
    }
    return AssetLoader.instance;
  }

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
      'player.png',
      'professor.png',
      'blond.png',
      'hat_girl.png',
      'young_guy.png',
      'purple_girl.png',
      'straw.png',
      'young_girl.png',
      'rival.png',
      'gym_leader_rocio.png',
      'gym_leader_thiago.png',
      'champion_renata.png',
      'elite_inti.png',
      'elite_marina.png',
      'npc_bugcatcher.png',
      'npc_fisherman.png',
      'npc_hiker.png',
      'npc_lass.png',
      'npc_medium.png',
      'npc_swimmer.png'
    ];

    const objectSprites = [
      'house_large.png',
      'house_small.png',
      'house_small_alt.png',
      'hospital.png',
      'green_tree.png',
      'green_tree_bushy.png',
      'green_tree_small.png',
      'grass.png',
      'grassrock1.png',
      'grassrock2.png'
    ];

    const tilesetSprites = [
      'world.png',
      'coast.png',
      'water/0.png',
      'water/1.png',
      'water/2.png',
      'water/3.png'
    ];

    const totalAssets = jsonFiles.length + characterSprites.length + objectSprites.length + tilesetSprites.length;
    let completed = 0;

    const updateProgress = (name: string) => {
      completed++;
      this.loadProgress = Math.min(1.0, completed / totalAssets);
      if (onProgress) onProgress(this.loadProgress, name);
    };

    // 1. Cargar JSONs
    await Promise.all(
      jsonFiles.map(async file => {
        try {
          const res = await fetch(`/data/${file}`);
          if (res.ok) {
            const data = await res.json();
            this.dataCache.set(file, data);
          } else {
            console.warn(`No se pudo cargar /data/${file}`);
          }
        } catch (e) {
          console.warn(`Error al cargar /data/${file}:`, e);
        }
        updateProgress(file);
      })
    );

    // 2. Cargar Spritesheets de personajes
    await Promise.all(
      characterSprites.map(async file => {
        const path = `/assets/sprites/gba/characters/${file}`;
        await this.loadImage(path);
        updateProgress(file);
      })
    );

    // 3. Cargar Objetos
    await Promise.all(
      objectSprites.map(async file => {
        const path = `/assets/sprites/gba/objects/${file}`;
        await this.loadImage(path);
        updateProgress(file);
      })
    );

    // 4. Cargar Tilesets
    await Promise.all(
      tilesetSprites.map(async file => {
        const path = `/assets/sprites/gba/tilesets/${file}`;
        await this.loadImage(path);
        updateProgress(file);
      })
    );

    // 5. Cargar Fuente Oficial de Pokémon GBA
    try {
      const font = new FontFace('PokemonGBA', 'url(/assets/sprites/gba/fonts/pokemon_font.otf)');
      const loadedFont = await font.load();
      document.fonts.add(loadedFont);
    } catch (e) {
      console.warn("No se pudo cargar la fuente local PokemonGBA, se usará el fallback del sistema:", e);
    }

    this.isLoaded = true;
  }

  public loadImage(src: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(src)) {
      return Promise.resolve(this.imageCache.get(src)!);
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.imageCache.set(src, img);
        resolve(img);
      };
      img.onerror = () => {
        console.warn(`Error al cargar imagen: ${src}`);
        // Retornar imagen vacía o fallback para no romper la ejecución
        this.imageCache.set(src, img);
        resolve(img);
      };
      img.src = src;
    });
  }

  public getImage(src: string): HTMLImageElement | undefined {
    return this.imageCache.get(src);
  }

  public getJson<T = any>(filename: string): T {
    return this.dataCache.get(filename);
  }

  public getPokemonGifUrl(speciesId: number): string {
    return `/assets/sprites/battle/animated/${speciesId}.gif`;
  }

  public getPokemonBackGifUrl(speciesId: number): string {
    return `/assets/sprites/battle/back/${speciesId}.gif`;
  }

  public getPokemonArtworkUrl(speciesId: number): string {
    return `/assets/sprites/artwork/${speciesId}.png`;
  }

  public getPokemonIconUrl(speciesId: number): string {
    return `/assets/sprites/icons/${speciesId}.png`;
  }

  public getPortraitUrl(portraitKey: string): string {
    return `/assets/sprites/gba/characters/${portraitKey}.png`;
  }

  public getCryUrl(speciesId: number): string {
    return `/assets/audio/cries/${speciesId}.ogg`;
  }
}
