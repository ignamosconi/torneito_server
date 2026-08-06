// Representa una entrada de admin con los datos mínimos necesarios
export interface AdminEntry {
  steam64: string;
  nombre: string;
}

export interface IAdminService {
  agregarAdmin(steam64: string, nombre: string): void;
  listarAdmins(): AdminEntry[];
  editarAdmin(steam64Original: string, nuevoSteam64?: string, nuevoNombre?: string): void;
  removerAdmin(steam64: string): void;
  
  obtenerTodosLosSteam64(): AdminEntry[];   //Alias de listarAdmins; usado por LifecycleService para inyectar specs
}