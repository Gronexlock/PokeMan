import { PokemonGenerator } from './pokemonGenerator';
import { PokemonInstance, SaveData } from './types';

export interface StarterOption {
  species_id: number;
  name: string;
  gen: number;
  type: 'fire' | 'water' | 'grass';
  description: string;
}

export const ALL_STARTERS: Record<'fire' | 'water' | 'grass', StarterOption[]> = {
  fire: [
    { species_id: 4, name: 'Charmander', gen: 1, type: 'fire', description: 'Pokémon Lagartija. Su cola arde con pasión.' },
    { species_id: 155, name: 'Cyndaquil', gen: 2, type: 'fire', description: 'Pokémon Ratón Fuego. Es tímido pero ardiente.' },
    { species_id: 255, name: 'Torchic', gen: 3, type: 'fire', description: 'Pokémon Polluelo. Lanza bolas de fuego intensas.' },
    { species_id: 390, name: 'Chimchar', gen: 4, type: 'fire', description: 'Pokémon Chimpancé. Ágil y de espíritu indomable.' },
    { species_id: 498, name: 'Tepig', gen: 5, type: 'fire', description: 'Pokémon Cerdo Fuego. Gran potencia física.' },
    { species_id: 653, name: 'Fennekin', gen: 6, type: 'fire', description: 'Pokémon Zorro. Desata llamas místicas.' },
    { species_id: 725, name: 'Litten', gen: 7, type: 'fire', description: 'Pokémon Gato Fuego. Reservado y combativo.' },
    { species_id: 813, name: 'Scorbunny', gen: 8, type: 'fire', description: 'Pokémon Conejo. Velocidad y reflejos ígneos.' },
    { species_id: 909, name: 'Fuecoco', gen: 9, type: 'fire', description: 'Pokémon Fuegodrilo. Tranquilo y voraz.' }
  ],
  water: [
    { species_id: 7, name: 'Squirtle', gen: 1, type: 'water', description: 'Pokémon Tortuguita. Caparazón resistente y certero chorro.' },
    { species_id: 158, name: 'Totodile', gen: 2, type: 'water', description: 'Pokémon Fauces. Mordedura enérgica y alegre.' },
    { species_id: 258, name: 'Mudkip', gen: 3, type: 'water', description: 'Pokémon Pez Fango. Fuerza asombrosa bajo el agua.' },
    { species_id: 393, name: 'Piplup', gen: 4, type: 'water', description: 'Pokémon Pingüino. Orgulloso y perseverante.' },
    { species_id: 501, name: 'Oshawott', gen: 5, type: 'water', description: 'Pokémon Nutria. Lucha con su caparazón afilado.' },
    { species_id: 656, name: 'Froakie', gen: 6, type: 'water', description: 'Pokémon Burburrana. Saltos prodigiosos y sigilo.' },
    { species_id: 728, name: 'Popplio', gen: 7, type: 'water', description: 'Pokémon León Marino. Crea burbujas acrobáticas.' },
    { species_id: 816, name: 'Sobble', gen: 8, type: 'water', description: 'Pokémon Renacuajo. Tímido pero de gran precisión.' },
    { species_id: 912, name: 'Quaxly', gen: 9, type: 'water', description: 'Pokémon Patito. Disciplinado y elegante.' }
  ],
  grass: [
    { species_id: 1, name: 'Bulbasaur', gen: 1, type: 'grass', description: 'Pokémon Semilla. Crece con la luz del sol.' },
    { species_id: 152, name: 'Chikorita', gen: 2, type: 'grass', description: 'Pokémon Hoja. Aroma dulce y espíritu calmo.' },
    { species_id: 252, name: 'Treecko', gen: 3, type: 'grass', description: 'Pokémon Geco Bosque. Escala muros con destreza.' },
    { species_id: 387, name: 'Turtwig', gen: 4, type: 'grass', description: 'Pokémon Hojita. Caparazón de tierra fértil.' },
    { species_id: 495, name: 'Snivy', gen: 5, type: 'grass', description: 'Pokémon Serpiente Hierba. Nobleza y elegancia.' },
    { species_id: 650, name: 'Chespin', gen: 6, type: 'grass', description: 'Pokémon Erizonuez. Coraza espinosa protectora.' },
    { species_id: 722, name: 'Rowlet', gen: 7, type: 'grass', description: 'Pokémon Pluma Hoja. Sigiloso vuelo nocturno.' },
    { species_id: 810, name: 'Grookey', gen: 8, type: 'grass', description: 'Pokémon Chimpancé. Ritmo alegre que revitaliza plantas.' },
    { species_id: 906, name: 'Sprigatito', gen: 9, type: 'grass', description: 'Pokémon Gato Planta. Dulce aroma y paso grácil.' }
  ]
};

export class StoryManager {
  private pokeGen: PokemonGenerator;

  constructor(pokeGen: PokemonGenerator) {
    this.pokeGen = pokeGen;
  }

  public getStarterPokemon(
    selectedSpeciesIdOrElement: number | string
  ): { player_starter: PokemonInstance; rival_starter: PokemonInstance } {
    let playerSpeciesId = 4; // Charmander por defecto
    let rivalSpeciesId = 7;   // Squirtle por defecto
    let elementType: 'fire' | 'water' | 'grass' = 'fire';

    if (typeof selectedSpeciesIdOrElement === 'number') {
      playerSpeciesId = selectedSpeciesIdOrElement;
      // Buscar a qué tipo pertenece
      for (const type of ['fire', 'water', 'grass'] as const) {
        const found = ALL_STARTERS[type].find(s => s.species_id === playerSpeciesId);
        if (found) {
          elementType = type;
          break;
        }
      }
    } else {
      const elem = selectedSpeciesIdOrElement.toLowerCase();
      if (elem === 'grass') {
        playerSpeciesId = 1;
        elementType = 'grass';
      } else if (elem === 'water') {
        playerSpeciesId = 7;
        elementType = 'water';
      } else {
        playerSpeciesId = 4;
        elementType = 'fire';
      }
    }

    // Nahuel elige la ventaja de tipo
    if (elementType === 'fire') {
      rivalSpeciesId = 7; // Squirtle (Agua vence Fuego)
    } else if (elementType === 'water') {
      rivalSpeciesId = 1; // Bulbasaur (Planta vence Agua)
    } else {
      rivalSpeciesId = 4; // Charmander (Fuego vence Planta)
    }

    // Cada inicial empieza al Nivel 5 con exactamente 2 movimientos básicos (1 ataque normal + 1 estado/stat)
    const basicPlayerMoves = elementType === 'fire' ? ['scratch', 'growl'] :
                             elementType === 'water' ? ['tackle', 'tail_whip'] : ['tackle', 'growl'];

    const basicRivalMoves = elementType === 'fire' ? ['tackle', 'tail_whip'] :
                            elementType === 'water' ? ['tackle', 'growl'] : ['scratch', 'growl'];

    const playerStarter = this.pokeGen.generatePokemon(playerSpeciesId, 5, 'adamant', undefined, basicPlayerMoves);
    const rivalStarter = this.pokeGen.generatePokemon(rivalSpeciesId, 5, 'jolly', undefined, basicRivalMoves);

    return {
      player_starter: playerStarter,
      rival_starter: rivalStarter
    };
  }

  public createInitialSaveData(
    playerName: string = "Aria",
    starterSpeciesIdOrElement: number | string = 4,
    gender: 'female' | 'male' = 'female',
    sprite: string = 'player.png'
  ): SaveData {
    const { player_starter } = this.getStarterPokemon(starterSpeciesIdOrElement);

    return {
      slot: "save_slot_1",
      player_name: playerName,
      gender: gender,
      player_sprite: sprite,
      badges: [],
      money: 3000,
      current_map: "villa_tranquimar",
      player_x: 9,
      player_y: 8,
      player_facing: "UP",
      party: [player_starter],
      pc_boxes: [[], [], []],
      inventory: {
        pokeball: 5,
        potion: 3
      },
      story_flags: {
        starter_chosen: true,
        starter_species: player_starter.species_id,
        met_ceibo: true,
        defeated_nahuel_dock: false,
        player_sprite: sprite
      },
      last_respawn_point: {
        map: "player_house",
        x: 3,
        y: 5
      },
      pokedex_seen: [player_starter.species_id],
      pokedex_caught: [player_starter.species_id],
      play_time_seconds: 0,
      timestamp: new Date().toISOString()
    };
  }
}
