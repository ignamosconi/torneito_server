import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminService } from '../services/admin.service';
import { IAdminController } from '../interfaces/admin.controller.interface';
import { AgregarAdminDto } from '../dto/agregar-admin.dto';
import { EditarAdminDto } from '../dto/editar-admin.dto';
import { AdminEntry } from '../interfaces/admin.service.interface';

@ApiTags('admin')
@Controller('admin')
export class AdminController implements IAdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Agregar admin', description: 'Registra un nuevo administrador en los archivos de CounterStrikeSharp y MatchZy.' })
  @ApiResponse({ status: 200, description: 'Admin agregado correctamente' })
  @ApiResponse({ status: 400, description: 'SteamID64 inválido, nombre con caracteres prohibidos, o propiedades extra en el body' })
  async agregarAdmin(@Body() body: AgregarAdminDto): Promise<{ status: string; message: string }> {
    this.logger.log(`[POST /admin] Agregando admin: ${body.nombre} (${body.steam64})`);
    this.adminService.agregarAdmin(body.steam64, body.nombre);
    return { status: 'success', message: `Admin [Admin]${body.nombre} agregado correctamente` };
  }

  @Get()
  @ApiOperation({ summary: 'Listar admins', description: 'Devuelve todos los administradores registrados en el servidor.' })
  @ApiResponse({ status: 200, description: 'Lista de admins', type: Array })
  listarAdmins(): AdminEntry[] {
    this.logger.log(`[GET /admin] Listando todos los admins`);
    return this.adminService.listarAdmins();
  }

  @Put(':steam64')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Editar admin', description: 'Modifica el nombre o SteamID64 de un administrador existente.' })
  @ApiParam({ name: 'steam64', description: 'SteamID64 actual del admin a editar', example: '76561198012345678' })
  @ApiResponse({ status: 200, description: 'Admin editado correctamente' })
  @ApiResponse({ status: 404, description: 'Admin no encontrado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos en el body' })
  async editarAdmin(
    @Param('steam64') steam64: string,
    @Body() body: EditarAdminDto,
  ): Promise<{ status: string; message: string }> {
    this.logger.log(`[PUT /admin/${steam64}] Editando admin`);
    this.adminService.editarAdmin(steam64, body.nuevoSteam64, body.nuevoNombre);
    return { status: 'success', message: `Admin ${steam64} editado correctamente` };
  }

  @Delete(':steam64')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover admin', description: 'Elimina un administrador de los archivos de CounterStrikeSharp y MatchZy.' })
  @ApiParam({ name: 'steam64', description: 'SteamID64 del admin a remover', example: '76561198012345678' })
  @ApiResponse({ status: 200, description: 'Admin removido correctamente' })
  @ApiResponse({ status: 404, description: 'Admin no encontrado' })
  async removerAdmin(@Param('steam64') steam64: string): Promise<{ status: string; message: string }> {
    this.logger.warn(`[DELETE /admin/${steam64}] Removiendo admin`);
    this.adminService.removerAdmin(steam64);
    return { status: 'success', message: `Admin ${steam64} removido correctamente` };
  }
}