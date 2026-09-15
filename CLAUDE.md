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
- **La tasa con la que se valora el dinero parado sale sola.** `getRateToUsdt()`
  pasa por `tasaDeReferencia()`, que toma la **última** operación de USDT de esa
  misma moneda. No la escribas en el código ni la des por manual.

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

**Y hay claves que tienen que viajar JUNTAS** (`_MERGE_BLOQUES`, ARREGLO 60).
La apertura no es un dato, son cinco: `aperturaUsdt`, `aperturaFecha`,
`aperturaSaldos`, `aperturaTs` y `aperturaBase`. `_mergeObjetoPorClave` decide
clave por clave, cada una con su marca, así que con dos aparatos se quedaba **la
fecha de uno y el monto del otro**. Reproducido con sus dos pantallas del 14/09:

```
teléfono  11/09 · $2.544,79
PC        12/09 · $2.450,20
fusión    12/09 · $2.544,79   ← una apertura que no existió en ninguno
```

Y de ahí salían dos conciliaciones distintas: con la apertura del 11 los ajustes
de ese día cuentan (−85,55, diferencia −76,38); con la del 12 quedan antes de la
apertura y la pantalla dice "ninguno" (+11,85). **Si un grupo de claves solo
tiene sentido junto, va en `_MERGE_BLOQUES`**: entra entero o no entra.

### Adoptar la respuesta del servidor está bien; adoptarla en silencio, no

El servidor fusiona bajo candado y el aparato **adopta** lo que contesta. Eso es
lo correcto —es lo que evita que el último que guarda borre al otro— pero se
hacía sin decir nada: si el teléfono tenía la apertura del 11 y la PC la del 12,
uno perdía y la pantalla cambiaba sola. Sus palabras: *"que uno diga algo y el
otro equipo otro"*.

**No se avisa de todo lo que cambia el servidor.** Casi todo lo que vuelve
distinto es lo que el otro aparato registró mientras tanto: eso es
sincronización normal y avisarlo sería ruido en cada guardado. Se avisa **solo
del choque**: un registro que ESTE aparato acaba de cambiar y que el servidor
devuelve distinto de como se mandó.

- **De dónde sale "lo que este aparato acaba de cambiar":** del mismo sitio que
  ya lo calcula para marcarlo, `_marcarCambiados()` y
  `_marcarObjetosCambiados()`. `_anotarTocado()` se llama ahí y en ningún otro
  lado — anotarlo función por función es el mismo camino que ya falló cuatro
  veces. Una función nueva queda cubierta sola.
- **Lo anotado se lleva al mandar y vuelve si el envío no llega**
  (`_tomarTocado()` / `_unirTocado()`). Lo que ella registre mientras el
  guardado viaja no se confunde con lo que iba dentro.
- **El aviso son TRES valores, no dos:** lo que mandó este aparato, lo que traía
  el otro y **lo que quedó**. No son lo mismo: el servidor fusiona a su manera y
  después `_aplicarEstadoDeApi()` vuelve a fusionar aquí con las marcas de este
  dispositivo, así que lo que queda puede no ser ninguna de las dos cosas que se
  compararon. Medido: el servidor devolvía 915, quedaba 801, y el aviso decía
  "quedó 915". Por eso `_completarConLoQueQuedo()` se llama **después** de
  adoptar y lee de `S`, que es lo que ella ve. Un aviso que miente se deja de
  mirar.
- **Los clientes se excluyen.** Tienen su propia ruta (`/clientes`) y
  `_aplicarEstadoDeApi` ignora a propósito la copia que venga en el bloque de
  estado. Avisar de ella sería avisar de algo que ni se va a aplicar.
- El aviso va **arriba del panel, fuera de la zona que hace scroll**, y queda
  hasta que ella lo cierra. El historial de choques vive en Configuración
  (`_htmlHistorialPisados()`), para cuando diga "esto lo cambié yo y volvió
  atrás".

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

### La tasa de referencia sale sola — no la escribas a mano

Antes mandaba lo que ella escribía en el panel 💱, y mandaba para siempre:

```js
// como estaba
if(S.tasasDia && S.tasasDia[moneda]) return parseFloat(S.tasasDia[moneda]);
```

Sus palabras: *"casi nunca me da tiempo de editarla todos los días"*. Así que el
5,22 y el 940 que escribió una vez seguían valorando todo su dinero mientras
compraba USDT a 5,11 y vendía a 960. Ese hueco es lo que la conciliación enseña
como "desfase de las tasas del día".

`tasaDeReferencia(moneda)` decide, en este orden:

1. La que ella **fijó a mano** (`_tasasDiaMeta[mon].fijada`). Es una decisión
   suya, no un olvido: manda.
2. La **última operación de USDT de esa misma moneda** — compra o venta,
   mirando también `inventarioUsdt_cerrado`, con `_tasaEfectivaLote()`.
3. Lo último que escribió, aunque no lo fijara.
4. Nada.

Tres cosas que costó medir y que no hay que deshacer:

- **La más nueva, no la del frente del FIFO.** `getLastTasaCompra()` devuelve el
  lote más viejo que aún tiene saldo: eso es el **costo** de lo que se gasta, no
  el **valor** de lo que hay. Con sus datos daba BRL 5,163 cuando su compra más
  reciente fue a 5,1126.
- **Los lotes cerrados cuentan.** Si no, una moneda pierde su tasa en cuanto se
  consume todo lo que tenía.
- **Va en una pasada, sin `concat` ni `sort`.** Esto lo llama `getRateToUsdt()`,
  y `getRateToUsdt()` lo llama todo: con una apertura de tres meses la
  conciliación pide la tasa unas dos mil veces. Ordenar 288 lotes en cada una
  costaba 280 ms de dibujo.

**Y la tasa nunca se presta entre monedas.** `getLastTasaVenta()` tenía un
rescate —"si no hay lotes en esa moneda, mira todas las ventas"— escrito cuando
el único destino era Venezuela. Con Colombia y Perú devolvía 960,2328 para el
sol y para el peso: la tasa del bolívar. Sin lotes en esa moneda, `null`. Mejor
sin tasa —que se ve y avisa— que con una que cuadra la pantalla y miente.

### La conciliación tiene que poder explicarse sola

`conciliacionCapital()` compara lo que deberías tener contra lo que tienes. Un
número suelto no se puede perseguir, así que la diferencia viene desglosada, y
**lo que quede sin explicar es lo único que hay que buscar**.

- **Volver a fijar la apertura no arregla nada: la esconde.** Pone la diferencia
  en cero y borra la pista. Ella lo dijo: *"no tiene chiste que lo tenga que
  hacer todos los días, pierde la lógica de para qué está eso ahí"*. Para
  corregir el número está `corregirApertura()`, que deja la fecha donde está.
- **Al fijar la apertura se guarda la foto de los saldos y la hora**
  (`aperturaSaldos`, `aperturaTs`), no solo el total. Sin la foto, cuando la
  diferencia no cuadra no hay con qué comparar.
- **Un traspaso a una cuenta 💜 personal es una salida.** No es egreso ni pago a
  socio, así que `deberías tener` no se enteraba: solo bajaba `lo que tienes` y
  la diferencia lo cantaba como fuga. `traspasosAPersonal()` baja los dos lados.
- **El desfase de las tasas es aritmética, no dinero.** `efectoTasasDesde()` lo
  mide y sale como línea propia: comparar lo que de verdad se movió en las
  cuentas contra el `pr` apuntado nunca da cero, porque los saldos se valoran a
  una tasa y las operaciones se hicieron a otra. Dentro de "sin explicar" era
  ruido que tapaba lo de verdad.
- **Los avisos no se pliegan.** La explicación va detrás de un desplegable
  porque se lee una vez y estorba las otras cien, pero los avisos —moneda sin
  tasa, apertura vieja— y el veredicto se ven siempre. Un aviso escondido no es
  un aviso.
- **El número grande es lo SIN EXPLICAR, no la diferencia bruta** (ARREGLO 60).
  El titular decía −$76,38 mientras el veredicto debajo decía "cuadra": dos
  mensajes opuestos en la misma tarjeta, y el que asusta es el grande. La
  diferencia bruta incluye lo que ya tiene explicación —los ajustes a mano,
  sobre todo—; lo que hay que perseguir es el resto.
- **Los ajustes que no se pueden situar se ven sin desplegar nada.** Los del
  mismo día en que se fijó la apertura no llevan hora, así que ni cuentan ni se
  descartan: con sus datos son 7 por −$233,46. Estaban dentro del desplegable.
- **La tarjeta dice contra qué apertura mide** —fecha, monto y si tiene foto de
  saldos—. Una apertura sin foto no permite comparar cuenta por cuenta cuando
  algo no cuadra, y eso no se veía en ninguna parte.

### Evolución mide la tendencia, no el capital

Tenía un "Resumen total" que restaba la ganancia sumada de los meses menos lo
que hay en las cuentas de USDT y llamaba **Diferencia** al resultado. Esos dos
números no tienen por qué parecerse:

- la suma de los meses es **ganancia**, no capital — no lleva con lo que
  empezó, ni lo que metió, ni lo que sacó;
- "lo que está en USDT" eran **802,78 de sus 2.479,17**, porque deja fuera sus
  reales, sus bolívares, lo que le deben y 1.010,93 prestados.

La app lo sabía y tenía que disculparse debajo con *"puede ser dinero en BRL,
VES o retiros no registrados"*. Un número que necesita una disculpa no sirve
para perseguir nada, y esa pregunta —cuánto debería tener— **ya la responde la
conciliación**, que sí cuenta todo el capital.

Aquí queda lo que ninguna otra pantalla hace: **cómo va el negocio mes a mes**.
Variación contra el mes anterior, barra de tendencia, cuánto deja cada
operación y qué porcentaje de la bruta se llevan los egresos. Eso es lo que
enseña que en agosto los egresos se comieron el 76 % y que lo que deja cada
operación cayó de 4,34 a 2,33.

**El acumulado cuenta TODOS los meses que la pantalla lista.** Un cierre sin
`ganBrutaTotal` ni `utilidadEmpresa` es del formato viejo, de antes de que la
app calculara bien, y sale marcado —ella avisó de que *"muchos datos de meses
anteriores no están del todo correctos"*— **pero suma igual**. Dejarlo fuera se
probó y ella lo cazó enseguida: el total dejaba de cuadrar con lo que se ve en
pantalla, y un total que no se puede sumar a mano es peor que uno aproximado.
La marca está para saber cuál mirar con lupa, no para descontarlo.

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

**El año va aparte, en `fechaIso`** (ARREGLO 51). Sin él, `ordenFIFO` leía
`mes×100 + día` y en enero ponía lo de diciembre por delante de lo de enero —y
desde el arreglo 49 eso también decidía la tasa con la que se valora todo.

Los lotes nuevos lo guardan. Los ~290 que ya existen no, y **no se les
reescribe**: `_isoDeLote()` lo deduce, y la deducción tiene dos trampas que hay
que respetar. Un lote puede llevar fecha **adelantada a propósito**
(`confirmarFechaFutura` lo permite, y pasó el 12/09 con un 18/09), así que "en
el futuro" no significa "del año pasado": se admiten 30 días por delante. Y en
el cambio de año pasa lo contrario — el 29 de diciembre, un `01/05` está a once
meses hacia atrás si se lee de este año y a una semana hacia delante si se lee
del siguiente; es del siguiente.

Comprobado con sus 288 lotes reales: el orden FIFO, las tasas sugeridas y el
consumo salen **idénticos** a antes. El arreglo solo se nota en el cambio de
año, que es para lo que está.

### Al borrar una remesa, las monedas salen de la remesa

No del array donde está guardada. Se deducían así:

```js
monDest = tipo==="vzla" ? "BRL" : "VES"   // todo lo de Brasil entrega bolívares
```

Con una remesa a Colombia eso es falso, y borrarla le devolvía al lote de
bolívares los **pesos** que nunca salieron de ahí: medido, un lote pasaba de
51.043,97 a 173.943,97. Cada remesa guarda su `orig` y su `dest`; se leen de
ahí (`monedasDeRemesa()`).

### El campo se come la coma decimal

`type="number"` descarta en silencio lo que el navegador no considera un
número, y con el teclado en español **la coma decimal es justo eso**. Por ahí
se perdió el `0,003` de la comisión del banco: el campo se quedaba con `0003`.

Un campo de dinero va `type="text" inputmode="decimal"`, y lo que guarda pasa
por **`_num()`**. Las dos mitades son obligatorias: pasar el campo a texto sin
normalizar es *peor* que dejarlo como estaba, porque los cien `parseFloat` que
hay detrás leerían `"5,22"` como **5**. `_num()` normaliza en la puerta —deja
`"5.22"` en `S.*`— para que todo lo de abajo siga funcionando sin tocarlo, y si
todavía está a medio teclear devuelve el texto tal cual.

`pruebas/prestamos.js` recorre las pantallas donde ella teclea dinero y exige
que no quede ningún `type="number"` y que cada campo pase por `_num()`.

**Quedan 68 sin convertir**, y no por olvido: son los que **otro sitio lee por
`getElementById(...).value`**. Convertir el campo sin arreglar también su
lector cambiaría "no acepta la coma" por "acepta la coma y se queda con 5 en
vez de 5,22" — de un fallo que se ve a uno que no. Están en Configuración, la
edición en línea de una remesa ya guardada, la calculadora y el conversor BCV.
Cuando se toquen, hay que cambiar el lector a `_leerNumero()` en la misma pasada.

### La tasa de un abono se escribe como ella la dice: 1 USDT = 5,30 BRL

Cuando un cliente paga un préstamo —o una cuenta por cobrar— en una moneda
distinta a la de la deuda, hay un campo para la tasa. Pedía lo contrario de lo
que ella escribe:

```
      pedía ......  1 BRL = ? USDT   →  0,1956
ella escribe ...... 1 USDT = ? BRL   →  5,30
```

Y la app le hacía caso al pie de la letra. Para cobrar los 87,80 USDT
pendientes de un préstamo le decía que el cliente tenía que darle
87,80 / 5,30 = **16,566 reales**, en vez de 87,80 × 5,30 = **465,34**.

**Lo peligroso no era el número absurdo, era el que sí cuadraba.** Al
confirmar, el préstamo quedaba bien —16,566 × 5,30 = 87,80 USDT— así que nada
chirriaba; pero a la cuenta en reales le entraban **R$ 16,57** de los
**R$ 465,34** que el cliente entregó de verdad. El error va al cuadrado de la
tasa: con 5,30 son 28 veces.

Desde el ARREGLO 55 la tasa es **siempre** "cuántas unidades de la moneda del
**pago** vale 1 unidad de la moneda de la **deuda**", y para convertir se
**divide** (`_deudaCubierta()`). Es la misma dirección que ya pedía la pantalla
de egresos ("Tasa (BRL por 1 USDT)"), que era la única que hablaba su idioma.

Tres cosas que sostienen el arreglo y no hay que quitar:

- **La cuenta escrita con palabras, siempre visible** (`_htmlTasaEnPalabras()`):
  *"87,80 USDT × 5,30 = 465,34 BRL — eso es lo que te tiene que dar"*. Un
  número suelto no dice en qué dirección está escrito; la multiplicación
  entera sí.
- **El aviso de tasa al revés** (`_htmlTasaInvertida()`), con la misma idea que
  el aviso de salto de 10× al escribir un saldo a mano: si lo tecleado está
  mucho más cerca de 1/automática que de la automática, se le pregunta si
  quería decir la otra. Se calla cuando la automática anda cerca de 1, porque
  ahí las dos direcciones se parecen y el aviso sería ruido. Esto es lo que
  salva el caso incómodo: una deuda en reales pagada en USDT sí lleva 0,1956,
  y si escribe 5,30 el aviso le da el número bueno.
- **El recuadro verde se refresca en vivo.** La calculadora al revés no puede
  llamar a `R()` (ARREGLO 32: redibuja y destruye el input mientras teclea),
  así que actualizaba solo el monto y dejaba el recuadro con la cuenta
  anterior: su pantalla enseñaba 16.566 arriba y 2.635,43 abajo, dos números
  que no cuadraban entre sí y que no había forma de entender. Ahora
  `_refrescarAbonoPrest()` / `_refrescarAbonoCobrar()` rehacen las cuatro
  cajitas (`pp-calc`, `pp-eq`, `pp-dir`, `pp-inv`) desde el mismo sitio que
  las dibuja.

**Lo que se le pide va redondeado hacia arriba** (ARREGLO 56). Sus palabras:
*"muy poco la gente paga con decimales"*. Pedirle 497,246 reales no tiene
sentido —nadie entrega esos centavos— y bajarlo la deja corta, así que
`_montoACobrar()` sube a la unidad entera. **USDT es la excepción**: no es
efectivo, se transfiere exacto, y subir a la unidad entera serían más de cinco
reales de un salto; ahí se redondea al céntimo.

Tres límites de ese redondeo, y ninguno es cosmético:

- **Toca lo que se le PIDE, nunca lo que se apunta.** El monto que entra a la
  cuenta es el que de verdad llegó al banco. `_deudaCubierta()` sigue
  convirtiendo exacto.
- **Nunca se le pide más de lo que debe.** Si la cuota elegida se pasa del
  saldo que queda —pasa cuando ya abonó de más antes— se cobra el saldo. Si se
  le pidiera la cuota entera, al registrarlo el abono se recorta contra el
  saldo pendiente **y `montoIngresado` se recorta con él**, así que la cuenta
  se quedaría por debajo de lo que de verdad entró al banco.
- **El último pago es el único que puede llevar céntimos.** Redondear hacia
  arriba ahí le pediría más de lo que debe y no hay dónde acreditarle el
  sobrante, así que se le pide el exacto.

Y el texto cuenta lo mismo que la cuenta: cuando se recorta al saldo lo dice
(*"de la cuota de 93,82 ya solo debe 87,80"*), no lo disfraza de redondeo. Un
número recortado presentado como un redondeo se lee como un error de la app.

Decisión suya: **la diferencia del redondeo se le acredita al cliente**. Lo que
pague baja su deuda entero y el sobrante va a la cuota siguiente, como siempre.
El redondeo quita centavos, no le cobra de más.

`pruebas/prestamos.js` fija la dirección con guardias estructurales: el rótulo
tiene que preguntar por la moneda del pago, y ningún sitio puede volver a
multiplicar `montoIngresado * tasaManual`.

Comprobado contra su export: **ningún abono anterior se cobró en otra moneda**,
ni de préstamos ni de cuentas por cobrar. Este habría sido el primero, así que
no hay nada guardado que rehacer.

### El cierre de mes tiene que contar el mismo dinero en todas partes

El módulo son ~1.700 líneas repartidas en la pantalla (`rInformeCierre`, con
8 sub-pestañas), el PDF (`generarInformePDF`) y los cálculos
(`calcMesCompleto`). Auditado el 14/09/2026 con su export; esto es lo que
salió y no hay que deshacer.

**El PDF inventaba un agujero de −546,29 USDT.** Comparaba "cierre del mes
anterior + neto de este mes" contra **solo lo que hay en cuentas bancarias**,
y se disculpaba debajo: *"puede deberse a tasas del momento o cobros
pendientes"*. El hueco no existe: deja fuera la reserva (176,82), lo que le
deben (66,70) y lo prestado (1.010,93) — 1.254,45 que son suyos y no están en
un banco. Es el mismo error que ya se quitó de Evolución, y aquí además salía
en el informe que se manda fuera. Ahora va **de qué se compone el capital** y
se manda a la conciliación, que es la que responde "¿me falta dinero?".
**No vuelvas a poner un "deberías tener" aquí**: dos respuestas distintas a la
misma pregunta son peores que una.

**El capital sale de `capitalRealTotal()`, no de una suma a mano.** El PDF
sumaba "cuentas + afuera" y se dejaba la reserva: 2.302,34 donde Balance de
Cuentas dice 2.479,17.

**Los intereses de préstamos entran en `ganBrutaTotal` pero NO en
`miGanOperaciones`.** Por eso el desglose saltaba de 226,89 a 221,50 sin una
fila que lo explicara, y la pestaña Operaciones enseñaba 221,50 mientras el
Resumen enseñaba 226,89 — dos ganancias brutas distintas en el mismo módulo.
Ahora la fila está y dice lo que pasa: el interés se apunta aparte y no llega
a la utilidad de la empresa. **Si eso debe cambiar —que el interés cuente para
la utilidad y por tanto para el sueldo— es decisión suya, y se toca en
`calcMesCompleto`, no en la pantalla.**

**Apartar un número negativo no significa nada.** Si el socio debe a la
empresa, su saldo es negativo: eso es un cobro, no algo que apartar. La
pantalla lo sumaba tal cual ("TOTAL A APARTAR −120,00") mientras el PDF ya lo
hacía bien.

**Las cuentas en cero se apartan, no se esconden.** 6 de sus 15 lo están. En
Bancos solo se apartan si además no tuvieron ni un movimiento en el mes, y van
nombradas al final: un saldo en cero que debería tener dinero es justo lo que
ella querría ver.

**Un socio sin nada este mes no ocupa media pantalla de ceros** (ARREGLO 58).
Sus palabras: *"ya todas esas cuentas quedaron saldadas, no debería de aparecer
nada de Paul"*. La regla es una (`_socioVacio`): se calla solo si no hay
ganancia de sus rutas, ni deuda viva, ni saldo, ni pagos del mes. **Si queda
una deuda, sí sale** — eso es dinero de verdad, y esconderlo sería peor que el
ruido. Y el socio dormido va **nombrado** al final, no borrado.

Ojo con esto al diagnosticar: las deudas viven en `deudas_paul` con
`cobrada:false`, y se marcan pagadas desde el panel de EE.UU. (💸 DEDUCCIONES
DE …, botón ✅). Si ella dice que está saldado y la app lo sigue enseñando,
casi seguro es que falta ese clic — no un fallo del cierre.

**`rCierreMes()` e `imprimirRelatorioContador()` están muertas** — 313 líneas
que nadie llama, con fórmulas viejas y en portugués. El peligro no es el peso:
es que alguien las lea y crea que son las buenas.

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
