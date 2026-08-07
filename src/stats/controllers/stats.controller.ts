import { Controller, Get, Inject, Logger, Param, ParseIntPipe, Res } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { IStatsController } from '../interfaces/stats.controller.interface';
import type { IStatsService } from '../interfaces/stats.service.interface';
import { STATS_SERVICE } from '../stats.tokens';
import { StatsEntryDto } from '../dto/stats-entry.dto';

@ApiTags('stats')
@Controller('stats')
export class StatsController implements IStatsController {
  private readonly logger = new Logger(StatsController.name);

  constructor(
    @Inject(STATS_SERVICE) private readonly statsService: IStatsService,
  ) {}

  @Get(':matchid/:mapNumber')
  @ApiOperation({ summary: 'Obtener stats de un mapa', description: 'Devuelve las estadísticas de todos los jugadores en un mapa específico, parseadas del CSV de MatchZy.' })
  @ApiParam({ name: 'matchid', description: 'MatchID numérico de la serie', example: 333 })
  @ApiParam({ name: 'mapNumber', description: 'Número de mapa (0 = primer mapa, 1 = segundo, etc.)', example: 0 })
  @ApiResponse({ status: 200, description: 'Array de stats por jugador', type: [StatsEntryDto] })
  @ApiResponse({ status: 404, description: 'Serie o mapa no encontrado' })
  obtenerStatsMapa(
    @Param('matchid', ParseIntPipe) matchid: number,
    @Param('mapNumber', ParseIntPipe) mapNumber: number,
  ): StatsEntryDto[] {
    this.logger.log(`[GET /stats/${matchid}/${mapNumber}] Obteniendo stats`);
    return this.statsService.obtenerStatsMapa(matchid, mapNumber);
  }

  @Get(':matchid')
  @ApiOperation({ summary: 'Descargar stats completas de una serie', description: 'Descarga un ZIP con todos los CSVs de stats disponibles de la serie.' })
  @ApiParam({ name: 'matchid', description: 'MatchID numérico de la serie', example: 333 })
  @ApiResponse({ status: 200, description: 'ZIP con todos los CSVs de la serie' })
  @ApiResponse({ status: 404, description: 'Serie no encontrada o sin stats' })
  async descargarStatsSerieZip(
    @Param('matchid', ParseIntPipe) matchid: number,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(`[GET /stats/${matchid}] Descargando ZIP de stats`);
    await this.statsService.descargarStatsSerieZip(matchid, res);
  }
}