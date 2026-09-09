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

## Lo que esto NO prueba

La logica del negocio. Para eso hace falta la API corriendo, una base y un
navegador de verdad: guardado entre dos dispositivos, fusion sin pisarse,
importacion. Esas pruebas existen pero se corren a mano, fuera de este
repositorio, porque necesitan tambien el repositorio de la API.
