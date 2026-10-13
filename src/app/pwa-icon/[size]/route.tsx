import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { DATA_DIR } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function foto(slug: string): Promise<string | null> {
  try {
    const data = await fs.readFile(path.join(DATA_DIR, "avatars", `${slug}.jpg`));
    // O ícone só aceita JPEG ou PNG de verdade; qualquer outra coisa é ignorada (volta a cor lisa).
    const mime = data[0] === 0xff && data[1] === 0xd8 ? "image/jpeg" : data[0] === 0x89 && data[1] === 0x50 ? "image/png" : null;
    return mime ? `data:${mime};base64,${data.toString("base64")}` : null;
  } catch {
    return null;
  }
}

/** Ícone do app: as fotos de perfil de Lucas e Giovanna lado a lado. `?maskable=1` deixa margem de segurança. */
export async function GET(req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params;
  const size = Number(raw);
  if (![180, 192, 512].includes(size)) return new Response("Not found", { status: 404 });
  const maskable = new URL(req.url).searchParams.has("maskable");
  const [lucas, giovanna] = await Promise.all([foto("lucas"), foto("giovanna")]);

  const d = Math.round(size * (maskable ? 0.36 : 0.46)); // diâmetro de cada foto
  const redondo = (src: string | null, cor: string, esquerda: number) => (
    <div
      style={{
        display: "flex",
        width: d,
        height: d,
        borderRadius: d,
        marginLeft: esquerda,
        border: `${Math.max(3, Math.round(size / 50))}px solid #0E1419`,
        background: cor,
        overflow: "hidden",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} width={d} height={d} style={{ width: d, height: d, objectFit: "cover" }} alt="" /> : null}
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #2C3E50 0%, #1B2833 55%, #0E1419 100%)",
          borderRadius: maskable ? 0 : size * 0.22,
        }}
      >
        {redondo(lucas, "#2ECC71", 0)}
        {redondo(giovanna, "#F1C40F", -Math.round(d * 0.28))}
      </div>
    ),
    { width: size, height: size, headers: { "cache-control": "no-cache" } },
  );
}
