import { QuestNPC, QuestDefinition, NPCQuestState, QuestReward } from './questTypes';

export class QuestManager {
  private npcs: Map<string, QuestNPC> = new Map();
  private quests: Map<string, QuestDefinition> = new Map();
  private activeQuests: Set<string> = new Set();
  private completedQuests: Set<string> = new Set();
  private inventory: Map<string, number> = new Map();
  public playerMoney: number = 1000;

  constructor() {
    this.initDefaultQuestsAndNPCs();
  }

  /**
   * Registra un nuevo NPC en el sistema.
   */
  public registerNPC(npc: QuestNPC): void {
    this.npcs.set(npc.id, npc);
  }

  /**
   * Registra una nueva misión en el sistema.
   */
  public registerQuest(quest: QuestDefinition): void {
    this.quests.set(quest.id, quest);
  }

  public getNPC(id: string): QuestNPC | undefined {
    return this.npcs.get(id);
  }

  public getNPCsForMap(mapId: string): QuestNPC[] {
    return Array.from(this.npcs.values()).filter(npc => npc.mapId === mapId);
  }

  /**
   * Obtiene la secuencia de diálogos del NPC según su estado actual.
   */
  public getDialoguesForNPC(npcId: string): string[] {
    const npc = this.npcs.get(npcId);
    if (!npc) return ['...'];
    return npc.dialogues[npc.state] || npc.dialogues.no_hablado;
  }

  /**
   * Avanza el estado de la misión o del NPC tras completar el diálogo.
   */
  public advanceNPCState(npcId: string): { newState: NPCQuestState; rewardClaimed?: QuestReward } {
    const npc = this.npcs.get(npcId);
    if (!npc) return { newState: 'no_hablado' };

    let rewardClaimed: QuestReward | undefined;

    if (npc.state === 'no_hablado') {
      // Si tiene una misión asociada, se activa
      if (npc.questId && this.quests.has(npc.questId)) {
        npc.state = 'mision_activa';
        this.activeQuests.add(npc.questId);
      } else {
        // NPC genérico sin misión pasa a completado tras hablar
        npc.state = 'mision_completada';
      }
    } else if (npc.state === 'mision_activa') {
      // Verificar si se cumplen las condiciones para completar la misión
      const quest = npc.questId ? this.quests.get(npc.questId) : undefined;
      const canComplete = this.checkQuestConditions(quest);

      if (canComplete && quest) {
        npc.state = 'mision_completada';
        this.activeQuests.delete(quest.id);
        this.completedQuests.add(quest.id);

        // Entregar recompensas
        rewardClaimed = this.grantRewards(quest.rewards);

        // Consumir objetos requeridos si aplica
        if (quest.requiredItem) {
          this.consumeItem(quest.requiredItem.id, quest.requiredItem.quantity);
        }
      }
    }

    if (npc.onStateChange) {
      npc.onStateChange(npc.state);
    }

    return { newState: npc.state, rewardClaimed };
  }

  /**
   * Comprueba si el jugador cumple los requisitos de la misión.
   */
  private checkQuestConditions(quest?: QuestDefinition): boolean {
    if (!quest) return true;
    if (quest.requiredItem) {
      const currentQty = this.inventory.get(quest.requiredItem.id) || 0;
      return currentQty >= quest.requiredItem.quantity;
    }
    return true;
  }

  /**
   * Entrega las recompensas al jugador.
   */
  private grantRewards(rewards: QuestReward): QuestReward {
    if (rewards.money) {
      this.playerMoney += rewards.money;
    }
    if (rewards.items) {
      rewards.items.forEach(item => {
        const current = this.inventory.get(item.id) || 0;
        this.inventory.set(item.id, current + item.quantity);
      });
    }
    return rewards;
  }

  public addItem(itemId: string, quantity: number = 1): void {
    const current = this.inventory.get(itemId) || 0;
    this.inventory.set(itemId, current + quantity);
  }

  public consumeItem(itemId: string, quantity: number = 1): boolean {
    const current = this.inventory.get(itemId) || 0;
    if (current < quantity) return false;
    this.inventory.set(itemId, current - quantity);
    return true;
  }

  /**
   * Inicializa NPCs y misiones del lore oficial de Pokémon: Ecos de Andara.
   */
  private initDefaultQuestsAndNPCs(): void {
    // Misión 1: El Correo del Profesor Ceibo
    this.registerQuest({
      id: 'quest_ceibo_package',
      title: 'El Correo del Profesor Ceibo',
      description: 'Entrega el paquete de muestras ecológicas al Pescador de Villa Tranquimar.',
      giverNpcId: 'prof_ceibo',
      targetNpcId: 'pescador_mateo',
      requiredItem: { id: 'ceibo_parcel', name: 'Paquete de Ceibo', quantity: 1 },
      rewards: {
        money: 500,
        items: [{ id: 'potion', name: 'Poción', quantity: 3 }]
      }
    });

    // NPC 1: Profesor Ceibo en el laboratorio
    this.registerNPC({
      id: 'prof_ceibo',
      name: 'Profesor Ceibo',
      mapId: 'ceibo_lab',
      x: 8,
      y: 4,
      facing: 'DOWN',
      spriteKey: 'npc_professor',
      questId: 'quest_ceibo_package',
      state: 'no_hablado',
      dialogues: {
        no_hablado: [
          '¡Hola, joven entrenador! Qué alegría verte listo para la aventura.',
          'Las corrientes telúricas de Andara están manifestando ecos misteriosos.',
          'Por favor, lleva este Paquete de Muestras al Pescador Mateo en el muelle sur.',
          '¡Te recompensaré cuando lo hayas entregado!'
        ],
        mision_activa: [
          '¿Aún no has visitado a Mateo en el muelle de Villa Tranquimar?',
          'Ten cuidado en la hierba alta y no olvides curar a tu compañero.'
        ],
        mision_completada: [
          '¡Excelente trabajo entregando las muestras!',
          'El vínculo con tus Pokémon crecerá con cada viaje que emprendas.'
        ]
      }
    });

    // NPC 2: Pescador Mateo en Villa Tranquimar
    this.registerNPC({
      id: 'pescador_mateo',
      name: 'Pescador Mateo',
      mapId: 'villa_tranquimar',
      x: 12,
      y: 15,
      facing: 'LEFT',
      spriteKey: 'npc_fisherman',
      state: 'no_hablado',
      dialogues: {
        no_hablado: [
          'El mar de Andara hoy está en calma, pero los peces presienten algo.',
          '¿Traes noticias del laboratorio del Profesor Ceibo?'
        ],
        mision_activa: [
          '¡Ah, las muestras del Profesor! Muchas gracias, muchacho.',
          'Toma esta Super Ball que encontré en la orilla como agradecimiento.'
        ],
        mision_completada: [
          'Sigue entrenando duro. Dicen que en Pueblo Altiplano la Líder Rocío no perdona ni un error.'
        ]
      }
    });
  }
}
