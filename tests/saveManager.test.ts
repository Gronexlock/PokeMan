import { describe, it, expect, beforeEach } from './testRunner';
import { SaveManager } from '../src/core/saveManager';
import { SaveData, PokemonInstance } from '../src/core/types';
import { BattlePokemon } from '../src/core/battle/battleManager';

// Polyfill de localStorage en memoria para entorno de testing
class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage) {
  (globalThis as any).localStorage = new MockLocalStorage();
}

describe('6.3 — SaveManager & PC Storage Unit Tests (Persistencia)', () => {
  let saveManager: SaveManager;
  let mockParty: PokemonInstance[];
  let sampleSave: SaveData;

  beforeEach(() => {
    (globalThis.localStorage as any).clear?.();
    saveManager = new SaveManager();

    mockParty = [
      {
        id: 25,
        species: 'pikachu',
        nickname: 'Sparky',
        level: 25,
        current_hp: 60,
        max_hp: 60,
        stats: { hp: 60, attack: 55, defense: 40, sp_attack: 50, sp_defense: 50, speed: 90 },
        moves: [
          { id: 'thunderbolt', name: 'Rayo', type: 'electric', category: 'special', power: 90, accuracy: 100, pp: 15, max_pp: 15 },
          { id: 'quick_attack', name: 'Ataque Rápido', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 30, max_pp: 30 }
        ],
        types: ['electric']
      }
    ];

    sampleSave = {
      player_name: 'Aria',
      player_gender: 'female_dark',
      money: 3500,
      badges: ['cumbre_badge'],
      current_map: 'pueblo_altiplano',
      player_position: { x: 120, y: 340 },
      party: mockParty,
      bag: {
        items: [
          { id: 'potion', name: 'Poción', quantity: 5, category: 'medicine' },
          { id: 'poke_ball', name: 'Poké Ball', quantity: 10, category: 'pokeballs' }
        ]
      },
      pokedex: {
        seen: [1, 4, 7, 25],
        caught: [25]
      },
      play_time: 3600
    };
  });

  // ─────────────────────────────────────────────────────────────
  // 1. GUARDADO Y CARGA EN SLOTS
  // ─────────────────────────────────────────────────────────────
  it('Guardar y cargar partida con metadatos de ranura', () => {
    const saved = saveManager.saveGame('save_slot_1', sampleSave);
    expect(saved).toBe(true);

    const loaded = saveManager.loadGame('save_slot_1');
    expect(loaded).toBeDefined();
    expect(loaded?.player_name).toBe('Aria');
    expect(loaded?.money).toBe(3500);
    expect(loaded?.badges).toHaveLength(1);
    expect(loaded?.badges[0]).toBe('cumbre_badge');
    expect(loaded?.party).toHaveLength(1);
    expect(loaded?.party[0].nickname).toBe('Sparky');
    expect(loaded?.slot).toBe('save_slot_1');
    expect(loaded?.timestamp).toBeDefined();
  });

  it('Cargar una ranura no existente devuelve null', () => {
    const loaded = saveManager.loadGame('save_slot_99');
    expect(loaded).toBeNull();
  });

  it('Eliminar una partida existente', () => {
    saveManager.saveGame('save_slot_2', sampleSave);
    expect(saveManager.loadGame('save_slot_2')).toBeDefined();

    const deleted = saveManager.deleteGame('save_slot_2');
    expect(deleted).toBe(true);
    expect(saveManager.loadGame('save_slot_2')).toBeNull();
  });

  it('listSlots devuelve el estado de las 3 ranuras estándar', () => {
    saveManager.saveGame('save_slot_1', sampleSave);

    const slots = saveManager.listSlots();
    expect(slots).toHaveLength(3);

    // Slot 1 existe
    expect(slots[0].slot).toBe('save_slot_1');
    expect(slots[0].exists).toBe(true);
    expect(slots[0].player_name).toBe('Aria');
    expect(slots[0].badges).toBe(1);

    // Slot 2 y 3 no existen
    expect(slots[1].slot).toBe('save_slot_2');
    expect(slots[1].exists).toBe(false);
    expect(slots[2].slot).toBe('save_slot_3');
    expect(slots[2].exists).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────
  // 2. EXPORTACIÓN E IMPORTACIÓN JSON
  // ─────────────────────────────────────────────────────────────
  it('Exportar partida a JSON formateado', () => {
    saveManager.saveGame('save_slot_1', sampleSave);
    const jsonString = saveManager.exportSaveJson('save_slot_1');

    expect(jsonString).toBeDefined();
    expect(typeof jsonString).toBe('string');
    const parsed = JSON.parse(jsonString!);
    expect(parsed.player_name).toBe('Aria');
    expect(parsed.money).toBe(3500);
  });

  it('Importar partida desde JSON válido', () => {
    const exportJson = JSON.stringify(sampleSave);
    const imported = saveManager.importSaveJson('save_slot_3', exportJson);
    expect(imported).toBe(true);

    const loaded = saveManager.loadGame('save_slot_3');
    expect(loaded?.player_name).toBe('Aria');
    expect(loaded?.party[0].id).toBe(25);
  });

  it('Rechazar importación de JSON corrupto o sin campos obligatorios', () => {
    const invalidJson = '{"invalido": true}';
    const imported = saveManager.importSaveJson('save_slot_1', invalidJson);
    expect(imported).toBe(false);

    const malformedJson = 'Esto no es un JSON';
    const importedMalformed = saveManager.importSaveJson('save_slot_1', malformedJson);
    expect(importedMalformed).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────
  // 3. INTEGRIDAD DE LAS 8 CAJAS DE ALMACENAMIENTO PC (240 SLOTS)
  // ─────────────────────────────────────────────────────────────
  it('Estructura de 8 cajas con 30 slots cada una (240 Pokémon de capacidad)', () => {
    const TOTAL_BOXES = 8;
    const BOX_CAPACITY = 30;

    // Generar 8 cajas vacías
    const boxes: (BattlePokemon | null)[][] = [];
    for (let i = 0; i < TOTAL_BOXES; i++) {
      boxes.push(new Array(BOX_CAPACITY).fill(null));
    }

    expect(boxes).toHaveLength(8);
    for (const box of boxes) {
      expect(box).toHaveLength(30);
    }

    // Depositar un Pokémon en Caja 1, Slot 0
    const depositedPokemon: BattlePokemon = {
      id: 130,
      name: 'Gyarados',
      types: ['water', 'flying'],
      level: 30,
      currentHp: 110,
      maxHp: 110,
      attack: 125,
      defense: 79,
      spAttack: 60,
      spDefense: 100,
      speed: 81,
      moves: [
        { id: 'waterfall', name: 'Cascada', type: 'water', category: 'physical', power: 80, accuracy: 100, pp: 15, maxPp: 15, priority: 0 }
      ],
      megaStone: 'Gyaradosite'
    };

    boxes[0][0] = depositedPokemon;

    // Serializar cajas en SaveData
    const extendedSave: SaveData = {
      ...sampleSave,
      pc_boxes: boxes as any
    };

    saveManager.saveGame('save_slot_1', extendedSave);
    const loaded = saveManager.loadGame('save_slot_1');

    expect(loaded?.pc_boxes).toBeDefined();
    const loadedBoxes = loaded?.pc_boxes as (BattlePokemon | null)[][];
    expect(loadedBoxes).toHaveLength(8);
    expect(loadedBoxes[0][0]?.name).toBe('Gyarados');
    expect(loadedBoxes[0][0]?.megaStone).toBe('Gyaradosite');
    expect(loadedBoxes[0][1]).toBeNull();
  });
});
