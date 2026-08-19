# 🎮 Pokémon Fangame Engine (2.5D Local .EXE)

Un motor y juego de rol Pokémon independiente diseñado para ejecutarse de forma 100% offline en Windows como un archivo `.exe` con gráficos estilizados 2.5D / HD-2D, historia original y combate por turnos fiel a las mecánicas oficiales.

---

## 🌟 Características Principales

* ⚡ **100% Offline & Local:** Datos de PokéAPI precacheados en JSON/SQLite sin depender de conexión a internet durante el juego.
* 🎨 **Estilo Visual 2.5D / HD-2D:** Sprites animados (Gen 5 / Showdown), iluminación dinámica día/noche con sombras en tiempo real, efectos de partículas y cámara dinámica.
* ⚔️ **Motor de Batalla Oficial:** Fórmulas de daño oficiales (Gen 5+), cálculo de efectividades por tipo, IVs/EVs, naturalezas, estados alterados e IA estratégica.
* 🗺️ **Overworld & Exploración:** Movimiento en 8 direcciones, sistema de encuentros por probabilidad de zona, visión de entrenadores y diálogos cinemáticos.
* 💾 **Sistema de Guardado:** Serialización local en archivo `.sav` para conservar equipo, inventario, progreso de medallas y cajas de PC.

---

## 📁 Estructura del Proyecto

```text
├── assets/                       # Recursos visuales y sonoros
│   ├── audio/                    # BGM (música) y SFX (efectos)
│   ├── shaders/                  # Shaders de iluminación, agua y post-procesado
│   └── sprites/                  # Sprites de Pokémon, entrenadores y tilesets
├── data/                         # Base de datos local (Pokédex, movimientos, tipos)
├── src/                          # Código fuente del motor
│   ├── battle_ui/                # Interfaz y animaciones de combate
│   ├── core/                     # Lógica pura (Combate, entidades, guardado)
│   ├── menus/                    # Mochila, equipo, Pokédex y opciones
│   └── overworld/                # Mapas, jugador, NPCs y eventos
├── tools/                        # Scripts de extracción de datos (PokéAPI)
├── .gitignore                    # Reglas de exclusión para Git
├── GUIA_PROYECTO_POKEMON_FANGAME.md # Documentación técnica y fórmulas
└── README.md                     # Este archivo
```

---

## 🚀 Inicio Rápido

### 1. Requisitos Previos
* **Python 3.10+** (para los scripts de extracción de datos en `tools/`).
* **Git** instalado en tu sistema.
* Motor de juego de tu elección (**Godot 4.x** recomendado o entorno web con **Tauri**).

### 2. Descargar Datos y Sprites de PokéAPI
Para poblar la carpeta `data/` y descargar los sprites iniciales:

```bash
# 1. Instalar dependencias del extractor
pip install -r requirements.txt

# 2. Ejecutar el script extractor (por defecto descarga la Gen 1)
python tools/fetch_pokeapi.py
```

---

## 🗺️ Roadmap de Desarrollo

- [x] **Fase 0:** Diseño de arquitectura y documentación técnica.
- [ ] **Fase 1:** Extracción y serialización de datos de la PokéAPI.
- [ ] **Fase 2:** Prototipo del motor de combate 1v1 en consola/interfaz básica.
- [ ] **Fase 3:** Sistema de Overworld, movimiento y mapa del pueblo inicial.
- [ ] **Fase 4:** Interfaz visual de combate con sprites animados e iluminación.
- [ ] **Fase 5:** Sistema de eventos, diálogos de historia y guardado `.sav`.
- [ ] **Fase 6:** Compilación final y empaquetado a `.exe` para Windows.

---

## ⚖️ Aviso Legal (Disclaimer)

*Este es un proyecto no comercial creado exclusivamente con fines educativos, de aprendizaje y como fangame sin ánimo de lucro. Pokémon y todos los nombres, personajes e imágenes asociadas son marcas registradas de Nintendo, Creatures Inc. y Game Freak.*
