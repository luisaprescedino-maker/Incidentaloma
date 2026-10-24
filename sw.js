/* =========================================================
   SERVICE WORKER: guarda o app no aparelho para funcionar sem internet.

   Como funciona: quando há internet, o app sempre busca a versão mais
   nova dos arquivos (e guarda uma cópia). Sem internet, usa a cópia
   guardada. Por isso, quando a atualização semanal publica novidades,
   basta abrir o app com internet para recebê-las.
   ========================================================= */

const CACHE = "incidentaloma-v1";

const ARQUIVOS = [
  "./",
  "./index.html",
  "./estilo.css",
  "./app.js",
  "./dados/novidades.json",
  "./dados/fatos.json",
  "./manifest.webmanifest",
  "./icones/icone.svg",
  "./icones/icone-192.png",
  "./icones/icone-512.png",
  "./icones/icone-maskable-512.png",
  "./icones/apple-touch-icon.png",
];

self.addEventListener("install", evento => {
  evento.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", evento => {
  evento.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(nomes.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Tenta a internet por até 4 segundos; se falhar, usa a cópia guardada.
function redePrimeiro(pedido) {
  return caches.open(CACHE).then(cache => {
    const daRede = fetch(pedido).then(resposta => {
      if (resposta.ok) cache.put(pedido, resposta.clone());
      return resposta;
    });
    const limite = new Promise((_, falhar) => setTimeout(falhar, 4000));
    return Promise.race([daRede, limite]).catch(() =>
      cache.match(pedido, { ignoreSearch: true })
        .then(guardado => guardado || daRede)
        .catch(() => cache.match("./index.html"))
    );
  });
}

// Fontes: usa a cópia guardada na hora e atualiza em segundo plano.
function guardadoPrimeiro(pedido) {
  return caches.open(CACHE).then(cache =>
    cache.match(pedido).then(guardado => {
      const daRede = fetch(pedido).then(resposta => {
        if (resposta.ok || resposta.type === "opaque") cache.put(pedido, resposta.clone());
        return resposta;
      }).catch(() => guardado);
      return guardado || daRede;
    })
  );
}

self.addEventListener("fetch", evento => {
  const pedido = evento.request;
  if (pedido.method !== "GET") return;
  const url = new URL(pedido.url);

  if (url.origin === self.location.origin) {
    evento.respondWith(redePrimeiro(pedido));
  } else if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    evento.respondWith(guardadoPrimeiro(pedido));
  }
});
