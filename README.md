# TORNEITO - SERVER BACKEND
Este servidor permite levantar múltiples servidores de Counter-Strike 2 y gestionarlos para permitir la competencia en torneos.

El backend permite levantar series BO1, BO3, BO5 en múltiples mapas, con whitelists de jugadores según sus STEAMID64 y pudiendo asignar
STEAMID64 específicas a los roles de administración.

Cuenta también con la capacidad de recuento de estadísticas y descarga de demos al finalizar un mapa / serie; así también como la habilidad de restaurar rondas específicas de un determinado mapa ya jugado.

(!) Lo bueno de este backend es que solamente hay que instalar el servidor de CS2 con SteamCMD y listo, no hay que entrar a configurar
ningún archivo del servidor, este backend se encarga de hacer todo.

## Stack 
El proyecto utiliza tres plugins base: 
- [Metamod: Source](https://www.sourcemm.net/downloads.php?branch=master)
- [CounterStrikeSharp](https://github.com/roflmuffin/CounterStrikeSharp/releases)
- [MatchZy Enhanced](https://github.com/sivert-io/matchzy-Enhanced/releases)


## Variables de entorno

| Variable | Ejemplo | Descripción |
|---|---|---|
| `CS2_RCON_HOST` | `127.0.0.1` | IP del servidor CS2. En producción normalmente es localhost ya que el backend y el servidor corren en la misma máquina. |
| `CS2_RCON_PORT` | `27015` | Puerto RCON por defecto. En la práctica cada servidor usa un puerto distinto que se pasa en cada request. |
| `CS2_RCON_PASSWORD` | `contra` | Contraseña RCON. Tiene que coincidir con la que se configura en el servidor CS2. |
| `PORT` | `3000` | Puerto donde escucha este backend NestJS. |
| `CS2_SERVER_ROOT_DIR` | `D:\Servidor_CS2\server` | Ruta absoluta a la carpeta raíz del servidor CS2. En Linux será algo como `/opt/cs2/server`. |
| `BACKEND_WEBHOOK_URL` | `http://localhost:3000` | URL pública o de red local de este backend. MatchZy la usa para enviar eventos y para descargar la configuración del partido. |
| `MATCHZY_WEBHOOK_TOKEN` | `contra` | Token Bearer que MatchZy incluye en cada webhook. El backend lo valida para asegurarse de que los eventos vienen del servidor correcto. |
| `AUTO_RESTORE_ON_MATCH_POINT` | `true` | Si está en `true`, restaura automáticamente la ronda actual cuando algún jugador hace `.tech` o `.pause` en una ronda de match point (12, 15, 18, etc.). Deshabilitarlo si los jugadores abusan de la funcionalidad. |

# Comandos 

## Cómo iniciar este repositorio
Una vez levantado, pueden utilizarse los distintos endpoints (documentados en Swagger) para levantar los servidores de juego.
```bash
$ npm install
$ npm run start:dev
```

## Comandos en partida (admins)
Cuando un administrador está en un servidor, puede ejecutar los comandos definidos [en la documentación de MatchZy Enhanced](https://docs.sivert.io/docs/me)

```bash
!forcestart → Iniciar el partido, indistintamente de los votos.
!restore 3  → Restaurar la ronda N° 4 (cuando por ejemplo el partido estaba 3-0, y estaba por empezar la ronda 4. El contador inicia en 0)
```


## Comandos de consola de servidor
Desde la consola que se abre cuando se levanta un servidor, pueden ejecutarse los siguientes comandos de interés:

```bash
matchzy_loadbackup matchzy_777_0_round05.json  → Levantar la id, nro mapa, nro ronda especificados.
matchzy_listbackups 777  → Ver los backups existentes para la partida de id especificada. Recordar que se borran inmediatamente después de que termina un partido.
```

# Autor
Este repositorio fue creado por Ignacio Mosconi
- [Github](https://github.com/ignamosconi)
- [Portfolio](https://ignamosconi.com.ar)

# Licencia
Torneito is MIT Licensed.


<br/>
<br/>

# Consideraciones a futuro

## Setup en Linux
Dar permisos de ejecución al binario de CS2 antes de iniciar el backend:
```bash
$ chmod +x /ruta/al/servidor/game/bin/linuxsteamrt64/cs2
```

## Configuración de CORS

El visor 2D de demos consume los endpoints de demos directamente desde el browser.
Para que funcione hay que habilitar CORS en el backend apuntando al dominio del frontend.

En `main.ts`, antes de `app.listen()`:

app.enableCors({
  origin: 'https://tu-dominio-frontend.com',
});
