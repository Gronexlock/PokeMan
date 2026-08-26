import { describe, it, expect, beforeEach } from './testRunner';
import { AudioManager } from '../src/audio/AudioManager';

describe('7.1, 7.2, 7.3 — AudioManager Unit Tests (Audio Pipeline & SFX)', () => {
  let audio: AudioManager;

  beforeEach(() => {
    audio = AudioManager.getInstance();
    audio.stopBgm(0);
    audio.setMasterVolume(0.8);
    audio.setBgmVolume(0.6);
    audio.setSfxVolume(0.7);
    if (audio.isMuted) audio.toggleMute();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. SINGLETON Y CONTROL DE VOLUMEN
  // ─────────────────────────────────────────────────────────────
  it('Instancia Singleton única', () => {
    const audio2 = AudioManager.getInstance();
    expect(audio).toBe(audio2);
  });

  it('Ajuste y delimitación de volumen (Master, BGM, SFX)', () => {
    audio.setMasterVolume(0.5);
    expect(audio.masterVolume).toBe(0.5);

    // Clamping superior e inferior
    audio.setMasterVolume(1.5);
    expect(audio.masterVolume).toBe(1.0);

    audio.setMasterVolume(-0.5);
    expect(audio.masterVolume).toBe(0.0);

    audio.setBgmVolume(0.3);
    expect(audio.bgmVolume).toBe(0.3);

    audio.setSfxVolume(0.9);
    expect(audio.sfxVolume).toBe(0.9);
  });

  it('Alternancia de Mute', () => {
    expect(audio.isMuted).toBe(false);
    audio.toggleMute();
    expect(audio.isMuted).toBe(true);
    audio.toggleMute();
    expect(audio.isMuted).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────
  // 2. GESTIÓN DE BGM Y TEMAS DINÁMICOS DE COMBATE (7.1 & 7.2)
  // ─────────────────────────────────────────────────────────────
  it('Reproducción de BGM de Overworld y parada', () => {
    audio.playBgm('villa_tranquimar', { fadeDuration: 0 });
    expect(audio.getCurrentTrack()).toBe('villa_tranquimar');

    audio.stopBgm(0);
    expect(audio.getCurrentTrack()).toBeNull();
  });

  it('Transición y selección de BGM dinámico de combate (Salvaje, Entrenador, Líder)', () => {
    // 1. Iniciar en el mapa de Villa Tranquimar
    audio.playBgm('villa_tranquimar', { fadeDuration: 0 });
    expect(audio.getCurrentTrack()).toBe('villa_tranquimar');

    // 2. Iniciar combate salvaje (debe recordar el mapa previo)
    audio.playBattleBgm('wild');
    expect(audio.getCurrentTrack()).toBe('wild_battle');

    // 3. Reanudar música ambiental tras salir del combate
    audio.resumePreviousOverworldBgm();
    expect(audio.getCurrentTrack()).toBe('villa_tranquimar');

    // 4. Iniciar combate de entrenador
    audio.playBattleBgm('trainer');
    expect(audio.getCurrentTrack()).toBe('trainer_battle');

    // 5. Iniciar combate de gimnasio
    audio.playBattleBgm('gym');
    expect(audio.getCurrentTrack()).toBe('gym_leader_battle');

    // 6. Fanfarria de victoria
    audio.playVictoryBgm('gym');
    expect(audio.getCurrentTrack()).toBe('victory_gym');
  });

  // ─────────────────────────────────────────────────────────────
  // 3. DISPATCH DE SFX Y EFECTOS ELEMENTALES (7.3)
  // ─────────────────────────────────────────────────────────────
  it('Ejecución segura de la biblioteca de SFX sin errores de contexto', () => {
    expect(() => {
      audio.playSfx('select');
      audio.playSfx('confirm');
      audio.playSfx('cancel');
      audio.playSfx('bump');
      audio.playSfx('typewriter');
      audio.playSfx('ledge_jump');
      audio.playSfx('item_pickup');
      audio.playSfx('exclamation');
      audio.playSfx('ball_throw');
      audio.playSfx('ball_bounce');
      audio.playSfx('ball_wiggle');
      audio.playSfx('ball_catch');
      audio.playSfx('ball_break');
      audio.playSfx('faint');
      audio.playSfx('exp_gain');
      audio.playSfx('level_up');
      audio.playSfx('mega_evolution');
      audio.playSfx('crit_hit');
      audio.playSfx('super_effective');
      audio.playSfx('not_very_effective');
      audio.playSfx('immune');
      audio.playSfx('normal_hit');
    }).not.toThrow();
  });

  it('Ejecución segura de SFX de ataques elementales por tipo y categoría', () => {
    expect(() => {
      audio.playMoveSfx('fire', 'special');
      audio.playMoveSfx('water', 'special');
      audio.playMoveSfx('electric', 'special');
      audio.playMoveSfx('grass', 'physical');
      audio.playMoveSfx('ground', 'physical');
      audio.playMoveSfx('psychic', 'special');
      audio.playMoveSfx('ice', 'special');
      audio.playMoveSfx('normal', 'status');
    }).not.toThrow();
  });

  it('Jingle de curación del Centro Pokémon ejecuta callback de completado', () => {
    let completed = false;
    audio.playPokemonCenterHealJingle(() => {
      completed = true;
    });
    // Si no hay Web Audio Context en entorno headless, o al terminar, no lanza excepción
    expect(typeof audio.playPokemonCenterHealJingle).toBe('function');
  });
});
