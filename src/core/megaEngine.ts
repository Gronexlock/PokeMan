import { PokemonInstance, BaseStats } from './types';

export interface MegaEvolutionData {
  mega_name: string;
  species_id: number;
  mega_stone: string;
  types: string[];
  ability: string;
  stat_boosts: Partial<BaseStats>;
}

export class MegaEvolutionEngine {
  private megaDb: Record<string, MegaEvolutionData> = {};

  constructor(megaDb: Record<string, MegaEvolutionData> = {}) {
    this.megaDb = megaDb;
  }

  public setMegaDb(megaDb: Record<string, MegaEvolutionData>) {
    this.megaDb = megaDb;
  }

  public canMegaEvolve(pokemon: PokemonInstance, hasMegaRing: boolean = true): { can_evolve: boolean; mega_key?: string; reason?: string } {
    if (!hasMegaRing) {
      return { can_evolve: false, reason: "No tienes el Mega-Aro equipado." };
    }
    if (pokemon.is_mega) {
      return { can_evolve: false, reason: "El Pokémon ya ha Mega Evolucionado." };
    }

    for (const [key, data] of Object.entries(this.megaDb)) {
      if (data.species_id === pokemon.species_id) {
        if (!pokemon.held_item || pokemon.held_item.toLowerCase() === data.mega_stone.toLowerCase() || pokemon.held_item === 'any_mega') {
          return { can_evolve: true, mega_key: key };
        }
      }
    }

    return { can_evolve: false, reason: "El Pokémon no sostiene su Mega-Piedra compatible." };
  }

  public triggerMegaEvolution(pokemon: PokemonInstance, megaKey: string): { success: boolean; message: string; prev_name: string } {
    const data = this.megaDb[megaKey];
    if (!data) {
      return { success: false, message: "Datos de Mega Evolución no encontrados.", prev_name: pokemon.species_name };
    }

    const prevName = pokemon.nickname || pokemon.species_name;
    pokemon.is_mega = true;
    pokemon.species_name = data.mega_name;
    pokemon.ability = data.ability;

    if (data.types && data.types.length > 0) {
      pokemon.types = data.types as any;
    }

    if (data.stat_boosts) {
      for (const [stat, boost] of Object.entries(data.stat_boosts)) {
        const k = stat as keyof BaseStats;
        if (pokemon.stats[k] !== undefined && typeof boost === 'number') {
          pokemon.stats[k] += boost;
          pokemon.base_stats[k] += boost;
        }
      }
    }

    return {
      success: true,
      message: `¡El Mega-Aro reacciona con la ${data.mega_stone}! ¡${prevName} ha Mega Evolucionado en ${data.mega_name}!`,
      prev_name: prevName
    };
  }
}
