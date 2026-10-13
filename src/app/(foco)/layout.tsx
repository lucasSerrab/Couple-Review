import { redirect } from "next/navigation";
import { getSession } from "@/lib/server/auth";

/** Telas de foco (avaliar, revisar áudio): sem barra de navegação, com ações fixas embaixo. */
export default async function FocoLayout({ children }: { children: React.ReactNode }) {
  if (!(await getSession())) redirect("/perfis");
  return <div className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col">{children}</div>;
}
