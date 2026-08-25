import { PokemonInstance, MoveSlot } from './types';
import { DamageCalculator } from './damageCalculator';

export type AITier = 'wild' | 'rookie' | 'gym_leader' | 'rival_boss' | 'champion';

export interface AIAction {
  action_type: 'FIGHT' | 'SWITCH' | 'MEGA_FIGHT';
  move_index?: number;
  switch_to_idx?: number;
  mega_evolve?: boolean;
}

export class BattleAI {
  private calc: DamageCalculator;

  constructor(damageCalc: DamageCalculator) {
    this.calc = damageCalc;
  }

  public chooseAction(
    aiPokemon: PokemonInstance,
    playerPokemon: PokemonInstance,
    tier: AITier = 'gym_leader',
    aiParty: PokemonInstance[] = [],
    canMegaEvolve: boolean = false
  ): AIAction {
    const availableMoves = aiPokemon.moves
      .map((m, idx) => ({ move: m, idx }))
      .filter(entry => entry.move.current_pp > 0);

    if (availableMoves.length === 0) {
      return { action_type: 'FIGHT', move_index: 0 };
    }

    // 1. Nivel Salvaje (Completamente aleatorio)
    if (tier === 'wild') {
      const choice = availableMoves[Math.floor(Math.random() * availableMoves.length)];
      return { action_type: 'FIGHT', move_index: choice.idx };
    }

    // 2. Nivel Novato (Prefiere movimientos ofensivos con daño)
    if (tier === 'rookie') {
      const damagingMoves = availableMoves.filter(m => (m.move.data.power || 0) > 0);
      if (damagingMoves.length > 0 && Math.random() < 0.8) {
        const choice = damagingMoves[Math.floor(Math.random() * damagingMoves.length)];
        return { action_type: 'FIGHT', move_index: choice.idx };
      }
      const choice = availableMoves[Math.floor(Math.random() * availableMoves.length)];
      return { action_type: 'FIGHT', move_index: choice.idx };
    }

    // 3. Nivel Gimnasio / Rival / Campeón (Calcula mayor efectividad y daño)
    let bestMoveIdx = availableMoves[0].idx;
    let highestExpectedDamage = -1;

    for (const entry of availableMoves) {
      const move = entry.move.data;
      if (!move.power || move.power === 0) {
        // Movimientos de estado
        if (entry.idx === availableMoves[0].idx && highestExpectedDamage < 5) {
          bestMoveIdx = entry.idx;
        }
        continue;
      }

      const sim = this.calc.calculateDamage(aiPokemon, playerPokemon, move, 'clear', false, 1.0);
      let score = sim.damage;

      // Bonus por STAB y súper efectividad
      if (sim.type_effectiveness > 1.0) score *= 1.2;
      if (sim.damage >= playerPokemon.current_hp) score += 1000; // Knockout garantizado

      if (score > highestExpectedDamage) {
        highestExpectedDamage = score;
        bestMoveIdx = entry.idx;
      }
    }

    // Chequeo de Mega Evolución en turnos iniciales de líderes/rivales
    const shouldMega = canMegaEvolve && (tier === 'rival_boss' || tier === 'champion' || tier === 'gym_leader');

    return {
      action_type: shouldMega ? 'MEGA_FIGHT' : 'FIGHT',
      move_index: bestMoveIdx,
      mega_evolve: shouldMega
    };
  }
}
