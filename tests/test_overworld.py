"""
Test Suite del Sistema de Overworld, Encuentros y Reserva Safari
================================================================
Proyecto: Pokémon: Ecos de Andara
Verifica:
1. Controlador de movimiento por cuadrícula (colisiones, saltos de ledge y warps).
2. Gestor de mapas, transiciones y detección de hierba alta.
3. Línea de visión de entrenadores (conos de 1-4 casillas y trigger '!').
4. Ciclo de tiempo acelerado (día/noche, amanecer y atardecer).
5. Motor de encuentros, ratios de shinies (1/1024 base y 1/341 con Amuleto Iris).
6. Sesión tradicional de la Reserva Safari (Safari Balls, cebo, lodo y huida).
"""

import sys
import os
import unittest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, "src"))

from overworld.time_cycle import TimeCycleManager
from overworld.player_controller import PlayerController, Direction, PlayerState
from overworld.map_manager import MapManager, TileType
from overworld.npc_manager import NPCManager
from overworld.encounter_manager import EncounterManager, SafariSession


class TestOverworld(unittest.TestCase):

    def setUp(self):
        self.time_mgr = TimeCycleManager(cycle_minutes=24.0, start_hour=10)
        self.map_mgr = MapManager()
        self.npc_mgr = NPCManager()
        self.enc_mgr = EncounterManager()
        self.player = PlayerController(start_map="villa_tranquimar", start_x=9, start_y=8)

    def test_time_cycle_progression_and_periods(self):
        """Verifica la correcta identificación de los periodos del día."""
        self.time_mgr.set_time(7, 30)
        self.assertEqual(self.time_mgr.get_period(), TimeCycleManager.PERIOD_MORNING)
        self.assertTrue(self.time_mgr.is_daytime())

        self.time_mgr.set_time(14, 0)
        self.assertEqual(self.time_mgr.get_period(), TimeCycleManager.PERIOD_DAY)
        self.assertTrue(self.time_mgr.is_daytime())

        self.time_mgr.set_time(18, 30)
        self.assertEqual(self.time_mgr.get_period(), TimeCycleManager.PERIOD_EVENING)

        self.time_mgr.set_time(22, 0)
        self.assertEqual(self.time_mgr.get_period(), TimeCycleManager.PERIOD_NIGHT)
        self.assertTrue(self.time_mgr.is_nighttime())

    def test_player_movement_and_solid_collision(self):
        """Verifica que el jugador respete las colisiones sólidas y no las atraviese."""
        # En Villa Tranquimar, (9, 8) es caminable (0)
        res = self.player.move(Direction.DOWN, map_manager=self.map_mgr)
        self.assertTrue(res["moved"])
        self.assertEqual(self.player.y, 9)

        # Intentar avanzar hacia un muro sólido en (9, 0) en player_house
        p_house = PlayerController(start_map="player_house", start_x=3, start_y=1)
        res_blocked = p_house.move(Direction.UP, map_manager=self.map_mgr)
        self.assertFalse(res_blocked["moved"])
        self.assertEqual(res_blocked["reason"], "solid_obstacle")
        self.assertEqual(p_house.y, 1)

    def test_player_ledge_jump(self):
        """Verifica que el jugador pueda saltar salientes (ledges) hacia abajo pero no hacia arriba."""
        # En Villa Tranquimar (3, 10) es un ledge (4)
        p_ledge = PlayerController(start_map="villa_tranquimar", start_x=3, start_y=9)
        res_jump = p_ledge.move(Direction.DOWN, map_manager=self.map_mgr)
        self.assertTrue(res_jump["moved"])
        self.assertTrue(res_jump.get("jumped_ledge", False))
        self.assertEqual(p_ledge.y, 11)  # Salta 2 casillas hacia abajo

        # Intentar saltar hacia arriba (debe bloquear)
        res_back = p_ledge.move(Direction.UP, map_manager=self.map_mgr)
        self.assertFalse(res_back["moved"])

    def test_map_warp_transition(self):
        """Verifica que entrar en una puerta teletransporte al jugador al nuevo mapa."""
        p_warp = PlayerController(start_map="villa_tranquimar", start_x=3, start_y=4)
        res_warp = p_warp.move(Direction.UP, map_manager=self.map_mgr)
        self.assertTrue(res_warp["moved"])
        self.assertTrue(res_warp["warped"])
        self.assertEqual(self.player.map_id if p_warp != self.player else p_warp.map_id, "player_house")
        self.assertEqual(p_warp.map_id, "player_house")
        self.assertEqual(p_warp.x, 3)
        self.assertEqual(p_warp.y, 6)

    def test_trainer_line_of_sight(self):
        """Verifica la detección automática del cono de visión del entrenador."""
        # Joven Marcos en Ruta 1 está en (8, 10) mirando hacia abajo (down) con rango 3
        # Si el jugador se coloca en (8, 12), debe detectarlo
        detected = self.npc_mgr.check_trainer_vision(
            map_id="route_1",
            player_x=8,
            player_y=12,
            defeated_trainers=[],
            map_manager=self.map_mgr
        )
        self.assertIsNotNone(detected)
        self.assertEqual(detected["trainer"]["id"], "trainer_joven_marcos")
        self.assertTrue(detected["exclamation_triggered"])

        # Si el entrenador ya fue derrotado, no debe activarse
        not_detected = self.npc_mgr.check_trainer_vision(
            map_id="route_1",
            player_x=8,
            player_y=12,
            defeated_trainers=["trainer_joven_marcos"],
            map_manager=self.map_mgr
        )
        self.assertIsNone(not_detected)

    def test_shiny_rates_configuration(self):
        """Verifica que la configuración de Shinies sea 1/1024 y 1/341 con Amuleto Iris."""
        self.assertEqual(self.enc_mgr.shiny_base_rate, 1024)
        self.assertEqual(self.enc_mgr.shiny_charm_multiplier, 3.0)

    def test_safari_session_traditional_flow(self):
        """Verifica la sesión tradicional de la Reserva Safari y consumo de Safari Balls."""
        session = self.enc_mgr.start_safari_session(entry_fee=500, balls=30)
        self.assertEqual(session.safari_balls, 30)
        self.assertTrue(session.is_active)

        # Generar Pokémon en el invernadero botánico de la Reserva
        wild_starter = self.enc_mgr.generate_wild_pokemon("safari_botanical_greenhouse", method="safari_grass")
        self.assertIsNotNone(wild_starter)
        self.assertTrue(wild_starter.get("is_safari", False))

        # Lanzar Cebo
        res_bait = self.enc_mgr.execute_safari_action(session, wild_starter, "BAIT")
        self.assertIn(res_bait["outcome"], ["stayed", "fled"])

        # Lanzar Safari Ball
        res_ball = self.enc_mgr.execute_safari_action(session, wild_starter, "BALL")
        self.assertEqual(session.safari_balls, 29)
        self.assertIn(res_ball["outcome"], ["caught", "stayed", "fled"])


if __name__ == "__main__":
    unittest.main()
