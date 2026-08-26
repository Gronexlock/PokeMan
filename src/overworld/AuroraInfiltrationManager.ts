import { BattlePokemon } from '../core/battle';

export interface AuroraTerminal {
  id: string;
  name: string;
  deactivated: boolean;
  securityCode: string;
}

export interface AuroraCommander {
  id: string;
  name: string;
  title: string;
  dialogueBefore: string[];
  dialogueAfter: string[];
  team: BattlePokemon[];
  defeated: boolean;
}

/**
 * GESTOR DE INFILTRACIÓN EN LAS BASES DEL PROYECTO AURORA CERO
 *
 * Administra las mazmorras e infiltraciones de la historia:
 * 1. Laboratorio Subterráneo de Metrópolis Solsticio (desactivar 3 terminales y liberar Pokémon).
 * 2. Central Geotérmica del Paso Vulcania (enfrentar a los 3 Comandantes de Aurora Cero: Ignis, Umbra, Alister).
 */
export class AuroraInfiltrationManager {
  private terminals: Map<string, AuroraTerminal> = new Map();
  private commanders: Map<string, AuroraCommander> = new Map();
  private pokemonReleasedCount: number = 0;

  constructor() {
    this.initSolsticioLab();
    this.initVulcaniaCommanders();
  }

  private initSolsticioLab(): void {
    const defaultTerminals: AuroraTerminal[] = [
      { id: 'term_alfa',  name: 'Terminal Alfa (Generador Telúrico)', deactivated: false, securityCode: 'AURORA_01' },
      { id: 'term_beta',  name: 'Terminal Beta (Contención de Células)', deactivated: false, securityCode: 'AURORA_02' },
      { id: 'term_gamma', name: 'Terminal Gamma (Puerta del Núcleo)',  deactivated: false, securityCode: 'AURORA_03' }
    ];
    defaultTerminals.forEach(t => this.terminals.set(t.id, t));
  }

  private initVulcaniaCommanders(): void {
    const list: AuroraCommander[] = [
      {
        id: 'cmd_ignis',
        name: 'Comandante Ignis',
        title: 'Comandante de Fuego de Aurora Cero',
        defeated: false,
        dialogueBefore: [
          '¡El calor de este volcán purificará la arrogancia humana!',
          'Alister nos prometió un nuevo comienzo con la energía de Eternatus.',
          '¡No permitiré que un simple entrenador interfiera!'
        ],
        dialogueAfter: [
          'Mis llamas se han extinguido... pero Alister ya casi completa la sobrecarga.'
        ],
        team: [
          {
            id: 229, name: 'Houndoom', types: ['dark', 'fire'], level: 48,
            currentHp: 150, maxHp: 150, attack: 110, defense: 80, speed: 115,
            moves: [
              { id: 'flamethrower', name: 'Lanzallamas', type: 'fire', category: 'special', power: 90, accuracy: 100, pp: 15, maxPp: 15 },
              { id: 'dark_pulse', name: 'Pulso Umbrío', type: 'dark', category: 'special', power: 80, accuracy: 100, pp: 15, maxPp: 15 }
            ]
          },
          {
            id: 467, name: 'Magmortar', types: ['fire'], level: 49,
            currentHp: 160, maxHp: 160, attack: 120, defense: 90, speed: 95,
            moves: [
              { id: 'fire_blast', name: 'Llamarada', type: 'fire', category: 'special', power: 110, accuracy: 85, pp: 5, maxPp: 5 },
              { id: 'thunderbolt', name: 'Rayo', type: 'electric', category: 'special', power: 90, accuracy: 100, pp: 15, maxPp: 15 }
            ]
          }
        ]
      },
      {
        id: 'cmd_umbra',
        name: 'Comandante Umbra',
        title: 'Comandante de Sombras de Aurora Cero',
        defeated: false,
        dialogueBefore: [
          'Te adentraste demasiado en la oscuridad, campeón.',
          'El equilibrio de este mundo está roto sin remedio.',
          '¡Prepárate para ser consumido por las sombras!'
        ],
        dialogueAfter: [
          'Incluso en la derrota... el vórtice cósmico ya ha comenzado a abrirse.'
        ],
        team: [
          {
            id: 452, name: 'Drapion', types: ['poison', 'dark'], level: 49,
            currentHp: 155, maxHp: 155, attack: 115, defense: 130, speed: 110,
            moves: [
              { id: 'cross_poison', name: 'Veneno X', type: 'poison', category: 'physical', power: 70, accuracy: 100, pp: 20, maxPp: 20 },
              { id: 'crunch', name: 'Triturar', type: 'dark', category: 'physical', power: 80, accuracy: 100, pp: 15, maxPp: 15 }
            ]
          },
          {
            id: 94, name: 'Gengar', types: ['ghost', 'poison'], level: 50,
            currentHp: 140, maxHp: 140, attack: 85, defense: 80, speed: 130,
            moves: [
              { id: 'shadow_ball', name: 'Bola Sombra', type: 'ghost', category: 'special', power: 80, accuracy: 100, pp: 15, maxPp: 15 },
              { id: 'sludge_bomb', name: 'Bomba Lodo', type: 'poison', category: 'special', power: 90, accuracy: 100, pp: 10, maxPp: 10 }
            ]
          }
        ]
      },
      {
        id: 'leader_alister',
        name: 'Líder Alister',
        title: 'Líder Supremo de Aurora Cero',
        defeated: false,
        dialogueBefore: [
          'La humanidad ha tenido siglos para coexistir en armonía y solo ha traído explotación.',
          'Con la energía cósmica de Eternatus, reiniciaremos la biosfera de Andara desde cero.',
          '¡Observa el auténtico poder de nuestra convicción!'
        ],
        dialogueAfter: [
          '¡No... no comprendes! La brecha dimensional se ha salido de control...',
          '¡Eternatus no obedece a nada ni a nadie!'
        ],
        team: [
          {
            id: 635, name: 'Hydreigon', types: ['dark', 'dragon'], level: 53,
            currentHp: 175, maxHp: 175, attack: 125, defense: 105, speed: 118,
            moves: [
              { id: 'dragon_pulse', name: 'Pulso Dragón', type: 'dragon', category: 'special', power: 85, accuracy: 100, pp: 10, maxPp: 10 },
              { id: 'dark_pulse', name: 'Pulso Umbrío', type: 'dark', category: 'special', power: 80, accuracy: 100, pp: 15, maxPp: 15 },
              { id: 'flash_cannon', name: 'Foco Resplandor', type: 'steel', category: 'special', power: 80, accuracy: 100, pp: 10, maxPp: 10 }
            ]
          },
          {
            id: 248, name: 'Tyranitar', types: ['rock', 'dark'], level: 54,
            currentHp: 190, maxHp: 190, attack: 160, defense: 130, speed: 85,
            moves: [
              { id: 'stone_edge', name: 'Roca Afilada', type: 'rock', category: 'physical', power: 100, accuracy: 80, pp: 5, maxPp: 5 },
              { id: 'crunch', name: 'Triturar', type: 'dark', category: 'physical', power: 80, accuracy: 100, pp: 15, maxPp: 15 },
              { id: 'earthquake', name: 'Terremoto', type: 'ground', category: 'physical', power: 100, accuracy: 100, pp: 10, maxPp: 10 }
            ]
          }
        ]
      }
    ];

    list.forEach(c => this.commanders.set(c.id, c));
  }

  /**
   * Desactiva un terminal de seguridad en el Laboratorio Subterráneo.
   */
  public deactivateTerminal(id: string): { success: boolean; allCleared: boolean; message: string } {
    const term = this.terminals.get(id);
    if (!term) return { success: false, allCleared: false, message: 'Terminal desconocido.' };

    if (term.deactivated) {
      return { success: true, allCleared: this.areAllTerminalsCleared(), message: `El ${term.name} ya está desactivado.` };
    }

    term.deactivated = true;
    this.pokemonReleasedCount += 2;
    const all = this.areAllTerminalsCleared();

    return {
      success: true,
      allCleared: all,
      message: all
        ? `¡Todos los terminales han sido anulados! Las compuertas láser se han desactivado y los Pokémon cautivos están a salvo.`
        : `¡${term.name} anulado con éxito! Se ha desactivado una de las barreras de energía.`
    };
  }

  public areAllTerminalsCleared(): boolean {
    for (const t of this.terminals.values()) {
      if (!t.deactivated) return false;
    }
    return true;
  }

  public getCommander(id: string): AuroraCommander | undefined {
    return this.commanders.get(id);
  }

  public defeatCommander(id: string): void {
    const cmd = this.commanders.get(id);
    if (cmd) cmd.defeated = true;
  }

  public get releasedCount(): number {
    return this.pokemonReleasedCount;
  }
}
