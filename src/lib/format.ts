import type { Local, Quem, Tipo } from "./types";

/** 9.5 -> "9,5"; 8 -> "8,0" */
export function fmtNota(n: number | null | undefined): string {
  if (n == null) return "–";
  return n.toFixed(1).replace(".", ",");
}

/** Arredonda para o passo de 0,5 e prende entre 0 e 10. */
export function clampNota(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(10, Math.max(0, Math.round(n * 2) / 2));
}

/** "2026-10-11" -> "11 de outubro" (sem mexer com fuso, é só uma data). */
export function fmtData(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", timeZone: "UTC" }).format(dt);
}

export function fmtDataLonga(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(dt);
}

/** Minutos -> "2h49" ou "42min". */
export function fmtDuracao(min: number | null): string | null {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

export const TIPO_LABEL: Record<Tipo, string> = { filme: "Filme", serie: "Série", anime: "Anime" };
export const TIPO_PLURAL: Record<Tipo, string> = { filme: "Filmes", serie: "Séries", anime: "Animes" };

export const LOCAL_LABEL: Record<Local, string> = {
  cinema: "No cinema",
  casa: "Em casa",
  viagem: "Em viagem",
  outro: "Em outro lugar",
};

export const QUEM_LABEL: Record<Quem, string> = { lucas: "Lucas", giovanna: "Giovanna", ambos: "Os dois" };

export function hojeISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** "há 4 meses", "há 3 dias" a partir de um timestamp. */
export function haQuanto(iso: string, agora = Date.now()): string {
  const dias = Math.max(0, Math.floor((agora - new Date(iso).getTime()) / 86_400_000));
  if (dias < 1) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 30) return `há ${dias} dias`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return meses === 1 ? "há 1 mês" : `há ${meses} meses`;
  const anos = Math.floor(meses / 12);
  return anos === 1 ? "há 1 ano" : `há ${anos} anos`;
}

/** Gradiente estável a partir do título, usado quando não há pôster. */
const PALETAS: Array<[string, string, string]> = [
  ["#35506B", "#101C27", "#DCE6EF"],
  ["#B8532F", "#2E1108", "#F6E7DF"],
  ["#E08AA0", "#232052", "#F3E9F2"],
  ["#5E8A3E", "#14210D", "#E6EFDD"],
  ["#7B55A8", "#180D28", "#ECE4F5"],
  ["#3E9B9F", "#0A2023", "#DCEFF0"],
  ["#C09A3A", "#2E2408", "#F3EBD6"],
  ["#8C6142", "#231408", "#F0E4D9"],
  ["#4A6FA8", "#0C1526", "#E0E8F4"],
];

export function paletaDoTitulo(titulo: string): { from: string; to: string; ink: string } {
  let h = 0;
  for (let i = 0; i < titulo.length; i++) h = (h * 31 + titulo.charCodeAt(i)) >>> 0;
  const [from, to, ink] = PALETAS[h % PALETAS.length];
  return { from, to, ink };
}
