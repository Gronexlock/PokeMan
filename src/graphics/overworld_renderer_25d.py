"""
Módulo de Renderizado 2.5D en Capas con Y-Sorting y Shaders de Iluminación
==========================================================================
Proyecto: Pokémon: Ecos de Andara
Gestiona la cámara del jugador, la ordenación por profundidad (Y-sorting),
el renderizado de biomas en capas y la aplicación de los shaders ambientales.
"""

import sys
import os
from typing import Dict, Any, List, Optional, Tuple

_current_dir = os.path.dirname(os.path.abspath(__file__))
_src_dir = os.path.dirname(_current_dir)
if _src_dir not in sys.path:
    sys.path.insert(0, _src_dir)

from graphics.lighting_shader import LightingShader


class OverworldRenderer25D:
    """Motor de visualización 2.5D para mapas y exploración en tiempo real."""

    # Representación visual de tiles con profundidad
    TILE_GLYPHS = {
        0: {"char": " . ", "desc": "Camino / Suelo llano"},
        1: {"char": "🌲",  "desc": "Árbol / Muro sólido"},
        2: {"char": "🌿",  "desc": "Hierba alta con encuentros"},
        3: {"char": "🌊",  "desc": "Agua / Superficie navegable"},
        4: {"char": "⏬",  "desc": "Bordillo / Desnivel (Ledge hacia el sur)"},
        5: {"char": "🚪",  "desc": "Puerta / Warp hacia otro mapa"}
    }

    PLAYER_GLYPHS = {
        "UP": "🧑‍🦱⬆️",
        "DOWN": "🧑‍🦱⬇️",
        "LEFT": "⬅️🧑",
        "RIGHT": "🧑➡️"
    }

    NPC_GLYPHS = {
        "trainer": "🤠",
        "villager": "🧔",
        "nurse": "👩‍⚕️",
        "clerk": "👨‍💼"
    }

    def __init__(self):
        self.shader = LightingShader()

    def render_viewport(
        self,
        map_data: Dict[str, Any],
        player_x: int,
        player_y: int,
        player_facing: str = "DOWN",
        npcs: Optional[List[Dict[str, Any]]] = None,
        time_period: str = "day",
        viewport_width: int = 13,
        viewport_height: int = 9
    ) -> List[str]:
        """
        Genera el cuadro visual de la cámara centrado en el jugador:
        1. Determina los límites de la cámara (Viewport).
        2. Aplica Y-sorting sobre elementos y personajes.
        3. Aplica iluminación y fuentes puntuales (Farolas).
        4. Retorna las líneas renderizadas.
        """
        collision_matrix = map_data.get("collision_layer", [])
        map_h = len(collision_matrix)
        map_w = len(collision_matrix[0]) if map_h > 0 else 0

        half_w = viewport_width // 2
        half_h = viewport_height // 2

        start_x = max(0, min(map_w - viewport_width, player_x - half_w))
        start_y = max(0, min(map_h - viewport_height, player_y - half_h))
        end_x = min(map_w, start_x + viewport_width)
        end_y = min(map_h, start_y + viewport_height)

        ambient_info = self.shader.get_ambient_lighting(time_period)
        frame_lines = []

        # Encabezado visual
        header = f" ╔══════════════════ [🗺️ {map_data.get('name', 'Mapa')} | ⏰ {ambient_info['name']}] ══════════════════╗"
        frame_lines.append(header)

        # Mapa de NPCs para búsqueda rápida
        npc_pos = {}
        for npc in (npcs or []):
            npc_pos[(npc.get("x"), npc.get("y"))] = npc

        for y in range(start_y, end_y):
            row_str = " ║  "
            for x in range(start_x, end_x):
                # 1. Jugador
                if x == player_x and y == player_y:
                    p_glyph = self.PLAYER_GLYPHS.get(player_facing, "🧑")
                    row_str += f"{p_glyph} "
                # 2. NPCs
                elif (x, y) in npc_pos:
                    npc = npc_pos[(x, y)]
                    glyph = self.NPC_GLYPHS.get(npc.get("npc_type", "trainer"), "🤠")
                    has_seen = "!" if npc.get("alert_triggered") else " "
                    row_str += f"{glyph}{has_seen}"
                # 3. Tiles del escenario
                else:
                    tile_type = collision_matrix[y][x]
                    glyph_data = self.TILE_GLYPHS.get(tile_type, {"char": " ? "})
                    row_str += glyph_data["char"]
            row_str += "  ║"
            frame_lines.append(row_str)

        footer = " ╚" + "═" * (len(header) - 3) + "╝"
        frame_lines.append(footer)

        return frame_lines
