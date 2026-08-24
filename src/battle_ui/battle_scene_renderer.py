"""
Renderizador Gráfico de Escenarios de Batalla Parallax y HUD HD (2.5D)
======================================================================
Proyecto: Pokémon: Ecos de Andara
Dibuja el escenario de combate en capas parallax según el bioma y la hora del día,
las barras de salud fluidas, badges de estado y animación visual de Mega Evolución.
"""

from typing import Dict, Any, List, Optional


class BattleSceneRenderer:
    """Renderizador de escenarios y HUD visual para el motor de combate."""

    # Fondos atmosféricos y cielo por horario
    SKY_THEMES = {
        "morning": "🌅 [CIELO AMANECER: Luz dorada sobre la cordillera andina]",
        "day":     "☀️ [CIELO MEDIODÍA: Resplandor solar nítido sobre Andara]",
        "sunset":  "🌆 [CIELO ATARDECER: Gradientes de fuego y sombras alargadas]",
        "night":   "🌙 [CIELO NOCTURNO: Manto de estrellas y resonancia cósmica]"
    }

    # Relieve de biomas en capas parallax
    BIOME_PARALLAX = {
        "mountain":  "    /\\  /\\/\\    /\\  /\\/\\    /\\  /\\/\\  [Cordillera de Andara]",
        "coast":     "  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ [Océano Austral]",
        "forest":    "  🌳 🌲 🌳 🌲 🌳 🌲 🌳 🌲 🌳 🌲 🌳 🌲 🌳 🌲 [Selva Esmeralda]",
        "ruins":     "  🏛️  [🪨]  🏛️  [🪨]  🏛️  [🪨]  🏛️ [Ruinas del Cráter]"
    }

    @classmethod
    def render_battle_hud(
        cls,
        player_poke: Dict[str, Any],
        opponent_poke: Dict[str, Any],
        time_period: str = "day",
        biome: str = "mountain",
        weather: str = "clear",
        width: int = 72
    ) -> List[str]:
        """
        Genera el cuadro completo de combate con fondo parallax, plataformas y barras de vida.
        """
        lines = []
        sky = cls.SKY_THEMES.get(time_period, cls.SKY_THEMES["day"])
        relief = cls.BIOME_PARALLAX.get(biome, cls.BIOME_PARALLAX["mountain"])

        # Datos del oponente
        opp_name = opponent_poke.get("display_name", opponent_poke.get("species_name", "Oponente"))
        opp_lvl = opponent_poke.get("level", 5)
        opp_hp = opponent_poke.get("current_hp", 0)
        opp_max = max(1, opponent_poke.get("max_hp", 100))
        opp_pct = int((opp_hp / opp_max) * 20)
        opp_bar = "█" * opp_pct + "░" * (20 - opp_pct)
        opp_status = f" [{opponent_poke.get('status').upper()}]" if opponent_poke.get("status") else ""
        opp_mega = " ✨[MEGA]✨" if opponent_poke.get("is_mega") else ""

        # Datos del jugador
        pl_name = player_poke.get("display_name", player_poke.get("species_name", "Tu Pokémon"))
        pl_lvl = player_poke.get("level", 5)
        pl_hp = player_poke.get("current_hp", 0)
        pl_max = max(1, player_poke.get("max_hp", 100))
        pl_pct = int((pl_hp / pl_max) * 20)
        pl_bar = "█" * pl_pct + "░" * (20 - pl_pct)
        pl_status = f" [{player_poke.get('status').upper()}]" if player_poke.get("status") else ""
        pl_mega = " ✨[MEGA]✨" if player_poke.get("is_mega") else ""

        # Marco superior
        lines.append(" ╔" + "═" * (width - 2) + "╗")
        lines.append(f" ║  {sky:<{width - 6}}  ║")
        lines.append(f" ║  {relief:<{width - 6}}  ║")
        lines.append(" ║" + " " * (width - 2) + "║")

        # HUD Oponente (Arriba a la derecha)
        opp_info = f"🔴 {opp_name}{opp_mega}  Nv. {opp_lvl}{opp_status}"
        opp_hp_line = f"PS: [{opp_bar}] {opp_hp}/{opp_max}"
        lines.append(f" ║  {' ':26}{opp_info:<{width - 32}}  ║")
        lines.append(f" ║  {' ':26}{opp_hp_line:<{width - 32}}  ║")
        lines.append(" ║" + " " * (width - 2) + "║")

        # Plataformas de combate y sprites visuales
        lines.append(f" ║     [🧍 TU POSICIÓN]{' ':22}[🛸 PLATAFORMA RIVAL]    ║")
        lines.append(f" ║       🧑‍🦱 (Entrenador){' ':24}👾 {opp_name:<16}  ║")
        lines.append(" ║" + " " * (width - 2) + "║")

        # HUD Jugador (Abajo a la izquierda)
        pl_info = f"🟢 {pl_name}{pl_mega}  Nv. {pl_lvl}{pl_status}"
        pl_hp_line = f"PS: [{pl_bar}] {pl_hp}/{pl_max}"
        lines.append(f" ║  {pl_info:<{width - 6}}  ║")
        lines.append(f" ║  {pl_hp_line:<{width - 6}}  ║")

        # Menú de comandos inferior
        lines.append(" ╠" + "═" * (width - 2) + "╣")
        menu_str = " ║  [1] ⚔️ LUCHAR       [2] 🎒 MOCHILA      [3] 🔄 POKÉMON      [4] 🏃 HUIR  ║"
        lines.append(menu_str)
        lines.append(" ╚" + "═" * (width - 2) + "╝")

        return lines
