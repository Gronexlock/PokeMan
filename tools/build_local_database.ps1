# ============================================================
# POKÉMON: ECOS DE ANDARA — GENERADOR DE BASE DE DATOS LOCAL
# ============================================================
# Genera los archivos JSON de datos 100% offline para el motor.

$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { "c:\Users\Asus\Desktop\Proyecto\tools" }
$BaseDir = Split-Path -Parent $ScriptDir
$DataDir = Join-Path $BaseDir "data"
if (-not (Test-Path $DataDir)) { New-Item -ItemType Directory -Path $DataDir -Force | Out-Null }

Write-Host "=================================================="
Write-Host "⚡ GENERANDO BASE DE DATOS LOCAL (MODO OFFLINE)"
Write-Host "=================================================="

# 1. Tabla de Tipos Oficial (18 Tipos con debilidades, resistencias e inmunidades)
Write-Host "🔹 [1/5] Escribiendo data/types.json..."
$types = @{
    normal = @{
        double_damage_to = @()
        half_damage_to = @("rock", "steel")
        no_damage_to = @("ghost")
    }
    fire = @{
        double_damage_to = @("grass", "ice", "bug", "steel")
        half_damage_to = @("fire", "water", "rock", "dragon")
        no_damage_to = @()
    }
    water = @{
        double_damage_to = @("fire", "ground", "rock")
        half_damage_to = @("water", "grass", "dragon")
        no_damage_to = @()
    }
    grass = @{
        double_damage_to = @("water", "ground", "rock")
        half_damage_to = @("fire", "grass", "poison", "flying", "bug", "dragon", "steel")
        no_damage_to = @()
    }
    electric = @{
        double_damage_to = @("water", "flying")
        half_damage_to = @("electric", "grass", "dragon")
        no_damage_to = @("ground")
    }
    ice = @{
        double_damage_to = @("grass", "ground", "flying", "dragon")
        half_damage_to = @("fire", "water", "ice", "steel")
        no_damage_to = @()
    }
    fighting = @{
        double_damage_to = @("normal", "ice", "rock", "dark", "steel")
        half_damage_to = @("poison", "flying", "psychic", "bug", "fairy")
        no_damage_to = @("ghost")
    }
    poison = @{
        double_damage_to = @("grass", "fairy")
        half_damage_to = @("poison", "ground", "rock", "ghost")
        no_damage_to = @("steel")
    }
    ground = @{
        double_damage_to = @("fire", "electric", "poison", "rock", "steel")
        half_damage_to = @("grass", "bug")
        no_damage_to = @("flying")
    }
    flying = @{
        double_damage_to = @("grass", "fighting", "bug")
        half_damage_to = @("electric", "rock", "steel")
        no_damage_to = @()
    }
    psychic = @{
        double_damage_to = @("fighting", "poison")
        half_damage_to = @("psychic", "steel")
        no_damage_to = @("dark")
    }
    bug = @{
        double_damage_to = @("grass", "psychic", "dark")
        half_damage_to = @("fire", "fighting", "poison", "flying", "ghost", "steel", "fairy")
        no_damage_to = @()
    }
    rock = @{
        double_damage_to = @("fire", "ice", "flying", "bug")
        half_damage_to = @("fighting", "ground", "steel")
        no_damage_to = @()
    }
    ghost = @{
        double_damage_to = @("psychic", "ghost")
        half_damage_to = @("dark")
        no_damage_to = @("normal")
    }
    dragon = @{
        double_damage_to = @("dragon")
        half_damage_to = @("steel")
        no_damage_to = @("fairy")
    }
    steel = @{
        double_damage_to = @("ice", "rock", "fairy")
        half_damage_to = @("fire", "water", "electric", "steel")
        no_damage_to = @()
    }
    dark = @{
        double_damage_to = @("psychic", "ghost")
        half_damage_to = @("fighting", "dark", "fairy")
        no_damage_to = @()
    }
    fairy = @{
        double_damage_to = @("fighting", "dragon", "dark")
        half_damage_to = @("fire", "poison", "steel")
        no_damage_to = @()
    }
}
$types | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $DataDir "types.json") -Encoding UTF8
Write-Host "✔ data/types.json generado."

# 2. Catálogo de Mega Evoluciones
Write-Host "🔹 [2/5] Escribiendo data/mega_evolutions.json..."
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
Write-Host "✔ data/mega_evolutions.json generado."

# 3. Catálogo de Objetos e Inventario
Write-Host "🔹 [3/5] Escribiendo data/items.json..."
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
    maxrevive = @{ name = "Revivir Máximo"; category = "medicine"; price = 3000; revive_hp_percent = 1.0; desc = "Revive a un Pokémon debilitado restaurando el 100% de sus PS." }
    antidote = @{ name = "Antídoto"; category = "medicine"; price = 100; cure_status = "poison"; desc = "Cura el envenenamiento." }
    paralyzeheal = @{ name = "Antiparalizador"; category = "medicine"; price = 200; cure_status = "paralysis"; desc = "Cura la parálisis." }
    awakening = @{ name = "Despertar"; category = "medicine"; price = 250; cure_status = "sleep"; desc = "Despierta a un Pokémon dormido." }
    burnheal = @{ name = "Antiquemar"; category = "medicine"; price = 250; cure_status = "burn"; desc = "Cura las quemaduras." }
    iceheal = @{ name = "Antihielo"; category = "medicine"; price = 250; cure_status = "freeze"; desc = "Descongela a un Pokémon congelado." }
    fullheal = @{ name = "Cura Total"; category = "medicine"; price = 600; cure_status = "all"; desc = "Cura cualquier problema de estado alterado." }
    
    # Piedras Evolutivas
    fire_stone = @{ name = "Piedra Fuego"; category = "evolution_stones"; price = 3000; desc = "Piedra peculiar que hace evolucionar a ciertas especies de tipo Fuego." }
    water_stone = @{ name = "Piedra Agua"; category = "evolution_stones"; price = 3000; desc = "Piedra azulada que hace evolucionar a ciertas especies de tipo Agua." }
    thunder_stone = @{ name = "Piedra Trueno"; category = "evolution_stones"; price = 3000; desc = "Piedra con forma de rayo que hace evolucionar a ciertas especies eléctricas." }
    leaf_stone = @{ name = "Piedra Hoja"; category = "evolution_stones"; price = 3000; desc = "Piedra que hace evolucionar a ciertas especies de tipo Planta." }
    moon_stone = @{ name = "Piedra Lunar"; category = "evolution_stones"; price = 3000; desc = "Piedra negra como la noche que induce evolución." }
    sun_stone = @{ name = "Piedra Solar"; category = "evolution_stones"; price = 3000; desc = "Piedra brillante como el sol que induce evolución." }
    shiny_stone = @{ name = "Piedra Alba"; category = "evolution_stones"; price = 3500; desc = "Piedra que irradia una luz deslumbrante." }
    dusk_stone = @{ name = "Piedra Noche"; category = "evolution_stones"; price = 3500; desc = "Piedra oscura como las tinieblas." }
    dawn_stone = @{ name = "Piedra Alba"; category = "evolution_stones"; price = 3500; desc = "Piedra de brillo azul verdoso." }
    ice_stone = @{ name = "Piedra Hielo"; category = "evolution_stones"; price = 3500; desc = "Piedra fría como la escarcha." }

    # Materiales Evolutivos y Cordón Unión
    link_cable = @{ name = "Cordón Unión"; category = "evolution_items"; price = 5000; desc = "Cable que permite evolucionar a Pokémon que antes requerían intercambio." }
    metal_coat = @{ name = "Revestimiento Metálico"; category = "evolution_items"; price = 6000; desc = "Capa metálica para evolucionar a Onix o Scyther por uso directo." }
    kings_rock = @{ name = "Roca del Rey"; category = "evolution_items"; price = 6000; desc = "Corona ancestral para evolucionar a Slowpoke o Poliwhirl por uso directo." }
    dragon_scale = @{ name = "Escama Dragón"; category = "evolution_items"; price = 6000; desc = "Escama para evolucionar a Seadra por uso directo." }
    prism_scale = @{ name = "Escama Bella"; category = "evolution_items"; price = 6000; desc = "Escama brillante para evolucionar a Feebas por uso directo." }
    reaper_cloth = @{ name = "Tela Terrible"; category = "evolution_items"; price = 6000; desc = "Paño espiritual para evolucionar a Dusclops por uso directo." }
    protector = @{ name = "Protector"; category = "evolution_items"; price = 6000; desc = "Armadura pesada para evolucionar a Rhydon por uso directo." }
    electirizer = @{ name = "Electrizador"; category = "evolution_items"; price = 6000; desc = "Caja eléctrica para evolucionar a Electabuzz por uso directo." }
    magmarizer = @{ name = "Magmatizador"; category = "evolution_items"; price = 6000; desc = "Dispositivo volcánico para evolucionar a Magmar por uso directo." }
    upgrade = @{ name = "Mejora"; category = "evolution_items"; price = 5000; desc = "Disco de datos para evolucionar a Porygon por uso directo." }
    dubious_disc = @{ name = "Disco Extraño"; category = "evolution_items"; price = 5000; desc = "Disco corrupto para evolucionar a Porygon2 por uso directo." }
    razor_claw = @{ name = "Garra Afilada"; category = "evolution_items"; price = 5000; desc = "Garra para evolucionar a Sneasel por uso directo." }
    razor_fang = @{ name = "Colmillo Afilado"; category = "evolution_items"; price = 5000; desc = "Colmillo para evolucionar a Gligar por uso directo." }
    oval_stone = @{ name = "Piedra Oval"; category = "evolution_items"; price = 3000; desc = "Piedra suave para evolucionar a Happiny." }

    # Mega Piedras
    venusaurite = @{ name = "Venusaurita"; category = "mega_stones"; price = 35000; desc = "Piedra Mega para Venusaur." }
    charizardite_x = @{ name = "Charizardita X"; category = "mega_stones"; price = 35000; desc = "Piedra Mega para Mega-Charizard X." }
    charizardite_y = @{ name = "Charizardita Y"; category = "mega_stones"; price = 35000; desc = "Piedra Mega para Mega-Charizard Y." }
    blastoisinite = @{ name = "Blastoisita"; category = "mega_stones"; price = 35000; desc = "Piedra Mega para Blastoise." }
    alakazite = @{ name = "Alakazamita"; category = "mega_stones"; price = 40000; desc = "Piedra Mega para Alakazam." }
    gengarite = @{ name = "Gengarita"; category = "mega_stones"; price = 45000; desc = "Piedra Mega para Gengar." }
    scizorite = @{ name = "Scizorita"; category = "mega_stones"; price = 45000; desc = "Piedra Mega para Scizor." }
    tyranitarite = @{ name = "Tyranitarita"; category = "mega_stones"; price = 50000; desc = "Piedra Mega para Tyranitar." }
    salamencite = @{ name = "Salamencita"; category = "mega_stones"; price = 50000; desc = "Piedra Mega para Salamence." }
    metagrossite = @{ name = "Metagrossita"; category = "mega_stones"; price = 50000; desc = "Piedra Mega para Metagross." }
    garchompite = @{ name = "Garchompita"; category = "mega_stones"; price = 50000; desc = "Piedra Mega para Garchomp." }
    lucarionite = @{ name = "Lucarionita"; category = "mega_stones"; price = 45000; desc = "Piedra Mega para Lucario." }

    megaring = @{ name = "Mega-Aro de Andara"; category = "key_items"; price = 0; desc = "Pulsera ancestral que resuena con las Mega Piedras." }
    zygarde_cube = @{ name = "Arca de Zygarde"; category = "key_items"; price = 0; desc = "Artefacto para recolectar células y núcleos de Zygarde." }
}
$items | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $DataDir "items.json") -Encoding UTF8
Write-Host "✔ data/items.json generado."

# 4. Catálogo de Movimientos Clave
Write-Host "🔹 [4/5] Escribiendo data/moves.json..."
$moves = @{
    tackle = @{ name = "tackle"; display_name = "Placaje"; type = "normal"; power = 40; accuracy = 100; pp = 35; priority = 0; damage_class = "physical" }
    scratch = @{ name = "scratch"; display_name = "Arañazo"; type = "normal"; power = 40; accuracy = 100; pp = 35; priority = 0; damage_class = "physical" }
    growl = @{ name = "growl"; display_name = "Gruñido"; type = "normal"; power = $null; accuracy = 100; pp = 40; priority = 0; damage_class = "status" }
    leer = @{ name = "leer"; display_name = "Malicioso"; type = "normal"; power = $null; accuracy = 100; pp = 30; priority = 0; damage_class = "status" }
    ember = @{ name = "ember"; display_name = "Ascuas"; type = "fire"; power = 40; accuracy = 100; pp = 25; priority = 0; damage_class = "special" }
    flamethrower = @{ name = "flamethrower"; display_name = "Lanzallamas"; type = "fire"; power = 90; accuracy = 100; pp = 15; priority = 0; damage_class = "special" }
    fire_blast = @{ name = "fire-blast"; display_name = "Llamarada"; type = "fire"; power = 110; accuracy = 85; pp = 5; priority = 0; damage_class = "special" }
    water_gun = @{ name = "water-gun"; display_name = "Pistola Agua"; type = "water"; power = 40; accuracy = 100; pp = 25; priority = 0; damage_class = "special" }
    surf = @{ name = "surf"; display_name = "Surf"; type = "water"; power = 90; accuracy = 100; pp = 15; priority = 0; damage_class = "special" }
    hydro_pump = @{ name = "hydro-pump"; display_name = "Hidrobomba"; type = "water"; power = 110; accuracy = 80; pp = 5; priority = 0; damage_class = "special" }
    vine_whip = @{ name = "vine-whip"; display_name = "Látigo Cepa"; type = "grass"; power = 45; accuracy = 100; pp = 25; priority = 0; damage_class = "physical" }
    energy_ball = @{ name = "energy-ball"; display_name = "Energibola"; type = "grass"; power = 90; accuracy = 100; pp = 10; priority = 0; damage_class = "special" }
    solar_beam = @{ name = "solar-beam"; display_name = "Rayo Solar"; type = "grass"; power = 120; accuracy = 100; pp = 10; priority = 0; damage_class = "special" }
    thunder_shock = @{ name = "thunder-shock"; display_name = "Impactrueno"; type = "electric"; power = 40; accuracy = 100; pp = 30; priority = 0; damage_class = "special" }
    thunderbolt = @{ name = "thunderbolt"; display_name = "Rayo"; type = "electric"; power = 90; accuracy = 100; pp = 15; priority = 0; damage_class = "special" }
    thunder = @{ name = "thunder"; display_name = "Trueno"; type = "electric"; power = 110; accuracy = 70; pp = 10; priority = 0; damage_class = "special" }
    ice_beam = @{ name = "ice-beam"; display_name = "Rayo Hielo"; type = "ice"; power = 90; accuracy = 100; pp = 10; priority = 0; damage_class = "special" }
    blizzard = @{ name = "blizzard"; display_name = "Ventisca"; type = "ice"; power = 110; accuracy = 70; pp = 5; priority = 0; damage_class = "special" }
    earthquake = @{ name = "earthquake"; display_name = "Terremoto"; type = "ground"; power = 100; accuracy = 100; pp = 10; priority = 0; damage_class = "physical" }
    earth_power = @{ name = "earth-power"; display_name = "Tierra Viva"; type = "ground"; power = 90; accuracy = 100; pp = 10; priority = 0; damage_class = "special" }
    close_combat = @{ name = "close-combat"; display_name = "A Bocajarro"; type = "fighting"; power = 120; accuracy = 100; pp = 5; priority = 0; damage_class = "physical" }
    aura_sphere = @{ name = "aura-sphere"; display_name = "Esfera Aural"; type = "fighting"; power = 80; accuracy = 100; pp = 20; priority = 0; damage_class = "special" }
    psychic = @{ name = "psychic"; display_name = "Psíquico"; type = "psychic"; power = 90; accuracy = 100; pp = 10; priority = 0; damage_class = "special" }
    shadow_ball = @{ name = "shadow-ball"; display_name = "Bola Sombra"; type = "ghost"; power = 80; accuracy = 100; pp = 15; priority = 0; damage_class = "special" }
    dragon_claw = @{ name = "dragon-claw"; display_name = "Garra Dragón"; type = "dragon"; power = 80; accuracy = 100; pp = 15; priority = 0; damage_class = "physical" }
    draco_meteor = @{ name = "draco-meteor"; display_name = "Cometa Draco"; type = "dragon"; power = 130; accuracy = 90; pp = 5; priority = 0; damage_class = "special" }
    crunch = @{ name = "crunch"; display_name = "Triturar"; type = "dark"; power = 80; accuracy = 100; pp = 15; priority = 0; damage_class = "physical" }
    dark_pulse = @{ name = "dark-pulse"; display_name = "Pulso Umbrío"; type = "dark"; power = 80; accuracy = 100; pp = 15; priority = 0; damage_class = "special" }
    iron_head = @{ name = "iron-head"; display_name = "Cabeza de Hierro"; type = "steel"; power = 80; accuracy = 100; pp = 15; priority = 0; damage_class = "physical" }
    flash_cannon = @{ name = "flash-cannon"; display_name = "Foco Resplandor"; type = "steel"; power = 80; accuracy = 100; pp = 10; priority = 0; damage_class = "special" }
    moonblast = @{ name = "moonblast"; display_name = "Fuerza Lunar"; type = "fairy"; power = 95; accuracy = 100; pp = 15; priority = 0; damage_class = "special" }
    dazzling_gleam = @{ name = "dazzling-gleam"; display_name = "Brillo Mágico"; type = "fairy"; power = 80; accuracy = 100; pp = 10; priority = 0; damage_class = "special" }
    swords_dance = @{ name = "swords-dance"; display_name = "Danza Espada"; type = "normal"; power = $null; accuracy = 100; pp = 20; priority = 0; damage_class = "status" }
    dragon_dance = @{ name = "dragon-dance"; display_name = "Danza Dragón"; type = "dragon"; power = $null; accuracy = 100; pp = 20; priority = 0; damage_class = "status" }
    calm_mind = @{ name = "calm-mind"; display_name = "Paz Mental"; type = "psychic"; power = $null; accuracy = 100; pp = 20; priority = 0; damage_class = "status" }
    will_o_wisp = @{ name = "will-o-wisp"; display_name = "Fuego Fatuo"; type = "fire"; power = $null; accuracy = 85; pp = 15; priority = 0; damage_class = "status" }
    toxic = @{ name = "toxic"; display_name = "Tóxico"; type = "poison"; power = $null; accuracy = 90; pp = 10; priority = 0; damage_class = "status" }
    stealth_rock = @{ name = "stealth-rock"; display_name = "Trampa Rocas"; type = "rock"; power = $null; accuracy = 100; pp = 20; priority = 0; damage_class = "status" }
    bullet_punch = @{ name = "bullet-punch"; display_name = "Puño Bala"; type = "steel"; power = 40; accuracy = 100; pp = 30; priority = 1; damage_class = "physical" }
    extreme_speed = @{ name = "extreme-speed"; display_name = "Velocidad Extrema"; type = "normal"; power = 80; accuracy = 100; pp = 5; priority = 2; damage_class = "physical" }
}
$moves | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $DataDir "moves.json") -Encoding UTF8
Write-Host "✔ data/moves.json generado."

# 5. Muestra Fundamental de la Pokédex Regional (Especies Iniciales y Clave)
Write-Host "🔹 [5/5] Escribiendo data/pokedex.json..."
$pokedex = @{
    "1" = @{ id = 1; name = "Bulbasaur"; types = @("grass", "poison"); stats = @{ hp = 45; attack = 49; defense = 49; special_attack = 65; special_defense = 65; speed = 45 }; learnset = @(@{ move = "tackle"; level = 1 }, @{ move = "growl"; level = 1 }, @{ move = "vine_whip"; level = 3 }, @{ move = "energy_ball"; level = 20 }) }
    "4" = @{ id = 4; name = "Charmander"; types = @("fire"); stats = @{ hp = 39; attack = 52; defense = 43; special_attack = 60; special_defense = 50; speed = 65 }; learnset = @(@{ move = "scratch"; level = 1 }, @{ move = "growl"; level = 1 }, @{ move = "ember"; level = 4 }, @{ move = "flamethrower"; level = 24 }) }
    "7" = @{ id = 7; name = "Squirtle"; types = @("water"); stats = @{ hp = 44; attack = 48; defense = 65; special_attack = 50; special_defense = 64; speed = 43 }; learnset = @(@{ move = "tackle"; level = 1 }, @{ move = "leer"; level = 1 }, @{ move = "water_gun"; level = 3 }, @{ move = "surf"; level = 22 }) }
    "58" = @{ id = 58; name = "Growlithe"; types = @("fire"); stats = @{ hp = 55; attack = 70; defense = 45; special_attack = 70; special_defense = 50; speed = 60 }; learnset = @(@{ move = "scratch"; level = 1 }, @{ move = "ember"; level = 4 }, @{ move = "flamethrower"; level = 20 }, @{ move = "crunch"; level = 28 }) }
    "59" = @{ id = 59; name = "Arcanine"; types = @("fire"); stats = @{ hp = 90; attack = 110; defense = 80; special_attack = 100; special_defense = 80; speed = 95 }; learnset = @(@{ move = "flamethrower"; level = 1 }, @{ move = "extreme_speed"; level = 1 }, @{ move = "crunch"; level = 1 }, @{ move = "close_combat"; level = 34 }) }
    "252" = @{ id = 252; name = "Treecko"; types = @("grass"); stats = @{ hp = 40; attack = 45; defense = 35; special_attack = 65; special_defense = 55; speed = 70 }; learnset = @(@{ move = "scratch"; level = 1 }, @{ move = "vine_whip"; level = 3 }, @{ move = "energy_ball"; level = 21 }) }
    "255" = @{ id = 255; name = "Torchic"; types = @("fire"); stats = @{ hp = 45; attack = 60; defense = 40; special_attack = 70; special_defense = 50; speed = 45 }; learnset = @(@{ move = "scratch"; level = 1 }, @{ move = "ember"; level = 4 }, @{ move = "flamethrower"; level = 25 }) }
    "258" = @{ id = 258; name = "Mudkip"; types = @("water"); stats = @{ hp = 50; attack = 70; defense = 50; special_attack = 50; special_defense = 50; speed = 40 }; learnset = @(@{ move = "tackle"; level = 1 }, @{ move = "water_gun"; level = 3 }, @{ move = "surf"; level = 22 }, @{ move = "earthquake"; level = 30 }) }
    "443" = @{ id = 443; name = "Gible"; types = @("dragon", "ground"); stats = @{ hp = 58; attack = 70; defense = 45; special_attack = 40; special_defense = 45; speed = 42 }; learnset = @(@{ move = "tackle"; level = 1 }, @{ move = "dragon_claw"; level = 15 }, @{ move = "earthquake"; level = 28 }) }
    "445" = @{ id = 445; name = "Garchomp"; types = @("dragon", "ground"); stats = @{ hp = 108; attack = 130; defense = 95; special_attack = 80; special_defense = 85; speed = 102 }; learnset = @(@{ move = "dragon_claw"; level = 1 }, @{ move = "earthquake"; level = 1 }, @{ move = "swords_dance"; level = 1 }, @{ move = "crunch"; level = 1 }) }
    "447" = @{ id = 447; name = "Riolu"; types = @("fighting"); stats = @{ hp = 40; attack = 70; defense = 40; special_attack = 35; special_defense = 40; speed = 60 }; learnset = @(@{ move = "tackle"; level = 1 }, @{ move = "close_combat"; level = 25 }) }
    "448" = @{ id = 448; name = "Lucario"; types = @("fighting", "steel"); stats = @{ hp = 70; attack = 110; defense = 70; special_attack = 115; special_defense = 70; speed = 90 }; learnset = @(@{ move = "aura_sphere"; level = 1 }, @{ move = "close_combat"; level = 1 }, @{ move = "flash_cannon"; level = 1 }, @{ move = "extreme_speed"; level = 1 }) }
}
$pokedex | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $DataDir "pokedex.json") -Encoding UTF8
Write-Host "✔ data/pokedex.json generado."

Write-Host "`n🎉 ¡BASE DE DATOS LOCAL GENERADA CON ÉXITO EN data/!"
