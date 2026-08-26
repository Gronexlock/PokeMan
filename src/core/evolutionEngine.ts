import { PokemonInstance, SpeciesData } from './types';
import { ANDARA_REGIONAL_POKEDEX } from './pokedexData';
import { NATURES } from './pokemonGenerator';

export interface EvolutionResult {
  canEvolve: boolean;
  targetSpeciesId?: number;
  targetSpeciesName?: string;
  method?: 'level' | 'item' | 'link_cable';
  evolutionMessage?: string;
}

/**
 * Motor de Evolución Offline de Andara.
 *
 * Responsabilidades:
 * - Detección de evolución por nivel.
 * - Soporte del objeto "Cordón Unión" (Link Cable) para especies de intercambio.
 * - Uso directo de objetos tradicionales de intercambio (Revestimiento Metálico, Roca del Rey, Escama Dragón, etc.).
 * - Aplicación de Mentas de Naturaleza.
 * - Transformación y recálculo de estadísticas del Pokémon tras evolucionar.
 */
export class EvolutionEngine {
  private pokedex: Record<number, SpeciesData>;

  constructor(pokedex: Record<number, SpeciesData> = ANDARA_REGIONAL_POKEDEX) {
    this.pokedex = pokedex;
  }

  /**
   * Comprueba si un Pokémon puede evolucionar por nivel.
   */
  public checkLevelEvolution(pokemon: PokemonInstance): EvolutionResult {
    const species = this.pokedex[pokemon.species_id];
    if (!species || !species.evolutions) {
      return { canEvolve: false };
    }

    for (const evo of species.evolutions) {
      if (evo.level && pokemon.level >= evo.level) {
        const target = this.pokedex[evo.to];
        return {
          canEvolve: true,
          targetSpeciesId: evo.to,
          targetSpeciesName: target ? target.name : `Pokémon #${evo.to}`,
          method: 'level',
          evolutionMessage: `¡${pokemon.nickname || species.name} está listo para evolucionar en ${target ? target.name : 'su siguiente forma'}!`
        };
      }
    }

    return { canEvolve: false };
  }

  /**
   * Comprueba si un Pokémon puede evolucionar usando un objeto específico desde la mochila.
   */
  public checkItemEvolution(pokemon: PokemonInstance, itemId: string): EvolutionResult {
    const species = this.pokedex[pokemon.species_id];
    if (!species || !species.evolutions) {
      return { canEvolve: false };
    }

    const cleanItemId = itemId.toLowerCase().trim().replace('-', '_');

    for (const evo of species.evolutions) {
      if (evo.item && evo.item.toLowerCase().replace('-', '_') === cleanItemId) {
        const target = this.pokedex[evo.to];
        const isCable = cleanItemId === 'link_cable';
        return {
          canEvolve: true,
          targetSpeciesId: evo.to,
          targetSpeciesName: target ? target.name : `Pokémon #${evo.to}`,
          method: isCable ? 'link_cable' : 'item',
          evolutionMessage: isCable
            ? `¡La energía del Cordón Unión resuena con ${pokemon.nickname || species.name}!`
            : `¡${pokemon.nickname || species.name} reacciona a ${itemId}!`
        };
      }
    }

    return { canEvolve: false };
  }

  /**
   * Ejecuta la transformación evolutiva modificando la instancia del Pokémon en memoria.
   */
  public executeEvolution(pokemon: PokemonInstance, targetSpeciesId: number): boolean {
    const targetSpecies = this.pokedex[targetSpeciesId];
    if (!targetSpecies) return false;

    const oldSpecies = this.pokedex[pokemon.species_id];
    const hadDefaultNickname = !pokemon.nickname || (oldSpecies && pokemon.nickname === oldSpecies.name);

    // Actualizar especie y tipos
    pokemon.species_id = targetSpecies.id;
    if (hadDefaultNickname) {
      pokemon.nickname = targetSpecies.name;
    }
    pokemon.types = [...targetSpecies.types];
    pokemon.base_stats = { ...targetSpecies.stats };

    // Recalcular estadísticas manteniendo HP relativo
    const hpRatio = pokemon.current_hp / Math.max(1, pokemon.max_hp);
    this.recalculateStats(pokemon);
    pokemon.current_hp = Math.max(1, Math.floor(pokemon.max_hp * hpRatio));

    return true;
  }

  /**
   * Aplica una Menta de Naturaleza alterando la naturaleza efectiva del Pokémon.
   */
  public applyNatureMint(pokemon: PokemonInstance, mintId: string): boolean {
    const cleanId = mintId.toLowerCase().replace('_mint', '').replace('mint_', '');
    if (!NATURES[cleanId]) return false;

    pokemon.effective_nature = cleanId;
    this.recalculateStats(pokemon);
    return true;
  }

  /**
   * Recálculo exacto de estadísticas aplicando IVs perfectos (31) y naturalezas.
   */
  private recalculateStats(pokemon: PokemonInstance): void {
    const level = pokemon.level;
    const base = pokemon.base_stats;
    const ivs = pokemon.ivs || { hp: 31, attack: 31, defense: 31, special_attack: 31, special_defense: 31, speed: 31 };
    const evs = pokemon.evs || { hp: 0, attack: 0, defense: 0, special_attack: 0, special_defense: 0, speed: 0 };
    const nature = NATURES[pokemon.effective_nature] || NATURES.hardy;

    const hpBase = base.hp || 50;
    const hpIv = ivs.hp || 31;
    const hpEv = evs.hp || 0;
    pokemon.max_hp = Math.floor(((2 * hpBase + hpIv + Math.floor(hpEv / 4)) * level) / 100) + level + 10;

    const statsKeys: (keyof typeof base)[] = ['attack', 'defense', 'special_attack', 'special_defense', 'speed'];
    for (const stat of statsKeys) {
      const sBase = base[stat] || 50;
      const sIv = ivs[stat] || 31;
      const sEv = evs[stat] || 0;
      const raw = Math.floor(((2 * sBase + sIv + Math.floor(sEv / 4)) * level) / 100) + 5;

      let multiplier = 1.0;
      if (nature.increased === stat) multiplier = 1.1;
      else if (nature.decreased === stat) multiplier = 0.9;

      pokemon.stats[stat] = Math.floor(raw * multiplier);
    }
  }
}
