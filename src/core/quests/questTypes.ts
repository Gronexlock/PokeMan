/**
 * Tipos e interfaces del Sistema de Misiones y NPCs para Pokémon: Ecos de Andara.
 */

export type NPCQuestState = 'no_hablado' | 'mision_activa' | 'mision_completada';

export type FacingDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface QuestReward {
  money?: number;
  items?: { id: string; name: string; quantity: number }[];
  exp?: number;
  badges?: string;
}

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  giverNpcId: string;
  targetNpcId?: string;
  requiredItem?: { id: string; name: string; quantity: number };
  requiredFlag?: string;
  rewards: QuestReward;
}

export interface QuestNPC {
  id: string;
  name: string;
  mapId: string;
  x: number; // Coordenada X en tiles o píxeles
  y: number; // Coordenada Y en tiles o píxeles
  facing: FacingDirection;
  spriteKey: string;
  questId?: string;
  state: NPCQuestState;
  // Diálogos mapeados según el estado del NPC / Misión
  dialogues: {
    no_hablado: string[];
    mision_activa?: string[];
    mision_completada?: string[];
  };
  // Callback opcional al completar la interacción
  onStateChange?: (newState: NPCQuestState) => void;
}
