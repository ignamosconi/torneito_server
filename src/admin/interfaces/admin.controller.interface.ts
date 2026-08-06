import { StatusDto } from 'src/shared/dto/status.dto';
import { AgregarAdminDto } from '../dto/agregar-admin.dto';
import { EditarAdminDto } from '../dto/editar-admin.dto';
import { AdminEntry } from './admin.service.interface';

export interface IAdminController {
  agregarAdmin(body: AgregarAdminDto): Promise<StatusDto>;
  listarAdmins(): AdminEntry[];
  editarAdmin(steam64: string, body: EditarAdminDto): Promise<StatusDto>;
  removerAdmin(steam64: string): Promise<StatusDto>;
}