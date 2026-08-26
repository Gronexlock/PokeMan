import { BattlePokemon } from '../core/battle';

export type PlayerStarterChoice = 'grass' | 'fire' | 'water';

export interface NahuelEncounter {
  id: string;
  stageNumber: number;
  locationName: string;
  recommendedLevel: number;
  dialogueBefore: string[];
  dialogueAfter: string[];
  team: BattlePokemon[];
  defeated: boolean;
}

/**
 * GESTOR DE LOS 5 DUELOS CLAVE DE RIVALIDAD CON NAHUEL
 *
 * Administra los combates de rivalidad progresiva a lo largo de la historia de Andara:
 * 1. Duelo 1: Villa Tranquimar (Nv. 5) - Despedida en la playa (ventaja reactiva).
 * 2. Duelo 2: Entrada a Metrópolis Solsticio (Nv. 16) - Presentación de su Growlithe adoptado.
 * 3. Duelo 3: Puente de Villa Yungas (Nv. 26) - Esfuerzo y frustración por no alcanzarte.
 * 4. Duelo 4: Cumbres Australes (Nv. 54) - Antes de las ruinas prohibidas (Arcanine completo).
 * 5. Duelo 5: Liga de Andara / Postgame (Nv. 88) - Duelo de camaradería y maestría.
 */
export class NahuelRivalryManager {
  private playerStarter: PlayerStarterChoice = 'grass';
  private encounters: Map<number, NahuelEncounter> = new Map();

  constructor(playerStarterChoice: PlayerStarterChoice = 'grass') {
    this.setStarterChoice(playerStarterChoice);
  }

  public setStarterChoice(choice: PlayerStarterChoice): void {
    this.playerStarter = choice;
    this.initEncounters();
  }

  private initEncounters(): void {
    this.encounters.clear();

    // Nahuel siempre elige el tipo con ventaja directa sobre el jugador
    const nahuelStarterType = this.playerStarter === 'fire' ? 'water' : this.playerStarter === 'water' ? 'grass' : 'fire';
    const starterId = nahuelStarterType === 'water' ? 7 : nahuelStarterType === 'grass' ? 1 : 4;
    const starterName = nahuelStarterType === 'water' ? 'Squirtle' : nahuelStarterType === 'grass' ? 'Bulbasaur' : 'Charmander';
    const midStarterId = nahuelStarterType === 'water' ? 8 : nahuelStarterType === 'grass' ? 2 : 5;
    const midStarterName = nahuelStarterType === 'water' ? 'Wartortle' : nahuelStarterType === 'grass' ? 'Ivysaur' : 'Charmeleon';
    const finalStarterId = nahuelStarterType === 'water' ? 9 : nahuelStarterType === 'grass' ? 3 : 6;
    const finalStarterName = nahuelStarterType === 'water' ? 'Blastoise' : nahuelStarterType === 'grass' ? 'Venusaur' : 'Charizard';

    const starterMove = nahuelStarterType === 'water'
      ? { id: 'water_gun', name: 'Pistola Agua', type: 'water' as const, category: 'special' as const, power: 40, accuracy: 100, pp: 25, maxPp: 25 }
      : nahuelStarterType === 'grass'
      ? { id: 'vine_whip', name: 'Látigo Cepa', type: 'grass' as const, category: 'physical' as const, power: 45, accuracy: 100, pp: 25, maxPp: 25 }
      : { id: 'ember', name: 'Ascuas', type: 'fire' as const, category: 'special' as const, power: 40, accuracy: 100, pp: 25, maxPp: 25 };

    const list: NahuelEncounter[] = [
      // ─── Duelo 1: Villa Tranquimar ───
      {
        id: 'nahuel_duel_1',
        stageNumber: 1,
        locationName: 'Villa Tranquimar (Playa)',
        recommendedLevel: 5,
        defeated: false,
        dialogueBefore: [
          '¡Hey! Así que tú también recibiste tu primer compañero del Profesor Ceibo.',
          'Antes de que nuestras familias partan hacia la capital...',
          '¡Tengamos nuestro primer combate de entrenadores aquí en la playa!'
        ],
        dialogueAfter: [
          '¡Vaya! Tienes un talento natural increíble.',
          'Nos vemos en Metrópolis Solsticio, ¡prometo que seré mucho más fuerte!'
        ],
        team: [
          {
            id: starterId, name: starterName, types: [nahuelStarterType], level: 5,
            currentHp: 38, maxHp: 38, attack: 22, defense: 22, speed: 20,
            moves: [
              { id: 'tackle', name: 'Placaje', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 35, maxPp: 35 },
              starterMove
            ]
          }
        ]
      },

      // ─── Duelo 2: Entrada a Metrópolis Solsticio ───
      {
        id: 'nahuel_duel_2',
        stageNumber: 2,
        locationName: 'Entrada a Metrópolis Solsticio',
        recommendedLevel: 16,
        defeated: false,
        dialogueBefore: [
          '¡Llegaste justo a tiempo!',
          'En el Centro de Adopción de la capital encontré a un compañero muy especial...',
          '¡Conoce a mi pequeño Growlithe! ¡Vamos a demostrarte nuestro lazo!'
        ],
        dialogueAfter: [
          '¡Increíble combate! Growlithe se esforzó al máximo.',
          'Definitivamente eres el rival que me motiva a seguir adelante.'
        ],
        team: [
          {
            id: 58, name: 'Growlithe', types: ['fire'], level: 14,
            currentHp: 48, maxHp: 48, attack: 35, defense: 26, speed: 30,
            moves: [
              { id: 'bite', name: 'Mordisco', type: 'dark', category: 'physical', power: 60, accuracy: 100, pp: 25, maxPp: 25 },
              { id: 'ember', name: 'Ascuas', type: 'fire', category: 'special', power: 40, accuracy: 100, pp: 25, maxPp: 25 }
            ]
          },
          {
            id: midStarterId, name: midStarterName, types: [nahuelStarterType], level: 16,
            currentHp: 58, maxHp: 58, attack: 38, defense: 38, speed: 34,
            moves: [
              { id: 'tackle', name: 'Placaje', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 35, maxPp: 35 },
              starterMove
            ]
          }
        ]
      },

      // ─── Duelo 3: Puente de Villa Yungas ───
      {
        id: 'nahuel_duel_3',
        stageNumber: 3,
        locationName: 'Puente de Villa Yungas',
        recommendedLevel: 26,
        defeated: false,
        dialogueBefore: [
          'He estado entrenando día y noche en los bosques de Yungas.',
          'No puedo permitir que la distancia entre nuestro poder siga creciendo...',
          '¡Prepárate, esta vez ganaré yo!'
        ],
        dialogueAfter: [
          '...¿Por qué? Sigo dando todo de mí y aún así...',
          'No importa, no me rendiré. Protegeré a mi equipo cueste lo que cueste.'
        ],
        team: [
          {
            id: 181, name: 'Mareep', types: ['electric'], level: 23,
            currentHp: 65, maxHp: 65, attack: 35, defense: 35, speed: 32,
            moves: [
              { id: 'thunder_shock', name: 'Impactrueno', type: 'electric', category: 'special', power: 40, accuracy: 100, pp: 30, maxPp: 30 },
              { id: 'thunder_wave', name: 'Onda Trueno', type: 'electric', category: 'status', power: 0, accuracy: 90, pp: 20, maxPp: 20 }
            ]
          },
          {
            id: 58, name: 'Growlithe', types: ['fire'], level: 25,
            currentHp: 78, maxHp: 78, attack: 52, defense: 40, speed: 45,
            moves: [
              { id: 'flame_wheel', name: 'Rueda Fuego', type: 'fire', category: 'physical', power: 60, accuracy: 100, pp: 25, maxPp: 25 },
              { id: 'bite', name: 'Mordisco', type: 'dark', category: 'physical', power: 60, accuracy: 100, pp: 25, maxPp: 25 }
            ]
          },
          {
            id: midStarterId, name: midStarterName, types: [nahuelStarterType], level: 26,
            currentHp: 85, maxHp: 85, attack: 58, defense: 55, speed: 50,
            moves: [
              { id: 'headbutt', name: 'Cabezazo', type: 'normal', category: 'physical', power: 70, accuracy: 100, pp: 15, maxPp: 15 },
              starterMove
            ]
          }
        ]
      },

      // ─── Duelo 4: Cumbres Australes ───
      {
        id: 'nahuel_duel_4',
        stageNumber: 4,
        locationName: 'Paso de Cumbres Australes',
        recommendedLevel: 54,
        defeated: false,
        dialogueBefore: [
          'La energía de Andara está colapsando... Algo terrible está ocurriendo en las ruinas.',
          'Arcanine y yo hemos cruzado tormentas de nieve para llegar hasta aquí.',
          'Si no puedo vencerte a ti, no podré proteger a Andara de la catástrofe.',
          '¡Démoslo todo en este combate!'
        ],
        dialogueAfter: [
          'Entiendo... Tu lazo con tus Pokémon es inquebrantable.',
          'Iré a investigar las ruinas subterráneas. Por favor, confía en mí.'
        ],
        team: [
          {
            id: 823, name: 'Corviknight', types: ['flying', 'steel'], level: 51,
            currentHp: 170, maxHp: 170, attack: 110, defense: 130, speed: 90,
            moves: [
              { id: 'drill_peck', name: 'Pico Taladro', type: 'flying', category: 'physical', power: 80, accuracy: 100, pp: 20, maxPp: 20 },
              { id: 'iron_head', name: 'Cabeza de Hierro', type: 'steel', category: 'physical', power: 80, accuracy: 100, pp: 15, maxPp: 15 }
            ]
          },
          {
            id: 423, name: 'Gastrodon', types: ['water', 'ground'], level: 52,
            currentHp: 190, maxHp: 190, attack: 95, defense: 85, speed: 65,
            moves: [
              { id: 'scald', name: 'Escaldar', type: 'water', category: 'special', power: 80, accuracy: 100, pp: 15, maxPp: 15 },
              { id: 'earth_power', name: 'Tierra Viva', type: 'ground', category: 'special', power: 90, accuracy: 100, pp: 10, maxPp: 10 }
            ]
          },
          {
            id: finalStarterId, name: finalStarterName, types: [nahuelStarterType], level: 54,
            currentHp: 180, maxHp: 180, attack: 120, defense: 110, speed: 115,
            moves: [
              { id: 'earthquake', name: 'Terremoto', type: 'ground', category: 'physical', power: 100, accuracy: 100, pp: 10, maxPp: 10 },
              starterMove
            ]
          },
          {
            id: 59, name: 'Arcanine', types: ['fire'], level: 55,
            currentHp: 195, maxHp: 195, attack: 145, defense: 105, speed: 125,
            moves: [
              { id: 'flare_blitz', name: 'Envite Ígneo', type: 'fire', category: 'physical', power: 120, accuracy: 100, pp: 15, maxPp: 15 },
              { id: 'crunch', name: 'Triturar', type: 'dark', category: 'physical', power: 80, accuracy: 100, pp: 15, maxPp: 15 },
              { id: 'extreme_speed', name: 'Velocidad Extrema', type: 'normal', category: 'physical', power: 80, accuracy: 100, pp: 5, maxPp: 5 }
            ]
          }
        ]
      },

      // ─── Duelo 5: Liga de Andara / Postgame ───
      {
        id: 'nahuel_duel_5',
        stageNumber: 5,
        locationName: 'Liga Pokémon de Andara (Postgame)',
        recommendedLevel: 88,
        defeated: false,
        dialogueBefore: [
          '¡Campeón! Es un honor verte de nuevo con el Emblema del Equilibrio.',
          'Aunque Arcanine viaja ahora contigo, he forjado un equipo digno de desafiarte.',
          '¡Revivamos la chispa de Tranquimar en el escenario supremo!'
        ],
        dialogueAfter: [
          '¡Qué batalla tan sublime! Nuestro viaje valió cada segundo.',
          'Sé que Andara siempre estará a salvo en tus manos.'
        ],
        team: [
          {
            id: 823, name: 'Corviknight', types: ['flying', 'steel'], level: 86,
            currentHp: 280, maxHp: 280, attack: 175, defense: 200, speed: 140,
            moves: [
              { id: 'brave_bird', name: 'Pájaro Osado', type: 'flying', category: 'physical', power: 120, accuracy: 100, pp: 15, maxPp: 15 },
              { id: 'iron_head', name: 'Cabeza de Hierro', type: 'steel', category: 'physical', power: 80, accuracy: 100, pp: 15, maxPp: 15 }
            ]
          },
          {
            id: 423, name: 'Gastrodon', types: ['water', 'ground'], level: 86,
            currentHp: 300, maxHp: 300, attack: 155, defense: 145, speed: 110,
            moves: [
              { id: 'scald', name: 'Escaldar', type: 'water', category: 'special', power: 80, accuracy: 100, pp: 15, maxPp: 15 },
              { id: 'earth_power', name: 'Tierra Viva', type: 'ground', category: 'special', power: 90, accuracy: 100, pp: 10, maxPp: 10 }
            ]
          },
          {
            id: 181, name: 'Ampharos', types: ['electric'], level: 87,
            currentHp: 270, maxHp: 270, attack: 160, defense: 165, speed: 130,
            moves: [
              { id: 'thunderbolt', name: 'Rayo', type: 'electric', category: 'special', power: 90, accuracy: 100, pp: 15, maxPp: 15 },
              { id: 'dragon_pulse', name: 'Pulso Dragón', type: 'dragon', category: 'special', power: 85, accuracy: 100, pp: 10, maxPp: 10 }
            ]
          },
          {
            id: finalStarterId, name: finalStarterName, types: [nahuelStarterType], level: 88,
            currentHp: 290, maxHp: 290, attack: 195, defense: 185, speed: 180,
            moves: [
              { id: 'earthquake', name: 'Terremoto', type: 'ground', category: 'physical', power: 100, accuracy: 100, pp: 10, maxPp: 10 },
              { id: 'focus_blast', name: 'Onda Certera', type: 'fighting', category: 'special', power: 120, accuracy: 70, pp: 5, maxPp: 5 }
            ]
          }
        ]
      }
    ];

    list.forEach(e => this.encounters.set(e.stageNumber, e));
  }

  public getEncounter(stageNumber: number): NahuelEncounter | undefined {
    return this.encounters.get(stageNumber);
  }

  public markDefeated(stageNumber: number): void {
    const enc = this.encounters.get(stageNumber);
    if (enc) enc.defeated = true;
  }
}
