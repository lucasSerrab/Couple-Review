import { z } from "zod";
import { all, get, run, uid } from "../db";
import type { Member, Tipo, Title, WatchlistItem } from "../types";
import { ApiError } from "./http";
import { rowToTitle } from "./titles";

export const watchlistInput = z.object({
  title_id: z.string().uuid(),
  para_quem: z.enum(["lucas", "giovanna", "ambos"]).default("ambos"),
});

export const watchlistPatch = z.object({
  status: z.enum(["pendente", "assistido"]).optional(),
  para_quem: z.enum(["lucas", "giovanna", "ambos"]).optional(),
});

const TITULO_COLS =
  "t.id as t_id, t.ext_id as t_tmdb_id, t.media_type as t_media_type, t.tipo as t_tipo, t.titulo as t_titulo, t.ano as t_ano, t.poster_url as t_poster_url, t.sinopse as t_sinopse, t.generos as t_generos, t.elenco as t_elenco, t.duracao as t_duracao, t.temporadas as t_temporadas";

export function listarWatchlist(filtros: { tipo?: Tipo; status?: "pendente" | "assistido" } = {}): WatchlistItem[] {
  const rows = all<Record<string, string | number | null>>(
    `select w.id, w.para_quem, w.status, w.adicionado_por, w.adicionado_em, ${TITULO_COLS}
       from watchlist w join titles t on t.id = w.title_id
      where w.status = ? ${filtros.tipo ? "and t.tipo = ?" : ""}
      order by w.adicionado_em asc`,
    filtros.status ?? "pendente",
    ...(filtros.tipo ? [filtros.tipo] : []),
  );
  return rows.map((r) => {
    const t: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) if (k.startsWith("t_")) t[k.slice(2)] = v;
    return {
      id: r.id as string,
      title: rowToTitle(t as never) as Title,
      para_quem: r.para_quem as WatchlistItem["para_quem"],
      adicionado_por: r.adicionado_por as WatchlistItem["adicionado_por"],
      status: r.status as WatchlistItem["status"],
      adicionado_em: String(r.adicionado_em).replace(" ", "T") + "Z",
    };
  });
}

export function contarPendentes(): number {
  return get<{ n: number }>("select count(*) as n from watchlist where status = 'pendente'")!.n;
}

export function adicionarNaWatchlist(member: Member, input: z.infer<typeof watchlistInput>) {
  if (!get("select 1 as x from titles where id = ?", input.title_id)) throw new ApiError(404, "Título não encontrado.");
  if (get("select 1 as x from watchlist where title_id = ? and status = 'pendente'", input.title_id)) {
    throw new ApiError(409, "Esse título já está na watchlist.");
  }
  const id = uid();
  run("insert into watchlist (id, title_id, adicionado_por, para_quem) values (?, ?, ?, ?)", id, input.title_id, member.id, input.para_quem);
  return { id };
}

export function atualizarItem(id: string, patch: z.infer<typeof watchlistPatch>) {
  const atual = get<{ id: string; title_id: string; status: string; para_quem: string }>(
    "select id, title_id, status, para_quem from watchlist where id = ?",
    id,
  );
  if (!atual) throw new ApiError(404, "Item não encontrado.");
  const status = patch.status ?? atual.status;
  if (
    status === "pendente" &&
    get("select 1 as x from watchlist where title_id = ? and status = 'pendente' and id <> ?", atual.title_id, id)
  ) {
    throw new ApiError(409, "Esse título já está pendente na watchlist.");
  }
  run("update watchlist set status = ?, para_quem = ? where id = ?", status, patch.para_quem ?? atual.para_quem, id);
  return { id, status };
}

export function removerItem(id: string) {
  run("delete from watchlist where id = ?", id);
}
