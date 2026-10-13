"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Slug } from "@/lib/types";
import { WhoIcon } from "./Icons";

/** Corta a foto em quadrado de 384px e manda como JPEG, para o arquivo ficar pequeno. */
async function reduzir(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const lado = Math.min(bmp.width, bmp.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 384;
  canvas.getContext("2d")!.drawImage(bmp, (bmp.width - lado) / 2, (bmp.height - lado) / 2, lado, lado, 0, 0, 384, 384);
  return new Promise((ok, falha) => canvas.toBlob((b) => (b ? ok(b) : falha(new Error("falhou"))), "image/jpeg", 0.85));
}

export function FotoPerfil({ slug, avatar }: { slug: Slug; avatar: string | null }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(avatar);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function escolher(file: File | undefined) {
    if (!file) return;
    setErro(null);
    setEnviando(true);
    try {
      const form = new FormData();
      form.append("foto", await reduzir(file), "foto.jpg");
      const res = await fetch("/api/perfil/foto", { method: "POST", body: form });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "Não consegui salvar a foto.");
      setUrl(json.url);
      router.refresh();
    } catch (e) {
      setErro((e as Error).message || "Não consegui usar essa imagem.");
    } finally {
      setEnviando(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex size-[104px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-card">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="size-full object-cover" />
        ) : (
          <WhoIcon quem={slug} size={84} />
        )}
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => escolher(e.target.files?.[0])} />
      <button
        type="button"
        disabled={enviando}
        onClick={() => input.current?.click()}
        className="min-h-10 rounded-full border-[1.5px] border-line px-3.5 text-[12.5px] font-bold disabled:opacity-60"
      >
        {enviando ? "Enviando..." : url ? "Trocar foto" : "Colocar uma foto"}
      </button>
      {erro && (
        <p role="alert" className="text-xs font-semibold text-perigo">
          {erro}
        </p>
      )}
    </div>
  );
}
