
const CACHE_NAME = "cecytem-smart-v1";

const ARCHIVOS = [
  "./",
  "./index.html",
  "./estilos.css",
  "./app.js",
  "./firebase.js",
  "./manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(ARCHIVOS)
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Firebase necesita conexión; no guardamos respuestas de la base de datos.
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin
  ) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const copia = response.clone();
          caches.open(CACHE_NAME).then(cache =>
            cache.put(event.request, copia)
          );
        }
        return response;
      })
      .catch(async () => {
        const guardado = await caches.match(event.request);
        return guardado || caches.match("./index.html");
      })
  );
});
