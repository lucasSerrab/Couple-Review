import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { DATA_DIR, db } from "../db";

/** Um arquivo no formato tar (aberto pelo Windows 11, 7-Zip e pelo comando `tar`). */
function entradaTar(nome: string, dados: Buffer): Buffer[] {
  const cab = Buffer.alloc(512);
  cab.write(nome.slice(0, 100), 0, "utf8");
  cab.write("0000644\0", 100);
  cab.write("0000000\0", 108);
  cab.write("0000000\0", 116);
  cab.write(dados.length.toString(8).padStart(11, "0") + "\0", 124);
  cab.write(Math.floor(Date.now() / 1000).toString(8).padStart(11, "0") + "\0", 136);
  cab.write("        ", 148); // o checksum conta estes 8 bytes como espaços
  cab.write("0", 156);
  cab.write("ustar\0", 257);
  cab.write("00", 263);
  let soma = 0;
  for (const b of cab) soma += b;
  cab.write(soma.toString(8).padStart(6, "0") + "\0 ", 148);
  const resto = (512 - (dados.length % 512)) % 512;
  return [cab, dados, Buffer.alloc(resto)];
}

/** Cópia completa dos dados: banco (consistente), áudios e fotos. */
export async function gerarBackupTar(): Promise<Buffer> {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "backup-"));
  const copia = path.join(tmp, "datalug.db");
  try {
    // VACUUM INTO gera uma cópia íntegra do banco mesmo com o app em uso.
    db().exec(`VACUUM INTO '${copia.replace(/'/g, "''")}'`);
    const partes: Buffer[] = [...entradaTar("datalug.db", await fs.readFile(copia))];
    for (const pasta of ["audios", "avatars"]) {
      const dir = path.join(DATA_DIR, pasta);
      for (const arq of await fs.readdir(dir).catch(() => [] as string[])) {
        partes.push(...entradaTar(`${pasta}/${arq}`, await fs.readFile(path.join(dir, arq))));
      }
    }
    partes.push(Buffer.alloc(1024)); // fim do tar
    return Buffer.concat(partes);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
}
