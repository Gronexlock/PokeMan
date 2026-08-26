import { PokemonType, MoveCategory } from '../types';

/**
 * Representación simplificada y desacoplada de un movimiento en combate.
 */
export interface BattleMove {
  id: string;
  name: string;
  type: PokemonType;
  category: MoveCategory;
  power: number;
  accuracy: number;
  pp: number;
  maxPp?: number;
  priority?: number;
}

/**
 * Representación simplificada de un Pokémon en combate (estilo @pkmn/engine).
 */
export interface BattlePokemon {
  id: string | number;
  name: string;
  types: PokemonType[];
  level: number;
  currentHp: number;
  maxHp: number;
  attack: number;
  defense: number;
  spAttack?: number;
  spDefense?: number;
  speed: number;
  moves: BattleMove[];
  isMega?: boolean;
  megaStone?: string;
  originalName?: string;
  ability?: string;
  heldItem?: string;
  hasConsumedHeldItem?: boolean;
  disguiseBroken?: boolean;
  statStages?: {
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
}

/**
 * Tipos de eventos atómicos generados en un turno para ser consumidos y animados por Phaser 3.
 */
export type BattleStepType =
  | 'MESSAGE'
  | 'USE_MOVE'
  | 'MOVE_MISS'
  | 'DAMAGE'
  | 'CRITICAL_HIT'
  | 'EFFECTIVENESS'
  | 'MEGA_EVOLUTION'
  | 'WEATHER_EFFECT'
  | 'ABILITY_TRIGGER'
  | 'HELD_ITEM_TRIGGER'
  | 'RECOIL_DAMAGE'
  | 'HEAL'
  | 'FAINT'
  | 'BATTLE_END';

export type CombatantSide = 'player' | 'opponent';

export interface BattleStep {
  type: BattleStepType;
  actor: CombatantSide;
  target?: CombatantSide;
  message: string;
  move?: BattleMove;
  damage?: number;
  isCritical?: boolean;
  effectiveness?: 'super_effective' | 'not_very_effective' | 'immune' | 'normal';
  targetHpBefore?: number;
  targetHpAfter?: number;
  targetMaxHp?: number;
}

export interface TurnResult {
  turnNumber: number;
  steps: BattleStep[];
  isBattleOver: boolean;
  winner: CombatantSide | null;
  playerHp: number;
  playerMaxHp: number;
  opponentHp: number;
  opponentMaxHp: number;
}

/**
 * Matriz clásica de efectividad de tipos Pokémon (18 tipos).
 * Multiplicador de daño según: TYPE_CHART[TipoAtaque][TipoDefensa]
 */
export const TYPE_CHART: Record<PokemonType, Partial<Record<PokemonType, number>>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, grass: 0.5, electric: 2, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { grass: 2, electric: 0.5, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};

/**
 * Gestor de combate determinista y modular (Headless Turn-Based Battle Engine).
 */
export class BattleManager {
  public player: BattlePokemon;
  public opponent: BattlePokemon;
  public turnNumber: number = 0;
  public isBattleOver: boolean = false;
  public winner: CombatantSide | null = null;

  /**
   * `true` si es un combate de entrenador (no se puede huir ni lanzar Poké Balls).
   * `false` (default) para encuentros salvajes.
   */
  public is_trainer_battle: boolean = false;
  public currentWeather: string = 'CLEAR';
  public playerMegaUsed: boolean = false;
  public opponentMegaUsed: boolean = false;

  public get weather(): string {
    return this.currentWeather;
  }

  public set weather(val: string) {
    this.currentWeather = val;
  }

  constructor(
    playerPokemon: BattlePokemon,
    opponentPokemon: BattlePokemon,
    options: { isTrainerBattle?: boolean; weather?: string } = {}
  ) {
    this.player = { ...playerPokemon, moves: [...playerPokemon.moves] };
    this.opponent = { ...opponentPokemon, moves: [...opponentPokemon.moves] };
    this.is_trainer_battle = options.isTrainerBattle ?? false;
    this.currentWeather = options.weather ?? 'CLEAR';
    this.checkBattleStatus();
  }

  /**
   * Obtiene el multiplicador de efectividad de tipos entre un movimiento y los tipos del defensor.
   */
  public getTypeEffectiveness(moveType: PokemonType, defenderTypes: PokemonType[]): number {
    const attackingType = moveType.toLowerCase() as PokemonType;
    const chartEntry = TYPE_CHART[attackingType];
    if (!chartEntry) return 1.0;

    let multiplier = 1.0;
    for (const defType of defenderTypes) {
      const targetType = defType.toLowerCase() as PokemonType;
      const mod = chartEntry[targetType];
      if (mod !== undefined) {
        multiplier *= mod;
      }
    }
    return multiplier;
  }

  /**
   * Calcula el daño oficial según la fórmula de Pokémon Gen 4-9 simplificada.
   */
  public calculateDamage(
    attacker: BattlePokemon,
    defender: BattlePokemon,
    move: BattleMove,
    options: { forceCritical?: boolean; forceRandom?: number } = {}
  ): {
    damage: number;
    isCritical: boolean;
    effectiveness: number;
    effectivenessText: 'super_effective' | 'not_very_effective' | 'immune' | 'normal';
    isHit: boolean;
  } {
    // 1. Verificación de Precisión (Accuracy Check)
    const accuracy = move.accuracy ?? 100;
    const rollAccuracy = Math.random() * 100;
    const isHit = accuracy >= 100 || rollAccuracy <= accuracy;

    if (!isHit) {
      return {
        damage: 0,
        isCritical: false,
        effectiveness: 1.0,
        effectivenessText: 'normal',
        isHit: false
      };
    }

    if (move.category === 'status' || move.power <= 0) {
      return {
        damage: 0,
        isCritical: false,
        effectiveness: 1.0,
        effectivenessText: 'normal',
        isHit: true
      };
    }

    // Habilidad del atacante: Experto (Technician) (+50% poder si es <= 60)
    let movePower = move.power;
    if (attacker.ability === 'technician' && movePower <= 60) {
      movePower = Math.floor(movePower * 1.5);
    }

    // 2. Selección de Ataque vs Defensa (Físico o Especial)
    const isSpecial = move.category === 'special';
    let atk = isSpecial ? (attacker.spAttack ?? attacker.attack) : attacker.attack;
    let def = Math.max(1, isSpecial ? (defender.spDefense ?? defender.defense) : defender.defense);
    const level = attacker.level || 5;

    // Held Items ofensivos: Choice Band / Choice Specs
    if (attacker.heldItem === 'choice_band' && !isSpecial) atk = Math.floor(atk * 1.5);
    if (attacker.heldItem === 'choice_specs' && isSpecial) atk = Math.floor(atk * 1.5);

    // 3. Fórmula base de daño de Pokémon:
    // Base = [ ( (2 * Nivel / 5 + 2) * Poder * (Atk / Def) ) / 50 ] + 2
    const levelFactor = Math.floor((2 * level) / 5) + 2;
    let baseDamage = Math.floor((levelFactor * movePower * (atk / def)) / 50) + 2;

    // 4. Golpe Crítico (Probabilidad clásica ~6.25% -> 1.5x daño)
    const isCritical = options.forceCritical ?? (Math.random() < 0.0625);
    const critMultiplier = isCritical ? 1.5 : 1.0;

    // 5. STAB (Same Type Attack Bonus: 1.5x)
    const hasStab = attacker.types.some(t => t.toLowerCase() === move.type.toLowerCase());
    const stabMultiplier = hasStab ? 1.5 : 1.0;

    // 6. Efectividad de Tipos (Inmunidad por Levitación)
    let effectiveness = this.getTypeEffectiveness(move.type, defender.types);
    if (move.type.toLowerCase() === 'ground' && defender.ability === 'levitate') {
      effectiveness = 0;
    }

    // 7. Modificador de Clima
    let weatherMultiplier = 1.0;
    const mt = move.type.toLowerCase();
    if (this.currentWeather === 'RAIN' || this.currentWeather === 'THUNDERSTORM') {
      if (mt === 'water') weatherMultiplier = 1.5;
      if (mt === 'fire') weatherMultiplier = 0.5;
    } else if (this.currentWeather === 'HARSH_SUN') {
      if (mt === 'fire') weatherMultiplier = 1.5;
      if (mt === 'water') weatherMultiplier = 0.5;
    }

    // Held Item: Vidasfera (Life Orb: +30% daño)
    let itemMultiplier = 1.0;
    if (attacker.heldItem === 'life_orb') {
      itemMultiplier = 1.3;
    }

    // 8. Factor Aleatorio Oficial (0.85 a 1.00)
    const randomMultiplier = options.forceRandom ?? (Math.floor(Math.random() * 16 + 85) / 100);

    // 9. Cálculo final
    let finalDamage = Math.floor(
      baseDamage * critMultiplier * stabMultiplier * effectiveness * weatherMultiplier * itemMultiplier * randomMultiplier
    );

    if (effectiveness === 0) {
      finalDamage = 0;
    } else if (finalDamage < 1 && move.power > 0) {
      finalDamage = 1; // Mínimo 1 de daño si no es inmune
    }

    // Determinamos texto descriptivo de efectividad
    let effectivenessText: 'super_effective' | 'not_very_effective' | 'immune' | 'normal' = 'normal';
    if (effectiveness === 0) effectivenessText = 'immune';
    else if (effectiveness > 1.0) effectivenessText = 'super_effective';
    else if (effectiveness < 1.0) effectivenessText = 'not_very_effective';

    return {
      damage: finalDamage,
      isCritical,
      effectiveness,
      effectivenessText,
      isHit: true
    };
  }

  /**
   * Ejecuta un turno completo de combate, resolviendo prioridades, velocidades y generando
   * el listado secuencial de eventos (steps) para que Phaser 3 los anime.
   */
  public executeTurn(
    playerMoveIndex: number,
    opponentMoveIndex?: number,
    options: { playerMega?: boolean; opponentMega?: boolean; isPlayerSwitchOrItem?: boolean } = {}
  ): TurnResult {
    this.turnNumber++;
    const steps: BattleStep[] = [];

    // --- A. Mega-Evolución antes de cualquier ataque ---
    if (options.playerMega && !this.playerMegaUsed && !this.player.isMega) {
      this.triggerMegaEvolution('player', steps);
    }
    if (options.opponentMega && !this.opponentMegaUsed && !this.opponent.isMega) {
      this.triggerMegaEvolution('opponent', steps);
    }

    if (this.isBattleOver) {
      return {
        turnNumber: this.turnNumber,
        steps: [{
          type: 'MESSAGE',
          actor: 'player',
          message: 'El combate ya ha terminado.'
        }],
        isBattleOver: true,
        winner: this.winner,
        playerHp: this.player.currentHp,
        playerMaxHp: this.player.maxHp,
        opponentHp: this.opponent.currentHp,
        opponentMaxHp: this.opponent.maxHp
      };
    }

    // IA básica para oponente si no se especifica
    const oppMoveIdx = opponentMoveIndex !== undefined
      ? opponentMoveIndex
      : Math.floor(Math.random() * this.opponent.moves.length);
    const opponentMove = this.opponent.moves[oppMoveIdx] || this.opponent.moves[0];

    // Si el turno del jugador fue consumido cambiando de Pokémon o usando un ítem
    if (options.isPlayerSwitchOrItem) {
      if (this.opponent.currentHp > 0) {
        this.processMoveAction('opponent', 'player', this.opponent, this.player, opponentMove, steps);
      }
      if (!this.isBattleOver) {
        this.processEndOfTurnEffects(steps);
      }
      return this.buildTurnResult(steps);
    }

    // Obtener movimiento seleccionado por el jugador
    const playerMove = this.player.moves[playerMoveIndex] || this.player.moves[0];

    // Modificadores de velocidad por Choice Scarf
    let pSpeed = this.player.speed;
    let oSpeed = this.opponent.speed;
    if (this.player.heldItem === 'choice_scarf') pSpeed = Math.floor(pSpeed * 1.5);
    if (this.opponent.heldItem === 'choice_scarf') oSpeed = Math.floor(oSpeed * 1.5);

    // Determinar orden de turno según Prioridad de movimiento y Velocidad
    const playerPriority = playerMove?.priority ?? 0;
    const opponentPriority = opponentMove?.priority ?? 0;

    let playerFirst = true;
    if (playerPriority !== opponentPriority) {
      playerFirst = playerPriority > opponentPriority;
    } else if (pSpeed !== oSpeed) {
      playerFirst = pSpeed > oSpeed;
    } else {
      playerFirst = Math.random() < 0.5;
    }

    const firstCombatant = playerFirst
      ? { side: 'player' as CombatantSide, targetSide: 'opponent' as CombatantSide, pokemon: this.player, target: this.opponent, move: playerMove }
      : { side: 'opponent' as CombatantSide, targetSide: 'player' as CombatantSide, pokemon: this.opponent, target: this.player, move: opponentMove };

    const secondCombatant = playerFirst
      ? { side: 'opponent' as CombatantSide, targetSide: 'player' as CombatantSide, pokemon: this.opponent, target: this.player, move: opponentMove }
      : { side: 'player' as CombatantSide, targetSide: 'opponent' as CombatantSide, pokemon: this.player, target: this.opponent, move: playerMove };

    // --- ACCIÓN 1: Primer Combatiente ---
    this.processMoveAction(firstCombatant.side, firstCombatant.targetSide, firstCombatant.pokemon, firstCombatant.target, firstCombatant.move, steps);

    // Si el objetivo se debilitó, finaliza el turno inmediatamente
    if (this.isBattleOver) {
      return this.buildTurnResult(steps);
    }

    // --- ACCIÓN 2: Segundo Combatiente (si sigue vivo) ---
    if (secondCombatant.pokemon.currentHp > 0) {
      this.processMoveAction(secondCombatant.side, secondCombatant.targetSide, secondCombatant.pokemon, secondCombatant.target, secondCombatant.move, steps);
    }

    // --- ACCIÓN 3: Efectos de fin de turno (Restos / Leftovers) ---
    if (!this.isBattleOver) {
      this.processEndOfTurnEffects(steps);
    }

    return this.buildTurnResult(steps);
  }

  /**
   * Dispara habilidades al entrar al combate (Intimidación, Llovizna, Sequía, etc.).
   */
  public triggerSwitchInAbilities(side: CombatantSide, steps: BattleStep[]): void {
    const pkmn = side === 'player' ? this.player : this.opponent;
    const opp = side === 'player' ? this.opponent : this.player;
    const pkmnLabel = side === 'player' ? pkmn.name : `El ${pkmn.name} enemigo`;
    const oppLabel = side === 'player' ? `El ${opp.name} enemigo` : opp.name;

    if (!pkmn.ability) return;
    const ab = pkmn.ability.toLowerCase();

    if (ab === 'intimidate') {
      opp.attack = Math.max(1, Math.floor(opp.attack * 0.8));
      steps.push({
        type: 'ABILITY_TRIGGER',
        actor: side,
        target: side === 'player' ? 'opponent' : 'player',
        message: `¡La Intimidación de ${pkmnLabel} redujo el Ataque de ${oppLabel}!`
      });
    } else if (ab === 'drizzle') {
      this.currentWeather = 'RAIN';
      steps.push({
        type: 'ABILITY_TRIGGER',
        actor: side,
        message: `¡La habilidad Llovizna de ${pkmnLabel} hizo que empezara a llover!`
      });
    } else if (ab === 'drought') {
      this.currentWeather = 'HARSH_SUN';
      steps.push({
        type: 'ABILITY_TRIGGER',
        actor: side,
        message: `¡La habilidad Sequía de ${pkmnLabel} intensificó los rayos del sol!`
      });
    } else if (ab === 'sand_stream') {
      this.currentWeather = 'SANDSTORM';
      steps.push({
        type: 'ABILITY_TRIGGER',
        actor: side,
        message: `¡La habilidad Chorro Arena de ${pkmnLabel} desató una tormenta de arena!`
      });
    } else if (ab === 'snow_warning') {
      this.currentWeather = 'SNOW';
      steps.push({
        type: 'ABILITY_TRIGGER',
        actor: side,
        message: `¡La habilidad Nevada de ${pkmnLabel} desató una nevada!`
      });
    }
  }

  /**
   * Resuelve efectos pasivos de fin de turno (Restos, etc.).
   */
  private processEndOfTurnEffects(steps: BattleStep[]): void {
    const combatants: { side: CombatantSide; pkmn: BattlePokemon }[] = [
      { side: 'player', pkmn: this.player },
      { side: 'opponent', pkmn: this.opponent }
    ];

    for (const { side, pkmn } of combatants) {
      if (pkmn.currentHp > 0 && pkmn.currentHp < pkmn.maxHp && pkmn.heldItem === 'leftovers') {
        const heal = Math.max(1, Math.floor(pkmn.maxHp / 16));
        pkmn.currentHp = Math.min(pkmn.maxHp, pkmn.currentHp + heal);
        const label = side === 'player' ? pkmn.name : `El ${pkmn.name} enemigo`;
        steps.push({
          type: 'HELD_ITEM_TRIGGER',
          actor: side,
          damage: heal,
          message: `¡Los Restos de ${label} restauraron un poco de sus PS!`
        });
      }
    }
  }

  /**
   * Procesa la ejecución de un movimiento individual y genera sus pasos visuales.
   */
  private processMoveAction(
    actorSide: CombatantSide,
    targetSide: CombatantSide,
    attacker: BattlePokemon,
    defender: BattlePokemon,
    move: BattleMove,
    steps: BattleStep[]
  ): void {
    const actorLabel = actorSide === 'player' ? attacker.name : `El ${attacker.name} enemigo`;
    const targetLabel = targetSide === 'player' ? defender.name : `El ${defender.name} enemigo`;

    // 1. Paso: Anuncio del movimiento
    steps.push({
      type: 'USE_MOVE',
      actor: actorSide,
      target: targetSide,
      move: move,
      message: `¡${actorLabel} usó ${move.name}!`
    });

    // 2. Reducción de PP
    if (move.pp > 0) {
      move.pp--;
    }

    // 3. Cálculo de impacto
    const result = this.calculateDamage(attacker, defender, move);

    // Fallo de precisión
    if (!result.isHit) {
      steps.push({
        type: 'MOVE_MISS',
        actor: actorSide,
        target: targetSide,
        move: move,
        message: `¡El ataque de ${actorLabel} falló!`
      });
      return;
    }

    // Si es movimiento de estado
    if (move.category === 'status') {
      steps.push({
        type: 'MESSAGE',
        actor: actorSide,
        target: targetSide,
        move: move,
        message: `¡Pero no tuvo ningún efecto directo en el combate!`
      });
      return;
    }

    // Inmunidad de tipo (o por Levitación)
    if (result.effectivenessText === 'immune') {
      steps.push({
        type: 'EFFECTIVENESS',
        actor: actorSide,
        target: targetSide,
        effectiveness: 'immune',
        message: `No afecta a ${targetLabel}...`
      });
      return;
    }

    // Habilidad: Disfraz (Disguise)
    if (defender.ability === 'disguise' && !defender.disguiseBroken && result.damage > 0) {
      defender.disguiseBroken = true;
      steps.push({
        type: 'ABILITY_TRIGGER',
        actor: targetSide,
        message: `¡El Disfraz de ${targetLabel} absorbió el golpe y se rompió!`
      });
      result.damage = 0;
    }

    // Habilidad Robustez (Sturdy) & Objeto Banda Focus (Focus Sash)
    if (result.damage >= defender.currentHp && defender.currentHp === defender.maxHp) {
      if (defender.ability === 'sturdy') {
        result.damage = defender.currentHp - 1;
        steps.push({
          type: 'ABILITY_TRIGGER',
          actor: targetSide,
          message: `¡${targetLabel} resistió el golpe letal gracias a su Robustez!`
        });
      } else if (defender.heldItem === 'focus_sash' && !defender.hasConsumedHeldItem) {
        result.damage = defender.currentHp - 1;
        defender.hasConsumedHeldItem = true;
        steps.push({
          type: 'HELD_ITEM_TRIGGER',
          actor: targetSide,
          message: `¡${targetLabel} se aferró con 1 PS gracias a su Banda Focus!`
        });
      }
    }

    // 4. Aplicación de Daño
    const hpBefore = defender.currentHp;
    defender.currentHp = Math.max(0, defender.currentHp - result.damage);
    const hpAfter = defender.currentHp;

    steps.push({
      type: 'DAMAGE',
      actor: actorSide,
      target: targetSide,
      move: move,
      damage: result.damage,
      isCritical: result.isCritical,
      effectiveness: result.effectivenessText,
      targetHpBefore: hpBefore,
      targetHpAfter: hpAfter,
      targetMaxHp: defender.maxHp,
      message: `${targetLabel} recibió ${result.damage} puntos de daño.`
    });

    // 5. Paso de Crítico
    if (result.isCritical && result.damage > 0) {
      steps.push({
        type: 'CRITICAL_HIT',
        actor: actorSide,
        target: targetSide,
        message: '¡Un golpe crítico!'
      });
    }

    // 6. Paso de Efectividad
    if (result.effectivenessText === 'super_effective') {
      steps.push({
        type: 'EFFECTIVENESS',
        actor: actorSide,
        target: targetSide,
        effectiveness: 'super_effective',
        message: '¡Es súper efectivo!'
      });
    } else if (result.effectivenessText === 'not_very_effective') {
      steps.push({
        type: 'EFFECTIVENESS',
        actor: actorSide,
        target: targetSide,
        effectiveness: 'not_very_effective',
        message: 'No es muy efectivo...'
      });
    }

    // Vidasfera (Life Orb) retroceso
    if (attacker.heldItem === 'life_orb' && result.damage > 0 && attacker.currentHp > 0) {
      const recoil = Math.max(1, Math.floor(attacker.maxHp * 0.1));
      attacker.currentHp = Math.max(0, attacker.currentHp - recoil);
      steps.push({
        type: 'RECOIL_DAMAGE',
        actor: actorSide,
        damage: recoil,
        message: `¡${actorLabel} perdió algo de vida por la Vidasfera!`
      });
    }

    // Casco Dentado (Rocky Helmet) contacto físico
    if (defender.heldItem === 'rocky_helmet' && move.category === 'physical' && result.damage > 0 && attacker.currentHp > 0) {
      const helmetDamage = Math.max(1, Math.floor(attacker.maxHp / 6));
      attacker.currentHp = Math.max(0, attacker.currentHp - helmetDamage);
      steps.push({
        type: 'HELD_ITEM_TRIGGER',
        actor: targetSide,
        damage: helmetDamage,
        message: `¡El Casco Dentado de ${targetLabel} lastimó a ${actorLabel}!`
      });
    }

    // Baya Zidra (Sitrus Berry) consumo a <= 50% HP
    if (defender.heldItem === 'sitrus_berry' && !defender.hasConsumedHeldItem && defender.currentHp > 0 && defender.currentHp <= Math.floor(defender.maxHp / 2)) {
      defender.hasConsumedHeldItem = true;
      const heal = Math.max(1, Math.floor(defender.maxHp * 0.25));
      defender.currentHp = Math.min(defender.maxHp, defender.currentHp + heal);
      steps.push({
        type: 'HEAL',
        actor: targetSide,
        damage: heal,
        message: `¡${targetLabel} consumió su Baya Zidra y restauró PS!`
      });
    }

    // 7. Comprobación de debilitamiento (Faint)
    if (defender.currentHp <= 0) {
      steps.push({
        type: 'FAINT',
        actor: targetSide,
        message: `¡${targetLabel} se debilitó!`
      });

      this.checkBattleStatus();

      if (this.isBattleOver) {
        steps.push({
          type: 'BATTLE_END',
          actor: this.winner === 'player' ? 'player' : 'opponent',
          message: this.winner === 'player'
            ? '¡Has ganado el combate!'
            : '¡Has sido derrotado!'
        });
      }
    }
  }

  /**
   * Comprueba si el combate ha terminado por debilitamiento de alguno de los contendientes.
   */
  private checkBattleStatus(): void {
    if (this.player.currentHp <= 0) {
      this.isBattleOver = true;
      this.winner = 'opponent';
    } else if (this.opponent.currentHp <= 0) {
      this.isBattleOver = true;
      this.winner = 'player';
    } else {
      this.isBattleOver = false;
      this.winner = null;
    }
  }

  /**
   * Ejecuta la transformación de Mega-Evolución de un contendiente.
   */
  public triggerMegaEvolution(side: 'player' | 'opponent', steps: BattleStep[]): void {
    const pkmn = side === 'player' ? this.player : this.opponent;
    if (pkmn.isMega) return;

    pkmn.originalName = pkmn.name;
    pkmn.isMega = true;
    pkmn.name = `Mega-${pkmn.name}`;

    // Aumento de estadísticas oficial (+100 BST general)
    pkmn.attack += 30;
    pkmn.defense += 20;
    if (pkmn.spAttack) pkmn.spAttack += 30;
    if (pkmn.spDefense) pkmn.spDefense += 20;
    pkmn.speed += 10;

    if (side === 'player') this.playerMegaUsed = true;
    else this.opponentMegaUsed = true;

    steps.push({
      type: 'MEGA_EVOLUTION',
      actor: side,
      message: `¡El Mega-Aro reacciona! ¡${pkmn.originalName} ha Mega Evolucionado en ${pkmn.name}!`
    });
  }

  /**
   * Construye el snapshot final del turno.
   */
  private buildTurnResult(steps: BattleStep[]): TurnResult {
    return {
      turnNumber: this.turnNumber,
      steps,
      isBattleOver: this.isBattleOver,
      winner: this.winner,
      playerHp: this.player.currentHp,
      playerMaxHp: this.player.maxHp,
      opponentHp: this.opponent.currentHp,
      opponentMaxHp: this.opponent.maxHp
    };
  }
}
