import type { Metadata } from "next";
import { trocarDePerfil } from "@/app/actions";
import { FotoPerfil } from "@/components/FotoPerfil";
import { LogoutIcon } from "@/components/Icons";
import { fmtNota } from "@/lib/format";
import { getSession } from "@/lib/server/auth";
import { listarBiblioteca } from "@/lib/server/library";

export const metadata: Metadata = { title: "Perfil" };
export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const { member } = (await getSession())!;
  const itens = listarBiblioteca(member);

  // Estatísticas simples a partir do que já está na biblioteca.
  const minhas = itens.map((i) => i.notas[member.slug]).filter((n): n is number => n != null);
  const media = minhas.length ? minhas.reduce((a, b) => a + b, 0) / minhas.length : null;
  const juntos = itens.filter((i) => i.quem === "ambos").length;
  const cor = member.slug === "lucas" ? "text-lucas" : "text-gio";

  return (
    <div>
      <header
        className="flex flex-col gap-[18px] px-5 pb-5 pt-[26px] md:rounded-t-2xl"
        style={{
          background:
            member.slug === "lucas"
              ? "linear-gradient(175deg,#1E3A2C 0%,#1A2730 52%,#0E1419 100%)"
              : "linear-gradient(175deg,#3A3412 0%,#1F2A2C 52%,#0E1419 100%)",
        }}
      >
        <div className="flex items-center gap-4">
          <FotoPerfil slug={member.slug} grande />
          <div className="flex min-w-0 flex-col gap-1.5">
            <h1 className="font-display text-[34px] font-extrabold leading-none tracking-[-0.02em]">{member.nome}</h1>
            <p className="text-[13.5px] text-soft">Dentro do diário de vocês</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4 p-5">
        <div className="grid grid-cols-3 gap-2.5">
          <div className="flex flex-col gap-0.5 rounded-[14px] bg-card px-3 py-3.5">
            <div className={`font-display text-[30px] font-extrabold leading-none tracking-[-0.02em] ${cor}`}>{fmtNota(media)}</div>
            <div className="text-[11.5px] leading-tight text-mute">sua média</div>
          </div>
          <div className="flex flex-col gap-0.5 rounded-[14px] bg-card px-3 py-3.5">
            <div className="font-display text-[30px] font-extrabold leading-none tracking-[-0.02em]">{minhas.length}</div>
            <div className="text-[11.5px] leading-tight text-mute">avaliados</div>
          </div>
          <div className="flex flex-col gap-0.5 rounded-[14px] bg-card px-3 py-3.5">
            <div className="font-display text-[30px] font-extrabold leading-none tracking-[-0.02em] text-gio">{juntos}</div>
            <div className="text-[11.5px] leading-tight text-mute">vistos juntos</div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 rounded-2xl bg-card p-4">
          <a
            href="/api/backup"
            download
            className="flex min-h-[48px] items-center justify-center rounded-[24px] bg-gio text-[15px] font-extrabold text-bg"
          >
            Baixar backup dos dados
          </a>
          <p className="text-[12.5px] leading-snug text-mute">
            Guarda avaliações, áudios e fotos num arquivo. Baixe de vez em quando e deixe no seu computador ou no Drive: se o servidor sair do ar, nada se perde.
          </p>
        </div>

        <form action={trocarDePerfil}>
          <button
            type="submit"
            className="flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-[26px] border-[1.5px] border-line text-[15px] font-bold"
          >
            <LogoutIcon />
            Trocar de perfil
          </button>
        </form>
      </div>
    </div>
  );
}
