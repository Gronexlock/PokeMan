import * as Phaser from 'phaser';
import { PokemonType } from '../core/types';

export type WeatherType =
  | 'CLEAR'
  | 'RAIN'
  | 'THUNDERSTORM'
  | 'SANDSTORM'
  | 'HARSH_SUN'
  | 'SNOW'
  | 'FOG';

export interface WeatherEffectInfo {
  name: string;
  description: string;
  icon: string;
}

/**
 * WeatherSystem — Motor de Clima Dinámico y Partículas en Phaser 3.
 *
 * Responsabilidades:
 * - Renderizado de efectos meteorológicos en Overworld (Lluvia, Tormenta, Arena, Sol, Nieve, Niebla).
 * - Efectos especiales: relámpagos con destello de pantalla, rayos de sol pulsantes, ráfagas de viento.
 * - Cálculo de modificadores de combate oficiales (Agua/Fuego en lluvia/sol, daño residual de arena/nieve).
 * - Transiciones climáticas automáticas o por bioma de mapa.
 */
export class WeatherSystem {
  private scene: Phaser.Scene;
  public currentWeather: WeatherType = 'CLEAR';

  // Capa gráfica del clima
  private weatherContainer!: Phaser.GameObjects.Container;
  private weatherOverlay!: Phaser.GameObjects.Graphics;
  private particleItems: {
    graphics: Phaser.GameObjects.Graphics | Phaser.GameObjects.Arc | Phaser.GameObjects.Rectangle;
    vx: number;
    vy: number;
    alpha: number;
    initialY: number;
  }[] = [];

  // Temporizadores para efectos episódicos (como relámpagos)
  private thunderTimer: number = 0;
  private nextThunderTime: number = 5000;
  private sunPulsePhase: number = 0;

  public static readonly WEATHER_INFO: Record<WeatherType, WeatherEffectInfo> = {
    CLEAR:        { name: 'Despejado',         icon: '☀️',  description: 'El clima está tranquilo.' },
    RAIN:         { name: 'Lluvia',            icon: '🌧️', description: 'Potencia movimientos de Agua un 50% y debilita Fuego un 50%.' },
    THUNDERSTORM: { name: 'Tormenta Eléctrica', icon: '⛈️', description: 'Lluvia intensa con relámpagos. Agua +50%, Fuego -50%, Trueno 100% precisión.' },
    SANDSTORM:    { name: 'Tormenta de Arena', icon: '🌪️', description: 'Daña 1/16 PS por turno a no Roca/Tierra/Acero. Aumenta Def. Esp de tipo Roca un 50%.' },
    HARSH_SUN:    { name: 'Sol Abrasador',     icon: '🌞',  description: 'Potencia movimientos de Fuego un 50% y debilita Agua un 50%.' },
    SNOW:         { name: 'Nieve / Granizo',   icon: '❄️',  description: 'Aumenta la Defensa de tipo Hielo un 50% y causa daño residual.' },
    FOG:          { name: 'Niebla Densa',      icon: '🌫️', description: 'Reduce la precisión de todos los movimientos un 10%.' },
  };

  constructor(scene: Phaser.Scene, initialWeather: WeatherType = 'CLEAR') {
    this.scene = scene;
    this.initWeatherGraphics();
    this.setWeather(initialWeather);
  }

  private initWeatherGraphics(): void {
    this.weatherContainer = this.scene.add.container(0, 0).setDepth(25).setScrollFactor(0);
    this.weatherOverlay = this.scene.add.graphics().setScrollFactor(0);
    this.weatherContainer.add(this.weatherOverlay);
  }

  /**
   * Cambia el clima actual e inicializa sus partículas y tintes.
   */
  public setWeather(weather: WeatherType): void {
    this.currentWeather = weather;
    this.clearParticles();
    this.weatherOverlay.clear();

    const { width, height } = this.scene.scale;

    switch (weather) {
      case 'RAIN':
      case 'THUNDERSTORM':
        this.spawnRainParticles(weather === 'THUNDERSTORM' ? 120 : 60);
        break;

      case 'SANDSTORM':
        this.spawnSandParticles(90);
        break;

      case 'SNOW':
        this.spawnSnowParticles(70);
        break;

      case 'FOG':
        this.spawnFogBands(6);
        break;

      case 'HARSH_SUN':
        // Sol no usa partículas individuales sino overlay pulsante
        break;

      case 'CLEAR':
      default:
        break;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // GENERADORES DE PARTÍCULAS
  // ──────────────────────────────────────────────────────────────────────────────

  private spawnRainParticles(count: number): void {
    const { width, height } = this.scene.scale;

    for (let i = 0; i < count; i++) {
      const g = this.scene.add.graphics();
      const x = Phaser.Math.Between(-50, width + 50);
      const y = Phaser.Math.Between(-50, height);
      const len = Phaser.Math.Between(12, 22);

      g.lineStyle(1.5, 0xa5f3fc, 0.7);
      g.lineBetween(0, 0, -4, len);
      g.setPosition(x, y);

      this.weatherContainer.add(g);
      this.particleItems.push({
        graphics: g,
        vx: -60,
        vy: Phaser.Math.Between(450, 650),
        alpha: Phaser.Math.FloatBetween(0.4, 0.8),
        initialY: y
      });
    }
  }

  private spawnSandParticles(count: number): void {
    const { width, height } = this.scene.scale;

    for (let i = 0; i < count; i++) {
      const g = this.scene.add.graphics();
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(2, 4);

      g.fillStyle(0xd97706, 0.6);
      g.fillRect(0, 0, size, size / 2);
      g.setPosition(x, y);

      this.weatherContainer.add(g);
      this.particleItems.push({
        graphics: g,
        vx: Phaser.Math.Between(300, 500),
        vy: Phaser.Math.Between(30, 80),
        alpha: Phaser.Math.FloatBetween(0.3, 0.7),
        initialY: y
      });
    }
  }

  private spawnSnowParticles(count: number): void {
    const { width, height } = this.scene.scale;

    for (let i = 0; i < count; i++) {
      const g = this.scene.add.graphics();
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(-50, height);
      const r = Phaser.Math.Between(1, 3);

      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(0, 0, r);
      g.setPosition(x, y);

      this.weatherContainer.add(g);
      this.particleItems.push({
        graphics: g,
        vx: Phaser.Math.Between(-30, 30),
        vy: Phaser.Math.Between(60, 140),
        alpha: Phaser.Math.FloatBetween(0.4, 0.9),
        initialY: y
      });
    }
  }

  private spawnFogBands(count: number): void {
    const { width, height } = this.scene.scale;

    for (let i = 0; i < count; i++) {
      const g = this.scene.add.graphics();
      const x = Phaser.Math.Between(-100, width);
      const y = i * (height / count) + Phaser.Math.Between(-20, 20);

      g.fillStyle(0xe2e8f0, 0.15);
      g.fillRoundedRect(0, 0, width + 200, 80, 40);
      g.setPosition(x, y);

      this.weatherContainer.add(g);
      this.particleItems.push({
        graphics: g,
        vx: Phaser.Math.Between(15, 35),
        vy: 0,
        alpha: 0.15,
        initialY: y
      });
    }
  }

  private clearParticles(): void {
    this.particleItems.forEach(p => p.graphics.destroy());
    this.particleItems = [];
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // UPDATE LOOP
  // ──────────────────────────────────────────────────────────────────────────────

  /**
   * Actualiza el movimiento de partículas y tintes de clima cada frame.
   * @param delta - Delta time en ms.
   */
  public update(delta: number): void {
    if (this.currentWeather === 'CLEAR') return;

    const dt = delta / 1000;
    const { width, height } = this.scene.scale;

    // 1. Mover partículas existentes
    for (const p of this.particleItems) {
      p.graphics.x += p.vx * dt;
      p.graphics.y += p.vy * dt;

      // Wrap-around de pantalla
      if (p.graphics.y > height + 40) {
        p.graphics.y = -30;
        p.graphics.x = Phaser.Math.Between(-20, width + 20);
      }
      if (p.graphics.x < -60) {
        p.graphics.x = width + 40;
      } else if (p.graphics.x > width + 60) {
        p.graphics.x = -40;
      }
    }

    // 2. Efectos dinámicos especiales por clima
    this.weatherOverlay.clear();

    switch (this.currentWeather) {
      case 'RAIN':
        // Tinte azul grisáceo tenue
        this.weatherOverlay.fillStyle(0x0284c7, 0.08);
        this.weatherOverlay.fillRect(0, 0, width, height);
        break;

      case 'THUNDERSTORM':
        // Tinte tormenta oscuro + relámpagos
        this.weatherOverlay.fillStyle(0x0f172a, 0.18);
        this.weatherOverlay.fillRect(0, 0, width, height);

        this.thunderTimer += delta;
        if (this.thunderTimer >= this.nextThunderTime) {
          this.triggerLightning();
          this.thunderTimer = 0;
          this.nextThunderTime = Phaser.Math.Between(4000, 9000);
        }
        break;

      case 'SANDSTORM':
        // Tinte ámbar / sepia desértico
        this.weatherOverlay.fillStyle(0xb45309, 0.14);
        this.weatherOverlay.fillRect(0, 0, width, height);
        break;

      case 'HARSH_SUN':
        // Pulsación cálida dorada de sol
        this.sunPulsePhase += dt * 2;
        const sunAlpha = 0.12 + Math.sin(this.sunPulsePhase) * 0.04;
        this.weatherOverlay.fillStyle(0xfef08a, sunAlpha);
        this.weatherOverlay.fillRect(0, 0, width, height);
        break;

      case 'SNOW':
        // Tinte blanco gélido
        this.weatherOverlay.fillStyle(0xe0f2fe, 0.08);
        this.weatherOverlay.fillRect(0, 0, width, height);
        break;

      case 'FOG':
        // Tinte blanco translúcido
        this.weatherOverlay.fillStyle(0xf1f5f9, 0.10);
        this.weatherOverlay.fillRect(0, 0, width, height);
        break;
    }
  }

  private triggerLightning(): void {
    // Flash blanco rápido en cámara simulando trueno
    this.scene.cameras.main.flash(180, 255, 255, 255);
    this.scene.cameras.main.shake(200, 0.004);
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // MODIFICADORES DE COMBATE PARA BATTLEMANAGER
  // ──────────────────────────────────────────────────────────────────────────────

  /**
   * Multiplicador de daño según el clima actual y el tipo de ataque.
   */
  public getDamageMultiplier(moveType: PokemonType): number {
    const t = moveType.toLowerCase();

    if (this.currentWeather === 'RAIN' || this.currentWeather === 'THUNDERSTORM') {
      if (t === 'water') return 1.5;
      if (t === 'fire') return 0.5;
    } else if (this.currentWeather === 'HARSH_SUN') {
      if (t === 'fire') return 1.5;
      if (t === 'water') return 0.5;
    }
    return 1.0;
  }

  /**
   * Comprueba si el Pokémon sufre daño residual por el clima al final de cada turno.
   * @param types - Tipos del Pokémon en combate.
   * @returns Porcentaje de PS máximos perdidos (0 si es inmune).
   */
  public getResidualDamageRatio(types: PokemonType[]): number {
    const isRock = types.includes('rock');
    const isGround = types.includes('ground');
    const isSteel = types.includes('steel');
    const isIce = types.includes('ice');

    if (this.currentWeather === 'SANDSTORM') {
      if (!isRock && !isGround && !isSteel) {
        return 1 / 16; // 6.25% de daño por turno
      }
    } else if (this.currentWeather === 'SNOW') {
      if (!isIce) {
        return 1 / 16;
      }
    }
    return 0;
  }

  /**
   * Bonus defensivo por clima (ej. Roca en Tormenta de Arena gana +50% Def. Esp).
   */
  public getStatModifier(types: PokemonType[], stat: 'defense' | 'spDefense'): number {
    if (this.currentWeather === 'SANDSTORM' && stat === 'spDefense' && types.includes('rock')) {
      return 1.5;
    }
    if (this.currentWeather === 'SNOW' && stat === 'defense' && types.includes('ice')) {
      return 1.5;
    }
    return 1.0;
  }
}
