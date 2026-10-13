import { readJson, route } from "@/lib/server/http";
import { criarSessao, sessionInput } from "@/lib/server/sessions";

export const POST = route(async (req, { member }) => {
  const input = sessionInput.parse(await readJson(req));
  return { session: criarSessao(member, input) };
});
