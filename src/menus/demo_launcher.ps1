# =========================================================================
# POKÉMON: ECOS DE ANDARA — LANZADOR INTERACTIVO NATIVO DE POWERSHELL
# =========================================================================

$Host.UI.RawUI.WindowTitle = "Pokemon: Ecos de Andara - Edicion HD-2.5D"
Clear-Host

while ($true) {
    Clear-Host
    Write-Host " ╔═════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host " ║                                                                         ║" -ForegroundColor Cyan
    Write-Host " ║    ██████╗  ██████╗ ██╗  ██╗███████╗███╗   ███╗ ██████╗ ███╗   ██╗      ║" -ForegroundColor Cyan
    Write-Host " ║    ██╔══██╗██╔═══██╗██║ ██╔╝██╔════╝████╗ ████║██╔═══██╗████╗  ██║      ║" -ForegroundColor Cyan
    Write-Host " ║    ██████╔╝██║   ██║█████╔╝ █████╗  ██╔████╔██║██║   ██║██╔██╗ ██║      ║" -ForegroundColor Cyan
    Write-Host " ║    ██╔═══╝ ██║   ██║██╔═██╗ ██╔══╝  ██║╚██╔╝██║██║   ██║██║╚██╗██║      ║" -ForegroundColor Cyan
    Write-Host " ║    ██║     ╚██████╔╝██║  ██╗███████╗██║ ╚═╝ ██║╚██████╔╝██║ ╚████║      ║" -ForegroundColor Cyan
    Write-Host " ║    ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝      ║" -ForegroundColor Cyan
    Write-Host " ║                                                                         ║" -ForegroundColor Cyan
    Write-Host " ║                   ✨  E C O S   D E   A N D A R A  ✨                   ║" -ForegroundColor Yellow
    Write-Host " ║                    [ Edición HD-2.5D — Motor Offline ]                  ║" -ForegroundColor White
    Write-Host " ║                                                                         ║" -ForegroundColor Cyan
    Write-Host " ╠═════════════════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
    Write-Host " ║                                                                         ║" -ForegroundColor Cyan
    Write-Host " ║     [1] NUEVA PARTIDA (Prologo, Overworld 2.5D y Nahuel)                ║" -ForegroundColor Green
    Write-Host " ║     [2] SIMULADOR DE COMBATE (Mega-Charizard vs Mega-Blastoise)         ║" -ForegroundColor Magenta
    Write-Host " ║     [3] CINEMATICAS Y MUGSHOTS (Prof. Ceibo, Renata y Growlithe)        ║" -ForegroundColor Yellow
    Write-Host " ║     [4] CONFIGURACION Y REGLAS REGIONALES (31 IVs, Mentas, Tiendas)     ║" -ForegroundColor White
    Write-Host " ║     [5] SALIR                                                           ║" -ForegroundColor Red
    Write-Host " ║                                                                         ║" -ForegroundColor Cyan
    Write-Host " ╚═════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""

    $opt = Read-Host "Selecciona una opcion (1-5)"

    if ($opt -eq "1") {
        Clear-Host
        Write-Host "=========================================================================" -ForegroundColor Yellow
        Write-Host "                PROLOGO Y CEREMONIA EN VILLA TRANQUIMAR                  " -ForegroundColor Yellow
        Write-Host "=========================================================================" -ForegroundColor Yellow
        Write-Host ""
        $pname = Read-Host "Ingresa el nombre de tu personaje [Por defecto: Aria]"
        if (-not $pname) { $pname = "Aria" }

        Write-Host ""
        Write-Host "Elige tu Pokemon Inicial:" -ForegroundColor Green
        Write-Host " [1] Bulbasaur (Planta/Veneno)"
        Write-Host " [2] Charmander (Fuego)"
        Write-Host " [3] Squirtle (Agua)"
        $st = Read-Host "Selecciona (1-3) [Por defecto: 2]"

        $starterName = "Charmander"
        $rivalStarter = "Squirtle"
        if ($st -eq "1") { $starterName = "Bulbasaur"; $rivalStarter = "Charmander" }
        elseif ($st -eq "3") { $starterName = "Squirtle"; $rivalStarter = "Bulbasaur" }

        Write-Host ""
        Write-Host "Prof. Ceibo: 'Excelente eleccion, $pname! Cuida bien de $starterName.'" -ForegroundColor White
        Write-Host "Nahuel: 'Entonces yo elijo a $rivalStarter! Preparate para nuestro primer combate en el muelle!'" -ForegroundColor Yellow
        Write-Host ""

        Write-Host "-------------------------------------------------------------------------"
        Write-Host "VISTA 2.5D DE VILLA TRANQUIMAR (Amanecer Dorado):" -ForegroundColor Cyan
        Write-Host " ╔══════════════════ [Villa Tranquimar | Amanecer Dorado] ══════════════════╗"
        Write-Host " ║  🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲  ║"
        Write-Host " ║  🌲 .  .  .  . 🌿🌿🌿 .  . 🌲  ║"
        Write-Host " ║  🌲 .  🏠 .  . 🌿🌿🌿 .  . 🌲  ║"
        Write-Host " ║  🌲 .  .  .  🧑‍🦱⬇️  .  .  .  . 🌲  ║"
        Write-Host " ║  🌲 .  .  🤠  .  .  .  .  . 🌲  ║"
        Write-Host " ║  🌲 .  .  .  .  .  .  .  . 🌲  ║"
        Write-Host " ║  🌲🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌲  ║"
        Write-Host " ╚════════════════════════════════════════════════════════════════════════════╝"
        Write-Host ""
        Write-Host "ESCENARIO DE COMBATE PARALLAX CONTRA NAHUEL:" -ForegroundColor Magenta
        Write-Host " ╔════════════════════════════════════════════════════════════════════════╗"
        Write-Host " ║  [CIELO AMANECER: Luz dorada sobre la cordillera andina]               ║"
        Write-Host " ║      /\  /\/\    /\  /\/\    /\  /\/\  [Cordillera de Andara]          ║"
        Write-Host " ║                                                                        ║"
        Write-Host " ║                            $rivalStarter  Nv. 5                        ║"
        Write-Host " ║                            PS: [████████████████████] 20/20            ║"
        Write-Host " ║                                                                        ║"
        Write-Host " ║     [TU POSICION]                         [PLATAFORMA RIVAL]           ║"
        Write-Host " ║       🧑‍🦱 (Entrenador)                      👾 $rivalStarter                  ║"
        Write-Host " ║                                                                        ║"
        Write-Host " ║  $starterName  Nv. 5                                                   ║"
        Write-Host " ║  PS: [████████████████████] 20/20                                      ║"
        Write-Host " ╠════════════════════════════════════════════════════════════════════════╣"
        Write-Host " ║  [1] LUCHAR          [2] MOCHILA         [3] POKEMON         [4] HUIR  ║"
        Write-Host " ╚════════════════════════════════════════════════════════════════════════╝"
        Write-Host ""
        Read-Host "Presiona ENTER para volver al Menu Principal"
    }
    elseif ($opt -eq "2") {
        Clear-Host
        Write-Host "=========================================================================" -ForegroundColor Magenta
        Write-Host "               DUELO CLIMAX: MEGA-CHARIZARD X VS MEGA-BLASTOISE          " -ForegroundColor Magenta
        Write-Host "=========================================================================" -ForegroundColor Magenta
        Write-Host ""
        Write-Host "El Mega-Aro de Aria resuena con la Charizardita X!" -ForegroundColor Yellow
        Write-Host "Charizard megaevoluciona a Mega-Charizard X! (Tipo Fuego/Dragon | +100 BST)" -ForegroundColor Cyan
        Write-Host "Mega-Charizard X usa Garra Dragon!" -ForegroundColor Green
        Write-Host "Impacto demoledor! Dano masivo infligido a Mega-Blastoise!" -ForegroundColor Red
        Write-Host ""
        Read-Host "Presiona ENTER para volver al Menu Principal"
    }
    elseif ($opt -eq "3") {
        Clear-Host
        Write-Host "=========================================================================" -ForegroundColor Green
        Write-Host "                      CINEMATICAS Y MUGSHOTS                             " -ForegroundColor Green
        Write-Host "=========================================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host " ╔═════════════════════════════════════════════════════════════════════════╗"
        Write-Host " ║ [PROF. CEIBO - Expresion: Sabio]                                        ║"
        Write-Host " ║ 'Andara es una tierra donde la resonancia de las Mega Piedras brota     ║"
        Write-Host " ║  desde las raices del mundo. Vuestro viaje apenas comienza...'          ║"
        Write-Host " ╚═════════════════════════════════════════════════════════════════════════╝"
        Write-Host ""
        Write-Host " ╔═════════════════════════════════════════════════════════════════════════╗"
        Write-Host " ║ [RIVAL NAHUEL - Expresion: Desafiante]                                  ║"
        Write-Host " ║ 'No pienso quedarme atras! En Solsticio encontraremos las respuestas,   ║"
        Write-Host " ║  y cuando llegue el momento, te demostrare quien es el mejor!'          ║"
        Write-Host " ╚═════════════════════════════════════════════════════════════════════════╝"
        Write-Host ""
        Read-Host "Presiona ENTER para volver al Menu Principal"
    }
    elseif ($opt -eq "4") {
        Clear-Host
        Write-Host "=========================================================================" -ForegroundColor Yellow
        Write-Host "                CONFIGURACION Y REGLAS REGIONALES                        " -ForegroundColor Yellow
        Write-Host "=========================================================================" -ForegroundColor Yellow
        Write-Host " - IVs Competitivos: 31 IVs en las 6 estadisticas para todos los Pokemon."
        Write-Host " - Mentas de Naturaleza: $2,500 en tiendas para cambiar stats libremente."
        Write-Host " - Mega Piedras: 33 piedras disponibles a la venta por dinero ($)."
        Write-Host " - Reserva Safari: Iniciales y Pseudos al 10-15% con mecanicas clasicas."
        Write-Host " - Legendarios: Eternatus y Zygarde son no capturables por lore."
        Write-Host ""
        Read-Host "Presiona ENTER para volver al Menu Principal"
    }
    elseif ($opt -eq "5") {
        Write-Host "Gracias por jugar a Pokemon: Ecos de Andara!" -ForegroundColor Green
        break
    }
}
