import Link from "next/link";
import { fmtNota } from "@/lib/format";
import type { Slug } from "@/lib/types";
import { WhoIcon } from "./WhoIcon";

/** Pílula de filtro (link). */
export function Chip({ href, ativo, children, replace = true }: { href: string; ativo: boolean; children: React.ReactNode; replace?: boolean }) {
  return (
    <Link
      href={href}
      replace={replace}
      scroll={false}
      aria-current={ativo ? "true" : undefined}
      className={`flex min-h-9 shrink-0 items-center rounded-full px-[15px] text-[13.5px] ${
        ativo ? "bg-gio font-bold text-bg" : "bg-chip font-semibold"
      }`}
    >
      {children}
    </Link>
  );
}

/** As duas notas lado a lado, cada uma com o ícone de quem deu. Esconde quem ainda não tem nota. */
export function Notas({ notas, size = 17 }: { notas: Record<Slug, number | null>; size?: number }) {
  const itens = (["lucas", "giovanna"] as const).filter((s) => notas[s] != null);
  if (itens.length === 0) return null;
  return (
    <div className="flex items-center gap-2.5">
      {itens.map((s) => (
        <span key={s} className="flex items-center gap-1">
          <WhoIcon quem={s} size={size} />
          <b className="text-[13px]">{fmtNota(notas[s])}</b>
        </span>
      ))}
    </div>
  );
}

export function NotaGrande({ slug, nota, className = "text-[34px]" }: { slug: Slug; nota: number; className?: string }) {
  return (
    <span className={`font-display font-extrabold leading-none tracking-[-0.02em] ${className} ${slug === "lucas" ? "text-lucas" : "text-gio"}`}>
      {fmtNota(nota)}
    </span>
  );
}

export function VoltarLink({ href, label, className = "bg-chip" }: { href: string; label: string; className?: string }) {
  return (
    <Link href={href} aria-label={label} className={`flex size-11 shrink-0 items-center justify-center rounded-full ${className}`}>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 4.8 7.8 12 15 19.2" />
      </svg>
    </Link>
  );
}

export function Vazio({ titulo, texto, href, acao }: { titulo: string; texto: string; href?: string; acao?: string }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-2xl bg-card p-5">
      <div className="font-display text-xl font-extrabold">{titulo}</div>
      <p className="text-sm leading-relaxed text-mute">{texto}</p>
      {href && acao && (
        <Link href={href} className="mt-2 flex min-h-11 items-center rounded-full bg-gio px-5 text-sm font-extrabold text-bg">
          {acao}
        </Link>
      )}
    </div>
  );
}
