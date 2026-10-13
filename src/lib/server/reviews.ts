import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { all, DATA_DIR, db, get, run, uid } from "../db";
import { clampNota } from "../format";
import type { Member } from "../types";
import { extensaoDoAudio, resumir, resumirLocal, temIA, transcrever } from "./ai";
import { ApiError } from "./http";
import { buscarSessao, participa } from "./sessions";
import { buscarTituloPorId } from "./titles";

const nota = z.number().min(0).max(10).transform(clampNota);

export const reviewInput = z.object({
  session_id: z.string().uuid(),
  nota,
  texto: z.string().trim().max(5000).nullish(),
});

export const reviewPatch = z.object({
  nota: nota.optional(),
  texto: z.string().trim().max(5000).nullish(),
});

export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const AUDIO_DIR = path.join(DATA_DIR, "audios");

export interface ReviewRow {
  id: string;
  session_id: string;
  user_id: string;
  nota: number;
  texto: string | null;
  resumo_ia: string | null;
  transcricao: string | null;
  audio_url: string | null;
  rascunho: boolean;
  criado_em: string;
}

const COLS = "id, session_id, user_id, nota, texto, resumo_ia, transcricao, audio_url, rascunho, criado_em";

function fromRow(r: Record<string, unknown> | undefined): ReviewRow | null {
  return r ? ({ ...r, rascunho: Boolean(r.rascunho) } as unknown as ReviewRow) : null;
}

export function reviewPorId(id: string): ReviewRow | null {
  return fromRow(get(`select ${COLS} from reviews where id = ?`, id));
}

/**
 * Regra de casal: a avaliação do outro só aparece depois que a sua foi confirmada
 * (nas sessões "os dois"). Rascunhos são sempre privados.
 */
export function podeVerAvaliacao(member: Member, r: ReviewRow): boolean {
  if (r.user_id === member.id) return true;
  if (r.rascunho) return false;
  const sessao = buscarSessao(r.session_id);
  if (sessao.quem !== "ambos") return true;
  return Boolean(
    get("select 1 as x from reviews where session_id = ? and user_id = ? and rascunho = 0", r.session_id, member.id),
  );
}

/** Garante que a pessoa participa da sessão e ainda não avaliou. */
function validarSessao(member: Member, sessionId: string) {
  const sessao = buscarSessao(sessionId);
  if (!participa(sessao.quem, member)) {
    throw new ApiError(403, "Essa sessão não inclui você, então só a outra pessoa pode avaliar.");
  }
  const existente = fromRow(
    get(`select ${COLS} from reviews where session_id = ? and user_id = ?`, sessionId, member.id),
  );
  if (existente && !existente.rascunho) throw new ApiError(409, "Você já avaliou essa sessão.");
  return { sessao, rascunhoAnterior: existente };
}

export async function criarAvaliacaoTexto(member: Member, input: z.infer<typeof reviewInput>) {
  const { rascunhoAnterior } = validarSessao(member, input.session_id);
  if (rascunhoAnterior) await descartarRascunho(member, rascunhoAnterior.id, false);
  const id = uid();
  run(
    "insert into reviews (id, session_id, user_id, nota, texto) values (?, ?, ?, ?, ?)",
    id,
    input.session_id,
    member.id,
    input.nota,
    input.texto || null,
  );
  return reviewPorId(id)!;
}

/**
 * Guarda o áudio, transcreve, resume e devolve um rascunho para a pessoa revisar.
 * Com chave de IA, a transcrição vem do áudio; sem chave, vem do reconhecimento de voz do navegador.
 */
export async function criarRascunhoDeAudio(member: Member, sessionId: string, file: File, transcricaoNavegador: string) {
  if (file.size === 0) throw new ApiError(400, "O áudio veio vazio.");
  if (file.size > MAX_AUDIO_BYTES) throw new ApiError(413, "Áudio grande demais. Tente gravar algo mais curto.");

  const { sessao, rascunhoAnterior } = validarSessao(member, sessionId);
  const titulo = buscarTituloPorId(sessao.title_id);
  const buffer = await file.arrayBuffer();
  const mime = file.type || "audio/webm";

  const arquivo = `${member.id}-${sessionId}-${Date.now()}.${extensaoDoAudio(mime)}`;
  await fs.writeFile(path.join(AUDIO_DIR, arquivo), Buffer.from(buffer));

  let transcricao: string;
  let resumo: { resumo: string; nota: number };
  try {
    if (temIA()) {
      transcricao = await transcrever(buffer, mime);
      resumo = await resumir(transcricao, titulo.titulo);
    } else {
      transcricao = transcricaoNavegador.trim();
      resumo = transcricao ? resumirLocal(transcricao) : { resumo: "", nota: 7 };
    }
  } catch (e) {
    await fs.rm(path.join(AUDIO_DIR, arquivo), { force: true });
    throw e;
  }

  if (rascunhoAnterior) await descartarRascunho(member, rascunhoAnterior.id, false);

  const id = uid();
  run(
    "insert into reviews (id, session_id, user_id, nota, resumo_ia, transcricao, audio_url, rascunho) values (?, ?, ?, ?, ?, ?, ?, 1)",
    id,
    sessionId,
    member.id,
    resumo.nota,
    resumo.resumo,
    transcricao,
    arquivo,
  );
  return reviewPorId(id)!;
}

/** Confirma (ou ajusta) um rascunho, ou edita uma avaliação já salva. */
export function atualizarAvaliacao(member: Member, id: string, patch: z.infer<typeof reviewPatch>) {
  const atual = reviewPorId(id);
  if (!atual || atual.user_id !== member.id) throw new ApiError(404, "Avaliação não encontrada.");
  run(
    "update reviews set rascunho = 0, nota = ?, texto = ? where id = ?",
    patch.nota ?? atual.nota,
    patch.texto === undefined ? atual.texto : patch.texto || null,
    id,
  );
  return reviewPorId(id)!;
}

/**
 * Apaga um rascunho (e o áudio dele). Se a sessão foi criada por essa pessoa e ficou vazia, apaga a sessão também.
 * Devolve se a sessão continua existindo.
 */
export async function descartarRascunho(member: Member, id: string, limparSessao = true): Promise<boolean> {
  const review = reviewPorId(id);
  if (!review || review.user_id !== member.id) throw new ApiError(404, "Avaliação não encontrada.");
  if (!review.rascunho) throw new ApiError(409, "Só dá para descartar um rascunho.");

  run("delete from reviews where id = ?", id);
  if (review.audio_url) await fs.rm(path.join(AUDIO_DIR, path.basename(review.audio_url)), { force: true });

  if (!limparSessao) return true;
  const sobrou = get<{ n: number }>("select count(*) as n from reviews where session_id = ?", review.session_id)!.n;
  if (sobrou) return true;
  const r = run("delete from watch_sessions where id = ? and criado_por = ?", review.session_id, member.id);
  return Number(r.changes) === 0;
}

/** Avaliação visível para a pessoa, com o caminho do áudio (servido por /api/reviews/:id/audio). */
export function buscarAvaliacao(member: Member, id: string) {
  const review = reviewPorId(id);
  if (!review || !podeVerAvaliacao(member, review)) throw new ApiError(404, "Avaliação não encontrada.");
  return { review, audio: review.audio_url ? `/api/reviews/${id}/audio` : null };
}

export async function lerAudio(member: Member, id: string): Promise<{ data: Buffer; mime: string }> {
  const { review } = buscarAvaliacao(member, id);
  if (!review.audio_url) throw new ApiError(404, "Sem áudio.");
  const arquivo = path.join(AUDIO_DIR, path.basename(review.audio_url));
  const data = await fs.readFile(arquivo).catch(() => {
    throw new ApiError(404, "Arquivo de áudio não encontrado.");
  });
  const ext = path.extname(arquivo).slice(1);
  const mime = ext === "m4a" ? "audio/mp4" : ext === "ogg" ? "audio/ogg" : ext === "wav" ? "audio/wav" : ext === "mp3" ? "audio/mpeg" : "audio/webm";
  return { data, mime };
}

export { all, db };
