import { Inject } from '@nestjs/common';
import type { IRconService } from '../../rcon/interfaces/rcon.service.interface';
import type { IAdminService } from '../../admin/interfaces/admin.service.interface';
import { RCON_SERVICE } from '../../rcon/rcon.tokens';
import { ADMIN_SERVICE } from '../../admin/admin.tokens';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { ILifecycleService } from '../interfaces/lifecycle.service.interface';
import { MatchZyEventDto } from '../dto/matchzy-event.dto';
import { eliminarArchivo, guardarJsonEnArchivo } from '../../shared/helpers/file.helper';
import { borrarBackupsJson, borrarBackupsTxt } from '../../shared/helpers/backup.helper';
import { RestoreRoundDto } from '../dto/restore-round.dto';

@Injectable()
export class LifecycleService implements ILifecycleService {
  private readonly logger = new Logger(LifecycleService.name);

  /*
    ESTADO EN MEMORIA
  */
  private readonly seriesFinalizadas = new Set<number>();
  private readonly matchIdMap = new Map<number, string>();                                 // numerico → string
  private readonly matchPortMap = new Map<number, number>();                              // numerico → puerto
  private readonly matchIdInversoMap = new Map<string, number>();                        // string → numerico
  private readonly puertosActivos = new Set<number>();                                  // fuente de verdad de puertos ocupados
  private readonly scoreActual = new Map<number, { team1: number; team2: number }>();  // Usado para verificar si un equipo está en match-point.
  private readonly heartbeatIntervals = new Map<number, NodeJS.Timeout>();            // puerto → interval

  constructor(
    private readonly configService: ConfigService,
    @Inject(RCON_SERVICE) private readonly rconService: IRconService,
    @Inject(ADMIN_SERVICE) private readonly adminService: IAdminService,
  ) {}

  /*
    HEARTBEAT - Nos permite detectar si un servidor sigue activo o no.
  */
  private iniciarHeartbeat(matchidNumerico: number, gamePort: number): void {
    // Evitar duplicados si se llama dos veces
    if (this.heartbeatIntervals.has(gamePort)) return;

    let fallosConsecutivos = 0;
    const maxFallos = 3; // 3 fallos × 10s = 30s antes de liberar

    const interval = setInterval(async () => {
      try {
        const respuesta = await this.rconService.executeCommand('echo heartbeat', gamePort);
        if (respuesta.includes('Error de conexión RCON')) {
          fallosConsecutivos++;
          this.logger.warn(`[Heartbeat] Fallo ${fallosConsecutivos}/${maxFallos} en puerto ${gamePort}`);
        } else {
          fallosConsecutivos = 0; // reset si responde
        }
      } catch (_) {
        fallosConsecutivos++;
        this.logger.warn(`[Heartbeat] Fallo ${fallosConsecutivos}/${maxFallos} en puerto ${gamePort}`);
      }

      if (fallosConsecutivos >= maxFallos) {
        this.logger.error(`[Heartbeat] Servidor en puerto ${gamePort} no responde. Liberando recursos...`);
        clearInterval(interval);
        this.heartbeatIntervals.delete(gamePort);
        this.removerMapeoId(matchidNumerico);
      }
    }, 10000); // cada 10 segundos

    this.heartbeatIntervals.set(gamePort, interval);
  }

  /* 
    ESTADO DE SERIE
  */
  marcarSerieTerminada(matchId: number): void {
    this.seriesFinalizadas.add(matchId);
    this.logger.log(`[Lifecycle] MatchID ${matchId} marcado como SERIE_FINALIZADA`);
  }

  debeApagarServidor(matchId: number): boolean {
    if (this.seriesFinalizadas.has(matchId)) {
      this.seriesFinalizadas.delete(matchId);
      return true;
    }
    return false;
  }

  /*
    MAPEOS: ID y Puerto
  */

  obtenerMatchIdPlataforma(matchidNumerico: number): string | undefined {
    return this.matchIdMap.get(matchidNumerico);
  }

  obtenerPortPartido(matchidNumerico: number): number | undefined {
    return this.matchPortMap.get(matchidNumerico);
  }

  removerMapeoId(matchidNumerico: number): void {
    const matchId = this.matchIdMap.get(matchidNumerico);
    if (matchId) this.matchIdInversoMap.delete(matchId);
    const puerto = this.matchPortMap.get(matchidNumerico);
    if (puerto) this.puertosActivos.delete(puerto);
    this.matchIdMap.delete(matchidNumerico);
    this.matchPortMap.delete(matchidNumerico);
    this.scoreActual.delete(matchidNumerico); //reiniciar el score

    //Frenamos el hartbeat
    const interval = this.heartbeatIntervals.get(puerto!);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(puerto!);
      this.logger.log(`[Heartbeat] Detenido para puerto ${puerto}`);
    }

  }

  /* 
    RUTAS DE ARCHIVOS
  */
  private getServerRootNormalized(): string {
    return path.normalize(this.configService.get<string>('CS2_SERVER_ROOT_DIR')!);
  }

  private getConfigFilePath(matchId: string): string {
    return path.join(this.getServerRootNormalized(), 'game', 'csgo', 'cfg', 'StartServerJsons', `match_${matchId}.json`);
  }

  /* 
    LIFECYCLE del server
  */

  async generarConfiguracionYPlantar(matchId: string, configuracionData: any, gamePort: number): Promise<void> {
    
    //Si el puerto ya está ocupado, no dejamos levantar.
    if (this.puertosActivos.has(gamePort)) {
      const sugerido = this.puertosActivos.size > 0 ? Math.max(...this.puertosActivos) + 1 : gamePort + 1;
      throw new BadRequestException(
        `El puerto ${gamePort} ya está en uso. Puerto sugerido: ${sugerido}`,
      );
    }

    //Si el puerto no está ocupado, levantamos el servidor con todas las configuraciones.
    try {
      const normalizedRootDir = this.getServerRootNormalized();
      const filePath = this.getConfigFilePath(matchId);

      guardarJsonEnArchivo(filePath, configuracionData);
      this.logger.log(`[+] Configuración match_${matchId}.json generada`);

      this.matchIdMap.set(configuracionData.matchid, matchId);
      this.matchPortMap.set(configuracionData.matchid, gamePort);
      this.matchIdInversoMap.set(matchId, configuracionData.matchid);
      this.puertosActivos.add(gamePort);
      this.logger.log(`[Lifecycle] Mapeando ${configuracionData.matchid} → "${matchId}" → puerto ${gamePort}`);

      const rconPassword = this.configService.get<string>('CS2_RCON_PASSWORD')!;
      const tvPort = gamePort + 1000;
      const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

      //Después se pisa con la config que se mande en /start-match, pero hay que levantar el server con algo.
      const args = [
        '-dedicated', '-usercon', '-console', '-secure',
        '+game_type', '0', '+game_mode', '1',
        '+map', 'de_mirage',
        '+ip', '0.0.0.0',
        '-port', gamePort.toString(),
        '+tv_port', tvPort.toString(),
        '+rcon_password', rconPassword,
        '+tv_enable', '1',
      ];

      const cs2Process = isProduction
        ? spawn(
            path.join(normalizedRootDir, 'game', 'bin', 'linuxsteamrt64', 'cs2'),
            args,
            { detached: true, stdio: 'ignore' },
          )
        : spawn(
            'cmd.exe',
            ['/c', 'start', '""', path.join(normalizedRootDir, 'game', 'bin', 'win64', 'cs2.exe'), ...args],
            { detached: true, stdio: 'ignore' },
          );

      cs2Process.unref();
      this.iniciarPollingRcon(matchId, gamePort, configuracionData.matchid);
    } catch (error) {
      this.logger.error(`[-] Error al generar configuración o levantar servidor: ${error}`);
      throw error;
    }
  }

  obtenerConfiguracionLocal(matchId: string): any {
    const filePath = this.getConfigFilePath(matchId);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  private iniciarPollingRcon(matchId: string, gamePort: number, matchidNumerico?: number): void {
    this.logger.log(`[Polling RCON] Esperando que el puerto ${gamePort} esté listo...`);
    let intentos = 0;
    const maxIntentos = 30;
    let corriendo = false; // Flag para evitar ejecuciones solapadas

    const interval = setInterval(async () => {
      // Si el intento anterior todavía no terminó, lo saltamos
      if (corriendo) return;
      corriendo = true;

      intentos++;
      try {
        const respuesta = await this.rconService.executeCommand('echo ping_backend', gamePort);
        if (respuesta && !respuesta.includes('Error de conexión RCON')) {
          this.logger.log(`[Polling RCON] Servidor VIVO en intento nº ${intentos}`);
          clearInterval(interval);
          await this.ejecutarInyeccionMatchZy(matchId, gamePort, matchidNumerico);
        }
      } catch (_) {
        // ECONNREFUSED esperado mientras el servidor carga
      } finally {
        corriendo = false;
      }

      if (intentos >= maxIntentos) {
        this.logger.error(`[Polling RCON] Timeout en puerto ${gamePort}`);
        clearInterval(interval);
      }
    }, 2000);
  }

  async ejecutarInyeccionMatchZy(matchId: string, gamePort: number, matchidNumerico?: number): Promise<void> {
    try {
      const backendUrl = this.configService.get<string>('BACKEND_WEBHOOK_URL')!;
      const secretToken = this.configService.get<string>('MATCHZY_WEBHOOK_TOKEN')!;

      this.logger.log(`[RCON Inyección] Conectando a MatchZy...`);

      await this.rconService.executeCommand(`mp_backup_round_auto 1`, gamePort);
      await this.rconService.executeCommand(`mp_backup_round_file "backup"`, gamePort);
      await this.rconService.executeCommand(`mp_backup_round_file_capacity 100`, gamePort);
      await this.rconService.executeCommand(`mp_backup_round_file_pattern "%prefix%_round%round%.txt"`, gamePort);

      await this.rconService.executeCommand(`matchzy_remote_log_header_key "Authorization"`, gamePort);
      await this.rconService.executeCommand(`matchzy_remote_log_header_value "Bearer ${secretToken}"`, gamePort);

      //Url donde MatchZy envía los eventos. 
      await this.rconService.executeCommand(`matchzy_remote_log_url "${backendUrl}/lifecycle/events"`, gamePort);

      const matchidStr = matchidNumerico?.toString() ?? matchId;
      await this.rconService.executeCommand(`matchzy_demo_path "MatchZy/Demos/${matchidStr}/"`, gamePort);
      await this.rconService.executeCommand(`matchzy_demo_name_format "demo_map{MAPNUMBER}_${matchidStr}"`, gamePort);

      const configUrl = `${backendUrl}/lifecycle/config/${matchId}`;
      const loadCmd = `matchzy_loadmatch_url "${configUrl}"`;
      this.logger.log(`[RCON Inyección] Ejecutando: ${loadCmd}`);
      const response = await this.rconService.executeCommand(loadCmd, gamePort);
      this.logger.log(`[RCON Inyección] MatchZy respondió: ${response || 'OK (Silencioso)'}`);

      const admins = this.adminService.obtenerTodosLosSteam64();
      for (const admin of admins) {
        await this.rconService.executeCommand(`matchzy_addplayer ${admin.steam64} spec ${admin.nombre}`, gamePort);
        this.logger.log(`[RCON Inyección] Spec agregado: ${admin.nombre} (${admin.steam64})`);
      }

      //Después de iniciar toda la configuración, damos inicio al heartbeat del servidor.
      if (matchidNumerico !== undefined) {
        this.iniciarHeartbeat(matchidNumerico, gamePort);
      }
    } catch (error) {
      this.logger.error(`[-] Error crítico en inyección RCON: ${error}`);
    }
  }

  async procesarEvento(eventData: MatchZyEventDto): Promise<void> {
    const { event, matchid: matchidNumerico } = eventData;
    const gamePort = this.obtenerPortPartido(matchidNumerico);
    if (gamePort === undefined) {
      this.logger.error(`[Webhook] Puerto no encontrado para matchid ${matchidNumerico}. ¿Servidor no registrado / levantado?`);
      return;
    }
    const matchId = this.obtenerMatchIdPlataforma(matchidNumerico) ?? matchidNumerico.toString();

    this.logger.log(`[Webhook] Evento "${event}" para MatchID: ${matchId} (Numérico: ${matchidNumerico})`);

    if (event === 'series_end') {
      this.logger.log(`--- [EVENTO] SERIE FINALIZADA (MatchID: ${matchId}) ---`);
      this.marcarSerieTerminada(matchidNumerico);
    }

    /*
      Si algún equipo está en match-point (ronda 12, 15, 18, etc) y se hace un .tech y el equipo en match point gana la ronda, jamás
      va a ejecutarse el .tech, asique esta lógica detecta si hay un .tech en match point y reinicia la ronda instantáneamente.
    */
    if (event === 'round_end' && eventData.team1 && eventData.team2) {
      this.scoreActual.set(matchidNumerico, {
        team1: eventData.team1.score,
        team2: eventData.team2.score,
      });
      this.logger.log(`[Score] ${matchId} → team1: ${eventData.team1.score} | team2: ${eventData.team2.score}`);
    }

    if (event === 'match_paused') {
      const autoRestore = this.configService.get<string>('AUTO_RESTORE_ON_MATCH_POINT') === 'true';
      if (!autoRestore) {
        this.logger.log(`[AutoRestore] Deshabilitado por configuración`);
        return;
      }

      const score = this.scoreActual.get(matchidNumerico);
      if (!score) {
        this.logger.warn(`[AutoRestore] No hay score registrado para matchid ${matchidNumerico}`);
        return;
      }

      const esMatchPoint = (s: number) => s >= 12 && s % 3 === 0;
      if (!esMatchPoint(score.team1) && !esMatchPoint(score.team2)) {
        this.logger.log(`[AutoRestore] Score ${score.team1}-${score.team2}: no es match point, no se restaura`);
        return;
      }

      // Obtenemos el número de ronda actual — es el score total + 1
      const rondaActual = score.team1 + score.team2 + 1;
      const mapNumber = eventData.map_number ?? 0;
      this.logger.warn(`[AutoRestore] Match point detectado (${score.team1}-${score.team2}). Restaurando ronda ${rondaActual}`);
      await this.restaurarRonda({
        port: gamePort,
        matchid: matchidNumerico,
        mapNumber: mapNumber,
        roundNumber: (rondaActual - 1), //Si se está jugando la 15, quiero restaurar la 14.
      });
    }

    if (event === 'demo_recording_stop') {
      this.logger.log(`--- [EVENTO] DEMO GRABADA EN DISCO (MatchID: ${matchId}) ---`);
      if (this.debeApagarServidor(matchidNumerico)) {
        this.logger.log(`[Webhook] Mandando quit al puerto ${gamePort}...`);
        setTimeout(async () => {
          this.borrarConfiguracion(matchId);
          this.borrarBackupsPartido(matchidNumerico, matchId);
          this.removerMapeoId(matchidNumerico);
          this.borrarPlayerNamesPartido(matchidNumerico);
          await this.rconService.executeCommand('quit', gamePort);
        }, 1000);
      } else {
        this.logger.log(`[Webhook] Demo guardada, serie no terminada. Servidor se mantiene vivo.`);
      }
    }
  }

  async restaurarRonda(body: RestoreRoundDto): Promise<string> {
    if (body.roundNumber < 10) {
      return this.rconService.executeCommand(
        //matchzy_111_0_round01.json
        `matchzy_loadbackup matchzy_${body.matchid}_${body.mapNumber}_round0${body.roundNumber}.json`, 
        body.port,
      );
    } else {
      return this.rconService.executeCommand(
        `matchzy_loadbackup matchzy_${body.matchid}_${body.mapNumber}_round${body.roundNumber}.json`, 
        body.port,
      );
    }
  }

  /*
    LIMPIEZA POST-PARTIDO
  */
  borrarConfiguracion(matchId: string): void {
    eliminarArchivo(this.getConfigFilePath(matchId), {
      log: (msg) => this.logger.log(`[Lifecycle] ${msg}`),
      warn: (msg) => this.logger.warn(`[Lifecycle] ${msg}`),
    });
  }

  borrarBackupsPartido(matchidNumerico: number, matchId: string): void {
    const root = this.getServerRootNormalized();
    borrarBackupsTxt(path.join(root, 'game', 'csgo'), matchidNumerico, this.logger);
    borrarBackupsJson(path.join(root, 'game', 'csgo', 'MatchZyDataBackup'), matchidNumerico, matchId, this.logger);
  }

  borrarPlayerNamesPartido(matchidNumerico: number): void {
    const filePath = path.join(
      this.getServerRootNormalized(),
      'game', 'csgo', 'MatchZyPlayerNames',
      `Match_${matchidNumerico}.ini`,
    );
    eliminarArchivo(filePath, {
      log: (msg) => this.logger.log(`[Lifecycle] ${msg}`),
      warn: (msg) => this.logger.warn(`[Lifecycle] ${msg}`),
    });
  }
}