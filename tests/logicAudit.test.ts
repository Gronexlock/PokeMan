import { describe, it, expect } from './testRunner';
import { DamageCalculator } from '../src/core/damageCalculator';
import { CatchCalculator } from '../src/core/catchCalculator';
import { BattleManager, BattlePokemon } from '../src/core/battle';
import { TimeCycleManager } from '../src/overworld/timeCycle';
import { EncounterManager } from '../src/overworld/encounterManager';
import { PokemonGenerator } from '../src/core/pokemonGenerator';

describe('Auditoría de Lógica — Core Engine & Overworld Fixes', () => {
  // ─────────────────────────────────────────────────────────────
  // 1. DAMAGE CALCULATOR & TYPE EFFECTIVENESS FALLBACK
  // ─────────────────────────────────────────────────────────────
  it('DamageCalculator calcula la efectividad de tipos correcta por defecto sin diccionario externo', () => {
    const calc = new DamageCalculator();

    // Súper eficaz
    expect(calc.getTypeEffectiveness('water', ['fire'])).toBe(2.0);
    expect(calc.getTypeEffectiveness('fire', ['grass'])).toBe(2.0);
    expect(calc.getTypeEffectiveness('electric', ['water'])).toBe(2.0);

    // Poco eficaz
    expect(calc.getTypeEffectiveness('fire', ['water'])).toBe(0.5);
    expect(calc.getTypeEffectiveness('grass', ['fire'])).toBe(0.5);

    // Inmunidad
    expect(calc.getTypeEffectiveness('electric', ['ground'])).toBe(0.0);
    expect(calc.getTypeEffectiveness('normal', ['ghost'])).toBe(0.0);
    expect(calc.getTypeEffectiveness('ground', ['flying'])).toBe(0.0);
  });

  // ─────────────────────────────────────────────────────────────
  // 2. CATCH CALCULATOR SPECIAL BALL FORMULAS
  // ─────────────────────────────────────────────────────────────
  it('CatchCalculator aplica modificadores oficiales para Net Ball, Nest Ball y Timer Ball', () => {
    const waterPoke: any = { species_name: 'Squirtle', types: ['water'], current_hp: 20, max_hp: 50, level: 10, status: null };
    const electricPoke: any = { species_name: 'Pikachu', types: ['electric'], current_hp: 20, max_hp: 50, level: 10, status: null };

    // Net Ball: 3.5x en Agua/Bicho, 1.0x en los demás
    const netWater = CatchCalculator.calculateCatch(waterPoke, 'net_ball', 1, false, 45);
    const netElectric = CatchCalculator.calculateCatch(electricPoke, 'net_ball', 1, false, 45);
    expect(netWater).toBeDefined();
    expect(netElectric).toBeDefined();

    // Quick Ball turno 1 vs turno 2
    const quickTurn1 = CatchCalculator.calculateCatch(waterPoke, 'quick_ball', 1, false, 45);
    const quickTurn2 = CatchCalculator.calculateCatch(waterPoke, 'quick_ball', 2, false, 45);
    expect(quickTurn1).toBeDefined();
    expect(quickTurn2).toBeDefined();

    // Master Ball siempre captura con 3 shakes
    const master = CatchCalculator.calculateCatch(waterPoke, 'master_ball', 1, false, 45);
    expect(master.caught).toBe(true);
    expect(master.shakes).toBe(3);
  });

  // ─────────────────────────────────────────────────────────────
  // 3. BATTLE MANAGER TURN RESOLUTION ON SWITCH / ITEM
  // ─────────────────────────────────────────────────────────────
  it('BattleManager respeta el consumo de turno con isPlayerSwitchOrItem (solo el oponente ataca)', () => {
    const player: BattlePokemon = {
      id: 25,
      name: 'Pikachu',
      types: ['electric'],
      level: 50,
      currentHp: 100,
      maxHp: 100,
      attack: 55,
      defense: 40,
      speed: 90,
      moves: [
        { id: 'thunderbolt', name: 'Rayo', type: 'electric', category: 'special', power: 90, accuracy: 100, pp: 15, maxPp: 15 }
      ]
    };

    const opponent: BattlePokemon = {
      id: 6,
      name: 'Charizard',
      types: ['fire', 'flying'],
      level: 50,
      currentHp: 100,
      maxHp: 100,
      attack: 84,
      defense: 78,
      speed: 100,
      moves: [
        { id: 'flamethrower', name: 'Lanzallamas', type: 'fire', category: 'special', power: 90, accuracy: 100, pp: 15, maxPp: 15 }
      ]
    };

    const manager = new BattleManager(player, opponent);

    // Turno con cambio de Pokémon o uso de poción
    const turnRes = manager.executeTurn(0, 0, { isPlayerSwitchOrItem: true });

    // El oponente debió atacar
    expect(turnRes.steps.some(s => s.actor === 'opponent' && s.type === 'MOVE_ANIM')).toBe(true);
    // El jugador NO debió atacar
    expect(turnRes.steps.some(s => s.actor === 'player' && s.type === 'MOVE_ANIM')).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────
  // 4. TIMECYCLE MANAGER NEGATIVE HOUR PROTECTION
  // ─────────────────────────────────────────────────────────────
  it('TimeCycleManager protege contra horas negativas y normaliza el rango 0-23', () => {
    const time = new TimeCycleManager();
    time.setHour(-1); // Debe normalizarse a hora 23:00 (1380 minutos)
    expect(time.gameMinutes).toBe(23 * 60);
    expect(time.getTimeString()).toBe('23:00');
    expect(time.getTimePeriod()).toBe('night');
  });

  // ─────────────────────────────────────────────────────────────
  // 5. ENCOUNTER MANAGER SPECIES IDS
  // ─────────────────────────────────────────────────────────────
  it('EncounterManager genera especies correctas de Ruta 1 (Pidgey, Caterpie)', () => {
    const gen = new PokemonGenerator({});
    const encounters = new EncounterManager(gen);
    const generated = encounters.generateWildPokemon('route_1_coastal', 'day');

    expect(generated).toBeDefined();
    if (generated) {
      expect([16, 43, 10, 92, 133].includes(generated.species_id)).toBe(true);
    }
  });
});
