"use client";

import { useRef, useState } from "react";
import type { Slug } from "@/lib/types";
import { WhoIcon } from "./WhoIcon";

/** Corta a foto em quadrado de 384px e manda como JPEG, para o arquivo ficar pequeno. */
async function reduzir(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const lado = Math.min(bmp.width, bmp.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 384;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#17222C"; // fundo para PNGs com transparência
  ctx.fillRect(0, 0, 384, 384);
  ctx.drawImage(bmp, (bmp.width - lado) / 2, (bmp.height - lado) / 2, lado, lado, 0, 0, 384, 384);
  return new Promise((ok, falha) => canvas.toBlob((b) => (b ? ok(b) : falha(new Error("falhou"))), "image/jpeg", 0.88));
}

/** Botão de trocar a foto. Com `grande`, mostra também a foto atual. */
export function FotoPerfil({ slug, grande = false }: { slug: Slug; grande?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function escolher(file: File | undefined) {
    if (!file) return;
    setErro(null);
    setEnviando(true);
    try {
      const form = new FormData();
      form.append("foto", await reduzir(file), "foto.jpg");
      const res = await fetch(`/api/perfis/${slug}/foto`, { method: "POST", body: form });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Não consegui salvar a foto.");
      // Recarrega tudo: as fotos aparecem em vários lugares e o navegador revalida pelo ETag.
      window.location.reload();
    } catch (e) {
      setErro((e as Error).message || "Não consegui usar essa imagem.");
      setEnviando(false);
    } finally {
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className={`flex flex-col gap-1.5 ${grande ? "items-start" : "items-center"}`}>
      {grande && (
        <div className="size-[104px] shrink-0 overflow-hidden rounded-full">
          <WhoIcon quem={slug} size={104} />
        </div>
      )}
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => escolher(e.target.files?.[0])} />
      <button
        type="button"
        disabled={enviando}
        onClick={() => input.current?.click()}
        className="min-h-10 rounded-full border-[1.5px] border-line px-3.5 text-[12.5px] font-bold text-soft disabled:opacity-60"
      >
        {enviando ? "Enviando..." : "Trocar foto"}
      </button>
      {erro && (
        <p role="alert" className="max-w-40 text-center text-xs font-semibold text-perigo">
          {erro}
        </p>
      )}
    </div>
  );
}
