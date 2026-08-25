import { PokemonInstance, BaseStats, NatureInfo, SpeciesData, MoveSlot, MoveData } from './types';

export const NATURES: Record<string, NatureInfo> = {
  hardy:    { increased: null, decreased: null, es_name: "Fuerte" },
  lonely:   { increased: "attack", decreased: "defense", es_name: "Huraña" },
  brave:    { increased: "attack", decreased: "speed", es_name: "Audaz" },
  adamant:  { increased: "attack", decreased: "special_attack", es_name: "Firme" },
  naughty:  { increased: "attack", decreased: "special_defense", es_name: "Pícara" },
  bold:     { increased: "defense", decreased: "attack", es_name: "Osada" },
  docile:   { increased: null, decreased: null, es_name: "Dócil" },
  relaxed:  { increased: "defense", decreased: "speed", es_name: "Plácida" },
  impish:   { increased: "defense", decreased: "special_attack", es_name: "Agitada" },
  lax:      { increased: "defense", decreased: "special_defense", es_name: "Floja" },
  timid:    { increased: "speed", decreased: "attack", es_name: "Miedosa" },
  hasty:    { increased: "speed", decreased: "defense", es_name: "Activa" },
  serious:  { increased: null, decreased: null, es_name: "Seria" },
  jolly:    { increased: "speed", decreased: "special_attack", es_name: "Alegre" },
  naive:    { increased: "speed", decreased: "special_defense", es_name: "Ingenua" },
  modest:   { increased: "special_attack", decreased: "attack", es_name: "Modesta" },
  mild:     { increased: "special_attack", decreased: "defense", es_name: "Afable" },
  quiet:    { increased: "special_attack", decreased: "speed", es_name: "Mansa" },
  bashful:  { increased: null, decreased: null, es_name: "Tímida" },
  rash:     { increased: "special_attack", decreased: "special_defense", es_name: "Alocada" },
  calm:     { increased: "special_defense", decreased: "attack", es_name: "Serena" },
  gentle:   { increased: "special_defense", decreased: "defense", es_name: "Amable" },
  sassy:    { increased: "special_defense", decreased: "speed", es_name: "Grosera" },
  careful:  { increased: "special_defense", decreased: "special_attack", es_name: "Cauta" },
  quirky:   { increased: null, decreased: null, es_name: "Rara" }
};

export const SPECIES_REGISTRY: Record<number, SpeciesData> = {
  1: { id: 1, name: "Bulbasaur", types: ["grass", "poison"], stats: { hp: 45, attack: 49, defense: 49, special_attack: 65, special_defense: 65, speed: 45 }, learnset: [{ move: "tackle", level: 1 }, { move: "vine_whip", level: 3 }, { move: "razor_leaf", level: 12 }, { move: "seed_bomb", level: 20 }] },
  2: { id: 2, name: "Ivysaur", types: ["grass", "poison"], stats: { hp: 60, attack: 62, defense: 63, special_attack: 80, special_defense: 80, speed: 60 }, learnset: [{ move: "tackle", level: 1 }, { move: "vine_whip", level: 1 }, { move: "razor_leaf", level: 12 }, { move: "seed_bomb", level: 20 }] },
  3: { id: 3, name: "Venusaur", types: ["grass", "poison"], stats: { hp: 80, attack: 82, defense: 83, special_attack: 100, special_defense: 100, speed: 80 }, learnset: [{ move: "giga_drain", level: 1 }, { move: "sludge_bomb", level: 1 }, { move: "earthquake", level: 1 }, { move: "energy_ball", level: 1 }] },
  4: { id: 4, name: "Charmander", types: ["fire"], stats: { hp: 39, attack: 52, defense: 43, special_attack: 60, special_defense: 50, speed: 65 }, learnset: [{ move: "scratch", level: 1 }, { move: "growl", level: 1 }, { move: "ember", level: 4 }, { move: "dragon_breath", level: 12 }, { move: "fire_fang", level: 17 }] },
  5: { id: 5, name: "Charmeleon", types: ["fire"], stats: { hp: 58, attack: 64, defense: 58, special_attack: 80, special_defense: 65, speed: 80 }, learnset: [{ move: "scratch", level: 1 }, { move: "ember", level: 1 }, { move: "dragon_breath", level: 12 }, { move: "fire_fang", level: 17 }, { move: "flamethrower", level: 24 }] },
  6: { id: 6, name: "Charizard", types: ["fire", "flying"], stats: { hp: 78, attack: 84, defense: 78, special_attack: 109, special_defense: 85, speed: 100 }, learnset: [{ move: "flamethrower", level: 1 }, { move: "air_slash", level: 1 }, { move: "dragon_claw", level: 1 }, { move: "fire_blast", level: 45 }] },
  7: { id: 7, name: "Squirtle", types: ["water"], stats: { hp: 44, attack: 48, defense: 65, special_attack: 50, special_defense: 64, speed: 43 }, learnset: [{ move: "tackle", level: 1 }, { move: "tail_whip", level: 1 }, { move: "water_gun", level: 3 }, { move: "withdraw", level: 6 }, { move: "bubble_beam", level: 12 }, { move: "bite", level: 16 }] },
  8: { id: 8, name: "Wartortle", types: ["water"], stats: { hp: 59, attack: 63, defense: 80, special_attack: 65, special_defense: 80, speed: 58 }, learnset: [{ move: "tackle", level: 1 }, { move: "water_gun", level: 1 }, { move: "bubble_beam", level: 12 }, { move: "bite", level: 16 }, { move: "waterfall", level: 25 }] },
  9: { id: 9, name: "Blastoise", types: ["water"], stats: { hp: 79, attack: 83, defense: 100, special_attack: 85, special_defense: 105, speed: 78 }, learnset: [{ move: "hydro_pump", level: 1 }, { move: "ice_beam", level: 1 }, { move: "aura_sphere", level: 1 }, { move: "flash_cannon", level: 1 }] },
  10: { id: 10, name: "Caterpie", types: ["bug"], stats: { hp: 45, attack: 30, defense: 35, special_attack: 20, special_defense: 20, speed: 45 }, learnset: [{ move: "tackle", level: 1 }, { move: "string_shot", level: 1 }, { move: "bug_bite", level: 5 }] },
  12: { id: 12, name: "Butterfree", types: ["bug", "flying"], stats: { hp: 60, attack: 45, defense: 50, special_attack: 90, special_defense: 80, speed: 70 }, learnset: [{ move: "gust", level: 1 }, { move: "confusion", level: 1 }, { move: "sleep_powder", level: 12 }, { move: "bug_buzz", level: 18 }] },
  16: { id: 16, name: "Pidgey", types: ["normal", "flying"], stats: { hp: 40, attack: 45, defense: 40, special_attack: 35, special_defense: 35, speed: 56 }, learnset: [{ move: "tackle", level: 1 }, { move: "sand_attack", level: 3 }, { move: "gust", level: 5 }, { move: "quick_attack", level: 9 }] },
  19: { id: 19, name: "Rattata", types: ["normal"], stats: { hp: 30, attack: 56, defense: 35, special_attack: 25, special_defense: 35, speed: 72 }, learnset: [{ move: "tackle", level: 1 }, { move: "quick_attack", level: 4 }, { move: "bite", level: 7 }, { move: "hyper_fang", level: 14 }] },
  25: { id: 25, name: "Pikachu", types: ["electric"], stats: { hp: 35, attack: 55, defense: 40, special_attack: 50, special_defense: 50, speed: 90 }, learnset: [{ move: "thunder_shock", level: 1 }, { move: "quick_attack", level: 5 }, { move: "spark", level: 10 }, { move: "thunderbolt", level: 20 }] },
  26: { id: 26, name: "Raichu", types: ["electric"], stats: { hp: 60, attack: 90, defense: 55, special_attack: 90, special_defense: 80, speed: 110 }, learnset: [{ move: "thunderbolt", level: 1 }, { move: "volt_switch", level: 1 }, { move: "extreme_speed", level: 1 }] },
  27: { id: 27, name: "Sandshrew", types: ["ground"], stats: { hp: 50, attack: 75, defense: 85, special_attack: 20, special_defense: 30, speed: 40 }, learnset: [{ move: "scratch", level: 1 }, { move: "defense_curl", level: 1 }, { move: "sand_attack", level: 3 }, { move: "rollout", level: 9 }, { move: "bulldoze", level: 14 }] },
  43: { id: 43, name: "Oddish", types: ["grass", "poison"], stats: { hp: 45, attack: 50, defense: 55, special_attack: 75, special_defense: 65, speed: 30 }, learnset: [{ move: "absorb", level: 1 }, { move: "acid", level: 9 }, { move: "mega_drain", level: 14 }, { move: "sleep_powder", level: 18 }] },
  45: { id: 45, name: "Vileplume", types: ["grass", "poison"], stats: { hp: 75, attack: 80, defense: 85, special_attack: 110, special_defense: 90, speed: 50 }, learnset: [{ move: "giga_drain", level: 1 }, { move: "sludge_bomb", level: 1 }, { move: "moonblast", level: 1 }, { move: "energy_ball", level: 1 }] },
  60: { id: 60, name: "Poliwag", types: ["water"], stats: { hp: 40, attack: 50, defense: 40, special_attack: 40, special_defense: 40, speed: 90 }, learnset: [{ move: "water_gun", level: 1 }, { move: "hypnosis", level: 1 }, { move: "pound", level: 4 }, { move: "bubble_beam", level: 11 }] },
  62: { id: 62, name: "Poliwrath", types: ["water", "fighting"], stats: { hp: 90, attack: 95, defense: 95, special_attack: 70, special_defense: 90, speed: 70 }, learnset: [{ move: "waterfall", level: 1 }, { move: "close_combat", level: 1 }, { move: "ice_punch", level: 1 }, { move: "body_slam", level: 1 }] },
  64: { id: 64, name: "Kadabra", types: ["psychic"], stats: { hp: 40, attack: 35, defense: 30, special_attack: 120, special_defense: 70, speed: 105 }, learnset: [{ move: "confusion", level: 1 }, { move: "teleport", level: 1 }, { move: "psybeam", level: 16 }, { move: "psychic", level: 28 }, { move: "shadow_ball", level: 32 }] },
  65: { id: 65, name: "Alakazam", types: ["psychic"], stats: { hp: 55, attack: 50, defense: 45, special_attack: 135, special_defense: 95, speed: 120 }, learnset: [{ move: "psychic", level: 1 }, { move: "shadow_ball", level: 1 }, { move: "calm_mind", level: 1 }, { move: "energy_ball", level: 1 }] },
  68: { id: 68, name: "Machamp", types: ["fighting"], stats: { hp: 90, attack: 130, defense: 80, special_attack: 65, special_defense: 85, speed: 55 }, learnset: [{ move: "close_combat", level: 1 }, { move: "stone_edge", level: 1 }, { move: "knock_off", level: 1 }, { move: "bullet_punch", level: 1 }] },
  73: { id: 73, name: "Tentacruel", types: ["water", "poison"], stats: { hp: 80, attack: 70, defense: 65, special_attack: 80, special_defense: 120, speed: 100 }, learnset: [{ move: "scald", level: 1 }, { move: "sludge_bomb", level: 1 }, { move: "ice_beam", level: 1 }, { move: "toxic_spikes", level: 1 }] },
  74: { id: 74, name: "Geodude", types: ["rock", "ground"], stats: { hp: 40, attack: 80, defense: 100, special_attack: 30, special_defense: 30, speed: 20 }, learnset: [{ move: "tackle", level: 1 }, { move: "defense_curl", level: 1 }, { move: "rock_throw", level: 4 }, { move: "bulldoze", level: 10 }, { move: "rock_slide", level: 16 }] },
  93: { id: 93, name: "Haunter", types: ["ghost", "poison"], stats: { hp: 45, attack: 50, defense: 45, special_attack: 115, special_defense: 55, speed: 95 }, learnset: [{ move: "shadow_ball", level: 1 }, { move: "sludge_bomb", level: 1 }, { move: "will_o_wisp", level: 1 }, { move: "hypnosis", level: 1 }] },
  94: { id: 94, name: "Gengar", types: ["ghost", "poison"], stats: { hp: 60, attack: 65, defense: 60, special_attack: 130, special_defense: 75, speed: 110 }, learnset: [{ move: "shadow_ball", level: 1 }, { move: "sludge_bomb", level: 1 }, { move: "dazzling_gleam", level: 1 }, { move: "thunderbolt", level: 1 }] },
  123: { id: 123, name: "Scyther", types: ["bug", "flying"], stats: { hp: 70, attack: 110, defense: 80, special_attack: 55, special_defense: 80, speed: 105 }, learnset: [{ move: "quick_attack", level: 1 }, { move: "wing_attack", level: 12 }, { move: "x_scissor", level: 22 }, { move: "swords_dance", level: 30 }] },
  129: { id: 129, name: "Magikarp", types: ["water"], stats: { hp: 20, attack: 10, defense: 55, special_attack: 15, special_defense: 20, speed: 80 }, learnset: [{ move: "splash", level: 1 }, { move: "tackle", level: 5 }, { move: "flail", level: 15 }] },
  130: { id: 130, name: "Gyarados", types: ["water", "flying"], stats: { hp: 95, attack: 125, defense: 79, special_attack: 60, special_defense: 100, speed: 81 }, learnset: [{ move: "waterfall", level: 1 }, { move: "crunch", level: 1 }, { move: "dragon_dance", level: 1 }, { move: "earthquake", level: 1 }] },
  134: { id: 134, name: "Vaporeon", types: ["water"], stats: { hp: 130, attack: 65, defense: 60, special_attack: 110, special_defense: 95, speed: 65 }, learnset: [{ move: "scald", level: 1 }, { move: "ice_beam", level: 1 }, { move: "quick_attack", level: 1 }] },
  136: { id: 136, name: "Flareon", types: ["fire"], stats: { hp: 65, attack: 130, defense: 60, special_attack: 95, special_defense: 110, speed: 65 }, learnset: [{ move: "flare_blitz", level: 1 }, { move: "superpower", level: 1 }, { move: "flamethrower", level: 1 }] },
  149: { id: 149, name: "Dragonite", types: ["dragon", "flying"], stats: { hp: 91, attack: 134, defense: 95, special_attack: 100, special_defense: 100, speed: 80 }, learnset: [{ move: "outrage", level: 1 }, { move: "dragon_dance", level: 1 }, { move: "extreme_speed", level: 1 }, { move: "earthquake", level: 1 }] },
  152: { id: 152, name: "Chikorita", types: ["grass"], stats: { hp: 45, attack: 49, defense: 65, special_attack: 49, special_defense: 65, speed: 45 }, learnset: [{ move: "tackle", level: 1 }, { move: "razor_leaf", level: 4 }, { move: "seed_bomb", level: 15 }] },
  155: { id: 155, name: "Cyndaquil", types: ["fire"], stats: { hp: 39, attack: 52, defense: 43, special_attack: 60, special_defense: 50, speed: 65 }, learnset: [{ move: "tackle", level: 1 }, { move: "ember", level: 4 }, { move: "flame_wheel", level: 15 }] },
  158: { id: 158, name: "Totodile", types: ["water"], stats: { hp: 50, attack: 65, defense: 64, special_attack: 44, special_defense: 48, speed: 43 }, learnset: [{ move: "scratch", level: 1 }, { move: "water_gun", level: 4 }, { move: "ice_fang", level: 15 }] },
  252: { id: 252, name: "Treecko", types: ["grass"], stats: { hp: 40, attack: 45, defense: 35, special_attack: 65, special_defense: 55, speed: 70 }, learnset: [{ move: "pound", level: 1 }, { move: "absorb", level: 4 }, { move: "mega_drain", level: 14 }] },
  255: { id: 255, name: "Torchic", types: ["fire"], stats: { hp: 45, attack: 60, defense: 40, special_attack: 70, special_defense: 50, speed: 45 }, learnset: [{ move: "scratch", level: 1 }, { move: "ember", level: 4 }, { move: "flame_charge", level: 14 }] },
  258: { id: 258, name: "Mudkip", types: ["water"], stats: { hp: 50, attack: 70, defense: 50, special_attack: 50, special_defense: 50, speed: 40 }, learnset: [{ move: "tackle", level: 1 }, { move: "water_gun", level: 4 }, { move: "water_pulse", level: 14 }] },
  387: { id: 387, name: "Turtwig", types: ["grass"], stats: { hp: 55, attack: 68, defense: 64, special_attack: 45, special_defense: 55, speed: 31 }, learnset: [{ move: "tackle", level: 1 }, { move: "razor_leaf", level: 4 }, { move: "bite", level: 8 }] },
  390: { id: 390, name: "Chimchar", types: ["fire"], stats: { hp: 44, attack: 58, defense: 44, special_attack: 58, special_defense: 44, speed: 61 }, learnset: [{ move: "scratch", level: 1 }, { move: "ember", level: 4 }, { move: "mach_punch", level: 8 }] },
  393: { id: 393, name: "Piplup", types: ["water"], stats: { hp: 53, attack: 51, defense: 53, special_attack: 61, special_defense: 56, speed: 40 }, learnset: [{ move: "pound", level: 1 }, { move: "water_gun", level: 4 }, { move: "bubble_beam", level: 8 }] },
  443: { id: 443, name: "Gible", types: ["dragon", "ground"], stats: { hp: 58, attack: 70, defense: 45, special_attack: 40, special_defense: 45, speed: 42 }, learnset: [{ move: "tackle", level: 1 }, { move: "dragon_breath", level: 5 }, { move: "earthquake", level: 28 }] },
  445: { id: 445, name: "Garchomp", types: ["dragon", "ground"], stats: { hp: 108, attack: 130, defense: 95, special_attack: 80, special_defense: 85, speed: 102 }, learnset: [{ move: "earthquake", level: 1 }, { move: "dragon_claw", level: 1 }, { move: "swords_dance", level: 1 }, { move: "stone_edge", level: 1 }] },
  448: { id: 448, name: "Lucario", types: ["fighting", "steel"], stats: { hp: 70, attack: 110, defense: 70, special_attack: 115, special_defense: 70, speed: 90 }, learnset: [{ move: "close_combat", level: 1 }, { move: "aura_sphere", level: 1 }, { move: "flash_cannon", level: 1 }, { move: "extreme_speed", level: 1 }] }
};

export class PokemonGenerator {
  private pokedex: Record<string, SpeciesData> = {};
  private movesDb: Record<string, MoveData> = {};

  constructor(pokedex: Record<string, SpeciesData>, movesDb: Record<string, MoveData>) {
    this.pokedex = pokedex;
    this.movesDb = movesDb;
  }

  public setDatabases(pokedex: Record<string, SpeciesData>, movesDb: Record<string, MoveData>) {
    this.pokedex = pokedex;
    this.movesDb = movesDb;
  }

  public generatePokemon(
    speciesId: number,
    level: number = 5,
    customNature?: string,
    evPreset?: Partial<BaseStats>,
    customMoves?: string[]
  ): PokemonInstance {
    let species = this.pokedex[speciesId.toString()] || SPECIES_REGISTRY[speciesId];
    if (!species) {
      species = {
        id: speciesId,
        name: `Pokémon #${speciesId}`,
        types: ['normal'],
        stats: { hp: 45, attack: 50, defense: 50, special_attack: 50, special_defense: 50, speed: 50 },
        learnset: [{ move: 'tackle', level: 1 }, { move: 'quick_attack', level: 4 }]
      };
    }

    const natureKeys = Object.keys(NATURES);
    const baseNature = (customNature && NATURES[customNature.toLowerCase()])
      ? customNature.toLowerCase()
      : natureKeys[Math.floor(Math.random() * natureKeys.length)];

    const ivs: BaseStats = {
      hp: 31,
      attack: 31,
      defense: 31,
      special_attack: 31,
      special_defense: 31,
      speed: 31
    };

    const evs: BaseStats = {
      hp: evPreset?.hp || 0,
      attack: evPreset?.attack || 0,
      defense: evPreset?.defense || 0,
      special_attack: evPreset?.special_attack || 0,
      special_defense: evPreset?.special_defense || 0,
      speed: evPreset?.speed || 0
    };

    // Determinar movimientos por nivel
    let moveIds: string[] = [];
    if (customMoves && customMoves.length > 0) {
      moveIds = customMoves;
    } else {
      const eligible = (species.learnset || [])
        .filter(entry => entry.level <= level)
        .map(entry => entry.move);
      moveIds = eligible.slice(-4);
      if (moveIds.length === 0 && species.learnset && species.learnset.length > 0) {
        moveIds = [species.learnset[0].move];
      }
    }

    // Balance de etapas tempranas: Escalar y adaptar movimientos de alto poder según el nivel (evita one-shots)
    moveIds = moveIds.map(mId => this.downgradeHighPowerMove(mId, level));

    // Si el Pokémon no tiene ningún movimiento ofensivo a nivel bajo, agregar uno básico
    if (level <= 6 && moveIds.length > 0) {
      const hasDamagingMove = moveIds.some(mId => {
        const m = this.movesDb[mId.toLowerCase()];
        return m && (m.power || 0) > 0;
      });
      if (!hasDamagingMove) {
        const fallbackMove = species.types.includes('fire') ? 'ember' :
                             species.types.includes('water') ? 'water_gun' :
                             species.types.includes('grass') ? 'vine_whip' :
                             species.types.includes('electric') ? 'thunder_shock' : 'tackle';
        moveIds.unshift(fallbackMove);
        moveIds = moveIds.slice(0, 4);
      }
    }

    const moveSlots: MoveSlot[] = moveIds.map(mId => {
      const mData = this.movesDb[mId.toLowerCase()] || {
        name: mId,
        display_name: mId.charAt(0).toUpperCase() + mId.slice(1).replace('_', ' '),
        type: 'normal',
        category: 'physical',
        power: 40,
        accuracy: 100,
        pp: 35
      };
      const pp = mData.pp || 35;
      return {
        id: mId.toLowerCase(),
        name: mData.display_name || mData.name || mId,
        current_pp: pp,
        max_pp: pp,
        data: mData
      };
    });

    const pokemon: PokemonInstance = {
      species_id: species.id,
      species_name: species.name,
      types: [...species.types],
      level,
      base_stats: { ...species.stats },
      stats: { ...species.stats },
      ivs,
      evs,
      base_nature: baseNature,
      effective_nature: baseNature,
      current_hp: 1,
      max_hp: 1,
      status: null,
      moves: moveSlots,
      held_item: null,
      current_exp: Math.pow(level, 3),
      to_next_level_exp: Math.pow(level + 1, 3),
      stat_stages: {
        hp: 0,
        attack: 0,
        defense: 0,
        special_attack: 0,
        special_defense: 0,
        speed: 0,
        accuracy: 0,
        evasion: 0
      },
      ability: species.abilities?.[0] || 'Adaptability'
    };

    this.recalculateStats(pokemon);
    pokemon.current_hp = pokemon.max_hp;

    return pokemon;
  }

  public recalculateStats(pokemon: PokemonInstance): void {
    const level = pokemon.level;
    const base = pokemon.base_stats;
    const ivs = pokemon.ivs;
    const evs = pokemon.evs;
    const nature = NATURES[pokemon.effective_nature] || NATURES.serious;

    // Fórmula oficial HP
    const hpBase = base.hp || 50;
    const hpIv = ivs.hp || 31;
    const hpEv = evs.hp || 0;
    pokemon.max_hp = Math.floor(((2 * hpBase + hpIv + Math.floor(hpEv / 4)) * level) / 100) + level + 10;

    // Estadísticas secundarias
    const statsKeys: (keyof BaseStats)[] = ['attack', 'defense', 'special_attack', 'special_defense', 'speed'];
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

  private downgradeHighPowerMove(moveId: string, level: number): string {
    const moveData = this.movesDb[moveId.toLowerCase()];
    if (!moveData || !moveData.power) return moveId;

    // Regla de balance para niveles tempranos:
    // Nivel 1-7: max power 45 (evita one-shots al inicio de la aventura)
    // Nivel 8-14: max power 60
    const maxPower = level <= 7 ? 45 : level <= 14 ? 60 : 150;

    if (moveData.power <= maxPower) {
      return moveId;
    }

    // Tabla de conversión a movimientos de inicio por tipo
    const typeDowngrades: Record<string, string> = {
      fire: 'ember',
      water: 'water_gun',
      grass: 'vine_whip',
      electric: 'thunder_shock',
      psychic: 'confusion',
      flying: 'gust',
      poison: 'poison_sting',
      ground: 'mud_slap',
      ice: 'ice_shard',
      fighting: 'mach_punch',
      rock: 'rock_throw',
      bug: 'bug_bite',
      ghost: 'tackle',
      dragon: 'tackle',
      dark: 'scratch',
      steel: 'tackle',
      fairy: 'tackle',
      normal: 'tackle'
    };

    return typeDowngrades[moveData.type] || 'tackle';
  }
}
