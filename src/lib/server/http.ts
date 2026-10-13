import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { Member } from "../types";
import { getSession } from "./auth";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export interface Ctx {
  member: Member;
}

type Handler<P> = (req: Request, ctx: Ctx, params: P) => Promise<Response | object>;

/** Envolve um route handler: exige um perfil escolhido, trata erros e devolve JSON. */
export function route<P = Record<string, never>>(handler: Handler<P>) {
  return async (req: Request, { params }: { params: Promise<P> }) => {
    try {
      const session = await getSession();
      if (!session) throw new ApiError(401, "Escolha quem está assistindo para continuar.");
      const out = await handler(req, session, await params);
      return out instanceof Response ? out : NextResponse.json(out);
    } catch (e) {
      return erro(e);
    }
  };
}

export function erro(e: unknown): Response {
  if (e instanceof ApiError) return NextResponse.json({ error: e.message }, { status: e.status });
  if (e instanceof ZodError) {
    return NextResponse.json({ error: "Dados inválidos.", detalhes: e.flatten().fieldErrors }, { status: 400 });
  }
  console.error("[api]", e);
  return NextResponse.json({ error: "Algo deu errado do nosso lado." }, { status: 500 });
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "Corpo da requisição inválido.");
  }
}
