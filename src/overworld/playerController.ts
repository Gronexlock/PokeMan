export type FacingDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export class PlayerController {
  public tileX: number = 6;
  public tileY: number = 8;
  public xPx: number = 6 * 32;
  public yPx: number = 8 * 32;

  public targetTileX: number = 6;
  public targetTileY: number = 8;

  public facing: FacingDirection = 'DOWN';
  public isMoving: boolean = false;
  public isRunning: boolean = false;
  public isBiking: boolean = false;
  public isSurfing: boolean = false;
  public isJumpingLedge: boolean = false;
  public spriteKey: string = 'player.png';

  public animFrame: number = 0;
  public animTimer: number = 0;

  public walkSpeed: number = 150; // px / sec
  public runSpeed: number = 260;  // px / sec
  public bikeSpeed: number = 360; // px / sec
  public surfSpeed: number = 210; // px / sec
  public tileSize: number = 48;

  public jumpProgress: number = 0;
  public jumpArcHeight: number = 20;

  constructor(startX: number = 6, startY: number = 8, tileSize: number = 48) {
    this.tileSize = tileSize;
    this.setPosition(startX, startY);
  }

  public setPosition(tileX: number, tileY: number): void {
    this.tileX = tileX;
    this.tileY = tileY;
    this.targetTileX = tileX;
    this.targetTileY = tileY;
    this.xPx = tileX * this.tileSize;
    this.yPx = tileY * this.tileSize;
    this.isMoving = false;
    this.isJumpingLedge = false;
  }

  public tryMove(
    dir: FacingDirection,
    isRunning: boolean,
    isWalkableFn: (x: number, y: number) => { walkable: boolean; isLedge?: boolean; warp?: any }
  ): { moved: boolean; hitWarp?: any } {
    this.facing = dir;
    this.isRunning = isRunning;

    if (this.isMoving) {
      return { moved: false };
    }

    let nextX = this.tileX;
    let nextY = this.tileY;

    if (dir === 'UP') nextY--;
    else if (dir === 'DOWN') nextY++;
    else if (dir === 'LEFT') nextX--;
    else if (dir === 'RIGHT') nextX++;

    const check = isWalkableFn(nextX, nextY);

    if (check.isLedge && dir === 'DOWN') {
      // Salto de desnivel
      this.isJumpingLedge = true;
      this.jumpProgress = 0;
      this.targetTileX = nextX;
      this.targetTileY = nextY + 1; // Salta 2 tiles hacia abajo
      this.isMoving = true;
      return { moved: true };
    }

    if (check.walkable) {
      this.targetTileX = nextX;
      this.targetTileY = nextY;
      this.isMoving = true;
      return { moved: true, hitWarp: check.warp };
    }

    return { moved: false };
  }

  public update(dt: number): { reachedTile: boolean; tileX: number; tileY: number } {
    let reachedTile = false;

    if (!this.isMoving) {
      this.animFrame = 0;
      this.animTimer = 0;
      return { reachedTile: false, tileX: this.tileX, tileY: this.tileY };
    }

    const currentSpeed = this.isBiking ? this.bikeSpeed :
                         this.isSurfing ? this.surfSpeed :
                         this.isRunning ? this.runSpeed : this.walkSpeed;
    const targetPxX = this.targetTileX * this.tileSize;
    const targetPxY = this.targetTileY * this.tileSize;

    // Actualizar animación de caminata
    const frameRate = this.isBiking ? 0.08 : this.isRunning ? 0.10 : 0.16;
    this.animTimer += dt;
    if (this.animTimer >= frameRate) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    // Mover posición hacia target
    const dx = targetPxX - this.xPx;
    const dy = targetPxY - this.yPx;
    const dist = Math.hypot(dx, dy);
    const step = currentSpeed * dt;

    if (this.isJumpingLedge) {
      this.jumpProgress = Math.min(1.0, this.jumpProgress + dt * 3.5);
    }

    if (dist <= step) {
      this.xPx = targetPxX;
      this.yPx = targetPxY;
      this.tileX = this.targetTileX;
      this.tileY = this.targetTileY;
      this.isMoving = false;
      this.isJumpingLedge = false;
      reachedTile = true;
    } else {
      this.xPx += (dx / dist) * step;
      this.yPx += (dy / dist) * step;
    }

    return { reachedTile, tileX: this.tileX, tileY: this.tileY };
  }

  public getVisualY(): number {
    if (this.isJumpingLedge) {
      // Parábola de salto
      const arc = Math.sin(this.jumpProgress * Math.PI) * this.jumpArcHeight;
      return this.yPx - arc;
    }
    return this.yPx;
  }
}
