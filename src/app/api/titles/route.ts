import { readJson, route } from "@/lib/server/http";
import { salvarTitulo, titleInput } from "@/lib/server/titles";

// Salva (ou reaproveita) um título no cache local.
export const POST = route(async (req) => {
  const input = titleInput.parse(await readJson(req));
  return { title: await salvarTitulo(input) };
});
