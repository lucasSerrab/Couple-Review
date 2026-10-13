import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AvaliarForm } from "@/components/AvaliarForm";
import { CloseIcon, SearchIcon } from "@/components/Icons";
import { get } from "@/lib/db";
import { getSession } from "@/lib/server/auth";
import { buscarSessao, participa } from "@/lib/server/sessions";
import { buscarTituloPorId } from "@/lib/server/titles";
import type { Quem } from "@/lib/types";

export const metadata: Metadata = { title: "Nova avaliação" };
export const dynamic = "force-dynamic";

const uuid = z.string().uuid();

export default async function AvaliarPage({
  searchParams,
}: {
  searchParams: Promise<{ titulo?: string; sessao?: string; quem?: string }>;
}) {
  const sp = await searchParams;
  const { member } = (await getSession())!;

  let sessao = null;
  let titleId = uuid.safeParse(sp.titulo).success ? sp.titulo! : null;

  if (uuid.safeParse(sp.sessao).success) {
    try {
      sessao = buscarSessao(sp.sessao!);
    } catch {
      sessao = null;
    }
    if (sessao) titleId = sessao.title_id;
  }

  if (!titleId) {
    return (
      <>
        <div className="flex items-center gap-3 px-5 pb-3.5 pt-5">
          <Link href="/" aria-label="Fechar" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-chip">
            <CloseIcon />
          </Link>
          <h1 className="font-display text-[26px] font-extrabold leading-none tracking-[-0.02em]">Como foi?</h1>
        </div>
        <div className="flex flex-col gap-4 px-5">
          <p className="text-[15px] leading-relaxed text-body">Primeiro, qual título vocês assistiram?</p>
          <Link
            href="/buscar"
            className="flex min-h-14 items-center justify-center gap-2.5 rounded-[28px] bg-gio text-[17px] font-extrabold text-bg"
          >
            <SearchIcon size={22} />
            Buscar um título
          </Link>
          <Link href="/watchlist" className="flex min-h-12 items-center justify-center rounded-[24px] border-[1.5px] border-line text-[15px] font-bold">
            Escolher da watchlist
          </Link>
        </div>
      </>
    );
  }

  let title;
  try {
    title = buscarTituloPorId(titleId);
  } catch {
    redirect("/buscar");
  }

  if (sessao) {
    // Já avaliou ou a sessão não inclui a pessoa: nada a fazer aqui.
    const minha = get("select 1 as x from reviews where session_id = ? and user_id = ? and rascunho = 0", sessao.id, member.id);
    if (minha || !participa(sessao.quem, member)) redirect(`/titulo/${title.id}`);
  }

  const quemParam = (["lucas", "giovanna", "ambos"] as const).find((q) => q === sp.quem);
  const quemInicial: Quem = quemParam ?? "ambos";

  return (
    <AvaliarForm
      title={{ id: title.id, titulo: title.titulo, ano: title.ano, tipo: title.tipo, poster_url: title.poster_url }}
      sessao={sessao ? { id: sessao.id, quem: sessao.quem, assistido_em: sessao.assistido_em, local: sessao.local } : null}
      quemInicial={quemInicial}
      member={{ slug: member.slug, nome: member.nome }}
    />
  );
}
