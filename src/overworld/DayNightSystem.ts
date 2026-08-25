import * as Phaser from 'phaser';
import { TimeCycleManager } from './timeCycle';
import { TimePeriod } from '../core/types';

export interface DayNightColors {
  color: number;
  alpha: number;
}

/**
 * DayNightSystem — Sistema de Iluminación Ambiental y Ciclo Día/Noche en Phaser 3.
 *
 * Responsabilidades:
 * - Ciclo continuo de 24 horas (ajustable con multiplicador de tiempo).
 * - Overlay de iluminación ambiental suave con transiciones interpoladas:
 *   - MAÑANA (06:00 - 12:00): Tinte cálido matinal dorado.
 *   - DÍA (12:00 - 18:00): Luz natural clara (sin oscurecimiento).
 *   - ATARDECER (18:00 - 21:00): Tinte naranja/rojizo intenso.
 *   - NOCHE (21:00 - 06:00): Azul índigo oscuro con linterna radial sobre el jugador.
 * - Modificación de la tabla de encuentros según la hora (diurnos vs nocturnos).
 */
export class DayNightSystem {
  private scene: Phaser.Scene;
  public timeCycle: TimeCycleManager;

  // Capa gráfica de overlay de luz ambiental
  private ambientOverlay!: Phaser.GameObjects.Graphics;
  private lanternGraphic!: Phaser.GameObjects.Graphics;
  private clockText!: Phaser.GameObjects.Text;
  private isClockVisible: boolean = true;

  // Paleta de iluminación ambiental
  private readonly PERIOD_COLORS: Record<TimePeriod, DayNightColors> = {
    morning: { color: 0xfef3c7, alpha: 0.12 }, // Dorado suave
    day:     { color: 0xffffff, alpha: 0.00 }, // Despejado natural
    sunset:  { color: 0xea580c, alpha: 0.28 }, // Naranja atardecer
    night:   { color: 0x1e1b4b, alpha: 0.58 }, // Azul noche profundo
  };

  // Color y alpha interpolados actuales
  private currentColor: number = 0xffffff;
  private currentAlpha: number = 0;

  constructor(scene: Phaser.Scene, initialHour: number = 10) {
    this.scene = scene;
    this.timeCycle = new TimeCycleManager();
    this.timeCycle.setHour(initialHour);

    this.createGraphics();
  }

  private createGraphics(): void {
    const { width, height } = this.scene.scale;

    // 1. Overlay de luz ambiental (se fija a la cámara con setScrollFactor(0))
    this.ambientOverlay = this.scene.add.graphics();
    this.ambientOverlay.setScrollFactor(0);
    this.ambientOverlay.setDepth(20); // Por encima de todos los sprites normales

    // 2. Linterna de luz en la noche
    this.lanternGraphic = this.scene.add.graphics();
    this.lanternGraphic.setDepth(21);

    // 3. Reloj HUD en la esquina superior derecha
    this.clockText = this.scene.add.text(width - 16, 16, '', {
      fontFamily: 'Arial',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#f8fafc',
      backgroundColor: '#0f172aee',
      padding: { x: 8, y: 4 }
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(30);

    this.updateAmbientColor(0);
  }

  /**
   * Actualiza el ciclo de tiempo y la iluminación cada frame.
   * @param delta - Tiempo en ms transcurrido en el frame actual.
   * @param playerX - Posición X del jugador en píxeles de mundo.
   * @param playerY - Posición Y del jugador en píxeles de mundo.
   */
  public update(delta: number, playerX?: number, playerY?: number): void {
    // Avanzar reloj del juego (delta en segundos)
    this.timeCycle.update(delta / 1000);

    const period = this.timeCycle.getTimePeriod();
    const target = this.PERIOD_COLORS[period];

    // Interpolar suavemente el alpha para transiciones fluidas
    this.currentAlpha = Phaser.Math.Linear(this.currentAlpha, target.alpha, 0.05);
    this.currentColor = target.color;

    this.renderAmbientOverlay(playerX, playerY, period);

    // Actualizar reloj
    if (this.isClockVisible) {
      const periodIcons: Record<TimePeriod, string> = {
        morning: '🌅',
        day: '☀️',
        sunset: '🌇',
        night: '🌙'
      };
      this.clockText.setText(`${periodIcons[period]} ${this.timeCycle.getTimeString()}`);
    }
  }

  /**
   * Dibuja el oscurecimiento ambiental y el halo de luz si es de noche.
   */
  private renderAmbientOverlay(playerX?: number, playerY?: number, period?: TimePeriod): void {
    const { width, height } = this.scene.scale;
    this.ambientOverlay.clear();

    if (this.currentAlpha <= 0.01) return;

    // Dibujar pantalla completa con tinte ambiental
    this.ambientOverlay.fillStyle(this.currentColor, this.currentAlpha);
    this.ambientOverlay.fillRect(0, 0, width, height);

    // Si es de noche y se conoce la posición del jugador, añadir halo de luz tenue
    if (period === 'night' && playerX !== undefined && playerY !== undefined) {
      const cam = this.scene.cameras.main;
      const screenX = playerX - cam.scrollX;
      const screenY = playerY - cam.scrollY;

      // Halo circular transparente alrededor del jugador
      this.lanternGraphic.clear();
      this.lanternGraphic.fillStyle(0xfde047, 0.08);
      this.lanternGraphic.fillCircle(playerX, playerY, 70);
      this.lanternGraphic.fillStyle(0xffffff, 0.12);
      this.lanternGraphic.fillCircle(playerX, playerY, 40);
    } else {
      this.lanternGraphic.clear();
    }
  }

  private updateAmbientColor(_delta: number): void {
    const period = this.timeCycle.getTimePeriod();
    const target = this.PERIOD_COLORS[period];
    this.currentColor = target.color;
    this.currentAlpha = target.alpha;
  }

  /**
   * Devuelve si un encuentro salvaje debe ser diurno o nocturno.
   */
  public isNight(): boolean {
    return this.timeCycle.getTimePeriod() === 'night';
  }

  public getPeriod(): TimePeriod {
    return this.timeCycle.getTimePeriod();
  }

  public setClockVisible(visible: boolean): void {
    this.isClockVisible = visible;
    this.clockText.setVisible(visible);
  }

  public setHour(hour: number): void {
    this.timeCycle.setHour(hour);
  }
}
