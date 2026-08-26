/**
 * Tipos e interfaces globales para Pokémon: Ecos de Andara (TypeScript)
 */

export type PokemonType =
  | 'normal' | 'fire' | 'water' | 'grass' | 'electric' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

export type MoveCategory = 'physical' | 'special' | 'status';

export type StatusCondition = 'burn' | 'paralysis' | 'sleep' | 'poison' | 'freeze' | 'badly_poison' | null;

export type TimePeriod = 'morning' | 'day' | 'sunset' | 'night';

export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  special_attack: number;
  special_defense: number;
  speed: number;
}

export interface NatureInfo {
  increased: keyof BaseStats | null;
  decreased: keyof BaseStats | null;
  es_name: string;
}

export interface MoveLearnInfo {
  level: number;
  move: string;
}

export interface SpeciesData {
  id: number;
  name: string;
  regional_dex_id?: number;
  types: PokemonType[];
  stats: BaseStats;
  base_experience?: number;
  abilities?: string[];
  hidden_ability?: string;
  catch_rate?: number;
  gender_ratio?: { male: number; female: number };
  evolutions?: { level?: number; item?: string; to: number }[];
  learnset: MoveLearnInfo[];
}

export interface MoveData {
  name: string;
  display_name?: string;
  type: PokemonType;
  category: MoveCategory;
  damage_class?: MoveCategory;
  power: number | null;
  accuracy: number | null;
  pp: number;
  max_pp?: number;
  priority?: number;
  effect?: string;
  secondary_effect?: {
    status?: StatusCondition;
    chance?: number;
    stat_change?: Partial<Record<keyof BaseStats, number>>;
  };
  desc?: string;
}

export interface MoveSlot {
  id: string;
  name: string;
  current_pp: number;
  max_pp: number;
  data: MoveData;
}

export interface PokemonInstance {
  species_id: number;
  species_name: string;
  nickname?: string;
  types: PokemonType[];
  level: number;
  current_hp: number;
  max_hp: number;
  base_stats: BaseStats;
  stats: BaseStats;
  ivs: BaseStats;
  evs: BaseStats;
  base_nature: string;
  effective_nature: string;
  status: StatusCondition;
  status_turns?: number;
  moves: MoveSlot[];
  held_item: string | null;
  current_exp?: number;
  to_next_level_exp?: number;
  is_mega?: boolean;
  stat_stages?: Record<keyof BaseStats | 'accuracy' | 'evasion', number>;
  ability?: string;
}

export interface ItemData {
  id: string;
  name: string;
  category: 'pokeballs' | 'medicine' | 'evolution_stones' | 'mega_stones' | 'nature_mints' | 'tms' | 'key_items';
  effect_value?: number;
  heal_amount?: number;
  catch_multiplier?: number;
  description: string;
  price: number;
  target_nature?: string;
}

export interface InventoryItem {
  id: string;
  quantity: number;
}

export interface TrainerTeamMember {
  species_id: number;
  name?: string;
  level: number;
  moves: string[];
  held_item?: string;
  is_mega?: boolean;
}

export interface TrainerData {
  name: string;
  title?: string;
  city?: string;
  badge?: string;
  type_specialty?: PokemonType[];
  reward_money: number;
  reward_tm?: string;
  team: TrainerTeamMember[];
  ai_tier?: 'wild' | 'rookie' | 'gym_leader' | 'rival_boss' | 'champion';
  sprite_key?: string;
}

export interface WarpPoint {
  x: number;
  y: number;
  target_map: string;
  target_x: number;
  target_y: number;
}

export interface NPCDefinition {
  id: string;
  name: string;
  x: number;
  y: number;
  facing: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  sprite: string;
  dialogue_id?: string;
  dialogue_text?: string;
  trainer_id?: string;
  is_trainer?: boolean;
  has_battled?: boolean;
}

export interface ItemBallDefinition {
  id: string;
  x: number;
  y: number;
  item_id: string;
  item_name: string;
  quantity: number;
}

export interface SignpostDefinition {
  x: number;
  y: number;
  title: string;
  text: string;
}

export interface MapDefinition {
  id: string;
  display_name: string;
  width: number;
  height: number;
  biome: 'coastal_town' | 'route_grass' | 'indoor' | 'safari_park' | 'mountain' | 'city' | 'cloud_forest' | 'high_tech_city';
  encounter_zone: string | null;
  collision_matrix: number[][];
  warps: WarpPoint[];
  npcs?: NPCDefinition[];
  item_balls?: ItemBallDefinition[];
  signposts?: SignpostDefinition[];
}

export interface DialogueChoice {
  text: string;
  choice_key: string;
  next_node: string;
}

export interface DialogueNode {
  node_id: string;
  speaker: string;
  portrait?: string;
  text: string;
  next_node?: string;
  choices?: DialogueChoice[];
  set_flag?: Record<string, any>;
  trigger_battle?: {
    trainer_id: string;
  };
}

export interface DialogueTree {
  id: string;
  scene_title: string;
  nodes: DialogueNode[];
}

export interface SaveData {
  slot?: string;
  player_name: string;
  gender?: 'male' | 'female';
  player_gender?: string;
  player_sprite?: string;
  badges: string[];
  money: number;
  current_map: string;
  player_x?: number;
  player_y?: number;
  player_position?: { x: number; y: number };
  player_facing?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  party: PokemonInstance[];
  pc_boxes?: PokemonInstance[][];
  inventory?: Record<string, number>;
  bag?: any;
  story_flags?: Record<string, any>;
  last_respawn_point?: { map: string; x: number; y: number };
  pokedex?: { seen: number[]; caught: number[] };
  pokedex_seen?: number[];
  pokedex_caught?: number[];
  play_time?: number;
  play_time_seconds?: number;
  timestamp?: string;
}

export type GameState =
  | 'TITLE'
  | 'CHARACTER_SELECT'
  | 'STARTER_SELECT'
  | 'OVERWORLD'
  | 'DIALOGUE'
  | 'BATTLE'
  | 'EVOLUTION'
  | 'PAUSE_MENU'
  | 'POKEDEX_VIEWER'
  | 'PARTY_VIEWER'
  | 'BAG_VIEWER'
  | 'SAVE_SCREEN'
  | 'MART'
  | 'OPTIONS';
