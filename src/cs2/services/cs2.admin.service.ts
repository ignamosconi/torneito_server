import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class Cs2AdminService {
  private readonly logger = new Logger(Cs2AdminService.name);

  constructor(private readonly configService: ConfigService) {}

  private validarNombre(nombre: string): void {
    const caracteresProhibidos = /[ \(\)\{\}\[\]]/;
    if (caracteresProhibidos.test(nombre)) {
      throw new BadRequestException( 
        `El nombre '${nombre}' contiene caracteres no permitidos. Eliminá los siguientes caracteres: espacios, (, ), {, }, [, ]`
      );
    }
  }


  private getCssAdminsPath(): string {
    const serverRootDir = this.configService.get<string>('CS2_SERVER_ROOT_DIR')!;
    return path.join(path.normalize(serverRootDir), 'game', 'csgo', 'addons', 'counterstrikesharp', 'configs', 'admins.json');
  }

  private getMatchzyAdminsPath(): string {
    const serverRootDir = this.configService.get<string>('CS2_SERVER_ROOT_DIR')!;
    return path.join(path.normalize(serverRootDir), 'game', 'csgo', 'cfg', 'MatchZy', 'admins.json');
  }

  private leerCssAdmins(): Record<string, { identity: string; immunity: number; flags: string[] }> {
    const filePath = this.getCssAdminsPath();
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  private leerMatchzyAdmins(): Record<string, string> {
    const filePath = this.getMatchzyAdminsPath();
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  private guardarCssAdmins(data: Record<string, any>): void {
    const filePath = this.getCssAdminsPath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  private guardarMatchzyAdmins(data: Record<string, string>): void {
    const filePath = this.getMatchzyAdminsPath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  agregarAdmin(steam64: string, nombre: string): void {
    this.validarNombre(nombre);
    const nombreConPrefijo = `[Admin]${nombre}`;

    // CSS
    const cssAdmins = this.leerCssAdmins();
    cssAdmins[nombreConPrefijo] = {
      identity: steam64,
      immunity: 100,
      flags: ['@css/root'],
    };
    this.guardarCssAdmins(cssAdmins);

    // MatchZy
    const matchzyAdmins = this.leerMatchzyAdmins();
    matchzyAdmins[steam64] = '';
    this.guardarMatchzyAdmins(matchzyAdmins);

    this.logger.log(`[Admin] Admin agregado: ${nombreConPrefijo} (${steam64})`);
  }

  listarAdmins(): { nombre: string; steam64: string }[] {
    const cssAdmins = this.leerCssAdmins();
    return Object.entries(cssAdmins).map(([nombre, data]) => ({
      nombre,
      steam64: data.identity,
    }));
  }

  editarAdmin(steam64Original: string, nuevoSteam64?: string, nuevoNombre?: string): void {
    if (nuevoNombre) this.validarNombre(nuevoNombre);
    const cssAdmins = this.leerCssAdmins();
    const matchzyAdmins = this.leerMatchzyAdmins();

    // Buscar la entrada en CSS por steam64
    const entradaActual = Object.entries(cssAdmins).find(([_, data]) => data.identity === steam64Original);
    if (!entradaActual) {
      throw new Error(`Admin con steam64 ${steam64Original} no encontrado`);
    }

    const [nombreActual, datosActuales] = entradaActual;

    // Construir nuevo nombre
    const nombreBase = nuevoNombre ? `[Admin]${nuevoNombre}` : nombreActual;
    const steam64Final = nuevoSteam64 || steam64Original;

    // Borrar entrada vieja y crear nueva en CSS
    delete cssAdmins[nombreActual];
    cssAdmins[nombreBase] = {
      ...datosActuales,
      identity: steam64Final,
    };
    this.guardarCssAdmins(cssAdmins);

    // Actualizar MatchZy si cambió el steam64
    if (nuevoSteam64 && nuevoSteam64 !== steam64Original) {
      delete matchzyAdmins[steam64Original];
      matchzyAdmins[steam64Final] = '';
      this.guardarMatchzyAdmins(matchzyAdmins);
    }

    this.logger.log(`[Admin] Admin editado: ${nombreActual} → ${nombreBase} (${steam64Original} → ${steam64Final})`);
  }

  removerAdmin(steam64: string): void {
    const cssAdmins = this.leerCssAdmins();
    const matchzyAdmins = this.leerMatchzyAdmins();

    const entradaActual = Object.entries(cssAdmins).find(([_, data]) => data.identity === steam64);
    if (!entradaActual) {
      throw new Error(`Admin con steam64 ${steam64} no encontrado`);
    }

    const [nombre] = entradaActual;
    delete cssAdmins[nombre];
    delete matchzyAdmins[steam64];

    this.guardarCssAdmins(cssAdmins);
    this.guardarMatchzyAdmins(matchzyAdmins);

    this.logger.log(`[Admin] Admin removido: ${nombre} (${steam64})`);
  }

  obtenerTodosLosSteam64(): { steam64: string; nombre: string }[] {
    // Leemos desde CSS que tiene nombre y steam64
    return this.listarAdmins();
  }
}