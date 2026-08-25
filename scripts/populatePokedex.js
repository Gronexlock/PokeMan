const fs = require('fs');
const path = require('path');

const pokedexPath = path.join(__dirname, '..', 'public', 'data', 'pokedex.json');
let pokedex = {};
try {
  pokedex = JSON.parse(fs.readFileSync(pokedexPath, 'utf8'));
} catch (e) {
  pokedex = {};
}

const missingEntries = {
  // Gen 1 Starters & Evolutions
  "1": {
    "id": 1,
    "name": "Bulbasaur",
    "types": ["grass", "poison"],
    "stats": { "hp": 45, "attack": 49, "defense": 49, "special_attack": 65, "special_defense": 65, "speed": 45 },
    "evolution": { "target_id": 2, "target_name": "Ivysaur", "method": "level", "level": 16 },
    "learnset": [
      { "move": "tackle", "level": 1 },
      { "move": "growl", "level": 1 },
      { "move": "vine_whip", "level": 3 },
      { "move": "growth", "level": 7 },
      { "move": "razor_leaf", "level": 12 },
      { "move": "poison_powder", "level": 15 },
      { "move": "seed_bomb", "level": 20 }
    ]
  },
  "2": {
    "id": 2,
    "name": "Ivysaur",
    "types": ["grass", "poison"],
    "stats": { "hp": 60, "attack": 62, "defense": 63, "special_attack": 80, "special_defense": 80, "speed": 60 },
    "evolution": { "target_id": 3, "target_name": "Venusaur", "method": "level", "level": 32 },
    "learnset": [
      { "move": "tackle", "level": 1 },
      { "move": "vine_whip", "level": 1 },
      { "move": "razor_leaf", "level": 12 },
      { "move": "seed_bomb", "level": 20 },
      { "move": "sludge_bomb", "level": 25 },
      { "move": "solar_beam", "level": 35 }
    ]
  },
  "3": {
    "id": 3,
    "name": "Venusaur",
    "types": ["grass", "poison"],
    "stats": { "hp": 80, "attack": 82, "defense": 83, "special_attack": 100, "special_defense": 100, "speed": 80 },
    "learnset": [
      { "move": "giga_drain", "level": 1 },
      { "move": "sludge_bomb", "level": 1 },
      { "move": "earthquake", "level": 1 },
      { "move": "energy_ball", "level": 1 },
      { "move": "solar_beam", "level": 40 }
    ]
  },
  "4": {
    "id": 4,
    "name": "Charmander",
    "types": ["fire"],
    "stats": { "hp": 39, "attack": 52, "defense": 43, "special_attack": 60, "special_defense": 50, "speed": 65 },
    "evolution": { "target_id": 5, "target_name": "Charmeleon", "method": "level", "level": 16 },
    "learnset": [
      { "move": "scratch", "level": 1 },
      { "move": "growl", "level": 1 },
      { "move": "ember", "level": 4 },
      { "move": "smokescreen", "level": 8 },
      { "move": "dragon_breath", "level": 12 },
      { "move": "fire_fang", "level": 17 },
      { "move": "flamethrower", "level": 24 }
    ]
  },
  "5": {
    "id": 5,
    "name": "Charmeleon",
    "types": ["fire"],
    "stats": { "hp": 58, "attack": 64, "defense": 58, "special_attack": 80, "special_defense": 65, "speed": 80 },
    "evolution": { "target_id": 6, "target_name": "Charizard", "method": "level", "level": 36 },
    "learnset": [
      { "move": "scratch", "level": 1 },
      { "move": "ember", "level": 1 },
      { "move": "dragon_breath", "level": 12 },
      { "move": "fire_fang", "level": 17 },
      { "move": "flamethrower", "level": 24 },
      { "move": "slash", "level": 28 }
    ]
  },
  "6": {
    "id": 6,
    "name": "Charizard",
    "types": ["fire", "flying"],
    "stats": { "hp": 78, "attack": 84, "defense": 78, "special_attack": 109, "special_defense": 85, "speed": 100 },
    "learnset": [
      { "move": "flamethrower", "level": 1 },
      { "move": "air_slash", "level": 1 },
      { "move": "dragon_claw", "level": 1 },
      { "move": "fire_blast", "level": 45 }
    ]
  },
  "7": {
    "id": 7,
    "name": "Squirtle",
    "types": ["water"],
    "stats": { "hp": 44, "attack": 48, "defense": 65, "special_attack": 50, "special_defense": 64, "speed": 43 },
    "evolution": { "target_id": 8, "target_name": "Wartortle", "method": "level", "level": 16 },
    "learnset": [
      { "move": "tackle", "level": 1 },
      { "move": "tail_whip", "level": 1 },
      { "move": "water_gun", "level": 3 },
      { "move": "withdraw", "level": 6 },
      { "move": "bubble_beam", "level": 12 },
      { "move": "bite", "level": 16 },
      { "move": "surf", "level": 22 }
    ]
  },
  "8": {
    "id": 8,
    "name": "Wartortle",
    "types": ["water"],
    "stats": { "hp": 59, "attack": 63, "defense": 80, "special_attack": 65, "special_defense": 80, "speed": 58 },
    "evolution": { "target_id": 9, "target_name": "Blastoise", "method": "level", "level": 36 },
    "learnset": [
      { "move": "tackle", "level": 1 },
      { "move": "water_gun", "level": 1 },
      { "move": "bubble_beam", "level": 12 },
      { "move": "bite", "level": 16 },
      { "move": "waterfall", "level": 25 },
      { "move": "hydro_pump", "level": 35 }
    ]
  },
  "9": {
    "id": 9,
    "name": "Blastoise",
    "types": ["water"],
    "stats": { "hp": 79, "attack": 83, "defense": 100, "special_attack": 85, "special_defense": 105, "speed": 78 },
    "learnset": [
      { "move": "hydro_pump", "level": 1 },
      { "move": "ice_beam", "level": 1 },
      { "move": "aura_sphere", "level": 1 },
      { "move": "flash_cannon", "level": 1 }
    ]
  },

  // Common Wild & Route 1-2 Pokémon
  "10": {
    "id": 10,
    "name": "Caterpie",
    "types": ["bug"],
    "stats": { "hp": 45, "attack": 30, "defense": 35, "special_attack": 20, "special_defense": 20, "speed": 45 },
    "evolution": { "target_id": 11, "target_name": "Metapod", "method": "level", "level": 7 },
    "learnset": [
      { "move": "tackle", "level": 1 },
      { "move": "string_shot", "level": 1 },
      { "move": "bug_bite", "level": 5 }
    ]
  },
  "11": {
    "id": 11,
    "name": "Metapod",
    "types": ["bug"],
    "stats": { "hp": 50, "attack": 25, "defense": 55, "special_attack": 25, "special_defense": 25, "speed": 30 },
    "evolution": { "target_id": 12, "target_name": "Butterfree", "method": "level", "level": 10 },
    "learnset": [
      { "move": "harden", "level": 1 },
      { "move": "tackle", "level": 7 }
    ]
  },
  "12": {
    "id": 12,
    "name": "Butterfree",
    "types": ["bug", "flying"],
    "stats": { "hp": 60, "attack": 45, "defense": 50, "special_attack": 90, "special_defense": 80, "speed": 70 },
    "learnset": [
      { "move": "gust", "level": 1 },
      { "move": "confusion", "level": 1 },
      { "move": "poison_powder", "level": 6 },
      { "move": "sleep_powder", "level": 12 },
      { "move": "bug_buzz", "level": 18 },
      { "move": "air_slash", "level": 24 }
    ]
  },
  "16": {
    "id": 16,
    "name": "Pidgey",
    "types": ["normal", "flying"],
    "stats": { "hp": 40, "attack": 45, "defense": 40, "special_attack": 35, "special_defense": 35, "speed": 56 },
    "evolution": { "target_id": 17, "target_name": "Pidgeotto", "method": "level", "level": 18 },
    "learnset": [
      { "move": "tackle", "level": 1 },
      { "move": "sand_attack", "level": 3 },
      { "move": "gust", "level": 5 },
      { "move": "quick_attack", "level": 9 },
      { "move": "wing_attack", "level": 15 }
    ]
  },
  "19": {
    "id": 19,
    "name": "Rattata",
    "types": ["normal"],
    "stats": { "hp": 30, "attack": 56, "defense": 35, "special_attack": 25, "special_defense": 35, "speed": 72 },
    "evolution": { "target_id": 20, "target_name": "Raticate", "method": "level", "level": 20 },
    "learnset": [
      { "move": "tackle", "level": 1 },
      { "move": "tail_whip", "level": 1 },
      { "move": "quick_attack", "level": 4 },
      { "move": "bite", "level": 7 },
      { "move": "hyper_fang", "level": 14 }
    ]
  },
  "25": {
    "id": 25,
    "name": "Pikachu",
    "types": ["electric"],
    "stats": { "hp": 35, "attack": 55, "defense": 40, "special_attack": 50, "special_defense": 50, "speed": 90 },
    "evolution": { "target_id": 26, "target_name": "Raichu", "method": "item", "item": "thunder_stone" },
    "learnset": [
      { "move": "thunder_shock", "level": 1 },
      { "move": "growl", "level": 1 },
      { "move": "quick_attack", "level": 5 },
      { "move": "spark", "level": 10 },
      { "move": "thunderbolt", "level": 20 }
    ]
  },
  "26": {
    "id": 26,
    "name": "Raichu",
    "types": ["electric"],
    "stats": { "hp": 60, "attack": 90, "defense": 55, "special_attack": 90, "special_defense": 80, "speed": 110 },
    "learnset": [
      { "move": "thunderbolt", "level": 1 },
      { "move": "volt_switch", "level": 1 },
      { "move": "extreme_speed", "level": 1 },
      { "move": "focus_blast", "level": 30 }
    ]
  },
  "27": {
    "id": 27,
    "name": "Sandshrew",
    "types": ["ground"],
    "stats": { "hp": 50, "attack": 75, "defense": 85, "special_attack": 20, "special_defense": 30, "speed": 40 },
    "evolution": { "target_id": 28, "target_name": "Sandslash", "method": "level", "level": 22 },
    "learnset": [
      { "move": "scratch", "level": 1 },
      { "move": "defense_curl", "level": 1 },
      { "move": "sand_attack", "level": 3 },
      { "move": "poison_sting", "level": 5 },
      { "move": "rollout", "level": 9 },
      { "move": "bulldoze", "level": 14 }
    ]
  },
  "43": {
    "id": 43,
    "name": "Oddish",
    "types": ["grass", "poison"],
    "stats": { "hp": 45, "attack": 50, "defense": 55, "special_attack": 75, "special_defense": 65, "speed": 30 },
    "evolution": { "target_id": 44, "target_name": "Gloom", "method": "level", "level": 21 },
    "learnset": [
      { "move": "absorb", "level": 1 },
      { "move": "growth", "level": 1 },
      { "move": "sweet_scent", "level": 5 },
      { "move": "acid", "level": 9 },
      { "move": "mega_drain", "level": 14 },
      { "move": "sleep_powder", "level": 18 }
    ]
  },
  "45": {
    "id": 45,
    "name": "Vileplume",
    "types": ["grass", "poison"],
    "stats": { "hp": 75, "attack": 80, "defense": 85, "special_attack": 110, "special_defense": 90, "speed": 50 },
    "learnset": [
      { "move": "giga_drain", "level": 1 },
      { "move": "sludge_bomb", "level": 1 },
      { "move": "moonblast", "level": 1 },
      { "move": "energy_ball", "level": 1 }
    ]
  },
  "60": {
    "id": 60,
    "name": "Poliwag",
    "types": ["water"],
    "stats": { "hp": 40, "attack": 50, "defense": 40, "special_attack": 40, "special_defense": 40, "speed": 90 },
    "evolution": { "target_id": 61, "target_name": "Poliwhirl", "method": "level", "level": 25 },
    "learnset": [
      { "move": "water_gun", "level": 1 },
      { "move": "hypnosis", "level": 1 },
      { "move": "pound", "level": 4 },
      { "move": "bubble_beam", "level": 11 },
      { "move": "rain_dance", "level": 18 }
    ]
  },
  "62": {
    "id": 62,
    "name": "Poliwrath",
    "types": ["water", "fighting"],
    "stats": { "hp": 90, "attack": 95, "defense": 95, "special_attack": 70, "special_defense": 90, "speed": 70 },
    "learnset": [
      { "move": "waterfall", "level": 1 },
      { "move": "close_combat", "level": 1 },
      { "move": "ice_punch", "level": 1 },
      { "move": "body_slam", "level": 1 }
    ]
  },
  "64": {
    "id": 64,
    "name": "Kadabra",
    "types": ["psychic"],
    "stats": { "hp": 40, "attack": 35, "defense": 30, "special_attack": 120, "special_defense": 70, "speed": 105 },
    "evolution": { "target_id": 65, "target_name": "Alakazam", "method": "level", "level": 36 },
    "learnset": [
      { "move": "confusion", "level": 1 },
      { "move": "teleport", "level": 1 },
      { "move": "psybeam", "level": 16 },
      { "move": "psychic", "level": 28 },
      { "move": "shadow_ball", "level": 32 }
    ]
  },
  "65": {
    "id": 65,
    "name": "Alakazam",
    "types": ["psychic"],
    "stats": { "hp": 55, "attack": 50, "defense": 45, "special_attack": 135, "special_defense": 95, "speed": 120 },
    "learnset": [
      { "move": "psychic", "level": 1 },
      { "move": "shadow_ball", "level": 1 },
      { "move": "calm_mind", "level": 1 },
      { "move": "energy_ball", "level": 1 }
    ]
  },
  "68": {
    "id": 68,
    "name": "Machamp",
    "types": ["fighting"],
    "stats": { "hp": 90, "attack": 130, "defense": 80, "special_attack": 65, "special_defense": 85, "speed": 55 },
    "learnset": [
      { "move": "close_combat", "level": 1 },
      { "move": "stone_edge", "level": 1 },
      { "move": "knock_off", "level": 1 },
      { "move": "bullet_punch", "level": 1 }
    ]
  },
  "73": {
    "id": 73,
    "name": "Tentacruel",
    "types": ["water", "poison"],
    "stats": { "hp": 80, "attack": 70, "defense": 65, "special_attack": 80, "special_defense": 120, "speed": 100 },
    "learnset": [
      { "move": "scald", "level": 1 },
      { "move": "sludge_bomb", "level": 1 },
      { "move": "ice_beam", "level": 1 },
      { "move": "toxic_spikes", "level": 1 }
    ]
  },
  "74": {
    "id": 74,
    "name": "Geodude",
    "types": ["rock", "ground"],
    "stats": { "hp": 40, "attack": 80, "defense": 100, "special_attack": 30, "special_defense": 30, "speed": 20 },
    "evolution": { "target_id": 75, "target_name": "Graveler", "method": "level", "level": 25 },
    "learnset": [
      { "move": "tackle", "level": 1 },
      { "move": "defense_curl", "level": 1 },
      { "move": "rock_throw", "level": 4 },
      { "move": "bulldoze", "level": 10 },
      { "move": "rock_slide", "level": 16 },
      { "move": "earthquake", "level": 26 }
    ]
  },
  "93": {
    "id": 93,
    "name": "Haunter",
    "types": ["ghost", "poison"],
    "stats": { "hp": 45, "attack": 50, "defense": 45, "special_attack": 115, "special_defense": 55, "speed": 95 },
    "evolution": { "target_id": 94, "target_name": "Gengar", "method": "level", "level": 36 },
    "learnset": [
      { "move": "shadow_ball", "level": 1 },
      { "move": "sludge_bomb", "level": 1 },
      { "move": "will_o_wisp", "level": 1 },
      { "move": "hypnosis", "level": 1 }
    ]
  },
  "94": {
    "id": 94,
    "name": "Gengar",
    "types": ["ghost", "poison"],
    "stats": { "hp": 60, "attack": 65, "defense": 60, "special_attack": 130, "special_defense": 75, "speed": 110 },
    "learnset": [
      { "move": "shadow_ball", "level": 1 },
      { "move": "sludge_bomb", "level": 1 },
      { "move": "dazzling_gleam", "level": 1 },
      { "move": "thunderbolt", "level": 1 }
    ]
  },
  "123": {
    "id": 123,
    "name": "Scyther",
    "types": ["bug", "flying"],
    "stats": { "hp": 70, "attack": 110, "defense": 80, "special_attack": 55, "special_defense": 80, "speed": 105 },
    "evolution": { "target_id": 212, "target_name": "Scizor", "method": "item", "item": "metal_coat" },
    "learnset": [
      { "move": "quick_attack", "level": 1 },
      { "move": "leer", "level": 1 },
      { "move": "fury_cutter", "level": 5 },
      { "move": "wing_attack", "level": 12 },
      { "move": "slash", "level": 16 },
      { "move": "x_scissor", "level": 22 },
      { "move": "swords_dance", "level": 30 }
    ]
  },
  "129": {
    "id": 129,
    "name": "Magikarp",
    "types": ["water"],
    "stats": { "hp": 20, "attack": 10, "defense": 55, "special_attack": 15, "special_defense": 20, "speed": 80 },
    "evolution": { "target_id": 130, "target_name": "Gyarados", "method": "level", "level": 20 },
    "learnset": [
      { "move": "splash", "level": 1 },
      { "move": "tackle", "level": 5 },
      { "move": "flail", "level": 15 }
    ]
  },
  "130": {
    "id": 130,
    "name": "Gyarados",
    "types": ["water", "flying"],
    "stats": { "hp": 95, "attack": 125, "defense": 79, "special_attack": 60, "special_defense": 100, "speed": 81 },
    "learnset": [
      { "move": "waterfall", "level": 1 },
      { "move": "crunch", "level": 1 },
      { "move": "dragon_dance", "level": 1 },
      { "move": "earthquake", "level": 1 }
    ]
  },
  "134": {
    "id": 134,
    "name": "Vaporeon",
    "types": ["water"],
    "stats": { "hp": 130, "attack": 65, "defense": 60, "special_attack": 110, "special_defense": 95, "speed": 65 },
    "learnset": [
      { "move": "scald", "level": 1 },
      { "move": "ice_beam", "level": 1 },
      { "move": "quick_attack", "level": 1 },
      { "move": "surf", "level": 1 }
    ]
  },
  "136": {
    "id": 136,
    "name": "Flareon",
    "types": ["fire"],
    "stats": { "hp": 65, "attack": 130, "defense": 60, "special_attack": 95, "special_defense": 110, "speed": 65 },
    "learnset": [
      { "move": "flare_blitz", "level": 1 },
      { "move": "superpower", "level": 1 },
      { "move": "quick_attack", "level": 1 },
      { "move": "flamethrower", "level": 1 }
    ]
  },
  "149": {
    "id": 149,
    "name": "Dragonite",
    "types": ["dragon", "flying"],
    "stats": { "hp": 91, "attack": 134, "defense": 95, "special_attack": 100, "special_defense": 100, "speed": 80 },
    "learnset": [
      { "move": "outrage", "level": 1 },
      { "move": "dragon_dance", "level": 1 },
      { "move": "extreme_speed", "level": 1 },
      { "move": "earthquake", "level": 1 }
    ]
  },

  // Gen 2 Starters
  "152": {
    "id": 152,
    "name": "Chikorita",
    "types": ["grass"],
    "stats": { "hp": 45, "attack": 49, "defense": 65, "special_attack": 49, "special_defense": 65, "speed": 45 },
    "learnset": [
      { "move": "tackle", "level": 1 },
      { "move": "growl", "level": 1 },
      { "move": "razor_leaf", "level": 4 },
      { "move": "poison_powder", "level": 8 },
      { "move": "seed_bomb", "level": 15 }
    ]
  },
  "155": {
    "id": 155,
    "name": "Cyndaquil",
    "types": ["fire"],
    "stats": { "hp": 39, "attack": 52, "defense": 43, "special_attack": 60, "special_defense": 50, "speed": 65 },
    "learnset": [
      { "move": "tackle", "level": 1 },
      { "move": "leer", "level": 1 },
      { "move": "ember", "level": 4 },
      { "move": "quick_attack", "level": 8 },
      { "move": "flame_wheel", "level": 15 }
    ]
  },
  "158": {
    "id": 158,
    "name": "Totodile",
    "types": ["water"],
    "stats": { "hp": 50, "attack": 65, "defense": 64, "special_attack": 44, "special_defense": 48, "speed": 43 },
    "learnset": [
      { "move": "scratch", "level": 1 },
      { "move": "leer", "level": 1 },
      { "move": "water_gun", "level": 4 },
      { "move": "bite", "level": 8 },
      { "move": "ice_fang", "level": 15 }
    ]
  },

  // Gen 3 Starters
  "252": {
    "id": 252,
    "name": "Treecko",
    "types": ["grass"],
    "stats": { "hp": 40, "attack": 45, "defense": 35, "special_attack": 65, "special_defense": 55, "speed": 70 },
    "learnset": [
      { "move": "pound", "level": 1 },
      { "move": "leer", "level": 1 },
      { "move": "absorb", "level": 4 },
      { "move": "quick_attack", "level": 8 },
      { "move": "mega_drain", "level": 14 }
    ]
  },
  "255": {
    "id": 255,
    "name": "Torchic",
    "types": ["fire"],
    "stats": { "hp": 45, "attack": 60, "defense": 40, "special_attack": 70, "special_defense": 50, "speed": 45 },
    "learnset": [
      { "move": "scratch", "level": 1 },
      { "move": "growl", "level": 1 },
      { "move": "ember", "level": 4 },
      { "move": "quick_attack", "level": 8 },
      { "move": "flame_charge", "level": 14 }
    ]
  },
  "258": {
    "id": 258,
    "name": "Mudkip",
    "types": ["water"],
    "stats": { "hp": 50, "attack": 70, "defense": 50, "special_attack": 50, "special_defense": 50, "speed": 40 },
    "learnset": [
      { "move": "tackle", "level": 1 },
      { "move": "growl", "level": 1 },
      { "move": "water_gun", "level": 4 },
      { "move": "mud_slap", "level": 8 },
      { "move": "water_pulse", "level": 14 }
    ]
  },

  // Gen 4-9 Starters
  "387": {
    "id": 387, "name": "Turtwig", "types": ["grass"],
    "stats": { "hp": 55, "attack": 68, "defense": 64, "special_attack": 45, "special_defense": 55, "speed": 31 },
    "learnset": [{ "move": "tackle", "level": 1 }, { "move": "withdraw", "level": 1 }, { "move": "razor_leaf", "level": 4 }, { "move": "bite", "level": 8 }]
  },
  "390": {
    "id": 390, "name": "Chimchar", "types": ["fire"],
    "stats": { "hp": 44, "attack": 58, "defense": 44, "special_attack": 58, "special_defense": 44, "speed": 61 },
    "learnset": [{ "move": "scratch", "level": 1 }, { "move": "leer", "level": 1 }, { "move": "ember", "level": 4 }, { "move": "mach_punch", "level": 8 }]
  },
  "393": {
    "id": 393, "name": "Piplup", "types": ["water"],
    "stats": { "hp": 53, "attack": 51, "defense": 53, "special_attack": 61, "special_defense": 56, "speed": 40 },
    "learnset": [{ "move": "pound", "level": 1 }, { "move": "growl", "level": 1 }, { "move": "water_gun", "level": 4 }, { "move": "bubble_beam", "level": 8 }]
  },
  "495": {
    "id": 495, "name": "Snivy", "types": ["grass"],
    "stats": { "hp": 45, "attack": 45, "defense": 55, "special_attack": 45, "special_defense": 55, "speed": 63 },
    "learnset": [{ "move": "tackle", "level": 1 }, { "move": "vine_whip", "level": 4 }, { "move": "leaf_blade", "level": 12 }]
  },
  "498": {
    "id": 498, "name": "Tepig", "types": ["fire"],
    "stats": { "hp": 65, "attack": 63, "defense": 45, "special_attack": 45, "special_defense": 45, "speed": 45 },
    "learnset": [{ "move": "tackle", "level": 1 }, { "move": "ember", "level": 4 }, { "move": "flame_charge", "level": 8 }]
  },
  "501": {
    "id": 501, "name": "Oshawott", "types": ["water"],
    "stats": { "hp": 55, "attack": 55, "defense": 45, "special_attack": 63, "special_defense": 45, "speed": 45 },
    "learnset": [{ "move": "tackle", "level": 1 }, { "move": "water_gun", "level": 4 }, { "move": "razor_shell", "level": 10 }]
  },
  "650": {
    "id": 650, "name": "Chespin", "types": ["grass"],
    "stats": { "hp": 56, "attack": 61, "defense": 65, "special_attack": 48, "special_defense": 45, "speed": 38 },
    "learnset": [{ "move": "tackle", "level": 1 }, { "move": "vine_whip", "level": 4 }, { "move": "pin_missile", "level": 10 }]
  },
  "653": {
    "id": 653, "name": "Fennekin", "types": ["fire"],
    "stats": { "hp": 40, "attack": 45, "defense": 40, "special_attack": 62, "special_defense": 60, "speed": 60 },
    "learnset": [{ "move": "scratch", "level": 1 }, { "move": "ember", "level": 4 }, { "move": "psybeam", "level": 10 }]
  },
  "656": {
    "id": 656, "name": "Froakie", "types": ["water"],
    "stats": { "hp": 41, "attack": 56, "defense": 40, "special_attack": 62, "special_defense": 44, "speed": 71 },
    "learnset": [{ "move": "pound", "level": 1 }, { "move": "water_gun", "level": 4 }, { "move": "quick_attack", "level": 8 }]
  },
  "722": {
    "id": 722, "name": "Rowlet", "types": ["grass", "flying"],
    "stats": { "hp": 68, "attack": 55, "defense": 55, "special_attack": 50, "special_defense": 50, "speed": 42 },
    "learnset": [{ "move": "tackle", "level": 1 }, { "move": "leafage", "level": 4 }, { "move": "gust", "level": 8 }]
  },
  "725": {
    "id": 725, "name": "Litten", "types": ["fire"],
    "stats": { "hp": 45, "attack": 65, "defense": 40, "special_attack": 60, "special_defense": 40, "speed": 70 },
    "learnset": [{ "move": "scratch", "level": 1 }, { "move": "ember", "level": 4 }, { "move": "bite", "level": 8 }]
  },
  "728": {
    "id": 728, "name": "Popplio", "types": ["water"],
    "stats": { "hp": 50, "attack": 54, "defense": 54, "special_attack": 66, "special_defense": 56, "speed": 40 },
    "learnset": [{ "move": "pound", "level": 1 }, { "move": "water_gun", "level": 4 }, { "move": "disarming_voice", "level": 8 }]
  },
  "810": {
    "id": 810, "name": "Grookey", "types": ["grass"],
    "stats": { "hp": 50, "attack": 65, "defense": 50, "special_attack": 40, "special_defense": 40, "speed": 65 },
    "learnset": [{ "move": "scratch", "level": 1 }, { "move": "branch_poke", "level": 4 }, { "move": "razor_leaf", "level": 8 }]
  },
  "813": {
    "id": 813, "name": "Scorbunny", "types": ["fire"],
    "stats": { "hp": 50, "attack": 71, "defense": 40, "special_attack": 40, "special_defense": 40, "speed": 69 },
    "learnset": [{ "move": "tackle", "level": 1 }, { "move": "ember", "level": 4 }, { "move": "quick_attack", "level": 8 }]
  },
  "816": {
    "id": 816, "name": "Sobble", "types": ["water"],
    "stats": { "hp": 50, "attack": 40, "defense": 40, "special_attack": 70, "special_defense": 40, "speed": 70 },
    "learnset": [{ "move": "pound", "level": 1 }, { "move": "water_gun", "level": 4 }, { "move": "water_pulse", "level": 8 }]
  },
  "906": {
    "id": 906, "name": "Sprigatito", "types": ["grass"],
    "stats": { "hp": 40, "attack": 61, "defense": 54, "special_attack": 45, "special_defense": 45, "speed": 65 },
    "learnset": [{ "move": "scratch", "level": 1 }, { "move": "leafage", "level": 4 }, { "move": "bite", "level": 8 }]
  },
  "909": {
    "id": 909, "name": "Fuecoco", "types": ["fire"],
    "stats": { "hp": 67, "attack": 45, "defense": 59, "special_attack": 63, "special_defense": 40, "speed": 36 },
    "learnset": [{ "move": "tackle", "level": 1 }, { "move": "ember", "level": 4 }, { "move": "round", "level": 8 }]
  },
  "912": {
    "id": 912, "name": "Quaxly", "types": ["water"],
    "stats": { "hp": 55, "attack": 65, "defense": 45, "special_attack": 50, "special_defense": 45, "speed": 50 },
    "learnset": [{ "move": "pound", "level": 1 }, { "move": "water_gun", "level": 4 }, { "move": "wing_attack", "level": 8 }]
  }
};

// Fusionar las entradas
Object.assign(pokedex, missingEntries);

fs.writeFileSync(pokedexPath, JSON.stringify(pokedex, null, 2), 'utf8');
console.log('✅ pokedex.json actualizado con éxito con todas las especies requeridas.');
