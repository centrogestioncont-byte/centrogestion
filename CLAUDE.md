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

## Y habla CORTO

Sus palabras: *"yo necesito cosas prácticas no un montón de explicaciones"*.

En la conversación: qué pasa, qué hago, qué tiene que hacer ella. Un párrafo de
contexto como mucho, y solo cuando cambia lo que ella va a decidir.

**Lo que sí va entero, siempre:**

- un número suyo que no sea de fiar, y por qué;
- un error tuyo, dicho de una vez y sin rodeos;
- lo que tiene que hacer ella, paso a paso.

El "por qué" largo va en los comentarios del código y en los mensajes de commit
—ahí es donde evita que alguien reintroduzca el error— **no en el chat**.

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

## Si tocas `index.html`, sube `APP_VERSION`

**Un arreglo que no llega al aparato no está arreglado**, y desde fuera se ve
igual que uno que no funciona.

`_checkAppUpdate()` se baja el archivo publicado cada cinco minutos, le saca
`APP_VERSION` y, si no coincide con la que corre, enseña *"🔄 Hay una versión
nueva — toca aquí para actualizar"*. **Ese aviso es lo único que saca a un
aparato de su copia en caché.** El service worker es de paso y no cachea; el
que manda es el caché normal del navegador.

Estuvo clavado en `20260910_v153` desde el **5 de septiembre** mientras
`index.html` recibía **126 commits**, así que el aviso no salió ni una vez. Se
vio el 02/10: ella descargó el PDF del cierre y le salió el de **antes** del
arreglo —secciones en fila, texto gris— con el arreglo desplegado desde hacía
rato, y se estuvo mirando el PDF cuando el problema era el archivo viejo en su
teléfono.

Pedirlo en un comentario del código ya se intentó. Ahora lo comprueba el CI:
`pruebas/version.py` compara contra la rama base y **falla el PR si
`index.html` cambia y `APP_VERSION` no**. Formato `aaaammdd_vNNN`.

Y cuando ella diga que un arreglo "no le llegó" o que ve algo viejo, **empieza
por aquí** antes de tocar el código: que abra `centrogestion.pages.dev/?upd=1`
y mire la versión en Configuración.

---

## Cómo probar — obligatorio antes de cualquier PR

```
python3 pruebas/revisar.py      # archivo entero, sintaxis de cada <script>, 19 funciones clave
node pruebas/prestamos.js       # lógica de préstamos: fechas, mora, tasa sugerida, límite
python3 pruebas/version.py <rama-base>   # que APP_VERSION suba con el archivo
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
- **Y HAY DOS `DATA_KEYS`: la de aquí y la del SERVIDOR** (`main.py` de
  `centrogestion-api`). Esta prueba no ve aquella, así que una clave que se
  añada aquí y se olvide allí **viaja al servidor y el servidor la tira, con
  un 200 y sin un solo error**. Ha pasado dos veces:

  ```
  08/10   histApertura · histComp · mapaBinance
  16/10   inmuebles · inmCuotas · articulos · artGastos · aportes
  ```

  La segunda eran **módulos enteros** —el apartamento, la mercancía y los
  aportes— y vivían solo dentro del navegador de su PC: ni en Mongo, ni en la
  copia automática. Se vio porque la PC tenía su máquina de 210 y el teléfono
  no, y Actualizar no la traía nunca.

  **Son CUATRO listas allí, no una** (ARREGLO 151): `DATA_KEYS` para que se
  guarde, `MERGE_FIELDS` para que se una en vez de reemplazarse, `PODA_CATS`
  para que las marcas de borrado se apliquen en las dos puntas, y
  `MERGE_BLOQUES` para las claves de `config` que viajan juntas. Desde el 151
  `pruebas/claves.py` del servidor **descarga esta app y compara las listas**,
  que es lo único que lo caza — pero solo cuando hay red, así que al añadir
  una clave aquí hay que ir allí igual.
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

### Y un aviso de choque no salta por QUIÉN tocó qué (ARREGLO 148)

Lo vio ella el 16/10 abriendo la pestaña Nueva: *"El otro dispositivo también
cambió estas 2 cosas"* sobre **Banco EE.UU** y **Kraken Fiat**, dos cuentas que
no había tocado. Al abrirlo, la diferencia estaba solo en `_por` y `_porUlt` —
quién lo creó y quién lo tocó— y en los dos lados ponía lo mismo.

`_camposEnConflicto` ya ignoraba `_mod` y `n` *"control y numeración, no
datos"*. `_por` y `_porUlt` son de la misma familia y se quedaron fuera de esa
lista.

**Y eso cuesta más que la molestia.** Este aviso existe para cuando un dato
SUYO se revierte, que es lo que lleva cuatro arreglos costando (6c, 33, 62,
137). Un aviso que salta por nada es el que hace que el de verdad no se lea —
la misma regla del ARREGLO 99 y del 101.

- **No se borran ni se dejan de sincronizar**: solo dejan de **decidir** si
  hubo choque. Si además cambió algo de verdad, el choque sale igual y los
  enseña dentro.
- **Y siguen siendo un dato visible**: el filtro *"qué registró cada quien"* de
  Operaciones lee `_por`. Hay guardia para que no se conviertan en un campo
  muerto.

Cuando el dueño diga que algo "se revirtió solo" o "volvió a aparecer",
**empieza por aquí**: casi siempre es un dato que llegó sin marca.

Y cuando arregles algo de esto: **el arreglo no repara los registros ya
pisados.** Hay que volver a hacerlos a mano una vez. Díselo, no lo des por
entendido.

---

## Los permisos son de la PERSONA, no del rol (FASE B)

Sus palabras: *"no sirve para yo dar un usuario a otra persona con ciertos
permisos que yo como administradora total le otorgue"*.

Antes había **dos** sistemas de permisos y ninguno hacía eso:

- `S.config.modulos` — tres casillas (nueva/clientes/egresos) **por ROL**, así
  que dos personas con el mismo rol no podían tener permisos distintos. Y vivía
  dentro del bloque que se sincroniza: era de los datos que se pisan entre
  aparatos. **Retirado**, y `modulos` está en `_CONFIG_PROHIBIDO` para que no
  vuelva desde un aparato viejo. (Comprobado en su export antes de quitarlo:
  estaba **vacío**, no había ni una casilla desmarcada que rescatar.)
- Los `permisos` del servidor — sí son por persona y los guarda Mongo, pero la
  app **nunca los mandaba** (POST/PUT `/usuarios` solo enviaban el rol) y solo
  los consultaba para el Administrador y el Supervisor.

Ahora manda uno solo: lo que Mongo guarda para esa persona.

- **El rol es un punto de partida, no el permiso.** `PERMISOS_POR_ROL` solo se
  usa cuando la casilla **no está decidida** (`_permisoPorOmision`). Eso es lo
  que evitó que el despliegue cerrara la app a todo el mundo: los usuarios que
  había tenían `permisos` casi vacío, y hasta entonces el menú de un operador no
  salía de los permisos. `pruebas/prestamos.js` compara el menú de **cada rol**
  con el de antes, casilla por casilla: si alguien toca los valores por omisión
  y un rol pierde una pestaña, falla.
- **Una sola puerta.** `PERMISO_DE_TAB` decide el menú **y** el contenido. Antes
  el menú salía de `S.config.modulos` y el contenido de `tienePermiso()`, y no
  coincidían: una pestaña podía estar en el menú y contestar "Sin acceso".
- **Fuera el `isAdmin ? … : ""`.** A un operador se le devolvía **cadena vacía**
  —pantalla en blanco, sin decir por qué—. Ahora todos pasan por `tp()`, que
  dibuja "Sin acceso" y a quién pedírselo.
- **`permisoEdicion()` es `tienePermiso("editar")`**, sin criterio propio. Antes
  leía `api.permisos.editar` a secas y no respetaba el valor por omisión del
  rol: un operador recién creado entraba y no podía guardar nada.
- **Guardar manda la lista COMPLETA**, con su `true` o su `false` explícito.
  Mandar solo lo marcado dejaría el resto "sin decidir", y sin decidir vuelve a
  valer lo del rol: **quitar un permiso no habría quitado nada**.
- **Marcar una casilla no llama a `R()`** — repintar rehace el HTML y cierra la
  tarjeta bajo el dedo (ARREGLO 32). Se marca todo y se pulsa Guardar.
- **Un cambio de permisos llega sin cerrar la app.** `_refrescarMisPermisos()`
  vuelve a preguntar `/auth/yo` cuando la app vuelve al frente. Antes la copia
  de la sesión solo se refrescaba al abrir: le quitabas un permiso a alguien y
  lo conservaba el resto del día.

**Y lo que esto NO es, que está escrito en la propia pantalla.** El servidor
guarda todo el estado en un solo bloque y se lo entrega entero a quien tenga
sesión: no hay forma de que una remesa no le llegue al navegador de un operador.
Lo único que el servidor hace cumplir es **`editar`** (contesta 403 al guardar).
Las demás casillas deciden **qué ve en la app**, no a qué puede llegar. Para
alguien en quien no se confíe del todo, lo que manda es quitarle `editar` o
desactivarlo. Un candado que parece candado y no lo es es peor que ninguno.

---

## La huella es una CERRADURA, no una clave (ARREGLO 64)

Hasta ahora `_apiRestaurarSesion()` entraba **sola**: se abría la app y ya
estabas dentro, sin preguntar nada, mientras la sesión no llevara 7 días sin
verificarse. O sea que **no había ninguna cerradura** — quien cogiera el
teléfono desbloqueado entraba a la contabilidad. Esto pone una.

**Lo que es:** una cerradura local sobre la sesión que YA está guardada en ese
aparato. El servidor sigue reconociendo a la persona por su testigo, igual que
antes; la huella solo decide si esta app deja usar ese testigo o pide la clave.

**Lo que NO es, y no se puede fingir:** quien tenga el aparato y sepa abrir las
herramientas del navegador puede leer el testigo del almacenamiento igual que
antes. Si algún día se quiere que la huella sustituya a la clave en un aparato
**nuevo**, eso es otra cosa: hay que registrar la credencial en Mongo y que el
servidor verifique la firma.

**La regla que no se toca: esto NUNCA puede dejar a nadie fuera de su propia
contabilidad.** Sin WebAuthn, sin lector, sin https, con la huella fallando o
cancelada — siempre queda entrar con correo y clave, y el botón está a la vista
en la propia pantalla de desbloqueo. Es el mismo criterio por el que existe la
gracia sin conexión: un aparato tonto no puede costarle el día.

- **`userVerification:"required"`** en el alta y en el desbloqueo: que el
  aparato compruebe a la persona, no solo que esté presente. Y
  `authenticatorAttachment:"platform"`, el lector del propio aparato.
- **La credencial va amarrada al correo** (`_huellaDeEstaPersona`). Si entra
  otra persona en el mismo aparato, no se encuentra la cerradura de la anterior.
- **Al salir, la huella NO se borra** (ARREGLO 65). El 64 la borraba, por miedo
  a que la siguiente persona se encontrara una cerradura ajena. Ese miedo ya
  está cubierto por el correo: a otra persona la app ni le mira la huella.
  Borrarla no añadía seguridad y costaba caro — ella entra y sale a diario,
  porque cambia entre producción y pruebas, y tenía que registrarla cada vez.
  Sin sesión guardada tampoco desbloquea nada, y para quitarla a propósito está
  el botón de Configuración, que es lo único que la borra.
- **El desbloqueo se dibuja antes que el login** en `R()`. Los dos son "todavía
  no has entrado", pero en este hay una sesión esperando detrás.
- **Si el servidor contesta 401, el bloqueo se cae con la sesión.** Quedarse en
  esa pantalla con un testigo muerto es un callejón sin salida.

`pruebas/prestamos.js` fija todo esto con guardias estructurales. El flujo real
se probó en Chromium con su **autenticador virtual** (`WebAuthn.addVirtual
Authenticator` por CDP), servido desde `http://localhost` — WebAuthn no existe
en `file://`, hace falta contexto seguro.

---

## La pantalla: lo que se midió y no hay que deshacer

Todo esto sale de medir la app en Chromium con sus datos, no de opinar. Los
números que aparecen aquí se pueden volver a sacar con los mismos guiones.

### El diagnóstico que estuvo mal, y cómo se supo

Dijo dos veces que el interior era *"tosco y cansón para la vista"*. La primera
lectura —"está demasiado oscuro"— era **falsa**. Medida su pantalla de
referencia: fondo **negro** y tarjetas **#1C1C1E**, o sea más oscura que
cualquier tema de aquí.

Lo que cansaba era otra cosa: **19 bloques** de más de 4.000 píxeles rellenos de
color en el Resumen, con cromas de 47 a 66 donde el panel vale 8. Sale de
invertir el brillo de un tinte pálido del tema claro: "verde pálido" se
convierte en "bloque verde saturado".

**La lección, que vale para lo próximo: no deduzcas lo que le molesta, mídelo.**
Su referencia estaba a un `getImageData` de distancia.

### Los fondos de aviso se miden por CROMA, no por saturación

Croma = lo que separa el canal más fuerte del más débil. **Tope: 22.** El panel
del tema vale 8 y la tarjeta de su referencia, 2.

La saturación de HSL engaña en los colores muy oscuros: un azul casi negro como
`#1a202c` da 0,26 y parece que grita, cuando al lado del panel no se distingue.
El primer intento usaba saturación y marcaba como problema algo que no lo era.

**El color vive en la LETRA y en el BORDE, que se quedan a plena fuerza.** El
relleno solo lleva el tono suficiente para que el rojo se siga leyendo rojo.

### Las dos pantallas de entrada tienen sus PROPIOS colores

Son siempre negras, elija el tema que elija. Por eso usan `--ent-*`, declarados
una vez en `:root`, que **ningún tema vuelve a definir**.

Estaban pintadas con nombres del tema y aguantó mientras el que abría era el
claro. Al pasar el por omisión a **Suave** se rompió: el texto que ella teclea
pasó de `#F2EDEF` a `#403137` sobre una tarjeta negra —contraste **1,2**—.
**Escribía el correo y la clave y no se veían.** Con él se fueron los iconos del
botón, la letra de los chips y la línea de error: 13 nombres en total.

Tres guardias lo fijan: que los `--ent-*` no tengan versión oscura, que ningún
tema los repinte, y que las dos funciones de entrada no usen ningún otro nombre.

### El flyer tampoco sigue al tema — es lo que ve el cliente

Misma regla que las pantallas de entrada, y se rompió por lo mismo. El flyer se
descarga como imagen, se manda por WhatsApp y **ella lo imprime**: no puede
depender del tema que tenga puesto el aparato desde el que se generó.

Estaba pintado con nombres del tema. El fondo se diseñó **negro** (`--gr1-c`
valía `#0a0a0a` en Claro) y los textos son blancos a medio tono. Al pasar el por
omisión a **Suave**, `--gr1-c` pasó a `#d7d5d5` —gris claro— y los textos
siguieron siendo blancos: *"TU DINERO SE CONVIERTE EN SOLUCIONES"* en blanco al
55 % sobre ese gris da contraste **1,3**. Lo imprimió y no se leía. De paso el
degradado desaparecía, porque en Suave los tres tonos del fondo son el mismo gris.

Ahora usa `--fly-*`, declarados una vez en `:root` con los valores que tenía en
Claro, que ningún tema vuelve a definir. Vale para el flyer y para el mini flyer.
Tres guardias: que no tengan versión oscura, que ningún tema los repinte, y que
`generarFlyer()` y `generarMiniFlyer()` no usen ningún otro nombre.

**Lo que hay que sacar de aquí, porque es la tercera vez:** cuando algo de la app
sale HACIA FUERA —el flyer, el informe del contador, el PDF del cierre— sus
colores son suyos, no del tema. El tema es del aparato de quien lo genera; lo que
sale ya no está en ese aparato.

### Y tampoco el ANCHO: el informe mide 768 px lo genere quien lo genere (ARREGLO 83)

Misma regla, otra propiedad, y costó encontrarla porque desde la PC no se ve.

`#reporteCapture` medía lo que midiera la pantalla. Desde la PC son 768 y cabe
todo; desde su teléfono son 412 y las tablas no caben. html2canvas **solo captura
lo que hay dentro del elemento**, así que lo de fuera no sale ni avisa. Medido el
02/10 a 412 px:

```
77 celdas fuera de la hoja  ←  la columna MONTO entera, todos los importes
```

El mismo botón daba dos documentos distintos según el aparato. Y el bloque
`@media (max-width:639px)` que encogía la letra y metía `white-space:nowrap` era
**parte del problema**, no un apaño: el nowrap es lo que empujaba las tablas
fuera. Se quitó.

Ahora la hoja son **768 px fijos** y en el teléfono se ve reducida con una lupa
(`#reporteLupa`). Tres cosas que no hay que deshacer:

- **La lupa va aparte de la hoja, en dos capas.** El `scale` en la de dentro y la
  altura en la de fuera. Puestos en el mismo elemento se encoge dos veces —la
  altura que se le fija la vuelve a reducir el propio `scale`— y la hoja se sale
  de su hueco por abajo. Medido: 2.775 px de alto quedaban en 1.489.
- **Se quita antes de capturar** (`_sinLupa()`). Un `transform` en un antecesor sí
  entra en el recuadro que mide html2pdf: capturar con ella puesta da un PDF al
  tamaño reducido, borroso y con la letra por debajo de los 10px que este
  documento tiene como suelo.
- **Y se repone en los DOS caminos**, salga bien o falle. Reponerla solo al salir
  bien deja la vista previa a tamaño completo dentro de un teléfono, sin forma de
  volver atrás salvo cerrar y abrir.

Comprobado a 390, 412, 768 y 1280 px: lo que se captura es **idéntico** en los
cuatro —768 de ancho, 5.171 de alto, las 10 secciones dentro, ninguna celda
fuera, letra mínima 10px— y la vista previa cabe sin hueco en blanco debajo. El
reporte del socio se midió también y ese no tenía el problema.

### Pero medir la PANTALLA no es medir el ARCHIVO (ARREGLO 84)

El 83 arregló la hoja y el archivo descargado **siguió saliendo mal**. Sus
palabras: *"no sé qué tanto te cuesta poder generar una descarga de un archivo
en PDF… son unas medidas estándar, eso es fácil"*. Y tenía razón: el fallo no
estaba en la hoja, estaba en el paso que no se había probado.

**html2canvas no dibuja la página: la COPIA a un marco aparte y dibuja esa
copia.** La vista previa no pasa por ese marco; el archivo sí. Dos cosas se
colaban ahí, y las dos solo se ven desde el teléfono:

- **Del marco se le pasaba el alto y no el ancho.** Sin `windowWidth`,
  html2canvas usa el de la pantalla: 412 px en su teléfono, con la hoja en 768.
- **`scale:2` sobre 768 × 5.171 pide un lienzo de casi 16 millones de píxeles.**
  Android lo corta por encima de su tope **sin un solo error**: devuelve una
  imagen recortada o deformada. De ahí sus **15 hojas** con el contenido diminuto
  en una esquina donde deberían ser 5. En la PC no hay ese tope, así que ahí
  nunca se vio.

Ahora se le dan los cuatro números (`windowWidth`, `windowHeight`, `width`,
`height`) y la escala **se mide** contra un presupuesto de 12 millones en vez de
darse por hecha. Con su informe sale 1,5 — 151 puntos por pulgada en A4, que en
papel se lee igual. **Un PDF que no se abre no se lee de ninguna manera.**

Comprobado a 390, 412, 768 y 1280 px sustituyendo `html2pdf` por una función que
anota lo que recibe: las opciones salen **idénticas** en los cuatro —marco
768 × 5.171, escala 1,5, lienzo de 8,9 M, **5 hojas A4**— y la lupa vuelve a su
sitio después de generar.

**Compartir no compartía NADA y no lo decía.** Android pide un gesto reciente
para abrir la hoja de compartir y generar el PDF tarda varios segundos, así que
`navigator.share` se rechazaba; un `.catch(function(){})` vacío se tragaba el
rechazo y el botón volvía a su texto normal. Desde fuera parecía que había
funcionado. Ahora, si no se puede compartir, se descarga y se dice — menos
`AbortError`, que es ella cancelando a propósito.

**Y la versión del archivo va DENTRO del papel.** Dos veces el mismo día hubo
que adivinar qué copia de la app había hecho un PDF que salía mal, mirando la
forma de las tablas. Escrita ahí, cualquier captura suya lo dice sola.

**La lección, y es la cara B del "mídelo, no lo deduzcas":** medir no vale si
mides otra cosa. Aquí se midió lo que html2canvas *iba a* capturar —el DOM vivo—
y el fallo estaba en la copia que dibuja. Cuando no se pueda ejecutar la
librería (el CDN está cerrado en el entorno y en el CI), **sustitúyela por una
que anote lo que recibe**: eso sí es el camino de verdad hasta el último paso
que se puede alcanzar desde aquí.

### Y el estilo tiene que viajar CON la hoja (ARREGLO 85)

El 83 y el 84 no arreglaron el archivo, porque la causa era otra y está una capa
más abajo. Esta es **la de verdad**.

**`html2pdf.js` no dibuja el elemento donde está: lo CLONA y lo cuelga de
`<body>`, dentro de un contenedor suyo.** Todo lo escrito como
`#informePdfOverlay …` deja de aplicar en ese clon, y manda el estilo general de
la app. Medido clonando la hoja a mano, que es lo que la librería hace:

```
                 en pantalla        en el clon que se dibuja
.cuerpo          block              FLEX      ← la regla global del armazón
ancho            768                5.132
tinta de tabla   #111111            #dcdae0   ← gris del tema
cabecera         #f2f2f2            #14192a   ← azul oscuro del tema
```

Esa segunda columna **es exactamente el PDF que ella recibía**: secciones en
fila, texto gris, cortado por la derecha. Y explica por qué la vista previa
estaba bien: la pantalla sí tiene el overlay encima.

Ahora las reglas del documento cuelgan de una clase que lleva **la propia
hoja** —`.inf-doc` en el informe, `.soc-doc` en el del socio—, que viaja con el
clon. Del overlay solo quedan las de pantalla: el fondo, la columna, los botones
y la lupa. Y lo que antes se **heredaba** del overlay —la familia de letra, el
color de la tinta, las cifras de ancho fijo— va escrito en la hoja, porque fuera
del overlay no lo hereda de nadie.

- **El `@media print` se queda en el overlay, a propósito.** Al imprimir no hay
  clon: el overlay de verdad está ahí, y esas reglas son justo las que lo
  adaptan al papel.
- **La guardia cuenta selectores.** `pruebas/prestamos.js` recorre las dos hojas
  de estilo y exige que del id del overlay solo cuelguen los nombres de pantalla.
  Una regla nueva escrita con el id vuelve a abrir el agujero, y falla.

**La lección, que es la cuarta vez con la misma forma:** este archivo tiene un
estilo global —`.cuerpo`, `td`, `th`, `.val`, `.lbl`, `.sub`— y cualquier
documento que se saque fuera de su sitio lo hereda. **Scopearlo por un id del
contenedor no basta si lo que se exporta es el contenido, no el contenedor.**

### Lo indivisible es la FILA, no la tabla ni la sección (ARREGLO 86)

El 79 dejó escrito *"ni una tabla ni una sección se parte entre hojas"*, y con
sus datos reales eso salía **al revés** de lo que buscaba: una sección que no
cabe en lo que queda de hoja salta entera a la siguiente y deja media hoja en
blanco; y las que no caben **ni en una hoja completa** —Préstamos activos, 20
filas— se parten igual. O sea que el hueco no compraba nada.

Medido con un mes de su tamaño (23 operaciones, 20 préstamos, 25 egresos):

```
            bloques empujados   blanco que generan      hojas
antes              14            7.916 px ≈ 7,1 hojas    ~15
ahora               4                75 px ≈ 0,1          8
```

Ahora `break-inside:avoid` vive solo en el `tr`. Ninguna fila se corta por la
mitad, el título sigue sin quedarse solo al final de una hoja (`h2` conserva su
`break-after:avoid`) y desaparecen los huecos.

**Y la cabecera de columnas no se repite POR CSS, aunque sería lo suyo.**
`html2pdf` hace **una imagen** de la página y la corta en trozos del alto de un
A4: no hay motor de maquetado que repita nada, así que `<thead>` con
`display:table-header-group` aquí no hace absolutamente nada. Se intentó y se
quitó; no hace falta volver a probarlo. (Desde el **ARREGLO 90** sí se repite,
pero de otra forma: la app **clona** la fila de cabecera al DOM antes de
dibujar. Ver más abajo.)

### Una hoja = un tema con su título (ARREGLO 90)

Sus palabras: *"quiero que el informe no se corte cuando pase de una página a
otra. No es que todo esté en una sola página. Es que cuando pase una hoja y
venga la otra información, tenga su título allí, cada hoja tenga su título, a
qué corresponde cada hoja y que la información sea completa de ese título.
Porque así es muy tedioso, demasiada información en una sola hoja, brinca para
un lado, brinca para otro, se corta y ya me han devuelto ese reporte muchas
veces."*

El 86 arregló que no se partiera una fila. Lo que ella pedía era otra cosa: que
una hoja se pueda leer sola. El documento era una tira continua y el PDF la
cortaba cada 1.112 px donde cayera, así que una hoja podía empezar a mitad de
una tabla sin decir de qué era.

**Esto no se puede hacer con CSS, y ahí está la trampa.** El PDF se dibuja hoja
por hoja (ARREGLO 88) recortando la **misma imagen** del documento: no hay motor
de maquetado al que decirle "no partas aquí" ni "repite el título", y
`break-before` no lo mira nadie en ese camino. Por eso el reparto lo hace la app
sobre el **DOM ya dibujado**, en `_paginarInforme()`, metiendo tres cosas:

```
un RELLENO     antes de lo que no cabe, para empujarlo a la hoja siguiente
el TÍTULO      repetido con "(continúa)" arriba de esa hoja
la CABECERA    de columnas, si lo que sigue es media tabla
```

**Y eso corrige lo que el 86 dejó escrito sobre la cabecera.** Es verdad que no
se puede repetir **por CSS** —`display:table-header-group` no hace nada aquí—,
pero sí se puede **clonar al DOM antes de dibujar**, que es otra cosa. Lo que no
hay que volver a intentar es el `<thead>`.

Cuatro cosas que costaron medirse y no hay que deshacer:

- **La banda se decide por CAMBIO DE HOJA, no por "esto cruza un corte".**
  Mirando solo lo que se parte, con 70 clientes la tabla ocupaba tres hojas y
  solo la segunda llevaba título: la fila que empezaba la tercera caía justo en
  el borde, no cruzaba nada y se quedaba sin banda. Medido: *"hoja 8 sin título
  en la hoja"*. Se sigue en qué hoja va el apartado y se repite el título cuando
  cambia, parta algo o no.
- **El aire de cada apartado va en su `padding`, no en el margen del `h2`.** Un
  margen de arriba se suma **por fuera** de la caja, así que el apartado
  siguiente empezaba 24 px pasado el corte — y el relleno, que solo puede
  **añadir**, lo empujaba una hoja **entera**. Medido: una hoja 8 en blanco con
  el apartado 6 en la 9.
- **El relleno solo suma.** Pasarse deja más blanco; quedarse corto parte una
  tabla por la mitad, que es lo único que no se puede permitir. Va en varias
  pasadas porque meterlo cambia el documento (los márgenes pegados se colapsan).
- **Dentro de una tabla el relleno es un `<tr>`.** Un `<div>` ahí lo saca el
  navegador fuera de la tabla y el hueco aparece donde no toca.

**La geometría vive en un solo sitio** (`INF_ANCHO_HOJA`, `INF_PX_HOJA`,
`INF_MARGEN_MM`): la leen el reparto y el PDF. Dos copias del mismo número y el
reparto cae donde el PDF no corta. Y el `@page` de imprimir pasó a `8mm` para
que el navegador corte por el mismo sitio.

**Las rayas de corte se ven en la vista previa**, con el número de hoja. Van
dentro de la lupa y **fuera** de `#reporteCapture`, así que no se capturan nunca.
Sin eso hay que descargar el archivo para saber si el reparto quedó bien.

Medido en Chromium a 390, 412, 768 y 1280 px, con un mes de su tamaño y con otro
de 70 clientes:

```
                              su mes      mes de 70 clientes
apartados fuera del corte        0                0
filas cortadas                   0                0
hojas en blanco                  0                0
hojas sin título propio          0                0
hojas del PDF                   13               18
```

**Lo que cuesta: más hojas.** De 8 a 13 con sus datos, y 6.274 px de blanco. Eso
no es un fallo que arreglar: es lo que se compra al poner un tema por hoja, y es
lo que pidió. Si algún día dice que son demasiadas, lo que hay que tocar es
dejar que dos apartados pequeños compartan hoja — **no** quitar el reparto.

#### Y lo que se fue del informe

Sus palabras: *"no me importa mucho que me deje un informe de todas las remesas
que salieron, solamente por dónde salieron, cuánto salió por cada ruta… con los
detalles de cada operación, yo diría que eso no es tan relevante"*.

Se fue el **detalle remesa por remesa**. De `detalleMes()` siguen las **compras y
ventas de USDT** y los **traspasos entre cuentas** —que son el movimiento de
banco de verdad, de donde sale toda la ganancia— y entró lo que pidió: **cuánto
mandó cada cliente y cuántas veces**, ordenado por lo que pesa.

Dos reglas que ya valían y aquí vuelven a aplicarse:

- el volumen de cada ruta va **en su moneda** y la columna **no lleva total**:
  sumar reales con bolívares da un número que no existe;
- lo de cada cliente sí se suma, convirtiendo con `getRateToUsdt()` (que
  **divide**), y si a una moneda le falta la tasa el total se marca **"parcial"**
  en vez de quedarse corto en silencio.

**El índice de la portada sale de la misma lista que se dibuja.** Numerarlo a
mano se descuadra en cuanto un apartado se calla por estar vacío (un socio sin
nada este mes, ARREGLO 58).

**Y el signo va delante del símbolo.** `f2l` de un negativo devuelve `-73,26` y
anteponerle el `$` escribía **`$-73,26`**, que se lee como un precio raro en vez
de como una pérdida. Está en `usd()`.

### Hoja por hoja, y por eso 302 puntos por pulgada (ARREGLO 88)

Sus palabras: *"¿por qué el PDF sale pixelado? no se ve nítido"*. Porque **no es
texto**: `html2pdf` dibuja la página en un lienzo y mete esa **imagen** en el
PDF. Lo nítido que salga es lo que mida ese lienzo.

Dibujando el documento **entero** de una vez, el lienzo tiene que caber bajo el
tope de Android (ARREGLO 84), así que la escala bajaba a 1,5 — **151 ppp**, la
mitad de calidad de imprenta. Y cuanto más largo el mes, peor: con un mes grande
bajaba a 1 (101 ppp). O sea que la nitidez dependía de cuántas operaciones tuvo.

Hoja por hoja cada lienzo es pequeño —**2.304 × 3.336 px a 3×, 7,7 M de
píxeles**— así que cabe de sobra y **la calidad ya no depende del mes**: 302 ppp
con 5 hojas y con 20. Es el mismo criterio del 83: lo que sale hacia fuera no
puede depender de las circunstancias del aparato.

- **PNG, no JPEG.** El JPEG es con pérdida y se nota justo donde peor va, en el
  borde de las letras. Sobre blanco el PNG además pesa poco.
- **El camino viejo queda como respaldo**, por si la librería no expone
  `html2canvas` y `jsPDF` sueltos. Mejor un PDF de 151 ppp que ninguno.
- **Y si lo quiere perfecto, el botón Imprimir → "Guardar como PDF"** lo hace el
  navegador con texto de verdad: nítido a cualquier zoom, y se puede buscar.

Medido con los dos sustituidos por funciones que anotan lo que reciben, a 390,
412, 768 y 1280 px: 8 hojas, 8 páginas, escala 3, 302 ppp, cortes contiguos que
cubren exactamente el alto del documento, las 8 en PNG, ninguna en JPEG. Y
quitando las dos piezas, cae al respaldo sin un error.

### Cada papel enseña lo suyo (ARREGLO 87)

Sus palabras: *"el reporte a socio mayor no es el mismo que los socios menores y
no es lo mismo que el contador, cada uno tiene que ver información diferente"*.
Julio es su marido y el otro **dueño**, no un socio de comisión — así que su
documento no es uno nuevo: **es el Informe Mensual**. Los socios de ruta (Paul,
Diana) siguen llamándose socios; *aliado* ya significa otra cosa aquí, el que
entrega los pesos en Colombia.

```
Informe Mensual   → Julio y ella   el estado real completo
Reporte por socio → cada socio     solo lo suyo
Hoja del contador → el contador    lo fiscal
```

El reporte por socio **ya estaba bien**: no menciona `capitalRealTotal`,
`S.cuentas`, `S.prestamos`, `cuentasCobrar` ni `inventarioUsdt`. Una guardia lo
fija, porque es lo único que impide que un día se cuele ahí el capital.

**Lo que faltaba era el estado de la empresa, y va PRIMERO.** Sus palabras: *"no
se entiende claramente el estado real de la empresa… no me pones el desglose de
lo que es saldo de la empresa primero, tanto en usdt tanto en bs y su
equivalente en usdt, igual con todas las monedas… no omitas información solo
expresarlo mejor"*.

El informe abría con la cuenta de resultados del mes —cuánto ganó— y lo que un
dueño mira primero es **cuánto hay**. Las dos cosas estaban, pero el "cuánto
hay" salía convertido todo a USDT y repartido en tres sitios del documento: no
había forma de ver cuánto tiene en bolívares sin ir sumando a mano.

- **El desglose lo devuelve `capitalRealTotal()`**, que es quien ya recorre las
  cuentas, los cobros y los préstamos. Calcularlo aparte sería la segunda
  respuesta a la misma pregunta — justo lo que ya hizo que dejara de fiarse de
  dos números que diferían en un céntimo.
- **Se guarda el monto NATIVO y aparte su equivalente.** Convertirlo todo a USDT
  es lo que impedía ver cuánto hay en cada moneda.
- **Las monedas se ordenan por lo que pesan en USDT**: la primera fila es donde
  de verdad está su dinero, no la que entró antes.
- **El interés pendiente se dice pero NO suma** (ARREGLO 71). Esconderlo sería
  peor —es dinero que le van a dar— y sumarlo sería inventarse capital.
- **Y nada se quita: se ordena.** El detalle de cada cuenta, cada cobro y cada
  préstamo sigue entero, más abajo.

Comprobado con un mes de su tamaño: la suma de las filas por moneda da
**7.476,67**, exactamente el total que ya daba la conciliación. Si alguna vez no
cuadra, es que alguien calculó el desglose por su cuenta.

### Una tarjeta se define en UN sitio

`.pz-rejilla`, `.pz-card`, `.pz-rot`, `.pz-num`, `.pz-pie` viven en el `<style>`.
Si cada pantalla se escribe sus estilos, en dos semanas hay diecisiete tarjetas
distintas — que es de donde venimos.

### Nada por debajo de 10px, y el informe del cierre es la excepción

Medido antes: Operaciones **86 %** del texto a 11px o menos, Diario **92 %**. Y
lo diminuto no era el adorno: eran los montos, las tasas, los nombres de los
clientes y los bancos. Los sufijos de moneda estaban a **9px**. El dato con el
que trabaja era lo más pequeño de la pantalla.

**El informe del cierre queda fuera de esa guardia a propósito**: se imprime en
papel, donde 9px se lee bien y el sitio escasea. Es la misma razón por la que
sus colores tampoco siguen al tema.

### Cuando todo está en negrita, la negrita no significa nada

Clientes tenía el **85 %** del texto en negrita, y el nombre —lo único que se
busca ahí— se pintaba en un azul oscuro sobre tarjeta oscura: contraste **2,01**.
Ahora el nombre es lo único en negrita y está en 10,91.

### Lo urgente no se esconde nunca

Los avisos del Resumen van en una línea que se pliega, pero **plegada la
cabecera sigue diciendo el aviso urgente entero**. Un cobro de 54 días no puede
quedar detrás de un "ver más". Esconder un aviso rojo cuesta dinero de verdad.

Y plegar **no llama a `R()`**: repintar cierra lo que tenga abierto bajo el dedo
(ARREGLO 32 otra vez). Se cambia el `display` por su id.

---

## Dos errores de NÚMEROS que salieron haciendo pantallas

No son de diseño y son los que más caro habrían salido.

### Sumar monedas distintas da un número que no existe

La primera tarjeta de Por cobrar enseñaba **"$177,00"**: la suma cruda de dos
cargos de 97 y 80 **en reales**, con símbolo de dólar delante. Los cargos están
en BRL, VES y USDT.

**Para sumar entre monedas se convierte con `getRateToUsdt()`, que DIVIDE**, y
si a una moneda le falta la tasa el total se marca **"parcial"** en vez de
quedarse corto en silencio. Un total corto que parece completo es peor que no
dar total.

### El mismo dato no se calcula en dos sitios

El panel de Por cobrar sumaba por **cliente** (cada saldo ya redondeado) y la
tarjeta nueva por **cargo**: la misma pantalla decía **34,27 arriba y 34,28
abajo**. Un céntimo basta para que deje de fiarse de los dos.

Es la misma regla que ya obliga a que el cronograma salga de `cronogramaCuotas()`
y de ningún otro sitio. Por eso la proyección del mes se calcula una vez, en
`_evo`, y la leen la tarjeta del Resumen **y** el pie del gráfico.

**Antes de añadir un número a una pantalla, busca si ya está calculado en otro
lado.** Si lo está, léelo de ahí.

---

## El menú: un solo orden, y lo que no está no desaparece

`_GRUPOS_MENU` es el único sitio donde vive el orden, y lo leen la barra lateral
(PC) y el menú desplegable (teléfono). Si cada uno tuviera el suyo acabarían
distintos, y cambiar de aparato sería volver a aprenderse la app.

**Una pestaña que no esté en ningún grupo cae en "Más" al final**, no se pierde.
Una pestaña nueva que se olvide de apuntarse tiene que seguir alcanzándose.

Y los dos menús se dibujan con la lista **ya filtrada por permisos**, no con
`TABS[S.role]`: si leyeran los tabs del rol volverían a enseñar pestañas que
contestan "Sin acceso" al tocarlas, que es el error que arregló la FASE B.

El corte de la barra lateral son **900px**. Por debajo queda todo exactamente
como estaba: el teléfono no cambió.

---

## El tema es de cada APARATO, y no lo decide el sistema operativo

Tres temas: **Claro**, **Papel** y **Suave**, y el que abre solo es **Suave**,
que lo pidió ella después de ver el resultado.

Se guarda en `localStorage`, **no** en lo que se sincroniza: puede querer oscuro
en el teléfono de noche y claro en la PC de día. Y **no mira
`prefers-color-scheme`**: si lo hiciera, el móvil entrando en modo noche le
cambiaría la app sola a media jornada de registro.

Cambiar el tema **no llama a `R()`** (ARREGLO 32), y la tarjeta de Configuración
marca el tema que está **corriendo**, no el guardado — dar por hecho cuál manda
sin elegir es lo que hizo que la app corriera en Suave y la tarjeta marcara
Claro.

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

**Y la comisión BAJA EL LOTE, desde el ARREGLO 161.** Aquí decía lo contrario
—*"es correcto que no lo baje… no lo arregles"*— y **lo revirtió ella** el
16/10. Aquella regla miraba qué se le entregó al **cliente**; lo que el lote
tiene que reflejar es qué salió del **banco**, y la comisión salió. Dejándola
fuera, el lote afirmaba tener bolívares que el banco ya se había llevado:
5.112 Bs sólo en octubre, creciendo solos, y de esos lotes salen las tasas que
la app sugiere.

**No toca la ganancia, y eso se midió antes de aceptarlo:** la comisión ya se
resta una vez en USDT dentro de la remesa, y consumir lote no entra en ese
cálculo. Medido con una remesa de 100 R$ a 184 con pago móvil — **1,5171 USDT
antes y después**, y el lote baja 18.400 + 55,2 = 18.455,2.

### Y cuando la entrega sale de DOS bancos, son dos comisiones (ARREGLO 97)

Sus palabras: *"me faltaría cuando yo pago de dos cuentas diferentes… pagué una
parte por el banco provincial y pagué otra parte por el banco de Venezuela…
sería bueno que yo pueda colocar por qué banco pagué tal cosa y por qué banco
pagué el restante, y que descuente de forma correcta, igual que en la parte del
FIFO que esté vinculado. Pero no me gustaría que eso esté allí todo el tiempo
visible porque son casos esporádicos."*

Es el espejo del ARREGLO 44 —que ya hacía esto cuando el cliente paga de varias
formas— por el lado de la salida, y con el mismo botón escondido: apagado, el
formulario es exactamente el de siempre, una sola cuenta.

Antes había que descontarlo todo de un banco y cuadrar el otro con un traspaso
que nunca ocurrió. Dos cosas **no** son copiar y pegar del 44, y son las que
cuestan:

- **Son DOS comisiones, y el mínimo es el que se cuela.** `comisionBancoVES()`
  cobra por banco y sobre el monto de **ese** banco, así que el tipo de pago va
  **por fila**, no por remesa. Partido en dos, el mínimo de 14 entra dos veces:

  ```
  una entrega de 4.000 por pago móvil ....... 14 Bs   (el 0,3% son 12)
  partida en 2.000 + 2.000 ................... 28 Bs   ← 14 + 14
  ```

  Medida sobre el total se quedaría en 14 y faltarían otros 14 que el banco sí
  se llevó. **Partir el pago le CUESTA más comisión**, y el desglose lo dice en
  pantalla antes de guardar — no después, cuando el saldo ya no cuadra.
- **El FIFO se parte igual.** Los bolívares salen de los lotes de la cuenta que
  de verdad los pagó (`cuentaDestinoId`), así que el consumo va cuenta por
  cuenta. Aquí sale limpio porque se **consume**, no se crea un lote: es justo
  lo que obligó al 44 a bloquear el desglose cuando lo que **entra** son
  bolívares, donde sí nace un lote y nace pegado a una sola cuenta.

Lo que no hay que deshacer:

- **El USDT se consume UNA vez**, fuera del bucle de cuentas. Depende de la
  cuenta de **entrada**, no de por dónde se pagó: metido dentro del bucle se
  consumiría tantas veces como bancos haya y la ganancia saldría mal.
- **Con una sola cuenta el camino es el MISMO.** `_entregasParaFIFO()` devuelve
  una fila cuando no hay desglose, para que no haya dos maneras de consumir el
  FIFO que se separen con el primer cambio.
- **No guarda si las filas no suman exactamente lo entregado**, ni con una
  cuenta repetida (dos filas de la misma cuenta verían el mismo saldo de lotes
  entero y la app diría que alcanza cuando no alcanza), ni mezclando monedas.
- **Lo entregado que enseña la pantalla sale de `cTx()`**, que es de donde lo
  saca `saveTx()` al validar. La pantalla tenía su propio redondeo y en la ruta
  VZLA→BRL no coincidía: ella cuadraba contra el número de arriba y al guardar
  le decía que no cuadra.
- **`cuentaDest` se queda en la primera fila.** El Balance por cuenta, los
  filtros, el cierre y el reporte leen ese campo y no se enteran del desglose.
- **Al borrar, cada parte vuelve a los lotes de SU cuenta**
  (`_restaurarVentasFIFO()`, escrita una vez y usada por los dos caminos del
  borrado). Devolverlo todo a la primera dejaría a un banco con lotes que nunca
  gastó y al otro sin los suyos — y de los lotes salen las tasas que sugiere.
- **El tipo de comisión guardado pasa a `"varias"`** cuando hubo más de una. Si
  se quedara con una sola, las pantallas dirían "pago móvil" de una remesa que
  fue un pago móvil **y** una transferencia.

Probado en Chromium con dos bancos y sus lotes: las dos cuentas bajan su parte
más su comisión, cada lote pierde lo suyo, el USDT se consume una vez, y al
borrar la remesa los tres saldos y los tres lotes vuelven exactos.

**Queda fuera el formulario de EE.UU → Venezuela** (`S.txE`, `saveTxEE`), que es
otro camino con su propia pantalla. Si hace falta allí, es el mismo patrón.

#### Pero el 97 dejó DOS sitios para elegir la comisión (ARREGLO 98)

Lo cazó ella en la primera remesa real: *"arriba tú me colocas que asignes si un
banco cobra comisión y el otro no… pero abajo también está el botón de la
comisión. No sé si ponerlo con comisión o no, si se descuenta doble."*

**Doble no se descontaba** —`saveTx` ya leía solo las filas— pero el selector
global seguía dibujado debajo, y la **vista previa de la ganancia seguía
leyéndolo a él**. Con una fila en pago móvil y el selector en "sin comisión", la
pantalla enseñaba la ganancia sin descontar nada y al guardar sí se descontaba.

- **Con el desglose puesto, el selector de abajo no se dibuja.** En su sitio va
  una línea que dice dónde vive la comisión y cuánto suma. Dos sitios para lo
  mismo, con dos respuestas distintas en la misma pantalla, es exactamente lo
  que hace que no se pueda saber cuál manda.
- **Y la comisión viva sale de las filas** (`comisionesDeEntregas`), no del
  selector.

**Y de paso salió un número más viejo que mentía más.** Esta pantalla
**recalculaba la ganancia por su cuenta** en vez de leer `cTx()`, que es la que
se guarda, y le restaba `COM()` a los dos lados **siempre** — mientras `cTx()`
no la aplica cuando la tasa viene de un lote, porque la tasa de un lote ya lleva
dentro lo que cobró Binance (ARREGLO 42). Con sus comisiones (0,06 USDT y **0**
en el lado VES) y las tasas del inventario, que es el caso normal:

```
pantalla   19,82 − 18,41 = 1,41        ← restaba 0,06 a cada lado
guardado   19,88 − 18,35 = 1,53        ← cTx(), sin restarla dos veces
```

**0,12 USDT por debajo en cada remesa.** Ahora `rNueva` lee `uc`, `uv` y `pr` de
`cTx()`: el mismo dato no se calcula en dos sitios. La ganancia que ve es la que
se apunta.

El rótulo de esa línea también decía **"(3% banco)"**, que no es ninguna de las
tres tarifas —son 0,3 % con mínimo, 54 fijos, o nada—. Dice "comisión del banco".

**Y la lección, que es la tercera vez:** una pantalla nueva que convive con un
control viejo tiene que **quitar el viejo**, no ponerse al lado. Lo mismo valió
para `S.config.modulos` (FASE B) y para los dos "deberías tener" del cierre.

### El aviso del calce decía que no podía, calculando (ARREGLO 120)

Lo vio ella el 12/10 registrando una vuelta de 147.000 Bs: la pantalla decía
**"⚠️ Sin la permuta y la tasa de venta no hay ganancia que calcular"** con las
dos escritas (188,88 y 5,09) y con los USDT ya calculados justo debajo.

Reproducido en Chromium con su export, tecleando de verdad en el campo:

```
campos vacíos ..............  sale el ⚠️           correcto
escribe la permuta .........  el ⚠️ SE QUEDA       y los USDT sí salen
se repinta la pantalla .....  el ⚠️ se va
```

**La causa:** `upC()` refresca por su id los montos (`s1-`, `s2-`, `s3-`, `cp-`)
y la línea de tasas, pero ese recuadro **no tenía id**, así que se quedaba del
último repintado — cuando los campos estaban vacíos. Es el ARREGLO 55 otra vez:
**lo que se recalcula al teclear tiene que refrescarse al teclear**, o la
pantalla enseña dos cosas que no cuadran entre sí.

Y un aviso que dice *"no puedo calcular"* mientras calcula es peor que no
tenerlo: es lo que enseña a no leer los avisos, y en esta app los avisos cuestan
dinero.

- **Sale de `_htmlAvisoCalce()` y de ningún otro sitio**, y lo dibujan la
  pantalla y `upC()`.
- **Lee de `cTx()`**, no de las variables sueltas de `rNueva` — que es justo lo
  que mordía en el ARREGLO 98.
- **Y dice CUÁL falta.** *"Sin la permuta y la tasa de venta"* con una puesta
  manda a revisar la que ya está bien.

**Lo que hay que saber de ese formulario, porque no es obvio:** la **tasa de
venta de USDT la pone la app sola** desde el inventario (medido: 5,09 con sus
lotes). La única que escribe ella es la **permuta**, y es la tasa de **ida** a la
que va a entregar esos bolívares — con 188,88 sobre 147.000 Bs y 700 R$
entregados salen **15,38 USDT**. Por el otro camino, *Con USDT (P2P)*, la app usa
sus lotes y con sus datos sale **17,36 USDT**: no es que uno esté mal, es que son
dos operaciones distintas y hay que elegir la que de verdad va a hacer.

### La permuta sale de los LOTES, y el margen se cuenta UNA vez (ARREGLO 123)

Sus palabras del 13/10: *"imagínate si la tasa varía en todo el día y son muchas
operaciones, ¿cómo yo me voy a acordar a qué tasa me entraron esos bolívares? Eso
me lo debería dar el mismo sistema, según por el orden FIFO"*.

Tiene razón, y el precio de equivocarse no es la molestia: **es que la app apunta
una ganancia que no tuvo.** Medido en Chromium con un cruce cerrado —entran
147.000 Bs a 210 y salen todos a 189, o sea 77,78 R$ de ganancia de verdad—:

```
vuelta a 189  +  ida a 189   →  15,28 USDT    la verdad: 15,28   ✅
vuelta a 189  +  ida a 210   →  32,26 USDT                       ❌
vuelta a 189  +  ida a 220   →  40,34 USDT    2,6 veces          ❌
```

**El margen del cruce se cuenta una vez.** Si la vuelta ya lo apuntó —porque ahí
se escribió la ida a la que iban a soltarse esos bolívares— la ida no puede volver
a apuntarlo. Ella escribió **220** en una ida cuyos bolívares habían entrado con
permuta 188,88: eso es contarlo dos veces, y nada en la pantalla lo decía.

**Y el número sale solo**, con la misma fórmula en los dos sentidos:

```
permuta = (Bs por USDT)  ÷  (reales por USDT)
```

En la ida los bolívares salen de sus lotes, así que el Bs/USDT es el ponderado del
consumo FIFO —el que `getAutoRates` ya calcula y la pantalla ya enseña— y los
reales se valoran a su tasa de compra. En la vuelta es al revés. Lo que falte de
lotes cae en `tasaDeReferencia()`, que es la que ya valora ese dinero parado.

- **La comprobación de que no sobra ni falta ganancia:** con la permuta sugerida,
  el calce da **exactamente lo mismo que "Con USDT (P2P)"** (medido: 0,70 contra
  0,70). La única diferencia entre los dos caminos tiene que ser la comisión de
  Binance que el calce no paga; si se separan más, la permuta está inventando.
- **El campo sale relleno, pero no pisa lo suyo.** `txMetodo("calce")` lo rellena
  solo si está vacío: puede haber un calce de verdad a otra tasa y decidirlo es
  suyo.
- **Y cuando lo tecleado se aparta más de un 2 %, se avisa con los TRES valores**
  (`_htmlPermutaFuera`): lo que apunta con la suya, lo que apunta con la de los
  lotes, y de dónde sale la de los lotes. Un aviso que solo dijera "parece mucho"
  hay que comprobarlo a mano, que es justo lo que esto viene a quitar. **No se
  corrige solo** — es el mismo criterio del aviso de tasa al revés (ARREGLO 55).
- **La ganancia de la comparación sale de `cTx()`**, poniendo la permuta y
  devolviéndola **en un `finally`** (`_prConPermuta`): mirar el resultado no puede
  ser ya haberlo aplicado. Misma regla que `_simularConFecha`.
- **El botón "usar" no llama a `R()`** (ARREGLO 32): escribe el campo por su id y
  llama a `upC`.

**Dónde se prueba cada mitad, porque esta vez se separaron a propósito:** las
guardias estructurales de `pruebas/prestamos.js` fijan la forma de la cuenta (que
`cTx` despeje `tc` desde la permuta, que el relleno no pise, que el `finally`
exista); **el cruce cerrado se mide en Chromium**, con la app entera cargada —
`cTx()` necesita `getRUTAS` y media docena de constantes más, y una caja rellena a
medias prueba menos que el navegador.

### En la VUELTA no se gana: se COMPRA (ARREGLO 124)

Sus palabras del 13/10: *"apuntar la ganancia por adelantado es como también
inflar la ganancia"*. Exacto, y era lo que pasaba.

Cuando entran 147.000 Bs y ella entrega 700 R$, **no ha ganado nada: ha
comprado**. Cambió reales por bolívares, como una tienda que compra mercancía.
Gana el día que suelta esos bolívares, y cuánto depende de a cuánto los suelte —
que ese día todavía no sabe. Escribiendo ahí una permuta de 188,88 le decía a la
app *"los voy a vender a 188,88"*, y la app apuntaba la ganancia entera **antes
de vender nada**. Si luego los soltaba a 195, lo apuntado nunca existió.

Medido en Chromium con un cruce cerrado (147.000 Bs a 210, soltados todos a 189):

```
vuelta a 188,88 → 15,38 · la ida de 60 R$ a 189 → 0,13   (1,06 por cada 500)
vuelta a 210    →  0,00 · la ida de 60 R$ a 189 → 1,31  (10,94 por cada 500)
                          el TOTAL de las dos patas es 17,02 en los dos casos
```

**Y el 210 no hay que teclearlo: es la tasa de la propia remesa**, que ella ya
escribió (147.000 Bs ÷ 700 R$). Por eso el campo **desaparece de la vuelta** y
`cTx` toma `td2` como permuta cuando `isVzla`. Un campo que se teclea de memoria
es un campo que se teclea mal, y aquí equivocarse apunta ganancia que no existe.

- **El lote de bolívares nace valiendo lo que costaron los reales que salieron** —
  su costo de verdad— y la ganancia sale enterita en la ida, que es donde se
  produce. La ida sigue con su permuta, que sale sola de los lotes (ARREGLO 123).
- **El aviso dice "COMPRA" con esas palabras.** Un `GANANCIA 0,00` sin explicación
  se lee como que la operación no sirvió.
- **La identidad es exacta cuando el real no se mueve.** Medido: mismo día,
  vuelta 0,00 + ida 15,28 = **15,28**, que son los 77,78 R$ de ganancia a 5,09.

**Lo que NO cuadra al céntimo, y hay que saberlo:** si entre la compra y la venta
la tasa del real contra USDT se mueve, esa diferencia aparece **dentro de la ida**.
Medido con el real pasando de 5,09 a 5,0327: la ida apunta 17,02 donde los 77,78
R$ a la tasa de hoy son 15,45 — **1,57 de diferencia**. No es ganancia de la
remesa: son sus reales cambiando de valor, lo mismo que la conciliación ya separa
como *"tus bolívares valen menos hoy"*. Es la convención de toda la app —cada
operación se valora con las tasas de su momento— y no se cambia aquí sin decidirlo
a propósito.

### De dónde salen los bolívares, y en SU unidad (ARREGLO 125)

Sus palabras del 13/10: *"de qué forma lo podemos trabajar cuando haya dinero de
ambos lados, o sea allá en bolívares por ventas de USDT o porque yo compré
bolívares"* y *"tienen unas tasas raras ahí, a mí eso me crea confusión"*.

**El FIFO ya lo mezclaba bien.** Gasta del lote más viejo al más nuevo y promedia;
eso no había que arreglarlo. Lo que faltaba era **poder verlo**: la pantalla
enseñaba una tasa media y no había forma de saber de dónde salía. Con sus dos
orígenes del 13/10, ahora lo dice:

```
DE DÓNDE SALEN LOS 199.962 BS
  147.000 Bs · 10/11 · cruce    1.010,38 Bs/USDT  ≈ 200,76 Bs/real
   52.962 Bs · 10/12             966,67 Bs/USDT  ≈ 192,08 Bs/real
Te cuestan 198,39 Bs por real y los das a 189,00 → ganas
```

- **El recorrido se escribe UNA vez, en `_repartoFIFO()`**, y lo leen la lista y
  `getTasaVentaPonderada()`. Calculado aparte, con el primer redondeo la lista y
  el número de arriba dirían cosas distintas — el 34,27 contra el 34,28.
  Comprobado contra la versión desplegada: **idéntico en 154 comparaciones**
  (sus lotes reales más doce inventados × 11 montos × cuentas × VES/BRL).
- **Es de solo lectura.** Mirar de dónde sale el dinero no puede gastarlo: no
  toca `bsRestante` ni escribe en el inventario. Hay una prueba negativa dedicada.
- **La traducción a Bs/real es una DIVISIÓN** por su tasa de compra de reales
  (`tasaDeReferencia("BRL")`). Multiplicar daría un número creíble y falso. Sin
  esa tasa **no se escribe nada**, no se inventa un número.
- **Y solo vale para los lotes de bolívares.** Un lote de reales ya está en
  reales: dividirlo por la tasa de compra de reales daría un *"≈ 1,01 Bs/real"*
  que no significa nada. Lo cacé escribiéndolo antes de probarlo.

#### Lo que se valora, se enseña — y eso lo encontró medirlo

El primer intento listaba solo los lotes, y **la lista no cuadraba con la tasa**.
`getTasaVentaPonderada()` valora lo que no alcanzan los lotes a la tasa más nueva
conocida — lo ha hecho siempre y está bien— pero esa parte **no se enseñaba**.
Medido con sus lotes del 13/10, una ida de 1.058 R$ a 189:

```
la lista decía ...  196.388 Bs a 1.010,36       →  de las filas sale 1.028,74
la cuenta usaba ..  1.010,36                   ←  con la cola dentro
```

Ahora la cola entra **como una fila más y marcada** —*"3.574 Bs · sin lote, tasa
prestada"*— y debajo un aviso que dice **a qué tasa se están valorando y qué
hacer**: registrar primero la operación de USDT que los trajo. Una fila sola
enseña el número, no que hay algo que registrar.

**La lección, que es la cara B de siempre:** las guardias estructurales dieron
verdes con la lista y la tasa separadas, porque el código decía lo que debía
decir. Lo cazó **ejecutarlo con sus lotes** y restar los dos números.

#### Y un número se escribe UNA vez (ARREGLO 125)

Sus palabras del 13/10: *"no saturar ninguna pestaña"*. Medido el primer intento
con sus lotes: el bloque ocupaba **166 px** para decir **200,76 cuatro veces** —
en las dos filas, en el pie y otra vez en el aviso.

La regla que sale de aquí, y vale para la próxima pantalla: **la traducción por
fila existe para COMPARAR orígenes.** Con una sola tasa no hay nada que comparar
y el pie ya la dice, así que no se escribe; con dos o más sí, en cada fila. El
aviso tampoco repite la tasa: la tiene al lado, en su propia fila.

```
un solo origen   0 en las filas + 1 en el pie     138 px
dos orígenes     2 en las filas + 1 en el pie     se comparan de un vistazo
```

**Y en reposo no ocupa nada.** Medido el alto de **las 21 pestañas** contra la
versión desplegada: **ninguna crece ni un píxel**. El bloque sale cuando ya hay un
monto escrito, y el desplegable del 126 nace cerrado. Lo que ocupa sitio es lo que
ella pidió ver, cuando lo pide.

#### Dos cosas del entorno que costaron, por si vuelven

- **`getTasaCompraPonderada()` tiene el MISMO bucle** y no se tocó: el 125 va del
  dinero que **sale**. Una prueba negativa anclada en `usdt+=usar/tasa;` inyectó
  el fallo en esa otra función y la suite pasó — el ancla tenía que incluir el
  `filas.push`. **Un ancla ambigua convierte una prueba negativa en nada.**
- **`L` ya significa otra cosa en `prestamos.js`** (`_leerNumero`). Una prueba
  nueva que lo reusa como constructor de lotes deja un **número** donde debía
  haber un lote: la prueba corre, no da error y **no prueba nada**. Es la misma
  familia que el ancla ambigua — un nombre tomado no avisa.
- **Un lote con fecha a más de 30 días vista se lee del año pasado** (ARREGLO 51),
  así que unas fechas de prueba `11/10` y `12/10` salieron en orden invertido. No
  era un fallo: es la regla del cambio de año haciendo su trabajo.

### Y quién se comió cada lote (ARREGLO 126)

Sus palabras del 13/10: *"en la parte de inventario, cuando yo hago de bolívares
arriba aparece ahí la adquisición de los bolívares, mas no cuando es de reales
allá a bolívar"*.

Tenía razón y era **asimétrico**: una vuelta **crea** un lote y se ve en el
inventario; una ida lo **gasta** y no se veía en ninguna parte. El dato existía
desde hacía tiempo —cada remesa guarda su `_lotesConsumidos`— pero solo se podía
leer **del lado de la remesa**, y la pregunta que ella hace mirando el inventario
es la contraria: *"estos bolívares, ¿dónde se fueron?"*.

```
Se gastó en 6 remesas · 138,2157 USDT
  #805 · 10/10/26 · YANEISI DEL ROSARIO      8,2657 USDT
  #806 · 10/10/26 · RUDI MARIN              52,8543 USDT
  ...
```

- **Va por ÍNDICE, no por búsqueda.** Con sus ~290 lotes y ~700 remesas,
  preguntarlo lote por lote son 200.000 comparaciones **en cada repintado** — el
  mismo coste que ya hubo que quitar de `getRateToUsdt()`. Se recorre una vez por
  dibujo: medido, **2 ms**. Hay una guardia que exige que `_indiceLotesComidos()`
  se llame **una sola vez** y **fuera** del bucle de lotes.
- **Desplegar no llama a `R()`** (ARREGLO 32): repintar la tabla cierra la fila
  bajo el dedo. Se cambia el `display` por su id.
- **El `colspan` sigue a la TABLA, no a un número escrito a mano.** La guardia
  cuenta las `<th>` de esa cabecera y exige que la llamada pase esa misma cifra:
  si algún día se añade una columna, falla hasta que se actualice.

#### Lo deducido se dice que es deducido

**Las remesas anteriores a este arreglo no guardaron de qué lote salieron.**
`simularConsumoFIFO()` apuntaba `{fecha, tasa, monto}` y ya apunta también el
**id**, pero lo viejo hay que casarlo por **fecha + tasa**, y eso no siempre
distingue. Medido en su export:

```
lotes en total (vivos + cerrados) ....... 367
que comparten fecha y tasa con otro ......  63   (el 17%, el peor grupo con 4)
```

Para esos, las mismas remesas aparecen bajo todos los lotes del grupo. **Se dice
en la propia fila**, en rojo: *"Hay más de un lote con esta misma fecha y tasa, y
estas remesas no dicen de cuál salieron: se reparten entre todos. Las nuevas sí
lo dicen."* Y cuando no hay choque pero tampoco id, se dice más suave: *"Casado
por fecha y tasa"*. Un dato deducido presentado como seguro es peor que no darlo
— es la misma regla que la hora deducida de la apertura (ARREGLO 72), que tampoco
se aplica sola.

**Un lote que nadie gastó no dibuja nada**: ni botón ni fila. Si no, la pantalla
se llena de desplegables vacíos.

#### Y una trampa del método, que costó el trabajo entero una vez

Las pruebas negativas (`neg<N>.py`) **restauran su propia copia de `index.html`
al terminar**. Correr la del 125 después de haber escrito el 126 devolvió el
archivo al estado del 125 y **se llevó por delante el 126 sin avisar** — lo cacó
la suite, que de pronto no encontraba una función recién escrita. **Una prueba
negativa vieja es una máquina del tiempo.** Antes de correr cualquiera, hay que
volver a tomar su copia sobre el estado actual.

### Al borrar, el dinero vuelve al lote QUE SE GASTÓ (ARREGLO 127)

Salió persiguiendo un descuadre suyo del 13/10: las remesas decían haber gastado
**128.805,76 Bs** de un lote de 147.000, así que debían quedar 18.194,24 — y el
lote decía **6.462,84**. Al tirar del hilo aparecieron **dos** fallos en la
devolución, y el segundo lo trajo el arreglo del primero.

**1. Solo se miraban los lotes VIVOS.** Un lote que una remesa deja en cero se
archiva en `inventarioUsdt_cerrado` (lo hace `sincronizarFIFOconCuentas()` al
dibujar Inventario). Al **borrar** esa misma remesa los bolívares no encontraban
dónde volver: **la cuenta sí se corregía y el inventario no.**

**2. Añadir los archivados al reparto "del más nuevo al más viejo" es PEOR que el
fallo.** Todos los archivados están en cero, así que el primero de la lista se
traga la devolución entera. Medido con sus datos antes de darlo por bueno.

**Lo correcto no hay que adivinarlo: cada remesa ya apunta lo que gastó**, en
`_lotesConsumidos`. Se devuelve ahí, lote por lote, por **id** cuando lo hay
(ARREGLO 126) y por fecha+tasa en lo anterior. Lo que no se pueda casar cae al
recorrido de siempre, **solo por los lotes vivos**.

Medido borrando sus remesas reales, código viejo contra nuevo:

```
borrar la #818 (entregó 200.000 de DOS lotes)      viejo        nuevo
  lote 10/12, vivo                                147.000     16.684,60
  lote 10/11, archivado                                 0    189.778,24
  sus tres lotes de compra                              0   50,28 · 42,78 · 78,54
borrar las #819-#822 (un solo lote, vivo)          sin una sola diferencia
```

El viejo metía los 200.000 **enteros en el lote equivocado** y lo llenaba hasta
su tope. Lo de los lotes archivados se perdía del todo.

- **Un lote que recupera saldo vuelve a la lista viva** (`_revivirLote`), y **se
  le quita la marca de borrado**: se la puso el archivado a propósito para que
  la fusión no lo reviviera, y si se queda puesta el otro aparato lo borra en
  cuanto sincronice.
- **El lado de las COMPRAS estaba escrito dos veces**, una por camino del
  borrado — justo lo que el ARREGLO 97 ya evitó en el lado de las ventas. Ahora
  es `_restaurarComprasFIFO()`, y la guardia del calce (ARREGLO 106) vive ahí
  en vez de duplicada.
- **Y se devuelve con los mismos 4 decimales con que se gasta.** `consumir`
  descontaba a 4 y `restaurar` devolvía a 2: borrar y volver a registrar la
  misma remesa no dejaba el lote como estaba.

**Lo que esto NO explica, y hay que decirlo:** su descuadre de 11.731,40 Bs **no
era esto** — su lote seguía vivo. Repasadas todas las líneas que bajan
`bsRestante`, solo quedan el botón ✏️ de editar el restante a mano o un cambio
llegado del otro aparato. **El registro de auditoría vive en su servidor y desde
el entorno de desarrollo no se alcanza**, así que esa parte se queda sin cerrar.


### El borrado devolvía el FIFO y el servidor se lo llevaba (ARREGLO 137)

Lo cazó ella el 13/10: *"acabo de borrar una remesa, se borró, regresó fino a la
cuenta, mas al FIFO no regresó"*. Y tenía razón entera.

**El ARREGLO 127 hacía bien su parte. Moría en el viaje al servidor**, y eso no
se ve desde una sola pestaña. Reproducido en Chromium con su export, borrando la
remesa **#799** (100 R$ → 18.600 Bs), que es la que ella borró:

```
1 · antes de borrar        lote 06/10 archivado en 0
2 · recién borrado         lote 06/10 REVIVE con 19,8847   ✅ el borrado funciona
3 · el servidor contesta   lote 06/10 vuelve a 0            ❌ aquí muere
4 · dibujas Inventario     sigue en 0
```

Son **dos mitades, y las dos eran correctas por separado**:

- las marcas de borrado **se unen y nunca se quitan** (ARREGLO 6c: quitarlas
  revive lo borrado), así que la que `_revivirLote` quitaba aquí volvía del
  servidor y la poda se llevaba el lote otra vez;
- la copia archivada seguía en el `inventarioUsdt_cerrado` **del servidor**, que
  también se une, así que el lote volvía a estar en cero.

De ahí el síntoma exacto: **la cuenta sí volvía y el FIFO no.** La cuenta cambia
el registro, lleva su `_mod` y no tiene marca; el lote se mueve entre dos listas
y la marca decide por él.

**Solo pasa cuando el lote que se gastó YA estaba archivado.** Uno vivo no lleva
marca y sobrevive — medido: 391,88 → 411,76, aguanta la sincronización.

El arreglo **no es dejar de unir** —eso ya costó una vez—: es que la marca pueda
decir *"esto se levantó, y CUÁNDO"*. Con la hora dentro, la unión decide sola y
manda lo último que pasó, como en todo lo demás.

- **Una marca se LEVANTA, no se borra** (`_levantarBorradoMerge`, con `revive`).
  Lo que no está no le gana a nada. `_olvidarBorradoMerge` se retiró; su único
  llamador —reabrir un mes— tenía el mismo agujero entre dos aparatos.
- **La unión se queda con la MÁS NUEVA, no con la primera**
  (`_unirMarcasBorrado`), y está escrita **una vez**: la usan la respuesta de la
  API y la importación de un archivo, que tenían cada una su copia decidiendo
  por orden.
- **Revivir son DOS mitades y faltando cualquiera vuelve el fallo**: levantar la
  marca del vivo **y** enterrar la copia archivada. Hay una prueba negativa por
  cada una, porque pidiendo solo la primera la otra se podía quitar.
- **Y archivar hace el camino de vuelta.** Un lote que revivió lleva su copia
  archivada enterrada; sin levantar esa marca al archivarlo, no podría volver al
  archivo nunca más.
- **Enterrar y levantar dentro del mismo milisegundo deja un EMPATE**, y en un
  empate no se sabe cuál mandó. Las dos escrituras se fuerzan estrictamente por
  encima de lo que hubiera. Lo cazaron las pruebas, que corren las dos seguidas.
- **`_marcarBorradoMerge` reemplaza la entrada del mismo id.** Antes hacía
  `push` a secas, así que enterrar algo levantado dejaba **dos** entradas y
  `_estaBorradoMerge` contesta con `some`: mandaba la que no llevaba
  levantamiento, y el levantamiento no se podía deshacer nunca.
- **La huella que decide si hay que guardar tiene que VER el levantamiento.**
  Mirando solo el id, levantar una marca no cambiaba nada y el guardado no
  salía: el arreglo se quedaba en el aparato.

**La lección, y es la del ARREGLO 121 y la del 91 otra vez:** las guardias
estructurales del 127 dieron verdes porque el código decía lo que debía decir.
Lo cazó ejecutar el **ciclo entero** —borrar, guardar, adoptar la respuesta— en
Chromium. **Cuando un arreglo toca algo que se SINCRONIZA, hay que hacerle dar
la vuelta al servidor**, no probarlo en una pestaña sola.

#### Y por fin se puede devolver a mano lo que un borrado no devolvió

La tabla 📦 Archivados era de **solo lectura** —ni ✏️ ni 🗑️— así que un lote al
que le faltaba lo suyo no se podía reparar desde la app. Y el arreglo de arriba
**no lo repara**: vale de aquí en adelante, y la remesa que sabía cuánto se había
gastado ya no existe.

Lo que ella tuvo que devolver por su borrado del 13/10:

```
lote del 06/10 · compra BRL a 5,028    →  19,8847 USDT
lote del 07/10 · venta  VES a 995,50   →  18.600,00 Bs
```

- **NO mueve ninguna cuenta, y se dice en la propia pregunta.** El dinero del
  banco ya volvió al borrar la remesa; lo roto es el inventario, que es de donde
  salen las tasas que la app sugiere. Tocar la cuenta aquí la subiría dos veces
  por el mismo dinero. Hay una guardia que lo prohíbe por nombre.
- **No se puede devolver más de lo que el lote fue.** Inventarle saldo a un lote
  le cambia la tasa que la app sugiere.
- **El hueco se calcula en UN sitio** (`_huecoDeLote`): lo leen el botón que se
  dibuja y la función que devuelve. Calculado aparte, un día el botón saldría
  sobre un lote que no admite nada.
- **Y el botón va en la PRIMERA columna, que no es estética.** Esa tabla mide
  560 px de ancho mínimo y hace scroll horizontal; en su teléfono son 412, así
  que al final quedaba **fuera de pantalla** y había que arrastrar la tabla para
  encontrarlo. Medido en Chromium, y es el único camino para reparar un lote:
  escondido tras un arrastre no existe.

Probado pulsándolo de verdad en Chromium con su export: 361 botones para los 361
lotes archivados con hueco, el prompt y el confirm con sus tres números, el lote
pasa a vivo con 19,8847, sale del archivo, las dos marcas quedan al derecho, el
tope avisa y no mueve nada, y **el Banco de Venezuela no se movió ni un céntimo**.
29 pestañas, 0 errores.

---

### 1 USDT vale 1 USDT, y eso no hay que ir a buscarlo (ARREGLO 144)

Salió de una pregunta suya del 15/10: *"recibí 40 USDT y di 200 reales, no sé
cómo preguntar eso"*. Un cliente le mandó USDT y ella le entregó reales.

**La ruta ya existía** —`USDT ↔ BRL`, en sus rutas extra, usada el 29/06 con
320 USDT → 1.590 R$— pero las dos tasas de `getAutoRates()` salen de los lotes
del inventario, y **un lote de "compra de USDT pagando en USDT" no existe ni va
a existir**: no se compra en Binance lo que el cliente ya mandó. Así que la tasa
venía `null`, y de ahí salían **tres** fallos a la vez. Medido en Chromium con
su export sobre 40 USDT → 200 R$:

```
sin escribir la tasa a mano .... cTx se sale por su return → GANANCIA 0
escribiéndola (1) .............. apunta 0,1999 donde son 0,2599   −23%
y en los dos casos ............. saveTx deja DOS lotes en blanco por remesa
```

El primero es el que más caro sale: la remesa **se guarda con `pr` 0** y nada
avisa. El segundo es el ARREGLO 42 al revés — `tcDeLote` mira de **dónde salió**
el número, no si la operación existió, así que escribirla a mano reactivaba una
comisión de Binance que en esa ruta **nadie pagó**.

**Los tres salen del mismo sitio, así que se arreglan en el mismo sitio.** La
tasa de USDT contra USDT es **1 por definición**: no es algo que medir ni una
decisión suya, es la unidad en la que está escrito todo lo demás.
`tasaDeReferencia()` ya lo decía así desde hacía tiempo (`if(moneda==="USDT")
return {tasa:1}`); lo que faltaba era decirlo también en `getAutoRates()`, que
es **la puerta por donde pasan `cTx()` y `saveTx()`**.

- **Va en los DOS lados.** `USDT ↔ BRL` y `USDT ↔ VES` entran en USDT;
  `BRL ↔ USDT` sale en USDT. Las tres son suyas y están en uso.
- **Y el rescate de `dest!=="VES"` tiene que dejarlo en paz.** Ese bloque busca
  lotes de **compra** del destino cuando no hay de venta; con destino USDT no
  hay ni unos ni otros, así que volvía a dejar la tasa en `null`.
- **Sin operación en Binance no hay comisión de Binance**, y eso va en `cTx()`,
  no solo en la tasa: por lo de `tcDeLote`, escribirla a mano la traía de vuelta
  — y escribirla a mano es justo lo que ella ya hacía. Las dos líneas van
  **después** de la regla general, o no hacen nada.
- **Lo ya guardado no se mueve.** La ganancia del mes suma el `pr` que cada
  remesa lleva dentro; no lo recalcula. Hay guardia para los tres arrays y para
  que `calcMesCompleto` no llame a `cTx`.

Medido con su export, el ciclo entero por la ruta USDT→BRL:

```
                        v225                    v226
la tasa                 hay que escribirla      sale sola (1,00)
ganancia apuntada       0  ·  ó 0,1999          0,2599
lotes nuevos            2 en blanco             0
cuentas                 +40 USDT · −200 R$      igual
sin explicar (913,16)   no se mueve             no se mueve
```

**Y 17 casos de las rutas normales salen idénticos** a v225 —BRL↔VZLA, VZLA↔BRL,
UU.EE↔VZLA, USD↔BRL, PEN, COP, EUR, más las tasas sueltas que usa el resto de la
app—, que es lo que prueba que esto no toca nada más. 20 pestañas, 0 errores,
7 pruebas negativas y las 7 cazadas.

**Lo que esto NO arregla, y es correcto que no:** el aviso de *"no hay saldo
suficiente en el inventario FIFO · faltan 40,00 USDT de compras en USDT"* sigue
saliendo. En esta ruta es cierto y es normal —esos USDT no vinieron de ninguna
compra suya— y el aviso no decide nada: se confirma y sigue.

### El método de la remesa sale del INVENTARIO, no de su memoria (ARREGLO 138)

Sus palabras del 14/10: *"para seleccionar la ganancia es automático según lo que
tenga en inventario: si solo tengo por venta y compra de USDT salga por ahí, si
solo tengo porque me pagaron Bs solo salga eso, y si es mixto según el orden de
cómo se debe descontar… porque así como está tengo que ir a inventario para ver
por dónde es que tengo esos Bs"*.

**Y no es comodidad: los dos métodos no son dos formas de contar lo mismo.** El
calce no paga la comisión de Binance porque no pasa por Binance. Elegirlo cuando
sí hubo que vender USDT apunta una ganancia que no tuvo.

**De dónde vino un lote lo dice `origenRemesa`, NO la marca `permuta`.** Medido
en sus 174 lotes de VES, y es lo que salvó este arreglo de nacer torcido:

```
origenRemesa lleno  →  se los pagaron (una vuelta, o un cruce)    24 lotes
origenRemesa vacío  →  salieron de vender USDT                   150 lotes
```

De esos 24, **solo UNO lleva `permuta:true`** —el resto son vueltas normales, con
plataforma `"Remesa"`— así que mirando la marca se acertaría en 1 de 24. En los
174 la regla no falla ni una vez.

**Y el caso mixto casi no existe en su operación.** De sus 330 remesas que se
pueden rastrear por su espejo de lotes:

```
solo de ventas de USDT ........ 306
solo de bolívares que le pagaron  24
MIXTAS ........................   0
```

Por eso manda la mayoría y se dice, en vez de partir la ganancia por lote: eso
tocaría `cTx()`, de donde sale todo, y cambiaría los números que ve hoy por un
caso que nunca le ha pasado.

- **El origen se calcula en UN sitio** (`_origenBsRemesa`, sobre `_repartoFIFO`):
  lo leen el método que se marca solo **y** la línea que lo explica. Calculado
  aparte, un día la app marcaría *calce* con la línea de debajo diciendo que
  salen de una venta de USDT.
- **Lo que no sale de ningún lote no decide**, y cae del lado de **P2P** — el
  caso normal (306 de 330) y además el que **sí** paga la comisión. Ante la duda,
  el que no infla la ganancia.
- **Si ella pulsa el botón, manda lo suyo y la app no se lo vuelve a mover.**
  Puede haber un calce de verdad que el inventario no sepa. Misma regla que el
  campo de la permuta, que se rellena solo pero no pisa lo suyo (ARREGLO 123).
- **Y se marca al SALIR del campo, no en cada tecla.** Cambiar el método rehace
  el bloque 3 entero —los campos de la permuta aparecen y desaparecen— y con el
  dedo dentro de un campo eso lo mata (ARREGLO 32). Mientras teclea no se queda
  muda: la línea de *"de dónde salen"* se refresca en `upC()` y ya dice qué
  método va a salir.
- **La fila dice de dónde vino cada parte.** Antes solo se marcaba el lote con
  `permuta:true`, o sea 1 de los 24: los otros 23 salían sin distintivo, igual
  que una venta de USDT — y eso es justo lo que ella tenía que ir a mirar.

Medido en Chromium con su export, los cuatro casos: solo ventas → P2P; todo de
vueltas → calce, con la permuta rellena sola (200,72); mixto 3.000/6.350 → P2P
diciendo la proporción; y pulsándolo ella, la app no se lo mueve. 29 pestañas,
0 errores.

#### Y un error mío que ninguna guardia habría cazado

Al añadir el `onchange` me comí la comilla que cerraba el `oninput`, y el HTML
quedó así dentro del mismo atributo:

```
oninput='S.tx.am=_num(this.value);upC("tx") onchange='_autoMetodoTx()'>
```

El archivo seguía siendo JavaScript válido, así que `revisar.py` pasaba y las
guardias de texto también. **El monto dejaba de guardarse**: el campo enseñaba
50 y `S.tx.am` se quedaba vacío. Solo se vio **tecleando en el navegador**. Hay
guardia para ese patrón exacto y una prueba negativa que lo reinyecta.

Es la lección del ARREGLO 121 y del 136 por tercera vez: **cuando un arreglo toca
un campo donde ella escribe, hay que escribir en él.**
#### Detectaba, pero no se veía — y se comía el primer toque (ARREGLO 152)

Sus palabras del 16/10: *"he estado por registrar remesas y no hay una
diferencia, el sistema como que no detecta que el lote es el que voy a descontar
y no detecta si es por P2P o si es por transacción directa"*.

**Detectar, detectaba.** Medido en Chromium con su export: forzando lotes de
vuelta, la app marca sola 🤝 Calce directo y rellena la permuta en 204,03. Lo que
fallaba eran tres cosas, y las tres se juntan para que desde fuera parezca que la
app no hace nada.

**1 · Con sus lotes no puede salir calce, y eso no es un fallo.** El FIFO gasta
primero las ventas de USDT, y el lote de vueltas no le llega:

```
10/14    950 Bs   venta de USDT
10/14 33.278 Bs   venta de USDT
10/15 21.000 Bs   TE PAGARON        ← 21.000 nunca le gana a 34.228
```

Así que siempre sale **P2P**, que además es lo que ya estaba marcado por omisión.
La app decide en cada remesa y decide bien; lo que pasa es que decide lo mismo
que había, y **nada en la pantalla decía que había decidido**.

**2 · El rótulo llamaba "ventas de USDT" a lo que no lo era.** Lo cazó ella
sumando las filas, que es exactamente para lo que están:

```
la línea decía ...  21.000 que te pagaron y 73.500 de ventas de USDT
las filas dicen ..  34.228 de ventas · 39.272 sin lote
```

La **decisión** no cambia —lo que no se sabe de dónde vino sigue contando del lado
de P2P, que es el que sí paga comisión: ante la duda, el que no infla la
ganancia— y por eso se queda en `_origenBsRemesa`. Lo que cambia es que cada monto
se llama por su nombre: *"En total: 21.000 Bs que te pagaron · 34.228 de ventas de
USDT · 39.272 sin registrar"*. **Un número con el rótulo de otro es lo que enseña
a no fiarse del resto de la pantalla.**

**3 · Y el primer toque a 💾 Guardar se perdía.** El `change` de un campo salta
cuando ella toca otra cosa, y esa otra cosa suele ser el botón de guardar. El
orden del navegador es `mousedown → blur → mouseup → click`, así que el `R()` que
había ahí borraba el botón **entre el mousedown y el mouseup** y el click no
llegaba a dispararse. Medido en Chromium con touch:

```
                      antes (v232)        ahora (v233)
primer toque     cambia a calce, NO guarda    GUARDA
segundo toque           guarda            (ya no hay botón)
```

Desde fuera eso es *"el botón no hace nada la primera vez"*, y **enseña a tocar
dos veces un botón que mueve dinero**.

Lo que lo sostiene, y son tres mitades —faltando cualquiera vuelve el fallo:

- **El bloque 3️⃣ vive en su propio contenedor** (`sec3-tx`), y el botón de guardar
  vive FUERA. Así se puede rehacer lo que cambia con el método sin llevarse por
  delante el botón.
- **El HTML de ese bloque sale de `rNueva()`**, la misma función que lo dibuja.
  Escrito aparte, un día el bloque repintado diría algo distinto del dibujado.
- **Y una bandera del gesto** (`_txTocaGuardar`, en el `pointerdown`, que ocurre
  antes del blur): con el dedo ya puesto en Guardar, el método se aplica y **no se
  dibuja nada**. Repintar ahí cambia el alto del bloque y **mueve el botón bajo el
  dedo** — eso fue lo que falló en el primer intento, con el contenedor ya hecho.

**Y el método se decide al TECLEAR, no al salir del campo.** Esto **revierte** la
regla que dejó escrita el ARREGLO 138 (*"en cada tecla mataría el campo"*): era
cierta cuando esto llamaba a `R()`, y dejó de serlo con el contenedor, porque el
campo del monto está **fuera** de lo que se repinta. Con un respiro de 450 ms, el
método ya está puesto antes de que ella baje el dedo al botón, y el bloque no
cambia de alto en ese momento. Medido: a los 700 ms de teclear "500", el botón se
marca solo, la permuta se rellena, **y el foco sigue dentro del campo con su 500**.

**Lo que esto NO arregla, y es lo que más le cambia los números:** de los 94.500 Bs
que entrega con 500 R$ a 189, **39.272 no salen de ningún lote**. La app los valora
con la tasa del último lote conocido porque no tiene otra, así que la ganancia de
esa remesa sale de una tasa prestada. **Arreglar el rótulo hace que ese hueco se
vea; cerrarlo es registrar las ventas de USDT que faltan.**

---

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

1. La que ella **escribió a mano** (`_tasasDiaMeta[mon]`), **y solo mientras sea
   más nueva que su última operación de USDT de esa moneda** (ARREGLO 131 — aquí
   decía "es una decisión suya, no un olvido: manda", y lo revirtió ella).
2. La **última operación de USDT de esa misma moneda** — compra o venta,
   mirando también `inventarioUsdt_cerrado`, con `_tasaEfectivaLote()`.
3. Lo último que escribió, aunque fuera antes.
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

### Las dos tasas al cliente se escriben igual y significan lo contrario

Sus palabras: *"todas esas casas de cambio todos los días tengo que revisar para
poder colocar mi tasa"*.

Las dos direcciones se publican en **bolívares por real**, la misma unidad —así
las lee ella en los flyers— pero dicen cosas opuestas:

```
ida    (R$ → Bs)   ella ENTREGA bolívares → cuantos MÁS dé, mejor para el cliente
vuelta (Bs → R$)   ella ENTREGA reales    → cuantos MENOS pida, mejor para el cliente
```

Medido en su export: ida **172,5** (200 R$ → 34.500 Bs, 674 operaciones) y vuelta
**220** (42.500 Bs → 193 R$, 117 operaciones). Coincide con su flyer.
**Invertir una de las dos le daría el puesto al revés**, que es justo lo que la
haría publicar una tasa mala. `pruebas/prestamos.js` lo fija con sus números del
26/09.

**Su vuelta alta es una DECISIÓN, no un descuido.** Está 20 Bs por real por
encima de los otros dos que la publican, y es a propósito, por dos razones que
dio ella:

- le **frena la entrada de bolívares**, que parados se devalúan;
- y le cubre el **P2P que tiene que hacer** cuando entra una vuelta grande y no
  tiene reales: con esos Bs compra USDT y lo vende por reales, y ese paso cuesta.

Sus palabras: *"en eso no puedo perder por no tener el capital en reales"*.

**Y lo que eso implica para el futuro:** con más volumen ese costo desaparece
solo. Una vuelta que entra el mismo día que una ida del mismo tamaño **se cruzan
entre ellas** y no toca Binance — la brecha entera se queda. Lo dijo así:
*"si más adelante tengo más movimiento eso puede cambiar… y no hacer el p2p"*.
O sea que su tasa de vuelta no debería ser un número fijo: depende de si puede
cruzarla. **La app tiene los saldos, así que lo puede saber.**

Por eso la pantalla **dice dónde está, no la corrige**. Marcarle la vuelta en
rojo sería opinar sobre su negocio con la mitad de la información.

### Y el mensaje que le manda al cliente se escribe para el CLIENTE (ARREGLO 92)

Sus palabras: *"yo necesito que la respuesta sea como más fácil de entender al
usuario y no tanto del punto de vista mía, que ya conoce el sistema, porque
muchos me quedan como en duda"*.

El conversor copiaba esto:

```
💱 100,00 BRL = 17.300,00 VES ≈ 19,85$ BCV
Tasa: 1 BRL = 173,00 VES
```

Es correcto de números y es **una ecuación, no una instrucción**. Cuatro cosas
que confunden a quien no conoce el sistema:

- **No dice quién paga y quién recibe.** `100 BRL = 17.300 VES` se puede leer al
  revés —que le llegan 100 reales— y no hay nada en el texto que lo impida.
- **`BRL` y `VES` son códigos de banco.** El cliente dice *reais*/`R$` y
  *bolívares*/`Bs`.
- **El `$ BCV` iba con el mismo peso que lo demás y NO es lo que llega.** Nadie
  recibe dólares: es una referencia. Ahora se dice con las palabras que eligió
  ella — *"según el dólar del Banco Central de Venezuela"*.
- **Las dos tasas se escribían sin nada que las emparejara** —`Tasa: 1 BRL =
  173,00 VES` en un sentido y `Tasa: 220,00 VES = 1 BRL` en el otro—. Lado a
  lado, 173 y 220 parecen contradecirse, o parece que subió el precio.

Ahora las dos llevan el **mismo rótulo**, *"Tasa del día"*, y lo que el cliente
**manda** va nombrado primero arriba: la dirección se lee sola.

```
💱 Cambio de hoy

Tú envías: R$ 100,00
Tú recibes: Bs 17.300

Tasa del día: 1 R$ = 173 Bs
Equivale a unos 19,85 $ según el dólar del Banco Central de Venezuela
```

**La redacción de esa línea la dictó ella**: *"debe decir tasa del día
1R$ = 173 Bs"*. La de vuelta va en su sentido —`Tasa del día: 220 Bs = 1 R$`—
con el mismo rótulo. Se propuso *"Por cada R$ 1 recibe Bs 173"* y lo descartó:
es su mensaje y sus clientes.

- **Son DOS botones**, y lo pidió ella: el **corto** se para después de *"Tú
  recibes"* —para el cliente que ya sabe la tasa y solo pregunta el monto— y el
  **completo** añade la tasa y la referencia.
- **Los dos rótulos los eligió ella**: *"tú envías y tú recibes, así sería
  mejor"*.
- **De qué lado va cada moneda lo decide UNA bandera** (`mandaVes`), no dos
  líneas escritas por separado: si se escribieran aparte, un día diría que el
  cliente manda y recibe la misma moneda.
- **Los reales llevan centavos y los bolívares no.** `_convDesde()` ya redondea
  los bolívares a entero, así que ese `,00` era ruido en todos los mensajes.

**Ojo con la regla del ARREGLO 74**, que sigue mandando por dentro: las dos
tasas se guardan y se comparan en **bolívares por real**, la misma unidad, y
significan cosas opuestas. Lo que cambió es **cómo se le cuentan al cliente**,
no cómo se calculan. Invertir una de las dos en el código le daría el puesto al
revés en los flyers.

#### Y la cotización lee la tasa que ELLA elige — y lo dice (ARREGLO 117)

Sus palabras: *"tienes que hacer que también la parte de cotización al cliente lea
también la tasa que yo elija"*.

**El número ya la leía.** Medido antes de tocar nada: publica 201 en la cabecera y
el conversor pasa de 188 a 201. Lo que estaba mal era todo lo de alrededor, y eso
sí la hacía cotizar con otra tasa sin enterarse.

- **El rótulo mentía, siempre.** Decía *"la que pusiste en Configuración → Tasas
  del día (BRL → VZLA, ida)"* pasara lo que pasara. Desde el ARREGLO 110/111 ella
  no la pone ahí: la pone en la cabecera de Tasas o con *"publicar esta"* en la
  calculadora. Y lo decía **también cuando el número venía de un override
  tecleado en el propio conversor**. Ahora el número y su rótulo salen del
  **mismo sitio** (`_origenTasaCotiza`): es la regla del 34,27 contra 34,28
  aplicada a un texto.
- **El override era pegajoso, invisible y sin vuelta.** El campo de la tasa era
  editable a secas: tecleaba 150, el conversor cotizaba a 150 **para siempre**
  con la publicada en 201, nada lo decía y no había botón para volver. **Eso es
  "no lee la tasa que yo elijo".** Ahora la publicada se enseña y no se teclea;
  salirse hay que pedirlo (*"otra tasa solo para esta cotización"*), y mientras
  esté puesta se ve en ámbar con **los tres valores**: a qué cotiza, cuál es la
  publicada y el botón de volver. Mismo patrón del ARREGLO 116.
- **Y había que tocar DOS veces para abrirlo.** El 111 lo metió en una fila que ya
  se abre y se cierra, y dejó dentro el acordeón viejo (*"📡 Conversor rápido — ▼
  toca para abrir"*). Se quitó el viejo (ARREGLO 98, otra vez).
- **La cifra grande se refresca en vivo, por su id.** Repintar la fila mata el
  campo bajo el dedo (ARREGLO 32) y no repintar nada deja arriba la tasa anterior
  (ARREGLO 55): medido, escribía 150 abajo y arriba seguía leyéndose 201.

**La vuelta NO se presta de la ida.** `_getTasaVueltaVESaBRL()` acababa en
`return _getTasaClienteBRL()`. Las dos se escriben en bolívares por real y
significan lo contrario (ARREGLO 74): con la ida de 188 puesta de vuelta, a un
cliente que trae bolívares le entregaría **más reales de los que toca** —su vuelta
real es 210— y perdería en cada operación. Es la misma regla que ya prohibió
prestarle la tasa del bolívar al sol y al peso.

Y entonces **el mensaje al cliente no se arma**: medido, decía *"Tú recibes: R$
0,00"*, que un cliente lee como que no recibe nada. Dice qué falta y dónde
publicarla.

**Y la tasa publicada se escribe por UNA puerta.** Había **cinco** sitios
escribiendo `tdia_brl`/`tdia_ves_brl` y solo dos pasaban por
`guardarTasaCalcHoy()`, que es quien sella `tdia_fecha` y limpia el override:

```
cabecera de Tasas .................... pasaba ✔
"publicar esta" de la calculadora .... pasaba ✔
Configuración → Tasas del día ........ NO
Balance de Cuentas → "calculadora
  de tasa para publicar" (💾 Usar hoy)  NO
el override del conversor ............ no escribía: tapaba
```

Lo que costaba: publicando desde los dos de abajo, `tdia_fecha` se quedaba con la
del último día que usó la cabecera, así que el aviso del ARREGLO 112 —*"tu suelo
se movió un X% desde que publicaste"*— **medía desde una fecha que no era la de
esa tasa**. La guardia cuenta las escrituras y exige **tres y solo tres**: las dos
claves de la puerta y la del ternario de `_setTasaPub`, que es la cabecera
escribiendo mientras ella teclea.

**El flyer sigue con la publicada, no con la cotización suelta.** Lo que sale
HACIA FUERA no puede llevar un número de un caso puntual (misma regla del 85 y el
116), y la fila del flyer lo dice al lado: *"saldrá con ida 188,00"* mientras el
conversor cotiza a 177,50.

**Y ocho campos de dinero se comían la coma.** Los tres montos del conversor y los
cinco de Configuración eran `type="number"`. Se pasaron a texto **y se arregló su
lector en la misma pasada** —`_leerNumero()`—, que es la mitad que no se puede
dejar a medias: en texto con un `parseFloat` detrás, `1.500,50` se lee **1,5**.

#### Y la RESPUESTA de la calculadora también se publica (ARREGLO 118)

Sus palabras del 12/10, con la pantalla delante: *"por más que edite los números en
la parte de abajo para cuadrar la tasa, en la pestaña principal de arriba, que es
la que lee el flyer, nada que cambia — sigue estático 188 210"*.

**Y no era que no cambiara: es que no había por dónde.** El ARREGLO 116 puso
*"publicar esta"* solo en los campos que **ella escribe**. Reproducido con sus
números —monto 500, ida 189, meta $20, cruce—:

```
modo Tasa de vuelta → "CÓBRALE AL MENOS 236,64"   sin botón de publicar
modo Tasa de ida    → "NO DES MÁS DE 167,73"      sin botón de publicar
la cabecera                                       188 · 210, intacta
```

O sea que el único número que esta calculadora existe para darle era justo el que
no podía llegar al flyer: había que leerlo, acordarse, subir y teclearlo.

- **El botón va debajo del número grande**, que es donde ella lo está mirando, y
  publica por la puerta única del ARREGLO 117 (sella la fecha, limpia la tasa
  suelta del conversor).
- **La respuesta sale de UN sitio** (`_cgTasaResultado()`), que leen la pantalla
  que la dibuja y el botón que la publica. Calculada aparte en el botón, bastaría
  un redondeo distinto para publicar un número que no es el que ella ve.
- **Y publicar SOLO la respuesta deja un par que no da la cuenta.** La vuelta de
  236,64 se despejó con la ida de 189 que ella tecleó; con la ida publicada en 188
  esa pareja ya no gana los $20. Por eso sale el segundo botón —*"publicar las
  dos"*— y se dice por qué. Callarlo sería darle una tasa que no cumple lo que
  acaba de leer.
- **En modo *Ganancia* no sale botón:** ahí la respuesta son reales, no una tasa.

**Lo que NO se hace, y es a propósito: que la cabecera siga sus teclas sola.**
Publicar escribe la tasa que leen el flyer, el conversor y cada remesa nueva;
siguiendo el tecleo, empezar a escribir "236" publicaría un **2**. Un toque, no
cero.

**Y el tope dice de qué dirección habla.** El pie ponía *"Tu tope es 210,00 Bs por
real… por encima pierdes"* justo debajo de una **vuelta de 236,64**, y eso se lee
como que esa vuelta está en pérdida. El tope es de la **ida** —cuántos bolívares
puede dar por real— y en la vuelta es al revés: cuantos más pida, mejor para ella
(ARREGLO 74). Dos números en la misma unidad que significan lo contrario necesitan
que el rótulo diga de cuál habla.

#### Y la calculadora abría en el modo que más promete (ARREGLO 121)

Sus palabras del 12/10: *"me hace un cambio de mil real y lo que le dan no son
$10, o sea no entiendo"*. Y detrás, lo que de verdad pedía: *"yo quiero que el
sistema me diga: mira, me tienes que vender según el mercado a tal tasa de
bolívares para que tú tengas una ganancia de tanto"*.

La fila 🧮 abría en **Cruce**. Con su tasa de 189 sobre 1.000 R$, medido:

```
Cruce   $28,00     ← lo que leía
P2P     $10,81     ← lo que de verdad ganó (la remesa dio $10,50)
Mitad   $19,40
```

Los tres son correctos —cruzando, los bolívares los pone un cliente de vuelta y
no toca Binance, así que le queda la brecha entera— pero sus bolívares de ese día
salieron de comprar USDT. **Lo que estaba mal no era la cuenta: era cuál sale
sola.** Es la misma regla por la que el suelo que manda es el **más bajo** de los
dos (ARREGLO 77): por ningún lado le puede salir el número optimista.

- **El campo "Monto del cliente" se fue, y no por sitio: es que no cambia nada.**
  Medido pidiendo $10 por cada 500: 500 R$ → 178,70, 1.059 → 178,70, 2.000 →
  178,70. La cuenta entera es proporcional, así que el campo solo multiplicaba la
  respuesta por un número que ella tecleaba cada vez. **La base son 500 reales**
  (`CG_BASE`) y así la respuesta se puede seguir en el tiempo: *"gano 5,40 por
  cada 500"* se compara entre días, *"gano R$ 54,39"* no dice nada sin saber sobre
  cuánto.
- **Un número, no cuatro.** Salía `R$ 54,39 · $10,81 · margen 5,44% · 10.870 Bs`,
  y ninguno en USDT por operación, que es como se lo cuenta la cabecera de la app,
  el Diario, el Cierre y cada remesa. El *margen %* además se parecía al *+5,4%*
  de la cabecera de Tasas **sin ser lo mismo** —ése se mide contra el suelo, éste
  contra lo que entra—, que es el peor tipo de repetición: dos números casi
  iguales que no son el mismo. **La línea de debajo se queda**, porque un número
  que no dice de dónde sale hay que perseguirlo aparte y entonces la pantalla no
  ahorra nada.
- **La otra palanca, que es la que pidió primero.** Para ganar más hay dos
  caminos y la app solo enseñaba uno: bajarle la tasa al cliente. El otro es no
  tocársela y **vender su USDT más caro en bolívares**, y es el que no le cuesta
  clientes. Sale de la **misma K**, no de una fórmula aparte: si con la ida `I`
  gana la meta, con la que ya publica la gana cuando `K' = I·K/idaPub`; de ahí se
  despeja el suelo que haría falta, y la venta se escala en línea con él — **no se
  vuelve a aplicar la comisión aquí**, que sería la segunda respuesta a la misma
  pregunta con otro redondeo. En cruce puro no se dibuja: ahí no hay venta que
  subir.
- **Los tres botones de origen se quedan.** Ese mismo día hizo una mezcla de
  verdad: 147.000 Bs de una vuelta y el resto de un lote comprado.

#### Y una variable que no existía, en producción (ARREGLO 121)

El ARREGLO 119 dejó `pasada` escrita en **dos** sitios y declarada en ninguno, y
`limTj` en uno. **Inventario USDT y Configuración tiraban un `ReferenceError` y
se quedaban en blanco** para cualquiera que tenga una tarjeta — ella la tiene.

No lo cazó ninguna guardia **porque todas miran que el texto diga lo que debe
decir, y el texto lo decía**. Lo cazó el barrido de las pestañas en Chromium. Es
la lección del ARREGLO 91 otra vez: una guardia estructural comprueba que el
código dice lo que debe, no que el camino funcione. **Cuando un arreglo toca lo
que se DIBUJA, hay que dibujarlo.**

El dato correcto es `isNeg`, que en una tarjeta es exactamente *"te pasaste del
límite"* (`_saldoConProblema`, la puerta única del 119). Y queda una guardia que
exige que **las cuatro variables de la tarjeta estén declaradas en la función que
las usa** — vale para la siguiente que alguien añada, no solo para `pasada`.

#### Las banderas estaban bien; lo que fallaba era el rótulo (ARREGLO 122)

Sus palabras del 12/10, con las dos pantallas delante: *"revisa el tema de las
banderas en ambas direcciones, no sé si está correctamente expresada de Brasil a
Venezuela, de Venezuela a Brasil con respecto a lo que yo coloco abajo y las
banderas que están arriba"*.

Comprobado en sus dos capturas: los dos sentidos salen **correctos**. En *Tasa
🇻🇪→🇧🇷* responde 210,01 (*Venezuela → Brasil*, ella entrega reales) y en *Tasa
🇧🇷→🇻🇪* responde 193,49 (*Brasil → Venezuela*, ella entrega bolívares), y el pie
lo escribe entero. Lo que fallaba era otra cosa:

- **La cabecera seguía diciendo "TU IDA" y "TU VUELTA".** El ARREGLO 119 sacó esas
  dos palabras de la calculadora —son mi vocabulario, no el suyo— y las dejó en la
  pantalla de justo encima. Arriba una cosa, abajo otra, y nada que las empareje.
  Ahora la cabecera lee de `_ruta()`, la misma tabla, y debajo de cada número dice
  **quién da qué** (*"le das"* / *"te dan"*), que es lo único que el símbolo no
  dice.
- **El botón y el campo se escribían igual.** `Tasa 🇻🇪→🇧🇷` arriba (lo que pides)
  y `Tasa 🇧🇷→🇻🇪` justo debajo (lo que escribes), sin nada que diga cuál es cuál.

#### El monto vuelve: la TASA no depende de él, los DÓLARES sí (ARREGLO 122)

El ARREGLO 121 lo quitó diciendo que *"no cambia nada"*, y eso es cierto **para la
tasa** —500, 1.059 o 2.000 R$ dan la misma— y **falso para lo que ella mira con un
cliente delante**. Sus palabras: *"a veces yo quiero saber cuánto me voy a ganar
por 1000, por 2000, por el monto que yo quiera… si un día me quiere mandar 9000
reais yo puedo calcular, bueno, le puedo ofrecer tanto y no pierdo"*.

Vuelve **con 500 ya escrito**, que es la diferencia con antes: no hay que teclearlo
para usar la pantalla, solo para salirse de su medida de siempre. La base sale de
`_cgBase()` y de ningún otro sitio —la leen el resultado, el despeje de la tasa y
la comparación— y **en blanco vuelve a 500, no a cero**.

#### Y el precio de dar otra tasa, escrito (ARREGLO 122)

Sus palabras: *"si yo estoy dando una tasa diferente a la que supuestamente me da
el sistema, me diga: bueno, a esta tasa le estás ganando tanto, o a esta tasa
estás menos tanto"*.

La pantalla contestaba **una** tasa y ahí se acababa. Pero la que ella da no
siempre es esa, y el precio de esa decisión había que sacarlo cambiando el número,
mirando, y volviéndolo a cambiar. Ahora, en los tres modos:

```
A 189,00 ganas $97,26 por cada 9.000 R$
$161,05 MENOS que a 171,00 (🇧🇷→🇻🇪 publicada)
```

- **La ganancia sale de `_cgGanUsdt()`**, que sale de `_calceGan()`: las dos líneas
  que se restan pasan por la misma cuenta. Calculadas aparte, un redondeo distinto
  haría que la resta no cuadrara con sus dos sumandos.
- **Dos tasas iguales, o una diferencia de cero, no escriben nada.** Un *"$0,00
  MÁS"* es ruido, no un dato.
- **Y cada lado entra con SU K.** Lo cazó medirlo: en el modo de la vuelta el
  segundo lado se calculaba con la K de la vuelta que ella **tecleó** (215) y el
  rótulo decía *"que a 210,15"*, la despejada. Con sus números la diferencia salía
  **1,98** donde son **4,00**. Un número con el rótulo de otro es el 34,27 contra
  el 34,28, y sólo se ve ejecutándolo.

### La tarjeta que contesta "¿qué publico hoy?" (ARREGLO 128)

Sus palabras del 13/10: *"se me es muy difícil poder decidir qué tasa tengo que
ofrecerle a mi cliente día a día o cualquier hora del día según el mercado, de
verdad que no sé si gano plata o pierdo plata, no sé cómo hacer hoy y amanecer y
saber qué tasa debo publicar"*.

**La app tenía todas las piezas y ninguna respuesta.** El suelo en una tarjeta,
el margen en otra, los avisos sueltos, y una calculadora con 2 modos × 3 orígenes
—seis pantallas antes de ver un número—. Nada decía *publica 186*.

**Y la respuesta estaba en sus propios datos.** Medido octubre entero, remesa a
remesa, con la tasa que dio y lo que le costaron esos bolívares:

```
61 operaciones · margen medio 6,8% · 151,44 USDT
```

Ya tenía una regla sin saberlo: **publicaba su suelo menos un 7%**, todos los
días del mes. El colchón de la vuelta es el otro: 210 sobre un suelo de 200, un
5%. Los dos se editan en Configuración; si cambia de criterio se toca ahí.

**Las dos tasas giran alrededor del MISMO número, y eso es lo que le faltaba:**

```
            suelo
     ida ────┤        por debajo del suelo, la IDA gana
   vuelta    ├────    por encima del suelo, la VUELTA gana
```

No son dos problemas: es uno. Y mover cada una **hacia** el suelo es su palanca
de inventario — sin bolívares, baja la vuelta para que entren; lleno de
bolívares, sube la ida para que salgan. Eso ya lo decidía `avisoTasa()` desde el
ARREGLO 112; lo que faltaba era subirlo al sitio donde se toma la decisión.

- **Las dos tasas salen de `_tasasRecomendadas()` y de ningún otro sitio**, que
  leen la tarjeta que las dibuja **y** el botón que las publica. Calculadas
  aparte en el botón, bastaría un redondeo distinto para publicar un número que
  no es el que está mirando — el 34,27 contra el 34,28.
- **Publicar pasa por `guardarTasaCalcHoy()`**, la puerta única del ARREGLO 117,
  que sella `tdia_fecha` y limpia el override del conversor.
- **La línea de qué hacer sale de `avisoTasa()`.** Escrita otra vez en la
  tarjeta, un día diría "sube la ida" con el aviso de abajo diciendo "baja la
  ida", y no habría forma de saber cuál mirar.
- **Sin suelo no se inventa una tasa.** Se dice qué falta. Un suelo adivinado es
  con el que publicaría mal.
- **Y se escribe entera.** `f2` daba *185,00*: cuatro caracteres de ruido en el
  número más grande de la pantalla, fingiendo una precisión que no tiene.
  `_tasaCorta()`.

#### La tasa aproximada de hoy, y las tres cosas que NO hace

Sus palabras: *"si dentro de 1 día no entra compra y venta de USDT el sistema
debe preguntar la tasa aproximada de cómo está el USDT, o lo agarra del que él
me había dado que no era Binance"*.

La segunda mitad ya existía —la lectura de mercado trae los reales de CoinGecko
o de Mercado Bitcoin cuando Binance bloquea al servidor por país— y se usa
**antes**. El orden es:

```
1. ¿hay operación de USDT suya de hoy?   → la suya
2. ¿no, y el mercado contesta?            → esa, diciendo de dónde salió
3. ¿tampoco?                              → se le PIDE, un campo
4. ¿no escribe nada?                      → no se inventa. Se dice qué falta.
```

- **NO se fija (📌).** Esto vale el día que se escribe y muere con él. (Cuando se
  escribió esto, lo fijado mandaba para siempre y por eso había que apartarse de
  ello; desde el ARREGLO 131 ya no, pero la aproximada sigue muriendo con el día
  y sigue sin tocar `tasaDeReferencia()`.)
- **NO entra en `tasaDeReferencia()`.** No revalora su capital, ni la
  conciliación, ni el cierre, ni la ganancia de ninguna remesa. Un número mirado
  a ojo no puede mover su contabilidad: vale para el **suelo**, que es la
  pregunta que hizo. Hay una prueba negativa dedicada.
- **NO se sincroniza.** Es un precio de este momento leído en una pantalla,
  igual que la lectura de mercado, que tampoco va en `DATA_KEYS` por lo mismo:
  entre dos aparatos se pisarían lecturas de horas distintas. Vive en
  `localStorage`, donde ya vive el tema y por la misma razón — es del aparato,
  no del negocio.

Y **solo entra si la suya tiene un día o más**: con una operación de hoy manda
lo medido, no lo mirado a ojo.

#### Y "¿a cómo está ahorita?" hay que poder probarlo (ARREGLO 129)

Sus palabras del 13/10: *"¿dónde coloco la tasa de ahorita de los USDT para ver
si la subo o la bajo en ambos lados?"*.

El 128 dejó el campo **solo cuando la app no tenía nada**. Si registraba una
operación de USDT ese día, los campos desaparecían — y entonces no había dónde
preguntarse *"¿y si está a 1.050?"*, que es justo para lo que los quería.

- **La regla pasa a ser "manda la MÁS NUEVA".** El id de un lote es
  `Date.now()`, así que la aproximada guarda su hora (`ts`) y se compara: si la
  escribe después de registrar, manda la suya; si registra después de
  escribirla, manda la medida. Antes la operación ganaba por ser del mismo día,
  y eso dejaba el campo muerto. Un lote **de permuta no cuenta** (ARREGLO 106):
  no es una operación de USDT.
- **El campo sale RELLENO con lo que la app usa ahora**, no vacío. Para subirla
  o bajarla hay que ver de dónde parte; vacío obliga a buscar el número en otra
  pantalla antes de poder tocarlo.
- **Los TRES valores, como siempre** (ARREGLO 116, 117, 123): *"Con esta sale
  193 · 218; con la de la app saldría 185 · 209"*, y el botón de volver. Decir
  solo *"estás probando"* obliga a borrarlo para saber de dónde venía.
- **La comparación sale de la MISMA cuenta.** `_tasasConLoMio()` apaga la
  aproximada, pregunta y la vuelve a encender **en un `finally`** — igual que
  `_prConPermuta` y `_simularConFecha`: mirar el resultado no puede ser ya
  haberlo aplicado. Una segunda fórmula escrita al lado se separaría con el
  primer redondeo.
- **Volver borra las DOS.** Probar con una y dejarse la otra puesta da un suelo
  salido de una mezcla que ella no eligió.
- **Los campos NO se abren solos NUNCA.** Sus palabras: *"no quiero saturar la
  pantalla, no me lo pongas allí afuera para que de una vez coloque la nueva
  tasa de USDT, sino como un botón, si en dado caso yo quiero agregar una
  nueva"*. Lo que sale solo es el **aviso** —que su tasa tiene tres días es algo
  que necesita saber— y debajo el botón. Escribirla es decisión suya. Es **una
  regla sola, sin excepciones**, también cuando no hay suelo ninguno: con dos
  reglas, un día se abre cuando no toca. El botón se dibuja desde un solo sitio
  (`_botonTasaUsdt`) en los tres estados, y la guardia cuenta las llamadas.

#### El botón de arriba es la PREGUNTA; el campo de abajo, el DATO (ARREGLO 129)

Sus palabras, con las dos capturas delante: *"cuando le doy de br a vzla abajo
dice otra cosa y igual del otro lado, ¿esto está bien?"*.

**Está bien, y se lee mal.** Para despejar una tasa hace falta la otra, así que
pidiendo la 🇻🇪→🇧🇷 el campo que hay que rellenar es la 🇧🇷→🇻🇪. Pero los dos se
escribían con el mismo molde —`_ruta(dir).boton`, literalmente la misma cadena—
así que arriba ponía `Tasa 🇻🇪→🇧🇷` y justo debajo `Tasa 🇧🇷→🇻🇪`, sin nada que
dijera cuál era cuál. El ARREGLO 122 ya lo había señalado y lo dejó a medias.

Ahora el campo tiene su propio rótulo (`campoRot`): **"Tu 🇧🇷→🇻🇪 de ahora"** —
*tuya* y *de ahora*, o sea un dato que ella ya tiene, no la respuesta. La
guardia exige que `campoRot` y `boton` sean distintos **y** que la calculadora
lo use en los **dos** campos: pidiendo solo que apareciera, cambiar uno de los
dos pasaba la prueba con el rótulo viejo puesto en el otro.

#### Y la tarjeta decía de dónde sale el suelo sin mirarlo (ARREGLO 130)

Sus palabras del 13/10: *"el sistema está agarrando como referencia una tasa
vieja, pero yo hace ratico acabo de registrar una venta de USDT por bolívares y
la tasa es de menos"*.

**Y la tarjeta del 128 le contestaba una mentira.** Decía *"Tu última operación
de USDT tiene 3 días… así que el suelo sale de esa"* — cierto para los reales,
**falso para los bolívares**: ese lado no salía de ninguna operación, salía del
**1.013 que ella fijó a mano el 10/10**. Medido en su export, su venta de ese
mismo día fue a 1.010,50:

```
con la fijada (1.013,00)        199,87  →  186 · 210
con su venta de hoy (1.010,14)  199,31  →  185 · 209
```

Poco, y **a su favor en la pantalla** — el único lado del que un suelo no se
puede equivocar.

- **La tarjeta dice de dónde sale cada mitad** (`_origenLado`) en vez de afirmar
  una sola cosa de las dos. Eso es lo que queda del 130 y no se toca.
- **`_ultimaOpUSDT()` es un solo recorrido**, y lo leen la hora (para la regla
  del 129) y la tarjeta. Dos recorridos acabarían señalando lotes distintos.

**Lo que el 130 hizo aquí y el 131 se llevó, un día después:** como lo fijado
seguía mandando, la tarjeta ofrecía un botón —*"usar la de tu venta del 10/13"*—
para soltarlo a mano. Con el 131 la app lo hace sola, así que el botón se quitó
en vez de dejarlo al lado sin poder cambiar nada (ARREGLO 98).

#### Y lo escrito a mano ya no manda para siempre (ARREGLO 131)

**Esto REVIERTE una regla escrita de este documento, y la revierte ella.** Sus
palabras del 13/10, mirando la tarjeta del 130: *"ya no puedo fijar ninguna tasa
del inventario de USDT según la compra y la venta, porque se supone que cada día
eso puede variar. Entonces no puedes colocarle como que yo fijé una tasa, se
supone que debe de ir actualizándose… y en algún caso esos bolívares me duran dos
o tres días, yo tengo que actualizar… no se puede fijar eso"*.

La regla vieja —*"la que ella fijó a mano manda: es una decisión suya, no un
olvido"*— en su día era correcta, y dejó de serlo cuando se midió lo que costaba:
su VES llevaba **desde el 10/10** valorando todo su dinero a **1.013** que
escribió una vez, por encima de sus ventas reales de 1.008,72, 1.010,66 y
1.010,50. Un número que escribió hace tres días no puede ganarle a una operación
que registró hace un rato.

**Ahora es UNA sola regla para los dos casos, la del 129: manda la MÁS NUEVA.**
Lo que escriba vale mientras sea lo último que pasó; en cuanto registre una compra
o una venta de USDT de esa moneda, manda la operación. Medido en Chromium con sus
datos (compra BRL del 10/10, VES fijada en 1.013 el 10/10, venta de hoy a 1.010,50):

```
                              suelo      publica
antes (mandaba la fijada)    199,87      186 · 210
ahora (manda su venta)       199,31      185 · 209
escrita HOY, tras la venta   199,87      186 · 210   ← sigue mandando la suya
```

- **Lo fijado no hay que ir a soltarlo.** Los que ya estén marcados dejan de ganar
  solos, sin que ella toque nada: las marcas de antes de este arreglo no guardan
  hora, así que cualquier operación les gana. Pedirle que vaya a quitar una marca
  que ya no significa nada sería dejar el arreglo a medias.
- **Escribir una tasa guarda su HORA** (`ts:Date.now()` en `setTasaDia`), que es
  lo único que hace comparable la regla: el id de un lote es `Date.now()`.
- **La comparación vive en la puerta** (`_tasaFijadaAMano`), no en quien la llama.
  Por ahí pasan la conciliación, el cierre y cada remesa.
- **Y los textos de pantalla cambiaron con la regla.** La pantalla de Tasas
  prometía que lo escrito *"queda marcado 📌 con su fecha hasta que la sueltes"* —
  con el 131 eso es falso. Ahora dice *"✍️ La escribiste tú el … · manda hasta que
  registres una operación de USDT en VES"*. Un texto que miente se deja de leer, y
  dos guardias lo fijan.

**Lo que esto le cambia, y hay que decírselo:** su referencia de VES pasa de
1.013 a ~1.010,14, así que **todos sus bolívares se revalúan un poco** (≈+0,48
USDT sobre sus 170.560 Bs) y la conciliación se mueve otro tanto. No aparece ni
desaparece dinero: lo que cambia es la tasa con la que se mira.

#### El traspaso que falta para una venta de USDT (ARREGLO 130)

Sus palabras: *"son dos cuentas distintas, una es de reales que es Binance Saipa
y la otra es de moneda Vzla que es Binance Julio… para no tener que hacer
traspaso"*. Y después, la que decide la forma: *"igual yo señalo por dónde sale,
solo que me ahorraría el tema del traspaso, porque si Binance Julio está en 0 y
Binance Saipa tiene 100 USDT y registro una venta de USDT por Binance Julio, se
supone que deben ser esos 100 de Saipa porque no hay más cuentas"*.

**Tiene razón, y eso cambia la regla.** Cuando solo hay un sitio de donde pueden
salir, no hay nada que preguntar: el dato está **forzado**, no inventado. Con dos
o más sí se pregunta, porque ahí sí hay una decisión.

**Y esto no es comodidad.** El 11/10 vendió **368,06** USDT desde Binance Julio y
traspasó **323,21** — 44,85 de menos. Con el traspaso saliendo por el monto exacto
de la venta, esa diferencia no se abre.

**Corrección, porque aquí quedó escrito como causa probada y no lo era:** esos
44,85 se dieron por *"de ahí salen los 75,93 que la app decía tener en Saipa"*, y
el 13/10 ella aportó el dato que lo tumba — el mismo día había pasado **74,69
USDT de su Binance personal al de Julio**, así que JULIO sí tenía con qué vender y
no falta ningún traspaso. Deducir la causa de un descuadre **a partir de lo que
está registrado** da una respuesta que se cae en cuanto aparece un movimiento que
no lo estaba. Al perseguirlo con todo dentro salió otra cosa, y más grande: los
saldos de esas dos cuentas **no se pueden reconstruir desde los movimientos**.
Medido desde el 12/09, los movimientos registrados dan −478,53 y para llegar a
los 75,93 de hoy ese día habría tenido que haber 554,46 donde la app decía
474,76 — **79,70 de deriva**. La causa de fondo: muchas ventas de bolívares están
registradas saliendo de **SAIPA** cuando el USDT estaba en **JULIO**, y
reconstruida la cuenta SAIPA se va a negativo imposible una y otra vez desde
septiembre. Entre eso, el `manual_override` de las dos y el **0 escrito a mano**
en JULIO, ese saldo lleva un mes sin seguir a los movimientos. Se cerró con un
ajuste a mano —el caso legítimo: el banco y la app discrepan y ya se sabe por
qué— y lo que lo evita de aquí en adelante es elegir **la cuenta correcta en la
venta**, que es justo lo que el traspaso automático hace posible.

- **Se DICE, no se hace en silencio**: *"Traspasé 100,00 USDT desde BINANCE
  SAIPA"*, en el mismo aviso que confirma la venta. Un movimiento de dinero que
  la app escribe sola y no cuenta es lo que haría que dejara de fiarse de los
  saldos.
- **Va DESPUÉS de que confirme la venta.** Antes, cancelar la venta dejaría el
  dinero movido sin operación detrás.
- **Una cuenta 💜 personal no es un origen.** Ese dinero ya salió de la empresa
  (ARREGLO 96) y traerlo de vuelta sería inventarse un movimiento que ella no
  hizo. Una cuenta desactivada tampoco.
- **Es un traspaso normal**, con el mismo formato de siempre: nada nuevo que
  fusionar entre aparatos.

**Lo que esto NO repara:** los 75,93 que ya están. El arreglo vale de aquí en
adelante; esa diferencia hay que corregirla a mano una vez.

#### Y la ida sube sola cuando hay bolívares parados (ARREGLO 132)

Sus palabras del 13/10: *"ya yo aquí tengo bs de usdt que tuve que vender,
entonces quiero que mientras tenga más de lo equivalente a 200 reales en bs tenga
mejor tasa, porque ahorita mi competencia tiene una tasa de reales más alta y
entonces me está mandando a bajar a 185"*.

**El aviso del ARREGLO 112 ya decía "te llenaste de bolívares, SUBE la ida", pero
mide en PORCENTAJE.** Medido en su export del 13/10:

```
bolívares en cuentas   170.604 Bs = 850 R$   ← 4 veces su umbral
lo que decía la app    "tienes reales de sobra"
```

Con el 51% en bolívares no llegaba al umbral del aviso, así que la app creía que
no pasaba nada mientras ella tenía 850 reales perdiendo valor y la competencia
publicando por encima. **Su regla es ABSOLUTA y pequeña** —200 reales— porque lo
que le duele no es la proporción, es el monto parado.

Ahora el colchón de la ida tiene dos valores y el inventario decide cuál manda:

```
                        colchón   publica   gana por cada 500 R$
normal                     7%       185          7,09 USDT
con bolívares parados      5%       189          4,10 USDT
```

Los dos números los eligió ella (5% y 200 R$) y se editan en Configuración, al
lado de los otros dos colchones. **La vuelta no se toca**: lo decidió así.

- **El inventario se mide en UN solo sitio** (`_inventarioBs`) y lo leen el
  colchón que decide la tasa **y** el aviso que la explica. Calculado aparte, un
  día la tarjeta subiría la ida mientras el aviso de abajo dice que todo va bien.
- **La conversión a reales MULTIPLICA.** `usdtCuentas` ya está en USDT, así que
  para pasarlo a reales se multiplica por los reales que vale un USDT. La regla
  de *"getRateToUsdt divide"* es para el camino contrario; dividir aquí daba 33 R$
  donde hay 850 y el umbral no saltaba nunca.
- **Sin tasa de reales no se decide nada** y manda el colchón de siempre. Un
  umbral adivinado movería la tasa que publica.
- **`_colchon()` sigue devolviendo lo GUARDADO** —es lo que tienen que enseñar los
  campos de Configuración— y quien mira el inventario es `_colchonIdaAhora()`.
- **La comparación sale de la MISMA cuenta** (`_tasasSinBs`, con su `finally`,
  igual que `_tasasConLoMio` y `_prConPermuta`): mirar el resultado no puede ser
  ya haberlo aplicado.
- **Y va en UN recuadro, no en dos.** El primer intento dibujaba la comparación
  encima del aviso y la tarjeta decía *"850,36 R$"* y *"200,00 R$"* dos veces
  seguidas, en dos bloques ámbar pegados — el ARREGLO 125 otra vez.

**SIN memo, a propósito.** El primer intento guardaba la respuesta 300 ms y la
prueba de al lado empezó a medir la del bloque anterior: con el memo puesto, el
número que decide la tasa que ella publica depende de **cuándo se preguntó**, y eso
no se ve desde fuera. Medido en Chromium: la pestaña de Tasas se dibuja en **8,6
ms** sin él, y las 24 pestañas sin un error.

Comprobado con sus datos del 13/10: con 170.604 Bs (850,36 R$) sale **189 · 209**
con el colchón al 5%, y bajando a 2.000 Bs vuelve a **185 · 209** con el 7%.

#### Y la vuelta baja sola cuando hay reales parados (ARREGLO 133)

Sus palabras del 13/10: *"de bs a reales que pase, lo mida con esa misma lógica
pero al contrario"*.

**Al contrario quiere decir esto, y el motivo es SUYO** (ARREGLO 74): su vuelta
alta existe para cubrirle el P2P que tiene que hacer cuando entra una vuelta
grande y **no** tiene reales. Con reales en mano ese costo no lo tiene, así que
puede **BAJAR** la vuelta — pide menos Bs por real, entran más vueltas, salen
reales y entran bolívares.

```
                        colchón   publica
vuelta normal              5%       209
con reales parados         3%       205
```

**El umbral NO es el mismo, y por eso se pregunta aparte.** Medido en su
histórico, los reales en cuentas se mueven mucho:

```
hoy 3.252 · 08/10 346 · 06/10 92 · 17/09 2.271 · 03/09 199
```

Con 200 —el de los bolívares— estaría en *"me sobran"* **9 de los últimos 13
días**, o sea casi siempre, y eso es cambiar el colchón de base en vez de
reaccionar. **1.000** son unas cinco vueltas de su tamaño medio (193 R$) en mano:
por debajo de eso todavía puede necesitar el P2P y ese 5% se lo gana.

- **Los reales NO se convierten.** `enCuentas` de BRL ya está en reales; pasarlo
  por `usdtCuentas` y multiplicar sería dar dos veces la vuelta a un número que ya
  estaba bien, con un redondeo de regalo. Es la otra mitad de la regla del 132,
  donde los bolívares **sí** hay que convertir.
- **Los DOS lados pueden estar activos a la vez** — ella tiene 850 R$ en
  bolívares y 3.252 en reales. Enseñando solo el primero, la vuelta se movería
  sin que nada lo diga, que es justo lo que ese bloque existe para evitar: van los
  dos, una línea cada uno, **en el mismo recuadro**.
- **Cada lado con SU umbral y SU colchón**, y los cuatro se editan juntos en
  Configuración.

Medido en Chromium con sus datos del 13/10 (850 R$ en bolívares, 3.252 en
reales): **189 · 205**, contra los 185 · 209 de antes. Bajando los bolívares a
2.000 Bs vuelve a **185 · 205** — cada lado se mueve solo por lo suyo.

#### Pero el 133 trabajaba CONTRA el 132 (ARREGLO 135)

Lo cazó ella el 13/10, con las dos tasas delante: *"si también estoy llena de
bolívares, ¿por qué me pides bajarla a 205 y no mantenerla en 210? ¿no crees que
me van a llegar aún más bolívares?"*.

**Tiene razón, y el 133 estaba escrito mirando solo el COSTO.** Bajar la vuelta
la hace más atractiva para el cliente que trae bolívares, así que entran **más**.
Medido con sus datos del 13/10, con los dos lados por encima del umbral:

```
el 132 sube la ida     185 → 189    saca bolívares
el 133 baja la vuelta  209 → 205    METE bolívares
```

**Y cuál manda ya estaba decidido por ella, hace tiempo y en este documento:**
los reales parados no le perjudican; los bolívares parados sí, por la
devaluación. Así que con los dos lados llenos decide el bolívar y la vuelta se
queda con su colchón de siempre. Con sus datos: **189 · 209** en vez de 189 · 205.

- **El 133 no se retira, se subordina.** En cuanto los bolívares bajen del
  umbral, la vuelta vuelve a bajar sola. Hay guardia para los dos casos.
- **El bolívar se pregunta ANTES que los reales**, dentro de
  `_colchonVueltaAhora()`, que es la única puerta — `_colchon()` sigue
  devolviendo lo guardado, que es lo que enseña Configuración.
- **Y respeta `_SIN_BS`**, porque la comparación *"qué saldría sin los bolívares
  parados"* tiene que contestar el escenario entero: sin bolívares encima, la
  vuelta sí baja. Sin eso, mirar el resultado contestaría a medias.
- **Lo que NO hace, y es decisión suya: SUBIR la vuelta para frenar más.** Se le
  ofreció —habría dado 213— y eligió esto: 213 queda por encima de lo que publica
  y puede costarle clientes de vuelta. Eso es su negocio, no el código.

**La lección, que es de método:** dos reglas que miran cada una su mitad del
inventario pueden ser correctas por separado y anularse juntas. Cuando se añada
una tercera, hay que medir el caso con **todas** activas, no solo la nueva.

#### Y el 133 le daba un motivo que NO es el suyo (ARREGLO 139)

Lo cazó ella el 14/10, con la tarjeta delante: *"¿es factible hacer mi trabajo
así? ¿bajar la tasa cuando recibí anteriormente a otra tasa está bien? ¿no estoy
sobrevaluando dos veces los mismos reales?"*. Y después el dato que lo decide:
*"teniendo esa tasa así de alta me llegó esa remesa de 2.500 reales pero no tenía
para cubrir esos Bs y tuve que hacer una venta del P2P"*.

**Primero, su duda contable: NO había doble valoración.** La tasa que publica no
toca ninguna ganancia, y el costo de sus reales ya está dentro del **suelo**
(`venta ÷ compra` con sus tasas reales). A 204 gana 2,85 % **por encima de ese
costo**, no por encima de cero. Eso se le dijo con esas palabras.

**Lo que sí estaba mal era el MOTIVO.** El 133 decía *"con reales en mano no
tienes que hacer el P2P que esa vuelta alta cubre"* — y ese P2P casi no lo hace:

```
salir a Binance a comprar BOLÍVARES (para cubrir IDAS) .... 151 veces
salir a Binance a comprar REALES    (para cubrir VUELTAS) ... 55 veces
solo en octubre .......................................... 18 contra 2
```

**Su P2P es de las IDAS.** Por eso el razonamiento le sonó raro: no encajaba con
su operación, y desconfió con razón.

**La conclusión no cambia, el motivo sí, y es más fuerte:** las vueltas le
**traen** bolívares, que es lo que le falta, y por ahí le salen más baratos que
en Binance (204 Bs por real contra los 198,34 de su suelo).

- **El disparador pasa a ser QUEDARSE SIN BOLÍVARES**, no que le sobren reales.
  Hoy las dos cosas coinciden en ella, así que el 133 acertaba por casualidad; el
  día que tenga reales **y** bolívares, le bajaría la vuelta sin motivo.
- **Los reales no se van: cambian de papel.** Bajar la vuelta hace entrar
  vueltas, y en una vuelta ella **entrega** reales. Sin reales no puede
  atenderlas. Dejan de ser el motivo y pasan a ser la condición.
- **Y eso retira el ARREGLO 135.** Aquel existía porque el 133 bajaba la vuelta
  justo cuando el 132 sacaba bolívares. Con el disparador invertido no se puede
  dar: no se puede estar lleno y vacío de bolívares a la vez. **Queda una regla
  donde había dos que se pisaban.**

#### El umbral no es un número fijo, y eso lo dijo ella

Se le ofrecieron 30.000 / 60.000 / 100.000 Bs y contestó: *"dámelo tú porque eso
realmente es relativo, todos los días son diferentes"*. Tiene razón, y los datos
se lo dan — lo que entrega al día no para de crecer:

```
mediana de Bs que entrega al día, últimos 90 días con ops ....  91.744
                                           60 ...............  97.021
                                           30 ............... 108.269
                                           15 ............... 132.090
```

Un número puesto a ojo hoy estaría viejo en un mes. **El umbral ES lo que entrega
en un día normal suyo** (`_diaNormalBs`), y se mueve con ella. El criterio, en una
frase: *si no tengo para cubrir un día normal mío, estoy corta*.

- **La MEDIANA, no la media.** Su media de 30 días son 175.500 contra una mediana
  de 108.269: la media mide el día excepcional —los de 600.000— y le bajaría la
  vuelta casi siempre.
- **Solo las idas.** Son las que gastan bolívares; contar las vueltas mediría otra
  cosa.
- **Lo del mismo día se suma**: es un día, no dos operaciones.
- **Se puede forzar desde Configuración, y el campo VACÍO vale.** Vacío quiere
  decir *"calcúlalo tú"*, que es lo normal. Un cero guardado no dispararía nunca y
  dejaría la regla muerta sin decirlo, así que el campo vacío **borra la clave**
  en vez de escribir 0.
- **Sin histórico de idas no se decide nada.** Un umbral adivinado movería la tasa
  que publica.
- **Los bolívares se leen EN bolívares** (`enCuentas`), no convertidos: el umbral
  está en bolívares porque es como ella los mira, y `usdtCuentas` obligaría a una
  tasa que puede faltar. Es la otra mitad de la regla del 132, donde el umbral sí
  está en reales y por eso sí hay que convertir.
- **Sin memo**, igual que `_inventarioBs` y por lo mismo (ARREGLO 132). Medido con
  sus 962 remesas: **0,27 ms** por llamada.

**Y el aviso dice el motivo de verdad, con el número que lo hace comprobable:**

> **Te faltan bolívares.** Tienes **59 Bs** y un día normal tuyo son **108.269**,
> así que bajo la vuelta de **208** a **204**: cada vuelta que entre son bolívares
> que no tienes que ir a comprar — llevas **18** compras en Binance este mes.

Medido en Chromium con su export del 13/10: con 58,54 Bs y 3.118,99 R$ recomienda
**184 · 204**; subiendo los bolívares a 500.000 vuelve a **188 · 208** —la vuelta
deja de bajar sola—, que es exactamente lo que el 133 hacía mal. 29 pestañas,
0 errores.

### Lo publicado y lo recomendado, lado a lado (ARREGLO 136)

Sus palabras del 13/10: *"estás saturando demasiado la pantalla"* y *"la tasa que
se elige debe estar reflejada en todo el sistema… me refiero a la tasa cliente"*.

**La tasa SÍ estaba conectada, y eso se midió antes de tocar nada.** Publicando
189 · 205 con su export en Chromium, el número llega a los cuatro sitios:

```
                                       antes      después
cabecera de Tasas                     187 · 210   189 · 205
cotización al cliente                 187 · 210   189 · 205
el flyer                              187 · 210   189 · 205
tasa por omisión de una remesa nueva  187 · 210   189 · 205
```

**Lo que fallaba era que la pantalla enseñaba dos tasas distintas sin decir cuál
era cuál.** La tarjeta recomendaba 205 y la cabecera de justo debajo enseñaba el
210 que tenía publicado, las dos con número grande y la misma pinta. Ella había
publicado la ida y la vuelta se quedó atrás. Es el ARREGLO 122 otra vez, y la
cuarta vez con esta forma.

Ahora van **lado a lado**, una fila por ruta, con la columna **TIENES** y la
columna **TE RECOMIENDO**; la fila que no coincide se marca sola. La posición
dice cuál es cuál antes de leer nada.

- **La cabecera vieja se fue ENTERA** (`_htmlCabeceraTasas`). Sus piezas no se
  perdieron: los campos editables son la columna TIENES, y el suelo, el veredicto
  y el pie viven en `_htmlPiePub()`. Una pantalla nueva **quita** el control
  viejo; ponerse al lado es lo que hace que no se sepa cuál manda (ARREGLO 98).
- **El porqué va PLEGADO**, detrás de un *"por qué ▾"*. Lo que tiene que verse sin
  pedirlo es qué publicar; el motivo se lee una vez y estorba las otras cien. Lo
  que no se pliega nunca es un aviso **rojo** (ARREGLO 99), y este no lo es: la
  tasa ya está movida, no hay nada que corregir.
- **Y el motivo sale de `_motivoPub()`, que devuelve UN objeto.** Antes eran dos
  ramas con la misma pinta en if/else y había que vigilar que no apareciera una
  tercera; con un solo bloque, eso no se puede volver a abrir.

#### Los avisos de abajo repetían lo que la tarjeta ya decía

Los metí yo con el 132 y el 133: puse la explicación en la tarjeta y **no quité
los avisos de abajo que ya la daban**. Medido en la pestaña con sus datos:

```
849,97 R$ ...... 2 veces      200,00 R$ ..... 2 veces
3.252,62 R$ .... 2 veces      1.000,00 R$ ... 2 veces
avisos abajo ... 3, donde cabe 1
```

Y de esos tres, *"Tienes reales para mover"* y *"Tienes reales de sobra"* eran el
**mismo hecho** contado dos veces —uno en reales, otro en porcentaje— y los dos
terminando en "baja la vuelta". Es el ARREGLO 125 y el 98 a la vez.

**Lo que se filtra es esta pantalla, no el aviso.** Los cuatro siguen saliendo en
el Resumen y en la notificación al teléfono, donde la tarjeta no está. La lista
vive en `_AVISOS_EN_LA_TARJETA`.

La pestaña pasa de **1.539 px a 901**.

#### Y el campo de la tasa no se podía usar, en producción

Esto salió midiendo lo anterior, y es lo que más caro salía de esta pantalla.

`_setTasaPub()` rehacía `tasas-cab` entero desde su propio `oninput` —**con el
input dentro**— así que el campo moría en el primer carácter. Reproducido en
Chromium contra la versión desplegada (v212), haciendo lo que hace una persona
(tocar, seleccionar todo, escribir):

```
escribir "185"  →  queda 1, y eso es lo que se guarda en tdia_brl
```

Y esa es la tasa que leen el flyer, la cotización al cliente y cada remesa nueva.
**El comentario viejo invocaba el ARREGLO 32 sin ver que el campo estaba dentro
de lo que repintaba:** la regla era la correcta, el trozo elegido no.

- **Se refresca solo lo que depende de la tecla** —`tpub-dif`, la línea de si
  coincide, y `tpub-pie`, el suelo con el %— y **el input no está en ninguno de
  los dos**. Es el ARREGLO 55 y el 32 a la vez.
- **Al PULSAR sí se puede repintar la tarjeta entera** (`_refrescarTasasTodo`),
  porque ahí no hay ningún campo bajo el dedo. Las dos cosas no son la misma y
  por eso no comparten camino.
- **La guardia exige las dos mitades**: que `tpub-dif` y `tpub-pie` se refresquen,
  y que `_setTasaPub` **no** toque el contenedor del campo. Pidiendo solo lo
  primero, volver a meter el repintado pasaba.

**La lección, y es la del ARREGLO 121 otra vez:** una guardia estructural
comprueba que el código dice lo que debe decir, no que el camino funcione. Esto
llevaba desplegado desde el 111 y ninguna lo cazó, porque el texto decía lo
correcto. Lo cazó **teclear de verdad en el navegador**. Cuando un arreglo toca
un campo donde ella escribe, hay que escribir en él.

#### Y el MISMO fallo seguía en los campos de la tasa aproximada (ARREGLO 140)

Lo cazó ella el 14/10: *"aquí hay un error para escribir corrido, como que se cae
cuando borro o quiero escribir"*. Y era literal, en los dos campos de *"probar
con otra tasa de USDT"*. Reproducido en Chromium contra v221, tecleando de
verdad:

```
escribes "5,0508"   →  queda "5"   y el foco se va al BODY
escribes "1010"     →  queda "1"
borras con ⌫        →  no borra: vuelve el valor viejo
```

**La causa es la del 136, con otro nombre:** el `oninput` (`_setAprox`) rehacía
`tasas-publica` **entero**, y los dos campos están dentro de ese contenedor.

**Y lo que queda es lo que se GUARDA**, o sea lo que decide el suelo y por tanto
lo que publica:

```
bolívares 1010 → se guarda 1        publica 0 · 0      (suelo 0,20)
reales 5,0508  → se guarda 5        publica 186 · 206  en vez de 184 · 204
```

- **El refresco cubre TODO lo que depende de la tecla** (`_refrescarAprox`), y
  nada de eso lleva un campo dentro: las dos celdas **TE RECOMIENDO** —que el
  136 no tocó porque su campo no las movía—, `tpub-dif`, `tpub-pie`, el texto de
  encima de los campos y los TRES valores. Refrescar a medias deja la tarjeta
  diciendo dos cosas a la vez (ARREGLO 55).
- **La celda recomendada se repinta por `textContent` y `style`, no con
  `innerHTML` del `<tr>`:** esa fila lleva dentro el input de **TIENES** y
  rehacerla se lo llevaría por delante. El mismo fallo, una capa más abajo.
- **La lectura del mercado también repintaba la tarjeta** (`_refrescarSuelo`), y
  esa llega **sola**. Con un campo bajo el dedo se va por el refresco parcial:
  borrarle el campo a media palabra es peor que esperar a que suelte.
- **El estado se calcula en UN sitio** (`_estadoPub`) y la diferencia entre lo
  publicado y lo recomendado en otro (`_difPubFila`): los leen el dibujado y el
  refresco. Calculados aparte, el refresco podría pedir un lado que la tarjeta no
  dibujó, o marcar la fila con el color de *"coinciden"*.

**Y dos agujeros de las guardias, los dos cazados por la prueba negativa:**

- La guardia del 129 decía *"se rehace la tarjeta por su id"* — o sea **exigía el
  fallo**. Un texto que describe lo que el código hace no dice si lo que hace
  está bien.
- Mi guardia nueva pedía que `_pintarRecPub` apareciera, y **quitar la llamada de
  la ida pasaba** con la de la vuelta puesta. Hay que exigir **las dos por
  nombre**, igual que el rótulo del ARREGLO 129.
- Y el ancla del pie en la prueba negativa era **ambigua**: ese mismo par de
  líneas existe en `_refrescarTasasTodo`, así que medía la función equivocada.

**La lección, y es la cuarta vez:** cuando un arreglo toca un campo donde ella
escribe, **hay que escribir en él**. Las guardias estructurales dieron verdes
desde el 129 porque el texto decía lo correcto.

#### Lo que esto NO contesta, y está dicho

**La competencia.** De sus cuatro referencias, dos son apps y dos son grupos de
WhatsApp: no hay de dónde leerlas (ARREGLO 110 ya las quitó de la pantalla). La
tarjeta dice si **gana**; si **compite** lo sigue sabiendo ella, y para eso la
calculadora entera sigue debajo, en su fila, cerrada.

**Y el suelo sigue sin llevar la comisión del banco venezolano ni los egresos.**
Es el suelo de la operación, no el de la empresa — la misma advertencia del
ARREGLO 75, que aquí vale el doble porque ahora de ese número sale directamente
lo que publica.

### Su suelo: hasta dónde puede ofrecer sin perder

Sus palabras: *"no sé qué tasa de compra y venta está usando mi app"* y *"no es
solo la competencia sino el mercado p2p"*. Son **dos** cosas distintas y las dos
hacen falta:

- **Sus lotes** → el suelo de lo que **ya compró**. Sale de `tasaDeReferencia()`,
  la misma función que ya valora todo su dinero: no se calcula aparte, para que
  no haya dos respuestas a la misma pregunta.
- **El mercado** → el suelo de lo que puede comprar **ahora**. Eso lo trae
  `GET /mercado` de la API.

El suelo es `venta ÷ compra`, descontando la comisión de Binance:

```
compra 1 USDT por 5,1638 R$ · lo vende por 948 Bs
suelo = (948 × (1 − 0,7%)) ÷ 5,1638 = 182,30 Bs por real
```

**Todo lo que ofrezca por debajo de 182,30 le deja ganancia.** Medido con sus
números del 18/09: ofreciendo 172 le quedaba **+5,6 %**, y podía llegar a **175
—mejor que todos sus competidores— y aún le quedaba 4 %**. Cuando dijo *"estoy
por debajo del mercado, nadie mandará conmigo"* la respuesta era la contraria:
estaba por debajo de sí misma.

Tres cosas que no hay que deshacer:

- **Sin las dos tasas no hay suelo, y no se inventa.** Una tasa de referencia
  que falta no puede convertirse en un número con el que ella publique.
- **Una comisión fuera de rango se ignora**, en vez de destrozar el suelo.
- **Se dice lo que el suelo NO incluye**: la comisión del banco venezolano y sus
  egresos. Es el suelo de la operación, no el de la empresa. Un suelo optimista
  es peor que ninguno — con él publicaría una tasa que no aguanta.
- **La tasa de compra va a CUATRO decimales.** Entre 5,16 y 5,1638 hay 0,07 %
  de su margen, y sobre su volumen del mes eso no es redondeo.
- **La lectura del mercado NO se guarda ni se sincroniza.** Es un precio de hace
  un minuto, no un dato del negocio: si entrara en `DATA_KEYS` viajaría entre
  aparatos y se pisaría con lecturas de otra hora. Vive en memoria y se vuelve a
  pedir, con una guardia de 5 minutos para no preguntar en cada repintado.

### De los dos suelos manda el MÁS BAJO (ARREGLO 77)

En pantalla hay dos: el de lo que ya compró y el del precio de hoy. El `%` se
medía contra el del mercado, y eso es medir contra un costo que no es el suyo.

El suelo es `venta ÷ compra`, así que **una compra más cara lo BAJA**. El 30/09
ella compró USDT a 5,27 —paga la comisión del P2P— y el mercado abierto estaba
en 5,20:

```
su costo   5,27 · vende 946,44  →  179,59   ← este es el que aguanta
mercado    5,20 · vende 956,86  →  184,01
```

Lo dijo ella: *"cuando mi tasa de compra de los reales sea más alta que la que
está en el mercado, que me lance la de mi última tasa de compra"*.

- **Y el caso contrario sale solo, sin una regla aparte.** Una tasa de compra
  vieja y barata (el 5,0018 del 18/09) da un suelo **alto**, así que pierde la
  comparación y manda el del mercado. Por ningún lado le puede salir el número
  optimista, que es lo único que esta tarjeta no se puede permitir.
- **Se decide primero y se pinta después, porque el color va con el que manda.**
  Al revés salía el suelo que manda en ámbar y el que no manda en verde: el
  color se lee antes que la letra, y la tarjeta decía una cosa con el texto y la
  contraria con el color. Es el mismo fallo de la tarjeta de conciliación.
- **Cada suelo que se dibuja entra en la comparación.** Se dibuja recorriendo la
  misma lista con la que se elige, en un solo sitio: si uno se enseñara y no
  compitiera, el `%` podría salir de un número que no está arriba.
- **Y se dice cuál mandó, con las dos tasas.** Un porcentaje que no dice de
  dónde sale hay que comprobarlo a mano — que es justo lo que esta tarjeta
  existe para ahorrarle. Con un solo suelo no se escribe nada: no hay elección.

**La tasa de compra puede ser de hace días y eso hay que decirlo.** Sale de la
**última** operación de USDT registrada, así que si compró más caro y todavía no
lo registró, el suelo sale optimista y se calla. El 30/09 la tarjeta enseñaba
187,90 con una compra del 18/09 mientras ella había comprado a 5,27 esa misma
mañana: el número no estaba **mal**, estaba **viejo** — que para lo que sirve un
suelo es lo mismo. Se avisa a partir de un día. **La tasa fijada a mano no se
avisa**: eso es una decisión suya, no un olvido, la misma regla que ya manda en
`tasaDeReferencia()`.

`tasaDeReferencia()` devuelve esa fecha en **`iso`, no en `fechaIso`**:
`pruebas/prestamos.js` cuenta cada `fechaIso:` del archivo contra cada sitio que
mete un lote, para que no vuelva a colarse uno sin año (ARREGLO 51), y un campo
más con ese nombre rompe la cuenta. Esto no es un lote: es la tasa que salió de
uno.

### Lo que la app NO va a leer sola

De sus cuatro referencias, dos son apps (Retorna, El Dorado P2P) y dos son grupos
de WhatsApp. **No hay de dónde leer eso de forma fiable**, y montar algo que lo
adivine sería darle números inventados sobre los que decide precio. Lo que sí se
hizo es que apuntarlas cueste diez segundos y que la comparación la haga la app.

**Lo que sí se puede leer solo es el precio de Binance** —su costo real— pero
**no desde el navegador**: la app corre en una página y Binance no autoriza que
otra le pregunte. Tiene que pedirlo el servidor (`centrogestion-api`). Ese es el
único camino; lo de dentro de `index.html` no funciona, no hace falta volver a
intentarlo.

**Y cada moneda sale de un sitio distinto, que no es intercambiable:**

```
reales     →  Binance → CoinGecko → Mercado Bitcoin   (el primero que conteste)
bolívares  →  P2P de Binance
```

**Su servidor está en Railway EE.UU. y Binance lo bloquea por país.** Medido el
30/09: el mercado normal devuelve **451** (*"Unavailable For Legal Reasons"*) y
el tablón P2P de reales viene vacío en las **dos** direcciones —`total 0`, con la
pregunta simple igual, y el sondeo del otro lado también— mientras el de
bolívares, desde la misma máquina, trae anuncios. Las dos puertas cerradas por lo
mismo.

**Cambiar de región en Railway lo arreglaría, pero es de pago y su plan no lo
tiene.** Así que el precio de los reales se busca donde sí contesten. Binance va
primero porque es donde ella opera de verdad; USDT/BRL es tan líquido que entre
sitios hay décimas de por ciento, y para un **suelo** eso vale.

- **Lo que no vale es callar de dónde salió.** Cada lectura trae su `fuente` con
  el nombre del sitio y la pantalla lo enseña (*"reales: CoinGecko"*). Enseñarle
  un precio que no es el de Binance como si lo fuera sería peor que no darlo.
- **Cada sitio envuelve el precio a su manera** y no hay contrato entre ellos.
  `_precio_de` prueba las tres formas conocidas y si ninguna encaja devuelve
  nada, en vez de adivinar.
- **Si caen las tres, el motivo cuenta lo que dijo CADA una.** Cuál contesta y
  cuál no es lo que decide qué hacer después, y el 451 hay que poder leerlo tal
  cual porque no se arregla con código.

Al revés no vale: **Binance no lista VES**, así que ahí el P2P es el único sitio
donde ese precio existe. Mientras alguna fuente conteste, al P2P de reales **ni
se le pregunta**.

`histComp` guarda lo apuntado **indexado por fecha**, así que va en
`_MERGE_HISTORIAL` y en `DATA_KEYS`: se une entre los dos aparatos en vez de
pisarse, y en unos días contesta sola la otra pregunta —*cuándo y cuánto se
mueve el mercado*—, que no se puede deducir, solo registrar.

### Un fallo que no dice por qué cuesta una tarde

La tarjeta decía **"El mercado ahora · sin lectura"** y ahí se acababa. Detrás
hay tres cosas distintas que se arreglan en sitios distintos, y se estuvo
buscando en el sitio equivocado hasta que ella abrió `/salud` a mano:

```
tu servidor todavía no tiene esta función    → 404: está vivo pero es viejo
Binance respondió 403                        → el filtro de Binance, se arregla en la API
de los 20 anuncios de BRL, ninguno acepta 1.000  → lo arregla ella, bajando el monto
```

El servidor **ya sabía** cuál era —`mercado_p2p()` devuelve `motivo`— y la app lo
tiraba. La regla que sale de aquí: **si el servidor sabe por qué falló, la
pantalla lo dice.** Un fallo mudo obliga a adivinar, y adivinar es lo que ya
costó tres diagnósticos equivocados en una sesión.

Cuatro cosas que lo sostienen:

- **El motivo va por LADO** (`motivoBRL` / `motivoVES`), no solo cuando fallan los
  dos. Sin las dos tasas no hay suelo, así que media lectura es un fallo igual —y
  esa fila deja de pintarse verde: un *"vendes —"* en verde se lee como si
  estuviera bien.
- **Un fallo no se guarda como una lectura buena.** El caché del servidor era de
  5 minutos para todo, así que el botón que dice "reintentar" devolvía el mismo
  fallo guardado y no hacía absolutamente nada. Un fallo vive 20 s en el
  servidor y la pantalla lo reintenta sola a los 30 s (`_MERCADO.intento` es
  *cuándo se preguntó*; `_MERCADO.leido`, *cuándo se consiguió algo* — no son lo
  mismo).
- **El texto viene de Binance, así que se escapa y se corta a 70.** No lo
  controlamos y acaba dentro de `innerHTML`.
- **El servidor se presenta ante Binance como un navegador.** Se presentaba como
  `"centrogestion-api"`, que es justo lo que el filtro del tablón busca. Esto no
  se puede probar sin salir a internet —ni aquí ni en el CI—: la prueba mira lo
  que **se iba a mandar**, que es lo único que ese filtro juzga, y la de verdad
  la da su servidor al desplegar.

**Y la versión del servidor está en Configuración**, con su base de datos y un
botón para volver a preguntar. `/salud` ya la traía en cada arranque y la app la
tiraba; que ella tenga que abrir una dirección a mano para saber si su servidor
está al día es un fallo de la app, no una tarea suya. Un despliegue puede quedar
fallado y seguir corriendo el contenedor viejo: desde fuera no hay otra forma de
notarlo.

Y esa línea **se refresca sola y dice a qué hora se leyó**. Se preguntaba una
vez, 1,2 s después de abrir, y ahí se quedaba: el 29/09 marcaba `166c1b4` con el
servidor ya en `6c0806f`, porque la app abrió mientras Railway desplegaba. No
estaba mal, estaba **vieja** — que para lo que sirve esa línea es lo mismo. Se
vuelve a preguntar al volver a la app, como ya se hacía con los permisos, y la
hora va siempre: si solo apareciera al envejecer, su ausencia habría que saber
leerla.

### Media lectura del mercado no es nada: se completa con lo suyo

Pasó el 29/09 y es el caso normal, no el raro. Los bolívares se leyeron —957,01,
de 2 anuncios— y los reales volvieron con **el tablón vacío**. Sin las dos tasas
no hay "suelo al precio de hoy", así que la pantalla enseñaba solo su suelo
propio y **medio dato nuevo se quedaba guardado sin usar**.

No hace falta inventar nada: los dos números que quedan son reales, solo que uno
es de su historia y el otro de ahora.

```
tu compra de 5,0018 R$ · la venta de hoy, 957,01 Bs  →  189,99
```

Con sus cifras eso es **+9,5 % ofreciendo 172,00**, donde veía +8,5 %. Vale en
las dos direcciones: si lo que falta son los bolívares, sale la compra de hoy con
su última venta.

- **SUSTITUYE al suyo, no se pone al lado.** Dos suelos parecidos para la misma
  pregunta es lo que ya hizo que dejara de fiarse de los dos.
- **El rótulo dice de dónde sale cada mitad**, con las dos tasas escritas. Un
  tercer número sin explicar cómo se hizo hace que dejen de creerse los tres.
- **Y el aviso de arriba no puede contradecirlo.** Decía *"no hay suelo de
  mercado"* con un suelo justo debajo — la misma contradicción del ARREGLO 60.

### Un tablón vacío no se lo cree nadie

Brasil tiene cientos de anuncios a cualquier hora, así que `data: []` casi nunca
significa "no hay": significa que **nos están filtrando en silencio**, con un 200
y la lista vacía en vez de un 403 que se vea. Dos cosas salen de ahí:

- **Se repite lo que dijo Binance** —`success`, `code`, `message`, `total`— en vez
  de suponerlo (`_porque_vacio`). Solo se ve desde dentro de `_pedir_tablon`, con
  el cuerpo de la respuesta delante.
- **Se pregunta UNA vez más con el cuerpo mínimo** (`sencillo=True`), sin
  `clientType`, `payTypes` ni `publisherType`. Si son esos campos los que vacían
  una moneda, lo arregla en el acto; si no, el motivo lo dice. Solo cuando ya vino
  vacío —una lectura buena no cuesta ni una llamada más—, solo una vez, y **nunca
  cuando Binance no contestó**: ahí el problema no es el cuerpo, y gastar otra
  llamada contra un 403 es pedir que corten más. Las cabeceras no cambian en ese
  segundo intento: mover dos cosas a la vez no diría cuál fue.
- **Y se sondea la misma moneda al revés** (`_sondear_otro_lado`). El 30/09 los
  reales devolvieron `total 0` —Binance diciendo *"todo bien, no hay nada"*— con
  la pregunta simple igual, mientras el tablón de bolívares, **desde el mismo
  servidor**, traía 20 anuncios. No es un bloqueo general: le pasa algo a esa
  consulta. Desde fuera las dos posibilidades se ven idénticas, y esto las
  separa: *el otro lado sí trae anuncios* → el tablón existe y solo se vacía ese
  sentido; *el otro lado también vacío* → Binance no le sirve tablón de esa
  moneda a este servidor, **y esa tasa no se va a poder leer sola**. Lo segundo
  no es una mala noticia que haya que esconder: es la respuesta, y convierte el
  suelo mixto en lo definitivo en vez de un parche.

### El tablón SE MUEVE: el monto no puede ser todo o nada

El 29/09 por la noche dos anuncios de VES aceptaban sus 112.000 Bs y salió la
lectura. **A la mañana siguiente había 20 anuncios y ninguno los aceptaba**, y la
pantalla se quedó sin número. El monto medido de sus lotes es correcto; lo que
estaba mal era exigir que **un solo anuncio** se comiera la operación entera a
cualquier hora.

```
de los 20 anuncios de VES, ninguno acepta 112.000      ← antes: sin lectura
se midió al mayor que sí dan: los bolívares a 45.000   ← ahora
```

- **No se coge el anuncio más grande y ya.** Eso es leer UNO, que es justo lo
  que el filtro del monto existe para evitar. Se busca el mayor monto que
  todavía acepten **tres** (`MERCADO_MIN_ANUNCIOS`), y solo si ninguno llega a
  esa cuenta se cae al que tenga **más anuncios**, con el monto más alto para
  desempatar.
- **El monto usado va en `monto` y el suyo en `montoPedido`**, solo cuando no
  coinciden. La tarjeta lo dice y el pie deja de prometer *"a tu monto"*. Un
  precio medido a otro volumen presentado como el suyo la haría publicar contra
  una tasa que a su tamaño no existe.
- **Y los dos montos por fin se pueden editar** (Configuración → *Tamaño de tus
  operaciones*). `_pedirMercado` los leía de `S.config` desde el ARREGLO 75 y
  **no había dónde escribirlos**: se le dijo dos veces que bajara el monto ahí y
  el campo no existía. Al guardarlos se tira la lectura que hubiera y se vuelve a
  pedir — se midió a otro monto—, y dejarlos en blanco vuelve a los medidos, no
  a cero.

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
- **Y sí se pueden situar: la hora nunca se perdió** (ARREGLO 72). `_newUid()` es
  `Date.now().toString(36)+"_"+azar`, así que **cada registro creado con él lleva
  su hora exacta dentro del id**. `ajustesDesdeApertura()` solo miraba `a.ts` y
  tiraba un dato que estaba ahí al lado. Comprobado con sus 109 ajustes: **109 de
  109** se decodifican y **109 de 109** dan la misma fecha que el campo `fecha`.
  El rango es la guardia (`_tsDeUid`): un id de los viejos leído en base 36 se
  dispara fuera de cualquier fecha creíble y se descarta en vez de inventarse una
  hora. **Esto vale para cualquier cosa que lleve `_uid`**, no solo los ajustes —
  las remesas también.
- **La hora de la apertura se deduce de `aperturaBase.bruta`.** Es la ganancia que
  llevaba el mes **en el instante** de fijarla, así que reconstruyendo la bruta
  acumulada operación por operación se ve entre qué dos cae. Con su export:
  `aperturaBase.bruta` = 152,33 y la acumulada pasa de 142,99 (remesa 670, 17:45)
  a 152,96 (remesa 112, 17:46). No cuadra al céntimo —sobran 0,63, porque hoy las
  operaciones se revaloran con otras tasas— pero el salto entre operaciones es de
  **9,34**, así que la ventana aguanta el ruido. Sus 7 ajustes quedan **2 antes y
  5 después**, y el más cercano está a **más de tres horas** de la frontera.
  `_deducirHoraApertura()` recorta las listas para medir y **las devuelve en un
  `finally`**: si saliera por una excepción a mitad, la app se quedaría sin
  remesas. Cuesta ~370 ms, así que corre **solo al pulsar el botón**, nunca al
  dibujar.
- **Es una DEDUCCIÓN, así que no se aplica sola.** El aviso enseña la hora y el
  monto de cada uno, y `situarAjustesEnElAire()` simula el número que va a quedar
  antes de preguntar — el mismo criterio que corregir la fecha. Se guarda solo
  `aperturaTs`; el monto y la fecha no se tocan. Y avisa de lo incómodo:
  **situarlos SUBE el "sin explicar"**, de +59,28 a +274,66 con su export, porque
  un ajuste que pasa a contar se da por explicado y sale de la diferencia. No
  aparece dinero nuevo: lo que había estaba detrás del aviso.
- **La tarjeta dice contra qué apertura mide** —fecha, monto y si tiene foto de
  saldos—. Una apertura sin foto no permite comparar cuenta por cuenta cuando
  algo no cuadra, y eso no se veía en ninguna parte.
- **El monto y la fecha se corrigen por separado** (ARREGLO 63).
  `corregirApertura()` arregla el monto; `corregirFechaApertura()`, la fecha.
  La fecha también se queda mal —el 14/09 la fusión pegó la fecha de un aparato
  al monto del otro— y para eso la única salida era volver a fijarla con el
  dinero de hoy, que es justo lo que no hay que hacer. Ninguno de los dos toca
  `aperturaSaldos`, `aperturaTs` ni `aperturaBase`: el dinero se midió en un
  instante y sigue siendo el mismo; lo que se corrige es la etiqueta.
- **Corregir la fecha SIMULA antes de preguntar.** `_simularConFecha()` calcula
  la conciliación con la fecha nueva y enseña el "sin explicar" que va a quedar,
  antes y después. Un botón que dice "cambia la fecha" y no dice a qué número te
  lleva hay que usarlo dos veces para entenderlo. La simulación devuelve la
  fecha a su sitio **en un `finally`**: si no, mirar el resultado ya sería
  haberlo aplicado.
- **Cambiar de MES es lo único que puede salir mal, y se avisa.** `aperturaBase`
  guarda lo que iba del mes **en que se fijó**, para no contarlo dos veces; al
  mover la fecha a otro mes esa foto deja de corresponder y el mes que entra se
  suma entero. Medido con su export: pasar del 12/09 al 30/08 lleva el "sin
  explicar" de −$47,85 a **+$836,87**. Por eso la simulación va primero — el
  número lo canta solo, sin que nadie tenga que creerse el aviso.

### El interés de un préstamo no es capital hasta que se cobra

Sus palabras: *"presto una cantidad pero por los intereses cobro más"*.

Un préstamo guarda **dos** montos: `p.capital` es lo que entregó y `p.monto` es
lo que le tienen que devolver, capital + interés. De la cuenta sale solo el
capital. `capitalRealTotal()` contaba `p.monto` entero como dinero suyo, así que
**el día de prestar "tienes de verdad" subía el interés entero** sin que
"deberías tener" se moviera, y ese interés salía como **sobrante sin explicar**
hasta que el cliente pagara. Reproducido con sus datos:

```
antes ................  sin explicar  +59,28
prestas 100 (+20) ....  sin explicar  +79,28   ← subió el interés entero
cobras las 120 .......  sin explicar  +59,28   ← volvió solo
```

Con préstamos nuevos cada semana, ese sobrante no paraba de crecer.

- **En el capital entra el capital pendiente**; el interés pendiente sale aparte
  (`interesPrestamos`) y se ve en la tarjeta, dicho: *"aún no son tuyos"*. No se
  esconde — es dinero que le van a pagar— pero no suma.
- **La fracción de interés vive en `_fraccionInteresPrestamo()` y en ningún otro
  sitio.** La leen las dos cuentas que tienen que sumar el interés pactado: lo
  ya cobrado (`gananciaPrestamosDelMes`) y lo que falta (`capitalRealTotal`). Es
  la misma regla que ya obliga a `cronogramaCuotas()`.
- **Y la otra mitad, que es la que no se ve venir:** la apertura se contó con el
  interés de los préstamos que ya estaban vivos ese día. Si el capital deja de
  contarlo y la apertura sigue llevándolo, queda un **hueco fijo que no cierra
  nunca**, porque no es dinero: es el punto de partida mal puesto. Sus tres
  préstamos con interés son del 15/08, 20/08 y 09/09, todos anteriores a la
  apertura del 11/09 — sin esto, el arreglo le habría abierto un −25,15 que no
  existe. Lo descuenta `interesDentroDeApertura()` al medir; **el número guardado
  no se toca**, porque volver a fijar la apertura es justo lo que no hay que
  hacer y corregirla a mano obligaría a acertar un número que la app calcula sola.

Comprobado: el "sin explicar" de su export no se mueve ni un céntimo (59,28
antes y después), y prestar con interés ya no lo toca.

#### Pero eso solo vale para una apertura VIEJA (ARREGLO 149)

Lo vio ella el 16/10, minutos después de fijar la apertura para arrancar de cero:
la app decía **"te sobran $6,54"** con todo lo demás cuadrado.

**Y esos 6,54 eran el interés pendiente de UN préstamo suyo.** El descuento de
arriba está escrito para una apertura fijada **antes** del 71, que sí llevaba el
interés dentro. Una fijada **después** guarda `capitalRealTotal().total`, que ya
no lo cuenta —lo dice el propio aviso al fijarla— así que restárselo abre el
mismo hueco permanente, **al revés**: el punto de partida está bien y la medición
lo rebaja. Medido con su export:

```
                      deberías      te sobran
sin la bandera        2.698,17         6,54
con la bandera        2.704,71         0,00
su apertura vieja del 11/09: intAp 25,20, sin tocar
```

- **Al fijar se marca `aperturaSinInteres`**, y `interesDentroDeApertura()` sale
  por ahí **antes** de recorrer los préstamos. Las aperturas viejas no la llevan
  y siguen descontando, que ahí sí hace falta.
- **La bandera viaja DENTRO de `_MERGE_BLOQUES`**, con el monto. Fuera, la fusión
  podría dejar el monto de un aparato con la bandera del otro: el interés se
  descontaría dos veces o ninguna, que es exactamente el fallo. Es la regla del
  ARREGLO 60 — un monto sin su bandera no se puede interpretar.
- **Los dos correctores NO la tocan.** `corregirApertura()` y
  `corregirFechaApertura()` arreglan la etiqueta, no el dinero medido: si la
  quitaran, corregir un monto reabriría el hueco sin decir nada. Hay guardia.
- **Y lo que esto NO repara: una apertura ya fijada no lleva la marca.** Hay que
  volver a pulsar el botón una vez. Es la regla de siempre.

#### Y al aviso de fijarla le faltaba la mercancía (ARREGLO 149)

Fallo mío del ARREGLO 143. El TOTAL sí contaba la mercancía y las filas de
arriba no, así que el desglose no se podía sumar a mano:

```
En cuentas 946,97 + reserva 198,70 + por cobrar 64,52 + préstamos 1.284,52 = 2.494,71
TOTAL                                                                        2.704,71
                                                      ← la mercancía, 210,00
```

Y este aviso sale **justo antes** de pulsar el botón que fija el punto de partida
de toda la conciliación: ahí un desglose que no cuadra es lo que hace dudar del
número correcto. La guardia mide sobre el **texto del aviso**, no sobre la
función entera — `cap.enReserva` sale también en el `logAudit` de abajo, así que
quitar su fila pasaba.

### La apertura cambiaba sola, y no quedaba rastro (ARREGLO 94)

Sus palabras: *"en el saldo de apertura días atrás me decía un saldo y ahorita me
dice que el saldo de apertura es otro monto, es como que si a escondidas se
modificara"*.

No se modificaba a escondidas: **se la cambiaba el otro aparato**. En un solo
dispositivo la apertura solo la tocan tres botones, los tres con confirmación —
pero `_aplicarEstadoDeApi()` adopta lo que contesta el servidor, y ahí entra
entera (`_MERGE_BLOQUES`, ARREGLO 60). El aviso del ARREGLO 67 cubría el choque:
cuando ella la cambió **aquí** y el servidor devolvió otra cosa. Si no la tocó en
este aparato no hay marca, no hay choque, y **no salía nada**.

Y lo peor no era que cambiara: era que **no quedaba con qué contestar "¿cuánto
era antes?"**. La apertura es el punto de partida de toda la conciliación — si se
mueve, se mueve el "sin explicar" — y no había historial de ninguna clase.

- **El historial es `S.histApertura`**, indexado por fecha, así que va en
  `_MERGE_HISTORIAL` **y** en `DATA_KEYS`: se une entre los dos aparatos en vez de
  pisarse. Si se reemplazara, el que guarda último borraría las líneas del otro.
- **La apertura son DOS cosas, el monto y la fecha**, y las dos se mueven. Van
  juntas en `_fotoApertura()` porque *"empezaste el 11/09 con $2.544,79"* es una
  sola frase. La fecha también se queda mal: pasó el 14/09.
- **Los CUATRO escritores la apuntan**: `fijarAperturaHoy()`,
  `corregirApertura()`, `corregirFechaApertura()` y la adopción del servidor.
  Dejarse uno fuera es volver a que cambie en silencio, y la prueba los exige los
  cuatro por nombre.
- **La foto de ANTES se toma antes de adoptar.** Tomada después, los dos valores
  son el mismo y no hay cambio que detectar nunca. (La guardia de esto se escribió
  primero con un `indexOf` a secas y **pasaba con la línea borrada**: `-1` es menor
  que cualquier posición. Hay que exigir además que exista.)
- **Dos cambios en el mismo milisegundo se pisaban**, porque la clave es la hora
  ISO. Si está tomada se le añade un sufijo — y así el tope de 60 líneas se puede
  medir, que antes no.
- **El aviso no se repite con el del 67.** Dos avisos del mismo suceso se leen
  como dos sucesos.

#### Y la tarjeta ahora abre contestando lo suyo

Sus palabras: *"me gustaría que me dijera, por lo menos, empezaste el día 11/09
con tanto de saldo, y hoy tienes tanto, que está tanto en la cuenta, tanto en
préstamo, tanto en remesa por cobrar, tanto en reserva, o sea, detallado. Y
obviamente me diga allí la diferencia… pero yo no quiero ver tantas cosas
escritas en la aplicación, porque realmente se pierde el foco de qué es lo que
realmente sirve ese botón"*.

La tarjeta abría con el veredicto —*"sobra sin explicar $X"*—, que es la pregunta
del **contador**. La suya es otra y es anterior: cuánto tenía el día que empezó,
cuánto tiene hoy, y a qué se debe el salto. Las dos cuentas ya estaban, pero
repartidas y detrás del desplegable.

**Las filas tienen que SUMAR el salto, al céntimo.** La identidad sale entera de
`conciliacionCapital()` y no se calcula nada nuevo:

```
deberias    = apertura − intAp + bruta − egEmpresa − egPersonal − socios − traspPers
diferencia  = tienes − deberias
sinExplicar = diferencia − ajustes − tasas

⇒ tienes − apertura = (bruta − egEmpresa − egPersonal − socios − intAp − traspPers)
                      + ajustes + tasas + sinExplicar
```

**El primer intento dejó fuera los ajustes a mano y el desfase de tasas**, y la
lista no cuadraba con el total que ella tiene justo encima. Una tarjeta que no se
puede sumar a mano es peor que no dar el desglose. Medido con su export: salto
−13,98 y la suma de las filas −13,98, descuadre **0**.

- **La tabla vieja "De qué está hecha la diferencia" se fue al desplegable**,
  porque desde que el resumen lleva sus filas decía lo mismo dos veces. Sigue
  entera ahí, porque parte la diferencia por el **otro** lado: contra "deberías
  tener" en vez de contra la apertura.
- **Pero los AVISOS no se van con ella.** Al moverla se llevó dentro el de
  *"algún ajuste es de una moneda sin tasa"* — uno de los que CLAUDE.md ya exige
  siempre a la vista, porque dice que hay dinero que la cuenta de arriba **no
  está contando**. Lo cazó una guardia de hace cuatro arreglos. Está fuera otra
  vez, y el de *"no sé por qué"* con él.
- **Un saldo de socio NEGATIVO se dice "cobrado", no "pagos" en negativo.** Con
  sus datos vale −0,54: el socio le debe. Es la misma regla del ARREGLO 57
  —apartar un número negativo no significa nada— aplicada a esta fila.

### El mismo gasto personal se restaba DOS veces (ARREGLO 96)

Un gasto personal pagado desde una cuenta 💜 **personal** se restaba de "deberías
tener" por `egPerPagPropio`. Pero una cuenta 💜 **no está dentro del capital de la
empresa** —comprobado: sumarle 1.000 a una 💜 no mueve "lo que tienes"— así que ese
dinero **ya había salido** cuando se traspasó a esa cuenta, y `traspasosAPersonal()`
ya lo restó. Se restaba dos veces.

Las dos mitades se veían una encima de la otra en la propia tarjeta:

```
12/09  traspaso  BINANCE SAIPA → MI SUELDO BINANCE 💜   51,52 USDT
18/09  gasto     "CAMIDA PARA LA CASA", desde 💜        51,52 USDT

Gastos personales            −$51,52
Pasado a cuentas personales  −$51,52   ← el mismo dinero
```

Lo arregla `egresosPersonalesDesdeCuentaPersonal()`. Los pagados desde una cuenta
**de la empresa** se siguen restando: esos sí salieron de ella.

**El corte de fecha es el MISMO que usa la resta a la que corrige**
(`traspasosAPersonal`): `iso > desdeIso`, y los del mismo día aparte. No es un
detalle — un descuento con otro corte que la resta que corrige deja un hueco o
cuenta de más.

**Y lo que NO hay que hacer nunca: cambiarlo en `_acumuladosMes`.** `aperturaBase`
guarda el valor con la definición vieja, así que el mes nuevo menos la base vieja
daba **−471,13** con sus datos y le inventaba capital. Hay una guardia que exige
que `_acumuladosMes` siga leyendo `egPerPagPropio` tal cual.

Medido en sus dos exports, y **el segundo importa tanto como el primero**:

```
                  antes      después
19/09          59,28 ⚠️    7,76 ✅ Cuadra
hoy 06/10     716,61 ⚠️  506,06 ⚠️
```

Quita **210,55** de doble descuento, pero con los datos del 06/10 **no la deja en
cuadra**: lo que queda es otra cosa (la tarjeta de crédito sin modelar y lo de
PagBank sin reparar). Un arreglo que se presenta como "ahora cuadra" cuando en sus
datos de hoy no cuadra es peor que no arreglarlo.

### Balance de Cuentas: la lista tiene que poder sumarse (ARREGLO 141)

Salió de pedirme ella que evaluara esa pestaña el 15/10. Medido con su export,
cinco identidades cuadran y **una no**:

```
la cifra grande = sus cajitas    1.275,99 + 1.159,94 + 198,78 + 7,92 − 91,67 = 2.550,96  ✅
GANASTE − CRECIÓ = DIFERENCIA    313,90 − 6,17 = 307,73                                   ✅
Salud de cartera = En cuentas    0,06 + 617,52 + 40,96 + 617,45 = 1.275,99                ✅
TOTAL EMPRESA = cuentas − sueldo 1.275,99 − 91,67 = 1.184,32                              ✅
las filas de "de dónde sale"     suman −216,06 donde la diferencia dice −307,73           ❌
```

**Faltaban 91,67 exactos: su sueldo.** `capitalRealTotal()` lo descuenta desde
que entró esa regla —y la conciliación lo resta en los **dos** lados, así que el
*"sin explicar"* nunca estuvo mal por esto— pero el desglose del ARREGLO 100 no
tenía fila para él. Una lista que no se puede sumar a mano es peor que no dar el
desglose: es el 34,27 contra el 34,28 otra vez.

**Y la guardia del 100 no lo cazó porque solo exigía las filas que HAY.** La
nueva compara los dos lados: **cada término que `conciliacionCapital()` le resta
a `deberias` tiene que aparecer en el bloque de `_filas`**, salvo los que ya
viven dentro de `_enPapel`. El día que alguien añada otro, falla hasta que tenga
su fila.

- **Un número se escribe UNA vez** (ARREGLO 125). El primer intento puso la
  explicación del sueldo en una línea debajo del total **y** en el bloque, y el
  91,67 salía **cuatro veces** en la pantalla. Dos de ellas son aritmética que
  no se puede quitar —la cajita que suma el total y la fila que suma la
  diferencia—; las otras dos estaban pegadas, así que se dicen juntas: la
  explicación vive donde ya está el botón. Quedan tres.
- **Los porcentajes de Salud de cartera suman 100.** Redondeando cada uno por su
  cuenta el resto se pierde (medido: 99 %), y una distribución que no llega a 100
  se lee como que falta dinero por clasificar. El sobrante va al mayor, que es el
  único al que un punto no le cambia la lectura, y **se calcula una vez** para la
  barra y su rótulo.
- **El aviso de préstamos del Resumen tenía su propia cuenta** y sumaba
  `p.monto`, o sea capital + interés: decía **1.166,48** donde el Balance dice
  **1.159,94**. Ahora sale de `capitalRealTotal()` y el interés se nombra aparte
  (ARREGLO 71: no es suyo hasta cobrarlo).

#### Las cuentas en cero se pliegan, no se borran

Sus palabras del 15/10: *"las cuentas que no tengan nada, que estén en 0,
deberían de no estar ahí visibles"*. Medido: **15 de sus 23** cuentas están en
cero, y de las que ve —la lista ya esconde las desactivadas— son **9 de 17**.

Se pliegan detrás de una línea (*"9 cuentas en 0,00 · ninguna tiene dinero —
ver ▾"*), y eso **no es llevarle la contraria: un cero puede ser el dato**. La
TARJETA PAGBANK en 0 significa que no debes nada, y MI SUELDO BINANCE en 0 es
justo lo que dice que el sueldo no se apartó. Un saldo en cero que debería tener
dinero es lo que ella querría ver — la misma regla que el Cierre de Mes ya
aplica. Plegado está a un toque; borrado, no está.

- **Desplegar no llama a `R()`** (ARREGLO 32), y las de cero se dibujan con la
  **misma** función de fila, no con una versión recortada.
- La cabecera de grupo mira **la lista en la que va la fila**, no `capOrdenado`:
  partida en dos, las de cero empezarían sin su título.

#### Y el sueldo con su botón, no con letricas (ARREGLO 141)

Sus palabras del 15/10: *"quiero que en todos lados lo que es el sueldo que saca
la empresa para mí esté con su tarjeta y apartado, y no solo letricas escritas"*.

**Y la tarjeta con el botón YA existía** desde el ARREGLO 105 — enterrada en
Egresos → sub-pestaña **Personal**, que no es la que abre. En las dos pantallas
donde ella mira el dinero (Balance de Cuentas e Inventario USDT) solo había una
frase. O sea: letricas.

De tres maquetas medidas en su teléfono eligió la **B**:

```
A · una línea                 62 px
B · línea + "ver detalle ▾"   78 px   ← elegida
C · la tarjeta entera        303 px   ← se queda en Egresos → Personal
```

El criterio es suyo y es el de siempre: *"no me gustan las pantallas
saturadas"*. Lo que se ve sin pedirlo es cuánto falta y el botón; el detalle
—acumulado, apartado, en qué cuentas 💜— se mira una vez al mes y vive detrás de
un toque.

- **`_htmlSueldoSinApartar()` se retiró.** Decía lo mismo que el bloque pero sin
  botón, así que con los dos puestos la pantalla lo contaba dos veces. Una
  pantalla nueva **quita** el control viejo (ARREGLO 98).
- **El bloque se escribe UNA vez** y lo leen las dos pantallas. Lo que cambia es
  la cola: en Balance el total ya lleva el sueldo restado y en Inventario no
  —esas cifras son saldos en crudo— así que decir *"ya descontado"* allí sería
  mentir al lado del número que lo desmiente.
- **Las cuentas de origen salen de `_ctasOrigenSueldo()`**, que las leen el
  bloque y la tarjeta de Egresos. **Deja fuera las que están en cero y ordena por
  saldo**: antes la primera opción era BINANCE JULIO ($0,00) y el botón
  contestaba *"no tiene saldo, elige otra"* — hacerle perder el viaje con un dato
  que la app ya tiene.
- **El botón no mueve dinero**: deja el traspaso escrito y lleva a Traspasos.
  Comprobado pulsándolo en Chromium: ninguna cuenta se movió y no se guardó
  ningún traspaso hasta confirmarlo.
- **`_ctaSinDinero()` NO es `_saldoConProblema()`.** Un cero no es un problema,
  es un dato. Escrito suelto, la guardia del ARREGLO 119 lo confunde con lo otro
  —y con razón: son dos preguntas distintas sobre el mismo campo.

#### Y el camino se lee sin abrir nada: de qué cuenta sale y a cuál va

Sus palabras del 15/10: *"en apartar mi sueldo debe de salir de una cuenta
empresa a mi cuenta sueldo"*.

**Y ya salía** —`DOLAR FISICO → MI SUELDO BINANCE`, probado pulsándolo en
Chromium— pero eso solo se veía abriendo *"ver detalle"*, así que desde fuera no
había forma de saberlo. De tres maquetas eligió la **3**: el camino escrito
debajo del monto, y el plegable pasa a ser lo que de verdad es, *"cambiar de
dónde sale ▾"*. Son 80 px contra los 62 de antes.

- **La cuenta que se NOMBRA es la que el botón va a usar.** Las dos salen de
  `_ctasOrigenSueldo()[0]`, que es también lo que el `<select>` deja marcado.
  Escrito aparte, un día la línea diría una cuenta y el dinero saldría de otra —
  el 34,27 contra el 34,28, pero con dinero moviéndose.
- **Cambiar la cuenta refresca la línea por su id** (`_pintarRutaSueldo`). Ni
  `R()` —cerraría el selector bajo el dedo (ARREGLO 32)— ni nada, que dejaría
  arriba el nombre de la anterior (ARREGLO 55).
- **El rótulo del plegable se escribe en UN sitio** (`_rotDetalleSueldo`). El
  dibujado ponía *"cambiar de dónde sale ▾"* y `_verDetalleSueldo()` volvía a
  escribir *"ver detalle ▾"* al cerrarlo: **el enlace cambiaba de nombre solo.**
  Ninguna guardia de texto lo habría visto —las dos cadenas eran correctas cada
  una por su lado— y lo cazó pulsarlo en Chromium. ARREGLO 121 otra vez.
- **Y su pregunta de los dos números baja al plegable.** La maqueta 3 usa esa
  línea para el camino, así que *"ya está descontado del total de arriba: en
  cuentas hay $1.275,99 y la empresa tiene $1.184,32"* vive dentro, donde no
  cuesta alto. Escrita además fuera, el 91,67 saldría **cuatro** veces en la
  pantalla (ARREGLO 125), y dos de esas cuatro son aritmética que no se puede
  quitar: la cajita que suma el total y la fila que suma el salto.

#### Los cuatro recortes, y uno REVIERTE una regla de este documento

Sus palabras del 15/10: *"dalance de cuenta ocupa mucho la pnatalla"*. Medido en
su teléfono (412 px) con su export, antes y después:

```
                                       antes    después
alto de la pestaña                   2.053 px   1.553 px   (2,9 → 2,2 pantallas)
  el desglose "de dónde sale"          plegado      −127
  Salud de cartera                     plegado      −219
  los totales por moneda del final     fusionado    −126
  el aviso "Solo lectura…"             quitado       −46
```

**El que revierte una regla es el primero.** Desde el ARREGLO 48/60/94/99/100
estaba escrito aquí que ese desglose se ve **sin desplegar nada**, *"porque es lo
que convierte un número en algo que se puede perseguir"*, y había una guardia que
lo exigía. Lo revierte ella, igual que revirtió la tasa fijada a mano (ARREGLO
131). **No se borra, y eso es lo que salva la regla vieja:** la cifra de la que
cuelga dice *"de dónde sale ▾"* y lo abre de un toque. Lo que se escondió alguna
vez y hubo que sacar a rastras fueron los **avisos**, y esos siguen fuera: esto
es un desglose, no una alarma. La guardia ahora exige las tres mitades —que las
filas se dibujen, que la cifra las abra diciéndolo, y que abrirlas no llame a
`R()`—; faltando cualquiera vuelve el fallo.

- **Salud de cartera se pliega, pero sus avisos no.** La línea cerrada dice
  *"⚠️ 2 en negativo"* o *"💱 1 sin tasa"*, y solo cuando no hay ninguno de los
  dos enseña el riesgo global. Mirando una sola de las dos cosas, la otra se
  queda dentro del plegable sin que nada lo diga — y hay guardia para eso.
- **Los totales por moneda se fusionan con la distribución.** Decían lo mismo
  —cuánto tengo en cada moneda— 126 px más abajo y sin el equivalente en USDT,
  así que para comparar las dos cifras había que subir y bajar. Ahora es una fila
  por moneda con las dos. Una pantalla nueva **quita** el control viejo (ARREGLO
  98). Comprobado contra la versión anterior: las cuatro cifras nativas salen
  **idénticas** (VES 58,54 · USDT 617,45 · BRL 3.118,99 · PEN 140,00), y el orden
  pasa a ser por lo que pesan en USDT, que es la regla del ARREGLO 87.
- **El nativo se recorre APARTE de `distMon`.** `distMon` solo suma los saldos
  **positivos** —es un reparto de riesgo, y un negativo no reparte nada— y el
  total nativo tiene que llevar lo que de verdad hay. Mezclarlos daría un
  *"tienes"* que no es el que suman las cuentas de abajo.
- **El aviso "Solo lectura" se fue.** 46 px permanentes diciendo lo que esta
  pantalla **no** hace. Un aviso que nunca cambia deja de leerse (ARREGLO 99), y
  este además no previene ningún error: ninguna fila ofrece crear ni borrar, y lo
  que sí se puede hacer desde aquí —corregir un saldo— ya tiene su ✏️ en cada
  fila.
- **Los cuatro plegables cambian el `display` por su id, ninguno llama a `R()`**
  (ARREGLO 32), y se pulsaron de verdad en Chromium: abren, cierran, y el rótulo
  vuelve al que tenía.

Medido después: las cinco identidades de la pestaña siguen cuadrando al céntimo
—incluida la del desglose, descuadre **0,00**— los porcentajes suman 100, y el
barrido de las 29 pestañas da **0 errores**. 22 pruebas negativas, 22 cazadas.

#### Y el 💜 TOTAL PERSONAL era invisible en Suave (ARREGLO 142)

La cabecera **🏢 TOTAL EMPRESA** va sobre `--fondo-osc`, que es **siempre
oscura** elija el tema que elija. El bloque 💜 de al lado estaba pintado con
nombres del tema (`--az5-g`, `--mo6-c`), y en **Suave** —el que abre— esos dos
valen el morado oscuro. Medido en Chromium, el mismo contraste en los dos:

```
            rótulo   número
suave         1,04     1,04   ← invisible
claro         6,71     9,11
papel         6,71     9,11
```

Por eso desde la PC no se veía nunca: ella abre en Suave, pero con el tema Claro
puesto el bloque se lee perfectamente. Es **la misma regla por tercera vez** —las
pantallas de entrada y el flyer— con otra cara: *lo que NO sigue al tema no se
pinta con nombres del tema*. Ahora son `--per-rot` y `--per-num`, declarados una
vez en `:root`, que ningún tema vuelve a definir. Quedan en **8,07** y **10,94**,
mejor que en Claro porque esa cabecera es más oscura que el panel.

Las tres guardias son las mismas que ya protegen `--ent-*` y `--fly-*`: que se
declaren una sola vez, que ningún bloque de tema los repinte, y que la cabecera
💜 no use ningún otro nombre.

Medido en Chromium con su export: la pestaña pasa de **199 a 152 líneas** y de
**17 a 8** filas de cuenta a la vista. 29 pestañas, 0 errores, 11 pruebas
negativas y las 11 cazadas.

### El sueldo se calcula pero NO se aparta (medido, pendiente)

Sus palabras: *"la aplicación lo suelta pero no lo separa… no hay un apartado donde
me diga mira, tienes que hacer un traspaso de tal cuenta a tal cuenta para apartar
tu sueldo"*.

Tiene razón, y está medido con su export del 06/10:

```
pct_sueldo ................  30 %
utilidad de la empresa ....  296,79
sueldo del mes ............   89,04   ← el "$90 a mi favor" que ve en Personal
acumulado de antes ........    2,63
MI SUELDO BINANCE 💜 ......    0,00   ← nunca se apartó nada
```

**Y el capital de la empresa NO lo descuenta.** Comprobado subiendo `pct_sueldo` al
50 %: `capitalRealTotal()` devuelve **2.615,28 antes y después**. O sea que la app
dice que la empresa tiene 2.615,28 cuando 89,04 de eso ya son de ella.

Es un número, no un movimiento: se acumula en teoría y no sale de ninguna cuenta
hasta que ella haga el traspaso a mano — y la app no se lo dice en ninguna parte.

**Lo que falta, cuando se toque:** una tarjeta que diga cuánto lleva acumulado, en
qué cuenta debería estar, y el botón que haga el traspaso. Y decidir si el capital
de la empresa debe descontarlo — **eso le cambia los números y es decisión suya**.

### La tarjeta de conciliación: un solo número grande

Sus palabras: *"mucha letra, no es fácil de entender, nunca está en 0 siempre
tiene un desajuste"*.

Tenía **dos números grandes compitiendo** —la diferencia bruta y el sin
explicar— y **tres tablas** debajo, 14 filas entre las dos restas.

- **Manda uno solo: el que hay que perseguir.** El titular dice `✅ Cuadra` o
  `⚠️ Falta / Sobra sin explicar $X`, y nada más.
- **La resta que ella hace a mano sigue entera, en una línea pequeña**: *"Tienes
  $2.530,81 · deberías tener $2.539,97 · te faltan $9,16"*. El ARREGLO 69 está
  ahí porque esconderla la dejó sin entender de dónde salía el titular; lo que
  cambió es la jerarquía, no lo que se dice.
- **Las dos restas completas se van al desplegable.** Se leen cuando algo no
  cuadra y estorban las otras cien veces.
- **Lo urgente sigue fuera**: los ajustes que no se pueden situar, la moneda sin
  tasa, la apertura vieja y el desglose de la diferencia — que es lo que
  convierte un número en algo que se puede perseguir.
- **El color va con el titular.** Seguía a la diferencia bruta, así que la
  tarjeta salía **roja** con un titular que decía *"Sobra sin explicar $59,28"*.
  El color se lee antes que la letra: si dice lo contrario, manda el color. Y
  dentro del margen, la resta se dice sin color de alarma — un "te faltan" en
  rojo dentro de una tarjeta verde es la misma contradicción al revés.
- **"Nunca está en 0" no se arregla poniéndolo en 0.** Un desvío pequeño es
  ruido de tasas, no una fuga; por eso existe la tolerancia. Dentro del margen el
  titular dice **Cuadra** y no enseña ninguna cifra roja.

#### Y aun así decía TRES cosas a la vez (ARREGLO 99)

Sus palabras: *"no lo veo práctico, esas cosas amarillas, mucha letra para
leer"*. Con sus datos del 06/10 la tarjeta enseñaba, una debajo de otra:

```
Diferencia           +$23,16   verde
te faltan           −$127,66   rojo
Sobra sin explicar  +$215,47   ámbar
```

Las tres son correctas y suman bien. Juntas, no se puede saber cuál mirar — es
el mismo fallo del ARREGLO 60 y del 71, por tercera vez y en otra forma.

- **El contenedor dejó de pintarse del color de la alarma.** Pintado así, el
  bloque de *cuánto tienes* —que no tiene nada de malo— salía dentro de un
  recuadro ámbar. **Eso son "las cosas amarillas"**: el color lo lleva ahora
  solo el semáforo, en su borde izquierdo.
- **Lo que ella abre a mirar va primero y en grande:** cuánto tiene hoy, en un
  número de 28px, con cuatro cajitas debajo (en cuentas / prestado / en reserva
  / por cobrar). El veredicto es la pregunta del **contador** y baja a un
  semáforo de una línea.
- **La resta que ella hace a mano sigue entera** (ARREGLO 69: esconderla la dejó
  sin entender de dónde salía el titular), pero en letra pequeña dentro del
  semáforo, no compitiendo con él.
- **El rótulo de la apertura va en gris y solo el número lleva color.** Pintada
  entera de rojo, *"Empezaste el 11/09 con $2.544,79"* se lee como si la
  apertura tuviera algo malo.

**Los dos recuadros amarillos pasan a una línea cada uno**, con su número y su
botón al lado:

```
⚠️ 7 ajustes sin situar · −$239,02        [📍 Situarlos]
⚠️ 1 ajuste «no sé por qué» · cuenta dentro del sin explicar
```

**No se pliegan** —un aviso escondido no es un aviso, y estos dicen que hay
dinero que la cuenta de arriba no está contando— pero llevaban ahí sin cambiar
**desde el 11/09**: un aviso permanente escrito en tres renglones deja de
leerse. La guardia está anclada al `+(` que abre el ternario, porque escrita
sin ancla pasaba con el aviso ya apagado.

**Y las dos filas que NO son dinero van juntas en una.** De las nueve del
desglose, el desfase de las tasas y los intereses que ya iban en la apertura
eran las únicas que ella no puede perseguir ni corregir — y el desfase era **la
más grande de todas** (−$253,94 con sus datos), así que la lista parecía hablar
sobre todo de algo que no se puede tocar:

```
No es dinero (tasas + intereses)   −$279,16
```

Juntarlas **no rompe la suma**, que es la regla que aquí no se puede romper: la
fila lleva el total de las dos. Comprobado con su export del 06/10: salto
**−0,64** y suma de las filas **−0,64**, descuadre **0**.

**Lo que NO se hizo, aunque la maqueta lo proponía: plegar el desglose.** Esa
lista es lo que convierte un número en algo que se puede perseguir, y ya hay una
guardia de hace cinco arreglos que exige que se vea sin desplegar nada. Se
redujo (de 9 filas a 8) en vez de esconderla.

**Y una corrección sobre el diagnóstico, por si vuelve a surgir:** el desfase de
las tasas **nunca estuvo dentro del "sin explicar"** —`sinExplicar = diferencia
− ajustes − tasas` ya lo descuenta—. Lo que estaba mal era que ocupara la fila
más grande de una lista de cosas que perseguir.

#### Y la pregunta que había debajo de todo: ¿está creciendo? (ARREGLO 100)

Sus palabras, con la tarjeta del 99 delante: *"en uno arriba me dice que el saldo
de apertura fue de 2500 y algo, y me dice que debería de tener 2600 y que tengo
2500. O sea, no estoy entendiendo ese punto… lo que me interesa saber es que el
dinero realmente esté creciendo como dice. Y no que me digas 'ganaste este mes
200 dólares' pero resulta que no tengo de qué forma ver que sean 200 dólares,
porque el saldo sigue siendo el mismo."*

Son dos cosas y la segunda es la de verdad.

**Había DOS "deberías tener" y salían a la vez.** La lista de arriba iba de la
apertura a lo que tiene; el semáforo decía *"Tienes $2.544,15 · deberías tener
$2.669,23 · te faltan $125,08"*. Los dos son correctos y parten la **misma**
diferencia por lados distintos — pero juntos no hay forma de saber cuál mirar,
que es lo que ella dijo con esas palabras. Es el fallo del ARREGLO 60 por cuarta
vez.

**La resta no se borra: eso ya falló.** El ARREGLO 69 está ahí porque esconderla
la dejó sin saber de dónde salía el titular. Se fue al desplegable, **de cabecera
de la tabla que la desglosa**, y ahí sigue entera, con sus palabras ("te faltan",
"te sobran", "clavado"). Arriba manda una sola cuenta: la suya.

**Y la pregunta se contesta con tres cifras y cinco filas.** Medido con su export
del 06/10:

```
GANASTE    +$201,18   en el papel
CRECIÓ       −$0,64   tu capital
DIFERENCIA −$201,82   de dónde sale ↓

   Pasaste a tus cuentas 💜       −51,52   (sigue siendo tuyo)
   Tus bolívares valen menos hoy −253,94   ← la pieza grande
   Saldos que escribiste a mano   −87,88
   Intereses de la apertura       −25,22
   ⚠️ Sin explicar               +216,74
```

O sea: **sí ganó los 201, y están sobre todo en bolívares que hoy valen menos**
que cuando entraron. Es exactamente el riesgo que ella misma explicó —*"tener
muchos bolívares parados sí me perjudica"*— y no había manera de verlo en
ninguna pantalla.

**Y un error que es justo lo que tapaba la respuesta.** Esa fila se llamaba
*"No es dinero"*. Para su pregunta eso es **falso**: `efectoTasasDesde()` valora
cada movimiento a la tasa de **hoy** y lo compara con la ganancia que se apuntó
aquel día, así que lo que mide es, sobre todo, su dinero parado perdiendo valor.
Llamarlo "no es dinero" escondía la pieza más grande del hueco detrás de una
etiqueta que invitaba a no mirarla.

**Las filas tienen que SUMAR la diferencia, al céntimo**, y eso no se negocia
(es la misma regla del 34,27 contra 34,28). Sale entera de
`conciliacionCapital()` y no se calcula nada nuevo:

```
salto = (bruta − egEmpresa − egPersonal − socios) − intAp − traspPers
        + ajustes + tasas + sinExplicar
⇒ salto − enPapel = −traspPers − intAp + ajustes + tasas + sinExplicar
```

Comprobado: diferencia **−201,82** y suma de las cinco filas **−201,82**,
descuadre **0**. La guardia fija la **expresión entera**, no los nombres sueltos:
buscándolos a secas, la prueba negativa pasaba con el término multiplicado por
cero o renombrado a `co.egEmpresaX` — el nombre seguía ahí y la cuenta ya no.

**Y dos cosas que salieron de medir, no de pensar:**

- **Un saldo de socio NEGATIVO hacía desaparecer su fila** de la tabla de
  "deberías tener" (la condición era `co.socios>0`), así que la tabla dejaba de
  sumar su propio total. Ahora sale en los dos sentidos y en negativo dice
  *"cobrado"*, que es lo que es (ARREGLO 57).
- **Dos guardias se anclaban en texto suelto que un COMENTARIO puede repetir.**
  Un comentario de este mismo arreglo nombró *"De qué está hecha la diferencia"*
  8.000 caracteres antes que el rótulo de verdad, y las dos pasaron a medir otro
  trozo del archivo. **Ancladas al marcado** (`>…</div>`), que solo existe una
  vez. Es el mismo tipo de agujero que el ancla que dejó de existir en el 99.

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

**Y los 68 que quedaban ya están** (ARREGLO 159). No se habían hecho porque
son los que **otro sitio lee por `getElementById(...).value`**, y convertir el
campo sin arreglar también su lector es *peor* que dejarlo: cambia "no acepta
la coma" por "acepta la coma y se queda con 5 en vez de 5,22" — de un fallo que
se ve a uno que no. **Las dos mitades fueron en la misma pasada**: 45 campos a
`type="text" inputmode="decimal"` y sus 29 lectores a `_leerNumero()`.

Medido tecleando con el teclado español: el **% de su sueldo** con `30,5`
guardaba **0,3** —perdía el `,5`— y ahora guarda 0,305.

- **La normalización va en la PUERTA del setter**, no en cada llamada:
  `calcSetExotico`, `txEntregaSet` y `txPagoSet`. Un sitio nuevo que llame queda
  cubierto solo.
- **Y sólo los campos de dinero.** En los dos desgloses se normaliza `monto` y
  **no** `cuentaId`: un id no es un número y `_num()` lo dejaría en otra cosa.
- **El único `type="number"` que queda es el número de cuotas**, que es un
  entero con `inputmode="numeric"`: ahí la coma no significa nada.

**Y salió un bug de paso, de los que no se ven.** `calcTasaUpdate()` leía
`parseFloat(document.getElementById("calc-tc-brl")||{value:0}).value||0` — eso
parsea **el elemento**, da `NaN`, y `NaN.value` es `undefined`: **las cuatro
tasas de la calculadora valían 0 siempre**. Hay guardia para que no vuelva.

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

**La hoja del contador y el detalle del mes van en el PDF** (ARREGLO 59). Lo
que él pide para la declaración: cuántas operaciones entraron **en reales**,
cuánto entró, la ganancia que dejaron y los egresos partida por partida. Tres
reglas que no son obvias y están en `resumenContador()`:

- *"lo que entra en reales"* es **`orig === "BRL"`**, no "está en la lista de
  Brasil". En `S.brl` hay remesas que entran en USDT o en soles; contarlas
  infla lo declarado. En septiembre eran dos.
- **Colombia cuenta.** Entra en reales y deja ganancia, así que declara igual
  que Venezuela, aunque la entrega la haga el aliado en pesos.
- **Cada operación se convierte con SU tasa** (`pr × tc`). Sumar en USDT y
  multiplicar al final por la tasa de hoy da un número que no cuadra con
  ningún mes.

La pantalla, el PDF y el CSV salen de esa misma función. Antes la pestaña
Contador tenía su propio "lucro" convertido con **una sola tasa del día** y con
los gastos de toda la empresa restados: otro número distinto para la misma
pregunta, y en portugués.

**El papel dice de quién es**: `EMPRESA_RAZON` y `EMPRESA_CNPJ`, en un solo
sitio. Vivían dentro de `rCierreMes()`, que era código muerto — al borrarla se
habrían ido con ella.

**Y el `</div>` de más, que costó una tarde.** Las dos secciones nuevas se
generaban bien y **no aparecían en el PDF, sin un solo error en consola**. Había
dos `</div>` sobrantes —en cobros pendientes y en préstamos activos— que
cerraban `.cuerpo` y `.hoja` antes de tiempo: todo lo que viniera después
quedaba **fuera de `#reporteCapture`**, y html2canvas solo captura lo de dentro.
No se notaba porque no había nada después. Si algún día añades una sección al
final del informe y no sale, **mira el balance de `<div>` antes que nada**:
`pruebas/prestamos.js` ya vigila que no vuelva ese patrón.

**`rCierreMes()` e `imprimirRelatorioContador()` estaban muertas** — 314 líneas
que nadie llamaba, con fórmulas viejas y en portugués. Borradas en el ARREGLO
59. El peligro no era el peso: era que alguien las leyera y creyera que eran
las buenas.

### Cerrar un mes es decisión SUYA, no del reloj (ARREGLO 89)

Sus palabras: *"me di cuenta que yo no cerré el mes de septiembre, ya estaba
cerrado por voluntad propia del sistema. Cosa que no debería de ser así, porque
si el 30 faltaron cosas por registrar, no deberías de cerrarme el sistema
automáticamente, al menos que yo le dé cerrar mes"*.

Y era peor de lo que ella creía. `checkCierreAutomatico()` cerraba el mes
anterior **sin preguntar nada**, y corría en **tres** sitios:

```
· 2 segundos después de abrir la app
· cada 5 minutos, de respaldo
· a medianoche exacta, con un temporizador que se recalibraba solo
```

O sea que el 1 de octubre, dos segundos después de que ella abriera la app,
septiembre quedó cerrado — con lo que faltara por registrar fuera. **Y un mes
cerrado congela sus números**: el informe de ese mes deja de recalcular y pasa a
leer lo que quedó guardado en el cierre.

Ahora solo lo cierra ella, con su botón. Lo único que hace la app sola es
**avisar**, arriba del panel y fuera de la zona que hace scroll (ARREGLO 62):

> **Todavía no has cerrado Septiembre 2026.** Todo lo que registres ahora cuenta
> para Octubre 2026, no para Septiembre 2026. Cierra Septiembre 2026 primero.

- **El aviso no se puede cerrar.** Mientras el mes siga abierto el dato sigue
  siendo cierto, y esconderlo es lo que la dejó sin enterarse la primera vez.
- **Solo sale si ese mes tiene operaciones y no está cerrado.** Sin operaciones
  no hay nada que cerrar y el aviso sería ruido.
- **`_revisarMesSinCerrar()` no cierra nada: solo marca.** Y una guardia exige
  que ningún `setTimeout` ni `setInterval` vuelva a llamar a
  `ejecutarCierreMes` — es por donde entró la primera vez.

#### Pero quitar el automático dejó el manual tapiado (ARREGLO 91)

El 89 se probó con guardias estructurales y **no se probó el camino que el
propio aviso señala**. Lo encontró ella en `test`: *"me mandó a cerrar el mes de
septiembre, cuando le di allí me cerró fue el mes de octubre"*.

Eran dos piezas que no encajaban, y cada una sola parecía correcta:

```
el botón del aviso        llamaba a st("cierre") a secas
la pantalla de cierre     abre en S._cMes, que por omisión es el mes EN CURSO
el botón 🗓️ Cerrar        salía solo si esMesAct
```

O sea que el aviso la mandaba a cerrar septiembre, la dejaba en octubre, y el
único botón de cerrar que había cerraba **octubre**. Y septiembre no se podía
cerrar desde ninguna parte: entre el 89 —que quitó el automático— y ese
`esMesAct`, **el mes anterior no se cerraba de ninguna manera**. Reproducido en
Chromium contra la versión desplegada: `meses cerrados ahora: ["2026-10"]` y el
aviso de septiembre seguía ahí.

- **El botón del aviso SELECCIONA el mes** (`S._cMes`), no solo cambia de
  pestaña. Un aviso que señala un sitio y te deja en otro es peor que no avisar.
- **El botón Cerrar sale para cualquier mes pasado.** Un mes **futuro** sigue sin
  botón: puede haber operaciones con fecha adelantada a propósito
  (`confirmarFechaFutura`) y cerrar un mes que no ha empezado no significa nada.
- **Y se dice lo que no se ve: la ganancia del mes sale de las operaciones de ESE
  mes, pero la foto de saldos se toma HOY.** Cerrando septiembre el 3 de octubre,
  esa foto ya lleva dentro lo que se movió en octubre. Es el precio de que lo
  cierre ella cuando quiera y no un reloj a medianoche — callarlo le dejaría un
  número raro sin explicación.
- **Cerrar el mes anterior no puede ser una puerta de un solo sentido.**
  `reabrirMes()` solo admitía el mes en curso, porque volver a cerrar tomaría los
  saldos de hoy en vez de los de aquel día; pero **si el cierre se hizo hoy, esa
  foto ES la de hoy** y no se pierde nada. Ahora se puede deshacer el mes en
  curso o un cierre del mismo día, y el botón 🔓 Reabrir sale donde
  `reabrirMes()` deja reabrir — que antes tampoco coincidían.

**Y el backup del cierre no se descargaba.** Sus palabras: *"supuestamente me iba
a descargar el archivo de forma automática cuando yo le diera cerrar mes pero no
me generó nada"*. Iba detrás de un `setTimeout` de medio segundo **después** de
un `alert()`: Android exige un gesto reciente para una descarga que lanza el
código, y para entonces el permiso del toque ya había caducado. **Es exactamente
el mismo fallo que ya costó el botón de compartir (ARREGLO 84)**, en otra
función. Ahora se lanza dentro del toque, antes del aviso, y `autoBackupJSON()`
**devuelve el nombre del archivo o `null`**: antes se tragaba cualquier fallo en
un `catch` que solo escribe en la consola, así que desde fuera un backup que no
existe se veía igual que uno que sí.

**La lección, y es la segunda vez en dos arreglos seguidos:** una guardia
estructural comprueba que el código dice lo que debe decir, no que el camino
funcione. Cuando un arreglo añade un **botón que lleva a algún sitio**, hay que
pulsarlo en Chromium y mirar dónde cae.

### La tarjeta de crédito es una cuenta, y su saldo es DEUDA (ARREGLO 95)

Sus palabras: *"el saldo que yo utilizo de ahí es el mismo límite de reserva que yo
tengo en el banco… no tengo dinero propio del banco para utilizar"*.

La tarjeta de PagBank está respaldada por los **R$ 1.004 bloqueados en PAGBANK
RESERVA**. La app no la conocía, así que una compra con la tarjeta se apuntaba
**saliendo del efectivo del banco el día de la compra** — y del banco no sale nada
hasta que se paga la factura. Es un desfase de fechas que no cierra solo.

Medido contra su extracto OFX de PagBank, eso dejó la cuenta en **R$ 199,81** con
el banco en **R$ 0,00**. El desglose, al céntimo:

```
+332,31   la factura del 05/10 (932,50) menos lo que sí registró (Claude 600,19)
 −80,00   una remesa que entró al banco y no estaba registrada
 −52,00   la entrega de la remesa #131, que salió de la TARJETA, no del efectivo
  −0,50   medio real de antes del 15/09
────────
 199,81
```

Y la factura cuadra sola: **600,19 de Claude + 332,31 de los relojes = 932,50**.

**No hace falta ningún movimiento nuevo.** Son el traspaso y el egreso de siempre;
lo único que faltaba era que la cuenta existiera:

```
compra con la tarjeta   →  sale de la TARJETA (la deuda sube)
pagar la factura        →  traspaso banco → tarjeta (baja el efectivo y la deuda)
Pix pagado con tarjeta  →  la entrega sale de la TARJETA, y su comisión es un egreso
```

- **En una tarjeta el negativo es lo NORMAL**, así que no se pinta de alarma y no
  entra en el aviso de saldo negativo. Su guardia es otra: pasarse del límite.
- **Pero la cifra grande tampoco puede salir como dinero.** El primer intento
  pintaba una deuda de 652,68 en **verde y sin signo**, idéntica a un saldo a
  favor. Va en ámbar, con el signo y con *"debes"* debajo.
- **La comisión del Pix con tarjeta es un GASTO FINANCIERO, no parte de la
  entrega.** Su comprobante del 05/10: R$ 50,00 de transferencia, *taxa do cartão*
  **4,98 % = R$ 2,49**, total R$ 52,49. Metida dentro de lo entregado deforma la
  tasa: 11.000 Bs ÷ 50 son **220**, su tasa de vuelta; con la comisión dentro salen
  **211,54**, que es una tasa que no le dio a nadie. El porcentaje se edita en
  Configuración, al lado de la comisión del banco venezolano.

#### Y una cuenta de banco en negativo es un aviso, no un detalle

Esto es lo que habría cazado todo lo anterior **solo, en septiembre**, sin pedirle
un extracto al banco. Reconstruyendo PagBank, el saldo tuvo que irse a negativo dos
días —**el 12/09 por 178 y el 18/09 por 293**— porque había entradas sin registrar.
En un banco eso no existe.

El aviso va arriba del panel, fuera del scroll (ARREGLO 62), dice qué cuenta y
cuánto, y apunta a las dos causas: que se pagó con la tarjeta, o que falta
registrar una entrada. **Y dice que no se arregla escribiendo el saldo**, que es lo
que borra la pista.

#### Y el 95 se dejó TRES pantallas (ARREGLO 101)

El 95 enseñó lo de la tarjeta al aviso de arriba del panel y a Balance de
Cuentas, y las demás siguieron con su propia copia de la regla. Lo vio ella el
07/10 con PagBank ya cuadrado contra el banco **al céntimo**:

```
Inventario USDT ......  ⚠️ sobre su −112,56
alertas del Resumen ..  🔴 "Cuenta en negativo" ROJA y urgente, todos los días
informe del Cierre ...  "⚠️ Saldo negativo — revisar", y ese papel sale FUERA
```

Las tres decían que había algo que revisar en una cuenta que estaba perfecta.
**Una alarma roja permanente que no significa nada es lo que enseña a no leer
las alarmas**, y en esta app las rojas cuestan dinero.

- **La del Resumen llevaba una SEGUNDA copia del filtro**, y era justo la que no
  sabía de tarjetas: `_cuentasEnNegativo()` ya lo hacía bien desde el 95. Ahora
  lee de ahí. Es la misma regla del 34,27 contra 34,28.
- **La alarma la dispara el LÍMITE, no el signo.** Comprobado por los dos lados:
  debiendo 112,56 de 1.004 no sale nada; debiendo 1.200 vuelve el ⚠️ y dice
  *"te pasaste del límite por BRL 196,00"*. Quitar la alarma falsa sin dejar la
  de verdad habría sido cambiar un fallo por otro peor.
- **Y la deuda no se pinta como dinero** (ARREGLO 95 otra vez). En el inventario
  va en ámbar —`--avi`, el color que esa pantalla ya usa para sus títulos, así
  que sobre ese panel oscuro está probado que se lee— con el signo y con
  *"💳 debes"* debajo.

**Lo que hay que sacar de aquí, porque es la misma forma del 85 y del 98:**
cuando una regla nueva —"una tarjeta no es una cuenta normal"— entra en la app,
no basta con aplicarla donde saltó el problema. Hay que **buscar todas las
copias** de la regla vieja. Aquí eran cuatro sitios leyendo `saldo < 0` por su
cuenta, y el 95 arregló uno. La guardia de `pruebas/prestamos.js` cubre los
tres, y lo que fija de la del Resumen es que **no vuelva a haber una copia
propia del filtro**.

#### Y el 101 se dejó NUEVE copias, no una (ARREGLO 119)

Lo vio ella el 12/10 con PagBank ya cuadrado contra el banco al céntimo: la lista
de Balance de Cuentas le pintaba un **⚠️ rojo** sobre una tarjeta que debía 113
de un límite de 1.004.

El 101 dejó escrito *"hay que buscar todas las copias de la regla vieja"* y se
buscaron cuatro. Faltaban:

```
rCapitalTotal     la fila de la lista          ← el ⚠️ que ella vio
rCapitalTotal     el panel "Salud de cartera"
rHistorialMeses   los saldos de meses cerrados
6 selectores      "de qué cuenta sale el dinero" — decían "⚠️ déficit"
                  sobre la deuda normal de una tarjeta
```

**La causa no era el descuido: era que no había dónde preguntarlo.** Nueve sitios
escribían `saldo < 0` cada uno por su cuenta, así que arreglar la regla en uno no
arreglaba nada en los otros ocho. Ahora se pregunta en `_saldoConProblema()`, y
la guardia **recorre el archivo y prohíbe que vuelva a escribirse suelto** en
cualquier función que no sea esa o `_deudaTarjeta()` (donde `saldo < 0` **sí** es
correcto: es la definición de lo que debe).

- **En el selector una tarjeta dice `💳 debes 113,48`**, no "⚠️ déficit". Lo que
  tiene es deuda, que es para lo que está.
- **La foto de un mes cerrado no guarda si era tarjeta**, solo `cuentaId`: se mira
  la cuenta viva por su id (`_cuentaDeFoto`).

**Y quitar el ⚠️ dejó la deuda pintada del VERDE DEL DINERO** — el ARREGLO 95 por
tercera vez. Medido en Chromium: su −113,48 salía en `#31db7e`, el mismo verde
que un saldo a favor. Va en **ámbar** y con *"💳 debes"* debajo, como ya se hizo en
Inventario USDT. **Arreglar una alarma falsa no puede convertir una deuda en
dinero.**

#### Y "ida"/"vuelta" era MI vocabulario, no el suyo (ARREGLO 119)

Sus palabras: *"lo que quiero saber es cuál es la que me está sugiriendo de Brasil
a Vzla y cuál de Vzla a Brasil"*.

La calculadora contestaba *"Bs por real en la vuelta"*. Ella piensa en **rutas**
—es como las publica y como se las pide el cliente— y tenía que traducir dos
palabras en cada número. Traducirlas al revés cuesta dinero: las dos se escriben
en bolívares por real y significan lo contrario (ARREGLO 74).

La tabla vive en `_RUTA_DE` y la leen el resultado, el botón de publicar, los
rótulos de los campos, los botones de modo y el tope. Escrita en cada sitio, un
día uno diría Brasil → Venezuela donde otro dice lo contrario.

- **El titular lleva la ruta con palabras** y debajo **quién da qué**
  (*"el cliente te da bolívares, tú entregas reales"*), que es lo que no se podía
  deducir de "vuelta".
- **Dentro de una frase van solo las banderas** (`🇻🇪→🇧🇷`): la ruta entera no
  cabe en un botón ni en una línea de texto. Comprobado a 390, 412, 768 y 1280 px:
  ningún botón se desborda.
- **Y el tope se contradecía solo.** Decía *"Tu tope en 🇧🇷→🇻🇪 es 220,00 — la
  vuelta que te dan"*: dos rutas en una frase sin decir qué hace cada una. Ahora
  dice **lo que es y de dónde sale** — *"Lo más que puedes dar en 🇧🇷→🇻🇪 sin
  perder son 220,00 Bs por real, y sale de los 220,00 que te dan en 🇻🇪→🇧🇷"*.

#### Lo que esto NO repara

Lo ya registrado se queda como está (la regla de siempre). Para dejar PagBank
cuadrado contra el banco hay que rehacer cuatro cosas a mano, una vez, y la
**apertura de la tarjeta son los relojes**: `−332,31`, que es la parte de la
factura que no está en ninguna otra cuenta.

```
                                                        PagBank    tarjeta
apertura de la tarjeta: los relojes                                 −332,31
Claude (600,19) sale de la TARJETA, no del efectivo      800,00     −932,50
el pago de la factura (932,50) SÍ sale de PagBank       −132,50        0,00
la entrega de la #131 (50,00 + 2,49 de comisión)         −80,50      −52,49
la remesa que faltaba del 01/10 (80,00)                   −0,50
```

PagBank queda en **−0,50** contra los 0,00 del banco, y la tarjeta debiendo
**52,49** — que es justo el Pix de las 10:01, hecho **después** de pagar la
factura, así que entra en la siguiente.

**Los relojes NO se tocan.** Están como préstamo a ella de 336,91 del 29/08 contra
PagBank. En agosto la app llegó a estar **4.900 por encima** del banco y lo que la
trajo de vuelta fueron sus ajustes a mano del 2 al 12 de septiembre: los relojes
quedaron dentro de ese reseteo. Moverlos ahora reabre algo ya cerrado. (La tarjeta
cobró 332,31 y el préstamo dice 336,91 — 4,60 de diferencia que no se persiguió.)

**Y la lección de método, que es la que vale para la próxima:** reconstruir una
cuenta desde fuera del navegador falló **dos veces** —primero perdiendo las 192
remesas por buscar la fecha en el campo equivocado (`d`, no `fecha`), y después
olvidando que **dar un préstamo saca el capital de la cuenta**—. Lo que lo resolvió
fue el **extracto OFX del banco**: comparar movimiento contra movimiento, con
margen de días, y mirar **en qué día cambia la diferencia**, no el saldo de cada
día — `histSaldos` se toma a media jornada y no sirve para comparar cierres.

---

## El apartamento y su cronograma (ARREGLO 134)

Sus palabras del 13/10: *"estoy realizando la compra de un apartamento, quiero
que me anexes algo para llevar el control de esos gastos"*. De tres maquetas
eligió la que reutiliza la forma de Préstamos: un contrato con sus cuotas, el
saldo que baja y el aviso en el Resumen.

**NO VA EN `S.prestamos`, y eso es lo primero.** En papel es un préstamo al
revés, pero `S.prestamos` alimenta el límite de crédito de SUS clientes, el
perfil de riesgo y la ganancia por préstamos del Cierre. Su deuda metida ahí
entraría en las tres cuentas: le subiría el límite a un cliente que no ha pedido
nada y le apuntaría un interés que nadie le va a pagar. **El parecido está en la
pantalla, no en los números.**

**Son DOS listas** —`S.inmuebles` y `S.inmCuotas`— las dos en `_MERGE_FIELDS` y
en `DATA_KEYS`. La fusión decide registro por registro: con las cuotas dentro del
contrato, marcar una en el teléfono y otra en la PC haría que una pisara a la
otra, porque lo que viaja es el contrato entero. Es la razón del `_MERGE_BLOQUES`
del ARREGLO 60 aplicada al revés: aquello había que unirlo porque solo tiene
sentido junto; esto hay que separarlo porque cada pieza se toca sola.

**El dinero NO vive aquí.** Pagar una cuota crea un EGRESO de los de siempre,
baja la cuenta y baja el lote FIFO — el mismo camino de `pagarCompromiso()`. Así
el Diario, el Cierre, la conciliación y el balance se enteran solos, sin tocar ni
una línea de los cuatro. Aquí vive el **calendario**: qué se debe, cuándo, y si ya
se pagó. Y se puede deshacer: el egreso se borra y el dinero vuelve a la cuenta y
al lote.

### Tres bolsas que NO son el mismo dinero

```
de ella      30.613,98   sale de su cuenta
del banco   280.197,03   la Caixa se lo paga a la constructora
condonable   43.413,08   se perdona si paga el financiamiento en su día
```

Sumarlas diría que debe 354.224 cuando de ella salen 30.614.

- **La del banco no crea egreso al marcarla.** Ese dinero nunca pasa por su
  cuenta; inventarle una salida sería inventarse un movimiento.
- **La condonable no suma pero tampoco se esconde.** Si falla la condición la
  paga entera, y son el 12,4 % del piso. Es la misma regla que el interés
  pendiente de los préstamos (ARREGLO 71): se dice y no suma.
- **`_inmResumen()` las separa en un solo recorrido**, y lo leen la tarjeta, los
  avisos del Resumen y el pie de la lista. Calculado aparte, un redondeo distinto
  haría que la tarjeta diga una cosa y el aviso de al lado otra.

### Los montos son los del CONTRATO, no los de la propuesta

La hoja *"Proposta de Venda"* lista la mensual en **R$ 1.000,00** —el principal
sin intereses— y la cláusula 4.2.2 (c.1) la fija en **R$ 1.152,44** con Tabla
Price al 12,68 % anual. Igual la anual: 2.136,18 contra **2.455,42**. Cargar los
de la propuesta le diría que paga **3.977,84 menos** de lo que va a pagar.

**Y hay 4 céntimos que no cuadran, a propósito.** La misma cláusula dice las dos
cosas: que la partida son 27.658,60 y que cada cuota son 1.152,44. Pero
24 × 1.152,44 = 27.658,56.

```
suma de las cuotas cargadas    354.224,09
cláusula 3.1 del mismo papel   354.224,13
```

Se mete lo que dice **por cuota**, que es lo que el banco va a cobrar cada mes, y
no un número repartido a mano para cuadrar el total. **Un total que cuadra porque
alguien repartió el redondeo es peor que uno que no cuadra y dice por qué.**

### Lo demás, en corto

- **Las 24 mensuales salen de `_sumarMeses()`**, nunca de `setMonth()`. Aquí el
  día es el 10 y no muerde, pero una copia de este código con otra fecha sí.
- **El contrato del VIZ se carga de un toque** (`_VIZ` + `cargarContratoViz`):
  28 cuotas a mano son 28 sitios donde equivocarse.
- **Pagar pregunta si crear el egreso o solo marcar.** Si ella ya apuntó ese pago
  a mano, crear un segundo bajaría la cuenta dos veces por el mismo dinero.
- **Desplegar las cuotas no llama a `R()`** (ARREGLO 32), y el rótulo del botón
  se busca por **su propio id**, no por el `event` global — leerlo del evento
  funciona hasta que alguien llama a esa función desde otro sitio.
- **`_simMon()` escribe R$ y Bs, no BRL y VES.** Es el ARREGLO 92 aplicado a su
  propia pantalla: los códigos son del banco, ella dice R$.
- **De quién es el inmueble se PREGUNTA**, no se adivina: decide si cada cuota es
  gasto personal o de la empresa, y eso mueve el capital.

**Lo que NO entró, y es a propósito:** la cuota mensual de la Caixa (R$ 2.100 ×
420). No empieza hasta 2027 y el monto exacto sale del contrato de financiamiento
que aún no está firmado. Cuando lo esté, eso es un *compromiso* de los que ya
existen — no hace falta código.


---

## Mercancía: cosas que compra para revender (ARREGLO 143)

Sus palabras del 15/10: *"compré unas máquinas con dólares físicos, son de la
empresa pero eso es para vender, entonces quiero llevar el control de eso porque
eso es ingreso para la empresa y por supuesto aumenta las ganancias — por lo
menos eso lo compré a 200$ y lo voy a vender en 300$"*.

**Con lo que había, sus números salían mal por los dos lados.** Registrando la
compra como egreso y la venta como ganancia extra:

```
compras a 200  →  el mes sale en PÉRDIDA de 200, y el capital no cuenta
                  la máquina que tiene en la mano
vendes a 300   →  el mes gana 300, no 100
```

La ganancia de verdad —100— no aparecía nunca. Al aprobarlo lo dijo así: *"tu
lógica es correcta, que no dé ganancias o pérdidas locas"*.

### Comprar NO mueve el capital, y eso es lo que hace que cuadre

Salen 200 de una cuenta y entra una máquina de 200: el dinero cambia de forma,
no se va. La identidad entera, que es lo que hay que **medir** y no deducir:

```
comprar a 200   tienes  −200 cuenta  +200 mercancía  =    0   deberías    0
vender a 300    tienes  +300 cuenta  −200 mercancía  = +100   deberías +100
vender FIADO    tienes     0 cuenta  −200 mercancía
                        +300 por cobrar              = +100   deberías +100
```

Medido en Chromium con su export, pulsando los botones de verdad:

```
                 tienes    sin explicar   mercancía   DOLAR FISICO
al abrir        2.550,96       913,16          0,00         391,00
comprada 200    2.550,96       913,16        200,00         191,00
+30 de flete    2.550,96       913,16        230,00         161,00
vendida a 300   2.620,96       913,16          0,00         461,00
deshecha        2.550,96       913,16        230,00         161,00
borrada         2.550,96       913,16          0,00         391,00
```

**El "sin explicar" de su export no se mueve ni un céntimo en ninguno de los
seis pasos**, y al borrar todo vuelve exacto. Esa es la prueba que decide si
este módulo está bien; si alguna vez no sale, está roto.

### Lo que costó la identidad: dos fallos que las guardias no vieron

- **La doble resta.** El primer intento excluía el egreso de la compra en
  `calcMesCompleto` **y otra vez** en la conciliación. Medido: comprar a 200
  llevaba `deberias` de 2.690,29 a 2.890,29 — la app diciendo que le faltan 200
  por el solo hecho de comprar. La exclusión vive en **un** sitio,
  `calcMesCompleto`, y de ahí llega descontada por `_acumuladosMes`.
  `_egresosMercanciaDesde()` existe pero **la conciliación no la llama**, y hay
  guardia que exige justo eso.
- **La fecha.** `_mesKeyISO` solo entiende `aaaa-mm-dd`; pasarle la de pantalla
  (`15/10/26`) devuelve cadena vacía, así que la venta **no contaba en ningún
  mes, en silencio**. Medido: el capital subía 100 y `deberias` no se movía. Por
  eso cada registro guarda su `fechaIso` y el mes sale de `_mesDeMercancia()`.

Las dos veces las guardias estructurales daban verde —el texto decía lo que
debía decir en cada sitio por separado— y las dos las cazó **medir la identidad
con sus datos**. Es la lección del ARREGLO 121, otra vez.

### Decisión suya: la ganancia cuenta para su sueldo

Se le ofrecieron las dos formas y eligió esta:

```
como una remesa          → cuenta para la utilidad → su sueldo sube 30 de cada 100
como el interés de un préstamo → solo para la bruta → su sueldo no sube
```

Comprar y revender es una operación de la empresa, no un cargo financiero. Y va
con la otra mitad, que es la que evita las *"pérdidas locas"*: **la compra no
cuenta como gasto del mes**. Con ella dentro, el mes que compra sale en pérdida
de 200 y el que vende gana 300 — y su sueldo, el 30 % de la utilidad, saltaría
igual de raro.

**Se reconocen por `fromArticulo`, no por la categoría.** La categoría es un
nombre que ella puede renombrar en Configuración, y ese día estos egresos
volverían a contar como gasto sin que nada lo dijera.

### Lo demás, que son reglas ya ganadas aplicadas aquí

- **Son DOS listas** (`S.articulos`, `S.artGastos`), las dos en `_MERGE_FIELDS`
  y en `DATA_KEYS`. Con los gastos dentro del artículo, añadir un flete en el
  teléfono y vender en la PC haría que uno pisara al otro (ARREGLO 134). La
  **venta** sí va dentro del artículo: es una sola y siempre se toca junto con
  su estado.
- **El dinero pasa por el camino de siempre.** Comprar crea un egreso normal:
  baja la cuenta y baja el lote FIFO. Al borrar, vuelve a los dos (ARREGLO 127).
- **Vender NO crea lote.** Un lote nace solo cuando compra o vende USDT; vender
  una máquina no lo es. Si entrara ahí, la tasa con la que se valora **todo** su
  dinero parado saldría de las máquinas. Si luego gasta esos bolívares, el FIFO
  los valora con `tasaDeReferencia()` y **lo dice** (ARREGLO 125).
- **Fiado va a Por cobrar**, que es donde ya viven los abonos con su tasa y su
  aviso de tasa al revés (ARREGLO 55). Un segundo sitio para cobrar sería el
  ARREGLO 98 otra vez. Y la ganancia se apunta **el día de la venta**, no el del
  cobro: los 300 ya están en Por cobrar, así que el capital ya subió.
- **Se valora a lo que COSTÓ, no a lo que espera sacar.** Lo que espera ganar se
  dice en la pantalla y no suma — la misma regla que el interés pendiente de un
  préstamo (ARREGLO 71). Valorarla a 300 sería apuntar la ganancia antes de
  vender nada (ARREGLO 124).
- **Sin tasa no se inventa un cero**, que convertiría la venta entera en
  ganancia: no deja guardar y dice qué falta.
- **Una cuenta 💜 personal no puede ser el origen.** Ese dinero ya salió de la
  empresa (ARREGLO 96).
- **El USDT se guarda del momento**, como una remesa guarda su `uc`/`uv`: la
  ganancia de una venta de hace un mes no puede cambiar sola porque hoy se mueva
  una tasa.
- **Y sale donde ella lo pidió:** *"en el informe mensual debe reflejar eso que
  está invertido ahí"*. Va en el desglose de capital del Informe Mensual y como
  una cajita más en Balance de Cuentas — ahí **tiene** que estar, porque esas
  cajitas suman el número grande (ARREGLO 141).

### Un error mío, cazado pulsando el botón

El campo *"¿en cuánto?"* del formulario de venta salía **relleno** con el precio
que ella había puesto al comprar —un `value` del HTML— pero `S.vArt.monto` solo
se escribía en el `oninput`. Sin tocar el campo, la pantalla decía **300** y al
confirmar saltaba *"¿En cuánto lo vendiste?"* con el 300 delante.

**La regla que sale de aquí: lo que un formulario ENSEÑA al abrirse tiene que
estar guardado al abrirse.** Rellenarlo solo en el `oninput` convierte *"no lo
tocó"* en *"está vacío"*. Por eso los dos botones pasan por `_abrirVentaArt()` y
`_abrirGastoArt()`, que dejan puesto lo que el formulario va a dibujar. Es la
familia del ARREGLO 138, y ninguna guardia de texto lo habría visto.

### Y una guardia vieja que fallaba por un campo que no era suyo

La del ARREGLO 51 contaba `fechaIso:` **en todo el archivo** contra los
`inventarioUsdt.push(`, así que cualquier registro nuevo con ese nombre de campo
—la mercancía, sin ir más lejos— descuadraba la cuenta y hacía fallar una
guardia que no tenía nada que ver. CLAUDE.md ya lo tenía documentado como trampa
conocida. Ahora mira **cada push** y exige que el objeto que empuja lleve su
`fechaIso`: es lo que se quería comprobar, y además es inmune al nombre que use
el resto de la app. La ventana mira a los dos lados, porque unos sitios empujan
el objeto escrito ahí mismo y `crearLoteRecibido` empuja una variable construida
antes.

### Pero el 143 se dejó SEIS pantallas (ARREGLO 150)

Sus palabras del 16/10, con la máquina comprada el día antes: *"la compra de la
mercancía no debe perjudicar la ganancia de lo que lleva el mes porque eso es
inversión"*.

Tiene razón, y el 143 lo aplicó **solo en `calcMesCompleto`**. Las pantallas que
suman los egresos por su cuenta se quedaron con la regla vieja — y la que ella
abre todos los días es una de ellas:

```
Resumen → NETO REAL              −151,76   ← los 210 de la máquina dentro
Balance → "¿ganas o pierdes?"     +73,17   ← calcMesCompleto, sin ellos
```

Dos cuentas del mismo mes, y la que asusta es la que abre primero. Es el 34,27
contra el 34,28 con el número más grande que mira. **Es la forma del ARREGLO 101
y del 119 por tercera vez:** una regla nueva no basta con aplicarla donde saltó
el problema; hay que buscar **todas** las copias de la vieja. Eran seis.

- **`_egOperativos()` es la puerta única**, y la usan el Resumen, el Balance
  Mensual, el reporte de Julio, la hoja de Excel, el reparto por categoría del
  PDF y el conteo de gastos del Cierre.
- **Los PENDIENTES también.** El 143 filtró solo los pagados, así que una máquina
  comprada a crédito seguía anunciando una pérdida que no existe.
- **Lo que NO se filtra, a propósito: el reparto POR CUENTA.** Ese dinero sí
  salió del banco. Lo que no hace es bajar la ganancia, porque entró una máquina
  que vale lo mismo — el capital ya la cuenta. Hay guardia para que nadie la
  filtre ahí.

Medido con su export del 16/10, v231 contra v232:

```
                        v231        v232
Resumen · NETO REAL   −151,76     +58,24
Resumen · egresos      399,93     189,93   ← ya es el mismo que el Cierre
Cierre · utilidad       73,17      73,17   ← idéntico
Balance · oct          +73,17     +73,17   ← idéntico
capital              2.704,71   2.704,71
te sobran                6,54       6,54
```

#### Y la guardia se escapó cinco veces, citando el arreglo que la avisaba

El primer intento pedía solo que `_egOperativos` **apareciera** en cada función.
Cada sitio la llama **dos** veces —pagados y pendientes— así que quitando una
quedaba la otra y la guardia daba verde con el fallo dentro: **5 de las 11
pruebas negativas se escaparon**.

Es el agujero del ARREGLO 140 —*"hay que exigir las dos por nombre"*— cometido
otra vez, y en el comentario de la guardia estaba citado. **Ahora se cuentan las
llamadas** y el número va escrito: si un día hace falta una más, falla hasta que
alguien mire si la nueva está del lado correcto.

Y una segunda, de la misma familia: la guardia de *"la conciliación no la resta
otra vez"* se ancló en `sacarFuncion("conciliacionCapital")` **sin quitar los
comentarios**, y ahí ese nombre sale en un comentario. Medía el comentario, no el
código (ARREGLO 100). Esa comprobación ya existía bien escrita desde el 143, así
que el duplicado se retiró.

#### Y el 150 se dejó UNA más: la cabecera (ARREGLO 153)

Lo vio ella el 16/10, el mismo día: arriba ponía **`Real: $-154,54`** y la
tarjeta del Resumen **`Neto real $58,24`**. Dos números para lo mismo, con
**212,78** de diferencia. Medido con su export, la diferencia es exacta:

```
la máquina (mercancía)   210,00   es inversión, no gasto del mes
un gasto personal          2,78   que ni siquiera es de la empresa
                         ───────
                          212,78
```

La cabecera sumaba **todos** los egresos pagados del mes, sin `_egOperativos()`
y sin mirar el tipo. **Era la séptima copia, y el 150 buscó seis esa misma
mañana.** Es la cuarta vez con esta forma (101, 119, 150).

**Y al medirlo salió que el número bueno no era ninguno de los dos.** El Resumen
tampoco contaba la **ganancia extra de la empresa**:

```
remesas                      248,17
+ ganancia extra empresa      14,93
                           ────────
                             263,10     ← miGanOperaciones
− egresos operativos        −189,93
                           ────────
utilidad del mes              73,17     ← Cierre, Balance y la tarjeta Base
```

Los **préstamos (14,23)** entran en la bruta y **no** en la utilidad, que es la
regla que el cierre ya tenía escrita. Así que había **tres números malos y uno
bueno**, no al revés — y el bueno estaba en la tarjeta que nadie miraba.

- **Nadie la calcula ya por su cuenta.** La cabecera y el Neto real leen
  `calcMesCompleto()`, que es de donde ya salían el Cierre, el Balance y Base.
- **Y son DOS números con nombres distintos**, no uno: *"Remesas $248,17 ·
  Utilidad $73,17"*. *"Ganancia"* y *"Real"* se leían como dos versiones de lo
  mismo, y de ahí salió la pregunta.
- **El pie del Neto real se puede sumar a mano** (*"248,17 + 14,93 extra −
  189,93 de egresos"*). Un número que no dice de dónde sale hay que perseguirlo
  aparte (ARREGLO 141).
- **El rótulo de Base mentía sin que el número estuviera mal.** Decía *"ganancia
  menos lo ya pagado"*, que invita a restar los dos números de al lado —248,17 −
  189,93 = 58,24— y eso **no** es la utilidad. El número era correcto desde
  siempre; lo que había que arreglar era la frase.
- **Y el "Pagado" de Egresos sigue contando la mercancía**, porque ese dinero sí
  salió del banco (ARREGLO 150). Lo que faltaba era **decirlo**: ahora nombra
  cuánto de él es mercancía y que no baja la ganancia. Un número correcto al
  lado de otro correcto, sin nada que los empareje, es lo que hizo todo esto.

#### Un gasto personal guardado en la lista de la empresa (ARREGLO 153)

De los 212,78, el 2,78 era **un registro suyo en el sitio equivocado**: un gasto
con `tipo:"personal"` dentro de `S.egresos`, que es la lista de la empresa. Los
personales de verdad viven en `S.egresos_personales`.

**Y no lo veía NADIE**: la pestaña de empresa lo filtra por tipo, la personal no
lo busca ahí, y el único sitio que lo sumaba era la cabecera, que sumaba todo.
Medido en todo su export: **uno de 53**, y ninguno en otro mes.

- **El aviso va ARRIBA de las tres pestañas**, porque no es de ninguna — ése es
  justamente el problema.
- **Se mueve con un botón, no tocando la base.** Y **no toca ningún saldo**: el
  dinero ya salió de la cuenta cuando se registró; tocarlo aquí lo bajaría dos
  veces. Hay guardia por nombre.
- **Deja la marca de borrado** (ARREGLO 6c) o el otro aparato lo devuelve.
- **Y se dice lo incómodo ANTES de pulsar: mover el gasto SUBE el "te sobran"**
  por ese mismo importe, porque hasta ahora ninguna pantalla lo descontaba de
  *deberías tener*. Medido: de 6,94 a 9,72. No aparece dinero nuevo — aparece un
  gasto que no se estaba contando. Es la forma de situar los ajustes en el aire
  (ARREGLO 72).

#### Y una tasa del día imposible ya no se guarda en silencio (ARREGLO 153)

El campo de la tasa viene **relleno** con la de Configuración, así que escribir
sin borrar deja los dos números pegados. Le pasó el 16/10: tenía 186, escribió
189 y quedó **186189**. Medido con su export:

```
entrega      93.094.500 Bs
ganancia        −90.135,58 USDT
y la app lo guardaba sin un solo aviso
```

- **`onfocus='this.select()'` en los dos campos que vienen rellenos** —el monto y
  la tasa— así escribir reemplaza lo que había. Eso evita *ese* tropiezo.
- **Pero no el de teclear un cero de más**, así que el freno va también en
  `saveTx()`: diez veces arriba o abajo de **lo que ella publica**, y pregunta.
  No corrige nada — es el criterio del aviso de salto de 10× al escribir un saldo.
- **Se compara contra su tasa publicada, no contra un número escrito en el
  código**: la suya sube y baja todos los días (ARREGLO 128). **Sin tasa
  publicada no se frena nada**, que un umbral adivinado pararía una remesa buena.
- **Y el margen es ancho a propósito.** Estrecho saltaría en una remesa rara de
  verdad y enseñaría a pulsar "sí" sin leer (ARREGLO 99).

**La lección, y es la quinta vez:** `r2v` no existía en `rEgresos` y lo escribí
igual. Habría sido un `ReferenceError` en producción, como el `pasada` del
ARREGLO 121 — y ninguna guardia de texto lo ve, porque el texto decía lo
correcto. Lo cazó **dibujar la pestaña**.

---

### Lo que NO entró, y es a propósito

- **Cantidad por artículo.** Una cosa, un registro. Con cantidad habría que
  decidir cómo se parte el costo al vender 3 de 5, y eso es una segunda regla de
  costeo como la del FIFO. Cuando compre 20 iguales, lo que hace falta es un
  botón de duplicar, no cambiar el modelo.
- **Gastos de venta aparte de los de compra.** Para la ganancia da igual —se
  restan los dos— y lo único que cambiaría es el valor en inventario de algo que
  ya se vendió.

---

## El candado de contenido vive en `_headers` (ARREGLO 104)

Es el **cinturón** del ARREGLO 102: aquel cerró los agujeros por los que un
nombre podía ejecutar código; este dice que, si un día se abre otro, ese código
**no pueda mandarse los datos fuera**.

Medido en Chromium sirviendo la app con estas cabeceras de verdad:

```
                     con candado                sin candado
fetch a un ajeno     "Refused to connect"       falla solo por CORS
imagen a un ajeno    "Refused to load"          falla solo por CORS
script de un ajeno   "Refused to connect"       ENTRA
```

Y la app sigue viva: **24 de 24 pestañas, 0 bloqueos, 0 errores**.

**La primera versión de esa prueba no valía**, y es la trampa de siempre:
apuntaba a un dominio que no existe, y aquí no hay red, así que fallaba igual con
candado y sin él. Solo contra un servidor local **que sí responde** se distingue
"bloqueado por la política" de "no hay red".

- **`connect-src` e `img-src` son los que frenan la fuga**, y por eso la guardia
  prohíbe comodines en los dos. Un `img-src *` deja el candado sin fuerza: una
  imagen a un servidor ajeno ya se lleva los datos en la propia dirección.
- **`'unsafe-inline'` en `script-src` no se puede quitar**, y hay que saberlo:
  todo el código de esta app es inline y los botones usan `onclick`. Eso limita
  lo que el candado puede hacer contra el código inyectado — **lo que sí hace, y
  es lo que vale aquí, es impedir que ese código hable con fuera.**
- **La lista tiene que llevar los DOS servidores suyos** (producción y pruebas)
  y las **dos CDN** de donde salen html2canvas, SheetJS, Tesseract y html2pdf.
  Si cae una, la app se queda sin datos o sin librerías **y no lo dice**: el
  navegador lo bloquea en silencio. Por eso la guardia los exige por nombre.

**Lo que no se puede probar desde aquí:** la política de red del entorno bloquea
las CDN, así que las librerías no llegan a cargarse ni con candado ni sin él. Que
los dos nombres del `script-src` son los correctos se comprueba contra las
etiquetas `<script src=>` del propio archivo, no ejecutándolas.

## El respaldo se hace solo — y lo que NO cubre (ARREGLO 103)

`armar_respaldo()` existía desde hacía tiempo, pero **solo si alguien se lo pedía
a mano**. Auditado el 07/10: no había nada programado, así que lo único que
separaba sus datos de la nada era que se acordara de exportar.

**Lo que cubre y lo que no, que es la mitad importante:**

```
un borrado por error, una fusión que se come algo   SÍ
perder la base entera (la cuenta, el proveedor)     NO
```

Una copia **dentro de la misma base** no sobrevive a que se pierda la base. Esto
no sustituye a que ella se baje un archivo: hace que esa descarga sea de ayer y
no de hace tres meses. **Y la app se lo dice**, con la frase entera, cuando lleva
más de una semana sin bajar una — un "copia automática: hoy" a secas se lee como
que ya no hace falta bajarse nada.

- **El hilo lo intenta cada hora y hace una al día.** Dormir 24 h de golpe no
  sirve: este servidor se reinicia con cada despliegue, y una semana de
  despliegues seguidos no dejaría ni una copia.
- **`respaldos` va FUERA de las colecciones que se copian**, y no es un detalle.
  `armar_respaldo()` recorre toda la base: sin esa línea, la copia de hoy se
  lleva dentro las trece anteriores, la de mañana esas catorce otra vez, y en una
  semana la base no cabe. Hay una prueba negativa dedicada.
- **La copia se toma bajo `_candado_estado`**, el mismo que las escrituras. Un
  guardado toca varios documentos, uno por clave; copiar en medio se lleva un
  estado a medias —las remesas nuevas con los saldos viejos— y **es justo esa
  copia la que se restauraría**. Como no se puede ver desde fuera (sale igual con
  candado y sin él), la guardia mira el código.
- **Un fallo aquí no puede tumbar la API**: se anota y se reintenta a la hora.
- **La fecha de descarga se anota junto al archivo, no al pulsar.** El botón
  puede fallar antes de que haya nada que guardar.

## Un nombre de cliente no puede ejecutar código (ARREGLO 102)

Salió de la auditoría del 08/10 y **está reproducido**, no deducido: metiendo
código dentro del nombre de un cliente, de una cuenta o del motivo de un egreso,
ese código **se ejecutaba al abrir la pantalla**. Medido en Chromium con su
export:

```
Clientes          104 veces          Egresos      14
Inventario USDT    39                Préstamos     4
Diario             27                Por cobrar    1
Balance de Cuentas 19
```

**Hoy, con un solo usuario, casi no importa:** se lo escribiría ella misma. **Con
operadores sí importa**, y es lo que bloqueaba el plan de dar usuarios: uno
escribe el veneno en un nombre, ella abre Clientes **como administradora**, y el
código corre dentro de SU sesión, con su testigo delante.

### Hay DOS escapes y NO son intercambiables

```
_escAud(t)   para el CUERPO del HTML          →  & " ' < >  a entidades
_jsAttr(t)   para dentro de un onclick        →  a \uXXXX
```

**La segunda es la que no se ve venir.** En un atributo, el navegador decodifica
las entidades **antes** de que el JavaScript se lea, así que un `&quot;` vuelve a
ser comilla justo a tiempo de romper la cadena. Por eso el
`.replace(/"/g,"&quot;")` que ya había en los buscadores de cliente **no servía
de nada**: medido, el `onclick` de Clientes ejecutaba 270 veces. Lo que sí
sobrevive es un escape de JavaScript (`\u0022`): seis caracteres que el HTML deja
pasar tal cual y que el JavaScript lee después como la comilla de dentro.

Y `_jsAttr` **tiene que escapar también el `&`**; si no, un `&quot;` tecleado por
una persona vuelve a formar la entidad y el agujero sigue abierto.

### Tres cosas que costaron encontrarse

- **El nombre de un cliente vive en `n`, no en `nombre`.** La primera prueba
  envenenaba `nombre` —que en un cliente real no existe— y Clientes salía
  "limpio" con el agujero abierto. Es la trampa de siempre: **medir no vale si
  mides otra cosa.** Los campos de verdad se sacaron del export, colección por
  colección, y con esos se barrió.
- **El regex no alcanza; el navegador sí.** Buscar `"+campo+"` en el archivo
  encontró 85 sitios y se dejó 28. Lo que los encontró fue marcar cada campo con
  una etiqueta única, dibujar las 35 pantallas y preguntarle al DOM dónde había
  quedado sin escapar.
- **Y al revés también:** la guardia estructural encontró 13 sitios a los que la
  prueba del navegador no llegaba (pantallas que no se dibujan sin cierto
  estado). **Hacen falta las dos**, y por eso las dos se quedan.

### Lo que NO se escapa, a propósito

- **Los avisos y las confirmaciones** (`alert`, `confirm`): ahí `&amp;` se vería
  tal cual. Son 51 sitios y se dejaron fuera uno por uno.
- **`nombreCuentaEg()` devuelve el nombre crudo.** Lo usa también `logAudit`, y
  el registro de auditoría **se escapa al dibujarlo, no al escribirlo**. Por eso
  cada uno de los ocho sitios que lo pinta lo envuelve él; la guardia cuenta
  cuántas llamadas quedan sin envolver y admite dos (la definición y el
  `logAudit`).

Comprobado al terminar: **0 ejecuciones** recorriendo las 24 pestañas con `R()`
y pulsando lo que hay en cada una, con tres formas de payload; el nombre
`Café & Cía "Ltda" <São> 'Paulo'` se lee **tal cual** y ninguno de los 270
botones de cliente se rompió. En la captura de antes el navegador se comía
`<São Paulo>` como si fuera una etiqueta.

## Una operación no se duplica, y la raíz estaba en la FUSIÓN (ARREGLO 154)

Salió de perseguir las **137 remesas repetidas de mayo** que aparecieron midiendo
los meses cerrados. Sus palabras: *"lo de las 137 remesas repetidas no puede
volver a pasar"*.

**No entran por el formulario: entran por la sincronización después de importar.**
Reproducido en Chromium con su export, con el código real de `importData()`:

```
A (con sus datos) importa el archivo viejo .... 836 remesas, ninguna de más
B (app recién puesta) importa el MISMO ........ 836, con 836 _uid NUEVOS
B sincroniza y el servidor trae las de A ...... 1.672   ← el doble
```

De los 836 `_uid` que generó B, **cero** coincidían con los de A. Para la fusión
eran 836 remesas nuevas. Y así tres veces: los prefijos de sus copias lo cantan
—`mrm7qzhb` = 15/07, `mti2b1jm` = 01/09, `musw37uk` = 03/10—, las tres
importaciones.

**La importación ya estaba bien**: conserva el `_uid` cuando el archivo lo trae,
reemplaza la lista en vez de sumarla, y reencuentra por contenido (`_uidEstable`)
el `_uid` de lo que ya había **aquí**. Lo que no puede es adivinar el `_uid` que
otro aparato le puso a lo mismo.

**Por eso el arreglo va en `_mergeArrayById`**, que es donde nace el duplicado y
donde además cubre cualquier otro origen: antes de dar por nueva una remesa cuyo
`_uid` no conoce, mira si ya hay una local con el mismo contenido.

- **Se empareja por CUPO, no a secas.** Si aquí hay dos iguales y de allá vienen
  dos, no entra ninguna; si vienen tres, entra una. Sin el cupo se perdería una
  de las dos de **CARLOS ALFREDO RODRIGUEZ del 17/09** (200 R$ a 172,5, con dos
  horas de diferencia), que son dos operaciones de verdad.
- **Lo que ya se reconoce por `_uid` gasta su cupo primero**, o podría además
  absorber a otro registro distinto y perderlo.
- **Sólo para las listas que van por `_uid`** (remesas). Capital, egresos y las
  demás van por `id`, que sí viaja en el archivo: medido, traspasos e inventario
  no se duplicaron nunca.

### Y derivar el `_uid` del contenido parecía la raíz y es una TRAMPA

Fue el primer intento, y es lo que cualquiera propondría: si los dos aparatos
derivan el `_uid` del contenido, generan el mismo y la fusión los reconoce.
**Con sus datos eso borra remesas vivas.**

Sus marcas de borrado antiguas **ya están guardadas con `_uid` derivados** —171
en total: 56 en `vzla`, 104 en `eeuu`, 11 en `brl`, de la forma
`s11l523n1xua2gt`—, porque `_asignarUidsFaltantes()` lleva tiempo derivándolos al
arrancar. Un registro vivo que derive a una clave marcada **se poda solo**:

```
                              vzla tras un ciclo
antes del intento                 274   ← duplicado
derivando el _uid                  85   ← 52 remesas vivas BORRADAS
emparejando en la fusión          137   ← correcto
```

Lo cacé porque la prueba de ida y vuelta medía las tres listas y `vzla` bajaba de
137. Mirando sólo `brl` —que salía perfecto— habría entregado un arreglo que
borra datos. **Una prueba que mide una sola lista no mide nada.**

### Y sólo empareja lo que vino de un ARCHIVO (ARREGLO 154b)

El emparejamiento por contenido, tal cual, **perdía una remesa de verdad**. El
caso lo señaló la extensión y encaja con cómo trabajan: ella registra en el
teléfono y Julio registra otra en la PC —mismo día, cliente, monto, ruta y tasa—
y **antes de sincronizar son dos operaciones distintas**. Reproducido:

```
A registra la suya ....... A tiene 1
B registra la suya ....... B tiene 1
tras sincronizar ......... 1   ← una se perdió
```

La prueba de CARLOS no lo cubría: esas siete ya estaban en los dos lados, así
que se emparejaban por `_uid` y no llegaban al contenido.

**El arreglo no es una heurística de tiempo.** La importación **marca**
(`_uidImp`) los registros a los que le pone un `_uid` nuevo, y la fusión sólo
empareja por contenido cuando uno de los dos lleva esa marca. Una remesa
tecleada en el formulario no la lleva nunca, así que dos reales no se emparejan
jamás; el duplicado de un archivo importado sí, que es para lo que existe.

Se mira **en los dos lados**: la marca la puede llevar el que llega o el que ya
está aquí, según cuál de los dos aparatos importó.

**Y la lección: una prueba que sólo usa datos que ya existen en los dos lados no
prueba la fusión.** Lo que hay que probar es lo que nace distinto en cada sitio.

### El aviso al guardar AVISA, no bloquea — y eso sale de medir

Fuera de los duplicados de la importación, en cinco meses hay **12 grupos**
repetidos y la mitad son operaciones **de verdad**:

```
17/09 · 150 R$ · CARLOS ALFREDO RODRIGUEZ · ×3 · tasas 172 / 173 / 172,5
17/09 · 200 R$ · CARLOS ALFREDO RODRIGUEZ · ×2 · misma tasa, 2 horas de por medio
05/08 ·  20 R$ · ROSA HERNANDEZ ·           ×2 · tasas 154 / 152
31/07 · 100 R$ · EDGAR MONTAÑO ·            ×2 · misma tasa, 4 minutos  ← éste sí
```

**Bloquear le impediría trabajar.** Se avisa con las que ya existen —su número,
su hora y su tasa— y decide ella.

- **La tasa decide el TONO, no si avisa.** Misma tasa: *"esto parece la MISMA
  operación"*. Otra tasa: *"ya hay una parecida"*. En sus datos esa regla acierta
  en los tres casos reales.
- **Y enseña las que ya están.** Un *"ya existe una igual"* a secas obliga a irse
  a Operaciones a buscarla para poder contestar.

### Un archivo sin identificadores se anuncia ANTES

Un export del formato viejo no trae `_uid`, así que la app reconoce cada remesa
por su contenido. Eso se dice antes de tocar nada, y al terminar se cuenta cuántas
reconoció y cuántas dio de alta. Es ella quien conoce sus datos.

**Lo que esto NO repara:** las 137 copias de mayo siguen ahí. Borrarlas movería
saldos y lotes FIFO de hoy, así que se quedan —decisión suya— y lo que las
neutraliza es que un mes cerrado deje de recalcularse.

## Un mes cerrado enseña lo que se guardó (ARREGLO 155)

Sus palabras (16/10): *"lo pasado se queda como está"* y *"un mes cerrado
muestra siempre lo guardado en su cierre y no se recalcula, para que no cambie
solo"*.

La app **recalculaba** los meses cerrados, y recalcular hoy sobre datos de hace
meses da otro número. Medido con su export:

```
          guardado    recalculado hoy
mayo        966,19       1.491,52     ← las 137 remesas repetidas de mayo
junio       322,68         358,07
julio       139,27         336,26     ← el ajuste de 94,24 creado tras cerrar
agosto       52,53          52,53     ← estos dos coinciden
sept.       296,79         296,79
```

Y de paso **es lo que neutraliza las copias de mayo sin borrar nada**: una
operación vieja de más ya no puede mover la ganancia de un mes cerrado. Borrarlas
movería saldos y lotes FIFO de hoy, así que se quedan — decisión suya.

- **Va en la PUERTA, `calcMesCompleto()`, no en cada pantalla.** Hay **18 sitios**
  que la llaman. Tocarlos uno a uno es el fallo que ya costó cuatro veces
  (ARREGLOS 101, 119, 150, 153): siempre queda uno fuera.
- **El propio cierre pide el recálculo** (`calcMesCompleto(mes, null, true)`). Si
  leyera lo guardado, cerrar escribiría lo que ya había, y al reabrir y volver a
  cerrar el cierre nuevo saldría del viejo.
- **El mes en curso se sigue calculando**: octubre no se congela.
- **Los nombres viejos se LEEN, no se reescriben.** El cierre guarda `egPag`
  donde hoy se llama `egEmpPag`, y `neto` donde hoy es `utilidadEmpresa`
  (`_CIERRE_A_CALC`). Los cierres guardados no se tocan.
- **Y el formato viejo tiene su salida.** El cierre de mayo es anterior a que la
  app calculara bien: **no guardó `utilidadEmpresa`**, sólo `neto`. Por eso la
  pantalla enseñaba **0** — no es que guardara cero, es que ese campo no existía.
- **Sólo se congelan NÚMEROS.** Si en la lista entrara un campo que es una lista
  —el detalle de ganancias extra— el cierre la sustituiría por la suya, que puede
  no estar, y la pantalla se quedaría sin detalle sin decirlo.

**Evolución nunca tuvo el problema**: ya leía `cierresMes` directamente. Medido
antes y después, sale idéntica.

**Y no se avisa de la diferencia en los meses viejos**, a propósito y por
decisión suya: *"no muestres avisos de diferencias en meses viejos"*.

## Un ajuste de saldo no es ganancia ni gasto (ARREGLO 156)

Su decisión (16/10): *"que no cuenten como ganancia del mes, pero que se vean
aparte"*. Un ajuste es **dinero que ya estaba y no se había registrado**;
contarlo como ganancia del mes infla la utilidad y con ella su sueldo, que es el
30 % de esa utilidad.

**La marca es estructural, no se adivina por el texto.** Los dos caminos del
ARREGLO 145 —`_ajusteAGanExtra()` y `_ajusteAEgreso()`— nacen con `esAjuste`
puesto. Buscar "AJUSTE" en la descripción **no sirve**, y está medido: de sus
seis ganancias extra de octubre, el texto acierta 4 de 5 — deja fuera
*"AUMENTAR SALDO DE CUENTA"*, que son **5,02**. Es la misma regla que ya obliga
a reconocer la mercancía por `fromArticulo` y no por la categoría: la
descripción la escribe ella y puede cambiarla.

**Dos puertas, una por lado**, y las dos en un solo sitio: `_egOperativos()` y
`_ganExtraOperativa()`. Escritas en cada pantalla se separarían con el primer
cambio — el fallo de los ARREGLOS 101, 119, 150 y 153.

**Y se dicen, no se esconden.** Van en línea aparte en el Resumen, con su
nombre, como el interés pendiente de un préstamo (ARREGLO 71). Medido con su
export, marcando los cinco de octubre:

```
                    antes      después
utilidad del mes    73,17        64,09
ganancia extra      14,93         1,84   ← lo que queda son los euros
egresos            189,93       185,92
ajustes de saldo        —    +13,09 / −4,01  =  +9,08 aparte
```

**Lo que cuesta, y hay que decírselo:** el *"te sobran"* de la conciliación
**sube**, de 6,94 a 16,02. No aparece dinero — lo que pasa es que ese dinero
deja de tener una operación que lo explique, que es exactamente lo que es. Un
ajuste de saldo **es** dinero sin explicar; el ARREGLO 145 le dio un sitio donde
anotarlo, y esto deja de contarlo como si lo hubiera ganado.

**Marcar a mano no mueve ningún saldo**, y se dice en la propia pregunta: el
dinero ya entró o salió cuando se registró. Hay guardia por nombre. Y **se puede
desmarcar**: medido, desmarcar devuelve los números exactos.

**La marca lleva su `_mod`**, o no viaja al otro aparato.

**Los de meses cerrados no se tocan** — desde el ARREGLO 155 un mes cerrado
enseña lo que se guardó, así que marcar algo de julio no mueve su cierre. Era su
condición.

## El mismo dinero contado dos veces: su sueldo del otro trabajo (ARREGLO 157)

Pasó el 09 y el 10/10 con **470.000 Bs**: lo registró como **aporte** (*"ya está
en el saldo"*, ARREGLO 147) y **además** como **ganancia extra personal** de
463,97. Las dos cosas hablan del mismo dinero, y el aporte es el correcto — una
ganancia extra dice *"esto lo gané"*, y su sueldo de otro trabajo no lo ganó aquí.

**Y no era uno: son tres.** Medido con su export, buscando por la forma:

```
19/09 · PAGO COMO AGENTE INTERCOM ............  54.493,48 Bs  ←→ aporte del 19/09
25/09 · PAGO DE AGENTE Y PENSIONES ...........  93.312,23 Bs  ←→ aporte del 25/09
10/10 · MI SUELDO ............................ 470.000,00 Bs  ←→ aporte del 09/10
```

**Se reconoce por la FORMA, no por el texto**: mismo monto, misma moneda, misma
cuenta y menos de ocho días de diferencia. Es la misma regla del ARREGLO 156 —
la descripción la escribe ella y puede cambiarla.

- **Quitar la duplicada NO mueve ningún saldo**, y se dice en la pregunta: el
  dinero ya está en la cuenta y ahí se queda. Deja la marca de borrado
  (ARREGLO 6c) o el otro aparato la devuelve.
- **Y no se vuelve a crear sin avisar**: `saveGanExtra()` pregunta cuando ya hay
  un aporte por el mismo monto en la misma cuenta. **Avisa, no bloquea** — puede
  ser otra cosa distinta que coincida.

**Lo que esto NO mueve, y hay que saberlo:** el capital y la conciliación **no
cambian**. Medido: quitar la de 463,97 deja `capital 2.711,65` y `te sobran
6,94` idénticos, porque una ganancia extra **personal** está fuera del capital de
la empresa (ARREGLO 96). Lo que estaba inflado es su **bolsillo personal**: ese
dinero aparecía dos veces.

## Un saldo escrito a mano deja de seguir al inventario, y eso se ve (ARREGLO 158)

Escribir a mano el saldo de una cuenta **en USDT** le pone `manual_override`, y
desde ese momento `sincronizarFIFOconCuentas()` **no la vuelve a tocar nunca**.
Es correcto —lo escrito a mano manda— pero **no se veía en ninguna parte**, y de
ahí salió la deriva de 79,70 que el ARREGLO 130 no pudo reconstruir: el saldo
dejó de seguir a los movimientos y nada lo dijo.

Medido en su export, y **son tres, no dos**:

```
BINANCE JULIO ....... dice     0,00   ·  si lo siguiera pasaría a  −142,85
MI SUELDO BINANCE ... dice    91,67   ·  si lo siguiera pasaría a   473,56
BINANCE SAIPA ....... dice     0,01   ·  si lo siguiera pasaría a   890,78
```

- **Se dice en las DOS pantallas** donde se ve un saldo: Configuración (donde se
  edita) y Balance de Cuentas (donde ella mira). Ponerlo en una sola es el fallo
  de buscar una copia y dejarse las otras (ARREGLOS 101, 119, 150, 153).
- **"Si lo siguiera pasaría a", no "el inventario dice".** Ese número son sus
  compras menos sus ventas de USDT en esa cuenta: es lo que la app **escribiría**,
  no lo que debería haber. Dicho de la otra forma se lee como dinero que falta, y
  con 890,78 en SAIPA eso es un susto por nada.
- **El botón quita la marca y NO toca el saldo.** Lo cambia el inventario la
  próxima vez que se dibuje, que es quien manda a partir de entonces.
- **Una cuenta sin ni una operación devuelve `null`, no 0.** Un 0 ahí se leería
  como "el inventario dice que tienes cero", cuando lo que pasa es que no sabe.
- **Y sólo avisa de las que de verdad lo llevan.** Sin esa comprobación saldría
  en todas las cuentas, y un aviso que sale siempre deja de leerse (ARREGLO 99).

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

#### Y para SUBIR un saldo no había camino (ARREGLO 145)

Su pregunta del 16/10: *"¿cómo puedo aumentar el saldo de una cuenta pero que se
guarde correctamente?"*.

Para **bajarlo** la app ya lo hacía bien: el motivo 2 del prompt —*"el banco me
cobró algo, o salió dinero de verdad"*— no toca el saldo y deja el **egreso**
empezado, que es lo que baja las dos caras de la cuenta.

Para **subirlo** no había nada. De los cuatro motivos, el único que hablaba de
dinero movido de verdad era ese, **y crea un egreso — lo contrario**. Medido en
v226 con su export, subiendo 150 R$ en PAGBANK:

```
elige «2»                 →  te deja un EGRESO de 150 listo en Egresos
                             guardarlo habría dejado la cuenta 300 por debajo
elige «3 · no sé por qué» →  +29,70 al "sin explicar" de la conciliación
```

Así que el único camino practicable mandaba al *sin explicar* un dinero que ella
sabe perfectamente de dónde salió — y ese número es el que existe para perseguir
lo que NO se sabe.

**La opción 2 pasa a ser la del SIGNO**, y el texto cambia con ella:

```
el saldo BAJA  →  "El banco me cobró algo, o salió dinero"  →  Egreso
el saldo SUBE  →  "Entró dinero de verdad"                  →  Ganancia extra
```

No es una pantalla nueva: **Ganancia extra ya existía** en la pestaña Nueva (P2P,
un trabajo, algo que vendió). Lo que faltaba era que el ajuste de saldo supiera
llegar hasta ahí.

- **`_ajusteAGanExtra()` es el espejo exacto de `_ajusteAEgreso()`**: no toca el
  saldo, deja el formulario empezado y lo dice. Registrarlo ahí es lo que sube
  **los dos lados** de la conciliación —medido: el *sin explicar* no se mueve ni
  un céntimo— y además entra en la ganancia del mes y en el cierre.
- **La cuenta va puesta.** En ese formulario el campo es **opcional**, y sin él
  `saveGanExtra()` apunta la ganancia y **no sube ningún saldo** — o sea que
  llegaría buscando subir una cuenta y se iría sin subirla. Hay guardia, y una
  prueba negativa que vacía ese campo.
- **Y hay que ABRIR el bloque** (`_showGanExtra=true`): nace cerrado, así que
  mandarla a la pestaña sin eso la deja mirando una pantalla donde no hay nada.
- **Una opción sola en pantalla, siempre la que toca.** Mostrar las dos sería
  pedirle que elija entre "entró" y "salió" cuando el signo del ajuste ya lo
  dice: el mismo criterio del ARREGLO 98 —quitar el control que sobra— aplicado
  a un prompt.

Medido pulsándolo en Chromium con su export, los dos sentidos: subiendo 150 abre
Nueva con la ganancia de 150 BRL en PAGBANK y el saldo intacto; al guardarla el
saldo sube **+150** y el *sin explicar* se queda en **913,16**. Bajando 150 sale
**idéntico a v226** — egreso, pestaña Egresos, saldo intacto. Los motivos 1, 3 y
4 sin cambios, cancelar no toca nada, 20 pestañas y 0 errores.

**Lo que sigue sin tener camino, y es correcto:** subir un saldo porque el dinero
vino de una **remesa**, un **traspaso**, una **venta de USDT** o el **cobro de un
préstamo**. Esos tienen su propia pantalla y es ahí donde hay que registrarlos —
pasarlos por Ganancia extra los contaría dos veces.

### Su plata no es la de la empresa, aunque pase por la misma cuenta (ARREGLO 146)

Sus palabras del 16/10: *"en mi sueldo de mi otro trabajo me pagan en bs, esos bs
entran a las cuentas de Venezuela o Banesco pero es plata mía de otra cosa y con
eso compro los usdt, entra a binance julio y de ahí paso a mi binance personal.
NO ES PLATA DE REMESASYA SAIPHA"*.

Y detrás, lo que de verdad pedía: *"no me enredes más con todos esos números
porque a fin y al cabo lo que me interesa saber es si realmente estoy ganando o
perdiendo"*.

**Las dos mitades se contaban mal, y cada una por su lado parecía correcta.**
Medido en su export del 15/10:

```
la ENTRADA  →  nadie la registra, el saldo sube solo      →  "sobra"
la SALIDA   →  una compra de USDT con destino personal    →  "las tasas"
```

De ahí que la fila *"tus bolívares valen menos hoy"* dijera **−726,72** cuando la
devaluación de verdad son **−18,28**: los otros **708,44** eran **cuatro
operaciones** de su sueldo del otro trabajo cruzando la empresa. Un número con el
rótulo de otro, que es el fallo más repetido de esta app.

#### Una compra de USDT que acaba en una cuenta 💜 es un traspaso, no una tasa

`_cruceUsdtPersonal()` lo decide **en un solo sitio**, y lo leen las DOS
funciones: la que lo descarta (`efectoTasasDesde`) y la que lo cuenta
(`traspasosAPersonal`). Con un criterio en cada sitio, el día que uno cambie el
importe se contaría dos veces o ninguna, y eso no se ve desde fuera.

- **Devuelve el lado de la EMPRESA, no el personal**, y eso no es un detalle: es
  lo que hace que el término valga **exactamente lo mismo** que valía dentro de
  `efectoTasasDesde()`, donde el lado personal se valoraba en 0 a propósito. Así
  el término cambia de sumando sin cambiar de valor. Comprobado: **el número no
  se mueve ni un céntimo** (912,17 antes y después); lo que cambia es *qué* dice
  la app que pasó con ese dinero.

```
                        v227        v228
"tus bolívares valen"  −726,72     −18,28   ← la devaluación de verdad
"pasaste a tus 💜"      143,19     851,63   ← ahí estaba
lo que sobra            912,17     912,17   ← idéntico
```

#### Y la entrada necesitaba un concepto que no existía

Se probaron las dos formas que la app ya tenía, con su export, y **ninguna sirve**:

```
Ganancia extra PERSONAL  →  sube la cuenta y NO sube "deberías"
                            el sobrante crece lo mismo que metió
Ganancia extra EMPRESA   →  cuadra, pero cuenta como ganancia del mes
                            y le sube el sueldo un 30% por plata que no ganó
```

Por eso `S.aportes`, con sus dos botones (*metí* / *saqué plata mía*). Mueve el
saldo **y** mueve `deberias` el mismo importe, así que la conciliación no se
entera — que es justo lo que tiene que pasar.

- **NO entra en `calcMesCompleto`**, y ésa es la mitad que da sentido a todo:
  si entrara, su sueldo del otro trabajo le inflaría la ganancia del mes y con
  ella el 30% que sale de la utilidad. Hay guardia para los dos lados.
- **Una cuenta 💜 no vale**, ni al medir ni al guardar. Ese dinero ya está fuera
  del capital (ARREGLO 96): meterlo o sacarlo de ahí no mueve *lo que tienes*, y
  moverlo en *deberías* abriría un hueco del tamaño del aporte. Guardar lo
  rechaza **antes** de tocar ningún saldo.
- **Borrar devuelve el saldo exacto** y deja la marca de borrado. Sin eso, un
  aporte mal metido habría que repararlo escribiendo el saldo a mano — justo lo
  que ella pidió no tener que hacer nunca más.
- **Elegir la cuenta NO llama a `R()`** (ARREGLO 32). Repintar rehace el
  formulario con el campo del monto dentro: es el mismo fallo del 136 y el 140,
  una capa más abajo. Se refresca el rótulo por su id, y el rótulo se escribe en
  **un** sitio (`_rotMontoAporte`) para que el campo no pueda decir una moneda y
  guardarse en otra. Probado **tecleando de verdad** en Chromium.
- **La fila del desglose va con su condición en la guardia.** Pidiendo solo el
  `push`, cambiar el `if` por un `false` dejaba la fila escrita y sin dibujar
  nunca, y la lista volvía a no sumar. Lo cazó la prueba negativa, no la guardia.

Medido con su export, el ciclo entero: meter 100.000 Bs sube BANESCO de 43,96 a
100.043,96 y **lo que sobra no se mueve** (912,17); borrarlo devuelve el saldo
exacto. Y con las cuatro entradas suyas registradas, **el misterio baja de 912 a
204**.

#### Pero el 146 dio por hecho que el dinero entra HOY (ARREGLO 147)

Lo cazó ella el 16/10, metiendo su primera entrada de verdad con el botón
recién desplegado. Los 470.000 Bs del 09/10 **entraron a BANESCO y salieron ese
mismo día** —con ellos compró USDT que se fue a su Binance personal— así que el
saldo correcto es **43,96**. El aporte lo dejó en **470.043,96**.

Y el sobrante no bajó ni un céntimo, que es lo que lo delató:

```
aporte que SUBE el saldo   tienes +465 y deberias +465, se cancelan   912,17
aporte que solo EXPLICA    tienes igual, deberias +465                446,59
```

**Las dos cuentas son correctas y cada una vale para su caso.** Lo que faltaba
era poder decir cuál. Por eso hay un tercer estado:

```
⬇️ Metí plata mía        el saldo sube      ← entra hoy
⬆️ Saqué plata mía       el saldo baja
📌 Ya está en el saldo   no lo toca         ← entró y ya salió
```

**Y mi error de método fue el de siempre con otra cara:** medí *"baja de 912 a
204"* metiendo los cuatro registros en la lista **sin tocar los saldos**. Esa
simulación representaba un mundo donde el dinero está en las cuentas; en el suyo
entró y salió. La medición no estaba mal — estaba midiendo **otro caso** del que
luego di instrucciones. Es la cara B del ARREGLO 84: *medir no vale si mides otra
cosa*, y aquí lo otro era el estado de partida.

- **La regla vive en UN sitio** (`_aporteSubeSaldo`) y la leen el guardado y el
  borrado. Escrita en cada uno, un día guardar subiría un saldo que borrar no
  devolvería — y eso deja una cuenta inflada sin que nada lo diga. Es lo que ya
  obligó a `_restaurarVentasFIFO` (ARREGLO 97).
- **Para la conciliación, `ya` cuenta igual que `entra`.** El dinero entró de
  verdad: es lo que explica el hueco que dejó la salida ya registrada. Lo único
  que cambia es que no se vuelve a sumar al saldo.
- **El aviso dice qué pasa CON EL SALDO**, con las dos cifras (*"pasa de 43,96 a
  470.043,96"* o *"NO se toca: se queda en 43,96"*). Es lo único que distingue
  los tres, y es justo lo que no se vio la primera vez: un *"Metiste 470.000"*
  sobre una cuenta que tiene 44 se lee igual de bien que el correcto.
- **Y el "a cuánto queda" sale de la misma regla**, no de una cuenta aparte.
- **Los tres botones se dibujan desde una sola lista** y cada uno dice debajo
  qué le hace al saldo. El de `ya` va en su propia fila y a lo ancho: con sus 112
  ajustes de saldo, es el que más va a usar al ponerse al día.
- **Un `dir` desconocido se normaliza a `entra`** en el guardado **y con el mismo
  criterio en el formulario**: si se separaran, lo marcado y lo guardado podrían
  no ser lo mismo.

Medido en Chromium con su export, pulsando el botón y tecleando de verdad:

```
                              sobra     BANESCO
1 · hoy                       912,17      43,96
2 · ⬇️ Metí (lo de ayer)      912,17  470.043,96   ← inflado
3 · 📌 Ya está en el saldo    446,59      43,96
4 · borrarlo                  912,17      43,96   ← vuelve exacto
5 · LAS CUATRO con 📌         203,73      43,96   ← y BVJ y SAIPA intactas
```

**203,73**, que es 912,17 − 708,44 al céntimo: justo las cuatro operaciones que
el 146 sacó del "efecto de las tasas". Las dos mitades cierran.

**Lo que esto enseña para la próxima, y vale más que el arreglo:** *"regístralo"*
no es una sola cosa. Un dinero que **entra hoy** y uno que **entró y ya salió**
necesitan apuntes distintos, y la app tiene que preguntar cuál es — no darlo por
hecho. El 146 lo dio por hecho y salió inflando una cuenta.

#### Y la tarjeta ahora abre contestando "¿gano o pierdo?"

Era la pregunta que esta tarjeta no contestaba, y el dato existía desde siempre
en `calcMesCompleto()` sin que ninguna pantalla lo pusiera donde ella mira:

```
¿GANAS O PIERDES?          ✅ 4 meses seguidos ganando
jun  ▇▇▇▇▇▇▇▇▇▇▇▇  +$358,07
jul  ▇▇▇▇▇▇▇▇▇▇▇   +$336,26
ago  ▇▇             +$52,53
sep  ▇▇▇▇▇▇▇▇▇▇    +$296,79
oct  ▇▇▇            +$73,17   ← va a mitad
```

- **Sale de `calcMesCompleto()` y de ningún otro sitio**: es la MISMA cuenta que
  el Cierre y Evolución. Calculada aparte, un día el Balance diría que ganó y el
  Cierre que perdió, y no habría forma de saber cuál mirar — el 34,27 contra el
  34,28 con la pregunta más grande que ella hace.
- **Es la `utilidadEmpresa`, no la bruta**: lo que le queda LIMPIO después de los
  gastos, que es lo que preguntó.
- **El mes en curso se dibuja pero no cuenta para la racha.** Contándolo, el día
  1 de cada mes diría *"0 meses ganando"*, que es falso y además asusta.
- **Un mes sin nada registrado no sale**: una barra en cero se lee como un mes
  malo, y lo que fue es un mes que todavía no existe.
- **Sin memo.** Cuesta 2,17 ms por los cinco meses (medido), y un memo en la
  cifra que decide cómo ve su negocio haría que dependiera de *cuándo* se
  preguntó (ARREGLO 132).

**Cuesta 177 px** en una pestaña de la que ya se quejó (1.691 → 1.868). No es un
fallo que arreglar: es lo que se compra al contestar su pregunta primero.

#### Y fuera la palabra "sin explicar"

Sus palabras: *"si me tienes que decir si sobra o falta, mas no me tienes que
decir sin explicar"*. Y tenía razón por dos lados: leía los 912 como dinero que
le faltaba **cuando es lo contrario**, y *"sin explicar"* es la pregunta del
contador, no la suya.

**El número es el mismo** —el que de verdad no encaja, no la diferencia bruta
(ARREGLO 60)— y lo que cambia es cómo se dice: **te sobran**, o **te faltan**.
Hay guardia para que no vuelva.

#### Lo que esto NO repara, y hay que decírselo

Las cuatro entradas suyas de septiembre y octubre **ya ocurrieron y no están
registradas**. El arreglo vale de aquí en adelante; esas hay que meterlas una
vez con el botón nuevo. Y el resto —los ~204 que quedarían— sigue sin explicar,
con sus **112 ajustes de saldo** (109 sin motivo guardado) como sospecha
principal.

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
entero en vez de teorizar. (Los de antes del ARREGLO 50 no guardan `ts`, pero
**la hora está en el id**: `_tsDeAjuste()` la saca, y lo mismo vale para el
`_uid` de cualquier remesa. Ya no hay que teorizar con el orden de un día.)

---

## Lo que no se dibuja, no se queda (ARREGLO 160)

El **Balance Mensual viejo** (`rBalanceStd`) y su **calculadora de tasa** —los
cuatro campos `calc-tc-*` y el despeje al revés— estaban escritos en el archivo
y **nadie los llamaba**. Comprobado en Chromium dibujando las 26 pestañas con su
export: ninguno de esos campos llegaba al DOM, ni una vez.

**El grep no basta para decidirlo, y por poco me engaña al revés:** buscando el
texto en `document.body.innerHTML` salían en TODAS las pestañas, porque el body
lleva dentro el `<script>` con el archivo entero. Lo que contesta la pregunta es
`document.getElementById()`, que mira el DOM de verdad. Es el ARREGLO 84 otra
vez: medir no vale si mides otra cosa.

**Lo que costaba, que no era el peso:**

- el **ARREGLO 159** arregló ahí un `parseFloat` que daba 0 siempre — en una
  pantalla que no se dibuja;
- la guardia del **ARREGLO 150** contaba sus llamadas a `_egOperativos()` como
  si fuera un sexto sitio, así que **vigilaba una pantalla que no existe** (eran
  cinco);
- y de ella colgaba **`cerrarMes()`, un SEGUNDO camino para cerrar un mes**: por
  `S.filtroMes` en vez de `S._cMes`, con sus propias reglas. Dos caminos para
  cerrar un mes es exactamente lo que costó el ARREGLO 91.

Es el **ARREGLO 59** otra vez, y con sus mismas palabras: *el peligro no era el
peso, era que alguien las leyera y creyera que eran las buenas*.

- **Se fueron seis**: `rBalanceStd`, `calcTasaUpdate`, `calcTasaObjetivoUpdate`,
  `guardarTasaHoyDirecto`, `cerrarMes` y `exportMesSel`. Las dos últimas no eran
  el encargo: quedaron huérfanas al irse la primera, y dejarlas colgando es
  justo el estado que este arreglo viene a cerrar.
- **La guardia mira las funciones Y sus campos.** Por el nombre volvería con
  otro nombre; por el `id='calc-tc-brl'` no. Y exige que `rBalance()` siga
  pasando por `rBalancePlus()`, que es el Balance que **sí** se dibuja — borrar
  el bueno tenía que fallar, y hay una negativa que lo prueba.
- **Lo que queda es idéntico.** Medido con su export, v241 contra v242: 26
  pestañas, 0 errores, capital 2.711,65, te sobran 6,94, utilidad 73,17, tasas
  184 · 205, y el Balance dibuja **exactamente los mismos 14.446 caracteres**.

**Y la calculadora que ella usa no es ésta:** es la de la pestaña 🧮 Tasas, la
de *"publicar esta"*. Esa acepta la coma desde siempre (`_cgSet` pasa por
`_num()`) y no se tocó — medido tecleando de verdad, la tasa publicada se queda
en 184 · 205.

---

## Toda salida de Bs descuenta su lote (ARREGLO 161)

Lo vio ella el 16/10: los lotes de VES decían tener **44.668,68 Bs más** que las
cuentas (medido en su export; ella contaba ~45.022 con lo de después).

**De las cuatro puertas que se sospechaban, dos ya estaban cerradas**, y eso hay
que medirlo antes de tocar nada — si se añade consumo donde ya lo hay, se
descuenta dos veces:

```
egresos (empresa, personales, compromisos, cuotas del piso,
  mercancía, préstamos dados) ...... YA, por descontarFIFOEgreso()  · 8 llamadas
remesas BRL→VZLA ..................  YA, por consumirFIFORemesa()
TRASPASOS desde una cuenta VES ....  NO   ← esto
la COMISIÓN del banco .............  NO   ← y esto (ver arriba)
compras de USDT pagadas con Bs ....  NO   ← pendiente, a propósito
```

Su ejemplo del egreso del 06/10 (3.925,12 Bs) **sí descontaba**: ese camino
llevaba tiempo bien.

### Y comprar USDT con Bs se PREGUNTA (ARREGLO 162)

Suman 782.084 Bs en octubre y aun así **no generan deriva**, y la razón es la
que decide el diseño:

```
09/10  ENTRA aporte      470.000 Bs a BANESCO   ← su sueldo: no crea lote
09/10  SALE  compra USDT 470.000 Bs de BANESCO  ← no consume lote
```

**Esos bolívares nunca estuvieron en un lote.** Hacerlas consumir "de la
empresa" por omisión se habría comido 470.000 Bs de lotes que no les
corresponden — el mismo error al revés, con los lotes por debajo de las
cuentas y las tasas sugeridas torcidas. **La primera propuesta fue "consumir sólo hasta donde haya lote", y la tumbó
ella con el argumento correcto: el lote NO SABE DE QUIÉN ES EL DINERO.** Si en
esa cuenta hay lotes de la empresa, su sueldo se los come igual. Sólo ella sabe
de dónde salió ese dinero, así que **lo dice ella**, con un selector al
registrar la compra:

```
¿De dónde salen estos Bs?
  De la empresa · gasta inventario          ← por omisión
  Aporte o dinero personal · no gasta
```

- **Sólo sale pagando en bolívares.** Con reales no hay lote de Bs que gastar, y
  una pregunta que siempre está deja de leerse (ARREGLO 99).
- **La marca viaja con el lote** (`origenBs`), así que el borrado sabe si tiene
  algo que devolver. Devolverle saldo a un lote que esa compra nunca gastó le
  regala bolívares, y de ahí salen las tasas que la app sugiere.
- **Por omisión, empresa**, que es lo que ella pidió: el caso normal.

Medido con su export, una compra de 5.000 Bs desde el Banco de Venezuela:

```
                  marcada PERSONAL     marcada EMPRESA
el lote                   0                −5.000
el saldo             −5.000               −5.000
al borrarla      saldo y lote EXACTOS, en los dos casos
```

### Lo que entró

- **`consumirLotesVES()` pasa por las funciones de siempre**: el simulador para
  saber *qué* lotes, y `consumirInventarioFIFO()` para aplicarlo. Dos maneras de
  consumir el FIFO se separan con el primer cambio (ARREGLO 97). **El simulador
  va ANTES**: después vería los lotes ya consumidos y el espejo saldría vacío.
- **Lo consumido se guarda DENTRO del registro** (`_lotesConsumidos`), como ya
  hace una remesa, y la vuelta es `_restaurarVentasFIFO()` — por id, reviviendo
  el lote archivado (ARREGLO 127) y levantando su marca (ARREGLO 137).
- **Lo que se devuelve se calcula en UN sitio** (`_bsADevolver`): lo entregado
  más la comisión. Lo leen los **dos** caminos del borrado, con `_mov` y sin él.

### Y de paso, un fallo peor en la misma función

Borrar un traspaso **con cambio de moneda** le restaba al destino el monto de
**origen**. Reproducido en Chromium con sus datos:

```
traspaso 20.000 Bs → 20 USDT
  al crearlo    BINANCE JULIO   +20 USDT
  al borrarlo   BINANCE JULIO   −19.980 USDT   ← la cuenta destrozada
```

`revertirSaldosTraspaso` usaba `monto` para los dos lados. Los traspasos viejos
sin `montoDestino` siguen cayendo en `monto`, que para ellos es correcto: se
hicieron sin cambio de moneda. **Si alguna vez se borró un traspaso con cambio
de moneda, esa cuenta quedó mal** — y es una sospecha medida, no una causa
probada, de las derivas de Binance que el ARREGLO 130 no pudo reconstruir.

### Medido, v242 contra v243

```
                            v242              v243-TEST
traspaso 20.000 Bs      lote intacto      lote −20.000
borrarlo                −19.980 USDT      saldo y lote EXACTOS
egreso de 5.000 Bs      lote −5.000       lote −5.000   ← no se descuenta dos veces
remesa con comisión     lote −18.400      lote −18.455,2
  su ganancia            1,5171 USDT       1,5171 USDT  ← idéntica
capital · te sobran     2.711,65 · 6,94   2.711,65 · 6,94
```

26 pestañas, 0 errores, 9 pruebas negativas y las 9 cazadas.

**Lo que esto NO repara:** los 44.668 Bs que ya están de más en los lotes. Eso
vale de aquí en adelante; lo viejo se cierra **una sola vez y con su OK**, nunca
con un arreglo automático.

---

## Un borrado sin marca lo resucita el servidor (ARREGLO 163)

Lo cazó ella probando el 161 en `test`: borró el traspaso de 20.000 Bs, el saldo
y el lote volvieron bien, y **el registro reapareció segundos después** — y
volvió **sin su `_lotesConsumidos`**, o sea sin el descuento, así que el lote
quedaba otra vez 20.000 Bs por encima de la cuenta. **La deriva que el 161 vino
a cerrar, reabierta por la sincronización.**

Es el ARREGLO 137 otra vez: *cuando un arreglo toca algo que se sincroniza, hay
que hacerle dar la vuelta al servidor.* El 161 se midió en una pestaña sola.

**Y estaba igual en producción (v242) desde siempre**, no lo trajo el 161: lo
que hizo el 161 fue darle consecuencias — antes resucitaba un traspaso que no
tocaba lotes; ahora resucita uno que sí.

### Las tres mitades, y sólo faltaba una

```
_MERGE_FIELDS   ¿esta lista se fusiona?        traspasos SÍ estaba
_PODA_CATS      ¿la poda mira esa marca?       traspasos SÍ estaba
reqDel          ¿se crea la marca al borrar?   traspasos NO estaba   ← esto
```

O sea: la lista se fusionaba y la poda la habría mirado, pero **la marca no se
creaba nunca**, así que no había nada que podar.

**Y no se arregla añadiendo un octavo nombre a la lista.** `reqDel` decidía
mirando **una lista escrita a mano de siete nombres**, que es exactamente lo que
ya falló cuatro veces (ARREGLOS 101, 119, 150, 153): una regla copiada en varios
sitios y uno que se queda fuera. La pregunta es *"¿esta lista se fusiona?"*, y
eso lo contesta `_MERGE_FIELDS`, que es donde ya vive. Así una lista nueva queda
cubierta sola.

- **El id con el que se marca sale de `_MERGE_ID_FIELD`**, no del que llega a
  `reqDel`. No todas usan `id`: `clientes` usa `cod` y `cierresMes` usa `mesKey`.
- **Y la rama de las remesas va PRIMERO.** Su `_MERGE_ID_FIELD` es `_uid` pero a
  `reqDel` le llega la `n`, que es numeración y se renumera. Detrás de la regla
  general se marcarían por `n` y la marca no valdría para nada. Hay guardia para
  el orden, porque las dos ramas por separado parecen correctas.

### Medido con su export, el ciclo entero

Borrar → guardar → el servidor devuelve su bloque (con el traspaso dentro) →
adoptar la respuesta. No en una pestaña: el ciclo.

```
                        v242 (producción)      v245-TEST
1 creado                lote 217.431,60        lote 197.431,60
2 borrado               marca: NO              marca: SÍ
3 contesta el servidor  REVIVE                 no revive
4 segunda vuelta        REVIVE                 no revive
```

Y el caso duro —un traspaso que vacía un lote **entero**, que es donde murió el
ARREGLO 127 y lo rescató el 137— también pasa: el lote de 33.278 Bs se archiva
con su marca, al borrar el traspaso revive con sus 33.278 exactos, sale del
archivo, la marca se levanta, **y todo eso sobrevive a la respuesta del
servidor**.

Las remesas se siguen marcando por `_uid`. 26 pestañas, 0 errores, 7 pruebas
negativas y las 7 cazadas.

**Lo que esto NO repara:** un traspaso que ella haya borrado antes de esto y que
el servidor devolviera sigue ahí. Si aparece uno repetido, hay que borrarlo otra
vez —ahora sí se queda— y revisar si su lote quedó alto.

---

## Cuadrar los lotes de Bs con las cuentas (ARREGLO 164)

El ARREGLO 161 cerró las dos puertas por donde se seguía abriendo la deriva
—los traspasos y la comisión del banco no descontaban— pero eso vale **de aquí
en adelante**. Lo viejo sigue ahí, y de esos lotes salen las tasas que la app
sugiere. Esto lo cierra, **una vez y con su OK**.

**La regla la dio ella, y es POR CUENTA:**

```
si los lotes vivos de una cuenta pasan de su saldo, se cierra la diferencia
empezando por los lotes MÁS VIEJOS; si la cuenta está en cero o en
negativo, sus lotes quedan en 0
```

**Y eso cambia el número.** Sumando todo junto salían 44.668,68 Bs; cuenta por
cuenta son **44.712,63**:

```
BANCO DE VENEZUELA   saldo 172.958,96   lotes 217.431,60   sobran 44.472,64
PROVINCIAL           saldo     710,01   lotes     950,00   sobran    239,99
BANESCO              saldo 120.800,24   lotes 120.756,28   ← 43,96 POR DEBAJO
```

Los 43,96 de BANESCO tapaban parte de lo que sobra en otra. **El FIFO gasta los
lotes de la cuenta que de verdad paga** (`cuentaDestinoId`), así que un hueco en
una no compensa un exceso en otra.

- **Lo que sobra se calcula en UN sitio** (`_derivaLotesVES`), y lo leen la
  vista previa que ella mira **y** el botón que lo aplica. Calculado aparte,
  bastaría un redondeo distinto para cerrar un número que no es el que está
  leyendo — el 34,27 contra el 34,28, pero moviendo los lotes de los que salen
  sus tasas.
- **El conjunto de lotes es EXACTAMENTE el que recorre `simularConsumoFIFO`**:
  venta, en VES, de esa cuenta, en orden `ordenFIFO`. Medido de otra forma se
  cerraría lo que el FIFO no gasta, o se dejaría abierto lo que sí.
- **Mirar no gasta.** `_derivaLotesVES` no escribe en ningún lote; hay guardia y
  prueba negativa dedicadas.
- **NO toca el saldo de ninguna cuenta ni ningún mes cerrado**, y se dice en la
  propia pregunta. El dinero del banco está bien; lo roto es el inventario.
- **Un lote sin cuenta, o pegado a una cuenta que ya no existe o que no está en
  VES, no se toca.** No hay contra qué medirlo, y cerrar por un saldo que no
  existe es inventarse la regla para un caso que ella no nombró. Sale en la
  vista previa dicho con su nombre: visible, no silencioso. En su export hay uno
  así, con 0,00 Bs.

### El registro va DENTRO del lote, y no por comodidad

Una lista nueva que sincronizar tendría que entrar **también en las cuatro
listas del servidor** (`main.py`), y desde el entorno no se alcanza: una clave
que se añada aquí y se olvide allí viaja y el servidor la tira con un 200 y sin
un solo error. Ha pasado dos veces.

Así que lo que se le quitó a cada lote vive en su `_ajVES` —`{ts, por, antes}`—
igual que una remesa guarda su `_lotesConsumidos`: viaja con el lote, se une
como el lote y se archiva con el lote. **Lo que agrupa una corrección es su
hora**, y por ahí se deshace entera.

- **Deshacer son DOS mitades.** Devolver el `antes` **y** sacar del archivo el
  lote que la corrección dejó en cero (`_revivirLote`, ARREGLO 137): sin eso el
  lote recupera su saldo y se queda escondido, donde el FIFO no lo gasta nunca.
- **Y las dos tienen que sobrevivir al servidor.** Medido el ciclo entero
  —aplicar, guardar, adoptar la respuesta, deshacer, adoptar otra vez—: la
  deriva se queda en 0 tras el servidor y al deshacer los lotes vuelven exactos.

### Y el botón de julio se fue, que era una trampa

En ese mismo sitio había un `🛠️ Corregir lotes VES (una vez)` del 30/jul con los
números escritos a mano: dejaba **todos** los lotes de venta en VES en 0 salvo
uno de 50.000 exactos **que ya no existe**. Su bandera (`_correccion30jul`) no
se guarda ni se sincroniza, así que volvía a salir en cada arranque y en cada
aparato. Medido con su export del 16/10: **pulsarlo hoy se llevaba los
339.137,88 Bs de sus 6 lotes vivos.**

Una pantalla nueva **quita** el control viejo, no se pone al lado (ARREGLO 98).

### La vista previa, y por qué no es una tabla

El primer intento era una tabla de cuatro columnas con `min-width:430px`. En su
teléfono son 412, así que **"LOTES DESPUÉS" —justo la columna que ella pidió
ver— quedaba fuera** y había que arrastrar. Es el ARREGLO 137 otra vez: lo que
queda tras un arrastre no existe. Ahora es una fila por cuenta. Medido a 390,
412, 768 y 1280 px: **0 elementos fuera de pantalla**, sin scroll horizontal.

**El botón sólo sale cuando hay algo que hacer** —deriva que cerrar o una
corrección que deshacer—. Uno que está siempre y casi nunca significa nada deja
de leerse (ARREGLO 99). Y desplegar no llama a `R()` (ARREGLO 32).

### Medido con su export, el ciclo entero

```
                      antes      aplicar    el servidor    deshacer   +servidor
lotes BdV        217.431,60   172.958,96    172.958,96   217.431,60  217.431,60
lotes PROVINCIAL     950,00       710,01        710,01       950,00      950,00
lotes BANESCO    120.756,28   120.756,28    120.756,28   120.756,28  120.756,28
saldos de las 3     sin tocar    sin tocar     sin tocar    sin tocar   sin tocar
capital              2.711,65     2.711,65      2.711,65     2.711,65    2.711,65
te sobran                6,94         6,94          6,94         6,94        6,94
utilidad de octubre     73,17        73,17         73,17        73,17       73,17
```

Casos de borde: saldo **−500** → los lotes quedan en 0 y el saldo no se toca;
saldo **0** → igual; lotes **por debajo** del saldo → no se toca nada. 26
pestañas, 0 errores, 12 pruebas negativas y las 12 cazadas.

**Y un fallo de método, por si vuelve:** el primer barrido de pestañas dejó
`R()` puesto en vacío, así que **no dibujaba nada** y daba 0 errores sin haber
mirado. Lo mismo con las dos comprobaciones de "no hay deriva": subí el saldo de
una sola cuenta y PROVINCIAL seguía con sus 239,99, así que medían otra cosa.
Las tres veces, el ARREGLO 84: *medir no vale si mides otra cosa.*
