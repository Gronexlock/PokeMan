import * as Phaser from 'phaser';
import { DialogueBoxPhaser } from '../ui/DialogueBoxPhaser';
import { AudioManager } from '../audio';

export type ObstacleType = 'cut_tree' | 'rock_smash' | 'strength_boulder';

export interface FieldObstacle {
  id: string;
  x: number; // en píxeles
  y: number;
  type: ObstacleType;
  cleared?: boolean;
  sprite?: Phaser.GameObjects.Container;
}

/**
 * GESTOR DE OBSTÁCULOS DE CAMPO (CORTE, GOLPE ROCA, FUERZA)
 *
 * Administra árboles delgados que bloquean caminos, rocas agrietadas rompibles
 * y rocas pesadas empujables que ocultan atajos y cofres/Item Balls.
 */
export class FieldObstacleManager {
  private scene: Phaser.Scene;
  private dialogueBox: DialogueBoxPhaser;
  private obstacles: Map<string, FieldObstacle> = new Map();

  constructor(scene: Phaser.Scene, dialogueBox: DialogueBoxPhaser) {
    this.scene = scene;
    this.dialogueBox = dialogueBox;
  }

  /**
   * Instancia los obstáculos en el mapa.
   */
  public spawnObstacles(list: FieldObstacle[]): void {
    this.clearAll();

    for (const obs of list) {
      if (obs.cleared) continue;

      let container: Phaser.GameObjects.Container | undefined;
      if (this.scene?.add?.container) {
        container = this.scene.add.container(obs.x, obs.y);
        container.setDepth(9);

        if (this.scene.add.graphics) {
          const g = this.scene.add.graphics();
          if (obs.type === 'cut_tree') {
            // Árbol delgado con corteza y follaje
            g.fillStyle(0x795548, 1);
            g.fillRect(-6, -8, 12, 24);
            g.fillStyle(0x2e7d32, 1);
            g.fillCircle(0, -14, 16);
          } else if (obs.type === 'rock_smash') {
            // Roca agrietada
            g.fillStyle(0x9e9e9e, 1);
            g.fillRoundedRect(-14, -14, 28, 28, 6);
            g.lineStyle(2, 0x424242, 1);
            g.lineBetween(-6, -10, 4, 8);
          } else if (obs.type === 'strength_boulder') {
            // Roca pesada redonda
            g.fillStyle(0x757575, 1);
            g.fillCircle(0, 0, 16);
            g.lineStyle(3, 0x37474f, 1);
            g.strokeCircle(0, 0, 16);
          }
          container.add(g);
        }
      }

      obs.sprite = container;
      this.obstacles.set(obs.id, obs);
    }
  }

  /**
   * Intenta interactuar con un obstáculo de campo.
   */
  public tryInteract(obstacleId: string, facingDir?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'): boolean {
    const obs = this.obstacles.get(obstacleId);
    if (!obs || obs.cleared) return false;

    if (obs.type === 'cut_tree') {
      this.dialogueBox.startDialogue(
        '🌲 Árbol Delgado',
        ['¡Este árbol parece quebradizo!', '¿Quieres usar Corte para talarlo?'],
        () => {
          this.removeObstacle(obstacleId);
          AudioManager.getInstance().playSfx('confirm');
        }
      );
      return true;
    } else if (obs.type === 'rock_smash') {
      this.dialogueBox.startDialogue(
        '🪨 Roca Agrietada',
        ['¡Esta roca tiene fisuras profundas!', '¿Quieres usar Golpe Roca para romperla?'],
        () => {
          this.removeObstacle(obstacleId);
          AudioManager.getInstance().playSfx('bump');
        }
      );
      return true;
    } else if (obs.type === 'strength_boulder') {
      this.dialogueBox.startDialogue(
        '⛰️ Roca Pesada',
        ['¡Es una roca maciza!', '¡Usaste Fuerza para empujarla hacia adelante!'],
        () => {
          this.pushBoulder(obs, facingDir || 'DOWN');
          AudioManager.getInstance().playSfx('bump');
        }
      );
      return true;
    }

    return false;
  }

  /**
   * Elimina visual y lógicamente un obstáculo talado o roto.
   */
  public removeObstacle(obstacleId: string): void {
    const obs = this.obstacles.get(obstacleId);
    if (!obs) return;

    obs.cleared = true;
    if (obs.sprite) {
      if (this.scene?.tweens?.add) {
        this.scene.tweens.add({
          targets: obs.sprite,
          alpha: 0,
          scaleX: 0.2,
          scaleY: 0.2,
          duration: 300,
          onComplete: () => {
            obs.sprite?.destroy();
          }
        });
      } else {
        obs.sprite.destroy();
      }
    }
  }

  /**
   * Empuja una roca pesada 32 píxeles en la dirección especificada.
   */
  private pushBoulder(obs: FieldObstacle, dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'): void {
    if (!obs.sprite) return;

    const dx = dir === 'LEFT' ? -32 : dir === 'RIGHT' ? 32 : 0;
    const dy = dir === 'UP' ? -32 : dir === 'DOWN' ? 32 : 0;

    obs.x += dx;
    obs.y += dy;

    if (this.scene?.tweens?.add) {
      this.scene.tweens.add({
        targets: obs.sprite,
        x: obs.x,
        y: obs.y,
        duration: 300,
        ease: 'Quad.easeOut'
      });
    } else {
      obs.sprite.x = obs.x;
      obs.sprite.y = obs.y;
    }
  }

  public clearAll(): void {
    this.obstacles.forEach(o => o.sprite?.destroy());
    this.obstacles.clear();
  }

  public isObstacleAt(x: number, y: number, tolerance: number = 20): boolean {
    for (const obs of this.obstacles.values()) {
      if (!obs.cleared && Phaser.Math.Distance.Between(obs.x, obs.y, x, y) < tolerance) {
        return true;
      }
    }
    return false;
  }
}
