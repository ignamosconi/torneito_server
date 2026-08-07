import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';
import type { Response } from 'express';
import { IStatsService } from '../interfaces/stats.service.interface';
import { StatsEntryDto } from '../dto/stats-entry.dto';
import { streamZipDeArchivos } from '../../shared/helpers/zip.helper';

@Injectable()
export class StatsService implements IStatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(
    private readonly configService: ConfigService
  ) {}

  private getStatsDir(matchid: number): string {
    const serverRootDir = this.configService.get<string>('CS2_SERVER_ROOT_DIR')!;
    return path.join(path.normalize(serverRootDir), 'game', 'csgo', 'MatchZy_Stats', matchid.toString());
  }

  private getCsvPath(matchid: number, mapNumber: number): string {
    return path.join(this.getStatsDir(matchid), `match_data_map${mapNumber}_${matchid}.csv`);
  }

  private parsearCsv(filePath: string): StatsEntryDto[] {
    const contenido = fs.readFileSync(filePath, 'utf-8');

    /*
      csv-parse/sync lee el archivo completo y devuelve un array de objetos.
      - columns: true → usa la primera fila como nombres de clave (matchid, steamid64, kills, etc.)
      - cast: true → convierte automáticamente números ("2" → 2) y booleanos
      - skip_empty_lines: true → ignora filas vacías al final del archivo
      Si MatchZy agrega columnas nuevas en el futuro, aparecerán automáticamente
      en el objeto pero no estarán tipadas en MapStatsEntryDto — habría que añadirlas ahí.
    */
    return parse(contenido, {
      columns: true,
      cast: (value, context) => {
        // steamid64 siempre como string para evitar pérdida de precisión numérica en JS
        if (context.column === 'steamid64') return value;
        return context.quoting ? value : (isNaN(Number(value)) ? value : Number(value));
      },
      skip_empty_lines: true,
    }) as StatsEntryDto[];
  }

  obtenerStatsMapa(matchid: number, mapNumber: number): StatsEntryDto[] {
    const statsDir = this.getStatsDir(matchid);
    if (!fs.existsSync(statsDir)) {
      throw new NotFoundException(`No existen stats para la serie ${matchid}`);
    }

    const csvPath = this.getCsvPath(matchid, mapNumber);
    if (!fs.existsSync(csvPath)) {
      throw new NotFoundException(`No existen stats para el mapa ${mapNumber} de la serie ${matchid}`);
    }

    this.logger.log(`[Stats] Parseando stats: match_data_map${mapNumber}_${matchid}.csv`);
    return this.parsearCsv(csvPath);
  }

  async descargarStatsSerieZip(matchid: number, res: Response): Promise<void> {
    const statsDir = this.getStatsDir(matchid);
    if (!fs.existsSync(statsDir)) {
      throw new NotFoundException(`No existen stats para la serie ${matchid}`);
    }

    const csvs: string[] = [];
    let mapNumber = 0;
    while (true) {
      const csvPath = this.getCsvPath(matchid, mapNumber);
      if (!fs.existsSync(csvPath)) break;
      csvs.push(csvPath);
      mapNumber++;
    }

    if (csvs.length === 0) {
      throw new NotFoundException(`No se encontraron CSVs para la serie ${matchid}`);
    }

    this.logger.log(`[Stats] Enviando ZIP con ${csvs.length} CSV(s) de la serie ${matchid}`);

    await streamZipDeArchivos(csvs, `stats_${matchid}.zip`, res);
  }
}