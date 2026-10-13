"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { api } from "@/lib/client-api";
import { clampNota, fmtNota } from "@/lib/format";
import { fmtTempo } from "@/lib/use-recorder";
import type { Slug } from "@/lib/types";
import { BackIcon, PauseIcon, PlayIcon, SparkIcon } from "./Icons";
import { NotaGrande } from "./ui";

interface Props {
  reviewId: string;
  sessionId: string;
  title: { id: string; titulo: string };
  slug: Slug;
  notaSugerida: number;
  resumoInicial: string;
  transcricao: string;
  audioUrl: string | null;
}

const BARRAS = 28;

/** Alturas das barrinhas do áudio: estáveis para a mesma avaliação. */
function alturas(seed: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return Array.from({ length: BARRAS }, () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    return 8 + (h % 26);
  });
}

export function RevisaoView({ reviewId, sessionId, title, slug, notaSugerida, resumoInicial, transcricao, audioUrl }: Props) {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [nota, setNota] = useState(notaSugerida);
  const [resumo, setResumo] = useState(resumoInicial);
  const [editando, setEditando] = useState(false);
  const [tocando, setTocando] = useState(false);
  const [atual, setAtual] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const [fase, setFase] = useState<"livre" | "salvando" | "descartando">("livre");
  const [erro, setErro] = useState<string | null>(null);
  const barras = useMemo(() => alturas(reviewId), [reviewId]);

  // Gravações do MediaRecorder costumam vir sem duração no arquivo (Infinity): nesse caso só mostramos o tempo corrido.
  const temDuracao = Number.isFinite(duracao) && duracao > 0;
  const progresso = temDuracao ? atual / duracao : 0;

  async function alternarAudio() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) await a.play().catch(() => setErro("Não consegui tocar o áudio."));
    else a.pause();
  }

  async function salvar() {
    setErro(null);
    setFase("salvando");
    try {
      await api(`/api/reviews/${reviewId}`, { method: "PATCH", json: { nota, texto: resumo.trim() || null } });
      router.push(`/titulo/${title.id}`);
    } catch (e) {
      setErro((e as Error).message);
      setFase("livre");
    }
  }

  async function gravarDeNovo() {
    setErro(null);
    setFase("descartando");
    try {
      const { sessaoMantida } = await api<{ sessaoMantida: boolean }>(`/api/reviews/${reviewId}`, { method: "DELETE" });
      router.replace(sessaoMantida ? `/avaliar?sessao=${sessionId}` : `/avaliar?titulo=${title.id}`);
    } catch (e) {
      setErro((e as Error).message);
      setFase("livre");
    }
  }

  const ocupado = fase !== "livre";

  return (
    <>
      <div className="flex items-center gap-3 px-5 pb-3.5 pt-5">
        <Link href={`/titulo/${title.id}`} aria-label="Voltar" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-chip">
          <BackIcon />
        </Link>
        <div className="min-w-0">
          <h1 className="font-display text-[26px] font-extrabold leading-[1.05] tracking-[-0.02em]">Confere pra mim</h1>
          <p className="mt-[3px] truncate text-[13px] text-mute">Seu áudio sobre {title.titulo}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3.5 px-5">
        {audioUrl && (
          <div className="flex items-center gap-[13px] rounded-[14px] bg-card py-[11px] pl-[11px] pr-3.5">
            <button
              type="button"
              onClick={alternarAudio}
              aria-label={tocando ? "Pausar o áudio" : "Tocar o áudio"}
              className="flex size-[46px] shrink-0 items-center justify-center rounded-full bg-gio text-bg"
            >
              {tocando ? <PauseIcon size={20} /> : <PlayIcon size={22} />}
            </button>
            <div className="flex h-[34px] min-w-0 flex-1 items-center gap-[3px]" aria-hidden="true">
              {barras.map((h, i) => (
                <i
                  key={i}
                  className="block w-[3px] shrink-0 rounded-sm"
                  style={{ height: h, background: i / BARRAS < progresso || (!temDuracao && tocando) ? "var(--color-gio)" : "var(--color-line)" }}
                />
              ))}
            </div>
            <span className="shrink-0 text-[13px] font-semibold tabular-nums text-mute">
              {fmtTempo(temDuracao && !tocando && atual === 0 ? duracao : atual)}
            </span>
            <audio
              ref={audioRef}
              src={audioUrl}
              preload="metadata"
              onPlay={() => setTocando(true)}
              onPause={() => setTocando(false)}
              onEnded={() => {
                setTocando(false);
                setAtual(0);
              }}
              onTimeUpdate={(e) => setAtual(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuracao(e.currentTarget.duration)}
              onDurationChange={(e) => setDuracao(e.currentTarget.duration)}
            />
          </div>
        )}

        <section className="flex flex-col gap-[11px] rounded-[18px] border-[1.5px] border-lucas bg-[linear-gradient(150deg,#1E2E24,#17222C_60%)] p-[17px]">
          <div className="flex items-center gap-2 text-lucas">
            <SparkIcon size={20} />
            <h2 className="text-sm font-extrabold">O que a IA entendeu</h2>
          </div>
          {editando ? (
            <textarea
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
              rows={5}
              maxLength={5000}
              aria-label="Resumo da avaliação"
              className="campo resize-none py-3 text-base leading-snug"
            />
          ) : (
            <p className="whitespace-pre-line text-[16.5px] font-medium leading-[1.45]">{resumo || "Sem resumo. Toque em editar para escrever."}</p>
          )}
          <button
            type="button"
            onClick={() => setEditando((v) => !v)}
            className="min-h-11 self-start text-[13px] font-bold text-gio"
          >
            {editando ? "Pronto" : "Editar o resumo"}
          </button>
        </section>

        <section className="flex items-center justify-between gap-2.5 rounded-2xl bg-card px-4 py-3.5">
          <div className="min-w-0">
            <div className="text-sm font-bold">Ela sugeriu {fmtNota(notaSugerida)}</div>
            <div className="text-[12.5px] leading-snug text-mute">Discorda? Ajusta aí</div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="Diminuir a nota"
              onClick={() => setNota((n) => clampNota(n - 0.5))}
              className="size-11 rounded-full border-[1.5px] border-line text-[21px] leading-none"
            >
              −
            </button>
            <NotaGrande slug={slug} nota={nota} className="min-w-[54px] text-center text-[34px]" />
            <button
              type="button"
              aria-label="Aumentar a nota"
              onClick={() => setNota((n) => clampNota(n + 0.5))}
              className="size-11 rounded-full border-[1.5px] border-line text-[21px] leading-none"
            >
              +
            </button>
          </div>
        </section>

        {transcricao && (
          <section className="flex flex-col gap-[9px] rounded-2xl bg-card p-4">
            <h2 className="text-sm font-extrabold text-soft">Do jeito que você falou</h2>
            <p className="whitespace-pre-line text-sm leading-normal text-body">{transcricao}</p>
            <p className="text-[12.5px] leading-snug text-mute">Fica guardado para sempre, com os “tipo assim” e tudo mais.</p>
          </section>
        )}

        {erro && (
          <p role="alert" className="text-sm font-semibold text-perigo">
            {erro}
          </p>
        )}
      </div>

      <div className="safe-b sticky bottom-0 z-10 mt-3.5 flex gap-2.5 bg-bar px-5 pb-[22px] pt-3.5">
        <button
          type="button"
          onClick={gravarDeNovo}
          disabled={ocupado}
          className="flex min-h-[52px] shrink-0 items-center justify-center rounded-[26px] border-[1.5px] border-line px-[18px] text-[14.5px] font-bold disabled:opacity-50"
        >
          {fase === "descartando" ? "Descartando..." : "Gravar de novo"}
        </button>
        <button
          type="button"
          onClick={salvar}
          disabled={ocupado}
          className="flex min-h-[52px] flex-1 items-center justify-center rounded-[26px] bg-gio text-base font-extrabold text-bg disabled:opacity-60"
        >
          {fase === "salvando" ? "Salvando..." : "Salvar avaliação"}
        </button>
      </div>
    </>
  );
}
