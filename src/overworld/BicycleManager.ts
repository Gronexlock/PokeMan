import * as Phaser from 'phaser';
import { DialogueBoxPhaser } from '../ui/DialogueBoxPhaser';
import { AudioManager } from '../audio';

/**
 * GESTOR DE LA BICICLETA DE ANDARA
 *
 * Duplica la velocidad del jugador en exteriores (de 130 a 260 px/s)
 * y puede ser alternada con la tecla 'B' o menú.
 */
export class BicycleManager {
  private scene: Phaser.Scene;
  private dialogueBox: DialogueBoxPhaser;
  private isBiking: boolean = false;
  private bKey!: Phaser.Input.Keyboard.Key;

  public readonly WALK_SPEED = 130;
  public readonly BIKE_SPEED = 260;

  constructor(scene: Phaser.Scene, dialogueBox: DialogueBoxPhaser) {
    this.scene = scene;
    this.dialogueBox = dialogueBox;

    if (this.scene.input && this.scene.input.keyboard) {
      this.bKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
      this.bKey.on('down', () => this.toggleBicycle());
    }
  }

  public toggleBicycle(): boolean {
    // No montar en interiores o mientras dialoga
    if (this.dialogueBox && this.dialogueBox.isDialogueActive()) return this.isBiking;

    this.isBiking = !this.isBiking;

    if (this.isBiking) {
      AudioManager.getInstance().playSfx('confirm');
    } else {
      AudioManager.getInstance().playSfx('cancel');
    }

    return this.isBiking;
  }

  public get currentSpeed(): number {
    return this.isBiking ? this.BIKE_SPEED : this.WALK_SPEED;
  }

  public get biking(): boolean {
    return this.isBiking;
  }

  public setBiking(value: boolean): void {
    this.isBiking = value;
  }
}
