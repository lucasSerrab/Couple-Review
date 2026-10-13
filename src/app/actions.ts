"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE } from "@/lib/server/auth";

export async function escolherPerfil(formData: FormData) {
  const slug = String(formData.get("perfil") ?? "");
  if (slug !== "lucas" && slug !== "giovanna") redirect("/perfis");
  (await cookies()).set(COOKIE, slug, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/");
}

export async function trocarDePerfil() {
  (await cookies()).delete(COOKIE);
  redirect("/perfis");
}
