"""
Módulo del Gestor de Ciclo Día / Noche Acelerado
================================================
Proyecto: Pokémon: Ecos de Andara
Gestiona el reloj dinámico acelerado propio del juego (24 min reales = 24 hrs in-game),
determina los periodos del día (Mañana, Día, Atardecer, Noche) y modula la iluminación.
"""

import json
import os
from typing import Dict, Any, Optional, Tuple


class TimeCycleManager:
    """Controlador del ciclo temporal y ambiental acelerado del mundo."""

    PERIOD_MORNING = "morning"
    PERIOD_DAY = "day"
    PERIOD_EVENING = "evening"
    PERIOD_NIGHT = "night"

    def __init__(self, cycle_minutes: float = 24.0, start_hour: int = 10, start_minute: int = 0):
        # 24 minutos reales = 1440 minutos in-game -> 1 seg real = 1 min in-game por defecto
        self.cycle_minutes = cycle_minutes
        self.current_in_game_minutes = (start_hour * 60) + start_minute
        self.time_scale = (24 * 60) / (cycle_minutes * 60)  # Multiplicador de avance temporal

    @property
    def hour(self) -> int:
        return int((self.current_in_game_minutes // 60) % 24)

    @property
    def minute(self) -> int:
        return int(self.current_in_game_minutes % 60)

    @property
    def formatted_time(self) -> str:
        return f"{self.hour:02d}:{self.minute:02d}"

    def update(self, delta_real_seconds: float) -> None:
        """Avanza el tiempo in-game en función de los segundos transcurridos en tiempo real."""
        advance_in_game_seconds = delta_real_seconds * self.time_scale
        self.current_in_game_minutes += (advance_in_game_seconds / 60.0)
        self.current_in_game_minutes %= (24 * 60)

    def set_time(self, hour: int, minute: int = 0) -> None:
        """Fija la hora del juego a un valor específico."""
        self.current_in_game_minutes = ((hour % 24) * 60) + (minute % 60)

    def get_period(self) -> str:
        """
        Retorna el periodo ambiental actual:
        - 06:00 a 09:59 -> morning (Amanecer / Mañana)
        - 10:00 a 16:59 -> day (Día pleno)
        - 17:00 a 19:59 -> evening (Atardecer / Puesta de Sol)
        - 20:00 a 05:59 -> night (Noche)
        """
        h = self.hour
        if 6 <= h < 10:
            return self.PERIOD_MORNING
        elif 10 <= h < 17:
            return self.PERIOD_DAY
        elif 17 <= h < 20:
            return self.PERIOD_EVENING
        else:
            return self.PERIOD_NIGHT

    def is_daytime(self) -> bool:
        """Indica si es de día (incluye mañana y mediodía)."""
        return self.get_period() in [self.PERIOD_MORNING, self.PERIOD_DAY]

    def is_nighttime(self) -> bool:
        """Indica si es de noche."""
        return self.get_period() == self.PERIOD_NIGHT

    def get_ambient_color(self) -> Dict[str, Any]:
        """
        Retorna la tonalidad y opacidad de luz para el shader de iluminación ambiental (CanvasModulate).
        """
        period = self.get_period()
        if period == self.PERIOD_MORNING:
            return {"r": 1.0, "g": 0.9, "b": 0.75, "alpha": 0.85, "name": "warm_gold"}
        elif period == self.PERIOD_DAY:
            return {"r": 1.0, "g": 1.0, "b": 1.0, "alpha": 1.0, "name": "bright_day"}
        elif period == self.PERIOD_EVENING:
            return {"r": 1.0, "g": 0.65, "b": 0.45, "alpha": 0.75, "name": "sunset_amber"}
        else:  # night
            return {"r": 0.25, "g": 0.35, "b": 0.65, "alpha": 0.45, "name": "night_blue"}
