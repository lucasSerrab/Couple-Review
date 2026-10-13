import Link from "next/link";
import { Greeting } from "@/components/Greeting";
import { ChevronIcon, CoupleIcon, MicIcon, PopcornIcon, SearchIcon } from "@/components/Icons";
import { Poster } from "@/components/Poster";
import { Notas, Vazio } from "@/components/ui";
import { fmtNota } from "@/lib/format";
import { getSession } from "@/lib/server/auth";
import { listarBiblioteca, maiorDivergencia } from "@/lib/server/library";
import { contarPendentes } from "@/lib/server/watchlist";

export const dynamic = "force-dynamic";

const tile = "flex min-h-14 items-center gap-2.5 overflow-hidden rounded-lg pr-2.5 text-sm font-extrabold leading-[1.15]";
const tileIcon = "flex size-14 shrink-0 items-center justify-center";

export default async function InicioPage() {
  const { member } = (await getSession())!;
  const itens = listarBiblioteca(member);
  const pendentes = contarPendentes();
  const recentes = itens.slice(0, 10);
  const polemico = maiorDivergencia(itens);

  const subtitulo =
    pendentes > 0
      ? `${pendentes} na watchlist, nenhuma decisão tomada`
      : itens.length > 0
        ? "Watchlist vazia. Hora de abastecer."
        : "Vamos começar o diário de vocês";

  return (
    <div className="flex flex-col">
      <header className="flex flex-col gap-[18px] bg-[linear-gradient(176deg,#2C3E50_0%,#1A2630_42%,#0E1419_100%)] px-5 pb-[18px] pt-[30px] md:rounded-t-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-[34px] font-extrabold leading-none tracking-[-0.02em]">
              <Greeting />, {member.nome}
            </h1>
            <p className="text-sm text-soft">{subtitulo}</p>
          </div>
          <Link
            href="/perfil"
            aria-label="Perfil"
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-bg"
          >
            <CoupleIcon size={34} ring="#0E1419" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Link href="/avaliar" className={`${tile} bg-gio text-bg`}>
            <span className={`${tileIcon} bg-bg/15`}>
              <MicIcon />
            </span>
            Avaliar
            <br />
            agora
          </Link>
          <Link href="/watchlist" className={`${tile} bg-chip`}>
            <span className={`${tileIcon} bg-line text-gio`}>
              <PopcornIcon />
            </span>
            Watchlist
          </Link>
          <Link href="/biblioteca?quem=ambos" className={`${tile} bg-chip`}>
            <span className={`${tileIcon} bg-line`}>
              <CoupleIcon size={30} ring="#2C3E50" />
            </span>
            Vistos
            <br />
            juntos
          </Link>
          <Link href="/buscar" className={`${tile} bg-chip`}>
            <span className={`${tileIcon} bg-line text-gio`}>
              <SearchIcon size={24} />
            </span>
            Buscar
            <br />
            título
          </Link>
        </div>
      </header>

      <div className="flex flex-col gap-[18px] pt-5">
        {recentes.length === 0 ? (
          <div className="px-5">
            <Vazio
              titulo="Nada no diário ainda"
              texto="Assistam alguma coisa e contem aqui o que acharam. Dá para gravar um áudio no lugar de digitar."
              href="/avaliar"
              acao="Avaliar o primeiro título"
            />
          </div>
        ) : (
          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between px-5">
              <h2 className="font-display text-[21px] font-extrabold tracking-[-0.01em]">Vocês acabaram de ver</h2>
              <Link href="/biblioteca" className="text-[13px] font-semibold text-soft">
                Ver tudo
              </Link>
            </div>
            <div className="flex snap-x gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
              {recentes.map(({ title, notas, quem }) => (
                <Link key={title.id} href={`/titulo/${title.id}`} className="flex w-[124px] shrink-0 snap-start flex-col gap-2">
                  <Poster titulo={title.titulo} poster_url={title.poster_url} className="h-[164px] w-[124px] rounded-md" fallbackSize="text-[17px]" />
                  <div className="text-sm font-bold leading-tight">{title.titulo}</div>
                  {quem === "ambos" && notas[member.slug] == null ? (
                    <div className="text-xs font-semibold text-gio">falta a sua nota</div>
                  ) : (
                    <Notas notas={notas} />
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {polemico && (
          <div className="px-5">
            <Link href={`/titulo/${polemico.item.title.id}`} className="flex items-center gap-3.5 rounded-2xl bg-card px-4 py-3.5">
              <div className="flex flex-1 flex-col gap-[3px]">
                <div className="text-[15px] font-extrabold">Vocês discordaram em {fmtNota(polemico.diff)}</div>
                <div className="text-[13px] leading-snug text-mute">
                  {polemico.item.title.titulo} é o título mais polêmico até agora
                </div>
              </div>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-line text-gio">
                <ChevronIcon />
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
