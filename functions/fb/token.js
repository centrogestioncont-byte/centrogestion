// ─────────────────────────────────────────────────────────────────────────────
// Cloudflare Pages Function — GET /fb/token
//
// Entrega al navegador un "custom token" de Firebase de vida corta, para que
// la app pueda entrar a Realtime Database SIN llevar ninguna credencial de
// Firebase dentro de index.html.
//
// Por que existe:
//   index.html se sirve publico. Cualquier credencial escrita ahi la lee
//   cualquiera que abra el codigo fuente, y con la de Firebase se puede leer
//   y escribir toda la base. Aca la credencial vive en las variables de
//   entorno de Cloudflare y nunca baja al navegador.
//
// El candado: esta ruta NO entrega nada a cualquiera. Antes de firmar,
// le pregunta a la API si el testigo de sesion que trae el pedido sigue
// siendo valido. Sin sesion no hay token. Sin ese candado esto seria
// regalar acceso a la base a quien abra la URL.
//
// Variables de entorno de Cloudflare Pages (marcar como secreto las dos ultimas):
//   API_URL       base de la API en Railway, ej. https://....up.railway.app
//   FB_PROJECT    id del proyecto de Firebase, ej. adminbrl
//   FB_SA_EMAIL   client_email de la cuenta de servicio
//   FB_SA_KEY     private_key de la cuenta de servicio (PEM completo)
//   FB_UID        uid con el que se firma; tiene que ser el mismo que nombran
//                 las Rules de Realtime Database
// ─────────────────────────────────────────────────────────────────────────────

const VIDA_TOKEN = 3600; // segundos. Es el maximo que acepta Firebase.

function json(cuerpo, estado) {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function b64url(bytes) {
  let s = "";
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlTexto(txt) {
  return b64url(new TextEncoder().encode(txt));
}

// Convierte el PEM de la cuenta de servicio en una clave utilizable.
// Las variables de entorno suelen traer los saltos de linea como "\n"
// literales, asi que se normalizan antes.
async function importarClave(pem) {
  const limpio = String(pem)
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const crudo = Uint8Array.from(atob(limpio), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    crudo.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function firmarCustomToken(env, uid) {
  const ahora = Math.floor(Date.now() / 1000);
  const aud =
    "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit";
  const cabecera = { alg: "RS256", typ: "JWT" };
  const cuerpo = {
    iss: env.FB_SA_EMAIL,
    sub: env.FB_SA_EMAIL,
    aud: aud,
    iat: ahora,
    exp: ahora + VIDA_TOKEN,
    uid: uid,
  };
  const sinFirma = b64urlTexto(JSON.stringify(cabecera)) + "." + b64urlTexto(JSON.stringify(cuerpo));
  const clave = await importarClave(env.FB_SA_KEY);
  const firma = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    clave,
    new TextEncoder().encode(sinFirma)
  );
  return sinFirma + "." + b64url(firma);
}

// Devuelve true solo si la API reconoce el testigo como sesion viva.
async function sesionValida(env, testigo) {
  const base = String(env.API_URL || "").replace(/\/+$/, "");
  if (!base) return false;
  try {
    const r = await fetch(base + "/auth/yo", {
      headers: { Authorization: "Bearer " + testigo },
    });
    if (!r.ok) return false;
    const d = await r.json();
    return !!(d && d.ok);
  } catch (e) {
    return false;
  }
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  }
  if (request.method !== "GET") {
    return json({ ok: false, error: "metodo no permitido" }, 405);
  }

  for (const v of ["API_URL", "FB_SA_EMAIL", "FB_SA_KEY", "FB_UID"]) {
    if (!env[v]) return json({ ok: false, error: "falta la variable " + v }, 500);
  }

  const cab = request.headers.get("Authorization") || "";
  const testigo = cab.startsWith("Bearer ") ? cab.slice(7).trim() : "";
  if (!testigo) return json({ ok: false, error: "falta la sesion" }, 401);

  if (!(await sesionValida(env, testigo))) {
    return json({ ok: false, error: "sesion vencida" }, 401);
  }

  try {
    const token = await firmarCustomToken(env, env.FB_UID);
    return json({ ok: true, token: token, vence: VIDA_TOKEN }, 200);
  } catch (e) {
    return json({ ok: false, error: "no se pudo firmar el token" }, 500);
  }
}
