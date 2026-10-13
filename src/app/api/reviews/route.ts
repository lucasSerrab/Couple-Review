import { readJson, route } from "@/lib/server/http";
import { criarAvaliacaoTexto, reviewInput } from "@/lib/server/reviews";

export const POST = route(async (req, { member }) => {
  const input = reviewInput.parse(await readJson(req));
  return { review: await criarAvaliacaoTexto(member, input) };
});
