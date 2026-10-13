import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "@/components/Icons";
import { Chip, Vazio } from "@/components/ui";
import { WatchlistRow } from "@/components/WatchlistRow";
import { haQuanto, QUEM_LABEL, TIPO_PLURAL } from "@/lib/format";
import { listarWatchlist } from "@/lib/server/watchlist";
import type { Tipo } from "@/lib/types";

export const metadata: Metadata = { title: "Watchlist" };
export const dynamic = "force-dynamic";

const TIPOS: Tipo[] = ["filme", "serie", "anime"];

export default async function WatchlistPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const sp = await searchParams;
  const tipo = TIPOS.find((t) => t === sp.tipo) ?? "filme";
  const todos = listarWatchlist();
  const itens = todos.filter((i) => i.title.tipo === tipo);
  const contagem = (t: Tipo) => todos.filter((i) => i.title.tipo === t).length;

  return (
    <div>
      <header className="flex items-center justify-between gap-3 px-5 pb-2.5 pt-7 md:rounded-t-2xl">
        <div>
          <h1 className="font-display text-[32px] font-extrabold leading-none tracking-[-0.02em]">Watchlist</h1>
          <p className="mt-[3px] text-[13px] text-mute">
            {todos.length === 0 ? "Nada em aberto" : `${todos.length} ${todos.length === 1 ? "promessa" : "promessas"} em aberto`}
          </p>
        </div>
        <Link href="/buscar" aria-label="Adicionar um título" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-chip">
          <PlusIcon />
        </Link>
      </header>

      <div className="flex flex-col gap-[18px] px-5 pt-2.5">
        <nav aria-label="Tipo" className="flex gap-2">
          {TIPOS.map((t) => (
            <Chip key={t} href={`/watchlist?tipo=${t}`} ativo={tipo === t}>
              {TIPO_PLURAL[t]} {contagem(t) > 0 && <span className="ml-1.5 opacity-70">{contagem(t)}</span>}
            </Chip>
          ))}
        </nav>

        {itens.length === 0 ? (
          <Vazio
            titulo={`Sem ${TIPO_PLURAL[tipo].toLowerCase()} na lista`}
            texto="Busquem um título e toquem em Watchlist para guardar para depois."
            href="/buscar"
            acao="Buscar título"
          />
        ) : (
          <ul className="flex flex-col gap-3.5">
            {itens.map((i) => (
              <WatchlistRow
                key={i.id}
                id={i.id}
                titleId={i.title.id}
                titulo={i.title.titulo}
                poster_url={i.title.poster_url}
                paraQuem={i.para_quem}
                legenda={`${i.adicionado_por ? QUEM_LABEL[i.adicionado_por] + " adicionou " : "Adicionado "}${haQuanto(i.adicionado_em)}`}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
