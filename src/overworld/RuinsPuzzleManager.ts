export type RuneType = 'sun' | 'moon' | 'earth';

export interface RunePillar {
  id: string;
  type: RuneType;
  currentSlot: number; // 0 a 3
  correctSlot: number;
}

/**
 * GESTOR DE PUZZLES DE LAS RUINAS ANCESTRALES DE CIUDAD CONDORINA
 *
 * Administra el rompecabezas de alinear las 3 piedras rúnicas andinas (Sol, Luna, Tierra)
 * sobre sus placas de presión para abrir la cámara secreta del Arca de Zygarde y MT85.
 */
export class RuinsPuzzleManager {
  private pillars: Map<string, RunePillar> = new Map();
  private puzzleSolved: boolean = false;

  constructor() {
    this.initPillars();
  }

  private initPillars(): void {
    const defaultPillars: RunePillar[] = [
      { id: 'pillar_sun',   type: 'sun',   currentSlot: 0, correctSlot: 1 },
      { id: 'pillar_moon',  type: 'moon',  currentSlot: 3, correctSlot: 2 },
      { id: 'pillar_earth', type: 'earth', currentSlot: 1, correctSlot: 3 }
    ];

    defaultPillars.forEach(p => this.pillars.set(p.id, p));
  }

  /**
   * Empuja un pilar rúnico al siguiente zócalo de presión.
   */
  public pushPillar(pillarId: string): { success: boolean; isSolved: boolean; message: string } {
    const pillar = this.pillars.get(pillarId);
    if (!pillar) return { success: false, isSolved: false, message: 'Pilar no encontrado.' };

    if (this.puzzleSolved) {
      return { success: true, isSolved: true, message: 'Las piedras rúnicas ya están en perfecta alineación.' };
    }

    // Rotar zócalo (0 -> 1 -> 2 -> 3 -> 0)
    pillar.currentSlot = (pillar.currentSlot + 1) % 4;

    const solved = this.checkSolution();
    if (solved) {
      this.puzzleSolved = true;
      return {
        success: true,
        isSolved: true,
        message: '¡El suelo tiembla suavemente! Las tres runas han encajado en sus placas y la Cámara Sagrada de Zygarde se ha abierto.'
      };
    }

    return {
      success: true,
      isSolved: false,
      message: `Empujaste el Pilar del ${pillar.type.toUpperCase()} a la posición ${pillar.currentSlot + 1}.`
    };
  }

  private checkSolution(): boolean {
    for (const p of this.pillars.values()) {
      if (p.currentSlot !== p.correctSlot) return false;
    }
    return true;
  }

  public get isSolved(): boolean {
    return this.puzzleSolved;
  }

  public getPillarState(id: string): RunePillar | undefined {
    return this.pillars.get(id);
  }
}
