"""
Módulo del Motor de Diálogos, Mugshots y Decisiones Narrativas
==============================================================
Proyecto: Pokémon: Ecos de Andara
Gestiona la progresión de conversaciones, árboles de decisiones del jugador,
expresiones emocionales (mugshots) y la sincronización con los story_flags.
"""

import json
import os
from typing import Dict, Any, List, Optional, Tuple


class DialogueManager:
    """Administrador central del sistema de diálogos y cinemáticas."""

    # Catálogo de retratos y emociones para mugshots
    PORTRAIT_CATALOG = {
        "ceibo_neutral":       {"character": "Prof. Ceibo", "emotion": "Neutral", "icon": "🌿"},
        "ceibo_enthusiastic":   {"character": "Prof. Ceibo", "emotion": "Entusiasta", "icon": "✨"},
        "ceibo_wise":          {"character": "Prof. Ceibo", "emotion": "Sabio", "icon": "📖"},
        "ceibo_explanatory":   {"character": "Prof. Ceibo", "emotion": "Explicativo", "icon": "💡"},
        
        "nahuel_excited":      {"character": "Nahuel", "emotion": "Alegre / Emocionado", "icon": "😄"},
        "nahuel_smug":         {"character": "Nahuel", "emotion": "Confiado", "icon": "😏"},
        "nahuel_challenging":  {"character": "Nahuel", "emotion": "Desafiante", "icon": "⚔️"},
        "nahuel_curious":      {"character": "Nahuel", "emotion": "Curioso", "icon": "👀"},
        "nahuel_gentle":       {"character": "Nahuel", "emotion": "Empático / Calmo", "icon": "🤝"},
        "nahuel_determined":   {"character": "Nahuel", "emotion": "Determinado", "icon": "🔥"},
        "nahuel_injured":      {"character": "Nahuel", "emotion": "Afligido / Herido", "icon": "🩹"},
        
        "growlithe_happy":     {"character": "Growlithe", "emotion": "Leal / Feliz", "icon": "🐕"},
        "refuge_worker":       {"character": "Encargada", "emotion": "Amable", "icon": "🏥"},
        
        "renata_serene":       {"character": "Campeona Renata", "emotion": "Serena", "icon": "🏔️"},
        "renata_imposing":     {"character": "Campeona Renata", "emotion": "Imponente", "icon": "🦅"},
        "renata_serious":      {"character": "Campeona Renata", "emotion": "Alerta / Seria", "icon": "⚡"},
        "renata_wise":         {"character": "Campeona Renata", "emotion": "Protectora", "icon": "🛡️"},
        
        "clara_alarmed":       {"character": "Dra. Clara", "emotion": "Alarmada", "icon": "🔬"},
        "alister_cold":        {"character": "Alister", "emotion": "Frío / Calculador", "icon": "❄️"},
        "alister_fanatic":     {"character": "Alister", "emotion": "Radical / Fanático", "icon": "🌑"}
    }

    def __init__(self, data_dir: Optional[str] = None):
        if data_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            data_dir = os.path.join(base_dir, "data")

        self.data_dir = data_dir
        self.dialogues_data: Dict[str, Any] = self._load_json("dialogues.json")
        self.active_dialogue: Optional[Dict[str, Any]] = None
        self.current_node: Optional[Dict[str, Any]] = None
        self.nodes_map: Dict[str, Dict[str, Any]] = {}
        self.dialogue_history: List[str] = []

    def _load_json(self, filename: str) -> Dict[str, Any]:
        filepath = os.path.join(self.data_dir, filename)
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8-sig") as f:
                data = json.load(f)
                return data.get("dialogues", {})
        return {}

    def start_dialogue(self, dialogue_id: str) -> Optional[Dict[str, Any]]:
        """Inicia una conversación cargando su nodo raíz."""
        dialogue = self.dialogues_data.get(dialogue_id)
        if not dialogue:
            return None

        self.active_dialogue = dialogue
        self.nodes_map = {node["node_id"]: node for node in dialogue.get("nodes", [])}
        
        # El primer nodo de la lista es el nodo inicial
        nodes = dialogue.get("nodes", [])
        if not nodes:
            return None

        self.current_node = nodes[0]
        self.dialogue_history = [f"[{self.current_node.get('speaker', '')}]: {self.current_node.get('text', '')}"]
        return self.get_current_state()

    def advance_dialogue(
        self,
        choice_index: Optional[int] = None,
        save_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Avanza al siguiente nodo de la conversación.
        - Si el nodo actual tiene opciones múltiples (`choices`), requiere `choice_index`.
        - Aplica automáticamente cualquier flag (`set_flag`) a los `story_flags` de la partida.
        """
        if not self.current_node:
            return {"finished": True, "message": "No hay diálogo activo."}

        # 1. Aplicar flags de historia del nodo actual si existen
        flags_updated = {}
        if "set_flag" in self.current_node and save_data:
            story_flags = save_data.setdefault("story_flags", {})
            for k, v in self.current_node["set_flag"].items():
                story_flags[k] = v
                flags_updated[k] = v

        # 2. Comprobar si hay evento especial disparado
        trigger_event = self.current_node.get("trigger_event")

        # 3. Determinar el siguiente nodo
        next_node_id = None
        choices = self.current_node.get("choices")

        if choices:
            if choice_index is None or choice_index < 0 or choice_index >= len(choices):
                return {
                    "finished": False,
                    "requires_choice": True,
                    "choices": choices,
                    "node": self.current_node,
                    "error": "Se requiere seleccionar una opción válida."
                }
            chosen = choices[choice_index]
            next_node_id = chosen.get("next_node")
            self.dialogue_history.append(f"▶ Elección del Jugador: {chosen.get('text')}")
        else:
            next_node_id = self.current_node.get("next_node")

        # 4. Si no hay siguiente nodo, la escena ha terminado
        if not next_node_id or next_node_id not in self.nodes_map:
            last_node = self.current_node
            self.current_node = None
            return {
                "finished": True,
                "last_node": last_node,
                "flags_updated": flags_updated,
                "trigger_event": trigger_event
            }

        # Avanzar al siguiente nodo
        self.current_node = self.nodes_map[next_node_id]
        self.dialogue_history.append(f"[{self.current_node.get('speaker', '')}]: {self.current_node.get('text', '')}")

        return self.get_current_state(flags_updated=flags_updated, trigger_event=trigger_event)

    def get_current_state(
        self,
        flags_updated: Optional[Dict[str, Any]] = None,
        trigger_event: Optional[str] = None
    ) -> Dict[str, Any]:
        """Retorna el estado actual enriquecido del diálogo con información del mugshot."""
        if not self.current_node:
            return {"finished": True}

        portrait_id = self.current_node.get("portrait", "")
        portrait_info = self.PORTRAIT_CATALOG.get(portrait_id, {
            "character": self.current_node.get("speaker", "Desconocido"),
            "emotion": "Neutral",
            "icon": "💬"
        })

        return {
            "finished": False,
            "scene_title": self.active_dialogue.get("scene_title", "") if self.active_dialogue else "",
            "node_id": self.current_node.get("node_id"),
            "speaker": self.current_node.get("speaker"),
            "portrait": portrait_info,
            "text": self.current_node.get("text"),
            "has_choices": bool(self.current_node.get("choices")),
            "choices": self.current_node.get("choices", []),
            "flags_updated": flags_updated or {},
            "trigger_event": trigger_event
        }
