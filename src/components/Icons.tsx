import type { SVGProps } from "react";
import type { Quem } from "@/lib/types";

const INK = "#0E1419";
const LUCAS = "#2ECC71";
const GIO = "#F1C40F";

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, ...rest }: P) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

const line = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

// ---------------------------------------------------------------------------
// Sistema de ícones de quem assistiu (a assinatura visual do app)
// ---------------------------------------------------------------------------

export function LucasIcon({ size = 24, ...p }: P) {
  return (
    <Svg size={size} {...p}>
      <circle cx="12" cy="12.4" r="8" fill={LUCAS} />
      <path
        d="M4.1 12.2a7.9 7.9 0 0 1 15.8 0c-1.5.5-2.7-.2-3.2-1.4-1.1 1.1-2.7 1.7-4.7 1.7s-3.6-.6-4.7-1.7c-.5 1.2-1.7 1.9-3.2 1.4Z"
        fill={INK}
      />
      <circle cx="9.2" cy="13.2" r="1.05" fill={INK} />
      <circle cx="14.8" cy="13.2" r="1.05" fill={INK} />
      <path d="M10.3 16.3c.5.5 1.1.7 1.7.7s1.2-.2 1.7-.7" stroke={INK} strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </Svg>
  );
}

export function GiovannaIcon({ size = 24, ...p }: P) {
  return (
    <Svg size={size} {...p}>
      <path d="M4.3 20.4v-8.2a7.7 7.7 0 0 1 15.4 0v8.2c-1.4.5-2.5-.1-3-1.1v-7.6H7.3v7.6c-.5 1-1.6 1.6-3 1.1Z" fill={INK} />
      <circle cx="12" cy="12.4" r="7" fill={GIO} />
      <path
        d="M5.1 12.1a6.9 6.9 0 0 1 13.8 0c-1.3.5-2.4-.2-2.9-1.3-1 1-2.4 1.5-4 1.5s-3-.5-4-1.5c-.5 1.1-1.6 1.8-2.9 1.3Z"
        fill={INK}
      />
      <circle cx="9.5" cy="13.1" r=".95" fill={INK} />
      <circle cx="14.5" cy="13.1" r=".95" fill={INK} />
      <path d="M10.5 16c.45.45 1 .65 1.5.65s1.05-.2 1.5-.65" stroke={INK} strokeWidth="1.3" strokeLinecap="round" fill="none" />
    </Svg>
  );
}

/** Os dois ícones colados em um só. `ring` é a cor do fundo, para recortar os rostos. */
export function CoupleIcon({ size = 24, ring = INK, ...p }: P & { ring?: string }) {
  return (
    <Svg size={size} {...p}>
      <path d="M12.6 18.6v-5.8a4.5 4.5 0 0 1 9 0v5.8c-.8.3-1.5-.1-1.8-.7v-5.3h-5.4v5.3c-.3.6-1 1-1.8.7Z" fill={INK} />
      <circle cx="17.1" cy="12.6" r="4.1" fill={GIO} />
      <path
        d="M13 12.4a4.1 4.1 0 0 1 8.2 0c-.8.3-1.4-.1-1.7-.8-.6.6-1.4.9-2.4.9s-1.8-.3-2.4-.9c-.3.7-.9 1.1-1.7.8Z"
        fill={INK}
      />
      <circle cx="15.7" cy="13" r=".62" fill={INK} />
      <circle cx="18.5" cy="13" r=".62" fill={INK} />
      <circle cx="7.3" cy="12.6" r="5.2" fill={ring} />
      <circle cx="7.3" cy="12.6" r="4.1" fill={LUCAS} />
      <path
        d="M3.2 12.4a4.1 4.1 0 0 1 8.2 0c-.8.3-1.4-.1-1.7-.8-.6.6-1.4.9-2.4.9s-1.8-.3-2.4-.9c-.3.7-.9 1.1-1.7.8Z"
        fill={INK}
      />
      <circle cx="5.9" cy="13" r=".62" fill={INK} />
      <circle cx="8.7" cy="13" r=".62" fill={INK} />
    </Svg>
  );
}

/** Versão de contorno do par, para a barra de navegação. */
export function CoupleLine({ size = 23, ring = "#121B23", ...p }: P & { ring?: string }) {
  return (
    <Svg size={size} {...p}>
      <path d="M12.6 18.6v-5.8a4.5 4.5 0 0 1 9 0v5.8c-.8.3-1.5-.1-1.8-.7v-5.3h-5.4v5.3c-.3.6-1 1-1.8.7Z" fill="currentColor" />
      <circle cx="17.1" cy="12.6" r="4.1" fill={ring} stroke="currentColor" strokeWidth="1.3" />
      <circle cx="7.3" cy="12.6" r="5.2" fill={ring} />
      <circle cx="7.3" cy="12.6" r="4.1" fill={ring} stroke="currentColor" strokeWidth="1.3" />
      <path d="M3.4 11.6a4 4 0 0 1 7.8 0" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function WhoIcon({ quem, size = 24, ring }: { quem: Quem; size?: number; ring?: string }) {
  if (quem === "lucas") return <LucasIcon size={size} />;
  if (quem === "giovanna") return <GiovannaIcon size={size} />;
  return <CoupleIcon size={size} ring={ring} />;
}

// ---------------------------------------------------------------------------
// Ícones de interface
// ---------------------------------------------------------------------------

export const MicIcon = ({ size = 24, strokeWidth = 2.2, ...p }: P) => (
  <Svg size={size} {...line} strokeWidth={strokeWidth} {...p}>
    <rect x="9" y="2.8" width="6" height="11" rx="3" />
    <path d="M4.8 11.4a7.2 7.2 0 0 0 14.4 0M12 18.6v2.6" />
  </Svg>
);

export const SearchIcon = ({ size = 22, ...p }: P) => (
  <Svg size={size} {...line} strokeWidth={2.2} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20.2 20.2-4.2-4.2" />
  </Svg>
);

export const BackIcon = ({ size = 22, ...p }: P) => (
  <Svg size={size} {...line} strokeWidth={2.3} {...p}>
    <path d="M15 4.8 7.8 12 15 19.2" />
  </Svg>
);

export const ChevronIcon = ({ size = 20, ...p }: P) => (
  <Svg size={size} {...line} strokeWidth={2.4} {...p}>
    <path d="M9 5.5 15.5 12 9 18.5" />
  </Svg>
);

export const CloseIcon = ({ size = 22, ...p }: P) => (
  <Svg size={size} {...line} strokeWidth={2.3} {...p}>
    <path d="m6.4 6.4 11.2 11.2M17.6 6.4 6.4 17.6" />
  </Svg>
);

export const PlusIcon = ({ size = 22, ...p }: P) => (
  <Svg size={size} {...line} strokeWidth={2.3} {...p}>
    <path d="M12 5.2v13.6M5.2 12h13.6" />
  </Svg>
);

export const CheckIcon = ({ size = 22, ...p }: P) => (
  <Svg size={size} {...line} strokeWidth={2.6} {...p}>
    <path d="m5.4 12.4 4.6 4.6 8.6-9.6" />
  </Svg>
);

export const PlayIcon = ({ size = 22, ...p }: P) => (
  <Svg size={size} {...p}>
    <path d="M8.4 5.3 18.6 12 8.4 18.7Z" fill="currentColor" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
  </Svg>
);

export const PauseIcon = ({ size = 22, ...p }: P) => (
  <Svg size={size} {...p}>
    <rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" />
    <rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" />
  </Svg>
);

export const StopIcon = ({ size = 22, ...p }: P) => (
  <Svg size={size} {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2.6" fill="currentColor" />
  </Svg>
);

export const SparkIcon = ({ size = 22, ...p }: P) => (
  <Svg size={size} {...line} strokeWidth={2.1} {...p}>
    <path d="m12 3.4 2.3 5 5.4.6-4 3.7 1.1 5.3L12 15.4l-4.8 2.6 1.1-5.3-4-3.7 5.4-.6Z" />
  </Svg>
);

export const DiffIcon = ({ size = 20, ...p }: P) => (
  <Svg size={size} {...line} strokeWidth={2.1} {...p}>
    <path d="M4.5 18 9 7.5l4.5 7 2.5-3.5 3.5 7Z" />
  </Svg>
);

export const LockIcon = ({ size = 20, ...p }: P) => (
  <Svg size={size} {...line} strokeWidth={2.2} {...p}>
    <rect x="4.6" y="10.4" width="14.8" height="10" rx="3" />
    <path d="M8.2 10.4V8a3.8 3.8 0 0 1 7.6 0v2.4" />
  </Svg>
);

export const HomeIcon = ({ size = 23, ...p }: P) => (
  <Svg size={size} {...line} strokeWidth={2.1} {...p}>
    <path d="M3.6 10.8 12 3.8l8.4 7v8.4a1.8 1.8 0 0 1-1.8 1.8H5.4a1.8 1.8 0 0 1-1.8-1.8Z" />
  </Svg>
);

export const LibraryIcon = ({ size = 23, ...p }: P) => (
  <Svg size={size} {...line} strokeWidth={2.1} {...p}>
    <rect x="3.4" y="4.6" width="17.2" height="14.8" rx="3" />
    <path d="M8.4 4.6v14.8M15.6 4.6v14.8" />
  </Svg>
);

/** Pipoca, o ícone da watchlist. */
export const PopcornIcon = ({ size = 23, ...p }: P) => (
  <Svg size={size} {...line} strokeWidth={2.1} {...p}>
    <path d="M5.8 9.6h12.4l-1.2 9.4a2 2 0 0 1-2 1.7H9a2 2 0 0 1-2-1.7Z" />
    <path d="M9.8 9.6v10.6M14.2 9.6v10.6" />
    <path d="M8.7 9.5a2.3 2.3 0 0 1 1-3.7 2.5 2.5 0 0 1 4.6-1 2.3 2.3 0 0 1 1 4.6" />
  </Svg>
);

export const TrashIcon = ({ size = 20, ...p }: P) => (
  <Svg size={size} {...line} strokeWidth={2.1} {...p}>
    <path d="M4.5 7h15M9.5 7V4.8h5V7M6.8 7l.8 12a1.8 1.8 0 0 0 1.8 1.7h5.2a1.8 1.8 0 0 0 1.8-1.7l.8-12" />
  </Svg>
);

export const LogoutIcon = ({ size = 20, ...p }: P) => (
  <Svg size={size} {...line} strokeWidth={2.1} {...p}>
    <path d="M9.5 4.5H6.3a1.8 1.8 0 0 0-1.8 1.8v11.4a1.8 1.8 0 0 0 1.8 1.8h3.2M14 8l4 4-4 4M18 12H9.5" />
  </Svg>
);
