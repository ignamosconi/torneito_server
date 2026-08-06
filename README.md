# TORNEITO - SERVER BACKEND
Este servidor permite levantar múltiples servidores de Counter-Strike 2 y gestionarlos para permitir la competencia en torneos.

El backend permite levantar series BO1, BO3, BO5 en múltiples mapas, con whitelists de jugadores según sus STEAMID64 y pudiendo asignar
STEAMID64 específicas a los roles de administración.

Cuenta también con la capacidad de recuento de estadísticas y descarga de demos al finalizar un mapa / serie; así también como la habilidad de restaurar rondas específicas de un determinado mapa ya jugado.

## Stack 
El proyecto utiliza tres plugins base: 
- [Metamod: Source](https://www.sourcemm.net/downloads.php?branch=master)
- [CounterStrikeSharp](https://github.com/roflmuffin/CounterStrikeSharp/releases)
- [MatchZy Enhanced](https://github.com/sivert-io/matchzy-Enhanced/releases)


## Comandos para levantar el servidor
Una vez levantado, pueden utilizarse los distintos endpoints (documentados en Swagger) para levantar los servidores de juego.
```bash
$ npm install
$ npm run start:dev
```

## Comandos para administradores
Cuando un administrador está en un servidor, puede ejecutar los comandos definidos [en la documentación de MatchZy Enhanced](https://docs.sivert.io/docs/me)

```bash
!forcestart → Iniciar el partido, indistintamente de los votos.
!restore 3  → Restaurar la ronda N° 4 (cuando por ejemplo el partido estaba 3-0, y estaba por empezar la ronda 4. El contador inicia en 0)
```

## Autor
Este repositorio fue creado por Ignacio Mosconi
- [Github](https://github.com/ignamosconi)
- [Portfolio](https://ignamosconi.com.ar)


## Licencia
Torneito is MIT Licensed.
