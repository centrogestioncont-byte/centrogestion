#!/usr/bin/env python3
"""Si index.html cambia, APP_VERSION tiene que cambiar con el.

ARREGLO 82. La app lleva un detector de version propio: _checkAppUpdate() se
baja el archivo publicado, le saca APP_VERSION y, si no coincide con la que
esta corriendo, enseña "hay una version nueva, toca para actualizar". Ese
aviso es lo UNICO que saca a un aparato de su copia en cache.

El numero estuvo clavado en 20260910_v153 desde el 5 de septiembre mientras
index.html recibia 126 commits. O sea que el aviso no salio ni una vez en
todo ese tiempo: ella descargo el PDF del cierre y le salio el de antes del
arreglo —las secciones en fila y el texto gris— con el arreglo desplegado en
produccion desde hacia rato, y nos pasamos un rato buscando en el sitio
equivocado.

Pedirlo en un comentario del codigo ya se intento y no funciono. Esto lo
comprueba en cada PR: si el diff toca index.html y no toca APP_VERSION, falla.
"""
import re
import subprocess
import sys

ARCHIVO = "index.html"
PATRON = re.compile(r'APP_VERSION\s*=\s*"([^"]+)"')


def _git(*args):
    return subprocess.run(["git", *args], capture_output=True, text=True).stdout


def _version_en(ref):
    txt = _git("show", f"{ref}:{ARCHIVO}")
    m = PATRON.search(txt)
    return m.group(1) if m else None


def main():
    base = sys.argv[1] if len(sys.argv) > 1 else ""
    if not base:
        print("Sin rama base contra la que comparar — nada que revisar.")
        return 0

    cambiados = _git("diff", "--name-only", f"{base}...HEAD").split()
    if ARCHIVO not in cambiados:
        print(f"{ARCHIVO} no cambia en este PR — no hace falta subir la version.")
        return 0

    antes = _version_en(base)
    ahora = _version_en("HEAD")
    if ahora is None:
        print("ERROR: no encuentro APP_VERSION en index.html.")
        return 1

    print(f"  APP_VERSION en {base}: {antes}")
    print(f"  APP_VERSION aqui:      {ahora}")

    if antes == ahora:
        print()
        print("FALLA: index.html cambia y APP_VERSION se queda igual.")
        print()
        print("  El aviso de 'hay una version nueva' solo sale cuando este")
        print("  numero cambia. Si no cambia, el telefono se queda con la copia")
        print("  vieja en cache y el arreglo no llega, aunque este desplegado.")
        print()
        print("  Sube el numero en index.html (formato aaaammdd_vNNN).")
        return 1

    print()
    print("Todo en orden.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
