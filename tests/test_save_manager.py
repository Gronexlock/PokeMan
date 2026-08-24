"""
Test Suite del Sistema de Guardado y Cajas del PC
=================================================
Proyecto: Pokémon: Ecos de Andara
Verifica:
1. Creación de nueva partida con datos iniciales consistentes.
2. Serialización y deserialización a archivo local `.sav` con checksum SHA-256.
3. Gestión de las 30 cajas del PC (depósito y retirada de Pokémon).
4. Bolsillo categorizado de la mochila (medicinas, Poké Balls, mentas y mega piedras).
"""

import sys
import os
import unittest
import tempfile

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, "src"))

from core.save_manager import SaveManager
from core.pokemon_generator import PokemonGenerator


class TestSaveManager(unittest.TestCase):

    def setUp(self):
        self.save_mgr = SaveManager()
        self.gen = PokemonGenerator()
        self.temp_dir = tempfile.TemporaryDirectory()

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_create_new_game_structure(self):
        """Verifica la estructura inicial de una nueva partida."""
        save = self.save_mgr.create_new_game(player_name="Red", starter_id=4)

        self.assertEqual(save["trainer"]["name"], "Red")
        self.assertEqual(len(save["party"]), 1)
        self.assertEqual(save["party"][0]["species_name"], "Charmander")
        self.assertEqual(len(save["pc_boxes"]), 30)
        self.assertTrue(save["story_flags"]["has_starter"])
        self.assertIn("medicine", save["bag"])

    def test_save_and_load_integrity(self):
        """Verifica que el archivo .sav se guarde y recupere sin corrupción."""
        save_path = os.path.join(self.temp_dir.name, "test_save.sav")
        save_data = self.save_mgr.create_new_game(player_name="Aria", starter_id=1)

        # Añadir dinero e ítems
        save_data["trainer"]["money"] = 15000
        self.save_mgr.add_item_to_bag(save_data, "charizardite_x", 1)

        # Guardar
        success, msg = self.save_mgr.save_game(save_path, save_data)
        self.assertTrue(success)
        self.assertTrue(os.path.exists(save_path))

        # Cargar
        load_success, loaded_data, load_msg = self.save_mgr.load_game(save_path)
        self.assertTrue(load_success)
        self.assertIsNotNone(loaded_data)
        self.assertEqual(loaded_data["trainer"]["name"], "Aria")
        self.assertEqual(loaded_data["trainer"]["money"], 15000)
        self.assertEqual(loaded_data["bag"]["mega_stones"]["charizardite_x"], 1)

    def test_pc_deposit_and_withdraw(self):
        """Verifica el depósito y retirada de Pokémon entre el equipo y las cajas de PC."""
        save_data = self.save_mgr.create_new_game(player_name="Aria", starter_id=1)

        # Añadir un segundo Pokémon al equipo
        pikachu = self.gen.generate_pokemon(25, level=10)
        save_data["party"].append(pikachu)
        self.assertEqual(len(save_data["party"]), 2)

        # Depositar el segundo Pokémon en la Caja 1
        dep_ok, dep_msg = self.save_mgr.deposit_pokemon_to_pc(save_data, party_index=1, box_id=1)
        self.assertTrue(dep_ok)
        self.assertEqual(len(save_data["party"]), 1)
        self.assertEqual(len(save_data["pc_boxes"][0]["pokemon"]), 1)
        self.assertEqual(save_data["pc_boxes"][0]["pokemon"][0]["species_name"], "Pikachu")

        # Retirar Pikachu de la Caja 1 al equipo
        with_ok, with_msg = self.save_mgr.withdraw_pokemon_from_pc(save_data, box_id=1, poke_index=0)
        self.assertTrue(with_ok)
        self.assertEqual(len(save_data["party"]), 2)
        self.assertEqual(len(save_data["pc_boxes"][0]["pokemon"]), 0)


if __name__ == "__main__":
    unittest.main()
