"""
overworld_renderer.py  —  Renderer de Overworld estilo HD-2D
Tiles con texturas procedurales (o PNG real), iluminacion ambiental,
sprites animados, efectos de agua, hierba, sombras y parallax.
"""
import math
import os
import random
import pygame
from src.graphics.tileset_loader import TilesetLoader, CharacterSpriteLoader


# ── Configuracion visual ──────────────────────────────────────────────────────
TILE_SIZE = 48   # Tiles mas grandes para mas detalle (estilo NDS/3DS)

# Paleta de colores base por tipo de tile (se procesan despues)
TILE_BASE = {
    "grass":       (86,  148,  62),
    "short_grass": (76,  138,  52),
    "water":       (48,  108, 196),
    "tree":        (34,   88,  34),
    "path":        (172, 148, 108),
    "sand":        (210, 186, 128),
    "rock":        (120, 112, 100),
    "flower":      (210, 120, 168),
    "tall_grass":  (52,  118,  46),
    "building":    (196, 172, 148),
    "door":        (110,  72,  36),
    "wall":        (160, 144, 128),
    "roof":        (180,  60,  50),
    "roof_l":      (180,  60,  50),
    "roof_r":      (180,  60,  50),
    "wall_l":      (160, 144, 128),
    "wall_r":      (160, 144, 128),
    "sign":        (140, 100,  60),
    "fence":       (120,  80,  50),
}

# Ciclo dia/noche: hora (0-24) → overlay RGBA
DAY_CYCLE = [
    (0,   (20,  20,  60, 160)),   # Madrugada azul oscuro
    (5,   (60,  40,  80, 120)),   # Amanecer purpura
    (6,   (220, 120, 60, 60)),    # Amanecer naranja
    (8,   (255, 200, 100, 20)),   # Manana dorada
    (10,  (255, 255, 255, 0)),    # Dia claro
    (14,  (255, 255, 240, 0)),    # Mediodia brillante
    (17,  (255, 180, 80, 30)),    # Tarde dorada
    (19,  (220, 100, 40, 70)),    # Atardecer
    (21,  (40,  40, 100, 120)),   # Anochecer
    (23,  (20,  20,  60, 155)),   # Noche
    (24,  (20,  20,  60, 160)),   # Cierre ciclo
]

# Mapa de Villa Tranquimar ampliado y Ruta 1 (Outskirts)
# Villa Tranquimar (Col 0-17): Pasto y hierba decorativa (short_grass), no hay encuentros
# Ruta 1 (Col 18-29): Hierba alta con apariciones de Pokemon (tall_grass)
VILLA_MAP = [
    ["tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree"],
    ["tree","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","tree"],
    ["tree","grass","roof_l","roof_r","grass","grass","roof_l","roof_r","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","roof_l","roof_r","grass","grass","grass","grass","grass","grass","grass","grass","tree"],
    ["tree","grass","wall_l","door","sign","grass","wall_l","door","sign","grass","short_grass","short_grass","grass","grass","grass","grass","grass","grass","grass","wall_l","door","sign","tall_grass","tall_grass","tall_grass","grass","grass","grass","grass","tree"],
    ["tree","grass","grass","grass","grass","grass","grass","grass","grass","grass","short_grass","short_grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","tall_grass","tall_grass","tall_grass","grass","grass","grass","grass","tree"],
    ["tree","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","path","path","path","path","grass","grass","grass","grass","tall_grass","tall_grass","tall_grass","grass","grass","grass","grass","tree"],
    ["tree","grass","grass","grass","water","water","water","water","water","grass","grass","grass","grass","grass","path","sand","sand","path","grass","grass","grass","grass","tall_grass","tall_grass","tall_grass","grass","grass","grass","grass","tree"],
    ["tree","grass","grass","grass","water","water","water","water","water","grass","grass","grass","grass","grass","path","sand","sand","path","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","tree"],
    ["tree","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","path","path","path","path","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","tree"],
    ["tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree","tree"],
]

NPCS = [
    {"x": 6,  "y": 4, "name": "Prof. Ceibo",  "color": (80, 120, 200),  "hat": (200, 180, 60),
     "dialogue": ["Bienvenido a la region de Andara, entrenador!", "El Crater Resonante te espera al norte...", "Cuida bien de tu Pokemon inicial."]},
    {"x": 12, "y": 3, "name": "Habitante",    "color": (180, 100, 60),  "hat": (100, 140, 80),
     "dialogue": ["Cuentan que el Crater Resonante late mas fuerte cada dia...", "Ten cuidado en la hierba alta."]},
    {"x": 20, "y": 5, "name": "Nina",         "color": (200, 140, 160), "hat": (240, 80, 120),
     "dialogue": ["Yo quiero ser Campeon de Andara algun dia!", "Un dia voy a atrapar a Garchomp!"]},
]


def lerp(a, b, t):
    return a + (b - a) * t


def lerp_color(c1, c2, t):
    return tuple(int(lerp(c1[i], c2[i], t)) for i in range(len(c1)))


class TileRenderer:
    """Pre-renderiza tiles con texturas procedurales para rendimiento optimo"""

    def __init__(self, seed: int = 42):
        self._cache: dict = {}
        self._rng = random.Random(seed)

    def get(self, tile_type: str, variant: int = 0) -> pygame.Surface:
        key = (tile_type, variant)
        if key not in self._cache:
            self._cache[key] = self._bake(tile_type, variant)
        return self._cache[key]

    def _bake(self, t: str, var: int) -> pygame.Surface:
        S = TILE_SIZE
        surf = pygame.Surface((S, S), pygame.SRCALPHA)
        rng  = random.Random(var * 1000 + hash(t) % 999)

        if t == "grass":
            base = (86 + rng.randint(-8,8), 148 + rng.randint(-8,8), 62 + rng.randint(-6,6))
            surf.fill(base)
            # Puntos de variacion de color
            for _ in range(12):
                gx, gy = rng.randint(0, S-1), rng.randint(0, S-1)
                shade = rng.randint(-15, 15)
                c = tuple(max(0,min(255, base[i]+shade)) for i in range(3))
                pygame.draw.circle(surf, c, (gx, gy), rng.randint(2,5))
            # Briznas de hierba
            for _ in range(6):
                gx, gy = rng.randint(4, S-4), rng.randint(4, S-4)
                gh = rng.randint(5, 10)
                pygame.draw.line(surf, (60, 110, 40), (gx, gy), (gx + rng.randint(-2,2), gy - gh), 1)

        elif t == "short_grass":
            base = (76, 138, 52)
            surf.fill(base)
            # Dibujar briznas de hierba cortas y dispersas (decorativo)
            for _ in range(4):
                gx, gy = rng.randint(4, S-4), rng.randint(4, S-4)
                pygame.draw.line(surf, (40, 100, 30), (gx, gy), (gx + rng.randint(-1,1), gy - 4), 1)

        elif t == "tall_grass":
            base = (52, 118, 46)
            surf.fill(base)
            for _ in range(20):
                gx, gy = rng.randint(2, S-2), rng.randint(4, S-2)
                gh = rng.randint(8, 16)
                lean = rng.randint(-3, 3)
                col  = (rng.randint(30, 70), rng.randint(90, 140), rng.randint(20, 55))
                pygame.draw.line(surf, col, (gx, gy), (gx+lean, gy-gh), 2)
            # Borde mas oscuro para profundidad
            pygame.draw.rect(surf, (40, 90, 30), (0, 0, S, S), 2)

        elif t == "water":
            # Degradado azul
            for y in range(S):
                t_y = y / S
                r = int(lerp(64, 32, t_y))
                g = int(lerp(140, 90, t_y))
                b = int(lerp(220, 170, t_y))
                pygame.draw.line(surf, (r, g, b), (0, y), (S, y))
            # Reflejos blancos
            for _ in range(3):
                wx = rng.randint(4, S-12)
                wy = rng.randint(4, S-8)
                pygame.draw.ellipse(surf, (180, 220, 255, 150), (wx, wy, rng.randint(8,16), 3))

        elif t == "path":
            base = (172, 148, 108)
            surf.fill(base)
            # Textura de tierra/piedra
            for _ in range(20):
                px, py = rng.randint(0, S-1), rng.randint(0, S-1)
                pr = rng.randint(1, 4)
                shade = rng.randint(-20, 20)
                c = tuple(max(0,min(255,base[i]+shade)) for i in range(3))
                pygame.draw.circle(surf, c, (px, py), pr)
            # Borde sutil
            pygame.draw.rect(surf, (150, 128, 90), (0, 0, S, S), 1)

        elif t == "sand":
            base = (210, 186, 128)
            surf.fill(base)
            for _ in range(15):
                sx2, sy2 = rng.randint(0, S-1), rng.randint(0, S-1)
                shade = rng.randint(-15, 20)
                c = tuple(max(0,min(255,base[i]+shade)) for i in range(3))
                pygame.draw.circle(surf, c, (sx2, sy2), rng.randint(1,3))

        elif t == "tree":
            # Fondo oscuro del arbol
            surf.fill((28, 70, 28))
            # Copa del arbol (circulo principal)
            pygame.draw.circle(surf, (44, 100, 36), (S//2, S//2 - 4), S//2 - 4)
            # Highlight superior
            pygame.draw.circle(surf, (68, 130, 52), (S//2 - 4, S//2 - 8), S//4)
            # Tronco
            pygame.draw.rect(surf, (90, 60, 30), (S//2-4, S//2+4, 8, 12))

        elif t == "roof":
            base = (180, 60, 50)
            surf.fill(base)
            # Tejas
            for row in range(0, S, 8):
                offset = 4 if (row // 8) % 2 else 0
                for col in range(-4+offset, S+4, 12):
                    pygame.draw.rect(surf, (160, 45, 38), (col, row, 10, 7), border_radius=2)
                    pygame.draw.rect(surf, (200, 80, 65), (col+1, row+1, 8, 3), border_radius=1)

        elif t == "wall":
            base = (196, 172, 148)
            surf.fill(base)
            # Patron de ladrillos
            for br in range(0, S, 10):
                offset = 8 if (br//10) % 2 else 0
                for bc in range(-8+offset, S+8, 20):
                    pygame.draw.rect(surf, (178, 155, 130), (bc, br, 18, 8), border_radius=1)
                    pygame.draw.rect(surf, (210, 190, 165), (bc+1, br+1, 16, 4))
            pygame.draw.rect(surf, (160, 140, 115), (0, 0, S, S), 1)

        elif t == "door":
            surf.fill((110, 72, 36))
            # Marco
            pygame.draw.rect(surf, (80, 50, 22), (4, 0, S-8, S), border_radius=3)
            pygame.draw.rect(surf, (140, 100, 60), (4, 0, S-8, S), 2, border_radius=3)
            # Panel
            pygame.draw.rect(surf, (90, 60, 28), (8, 4, S//2-10, S-8), border_radius=2)
            pygame.draw.rect(surf, (90, 60, 28), (S//2+2, 4, S//2-14, S-8), border_radius=2)
            # Manilla
            pygame.draw.circle(surf, (200, 170, 80), (S//2+6, S//2), 3)

        elif t == "flower":
            surf.fill((86, 148, 62))
            # Tallo
            pygame.draw.line(surf, (60, 110, 40), (S//2, S-4), (S//2, S//2+2), 2)
            # Petalo central
            pygame.draw.circle(surf, (240, 200, 40), (S//2, S//2), 5)
            for angle in range(0, 360, 60):
                rad = math.radians(angle)
                px2 = int(S//2 + math.cos(rad) * 7)
                py2 = int(S//2 + math.sin(rad) * 7)
                pygame.draw.circle(surf, (220, 80, 140), (px2, py2), 4)

        elif t == "rock":
            surf.fill((86, 148, 62))  # pasto debajo
            # Roca
            pygame.draw.ellipse(surf, (120, 112, 100), (4, 8, S-8, S-12))
            pygame.draw.ellipse(surf, (150, 142, 130), (6, 10, S//2, S//3))
            pygame.draw.ellipse(surf, (90, 84, 76), (4, 8, S-8, S-12), 2)

        else:
            surf.fill(TILE_BASE.get(t, (128, 128, 128)))

        return surf


class OverworldHDRenderer:
    """Renderer de overworld HD-2D con iluminacion, animaciones y efectos"""

    def __init__(self, screen: pygame.Surface, assets):
        self.screen = screen
        self.assets = assets
        self.SW, self.SH = screen.get_size()
        self.tiles = TileRenderer()
        self.time  = 0.0

        # ── Cargar tileset PNG real (si existe) ──────────────────────────────
        project_root = getattr(assets, 'root', os.getcwd())
        tileset_path  = os.path.join(project_root, "assets", "sprites", "tilesets", "overworld.jpg")
        trainers_path = os.path.join(project_root, "assets", "sprites", "tilesets", "trainers.jpg")

        self.tileset  = TilesetLoader(tileset_path,  src_tile_size=64, dest_tile_size=TILE_SIZE)
        self.char_sprites = CharacterSpriteLoader(trainers_path, dest_size=(TILE_SIZE, TILE_SIZE))

        if self.tileset.loaded:
            print("[Overworld] Tileset PNG cargado correctamente")
        else:
            print("[Overworld] Usando tiles procedurales (tileset PNG no encontrado)")

        # Mapa de tiles a coordenadas del tileset (col, row) en el PNG
        # Basado en el nuevo tileset limpio y seamless generado
        self.TILESET_MAP = {
            "grass":       (2, 0),    # Fila 0, col 2 — pasto texturizado suave
            "short_grass": (3, 0),    # Fila 0, col 3 — pasto con florecillas/hojas
            "tall_grass":  (9, 10),   # Fila 10, col 9 — hierba alta
            "water":       (4, 4),    # Fila 4, col 4 — agua
            "path":        (0, 2),    # Fila 2, col 0 — sendero de tierra
            "sand":        (0, 4),    # Fila 4, col 0 — arena
            "tree":        (12, 0),   # Fila 0, col 12 — arbol GBA
            "wall":        (0, 12),   # pared de ladrillo general
            "roof":        (0, 14),   # techo rojo general
            "roof_l":      (0, 14),   # Fila 14, col 0 — caida izquierda del techo
            "roof_r":      (2, 14),   # Fila 14, col 2 — caida derecha del techo (rojo)
            "wall_l":      (0, 12),   # Fila 12, col 0 — pared de ladrillo rojo izq
            "wall_r":      (1, 12),   # Fila 12, col 1 — pared de ladrillo rojo der
            "door":        (2, 12),   # Fila 12, col 2 — puerta integrada con ladrillo rojo
            "sign":        (13, 15),  # Fila 15, col 13 — cartel de madera
            "fence":       (11, 15),  # Fila 15, col 11 — valla de madera
            "flower":      (2, 8),    # Fila 8, col 2 — flores
            "rock":        (3, 10),   # Fila 10, col 3 — rocas
        }

        # Hora del dia simulada (0-24)
        # 1 minuto real = 1 hora del juego (ciclo de 24 minutos)
        self.game_hour = 8.0

        # Posicion del jugador
        self.player_x = 10.0
        self.player_y = 5.0
        self.player_vx = 0.0
        self.player_vy = 0.0
        self.player_dir  = "down"
        self.player_step = 0.0
        self.player_speed = 4.5

        # Camara suave
        self.cam_x = 0.0
        self.cam_y = 0.0

        # Dialogo
        self.dialogue_lines: list[str] = []
        self.dialogue_idx   = 0
        self.dialogue_name  = ""
        self.dialogue_char  = 0.0  # maquina de escribir
        self.dialogue_speed = 40.0  # chars/seg

        # Trigger de batalla
        self.battle_trigger: dict | None = None
        self.encounter_cooldown = 0.0
        self.step_accum = 0.0

        # Cache de variantes de tiles (para consistencia visual del mapa)
        self._tile_variants = {}
        for r, row in enumerate(VILLA_MAP):
            for c, tile in enumerate(row):
                self._tile_variants[(c, r)] = hash((c*7 + r*13)) % 4

        # Particulas de agua y hierba
        self.particles: list[dict] = []
        self._spawn_particles()

        # Superficie de iluminacion (reutilizable)
        self._light_surf = pygame.Surface((self.SW, self.SH), pygame.SRCALPHA)

        # Mapa pre-renderizado (se regenera si cambia la hora)
        self._map_surf: pygame.Surface | None = None
        self._map_hour_baked = -1.0

    def _spawn_particles(self):
        """Genera particulas flotantes para agua y hierba"""
        for r, row in enumerate(VILLA_MAP):
            for c, tile in enumerate(row):
                if tile == "water":
                    for _ in range(2):
                        self.particles.append({
                            "type": "water", "tile_x": c, "tile_y": r,
                            "ox": random.uniform(4, TILE_SIZE-4),
                            "oy": random.uniform(4, TILE_SIZE-10),
                            "phase": random.uniform(0, math.pi * 2),
                            "speed": random.uniform(0.5, 1.2),
                        })

    def handle_event(self, event: pygame.event.Event):
        if event.type == pygame.KEYDOWN:
            if event.key in (pygame.K_RETURN, pygame.K_z, pygame.K_SPACE):
                if self.dialogue_lines:
                    if self.dialogue_char < len(self.dialogue_lines[self.dialogue_idx]):
                        # Completar linea actual
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
        self.game_hour = (self.game_hour + dt / 60.0) % 24.0  # 1 min real = 1h juego

        if self.dialogue_lines:
            # Avanzar maquina de escribir
            self.dialogue_char = min(
                self.dialogue_char + self.dialogue_speed * dt,
                float(len(self.dialogue_lines[self.dialogue_idx]))
            )
            return

        # Movimiento del jugador
        keys = pygame.key.get_pressed()
        run  = keys[pygame.K_LSHIFT] or keys[pygame.K_RSHIFT]
        spd  = self.player_speed * (1.8 if run else 1.0)

        dx, dy = 0.0, 0.0
        if keys[pygame.K_LEFT]  or keys[pygame.K_a]: dx = -spd; self.player_dir = "left"
        if keys[pygame.K_RIGHT] or keys[pygame.K_d]: dx =  spd; self.player_dir = "right"
        if keys[pygame.K_UP]    or keys[pygame.K_w]: dy = -spd; self.player_dir = "up"
        if keys[pygame.K_DOWN]  or keys[pygame.K_s]: dy =  spd; self.player_dir = "down"

        # Normalizar diagonal
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

        # Camara suave
        tcx = self.player_x * TILE_SIZE - self.SW / 2 + TILE_SIZE / 2
        tcy = self.player_y * TILE_SIZE - self.SH / 2 + TILE_SIZE / 2
        alpha_cam = min(dt * 10, 1.0)
        self.cam_x += (tcx - self.cam_x) * alpha_cam
        self.cam_y += (tcy - self.cam_y) * alpha_cam

        # Encuentros
        if self.encounter_cooldown > 0:
            self.encounter_cooldown -= dt

        if self.encounter_cooldown <= 0 and self.step_accum >= 0.5:
            tile = self._tile_at(int(self.player_x), int(self.player_y))
            if tile == "tall_grass" and random.random() < 0.07:
                self._trigger_encounter()
            self.step_accum = 0.0

    def _walkable(self, x: float, y: float) -> bool:
        return self._tile_at(int(x), int(y)) not in ("tree","water","wall","roof","rock")

    def _tile_at(self, x: int, y: int) -> str:
        if y < 0 or y >= len(VILLA_MAP): return "tree"
        if x < 0 or x >= len(VILLA_MAP[0]): return "tree"
        return VILLA_MAP[y][x]

    def _check_npc(self):
        px, py = int(self.player_x), int(self.player_y)
        for npc in NPCS:
            if abs(npc["x"] - px) <= 1 and abs(npc["y"] - py) <= 1:
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

    # ── Render principal ──────────────────────────────────────────────────────

    def render(self):
        # Fondo de cielo (antes del mapa)
        self._draw_sky()

        # Tiles del mapa
        for r, row in enumerate(VILLA_MAP):
            for c, tile in enumerate(row):
                sx = int(c * TILE_SIZE - self.cam_x)
                sy = int(r * TILE_SIZE - self.cam_y)
                if sx < -TILE_SIZE*2 or sx > self.SW + TILE_SIZE: continue
                if sy < -TILE_SIZE*2 or sy > self.SH + TILE_SIZE: continue

                var = self._tile_variants.get((c, r), 0)

                # Intentar usar tileset PNG real primero
                t_surf = None
                if self.tileset.loaded:
                    tc = self.TILESET_MAP.get(tile)
                    if tc:
                        t_surf = self.tileset.get_tile(tc[0] + var % 3, tc[1])

                # Fallback a tiles procedurales
                if t_surf is None:
                    t_surf = self.tiles.get(tile, var)

                self.screen.blit(t_surf, (sx, sy))

        # Animacion del agua (ondas sobre el tile)
        self._draw_water_waves()

        # Animacion de hierba alta (si el jugador esta en ella)
        self._draw_tall_grass_effect()

        # NPCs con sprites mejorados
        self._draw_npcs()

        # Jugador
        self._draw_player()

        # Overlay de iluminacion del dia/noche
        self._draw_lighting()

        # HUD (nombre del area, hora)
        self._draw_hud()

        # Caja de dialogo
        if self.dialogue_lines:
            self._draw_dialogue()

    def _draw_sky(self):
        """Cielo de fondo con degradado segun la hora"""
        h = self.game_hour
        # Colores del cielo segun hora
        if h < 6:
            top, bot = (10, 10, 40), (30, 20, 70)
        elif h < 8:
            t = (h - 6) / 2
            top = lerp_color((10,10,40), (200,100,60), t)
            bot = lerp_color((30,20,70), (240,160,80), t)
        elif h < 10:
            t = (h - 8) / 2
            top = lerp_color((200,100,60), (100,160,220), t)
            bot = lerp_color((240,160,80), (160,210,240), t)
        elif h < 17:
            top, bot = (100, 160, 220), (160, 210, 240)
        elif h < 19:
            t = (h - 17) / 2
            top = lerp_color((100,160,220), (200,100,40), t)
            bot = lerp_color((160,210,240), (240,140,60), t)
        elif h < 21:
            t = (h - 19) / 2
            top = lerp_color((200,100,40), (30,30,80), t)
            bot = lerp_color((240,140,60), (60,40,100), t)
        else:
            top, bot = (10, 10, 40), (30, 20, 70)

        # Solo rellenar la parte del cielo visible sobre el mapa
        sky_h = max(0, int(-self.cam_y))
        if sky_h > 0:
            for y in range(min(sky_h, self.SH)):
                t = y / max(sky_h, 1)
                c = lerp_color(top, bot, t)
                pygame.draw.line(self.screen, c, (0, y), (self.SW, y))
        # Fondo del area del mapa
        self.screen.fill((86, 148, 62), pygame.Rect(0, max(0, sky_h), self.SW, self.SH))

    def _draw_water_waves(self):
        """Ondas animadas sobre tiles de agua"""
        for r, row in enumerate(VILLA_MAP):
            for c, tile in enumerate(row):
                if tile != "water": continue
                sx = int(c * TILE_SIZE - self.cam_x)
                sy = int(r * TILE_SIZE - self.cam_y)
                if sx < -TILE_SIZE or sx > self.SW: continue
                if sy < -TILE_SIZE or sy > self.SH: continue

                wave_surf = pygame.Surface((TILE_SIZE, TILE_SIZE), pygame.SRCALPHA)
                # 3 ondas con fase diferente
                for i in range(3):
                    phase = self.time * 1.5 + c * 0.5 + r * 0.3 + i * 2.0
                    wy = int(TILE_SIZE * 0.3 + i * TILE_SIZE * 0.2 + math.sin(phase) * 3)
                    wx_start = int(math.sin(phase * 0.7) * 4)
                    alpha = 80 + i * 20
                    pygame.draw.line(wave_surf, (180, 220, 255, alpha),
                                     (wx_start, wy), (TILE_SIZE - 4 + wx_start, wy), 2)
                self.screen.blit(wave_surf, (sx, sy))

    def _draw_tall_grass_effect(self):
        """Efecto de hierba alta animada encima del jugador si esta en ella"""
        px_tile = int(self.player_x)
        py_tile = int(self.player_y)
        if self._tile_at(px_tile, py_tile) != "tall_grass":
            return
        sx = int(self.player_x * TILE_SIZE - self.cam_x)
        sy = int(self.player_y * TILE_SIZE - self.cam_y)
        # Render de hierba encima del sprite
        for i in range(6):
            phase = self.time * 3 + i * 1.1
            gx = sx + 6 + i * 6
            gy = sy + TILE_SIZE - 4
            gh = 12 + int(math.sin(phase) * 3)
            lean = int(math.sin(phase * 0.8) * 3)
            col = (40, 110 + i*4, 30)
            pygame.draw.line(self.screen, col, (gx, gy), (gx + lean, gy - gh), 2)

    def _draw_npcs(self):
        for npc in NPCS:
            sx = int(npc["x"] * TILE_SIZE - self.cam_x)
            sy = int(npc["y"] * TILE_SIZE - self.cam_y)
            if sx < -TILE_SIZE or sx > self.SW: continue

            # Sombra eliptica
            shadow = pygame.Surface((TILE_SIZE, 12), pygame.SRCALPHA)
            pygame.draw.ellipse(shadow, (0, 0, 0, 60), (4, 2, TILE_SIZE-8, 8))
            self.screen.blit(shadow, (sx, sy + TILE_SIZE - 10))

            char_key = None
            if npc["name"] == "Prof. Ceibo":
                char_key = "professor"
            elif npc["name"] == "Habitante":
                char_key = "rival"
            elif npc["name"] == "Nina":
                char_key = "npc_girl"

            sprite = None
            if self.char_sprites.loaded and char_key:
                sprite = self.char_sprites.get_frame(char_key, "down", 0)

            if sprite:
                self.screen.blit(sprite, (sx, sy))
            else:
                # Fallback: Piernas
                leg_bob = int(math.sin(self.time * 2 + npc["x"]) * 1)
                pygame.draw.rect(self.screen, (80, 60, 40),
                                 pygame.Rect(sx+12, sy+30+leg_bob, 7, 10))
                pygame.draw.rect(self.screen, (80, 60, 40),
                                 pygame.Rect(sx+22, sy+30-leg_bob, 7, 10))

                # Cuerpo
                pygame.draw.rect(self.screen, npc["color"],
                                 pygame.Rect(sx+10, sy+16, 24, 18), border_radius=3)
                # Brazos
                pygame.draw.rect(self.screen, npc["color"], pygame.Rect(sx+4,  sy+18, 7, 14))
                pygame.draw.rect(self.screen, npc["color"], pygame.Rect(sx+33, sy+18, 7, 14))

                # Cabeza
                pygame.draw.circle(self.screen, (230, 190, 150), (sx+22, sy+12), 11)
                # Ojos
                pygame.draw.circle(self.screen, (50, 30, 20),  (sx+18, sy+11), 2)
                pygame.draw.circle(self.screen, (50, 30, 20),  (sx+26, sy+11), 2)
                # Sombrero/gorra
                pygame.draw.ellipse(self.screen, npc["hat"], (sx+11, sy+2, 22, 8))
                pygame.draw.rect(self.screen,   npc["hat"], (sx+13, sy-4, 18, 8), border_radius=2)

            # Exclamacion si esta cerca del jugador
            px_t, py_t = int(self.player_x), int(self.player_y)
            if abs(npc["x"]-px_t) <= 1 and abs(npc["y"]-py_t) <= 1:
                font_e = self.assets.font(14, bold=True)
                hint = font_e.render("!", True, (255, 200, 0))
                self.screen.blit(hint, (sx+18, sy-18))

            # Nombre
            fn = self.assets.font(11)
            nl = fn.render(npc["name"], True, (255, 255, 255))
            ns = fn.render(npc["name"], True, (0, 0, 0))
            nx2 = sx + 22 - nl.get_width()//2
            ny2 = sy - 20
            self.screen.blit(ns, (nx2+1, ny2+1))
            self.screen.blit(nl, (nx2, ny2))

    def _draw_player(self):
        px = int(self.player_x * TILE_SIZE - self.cam_x)
        py = int(self.player_y * TILE_SIZE - self.cam_y)

        step = self.player_step
        d = self.player_dir

        # Sombra eliptica
        shadow = pygame.Surface((TILE_SIZE, 14), pygame.SRCALPHA)
        pygame.draw.ellipse(shadow, (0, 0, 0, 70), (4, 2, TILE_SIZE-8, 10))
        self.screen.blit(shadow, (px, py + TILE_SIZE - 10))

        # Intentar usar sprite del sheet
        frame = int(self.player_step * 2) % 4
        sprite = self.char_sprites.get_frame("player", d, frame) if self.char_sprites.loaded else None

        if sprite:
            self.screen.blit(sprite, (px, py))
        else:
            # Fallback: dibujar con primitivas
            leg1 = int(math.sin(step) * 5)
            leg2 = int(math.sin(step + math.pi) * 5)
            pygame.draw.rect(self.screen, (30, 50, 130),
                             pygame.Rect(px+10, py+30+leg1, 8, 12), border_radius=2)
            pygame.draw.rect(self.screen, (30, 50, 130),
                             pygame.Rect(px+22, py+30+leg2, 8, 12), border_radius=2)
            pygame.draw.rect(self.screen, (40, 30, 20),
                             pygame.Rect(px+9, py+40+leg1, 10, 4), border_radius=2)
            pygame.draw.rect(self.screen, (40, 30, 20),
                             pygame.Rect(px+21, py+40+leg2, 10, 4), border_radius=2)
            pygame.draw.rect(self.screen, (50, 90, 200),
                             pygame.Rect(px+8, py+16, 28, 18), border_radius=3)
            pygame.draw.rect(self.screen, (200, 60, 60),
                             pygame.Rect(px+18, py+16, 2, 18))
            arm1 = int(math.sin(step + math.pi) * 5)
            arm2 = int(math.sin(step) * 5)
            pygame.draw.rect(self.screen, (50, 90, 200),
                             pygame.Rect(px+2, py+16+arm1, 7, 16), border_radius=2)
            pygame.draw.rect(self.screen, (50, 90, 200),
                             pygame.Rect(px+35, py+16+arm2, 7, 16), border_radius=2)
            pygame.draw.circle(self.screen, (230, 190, 150), (px+6, py+32+arm1), 4)
            pygame.draw.circle(self.screen, (230, 190, 150), (px+38, py+32+arm2), 4)
            pygame.draw.circle(self.screen, (230, 190, 150), (px+22, py+11), 12)
            if d in ("down", "left", "right"):
                pygame.draw.circle(self.screen, (40, 25, 15), (px+17, py+10), 2)
                pygame.draw.circle(self.screen, (40, 25, 15), (px+27, py+10), 2)
                pygame.draw.arc(self.screen, (180, 100, 80),
                                pygame.Rect(px+17, py+13, 10, 6), math.pi, 0, 1)
            pygame.draw.ellipse(self.screen, (220, 40, 40),
                                pygame.Rect(px+9, py+1, 26, 10))
            pygame.draw.rect(self.screen, (220, 40, 40),
                             pygame.Rect(px+10, py-4, 24, 8), border_radius=3)
            if d == "down":
                pygame.draw.rect(self.screen, (180, 30, 30),
                                 pygame.Rect(px+6, py+6, 32, 4), border_radius=2)
            pygame.draw.rect(self.screen, (60, 40, 20),
                             pygame.Rect(px+9, py+12, 26, 3))

    def _get_day_overlay(self) -> tuple:
        """Interpola el color del overlay segun la hora del dia"""
        h = self.game_hour
        for i in range(len(DAY_CYCLE) - 1):
            h0, c0 = DAY_CYCLE[i]
            h1, c1 = DAY_CYCLE[i+1]
            if h0 <= h < h1:
                t = (h - h0) / (h1 - h0)
                return lerp_color(c0, c1, t)
        return DAY_CYCLE[0][1]

    def _draw_lighting(self):
        """Aplica el overlay de iluminacion del ciclo dia/noche"""
        overlay_col = self._get_day_overlay()
        if overlay_col[3] > 0:
            self._light_surf.fill(overlay_col)
            self.screen.blit(self._light_surf, (0, 0))

    def _draw_hud(self):
        SW = self.SW
        # Hora del dia
        h = int(self.game_hour)
        m = int((self.game_hour - h) * 60)
        is_day = 6 <= self.game_hour < 20
        time_icon = "☀" if is_day else "☾"
        time_str = f"{h:02d}:{m:02d}"

        font_hud = self.assets.font(16, bold=True)
        font_sm  = self.assets.font(14)

        # Panel superior izquierdo
        hud = pygame.Surface((220, 38), pygame.SRCALPHA)
        hud.fill((0, 0, 0, 140))
        pygame.draw.rect(hud, (255,255,255,30), (0,0,220,38), 1, border_radius=6)
        self.screen.blit(hud, (8, 8))

        area = font_hud.render("Villa Tranquimar", True, (255, 255, 255))
        self.screen.blit(area, (16, 14))

        # Panel de hora (superior derecho)
        thud = pygame.Surface((90, 38), pygame.SRCALPHA)
        thud.fill((0, 0, 0, 140))
        pygame.draw.rect(thud, (255,255,255,30), (0,0,90,38), 1, border_radius=6)
        self.screen.blit(thud, (SW - 100, 8))
        tc = (255, 220, 80) if is_day else (180, 200, 255)
        tl = font_hud.render(time_str, True, tc)
        self.screen.blit(tl, (SW - 94, 14))

        # Hint de controles
        hint = font_sm.render("Flechas: mover  |  Z: interactuar  |  Shift: correr", True, (200,220,255))
        hs = pygame.Surface((hint.get_width()+16, hint.get_height()+8), pygame.SRCALPHA)
        hs.fill((0,0,0,120))
        self.screen.blit(hs, (SW//2 - hs.get_width()//2, self.SH - 28))
        self.screen.blit(hint, (SW//2 - hint.get_width()//2, self.SH - 24))

    def _draw_dialogue(self):
        SW, SH = self.SW, self.SH
        BOX_H = 130

        # Fondo de caja de dialogo
        dlg = pygame.Surface((SW - 16, BOX_H), pygame.SRCALPHA)
        dlg.fill((8, 10, 22, 235))
        pygame.draw.rect(dlg, (80, 120, 200, 180), (0, 0, SW-16, BOX_H), 2, border_radius=10)
        # Borde interior decorativo
        pygame.draw.rect(dlg, (60, 90, 160, 100), (4, 4, SW-24, BOX_H-8), 1, border_radius=8)
        self.screen.blit(dlg, (8, SH - BOX_H - 8))

        # Nombre del NPC (con fondo)
        fn_surf = pygame.Surface((140, 26), pygame.SRCALPHA)
        fn_surf.fill((60, 90, 200, 200))
        pygame.draw.rect(fn_surf, (120, 160, 255, 180), (0,0,140,26), 1, border_radius=4)
        self.screen.blit(fn_surf, (20, SH - BOX_H - 8))
        fname = self.assets.font(15, bold=True)
        nl = fname.render(self.dialogue_name, True, (255, 230, 100))
        self.screen.blit(nl, (28, SH - BOX_H - 5))

        # Texto con maquina de escribir
        if self.dialogue_idx < len(self.dialogue_lines):
            full = self.dialogue_lines[self.dialogue_idx]
            visible = full[:int(self.dialogue_char)]

            ftxt = self.assets.font(17)
            # Salto de linea automatico
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

        # Indicador de continuar (triangulo parpadeante)
        if self.dialogue_char >= len(self.dialogue_lines[self.dialogue_idx] if self.dialogue_idx < len(self.dialogue_lines) else ""):
            if math.sin(self.time * 4) > 0:
                cx = SW - 30
                cy = SH - 20
                pygame.draw.polygon(self.screen, (255, 220, 80),
                                   [(cx, cy-6), (cx+10, cy-6), (cx+5, cy)])
