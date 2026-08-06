import * as fs from 'fs';
import * as path from 'path';

export function leerJsonDeArchivo<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

export function guardarJsonEnArchivo(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function eliminarArchivo(
  filePath: string,
  logger?: { log: (msg: string) => void; warn: (msg: string) => void },
): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    logger?.log(`Archivo eliminado: ${path.basename(filePath)}`);
  } else {
    logger?.warn(`Archivo no encontrado: ${path.basename(filePath)}`);
  }
}