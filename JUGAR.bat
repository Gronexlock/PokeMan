@echo off
title Pokemon: Ecos de Andara

echo =========================================================
echo   POKEMON: ECOS DE ANDARA  -  Edicion HD-2.5D
echo =========================================================
echo.

REM Paso 1: Descargar sprites si es la primera vez
if not exist "assets\sprites\artwork\6.png" (
    echo [1/2] Descargando sprites de Pokemon desde PokeAPI...
    echo       (Solo la primera vez - puede tardar 1-2 minutos)
    echo.
    python tools\download_assets.py
    echo.
)

REM Paso 2: Arrancar el juego con ventana grafica
echo [2/2] Iniciando el juego...
python game.py

if errorlevel 1 (
    echo.
    echo ERROR al iniciar el juego. Verifica que Python este instalado.
    echo Intenta: pip install pygame
    pause
)
