import fs from "node:fs/promises";
import path from "node:path";
import { DATA_DIR } from "@/lib/db";

export const runtime = "nodejs";

// Pública de propósito: a tela "Quem está assistindo?" aparece antes de escolher o perfil.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id !== "lucas" && id !== "giovanna") return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(path.join(DATA_DIR, "avatars", `${id}.jpg`));
    return new Response(new Uint8Array(data), {
      headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
