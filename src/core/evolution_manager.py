"""
Módulo de Gestión de Evoluciones y Mega Evoluciones
===================================================
Proyecto: Pokémon: Ecos de Andara
Gestiona las evoluciones estándar, métodos sin intercambio (Cordón Unión e ítems directos)
y activación de Mega Evolución en combate.
"""

import json
import os
from typing import Dict, Any, Optional, Tuple, List


class EvolutionManager:
    """Administrador central de evoluciones sin necesidad de intercambio."""

    def __init__(self, data_dir: Optional[str] = None):
        if data_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            data_dir = os.path.join(base_dir, "data")
        
        self.data_dir = data_dir
        self.pokedex: Dict[str, Any] = self._load_json("pokedex.json")
        self.items: Dict[str, Any] = self._load_json("items.json")
        self.megas: Dict[str, Any] = self._load_json("mega_evolutions.json")

    def _load_json(self, filename: str) -> Dict[str, Any]:
        filepath = os.path.join(self.data_dir, filename)
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8-sig") as f:
                return json.load(f)
        return {}

    def check_level_evolution(self, pokemon_id: int, current_level: int) -> Optional[Dict[str, Any]]:
        """
        Verifica si un Pokémon cumple los requisitos de nivel para evolucionar.
        También admite evoluciones de intercambio alternativas por nivel (ej. Nivel 38 con Kadabra/Haunter).
        """
        p_data = self.pokedex.get(str(pokemon_id))
        if not p_data:
            return None

        evo_data = p_data.get("evolution")
        if not evo_data:
            # Revisar si tiene múltiples ramificaciones por nivel
            evolutions = p_data.get("evolutions", [])
            for evo in evolutions:
                if evo.get("method") == "level" and current_level >= evo.get("level", 999):
                    return evo
            return None

        method = evo_data.get("method")
        target_level = evo_data.get("level", 999)

        if method == "level" and current_level >= target_level:
            return evo_data
        elif method == "link_cable_or_level" and current_level >= target_level:
            return evo_data

        return None

    def check_item_evolution(self, pokemon_id: int, item_id: str, gender: str = "male") -> Optional[Dict[str, Any]]:
        """
        Verifica si un Pokémon evoluciona al usar un ítem directamente sobre él.
        Soporta:
          - Piedras evolutivas estándar (Piedra Fuego, Agua, Hoja, etc.)
          - Cordón Unión (Link Cable) para Kadabra, Haunter, Machoke, Graveler, etc.
          - Objetos que antes requerían intercambio (Revestimiento Metálico, Roca del Rey, Escama Dragón, etc.)
        """
        p_data = self.pokedex.get(str(pokemon_id))
        if not p_data:
            return None

        # Revisar evolución directa singular
        evo_data = p_data.get("evolution")
        if evo_data:
            method = evo_data.get("method")
            req_item = evo_data.get("item")

            if method in ["item", "link_cable_or_level"] and req_item == item_id:
                return evo_data
            if method == "link_cable_or_level" and item_id == "link_cable":
                return evo_data

        # Revisar ramificaciones múltiples (ej. Eevee con piedras o Kirlia con Piedra Alba)
        evolutions: List[Dict[str, Any]] = p_data.get("evolutions", [])
        for evo in evolutions:
            req_item = evo.get("item")
            if req_item == item_id:
                # Comprobar restricciones opcionales de género (ej. Gallade requiere macho)
                if evo.get("target_name") == "Gallade" and gender != "male":
                    continue
                if evo.get("target_name") == "Froslass" and gender != "female":
                    continue
                return evo

        return None

    def check_friendship_evolution(self, pokemon_id: int, friendship: int) -> Optional[Dict[str, Any]]:
        """Verifica evolución basada en afecto/amistad (ej. Riolu -> Lucario con amistad >= 220)."""
        p_data = self.pokedex.get(str(pokemon_id))
        if not p_data:
            return None

        evo_data = p_data.get("evolution")
        if evo_data and evo_data.get("method") == "friendship":
            req_friendship = evo_data.get("friendship", 220)
            if friendship >= req_friendship:
                return evo_data

        return None

    def can_mega_evolve(self, pokemon_species: str, held_item_id: str, has_mega_ring: bool) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Verifica si un Pokémon puede activar Mega Evolución en combate.
        Requiere:
          1. Poseer el Mega-Aro de Andara (`has_mega_ring = True`).
          2. Que el Pokémon lleve equipada su respectiva Mega Piedra.
        """
        if not has_mega_ring:
            return False, None

        species_key = pokemon_species.lower()
        
        # Buscar en catálogo de Mega Evoluciones
        for mega_key, mega_info in self.megas.items():
            if mega_info.get("item") == held_item_id:
                # Comprobar si la especie coincide (o variantes X/Y)
                if mega_key.startswith(species_key) or species_key in mega_key:
                    return True, mega_info

        return False, None

    def apply_evolution(self, pokemon_dict: Dict[str, Any], target_evolution: Dict[str, Any]) -> Dict[str, Any]:
        """
        Aplica la evolución a una instancia de Pokémon, actualizando su ID, nombre, stats y tipos.
        """
        target_id = str(target_evolution["target_id"])
        target_data = self.pokedex.get(target_id)
        if not target_data:
            return pokemon_dict

        pokemon_dict["species_id"] = target_data["id"]
        pokemon_dict["species_name"] = target_data["name"]
        pokemon_dict["types"] = list(target_data["types"])
        pokemon_dict["base_stats"] = dict(target_data["stats"])

        # Preservar o actualizar datos de mega evolución si la nueva fase la tiene
        if "mega_evolution" in target_data:
            pokemon_dict["mega_evolution"] = target_data["mega_evolution"]

        return pokemon_dict
