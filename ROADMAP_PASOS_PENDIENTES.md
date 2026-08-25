# 🗺️ ROADMAP OFICIAL: POKÉMON ECOS DE ANDARA
### Plan Maestro de Desarrollo por Fases — Inspirado en los Clásicos Oficiales de GBA/NDS

Este documento establece la hoja de ruta exhaustiva y secuencial para construir la experiencia completa de Pokémon en TypeScript + Canvas 2D, tomando como estándar los pilares de *Pokémon Rojo Fuego / Esmeralda / Platino / HeartGold*.

---

## 📊 Estado Actual del Proyecto (Lo Construido hasta Hoy)

* ✅ **Motor de Combate TypeScript:** Cálculos de daño oficiales Gen 9, tabla de tipos completa, Mega-Evolución y sistema Anti-OneShot en rutas tempranas.
* ✅ **Renderizador de Mapas con 5 Capas:** Terreno base, volumen y relieve 3D con acantilados sombreados, estructuras con sombras proyectadas, entidades Z-Sorted, oclusión aérea (*Canopy & Roofs*) y clima dinámico con ciclo Día/Noche.
* ✅ **Selector de Protagonista:** 4 arquetipos (*Hombre Joven Blanco, Mujer Joven Blanca, Hombre Joven Moreno, Mujer Joven Morena*) reflejados en el Overworld.
* ✅ **Ceremonia Inicial:** Elección de 27 iniciales (Generaciones 1 a 9) con el Prof. Ceibo y 1er combate nivel 5 contra el Rival Nahuel.
* ✅ **Locomoción Avanzada:** Caminar (150 px/s), Correr (`Shift`), Bicicleta (`B`) y Surf acuático (`SURF`).
* ✅ **Menús de Pausa y Vistas:** Pokédex interactiva con barras visuales de estadísticas, visualizador de equipo y mochila.
* ✅ **Efectos y Evolución:** Motor de partículas para 7 elementos y cinemática de evolución con cancelación por tecla `ESC`/`B`/`X`.
* ✅ **Mundo Exploratorio (8 Mapas):** Villa Tranquimar, Casa Prota, Lab Ceibo, Ruta 1, Pueblo Altiplano, Centro Pokémon, Gimnasio Altiplano, Ruta 2, Villa Yungas, Metrópolis Solsticio, Refugio de Adopción.

---

## 🚀 FASES DE DESARROLLO

---

### 🏥 FASE 1: Servicios Esenciales de Pueblo y Objetos en el Mapa
> **Objetivo:** Dar vida a los pueblos y rutas con los servicios clásicos de curación, compras y recompensas de exploración.

- [ ] **1.1. Centro Pokémon y Enfermera Joy Interactiva:**
  - Diálogo de bienvenida de Joy (*"¡Hola! Te damos la bienvenida al Centro Pokémon..."*).
  - Animación secuencial de curación: Las 6 Poké Balls se colocan en la máquina, parpadean con sonido característico (jingle de curación), y los PS/PP de todo el equipo se restauran al 100%.
- [ ] **1.2. Tienda Pokémon (*Poké Mart*):**
  - Mostrador de compras con dependiente.
  - Catálogo dinámico: *Poké Ball ($200), Super Ball ($600), Poción ($300), Superpoción ($700), Antídoto ($100), Cuerda Huida ($550)*.
  - Sistema de compra con selector de cantidad (`x1`, `x5`, `x10`), deducción de dinero y opción de venta de objetos.
- [ ] **1.3. Objetos en el Suelo (*Item Balls*):**
  - Sprites de Poké Balls rojas/doradas en rincones de las rutas y pueblos.
  - Al interactuar (`Espacio / Enter / Z`), el jugador recoge el objeto (*"¡Aria encontró una Poción!"*) y se suma al inventario de la mochila.
- [ ] **1.4. Carteles Informativos de Ruta y Lore:**
  - Lectura interactiva de señales de madera y placas de piedra con descripciones de rutas y consejos para entrenadores.

---

### ⚔️ FASE 2: Perfeccionamiento del Sistema de Combate
> **Objetivo:** Alcanzar el 100% de paridad con las opciones tácticas y animaciones de los combates oficiales.

- [ ] **2.1. Relevo de Pokémon en Combate (`PARTY`):**
  - Al seleccionar *POKÉMON* en batalla, abrir la pantalla de selección del equipo con estados y barras de salud.
  - Elegir a qué Pokémon enviar al campo de batalla consumiendo el turno del jugador y mostrando el texto y sprite de relevo.
- [ ] **2.2. Animación Completa de Captura con Poké Ball:**
  - Trayectoria parabólica de la Poké Ball lanzada hacia el Pokémon salvaje.
  - Absorción en destello de luz roja.
  - Secuencia de 1 a 3 rebotes/meneos en el suelo:
    - Si escapa: Se abre la Poké Ball con humo y el combate continúa.
    - Si se captura: Destello de estrellas, jingle de captura exitosa y registro automático en la Pokédex.
- [ ] **2.3. Barra de Experiencia Animada (EXP):**
  - Tras debilitar a un oponente, animación de llenado fluido de la barra azul de EXP.
  - Al completarse: Subida de nivel, recálculo de estadísticas con pantalla de aumento (+2 Ataque, +3 PS...) y comprobación de nuevos movimientos.
- [ ] **2.4. Pantalla de Aprendizaje / Olvido de Movimientos:**
  - Si un Pokémon ya conoce 4 movimientos y aprende uno nuevo por nivel, pantalla modal para seleccionar cuál olvidar o descartar el nuevo movimiento.

---

### 👁️ FASE 3: Visión de Entrenadores y 1er Gimnasio de Andara
> **Objetivo:** Introducir la emoción de los combates automáticos por visión y el primer gran desafío de medalla.

- [ ] **3.1. Detección por Línea de Visión (*Trainer Eyes Meet*):**
  - Los entrenadores NPC en rutas miran en una dirección fija o rotan periódicamente.
  - Si el jugador cruza su campo de visión (3 a 5 casillas frontales):
    - Aparece el icono de exclamación **`!`** sobre la cabeza del entrenador.
    - El entrenador camina automáticamente casilla por casilla hacia el jugador.
    - Suelta su diálogo desafiante y comienza el combate de entrenador.
- [ ] **3.2. Gimnasio de Pueblo Altiplano (Líder Rocío - Tipo Roca/Tierra):**
  - Interior del gimnasio con camino de adoquines, 2 entrenadores pupilos (*Montañero Bruno* y *Campista Lucas*).
  - Plataforma elevada con la **Líder Rocío**:
    - Equipo: *Geodude Nv. 12* y *Onix Nv. 14*.
    - Recompensa al vencer: **🏅 Medalla Cumbre** (permite usar Golpe Roca fuera de combate) y la **MT39 (Tumba Rocas)** + $1,800.

---

### 💾 FASE 4: PC de Almacenamiento y Ficha de Entrenador
> **Objetivo:** Gestión avanzada de Pokémon capturados y perfil completo del jugador.

- [ ] **4.1. Sistema de Cajas del PC de Almacenamiento:**
  - Terminal de PC en todos los Centros Pokémon (PC de Alguien / Prof. Ceibo).
  - Opciones:
    - *Depositar Pokémon:* Mover del equipo activo a la caja.
    - *Retirar Pokémon:* Mover de la caja al equipo activo (máx 6).
    - *Mover Pokémon:* Reorganizar libremente entre cajas 1 a 8.
  - Visualización de sprites en miniatura y datos de cada Pokémon almacenado.
- [ ] **4.2. Ficha de Entrenador (*Trainer Card*):**
  - Pantalla accesible desde el Menú de Pausa:
    - Retrato del avatar seleccionado.
    - Nombre del Entrenador, ID público y Dinero actual.
    - Tiempo de juego registrado.
    - Vitrina de las **8 Medallas de Gimnasio de Andara** con medallas iluminadas según los logros del jugador.

---

### 🌲 FASE 5: Expansión Geográfica y Readaptación de Biomas Emblemáticos
> **Objetivo:** Expandir la región de Andara con rutas laberínticas, cuevas, pasos de montaña y la trama del equipo rival.

- [ ] **5.1. Readaptación del Bosque Nublado de Yungas (Laberinto Frondoso):**
  - Inspirado en los grandes bosques clásicos (*Bosque Verde / Bosque Petalia*).
  - Senderos estrechos entre árboles milenarios, cazabichos, hierba alta densa con Pokémon de tipo Bicho/Planta (*Oddish, Scyther, Heracross, Bellsprout*).
- [ ] **5.2. Cueva del Cañón Solsticio (*Dungeon Clásico*):**
  - Inspirada en *Cueva Unión / Monte Moon*.
  - Mapas de varios niveles conectados por escaleras de roca, zonas oscuras iluminables con linterna, y Pokémon de tipo Tierra/Roca/Dragón (*Geodude, Machop, Rhyhorn, Gible*).
- [ ] **5.3. Introducción del Equipo Villano: *Team Eclipse*:**
  - Reclutas vestidos con uniformes estelares intentando extraer energía de los fósiles ancestrales de Andara.
  - Evento de rescate en la Cueva del Cañón para desbloquear el acceso a Metrópolis Solsticio.
- [ ] **5.4. Gimnasio 2 de Villa Yungas (Líder Thiago - Tipo Planta/Bicho):**
  - Gimnasio selvático con puzzles de lianas y hojas gigantes.
  - Equipo: *Grovyle Nv. 18*, *Scyther Nv. 20*.
  - Recompensa: **🏅 Medalla Selva** y **MT19 (Gigadrenado)**.

---

## 🎯 ORDEN DE EJECUCIÓN RECOMENDADO

1. **FASE 1:** Servicios del Centro Pokémon (Joy) + Tienda Poké Mart + Item Balls en el mapa.
2. **FASE 2:** Relevo en combate (`PARTY`), animación de captura de Poké Ball y barra de EXP.
3. **FASE 3:** Visión de entrenadores (`!`) y Combate del Gimnasio 1 contra Rocío con entrega de la Medalla Cumbre.
4. **FASE 4:** Cajas del PC de almacenamiento y Ficha de Entrenador.
5. **FASE 5:** Expansión del Cañón Solsticio, Team Eclipse y Gimnasio 2 de Yungas.
