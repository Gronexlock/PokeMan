import * as Phaser from 'phaser';
import { BattlePokemon } from '../core/battle';
import { DialogueBoxPhaser } from '../ui/DialogueBoxPhaser';
import { AudioManager } from '../audio';

export type SafariZone = 'botanical_greenhouse' | 'geothermal_valley' | 'coastal_lagoon' | 'central_plaza';

export interface SafariStarterEntry {
  speciesId: number;
  name: string;
  type: 'grass' | 'fire' | 'water';
  zone: SafariZone;
  levelRange: [number, number];
}

/**
 * Gestor de la Reserva Ecológica de Andara (Zona Safari).
 *
 * Características oficiales según el documento maestro:
 * 1. SIN límite de pasos ni cronómetro (exploración libre y tranquila).
 * 2. Asignación fija de 30 Safari Balls al ingresar pagando la entrada.
 * 3. La sesión concluye únicamente cuando se agotan las 30 bolas o al salir voluntariamente.
 * 4. Hábitat exclusivo de los iniciales de todas las generaciones (Planta, Fuego, Agua).
 */
export class SafariManager {
  private scene: Phaser.Scene;
  private dialogueBox: DialogueBoxPhaser;

  // Estado de la sesión Safari
  private isActive: boolean = false;
  private safariBallsRemaining: number = 0;
  private totalCaughtInSession: number = 0;
  private currentZone: SafariZone = 'central_plaza';

  // HUD de Safari Balls en pantalla
  private hudContainer!: Phaser.GameObjects.Container;
  private ballCountText!: Phaser.GameObjects.Text;

  // Catálogo completo de iniciales disponibles en la Reserva Ecológica
  static readonly SAFARI_STARTERS: SafariStarterEntry[] = [
    // 🌱 Invernadero Botánico (Planta)
    { speciesId: 1,   name: 'Bulbasaur',  type: 'grass', zone: 'botanical_greenhouse', levelRange: [12, 16] },
    { speciesId: 252, name: 'Treecko',    type: 'grass', zone: 'botanical_greenhouse', levelRange: [12, 16] },
    { speciesId: 387, name: 'Turtwig',    type: 'grass', zone: 'botanical_greenhouse', levelRange: [12, 16] },
    { speciesId: 495, name: 'Snivy',      type: 'grass', zone: 'botanical_greenhouse', levelRange: [12, 16] },
    { speciesId: 650, name: 'Chespin',    type: 'grass', zone: 'botanical_greenhouse', levelRange: [12, 16] },
    { speciesId: 722, name: 'Rowlet',     type: 'grass', zone: 'botanical_greenhouse', levelRange: [12, 16] },
    { speciesId: 906, name: 'Sprigatito', type: 'grass', zone: 'botanical_greenhouse', levelRange: [12, 16] },

    // 🔥 Faldas Volcánicas & Zona Geotérmica (Fuego)
    { speciesId: 4,   name: 'Charmander', type: 'fire',  zone: 'geothermal_valley',    levelRange: [12, 16] },
    { speciesId: 155, name: 'Cyndaquil',  type: 'fire',  zone: 'geothermal_valley',    levelRange: [12, 16] },
    { speciesId: 255, name: 'Torchic',    type: 'fire',  zone: 'geothermal_valley',    levelRange: [12, 16] },
    { speciesId: 390, name: 'Chimchar',   type: 'fire',  zone: 'geothermal_valley',    levelRange: [12, 16] },
    { speciesId: 653, name: 'Fennekin',   type: 'fire',  zone: 'geothermal_valley',    levelRange: [12, 16] },
    { speciesId: 725, name: 'Litten',     type: 'fire',  zone: 'geothermal_valley',    levelRange: [12, 16] },
    { speciesId: 909, name: 'Fuecoco',    type: 'fire',  zone: 'geothermal_valley',    levelRange: [12, 16] },

    // 💧 Laguna Costera & Riberas (Agua)
    { speciesId: 7,   name: 'Squirtle',   type: 'water', zone: 'coastal_lagoon',       levelRange: [12, 16] },
    { speciesId: 158, name: 'Totodile',   type: 'water', zone: 'coastal_lagoon',       levelRange: [12, 16] },
    { speciesId: 258, name: 'Mudkip',     type: 'water', zone: 'coastal_lagoon',       levelRange: [12, 16] },
    { speciesId: 393, name: 'Piplup',     type: 'water', zone: 'coastal_lagoon',       levelRange: [12, 16] },
    { speciesId: 656, name: 'Froakie',    type: 'water', zone: 'coastal_lagoon',       levelRange: [12, 16] },
    { speciesId: 728, name: 'Popplio',    type: 'water', zone: 'coastal_lagoon',       levelRange: [12, 16] },
    { speciesId: 912, name: 'Quaxly',     type: 'water', zone: 'coastal_lagoon',       levelRange: [12, 16] },
  ];

  constructor(scene: Phaser.Scene, dialogueBox: DialogueBoxPhaser) {
    this.scene = scene;
    this.dialogueBox = dialogueBox;
    this.createHud();
  }

  /**
   * Crea el HUD superior fijo con el contador de Safari Balls restantes.
   */
  private createHud(): void {
    this.hudContainer = this.scene.add.container(20, 20);
    this.hudContainer.setScrollFactor(0);
    this.hudContainer.setDepth(900);
    this.hudContainer.setVisible(false);

    // Fondo translúcido esmeralda
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1b4332, 0.85);
    bg.fillRoundedRect(0, 0, 180, 40, 8);
    bg.lineStyle(2, 0x52b788, 1);
    bg.strokeRoundedRect(0, 0, 180, 40, 8);
    this.hudContainer.add(bg);

    // Ícono y texto de Safari Balls
    const icon = this.scene.add.text(12, 10, '🟢', { fontSize: '18px' });
    this.ballCountText = this.scene.add.text(40, 12, 'Safari Balls: 30', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    });

    this.hudContainer.add([icon, this.ballCountText]);
  }

  /**
   * Inicia formalmente una sesión en la Reserva Ecológica tras pagar la entrada.
   * @param entryFee - Costo en dinero (default: $500).
   * @param playerMoney - Dinero actual del jugador.
   * @param onStartSession - Callback al confirmar acceso.
   */
  public enterSafariZone(
    entryFee: number = 500,
    playerMoney: number,
    onSuccess: (newMoney: number) => void
  ): void {
    if (playerMoney < entryFee) {
      this.dialogueBox.startDialogue(
        '🌿 Guardaparque de la Reserva',
        [
          '¡Bienvenido a la Reserva Ecológica de Andara!',
          `La tarifa de entrada es de $${entryFee} Pokécuartos.`,
          'Parece que no tienes suficiente dinero en este momento. ¡Vuelve pronto!'
        ]
      );
      return;
    }

    this.dialogueBox.startDialogue(
      '🌿 Guardaparque de la Reserva',
      [
        '¡Bienvenido a la Reserva Ecológica de Andara!',
        `Por una tarifa de $${entryFee} recibirás 30 Safari Balls especiales.`,
        'Aquí no hay límite de pasos ni de tiempo: explora los microclimas a tu ritmo.',
        'La sesión finalizará únicamente cuando agotes tus 30 Safari Balls.',
        '¡Que disfrutes tu expedición en el santuario natural!'
      ],
      () => {
        this.isActive = true;
        this.safariBallsRemaining = 30;
        this.totalCaughtInSession = 0;
        this.updateHud();
        this.hudContainer.setVisible(true);
        AudioManager.getInstance().playSfx('confirm');
        onSuccess(playerMoney - entryFee);
      }
    );
  }

  /**
   * Consume una Safari Ball al intentar una captura en combate.
   * Devuelve true si la sesión continúa o false si se han agotado todas las bolas.
   */
  public consumeSafariBall(): boolean {
    if (!this.isActive || this.safariBallsRemaining <= 0) return false;

    this.safariBallsRemaining--;
    this.updateHud();

    if (this.safariBallsRemaining === 0) {
      this.finishSafariSession('out_of_balls');
      return false;
    }

    return true;
  }

  /**
   * Registra una captura exitosa en la sesión actual.
   */
  public registerCapture(): void {
    this.totalCaughtInSession++;
  }

  /**
   * Actualiza el texto del HUD en pantalla.
   */
  private updateHud(): void {
    if (this.ballCountText) {
      this.ballCountText.setText(`Safari Balls: ${this.safariBallsRemaining}`);
      if (this.safariBallsRemaining <= 5) {
        this.ballCountText.setColor('#ff4757');
      } else {
        this.ballCountText.setColor('#ffffff');
      }
    }
  }

  /**
   * Finaliza la sesión del Safari y muestra el resumen al jugador.
   */
  public finishSafariSession(reason: 'out_of_balls' | 'voluntary_exit', onComplete?: () => void): void {
    this.isActive = false;
    this.hudContainer.setVisible(false);

    const message = reason === 'out_of_balls'
      ? [
          '¡Ding-Dong! ¡Se te han agotado las Safari Balls!',
          `Tu sesión en la Reserva Ecológica ha finalizado.`,
          `¡Has conseguido capturar ${this.totalCaughtInSession} Pokémon en esta expedición!`,
          'Esperamos que vuelvas a visitarnos pronto.'
        ]
      : [
          '¿Deseas dar por terminada tu visita a la Reserva Ecológica?',
          `Has capturado ${this.totalCaughtInSession} Pokémon.`,
          '¡Gracias por cuidar el santuario natural de Andara!'
        ];

    this.dialogueBox.startDialogue('🌿 Guardaparque de la Reserva', message, () => {
      AudioManager.getInstance().playSfx('confirm');
      onComplete?.();
    });
  }

  /**
   * Obtiene un encuentro de Pokémon inicial salvaje aleatorio según la zona actual.
   */
  public getRandomSafariEncounter(zone: SafariZone): SafariStarterEntry | null {
    const candidates = SafariManager.SAFARI_STARTERS.filter(s => s.zone === zone);
    if (candidates.length === 0) return null;
    const idx = Phaser.Math.Between(0, candidates.length - 1);
    return candidates[idx];
  }

  public setZone(zone: SafariZone): void {
    this.currentZone = zone;
  }

  public get isSessionActive(): boolean {
    return this.isActive;
  }

  public get remainingBalls(): number {
    return this.safariBallsRemaining;
  }

  public get caughtCount(): number {
    return this.totalCaughtInSession;
  }
}
