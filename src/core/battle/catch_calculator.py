"""
Módulo de la Calculadora de Captura de Pokémon en Combate
=========================================================
Proyecto: Pokémon: Ecos de Andara
Implementa la fórmula matemática oficial Gen 5+ de captura con modificadores
de Poké Balls, salud, estados alterados y el escudo inviolable de Legendarios.
"""

import math
import random
from typing import Dict, Any, Optional, Tuple


class CatchCalculator:
    """Calculadora de probabilidad de captura con tiradas de sacudidas de Ball."""

    # Multiplicadores de estados alterados
    STATUS_MULTIPLIERS = {
        "sleep": 2.5,
        "freeze": 2.5,
        "paralysis": 1.5,
        "burn": 1.5,
        "poison": 1.5,
        "toxic": 1.5
    }

    # Nombres de deidades legendarias protegidas por lore (NO capturables)
    UNBREACHABLE_ENTITIES = {
        "eternatus", "zygarde", "eternatus_core", "zygarde_complete"
    }

    @classmethod
    def calculate_catch(
        cls,
        target_pokemon: Dict[str, Any],
        ball_id: str = "pokeball",
        turn_number: int = 1,
        is_night_or_cave: bool = False,
        rng_seed: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Ejecuta el intento de captura calculando el ratio modificado y las sacudidas (0 a 3).
        Retorna:
            {
                "caught": bool,
                "shakes": int (0..3, o 4 si es captura),
                "blocked": bool,
                "message": str
            }
        """
        rng = random.Random(rng_seed) if rng_seed is not None else random.Random()
        species_name = str(target_pokemon.get("species_name", "")).lower()
        species_id = target_pokemon.get("species_id", 0)

        # 1. Regla Inviolable: Los Legendarios del Conflicto rechazan las Poké Balls
        if species_name in cls.UNBREACHABLE_ENTITIES or target_pokemon.get("is_legendary_boss"):
            return {
                "caught": False,
                "shakes": 0,
                "critical_capture": False,
                "blocked": True,
                "message": "¡La inmensa energía de esta entidad divina rechaza las Poké Balls!"
            }

        # 2. Datos de vida y ratio base de captura
        max_hp = max(1, target_pokemon.get("max_hp", 100))
        current_hp = max(1, target_pokemon.get("current_hp", max_hp))
        base_catch_rate = target_pokemon.get("catch_rate", 45)  # 45 por defecto si no está especificado

        # 3. Multiplicador de Poké Ball
        ball_mult = 1.0
        if ball_id == "greatball":
            ball_mult = 1.5
        elif ball_id == "ultraball":
            ball_mult = 2.0
        elif ball_id == "safariball":
            ball_mult = 1.5
        elif ball_id == "quickball":
            ball_mult = 5.0 if turn_number == 1 else 1.0
        elif ball_id == "duskball":
            ball_mult = 3.0 if is_night_or_cave else 1.0
        elif ball_id == "timerball":
            # Escala de 1.0 hasta 4.0 en el turno 10
            ball_mult = min(4.0, 1.0 + (turn_number * 0.3))
        elif ball_id == "netball":
            types = target_pokemon.get("types", [])
            ball_mult = 3.5 if ("water" in types or "bug" in types) else 1.0

        # 4. Multiplicador de estado alterado
        status = target_pokemon.get("status")
        status_mult = cls.STATUS_MULTIPLIERS.get(status, 1.0)

        # 5. Fórmula oficial del ratio de captura 'a'
        # a = ((3 * MaxHP - 2 * CurrentHP) / (3 * MaxHP)) * CatchRate * BallMultiplier * StatusMultiplier
        hp_factor = ((3 * max_hp) - (2 * current_hp)) / (3 * max_hp)
        a = hp_factor * base_catch_rate * ball_mult * status_mult

        if a >= 255:
            # Captura garantizada
            return {
                "caught": True,
                "shakes": 4,
                "blocked": False,
                "message": f"¡Ya está! ¡{target_pokemon.get('species_name', 'El Pokémon')} fue atrapado!"
            }

        # 6. Cálculo de probabilidad de sacudida 'b'
        # b = 65536 * (a / 255) ^ 0.75
        b = int(65536 * math.pow(a / 255.0, 0.75))

        shakes = 0
        for _ in range(4):
            rand_val = rng.randint(0, 65535)
            if rand_val < b:
                shakes += 1
            else:
                break

        caught = (shakes == 4)
        if caught:
            msg = f"¡Ya está! ¡{target_pokemon.get('species_name', 'El Pokémon')} fue atrapado!"
        elif shakes == 0:
            msg = "¡Oh no! ¡El Pokémon se ha liberado inmediatamente!"
        elif shakes == 1:
            msg = "¡Vaya! ¡Ha salido casi al instante!"
        elif shakes == 2:
            msg = "¡Uf! ¡Parecía que se había atrapado!"
        else:
            msg = "¡Casi lo logras! ¡Estuvo a punto de quedarse!"

        return {
            "caught": caught,
            "shakes": shakes,
            "blocked": False,
            "message": msg
        }
