"""
Test Suite de la Fase 6: Visuales 2.5D, Shaders, Parallax, Audio y Main
=======================================================================
Proyecto: Pokémon: Ecos de Andara
Verifica:
1. Shaders de iluminación ambiental (CanvasModulate) y gradientes de color.
2. Renderizador 2.5D del Overworld con Y-sorting y viewport centrado.
3. Escenario de batalla Parallax y HUD estilizado con Mega Evolución.
4. Administrador de pistas de audio BGM y efectos SFX.
5. Inicialización y orquestación del juego en src/main.py.
"""

import sys
import os
import unittest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(BASE_DIR, "src")
sys.path.insert(0, SRC_DIR)

from graphics.lighting_shader import LightingShader
from graphics.overworld_renderer_25d import OverworldRenderer25D
from battle_ui.battle_scene_renderer import BattleSceneRenderer
from audio.audio_manager import AudioManager
from main import AndaraGame


class TestPhase6VisualsAndExe(unittest.TestCase):

    def setUp(self):
        self.shader = LightingShader()
        self.renderer_25d = OverworldRenderer25D()
        self.audio = AudioManager()
        self.game = AndaraGame()

    def test_lighting_shader_ambient_and_point_lights(self):
        """Verifica el cálculo de luz ambiental y emisores puntuales."""
        morning = self.shader.get_ambient_lighting("morning")
        self.assertEqual(morning["period"], "morning")
        self.assertFalse(morning["point_lights_active"])

        night = self.shader.get_ambient_lighting("night")
        self.assertEqual(night["period"], "night")
        self.assertTrue(night["point_lights_active"])

        # Añadir farola en (5, 5)
        self.shader.add_point_light(5, 5, radius=3, intensity=1.0)
        light_at_lamp = self.shader.get_light_intensity_at_tile(5, 5, "night")
        light_far_away = self.shader.get_light_intensity_at_tile(20, 20, "night")
        self.assertGreater(light_at_lamp, light_far_away)

    def test_overworld_renderer_viewport(self):
        """Verifica la generación del cuadro visual 2.5D del Overworld."""
        map_data = {
            "name": "Villa Tranquimar",
            "collision_layer": [
                [1, 1, 1, 1, 1],
                [1, 0, 0, 2, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1]
            ]
        }
        lines = self.renderer_25d.render_viewport(
            map_data=map_data,
            player_x=2,
            player_y=2,
            player_facing="DOWN",
            time_period="day",
            viewport_width=5,
            viewport_height=4
        )
        self.assertGreater(len(lines), 3)
        joined = "\n".join(lines)
        self.assertIn("Villa Tranquimar", joined)

    def test_battle_scene_renderer_hud(self):
        """Verifica el renderizado de la escena de combate parallax y HUD."""
        player_poke = {"species_name": "Charizard", "level": 36, "current_hp": 120, "max_hp": 120, "is_mega": True}
        opp_poke = {"species_name": "Blastoise", "level": 36, "current_hp": 80, "max_hp": 130, "status": "burn"}

        hud_lines = BattleSceneRenderer.render_battle_hud(
            player_poke=player_poke,
            opponent_poke=opp_poke,
            time_period="sunset",
            biome="mountain"
        )
        self.assertGreater(len(hud_lines), 5)
        joined = "\n".join(hud_lines)
        self.assertIn("Charizard", joined)
        self.assertIn("Blastoise", joined)
        self.assertIn("LUCHAR", joined)

    def test_audio_manager_tracks_and_sfx(self):
        """Verifica la reproducción de música BGM y efectos sonoros."""
        bgm_res = self.audio.play_bgm("bgm_villa_tranquimar")
        self.assertTrue(bgm_res["playing"])
        self.assertEqual(self.audio.current_bgm, "bgm_villa_tranquimar")

        sfx_res = self.audio.play_sfx("sfx_mega_ring_activation")
        self.assertTrue(sfx_res["played"])

    def test_main_game_orchestrator(self):
        """Verifica el arranque de nueva partida y orquestación de vistas."""
        title_lines = self.game.render_title_screen()
        self.assertGreater(len(title_lines), 5)

        start_res = self.game.start_new_game(player_name="Aria", starter_element="fire")
        self.assertTrue(start_res["success"])
        self.assertEqual(self.game.current_state, AndaraGame.STATE_OVERWORLD)


if __name__ == "__main__":
    unittest.main()
