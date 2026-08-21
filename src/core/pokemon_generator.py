"""
Módulo Generador de Pokémon y Sistema de IVs/EVs/Naturalezas
============================================================
Proyecto: Pokémon: Ecos de Andara
Genera instancias de Pokémon con IVs perfectos (31 en todos los stats) por defecto,
gestiona los EVs listos para combate, la asignación de naturalezas y el cambio
de naturaleza mediante Mentas/Hierbas aromáticas.
"""

import json
import os
import random
from typing import Dict, Any, Optional, Tuple, List


class PokemonGenerator:
    """Genera y gestiona las estadísticas, IVs, EVs y naturalezas de los Pokémon."""

    # Tabla oficial de las 25 naturalezas de combate
    NATURES = {
        "hardy":    {"increased": None, "decreased": None, "es_name": "Fuerte"},
        "lonely":   {"increased": "attack", "decreased": "defense", "es_name": "Huraña"},
        "brave":    {"increased": "attack", "decreased": "speed", "es_name": "Audaz"},
        "adamant":  {"increased": "attack", "decreased": "special_attack", "es_name": "Firme"},
        "naughty":  {"increased": "attack", "decreased": "special_defense", "es_name": "Pícara"},
        "bold":     {"increased": "defense", "decreased": "attack", "es_name": "Osada"},
        "docile":   {"increased": None, "decreased": None, "es_name": "Dócil"},
        "relaxed":  {"increased": "defense", "decreased": "speed", "es_name": "Plácida"},
        "impish":   {"increased": "defense", "decreased": "special_attack", "es_name": "Agitada"},
        "lax":      {"increased": "defense", "decreased": "special_defense", "es_name": "Floja"},
        "timid":    {"increased": "speed", "decreased": "attack", "es_name": "Miedosa"},
        "hasty":    {"increased": "speed", "decreased": "defense", "es_name": "Activa"},
        "serious":  {"increased": None, "decreased": None, "es_name": "Seria"},
        "jolly":    {"increased": "speed", "decreased": "special_attack", "es_name": "Alegre"},
        "naive":    {"increased": "speed", "decreased": "special_defense", "es_name": "Ingenua"},
        "modest":   {"increased": "special_attack", "decreased": "attack", "es_name": "Modesta"},
        "mild":     {"increased": "special_attack", "decreased": "defense", "es_name": "Afable"},
        "quiet":    {"increased": "special_attack", "decreased": "speed", "es_name": "Mansa"},
        "bashful":  {"increased": None, "decreased": None, "es_name": "Tímida"},
        "rash":     {"increased": "special_attack", "decreased": "special_defense", "es_name": "Alocada"},
        "calm":     {"increased": "special_defense", "decreased": "attack", "es_name": "Serena"},
        "gentle":   {"increased": "special_defense", "decreased": "defense", "es_name": "Amable"},
        "sassy":    {"increased": "special_defense", "decreased": "speed", "es_name": "Grosera"},
        "careful":  {"increased": "special_defense", "decreased": "special_attack", "es_name": "Cauta"},
        "quirky":   {"increased": None, "decreased": None, "es_name": "Rara"}
    }

    def __init__(self, data_dir: Optional[str] = None):
        if data_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            data_dir = os.path.join(base_dir, "data")
        
        self.data_dir = data_dir
        self.pokedex: Dict[str, Any] = self._load_json("pokedex.json")
        self.items: Dict[str, Any] = self._load_json("items.json")

    def _load_json(self, filename: str) -> Dict[str, Any]:
        filepath = os.path.join(self.data_dir, filename)
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}

    def generate_pokemon(
        self,
        species_id: int,
        level: int = 5,
        custom_nature: Optional[str] = None,
        ev_preset: Optional[Dict[str, int]] = None
    ) -> Dict[str, Any]:
        """
        Genera un Pokémon con IVs perfectos (31 en los 6 stats) por defecto,
        EVs configurados/listos, y una naturaleza (aleatoria o personalizada).
        """
        species_data = self.pokedex.get(str(species_id))
        if not species_data:
            raise ValueError(f"Especie con ID {species_id} no encontrada en la Pokédex.")

        # 1. IVs Perfectos (31 en todo)
        ivs = {
            "hp": 31,
            "attack": 31,
            "defense": 31,
            "special_attack": 31,
            "special_defense": 31,
            "speed": 31
        }

        # 2. EVs Listos (0 de base limpia o preset competitivo como 252/252/4)
        if ev_preset:
            evs = dict(ev_preset)
        else:
            evs = {
                "hp": 0,
                "attack": 0,
                "defense": 0,
                "special_attack": 0,
                "special_defense": 0,
                "speed": 0
            }

        # 3. Naturaleza (Nacimiento aleatorio si no se especifica)
        if custom_nature and custom_nature.lower() in self.NATURES:
            base_nature = custom_nature.lower()
        else:
            base_nature = random.choice(list(self.NATURES.keys()))

        pokemon = {
            "species_id": species_data["id"],
            "species_name": species_data["name"],
            "types": list(species_data["types"]),
            "level": level,
            "base_stats": dict(species_data["stats"]),
            "ivs": ivs,
            "evs": evs,
            "base_nature": base_nature,
            "effective_nature": base_nature,  # Modificable con Mentas
            "current_hp": 0,
            "max_hp": 0,
            "moves": [m["move"] for m in species_data.get("learnset", [])[:4]],
            "held_item": None
        }

        # Calcular estadísticas finales
        self.recalculate_stats(pokemon)
        pokemon["current_hp"] = pokemon["max_hp"]

        return pokemon

    def recalculate_stats(self, pokemon: Dict[str, Any]) -> None:
        """Calcula las estadísticas finales del Pokémon usando las fórmulas oficiales (Gen 5+)."""
        level = pokemon["level"]
        base = pokemon["base_stats"]
        ivs = pokemon["ivs"]
        evs = pokemon["evs"]
        eff_nature = self.NATURES.get(pokemon.get("effective_nature", "serious"), self.NATURES["serious"])

        # Fórmula de HP: floor((2 * Base + IV + floor(EV / 4)) * Level / 100) + Level + 10
        hp_base = base.get("hp", 50)
        hp_iv = ivs.get("hp", 31)
        hp_ev = evs.get("hp", 0)
        max_hp = int(((2 * hp_base + hp_iv + (hp_ev // 4)) * level) / 100) + level + 10
        pokemon["max_hp"] = max_hp

        # Estadísticas secundarias: (floor((2 * Base + IV + floor(EV / 4)) * Level / 100) + 5) * MultiplicadorNaturaleza
        calculated_stats = {}
        for stat in ["attack", "defense", "special_attack", "special_defense", "speed"]:
            s_base = base.get(stat, 50)
            s_iv = ivs.get(stat, 31)
            s_ev = evs.get(stat, 0)
            raw_stat = int(((2 * s_base + s_iv + (s_ev // 4)) * level) / 100) + 5

            # Aplicar modificador de naturaleza
            multiplier = 1.0
            if eff_nature["increased"] == stat:
                multiplier = 1.1
            elif eff_nature["decreased"] == stat:
                multiplier = 0.9

            calculated_stats[stat] = int(raw_stat * multiplier)

        pokemon["stats"] = calculated_stats

    def apply_nature_mint(self, pokemon: Dict[str, Any], mint_item_id: str) -> Tuple[bool, str]:
        """
        Aplica una Menta de Naturaleza sobre el Pokémon, cambiando su `effective_nature`
        y recalculando inmediatamente todas sus estadísticas de combate.
        """
        mint_data = self.items.get(mint_item_id)
        if not mint_data or mint_data.get("category") != "nature_mints":
            return False, f"El objeto '{mint_item_id}' no es una Menta de Naturaleza válida."

        target_nature = mint_data.get("nature_target")
        if not target_nature or target_nature not in self.NATURES:
            return False, "Naturaleza objetivo de la menta no reconocida."

        old_nature = pokemon.get("effective_nature", pokemon["base_nature"])
        pokemon["effective_nature"] = target_nature
        self.recalculate_stats(pokemon)

        nature_name = self.NATURES[target_nature]["es_name"]
        return True, f"¡El aroma de la {mint_data['name']} ha cambiado los modificadores de estadísticas de {pokemon['species_name']} a Naturaleza {nature_name}!"
