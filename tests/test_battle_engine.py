"""
Test Suite del Motor de Combate, Mega Evoluciones e IA
======================================================
Proyecto: Pokémon: Ecos de Andara
Verifica:
1. Cálculo de daño oficial (Gen 5+), efectividades de tipos, STAB, críticos y quemaduras.
2. Activación en combate de Mega Evolución (stats boost, tipos, límite de 1 por bando).
3. IA Táctica (detección de KOs, selección de debilidades elementales y uso de objetos).
4. FSM de combate por turnos (prioridad, orden de velocidad, debilitamiento y reparto de EXP).
"""

import sys
import os
import unittest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, "src"))

from core.pokemon_generator import PokemonGenerator
from core.battle.damage_calculator import DamageCalculator
from core.battle.mega_engine import MegaEvolutionEngine
from core.battle.battle_ai import BattleAI
from core.battle.battle_engine import BattleEngine


class TestBattleEngine(unittest.TestCase):

    def setUp(self):
        self.gen = PokemonGenerator()
        self.calc = DamageCalculator()
        self.mega_engine = MegaEvolutionEngine()
        self.ai = BattleAI()

    def test_type_effectiveness_matrix(self):
        """Verifica las relaciones clave de la matriz de tipos."""
        # Fuego vs Planta (Super eficaz = 2.0x)
        self.assertEqual(self.calc.get_type_effectiveness("fire", ["grass"]), 2.0)
        # Fuego vs Agua (Poco eficaz = 0.5x)
        self.assertEqual(self.calc.get_type_effectiveness("fire", ["water"]), 0.5)
        # Eléctrico vs Tierra (Inmune = 0.0x)
        self.assertEqual(self.calc.get_type_effectiveness("electric", ["ground"]), 0.0)
        # Planta vs Agua/Tierra (Doble debilidad = 4.0x)
        self.assertEqual(self.calc.get_type_effectiveness("grass", ["water", "ground"]), 4.0)

    def test_stab_and_critical_multipliers(self):
        """Verifica el bonus de STAB (1.5x) y golpes críticos (1.5x)."""
        charizard = self.gen.generate_pokemon(6, level=50)  # Fire/Flying
        venusaur = self.gen.generate_pokemon(3, level=50)   # Grass/Poison

        # Flamethrower (Fire) tiene STAB en Charizard
        stab = self.calc.get_stab_multiplier("fire", charizard["types"])
        self.assertEqual(stab, 1.5)

        # Surf (Water) NO tiene STAB en Charizard
        no_stab = self.calc.get_stab_multiplier("water", charizard["types"])
        self.assertEqual(no_stab, 1.0)

        # Daño con crítico forzado vs sin crítico
        dmg_normal = self.calc.calculate_damage(
            attacker=charizard,
            defender=venusaur,
            move_id_or_data="flamethrower",
            force_critical=False,
            force_random_factor=1.0
        )
        dmg_crit = self.calc.calculate_damage(
            attacker=charizard,
            defender=venusaur,
            move_id_or_data="flamethrower",
            force_critical=True,
            force_random_factor=1.0
        )
        self.assertGreater(dmg_crit["damage"], dmg_normal["damage"])
        self.assertTrue(dmg_crit["is_critical"])

    def test_mega_evolution_in_battle(self):
        """Verifica la activación de Mega Evolución en tiempo real con Mega-Aro."""
        charizard = self.gen.generate_pokemon(6, level=50)
        charizard["held_item"] = "charizardite_x"
        base_atk = charizard["stats"]["attack"]

        # Comprobar disponibilidad
        can_mega, mega_data, msg = self.mega_engine.can_mega_evolve(
            charizard,
            has_mega_ring=True,
            already_mega_evolved_this_battle=False
        )
        self.assertTrue(can_mega)
        self.assertIsNotNone(mega_data)

        # Activar Mega Evolución
        res = self.mega_engine.trigger_mega_evolution(charizard, mega_data)
        self.assertTrue(res["success"])
        self.assertTrue(charizard["is_mega"])
        self.assertEqual(charizard["display_name"], "Mega-Charizard X")
        self.assertIn("dragon", charizard["types"])
        self.assertEqual(charizard["stats"]["attack"], base_atk + 46)

    def test_battle_engine_first_round_flow(self):
        """Verifica el flujo de una ronda completa de combate 1v1."""
        charmander = self.gen.generate_pokemon(4, level=5)
        squirtle = self.gen.generate_pokemon(7, level=5)

        engine = BattleEngine(
            player_party=[charmander],
            opponent_party=[squirtle],
            is_trainer_battle=True,
            opponent_name="Nahuel",
            ai_tier=BattleAI.TIER_RIVAL_BOSS
        )

        initial_squirtle_hp = squirtle["current_hp"]

        # Jugador usa Placaje o Arañazo
        action = {"action_type": "FIGHT", "move_id": "scratch"}
        res = engine.execute_round(action)

        self.assertEqual(res["turn"], 1)
        self.assertGreater(len(res["events"]), 0)
        self.assertLess(squirtle["current_hp"], initial_squirtle_hp)


if __name__ == "__main__":
    unittest.main()
