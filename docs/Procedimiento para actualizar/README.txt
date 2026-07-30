0. Usar steam CMD para descargar el servidor dedicado de CS2. SE PUEDE HACER TODO ANÓNIMO, no hace falta cuenta.
Va a quedar esta estructura:
29/07/2026  12:23    <DIR>          server				→ Acá está todo lo del servidor
02/06/2026  20:33               324 server.bat			→ Test para levantarlo manual, después no se usa más.
29/07/2026  12:40    <DIR>          steamcmd			→ Steam cmd usado únicamente para descarga original.
09/07/2026  09:35               541 update.bat			→ Bat para actualización
29/07/2026  12:53    <DIR>          z - Procedimiento para actualizar


1. Ejecutar el archivo "update.bat". Esto descarga la actualización de CS2.
1a) Después de actualizar, volver a ejecutar el archivo. Verificar dos veces los files asegura que ande bien.

2. Al actualizar CS2, se borran los plugins. Las configuraciones quedan, pero hay que reinstalar los plugins. Para ello:

2a) Metamod:Source: descargar y copiar la carpeta addons/ en game/csgo/:
	LINK: https://www.sourcemm.net/downloads.php?branch=master
	DESCARGAR LAS VERSIONES 2.X.X.X, NO LAS VERSIONES 1.12.X.X NI 1.X.X.X

2b) CounterStrikeSharp: descargar el zip -with-runtime-windows-... (o runtime Linux) y extraer en game/csgo/
	LINK: https://github.com/roflmuffin/CounterStrikeSharp/releases

2c) MatchZy Enhanced: descargar el zip y copiar en game/csgo/
	https://github.com/sivert-io/matchzy-Enhanced/releases

3. Actualizar los siguientes archivos:
3a) server/game/csgo/gameinfo.gi: En "SearchPaths", justo antes de "Game csgo", agregar "Game csgo/addons/metamod"
3b) server/game/csgo_core/gameinfo.gi: En "SearchPaths", justo antes de "Game csgo_core" agregar "Game csgo/addons/metamod"


4. Ejecutar el archivo "server.bat". Para comprobar que está todo levantado correctamente, ejecutar los siguientes comandos:
	meta version: Tiene que verse un cartel "Metamod:Source Version Info"
	meta list: Tiene que decir [01] CounterStrikeSharp
	css_plugins list: Tiene que decir [#1:LOADED]: "MatchZy", y abajo la aclaración "Enhanced CS2 match management plugin"

--- NOTA 1 -------------------------
En la carpeta donde está este readme dejé versiones de estos archivos descargadas el 09/07/2026 (actualización explosión de bomba), por si desaparecen los links jajaa.

--- NOTA 2 -------------------------
Las configuraciones que cargué para el servidor están en los archivos config.cfg, live.cfg, admins.json, gameinfo.gi.