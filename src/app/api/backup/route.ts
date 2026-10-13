import { route } from "@/lib/server/http";
import { gerarBackupTar } from "@/lib/server/backup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Baixa tudo (banco, áudios e fotos) num arquivo .tar.
export const GET = route(async () => {
  const tar = await gerarBackupTar();
  const dia = new Date().toISOString().slice(0, 10);
  return new Response(new Uint8Array(tar), {
    headers: {
      "content-type": "application/x-tar",
      "content-disposition": `attachment; filename="couple-review-backup-${dia}.tar"`,
      "cache-control": "no-store",
    },
  });
});
