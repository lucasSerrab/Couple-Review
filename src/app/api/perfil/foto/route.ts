import fs from "node:fs/promises";
import path from "node:path";
import { DATA_DIR, run } from "@/lib/db";
import { ApiError, route } from "@/lib/server/http";

export const runtime = "nodejs";

const MAX = 2 * 1024 * 1024;

// A foto chega já redimensionada pelo navegador (JPEG quadrado).
export const POST = route(async (req, { member }) => {
  const form = await req.formData().catch(() => null);
  const foto = form?.get("foto");
  if (!(foto instanceof File) || foto.size === 0) throw new ApiError(400, "Envie uma imagem.");
  if (foto.size > MAX) throw new ApiError(413, "Imagem grande demais.");
  if (!foto.type.startsWith("image/")) throw new ApiError(400, "O arquivo precisa ser uma imagem.");

  await fs.writeFile(path.join(DATA_DIR, "avatars", `${member.id}.jpg`), Buffer.from(await foto.arrayBuffer()));
  const v = Date.now();
  run("update users set avatar_v = ? where id = ?", v, member.id);
  return { url: `/api/perfis/${member.id}/foto?v=${v}` };
});
