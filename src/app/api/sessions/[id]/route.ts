import { z } from "zod";
import { readJson, route } from "@/lib/server/http";
import { atualizarSessao, sessionPatch } from "@/lib/server/sessions";

export const PATCH = route<{ id: string }>(async (req, { member }, { id }) => {
  const patch = sessionPatch.parse(await readJson(req));
  return { session: atualizarSessao(member, z.string().uuid().parse(id), patch) };
});
