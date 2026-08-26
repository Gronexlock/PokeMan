import { describe, it, expect, beforeEach } from './testRunner';
import { BicycleManager } from '../src/overworld/BicycleManager';
import { RepelSystem } from '../src/overworld/RepelSystem';
import { FishingManager } from '../src/overworld/FishingManager';
import { FieldObstacleManager } from '../src/overworld/FieldObstacleManager';

describe('Opción B — Field Mechanics Tests (Bicycle, Repel, Fishing, Field Obstacles)', () => {
  // ─────────────────────────────────────────────────────────────
  // 1. BICICLETA DE ANDARA
  // ─────────────────────────────────────────────────────────────
  it('Alternancia de Bicicleta duplica la velocidad del jugador (130 -> 260 px/s)', () => {
    const fakeScene: any = { input: { keyboard: { addKey: () => ({ on: () => {} }) } } };
    const bike = new BicycleManager(fakeScene, {} as any);

    expect(bike.currentSpeed).toBe(130);
    expect(bike.biking).toBe(false);

    bike.toggleBicycle();
    expect(bike.currentSpeed).toBe(260);
    expect(bike.biking).toBe(true);

    bike.toggleBicycle();
    expect(bike.currentSpeed).toBe(130);
    expect(bike.biking).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────
  // 2. SISTEMA DE REPELENTES
  // ─────────────────────────────────────────────────────────────
  it('Uso de Repelente asigna pasos y bloquea encuentros de nivel inferior', () => {
    const repel = new RepelSystem();
    expect(repel.isActive).toBe(false);

    repel.useRepel('repel'); // 100 pasos
    expect(repel.isActive).toBe(true);
    expect(repel.currentSteps).toBe(100);

    // Debe bloquear salvajes de nivel <= líder del equipo
    expect(repel.shouldBlockEncounter(5, 12)).toBe(true);
    expect(repel.shouldBlockEncounter(15, 12)).toBe(false);

    // Decremento de pasos
    for (let i = 0; i < 99; i++) {
      expect(repel.step()).toBe(true);
    }
    expect(repel.currentSteps).toBe(1);

    // Último paso -> expira
    expect(repel.step()).toBe(false);
    expect(repel.isActive).toBe(false);
  });

  it('Superrepelente y Máx. Repelente asignan 200 y 250 pasos', () => {
    const repel = new RepelSystem();
    repel.useRepel('super_repel');
    expect(repel.currentSteps).toBe(200);

    repel.useRepel('max_repel');
    expect(repel.currentSteps).toBe(250);
  });

  // ─────────────────────────────────────────────────────────────
  // 3. TABLAS DE PESCA
  // ─────────────────────────────────────────────────────────────
  it('Tablas de pesca por tipo de caña (Vieja, Buena, Supercaña)', () => {
    const oldRodTable = FishingManager.FISHING_TABLES.old_rod;
    expect(oldRodTable.some(e => e.name === 'Magikarp')).toBe(true);

    const goodRodTable = FishingManager.FISHING_TABLES.good_rod;
    expect(goodRodTable.some(e => e.name === 'Poliwag')).toBe(true);

    const superRodTable = FishingManager.FISHING_TABLES.super_rod;
    expect(superRodTable.some(e => e.name === 'Gyarados')).toBe(true);
    expect(superRodTable.some(e => e.name === 'Feebas')).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────
  // 4. OBSTÁCULOS DE CAMPO (CORTE, GOLPE ROCA, FUERZA)
  // ─────────────────────────────────────────────────────────────
  it('Eliminación y detección de obstáculos de campo', () => {
    const fakeScene: any = {
      add: {
        container: () => ({ setDepth: () => {}, add: () => {}, destroy: () => {} }),
        graphics: () => ({
          fillStyle: () => {},
          fillRect: () => {},
          fillCircle: () => {},
          fillRoundedRect: () => {},
          lineStyle: () => {},
          lineBetween: () => {},
          strokeCircle: () => {}
        })
      },
      tweens: {
        add: (config: any) => { config.onComplete?.(); }
      }
    };
    const obstacles = new FieldObstacleManager(fakeScene, {} as any);

    obstacles.spawnObstacles([
      { id: 'tree_1', x: 100, y: 100, type: 'cut_tree' },
      { id: 'rock_1', x: 200, y: 200, type: 'rock_smash' },
      { id: 'boulder_1', x: 300, y: 300, type: 'strength_boulder' }
    ]);

    expect(obstacles.isObstacleAt(100, 100)).toBe(true);
    expect(obstacles.isObstacleAt(500, 500)).toBe(false);

    obstacles.removeObstacle('tree_1');
    expect(obstacles.isObstacleAt(100, 100)).toBe(false);
  });
});
