"""
overworld_renderer.py  —  Renderer de Overworld GBA auténtico estilo Pokémon Esmeralda / Rojo Fuego
Usa spritesheets 4x4 transparentes, estructuras completas (casas, arboles),
agua animada por frames, pasto texturizado y ciclo dia/noche.
"""
import os
import math
import random
import pygame

from src.graphics.tileset_loader import GBACharacterLoader, GBAObjectLoader

# ── Configuración Visual ──────────────────────────────────────────────────────
TILE_SIZE = 48  # Tamaño estándar de casilla

# Paleta base GBA suave (Estilo Villa Raíz / Pueblo Paleta)
COLOR_GRASS_BASE = (130, 192, 110)
COLOR_GRASS_DOT  = (112, 175, 94)
COLOR_PATH_BASE  = (226, 198, 142)
COLOR_PATH_DARK  = (204, 174, 118)
COLOR_SAND_BASE  = (238, 222, 168)

# Ciclo día/noche (hora 0-24 -> RGBA)
DAY_CYCLE = [
    (0,   (20,  20,  60, 150)),   # Madrugada azul oscuro
    (5,   (60,  40,  80, 110)),   # Amanecer púrpura
    (6,   (220, 120, 60, 50)),    # Amanecer dorado
    (8,   (255, 220, 120, 15)),   # Mañana soleada
    (11,  (255, 255, 255, 0)),    # Mediodía claro
    (16,  (255, 240, 200, 0)),    # Tarde
    (18,  (255, 170, 70, 35)),    # Atardecer naranja
    (20,  (60,  40,  90, 90)),    # Anochecer
    (22,  (20,  20,  60, 140)),   # Noche
    (24,  (20,  20,  60, 150)),
]

# Mapa base de terreno (14 filas x 30 columnas)
# "g": grass (pasto), "p": path (sendero), "s": sand (arena), "w": water (agua), "t": tall_grass (hierba alta)
TERRAIN_MAP = [
    ["g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g"],
    ["g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g"],
    ["g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g"],
    ["g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","t","t","t","t","g","g","g","g"],
    ["g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","t","t","t","t","g","g","g","g"],
    ["g","g","p","p","p","p","p","p","p","p","p","p","p","p","p","p","p","p","p","p","p","p","p","p","p","p","p","p","g","g"],
    ["g","g","p","g","g","g","g","g","g","g","p","g","g","g","g","g","p","g","g","g","g","g","t","t","t","t","g","g","g","g"],
    ["g","g","g","g","w","w","w","w","w","g","p","g","g","g","g","g","p","g","g","g","g","g","t","t","t","t","g","g","g","g"],
    ["g","g","g","g","w","w","w","w","w","g","p","p","p","p","p","p","p","g","g","g","g","g","g","g","g","g","g","g","g","g"],
    ["g","g","g","g","w","w","w","w","w","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g"],
    ["g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g"],
    ["g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g","g"],
]

# Estructuras y Objetos del Mundo (colocados por coordenadas X, Y en tiles)
WORLD_OBJECTS = [
    # Casas del pueblo
    {"type": "building", "name": "house_small",     "tile_x": 2,  "tile_y": 1, "w": 3, "h": 3},  # Casa Izquierda
    {"type": "building", "name": "hospital",        "tile_x": 9,  "tile_y": 1, "w": 4, "h": 3},  # Laboratorio Prof Ceibo
    {"type": "building", "name": "house_small_alt", "tile_x": 16, "tile_y": 1, "w": 3, "h": 3},  # Casa Derecha
    
    # Arboles límite superior
    *[{"type": "tree", "name": "green_tree", "tile_x": x, "tile_y": 0} for x in range(0, 30, 2)],
    # Arboles límite inferior
    *[{"type": "tree", "name": "green_tree", "tile_x": x, "tile_y": 10} for x in range(0, 30, 2)],
    # Arboles límite izquierdo
    *[{"type": "tree", "name": "green_tree_bushy", "tile_x": 0, "tile_y": y} for y in range(1, 10, 2)],
    # Arboles límite derecho
    *[{"type": "tree", "name": "green_tree_bushy", "tile_x": 28, "tile_y": y} for y in range(1, 10, 2)],
    
    # Rocas decorativas
    {"type": "prop", "name": "grassrock1", "tile_x": 3, "tile_y": 7},
    {"type": "prop", "name": "grassrock2", "tile_x": 10, "tile_y": 9},
]

# NPCs en Villa Tranquimar
NPCS = [
    {"x": 11.0, "y": 4.5, "char_key": "professor", "name": "Prof. Ceibo",
     "dialogue": ["¡Bienvenido a la región de Andara, entrenador!", "El Cráter Resonante late con fuerza al norte.", "Cuida bien a tu compañero Pokémon."]},
    {"x": 6.0,  "y": 5.0, "char_key": "habitante", "name": "Vecino",
     "dialogue": ["Villa Tranquimar es muy pacífica.", "Si vas a la hierba alta de la derecha, ¡prepárate para combatir!"]},
    {"x": 17.5, "y": 4.5, "char_key": "npc_girl",  "name": "Aura",
     "dialogue": ["¡Hola! Algún día seré la Campeona de la Liga Pokémon de Andara.", "¡Entrena duro a tus Pokémon!"]},
]


def lerp(a, b, t):
    return a + (b - a) * t


def lerp_color(c1, c2, t):
    return tuple(int(lerp(c1[i], c2[i], t)) for i in range(len(c1)))


class OverworldHDRenderer:
    """Renderer principal de Overworld con estética GBA nítida y fidedigna."""

    def __init__(self, screen: pygame.Surface, assets):
        self.screen = screen
        self.assets = assets
        self.SW, self.SH = screen.get_size()
        self.time = 0.0

        # Cargar assets GBA
        project_root = getattr(assets, "root", os.getcwd())
        gba_dir = os.path.join(project_root, "assets", "sprites", "gba")

        self.char_loader = GBACharacterLoader(gba_dir, dest_size=(48, 48))
        self.obj_loader  = GBAObjectLoader(gba_dir)

        # Hora del día simulada
        self.game_hour = 10.0

        # Posición del jugador
        self.player_x = 11.0
        self.player_y = 5.0
        self.player_dir = "down"
        self.player_step = 0.0
        self.player_speed = 4.5

        # Cámara suave
        self.cam_x = 0.0
        self.cam_y = 0.0

        # Diálogo
        self.dialogue_lines: list[str] = []
        self.dialogue_idx   = 0
        self.dialogue_name  = ""
        self.dialogue_char  = 0.0
        self.dialogue_speed = 40.0

        # Batalla y encuentros
        self.battle_trigger: dict | None = None
        self.encounter_cooldown = 0.0
        self.step_accum = 0.0

        # Superficie de iluminación
        self._light_surf = pygame.Surface((self.SW, self.SH), pygame.SRCALPHA)

        # Pre-renderizado de tiles base de terreno
        self._bake_ground_tiles()

    def _bake_ground_tiles(self):
        """Genera tiles de pasto y sendero GBA con textura punteada suave."""
        S = TILE_SIZE
        # 1. Pasto base GBA
        self.surf_grass = pygame.Surface((S, S))
        self.surf_grass.fill(COLOR_GRASS_BASE)
        rng = random.Random(101)
        for _ in range(8):
            gx = rng.randint(2, S - 4)
            gy = rng.randint(2, S - 4)
            pygame.draw.circle(self.surf_grass, COLOR_GRASS_DOT, (gx, gy), 2)

        # 2. Sendero de tierra GBA
        self.surf_path = pygame.Surface((S, S))
        self.surf_path.fill(COLOR_PATH_BASE)
        for _ in range(6):
            px = rng.randint(2, S - 4)
            py = rng.randint(2, S - 4)
            pygame.draw.rect(self.surf_path, COLOR_PATH_DARK, (px, py, 2, 2))

    def handle_event(self, event: pygame.event.Event):
        if event.type == pygame.KEYDOWN:
            if event.key in (pygame.K_RETURN, pygame.K_z, pygame.K_SPACE):
                if self.dialogue_lines:
                    if self.dialogue_char < len(self.dialogue_lines[self.dialogue_idx]):
                        self.dialogue_char = len(self.dialogue_lines[self.dialogue_idx])
                    else:
                        self.dialogue_idx += 1
                        self.dialogue_char = 0
                        if self.dialogue_idx >= len(self.dialogue_lines):
                            self.dialogue_lines = []
                            self.dialogue_idx = 0
                else:
                    self._check_npc()

    def update(self, dt: float):
        self.time += dt
        self.game_hour = (self.game_hour + dt / 60.0) % 24.0

        if self.dialogue_lines:
            self.dialogue_char = min(
                self.dialogue_char + self.dialogue_speed * dt,
                float(len(self.dialogue_lines[self.dialogue_idx]))
            )
            return

        # Movimiento del jugador
        keys = pygame.key.get_pressed()
        run = keys[pygame.K_LSHIFT] or keys[pygame.K_RSHIFT]
        spd = self.player_speed * (1.8 if run else 1.0)

        dx, dy = 0.0, 0.0
        if keys[pygame.K_LEFT]  or keys[pygame.K_a]: dx = -spd; self.player_dir = "left"
        if keys[pygame.K_RIGHT] or keys[pygame.K_d]: dx =  spd; self.player_dir = "right"
        if keys[pygame.K_UP]    or keys[pygame.K_w]: dy = -spd; self.player_dir = "up"
        if keys[pygame.K_DOWN]  or keys[pygame.K_s]: dy =  spd; self.player_dir = "down"

        if dx != 0 and dy != 0:
            dx *= 0.707
            dy *= 0.707

        nx = self.player_x + dx * dt
        ny = self.player_y + dy * dt

        if self._walkable(nx, self.player_y): self.player_x = nx
        if self._walkable(self.player_x, ny): self.player_y = ny

        moving = dx != 0 or dy != 0
        if moving:
            self.player_step += dt * (10 if run else 7)
            self.step_accum  += abs(dx * dt) + abs(dy * dt)
        else:
            self.player_step = 0.0

        # Cámara suave
        tcx = self.player_x * TILE_SIZE - self.SW / 2 + TILE_SIZE / 2
        tcy = self.player_y * TILE_SIZE - self.SH / 2 + TILE_SIZE / 2
        alpha_cam = min(dt * 10, 1.0)
        self.cam_x += (tcx - self.cam_x) * alpha_cam
        self.cam_y += (tcy - self.cam_y) * alpha_cam

        # Encuentros en hierba alta
        if self.encounter_cooldown > 0:
            self.encounter_cooldown -= dt

        if self.encounter_cooldown <= 0 and self.step_accum >= 0.5:
            tile = self._tile_at(int(self.player_x), int(self.player_y))
            if tile == "t" and random.random() < 0.08:
                self._trigger_encounter()
            self.step_accum = 0.0

    def _walkable(self, x: float, y: float) -> bool:
        ix, iy = int(x), int(y)
        if iy < 0 or iy >= len(TERRAIN_MAP) or ix < 0 or ix >= len(TERRAIN_MAP[0]):
            return False

        # No caminar en agua
        if TERRAIN_MAP[iy][ix] == "w":
            return False

        # Colisión con edificios
        for obj in WORLD_OBJECTS:
            if obj["type"] == "building":
                bx, by = obj["tile_x"], obj["tile_y"]
                bw, bh = obj["w"], obj["h"]
                if bx <= x < bx + bw and by <= y < by + bh:
                    return False
            elif obj["type"] == "tree":
                tx, ty = obj["tile_x"], obj["tile_y"]
                # Colisión con tronco
                if abs(tx - x) < 0.8 and abs(ty + 1 - y) < 0.8:
                    return False

        return True

    def _tile_at(self, x: int, y: int) -> str:
        if y < 0 or y >= len(TERRAIN_MAP): return "g"
        if x < 0 or x >= len(TERRAIN_MAP[0]): return "g"
        return TERRAIN_MAP[y][x]

    def _check_npc(self):
        px, py = self.player_x, self.player_y
        for npc in NPCS:
            if abs(npc["x"] - px) <= 1.2 and abs(npc["y"] - py) <= 1.2:
                self.dialogue_lines = npc["dialogue"]
                self.dialogue_name  = npc["name"]
                self.dialogue_idx   = 0
                self.dialogue_char  = 0
                break

    def _trigger_encounter(self):
        pool = [
            {"id": 25,  "name": "Pikachu",   "types": ["electric"],       "level": 5},
            {"id": 1,   "name": "Bulbasaur", "types": ["grass","poison"], "level": 4},
            {"id": 4,   "name": "Charmander","types": ["fire"],           "level": 4},
            {"id": 7,   "name": "Squirtle",  "types": ["water"],          "level": 4},
            {"id": 133, "name": "Eevee",     "types": ["normal"],         "level": 5},
            {"id": 43,  "name": "Oddish",    "types": ["grass","poison"], "level": 3},
        ]
        wild = random.choice(pool).copy()
        wild.update({
            "max_hp": 20 + wild["level"] * 3,
            "current_hp": 20 + wild["level"] * 3,
            "moves": [
                {"name": "tackle","type":"normal","power":40,"current_pp":35,"max_pp":35},
                {"name": "growl", "type":"normal","power":0, "current_pp":40,"max_pp":40},
            ],
        })
        self.battle_trigger = wild
        self.encounter_cooldown = 5.0

    # ── Renderizado ───────────────────────────────────────────────────────────

    def render(self):
        # 1. Fondo de cielo o base
        self.screen.fill(COLOR_GRASS_BASE)

        # 2. Dibujar terreno (Pasto, Sendero, Agua animada)
        water_frame_idx = int(self.time * 4) % 4
        water_surf = self.obj_loader.get_water(water_frame_idx)
        if water_surf:
            water_surf = pygame.transform.scale(water_surf, (TILE_SIZE, TILE_SIZE))

        for r, row in enumerate(TERRAIN_MAP):
            for c, t in enumerate(row):
                sx = int(c * TILE_SIZE - self.cam_x)
                sy = int(r * TILE_SIZE - self.cam_y)
                if sx < -TILE_SIZE * 2 or sx > self.SW + TILE_SIZE: continue
                if sy < -TILE_SIZE * 2 or sy > self.SH + TILE_SIZE: continue

                if t == "p":
                    self.screen.blit(self.surf_path, (sx, sy))
                elif t == "w":
                    if water_surf:
                        self.screen.blit(water_surf, (sx, sy))
                    else:
                        pygame.draw.rect(self.screen, (48, 120, 220), (sx, sy, TILE_SIZE, TILE_SIZE))
                else:
                    self.screen.blit(self.surf_grass, (sx, sy))

        # 3. Dibujar parches de hierba alta
        grass_obj = self.obj_loader.get_object("grass")
        if grass_obj:
            grass_scaled = pygame.transform.scale(grass_obj, (TILE_SIZE, TILE_SIZE))
            for r, row in enumerate(TERRAIN_MAP):
                for c, t in enumerate(row):
                    if t == "t":
                        sx = int(c * TILE_SIZE - self.cam_x)
                        sy = int(r * TILE_SIZE - self.cam_y)
                        self.screen.blit(grass_scaled, (sx, sy))

        # 4. Renderizado ordenado por profundidad Y (Edificios, NPCs, Jugador, Árboles)
        render_queue = []

        # Edificios
        for obj in WORLD_OBJECTS:
            if obj["type"] == "building":
                surf = self.obj_loader.get_object(obj["name"])
                if surf:
                    bx = int(obj["tile_x"] * TILE_SIZE - self.cam_x)
                    by = int(obj["tile_y"] * TILE_SIZE - self.cam_y)
                    # Escalar casa completa proporcionalmente
                    target_w = obj["w"] * TILE_SIZE
                    target_h = int(surf.get_height() * (target_w / surf.get_width()))
                    scaled_b = pygame.transform.scale(surf, (target_w, target_h))
                    render_queue.append({
                        "y": (obj["tile_y"] + obj["h"]) * TILE_SIZE,
                        "render": lambda s=scaled_b, x=bx, y=by: self.screen.blit(s, (x, y))
                    })
            elif obj["type"] == "tree":
                surf = self.obj_loader.get_object(obj["name"])
                if surf:
                    tx = int(obj["tile_x"] * TILE_SIZE - self.cam_x)
                    ty = int(obj["tile_y"] * TILE_SIZE - self.cam_y)
                    tw = TILE_SIZE * 2
                    th = int(surf.get_height() * (tw / surf.get_width()))
                    scaled_t = pygame.transform.scale(surf, (tw, th))
                    render_queue.append({
                        "y": (obj["tile_y"] + 2) * TILE_SIZE,
                        "render": lambda s=scaled_t, x=tx, y=ty: self.screen.blit(s, (x, y))
                    })
            elif obj["type"] == "prop":
                surf = self.obj_loader.get_object(obj["name"])
                if surf:
                    px = int(obj["tile_x"] * TILE_SIZE - self.cam_x)
                    py = int(obj["tile_y"] * TILE_SIZE - self.cam_y)
                    scaled_p = pygame.transform.scale(surf, (TILE_SIZE, TILE_SIZE))
                    render_queue.append({
                        "y": obj["tile_y"] * TILE_SIZE,
                        "render": lambda s=scaled_p, x=px, y=py: self.screen.blit(s, (x, y))
                    })

        # NPCs
        for npc in NPCS:
            char_key = npc["char_key"]
            frame = 0
            sprite = self.char_loader.get_frame(char_key, "down", frame)
            nx = int(npc["x"] * TILE_SIZE - self.cam_x)
            ny = int(npc["y"] * TILE_SIZE - self.cam_y)

            def draw_npc(s=sprite, x=nx, y=ny, name=npc["name"]):
                self._draw_shadow(x, y)
                if s:
                    self.screen.blit(s, (x, y))
                # Nombre
                fn = self.assets.font(12, bold=True)
                nl = fn.render(name, True, (255, 255, 255))
                ns = fn.render(name, True, (0, 0, 0))
                self.screen.blit(ns, (x + 24 - nl.get_width() // 2 + 1, y - 14 + 1))
                self.screen.blit(nl, (x + 24 - nl.get_width() // 2, y - 14))

            render_queue.append({"y": npc["y"] * TILE_SIZE, "render": draw_npc})

        # Jugador
        p_frame = int(self.player_step) % 4
        p_sprite = self.char_loader.get_frame("player", self.player_dir, p_frame)
        px = int(self.player_x * TILE_SIZE - self.cam_x)
        py = int(self.player_y * TILE_SIZE - self.cam_y)

        def draw_player(s=p_sprite, x=px, y=py):
            self._draw_shadow(x, y)
            if s:
                self.screen.blit(s, (x, y))

        render_queue.append({"y": self.player_y * TILE_SIZE, "render": draw_player})

        # Ordenar por Y y ejecutar render
        render_queue.sort(key=lambda item: item["y"])
        for item in render_queue:
            item["render"]()

        # 5. Efecto de hierba alta encima de los pies si el jugador está dentro
        if self._tile_at(int(self.player_x), int(self.player_y)) == "t" and grass_obj:
            self.screen.blit(grass_scaled, (px, py))

        # 6. Overlay de Iluminación
        self._draw_lighting()

        # 7. HUD
        self._draw_hud()

        # 8. Diálogo
        if self.dialogue_lines:
            self._draw_dialogue()

    def _draw_shadow(self, x: int, y: int):
        shadow = self.obj_loader.get_object("shadow")
        if shadow:
            s_scaled = pygame.transform.scale(shadow, (40, 16))
            self.screen.blit(s_scaled, (x + 4, y + 36))
        else:
            sh = pygame.Surface((36, 12), pygame.SRCALPHA)
            pygame.draw.ellipse(sh, (0, 0, 0, 70), (0, 0, 36, 12))
            self.screen.blit(sh, (x + 6, y + 38))

    def _get_day_overlay(self) -> tuple:
        h = self.game_hour
        for i in range(len(DAY_CYCLE) - 1):
            h0, c0 = DAY_CYCLE[i]
            h1, c1 = DAY_CYCLE[i + 1]
            if h0 <= h < h1:
                t = (h - h0) / (h1 - h0)
                return lerp_color(c0, c1, t)
        return DAY_CYCLE[0][1]

    def _draw_lighting(self):
        overlay = self._get_day_overlay()
        if overlay[3] > 0:
            self._light_surf.fill(overlay)
            self.screen.blit(self._light_surf, (0, 0))

    def _draw_hud(self):
        SW = self.SW
        h = int(self.game_hour)
        m = int((self.game_hour - h) * 60)
        is_day = 6 <= self.game_hour < 20
        time_str = f"{h:02d}:{m:02d}"

        font_hud = self.assets.font(16, bold=True)
        font_sm  = self.assets.font(14)

        # Panel Villa Tranquimar
        hud = pygame.Surface((220, 38), pygame.SRCALPHA)
        hud.fill((0, 0, 0, 140))
        pygame.draw.rect(hud, (255, 255, 255, 30), (0, 0, 220, 38), 1, border_radius=6)
        self.screen.blit(hud, (8, 8))
        area = font_hud.render("Villa Tranquimar", True, (255, 255, 255))
        self.screen.blit(area, (16, 14))

        # Panel de hora
        thud = pygame.Surface((90, 38), pygame.SRCALPHA)
        thud.fill((0, 0, 0, 140))
        pygame.draw.rect(thud, (255, 255, 255, 30), (0, 0, 90, 38), 1, border_radius=6)
        self.screen.blit(thud, (SW - 100, 8))
        tc = (255, 220, 80) if is_day else (180, 200, 255)
        tl = font_hud.render(time_str, True, tc)
        self.screen.blit(tl, (SW - 94, 14))

        # Hint de controles
        hint = font_sm.render("Flechas: mover  |  Z: interactuar  |  Shift: correr", True, (200, 220, 255))
        hs = pygame.Surface((hint.get_width() + 16, hint.get_height() + 8), pygame.SRCALPHA)
        hs.fill((0, 0, 0, 120))
        self.screen.blit(hs, (SW // 2 - hs.get_width() // 2, self.SH - 28))
        self.screen.blit(hint, (SW // 2 - hint.get_width() // 2, self.SH - 24))

    def _draw_dialogue(self):
        SW, SH = self.SW, self.SH
        BOX_H = 130

        dlg = pygame.Surface((SW - 16, BOX_H), pygame.SRCALPHA)
        dlg.fill((8, 10, 22, 235))
        pygame.draw.rect(dlg, (80, 120, 200, 180), (0, 0, SW - 16, BOX_H), 2, border_radius=10)
        pygame.draw.rect(dlg, (60, 90, 160, 100), (4, 4, SW - 24, BOX_H - 8), 1, border_radius=8)
        self.screen.blit(dlg, (8, SH - BOX_H - 8))

        fn_surf = pygame.Surface((150, 26), pygame.SRCALPHA)
        fn_surf.fill((60, 90, 200, 200))
        pygame.draw.rect(fn_surf, (120, 160, 255, 180), (0, 0, 150, 26), 1, border_radius=4)
        self.screen.blit(fn_surf, (20, SH - BOX_H - 8))
        fname = self.assets.font(15, bold=True)
        nl = fname.render(self.dialogue_name, True, (255, 230, 100))
        self.screen.blit(nl, (28, SH - BOX_H - 5))

        if self.dialogue_idx < len(self.dialogue_lines):
            full = self.dialogue_lines[self.dialogue_idx]
            visible = full[:int(self.dialogue_char)]
            ftxt = self.assets.font(17)
            words = visible.split(" ")
            lines_out, line = [], ""
            for w in words:
                test = (line + " " + w).strip()
                if ftxt.size(test)[0] < SW - 60:
                    line = test
                else:
                    lines_out.append(line)
                    line = w
            if line: lines_out.append(line)

            for i, ln in enumerate(lines_out[:3]):
                tl = ftxt.render(ln, True, (240, 240, 240))
                self.screen.blit(tl, (24, SH - BOX_H + 14 + i * 26))

        if self.dialogue_char >= len(self.dialogue_lines[self.dialogue_idx] if self.dialogue_idx < len(self.dialogue_lines) else ""):
            if math.sin(self.time * 4) > 0:
                cx = SW - 30
                cy = SH - 20
                pygame.draw.polygon(self.screen, (255, 220, 80), [(cx, cy - 6), (cx + 10, cy - 6), (cx + 5, cy)])
