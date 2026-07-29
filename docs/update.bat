@echo off
title Actualizador Servidor CS2

echo ====================================
echo   ACTUALIZANDO SERVIDOR DE CS2
echo ====================================
echo.

cd /d "D:\Servidor_CS2\steamcmd"

steamcmd.exe ^
+login anonymous ^
+force_install_dir "D:\Servidor_CS2\server" ^
+app_update 730 validate ^
+quit

echo.
echo ====================================

if %ERRORLEVEL% EQU 0 (
    echo Actualizacion finalizada correctamente.
) else (
    echo Ocurrio un error durante la actualizacion.
)

echo.
pause