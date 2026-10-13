export type Slug = "lucas" | "giovanna";
export type Quem = Slug | "ambos";
export type Tipo = "filme" | "serie" | "anime";
export type MediaType = "movie" | "tv";
export type Local = "cinema" | "casa" | "viagem" | "outro";

export interface Member {
  id: string;
  slug: Slug;
  nome: string;
  icone: "masculino" | "feminino";
  avatar_url: string | null;
}

export interface Title {
  id: string;
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

export interface Review {
  id: string;
  session_id: string;
  user_id: string;
  slug: Slug;
  nota: number;
  texto: string | null;
  resumo_ia: string | null;
  transcricao: string | null;
  tem_audio: boolean;
  rascunho: boolean;
  criado_em: string;
}

export interface WatchSession {
  id: string;
  title_id: string;
  quem: Quem;
  assistido_em: string; // YYYY-MM-DD
  local: Local;
  temporada: number | null;
  observacao: string | null;
  criado_por: string;
  criado_em?: string;
  reviews: Review[];
}

export interface LibraryItem {
  title: Title;
  quem: Quem; // quem assistiu (união de todas as sessões)
  ultima: string; // data da sessão mais recente
  notas: Record<Slug, number | null>;
}

export interface WatchlistItem {
  id: string;
  title: Title;
  para_quem: Quem;
  adicionado_por: Slug | null;
  status: "pendente" | "assistido";
  adicionado_em: string;
}

export interface SearchResult {
  fonte: "tmdb" | "imdb";
  tmdb_id: number;
  media_type: MediaType;
  tipo: Tipo;
  titulo: string;
  ano: number | null;
  poster_url: string | null;
  sinopse: string | null;
  elenco?: string[];
}
