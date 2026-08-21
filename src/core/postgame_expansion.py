"""
Módulo de Expansión Postgame: Isla Resonancia
==============================================
Proyecto: Pokémon: Ecos de Andara
Gestiona la emergencia de Isla Resonancia tras la resolución de Eternatus,
el desbloqueo de la Pokédex Expandida de Andara (+100 especies exclusivas sin duplicados)
y la regla de que los Legendarios NO son capturables.
"""

from typing import Dict, Any, List, Optional, Tuple


class PostgameExpansionManager:
    """Gestiona el contenido de Isla Resonancia y la Pokédex Expandida."""

    # Especies exclusivas de Isla Resonancia (0% de solapamiento con Andara Regional)
    SUBZONES = {
        "costa_prismatica": {
            "name": "Costa Prismática & Arrecife Abisal",
            "level_range": (60, 65),
            "wild_encounters": [
                {"species": "Lapras", "id": 131, "types": ["water", "ice"], "rate": 0.15},
                {"species": "Relicanth", "id": 369, "types": ["water", "rock"], "rate": 0.15},
                {"species": "Dhelmise", "id": 781, "types": ["ghost", "grass"], "rate": 0.10},
                {"species": "Bruxish", "id": 779, "types": ["water", "psychic"], "rate": 0.10},
                {"species": "Cramorant", "id": 845, "types": ["flying", "water"], "rate": 0.15},
                {"species": "Skrelp", "id": 690, "types": ["poison", "water"], "rate": 0.15},
                {"species": "Clauncher", "id": 692, "types": ["water"], "rate": 0.10},
                {"species": "Finizen", "id": 963, "types": ["water"], "rate": 0.10}
            ]
        },
        "canon_fosiles": {
            "name": "Cañón de Fósiles Primigenios",
            "level_range": (63, 68),
            "wild_encounters": [
                {"species": "Tyrantrum", "id": 697, "types": ["rock", "dragon"], "rate": 0.15},
                {"species": "Aurorus", "id": 699, "types": ["rock", "ice"], "rate": 0.15},
                {"species": "Rampardos", "id": 409, "types": ["rock"], "rate": 0.15},
                {"species": "Bastiodon", "id": 411, "types": ["rock", "steel"], "rate": 0.15},
                {"species": "Archeops", "id": 567, "types": ["rock", "flying"], "rate": 0.15},
                {"species": "Carracosta", "id": 565, "types": ["water", "rock"], "rate": 0.15},
                {"species": "Aerodactyl", "id": 142, "types": ["rock", "flying"], "rate": 0.10}
            ]
        },
        "jungla_brecha": {
            "name": "Jungla de la Brecha Temporal",
            "level_range": (65, 70),
            "wild_encounters": [
                {"species": "Kangaskhan", "id": 115, "types": ["normal"], "rate": 0.15},
                {"species": "Altaria", "id": 334, "types": ["dragon", "flying"], "rate": 0.15},
                {"species": "Banette", "id": 354, "types": ["ghost"], "rate": 0.15},
                {"species": "Manectric", "id": 310, "types": ["electric"], "rate": 0.15},
                {"species": "Audino", "id": 531, "types": ["normal"], "rate": 0.10},
                {"species": "Tsareena", "id": 763, "types": ["grass"], "rate": 0.15},
                {"species": "Lurantis", "id": 754, "types": ["grass"], "rate": 0.15}
            ]
        },
        "crater_cosmico": {
            "name": "Cráter Cósmico & Picos de la Falla",
            "level_range": (68, 73),
            "wild_encounters": [
                {"species": "Haxorus", "id": 612, "types": ["dragon"], "rate": 0.15},
                {"species": "Goodra", "id": 706, "types": ["dragon"], "rate": 0.15},
                {"species": "Baxcalibur", "id": 998, "types": ["dragon", "ice"], "rate": 0.15},
                {"species": "Kingambit", "id": 983, "types": ["dark", "steel"], "rate": 0.15},
                {"species": "Tinkaton", "id": 959, "types": ["fairy", "steel"], "rate": 0.15},
                {"species": "Zoroark (Hisui)", "id": 10237, "types": ["normal", "ghost"], "rate": 0.15},
                {"species": "Sneasler", "id": 903, "types": ["fighting", "poison"], "rate": 0.10}
            ]
        },
        "santuario_equilibrio": {
            "name": "Santuario del Equilibrio (Combate Sagrado con Zygarde 100%)",
            "level_range": (85, 85),
            "boss_encounter": {
                "species": "Zygarde (Forma Completa)",
                "id": 718,
                "types": ["dragon", "ground"],
                "level": 85,
                "is_capturable": False,
                "reward_item": "emblema_del_equilibrio"
            }
        }
    }

    # Registro de especies legendarias de la historia no capturables
    UNCAPTURABLE_LEGENDARIES = {"eternatus", "zygarde"}

    def __init__(self, eternatus_defeated: bool = False):
        self.eternatus_defeated = eternatus_defeated
        self.expanded_dex_unlocked = eternatus_defeated

    def attempt_capture(self, species_name: str) -> Tuple[bool, str]:
        """
        Verifica si la especie puede ser capturada con una Poké Ball.
        Los Pokémon legendarios de la trama bloquean cualquier intento de captura.
        """
        if species_name.lower() in self.UNCAPTURABLE_LEGENDARIES:
            return False, "¡La inmensa energía de esta entidad divina rechaza las Poké Balls!"
        return True, "Intento de captura procesado con éxito."

    def unlock_island(self) -> Dict[str, Any]:
        """Desbloquea Isla Resonancia tras la resolución del clímax de Eternatus."""
        self.eternatus_defeated = True
        self.expanded_dex_unlocked = True
        return {
            "status": "unlocked",
            "island_name": "Isla Resonancia (El Archipiélago del Cataclismo)",
            "pokedex_mode": "Pokédex Expandida de Andara (+100 Especies Nuevas)",
            "ferry_origin": "Puerto Coralina / Metrópolis Solsticio",
            "message": (
                "¡El Profesor Ceibo te ha otorgado el Billete de Ferry Especial! "
                "La energía cósmica de Eternatus ha creado Isla Resonancia en el océano meridional. "
                "Tu Pokédex ha sido actualizada con el catálogo de especies exclusivas de la isla."
            )
        }

    def get_subzone_data(self, subzone_key: str) -> Optional[Dict[str, Any]]:
        """Retorna la información de encuentros y nivel de una subzona de Isla Resonancia."""
        if not self.eternatus_defeated:
            return None
        return self.SUBZONES.get(subzone_key)
