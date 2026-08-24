"""
Módulo de Inteligencia Artificial Táctica para Combate
======================================================
Proyecto: Pokémon: Ecos de Andara
Implementa algoritmos de toma de decisiones para Pokémon salvajes, entrenadores
ordinarios y líderes/rivales de élite (Nahuel, Alto Mando y Campeón).
"""

import random
from typing import Dict, Any, List, Optional, Tuple
from .damage_calculator import DamageCalculator
from .mega_engine import MegaEvolutionEngine


class BattleAI:
    """Toma de decisiones tácticas para oponentes controlados por la máquina."""

    # Niveles de dificultad de la IA
    TIER_WILD = "wild"
    TIER_TRAINER = "trainer"
    TIER_RIVAL_BOSS = "rival_boss"

    def __init__(self, data_dir: Optional[str] = None):
        self.calc = DamageCalculator(data_dir=data_dir)
        self.mega_engine = MegaEvolutionEngine(data_dir=data_dir)

    def choose_action(
        self,
        ai_pokemon: Dict[str, Any],
        opponent_pokemon: Dict[str, Any],
        ai_party: Optional[List[Dict[str, Any]]] = None,
        ai_bag: Optional[Dict[str, int]] = None,
        tier: str = TIER_TRAINER,
        has_mega_ring: bool = False,
        already_mega_evolved: bool = False
    ) -> Dict[str, Any]:
        """
        Selecciona la mejor acción para el oponente en el turno actual.
        Retorna un diccionario estructurado:
        - action_type: 'FIGHT', 'BAG', 'SWITCH'
        - move_index: int (0-3 si 'FIGHT')
        - move_id: str
        - mega_evolve: bool
        - item_id: str (si 'BAG')
        - switch_index: int (si 'SWITCH')
        """
        # 1. Comprobar si puede y debe Megaevolucionar (Rival/Líderes)
        wants_mega = False
        if tier == self.TIER_RIVAL_BOSS and has_mega_ring and not already_mega_evolved:
            can_mega, mega_data, _ = self.mega_engine.can_mega_evolve(
                ai_pokemon,
                has_mega_ring=True,
                already_mega_evolved_this_battle=False
            )
            if can_mega:
                wants_mega = True

        # 2. Comprobar uso de objetos de curación en modo Jefe si la salud es crítica (< 25%)
        if tier == self.TIER_RIVAL_BOSS and ai_bag:
            curr_hp = ai_pokemon.get("current_hp", 0)
            max_hp = ai_pokemon.get("max_hp", 1)
            hp_ratio = curr_hp / max_hp

            if hp_ratio <= 0.25:
                # Buscar pociones disponibles
                for pot_id in ["hyper_potion", "super_potion", "potion", "sitrus_berry"]:
                    if ai_bag.get(pot_id, 0) > 0:
                        return {
                            "action_type": "BAG",
                            "item_id": pot_id,
                            "target": "self",
                            "mega_evolve": False
                        }

        # 3. Selección de Movimiento
        moves = ai_pokemon.get("moves", [])
        if not moves:
            # Combate por defecto Forcejeo / Placaje
            return {
                "action_type": "FIGHT",
                "move_index": 0,
                "move_id": "tackle",
                "mega_evolve": wants_mega
            }

        # --- A. Lógica para Pokémon Salvajes (WILD) ---
        if tier == self.TIER_WILD:
            chosen_idx = random.randint(0, len(moves) - 1)
            return {
                "action_type": "FIGHT",
                "move_index": chosen_idx,
                "move_id": moves[chosen_idx],
                "mega_evolve": False
            }

        # --- B. Lógica para Entrenadores y Jefes (TRAINER & RIVAL_BOSS) ---
        scored_moves = []
        opp_hp = opponent_pokemon.get("current_hp", 1)

        for idx, move_id in enumerate(moves):
            move_data = self.calc.moves_data.get(move_id.lower())
            if not move_data:
                continue

            # Movimientos de estado
            if move_data.get("damage_class") == "status":
                score = 30.0
                # Valorar movimientos de boost / setup en turnos tempranos
                if tier == self.TIER_RIVAL_BOSS and ai_pokemon.get("current_hp", 0) > (ai_pokemon.get("max_hp", 1) * 0.7):
                    score = 45.0
                scored_moves.append((score, idx, move_id, False))
                continue

            # Calcular estimación de daño
            calc_result = self.calc.calculate_damage(
                attacker=ai_pokemon,
                defender=opponent_pokemon,
                move_id_or_data=move_data,
                force_critical=False,
                force_random_factor=0.92  # Estimación de daño medio-alto
            )

            est_damage = calc_result.get("damage", 0)
            eff = calc_result.get("type_effectiveness", 1.0)
            priority = move_data.get("priority", 0)

            # Puntuación base según daño porcentual
            score = float(est_damage)

            # Inmunidad total -> puntuación nula
            if eff == 0.0:
                score = 0.0

            # Si el movimiento es capaz de debilitar al rival de este golpe (KO)
            is_ko = (est_damage >= opp_hp and eff > 0.0)
            if is_ko:
                score += 1000.0
                # Si tiene prioridad para asegurar el KO antes de recibir daño
                if priority > 0:
                    score += 200.0

            # Bonus por súper eficacia
            if eff >= 2.0:
                score += 40.0

            scored_moves.append((score, idx, move_id, is_ko))

        if not scored_moves:
            return {
                "action_type": "FIGHT",
                "move_index": 0,
                "move_id": moves[0],
                "mega_evolve": wants_mega
            }

        # Ordenar movimientos por mayor puntuación
        scored_moves.sort(key=lambda x: x[0], reverse=True)

        # En dificultad RIVAL_BOSS, casi siempre elige el mejor movimiento (95% óptimo, 5% variedad)
        if tier == self.TIER_RIVAL_BOSS:
            chosen = scored_moves[0]
        else:
            # En dificultad TRAINER, elige entre los dos mejores
            top_choices = scored_moves[:min(2, len(scored_moves))]
            chosen = random.choice(top_choices)

        return {
            "action_type": "FIGHT",
            "move_index": chosen[1],
            "move_id": chosen[2],
            "estimated_ko": chosen[3],
            "mega_evolve": wants_mega
        }
