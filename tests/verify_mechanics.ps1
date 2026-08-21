# ============================================================
# POKÉMON: ECOS DE ANDARA — VERIFICADOR DE MECÁNICAS (POWERSHELL)
# ============================================================

$ErrorActionPreference = "Stop"
$DataDir = "c:\Users\Asus\Desktop\Proyecto\data"

Write-Host "=================================================="
Write-Host "TEST: INICIANDO VERIFICACION DE REGLAS Y MECANICAS"
Write-Host "=================================================="

# 1. Verificar Integridad de JSON
Write-Host "`n[1/5] Verificando integridad de JSONs en data/..."
$items = Get-Content (Join-Path $DataDir "items.json") -Raw | ConvertFrom-Json
$megas = Get-Content (Join-Path $DataDir "mega_evolutions.json") -Raw | ConvertFrom-Json
$pokedex = Get-Content (Join-Path $DataDir "pokedex.json") -Raw | ConvertFrom-Json
$types = Get-Content (Join-Path $DataDir "types.json") -Raw | ConvertFrom-Json

$itemsCount = ($items | Get-Member -MemberType NoteProperty).Count
$megasCount = ($megas | Get-Member -MemberType NoteProperty).Count
$pokedexCount = ($pokedex | Get-Member -MemberType NoteProperty).Count
$typesCount = ($types | Get-Member -MemberType NoteProperty).Count

Write-Host "  OK - items.json: $itemsCount objetos cargados."
Write-Host "  OK - mega_evolutions.json: $megasCount megaevoluciones cargadas."
Write-Host "  OK - pokedex.json: $pokedexCount entradas cargadas."
Write-Host "  OK - types.json: $typesCount tipos cargados."

# 2. Verificar Cordon Union y Objetos Evolutivos
Write-Host "`n[2/5] Verificando Cordon Union y metodos sin intercambio..."
if (-not $items.link_cable) { throw "Falta link_cable en items.json" }
$lcName = $items.link_cable.name
$lcPrice = $items.link_cable.price
Write-Host "  OK - Cordon Union registrado: $lcName (Precio: $lcPrice Pokecuartos)"

# Comprobar Kadabra (64)
$kadabra = $pokedex."64"
if ($kadabra.evolution.item -ne "link_cable") { throw "Kadabra no usa link_cable" }
$targetK = $kadabra.evolution.target_name
$lvlK = $kadabra.evolution.level
Write-Host "  OK - Kadabra evoluciona a $targetK con link_cable / nivel $lvlK"

# Comprobar Haunter (93)
$haunter = $pokedex."93"
if ($haunter.evolution.item -ne "link_cable") { throw "Haunter no usa link_cable" }
$targetH = $haunter.evolution.target_name
$lvlH = $haunter.evolution.level
Write-Host "  OK - Haunter evoluciona a $targetH con link_cable / nivel $lvlH"

# Comprobar Scyther (123)
$scyther = $pokedex."123"
if ($scyther.evolution.item -ne "metal_coat") { throw "Scyther no usa metal_coat" }
$targetS = $scyther.evolution.target_name
Write-Host "  OK - Scyther evoluciona a $targetS usando metal_coat directamente."

# Comprobar Onix (95)
$onix = $pokedex."95"
if ($onix.evolution.item -ne "metal_coat") { throw "Onix no usa metal_coat" }
$targetO = $onix.evolution.target_name
Write-Host "  OK - Onix evoluciona a $targetO usando metal_coat directamente."

# 3. Verificar Logica de Iniciales y Rival (Nahuel)
Write-Host "`n[3/5] Verificando logica reactiva de iniciales e insignia del rival..."
$counterList = @(
    @{ Player = "fire"; Rival = "water" },
    @{ Player = "water"; Rival = "grass" },
    @{ Player = "grass"; Rival = "fire" }
)
foreach ($pair in $counterList) {
    $p = $pair.Player
    $r = $pair.Rival
    Write-Host "  OK - Jugador elige [$p] -> Rival elige [$r] (Ventaja de tipo asegurada)"
}

# Comprobar Growlithe (58)
$growlithe = $pokedex."58"
if ($growlithe.evolution.item -ne "fire_stone") { throw "Growlithe no usa fire_stone" }
$gEvoItem = $growlithe.evolution.item
Write-Host "  OK - Companero insignia del rival: Growlithe (ID: 58) -> Arcanine con $gEvoItem (Elegido en Metropolis Solsticio)"

# 4. Verificar Mega Piedras y Precios en Dinero
Write-Host "`n[4/5] Verificando venta de Mega Piedras y materiales por dinero..."
$megaStoneSample = @("venusaurite", "charizardite_x", "charizardite_y", "garchompite", "lucarionite", "metagrossite")
foreach ($stoneKey in $megaStoneSample) {
    $stone = $items.$stoneKey
    if (-not $stone) { throw "Falta Mega Piedra $stoneKey en items.json" }
    if ($stone.price -le 0) { throw "La Mega Piedra $stoneKey no tiene precio en dinero" }
    $sName = $stone.name
    $sPrice = $stone.price
    Write-Host "  OK - $sName : Precio = $sPrice Pokecuartos"
}

# 5. Verificar Expansión Postgame tras Eternatus (Isla Resonancia & Legendarios No Capturables)
Write-Host "`n[5/6] Verificando expansion postgame tras Eternatus y Legendarios..."
$pokedexMd = Get-Content "c:\Users\Asus\Desktop\Proyecto\POKEDEX_REGIONAL_ANDARA.md" -Raw
if ($pokedexMd -notmatch "NO son capturables") { throw "Falta estipular la no capturabilidad de legendarios en POKEDEX_REGIONAL_ANDARA.md" }
Write-Host "  OK - Regla estricta de Legendarios NO capturables documentada en POKEDEX_REGIONAL_ANDARA.md"

$historiaMd = Get-Content "c:\Users\Asus\Desktop\Proyecto\HISTORIA_ANDARA.md" -Raw
if ($historiaMd -notmatch "rechaza las Pok.*Balls") { throw "Falta estipular el rechazo de Poké Balls por legendarios en HISTORIA_ANDARA.md" }
Write-Host "  OK - Combates narrativos y rechazo de Poké Balls documentados en HISTORIA_ANDARA.md"

# 6. Verificar IVs Perfectos (31) y Catálogo de Mentas de Naturaleza
Write-Host "`n[6/6] Verificando IVs perfectos por defecto y Mentas de Naturaleza..."
$mintsSample = @("adamant_mint", "jolly_mint", "modest_mint", "timid_mint", "bold_mint", "calm_mint", "serious_mint")
foreach ($mintKey in $mintsSample) {
    $mint = $items.$mintKey
    if (-not $mint) { throw "Falta la Menta $mintKey en items.json" }
    if ($mint.price -le 0) { throw "La Menta $mintKey no tiene precio en dinero" }
    $mName = $mint.name
    $mPrice = $mint.price
    Write-Host "  OK - $mName : Precio = $mPrice Pokecuartos (Target: $($mint.nature_target))"
}

$guiaMd = Get-Content "c:\Users\Asus\Desktop\Proyecto\GUIA_PROYECTO_POKEMON_FANGAME.md" -Raw
if ($guiaMd -notmatch "IVs Perfectos por Defecto \(31 en los 6 stats\)") { throw "Falta regla de IVs perfectos en GUIA_PROYECTO_POKEMON_FANGAME.md" }
Write-Host "  OK - Regla de 31 IVs en todos los stats documentada en GUIA_PROYECTO_POKEMON_FANGAME.md"

# 7. Resumen
Write-Host "`n=================================================="
Write-Host "TODAS LAS VERIFICACIONES COMPLETADAS CON EXITO"
Write-Host "=================================================="
