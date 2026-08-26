import { describe, it, expect, beforeEach } from './testRunner';
import { EvolutionEngine } from '../src/core/evolutionEngine';
import { PokemonGenerator } from '../src/core/pokemonGenerator';
import { ANDARA_REGIONAL_POKEDEX } from '../src/core/pokedexData';
import { PokemonInstance } from '../src/core/types';

describe('8.1 — Pokédex Regional de Andara & Evolution Engine Tests', () => {
  let engine: EvolutionEngine;
  let generator: PokemonGenerator;

  beforeEach(() => {
    engine = new EvolutionEngine(ANDARA_REGIONAL_POKEDEX);
    generator = new PokemonGenerator(ANDARA_REGIONAL_POKEDEX, {});
  });

  // ─────────────────────────────────────────────────────────────
  // 1. PROGRESIÓN DE MOVIMIENTOS EN RUTAS TEMPRANAS (POW <= 45)
  // ─────────────────────────────────────────────────────────────
  it('Pokémon de nivel bajo (1-5) solo poseen movimientos iniciales de baja potencia', () => {
    const bulba = generator.generatePokemon(1, 5); // Bulbasaur Nv. 5
    expect(bulba.moves.length).toBeGreaterThan(0);
    for (const move of bulba.moves) {
      const power = move.data?.power ?? (move as any).power ?? 0;
      expect(power).toBeLessThanOrEqual(45);
    }

    const char = generator.generatePokemon(4, 5); // Charmander Nv. 5
    for (const move of char.moves) {
      const power = move.data?.power ?? (move as any).power ?? 0;
      expect(power).toBeLessThanOrEqual(45);
    }
  });

  it('Pokémon de nivel avanzado (40+) desbloquean movimientos de alto poder', () => {
    const garchomp = generator.generatePokemon(445, 55); // Garchomp Nv. 55
    const hasStrongMove = garchomp.moves.some(m => ((m.data?.power ?? (m as any).power ?? 0) >= 80) || m.id === 'earthquake' || m.id === 'dragon_rush');
    expect(hasStrongMove).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────
  // 2. EVOLUCIONES POR NIVEL
  // ─────────────────────────────────────────────────────────────
  it('Evolución por nivel: Bulbasaur (Nv. 16) -> Ivysaur', () => {
    const bulba15 = generator.generatePokemon(1, 15);
    expect(engine.checkLevelEvolution(bulba15).canEvolve).toBe(false);

    const bulba16 = generator.generatePokemon(1, 16);
    const result = engine.checkLevelEvolution(bulba16);
    expect(result.canEvolve).toBe(true);
    expect(result.targetSpeciesId).toBe(2);
    expect(result.targetSpeciesName).toBe('Ivysaur');

    // Ejecutar evolución
    engine.executeEvolution(bulba16, result.targetSpeciesId!);
    expect(bulba16.species_id).toBe(2);
    expect(bulba16.nickname).toBe('Ivysaur');
  });

  // ─────────────────────────────────────────────────────────────
  // 3. EVOLUCIÓN OFFLINE CON CORDÓN UNIÓN (LINK CABLE)
  // ─────────────────────────────────────────────────────────────
  it('Cordón Unión (Link Cable): Kadabra -> Alakazam, Haunter -> Gengar, Machoke -> Machamp', () => {
    const kadabra = generator.generatePokemon(64, 25);
    const resKadabra = engine.checkItemEvolution(kadabra, 'link_cable');
    expect(resKadabra.canEvolve).toBe(true);
    expect(resKadabra.targetSpeciesId).toBe(65);
    expect(resKadabra.targetSpeciesName).toBe('Alakazam');

    const haunter = generator.generatePokemon(93, 28);
    const resHaunter = engine.checkItemEvolution(haunter, 'link_cable');
    expect(resHaunter.canEvolve).toBe(true);
    expect(resHaunter.targetSpeciesId).toBe(94);
    expect(resHaunter.targetSpeciesName).toBe('Gengar');

    const machoke = generator.generatePokemon(67, 30);
    const resMachoke = engine.checkItemEvolution(machoke, 'link_cable');
    expect(resMachoke.canEvolve).toBe(true);
    expect(resMachoke.targetSpeciesId).toBe(68);
    expect(resMachoke.targetSpeciesName).toBe('Machamp');
  });

  // ─────────────────────────────────────────────────────────────
  // 4. USO DIRECTO DE OBJETOS EVOLUTIVOS (REVESTIMIENTO METÁLICO, PIEDRAS)
  // ─────────────────────────────────────────────────────────────
  it('Uso directo de objetos: Scyther + Revestimiento Metálico -> Scizor', () => {
    const scyther = generator.generatePokemon(123, 30);
    const res = engine.checkItemEvolution(scyther, 'metal_coat');
    expect(res.canEvolve).toBe(true);
    expect(res.targetSpeciesId).toBe(212);
    expect(res.targetSpeciesName).toBe('Scizor');

    engine.executeEvolution(scyther, 212);
    expect(scyther.species_id).toBe(212);
    expect(scyther.types).toContain('steel');
  });

  it('Piedras elementales: Growlithe + Piedra Fuego -> Arcanine', () => {
    const growlithe = generator.generatePokemon(58, 20);
    const res = engine.checkItemEvolution(growlithe, 'fire_stone');
    expect(res.canEvolve).toBe(true);
    expect(res.targetSpeciesId).toBe(59);
    expect(res.targetSpeciesName).toBe('Arcanine');
  });

  // ─────────────────────────────────────────────────────────────
  // 5. MENTAS DE NATURALEZA
  // ─────────────────────────────────────────────────────────────
  it('Aplicación de Mentas de Naturaleza altera la naturaleza efectiva y estadísticas', () => {
    const garchomp = generator.generatePokemon(445, 50, 'modest'); // -Attack, +SpAtk
    const atkOriginal = garchomp.stats.attack;

    engine.applyNatureMint(garchomp, 'adamant_mint'); // +Attack, -SpAtk
    expect(garchomp.effective_nature).toBe('adamant');
    expect(garchomp.stats.attack).toBeGreaterThan(atkOriginal);
  });
});
