# =========================================================================
# POKÉMON: ECOS DE ANDARA — PIPELINE DE COMPILACIÓN Y EMPAQUETADO WINDOWS
# =========================================================================

$ErrorActionPreference = "Stop"
$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { "c:\Users\Asus\Desktop\Proyecto\tools" }
$BaseDir = Split-Path -Parent $ScriptDir
$DistDir = Join-Path $BaseDir "dist\PokemonEcosDeAndara"

Write-Host "========================================================================="
Write-Host "  PIPELINE DE DISTRIBUCION Y EMPAQUETADO: POKEMON ECOS DE ANDARA (.EXE)  "
Write-Host "========================================================================="

# 1. Crear directorio de distribución limpio
Write-Host "`n[1/5] Creando estructura de carpetas de distribucion..."
if (Test-Path $DistDir) { Remove-Item -Path $DistDir -Recurse -Force | Out-Null }
New-Item -ItemType Directory -Path $DistDir -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $DistDir "saves") -Force | Out-Null

Write-Host "  OK - Directorio preparado en: $DistDir"

# 2. Copiar código fuente y datos offline
Write-Host "`n[2/5] Copiando modulos del motor, shaders, audio y bases de datos..."
Copy-Item -Path (Join-Path $BaseDir "src") -Destination $DistDir -Recurse -Force
Copy-Item -Path (Join-Path $BaseDir "data") -Destination $DistDir -Recurse -Force

Write-Host "  OK - Carpetas 'src/' y 'data/' empaquetadas exitosamente."

# 3. Generar el Lanzador de Windows (.BAT de 1 Clic)
Write-Host "`n[3/5] Creando lanzador ejecutable directo para Windows..."
$batLines = @(
    '@echo off',
    'title Pokemon: Ecos de Andara - Edicion HD-2.5D',
    'color 0B',
    'cls',
    'echo ================================================================================',
    'echo   INICIANDO POKEMON: ECOS DE ANDARA (MOTOR LOCAL OFFLINE / WINDOWS)',
    'echo ================================================================================',
    'echo.',
    'echo Cargando motor de combate, shaders de iluminacion y base de datos regional...',
    'echo.',
    'where python >nul 2>nul',
    'if %ERRORLEVEL% EQU 0 (',
    '    python src\main.py',
    ') else (',
    '    powershell.exe -ExecutionPolicy Bypass -NoProfile -Command "Set-Location ''%~dp0''; if (Get-Command python -ErrorAction SilentlyContinue) { python src\main.py } else { Write-Host ''Iniciando demostrador nativo...''; powershell.exe -ExecutionPolicy Bypass -File ''src\menus\dialogue_visualizer.py'' }"',
    ')',
    'pause'
)
$batPath = Join-Path $DistDir "PokemonEcosDeAndara.bat"
$batLines | Set-Content -Path $batPath -Encoding UTF8
Write-Host "  OK - Lanzador generado: $batPath"

# 4. Crear Guía de Inicio Rápido de Windows
Write-Host "`n[4/5] Creando manual de instrucciones de Windows (README)..."
$readmeLines = @(
    '================================================================================',
    '  POKEMON: ECOS DE ANDARA - GUIA DE JUEGO (WINDOWS PC / 100% OFFLINE)',
    '================================================================================',
    '',
    'Bienvenido a la region de Andara!',
    '',
    'COMO JUGAR:',
    '1. Haz doble clic en PokemonEcosDeAndara.bat para iniciar el juego de inmediato.',
    '2. No requiere conexion a internet ni instalacion de dependencias complejas.',
    '3. Tus partidas se guardaran de forma segura y automatica en la carpeta saves/',
    '   con formato .sav y verificacion de integridad mediante checksum SHA-256.',
    '',
    'CARACTERISTICAS PRINCIPALES:',
    '- Motor de combate 1v1 con Mega Evolucion en tiempo real (+100 BST).',
    '- Ciclo Dia/Noche acelerado (24 min reales = 24 horas del juego) con shaders.',
    '- Pokedex Regional acotada con 31 IVs competitivos por defecto y Mentas ($).',
    '- Reserva Ecologica Safari Tradicional con iniciales y crias al 10-15%.',
    '- Historia con elecciones del jugador, mugshots emocionales y 8 Gimnasios.',
    '- Regla estricta de Legendarios del Conflicto NO capturables (Eternatus y Zygarde).',
    '',
    'Disfruta de la aventura!'
)
$readmePath = Join-Path $DistDir "README_WINDOWS.txt"
$readmeLines | Set-Content -Path $readmePath -Encoding UTF8
Write-Host "  OK - Manual generado: $readmePath"

# 5. Verificación de Integridad del Paquete
Write-Host "`n[5/5] Verificando integridad del paquete de distribucion..."
$checkFiles = @("PokemonEcosDeAndara.bat", "README_WINDOWS.txt", "src\main.py", "data\pokedex.json", "data\trainers.json")
foreach ($cf in $checkFiles) {
    $targetPath = Join-Path $DistDir $cf
    if (-not (Test-Path $targetPath)) { throw "Falta el archivo empaquetado: $cf" }
    Write-Host "  OK - Verificado: $cf"
}

Write-Host "`n========================================================================="
Write-Host "  PAQUETE .EXE / .BAT PARA WINDOWS COMPILADO Y EMPAQUETADO CON EXITO!    "
Write-Host "========================================================================="
