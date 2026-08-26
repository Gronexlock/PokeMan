import * as Phaser from 'phaser';
import { BattlePokemon } from '../core/battle';
import { DialogueBoxPhaser } from '../ui/DialogueBoxPhaser';
import { AudioManager } from '../audio';

export type RodType = 'old_rod' | 'good_rod' | 'super_rod';

export interface FishingEncounter {
  speciesId: number;
  name: string;
  levelRange: [number, number];
  weight: number;
}

/**
 * GESTOR DE PESCA COSTERA Y FLUVIAL DE ANDARA
 *
 * Permite al jugador pescar frente a tiles de agua con Caña Vieja, Caña Buena o Supercaña.
 */
export class FishingManager {
  private scene: Phaser.Scene;
  private dialogueBox: DialogueBoxPhaser;
  private isFishing: boolean = false;

  static readonly FISHING_TABLES: Record<RodType, FishingEncounter[]> = {
    old_rod: [
      { speciesId: 129, name: 'Magikarp',  levelRange: [5, 10],  weight: 90 },
      { speciesId: 72,  name: 'Tentacool', levelRange: [5, 8],   weight: 10 }
    ],
    good_rod: [
      { speciesId: 60,  name: 'Poliwag',   levelRange: [15, 20], weight: 40 },
      { speciesId: 72,  name: 'Tentacool', levelRange: [15, 18], weight: 35 },
      { speciesId: 54,  name: 'Psyduck',   levelRange: [14, 18], weight: 25 }
    ],
    super_rod: [
      { speciesId: 130, name: 'Gyarados',  levelRange: [30, 35], weight: 40 },
      { speciesId: 318, name: 'Carvanha',  levelRange: [28, 33], weight: 35 },
      { speciesId: 349, name: 'Feebas',    levelRange: [25, 30], weight: 15 },
      { speciesId: 230, name: 'Kingdra',   levelRange: [35, 40], weight: 10 }
    ]
  };

  constructor(scene: Phaser.Scene, dialogueBox: DialogueBoxPhaser) {
    this.scene = scene;
    this.dialogueBox = dialogueBox;
  }

  /**
   * Inicia la secuencia de pesca en la orilla del agua.
   */
  public startFishing(rod: RodType, onBite: (encounter: FishingEncounter, level: number) => void): void {
    if (this.isFishing) return;
    this.isFishing = true;

    const rodNames: Record<RodType, string> = {
      old_rod: 'Caña Vieja',
      good_rod: 'Caña Buena',
      super_rod: 'Supercaña'
    };

    this.dialogueBox.startDialogue(
      '🎣 Pesca',
      [`Lanzaste el anzuelo con la ${rodNames[rod]}...`],
      () => {
        // Pausa de espera antes del pique
        this.scene.time.delayedCall(1200, () => {
          const success = Math.random() < 0.85; // 85% de probabilidad de pique

          if (!success) {
            this.dialogueBox.startDialogue('🎣 Pesca', ['No parece haber picado nada esta vez...'], () => {
              this.isFishing = false;
            });
            return;
          }

          // ¡Picó un Pokémon!
          AudioManager.getInstance().playSfx('exclamation');
          this.dialogueBox.startDialogue('🎣 Pesca', ['¡¡Oh!! ¡Un Pokémon ha picado el anzuelo!'], () => {
            this.isFishing = false;
            const candidates = FishingManager.FISHING_TABLES[rod];
            const chosen = candidates[Phaser.Math.Between(0, candidates.length - 1)];
            const level = Phaser.Math.Between(chosen.levelRange[0], chosen.levelRange[1]);
            onBite(chosen, level);
          });
        });
      }
    );
  }

  public get fishing(): boolean {
    return this.isFishing;
  }
}
