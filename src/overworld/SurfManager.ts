import * as Phaser from 'phaser';
import { DialogueBoxPhaser } from '../ui/DialogueBoxPhaser';

export interface WaterEncounterSpecies {
  id: number;
  name: string;
  levelRange: [number, number];
  weight: number;
}

/**
 * SurfManager — Sistema de Navegación Acuática y HM Surf en Phaser 3.
 *
 * Responsabilidades:
 * - Detectar si la casilla frente al jugador es agua (`isWater: true` en Tiled).
 * - Diálogo de confirmación para iniciar Surf si el jugador posee la HM / Medalla.
 * - Montura de Surf estilizada (Lapras / Flotador con ondas acuáticas) debajo del jugador.
 * - Desembarco automático al tocar tierra firme.
 * - Tiradas de encuentros acuáticos independientes (Tentacool, Magikarp, Marill, etc.).
 */
export class SurfManager {
  private scene: Phaser.Scene;
  private dialogueBox: DialogueBoxPhaser;

  // Estado de Surf
  private isSurfing: boolean = false;
  private hasSurfUnlocked: boolean = true; // Por defecto true para testing (o condicionado a medalla)
  private isTransitioningSurf: boolean = false;

  // Gráfico / Contenedor de la montura acuática
  private surfMountGraphics!: Phaser.GameObjects.Graphics;
  private waterRipplesTimer: number = 0;

  // Parámetros de movimiento en agua
  public readonly SURF_SPEED = 160;
  private readonly WATER_ENCOUNTER_PROBABILITY = 0.08; // 8% por casilla nueva en agua

  // Especies salvajes acuáticas por defecto
  public waterEncounters: WaterEncounterSpecies[] = [
    { id: 129, name: 'Magikarp',  levelRange: [8, 14],  weight: 40 },
    { id: 72,  name: 'Tentacool', levelRange: [10, 15], weight: 35 },
    { id: 183, name: 'Marill',    levelRange: [10, 14], weight: 15 },
    { id: 54,  name: 'Psyduck',   levelRange: [11, 16], weight: 10 },
  ];

  constructor(scene: Phaser.Scene, dialogueBox: DialogueBoxPhaser) {
    this.scene = scene;
    this.dialogueBox = dialogueBox;
    this.createMountGraphics();
  }

  private createMountGraphics(): void {
    this.surfMountGraphics = this.scene.add.graphics();
    this.surfMountGraphics.setDepth(6); // Justo debajo del sprite del jugador (depth 7)
    this.surfMountGraphics.setVisible(false);
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // COMPROBACIÓN Y ACTIVACIÓN DE SURF
  // ──────────────────────────────────────────────────────────────────────────────

  /**
   * Comprueba si el jugador puede iniciar Surf al interactuar frente a un tile de agua.
   * @param player - Sprite del jugador.
   * @param map - Tilemap actual.
   * @param groundLayer - Capa de suelo de Tiled.
   * @param facing - Dirección actual ('UP' | 'DOWN' | 'LEFT' | 'RIGHT').
   * @param onStartSurf - Callback al embarcar con éxito.
   */
  public tryStartSurf(
    player: Phaser.Physics.Arcade.Sprite,
    map: Phaser.Tilemaps.Tilemap,
    groundLayer: Phaser.Tilemaps.TilemapLayer,
    facing: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT',
    onStartSurf?: () => void
  ): boolean {
    if (this.isSurfing || this.isTransitioningSurf) return false;
    if (this.dialogueBox.isDialogueActive()) return false;

    const tileSize = map.tileWidth || 32;
    const lookX = player.x + (facing === 'RIGHT' ? tileSize : facing === 'LEFT' ? -tileSize : 0);
    const lookY = player.y + (facing === 'DOWN' ? tileSize : facing === 'UP' ? -tileSize : 0);

    const tileX = map.worldToTileX(lookX) ?? -1;
    const tileY = map.worldToTileY(lookY) ?? -1;

    const tile = groundLayer.getTileAt(tileX, tileY);
    const isWaterTile = tile && (tile.properties?.isWater === true || tile.properties?.water === true);

    if (!isWaterTile) return false;

    if (!this.hasSurfUnlocked) {
      this.dialogueBox.startDialogue('Agua', ['El agua tiene un azul profundo y cristalino.', 'Necesitas la HM Surf para poder navegar.']);
      return true;
    }

    // Diálogo de confirmación para hacer Surf
    this.dialogueBox.startDialogue(
      'Agua',
      ['¡El agua está tranquila y cristalina!', '¿Quieres subirte a tu montura de Surf?'],
      () => {
        this.embarkSurf(player, lookX, lookY, onStartSurf);
      }
    );

    return true;
  }

  /**
   * Ejecuta el salto de embarque al agua y activa el modo Surf.
   */
  private embarkSurf(
    player: Phaser.Physics.Arcade.Sprite,
    targetX: number,
    targetY: number,
    onStartSurf?: () => void
  ): void {
    this.isTransitioningSurf = true;
    player.setVelocity(0, 0);

    // Salto parabólico suave hacia el agua
    this.scene.tweens.add({
      targets: player,
      x: targetX,
      y: targetY - 10,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: player,
          y: targetY,
          duration: 180,
          ease: 'Quad.easeIn',
          onComplete: () => {
            this.isSurfing = true;
            this.isTransitioningSurf = false;
            this.surfMountGraphics.setVisible(true);
            onStartSurf?.();
          }
        });
      }
    });
  }

  /**
   * Desembarca automáticamente si el jugador avanza hacia una casilla de tierra firme.
   */
  public tryDismount(
    player: Phaser.Physics.Arcade.Sprite,
    map: Phaser.Tilemaps.Tilemap,
    groundLayer: Phaser.Tilemaps.TilemapLayer,
    facing: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
  ): boolean {
    if (!this.isSurfing || this.isTransitioningSurf) return false;

    const tileSize = map.tileWidth || 32;
    const lookX = player.x + (facing === 'RIGHT' ? tileSize : facing === 'LEFT' ? -tileSize : 0);
    const lookY = player.y + (facing === 'DOWN' ? tileSize : facing === 'UP' ? -tileSize : 0);

    const tileX = map.worldToTileX(lookX) ?? -1;
    const tileY = map.worldToTileY(lookY) ?? -1;

    const tile = groundLayer.getTileAt(tileX, tileY);
    const isWaterTile = tile && (tile.properties?.isWater === true || tile.properties?.water === true);

    // Si la casilla frente al jugador NO es agua y es transitable, desembarcamos
    if (!isWaterTile) {
      this.isTransitioningSurf = true;
      player.setVelocity(0, 0);

      this.scene.tweens.add({
        targets: player,
        x: lookX,
        y: lookY - 8,
        duration: 150,
        ease: 'Quad.easeOut',
        onComplete: () => {
          this.scene.tweens.add({
            targets: player,
            y: lookY,
            duration: 150,
            ease: 'Quad.easeIn',
            onComplete: () => {
              this.isSurfing = false;
              this.isTransitioningSurf = false;
              this.surfMountGraphics.setVisible(false);
            }
          });
        }
      });
      return true;
    }
    return false;
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // ACTUALIZACIÓN Y RENDERIZADO DE LA MONTURA ACUÁTICA
  // ──────────────────────────────────────────────────────────────────────────────

  /**
   * Actualiza la posición y animación de ondas de la montura de Surf.
   * @param playerX - Posición X del jugador.
   * @param playerY - Posición Y del jugador.
   * @param delta - Delta time en ms.
   */
  public update(playerX: number, playerY: number, delta: number): void {
    if (!this.isSurfing) {
      this.surfMountGraphics.setVisible(false);
      return;
    }

    this.surfMountGraphics.setVisible(true);
    this.surfMountGraphics.clear();

    const px = playerX;
    const py = playerY + 12;

    // 1. Ondas de agua concéntricas animadas
    this.waterRipplesTimer += delta * 0.004;
    const waveOffset = Math.sin(this.waterRipplesTimer) * 2;

    this.surfMountGraphics.lineStyle(1.5, 0x67e8f9, 0.6);
    this.surfMountGraphics.strokeEllipse(px, py + waveOffset, 36, 16);

    // 2. Montura acuática estilizada (Lapras azul con concha gris)
    this.surfMountGraphics.fillStyle(0x0284c7, 1);
    this.surfMountGraphics.fillRoundedRect(px - 16, py - 6, 32, 16, 8);
    this.surfMountGraphics.lineStyle(2, 0x0369a1, 1);
    this.surfMountGraphics.strokeRoundedRect(px - 16, py - 6, 32, 16, 8);

    // Concha / montura
    this.surfMountGraphics.fillStyle(0x475569, 1);
    this.surfMountGraphics.fillCircle(px, py - 2, 8);
    this.surfMountGraphics.lineStyle(1, 0x1e293b, 1);
    this.surfMountGraphics.strokeCircle(px, py - 2, 8);
  }

  /**
   * Comprueba la tirada de encuentro salvaje acuático.
   */
  public checkWaterEncounter(): boolean {
    if (!this.isSurfing) return false;
    return Math.random() < this.WATER_ENCOUNTER_PROBABILITY;
  }

  public get surfing(): boolean {
    return this.isSurfing;
  }

  public setSurfUnlocked(unlocked: boolean): void {
    this.hasSurfUnlocked = unlocked;
  }
}
