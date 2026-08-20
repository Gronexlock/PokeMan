"""
Pipeline de Extracción Automatizada para PokéAPI (Modo Offline)
=============================================================
Proyecto: Pokémon: Ecos de Andara
Descarga y estructura datos de tipos, movimientos, objetos, megaevoluciones
y las especies de la Pokédex Regional de Andara para juego 100% offline.
"""

import os
import json
import argparse
import requests
from concurrent.futures import ThreadPoolExecutor

POKEAPI_BASE = "https://pokeapi.co/api/v2"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
SPRITES_DIR = os.path.join(BASE_DIR, "assets", "sprites", "pokemon")
ITEMS_DIR = os.path.join(BASE_DIR, "assets", "sprites", "items")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(SPRITES_DIR, exist_ok=True)
os.makedirs(ITEMS_DIR, exist_ok=True)

# Lista de IDs / Nombres de las especies principales de la Pokédex Regional de Andara
REGIONAL_DEX_IDS = [
    # Iniciales Planta
    1, 2, 3, 252, 253, 254, 387, 388, 389, 495, 496, 497, 650, 651, 652, 722, 723, 724, 906, 907, 908,
    # Iniciales Fuego
    4, 5, 6, 155, 156, 157, 255, 256, 257, 390, 391, 392, 653, 654, 655, 725, 726, 727, 909, 910, 911,
    # Iniciales Agua
    7, 8, 9, 158, 159, 160, 258, 259, 260, 393, 394, 395, 656, 657, 658, 728, 729, 730, 912, 913, 914,
    # Costa y Mar
    278, 279, 129, 130, 54, 55, 72, 73, 60, 61, 62, 186, 194, 195, 170, 171, 747, 748, 846, 847, 318, 319, 349, 350, 79, 80, 199, 422, 423,
    # Rutas y Valles
    58, 59, 133, 134, 135, 136, 196, 197, 470, 471, 700, 821, 822, 823, 661, 662, 663, 16, 17, 18, 179, 180, 181, 403, 404, 405, 831, 832, 427, 428, 63, 64, 65,
    # Yungas e Insectos
    10, 11, 12, 13, 14, 15, 540, 541, 542, 543, 544, 545, 595, 596, 193, 469, 123, 212, 214, 127, 167, 168,
    # Desierto y Salar
    27, 28, 74, 75, 76, 449, 450, 551, 552, 553, 328, 329, 330, 694, 695, 331, 332, 843, 844, 207, 472, 322, 323,
    # Selva Amazónica
    406, 315, 407, 453, 454, 451, 452, 559, 560, 590, 591, 270, 271, 272, 701, 357, 455, 765, 766, 69, 70, 71,
    # Cordillera y Volcanes
    66, 67, 68, 447, 448, 304, 305, 306, 524, 525, 526, 529, 530, 597, 598, 95, 208, 81, 82, 462, 41, 42, 169, 324, 554, 555, 228, 229,
    # Ruinas Ancestrales
    280, 281, 282, 475, 92, 93, 94, 562, 563, 177, 178, 561, 307, 308, 343, 344, 355, 356, 477, 607, 608, 609, 679, 680, 681, 778, 302, 303, 359,
    # Glaciares Patagónicos
    215, 461, 220, 221, 473, 361, 362, 478, 363, 364, 365, 459, 460, 712, 713, 974, 975, 582, 583, 584,
    # Pseudo-Legendarios y Dragones
    443, 444, 445, 246, 247, 248, 374, 375, 376, 371, 372, 373, 147, 148, 149, 633, 634, 635, 782, 783, 784, 885, 886, 887, 636, 637, 116, 117, 230, 714, 715
]

# Eliminar duplicados manteniendo orden
REGIONAL_DEX_IDS = list(dict.fromkeys(REGIONAL_DEX_IDS))


def fetch_types_table():
    """Descarga la tabla completa de efectividades de tipos."""
    print("🔹 [1/5] Descargando tabla de efectividad de tipos...")
    type_chart = {}
    
    url = f"{POKEAPI_BASE}/type"
    resp = requests.get(url, timeout=15).json()
    
    for t_entry in resp.get("results", []):
        t_name = t_entry["name"]
        if t_name in ["unknown", "shadow"]:
            continue
            
        t_detail = requests.get(t_entry["url"], timeout=15).json()
        dmg_relations = t_detail["damage_relations"]
        
        type_chart[t_name] = {
            "double_damage_to": [t["name"] for t in dmg_relations["double_damage_to"]],
            "half_damage_to": [t["name"] for t in dmg_relations["half_damage_to"]],
            "no_damage_to": [t["name"] for t in dmg_relations["no_damage_to"]],
        }
        
    with open(os.path.join(DATA_DIR, "types.json"), "w", encoding="utf-8") as f:
        json.dump(type_chart, f, ensure_ascii=False, indent=2)
    print(f"✔ Tipos guardados en data/types.json ({len(type_chart)} tipos).")


def fetch_moves():
    """Descarga el catálogo de movimientos esenciales con sus stats de combate."""
    print("🔹 [2/5] Descargando base de datos de movimientos...")
    moves_data = {}
    url = f"{POKEAPI_BASE}/move?limit=400"
    resp = requests.get(url, timeout=15).json()
    
    def process_move(m_entry):
        try:
            m_resp = requests.get(m_entry["url"], timeout=10).json()
            m_name = m_resp["name"]
            
            # Nombre en español si está disponible
            names_es = [n["name"] for n in m_resp.get("names", []) if n["language"]["name"] == "es"]
            display_name = names_es[0] if names_es else m_name.capitalize()
            
            return m_name, {
                "id": m_resp["id"],
                "name": m_name,
                "display_name": display_name,
                "type": m_resp["type"]["name"],
                "power": m_resp.get("power"),
                "accuracy": m_resp.get("accuracy"),
                "pp": m_resp.get("pp", 20),
                "priority": m_resp.get("priority", 0),
                "damage_class": m_resp["damage_class"]["name"], # physical, special, status
                "effect_chance": m_resp.get("effect_chance"),
                "target": m_resp["target"]["name"]
            }
        except Exception:
            return None, None

    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(process_move, resp.get("results", [])))
        
    for name, data in results:
        if name and data:
            moves_data[name] = data
            
    with open(os.path.join(DATA_DIR, "moves.json"), "w", encoding="utf-8") as f:
        json.dump(moves_data, f, ensure_ascii=False, indent=2)
    print(f"✔ Movimientos guardados en data/moves.json ({len(moves_data)} movimientos).")


def fetch_mega_evolutions():
    """Genera la base de datos de Mega Evoluciones soportadas en Andara."""
    print("🔹 [3/5] Configurando catálogo de Mega Evoluciones de Andara...")
    megas = {
        "venusaur": {"mega_name": "Mega-Venusaur", "item": "Venusaurita", "types": ["grass", "poison"], "ability": "Thick Fat", "stat_boost": {"defense": 40, "special-attack": 22, "special-defense": 20, "speed": 0}},
        "charizard_x": {"mega_name": "Mega-Charizard X", "item": "Charizardita X", "types": ["fire", "dragon"], "ability": "Tough Claws", "stat_boost": {"attack": 46, "defense": 33, "special-attack": 21}},
        "charizard_y": {"mega_name": "Mega-Charizard Y", "item": "Charizardita Y", "types": ["fire", "flying"], "ability": "Drought", "stat_boost": {"attack": 20, "special-attack": 50, "special-defense": 30}},
        "blastoise": {"mega_name": "Mega-Blastoise", "item": "Blastoisita", "types": ["water"], "ability": "Mega Launcher", "stat_boost": {"attack": 20, "defense": 20, "special-attack": 50, "special-defense": 10}},
        "beedrill": {"mega_name": "Mega-Beedrill", "item": "Beedrillita", "types": ["bug", "poison"], "ability": "Adaptability", "stat_boost": {"attack": 60, "speed": 70}},
        "pidgeot": {"mega_name": "Mega-Pidgeot", "item": "Pidgeotita", "types": ["normal", "flying"], "ability": "No Guard", "stat_boost": {"special-attack": 65, "speed": 20}},
        "alakazam": {"mega_name": "Mega-Alakazam", "item": "Alakazamita", "types": ["psychic"], "ability": "Trace", "stat_boost": {"defense": 20, "special-attack": 40, "speed": 30}},
        "slowbro": {"mega_name": "Mega-Slowbro", "item": "Slowbronita", "types": ["water", "psychic"], "ability": "Shell Armor", "stat_boost": {"defense": 70, "special-attack": 30}},
        "gengar": {"mega_name": "Mega-Gengar", "item": "Gengarita", "types": ["ghost", "poison"], "ability": "Shadow Tag", "stat_boost": {"special-attack": 40, "special-defense": 20, "speed": 20}},
        "gyarados": {"mega_name": "Mega-Gyarados", "item": "Gyaradosita", "types": ["water", "dark"], "ability": "Mold Breaker", "stat_boost": {"attack": 30, "defense": 30, "special-defense": 30}},
        "aerodactyl": {"mega_name": "Mega-Aerodactyl", "item": "Aerodactylita", "types": ["rock", "flying"], "ability": "Tough Claws", "stat_boost": {"attack": 30, "defense": 20, "speed": 20}},
        "ampharos": {"mega_name": "Mega-Ampharos", "item": "Ampharosita", "types": ["electric", "dragon"], "ability": "Mold Breaker", "stat_boost": {"defense": 20, "special-attack": 50, "special-defense": 20}},
        "steelix": {"mega_name": "Mega-Steelix", "item": "Steelixita", "types": ["steel", "ground"], "ability": "Sand Force", "stat_boost": {"attack": 40, "defense": 30, "special-defense": 30}},
        "scizor": {"mega_name": "Mega-Scizor", "item": "Scizorita", "types": ["bug", "steel"], "ability": "Technician", "stat_boost": {"attack": 20, "defense": 40, "special-defense": 20}},
        "heracross": {"mega_name": "Mega-Heracross", "item": "Heracrossita", "types": ["bug", "fighting"], "ability": "Skill Link", "stat_boost": {"attack": 60, "defense": 40}},
        "houndoom": {"mega_name": "Mega-Houndoom", "item": "Houndoomita", "types": ["dark", "fire"], "ability": "Solar Power", "stat_boost": {"defense": 40, "special-attack": 30, "speed": 20}},
        "tyranitar": {"mega_name": "Mega-Tyranitar", "item": "Tyranitarita", "types": ["rock", "dark"], "ability": "Sand Stream", "stat_boost": {"attack": 30, "defense": 40, "special-defense": 20}},
        "sceptile": {"mega_name": "Mega-Sceptile", "item": "Sceptilita", "types": ["grass", "dragon"], "ability": "Lightning Rod", "stat_boost": {"attack": 25, "special-attack": 40, "speed": 25}},
        "blaziken": {"mega_name": "Mega-Blaziken", "item": "Blazikenita", "types": ["fire", "fighting"], "ability": "Speed Boost", "stat_boost": {"attack": 40, "defense": 10, "special-attack": 20, "speed": 20}},
        "swampert": {"mega_name": "Mega-Swampert", "item": "Swampertita", "types": ["water", "ground"], "ability": "Swift Swim", "stat_boost": {"attack": 40, "defense": 20, "special-defense": 20, "speed": 10}},
        "gardevoir": {"mega_name": "Mega-Gardevoir", "item": "Gardevoirita", "types": ["psychic", "fairy"], "ability": "Pixilate", "stat_boost": {"attack": 20, "special-attack": 40, "special-defense": 20, "speed": 20}},
        "gallade": {"mega_name": "Mega-Gallade", "item": "Galladita", "types": ["psychic", "fighting"], "ability": "Inner Focus", "stat_boost": {"attack": 40, "defense": 30, "speed": 30}},
        "sableye": {"mega_name": "Mega-Sableye", "item": "Sableynita", "types": ["dark", "ghost"], "ability": "Magic Bounce", "stat_boost": {"defense": 50, "special-defense": 50}},
        "mawile": {"mega_name": "Mega-Mawile", "item": "Mawilita", "types": ["steel", "fairy"], "ability": "Huge Power", "stat_boost": {"attack": 20, "defense": 40, "special-defense": 40}},
        "aggron": {"mega_name": "Mega-Aggron", "item": "Aggronita", "types": ["steel"], "ability": "Filter", "stat_boost": {"attack": 30, "defense": 50, "special-defense": 20}},
        "medicham": {"mega_name": "Mega-Medicham", "item": "Medichamita", "types": ["fighting", "psychic"], "ability": "Pure Power", "stat_boost": {"attack": 40, "speed": 20}},
        "camerupt": {"mega_name": "Mega-Camerupt", "item": "Cameruptita", "types": ["fire", "ground"], "ability": "Sheer Force", "stat_boost": {"attack": 20, "defense": 30, "special-attack": 40, "special-defense": 30}},
        "altaria": {"mega_name": "Mega-Altaria", "item": "Altarianita", "types": ["dragon", "fairy"], "ability": "Pixilate", "stat_boost": {"attack": 40, "defense": 20, "special-attack": 40}},
        "banette": {"mega_name": "Mega-Banette", "item": "Banettita", "types": ["ghost"], "ability": "Prankster", "stat_boost": {"attack": 50, "defense": 10, "special-attack": 10, "speed": 10}},
        "absol": {"mega_name": "Mega-Absol", "item": "Absolita", "types": ["dark"], "ability": "Magic Bounce", "stat_boost": {"attack": 20, "special-attack": 40, "speed": 40}},
        "glalie": {"mega_name": "Mega-Glalie", "item": "Glalitita", "types": ["ice"], "ability": "Refrigerate", "stat_boost": {"attack": 40, "special-attack": 40, "speed": 20}},
        "salamence": {"mega_name": "Mega-Salamence", "item": "Salamencita", "types": ["dragon", "flying"], "ability": "Aerilate", "stat_boost": {"attack": 10, "defense": 50, "special-attack": 10, "special-defense": 10, "speed": 20}},
        "metagross": {"mega_name": "Mega-Metagross", "item": "Metagrossita", "types": ["steel", "psychic"], "ability": "Tough Claws", "stat_boost": {"attack": 10, "defense": 20, "special-defense": 20, "speed": 40}},
        "garchomp": {"mega_name": "Mega-Garchomp", "item": "Garchompita", "types": ["dragon", "ground"], "ability": "Sand Force", "stat_boost": {"attack": 40, "defense": 20, "special-attack": 40, "special-defense": 10}},
        "lucario": {"mega_name": "Mega-Lucario", "item": "Lucarionita", "types": ["fighting", "steel"], "ability": "Adaptability", "stat_boost": {"attack": 35, "defense": 18, "special-attack": 25, "speed": 22}},
        "abomasnow": {"mega_name": "Mega-Abomasnow", "item": "Abomasnowita", "types": ["grass", "ice"], "ability": "Snow Warning", "stat_boost": {"attack": 40, "defense": 30, "special-attack": 40, "special-defense": 20}},
        "lopunny": {"mega_name": "Mega-Lopunny", "item": "Lopunnita", "types": ["normal", "fighting"], "ability": "Scrappy", "stat_boost": {"attack": 60, "defense": 10, "speed": 30}}
    }
    
    with open(os.path.join(DATA_DIR, "mega_evolutions.json"), "w", encoding="utf-8") as f:
        json.dump(megas, f, ensure_ascii=False, indent=2)
    print(f"✔ Mega Evoluciones guardadas en data/mega_evolutions.json ({len(megas)} Megas).")


def fetch_single_pokemon(poke_id):
    """Descarga y procesa un Pokémon individual y sus sprites."""
    try:
        url = f"{POKEAPI_BASE}/pokemon/{poke_id}"
        resp = requests.get(url, timeout=12)
        if resp.status_code != 200:
            return None
            
        data = resp.json()
        stats = {s["stat"]["name"]: s["base_stat"] for s in data["stats"]}
        types = [t["type"]["name"] for t in data["types"]]
        
        # Movimientos por nivel
        learnset = []
        for m in data["moves"]:
            for vgd in m["version_group_details"]:
                if vgd["move_learn_method"]["name"] == "level-up":
                    learnset.append({
                        "move": m["move"]["name"],
                        "level": vgd["level_learned_at"]
                    })
                    break
        learnset.sort(key=lambda x: x["level"])
        
        # Habilidades
        abilities = [a["ability"]["name"] for a in data.get("abilities", [])]
        
        # Sprites
        sprites = data.get("sprites", {})
        front_url = sprites.get("front_default")
        back_url = sprites.get("back_default")
        
        if front_url:
            img = requests.get(front_url, timeout=10).content
            with open(os.path.join(SPRITES_DIR, f"{poke_id}_front.png"), "wb") as f:
                f.write(img)
                
        if back_url:
            img = requests.get(back_url, timeout=10).content
            with open(os.path.join(SPRITES_DIR, f"{poke_id}_back.png"), "wb") as f:
                f.write(img)
                
        return {
            "id": poke_id,
            "name": data["name"].capitalize(),
            "types": types,
            "stats": {
                "hp": stats.get("hp", 45),
                "attack": stats.get("attack", 45),
                "defense": stats.get("defense", 45),
                "special_attack": stats.get("special-attack", 45),
                "special_defense": stats.get("special-defense", 45),
                "speed": stats.get("speed", 45)
            },
            "height": data["height"] / 10.0,
            "weight": data["weight"] / 10.0,
            "base_experience": data.get("base_experience", 64),
            "abilities": abilities,
            "learnset": learnset,
            "sprite_paths": {
                "front": f"assets/sprites/pokemon/{poke_id}_front.png",
                "back": f"assets/sprites/pokemon/{poke_id}_back.png"
            }
        }
    except Exception as e:
        print(f"❌ Error en ID {poke_id}: {e}")
        return None


def fetch_regional_pokedex(workers=10):
    """Descarga todo el catálogo de la Pokédex Regional de Andara."""
    print(f"🔹 [4/5] Descargando {len(REGIONAL_DEX_IDS)} especies de la Pokédex de Andara...")
    pokedex = {}
    
    with ThreadPoolExecutor(max_workers=workers) as executor:
        results = list(executor.map(fetch_single_pokemon, REGIONAL_DEX_IDS))
        
    for p in results:
        if p:
            pokedex[p["id"]] = p
            
    with open(os.path.join(DATA_DIR, "pokedex.json"), "w", encoding="utf-8") as f:
        json.dump(pokedex, f, ensure_ascii=False, indent=2)
        
    print(f"✔ Pokédex Regional guardada en data/pokedex.json ({len(pokedex)} especies).")


def fetch_items():
    """Genera el catálogo de objetos de batalla, medicina y Pokéballs."""
    print("🔹 [5/5] Generando catálogo de objetos e inventario...")
    items = {
        "pokeball": {"name": "Poké Ball", "category": "pokeballs", "price": 200, "catch_rate": 1.0, "desc": "Dispositivo esférico para capturar Pokémon silvestres."},
        "greatball": {"name": "Súper Ball", "category": "pokeballs", "price": 600, "catch_rate": 1.5, "desc": "Poké Ball de alto rendimiento con mayor ratio de captura."},
        "ultraball": {"name": "Ultra Ball", "category": "pokeballs", "price": 1200, "catch_rate": 2.0, "desc": "Poké Ball ultra eficaz para capturas difíciles."},
        "safariball": {"name": "Safari Ball", "category": "pokeballs", "price": 0, "catch_rate": 1.5, "desc": "Ball especial para la Reserva Ecológica de Andara."},
        "potion": {"name": "Poción", "category": "medicine", "price": 300, "heal_hp": 20, "desc": "Restaura 20 PS de un Pokémon."},
        "superpotion": {"name": "Superpoción", "category": "medicine", "price": 700, "heal_hp": 50, "desc": "Restaura 50 PS de un Pokémon."},
        "hyperpotion": {"name": "Hiperpoción", "category": "medicine", "price": 1200, "heal_hp": 200, "desc": "Restaura 200 PS de un Pokémon."},
        "maxpotion": {"name": "Poción Máxima", "category": "medicine", "price": 2500, "heal_hp": 9999, "desc": "Restaura todos los PS de un Pokémon."},
        "revive": {"name": "Revivir", "category": "medicine", "price": 1500, "revive_hp_percent": 0.5, "desc": "Revive a un Pokémon debilitado con la mitad de sus PS."},
        "antidote": {"name": "Antídoto", "category": "medicine", "price": 100, "cure_status": "poison", "desc": "Cura el envenenamiento."},
        "paralyzeheal": {"name": "Antiparalizador", "category": "medicine", "price": 200, "cure_status": "paralysis", "desc": "Cura la parálisis."},
        "fullheal": {"name": "Cura Total", "category": "medicine", "price": 600, "cure_status": "all", "desc": "Cura cualquier problema de estado alterado."},
        "megaring": {"name": "Mega-Aro de Andara", "category": "key_items", "price": 0, "desc": "Pulsera ancestral que resuena con las Mega Piedras."},
        "zygarde_cube": {"name": "Arca de Zygarde", "category": "key_items", "price": 0, "desc": "Artefacto para recolectar células y núcleos de Zygarde."}
    }
    
    with open(os.path.join(DATA_DIR, "items.json"), "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"✔ Catálogo de objetos guardado en data/items.json ({len(items)} objetos).")


def main():
    print("==================================================")
    print("⚡ POKÉMON: ECOS DE ANDARA — PIPELINE DE DATOS (FASE 1)")
    print("==================================================")
    
    fetch_types_table()
    fetch_moves()
    fetch_mega_evolutions()
    fetch_regional_pokedex()
    fetch_items()
    
    print("\n🎉 ¡FASE 1 COMPLETADA CON ÉXITO! Todos los archivos locales están listos en data/ y assets/.")


if __name__ == "__main__":
    main()
