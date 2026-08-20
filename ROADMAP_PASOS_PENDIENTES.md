# 📋 ROADMAP Y REGISTRO DE PASOS PENDIENTES
## Proyecto: Pokémon: Ecos de Andara (.EXE Local / HD-2.5D)

> **Estado Actual:** 🟡 **FASE 1 EN CURSO (Pipeline de Datos y Assets)**  
> **Última Actualización:** 2026-08-20  
> **Documentos de Referencia:** [`HISTORIA_ANDARA.md`](file:///c:/Users/Asus/Desktop/Proyecto/HISTORIA_ANDARA.md) y [`POKEDEX_REGIONAL_ANDARA.md`](file:///c:/Users/Asus/Desktop/Proyecto/POKEDEX_REGIONAL_ANDARA.md)

---

## 🗺️ Resumen General de Fases

```
[FASE 0] Diseño & Documentación           [✔ COMPLETADA]
   ├── Documento Maestro de Historia & Lore (Andara)
   ├── 8 Gimnasios, Alto Mando y Campeona Renata
   ├── Sistema de Mega Evolución & Zygarde / Eternatus
   └── Pokédex Regional (~220 especies por biomas)

[FASE 1] Pipeline de Datos & Assets Locales [🟡 EN EJECUCIÓN]
   ├── Script extractor PokéAPI (Tipos, Movimientos, Especies, Megas)
   ├── Base de datos local JSON en /data
   └── Descarga de Sprites e Iconos en /assets

[FASE 2] Motor de Combate (Core Lógico)   [⚪ PENDIENTE]
   ├── Cálculo de estadísticas con IVs, EVs y Naturalezas
   ├── Fórmulas de daño oficial Gen 5+ (STAB, Crítico, Efectividades)
   ├── Sistema de Estados Alterados (Parálisis, Quemadura, etc.)
   ├── Máquina de Estados de Batalla por Turnos (FSM)
   ├── Sistema de Mega Evolución en combate
   └── IA Estratégica para Líderes, Alto Mando y Rivales

[FASE 3] Sistemas Narrativos y Progresión  [⚪ PENDIENTE]
   ├── Selector Filosófico de Iniciales (Profesor Ceibo)
   ├── Selector de 2º Compañero en Metrópolis Solsticio
   ├── Generador Dinámico de Equipos para Nahuel (por rutas)
   └── Motor de Flags de Historia y Diálogos

[FASE 4] Overworld, Mapas y Movimiento     [⚪ PENDIENTE]
   ├── Controlador del Jugador (8 direcciones, correr, colisiones)
   ├── Mapas: Villa Tranquimar, Metrópolis Solsticio y Rutas
   ├── Reserva Ecológica de Andara (Zona Safari sin límite de pasos)
   ├── Sistema de Visión de Entrenadores (!)
   └── Encuentros en hierba alta por probabilidad de zona

[FASE 5] Interfaces, Menús y Guardado     [⚪ PENDIENTE]
   ├── Interfaz de Combate con barras de vida animadas
   ├── Menú Mochila con pestañas clasificadas
   ├── Menú Equipo Pokémon y Pokédex Regional
   └── Sistema de Guardado y Carga (.sav local encriptado)

[FASE 6] Pulido, Endgame, NG+ y Compilación [⚪ PENDIENTE]
   ├── Iluminación dinámica día/noche y shaders 2.5D
   ├── Audio ambiental (BGM) y efectos de sonido (SFX)
   ├── Modo Defensa del Título de Campeón (Nv. 80-100)
   ├── Eventos de Células de Zygarde y Nueva Zona de Eternatus
   ├── Modo New Game+ con escalado y diálogos contextuales
   └── Empaquetado final y exportación a .EXE directo para Windows
```

---

## 🔍 Checklist Detallado de Pasos por Completar

### 📦 FASE 1: Pipeline de Datos y Assets [✔ COMPLETADA]
- [x] Diseñar el catálogo de especies de la Pokédex Regional de Andara.
- [x] Implementar base de datos local `data/types.json` (tabla de 18 tipos y efectividades).
- [x] Implementar base de datos `data/moves.json` (catálogo de movimientos, potencia, precisión, efectos).
- [x] Implementar base de datos `data/pokedex.json` (stats base, tipos, learnsets).
- [x] Implementar catálogo de `data/mega_evolutions.json` (megapiedras, cambios de tipo y stats).
- [x] Implementar catálogo de `data/items.json` (pokéballs, pociones, megapiedras, objetos de batalla).
- [ ] Descargar sprites front/back adicionales para la carpeta `assets/sprites/`.

---

### ⚔️ FASE 2: Motor de Combate (Core Lógico)
- [ ] `src/core/entities/pokemon.py`: Clase Pokémon con cálculo dinámico de stats reales a partir de IVs, EVs, Naturaleza y Nivel.
- [ ] `src/core/entities/move.py`: Clase Movimiento con PP, categoría (Físico, Especial, Estado), prioridad y efectos secundarios.
- [ ] `src/core/battle/damage_calculator.py`: Función matemática oficial de daño con multiplicadores de crítico, STAB, efectividad, quemadura y aleatoriedad.
- [ ] `src/core/battle/battle_engine.py`: FSM de turnos (Selección $\rightarrow$ Prioridad de velocidad $\rightarrow$ Ejecución $\rightarrow$ Check Faint $\rightarrow$ Experiencia/Subida de nivel).
- [ ] `src/core/battle/mega_evolution.py`: Mecánica de activación de Mega Evolución una vez por combate con cambio de stats y habilidades.
- [ ] `src/core/battle/ai_trainer.py`: IA táctica que evalúa efectividades, predice cambios y prioriza movimientos óptimos para Líderes y Alto Mando.

---

### 📖 FASE 3: Sistemas Narrativos y Progresión
- [ ] `src/core/story/starter_selection.py`: Menú interactivo del Profesor Ceibo (pregunta filosófica: Planta, Fuego o Agua $\rightarrow$ catálogo de iniciales).
- [ ] `src/core/story/second_starter.py`: Elección en Metrópolis Solsticio de cualquier etapa base.
- [ ] `src/core/entities/rival_generator.py`: Algoritmo que construye el equipo de Nahuel capturando Pokémon de las rutas recorridas, manteniendo su Arcanine insignia y balance de tipos.
- [ ] `src/core/story/flags_manager.py`: Registro global de eventos (`arcanine_injured`, `gyms_beaten`, `champion_crowned`, `postgame_unlocked`).

---

### 🗺️ FASE 4: Overworld y Exploración
- [ ] Sistema de movimiento en cuadrícula / 8 direcciones con aceleración al correr.
- [ ] Tilemap de **Villa Tranquimar** (muelle, playa, casas, laboratorio de Ceibo).
- [ ] Tilemap de **Metrópolis Solsticio** (rascacielos, tranvía, sede de la Liga).
- [ ] Sistema de la **Reserva Ecológica de Andara** (Zona Safari con conteo de Safari Balls, sin límite de pasos).
- [ ] Sistema de detección de entrenadores por línea de visión (signo de exclamación `!`).
- [ ] Tablas de probabilidad de encuentro en hierba (`encounters.json`).

---

### 🖥️ FASE 5: Menús, UI y Guardado
- [ ] Escena de combate con fondos dinámicos por bioma, sombras e interfaz de selección (*Luchar, Mochila, Pokémon, Huir*).
- [ ] Menú de Mochila categorizado por pestañas (*Objetos, Pokéballs, Medicina, MT/MO, Megapiedras, Clave*).
- [ ] Menú de Equipo con vista de salud, estados, movimientos y stats.
- [ ] Menú de Pokédex Regional con vista de hábitat, grito y datos.
- [ ] Serializador de guardado `.sav` para guardar posición, equipo, cajas de PC, inventario y flags de historia.

---

### 🏆 FASE 6: Endgame, NG+ y Compilación Final
- [ ] Sistema de alerta de aspirantes a la Liga (Defensa del Título) con equipos competitivos a niveles 80-100.
- [ ] Misión de rastreo de células de Zygarde y evento de Eternatus.
- [ ] Evento de traspaso del Arcanine de Nahuel al Campeón.
- [ ] Modo New Game+ con escalado de niveles y líneas de diálogo secretas.
- [ ] Empaquetado a ejecutable `.exe` nativo de Windows (Godot 4 PCK embebido o Tauri portable).
