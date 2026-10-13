"use client";

import { useRef, useState } from "react";
import { PauseIcon, PlayIcon } from "./Icons";

/** "Ouvir o áudio original": busca a URL assinada só quando a pessoa pede. */
export function AudioButton({ reviewId }: { reviewId: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [estado, setEstado] = useState<"parado" | "carregando" | "tocando" | "erro">("parado");

  async function alternar() {
    const audio = ref.current;
    if (!audio) return;
    if (estado === "tocando") {
      audio.pause();
      setEstado("parado");
      return;
    }
    try {
      if (!audio.src) {
        setEstado("carregando");
        const res = await fetch(`/api/reviews/${reviewId}`);
        const json = (await res.json()) as { audio?: string | null };
        if (!res.ok || !json.audio) throw new Error();
        audio.src = json.audio;
      }
      await audio.play();
      setEstado("tocando");
    } catch {
      setEstado("erro");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={alternar}
        className="flex min-h-11 items-center gap-2 text-[13px] font-bold text-gio"
      >
        {estado === "tocando" ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
        {estado === "carregando" ? "Carregando..." : estado === "erro" ? "Não consegui tocar. Tentar de novo" : estado === "tocando" ? "Pausar" : "Ouvir o áudio original"}
      </button>
      <audio ref={ref} preload="none" onEnded={() => setEstado("parado")} />
    </>
  );
}
