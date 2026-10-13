"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client-api";
import { fmtData, fmtNota, hojeISO, LOCAL_LABEL, QUEM_LABEL, TIPO_LABEL } from "@/lib/format";
import { fmtTempo, MAX_SEGUNDOS, useRecorder } from "@/lib/use-recorder";
import type { Local, Quem, Slug, Tipo } from "@/lib/types";
import { CloseIcon, MicIcon, StopIcon } from "./Icons";
import { WhoIcon } from "./WhoIcon";
import { Poster } from "./Poster";
import { NotaGrande } from "./ui";

export interface AvaliarTitle {
  id: string;
  titulo: string;
  ano: number | null;
  tipo: Tipo;
  poster_url: string | null;
}

export interface AvaliarSessao {
  id: string;
  quem: Quem;
  assistido_em: string;
  local: Local;
}

interface Props {
  title: AvaliarTitle;
  sessao: AvaliarSessao | null;
  quemInicial: Quem;
  member: { slug: Slug; nome: string };
}

const LOCAIS: Local[] = ["cinema", "casa", "viagem", "outro"];
const LOCAL_CURTO: Record<Local, string> = { cinema: "Cinema", casa: "Casa", viagem: "Viagem", outro: "Outro" };

export function AvaliarForm({ title, sessao, quemInicial, member }: Props) {
  const router = useRouter();
  const [quem, setQuem] = useState<Quem>(sessao?.quem ?? quemInicial);
  const [data, setData] = useState(sessao?.assistido_em ?? "");
  const [local, setLocal] = useState<Local>(sessao?.local ?? "casa");
  const [temporada, setTemporada] = useState("");
  const [nota, setNota] = useState(8);
  const [texto, setTexto] = useState("");
  const [fase, setFase] = useState<"livre" | "salvando" | "processando">("livre");
  const [erro, setErro] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(sessao?.id ?? null);

  // O dia de hoje vem do aparelho (o servidor roda em UTC e erraria a data à noite).
  useEffect(() => {
    if (!data) setData(hojeISO());
  }, [data]);

  const participo = quem === "ambos" || quem === member.slug;
  const cor = member.slug === "lucas" ? "var(--color-lucas)" : "var(--color-gio)";
  const ocupado = fase !== "livre";

  async function garantirSessao(): Promise<string> {
    if (sessionIdRef.current) return sessionIdRef.current;
    const { session } = await api<{ session: { id: string } }>("/api/sessions", {
      method: "POST",
      json: {
        title_id: title.id,
        quem,
        assistido_em: data || hojeISO(),
        local,
        temporada: title.tipo !== "filme" && temporada ? Number(temporada) : null,
      },
    });
    sessionIdRef.current = session.id;
    return session.id;
  }

  async function salvar() {
    setErro(null);
    setFase("salvando");
    try {
      const sid = await garantirSessao();
      if (participo) {
        await api("/api/reviews", { method: "POST", json: { session_id: sid, nota, texto: texto.trim() || null } });
      }
      router.push(`/titulo/${title.id}`);
    } catch (e) {
      setErro((e as Error).message);
      setFase("livre");
    }
  }

  async function enviarAudio(blob: Blob, transcricao: string) {
    setErro(null);
    setFase("processando");
    try {
      const sid = await garantirSessao();
      const form = new FormData();
      form.append("session_id", sid);
      form.append("transcricao", transcricao);
      form.append("audio", new File([blob], "avaliacao", { type: blob.type }));
      const { review } = await api<{ review: { id: string } }>("/api/reviews/audio", { method: "POST", body: form });
      router.push(`/revisao/${review.id}`);
    } catch (e) {
      setErro((e as Error).message);
      setFase("livre");
    }
  }

  const rec = useRecorder(enviarAudio);

  const botaoQuem = (v: Quem, icone: React.ReactNode) => {
    const on = quem === v;
    return (
      <button
        key={v}
        type="button"
        aria-pressed={on}
        onClick={() => setQuem(v)}
        className={`flex min-h-[76px] flex-col items-center justify-center gap-[5px] rounded-[14px] text-[13px] ${
          on ? "border-2 border-gio bg-[#1F2A1E] font-extrabold" : "border-[1.5px] border-line bg-card font-bold"
        }`}
      >
        {icone}
        {QUEM_LABEL[v]}
      </button>
    );
  };

  return (
    <>
      <div className="flex items-center gap-3 px-5 pb-3.5 pt-5">
        <Link href={`/titulo/${title.id}`} replace aria-label="Fechar" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-chip">
          <CloseIcon />
        </Link>
        <h1 className="font-display text-[26px] font-extrabold leading-none tracking-[-0.02em]">Como foi?</h1>
      </div>

      <div className="flex flex-1 flex-col gap-[18px] px-5 pb-6">
        <Link href="/buscar" className="flex items-center gap-3 rounded-xl bg-card py-2.5 pl-2.5 pr-3">
          <Poster titulo={title.titulo} poster_url={title.poster_url} className="h-[66px] w-[46px] rounded-[5px]" fallbackSize="text-[8px]" />
          <div className="min-w-0 flex-1">
            <div className="text-[15.5px] font-extrabold leading-tight">{title.titulo}</div>
            <div className="text-[12.5px] text-mute">
              {TIPO_LABEL[title.tipo]}
              {title.ano ? ` de ${title.ano}` : ""}
            </div>
          </div>
          {!sessao && <span className="px-1.5 text-[13px] font-bold text-gio">Trocar</span>}
        </Link>

        {sessao ? (
          <p className="text-[13.5px] leading-snug text-mute">
            Sessão de {QUEM_LABEL[sessao.quem].toLowerCase()}: {LOCAL_LABEL[sessao.local].toLowerCase()}, {fmtData(sessao.assistido_em)}.
          </p>
        ) : (
          <>
            <fieldset className="flex flex-col gap-[9px]">
              <legend className="mb-[9px] text-[13px] font-bold text-soft">Quem assistiu</legend>
              <div className="grid grid-cols-3 gap-[9px]">
                {botaoQuem("lucas", <WhoIcon quem="lucas" size={38} />)}
                {botaoQuem("giovanna", <WhoIcon quem="giovanna" size={38} />)}
                {botaoQuem("ambos", <WhoIcon quem="ambos" size={38} ring="#17222C" />)}
              </div>
            </fieldset>

            <div className="flex flex-col gap-4">
              <div className="flex min-w-0 flex-col gap-[9px]">
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
              <div className="flex min-w-0 flex-col gap-[9px]">
                <span className="text-[13px] font-bold text-soft">Onde</span>
                <div className="flex gap-[5px]" role="group" aria-label="Onde">
                  {LOCAIS.slice(0, 3).map((l) => (
                    <button
                      key={l}
                      type="button"
                      aria-pressed={local === l}
                      onClick={() => setLocal(l)}
                      className={`flex min-h-[46px] flex-1 items-center justify-center rounded-xl text-[12.5px] ${
                        local === l ? "border-2 border-gio bg-[#241F0A] font-extrabold" : "border-[1.5px] border-line font-semibold"
                      }`}
                    >
                      {LOCAL_CURTO[l]}
                    </button>
                  ))}
                </div>
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
          </>
        )}

        {participo ? (
          <>
            <div className="flex flex-col gap-[9px] rounded-2xl bg-card px-4 py-[15px]">
              <div className="flex items-center justify-between">
                <label htmlFor="nota" className="text-sm font-bold">
                  Sua nota
                </label>
                <NotaGrande slug={member.slug} nota={nota} className="text-4xl" />
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
              {quem === "ambos" && (
                <p className="text-[12.5px] leading-snug text-mute">
                  A nota {member.slug === "lucas" ? "dela" : "dele"} aparece depois que você salvar a sua. Sem cola.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-[9px]">
              <label htmlFor="texto" className="text-[13px] font-bold text-soft">
                Em palavras
              </label>
              <textarea
                id="texto"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={3}
                maxLength={5000}
                placeholder="Escreva, ou use o botão amarelo e fale"
                className="campo resize-none py-[11px] text-[14.5px]"
              />
            </div>
          </>
        ) : (
          <p className="rounded-2xl bg-card p-4 text-sm leading-relaxed text-body">
            Quem assistiu {quem === "giovanna" ? "foi a Giovanna" : "foi o Lucas"}, então é {quem === "giovanna" ? "ela" : "ele"} quem avalia, no
            aparelho {quem === "giovanna" ? "dela" : "dele"}. Aqui só fica registrada a sessão.
          </p>
        )}

        {(erro || rec.erro) && (
          <p role="alert" className="text-sm font-semibold text-perigo">
            {erro ?? rec.erro}
          </p>
        )}
      </div>

      <div className="safe-b sticky bottom-0 z-10 flex items-center gap-3.5 bg-bar px-5 pb-[22px] pt-3.5">
        {participo && (
          <button
            type="button"
            onClick={rec.gravando ? rec.parar : rec.iniciar}
            disabled={ocupado}
            aria-label={rec.gravando ? "Parar a gravação" : "Gravar sua avaliação em áudio"}
            className={`flex size-[68px] shrink-0 items-center justify-center rounded-full bg-gio text-bg disabled:opacity-60 ${
              rec.gravando ? "gravando" : "shadow-[0_0_0_7px_rgba(241,196,15,.14)]"
            }`}
          >
            {rec.gravando ? <StopIcon size={28} /> : <MicIcon size={30} />}
          </button>
        )}
        <div className="min-w-0 flex-1" aria-live="polite">
          {fase === "processando" ? (
            <>
              <div className="text-[15px] font-extrabold">Ouvindo o que você disse...</div>
              <div className="text-[12.5px] leading-snug text-mute">Transcrevendo e resumindo, uns segundos.</div>
            </>
          ) : rec.gravando ? (
            <>
              <div className="text-[15px] font-extrabold tabular-nums">Gravando {fmtTempo(rec.segundos)}</div>
              <div className="text-[12.5px] leading-snug text-mute">
                Toque no quadrado quando terminar (máx. {fmtTempo(MAX_SEGUNDOS)})
              </div>
            </>
          ) : participo ? (
            <>
              <div className="text-[15px] font-extrabold">Fala aí</div>
              <div className="text-[12.5px] leading-snug text-mute">Mais rápido que digitar no escuro</div>
            </>
          ) : (
            <div className="text-[12.5px] leading-snug text-mute">
              {QUEM_LABEL[quem]} avalia por lá.
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={salvar}
          disabled={ocupado || rec.gravando}
          className="flex min-h-12 shrink-0 items-center justify-center rounded-3xl border-[1.5px] border-line px-5 text-[15px] font-extrabold disabled:opacity-50"
        >
          {fase === "salvando" ? "Salvando..." : participo ? "Salvar" : "Salvar sessão"}
        </button>
      </div>
    </>
  );
}
