// Service worker mínimo: cachea la app para que funcione sin conexión
// después de la primera visita. No usa CDNs ni recursos externos.
const CACHE_NAME = "inspeccion-agua-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event)=>{
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache)=> cache.addAll(APP_SHELL)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event)=>{
  event.waitUntil(
    caches.keys().then((names)=>
      Promise.all(names.filter(n=>n!==CACHE_NAME).map(n=>caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Cache-first: sirve del caché si existe, y de paso actualiza el caché en segundo plano.
self.addEventListener("fetch", (event)=>{
  if(event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached)=>{
      const network = fetch(event.request).then((resp)=>{
        if(resp && resp.ok){
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(cache=> cache.put(event.request, copy));
        }
        return resp;
      }).catch(()=> cached);
      return cached || network;
    })
  );
});
