import * as Phaser from 'phaser';
import { MapWarp } from './MapManager';

export type WarpTransitionType = 'door_fade' | 'slide_up' | 'slide_down' | 'instant';

export interface WarpTransitionResult {
  targetMapKey: string;
  targetX: number;
  targetY: number;
  facingDirection: string;
}

/**
 * Gestor de Transiciones entre Mapas (Warps / Puertas).
 *
 * Responsabilidades:
 * - Detectar si el jugador está pisando un trigger de Warp.
 * - Ejecutar la animación de transición (Fade, Slide, Instant).
 * - Notificar a la escena con los datos del mapa destino una vez completado el fade.
 */
export class WarpManager {
  private scene: Phaser.Scene;
  private isTransitioning: boolean = false;

  // Zona de cooldown para evitar disparar el warp múltiples veces al volver de un mapa
  private cooldownActive: boolean = false;
  private readonly COOLDOWN_MS = 800;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Comprueba si el jugador está sobre un warp y ejecuta la transición si aplica.
   * Debe llamarse en el método `update()` de la escena, pasando la posición del jugador.
   *
   * @param playerX - Posición X del jugador en píxeles.
   * @param playerY - Posición Y del jugador en píxeles (ajustar al centro de los pies).
   * @param warps   - Lista de warps del mapa actual.
   * @param onComplete - Callback con los datos del mapa destino para reiniciar la escena.
   */
  public checkAndTrigger(
    playerX: number,
    playerY: number,
    warps: MapWarp[],
    onComplete: (result: WarpTransitionResult) => void
  ): void {
    if (this.isTransitioning || this.cooldownActive) return;

    const triggered = this.findTriggeredWarp(playerX, playerY, warps);
    if (!triggered) return;

    this.executeTransition(triggered, onComplete);
  }

  /**
   * Busca el primer warp cuyo área rectangular contenga la posición del jugador.
   */
  private findTriggeredWarp(playerX: number, playerY: number, warps: MapWarp[]): MapWarp | null {
    for (const warp of warps) {
      const halfW = (warp.width ?? 32) / 2;
      const halfH = (warp.height ?? 32) / 2;

      // Área del warp centrada en su posición
      const left = warp.x - halfW;
      const right = warp.x + halfW;
      const top = warp.y - halfH;
      const bottom = warp.y + halfH;

      if (playerX >= left && playerX <= right && playerY >= top && playerY <= bottom) {
        return warp;
      }
    }
    return null;
  }

  /**
   * Ejecuta la animación de transición según el tipo definido en el warp.
   */
  private executeTransition(warp: MapWarp, onComplete: (result: WarpTransitionResult) => void): void {
    this.isTransitioning = true;

    switch (warp.transitionType) {
      case 'instant':
        this.completeTransition(warp, onComplete);
        break;

      case 'slide_up':
        this.executeSlideTransition(warp, onComplete, 'up');
        break;

      case 'slide_down':
        this.executeSlideTransition(warp, onComplete, 'down');
        break;

      case 'door_fade':
      default:
        this.executeFadeTransition(warp, onComplete);
        break;
    }
  }

  /**
   * Transición Clásica: Fade a Negro → Cambio de Mapa → Fade desde Negro.
   * Estilo Pokémon GBA (al entrar a casas, laboratorios, tiendas).
   */
  private executeFadeTransition(warp: MapWarp, onComplete: (result: WarpTransitionResult) => void): void {
    const mainCam = this.scene.cameras.main;

    mainCam.fade(300, 0, 0, 0, false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress === 1) {
        this.completeTransition(warp, onComplete);
      }
    });
  }

  /**
   * Transición con Slide (para escaleras internas, sótanos, etc.).
   * La pantalla se desplaza hacia arriba o abajo mientras cambia el mapa.
   */
  private executeSlideTransition(
    warp: MapWarp,
    onComplete: (result: WarpTransitionResult) => void,
    direction: 'up' | 'down'
  ): void {
    const mainCam = this.scene.cameras.main;
    const offsetY = direction === 'up' ? -mainCam.height : mainCam.height;

    this.scene.tweens.add({
      targets: mainCam,
      scrollY: mainCam.scrollY + offsetY,
      duration: 350,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        this.completeTransition(warp, onComplete);
      }
    });
  }

  /**
   * Dispara el callback con los datos del destino y activa el cooldown anti-retrigger.
   */
  private completeTransition(warp: MapWarp, onComplete: (result: WarpTransitionResult) => void): void {
    const result: WarpTransitionResult = {
      targetMapKey: warp.targetMapKey,
      targetX: warp.targetX,
      targetY: warp.targetY,
      facingDirection: warp.facingDirection ?? 'DOWN'
    };

    onComplete(result);

    // Reiniciamos el flag después de un tiempo para que la escena nueva se cargue sin re-disparar
    this.scene.time.delayedCall(this.COOLDOWN_MS, () => {
      this.isTransitioning = false;
      this.cooldownActive = false;
    });
  }

  /**
   * Activa un cooldown al inicio de una escena para evitar que el warp de llegada
   * se re-dispare inmediatamente al aparecer el jugador sobre él.
   */
  public activateCooldown(): void {
    this.cooldownActive = true;
    this.scene.time.delayedCall(this.COOLDOWN_MS, () => {
      this.cooldownActive = false;
    });
  }

  /**
   * Ejecuta un Fade-In (desde negro) al aparecer en el nuevo mapa.
   * Llamar justo después de que la escena nueva ha creado los objetos.
   */
  public fadeIn(durationMs: number = 400): void {
    this.scene.cameras.main.fadeIn(durationMs, 0, 0, 0);
  }

  public get transitioning(): boolean {
    return this.isTransitioning;
  }
}
