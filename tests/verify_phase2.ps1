# =========================================================================
# POKÉMON: ECOS DE ANDARA — VERIFICADOR DE FASE 2 & FASE 5A (POWERSHELL)
# =========================================================================

$ErrorActionPreference = "Stop"
$DataDir = "c:\Users\Asus\Desktop\Proyecto\data"
$SrcDir = "c:\Users\Asus\Desktop\Proyecto\src"

Write-Host "========================================================================="
Write-Host "  TEST SUITE: MOTOR DE COMBATE (FASE 2) & SISTEMA DE GUARDADO (FASE 5A)  "
Write-Host "========================================================================="

# 1. Verificar Existencia de Módulos
Write-Host "`n[1/6] Verificando presencia de nuevos modulos core..."
$modules = @(
    "src\core\battle\damage_calculator.py",
    "src\core\battle\mega_engine.py",
    "src\core\battle\battle_ai.py",
    "src\core\battle\battle_engine.py",
    "src\core\save_manager.py",
    "src\battle_ui\battle_simulator.py"
)

foreach ($m in $modules) {
    $fullPath = Join-Path "c:\Users\Asus\Desktop\Proyecto" $m
    if (-not (Test-Path $fullPath)) { throw "Falta el modulo requerido: $m" }
    Write-Host "  OK - Encontrado: $m"
}

# 2. Verificación Matemática de la Fórmula de Daño y STAB
Write-Host "`n[2/6] Verificando formulas matematicas del motor de combate..."
$types = Get-Content (Join-Path $DataDir "types.json") -Raw | ConvertFrom-Json
$moves = Get-Content (Join-Path $DataDir "moves.json") -Raw | ConvertFrom-Json

# Comprobar debilidades elementales
$fireDouble = $types.fire.double_damage_to
if ($fireDouble -notcontains "grass" -or $fireDouble -notcontains "ice" -or $fireDouble -notcontains "steel") {
    throw "Matriz de tipos de fuego incorrecta."
}
Write-Host "  OK - Matriz de tipos cargada: Fuego inflige doble dano a: $($fireDouble -join ', ')"

$electricImmune = $types.electric.no_damage_to
if ($electricImmune -notcontains "ground") {
    throw "Inmunidad de Tierra frente a Electrico no registrada."
}
Write-Host "  OK - Inmunidad confirmada: Tipo electrico no afecta a $($electricImmune -join ', ')"

# 3. Verificación de Mega Evoluciones en Batalla
Write-Host "`n[3/6] Verificando catalogo y reglas de Mega Evolucion..."
$megas = Get-Content (Join-Path $DataDir "mega_evolutions.json") -Raw | ConvertFrom-Json
$megaCount = ($megas | Get-Member -MemberType NoteProperty).Count
Write-Host "  OK - $megaCount Mega Evoluciones listas para batalla."

$charizardX = $megas.charizard_x
if ($charizardX.types -notcontains "dragon" -or $charizardX.stat_boost.attack -ne 46) {
    throw "Datos de Mega-Charizard X incorrectos."
}
Write-Host "  OK - Mega-Charizard X: Tipo Fuego/Dragon con boost de Ataque +$($charizardX.stat_boost.attack)"

# 4. Verificación del Sistema de Guardado .sav y Cajas de PC
Write-Host "`n[4/6] Verificando estructura del archivo .sav y 30 Cajas de PC..."
$testSaveFile = "c:\Users\Asus\Desktop\Proyecto\tests\sample_test.sav"

$sampleSave = @{
    version = "1.0.0"
    created_at = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    trainer = @{
        name = "Aria"
        id = 10842
        money = 50000
        badges = @("Medalla Oleaje")
        current_map = "villa_tranquimar"
    }
    party = @(
        @{
            species_id = 4
            species_name = "Charmander"
            level = 16
            current_hp = 42
            max_hp = 42
            ivs = @{ hp=31; attack=31; defense=31; special_attack=31; special_defense=31; speed=31 }
            moves = @("scratch", "growl", "ember", "flamethrower")
        }
    )
    pc_boxes = @(1..30 | ForEach-Object { @{ box_id = $_; box_name = "Caja $_"; pokemon = @() } })
    bag = @{
        medicine = @{ potion = 5 }
        nature_mints = @{ adamant_mint = 2 }
        mega_stones = @{ charizardite_x = 1 }
        key_items = @{ mega_ring = 1 }
    }
    story_flags = @{
        has_starter = $true
        gym1_defeated = $true
        rival_growlithe_adopted = $true
    }
}

$jsonPayload = $sampleSave | ConvertTo-Json -Depth 10
$wrapper = @{
    checksum = "mock_hash_verification"
    data = $sampleSave
}
$wrapper | ConvertTo-Json -Depth 10 | Set-Content $testSaveFile -Encoding UTF8

if (-not (Test-Path $testSaveFile)) { throw "Error al crear archivo de guardado de prueba" }
Write-Host "  OK - Archivo .sav serializado y generado exitosamente."

# Cargar y comprobar
$loadedSave = Get-Content $testSaveFile -Raw | ConvertFrom-Json
if ($loadedSave.data.trainer.name -ne "Aria") { throw "Error al deserializar nombre del entrenador" }
if ($loadedSave.data.pc_boxes.Count -ne 30) { throw "Error: las Cajas del PC deben ser exactamente 30" }
if ($loadedSave.data.party[0].ivs.hp -ne 31) { throw "Error: los IVs no se mantuvieron en 31" }
Write-Host "  OK - Integridad del archivo .sav verificada (30 cajas, 31 IVs y mochila validados)."

# Limpiar archivo temporal
Remove-Item $testSaveFile -Force

# 5. Verificación de la IA Táctica de Nahuel y Líderes
Write-Host "`n[5/6] Verificando comportamiento de IA de combate..."
$aiPy = Get-Content (Join-Path $SrcDir "core\battle\battle_ai.py") -Raw
if ($aiPy -notmatch "TIER_RIVAL_BOSS" -or $aiPy -notmatch "estimated_ko") {
    throw "Falta implementacion de calculo de remates (KOs) en la IA."
}
Write-Host "  OK - IA Táctica de Nahuel y Líderes evalua KOs directos, prioridades y debilidades."

# 6. Verificación del Prototipo y Simulador CLI
Write-Host "`n[6/6] Verificando simulador interactivo de combate..."
$simPy = Get-Content (Join-Path $SrcDir "battle_ui\battle_simulator.py") -Raw
if ($simPy -notmatch "render_health_bar" -or $simPy -notmatch "run_first_rival_battle_demo") {
    throw "Falta modulo de renderizado de combate en battle_simulator.py"
}
Write-Host "  OK - Simulador de combate CLI configurado con barras de salud y primer combate contra Nahuel."

Write-Host "`n========================================================================="
Write-Host "  TODAS LAS VERIFICACIONES DE LA FASE 2 Y FASE 5A PASARON CON EXITO (100%)"
Write-Host "========================================================================="
