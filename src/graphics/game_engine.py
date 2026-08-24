"""
game_engine.py  —  Motor principal del juego, gestor de estados
Estados: TITLE  →  OVERWORLD  →  BATTLE  →  DIALOGUE
"""
import os
import sys
import json
import pygame

from src.graphics.asset_manager    import AssetManager
from src.graphics.title_screen     import TitleScreen
from src.graphics.battle_renderer  import BattleRenderer
from src.graphics.overworld_renderer import OverworldHDRenderer


# ── Estado Overworld simple (texto + mapa de tiles de colores) ───────────────
TILE_COLORS = {
    "grass":  (88,  160, 88),
    "water":  (64,  120, 200),
    "tree":   (40,  100, 40),
    "path":   (180, 160, 120),
    "sand":   (210, 190, 140),
    "rock":   (130, 120, 110),
    "flower": (220, 140, 180),
    "tall_grass": (60, 130, 60),
    "building":   (160, 140, 120),
    "door":       (120, 80,  40),
}

TILE_SIZE = 32

# Mapa de Villa Tranquimar (10x8 tiles)
VILLA_MAP = [
    ["tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree"],
    ["tree","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","tree"],
    ["tree","grass","building","building","grass","grass","building","building","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","building","building","grass","grass","grass","grass","grass","grass","grass","grass","tree"],
    ["tree","grass","building","door","grass","grass","building","door","grass","grass","tall_grass","tall_grass","grass","grass","grass","grass","grass","grass","grass","building","door","grass","grass","grass","grass","grass","grass","grass","grass","tree"],
    ["tree","grass","grass","grass","grass","grass","grass","grass","grass","grass","tall_grass","tall_grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","flower","flower","grass","grass","grass","grass","tree"],
    ["tree","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","path","path","path","path","grass","grass","grass","grass","grass","flower","grass","grass","grass","grass","grass","tree"],
    ["tree","grass","grass","grass","water","water","water","water","water","grass","grass","grass","grass","grass","path","grass","grass","path","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","tree"],
    ["tree","grass","grass","grass","water","water","water","water","water","grass","grass","grass","grass","grass","path","grass","grass","path","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","tree"],
    ["tree","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","path","path","path","path","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","tree"],
    ["tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree"],
]

# NPCs en Villa Tranquimar
NPCS = [
    {"x": 6,  "y": 4, "name": "Prof. Ceibo",  "dialogue": "Bienvenido a la region de Andara, entrenador!"},
    {"x": 12, "y": 3, "name": "Habitante",    "dialogue": "Cuentan que el Crater Resonante late mas fuerte cada dia..."},
    {"x": 20, "y": 5, "name": "Nina",         "dialogue": "Yo quiero ser Campeon de Andara algun dia!"},
]


class OverworldState:
    def __init__(self, screen: pygame.Surface, assets: AssetManager):
        self.screen = screen
        self.assets = assets
        self.SW, self.SH = screen.get_size()

        # Posicion del jugador en tiles
        self.player_x = 10.0
        self.player_y = 5.0
        self.player_speed = 5.0  # tiles/segundo
        self.player_dir = "down"
        self.player_anim = 0.0
        self.time = 0.0

        # Camara (offset en pixeles)
        self.cam_x = 0.0
        self.cam_y = 0.0

        # Dialogo activo
        self.dialogue_text = ""
        self.dialogue_timer = 0.0
        self.npc_name = ""

        # Trigger de encuentro salvaje
        self.battle_trigger: dict | None = None

        self.encounter_cooldown = 0.0
        self.step_count = 0.0

        self._pre_rendered_tiles: dict = {}

    def handle_event(self, event: pygame.event.Event):
        if event.type == pygame.KEYDOWN:
            if event.key in (pygame.K_RETURN, pygame.K_z) and self.dialogue_text:
                self.dialogue_text = ""
                self.npc_name = ""

    def update(self, dt: float):
        self.time += dt
        if self.dialogue_text:
            return  # No mover durante dialogo

        keys = pygame.key.get_pressed()
        speed = self.player_speed * (2.0 if keys[pygame.K_LSHIFT] else 1.0)

        dx, dy = 0.0, 0.0
        if keys[pygame.K_LEFT]  or keys[pygame.K_a]: dx -= speed * dt; self.player_dir = "left"
        if keys[pygame.K_RIGHT] or keys[pygame.K_d]: dx += speed * dt; self.player_dir = "right"
        if keys[pygame.K_UP]    or keys[pygame.K_w]: dy -= speed * dt; self.player_dir = "up"
        if keys[pygame.K_DOWN]  or keys[pygame.K_s]: dy += speed * dt; self.player_dir = "down"

        # Colision basica
        nx = self.player_x + dx
        ny = self.player_y + dy
        if self._walkable(nx, self.player_y): self.player_x = nx
        if self._walkable(self.player_x, ny): self.player_y = ny

        moving = dx != 0 or dy != 0
        if moving:
            self.player_anim += dt * 8
            self.step_count += abs(dx) + abs(dy)

        # Camara suave
        target_cx = self.player_x * TILE_SIZE - self.SW / 2
        target_cy = self.player_y * TILE_SIZE - self.SH / 2
        self.cam_x += (target_cx - self.cam_x) * min(dt * 8, 1)
        self.cam_y += (target_cy - self.cam_y) * min(dt * 8, 1)

        # Decrementar cooldown de encuentro
        if self.encounter_cooldown > 0:
            self.encounter_cooldown -= dt

        # Detectar NPCs cercanos
        if keys[pygame.K_RETURN] or keys[pygame.K_z]:
            self._check_npc_interaction()

        # Encuentro en tall_grass
        if self.encounter_cooldown <= 0 and self.step_count >= 0.5:
            tile = self._tile_at(int(self.player_x), int(self.player_y))
            if tile == "tall_grass":
                import random
                if random.random() < 0.08:
                    self._trigger_wild_encounter()
            self.step_count = 0.0

    def _walkable(self, x: float, y: float) -> bool:
        t = self._tile_at(int(x), int(y))
        return t not in ("tree", "water", "rock", "building")

    def _tile_at(self, x: int, y: int) -> str:
        if y < 0 or y >= len(VILLA_MAP): return "tree"
        if x < 0 or x >= len(VILLA_MAP[0]): return "tree"
        return VILLA_MAP[y][x]

    def _check_npc_interaction(self):
        px, py = int(self.player_x), int(self.player_y)
        for npc in NPCS:
            if abs(npc["x"] - px) <= 1 and abs(npc["y"] - py) <= 1:
                self.dialogue_text = npc["dialogue"]
                self.npc_name = npc["name"]
                break

    def _trigger_wild_encounter(self):
        import random
        wild_pool = [
            {"id": 25,  "name": "Pikachu",    "types": ["electric"], "level": 5},
            {"id": 1,   "name": "Bulbasaur",  "types": ["grass","poison"], "level": 4},
            {"id": 4,   "name": "Charmander", "types": ["fire"], "level": 4},
            {"id": 7,   "name": "Squirtle",   "types": ["water"], "level": 4},
            {"id": 133, "name": "Eevee",      "types": ["normal"], "level": 5},
            {"id": 43,  "name": "Oddish",     "types": ["grass","poison"], "level": 3},
        ]
        wild = random.choice(wild_pool)
        wild.update({
            "max_hp": 20 + wild["level"] * 3,
            "current_hp": 20 + wild["level"] * 3,
            "moves": [
                {"name": "tackle", "type": "normal", "power": 40, "current_pp": 35, "max_pp": 35},
                {"name": "growl",  "type": "normal", "power": 0,  "current_pp": 40, "max_pp": 40},
            ],
        })
        self.battle_trigger = wild
        self.encounter_cooldown = 5.0

    def render(self):
        # Tiles del mapa
        import math
        for row_idx, row in enumerate(VILLA_MAP):
            for col_idx, tile in enumerate(row):
                sx = int(col_idx * TILE_SIZE - self.cam_x)
                sy = int(row_idx * TILE_SIZE - self.cam_y)
                if sx < -TILE_SIZE or sx > self.SW: continue
                if sy < -TILE_SIZE or sy > self.SH: continue

                col = TILE_COLORS.get(tile, (128, 128, 128))
                rect = pygame.Rect(sx, sy, TILE_SIZE, TILE_SIZE)
                pygame.draw.rect(self.screen, col, rect)

                # Detalle visual por tipo de tile
                if tile == "tall_grass":
                    for gx in range(3):
                        gy_off = int(math.sin(self.time * 2 + gx) * 2)
                        pygame.draw.line(self.screen, (40, 110, 40),
                                         (sx + 6 + gx*8, sy + TILE_SIZE - 4 + gy_off),
                                         (sx + 6 + gx*8, sy + TILE_SIZE//2 + gy_off), 2)
                elif tile == "water":
                    wave = int(math.sin(self.time * 2 + col_idx + row_idx) * 2)
                    pygame.draw.line(self.screen, (100, 160, 240),
                                     (sx + 4, sy + TILE_SIZE//2 + wave),
                                     (sx + TILE_SIZE - 4, sy + TILE_SIZE//2 + wave), 1)
                elif tile == "flower":
                    pygame.draw.circle(self.screen, (240, 100, 160),
                                       (sx + TILE_SIZE//2, sy + TILE_SIZE//2), 4)
                elif tile in ("tree",):
                    # Copa del arbol
                    pygame.draw.circle(self.screen, (30, 90, 30),
                                       (sx + TILE_SIZE//2, sy + TILE_SIZE//2 - 2), 10)

                # Borde sutil
                pygame.draw.rect(self.screen, (0, 0, 0, 30), rect, 1)

        # NPCs
        for npc in NPCS:
            sx = int(npc["x"] * TILE_SIZE - self.cam_x)
            sy = int(npc["y"] * TILE_SIZE - self.cam_y)
            # Cuerpo
            pygame.draw.rect(self.screen, (200, 140, 100),
                             pygame.Rect(sx + 10, sy + 12, 12, 16))
            # Cabeza
            pygame.draw.circle(self.screen, (230, 180, 140), (sx + 16, sy + 10), 7)
            # Nombre sobre el NPC
            font_npc = self.assets.font(11)
            nl = font_npc.render(npc["name"], True, (255, 255, 255))
            self.screen.blit(nl, (sx + 16 - nl.get_width()//2, sy - 14))

        # Jugador
        px = int(self.player_x * TILE_SIZE - self.cam_x)
        py = int(self.player_y * TILE_SIZE - self.cam_y)
        # Sombra
        pygame.draw.ellipse(self.screen, (0, 0, 0, 80),
                            pygame.Rect(px + 4, py + 26, 24, 8))
        # Cuerpo (sprite simple de jugador)
        pygame.draw.rect(self.screen, (60, 100, 200),
                         pygame.Rect(px + 8, py + 12, 16, 18))
        pygame.draw.circle(self.screen, (230, 180, 140), (px + 16, py + 10), 8)
        # Gorra
        pygame.draw.ellipse(self.screen, (220, 40, 40),
                            pygame.Rect(px + 8, py + 2, 16, 8))
        # Piernas animadas
        import math
        leg = int(math.sin(self.player_anim) * 3)
        pygame.draw.rect(self.screen, (40, 60, 140), pygame.Rect(px + 8,  py + 28, 6, 8 + leg))
        pygame.draw.rect(self.screen, (40, 60, 140), pygame.Rect(px + 18, py + 28, 6, 8 - leg))

        # HUD minimalista (nombre + posicion)
        font_hud = self.assets.font(16, bold=True)
        hud_txt = font_hud.render(f"Villa Tranquimar  |  ({int(self.player_x)}, {int(self.player_y)})", True, (255, 255, 255))
        shadow = font_hud.render(f"Villa Tranquimar  |  ({int(self.player_x)}, {int(self.player_y)})", True, (0, 0, 0))
        self.screen.blit(shadow, (12, 12))
        self.screen.blit(hud_txt, (10, 10))

        # Hint de controles
        hint = self.assets.font(14).render("Flechas: mover | Z/Enter: interactuar | Shift: correr", True, (200, 220, 255))
        self.screen.blit(hint, (self.SW//2 - hint.get_width()//2, self.SH - 24))

        # Caja de dialogo
        if self.dialogue_text:
            dlg = pygame.Surface((self.SW - 20, 120), pygame.SRCALPHA)
            dlg.fill((10, 10, 25, 220))
            pygame.draw.rect(dlg, (255, 255, 255, 60), (0, 0, self.SW - 20, 120), 2, border_radius=8)
            self.screen.blit(dlg, (10, self.SH - 130))

            font_dlg  = self.assets.font(17)
            font_name = self.assets.font(17, bold=True)
            nl = font_name.render(self.npc_name + ":", True, (255, 215, 0))
            self.screen.blit(nl, (22, self.SH - 122))
            tl = font_dlg.render(self.dialogue_text, True, (255, 255, 255))
            self.screen.blit(tl, (22, self.SH - 98))
            cont = self.assets.font(13).render("[ Enter / Z ] para continuar", True, (160, 180, 200))
            self.screen.blit(cont, (self.SW - 220, self.SH - 22))


class GameEngine:
    """Motor principal: gestiona los estados del juego y delega render/input"""

    STATE_TITLE     = "title"
    STATE_OVERWORLD = "overworld"
    STATE_BATTLE    = "battle"

    def __init__(self, screen: pygame.Surface, project_root: str):
        self.screen = screen
        self.root   = project_root
        self.SW, self.SH = screen.get_size()

        self.assets = AssetManager(project_root)
        self.state  = self.STATE_TITLE

        # Sub-estados
        self.title_screen = TitleScreen(screen, self.assets)
        self.overworld: OverworldHDRenderer | None = None
        self.battle: BattleRenderer | None = None
        self._transition_alpha = 0
        self._transitioning = False
        self._transition_to = None

        # Estado del jugador (persistido entre estados)
        self.player_name = "Aria"
        self.player_party: list = []
        self._init_player_party()

    def _init_player_party(self):
        """Equipo inicial de prueba"""
        self.player_party = [
            {
                "id": 6, "name": "Charizard", "level": 65,
                "types": ["fire", "flying"],
                "max_hp": 281, "current_hp": 240,
                "moves": [
                    {"name": "llamarada",      "type": "fire",   "power": 90,  "current_pp": 8,  "max_pp": 8},
                    {"name": "garra_dragon",   "type": "dragon", "power": 80,  "current_pp": 15, "max_pp": 15},
                    {"name": "acrobata",       "type": "flying", "power": 55,  "current_pp": 15, "max_pp": 15},
                    {"name": "terremoto",      "type": "ground", "power": 100, "current_pp": 10, "max_pp": 10},
                ],
                "status": None,
            }
        ]

    def handle_event(self, event: pygame.event.Event):
        if self._transitioning:
            return

        if self.state == self.STATE_TITLE:
            self.title_screen.handle_event(event)
            if self.title_screen.done:
                choice = self.title_screen.choice
                if choice == "NUEVA PARTIDA":
                    self._start_transition(self.STATE_OVERWORLD)
                elif choice == "SALIR":
                    pygame.event.post(pygame.event.Event(pygame.QUIT))

        elif self.state == self.STATE_OVERWORLD and self.overworld:
            self.overworld.handle_event(event)

        elif self.state == self.STATE_BATTLE and self.battle:
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_LEFT:   self.battle.select_move(-1)
                if event.key == pygame.K_RIGHT:  self.battle.select_move(1)
                if event.key == pygame.K_UP:     self.battle.select_move(-2)
                if event.key == pygame.K_DOWN:   self.battle.select_move(2)
                if event.key in (pygame.K_z, pygame.K_RETURN):
                    if self.battle._in_fight_menu:
                        self._execute_battle_move()
                    else:
                        self.battle.set_fight_menu(True)
                if event.key in (pygame.K_x, pygame.K_ESCAPE):
                    if self.battle._in_fight_menu:
                        self.battle.set_fight_menu(False)
                    else:
                        # Huir
                        self.battle.push_message("Huiste del combate!")
                        self._start_transition(self.STATE_OVERWORLD)

    def _execute_battle_move(self):
        """Simula un turno de combate simplificado"""
        import random
        if not self.battle or not self.battle.state:
            return

        pp = self.battle.state.get("player_pokemon", {})
        ep = self.battle.state.get("enemy_pokemon", {})
        moves = pp.get("moves", [])
        sel = self.battle._selected_move

        if sel >= len(moves): return
        move = moves[sel]

        # Dano simplificado
        power = move.get("power", 40)
        dmg = max(1, int(power * 0.4 + random.randint(-5, 10)))

        ep["current_hp"] = max(0, ep["current_hp"] - dmg)
        self.battle.push_message(f"{pp['name']} usa {move['name'].replace('_',' ').title()}!")
        self.battle.push_message(f"Inflige {dmg} puntos de dano!")
        self.battle.trigger_shake()

        if ep["current_hp"] <= 0:
            ep["current_hp"] = 0
            self.battle.push_message(f"{ep['name']} se debilita!")
            # Volver al overworld despues de 3 segundos
            pygame.time.set_timer(pygame.USEREVENT + 1, 3000, loops=1)

        self.battle.set_battle_state(self.battle.state)
        self.battle.set_fight_menu(False)

    def _start_transition(self, target_state: str):
        self._transitioning = True
        self._transition_alpha = 0
        self._transition_to = target_state

    def _finish_transition(self):
        target = self._transition_to
        if target == self.STATE_OVERWORLD:
            if self.overworld is None:
                self.overworld = OverworldHDRenderer(self.screen, self.assets)
            self.overworld.battle_trigger = None
            self.state = self.STATE_OVERWORLD
        elif target == self.STATE_BATTLE:
            self._start_battle_with(self._pending_wild)
            self.state = self.STATE_BATTLE
        self._transitioning = False

    def _start_battle_with(self, wild: dict):
        self.battle = BattleRenderer(self.screen, self.assets)
        player_mon = self.player_party[0].copy() if self.player_party else {
            "id": 4, "name": "Charmander", "level": 5, "types": ["fire"],
            "max_hp": 20, "current_hp": 20, "moves": [], "status": None
        }
        state = {
            "enemy_pokemon":  wild,
            "player_pokemon": player_mon,
            "biome": "bosque",
            "player_mega": False,
            "enemy_mega":  False,
        }
        self.battle.set_battle_state(state)
        self.battle.push_message(f"Aparece un {wild['name']} salvaje!")

    def update(self, dt: float):
        # Transicion de fade
        if self._transitioning:
            self._transition_alpha += dt * 400
            if self._transition_alpha >= 255:
                self._transition_alpha = 255
                self._finish_transition()
            return

        if self.state == self.STATE_TITLE:
            self.title_screen.update(dt)

        elif self.state == self.STATE_OVERWORLD and self.overworld:
            self.overworld.update(dt)
            # Comprobar trigger de batalla
            if self.overworld.battle_trigger:
                self._pending_wild = self.overworld.battle_trigger
                self.overworld.battle_trigger = None
                self._start_transition(self.STATE_BATTLE)

        elif self.state == self.STATE_BATTLE and self.battle:
            self.battle.update(dt)
            # Procesar evento de fin de batalla
            for event in pygame.event.get(pygame.USEREVENT + 1):
                self._start_transition(self.STATE_OVERWORLD)

    def render(self):
        self.screen.fill((0, 0, 0))

        if self.state == self.STATE_TITLE:
            self.title_screen.render()
        elif self.state == self.STATE_OVERWORLD and self.overworld:
            self.overworld.render()
        elif self.state == self.STATE_BATTLE and self.battle:
            self.battle.render()

        # Overlay de transicion (fade negro)
        if self._transitioning and self._transition_alpha > 0:
            fade = pygame.Surface((self.SW, self.SH), pygame.SRCALPHA)
            fade.fill((0, 0, 0, int(self._transition_alpha)))
            self.screen.blit(fade, (0, 0))
