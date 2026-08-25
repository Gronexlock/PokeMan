import * as Phaser from 'phaser';
import { OverworldScene } from '../scenes/OverworldScene';
import { BattleScene } from '../scenes/BattleScene';

/**
 * Configuración oficial del motor Phaser 3 para Pokémon: Ecos de Andara.
 *
 * Características:
 * - Resolución nativa 960x540 (16:9 pixel-perfect scaling).
 * - Renderizado PixelArt sin antialiasing borroso.
 * - Motor de física Arcade desacoplado (sin gravedad en Overworld).
 * - Sistema de escenas modular: OverworldScene (mundo) y BattleScene (combate).
 */
export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  parent: 'game-viewport',
  canvas: document.getElementById('game-canvas') as HTMLCanvasElement || undefined,
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  backgroundColor: '#0f172a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540
  },
  scene: [OverworldScene, BattleScene]
};
