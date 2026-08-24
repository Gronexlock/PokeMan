"""
Módulo de Gestión de Guardado Local (.sav), Equipo y Cajas de PC
===============================================================
Proyecto: Pokémon: Ecos de Andara
Serializa y deserializa el estado de la partida en archivos `.sav` locales,
gestiona las 30 cajas del PC (900 espacios), la mochila dividida en 6 bolsillos
y los flags de progresión de la historia.
"""

import sys
import json
import os
import time
import hashlib
from typing import Dict, Any, List, Optional, Tuple

_current_dir = os.path.dirname(os.path.abspath(__file__))
_src_dir = os.path.dirname(_current_dir)
if _src_dir not in sys.path:
    sys.path.insert(0, _src_dir)

from core.pokemon_generator import PokemonGenerator


class SaveManager:
    """Administrador de guardado, carga y persistencia local de la partida."""

    SAVE_VERSION = "1.0.0"
    TOTAL_PC_BOXES = 30
    BOX_CAPACITY = 30  # 900 Pokémon en total

    def __init__(self, data_dir: Optional[str] = None):
        if data_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            data_dir = os.path.join(base_dir, "data")
        
        self.data_dir = data_dir
        self.poke_gen = PokemonGenerator(data_dir=data_dir)
        self.items_data: Dict[str, Any] = self._load_json("items.json")

    def _load_json(self, filename: str) -> Dict[str, Any]:
        filepath = os.path.join(self.data_dir, filename)
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}

    def create_new_game(self, player_name: str = "Aria", starter_id: int = 4) -> Dict[str, Any]:
        """Crea un estado de nueva partida con datos iniciales y el Pokémon inicial elegido."""
        starter_poke = self.poke_gen.generate_pokemon(
            species_id=starter_id,
            level=5,
            custom_nature="adamant" if starter_id == 4 else ("modest" if starter_id == 7 else "bold")
        )

        # Cajas de PC vacías (30 cajas con listas vacías)
        pc_boxes = []
        for i in range(1, self.TOTAL_PC_BOXES + 1):
            pc_boxes.append({
                "box_id": i,
                "box_name": f"Caja {i}",
                "pokemon": []
            })

        # Inventario inicial categorizado
        bag = {
            "medicine": {
                "potion": 5,
                "revive": 2
            },
            "pokeballs": {
                "poke_ball": 10
            },
            "items": {
                "escape_rope": 1
            },
            "nature_mints": {},
            "mega_stones": {},
            "key_items": {
                "pokedex": 1,
                "mega_ring": 1
            }
        }

        # Flags de progreso de historia
        story_flags = {
            "has_starter": True,
            "starter_id": starter_id,
            "starter_received_at": "Villa Tranquimar",
            "rival_growlithe_adopted": False,
            "gym1_defeated": False,
            "gym2_defeated": False,
            "gym3_defeated": False,
            "gym4_defeated": False,
            "gym5_defeated": False,
            "gym6_defeated": False,
            "gym7_defeated": False,
            "gym8_defeated": False,
            "eternatus_defeated": False,
            "resonance_island_unlocked": False,
            "champion_beaten": False
        }

        save_data = {
            "version": self.SAVE_VERSION,
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "last_saved": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "play_time_seconds": 0,
            "trainer": {
                "name": player_name,
                "id": 10842,
                "secret_id": 48291,
                "money": 3000,
                "badges_count": 0,
                "badges": [],
                "current_map": "villa_tranquimar",
                "coordinates": {"x": 12, "y": 18}
            },
            "party": [starter_poke],
            "pc_boxes": pc_boxes,
            "bag": bag,
            "story_flags": story_flags
        }

        return save_data

    def save_game(self, filepath: str, save_data: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Serializa y almacena la partida en un archivo local `.sav`.
        Incluye un hash SHA-256 de verificación de integridad.
        """
        try:
            os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
            save_data["last_saved"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

            # Generar contenido JSON limpio
            payload = json.dumps(save_data, ensure_ascii=False, indent=2)
            
            # Calcular checksum
            checksum = hashlib.sha256(payload.encode("utf-8")).hexdigest()
            wrapper = {
                "checksum": checksum,
                "data": save_data
            }

            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(wrapper, f, ensure_ascii=False, indent=2)

            return True, f"Partida guardada exitosamente en '{filepath}'."
        except Exception as e:
            return False, f"Error al guardar la partida: {str(e)}"

    def load_game(self, filepath: str) -> Tuple[bool, Optional[Dict[str, Any]], str]:
        """Carga y valida la integridad de una partida desde un archivo `.sav`."""
        if not os.path.exists(filepath):
            return False, None, f"El archivo de guardado '{filepath}' no existe."

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                wrapper = json.load(f)

            if "checksum" not in wrapper or "data" not in wrapper:
                # Formato directo sin wrapper
                return True, wrapper, "Partida cargada correctamente (formato estándar)."

            # Validar integridad
            expected_checksum = wrapper["checksum"]
            raw_data = wrapper["data"]
            calculated_checksum = hashlib.sha256(
                json.dumps(raw_data, ensure_ascii=False, indent=2).encode("utf-8")
            ).hexdigest()

            if expected_checksum != calculated_checksum:
                # Advertencia de integridad pero permitimos cargar
                return True, raw_data, "Partida cargada con discrepancia menor de checksum."

            return True, raw_data, "Partida cargada e integridad verificada con éxito."
        except Exception as e:
            return False, None, f"Error al leer el archivo de guardado: {str(e)}"

    def deposit_pokemon_to_pc(self, save_data: Dict[str, Any], party_index: int, box_id: int = 1) -> Tuple[bool, str]:
        """Deposita un Pokémon del equipo activo en la Caja de PC indicada."""
        party = save_data.get("party", [])
        if len(party) <= 1:
            return False, "¡No puedes depositar a tu único Pokémon en el PC!"

        if party_index < 0 or party_index >= len(party):
            return False, "Índice de Pokémon en el equipo inválido."

        pc_boxes = save_data.get("pc_boxes", [])
        target_box = next((b for b in pc_boxes if b["box_id"] == box_id), None)
        if not target_box:
            return False, f"La Caja de PC #{box_id} no existe."

        if len(target_box["pokemon"]) >= self.BOX_CAPACITY:
            return False, f"La {target_box['box_name']} está llena (Capacidad: {self.BOX_CAPACITY})."

        poke = party.pop(party_index)
        target_box["pokemon"].append(poke)
        return True, f"¡{poke['species_name']} ha sido depositado en {target_box['box_name']}!"

    def withdraw_pokemon_from_pc(self, save_data: Dict[str, Any], box_id: int, poke_index: int) -> Tuple[bool, str]:
        """Saca un Pokémon de la Caja de PC y lo añade al equipo activo (máximo 6)."""
        party = save_data.get("party", [])
        if len(party) >= 6:
            return False, "¡Tu equipo ya tiene el límite máximo de 6 Pokémon!"

        pc_boxes = save_data.get("pc_boxes", [])
        target_box = next((b for b in pc_boxes if b["box_id"] == box_id), None)
        if not target_box:
            return False, f"La Caja de PC #{box_id} no existe."

        if poke_index < 0 or poke_index >= len(target_box["pokemon"]):
            return False, "Índice de Pokémon en la caja inválido."

        poke = target_box["pokemon"].pop(poke_index)
        party.append(poke)
        return True, f"¡{poke['species_name']} ha sido retirado al equipo activo!"

    def add_item_to_bag(self, save_data: Dict[str, Any], item_id: str, quantity: int = 1) -> Tuple[bool, str]:
        """Añade un objeto a la mochila clasificándolo automáticamente en su bolsillo correspondiente."""
        item_info = self.items_data.get(item_id)
        if not item_info:
            return False, f"El objeto '{item_id}' no existe en el catálogo de items."

        category = item_info.get("category", "items")
        bag = save_data.setdefault("bag", {})
        pocket = bag.setdefault(category, {})

        pocket[item_id] = pocket.get(item_id, 0) + quantity
        return True, f"Añadido x{quantity} {item_info['name']} al bolsillo de {category}."
