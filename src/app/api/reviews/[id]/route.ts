import { z } from "zod";
import { readJson, route } from "@/lib/server/http";
import { atualizarAvaliacao, buscarAvaliacao, descartarRascunho, reviewPatch } from "@/lib/server/reviews";

type P = { id: string };
const idSchema = z.string().uuid();

export const GET = route<P>(async (_req, { member }, { id }) => {
  return buscarAvaliacao(member, idSchema.parse(id));
});

// Confirma o rascunho do áudio (ou ajusta uma avaliação) e salva.
export const PATCH = route<P>(async (req, { member }, { id }) => {
  const patch = reviewPatch.parse(await readJson(req));
  return { review: atualizarAvaliacao(member, idSchema.parse(id), patch) };
});

// "Gravar de novo": descarta o rascunho e o áudio.
export const DELETE = route<P>(async (_req, { member }, { id }) => {
  const sessaoMantida = await descartarRascunho(member, idSchema.parse(id));
  return { ok: true, sessaoMantida };
});
