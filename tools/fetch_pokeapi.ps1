# ============================================================
# POKÉMON: ECOS DE ANDARA — PIPELINE DE EXTRACCIÓN (POWERSHELL)
# ============================================================
# Descarga datos de tipos, movimientos, objetos, megaevoluciones
# y especies para modo 100% offline sin dependencias externas.

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ErrorActionPreference = "Continue"

$BaseDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Definition)
$DataDir = Join-Path $BaseDir "data"
$SpritesDir = Join-Path $BaseDir "assets\sprites\pokemon"

if (-not (Test-Path $DataDir)) { New-Item -ItemType Directory -Path $DataDir -Force | Out-Null }
if (-not (Test-Path $SpritesDir)) { New-Item -ItemType Directory -Path $SpritesDir -Force | Out-Null }

Write-Host "=================================================="
Write-Host "⚡ POKÉMON: ECOS DE ANDARA — PIPELINE DE DATOS (FASE 1)"
Write-Host "=================================================="

# 1. Tabla de Tipos
Write-Host "🔹 [1/5] Generando tabla de tipos y efectividades..."
$typesUrl = "https://pokeapi.co/api/v2/type"
try {
    $typesResp = Invoke-RestMethod -Uri $typesUrl -TimeoutSec 15
    $typeChart = @{}
    foreach ($t in $typesResp.results) {
        if ($t.name -eq "unknown" -or $t.name -eq "shadow") { continue }
        $tDetail = Invoke-RestMethod -Uri $t.url -TimeoutSec 15
        $dmg = $tDetail.damage_relations
        $typeChart[$t.name] = @{
            double_damage_to = @($dmg.double_damage_to | ForEach-Object { $_.name })
            half_damage_to = @($dmg.half_damage_to | ForEach-Object { $_.name })
            no_damage_to = @($dmg.no_damage_to | ForEach-Object { $_.name })
        }
    }
    $typeChart | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $DataDir "types.json") -Encoding UTF8
    Write-Host "✔ data/types.json generado correctamente."
} catch {
    Write-Host "⚠ Advertencia en tipos: $($_.Exception.Message)"
}

# 2. Mega Evoluciones
Write-Host "🔹 [2/5] Generando catálogo de Mega Evoluciones..."
$megas = @{
    venusaur = @{ mega_name = "Mega-Venusaur"; item = "Venusaurita"; types = @("grass", "poison"); ability = "Thick Fat"; stat_boost = @{ defense = 40; "special-attack" = 22; "special-defense" = 20; speed = 0 } }
    charizard_x = @{ mega_name = "Mega-Charizard X"; item = "Charizardita X"; types = @("fire", "dragon"); ability = "Tough Claws"; stat_boost = @{ attack = 46; defense = 33; "special-attack" = 21 } }
    charizard_y = @{ mega_name = "Mega-Charizard Y"; item = "Charizardita Y"; types = @("fire", "flying"); ability = "Drought"; stat_boost = @{ attack = 20; "special-attack" = 50; "special-defense" = 30 } }
    blastoise = @{ mega_name = "Mega-Blastoise"; item = "Blastoisita"; types = @("water"); ability = "Mega Launcher"; stat_boost = @{ attack = 20; defense = 20; "special-attack" = 50; "special-defense" = 10 } }
    beedrill = @{ mega_name = "Mega-Beedrill"; item = "Beedrillita"; types = @("bug", "poison"); ability = "Adaptability"; stat_boost = @{ attack = 60; speed = 70 } }
    pidgeot = @{ mega_name = "Mega-Pidgeot"; item = "Pidgeotita"; types = @("normal", "flying"); ability = "No Guard"; stat_boost = @{ "special-attack" = 65; speed = 20 } }
    alakazam = @{ mega_name = "Mega-Alakazam"; item = "Alakazamita"; types = @("psychic"); ability = "Trace"; stat_boost = @{ defense = 20; "special-attack" = 40; speed = 30 } }
    slowbro = @{ mega_name = "Mega-Slowbro"; item = "Slowbronita"; types = @("water", "psychic"); ability = "Shell Armor"; stat_boost = @{ defense = 70; "special-attack" = 30 } }
    gengar = @{ mega_name = "Mega-Gengar"; item = "Gengarita"; types = @("ghost", "poison"); ability = "Shadow Tag"; stat_boost = @{ "special-attack" = 40; "special-defense" = 20; speed = 20 } }
    gyarados = @{ mega_name = "Mega-Gyarados"; item = "Gyaradosita"; types = @("water", "dark"); ability = "Mold Breaker"; stat_boost = @{ attack = 30; defense = 30; "special-defense" = 30 } }
    ampharos = @{ mega_name = "Mega-Ampharos"; item = "Ampharosita"; types = @("electric", "dragon"); ability = "Mold Breaker"; stat_boost = @{ defense = 20; "special-attack" = 50; "special-defense" = 20 } }
    steelix = @{ mega_name = "Mega-Steelix"; item = "Steelixita"; types = @("steel", "ground"); ability = "Sand Force"; stat_boost = @{ attack = 40; defense = 30; "special-defense" = 30 } }
    scizor = @{ mega_name = "Mega-Scizor"; item = "Scizorita"; types = @("bug", "steel"); ability = "Technician"; stat_boost = @{ attack = 20; defense = 40; "special-defense" = 20 } }
    heracross = @{ mega_name = "Mega-Heracross"; item = "Heracrossita"; types = @("bug", "fighting"); ability = "Skill Link"; stat_boost = @{ attack = 60; defense = 40 } }
    houndoom = @{ mega_name = "Mega-Houndoom"; item = "Houndoomita"; types = @("dark", "fire"); ability = "Solar Power"; stat_boost = @{ defense = 40; "special-attack" = 30; speed = 20 } }
    tyranitar = @{ mega_name = "Mega-Tyranitar"; item = "Tyranitarita"; types = @("rock", "dark"); ability = "Sand Stream"; stat_boost = @{ attack = 30; defense = 40; "special-defense" = 20 } }
    sceptile = @{ mega_name = "Mega-Sceptile"; item = "Sceptilita"; types = @("grass", "dragon"); ability = "Lightning Rod"; stat_boost = @{ attack = 25; "special-attack" = 40; speed = 25 } }
    blaziken = @{ mega_name = "Mega-Blaziken"; item = "Blazikenita"; types = @("fire", "fighting"); ability = "Speed Boost"; stat_boost = @{ attack = 40; defense = 10; "special-attack" = 20; speed = 20 } }
    swampert = @{ mega_name = "Mega-Swampert"; item = "Swampertita"; types = @("water", "ground"); ability = "Swift Swim"; stat_boost = @{ attack = 40; defense = 20; "special-defense" = 20; speed = 10 } }
    gardevoir = @{ mega_name = "Mega-Gardevoir"; item = "Gardevoirita"; types = @("psychic", "fairy"); ability = "Pixilate"; stat_boost = @{ attack = 20; "special-attack" = 40; "special-defense" = 20; speed = 20 } }
    gallade = @{ mega_name = "Mega-Gallade"; item = "Galladita"; types = @("psychic", "fighting"); ability = "Inner Focus"; stat_boost = @{ attack = 40; defense = 30; speed = 30 } }
    sableye = @{ mega_name = "Mega-Sableye"; item = "Sableynita"; types = @("dark", "ghost"); ability = "Magic Bounce"; stat_boost = @{ defense = 50; "special-defense" = 50 } }
    salamence = @{ mega_name = "Mega-Salamence"; item = "Salamencita"; types = @("dragon", "flying"); ability = "Aerilate"; stat_boost = @{ attack = 10; defense = 50; "special-attack" = 10; "special-defense" = 10; speed = 20 } }
    metagross = @{ mega_name = "Mega-Metagross"; item = "Metagrossita"; types = @("steel", "psychic"); ability = "Tough Claws"; stat_boost = @{ attack = 10; defense = 20; "special-defense" = 20; speed = 40 } }
    garchomp = @{ mega_name = "Mega-Garchomp"; item = "Garchompita"; types = @("dragon", "ground"); ability = "Sand Force"; stat_boost = @{ attack = 40; defense = 20; "special-attack" = 40; "special-defense" = 10 } }
    lucario = @{ mega_name = "Mega-Lucario"; item = "Lucarionita"; types = @("fighting", "steel"); ability = "Adaptability"; stat_boost = @{ attack = 35; defense = 18; "special-attack" = 25; speed = 22 } }
    abomasnow = @{ mega_name = "Mega-Abomasnow"; item = "Abomasnowita"; types = @("grass", "ice"); ability = "Snow Warning"; stat_boost = @{ attack = 40; defense = 30; "special-attack" = 40; "special-defense" = 20 } }
    lopunny = @{ mega_name = "Mega-Lopunny"; item = "Lopunnita"; types = @("normal", "fighting"); ability = "Scrappy"; stat_boost = @{ attack = 60; defense = 10; speed = 30 } }
}
$megas | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $DataDir "mega_evolutions.json") -Encoding UTF8
Write-Host "✔ data/mega_evolutions.json generado correctamente."

# 3. Catálogo de Objetos
Write-Host "🔹 [3/5] Generando catálogo de objetos..."
$items = @{
    pokeball = @{ name = "Poké Ball"; category = "pokeballs"; price = 200; catch_rate = 1.0; desc = "Dispositivo esférico para capturar Pokémon silvestres." }
    greatball = @{ name = "Súper Ball"; category = "pokeballs"; price = 600; catch_rate = 1.5; desc = "Poké Ball con mayor ratio de captura." }
    ultraball = @{ name = "Ultra Ball"; category = "pokeballs"; price = 1200; catch_rate = 2.0; desc = "Poké Ball ultra eficaz para capturas difíciles." }
    safariball = @{ name = "Safari Ball"; category = "pokeballs"; price = 0; catch_rate = 1.5; desc = "Ball especial para la Reserva Ecológica de Andara." }
    potion = @{ name = "Poción"; category = "medicine"; price = 300; heal_hp = 20; desc = "Restaura 20 PS de un Pokémon." }
    superpotion = @{ name = "Superpoción"; category = "medicine"; price = 700; heal_hp = 50; desc = "Restaura 50 PS de un Pokémon." }
    hyperpotion = @{ name = "Hiperpoción"; category = "medicine"; price = 1200; heal_hp = 200; desc = "Restaura 200 PS de un Pokémon." }
    maxpotion = @{ name = "Poción Máxima"; category = "medicine"; price = 2500; heal_hp = 9999; desc = "Restaura todos los PS de un Pokémon." }
    revive = @{ name = "Revivir"; category = "medicine"; price = 1500; revive_hp_percent = 0.5; desc = "Revive a un Pokémon debilitado con la mitad de sus PS." }
    antidote = @{ name = "Antídoto"; category = "medicine"; price = 100; cure_status = "poison"; desc = "Cura el envenenamiento." }
    paralyzeheal = @{ name = "Antiparalizador"; category = "medicine"; price = 200; cure_status = "paralysis"; desc = "Cura la parálisis." }
    fullheal = @{ name = "Cura Total"; category = "medicine"; price = 600; cure_status = "all"; desc = "Cura cualquier problema de estado alterado." }
    megaring = @{ name = "Mega-Aro de Andara"; category = "key_items"; price = 0; desc = "Pulsera ancestral que resuena con las Mega Piedras." }
    zygarde_cube = @{ name = "Arca de Zygarde"; category = "key_items"; price = 0; desc = "Artefacto para recolectar células y núcleos de Zygarde." }
}
$items | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $DataDir "items.json") -Encoding UTF8
Write-Host "✔ data/items.json generado correctamente."

Write-Host "`n🎉 ¡Archivos base de tipos, megaevoluciones y objetos generados en data/!"
