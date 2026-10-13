/** Chamadas à API interna a partir do navegador. Sempre devolvem dados ou lançam um Error com mensagem em português. */
export async function api<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: json !== undefined ? { "content-type": "application/json", ...rest.headers } : rest.headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new Error("Sem conexão. Confira a internet e tente de novo.");
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Sua sessão acabou. Entre de novo.");
  }
  if (!res.ok) throw new Error(data.error ?? "Algo deu errado. Tente de novo.");
  return data as T;
}
