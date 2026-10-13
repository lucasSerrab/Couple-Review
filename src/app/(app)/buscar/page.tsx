import type { Metadata } from "next";
import { BuscarView } from "@/components/BuscarView";
import { VoltarLink } from "@/components/ui";
import { getSession } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Buscar título" };

export default async function BuscarPage() {
  const { member } = (await getSession())!;
  return (
    <div>
      <header className="flex items-center gap-3 px-5 pb-4 pt-5">
        <VoltarLink href="/biblioteca" label="Voltar" />
        <h1 className="font-display text-[26px] font-extrabold leading-none tracking-[-0.02em]">Buscar título</h1>
      </header>
      <BuscarView meuSlug={member.slug} />
    </div>
  );
}
