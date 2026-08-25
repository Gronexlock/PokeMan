import { PokemonInstance, MoveData, PokemonType } from './types';

export interface DamageDetails {
  damage: number;
  is_status: boolean;
  is_critical: boolean;
  type_effectiveness: number;
  stab: number;
  move_name: string;
  display_name: string;
  effectiveness_text: 'super_effective' | 'not_very_effective' | 'immune' | 'normal' | 'status';
}

export class DamageCalculator {
  private typesData: Record<string, any> = {};

  constructor(typesData: Record<string, any> = {}) {
    this.typesData = typesData;
  }

  public setTypesData(typesData: Record<string, any>) {
    this.typesData = typesData;
  }

  public getTypeEffectiveness(moveType: PokemonType, defenderTypes: PokemonType[]): number {
    const mType = moveType.toLowerCase();
    const typeInfo = this.typesData[mType];
    if (!typeInfo) return 1.0;

    let multiplier = 1.0;
    for (const defType of defenderTypes) {
      const dType = defType.toLowerCase();
      if (typeInfo.no_damage_to && typeInfo.no_damage_to.includes(dType)) {
        return 0.0;
      }
      if (typeInfo.double_damage_to && typeInfo.double_damage_to.includes(dType)) {
        multiplier *= 2.0;
      }
      if (typeInfo.half_damage_to && typeInfo.half_damage_to.includes(dType)) {
        multiplier *= 0.5;
      }
    }
    return multiplier;
  }

  public getStabMultiplier(moveType: PokemonType, attackerTypes: PokemonType[], ability?: string): number {
    const matches = attackerTypes.some(t => t.toLowerCase() === moveType.toLowerCase());
    if (matches) {
      if (ability && ability.toLowerCase() === 'adaptability') {
        return 2.0;
      }
      return 1.5;
    }
    return 1.0;
  }

  public calculateDamage(
    attacker: PokemonInstance,
    defender: PokemonInstance,
    move: MoveData,
    weather: string = 'clear',
    forceCritical?: boolean,
    forceRandomFactor?: number
  ): DamageDetails {
    const moveName = move.display_name || move.name;
    const category = move.damage_class || move.category || 'physical';

    if (category === 'status' || move.power === null || move.power === 0) {
      return {
        damage: 0,
        is_status: true,
        is_critical: false,
        type_effectiveness: 1.0,
        stab: 1.0,
        move_name: move.name,
        display_name: moveName,
        effectiveness_text: 'status'
      };
    }

    const level = attacker.level;
    const power = move.power;
    const moveType = move.type.toLowerCase() as PokemonType;

    // Estadísticas de ataque y defensa considerando stat stages
    let atkStat = 50;
    let defStat = 50;

    const getStagedStat = (baseVal: number, stage: number = 0) => {
      if (stage > 0) return baseVal * ((2 + stage) / 2);
      if (stage < 0) return baseVal * (2 / (2 - stage));
      return baseVal;
    };

    if (category === 'physical') {
      const stageAtk = attacker.stat_stages?.attack || 0;
      const stageDef = defender.stat_stages?.defense || 0;
      atkStat = getStagedStat(attacker.stats.attack, stageAtk);
      defStat = getStagedStat(defender.stats.defense, stageDef);
    } else {
      const stageSpAtk = attacker.stat_stages?.special_attack || 0;
      const stageSpDef = defender.stat_stages?.special_defense || 0;
      atkStat = getStagedStat(attacker.stats.special_attack, stageSpAtk);
      defStat = getStagedStat(defender.stats.special_defense, stageSpDef);
    }

    defStat = Math.max(1, defStat);

    // 1. Daño Base
    const baseDamage = (((2 * level / 5 + 2) * power * (atkStat / defStat)) / 50) + 2;

    // 2. Modificadores
    const typeEff = this.getTypeEffectiveness(moveType, defender.types);
    if (typeEff === 0) {
      return {
        damage: 0,
        is_status: false,
        is_critical: false,
        type_effectiveness: 0.0,
        stab: 1.0,
        move_name: move.name,
        display_name: moveName,
        effectiveness_text: 'immune'
      };
    }

    const stab = this.getStabMultiplier(moveType, attacker.types, attacker.ability);

    // Crítico (1/16 = 6.25%)
    const isCritical = forceCritical !== undefined ? forceCritical : (Math.random() < 0.0625);
    const critMod = isCritical ? 1.5 : 1.0;

    // Factor aleatorio (0.85 - 1.00)
    const randMod = forceRandomFactor !== undefined ? forceRandomFactor : (0.85 + Math.random() * 0.15);

    // Clima
    let weatherMod = 1.0;
    if (weather === 'rain') {
      if (moveType === 'water') weatherMod = 1.5;
      else if (moveType === 'fire') weatherMod = 0.5;
    } else if (weather === 'sun') {
      if (moveType === 'fire') weatherMod = 1.5;
      else if (moveType === 'water') weatherMod = 0.5;
    }

    // Quemadura en ataques físicos
    let burnMod = 1.0;
    if (attacker.status === 'burn' && category === 'physical') {
      burnMod = 0.5;
    }

    const totalDamage = Math.max(1, Math.floor(baseDamage * weatherMod * critMod * randMod * stab * typeEff * burnMod));

    let effText: 'super_effective' | 'not_very_effective' | 'immune' | 'normal' = 'normal';
    if (typeEff > 1.0) effText = 'super_effective';
    else if (typeEff < 1.0) effText = 'not_very_effective';

    return {
      damage: totalDamage,
      is_status: false,
      is_critical: isCritical,
      type_effectiveness: typeEff,
      stab,
      move_name: move.name,
      display_name: moveName,
      effectiveness_text: effText
    };
  }
}
