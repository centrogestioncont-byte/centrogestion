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
