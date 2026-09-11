# Pruebas

## `revisar.py`

Revisa que `index.html` este entero y que no le falte nada para arrancar.
Corre solo en cada Pull Request contra `test` y contra `main`.

A mano:

```
python3 pruebas/revisar.py
```

Devuelve 0 si esta todo bien, 1 si hay algun problema. Necesita `node` en el
PATH para verificar la sintaxis.

Que mira:

1. **Tamano.** Menos de 900 KB significa archivo cortado.
2. **Sintaxis.** Cada bloque `<script>` tiene que compilar (`node --check`).
3. **Funciones.** Las 19 que la app necesita para guardar, cargar y respaldar.
   Si falta una, la app arranca igual y deja de funcionar en silencio.
4. **Firebase.** Que no vuelva codigo de Firebase, sacado en la migracion a
   MongoDB. Las menciones en comentarios no cuentan: la historia de los
   arreglos esta contada ahi y nombra funciones que ya no existen.

Por que existe: las dos peores roturas de este proyecto fueron de este tipo
—una vez el archivo quedo en cero bytes, otra desaparecieron seis funciones
al cortar un rango de lineas equivocado—. Las dos se habrian visto aca.

## `prestamos.js`

Prueba la logica de prestamos que se puede correr sin navegador ni API.
Saca las funciones directamente de `index.html` y las ejecuta sueltas, asi
que prueba el codigo que de verdad se despliega.

A mano:

```
node pruebas/prestamos.js
```

Que mira:

1. **Fechas de cuota.** Que un prestamo del 29, 30 o 31 recorte al ultimo
   dia del mes en vez de desbordar al siguiente. `setMonth()` a secas
   convertia el 31/01 + 1 mes en 03/03: la cuota 1 quedaba a 28 dias de la
   cuota 2 en vez de 30 y el cliente ganaba dias gratis.
2. **Mora por atraso.** Que no cobre dentro de los dias de gracia, que la
   multa sea unica y los juros crezcan por dia, que corra solo sobre la
   parte impaga de la cuota, que no se evapore cuando el cliente salda la
   cuota atrasada, y que los interruptores de Configuracion la apaguen.

## Lo que esto NO prueba

El resto de la logica del negocio. Para eso hace falta la API corriendo, una
base y un navegador de verdad: guardado entre dos dispositivos, fusion sin
pisarse, importacion. Esas pruebas existen pero se corren a mano, fuera de
este repositorio, porque necesitan tambien el repositorio de la API.

## Nota: el repositorio es privado

Desde el 09/09/2026 los dos repositorios son privados. Cloudflare Pages
sigue construyendo desde aca: la integracion con GitHub sobrevive al cambio
de visibilidad mientras la aplicacion de Cloudflare conserve acceso al
repositorio. Si algun dia un despliegue falla al clonar, el lugar donde se
revoca o se devuelve ese acceso es GitHub -> Settings -> Integrations ->
Cloudflare Workers and Pages -> Repository access.
