"""
Módulo Calculador Oficial de Daño (Gen 5+)
==========================================
Proyecto: Pokémon: Ecos de Andara
Implementa la fórmula matemática oficial de daño, efectividad de los 18 tipos,
STAB, golpes críticos, variabilidad aleatoria (0.85 - 1.00) y modificadores de estado.
"""

import json
import os
import random
from typing import Dict, Any, List, Optional, Tuple


class DamageCalculator:
    """Calculadora matemática de daño y efectividades de combate."""

    def __init__(self, data_dir: Optional[str] = None):
        if data_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            data_dir = os.path.join(base_dir, "data")
        
        self.data_dir = data_dir
        self.types_data: Dict[str, Any] = self._load_json("types.json")
        self.moves_data: Dict[str, Any] = self._load_json("moves.json")

    def _load_json(self, filename: str) -> Dict[str, Any]:
        filepath = os.path.join(self.data_dir, filename)
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}

    def get_type_effectiveness(self, move_type: str, defender_types: List[str]) -> float:
        """
        Calcula el multiplicador total de efectividad de un tipo de movimiento contra los tipos del defensor.
        Valores resultantes posibles: 0.0 (Inmune), 0.25, 0.5 (Poco eficaz), 1.0 (Neutro), 2.0 o 4.0 (Súper eficaz).
        """
        move_type = move_type.lower()
        type_info = self.types_data.get(move_type)
        if not type_info:
            return 1.0

        multiplier = 1.0
        for def_type in defender_types:
            def_type = def_type.lower()
            if def_type in type_info.get("no_damage_to", []):
                return 0.0
            elif def_type in type_info.get("double_damage_to", []):
                multiplier *= 2.0
            elif def_type in type_info.get("half_damage_to", []):
                multiplier *= 0.5

        return multiplier

    def get_stab_multiplier(self, move_type: str, attacker_types: List[str], ability: Optional[str] = None) -> float:
        """
        Calcula el bonus de ataque del mismo tipo (STAB).
        Normal: x1.5 si coincide. Con Adaptability (Habilidad Adaptable): x2.0.
        """
        if move_type.lower() in [t.lower() for t in attacker_types]:
            if ability and ability.lower() == "adaptability":
                return 2.0
            return 1.5
        return 1.0

    def calculate_damage(
        self,
        attacker: Dict[str, Any],
        defender: Dict[str, Any],
        move_id_or_data: Any,
        weather: str = "clear",
        force_critical: Optional[bool] = None,
        force_random_factor: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Calcula el daño infligido por un atacante sobre un defensor utilizando la fórmula oficial Gen 5+.

        Fórmula Base:
          BaseDamage = (((2 * Level / 5 + 2) * Power * (A / D)) / 50) + 2
          TotalDamage = BaseDamage * Targets * Weather * Critical * Random * STAB * TypeEffectiveness * Burn * Other

        Retorna un diccionario con los detalles del cálculo (daño final, efectividad, crítico, etc.).
        """
        # Obtener información del movimiento
        if isinstance(move_id_or_data, str):
            move_data = self.moves_data.get(move_id_or_data.lower())
            if not move_data:
                raise ValueError(f"Movimiento '{move_id_or_data}' no encontrado en moves.json")
        else:
            move_data = move_id_or_data

        damage_class = move_data.get("damage_class", "physical").lower()
        if damage_class == "status" or move_data.get("power") is None:
            return {
                "damage": 0,
                "is_status": True,
                "is_critical": False,
                "type_effectiveness": 1.0,
                "stab": 1.0,
                "move_name": move_data.get("name", ""),
                "display_name": move_data.get("display_name", move_data.get("name", "")),
                "effectiveness_text": "status"
            }

        level = attacker.get("level", 50)
        power = move_data.get("power", 40)
        move_type = move_data.get("type", "normal").lower()

        # Determinar estadísticas de Ataque y Defensa (Físico vs Especial)
        attacker_stats = attacker.get("stats", {})
        defender_stats = defender.get("stats", {})

        if damage_class == "physical":
            atk_stat = attacker_stats.get("attack", 50)
            def_stat = defender_stats.get("defense", 50)
        else:  # special
            atk_stat = attacker_stats.get("special_attack", 50)
            def_stat = defender_stats.get("special_defense", 50)

        # Evitar división por cero
        def_stat = max(1, def_stat)

        # 1. Daño base
        base_damage = (((2 * level / 5 + 2) * power * (atk_stat / def_stat)) / 50) + 2

        # 2. Modificador de Golpe Crítico (Gen 6+: x1.5)
        if force_critical is not None:
            is_critical = force_critical
        else:
            # Ratio base 1/24 ~ 4.16%
            is_critical = (random.random() < (1.0 / 24.0))

        crit_multiplier = 1.5 if is_critical else 1.0

        # 3. Factor Aleatorio Oficial (0.85 a 1.00)
        if force_random_factor is not None:
            random_factor = max(0.85, min(1.0, force_random_factor))
        else:
            # 16 pasos discretos de aleatoriedad según mecánicas oficiales (85 a 100 / 100)
            random_factor = random.randint(85, 100) / 100.0

        # 4. STAB (Same Type Attack Bonus)
        attacker_types = attacker.get("types", ["normal"])
        attacker_ability = attacker.get("ability", "")
        stab_multiplier = self.get_stab_multiplier(move_type, attacker_types, attacker_ability)

        # 5. Efectividad de Tipos
        defender_types = defender.get("types", ["normal"])
        type_multiplier = self.get_type_effectiveness(move_type, defender_types)

        if type_multiplier == 0.0:
            # Inmunidad total
            return {
                "damage": 0,
                "is_status": False,
                "is_critical": False,
                "type_effectiveness": 0.0,
                "stab": stab_multiplier,
                "random_factor": random_factor,
                "move_name": move_data.get("name", ""),
                "display_name": move_data.get("display_name", move_data.get("name", "")),
                "effectiveness_text": "immune"
            }

        # 6. Modificador de Clima (Sol potencia fuego x1.5 / debilita agua x0.5; Lluvia viceversa)
        weather_multiplier = 1.0
        if weather == "sun":
            if move_type == "fire":
                weather_multiplier = 1.5
            elif move_type == "water":
                weather_multiplier = 0.5
        elif weather == "rain":
            if move_type == "water":
                weather_multiplier = 1.5
            elif move_type == "fire":
                weather_multiplier = 0.5

        # 7. Modificador de Quemadura (x0.5 si el atacante está quemado y usa ataque físico sin Agallas)
        burn_multiplier = 1.0
        if attacker.get("status") == "burn" and damage_class == "physical":
            if attacker_ability.lower() != "guts":
                burn_multiplier = 0.5

        # Cálculo final
        modifier = weather_multiplier * crit_multiplier * random_factor * stab_multiplier * type_multiplier * burn_multiplier
        final_damage = int(base_damage * modifier)
        final_damage = max(1, final_damage)  # Al menos 1 de daño si no es inmune

        # Texto descriptivo de efectividad
        if type_multiplier > 1.0:
            eff_text = "super_effective"
        elif type_multiplier < 1.0:
            eff_text = "not_very_effective"
        else:
            eff_text = "effective"

        return {
            "damage": final_damage,
            "is_status": False,
            "is_critical": is_critical,
            "type_effectiveness": type_multiplier,
            "stab": stab_multiplier,
            "random_factor": random_factor,
            "weather_multiplier": weather_multiplier,
            "move_name": move_data.get("name", ""),
            "display_name": move_data.get("display_name", move_data.get("name", "")),
            "damage_class": damage_class,
            "effectiveness_text": eff_text
        }
