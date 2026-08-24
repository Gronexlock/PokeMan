"""
Visualizador Interactivo de Diálogos y Cinemáticas (CLI)
========================================================
Proyecto: Pokémon: Ecos de Andara
Renderiza las cajas de texto estilizadas con marcos decorativos, mugshots
emocionales, árboles de decisiones interactivas y reproducción de cinemáticas.
"""

import sys
import os
from typing import Dict, Any, List, Optional

# Añadir src/ al path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(BASE_DIR, "src"))

from core.dialogue_manager import DialogueManager
from core.story_events import StoryEventManager
from core.save_manager import SaveManager


class DialogueVisualizerCLI:
    """Renderizador en consola de cajas de diálogo y cinemáticas."""

    @staticmethod
    def render_dialogue_box(state: Dict[str, Any], box_width: int = 70) -> None:
        """Imprime una caja de diálogo con marco ornamental y retrato emocional."""
        speaker = state.get("speaker", "Narrador")
        portrait = state.get("portrait", {})
        emotion = portrait.get("emotion", "Neutral")
        icon = portrait.get("icon", "💬")
        text = state.get("text", "")

        header = f" ╔══ {icon} [{speaker.upper()} — {emotion}] "
        header_line = header + "═" * max(0, box_width - len(header) - 1) + "╗"
        bottom_line = " ╚" + "═" * (box_width - 3) + "╝"

        print("\n" + header_line)
        
        # Ajustar texto a líneas dentro del marco
        words = text.split(" ")
        current_line = " ║  "
        for word in words:
            if len(current_line) + len(word) + 1 >= (box_width - 3):
                padding = " " * ((box_width - 2) - len(current_line))
                print(current_line + padding + "║")
                current_line = f" ║  {word}"
            else:
                current_line += f" {word}"
        padding = " " * ((box_width - 2) - len(current_line))
        print(current_line + padding + "║")

        # Opciones si las hay
        if state.get("has_choices"):
            print(" ║" + " " * (box_width - 3) + "║")
            for idx, choice in enumerate(state.get("choices", [])):
                opt_str = f" ║   [{idx + 1}] ▶ {choice['text']}"
                opt_pad = " " * ((box_width - 2) - len(opt_str))
                print(opt_str + opt_pad + "║")

        print(bottom_line)

    @classmethod
    def run_cutscene_simulation(cls, dialogue_id: str, choice_indices: Optional[List[int]] = None) -> List[str]:
        """
        Ejecuta la reproducción de una cinemática completa imprimiendo cada nodo.
        """
        dm = DialogueManager()
        state = dm.start_dialogue(dialogue_id)
        if not state:
            print(f"❌ Diálogo '{dialogue_id}' no encontrado.")
            return []

        print("\n" + "🎬" * 32)
        print(f" REPRODUCIENDO CINEMÁTICA: {state.get('scene_title', dialogue_id).upper()}")
        print("🎬" * 32)

        history = []
        choices_queue = list(choice_indices or [0, 0, 0])

        while not state.get("finished", False):
            cls.render_dialogue_box(state)
            history.append(f"[{state.get('speaker')}]: {state.get('text')}")

            if state.get("has_choices"):
                chosen_idx = choices_queue.pop(0) if choices_queue else 0
                state = dm.advance_dialogue(choice_index=chosen_idx)
            else:
                state = dm.advance_dialogue()

        print("\n" + "✨" * 32)
        print(" FIN DE LA ESCENA NARRATIVA")
        print("✨" * 32 + "\n")
        return history


if __name__ == "__main__":
    DialogueVisualizerCLI.run_cutscene_simulation("intro_ceibo_ceremony", [1, 0])
    DialogueVisualizerCLI.run_cutscene_simulation("solsticio_growlithe_adoption")
