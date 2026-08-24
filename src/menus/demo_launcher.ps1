# Pokemon: Ecos de Andara — Lanzador Interactivo PowerShell

$Host.UI.RawUI.WindowTitle = "Pokemon: Ecos de Andara - Edicion HD-2.5D"

while ($true) {
    Clear-Host
    Write-Host "+=========================================================================+" -ForegroundColor Cyan
    Write-Host "|                                                                         |" -ForegroundColor Cyan
    Write-Host "|         P O K E M O N   E C O S   D E   A N D A R A                   |" -ForegroundColor Yellow
    Write-Host "|                  [ Edicion HD-2.5D - Motor Offline ]                   |" -ForegroundColor White
    Write-Host "|                                                                         |" -ForegroundColor Cyan
    Write-Host "+=========================================================================+" -ForegroundColor Cyan
    Write-Host "|                                                                         |" -ForegroundColor Cyan
    Write-Host "|  [1]  NUEVA PARTIDA  (Prologo + Overworld 2.5D + Combate con Nahuel)   |" -ForegroundColor Green
    Write-Host "|  [2]  SIMULADOR DE COMBATE  (Mega-Charizard X vs Mega-Blastoise)       |" -ForegroundColor Magenta
    Write-Host "|  [3]  CINEMATICAS Y MUGSHOTS  (Ceibo, Nahuel, Renata, Growlithe)       |" -ForegroundColor Yellow
    Write-Host "|  [4]  CONFIGURACION Y REGLAS  (31 IVs, Mentas, Tiendas, Legendarios)   |" -ForegroundColor White
    Write-Host "|  [5]  SALIR                                                             |" -ForegroundColor Red
    Write-Host "|                                                                         |" -ForegroundColor Cyan
    Write-Host "+=========================================================================+" -ForegroundColor Cyan
    Write-Host ""
    $opt = Read-Host "Selecciona una opcion (1-5)"

    if ($opt -eq "1") {
        Clear-Host
        Write-Host "+=========================================================================+" -ForegroundColor Yellow
        Write-Host "|           PROLOGO Y CEREMONIA EN VILLA TRANQUIMAR                       |" -ForegroundColor Yellow
        Write-Host "+=========================================================================+" -ForegroundColor Yellow
        Write-Host ""
        $pname = Read-Host "Nombre de tu personaje [Enter = Aria]"
        if (-not $pname) { $pname = "Aria" }

        Write-Host ""
        Write-Host "Elige tu Pokemon Inicial:" -ForegroundColor Green
        Write-Host "  [1] Bulbasaur (Planta/Veneno)"
        Write-Host "  [2] Charmander (Fuego)"
        Write-Host "  [3] Squirtle  (Agua)"
        $st = Read-Host "Selecciona (1-3) [Enter = 2]"

        $starter  = "Charmander"
        $rival    = "Squirtle"
        if ($st -eq "1") { $starter = "Bulbasaur";  $rival = "Charmander" }
        if ($st -eq "3") { $starter = "Squirtle";   $rival = "Bulbasaur"  }

        Write-Host ""
        Write-Host "Prof. Ceibo: Excelente eleccion, $pname! Cuida bien de $starter." -ForegroundColor White
        Write-Host "Nahuel:      Entonces yo elijo a $rival! Preparate para nuestro primer combate!" -ForegroundColor Yellow
        Write-Host ""

        Write-Host "+--- VISTA 2.5D: VILLA TRANQUIMAR (Amanecer Dorado) ------------------+" -ForegroundColor Cyan
        Write-Host "| [*] [*] [*] [*] [*] [*] [*] [*] [*] [*] [*] [*] [*]               |"
        Write-Host "| [*] .   .   .   .   ~   ~   ~   .   .   [*]                        |"
        Write-Host "| [*] .  [H] .   .   ~   ~   ~   .   .   [*]                        |"
        Write-Host "| [*] .   .   .  [P] .   .   .   .   .   [*]                        |"
        Write-Host "| [*] .   .  [T] .   .   .   .   .   .   [*]                        |"
        Write-Host "| [*] [~] [~] [~] [~] [~] [~] [~] [~] [~] [*]                      |"
        Write-Host "+---------------------------------------------------------------------+" -ForegroundColor Cyan
        Write-Host "  [*]=Arbol  [H]=Casa  [P]=Jugador  [T]=Entrenador  [~]=Agua"
        Write-Host ""

        Write-Host "+--- COMBATE PARALLAX: $pname VS NAHUEL --------------------------------+" -ForegroundColor Magenta
        Write-Host "| Cielo: Amanecer dorado sobre la Cordillera de Andara                 |"
        Write-Host "|  /\  /\/\    /\  /\/\    /\  /\/\  [Relieve montanoso]               |"
        Write-Host "|                                                                       |"
        Write-Host "|                            $rival Nv. 5                              |"
        Write-Host "|                            PS: [####################] 20/20          |"
        Write-Host "|                                                                       |"
        Write-Host "|  $starter Nv. 5                                                      |"
        Write-Host "|  PS: [####################] 20/20                                    |"
        Write-Host "+-----------------------------------------------------------------------+" -ForegroundColor Magenta
        Write-Host "| [1] LUCHAR    [2] MOCHILA    [3] POKEMON    [4] HUIR                 |"
        Write-Host "+-----------------------------------------------------------------------+" -ForegroundColor Magenta
        Write-Host ""
        Read-Host "Presiona ENTER para volver al menu principal"
    }
    elseif ($opt -eq "2") {
        Clear-Host
        Write-Host "+=========================================================================+" -ForegroundColor Magenta
        Write-Host "|           DUELO CLIMAX: MEGA-CHARIZARD X VS MEGA-BLASTOISE             |" -ForegroundColor Magenta
        Write-Host "+=========================================================================+" -ForegroundColor Magenta
        Write-Host ""
        Write-Host "  El Mega-Aro de Aria resuena con la Charizardita X..." -ForegroundColor Yellow
        Write-Host "  Charizard megaevoluciona a MEGA-CHARIZARD X!" -ForegroundColor Cyan
        Write-Host "  Tipo: Fuego/Dragon | +100 BST en tiempo real" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  > Mega-Charizard X usa GARRA DRAGON!" -ForegroundColor Green
        Write-Host "  > Impacto demoledor! Dano masivo infligido a Mega-Blastoise!" -ForegroundColor Red
        Write-Host ""
        Write-Host "  +--- CALCULO DE DANO (Formula Gen 5+) ---------------------------+" -ForegroundColor White
        Write-Host "  | Ataque: 372  Defensa rival: 210  Poder: 80  Nivel: 65          |" -ForegroundColor White
        Write-Host "  | Efectividad: x2.0 (Dragon vs Agua)  STAB: x1.5  Critico: x1.5 |" -ForegroundColor White
        Write-Host "  | Dano estimado: 180-212 PS                                      |" -ForegroundColor White
        Write-Host "  +------------------------------------------------------------------+" -ForegroundColor White
        Write-Host ""
        Read-Host "Presiona ENTER para volver al menu principal"
    }
    elseif ($opt -eq "3") {
        Clear-Host
        Write-Host "+=========================================================================+" -ForegroundColor Green
        Write-Host "|                  CINEMATICAS Y MUGSHOTS                                 |" -ForegroundColor Green
        Write-Host "+=========================================================================+" -ForegroundColor Green
        Write-Host ""
        Write-Host "  +--- [PROF. CEIBO - Expresion: Sabio] --------------------------------+"
        Write-Host "  | Andara es una tierra donde la resonancia de las Mega Piedras          |"
        Write-Host "  | brota desde las raices del mundo.                                     |"
        Write-Host "  | Vuestro viaje apenas comienza...                                      |"
        Write-Host "  +----------------------------------------------------------------------+"
        Write-Host ""
        Write-Host "  +--- [RIVAL NAHUEL - Expresion: Desafiante] --------------------------+"
        Write-Host "  | No pienso quedarme atras! En Solsticio encontraremos las respuestas,  |"
        Write-Host "  | y cuando llegue el momento, te demostrare quien es el mejor!          |"
        Write-Host "  +----------------------------------------------------------------------+"
        Write-Host ""
        Write-Host "  +--- [CAMPEOANA RENATA - Expresion: Imponente] -----------------------+"
        Write-Host "  | He visto como el Crater Resonante late con mas fuerza cada dia.       |"
        Write-Host "  | Algo se acerca. Confio en que tu puedes detenerlo.                    |"
        Write-Host "  +----------------------------------------------------------------------+"
        Write-Host ""
        Read-Host "Presiona ENTER para volver al menu principal"
    }
    elseif ($opt -eq "4") {
        Clear-Host
        Write-Host "+=========================================================================+" -ForegroundColor Yellow
        Write-Host "|              CONFIGURACION Y REGLAS REGIONALES                          |" -ForegroundColor Yellow
        Write-Host "+=========================================================================+" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  IVs Competitivos  : 31 IVs en las 6 estadisticas para todos los Pokemon"
        Write-Host "  Mentas Naturaleza  : Disponibles por $2500 en tiendas"
        Write-Host "  Mega Piedras       : 33 piedras a la venta por dinero ($)"
        Write-Host "  MTs/MOs            : Mas de 110 movimientos disponibles en tiendas"
        Write-Host "  Reserva Safari     : Iniciales y Pseudo-legendarios al 10-15%"
        Write-Host "  Shinies            : 1/1024 base — 1/341 con Amuleto Iris"
        Write-Host "  Ciclo Dia/Noche    : 24 minutos reales = 24 horas del juego"
        Write-Host "  Legendarios        : Eternatus y Zygarde — NO capturables por lore"
        Write-Host ""
        Read-Host "Presiona ENTER para volver al menu principal"
    }
    elseif ($opt -eq "5") {
        Write-Host ""
        Write-Host "Gracias por jugar a Pokemon: Ecos de Andara!" -ForegroundColor Green
        break
    }
    else {
        Write-Host "Opcion no valida. Elige entre 1 y 5." -ForegroundColor Red
        Start-Sleep -Seconds 1
    }
}
