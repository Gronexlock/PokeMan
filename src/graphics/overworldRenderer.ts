import { MapDefinition, TimePeriod, NPCDefinition } from '../core/types';
import { PlayerController } from '../overworld/playerController';
import { Camera } from './camera';
import { AssetLoader } from './assetLoader';
import { LightingShader, LightSource } from './lightingShader';
import { DialogueManager } from '../core/dialogueManager';

export interface RenderableEntity {
  y: number;
  draw: (ctx: CanvasRenderingContext2D, camera: Camera) => void;
}

export interface OverheadStructure {
  xPx: number;
  yPx: number;
  width: number;
  height: number;
  imageKey?: string;
  customDraw?: (ctx: CanvasRenderingContext2D, camera: Camera) => void;
}

export interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  rotation: number;
  vRot: number;
}

export class OverworldRenderer {
  private loader: AssetLoader;
  private shader: LightingShader;
  public tileSize: number = 48;

  // Animaciones de tileset
  private waterFrame: number = 0;
  private animTimer: number = 0;

  // Partículas ambientales de bioma
  private weatherParticles: AmbientParticle[] = [];

  constructor() {
    this.loader = AssetLoader.getInstance();
    this.shader = new LightingShader();
    this.initWeatherParticles();
  }

  private initWeatherParticles(): void {
    this.weatherParticles = [];
    for (let i = 0; i < 35; i++) {
      this.weatherParticles.push({
        x: Math.random() * 960,
        y: Math.random() * 540,
        vx: -30 - Math.random() * 40,
        vy: 20 + Math.random() * 30,
        size: 3 + Math.random() * 4,
        alpha: 0.3 + Math.random() * 0.5,
        color: '#86efac',
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 4
      });
    }
  }

  public update(dt: number): void {
    this.animTimer += dt;
    // Ciclar frames de agua cada 0.25 segundos
    this.waterFrame = Math.floor((this.animTimer / 0.25) % 4);

    // Actualizar partículas ambientales
    for (const p of this.weatherParticles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.vRot * dt;

      if (p.x < -20) p.x = 980;
      if (p.y > 560) p.y = -20;
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    map: MapDefinition,
    player: PlayerController,
    npcs: NPCDefinition[],
    camera: Camera,
    timePeriod: TimePeriod,
    dialogueMgr: DialogueManager
  ): void {
    ctx.save();
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // ==========================================
    // CAPA 1: Terreno Base (Suelo, Senderos, Agua)
    // ==========================================
    this.renderBaseTerrain(ctx, map, camera);

    // ==========================================
    // CAPA 2: Volumen y Elevación (Acantilados 3D, Desniveles)
    // ==========================================
    this.renderVolumetricElevation(ctx, map, camera);

    // ==========================================
    // CAPA 3 & Z-SORT: Estructuras Bajas y Entidades
    // ==========================================
    const entities: RenderableEntity[] = [];
    const overheads: OverheadStructure[] = [];

    // Añadir estructuras divididas en base y copa superior (Overhead)
    this.populateStructuresAndOverheads(entities, overheads, map);

    // Añadir NPCs
    for (const npc of npcs) {
      entities.push({
        y: npc.y * this.tileSize + 40,
        draw: (c, cam) => this.renderNpc(c, npc, cam)
      });
    }

    // Añadir Jugador
    entities.push({
      y: player.tileY * this.tileSize + 40,
      draw: (c, cam) => this.renderPlayer(c, player, cam)
    });

    // Ordenar de menor a mayor Y para profundidad visual realista
    entities.sort((a, b) => a.y - b.y);

    for (const entity of entities) {
      entity.draw(ctx, camera);
    }

    // Superposición de hierba sobre los pies del jugador
    this.renderGrassOverlays(ctx, map, player, camera);

    // ==========================================
    // CAPA 4: Oclusión Aérea / Overhead (Copas de árboles y Tejados)
    // ==========================================
    this.renderCanopyAndOverhangs(ctx, overheads, camera);

    // ==========================================
    // CAPA 5: Iluminación Dinámica y Clima
    // ==========================================
    const lights = this.getMapLights(map, player, camera);
    this.shader.renderLighting(ctx, timePeriod, width, height, lights);
    this.renderWeatherParticles(ctx, map);

    // ==========================================
    // CAPA 6: HUD Superior y Cuadros de Diálogo
    // ==========================================
    this.renderOverworldHud(ctx, map, timePeriod);

    if (dialogueMgr.state.isActive && dialogueMgr.state.currentNode) {
      this.renderDialogueBox(ctx, dialogueMgr, width, height);
    }

    ctx.restore();
  }

  // -------------------------------------------------------------
  // CAPA 1: Terreno Base
  // -------------------------------------------------------------
  private renderBaseTerrain(ctx: CanvasRenderingContext2D, map: MapDefinition, camera: Camera): void {
    const matrix = map.collision_matrix;
    const mapH = matrix.length;
    const mapW = mapH > 0 ? matrix[0].length : 0;
    const ts = this.tileSize;

    const startCol = Math.max(0, Math.floor(camera.x / ts));
    const endCol = Math.min(mapW, Math.ceil((camera.x + camera.viewportWidth) / ts) + 1);
    const startRow = Math.max(0, Math.floor(camera.y / ts));
    const endRow = Math.min(mapH, Math.ceil((camera.y + camera.viewportHeight) / ts) + 1);

    const waterImg = this.loader.getImage(`/assets/sprites/gba/tilesets/water/${this.waterFrame}.png`);
    const grassTile = this.loader.getImage(`/assets/sprites/gba/objects/grass.png`);

    for (let r = startRow; r < endRow; r++) {
      for (let c = startCol; c < endCol; c++) {
        const tileType = matrix[r][c];
        const screenX = camera.getScreenX(c * ts);
        const screenY = camera.getScreenY(r * ts);

        // Suelo base verde según bioma
        const baseColor = map.biome === 'indoor' ? '#dfd2ba' :
                          map.biome === 'cloud_forest' ? '#2e7d32' :
                          map.biome === 'high_tech_city' ? '#334155' : '#4fa43e';
        ctx.fillStyle = baseColor;
        ctx.fillRect(screenX, screenY, ts, ts);

        if (map.biome === 'indoor') {
          // Tablones de madera pulida
          ctx.strokeStyle = '#c6b69b';
          ctx.lineWidth = 1;
          ctx.strokeRect(screenX, screenY, ts, ts);
          continue;
        }

        if (map.biome === 'high_tech_city') {
          // Asfalto y baldosas urbanas
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.lineWidth = 1;
          ctx.strokeRect(screenX, screenY, ts, ts);
          if ((c + r) % 2 === 0) {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(screenX + 2, screenY + 2, ts - 4, ts - 4);
          }
          continue;
        }

        // Agua profunda animada
        if (tileType === 3) {
          if (waterImg && waterImg.complete) {
            ctx.drawImage(waterImg, screenX, screenY, ts, ts);
          } else {
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(screenX, screenY, ts, ts);
          }

          // Reflejos y ondas marinas
          const waveShift = Math.sin(this.animTimer * 2 + c + r) * 4;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
          ctx.fillRect(screenX + 8 + waveShift, screenY + 12, 16, 2);
          ctx.fillRect(screenX + 22 - waveShift, screenY + 28, 14, 2);
        } else if (tileType === 2) {
          // Hierba Alta
          ctx.fillStyle = map.biome === 'cloud_forest' ? '#1b5e20' : '#3f8c32';
          ctx.fillRect(screenX, screenY, ts, ts);
          if (grassTile && grassTile.complete) {
            ctx.drawImage(grassTile, screenX, screenY, ts, ts);
          }
        } else if (tileType === 0) {
          // Sendero de tierra continuo
          const pathColor = map.biome === 'coastal_town' ? '#e5d3a5' :
                            map.biome === 'cloud_forest' ? '#8d6e63' : '#7cb342';
          ctx.fillStyle = pathColor;
          ctx.fillRect(screenX, screenY, ts, ts);

          // Detalles de piedritas y textura natural
          if ((c * 7 + r * 13) % 5 === 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
            ctx.fillRect(screenX + 10, screenY + 12, 4, 3);
            ctx.fillRect(screenX + 26, screenY + 28, 3, 2);
          }
        }

        // Orilla y espuma de mar en la costa
        if (map.id === 'villa_tranquimar' && r === 11 && tileType !== 3) {
          ctx.fillStyle = '#f0dfb6';
          ctx.fillRect(screenX, screenY + ts - 10, ts, 10);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fillRect(screenX, screenY + ts - 4, ts, 4);
        }
      }
    }

    // Muelle de madera en Villa Tranquimar
    if (map.id === 'villa_tranquimar') {
      this.renderDock(ctx, camera);
    }
  }

  private renderDock(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const ts = this.tileSize;
    const dockCols = [9, 10];
    const dockRows = [12, 13, 14];

    for (const r of dockRows) {
      for (const c of dockCols) {
        const sx = camera.getScreenX(c * ts);
        const sy = camera.getScreenY(r * ts);

        // Tablones de madera con sombra bajo el agua
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(sx + 4, sy + 6, ts - 4, ts - 4);

        ctx.fillStyle = '#8d5b32';
        ctx.fillRect(sx, sy, ts, ts);

        ctx.strokeStyle = '#5c3a1e';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < ts; i += 12) {
          ctx.beginPath();
          ctx.moveTo(sx, sy + i);
          ctx.lineTo(sx + ts, sy + i);
          ctx.stroke();
        }

        if (r === 14) {
          ctx.fillStyle = '#4a2c14';
          ctx.fillRect(sx + 4, sy + ts - 12, 8, 12);
          ctx.fillRect(sx + ts - 12, sy + ts - 12, 8, 12);
        }
      }
    }

    // Barco amarrado
    const boatX = camera.getScreenX(11 * ts + 4);
    const boatY = camera.getScreenY(13 * ts);
    ctx.fillStyle = '#a0683c';
    ctx.beginPath();
    ctx.ellipse(boatX + 24, boatY + 20, 28, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dfc39e';
    ctx.fillRect(boatX + 10, boatY + 12, 28, 16);
  }

  // -------------------------------------------------------------
  // CAPA 2: Volumen y Acantilados 3D
  // -------------------------------------------------------------
  private renderVolumetricElevation(ctx: CanvasRenderingContext2D, map: MapDefinition, camera: Camera): void {
    const matrix = map.collision_matrix;
    const mapH = matrix.length;
    const mapW = mapH > 0 ? matrix[0].length : 0;
    const ts = this.tileSize;

    for (let r = 0; r < mapH; r++) {
      for (let c = 0; c < mapW; c++) {
        const code = matrix[r][c];
        const screenX = camera.getScreenX(c * ts);
        const screenY = camera.getScreenY(r * ts);

        // Desnivel / Salto de Ledge (Código 4)
        if (code === 4) {
          // Borde superior de césped
          ctx.fillStyle = '#2e6b22';
          ctx.fillRect(screenX, screenY + ts - 16, ts, 4);

          // Cara vertical del acantilado de tierra
          const cliffGrad = ctx.createLinearGradient(screenX, screenY + ts - 12, screenX, screenY + ts);
          cliffGrad.addColorStop(0, '#c5a059');
          cliffGrad.addColorStop(1, '#8b6932');
          ctx.fillStyle = cliffGrad;
          ctx.fillRect(screenX, screenY + ts - 12, ts, 12);

          // Sombra inferior en el suelo
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.fillRect(screenX, screenY + ts, ts, 5);
        }

        // Acantilados rocosos perimetrales (Ruta 1, Ruta 2, Altiplano)
        if (code === 1 && r < mapH - 1 && matrix[r + 1]?.[c] === 0 && (map.id.includes('route') || map.id.includes('altiplano'))) {
          // Cara frontal de roca vertical con relieve
          ctx.fillStyle = '#78716c';
          ctx.fillRect(screenX, screenY + ts - 14, ts, 14);

          ctx.fillStyle = '#57534e';
          ctx.fillRect(screenX + 4, screenY + ts - 10, ts - 8, 10);

          // Sombras de relieve
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.fillRect(screenX, screenY + ts, ts, 6);
        }
      }
    }
  }

  // -------------------------------------------------------------
  // CAPA 3 & 4: Población de Estructuras (Base + Canopy Overhead)
  // -------------------------------------------------------------
  private populateStructuresAndOverheads(
    entities: RenderableEntity[],
    overheads: OverheadStructure[],
    map: MapDefinition
  ): void {
    const ts = this.tileSize;

    // Árbol Frondoso Estándar (Separado en Base y Copa Aérea)
    const addLayeredTree = (tx: number, ty: number) => {
      const treeImg = this.loader.getImage('/assets/sprites/gba/objects/green_tree.png');
      const treeX = tx * ts - 12;
      const treeY = (ty - 1.2) * ts;
      const treeW = ts * 1.5;
      const treeH = ts * 2.2;

      // 1. Sombra y Tronco (Capa 3 - Entidad Y-Sorted)
      entities.push({
        y: (ty + 0.9) * ts,
        draw: (ctx, cam) => {
          const sx = cam.getScreenX(treeX);
          const sy = cam.getScreenY(treeY);

          // Sombra circular proyectada
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.beginPath();
          ctx.ellipse(sx + treeW / 2, sy + treeH - 8, 22, 10, 0, 0, Math.PI * 2);
          ctx.fill();

          if (treeImg && treeImg.complete) {
            // Dibujar mitad inferior (tronco)
            ctx.drawImage(treeImg, 0, treeImg.height * 0.45, treeImg.width, treeImg.height * 0.55,
                          sx, sy + treeH * 0.45, treeW, treeH * 0.55);
          }
        }
      });

      // 2. Copa Frondosa (Capa 4 - Overhead por encima del jugador)
      overheads.push({
        xPx: treeX,
        yPx: treeY,
        width: treeW,
        height: treeH,
        customDraw: (ctx, cam) => {
          if (treeImg && treeImg.complete) {
            const sx = cam.getScreenX(treeX);
            const sy = cam.getScreenY(treeY);
            // Dibujar mitad superior (copa)
            ctx.drawImage(treeImg, 0, 0, treeImg.width, treeImg.height * 0.50,
                          sx, sy, treeW, treeH * 0.50);
          }
        }
      });
    };

    // Edificio / Casa (Separada en Fachada y Tejado Aéreo)
    const addLayeredHouse = (tx: number, ty: number, wTiles: number, hTiles: number, imgKey: string, doorOffset: number) => {
      const houseImg = this.loader.getImage(imgKey);
      const houseX = tx * ts;
      const houseY = ty * ts;
      const houseW = wTiles * ts;
      const houseH = hTiles * ts;

      // 1. Fachada inferior y puerta (Capa 3)
      entities.push({
        y: (ty + hTiles - 0.1) * ts,
        draw: (ctx, cam) => {
          const sx = cam.getScreenX(houseX);
          const sy = cam.getScreenY(houseY);

          // Sombra de la casa
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.fillRect(sx + 10, sy + houseH - 8, houseW - 20, 16);

          if (houseImg && houseImg.complete) {
            // Mitad inferior (muros y puertas)
            ctx.drawImage(houseImg, 0, houseImg.height * 0.45, houseImg.width, houseImg.height * 0.55,
                          sx, sy + houseH * 0.45, houseW, houseH * 0.55);
          }

          // Felpudo iluminado
          ctx.fillStyle = '#b45309';
          ctx.fillRect(cam.getScreenX((tx + doorOffset) * ts), cam.getScreenY((ty + hTiles) * ts - 4), 36, 6);
        }
      });

      // 2. Tejado y Aleros (Capa 4 - Overhead)
      overheads.push({
        xPx: houseX,
        yPx: houseY,
        width: houseW,
        height: houseH,
        customDraw: (ctx, cam) => {
          if (houseImg && houseImg.complete) {
            const sx = cam.getScreenX(houseX);
            const sy = cam.getScreenY(houseY);
            // Mitad superior (tejado)
            ctx.drawImage(houseImg, 0, 0, houseImg.width, houseImg.height * 0.50,
                          sx, sy, houseW, houseH * 0.50);
          }
        }
      });
    };

    // Estructuras por mapa
    if (map.id === 'villa_tranquimar') {
      addLayeredHouse(2, 1.3, 3, 3, '/assets/sprites/gba/objects/house_small.png', 1.0);
      addLayeredHouse(15, 1.3, 3, 3, '/assets/sprites/gba/objects/house_small_alt.png', 1.0);
      addLayeredHouse(4, 5.0, 4.5, 3.4, '/assets/sprites/gba/objects/hospital.png', 1.8);

      const trees = [
        { x: 0, y: 1 }, { x: 0, y: 3 }, { x: 0, y: 5 }, { x: 0, y: 7 }, { x: 0, y: 9 },
        { x: 19, y: 1 }, { x: 19, y: 3 }, { x: 19, y: 5 }, { x: 19, y: 7 }, { x: 19, y: 9 },
        { x: 7, y: 2 }, { x: 12, y: 2 }
      ];
      trees.forEach(t => addLayeredTree(t.x, t.y));
    } else if (map.id === 'route_1' || map.id === 'route_2') {
      for (let y = 1; y < 18; y += 3) {
        addLayeredTree(0, y);
        addLayeredTree(map.width - 2, y);
      }
    } else if (map.id === 'pueblo_altiplano') {
      addLayeredHouse(2, 2.0, 4, 3.5, '/assets/sprites/gba/objects/pokemon_center_red_roof.png', 1.5);
      addLayeredHouse(14, 2.0, 4, 3.5, '/assets/sprites/gba/objects/hospital.png', 1.5);
      addLayeredHouse(15, 7.0, 4, 3.0, '/assets/sprites/gba/objects/house_wood_blue_roof.png', 1.5);
      for (let y = 1; y < 14; y += 4) {
        addLayeredTree(0, y);
        addLayeredTree(map.width - 2, y);
      }
    } else if (map.id === 'villa_yungas') {
      addLayeredHouse(2, 1.5, 3.5, 3, '/assets/sprites/gba/objects/house_wood_blue_roof.png', 1.0);
      addLayeredHouse(12, 1.5, 3.5, 3, '/assets/sprites/gba/objects/house_wood_blue_roof.png', 1.0);
      for (let y = 1; y < 14; y += 3) {
        addLayeredTree(0, y);
        addLayeredTree(map.width - 2, y);
        addLayeredTree(7, y);
      }
    } else if (map.id === 'solsticio_metropolis') {
      addLayeredHouse(2, 2.0, 4, 3.5, '/assets/sprites/gba/objects/pokemon_center_red_roof.png', 1.5);
      addLayeredHouse(10, 2.0, 4, 3.5, '/assets/sprites/gba/objects/hospital.png', 1.5);
    }

    // 5. Item Balls (Poké Balls en el suelo estilo GBA)
    if (map.item_balls) {
      for (const ib of map.item_balls) {
        entities.push({
          y: (ib.y + 0.8) * ts,
          draw: (ctx, cam) => {
            const sx = cam.getScreenX(ib.x * ts);
            const sy = cam.getScreenY(ib.y * ts);

            // Sombra
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(sx + ts / 2, sy + ts - 6, 9, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Esfera de Poké Ball
            const bx = sx + ts / 2;
            const by = sy + ts - 14;
            const br = 8;

            // Mitad roja
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(bx, by, br, Math.PI, 0, false);
            ctx.fill();

            // Mitad blanca
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.arc(bx, by, br, 0, Math.PI, false);
            ctx.fill();

            // Banda central
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(bx - br, by - 1, br * 2, 2);

            // Botón central
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }
    }

    // 6. Carteles Informativos (Signposts de madera)
    if (map.signposts) {
      for (const sp of map.signposts) {
        entities.push({
          y: (sp.y + 0.9) * ts,
          draw: (ctx, cam) => {
            const sx = cam.getScreenX(sp.x * ts);
            const sy = cam.getScreenY(sp.y * ts);

            // Sombra
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.fillRect(sx + 10, sy + ts - 6, ts - 20, 6);

            // Poste
            ctx.fillStyle = '#78350f';
            ctx.fillRect(sx + ts / 2 - 3, sy + 18, 6, ts - 18);

            // Tablón
            ctx.fillStyle = '#b45309';
            ctx.fillRect(sx + 8, sy + 12, ts - 16, 18);
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(sx + 8, sy + 12, ts - 16, 18);

            // Letras talladas
            ctx.fillStyle = '#fef3c7';
            ctx.fillRect(sx + 12, sy + 17, ts - 24, 2);
            ctx.fillRect(sx + 15, sy + 23, ts - 30, 2);
          }
        });
      }
    }
  }

  // -------------------------------------------------------------
  // CAPA 4: Oclusión Aérea (Canopy & Roofs)
  // -------------------------------------------------------------
  private renderCanopyAndOverhangs(
    ctx: CanvasRenderingContext2D,
    overheads: OverheadStructure[],
    camera: Camera
  ): void {
    for (const ov of overheads) {
      if (ov.customDraw) {
        ov.customDraw(ctx, camera);
      }
    }
  }

  // -------------------------------------------------------------
  // CAPA 5: Partículas Ambientales de Clima
  // -------------------------------------------------------------
  private renderWeatherParticles(ctx: CanvasRenderingContext2D, map: MapDefinition): void {
    ctx.save();
    const isForest = map.biome === 'cloud_forest';
    const isCoast = map.biome === 'coastal_town';

    for (const p of this.weatherParticles) {
      ctx.globalAlpha = p.alpha;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (isForest) {
        // Hojas flotantes verdes
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.6, p.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (isCoast) {
        // Destellos de brisa marina blanca
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
    ctx.restore();
  }

  // -------------------------------------------------------------
  // Jugador y NPCs
  // -------------------------------------------------------------
  private renderPlayer(ctx: CanvasRenderingContext2D, player: PlayerController, camera: Camera): void {
    const sKey = player.spriteKey || 'player.png';
    const playerImg = this.loader.getImage(`/assets/sprites/gba/characters/${sKey}`);
    const screenX = camera.getScreenX(player.xPx);
    const screenY = camera.getScreenY(player.getVisualY());
    const ts = this.tileSize;

    // Sombra del jugador
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(screenX + ts / 2, screenY + ts - 4, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Montura de Surf si navega sobre el agua
    if (player.isSurfing) {
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.ellipse(screenX + ts / 2, screenY + ts - 2, 22, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(screenX + ts / 2, screenY + ts - 2, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (playerImg && playerImg.complete && playerImg.naturalWidth > 0) {
      let row = 0;
      if (player.facing === 'DOWN') row = 0;
      else if (player.facing === 'LEFT') row = 1;
      else if (player.facing === 'RIGHT') row = 2;
      else if (player.facing === 'UP') row = 3;

      const frameWidth = playerImg.width / 4;
      const frameHeight = playerImg.height / 4;
      const frameCol = player.animFrame;

      ctx.drawImage(
        playerImg,
        frameCol * frameWidth, row * frameHeight, frameWidth, frameHeight,
        screenX, screenY - 14, ts, ts * 1.25
      );
    } else {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(screenX + 8, screenY + 6, ts - 16, ts - 10);
    }
  }

  private renderNpc(ctx: CanvasRenderingContext2D, npc: NPCDefinition, camera: Camera): void {
    const npcImg = this.loader.getImage(`/assets/sprites/gba/characters/${npc.sprite}`);
    const screenX = camera.getScreenX(npc.x * this.tileSize);
    const screenY = camera.getScreenY(npc.y * this.tileSize);
    const ts = this.tileSize;

    // Sombra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(screenX + ts / 2, screenY + ts - 4, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (npcImg && npcImg.complete && npcImg.naturalWidth > 0) {
      let row = 0;
      if (npc.facing === 'DOWN') row = 0;
      else if (npc.facing === 'LEFT') row = 1;
      else if (npc.facing === 'RIGHT') row = 2;
      else if (npc.facing === 'UP') row = 3;

      const frameWidth = npcImg.width / 4;
      const frameHeight = npcImg.height / 4;

      ctx.drawImage(
        npcImg,
        0, row * frameHeight, frameWidth, frameHeight,
        screenX, screenY - 14, ts, ts * 1.25
      );
    }
  }

  private renderGrassOverlays(
    ctx: CanvasRenderingContext2D,
    map: MapDefinition,
    player: PlayerController,
    camera: Camera
  ): void {
    const matrix = map.collision_matrix;
    const ts = this.tileSize;
    const tileX = player.tileX;
    const tileY = player.tileY;

    if (matrix[tileY]?.[tileX] === 2) {
      const sx = camera.getScreenX(tileX * ts);
      const sy = camera.getScreenY(tileY * ts);

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(sx + 4, sy + ts);
      ctx.lineTo(sx + 10, sy + ts - 16);
      ctx.lineTo(sx + 16, sy + ts);
      ctx.lineTo(sx + 24, sy + ts - 18);
      ctx.lineTo(sx + 32, sy + ts);
      ctx.lineTo(sx + 40, sy + ts - 14);
      ctx.lineTo(sx + 46, sy + ts);
      ctx.closePath();
      ctx.fill();
    }
  }

  private getMapLights(map: MapDefinition, player: PlayerController, camera: Camera): LightSource[] {
    const ts = this.tileSize;
    const lights: LightSource[] = [];

    // Luz alrededor del jugador
    lights.push({
      x: camera.getScreenX(player.xPx + ts / 2),
      y: camera.getScreenY(player.yPx + ts / 2),
      radius: 95,
      color: 'rgba(255, 240, 180, 0.45)',
      intensity: 0.6
    });

    if (map.id === 'villa_tranquimar') {
      // Farola del muelle
      lights.push({
        x: camera.getScreenX(9.5 * ts),
        y: camera.getScreenY(12 * ts),
        radius: 120,
        color: 'rgba(251, 191, 36, 0.65)',
        intensity: 0.85
      });
    }

    return lights;
  }

  private renderOverworldHud(ctx: CanvasRenderingContext2D, map: MapDefinition, timePeriod: TimePeriod): void {
    ctx.save();
    const hudW = 340;
    const hudH = 38;
    const hudX = 24;
    const hudY = 16;

    // Fondo del badge con glassmorphism
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.fillRect(hudX, hudY, hudW, hudH);
    ctx.strokeRect(hudX, hudY, hudW, hudH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px "PokemonGBA", "Outfit", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`📍 ${map.display_name}`, hudX + 16, hudY + hudH / 2);

    const timeIcons = { morning: '🌅', day: '☀️', sunset: '🌆', night: '🌙' };
    const timeLabels = { morning: 'Amanecer', day: 'Día', sunset: 'Atardecer', night: 'Noche' };
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "PokemonGBA", "Outfit", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${timeIcons[timePeriod]} ${timeLabels[timePeriod]}`, hudX + hudW - 16, hudY + hudH / 2);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';

    ctx.restore();
  }

  private renderDialogueBox(
    ctx: CanvasRenderingContext2D,
    dialogueMgr: DialogueManager,
    width: number,
    height: number
  ): void {
    const node = dialogueMgr.state.currentNode;
    if (!node) return;

    ctx.save();
    const boxX = 36;
    const boxY = height - 145;
    const boxW = width - 72;
    const boxH = 125;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX + 4, boxY + 4, boxW - 8, boxH - 8);

    if (node.speaker) {
      ctx.font = 'bold 14px "PokemonGBA", "Outfit", sans-serif';
      const spkW = Math.max(160, ctx.measureText(node.speaker).width + 36);
      const spkH = 26;
      const spkX = boxX + 16;
      const spkY = boxY - 14;

      ctx.fillStyle = '#0284c7';
      ctx.fillRect(spkX, spkY, spkW, spkH);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(spkX, spkY, spkW, spkH);

      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(node.speaker, spkX + spkW / 2, spkY + spkH / 2 - 1);
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
    }

    let textOffsetX = 24;
    let portraitImgKey = node.portrait;
    if (!portraitImgKey) {
      if (node.speaker.includes("Ceibo") || node.speaker.includes("Profesor")) portraitImgKey = "professor.png";
      else if (node.speaker.includes("Nahuel")) portraitImgKey = "blond.png";
      else if (node.speaker.includes("Mamá")) portraitImgKey = "purple_girl.png";
      else if (node.speaker.includes("Luz") || node.speaker.includes("Pescadora")) portraitImgKey = "young_girl.png";
      else if (node.speaker.includes("Camila") || node.speaker.includes("Cazabichos")) portraitImgKey = "hat_girl.png";
      else if (node.speaker.includes("Lucas") || node.speaker.includes("Asistente")) portraitImgKey = "young_guy.png";
    }

    if (portraitImgKey) {
      const pImg = this.loader.getImage(`/assets/sprites/gba/characters/${portraitImgKey}`);
      if (pImg && pImg.complete) {
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.fillRect(boxX + 16, boxY + 20, 68, 76);
        ctx.strokeRect(boxX + 16, boxY + 20, 68, 76);

        const fW = pImg.width / 4;
        const fH = pImg.height / 4;
        ctx.drawImage(pImg, 0, 0, fW, fH, boxX + 20, boxY + 24, 60, 68);
        textOffsetX = 100;
      }
    }

    ctx.fillStyle = '#f8fafc';
    ctx.font = '15px "PokemonGBA", "Outfit", sans-serif';
    ctx.textAlign = 'left';

    const words = dialogueMgr.state.displayedText.split(' ');
    let line = '';
    let lineY = boxY + 40;
    const maxLineW = boxW - textOffsetX - 40;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxLineW && n > 0) {
        ctx.fillText(line, boxX + textOffsetX, lineY);
        line = words[n] + ' ';
        lineY += 26;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, boxX + textOffsetX, lineY);

    if (node.choices && node.choices.length > 0 && dialogueMgr.state.isTextComplete) {
      const choiceBoxW = boxW;
      const choiceBoxH = node.choices.length * 40 + 16;
      const choiceBoxX = boxX;
      const choiceBoxY = boxY - choiceBoxH - 10;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.98)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.fillRect(choiceBoxX, choiceBoxY, choiceBoxW, choiceBoxH);
      ctx.strokeRect(choiceBoxX, choiceBoxY, choiceBoxW, choiceBoxH);

      node.choices.forEach((choice, idx) => {
        const isSelected = idx === dialogueMgr.state.selectedChoiceIndex;
        const itemY = choiceBoxY + 26 + idx * 38;

        if (isSelected) {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
          ctx.fillRect(choiceBoxX + 8, itemY - 18, choiceBoxW - 16, 32);
          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 14px "PokemonGBA", "Outfit", sans-serif';
          ctx.fillText(`▶  ${choice.text}`, choiceBoxX + 18, itemY + 3);
        } else {
          ctx.fillStyle = '#cbd5e1';
          ctx.font = '14px "PokemonGBA", "Outfit", sans-serif';
          ctx.fillText(`    ${choice.text}`, choiceBoxX + 18, itemY + 3);
        }
      });
    }

    if (dialogueMgr.state.isTextComplete && (!node.choices || node.choices.length === 0)) {
      const bounce = Math.sin(Date.now() / 150) * 3;
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px "PokemonGBA", "Outfit", sans-serif';
      ctx.fillText('▼', boxX + boxW - 30, boxY + boxH - 16 + bounce);
    }

    ctx.restore();
  }
}
