"""
Módulo del Gestor de Encuentros Salvajes, Shinies y Reserva Safari
==================================================================
Proyecto: Pokémon: Ecos de Andara
Gestiona las tiradas de encuentros por bioma, filtrado por horario día/noche,
generación de Pokémon Shiny balanceados (1/1024 base y 1/341 con Amuleto Iris)
y la sesión de la Reserva Ecológica (Safari Tradicional).
"""
import sys
import os
import json
import random
from typing import Dict, Any, List, Optional, Tuple

# Asegurar que src esté en sys.path
_current_dir = os.path.dirname(os.path.abspath(__file__))
_src_dir = os.path.dirname(_current_dir)
if _src_dir not in sys.path:
    sys.path.insert(0, _src_dir)

from core.pokemon_generator import PokemonGenerator
from overworld.time_cycle import TimeCycleManager


class SafariSession:
    """Gestiona una sesión activa en la Reserva Ecológica de Andara (Safari Tradicional)."""

    def __init__(self, initial_balls: int = 30, entry_fee: int = 500):
        self.safari_balls = initial_balls
        self.entry_fee = entry_fee
        self.caught_pokemon: List[Dict[str, Any]] = []
        self.is_active = True
        self.encounters_played = 0

    def has_balls_remaining(self) -> bool:
        return self.safari_balls > 0

    def consume_ball(self) -> int:
        if self.safari_balls > 0:
            self.safari_balls -= 1
        if self.safari_balls == 0:
            self.is_active = False
        return self.safari_balls


class EncounterManager:
    """Administrador central de encuentros salvajes, shinies y mecánicas safari."""

    def __init__(self, data_dir: Optional[str] = None):
        if data_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            data_dir = os.path.join(base_dir, "data")

        self.data_dir = data_dir
        self.encounters_data: Dict[str, Any] = self._load_json("encounters.json")
        self.poke_gen = PokemonGenerator(data_dir=data_dir)
        self.time_mgr = TimeCycleManager()

        # Configuración de Shinies
        shiny_cfg = self.encounters_data.get("shiny_settings", {})
        self.shiny_base_rate = shiny_cfg.get("base_rate", 1024)
        self.shiny_charm_multiplier = shiny_cfg.get("shiny_charm_multiplier", 3.0)

    def _load_json(self, filename: str) -> Dict[str, Any]:
        filepath = os.path.join(self.data_dir, filename)
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8-sig") as f:
                return json.load(f)
        return {}

    def roll_shiny(self, has_shiny_charm: bool = False) -> bool:
        """
        Calcula si un Pokémon generado es Variocolor (Shiny).
        - Base: 1 en 1024 (~0.097%)
        - Con Amuleto Iris: 3 tiradas -> 1 en 341 (~0.293%)
        """
        rolls = int(self.shiny_charm_multiplier) if has_shiny_charm else 1
        for _ in range(rolls):
            if random.randint(1, self.shiny_base_rate) == 1:
                return True
        return False

    def check_step_encounter(
        self,
        zone_id: str,
        method: str = "grass",
        time_period: Optional[str] = None,
        has_shiny_charm: bool = False,
        is_running: bool = False
    ) -> Optional[Dict[str, Any]]:
        """
        Ejecuta el chequeo de encuentro al dar un paso sobre hierba alta o cueva.
        Si la tirada tiene éxito, genera y retorna la instancia del Pokémon salvaje.
        """
        zones = self.encounters_data.get("zones", {})
        zone_info = zones.get(zone_id)
        if not zone_info:
            return None

        # Tasa base de la zona (ej. 15%)
        base_rate = zone_info.get("encounter_rate", 15)
        # Correr aumenta ligeramente la tasa de perturbación de la hierba
        if is_running:
            base_rate = int(base_rate * 1.25)

        roll = random.randint(1, 100)
        if roll > base_rate:
            return None  # No hay encuentro en este paso

        return self.generate_wild_pokemon(zone_id, method, time_period, has_shiny_charm)

    def generate_wild_pokemon(
        self,
        zone_id: str,
        method: str = "grass",
        time_period: Optional[str] = None,
        has_shiny_charm: bool = False
    ) -> Optional[Dict[str, Any]]:
        """Genera un Pokémon salvaje acorde a la zona, método y horario."""
        zones = self.encounters_data.get("zones", {})
        zone_info = zones.get(zone_id)
        if not zone_info:
            return None

        methods_table = zone_info.get("methods", {})
        species_pool = methods_table.get(method, [])
        if not species_pool:
            # Buscar cualquier método disponible
            for m_key, m_list in methods_table.items():
                if m_list:
                    species_pool = m_list
                    break

        if not species_pool:
            return None

        # Filtrar por hora del día (all, day, night)
        curr_period = time_period or self.time_mgr.get_period()
        is_night = curr_period == TimeCycleManager.PERIOD_NIGHT

        valid_pool = []
        for entry in species_pool:
            t_req = entry.get("time", "all")
            if t_req == "all":
                valid_pool.append(entry)
            elif t_req == "night" and is_night:
                valid_pool.append(entry)
            elif t_req == "day" and not is_night:
                valid_pool.append(entry)

        if not valid_pool:
            valid_pool = species_pool  # Fallback si no hay específicos

        # Selección ponderada por weight
        total_weight = sum(e.get("weight", 10) for e in valid_pool)
        rnd_weight = random.uniform(0, total_weight)
        cumulative = 0.0
        chosen_entry = valid_pool[0]

        for entry in valid_pool:
            cumulative += entry.get("weight", 10)
            if rnd_weight <= cumulative:
                chosen_entry = entry
                break

        # Nivel aleatorio dentro del rango de la ruta
        min_lvl = chosen_entry.get("min_level", 5)
        max_lvl = chosen_entry.get("max_level", 5)
        level = random.randint(min_lvl, max_lvl)

        # Generar Pokémon con IVs perfectos (31) y EVs listos
        pokemon = self.poke_gen.generate_pokemon(
            species_id=chosen_entry["species_id"],
            level=level
        )

        # Tirada de Shiny
        is_shiny = self.roll_shiny(has_shiny_charm=has_shiny_charm)
        pokemon["is_shiny"] = is_shiny
        if is_shiny:
            pokemon["display_name"] = f"✨ {pokemon['species_name']} ✨"

        pokemon["encounter_zone"] = zone_id
        pokemon["is_safari"] = zone_info.get("is_safari", False)
        return pokemon

    # -------------------------------------------------------------
    # MECÁNICAS DE LA RESERVA SAFARI TRADICIONAL
    # -------------------------------------------------------------
    def start_safari_session(self, entry_fee: int = 500, balls: int = 30) -> SafariSession:
        """Inicia una nueva sesión en la Reserva Ecológica de Andara."""
        return SafariSession(initial_balls=balls, entry_fee=entry_fee)

    def execute_safari_action(
        self,
        session: SafariSession,
        pokemon: Dict[str, Any],
        action: str,  # 'BALL', 'BAIT', 'ROCK_MUD', 'RUN'
        safari_state: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Ejecuta una acción tradicional en la Reserva Safari.
        - BALL: Lanza Safari Ball -> Comprueba captura.
        - BAIT: Lanza Cebo -> Reduce probabilidad de huida del Pokémon.
        - ROCK_MUD: Lanza Lodo/Piedra -> Duplica el ratio de captura pero aumenta probabilidad de huida.
        - RUN: Huye del encuentro.
        """
        state = safari_state or {
            "bait_turns": 0,
            "angry_turns": 0
        }

        action = action.upper()
        events = []

        if action == "RUN":
            return {
                "outcome": "escaped",
                "events": ["¡Has huido del encuentro en la reserva sin problemas!"],
                "balls_left": session.safari_balls,
                "session_active": session.is_active
            }

        # 1. Lanzar Cebo (Bait)
        if action == "BAIT":
            state["bait_turns"] = random.randint(2, 4)
            state["angry_turns"] = 0
            events.append(f"¡Lanzaste Cebo hacia {pokemon['species_name']}! ¡{pokemon['species_name']} está comiendo plácidamente!")

        # 2. Tirar Lodo / Roca (Rock / Mud)
        elif action == "ROCK_MUD":
            state["angry_turns"] = random.randint(2, 4)
            state["bait_turns"] = 0
            events.append(f"¡Lanzaste un terrón de lodo a {pokemon['species_name']}! ¡{pokemon['species_name']} se enfadó!")

        # 3. Lanzar Safari Ball
        elif action == "BALL":
            if not session.has_balls_remaining():
                return {
                    "outcome": "no_balls",
                    "events": ["¡No te quedan Safari Balls!"],
                    "balls_left": 0,
                    "session_active": False
                }

            remaining_balls = session.consume_ball()
            events.append(f"¡Lanzaste una Safari Ball! (Te quedan {remaining_balls} Safari Balls)")

            # Cálculo de captura simplificado oficial Safari
            # Base catch rate estándar (1 a 255)
            base_catch_rate = 120  # Promedio moderado
            if pokemon.get("is_starter"):
                base_catch_rate = 85
            elif pokemon.get("is_pseudo"):
                base_catch_rate = 60

            # Modificadores de cebo y enfado
            if state.get("angry_turns", 0) > 0:
                base_catch_rate = int(base_catch_rate * 1.5)  # Más fácil de atrapar si está furioso
            elif state.get("bait_turns", 0) > 0:
                base_catch_rate = int(base_catch_rate * 0.75)  # Más difícil de atrapar mientras come

            catch_chance = min(95, max(15, base_catch_rate // 2))
            roll = random.randint(1, 100)

            if roll <= catch_chance:
                session.caught_pokemon.append(pokemon)
                events.append(f"¡Ya está! ¡{pokemon['species_name']} ha sido capturado!")
                return {
                    "outcome": "caught",
                    "events": events,
                    "balls_left": session.safari_balls,
                    "session_active": session.is_active,
                    "pokemon": pokemon
                }
            else:
                events.append(f"¡Oh no! ¡{pokemon['species_name']} se liberó de la Safari Ball!")

        # Reducir contadores de estado
        if state.get("bait_turns", 0) > 0:
            state["bait_turns"] -= 1
        if state.get("angry_turns", 0) > 0:
            state["angry_turns"] -= 1

        # Chequeo de huida del Pokémon salvaje
        base_flee_rate = 25  # 25% base de huida en safari
        if state.get("angry_turns", 0) > 0:
            base_flee_rate = 50  # Furioso -> 50% de probabilidad de huir
        elif state.get("bait_turns", 0) > 0:
            base_flee_rate = 12  # Comiendo -> solo 12% de probabilidad de huir

        flee_roll = random.randint(1, 100)
        if flee_roll <= base_flee_rate:
            events.append(f"¡{pokemon['species_name']} ha huido!")
            return {
                "outcome": "fled",
                "events": events,
                "balls_left": session.safari_balls,
                "session_active": session.is_active
            }

        events.append(f"¡{pokemon['species_name']} está observando con curiosidad!")
        return {
            "outcome": "stayed",
            "events": events,
            "balls_left": session.safari_balls,
            "session_active": session.is_active,
            "safari_state": state
        }
