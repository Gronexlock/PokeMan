import './style.css';
import { GameState, SaveData, MapDefinition, PokemonInstance } from './core/types';
import { AssetLoader } from './graphics/assetLoader';
import { PokemonGenerator } from './core/pokemonGenerator';
import { DamageCalculator } from './core/damageCalculator';
import { MegaEvolutionEngine } from './core/megaEngine';
import { StoryManager } from './core/storyManager';
import { SaveManager } from './core/saveManager';
import { DialogueManager } from './core/dialogueManager';
import { EncounterManager } from './overworld/encounterManager';
import { OverworldRenderer } from './graphics/overworldRenderer';
import { BattleRenderer } from './graphics/battleRenderer';
import { Camera } from './graphics/camera';
import { PlayerController, FacingDirection } from './overworld/playerController';
import { TimeCycleManager } from './overworld/timeCycle';
import { NPCManager } from './overworld/npcManager';
import { AudioEngine } from './audio/audioEngine';
import { TitleScreen } from './ui/titleScreen';
import { PauseMenu } from './ui/pauseMenu';
import { BattleEngine } from './core/battleEngine';
import { CharacterSelectScreen } from './ui/characterSelect';
import { StarterSelectScreen } from './ui/starterSelect';
import { EvolutionScreen } from './ui/evolutionScreen';
import { PokemartMenu } from './ui/pokemartMenu';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  public state: GameState = 'TITLE';

  // Subsistemas
  public loader: AssetLoader;
  public pokeGen!: PokemonGenerator;
  public damageCalc!: DamageCalculator;
  public megaEngine!: MegaEvolutionEngine;
  public storyMgr!: StoryManager;
  public saveMgr: SaveManager;
  public dialogueMgr!: DialogueManager;
  public encounterMgr!: EncounterManager;
  public npcMgr: NPCManager;
  public timeCycle: TimeCycleManager;
  public audio: AudioEngine;

  // Gráficos y Render
  public camera: Camera;
  public overworldRenderer: OverworldRenderer;
  public battleRenderer: BattleRenderer;
  public player: PlayerController;
  public titleScreen: TitleScreen;
  public pauseMenu: PauseMenu;
  public pokemartMenu: PokemartMenu;
  public characterSelect: CharacterSelectScreen;
  public starterSelect: StarterSelectScreen;
  public evolutionScreen: EvolutionScreen;

  // Estado activo
  public saveData: SaveData | null = null;
  public currentMap!: MapDefinition;
  public activeBattle: BattleEngine | null = null;
  public currentOpponentNpcId: string | null = null;

  // Input
  private keysPressed: Set<string> = new Set();
  private lastTime: number = 0;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    this.loader = AssetLoader.getInstance();
    this.saveMgr = new SaveManager();
    this.npcMgr = new NPCManager();
    this.timeCycle = new TimeCycleManager();
    this.audio = AudioEngine.getInstance();

    this.camera = new Camera(960, 540);
    this.overworldRenderer = new OverworldRenderer();
    this.battleRenderer = new BattleRenderer();
    this.player = new PlayerController(6, 8, 48);
    this.titleScreen = new TitleScreen();
    this.pauseMenu = new PauseMenu();
    this.pokemartMenu = new PokemartMenu();
    this.characterSelect = new CharacterSelectScreen();
    this.starterSelect = new StarterSelectScreen();
    this.evolutionScreen = new EvolutionScreen();

    this.setupInputs();
    this.setupTouchControls();
  }

  public async start(): Promise<void> {
    // 1. Mostrar pantalla de carga
    this.renderLoadingScreen(0.1, "Cargando bases de datos...");

    // 2. Cargar todos los assets esenciales
    await this.loader.loadAllEssentialAssets((progress, asset) => {
      this.renderLoadingScreen(progress, `Cargando ${asset}...`);
    });

    // 3. Inicializar motores con datos cargados
    const pokedex = this.loader.getJson('pokedex.json') || {};
    const movesDb = this.loader.getJson('moves.json') || {};
    const typesDb = this.loader.getJson('types.json') || {};
    const megaDb = this.loader.getJson('mega_evolutions.json') || {};
    const dialoguesDb = this.loader.getJson('dialogues.json') || {};

    this.pokeGen = new PokemonGenerator(pokedex, movesDb);
    this.damageCalc = new DamageCalculator(typesDb);
    this.megaEngine = new MegaEvolutionEngine(megaDb.megas || megaDb);
    this.storyMgr = new StoryManager(this.pokeGen);
    this.dialogueMgr = new DialogueManager(dialoguesDb);
    this.encounterMgr = new EncounterManager(this.pokeGen);

    // Configurar mapa inicial
    const mapsData = this.loader.getJson('maps_data.json') || {};
    const maps = mapsData.maps || {};
    this.currentMap = maps['villa_tranquimar'] || {
      id: 'villa_tranquimar',
      display_name: 'Villa Tranquimar',
      width: 20,
      height: 15,
      biome: 'coastal_town',
      encounter_zone: null,
      collision_matrix: [],
      warps: []
    };

    // Iniciar loop
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private gameLoop(time: number): void {
    const dt = Math.min(0.1, (time - this.lastTime) / 1000);
    this.lastTime = time;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private update(dt: number): void {
    this.timeCycle.update(dt);
    this.overworldRenderer.update(dt);

    if (this.state === 'TITLE') {
      this.titleScreen.update(dt);
    } else if (this.state === 'OVERWORLD') {
      this.handleOverworldMovement(dt);
      this.camera.setTarget(this.player.xPx + 24, this.player.yPx + 24);
      this.camera.update(dt, this.currentMap.width * 48, this.currentMap.height * 48);
    } else if (this.state === 'DIALOGUE') {
      this.dialogueMgr.update(dt);
    } else if (this.state === 'BATTLE') {
      this.battleRenderer.update(dt);
    } else if (this.state === 'EVOLUTION') {
      this.evolutionScreen.update(dt);
    } else if (this.state === 'PAUSE_MENU') {
      this.pauseMenu.update(dt);
    }
  }

  private render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const timePeriod = this.timeCycle.getTimePeriod();

    if (this.state === 'TITLE') {
      const hasSave = this.saveMgr.loadGame('save_slot_1') !== null;
      this.titleScreen.render(this.ctx, this.canvas.width, this.canvas.height, hasSave);
    } else if (this.state === 'CHARACTER_SELECT') {
      this.characterSelect.render(this.ctx, this.canvas.width, this.canvas.height);
    } else if (this.state === 'STARTER_SELECT') {
      this.starterSelect.render(this.ctx, this.canvas.width, this.canvas.height);
    } else if (this.state === 'EVOLUTION') {
      this.evolutionScreen.render(this.ctx, this.canvas.width, this.canvas.height);
    } else if (this.state === 'OVERWORLD' || this.state === 'DIALOGUE') {
      const npcs = this.npcMgr.getNPCsForMap(this.currentMap.id);
      this.overworldRenderer.render(
        this.ctx,
        this.currentMap,
        this.player,
        npcs,
        this.camera,
        timePeriod,
        this.dialogueMgr
      );
    } else if (this.state === 'BATTLE' && this.activeBattle) {
      this.battleRenderer.render(
        this.ctx,
        this.activeBattle,
        timePeriod,
        this.canvas.width,
        this.canvas.height
      );
    } else if (this.state === 'PAUSE_MENU' && this.saveData) {
      // Dibujar fondo overworld atenuado
      const npcs = this.npcMgr.getNPCsForMap(this.currentMap.id);
      this.overworldRenderer.render(
        this.ctx,
        this.currentMap,
        this.player,
        npcs,
        this.camera,
        timePeriod,
        this.dialogueMgr
      );
      this.pauseMenu.render(this.ctx, this.saveData, this.canvas.width, this.canvas.height);
    } else if (this.state === 'MART' && this.saveData) {
      const npcs = this.npcMgr.getNPCsForMap(this.currentMap.id);
      this.overworldRenderer.render(
        this.ctx,
        this.currentMap,
        this.player,
        npcs,
        this.camera,
        timePeriod,
        this.dialogueMgr
      );
      this.pokemartMenu.render(this.ctx, this.saveData, this.canvas.width, this.canvas.height);
    }
  }

  private handleOverworldMovement(dt: number): void {
    const isRunning = this.keysPressed.has('ShiftLeft') || this.keysPressed.has('ShiftRight');

    let dir: FacingDirection | null = null;
    if (this.keysPressed.has('ArrowUp') || this.keysPressed.has('KeyW')) dir = 'UP';
    else if (this.keysPressed.has('ArrowDown') || this.keysPressed.has('KeyS')) dir = 'DOWN';
    else if (this.keysPressed.has('ArrowLeft') || this.keysPressed.has('KeyA')) dir = 'LEFT';
    else if (this.keysPressed.has('ArrowRight') || this.keysPressed.has('KeyD')) dir = 'RIGHT';

    if (dir && !this.player.isMoving) {
      const moveRes = this.player.tryMove(dir, isRunning, (tx, ty) => {
        // Chequeo límites de mapa
        if (tx < 0 || tx >= this.currentMap.width || ty < 0 || ty >= this.currentMap.height) {
          return { walkable: false };
        }

        // Chequeo NPC sólido
        const npc = this.npcMgr.getNPCAt(this.currentMap.id, tx, ty);
        if (npc) return { walkable: false };

        // Chequeo código de tile
        const matrix = this.currentMap.collision_matrix;
        const code = matrix[ty]?.[tx] ?? 1;

        if (code === 1 || code === 3) {
          // Muro sólido o agua
          return { walkable: false };
        }

        if (code === 4) {
          // Ledge hacia abajo
          return { walkable: true, isLedge: true };
        }

        // Warp
        const warp = (this.currentMap.warps || []).find(w => w.x === tx && w.y === ty);
        return { walkable: true, warp };
      });

      if (!moveRes.moved) {
        this.audio.playSfx('bump');
      }
    }

    const { reachedTile, tileX, tileY } = this.player.update(dt);

    if (reachedTile) {
      // 1. Chequeo de Warp
      const warp = (this.currentMap.warps || []).find(w => w.x === tileX && w.y === tileY);
      if (warp) {
        this.changeMap(warp.target_map, warp.target_x, warp.target_y);
        return;
      }

      // 2. Chequeo de Encuentros en hierba alta
      const tileCode = this.currentMap.collision_matrix[tileY]?.[tileX];
      if (tileCode === 2 && this.currentMap.encounter_zone) {
        const wildPoke = this.encounterMgr.checkGrassStep(
          this.currentMap.encounter_zone,
          this.timeCycle.getTimePeriod()
        );
        if (wildPoke && this.saveData) {
          this.startWildBattle(wildPoke);
          return;
        }
      }

      // 3. Chequeo de Detección de Entrenadores (Línea de Visión)
      const npcs = this.npcMgr.getNPCsForMap(this.currentMap.id);
      for (const npc of npcs) {
        if (npc.is_trainer && this.saveData && !this.saveData.story_flags?.[npc.id + '_defeated']) {
          let inSight = false;
          const maxVision = 3;

          if (npc.facing === 'DOWN' && tileX === npc.x && tileY > npc.y && tileY <= npc.y + maxVision) {
            inSight = true;
          } else if (npc.facing === 'UP' && tileX === npc.x && tileY < npc.y && tileY >= npc.y - maxVision) {
            inSight = true;
          } else if (npc.facing === 'RIGHT' && tileY === npc.y && tileX > npc.x && tileX <= npc.x + maxVision) {
            inSight = true;
          } else if (npc.facing === 'LEFT' && tileY === npc.y && tileX < npc.x && tileX >= npc.x - maxVision) {
            inSight = true;
          }

          if (inSight) {
            // Girar al jugador hacia el entrenador
            if (npc.facing === 'DOWN') this.player.facing = 'UP';
            else if (npc.facing === 'UP') this.player.facing = 'DOWN';
            else if (npc.facing === 'RIGHT') this.player.facing = 'LEFT';
            else if (npc.facing === 'LEFT') this.player.facing = 'RIGHT';

            this.audio.playSfx('super_hit');

            let trainerKey = 'trainer_camila_bug';
            if (npc.id === 'leader_rocio') trainerKey = 'gym_1_rocio';
            else if (npc.id === 'leader_thiago') trainerKey = 'gym_2_thiago';
            else if (npc.id === 'gym_disciple_1') trainerKey = 'gym_disciple_tomas';
            else if (npc.id === 'gym_disciple_2') trainerKey = 'gym_disciple_elena';
            else if (npc.id === 'trainer_lucas') trainerKey = 'trainer_lucas_young';
            else if (npc.id === 'trainer_luz' || npc.id === 'marina_dock') trainerKey = 'trainer_luz_fisher';
            else if (npc.id === 'trainer_carlos_hiker') trainerKey = 'gym_disciple_tomas';
            else if (npc.id === 'trainer_bruno_bug') trainerKey = 'trainer_camila_bug';

            this.dialogueMgr.startDialogue(npc.dialogue_text || "¡Nuestras miradas se han cruzado! ¡A combatir!", npc.name, () => {
              this.startTrainerBattle(trainerKey);
            });
            this.state = 'DIALOGUE';
            return;
          }
        }
      }
    }
  }

  public changeMap(mapId: string, targetX: number, targetY: number): void {
    const mapsData = this.loader.getJson('maps_data.json') || {};
    const map = mapsData.maps?.[mapId];
    if (map) {
      this.currentMap = map;
      this.player.setPosition(targetX, targetY);
      this.camera.setTarget(targetX * 48, targetY * 48, true);
      this.audio.playSfx('confirm');
    }
  }

  public startWildBattle(wildPokemon: PokemonInstance): void {
    if (!this.saveData) return;

    this.audio.playSfx('super_hit');
    this.audio.playPokemonCry(wildPokemon.species_id);

    this.activeBattle = new BattleEngine(
      this.saveData.party,
      [wildPokemon],
      false,
      `Salvaje ${wildPokemon.species_name}`,
      'wild',
      true,
      false,
      this.damageCalc,
      this.megaEngine
    );

    this.state = 'BATTLE';
    this.battleRenderer.menuMode = 'MAIN';
    this.battleRenderer.currentMessage = `¡Un ${wildPokemon.species_name} salvaje ha aparecido!`;
  }

  public startTrainerBattle(trainerInput: any, npcId?: string): void {
    if (!this.saveData) return;

    this.currentOpponentNpcId = npcId || null;

    const trainerId = typeof trainerInput === 'object' && trainerInput?.trainer_id
      ? trainerInput.trainer_id
      : (typeof trainerInput === 'string' ? trainerInput : 'rival_nahuel_intro');

    const trainersDb = this.loader.getJson('trainers.json') || {};
    const leader = trainersDb.gym_leaders?.[trainerId];
    const routeTrainer = trainersDb.route_trainers?.[trainerId];
    const rivalBattle = trainersDb.rival_battles?.[trainerId];
    const eliteMember = trainersDb.elite_four?.[trainerId];
    const champ = trainersDb.champion?.[trainerId];

    let opponentParty: PokemonInstance[] = [];
    let trainerName = "Entrenador Rival";
    let rewardMoney = 500;
    let aiTier: any = 'route_smart';

    if (leader) {
      trainerName = leader.name;
      rewardMoney = leader.reward_money || 2500;
      aiTier = 'gym_leader';
      opponentParty = leader.team.map((t: any) =>
        this.pokeGen.generatePokemon(t.species_id, t.level, 'adamant', undefined, t.moves)
      );
    } else if (routeTrainer) {
      trainerName = routeTrainer.name;
      rewardMoney = routeTrainer.reward_money || 500;
      aiTier = 'route_smart';
      opponentParty = routeTrainer.team.map((t: any) =>
        this.pokeGen.generatePokemon(t.species_id, t.level, 'hardy', undefined, t.moves)
      );
    } else if (rivalBattle) {
      trainerName = rivalBattle.name;
      rewardMoney = rivalBattle.reward_money || 600;
      aiTier = 'rival_boss';

      if (trainerId === 'rival_nahuel_intro') {
        const { rival_starter } = this.storyMgr.getStarterPokemon(
          this.saveData.story_flags?.starter_species || 4
        );
        opponentParty = [rival_starter];
      } else {
        const rivalStarterId = this.saveData.story_flags?.starter_element === 'fire' ? 7 :
                               this.saveData.story_flags?.starter_element === 'water' ? 1 : 4;
        opponentParty = rivalBattle.team.map((t: any, idx: number) => {
          const spId = (idx === rivalBattle.team.length - 1) ? rivalStarterId : t.species_id;
          return this.pokeGen.generatePokemon(spId, t.level, 'jolly', undefined, t.moves);
        });
      }
    } else if (eliteMember) {
      trainerName = eliteMember.name;
      aiTier = 'gym_leader';
      opponentParty = eliteMember.team.map((t: any) =>
        this.pokeGen.generatePokemon(t.species_id, t.level, 'hardy', undefined, t.moves)
      );
    } else if (champ) {
      trainerName = champ.name;
      aiTier = 'champion';
      opponentParty = champ.team.map((t: any) =>
        this.pokeGen.generatePokemon(t.species_id, t.level, 'jolly', undefined, t.moves)
      );
    } else {
      const { rival_starter } = this.storyMgr.getStarterPokemon(
        this.saveData.story_flags?.starter_species || 4
      );
      opponentParty = [rival_starter];
      trainerName = "Rival Nahuel";
    }

    this.audio.playSfx('super_hit');
    this.activeBattle = new BattleEngine(
      this.saveData.party,
      opponentParty,
      true,
      trainerName,
      aiTier,
      true,
      false,
      this.damageCalc,
      this.megaEngine
    );

    this.state = 'BATTLE';
    this.battleRenderer.menuMode = 'MAIN';
    this.battleRenderer.selectedMainMenuIndex = 0;
    this.battleRenderer.selectedMoveIndex = 0;
    this.battleRenderer.selectedPartyIndex = 0;
    this.battleRenderer.currentMessage = `¡${trainerName} te desafía a un combate Pokémon!`;
  }

  private setupInputs(): void {
    window.addEventListener('keydown', (e) => {
      this.keysPressed.add(e.code);

      // Mute toggle
      if (e.code === 'KeyM') {
        const isMuted = this.audio.toggleMute();
        console.log(`Audio ${isMuted ? 'Silenciado' : 'Activado'}`);
        return;
      }

      // 1. Estado Título
      if (this.state === 'TITLE') {
        if (e.code === 'ArrowUp' || e.code === 'KeyW') {
          this.titleScreen.selectedIndex = (this.titleScreen.selectedIndex - 1 + 4) % 4;
          this.audio.playSfx('select');
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          this.titleScreen.selectedIndex = (this.titleScreen.selectedIndex + 1) % 4;
          this.audio.playSfx('select');
        } else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyZ') {
          this.handleTitleSelection();
        }
      }

      // 1.1. Estado Creación de Personaje
      else if (this.state === 'CHARACTER_SELECT') {
        if (e.code === 'Escape' || e.code === 'KeyX') {
          this.state = 'TITLE';
          this.audio.playSfx('cancel');
          return;
        }
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          this.characterSelect.selectPrev();
          this.audio.playSfx('select');
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          this.characterSelect.selectNext();
          this.audio.playSfx('select');
        } else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyZ') {
          this.audio.playSfx('confirm');
          const profile = this.characterSelect.getSelectedProfile();
          this.saveData = this.storyMgr.createInitialSaveData(profile.name, 4, profile.gender, profile.sprite);
          this.player.spriteKey = profile.sprite;
          this.player.setPosition(9, 8);
          this.player.facing = 'UP';
          this.state = 'DIALOGUE';
          this.dialogueMgr.startDialogue('intro_ceibo_ceremony');
        }
      }

      // 1.2. Estado Selección de Inicial de Catálogo
      else if (this.state === 'STARTER_SELECT') {
        if (e.code === 'Escape' || e.code === 'KeyX') {
          this.state = 'DIALOGUE';
          this.dialogueMgr.startDialogue('intro_ceibo_ceremony', 'c5');
          this.audio.playSfx('cancel');
          return;
        }

        const starters = this.starterSelect.getStarters();
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          this.starterSelect.selectedIndex = (this.starterSelect.selectedIndex - 1 + starters.length) % starters.length;
          this.audio.playSfx('select');
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          this.starterSelect.selectedIndex = (this.starterSelect.selectedIndex + 1) % starters.length;
          this.audio.playSfx('select');
        } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
          this.starterSelect.selectedIndex = (this.starterSelect.selectedIndex - 3 + starters.length) % starters.length;
          this.audio.playSfx('select');
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          this.starterSelect.selectedIndex = (this.starterSelect.selectedIndex + 3) % starters.length;
          this.audio.playSfx('select');
        } else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyZ') {
          this.audio.playSfx('confirm');
          const chosen = this.starterSelect.getSelectedStarter();
          if (this.saveData) {
            const { player_starter } = this.storyMgr.getStarterPokemon(chosen.species_id);
            this.saveData.party = [player_starter];
            this.saveData.story_flags.starter_species = chosen.species_id;
            this.saveData.story_flags.starter_element = chosen.type;
            this.saveData.pokedex_seen = [player_starter.species_id];
            this.saveData.pokedex_caught = [player_starter.species_id];
          }
          this.state = 'DIALOGUE';
          this.dialogueMgr.startDialogue('intro_ceibo_ceremony', 'c_rival_react');
        }
      }

      // 2. Estado Overworld
      else if (this.state === 'OVERWORLD') {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyZ') {
          this.interactOverworld();
        } else if (e.code === 'KeyB') {
          this.player.isBiking = !this.player.isBiking;
          this.audio.playSfx('select');
        } else if (e.code === 'Escape' || e.code === 'KeyX') {
          this.state = 'PAUSE_MENU';
          this.pauseMenu.activeTab = 'MAIN';
          this.pauseMenu.selectedIndex = 0;
          this.audio.playSfx('select');
        }
      }

      // 3. Estado Diálogo
      else if (this.state === 'DIALOGUE') {
        if (e.code === 'ArrowUp' || e.code === 'KeyW') {
          this.dialogueMgr.selectChoiceUp();
          this.audio.playSfx('select');
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          this.dialogueMgr.selectChoiceDown();
          this.audio.playSfx('select');
        } else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyZ') {
          // Chequear si el nodo actual es la pregunta elemental de Ceibo (nodo c5)
          const node = this.dialogueMgr.state.currentNode;
          if (node && node.node_id === 'c5' && this.dialogueMgr.state.isTextComplete && node.choices) {
            const choice = node.choices[this.dialogueMgr.state.selectedChoiceIndex];
            if (choice && (choice.choice_key === 'fire' || choice.choice_key === 'water' || choice.choice_key === 'grass')) {
              this.starterSelect.setElement(choice.choice_key as 'fire' | 'water' | 'grass');
              this.state = 'STARTER_SELECT';
              this.audio.playSfx('confirm');
              return;
            }
          }

          const res = this.dialogueMgr.advance();
          this.audio.playSfx('confirm');

          if (res.triggerBattle) {
            this.startTrainerBattle(res.triggerBattle);
          } else if (res.finished && this.state === 'DIALOGUE') {
            this.state = 'OVERWORLD';
          }
        }
      }

      // 4. Estado Combate
      else if (this.state === 'BATTLE') {
        this.handleBattleInput(e.code);
      }

      // 5. Estado Evolución
      else if (this.state === 'EVOLUTION') {
        if (e.code === 'Escape' || e.code === 'KeyX' || e.code === 'KeyB') {
          if (this.evolutionScreen.cancelEvolution()) {
            this.audio.playSfx('cancel');
          }
        } else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyZ') {
          if (this.evolutionScreen.phase === 'FINISHED' || this.evolutionScreen.phase === 'CANCELLED') {
            this.state = 'OVERWORLD';
            this.audio.playSfx('confirm');
          }
        }
      }

      // 6. Menú de Pausa
      else if (this.state === 'PAUSE_MENU') {
        this.handlePauseMenuInput(e.code);
      }

      // 7. Tienda Pokémon (Poké Mart)
      else if (this.state === 'MART' && this.saveData) {
        const shouldExit = this.pokemartMenu.handleInput(e.code, this.saveData);
        if (shouldExit) {
          this.state = 'OVERWORLD';
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed.delete(e.code);
    });
  }

  private handleTitleSelection(): void {
    const opt = this.titleScreen.options[this.titleScreen.selectedIndex].key;
    if (opt === 'NEW_GAME') {
      this.audio.playSfx('confirm');
      this.state = 'CHARACTER_SELECT';
    } else if (opt === 'CONTINUE') {
      const save = this.saveMgr.loadGame('save_slot_1');
      if (save) {
        this.saveData = save;
        if (save.player_sprite) {
          this.player.spriteKey = save.player_sprite;
        }
        this.changeMap(save.current_map, save.player_x, save.player_y);
        this.state = 'OVERWORLD';
        this.audio.playSfx('confirm');
      } else {
        this.audio.playSfx('cancel');
      }
    } else if (opt === 'POKEDEX') {
      this.saveData = this.saveData || this.storyMgr.createInitialSaveData("Aria", 4);
      this.pauseMenu.activeTab = 'POKEDEX';
      this.state = 'PAUSE_MENU';
      this.audio.playSfx('confirm');
    }
  }

  private interactOverworld(): void {
    let checkX = this.player.tileX;
    let checkY = this.player.tileY;

    if (this.player.facing === 'UP') checkY--;
    else if (this.player.facing === 'DOWN') checkY++;
    else if (this.player.facing === 'LEFT') checkX--;
    else if (this.player.facing === 'RIGHT') checkX++;

    // 1. Interacción con Item Balls (Poké Balls en el suelo estilo GBA)
    if (this.currentMap.item_balls && this.saveData) {
      const itemBall = this.currentMap.item_balls.find(ib => ib.x === checkX && ib.y === checkY);
      if (itemBall && !this.saveData.story_flags[itemBall.id]) {
        this.saveData.story_flags[itemBall.id] = true;
        this.saveData.inventory[itemBall.item_id] = (this.saveData.inventory[itemBall.item_id] || 0) + itemBall.quantity;
        this.audio.playSfx('confirm');
        this.dialogueMgr.startDialogue(`¡${this.saveData.player_name} encontró ${itemBall.item_name} (x${itemBall.quantity})! Se guardó en la mochila.`);
        this.state = 'DIALOGUE';
        return;
      }
    }

    // 2. Interacción con Carteles Informativos (Signposts de madera)
    if (this.currentMap.signposts) {
      const sign = this.currentMap.signposts.find(sp => sp.x === checkX && sp.y === checkY);
      if (sign) {
        this.audio.playSfx('select');
        this.dialogueMgr.startDialogue(sign.text, sign.title);
        this.state = 'DIALOGUE';
        return;
      }
    }

    const npc = this.npcMgr.getNPCAt(this.currentMap.id, checkX, checkY);
    if (npc) {
      this.npcMgr.facePlayer(npc, this.player.tileX, this.player.tileY);
      this.audio.playSfx('confirm');

      // Centro Pokémon / Curación
      if (npc.id === 'nurse_joy' || npc.name.includes('Joy')) {
        if (this.saveData) {
          for (const p of this.saveData.party) {
            p.current_hp = p.max_hp;
            p.status = null;
            for (const m of p.moves) {
              m.current_pp = m.max_pp;
            }
          }
          this.saveData.last_respawn_point = { map: this.currentMap.id, x: 4, y: 5 };
          this.audio.playSfx('confirm');
        }
        this.dialogueMgr.startDialogue("¡Tu equipo Pokémon ha sido curado y revitalizado al 100%! Hemos registrado este Centro Pokémon para emergencias.", "Enfermera Joy");
        this.state = 'DIALOGUE';
        return;
      }

      // Casa del Protagonista / Mamá
      if (npc.id === 'mom' || npc.name === 'Mamá') {
        if (this.saveData) {
          for (const p of this.saveData.party) {
            p.current_hp = p.max_hp;
            p.status = null;
            for (const m of p.moves) {
              m.current_pp = m.max_pp;
            }
          }
          this.saveData.last_respawn_point = { map: 'player_house', x: 3, y: 5 };
          this.audio.playSfx('confirm');
        }
        this.dialogueMgr.startDialogue("¡Hola cariño! Descansa en tu habitación cada vez que tu equipo necesite recuperar energías.", "Mamá");
        this.state = 'DIALOGUE';
        return;
      }

      // Tienda Pokémon / Dependiente Poké Mart
      if (npc.id === 'mart_clerk' || npc.name.includes('Mart') || npc.name.includes('Tienda')) {
        this.pokemartMenu.open();
        this.state = 'MART';
        this.audio.playSfx('confirm');
        return;
      }

      // Adopción de Growlithe en Solsticio
      if (npc.dialogue_id === 'player_growlithe_adoption') {
        if (this.saveData && !this.saveData.story_flags.has_adopted_growlithe) {
          this.saveData.story_flags.has_adopted_growlithe = true;
          const growlithe = this.pokeGen.generatePokemon(58, 15, 'adamant', undefined, ['flame_wheel', 'rock_slide', 'bite', 'roar']);
          growlithe.nickname = "Growlithe (Hisui)";
          this.saveData.party.push(growlithe);
          this.dialogueMgr.startDialogue(
            "¡Felicidades! ¡Growlithe de Hisui (Nv. 15) se ha unido con devoción a tu equipo de viaje por Andara!",
            "Cuidadora Valeria"
          );
          this.state = 'DIALOGUE';
          this.audio.playSfx('confirm');
          return;
        }
      }

      // Combate con Entrenador / Líder
      if (npc.is_trainer) {
        if (this.saveData?.story_flags?.[npc.id + '_defeated'] || this.saveData?.story_flags?.[npc.name + '_defeated']) {
          this.dialogueMgr.startDialogue(
            "¡Tus Pokémon luchan con una sincronía increíble! ¡Sigue entrenando duro por Andara!",
            npc.name
          );
          this.state = 'DIALOGUE';
          return;
        }

        let trainerKey = 'trainer_camila_bug';
        if (npc.id === 'leader_rocio') trainerKey = 'gym_1_rocio';
        else if (npc.id === 'leader_thiago') trainerKey = 'gym_2_thiago';
        else if (npc.id === 'gym_disciple_1') trainerKey = 'gym_disciple_tomas';
        else if (npc.id === 'gym_disciple_2') trainerKey = 'gym_disciple_elena';
        else if (npc.id === 'trainer_lucas') trainerKey = 'trainer_lucas_young';
        else if (npc.id === 'trainer_luz' || npc.id === 'marina_dock') trainerKey = 'trainer_luz_fisher';
        else if (npc.id === 'trainer_carlos_hiker') trainerKey = 'gym_disciple_tomas';
        else if (npc.id === 'trainer_bruno_bug') trainerKey = 'trainer_camila_bug';

        this.dialogueMgr.startDialogue(npc.dialogue_text || "¡Prepárate para combatir!", npc.name, () => {
          this.startTrainerBattle(trainerKey, npc.id);
        });
        this.state = 'DIALOGUE';
        return;
      }

      if (npc.dialogue_id) {
        this.dialogueMgr.startDialogue(npc.dialogue_id);
      } else {
        this.dialogueMgr.startDialogue(npc.dialogue_text || "¡Hola, entrenador!", npc.name);
      }
      this.state = 'DIALOGUE';
    }
  }

  private handleBattleInput(code: string): void {
    if (!this.activeBattle) return;

    if (this.battleRenderer.currentMessage) {
      if (code === 'Enter' || code === 'Space' || code === 'KeyZ') {
        this.battleRenderer.currentMessage = "";
        this.audio.playSfx('select');

        if (this.activeBattle.is_finished) {
          if (this.saveData) {
            // 1. Caso: DERROTA DEL JUGADOR (Blackout / Desmayo)
            if (this.activeBattle.winner === 'opponent') {
              // Curar equipo al 100%
              for (const p of this.saveData.party) {
                p.current_hp = p.max_hp;
                p.status = null;
                for (const m of p.moves) m.current_pp = m.max_pp;
              }

              // Penalización económica leve
              const penalty = Math.min(200, Math.floor(this.saveData.money * 0.05));
              this.saveData.money = Math.max(0, this.saveData.money - penalty);

              // Teletransportar al último Centro Pokémon o Casa del jugador
              const respawn = this.saveData.last_respawn_point || { map: 'player_house', x: 3, y: 5 };
              this.changeMap(respawn.map, respawn.x, respawn.y);
              this.player.facing = 'DOWN';

              const locationName = respawn.map.includes('pokemon_center') ? 'el Centro Pokémon' : 'tu hogar';
              this.state = 'DIALOGUE';
              this.dialogueMgr.startDialogue(
                `¡A ${this.saveData.player_name} no le quedan Pokémon para luchar!\n¡${this.saveData.player_name} cayó fuera de combate y se apresuró a refugiarse en ${locationName}!`,
                "Atención Médica"
              );
              this.activeBattle = null;
              this.audio.playSfx('cancel');
              return;
            }

            // 2. Curar equipo tras victoria o huida
            for (const p of this.saveData.party) {
              p.current_hp = p.max_hp;
              p.status = null;
              for (const m of p.moves) m.current_pp = m.max_pp;
            }

            // Si se capturó un Pokémon salvaje
            if (this.activeBattle.caught_pokemon) {
              const caught = this.activeBattle.caught_pokemon;
              if (this.saveData.party.length < 6) {
                this.saveData.party.push(caught);
              } else {
                if (!this.saveData.pc_boxes[0]) this.saveData.pc_boxes[0] = [];
                this.saveData.pc_boxes[0].push(caught);
              }
              if (!this.saveData.pokedex_seen.includes(caught.species_id)) {
                this.saveData.pokedex_seen.push(caught.species_id);
              }
              if (!this.saveData.pokedex_caught.includes(caught.species_id)) {
                this.saveData.pokedex_caught.push(caught.species_id);
              }
            }

            // Batalla inicial de Nahuel
            if (this.activeBattle.opponent_name?.includes("Nahuel") && !this.saveData.story_flags.defeated_nahuel_dock) {
              this.saveData.story_flags.defeated_nahuel_dock = true;
              this.state = 'DIALOGUE';
              this.dialogueMgr.startDialogue(
                "¡Magnífico combate de iniciación! Ambos han demostrado una conexión pura. Tomen la Pokédex Regional de Andara y 5 Poké Balls. ¡El sendero norte hacia la Ruta 1 está abierto para su gran viaje!",
                "Profesor Ceibo"
              );
              this.activeBattle = null;
              return;
            }

            // Victoria contra entrenador
            if (this.activeBattle.winner === 'player') {
              if (this.activeBattle.opponent_name) {
                this.saveData.story_flags[this.activeBattle.opponent_name + '_defeated'] = true;
              }

              if (this.activeBattle.opponent_name?.includes("Rocío")) {
                if (!this.saveData.badges.includes("Medalla Sedimento")) {
                  this.saveData.badges.push("Medalla Sedimento");
                  this.saveData.money += 2500;
                }
              } else if (this.activeBattle.opponent_name?.includes("Thiago")) {
                if (!this.saveData.badges.includes("Medalla Brote")) {
                  this.saveData.badges.push("Medalla Brote");
                  this.saveData.money += 3500;
                }
              }
              // Chequear si algún Pokémon puede evolucionar
              this.checkEvolution();
            }
          }
          if (this.state !== 'EVOLUTION') {
            this.state = 'OVERWORLD';
          }
          this.activeBattle = null;
        }
      }
      return;
    }

    if (this.battleRenderer.menuMode === 'MAIN') {
      if (code === 'ArrowLeft' || code === 'KeyA') this.battleRenderer.selectedMainMenuIndex = 0;
      else if (code === 'ArrowRight' || code === 'KeyD') this.battleRenderer.selectedMainMenuIndex = 1;
      else if (code === 'ArrowUp' || code === 'KeyW') this.battleRenderer.selectedMainMenuIndex = 0;
      else if (code === 'ArrowDown' || code === 'KeyS') this.battleRenderer.selectedMainMenuIndex = 2;
      else if (code === 'Enter' || code === 'Space' || code === 'KeyZ') {
        const idx = this.battleRenderer.selectedMainMenuIndex;
        if (idx === 0) this.battleRenderer.menuMode = 'MOVES';
        else if (idx === 1) this.battleRenderer.menuMode = 'BAG';
        else if (idx === 2) {
          this.battleRenderer.menuMode = 'PARTY';
          this.battleRenderer.selectedPartyIndex = 0;
        }
        else if (idx === 3) {
          // Huir
          const res = this.activeBattle.executeRound({ action_type: 'RUN' });
          this.battleRenderer.currentMessage = res.events[0]?.text || "¡Escapaste!";
        }
        this.audio.playSfx('confirm');
      }
    } else if (this.battleRenderer.menuMode === 'MOVES') {
      if (code === 'ArrowLeft' || code === 'KeyA') this.battleRenderer.selectedMoveIndex = 0;
      else if (code === 'ArrowRight' || code === 'KeyD') this.battleRenderer.selectedMoveIndex = 1;
      else if (code === 'ArrowUp' || code === 'KeyW') this.battleRenderer.selectedMoveIndex = 0;
      else if (code === 'ArrowDown' || code === 'KeyS') this.battleRenderer.selectedMoveIndex = 2;
      else if (code === 'Escape' || code === 'KeyX') {
        this.battleRenderer.menuMode = 'MAIN';
        this.audio.playSfx('cancel');
      } else if (code === 'Enter' || code === 'Space' || code === 'KeyZ') {
        // Ejecutar ataque con animación de partículas
        const moveIdx = this.battleRenderer.selectedMoveIndex;
        const playerPoke = this.activeBattle.player_party[0];
        const move = playerPoke?.moves[moveIdx];
        if (move) {
          this.battleRenderer.triggerAttackAnimation(move.data.type, true, this.canvas.width, this.canvas.height);
        }

        const res = this.activeBattle.executeRound({
          action_type: 'FIGHT',
          move_index: moveIdx,
          mega_evolve: true
        });

        // Animación de contraataque del rival
        const oppDamaged = res.events.some(e => e.type === 'damage' && e.target === 'player');
        if (oppDamaged) {
          const oppPoke = this.activeBattle.opponent_party[0];
          const oppType = oppPoke?.types[0] || 'normal';
          this.battleRenderer.triggerAttackAnimation(oppType, false, this.canvas.width, this.canvas.height);
        }

        this.battleRenderer.menuMode = 'MAIN';
        this.battleRenderer.currentMessage = res.events.map(e => e.text).join(" ");
        this.audio.playSfx('hit');
      }
    } else if (this.battleRenderer.menuMode === 'BAG') {
      const itemsCount = 5;
      if (code === 'ArrowLeft' || code === 'KeyA') {
        this.battleRenderer.selectedBagIndex = (this.battleRenderer.selectedBagIndex - 1 + itemsCount) % itemsCount;
        this.audio.playSfx('select');
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        this.battleRenderer.selectedBagIndex = (this.battleRenderer.selectedBagIndex + 1) % itemsCount;
        this.audio.playSfx('select');
      } else if (code === 'ArrowUp' || code === 'KeyW') {
        this.battleRenderer.selectedBagIndex = (this.battleRenderer.selectedBagIndex - 2 + itemsCount) % itemsCount;
        this.audio.playSfx('select');
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        this.battleRenderer.selectedBagIndex = (this.battleRenderer.selectedBagIndex + 2) % itemsCount;
        this.audio.playSfx('select');
      } else if (code === 'Escape' || code === 'KeyX') {
        this.battleRenderer.menuMode = 'MAIN';
        this.audio.playSfx('cancel');
      } else if (code === 'Enter' || code === 'Space' || code === 'KeyZ') {
        const bagIdx = this.battleRenderer.selectedBagIndex;
        if (bagIdx === 4) {
          // Volver
          this.battleRenderer.menuMode = 'MAIN';
          this.audio.playSfx('cancel');
          return;
        }

        let res: any;
        if (bagIdx === 0) {
          res = this.activeBattle.executeRound({ action_type: 'BALL', ball_id: 'pokeball' });
          this.audio.playSfx('catch');
        } else if (bagIdx === 1) {
          res = this.activeBattle.executeRound({ action_type: 'BALL', ball_id: 'greatball' });
          this.audio.playSfx('catch');
        } else if (bagIdx === 2) {
          // Poción (+50 PS)
          res = this.activeBattle.executeRound({ action_type: 'ITEM', item_id: 'potion', target_party_idx: 0 });
          this.audio.playSfx('confirm');
        } else if (bagIdx === 3) {
          // Superpoción (+100 PS)
          res = this.activeBattle.executeRound({ action_type: 'ITEM', item_id: 'superpotion', target_party_idx: 0 });
          this.audio.playSfx('confirm');
        }

        if (res) {
          this.battleRenderer.menuMode = 'MAIN';
          this.battleRenderer.currentMessage = res.events.map((e: any) => e.text).join(" ");
        }
      }
    } else if (this.battleRenderer.menuMode === 'PARTY') {
      const partyLen = this.activeBattle.player_party.length;
      const totalOptions = partyLen + 1; // +1 para botón Volver

      if (code === 'ArrowLeft' || code === 'KeyA') {
        this.battleRenderer.selectedPartyIndex = (this.battleRenderer.selectedPartyIndex - 1 + totalOptions) % totalOptions;
        this.audio.playSfx('select');
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        this.battleRenderer.selectedPartyIndex = (this.battleRenderer.selectedPartyIndex + 1) % totalOptions;
        this.audio.playSfx('select');
      } else if (code === 'ArrowUp' || code === 'KeyW') {
        this.battleRenderer.selectedPartyIndex = (this.battleRenderer.selectedPartyIndex - 3 + totalOptions) % totalOptions;
        this.audio.playSfx('select');
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        this.battleRenderer.selectedPartyIndex = (this.battleRenderer.selectedPartyIndex + 3) % totalOptions;
        this.audio.playSfx('select');
      } else if (code === 'Escape' || code === 'KeyX') {
        this.battleRenderer.menuMode = 'MAIN';
        this.audio.playSfx('cancel');
      } else if (code === 'Enter' || code === 'Space' || code === 'KeyZ') {
        const selPartyIdx = this.battleRenderer.selectedPartyIndex;
        if (selPartyIdx === partyLen) {
          // Volver
          this.battleRenderer.menuMode = 'MAIN';
          this.audio.playSfx('cancel');
          return;
        }

        const targetPoke = this.activeBattle.player_party[selPartyIdx];
        if (selPartyIdx === this.activeBattle.player_active_idx) {
          this.battleRenderer.currentMessage = `¡${targetPoke.nickname || targetPoke.species_name} ya está en combate!`;
          this.audio.playSfx('cancel');
          return;
        }
        if (targetPoke.current_hp <= 0) {
          this.battleRenderer.currentMessage = `¡${targetPoke.nickname || targetPoke.species_name} no tiene fuerzas para combatir!`;
          this.audio.playSfx('cancel');
          return;
        }

        // Ejecutar relevo
        const res = this.activeBattle.executeRound({
          action_type: 'SWITCH',
          switch_to_idx: selPartyIdx
        });

        this.battleRenderer.menuMode = 'MAIN';
        this.battleRenderer.currentMessage = res.events.map(e => e.text).join(" ");
        this.audio.playSfx('confirm');
      }
    }
  }

  private checkEvolution(): void {
    if (!this.saveData) return;
    const pokedex = this.loader.getJson('pokedex.json') || {};
    for (const poke of this.saveData.party) {
      const species = pokedex[poke.species_id.toString()] || pokedex[poke.species_id];
      if (species && species.evolution && species.evolution.level && poke.level >= species.evolution.level) {
        const targetSpecies = pokedex[species.evolution.target_id.toString()] || pokedex[species.evolution.target_id];
        if (targetSpecies) {
          this.evolutionScreen.startEvolution(poke, targetSpecies, () => {
            this.state = 'OVERWORLD';
          });
          this.state = 'EVOLUTION';
          this.audio.playSfx('confirm');
          return;
        }
      }
    }
  }

  private handlePauseMenuInput(code: string): void {
    if (this.pauseMenu.activeTab === 'MAIN') {
      if (code === 'ArrowUp' || code === 'KeyW') {
        this.pauseMenu.selectedIndex = (this.pauseMenu.selectedIndex - 1 + 5) % 5;
        this.audio.playSfx('select');
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        this.pauseMenu.selectedIndex = (this.pauseMenu.selectedIndex + 1) % 5;
        this.audio.playSfx('select');
      } else if (code === 'Enter' || code === 'Space' || code === 'KeyZ') {
        const item = this.pauseMenu.menuItems[this.pauseMenu.selectedIndex];
        if (item.isAction && this.saveData) {
          this.saveMgr.saveGame('save_slot_1', this.saveData);
          this.pauseMenu.showSaveToast("¡Partida guardada correctamente!");
          this.audio.playSfx('confirm');
        } else if (item.isExit) {
          this.state = 'TITLE';
          this.audio.playSfx('cancel');
        } else {
          this.pauseMenu.activeTab = item.tab;
          this.audio.playSfx('confirm');
        }
      } else if (code === 'Escape' || code === 'KeyX') {
        this.state = 'OVERWORLD';
        this.audio.playSfx('cancel');
      }
    } else if (this.pauseMenu.activeTab === 'POKEDEX') {
      if (code === 'ArrowUp' || code === 'KeyW') {
        this.pauseMenu.selectedPokedexIndex = Math.max(0, this.pauseMenu.selectedPokedexIndex - 1);
        this.audio.playSfx('select');
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        this.pauseMenu.selectedPokedexIndex = Math.min(80, this.pauseMenu.selectedPokedexIndex + 1);
        this.audio.playSfx('select');
      } else if (code === 'Space') {
        this.audio.playPokemonCry(this.pauseMenu.selectedPokedexIndex + 1);
      } else if (code === 'Escape' || code === 'KeyX') {
        this.pauseMenu.activeTab = 'MAIN';
        this.audio.playSfx('cancel');
      }
    } else {
      if (code === 'Escape' || code === 'KeyX') {
        this.pauseMenu.activeTab = 'MAIN';
        this.audio.playSfx('cancel');
      }
    }
  }

  private setupTouchControls(): void {
    const dpadButtons = document.querySelectorAll('.dpad-btn');
    dpadButtons.forEach(btn => {
      const dir = btn.getAttribute('data-dir');
      const codeMap: Record<string, string> = {
        up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight'
      };
      if (dir && codeMap[dir]) {
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          this.keysPressed.add(codeMap[dir]);
        });
        btn.addEventListener('pointerup', () => this.keysPressed.delete(codeMap[dir]));
        btn.addEventListener('pointerleave', () => this.keysPressed.delete(codeMap[dir]));
      }
    });

    const actionA = document.getElementById('btn-a');
    if (actionA) {
      actionA.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyZ' }));
      });
    }

    const actionB = document.getElementById('btn-b');
    if (actionB) {
      actionB.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyX' }));
      });
    }
  }

  private renderLoadingScreen(progress: number, message: string): void {
    this.ctx.fillStyle = '#030712';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#38bdf8';
    this.ctx.font = 'bold 24px "Outfit", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText("POKÉMON: ECOS DE ANDARA", this.canvas.width / 2, this.canvas.height / 2 - 30);

    // Barra de progreso
    const barW = 400;
    const barH = 12;
    const barX = (this.canvas.width - barW) / 2;
    const barY = this.canvas.height / 2;

    this.ctx.fillStyle = '#1e293b';
    this.ctx.fillRect(barX, barY, barW, barH);
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.fillRect(barX, barY, barW * progress, barH);

    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '14px "Outfit", sans-serif';
    this.ctx.fillText(message, this.canvas.width / 2, barY + 36);
  }
}

// Inicializar al cargar el DOM
window.addEventListener('DOMContentLoaded', () => {
  const engine = new GameEngine();
  engine.start();
});
