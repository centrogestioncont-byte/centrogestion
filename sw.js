// Service Worker — dos cosas, y la segunda es nueva.
//
// 1 · Que Chrome ofrezca "Instalar aplicación" en vez de solo "Crear acceso
//     directo", para lo cual tiene que EXISTIR un handler de fetch. No cachea
//     nada: la app maneja su propia sincronización y un caché agresivo aquí
//     taparía el aviso de versión nueva, que es lo único que saca a un
//     aparato de su copia vieja.
//
// 2 · ARREGLO 114: enseñar la notificación cuando llega. Sus palabras del
//     11/10: "quiero que esta notificación me llegue al teléfono no solo
//     cuando yo abra la app".
const CACHE_NAME = "centrogestion-shell-v1";

self.addEventListener("install", function(event) {
  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  event.waitUntil(self.clients.claim());
});

// Passthrough: no interceptamos ni cacheamos nada.
self.addEventListener("fetch", function(event) {
  event.respondWith(fetch(event.request));
});

// ── ARREGLO 114 · la notificación ──────────────────────────────────────
// El contenido viene CIFRADO de extremo a extremo por el propio protocolo
// —las claves salen de este aparato al suscribirse— así que el texto con sus
// cifras viaja dentro sin que el servicio de push pueda leerlo. Por eso no
// hace falta que el service worker salga a buscar el texto a la API, que es
// lo que haría falta con un push vacío y lo que fallaría justo cuando no hay
// cobertura.
self.addEventListener("push", function(event) {
  var d = {};
  try { d = event.data ? event.data.json() : {}; } catch(e) { d = {}; }
  var titulo = d.titulo || "Centro de Gestión";
  var texto  = d.texto  || "Revisa tus tasas.";
  event.waitUntil(self.registration.showNotification(titulo, {
    body: texto,
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    // La CLAVE como tag: si por lo que sea llegan dos del mismo aviso, el
    // sistema reemplaza en vez de apilar dos iguales en la pantalla.
    tag: d.clave || "aviso-tasa",
    renotify: false,
    // Un aviso rojo cuesta dinero en cada remesa, así que ese no se va solo
    // de la pantalla de bloqueo.
    requireInteraction: (d.nivel === "rojo"),
    data: {url: "./?tab=calculadora"}
  }));
});

// Tocarla abre la app en Tasas. Si ya hay una ventana abierta se usa esa, en
// vez de abrir una segunda copia con su propio estado a medio cargar.
self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  var destino = (event.notification.data && event.notification.data.url) || "./";
  event.waitUntil(
    self.clients.matchAll({type:"window", includeUncontrolled:true}).then(function(lista){
      for (var i=0; i<lista.length; i++) {
        if (lista[i].url.indexOf(self.registration.scope) === 0 && "focus" in lista[i]) {
          if ("navigate" in lista[i]) { try { lista[i].navigate(destino); } catch(e) {} }
          return lista[i].focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(destino);
    })
  );
});
