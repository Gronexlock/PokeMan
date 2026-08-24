"""
Test Suite del Sistema de Diálogos, Mugshots y Eventos Narrativos
=================================================================
Proyecto: Pokémon: Ecos de Andara
Verifica:
1. Carga íntegra de la base de datos de diálogos y guiones.
2. Progresión de nodos, bifurcaciones por elección del jugador y mugshots.
3. Sincronización de flags de historia en el SaveManager.
4. Eventos orquestados: Ceremonia de Ceibo, Adopción de Growlithe y Campeona Renata.
"""

import sys
import os
import unittest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, "src"))

from core.dialogue_manager import DialogueManager
from core.story_events import StoryEventManager
from core.save_manager import SaveManager


class TestDialogueSystem(unittest.TestCase):

    def setUp(self):
        self.dialogue_mgr = DialogueManager()
        self.event_mgr = StoryEventManager()
        self.save_mgr = SaveManager()

    def test_dialogues_json_integrity(self):
        """Verifica que todos los diálogos principales estén definidos."""
        dialogues = self.dialogue_mgr.dialogues_data
        for d_key in ["intro_ceibo_ceremony", "solsticio_growlithe_adoption", "renata_mountain_encounter", "aurora_fracture_scene"]:
            self.assertIn(d_key, dialogues, f"Falta el diálogo {d_key}")
            self.assertGreater(len(dialogues[d_key].get("nodes", [])), 0)

    def test_starter_ceremony_dialogue_flow(self):
        """Verifica el flujo del diálogo del Profesor Ceibo y la selección de opción."""
        state = self.dialogue_mgr.start_dialogue("intro_ceibo_ceremony")
        self.assertIsNotNone(state)
        self.assertEqual(state["speaker"], "Profesor Ceibo")
        self.assertFalse(state["finished"])

        # Avanzar hasta la pregunta de virtud
        while not state.get("has_choices") and not state.get("finished"):
            state = self.dialogue_mgr.advance_dialogue()

        self.assertTrue(state.get("has_choices"))
        self.assertEqual(len(state.get("choices")), 3)

        # Elegir Fuego (choice_index = 1)
        save_data = self.save_mgr.create_new_game(player_name="Aria", starter_id=4)
        state_fire = self.dialogue_mgr.advance_dialogue(choice_index=1, save_data=save_data)
        self.assertEqual(state_fire["speaker"], "Profesor Ceibo")
        self.assertIn("starter_element", save_data["story_flags"])
        self.assertEqual(save_data["story_flags"]["starter_element"], "fire")

    def test_story_events_starter_ceremony_integration(self):
        """Verifica la orquestación completa de la ceremonia de iniciales."""
        save_data = self.save_mgr.create_new_game(player_name="Aria", starter_id=4)
        res = self.event_mgr.trigger_starter_ceremony_event(player_element="fire", player_name="Aria", save_data=save_data)

        self.assertTrue(res["success"])
        self.assertEqual(res["player_starter"]["species_id"], 4)  # Charmander
        self.assertEqual(res["rival_starter"]["species_id"], 7)   # Squirtle (Ventaja Agua)
        self.assertTrue(save_data["story_flags"]["has_pokedex"])
        self.assertTrue(save_data["story_flags"]["has_mega_ring"])
        self.assertIsNotNone(res["first_battle_engine"])

    def test_growlithe_adoption_event(self):
        """Verifica la adopción del Growlithe del rival en Metrópolis Solsticio."""
        save_data = self.save_mgr.create_new_game(player_name="Aria", starter_id=4)
        res = self.event_mgr.trigger_growlithe_adoption_event(save_data=save_data)

        self.assertTrue(res["success"])
        self.assertEqual(res["rival_signature_pokemon"]["id"], 58)
        self.assertTrue(save_data["story_flags"]["rival_growlithe_adopted"])

    def test_champion_and_aurora_events(self):
        """Verifica los eventos de la Campeona Renata y la ruptura de Aurora Cero."""
        save_data = self.save_mgr.create_new_game(player_name="Aria", starter_id=4)

        # Encuentro con Renata
        res_r = self.event_mgr.trigger_champion_encounter_event(save_data=save_data)
        self.assertTrue(res_r["success"])
        self.assertTrue(save_data["story_flags"]["met_champion_renata"])

        # Ruptura de Aurora
        res_a = self.event_mgr.trigger_aurora_fracture_event(save_data=save_data)
        self.assertTrue(res_a["success"])
        self.assertTrue(save_data["story_flags"]["aurora_zero_revealed"])


if __name__ == "__main__":
    unittest.main()
