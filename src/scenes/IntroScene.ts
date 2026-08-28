import * as Phaser from 'phaser';
import { AudioManager } from '../audio';
import { DialogueBoxPhaser } from '../ui/DialogueBoxPhaser';

export type PlayerGender = 'boy' | 'girl';

export class IntroScene extends Phaser.Scene {
  private dialogueBox!: DialogueBoxPhaser;
  private professorSprite!: Phaser.GameObjects.Sprite;
  private spotlightGraphics!: Phaser.GameObjects.Graphics;

  // Estado del flujo de intro
  // 'GREETING' -> 'GENDER_SELECT' -> 'NAME_INPUT' -> 'FAREWELL'
  private introState: 'GREETING' | 'GENDER_SELECT' | 'NAME_INPUT' | 'FAREWELL' = 'GREETING';

  // Selección del jugador
  private selectedGender: PlayerGender = 'boy';
  private selectedName: string = 'Alex';
  private isTypingName: boolean = false;

  // Elementos de UI de selección de género
  private genderContainer!: Phaser.GameObjects.Container;
  private boyCard!: Phaser.GameObjects.Container;
  private girlCard!: Phaser.GameObjects.Container;
  private boyHighlight!: Phaser.GameObjects.Graphics;
  private girlHighlight!: Phaser.GameObjects.Graphics;

  // Elementos de UI de ingreso de nombre
  private nameContainer!: Phaser.GameObjects.Container;
  private nameDisplayText!: Phaser.GameObjects.Text;
  private nameCursorBlinkEvent!: Phaser.Time.TimerEvent;
  private isCursorVisible: boolean = true;
  private keyboardInputHandler!: (event: KeyboardEvent) => void;

  constructor() {
    super({ key: 'IntroScene' });
  }

  preload(): void {
    // Ilustraciones HD Oficiales estilo Ken Sugimori
    this.load.image('prof_ceibo_hd', '/assets/sprites/characters/hd/prof_ceibo.jpg');
    this.load.image('player_boy_hd', '/assets/sprites/characters/hd/player_boy.jpg');
    this.load.image('player_girl_hd', '/assets/sprites/characters/hd/player_girl.jpg');
  }

  create(): void {
    const { width, height } = this.scale;

    // 1. Fondo atmosférico con gradiente y estrellas
    this.createAtmosphericBackground(width, height);

    // 2. Foco de luz y Sprite del Profesor Ceibo
    this.createProfessorPresentation(width, height);

    // 3. Cuadro de diálogo letra por letra
    this.dialogueBox = new DialogueBoxPhaser({
      scene: this,
      charDelayMs: 22,
      onLetterTyped: () => {
        AudioManager.getInstance().playSfx('typewriter');
      }
    });

    // 4. Crear Contenedores de Selección (ocultos inicialmente)
    this.createGenderSelectionUI(width, height);
    this.createNameInputUI(width, height);

    // 5. Iniciar música de introducción o ambiental
    AudioManager.getInstance().playBgm('intro');

    // 6. Iniciar primer diálogo del Profesor Ceibo
    this.startGreetingSequence();
  }

  /**
   * Crea el fondo espacial/etéreo con partículas de polvo estelar flotantes.
   */
  private createAtmosphericBackground(w: number, h: number): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0f1d, 0x0a0f1d, 0x1e1b4b, 0x1e1b4b, 1);
    bg.fillRect(0, 0, w, h);

    // Partículas de luz suave
    for (let i = 0; i < 30; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        Phaser.Math.Between(1, 3),
        0x38bdf8,
        Phaser.Math.FloatBetween(0.2, 0.7)
      );

      this.tweens.add({
        targets: star,
        y: star.y - Phaser.Math.Between(20, 60),
        alpha: { from: star.alpha, to: 0.1 },
        duration: Phaser.Math.Between(3000, 7000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  /**
   * Genera el foco de luz y la presentación del Profesor Ceibo con arte HD.
   */
  private createProfessorPresentation(w: number, h: number): void {
    this.spotlightGraphics = this.add.graphics();
    // Halo exterior suave cian / azul noche
    this.spotlightGraphics.fillStyle(0x0284c7, 0.35);
    this.spotlightGraphics.fillEllipse(w / 2, 290, 280, 80);
    // Luz cian intermedia
    this.spotlightGraphics.fillStyle(0x38bdf8, 0.45);
    this.spotlightGraphics.fillEllipse(w / 2, 290, 190, 50);

    // Marco circular de cristal para la ilustración HD del Profesor
    const frameGraphics = this.add.graphics();
    frameGraphics.fillStyle(0x0f172a, 0.85);
    frameGraphics.fillCircle(w / 2, 165, 105);
    frameGraphics.lineStyle(4, 0x38bdf8, 0.95);
    frameGraphics.strokeCircle(w / 2, 165, 105);

    // Ilustración HD del Profesor Ceibo
    this.professorSprite = this.add.sprite(w / 2, 165, 'prof_ceibo_hd');
    this.professorSprite.setDisplaySize(200, 200);

    // Máscara circular para el arte
    const maskShape = this.make.graphics({});
    maskShape.fillStyle(0xffffff);
    maskShape.fillCircle(w / 2, 165, 100);
    const mask = maskShape.createGeometryMask();
    this.professorSprite.setMask(mask);

    // Animación suave de respiración / flotación del profesor
    this.tweens.add({
      targets: [this.professorSprite, frameGraphics],
      y: '-=8',
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Secuencia 1: Saludo inicial del Profesor Ceibo al jugador.
   */
  private startGreetingSequence(): void {
    this.introState = 'GREETING';
    const sentences = [
      '¡Hola! ¡Te doy una cordial bienvenida al fascinante mundo de POKÉMON!',
      'Mi nombre es CEIBO. En toda la región de Andara me conocen y respetan como el PROFESOR POKÉMON.',
      'En esta tierra mística, humanos y Pokémon vivimos en estrecha armonía, explorando misterios y superando desafíos.',
      'Pero antes de que emprendas tu viaje... dime un poco sobre ti.'
    ];

    this.dialogueBox.startDialogue('Prof. Ceibo', sentences, () => {
      this.showGenderSelection();
    });
  }

  /**
   * Secuencia 2: Creación de las tarjetas interactivas de Chico / Chica en HD.
   */
  private createGenderSelectionUI(w: number, h: number): void {
    this.genderContainer = this.add.container(0, 0);
    this.genderContainer.setVisible(false);

    const cardY = 195;
    const boyX = w / 2 - 140;
    const girlX = w / 2 + 140;

    // --- Tarjeta Chico ---
    this.boyCard = this.add.container(boyX, cardY);
    this.boyHighlight = this.add.graphics();
    this.drawCardBackground(this.boyHighlight, 0x0284c7, true);

    const boySprite = this.add.image(0, -20, 'player_boy_hd');
    boySprite.setDisplaySize(155, 155);

    // Máscara redondeada para la ilustración
    const boyMaskGraphics = this.make.graphics({});
    boyMaskGraphics.fillStyle(0xffffff);
    boyMaskGraphics.fillRoundedRect(boyX - 75, cardY - 95, 150, 150, 12);
    boySprite.setMask(boyMaskGraphics.createGeometryMask());

    const boyLabel = this.add.text(0, 75, 'ALEX (CHICO)', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      color: '#38bdf8',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.boyCard.add([this.boyHighlight, boySprite, boyLabel]);
    this.boyCard.setSize(180, 230);
    this.boyCard.setInteractive({ useHandCursor: true });
    this.boyCard.on('pointerdown', () => {
      this.setGender('boy');
      this.confirmGender();
    });
    this.boyCard.on('pointerover', () => this.setGender('boy'));

    // --- Tarjeta Chica ---
    this.girlCard = this.add.container(girlX, cardY);
    this.girlHighlight = this.add.graphics();
    this.drawCardBackground(this.girlHighlight, 0xdb2777, false);

    const girlSprite = this.add.image(0, -20, 'player_girl_hd');
    girlSprite.setDisplaySize(155, 155);

    // Máscara redondeada para la ilustración
    const girlMaskGraphics = this.make.graphics({});
    girlMaskGraphics.fillStyle(0xffffff);
    girlMaskGraphics.fillRoundedRect(girlX - 75, cardY - 95, 150, 150, 12);
    girlSprite.setMask(girlMaskGraphics.createGeometryMask());

    const girlLabel = this.add.text(0, 75, 'VALERIA (CHICA)', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      color: '#f472b6',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.girlCard.add([this.girlHighlight, girlSprite, girlLabel]);
    this.girlCard.setSize(180, 230);
    this.girlCard.setInteractive({ useHandCursor: true });
    this.girlCard.on('pointerdown', () => {
      this.setGender('girl');
      this.confirmGender();
    });
    this.girlCard.on('pointerover', () => this.setGender('girl'));

    // Botón de confirmación visual
    const confirmBtn = this.add.container(w / 2, 345);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x22c55e, 1);
    btnBg.fillRoundedRect(-110, -22, 220, 44, 10);
    btnBg.lineStyle(2, 0xffffff, 1);
    btnBg.strokeRoundedRect(-110, -22, 220, 44, 10);

    const btnText = this.add.text(0, 0, 'CONFIRMAR (Espacio/Enter)', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    confirmBtn.add([btnBg, btnText]);
    confirmBtn.setSize(220, 44);
    confirmBtn.setInteractive({ useHandCursor: true });
    confirmBtn.on('pointerdown', () => this.confirmGender());

    this.genderContainer.add([this.boyCard, this.girlCard, confirmBtn]);
  }

  private drawCardBackground(g: Phaser.GameObjects.Graphics, color: number, isSelected: boolean): void {
    g.clear();
    g.fillStyle(0x0f172a, 0.9);
    g.fillRoundedRect(-85, -100, 170, 200, 14);

    if (isSelected) {
      g.lineStyle(4, color, 1);
      g.strokeRoundedRect(-85, -100, 170, 200, 14);
      g.fillStyle(color, 0.2);
      g.fillRoundedRect(-85, -100, 170, 200, 14);
    } else {
      g.lineStyle(2, 0x334155, 0.7);
      g.strokeRoundedRect(-85, -100, 170, 200, 14);
    }
  }

  private showGenderSelection(): void {
    this.introState = 'GENDER_SELECT';

    // Mover al profesor a la esquina superior izquierda
    this.tweens.add({
      targets: this.professorSprite,
      x: 140,
      y: 90,
      scale: 0.75,
      duration: 600,
      ease: 'Power2'
    });

    this.tweens.add({
      targets: this.spotlightGraphics,
      x: -340,
      y: -190,
      scale: 0.5,
      duration: 600,
      ease: 'Power2'
    });

    this.genderContainer.setVisible(true);
    this.genderContainer.setAlpha(0);
    this.tweens.add({
      targets: this.genderContainer,
      alpha: 1,
      duration: 400
    });

    this.setGender('boy');
  }

  private setGender(gender: PlayerGender): void {
    if (this.selectedGender !== gender) {
      AudioManager.getInstance().playSfx('select');
    }
    this.selectedGender = gender;
    this.drawCardBackground(this.boyHighlight, 0x38bdf8, gender === 'boy');
    this.drawCardBackground(this.girlHighlight, 0xf472b6, gender === 'girl');

    this.boyCard.setScale(gender === 'boy' ? 1.06 : 0.96);
    this.girlCard.setScale(gender === 'girl' ? 1.06 : 0.96);
  }

  private confirmGender(): void {
    if (this.introState !== 'GENDER_SELECT') return;
    AudioManager.getInstance().playSfx('confirm');

    this.tweens.add({
      targets: this.genderContainer,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.genderContainer.setVisible(false);
        this.showNameInput();
      }
    });
  }

  /**
   * Secuencia 3: Pantalla interactiva de ingreso de nombre del protagonista.
   */
  private createNameInputUI(w: number, h: number): void {
    this.nameContainer = this.add.container(0, 0);
    this.nameContainer.setVisible(false);

    // Marco central de nombre
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x0f172a, 0.95);
    panelBg.fillRoundedRect(w / 2 - 250, 70, 500, 300, 16);
    panelBg.lineStyle(3, 0x38bdf8, 1);
    panelBg.strokeRoundedRect(w / 2 - 250, 70, 500, 300, 16);

    const title = this.add.text(w / 2, 100, '¿CÓMO TE LLAMAS?', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#f8fafc',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Caja de texto con nombre ingresado
    const inputFieldBg = this.add.graphics();
    inputFieldBg.fillStyle(0x1e293b, 1);
    inputFieldBg.fillRoundedRect(w / 2 - 160, 130, 320, 50, 8);
    inputFieldBg.lineStyle(2, 0x64748b, 1);
    inputFieldBg.strokeRoundedRect(w / 2 - 160, 130, 320, 50, 8);

    this.nameDisplayText = this.add.text(w / 2, 155, 'ALEX_', {
      fontFamily: 'Courier New, monospace',
      fontSize: '28px',
      color: '#38bdf8',
      fontStyle: 'bold',
      letterSpacing: 4
    }).setOrigin(0.5);

    // Nombres sugeridos rápidos
    const presetLabel = this.add.text(w / 2, 200, 'O elige un nombre sugerido:', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    const presetsContainer = this.add.container(0, 0);
    const presets = ['ALEX', 'LEO', 'NAHUEL', 'LUCÍA', 'MAYA', 'VALERIA'];

    presets.forEach((preset, idx) => {
      const px = w / 2 - 190 + (idx % 3) * 130;
      const py = 235 + Math.floor(idx / 3) * 45;

      const pBtn = this.add.container(px, py);
      const pBg = this.add.graphics();
      pBg.fillStyle(0x334155, 1);
      pBg.fillRoundedRect(-55, -16, 110, 32, 6);
      pBg.lineStyle(1, 0x475569, 1);
      pBg.strokeRoundedRect(-55, -16, 110, 32, 6);

      const pTxt = this.add.text(0, 0, preset, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#f8fafc',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      pBtn.add([pBg, pTxt]);
      pBtn.setSize(110, 32);
      pBtn.setInteractive({ useHandCursor: true });
      pBtn.on('pointerdown', () => {
        AudioManager.getInstance().playSfx('select');
        this.selectedName = preset;
        this.updateNameDisplay();
      });
      pBtn.on('pointerover', () => {
        pBg.clear();
        pBg.fillStyle(0x0284c7, 1);
        pBg.fillRoundedRect(-55, -16, 110, 32, 6);
      });
      pBtn.on('pointerout', () => {
        pBg.clear();
        pBg.fillStyle(0x334155, 1);
        pBg.fillRoundedRect(-55, -16, 110, 32, 6);
      });

      presetsContainer.add(pBtn);
    });

    // Botón Aceptar Nombre
    const acceptBtn = this.add.container(w / 2, 335);
    const aBg = this.add.graphics();
    aBg.fillStyle(0x22c55e, 1);
    aBg.fillRoundedRect(-120, -20, 240, 40, 8);
    aBg.lineStyle(2, 0xffffff, 1);
    aBg.strokeRoundedRect(-120, -20, 240, 40, 8);

    const aTxt = this.add.text(0, 0, '¡LISTO! EMPEZAR AVENTURA', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    acceptBtn.add([aBg, aTxt]);
    acceptBtn.setSize(240, 40);
    acceptBtn.setInteractive({ useHandCursor: true });
    acceptBtn.on('pointerdown', () => this.confirmName());

    this.nameContainer.add([panelBg, title, inputFieldBg, this.nameDisplayText, presetLabel, presetsContainer, acceptBtn]);

    // Timer para parpadeo del cursor '_'
    this.nameCursorBlinkEvent = this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        this.isCursorVisible = !this.isCursorVisible;
        this.updateNameDisplay();
      }
    });
  }

  private showNameInput(): void {
    this.introState = 'NAME_INPUT';
    this.isTypingName = true;
    this.selectedName = this.selectedGender === 'boy' ? 'Alex' : 'Lucía';

    this.nameContainer.setVisible(true);
    this.nameContainer.setAlpha(0);
    this.tweens.add({
      targets: this.nameContainer,
      alpha: 1,
      duration: 400
    });

    this.updateNameDisplay();
    this.setupKeyboardTyping();
  }

  private updateNameDisplay(): void {
    const cursor = this.isCursorVisible ? '_' : ' ';
    this.nameDisplayText.setText(`${this.selectedName.toUpperCase()}${cursor}`);
  }

  private setupKeyboardTyping(): void {
    this.keyboardInputHandler = (e: KeyboardEvent) => {
      if (this.introState !== 'NAME_INPUT') return;

      if (e.key === 'Enter') {
        this.confirmName();
        return;
      }

      if (e.key === 'Backspace') {
        if (this.selectedName.length > 0) {
          this.selectedName = this.selectedName.slice(0, -1);
          AudioManager.getInstance().playSfx('select');
          this.updateNameDisplay();
        }
        return;
      }

      // Letras válidas (A-Z, longitud máxima 10)
      if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]$/.test(e.key) && this.selectedName.length < 10) {
        this.selectedName += e.key;
        AudioManager.getInstance().playSfx('typewriter');
        this.updateNameDisplay();
      }
    };

    window.addEventListener('keydown', this.keyboardInputHandler);
  }

  private confirmName(): void {
    if (this.introState !== 'NAME_INPUT') return;

    if (!this.selectedName.trim()) {
      this.selectedName = this.selectedGender === 'boy' ? 'Alex' : 'Lucía';
    }

    AudioManager.getInstance().playSfx('confirm');
    if (this.keyboardInputHandler) {
      window.removeEventListener('keydown', this.keyboardInputHandler);
    }

    this.tweens.add({
      targets: this.nameContainer,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.nameContainer.setVisible(false);
        this.startFarewellSequence();
      }
    });
  }

  /**
   * Secuencia 4: Despedida del Profesor Ceibo y transición cinematográfica al Overworld.
   */
  private startFarewellSequence(): void {
    this.introState = 'FAREWELL';

    // Regresar al profesor al centro con su avatar final
    this.tweens.add({
      targets: this.professorSprite,
      x: this.scale.width / 2,
      y: 175,
      scale: 1.25,
      duration: 600,
      ease: 'Power2'
    });

    this.tweens.add({
      targets: this.spotlightGraphics,
      x: 0,
      y: 0,
      scale: 1,
      duration: 600,
      ease: 'Power2'
    });

    const finalSentences = [
      `¡Así que te llamas ${this.selectedName.toUpperCase()}! ¡Un nombre magnífico!`,
      `${this.selectedName.toUpperCase()}, ha llegado el instante en que tu propio destino en Andara cobrará vida.`,
      '¡Coraje, pasión y compañerismo te guiarán en cada rincón de este mundo!'
    ];

    this.dialogueBox.startDialogue('Prof. Ceibo', finalSentences, () => {
      this.transitionToOverworld();
    });
  }

  /**
   * Transición con destello blanco hacia Villa Tranquimar.
   */
  private transitionToOverworld(): void {
    const spriteKey = this.selectedGender === 'girl' ? 'player_female' : 'player';

    // Efecto de desvanecimiento con flash blanco estilo GBA
    const flash = this.add.graphics();
    flash.fillStyle(0xffffff, 1);
    flash.fillRect(0, 0, this.scale.width, this.scale.height);
    flash.setAlpha(0);
    flash.setDepth(100);

    AudioManager.getInstance().playSfx('confirm');

    this.tweens.add({
      targets: flash,
      alpha: 1,
      duration: 800,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        this.scene.start('OverworldScene', {
          playerName: this.selectedName,
          gender: this.selectedGender,
          spriteKey: spriteKey,
          mapKey: 'villa_tranquimar',
          spawnX: 300,
          spawnY: 240
        });
      }
    });
  }

  update(): void {
    // Control por teclado para selección de género
    if (this.introState === 'GENDER_SELECT') {
      const leftKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
      const rightKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
      const aKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      const dKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      const spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      const enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      const zKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

      if (Phaser.Input.Keyboard.JustDown(leftKey!) || Phaser.Input.Keyboard.JustDown(aKey!)) {
        this.setGender('boy');
      }
      if (Phaser.Input.Keyboard.JustDown(rightKey!) || Phaser.Input.Keyboard.JustDown(dKey!)) {
        this.setGender('girl');
      }
      if (Phaser.Input.Keyboard.JustDown(spaceKey!) || Phaser.Input.Keyboard.JustDown(enterKey!) || Phaser.Input.Keyboard.JustDown(zKey!)) {
        this.confirmGender();
      }
    }

    // Diálogos activos
    if (this.dialogueBox && this.dialogueBox.isDialogueActive()) {
      const spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      const enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      const zKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

      if (
        Phaser.Input.Keyboard.JustDown(spaceKey!) ||
        Phaser.Input.Keyboard.JustDown(enterKey!) ||
        Phaser.Input.Keyboard.JustDown(zKey!)
      ) {
        this.dialogueBox.handleSpacePress();
      }
    }
  }
}
