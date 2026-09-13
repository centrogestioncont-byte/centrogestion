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
- **Después de fusionar se llama `_refotografiar()`, que NO borra las fotos:
  las vuelve a sacar.** Lo que cambió lo cambió el servidor, así que ese es
  el nuevo punto de partida. Borrarlas a secas fue un error que costó caro:
  `_marcarCambiados()` solo marca cuando hay foto previa, y esto corre con la
  respuesta de **cada** guardado, así que la app se quedaba sin punto de
  comparación y **el siguiente cambio del usuario no llevaba marca**. En
  producción, con eso puesto, no se marcaba prácticamente nada: dos cobros
  recién marcados volvieron a "pendiente" al día siguiente.

Cuando el dueño diga que algo "se revirtió solo" o "volvió a aparecer",
**empieza por aquí**: casi siempre es un dato que llegó sin marca.

Y cuando arregles algo de esto: **el arreglo no repara los registros ya
pisados.** Hay que volver a hacerlos a mano una vez. Díselo, no lo des por
entendido.

---

## El negocio de verdad — léelo antes de tocar saldos, lotes o ganancias

Esto lo explicó la dueña. Si vas a cambiar algo que toque cuentas, inventario
FIFO o el cálculo de ganancia, **esta sección manda sobre tu intuición**.

### Qué hace

Mueve remesas entre Brasil y Venezuela, en las dos direcciones.

```
Brasil → Venezuela:  entra dinero del cliente en REALES · ella entrega BOLÍVARES
Venezuela → Brasil:  entra dinero del cliente en BOLÍVARES · ella entrega REALES
```

Y también a **Colombia y Perú**, que funcionan distinto — ver más abajo.

### Cómo gana — y es lo único que cuenta

Con los reales que entran **compra USDT**. Esos USDT los **vende por bolívares**.

> **La ganancia es la diferencia entre lo que le costó el USDT y a cuánto lo
> vendió.** No hay otra fuente de ganancia.

Por eso todo esto es delicado: **el sistema no puede reportarle una ganancia que
nunca tuvo.** Un número inventado aquí es peor que no tener número.

### El inventario FIFO es SOLO compra y venta de USDT

No es un libro de todo el dinero que se mueve. Es la lista de sus operaciones de
USDT, y las tasas guardadas ahí son las que calculan la ganancia.

- Un lote **nace** solo cuando ella compra o vende USDT.
- Un lote **se gasta** cuando paga con ese dinero, descontando **de la cuenta que
  corresponde** (`cuentaDestinoId`), para que cada unidad gastada lleve la tasa a
  la que se consiguió.
- El saldo del lote dice **qué queda disponible** de esa compra o de esa venta.

**El dinero que entra por una remesa NO crea ni engorda un lote.** Hubo una
función (`aumentarLoteRecibido`) que lo intentaba: metía el dinero dentro de un
lote existente **sin tocar su tasa**, así que ese lote pasaba a afirmar que todo
lo suyo costó una tasa que solo valía para una parte — y de ahí salen las tasas
que la app sugiere. Se contaminaban solas.

### El orden de registro es parte del método, no un detalle

Ella registra **primero todas las compras y ventas de USDT del día**, y
**después** las remesas. Así cada remesa va consumiendo los lotes en orden:

```
lote de la mañana  →  lote de la tarde  →  lote de la noche
```

Si una remesa se registra antes que la operación de USDT que le corresponde,
consume del lote equivocado —o de ninguno— y la ganancia sale mal. **Registrar
una remesa sin lote disponible tiene que avisarle.**

### Pagos pendientes

Cuando el cliente todavía no ha pagado, ella lo marca como pendiente. En
cualquiera de las dos direcciones. La regla es una sola:

- El dinero que **ella sí entregó** se descuenta **de donde salió, en el
  momento**. Ya salió de su banco de verdad.
- El dinero **del cliente** no entra hasta que ella marque que llegó. Ahí se
  adjudica.

Ejemplo real (la remesa de 20.010): Brasil → Venezuela, pendiente. Los 115
reales del cliente **no entran** todavía; los 20.010 bolívares **sí salen** del
Banco de Venezuela en el acto.

### Bolívares que entran y se quedan quietos

A veces entra una remesa en bolívares y ella **no** compra USDT con ellos: los
deja en la cuenta. Después llega una remesa Brasil → Venezuela y paga con esos
mismos bolívares que ya tenía.

La regla que ella dio: **esos bolívares valen lo que costaron los reales que
entregó por ellos.** Se implementó así y **hubo que corregirlo**, porque con el
resto del sistema esa regla contaba la ganancia dos veces. Explicado, para que
nadie lo vuelva a poner como estaba:

En `cTx()` hay dos números por remesa:

```
uc = lo que VALE en USDT el dinero que entró
uv = lo que COSTÓ en USDT el dinero que se entregó
pr = uc − uv   ← la ganancia, y la app la apunta YA, en esa misma remesa
```

Si el lote nace valiendo `uv` —el costo—, nace valiendo exactamente `pr` menos
de lo que la app acaba de decir que vale. Ese `pr` no desaparece: reaparece como
ganancia el día que esos bolívares se gasten. Contado dos veces.

Medido con sus cifras (entran 138.000 Bs, entrega 836 BRL, y después esos mismos
bolívares pagan otra remesa):

```
lote a uv → apuntado 4,3626 USDT · real 0,7407 · se inventaba 3,62
lote a uc → apuntado 0,6166 USDT · real 0,7407 · la diferencia son las comisiones
```

Por eso **el lote nace valiendo `uc`**, no `uv`. Es la misma idea de fondo que
ella pidió —el dinero parado vale lo que valió la operación que lo trajo— con la
cuenta cuadrada. Lo cubre `pruebas/prestamos.js` con la prueba del ida y vuelta:
si alguien vuelve a poner `uv`, falla.

La otra forma de cuadrarlo sería dejar el lote a `uv` y **no** apuntar ganancia
en la remesa de entrada, esperando a que el dinero salga. Es una decisión suya,
no del código: cambia los números de ganancia que ve hoy en Diario, Resumen y
Cierre de Mes. Si alguna vez lo pide, es ahí donde hay que tocar (`gV()`), no
en el lote.

### Colombia: la entrega la hace un aliado y se le paga en USDT

Esto **ningún chat lo va a adivinar** mirando el código, así que léelo antes de
tocar una remesa que no sea a Venezuela.

```
1. El cliente en Brasil le da REALES        → entran a su cuenta
2. Con esos reales compra USDT              → compra normal, su lote y su tasa
3. Le manda USDT a un ALIADO                → lo que vale la remesa MENOS su ganancia
4. El aliado le paga al cliente en PESOS    → ella no toca pesos nunca
```

Su ganancia sigue siendo la de siempre: lo que valen los USDT que consiguió
menos los que entregó.

**Lo que sale de su cuenta son USDT, no pesos.** La app modelaba la entrega como
"sale la moneda de destino de una cuenta tuya en esa moneda", y de pesos no
tiene ninguna: el formulario ni ofrecía cuenta de entrega, la remesa se guardaba
**sin descontar nada** y el saldo de Binance decía tener los USDT que ya había
mandado. Dos remesas así dejaron 115 USDT de más.

Está resuelto en `salidaDeCuentaEntrega()`, y **la regla mira la cuenta, no la
ruta**: si la cuenta de entrega está en USDT, sale `uv`; si no, la moneda de
destino. Así vale para cualquier aliado futuro sin tocar nada de Venezuela ni
de Brasil.

De qué cuenta de USDT sale **depende de dónde haya**, así que se elige cada vez.

### Lo que cobra el banco venezolano

Tarifario del BCV. Está en `comisionBancoVES()`, en un solo sitio, y los tres
valores se editan en Configuración:

```
pago móvil a otro banco ... 0,3% del monto, MÍNIMO Bs 14
transferencia a otro banco  Bs 54 fijos, sin porcentaje
dentro del mismo banco .... nada
```

Usa las dos formas, **según la cuenta del cliente**, por eso se elige al
registrar la remesa y no es una casilla de sí/no.

**El mínimo de 14 es el que se cuela.** El 0,3% no llega a 14 Bs hasta los
4.667, así que toda remesa por debajo se queda corta si no se aplica.

Y ojo: **la comisión baja la cuenta pero no el lote.** Es correcto — el lote
lleva los bolívares que se le entregaron al cliente, y la comisión es un cobro
aparte del banco. Por eso la cuenta va siempre un poco por debajo del FIFO,
justo lo que se llevó el banco. No lo "arregles".

### La fecha de un lote va SIEMPRE en mm/dd

`ordenFIFO` la lee como `mes×100 + día`. Hubo hasta tres formatos conviviendo
—`09/12`, `12/09/26` e `2026-09-12`— y con eso la app creía que una venta de
USDT de la tarde era más vieja que unos bolívares que habían entrado por la
mañana, y se la comía primero. De los lotes salen las tasas que sugiere, así
que el desorden no es cosmético.

Está resuelto en `_fechaLote()`, que se aplica dentro de `crearLoteRecibido` y
en `saveIU`, y **`ordenFIFO` normaliza él mismo** para no depender de que
alguien lo haya hecho antes. `pruebas/prestamos.js` recorre el archivo entero y
exige que **cada** `inventarioUsdt.push(` saque su fecha de ahí: si añades un
sitio nuevo, falla.

Pendiente, y se rompe en enero: `mm/dd` no lleva año, así que un lote del 01/01
se ordenará antes que uno del 31/12 anterior.

### Al borrar una remesa, las monedas salen de la remesa

No del array donde está guardada. Se deducían así:

```js
monDest = tipo==="vzla" ? "BRL" : "VES"   // todo lo de Brasil entrega bolívares
```

Con una remesa a Colombia eso es falso, y borrarla le devolvía al lote de
bolívares los **pesos** que nunca salieron de ahí: medido, un lote pasaba de
51.043,97 a 173.943,97. Cada remesa guarda su `orig` y su `dest`; se leen de
ahí (`monedasDeRemesa()`).

### Registra la operación — no escribas el saldo

**La regla que más costó el 12/09**, y se rompió tres veces en un día.

Cuando un saldo no cuadra, la tentación es escribirlo a mano. Eso cuadra la
pantalla y le borra a la app la historia: el dinero desaparece sin decir adónde
fue, la conciliación de capital salta, y el lote FIFO se queda como estaba.

- ¿Salió dinero por una operación? **Regístrala**, y deja que el saldo baje solo.
- ¿Te cobró el banco algo que la app no contempla? **Un egreso**, con su cuenta.
  Baja la cuenta, baja el lote y baja también "deberías tener", así que la
  conciliación no salta.
- **El saldo a mano es solo** para cuando el banco y la app discrepan y ya sabes
  por qué.

Y cuando un saldo se escriba a mano, que se vea: `updateCuentaSaldo()` enseña
el número que entendió, el saldo de ahora y el cambio, y avisa fuerte si el
salto es de diez veces o más. Eso existe porque un tecleo dejó el Banco de
Venezuela en 198,89 cuando debía quedar en 198.619,90 — el `parseFloat` partía
el número en el primer punto. De 106 ajustes manuales guardados, **27 dejaron
una cuenta en 0**.

### Cómo se mueve su dinero — el sesgo del negocio

- **Vende más USDT por bolívares de lo que compra USDT con reales.**
- Tener reales parados en la cuenta **no le perjudica**.
- Tener muchos bolívares parados **sí le perjudica**, por la devaluación.
- Compra USDT con reales sobre todo en dos casos: cuando ya tiene mucho en la
  cuenta y necesita USDT para vender por bolívares, o cuando la remesa es tan
  grande que necesita USDT para cubrirla.

Esto explica por qué un saldo en bolívares que se queda alto es una señal de
alarma para ella, y un saldo alto en reales no lo es.

### Una advertencia, pagada con errores

En una sola sesión se dieron **tres diagnósticos equivocados** sobre estos
saldos, por deducir las reglas del negocio en vez de preguntarlas. Cada uno
costó tiempo y confianza.

**No supongas cómo funciona su operación. Pregúntale.** Y antes de afirmar una
causa, reprodúcela: la app se puede cargar en Chromium y se le puede pasar el
caso exacto con sus cifras. Si el número que sale no es el suyo al céntimo, la
explicación todavía no es la correcta.

Y si te pasa un export, **úsalo**: `ajustesSaldo` guarda cada corrección manual
con el saldo de antes y el de después, y el `_mov` de cada remesa guarda el
movimiento exacto que hizo sobre cada cuenta. Con eso se reconstruye un día
entero en vez de teorizar. (Limitación conocida: `ajustesSaldo` guarda la fecha
pero **no la hora**, así que no se puede saber qué remesas entraron antes de
una corrección y cuáles después.)
