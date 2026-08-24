"""
Módulo del Gestor de Mapas y Transiciones (Warps)
=================================================
Proyecto: Pokémon: Ecos de Andara
Gestiona las matrices de colisión, capas de biomas, consulta de tiles
y transiciones entre mapas de pueblos, interiores y rutas.
"""

import json
import os
from typing import Dict, Any, List, Optional, Tuple


class TileType:
    WALKABLE = 0
    SOLID = 1
    TALL_GRASS = 2
    WATER = 3
    LEDGE_DOWN = 4
    WARP = 5


class MapManager:
    """Administrador de datos cartográficos, colisiones y transiciones."""

    def __init__(self, data_dir: Optional[str] = None):
        if data_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            data_dir = os.path.join(base_dir, "data")

        self.data_dir = data_dir
        self.maps_data: Dict[str, Any] = self._load_maps()

    def _load_maps(self) -> Dict[str, Any]:
        filepath = os.path.join(self.data_dir, "maps_data.json")
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("maps", {})
        return {}

    def get_map(self, map_id: str) -> Optional[Dict[str, Any]]:
        """Retorna la definición completa del mapa solicitado."""
        return self.maps_data.get(map_id)

    def get_tile_code(self, map_id: str, x: int, y: int) -> Optional[int]:
        """
        Retorna el código de colisión/lógica de la casilla (x, y).
        Retorna None si la coordenada está fuera de los límites del mapa.
        """
        m = self.get_map(map_id)
        if not m:
            return None

        matrix = m.get("collision_matrix", [])
        height = len(matrix)
        if height == 0:
            return None
        width = len(matrix[0])

        if x < 0 or x >= width or y < 0 or y >= height:
            return None

        return matrix[y][x]

    def check_warp(self, map_id: str, x: int, y: int) -> Optional[Dict[str, Any]]:
        """Comprueba si la casilla actual contiene un punto de teletransporte (Warp)."""
        m = self.get_map(map_id)
        if not m:
            return None

        warps = m.get("warps", [])
        for w in warps:
            if w.get("x") == x and w.get("y") == y:
                return w
        return None

    def get_encounter_zone(self, map_id: str) -> Optional[str]:
        """Retorna el identificador de la zona de encuentros asociada a este mapa."""
        m = self.get_map(map_id)
        if not m:
            return None
        return m.get("encounter_zone")

    def render_ascii_view(self, map_id: str, player_x: int, player_y: int, radius: int = 4) -> str:
        """Genera una vista ASCII estilizada centrada en el jugador para depuración y UI en consola."""
        m = self.get_map(map_id)
        if not m:
            return f"[Mapa '{map_id}' no encontrado]"

        matrix = m.get("collision_matrix", [])
        height = len(matrix)
        width = len(matrix[0]) if height > 0 else 0

        # Símbolos visuales
        symbols = {
            TileType.WALKABLE: " · ",
            TileType.SOLID: " ■ ",
            TileType.TALL_GRASS: " ░ ",
            TileType.WATER: " ~ ",
            TileType.LEDGE_DOWN: " ▾ ",
            TileType.WARP: " 🚪 "
        }

        lines = [f"\n=== {m.get('display_name', map_id)} ({player_x}, {player_y}) ==="]
        for y in range(player_y - radius, player_y + radius + 1):
            row_str = ""
            for x in range(player_x - radius, player_x + radius + 1):
                if x == player_x and y == player_y:
                    row_str += " 🚶 "
                elif 0 <= x < width and 0 <= y < height:
                    code = matrix[y][x]
                    row_str += symbols.get(code, " ? ")
                else:
                    row_str += " ■ "  # Fuera de límites
            lines.append(row_str)

        return "\n".join(lines)
