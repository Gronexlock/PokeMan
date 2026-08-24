"""
tileset_loader.py  —  Cargador de sprites y objetos GBA de alta calidad
Carga sprite sheets 4x4 transparentes para personajes y objetos completos para el mapa.
"""
import os
import pygame


class GBACharacterLoader:
    """
    Carga sprite sheets 4x4 (512x512, frames de 128x128) con fondos transparentes nativos.
    Mapeo de filas:
      - Fila 0: Down (caminando hacia abajo)
      - Fila 1: Left (caminando hacia la izquierda)
      - Fila 2: Right (caminando hacia la derecha)
      - Fila 3: Up (caminando hacia arriba)
    """

    CHAR_FILES = {
        "player":    "player.png",
        "professor": "professor.png",
        "rival":     "young_guy.png",
        "habitante": "blond.png",
        "npc_girl":  "hat_girl.png",
        "young_girl":"young_girl.png",
        "straw":     "straw.png",
    }

    DIR_ROWS = {
        "down":  0,
        "left":  1,
        "right": 2,
        "up":    3,
    }

    def __init__(self, gba_base_dir: str, dest_size: tuple = (52, 52)):
        self.base_dir = gba_base_dir
        self.dest_size = dest_size
        self._sheets: dict[str, pygame.Surface] = {}
        self._cache: dict[tuple, pygame.Surface] = {}
        self._loaded = False
        self._load_all()

    def _load_all(self):
        chars_dir = os.path.join(self.base_dir, "characters")
        if not os.path.exists(chars_dir):
            print(f"[GBACharacterLoader] Directorio no encontrado: {chars_dir}")
            return

        for key, filename in self.CHAR_FILES.items():
            path = os.path.join(chars_dir, filename)
            if os.path.exists(path):
                try:
                    raw = pygame.image.load(path)
                    surf = raw.convert_alpha() if raw.get_flags() & pygame.SRCALPHA else raw.convert()
                    self._sheets[key] = surf
                except Exception as e:
                    print(f"[GBACharacterLoader] Error cargando {filename}: {e}")

        self._loaded = len(self._sheets) > 0
        if self._loaded:
            print(f"[GBACharacterLoader] {len(self._sheets)} personajes GBA cargados con exito.")

    @property
    def loaded(self) -> bool:
        return self._loaded

    def get_frame(self, character: str, direction: str, frame: int = 0) -> pygame.Surface | None:
        """
        Devuelve el frame de animación (0, 1, 2, 3) para un personaje y dirección.
        """
        key = (character, direction, frame % 4)
        if key in self._cache:
            return self._cache[key]

        sheet = self._sheets.get(character)
        if sheet is None:
            # Fallback a player si el personaje no existe
            sheet = self._sheets.get("player")
            if sheet is None:
                return None

        fw = sheet.get_width() // 4
        fh = sheet.get_height() // 4
        row = self.DIR_ROWS.get(direction, 0)
        col = frame % 4

        src_rect = pygame.Rect(col * fw, row * fh, fw, fh)
        surf = pygame.Surface((fw, fh), pygame.SRCALPHA)
        surf.blit(sheet, (0, 0), src_rect)

        # Escalar limpiamente con scale para mantener nitidez de pixel art
        scaled = pygame.transform.scale(surf, self.dest_size)
        self._cache[key] = scaled
        return scaled


class GBAObjectLoader:
    """
    Carga estructuras y objetos completos (casas, arboles, vallas, agua animada).
    """

    def __init__(self, gba_base_dir: str):
        self.base_dir = gba_base_dir
        self.objects: dict[str, pygame.Surface] = {}
        self.water_frames: list[pygame.Surface] = []
        self._loaded = False
        self._load_all()

    def _load_all(self):
        obj_dir = os.path.join(self.base_dir, "objects")
        if os.path.exists(obj_dir):
            for fname in os.listdir(obj_dir):
                if fname.endswith(".png"):
                    key = os.path.splitext(fname)[0]
                    path = os.path.join(obj_dir, fname)
                    try:
                        surf = pygame.image.load(path).convert_alpha()
                        self.objects[key] = surf
                    except Exception as e:
                        print(f"[GBAObjectLoader] Error cargando objeto {fname}: {e}")

        # Cargar frames de agua animada
        water_dir = os.path.join(self.base_dir, "tilesets", "water")
        if os.path.exists(water_dir):
            for i in range(4):
                wpath = os.path.join(water_dir, f"{i}.png")
                if os.path.exists(wpath):
                    try:
                        wsurf = pygame.image.load(wpath).convert_alpha()
                        self.water_frames.append(wsurf)
                    except Exception as e:
                        print(f"[GBAObjectLoader] Error agua {i}.png: {e}")

        # Sombra
        shadow_path = os.path.join(self.base_dir, "other", "shadow.png")
        if os.path.exists(shadow_path):
            try:
                self.objects["shadow"] = pygame.image.load(shadow_path).convert_alpha()
            except Exception:
                pass

        self._loaded = len(self.objects) > 0
        if self._loaded:
            print(f"[GBAObjectLoader] {len(self.objects)} objetos y {len(self.water_frames)} frames de agua cargados.")

    @property
    def loaded(self) -> bool:
        return self._loaded

    def get_object(self, name: str) -> pygame.Surface | None:
        return self.objects.get(name)

    def get_water(self, frame_idx: int) -> pygame.Surface | None:
        if self.water_frames:
            return self.water_frames[frame_idx % len(self.water_frames)]
        return None
