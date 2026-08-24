"""
Módulo del Gestor de Eventos y Cinemáticas de Historia
======================================================
Proyecto: Pokémon: Ecos de Andara
Orquesta las cinemáticas narrativas principales, sincroniza las elecciones
del jugador con los datos de guardado y conecta los eventos con los combates.
"""

import os
from typing import Dict, Any, List, Optional, Tuple

from .dialogue_manager import DialogueManager
from .starter_selection import StarterSelectionManager
from .pokemon_generator import PokemonGenerator
from .battle.battle_engine import BattleEngine
from .battle.battle_ai import BattleAI


class StoryEventManager:
    """Controlador de eventos narrativos y cinemáticas del juego."""

    def __init__(self, data_dir: Optional[str] = None):
        if data_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            data_dir = os.path.join(base_dir, "data")

        self.data_dir = data_dir
        self.dialogue_mgr = DialogueManager(data_dir=data_dir)
        self.starter_mgr = StarterSelectionManager()
        self.poke_gen = PokemonGenerator(data_dir=data_dir)

    def trigger_starter_ceremony_event(
        self,
        player_element: str,  # 'grass', 'fire', 'water'
        player_name: str = "Aria",
        save_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Ejecuta la cinemática del Prólogo en Villa Tranquimar:
        1. Asigna el inicial al jugador según la respuesta a la pregunta del Prof. Ceibo.
        2. Asigna reactivamente el inicial con ventaja al Rival Nahuel.
        3. Entrega la Pokédex Regional y el Mega-Aro conmemorativo.
        4. Actualiza los flags de guardado.
        5. Instancia el Primer Combate Fraternal en el muelle.
        """
        # 1. Procesar elección de iniciales
        player_starter_info, rival_starter_info = self.starter_mgr.process_player_choice(player_element)

        player_poke = self.poke_gen.generate_pokemon(
            species_id=player_starter_info["id"],
            level=5,
            custom_nature="adamant" if player_element == "fire" else ("bold" if player_element == "grass" else "modest")
        )
        rival_poke = self.poke_gen.generate_pokemon(
            species_id=rival_starter_info["id"],
            level=5,
            custom_nature="adamant" if player_element == "water" else ("modest" if player_element == "fire" else "jolly")
        )

        # 2. Actualizar datos de guardado si se proporcionan
        if save_data:
            save_data["party"] = [player_poke]
            flags = save_data.setdefault("story_flags", {})
            flags["has_starter"] = True
            flags["starter_id"] = player_starter_info["id"]
            flags["starter_element"] = player_element
            flags["has_pokedex"] = True
            flags["has_mega_ring"] = True
            flags["starter_ceremony_completed"] = True

        # 3. Preparar el motor de combate del primer encuentro
        battle = BattleEngine(
            player_party=[player_poke],
            opponent_party=[rival_poke],
            is_trainer_battle=True,
            opponent_name="Rival Nahuel",
            ai_tier=BattleAI.TIER_RIVAL_BOSS,
            player_has_mega_ring=False,
            opponent_has_mega_ring=False,
            data_dir=self.data_dir
        )

        return {
            "success": True,
            "scene_name": "Ceremonia de los Ecos en Villa Tranquimar",
            "player_starter": player_poke,
            "rival_starter": rival_poke,
            "starter_element": player_element,
            "first_battle_engine": battle,
            "message": f"¡{player_name} ha recibido a {player_poke['species_name']}! ¡Nahuel eligió a {rival_poke['species_name']} y te reta a un combate en el muelle!"
        }

    def trigger_growlithe_adoption_event(self, save_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Ejecuta el evento emocional en el Centro de Adopción de Metrópolis Solsticio:
        Nahuel rescata y adopta a su compañero más leal (Growlithe -> Arcanine).
        """
        signature_info = StarterSelectionManager.get_rival_signature_pokemon()

        if save_data:
            flags = save_data.setdefault("story_flags", {})
            flags["rival_growlithe_adopted"] = True
            flags["solsticio_shelter_visited"] = True

        return {
            "success": True,
            "scene_name": "Adopción de Growlithe en Metrópolis Solsticio",
            "rival_signature_pokemon": signature_info,
            "message": "¡Nahuel ha forjado un lazo inquebrantable con Growlithe! El cachorro se une formalmente a su equipo."
        }

    def trigger_champion_encounter_event(self, save_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Ejecuta el encuentro en el mirador de la cordillera con la Campeona Renata.
        """
        if save_data:
            flags = save_data.setdefault("story_flags", {})
            flags["met_champion_renata"] = True

        return {
            "success": True,
            "scene_name": "El Encuentro en la Cumbre con la Campeona Renata",
            "champion_name": "Renata",
            "champion_ace": "Mega-Garchomp",
            "message": "La Campeona Renata ha reconocido el potencial del protagonista y advierte sobre las anomalías del Proyecto Aurora."
        }

    def trigger_aurora_fracture_event(self, save_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Ejecuta la cinemática de ruptura entre la Dra. Clara y Alister (Aurora Cero).
        """
        if save_data:
            flags = save_data.setdefault("story_flags", {})
            flags["aurora_zero_revealed"] = True
            flags["eternatus_threat_known"] = True

        return {
            "success": True,
            "scene_name": "La Ruptura Ideológica en el Cráter Resonante",
            "antagonist": "Alister (Aurora Cero)",
            "message": "Alister revela sus planes radicales de usar la energía de Eternatus para purificar el continente."
        }
