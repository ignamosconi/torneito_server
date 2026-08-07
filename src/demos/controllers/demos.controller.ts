import { Controller, Get, HttpCode, HttpStatus, Inject, Logger, Param, ParseIntPipe, Res } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { IDemosController } from '../interfaces/demos.controller.interface';
import type { IDemosService } from '../interfaces/demos.service.interface';
import { DEMOS_SERVICE } from '../demos.tokens';

@ApiTags('demos')
@Controller('demos')
export class DemosController implements IDemosController {
  private readonly logger = new Logger(DemosController.name);

  constructor(
    @Inject(DEMOS_SERVICE) private readonly demosService: IDemosService,
  ) {}

  @Get(':matchid/:mapNumber')
  @ApiOperation({ summary: 'Descargar demo de un mapa', description: 'Descarga el archivo .dem de un mapa específico de una serie.' })
  @ApiParam({ name: 'matchid', description: 'MatchID numérico de la serie', example: 777 })
  @ApiParam({ name: 'mapNumber', description: 'Número de mapa (0 = primer mapa, 1 = segundo, etc.)', example: 0 })
  @ApiResponse({ status: 200, description: 'Archivo .dem de la demo' })
  @ApiResponse({ status: 404, description: 'Serie o mapa no encontrado' })
  async descargarDemo(
    @Param('matchid', ParseIntPipe) matchid: number,
    @Param('mapNumber', ParseIntPipe) mapNumber: number,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(`[GET /demos/${matchid}/${mapNumber}] Descargando demo`);
    await this.demosService.descargarDemo(matchid, mapNumber, res);
  }

  @Get(':matchid')
  @ApiOperation({ summary: 'Descargar todas las demos de una serie', description: 'Descarga un ZIP con todas las demos disponibles de la serie.' })
  @ApiParam({ name: 'matchid', description: 'MatchID numérico de la serie', example: 777 })
  @ApiResponse({ status: 200, description: 'ZIP con todas las demos de la serie' })
  @ApiResponse({ status: 404, description: 'Serie no encontrada o sin demos' })
  async descargarDemosZip(
    @Param('matchid', ParseIntPipe) matchid: number,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(`[GET /demos/${matchid}] Descargando ZIP de demos`);
    await this.demosService.descargarDemosZip(matchid, res);
  }
}