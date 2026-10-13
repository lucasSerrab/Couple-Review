"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-api";
import { fmtNota, hojeISO, QUEM_LABEL, TIPO_LABEL } from "@/lib/format";
import type { Local, Quem, Slug, Tipo } from "@/lib/types";
import { CloseIcon } from "./Icons";
import { Poster } from "./Poster";
import { NotaGrande } from "./ui";
import { WhoIcon } from "./WhoIcon";

interface Props {
  reviewId: string;
  sessionId: string;
  slug: Slug;
  title: { id: string; titulo: string; ano: number | null; tipo: Tipo; poster_url: string | null };
  inicial: { nota: number; texto: string; data: string; local: Local; temporada: number | null; quem: Quem };
}

const LOCAIS: Local[] = ["cinema", "casa", "viagem", "outro"];
const LOCAL_CURTO: Record<Local, string> = { cinema: "Cinema", casa: "Casa", viagem: "Viagem", outro: "Outro" };

/** Ajusta nota, opinião, data, lugar e temporada de uma avaliação que já foi salva. */
export function EditarForm({ reviewId, sessionId, slug, title, inicial }: Props) {
  const router = useRouter();
  const [nota, setNota] = useState(inicial.nota);
  const [texto, setTexto] = useState(inicial.texto);
  const [data, setData] = useState(inicial.data);
  const [local, setLocal] = useState<Local>(inicial.local);
  const [temporada, setTemporada] = useState(inicial.temporada ? String(inicial.temporada) : "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const cor = slug === "lucas" ? "var(--color-lucas)" : "var(--color-gio)";

  async function salvar() {
    setErro(null);
    setSalvando(true);
    try {
      await api(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        json: {
          assistido_em: data || inicial.data,
          local,
          temporada: title.tipo !== "filme" && temporada ? Number(temporada) : null,
        },
      });
      await api(`/api/reviews/${reviewId}`, { method: "PATCH", json: { nota, texto: texto.trim() || null } });
      router.push(`/titulo/${title.id}`);
      router.refresh();
    } catch (e) {
      setErro((e as Error).message);
      setSalvando(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 px-5 pb-3.5 pt-5">
        <Link href={`/titulo/${title.id}`} replace aria-label="Fechar" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-chip">
          <CloseIcon />
        </Link>
        <h1 className="font-display text-[26px] font-extrabold leading-none tracking-[-0.02em]">Editar</h1>
      </div>

      <div className="flex flex-1 flex-col gap-[18px] px-5 pb-6">
        <div className="flex items-center gap-3 rounded-xl bg-card py-2.5 pl-2.5 pr-3">
          <Poster titulo={title.titulo} poster_url={title.poster_url} className="h-[66px] w-[46px] rounded-[5px]" fallbackSize="text-[8px]" />
          <div className="min-w-0 flex-1">
            <div className="text-[15.5px] font-extrabold leading-tight">{title.titulo}</div>
            <div className="text-[12.5px] text-mute">
              {TIPO_LABEL[title.tipo]}
              {title.ano ? ` de ${title.ano}` : ""}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-mute">
            <WhoIcon quem={inicial.quem} size={26} ring="#17222C" />
            {QUEM_LABEL[inicial.quem]}
          </div>
        </div>

        <div className="flex flex-col gap-[9px] rounded-2xl bg-card px-4 py-[15px]">
          <div className="flex items-center justify-between">
            <label htmlFor="nota" className="text-sm font-bold">
              Sua nota
            </label>
            <NotaGrande slug={slug} nota={nota} className="text-4xl" />
          </div>
          <input
            id="nota"
            type="range"
            min={0}
            max={10}
            step={0.5}
            value={nota}
            onChange={(e) => setNota(Number(e.target.value))}
            aria-valuetext={`${fmtNota(nota)} de 10`}
            className="nota"
            style={{ "--cor": cor, "--pct": `${nota * 10}%` } as React.CSSProperties}
          />
        </div>

        <div className="flex flex-col gap-[9px]">
          <label htmlFor="texto" className="text-[13px] font-bold text-soft">
            Em palavras
          </label>
          <textarea
            id="texto"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={5}
            maxLength={5000}
            className="campo resize-none py-[11px] text-[14.5px]"
          />
        </div>

        <div className="flex flex-col gap-[9px]">
          <label htmlFor="data" className="text-[13px] font-bold text-soft">
            Quando
          </label>
          <input
            id="data"
            type="date"
            value={data}
            max={hojeISO()}
            onChange={(e) => setData(e.target.value)}
            className="campo h-[46px] max-w-full min-w-0 text-[14.5px]"
          />
        </div>

        <div className="flex flex-col gap-[9px]">
          <span className="text-[13px] font-bold text-soft">Onde</span>
          <div className="grid grid-cols-4 gap-[5px]" role="group" aria-label="Onde">
            {LOCAIS.map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={local === l}
                onClick={() => setLocal(l)}
                className={`flex min-h-[46px] items-center justify-center rounded-xl text-[12.5px] ${
                  local === l ? "border-2 border-gio bg-[#241F0A] font-extrabold" : "border-[1.5px] border-line font-semibold"
                }`}
              >
                {LOCAL_CURTO[l]}
              </button>
            ))}
          </div>
        </div>

        {title.tipo !== "filme" && (
          <div className="flex items-center gap-3">
            <label htmlFor="temporada" className="text-[13px] font-bold text-soft">
              Temporada
            </label>
            <input
              id="temporada"
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              value={temporada}
              onChange={(e) => setTemporada(e.target.value)}
              placeholder="opcional"
              className="campo h-[46px] w-32 text-[14.5px]"
            />
          </div>
        )}

        {erro && (
          <p role="alert" className="text-sm font-semibold text-perigo">
            {erro}
          </p>
        )}
      </div>

      <div className="safe-b sticky bottom-0 z-10 flex gap-2.5 bg-bar px-5 pb-[22px] pt-3.5">
        <Link
          href={`/titulo/${title.id}`}
          replace
          className="flex min-h-[52px] shrink-0 items-center justify-center rounded-[26px] border-[1.5px] border-line px-[22px] text-[14.5px] font-bold"
        >
          Cancelar
        </Link>
        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="flex min-h-[52px] flex-1 items-center justify-center rounded-[26px] bg-gio text-base font-extrabold text-bg disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </>
  );
}
