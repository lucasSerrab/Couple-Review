"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MIMES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
export const MAX_SEGUNDOS = 150;

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

/** Grava áudio pelo microfone. `onPronto` recebe o arquivo quando a gravação termina (manual ou no limite). */
export function useRecorder(onPronto: (audio: Blob, transcricao: string) => void) {
  const [gravando, setGravando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelouRef = useRef(false);
  const vozRef = useRef<SpeechRecognitionLike | null>(null);
  const textoRef = useRef("");
  const prontoRef = useRef(onPronto);
  useEffect(() => {
    prontoRef.current = onPronto;
  });

  const limpar = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      vozRef.current?.stop();
    } catch {
      // já tinha parado
    }
    streamRef.current = null;
    setGravando(false);
  }, []);

  const parar = useCallback(() => {
    const rec = recRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
  }, []);

  const cancelar = useCallback(() => {
    cancelouRef.current = true;
    parar();
    limpar();
  }, [parar, limpar]);

  /** Reconhecimento de voz do navegador (gratuito); serve de transcrição quando não há chave de IA. */
  function iniciarVoz() {
    textoRef.current = "";
    const Ctor = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike })
      .SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!Ctor) return;
    const voz = new Ctor();
    voz.lang = "pt-BR";
    voz.continuous = true;
    voz.interimResults = false;
    voz.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) textoRef.current += e.results[i][0].transcript + " ";
      }
    };
    // O Chrome encerra sozinho após uma pausa longa; reinicia enquanto ainda grava.
    voz.onend = () => {
      if (recRef.current?.state === "recording") {
        try {
          voz.start();
        } catch {
          // sem permissão ou já ativo
        }
      }
    };
    voz.onerror = () => {};
    vozRef.current = voz;
    try {
      voz.start();
    } catch {
      vozRef.current = null;
    }
  }

  const iniciar = useCallback(async () => {
    setErro(null);
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setErro("Este navegador não grava áudio. Escreva a avaliação ou abra o app em outro navegador.");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      const nome = (e as DOMException).name;
      setErro(
        nome === "NotAllowedError" || nome === "SecurityError"
          ? "Sem permissão para o microfone. Libere nas configurações do navegador e tente de novo."
          : "Não encontrei um microfone neste aparelho.",
      );
      return;
    }

    const mime = MIMES.find((m) => MediaRecorder.isTypeSupported(m));
    const rec = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: 32_000 });
    chunksRef.current = [];
    cancelouRef.current = false;
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      const tipo = rec.mimeType || mime || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: tipo });
      limpar();
      // O reconhecimento de voz entrega o último trecho um instante depois de parar.
      if (!cancelouRef.current && blob.size > 0) setTimeout(() => prontoRef.current(blob, textoRef.current.trim()), 700);
    };

    recRef.current = rec;
    streamRef.current = stream;
    iniciarVoz();
    rec.start(1000);
    setSegundos(0);
    setGravando(true);
    timerRef.current = setInterval(() => {
      setSegundos((s) => {
        if (s + 1 >= MAX_SEGUNDOS) parar();
        return s + 1;
      });
    }, 1000);
  }, [limpar, parar]);

  // Soltou a tela no meio da gravação: descarta.
  useEffect(() => cancelar, [cancelar]);

  return { gravando, segundos, erro, iniciar, parar, cancelar };
}

export function fmtTempo(seg: number): string {
  const s = Math.max(0, Math.floor(seg));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
