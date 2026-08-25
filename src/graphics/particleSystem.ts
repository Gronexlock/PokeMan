export type ParticleType =
  | 'FIRE'
  | 'WATER'
  | 'GRASS'
  | 'ELECTRIC'
  | 'SLASH'
  | 'STAT_UP'
  | 'STAT_DOWN'
  | 'DUST'
  | 'WATER_WAKE'
  | 'SPARKLE';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape: 'circle' | 'leaf' | 'slash' | 'arrow_up' | 'arrow_down' | 'star';
  rotation: number;
  vRot: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  public screenShake: { intensity: number; duration: number; timer: number } = {
    intensity: 0,
    duration: 0,
    timer: 0
  };

  public update(dt: number): void {
    // 1. Actualizar partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.vRot * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 2. Actualizar Screen Shake
    if (this.screenShake.timer > 0) {
      this.screenShake.timer -= dt;
      if (this.screenShake.timer <= 0) {
        this.screenShake.intensity = 0;
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.shape === 'circle') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'leaf') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'slash') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(-p.size * 4, -p.size * 3);
        ctx.lineTo(p.size * 4, p.size * 3);
        ctx.stroke();
      } else if (p.shape === 'arrow_up') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size * 2);
        ctx.lineTo(-p.size, p.size);
        ctx.lineTo(p.size, p.size);
        ctx.closePath();
        ctx.fill();
      } else if (p.shape === 'arrow_down') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, p.size * 2);
        ctx.lineTo(-p.size, -p.size);
        ctx.lineTo(p.size, -p.size);
        ctx.closePath();
        ctx.fill();
      } else if (p.shape === 'star') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
          const r = i % 2 === 0 ? p.size : p.size * 0.4;
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.restore();
  }

  public triggerScreenShake(intensity: number = 8, duration: number = 0.3): void {
    this.screenShake = {
      intensity,
      duration,
      timer: duration
    };
  }

  public getShakeOffset(): { x: number; y: number } {
    if (this.screenShake.timer <= 0) return { x: 0, y: 0 };
    const progress = this.screenShake.timer / this.screenShake.duration;
    const curInt = this.screenShake.intensity * progress;
    return {
      x: (Math.random() - 0.5) * 2 * curInt,
      y: (Math.random() - 0.5) * 2 * curInt
    };
  }

  public spawnAttackFX(
    type: ParticleType,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ): void {
    const count = type === 'FIRE' ? 35 :
                  type === 'WATER' ? 30 :
                  type === 'GRASS' ? 28 :
                  type === 'ELECTRIC' ? 32 : 18;

    if (type === 'FIRE') {
      this.triggerScreenShake(6, 0.25);
      for (let i = 0; i < count; i++) {
        const t = Math.random();
        const startX = fromX + (toX - fromX) * t * 0.4;
        const startY = fromY + (toY - fromY) * t * 0.4;
        const angle = Math.atan2(toY - fromY, toX - fromX) + (Math.random() - 0.5) * 0.6;
        const speed = 200 + Math.random() * 250;
        const colors = ['#ea580c', '#f97316', '#fbbf24', '#ef4444'];
        this.particles.push({
          x: startX,
          y: startY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 30,
          size: 6 + Math.random() * 10,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          life: 0.4 + Math.random() * 0.3,
          maxLife: 0.7,
          shape: 'circle',
          rotation: 0,
          vRot: (Math.random() - 0.5) * 6
        });
      }
    } else if (type === 'WATER') {
      this.triggerScreenShake(4, 0.2);
      for (let i = 0; i < count; i++) {
        const angle = Math.atan2(toY - fromY, toX - fromX) + (Math.random() - 0.5) * 0.8;
        const speed = 180 + Math.random() * 220;
        const colors = ['#38bdf8', '#0284c7', '#60a5fa', '#93c5fd'];
        this.particles.push({
          x: fromX + (Math.random() - 0.5) * 20,
          y: fromY + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 60,
          size: 5 + Math.random() * 8,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 0.9,
          life: 0.45 + Math.random() * 0.25,
          maxLife: 0.7,
          shape: 'circle',
          rotation: 0,
          vRot: 0
        });
      }
    } else if (type === 'GRASS') {
      this.triggerScreenShake(4, 0.2);
      for (let i = 0; i < count; i++) {
        const angle = Math.atan2(toY - fromY, toX - fromX) + (Math.random() - 0.5) * 1.0;
        const speed = 190 + Math.random() * 200;
        const colors = ['#22c55e', '#16a34a', '#86efac', '#4ade80'];
        this.particles.push({
          x: fromX,
          y: fromY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 20,
          size: 5 + Math.random() * 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          life: 0.5 + Math.random() * 0.3,
          maxLife: 0.8,
          shape: 'leaf',
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 12
        });
      }
    } else if (type === 'ELECTRIC') {
      this.triggerScreenShake(7, 0.28);
      for (let i = 0; i < count; i++) {
        const colors = ['#fde047', '#facc15', '#ffffff', '#eab308'];
        this.particles.push({
          x: toX + (Math.random() - 0.5) * 60,
          y: toY + (Math.random() - 0.5) * 60,
          vx: (Math.random() - 0.5) * 150,
          vy: (Math.random() - 0.5) * 150,
          size: 4 + Math.random() * 8,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          life: 0.25 + Math.random() * 0.25,
          maxLife: 0.5,
          shape: 'star',
          rotation: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 16
        });
      }
    } else if (type === 'SLASH') {
      this.triggerScreenShake(8, 0.3);
      for (let i = 0; i < 4; i++) {
        this.particles.push({
          x: toX + (i - 1.5) * 16,
          y: toY + (i - 1.5) * 16,
          vx: 0,
          vy: 0,
          size: 5 + i * 2,
          color: '#ffffff',
          alpha: 1,
          life: 0.25,
          maxLife: 0.25,
          shape: 'slash',
          rotation: -Math.PI / 4,
          vRot: 0
        });
      }
    } else if (type === 'STAT_UP') {
      for (let i = 0; i < 14; i++) {
        this.particles.push({
          x: fromX + (Math.random() - 0.5) * 70,
          y: fromY + 40 + Math.random() * 20,
          vx: (Math.random() - 0.5) * 20,
          vy: -120 - Math.random() * 60,
          size: 7 + Math.random() * 4,
          color: '#38bdf8',
          alpha: 1,
          life: 0.6 + Math.random() * 0.3,
          maxLife: 0.9,
          shape: 'arrow_up',
          rotation: 0,
          vRot: 0
        });
      }
    } else if (type === 'STAT_DOWN') {
      for (let i = 0; i < 14; i++) {
        this.particles.push({
          x: toX + (Math.random() - 0.5) * 70,
          y: toY - 40 - Math.random() * 20,
          vx: (Math.random() - 0.5) * 20,
          vy: 120 + Math.random() * 60,
          size: 7 + Math.random() * 4,
          color: '#f43f5e',
          alpha: 1,
          life: 0.6 + Math.random() * 0.3,
          maxLife: 0.9,
          shape: 'arrow_down',
          rotation: 0,
          vRot: 0
        });
      }
    }
  }

  public spawnOverworldDust(x: number, y: number): void {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 30,
        vy: -10 - Math.random() * 15,
        size: 3 + Math.random() * 3,
        color: 'rgba(214, 211, 209, 0.8)',
        alpha: 0.8,
        life: 0.25,
        maxLife: 0.25,
        shape: 'circle',
        rotation: 0,
        vRot: 0
      });
    }
  }
}
