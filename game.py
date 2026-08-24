"""
game.py  —  Punto de entrada gráfico principal
Pokemon: Ecos de Andara  |  Motor Pygame  |  Ventana 960x640
"""
import sys
import os

# Asegurar que el directorio raiz del proyecto este en el path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import pygame
from src.graphics.game_engine import GameEngine


def main():
    pygame.init()
    pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=512)

    # Ventana principal
    SCREEN_W, SCREEN_H = 960, 640
    screen = pygame.display.set_mode(
        (SCREEN_W, SCREEN_H),
        pygame.HWSURFACE | pygame.DOUBLEBUF
    )
    pygame.display.set_caption("Pokemon: Ecos de Andara  |  Edicion HD-2.5D")

    # Icono de la ventana (usa icono de Pokeball generado)
    icon_path = os.path.join(PROJECT_ROOT, "assets", "sprites", "ui", "icon.png")
    if os.path.exists(icon_path):
        pygame.display.set_icon(pygame.image.load(icon_path))

    clock = pygame.time.Clock()

    engine = GameEngine(screen, PROJECT_ROOT)

    running = True
    while running:
        dt = clock.tick(60) / 1000.0   # delta time en segundos

        events = pygame.event.get()
        for event in events:
            if event.type == pygame.QUIT:
                running = False
            engine.handle_event(event)

        engine.update(dt)
        engine.render()
        pygame.display.flip()

    pygame.quit()
    sys.exit(0)


if __name__ == "__main__":
    main()
