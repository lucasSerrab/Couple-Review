"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client-api";
import { TIPO_LABEL } from "@/lib/format";
import type { Quem, SearchResult, Title } from "@/lib/types";
import { CoupleIcon, GiovannaIcon, LucasIcon, SearchIcon } from "./Icons";
import { Poster } from "./Poster";

const chave = (r: SearchResult) => `${r.media_type}-${r.tmdb_id}`;

export function BuscarView({ meuSlug }: { meuSlug: "lucas" | "giovanna" }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<SearchResult[] | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [paraQuem, setParaQuem] = useState<Quem>("ambos");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [naLista, setNaLista] = useState<Record<string, string>>({});
  const [anime, setAnime] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  useEffect(() => {
    const termo = q.trim();
    if (termo.length < 2) {
      setResultados(null);
      setErro(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setCarregando(true);
      setErro(null);
      try {
        const r = await api<{ results: SearchResult[] }>(`/api/titles/search?q=${encodeURIComponent(termo)}`, {
          signal: ctrl.signal,
        });
        setResultados(r.results);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setErro((e as Error).message);
      } finally {
        if (!ctrl.signal.aborted) setCarregando(false);
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  async function salvar(r: SearchResult) {
    const { title } = await api<{ title: Title }>("/api/titles", {
      method: "POST",
      json: anime[chave(r)] ? { ...r, tipo: "anime" } : r,
    });
    return title;
  }

  async function avaliar(r: SearchResult) {
    setOcupado(chave(r));
    setErro(null);
    try {
      const t = await salvar(r);
      router.push(`/avaliar?titulo=${t.id}`);
    } catch (e) {
      setErro((e as Error).message);
      setOcupado(null);
    }
  }

  async function paraWatchlist(r: SearchResult) {
    setOcupado(chave(r));
    setErro(null);
    try {
      const t = await salvar(r);
      await api("/api/watchlist", { method: "POST", json: { title_id: t.id, para_quem: paraQuem } });
      setNaLista((m) => ({ ...m, [chave(r)]: "Na watchlist" }));
    } catch (e) {
      const msg = (e as Error).message;
      if (/já está/i.test(msg)) setNaLista((m) => ({ ...m, [chave(r)]: "Já estava na watchlist" }));
      else setErro(msg);
    } finally {
      setOcupado(null);
    }
  }

  const opcao = (v: Quem, rotulo: string, icone: React.ReactNode) => (
    <button
      key={v}
      type="button"
      aria-pressed={paraQuem === v}
      onClick={() => setParaQuem(v)}
      className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-[12.5px] font-bold ${
        paraQuem === v ? "border-2 border-gio bg-[#241F0A]" : "border-[1.5px] border-line"
      }`}
    >
      {icone}
      {rotulo}
    </button>
  );

  return (
    <div className="flex flex-col gap-4 px-5 pb-6">
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute">
          <SearchIcon size={20} />
        </span>
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filme, série ou anime"
          aria-label="Buscar um título"
          className="campo h-[54px] pl-12"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-bold text-soft">Ao adicionar na watchlist, é para</span>
        <div className="flex gap-2">
          {opcao("ambos", "Os dois", <CoupleIcon size={20} ring="#0E1419" />)}
          {opcao("lucas", "Lucas", <LucasIcon size={20} />)}
          {opcao("giovanna", "Giovanna", <GiovannaIcon size={20} />)}
        </div>
      </div>

      {erro && (
        <p role="alert" className="text-sm font-semibold text-perigo">
          {erro}
        </p>
      )}

      {carregando && <p className="text-sm text-mute">Procurando...</p>}
      {resultados && resultados.length === 0 && !carregando && (
        <p className="text-sm text-mute">Nada encontrado para “{q.trim()}”. Tente outro nome.</p>
      )}
      {!resultados && !carregando && q.trim().length < 2 && (
        <p className="text-sm leading-relaxed text-mute">
          Digite o nome do título. Os dados e o pôster vêm do TMDB, e {meuSlug === "lucas" ? "a Giovanna" : "o Lucas"} vê
          tudo que você salvar.
        </p>
      )}

      <ul className="flex flex-col gap-3.5">
        {resultados?.map((r) => {
          const k = chave(r);
          const marca = naLista[k];
          return (
            <li key={k} className="flex gap-3.5">
              <Poster titulo={r.titulo} poster_url={r.poster_url} className="h-[84px] w-14 rounded-[5px]" fallbackSize="text-[10px]" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div>
                  <div className="text-[15.5px] font-extrabold leading-tight">{r.titulo}</div>
                  <div className="text-[12.5px] text-mute">
                    {TIPO_LABEL[r.tipo]}
                    {r.ano ? ` · ${r.ano}` : ""}
                  </div>
                </div>
                {r.fonte === "imdb" && (
                  <label className="flex min-h-8 items-center gap-2 text-[12.5px] font-semibold text-mute">
                    <input
                      type="checkbox"
                      checked={Boolean(anime[k])}
                      onChange={(e) => setAnime((m) => ({ ...m, [k]: e.target.checked }))}
                      className="size-4 accent-[#F1C40F]"
                    />
                    É anime
                  </label>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={ocupado === k}
                    onClick={() => avaliar(r)}
                    className="min-h-10 rounded-full bg-gio px-4 text-[13px] font-extrabold text-bg disabled:opacity-60"
                  >
                    Avaliar
                  </button>
                  {marca ? (
                    <span className="flex min-h-10 items-center px-2 text-[13px] font-bold text-lucas">{marca}</span>
                  ) : (
                    <button
                      type="button"
                      disabled={ocupado === k}
                      onClick={() => paraWatchlist(r)}
                      className="min-h-10 rounded-full border-[1.5px] border-line px-4 text-[13px] font-bold disabled:opacity-60"
                    >
                      Watchlist
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
