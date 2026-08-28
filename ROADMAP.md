# 🗺️ ROADMAP DEFINITIVO — POKÉMON: ECOS DE ANDARA
> **Motor:** TypeScript + HTML5 Canvas (Vite) / Phaser 3  
> **Región:** Andara | **Estilo Visual:** HD-2.5D con Shaders & Sprites Dinámicos  
> **Conectividad:** 100% Offline con CDNs en cascada (Showdown + PokeAPI + PokéSprite)

---

## 📊 Resumen Ejecutivo del Estado del Proyecto (~88% Completado)

```
MÓDULO                          ESTADO          DETALLES
─────────────────────────────────────────────────────────────────────────────
Core / Lógica de Combate        ✅ 100%         Daño Gen 5+, Mega Evolución, IA, STAB, IVs 31
Pipeline de Datos (JSON)        ✅ 100%         Pokédex, Moves, Items, Types, Encounters
CDNs de Sprites & Avatares      ✅ 100%         Showdown (GIFs/Trainers) + PokeAPI + PokéSprite
Interfaces y Menús (UI)         ✅ 100%         Pausa, Pokédex HD, Equipo, Starters, Evolución
Renderizador de Batalla         ✅ 100%         battleRenderer.ts asíncrono con Parallax y FX
Overworld y Mecánicas           ✅ 100%         Clima, Día/Noche, Surf, Ledges, Partículas
Mapas y Rutas (Overworld)       ✅ 100%         13 mapas enlazados, colisiones y warps
Entrenadores y Diálogos         ✅ 100%         Líderes, Rival Nahuel, Rutas, Árboles narrativos
Game Loop de Inicio a Fin       ✅ 100%         Intro ➔ Overworld ➔ Combates ➔ Guardado
Audio & SFX                     🟡 80%          AudioManager chiptune procedural + Gritos
```

---

## 🎯 Fases de Desarrollo

### ✅ FASE 1: Fundamentos del Motor y Datos (COMPLETADA)
- [x] Estructura modular TypeScript y compilación con Vite.
- [x] Tipado estricto (`types.ts`) para Pokémon, Ataques, Tipos, NPCs y Mapas.
- [x] Base de datos de especies (`pokedex.json` con 30+ Pokémon de la región de Andara).
- [x] Catálogo de 200+ movimientos (`moves.json`) y matriz completa de 18 tipos (`types.json`).
- [x] Catálogo de objetos (`items.json` con Pokéballs, pociones, mentas, piedras evolutivas).
- [x] Generador de Pokémon con IVs perfectos (31) y naturalezas ajustables (`pokemonGenerator.ts`).

### ✅ FASE 2: Motor de Combate 1v1 & Mega Evolución (COMPLETADA)
- [x] Máquina de estados FSM: Turnos por velocidad, prioridad y selecciones.
- [x] Fórmulas de daño oficiales Gen 5+ con STAB, críticos (1.5x) y aleatoriedad (`damageCalculator.ts`).
- [x] Estados alterados (Quemadura, Parálisis, Veneno, Sueño, Congelación).
- [x] Motor de Mega Evolución (+100 BST en tiempo real) (`megaEngine.ts`).
- [x] Calculadora de captura oficial Gen 5+ (`catchCalculator.ts`).
- [x] Inteligencia Artificial para entrenadores y jefes (`battleAI.ts`).
- [x] Motor de experiencia, niveles y aprendizaje de movimientos (`evolutionEngine.ts`).

### ✅ FASE 3: CDN de Sprites y Assets en Vivo (COMPLETADA)
- [x] Integración de **Pokémon Showdown** para GIFs animados (frente y espalda).
- [x] Integración de **Showdown Trainers** con +1000 retratos y avatares de entrenadores (`public/assets/sprites/gba/trainers/` y `public/assets/sprites/portraits/`).
- [x] Descarga e integración de sprites auténticos de Entrenadores (Profesor Ceibo/Científico, Brendan/Alex, May/Chica, Silver/Nahuel, Líderes, Alto Mando y NPCs).
- [x] Integración de **PokeAPI** para ilustraciones oficiales en alta resolución (HD Artwork).
- [x] Integración de **PokéSprite** para mini-íconos de caja, equipo y Pokédex.
- [x] Sistema de fallback automático en 4 niveles (Showdown ➔ PokeAPI Gen5 ➔ PNG ➔ Local).

### ✅ FASE 4: Renderizado de Combate y Menús HD (COMPLETADA)
- [x] `battleRenderer.ts`: Combates a 60 FPS con carga asíncrona y GIFs animados en tiempo real.
- [x] `IntroScene.ts`: Presentación con ilustración oficial en alta definición (1024x1024 estilo Ken Sugimori) del **Profesor Ceibo** y tarjetas de selección HD de **Alex (Chico)** y **Valeria (Chica)**.
- [x] `DialogueBoxPhaser.ts`: Cuadro de diálogo con retratos oficiales HD (Profesor Ceibo, Rival Nahuel, Alex, Valeria, Líder Rocío y NPCs).
- [x] `starterSelect.ts`: Pantalla de iniciales con ilustraciones HD oficiales y descripciones.
- [x] `pauseMenu.ts`: Visor de Pokédex con mini-íconos e ilustración HD + Equipo Pokémon.
- [x] `evolutionScreen.ts`: Animación de evolución con silueta brillante y revelación HD.

---

### ✅ FASE 5: Mapas de la Región Andara (`maps_data.json`) (COMPLETADA)
- [x] **Pueblo Inicial (Villa Tranquimar):**
  - [x] Exterior con casas, caminos, muelle, NPCs y Poké Ball oculta.
  - [x] Interiores: Casa del Protagonista (PB y Habitación con PC).
  - [x] Interiores: Casa del Rival Nahuel.
  - [x] Interiores: Laboratorio del Profesor Ceibo (Mesa de iniciales y PCs).
  - [x] Interiores: Centro Pokémon y Tienda Poké Mart.
  - [x] Warps bidireccionales con coordenadas exactas.
- [x] **Ruta 1 (Sendero Costero):**
  - [x] Zonas de hierba alta con encuentros de Pokémon nivel 2–5.
  - [x] Desniveles (*Ledges*) unidireccionales y objetos en el suelo (Poción + 3 Poké Balls).
  - [x] 2 Entrenadores con equipo y recompensas (Joven Mateo y Cazabichos Lucas).
- [x] **Ciudad 1 (Pueblo Altiplano):**
  - [x] Centro Pokémon, Tienda y NPCs informativos.
  - [x] Gimnasio de Altiplano con Líder Rocío (Especialista en Roca/Tierra con Medalla Sedimento).

---

### ✅ FASE 6: Entrenadores, Historia y Diálogos (`dialogues.json` & `trainers.json`) (COMPLETADA)
- [x] **Árboles de Diálogo Narrativos en `data/dialogues.json`:**
  - [x] `intro_ceibo_ceremony`: Ceremonia de entrega de Inicial, Pokédex y Mega-Aro con el Profesor Ceibo.
  - [x] `mom_first_talk`: Despedida de Mamá con entrega de las Zapatillas Deportivas.
  - [x] `route_1_rival_ambush`: Emboscada y primer combate del rival Nahuel en la salida de Villa Tranquimar.
  - [x] `gym_1_rocio_battle`: Diálogo previo, combate y victoria contra la Líder Rocío (Medalla Sedimento).
  - [x] `solsticio_growlithe_adoption`: Subtrama emocional de adopción de Growlithe por Nahuel.
  - [x] `renata_mountain_encounter`: Encuentro en la cumbre con la Campeona Renata.
  - [x] `aurora_fracture_scene`: Ruptura ideológica del Equipo Aurora en el Cráter Resonante.
- [x] **Catálogo de Entrenadores en `data/trainers.json`:**
  - [x] 8 Líderes de Gimnasio configurados con medallas, MTs y equipos progresivos (Nv. 13 a 57).
  - [x] Entrenadores de la Ruta 1 (*Joven Mateo*, *Cazabichos Lucas*, *Chica Camila*).
  - [x] Equipos del rival Nahuel (Batalla 1 y Batalla 2).
  - [x] Alto Mando (Nayra, Marcos, Lautaro, Ezequiel) y Campeona Renata (Garchomp Mega).

---

### ✅ FASE 7: Game Loop de Inicio a Fin & Conexión de Escenas (COMPLETADA)
- [x] **Flujo Principal Conectado:**
  - [x] `IntroScene`: Bienvenida del Prof. Ceibo con cuadro de diálogo animado y sonido typewriter.
  - [x] Selección interactiva de género (Chico / Chica) con resaltado y nombres personalizados.
  - [x] Transición cinemática (*White Flash Transition*) hacia **Villa Tranquimar**.
  - [x] Movimiento fluido del jugador en 4 direcciones (caminar, correr con Shift, animaciones direccionales).
  - [x] Sistema de desniveles (*Ledge Jump*) con salto parabólico en 2 casillas.
  - [x] Sistema de Surf con montura gráfica, ondas de agua y desembarco automático en tierra.
  - [x] Interacción con NPCs (Mamá, Científicos, Joy, Mart, Entrenadores).
  - [x] Transición hacia `BattleScene` por hierba alta y campo de visión de entrenadores.
  - [x] Retorno automático al Overworld con reanudación de la música tras finalizar el combate.

---

### 🚀 EN PROGRESO: FASE 8 — Audio & Distribución Final
- [x] Sintetizador Chiptune Web Audio procedural en `AudioManager.ts` para todas las zonas y batallas.
- [ ] Incorporación de SFX de ataques adicionales y gritos de Pokémon oficiales.
- [ ] Optimización de assets y empaquetado final.
- [ ] Compilación de producción con `npm run build`.
- [ ] Actualización de `JUGAR.bat` y empaquetado Windows.
