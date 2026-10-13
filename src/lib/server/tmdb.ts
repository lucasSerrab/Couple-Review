import { ApiError } from "./http";
import type { MediaType, SearchResult, Tipo } from "../types";

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w500";

/** A chave v3 é curta; o "Read Access Token" v4 é um JWT longo e vai como Bearer. */
async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new ApiError(503, "A chave do TMDB não está configurada no servidor.");

  const url = new URL(BASE + path);
  const headers: Record<string, string> = { accept: "application/json" };
  if (key.length > 40) headers.authorization = `Bearer ${key}`;
  else url.searchParams.set("api_key", key);
  url.searchParams.set("language", "pt-BR");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, { headers, next: { revalidate: 3600 } });
  if (res.status === 404) throw new ApiError(404, "Título não encontrado no TMDB.");
  if (!res.ok) {
    console.error("[tmdb]", res.status, await res.text().catch(() => ""));
    throw new ApiError(502, "O TMDB não respondeu. Tente de novo em instantes.");
  }
  return (await res.json()) as T;
}

/** O TMDB não separa anime: é animação (gênero 16) de origem japonesa. */
export function inferirTipo(media: MediaType, generoIds: number[], idioma?: string): Tipo {
  if (generoIds.includes(16) && idioma === "ja") return "anime";
  return media === "tv" ? "serie" : "filme";
}

const ano = (d?: string | null) => (d && /^\d{4}/.test(d) ? Number(d.slice(0, 4)) : null);
const poster = (p?: string | null) => (p ? IMG + p : null);

interface MultiItem {
  id: number;
  media_type: string;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  overview?: string;
  genre_ids?: number[];
  original_language?: string;
}

async function buscarNoTmdb(query: string): Promise<SearchResult[]> {
  const data = await tmdb<{ results: MultiItem[] }>("/search/multi", {
    query,
    include_adult: "false",
  });
  return data.results
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .slice(0, 20)
    .map((r) => {
      const media = r.media_type as MediaType;
      return {
        fonte: "tmdb" as const,
        tmdb_id: r.id,
        media_type: media,
        tipo: inferirTipo(media, r.genre_ids ?? [], r.original_language),
        titulo: (media === "movie" ? r.title : r.name) ?? "Sem título",
        ano: ano(media === "movie" ? r.release_date : r.first_air_date),
        poster_url: poster(r.poster_path),
        sinopse: r.overview || null,
      };
    });
}

interface Detalhes {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  overview?: string;
  genres?: { id: number; name: string }[];
  original_language?: string;
  runtime?: number | null;
  episode_run_time?: number[];
  number_of_seasons?: number;
  credits?: { cast?: { name: string }[] };
}

export interface TituloExterno {
  tmdb_id: number;
  media_type: MediaType;
  tipo: Tipo;
  titulo: string;
  ano: number | null;
  poster_url: string | null;
  sinopse: string | null;
  generos: string[];
  elenco: string[];
  duracao: number | null;
  temporadas: number | null;
}

export async function detalhesDoTitulo(tmdbId: number, media: MediaType): Promise<TituloExterno> {
  const d = await tmdb<Detalhes>(`/${media}/${tmdbId}`, { append_to_response: "credits" });
  const generos = d.genres ?? [];
  return {
    tmdb_id: d.id,
    media_type: media,
    tipo: inferirTipo(media, generos.map((g) => g.id), d.original_language),
    titulo: (media === "movie" ? d.title : d.name) ?? "Sem título",
    ano: ano(media === "movie" ? d.release_date : d.first_air_date),
    poster_url: poster(d.poster_path),
    sinopse: d.overview || null,
    generos: generos.map((g) => g.name),
    elenco: (d.credits?.cast ?? []).slice(0, 8).map((c) => c.name),
    duracao: media === "movie" ? (d.runtime ?? null) : (d.episode_run_time?.[0] ?? null),
    temporadas: media === "tv" ? (d.number_of_seasons ?? null) : null,
  };
}

// ---------------------------------------------------------------------------
// Sem chave do TMDB, a busca usa a sugestão pública do IMDb (sem cadastro).
// Dá pôster, ano e elenco; não distingue anime, então a pessoa marca na busca.
// É um endereço não oficial: se um dia parar, basta configurar a chave do TMDB.
// ---------------------------------------------------------------------------

interface ImdbItem {
  id: string;
  l?: string;
  y?: number;
  q?: string;
  qid?: string;
  s?: string;
  i?: { imageUrl?: string };
}

async function buscarNoImdb(query: string): Promise<SearchResult[]> {
  const termo = encodeURIComponent(query.toLowerCase().trim());
  const res = await fetch(`https://v3.sg.media-imdb.com/suggestion/x/${termo}.json`, {
    headers: { "user-agent": "Mozilla/5.0" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new ApiError(502, "A busca não respondeu. Tente de novo em instantes.");
  const { d = [] } = (await res.json()) as { d?: ImdbItem[] };

  const out: SearchResult[] = [];
  for (const x of d) {
    const num = Number(x.id?.replace(/^tt/, ""));
    const ehFilme = x.qid === "movie" || x.qid === "tvMovie" || x.qid === "short" || x.qid === "video";
    const ehSerie = x.qid === "tvSeries" || x.qid === "tvMiniSeries";
    if (!num || !x.l || !(ehFilme || ehSerie)) continue;
    out.push({
      fonte: "imdb",
      tmdb_id: num,
      media_type: ehSerie ? "tv" : "movie",
      tipo: ehSerie ? "serie" : "filme",
      titulo: x.l,
      ano: x.y ?? null,
      poster_url: x.i?.imageUrl ? x.i.imageUrl.replace(/\._V1_\.(jpg|png)$/, "._V1_UX400_.$1") : null,
      sinopse: null,
      elenco: x.s ? x.s.split(",").map((n) => n.trim()).filter(Boolean) : [],
    });
  }
  return out.slice(0, 15);
}

export async function buscarTitulos(query: string): Promise<SearchResult[]> {
  return process.env.TMDB_API_KEY ? buscarNoTmdb(query) : buscarNoImdb(query);
}
