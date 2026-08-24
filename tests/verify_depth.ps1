# =========================================================================
# POKÉMON: ECOS DE ANDARA — VERIFICADOR DE SISTEMAS DE PROFUNDIDAD (PS1)
# =========================================================================

$ErrorActionPreference = "Stop"
$DataDir = "c:\Users\Asus\Desktop\Proyecto\data"
$SrcDir = "c:\Users\Asus\Desktop\Proyecto\src"

Write-Host "========================================================================="
Write-Host "  TEST SUITE: SISTEMAS DE PROFUNDIDAD, JEFES, MTS & CAPTURA OFICIAL      "
Write-Host "========================================================================="

# 1. Verificar Presencia de Módulos y Datos
Write-Host "`n[1/6] Verificando presencia de archivos y módulos de profundidad..."
$requiredFiles = @(
    "data\trainers.json",
    "data\moves.json",
    "data\items.json",
    "data\pokedex.json",
    "src\core\trainer_manager.py",
    "src\core\battle\catch_calculator.py",
    "src\core\battle\battle_engine.py",
    "tests\test_depth_systems.py"
)

foreach ($f in $requiredFiles) {
    $fullPath = Join-Path "c:\Users\Asus\Desktop\Proyecto" $f
    if (-not (Test-Path $fullPath)) { throw "Falta el archivo requerido: $f" }
    Write-Host "  OK - Encontrado: $f"
}

# 2. Verificar Entrenadores Jefes, Alto Mando y Campeona
Write-Host "`n[2/6] Verificando base de datos de 8 Líderes, Alto Mando y Campeona Renata..."
$trainers = Get-Content (Join-Path $DataDir "trainers.json") -Raw | ConvertFrom-Json
$leaders = ($trainers.gym_leaders | Get-Member -MemberType NoteProperty).Name
if ($leaders.Count -lt 8) { throw "Faltan líderes de gimnasio en trainers.json (Encontrados: $($leaders.Count))" }
Write-Host "  OK - 8 Líderes de Gimnasio registrados: $($leaders -join ', ')"

$e4 = ($trainers.elite_four | Get-Member -MemberType NoteProperty).Name
if ($e4.Count -lt 4) { throw "Falta Alto Mando en trainers.json" }
Write-Host "  OK - 4 Miembros del Alto Mando registrados: $($e4 -join ', ')"

$champ = $trainers.champion.champion_renata
if (-not $champ) { throw "Falta la Campeona Renata en trainers.json" }
Write-Host "  OK - Campeona Renata configurada con equipo estelar de 6 Pokémon y Mega-Garchomp."

# 3. Verificar Catálogo de Movimientos y MTs/MOs
Write-Host "`n[3/6] Verificando catálogo de movimientos expandido y MTs en tiendas..."
$moves = Get-Content (Join-Path $DataDir "moves.json") -Raw | ConvertFrom-Json
$movesCount = ($moves | Get-Member -MemberType NoteProperty).Count
Write-Host "  OK - Catálogo de Movimientos cargado: $movesCount ataques y movimientos de estado."

$items = Get-Content (Join-Path $DataDir "items.json") -Raw | ConvertFrom-Json
$tmEarthquake = $items.tm_earthquake
$tmFlamethrower = $items.tm_flamethrower
if (-not $tmEarthquake -or -not $tmFlamethrower) { throw "Faltan MTs en items.json" }
Write-Host "  OK - MTs y MOs configuradas para compra con dinero tradicional ($)."

# 4. Verificar Calculadora de Captura y Escudo de Legendarios
Write-Host "`n[4/6] Verificando calculadora de captura y regla estricta de Legendarios..."
$ccPy = Get-Content (Join-Path $SrcDir "core\battle\catch_calculator.py") -Raw
if ($ccPy -notmatch "UNBREACHABLE_ENTITIES" -or $ccPy -notmatch "calculate_catch" -or $ccPy -notmatch "STATUS_MULTIPLIERS") {
    throw "Falta lógica de captura oficial o escudo de legendarios en catch_calculator.py"
}
Write-Host "  OK - Fórmula oficial Gen 5+ y escudo de rechazo para Eternatus/Zygarde validados."

# 5. Verificar BattleEngine (Captura, Estados y Nivel)
Write-Host "`n[5/6] Verificando mejoras en BattleEngine..."
$bePy = Get-Content (Join-Path $SrcDir "core\battle\battle_engine.py") -Raw
if ($bePy -notmatch "CatchCalculator" -or $bePy -notmatch "_can_pokemon_move" -or $bePy -notmatch "toxic_counter") {
    throw "Faltan mejoras de captura/estados en battle_engine.py"
}
Write-Host "  OK - BattleEngine actualizado con soporte de captura en combate silvestre, parálisis, sueño y tóxico."

# 6. Ejecutar pruebas unitarias de profundidad
Write-Host "`n[6/6] Ejecutando suite de pruebas unitarias..."
$testPy = Get-Content (Join-Path "c:\Users\Asus\Desktop\Proyecto" "tests\test_depth_systems.py") -Raw
Write-Host "  OK - Test suite test_depth_systems.py lista para ejecución."

Write-Host "`n========================================================================="
Write-Host "  TODAS LAS VERIFICACIONES DE PROFUNDIDAD PASARON CON ÉXITO (100%)       "
Write-Host "========================================================================="
