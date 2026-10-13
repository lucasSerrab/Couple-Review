import { z } from "zod";
import { route } from "@/lib/server/http";
import { lerAudio } from "@/lib/server/reviews";

export const runtime = "nodejs";

/** Serve o áudio com suporte a Range, para o navegador poder avançar e voltar. */
export const GET = route<{ id: string }>(async (req, { member }, { id }) => {
  const { data, mime } = await lerAudio(member, z.string().uuid().parse(id));
  const total = data.length;
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range") ?? "");
  const headers = { "content-type": mime, "accept-ranges": "bytes", "cache-control": "private, max-age=3600" };
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), total - 1) : total - 1;
    if (start <= end && start < total) {
      return new Response(new Uint8Array(data.subarray(start, end + 1)), {
        status: 206,
        headers: { ...headers, "content-range": `bytes ${start}-${end}/${total}`, "content-length": String(end - start + 1) },
      });
    }
  }
  return new Response(new Uint8Array(data), { headers: { ...headers, "content-length": String(total) } });
});
