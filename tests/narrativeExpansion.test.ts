import { describe, it, expect, beforeEach } from './testRunner';
import { AuroraInfiltrationManager } from '../src/overworld/AuroraInfiltrationManager';
import { NahuelRivalryManager } from '../src/overworld/NahuelRivalryManager';
import { RuinsPuzzleManager } from '../src/overworld/RuinsPuzzleManager';

describe('Opción C — Narrative Expansion Tests (Aurora Cero, Nahuel Rivalry & Ruins Puzzle)', () => {
  // ─────────────────────────────────────────────────────────────
  // 1. INFILTRACIÓN EN BASES DE AURORA CERO
  // ─────────────────────────────────────────────────────────────
  it('Desactivación progresiva de terminales en el Laboratorio Solsticio', () => {
    const aurora = new AuroraInfiltrationManager();
    expect(aurora.areAllTerminalsCleared()).toBe(false);

    const res1 = aurora.deactivateTerminal('term_alfa');
    expect(res1.success).toBe(true);
    expect(res1.allCleared).toBe(false);
    expect(aurora.releasedCount).toBe(2);

    aurora.deactivateTerminal('term_beta');
    const res3 = aurora.deactivateTerminal('term_gamma');
    expect(res3.allCleared).toBe(true);
    expect(aurora.areAllTerminalsCleared()).toBe(true);
    expect(aurora.releasedCount).toBe(6);
  });

  it('Registro de Comandantes de Aurora Cero en Vulcania (Ignis, Umbra, Alister)', () => {
    const aurora = new AuroraInfiltrationManager();
    const ignis = aurora.getCommander('cmd_ignis');
    expect(ignis).toBeDefined();
    expect(ignis?.defeated).toBe(false);

    aurora.defeatCommander('cmd_ignis');
    expect(aurora.getCommander('cmd_ignis')?.defeated).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────
  // 2. LOS 5 COMBATES DE RIVALIDAD CON NAHUEL
  // ─────────────────────────────────────────────────────────────
  it('Nahuel adapta su inicial con ventaja reactiva y escala sus 5 duelos', () => {
    // Si el jugador elige Planta (Grass), Nahuel debe elegir Fuego (Charmander)
    const nahuelGrass = new NahuelRivalryManager('grass');
    const duel1 = nahuelGrass.getEncounter(1);
    expect(duel1?.team[0].name).toBe('Charmander');

    // Si el jugador elige Fuego, Nahuel elige Agua (Squirtle)
    const nahuelFire = new NahuelRivalryManager('fire');
    const duel1Fire = nahuelFire.getEncounter(1);
    expect(duel1Fire?.team[0].name).toBe('Squirtle');

    // Duelo 2: Introduce a Growlithe
    const duel2 = nahuelGrass.getEncounter(2);
    expect(duel2?.team.some(p => p.name === 'Growlithe')).toBe(true);

    // Duelo 4: Nivel 54 con Arcanine
    const duel4 = nahuelGrass.getEncounter(4);
    expect(duel4?.team.some(p => p.name === 'Arcanine')).toBe(true);
    expect(duel4?.recommendedLevel).toBe(54);

    // Duelo 5: Postgame Nivel 88
    const duel5 = nahuelGrass.getEncounter(5);
    expect(duel5?.recommendedLevel).toBe(88);
  });

  // ─────────────────────────────────────────────────────────────
  // 3. PUZZLE DE LAS RUINAS ANCESTRALES DE CONDORINA
  // ─────────────────────────────────────────────────────────────
  it('Rompecabezas de alinear las 3 piedras rúnicas (Sol, Luna, Tierra)', () => {
    const ruins = new RuinsPuzzleManager();
    expect(ruins.isSolved).toBe(false);

    // Rotar hasta la posición correcta
    // Sol: correctSlot = 1 (inicia en 0 -> 1 push)
    ruins.pushPillar('pillar_sun');

    // Luna: correctSlot = 2 (inicia en 3 -> 3 pushes: 3->0->1->2)
    ruins.pushPillar('pillar_moon');
    ruins.pushPillar('pillar_moon');
    ruins.pushPillar('pillar_moon');

    // Tierra: correctSlot = 3 (inicia en 1 -> 2 pushes: 1->2->3)
    ruins.pushPillar('pillar_earth');
    const finalPush = ruins.pushPillar('pillar_earth');

    expect(finalPush.isSolved).toBe(true);
    expect(ruins.isSolved).toBe(true);
    expect(finalPush.message).toContain('Cámara Sagrada de Zygarde');
  });
});
