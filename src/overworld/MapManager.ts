import * as Phaser from 'phaser';

/**
 * Definición de un punto de teletransporte (Warp / Puerta) en el mapa.
 */
export interface MapWarp {
  id: string;
  x: number;          // Coordenada X en píxeles o casillas
  y: number;          // Coordenada Y en píxeles o casillas
  width?: number;
  height?: number;
  targetMapKey: string; // ID del mapa de destino
  targetX: number;     // Coordenada X de aparición en el nuevo mapa
  targetY: number;     // Coordenada Y de aparición en el nuevo mapa
  facingDirection?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  transitionType?: 'door_fade' | 'slide' | 'slide_up' | 'slide_down' | 'instant';
}

/**
 * Definición de un letrero o cartel interactivo en el mapa.
 */
export interface MapSignpost {
  id: string;
  x: number;
  y: number;
  title: string;
  text: string;
}

/**
 * Definición de un objeto en el suelo (Item Ball / Poké Ball con objeto).
 */
export interface MapItemBall {
  id: string;
  x: number;
  y: number;
  itemId: string;
  itemName: string;
  quantity: number;
  isCollected?: boolean;
}

/**
 * Definición de un desnivel de salto unidireccional (Ledge / Salto de bordillo).
 */
export interface MapLedge {
  tileX: number;
  tileY: number;
  jumpDirection: 'DOWN' | 'LEFT' | 'RIGHT' | 'UP';
}

/**
 * Configuración para instanciar un mapa en Phaser 3.
 */
export interface LoadMapOptions {
  mapKey: string;
  tilesetNameInTiled: string;
  tilesetTextureKey: string;
  playerSpawnName?: string;
}

/**
 * Gestor Modular de Mapas 2D para Phaser 3 con soporte completo de Tiled JSON.
 */
export class MapManager {
  private scene: Phaser.Scene;
  public currentMap!: Phaser.Tilemaps.Tilemap;
  public tileset!: Phaser.Tilemaps.Tileset;

  // Capas de renderizado
  public groundLayer!: Phaser.Tilemaps.TilemapLayer;
  public groundDecorLayer!: Phaser.Tilemaps.TilemapLayer | null;
  public grassLayer!: Phaser.Tilemaps.TilemapLayer | null;
  public obstaclesLayer!: Phaser.Tilemaps.TilemapLayer;
  public overheadLayer!: Phaser.Tilemaps.TilemapLayer | null;

  // Metadatos extraídos de las capas de objetos de Tiled
  public warps: MapWarp[] = [];
  public signposts: MapSignpost[] = [];
  public itemBalls: MapItemBall[] = [];
  public ledges: Map<string, MapLedge> = new Map(); // Key: 'x,y'

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Carga y construye todas las capas y objetos de un mapa exportado desde Tiled.
   */
  public buildMap(options: LoadMapOptions): {
    map: Phaser.Tilemaps.Tilemap;
    spawnPoint: { x: number; y: number; facing: string };
  } {
    // 1. Instanciar el Tilemap
    this.currentMap = this.scene.make.tilemap({ key: options.mapKey });
    this.tileset = this.currentMap.addTilesetImage(
      options.tilesetNameInTiled,
      options.tilesetTextureKey
    )!;

    if (!this.tileset) {
      throw new Error(`[MapManager] No se pudo vincular el tileset '${options.tilesetNameInTiled}' con la textura '${options.tilesetTextureKey}'`);
    }

    // 2. Construcción de Capas de Tiles
    // Capa 1: Terreno Base (Suelo, agua de fondo, arena)
    this.groundLayer = this.currentMap.createLayer('Ground', this.tileset, 0, 0)!;

    // Capa 2: Decoración sobre el suelo (Caminos, flores, sombras)
    this.groundDecorLayer = this.currentMap.createLayer('Ground_Decor', this.tileset, 0, 0);

    // Capa 3: Césped Alto (Hierba donde ocurren encuentros salvajes)
    this.grassLayer = this.currentMap.createLayer('TallGrass', this.tileset, 0, 0);

    // Capa 4: Obstáculos (Paredes, árboles, edificios, vallas)
    this.obstaclesLayer = this.currentMap.createLayer('Obstacles', this.tileset, 0, 0)!;

    // Capa 5: Techos y copas de árboles (Renderizado por encima del jugador: Z-Depth superior)
    this.overheadLayer = this.currentMap.createLayer('Overhead', this.tileset, 0, 0);
    if (this.overheadLayer) {
      this.overheadLayer.setDepth(15);
    }

    // 3. Configuración de Colisiones con Obstáculos
    if (this.obstaclesLayer) {
      // Activa colisión en cualquier tile con la propiedad 'collides: true' en Tiled
      this.obstaclesLayer.setCollisionByProperty({ collides: true });
    }

    // 4. Parseo de Capas de Objetos (Spawns, Warps, Letreros, ItemBalls, Ledges)
    const spawnPoint = this.parseObjectLayers(options.playerSpawnName || 'PlayerSpawn');

    return {
      map: this.currentMap,
      spawnPoint
    };
  }

  /**
   * Extrae y procesa los objetos interactivos definidos en Tiled.
   */
  private parseObjectLayers(defaultSpawnName: string): { x: number; y: number; facing: string } {
    this.warps = [];
    this.signposts = [];
    this.itemBalls = [];
    this.ledges.clear();

    let spawn = { x: 160, y: 160, facing: 'DOWN' };

    // Buscar capa de objetos 'Objects' o 'Entities'
    const objectLayer = this.currentMap.getObjectLayer('Objects') || this.currentMap.getObjectLayer('Entities');
    if (!objectLayer) {
      return spawn;
    }

    objectLayer.objects.forEach(obj => {
      const objX = obj.x ?? 0;
      const objY = obj.y ?? 0;
      const properties: Record<string, any> = {};

      // Parsear propiedades personalizadas de Tiled
      if (obj.properties && Array.isArray(obj.properties)) {
        obj.properties.forEach((p: { name: string; value: any }) => {
          properties[p.name] = p.value;
        });
      }

      // 1. Punto de Aparición (Spawn Point)
      if (obj.name === defaultSpawnName || obj.type === 'spawn') {
        spawn = {
          x: objX,
          y: objY,
          facing: properties.facing || 'DOWN'
        };
      }

      // 2. Puertas y Teletransportes (Warps)
      else if (obj.type === 'warp' || obj.name.startsWith('Warp_')) {
        this.warps.push({
          id: obj.name,
          x: objX,
          y: objY,
          width: obj.width || 32,
          height: obj.height || 32,
          targetMapKey: properties.target_map || 'villa_tranquimar',
          targetX: properties.target_x || 160,
          targetY: properties.target_y || 160,
          facingDirection: properties.target_facing || 'DOWN',
          transitionType: properties.transition_type || 'door_fade'
        });
      }

      // 3. Letreros Informativos (Signposts)
      else if (obj.type === 'signpost' || obj.name.startsWith('Sign_')) {
        this.signposts.push({
          id: obj.name,
          x: objX,
          y: objY,
          title: properties.title || 'Letrero',
          text: properties.text || '...'
        });
      }

      // 4. Objetos en el Suelo (Item Balls)
      else if (obj.type === 'item_ball' || obj.name.startsWith('Item_')) {
        this.itemBalls.push({
          id: obj.name,
          x: objX,
          y: objY,
          itemId: properties.item_id || 'potion',
          itemName: properties.item_name || 'Poción',
          quantity: properties.quantity || 1
        });
      }

      // 5. Desniveles de Salto (Ledges)
      else if (obj.type === 'ledge' || obj.name.startsWith('Ledge_')) {
        const tileX = Math.floor(objX / this.currentMap.tileWidth);
        const tileY = Math.floor(objY / this.currentMap.tileHeight);
        this.ledges.set(`${tileX},${tileY}`, {
          tileX,
          tileY,
          jumpDirection: properties.jump_dir || 'DOWN'
        });
      }
    });

    return spawn;
  }

  /**
   * Comprueba si una coordenada específica del mapa tiene hierba alta.
   */
  public isTallGrassAt(tileX: number, tileY: number): boolean {
    if (this.grassLayer) {
      const tile = this.grassLayer.getTileAt(tileX, tileY);
      if (tile && tile.index !== -1) return true;
    }

    if (this.groundLayer) {
      const tile = this.groundLayer.getTileAt(tileX, tileY);
      if (tile && tile.properties && tile.properties.isTallGrass === true) return true;
    }

    return false;
  }

  /**
   * Comprueba si el jugador está sobre un punto de teletransporte (Warp).
   */
  public checkWarpAt(worldX: number, worldY: number): MapWarp | null {
    for (const warp of this.warps) {
      const withinX = worldX >= warp.x && worldX <= warp.x + (warp.width || 32);
      const withinY = worldY >= warp.y && worldY <= warp.y + (warp.height || 32);
      if (withinX && withinY) {
        return warp;
      }
    }
    return null;
  }

  /**
   * Comprueba si la casilla objetivo es un desnivel de salto (Ledge).
   */
  public getLedgeAt(tileX: number, tileY: number): MapLedge | undefined {
    return this.ledges.get(`${tileX},${tileY}`);
  }

  /**
   * Comprueba si hay un letrero frente al jugador.
   */
  public getSignpostNear(worldX: number, worldY: number, maxDistance: number = 36): MapSignpost | null {
    for (const sign of this.signposts) {
      const dist = Phaser.Math.Distance.Between(worldX, worldY, sign.x, sign.y);
      if (dist <= maxDistance) {
        return sign;
      }
    }
    return null;
  }
}
