import { NPCDefinition } from '../core/types';
import { FacingDirection } from './playerController';

export class NPCManager {
  private mapNpcs: Map<string, NPCDefinition[]> = new Map();

  constructor() {
    this.initDefaultNPCs();
  }

  private initDefaultNPCs(): void {
    // Villa Tranquimar
    this.mapNpcs.set('villa_tranquimar', [
      {
        id: 'prof_ceibo_dock',
        name: 'Profesor Ceibo',
        x: 9,
        y: 6,
        facing: 'DOWN',
        sprite: 'professor.png',
        dialogue_id: 'intro_ceibo_ceremony'
      },
      {
        id: 'nahuel_dock',
        name: 'Nahuel',
        x: 10,
        y: 6,
        facing: 'LEFT',
        sprite: 'blond.png',
        dialogue_id: 'intro_ceibo_ceremony'
      },
      {
        id: 'marina_dock',
        name: 'Pescadora Luz',
        x: 10,
        y: 11,
        facing: 'DOWN',
        sprite: 'young_girl.png',
        is_trainer: true,
        dialogue_text: '¡El océano Austral está lleno de energía! ¡Vamos a combatir!'
      },
      {
        id: 'villager_north',
        name: 'Anciano Mateo',
        x: 13,
        y: 3,
        facing: 'LEFT',
        sprite: 'straw.png',
        dialogue_text: 'El Profesor Ceibo te espera en la plaza central para la Ceremonia de los Ecos.'
      }
    ]);

    // Casa del Protagonista
    this.mapNpcs.set('player_house', [
      {
        id: 'mom',
        name: 'Mamá',
        x: 4,
        y: 3,
        facing: 'DOWN',
        sprite: 'purple_girl.png',
        dialogue_text: '¡Buenos días, cariño! Descansa en tu cama cada vez que tu equipo necesite recuperar energías.'
      }
    ]);

    // Laboratorio de Ceibo
    this.mapNpcs.set('ceibo_lab', [
      {
        id: 'assistant_lucas',
        name: 'Asistente Lucas',
        x: 3,
        y: 4,
        facing: 'RIGHT',
        sprite: 'young_guy.png',
        dialogue_text: 'Analizo las muestras de energía de los cristales del Cráter Resonante. ¡Son fascinantes!'
      }
    ]);

    // Ruta 1
    this.mapNpcs.set('route_1', [
      {
        id: 'trainer_camila',
        name: 'Cazabichos Camila',
        x: 6,
        y: 10,
        facing: 'DOWN',
        sprite: 'hat_girl.png',
        is_trainer: true,
        dialogue_text: '¡Mis Pokémon bicho han entrenado duro en la hierba alta! ¿Aceptas un combate de práctica?'
      },
      {
        id: 'trainer_lucas',
        name: 'Joven Lucas',
        x: 13,
        y: 16,
        facing: 'LEFT',
        sprite: 'young_guy.png',
        is_trainer: true,
        dialogue_text: '¡Caminar por el sendero costero me llena de energía! ¡Vamos a combatir!'
      },
      {
        id: 'trainer_luz',
        name: 'Pescadora Luz',
        x: 4,
        y: 20,
        facing: 'RIGHT',
        sprite: 'young_girl.png',
        is_trainer: true,
        dialogue_text: '¡El agua de la costa está viva! ¡Poliwag y yo seremos tus rivales!'
      }
    ]);

    // Pueblo Altiplano
    this.mapNpcs.set('pueblo_altiplano', [
      {
        id: 'nahuel_altiplano',
        name: 'Nahuel',
        x: 10,
        y: 7,
        facing: 'DOWN',
        sprite: 'blond.png',
        dialogue_text: '¡Hola! La Líder Rocío domina los tipos Tierra y Roca. ¡Usa ataques de Planta o Agua para desmoronar sus defensas!'
      },
      {
        id: 'altiplano_miner',
        name: 'Minero Facundo',
        x: 7,
        y: 10,
        facing: 'RIGHT',
        sprite: 'straw.png',
        dialogue_text: 'Los minerales de estas montañas guardan una energía ancestral única en toda Andara.'
      }
    ]);

    // Centro Pokémon de Pueblo Altiplano
    this.mapNpcs.set('pokemon_center_altiplano', [
      {
        id: 'nurse_joy',
        name: 'Enfermera Joy',
        x: 4,
        y: 2,
        facing: 'DOWN',
        sprite: 'purple_girl.png',
        dialogue_text: '¡Bienvenido al Centro Pokémon! Tu equipo ha sido completamente curado y restaurado.'
      }
    ]);

    // Tienda Pokémon de Pueblo Altiplano (Poké Mart)
    this.mapNpcs.set('pokemart_altiplano', [
      {
        id: 'mart_clerk',
        name: 'Dependiente del Poké Mart',
        x: 3,
        y: 3,
        facing: 'DOWN',
        sprite: 'young_guy.png',
        dialogue_text: '¡Bienvenido a la Tienda Pokémon! ¿En qué puedo ayudarte hoy?'
      }
    ]);

    // Gimnasio de Pueblo Altiplano (Gimnasio 1)
    this.mapNpcs.set('gym_altiplano', [
      {
        id: 'gym_disciple_1',
        name: 'Montañero Tomás',
        x: 3,
        y: 7,
        facing: 'RIGHT',
        sprite: 'straw.png',
        is_trainer: true,
        dialogue_text: '¡Para retar a la Líder Rocío primero debes superar la dureza de las rocas!'
      },
      {
        id: 'gym_disciple_2',
        name: 'Geóloga Elena',
        x: 8,
        y: 5,
        facing: 'LEFT',
        sprite: 'young_girl.png',
        is_trainer: true,
        dialogue_text: '¡La geología de Andara es insuperable! ¡Demuestra tu estrategia!'
      },
      {
        id: 'leader_rocio',
        name: 'Líder Rocío',
        x: 5,
        y: 2,
        facing: 'DOWN',
        sprite: 'hat_girl.png',
        is_trainer: true,
        dialogue_text: '¡Soy Rocío, la guardiana de los estratos del Altiplano! ¡Siente la solidez de la tierra en combate!'
      }
    ]);

    // Ruta 2 (Sendero Rocoso)
    this.mapNpcs.set('route_2', [
      {
        id: 'trainer_carlos_hiker',
        name: 'Montañero Carlos',
        x: 6,
        y: 10,
        facing: 'RIGHT',
        sprite: 'straw.png',
        is_trainer: true,
        dialogue_text: '¡El sendero hacia las Yungas es empinado! ¡Fortalezcamos nuestros músculos!'
      },
      {
        id: 'trainer_bruno_bug',
        name: 'Entomólogo Bruno',
        x: 9,
        y: 5,
        facing: 'LEFT',
        sprite: 'young_guy.png',
        is_trainer: true,
        dialogue_text: '¡En la niebla de las Yungas habitan especies de Pokémon bicho extraordinarias!'
      }
    ]);

    // Villa Yungas
    this.mapNpcs.set('villa_yungas', [
      {
        id: 'leader_thiago',
        name: 'Líder Thiago',
        x: 8,
        y: 4,
        facing: 'DOWN',
        sprite: 'young_guy.png',
        is_trainer: true,
        dialogue_text: '¡Bienvenido al Bosque Nublado de Yungas! Aquí la naturaleza respira en armonía. ¿Listo para ganar la Medalla Brote?'
      },
      {
        id: 'elder_selva',
        name: 'Guardabosques Mateo',
        x: 13,
        y: 8,
        facing: 'LEFT',
        sprite: 'straw.png',
        dialogue_text: 'Hacia el norte se alzan los rascacielos de Metrópolis Solsticio. ¡Ten cuidado con la velocidad del tren!'
      }
    ]);

    // Metrópolis Solsticio
    this.mapNpcs.set('solsticio_metropolis', [
      {
        id: 'scientist_solsticio',
        name: 'Científico Eric',
        x: 8,
        y: 6,
        facing: 'DOWN',
        sprite: 'young_guy.png',
        dialogue_text: '¡En Solsticio investigamos la energía telúrica y las Mega-Piedras de la región de Andara!'
      },
      {
        id: 'citizen_shelter_guide',
        name: 'Guía Ciudadana',
        x: 6,
        y: 5,
        facing: 'RIGHT',
        sprite: 'young_girl.png',
        dialogue_text: 'En el edificio de la izquierda se encuentra el Refugio de Adopción de Pokémon rescatados.'
      }
    ]);

    // Refugio de Adopción de Solsticio
    this.mapNpcs.set('solsticio_shelter', [
      {
        id: 'shelter_valeria',
        name: 'Cuidadora Valeria',
        x: 5,
        y: 3,
        facing: 'DOWN',
        sprite: 'young_girl.png',
        dialogue_id: 'player_growlithe_adoption'
      },
      {
        id: 'rescued_growlithe_npc',
        name: 'Growlithe de Hisui',
        x: 7,
        y: 3,
        facing: 'LEFT',
        sprite: 'young_guy.png',
        dialogue_text: '¡Grof! ¡Grof! *(Mueve la cola con cariño y emoción ante tu presencia)*'
      },
      {
        id: 'nahuel_shelter',
        name: 'Nahuel',
        x: 3,
        y: 3,
        facing: 'RIGHT',
        sprite: 'blond.png',
        dialogue_id: 'solsticio_growlithe_adoption'
      }
    ]);
  }

  public getNPCsForMap(mapId: string): NPCDefinition[] {
    return this.mapNpcs.get(mapId) || [];
  }

  public getNPCAt(mapId: string, x: number, y: number): NPCDefinition | undefined {
    const npcs = this.getNPCsForMap(mapId);
    return npcs.find(n => n.x === x && n.y === y);
  }

  public facePlayer(npc: NPCDefinition, playerTileX: number, playerTileY: number): void {
    if (playerTileX < npc.x) npc.facing = 'LEFT';
    else if (playerTileX > npc.x) npc.facing = 'RIGHT';
    else if (playerTileY < npc.y) npc.facing = 'UP';
    else if (playerTileY > npc.y) npc.facing = 'DOWN';
  }
}
