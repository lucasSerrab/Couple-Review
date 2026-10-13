import { z } from "zod";
import { route } from "@/lib/server/http";
import { listarBiblioteca } from "@/lib/server/library";

const query = z.object({
  tipo: z.enum(["filme", "serie", "anime"]).optional(),
  quem: z.enum(["lucas", "giovanna", "ambos"]).optional(),
});

export const GET = route(async (req, { member }) => {
  const sp = new URL(req.url).searchParams;
  const filtros = query.parse({ tipo: sp.get("tipo") ?? undefined, quem: sp.get("quem") ?? undefined });
  return { items: listarBiblioteca(member, filtros) };
});
