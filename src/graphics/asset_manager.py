"""
asset_manager.py  —  Gestor centralizado de sprites, sonidos y fuentes
Carga los assets descargados de la PokeAPI (o genera placeholders si no existen)
"""
import os
import pygame


class AssetManager:
    def __init__(self, project_root: str):
        self.root = project_root
        self.sprites_dir  = os.path.join(project_root, "assets", "sprites")
        self.audio_dir    = os.path.join(project_root, "assets", "audio")

        self._sprite_cache: dict = {}
        self._sound_cache:  dict = {}
        self._font_cache:   dict = {}

        # Colores por tipo para placeholders cuando no hay sprite
        self.TYPE_COLORS = {
            "normal":   (168, 168, 120), "fire":     (240, 128, 48),
            "water":    (104, 144, 240), "grass":    (120, 200, 80),
            "electric": (248, 208, 48),  "ice":      (152, 216, 216),
            "fighting": (192, 48,  40),  "poison":   (160, 64,  160),
            "ground":   (224, 192, 104), "flying":   (168, 144, 240),
            "psychic":  (248, 88,  136), "bug":      (168, 184, 32),
            "rock":     (184, 160, 56),  "ghost":    (112, 88,  152),
            "dragon":   (112, 56,  248), "dark":     (112, 88,  72),
            "steel":    (184, 184, 208), "fairy":    (238, 153, 172),
        }

    # ── Fuentes ──────────────────────────────────────────────────────────────

    def font(self, size: int, bold: bool = False) -> pygame.font.Font:
        key = (size, bold)
        if key not in self._font_cache:
            # Intenta cargar fuentes del sistema
            candidates = ["Segoe UI", "Arial", "Helvetica", None]
            loaded = None
            for name in candidates:
                try:
                    loaded = pygame.font.SysFont(name, size, bold=bold)
                    break
                except Exception:
                    continue
            self._font_cache[key] = loaded or pygame.font.Font(None, size)
        return self._font_cache[key]

    # ── Sprites de Pokemon ────────────────────────────────────────────────────

    def get_pokemon_sprite(self, pokemon_id: int, variant: str = "battle_animated",
                           size: tuple = None) -> pygame.Surface:
        """
        Carga el sprite de un Pokemon. Variants: battle_animated, artwork, battle_shiny, icons
        Si no existe, genera un placeholder de color segun el tipo.
        """
        cache_key = (pokemon_id, variant, size)
        if cache_key in self._sprite_cache:
            return self._sprite_cache[cache_key]

        # Buscar archivo
        ext = ".gif" if variant == "battle_animated" else ".png"
        path = os.path.join(self.sprites_dir, variant, f"{pokemon_id}{ext}")

        surf = None
        if os.path.exists(path):
            try:
                surf = pygame.image.load(path).convert_alpha()
            except Exception:
                surf = None

        if surf is None:
            # Placeholder: silueta de color
            w, h = size if size else (96, 96)
            surf = self._make_placeholder(w, h)

        if size and surf:
            surf = pygame.transform.smoothscale(surf, size)

        self._sprite_cache[cache_key] = surf
        return surf

    def get_pokemon_sprite_with_type(self, pokemon_id: int, poke_types: list,
                                     variant: str = "battle_animated",
                                     size: tuple = None) -> pygame.Surface:
        """Como get_pokemon_sprite pero usa el tipo para el color del placeholder"""
        cache_key = (pokemon_id, variant, size, "typed")
        if cache_key in self._sprite_cache:
            return self._sprite_cache[cache_key]

        ext = ".gif" if variant == "battle_animated" else ".png"
        path = os.path.join(self.sprites_dir, variant, f"{pokemon_id}{ext}")

        surf = None
        if os.path.exists(path):
            try:
                surf = pygame.image.load(path).convert_alpha()
            except Exception:
                surf = None

        if surf is None:
            w, h = size if size else (120, 120)
            color = self.TYPE_COLORS.get(poke_types[0] if poke_types else "normal", (200, 200, 200))
            surf = self._make_typed_placeholder(w, h, color, poke_types)

        if size and surf:
            surf = pygame.transform.smoothscale(surf, size)

        self._sprite_cache[cache_key] = surf
        return surf

    def _make_placeholder(self, w: int, h: int) -> pygame.Surface:
        surf = pygame.Surface((w, h), pygame.SRCALPHA)
        surf.fill((180, 180, 180, 180))
        pygame.draw.ellipse(surf, (140, 140, 140, 220), (w//6, h//6, w*2//3, h*2//3))
        return surf

    def _make_typed_placeholder(self, w: int, h: int, color: tuple, types: list) -> pygame.Surface:
        surf = pygame.Surface((w, h), pygame.SRCALPHA)
        # Fondo degradado
        for y in range(h):
            alpha = int(200 * (1 - y / h * 0.3))
            r = min(255, color[0] + int((255 - color[0]) * y / h * 0.2))
            g = min(255, color[1] + int((255 - color[1]) * y / h * 0.2))
            b = min(255, color[2] + int((255 - color[2]) * y / h * 0.2))
            pygame.draw.line(surf, (r, g, b, alpha), (0, y), (w, y))
        # Silueta de Pokemon (ovalo simplificado)
        pygame.draw.ellipse(surf, (*color, 255), (w//8, h//4, w*3//4, h//2))
        pygame.draw.ellipse(surf, (255, 255, 255, 80), (w//8, h//4, w*3//4, h//2), 2)
        return surf

    # ── Audio ─────────────────────────────────────────────────────────────────

    def get_cry(self, pokemon_id: int) -> pygame.mixer.Sound | None:
        key = f"cry_{pokemon_id}"
        if key in self._sound_cache:
            return self._sound_cache[key]
        path = os.path.join(self.audio_dir, "cries", f"{pokemon_id}.ogg")
        sound = None
        if os.path.exists(path):
            try:
                sound = pygame.mixer.Sound(path)
            except Exception:
                sound = None
        self._sound_cache[key] = sound
        return sound

    def play_cry(self, pokemon_id: int):
        cry = self.get_cry(pokemon_id)
        if cry:
            cry.play()

    # ── UI Icons ──────────────────────────────────────────────────────────────

    def get_type_badge(self, type_name: str, size: tuple = (52, 18)) -> pygame.Surface:
        """Genera una insignia de tipo con color de fondo"""
        color = self.TYPE_COLORS.get(type_name, (168, 168, 120))
        surf = pygame.Surface(size, pygame.SRCALPHA)
        pygame.draw.rect(surf, (*color, 220), (0, 0, *size), border_radius=4)
        pygame.draw.rect(surf, (255, 255, 255, 60), (0, 0, *size), 1, border_radius=4)
        font = self.font(12, bold=True)
        label = font.render(type_name.upper(), True, (255, 255, 255))
        surf.blit(label, (size[0]//2 - label.get_width()//2,
                          size[1]//2 - label.get_height()//2))
        return surf
