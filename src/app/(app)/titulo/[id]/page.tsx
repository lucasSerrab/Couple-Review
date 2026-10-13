import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AudioButton } from "@/components/AudioButton";
import { DiffIcon, PencilIcon } from "@/components/Icons";
import { WhoIcon } from "@/components/WhoIcon";
import { Poster } from "@/components/Poster";
import { NotaGrande, VoltarLink } from "@/components/ui";
import { fmtData, fmtDuracao, fmtNota, LOCAL_LABEL, QUEM_LABEL, TIPO_LABEL } from "@/lib/format";
import { get } from "@/lib/db";
import { getSession } from "@/lib/server/auth";
import { detalharTitulo } from "@/lib/server/library";
import type { Member, Review, Slug, WatchSession } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return { title: "Título" };
  const t = get<{ titulo: string }>("select titulo from titles where id = ?", id);
  return { title: t?.titulo ?? "Título" };
}

export default async function TituloPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const { member } = (await getSession())!;
  const detalhe = detalharTitulo(member, id);
  if (!detalhe) notFound();

  const { title, sessoes, quem, notas } = detalhe;
  const ultima = sessoes[0];
  const diff = notas.lucas != null && notas.giovanna != null ? Math.abs(notas.lucas - notas.giovanna) : 0;
  const meta = [TIPO_LABEL[title.tipo] + (title.ano ? ` de ${title.ano}` : ""), fmtDuracao(title.duracao)]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col">
      <header className="flex flex-col gap-4 bg-[linear-gradient(175deg,#35506B_0%,#22384C_38%,#0E1419_100%)] px-5 pb-[18px] pt-5 md:rounded-t-2xl">
        <VoltarLink href="/biblioteca" label="Voltar para a biblioteca" className="bg-bg/45" />
        <div className="flex items-end gap-4">
          <Poster
            titulo={title.titulo}
            poster_url={title.poster_url}
            className="h-[176px] w-[118px] rounded-[7px] shadow-[0_14px_30px_rgba(0,0,0,.45)]"
            fallbackSize="text-lg"
          />
          <div className="flex min-w-0 flex-col gap-[7px] pb-0.5">
            <h1 className="font-display text-[30px] font-extrabold leading-none tracking-[-0.02em]">{title.titulo}</h1>
            <p className="text-[13.5px] text-[#BCCBD8]">{meta}</p>
            {title.generos.length > 0 && <p className="text-[13.5px] text-mute">{title.generos.slice(0, 3).join(" · ")}</p>}
            {ultima && quem && (
              <div className="mt-1 flex items-center gap-[7px]">
                <WhoIcon quem={quem} size={22} ring="#22384C" />
                <span className="text-[13px] font-semibold text-[#BCCBD8]">
                  {LOCAL_LABEL[ultima.local]}, {fmtData(ultima.assistido_em)}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-3.5 px-5 pt-[18px]">
        {title.sinopse && <p className="text-sm leading-normal text-body">{title.sinopse}</p>}
        {title.elenco.length > 0 && (
          <p className="text-[12.5px] leading-snug text-mute">
            <b className="font-bold text-soft">Elenco:</b> {title.elenco.slice(0, 5).join(", ")}
          </p>
        )}

        {diff > 0 && (
          <div className="flex items-center gap-2.5 rounded-xl bg-card px-3.5 py-[11px] text-gio">
            <DiffIcon />
            <span className="text-[13.5px] font-bold text-ink">Vocês discordaram em {fmtNota(diff)} pontos</span>
          </div>
        )}

        {sessoes.map((s) => (
          <Sessao key={s.id} sessao={s} member={member} multiplas={sessoes.length > 1} />
        ))}

        <div className="mt-auto flex gap-2.5 pb-[22px] pt-2">
          <Link
            href={`/avaliar?titulo=${title.id}`}
            className="flex min-h-[52px] flex-1 items-center justify-center rounded-[26px] bg-gio text-[15.5px] font-extrabold text-bg"
          >
            {sessoes.length ? "Assistimos de novo" : "Avaliar"}
          </Link>
        </div>
      </div>
    </div>
  );
}

function Sessao({ sessao, member, multiplas }: { sessao: WatchSession; member: Member; multiplas: boolean }) {
  const participantes: Slug[] = sessao.quem === "ambos" ? ["lucas", "giovanna"] : [sessao.quem];
  const minhaFeita = sessao.reviews.some((r) => r.slug === member.slug && !r.rascunho);

  return (
    <section className="flex flex-col gap-3.5">
      {multiplas && (
        <div className="flex items-center gap-2 pt-1 text-[13px] font-bold text-soft">
          <WhoIcon quem={sessao.quem} size={20} ring="#0E1419" />
          {LOCAL_LABEL[sessao.local]}, {fmtData(sessao.assistido_em)}
          {sessao.temporada ? ` · Temporada ${sessao.temporada}` : ""}
        </div>
      )}
      {!multiplas && sessao.temporada && <div className="text-[13px] font-bold text-soft">Temporada {sessao.temporada}</div>}

      {participantes.map((slug) => {
        const review = sessao.reviews.find((r) => r.slug === slug && !r.rascunho);
        if (review) return <CartaoAvaliacao key={slug} review={review} editavel={slug === member.slug} />;

        const nome = QUEM_LABEL[slug];
        const sou = slug === member.slug;
        return (
          <div key={slug} className="flex items-center gap-[11px] rounded-2xl border border-dashed border-line px-4 py-3.5">
            <WhoIcon quem={slug} size={34} ring="#0E1419" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-extrabold">{nome}</span>
              <span className="text-[13px] leading-snug text-mute">
                {sou
                  ? "Falta a sua avaliação."
                  : sessao.quem === "ambos" && !minhaFeita
                    ? `A nota ${slug === "giovanna" ? "da" : "do"} ${nome} aparece depois que você salvar a sua. Sem cola.`
                    : `${nome} ainda não avaliou.`}
              </span>
            </div>
            {sou && (
              <Link
                href={`/avaliar?sessao=${sessao.id}`}
                className="flex min-h-11 shrink-0 items-center rounded-full bg-gio px-4 text-[13px] font-extrabold text-bg"
              >
                Avaliar
              </Link>
            )}
          </div>
        );
      })}
    </section>
  );
}

function CartaoAvaliacao({ review, editavel }: { review: Review; editavel: boolean }) {
  const texto = review.texto ?? review.resumo_ia;
  return (
    <article className="flex flex-col gap-[11px] rounded-2xl bg-card p-4">
      <header className="flex items-center gap-[11px]">
        <WhoIcon quem={review.slug} size={34} ring="#17222C" />
        <span className="flex-1 text-base font-extrabold">{QUEM_LABEL[review.slug]}</span>
        <NotaGrande slug={review.slug} nota={review.nota} />
        {editavel && (
          <Link
            href={`/editar/${review.id}`}
            aria-label="Editar a avaliação"
            className="-mr-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-chip text-soft"
          >
            <PencilIcon />
          </Link>
        )}
      </header>
      {texto && <p className="whitespace-pre-line text-[14.5px] leading-[1.45] text-[#D4DFE8]">{texto}</p>}
      {review.tem_audio && <AudioButton reviewId={review.id} />}
      {review.transcricao && (
        <details className="text-[13px] text-mute">
          <summary className="min-h-9 cursor-pointer py-1.5 font-bold text-soft">Do jeito que falou</summary>
          <p className="whitespace-pre-line pb-1 pt-1 leading-relaxed text-body">{review.transcricao}</p>
        </details>
      )}
    </article>
  );
}
