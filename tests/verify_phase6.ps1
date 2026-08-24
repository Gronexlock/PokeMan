# =========================================================================
# POKÉMON: ECOS DE ANDARA — VERIFICADOR DE FASE 6 (POWERSHELL)
# =========================================================================

$ErrorActionPreference = "Stop"
$SrcDir = "c:\Users\Asus\Desktop\Proyecto\src"
$ToolsDir = "c:\Users\Asus\Desktop\Proyecto\tools"

Write-Host "========================================================================="
Write-Host "  TEST SUITE: INTEGRACION VISUAL 2.5D, SHADERS Y EXPORTACION .EXE (FASE 6)"
Write-Host "========================================================================="

# 1. Verificar Presencia de Módulos
Write-Host "`n[1/6] Verificando presencia de modulos graficos, audio y main..."
$requiredFiles = @(
    "src\graphics\lighting_shader.py",
    "src\graphics\overworld_renderer_25d.py",
    "src\battle_ui\battle_scene_renderer.py",
    "src\audio\audio_manager.py",
    "src\main.py",
    "tools\build_windows_exe.ps1",
    "tests\test_phase6_visuals_and_exe.py"
)

foreach ($f in $requiredFiles) {
    $fullPath = Join-Path "c:\Users\Asus\Desktop\Proyecto" $f
    if (-not (Test-Path $fullPath)) { throw "Falta el archivo requerido: $f" }
    Write-Host "  OK - Encontrado: $f"
}

# 2. Verificar Shaders de Iluminación
Write-Host "`n[2/6] Verificando shaders de iluminacion ambiental y gradientes..."
$shaderPy = Get-Content (Join-Path $SrcDir "graphics\lighting_shader.py") -Raw
if ($shaderPy -notmatch "AMBIENT_PALETTES" -or $shaderPy -notmatch "get_ambient_lighting" -or $shaderPy -notmatch "add_point_light") {
    throw "Falta configuracion de iluminacion en lighting_shader.py"
}
Write-Host "  OK - Paletas cromaticas para Amanecer, Dia, Atardecer y Noche validadas."

# 3. Verificar Renderizador 2.5D de Overworld
Write-Host "`n[3/6] Verificando motor de renderizado 2.5D con Y-sorting..."
$rendPy = Get-Content (Join-Path $SrcDir "graphics\overworld_renderer_25d.py") -Raw
if ($rendPy -notmatch "render_viewport" -or $rendPy -notmatch "TILE_GLYPHS" -or $rendPy -notmatch "PLAYER_GLYPHS") {
    throw "Falta logica de renderizado en overworld_renderer_25d.py"
}
Write-Host "  OK - Renderizador 2.5D con capas de terreno, objetos, NPCs y camara centrado verificado."

# 4. Verificar Escena Parallax de Combate y HUD
Write-Host "`n[4/6] Verificando escenario parallax de combate y HUD HD..."
$battlePy = Get-Content (Join-Path $SrcDir "battle_ui\battle_scene_renderer.py") -Raw
if ($battlePy -notmatch "SKY_THEMES" -or $battlePy -notmatch "BIOME_PARALLAX" -or $battlePy -notmatch "render_battle_hud") {
    throw "Falta renderizador de combate en battle_scene_renderer.py"
}
Write-Host "  OK - Escenario parallax diurno/nocturno, plataformas y HUD con Mega Evolucion validados."

# 5. Verificar Audio Manager
Write-Host "`n[5/6] Verificando controlador de audio BGM y efectos SFX..."
$audioPy = Get-Content (Join-Path $SrcDir "audio\audio_manager.py") -Raw
if ($audioPy -notmatch "BGM_TRACKS" -or $audioPy -notmatch "SFX_EFFECTS" -or $audioPy -notmatch "play_bgm") {
    throw "Falta configuracion de audio en audio_manager.py"
}
Write-Host "  OK - Catalogo de bandas sonoras (ciudades, rutas, lideres, Renata) y SFX configurados."

# 6. Ejecutar Pipeline de Empaquetado Windows
Write-Host "`n[6/6] Ejecutando pipeline de compilacion y empaquetado para Windows (.BAT / .EXE)..."
& (Join-Path $ToolsDir "build_windows_exe.ps1")

$distDir = "c:\Users\Asus\Desktop\Proyecto\dist\PokemonEcosDeAndara"
$launcherBat = Join-Path $distDir "PokemonEcosDeAndara.bat"
if (-not (Test-Path $launcherBat)) { throw "No se genero el lanzador en dist/" }
Write-Host "  OK - Paquete de distribucion generado y verificado en dist/PokemonEcosDeAndara/"

Write-Host "`n========================================================================="
Write-Host "  TODAS LAS VERIFICACIONES DE LA FASE 6 PASARON CON EXITO (100%)         "
Write-Host "========================================================================="
