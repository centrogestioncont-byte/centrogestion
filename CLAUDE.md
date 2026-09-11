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
