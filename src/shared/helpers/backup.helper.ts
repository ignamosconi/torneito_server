import * as fs from 'fs';
import * as path from 'path';

interface BackupLogger {
  log: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string, err?: unknown) => void;
}

export function borrarBackupsTxt(csgoDir: string, matchidNumerico: number, logger: BackupLogger): void {
  if (!fs.existsSync(csgoDir)) return;
  try {
    const txts = fs.readdirSync(csgoDir).filter(
      (f) => f.startsWith(`matchzy_${matchidNumerico}_`) && f.endsWith('.txt'),
    );
    for (const archivo of txts) {
      fs.unlinkSync(path.join(csgoDir, archivo));
      logger.log(`[Lifecycle] Backup TXT eliminado: ${archivo}`);
    }
  } catch (error) {
    logger.error(`[Lifecycle] Error limpiando TXTs en csgo/`, error);
  }
}

export function borrarBackupsJson(
  backupDir: string,
  matchidNumerico: number,
  matchId: string,
  logger: BackupLogger,
): void {
  if (!fs.existsSync(backupDir)) {
    logger.warn(`[Lifecycle] Directorio de backups no encontrado: ${backupDir}`);
    return;
  }
  try {
    const jsons = fs.readdirSync(backupDir).filter(
      (f) => f.startsWith(`matchzy_${matchidNumerico}_`) && f.endsWith('.json'),
    );
    for (const archivo of jsons) {
      fs.unlinkSync(path.join(backupDir, archivo));
      logger.log(`[Lifecycle] Backup JSON eliminado: ${archivo}`);
    }
    const matchbackupPath = path.join(backupDir, `matchbackup_${matchId}`);
    if (fs.existsSync(matchbackupPath)) {
      fs.unlinkSync(matchbackupPath);
      logger.log(`[Lifecycle] Matchbackup eliminado: matchbackup_${matchId}`);
    }
  } catch (error) {
    logger.error(`[Lifecycle] Error limpiando MatchZyDataBackup`, error);
  }
}