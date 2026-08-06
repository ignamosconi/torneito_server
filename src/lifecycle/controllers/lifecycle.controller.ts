import { Inject } from '@nestjs/common';
import type { ILifecycleService } from '../interfaces/lifecycle.service.interface';
import type { IRconService } from 'src/rcon/interfaces/rcon.service.interface';
import { LIFECYCLE_SERVICE } from '../lifecycle.tokens';
import { RCON_SERVICE } from 'src/rcon/rcon.tokens';
import { Body, Controller, Get, HttpCode, HttpStatus, Headers, Logger, Param, Post, Res, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ILifecycleController } from '../interfaces/lifecycle.controller.interface';
import { StartMatchDto } from '../dto/start-match.dto';
import { ServerReadyDto } from '../dto/server-ready.dto';
import { RestoreRoundDto } from '../dto/restore-round.dto';
import { MatchZyEventDto } from '../dto/matchzy-event.dto';
import { StatusDto } from 'src/shared/dto/status.dto';
import { ReceivedDto } from 'src/shared/dto/received.dto';

@ApiTags('lifecycle')
@Controller('lifecycle')
export class LifecycleController implements ILifecycleController {
  private readonly logger = new Logger(LifecycleController.name);

  constructor(
    @Inject(LIFECYCLE_SERVICE) private readonly lifecycleService: ILifecycleService,
    @Inject(RCON_SERVICE) private readonly rconService: IRconService,
) {}

  @Post('start-match')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar partido', description: 'Genera la configuración JSON para MatchZy, levanta el ejecutable del servidor CS2 y dispara el polling de RCON.' })
  @ApiResponse({ status: 200, description: 'Servidor inicializado y RCON en cola' })
  @ApiResponse({ status: 400, description: 'Payload inválido' })
  async startMatch(@Body() body: StartMatchDto): Promise<StatusDto> {
    this.logger.log(`[POST /lifecycle/start-match] Iniciando partido: ${body.matchId}`);
    await this.lifecycleService.generarConfiguracionYPlantar(body.matchId, body.config, body.port ?? 27015);
    return { status: 'success', message: 'Servidor inicializado y RCON en cola' };
  }

  @Get('config/:matchId')
  @ApiOperation({ summary: 'Obtener configuración de partido', description: 'Endpoint consumido internamente por MatchZy para leer la configuración del partido en formato JSON.' })
  @ApiParam({ name: 'matchId', description: 'Identificador de plataforma del partido', example: 'SERIE_BO3_IGNA_02' })
  @ApiResponse({ status: 200, description: 'Configuración del partido en JSON' })
  @ApiResponse({ status: 404, description: 'Configuración no encontrada' })
  async getMatchConfig(@Param('matchId') matchId: string, @Res() res: Response): Promise<Response> {
    this.logger.log(`[GET /lifecycle/config/${matchId}] Leyendo configuración`);
    const config = this.lifecycleService.obtenerConfiguracionLocal(matchId);
    if (!config) return res.status(HttpStatus.NOT_FOUND).json({ error: 'Configuración no encontrada' });
    return res.status(HttpStatus.OK).json(config);
  }

  @Post('events')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('matchzy-webhook-token')
  @ApiOperation({
    summary: 'Webhook de eventos MatchZy',
    description: `
      Endpoint privado al que MatchZy envía todos los eventos del partido en tiempo real.
      Requiere token Bearer. Eventos soportados:
      series_start, series_end, player_ready, knife_round_started, knife_round_ended,
      warmup_ended, going_live, round_started, round_end, side_swap, halftime_started,
      map_result, demo_recording_start, demo_recording_stop,
      player_disconnect, match_paused, match_unpaused.
    `,
  })
  @ApiResponse({ status: 200, description: 'Evento procesado correctamente' })
  @ApiResponse({ status: 401, description: 'Token de autorización ausente o inválido' })
  @ApiResponse({ status: 400, description: 'Payload inválido (campo extra no reconocido o tipo incorrecto)' })
  async handleMatchEvents(
    @Body() eventData: MatchZyEventDto,
    @Headers('authorization') authHeader: string,
  ): Promise<ReceivedDto> {
    if (!authHeader?.startsWith('Bearer ')) throw new UnauthorizedException('Token de autorización inválido o ausente');
    this.logger.log(`[POST /lifecycle/events] Evento: "${eventData.event}" (matchid: ${eventData.matchid})`);
    await this.lifecycleService.procesarEvento(eventData);
    return { received: true };
  }

  @Post('server-ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Servidor CS2 listo', description: 'El servidor CS2 notifica al backend que terminó de cargar el mapa y el plugin MatchZy está activo. Dispara la inyección de configuración vía RCON.' })
  @ApiResponse({ status: 200, description: 'Inyección de MatchZy disparada' })
  async handleServerReady(@Body() body: ServerReadyDto): Promise<StatusDto> {
    this.logger.log(`[POST /lifecycle/server-ready] Servidor listo en puerto ${body.port}`);
    this.lifecycleService.ejecutarInyeccionMatchZy(body.matchId, body.port);
    return { status: 'acknowledged' };
  }

  @Post('restore-round')
  @ApiOperation({ summary: 'Restaurar ronda', description: 'Carga un backup de ronda específico mediante RCON. Útil para recuperarse de problemas técnicos durante un partido.' })
  @ApiResponse({ status: 200, description: 'Comando de restauración enviado' })
  @ApiResponse({ status: 400, description: 'Payload inválido' })
  async restoreRound(@Body() body: RestoreRoundDto): Promise<string> {
    this.logger.warn(`[POST /lifecycle/restore-round] Ronda ${body.roundNumber} en puerto ${body.port}`);
    return this.rconService.executeCommand(
        `matchzy_loadbackup matchzy_match_${body.matchid}_round_${body.roundNumber}`, 
        body.port,
    );
  }
}