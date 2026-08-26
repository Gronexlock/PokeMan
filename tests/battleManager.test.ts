import { describe, it, expect, beforeEach } from './testRunner';
import { BattleManager, BattlePokemon, BattleMove, TYPE_CHART } from '../src/core/battle/battleManager';
import { PokemonType } from '../src/core/types';

describe('6.2 — BattleManager Unit Tests (Combate Gen 9)', () => {
  let charizard: BattlePokemon;
  let blastoise: BattlePokemon;
  let venusaur: BattlePokemon;
  let gengar: BattlePokemon;
  let snorlax: BattlePokemon;

  const flamethrower: BattleMove = {
    id: 'flamethrower',
    name: 'Lanzallamas',
    type: 'fire',
    category: 'special',
    power: 90,
    accuracy: 100,
    pp: 15,
    maxPp: 15,
    priority: 0
  };

  const surf: BattleMove = {
    id: 'surf',
    name: 'Surf',
    type: 'water',
    category: 'special',
    power: 90,
    accuracy: 100,
    pp: 15,
    maxPp: 15,
    priority: 0
  };

  const solarBeam: BattleMove = {
    id: 'solar_beam',
    name: 'Rayo Solar',
    type: 'grass',
    category: 'special',
    power: 120,
    accuracy: 100,
    pp: 10,
    maxPp: 10,
    priority: 0
  };

  const quickAttack: BattleMove = {
    id: 'quick_attack',
    name: 'Ataque Rápido',
    type: 'normal',
    category: 'physical',
    power: 40,
    accuracy: 100,
    pp: 30,
    maxPp: 30,
    priority: 1
  };

  const tackle: BattleMove = {
    id: 'tackle',
    name: 'Placaje',
    type: 'normal',
    category: 'physical',
    power: 40,
    accuracy: 100,
    pp: 35,
    maxPp: 35,
    priority: 0
  };

  const shadowBall: BattleMove = {
    id: 'shadow_ball',
    name: 'Bola Sombra',
    type: 'ghost',
    category: 'special',
    power: 80,
    accuracy: 100,
    pp: 15,
    maxPp: 15,
    priority: 0
  };

  const thunderbolt: BattleMove = {
    id: 'thunderbolt',
    name: 'Rayo',
    type: 'electric',
    category: 'special',
    power: 90,
    accuracy: 100,
    pp: 15,
    maxPp: 15,
    priority: 0
  };

  const earthquake: BattleMove = {
    id: 'earthquake',
    name: 'Terremoto',
    type: 'ground',
    category: 'physical',
    power: 100,
    accuracy: 100,
    pp: 10,
    maxPp: 10,
    priority: 0
  };

  const growl: BattleMove = {
    id: 'growl',
    name: 'Gruñido',
    type: 'normal',
    category: 'status',
    power: 0,
    accuracy: 100,
    pp: 40,
    maxPp: 40,
    priority: 0
  };

  beforeEach(() => {
    charizard = {
      id: 6,
      name: 'Charizard',
      types: ['fire', 'flying'],
      level: 50,
      currentHp: 150,
      maxHp: 150,
      attack: 100,
      defense: 90,
      spAttack: 130,
      spDefense: 95,
      speed: 120,
      moves: [flamethrower, solarBeam, quickAttack, growl]
    };

    blastoise = {
      id: 9,
      name: 'Blastoise',
      types: ['water'],
      level: 50,
      currentHp: 160,
      maxHp: 160,
      attack: 95,
      defense: 120,
      spAttack: 100,
      spDefense: 125,
      speed: 85,
      moves: [surf, tackle]
    };

    venusaur = {
      id: 3,
      name: 'Venusaur',
      types: ['grass', 'poison'],
      level: 50,
      currentHp: 155,
      maxHp: 155,
      attack: 90,
      defense: 95,
      spAttack: 120,
      spDefense: 110,
      speed: 90,
      moves: [solarBeam, tackle]
    };

    gengar = {
      id: 94,
      name: 'Gengar',
      types: ['ghost', 'poison'],
      level: 50,
      currentHp: 130,
      maxHp: 130,
      attack: 75,
      defense: 70,
      spAttack: 145,
      spDefense: 85,
      speed: 130,
      moves: [shadowBall, thunderbolt]
    };

    snorlax = {
      id: 143,
      name: 'Snorlax',
      types: ['normal'],
      level: 50,
      currentHp: 220,
      maxHp: 220,
      attack: 125,
      defense: 80,
      spAttack: 70,
      spDefense: 125,
      speed: 40,
      moves: [tackle, earthquake]
    };
  });

  // ─────────────────────────────────────────────────────────────
  // 1. TABLA DE EFECTIVIDAD DE 18 TIPOS
  // ─────────────────────────────────────────────────────────────
  it('Efectividad de tipos: súper eficaz (2x)', () => {
    const battle = new BattleManager(charizard, venusaur);
    const effFireOnGrass = battle.getTypeEffectiveness('fire', ['grass']);
    expect(effFireOnGrass).toBe(2);

    const effWaterOnFire = battle.getTypeEffectiveness('water', ['fire']);
    expect(effWaterOnFire).toBe(2);

    const effElectricOnWater = battle.getTypeEffectiveness('electric', ['water']);
    expect(effElectricOnWater).toBe(2);
  });

  it('Efectividad de tipos: poco eficaz (0.5x)', () => {
    const battle = new BattleManager(charizard, blastoise);
    const effFireOnWater = battle.getTypeEffectiveness('fire', ['water']);
    expect(effFireOnWater).toBe(0.5);

    const effGrassOnFire = battle.getTypeEffectiveness('grass', ['fire']);
    expect(effGrassOnFire).toBe(0.5);
  });

  it('Efectividad de tipos: inmunidades (0x)', () => {
    const battle = new BattleManager(snorlax, gengar);
    // Normal contra Fantasma = 0
    expect(battle.getTypeEffectiveness('normal', ['ghost'])).toBe(0);
    // Fantasma contra Normal = 0
    expect(battle.getTypeEffectiveness('ghost', ['normal'])).toBe(0);
    // Eléctrico contra Tierra = 0
    expect(battle.getTypeEffectiveness('electric', ['ground'])).toBe(0);
    // Tierra contra Volador = 0
    expect(battle.getTypeEffectiveness('ground', ['flying'])).toBe(0);
    // Psíquico contra Siniestro = 0
    expect(battle.getTypeEffectiveness('psychic', ['dark'])).toBe(0);
    // Dragón contra Hada = 0
    expect(battle.getTypeEffectiveness('dragon', ['fairy'])).toBe(0);
    // Veneno contra Acero = 0
    expect(battle.getTypeEffectiveness('poison', ['steel'])).toBe(0);
  });

  it('Efectividad combinada en tipos duales (4x y 0x)', () => {
    const battle = new BattleManager(blastoise, charizard);
    // Agua contra Fuego/Volador: Agua vs Fuego (2x) * Agua vs Volador (1x) = 2x
    expect(battle.getTypeEffectiveness('water', ['fire', 'flying'])).toBe(2);

    // Eléctrico contra Agua/Tierra: Eléctrico vs Agua (2x) * Eléctrico vs Tierra (0x) = 0x
    expect(battle.getTypeEffectiveness('electric', ['water', 'ground'])).toBe(0);

    // Planta contra Agua/Tierra (Swampert): Planta vs Agua (2x) * Planta vs Tierra (2x) = 4x
    expect(battle.getTypeEffectiveness('grass', ['water', 'ground'])).toBe(4);
  });

  // ─────────────────────────────────────────────────────────────
  // 2. FÓRMULA DE DAÑO GEN 9 (STAB, CRÍTICOS, CLIMAS)
  // ─────────────────────────────────────────────────────────────
  it('Cálculo de daño: STAB multiplica por 1.5x', () => {
    const battle = new BattleManager(charizard, snorlax);

    // Charizard usando Lanzallamas (Fuego con STAB porque Charizard es Fuego/Volador)
    const withStab = battle.calculateDamage(charizard, snorlax, flamethrower, {
      forceCritical: false,
      forceRandom: 1.0
    });

    // Crear un atacante idéntico pero sin tipo Fuego
    const nonStabAttacker: BattlePokemon = { ...charizard, types: ['normal'] };
    const withoutStab = battle.calculateDamage(nonStabAttacker, snorlax, flamethrower, {
      forceCritical: false,
      forceRandom: 1.0
    });

    expect(withStab.damage).toBeGreaterThan(withoutStab.damage);
    // Daño con STAB debe ser ~1.5x del daño sin STAB
    const ratio = withStab.damage / withoutStab.damage;
    expect(ratio).toBeGreaterThanOrEqual(1.45);
    expect(ratio).toBeLessThanOrEqual(1.55);
  });

  it('Cálculo de daño: Golpe crítico multiplica por 1.5x', () => {
    const battle = new BattleManager(charizard, snorlax);

    const normalHit = battle.calculateDamage(charizard, snorlax, flamethrower, {
      forceCritical: false,
      forceRandom: 1.0
    });

    const critHit = battle.calculateDamage(charizard, snorlax, flamethrower, {
      forceCritical: true,
      forceRandom: 1.0
    });

    expect(critHit.isCritical).toBe(true);
    const critRatio = critHit.damage / normalHit.damage;
    expect(critRatio).toBeGreaterThanOrEqual(1.45);
    expect(critRatio).toBeLessThanOrEqual(1.55);
  });

  it('Cálculo de daño: Clima Lluvia (RAIN) potencia Agua (+50%) y debilita Fuego (-50%)', () => {
    const clearBattle = new BattleManager(blastoise, snorlax, { weather: 'CLEAR' });
    const rainBattle = new BattleManager(blastoise, snorlax, { weather: 'RAIN' });

    // Surf en Despejado vs Lluvia
    const surfClear = clearBattle.calculateDamage(blastoise, snorlax, surf, { forceCritical: false, forceRandom: 1.0 });
    const surfRain = rainBattle.calculateDamage(blastoise, snorlax, surf, { forceCritical: false, forceRandom: 1.0 });
    expect(surfRain.damage).toBe(Math.floor(surfClear.damage * 1.5));

    // Lanzallamas en Despejado vs Lluvia
    const flameClear = clearBattle.calculateDamage(charizard, snorlax, flamethrower, { forceCritical: false, forceRandom: 1.0 });
    const flameRain = rainBattle.calculateDamage(charizard, snorlax, flamethrower, { forceCritical: false, forceRandom: 1.0 });
    expect(flameRain.damage).toBe(Math.floor(flameClear.damage * 0.5));
  });

  it('Cálculo de daño: Clima Sol Abrasador (HARSH_SUN) potencia Fuego (+50%) y debilita Agua (-50%)', () => {
    const clearBattle = new BattleManager(charizard, snorlax, { weather: 'CLEAR' });
    const sunBattle = new BattleManager(charizard, snorlax, { weather: 'HARSH_SUN' });

    const flameClear = clearBattle.calculateDamage(charizard, snorlax, flamethrower, { forceCritical: false, forceRandom: 1.0 });
    const flameSun = sunBattle.calculateDamage(charizard, snorlax, flamethrower, { forceCritical: false, forceRandom: 1.0 });
    expect(flameSun.damage).toBe(Math.floor(flameClear.damage * 1.5));

    const surfClear = clearBattle.calculateDamage(blastoise, snorlax, surf, { forceCritical: false, forceRandom: 1.0 });
    const surfSun = sunBattle.calculateDamage(blastoise, snorlax, surf, { forceCritical: false, forceRandom: 1.0 });
    expect(surfSun.damage).toBe(Math.floor(surfClear.damage * 0.5));
  });

  it('Cálculo de daño: Movimientos de estado (status) producen 0 de daño', () => {
    const battle = new BattleManager(charizard, blastoise);
    const growlResult = battle.calculateDamage(charizard, blastoise, growl);
    expect(growlResult.damage).toBe(0);
    expect(growlResult.isHit).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────
  // 3. RESOLUCIÓN DE TURNOS, PRIORIDAD Y VELOCIDAD
  // ─────────────────────────────────────────────────────────────
  it('Resolución de turnos: Prioridad de movimiento supera a la velocidad', () => {
    // Snorlax (Speed 40) usa Ataque Rápido (Priority +1)
    // Gengar (Speed 130) usa Bola Sombra (Priority 0)
    snorlax.moves = [quickAttack];
    gengar.moves = [shadowBall];

    const battle = new BattleManager(snorlax, gengar);
    const result = battle.executeTurn(0, 0);

    // El primer paso USE_MOVE debe ser de Snorlax por tener prioridad +1
    const moveSteps = result.steps.filter(s => s.type === 'USE_MOVE');
    expect(moveSteps.length).toBeGreaterThanOrEqual(1);
    expect(moveSteps[0].actor).toBe('player');
    expect(moveSteps[0].move?.id).toBe('quick_attack');
  });

  it('Resolución de turnos: Mayor velocidad ataca primero con igual prioridad', () => {
    // Charizard (Speed 120) vs Blastoise (Speed 85), ambos usan moves de prioridad 0
    const battle = new BattleManager(charizard, blastoise);
    const result = battle.executeTurn(0, 0); // Lanzallamas vs Surf

    const moveSteps = result.steps.filter(s => s.type === 'USE_MOVE');
    expect(moveSteps[0].actor).toBe('player'); // Charizard ataca primero
  });

  it('Resolución de turnos: Si el primer ataque debilita al oponente, el segundo no ataca', () => {
    // Venusaur con 1 HP frente a Charizard
    venusaur.currentHp = 1;
    const battle = new BattleManager(charizard, venusaur);

    const result = battle.executeTurn(0, 0); // Lanzallamas OHKO

    expect(result.isBattleOver).toBe(true);
    expect(result.winner).toBe('player');
    expect(result.opponentHp).toBe(0);

    // Solo debe existir 1 USE_MOVE en steps (Charizard), Venusaur se debilitó
    const moveSteps = result.steps.filter(s => s.type === 'USE_MOVE');
    expect(moveSteps.length).toBe(1);
    expect(moveSteps[0].actor).toBe('player');

    // Debe contener eventos FAINT y BATTLE_END
    const faintStep = result.steps.find(s => s.type === 'FAINT');
    expect(faintStep).toBeDefined();
    const endStep = result.steps.find(s => s.type === 'BATTLE_END');
    expect(endStep).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────
  // 4. MEGA-EVOLUCIÓN
  // ─────────────────────────────────────────────────────────────
  it('Mega-Evolución: Aumenta +100 BST y emite evento MEGA_EVOLUTION', () => {
    const battle = new BattleManager(charizard, blastoise);

    const atkBefore = charizard.attack;
    const defBefore = charizard.defense;
    const spAtkBefore = charizard.spAttack!;
    const spDefBefore = charizard.spDefense!;
    const spdBefore = charizard.speed;

    const result = battle.executeTurn(0, 0, { playerMega: true });

    expect(battle.player.isMega).toBe(true);
    expect(battle.player.name).toBe('Mega-Charizard');
    expect(battle.playerMegaUsed).toBe(true);

    // Verificar aumentos exactos (+30 Atk, +20 Def, +30 SpAtk, +20 SpDef, +10 Spd = +110 BST)
    expect(battle.player.attack).toBe(atkBefore + 30);
    expect(battle.player.defense).toBe(defBefore + 20);
    expect(battle.player.spAttack).toBe(spAtkBefore + 30);
    expect(battle.player.spDefense).toBe(spDefBefore + 20);
    expect(battle.player.speed).toBe(spdBefore + 10);

    const megaStep = result.steps.find(s => s.type === 'MEGA_EVOLUTION');
    expect(megaStep).toBeDefined();
    expect(megaStep?.actor).toBe('player');
  });
});
