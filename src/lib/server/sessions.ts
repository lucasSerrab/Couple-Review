import { z } from "zod";
import { get, run, uid } from "../db";
import type { Local, Member, Quem } from "../types";
import { ApiError } from "./http";

export const sessionInput = z.object({
  title_id: z.string().uuid(),
  quem: z.enum(["lucas", "giovanna", "ambos"]),
  assistido_em: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  local: z.enum(["cinema", "casa", "viagem", "outro"]),
  temporada: z.number().int().min(1).max(100).nullish(),
  observacao: z.string().max(500).nullish(),
});

export interface Sessao {
  id: string;
  title_id: string;
  quem: Quem;
  assistido_em: string;
  local: Local;
  temporada: number | null;
  observacao: string | null;
  criado_por: string;
}

export function criarSessao(member: Member, input: z.infer<typeof sessionInput>): Sessao {
  if (!get("select 1 as x from titles where id = ?", input.title_id)) throw new ApiError(404, "Título não encontrado.");
  const id = uid();
  run(
    "insert into watch_sessions (id, title_id, quem, assistido_em, local, temporada, observacao, criado_por) values (?, ?, ?, ?, ?, ?, ?, ?)",
    id,
    input.title_id,
    input.quem,
    input.assistido_em,
    input.local,
    input.temporada ?? null,
    input.observacao ?? null,
    member.id,
  );
  return buscarSessao(id);
}

export function buscarSessao(id: string): Sessao {
  const s = get<Sessao>(
    "select id, title_id, quem, assistido_em, local, temporada, observacao, criado_por from watch_sessions where id = ?",
    id,
  );
  if (!s) throw new ApiError(404, "Sessão não encontrada.");
  return s;
}

/** A pessoa faz parte dessa sessão (e portanto pode avaliar)? */
export function participa(quem: Quem, member: Member): boolean {
  return quem === "ambos" || quem === member.slug;
}
