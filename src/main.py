"""
================================================================================
  POKÉMON: ECOS DE ANDARA — BUCLE PRINCIPAL Y ORQUESTADOR DE JUEGO (MAIN)
================================================================================
Proyecto: Pokémon: Ecos de Andara (.EXE Local / HD-2.5D)
Orquestador central que integra el guardado, movimiento 2.5D, ciclo día/noche,
shaders de luz, audio BGM/SFX, cinemáticas, diálogos y combates con Mega Evolución.
"""

import sys
import os
from typing import Dict, Any, List, Optional

# Asegurar que src/ esté en el sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(BASE_DIR, "src")
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from core.save_manager import SaveManager
from core.story_events import StoryEventManager
from core.dialogue_manager import DialogueManager
from core.trainer_manager import TrainerManager
from core.shop_catalog import ShopCatalogManager
from overworld.time_cycle import TimeCycleManager
from overworld.map_manager import MapManager
from overworld.player_controller import PlayerController
from overworld.npc_manager import NPCManager
from overworld.encounter_manager import EncounterManager
from graphics.lighting_shader import LightingShader
from graphics.overworld_renderer_25d import OverworldRenderer25D
from battle_ui.battle_scene_renderer import BattleSceneRenderer
from audio.audio_manager import AudioManager


class AndaraGame:
    """Núcleo y máquina de estados global del juego Pokémon: Ecos de Andara."""

    STATE_TITLE = "TITLE"
    STATE_OVERWORLD = "OVERWORLD"
    STATE_DIALOGUE = "DIALOGUE"
    STATE_BATTLE = "BATTLE"
    STATE_MENU = "MENU"

    def __init__(self, data_dir: Optional[str] = None):
        if data_dir is None:
            data_dir = os.path.join(BASE_DIR, "data")

        self.data_dir = data_dir
        self.save_mgr = SaveManager(data_dir=data_dir)
        self.story_mgr = StoryEventManager(data_dir=data_dir)
        self.dialogue_mgr = DialogueManager(data_dir=data_dir)
        self.trainer_mgr = TrainerManager(data_dir=data_dir)
        self.shop_mgr = ShopCatalogManager(data_dir=data_dir)
        
        self.time_cycle = TimeCycleManager()
        self.map_mgr = MapManager(data_dir=data_dir)
        self.npc_mgr = NPCManager(data_dir=data_dir)
        self.encounter_mgr = EncounterManager(data_dir=data_dir)
        
        self.shader = LightingShader()
        self.renderer_25d = OverworldRenderer25D()
        self.audio = AudioManager()

        # Estado del juego
        self.current_state = self.STATE_TITLE
        self.save_data: Optional[Dict[str, Any]] = None
        self.active_battle = None
        self.current_map_id = "villa_tranquimar"
        self.player_controller = PlayerController(start_x=10, start_y=7)

    def render_title_screen(self) -> List[str]:
        """Dibuja la pantalla de título principal con arte estilizado."""
        banner = [
            r" ╔═════════════════════════════════════════════════════════════════════════╗",
            r" ║                                                                         ║",
            r" ║    ██████╗  ██████╗ ██╗  ██╗███████╗███╗   ███╗ ██████╗ ███╗   ██╗      ║",
            r" ║    ██╔══██╗██╔═══██╗██║ ██╔╝██╔════╝████╗ ████║██╔═══██╗████╗  ██║      ║",
            r" ║    ██████╔╝██║   ██║█████╔╝ █████╗  ██╔████╔██║██║   ██║██╔██╗ ██║      ║",
            r" ║    ██╔═══╝ ██║   ██║██╔═██╗ ██╔══╝  ██║╚██╔╝██║██║   ██║██║╚██╗██║      ║",
            r" ║    ██║     ╚██████╔╝██║  ██╗███████╗██║ ╚═╝ ██║╚██████╔╝██║ ╚████║      ║",
            r" ║    ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝      ║",
            r" ║                                                                         ║",
            r" ║                   ✨  E C O S   D E   A N D A R A  ✨                   ║",
            r" ║                    [ Edición HD-2.5D — Motor Offline ]                  ║",
            r" ║                                                                         ║",
            r" ╠═════════════════════════════════════════════════════════════════════════╣",
            r" ║                                                                         ║",
            r" ║     [1] 🌟 NUEVA PARTIDA         [2] 💾 CONTINUAR PARTIDA               ║",
            r" ║     [3] ⚙️  CONFIGURACIÓN         [4] 📜 CRÉDITOS & LORE                 ║",
            r" ║                                                                         ║",
            r" ╚═════════════════════════════════════════════════════════════════════════╝"
        ]
        return banner

    def start_new_game(self, player_name: str = "Aria", starter_element: str = "fire") -> Dict[str, Any]:
        """Inicia una nueva aventura, ejecuta el prólogo del Prof. Ceibo y prepara el guardado."""
        self.save_data = self.save_mgr.create_new_game(player_name=player_name, starter_id=4)
        
        # Ejecutar evento de iniciales con Ceibo
        ceremony_res = self.story_mgr.trigger_starter_ceremony_event(
            player_element=starter_element,
            player_name=player_name,
            save_data=self.save_data
        )

        self.current_state = self.STATE_OVERWORLD
        self.current_map_id = "villa_tranquimar"
        self.player_controller.set_position(10, 7)
        self.audio.play_bgm("bgm_villa_tranquimar")

        return {
            "success": True,
            "player_name": player_name,
            "starter": ceremony_res["player_starter"]["species_name"],
            "rival_starter": ceremony_res["rival_starter"]["species_name"],
            "first_battle_engine": ceremony_res["first_battle_engine"]
        }

    def render_current_view(self) -> List[str]:
        """Renderiza el cuadro visual actual según el estado del juego."""
        if self.current_state == self.STATE_TITLE:
            return self.render_title_screen()

        elif self.current_state == self.STATE_OVERWORLD:
            map_data = self.map_mgr.get_map(self.current_map_id) or {}
            time_state = self.time_cycle.get_time_state()
            npcs = self.npc_mgr.get_npcs_in_map(self.current_map_id)

            return self.renderer_25d.render_viewport(
                map_data=map_data,
                player_x=self.player_controller.x,
                player_y=self.player_controller.y,
                player_facing=self.player_controller.facing,
                npcs=npcs,
                time_period=time_state["period"]
            )

        elif self.current_state == self.STATE_BATTLE and self.active_battle:
            time_state = self.time_cycle.get_time_state()
            return BattleSceneRenderer.render_battle_hud(
                player_poke=self.active_battle.player_active,
                opponent_poke=self.active_battle.opponent_active,
                time_period=time_state["period"],
                biome="mountain"
            )

        return ["Estado no reconocido."]

    def run_full_demo_presentation(self) -> None:
        """Ejecuta una demostración interactiva visual completa para presentación."""
        print("\n" + "\n".join(self.render_title_screen()))
        print("\n▶ Iniciando Nueva Partida en Villa Tranquimar...")
        
        demo = self.start_new_game("Aria", "fire")
        print(f"✔ ¡Bienvenido a Andara, {demo['player_name']}! Has elegido a {demo['starter']}.")
        
        print("\n▶ [1/3] Renderizado 2.5D del Overworld (Amanecer / Villa Tranquimar):")
        self.time_cycle.current_minute = 180  # 06:00 AM Amanecer
        print("\n".join(self.render_current_view()))

        print("\n▶ [2/3] Renderizado 2.5D del Overworld con Shaders Nocturnos (22:00 PM Noche):")
        self.time_cycle.current_minute = 660  # 22:00 PM Noche
        print("\n".join(self.render_current_view()))

        print("\n▶ [3/3] Renderizado del Escenario de Batalla Parallax contra Nahuel:")
        self.current_state = self.STATE_BATTLE
        self.active_battle = demo["first_battle_engine"]
        print("\n".join(self.render_current_view()))


if __name__ == "__main__":
    game = AndaraGame()
    game.run_full_demo_presentation()
