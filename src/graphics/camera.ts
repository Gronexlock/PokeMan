export class Camera {
  public x: number = 0;
  public y: number = 0;
  public targetX: number = 0;
  public targetY: number = 0;

  public viewportWidth: number;
  public viewportHeight: number;

  public shakeDuration: number = 0;
  public shakeIntensity: number = 0;
  public shakeOffsetX: number = 0;
  public shakeOffsetY: number = 0;

  public lerpFactor: number = 0.12;

  constructor(viewportWidth: number = 960, viewportHeight: number = 540) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  public setTarget(targetX: number, targetY: number, immediate: boolean = false): void {
    this.targetX = targetX - this.viewportWidth / 2;
    this.targetY = targetY - this.viewportHeight / 2;

    if (immediate) {
      this.x = this.targetX;
      this.y = this.targetY;
    }
  }

  public triggerShake(intensity: number = 8, duration: number = 0.3): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  public update(dt: number, mapWidthPx: number, mapHeightPx: number): void {
    // Interpolación lineal hacia el objetivo
    this.x += (this.targetX - this.x) * this.lerpFactor;
    this.y += (this.targetY - this.y) * this.lerpFactor;

    // Limitar dentro de los bordes del mapa
    const maxX = Math.max(0, mapWidthPx - this.viewportWidth);
    const maxY = Math.max(0, mapHeightPx - this.viewportHeight);

    this.x = Math.max(0, Math.min(maxX, this.x));
    this.y = Math.max(0, Math.min(maxY, this.y));

    // Efecto de sacudida
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      this.shakeOffsetX = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() * 2 - 1) * this.shakeIntensity;
      if (this.shakeDuration <= 0) {
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
      }
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  public getScreenX(worldX: number): number {
    return Math.floor(worldX - this.x + this.shakeOffsetX);
  }

  public getScreenY(worldY: number): number {
    return Math.floor(worldY - this.y + this.shakeOffsetY);
  }
}
