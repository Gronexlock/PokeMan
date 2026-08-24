"""
tileset_loader.py  —  Carga el tileset PNG y extrae tiles individuales
Soporta el tileset generado por IA con tiles de 32x32 px escalados a TILE_SIZE
"""
import os
import pygame


class TilesetLoader:
    """
    Carga un tileset PNG y permite extraer tiles por indice (col, row).
    El tileset generado tiene tiles de aprox 32px cada uno en imagen de 1024x1024.
    """

    def __init__(self, path: str, src_tile_size: int = 32, dest_tile_size: int = 48):
        self.src_tile_size  = src_tile_size
        self.dest_tile_size = dest_tile_size
        self._cache: dict[tuple, pygame.Surface] = {}
        self._sheet: pygame.Surface | None = None
        self._loaded = False

        if os.path.exists(path):
            try:
                raw = pygame.image.load(path)
                # Asegurarse de que tiene canal alpha
                self._sheet = raw.convert_alpha() if raw.get_flags() & pygame.SRCALPHA else raw.convert()
                self._loaded = True
            except Exception as e:
                print(f"[TilesetLoader] No se pudo cargar {path}: {e}")

    @property
    def loaded(self) -> bool:
        return self._loaded

    def get_tile(self, col: int, row: int) -> pygame.Surface | None:
        """Extrae el tile en la posicion (col, row) del tileset"""
        key = (col, row)
        if key in self._cache:
            return self._cache[key]

        if not self._loaded or self._sheet is None:
            return None

        S = self.src_tile_size
        src_rect = pygame.Rect(col * S, row * S, S, S)

        # Verificar que el rect esta dentro del sheet
        sheet_w = self._sheet.get_width()
        sheet_h = self._sheet.get_height()
        if src_rect.right > sheet_w or src_rect.bottom > sheet_h:
            return None

        tile_surf = pygame.Surface((S, S), pygame.SRCALPHA)
        tile_surf.blit(self._sheet, (0, 0), src_rect)

        # Escalar al tamaño de destino
        if self.dest_tile_size != S:
            tile_surf = pygame.transform.scale(tile_surf, (self.dest_tile_size, self.dest_tile_size))

        self._cache[key] = tile_surf
        return tile_surf


class CharacterSpriteLoader:
    """
    Carga el sprite sheet de personajes y extrae frames de animacion.
    El sheet tiene filas de personajes con columnas de frames de animacion.
    """

    def __init__(self, path: str, dest_size: tuple = (48, 48)):
        self.dest_size = dest_size
        self._cache: dict[tuple, pygame.Surface] = {}
        self._sheet: pygame.Surface | None = None
        self._loaded = False

        if os.path.exists(path):
            try:
                raw = pygame.image.load(path)
                self._sheet = raw.convert_alpha() if raw.get_flags() & pygame.SRCALPHA else raw.convert()
                self._loaded = True
                # Calcular tamaño de cada frame (8 cols x 12 rows)
                self._frame_w = self._sheet.get_width() // 8
                self._frame_h = self._sheet.get_height() // 12
            except Exception as e:
                print(f"[CharacterSpriteLoader] No se pudo cargar {path}: {e}")

    @property
    def loaded(self) -> bool:
        return self._loaded

    def get_frame(self, character: str, direction: str, frame: int = 0) -> pygame.Surface | None:
        """
        Obtiene el frame de animacion de un personaje.
        character: "player", "rival", "professor", "npc_girl"
        direction: "down", "up", "left", "right"
        frame: 0=idle, 1=paso1, 2=paso2, 3=paso3
        """
        key = (character, direction, frame)
        if key in self._cache:
            return self._cache[key]

        if not self._loaded or self._sheet is None:
            return None

        # Base row depending on character (each character has 4 rows of 4 directions)
        start_row = {
            "player":    0,
            "rival":     0,
            "professor": 4,
            "npc_girl":  8,
        }.get(character, 0)

        # Direction row offset (0=down, 1=up, 2=left, 3=right)
        dir_offset = {
            "down":  0,
            "up":    1,
            "left":  2,
            "right": 3
        }.get(direction, 0)

        # Character column offset
        col_offset = 0
        if character == "rival":
            col_offset = 4  # Col 4-7

        # Frame selection
        col = col_offset + (frame % 4)
        row = start_row + dir_offset

        fw, fh = self._frame_w, self._frame_h
        src_rect = pygame.Rect(col * fw, row * fh, fw, fh)

        if src_rect.right > self._sheet.get_width() or src_rect.bottom > self._sheet.get_height():
            return None

        surf = pygame.Surface((fw, fh), pygame.SRCALPHA)
        surf.blit(self._sheet, (0, 0), src_rect)

        # Hacer transparente el fondo de cuadricula (checkerboard)
        # Reemplazamos los pixeles blanco/gris del fondo con transparencia total.
        for x in range(fw):
            for y in range(fh):
                color = surf.get_at((x, y))
                r, g, b = color.r, color.g, color.b
                # Rango para blanco (cerca de 255)
                is_white = (r > 230 and g > 230 and b > 230)
                # Rango para gris (cerca de 211)
                is_gray = (195 < r < 228 and 195 < g < 228 and 195 < b < 228)
                if is_white or is_gray:
                    surf.set_at((x, y), (0, 0, 0, 0))

        # Voltear horizontalmente para izquierda (si el sheet solo tiene vistas laterales para derecha,
        # o viceversa. Pero el sheet tiene izquierda en la fila 2 y derecha en la fila 3.
        # Solo volteamos si la direccion es left y no hay fila side especifica,
        # pero en este caso el sprite sheet ya tiene fila de izquierda y de derecha.
        # Sin embargo, si es left y es una chica de rosa o profesor que cae en fallback, podemos voltear.
        if direction == "left" and character in ("professor", "npc_girl") and dir_offset < 2:
            surf = pygame.transform.flip(surf, True, False)

        # Escalar al tamaño de destino con scale normal (más nítido para pixel art)
        surf = pygame.transform.scale(surf, self.dest_size)

        self._cache[key] = surf
        return surf

