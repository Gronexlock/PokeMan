"""
Módulo del Controlador del Jugador en el Overworld
==================================================
Proyecto: Pokémon: Ecos de Andara
Gestiona el movimiento tile-based fluido en 4/8 direcciones, estados de locomoción
(Caminar, Correr con Shift/B, Surf, Bici), colisiones, saltos de saliente (ledges)
e interacción con objetos/NPCs adyacentes.
"""

from typing import Dict, Any, List, Optional, Tuple


class Direction:
    UP = "up"
    DOWN = "down"
    LEFT = "left"
    RIGHT = "right"

    DELTAS = {
        "up": (0, -1),
        "down": (0, 1),
        "left": (-1, 0),
        "right": (1, 0)
    }


class PlayerState:
    IDLE = "idle"
    WALK = "walk"
    RUN = "run"
    SURF = "surf"
    BIKE = "bike"
    JUMPING_LEDGE = "jumping_ledge"


class PlayerController:
    """Controlador de movimiento y estados del protagonista en el mundo exterior."""

    def __init__(
        self,
        start_map: str = "villa_tranquimar",
        start_x: int = 9,
        start_y: int = 8,
        facing: str = Direction.DOWN
    ):
        self.map_id = start_map
        self.x = start_x
        self.y = start_y
        self.facing = facing
        self.state = PlayerState.IDLE
        self.has_running_shoes = True
        self.has_bike = False
        self.is_surfing = False
        self.step_count = 0

    def get_forward_tile_coords(self) -> Tuple[int, int]:
        """Calcula las coordenadas de la casilla directamente frente al jugador."""
        dx, dy = Direction.DELTAS.get(self.facing, (0, 0))
        return self.x + dx, self.y + dy

    def move(
        self,
        direction: str,
        is_running: bool = False,
        map_manager: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Intenta mover al jugador en una dirección.
        1. Actualiza la dirección hacia donde mira (`facing`).
        2. Verifica si la casilla objetivo es transitable o saliente.
        3. Aplica salto de ledge o avance de paso.
        4. Detecta si pisó hierba alta o activó un Warp.
        """
        direction = direction.lower()
        if direction not in Direction.DELTAS:
            return {"moved": False, "reason": "invalid_direction"}

        self.facing = direction
        dx, dy = Direction.DELTAS[direction]
        target_x = self.x + dx
        target_y = self.y + dy

        # Determinar estado de movimiento
        if self.is_surfing:
            self.state = PlayerState.SURF
        elif self.has_bike:
            self.state = PlayerState.BIKE
        elif is_running and self.has_running_shoes:
            self.state = PlayerState.RUN
        else:
            self.state = PlayerState.WALK

        if not map_manager:
            # Movimiento sin mapa lógico (modo libre de prueba)
            self.x = target_x
            self.y = target_y
            self.step_count += 1
            return {"moved": True, "x": self.x, "y": self.y}

        # Validar colisión en el mapa actual
        tile_code = map_manager.get_tile_code(self.map_id, target_x, target_y)

        # 1. Fuera de límites o Sólido (código 1)
        if tile_code is None or tile_code == 1:
            self.state = PlayerState.IDLE
            return {"moved": False, "reason": "solid_obstacle", "facing": self.facing}

        # 2. Agua (código 3) -> requiere Surf
        if tile_code == 3 and not self.is_surfing:
            self.state = PlayerState.IDLE
            return {"moved": False, "reason": "requires_surf", "facing": self.facing}

        # 3. Saliente / Ledge (código 4) -> Salto unidireccional hacia abajo
        if tile_code == 4:
            if direction == Direction.DOWN:
                landing_y = target_y + 1
                landing_code = map_manager.get_tile_code(self.map_id, target_x, landing_y)
                if landing_code in [0, 2]:  # Transitable o hierba al aterrizar
                    self.x = target_x
                    self.y = landing_y
                    self.state = PlayerState.JUMPING_LEDGE
                    self.step_count += 2
                    return {
                        "moved": True,
                        "jumped_ledge": True,
                        "x": self.x,
                        "y": self.y,
                        "stepped_on_grass": (landing_code == 2)
                    }
            # Si intenta saltar en dirección contraria, es un muro sólido
            self.state = PlayerState.IDLE
            return {"moved": False, "reason": "ledge_blocked_opposite", "facing": self.facing}

        # 4. Transitable (0), Hierba alta (2) o Punto de Teletransporte / Warp (5)
        self.x = target_x
        self.y = target_y
        self.step_count += 1

        # Chequear si es un Warp
        warp_info = map_manager.check_warp(self.map_id, self.x, self.y)
        if warp_info:
            self.map_id = warp_info["target_map"]
            self.x = warp_info["target_x"]
            self.y = warp_info["target_y"]
            return {
                "moved": True,
                "warped": True,
                "new_map": self.map_id,
                "x": self.x,
                "y": self.y
            }

        return {
            "moved": True,
            "warped": False,
            "x": self.x,
            "y": self.y,
            "stepped_on_grass": (tile_code == 2),
            "tile_code": tile_code
        }
