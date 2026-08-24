"""
battle_renderer.py  —  Renderizador visual de combates Pokemon
Muestra sprites reales (de PokeAPI), barras de HP animadas, menus de combate
"""
import math
import pygame
from src.graphics.asset_manager import AssetManager


# ── Constantes de layout ──────────────────────────────────────────────────────
SW, SH = 960, 640

ENEMY_SPRITE_RECT  = pygame.Rect(520, 60,  240, 240)
PLAYER_SPRITE_RECT = pygame.Rect(150, 270, 240, 240)

ENEMY_HUD_RECT  = pygame.Rect(30,  30,  340, 80)
PLAYER_HUD_RECT = pygame.Rect(560, 340, 360, 100)

MENU_RECT   = pygame.Rect(0, 480, SW, SH - 480)
MSG_RECT    = pygame.Rect(0, 480, 640, SH - 480)
FIGHT_RECT  = pygame.Rect(640, 480, 320, SH - 480)

MOVE_SLOTS  = [
    pygame.Rect(640,  480, 160, 80),
    pygame.Rect(800,  480, 160, 80),
    pygame.Rect(640,  560, 160, 80),
    pygame.Rect(800,  560, 160, 80),
]

# Colores del bioma de fondo
BIOME_SKIES = {
    "bosque":    ((34,  85,  34),  (100, 180, 100)),
    "costa":     ((30,  80,  160), (120, 200, 230)),
    "montanas":  ((60,  60,  90),  (180, 160, 140)),
    "ciudad":    ((40,  40,  60),  (120, 120, 160)),
    "cueva":     ((20,  20,  30),  (60,  60,  80)),
    "desierto":  ((180, 140, 60),  (240, 210, 140)),
    "default":   ((30,  50,  100), (80,  130, 200)),
}

TYPE_MOVE_COLORS = {
    "normal":   (168, 168, 120), "fire":    (240, 128, 48),
    "water":    (104, 144, 240), "grass":   (120, 200, 80),
    "electric": (248, 208, 48),  "ice":     (152, 216, 216),
    "fighting": (192, 48,  40),  "poison":  (160, 64,  160),
    "ground":   (224, 192, 104), "flying":  (168, 144, 240),
    "psychic":  (248, 88,  136), "bug":     (168, 184, 32),
    "rock":     (184, 160, 56),  "ghost":   (112, 88,  152),
    "dragon":   (112, 56,  248), "dark":    (112, 88,  72),
    "steel":    (184, 184, 208), "fairy":   (238, 153, 172),
}


class BattleRenderer:
    """Renderiza la pantalla de combate completa con sprites de PokeAPI"""

    def __init__(self, screen: pygame.Surface, assets: AssetManager):
        self.screen = screen
        self.assets = assets
        self.time   = 0.0

        # Estado de la batalla recibido del motor de juego
        self.state: dict = {}

        # Animaciones
        self._enemy_anim_y    = 0.0   # rebote del sprite enemigo
        self._player_anim_y   = 0.0
        self._hp_anim_enemy   = 1.0   # 0.0 – 1.0 porcentaje actual animado
        self._hp_anim_player  = 1.0
        self._hp_target_enemy  = 1.0
        self._hp_target_player = 1.0
        self._shake_timer     = 0.0
        self._shake_offset    = (0, 0)
        self._message_queue:  list[str] = []
        self._message_timer   = 0.0
        self._current_msg     = ""
        self._selected_move   = 0
        self._in_fight_menu   = False
        self._mega_anim       = 0.0   # brillo de Mega Evolucion

        # Superficies pre-renderizadas
        self._bg_surf: pygame.Surface = None
        self._last_biome = ""

    # ── API publica ───────────────────────────────────────────────────────────

    def set_battle_state(self, state: dict):
        """Recibe el estado del motor de batalla y lo refleja en pantalla"""
        self.state = state
        # Actualizar objetivos HP
        ep = state.get("enemy_pokemon", {})
        pp = state.get("player_pokemon", {})
        if ep:
            self._hp_target_enemy = ep.get("current_hp", 0) / max(ep.get("max_hp", 1), 1)
        if pp:
            self._hp_target_player = pp.get("current_hp", 0) / max(pp.get("max_hp", 1), 1)

    def push_message(self, msg: str):
        self._message_queue.append(msg)

    def trigger_shake(self, duration: float = 0.4):
        self._shake_timer = duration

    def set_fight_menu(self, active: bool):
        self._in_fight_menu = active

    def select_move(self, delta: int):
        n = len(self.state.get("player_pokemon", {}).get("moves", []))
        self._selected_move = (self._selected_move + delta) % max(n, 1)

    def trigger_mega(self):
        self._mega_anim = 1.5

    # ── Actualizacion ─────────────────────────────────────────────────────────

    def update(self, dt: float):
        self.time += dt

        # Suavizar HP
        speed = 0.8
        self._hp_anim_enemy  += (self._hp_target_enemy  - self._hp_anim_enemy)  * min(speed * dt * 60, 1)
        self._hp_anim_player += (self._hp_target_player - self._hp_anim_player) * min(speed * dt * 60, 1)

        # Rebote sprites
        self._enemy_anim_y  = math.sin(self.time * 1.2) * 4
        self._player_anim_y = math.sin(self.time * 1.0 + 1.0) * 3

        # Shake
        if self._shake_timer > 0:
            self._shake_timer -= dt
            amp = int(self._shake_timer * 20)
            import random
            self._shake_offset = (random.randint(-amp, amp), random.randint(-amp, amp))
        else:
            self._shake_offset = (0, 0)

        # Mega anim
        if self._mega_anim > 0:
            self._mega_anim -= dt

        # Mensajes
        if self._message_timer > 0:
            self._message_timer -= dt
        elif self._message_queue:
            self._current_msg = self._message_queue.pop(0)
            self._message_timer = 2.5

    # ── Render ────────────────────────────────────────────────────────────────

    def render(self):
        biome = self.state.get("biome", "default")
        self._draw_background(biome)
        self._draw_platforms()

        ep = self.state.get("enemy_pokemon")
        pp = self.state.get("player_pokemon")

        if ep:
            self._draw_pokemon_sprite(ep, ENEMY_SPRITE_RECT,
                                      facing="front",
                                      bob=self._enemy_anim_y,
                                      mega=self.state.get("enemy_mega", False))
            self._draw_hud(ep, ENEMY_HUD_RECT, is_player=False,
                           hp_anim=self._hp_anim_enemy)

        if pp:
            ox, oy = self._shake_offset
            rect = PLAYER_SPRITE_RECT.move(ox, oy)
            self._draw_pokemon_sprite(pp, rect,
                                      facing="back",
                                      bob=self._player_anim_y,
                                      mega=self.state.get("player_mega", False))
            self._draw_hud(pp, PLAYER_HUD_RECT, is_player=True,
                           hp_anim=self._hp_anim_player)

        self._draw_menu(pp)
        self._draw_message_box()

        if self._mega_anim > 0:
            self._draw_mega_flash()

    # ── Fondo ─────────────────────────────────────────────────────────────────

    def _draw_background(self, biome: str):
        if biome != self._last_biome or self._bg_surf is None:
            self._bg_surf = self._make_bg(biome)
            self._last_biome = biome
        self.screen.blit(self._bg_surf, (0, 0))

    def _make_bg(self, biome: str) -> pygame.Surface:
        top, bot = BIOME_SKIES.get(biome, BIOME_SKIES["default"])
        surf = pygame.Surface((SW, SH))
        for y in range(SH):
            t = y / SH
            r = int(top[0] + (bot[0] - top[0]) * t)
            g = int(top[1] + (bot[1] - top[1]) * t)
            b = int(top[2] + (bot[2] - top[2]) * t)
            pygame.draw.line(surf, (r, g, b), (0, y), (SW, y))
        return surf

    def _draw_platforms(self):
        # Plataforma enemiga (elipse superior derecha)
        pygame.draw.ellipse(self.screen, (60, 100, 60, 200),
                            pygame.Rect(450, 270, 260, 50))
        pygame.draw.ellipse(self.screen, (40, 80, 40),
                            pygame.Rect(450, 270, 260, 50), 2)
        # Plataforma jugador (elipse inferior izquierda)
        pygame.draw.ellipse(self.screen, (80, 120, 80, 200),
                            pygame.Rect(60, 470, 320, 60))
        pygame.draw.ellipse(self.screen, (60, 100, 60),
                            pygame.Rect(60, 470, 320, 60), 2)

    # ── Sprites Pokemon ───────────────────────────────────────────────────────

    def _draw_pokemon_sprite(self, poke: dict, rect: pygame.Rect,
                             facing: str, bob: float, mega: bool):
        pid = poke.get("id", 1)
        types = poke.get("types", ["normal"])

        variant = "battle_animated" if facing == "front" else "battle_animated"
        size = (rect.width, rect.height)
        sprite = self.assets.get_pokemon_sprite_with_type(pid, types, variant, size)

        dest = rect.copy()
        dest.y += int(bob)

        # Halo de Mega Evolucion
        if mega:
            halo = pygame.Surface((rect.width + 20, rect.height + 20), pygame.SRCALPHA)
            pulse = abs(math.sin(self.time * 3)) * 80 + 60
            pygame.draw.ellipse(halo, (255, 215, 0, int(pulse)),
                                (0, 0, rect.width + 20, rect.height + 20))
            self.screen.blit(halo, (dest.x - 10, dest.y - 10))

        if facing == "back":
            sprite = pygame.transform.flip(sprite, True, False)

        self.screen.blit(sprite, dest)

        # Brillo de aparicion
        if poke.get("just_appeared"):
            overlay = pygame.Surface(size, pygame.SRCALPHA)
            overlay.fill((255, 255, 255, 120))
            self.screen.blit(overlay, dest)

    # ── HUD ───────────────────────────────────────────────────────────────────

    def _draw_hud(self, poke: dict, rect: pygame.Rect,
                  is_player: bool, hp_anim: float):
        # Fondo del HUD
        hud = pygame.Surface((rect.width, rect.height), pygame.SRCALPHA)
        hud.fill((20, 20, 30, 210))
        pygame.draw.rect(hud, (255, 255, 255, 40), (0, 0, rect.width, rect.height), 1,
                         border_radius=8)
        self.screen.blit(hud, rect)

        font_big  = self.assets.font(20, bold=True)
        font_sm   = self.assets.font(15)

        # Nombre + nivel
        name  = poke.get("name", "???")
        level = poke.get("level", 1)
        mega  = " (MEGA)" if poke.get("is_mega") else ""
        label = font_big.render(f"{name}{mega}  Nv.{level}", True, (255, 255, 255))
        self.screen.blit(label, (rect.x + 8, rect.y + 8))

        # Tipos
        tx = rect.x + 8
        for t in poke.get("types", []):
            badge = self.assets.get_type_badge(t, (52, 16))
            self.screen.blit(badge, (tx, rect.y + 32))
            tx += 58

        # Barra HP
        hp_w = rect.width - 16
        bar_y = rect.y + 55
        bar_rect = pygame.Rect(rect.x + 8, bar_y, hp_w, 12)

        # Fondo barra
        pygame.draw.rect(self.screen, (50, 50, 50), bar_rect, border_radius=6)

        # Color segun porcentaje
        if hp_anim > 0.5:   col = (80, 220, 80)
        elif hp_anim > 0.2: col = (240, 200, 40)
        else:                col = (220, 60,  60)

        fill_w = max(0, int(hp_w * hp_anim))
        if fill_w > 0:
            pygame.draw.rect(self.screen, col,
                             pygame.Rect(bar_rect.x, bar_rect.y, fill_w, 12),
                             border_radius=6)
        pygame.draw.rect(self.screen, (255, 255, 255, 80), bar_rect, 1, border_radius=6)

        # Numeros HP (solo jugador)
        if is_player:
            curr = poke.get("current_hp", 0)
            maxh = poke.get("max_hp", 1)
            hp_txt = font_sm.render(f"{curr} / {maxh}", True, (220, 220, 220))
            self.screen.blit(hp_txt, (rect.x + 8, bar_y + 15))

        # Estado (paralizado, dormido, etc.)
        status = poke.get("status")
        if status:
            STATUS_COLORS = {
                "burned":    (240, 100, 40),
                "poisoned":  (160, 60,  160),
                "paralyzed": (240, 200, 40),
                "frozen":    (120, 200, 240),
                "asleep":    (160, 140, 100),
            }
            sc = STATUS_COLORS.get(status, (180, 180, 180))
            st_surf = pygame.Surface((60, 16), pygame.SRCALPHA)
            st_surf.fill((*sc, 200))
            st_label = font_sm.render(status[:3].upper(), True, (255, 255, 255))
            st_surf.blit(st_label, (4, 1))
            self.screen.blit(st_surf, (rect.right - 68, rect.y + 8))

    # ── Menu de combate ───────────────────────────────────────────────────────

    def _draw_menu(self, pp: dict):
        # Fondo del menu inferior
        menu_surf = pygame.Surface((SW, SH - 480), pygame.SRCALPHA)
        menu_surf.fill((15, 15, 25, 230))
        pygame.draw.rect(menu_surf, (255, 255, 255, 30), (0, 0, SW, SH - 480), 1)
        self.screen.blit(menu_surf, (0, 480))

        if self._in_fight_menu and pp:
            moves = pp.get("moves", [])
            for i, slot in enumerate(MOVE_SLOTS):
                if i >= len(moves):
                    break
                move = moves[i]
                mtype = move.get("type", "normal")
                col   = TYPE_MOVE_COLORS.get(mtype, (168, 168, 120))

                selected = (i == self._selected_move)
                alpha = 230 if selected else 160
                ms = pygame.Surface((slot.width, slot.height), pygame.SRCALPHA)
                ms.fill((*col, alpha))
                if selected:
                    pygame.draw.rect(ms, (255, 255, 255, 180),
                                     (0, 0, slot.width, slot.height), 2, border_radius=4)
                self.screen.blit(ms, slot)

                font_m = self.assets.font(16, bold=selected)
                mname = move.get("name", "???").replace("_", " ").title()
                ml = font_m.render(mname, True, (255, 255, 255))
                self.screen.blit(ml, (slot.x + 8, slot.y + 8))

                pp_txt = self.assets.font(13).render(
                    f"PP {move.get('current_pp', 0)}/{move.get('max_pp', 0)}", True, (230, 230, 230))
                self.screen.blit(pp_txt, (slot.x + 8, slot.y + 30))

                badge = self.assets.get_type_badge(mtype, (50, 16))
                self.screen.blit(badge, (slot.x + 8, slot.y + 50))
        else:
            # Menu principal LUCHAR / MOCHILA / POKEMON / HUIR
            labels = ["LUCHAR", "MOCHILA", "POKEMON", "HUIR"]
            colors = [(220, 60, 60), (80, 160, 230), (80, 200, 80), (220, 180, 40)]
            bw, bh = 230, 74
            for i, (lbl, col) in enumerate(zip(labels, colors)):
                bx = 4 + i * (bw + 4)
                bs = pygame.Surface((bw, bh), pygame.SRCALPHA)
                bs.fill((*col, 180))
                pygame.draw.rect(bs, (255, 255, 255, 60), (0, 0, bw, bh), 1, border_radius=6)
                self.screen.blit(bs, (bx, 483))
                font_b = self.assets.font(22, bold=True)
                bl = font_b.render(lbl, True, (255, 255, 255))
                self.screen.blit(bl, (bx + bw//2 - bl.get_width()//2, 483 + bh//2 - bl.get_height()//2))

    # ── Caja de mensajes ──────────────────────────────────────────────────────

    def _draw_message_box(self):
        if not self._current_msg:
            return
        # Solo en el menu principal (no fight)
        if self._in_fight_menu:
            return

        msg_surf = pygame.Surface((640, 160), pygame.SRCALPHA)
        msg_surf.fill((10, 10, 20, 200))
        pygame.draw.rect(msg_surf, (255, 255, 255, 60), (0, 0, 640, 160), 1, border_radius=8)
        font_msg = self.assets.font(20)

        # Texto con salto de linea automatico
        words = self._current_msg.split(" ")
        lines, line = [], ""
        for w in words:
            test = (line + " " + w).strip()
            if font_msg.size(test)[0] < 600:
                line = test
            else:
                lines.append(line)
                line = w
        if line:
            lines.append(line)

        for i, ln in enumerate(lines[:4]):
            rendered = font_msg.render(ln, True, (255, 255, 255))
            msg_surf.blit(rendered, (12, 12 + i * 30))

        self.screen.blit(msg_surf, (0, 480))

    # ── Flash Mega Evolucion ──────────────────────────────────────────────────

    def _draw_mega_flash(self):
        alpha = int(min(self._mega_anim / 1.5, 1.0) * 200)
        flash = pygame.Surface((SW, SH), pygame.SRCALPHA)
        flash.fill((255, 215, 0, alpha))
        self.screen.blit(flash, (0, 0))

        if self._mega_anim > 1.0:
            font_mega = self.assets.font(52, bold=True)
            txt = font_mega.render("MEGA EVOLUCION!", True, (255, 255, 255))
            sx = SW // 2 - txt.get_width() // 2
            sy = SH // 2 - txt.get_height() // 2
            # Sombra
            shadow = font_mega.render("MEGA EVOLUCION!", True, (80, 40, 0))
            self.screen.blit(shadow, (sx + 3, sy + 3))
            self.screen.blit(txt, (sx, sy))
