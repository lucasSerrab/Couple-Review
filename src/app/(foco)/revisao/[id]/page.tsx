import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { RevisaoView } from "@/components/RevisaoView";
import { get } from "@/lib/db";
import { getSession } from "@/lib/server/auth";
import { buscarAvaliacao } from "@/lib/server/reviews";

export const metadata: Metadata = { title: "Revisar áudio" };
export const dynamic = "force-dynamic";

export default async function RevisaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const { member } = (await getSession())!;

  let achada;
  try {
    achada = buscarAvaliacao(member, id);
  } catch {
    notFound();
  }
  if (achada.review.user_id !== member.id) notFound();
  const { review, audio } = achada;

  const sessao = get<{ id: string }>("select id from watch_sessions where id = ?", review.session_id);
  const title = get<{ id: string; titulo: string }>(
    "select t.id, t.titulo from titles t join watch_sessions s on s.title_id = t.id where s.id = ?",
    review.session_id,
  );
  if (!sessao || !title) notFound();

  // Já confirmada: o lugar dela é a página do título.
  if (!review.rascunho) redirect(`/titulo/${title.id}`);

  return (
    <RevisaoView
      reviewId={review.id}
      sessionId={sessao.id}
      title={title}
      slug={member.slug}
      notaSugerida={Number(review.nota)}
      resumoInicial={review.resumo_ia ?? ""}
      transcricao={review.transcricao ?? ""}
      audioUrl={audio}
    />
  );
}
