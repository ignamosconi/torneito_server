import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RconService } from '../services/rcon.service';
import { IRconController } from '../interfaces/rcon.controller.interface';
import { SendCommandDto } from '../dto/send-command.dto';

@ApiTags('rcon')
@Controller('rcon')
export class RconController implements IRconController {
  private readonly logger = new Logger(RconController.name);

  constructor(private readonly rconService: RconService) {}

  @Post('cmd')
  @ApiOperation({ summary: 'Ejecutar comando RCON', description: 'Envía un comando de consola directamente al servidor CS2 vía RCON. Útil para depuración o acciones manuales.' })
  @ApiResponse({ status: 200, description: 'Respuesta del servidor CS2 al comando ejecutado', type: String })
  @ApiResponse({ status: 400, description: 'Cuerpo de la petición inválido (comando vacío, puerto fuera de rango, etc.)' })
  async sendCustomCommand(@Body() body: SendCommandDto): Promise<string> {
    this.logger.log(`[cmd] Ejecutando: "${body.command}" en puerto ${body.port ?? 27015}`);
    return this.rconService.executeCommand(body.command, body.port);
  }
}