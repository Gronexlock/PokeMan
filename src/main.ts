import './style.css';
import * as Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';

/**
 * Punto de entrada principal de Pokémon: Ecos de Andara (Phaser 3 + TypeScript).
 */
class PokemonGameLauncher {
  private static instance: PokemonGameLauncher;
  public game!: Phaser.Game;

  private constructor() {
    this.init();
  }

  public static launch(): PokemonGameLauncher {
    if (!PokemonGameLauncher.instance) {
      PokemonGameLauncher.instance = new PokemonGameLauncher();
    }
    return PokemonGameLauncher.instance;
  }

  private init(): void {
    // Iniciar Phaser 3
    this.game = new Phaser.Game(gameConfig);
    (window as any).__PHASER_GAME__ = this.game;

    // Configurar controles HTML táctiles y herramientas
    this.setupHtmlControls();

    console.log(
      '%c🎮 POKÉMON: ECOS DE ANDARA %c— Motor Phaser 3 inicializado con éxito.',
      'background: #0284c7; color: #ffffff; font-weight: bold; padding: 4px 8px; border-radius: 4px;',
      'color: #38bdf8; font-weight: bold;'
    );
  }

  /**
   * Conecta los botones táctiles y de herramientas de index.html a eventos de Phaser.
   */
  private setupHtmlControls(): void {
    // 1. Alternador de Filtro CRT
    const crtBtn = document.getElementById('toggle-crt');
    const crtOverlay = document.getElementById('crt-overlay');
    crtBtn?.addEventListener('click', () => {
      crtOverlay?.classList.toggle('active');
    });

    // 2. D-Pad Táctil para Móviles / Tablets
    const dpadButtons = document.querySelectorAll<HTMLButtonElement>('.dpad-btn');
    dpadButtons.forEach((btn) => {
      const dir = btn.getAttribute('data-dir');
      const keyMap: Record<string, string> = {
        up: 'ArrowUp',
        down: 'ArrowDown',
        left: 'ArrowLeft',
        right: 'ArrowRight'
      };
      if (dir && keyMap[dir]) {
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          window.dispatchEvent(new KeyboardEvent('keydown', { code: keyMap[dir], key: keyMap[dir] }));
        });
        btn.addEventListener('touchend', (e) => {
          e.preventDefault();
          window.dispatchEvent(new KeyboardEvent('keyup', { code: keyMap[dir], key: keyMap[dir] }));
        });
      }
    });

    // 3. Botones A y B Táctiles
    const btnA = document.getElementById('btn-a');
    btnA?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ' }));
    });
    btnA?.addEventListener('touchend', (e) => {
      e.preventDefault();
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ' }));
    });

    const btnB = document.getElementById('btn-b');
    btnB?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyX', key: 'x' }));
    });
    btnB?.addEventListener('touchend', (e) => {
      e.preventDefault();
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyX', key: 'x' }));
    });
  }
}

// Arrancar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PokemonGameLauncher.launch());
} else {
  PokemonGameLauncher.launch();
}
