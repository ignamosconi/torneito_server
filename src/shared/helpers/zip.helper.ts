import * as fs from 'fs';
import * as path from 'path';
import { ZipFile } from 'yazl';
import type { Response } from 'express';

export async function streamZipDeArchivos(archivos: string[], nombreZip: string, res: Response): Promise<void> {
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${nombreZip}"`);

  const zipFile = new ZipFile();

  for (const filePath of archivos) {
    const stat = fs.statSync(filePath);
    zipFile.addReadStream(
      fs.createReadStream(filePath),
      path.basename(filePath),
      { size: stat.size },
    );
  }

  zipFile.end();
  zipFile.outputStream.pipe(res);

  await new Promise<void>((resolve, reject) => {
    res.on('finish', resolve);
    res.on('error', reject);
  });
}