import { z } from "zod";
import { get, run, uid } from "../db";
import type { Title } from "../types";
import { ApiError } from "./http";
import { detalhesDoTitulo, type TituloExterno } from "./tmdb";

interface Row extends Omit<Title, "generos" | "elenco"> {
  generos: string;
  elenco: string;
}

export const TITLE_COLS =
  "id, ext_id as tmdb_id, media_type, tipo, titulo, ano, poster_url, sinopse, generos, elenco, duracao, temporadas";

export function rowToTitle(r: Row): Title {
  return { ...r, generos: JSON.parse(r.generos), elenco: JSON.parse(r.elenco) };
}

/** O que o navegador manda ao escolher um resultado da busca. */
export const titleInput = z.object({
  fonte: z.enum(["tmdb", "imdb"]),
  tmdb_id: z.number().int().positive(),
  media_type: z.enum(["movie", "tv"]),
  tipo: z.enum(["filme", "serie", "anime"]).optional(),
  titulo: z.string().max(300).optional(),
  ano: z.number().int().nullish(),
  poster_url: z.string().url().max(500).nullish(),
  sinopse: z.string().max(3000).nullish(),
  elenco: z.array(z.string().max(100)).max(12).optional(),
});

/** Devolve o título do cache local; se ainda não existe, busca os detalhes e salva. */
export async function salvarTitulo(input: z.infer<typeof titleInput>): Promise<Title> {
  const existente = get<Row>(
    `select ${TITLE_COLS} from titles where fonte = ? and ext_id = ? and media_type = ?`,
    input.fonte,
    input.tmdb_id,
    input.media_type,
  );
  if (existente) return rowToTitle(existente);

  let t: TituloExterno;
  if (input.fonte === "tmdb") {
    t = await detalhesDoTitulo(input.tmdb_id, input.media_type);
  } else {
    if (!input.titulo) throw new ApiError(400, "Título sem nome.");
    t = {
      tmdb_id: input.tmdb_id,
      media_type: input.media_type,
      tipo: input.tipo ?? (input.media_type === "tv" ? "serie" : "filme"),
      titulo: input.titulo,
      ano: input.ano ?? null,
      poster_url: input.poster_url ?? null,
      sinopse: input.sinopse ?? null,
      generos: [],
      elenco: input.elenco ?? [],
      duracao: null,
      temporadas: null,
    };
  }

  const id = uid();
  run(
    `insert into titles (id, fonte, ext_id, media_type, tipo, titulo, ano, poster_url, sinopse, generos, elenco, duracao, temporadas)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.fonte,
    t.tmdb_id,
    t.media_type,
    t.tipo,
    t.titulo,
    t.ano,
    t.poster_url,
    t.sinopse,
    JSON.stringify(t.generos),
    JSON.stringify(t.elenco),
    t.duracao,
    t.temporadas,
  );
  return buscarTituloPorId(id);
}

export function buscarTituloPorId(id: string): Title {
  const r = get<Row>(`select ${TITLE_COLS} from titles where id = ?`, id);
  if (!r) throw new ApiError(404, "Título não encontrado.");
  return rowToTitle(r);
}

export function contarTitulos(): number {
  return get<{ n: number }>("select count(*) as n from titles")!.n;
}
