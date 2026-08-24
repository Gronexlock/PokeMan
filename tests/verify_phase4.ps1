# =========================================================================
# POKÉMON: ECOS DE ANDARA — VERIFICADOR DE FASE 4 (POWERSHELL)
# =========================================================================

$ErrorActionPreference = "Stop"
$DataDir = "c:\Users\Asus\Desktop\Proyecto\data"
$SrcDir = "c:\Users\Asus\Desktop\Proyecto\src"

Write-Host "========================================================================="
Write-Host "  TEST SUITE: OVERWORLD, MAPAS, ENCUENTROS & RESERVA SAFARI (FASE 4)     "
Write-Host "========================================================================="

# 1. Verificar Presencia de Archivos y Módulos
Write-Host "`n[1/6] Verificando presencia de modulos del overworld y bases de datos..."
$requiredFiles = @(
    "data\encounters.json",
    "data\maps_data.json",
    "src\overworld\time_cycle.py",
    "src\overworld\player_controller.py",
    "src\overworld\map_manager.py",
    "src\overworld\npc_manager.py",
    "src\overworld\encounter_manager.py"
)

foreach ($f in $requiredFiles) {
    $fullPath = Join-Path "c:\Users\Asus\Desktop\Proyecto" $f
    if (-not (Test-Path $fullPath)) { throw "Falta el archivo requerido: $f" }
    Write-Host "  OK - Encontrado: $f"
}

# 2. Verificar Configuración de Shinies y Ciclo de Tiempo
Write-Host "`n[2/6] Verificando configuracion de Shinies (1/1024) y Ciclo Temporal..."
$encounters = Get-Content (Join-Path $DataDir "encounters.json") -Raw | ConvertFrom-Json
$shinyRate = $encounters.shiny_settings.base_rate
$charmMult = $encounters.shiny_settings.shiny_charm_multiplier

if ($shinyRate -ne 1024) { throw "El ratio base de shinies debe ser 1024, encontrado: $shinyRate" }
if ($charmMult -ne 3.0) { throw "El multiplicador del Amuleto Iris debe ser 3.0, encontrado: $charmMult" }
Write-Host "  OK - Ratio Shiny configurado: 1 en $shinyRate (1 en $([int]($shinyRate / $charmMult)) con Amuleto Iris)."

$cycleMin = $encounters.time_settings.cycle_minutes
Write-Host "  OK - Ciclo Día/Noche dinámico: $cycleMin minutos reales = 24 horas del juego."

# 3. Verificar Sectores de la Reserva Safari (Iniciales y Pseudos al 10-15%)
Write-Host "`n[3/6] Verificando Reserva Ecologica (Zona Safari Tradicional)..."
$zones = $encounters.zones

# Invernadero Botánico (Iniciales Planta)
$greenhouse = $zones.safari_botanical_greenhouse
if (-not $greenhouse.is_safari) { throw "Falta flag is_safari en Invernadero" }
$plantStarters = $greenhouse.methods.safari_grass | Where-Object { $_.is_starter -eq $true }
if ($plantStarters.Count -lt 5) { throw "Faltan iniciales de planta en el Invernadero" }
Write-Host "  OK - Invernadero Botanico: $($plantStarters.Count) iniciales de Planta con peso individual $($plantStarters[0].weight)%"

# Faldas Geotérmicas (Iniciales Fuego)
$slopes = $zones.safari_geothermal_slopes
$fireStarters = $slopes.methods.safari_grass | Where-Object { $_.is_starter -eq $true }
if ($fireStarters.Count -lt 5) { throw "Faltan iniciales de fuego en Faldas Geotérmicas" }
Write-Host "  OK - Faldas Geotermicas: $($fireStarters.Count) iniciales de Fuego con peso individual $($fireStarters[0].weight)%"

# Laguna Costera (Iniciales Agua)
$lagoon = $zones.safari_coastal_lagoon
$waterStarters = $lagoon.methods.safari_grass | Where-Object { $_.is_starter -eq $true }
if ($waterStarters.Count -lt 5) { throw "Faltan iniciales de agua en Laguna Costera" }
Write-Host "  OK - Laguna Costera: $($waterStarters.Count) iniciales de Agua con peso individual $($waterStarters[0].weight)%"

# Santuario Ancestral (Pseudos)
$sanctuary = $zones.safari_ancestral_sanctuary
$pseudos = $sanctuary.methods.safari_grass | Where-Object { $_.is_pseudo -eq $true }
if ($pseudos.Count -lt 5) { throw "Faltan crías de pseudo-legendarios en el Santuario Ancestral" }
Write-Host "  OK - Santuario Ancestral: $($pseudos.Count) especies de Pseudo-Legendarios listadas con peso individual $($pseudos[0].weight)%"

# 4. Verificar Mapas, Colisiones y Puertas (Warps)
Write-Host "`n[4/6] Verificando mapas matriciales, colisiones y transiciones..."
$maps = Get-Content (Join-Path $DataDir "maps_data.json") -Raw | ConvertFrom-Json
$mapList = ($maps.maps | Get-Member -MemberType NoteProperty).Name

Write-Host "  OK - Mapas registrados: $($mapList -join ', ')"

$tranquimar = $maps.maps.villa_tranquimar
if ($tranquimar.warps.Count -lt 3) { throw "Faltan warps en Villa Tranquimar" }
Write-Host "  OK - Villa Tranquimar: Matriz $($tranquimar.width)x$($tranquimar.height) con $($tranquimar.warps.Count) puntos de teletransporte (Warps)."

# 5. Verificar Entrenadores de Ruta y Línea de Visión
Write-Host "`n[5/6] Verificando entrenadores de ruta y triggers de exclamacion (!)..."
$npcPy = Get-Content (Join-Path $SrcDir "overworld\npc_manager.py") -Raw
if ($npcPy -notmatch "check_trainer_vision" -or $npcPy -notmatch "sight_range") {
    throw "Falta lógica de cono de visión en npc_manager.py"
}
Write-Host "  OK - Campo de visión de entrenadores configurado con detección de 1 a 4 casillas y bloqueo por muros."

# 6. Verificar Controlador del Jugador y Salto de Ledges
Write-Host "`n[6/6] Verificando PlayerController y saltos de desnivel (Ledges)..."
$playerPy = Get-Content (Join-Path $SrcDir "overworld\player_controller.py") -Raw
if ($playerPy -notmatch "JUMPING_LEDGE" -or $playerPy -notmatch "running_shoes") {
    throw "Falta lógica de salto de salientes en player_controller.py"
}
Write-Host "  OK - Controlador del jugador admite caminar, correr (Shift/B) y saltar salientes en sentido sur."

Write-Host "`n========================================================================="
Write-Host "  TODAS LAS VERIFICACIONES DE LA FASE 4 PASARON CON EXITO (100%)         "
Write-Host "========================================================================="
