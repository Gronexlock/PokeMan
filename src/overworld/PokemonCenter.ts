import * as Phaser from 'phaser';
import { BattlePokemon } from '../core/battle';
import { DialogueBoxPhaser } from '../ui/DialogueBoxPhaser';

/**
 * Sistema del Centro Pokémon.
 *
 * Responsabilidades:
 * - Diálogo de la Enfermera Joy.
 * - Animación de curación: Pokémon en cápsulas que se iluminan y devuelven la vida.
 * - Restaurar HP, PP y estado de todo el equipo al 100%.
 */
export class PokemonCenter {
  private scene: Phaser.Scene;
  private dialogueBox: DialogueBoxPhaser;

  // Sprites de la máquina de curación (cápsulas)
  private healingMachineContainer!: Phaser.GameObjects.Container;
  private capsuleGraphics: Phaser.GameObjects.Graphics[] = [];
  private isHealing: boolean = false;

  constructor(scene: Phaser.Scene, dialogueBox: DialogueBoxPhaser) {
    this.scene = scene;
    this.dialogueBox = dialogueBox;
  }

  /**
   * Inicia la secuencia completa de curación:
   * 1. Diálogo de bienvenida de Joy.
   * 2. Animación de la máquina (cápsulas brillando).
   * 3. Restauración del equipo en memoria.
   * 4. Diálogo de devolución del equipo curado.
   *
   * @param party - Equipo actual del jugador (se muta directamente en HP/PP).
   * @param onComplete - Callback cuando la curación termina por completo.
   */
  public startHealingSequence(party: BattlePokemon[], onComplete?: () => void): void {
    if (this.isHealing) return;
    this.isHealing = true;

    // Fase 1: Diálogo de recepción
    this.dialogueBox.startDialogue(
      '👩‍⚕️ Enfermera Joy',
      [
        '¡Bienvenido al Centro Pokémon!',
        'Aquí restauramos a tus Pokémon a su plena salud.',
        '¿Puedo curar a tu equipo?'
      ],
      () => {
        // Fase 2: Animar la máquina y curar
        this.scene.time.delayedCall(400, () => {
          this.playHealAnimation(party, () => {
            // Fase 3: Diálogo de entrega
            this.dialogueBox.startDialogue(
              '👩‍⚕️ Enfermera Joy',
              [
                '¡Tus Pokémon han recuperado la salud!',
                'Esperamos verte de nuevo. ¡Que tengas un buen viaje!'
              ],
              () => {
                this.isHealing = false;
                onComplete?.();
              }
            );
          });
        });
      }
    );
  }

  /**
   * Anima las cápsulas de curación y restaura los datos del equipo al completarse.
   */
  private playHealAnimation(party: BattlePokemon[], onDone: () => void): void {
    const { width, height } = this.scene.scale;
    const cx = width / 2, cy = height / 2 + 40;
    const capsuleCount = Math.min(party.length, 6);
    const capsuleSpacing = 52;

    // Crear contenedor de cápsulas centrado en pantalla
    const container = this.scene.add.container(cx - (capsuleCount * capsuleSpacing) / 2, cy);
    container.setDepth(50);

    const capsuleGfx: Phaser.GameObjects.Graphics[] = [];

    for (let i = 0; i < capsuleCount; i++) {
      const g = this.scene.add.graphics();
      g.x = i * capsuleSpacing + capsuleSpacing / 2;

      // Cápsula base (blanca/gris)
      g.fillStyle(0xecf0f1, 1);
      g.fillRoundedRect(-18, -30, 36, 60, 10);
      g.lineStyle(2, 0x95a5a6, 1);
      g.strokeRoundedRect(-18, -30, 36, 60, 10);

      // Poké Ball dentro de la cápsula
      g.fillStyle(0xe74c3c, 1);
      g.fillCircle(0, -10, 12);
      g.fillStyle(0xffffff, 1);
      g.fillRect(-12, -11, 24, 12);
      g.lineStyle(2, 0x2c3e50, 1);
      g.strokeCircle(0, -10, 12);

      container.add(g);
      capsuleGfx.push(g);
    }

    this.capsuleGraphics = capsuleGfx;
    this.healingMachineContainer = container;

    // Jingle de curación: flash del borde de la cámara en azul claro
    this.scene.cameras.main.flash(200, 173, 216, 230);

    // Secuencia: las cápsulas se iluminan una a una (de izquierda a derecha)
    let i = 0;
    const illuminateNext = () => {
      if (i >= capsuleCount) {
        // Todas iluminadas — esperar un momento y curar
        this.scene.time.delayedCall(800, () => {
          // Flash blanco de curación
          this.scene.cameras.main.flash(600, 255, 255, 255);

          // *** Restaurar datos del equipo ***
          this.healParty(party);

          // Desvanecer cápsulas
          this.scene.tweens.add({
            targets: container,
            alpha: 0,
            delay: 300,
            duration: 500,
            ease: 'Linear',
            onComplete: () => {
              container.destroy();
              onDone();
            }
          });
        });
        return;
      }

      const cap = capsuleGfx[i];

      // Tween de pulsación con brillo amarillo (simula activación de energía)
      this.scene.tweens.add({
        targets: cap,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 200,
        yoyo: true,
        ease: 'Sine.easeInOut',
        onStart: () => {
          cap.clear();
          // Cápsula iluminada (dorada)
          cap.fillStyle(0xf1c40f, 1);
          cap.fillRoundedRect(-18, -30, 36, 60, 10);
          cap.lineStyle(3, 0xd35400, 1);
          cap.strokeRoundedRect(-18, -30, 36, 60, 10);
          cap.fillStyle(0xe74c3c, 1);
          cap.fillCircle(0, -10, 12);
          cap.fillStyle(0xffffff, 1);
          cap.fillRect(-12, -11, 24, 12);
          cap.lineStyle(2, 0x2c3e50, 1);
          cap.strokeCircle(0, -10, 12);
        },
        onComplete: () => {
          i++;
          this.scene.time.delayedCall(180, illuminateNext);
        }
      });
    };

    illuminateNext();
  }

  /**
   * Restaura los PS, PP y estado de todo el equipo al 100%.
   */
  private healParty(party: BattlePokemon[]): void {
    for (const pkmn of party) {
      pkmn.currentHp = pkmn.maxHp;
      for (const move of pkmn.moves) {
        if (move.maxPp !== undefined) {
          move.pp = move.maxPp;
        }
      }
    }
  }

  public get healing(): boolean {
    return this.isHealing;
  }
}
