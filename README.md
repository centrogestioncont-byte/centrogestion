# Centro de Gestión

Sistema de gestión y control de operaciones 2026.

## Cómo está armado

Dos piezas:

| Pieza | Dónde vive | Qué es |
|---|---|---|
| Esta app | Cloudflare Pages | `index.html`: la aplicación entera, un archivo |
| La API | Railway | [`centrogestion-api`](https://github.com/centrogestioncont-byte/centrogestion-api): Python + MongoDB |

El navegador **no habla con ninguna base de datos**. Todo pasa por la API.

## Cómo se sincronizan los dispositivos

El dispositivo manda su bloque completo a `PUT /estado`. El **servidor** lo
fusiona contra lo que hay en Mongo y devuelve el resultado; el dispositivo
adopta lo que vuelve.

Que el árbitro sea uno solo es el punto. Antes cada teléfono fusionaba por su
cuenta con su propio reloj y escribía el nodo entero: el último en escribir
pisaba a los demás, y así se perdió contabilidad en agosto de 2026.

Para leer, cada dispositivo pregunta cada 8 segundos por `GET /estado/resumen`
—unos bytes, solo el reloj y los conteos— y se baja el bloque entero con
`GET /estado` únicamente cuando ese reloj avanzó.

Rutas que usa la app:

```
POST /auth/entrar          correo + clave  ->  testigo de sesión
GET  /auth/yo              quién soy (y renueva la sesión)
POST /auth/salir
GET  /clientes             la lista de clientes (CRUD completo)
GET  /usuarios             gestión de usuarios (solo admin)
GET  /estado               todo el resto del negocio
PUT  /estado               manda, el servidor fusiona, devuelve lo fusionado
GET  /estado/resumen       cuántos registros hay de cada cosa
GET  /auditoria            quién hizo qué y cuándo
POST /auditoria            anota una acción
GET  /respaldo             baja la base entera como archivo (solo admin)
```

A qué API le habla cada sitio está en una lista explícita de dominios dentro
de `index.html` (`_API_POR_DOMINIO`). Al arrancar, la app le pregunta a
`/salud` qué ambiente es: un sitio de pruebas hablando con producción se ve al
instante en vez de descubrirse tarde.

## Historia

Los datos vivieron en Firebase Realtime Database hasta la migración a MongoDB.
De aquello ya no queda nada en este repositorio: ni el SDK, ni la
configuración del proyecto, ni la función de Cloudflare que firmaba los
tokens (`functions/fb/token.js`), ni el log de auditoría, que era lo último
que seguía escribiéndose directo desde el navegador.
