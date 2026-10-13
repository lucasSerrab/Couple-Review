// Service worker do DataLug: só o essencial para funcionar com conexão fraca.
// - Arquivos estáticos do app (JS, CSS, fontes) e ícones: cache primeiro (são versionados pelo Next).
// - Navegação: rede primeiro, com a página "Sem conexão" quando não há rede.
// - API, áudio e dados do Supabase: nunca vão para o cache.
const VERSAO = "datalug-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSAO).then((c) => c.addAll([OFFLINE_URL])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== VERSAO).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  const mesmaOrigem = url.origin === self.location.origin;
  if (mesmaOrigem && url.pathname.startsWith("/api")) return;

  const estatico = mesmaOrigem && (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/pwa-icon/"));
  if (!estatico) return;

  event.respondWith(
    caches.open(VERSAO).then(async (cache) => {
      const guardado = await cache.match(req);
      if (guardado) return guardado;
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    }),
  );
});
