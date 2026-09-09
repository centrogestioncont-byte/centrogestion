#!/usr/bin/env python3
"""Revision automatica de index.html.

No prueba la logica del negocio —para eso hace falta la API y un navegador—,
sino que el archivo esta entero y que no falta nada que la app necesite para
arrancar. Existe porque las dos peores roturas de este proyecto fueron de ese
tipo: una vez el archivo quedo truncado en cero bytes, y otra desaparecieron
seis funciones al cortar un rango de lineas equivocado. Las dos se habrian
visto aca en dos segundos.

Se corre solo en cada Pull Request. A mano: python3 pruebas/revisar.py
"""
import io
import os
import re
import subprocess
import sys
import tempfile

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARCHIVO = os.path.join(RAIZ, "index.html")

# Minimo razonable: hoy pesa 1,2 MB. Si baja de esto, algo se corto.
TAMANO_MINIMO = 900 * 1024

# Si alguna de estas desaparece, la app arranca pero deja de guardar, de
# cargar o de respaldar —sin decir nada. Son las que ya se perdieron una vez.
FUNCIONES = [
    "saveData", "loadData", "autoBackup", "restoreFromBackup",
    "fbSave", "_guardarBloque", "enviarEstadoALaApi", "_dobleEnviarAhora",
    "cargarEstadoDeApi", "_aplicarEstadoDeApi", "apiFetch",
    "importData", "exportData",
    "_asignarUidsFaltantes", "_uidEstable", "_newUid",
    "_marcarBorradoMerge", "_volcarDatos", "logAudit",
]

# Firebase se saco en la migracion a MongoDB. Si algo de esto vuelve a
# aparecer es que se revivio codigo viejo en una fusion.
PROHIBIDOS = [
    ("firebase.initializeApp", "el SDK de Firebase"),
    ("_fbRef", "la referencia de Firebase"),
    ("initFirebase", "el arranque de Firebase"),
    ("fbSaveREST", "el guardado por REST de Firebase"),
    ("_fbMergeAndWrite", "la fusion en el navegador de Firebase"),
    ("firebaseio.com", "una URL de Firebase"),
]

fallas = []


def falla(texto):
    fallas.append(texto)
    print("  FALLA: " + texto)


def sin_comentarios(codigo):
    """Saca los comentarios, para no confundir una mencion con una llamada.

    La historia de estos arreglos esta contada en comentarios dentro del
    propio archivo, y ahi se nombran funciones de Firebase que ya no existen.
    Nombrarlas es correcto; volver a llamarlas no. Solo interesa lo segundo.
    """
    limpio = []
    en_bloque = False
    for linea in codigo.split("\n"):
        if en_bloque:
            if "*/" in linea:
                linea = linea.split("*/", 1)[1]
                en_bloque = False
            else:
                continue
        if "/*" in linea:
            antes, resto = linea.split("/*", 1)
            if "*/" in resto:
                linea = antes + resto.split("*/", 1)[1]
            else:
                linea = antes
                en_bloque = True
        # "//" abre comentario salvo cuando viene de "http://" o "https://"
        i = linea.find("//")
        while i != -1 and i > 0 and linea[i - 1] == ":":
            i = linea.find("//", i + 2)
        if i != -1:
            linea = linea[:i]
        limpio.append(linea)
    return "\n".join(limpio)


def bloques_de_script(html):
    """Los <script> con codigo propio, sin los que solo traen src."""
    return re.findall(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", html, re.S)


def main():
    print("Revisando index.html")

    if not os.path.exists(ARCHIVO):
        falla("no existe index.html")
        return 1

    tamano = os.path.getsize(ARCHIVO)
    print("\n1. Tamano del archivo")
    if tamano < TAMANO_MINIMO:
        falla("index.html pesa %d bytes; se esperaban al menos %d. "
              "Un archivo truncado se ve asi." % (tamano, TAMANO_MINIMO))
    else:
        print("  %d bytes  OK" % tamano)

    html = io.open(ARCHIVO, encoding="utf-8").read()

    print("\n2. Sintaxis de JavaScript")
    bloques = bloques_de_script(html)
    if not bloques:
        falla("no se encontro ningun bloque <script> con codigo")
    for i, codigo in enumerate(bloques):
        with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False,
                                         encoding="utf-8") as f:
            f.write(codigo)
            ruta = f.name
        try:
            r = subprocess.run(["node", "--check", ruta],
                               capture_output=True, text=True)
            if r.returncode != 0:
                falla("el bloque %d no compila:\n%s" % (i + 1, r.stderr.strip()))
            else:
                print("  bloque %d  OK  (%d lineas)" % (i + 1, codigo.count("\n")))
        finally:
            os.unlink(ruta)

    print("\n3. Funciones que la app necesita")
    faltan = [n for n in FUNCIONES
              if not re.search(r"\bfunction\s+" + re.escape(n) + r"\s*\(", html)]
    if faltan:
        falla("faltan %d funcion(es): %s" % (len(faltan), ", ".join(faltan)))
    else:
        print("  estan las %d  OK" % len(FUNCIONES))

    print("\n4. Que no haya vuelto Firebase")
    codigo = "\n".join(sin_comentarios(b) for b in bloques)
    volvieron = [(t, q) for t, q in PROHIBIDOS if t in codigo]
    if volvieron:
        for texto, que in volvieron:
            falla("reaparecio %s (%s)" % (que, texto))
    else:
        print("  sin rastros  OK")

    print("\n" + "-" * 60)
    if fallas:
        print("%d problema(s). El archivo NO esta listo para desplegarse." % len(fallas))
        return 1
    print("Todo en orden.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
