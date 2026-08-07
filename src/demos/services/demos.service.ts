import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import type { Response } from 'express';
import { IDemosService } from '../interfaces/demos.service.interface';
import { streamZipDeArchivos } from '../../shared/helpers/zip.helper';

@Injectable()
export class DemosService implements IDemosService {
  private readonly logger = new Logger(DemosService.name);

  constructor(private readonly configService: ConfigService) {}

  private getDemosDir(matchid: number): string {
    const serverRootDir = this.configService.get<string>('CS2_SERVER_ROOT_DIR')!;
    return path.join(path.normalize(serverRootDir), 'game', 'csgo', 'MatchZy', 'Demos', matchid.toString());
  }

  private getDemoPath(matchid: number, mapNumber: number): string {
    return path.join(this.getDemosDir(matchid), `demo_map${mapNumber}_${matchid}.dem`);
  }

  async descargarDemo(matchid: number, mapNumber: number, res: Response): Promise<void> {
    const demosDir = this.getDemosDir(matchid);
    if (!fs.existsSync(demosDir)) {
      throw new NotFoundException(`No existe ninguna demo para la serie ${matchid}`);
    }

    const demoPath = this.getDemoPath(matchid, mapNumber);
    if (!fs.existsSync(demoPath)) {
      throw new NotFoundException(`No existe la demo del mapa ${mapNumber} para la serie ${matchid}`);
    }

    this.logger.log(`[Demos] Enviando demo: ${path.basename(demoPath)}`);
    res.download(demoPath);
  }

  async descargarDemosZip(matchid: number, res: Response): Promise<void> {
    const demosDir = this.getDemosDir(matchid);
    if (!fs.existsSync(demosDir)) {
        throw new NotFoundException(`No existe ninguna demo para la serie ${matchid}`);
    }

    const demos: string[] = [];
    let mapNumber = 0;
    while (true) {
        const demoPath = this.getDemoPath(matchid, mapNumber);
        if (!fs.existsSync(demoPath)) break;
        demos.push(demoPath);
        mapNumber++;
    }

    if (demos.length === 0) {
        throw new NotFoundException(`No se encontraron demos para la serie ${matchid}`);
    }

    this.logger.log(`[Demos] Enviando ZIP con ${demos.length} demo(s) de la serie ${matchid}`);

    await streamZipDeArchivos(demos, `demos_${matchid}.zip`, res);
  }
}