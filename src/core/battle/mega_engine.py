"""
Módulo de Gestión de Mega Evolución en Batalla
==============================================
Proyecto: Pokémon: Ecos de Andara
Gestiona la activación de Mega Evolución en combate, verificación de Mega-Aro,
Mega Piedras equipadas, actualización de estadísticas en tiempo real y límite de 1 por bando.
"""

import json
import os
from typing import Dict, Any, List, Optional, Tuple


class MegaEvolutionEngine:
    """Controlador de Mega Evolución durante el combate."""

    def __init__(self, data_dir: Optional[str] = None):
        if data_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            data_dir = os.path.join(base_dir, "data")
        
        self.data_dir = data_dir
        self.megas_data: Dict[str, Any] = self._load_json("mega_evolutions.json")
        self.items_data: Dict[str, Any] = self._load_json("items.json")

    def _load_json(self, filename: str) -> Dict[str, Any]:
        filepath = os.path.join(self.data_dir, filename)
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}

    def can_mega_evolve(
        self,
        pokemon: Dict[str, Any],
        has_mega_ring: bool = True,
        already_mega_evolved_this_battle: bool = False
    ) -> Tuple[bool, Optional[Dict[str, Any]], str]:
        """
        Comprueba si un Pokémon puede activar la Mega Evolución.
        Condiciones:
        1. El entrenador debe poseer el Mega-Aro (`has_mega_ring == True`).
        2. No haber usado la Mega Evolución en este combate con otro Pokémon del equipo.
        3. El Pokémon no debe estar ya megaevolucionado.
        4. El Pokémon debe sostener una Mega Piedra compatible (`held_item`).
        """
        if not has_mega_ring:
            return False, None, "El entrenador no posee el Mega-Aro."

        if already_mega_evolved_this_battle:
            return False, None, "Ya se ha utilizado la Mega Evolución en este combate."

        if pokemon.get("is_mega", False):
            return False, None, f"{pokemon.get('species_name', 'El Pokémon')} ya ha megaevolucionado."

        held_item = pokemon.get("held_item")
        if not held_item:
            return False, None, "El Pokémon no lleva equipada ninguna Mega Piedra."

        # Buscar coincidencia en la base de datos de megaevoluciones
        species_name = pokemon.get("species_name", "").lower()
        species_id = pokemon.get("species_id")

        matched_mega = None
        for mega_key, mega_info in self.megas_data.items():
            if mega_info.get("item") == held_item:
                # Comprobar si coincide con la especie (ej. venusaur, charizard_x, charizard_y)
                base_species = mega_key.split("_")[0]
                if base_species == species_name:
                    matched_mega = dict(mega_info)
                    matched_mega["mega_id"] = mega_key
                    break

        if not matched_mega:
            return False, None, f"El objeto equipado '{held_item}' no es compatible con {pokemon.get('species_name')}."

        return True, matched_mega, "Mega Evolución disponible."

    def trigger_mega_evolution(self, pokemon: Dict[str, Any], mega_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ejecuta la Mega Evolución sobre el Pokémon durante el turno de combate.
        - Guarda el estado previo original.
        - Aplica el incremento de estadísticas (+100 BST en total).
        - Actualiza los tipos si cambian (ej. Charizard X a Fuego/Dragón).
        - Cambia la habilidad a la mega-habilidad (ej. Garra Dura, Sequía, etc.).
        - Actualiza el nombre visual y marca `is_mega = True`.
        """
        # Guardar copia del estado base para reversión post-combate si es necesario
        pokemon["pre_mega_state"] = {
            "species_name": pokemon.get("species_name"),
            "types": list(pokemon.get("types", [])),
            "ability": pokemon.get("ability"),
            "stats": dict(pokemon.get("stats", {})),
            "max_hp": pokemon.get("max_hp")
        }

        # 1. Actualizar Nombre y Flag
        pokemon["is_mega"] = True
        pokemon["mega_key"] = mega_data.get("mega_id")
        pokemon["display_name"] = mega_data.get("mega_name", f"Mega-{pokemon['species_name']}")

        # 2. Actualizar Tipos
        if "types" in mega_data:
            pokemon["types"] = list(mega_data["types"])

        # 3. Actualizar Habilidad
        if "ability" in mega_data:
            pokemon["ability"] = mega_data["ability"]

        # 4. Actualizar Estadísticas de combate (stat_boost)
        stat_boost = mega_data.get("stat_boost", {})
        stats = pokemon.setdefault("stats", {})
        for stat_name, boost in stat_boost.items():
            if stat_name in stats:
                stats[stat_name] += boost

        return {
            "success": True,
            "mega_name": pokemon["display_name"],
            "new_types": pokemon["types"],
            "new_ability": pokemon.get("ability"),
            "stat_boost": stat_boost,
            "message": f"¡La {mega_data.get('item_name', 'Mega Piedra')} de {pokemon['species_name']} reacciona ante el Mega-Aro! ¡Ha megaevolucionado en {pokemon['display_name']}!"
        }

    def revert_mega_evolution(self, pokemon: Dict[str, Any]) -> None:
        """Revierte la Mega Evolución al terminar el combate o descansar."""
        if not pokemon.get("is_mega", False) or "pre_mega_state" not in pokemon:
            return

        pre_state = pokemon["pre_mega_state"]
        pokemon["is_mega"] = False
        pokemon["display_name"] = pre_state["species_name"]
        pokemon["types"] = list(pre_state["types"])
        pokemon["ability"] = pre_state["ability"]
        pokemon["stats"] = dict(pre_state["stats"])
        del pokemon["pre_mega_state"]
