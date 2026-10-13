import { cache } from "react";
import { cookies } from "next/headers";
import { get } from "../db";
import type { Member, Slug } from "../types";

export const COOKIE = "perfil";

interface UserRow {
  id: Slug;
  nome: string;
  icone: "masculino" | "feminino";
  avatar_v: number | null;
}

export function rowToMember(r: UserRow): Member {
  return {
    id: r.id,
    slug: r.id,
    nome: r.nome,
    icone: r.icone,
    avatar_url: r.avatar_v ? `/api/perfis/${r.id}/foto?v=${r.avatar_v}` : null,
  };
}

/** Perfil escolhido na tela "Quem está assistindo?" (sem senha, como numa TV). */
export const getSession = cache(async (): Promise<{ member: Member } | null> => {
  const slug = (await cookies()).get(COOKIE)?.value;
  if (slug !== "lucas" && slug !== "giovanna") return null;
  const row = get<UserRow>("select id, nome, icone, avatar_v from users where id = ?", slug);
  return row ? { member: rowToMember(row) } : null;
});

export function outro(slug: Slug): Slug {
  return slug === "lucas" ? "giovanna" : "lucas";
}
