export interface IRconService {
  /**
   * Ejecuta un comando vía RCON en el servidor CS2.
   * @param command Comando de consola a ejecutar (ej: "mp_restartgame 1")
   * @param customPort Puerto opcional; si se omite usa el del .env
   * @returns Respuesta del servidor o mensaje de error controlado
   */
  executeCommand(command: string, port: number): Promise<string>;
}