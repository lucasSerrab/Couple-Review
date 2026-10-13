import { z } from "zod";
import { ApiError, route } from "@/lib/server/http";
import { criarRascunhoDeAudio } from "@/lib/server/reviews";

export const runtime = "nodejs";
export const maxDuration = 60; // transcrição + resumo

export const POST = route(async (req, { member }) => {
  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");
  const sessionId = z.string().uuid().safeParse(form?.get("session_id"));
  if (!(audio instanceof File) || !sessionId.success) {
    throw new ApiError(400, "Envie o áudio e a sessão.");
  }
  const transcricao = String(form?.get("transcricao") ?? "").slice(0, 10_000);
  return { review: await criarRascunhoDeAudio(member, sessionId.data, audio, transcricao) };
});
