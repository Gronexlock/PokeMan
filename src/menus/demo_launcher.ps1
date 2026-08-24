# =========================================================================
# POKÉMON: ECOS DE ANDARA — LANZADOR INTERACTIVO NATIVO DE POWERSHELL
# =========================================================================

$Host.UI.RawUI.WindowTitle = "Pokemon: Ecos de Andara - Edicion HD-2.5D"
Clear-Host

$banner = @"
 ╔═════════════════════════════════════════════════════════════════════════╗
 ║                                                                         ║
 ║    ██████╗  ██████╗ ██╗  ██╗███████╗███╗   ███╗ ██████╗ ███╗   ██╗      ║
 ║    ██╔══██╗██╔═══██╗██║ ██╔╝██╔════╝████╗ ████║██╔═══██╗████╗  ██║      ║
 ║    ██████╔╝██║   ██║█████╔╝ █████╗  ██╔████╔██║██║   ██║██╔██╗ ██║      ║
 ║    ██╔═══╝ ██║   ██║██╔═██╗ ██╔══╝  ██║╚██╔╝██║██║   ██║██║╚██╗██║      ║
 ║    ██║     ╚██████╔╝██║  ██╗███████╗██║ ╚═╝ ██║╚██████╔╝██║ ╚████║      ║
 ║    ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝      ║
 ║                                                                         ║
 ║                   ✨  E C O S   D E   A N D A R A  ✨                   ║
 ║                    [ Edición HD-2.5D — Motor Offline ]                  ║
 ║                                                                         ║
 ╠═════════════════════════════════════════════════════════════════════════╣
 ║                                                                         ║
 ║     [1] 🌟 NUEVA PARTIDA (Prólogo, Overworld 2.5D & Nahuel)             ║
 ║     [2] ⚔️  SIMULADOR DE COMBATE (Mega-Charizard vs Mega-Blastoise)      ║
 ║     [3] 📜 CINEMÁTICAS & MUGSHOTS (Prof. Ceibo, Renata & Growlithe)     ║
 ║     [4] ⚙️  CONFIGURACIÓN & REGLAS REGIONALES (31 IVs, Mentas, Tiendas)  ║
 ║     [5] 🚪 SALIR                                                        ║
 ║                                                                         ║
 ╚═════════════════════════════════════════════════════════════════════════╝
"@

while ($true) {
    Clear-Host
    Write-Host $banner -ForegroundColor Cyan
    Write-Host ""
    $opt = Read-Host "🎮 Selecciona una opción (1-5)"

    switch ($opt) {
        "1" {
            Clear-Host
            Write-Host "=========================================================================" -ForegroundColor Yellow
            Write-Host "                PRÓLOGO Y CEREMONIA EN VILLA TRANQUIMAR                  " -ForegroundColor Yellow
            Write-Host "=========================================================================" -ForegroundColor Yellow
            Write-Host ""
            $pname = Read-Host "📝 Ingresa el nombre de tu personaje [Por defecto: Aria]"
            if (-not $pname) { $pname = "Aria" }

            Write-Host ""
            Write-Host "🌿 Elige tu Pokémon Inicial:" -ForegroundColor Green
            Write-Host " [1] Bulbasaur (Planta/Veneno)"
            Write-Host " [2] Charmander (Fuego)"
            Write-Host " [3] Squirtle (Agua)"
            $st = Read-Host "Selecciona (1-3) [Por defecto: 2]"

            $starterName = "Charmander"
            $rivalStarter = "Squirtle"
            if ($st -eq "1") { $starterName = "Bulbasaur"; $rivalStarter = "Charmander" }
            elseif ($st -eq "3") { $starterName = "Squirtle"; $rivalStarter = "Bulbasaur" }

            Write-Host ""
            Write-Host "✨ Prof. Ceibo: '¡Excelente elección, $pname! Cuida bien de $starterName.'" -ForegroundColor White
            Write-Host "🔥 Nahuel: '¡Entonces yo elijo a $rivalStarter! ¡Prepárate para nuestro primer combate en el muelle!'" -ForegroundColor Yellow
            Write-Host ""

            Write-Host "-------------------------------------------------------------------------"
            Write-Host "🗺️  RENDERIZADO 2.5D DE VILLA TRANQUIMAR (Amanecer Dorado):" -ForegroundColor Cyan
            Write-Host " ╔══════════════════ [🗺️ Villa Tranquimar | ⏰ Amanecer Dorado] ══════════════════╗"
            Write-Host " ║  🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲  ║"
            Write-Host " ║  🌲 .  .  .  . 🌿🌿🌿 .  . 🌲  ║"
            Write-Host " ║  🌲 .  🏠 .  . 🌿🌿🌿 .  . 🌲  ║"
            Write-Host " ║  🌲 .  .  .  🧑‍🦱⬇️  .  .  .  . 🌲  ║"
            Write-Host " ║  🌲 .  .  🤠  .  .  .  .  . 🌲  ║"
            Write-Host " ║  🌲 .  .  .  .  .  .  .  . 🌲  ║"
            Write-Host " ║  🌲🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌲  ║"
            Write-Host " ╚════════════════════════════════════════════════════════════════════════════════╝"
            Write-Host ""
            Write-Host "⚔️  ESCENARIO DE COMBATE PARALLAX CONTRA NAHUEL:" -ForegroundColor Magenta
            Write-Host " ╔════════════════════════════════════════════════════════════════════════╗"
            Write-Host " ║  🌅 [CIELO AMANECER: Luz dorada sobre la cordillera andina]            ║"
            Write-Host " ║      /\  /\/\    /\  /\/\    /\  /\/\  [Cordillera de Andara]          ║"
            Write-Host " ║                                                                        ║"
            Write-Host " ║                            🔴 $rivalStarter  Nv. 5                        ║"
            Write-Host " ║                            PS: [████████████████████] 20/20            ║"
            Write-Host " ║                                                                        ║"
            Write-Host " ║     [🧍 TU POSICIÓN]                      [🛸 PLATAFORMA RIVAL]        ║"
            Write-Host " ║       🧑‍🦱 (Entrenador)                      👾 $rivalStarter                  ║"
            Write-Host " ║                                                                        ║"
            Write-Host " ║  🟢 $starterName  Nv. 5                                                   ║"
            Write-Host " ║  PS: [████████████████████] 20/20                                      ║"
            Write-Host " ╠════════════════════════════════════════════════════════════════════════╣"
            Write-Host " ║  [1] ⚔️ LUCHAR       [2] 🎒 MOCHILA      [3] 🔄 POKÉMON      [4] 🏃 HUIR  ║"
            Write-Host " ╚════════════════════════════════════════════════════════════════════════╝"
            Write-Host ""
            Read-Host "Presiona ENTER para volver al Menú Principal"
        }
        "2" {
            Clear-Host
            Write-Host "=========================================================================" -ForegroundColor Magenta
            Write-Host "               DUELO CLÍMAX: MEGA-CHARIZARD X VS MEGA-BLASTOISE          " -ForegroundColor Magenta
            Write-Host "=========================================================================" -ForegroundColor Magenta
            Write-Host ""
            Write-Host "✨ ¡El Mega-Aro de Aria resuena con la Charizardita X!" -ForegroundColor Yellow
            Write-Host "💥 ¡Charizard megaevoluciona a Mega-Charizard X! (Tipo Fuego/Dragón | +100 BST)" -ForegroundColor Cyan
            Write-Host "⚡ ¡Mega-Charizard X usa Garra Dragón!" -ForegroundColor Green
            Write-Host "💥 ¡Impacto demoledor! ¡Daño masivo infligido a Mega-Blastoise!" -ForegroundColor Red
            Write-Host ""
            Read-Host "Presiona ENTER para volver al Menú Principal"
        }
        "3" {
            Clear-Host
            Write-Host "=========================================================================" -ForegroundColor Green
            Write-Host "                      CINEMÁTICAS & MUGSHOTS                             " -ForegroundColor Green
            Write-Host "=========================================================================" -ForegroundColor Green
            Write-Host ""
            Write-Host " ╔═════════════════════════════════════════════════════════════════════════╗"
            Write-Host " ║ [🧔 PROF. CEIBO - Expresión: Sabio]                                    ║"
            Write-Host " ║ 'Andara es una tierra donde la resonancia de las Mega Piedras brota     ║"
            Write-Host " ║  desde las raíces del mundo. Vuestro viaje apenas comienza...'          ║"
            Write-Host " ╚═════════════════════════════════════════════════════════════════════════╝"
            Write-Host ""
            Write-Host " ╔═════════════════════════════════════════════════════════════════════════╗"
            Write-Host " ║ [🤠 RIVAL NAHUEL - Expresión: Desafiante]                               ║"
            Write-Host " ║ '¡No pienso quedarme atrás! En Solsticio encontraremos las respuestas,  ║"
            Write-Host " ║  y cuando llegue el momento, ¡te demostraré quién es el mejor!'         ║"
            Write-Host " ╚═════════════════════════════════════════════════════════════════════════╝"
            Write-Host ""
            Read-Host "Presiona ENTER para volver al Menú Principal"
        }
        "4" {
            Clear-Host
            Write-Host "=========================================================================" -ForegroundColor Yellow
            Write-Host "                CONFIGURACIÓN Y REGLAS REGIONALES                        " -ForegroundColor Yellow
            Write-Host "=========================================================================" -ForegroundColor Yellow
            Write-Host " - IVs Competitivos: 31 IVs en las 6 estadísticas para todos los Pokémon."
            Write-Host " - Mentas de Naturaleza: $2,500 en tiendas para cambiar stats libremente."
            Write-Host " - Mega Piedras: 33 piedras disponibles a la venta por dinero ($)."
            Write-Host " - Reserva Safari: Iniciales y Pseudos al 10-15% con mecánicas clásicas."
            Write-Host " - Legendarios: Eternatus y Zygarde son no capturables por lore."
            Write-Host ""
            Read-Host "Presiona ENTER para volver al Menú Principal"
        }
        "5" {
            Write-Host "👋 ¡Gracias por jugar a Pokémon: Ecos de Andara!" -ForegroundColor Green
            break
        }
    }
}
