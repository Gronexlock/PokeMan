import * as Phaser from 'phaser';
import { AudioManager } from '../audio';

export interface DialogueBoxConfig {
  scene: Phaser.Scene;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  charDelayMs?: number; // Tiempo en ms entre cada letra (efecto máquina de escribir)
  fontFamily?: string;
  fontSize?: string;
  textColor?: string;
  speakerColor?: string;
  backgroundColor?: number;
  borderColor?: number;
  onLetterTyped?: () => void; // Hook opcional para reproducir sonido de texto
}

export class DialogueBoxPhaser {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private bgGraphics: Phaser.GameObjects.Graphics;
  private speakerText: Phaser.GameObjects.Text;
  private contentText: Phaser.GameObjects.Text;
  private continueArrow: Phaser.GameObjects.Text;
  private arrowTween!: Phaser.Tweens.Tween;

  // Configuración
  private charDelayMs: number;
  private boxWidth: number;
  private boxHeight: number;
  private onLetterTyped?: () => void;

  // Estado del Diálogo
  private dialogueQueue: string[] = [];
  private currentSentenceIndex: number = 0;
  private fullCurrentText: string = '';
  private currentDisplayedLength: number = 0;
  private isTyping: boolean = false;
  private typingTimerEvent: Phaser.Time.TimerEvent | null = null;
  private isOpen: boolean = false;
  private onCompleteCallback?: () => void;

  constructor(config: DialogueBoxConfig) {
    this.scene = config.scene;
    this.charDelayMs = config.charDelayMs ?? 25;
    this.onLetterTyped = config.onLetterTyped;

    const gameWidth = this.scene.scale.width;
    const gameHeight = this.scene.scale.height;

    this.boxWidth = config.width ?? (gameWidth - 40);
    this.boxHeight = config.height ?? 140;
    const posX = config.x ?? 20;
    const posY = config.y ?? (gameHeight - this.boxHeight - 15);

    // Contenedor principal de UI fijado en la cámara
    this.container = this.scene.add.container(posX, posY);
    this.container.setScrollFactor(0); // Fijo en pantalla independiente del movimiento de cámara
    this.container.setDepth(1000);     // Capa Z superior

    // 1. Gráficos de Fondo con bordes redondeados estilo Pokémon
    this.bgGraphics = this.scene.add.graphics();
    this.drawBox(
      config.backgroundColor ?? 0x1a252f,
      config.borderColor ?? 0xecf0f1
    );
    this.container.add(this.bgGraphics);

    // 2. Etiqueta del Hablante (Speaker Name Tag)
    this.speakerText = this.scene.add.text(25, 12, '', {
      fontFamily: config.fontFamily ?? 'Arial, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: config.speakerColor ?? '#f1c40f'
    });
    this.container.add(this.speakerText);

    // 3. Texto del Diálogo con ajuste de línea automático (Word Wrap)
    this.contentText = this.scene.add.text(25, 38, '', {
      fontFamily: config.fontFamily ?? 'Arial, sans-serif',
      fontSize: config.fontSize ?? '18px',
      color: config.textColor ?? '#ffffff',
      lineSpacing: 8,
      wordWrap: { width: this.boxWidth - 50 }
    });
    this.container.add(this.contentText);

    // 4. Indicador de Continuación (Flecha parpadeante)
    this.continueArrow = this.scene.add.text(this.boxWidth - 35, this.boxHeight - 32, '▼', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#f1c40f'
    });
    this.continueArrow.setVisible(false);
    this.container.add(this.continueArrow);

    // Animación de rebote de la flecha
    this.arrowTween = this.scene.tweens.add({
      targets: this.continueArrow,
      y: this.boxHeight - 26,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Ocultar al inicio
    this.container.setVisible(false);
  }

  private drawBox(bgColor: number, borderColor: number): void {
    this.bgGraphics.clear();
    // Fondo translúcido elegante
    this.bgGraphics.fillStyle(bgColor, 0.96);
    this.bgGraphics.fillRoundedRect(0, 0, this.boxWidth, this.boxHeight, 10);
    // Borde brillante
    this.bgGraphics.lineStyle(3, borderColor, 1);
    this.bgGraphics.strokeRoundedRect(0, 0, this.boxWidth, this.boxHeight, 10);
  }

  /**
   * Inicia la visualización de un array de diálogos para un hablante.
   */
  public startDialogue(speaker: string, sentences: string[], onComplete?: () => void): void {
    if (!sentences || sentences.length === 0) return;

    this.isOpen = true;
    this.dialogueQueue = [...sentences];
    this.currentSentenceIndex = 0;
    this.onCompleteCallback = onComplete;

    this.speakerText.setText(speaker ? `[ ${speaker} ]` : '');
    this.container.setVisible(true);

    this.showCurrentSentence();
  }

  /**
   * Inicia el efecto de escritura letra por letra para la frase activa.
   */
  private showCurrentSentence(): void {
    this.fullCurrentText = this.dialogueQueue[this.currentSentenceIndex] || '';
    this.currentDisplayedLength = 0;
    this.contentText.setText('');
    this.isTyping = true;
    this.continueArrow.setVisible(false);

    if (this.typingTimerEvent) {
      this.typingTimerEvent.remove();
    }

    this.typingTimerEvent = this.scene.time.addEvent({
      delay: this.charDelayMs,
      callback: this.typeNextChar,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * Agrega la siguiente letra e invoca el sonido correspondiente.
   */
  private typeNextChar(): void {
    if (this.currentDisplayedLength < this.fullCurrentText.length) {
      this.currentDisplayedLength++;
      this.contentText.setText(this.fullCurrentText.substring(0, this.currentDisplayedLength));

      if (this.onLetterTyped && this.currentDisplayedLength % 2 === 0) {
        this.onLetterTyped();
      }
    } else {
      this.finishTypingCurrentSentence();
    }
  }

  /**
   * Completa instantáneamente la frase actual si el jugador presiona Espacio durante la animación.
   */
  private finishTypingCurrentSentence(): void {
    if (this.typingTimerEvent) {
      this.typingTimerEvent.remove();
      this.typingTimerEvent = null;
    }

    this.isTyping = false;
    this.currentDisplayedLength = this.fullCurrentText.length;
    this.contentText.setText(this.fullCurrentText);
    this.continueArrow.setVisible(true);
  }

  /**
   * Manejador de la pulsación de la Barra Espaciadora / Botón de Acción.
   * - Si está escribiendo: completa el texto inmediatamente.
   * - Si ya terminó de escribir: pasa a la siguiente frase o cierra el cuadro.
   */
  public handleSpacePress(): boolean {
    if (!this.isOpen) return false;

    if (this.isTyping) {
      // Completar texto instantáneamente
      this.finishTypingCurrentSentence();
      return true;
    }

    // Avanzar a la siguiente frase
    this.currentSentenceIndex++;
    if (this.currentSentenceIndex < this.dialogueQueue.length) {
      AudioManager.getInstance().playSfx('select');
      this.showCurrentSentence();
      return true;
    }

    // Diálogo completado: cerrar cuadro
    this.closeDialogue();
    return true;
  }

  /**
   * Cierra el cuadro de diálogo y dispara el callback de finalización.
   */
  public closeDialogue(): void {
    this.isOpen = false;
    this.isTyping = false;
    AudioManager.getInstance().playSfx('confirm');

    if (this.typingTimerEvent) {
      this.typingTimerEvent.remove();
      this.typingTimerEvent = null;
    }

    this.container.setVisible(false);
    this.contentText.setText('');
    this.speakerText.setText('');
    this.continueArrow.setVisible(false);

    if (this.onCompleteCallback) {
      const cb = this.onCompleteCallback;
      this.onCompleteCallback = undefined;
      cb();
    }
  }

  public isDialogueActive(): boolean {
    return this.isOpen;
  }
}
