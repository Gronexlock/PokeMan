import { PokemonInstance, MoveSlot, StatusCondition } from './types';
import { DamageCalculator, DamageDetails } from './damageCalculator';
import { MegaEvolutionEngine } from './megaEngine';
import { BattleAI, AITier, AIAction } from './battleAI';
import { CatchCalculator, CatchResult } from './catchCalculator';

export type PlayerBattleActionType = 'FIGHT' | 'SWITCH' | 'ITEM' | 'BALL' | 'RUN';

export interface PlayerBattleAction {
  action_type: PlayerBattleActionType;
  move_index?: number;
  mega_evolve?: boolean;
  switch_to_idx?: number;
  item_id?: string;
  ball_id?: string;
  target_party_idx?: number;
  is_night?: boolean;
}

export interface BattleEventLog {
  text: string;
  type?: 'text' | 'damage' | 'status' | 'faint' | 'exp' | 'level_up' | 'mega' | 'switch' | 'catch' | 'run';
  target?: 'player' | 'opponent';
  data?: any;
}

export interface BattleRoundSummary {
  finished: boolean;
  winner: 'player' | 'opponent' | 'escaped' | null;
  caught: boolean;
  caught_pokemon: PokemonInstance | null;
  events: BattleEventLog[];
  player_active: PokemonInstance;
  opponent_active: PokemonInstance;
}

export class BattleEngine {
  public player_party: PokemonInstance[];
  public opponent_party: PokemonInstance[];
  public is_trainer_battle: boolean;
  public opponent_name: string;
  public ai_tier: AITier;

  public player_has_mega_ring: boolean;
  public opponent_has_mega_ring: boolean;
  public player_used_mega: boolean = false;
  public opponent_used_mega: boolean = false;

  public player_active_idx: number = 0;
  public opponent_active_idx: number = 0;

  public weather: string = 'clear';
  public turn_number: number = 0;
  public is_finished: boolean = false;
  public winner: 'player' | 'opponent' | 'escaped' | null = null;
  public caught_pokemon: PokemonInstance | null = null;

  public calc: DamageCalculator;
  public mega_engine: MegaEvolutionEngine;
  public ai: BattleAI;

  constructor(
    playerParty: PokemonInstance[],
    opponentParty: PokemonInstance[],
    isTrainerBattle: boolean = true,
    opponentName: string = "Rival Nahuel",
    aiTier: AITier = 'rival_boss',
    playerHasMegaRing: boolean = true,
    opponentHasMegaRing: boolean = false,
    damageCalc?: DamageCalculator,
    megaEngine?: MegaEvolutionEngine
  ) {
    this.player_party = playerParty;
    this.opponent_party = opponentParty;
    this.is_trainer_battle = isTrainerBattle;
    this.opponent_name = opponentName;
    this.ai_tier = aiTier;
    this.player_has_mega_ring = playerHasMegaRing;
    this.opponent_has_mega_ring = opponentHasMegaRing;

    this.calc = damageCalc || new DamageCalculator();
    this.mega_engine = megaEngine || new MegaEvolutionEngine();
    this.ai = new BattleAI(this.calc);

    this.player_active_idx = this.getFirstAliveIdx(this.player_party);
    this.opponent_active_idx = this.getFirstAliveIdx(this.opponent_party);
  }

  private getFirstAliveIdx(party: PokemonInstance[]): number {
    for (let i = 0; i < party.length; i++) {
      if (party[i].current_hp > 0) return i;
    }
    return 0;
  }

  public get player_active(): PokemonInstance {
    return this.player_party[this.player_active_idx];
  }

  public get opponent_active(): PokemonInstance {
    return this.opponent_party[this.opponent_active_idx];
  }

  public executeRound(playerAction: PlayerBattleAction): BattleRoundSummary {
    const events: BattleEventLog[] = [];
    if (this.is_finished) {
      return {
        finished: true,
        winner: this.winner,
        caught: this.caught_pokemon !== null,
        caught_pokemon: this.caught_pokemon,
        events: [{ text: "El combate ya ha concluido." }],
        player_active: this.player_active,
        opponent_active: this.opponent_active
      };
    }

    this.turn_number++;

    // 1. Intento de Huida
    if (playerAction.action_type === 'RUN') {
      if (this.is_trainer_battle) {
        events.push({ text: "¡No puedes huir de un combate contra un entrenador!" });
      } else {
        const playerSpeed = this.player_active.stats.speed;
        const oppSpeed = this.opponent_active.stats.speed;
        const escapeOdds = ((playerSpeed * 128) / oppSpeed) + 30 * this.turn_number;
        if (escapeOdds >= 256 || Math.random() * 256 < escapeOdds) {
          this.is_finished = true;
          this.winner = 'escaped';
          events.push({ text: "¡Has escapado con éxito!", type: 'run' });
          return this.buildSummary(events);
        } else {
          events.push({ text: "¡No pudiste escapar!" });
        }
      }
    }

    // 2. Intento de Captura (Poké Ball)
    if (playerAction.action_type === 'BALL') {
      if (this.is_trainer_battle) {
        events.push({ text: "¡No puedes robar el Pokémon de otro entrenador!" });
      } else {
        const ballId = playerAction.ball_id || 'pokeball';
        const catchRes = CatchCalculator.calculateCatch(
          this.opponent_active,
          ballId,
          this.turn_number,
          !!playerAction.is_night
        );
        events.push({
          text: `¡Lanzaste una ${ballId.toUpperCase()}!`,
          type: 'catch',
          data: { shakes: catchRes.shakes, caught: catchRes.caught }
        });
        events.push({ text: catchRes.message });

        if (catchRes.caught) {
          this.caught_pokemon = this.opponent_active;
          this.is_finished = true;
          this.winner = 'player';
          return this.buildSummary(events);
        }
      }
    }

    // 3. Uso de Objeto de Curación
    if (playerAction.action_type === 'ITEM') {
      const targetIdx = playerAction.target_party_idx ?? this.player_active_idx;
      const targetPoke = this.player_party[targetIdx];
      const healAmount = 50; // Poción estándar
      const prevHp = targetPoke.current_hp;
      targetPoke.current_hp = Math.min(targetPoke.max_hp, targetPoke.current_hp + healAmount);
      events.push({
        text: `Usaste una Poción. ¡${targetPoke.nickname || targetPoke.species_name} recuperó ${targetPoke.current_hp - prevHp} PS!`,
        type: 'text'
      });
    }

    // 4. Cambio voluntario de Pokémon
    if (playerAction.action_type === 'SWITCH') {
      const newIdx = playerAction.switch_to_idx ?? 0;
      if (newIdx !== this.player_active_idx && this.player_party[newIdx].current_hp > 0) {
        events.push({
          text: `¡Vuelve, ${this.player_active.species_name}! ¡Adelante, ${this.player_party[newIdx].species_name}!`,
          type: 'switch',
          target: 'player'
        });
        this.player_active_idx = newIdx;
      }
    }

    // Obtener acción de la IA
    const aiAction = this.ai.chooseAction(
      this.opponent_active,
      this.player_active,
      this.ai_tier,
      this.opponent_party,
      this.opponent_has_mega_ring && !this.opponent_used_mega
    );

    // Mega Evolución del jugador
    if (playerAction.action_type === 'FIGHT' && playerAction.mega_evolve && !this.player_used_mega) {
      const check = this.mega_engine.canMegaEvolve(this.player_active, this.player_has_mega_ring);
      if (check.can_evolve && check.mega_key) {
        const megaRes = this.mega_engine.triggerMegaEvolution(this.player_active, check.mega_key);
        this.player_used_mega = true;
        events.push({ text: megaRes.message, type: 'mega', target: 'player' });
      }
    }

    // Mega Evolución del oponente
    if (aiAction.mega_evolve && !this.opponent_used_mega) {
      const check = this.mega_engine.canMegaEvolve(this.opponent_active, this.opponent_has_mega_ring);
      if (check.can_evolve && check.mega_key) {
        const megaRes = this.mega_engine.triggerMegaEvolution(this.opponent_active, check.mega_key);
        this.opponent_used_mega = true;
        events.push({ text: `¡El rival activa su Mega-Aro! ${megaRes.message}`, type: 'mega', target: 'opponent' });
      }
    }

    // Orden de turnos si ambos atacan
    if (playerAction.action_type === 'FIGHT') {
      const pMoveIdx = playerAction.move_index ?? 0;
      const pMove = this.player_active.moves[pMoveIdx];
      const oppMoveIdx = aiAction.move_index ?? 0;
      const oppMove = this.opponent_active.moves[oppMoveIdx];

      const pPriority = pMove?.data.priority || 0;
      const oppPriority = oppMove?.data.priority || 0;

      let playerFirst = true;
      if (pPriority > oppPriority) {
        playerFirst = true;
      } else if (pPriority < oppPriority) {
        playerFirst = false;
      } else {
        const pSpeed = this.player_active.stats.speed;
        const oppSpeed = this.opponent_active.stats.speed;
        playerFirst = pSpeed >= oppSpeed;
      }

      if (playerFirst) {
        this.executeMove(this.player_active, this.opponent_active, pMove, 'player', events);
        if (this.opponent_active.current_hp > 0) {
          this.executeMove(this.opponent_active, this.player_active, oppMove, 'opponent', events);
        }
      } else {
        this.executeMove(this.opponent_active, this.player_active, oppMove, 'opponent', events);
        if (this.player_active.current_hp > 0) {
          this.executeMove(this.player_active, this.opponent_active, pMove, 'player', events);
        }
      }
    } else {
      // Si el jugador cambió/usó objeto, el oponente ataca
      const oppMoveIdx = aiAction.move_index ?? 0;
      const oppMove = this.opponent_active.moves[oppMoveIdx];
      this.executeMove(this.opponent_active, this.player_active, oppMove, 'opponent', events);
    }

    // Efectos de fin de turno (estados de quemadura / veneno)
    this.handleEndOfTurnStatus(this.player_active, 'player', events);
    this.handleEndOfTurnStatus(this.opponent_active, 'opponent', events);

    // Chequeo de debilitamiento y victoria
    this.checkFaints(events);

    return this.buildSummary(events);
  }

  private executeMove(
    attacker: PokemonInstance,
    defender: PokemonInstance,
    moveSlot: MoveSlot | undefined,
    side: 'player' | 'opponent',
    events: BattleEventLog[]
  ): void {
    if (!moveSlot || moveSlot.current_pp <= 0) {
      events.push({ text: `¡${attacker.species_name} no tiene PP para realizar ese movimiento!` });
      return;
    }

    // Chequeo de Parálisis o Congelación
    if (attacker.status === 'paralysis' && Math.random() < 0.25) {
      events.push({ text: `¡${attacker.species_name} está paralizado! ¡No se puede mover!`, type: 'status' });
      return;
    }
    if (attacker.status === 'freeze' && Math.random() < 0.8) {
      events.push({ text: `¡${attacker.species_name} está congelado!`, type: 'status' });
      return;
    } else if (attacker.status === 'freeze') {
      attacker.status = null;
      events.push({ text: `¡${attacker.species_name} se descongeló!`, type: 'status' });
    }

    moveSlot.current_pp = Math.max(0, moveSlot.current_pp - 1);
    const move = moveSlot.data;
    events.push({
      text: `¡${attacker.species_name} usó ${move.display_name || move.name}!`,
      type: 'text'
    });

    // Precisión
    if (move.accuracy && move.accuracy < 100) {
      if (Math.random() * 100 > move.accuracy) {
        events.push({ text: "¡Pero el ataque falló!" });
        return;
      }
    }

    // Calcular daño
    const result = this.calc.calculateDamage(attacker, defender, move, this.weather);

    if (result.is_status) {
      events.push({ text: "¡El movimiento de estado tuvo efecto!" });
      return;
    }

    if (result.type_effectiveness === 0) {
      events.push({ text: `No afecta a ${defender.species_name}...` });
      return;
    }

    defender.current_hp = Math.max(0, defender.current_hp - result.damage);
    events.push({
      text: `¡Infligió ${result.damage} PS de daño a ${defender.species_name}!`,
      type: 'damage',
      target: side === 'player' ? 'opponent' : 'player',
      data: { damage: result.damage, currentHp: defender.current_hp, maxHp: defender.max_hp }
    });

    if (result.is_critical) {
      events.push({ text: "¡Un golpe crítico!" });
    }

    if (result.effectiveness_text === 'super_effective') {
      events.push({ text: "¡Es súper eficaz!" });
    } else if (result.effectiveness_text === 'not_very_effective') {
      events.push({ text: "No es muy eficaz..." });
    }
  }

  private handleEndOfTurnStatus(poke: PokemonInstance, side: 'player' | 'opponent', events: BattleEventLog[]) {
    if (poke.current_hp <= 0) return;

    if (poke.status === 'burn') {
      const burnDmg = Math.max(1, Math.floor(poke.max_hp / 16));
      poke.current_hp = Math.max(0, poke.current_hp - burnDmg);
      events.push({
        text: `¡${poke.species_name} sufre ${burnDmg} PS por la quemadura!`,
        type: 'damage',
        target: side
      });
    } else if (poke.status === 'poison' || poke.status === 'badly_poison') {
      const poisDmg = Math.max(1, Math.floor(poke.max_hp / 8));
      poke.current_hp = Math.max(0, poke.current_hp - poisDmg);
      events.push({
        text: `¡${poke.species_name} sufre ${poisDmg} PS por el veneno!`,
        type: 'damage',
        target: side
      });
    }
  }

  private checkFaints(events: BattleEventLog[]) {
    if (this.opponent_active.current_hp <= 0) {
      events.push({
        text: `¡El ${this.opponent_active.species_name} rival se ha debilitado!`,
        type: 'faint',
        target: 'opponent'
      });

      // Ganancia de experiencia
      const baseExp = 64;
      const gainedExp = Math.floor((baseExp * this.opponent_active.level) / 7);
      this.player_active.current_exp = (this.player_active.current_exp || 0) + gainedExp;
      events.push({
        text: `¡${this.player_active.species_name} ganó ${gainedExp} Puntos de Experiencia!`,
        type: 'exp'
      });

      // Comprobar si al oponente le quedan Pokémon
      const nextOppIdx = this.getFirstAliveIdx(this.opponent_party);
      if (this.opponent_party[nextOppIdx].current_hp > 0) {
        this.opponent_active_idx = nextOppIdx;
        events.push({
          text: `¡${this.opponent_name} envía a ${this.opponent_active.species_name}!`,
          type: 'switch',
          target: 'opponent'
        });
      } else {
        this.is_finished = true;
        this.winner = 'player';
        events.push({ text: `¡Has derrotado a ${this.opponent_name}!` });
      }
    }

    if (this.player_active.current_hp <= 0) {
      events.push({
        text: `¡${this.player_active.species_name} se ha debilitado!`,
        type: 'faint',
        target: 'player'
      });

      const nextPlayerIdx = this.getFirstAliveIdx(this.player_party);
      if (this.player_party[nextPlayerIdx].current_hp > 0) {
        this.player_active_idx = nextPlayerIdx;
        events.push({
          text: `¡Adelante, ${this.player_active.species_name}!`,
          type: 'switch',
          target: 'player'
        });
      } else {
        this.is_finished = true;
        this.winner = 'opponent';
        events.push({ text: "¡A tu equipo no le quedan Pokémon listos para combatir! Has sido derrotado..." });
      }
    }
  }

  private buildSummary(events: BattleEventLog[]): BattleRoundSummary {
    return {
      finished: this.is_finished,
      winner: this.winner,
      caught: this.caught_pokemon !== null,
      caught_pokemon: this.caught_pokemon,
      events,
      player_active: this.player_active,
      opponent_active: this.opponent_active
    };
  }
}
