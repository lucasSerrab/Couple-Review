import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { EditarForm } from "@/components/EditarForm";
import { getSession } from "@/lib/server/auth";
import { reviewPorId } from "@/lib/server/reviews";
import { buscarSessao } from "@/lib/server/sessions";
import { buscarTituloPorId } from "@/lib/server/titles";

export const metadata: Metadata = { title: "Editar avaliação" };
export const dynamic = "force-dynamic";

export default async function EditarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const { member } = (await getSession())!;

  const review = reviewPorId(id);
  if (!review || review.user_id !== member.id) notFound();
  if (review.rascunho) redirect(`/revisao/${review.id}`);

  const sessao = buscarSessao(review.session_id);
  const title = buscarTituloPorId(sessao.title_id);

  return (
    <EditarForm
      reviewId={review.id}
      sessionId={sessao.id}
      slug={member.slug}
      title={{ id: title.id, titulo: title.titulo, ano: title.ano, tipo: title.tipo, poster_url: title.poster_url }}
      inicial={{
        nota: Number(review.nota),
        texto: review.texto ?? review.resumo_ia ?? "",
        data: sessao.assistido_em,
        local: sessao.local,
        temporada: sessao.temporada,
        quem: sessao.quem,
      }}
    />
  );
}
