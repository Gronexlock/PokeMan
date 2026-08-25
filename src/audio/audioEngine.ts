export class AudioEngine {
  private static instance: AudioEngine;
  private audioCtx: AudioContext | null = null;
  public bgmVolume: number = 0.7;
  public sfxVolume: number = 0.8;
  public isMuted: boolean = false;

  private currentCryAudio: HTMLAudioElement | null = null;
  private currentBgmTrack: string | null = null;

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  private initContext(): void {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public playPokemonCry(speciesId: number): void {
    if (this.isMuted) return;
    try {
      if (this.currentCryAudio) {
        this.currentCryAudio.pause();
        this.currentCryAudio = null;
      }
      const cry = new Audio(`/assets/audio/cries/${speciesId}.ogg`);
      cry.volume = Math.max(0, Math.min(1, this.sfxVolume));
      cry.play().catch(() => {
        // Fallback tone si el navegador bloquea audio sin interacción
        this.playTone(440, 'triangle', 0.2);
      });
      this.currentCryAudio = cry;
    } catch (e) {
      console.warn("No se pudo reproducir el grito:", e);
    }
  }

  public playSfx(type: 'select' | 'confirm' | 'cancel' | 'bump' | 'hit' | 'super_hit' | 'heal' | 'levelup' | 'catch' | 'faint'): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    switch (type) {
      case 'select': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
        gain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }
      case 'confirm': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }
      case 'cancel': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        gain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
      case 'bump': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
        gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }
      case 'hit': {
        this.playNoise(0.15, 0.3);
        this.playTone(150, 'sawtooth', 0.15, 0.2);
        break;
      }
      case 'super_hit': {
        this.playNoise(0.25, 0.4);
        this.playTone(100, 'sawtooth', 0.25, 0.3);
        break;
      }
      case 'levelup': {
        const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5];
        notes.forEach((freq, i) => {
          setTimeout(() => {
            this.playTone(freq, 'triangle', 0.15, 0.15);
          }, i * 70);
        });
        break;
      }
      case 'heal': {
        const notes = [659.25, 659.25, 659.25, 523.25, 659.25, 783.99, 392.0];
        notes.forEach((freq, i) => {
          setTimeout(() => {
            this.playTone(freq, 'sine', 0.18, 0.2);
          }, i * 90);
        });
        break;
      }
      case 'catch': {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, i) => {
          setTimeout(() => {
            this.playTone(freq, 'triangle', 0.2, 0.25);
          }, i * 110);
        });
        break;
      }
      case 'faint': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);
        gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      }
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.2): void {
    if (!this.audioCtx || this.isMuted) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(volume * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  private playNoise(duration: number, volume: number = 0.2): void {
    if (!this.audioCtx || this.isMuted) return;
    const bufferSize = this.audioCtx.sampleRate * duration;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = this.audioCtx.createBufferSource();
    whiteNoise.buffer = buffer;
    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(volume * this.sfxVolume, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);
    whiteNoise.connect(gain);
    gain.connect(this.audioCtx.destination);
    whiteNoise.start();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}
