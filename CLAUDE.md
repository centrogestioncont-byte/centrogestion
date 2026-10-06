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

Y ojo: **la comisión baja la cuenta pero no el lote.** Es correcto — el lote
lleva los bolívares que se le entregaron al cliente, y la comisión es un cobro
aparte del banco. Por eso la cuenta va siempre un poco por debajo del FIFO,
justo lo que se llevó el banco. No lo "arregles".

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

### El mismo gasto personal se resta DOS veces (pendiente, medido)

Sale de medir el ARREGLO 94 y **no está arreglado**: es decisión suya porque le
mueve los números.

Un gasto personal pagado desde una cuenta 💜 **personal** se resta de "deberías
tener" por `egPerPagPropio`. Pero una cuenta 💜 no está dentro del capital de la
empresa —comprobado: sumarle 1.000 a una 💜 no mueve "lo que tienes"— así que ese
dinero **ya había salido** cuando se traspasó a esa cuenta, y `traspasosAPersonal()`
ya lo restó. Se resta dos veces.

Reproducido con su export, y las dos mitades se ven una encima de la otra en la
propia tarjeta:

```
12/09  traspaso  BINANCE SAIPA → MI SUELDO BINANCE 💜   51,52 USDT
18/09  gasto     "CAMIDA PARA LA CASA", desde 💜        51,52 USDT

Gastos personales            −$51,52
Pasado a cuentas personales  −$51,52   ← el mismo dinero
```

```
             sin explicar      veredicto
hoy ............  +59,28       ⚠️ Sobra sin explicar
corregido ......   +7,76       ✅ Cuadra   (margen ±50,62)
```

O sea que esto es **la mitad de su *"nunca está en 0 siempre tiene un
desajuste"***. El arreglo sería no restar de `deberias` los gastos personales
pagados desde una cuenta 💜; los pagados desde una cuenta de la empresa se siguen
restando, porque esos sí salieron de ella.

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
entero en vez de teorizar. (Los de antes del ARREGLO 50 no guardan `ts`, pero
**la hora está en el id**: `_tsDeAjuste()` la saca, y lo mismo vale para el
`_uid` de cualquier remesa. Ya no hay que teorizar con el orden de un día.)
