import { ImageResponse } from "next/og";

const INK = "#0E1419";

/** Ícone do app: o par de Lucas e Giovanna sobre o fundo escuro. `?maskable=1` deixa margem de segurança. */
export async function GET(req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params;
  const size = Number(raw);
  if (![180, 192, 512].includes(size)) return new Response("Not found", { status: 404 });
  const maskable = new URL(req.url).searchParams.has("maskable");
  const arte = Math.round(size * (maskable ? 0.58 : 0.78));

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
        <svg width={arte} height={arte} viewBox="0 0 24 24">
          <path d="M12.6 18.6v-5.8a4.5 4.5 0 0 1 9 0v5.8c-.8.3-1.5-.1-1.8-.7v-5.3h-5.4v5.3c-.3.6-1 1-1.8.7Z" fill={INK} />
          <circle cx="17.1" cy="12.6" r="4.1" fill="#F1C40F" />
          <path d="M13 12.4a4.1 4.1 0 0 1 8.2 0c-.8.3-1.4-.1-1.7-.8-.6.6-1.4.9-2.4.9s-1.8-.3-2.4-.9c-.3.7-.9 1.1-1.7.8Z" fill={INK} />
          <circle cx="15.7" cy="13" r=".62" fill={INK} />
          <circle cx="18.5" cy="13" r=".62" fill={INK} />
          <circle cx="7.3" cy="12.6" r="5.2" fill="#1F2D3A" />
          <circle cx="7.3" cy="12.6" r="4.1" fill="#2ECC71" />
          <path d="M3.2 12.4a4.1 4.1 0 0 1 8.2 0c-.8.3-1.4-.1-1.7-.8-.6.6-1.4.9-2.4.9s-1.8-.3-2.4-.9c-.3.7-.9 1.1-1.7.8Z" fill={INK} />
          <circle cx="5.9" cy="13" r=".62" fill={INK} />
          <circle cx="8.7" cy="13" r=".62" fill={INK} />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
