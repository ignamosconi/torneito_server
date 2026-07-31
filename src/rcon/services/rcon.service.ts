import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Rcon } from 'rcon-client';
import { IRconService } from '../interfaces/rcon.service.interface';

@Injectable()
export class RconService implements IRconService {
  private readonly logger = new Logger(RconService.name);

  constructor(private readonly configService: ConfigService) {}

  async executeCommand(command: string, customPort?: number): Promise<string> {
    const host = this.configService.get<string>('CS2_RCON_HOST') || '127.0.0.1';
    const password = this.configService.get<string>('CS2_RCON_PASSWORD')!;
    const port = customPort ?? this.configService.get<number>('CS2_RCON_PORT') ?? 27015;

    let rconClient: Rcon | null = null;

    try {
      this.logger.log(`[RCON] Conectando a ${host}:${port}...`);

      // Timeout de 1500ms: menor que el intervalo de polling (2000ms)
      // Evita que conexiones fallidas se acumulen en el event loop
      rconClient = await Rcon.connect({ host, port, password, timeout: 1500 });

      this.logger.log(`[RCON] Enviando: "${command}"`);
      return await rconClient.send(command);
    } catch (error) {
      this.logger.error(`[RCON] Error en puerto ${port}: ${error}`);
      return `Error de conexión RCON en puerto ${port}. ¿El servidor está apagado? Detalle: ${error}`;
    } finally {
      if (rconClient) await rconClient.end();
    }
  }
}