# 🎮 Pokémon: Ecos de Andara (Edición TypeScript / Canvas HD-2.5D)

> **Tipo de Proyecto:** Fangame RPG Pokémon desarrollado en **TypeScript + HTML5 Canvas (Vite)**  
> **Estilo Visual:** 2.5D / HD-2D estilizado con iluminación dinámica en tiempo real (`Canvas 2D`), spritesheets 4x4, y GIFs animados de Gen 5  
> **Conectividad:** 100% Offline (Bases de datos locales en JSON con Pokédex, movimientos, tipos y mapas)  
> **Plataforma Objetivo:** Web Browser (PC y Móvil con controles táctiles) y compilable a `.exe` nativo con **Tauri**

---

## 🌟 Características Principales del Juego

* ⚡ **Arquitectura Moderna en TypeScript:** Motor de alto rendimiento a 60+ FPS basado en Canvas 2D sin dependencias pesadas.
* 🎨 **Estilo Visual HD-2.5D & Y-Sorting:** Renderizado por capas con ordenamiento de profundidad en tiempo real, permitiendo caminar de forma fluida por delante y por detrás de casas, árboles y NPCs.
* 🌓 **Ciclo Día/Noche con Iluminación:** Shaders ambientales con transiciones de color para Amanecer, Mediodía, Atardecer y Noche con fuentes de luz puntuales (ventanas iluminadas y farolas).
* ⚔️ **Motor de Combate 1v1 & Mega Evolución:** Fórmulas de daño oficiales Gen 5+, STAB (1.5x / 2.0x), críticos (1.5x), matriz completa de 18 tipos, IA táctica para líderes y rivales, y transformación **Mega Evolución en tiempo real (+100 BST)**.
* 🌟 **Sistema Competitivo QoL:** Todos los Pokémon generados cuentan con **31 IVs perfectos** y compatibilidad con **Mentas de Naturaleza** para ajustar estadísticas al instante.
* 🎯 **Calculadora Oficial de Captura:** Fórmula matemática Gen 5+ con multiplicadores de Poké Balls y cálculo de 0 a 3 sacudidas o captura crítica.
* 🗺️ **Overworld & Diálogos:** Movimiento tile-based fluido, salto de desniveles (*Ledges*), teletransportes (*Warps*), hierba alta con encuentros aleatorios y motor de diálogos con opciones ramificadas.
* 💾 **Sistema de Guardado Persistente:** Guardado en `localStorage` del navegador con soporte de exportación/importación en formato `.json`.
* 🎵 **Controlador de Audio:** Sintetizador Web Audio API para SFX de combate y reproducción de los **gritos oficiales de Pokémon (.ogg)**.

---

## 📁 Estructura del Proyecto

```text
Proyecto/
├── public/                             # Recursos estáticos servidos por Vite
│   ├── assets/                         # Spritesheets GBA, GIFs animados Gen 5, Arte oficial y Gritos (.ogg)
│   └── data/                           # Bases de datos 100% offline (JSON)
├── src/                                # Código fuente modular en TypeScript
│   ├── audio/                          # Sintetizador Web Audio API y reproductor de cries
│   │   └── audioEngine.ts
│   ├── core/                           # Lógica pura del motor
│   │   ├── types.ts                    # Interfaces estrictas
│   │   ├── pokemonGenerator.ts         # Generador de estadísticas e IVs
│   │   ├── damageCalculator.ts         # Calculadora de daño oficial
│   │   ├── megaEngine.ts               # Motor de Mega Evolución
│   │   ├── catchCalculator.ts          # Calculadora de captura de Poké Balls
│   │   ├── battleAI.ts                 # Inteligencia artificial
│   │   ├── battleEngine.ts             # Motor de combate por turnos
│   │   ├── dialogueManager.ts          # Motor de diálogos y decisiones
│   │   ├── storyManager.ts             # Eventos y ceremonia de iniciales
│   │   └── saveManager.ts              # Persistencia en LocalStorage
│   ├── graphics/                       # Renderizado en Canvas 2D
│   │   ├── assetLoader.ts              # Cargador singleton con caché
│   │   ├── camera.ts                   # Cámara suave con lerp y límites
│   │   ├── lightingShader.ts           # Iluminación ambiental y luces puntuales
│   │   ├── overworldRenderer.ts        # Renderizado de terreno y Y-sorting
│   │   └── battleRenderer.ts           # Escenarios 2.5D y HUD de combate
│   ├── overworld/                      # Controladores del mundo
│   │   ├── playerController.ts         # Animación 4x4, colisiones y ledges
│   │   ├── npcManager.ts               # Posición y orientación de NPCs
│   │   ├── timeCycle.ts                # Ciclo de reloj día/noche
│   │   └── encounterManager.ts         # Encuentros en hierba alta
│   ├── ui/                             # Menús e interfaz
│   │   ├── titleScreen.ts              # Pantalla de título estelar
│   │   └── pauseMenu.ts                # Menú de pausa, equipo y Pokédex
│   ├── main.ts                         # Game loop y orquestador principal
│   └── style.css                       # Estilos modernos y layout responsivo
├── tools/                              # Scripts de utilidad y sincronización
├── index.html                          # Punto de entrada HTML5 con soporte táctil
├── JUGAR.bat                           # Lanzador de 1 Clic para Windows
├── package.json                        # Configuración de dependencias Vite
├── tsconfig.json                       # Configuración estricta de TypeScript
└── vite.config.ts                      # Configuración de Vite
```

---

## 🚀 Cómo Iniciar y Jugar

1. **Vía Archivo `.BAT`**:
   Haz doble clic en `JUGAR.bat`.

2. **Vía Terminal**:
   ```bash
   # Instalar dependencias
   npm.cmd install

   # Iniciar servidor local
   npm.cmd run dev

   # Compilar para producción
   npm.cmd run build
   ```

Abre tu navegador en `http://localhost:5173/`.

---

## 🎮 Controles

| Tecla / Control | Acción |
| :--- | :--- |
| **WASD / Flechas** | Moverse en 4 direcciones / Navegar en menús |
| **Shift** (Mantener) | Correr |
| **Z / Espacio / Enter** | Interactuar / Confirmar / Avanzar diálogo / Atacar |
| **X / ESC** | Menú de Pausa / Cancelar / Volver |
| **M** | Silenciar audio (Mute) |
| **D-Pad / Botones A y B** | Controles táctiles en pantalla para móviles/tablets |
