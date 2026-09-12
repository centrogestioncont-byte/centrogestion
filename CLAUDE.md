# Centro de Gestión

Sistema de gestión y control de operaciones: remesas (Brasil, Venezuela,
EE.UU.), préstamos, cuentas por cobrar, egresos y cierre de mes.

Aplicación web de una sola página. **Todo el código vive en `index.html`**
(~17.000 líneas de JavaScript en línea). No hay framework, ni gestor de
paquetes, ni paso de compilación: se edita el archivo y eso es lo que se
despliega. Las librerías (html2canvas, SheetJS, Tesseract, html2pdf) se
cargan por CDN. Los datos viven en una API aparte
(`centrogestioncont-byte/centrogestion-api`, MongoDB).

## Habla español

Siempre. Comentarios de código, mensajes de commit, descripciones de PR y
conversación: todo en español.

---

## Flujo de trabajo — respétalo

Este flujo lo acordó el dueño del proyecto. No te lo saltes ni siquiera
para un cambio de una línea.

1. Él pide algo (análisis, verificación, cambio).
2. **Tú das tu recomendación y un plan**, según tu criterio. No ejecutes
   todavía.
3. Él aprueba o corrige el plan.
4. Programas **y pruebas**. Si algo falla, lo arreglas y vuelves a probar.
   No entregues trabajo a medias.
5. Le entregas un **informe de pruebas** (qué probaste, qué pasó, errores
   encontrados o ninguno) **y capturas de pantalla** de lo que cambiaste.
6. Le avisas que está listo y **pides permiso para abrir el PR**.
7. Él da el OK.
8. Abres el PR, verificas que GitHub esté verde y **mergeas a `test`**.
9. Él prueba en `test` con sus datos reales.
10. **Él** mergea `test` → `main`.

**El merge a `main` es suyo, no tuyo.** Main es producción y toca dinero de
clientes reales. Avísale cuando esté listo; el clic lo da él.

---

## Cómo probar — obligatorio antes de cualquier PR

```
python3 pruebas/revisar.py      # archivo entero, sintaxis de cada <script>, 19 funciones clave
node pruebas/prestamos.js       # lógica de préstamos: fechas, mora, tasa sugerida, límite
```

Las dos tienen que terminar en "Todo en orden." y salir con código 0. Las
corre también el workflow de GitHub en cada PR contra `test` y `main`.

`pruebas/prestamos.js` saca las funciones directamente de `index.html` y
las ejecuta sueltas, así que prueba el código que de verdad se despliega.
**Cuando toques lógica de préstamos, agrega ahí las comprobaciones nuevas.**

### Ver la pantalla de verdad

Hay Chromium con Playwright en `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.
Para una captura: abre `file:///.../index.html`, y en la página pon
`_hayConexionReal = true`, `S.role = "admin"`, `window.tienePermiso = () => true`,
rellena `S.cuentas` / `S.prestamos` / `S.nPr` con datos de mentira, y llama `R()`.

**Límite conocido:** la política de red del entorno bloquea la API, así que
nunca vas a ver los datos reales del dueño. Tus capturas son de la interfaz
con datos que te inventas. Sirven para mostrar cómo queda, no para validar
su contabilidad — eso solo lo comprueba él en `test`.

---

## Ambientes: son dos bases de datos distintas

```
centrogestion.pages.dev       →  API de producción  (datos reales)
centrogestion-test.pages.dev  →  API de pruebas     (otra base)
```

Cualquier preview de rama cae en la API de **pruebas**, a propósito: una
rama nueva no puede tocar la base real. Un dominio fuera de esa lista no
habla con ninguna API y la app queda cerrada.

Si él dice que en pruebas "faltan préstamos", **no es un error**: es otra
base con otros datos.

---

## Convenciones del repositorio

- **Los PR van contra `test`**, no contra `main`. Después él mergea
  `test` → `main`.
- Rama nueva por trabajo. Nunca commits directos a `main` ni a `test`.
- Un commit por cambio con sentido propio, para poder revertir solo una
  parte. El mensaje explica **por qué**, no solo qué.
- Los comentarios del código de este proyecto cuentan la historia de los
  arreglos ("antes pasaba X, por eso ahora Y"). Sigue ese estilo: es lo que
  evita que alguien reintroduzca un error ya resuelto.
- No metas el identificador del modelo en commits, PR ni comentarios.

---

## Reglas del negocio que no son obvias

- **La mora vive en `p.mora`, nunca en `p.abonos`.** Hay ~25 lugares que
  suman `p.abonos` para calcular el saldo pendiente; meter la mora ahí los
  descuadra todos. La mora es un cargo aparte que no baja el saldo.
- **Las fechas de cuota usan `_sumarMeses()`, nunca `setMonth()` a secas.**
  `setMonth()` convierte el 31/01 + 1 mes en 03/03, no en 28/02.
- **El cronograma se genera con `cronogramaCuotas()`**, la misma función
  para guardar, para el comparador y para el WhatsApp. Si cada sitio
  calcula sus fechas por su cuenta, terminan divergiendo (ya pasó).
- La ganancia por préstamos va **como línea aparte** en Diario / Resumen /
  Cierre de Mes. La "Ganancia" del encabezado suma solo remesas.
- Los montos se guardan en la moneda pactada del préstamo; para sumar entre
  monedas se convierte a USDT con `getRateToUsdt()` (divide, no multiplica).

---

## Sincronización entre dispositivos — la regla que más ha costado

El dueño usa la app desde la PC y desde el teléfono. Los dos guardan contra
el mismo `PUT /estado`, así que **todo lo que se escribe se tiene que
fusionar**, y la fusión tiene que saber quién tocó qué y cuándo.

El mismo error se arregló y volvió **cuatro veces**: saldos que se
revertían, un cobro que volvía a "pendiente", un pago al contador que
seguía apareciendo "por pagar". Siempre la misma causa y siempre un módulo
distinto, porque se venía parchando **función por función** — y son más de
cien funciones que escriben datos.

**No vuelvas a marcar a mano dentro de una función.** Está resuelto en un
solo sitio, dentro de `saveData()`:

```js
_marcarTodoLoQueSeFusiona();   // listas  → _MERGE_FIELDS
_marcarObjetosCambiados();     // objetos → _MERGE_OBJETOS
```

Comparan cada registro contra la foto del guardado anterior y marcan solo
lo que cambió de verdad. Una función nueva queda cubierta sola.

Lo que sí tienes que respetar:

- **Un campo nuevo que se sincronice va en la lista que le toca** —
  `_MERGE_FIELDS` si es una lista, `_MERGE_OBJETOS` si es un objeto por
  clave, `_MERGE_HISTORIAL` si está indexado por fecha — **y también en
  `DATA_KEYS`**. Si no está en ninguna, el remoto lo reemplaza entero y se
  pierde lo que hiciste aquí. `pruebas/prestamos.js` recorre `_MERGE_FIELDS`
  entero: si agregas uno y no queda cubierto, la prueba falla.
- **No todos usan `id`.** `clientes` usa `cod`, `brl`/`vzla`/`eeuu` usan
  `_uid`, `cierresMes` usa `mesKey`. Está en `_MERGE_ID_FIELD`.
- **Sin foto previa se anota, no se marca.** Marcar en el primer guardado
  tras abrir la app hace que un dispositivo con datos viejos gane la fusión
  solo por haber guardado una vez (ARREGLO 33 — pasó tres veces el 04/09).
- **`_mod` queda fuera de la foto.** Si entrara, marcar cambiaría la foto,
  la foto distinta volvería a marcar, y no pararía nunca.
- **Los historiales se unen, nunca se reemplazan.** `histBalance`,
  `histTasas` y `histSaldos` están indexados por fecha: reemplazar borra los
  días que este aparato no tiene y el otro sí.
- **Después de fusionar se llama `_olvidarFotos()`.** Lo que cambió lo
  cambió el servidor, no este dispositivo; marcarlo como propio sería
  mentir.

Cuando el dueño diga que algo "se revirtió solo" o "volvió a aparecer",
**empieza por aquí**: casi siempre es un dato que llegó sin marca.

Y cuando arregles algo de esto: **el arreglo no repara los registros ya
pisados.** Hay que volver a hacerlos a mano una vez. Díselo, no lo des por
entendido.
