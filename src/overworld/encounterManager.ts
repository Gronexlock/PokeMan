import { PokemonInstance, TimePeriod } from '../core/types';
import { PokemonGenerator } from '../core/pokemonGenerator';

export interface EncounterPoolEntry {
  species_id: number;
  min_level: number;
  max_level: number;
  weight: number;
  time_periods?: TimePeriod[];
}

export class EncounterManager {
  private pokeGen: PokemonGenerator;
  private encounterZones: Map<string, EncounterPoolEntry[]> = new Map();
  public stepsInGrass: number = 0;
  public encounterRate: number = 0.16; // 16% base por paso en hierba alta

  constructor(pokeGen: PokemonGenerator) {
    this.pokeGen = pokeGen;
    this.initDefaultEncounterZones();
  }

  private initDefaultEncounterZones(): void {
    // Ruta 1: Sendero Costero
    this.encounterZones.set('route_1_coastal', [
      { species_id: 18, min_level: 3, max_level: 5, weight: 30, time_periods: ['morning', 'day'] },    // Pidgeot/Pidgey
      { species_id: 43, min_level: 3, max_level: 4, weight: 25, time_periods: ['morning', 'day', 'sunset'] }, // Oddish
      { species_id: 12, min_level: 3, max_level: 5, weight: 20, time_periods: ['morning', 'day'] },    // Butterfree
      { species_id: 92, min_level: 4, max_level: 6, weight: 25, time_periods: ['night'] },              // Gastly
      { species_id: 133, min_level: 5, max_level: 5, weight: 5 }                                         // Eevee (Raro)
    ]);
  }

  public checkGrassStep(zoneId: string, timePeriod: TimePeriod): PokemonInstance | null {
    this.stepsInGrass++;

    // Probabilidad acumulativa básica
    if (Math.random() < this.encounterRate) {
      this.stepsInGrass = 0;
      return this.generateWildPokemon(zoneId, timePeriod);
    }

    return null;
  }

  public generateWildPokemon(zoneId: string, timePeriod: TimePeriod): PokemonInstance | null {
    const pool = this.encounterZones.get(zoneId);
    if (!pool || pool.length === 0) return null;

    // Filtrar por período de tiempo si aplica
    const validEntries = pool.filter(e => !e.time_periods || e.time_periods.includes(timePeriod));
    const entries = validEntries.length > 0 ? validEntries : pool;

    const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
    let randomWeight = Math.random() * totalWeight;

    let selectedEntry = entries[0];
    for (const entry of entries) {
      if (randomWeight < entry.weight) {
        selectedEntry = entry;
        break;
      }
      randomWeight -= entry.weight;
    }

    const level = Math.floor(
      selectedEntry.min_level + Math.random() * (selectedEntry.max_level - selectedEntry.min_level + 1)
    );

    return this.pokeGen.generatePokemon(selectedEntry.species_id, level);
  }
}
