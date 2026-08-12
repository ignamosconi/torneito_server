import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Rcon } from 'rcon-client';
import { IRconService } from '../interfaces/rcon.service.interface';

@Injectable()
export class RconService implements IRconService {
  private readonly logger = new Logger(RconService.name);

  constructor(private readonly configService: ConfigService) {}

  async executeCommand(command: string, port: number): Promise<string> {
    const host = this.configService.get<string>('CS2_RCON_HOST') || '127.0.0.1';
    const password = this.configService.get<string>('CS2_RCON_PASSWORD')!;

    let rconClient: Rcon | null = null;

    try {
      this.logger.log(`[RCON] Conectando a ${host}:${port}...`);
      rconClient = await Rcon.connect({ host, port, password, timeout: 1500 });

      // Capturamos errores de socket asíncronos (ECONNRESET, etc.)
      // que rcon-client emite como eventos en lugar de rechazar la promesa
      rconClient.on('error', (err) => {
        this.logger.warn(`[RCON] Error de socket en puerto ${port}: ${err.message}`);
      });

      this.logger.log(`[RCON] Enviando: "${command}"`);
      return await rconClient.send(command);
    } catch (error) {
      this.logger.warn(`[RCON] Error en puerto ${port}: ${error}`);
      return `Error de conexión RCON en puerto ${port}. Detalle: ${error}`;
    } finally {
      if (rconClient) {
        try {
          await rconClient.end();
        } catch (_) {
          // Si el socket ya está cerrado, ignoramos el error del end()
        }
      }
    }
  }
}