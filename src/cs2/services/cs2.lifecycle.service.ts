import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process'; 
import { Cs2RconService } from './cs2.rcon.service';
import { Cs2AdminService } from './cs2.admin.service';

@Injectable()
export class Cs2LifecycleService {
  private readonly logger = new Logger(Cs2LifecycleService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly rconService: Cs2RconService,
    private readonly adminService: Cs2AdminService,
  ) {}

  /*
    CIERRE DE SERVIDOR
  */
  // Guardamos en memoria los matchid que ya enviaron el evento de cierre de serie
  private seriesFinalizadas = new Set<number>();
  private matchIdMap = new Map<number, string>(); // matchid numérico → matchId string
  private matchPortMap = new Map<number, number>(); // matchid numérico → puerto
  private matchIdInversoMap = new Map<string, number>(); // matchId string → matchid numérico

  /**
   * Registra que la serie llegó a su fin (ej: el 2-0 del BO3)
   */
  marcarSerieTerminada(matchId: number): void {
    this.seriesFinalizadas.add(matchId);
    this.logger.log(`[Lifecycle] MatchID ${matchId} anotado como SERIE_FINALIZADA. Esperando detención de la demo...`);
  }

  /**
   * Revisa si la serie ya había terminado. Si es así, limpia la memoria y da luz verde para apagar.
   */
  debeApagarServidor(matchId: number): boolean {
    if (this.seriesFinalizadas.has(matchId)) {
      this.seriesFinalizadas.delete(matchId); // Limpiamos memoria
      return true;
    }
    return false;
  }

  obtenerMatchIdPlataforma(matchidNumerico: number): string | undefined {
    return this.matchIdMap.get(matchidNumerico);
  }

  removerMapeoId(matchidNumerico: number): void {
    const matchId = this.matchIdMap.get(matchidNumerico);
    if (matchId) this.matchIdInversoMap.delete(matchId);
    this.matchIdMap.delete(matchidNumerico);
    this.matchPortMap.delete(matchidNumerico)
  }

  obtenerPortPartido(matchidNumerico: number): number {
    return this.matchPortMap.get(matchidNumerico) || 27015;
  }



  /**
   * Genera el JSON de configuración en la carpeta cfg del servidor de CS2 y levanta el ejecutable dedicado
   */
  private getConfigFilePath(matchId: string): string {
    const serverRootDir = this.configService.get<string>('CS2_SERVER_ROOT_DIR')!;
    const normalizedRootDir = path.normalize(serverRootDir);
    return path.join(normalizedRootDir, 'game', 'csgo', 'cfg', 'StartServerJsons', `match_${matchId}.json`);
  }

  async generarConfiguracionYPlantar(matchId: string, configuracionData: any, gamePort: number): Promise<void> {
    try {
      const serverRootDir = this.configService.get<string>('CS2_SERVER_ROOT_DIR')!;
      const fileName = `match_${matchId}.json`;
      
      // Normalizamos la ruta del .env para que Windows no reniegue con las barras
      const normalizedRootDir = path.normalize(serverRootDir);

      const filePath = this.getConfigFilePath(matchId);
      const targetDir = path.dirname(filePath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Guardar archivo en disco de forma síncrona
      fs.writeFileSync(filePath, JSON.stringify(configuracionData, null, 2), 'utf-8');
      this.logger.log(`[+] Archivo de configuración ${fileName} generado con éxito.`);

      this.matchIdMap.set(configuracionData.matchid, matchId);
      this.logger.log(`[Lifecycle] Mapeando matchid numérico ${configuracionData.matchid} → "${matchId}"`);

      this.matchPortMap.set(configuracionData.matchid, gamePort);
      this.logger.log(`[Lifecycle] Mapeando matchid numérico ${configuracionData.matchid} → puerto ${gamePort}`);

      this.matchIdInversoMap.set(matchId, configuracionData.matchid);
      this.logger.log(`[Lifecycle] Mapeando matchId string "${matchId}" → matchid numérico ${configuracionData.matchid}`);


      // LÓGICA DE EJECUCIÓN SEGÚN OS
      this.logger.log(`[+] Lanzando CS2 Dedicado en puerto ${gamePort}...`);
      
      const rconPassword = this.configService.get<string>('CS2_RCON_PASSWORD')!;
      const tvPort = gamePort + 1000;
      const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

      const args = [
        '-dedicated',
        '-usercon',
        '-console',
        '-secure',
        '+game_type', '0',
        '+game_mode', '1',
        '+map', 'de_mirage',
        '+ip', '0.0.0.0',
        '-port', gamePort.toString(),
        '+tv_port', tvPort.toString(),
        '+rcon_password', rconPassword,
        '+tv_enable', '1'
      ];

      let cs2Process;

      if (isProduction) {
        // Linux
        const executablePath = path.join(normalizedRootDir, 'game', 'bin', 'linuxsteamrt64', 'cs2');
        this.logger.log(`[Proceso CS2] Ejecutando (Linux): ${executablePath} con argumentos: ${args.join(' ')}`);
        cs2Process = spawn(executablePath, args, {
          detached: true,
          stdio: 'ignore',
        });
      } else {
        // Windows
        const executablePath = path.join(normalizedRootDir, 'game', 'bin', 'win64', 'cs2.exe');
        this.logger.log(`[Proceso CS2] Ejecutando (Windows): ${executablePath} con argumentos: ${args.join(' ')}`);
        cs2Process = spawn('cmd.exe', ['/c', 'start', '""', executablePath, ...args], {
          detached: true,
          stdio: 'ignore',
        });
      }

      cs2Process.unref();

      this.iniciarPollingRcon(matchId, gamePort, configuracionData.matchid);

    } catch (error) {
      this.logger.error(`[-] Error al generar configuración o levantar el servidor: ${error}`);
      throw error;
    }
  }

  /**
   * Devuelve el contenido del JSON generado para el endpoint estático
   */
  obtenerConfiguracionLocal(matchId: string): any {
    const serverRootDir = this.configService.get<string>('CS2_SERVER_ROOT_DIR')!;
    const fileName = `match_${matchId}.json`;
    const normalizedRootDir = path.normalize(serverRootDir);
    
    const filePath = path.join(normalizedRootDir, 'game', 'csgo', 'cfg', 'StartServerJsons', fileName);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const rawData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(rawData);
  }

  /**
   * Interroga al servidor cada 2 segundos. Apenas responde, ejecuta la inyección.
   */
  private iniciarPollingRcon(matchId: string, gamePort: number, matchidNumerico?: number): void {
    this.logger.log(`[Polling RCON] Esperando de forma activa que el puerto ${gamePort} esté listo...`);
    let intentos = 0;
    const maxIntentos = 30; // 30 intentos * 2s = 1 minuto de tiempo de espera máximo por si se cuelga

    const interval = setInterval(async () => {
      intentos++;
      try {
        // Ejecutamos un comando básico e inocuo para ver si el socket RCON ya responde
        const respuesta = await this.rconService.executeCommand('echo ping_backend', gamePort);
        
        // Si hay respuesta válida y no contiene el string de error controlado de tu RconService
        if (respuesta && !respuesta.includes('Error de conexión RCON')) {
          this.logger.log(`[Polling RCON] ¡Servidor detectado VIVO en el intento nº ${intentos}! (Tardó aprox ${intentos * 2}s)`);
          clearInterval(interval);
          
          // Ejecutamos la configuración de MatchZy inmediatamente
          await this.ejecutarInyeccionMatchZy(matchId, gamePort, matchidNumerico);
        }
      } catch (error) {
        // Las caídas por ECONNREFUSED entran acá mientras el server carga. Las ignoramos.
      }

      if (intentos >= maxIntentos) {
        this.logger.error(`[Polling RCON] El servidor de CS2 en el puerto ${gamePort} superó el tiempo límite de carga.`);
        clearInterval(interval);
      }
    }, 2000); // Frecuencia de muestreo: 2 segundos
  }

  /**
   * Inyecta las directivas de MatchZy y el webhook de tracking una vez que el servidor está online
   */
  async ejecutarInyeccionMatchZy(matchId: string, gamePort: number, matchidNumerico?: number): Promise<void> {
    try {
      const backendUrl = this.configService.get<string>('BACKEND_WEBHOOK_URL')!; 
      const secretToken = this.configService.get<string>('MATCHZY_WEBHOOK_TOKEN')!;

      this.logger.log(`[RCON Inyección] Conectando a MatchZy para estructurar la serie...`);

      // 1. Configurar URL de Webhooks para capturar eventos en tiempo real
      const webhooksUrl = `${backendUrl}/cs2/events`;
      this.logger.log(`[RCON Inyección] Configurando URL de Webhooks: ${webhooksUrl}`);

      // 1.5 - CONFIGURACIÓN DE BACKUPS NATIVOS DE VALVE / MATCHZY
      this.logger.log(`[RCON Inyección] Inyectando cVars para backups nativos de CS2...`);
      await this.rconService.executeCommand(`mp_backup_round_auto 1`, gamePort);
      await this.rconService.executeCommand(`mp_backup_round_file "backup"`, gamePort);
      await this.rconService.executeCommand(`mp_backup_round_file_capacity 100`, gamePort);
      await this.rconService.executeCommand(`mp_backup_round_file_pattern "%prefix%_round%round%.txt"`, gamePort);

      // 2. Inyectar Headers de seguridad obligatorios
      await this.rconService.executeCommand(`matchzy_remote_log_header_key "Authorization"`, gamePort);
      await this.rconService.executeCommand(`matchzy_remote_log_header_value "Bearer ${secretToken}"`, gamePort);

      // 3. Comando clave para chupar la config desde tu endpoint de NestJS
      const configUrl = `${backendUrl}/cs2/config/${matchId}`;
      const matchidNumericoStr = matchidNumerico?.toString() || matchId;

      await this.rconService.executeCommand(`matchzy_demo_path "MatchZy/Demos/${matchidNumericoStr}/"`, gamePort);
      await this.rconService.executeCommand(`matchzy_demo_name_format "demo_map{MAPNUMBER}_${matchidNumericoStr}"`, gamePort);
      const loadMatchCommand = `matchzy_loadmatch_url "${configUrl}"`;
      
      this.logger.log(`[RCON Inyección] Ejecutando comando de carga: ${loadMatchCommand}`);
      const response = await this.rconService.executeCommand(loadMatchCommand, gamePort);
      this.logger.log(`[RCON Inyección] MatchZy respondió: ${response || 'OK (Silencioso)'}`);

      // 4. Agregar todos los admins como espectadores
      const admins = this.adminService.obtenerTodosLosSteam64();
      this.logger.log(`[RCON Inyección] Agregando ${admins.length} admins como espectadores...`);
      for (const admin of admins) {
        await this.rconService.executeCommand(
          `matchzy_addplayer ${admin.steam64} spec ${admin.nombre}`,
          gamePort
        );
        this.logger.log(`[RCON Inyección] Admin agregado como spec: ${admin.nombre} (${admin.steam64})`);
      }

    } catch (error) {
      this.logger.error(`[-] Error crítico en la inicialización por RCON: ${error}`);
    }
  }


  borrarConfiguracion(matchId: string): void {
    const filePath = this.getConfigFilePath(matchId);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      this.logger.log(`[Lifecycle] Archivo de configuración match_${matchId}.json eliminado.`);
    } else {
      this.logger.warn(`[Lifecycle] No se encontró el archivo match_${matchId}.json para eliminar.`);
    }
  }

  borrarBackupsPartido(matchidNumerico: number, matchId: string): void {
    const serverRootDir = this.configService.get<string>('CS2_SERVER_ROOT_DIR')!;
    const normalizedRootDir = path.normalize(serverRootDir);

    const csgoDir = path.join(normalizedRootDir, 'game', 'csgo');                           // Ruta raíz de csgo (donde Valve guarda los .txt)
    const backupDir = path.join(normalizedRootDir, 'game', 'csgo', 'MatchZyDataBackup');   // Ruta de MatchZy (donde guarda los .json)


    // 1. Borrar los archivos .txt nativos de Valve en la raíz de csgo/
    if (fs.existsSync(csgoDir)) {
      try {
        const archivosCsgo = fs.readdirSync(csgoDir);
        // Filtra archivos tipo: matchzy_777_0_round05.txt
        const txtsDeLaSerie = archivosCsgo.filter(
          (f) => f.startsWith(`matchzy_${matchidNumerico}_`) && f.endsWith('.txt'),
        );

        for (const archivo of txtsDeLaSerie) {
          fs.unlinkSync(path.join(csgoDir, archivo));
          this.logger.log(`[Lifecycle] Backup TXT de Valve eliminado: ${archivo}`);
        }
      } catch (error) {
        this.logger.error(`[Lifecycle] Error al limpiar archivos TXT en csgo/:`, error);
      }
    }


    // 2. Borrar los archivos .json y matchbackup de MatchZy en MatchZyDataBackup/
    if (fs.existsSync(backupDir)) {
      try {
        const archivosBackup = fs.readdirSync(backupDir);
        // Filtra archivos tipo: matchzy_777_0_round05.json
        const jsonsDeLaSerie = archivosBackup.filter(
          (f) => f.startsWith(`matchzy_${matchidNumerico}_`) && f.endsWith('.json'),
        );

        for (const archivo of jsonsDeLaSerie) {
          fs.unlinkSync(path.join(backupDir, archivo));
          this.logger.log(`[Lifecycle] Backup JSON eliminado: ${archivo}`);
        }

        // Borrar el matchbackup sin extensión
        const matchbackupPath = path.join(backupDir, `matchbackup_${matchId}`);
        if (fs.existsSync(matchbackupPath)) {
          fs.unlinkSync(matchbackupPath);
          this.logger.log(`[Lifecycle] Matchbackup eliminado: matchbackup_${matchId}`);
        }
      } catch (error) {
        this.logger.error(`[Lifecycle] Error al limpiar carpeta MatchZyDataBackup:`, error);
      }
    } else {
      this.logger.warn(`[Lifecycle] No se encontró el directorio de backups: ${backupDir}`);
    }
  }

  borrarPlayerNamesPartido(matchidNumerico: number): void {
    const serverRootDir = this.configService.get<string>('CS2_SERVER_ROOT_DIR')!;
    const normalizedRootDir = path.normalize(serverRootDir);
    const playerNamesFile = path.join(normalizedRootDir, 'game', 'csgo', 'MatchZyPlayerNames', `Match_${matchidNumerico}.ini`);

    if (fs.existsSync(playerNamesFile)) {
      fs.unlinkSync(playerNamesFile);
      this.logger.log(`[Lifecycle] PlayerNames eliminado: Match_${matchidNumerico}.ini`);
    } else {
      this.logger.warn(`[Lifecycle] No se encontró Match_${matchidNumerico}.ini para eliminar.`);
    }
  }
}