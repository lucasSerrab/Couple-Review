import { all } from "../db";
import type { LibraryItem, Member, Quem, Review, Slug, Tipo, Title, WatchSession } from "../types";
import type { ReviewRow } from "./reviews";
import { rowToTitle, TITLE_COLS } from "./titles";

interface SessionRow extends Omit<WatchSession, "reviews"> {
  criado_em: string;
}

function mapReview(r: ReviewRow): Review {
  return {
    id: r.id,
    session_id: r.session_id,
    user_id: r.user_id,
    slug: r.user_id as Slug,
    nota: Number(r.nota),
    texto: r.texto,
    resumo_ia: r.resumo_ia,
    transcricao: r.transcricao,
    tem_audio: Boolean(r.audio_url),
    rascunho: r.rascunho,
    criado_em: r.criado_em,
  };
}

/** Sessões de todos os títulos (ou de um), já com as avaliações que `member` pode ver. */
function carregarSessoes(member: Member, titleId?: string): Map<string, WatchSession[]> {
  const sessoes = all<SessionRow>(
    `select id, title_id, quem, assistido_em, local, temporada, observacao, criado_por, criado_em
       from watch_sessions ${titleId ? "where title_id = ?" : ""}`,
    ...(titleId ? [titleId] : []),
  );
  const reviews = all<Record<string, unknown>>(
    `select id, session_id, user_id, nota, texto, resumo_ia, transcricao, audio_url, rascunho, criado_em from reviews`,
  ).map((r) => ({ ...r, rascunho: Boolean(r.rascunho) }) as unknown as ReviewRow);

  const porSessao = new Map<string, ReviewRow[]>();
  for (const r of reviews) porSessao.set(r.session_id, [...(porSessao.get(r.session_id) ?? []), r]);

  const out = new Map<string, WatchSession[]>();
  for (const s of sessoes) {
    const todas = porSessao.get(s.id) ?? [];
    const minhaConfirmada = todas.some((r) => r.user_id === member.id && !r.rascunho);
    // Regra de casal: sessão "os dois" só mostra a avaliação do outro depois da sua.
    const visiveis = todas.filter((r) =>
      r.user_id === member.id ? true : !r.rascunho && (s.quem !== "ambos" || minhaConfirmada),
    );
    // Sessão com avaliações só em rascunho (áudio sem confirmar) ainda não conta como assistida.
    if (todas.length > 0 && todas.every((r) => r.rascunho)) continue;
    const ws: WatchSession = { ...s, reviews: visiveis.map(mapReview) };
    out.set(s.title_id, [...(out.get(s.title_id) ?? []), ws]);
  }
  for (const [k, v] of out) {
    out.set(k, v.sort((a, b) => b.assistido_em.localeCompare(a.assistido_em) || (b.criado_em ?? "").localeCompare(a.criado_em ?? "")));
  }
  return out;
}

function uniaoQuem(sessoes: WatchSession[]): Quem {
  const tem = new Set<Quem>(sessoes.map((s) => s.quem));
  if (tem.has("ambos") || (tem.has("lucas") && tem.has("giovanna"))) return "ambos";
  return tem.has("lucas") ? "lucas" : "giovanna";
}

function notasRecentes(sessoes: WatchSession[]): Record<Slug, number | null> {
  const notas: Record<Slug, number | null> = { lucas: null, giovanna: null };
  for (const s of sessoes) {
    for (const r of s.reviews) {
      if (!r.rascunho && notas[r.slug] == null) notas[r.slug] = r.nota;
    }
  }
  return notas;
}

export function listarBiblioteca(member: Member, filtros: { tipo?: Tipo; quem?: Quem } = {}): LibraryItem[] {
  const porTitulo = carregarSessoes(member);
  const titulos = all<Record<string, unknown>>(
    `select ${TITLE_COLS} from titles ${filtros.tipo ? "where tipo = ?" : ""}`,
    ...(filtros.tipo ? [filtros.tipo] : []),
  ).map((r) => rowToTitle(r as never));

  const itens: LibraryItem[] = [];
  for (const title of titulos) {
    const sessoes = porTitulo.get(title.id);
    if (!sessoes?.length) continue;
    const quem = uniaoQuem(sessoes);
    if (filtros.quem && filtros.quem !== quem) continue;
    itens.push({ title, quem, ultima: sessoes[0].assistido_em, notas: notasRecentes(sessoes) });
  }
  return itens.sort((a, b) => b.ultima.localeCompare(a.ultima) || a.title.titulo.localeCompare(b.title.titulo));
}

export interface DetalheDoTitulo {
  title: Title;
  sessoes: WatchSession[];
  quem: Quem | null;
  notas: Record<Slug, number | null>;
}

export function detalharTitulo(member: Member, id: string): DetalheDoTitulo | null {
  const [row] = all<Record<string, unknown>>(`select ${TITLE_COLS} from titles where id = ?`, id);
  if (!row) return null;
  const title = rowToTitle(row as never);
  const sessoes = carregarSessoes(member, id).get(id) ?? [];
  return { title, sessoes, quem: sessoes.length ? uniaoQuem(sessoes) : null, notas: notasRecentes(sessoes) };
}

/** Maior diferença de nota entre os dois, entre os títulos vistos juntos. */
export function maiorDivergencia(itens: LibraryItem[]): { item: LibraryItem; diff: number } | null {
  let melhor: { item: LibraryItem; diff: number } | null = null;
  for (const item of itens) {
    const { lucas, giovanna } = item.notas;
    if (lucas == null || giovanna == null) continue;
    const diff = Math.abs(lucas - giovanna);
    if (diff > 0 && (!melhor || diff > melhor.diff)) melhor = { item, diff };
  }
  return melhor;
}
