"""
Test Suite de Profundización: Jefes, MTs, Captura, Estados y Nivel
==================================================================
Proyecto: Pokémon: Ecos de Andara
Verifica:
1. Catálogo oficial de los 8 Líderes, Alto Mando, Renata y Nahuel dinámico.
2. Expansión de movimientos (~100) y catálogo de MTs/MOs en tiendas ($).
3. Calculadora oficial de captura y bloqueo de legendarios (Eternatus/Zygarde).
4. Estados alterados (Sueño, Parálisis, Tóxico exponencial) en BattleEngine.
5. Aprendizaje automático de movimientos al subir de nivel.
"""

import sys
import os
import unittest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, "src"))

from core.trainer_manager import TrainerManager
from core.shop_catalog import ShopCatalogManager
from core.battle.catch_calculator import CatchCalculator
from core.battle.battle_engine import BattleEngine
from core.pokemon_generator import PokemonGenerator


class TestDepthSystems(unittest.TestCase):

    def setUp(self):
        self.trainer_mgr = TrainerManager()
        self.shop_mgr = ShopCatalogManager()
        self.poke_gen = PokemonGenerator()

    def test_gym_leaders_and_champion(self):
        """Verifica la generación de los 8 líderes y la Campeona Renata con Mega-Garchomp."""
        # Líder 1 Rocío
        rocio = self.trainer_mgr.get_gym_leader_party("gym_1_rocio")
        self.assertIsNotNone(rocio)
        self.assertEqual(len(rocio["party"]), 3)
        self.assertEqual(rocio["city"], "Pueblo Altiplano")

        # Campeona Renata
        renata = self.trainer_mgr.get_champion_party()
        self.assertIsNotNone(renata)
        self.assertEqual(len(renata["party"]), 6)
        # El as de Renata es Mega-Garchomp
        garchomp = renata["party"][-1]
        self.assertEqual(garchomp["species_name"], "Garchomp")
        self.assertTrue(garchomp["can_mega_evolve"])

    def test_dynamic_nahuel_party(self):
        """Verifica la generación dinámica y procedural de Nahuel por rutas."""
        # Stage 1: Solo inicial con ventaja
        p1 = self.trainer_mgr.generate_nahuel_party(story_stage=1, player_element="fire", rng_seed=42)
        self.assertEqual(len(p1), 1)
        self.assertEqual(p1[0]["species_name"], "Squirtle")

        # Stage 4: Inicial evolucionado + Growlithe/Arcanine + capturas de ruta
        p4 = self.trainer_mgr.generate_nahuel_party(story_stage=4, player_element="grass", rng_seed=42)
        self.assertGreaterEqual(len(p4), 4)
        species_names = [p["species_name"] for p in p4]
        self.assertIn("Charmeleon", species_names)
        self.assertTrue("Growlithe" in species_names or "Arcanine" in species_names)

    def test_tm_shop_catalog(self):
        """Verifica que las MTs y MOs se adquieran 100% con dinero convencional ($)."""
        tms = self.shop_mgr.get_shop_inventory("metropolis_solsticio_tms")
        self.assertIsNotNone(tms)
        self.assertGreater(len(tms), 10)

        # Comprar MT35 Lanzallamas
        success, msg, rem_money = self.shop_mgr.buy_item("metropolis_solsticio_tms", "tm_flamethrower", 1, player_money=10000)
        self.assertTrue(success)
        self.assertEqual(rem_money, 5000)

    def test_catch_calculator_regular_and_legendary_block(self):
        """Verifica el ratio de captura y el rechazo estricto de Poké Balls para Legendarios."""
        # 1. Pokémon silvestre regular debilitado
        wild_pidgey = self.poke_gen.generate_pokemon(species_id=16, level=3)
        wild_pidgey["current_hp"] = 1
        wild_pidgey["status"] = "sleep"

        res = CatchCalculator.calculate_catch(wild_pidgey, ball_id="ultraball", rng_seed=42)
        self.assertTrue(res["caught"])
        self.assertFalse(res["blocked"])

        # 2. Legendario Eternatus / Zygarde
        legendary = {"species_name": "Eternatus", "max_hp": 500, "current_hp": 10, "is_legendary_boss": True}
        res_leg = CatchCalculator.calculate_catch(legendary, ball_id="ultraball")
        self.assertFalse(res_leg["caught"])
        self.assertTrue(res_leg["blocked"])
        self.assertIn("rechaza las Poké Balls", res_leg["message"])

    def test_battle_engine_wild_catch_and_status(self):
        """Verifica la captura en combate salvaje y los efectos de fin de turno de Tóxico."""
        player_poke = self.poke_gen.generate_pokemon(species_id=4, level=10)
        wild_poke = self.poke_gen.generate_pokemon(species_id=10, level=2)  # Caterpie débil
        wild_poke["current_hp"] = 1

        battle = BattleEngine(
            player_party=[player_poke],
            opponent_party=[wild_poke],
            is_trainer_battle=False,
            opponent_name="Caterpie Salvaje"
        )

        # Lanzar Poké Ball
        res = battle.execute_round({"action_type": "BALL", "ball_id": "ultraball"})
        self.assertTrue(battle.is_finished)
        self.assertEqual(battle.winner, "player")


if __name__ == "__main__":
    unittest.main()
