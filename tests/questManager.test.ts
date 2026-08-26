import { describe, it, expect, beforeEach } from './testRunner';
import { QuestManager } from '../src/core/quests/questManager';
import { QuestNPC, QuestDefinition, NPCQuestState } from '../src/core/quests/questTypes';

describe('6.4 — QuestManager Unit Tests (Sistema de Misiones y NPCs)', () => {
  let questManager: QuestManager;

  beforeEach(() => {
    questManager = new QuestManager();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. INICIALIZACIÓN POR DEFECTO DEL LORE DE ANDARA
  // ─────────────────────────────────────────────────────────────
  it('Inicializa NPCs y misiones por defecto del Profesor Ceibo', () => {
    const ceibo = questManager.getNPC('prof_ceibo');
    expect(ceibo).toBeDefined();
    expect(ceibo?.name).toBe('Profesor Ceibo');
    expect(ceibo?.mapId).toBe('ceibo_lab');
    expect(ceibo?.state).toBe('no_hablado');
    expect(ceibo?.questId).toBe('quest_ceibo_package');

    const mateo = questManager.getNPC('pescador_mateo');
    expect(mateo).toBeDefined();
    expect(mateo?.name).toBe('Pescador Mateo');
    expect(mateo?.mapId).toBe('villa_tranquimar');
  });

  it('Obtiene NPCs filtrados por mapa', () => {
    const labNpcs = questManager.getNPCsForMap('ceibo_lab');
    expect(labNpcs).toHaveLength(1);
    expect(labNpcs[0].id).toBe('prof_ceibo');

    const tranquilNpcs = questManager.getNPCsForMap('villa_tranquimar');
    expect(tranquilNpcs).toHaveLength(1);
    expect(tranquilNpcs[0].id).toBe('pescador_mateo');
  });

  // ─────────────────────────────────────────────────────────────
  // 2. MÁQUINA DE ESTADOS DE MISIONES Y DIÁLOGOS
  // ─────────────────────────────────────────────────────────────
  it('Diálogos dinámicos según el estado del NPC', () => {
    const ceibo = questManager.getNPC('prof_ceibo')!;

    // Estado inicial: no_hablado
    const dNoHablado = questManager.getDialoguesForNPC('prof_ceibo');
    expect(dNoHablado).toHaveLength(4);
    expect(dNoHablado[0]).toContain('¡Hola, joven entrenador!');

    // Avanzar a mision_activa
    questManager.advanceNPCState('prof_ceibo');
    expect(ceibo.state).toBe('mision_activa');

    const dActiva = questManager.getDialoguesForNPC('prof_ceibo');
    expect(dActiva).toHaveLength(2);
    expect(dActiva[0]).toContain('¿Aún no has visitado a Mateo');
  });

  it('Transición de misión: no_hablado -> mision_activa -> mision_completada con recompensas', () => {
    const initialMoney = questManager.playerMoney;

    // 1. Hablar con Ceibo activa la misión
    const step1 = questManager.advanceNPCState('prof_ceibo');
    expect(step1.newState).toBe('mision_activa');
    expect(step1.rewardClaimed).toBeUndefined();

    // 2. Intentar completar sin el ítem requerido debe mantener el estado activo
    const step2 = questManager.advanceNPCState('prof_ceibo');
    expect(step2.newState).toBe('mision_activa');
    expect(step2.rewardClaimed).toBeUndefined();

    // 3. Añadir el objeto requerido ('ceibo_parcel')
    questManager.addItem('ceibo_parcel', 1);

    // 4. Completar la misión
    const step3 = questManager.advanceNPCState('prof_ceibo');
    expect(step3.newState).toBe('mision_completada');
    expect(step3.rewardClaimed).toBeDefined();

    // Validar recompensas ($500 y 3 Pociones)
    expect(step3.rewardClaimed?.money).toBe(500);
    expect(questManager.playerMoney).toBe(initialMoney + 500);

    // Validar que el ítem requerido fue consumido
    expect(questManager.consumeItem('ceibo_parcel', 1)).toBe(false); // Ya no queda ninguno

    // Validar diálogo final de agradecimiento
    const dCompletada = questManager.getDialoguesForNPC('prof_ceibo');
    expect(dCompletada[0]).toContain('¡Excelente trabajo entregando las muestras!');
  });

  // ─────────────────────────────────────────────────────────────
  // 3. REGISTRO DINÁMICO DE NUEVOS NPCS Y MISIONES
  // ─────────────────────────────────────────────────────────────
  it('Registro y ejecución de misión personalizada con callback onStateChange', () => {
    let callbackTriggered = false;
    let callbackState: NPCQuestState | null = null;

    const customQuest: QuestDefinition = {
      id: 'quest_mineral_muestra',
      title: 'Muestra de Mineral Telúrico',
      description: 'Consigue 2 fragmentos de mineral para la Arqueóloga Fanny.',
      giverNpcId: 'fanny_npc',
      requiredItem: { id: 'teluric_shard', name: 'Fragmento Telúrico', quantity: 2 },
      rewards: {
        money: 1000,
        items: [{ id: 'revive', name: 'Revivir', quantity: 1 }]
      }
    };

    const customNPC: QuestNPC = {
      id: 'fanny_npc',
      name: 'Arqueóloga Fanny',
      mapId: 'pueblo_altiplano',
      x: 5,
      y: 10,
      facing: 'DOWN',
      spriteKey: 'npc_fanny',
      questId: 'quest_mineral_muestra',
      state: 'no_hablado',
      dialogues: {
        no_hablado: ['Necesito fragmentos telúricos.'],
        mision_activa: ['¿Encontraste los 2 fragmentos?'],
        mision_completada: ['¡Increíble descubrimiento!']
      },
      onStateChange: (newState) => {
        callbackTriggered = true;
        callbackState = newState;
      }
    };

    questManager.registerQuest(customQuest);
    questManager.registerNPC(customNPC);

    // Activar misión
    questManager.advanceNPCState('fanny_npc');
    expect(callbackTriggered).toBe(true);
    expect(callbackState).toBe('mision_activa');

    // Añadir los 2 fragmentos requeridos
    questManager.addItem('teluric_shard', 2);

    // Completar misión
    questManager.advanceNPCState('fanny_npc');
    expect(callbackState).toBe('mision_completada');
    expect(questManager.playerMoney).toBe(2000); // 1000 base + 1000 premio
  });

  it('NPCs genéricos sin misión pasan directamente a mision_completada tras hablar', () => {
    const genericNPC: QuestNPC = {
      id: 'aldeano_1',
      name: 'Aldeano',
      mapId: 'villa_tranquimar',
      x: 3,
      y: 3,
      facing: 'UP',
      spriteKey: 'npc_villager',
      state: 'no_hablado',
      dialogues: {
        no_hablado: ['El clima en Andara es maravilloso hoy.'],
        mision_activa: [],
        mision_completada: ['Ten cuidado si vas hacia las montañas.']
      }
    };

    questManager.registerNPC(genericNPC);
    const res = questManager.advanceNPCState('aldeano_1');
    expect(res.newState).toBe('mision_completada');
  });

  // ─────────────────────────────────────────────────────────────
  // 4. GESTIÓN DE INVENTARIO
  // ─────────────────────────────────────────────────────────────
  it('Gestión de inventario: agregar, consultar y consumir ítems de forma segura', () => {
    expect(questManager.consumeItem('super_potion', 1)).toBe(false);

    questManager.addItem('super_potion', 3);
    expect(questManager.consumeItem('super_potion', 2)).toBe(true);
    expect(questManager.consumeItem('super_potion', 2)).toBe(false); // Solo queda 1
    expect(questManager.consumeItem('super_potion', 1)).toBe(true); // Se gasta el último
    expect(questManager.consumeItem('super_potion', 1)).toBe(false);
  });
});
