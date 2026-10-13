import type { Metadata } from "next";
import Link from "next/link";
import { GiovannaIcon, LucasIcon, SearchIcon, CoupleIcon, WhoIcon } from "@/components/Icons";
import { Poster } from "@/components/Poster";
import { Chip, Vazio } from "@/components/ui";
import { getSession } from "@/lib/server/auth";
import { listarBiblioteca } from "@/lib/server/library";
import type { Quem, Tipo } from "@/lib/types";

export const metadata: Metadata = { title: "Biblioteca" };
export const dynamic = "force-dynamic";

const TIPOS: Tipo[] = ["filme", "serie", "anime"];
const QUEM: Quem[] = ["lucas", "giovanna", "ambos"];

function href(tipo?: Tipo, quem?: Quem) {
  const sp = new URLSearchParams();
  if (tipo) sp.set("tipo", tipo);
  if (quem) sp.set("quem", quem);
  const s = sp.toString();
  return s ? `/biblioteca?${s}` : "/biblioteca";
}

export default async function BibliotecaPage({ searchParams }: { searchParams: Promise<{ tipo?: string; quem?: string }> }) {
  const sp = await searchParams;
  const tipo = TIPOS.find((t) => t === sp.tipo);
  const quem = QUEM.find((q) => q === sp.quem);
  const { member } = (await getSession())!;
  const itens = listarBiblioteca(member, { tipo, quem });

  const filtroQuem = (q: Quem, rotulo: string, icone: React.ReactNode, largo = false) => {
    const ativo = quem === q;
    return (
      <Link
        key={q}
        href={href(tipo, ativo ? undefined : q)}
        replace
        scroll={false}
        aria-label={rotulo}
        aria-pressed={ativo}
        className={`flex h-10 items-center justify-center gap-[7px] rounded-full bg-chip text-[13px] font-bold ${
          largo ? "pl-1.5 pr-3" : "w-10"
        } ${ativo ? "border-[1.5px] border-gio" : "border-[1.5px] border-transparent"}`}
      >
        {icone}
        {largo && rotulo}
      </Link>
    );
  };

  return (
    <div>
      <header className="flex flex-col gap-3.5 bg-gradient-to-b from-[#1B2833] to-bg px-5 pb-3 pt-7 md:rounded-t-2xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h1 className="font-display text-[32px] font-extrabold leading-none tracking-[-0.02em]">Biblioteca</h1>
            <p className="text-[13px] text-mute">
              {itens.length} {itens.length === 1 ? "título" : "títulos"}, dois críticos
            </p>
          </div>
          <Link href="/buscar" aria-label="Buscar um título" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-chip">
            <SearchIcon />
          </Link>
        </div>

        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
          <Chip href={href(undefined, quem)} ativo={!tipo}>
            Tudo
          </Chip>
          <Chip href={href("filme", quem)} ativo={tipo === "filme"}>
            Filmes
          </Chip>
          <Chip href={href("serie", quem)} ativo={tipo === "serie"}>
            Séries
          </Chip>
          <Chip href={href("anime", quem)} ativo={tipo === "anime"}>
            Animes
          </Chip>
        </div>

        <div className="flex items-center gap-2">
          {filtroQuem("ambos", "Os dois", <CoupleIcon size={26} ring="#1C2A36" />, true)}
          {filtroQuem("lucas", "Só o Lucas", <LucasIcon size={26} />)}
          {filtroQuem("giovanna", "Só a Giovanna", <GiovannaIcon size={26} />)}
        </div>
      </header>

      <div className="px-5 pt-1">
        {itens.length === 0 ? (
          <Vazio
            titulo={tipo || quem ? "Nada com esse filtro" : "A biblioteca está vazia"}
            texto={
              tipo || quem
                ? "Tire um filtro ou avalie algo novo."
                : "Cada filme, série ou anime que vocês avaliarem aparece aqui, com pôster."
            }
            href="/avaliar"
            acao="Avaliar um título"
          />
        ) : (
          <ul className="grid grid-cols-3 gap-x-[11px] gap-y-3 md:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:gap-x-[18px] md:gap-y-5">
            {itens.map(({ title, quem: q }) => (
              <li key={title.id}>
                <Link href={`/titulo/${title.id}`} className="flex flex-col gap-1.5">
                  <Poster titulo={title.titulo} poster_url={title.poster_url}>
                    <span className="absolute right-[5px] top-[5px] drop-shadow-[0_1px_2px_rgba(0,0,0,.6)]">
                      <WhoIcon quem={q} size={24} ring="#1B2A38" />
                    </span>
                  </Poster>
                  <span className="text-[12.5px] font-bold leading-tight md:text-sm">{title.titulo}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
