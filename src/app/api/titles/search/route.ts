import { ApiError, route } from "@/lib/server/http";
import { buscarTitulos } from "@/lib/server/tmdb";

export const GET = route(async (req) => {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) throw new ApiError(400, "Digite pelo menos 2 letras.");
  return { results: await buscarTitulos(q.slice(0, 100)) };
});
