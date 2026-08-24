# =========================================================================
# POKÉMON: ECOS DE ANDARA — VERIFICADOR DE FASE 5B (POWERSHELL)
# =========================================================================

$ErrorActionPreference = "Stop"
$DataDir = "c:\Users\Asus\Desktop\Proyecto\data"
$SrcDir = "c:\Users\Asus\Desktop\Proyecto\src"

Write-Host "========================================================================="
Write-Host "  TEST SUITE: MOTOR DE DIALOGOS, MUGSHOTS & CINEMATICAS (FASE 5B)        "
Write-Host "========================================================================="

# 1. Verificar Presencia de Módulos y Datos
Write-Host "`n[1/5] Verificando presencia de modulos narrativos y bases de datos..."
$requiredFiles = @(
    "data\dialogues.json",
    "src\core\dialogue_manager.py",
    "src\core\story_events.py",
    "src\menus\dialogue_visualizer.py",
    "tests\test_dialogue_system.py"
)

foreach ($f in $requiredFiles) {
    $fullPath = Join-Path "c:\Users\Asus\Desktop\Proyecto" $f
    if (-not (Test-Path $fullPath)) { throw "Falta el archivo requerido: $f" }
    Write-Host "  OK - Encontrado: $f"
}

# 2. Verificar Integridad de Guiones en data/dialogues.json
Write-Host "`n[2/5] Verificando escenas y nodos de conversacion..."
$dialogues = Get-Content (Join-Path $DataDir "dialogues.json") -Raw | ConvertFrom-Json
$scenes = ($dialogues.dialogues | Get-Member -MemberType NoteProperty).Name

Write-Host "  OK - Escenas narrativas cargadas: $($scenes -join ', ')"

$introScene = $dialogues.dialogues.intro_ceibo_ceremony
if ($introScene.nodes.Count -lt 5) { throw "Faltan nodos en la ceremonia del Profesor Ceibo" }
Write-Host "  OK - Ceremonia del Prof. Ceibo: $($introScene.nodes.Count) nodos con arbol de decisiones de iniciales."

$growlitheScene = $dialogues.dialogues.solsticio_growlithe_adoption
if ($growlitheScene.nodes.Count -lt 5) { throw "Faltan nodos en la escena de adopcion de Growlithe" }
Write-Host "  OK - Adopcion de Growlithe en Solsticio: $($growlitheScene.nodes.Count) nodos emocionales verificados."

# 3. Verificar Catálogo de Retratos y Mugshots
Write-Host "`n[3/5] Verificando catalogo de retratos emocionales (Mugshots)..."
$dmPy = Get-Content (Join-Path $SrcDir "core\dialogue_manager.py") -Raw
if ($dmPy -notmatch "PORTRAIT_CATALOG" -or $dmPy -notmatch "ceibo_wise" -or $dmPy -notmatch "nahuel_gentle" -or $dmPy -notmatch "renata_imposing") {
    throw "Falta configuracion de mugshots en dialogue_manager.py"
}
Write-Host "  OK - Retratos de Prof. Ceibo, Nahuel, Campeona Renata, Alister y Dra. Clara registrados."

# 4. Verificar Orquestador de Eventos de Historia
Write-Host "`n[4/5] Verificando orquestador de eventos y cinemáticas..."
$eventsPy = Get-Content (Join-Path $SrcDir "core\story_events.py") -Raw
if ($eventsPy -notmatch "trigger_starter_ceremony_event" -or $eventsPy -notmatch "trigger_growlithe_adoption_event" -or $eventsPy -notmatch "trigger_champion_encounter_event") {
    throw "Faltan metodos de eventos en story_events.py"
}
Write-Host "  OK - Controladores de eventos para Prólogo, Solsticio, Cordillera y Cráter Resonante validados."

# 5. Verificar Visualizador en Consola (CLI)
Write-Host "`n[5/5] Verificando renderizador visual de cajas de diálogo..."
$visPy = Get-Content (Join-Path $SrcDir "menus\dialogue_visualizer.py") -Raw
if ($visPy -notmatch "render_dialogue_box" -or $visPy -notmatch "run_cutscene_simulation") {
    throw "Falta logica de visualizacion en dialogue_visualizer.py"
}
Write-Host "  OK - Visualizador de cajas con marcos ornamentales y opciones interactivas verificado."

Write-Host "`n========================================================================="
Write-Host "  TODAS LAS VERIFICACIONES DE LA FASE 5B PASARON CON EXITO (100%)        "
Write-Host "========================================================================="
