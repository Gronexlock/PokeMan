"""
Módulo de Shaders de Iluminación Dinámica y Gradientes de Color (2.5D)
======================================================================
Proyecto: Pokémon: Ecos de Andara
Modula la iluminación ambiental (CanvasModulate) en función del ciclo acelerado
de 24 minutos = 24 horas del juego, gestiona luces puntuales (farolas, ventanas)
y aplica corrección de color cinemática (Color Grading).
"""

from typing import Dict, Any, List, Tuple, Optional


class LightingShader:
    """Simulador y gestor de shaders de luz ambiental y emisores de luz puntual."""

    # Paletas de color ambiental RGBA por periodo del día
    AMBIENT_PALETTES = {
        "morning": {
            "name": "Amanecer Dorado",
            "ambient_rgb": (255, 220, 180),
            "darkness_factor": 0.15,
            "light_tint": "#FFDCB4",
            "shadow_alpha": 0.35,
            "sun_angle": 30
        },
        "day": {
            "name": "Mediodía Cristalino",
            "ambient_rgb": (255, 255, 255),
            "darkness_factor": 0.00,
            "light_tint": "#FFFFFF",
            "shadow_alpha": 0.20,
            "sun_angle": 90
        },
        "sunset": {
            "name": "Atardecer Ámbar",
            "ambient_rgb": (255, 160, 110),
            "darkness_factor": 0.30,
            "light_tint": "#FFA06E",
            "shadow_alpha": 0.50,
            "sun_angle": 150
        },
        "night": {
            "name": "Noche Azul Cobalto",
            "ambient_rgb": (35, 45, 95),
            "darkness_factor": 0.75,
            "light_tint": "#232D5F",
            "shadow_alpha": 0.75,
            "sun_angle": 0
        }
    }

    def __init__(self):
        self.point_lights: List[Dict[str, Any]] = []

    def get_ambient_lighting(self, period: str, minute_progress: float = 0.5) -> Dict[str, Any]:
        """
        Calcula la luz ambiental y tintado global interpolado para el periodo actual.
        """
        palette = self.AMBIENT_PALETTES.get(period, self.AMBIENT_PALETTES["day"])
        rgb = palette["ambient_rgb"]

        # Código de color ANSI/Terminal para previsualización o canvas
        r, g, b = rgb
        tint_hex = f"#{r:02X}{g:02X}{b:02X}"

        return {
            "period": period,
            "name": palette["name"],
            "rgb": rgb,
            "tint_hex": tint_hex,
            "darkness_factor": palette["darkness_factor"],
            "shadow_alpha": palette["shadow_alpha"],
            "sun_angle": palette["sun_angle"],
            "point_lights_active": period in ["sunset", "night"]
        }

    def add_point_light(self, x: int, y: int, radius: int = 3, intensity: float = 1.0, color_rgb: Tuple[int, int, int] = (255, 220, 130)) -> None:
        """Añade una fuente de luz puntual (ej. farola, antorcha o ventana iluminada)."""
        self.point_lights.append({
            "x": x,
            "y": y,
            "radius": radius,
            "intensity": intensity,
            "color_rgb": color_rgb
        })

    def get_light_intensity_at_tile(self, tile_x: int, tile_y: int, period: str) -> float:
        """Calcula la intensidad de luz recibida en un tile (combinando ambiental + luces puntuales)."""
        base_ambient = 1.0 - self.AMBIENT_PALETTES.get(period, {}).get("darkness_factor", 0.0)

        if period not in ["sunset", "night"]:
            return min(1.0, base_ambient)

        # Evaluar aportes de emisores puntuales
        extra_light = 0.0
        for light in self.point_lights:
            dx = tile_x - light["x"]
            dy = tile_y - light["y"]
            dist_sq = dx * dx + dy * dy
            r_sq = light["radius"] * light["radius"]

            if dist_sq <= r_sq:
                dist = dist_sq ** 0.5
                factor = (1.0 - (dist / light["radius"])) * light["intensity"]
                extra_light += max(0.0, factor)

        return min(1.0, base_ambient + extra_light)
