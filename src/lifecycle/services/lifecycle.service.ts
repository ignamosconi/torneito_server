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

@Injectable()
export class LifecycleService implements ILifecycleService {
  private readonly logger = new Logger(LifecycleService.name);

  /*
    ESTADO EN MEMORIA
  */
  private readonly seriesFinalizadas = new Set<number>();
  private readonly matchIdMap = new Map<number, string>();           // numerico → string
  private readonly matchPortMap = new Map<number, number>();        // numerico → puerto
  private readonly matchIdInversoMap = new Map<string, number>();  // string → numerico
  private readonly puertosActivos = new Set<number>();            // fuente de verdad de puertos ocupados

  constructor(
    private readonly configService: ConfigService,
    @Inject(RCON_SERVICE) private readonly rconService: IRconService,
    @Inject(ADMIN_SERVICE) private readonly adminService: IAdminService,
  ) {}

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