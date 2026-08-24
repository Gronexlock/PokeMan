"""
Módulo del Administrador de Audio, Bandas Sonoras (BGM) y Efectos (SFX)
========================================================================
Proyecto: Pokémon: Ecos de Andara
Gestiona la ambientación sonora por biomas, temas orquestales de combate,
efectos de sonido tácticos y modulación de volumen.
"""

from typing import Dict, Any, Optional, List


class AudioManager:
    """Controlador de música ambiental y efectos sonoros del juego."""

    BGM_TRACKS = {
        # Exploración y Ciudades
        "bgm_villa_tranquimar":     {"title": "Melodía Costera Serena", "biomes": ["town", "coast"], "desc": "Guitarras acústicas y brisa marina de Villa Tranquimar."},
        "bgm_route_1":              {"title": "Caminos del Viento Andino", "biomes": ["route"], "desc": "Flautas andinas y percusión rítmica alegre."},
        "bgm_metropolis_solsticio": {"title": "Sinfonía Urbana de Solsticio", "biomes": ["city"], "desc": "Metales majestuosos y vida citadina vibrante."},
        "bgm_safari_zone":          {"title": "Santuario Ecológico", "biomes": ["safari"], "desc": "Sonidos de fauna silvestre e instrumentos de madera."},
        "bgm_resonant_crater":      {"title": "Ecos del Cráter Resonante", "biomes": ["crater", "ruins"], "desc": "Sintetizadores etéreos y misterio cósmico."},

        # Combates
        "bgm_wild_battle":          {"title": "Encuentro Silvestre en Andara", "type": "battle", "desc": "Tempo dinámico de encuentro silvestre."},
        "bgm_trainer_battle":       {"title": "Duelo de Entrenadores", "type": "battle", "desc": "Energía competitiva de ruta."},
        "bgm_rival_nahuel":         {"title": "Lazos de Rivalidad — Tema de Nahuel", "type": "battle", "desc": "Tema heroico y fraternal."},
        "bgm_gym_leader":           {"title": "Clímax de Gimnasio & Mega Evolución", "type": "battle", "desc": "Tensión máxima ante el líder de gimnasio."},
        "bgm_elite_four":           {"title": "Los Cuatro Pilares de Andara", "type": "battle", "desc": "Solemne desafío del Alto Mando."},
        "bgm_champion_renata":      {"title": "La Danza de los Vientos — Campeona Renata", "type": "battle", "desc": "Tema supremo de la Campeona y Mega-Garchomp."},
        "bgm_eternatus_cataclysm":  {"title": "El Vórtice Cósmico — Despertar de Eternatus", "type": "battle", "desc": "Cataclismo y supervivencia."},
        "bgm_zygarde_equilibrium":  {"title": "El Guardián del Orden — Zygarde 100%", "type": "battle", "desc": "Tema sagrado de la fuerza planetaria."}
    }

    SFX_EFFECTS = {
        "sfx_super_effective":      {"name": "Golpe Súper Eficaz", "sound": "💥 ¡IMPACTO DEMOLEDOR!"},
        "sfx_critical_hit":         {"name": "Golpe Crítico", "sound": "⚡ ¡CRÍTICO DIRECTO!"},
        "sfx_mega_ring_activation": {"name": "Activación del Mega-Aro", "sound": "✨ ¡RESONANCIA MEGA-ARO!"},
        "sfx_trainer_exclamation":  {"name": "Detección de Entrenador", "sound": "❗ ¡EXCLAMACIÓN!"},
        "sfx_ball_shake":           {"name": "Sacudida de Ball", "sound": "🔘 *Click... Click...*"},
        "sfx_ball_catch_success":   {"name": "Captura Exitosa", "sound": "🎉 ¡CHIN-CHIN-CHIN-POKÉMON ATRAPADO!"},
        "sfx_level_up":             {"name": "Subida de Nivel", "sound": "🎺 ¡FANFARRIA DE NIVEL!"},
        "sfx_heal_pokemon":         {"name": "Restauración en Centro", "sound": "🏥 ¡CURACIÓN COMPLETA!"}
    }

    def __init__(self):
        self.current_bgm: Optional[str] = None
        self.bgm_volume: float = 0.8
        self.sfx_volume: float = 1.0
        self.is_muted: bool = False
        self.last_sfx: Optional[str] = None

    def play_bgm(self, track_id: str) -> Dict[str, Any]:
        """Inicia o cambia la pista musical de fondo."""
        track = self.BGM_TRACKS.get(track_id)
        if not track:
            return {"playing": False, "error": f"Pista '{track_id}' no encontrada."}

        self.current_bgm = track_id
        return {
            "playing": True,
            "track_id": track_id,
            "title": track["title"],
            "desc": track["desc"],
            "volume": 0.0 if self.is_muted else self.bgm_volume
        }

    def play_sfx(self, sfx_id: str) -> Dict[str, Any]:
        """Dispara un efecto de sonido contextual."""
        effect = self.SFX_EFFECTS.get(sfx_id)
        if not effect:
            return {"played": False, "error": f"Efecto '{sfx_id}' no encontrado."}

        self.last_sfx = sfx_id
        return {
            "played": True,
            "sfx_id": sfx_id,
            "name": effect["name"],
            "sound": effect["sound"],
            "volume": 0.0 if self.is_muted else self.sfx_volume
        }

    def set_volume(self, bgm_volume: Optional[float] = None, sfx_volume: Optional[float] = None) -> None:
        """Modifica los volúmenes maestros de audio."""
        if bgm_volume is not None:
            self.bgm_volume = max(0.0, min(1.0, bgm_volume))
        if sfx_volume is not None:
            self.sfx_volume = max(0.0, min(1.0, sfx_volume))

    def toggle_mute(self) -> bool:
        """Alterna el estado de silencio global."""
        self.is_muted = not self.is_muted
        return self.is_muted
