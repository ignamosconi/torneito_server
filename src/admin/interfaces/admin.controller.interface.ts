import { AgregarAdminDto } from '../dto/agregar-admin.dto';
import { EditarAdminDto } from '../dto/editar-admin.dto';
import { AdminEntry } from './admin.service.interface';

export interface IAdminController {
  agregarAdmin(body: AgregarAdminDto): Promise<{ status: string; message: string }>;
  listarAdmins(): AdminEntry[];
  editarAdmin(steam64: string, body: EditarAdminDto): Promise<{ status: string; message: string }>;
  removerAdmin(steam64: string): Promise<{ status: string; message: string }>;
}