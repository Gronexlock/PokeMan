import { PokemonType, MoveCategory } from '../core/types';

export type BgmTrackKey =
  | 'intro'
  | 'villa_tranquimar'
  | 'pueblo_altiplano'
  | 'ruta_1'
  | 'lab_ceibo'
  | 'centro_pokemon'
  | 'tienda_pokemon'
  | 'gimnasio_altiplano'
  | 'wild_battle'
  | 'trainer_battle'
  | 'gym_leader_battle'
  | 'victory_wild'
  | 'victory_trainer'
  | 'victory_gym';

export type SfxKey =
  | 'select'
  | 'confirm'
  | 'cancel'
  | 'bump'
  | 'typewriter'
  | 'ledge_jump'
  | 'warp_door'
  | 'item_pickup'
  | 'ball_throw'
  | 'ball_bounce'
  | 'ball_wiggle'
  | 'ball_catch'
  | 'ball_break'
  | 'faint'
  | 'exp_gain'
  | 'level_up'
  | 'mega_evolution'
  | 'crit_hit'
  | 'super_effective'
  | 'not_very_effective'
  | 'immune'
  | 'normal_hit'
  | 'exclamation';

/**
 * Gestor de Audio desacoplado con soporte Web Audio API y sintetizador chiptune procedural.
 * Proporciona BGM dinámicos por mapa y combate, cross-fade, control de volumen y biblioteca completa de SFX.
 */
export class AudioManager {
  private static instance: AudioManager;

  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  public masterVolume: number = 0.8;
  public bgmVolume: number = 0.6;
  public sfxVolume: number = 0.7;
  public isMuted: boolean = false;

  private currentTrackKey: BgmTrackKey | null = null;
  private previousOverworldTrackKey: BgmTrackKey | null = null;

  // Handles de sintetizador BGM
  private activeBgmIntervals: number[] = [];
  private activeBgmSources: (AudioNode | { stop: () => void })[] = [];

  private constructor() {
    // Lazy initialization al primer gesto de interacción
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Inicializa el contexto de AudioContext.
   */
  public initContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
        this.bgmGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. CONTROL DE VOLUMEN Y MUTE
  // ─────────────────────────────────────────────────────────────────────────────

  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
  }

  public setBgmVolume(volume: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
    }
  }

  public setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. GESTOR DE BGM CON CROSS-FADE Y TEMAS DINÁMICOS (7.1 & 7.2)
  // ─────────────────────────────────────────────────────────────────────────────

  public getCurrentTrack(): BgmTrackKey | null {
    return this.currentTrackKey;
  }

  /**
   * Reproduce una pista BGM con cross-fade suave.
   */
  public playBgm(trackKey: BgmTrackKey, options: { fadeDuration?: number; rememberPrevious?: boolean } = {}): void {
    if (this.currentTrackKey === trackKey) return;

    this.initContext();
    const fadeDuration = options.fadeDuration ?? 500;

    if (options.rememberPrevious && this.isOverworldTrack(this.currentTrackKey)) {
      this.previousOverworldTrackKey = this.currentTrackKey;
    }

    this.stopBgm(fadeDuration);

    this.currentTrackKey = trackKey;
    setTimeout(() => {
      this.startSynthesizedBgm(trackKey);
    }, fadeDuration / 2);
  }

  /**
   * Reanuda la música del Overworld previa (ej. tras finalizar un combate).
   */
  public resumePreviousOverworldBgm(defaultMapTrack: BgmTrackKey = 'villa_tranquimar'): void {
    const trackToPlay = this.previousOverworldTrackKey || defaultMapTrack;
    this.previousOverworldTrackKey = null;
    this.playBgm(trackToPlay, { fadeDuration: 600 });
  }

  /**
   * Selecciona y reproduce la BGM correspondiente según el tipo de combate.
   */
  public playBattleBgm(encounterType: 'wild' | 'trainer' | 'gym'): void {
    switch (encounterType) {
      case 'gym':
        this.playBgm('gym_leader_battle', { rememberPrevious: true, fadeDuration: 400 });
        break;
      case 'trainer':
        this.playBgm('trainer_battle', { rememberPrevious: true, fadeDuration: 400 });
        break;
      case 'wild':
      default:
        this.playBgm('wild_battle', { rememberPrevious: true, fadeDuration: 400 });
        break;
    }
  }

  /**
   * Reproduce la fanfarria de victoria correspondiente.
   */
  public playVictoryBgm(type: 'wild' | 'trainer' | 'gym' = 'wild'): void {
    const victoryKey: BgmTrackKey = type === 'gym' ? 'victory_gym' : type === 'trainer' ? 'victory_trainer' : 'victory_wild';
    this.playBgm(victoryKey, { fadeDuration: 300 });
  }

  public stopBgm(fadeDuration: number = 400): void {
    // Limpiar intervalos de notas
    this.activeBgmIntervals.forEach(id => clearInterval(id));
    this.activeBgmIntervals = [];

    // Detener fuentes activas
    this.activeBgmSources.forEach(s => {
      try {
        if ('stop' in s && typeof s.stop === 'function') s.stop();
      } catch (e) {}
    });
    this.activeBgmSources = [];
    this.currentTrackKey = null;
  }

  private isOverworldTrack(track: BgmTrackKey | null): boolean {
    if (!track) return false;
    return ['villa_tranquimar', 'pueblo_altiplano', 'ruta_1', 'lab_ceibo', 'centro_pokemon', 'tienda_pokemon', 'gimnasio_altiplano'].includes(track);
  }

  /**
   * Generador procedural chiptune para ambientación según el tema de la zona.
   */
  private startSynthesizedBgm(track: BgmTrackKey): void {
    if (!this.ctx || !this.bgmGain || this.isMuted) return;

    let bassPattern: number[] = [];
    let leadPattern: number[] = [];
    let tempoMs = 250;

    switch (track) {
      case 'intro':
      case 'villa_tranquimar':
      case 'lab_ceibo':
        // C major relajante y marítimo
        leadPattern = [523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 523.25, 392.0];
        bassPattern = [130.81, 130.81, 164.81, 196.0];
        tempoMs = 320;
        break;

      case 'ruta_1':
        // F major enérgico y aventurero
        leadPattern = [349.23, 440.0, 523.25, 587.33, 659.25, 523.25, 440.0, 523.25];
        bassPattern = [87.31, 110.0, 130.81, 110.0];
        tempoMs = 220;
        break;

      case 'pueblo_altiplano':
      case 'gimnasio_altiplano':
        // D minor andino / místico
        leadPattern = [293.66, 349.23, 440.0, 392.0, 349.23, 293.66, 261.63, 293.66];
        bassPattern = [73.42, 73.42, 87.31, 98.0];
        tempoMs = 280;
        break;

      case 'centro_pokemon':
      case 'tienda_pokemon':
        // Melodía alegre y reconfortante (A major)
        leadPattern = [440.0, 554.37, 659.25, 880.0, 659.25, 554.37, 493.88, 440.0];
        bassPattern = [110.0, 138.59, 164.81, 138.59];
        tempoMs = 260;
        break;

      case 'wild_battle':
        // Ritmo trepidante en G minor
        leadPattern = [392.0, 466.16, 523.25, 587.33, 783.99, 698.46, 587.33, 466.16];
        bassPattern = [98.0, 98.0, 116.54, 130.81];
        tempoMs = 150;
        break;

      case 'trainer_battle':
        // Ritmo desafiante y rápido en A minor
        leadPattern = [440.0, 523.25, 659.25, 523.25, 698.46, 659.25, 587.33, 493.88];
        bassPattern = [110.0, 110.0, 130.81, 146.83];
        tempoMs = 140;
        break;

      case 'gym_leader_battle':
        // Épico y potente en E minor
        leadPattern = [329.63, 392.0, 493.88, 659.25, 587.33, 493.88, 392.0, 329.63];
        bassPattern = [82.41, 82.41, 98.0, 110.0];
        tempoMs = 130;
        break;

      case 'victory_wild':
      case 'victory_trainer':
      case 'victory_gym':
        // Fanfarria triunfal de victoria
        leadPattern = [523.25, 523.25, 523.25, 659.25, 783.99, 1046.5];
        bassPattern = [130.81, 164.81, 196.0, 261.63];
        tempoMs = 180;
        break;
    }

    let leadIdx = 0;
    let bassIdx = 0;

    const intervalId = window.setInterval(() => {
      if (!this.ctx || !this.bgmGain || this.isMuted) return;

      // Nota Melódica
      const leadFreq = leadPattern[leadIdx % leadPattern.length];
      this.playSynthNote(leadFreq, 'triangle', tempoMs / 1000 * 0.85, 0.08, this.bgmGain);
      leadIdx++;

      // Nota de Bajo cada 2 tiempos
      if (leadIdx % 2 === 0) {
        const bassFreq = bassPattern[bassIdx % bassPattern.length];
        this.playSynthNote(bassFreq, 'sawtooth', tempoMs / 1000 * 1.5, 0.06, this.bgmGain);
        bassIdx++;
      }
    }, tempoMs);

    this.activeBgmIntervals.push(intervalId);
  }

  private playSynthNote(freq: number, type: OscillatorType, duration: number, gainVal: number, destNode: GainNode): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    noteGain.gain.setValueAtTime(gainVal, now);
    noteGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(noteGain);
    noteGain.connect(destNode);

    osc.start(now);
    osc.stop(now + duration);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. BIBLIOTECA COMPLETA DE SFX (7.3)
  // ─────────────────────────────────────────────────────────────────────────────

  public playSfx(key: SfxKey): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    switch (key) {
      case 'select': {
        this.playTone(900, 'sine', 0.04, 0.15);
        break;
      }
      case 'confirm': {
        this.playTone(523.25, 'triangle', 0.06, 0.2);
        setTimeout(() => this.playTone(783.99, 'triangle', 0.12, 0.2), 60);
        break;
      }
      case 'cancel': {
        this.playSweep(450, 180, 'sawtooth', 0.09, 0.18);
        break;
      }
      case 'bump': {
        this.playTone(90, 'square', 0.07, 0.22);
        break;
      }
      case 'typewriter': {
        this.playTone(1200, 'sine', 0.015, 0.05);
        break;
      }
      case 'ledge_jump': {
        // Sonido "boing" característico de desnivel
        this.playSweep(220, 480, 'sine', 0.18, 0.25);
        break;
      }
      case 'warp_door': {
        this.playSweep(150, 60, 'triangle', 0.25, 0.2);
        break;
      }
      case 'item_pickup': {
        // Chime de 4 notas ascendentes
        const notes = [659.25, 783.99, 987.77, 1318.51];
        notes.forEach((f, i) => {
          setTimeout(() => this.playTone(f, 'triangle', 0.14, 0.2), i * 65);
        });
        break;
      }
      case 'exclamation': {
        // Alerta de entrenador '!'
        this.playTone(880, 'square', 0.08, 0.25);
        setTimeout(() => this.playTone(1320, 'square', 0.15, 0.25), 70);
        break;
      }
      case 'ball_throw': {
        this.playSweep(300, 700, 'sine', 0.18, 0.18);
        break;
      }
      case 'ball_bounce': {
        this.playTone(180, 'sine', 0.06, 0.2);
        break;
      }
      case 'ball_wiggle': {
        this.playSweep(400, 320, 'triangle', 0.1, 0.18);
        break;
      }
      case 'ball_catch': {
        // Jingle de captura exitosa
        const catchNotes = [523.25, 659.25, 783.99, 1046.5, 987.77, 1046.5];
        catchNotes.forEach((f, i) => {
          setTimeout(() => this.playTone(f, 'triangle', 0.16, 0.25), i * 90);
        });
        break;
      }
      case 'ball_break': {
        this.playNoise(0.2, 0.25);
        this.playSweep(500, 150, 'sawtooth', 0.15, 0.2);
        break;
      }
      case 'faint': {
        this.playSweep(320, 60, 'sawtooth', 0.5, 0.25);
        break;
      }
      case 'exp_gain': {
        this.playTone(880, 'sine', 0.03, 0.08);
        break;
      }
      case 'level_up': {
        const lvlNotes = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5];
        lvlNotes.forEach((freq, i) => {
          setTimeout(() => this.playTone(freq, 'triangle', 0.15, 0.2), i * 60);
        });
        break;
      }
      case 'mega_evolution': {
        // Resonancia de energía prismática
        this.playSweep(200, 1200, 'sawtooth', 0.4, 0.25);
        setTimeout(() => {
          const notes = [783.99, 987.77, 1174.66, 1567.98];
          notes.forEach((f, i) => {
            setTimeout(() => this.playTone(f, 'sine', 0.25, 0.25), i * 80);
          });
        }, 300);
        break;
      }
      case 'crit_hit': {
        this.playTone(1200, 'square', 0.08, 0.25);
        this.playNoise(0.18, 0.3);
        break;
      }
      case 'super_effective': {
        this.playTone(700, 'sawtooth', 0.1, 0.25);
        this.playNoise(0.25, 0.35);
        break;
      }
      case 'not_very_effective': {
        this.playTone(130, 'triangle', 0.15, 0.2);
        break;
      }
      case 'immune': {
        this.playTone(100, 'square', 0.08, 0.15);
        break;
      }
      case 'normal_hit': {
        this.playNoise(0.12, 0.22);
        this.playTone(200, 'triangle', 0.1, 0.2);
        break;
      }
    }
  }

  /**
   * Reproduce el SFX de ataque según el tipo elemental del movimiento.
   */
  public playMoveSfx(type: PokemonType, category: MoveCategory): void {
    if (this.isMuted) return;

    if (category === 'status') {
      this.playSweep(400, 600, 'sine', 0.2, 0.15);
      return;
    }

    const t = type.toLowerCase() as PokemonType;
    switch (t) {
      case 'fire':
        this.playNoise(0.3, 0.3);
        this.playSweep(500, 200, 'sawtooth', 0.25, 0.2);
        break;
      case 'water':
        this.playSweep(300, 550, 'sine', 0.15, 0.2);
        setTimeout(() => this.playNoise(0.18, 0.2), 80);
        break;
      case 'electric':
        this.playSweep(1200, 300, 'sawtooth', 0.15, 0.28);
        this.playNoise(0.1, 0.25);
        break;
      case 'grass':
      case 'bug':
        this.playSweep(800, 200, 'triangle', 0.12, 0.22);
        break;
      case 'ice':
        this.playTone(1200, 'sine', 0.15, 0.2);
        setTimeout(() => this.playTone(1500, 'sine', 0.2, 0.2), 60);
        break;
      case 'ground':
      case 'rock':
        this.playSweep(180, 50, 'square', 0.28, 0.3);
        this.playNoise(0.2, 0.3);
        break;
      case 'psychic':
      case 'ghost':
        this.playSweep(300, 900, 'sine', 0.25, 0.2);
        break;
      case 'fighting':
      case 'steel':
      case 'normal':
      default:
        this.playTone(160, 'sawtooth', 0.12, 0.25);
        this.playNoise(0.15, 0.25);
        break;
    }
  }

  /**
   * Jingle oficial de curación del Centro Pokémon (6 campanas de Poké Ball + fanfarria).
   */
  public playPokemonCenterHealJingle(onComplete?: () => void): void {
    if (this.isMuted) {
      onComplete?.();
      return;
    }

    const notes = [659.25, 659.25, 659.25, 523.25, 659.25, 783.99, 392.0];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.2, 0.25);
        if (idx === notes.length - 1) {
          setTimeout(() => onComplete?.(), 300);
        }
      }, idx * 110);
    });
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.2): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  private playSweep(startFreq: number, endFreq: number, type: OscillatorType, duration: number, volume: number = 0.2): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(10, endFreq), now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  private playNoise(duration: number, volume: number = 0.2): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;
    const gain = this.ctx.createGain();

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    whiteNoise.connect(gain);
    gain.connect(this.sfxGain);

    whiteNoise.start();
  }
}
