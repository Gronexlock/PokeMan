"""
Simulador Interactivo de Combate y Batallas Clave
=================================================
Proyecto: Pokémon: Ecos de Andara
Proporciona una interfaz visual de consola con barras de salud en tiempo real,
menús de selección de acciones, demostración del Primer Combate contra Nahuel
en Villa Tranquimar y exhibición de Mega Evoluciones.
"""

import sys
import os
import time
from typing import Dict, Any, List, Optional

# Añadir src/ al path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(BASE_DIR, "src"))

from core.pokemon_generator import PokemonGenerator
from core.battle.battle_engine import BattleEngine
from core.battle.battle_ai import BattleAI


class BattleSimulatorCLI:
    """Renderizador y simulador interactivo de combates en consola."""

    @staticmethod
    def render_health_bar(current_hp: int, max_hp: int, length: int = 20) -> str:
        """Renderiza una barra de salud visual estilizada en ASCII."""
        ratio = max(0.0, min(1.0, current_hp / max_hp))
        filled_length = int(length * ratio)
        empty_length = length - filled_length

        if ratio > 0.5:
            bar_color = "\033[92m"  # Verde
        elif ratio > 0.2:
            bar_color = "\033[93m"  # Amarillo
        else:
            bar_color = "\033[91m"  # Rojo
        reset_color = "\033[0m"

        bar = "█" * filled_length + "░" * empty_length
        return f"{bar_color}[{bar}]{reset_color} {current_hp}/{max_hp} PS"

    @staticmethod
    def print_battle_screen(engine: BattleEngine) -> None:
        """Imprime el estado visual actual del combate."""
        player_p = engine.player_active
        opp_p = engine.opponent_active

        p_name = player_p.get("display_name", player_p.get("species_name"))
        o_name = opp_p.get("display_name", opp_p.get("species_name"))

        print("\n" + "=" * 65)
        print(f" ⚔️  COMBATE: {p_name} (Nv. {player_p['level']}) vs {engine.opponent_name} ({o_name} Nv. {opp_p['level']})")
        print("=" * 65)

        # Oponente
        opp_types = "/".join(opp_p.get("types", []))
        print(f"\n  [OPONENTE] {o_name} (Tipos: {opp_types})")
        print(f"  Salud: {BattleSimulatorCLI.render_health_bar(opp_p['current_hp'], opp_p['max_hp'])}")
        if opp_p.get("is_mega"):
            print("  🌟 ESTADO: ¡MEGA EVOLUCIONADO!")

        print("\n" + " - " * 20)

        # Jugador
        p_types = "/".join(player_p.get("types", []))
        print(f"  [TU EQUIPO] {p_name} (Tipos: {p_types})")
        print(f"  Salud: {BattleSimulatorCLI.render_health_bar(player_p['current_hp'], player_p['max_hp'])}")
        if player_p.get("is_mega"):
            print("  🌟 ESTADO: ¡MEGA EVOLUCIONADO!")

        print("=" * 65)

    @classmethod
    def run_first_rival_battle_demo(cls, player_starter_id: int = 4, rival_starter_id: int = 7) -> Dict[str, Any]:
        """
        Ejecuta la simulación automática del Primer Combate en Villa Tranquimar:
        Protagonista (Charmander) vs Rival Nahuel (Squirtle).
        """
        gen = PokemonGenerator()
        player_poke = gen.generate_pokemon(player_starter_id, level=5, custom_nature="adamant")
        rival_poke = gen.generate_pokemon(rival_starter_id, level=5, custom_nature="modest")

        engine = BattleEngine(
            player_party=[player_poke],
            opponent_party=[rival_poke],
            is_trainer_battle=True,
            opponent_name="Rival Nahuel",
            ai_tier=BattleAI.TIER_RIVAL_BOSS,
            player_has_mega_ring=False,
            opponent_has_mega_ring=False
        )

        print("\n" + "🌟" * 30)
        print(" INICIANDO PRIMER COMBATE EN VILLA TRANQUIMAR: JUGADOR vs NAHUEL")
        print("🌟" * 30)

        cls.print_battle_screen(engine)

        # Simular rondas de combate
        moves = player_poke["moves"]
        turn = 0
        while not engine.is_finished and turn < 15:
            turn += 1
            # Jugador ataca inteligentemente (ej. usando Arañazo o Ascuas)
            chosen_move = moves[0] if "scratch" in moves else moves[0]
            if "ember" in moves and rival_poke["current_hp"] < 15:
                chosen_move = "ember"

            player_action = {
                "action_type": "FIGHT",
                "move_id": chosen_move,
                "mega_evolve": False
            }

            result = engine.execute_round(player_action)

            for event in result["events"]:
                print(f"  ▶ {event}")

            cls.print_battle_screen(engine)

        print("\n" + "🏆" * 30)
        print(f" RESULTADO FINAL: GANADOR = {engine.winner.upper() if engine.winner else 'EMPATE'}")
        print("🏆" * 30 + "\n")

        return {
            "winner": engine.winner,
            "turns": engine.turn_number,
            "player_hp": player_poke["current_hp"],
            "rival_hp": rival_poke["current_hp"]
        }

    @classmethod
    def run_mega_evolution_showcase(cls) -> Dict[str, Any]:
        """
        Ejecuta una demostración de combate de alto nivel con Mega Evolución:
        Mega-Charizard X (Nv. 50) vs Mega-Blastoise (Nv. 50).
        """
        gen = PokemonGenerator()
        charizard = gen.generate_pokemon(6, level=50, custom_nature="adamant")
        charizard["held_item"] = "charizardite_x"
        charizard["moves"] = ["dragon_claw", "flamethrower", "earthquake", "swords_dance"]

        blastoise = gen.generate_pokemon(9, level=50, custom_nature="modest")
        blastoise["held_item"] = "blastoisinite"
        blastoise["moves"] = ["hydro_pump", "ice_beam", "aura_sphere", "flash_cannon"]

        engine = BattleEngine(
            player_party=[charizard],
            opponent_party=[blastoise],
            is_trainer_battle=True,
            opponent_name="Entrenador Maestro",
            ai_tier=BattleAI.TIER_RIVAL_BOSS,
            player_has_mega_ring=True,
            opponent_has_mega_ring=True
        )

        print("\n" + "💥" * 30)
        print(" DEMOSTRACIÓN DE MEGA EVOLUCIÓN EN VIVO: CHARIZARD vs BLASTOISE")
        print("💥" * 30)

        # Ronda 1: Ambos activan Mega Evolución
        action_player = {
            "action_type": "FIGHT",
            "move_id": "dragon_claw",
            "mega_evolve": True
        }

        result = engine.execute_round(action_player)
        for event in result["events"]:
            print(f"  ▶ {event}")

        cls.print_battle_screen(engine)

        return {
            "player_is_mega": charizard.get("is_mega", False),
            "opponent_is_mega": blastoise.get("is_mega", False),
            "charizard_name": charizard.get("display_name"),
            "blastoise_name": blastoise.get("display_name")
        }


if __name__ == "__main__":
    BattleSimulatorCLI.run_first_rival_battle_demo()
    BattleSimulatorCLI.run_mega_evolution_showcase()
