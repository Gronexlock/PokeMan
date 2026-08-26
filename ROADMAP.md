# 🎮 Pokémon: Ecos de Andara — Documento Maestro de Proyecto

> **Leer esto al inicio de cada sesión de desarrollo.**
> Este documento contiene el prompt de contexto, la arquitectura del proyecto, el estado actual del desarrollo y el roadmap completo.

---

## 🤖 PROMPT INICIAL — Carga este contexto al comenzar cada sesión

```
Actúa como un Desarrollador Experto de Videojuegos especializado en TypeScript y Phaser 3.
Estamos desarrollando un fangame de Pokémon llamado "Pokémon: Ecos de Andara".

ARQUITECTURA DEL PROYECTO:
- Motor de Lógica (Headless): TypeScript puro, sin dependencias de renderizado.
  Inspirado en la arquitectura de @pkmn/engine (derivada de Pokémon Showdown).
  Cálculo de daño Gen 9, tabla de 18 tipos, STAB, críticos, precisión, IA por tiers.
- Motor Visual: Phaser 3 + TypeScript.
  Tilemaps exportados desde Tiled (JSON ortogonal), física Arcade, escenas desacopladas.
- Build System: Vite + TypeScript (tsconfig estricto).
- Datos: JSON en /public/data/ (pokedex.json, moves.json, items.json, maps_data.json, etc.)

REGLAS DE DESARROLLO:
1. Siempre trabajar de forma MODULAR y paso a paso.
2. La lógica de combate (BattleManager) no debe importar nada de Phaser.
3. La BattleScene consume la cola de eventos (TurnResult.steps[]) generada por BattleManager.
4. Los mapas se definen en Tiled y se exportan como JSON ortogonal.
5. Mantener el ROADMAP.md actualizado tras cada sesión.

Lee el archivo ROADMAP.md en la raíz del proyecto para conocer el estado actual.
Lee src/core/types.ts para entender los tipos base (PokemonInstance, MoveSlot, SaveData, etc.).
```

---

## 🌍 Contexto del Juego

| Campo | Valor |
|-------|-------|
| **Título** | Pokémon: Ecos de Andara |
| **Región** | Andara (inspirada en Sudamérica) |
| **Pueblo Inicial** | Villa Tranquimar |
| **Capital** | Metrópolis Solsticio |
| **Profesor** | Profesor Ceibo (Etología y Energía Telúrica) |
| **Rival** | Nahuel (Growlithe → Arcanine, amigo de infancia) |
| **Campeona** | Renata (Mega-Garchomp, poncho andino) |
| **Antagonistas** | Proyecto Aurora (Facción Moderada: Dra. Clara / Facción Radical: Alister "Aurora Cero") |
| **Legendarios** | Eternatus + Zygarde |
| **Mecánica Exclusiva** | Mega-Evolución (venas telúricas de Andara) |
| **Iniciales** | 27 iniciales de las Generaciones 1 a 9 |
| **Plataforma** | PC / Navegador Web (Vite → build .html o Electron .exe) |

---

## 🏗️ Arquitectura del Código

```
Proyecto/
├── src/
│   ├── scenes/                   ← Escenas de Phaser 3
│   │   ├── OverworldScene.ts     ← Mundo exterior: mapa, jugador, NPCs, warps, hierba
│   │   ├── BattleScene.ts        ← UI de combate: HUD, menú ataques, animaciones
│   │   └── index.ts
│   ├── overworld/                ← Subsistemas del Overworld
│   │   ├── MapManager.ts         ← Carga capas de Tiled, parsea Objects layer
│   │   ├── WarpManager.ts        ← Transiciones entre mapas (fade, slide, instant)
│   │   ├── InteractionManager.ts ← Letreros (Signpost) + recolección Item Balls
│   │   ├── playerController.ts   ← Locomoción en cuadrícula (walk/run/bike/surf)
│   │   ├── encounterManager.ts   ← Tablas de encuentros salvajes por zona
│   │   ├── npcManager.ts         ← Pool de NPCs por mapa con facing y diálogos
│   │   └── timeCycle.ts          ← Periodo del día (morning/day/sunset/night)
│   ├── core/                     ← Lógica HEADLESS (sin Phaser)
│   │   ├── battle/
│   │   │   ├── battleManager.ts  ← Motor de combate por turnos (TYPE_CHART, cálculo daño)
│   │   │   └── index.ts
│   │   ├── quests/
│   │   │   ├── questTypes.ts     ← Interfaces QuestNPC, QuestDefinition, NPCQuestState
│   │   │   ├── questManager.ts   ← Estados de misiones, inventario, recompensas
│   │   │   └── index.ts
│   │   ├── types.ts              ← Tipos globales (PokemonInstance, MoveSlot, SaveData...)
│   │   ├── battleEngine.ts       ← Motor legacy (Canvas2D, mantener como referencia)
│   │   ├── battleAI.ts           ← IA por tiers (wild/rookie/gym_leader/rival_boss)
│   │   ├── damageCalculator.ts   ← Fórmula Gen 9 con stagios y clima
│   │   ├── pokemonGenerator.ts   ← Generación de PokemonInstance desde SpeciesData
│   │   ├── catchCalculator.ts    ← Cálculo ratio de captura por Poké Ball
│   │   ├── megaEngine.ts         ← Transformación Mega-Evolución
│   │   ├── storyManager.ts       ← Iniciales de las 9 gens, rival starter
│   │   ├── saveManager.ts        ← Serialización / deserialización localStorage
│   │   └── dialogueManager.ts    ← Motor de diálogos con árbol de nodos y flags
│   ├── ui/                       ← Componentes UI
│   │   ├── DialogueBoxPhaser.ts  ← Cuadro typewriter (Phaser 3), control Espacio
│   │   ├── titleScreen.ts
│   │   ├── pauseMenu.ts
│   │   ├── characterSelect.ts
│   │   ├── starterSelect.ts
│   │   ├── evolutionScreen.ts
│   │   └── pokemartMenu.ts
│   ├── graphics/                 ← Renderizadores Canvas 2D legacy
│   │   ├── overworldRenderer.ts
│   │   ├── battleRenderer.ts
│   │   ├── camera.ts
│   │   ├── particleSystem.ts
│   │   ├── lightingShader.ts
│   │   └── assetLoader.ts
│   ├── audio/
│   │   └── audioEngine.ts        ← Web Audio API, BGM + SFX
│   └── main.ts                   ← GameEngine legacy (Canvas 2D) — punto de entrada actual
├── public/data/                  ← JSON de datos del juego
│   ├── pokedex.json              ← Datos de 900+ especies
│   ├── moves.json                ← Movimientos con tipo, categoría, PP, efectos
│   ├── items.json                ← Objetos con precio, efecto, categoría
│   ├── maps_data.json            ← Definiciones de mapas (colisiones, warps, NPCs)
│   ├── encounters.json           ← Tablas de encuentros por zona y hora
│   ├── trainers.json             ← Equipos de entrenadores y líderes
│   ├── dialogues.json            ← Árboles de diálogo con nodos y choices
│   ├── mega_evolutions.json      ← Stats delta y tipos de Mega-Evolución
│   └── types.json                ← Tabla de efectividad de tipos
├── assets/sprites/               ← Sprites y recursos gráficos
├── ROADMAP.md                    ← Este archivo
├── HISTORIA_ANDARA.md            ← Lore completo, personajes, facciones
├── POKEDEX_REGIONAL_ANDARA.md    ← Pokédex regional de Andara
├── vite.config.ts
├── tsconfig.json
└── package.json
```

> ⚠️ **IMPORTANTE:** Phaser 3 aún **no está instalado** como dependencia en `package.json`.
> Antes de compilar las escenas de Phaser, ejecutar:
> ```bash
> npm install phaser
> npm install --save-dev @types/node
> ```

---

## 🗺️ Convención de Capas en Tiled (Obligatoria)

Los mapas deben exportarse desde **Tiled Map Editor** como JSON ortogonal con estas capas:

| Orden Z | Nombre en Tiled | Tipo | Descripción |
|---------|-----------------|------|-------------|
| 0 | `Ground` | Tile Layer | Terreno base: suelo, agua de fondo, arena |
| 1 | `Ground_Decor` | Tile Layer | Caminos, flores, sombras decorativas |
| 2 | `TallGrass` | Tile Layer | Hierba alta → 10% probabilidad de encuentro |
| 3 | `Obstacles` | Tile Layer | Colisiones: muros, árboles, rocas (`collides: true`) |
| 4 | `Overhead` | Tile Layer | Copas de árboles, techos (Depth 15, sobre el jugador) |
| — | `Objects` | Object Layer | Warps, letreros, item balls, ledges, PlayerSpawn |

### Propiedades Personalizadas en Tiled

| Objeto / Tile | Propiedad | Tipo | Uso |
|---------------|-----------|------|-----|
| Tiles en `Obstacles` | `collides` | bool | `true` → colisión física |
| Tiles en `Ground` | `isTallGrass` | bool | `true` → encuentro salvaje |
| Tiles en `Ground` | `isWater` | bool | `true` → requiere HM Surf |
| Objeto type `warp` | `target_map` | string | ID del mapa destino |
| Objeto type `warp` | `target_x`, `target_y` | int | Spawn en mapa destino (px) |
| Objeto type `warp` | `transition_type` | string | `door_fade` / `slide_up` / `instant` |
| Objeto type `signpost` | `title`, `text` | string | Texto del letrero |
| Objeto type `item_ball` | `item_id`, `item_name`, `quantity` | string/int | Objeto a recoger |
| Objeto type `ledge` | `jump_dir` | string | `DOWN` / `LEFT` / `RIGHT` |
| Objeto name `PlayerSpawn` | `facing` | string | Dirección inicial del jugador |

---

## 📊 ROADMAP — Estado Actual

> **Leyenda:** ✅ Hecho &nbsp;|&nbsp; 🟡 En progreso &nbsp;|&nbsp; ⬜ Pendiente

### 🗺️ FASE 1 — Overworld, Mapeado y Locomoción

| # | Tarea | Módulo | Estado |
|---|-------|--------|--------|
| 1.1 | `MapManager`: capas Tiled, colisiones, parseo Objects layer | `overworld/MapManager.ts` | ✅ |
| 1.2 | `WarpManager`: fade/slide/instant con cooldown y fade-in | `overworld/WarpManager.ts` | ✅ |
| 1.3 | `InteractionManager`: Signposts + Item Balls con animación | `overworld/InteractionManager.ts` | ✅ |
| 1.4 | `OverworldScene`: integración de todos los managers Fase 1 | `scenes/OverworldScene.ts` | ✅ |
| 1.5 | Hierba alta: 10% por casilla nueva → transición a `BattleScene` | `scenes/OverworldScene.ts` | ✅ |
| 1.6 | `QuestManager` + NPCs: estados `no_hablado → activa → completada` | `core/quests/` | ✅ |
| 1.7 | `DialogueBoxPhaser`: typewriter, flecha ▼, Espacio para avanzar | `ui/DialogueBoxPhaser.ts` | ✅ |
| 1.8 | Desniveles de salto (`Ledge`): Tween parabólico unidireccional | `scenes/OverworldScene.ts` | ✅ |
| 1.9 | Cámara: Lerp(0.1), setBounds, zoom 2.5x, roundPixels | `scenes/OverworldScene.ts` | ✅ |

### ⚔️ FASE 2 — Motor de Combate y UI de Batalla

| # | Tarea | Módulo | Estado |
|---|-------|--------|--------|
| 2.1 | `BattleManager`: TYPE_CHART 18 tipos, fórmula Gen 9, STAB, críticos | `core/battle/battleManager.ts` | ✅ |
| 2.2 | Resolución de turnos: prioridad + velocidad, cola `BattleStep[]` | `core/battle/battleManager.ts` | ✅ |
| 2.3 | `BattleScene`: HUDs, barras de vida animadas (Tween 800ms) | `scenes/BattleScene.ts` | ✅ |
| 2.4 | Menú 4 ataques 2×2: teclado (WASD/flechas) + mouse, highlight | `scenes/BattleScene.ts` | ✅ |
| 2.5 | Pipeline async de pasos: USE_MOVE → DAMAGE → FAINT → BATTLE_END | `scenes/BattleScene.ts` | ✅ |
| 2.6 | Menú `POKÉMON`: relevo táctico en combate | `scenes/BattleScene.ts` | ✅ |
| 2.7 | Menú `MOCHILA`: uso de Pociones y Poké Balls en combate | `scenes/BattleScene.ts` | ✅ |
| 2.8 | Captura con Poké Ball: parabólica, rebotes, ratio, jingle | `scenes/BattleScene.ts` | ✅ |
| 2.9 | EXP y subida de nivel: barra azul fluida, +Stats, nuevos movimientos | `scenes/BattleScene.ts` | ✅ |

### 🏥 FASE 3 — Servicios de Pueblo y Primer Gimnasio

| # | Tarea | Módulo | Estado |
|---|-------|--------|--------|
| 3.1 | Centro Pokémon: Joy, animación curacón, jingle | `overworld/PokemonCenter.ts` | ✅ |
| 3.2 | Tienda Pokémon: catálogo, compra x1/x5/x10, venta | `overworld/PokeMartMenu.ts` | ✅ |
| 3.3 | Entrenadores por visión: ícono `!`, caminata automática, desafío | `overworld/TrainerManager.ts` | ✅ |
| 3.4 | Gimnasio Altiplano: Líder Rocío (Geodude Nv.12, Onix Nv.14), Medalla Cumbre | `overworld/TrainerManager.ts` | ✅ |

### 💾 FASE 4 — PC, Ficha de Entrenador y Guardado

| # | Tarea | Módulo | Estado |
|---|-------|--------|--------|
| 4.1 | PC de Almacenamiento: 8 cajas, Depositar / Retirar / Mover | `overworld/PCStorageUI.ts` | ✅ |
| 4.2 | Ficha de Entrenador: avatar, dinero, tiempo, vitrina 8 medallas | `ui/TrainerCardUI.ts` | ✅ |
| 4.3 | Guardado / Carga: `localStorage`, pantalla visual de 3 ranuras | `ui/SaveLoadUI.ts` | ✅ |

### 🌟 FASE 5 — Clima, Biomas y Mega-Evolución

| # | Tarea | Módulo | Estado |
|---|-------|--------|--------|
| 5.1 | Ciclo Día/Noche: overlay de color, Pokémon nocturnos | `overworld/DayNightSystem.ts` | ✅ |
| 5.2 | Clima dinámico: lluvia, arena, sol — partículas + combate | `overworld/WeatherSystem.ts` | ✅ |
| 5.3 | Surf acuático y HM: tile de agua transitable | `overworld/SurfManager.ts` | ✅ |
| 5.4 | Mega-Evolución: cinemática, HUD Mega Ring, stats en BattleManager | `core/megaEngine.ts` / `BattleScene.ts` | ✅ |

---

## 🚀 ROADMAP POST-CORE (Fases 6, 7 y 8)

### 🧪 FASE 6 — Runtime, Bundling y Suite de Pruebas (QA)

| # | Tarea | Módulo | Estado |
|---|-------|--------|--------|
| 6.1 | Bootstrap Phaser 3: `gameConfig.ts`, launcher en `main.ts`, controles HTML y CRT | `src/config/gameConfig.ts`, `src/main.ts` | ✅ |
| 6.2 | Suite de Tests Unitarios: `BattleManager.test.ts` (daño, STAB, críticos, climas, Mega) | `tests/battleManager.test.ts` | ✅ |
| 6.3 | Suite de Tests de Persistencia: `SaveManager.test.ts` y exportación de cajas PC | `tests/saveManager.test.ts` | ✅ |
| 6.4 | Suite de Tests de Misiones: `QuestManager.test.ts` (transiciones de estado y recompensas) | `tests/questManager.test.ts` | ✅ |

### 🎵 FASE 7 — Pipeline de Audio y Efectos Sonoros (SFX / BGM)

| # | Tarea | Módulo | Estado |
|---|-------|--------|--------|
| 7.1 | Gestor de Audio Phaser 3: BGM por mapa con cross-fade y control de volumen/mute | `src/audio/AudioManager.ts` | ✅ |
| 7.2 | BGM de Combate: temas dinámicos (Pokémon Salvaje, Entrenador, Líder de Gimnasio) | `src/scenes/BattleScene.ts` | ✅ |
| 7.3 | Librería de SFX: ataques elementales, efectividad, salto de ledge, typewriter y jingles | `src/audio/AudioManager.ts` | ✅ |

### 🗺️ FASE 8 — Expansión de Contenido, Pokédex Regional de Andara y Gran Campaña

| # | Tarea | Módulo / Archivos | Estado |
|---|-------|-------------------|--------|
| 8.1 | **Pokédex Regional de Andara & Motor de Evolución Offline**: Catálogo de ~220 especies base en 10 biomas sudamericanos, 31 IVs perfectos automáticos, objeto **Cordón Unión** (*Link Cable*), uso directo de ítems evolutivos (Revestimiento Metálico, Escama Dragón, Escama Bella, etc.), mentas de naturaleza y catálogo 100% por dinero convencional ($) en tiendas | `src/core/pokedexData.ts`, `src/core/evolutionEngine.ts`, `src/overworld/PokeMartMenu.ts` | ✅ |
| 8.2 | **Reserva Ecológica de Andara (Zona Safari) y Mapas Clave**: Mecánica de Safari sin límite de pasos ni tiempo (30 Safari Balls, hábitats de los 21/27 iniciales de Gen 1-9), mapas Tiled de *Villa Tranquimar & Muelle, Lab Ceibo, Ruta 2, Pueblo Altiplano, Villa Yungas, Metrópolis Solsticio, Cuenca Esmeralda, Paso Vulcania y Cumbres Australes* | `src/overworld/SafariManager.ts`, `src/overworld/MapManager.ts`, `assets/maps/` | ✅ |
| 8.3 | **Los 7 Gimnasios de Andara, Alto Mando y Campeona Renata**: Gimnasios 2 a 8 con escalado competitivo y Mega-Evolución (Thiago - Bicho/Planta, Marina - Agua, Inti - Psíquico/Fantasma, Valeria - Eléctrico/Acero con Mega-Ampharos, Kael - Veneno/Lucha con Mega-Venusaur, Damián - Fuego con Mega-Houndoom, Silvana - Hielo/Dragón con Mega-Altaria/Glalie), Alto Mando Monotipo Estratégico (Nayra, Marcos, Lautaro, Ezequiel) y combate contra la Campeona **Renata (Mega-Garchomp Nv. 62-65)** | `src/overworld/TrainerManager.ts` | ✅ |
| 8.4 | **Campaña Narrativa de Andara & Clímax Legendario**: Arco emocional de **Nahuel y su Arcanine**, trama del **Proyecto Aurora** vs "Aurora Cero" (Dra. Clara vs Alister), batalla de supervivencia contra **Eternatus** (Legendario no capturable), intervención autónoma de **Zygarde Forma 100%** y traspaso del Arcanine de Nahuel al Campeón | `src/core/quests/storyManager.ts`, `src/core/quests/` | ✅ |
| 8.5 | **Postgame: Isla Resonancia, Pokédex Expandida & Defensa del Título**: Emergencia del archipiélago meridional tras el cataclismo, Pokédex Expandida (Fósiles, formas de Hisui, Megas raras de la Brecha Temporal Nv. 60-75), **Santuario del Equilibrio (Boss Battle Zygarde 100% Nv. 85)** y sistema de alertas de Defensa del Título de Campeón (revanchas Nv. 80-95 con Mega-Evoluciones) | `src/overworld/PostgameManager.ts`, `src/scenes/OverworldScene.ts` | ✅ |

---

## 🔗 Interfaces Clave (Referencia Rápida)

```typescript
// BattlePokemon — entrada del BattleManager
interface BattlePokemon {
  id: string | number; name: string; types: PokemonType[];
  level: number; currentHp: number; maxHp: number;
  attack: number; defense: number; spAttack?: number; spDefense?: number;
  speed: number; moves: BattleMove[];
  isMega?: boolean; megaStone?: string; originalName?: string;
}

// TurnResult — salida de BattleManager, consumida por BattleScene
interface TurnResult {
  turnNumber: number;
  steps: BattleStep[];       // Cola de eventos para animar
  isBattleOver: boolean;
  winner: 'player' | 'opponent' | null;
  playerHp: number; playerMaxHp: number;
  opponentHp: number; opponentMaxHp: number;
}

// BattleStepType — eventos que BattleScene consume y anima
type BattleStepType =
  | 'MESSAGE' | 'USE_MOVE' | 'MOVE_MISS' | 'DAMAGE'
  | 'CRITICAL_HIT' | 'EFFECTIVENESS' | 'MEGA_EVOLUTION'
  | 'WEATHER_EFFECT' | 'FAINT' | 'BATTLE_END';

// MapWarp — puntos de teletransporte entre mapas
interface MapWarp {
  id: string; x: number; y: number; width?: number; height?: number;
  targetMapKey: string; targetX: number; targetY: number;
  facingDirection?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  transitionType?: 'door_fade' | 'slide' | 'slide_up' | 'slide_down' | 'instant';
}

// QuestNPC — NPC con misión y diálogos por estado
interface QuestNPC {
  id: string; name: string; mapId: string; x: number; y: number;
  state: 'no_hablado' | 'mision_activa' | 'mision_completada';
  dialogues: {
    no_hablado: string[];
    mision_activa: string[];
    mision_completada: string[];
  };
}
```

---

## 📝 Log de Sesiones

### Sesión 1 — 2026-08-25

**Implementado:**
- `BattleManager` (`core/battle/battleManager.ts`): TYPE_CHART 18 tipos, fórmula Gen 9, STAB 1.5×, críticos 6.25%, factor aleatorio oficial (0.85–1.0), velocidad y prioridad de turno, cola determinista de `BattleStep[]`.
- `OverworldScene` (`scenes/OverworldScene.ts`): 5 capas Tiled, colisiones por propiedad, cámara Lerp, hierba alta 10%, transición a `BattleScene` con flash+fade.
- `BattleScene` (`scenes/BattleScene.ts`): HUDs con barras de vida animadas (Tween 800ms, color dinámico verde/amarillo/rojo), menú 4 ataques 2×2 (teclado + mouse), pipeline async de animación de pasos.
- `MapManager` (`overworld/MapManager.ts`): carga 5 capas, parseo Objects layer (warps, signposts, item_balls, ledges, PlayerSpawn).
- `WarpManager` (`overworld/WarpManager.ts`): door_fade, slide_up/down, instant; cooldown 800ms; fade-in al cargar nueva escena.
- `InteractionManager` (`overworld/InteractionManager.ts`): Signposts con typewriter (radio 40px), Item Balls con flotación, ícono `!` de proximidad, animación de recogida, inventario con apilado.
- `QuestManager` + `questTypes` (`core/quests/`): estados de misión, condiciones de entrega, recompensas dinero+items; NPCs del lore de Andara.
- `DialogueBoxPhaser` (`ui/DialogueBoxPhaser.ts`): typewriter 25ms/letra, flecha ▼ con tween, Espacio para completar/avanzar/cerrar.

---

### Sesión 2 — 2026-08-25 (continuación)

**Implementado:**
- **Fase 1 — 1.8 Ledges** (`scenes/OverworldScene.ts`): Tween parabólico en dos fases, look-ahead de 1 tile, física desactivada durante el salto.
- **Fase 2 completa** (`scenes/BattleScene.ts`): Menú LUCHAR/POKÉMON/MOCHILA/HUIR, relevo táctico, mochila con objetos curativos y Poké Ball, captura con Bezier parabólico y 1-3 rebotes, barra EXP animada, subida de nivel con flash.
- **Fase 3 completa:**
  - `PokemonCenter` (`overworld/PokemonCenter.ts`): diálogo de Joy en 3 fases, cápsulas que se iluminan una a una, flash de curación, restaura HP y PP de todo el equipo.
  - `PokeMartMenu` (`overworld/PokeMartMenu.ts`): catálogos por ciudad (Villa Tranquimar / Pueblo Altiplano / Metrópolis Solsticio), compra con selector de cantidad, pestaña de venta, mensajes de transacción.
  - `TrainerManager` (`overworld/TrainerManager.ts`): detección de visión unidireccional por tiles, ícono `!` animado, caminata automática, lock de combate, `markDefeated` / `releaseLock`.
  - Datos completos del **Gimnasio Altiplano**: Minero Javo (Geodude Nv.10), Arqueóloga Fanny (Geodude Nv.11 + Rhyhorn Nv.10), Líder **Rocío** (Geodude Nv.12 + Onix Nv.14), Medalla Cumbre.
  - `BattleScene.endBattle`: diferencia combate salvaje (restart) vs entrenador (emite `battleEnd(won)` para que `OverworldScene` gestione recompensas).
- **Fase 4 completa:**
  - `PCStorageUI` (`overworld/PCStorageUI.ts`): 8 Cajas temáticas de 30 slots (240 Pokémon de capacidad), panel de equipo (6 slots), Depositar (mínimo 1 Pokémon en equipo), Retirar (máximo 6), Mover / Intercambiar libremente y pantalla de Resumen con Stats y Movimientos.
  - `TrainerCardUI` (`ui/TrainerCardUI.ts`): Ficha de entrenador con tarjeta de diseño degradado, avatar, Nombre, ID de 5 dígitos, Dinero, Tiempo de juego formateado (HH:MM:SS), Pokédex vistos/atrapados y vitrina interactiva con las 8 Medallas de Gimnasio de Andara (efecto pulsante en las ganadas y tooltips al pasar el ratón).
  - `SaveLoadUI` (`ui/SaveLoadUI.ts`): Pantalla visual de Guardar/Cargar con 3 ranuras independientes en `localStorage`, metadatos enriquecidos (nombre, ubicación, medallas, dinero, fecha/hora, resumen de equipo), animación de guardado y confirmación.
  - `OverworldScene` (`scenes/OverworldScene.ts`): Hotkeys rápidas integradas (`P` para PC, `C` para Ficha de Entrenador, `G` para Guardar, `L` para Cargar), congelamiento del movimiento mientras una UI modal está abierta, y generador/restaurador completo de `SaveData`.
- **Fase 5 completa:**
  - `DayNightSystem` (`overworld/DayNightSystem.ts`): Ciclo continuo de 24 horas, overlay de iluminación ambiental suave con transiciones interpoladas (Mañana dorada, Día natural, Atardecer rojizo, Noche índigo), linterna/halo de luz sobre el jugador y reloj digital HUD.
  - `WeatherSystem` (`overworld/WeatherSystem.ts`): 7 climas dinámicos (Despejado, Lluvia, Tormenta Eléctrica con relámpagos reales, Tormenta de Arena, Sol Abrasador, Nieve y Niebla) con emisores de partículas y modificadores oficiales en `BattleManager` (+50% Agua en lluvia, +50% Fuego en sol, daño residual).
  - `SurfManager` (`overworld/SurfManager.ts`): Navegación acuática por HM Surf, detección de tiles de agua, diálogo interactivo de confirmación, montura animada de Lapras con ondas de agua, desembarco automático en orilla y encuentros salvajes acuáticos (Tentacool, Magikarp, Marill, Psyduck).
  - **Mega-Evolución** (`BattleScene.ts` / `BattleManager.ts`): Botón interactivo `✨ MEGA [M]`, cinemática de transformación con destello prismático y energía telúrica, +100 BST en estadísticas, cambio de nombre y aura dorada de combate `[MEGA]`.
- **Fase 6 completa (Suite de Pruebas Unitarias y QA):**
  - Framework de testing TypeScript nativo en `tests/testRunner.ts` con aserciones tipadas (`describe`, `it`, `expect`, matchers de igualdad, rangos, contención, arrays y funciones).
  - `tests/battleManager.test.ts` (6.2): Batería completa de pruebas para efectividad de 18 tipos (inmunidades, súper efectividad simple y dual 4x), fórmula de daño Gen 9, STAB (1.5x), críticos (1.5x), modificadores de clima (Lluvia/Sol), movimientos de estado, resolución de prioridades y desempates de velocidad, interrupción por debilitamiento (OHKO) y activación de Mega-Evolución (+110 BST).
  - `tests/saveManager.test.ts` (6.3): Pruebas de persistencia en 3 ranuras independientes de `localStorage`, serialización/deserialización de metadatos (`listSlots`), exportación/importación JSON formateada, rechazo de datos corruptos, y validación estructural de las 8 cajas de PC (240 Pokémon de capacidad).
  - `tests/questManager.test.ts` (6.4): Pruebas de la máquina de estados de misiones (`no_hablado` -> `mision_activa` -> `mision_completada`), validación de entrega de ítems requeridos, recompensas de dinero e inventario, registro de nuevos NPCs y callbacks reactivos `onStateChange`.
  - `tests/index.html` y script `"test"` en `package.json` para ejecución tanto en entorno de desarrollo web como en consola.

- **Fase 7 completa (Pipeline de Audio y Efectos Sonoros — SFX / BGM):**
  - `src/audio/AudioManager.ts` (7.1): Gestor de audio centralizado con soporte Web Audio API y sintetizador chiptune procedural; BGM por mapa con cross-fade suave, control de volumen master/bgm/sfx, toggle de mute y memoria de pista overworld.
  - `src/scenes/BattleScene.ts` (7.2): BGM dinámicos de combate (Pokémon Salvaje, Entrenador y Líder de Gimnasio), fanfarrias de victoria (`victory_wild`, `victory_trainer`, `victory_gym`) y reanudación automática de la música del mapa al concluir la batalla.
  - `src/audio/AudioManager.ts` (7.3): Librería completa de SFX integrada:
    - Ataques elementales por tipo (Fuego, Agua, Eléctrico, Planta, Tierra/Roca, Psíquico, Normal/Lucha, Hielo) y categoría.
    - Efectividad y críticos (`super_effective`, `not_very_effective`, `immune`, `crit_hit`).
    - Overworld y UI (`typewriter`, `select`, `confirm`, `cancel`, `ledge_jump`, `exclamation`, `item_pickup`).
    - Captura con Poké Ball (`ball_throw`, `ball_bounce`, `ball_wiggle`, `ball_catch`, `ball_break`).
    - Curación del Centro Pokémon (secuencia de 6 campanas y jingle clásico de Joy en `PokemonCenter.ts`).
    - Mega-Evolución (`mega_evolution`), subida de nivel (`level_up`) y EXP (`exp_gain`).
  - `tests/audioManager.test.ts`: Batería de pruebas unitarias para control de volumen, clamping, muting, resolución de temas de combate, SFX y jingles.

- **Expansiones de Profundidad y Pulido de Juego Base (Opciones A, B y C):**
  - **Opción A (Habilidades Pasivas & Held Items en Combate)**:
    - `src/core/battle/battleManager.ts`: Soporte nativo para habilidades de entrada (*Intimidate, Drizzle, Drought, Sand Stream, Snow Warning*), inmunidad por *Levitate*, potenciador de *Technician* (1.5x en movimientos <= 60), supervivencia OHKO por *Sturdy* / *Focus Sash*, absorción de daño por *Disguise* (Mimikyu), potenciación de *Choice Band / Specs / Scarf* (1.5x), +30% daño y 10% retroceso con *Life Orb*, daño de contacto con *Rocky Helmet*, recuperación pasiva de 1/16 PS con *Leftovers* y consumo automático de *Sitrus Berry* al <= 50% PS.
    - `tests/abilitiesAndItems.test.ts`: Suite de pruebas unitarias verificando todas las habilidades pasivas e ítems equipados.
  - **Opción B (Mecánicas de Exploración y Campo)**:
    - `src/overworld/BicycleManager.ts`: Bicicleta de Andara con alternancia en tecla `B` y duplicación de velocidad (130 -> 260 px/s).
    - `src/overworld/RepelSystem.ts`: Repelente (100 pasos), Superrepelente (200 pasos) y Máx. Repelente (250 pasos) con bloqueo de encuentros salvajes de nivel inferior al líder del equipo.
    - `src/overworld/FishingManager.ts`: Caña Vieja, Caña Buena y Supercaña con tablas de pesca escalonadas (Magikarp, Poliwag, Tentacool, Gyarados, Carvanha, Feebas, Kingdra).
    - `src/overworld/FieldObstacleManager.ts`: Obstáculos de ruta interactivos (Árboles finos para Corte, Rocas agrietadas para Golpe Roca y Rocas pesadas para Fuerza).
    - `tests/fieldMechanics.test.ts`: Suite de pruebas unitarias verificando velocidad de bici, pasos de repelente, pesca y obstáculos.
  - **Opción C (Expansión Narrativa y Mazmorras)**:
    - `src/overworld/AuroraInfiltrationManager.ts`: Infiltración en el Laboratorio Subterráneo de Solsticio (3 terminales de seguridad desactivables y rescate de Pokémon cautivos) y enfrentamiento con los 3 Comandantes de Aurora Cero en la Central Vulcania (*Ignis, Umbra, Alister*).
    - `src/overworld/NahuelRivalryManager.ts`: Los 5 Duelos Clave de Rivalidad con Nahuel (Villa Tranquimar Nv. 5, Entrada a Solsticio Nv. 16 con Growlithe, Puente de Yungas Nv. 26, Cumbres Australes Nv. 54 y Liga/Postgame Nv. 88 con Arcanine).
    - `src/overworld/RuinsPuzzleManager.ts`: Rompecabezas de las Ruinas Ancestrales de Ciudad Condorina con 3 pilares rúnicos (*Sol, Luna, Tierra*) sobre placas de presión para abrir la Cámara Sagrada de Zygarde.
    - `tests/narrativeExpansion.test.ts`: Suite de pruebas unitarias para terminales de Aurora Cero, duelos de Nahuel y puzzle de ruinas.

---

*Estado del Proyecto: 🏆 PROYECTO 100% COMPLETADO Y PULIDO (Fases 1 a 8 + Expansiones de Combate, Campo y Trama). Core Engine, Overworld, Battle System, Guardado/PC, Mundo Dinámico & Clima, Suite de Pruebas QA (9 suites completas), Audio & SFX, Pokédex Regional, Reserva Ecológica, 8 Gimnasios, Alto Mando, Campeona Renata, Campaña Narrativa y Postgame de Isla Resonancia.*

