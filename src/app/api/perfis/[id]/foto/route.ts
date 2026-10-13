import fs from "node:fs/promises";
import path from "node:path";
import { DATA_DIR, run } from "@/lib/db";

export const runtime = "nodejs";

const MAX = 2 * 1024 * 1024;
const arquivo = (id: string) => path.join(DATA_DIR, "avatars", `${id}.jpg`);
const valido = (id: string) => id === "lucas" || id === "giovanna";

// Pública de propósito (sem senha): a tela "Quem está assistindo?" aparece antes de escolher o perfil.
// Sem cache fixo: o ETag deixa o navegador revalidar e pegar a foto nova assim que ela muda.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!valido(id)) return new Response("Not found", { status: 404 });
  try {
    const [data, info] = await Promise.all([fs.readFile(arquivo(id)), fs.stat(arquivo(id))]);
    const etag = `"${info.mtimeMs}-${info.size}"`;
    const headers = { etag, "cache-control": "no-cache" };
    if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });
    return new Response(new Uint8Array(data), { headers: { ...headers, "content-type": "image/jpeg" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

// A foto chega já recortada em quadrado pelo navegador.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!valido(id)) return Response.json({ error: "Perfil inválido." }, { status: 404 });
  const form = await req.formData().catch(() => null);
  const foto = form?.get("foto");
  if (!(foto instanceof File) || foto.size === 0) return Response.json({ error: "Envie uma imagem." }, { status: 400 });
  if (foto.size > MAX) return Response.json({ error: "Imagem grande demais." }, { status: 413 });
  if (!foto.type.startsWith("image/")) return Response.json({ error: "O arquivo precisa ser uma imagem." }, { status: 400 });

  await fs.writeFile(arquivo(id), Buffer.from(await foto.arrayBuffer()));
  run("update users set avatar_v = ? where id = ?", Date.now(), id);
  return Response.json({ ok: true });
}
