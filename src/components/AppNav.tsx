"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, LibraryIcon, PlusIcon, PopcornIcon, SearchIcon } from "./Icons";
import { WhoIcon } from "./WhoIcon";
import type { Slug } from "@/lib/types";

function ativo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

const itemMobile = "flex min-h-14 min-w-14 flex-col items-center justify-center gap-1 text-[10.5px] font-bold";

/** Barra inferior (celular). O botão amarelo do meio é sempre "avaliar". */
export function BottomNav({ slug }: { slug: Slug }) {
  const pathname = usePathname();
  const cor = (href: string) => (ativo(pathname, href) ? "text-gio" : "text-mute");
  return (
    <nav
      aria-label="Navegação principal"
      className="safe-b fixed inset-x-0 bottom-0 z-30 flex h-[74px] items-center justify-around bg-bar px-1.5 md:hidden"
    >
      <Link href="/" className={`${itemMobile} ${cor("/")}`}>
        <HomeIcon />
        Início
      </Link>
      <Link href="/biblioteca" className={`${itemMobile} ${cor("/biblioteca")}`}>
        <LibraryIcon />
        Biblioteca
      </Link>
      <Link
        href="/avaliar"
        aria-label="Nova avaliação"
        className="flex size-[58px] items-center justify-center rounded-full bg-gio text-bg"
      >
        <PlusIcon size={30} strokeWidth={2.6} />
      </Link>
      <Link href="/watchlist" className={`${itemMobile} ${cor("/watchlist")}`}>
        <PopcornIcon />
        Watchlist
      </Link>
      <Link href="/perfil" className={`${itemMobile} ${cor("/perfil")}`}>
        <WhoIcon quem={slug} size={26} />
        Perfil
      </Link>
    </nav>
  );
}

const itemSide = "flex min-h-[46px] items-center gap-[11px] rounded-[10px] px-3.5 text-[14.5px] font-bold";

/** Menu lateral (computador). */
export function Sidebar({ nome, slug, titulos }: { nome: string; slug: Slug; titulos: number }) {
  const pathname = usePathname();
  const cls = (href: string) => `${itemSide} ${ativo(pathname, href) ? "bg-chip text-gio font-extrabold" : "text-mute hover:text-ink"}`;
  return (
    <aside className="sticky top-2.5 hidden h-[calc(100dvh-20px)] w-60 shrink-0 flex-col gap-1.5 rounded-2xl bg-bar px-4 py-6 md:flex">
      <Link href="/" className="mb-5 flex items-center gap-2.5 px-2">
        <WhoIcon quem="ambos" size={36} ring="#121B23" />
        <span className="font-display text-[21px] font-extrabold leading-[1.05] tracking-[-0.02em]">Couple Review</span>
      </Link>
      <Link href="/" className={cls("/")}>
        <HomeIcon size={21} />
        Início
      </Link>
      <Link href="/biblioteca" className={cls("/biblioteca")}>
        <LibraryIcon size={21} />
        Biblioteca
      </Link>
      <Link href="/watchlist" className={cls("/watchlist")}>
        <PopcornIcon size={21} />
        Watchlist
      </Link>
      <Link href="/buscar" className={cls("/buscar")}>
        <SearchIcon size={21} />
        Buscar título
      </Link>
      <Link href="/perfil" className={cls("/perfil")}>
        <WhoIcon quem={slug} size={24} />
        Perfil
      </Link>
      <Link
        href="/avaliar"
        className="mt-6 flex min-h-[52px] items-center justify-center gap-[9px] rounded-full bg-gio text-[15px] font-extrabold text-bg"
      >
        <PlusIcon size={20} strokeWidth={2.6} />
        Avaliar
      </Link>
      <div className="mt-auto flex items-center gap-2.5 px-2 pt-3.5">
        <WhoIcon quem={slug} size={38} />
        <div className="min-w-0">
          <div className="text-sm font-extrabold">{nome}</div>
          <div className="text-xs text-mute">{titulos} títulos</div>
        </div>
      </div>
    </aside>
  );
}
