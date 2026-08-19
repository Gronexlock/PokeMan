"""
Script de Extracción Automatizada para PokéAPI (Modo Offline)
Descarga datos de especies, estadísticas, tipos, movimientos y sprites
para almacenarlos localmente y permitir la ejecución 100% offline del juego.
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

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(SPRITES_DIR, exist_ok=True)


def fetch_types_table():
    """Descarga la tabla completa de efectividades de tipos."""
    print("🔹 [1/3] Descargando tabla de efectividad de tipos...")
    type_chart = {}
    
    url = f"{POKEAPI_BASE}/type"
    resp = requests.get(url).json()
    
    for t_entry in resp.get("results", []):
        t_name = t_entry["name"]
        if t_name in ["unknown", "shadow"]:
            continue
            
        t_detail = requests.get(t_entry["url"]).json()
        dmg_relations = t_detail["damage_relations"]
        
        type_chart[t_name] = {
            "double_damage_to": [t["name"] for t in dmg_relations["double_damage_to"]],
            "half_damage_to": [t["name"] for t in dmg_relations["half_damage_to"]],
            "no_damage_to": [t["name"] for t in dmg_relations["no_damage_to"]],
        }
        
    with open(os.path.join(DATA_DIR, "types.json"), "w", encoding="utf-8") as f:
        json.dump(type_chart, f, ensure_ascii=False, indent=2)
    print("✔ Tipos guardados en data/types.json")


def fetch_single_pokemon(poke_id):
    """Descarga y procesa un Pokémon individual y sus sprites."""
    try:
        url = f"{POKEAPI_BASE}/pokemon/{poke_id}"
        resp = requests.get(url, timeout=10)
        if resp.status_code != 200:
            return None
            
        data = resp.json()
        
        # Mapeo de stats base
        stats = {s["stat"]["name"]: s["base_stat"] for s in data["stats"]}
        
        # Tipos
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
        
        # Descarga de Sprites
        sprites = data.get("sprites", {})
        front_url = sprites.get("front_default")
        back_url = sprites.get("back_default")
        
        # Showdown animated sprites si están disponibles
        other = sprites.get("other", {})
        showdown = other.get("showdown", {})
        front_anim_url = showdown.get("front_default") or front_url
        back_anim_url = showdown.get("back_default") or back_url
        
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
            "height": data["height"] / 10.0, # Metros
            "weight": data["weight"] / 10.0, # Kg
            "base_experience": data.get("base_experience", 64),
            "learnset": learnset,
            "sprite_paths": {
                "front": f"assets/sprites/pokemon/{poke_id}_front.png",
                "back": f"assets/sprites/pokemon/{poke_id}_back.png"
            }
        }
    except Exception as e:
        print(f"❌ Error descargando ID {poke_id}: {e}")
        return None


def fetch_all_pokemon(count=151, workers=8):
    """Descarga el catálogo de Pokémon en paralelo."""
    print(f"🔹 [2/3] Descargando catálogo de {count} Pokémon y sprites...")
    pokedex = {}
    
    with ThreadPoolExecutor(max_workers=workers) as executor:
        results = list(executor.map(fetch_single_pokemon, range(1, count + 1)))
        
    for p in results:
        if p:
            pokedex[p["id"]] = p
            
    with open(os.path.join(DATA_DIR, "pokedex.json"), "w", encoding="utf-8") as f:
        json.dump(pokedex, f, ensure_ascii=False, indent=2)
        
    print(f"✔ Pokédex guardada en data/pokedex.json ({len(pokedex)} especies).")


def main():
    parser = argparse.ArgumentParser(description="Extractor de datos PokéAPI para juegos offline")
    parser.add_argument("--count", type=int, default=151, help="Número de Pokémon a descargar (default: 151)")
    parser.add_argument("--workers", type=int, default=8, help="Hilos paralelos de descarga (default: 8)")
    args = parser.parse_args()

    print("==================================================")
    print("⚡ Iniciando Extracción de PokéAPI para Modo Offline")
    print("==================================================")
    
    fetch_types_table()
    fetch_all_pokemon(count=args.count, workers=args.workers)
    
    print("\n🎉 ¡Proceso completado! Todos los datos están listos en la carpeta /data y /assets.")


if __name__ == "__main__":
    main()
