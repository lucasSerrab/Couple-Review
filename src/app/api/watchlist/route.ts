import { z } from "zod";
import { readJson, route } from "@/lib/server/http";
import { adicionarNaWatchlist, listarWatchlist, watchlistInput } from "@/lib/server/watchlist";

const query = z.object({ tipo: z.enum(["filme", "serie", "anime"]).optional() });

export const GET = route(async (req) => {
  const tipo = query.parse({ tipo: new URL(req.url).searchParams.get("tipo") ?? undefined }).tipo;
  return { items: listarWatchlist({ tipo }) };
});

export const POST = route(async (req, { member }) => {
  const input = watchlistInput.parse(await readJson(req));
  return { item: adicionarNaWatchlist(member, input) };
});
