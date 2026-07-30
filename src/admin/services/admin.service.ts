import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { IAdminService, AdminEntry } from '../interfaces/admin.service.interface';
import { leerJsonDeArchivo, guardarJsonEnArchivo } from '../../shared/helpers/file.helper';

/** Forma de una entrada de admin en el archivo admins.json de CounterStrikeSharp */
interface CssAdminEntry {
  identity: string;
  immunity: number;
  flags: string[];
}

@Injectable()
export class AdminService implements IAdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly configService: ConfigService) {}

  // Validaciones
  private validarNombre(nombre: string): void {
    const caracteresProhibidos = /[ \(\)\{\}\[\]]/;
    if (caracteresProhibidos.test(nombre)) {
      throw new BadRequestException(
        `El nombre '${nombre}' contiene caracteres no permitidos. Eliminá espacios, (, ), {, }, [, ]`,
      );
    }
  }

  // Rutas de archivos
  private getCssAdminsPath(): string {
    const serverRootDir = this.configService.get<string>('CS2_SERVER_ROOT_DIR')!;
    return path.join(path.normalize(serverRootDir), 'game', 'csgo', 'addons', 'counterstrikesharp', 'configs', 'admins.json');
  }

  private getMatchzyAdminsPath(): string {
    const serverRootDir = this.configService.get<string>('CS2_SERVER_ROOT_DIR')!;
    return path.join(path.normalize(serverRootDir), 'game', 'csgo', 'cfg', 'MatchZy', 'admins.json');
  }

  // Read & Write

  private leerCssAdmins(): Record<string, CssAdminEntry> {
    return leerJsonDeArchivo<Record<string, CssAdminEntry>>(this.getCssAdminsPath(), {});
  }

  private leerMatchzyAdmins(): Record<string, string> {
    return leerJsonDeArchivo<Record<string, string>>(this.getMatchzyAdminsPath(), {});
  }

  private guardarCssAdmins(data: Record<string, CssAdminEntry>): void {
    guardarJsonEnArchivo(this.getCssAdminsPath(), data);
  }

  private guardarMatchzyAdmins(data: Record<string, string>): void {
    guardarJsonEnArchivo(this.getMatchzyAdminsPath(), data);
  }



  /*
    MÉTODOS PÚBLICOS
  */
  agregarAdmin(steam64: string, nombre: string): void {
    this.validarNombre(nombre);
    const nombreConPrefijo = `[Admin]${nombre}`;

    const cssAdmins = this.leerCssAdmins();
    cssAdmins[nombreConPrefijo] = { identity: steam64, immunity: 100, flags: ['@css/root'] };
    this.guardarCssAdmins(cssAdmins);

    const matchzyAdmins = this.leerMatchzyAdmins();
    matchzyAdmins[steam64] = '';
    this.guardarMatchzyAdmins(matchzyAdmins);

    this.logger.log(`[Admin] Agregado: ${nombreConPrefijo} (${steam64})`);
  }

  listarAdmins(): AdminEntry[] {
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

    const entradaActual = Object.entries(cssAdmins).find(([_, data]) => data.identity === steam64Original);
    if (!entradaActual) throw new NotFoundException(`Admin con steam64 ${steam64Original} no encontrado`);

    const [nombreActual, datosActuales] = entradaActual;
    const nombreFinal = nuevoNombre ? `[Admin]${nuevoNombre}` : nombreActual;
    const steam64Final = nuevoSteam64 ?? steam64Original;

    delete cssAdmins[nombreActual];
    cssAdmins[nombreFinal] = { ...datosActuales, identity: steam64Final };
    this.guardarCssAdmins(cssAdmins);

    if (nuevoSteam64 && nuevoSteam64 !== steam64Original) {
      delete matchzyAdmins[steam64Original];
      matchzyAdmins[steam64Final] = '';
      this.guardarMatchzyAdmins(matchzyAdmins);
    }

    this.logger.log(`[Admin] Editado: ${nombreActual} → ${nombreFinal} (${steam64Original} → ${steam64Final})`);
  }

  removerAdmin(steam64: string): void {
    const cssAdmins = this.leerCssAdmins();
    const matchzyAdmins = this.leerMatchzyAdmins();

    const entradaActual = Object.entries(cssAdmins).find(([_, data]) => data.identity === steam64);
    if (!entradaActual) throw new NotFoundException(`Admin con steam64 ${steam64} no encontrado`);

    const [nombre] = entradaActual;
    delete cssAdmins[nombre];
    delete matchzyAdmins[steam64];

    this.guardarCssAdmins(cssAdmins);
    this.guardarMatchzyAdmins(matchzyAdmins);

    this.logger.log(`[Admin] Removido: ${nombre} (${steam64})`);
  }

  obtenerTodosLosSteam64(): AdminEntry[] {
    return this.listarAdmins();
  }
}