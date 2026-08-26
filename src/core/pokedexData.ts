import { SpeciesData } from './types';

/**
 * POKÉDEX REGIONAL DE ANDARA — CATÁLOGO OFICIAL DE ESPECIES
 *
 * Características fundamentales:
 * 1. Ecosistemas sudamericanos (Andes, Yungas, Amazonía, Desierto de Atacama/Salares, Costa Pacífica y Glaciares Patagónicos).
 * 2. Progresión escalonada de movimientos (los niveles bajos 1-10 SOLO tienen movimientos básicos de baja potencia <= 40-45).
 * 3. Cadenas evolutivas completas adaptadas a modo offline (soporte para Cordón Unión y uso directo de objetos).
 * 4. Compatible con Mega-Evolución para todas las líneas con Mega Piedra.
 */
export const ANDARA_REGIONAL_POKEDEX: Record<number, SpeciesData> = {
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. INICIALES — PLANTA
  // ─────────────────────────────────────────────────────────────────────────────
  1: {
    id: 1,
    name: 'Bulbasaur',
    regional_dex_id: 1,
    types: ['grass', 'poison'],
    stats: { hp: 45, attack: 49, defense: 49, special_attack: 65, special_defense: 65, speed: 45 },
    evolutions: [{ level: 16, to: 2 }],
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 3, move: 'growl' },
      { level: 6, move: 'vine_whip' },
      { level: 9, move: 'poison_powder' },
      { level: 12, move: 'razor_leaf' },
      { level: 15, move: 'take_down' },
      { level: 20, move: 'sweet_scent' },
      { level: 25, move: 'giga_drain' },
      { level: 32, move: 'seed_bomb' }
    ]
  },
  2: {
    id: 2,
    name: 'Ivysaur',
    regional_dex_id: 2,
    types: ['grass', 'poison'],
    stats: { hp: 60, attack: 62, defense: 63, special_attack: 80, special_defense: 80, speed: 60 },
    evolutions: [{ level: 32, to: 3 }],
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'vine_whip' },
      { level: 9, move: 'poison_powder' },
      { level: 12, move: 'razor_leaf' },
      { level: 18, move: 'sweet_scent' },
      { level: 24, move: 'giga_drain' },
      { level: 31, move: 'sludge_bomb' },
      { level: 38, move: 'solar_beam' }
    ]
  },
  3: {
    id: 3,
    name: 'Venusaur',
    regional_dex_id: 3,
    types: ['grass', 'poison'],
    stats: { hp: 80, attack: 82, defense: 83, special_attack: 100, special_defense: 100, speed: 80 },
    learnset: [
      { level: 1, move: 'vine_whip' },
      { level: 1, move: 'razor_leaf' },
      { level: 32, move: 'petaldance' },
      { level: 39, move: 'sludge_bomb' },
      { level: 45, move: 'giga_drain' },
      { level: 53, move: 'solar_beam' },
      { level: 60, move: 'earthquake' }
    ]
  },
  252: {
    id: 252,
    name: 'Treecko',
    regional_dex_id: 4,
    types: ['grass'],
    stats: { hp: 40, attack: 45, defense: 35, special_attack: 65, special_defense: 55, speed: 70 },
    evolutions: [{ level: 16, to: 253 }],
    learnset: [
      { level: 1, move: 'pound' },
      { level: 3, move: 'leer' },
      { level: 6, move: 'absorb' },
      { level: 9, move: 'quick_attack' },
      { level: 12, move: 'mega_drain' },
      { level: 18, move: 'pursuit' },
      { level: 23, move: 'giga_drain' }
    ]
  },
  253: {
    id: 253,
    name: 'Grovyle',
    regional_dex_id: 5,
    types: ['grass'],
    stats: { hp: 50, attack: 65, defense: 45, special_attack: 85, special_defense: 65, speed: 95 },
    evolutions: [{ level: 36, to: 254 }],
    learnset: [
      { level: 1, move: 'pound' },
      { level: 1, move: 'quick_attack' },
      { level: 16, move: 'leaf_blade' },
      { level: 22, move: 'pursuit' },
      { level: 29, move: 'x_scissor' },
      { level: 36, move: 'giga_drain' }
    ]
  },
  254: {
    id: 254,
    name: 'Sceptile',
    regional_dex_id: 6,
    types: ['grass'],
    stats: { hp: 70, attack: 85, defense: 65, special_attack: 105, special_defense: 85, speed: 120 },
    learnset: [
      { level: 1, move: 'leaf_blade' },
      { level: 1, move: 'x_scissor' },
      { level: 36, move: 'dragon_breath' },
      { level: 43, move: 'energy_ball' },
      { level: 51, move: 'focus_blast' },
      { level: 59, move: 'leaf_storm' }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. INICIALES — FUEGO
  // ─────────────────────────────────────────────────────────────────────────────
  4: {
    id: 4,
    name: 'Charmander',
    regional_dex_id: 7,
    types: ['fire'],
    stats: { hp: 39, attack: 52, defense: 43, special_attack: 60, special_defense: 50, speed: 65 },
    evolutions: [{ level: 16, to: 5 }],
    learnset: [
      { level: 1, move: 'scratch' },
      { level: 3, move: 'growl' },
      { level: 6, move: 'ember' },
      { level: 9, move: 'smokescreen' },
      { level: 12, move: 'dragon_breath' },
      { level: 15, move: 'fire_fang' },
      { level: 19, move: 'slash' },
      { level: 24, move: 'flamethrower' }
    ]
  },
  5: {
    id: 5,
    name: 'Charmeleon',
    regional_dex_id: 8,
    types: ['fire'],
    stats: { hp: 58, attack: 64, defense: 58, special_attack: 80, special_defense: 65, speed: 80 },
    evolutions: [{ level: 36, to: 6 }],
    learnset: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'ember' },
      { level: 12, move: 'dragon_breath' },
      { level: 17, move: 'fire_fang' },
      { level: 23, move: 'slash' },
      { level: 30, move: 'flamethrower' },
      { level: 37, move: 'inferno' }
    ]
  },
  6: {
    id: 6,
    name: 'Charizard',
    regional_dex_id: 9,
    types: ['fire', 'flying'],
    stats: { hp: 78, attack: 84, defense: 78, special_attack: 109, special_defense: 85, speed: 100 },
    learnset: [
      { level: 1, move: 'air_slash' },
      { level: 1, move: 'dragon_claw' },
      { level: 36, move: 'wing_attack' },
      { level: 42, move: 'flamethrower' },
      { level: 50, move: 'heat_wave' },
      { level: 58, move: 'fire_blast' },
      { level: 65, move: 'flare_blitz' }
    ]
  },
  155: {
    id: 155,
    name: 'Cyndaquil',
    regional_dex_id: 10,
    types: ['fire'],
    stats: { hp: 39, attack: 52, defense: 43, special_attack: 60, special_defense: 50, speed: 65 },
    evolutions: [{ level: 14, to: 156 }],
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 3, move: 'leer' },
      { level: 6, move: 'smokescreen' },
      { level: 8, move: 'ember' },
      { level: 12, move: 'quick_attack' },
      { level: 15, move: 'flame_wheel' },
      { level: 20, move: 'swift' },
      { level: 27, move: 'flamethrower' }
    ]
  },
  156: {
    id: 156,
    name: 'Quilava',
    regional_dex_id: 11,
    types: ['fire'],
    stats: { hp: 58, attack: 64, defense: 58, special_attack: 80, special_defense: 65, speed: 80 },
    evolutions: [{ level: 36, to: 157 }],
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 8, move: 'ember' },
      { level: 15, move: 'flame_wheel' },
      { level: 22, move: 'swift' },
      { level: 29, move: 'flamethrower' },
      { level: 37, move: 'lava_plume' }
    ]
  },
  157: {
    id: 157,
    name: 'Typhlosion',
    regional_dex_id: 12,
    types: ['fire'],
    stats: { hp: 78, attack: 84, defense: 78, special_attack: 109, special_defense: 85, speed: 100 },
    learnset: [
      { level: 1, move: 'flame_wheel' },
      { level: 36, move: 'lava_plume' },
      { level: 44, move: 'flamethrower' },
      { level: 53, move: 'eruption' },
      { level: 60, move: 'focus_blast' }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. INICIALES — AGUA
  // ─────────────────────────────────────────────────────────────────────────────
  7: {
    id: 7,
    name: 'Squirtle',
    regional_dex_id: 13,
    types: ['water'],
    stats: { hp: 44, attack: 48, defense: 65, special_attack: 50, special_defense: 64, speed: 43 },
    evolutions: [{ level: 16, to: 8 }],
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 3, move: 'tail_whip' },
      { level: 6, move: 'water_gun' },
      { level: 9, move: 'withdraw' },
      { level: 12, move: 'bubble' },
      { level: 15, move: 'bite' },
      { level: 18, move: 'water_pulse' },
      { level: 24, move: 'surf' }
    ]
  },
  8: {
    id: 8,
    name: 'Wartortle',
    regional_dex_id: 14,
    types: ['water'],
    stats: { hp: 59, attack: 63, defense: 80, special_attack: 65, special_defense: 80, speed: 58 },
    evolutions: [{ level: 36, to: 9 }],
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'water_gun' },
      { level: 12, move: 'bubble' },
      { level: 16, move: 'bite' },
      { level: 21, move: 'water_pulse' },
      { level: 27, move: 'protect' },
      { level: 33, move: 'aqua_tail' }
    ]
  },
  9: {
    id: 9,
    name: 'Blastoise',
    regional_dex_id: 15,
    types: ['water'],
    stats: { hp: 79, attack: 83, defense: 100, special_attack: 85, special_defense: 105, speed: 78 },
    learnset: [
      { level: 1, move: 'water_gun' },
      { level: 1, move: 'bite' },
      { level: 36, move: 'flash_cannon' },
      { level: 42, move: 'surf' },
      { level: 49, move: 'ice_beam' },
      { level: 56, move: 'hydro_pump' }
    ]
  },
  258: {
    id: 258,
    name: 'Mudkip',
    regional_dex_id: 16,
    types: ['water'],
    stats: { hp: 50, attack: 70, defense: 50, special_attack: 50, special_defense: 50, speed: 40 },
    evolutions: [{ level: 16, to: 259 }],
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 3, move: 'growl' },
      { level: 6, move: 'mud_slap' },
      { level: 9, move: 'water_gun' },
      { level: 12, move: 'rock_throw' },
      { level: 18, move: 'water_pulse' }
    ]
  },
  259: {
    id: 259,
    name: 'Marshtomp',
    regional_dex_id: 17,
    types: ['water', 'ground'],
    stats: { hp: 70, attack: 85, defense: 70, special_attack: 60, special_defense: 70, speed: 50 },
    evolutions: [{ level: 36, to: 260 }],
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 9, move: 'water_gun' },
      { level: 16, move: 'mud_shot' },
      { level: 22, move: 'rock_slide' },
      { level: 28, move: 'waterfall' },
      { level: 35, move: 'earthquake' }
    ]
  },
  260: {
    id: 260,
    name: 'Swampert',
    regional_dex_id: 18,
    types: ['water', 'ground'],
    stats: { hp: 100, attack: 110, defense: 90, special_attack: 85, special_defense: 90, speed: 60 },
    learnset: [
      { level: 1, move: 'mud_shot' },
      { level: 1, move: 'waterfall' },
      { level: 36, move: 'hammer_arm' },
      { level: 44, move: 'earthquake' },
      { level: 52, move: 'ice_punch' },
      { level: 60, move: 'superpower' }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. RUTAS TEMPRANAS & PRADERAS (Ruta 1, Ruta 2, Villa Tranquimar)
  // ─────────────────────────────────────────────────────────────────────────────
  16: {
    id: 16,
    name: 'Pidgey',
    regional_dex_id: 19,
    types: ['normal', 'flying'],
    stats: { hp: 40, attack: 45, defense: 40, special_attack: 35, special_defense: 35, speed: 56 },
    evolutions: [{ level: 18, to: 17 }],
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 3, move: 'sand_attack' },
      { level: 6, move: 'gust' },
      { level: 9, move: 'quick_attack' },
      { level: 13, move: 'whirlwind' },
      { level: 17, move: 'twister' }
    ]
  },
  17: {
    id: 17,
    name: 'Pidgeotto',
    regional_dex_id: 20,
    types: ['normal', 'flying'],
    stats: { hp: 63, attack: 60, defense: 55, special_attack: 50, special_defense: 50, speed: 71 },
    evolutions: [{ level: 36, to: 18 }],
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 6, move: 'gust' },
      { level: 9, move: 'quick_attack' },
      { level: 18, move: 'wing_attack' },
      { level: 25, move: 'roost' },
      { level: 32, move: 'aerial_ace' }
    ]
  },
  18: {
    id: 18,
    name: 'Pidgeot',
    regional_dex_id: 21,
    types: ['normal', 'flying'],
    stats: { hp: 83, attack: 80, defense: 75, special_attack: 70, special_defense: 70, speed: 101 },
    learnset: [
      { level: 1, move: 'wing_attack' },
      { level: 36, move: 'air_slash' },
      { level: 44, move: 'roost' },
      { level: 52, move: 'hurricane' },
      { level: 60, move: 'brave_bird' }
    ]
  },
  19: {
    id: 19,
    name: 'Rattata',
    regional_dex_id: 22,
    types: ['normal'],
    stats: { hp: 30, attack: 56, defense: 35, special_attack: 25, special_defense: 35, speed: 72 },
    evolutions: [{ level: 20, to: 20 }],
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 3, move: 'tail_whip' },
      { level: 6, move: 'quick_attack' },
      { level: 9, move: 'bite' },
      { level: 14, move: 'hyper_fang' },
      { level: 19, move: 'crunch' }
    ]
  },
  58: {
    id: 58,
    name: 'Growlithe',
    regional_dex_id: 23,
    types: ['fire'],
    stats: { hp: 55, attack: 70, defense: 45, special_attack: 70, special_defense: 50, speed: 60 },
    evolutions: [{ item: 'fire_stone', to: 59 }],
    learnset: [
      { level: 1, move: 'bite' },
      { level: 1, move: 'roar' },
      { level: 4, move: 'ember' },
      { level: 8, move: 'leer' },
      { level: 12, move: 'flame_wheel' },
      { level: 17, move: 'take_down' },
      { level: 23, move: 'flame_burst' },
      { level: 28, move: 'flamethrower' },
      { level: 34, move: 'crunch' },
      { level: 40, move: 'flare_blitz' }
    ]
  },
  59: {
    id: 59,
    name: 'Arcanine',
    regional_dex_id: 24,
    types: ['fire'],
    stats: { hp: 90, attack: 110, defense: 80, special_attack: 100, special_defense: 80, speed: 95 },
    learnset: [
      { level: 1, move: 'flame_wheel' },
      { level: 1, move: 'bite' },
      { level: 1, move: 'extreme_speed' },
      { level: 34, move: 'crunch' },
      { level: 42, move: 'flamethrower' },
      { level: 50, move: 'wild_charge' },
      { level: 58, move: 'flare_blitz' }
    ]
  },
  25: {
    id: 25,
    name: 'Pikachu',
    regional_dex_id: 25,
    types: ['electric'],
    stats: { hp: 35, attack: 55, defense: 40, special_attack: 50, special_defense: 50, speed: 90 },
    evolutions: [{ item: 'thunder_stone', to: 26 }],
    learnset: [
      { level: 1, move: 'thunder_shock' },
      { level: 1, move: 'growl' },
      { level: 4, move: 'tail_whip' },
      { level: 7, move: 'quick_attack' },
      { level: 10, move: 'thunder_wave' },
      { level: 14, move: 'spark' },
      { level: 19, move: 'nuzzle' },
      { level: 24, move: 'electro_ball' },
      { level: 30, move: 'thunderbolt' }
    ]
  },
  26: {
    id: 26,
    name: 'Raichu',
    regional_dex_id: 26,
    types: ['electric'],
    stats: { hp: 60, attack: 90, defense: 55, special_attack: 90, special_defense: 80, speed: 110 },
    learnset: [
      { level: 1, move: 'spark' },
      { level: 1, move: 'quick_attack' },
      { level: 1, move: 'thunderbolt' },
      { level: 38, move: 'volt_switch' },
      { level: 46, move: 'focus_blast' },
      { level: 54, move: 'thunder' }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. LÍNEAS DE EVOLUCIÓN OFFLINE (CORDÓN UNIÓN / LINK CABLE & OBJETOS)
  // ─────────────────────────────────────────────────────────────────────────────
  63: {
    id: 63,
    name: 'Abra',
    regional_dex_id: 27,
    types: ['psychic'],
    stats: { hp: 25, attack: 20, defense: 15, special_attack: 105, special_defense: 55, speed: 90 },
    evolutions: [{ level: 16, to: 64 }],
    learnset: [
      { level: 1, move: 'teleport' }
    ]
  },
  64: {
    id: 64,
    name: 'Kadabra',
    regional_dex_id: 28,
    types: ['psychic'],
    stats: { hp: 40, attack: 35, defense: 30, special_attack: 120, special_defense: 70, speed: 105 },
    evolutions: [{ item: 'link_cable', to: 65 }, { level: 38, to: 65 }],
    learnset: [
      { level: 1, move: 'teleport' },
      { level: 16, move: 'confusion' },
      { level: 20, move: 'disable' },
      { level: 25, move: 'psybeam' },
      { level: 30, move: 'reflect' },
      { level: 36, move: 'psychic' },
      { level: 42, move: 'shadow_ball' }
    ]
  },
  65: {
    id: 65,
    name: 'Alakazam',
    regional_dex_id: 29,
    types: ['psychic'],
    stats: { hp: 55, attack: 50, defense: 45, special_attack: 135, special_defense: 95, speed: 120 },
    learnset: [
      { level: 1, move: 'confusion' },
      { level: 1, move: 'psybeam' },
      { level: 36, move: 'psychic' },
      { level: 44, move: 'shadow_ball' },
      { level: 52, move: 'focus_blast' },
      { level: 60, move: 'calm_mind' }
    ]
  },
  66: {
    id: 66,
    name: 'Machop',
    regional_dex_id: 30,
    types: ['fighting'],
    stats: { hp: 70, attack: 80, defense: 50, special_attack: 35, special_defense: 35, speed: 35 },
    evolutions: [{ level: 28, to: 67 }],
    learnset: [
      { level: 1, move: 'low_kick' },
      { level: 1, move: 'leer' },
      { level: 5, move: 'focus_energy' },
      { level: 9, move: 'karate_chop' },
      { level: 13, move: 'low_sweep' },
      { level: 19, move: 'seismic_toss' },
      { level: 25, move: 'vital_throw' }
    ]
  },
  67: {
    id: 67,
    name: 'Machoke',
    regional_dex_id: 31,
    types: ['fighting'],
    stats: { hp: 80, attack: 100, defense: 70, special_attack: 50, special_defense: 60, speed: 45 },
    evolutions: [{ item: 'link_cable', to: 68 }, { level: 38, to: 68 }],
    learnset: [
      { level: 1, move: 'low_kick' },
      { level: 1, move: 'karate_chop' },
      { level: 28, move: 'brick_break' },
      { level: 34, move: 'bulk_up' },
      { level: 40, move: 'cross_chop' },
      { level: 48, move: 'dynamic_punch' }
    ]
  },
  68: {
    id: 68,
    name: 'Machamp',
    regional_dex_id: 32,
    types: ['fighting'],
    stats: { hp: 90, attack: 130, defense: 80, special_attack: 65, special_defense: 85, speed: 55 },
    learnset: [
      { level: 1, move: 'karate_chop' },
      { level: 1, move: 'brick_break' },
      { level: 38, move: 'cross_chop' },
      { level: 46, move: 'close_combat' },
      { level: 54, move: 'stone_edge' },
      { level: 62, move: 'bullet_punch' }
    ]
  },
  74: {
    id: 74,
    name: 'Geodude',
    regional_dex_id: 33,
    types: ['rock', 'ground'],
    stats: { hp: 40, attack: 80, defense: 100, special_attack: 30, special_defense: 30, speed: 20 },
    evolutions: [{ level: 25, to: 75 }],
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'defense_curl' },
      { level: 4, move: 'mud_sport' },
      { level: 6, move: 'rock_polish' },
      { level: 9, move: 'rock_throw' },
      { level: 12, move: 'magnitude' },
      { level: 16, move: 'rollout' },
      { level: 21, move: 'rock_blast' }
    ]
  },
  75: {
    id: 75,
    name: 'Graveler',
    regional_dex_id: 34,
    types: ['rock', 'ground'],
    stats: { hp: 55, attack: 95, defense: 115, special_attack: 45, special_defense: 45, speed: 35 },
    evolutions: [{ item: 'link_cable', to: 76 }, { level: 38, to: 76 }],
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 9, move: 'rock_throw' },
      { level: 16, move: 'rollout' },
      { level: 25, move: 'rock_slide' },
      { level: 31, move: 'earthquake' },
      { level: 38, move: 'stone_edge' }
    ]
  },
  76: {
    id: 76,
    name: 'Golem',
    regional_dex_id: 35,
    types: ['rock', 'ground'],
    stats: { hp: 80, attack: 120, defense: 130, special_attack: 55, special_defense: 65, speed: 45 },
    learnset: [
      { level: 1, move: 'rock_throw' },
      { level: 25, move: 'rock_slide' },
      { level: 38, move: 'earthquake' },
      { level: 46, move: 'stone_edge' },
      { level: 55, move: 'heavy_slam' }
    ]
  },
  92: {
    id: 92,
    name: 'Gastly',
    regional_dex_id: 36,
    types: ['ghost', 'poison'],
    stats: { hp: 30, attack: 35, defense: 30, special_attack: 100, special_defense: 35, speed: 80 },
    evolutions: [{ level: 25, to: 93 }],
    learnset: [
      { level: 1, move: 'hypnosis' },
      { level: 1, move: 'lick' },
      { level: 5, move: 'spite' },
      { level: 8, move: 'mean_look' },
      { level: 12, move: 'curse' },
      { level: 15, move: 'night_shade' },
      { level: 19, move: 'confuse_ray' },
      { level: 22, move: 'sucker_punch' },
      { level: 26, move: 'shadow_ball' }
    ]
  },
  93: {
    id: 93,
    name: 'Haunter',
    regional_dex_id: 37,
    types: ['ghost', 'poison'],
    stats: { hp: 45, attack: 50, defense: 45, special_attack: 115, special_defense: 55, speed: 95 },
    evolutions: [{ item: 'link_cable', to: 94 }, { level: 38, to: 94 }],
    learnset: [
      { level: 1, move: 'lick' },
      { level: 15, move: 'night_shade' },
      { level: 22, move: 'sucker_punch' },
      { level: 25, move: 'shadow_punch' },
      { level: 31, move: 'shadow_ball' },
      { level: 38, move: 'dark_pulse' },
      { level: 45, move: 'destiny_bond' }
    ]
  },
  94: {
    id: 94,
    name: 'Gengar',
    regional_dex_id: 38,
    types: ['ghost', 'poison'],
    stats: { hp: 60, attack: 65, defense: 60, special_attack: 130, special_defense: 75, speed: 110 },
    learnset: [
      { level: 1, move: 'shadow_punch' },
      { level: 31, move: 'shadow_ball' },
      { level: 38, move: 'sludge_bomb' },
      { level: 46, move: 'dark_pulse' },
      { level: 55, move: 'thunderbolt' },
      { level: 62, move: 'destiny_bond' }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. CORDÓN ANDINO, PSEUDO-LEGENDARIOS & COMPAÑEROS CLAVE
  // ─────────────────────────────────────────────────────────────────────────────
  443: {
    id: 443,
    name: 'Gible',
    regional_dex_id: 39,
    types: ['dragon', 'ground'],
    stats: { hp: 58, attack: 70, defense: 45, special_attack: 40, special_defense: 45, speed: 42 },
    evolutions: [{ level: 24, to: 444 }],
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 3, move: 'sand_attack' },
      { level: 7, move: 'dragon_rage' },
      { level: 12, move: 'sand_tomb' },
      { level: 16, move: 'slash' },
      { level: 21, move: 'dragon_claw' },
      { level: 27, move: 'dig' }
    ]
  },
  444: {
    id: 444,
    name: 'Gabite',
    regional_dex_id: 40,
    types: ['dragon', 'ground'],
    stats: { hp: 68, attack: 90, defense: 65, special_attack: 50, special_defense: 55, speed: 82 },
    evolutions: [{ level: 48, to: 445 }],
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 16, move: 'slash' },
      { level: 24, move: 'dragon_claw' },
      { level: 31, move: 'dig' },
      { level: 38, move: 'crunch' },
      { level: 45, move: 'dragon_rush' }
    ]
  },
  445: {
    id: 445,
    name: 'Garchomp',
    regional_dex_id: 41,
    types: ['dragon', 'ground'],
    stats: { hp: 108, attack: 130, defense: 95, special_attack: 80, special_defense: 85, speed: 102 },
    learnset: [
      { level: 1, move: 'dragon_claw' },
      { level: 1, move: 'crunch' },
      { level: 48, move: 'earthquake' },
      { level: 56, move: 'dragon_rush' },
      { level: 64, move: 'stone_edge' },
      { level: 72, move: 'outrage' }
    ]
  },
  123: {
    id: 123,
    name: 'Scyther',
    regional_dex_id: 42,
    types: ['bug', 'flying'],
    stats: { hp: 70, attack: 110, defense: 80, special_attack: 55, special_defense: 80, speed: 105 },
    evolutions: [{ item: 'metal_coat', to: 212 }],
    learnset: [
      { level: 1, move: 'quick_attack' },
      { level: 1, move: 'leer' },
      { level: 5, move: 'focus_energy' },
      { level: 9, move: 'pursuit' },
      { level: 13, move: 'false_swipe' },
      { level: 17, move: 'wing_attack' },
      { level: 21, move: 'fury_cutter' },
      { level: 26, move: 'slash' },
      { level: 32, move: 'x_scissor' },
      { level: 40, move: 'swords_dance' }
    ]
  },
  212: {
    id: 212,
    name: 'Scizor',
    regional_dex_id: 43,
    types: ['bug', 'steel'],
    stats: { hp: 70, attack: 130, defense: 100, special_attack: 55, special_defense: 80, speed: 65 },
    learnset: [
      { level: 1, move: 'bullet_punch' },
      { level: 1, move: 'quick_attack' },
      { level: 21, move: 'metal_claw' },
      { level: 32, move: 'x_scissor' },
      { level: 40, move: 'iron_head' },
      { level: 48, move: 'swords_dance' },
      { level: 56, move: 'close_combat' }
    ]
  },
  95: {
    id: 95,
    name: 'Onix',
    regional_dex_id: 44,
    types: ['rock', 'ground'],
    stats: { hp: 35, attack: 45, defense: 160, special_attack: 30, special_defense: 45, speed: 70 },
    evolutions: [{ item: 'metal_coat', to: 208 }],
    learnset: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'harden' },
      { level: 4, move: 'mud_sport' },
      { level: 7, move: 'rock_throw' },
      { level: 10, move: 'rage' },
      { level: 14, move: 'rock_tomb' },
      { level: 19, move: 'screech' },
      { level: 24, move: 'rock_slide' }
    ]
  },
  208: {
    id: 208,
    name: 'Steelix',
    regional_dex_id: 45,
    types: ['steel', 'ground'],
    stats: { hp: 75, attack: 85, defense: 200, special_attack: 55, special_defense: 65, speed: 30 },
    learnset: [
      { level: 1, move: 'iron_tail' },
      { level: 1, move: 'rock_throw' },
      { level: 24, move: 'rock_slide' },
      { level: 32, move: 'iron_head' },
      { level: 40, move: 'earthquake' },
      { level: 48, move: 'stone_edge' }
    ]
  },
  448: {
    id: 448,
    name: 'Lucario',
    regional_dex_id: 46,
    types: ['fighting', 'steel'],
    stats: { hp: 70, attack: 110, defense: 70, special_attack: 115, special_defense: 70, speed: 90 },
    learnset: [
      { level: 1, move: 'quick_attack' },
      { level: 1, move: 'force_palm' },
      { level: 24, move: 'bone_rush' },
      { level: 32, move: 'aura_sphere' },
      { level: 40, move: 'flash_cannon' },
      { level: 48, move: 'close_combat' },
      { level: 56, move: 'extreme_speed' }
    ]
  }
};
