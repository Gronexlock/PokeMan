"""
Módulo del Gestor de NPCs, Entrenadores y Línea de Visión
=========================================================
Proyecto: Pokémon: Ecos de Andara
Gestiona los aldeanos con diálogos, los entrenadores de ruta con campo de visión,
el trigger de exclamación '!' y la activación automática de combates.
"""

from typing import Dict, Any, List, Optional, Tuple


class NPCManager:
    """Administrador de NPCs y detección de línea de visión de entrenadores."""

    def __init__(self):
        # Base de datos local de NPCs por mapa
        self.npc_registry: Dict[str, List[Dict[str, Any]]] = {
            "villa_tranquimar": [
                {
                    "id": "npc_pescador_tranquimar",
                    "type": "villager",
                    "name": "Pescador Marcio",
                    "x": 10,
                    "y": 11,
                    "facing": "down",
                    "dialogue": [
                        "El aire del mar en Villa Tranquimar es el mejor para entrenar Pokémon de agua.",
                        "Si alguna vez necesitas descansar, el mar siempre calma a tu equipo."
                    ]
                },
                {
                    "id": "npc_anciana_ceibo",
                    "type": "villager",
                    "name": "Doña Rosita",
                    "x": 8,
                    "y": 5,
                    "facing": "left",
                    "dialogue": [
                        "El Profesor Ceibo ha estado investigando la energía telúrica de las Mega Piedras.",
                        "¡Es un hombre admirable y muy querido en todo el pueblo!"
                    ]
                }
            ],
            "route_1": [
                {
                    "id": "trainer_joven_marcos",
                    "type": "trainer",
                    "name": "Joven Marcos",
                    "trainer_class": "Joven",
                    "x": 8,
                    "y": 10,
                    "facing": "down",
                    "sight_range": 3,
                    "dialogue_challenge": "¡Nuestras miradas se cruzaron! ¡Es hora de un combate Pokémon!",
                    "dialogue_defeat": "¡Vaya! Tu inicial tiene mucha fuerza...",
                    "reward_money": 240,
                    "party": [
                        {"species_id": 16, "level": 4},   # Pidgey
                        {"species_id": 831, "level": 4}   # Wooloo
                    ]
                },
                {
                    "id": "trainer_cazabichos_lucas",
                    "type": "trainer",
                    "name": "Cazabichos Lucas",
                    "trainer_class": "Cazabichos",
                    "x": 14,
                    "y": 18,
                    "facing": "left",
                    "sight_range": 3,
                    "dialogue_challenge": "¡Atrapé varios Pokémon en la hierba alta! ¡Ponte a prueba!",
                    "dialogue_defeat": "Mis pequeños bichos cayeron...",
                    "reward_money": 180,
                    "party": [
                        {"species_id": 10, "level": 5}   # Caterpie
                    ]
                }
            ]
        }

    def check_trainer_vision(
        self,
        map_id: str,
        player_x: int,
        player_y: int,
        defeated_trainers: Optional[List[str]] = None,
        map_manager: Optional[Any] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Comprueba si el jugador se encuentra en la línea de visión directa de algún entrenador.
        - Solo aplica si el entrenador NO ha sido derrotado previamente.
        - Verifica que no haya muros sólidos entre el entrenador y el jugador.
        """
        defeated_set = set(defeated_trainers or [])
        npcs = self.npc_registry.get(map_id, [])

        for npc in npcs:
            if npc.get("type") != "trainer":
                continue

            trainer_id = npc.get("id")
            if trainer_id in defeated_set:
                continue

            tx, ty = npc["x"], npc["y"]
            facing = npc.get("facing", "down")
            sight = npc.get("sight_range", 3)

            # Verificar si el jugador está alineado con la mirada del entrenador
            in_sight = False
            dx, dy = 0, 0

            if facing == "down" and tx == player_x and 0 < (player_y - ty) <= sight:
                in_sight = True
                dy = 1
            elif facing == "up" and tx == player_x and 0 < (ty - player_y) <= sight:
                in_sight = True
                dy = -1
            elif facing == "right" and ty == player_y and 0 < (player_x - tx) <= sight:
                in_sight = True
                dx = 1
            elif facing == "left" and ty == player_y and 0 < (tx - player_x) <= sight:
                in_sight = True
                dx = -1

            if in_sight:
                # Comprobar si hay obstáculos sólidos intermedios
                has_obstacle = False
                if map_manager:
                    steps = abs(player_x - tx) + abs(player_y - ty)
                    for step in range(1, steps):
                        chk_x = tx + (dx * step)
                        chk_y = ty + (dy * step)
                        code = map_manager.get_tile_code(map_id, chk_x, chk_y)
                        if code == 1:  # Sólido
                            has_obstacle = True
                            break

                if not has_obstacle:
                    return {
                        "trainer": npc,
                        "distance": abs(player_x - tx) + abs(player_y - ty),
                        "approach_steps": (abs(player_x - tx) + abs(player_y - ty)) - 1,
                        "exclamation_triggered": True
                    }

        return None

    def get_npc_at(self, map_id: str, x: int, y: int) -> Optional[Dict[str, Any]]:
        """Retorna el NPC ubicado exactamente en la casilla (x, y)."""
        npcs = self.npc_registry.get(map_id, [])
        for npc in npcs:
            if npc.get("x") == x and npc.get("y") == y:
                return npc
        return None
