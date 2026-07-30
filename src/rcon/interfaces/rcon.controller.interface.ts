import { SendCommandDto } from '../dto/send-command.dto';

export interface IRconController {
  /**
   * Ejecuta un comando de consola arbitrario en el servidor CS2 vía RCON.
   */
  sendCustomCommand(body: SendCommandDto): Promise<string>;
}