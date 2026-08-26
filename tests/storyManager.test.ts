import { describe, it, expect, beforeEach } from './testRunner';
import { StoryManager } from '../src/core/quests/storyManager';

describe('8.4 & 8.5 — StoryManager & Postgame Campaign Tests', () => {
  let story: StoryManager;

  beforeEach(() => {
    story = new StoryManager();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. ESTADO INICIAL Y PROGRESIÓN DE MEDALLAS
  // ─────────────────────────────────────────────────────────────
  it('Estado inicial en Villa Tranquimar sin medallas', () => {
    expect(story.storyState.currentChapter).toBe('CH1_VILLA_TRANQUIMAR');
    expect(story.storyState.badgesCollected.length).toBe(0);
    expect(story.storyState.eternatusDefeated).toBe(false);
  });

  it('Progresión de medallas avanza capítulos de la historia', () => {
    story = new StoryManager({ currentChapter: 'CH3_GYMS_EARLY' });

    story.awardBadge('badge_cumbre');
    story.awardBadge('badge_selva');
    story.awardBadge('badge_arrecife');
    story.awardBadge('badge_ruinas');

    expect(story.storyState.badgesCollected.length).toBe(4);
    expect(story.storyState.currentChapter).toBe('CH4_NAHUEL_TRAGEDY');
  });

  // ─────────────────────────────────────────────────────────────
  // 2. REGLA INQUEBRANTABLE DE LEGENDARIOS NO CAPTURABLES
  // ─────────────────────────────────────────────────────────────
  it('Legendarios divinos rechazan las Poké Balls y no pueden ser capturados', () => {
    const resEternatus = story.isSpeciesCatchable('Eternatus');
    expect(resEternatus.catchable).toBe(false);
    expect(resEternatus.rejectionMessage).toContain('rechaza las Poké Balls');

    const resZygarde = story.isSpeciesCatchable('Zygarde Forma Completa');
    expect(resZygarde.catchable).toBe(false);

    const resPikachu = story.isSpeciesCatchable('Pikachu');
    expect(resPikachu.catchable).toBe(true);

    const resGarchomp = story.isSpeciesCatchable('Garchomp');
    expect(resGarchomp.catchable).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────
  // 3. CLÍMAX DE ETERNATUS, ARCO DE NAHUEL Y EMERGENCIA DE ISLA RESONANCIA
  // ─────────────────────────────────────────────────────────────
  it('Resolución del cataclismo cósmico otorga el Arcanine de Nahuel y desbloquea Isla Resonancia', () => {
    story.onLeagueChampionVictory();
    expect(story.storyState.currentChapter).toBe('CH7_CRISIS_FALLA_COSMICA');

    const resolution = story.resolveEternatusCataclysm();
    expect(story.storyState.eternatusDefeated).toBe(true);
    expect(story.storyState.nahuelArcanineInherited).toBe(true);
    expect(story.storyState.expandedPokedexUnlocked).toBe(true);
    expect(story.storyState.currentChapter).toBe('CH8_ISLA_RESONANCIA_POSTGAME');

    expect(resolution.arcanineGiftMessage.length).toBeGreaterThan(0);
    expect(resolution.islandEmergenceMessage.length).toBeGreaterThan(0);
  });

  // ─────────────────────────────────────────────────────────────
  // 4. SANTUARIO DEL EQUILIBRIO (ZYGARDE) Y DEFENSA DEL TÍTULO
  // ─────────────────────────────────────────────────────────────
  it('Victoria en el Santuario del Equilibrio otorga el Emblema del Equilibrio', () => {
    const dialogs = story.onZygardeSanctuaryVictory();
    expect(story.storyState.zygardeEmblemObtained).toBe(true);
    expect(dialogs.some(d => d.includes('EMBLEMA DEL EQUILIBRIO'))).toBe(true);
  });

  it('Registro de victorias en la Defensa del Título de Campeón', () => {
    expect(story.recordTitleDefenseWin()).toBe(1);
    expect(story.recordTitleDefenseWin()).toBe(2);
    expect(story.storyState.titleDefenseWins).toBe(2);
  });
});
