"""
download_assets.py
Descarga sprites, artworks y sonidos de todos los Pokemon del juego
desde la PokeAPI y los guarda en assets/ para uso offline.
"""
import json
import os
import sys
import time
import urllib.request
import urllib.error

# ── Configuracion ────────────────────────────────────────────────────────────
# El script vive en tools/, asi que el PROJECT_ROOT es el directorio padre
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POKEDEX_PATH = os.path.join(PROJECT_ROOT, "data", "pokedex.json")

DIRS = {
    "battle_front":   os.path.join(PROJECT_ROOT, "assets", "sprites", "battle", "front"),
    "battle_back":    os.path.join(PROJECT_ROOT, "assets", "sprites", "battle", "back"),
    "battle_shiny":   os.path.join(PROJECT_ROOT, "assets", "sprites", "battle", "shiny"),
    "battle_animated":os.path.join(PROJECT_ROOT, "assets", "sprites", "battle", "animated"),
    "artwork":        os.path.join(PROJECT_ROOT, "assets", "sprites", "artwork"),
    "home":           os.path.join(PROJECT_ROOT, "assets", "sprites", "home"),
    "icons":          os.path.join(PROJECT_ROOT, "assets", "sprites", "icons"),
    "audio_cries":    os.path.join(PROJECT_ROOT, "assets", "audio", "cries"),
}

BASE_SPRITE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon"
BASE_CRIES  = "https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest"

def url_for(pokemon_id: int, variant: str) -> str:
    pid = pokemon_id
    if variant == "battle_front":
        return f"{BASE_SPRITE}/{pid}.png"
    elif variant == "battle_back":
        return f"{BASE_SPRITE}/back/{pid}.png"
    elif variant == "battle_shiny":
        return f"{BASE_SPRITE}/shiny/{pid}.png"
    elif variant == "battle_animated":
        return f"{BASE_SPRITE}/versions/generation-v/black-white/animated/{pid}.gif"
    elif variant == "artwork":
        return f"{BASE_SPRITE}/other/official-artwork/{pid}.png"
    elif variant == "home":
        return f"{BASE_SPRITE}/other/home/{pid}.png"
    elif variant == "icons":
        return f"{BASE_SPRITE}/versions/generation-viii/icons/{pid}.png"
    elif variant == "audio_cries":
        return f"{BASE_CRIES}/{pid}.ogg"
    return ""

def ext_for(variant: str) -> str:
    if variant == "battle_animated": return ".gif"
    if variant == "audio_cries":     return ".ogg"
    return ".png"

def download_file(url: str, dest_path: str) -> bool:
    if os.path.exists(dest_path):
        return True  # ya existe, saltar
    try:
        headers = {"User-Agent": "Mozilla/5.0 PokemonEcosDeAndara/1.0"}
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
        with open(dest_path, "wb") as f:
            f.write(data)
        return True
    except Exception:
        return False

def main():
    # Crear carpetas
    for d in DIRS.values():
        os.makedirs(d, exist_ok=True)

    # Leer Pokedex
    with open(POKEDEX_PATH, encoding="utf-8-sig") as f:
        pokedex = json.load(f)

    pokemon_ids = sorted([int(k) for k in pokedex.keys()])
    total = len(pokemon_ids)

    print(f"Descargando assets para {total} Pokemon...")
    print("=" * 60)

    # Variantes a descargar (puedes comentar las que no quieras)
    variants = [
        "battle_animated",  # GIF animado Gen 5 — para combate
        "artwork",          # Artwork HD oficial — para menus y Pokedex
        "battle_shiny",     # Sprite shiny — para shinies en combate
        "icons",            # Icono pequeño — para inventario y listas
        "audio_cries",      # Sonido del Pokemon — para combate
    ]

    ok_total = 0
    fail_total = 0

    for idx, pid in enumerate(pokemon_ids, 1):
        name = pokedex[str(pid)].get("name", f"#{pid}")
        row_ok = 0
        row_fail = 0

        for variant in variants:
            url = url_for(pid, variant)
            ext = ext_for(variant)
            dest = os.path.join(DIRS[variant], f"{pid}{ext}")
            success = download_file(url, dest)
            if success:
                row_ok += 1
            else:
                row_fail += 1

        ok_total += row_ok
        fail_total += row_fail

        bar_len = 30
        filled = int(bar_len * idx / total)
        bar = "#" * filled + "-" * (bar_len - filled)
        print(f"\r[{bar}] {idx}/{total}  {name:<15}  OK:{row_ok}  Fail:{row_fail}", end="", flush=True)

        # Pausa breve para no saturar la API
        time.sleep(0.05)

    print(f"\n\nDescarga completada!")
    print(f"  Exitosos : {ok_total}")
    print(f"  Fallidos : {fail_total}  (normal para variantes sin sprite en esa gen)")
    print(f"\nSprites guardados en: {os.path.join(PROJECT_ROOT, 'assets', 'sprites')}")
    print(f"Sonidos guardados en: {os.path.join(PROJECT_ROOT, 'assets', 'audio', 'cries')}")

if __name__ == "__main__":
    main()
