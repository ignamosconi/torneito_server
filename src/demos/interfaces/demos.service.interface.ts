import type { Response } from 'express';

export interface IDemosService {
  descargarDemo(matchid: number, mapNumber: number, res: Response): Promise<void>;
  descargarDemosZip(matchid: number, res: Response): Promise<void>;
}