"""
download_clean_gba_assets.py
Descarga assets oficiales CC0 en pixel-art estilo GBA para overworld,
personajes, casas, arboles y fuentes sin problemas de corte ni rejillas.
"""
import os
import urllib.request

BASE_URL = "https://raw.githubusercontent.com/clear-code-projects/Python-Monsters/main/graphics"

FILES = [
    # Personajes (sprite sheets 4x4 transparentes)
    ("characters/player.png", "characters/player.png"),
    ("characters/blond.png", "characters/blond.png"),
    ("characters/hat_girl.png", "characters/hat_girl.png"),
    ("characters/purple_girl.png", "characters/purple_girl.png"),
    ("characters/young_guy.png", "characters/young_guy.png"),
    ("characters/young_girl.png", "characters/young_girl.png"),
    ("characters/straw.png", "characters/straw.png"),
    ("characters/grass_boss.png", "characters/professor.png"),  # Prof Ceibo
    
    # Objetos y estructuras del Overworld
    ("objects/house_small.png", "objects/house_small.png"),
    ("objects/house_small_alt.png", "objects/house_small_alt.png"),
    ("objects/house_large.png", "objects/house_large.png"),
    ("objects/hospital.png", "objects/hospital.png"),
    ("objects/green_tree.png", "objects/green_tree.png"),
    ("objects/green_tree_bushy.png", "objects/green_tree_bushy.png"),
    ("objects/green_tree_small.png", "objects/green_tree_small.png"),
    ("objects/grass.png", "objects/grass.png"),
    ("objects/grassrock1.png", "objects/grassrock1.png"),
    ("objects/grassrock2.png", "objects/grassrock2.png"),
    ("other/shadow.png", "other/shadow.png"),
    
    # Tilesets
    ("tilesets/world.png", "tilesets/world.png"),
    ("tilesets/coast.png", "tilesets/coast.png"),
    ("tilesets/water/0.png", "tilesets/water/0.png"),
    ("tilesets/water/1.png", "tilesets/water/1.png"),
    ("tilesets/water/2.png", "tilesets/water/2.png"),
    ("tilesets/water/3.png", "tilesets/water/3.png"),
    
    # Fuentes retro GBA
    ("fonts/dogicapixelbold.otf", "fonts/pokemon_font.otf"),
]

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST_BASE = os.path.join(PROJECT_ROOT, "assets", "sprites", "gba")

def main():
    print("Descargando assets GBA de alta calidad...")
    os.makedirs(DEST_BASE, exist_ok=True)
    
    for remote_path, local_rel in FILES:
        url = f"{BASE_URL}/{remote_path}"
        dest_path = os.path.join(DEST_BASE, local_rel)
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = resp.read()
            with open(dest_path, "wb") as f:
                f.write(data)
            print(f"  OK: {local_rel}")
        except Exception as e:
            print(f"  ERROR {local_rel}: {e}")

    print("\nDescarga de assets GBA finalizada con exito!")

if __name__ == "__main__":
    main()
