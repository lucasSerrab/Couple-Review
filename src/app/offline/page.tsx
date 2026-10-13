import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sem conexão" };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[420px] flex-col items-start justify-center gap-3 px-7">
      <h1 className="font-display text-[34px] font-extrabold leading-none tracking-[-0.02em]">Sem conexão</h1>
      <p className="text-[15px] leading-relaxed text-body">
        O DataLug precisa da internet para buscar e salvar. Assim que o sinal voltar, é só tentar de novo.
      </p>
      {/* <a> de propósito: recarrega a página inteira para tentar a rede de novo. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className="mt-2 flex min-h-12 items-center rounded-full bg-gio px-6 text-[15px] font-extrabold text-bg">
        Tentar de novo
      </a>
    </main>
  );
}
