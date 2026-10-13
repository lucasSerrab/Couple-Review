import { paletaDoTitulo } from "@/lib/format";

interface Props {
  titulo: string;
  poster_url: string | null;
  /** Classes de tamanho/forma. Padrão: pôster 2:3 que ocupa a largura do pai. */
  className?: string;
  /** Tamanho da fonte do título quando não há pôster. */
  fallbackSize?: string;
  children?: React.ReactNode;
}

/** Pôster do TMDB; sem pôster, um gradiente estável com o nome do título. */
export function Poster({ titulo, poster_url, className = "aspect-[2/3] w-full rounded-md", fallbackSize = "text-sm", children }: Props) {
  const { from, to, ink } = paletaDoTitulo(titulo);
  return (
    <div
      className={`relative shrink-0 overflow-hidden ${className}`}
      style={{ background: `linear-gradient(160deg, ${from}, ${to})` }}
    >
      {poster_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster_url} alt={`Pôster de ${titulo}`} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span
          className={`absolute inset-x-0 bottom-0 p-2 font-display font-extrabold leading-[1.05] ${fallbackSize}`}
          style={{ color: ink }}
        >
          {titulo}
        </span>
      )}
      {children}
    </div>
  );
}
