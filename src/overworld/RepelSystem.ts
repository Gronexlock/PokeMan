import { DialogueBoxPhaser } from '../ui/DialogueBoxPhaser';
import { AudioManager } from '../audio';

export type RepelType = 'repel' | 'super_repel' | 'max_repel';

export interface RepelConfig {
  steps: number;
  name: string;
}

export const REPEL_CONFIGS: Record<RepelType, RepelConfig> = {
  repel:       { steps: 100, name: 'Repelente' },
  super_repel: { steps: 200, name: 'Superrepelente' },
  max_repel:   { steps: 250, name: 'Máx. Repelente' }
};

/**
 * SISTEMA DE REPELENTES DE ANDARA
 *
 * Bloquea encuentros con Pokémon salvajes de nivel inferior o igual al
 * primer Pokémon del equipo mientras haya pasos restantes de repelente activo.
 */
export class RepelSystem {
  private activeRepel: RepelType | null = null;
  private stepsRemaining: number = 0;
  private dialogueBox?: DialogueBoxPhaser;

  constructor(dialogueBox?: DialogueBoxPhaser) {
    this.dialogueBox = dialogueBox;
  }

  /**
   * Aplica un repelente consumiéndolo del inventario.
   */
  public useRepel(type: RepelType): boolean {
    const config = REPEL_CONFIGS[type];
    if (!config) return false;

    this.activeRepel = type;
    this.stepsRemaining = config.steps;
    AudioManager.getInstance().playSfx('confirm');

    if (this.dialogueBox) {
      this.dialogueBox.startDialogue(
        '🎒 Mochila',
        [`¡Usaste un ${config.name}! Los Pokémon salvajes débiles no se acercarán durante ${config.steps} pasos.`]
      );
    }

    return true;
  }

  /**
   * Registra un paso caminado y comprueba si el efecto expiró.
   */
  public step(): boolean {
    if (!this.activeRepel || this.stepsRemaining <= 0) return false;

    this.stepsRemaining--;

    if (this.stepsRemaining === 0) {
      const expiredName = REPEL_CONFIGS[this.activeRepel]?.name || 'Repelente';
      this.activeRepel = null;

      if (this.dialogueBox) {
        this.dialogueBox.startDialogue(
          '🎒 Mochila',
          [`El efecto del ${expiredName} se ha agotado...`]
        );
      }
      return false;
    }

    return true;
  }

  /**
   * Determina si un encuentro salvaje debe ser bloqueado por el repelente.
   */
  public shouldBlockEncounter(wildLevel: number, leadPlayerLevel: number): boolean {
    if (!this.isActive) return false;
    return wildLevel <= leadPlayerLevel;
  }

  public get isActive(): boolean {
    return this.activeRepel !== null && this.stepsRemaining > 0;
  }

  public get currentSteps(): number {
    return this.stepsRemaining;
  }

  public get repelName(): string | null {
    return this.activeRepel ? REPEL_CONFIGS[this.activeRepel].name : null;
  }
}
