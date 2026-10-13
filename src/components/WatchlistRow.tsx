"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-api";
import type { Quem } from "@/lib/types";
import { BottomSheet } from "./BottomSheet";
import { CheckIcon, WhoIcon } from "./Icons";
import { Poster } from "./Poster";

interface Props {
  id: string;
  titleId: string;
  titulo: string;
  poster_url: string | null;
  paraQuem: Quem;
  legenda: string;
}

/** Uma linha da watchlist. Marcar como visto oferece criar a sessão e avaliar. */
export function WatchlistRow({ id, titleId, titulo, poster_url, paraQuem, legenda }: Props) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function executar(fn: () => Promise<void>) {
    setOcupado(true);
    setErro(null);
    try {
      await fn();
    } catch (e) {
      setErro((e as Error).message);
      setOcupado(false);
    }
  }

  const avaliarAgora = () =>
    executar(async () => {
      await api(`/api/watchlist/${id}`, { method: "PATCH", json: { status: "assistido" } });
      router.push(`/avaliar?titulo=${titleId}&quem=${paraQuem}`);
    });

  const soMarcar = () =>
    executar(async () => {
      await api(`/api/watchlist/${id}`, { method: "PATCH", json: { status: "assistido" } });
      setAberto(false);
      setOcupado(false);
      router.refresh();
    });

  const remover = () =>
    executar(async () => {
      await api(`/api/watchlist/${id}`, { method: "DELETE" });
      setAberto(false);
      setOcupado(false);
      router.refresh();
    });

  return (
    <li className="flex items-center gap-[13px]">
      <Poster titulo={titulo} poster_url={poster_url} className="h-[68px] w-[46px] rounded-[5px]" fallbackSize="text-[8px]" />
      <div className="min-w-0 flex-1">
        <Link href={`/avaliar?titulo=${titleId}&quem=${paraQuem}`} className="block text-[15.5px] font-extrabold leading-tight">
          {titulo}
        </Link>
        <div className="text-[12.5px] text-mute">{legenda}</div>
      </div>
      <WhoIcon quem={paraQuem} size={26} ring="#0E1419" />
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label={`Marcar ${titulo} como assistido`}
        className="flex size-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-line text-lucas"
      >
        <CheckIcon size={20} />
      </button>

      <BottomSheet aberto={aberto} onFechar={() => !ocupado && setAberto(false)} titulo={`Vocês assistiram ${titulo}?`}>
        <p className="text-sm leading-snug text-mute">Dá para já registrar a sessão e a nota de vocês.</p>
        <button
          type="button"
          disabled={ocupado}
          onClick={avaliarAgora}
          className="mt-1 flex min-h-[52px] items-center justify-center rounded-[26px] bg-gio text-base font-extrabold text-bg disabled:opacity-60"
        >
          Avaliar agora
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={soMarcar}
          className="flex min-h-12 items-center justify-center rounded-3xl border-[1.5px] border-line text-[15px] font-bold disabled:opacity-60"
        >
          Só tirar da lista
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={remover}
          className="flex min-h-11 items-center justify-center text-sm font-bold text-perigo disabled:opacity-60"
        >
          Não vão ver, remover
        </button>
        {erro && (
          <p role="alert" className="text-sm font-semibold text-perigo">
            {erro}
          </p>
        )}
      </BottomSheet>
    </li>
  );
}
