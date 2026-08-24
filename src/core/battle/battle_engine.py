"""
Módulo del Motor Principal de Batalla por Turnos (FSM)
======================================================
Proyecto: Pokémon: Ecos de Andara
Gestiona el flujo completo del combate por turnos, orden de prioridad,
velocidad, ejecución de movimientos, consumo de PP, cambios, objetos,
captura con Poké Balls en combates salvajes, estados alterados avanzados,
debilitamiento, experiencia ganada y aprendizaje de movimientos al subir de nivel.
"""

import json
import os
import random
from typing import Dict, Any, List, Optional, Tuple

try:
    from core.battle.damage_calculator import DamageCalculator
    from core.battle.mega_engine import MegaEvolutionEngine
    from core.battle.battle_ai import BattleAI
    from core.battle.catch_calculator import CatchCalculator
    from core.pokemon_generator import PokemonGenerator
except ImportError:
    from .damage_calculator import DamageCalculator
    from .mega_engine import MegaEvolutionEngine
    from .battle_ai import BattleAI
    from .catch_calculator import CatchCalculator
    from ..pokemon_generator import PokemonGenerator


class BattleEngine:
    """Máquina de estados finita y gestor de combate por turnos 1v1."""

    def __init__(
        self,
        player_party: List[Dict[str, Any]],
        opponent_party: List[Dict[str, Any]],
        is_trainer_battle: bool = True,
        opponent_name: str = "Rival Nahuel",
        ai_tier: str = BattleAI.TIER_RIVAL_BOSS,
        player_has_mega_ring: bool = True,
        opponent_has_mega_ring: bool = False,
        data_dir: Optional[str] = None
    ):
        if data_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            data_dir = os.path.join(base_dir, "data")

        self.data_dir = data_dir
        self.calc = DamageCalculator(data_dir=data_dir)
        self.mega_engine = MegaEvolutionEngine(data_dir=data_dir)
        self.ai = BattleAI(data_dir=data_dir)
        self.poke_gen = PokemonGenerator(data_dir=data_dir)

        # Base de datos de Pokédex para learnsets
        self.pokedex_db = self._load_json("pokedex.json")

        # Equipos
        self.player_party = player_party
        self.opponent_party = opponent_party
        self.is_trainer_battle = is_trainer_battle
        self.opponent_name = opponent_name
        self.ai_tier = ai_tier

        # Flags de Mega-Aro
        self.player_has_mega_ring = player_has_mega_ring
        self.opponent_has_mega_ring = opponent_has_mega_ring
        self.player_used_mega = False
        self.opponent_used_mega = False

        # Estado activo
        self.player_active_idx = self._get_first_alive_idx(self.player_party)
        self.opponent_active_idx = self._get_first_alive_idx(self.opponent_party)

        # Entorno, contadores y captura
        self.weather = "clear"
        self.turn_number = 0
        self.is_finished = False
        self.winner = None  # 'player', 'opponent', or 'escaped'
        self.caught_pokemon: Optional[Dict[str, Any]] = None
        self.battle_log: List[str] = []

    def _load_json(self, filename: str) -> Dict[str, Any]:
        filepath = os.path.join(self.data_dir, filename)
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}

    def _get_first_alive_idx(self, party: List[Dict[str, Any]]) -> int:
        for idx, p in enumerate(party):
            if p.get("current_hp", 0) > 0:
                return idx
        return 0

    @property
    def player_active(self) -> Dict[str, Any]:
        return self.player_party[self.player_active_idx]

    @property
    def opponent_active(self) -> Dict[str, Any]:
        return self.opponent_party[self.opponent_active_idx]

    def execute_round(self, player_action: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ejecuta una ronda completa de combate en base a la acción del jugador.
        Soporta: FIGHT, SWITCH, BAG (Cura y Captura con Balls), RUN.
        """
        if self.is_finished:
            return {"finished": True, "winner": self.winner, "events": ["El combate ya ha concluido."]}

        self.turn_number += 1
        round_events: List[str] = [f"--- Turno {self.turn_number} ---"]

        # 0. Chequeo de Intento de Captura con Poké Ball
        if player_action.get("action_type") == "BALL":
            if self.is_trainer_battle:
                round_events.append("¡No puedes robar el Pokémon de otro entrenador!")
            else:
                ball_id = player_action.get("ball_id", "pokeball")
                is_night = player_action.get("is_night", False)
                catch_res = CatchCalculator.calculate_catch(
                    target_pokemon=self.opponent_active,
                    ball_id=ball_id,
                    turn_number=self.turn_number,
                    is_night_or_cave=is_night
                )
                round_events.append(f"¡Lanzaste una {ball_id.capitalize()}!")
                round_events.append(catch_res["message"])

                if catch_res["caught"]:
                    self.caught_pokemon = self.opponent_active
                    self.is_finished = True
                    self.winner = "player"
                    self.battle_log.extend(round_events)
                    return {
                        "finished": True,
                        "winner": "player",
                        "caught": True,
                        "caught_pokemon": self.caught_pokemon,
                        "events": round_events
                    }

        # 1. Obtener acción del oponente (IA)
        opponent_action = self.ai.choose_action(
            ai_pokemon=self.opponent_active,
            player_pokemon=self.player_active,
            tier=self.ai_tier,
            ai_party=self.opponent_party,
            can_mega_evolve=(self.opponent_has_mega_ring and not self.opponent_used_mega)
        )

        # 2. Determinar orden de turnos
        turn_order = self._determine_turn_order(player_action, opponent_action)

        # 3. Procesar Mega Evolución si se solicitó
        if player_action.get("trigger_mega") and self.player_has_mega_ring and not self.player_used_mega:
            mega_res = self.mega_engine.mega_evolve(self.player_active)
            if mega_res["success"]:
                self.player_used_mega = True
                round_events.append(f"✨ ¡El Mega-Aro reacciona! ¡{mega_res['message']}!")

        if opponent_action.get("trigger_mega") and self.opponent_has_mega_ring and not self.opponent_used_mega:
            mega_res = self.mega_engine.mega_evolve(self.opponent_active)
            if mega_res["success"]:
                self.opponent_used_mega = True
                round_events.append(f"⚡ ¡El rival activa su Mega-Aro! ¡{mega_res['message']}!")

        # 4. Ejecutar acciones en orden
        for side, action in turn_order:
            if self.is_finished:
                break

            actor = self.player_active if side == "player" else self.opponent_active
            target = self.opponent_active if side == "player" else self.player_active

            # Comprobar si el atacante sigue con vida
            if actor.get("current_hp", 0) <= 0:
                continue

            action_type = action.get("action_type", "FIGHT")

            if action_type == "RUN":
                if self.is_trainer_battle:
                    round_events.append("¡No puedes huir de un combate contra un entrenador!")
                else:
                    self.is_finished = True
                    self.winner = "escaped"
                    round_events.append("¡Has escapado del combate sin problemas!")
                    break

            elif action_type == "SWITCH":
                new_idx = action.get("target_index", 0)
                if side == "player":
                    self.player_active_idx = new_idx
                    round_events.append(f"¡Adelante, {self.player_active.get('species_name')}!")
                else:
                    self.opponent_active_idx = new_idx
                    round_events.append(f"¡{self.opponent_name} envió a {self.opponent_active.get('species_name')}!")

            elif action_type == "BAG":
                item_id = action.get("item_id", "potion")
                heal_msg = self._apply_healing_item(side, item_id, action.get("target_index"))
                round_events.append(heal_msg)

            elif action_type == "FIGHT":
                # Chequeo de estados alterados (Sueño, Parálisis, Congelamiento)
                can_move, status_msg = self._can_pokemon_move(actor)
                if status_msg:
                    round_events.append(status_msg)
                if not can_move:
                    continue

                move_id = action.get("move_id")
                move_events = self._execute_move(side, actor, target, move_id)
                round_events.extend(move_events)

                # Comprobar si el defensor se debilitó
                if target.get("current_hp", 0) <= 0:
                    def_name = target.get("display_name", target.get("species_name"))
                    round_events.append(f"¡{def_name} se debilitó!")

                    if side == "player":
                        exp_events = self._award_exp(self.player_active, self.opponent_active)
                        round_events.extend(exp_events)

                        next_opp_idx = self._get_next_alive_pokemon(self.opponent_party)
                        if next_opp_idx is not None:
                            self.opponent_active_idx = next_opp_idx
                            next_name = self.opponent_active.get("species_name")
                            round_events.append(f"¡{self.opponent_name} envía a {next_name}!")
                        else:
                            self.is_finished = True
                            self.winner = "player"
                            round_events.append(f"¡Has derrotado a {self.opponent_name}!")
                    else:
                        next_pl_idx = self._get_next_alive_pokemon(self.player_party)
                        if next_pl_idx is not None:
                            self.player_active_idx = next_pl_idx
                            next_name = self.player_active.get("species_name")
                            round_events.append(f"¡Enviaste a {next_name}!")
                        else:
                            self.is_finished = True
                            self.winner = "opponent"
                            round_events.append("¡Te has quedado sin Pokémon utilizables! ¡Has sido derrotado!")

        # 5. Efectos de Fin de Turno (Quemadura, Tóxico acumulativo, etc.)
        if not self.is_finished:
            end_events = self._apply_end_of_turn_effects()
            round_events.extend(end_events)

        self.battle_log.extend(round_events)
        return {
            "finished": self.is_finished,
            "winner": self.winner,
            "turn": self.turn_number,
            "events": round_events,
            "player_pokemon": self.player_active,
            "opponent_pokemon": self.opponent_active
        }

    def _can_pokemon_move(self, poke: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """Verifica si el Pokémon puede moverse considerando sus estados alterados."""
        status = poke.get("status")
        pname = poke.get("display_name", poke.get("species_name"))

        if not status:
            return True, None

        if status == "sleep":
            sleep_turns = poke.get("sleep_turns", 2)
            if sleep_turns <= 1:
                poke["status"] = None
                poke["sleep_turns"] = 0
                return True, f"¡{pname} se ha despertado!"
            else:
                poke["sleep_turns"] = sleep_turns - 1
                return False, f"¡{pname} está profundamente dormido!"

        elif status == "freeze":
            # 20% probabilidad de descongelarse por turno
            if random.random() < 0.20:
                poke["status"] = None
                return True, f"¡{pname} se ha descongelado!"
            else:
                return False, f"¡{pname} está congelado y no puede moverse!"

        elif status == "paralysis":
            # 25% probabilidad de quedar inmovilizado en el turno
            if random.random() < 0.25:
                return False, f"¡{pname} está paralizado y no puede moverse!"

        return True, None

    def _determine_turn_order(self, player_action: Dict[str, Any], opponent_action: Dict[str, Any]) -> List[Tuple[str, Dict[str, Any]]]:
        """Calcula el orden de acción según la prioridad del movimiento y la estadística de velocidad."""
        p_type = player_action.get("action_type", "FIGHT")
        o_type = opponent_action.get("action_type", "FIGHT")

        # Switches, Balls y Bag tienen máxima prioridad (+6)
        p_prio = 6 if p_type in ["SWITCH", "BAG", "BALL", "RUN"] else self._get_move_priority(player_action.get("move_id"))
        o_prio = 6 if o_type in ["SWITCH", "BAG"] else self._get_move_priority(opponent_action.get("move_id"))

        if p_prio > o_prio:
            return [("player", player_action), ("opponent", opponent_action)]
        elif o_prio > p_prio:
            return [("opponent", opponent_action), ("player", player_action)]

        # Misma prioridad -> Comparar Velocidad efectiva
        p_spe = self.player_active.get("stats", {}).get("speed", 50)
        o_spe = self.opponent_active.get("stats", {}).get("speed", 50)

        if self.player_active.get("status") == "paralysis":
            p_spe = int(p_spe * 0.5)
        if self.opponent_active.get("status") == "paralysis":
            o_spe = int(o_spe * 0.5)

        if p_spe > o_spe:
            return [("player", player_action), ("opponent", opponent_action)]
        elif o_spe > p_spe:
            return [("opponent", opponent_action), ("player", player_action)]
        else:
            return [("player", player_action), ("opponent", opponent_action)] if random.random() < 0.5 else [("opponent", opponent_action), ("player", player_action)]

    def _get_move_priority(self, move_id: Optional[str]) -> int:
        if not move_id:
            return 0
        move_data = self.calc.moves_data.get(move_id.lower(), {})
        return move_data.get("priority", 0)

    def _execute_move(
        self,
        side: str,
        attacker: Dict[str, Any],
        defender: Dict[str, Any],
        move_id: str
    ) -> List[str]:
        events = []
        atk_name = attacker.get("display_name", attacker.get("species_name"))
        def_name = defender.get("display_name", defender.get("species_name"))

        move_data = self.calc.moves_data.get(move_id.lower())
        if not move_data:
            events.append(f"{atk_name} intentó usar {move_id}, ¡pero el movimiento no está disponible!")
            return events

        disp_move = move_data.get("display_name", move_id.capitalize())
        if side == "player":
            events.append(f"¡{atk_name} usa {disp_move}!")
        else:
            events.append(f"¡{atk_name} enemigo usa {disp_move}!")

        # Chequeo de Precisión
        accuracy = move_data.get("accuracy")
        if accuracy is not None and accuracy < 100:
            if random.randint(1, 100) > accuracy:
                events.append(f"¡El ataque de {atk_name} falló!")
                return events

        # Movimientos de Estado
        if move_data.get("damage_class") == "status":
            applies_status = move_data.get("applies_status")
            if applies_status and not defender.get("status"):
                defender["status"] = applies_status
                if applies_status == "toxic":
                    defender["toxic_counter"] = 1
                elif applies_status == "sleep":
                    defender["sleep_turns"] = random.randint(2, 3)
                events.append(f"¡{def_name} ahora sufre {applies_status}!")
            else:
                events.append(f"¡{disp_move} alteró las condiciones del combate!")
            return events

        # Cálculo de Daño Oficial
        calc_result = self.calc.calculate_damage(
            attacker=attacker,
            defender=defender,
            move_id_or_data=move_data,
            weather=self.weather
        )

        damage = calc_result["damage"]
        defender["current_hp"] = max(0, defender.get("current_hp", 0) - damage)

        if calc_result["is_critical"]:
            events.append("¡Un golpe crítico!")

        eff_text = calc_result["effectiveness_text"]
        if eff_text == "super_effective":
            events.append("¡Es súper eficaz!")
        elif eff_text == "not_very_effective":
            events.append("No es muy eficaz...")
        elif eff_text == "immune":
            events.append(f"No afecta a {def_name}...")

        events.append(f"{def_name} perdió {damage} PS. ({defender['current_hp']}/{defender['max_hp']} PS restantes)")
        return events

    def _apply_healing_item(self, side: str, item_id: str, target_idx: Optional[int] = None) -> str:
        party = self.player_party if side == "player" else self.opponent_party
        target_poke = party[target_idx if target_idx is not None else (self.player_active_idx if side == "player" else self.opponent_active_idx)]

        poke_name = target_poke.get("display_name", target_poke.get("species_name"))
        heal_amounts = {
            "potion": 20,
            "superpotion": 50,
            "super_potion": 50,
            "hyperpotion": 200,
            "hyper_potion": 200,
            "maxpotion": 9999,
            "max_potion": 9999
        }

        amount = heal_amounts.get(item_id, 20)
        old_hp = target_poke.get("current_hp", 0)
        max_hp = target_poke.get("max_hp", 100)
        new_hp = min(max_hp, old_hp + amount)
        target_poke["current_hp"] = new_hp
        restored = new_hp - old_hp

        return f"¡Se usó {item_id.replace('_', ' ').capitalize()} en {poke_name}! Se han restaurado {restored} PS ({new_hp}/{max_hp} PS)."

    def _apply_end_of_turn_effects(self) -> List[str]:
        events = []
        for side, poke in [("Jugador", self.player_active), ("Oponente", self.opponent_active)]:
            if poke.get("current_hp", 0) <= 0:
                continue
            status = poke.get("status")
            pname = poke.get("display_name", poke.get("species_name"))

            if status == "burn":
                burn_dmg = max(1, poke.get("max_hp", 100) // 16)
                poke["current_hp"] = max(0, poke["current_hp"] - burn_dmg)
                events.append(f"¡{pname} sufre {burn_dmg} de daño por sus quemaduras!")
            elif status == "poison":
                pois_dmg = max(1, poke.get("max_hp", 100) // 8)
                poke["current_hp"] = max(0, poke["current_hp"] - pois_dmg)
                events.append(f"¡{pname} sufre {pois_dmg} de daño por el veneno!")
            elif status == "toxic":
                count = poke.get("toxic_counter", 1)
                tox_dmg = max(1, (poke.get("max_hp", 100) * count) // 16)
                poke["current_hp"] = max(0, poke["current_hp"] - tox_dmg)
                poke["toxic_counter"] = count + 1
                events.append(f"¡{pname} sufre {tox_dmg} de daño creciente por el veneno grave (Tóxico)!")
        return events

    def _award_exp(self, winner_poke: Dict[str, Any], defeated_poke: Dict[str, Any]) -> List[str]:
        events = []
        def_lvl = defeated_poke.get("level", 5)
        is_trainer_mult = 1.5 if self.is_trainer_battle else 1.0
        exp_gained = int(((100 * def_lvl) / 7.0) * is_trainer_mult)
        exp_gained = max(10, exp_gained)

        pname = winner_poke.get("display_name", winner_poke.get("species_name"))
        events.append(f"¡{pname} ganó {exp_gained} puntos de experiencia!")

        winner_poke["current_exp"] = winner_poke.get("current_exp", 0) + exp_gained
        exp_needed = winner_poke.get("level", 5) ** 3 // 5 + 30

        if winner_poke["current_exp"] >= exp_needed:
            winner_poke["level"] += 1
            winner_poke["current_exp"] = 0
            self.poke_gen.recalculate_stats(winner_poke)
            events.append(f"¡Felicidades! ¡{pname} ha subido al Nivel {winner_poke['level']}!")

            # Comprobar aprendizaje de nuevos movimientos por nivel
            species_id_str = str(winner_poke.get("species_id"))
            p_data = self.pokedex_db.get(species_id_str, {})
            learnset = p_data.get("learnset", [])

            for entry in learnset:
                if entry.get("level") == winner_poke["level"]:
                    new_move_id = entry.get("move")
                    current_moves = winner_poke.setdefault("moves", [])
                    move_info = self.calc.moves_data.get(new_move_id, {})
                    disp_m = move_info.get("display_name", new_move_id)

                    if new_move_id not in current_moves:
                        if len(current_moves) < 4:
                            current_moves.append(new_move_id)
                            events.append(f"✨ ¡{pname} aprendió {disp_m} automáticamente!")
                        else:
                            events.append(f"💡 ¡{pname} desea aprender {disp_m}, pero ya conoce 4 movimientos!")

        return events

    def _get_next_alive_pokemon(self, party: List[Dict[str, Any]]) -> Optional[int]:
        for idx, poke in enumerate(party):
            if poke.get("current_hp", 0) > 0:
                return idx
        return None
