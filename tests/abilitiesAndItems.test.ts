import { describe, it, expect, beforeEach } from './testRunner';
import { BattleManager, BattlePokemon, BattleMove } from '../src/core/battle/battleManager';

describe('Opción A — Abilities & Held Items Combat Tests', () => {
  let player: BattlePokemon;
  let opponent: BattlePokemon;
  let tackle: BattleMove;
  let earthquake: BattleMove;
  let quickAttack: BattleMove;

  beforeEach(() => {
    tackle = { id: 'tackle', name: 'Placaje', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 35 };
    earthquake = { id: 'earthquake', name: 'Terremoto', type: 'ground', category: 'physical', power: 100, accuracy: 100, pp: 10 };
    quickAttack = { id: 'quick_attack', name: 'Ataque Rápido', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 30, priority: 1 };

    player = {
      id: 1, name: 'Lucario', types: ['fighting', 'steel'], level: 50,
      currentHp: 150, maxHp: 150, attack: 130, defense: 90, speed: 120,
      moves: [tackle, earthquake, quickAttack]
    };

    opponent = {
      id: 2, name: 'Garchomp', types: ['dragon', 'ground'], level: 50,
      currentHp: 180, maxHp: 180, attack: 150, defense: 110, speed: 110,
      moves: [earthquake, tackle]
    };
  });

  // ─────────────────────────────────────────────────────────────
  // 1. HABILIDADES DE ENTRADA (SWITCH-IN)
  // ─────────────────────────────────────────────────────────────
  it('Intimidación reduce el Ataque del rival al entrar', () => {
    player.ability = 'intimidate';
    const battle = new BattleManager(player, opponent);
    const steps: any[] = [];

    const atkBefore = opponent.attack;
    battle.triggerSwitchInAbilities('player', steps);
    expect(opponent.attack).toBeLessThan(atkBefore);
    expect(steps.some(s => s.type === 'ABILITY_TRIGGER' && s.message.includes('Intimidación'))).toBe(true);
  });

  it('Habilidades de Clima alteran el entorno al entrar (Llovizna, Sequía)', () => {
    player.ability = 'drizzle';
    const battle = new BattleManager(player, opponent);
    const steps: any[] = [];

    battle.triggerSwitchInAbilities('player', steps);
    expect(battle.weather).toBe('RAIN');

    opponent.ability = 'drought';
    battle.triggerSwitchInAbilities('opponent', steps);
    expect(battle.weather).toBe('HARSH_SUN');
  });

  // ─────────────────────────────────────────────────────────────
  // 2. INMUNIDADES Y MODIFICADORES DE HABILIDAD (LEVITACIÓN, EXPERTO, DISFRAZ, ROBUSTEZ)
  // ─────────────────────────────────────────────────────────────
  it('Levitación otorga inmunidad total a movimientos de tipo Tierra', () => {
    opponent.ability = 'levitate';
    const battle = new BattleManager(player, opponent);
    const res = battle.calculateDamage(player, opponent, earthquake);

    expect(res.damage).toBe(0);
    expect(res.effectiveness).toBe(0);
    expect(res.effectivenessText).toBe('immune');
  });

  it('Experto (Technician) potencia movimientos con poder base <= 60 en un 50%', () => {
    const battle = new BattleManager(player, opponent);
    const resNormal = battle.calculateDamage(player, opponent, tackle, { forceRandom: 1.0, forceCritical: false });

    player.ability = 'technician';
    const resTechnician = battle.calculateDamage(player, opponent, tackle, { forceRandom: 1.0, forceCritical: false });

    expect(resTechnician.damage).toBeGreaterThan(resNormal.damage);
  });

  it('Disfraz (Disguise) anula el daño del primer ataque y se rompe', () => {
    opponent.ability = 'disguise';
    opponent.disguiseBroken = false;
    const battle = new BattleManager(player, opponent);

    const turn = battle.executeTurn(0, 0);
    expect(turn.opponentHp).toBe(opponent.maxHp); // No recibe daño
    expect(opponent.disguiseBroken).toBe(true);
    expect(turn.steps.some(s => s.type === 'ABILITY_TRIGGER' && s.message.includes('Disfraz'))).toBe(true);
  });

  it('Robustez (Sturdy) permite sobrevivir a un golpe letal desde 100% de PS con 1 PS', () => {
    opponent.ability = 'sturdy';
    opponent.currentHp = opponent.maxHp;
    player.attack = 999; // Daño abrumador
    const battle = new BattleManager(player, opponent);

    const turn = battle.executeTurn(1, 0); // Terremoto OHKO
    expect(turn.opponentHp).toBe(1);
    expect(turn.isBattleOver).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────
  // 3. OBJETOS EQUIPABLES EN COMBATE (HELD ITEMS)
  // ─────────────────────────────────────────────────────────────
  it('Vidasfera (Life Orb) aumenta el daño en +30% e inflige 10% de daño de retroceso al atacante', () => {
    const battle = new BattleManager(player, opponent);
    const resBase = battle.calculateDamage(player, opponent, tackle, { forceRandom: 1.0 });

    player.heldItem = 'life_orb';
    const resLifeOrb = battle.calculateDamage(player, opponent, tackle, { forceRandom: 1.0 });
    expect(resLifeOrb.damage).toBeGreaterThan(resBase.damage);

    // Retroceso
    const hpBefore = player.currentHp;
    battle.executeTurn(0, 0);
    expect(player.currentHp).toBeLessThan(hpBefore);
  });

  it('Banda Focus (Focus Sash) resiste un golpe letal desde 100% PS y se consume', () => {
    opponent.heldItem = 'focus_sash';
    opponent.currentHp = opponent.maxHp;
    player.attack = 999;
    const battle = new BattleManager(player, opponent);

    const turn = battle.executeTurn(1, 0);
    expect(turn.opponentHp).toBe(1);
    expect(opponent.hasConsumedHeldItem).toBe(true);
  });

  it('Casco Dentado (Rocky Helmet) inflige 1/6 de daño al atacante físico', () => {
    opponent.heldItem = 'rocky_helmet';
    const battle = new BattleManager(player, opponent);
    const hpBefore = player.currentHp;

    const turn = battle.executeTurn(0, 0); // Placaje físico
    expect(turn.steps.some(s => s.type === 'HELD_ITEM_TRIGGER' && s.message.includes('Casco Dentado'))).toBe(true);
    expect(player.currentHp).toBeLessThan(hpBefore);
  });

  it('Baya Zidra (Sitrus Berry) restaura 25% de PS al bajar del 50% de vida', () => {
    opponent.heldItem = 'sitrus_berry';
    opponent.currentHp = 100; // Recibirá daño que lo deje por debajo de 90 PS (50% de 180)
    player.attack = 180;
    const battle = new BattleManager(player, opponent);

    const turn = battle.executeTurn(0, 0);
    expect(turn.steps.some(s => s.type === 'HEAL' && s.message.includes('Baya Zidra'))).toBe(true);
    expect(opponent.hasConsumedHeldItem).toBe(true);
  });

  it('Restos (Leftovers) restaura 1/16 de PS al final del turno', () => {
    player.heldItem = 'leftovers';
    player.currentHp = 100; // Max 150
    const battle = new BattleManager(player, opponent);

    const turn = battle.executeTurn(0, 0);
    expect(turn.steps.some(s => s.type === 'HELD_ITEM_TRIGGER' && s.message.includes('Restos'))).toBe(true);
  });
});
