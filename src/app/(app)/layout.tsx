import { redirect } from "next/navigation";
import { BottomNav, Sidebar } from "@/components/AppNav";
import { getSession } from "@/lib/server/auth";
import { contarTitulos } from "@/lib/server/titles";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/perfis");
  const { member } = session;

  return (
    <div className="md:flex md:gap-2.5 md:p-2.5">
      <Sidebar nome={member.nome} slug={member.slug} titulos={contarTitulos()} />
      <main className="min-w-0 flex-1 pb-[calc(74px+env(safe-area-inset-bottom))] md:rounded-2xl md:bg-[#141d25] md:pb-8">
        <div className="mx-auto w-full max-w-[560px] md:max-w-[1040px]">{children}</div>
      </main>
      <BottomNav slug={member.slug} />
    </div>
  );
}
