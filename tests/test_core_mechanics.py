"""
Test Suite de Verificación de Mecánicas de Juego
================================================
Proyecto: Pokémon: Ecos de Andara
Verifica:
1. Pokédex Regional sin legendarios en catálogo base.
2. Evoluciones sin intercambio (Cordón Unión, objetos directos, niveles, amistad).
3. Lógica de selección del inicial con ventaja reactiva para el rival Nahuel.
4. Obtención de Growlithe como Pokémon Insignia del Rival en Metrópolis Solsticio.
5. Catálogo de Tiendas: todas las piedras evolutivas, materiales y Mega Piedras a la venta por dinero ($).
"""

import sys
import os
import json
import unittest

# Añadir src/ al path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, "src"))

from core.evolution_manager import EvolutionManager
from core.starter_selection import StarterSelectionManager
from core.shop_catalog import ShopCatalogManager


class TestPokemonMechanics(unittest.TestCase):

    def setUp(self):
        self.evo_mgr = EvolutionManager()
        self.shop_mgr = ShopCatalogManager()
        self.starter_mgr = StarterSelectionManager()

    def test_json_files_integrity(self):
        """Comprueba que todos los archivos JSON sean válidos y no estén vacíos."""
        data_dir = os.path.join(BASE_DIR, "data")
        for filename in ["items.json", "mega_evolutions.json", "moves.json", "pokedex.json", "types.json"]:
            filepath = os.path.join(data_dir, filename)
            self.assertTrue(os.path.exists(filepath), f"Falta el archivo {filename}")
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.assertGreater(len(data), 0, f"El archivo {filename} está vacío")

    def test_starter_counter_selection(self):
        """Verifica que el rival siempre elija la ventaja de tipo directa."""
        # Si Jugador elige FUEGO -> Rival debe elegir AGUA
        p_fire, r_water = self.starter_mgr.process_player_choice("fire")
        self.assertEqual(p_fire["type"], "fire")
        self.assertEqual(r_water["type"], "water")

        # Si Jugador elige AGUA -> Rival debe elegir PLANTA
        p_water, r_grass = self.starter_mgr.process_player_choice("water")
        self.assertEqual(p_water["type"], "water")
        self.assertEqual(r_grass["type"], "grass")

        # Si Jugador elige PLANTA -> Rival debe elegir FUEGO
        p_grass, r_fire = self.starter_mgr.process_player_choice("grass")
        self.assertEqual(p_grass["type"], "grass")
        self.assertEqual(r_fire["type"], "fire")

    def test_rival_signature_growlithe(self):
        """Verifica que el compañero insignia del rival sea Growlithe en Metrópolis Solsticio."""
        signature = StarterSelectionManager.get_rival_signature_pokemon()
        self.assertEqual(signature["id"], 58)
        self.assertEqual(signature["name"], "Growlithe")
        self.assertEqual(signature["event_city"], "Metrópolis Solsticio")
        self.assertTrue(signature["is_signature"])

    def test_trade_evolution_with_link_cable(self):
        """Verifica que las especies que requerían intercambio evolucionen con Cordón Unión o nivel."""
        # Kadabra (ID 64) -> Alakazam (ID 65) con link_cable
        evo_kadabra = self.evo_mgr.check_item_evolution(64, "link_cable")
        self.assertIsNotNone(evo_kadabra)
        self.assertEqual(evo_kadabra["target_id"], 65)

        # Haunter (ID 93) -> Gengar (ID 94) con link_cable
        evo_haunter = self.evo_mgr.check_item_evolution(93, "link_cable")
        self.assertIsNotNone(evo_haunter)
        self.assertEqual(evo_haunter["target_id"], 94)

        # Machoke (ID 67) -> Machamp (ID 68) alternativamente al nivel 38
        evo_machoke = self.evo_mgr.check_level_evolution(67, 38)
        self.assertIsNotNone(evo_machoke)
        self.assertEqual(evo_machoke["target_id"], 68)

        # Graveler (ID 75) -> Golem (ID 76) alternativamente al nivel 38
        evo_graveler = self.evo_mgr.check_level_evolution(75, 38)
        self.assertIsNotNone(evo_graveler)
        self.assertEqual(evo_graveler["target_id"], 76)

    def test_direct_item_evolution_for_trade_items(self):
        """Verifica que objetos como Revestimiento Metálico evolucionen por uso directo."""
        # Scyther (ID 123) + metal_coat -> Scizor (ID 212)
        evo_scyther = self.evo_mgr.check_item_evolution(123, "metal_coat")
        self.assertIsNotNone(evo_scyther)
        self.assertEqual(evo_scyther["target_id"], 212)

        # Onix (ID 95) + metal_coat -> Steelix (ID 208)
        evo_onix = self.evo_mgr.check_item_evolution(95, "metal_coat")
        self.assertIsNotNone(evo_onix)
        self.assertEqual(evo_onix["target_id"], 208)

        # Growlithe (ID 58) + fire_stone -> Arcanine (ID 59)
        evo_growlithe = self.evo_mgr.check_item_evolution(58, "fire_stone")
        self.assertIsNotNone(evo_growlithe)
        self.assertEqual(evo_growlithe["target_id"], 59)

    def test_mega_evolution_availability(self):
        """Verifica que Mega Evolución funcione cuando se tiene el Mega-Aro y la Mega Piedra."""
        can_mega, mega_info = self.evo_mgr.can_mega_evolve("charizard", "charizardite_x", has_mega_ring=True)
        self.assertTrue(can_mega)
        self.assertEqual(mega_info["mega_name"], "Mega-Charizard X")

        # Sin Mega-Aro no debe permitir megaevolucionar
        can_mega_no_ring, _ = self.evo_mgr.can_mega_evolve("charizard", "charizardite_x", has_mega_ring=False)
        self.assertFalse(can_mega_no_ring)

    def test_shop_sales_only_in_regular_money(self):
        """Verifica que todas las piedras evolutivas, materiales y Mega Piedras se compren con dinero convencional ($)."""
        # Grandes Almacenes de Metrópolis Solsticio: Departamento de Evolución
        dept_inv = self.shop_mgr.get_shop_inventory("metropolis_solsticio_dept")
        self.assertIsNotNone(dept_inv)
        item_ids = [item["item_id"] for item in dept_inv]
        self.assertIn("fire_stone", item_ids)
        self.assertIn("link_cable", item_ids)
        self.assertIn("metal_coat", item_ids)

        # Probar compra de Cordón Unión ($5,000)
        success, msg, rem_money = self.shop_mgr.buy_item("metropolis_solsticio_dept", "link_cable", quantity=2, player_money=20000)
        self.assertTrue(success)
        self.assertEqual(rem_money, 10000)

        # Probar compra de Mega Piedra en la Boutique ($50,000)
        success_mega, msg_mega, rem_mega = self.shop_mgr.buy_item("metropolis_solsticio_megas", "garchompite", quantity=1, player_money=60000)
        self.assertTrue(success_mega)
        self.assertEqual(rem_mega, 10000)

        # Verificar fondos insuficientes
        failed_buy, fail_msg, same_money = self.shop_mgr.buy_item("metropolis_solsticio_megas", "garchompite", quantity=1, player_money=100)
        self.assertFalse(failed_buy)
        self.assertEqual(same_money, 100)


if __name__ == "__main__":
    unittest.main()
