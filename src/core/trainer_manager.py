"""
Módulo del Administrador de Entrenadores Jefes y Rivales Dinámicos
==================================================================
Proyecto: Pokémon: Ecos de Andara
Gestiona los equipos de los 8 Líderes de Gimnasio, el Alto Mando, la Campeona Renata
y la generación procedural/dinámica del equipo del Rival Nahuel según rutas recorridas.
"""

import sys
import json
import os
import random
from typing import Dict, Any, List, Optional

_current_dir = os.path.dirname(os.path.abspath(__file__))
_src_dir = os.path.dirname(_current_dir)
if _src_dir not in sys.path:
    sys.path.insert(0, _src_dir)

from core.pokemon_generator import PokemonGenerator
from core.starter_selection import StarterSelectionManager


class TrainerManager:
    """Controlador de entrenadores de élite y generación de rivales dinámicos."""

    def __init__(self, data_dir: Optional[str] = None):
        if data_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            data_dir = os.path.join(base_dir, "data")

        self.data_dir = data_dir
        self.trainers_data: Dict[str, Any] = self._load_json("trainers.json")
        self.poke_gen = PokemonGenerator(data_dir=data_dir)

    def _load_json(self, filename: str) -> Dict[str, Any]:
        filepath = os.path.join(self.data_dir, filename)
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8-sig") as f:
                return json.load(f)
        return {}

    def get_gym_leader_party(self, leader_id: str) -> Optional[Dict[str, Any]]:
        """Obtiene la ficha y equipo completo de un líder de gimnasio."""
        leaders = self.trainers_data.get("gym_leaders", {})
        leader_info = leaders.get(leader_id)
        if not leader_info:
            return None

        party = []
        for p_data in leader_info.get("team", []):
            poke = self.poke_gen.generate_pokemon(
                species_id=p_data["species_id"],
                level=p_data["level"],
                custom_moves=p_data.get("moves")
            )
            if p_data.get("mega_evolution") and p_data.get("has_mega_stone"):
                poke["held_item"] = f"{p_data['mega_evolution']}ite"
                poke["can_mega_evolve"] = True
                poke["mega_form"] = p_data["mega_evolution"]
            party.append(poke)

        return {
            "name": leader_info.get("name"),
            "city": leader_info.get("city"),
            "badge": leader_info.get("badge"),
            "reward_money": leader_info.get("reward_money", 3000),
            "reward_tm": leader_info.get("reward_tm"),
            "party": party
        }

    def get_elite_four_party(self, e4_id: str) -> Optional[Dict[str, Any]]:
        """Obtiene el equipo del Alto Mando solicitado."""
        e4_members = self.trainers_data.get("elite_four", {})
        e4_info = e4_members.get(e4_id)
        if not e4_info:
            return None

        party = []
        for p_data in e4_info.get("team", []):
            poke = self.poke_gen.generate_pokemon(
                species_id=p_data["species_id"],
                level=p_data["level"],
                custom_moves=p_data.get("moves")
            )
            if p_data.get("mega_evolution") and p_data.get("has_mega_stone"):
                poke["held_item"] = f"{p_data['mega_evolution']}ite"
                poke["can_mega_evolve"] = True
                poke["mega_form"] = p_data["mega_evolution"]
            party.append(poke)

        return {
            "name": e4_info.get("name"),
            "specialty": e4_info.get("specialty"),
            "party": party
        }

    def get_champion_party(self) -> Optional[Dict[str, Any]]:
        """Obtiene el equipo estelar de la Campeona Renata con Mega-Garchomp."""
        champ_dict = self.trainers_data.get("champion", {})
        champ_info = champ_dict.get("champion_renata")
        if not champ_info:
            return None

        party = []
        for p_data in champ_info.get("team", []):
            poke = self.poke_gen.generate_pokemon(
                species_id=p_data["species_id"],
                level=p_data["level"],
                custom_moves=p_data.get("moves")
            )
            if p_data.get("mega_evolution") and p_data.get("has_mega_stone"):
                poke["held_item"] = "garchompite"
                poke["can_mega_evolve"] = True
                poke["mega_form"] = p_data["mega_evolution"]
            party.append(poke)

        return {
            "name": champ_info.get("name"),
            "title": champ_info.get("title"),
            "party": party
        }

    def generate_nahuel_party(
        self,
        story_stage: int,
        player_element: str,
        rng_seed: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Genera el equipo dinámico del Rival Nahuel según la etapa del juego:
        1. Inicial reactivo con ventaja elemental frente al jugador.
        2. Compañero insignia: Growlithe -> Arcanine (etapa >= 2).
        3. Integrantes procedimentales de las rutas recorridas, garantizando sinergia de tipos.
        """
        rng = random.Random(rng_seed) if rng_seed is not None else random.Random()
        party = []

        # 1. Determinar inicial del rival y su evolución según el stage
        starter_map = {
            "grass": {"base": 4, "mid": 5, "final": 6, "name": "Charizard", "mega": "charizard_x"},
            "fire":  {"base": 7, "mid": 8, "final": 9, "name": "Blastoise", "mega": "blastoise"},
            "water": {"base": 1, "mid": 2, "final": 3, "name": "Venusaur", "mega": "venusaur"}
        }
        starter_data = starter_map.get(player_element, starter_map["grass"])

        if story_stage == 1:
            starter_species = starter_data["base"]
            starter_lvl = 5
        elif story_stage == 2:
            starter_species = starter_data["base"]
            starter_lvl = 16
        elif story_stage == 3:
            starter_species = starter_data["mid"]
            starter_lvl = 26
        elif story_stage == 4:
            starter_species = starter_data["mid"]
            starter_lvl = 36
        elif story_stage == 5:
            starter_species = starter_data["final"]
            starter_lvl = 48
        else:  # Stage 6 / Liga / Postgame
            starter_species = starter_data["final"]
            starter_lvl = 65

        starter_poke = self.poke_gen.generate_pokemon(species_id=starter_species, level=starter_lvl)
        if story_stage >= 5:
            starter_poke["can_mega_evolve"] = True
            starter_poke["mega_form"] = starter_data["mega"]
        party.append(starter_poke)

        # 2. Compañero Insignia: Growlithe / Arcanine (desde Metrópolis Solsticio / Stage 2+)
        if story_stage >= 2:
            if story_stage < 4:
                growlithe = self.poke_gen.generate_pokemon(species_id=58, level=starter_lvl - 1)
            else:
                growlithe = self.poke_gen.generate_pokemon(species_id=59, level=starter_lvl - 2)
            party.append(growlithe)

        # 3. Miembros dinámicos de rutas recorridas
        target_party_size = min(6, 1 + story_stage)
        needed = target_party_size - len(party)

        pools = self.trainers_data.get("route_capture_pools", {})
        available_species = []
        if story_stage >= 1:
            available_species.extend(pools.get("early_routes", [16, 10, 43, 25]))
        if story_stage >= 2:
            available_species.extend(pools.get("mid_routes", [54, 60, 74, 133, 179]))
        if story_stage >= 4:
            available_species.extend(pools.get("late_routes", [63, 68, 94, 123, 130, 282, 448]))
        if story_stage >= 5:
            available_species.extend(pools.get("endgame_routes", [149, 248, 373, 376, 445, 609, 637, 823, 887]))

        used_species = {p["species_id"] for p in party}
        rng.shuffle(available_species)

        for sp_id in available_species:
            if len(party) >= target_party_size:
                break
            if sp_id not in used_species:
                lvl = max(5, starter_lvl - rng.randint(1, 3))
                dyn_poke = self.poke_gen.generate_pokemon(species_id=sp_id, level=lvl)
                party.append(dyn_poke)
                used_species.add(sp_id)

        return party
