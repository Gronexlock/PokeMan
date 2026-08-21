"""
Módulo de Selección de Iniciales e IA del Rival
===============================================
Proyecto: Pokémon: Ecos de Andara
Gestiona la selección de iniciales del jugador, la asignación reactiva con ventaja
de tipo para el rival (Nahuel) y el evento de obtención de su Pokémon insignia (Growlithe).
"""

import random
from typing import Dict, Any, List, Optional, Tuple


class StarterSelectionManager:
    """Gestiona la ceremonia de iniciales del Profesor Ceibo y elecciones del Rival."""

    # Catálogo de tercias de iniciales por generación disponibles en Andara
    STARTER_TRIOS = {
        "gen1": {
            "grass": {"id": 1, "name": "Bulbasaur", "type": "grass"},
            "fire": {"id": 4, "name": "Charmander", "type": "fire"},
            "water": {"id": 7, "name": "Squirtle", "type": "water"}
        },
        "gen3": {
            "grass": {"id": 252, "name": "Treecko", "type": "grass"},
            "fire": {"id": 255, "name": "Torchic", "type": "fire"},
            "water": {"id": 258, "name": "Mudkip", "type": "water"}
        },
        "gen4": {
            "grass": {"id": 387, "name": "Turtwig", "type": "grass"},
            "fire": {"id": 390, "name": "Chimchar", "type": "fire"},
            "water": {"id": 393, "name": "Piplup", "type": "water"}
        },
        "gen7": {
            "grass": {"id": 722, "name": "Rowlet", "type": "grass"},
            "fire": {"id": 725, "name": "Litten", "type": "fire"},
            "water": {"id": 728, "name": "Popplio", "type": "water"}
        },
        "gen9": {
            "grass": {"id": 906, "name": "Sprigatito", "type": "grass"},
            "fire": {"id": 909, "name": "Fuecoco", "type": "fire"},
            "water": {"id": 912, "name": "Quaxly", "type": "water"}
        }
    }

    # Relación de ventaja elemental para el rival
    # Si el jugador elige X, el rival elige Y que tiene ventaja sobre X
    COUNTER_ELEMENT = {
        "fire": "water",
        "water": "grass",
        "grass": "fire"
    }

    def __init__(self, randomized_trio: bool = False):
        self.randomized_trio = randomized_trio
        self.current_trio = self.generate_starter_trio()

    def generate_starter_trio(self) -> Dict[str, Dict[str, Any]]:
        """
        Genera una terna equilibrada de (Planta, Fuego, Agua).
        Puede ser una generación fija o una mezcla aleatoria de generaciones.
        """
        if not self.randomized_trio:
            # Por defecto, la terna clásica de Villa Tranquimar
            return self.STARTER_TRIOS["gen1"]

        # Mezcla aleatoria garantizando un elemento de cada tipo
        trio_keys = list(self.STARTER_TRIOS.keys())
        grass_choice = self.STARTER_TRIOS[random.choice(trio_keys)]["grass"]
        fire_choice = self.STARTER_TRIOS[random.choice(trio_keys)]["fire"]
        water_choice = self.STARTER_TRIOS[random.choice(trio_keys)]["water"]

        return {
            "grass": grass_choice,
            "fire": fire_choice,
            "water": water_choice
        }

    def process_player_choice(self, chosen_element: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Procesa la elección del jugador y asigna automáticamente al rival (Nahuel)
        el inicial que tiene ventaja elemental contra el del jugador.
        
        Retorna: (player_starter, rival_starter)
        """
        element_key = chosen_element.lower()
        if element_key not in self.current_trio:
            raise ValueError(f"Tipo '{chosen_element}' no válido. Opciones: grass, fire, water.")

        player_starter = self.current_trio[element_key]
        rival_element = self.COUNTER_ELEMENT[element_key]
        rival_starter = self.current_trio[rival_element]

        return player_starter, rival_starter

    @staticmethod
    def get_rival_signature_pokemon() -> Dict[str, Any]:
        """
        Retorna los datos del Pokémon Insignia de Nahuel (Growlithe)
        que es seleccionado por él en el Centro de Adopción/Elección de Metrópolis Solsticio.
        """
        return {
            "id": 58,
            "name": "Growlithe",
            "type": "fire",
            "is_signature": True,
            "event_city": "Metrópolis Solsticio",
            "event_description": (
                "Nahuel acude al Centro de Adopción de Metrópolis Solsticio y establece un vínculo "
                "inmediato e inquebrantable con un leal Growlithe, convirtiéndolo en su compañero insignia."
            )
        }
