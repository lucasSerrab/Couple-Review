"use client";

import { useEffect } from "react";

export function BottomSheet({ aberto, onFechar, titulo, children }: { aberto: boolean; onFechar: () => void; titulo: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [aberto, onFechar]);

  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={titulo}>
      <button type="button" aria-label="Fechar" onClick={onFechar} className="absolute inset-0 bg-black/60" />
      <div className="safe-b relative flex w-full max-w-[480px] flex-col gap-2.5 rounded-t-3xl bg-card px-5 pb-6 pt-5 md:rounded-3xl">
        <h2 className="font-display text-[22px] font-extrabold leading-tight tracking-[-0.01em]">{titulo}</h2>
        {children}
      </div>
    </div>
  );
}
