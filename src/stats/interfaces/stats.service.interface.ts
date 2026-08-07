import type { Response } from 'express';
import { StatsEntryDto } from '../dto/stats-entry.dto';

export interface IStatsService {
  obtenerStatsMapa(matchid: number, mapNumber: number): StatsEntryDto[];
  descargarStatsSerieZip(matchid: number, res: Response): Promise<void>;
}