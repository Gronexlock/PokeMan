import { TimePeriod } from '../core/types';

export interface LightSource {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
}

export class LightingShader {
  public renderLighting(
    ctx: CanvasRenderingContext2D,
    timePeriod: TimePeriod,
    width: number,
    height: number,
    lights: LightSource[] = []
  ): void {
    if (timePeriod === 'day') {
      return; // A pleno mediodía no se requiere tinte
    }

    ctx.save();

    // 1. Color de tinte ambiental
    let ambientColor = "rgba(0, 0, 0, 0)";
    if (timePeriod === 'morning') {
      ambientColor = "rgba(255, 170, 70, 0.12)";
    } else if (timePeriod === 'sunset') {
      ambientColor = "rgba(210, 80, 30, 0.28)";
    } else if (timePeriod === 'night') {
      ambientColor = "rgba(10, 18, 50, 0.65)";
    }

    // 2. Si hay luces en la noche o atardecer, usar composición para iluminar huecos
    if (timePeriod === 'night' && lights.length > 0) {
      // Crear capa de sombra y recortar las luces
      ctx.fillStyle = ambientColor;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'destination-out';
      for (const light of lights) {
        const grad = ctx.createRadialGradient(
          light.x, light.y, 0,
          light.x, light.y, light.radius
        );
        grad.addColorStop(0, `rgba(255, 255, 255, ${light.intensity})`);
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';

      // Añadir resplandor cálido a las fuentes de luz
      for (const light of lights) {
        const warmGrad = ctx.createRadialGradient(
          light.x, light.y, 0,
          light.x, light.y, light.radius
        );
        warmGrad.addColorStop(0, light.color);
        warmGrad.addColorStop(1, "rgba(255, 200, 100, 0)");

        ctx.fillStyle = warmGrad;
        ctx.beginPath();
        ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = ambientColor;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  }
}
