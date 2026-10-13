import type { Metadata } from "next";
import { escolherPerfil } from "@/app/actions";
import { FotoPerfil } from "@/components/FotoPerfil";
import { WhoIcon } from "@/components/WhoIcon";
import { all } from "@/lib/db";

export const metadata: Metadata = { title: "Quem está assistindo?" };
export const dynamic = "force-dynamic";

interface Row {
  id: "lucas" | "giovanna";
  nome: string;
}

export default function PerfisPage() {
  const perfis = all<Row>("select id, nome from users order by case id when 'lucas' then 0 else 1 end");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-10 px-6 py-10">
      <div className="flex items-center gap-3">
        <WhoIcon quem="ambos" size={44} />
        <span className="font-display text-2xl font-extrabold tracking-[-0.02em]">Couple Review</span>
      </div>
      <h1 className="text-center font-display text-[clamp(30px,6vw,46px)] font-extrabold leading-none tracking-[-0.03em]">
        Quem está assistindo?
      </h1>
      <div className="flex flex-wrap items-start justify-center gap-8 sm:gap-14">
        {perfis.map((p) => (
          <div key={p.id} className="flex flex-col items-center gap-3">
            <form action={escolherPerfil}>
              <input type="hidden" name="perfil" value={p.id} />
              <button type="submit" className="group flex flex-col items-center gap-4" aria-label={`Entrar como ${p.nome}`}>
                <span
                  className={`flex size-[clamp(120px,32vw,176px)] items-center justify-center overflow-hidden rounded-2xl border-4 border-transparent bg-card transition group-hover:scale-105 group-focus-visible:scale-105 ${
                    p.id === "lucas" ? "group-hover:border-lucas group-focus-visible:border-lucas" : "group-hover:border-gio group-focus-visible:border-gio"
                  }`}
                >
                  <span className="[&_img]:!size-[clamp(120px,32vw,176px)] [&_img]:!rounded-none [&_svg]:size-24">
                    <WhoIcon quem={p.id} size={176} />
                  </span>
                </span>
                <span className="text-xl font-extrabold text-soft transition group-hover:text-ink">{p.nome}</span>
              </button>
            </form>
            <FotoPerfil slug={p.id} />
          </div>
        ))}
      </div>
    </main>
  );
}
