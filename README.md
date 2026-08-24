# 🎮 Pokémon: Ecos de Andara (.EXE Local / HD-2.5D)

> **Tipo de Proyecto:** Fangame RPG Pokémon en modo local independiente (.EXE / .BAT)  
> **Estilo Visual:** 2.5D / HD-2D estilizado con iluminación dinámica en tiempo real (`CanvasModulate`)  
> **Conectividad:** 100% Offline (Bases de datos locales en JSON con Pokédex, movimientos, tipos y mapas)  
> **Plataforma Objetivo:** Windows PC (Ejecutable autónomo directo sin dependencias externas)

---

## 🌟 Características Principales del Juego

* ⚡ **100% Offline & Autónomo:** Motor propio sin dependencias complejas ni llamadas a servidores externos durante la partida.
* 🎨 **Estilo Visual HD-2.5D:** Shaders de iluminación ambiental dinámicos que transicionan en tiempo real según el reloj acelerado (**24 minutos reales = 24 horas del juego**), renderizador en capas con profundidad *Y-sorting*, sombras y fuentes de luz puntual (farolas, antorchas y ventanas iluminadas).
* ⚔️ **Motor de Combate 1v1 & Mega Evolución:** Fórmulas de daño oficiales Gen 5+, STAB (1.5x / 2.0x), críticos (1.5x), matriz completa de 18 tipos, IA táctica para líderes y rivales, y transformación **Mega Evolución en tiempo real (+100 BST)** con límite de 1 por bando.
* 🌟 **Sistema Competitivo QoL:** Todos los Pokémon generados tienen **31 IVs perfectos** en los 6 stats y acceso libre a las **21 Mentas de Naturaleza** ($2,500 en tiendas) para ajustar naturalezas al instante sin crianza artificial.
* 📜 **Catálogo Expandido de Movimientos & MTs en Tiendas:** Más de 110 movimientos oficiales y bazar de MTs/MOs a la venta por dinero ($), permitiendo enseñar directamente movimientos de huevo y tutor sin crianza.
* 🎯 **Calculadora Oficial de Captura:** Fórmula matemática Gen 5+ con multiplicadores de Poké Balls y estados alterados, incluyendo el **escudo inviolable de rechazo ante Legendarios del Conflicto (Eternatus y Zygarde)**.
* 🗺️ **Overworld & Reserva Ecológica:** Movimiento tile-based fluido, saltos de desnivel (*Ledges* al sur), entrenadores de ruta con campo de visión y exclamación `!`, teletransportes (*Warps*) y Zona Safari Tradicional con iniciales y crías de pseudo-legendarios al 10-15%.
* 💬 **Motor de Diálogos & Mugshots:** Cajas de texto con efecto máquina de escribir, catálogo de 20 retratos emocionales (Prof. Ceibo, Nahuel, Renata, Alister, Clara), árboles de decisiones y sincronización directa con `story_flags`.
* 💾 **Sistema de Guardado `.sav`:** Serialización local con verificación de integridad mediante checksum SHA-256, gestión de **30 Cajas de PC (900 espacios)** y mochila categorizada en 6 bolsillos.
* 🎵 **Controlador de Audio:** Pistas de música BGM para exploración y combates contra líderes/campeona, junto a efectos de sonido SFX.

---

## 📁 Estructura del Proyecto

```text
├── assets/                             # Recursos visuales y sonoros
├── data/                               # Bases de datos 100% offline
│   ├── dialogues.json                  # Guiones narrativos, mugshots y flags
│   ├── encounters.json                 # Tablas de encuentros, biomas, Safari y Shinies (1/1024)
│   ├── items.json                      # Catálogo de objetos, MTs, 21 mentas y 33 Mega Piedras
│   ├── maps_data.json                  # Matrices de mapas, colisiones, ledges y warps
│   ├── mega_evolutions.json            # Datos de transformación mega (+100 BST)
│   ├── moves.json                      # Catálogo de 111 movimientos y estados
│   ├── pokedex.json                    # Pokédex Regional (~120+ especies con learnsets)
│   ├── trainers.json                   # 8 Líderes de Gimnasio, Alto Mando, Renata y Nahuel
│   └── types.json                      # Matriz oficial de efectividades de los 18 tipos
├── dist/                               # Paquete compilado para distribución en Windows
│   └── PokemonEcosDeAndara/            # Carpeta autónoma lista para jugar
│       ├── PokemonEcosDeAndara.bat     # Lanzador de 1 Clic para Windows
│       ├── README_WINDOWS.txt          # Manual de inicio rápido
│       ├── data/                       # Bases de datos empaquetadas
│       ├── saves/                      # Directorio de partidas (.sav)
│       └── src/                        # Código fuente del motor
├── src/                                # Código fuente modular del motor
│   ├── audio/                          # Controlador de música BGM y efectos SFX
│   │   └── audio_manager.py
│   ├── battle_ui/                      # Escenarios parallax y HUD de combate
│   │   ├── battle_scene_renderer.py
│   │   └── battle_simulator.py
│   ├── core/                           # Lógica pura del motor
│   │   ├── battle/                     # Motor de combate 1v1, IA, daño y captura
│   │   │   ├── battle_ai.py
│   │   │   ├── battle_engine.py
│   │   │   ├── catch_calculator.py
│   │   │   ├── damage_calculator.py
│   │   │   └── mega_engine.py
│   │   ├── dialogue_manager.py         # Motor de diálogos y mugshots
│   │   ├── evolution_manager.py        # Evoluciones sin intercambio
│   │   ├── pokemon_generator.py        # Generador con 31 IVs y mentas
│   │   ├── postgame_expansion.py       # Isla Resonancia postgame
│   │   ├── save_manager.py             # Serializador .sav con SHA-256
│   │   ├── shop_catalog.py             # Tiendas y MTs por dinero ($)
│   │   ├── starter_selection.py        # Selección reactiva del rival
│   │   ├── story_events.py             # Cinemáticas y orquestador de eventos
│   │   └── trainer_manager.py          # Generador de jefes y Nahuel dinámico
│   ├── graphics/                       # Shaders de luz y renderizado 2.5D
│   │   ├── lighting_shader.py
│   │   └── overworld_renderer_25d.py
│   ├── menus/                          # Menús y visualizadores interactivos
│   │   └── dialogue_visualizer.py
│   ├── overworld/                      # Movimiento, mapas, reloj y encuentros
│   │   ├── encounter_manager.py
│   │   ├── map_manager.py
│   │   ├── npc_manager.py
│   │   ├── player_controller.py
│   │   └── time_cycle.py
│   └── main.py                         # Bucle central y pantalla de título
├── tests/                              # Suites de verificación automatizadas (.ps1 y .py)
├── tools/                              # Scripts de empaquetado y generación de bases de datos
├── GUIA_PROYECTO_POKEMON_FANGAME.md    # Documentación técnica maestra y fórmulas
├── HISTORIA_ANDARA.md                  # Lore, gimnasios, trama de Nahuel y legendarios
├── POKEDEX_REGIONAL_ANDARA.md          # Catálogo de especies y expansión postgame
├── ROADMAP_PASOS_PENDIENTES.md         # Registro de fases completadas (100%)
└── README.md                           # Este archivo
```

---

## 🕹️ Paso a Paso: Cómo Probar la Primera Versión del Juego

Existen **3 métodos sencillos** para probar y jugar de inmediato:

### Método 1: Lanzador Directo de Windows (1 Clic — Recomendado)
1. Navega a la carpeta:
   ```text
   c:\Users\Asus\Desktop\Proyecto\dist\PokemonEcosDeAndara\
   ```
2. Haz doble clic en el archivo **`PokemonEcosDeAndara.bat`**.
3. El lanzador abrirá la consola de Windows con la **Pantalla de Título interactiva**, cargará los datos offline e iniciará la aventura.

---

### Método 2: Ejecución Directa desde la Consola / Terminal
Abre PowerShell o CMD en la raíz del proyecto (`c:\Users\Asus\Desktop\Proyecto`) y ejecuta:

```powershell
# Iniciar el juego completo (Pantalla de título, prólogo, overworld 2.5D y combate con Nahuel)
python src\main.py
```

Si deseas probar módulos específicos de forma interactiva:
```powershell
# 1. Probar el Simulador de Combate CLI (Duelo de Mega Evoluciones en Villa Tranquimar)
python src\battle_ui\battle_simulator.py

# 2. Probar las Cinemáticas con Retratos Emocionales (Mugshots y Elecciones)
python src\menus\dialogue_visualizer.py
```

---

### Método 3: Ejecutar las Suites de Verificación Automatizadas (PowerShell)
Puedes verificar la integridad matemática y lógica de todo el juego ejecutando las pruebas con PowerShell:

```powershell
# Suite de la Fase 6 (Visuales 2.5D, Shaders, Parallax, Audio y Empaquetado .EXE)
powershell.exe -ExecutionPolicy Bypass -File .\tests\verify_phase6.ps1

# Suite de Sistemas de Profundidad (8 Líderes, Nahuel dinámico, MTs, Captura y Estados)
powershell.exe -ExecutionPolicy Bypass -File .\tests\verify_depth.ps1

# Suite de la Fase 5B (Diálogos, Mugshots y Eventos Narrativos)
powershell.exe -ExecutionPolicy Bypass -File .\tests\verify_phase5b.ps1

# Suite de la Fase 4 (Overworld, Mapas, Reloj 24m=24h y Reserva Safari)
powershell.exe -ExecutionPolicy Bypass -File .\tests\verify_phase4.ps1

# Suite de la Fase 2 & 5A (Motor de Combate 1v1, Mega Evolución y Guardado .SAV con SHA-256)
powershell.exe -ExecutionPolicy Bypass -File .\tests\verify_phase2.ps1

# Suite de Mecánicas Base (Pokédex, Tiendas $, 31 IVs y Postgame)
powershell.exe -ExecutionPolicy Bypass -File .\tests\verify_mechanics.ps1
```

---

## ⚖️ Aviso Legal (Disclaimer)

*Este es un proyecto no comercial creado exclusivamente con fines educativos, de aprendizaje y como fangame sin ánimo de lucro. Pokémon y todos los nombres, personajes e imágenes asociadas son marcas registradas de Nintendo, Creatures Inc. y Game Freak.*
