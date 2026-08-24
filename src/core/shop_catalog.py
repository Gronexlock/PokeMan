"""
Módulo de Tiendas, Catálogos y Economía
=======================================
Proyecto: Pokémon: Ecos de Andara
Gestiona los catálogos comerciales de las tiendas Pokémon en Andara,
permitiendo adquirir piedras evolutivas, materiales de evolución, Cordón Unión
y Mega Piedras exclusivamente con dinero estándar del juego ($).
"""

import json
import os
from typing import Dict, Any, List, Optional, Tuple


class ShopCatalogManager:
    """Gestiona las tiendas de Andara y transacciones con dinero convencional ($)."""

    def __init__(self, data_dir: Optional[str] = None):
        if data_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            data_dir = os.path.join(base_dir, "data")

        self.data_dir = data_dir
        self.items_db: Dict[str, Any] = self._load_json("items.json")

        # Catálogos temáticos por ciudad/progresión en Andara
        self.shops = {
            "villa_tranquimar": {
                "name": "Tienda PokéMart de Villa Tranquimar",
                "tier": 1,
                "inventory": [
                    "pokeball", "potion", "antidote", "paralyzeheal"
                ]
            },
            "pueblo_altiplano": {
                "name": "Bazar Minero de Pueblo Altiplano",
                "tier": 2,
                "inventory": [
                    "pokeball", "greatball", "potion", "superpotion",
                    "antidote", "paralyzeheal", "awakening", "fullheal",
                    "fire_stone", "sun_stone", "moon_stone"
                ]
            },
            "villa_yungas": {
                "name": "Herboristería y Mercado Botánico de Villa Yungas",
                "tier": 2,
                "inventory": [
                    "pokeball", "greatball", "superpotion", "fullheal", "revive",
                    "leaf_stone", "shiny_stone", "oval_stone",
                    # Hierbas y Mentas de Naturaleza
                    "adamant_mint", "jolly_mint", "modest_mint", "timid_mint",
                    "bold_mint", "calm_mint", "impish_mint", "careful_mint", "serious_mint"
                ]
            },
            "puerto_coralina": {
                "name": "Mercado Náutico de Puerto Coralina",
                "tier": 3,
                "inventory": [
                    "greatball", "superpotion", "hyperpotion", "fullheal", "revive",
                    "water_stone", "ice_stone", "prism_scale", "dragon_scale"
                ]
            },
            "ciudad_condorina": {
                "name": "Bazar Ancestral de Ciudad Condorina",
                "tier": 3,
                "inventory": [
                    "greatball", "ultraball", "hyperpotion", "fullheal", "revive",
                    "dusk_stone", "dawn_stone", "thunder_stone", "reaper_cloth", "link_cable"
                ]
            },
            "metropolis_solsticio_dept": {
                "name": "Grandes Almacenes de Metrópolis Solsticio — Piso 4 (Minerales, Evolución y Mentas)",
                "tier": 4,
                "inventory": [
                    # Todas las piedras evolutivas
                    "fire_stone", "water_stone", "thunder_stone", "leaf_stone",
                    "moon_stone", "sun_stone", "shiny_stone", "dusk_stone", "dawn_stone", "ice_stone",
                    # Materiales de evolución y Cordón Unión
                    "link_cable", "metal_coat", "kings_rock", "dragon_scale", "prism_scale",
                    "reaper_cloth", "protector", "electirizer", "magmarizer", "upgrade", "dubious_disc",
                    "razor_claw", "razor_fang", "oval_stone",
                    # Catálogo Completo de Mentas de Naturaleza ($2,500 c/u)
                    "adamant_mint", "jolly_mint", "modest_mint", "timid_mint", "bold_mint",
                    "calm_mint", "impish_mint", "careful_mint", "brave_mint", "quiet_mint",
                    "relaxed_mint", "sassy_mint", "hasty_mint", "naive_mint", "lonely_mint",
                    "naughty_mint", "mild_mint", "rash_mint", "lax_mint", "serious_mint"
                ]
            },
            "metropolis_solsticio_megas": {
                "name": "Boutique de Mega Piedras de Metrópolis Solsticio",
                "tier": 5,
                "inventory": [
                    # Catálogo de Piedras Mega a la venta por dinero convencional ($)
                    "venusaurite", "charizardite_x", "charizardite_y", "blastoisinite",
                    "beedrillite", "pidgeotite", "alakazite", "slowbronite", "gengarite",
                    "gyaradosite", "ampharosite", "steelixite", "scizorite", "heracronite",
                    "houndoominite", "tyranitarite", "sceptilite", "blazikenite", "swampertite",
                    "gardevoirite", "galladite", "sableynite", "mawileite", "absolite",
                    "sharpedonite", "cameruptite", "glalitite", "salamencite", "metagrossite",
                    "garchompite", "lucarionite", "abomasite", "lopunnite"
                ]
            },
            "metropolis_solsticio_tms": {
                "name": "Grandes Almacenes de Metrópolis Solsticio — Piso 5 (Bazar de MTs y Movimientos de Combate)",
                "tier": 5,
                "inventory": [
                    "tm_flamethrower", "tm_thunderbolt", "tm_ice_beam", "tm_earthquake",
                    "tm_psychic", "tm_shadow_ball", "tm_sludge_bomb", "tm_energy_ball",
                    "tm_close_combat", "tm_swords_dance", "tm_dragon_dance", "tm_calm_mind",
                    "tm_roost", "tm_u_turn", "tm_volt_switch", "tm_taunt", "tm_stealth_rock",
                    "tm_toxic", "tm_will_o_wisp", "tm_dazzling_gleam", "tm_play_rough",
                    "tm_drain_punch", "tm_knock_off"
                ]
            }
        }

    def _load_json(self, filename: str) -> Dict[str, Any]:
        filepath = os.path.join(self.data_dir, filename)
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8-sig") as f:
                return json.load(f)
        return {}

    def get_shop_inventory(self, shop_key: str) -> Optional[List[Dict[str, Any]]]:
        """Obtiene la lista detallada de artículos con nombre, precio y descripción de una tienda."""
        shop = self.shops.get(shop_key)
        if not shop:
            return None

        inventory_list = []
        for item_id in shop["inventory"]:
            item_data = self.items_db.get(item_id, {})
            inventory_list.append({
                "item_id": item_id,
                "name": item_data.get("name", item_id),
                "category": item_data.get("category", "misc"),
                "price": item_data.get("price", 0),
                "desc": item_data.get("desc", "")
            })
        return inventory_list

    def buy_item(self, shop_key: str, item_id: str, quantity: int, player_money: int) -> Tuple[bool, str, int]:
        """
        Procesa la compra de uno o varios artículos pagando exclusivamente con dinero del juego ($).
        Retorna: (éxito, mensaje, dinero_restante)
        """
        if quantity <= 0:
            return False, "La cantidad debe ser mayor a 0.", player_money

        shop = self.shops.get(shop_key)
        if not shop or item_id not in shop["inventory"]:
            return False, f"El objeto '{item_id}' no está a la venta en esta tienda.", player_money

        item_data = self.items_db.get(item_id)
        if not item_data:
            return False, "Objeto no reconocido en la base de datos.", player_money

        unit_price = item_data.get("price", 0)
        if unit_price <= 0:
            return False, "Este objeto clave no se encuentra a la venta.", player_money

        total_cost = unit_price * quantity
        if player_money < total_cost:
            return False, f"Fondos insuficientes. Se requieren ${total_cost:,} y tienes ${player_money:,}.", player_money

        remaining_money = player_money - total_cost
        msg = f"¡Compra exitosa! Has adquirido {quantity}x {item_data['name']} por ${total_cost:,} Pokécuartos."
        return True, msg, remaining_money

    def sell_item(self, item_id: str, quantity: int, player_money: int) -> Tuple[bool, str, int]:
        """
        Vende un artículo al 50% de su valor base por dinero del juego ($).
        Retorna: (éxito, mensaje, nuevo_dinero)
        """
        if quantity <= 0:
            return False, "La cantidad debe ser mayor a 0.", player_money

        item_data = self.items_db.get(item_id)
        if not item_data:
            return False, "Objeto no reconocido.", player_money

        base_price = item_data.get("price", 0)
        if base_price <= 0:
            return False, "Los objetos clave o sin precio no se pueden vender.", player_money

        sell_price_per_unit = base_price // 2
        total_gain = sell_price_per_unit * quantity
        new_money = player_money + total_gain
        msg = f"Has vendido {quantity}x {item_data['name']} por ${total_gain:,} Pokécuartos."
        return True, msg, new_money
