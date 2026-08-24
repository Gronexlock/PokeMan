"""
Script de Generación de la Pokédex Expandida de Andara (~120+ Especies)
========================================================================
Proyecto: Pokémon: Ecos de Andara
Genera el catálogo de especies con estadísticas base, tipos, learnsets,
evoluciones sin intercambio y soporte de Mega Evolución.
"""

import json
import os

OUTPUT_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "pokedex.json")

# Catálogo completo de especies
POKEDEX_ENTRIES = {
    # Iniciales Planta Gen 1-9
    "1": { "id": 1, "name": "Bulbasaur", "types": ["grass", "poison"], "stats": {"hp": 45, "attack": 49, "defense": 49, "special_attack": 65, "special_defense": 65, "speed": 45}, "evolution": {"target_id": 2, "target_name": "Ivysaur", "method": "level", "level": 16}, "learnset": [{"move": "tackle", "level": 1}, {"move": "growl", "level": 1}, {"move": "vine_whip", "level": 3}, {"move": "energy_ball", "level": 20}, {"move": "sludge_bomb", "level": 28}] },
    "2": { "id": 2, "name": "Ivysaur", "types": ["grass", "poison"], "stats": {"hp": 60, "attack": 62, "defense": 63, "special_attack": 80, "special_defense": 80, "speed": 60}, "evolution": {"target_id": 3, "target_name": "Venusaur", "method": "level", "level": 32}, "learnset": [{"move": "vine_whip", "level": 1}, {"move": "energy_ball", "level": 20}, {"move": "sludge_bomb", "level": 28}, {"move": "solar_beam", "level": 32}] },
    "3": { "id": 3, "name": "Venusaur", "types": ["grass", "poison"], "stats": {"hp": 80, "attack": 82, "defense": 83, "special_attack": 100, "special_defense": 100, "speed": 80}, "mega_evolution": "venusaur", "learnset": [{"move": "giga_drain", "level": 1}, {"move": "sludge_bomb", "level": 1}, {"move": "energy_ball", "level": 1}, {"move": "earthquake", "level": 36}] },

    # Iniciales Fuego Gen 1-9
    "4": { "id": 4, "name": "Charmander", "types": ["fire"], "stats": {"hp": 39, "attack": 52, "defense": 43, "special_attack": 60, "special_defense": 50, "speed": 65}, "evolution": {"target_id": 5, "target_name": "Charmeleon", "method": "level", "level": 16}, "learnset": [{"move": "scratch", "level": 1}, {"move": "growl", "level": 1}, {"move": "ember", "level": 4}, {"move": "flamethrower", "level": 24}, {"move": "dragon_claw", "level": 28}] },
    "5": { "id": 5, "name": "Charmeleon", "types": ["fire"], "stats": {"hp": 58, "attack": 64, "defense": 58, "special_attack": 80, "special_defense": 65, "speed": 80}, "evolution": {"target_id": 6, "target_name": "Charizard", "method": "level", "level": 36}, "learnset": [{"move": "ember", "level": 1}, {"move": "flamethrower", "level": 24}, {"move": "dragon_claw", "level": 28}, {"move": "slash", "level": 32}] },
    "6": { "id": 6, "name": "Charizard", "types": ["fire", "flying"], "stats": {"hp": 78, "attack": 84, "defense": 78, "special_attack": 109, "special_defense": 85, "speed": 100}, "mega_evolution": "charizard_x", "learnset": [{"move": "flamethrower", "level": 1}, {"move": "dragon_claw", "level": 1}, {"move": "air_slash", "level": 1}, {"move": "fire_blast", "level": 36}] },

    # Iniciales Agua Gen 1-9
    "7": { "id": 7, "name": "Squirtle", "types": ["water"], "stats": {"hp": 44, "attack": 48, "defense": 65, "special_attack": 50, "special_defense": 64, "speed": 43}, "evolution": {"target_id": 8, "target_name": "Wartortle", "method": "level", "level": 16}, "learnset": [{"move": "tackle", "level": 1}, {"move": "leer", "level": 1}, {"move": "water_gun", "level": 3}, {"move": "surf", "level": 22}, {"move": "ice_beam", "level": 28}] },
    "8": { "id": 8, "name": "Wartortle", "types": ["water"], "stats": {"hp": 59, "attack": 63, "defense": 80, "special_attack": 65, "special_defense": 80, "speed": 58}, "evolution": {"target_id": 9, "target_name": "Blastoise", "method": "level", "level": 36}, "learnset": [{"move": "water_gun", "level": 1}, {"move": "waterfall", "level": 20}, {"move": "surf", "level": 22}, {"move": "ice_beam", "level": 28}] },
    "9": { "id": 9, "name": "Blastoise", "types": ["water"], "stats": {"hp": 79, "attack": 83, "defense": 100, "special_attack": 85, "special_defense": 105, "speed": 78}, "mega_evolution": "blastoise", "learnset": [{"move": "hydro_pump", "level": 1}, {"move": "ice_beam", "level": 1}, {"move": "aura_sphere", "level": 1}, {"move": "flash_cannon", "level": 36}] },

    # Línea Caterpie
    "10": { "id": 10, "name": "Caterpie", "types": ["bug"], "stats": {"hp": 45, "attack": 30, "defense": 35, "special_attack": 20, "special_defense": 20, "speed": 45}, "evolution": {"target_id": 11, "target_name": "Metapod", "method": "level", "level": 7}, "learnset": [{"move": "tackle", "level": 1}, {"move": "bug_bite", "level": 5}] },
    "11": { "id": 11, "name": "Metapod", "types": ["bug"], "stats": {"hp": 50, "attack": 25, "defense": 55, "special_attack": 25, "special_defense": 25, "speed": 30}, "evolution": {"target_id": 12, "target_name": "Butterfree", "method": "level", "level": 10}, "learnset": [{"move": "tackle", "level": 1}] },
    "12": { "id": 12, "name": "Butterfree", "types": ["bug", "flying"], "stats": {"hp": 60, "attack": 45, "defense": 50, "special_attack": 90, "special_defense": 80, "speed": 70}, "learnset": [{"move": "bug_buzz", "level": 10}, {"move": "air_slash", "level": 15}, {"move": "quiver_dance", "level": 25}, {"move": "sleep_powder", "level": 12}] },

    # Línea Pidgey
    "16": { "id": 16, "name": "Pidgey", "types": ["normal", "flying"], "stats": {"hp": 40, "attack": 45, "defense": 40, "special_attack": 35, "special_defense": 35, "speed": 56}, "evolution": {"target_id": 17, "target_name": "Pidgeotto", "method": "level", "level": 18}, "learnset": [{"move": "tackle", "level": 1}, {"move": "gust", "level": 5}, {"move": "quick_attack", "level": 9}] },
    "17": { "id": 17, "name": "Pidgeotto", "types": ["normal", "flying"], "stats": {"hp": 63, "attack": 60, "defense": 55, "special_attack": 50, "special_defense": 50, "speed": 71}, "evolution": {"target_id": 18, "target_name": "Pidgeot", "method": "level", "level": 36}, "learnset": [{"move": "gust", "level": 1}, {"move": "quick_attack", "level": 9}, {"move": "air_slash", "level": 22}] },
    "18": { "id": 18, "name": "Pidgeot", "types": ["normal", "flying"], "stats": {"hp": 83, "attack": 80, "defense": 75, "special_attack": 70, "special_defense": 70, "speed": 101}, "mega_evolution": "pidgeot", "learnset": [{"move": "brave_bird", "level": 1}, {"move": "air_slash", "level": 1}, {"move": "roost", "level": 25}, {"move": "hurricane", "level": 36}] },

    # Línea Pikachu
    "25": { "id": 25, "name": "Pikachu", "types": ["electric"], "stats": {"hp": 35, "attack": 55, "defense": 40, "special_attack": 50, "special_defense": 50, "speed": 90}, "evolution": {"target_id": 26, "target_name": "Raichu", "method": "item", "item": "thunder_stone"}, "learnset": [{"move": "thunder_shock", "level": 1}, {"move": "quick_attack", "level": 5}, {"move": "thunderbolt", "level": 20}, {"move": "volt_switch", "level": 24}] },
    "26": { "id": 26, "name": "Raichu", "types": ["electric"], "stats": {"hp": 60, "attack": 90, "defense": 55, "special_attack": 90, "special_defense": 80, "speed": 110}, "learnset": [{"move": "thunderbolt", "level": 1}, {"move": "volt_switch", "level": 1}, {"move": "focus_blast", "level": 1}, {"move": "extreme_speed", "level": 1}] },

    # Línea Oddish
    "43": { "id": 43, "name": "Oddish", "types": ["grass", "poison"], "stats": {"hp": 45, "attack": 50, "defense": 55, "special_attack": 75, "special_defense": 65, "speed": 30}, "evolution": {"target_id": 44, "target_name": "Gloom", "method": "level", "level": 21}, "learnset": [{"move": "mega_drain", "level": 1}, {"move": "poison_powder", "level": 5}, {"move": "sludge_bomb", "level": 20}] },
    "44": { "id": 44, "name": "Gloom", "types": ["grass", "poison"], "stats": {"hp": 60, "attack": 65, "defense": 70, "special_attack": 85, "special_defense": 75, "speed": 40}, "evolution": {"target_id": 45, "target_name": "Vileplume", "method": "item", "item": "leaf_stone"}, "learnset": [{"move": "giga_drain", "level": 1}, {"move": "sludge_bomb", "level": 25}] },
    "45": { "id": 45, "name": "Vileplume", "types": ["grass", "poison"], "stats": {"hp": 75, "attack": 80, "defense": 85, "special_attack": 110, "special_defense": 90, "speed": 50}, "learnset": [{"move": "giga_drain", "level": 1}, {"move": "sludge_bomb", "level": 1}, {"move": "moonblast", "level": 1}, {"move": "energy_ball", "level": 30}] },

    # Línea Psyduck
    "54": { "id": 54, "name": "Psyduck", "types": ["water"], "stats": {"hp": 50, "attack": 52, "defense": 48, "special_attack": 65, "special_defense": 50, "speed": 55}, "evolution": {"target_id": 55, "target_name": "Golduck", "method": "level", "level": 33}, "learnset": [{"move": "water_gun", "level": 1}, {"move": "confusion", "level": 5}, {"move": "surf", "level": 20}] },
    "55": { "id": 55, "name": "Golduck", "types": ["water"], "stats": {"hp": 80, "attack": 82, "defense": 78, "special_attack": 95, "special_defense": 80, "speed": 85}, "learnset": [{"move": "hydro_pump", "level": 1}, {"move": "psychic", "level": 1}, {"move": "ice_beam", "level": 1}, {"move": "calm_mind", "level": 25}] },

    # Línea Growlithe (Compañero de Nahuel)
    "58": { "id": 58, "name": "Growlithe", "types": ["fire"], "stats": {"hp": 55, "attack": 70, "defense": 45, "special_attack": 70, "special_defense": 50, "speed": 60}, "evolution": {"target_id": 59, "target_name": "Arcanine", "method": "item", "item": "fire_stone"}, "learnset": [{"move": "scratch", "level": 1}, {"move": "ember", "level": 4}, {"move": "flamethrower", "level": 20}, {"move": "crunch", "level": 28}, {"move": "flare_blitz", "level": 36}] },
    "59": { "id": 59, "name": "Arcanine", "types": ["fire"], "stats": {"hp": 90, "attack": 110, "defense": 80, "special_attack": 100, "special_defense": 80, "speed": 95}, "learnset": [{"move": "flamethrower", "level": 1}, {"move": "extreme_speed", "level": 1}, {"move": "crunch", "level": 1}, {"move": "close_combat", "level": 34}, {"move": "flare_blitz", "level": 38}] },

    # Línea Poliwag
    "60": { "id": 60, "name": "Poliwag", "types": ["water"], "stats": {"hp": 40, "attack": 50, "defense": 40, "special_attack": 40, "special_defense": 40, "speed": 90}, "evolution": {"target_id": 61, "target_name": "Poliwhirl", "method": "level", "level": 25}, "learnset": [{"move": "water_gun", "level": 1}, {"move": "hypnosis", "level": 5}] },
    "61": { "id": 61, "name": "Poliwhirl", "types": ["water"], "stats": {"hp": 65, "attack": 65, "defense": 65, "special_attack": 50, "special_defense": 50, "speed": 90}, "evolution": {"target_id": 62, "target_name": "Poliwrath", "method": "item", "item": "water_stone"}, "learnset": [{"move": "surf", "level": 1}, {"move": "body_slam", "level": 20}] },
    "62": { "id": 62, "name": "Poliwrath", "types": ["water", "fighting"], "stats": {"hp": 90, "attack": 95, "defense": 95, "special_attack": 70, "special_defense": 90, "speed": 70}, "learnset": [{"move": "waterfall", "level": 1}, {"move": "close_combat", "level": 1}, {"move": "drain_punch", "level": 1}, {"move": "ice_punch", "level": 1}] },

    # Línea Abra (Alakazam con link_cable / Nivel 38)
    "63": { "id": 63, "name": "Abra", "types": ["psychic"], "stats": {"hp": 25, "attack": 20, "defense": 15, "special_attack": 105, "special_defense": 55, "speed": 90}, "evolution": {"target_id": 64, "target_name": "Kadabra", "method": "level", "level": 16}, "learnset": [{"move": "teleport", "level": 1}, {"move": "confusion", "level": 5}] },
    "64": { "id": 64, "name": "Kadabra", "types": ["psychic"], "stats": {"hp": 40, "attack": 35, "defense": 30, "special_attack": 120, "special_defense": 70, "speed": 105}, "evolution": {"target_id": 65, "target_name": "Alakazam", "method": "link_cable_or_level", "item": "link_cable", "level": 38}, "learnset": [{"move": "psybeam", "level": 16}, {"move": "psychic", "level": 25}, {"move": "shadow_ball", "level": 30}] },
    "65": { "id": 65, "name": "Alakazam", "types": ["psychic"], "stats": {"hp": 55, "attack": 50, "defense": 45, "special_attack": 135, "special_defense": 95, "speed": 120}, "mega_evolution": "alakazam", "learnset": [{"move": "psychic", "level": 1}, {"move": "shadow_ball", "level": 1}, {"move": "dazzling_gleam", "level": 1}, {"move": "calm_mind", "level": 25}] },

    # Línea Machop (Machamp con link_cable / Nivel 38)
    "66": { "id": 66, "name": "Machop", "types": ["fighting"], "stats": {"hp": 70, "attack": 80, "defense": 50, "special_attack": 35, "special_defense": 35, "speed": 35}, "evolution": {"target_id": 67, "target_name": "Machoke", "method": "level", "level": 28}, "learnset": [{"move": "karate_chop", "level": 1}, {"move": "bulk_up", "level": 15}] },
    "67": { "id": 67, "name": "Machoke", "types": ["fighting"], "stats": {"hp": 80, "attack": 100, "defense": 70, "special_attack": 50, "special_defense": 60, "speed": 45}, "evolution": {"target_id": 68, "target_name": "Machamp", "method": "link_cable_or_level", "item": "link_cable", "level": 38}, "learnset": [{"move": "close_combat", "level": 30}, {"move": "ice_punch", "level": 20}] },
    "68": { "id": 68, "name": "Machamp", "types": ["fighting"], "stats": {"hp": 90, "attack": 130, "defense": 80, "special_attack": 65, "special_defense": 85, "speed": 55}, "learnset": [{"move": "close_combat", "level": 1}, {"move": "stone_edge", "level": 1}, {"move": "knock_off", "level": 1}, {"move": "bullet_punch", "level": 1}] },

    # Línea Bellsprout
    "69": { "id": 69, "name": "Bellsprout", "types": ["grass", "poison"], "stats": {"hp": 50, "attack": 75, "defense": 35, "special_attack": 70, "special_defense": 30, "speed": 40}, "evolution": {"target_id": 70, "target_name": "Weepinbell", "method": "level", "level": 21}, "learnset": [{"move": "vine_whip", "level": 1}, {"move": "sludge_bomb", "level": 20}] },
    "70": { "id": 70, "name": "Weepinbell", "types": ["grass", "poison"], "stats": {"hp": 65, "attack": 90, "defense": 50, "special_attack": 85, "special_defense": 45, "speed": 55}, "evolution": {"target_id": 71, "target_name": "Victreebel", "method": "item", "item": "leaf_stone"}, "learnset": [{"move": "leaf_blade", "level": 25}, {"move": "sludge_bomb", "level": 25}] },
    "71": { "id": 71, "name": "Victreebel", "types": ["grass", "poison"], "stats": {"hp": 80, "attack": 105, "defense": 65, "special_attack": 100, "special_defense": 70, "speed": 70}, "learnset": [{"move": "leaf_blade", "level": 1}, {"move": "sludge_bomb", "level": 1}, {"move": "swords_dance", "level": 1}, {"move": "sucker_punch", "level": 1}] },

    # Línea Tentacool
    "72": { "id": 72, "name": "Tentacool", "types": ["water", "poison"], "stats": {"hp": 40, "attack": 40, "defense": 35, "special_attack": 50, "special_defense": 100, "speed": 70}, "evolution": {"target_id": 73, "target_name": "Tentacruel", "method": "level", "level": 30}, "learnset": [{"move": "water_gun", "level": 1}, {"move": "sludge_bomb", "level": 20}] },
    "73": { "id": 73, "name": "Tentacruel", "types": ["water", "poison"], "stats": {"hp": 80, "attack": 70, "defense": 65, "special_attack": 80, "special_defense": 120, "speed": 100}, "learnset": [{"move": "scald", "level": 1}, {"move": "sludge_bomb", "level": 1}, {"move": "ice_beam", "level": 1}, {"move": "toxic_spikes", "level": 1}] },

    # Línea Geodude (Golem con link_cable / Nivel 38)
    "74": { "id": 74, "name": "Geodude", "types": ["rock", "ground"], "stats": {"hp": 40, "attack": 80, "defense": 100, "special_attack": 30, "special_defense": 30, "speed": 20}, "evolution": {"target_id": 75, "target_name": "Graveler", "method": "level", "level": 25}, "learnset": [{"move": "rock_throw", "level": 1}, {"move": "earthquake", "level": 20}] },
    "75": { "id": 75, "name": "Graveler", "types": ["rock", "ground"], "stats": {"hp": 55, "attack": 95, "defense": 115, "special_attack": 45, "special_defense": 45, "speed": 35}, "evolution": {"target_id": 76, "target_name": "Golem", "method": "link_cable_or_level", "item": "link_cable", "level": 38}, "learnset": [{"move": "stone_edge", "level": 30}, {"move": "earthquake", "level": 30}] },
    "76": { "id": 76, "name": "Golem", "types": ["rock", "ground"], "stats": {"hp": 80, "attack": 120, "defense": 130, "special_attack": 55, "special_defense": 65, "speed": 45}, "learnset": [{"move": "stone_edge", "level": 1}, {"move": "earthquake", "level": 1}, {"move": "stealth_rock", "level": 1}, {"move": "fire_punch", "level": 1}] },

    # Línea Slowpoke (Mega-Slowbro)
    "79": { "id": 79, "name": "Slowpoke", "types": ["water", "psychic"], "stats": {"hp": 90, "attack": 65, "defense": 65, "special_attack": 40, "special_defense": 40, "speed": 15}, "evolution": {"target_id": 80, "target_name": "Slowbro", "method": "level", "level": 37}, "learnset": [{"move": "water_gun", "level": 1}, {"move": "confusion", "level": 1}, {"move": "surf", "level": 25}] },
    "80": { "id": 80, "name": "Slowbro", "types": ["water", "psychic"], "stats": {"hp": 95, "attack": 75, "defense": 110, "special_attack": 100, "special_defense": 80, "speed": 30}, "mega_evolution": "slowbro", "learnset": [{"move": "scald", "level": 1}, {"move": "psychic", "level": 1}, {"move": "ice_beam", "level": 1}, {"move": "calm_mind", "level": 1}] },

    # Línea Magnemite (Líder Valeria)
    "81": { "id": 81, "name": "Magnemite", "types": ["electric", "steel"], "stats": {"hp": 25, "attack": 35, "defense": 70, "special_attack": 95, "special_defense": 55, "speed": 45}, "evolution": {"target_id": 82, "target_name": "Magneton", "method": "level", "level": 30}, "learnset": [{"move": "thunder_shock", "level": 1}, {"move": "flash_cannon", "level": 25}] },
    "82": { "id": 82, "name": "Magneton", "types": ["electric", "steel"], "stats": {"hp": 50, "attack": 60, "defense": 95, "special_attack": 120, "special_defense": 70, "speed": 70}, "evolution": {"target_id": 462, "target_name": "Magnezone", "method": "item", "item": "thunder_stone"}, "learnset": [{"move": "thunderbolt", "level": 1}, {"move": "flash_cannon", "level": 1}, {"move": "volt_switch", "level": 1}] },
    "462": { "id": 462, "name": "Magnezone", "types": ["electric", "steel"], "stats": {"hp": 70, "attack": 70, "defense": 115, "special_attack": 130, "special_defense": 90, "speed": 60}, "learnset": [{"move": "thunderbolt", "level": 1}, {"move": "flash_cannon", "level": 1}, {"move": "volt_switch", "level": 1}, {"move": "body_press", "level": 1}] },

    # Línea Gastly (Gengar con link_cable / Nivel 38)
    "92": { "id": 92, "name": "Gastly", "types": ["ghost", "poison"], "stats": {"hp": 30, "attack": 35, "defense": 30, "special_attack": 100, "special_defense": 35, "speed": 80}, "evolution": {"target_id": 93, "target_name": "Haunter", "method": "level", "level": 25}, "learnset": [{"move": "shadow_ball", "level": 20}, {"move": "sludge_bomb", "level": 25}] },
    "93": { "id": 93, "name": "Haunter", "types": ["ghost", "poison"], "stats": {"hp": 45, "attack": 50, "defense": 45, "special_attack": 115, "special_defense": 55, "speed": 95}, "evolution": {"target_id": 94, "target_name": "Gengar", "method": "link_cable_or_level", "item": "link_cable", "level": 38}, "learnset": [{"move": "shadow_ball", "level": 20}, {"move": "sludge_bomb", "level": 25}] },
    "94": { "id": 94, "name": "Gengar", "types": ["ghost", "poison"], "stats": {"hp": 60, "attack": 65, "defense": 60, "special_attack": 130, "special_defense": 75, "speed": 110}, "mega_evolution": "gengar", "learnset": [{"move": "shadow_ball", "level": 1}, {"move": "sludge_bomb", "level": 1}, {"move": "dazzling_gleam", "level": 1}, {"move": "thunderbolt", "level": 1}] },

    # Línea Onix (Steelix con metal_coat)
    "95": { "id": 95, "name": "Onix", "types": ["rock", "ground"], "stats": {"hp": 35, "attack": 45, "defense": 160, "special_attack": 30, "special_defense": 45, "speed": 70}, "evolution": {"target_id": 208, "target_name": "Steelix", "method": "item", "item": "metal_coat"}, "learnset": [{"move": "rock_slide", "level": 1}, {"move": "earthquake", "level": 20}] },
    "208": { "id": 208, "name": "Steelix", "types": ["steel", "ground"], "stats": {"hp": 75, "attack": 85, "defense": 200, "special_attack": 55, "special_defense": 65, "speed": 30}, "mega_evolution": "steelix", "learnset": [{"move": "iron_head", "level": 1}, {"move": "earthquake", "level": 1}, {"move": "stealth_rock", "level": 1}, {"move": "crunch", "level": 1}] },

    # Línea Scyther (Scizor con metal_coat)
    "123": { "id": 123, "name": "Scyther", "types": ["bug", "flying"], "stats": {"hp": 70, "attack": 110, "defense": 80, "special_attack": 55, "special_defense": 80, "speed": 105}, "evolution": {"target_id": 212, "target_name": "Scizor", "method": "item", "item": "metal_coat"}, "learnset": [{"move": "x_scissor", "level": 1}, {"move": "swords_dance", "level": 20}, {"move": "u_turn", "level": 25}] },
    "212": { "id": 212, "name": "Scizor", "types": ["bug", "steel"], "stats": {"hp": 70, "attack": 130, "defense": 100, "special_attack": 55, "special_defense": 80, "speed": 65}, "mega_evolution": "scizor", "learnset": [{"move": "bullet_punch", "level": 1}, {"move": "u_turn", "level": 1}, {"move": "swords_dance", "level": 1}, {"move": "knock_off", "level": 1}] },

    # Línea Magikarp / Gyarados
    "129": { "id": 129, "name": "Magikarp", "types": ["water"], "stats": {"hp": 20, "attack": 10, "defense": 55, "special_attack": 15, "special_defense": 20, "speed": 80}, "evolution": {"target_id": 130, "target_name": "Gyarados", "method": "level", "level": 20}, "learnset": [{"move": "tackle", "level": 15}] },
    "130": { "id": 130, "name": "Gyarados", "types": ["water", "flying"], "stats": {"hp": 95, "attack": 125, "defense": 79, "special_attack": 60, "special_defense": 100, "speed": 81}, "mega_evolution": "gyarados", "learnset": [{"move": "waterfall", "level": 1}, {"move": "crunch", "level": 1}, {"move": "dragon_dance", "level": 1}, {"move": "earthquake", "level": 1}] },

    # Eevee y sus 8 evoluciones
    "133": { "id": 133, "name": "Eevee", "types": ["normal"], "stats": {"hp": 55, "attack": 55, "defense": 50, "special_attack": 45, "special_defense": 65, "speed": 55}, "learnset": [{"move": "tackle", "level": 1}, {"move": "quick_attack", "level": 5}, {"move": "bite", "level": 15}] },
    "134": { "id": 134, "name": "Vaporeon", "types": ["water"], "stats": {"hp": 130, "attack": 65, "defense": 60, "special_attack": 110, "special_defense": 95, "speed": 65}, "learnset": [{"move": "scald", "level": 1}, {"move": "ice_beam", "level": 1}, {"move": "wish", "level": 1}, {"move": "protect", "level": 1}] },
    "135": { "id": 135, "name": "Jolteon", "types": ["electric"], "stats": {"hp": 65, "attack": 65, "defense": 60, "special_attack": 110, "special_defense": 95, "speed": 130}, "learnset": [{"move": "thunderbolt", "level": 1}, {"move": "volt_switch", "level": 1}, {"move": "shadow_ball", "level": 1}] },
    "136": { "id": 136, "name": "Flareon", "types": ["fire"], "stats": {"hp": 65, "attack": 130, "defense": 60, "special_attack": 95, "special_defense": 110, "speed": 65}, "learnset": [{"move": "flare_blitz", "level": 1}, {"move": "superpower", "level": 1}, {"move": "quick_attack", "level": 1}] },
    "196": { "id": 196, "name": "Espeon", "types": ["psychic"], "stats": {"hp": 65, "attack": 65, "defense": 60, "special_attack": 130, "special_defense": 95, "speed": 110}, "learnset": [{"move": "psychic", "level": 1}, {"move": "shadow_ball", "level": 1}, {"move": "dazzling_gleam", "level": 1}, {"move": "calm_mind", "level": 1}] },
    "197": { "id": 197, "name": "Umbreon", "types": ["dark"], "stats": {"hp": 95, "attack": 65, "defense": 110, "special_attack": 60, "special_defense": 130, "speed": 65}, "learnset": [{"move": "foul_play", "level": 1}, {"move": "toxic", "level": 1}, {"move": "wish", "level": 1}, {"move": "protect", "level": 1}] },
    "470": { "id": 470, "name": "Leafeon", "types": ["grass"], "stats": {"hp": 65, "attack": 110, "defense": 130, "special_attack": 60, "special_defense": 65, "speed": 95}, "learnset": [{"move": "leaf_blade", "level": 1}, {"move": "swords_dance", "level": 1}, {"move": "knock_off", "level": 1}] },
    "471": { "id": 471, "name": "Glaceon", "types": ["ice"], "stats": {"hp": 65, "attack": 60, "defense": 110, "special_attack": 130, "special_defense": 95, "speed": 65}, "learnset": [{"move": "ice_beam", "level": 1}, {"move": "blizzard", "level": 1}, {"move": "shadow_ball", "level": 1}] },
    "700": { "id": 700, "name": "Sylveon", "types": ["fairy"], "stats": {"hp": 95, "attack": 65, "defense": 65, "special_attack": 110, "special_defense": 130, "speed": 60}, "learnset": [{"move": "hyper_voice", "level": 1}, {"move": "moonblast", "level": 1}, {"move": "mystical_fire", "level": 1}, {"move": "calm_mind", "level": 1}] },

    # Línea Dratini (Dragonite)
    "147": { "id": 147, "name": "Dratini", "types": ["dragon"], "stats": {"hp": 41, "attack": 64, "defense": 45, "special_attack": 50, "special_defense": 50, "speed": 50}, "evolution": {"target_id": 148, "target_name": "Dragonair", "method": "level", "level": 30}, "learnset": [{"move": "dragon_breath", "level": 1}, {"move": "surf", "level": 20}] },
    "148": { "id": 148, "name": "Dragonair", "types": ["dragon"], "stats": {"hp": 61, "attack": 84, "defense": 65, "special_attack": 70, "special_defense": 70, "speed": 70}, "evolution": {"target_id": 149, "target_name": "Dragonite", "method": "level", "level": 55}, "learnset": [{"move": "dragon_pulse", "level": 35}, {"move": "extreme_speed", "level": 40}] },
    "149": { "id": 149, "name": "Dragonite", "types": ["dragon", "flying"], "stats": {"hp": 91, "attack": 134, "defense": 95, "special_attack": 100, "special_defense": 100, "speed": 80}, "learnset": [{"move": "outrage", "level": 1}, {"move": "dragon_dance", "level": 1}, {"move": "extreme_speed", "level": 1}, {"move": "earthquake", "level": 1}] },

    # Línea Mareep (Mega-Ampharos - Líder Valeria)
    "179": { "id": 179, "name": "Mareep", "types": ["electric"], "stats": {"hp": 55, "attack": 40, "defense": 40, "special_attack": 65, "special_defense": 45, "speed": 35}, "evolution": {"target_id": 180, "target_name": "Flaaffy", "method": "level", "level": 15}, "learnset": [{"move": "thunder_shock", "level": 1}, {"move": "thunderbolt", "level": 20}] },
    "180": { "id": 180, "name": "Flaaffy", "types": ["electric"], "stats": {"hp": 70, "attack": 55, "defense": 55, "special_attack": 80, "special_defense": 60, "speed": 45}, "evolution": {"target_id": 181, "target_name": "Ampharos", "method": "level", "level": 30}, "learnset": [{"move": "thunderbolt", "level": 25}, {"move": "power_gem", "level": 30}] },
    "181": { "id": 181, "name": "Ampharos", "types": ["electric"], "stats": {"hp": 90, "attack": 75, "defense": 85, "special_attack": 115, "special_defense": 90, "speed": 55}, "mega_evolution": "ampharos", "learnset": [{"move": "thunderbolt", "level": 1}, {"move": "dragon_pulse", "level": 1}, {"move": "focus_blast", "level": 1}, {"move": "volt_switch", "level": 1}] },

    # Línea Larvitar (Mega-Tyranitar)
    "246": { "id": 246, "name": "Larvitar", "types": ["rock", "ground"], "stats": {"hp": 50, "attack": 64, "defense": 50, "special_attack": 45, "special_defense": 50, "speed": 41}, "evolution": {"target_id": 247, "target_name": "Pupitar", "method": "level", "level": 30}, "learnset": [{"move": "rock_slide", "level": 1}, {"move": "earthquake", "level": 20}] },
    "247": { "id": 247, "name": "Pupitar", "types": ["rock", "ground"], "stats": {"hp": 70, "attack": 84, "defense": 70, "special_attack": 65, "special_defense": 70, "speed": 51}, "evolution": {"target_id": 248, "target_name": "Tyranitar", "method": "level", "level": 55}, "learnset": [{"move": "stone_edge", "level": 35}, {"move": "crunch", "level": 40}] },
    "248": { "id": 248, "name": "Tyranitar", "types": ["rock", "dark"], "stats": {"hp": 100, "attack": 134, "defense": 110, "special_attack": 95, "special_defense": 100, "speed": 61}, "mega_evolution": "tyranitar", "learnset": [{"move": "stone_edge", "level": 1}, {"move": "crunch", "level": 1}, {"move": "earthquake", "level": 1}, {"move": "dragon_dance", "level": 1}] },

    # Línea Treecko
    "252": { "id": 252, "name": "Treecko", "types": ["grass"], "stats": {"hp": 40, "attack": 45, "defense": 35, "special_attack": 65, "special_defense": 55, "speed": 70}, "evolution": {"target_id": 253, "target_name": "Grovyle", "method": "level", "level": 16}, "learnset": [{"move": "scratch", "level": 1}, {"move": "vine_whip", "level": 3}, {"move": "energy_ball", "level": 21}] },
    "253": { "id": 253, "name": "Grovyle", "types": ["grass"], "stats": {"hp": 50, "attack": 65, "defense": 45, "special_attack": 85, "special_defense": 65, "speed": 95}, "evolution": {"target_id": 254, "target_name": "Sceptile", "method": "level", "level": 36}, "learnset": [{"move": "leaf_blade", "level": 25}, {"move": "energy_ball", "level": 21}] },
    "254": { "id": 254, "name": "Sceptile", "types": ["grass"], "stats": {"hp": 70, "attack": 85, "defense": 65, "special_attack": 105, "special_defense": 85, "speed": 120}, "mega_evolution": "sceptile", "learnset": [{"move": "leaf_blade", "level": 1}, {"move": "dragon_pulse", "level": 1}, {"move": "energy_ball", "level": 1}, {"move": "swords_dance", "level": 1}] },

    # Línea Torchic
    "255": { "id": 255, "name": "Torchic", "types": ["fire"], "stats": {"hp": 45, "attack": 60, "defense": 40, "special_attack": 70, "special_defense": 50, "speed": 45}, "evolution": {"target_id": 256, "target_name": "Combusken", "method": "level", "level": 16}, "learnset": [{"move": "scratch", "level": 1}, {"move": "ember", "level": 4}, {"move": "flamethrower", "level": 25}] },
    "256": { "id": 256, "name": "Combusken", "types": ["fire", "fighting"], "stats": {"hp": 60, "attack": 85, "defense": 60, "special_attack": 85, "special_defense": 60, "speed": 55}, "evolution": {"target_id": 257, "target_name": "Blaziken", "method": "level", "level": 36}, "learnset": [{"move": "double_kick", "level": 16}, {"move": "flare_blitz", "level": 35}] },
    "257": { "id": 257, "name": "Blaziken", "types": ["fire", "fighting"], "stats": {"hp": 80, "attack": 120, "defense": 70, "special_attack": 110, "special_defense": 70, "speed": 80}, "mega_evolution": "blaziken", "learnset": [{"move": "flare_blitz", "level": 1}, {"move": "close_combat", "level": 1}, {"move": "swords_dance", "level": 1}, {"move": "stone_edge", "level": 1}] },

    # Línea Mudkip
    "258": { "id": 258, "name": "Mudkip", "types": ["water"], "stats": {"hp": 50, "attack": 70, "defense": 50, "special_attack": 50, "special_defense": 50, "speed": 40}, "evolution": {"target_id": 259, "target_name": "Marshtomp", "method": "level", "level": 16}, "learnset": [{"move": "tackle", "level": 1}, {"move": "water_gun", "level": 3}, {"move": "surf", "level": 22}, {"move": "earthquake", "level": 30}] },
    "259": { "id": 259, "name": "Marshtomp", "types": ["water", "ground"], "stats": {"hp": 70, "attack": 85, "defense": 70, "special_attack": 60, "special_defense": 70, "speed": 50}, "evolution": {"target_id": 260, "target_name": "Swampert", "method": "level", "level": 36}, "learnset": [{"move": "mud_bomb", "level": 16}, {"move": "waterfall", "level": 25}, {"move": "earthquake", "level": 30}] },
    "260": { "id": 260, "name": "Swampert", "types": ["water", "ground"], "stats": {"hp": 100, "attack": 110, "defense": 90, "special_attack": 85, "special_defense": 90, "speed": 60}, "mega_evolution": "swampert", "learnset": [{"move": "waterfall", "level": 1}, {"move": "earthquake", "level": 1}, {"move": "ice_punch", "level": 1}, {"move": "superpower", "level": 1}] },

    # Línea Ralts (Gardevoir de Renata / Gallade)
    "280": { "id": 280, "name": "Ralts", "types": ["psychic", "fairy"], "stats": {"hp": 28, "attack": 25, "defense": 25, "special_attack": 45, "special_defense": 35, "speed": 40}, "evolution": {"target_id": 281, "target_name": "Kirlia", "method": "level", "level": 20}, "learnset": [{"move": "confusion", "level": 1}, {"move": "disarming_voice", "level": 5}] },
    "281": { "id": 281, "name": "Kirlia", "types": ["psychic", "fairy"], "stats": {"hp": 38, "attack": 35, "defense": 35, "special_attack": 65, "special_defense": 55, "speed": 50}, "evolution": {"target_id": 282, "target_name": "Gardevoir", "method": "level", "level": 30}, "learnset": [{"move": "psychic", "level": 25}, {"move": "dazzling_gleam", "level": 25}] },
    "282": { "id": 282, "name": "Gardevoir", "types": ["psychic", "fairy"], "stats": {"hp": 68, "attack": 65, "defense": 65, "special_attack": 125, "special_defense": 115, "speed": 80}, "mega_evolution": "gardevoir", "learnset": [{"move": "moonblast", "level": 1}, {"move": "psychic", "level": 1}, {"move": "shadow_ball", "level": 1}, {"move": "calm_mind", "level": 1}] },

    # Línea Sableye (Alto Mando Nayra)
    "302": { "id": 302, "name": "Sableye", "types": ["dark", "ghost"], "stats": {"hp": 50, "attack": 75, "defense": 75, "special_attack": 65, "special_defense": 65, "speed": 50}, "mega_evolution": "sableye", "learnset": [{"move": "knock_off", "level": 1}, {"move": "will_o_wisp", "level": 1}, {"move": "recover", "level": 1}, {"move": "foul_play", "level": 1}] },

    # Línea Feebas (Milotic de Renata)
    "349": { "id": 349, "name": "Feebas", "types": ["water"], "stats": {"hp": 20, "attack": 15, "defense": 20, "special_attack": 10, "special_defense": 55, "speed": 80}, "evolution": {"target_id": 350, "target_name": "Milotic", "method": "item", "item": "prism_scale"}, "learnset": [{"move": "water_gun", "level": 1}, {"move": "tackle", "level": 5}] },
    "350": { "id": 350, "name": "Milotic", "types": ["water"], "stats": {"hp": 95, "attack": 60, "defense": 79, "special_attack": 100, "special_defense": 125, "speed": 81}, "learnset": [{"move": "scald", "level": 1}, {"move": "ice_beam", "level": 1}, {"move": "recover", "level": 1}, {"move": "toxic", "level": 1}] },

    # Línea Bagon (Mega-Salamence de Ezequiel)
    "371": { "id": 371, "name": "Bagon", "types": ["dragon"], "stats": {"hp": 45, "attack": 75, "defense": 60, "special_attack": 40, "special_defense": 30, "speed": 50}, "evolution": {"target_id": 372, "target_name": "Shelgon", "method": "level", "level": 30}, "learnset": [{"move": "dragon_breath", "level": 1}, {"move": "bite", "level": 5}] },
    "372": { "id": 372, "name": "Shelgon", "types": ["dragon"], "stats": {"hp": 65, "attack": 95, "defense": 100, "special_attack": 60, "special_defense": 50, "speed": 50}, "evolution": {"target_id": 373, "target_name": "Salamence", "method": "level", "level": 50}, "learnset": [{"move": "dragon_claw", "level": 30}, {"move": "iron_head", "level": 35}] },
    "373": { "id": 373, "name": "Salamence", "types": ["dragon", "flying"], "stats": {"hp": 95, "attack": 135, "defense": 80, "special_attack": 110, "special_defense": 80, "speed": 100}, "mega_evolution": "salamence", "learnset": [{"move": "double_edge", "level": 1}, {"move": "dragon_dance", "level": 1}, {"move": "earthquake", "level": 1}, {"move": "roost", "level": 1}] },

    # Línea Beldum (Mega-Metagross)
    "374": { "id": 374, "name": "Beldum", "types": ["steel", "psychic"], "stats": {"hp": 40, "attack": 55, "defense": 80, "special_attack": 35, "special_defense": 60, "speed": 30}, "evolution": {"target_id": 375, "target_name": "Metang", "method": "level", "level": 20}, "learnset": [{"move": "take_down", "level": 1}, {"move": "iron_head", "level": 15}] },
    "375": { "id": 375, "name": "Metang", "types": ["steel", "psychic"], "stats": {"hp": 60, "attack": 75, "defense": 100, "special_attack": 55, "special_defense": 80, "speed": 50}, "evolution": {"target_id": 376, "target_name": "Metagross", "method": "level", "level": 45}, "learnset": [{"move": "meteor_mash", "level": 25}, {"move": "zen_headbutt", "level": 30}] },
    "376": { "id": 376, "name": "Metagross", "types": ["steel", "psychic"], "stats": {"hp": 80, "attack": 135, "defense": 130, "special_attack": 95, "special_defense": 90, "speed": 70}, "mega_evolution": "metagross", "learnset": [{"move": "meteor_mash", "level": 1}, {"move": "zen_headbutt", "level": 1}, {"move": "earthquake", "level": 1}, {"move": "bullet_punch", "level": 1}] },

    # Línea Gible (Mega-Garchomp de la Campeona Renata)
    "443": { "id": 443, "name": "Gible", "types": ["dragon", "ground"], "stats": {"hp": 58, "attack": 70, "defense": 45, "special_attack": 40, "special_defense": 45, "speed": 42}, "evolution": {"target_id": 444, "target_name": "Gabite", "method": "level", "level": 24}, "learnset": [{"move": "tackle", "level": 1}, {"move": "dragon_breath", "level": 5}, {"move": "earthquake", "level": 28}] },
    "444": { "id": 444, "name": "Gabite", "types": ["dragon", "ground"], "stats": {"hp": 68, "attack": 90, "defense": 65, "special_attack": 50, "special_defense": 55, "speed": 82}, "evolution": {"target_id": 445, "target_name": "Garchomp", "method": "level", "level": 48}, "learnset": [{"move": "dragon_claw", "level": 25}, {"move": "earthquake", "level": 30}] },
    "445": { "id": 445, "name": "Garchomp", "types": ["dragon", "ground"], "stats": {"hp": 108, "attack": 130, "defense": 95, "special_attack": 80, "special_defense": 85, "speed": 102}, "mega_evolution": "garchomp", "learnset": [{"move": "earthquake", "level": 1}, {"move": "dragon_claw", "level": 1}, {"move": "swords_dance", "level": 1}, {"move": "stone_edge", "level": 1}] },

    # Línea Riolu (Lucario de Renata)
    "447": { "id": 447, "name": "Riolu", "types": ["fighting"], "stats": {"hp": 40, "attack": 70, "defense": 40, "special_attack": 35, "special_defense": 40, "speed": 60}, "evolution": {"target_id": 448, "target_name": "Lucario", "method": "friendship_day"}, "learnset": [{"move": "quick_attack", "level": 1}, {"move": "close_combat", "level": 25}] },
    "448": { "id": 448, "name": "Lucario", "types": ["fighting", "steel"], "stats": {"hp": 70, "attack": 110, "defense": 70, "special_attack": 115, "special_defense": 70, "speed": 90}, "mega_evolution": "lucario", "learnset": [{"move": "close_combat", "level": 1}, {"move": "aura_sphere", "level": 1}, {"move": "flash_cannon", "level": 1}, {"move": "extreme_speed", "level": 1}] },

    # Línea Litwick (Chandelure)
    "607": { "id": 607, "name": "Litwick", "types": ["ghost", "fire"], "stats": {"hp": 50, "attack": 30, "defense": 55, "special_attack": 65, "special_defense": 55, "speed": 20}, "evolution": {"target_id": 608, "target_name": "Lampent", "method": "level", "level": 41}, "learnset": [{"move": "ember", "level": 1}, {"move": "shadow_ball", "level": 25}] },
    "608": { "id": 608, "name": "Lampent", "types": ["ghost", "fire"], "stats": {"hp": 60, "attack": 40, "defense": 60, "special_attack": 95, "special_defense": 60, "speed": 55}, "evolution": {"target_id": 609, "target_name": "Chandelure", "method": "item", "item": "dusk_stone"}, "learnset": [{"move": "flamethrower", "level": 30}, {"move": "shadow_ball", "level": 30}] },
    "609": { "id": 609, "name": "Chandelure", "types": ["ghost", "fire"], "stats": {"hp": 60, "attack": 55, "defense": 90, "special_attack": 145, "special_defense": 90, "speed": 80}, "learnset": [{"move": "shadow_ball", "level": 1}, {"move": "flamethrower", "level": 1}, {"move": "energy_ball", "level": 1}, {"move": "will_o_wisp", "level": 1}] },

    # Línea Larvesta (Volcarona de Renata)
    "636": { "id": 636, "name": "Larvesta", "types": ["bug", "fire"], "stats": {"hp": 55, "attack": 85, "defense": 55, "special_attack": 50, "special_defense": 55, "speed": 60}, "evolution": {"target_id": 637, "target_name": "Volcarona", "method": "level", "level": 59}, "learnset": [{"move": "ember", "level": 1}, {"move": "bug_buzz", "level": 30}] },
    "637": { "id": 637, "name": "Volcarona", "types": ["bug", "fire"], "stats": {"hp": 85, "attack": 60, "defense": 65, "special_attack": 135, "special_defense": 105, "speed": 100}, "learnset": [{"move": "quiver_dance", "level": 1}, {"move": "flamethrower", "level": 1}, {"move": "bug_buzz", "level": 1}, {"move": "giga_drain", "level": 1}] },

    # Línea Rookidee (Corviknight de Renata)
    "821": { "id": 821, "name": "Rookidee", "types": ["flying"], "stats": {"hp": 38, "attack": 47, "defense": 35, "special_attack": 33, "special_defense": 35, "speed": 57}, "evolution": {"target_id": 822, "target_name": "Corvisquire", "method": "level", "level": 18}, "learnset": [{"move": "peck", "level": 1}, {"move": "drill_peck", "level": 15}] },
    "822": { "id": 822, "name": "Corvisquire", "types": ["flying"], "stats": {"hp": 68, "attack": 67, "defense": 55, "special_attack": 43, "special_defense": 55, "speed": 77}, "evolution": {"target_id": 823, "target_name": "Corviknight", "method": "level", "level": 38}, "learnset": [{"move": "drill_peck", "level": 1}, {"move": "brave_bird", "level": 30}] },
    "823": { "id": 823, "name": "Corviknight", "types": ["flying", "steel"], "stats": {"hp": 98, "attack": 87, "defense": 105, "special_attack": 53, "special_defense": 85, "speed": 67}, "learnset": [{"move": "brave_bird", "level": 1}, {"move": "iron_head", "level": 1}, {"move": "roost", "level": 1}, {"move": "u_turn", "level": 1}] },

    # Línea Dreepy (Dragapult)
    "885": { "id": 885, "name": "Dreepy", "types": ["dragon", "ghost"], "stats": {"hp": 28, "attack": 60, "defense": 30, "special_attack": 40, "special_defense": 30, "speed": 82}, "evolution": {"target_id": 886, "target_name": "Drakloak", "method": "level", "level": 50}, "learnset": [{"move": "bite", "level": 1}, {"move": "quick_attack", "level": 1}] },
    "886": { "id": 886, "name": "Drakloak", "types": ["dragon", "ghost"], "stats": {"hp": 68, "attack": 80, "defense": 50, "special_attack": 60, "special_defense": 50, "speed": 102}, "evolution": {"target_id": 887, "target_name": "Dragapult", "method": "level", "level": 60}, "learnset": [{"move": "dragon_pulse", "level": 35}, {"move": "shadow_ball", "level": 40}] },
    "887": { "id": 887, "name": "Dragapult", "types": ["dragon", "ghost"], "stats": {"hp": 88, "attack": 120, "defense": 75, "special_attack": 100, "special_defense": 75, "speed": 142}, "learnset": [{"move": "dragon_claw", "level": 1}, {"move": "shadow_ball", "level": 1}, {"move": "u_turn", "level": 1}, {"move": "flamethrower", "level": 1}] }
}

def build_expanded_pokedex():
    # Cargar pokedex existente para preservar todas las entradas previas
    existing = {}
    if os.path.exists(OUTPUT_PATH):
        with open(OUTPUT_PATH, "r", encoding="utf-8") as f:
            existing = json.load(f)

    # Fusionar con las nuevas entradas expandidas
    existing.update(POKEDEX_ENTRIES)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)

    print(f"✔ Pokédex Regional expandida con éxito: {len(existing)} especies registradas en data/pokedex.json")

if __name__ == "__main__":
    build_expanded_pokedex()
