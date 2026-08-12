// Service Worker mínimo — necesario para que Chrome ofrezca "Instalar
// aplicación" en vez de solo "Crear acceso directo". No cachea nada
// agresivamente para no interferir con Firebase/datos en vivo; solo
// deja pasar las peticiones normales.
const CACHE_NAME = "centrogestion-shell-v1";

self.addEventListener("install", function(event) {
  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  event.waitUntil(self.clients.claim());
});

// Passthrough: no interceptamos ni cacheamos nada — la app maneja su
// propia sincronización con Firebase. Este handler solo necesita EXISTIR
// para que Chrome considere la app "instalable" de verdad.
self.addEventListener("fetch", function(event) {
  event.respondWith(fetch(event.request));
});
