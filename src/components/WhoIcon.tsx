"use client";

import { useState } from "react";
import type { Quem, Slug } from "@/lib/types";
import { GiovannaIcon, LucasIcon } from "./Icons";

/** Foto de perfil redonda; sem foto (ou se falhar), cai no desenho padrão. */
function Foto({ slug, size, ring }: { slug: Slug; size: number; ring?: string }) {
  const [falhou, setFalhou] = useState(false);
  if (falhou) return slug === "lucas" ? <LucasIcon size={size} /> : <GiovannaIcon size={size} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/perfis/${slug}/foto`}
      alt=""
      width={size}
      height={size}
      onError={() => setFalhou(true)}
      className="shrink-0 rounded-full bg-card object-cover"
      style={{ width: size, height: size, boxShadow: ring ? `0 0 0 ${Math.max(1.5, size / 14)}px ${ring}` : undefined }}
    />
  );
}

/**
 * Ícone de quem assistiu: a foto do Lucas, a da Giovanna, ou as duas coladas.
 * `ring` é a cor do fundo, para separar as fotos quando se sobrepõem.
 */
export function WhoIcon({ quem, size = 24, ring }: { quem: Quem; size?: number; ring?: string }) {
  if (quem !== "ambos") return <Foto slug={quem} size={size} ring={ring} />;
  const d = Math.round(size * 0.84);
  return (
    <span className="inline-flex shrink-0 items-center" style={{ width: Math.round(d * 1.62), height: d }}>
      <Foto slug="lucas" size={d} ring={ring ?? "#0E1419"} />
      <span style={{ marginLeft: -Math.round(d * 0.38) }} className="inline-flex">
        <Foto slug="giovanna" size={d} ring={ring ?? "#0E1419"} />
      </span>
    </span>
  );
}
