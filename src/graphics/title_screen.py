"""
title_screen.py  —  Pantalla de titulo animada del juego
"""
import math
import pygame
from src.graphics.asset_manager import AssetManager


class TitleScreen:
    def __init__(self, screen: pygame.Surface, assets: AssetManager):
        self.screen = screen
        self.assets = assets
        self.time   = 0.0
        self.SW, self.SH = screen.get_size()

        self.options    = ["NUEVA PARTIDA", "CONTINUAR", "OPCIONES", "SALIR"]
        self.selected   = 0
        self.done       = False
        self.choice     = None

        # Particulas de fondo
        import random
        self.particles = [
            {
                "x": random.uniform(0, self.SW),
                "y": random.uniform(0, self.SH),
                "r": random.uniform(1, 3),
                "speed": random.uniform(10, 40),
                "alpha": random.randint(80, 200),
            }
            for _ in range(120)
        ]

    def handle_event(self, event: pygame.event.Event):
        if event.type == pygame.KEYDOWN:
            if event.key in (pygame.K_DOWN, pygame.K_s):
                self.selected = (self.selected + 1) % len(self.options)
            elif event.key in (pygame.K_UP, pygame.K_w):
                self.selected = (self.selected - 1) % len(self.options)
            elif event.key in (pygame.K_RETURN, pygame.K_z, pygame.K_SPACE):
                self.choice = self.options[self.selected]
                self.done   = True

    def update(self, dt: float):
        self.time += dt
        for p in self.particles:
            p["y"] -= p["speed"] * dt
            if p["y"] < -10:
                import random
                p["y"] = self.SH + 10
                p["x"] = random.uniform(0, self.SW)

    def render(self):
        SW, SH = self.SW, self.SH

        # Fondo degradado animado
        t = (math.sin(self.time * 0.3) + 1) / 2  # 0..1
        top = (
            int(10  + t * 20),
            int(5   + t * 10),
            int(40  + t * 30),
        )
        bot = (
            int(30  + t * 20),
            int(60  + t * 40),
            int(120 + t * 60),
        )
        for y in range(SH):
            ft = y / SH
            r = int(top[0] + (bot[0] - top[0]) * ft)
            g = int(top[1] + (bot[1] - top[1]) * ft)
            b = int(top[2] + (bot[2] - top[2]) * ft)
            pygame.draw.line(self.screen, (r, g, b), (0, y), (SW, y))

        # Particulas (estrellas flotantes)
        star_surf = pygame.Surface((SW, SH), pygame.SRCALPHA)
        for p in self.particles:
            pulse = abs(math.sin(self.time * 2 + p["x"])) * 60 + 100
            pygame.draw.circle(star_surf, (255, 255, 255, int(pulse)),
                               (int(p["x"]), int(p["y"])), int(p["r"]))
        self.screen.blit(star_surf, (0, 0))

        # Titulo principal
        font_title = self.assets.font(72, bold=True)
        font_sub   = self.assets.font(28)
        font_menu  = self.assets.font(26, bold=True)
        font_hint  = self.assets.font(17)

        # Sombra del titulo
        bob = math.sin(self.time * 1.5) * 6
        title_txt = "POKEMON"
        t1 = font_title.render(title_txt, True, (255, 215, 0))
        t1s = font_title.render(title_txt, True, (80, 60, 0))
        tx = SW // 2 - t1.get_width() // 2
        ty = int(140 + bob)
        self.screen.blit(t1s, (tx + 4, ty + 4))
        self.screen.blit(t1, (tx, ty))

        sub_txt = "Ecos de Andara"
        t2 = font_sub.render(sub_txt, True, (200, 240, 255))
        t2s = font_sub.render(sub_txt, True, (40, 80, 120))
        sx = SW // 2 - t2.get_width() // 2
        sy = ty + t1.get_height() + 4
        self.screen.blit(t2s, (sx + 2, sy + 2))
        self.screen.blit(t2, (sx, sy))

        edition_txt = "Edicion HD-2.5D  |  Motor Offline  |  Region de Andara"
        t3 = font_hint.render(edition_txt, True, (160, 200, 220))
        self.screen.blit(t3, (SW // 2 - t3.get_width() // 2, sy + t2.get_height() + 8))

        # Separador
        sep_y = sy + t2.get_height() + 50
        pygame.draw.line(self.screen, (100, 150, 220),
                         (SW // 2 - 180, sep_y), (SW // 2 + 180, sep_y), 1)

        # Opciones del menu
        menu_start_y = sep_y + 30
        for i, opt in enumerate(self.options):
            sel = (i == self.selected)
            if sel:
                # Resaltado
                box_w = 260
                box_surf = pygame.Surface((box_w, 46), pygame.SRCALPHA)
                box_surf.fill((255, 215, 0, 60))
                pygame.draw.rect(box_surf, (255, 215, 0, 180), (0, 0, box_w, 46), 2, border_radius=8)
                self.screen.blit(box_surf, (SW // 2 - box_w // 2, menu_start_y + i * 56 - 6))

            color = (255, 215, 0) if sel else (200, 220, 240)
            label = font_menu.render(opt, True, color)
            lx = SW // 2 - label.get_width() // 2
            ly = menu_start_y + i * 56
            if sel:
                shadow = font_menu.render(opt, True, (80, 60, 0))
                self.screen.blit(shadow, (lx + 2, ly + 2))
            self.screen.blit(label, (lx, ly))

        # Cursor
        cursor_x = SW // 2 - 150
        cursor_y = menu_start_y + self.selected * 56 + 8
        cx = cursor_x + int(math.sin(self.time * 4) * 4)
        pygame.draw.polygon(self.screen, (255, 215, 0),
                            [(cx, cursor_y), (cx + 12, cursor_y + 12), (cx, cursor_y + 24)])

        # Version
        ver = font_hint.render("v0.1.0-alpha  |  2025  |  Proyecto Fan Pokemon", True, (100, 120, 140))
        self.screen.blit(ver, (SW // 2 - ver.get_width() // 2, SH - 30))
