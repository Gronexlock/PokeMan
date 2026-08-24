# 🗺️ Plan de Migración: Pokémon Ecos de Andara (TypeScript + Canvas / Vite)

Este documento detalla la hoja de ruta paso a paso para migrar el proyecto **Pokémon: Ecos de Andara** desde el motor actual en Python (Pygame) a una arquitectura moderna y de alto rendimiento basada en **TypeScript + HTML5 Canvas / WebGL (Vite)**.

---

## 🎯 1. Objetivos y Beneficios de la Migración

- **Rendimiento Nativo (60+ FPS)**: Renderizado acelerado por GPU vía HTML5 Canvas / WebGL.
- **Soporte Nativo de Sprites Animados**: GIFs de Gen 5 (Pokémon negros/blancos animados) y WebP sin decodificación manual pesada.
- **Acceso al Ecosistema Showdown**: Posibilidad de integrar `@pkmn/sim` (la librería de simulación oficial de Pokémon Showdown) para cálculo 100% exacto de movimientos, habilidades y objetos.
- **Multiplataforma Real**: Se puede jugar al instante en cualquier navegador web (PC y móvil) o compilar a `.exe` nativo y ligero con **Tauri** o **Electron**.

---

## 🏗️ 2. Arquitectura y Estructura del Proyecto

```text
Proyecto/
├── public/
│   ├── assets/
│   │   ├── sprites/
│   │   │   ├── gba/           <- Spritesheets 4x4 de personajes, casas y árboles
│   │   │   ├── pokemon/       <- GIFs animados de Pokémon (frente/espalda/iconos)
│   │   │   └── audio/         <- Gritos de Pokémon (.ogg) y BGM
│   │   └── data/
│   │       └── pokedex.json   <- Base de datos de Pokémon
├── src/
│   ├── core/                  <- Lógica del juego (agnóstica al renderizado)
│   │   ├── types.ts           <- Interfaces y tipos estrictos de TS
│   │   ├── battleEngine.ts    <- Motor de combate y cálculo de daño
│   │   └── trainerManager.ts  <- Gestión de equipo, inventario y guardado
│   ├── graphics/              <- Motor de renderizado en Canvas 2D
│   │   ├── assetLoader.ts     <- Cargador y caché de imágenes/audio
│   │   ├── camera.ts          <- Cámara suave con seguimiento de jugador
│   │   ├── overworld.ts       <- Renderer de terreno, casas, árboles y NPCs (Y-sorting)
│   │   ├── battleRenderer.ts  <- UI de combate, barras de HP y animaciones
│   │   └── dayCycle.ts        <- Sistema de iluminación y ciclo día/noche
│   ├── main.ts                <- Game Loop principal y máquina de estados
│   └── style.css              <- Estilos base del Canvas y UI
├── index.html                 <- Punto de entrada HTML5
├── package.json               <- Dependencias y scripts de Vite
└── tsconfig.json              <- Configuración estricta de TypeScript
```

---

## 📋 3. Fases de Ejecución Paso a Paso

### 🔹 Fase 1: Inicialización del Proyecto con Vite y TypeScript
1. Inicializar la configuración de **Vite** en modo Vanilla + TypeScript.
2. Configurar `tsconfig.json` con modo estricto y resolución de módulos moderna.
3. Crear el canvas de resolución base (por ejemplo, `960x540` escalable a cualquier pantalla manteniendo aspect ratio pixel-perfect).

```bash
# Comandos de inicialización
npm create vite@latest . -- --template vanilla-ts
npm install
```

---

### 🔹 Fase 2: Migración de Assets y Tipado Estricto
1. Mover la carpeta `assets/` a `public/assets/` para que Vite sirva todos los sprites de forma estática y ultrarrápida.
2. Definir las interfaces principales en `src/core/types.ts`:
   - `Pokemon`: Estadísticas (HP, Atk, Def, SpAtk, SpDef, Spe), tipos, movimientos, nivel, estado.
   - `Move`: Poder, precisión, tipo, categoría (físico/especial/estado), PP.
   - `NPC`: Posición, sprite key, diálogo, orientación.
   - `WorldObject`: Posición, dimensiones, sprite de estructura.

---

### 🔹 Fase 3: Motor del Overworld (Canvas 2D)
1. **AssetLoader (`src/graphics/assetLoader.ts`)**:
   - Clase singleton asíncrona (`Promise.all`) para pre-cargar spritesheets de personajes, casas, árboles y tiles.
2. **Ground & Terrain (`src/graphics/overworld.ts`)**:
   - Generación del terreno punteado estilo GBA (Pasto base, senderos de tierra, lago animado).
3. **Y-Sorting & Objetos**:
   - Renderizado en capas ordenado por la coordenada `Y` para permitir que el jugador camine por detrás de casas y árboles de forma natural.
4. **Cámara Suave (`src/graphics/camera.ts`)**:
   - Interpolación lineal (`lerp`) para seguimiento suave del jugador a 60 FPS.

---

### 🔹 Fase 4: Control del Personaje, NPCs y Colisiones
1. **Entrada de Teclado**:
   - Soporte para Flechas / WASD para movimiento en 4 direcciones y `Shift` para correr.
   - Tecla `Z` / `Enter` / `Espacio` para interactuar con NPCs y avanzar texto.
2. **Animación de Caminata**:
   - Selección de frame `0, 1, 2, 3` del spritesheet 4x4 según la dirección y el tiempo transcurrido.
3. **Caja de Diálogo**:
   - Renderizado de panel con efecto máquina de escribir (*typewriter effect*) y nombre del NPC.
4. **Detección de Hierba Alta**:
   - Activación de encuentros aleatorios en zonas de ruta exterior.

---

### 🔹 Fase 5: Motor de Combate (Battle Scene)
1. **Transición de Batalla**:
   - Animación de entrada de combate (fade out / flash de batalla).
2. **Renderizado de Sprites en Batalla**:
   - Dibujo del sprite de espalda del Pokémon del jugador y sprite frontal del rival.
   - Animación de rebote idle de los Pokémon.
3. **Interfaz de Usuario (UI)**:
   - Panel de 4 movimientos con tipo, PP actuales y barra de vida animada con transición de color (Verde > Amarillo > Rojo).
4. **Cálculo de Daño y Mensajería**:
   - Fórmulas de daño oficiales de Pokémon y efectividades de tipos.

---

### 🔹 Fase 6: Empaquetado y Distribución
1. **Modo Web**:
   - Ejecución local con `npm run dev`.
   - Build de producción optimizado con `npm run build` para subir a Vercel / GitHub Pages.
2. **Modo Escritorio (.EXE)**:
   - Empaquetar la aplicación web a un ejecutable nativo de Windows (`.exe`) de alto rendimiento usando **Tauri** (ocupa menos de 10 MB y no requiere instalación de Python).

---

## ⚡ 4. Guía Rápida para Comenzar la Migración

Cuando estés listo para dar el paso, el flujo de comandos será el siguiente:

```bash
# 1. Instalar dependencias del entorno Vite + TypeScript
npm install

# 2. Iniciar el servidor de desarrollo
npm run dev

# 3. Abrir el navegador en http://localhost:5173 para jugar
```
