import { MatchZyEventDto } from '../dto/matchzy-event.dto';

export interface ILifecycleService {
  generarConfiguracionYPlantar(matchId: string, configuracionData: any, gamePort: number): Promise<void>;
  obtenerConfiguracionLocal(matchId: string): any;
  ejecutarInyeccionMatchZy(matchId: string, gamePort: number, matchidNumerico?: number): Promise<void>;
  procesarEvento(eventData: MatchZyEventDto): Promise<void>;
  marcarSerieTerminada(matchId: number): void;
  debeApagarServidor(matchId: number): boolean;
  obtenerMatchIdPlataforma(matchidNumerico: number): string | undefined;
  obtenerPortPartido(matchidNumerico: number): number;
  removerMapeoId(matchidNumerico: number): void;
  borrarConfiguracion(matchId: string): void;
  borrarBackupsPartido(matchidNumerico: number, matchId: string): void;
  borrarPlayerNamesPartido(matchidNumerico: number): void;
}