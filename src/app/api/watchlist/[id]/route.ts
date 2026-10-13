import { z } from "zod";
import { readJson, route } from "@/lib/server/http";
import { atualizarItem, removerItem, watchlistPatch } from "@/lib/server/watchlist";

type P = { id: string };
const idSchema = z.string().uuid();

export const PATCH = route<P>(async (req, _ctx, { id }) => {
  const patch = watchlistPatch.parse(await readJson(req));
  return { item: atualizarItem(idSchema.parse(id), patch) };
});

export const DELETE = route<P>(async (_req, _ctx, { id }) => {
  removerItem(idSchema.parse(id));
  return { ok: true };
});
