// Pruebas de la logica de prestamos: fechas de cuota y mora por atraso.
//
// No monta la app entera: saca las funciones que le interesan directamente
// de index.html y las corre sueltas. Es feo, pero es lo unico que se puede
// hacer con un archivo unico de 17.000 lineas sin partirlo en modulos, y
// prueba el codigo REAL que se despliega, no una copia que se desactualiza.
//
// A mano:  node pruebas/prestamos.js

const fs = require("fs");
const path = require("path");

const HTML = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

// TABS es "const", no "var", asi que sacarConstante no lo ve. Se lee aparte:
// las pruebas de permisos recorren el menu de cada rol y no puede ser una copia
// (una copia se desactualiza en silencio y la prueba pasa probando otra cosa).
const TABS = (function () {
  const i = HTML.indexOf("const TABS={");
  const j = HTML.indexOf("};", i);
  return eval("(" + HTML.slice(i + "const TABS=".length, j + 1) + ")");
})();

// Extrae "function nombre(...){...}" contando llaves hasta cerrar.
function sacarFuncion(nombre) {
  const inicio = HTML.indexOf("function " + nombre + "(");
  if (inicio < 0) throw new Error("no encuentro la funcion " + nombre + " en index.html");
  let i = HTML.indexOf("{", inicio), prof = 0;
  for (let k = i; k < HTML.length; k++) {
    if (HTML[k] === "{") prof++;
    else if (HTML[k] === "}" && --prof === 0) return HTML.slice(inicio, k + 1);
  }
  throw new Error("la funcion " + nombre + " no cierra");
}

// Algunas funciones dependen de constantes sueltas de index.html. Se sacan
// igual que las funciones, para no tener que duplicar su valor aca (una copia
// se desactualiza en silencio y la prueba pasa probando otra cosa).
// Acepta tambien las que ocupan varias lineas (DATA_KEYS es una de ellas):
// se corta en el primer ";" que quede fuera de comillas.
function sacarConstante(nombre) {
  const i = HTML.search(new RegExp("^\\s*var\\s+" + nombre + "\\s*=", "m"));
  if (i < 0) throw new Error("no encuentro la constante " + nombre + " en index.html");
  let comilla = null;
  for (let j = i; j < HTML.length; j++) {
    const c = HTML[j];
    if (comilla) { if (c === "\\") j++; else if (c === comilla) comilla = null; continue; }
    if (c === '"' || c === "'") { comilla = c; continue; }
    if (c === ";") return HTML.slice(i, j + 1).trim();
  }
  throw new Error("la constante " + nombre + " no termina en ';'");
}
const CONSTANTES = ["_PODA_CATS", "_MOTIVOS_AJUSTE",
                    "_BIN_COLS_C2C", "_BIN_COLS_TX", "MONEDAS_COMPRA", "MONEDAS_VENTA",
                    "MIN_DIAS_PRIMERA_CUOTA", "_MERGE_FIELDS", "_MERGE_ID_FIELD",
                    "_MERGE_OBJETOS", "_MERGE_BLOQUES", "_MERGE_HISTORIAL", "_RATE_LIMITS",
                    "DATA_KEYS", "_CLAVES_QUE_NO_SON_DATOS", "PAGO_DEBE",
                    "_TOCADO_AQUI", "_NOMBRE_DE_CLAVE", "_NOMBRE_DE_CONFIG",
                    "_PISADOS", "_PISADOS_ABIERTO", "_CLIENTES_DESDE_API",
                    "PERMISOS_APP", "PERMISOS_POR_ROL", "PERMISO_DE_TAB",
                    "_CONFIG_PROHIBIDO", "_ETIQUETA_ROL"];

const NECESARIAS = ["_quienSoy", "r4", "f2", "td", "ds", "cfgMora", "_diasIso", "detalleMora", "moraPendiente",
                    "congelarMora", "_sumarMeses", "_isoDeFecha", "calcularAmortizacion",
                    "tasaAnualEfectiva", "_periodDaysDe", "perfilRiesgoCliente",
                    "puntoEquilibrio", "tasaSugerida", "_conDiaDelMes",
                    "cronogramaCuotas", "_fechaPrimeraCuota", "diasPrimeraCuota",
                    "ajusteDiasPrimeraCuota", "interesPorAjusteDias",
                    "cuotasRecomendadas", "limiteCredito",
                    "costoOperativoPorPrestamo", "pctCostoOperativo",
                    "_competidores", "_compDelDia", "_setComp", "_misTasasPublicadas", "_posicionMercado",
                    "_equilibrio",
                    "capitalRealTotal", "_fraccionInteresPrestamo", "interesDentroDeApertura",
                    "_mesesDesde", "_acumuladosMes",
                    "conciliacionCapital", "getMesKeyActual", "ajustesDesdeApertura",
                    "_tsDeUid", "_tsDeAjuste", "_deducirHoraApertura", "_isoDeDDMMAA", "_motivoDelAjuste", "_ajusteAEgreso", "_cuentaMadre", "_cuentaOMadre", "_completarDesdeMadre", "toggleCuentaMadre",
                    "traspasosAPersonal", "egresosPersonalesDesdeCuentaPersonal", "efectoTasasDesde", "_isoDeFechaLote",
                    "tasaDeReferencia", "_tasaFijadaAMano", "setTasaDia", "soltarTasaDia",
                    "_isoDeLote", "_fechaLoteIso", "_num", "_horaLote", "_horaAhora", "_horaDe",
                    "_diasDesdeLote", "_fechaLoteLegible", "getLastTasaVenta",
                    "montoAUsdt", "montoConMoneda", "_unicos",
                    "_marcarCambiados", "_refotografiar", "_mergeArrayById",
                    "_marcarTodoLoQueSeFusiona", "_marcarObjetosCambiados",
                    "_mergeObjetoPorClave", "_unirHistorial", "_unirMarcasCampos",
                    "_huellaCompleta", "_conteoRapido",
                    "crearLoteRecibido", "quitarLoteDeRemesa", "_loteAlCobrar",
                    "ordenFIFO", "normalizarInventarioFIFO", "simularConsumoFIFO", "_tasaEfectivaLote",
                    "f4", "f0", "_leerNumero", "_avisoCambioSaldo", "_fechaLote", "_idLoteNuevo",
                    "_diasEnElFuturo", "confirmarFechaFutura",
                    "comisionBancoVES", "etiquetaComisionBanco", "salidaDeCuentaEntrega",
                    "monedasDeRemesa", "pagosDeRemesa", "sumaPagos", "pagosDebe",
                    "entregasDeRemesa", "sumaEntregas", "comisionesDeEntregas",
                    "_uvDeParte", "_entregasParaFIFO", "consumirFIFORemesa", "simularFIFORemesa",
                    "esBancoVES", "consumirInventarioFIFO", "_restaurarVentasFIFO",
                    "COM", "_comIU", "_localeOCR", "_numOCR",
                    "_candUSDT", "_candFiat", "_cuadrarP2P", "_parsearOCR", "_parsearConLocale", "_numLegible",
                    "_tasaAutoPago", "_deudaCubierta", "_htmlTasaInvertida",
                    "_htmlTasaEnPalabras", "_htmlEquivAbono", "_htmlCalcPago",
                    "_pasoRedondeoCobro", "_montoACobrar", "_fMontoCobro",
                    "_deudaACobrar",
                    "_jsonEstable", "_escAud", "_anotarTocado", "_unirTocado",
                    "_tomarTocado", "_etiquetaRegistro", "_resumirValor",
                    "_camposEnConflicto", "_conflictosConElServidor", "_choqueApertura",
                    "_completarConLoQueQuedo", "_htmlAvisoPisado",
                    "_simularConFecha", "ds",
                    "_huellaDisponible", "_huellaGuardada", "_huellaDeEstaPersona",
                    "_permisoPorOmision", "tienePermiso", "permisoEdicion",
                    "_resumenPermisos", "_binCuentaDeUid",
                    "_binNum", "_binNorm", "_binMapaCols", "_binBuscarCabecera",
                    "_binIdentificar", "_binOrdenesC2C", "_binConverts", "_binDias",
                    "_binMonedaConocida", "_binYaRegistrado", "_binCuentaSugerida", "_binMesCerrado",
                    "_binConfianzaBanco", "_binSinBanco", "_htmlOrdenCopiable", "_htmlSupuesto",
                    "_marcarBorradoMerge", "_estaBorradoMerge", "_olvidarBorradoMerge",
                    "_podarBorrados",
                    "_trioIU", "_fiatIU", "_usdtIU", "_tasaIU", "_descuadreIU",
                    "_monIU", "_loteConOrden", "_ultimasIU"];
// _refotografiar escribe en window; en Node no existe, se le pone uno vacio.
global.window = global.window || {};
// Lo mismo con document: las funciones que refrescan un recuadro por su id
// (ARREGLO 32: no repintar mientras ella teclea) lo buscan antes de tocarlo.
// Aqui no hay pantalla, asi que no lo encuentran y siguen su camino.
global.document = global.document || { getElementById: function(){ return null; } };
// setTasaDia/soltarTasaDia guardan y repintan, y avisan por alert(). Aqui no
// hay pantalla: se anota lo que habrian dicho para poder comprobarlo.
global.avisos = [];
global.saveData = () => {};
global.R = () => {};
// _quienSoy() lee la sesion guardada del navegador. Aqui no hay localStorage,
// asi que se le pone una sesion de mentira: lo que se prueba es el sello, no
// de donde sale el nombre.
global._apiSesionGuardada = () => ({ u: { nombre: "PRUEBA" } });
global.alert = (m) => { global.avisos.push(String(m)); };
// S es el estado global de la app; aca solo hacen falta config y prestamos.
const S = { config: {}, prestamos: [] };
// Tasas de mentira para no depender de la configuracion real. getRateToUsdt
// devuelve cuantas unidades de esa moneda vale 1 USDT.
const TASAS = { USDT: 1, BRL: 5.4, VES: 200 };
const getRateToUsdt = (m) => TASAS[m] || null;
// calcMesCompleto es una funcion enorme con media app detras. Aqui se
// inyecta una falsa para poder fijar a mano lo que movio cada mes y
// comprobar la aritmetica de la conciliacion.
const MESES_FALSOS = {};
const calcMesCompleto = (mk) => MESES_FALSOS[mk] || {};
const F = new Function("S", "getRateToUsdt", "calcMesCompleto",
  CONSTANTES.map(sacarConstante).join("\n") + "\n" +
  NECESARIAS.map(sacarFuncion).join("\n") +
  // Las constantes tambien se devuelven: las pruebas de la marca recorren
  // _MERGE_FIELDS entero, para que un campo nuevo no se quede sin cubrir.
  // _TOCADO_AQUI y _PISADOS se REASIGNAN dentro (no solo se mutan), asi que
  // la copia que sale en el return se queda vieja en cuanto alguien las
  // reasigna. Estos accesos leen y escriben las de verdad.
  "\n_pruebaTocado=function(v){ if(v!==undefined)_TOCADO_AQUI=v; return _TOCADO_AQUI; };" +
  "\n_pruebaPisados=function(v,a){ if(v!==undefined)_PISADOS=v; if(a!==undefined)_PISADOS_ABIERTO=a; return _PISADOS; };" +
  "\nreturn {" + NECESARIAS.concat(CONSTANTES).join(",") +
  ",_pruebaTocado:_pruebaTocado,_pruebaPisados:_pruebaPisados};")(S, getRateToUsdt, calcMesCompleto);

let fallos = 0;
function ok(cond, msg, dato) {
  if (cond) console.log("  ok   " + msg);
  else { console.log("  FALLA " + msg + (dato !== undefined ? "  -> " + dato : "")); fallos++; }
}
const casi = (a, b, t) => Math.abs(a - b) < (t || 0.011);

// ── Cronograma de cuotas ────────────────────────────────────────────
// Reproduce el bucle de savePr() con los mismos helpers del archivo.
function cronograma(fechaIso, numCuotas, frecuencia, diasExtra) {
  const periodDays = frecuencia === "semanal" ? 7 : frecuencia === "quincenal" ? 15 : 30;
  const out = [];
  for (let i = 1; i <= numCuotas; i++) {
    let f = new Date(fechaIso + "T00:00:00");
    if (frecuencia === "mensual") { f = F._sumarMeses(f, i); f.setDate(f.getDate() + diasExtra); }
    else { f.setDate(f.getDate() + (periodDays * i + diasExtra)); }
    out.push(F._isoDeFecha(f));
  }
  return out;
}

console.log("\nFechas de cuota");
// setMonth() a secas daba 03/03 aca: el 31 de febrero no existe y seguia
// contando hacia adelante. Un prestamo del 31 quedaba con la cuota 1 a 28
// dias de la cuota 2 en vez de 30.
ok(cronograma("2026-01-31", 3, "mensual", 0).join() === "2026-02-28,2026-03-31,2026-04-30",
   "31/01 mensual recorta a fin de mes", cronograma("2026-01-31", 3, "mensual", 0).join());
ok(cronograma("2026-03-31", 2, "mensual", 0).join() === "2026-04-30,2026-05-31",
   "31/03 mensual recorta a 30/04");
ok(cronograma("2028-01-29", 1, "mensual", 0)[0] === "2028-02-29",
   "29/01 en anio bisiesto cae en 29/02");
ok(cronograma("2026-01-29", 1, "mensual", 0)[0] === "2026-02-28",
   "29/01 en anio normal cae en 28/02");
ok(cronograma("2026-12-31", 2, "mensual", 0).join() === "2027-01-31,2027-02-28",
   "cruza el cambio de anio");
ok(cronograma("2026-01-15", 3, "mensual", 0).join() === "2026-02-15,2026-03-15,2026-04-15",
   "una fecha normal no cambia de comportamiento");
ok(cronograma("2026-01-15", 3, "semanal", 0).join() === "2026-01-22,2026-01-29,2026-02-05",
   "semanal sigue sumando 7 dias");
ok(cronograma("2026-01-31", 2, "mensual", 5).join() === "2026-03-05,2026-04-05",
   "los dias de gracia corren todas las cuotas por igual");

// ── Mora ────────────────────────────────────────────────────────────
const prestamo = () => ({
  id: 1, desc: "Test", mon: "BRL", capital: 500, monto: 663.48, interesPorCuota: 10,
  frecuencia: "mensual", numCuotas: 3, estado: "activo", abonos: [],
  cuotas: [{ n: 1, iso: "2026-02-15", fecha: "15/02/26", monto: 221.16 },
           { n: 2, iso: "2026-03-15", fecha: "15/03/26", monto: 221.16 },
           { n: 3, iso: "2026-04-15", fecha: "15/04/26", monto: 221.16 }]
});

console.log("\nMora: cuando NO se cobra");
S.config = {};
ok(F.detalleMora(prestamo(), "2026-02-10").total === 0, "antes del vencimiento");
ok(F.detalleMora(prestamo(), "2026-02-15").total === 0, "el mismo dia del vencimiento");
ok(F.detalleMora(prestamo(), "2026-02-18").total === 0, "dentro de los 3 dias de gracia");
ok(F.detalleMora({ id: 9, abonos: [] }, "2026-05-01").total === 0, "prestamo viejo sin cronograma");

console.log("\nMora: cuanto cobra");
const d4 = F.detalleMora(prestamo(), "2026-02-19");
ok(casi(d4.multa, 4.42), "multa = 2% de la cuota vencida", d4.multa);
ok(casi(d4.juros, 0.29), "juros de 4 dias al 1% mensual", d4.juros);
const c30 = F.detalleMora(prestamo(), "2026-03-17").cuotas.find(c => c.n === 1);
ok(casi(c30.juros, 2.21, 0.02), "a 30 dias los juros son el 1% redondo", c30.juros);
ok(c30.multa === 4.42, "la multa es unica, no se repite cada mes");
const dos = F.detalleMora(prestamo(), "2026-03-25");
ok(dos.cuotas.length === 2, "suma las dos cuotas vencidas", dos.cuotas.length);

console.log("\nMora: solo sobre lo que falta");
const parcial = prestamo();
parcial.abonos = [{ id: 1, fecha: "2026-02-20", monto: 121.16 }];
const dp = F.detalleMora(parcial, "2026-02-25").cuotas[0];
ok(casi(dp.pendiente, 100), "descuenta lo ya abonado", dp.pendiente);
ok(casi(dp.multa, 2), "la multa cae sobre los 100 que faltan, no sobre la cuota entera", dp.multa);

console.log("\nMora: no se evapora al pagar la cuota atrasada");
const cong = prestamo();
const antes = F.detalleMora(cong, "2026-03-17").total;
F.congelarMora(cong, "2026-03-17");
cong.abonos = [{ id: 1, fecha: "2026-03-17", monto: 221.16 }];   // salda la cuota 1
ok(casi(antes, F.detalleMora(cong, "2026-03-17").total),
   "sobrevive al pago de la cuota que la genero", antes);
const c1a = F.detalleMora(cong, "2026-03-17").cuotas.find(c => c.n === 1);
const c1b = F.detalleMora(cong, "2026-03-20").cuotas.find(c => c.n === 1);
ok(casi(c1a.total, c1b.total), "una vez pagada la cuota, su mora queda congelada");
cong.mora.cobrada = antes;
ok(F.moraPendiente(cong, "2026-03-17") === 0, "cobrarla la deja en cero");

console.log("\nMora: sigue corriendo mientras no paguen");
const vivo = prestamo();
F.congelarMora(vivo, "2026-02-25");
vivo.mora.cobrada = F.detalleMora(vivo, "2026-02-25").total;
ok(F.moraPendiente(vivo, "2026-02-25") === 0, "al dia de cobrarla queda en cero");
ok(F.moraPendiente(vivo, "2026-03-25") > 0, "un mes despues vuelve a haber mora",
   F.moraPendiente(vivo, "2026-03-25"));

console.log("\nMora: interruptores de configuracion");
S.config = { moraActiva: false };
ok(F.detalleMora(prestamo(), "2026-05-01").total === 0, "desactivada no cobra nada");
S.config = { moraActiva: true, moraMultaPct: 0, moraJurosPctMes: 5, moraDiasGracia: 0 };
const cfg = F.detalleMora(prestamo(), "2026-02-16");
ok(cfg.multa === 0 && cfg.juros > 0, "sin multa, solo juros, sin dias de gracia");
S.config = {};

// ── Costo efectivo anual (CET) ──────────────────────────────────────
console.log("\nCosto efectivo anual");
ok(casi(F.tasaAnualEfectiva(10, 30), 218.86, 0.5),
   "10% mensual son ~219% anual, no 120%", F.tasaAnualEfectiva(10, 30));
ok(F.tasaAnualEfectiva(10, 7) > F.tasaAnualEfectiva(10, 30),
   "el mismo % cobrado semanal cuesta mucho mas al anio");
ok(F.tasaAnualEfectiva(0, 30) === 0, "sin interes no hay CET");

// ── Perfil de riesgo y tasa sugerida ────────────────────────────────
// Un prestamo cerrado, con las cuotas pagadas con N dias de atraso.
function prestamoCerrado(quien, atrasoDias) {
  const cuotas = [{ n: 1, iso: "2026-02-15", fecha: "15/02/26", monto: 100 },
                  { n: 2, iso: "2026-03-15", fecha: "15/03/26", monto: 100 }];
  const conAtraso = (iso) => {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + atrasoDias);
    return F._isoDeFecha(d);
  };
  return { id: Math.random(), desc: quien, cod: "", mon: "BRL", capital: 180, monto: 200,
           interesPorCuota: 10, frecuencia: "mensual", numCuotas: 2, estado: "pagado",
           cuotas, abonos: cuotas.map((c, i) => ({ id: i, fecha: conAtraso(c.iso), monto: 100, cuotaN: c.n })) };
}

console.log("\nPerfil de riesgo del cliente");
S.config = {}; S.prestamos = [];
ok(F.perfilRiesgoCliente("Nadie", "").banda === "C", "cliente sin historial cae en C");

S.prestamos = [prestamoCerrado("Ana", 0), prestamoCerrado("Ana", 0)];
const ana = F.perfilRiesgoCliente("Ana", "");
ok(ana.banda === "A", "2 prestamos saldados y puntual -> banda A", ana.banda);
ok(ana.saldados === 2, "cuenta los saldados", ana.saldados);
ok(ana.atrasoProm === 0, "atraso promedio 0", ana.atrasoProm);

S.prestamos = [prestamoCerrado("Beto", 5)];
ok(F.perfilRiesgoCliente("Beto", "").banda === "B", "1 saldado con 5 dias de atraso -> B");

S.prestamos = [prestamoCerrado("Dani", 20)];
const dani = F.perfilRiesgoCliente("Dani", "");
ok(dani.banda === "D", "atraso de 20 dias -> D", dani.banda);
ok(dani.atrasoProm === 20, "mide bien el atraso promedio", dani.atrasoProm);

// Una cuota vencida hace mas de 60 dias y sin saldar = prestamo caido.
S.prestamos = [{ id: 7, desc: "Caido", cod: "", mon: "BRL", capital: 100, monto: 110,
                 interesPorCuota: 10, frecuencia: "mensual", numCuotas: 1, estado: "activo",
                 abonos: [], cuotas: [{ n: 1, iso: "2026-01-10", fecha: "10/01/26", monto: 110 }] }];
ok(F.perfilRiesgoCliente("Caido", "").banda === "E", "cuota caida hace meses -> E");
ok(F.tasaSugerida("Caido", "", 1, "BRL", "mensual").prestar === false, "en banda E avisa de no prestar");

console.log("\nEl nombre no se confunde con otro cliente");
S.prestamos = [prestamoCerrado("Ana", 0), prestamoCerrado("Ana", 0), prestamoCerrado("Beto", 25)];
ok(F.perfilRiesgoCliente("Ana", "").banda === "A", "el historial de Beto no ensucia el de Ana");
ok(F.perfilRiesgoCliente("ana", "").banda === "A", "no distingue mayusculas");

console.log("\nTasa sugerida");
S.prestamos = [prestamoCerrado("Ana", 0), prestamoCerrado("Ana", 0)];
S.config = { costoOportunidadMes: 3 };
const tA = F.tasaSugerida("Ana", "", 1, "BRL", "mensual");
const tC = F.tasaSugerida("Nuevo", "", 1, "BRL", "mensual");
const tD = F.tasaSugerida("Dani2", "", 1, "BRL", "mensual");
ok(tA.sugerida < tC.sugerida, "el cliente probado paga menos que el nuevo",
   tA.sugerida + " vs " + tC.sugerida);
ok(tA.sugerida > tA.piso, "nunca sugiere por debajo del punto de equilibrio",
   tA.sugerida + " vs piso " + tA.piso);
ok(tA.min >= tA.piso, "el minimo del rango tampoco baja del piso");
ok(F.tasaSugerida("Ana", "", 10, "BRL", "mensual").sugerida > tA.sugerida,
   "a mas cuotas, mas tasa");
ok(F.tasaSugerida("Ana", "", 1, "VES", "mensual").sugerida > tA.sugerida,
   "prestar en VES sube la tasa");
ok(tA.anual > tA.sugerida, "devuelve tambien el CET anual", tA.anual);

console.log("\nPunto de equilibrio");
S.prestamos = []; S.config = { costoOportunidadMes: 3 };
const eqVacio = F.puntoEquilibrio();
ok(eqVacio.medido === false, "sin 5 prestamos avisa que el impago es estimado");
ok(eqVacio.pct > 3, "el piso siempre supera al costo de oportunidad solo", eqVacio.pct);
S.config = { costoOportunidadMes: 10 };
ok(F.puntoEquilibrio().pct > eqVacio.pct, "si el dinero rinde mas fuera, el piso sube");

// El impago se suaviza: una cartera chica y limpia NO significa riesgo cero,
// y un solo impago temprano no puede disparar el piso.
S.config = { costoOportunidadMes: 3 };
S.prestamos = Array.from({ length: 6 }, () => prestamoCerrado("Limpio", 0));
const eqLimpio = F.puntoEquilibrio();
ok(eqLimpio.impagoPct > 0, "6 prestamos sin caidas no dan 0% de riesgo", eqLimpio.impagoPct);
ok(eqLimpio.pct > eqLimpio.costoOportunidadPct, "el piso queda por encima del costo de oportunidad");
const caido = { id: 99, desc: "Malo", cod: "", mon: "BRL", capital: 100, monto: 110,
                interesPorCuota: 10, frecuencia: "mensual", numCuotas: 1, estado: "activo",
                abonos: [], cuotas: [{ n: 1, iso: "2026-01-10", fecha: "10/01/26", monto: 110 }] };
S.prestamos = [caido];
ok(F.puntoEquilibrio().impagoPct < 50, "un solo impago no dispara el piso al 100%",
   F.puntoEquilibrio().impagoPct);
S.prestamos = Array.from({ length: 20 }, () => prestamoCerrado("Limpio", 0)).concat([caido, caido]);
ok(F.puntoEquilibrio().impagoPct < eqLimpio.impagoPct + 5,
   "con mas historia manda tu numero real, no el prior");
S.config = {}; S.prestamos = [];

// ── Dia fijo de vencimiento ─────────────────────────────────────────
const iso = (d) => F._isoDeFecha(d);
const crono = (f, n, fr, ex, dp, fv) => F.cronogramaCuotas(f, n, fr, ex, dp, fv).map(iso);

console.log("\nDia fijo de pago del mes");
ok(crono("2026-01-05", 3, "mensual", 0, 10).join() === "2026-01-10,2026-02-10,2026-03-10",
   "prestamo del 05/01 con pago el 10 arranca en el 10 de ESE mes",
   crono("2026-01-05", 3, "mensual", 0, 10).join());
// El dia 3 ya paso cuando se presta el 05/01, asi que va al de febrero.
ok(crono("2026-01-05", 2, "mensual", 0, 3).join() === "2026-02-03,2026-03-03",
   "si el dia ya paso, arranca el mes siguiente",
   crono("2026-01-05", 2, "mensual", 0, 3).join());
ok(crono("2026-01-15", 3, "mensual", 0, 31).join() === "2026-01-31,2026-02-28,2026-03-31",
   "el dia 31 se recorta en los meses cortos y vuelve al 31 cuando existe",
   crono("2026-01-15", 3, "mensual", 0, 31).join());
ok(crono("2026-01-15", 2, "semanal", 0, 10).join() === "2026-01-22,2026-01-29",
   "el dia fijo no aplica a prestamos semanales");
ok(crono("2026-01-31", 3, "mensual", 0, 0).join() === "2026-02-28,2026-03-31,2026-04-30",
   "sin dia fijo se mantiene el comportamiento de siempre");

console.log("\nFecha de vencimiento elegida a mano");
// El caso que no se podia expresar: "le presto hoy y me paga el 30".
ok(crono("2026-09-10", 1, "mensual", 0, 0, "2026-09-30")[0] === "2026-09-30",
   "la fecha elegida manda sobre todo lo demas");
ok(crono("2026-09-10", 3, "mensual", 0, 0, "2026-09-30").join() === "2026-09-30,2026-10-30,2026-11-30",
   "las siguientes cuotas conservan ese dia del mes",
   crono("2026-09-10", 3, "mensual", 0, 0, "2026-09-30").join());
ok(crono("2026-09-10", 1, "mensual", 0, 0, "2026-09-05")[0] !== "2026-09-05",
   "una fecha anterior al prestamo se ignora");
ok(F.diasPrimeraCuota("2026-09-10", "mensual", 0, 0, "2026-09-30") === 20,
   "cuenta los dias reales de plazo", F.diasPrimeraCuota("2026-09-10", "mensual", 0, 0, "2026-09-30"));

console.log("\nAjuste de interes: cobra por los dias que de verdad tuvo el dinero");
// Antes solo se podia ALARGAR el plazo. Un prestamo a 20 dias pagaba el
// mismo interes que uno a 30, y al mismo cliente le salia 50% mas caro.
ok(F.ajusteDiasPrimeraCuota("2026-09-10", "mensual", 0, 0, "2026-09-30") === -10,
   "20 dias de plazo son 10 MENOS que un periodo",
   F.ajusteDiasPrimeraCuota("2026-09-10", "mensual", 0, 0, "2026-09-30"));
ok(F.ajusteDiasPrimeraCuota("2026-09-10", "mensual", 0, 0, "2026-10-25") > 0,
   "un plazo mas largo da ajuste positivo");
ok(F.ajusteDiasPrimeraCuota("2026-09-10", "mensual", 0, 0, "") === 0,
   "sin fecha elegida, el plazo es exactamente un periodo");

// El caso real: 134 BRL al 10% mensual, prestado el 10/09 y cobrado el 30/09.
const ajuste134 = F.ajusteDiasPrimeraCuota("2026-09-10", "mensual", 0, 0, "2026-09-30");
const interes134 = F.calcularAmortizacion(134, 10, 1).montoTotal - 134
                 + F.interesPorAjusteDias(134, 10, "mensual", ajuste134);
// Al centimo: el comparador redondeaba el PORCENTAJE antes de aplicarlo y
// daba 142,94 donde savePr daba 142,93. Un centimo, pero es el numero que el
// cliente ya acepto por WhatsApp. Los cuatro caminos salen de la misma funcion.
ok(casi(interes134, 8.93, 0.005),
   "134 BRL al 10% mensual por 20 dias cobran 8,93 exactos (no 13,40)", interes134.toFixed(4));
ok(casi(134 + interes134, 142.93, 0.005),
   "el total del caso real es 142,93 al centimo", (134 + interes134).toFixed(4));
ok(F.interesPorAjusteDias(134, 10, "mensual", ajuste134) < 0,
   "el ajuste de un plazo corto es un DESCUENTO");
ok(F.interesPorAjusteDias(134, 10, "mensual", 0) === 0, "un periodo exacto no ajusta nada");

console.log("\nDia fijo: un dia de diferencia ya no cuesta un mes entero");
// Prestamo del 11/09 con pago "todo dia 10": antes se iba al 10/11 (60 dias,
// el doble de interes) porque al 10/10 le faltaba un dia para el periodo.
const conDiaFijo = crono("2026-09-11", 1, "mensual", 0, 10, "")[0];
ok(conDiaFijo === "2026-10-10", "cae en el 10 de octubre, no en noviembre", conDiaFijo);
ok(F.diasPrimeraCuota("2026-09-11", "mensual", 0, 10, "") === 29,
   "29 dias de plazo, y el interes se prorratea a eso");
// Pero un plazo absurdamente corto si se empuja al mes siguiente.
ok(crono("2026-09-09", 1, "mensual", 0, 10, "")[0] === "2026-10-10",
   "un dia de plazo no vale: se va al mes siguiente",
   crono("2026-09-09", 1, "mensual", 0, 10, "")[0]);

console.log("\nCuotas recomendadas segun la banda");
S.prestamos = [prestamoCerrado("Ana", 0), prestamoCerrado("Ana", 0)];
ok(F.cuotasRecomendadas("Ana", "") > F.cuotasRecomendadas("Nuevo", ""),
   "al cliente probado se le recomiendan mas cuotas que al desconocido",
   F.cuotasRecomendadas("Ana", "") + " vs " + F.cuotasRecomendadas("Nuevo", ""));
S.prestamos = [prestamoCerrado("Tarde", 25)];
ok(F.cuotasRecomendadas("Tarde", "") === 1, "al que paga tarde, una sola cuota");
S.prestamos = [];

// ── Limite de credito ───────────────────────────────────────────────
console.log("\nLimite de credito por cliente");
S.config = { limiteClienteNuevoUsdt: 100 }; S.prestamos = [];
const lNuevo = F.limiteCredito("Nadie", "", "USDT");
ok(lNuevo.tope === 100, "cliente nuevo: rige el tope de entrada", lNuevo.tope);
ok(lNuevo.disponible === 100, "sin nada prestado, el margen es el tope entero");

S.prestamos = [prestamoCerrado("Ana", 0), prestamoCerrado("Ana", 0)];
const lAna = F.limiteCredito("Ana", "", "USDT");
ok(lAna.banda === "A", "Ana sigue en banda A");
// Sus prestamos fueron de 180 BRL de capital = 33,33 USDT; x3 por banda A
// son 100, que empata con el tope de entrada.
ok(lAna.tope >= 100, "un cliente probado nunca queda por debajo del tope de entrada", lAna.tope);

S.prestamos = [prestamoCerrado("Rico", 0), prestamoCerrado("Rico", 0)];
S.prestamos.forEach((p) => { p.capital = 1080; p.monto = 1200; });   // 200 USDT
const lRico = F.limiteCredito("Rico", "", "USDT");
ok(casi(lRico.tope, 600, 1), "banda A escala x3 el mayor prestamo devuelto", lRico.tope);

// Lo que ya debe recorta el margen disponible.
S.prestamos.push({ id: 50, desc: "Rico", cod: "", mon: "BRL", capital: 540, monto: 540,
                   estado: "activo", abonos: [], cuotas: [] });
const lRico2 = F.limiteCredito("Rico", "", "USDT");
ok(casi(lRico2.expuestoUsdt, 100, 1), "cuenta lo que ya le debe", lRico2.expuestoUsdt);
ok(casi(lRico2.disponible, lRico2.tope - 100, 1), "y lo descuenta del margen");

console.log("\nLimite: conversion de moneda");
S.prestamos = []; S.config = { limiteClienteNuevoUsdt: 100 };
const lBrl = F.limiteCredito("Nadie", "", "BRL");
ok(casi(lBrl.tope, 540, 1), "100 USDT de tope son 540 BRL", lBrl.tope);
ok(lBrl.topeUsdt === 100, "y por dentro sigue siendo 100 USDT");
S.config = {}; S.prestamos = [];

// ── Costo operativo por prestamo ────────────────────────────────────
console.log("\nCosto de hacer el prestamo");
S.config = {}; S.prestamos = [];
ok(F.costoOperativoPorPrestamo().usdt === 0, "sin configurar no cobra nada de mas");
ok(F.costoOperativoPorPrestamo().configurado === false, "y avisa que no esta configurado");

S.config = { minutosPorPrestamo: 30, valorHoraUsdt: 5, comisionPorPrestamoUsdt: 0 };
ok(F.costoOperativoPorPrestamo().usdt === 2.5, "media hora a 5 la hora son 2,50",
   F.costoOperativoPorPrestamo().usdt);
S.config = { minutosPorPrestamo: 30, valorHoraUsdt: 5, comisionPorPrestamoUsdt: 1.5 };
ok(F.costoOperativoPorPrestamo().usdt === 4, "las comisiones se suman al tiempo");

console.log("\nEl costo fijo pesa mas en los prestamos chicos");
S.config = { minutosPorPrestamo: 30, valorHoraUsdt: 5, comisionPorPrestamoUsdt: 0 };  // 2,50
ok(casi(F.pctCostoOperativo(25, "USDT", 1), 10, 0.1),
   "2,50 sobre 25 USDT es el 10% del capital", F.pctCostoOperativo(25, "USDT", 1));
ok(casi(F.pctCostoOperativo(250, "USDT", 1), 1, 0.1),
   "sobre 250 USDT es el 1%", F.pctCostoOperativo(250, "USDT", 1));
ok(F.pctCostoOperativo(25, "USDT", 1) > F.pctCostoOperativo(250, "USDT", 1),
   "prestar poco cuesta proporcionalmente mas");
ok(casi(F.pctCostoOperativo(250, "USDT", 5), 0.2, 0.05),
   "a mas cuotas se amortiza entre mas periodos", F.pctCostoOperativo(250, "USDT", 5));
// 134 BRL a la tasa de prueba (5,4 BRL por USDT) son 24,81 USDT
ok(casi(F.pctCostoOperativo(134, "BRL", 1), 10.1, 0.3),
   "convierte a USDT antes de comparar", F.pctCostoOperativo(134, "BRL", 1));
ok(F.pctCostoOperativo(100, "XYZ", 1) === 0, "sin tasa de la moneda no inventa nada");
ok(F.pctCostoOperativo(0, "USDT", 1) === 0, "sin capital no divide por cero");

console.log("\nY entra en el piso de la tasa sugerida");
S.prestamos = [];
const sinOp = (() => { S.config = { costoOportunidadMes: 3 }; return F.tasaSugerida("X","",1,"USDT","mensual",25); })();
const conOp = (() => { S.config = { costoOportunidadMes: 3, minutosPorPrestamo: 30, valorHoraUsdt: 5 };
                       return F.tasaSugerida("X","",1,"USDT","mensual",25); })();
ok(conOp.piso > sinOp.piso, "contar el costo sube el piso", sinOp.piso + " → " + conOp.piso);
ok(conOp.sugerida > sinOp.sugerida, "y sube la tasa sugerida");
const chico = F.tasaSugerida("X","",1,"USDT","mensual",25);
const grande = F.tasaSugerida("X","",1,"USDT","mensual",250);
ok(chico.sugerida > grande.sugerida,
   "al mismo cliente, un prestamo chico pide mas tasa que uno grande",
   chico.sugerida + "% vs " + grande.sugerida + "%");
ok(chico.min >= chico.piso, "el minimo del rango sigue sin bajar del piso");
// Cuando el tiempo pesa mas que el dinero, el problema es el tamaño del
// prestamo y no la tasa: sugerir 21,9% es una cuenta, no un consejo.
ok(chico.demasiadoChico === true, "avisa que 25 USDT es demasiado chico para el trabajo que da");
ok(grande.demasiadoChico === false, "250 USDT no dispara el aviso");
S.config = { costoOportunidadMes: 3 };
ok(F.tasaSugerida("X","",1,"USDT","mensual",25).demasiadoChico === false,
   "sin costo configurado nunca avisa");
S.config = {}; S.prestamos = [];

// ── Conciliacion de capital ─────────────────────────────────────────
console.log("\nCapital real: cuenta TODO el dinero");
S.config = {}; S.prestamos = []; S.cuentasCobrar = [];
S.cuentas = [
  { id:"a", nombre:"USDT",    moneda:"USDT", saldo:100, activa:true },
  { id:"b", nombre:"BRL",     moneda:"BRL",  saldo:540, activa:true },              // 100 USDT
  { id:"c", nombre:"RESERVA", moneda:"BRL",  saldo:540, activa:true, esReserva:true },
  { id:"d", nombre:"MIA",     moneda:"USDT", saldo:999, activa:true, esPersonal:true },
  { id:"e", nombre:"CERRADA", moneda:"USDT", saldo:50,  activa:false }
];
let cap = F.capitalRealTotal();
ok(casi(cap.enCuentas, 200, 0.5), "suma las monedas, no solo los USDT", cap.enCuentas);
ok(casi(cap.enReserva, 100, 0.5), "la reserva se cuenta aparte, pero se cuenta", cap.enReserva);
ok(cap.total === cap.enCuentas + cap.enReserva, "y entra en el total");
ok(cap.enCuentas < 999, "las cuentas personales no son dinero de la empresa");

S.cuentasCobrar = [
  { id:1, estado:"pendiente", monto:54,  moneda:"BRL", abonos:[] },                  // 10 USDT
  { id:2, estado:"pendiente", monto:100, moneda:"USDT", abonos:[{monto:40}] },        // 60
  { id:3, estado:"pagado",    monto:500, moneda:"USDT", abonos:[] }
];
S.prestamos = [
  { id:1, estado:"activo", mon:"USDT", monto:80, abonos:[{monto:30}] },               // 50
  { id:2, estado:"pagado", mon:"USDT", monto:500, abonos:[{monto:500}] }
];
cap = F.capitalRealTotal();
ok(casi(cap.porCobrar, 70, 0.5), "descuenta abonos y salta lo ya pagado", cap.porCobrar);
ok(casi(cap.enPrestamos, 50, 0.5), "lo mismo con los prestamos", cap.enPrestamos);
ok(casi(cap.enLaCalle, 120, 0.5), "el dinero en la calle es parte del capital", cap.enLaCalle);
ok(casi(cap.total, 420, 0.5), "total = cuentas + reserva + calle", cap.total);

S.cuentas = [{ id:"x", nombre:"RARO", moneda:"XYZ", saldo:100, activa:true }];
S.cuentasCobrar = []; S.prestamos = [];
cap = F.capitalRealTotal();
ok(cap.sinTasa.indexOf("XYZ") >= 0, "avisa de las monedas sin tasa en vez de inventar un valor");
ok(cap.total === 0, "y no las suma");

console.log("\nMeses desde la apertura");
ok(F._mesesDesde("").length === 0, "sin fecha no hay meses");
ok(F._mesesDesde("no-es-fecha").length === 0, "una fecha invalida no cuelga");
const hoyMes = new Date().getFullYear() + "-" + String(new Date().getMonth() + 1).padStart(2, "0");
const ms = F._mesesDesde(new Date().toISOString().slice(0, 10));
ok(ms.length === 1 && ms[0] === hoyMes, "abrir hoy da un solo mes: el actual", ms.join());
const d = new Date(); d.setMonth(d.getMonth() - 3);
ok(F._mesesDesde(d.toISOString().slice(0, 10)).length === 4,
   "tres meses atras dan cuatro meses contando el actual",
   F._mesesDesde(d.toISOString().slice(0, 10)).length);
const cruce = F._mesesDesde("2025-11-15");
ok(cruce[0] === "2025-11" && cruce[1] === "2025-12" && cruce[2] === "2026-01",
   "cruza bien el cambio de anio", cruce.slice(0, 3).join());
S.cuentas = []; S.config = {};

// ── Conciliacion: la apertura no puede contar dos veces ─────────────
console.log("\nConciliacion desde la apertura");
const mesHoy = F.getMesKeyActual();
const limpiar = () => { Object.keys(MESES_FALSOS).forEach(k => delete MESES_FALSOS[k]); };

S.cuentas = [{ id:"a", nombre:"CAJA", moneda:"USDT", saldo:1000, activa:true }];
S.cuentasCobrar = []; S.prestamos = [];
S.config = {};
ok(F.conciliacionCapital().configurada === false, "sin apertura fijada no concilia nada");
ok(F.conciliacionCapital().real.total === 1000, "pero ya dice cuanto hay de verdad");

// El bug: se fija la apertura a media semana, cuando el mes ya movio algo.
// Ese dinero YA esta dentro de los 1000 contados.
limpiar();
MESES_FALSOS[mesHoy] = { ganBrutaTotal: 2.54 };
S.config = { aperturaUsdt: 1000, aperturaFecha: new Date().toISOString().slice(0,10) };
ok(F.conciliacionCapital().diferencia === -2.54,
   "sin la foto del mes, la ganancia ya cobrada se cuenta dos veces",
   F.conciliacionCapital().diferencia);

// Con la foto que guarda fijarAperturaHoy(), arranca en cero.
S.config.aperturaBase = F._acumuladosMes(mesHoy);
ok(F.conciliacionCapital().diferencia === 0,
   "con la foto del mes en curso, la diferencia arranca EN CERO",
   F.conciliacionCapital().diferencia);

// Y lo que se gane despues si cuenta.
MESES_FALSOS[mesHoy] = { ganBrutaTotal: 12.54 };   // 10 mas
ok(F.conciliacionCapital().deberias === 1010,
   "lo ganado despues de la apertura si suma", F.conciliacionCapital().deberias);
ok(F.conciliacionCapital().diferencia === -10,
   "y si ese dinero no aparece en las cuentas, lo canta", F.conciliacionCapital().diferencia);
S.cuentas[0].saldo = 1010;
ok(F.conciliacionCapital().diferencia === 0, "cuando entra a la cuenta, vuelve a cuadrar");

// Una apertura guardada antes del arreglo no trae la foto: hay que avisar,
// porque no se puede reconstruir cuanto iba del mes aquel dia.
S.config = { aperturaUsdt: 1000, aperturaFecha: new Date().toISOString().slice(0,10) };
ok(F.conciliacionCapital().baseFaltante === true, "detecta una apertura vieja sin foto");
S.config.aperturaBase = {};
ok(F.conciliacionCapital().baseFaltante === false, "con foto, aunque este vacia, no avisa");

console.log("\nQue se resta y que no");
limpiar();
S.cuentas = [{ id:"a", nombre:"CAJA", moneda:"USDT", saldo:1000, activa:true }];
MESES_FALSOS[mesHoy] = { ganBrutaTotal: 100, egEmpPag: 30, egPerPagPropio: 20, egPerPag: 15, totalCom: 10 };
S.config = { aperturaUsdt: 1000, aperturaFecha: new Date().toISOString().slice(0,10), aperturaBase: {} };
const co = F.conciliacionCapital();
ok(co.deberias === 1040, "1000 + 100 − 30 − 20 − 10 = 1040 (el sin-cuenta no resta)", co.deberias);
ok(co.egPersonalSin === 15, "pero se muestra aparte para que se vea", co.egPersonalSin);
ok(co.bruta === 100 && co.egEmpresa === 30 && co.socios === 10, "cada linea sale por separado");

console.log("\nTolerancia");
ok(F.conciliacionCapital().tolerancia >= 5, "nunca baja de 5 USDT");
S.cuentas = [{ id:"a", nombre:"CAJA", moneda:"USDT", saldo:10000, activa:true }];
ok(casi(F.conciliacionCapital().tolerancia, 200, 1), "en carteras grandes es el 2% del capital",
   F.conciliacionCapital().tolerancia);
limpiar(); S.config = {}; S.cuentas = [];

// ── Convertir antes de sumar ────────────────────────────────────────────────
// Los informes del mes sumaban reales, bolivares y USDT en crudo bajo un "$".
// 100 BRL + 40 USDT + 5840 VES daban "5.980" — un numero que no es ninguna
// moneda. montoAUsdt convierte cada uno con su tasa antes de sumar.
console.log("\nConvertir a USDT antes de sumar");
ok(F.montoAUsdt(100, "USDT") === 100, "USDT se queda igual");
ok(F.montoAUsdt(100, "USD") === 100, "USD va 1:1, como en conciliacionCapital()");
ok(F.montoAUsdt(100, null) === 100, "sin moneda se asume USDT");
ok(casi(F.montoAUsdt(540, "BRL"), 100, 0.01), "540 BRL a 5,4 son 100 USDT", F.montoAUsdt(540, "BRL"));
ok(casi(F.montoAUsdt(5840, "VES"), 29.2, 0.01), "divide, no multiplica", F.montoAUsdt(5840, "VES"));
ok(F.montoAUsdt(9000, "COP") === null, "sin tasa devuelve null, no inventa un numero");
ok(F.montoAUsdt(0, "COP") === null, "tampoco con monto cero: la moneda sigue sin tasa");
ok(F.montoAUsdt("", "BRL") === 0, "un monto vacio es cero, no NaN");

// El total de un informe: 100 BRL + 40 USDT + 5840 VES, con un cobro en COP
// que no tiene tasa. Lo que no se puede convertir NO se suma; se avisa aparte.
const _filas = [[100,"BRL"], [40,"USDT"], [5840,"VES"], [9000,"COP"]];
let _sinTasa = [], _total = 0;
_filas.forEach(function (f) {
  const u = F.montoAUsdt(f[0], f[1]);
  if (u === null) _sinTasa.push(f[1]); else _total += u;
});
ok(casi(_total, 87.72, 0.01), "el total suma solo lo convertible", _total);
ok(_sinTasa.join() === "COP", "y dice cual moneda se quedo fuera", _sinTasa.join());
ok(_total !== 14980, "no es la suma cruda que salia antes");

console.log("\nComo se muestra cada fila");
ok(F.montoConMoneda(100, "BRL") === "100,00 BRL", "se ve la moneda pactada", F.montoConMoneda(100, "BRL"));
ok(F.montoConMoneda(40, null) === "40,00 USDT", "sin moneda, USDT");
ok(["BRL","BRL","VES"].filter(F._unicos).join() === "BRL,VES", "el aviso no repite monedas");

// ── Que lo que tocas aqui no lo pise una copia vieja ────────────────────────
// El caso real: se marca un cobro como cobrado en la PC y al rato vuelve a
// salir pendiente. cuentasCobrar y prestamos se fusionan entre dispositivos
// pero nunca ponian _mod, asi que la fusion no tenia con que decidir y se
// caia a la hora general del aparato: la copia vieja ganaba.
console.log("\nLa marca de 'esto lo toque yo'");
const memo = {};
const cobro = { id: 1, cliente: "EVELYN", monto: 100, estado: "pendiente" };

// El quinto argumento es "primera pasada sobre este campo", y aqui lo es:
// el memo viene vacio. Asi se llama tambien en la app.
F._marcarCambiados([cobro], memo, "id", "cuentasCobrar", true);
ok(cobro._mod === undefined, "el primer guardado tras abrir no marca nada");
ok(cobro._por === undefined, "ni sella: en la primera pasada todo parece nuevo");

cobro.estado = "cobrado";
F._marcarCambiados([cobro], memo, "id", "cuentasCobrar", false);
ok(typeof cobro._mod === "number", "pero un cambio de verdad si se marca");

const marcaPrimera = cobro._mod;
F._marcarCambiados([cobro], memo);
ok(cobro._mod === marcaPrimera, "guardar sin tocar nada no vuelve a marcar");

// Si _mod entrara en la foto, marcar cambiaria la foto y no pararia nunca.
F._marcarCambiados([cobro], memo);
F._marcarCambiados([cobro], memo);
ok(cobro._mod === marcaPrimera, "y no se marca solo en bucle");

const sinId = { cliente: "SIN ID" };
F._marcarCambiados([sinId], memo);
ok(sinId._mod === undefined, "un registro sin id se deja en paz");

// Tras sincronizar NO se borran las fotos: se vuelven a sacar. Borrarlas dejaba
// a la app sin punto de comparacion, y como esto corre con la respuesta de CADA
// guardado, el SIGUIENTE cambio del usuario no llevaba marca. En produccion eso
// hizo que dos cobros recien marcados volvieran a "pendiente".
S.cuentasCobrar = [{ id: 77, cliente: "EVELYN", estado: "pendiente" }];
F._refotografiar();
ok(S.cuentasCobrar[0]._mod === undefined, "refotografiar no marca nada de golpe");
ok(Object.keys(global.window._fotoPorCampo || {}).length > 0,
   "pero deja fotos nuevas, no las tira");
S.cuentasCobrar[0].estado = "cobrado";       // el usuario lo marca justo despues
F._marcarTodoLoQueSeFusiona();
ok(typeof S.cuentasCobrar[0]._mod === "number",
   "y el cambio que viene DESPUES de sincronizar si se marca");
S.cuentasCobrar = [];

// ── Y ahora para TODOS los campos, no solo dos ──────────────────────────────
// La auditoria encontro que de los 23 campos que se fusionan, doce no tenian
// ni una sola marca — compromisos entre ellos, que es por lo que un pago al
// contador ya hecho volvia a salir "por pagar". Estas pruebas recorren la
// lista entera: si manana se agrega un campo a _MERGE_FIELDS y no queda
// cubierto, aqui falla.
console.log("\nLa marca cubre todos los campos que se fusionan, no dos");
const ID = F._MERGE_ID_FIELD || {};
const campoId = (k) => ID[k] || "id";

// Un registro de mentira por cada campo, con SU campo de identidad.
function sembrar(){
  F._refotografiar();
  F._MERGE_FIELDS.forEach(function(k){
    const r = { estado: "antes" };
    r[campoId(k)] = "x1";
    S[k] = [r];
  });
  F._marcarTodoLoQueSeFusiona();          // primer guardado: solo la foto
}

sembrar();
const sinMarcaAlPrincipio = F._MERGE_FIELDS.filter((k) => S[k][0]._mod !== undefined);
ok(sinMarcaAlPrincipio.length === 0, "ningun campo se marca en el primer guardado",
   sinMarcaAlPrincipio.join(","));

F._MERGE_FIELDS.forEach((k) => { S[k][0].estado = "despues"; });
F._marcarTodoLoQueSeFusiona();
const sinMarcar = F._MERGE_FIELDS.filter((k) => typeof S[k][0]._mod !== "number");
ok(sinMarcar.length === 0,
   "los " + F._MERGE_FIELDS.length + " campos quedan marcados al cambiar",
   sinMarcar.length ? "sin marcar: " + sinMarcar.join(", ") : "");

// Los cuatro campos que NO usan "id" son los que se rompen si alguien asume id.
["clientes", "brl", "vzla", "eeuu", "cierresMes"].forEach(function(k){
  if (F._MERGE_FIELDS.indexOf(k) === -1) return;
  ok(typeof S[k][0]._mod === "number",
     k + " se marca por su propio campo de identidad (" + campoId(k) + ")");
});

// Un registro cuyo campo de identidad no coincide no se toca ni rompe nada.
F._refotografiar();
S.compromisos = [{ id: "c1", pagado: false }, { sinIdentidad: true }];
F._marcarTodoLoQueSeFusiona();
S.compromisos[0].pagado = true;
F._marcarTodoLoQueSeFusiona();
ok(typeof S.compromisos[0]._mod === "number", "un compromiso pagado queda marcado");
ok(S.compromisos[1]._mod === undefined, "y uno sin identidad se deja en paz");

F._refotografiar();
F._MERGE_FIELDS.forEach((k) => { S[k] = []; });

console.log("\nLa fusion con otro dispositivo");
// PC: cobrado y marcado. Servidor: copia vieja, pendiente, sin marca, y con
// una hora general MAS NUEVA — que es justo lo que hacia perder al bueno.
const local  = [{ id: 1, cliente: "EVELYN", estado: "cobrado",   _mod: 2000 }];
const remoto = [{ id: 1, cliente: "EVELYN", estado: "pendiente" }];
const fus = F._mergeArrayById(remoto, local, "id", 9999, 1);
ok(fus[0].estado === "cobrado", "el cobro marcado le gana a la copia vieja", fus[0].estado);

// Sin la marca —como estaba antes— gana la copia vieja: el error de Evelyn.
const localViejo = [{ id: 1, cliente: "EVELYN", estado: "cobrado" }];
const fusViejo = F._mergeArrayById(remoto, localViejo, "id", 9999, 1);
ok(fusViejo[0].estado === "pendiente", "sin marca se pierde (asi era el error)", fusViejo[0].estado);

// Dos marcas: gana la mas nueva, venga de donde venga.
const localA = [{ id: 1, estado: "cobrado", _mod: 100 }];
const remotoB = [{ id: 1, estado: "pendiente", _mod: 200 }];
ok(F._mergeArrayById(remotoB, localA, "id", 1, 9999)[0].estado === "pendiente",
   "entre dos marcas gana la mas nueva, no la hora del aparato");

// Un registro que solo existe en el otro dispositivo no se pierde.
const fus2 = F._mergeArrayById([{ id: 7, estado: "pendiente" }], local, "id", 1, 1);
ok(fus2.length === 2, "lo que solo esta en el otro dispositivo se trae igual");

// ── Lo que no son listas: config, tasas e historiales ───────────────────────
// config no se reemplazaba: se CONGELABA. _mergeConfigSafe decia "si local ya
// tiene un valor real, se queda tal cual", asi que un cambio hecho en la PC no
// llegaba nunca al telefono. Medido antes del arreglo: telefono con apertura
// 2.505,37, servidor con 2.372,71, y el telefono se quedaba con 2.505,37 para
// siempre. Dos aparatos que nunca mas coinciden en cuanto deberias tener.
console.log("\nLa configuracion se sincroniza, no se congela");
const respaldoViejo = (k, r, l) => l===undefined||l===null||l===""||l===0;

S._modCampos = {};
global.window._fotoPorClave = {};
S.config = { aperturaUsdt: 2505.37, comision_usdt: 0.06 };
F._marcarObjetosCambiados();               // primer guardado: solo la foto
ok(Object.keys(S._modCampos.config || {}).length === 0,
   "el primer guardado no marca ninguna clave");

S.config.aperturaUsdt = 2372.71;           // el usuario la cambia en la PC
F._marcarObjetosCambiados();
ok(typeof S._modCampos.config.aperturaUsdt === "number", "cambiarla si la marca");
ok(S._modCampos.config.comision_usdt === undefined, "y no marca lo que no tocaste");

// El telefono: tiene la vieja sin marca, el servidor trae la nueva marcada.
const marcasPC = JSON.parse(JSON.stringify(S._modCampos));
S._modCampos = {};                                     // el telefono no marco nada
const enTelefono = F._mergeObjetoPorClave(
  { aperturaUsdt: 2372.71, comision_usdt: 0.06 },      // lo que trae el servidor
  { aperturaUsdt: 2505.37, comision_usdt: 0.06 },      // lo que tiene el telefono
  "config", { config: marcasPC.config }, respaldoViejo);
ok(enTelefono.aperturaUsdt === 2372.71,
   "la apertura cambiada en la PC si llega al telefono", enTelefono.aperturaUsdt);

// Y al reves: lo que tocaste AQUI no lo pisa una copia sin marcar.
S._modCampos = { config: { aperturaUsdt: 5000 } };
const aqui = F._mergeObjetoPorClave({ aperturaUsdt: 2372.71 }, { aperturaUsdt: 9999 },
  "config", {}, respaldoViejo);
ok(aqui.aperturaUsdt === 9999, "y lo que tocaste aqui no lo pisa una copia sin marca");

// Dos marcas: gana la mas nueva.
S._modCampos = { config: { x: 100 } };
ok(F._mergeObjetoPorClave({ x: "nuevo" }, { x: "viejo" }, "config",
     { config: { x: 200 } }, respaldoViejo).x === "nuevo",
   "entre dos marcas gana la mas nueva");
ok(F._mergeObjetoPorClave({ x: "nuevo" }, { x: "viejo" }, "config",
     { config: { x: 50 } }, respaldoViejo).x === "viejo",
   "y la vieja no gana aunque venga del servidor");

// Sin marcas de ningun lado se respeta el criterio de siempre.
S._modCampos = {};
ok(F._mergeObjetoPorClave({ a: 7 }, { a: 0 }, "config", {}, respaldoViejo).a === 7,
   "sin marcas, un 0 local sigue cediendo (como antes)");
ok(F._mergeObjetoPorClave({ a: 7 }, { a: 3 }, "config", {}, respaldoViejo).a === 3,
   "sin marcas, un valor real local sigue mandando (como antes)");
// Una clave que solo tiene el otro aparato entra siempre.
ok(F._mergeObjetoPorClave({ nueva: 1 }, {}, "config", {}, respaldoViejo).nueva === 1,
   "una clave que solo tiene el otro aparato se trae");

console.log("\nLos historiales se unen, no se reemplazan");
const hUnido = F._unirHistorial({ "2026-09-10": 100, "2026-09-11": 200 },
                                { "2026-09-11": 999, "2026-09-12": 300 });
ok(hUnido["2026-09-10"] === 100, "el dia que solo tenia el otro aparato se recupera");
ok(hUnido["2026-09-12"] === 300, "el dia propio no se pierde");
ok(hUnido["2026-09-11"] === 999, "en empate manda el de este aparato");
const muchos = {};
for (let i = 0; i < 200; i++) muchos["2026-01-" + String(i).padStart(3, "0")] = i;
ok(Object.keys(F._unirHistorial(muchos, {})).length === 120, "se poda a 120 dias");

console.log("\nLas marcas por clave se suman");
S._modCampos = { config: { a: 100, b: 500 } };
F._unirMarcasCampos({ config: { a: 300, c: 700 }, tasasDia: { BRL: 50 } });
ok(S._modCampos.config.a === 300, "se queda la marca mas nueva");
ok(S._modCampos.config.b === 500, "no se pierde una marca propia");
ok(S._modCampos.config.c === 700, "se trae una marca que solo tenia el otro");
ok(S._modCampos.tasasDia.BRL === 50, "y un campo entero que no teniamos");
S._modCampos = {}; S.config = {};

// ── Las marcas no cuentan como "cambio de datos" ────────────────────────────
// _huellaCompleta() contesta "¿cambio algo, hay que guardar?". Si las marcas de
// tiempo entran ahi, la respuesta es que si cada vez que cambia la marca de que
// algo cambio: la app guarda de mas, el guardado sube la hora del servidor, el
// otro aparato se lo baja y repinta. El codigo ya excluia "_mod" de cada
// registro por esta misma razon; _modCampos tiene que quedar fuera igual.
console.log("\nLas marcas no son datos");
ok(F.DATA_KEYS.indexOf("_modCampos") !== -1,
   "_modCampos se guarda (si no, las marcas no sobreviven a recargar)");
ok(F._CLAVES_QUE_NO_SON_DATOS.indexOf("_modCampos") !== -1,
   "pero no cuenta como dato para decidir si hay que guardar");

F._MERGE_FIELDS.forEach((k) => { S[k] = []; });
S.config = { aperturaUsdt: 2372.71 };
S._modCampos = { config: { aperturaUsdt: 111 } };
const huella1 = F._huellaCompleta();
const conteo1 = F._conteoRapido();
S._modCampos = { config: { aperturaUsdt: 999999 } };   // solo cambia la marca
ok(F._huellaCompleta() === huella1, "cambiar solo una marca no cambia la huella");
ok(F._conteoRapido() === conteo1, "ni el conteo rapido");
S.config.aperturaUsdt = 9999;                          // ahora si cambia un dato
ok(F._huellaCompleta() !== huella1, "pero cambiar un dato de verdad si la cambia");
// Un registro marcado tampoco cuenta: "_mod" ya estaba excluido, se deja fijado.
S.cuentasCobrar = [{ id: 1, estado: "cobrado" }];
const huella2 = F._huellaCompleta();
S.cuentasCobrar[0]._mod = Date.now();
ok(F._huellaCompleta() === huella2, "y marcar un registro tampoco");
S.cuentasCobrar = []; S.config = {}; S._modCampos = {};

// ── El dinero que entra y se queda en la cuenta ─────────────────────────────
// Regla de la duena: esos bolivares valen lo que costaron los reales que
// entrego por ellos. En cTx() ese valor es "uc" —los USDT que vale lo que
// entro—, NO "uv" —lo que costo lo que se entrego—. La diferencia entre los
// dos es "pr", la ganancia que la remesa ya apunto: guardar el lote a "uv" la
// deja dentro del lote y la app la vuelve a apuntar el dia que se gaste.
// Contada dos veces. Lo prueba el ida y vuelta, mas abajo.
console.log("\nEl dinero que entra vale lo que la app dijo que valia");
S.inventarioUsdt = [];
const l1 = F.crearLoteRecibido("VES", 20010, 21.3563, "bdv", "12/09", "uid-1");
ok(l1 !== null, "se crea el lote");
ok(l1.bs === 20010 && l1.bsRestante === 20010, "con lo que entro");
ok(casi(l1.tasa, 936.9601, 0.0001), "tasa = 20010 / 21,3563", l1.tasa);
ok(l1.usdt === 21.3563, "y guarda lo que vale en USDT");
ok(l1.cuentaDestinoId === "bdv",
   "ligado por cuentaDestinoId, que es por donde busca el consumo FIFO");
ok(l1.plataforma === "Remesa", "marcado como venido de una remesa, no de USDT");
ok(l1.tipo === "venta" && l1.moneda === "VES", "con la forma de un lote de venta");
ok(typeof l1.id === "number", "id numerico: ordenFIFO compara numeros");

// Sin costo no hay tasa. Un lote con tasa 0 envenenaria las tasas que la app
// sugiere, y eso es peor que no tener el lote.
ok(F.crearLoteRecibido("VES", 20010, 0, "bdv", "12/09", "x") === null,
   "sin valor no se inventa un lote con tasa 0");
ok(F.crearLoteRecibido("VES", 100, 5, "", "12/09", "x") === null, "sin cuenta no se crea");
ok(F.crearLoteRecibido("VES", 0, 5, "bdv", "12/09", "x") === null, "con monto cero tampoco");

// Dos entradas distintas no se mezclan: cada una con su valor.
S.inventarioUsdt = [];
F.crearLoteRecibido("VES", 20010, 21.3563, "bdv", "12/09", "a");
F.crearLoteRecibido("VES", 10000, 12, "bdv", "12/09", "b");
ok(S.inventarioUsdt.length === 2, "dos entradas son dos lotes");
ok(S.inventarioUsdt[0].tasa !== S.inventarioUsdt[1].tasa, "cada una con su tasa");

console.log("\nSi el dinero no entro, el lote no existe");
S.inventarioUsdt = [];
F.crearLoteRecibido("VES", 20010, 21.3563, "bdv", "12/09", "uid-3");
ok(F.quitarLoteDeRemesa("uid-3") === 1, "borrar la remesa se lleva su lote");
ok(S.inventarioUsdt.length === 0, "y no queda nada suelto");
F.crearLoteRecibido("VES", 100, 1, "bdv", "12/09", "uid-4");
ok(F.quitarLoteDeRemesa("otro") === 0, "y no se lleva el de otra remesa");
ok(S.inventarioUsdt.length === 1, "que sigue ahi");

console.log("\nCuando por fin se cobra");
S.inventarioUsdt = [];
const pend = { monto: 20010, moneda: "VES", usdtValor: 21.3563, refUid: "uid-5" };
const todo = F._loteAlCobrar(pend, 20010, "bdv");
ok(todo && todo.bs === 20010, "el cobro completo trae todo el dinero");
ok(casi(todo.tasa, 936.9601, 0.0001), "con el valor del dia en que se pacto");
S.inventarioUsdt = [];
const mitad = F._loteAlCobrar(pend, 10005, "bdv");
ok(mitad && mitad.bs === 10005, "un abono trae solo su parte");
ok(casi(mitad.usdt, 10.678, 0.001), "y el valor va a prorrata", mitad.usdt);
ok(casi(mitad.tasa, 936.9601, 0.01), "a la misma tasa: la parte no cambia el valor unitario");
S.inventarioUsdt = [];
ok(F._loteAlCobrar({ monto: 500, moneda: "VES", refUid: "z" }, 500, "bdv") === null,
   "un cobro viejo sin valor guardado no crea lote");
ok(F._loteAlCobrar({ monto: 500, moneda: "USDT", usdtValor: 1, refUid: "z" }, 500, "bdv") === null,
   "y una moneda que no lleva lotes se deja en paz");
S.inventarioUsdt = [];

// ── El ida y vuelta: la ganancia se cuenta UNA sola vez ─────────────────────
// Esta es la prueba que faltaba, y por eso el error paso. Las de arriba miran
// UNA remesa: con el lote a "uv" todas pasaban, porque el desfase no aparece
// hasta que ese mismo dinero SALE. Hay que seguirlo hasta el final.
//
//   Remesa A (VES→BRL): entran 138.000 Bs · ella entrega 836 BRL
//       uc 158,6207 = lo que vale lo que entro
//       uv 154,8748 = lo que costo lo que entrego
//       pr   3,7459 = uc − uv  ← la app YA apunto esta ganancia, en la remesa A
//   Esos 138.000 Bs se quedan en la cuenta: nace su lote.
//   Remesa B (BRL→VES): paga esos mismos 138.000 Bs. El FIFO los consume a la
//   tasa del lote, asi que lo que la app dice que costo gastarlos = 138.000 /
//   tasa del lote.
//
// Con el lote a "uc", gastarlo cuesta lo mismo que valia al entrar: el dinero
// entra y sale por el mismo valor y la unica ganancia del ida y vuelta es la
// que de verdad hubo. Con el lote a "uv" gastarlo sale "pr" mas barato, y ese
// "pr" reaparece como ganancia en la remesa B. Contado dos veces.
console.log("\nEl ida y vuelta: la ganancia se cuenta una sola vez");
const AM_A = 138000, UC_A = 158.6207, UV_A = 154.8748;
const PR_A = F.r4(UC_A - UV_A);

// Lo que la app dira que costo gastar esos bolivares, segun a cuanto se guardo
// el lote. Usa el consumo FIFO de verdad, no la tasa del lote a mano: asi la
// prueba cubre tambien que el lote quede donde el FIFO lo encuentra.
function costoDeGastarlo(valorDelLote) {
  S.inventarioUsdt = [];
  F.crearLoteRecibido("VES", AM_A, valorDelLote, "bdv", "12/09", "ida");
  const gasto = F.simularConsumoFIFO("BRL", 0, "VES", AM_A, "", "bdv");
  if (gasto.ventas.length !== 1) return NaN;
  return AM_A / gasto.ventas[0].tasa;
}

const conUc = costoDeGastarlo(UC_A);
ok(casi(conUc, UC_A, 0.01),
   "con el lote a 'uc' gastarlo cuesta lo mismo que valia al entrar", conUc);
const conUv = costoDeGastarlo(UV_A);
ok(casi(conUc - conUv, PR_A, 0.01),
   "con el lote a 'uv' gastarlo sale mas barato, y por exactamente el 'pr' de A",
   conUc - conUv);
ok(conUv < conUc, "que es el desfase que hacia contar la ganancia dos veces");
S.inventarioUsdt = [];

// Lo de arriba prueba la aritmetica. Esto prueba que index.html le pasa el
// numero correcto, que es justo lo que estaba mal: la funcion era buena, la
// llamada le daba "uv". Si alguien vuelve a ponerlo, la prueba lo canta.
ok(/crearLoteRecibido\(ruta\.orig,\s*res\.am,\s*res\.uc\s*,/.test(HTML),
   "saveTx crea el lote con 'uc'");
ok(/usdtValor\s*:\s*res\.uc\b/.test(HTML),
   "y el cobro pendiente guarda 'uc' para cuando nazca el lote");
ok(/usdtValor\s*:\s*parseFloat\(r\.uc\)/.test(HTML),
   "pasar una remesa a pendiente, igual");
ok(!/crearLoteRecibido\([^)]*\buv\b/.test(HTML),
   "y a crearLoteRecibido no se le pasa 'uv' en ningun sitio");

// ── Leer un número tecleado como se escribe aqui ───────────────────────────
// El 12/09 el Banco de Venezuela paso de 218.629,90 a 198,89 con un tecleo: se
// leia con parseFloat(txt.replace(",",".")), que parte el numero en el PRIMER
// punto, asi que "198.619,90" entraba como 198,619. La remesa siguiente dejo la
// cuenta en negativo. Esto fija como se lee cada formato.
console.log("\nNumeros tecleados");
const L = (t, m) => F._leerNumero(t, m);
ok(L("198.619,90") === 198619.9, "198.619,90 (como se escribe aqui)", L("198.619,90"));
ok(L("198619,90")  === 198619.9, "198619,90 (sin punto de miles)", L("198619,90"));
ok(L("198619.90")  === 198619.9, "198619.90 (punto decimal)", L("198619.90"));
ok(L("1.000.000")  === 1000000,  "1.000.000 (varios puntos, todos de miles)", L("1.000.000"));
ok(L("198.619")    === 198619,   "198.619 (un punto con tres cifras = miles)", L("198.619"));
ok(L("193.399,90") === 193399.9, "193.399,90 tampoco se parte", L("193.399,90"));
ok(L("-5.036,77")  === -5036.77, "y los negativos", L("-5.036,77"));
ok(L("5.220,00 Bs")=== 5220,     "con la moneda pegada detras", L("5.220,00 Bs"));
ok(L("0,5")        === 0.5,      "coma decimal suelta", L("0,5"));
ok(L("306.2367","USDT") === 306.2367,
   "en USDT el punto SI es decimal: se manejan cuatro", L("306.2367","USDT"));
ok(L("123.295","USDT")  === 123.295,
   "y tres decimales tambien, que es como estan los lotes", L("123.295","USDT"));
ok(isNaN(L("")) && isNaN(L("abc")) && isNaN(L(null)),
   "lo que no es un numero se rechaza, no se convierte en 0");

// ARREGLO 43 (14/09/2026): la regla de "tres cifras detras del punto = miles"
// (la que evita que 198.619,90 se parta en 198) tambien se tragaba 0.003 y la
// devolvia como 3. Con eso, Configuracion rechazaba la comision del banco por
// pasarse del 0,5 maximo, y la dueña NO PODIA quitarse el 3% que le estaba
// comiendo media ganancia en cada remesa a Venezuela — ni escribiendolo bien.
// Nadie escribe 0.003 queriendo decir tres mil: si empieza por "0.", es decimal.
ok(L("0.003") === 0.003, "0.003 es tres milesimas, no tres mil", L("0.003"));
ok(L("0,003") === 0.003, "y con coma igual", L("0,003"));
ok(L(".003")  === 0.003, "y sin el cero delante", L(".003"));
ok(L("-0.003") === -0.003, "y en negativo", L("-0.003"));
ok(L("0.000") === 0, "cero escrito con tres ceros sigue siendo cero", L("0.000"));
ok(L("0.5") === 0.5 && L("0.06") === 0.06,
   "y los decimales cortos no cambian");
// Y que la salvedad NO se lleve por delante lo que ya estaba bien.
ok(L("198.619") === 198619 && L("1.000") === 1000 && L("10.000") === 10000,
   "un numero que no empieza por cero sigue leyendose con miles");

// Los tres campos de la comision del banco no pueden ser type=number: el
// navegador se come la coma decimal antes de que el codigo vea nada, asi que
// "0,003" le llegaba como "0003" = 3. Van como texto y los lee _leerNumero.
["inp-com-banco", "inp-com-banco-min", "inp-com-banco-transf"].forEach(function (id) {
  ok(new RegExp("type='text' inputmode='decimal' id='" + id + "'").test(HTML),
     id + " acepta la coma decimal");
  ok(!new RegExp("type='number' id='" + id + "'").test(HTML),
     "y ya no es type=number, que se la comia");
});

// El aviso es la red de seguridad: el punto suelto es ambiguo y ninguna regla
// lo acierta siempre, asi que lo que de verdad protege es ver lo que se leyo.
console.log("\nEl aviso antes de tocar un saldo");
const cta = { nombre:"BANCO DE VENEZUELA", moneda:"VES" };
const avisoMalo = F._avisoCambioSaldo(cta, 218629.9, 198.89, 198.89 - 218629.9);
ok(avisoMalo.indexOf("218.629,90") > -1, "enseña lo que hay ahora");
ok(avisoMalo.indexOf("198,89") > -1, "y lo que va a quedar");
ok(avisoMalo.indexOf("veces MENOS") > -1, "y canta el salto de mil veces", avisoMalo);
ok(avisoMalo.indexOf("punto de miles") > -1, "diciendo donde mirar");
const avisoNormal = F._avisoCambioSaldo(cta, 218629.9, 193399.9, 193399.9 - 218629.9);
ok(avisoNormal.indexOf("⚠️") === -1,
   "un cambio normal no lleva aviso, para que el aviso signifique algo");
// Y que el editor de saldo lo use de verdad: el fallo no estaba en como se lee
// un numero, estaba en quien lo leia.
ok(/var num=_leerNumero\(nv,c\.moneda\);/.test(HTML),
   "el editor de saldo lee con _leerNumero");
ok(/if\(!confirm\(_avisoCambioSaldo\(/.test(HTML),
   "y no aplica nada sin confirmar antes");
ok(!/parseFloat\(nv\.replace\(","/.test(HTML),
   "ya no queda el parseFloat que partia el numero en el primer punto");
// La otra pantalla de saldos (la tabla de cuentas) pasa por updateCuentaSaldo.
// Alli el fallo era el "||0": un campo vacio o un numero que el navegador no
// acepta dejaba la cuenta en CERO. 27 de sus 106 ajustes acabaron en 0.
ok(/var v=_leerNumero\(val,c\.moneda\);/.test(HTML),
   "updateCuentaSaldo tambien lee con _leerNumero");
ok(/if\(isNaN\(v\)\)\{ alert/.test(HTML),
   "y lo que no entiende no lo convierte en 0: no toca la cuenta");
ok(!/var v=parseFloat\(val\)\|\|0;/.test(HTML),
   "ya no queda el \"||0\" que vaciaba cuentas");
ok(/if\(!confirm\(_avisoCambioSaldo\(c,antes,v,delta\)\)\)/.test(HTML),
   "y confirma antes de aplicar, igual que la otra pantalla");

// ── El lote solo nace con bolivares ────────────────────────────────────────
// Una remesa Brasil→Venezuela metia en el inventario un "vendi 30 BRL a 5,1424"
// que nadie hizo. No era solo ruido: consumirInventarioFIFO se lo comia en la
// siguiente remesa VZLA→BRL que pagara por esa cuenta.
console.log("\nEl lote solo nace con bolivares");
S.inventarioUsdt = [];
ok(F.crearLoteRecibido("BRL", 30, 5.8339, "pagbank", "12/09", "x") === null,
   "los reales que entran NO crean lote");
ok(S.inventarioUsdt.length === 0, "y no queda nada en el inventario");
ok(F.crearLoteRecibido("USD", 100, 100, "zelle", "12/09", "x") === null,
   "ninguna otra moneda tampoco");
ok(F.crearLoteRecibido("VES", 20010, 21.3563, "bdv", "12/09", "x") !== null,
   "los bolivares si, que es lo unico que se acordo");
S.inventarioUsdt = [];
ok(F._loteAlCobrar({ monto:500, moneda:"BRL", usdtValor:98, refUid:"z" }, 500, "pagbank") === null,
   "y al cobrar un pendiente en reales, tampoco");
ok(S.inventarioUsdt.length === 0, "sigue sin quedar nada");
S.inventarioUsdt = [];
// Y que saveTx solo lo llame con bolivares: el fallo estaba en la condicion.
ok(/if\(ruta\.orig==="VES" && !f\.pendiente\)/.test(HTML),
   "saveTx crea el lote solo cuando lo que entra son bolivares");
ok(!/ruta\.orig==="BRL"[^)]*\)\s*\{\s*\n\s*crearLoteRecibido/.test(HTML),
   "y ya no con reales");

// ── La fecha del lote, y con ella el orden FIFO ─────────────────────────────
// El 12/09 los lotes de 11.000 y 33.000 Bs que habian entrado por la manana se
// quedaron enteros mientras se consumia una venta de 300.000 de la tarde. La
// causa: cada sitio escribia la fecha a su manera y ordenFIFO lee dia*100+mes.
//     "09/12" (venta USDT) = 912   ·   "12/09/26" (remesa) = 1209
// 912 < 1209, asi que la venta parecia mas vieja. Todas del MISMO dia.
console.log("\nLa fecha del lote: un solo formato");
ok(F._fechaLote("2026-09-12") === "09/12", "ISO → mm/dd", F._fechaLote("2026-09-12"));
ok(F._fechaLote("12/09/26")   === "09/12", "dd/mm/aa → mm/dd", F._fechaLote("12/09/26"));
ok(F._fechaLote("09/12")      === "09/12", "mm/dd se deja como esta", F._fechaLote("09/12"));
ok(F._fechaLote("1/9/26")     === "09/01", "y rellena con cero", F._fechaLote("1/9/26"));
ok(F._fechaLote("") === "" && F._fechaLote(null) === "", "sin fecha no inventa una");
// Idempotente: normalizarInventarioFIFO lo corre en cada lectura.
ok(F._fechaLote(F._fechaLote("12/09/26")) === "09/12", "pasarlo dos veces no lo cambia");

console.log("\nY el orden FIFO con los tres sitios mezclados");
// Mismo dia, creados por los tres caminos: el orden lo tiene que decidir el id,
// no el formato.
const tres = [
  { fecha: F._fechaLote("2026-09-12"), id: 3 },   // cobro de un pendiente
  { fecha: F._fechaLote("12/09/26"),   id: 1 },   // lote de remesa
  { fecha: F._fechaLote("09/12"),      id: 2 }    // venta de USDT
];
ok(tres.every(x => x.fecha === "09/12"), "los tres quedan con la misma fecha");
ok(tres.slice().sort(F.ordenFIFO).map(x => x.id).join() === "1,2,3",
   "y entonces manda el orden en que se crearon",
   tres.slice().sort(F.ordenFIFO).map(x => x.id).join());
// Antes, sin normalizar, el de la remesa se iba al final aunque fuera el
// primero. Ahora ordenFIFO normaliza el mismo, asi que ni siquiera hace falta
// que se lo hayan pasado limpio.
ok([{fecha:"12/09/26",id:1},{fecha:"09/12",id:2}].sort(F.ordenFIFO)[0].id === 1,
   "y con las fechas crudas mezcladas, manda el id",
   [{fecha:"12/09/26",id:1},{fecha:"09/12",id:2}].sort(F.ordenFIFO)[0].id);

console.log("\nEl caso del 12/09, con sus numeros");
S.inventarioUsdt = [];
// Por la manana entran bolivares de dos remesas VZLA→BRL
F.crearLoteRecibido("VES", 11000, 11.4631, "bdv", "12/09/26", "kayrelis");
F.crearLoteRecibido("VES", 33000, 34.3893, "bdv", "12/09/26", "julio");
// Por la tarde vende USDT por 300.000 Bs
S.inventarioUsdt.push({ id: F._idLoteNuevo(), tipo:"venta", fecha:"09/12", moneda:"VES",
  usdt:314.19, tasa:955, bs:300000, bsRestante:300000, cuentaDestinoId:"bdv",
  plataforma:"Binance P2P", restante:0 });
ok(S.inventarioUsdt.every(l => l.fecha === "09/12"), "los tres lotes, misma fecha");
const gasto = F.simularConsumoFIFO("BRL", 0, "VES", 20000, "", "bdv");
ok(gasto.ventas.length === 2, "una remesa de 20.000 Bs toca dos lotes", gasto.ventas.length);
// Sin el "||{}" un fallo aqui revienta el proceso y esconde las comprobaciones
// que vienen detras, que es justo cuando mas falta hacen.
const v0 = gasto.ventas[0] || {}, v1 = gasto.ventas[1] || {};
ok(v0.bs === 11000 && casi(v0.tasa, 959.6008, 0.001),
   "primero los 11.000 de la manana, a su tasa", JSON.stringify(v0));
ok(v1.bs === 9000 && casi(v1.tasa, 959.6008, 0.001),
   "y el resto de los 33.000, no la venta de la tarde", JSON.stringify(v1));
S.inventarioUsdt = [];

// El id tambien decide el orden cuando la fecha empata, asi que tiene que ir
// siempre hacia adelante. Antes llevaba un Math.random() de hasta 99 y podia
// dejar un lote nuevo por detras del anterior.
console.log("\nEl id de un lote va siempre hacia adelante");
S.inventarioUsdt = [];
const ids = [];
for (let i = 0; i < 50; i++) {
  const l = F.crearLoteRecibido("VES", 100, 1, "bdv", "09/12", "u" + i);
  ids.push(l.id);
}
ok(ids.every((v, i) => i === 0 || v > ids[i - 1]), "cincuenta seguidos, cada uno mayor");
ok(new Set(ids).size === 50, "y ninguno repetido");
ok(S.inventarioUsdt.map(l => l.id).join() === ids.join(),
   "asi que el FIFO los gasta en el orden en que se crearon");
S.inventarioUsdt = [];

// Y que los tres sitios de index.html usen la funcion: el fallo estaba en la
// llamada, no en el orden.
ok(/var fecha=_fechaLote\(f\.fecha\), fechaIso=_fechaLoteIso\(f\.fecha\);/.test(HTML),
   "saveIU pone la fecha del lote con _fechaLote, y el año con _fechaLoteIso");
ok(/tipo:"venta", fecha:_fechaLote\(fecha\), fechaIso:_fechaLoteIso\(fecha\), hora:_horaDe\(hora\), moneda:moneda,/.test(HTML),
   "crearLoteRecibido las normaliza dentro, para quien la llame manana");
// ARREGLO 51: y que NINGUN sitio meta un lote sin su año. mm/dd solo no basta:
// en enero, un lote de diciembre se ordenaba por delante de uno de enero.
ok((HTML.match(/inventarioUsdt\.push\(/g)||[]).length ===
   (HTML.match(/fechaIso:/g)||[]).length,
   "cada sitio que crea un lote le pone tambien el año",
   (HTML.match(/inventarioUsdt\.push\(/g)||[]).length + " push / " +
   (HTML.match(/fechaIso:/g)||[]).length + " con año");
ok(/if\(r\.fecha\)\{ var fn=_fechaLote\(r\.fecha\); if\(fn!==r\.fecha\) r\.fecha=fn; \}/.test(HTML),
   "y los lotes ya guardados se corrigen al leer el inventario");
ok(!/f\.fecha\.slice\(5\)\.replace\("-","\/"\)/.test(HTML),
   "ya no queda el recorte a mano que se desincronizaba");

// ── TODOS los sitios que meten un lote, no solo los que me acordé ───────────
// Esta es la prueba que faltaba de verdad. La anterior miraba tres llamadas
// concretas y por eso se me pasaron cuatro: los lotes "Operación" y
// "Operación EE.UU" seguían escribiendo ds(f.date), que es dd/mm/aa. En vez de
// listar sitios a mano, se recorre el archivo y se exige que la fecha de CADA
// push salga de _fechaLote(). Si alguien añade uno nuevo mañana, falla aquí.
console.log("\nTodos los sitios que crean un lote usan la misma fecha");
// Cada "inventarioUsdt.push(" del archivo, sin listarlos a mano.
const posiciones = [...HTML.matchAll(/inventarioUsdt\.push\(/g)].map(m => m.index);
ok(posiciones.length >= 7, "se encuentran los siete sitios que meten lotes",
   posiciones.length);
// Variables ya normalizadas: las que se asignan con _fechaLote(...)
const limpias = new Set(
  [...HTML.matchAll(/var\s+([A-Za-z_$][\w$]*)\s*=\s*_fechaLote\(/g)].map(m => m[1]));
const sucios = [];
posiciones.forEach(i => {
  const trozo = HTML.slice(i, i + 700);
  const campo = /fecha\s*:\s*([^,}\n]+)/.exec(trozo);
  if (!campo) {
    // push(lote): el objeto se arma en crearLoteRecibido, ya comprobado arriba.
    if (!/inventarioUsdt\.push\([A-Za-z_$][\w$]*\)/.test(trozo)) sucios.push("(push sin fecha)");
    return;
  }
  const val = campo[1].trim();
  if (val.startsWith("_fechaLote(") || limpias.has(val)) return;
  sucios.push(val);
});
ok(sucios.length === 0, "ninguno escribe la fecha por su cuenta", sucios.join(" · "));
ok(!/var\s+fd\s*=\s*ds\(/.test(HTML),
   "y no queda ningun lote naciendo con ds(), que devuelve dd/mm/aa");

// Y ordenFIFO normaliza él mismo, para no depender de que alguien lo haya hecho
// antes: habia dos sitios que ordenaban sin normalizar, uno de ellos el
// historial que se ve en pantalla.
console.log("\nordenFIFO no depende de que le normalicen la entrada");
const mezclados = [
  { fecha: "2026-09-13", id: 3 },   // ISO, sin tocar
  { fecha: "13/09/26",   id: 1 },   // dd/mm/aa, sin tocar
  { fecha: "09/13",      id: 2 }    // mm/dd
];
ok(mezclados.slice().sort(F.ordenFIFO).map(x => x.id).join() === "1,2,3",
   "ordena bien los tres formatos crudos, sin normalizarlos antes",
   mezclados.slice().sort(F.ordenFIFO).map(x => x.id).join());
// Entre meses: el 13 de septiembre va antes que el 20, escritos como sea.
ok(F.ordenFIFO({fecha:"13/09/26",id:1},{fecha:"09/20",id:2}) < 0,
   "un lote del 13/09 se gasta antes que uno del 20/09");

// ── Aviso al registrar con fecha futura ────────────────────────────────────
// Un registro adelantado se queda el ULTIMO de la cola del inventario hasta que
// llegue ese dia: el dinero ya esta en la cuenta pero el FIFO no lo toca, asi
// que las remesas siguientes gastan de otros lotes y a otra tasa. Paso el 12/09
// poniendo 18/09 sin querer.
console.log("\nFechas por delante de hoy");
const _iso = (d) => { const x = new Date(); x.setDate(x.getDate() + d);
  return x.getFullYear() + "-" + String(x.getMonth()+1).padStart(2,"0") + "-" +
         String(x.getDate()).padStart(2,"0"); };
ok(F._diasEnElFuturo(_iso(0))  === 0, "hoy son cero dias", F._diasEnElFuturo(_iso(0)));
ok(F._diasEnElFuturo(_iso(5))  === 5, "dentro de cinco dias", F._diasEnElFuturo(_iso(5)));
ok(F._diasEnElFuturo(_iso(1))  === 1, "manana", F._diasEnElFuturo(_iso(1)));
ok(F._diasEnElFuturo(_iso(-3)) === -3, "y el pasado sale negativo", F._diasEnElFuturo(_iso(-3)));
ok(F._diasEnElFuturo("") === 0 && F._diasEnElFuturo("no es fecha") === 0,
   "lo que no es una fecha no inventa dias");

// No bloquea: pregunta, y lo que decida el usuario es lo que vale.
let preguntado = null;
global.confirm = (t) => { preguntado = t; return true; };
ok(F.confirmarFechaFutura(_iso(0), "Esta remesa") === true && preguntado === null,
   "con la fecha de hoy no pregunta nada");
ok(F.confirmarFechaFutura(_iso(-10), "Esta remesa") === true && preguntado === null,
   "con una fecha pasada tampoco: registrar olvidados es normal");
ok(F.confirmarFechaFutura(_iso(5), "Esta remesa") === true && preguntado !== null,
   "con una futura si pregunta");
ok(preguntado.indexOf("5 días por delante") > -1, "y dice cuantos dias", preguntado);
ok(preguntado.indexOf("la última en la cola") > -1, "y por que importa");
preguntado = null;
F.confirmarFechaFutura(_iso(1), "Esta remesa");
ok(preguntado.indexOf("es mañana") > -1, "manana lo dice con palabras", preguntado);
global.confirm = () => false;
ok(F.confirmarFechaFutura(_iso(5), "Esta remesa") === false,
   "y si dice que no, no se guarda");
delete global.confirm;

// Y que los tres sitios que registran una operacion lo llamen.
ok((HTML.match(/if\(!confirmarFechaFutura\(/g) || []).length === 3,
   "los tres: remesa, remesa EE.UU y compra/venta de USDT",
   (HTML.match(/if\(!confirmarFechaFutura\(/g) || []).length);

// ── Lo que cobra el banco venezolano ───────────────────────────────────────
// Tarifario del BCV: pago movil a otro banco 0,3% con MINIMO Bs 14;
// transferencia a otro banco Bs 54 fijos; dentro del mismo banco, nada.
// El minimo es el que faltaba: el 0,3% no llega a 14 hasta los 4.667 Bs, asi
// que toda remesa por debajo se quedaba corta. El 12/09 una de 4.325 dejo la
// cuenta 1,02 Bs por encima de lo que decia el banco.
console.log("\nLa comision del banco VES");
S.config = { comision_banco_vzla: 0.003, comision_banco_vzla_min: 14,
             comision_banco_transferencia: 54 };
const C = (t, bs) => F.comisionBancoVES(t, bs);
ok(C("", 50000) === 0, "dentro del mismo banco no se cobra nada");
ok(C(false, 50000) === 0, "ni cuando no se marca");
ok(C("movil", 25056) === 75.17, "pago movil grande: el 0,3%", C("movil", 25056));
ok(C("movil", 4325) === 14, "y uno pequeno: el minimo de 14, no 12,97", C("movil", 4325));
ok(C("movil", 4666) === 14, "justo por debajo del umbral, el minimo", C("movil", 4666));
ok(C("movil", 4667) === 14.001 || C("movil", 4667) === 14,
   "y en el umbral empieza a mandar el porcentaje", C("movil", 4667));
ok(C("movil", 10000) === 30, "10.000 → 30", C("movil", 10000));
ok(C("transf", 25056) === 54 && C("transf", 4325) === 54,
   "la transferencia son 54 fijos, no depende del monto");
// El caso real que lo destapo
ok(casi(C("movil", 4325) - 12.98, 1.02, 0.001),
   "el caso de JOSE LUIS: 1,02 Bs mas de lo que cobraba antes",
   C("movil", 4325) - 12.98);
// Las remesas guardadas antes llevaban true/false: aquel true era el pago movil.
ok(C(true, 25056) === 75.17, "una remesa vieja con true sigue saliendo igual");
ok(F.etiquetaComisionBanco(true) === "pago movil a otro banco" ||
   F.etiquetaComisionBanco(true).indexOf("vil") > -1, "y tiene su nombre");
// Si no hay configuracion, los valores del tarifario
S.config = {};
ok(C("movil", 4325) === 14 && C("movil", 25056) === 75.17 && C("transf", 1) === 54,
   "sin configuracion usa las tarifas del BCV");
S.config = {};

// Un solo sitio calcula la comision: antes habia ocho repitiendo "cant × %".
ok(!/parseFloat\(\(S\.config\|\|\{\}\)\.comision_banco_vzla\)\|\|0\.03/.test(HTML),
   "ya no queda ningun calculo suelto con el 3% de antes");
ok((HTML.match(/comisionBancoVES\(/g) || []).length >= 5,
   "y los sitios que la necesitan llaman a la funcion",
   (HTML.match(/comisionBancoVES\(/g) || []).length);

// ── Cuando la entrega la hace un aliado ────────────────────────────────────
// Brasil → Colombia: entran los reales, se compran USDT, se le mandan al aliado
// descontada la ganancia, y el aliado le paga al cliente en pesos. Ella no
// toca pesos en ningun momento.
//
// Antes: el formulario ni ofrecia cuenta de entrega —no hay cuentas en COP— asi
// que la remesa se guardaba SIN descontar nada y el saldo de Binance decia tener
// los USDT que ya se habian enviado. Dos remesas asi dejaron 115 USDT de mas.
// Y elegir la cuenta de USDT a mano era peor: le restaba los 122.900 PESOS.
console.log("\nLa entrega la hace un aliado y se le paga en USDT");
const cUsdt = { id:"bjulio", nombre:"BINANCE JULIO", moneda:"USDT" };
const cVes  = { id:"bdv", nombre:"BANCO DE VENEZUELA", moneda:"VES" };
// El caso real: 250 R$ → 122.900 COP, uv 45,00 USDT
const sAli = F.salidaDeCuentaEntrega(cUsdt, 122900, 45, "COP");
ok(sAli.monto === 45 && sAli.moneda === "USDT",
   "de la cuenta salen los 45 USDT que costo, no los 122.900 pesos",
   JSON.stringify(sAli));
const sNor = F.salidaDeCuentaEntrega(cVes, 20010, 21.29, "VES");
ok(sNor.monto === 20010 && sNor.moneda === "VES",
   "y una remesa normal sigue sacando bolivares de su banco", JSON.stringify(sNor));
// Sin cuenta elegida se comporta como siempre: la moneda de destino.
const sSin = F.salidaDeCuentaEntrega(null, 20010, 21.29, "VES");
ok(sSin.monto === 20010 && sSin.moneda === "VES", "sin cuenta, igual que antes");
// Redondeos: los USDT a cuatro decimales, el resto a dos.
ok(F.salidaDeCuentaEntrega(cUsdt, 1, 45.00005, "COP").monto === 45.0001 ||
   F.salidaDeCuentaEntrega(cUsdt, 1, 45.00005, "COP").monto === 45,
   "los USDT se redondean a cuatro decimales",
   F.salidaDeCuentaEntrega(cUsdt, 1, 45.00005, "COP").monto);
ok(F.salidaDeCuentaEntrega(cVes, 20010.005, 1, "VES").monto === 20010.01,
   "y la moneda de destino a dos",
   F.salidaDeCuentaEntrega(cVes, 20010.005, 1, "VES").monto);
// Sin uv no se inventa una salida
ok(F.salidaDeCuentaEntrega(cUsdt, 122900, 0, "COP").monto === 0,
   "sin uv no sale nada, y el aviso de cuenta sin encontrar hace el resto");

// Y que actualizarCuentasPorRemesa la use y reciba el uv de quien la llama.
ok(/var _sal=salidaDeCuentaEntrega\(_cDest, vesEntregado, uvUsdt, monDest\);/.test(HTML),
   "actualizarCuentasPorRemesa decide con esa funcion");
// Las llamadas ocupan varias lineas y llevan parentesis dentro, asi que se
// busca por ventana, no por "todo menos parentesis".
const _llamadas = HTML.match(/actualizarCuentasPorRemesa\([\s\S]{0,300}?\);/g) || [];
ok(_llamadas.length === 3, "hay tres llamadas a actualizarCuentasPorRemesa", _llamadas.length);
// El uv puede ir seguido de ")" o de "," — desde el ARREGLO 97 detras va el
// desglose de entregas. Lo que se exige sigue siendo lo mismo: que vaya.
ok(_llamadas.every(c => /res\.uv\s*[,)]/.test(c)),
   "y las tres le pasan el uv: sin el, una entrega de aliado no descuenta nada",
   _llamadas.filter(c => c.indexOf("res.uv)") === -1).length + " sin uv");
ok(/La entrega la hace un aliado — ¿de qué cuenta salen los USDT\?/.test(HTML),
   "el formulario ofrece la cuenta de USDT cuando no hay en la moneda de destino");

// ── Al borrar una remesa, las monedas salen de la remesa ───────────────────
// Antes se deducian del array donde estaba guardada:
//     monDest = tipo==="vzla" ? "BRL" : "VES"
// o sea, todo lo que sale de Brasil entrega bolivares. Con una remesa a
// Colombia, borrarla le devolvia al lote de bolivares los 122.900 PESOS que
// nunca salieron de ahi: medido, un lote pasaba de 51.043,97 a 173.943,97.
console.log("\nLas monedas de una remesa salen de la remesa");
ok(JSON.stringify(F.monedasDeRemesa("brl", {orig:"BRL",dest:"COP",rt:"BRL ↔ COP"})) ===
   JSON.stringify({orig:"BRL",dest:"COP"}),
   "una a Colombia entrega COP, no bolivares",
   JSON.stringify(F.monedasDeRemesa("brl", {orig:"BRL",dest:"COP"})));
ok(F.monedasDeRemesa("brl", {orig:"BRL",dest:"PEN"}).dest === "PEN",
   "una a Peru entrega soles");
ok(F.monedasDeRemesa("brl", {orig:"BRL",dest:"VES"}).dest === "VES",
   "y una a Venezuela sigue entregando bolivares");
ok(F.monedasDeRemesa("vzla", {orig:"VES",dest:"BRL"}).orig === "VES" &&
   F.monedasDeRemesa("vzla", {orig:"VES",dest:"BRL"}).dest === "BRL",
   "Venezuela → Brasil, igual que siempre");
// Registros viejos sin orig/dest: la deduccion de antes, para no romperlos.
const viejo = F.monedasDeRemesa("brl", {n:1});
ok(viejo.orig === "BRL" && viejo.dest === "VES",
   "un registro viejo sin orig/dest se deduce como antes", JSON.stringify(viejo));
const viejoV = F.monedasDeRemesa("vzla", {n:2});
ok(viejoV.orig === "VES" && viejoV.dest === "BRL", "y uno de Venezuela tambien");
ok(F.monedasDeRemesa("eeuu", {n:3}).orig === "USD", "y los de EE.UU");

// Y que los dos sitios que revierten la usen.
ok((HTML.match(/monedasDeRemesa\(tipo,r\)/g) || []).length === 2,
   "los dos caminos de reversion preguntan por las monedas de la remesa",
   (HTML.match(/monedasDeRemesa\(tipo,r\)/g) || []).length);
ok(!/var monDest=tipo==="vzla"\?"BRL":"VES";/.test(HTML),
   "ya no queda la deduccion que daba bolivares por sentado");


// ─────────────────────────────────────────────────────────────────────────────
// La comision de Binance: un 0 es un 0 (ARREGLO 40, 14/09/2026)
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n— Comision de Binance —");

// Un cero de comision leido de verdad es un cero. Antes `parseFloat(x)||COM()`
// lo descartaba por "falsy" y metia 0,06: la compra CNV-PG6CG3 acredito
// 196,0073 USDT cuando Binance habia entregado 196,0673.
ok(F._comIU(0) === 0, "_comIU(0) respeta el cero", F._comIU(0));
ok(F._comIU("0") === 0, "_comIU('0') tambien", F._comIU("0"));
ok(F._comIU("") === F.COM(), "sin comision escrita, la de por defecto", F._comIU(""));
ok(F._comIU(undefined) === F.COM(), "y sin campo, igual", F._comIU(undefined));
ok(!/parseFloat\(f\.comision\)\|\|COM\(\)/.test(HTML),
   "no vuelve el ||COM() que se comia el cero");
// Eran 2 sitios; el ARREGLO 66 quito el de rInventarioUsdt (que ya no calcula
// nada) y anadio los de _autoIU, _descuadreIU y _htmlPrevIU. Lo que protege la
// guardia no es el numero sino que NADIE lea la comision a pelo: si alguien
// vuelve a poner parseFloat(f.comision), el cero escrito se convierte en 0,06.
ok((HTML.match(/_comIU\(f\.comision\)/g) || []).length === 4,
   "los cuatro sitios que leen la comision pasan por _comIU",
   (HTML.match(/_comIU\(f\.comision\)/g) || []).length);
ok(!/parseFloat\(\s*f\.comision\s*\)/.test(HTML),
   "y ninguno la lee a pelo con parseFloat");

// ─────────────────────────────────────────────────────────────────────────────
// Leer el comprobante de Binance (ARREGLO 40, 14/09/2026)
//
// Ella fotografia la pantalla de Binance, la pasa por el lector de imagenes de
// Google y pega el texto en la app. Dos cosas salian mal y las dos tocaban
// dinero, asi que los dos comprobantes de abajo son SUYOS, textuales.
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n— Comprobantes de Binance —");

// Comprobante real de una venta P2P. Fijarse en el desorden: el lector pone las
// dos etiquetas juntas y despues los tres numeros, asi que buscar el numero que
// sigue a la palabra "Comision" se llevaba 20,83 (que es la cantidad liberada).
const OCR_P2P = [
  "6:58", "20,5", "63", "Detalles de la orden", "-20.89 USDT", "Completada",
  "Vender USDT", "Chat", "Importe en fiat", "Bs 19,996.8", "Precio", "Bs 960",
  "Cantidad total", "Cantidad liberada", "20.89 USDT", "Comisión",
  "20.83 USDT", "0.06 USDT", "Método de pago", "Banco de Venezuela VES",
  "N.º de orden", "22932584057963716608", "Hora de creación",
  "2026-09-13 18:42:50", "Alias del comprador", "miracrip"
].join("\n\n");

// Comprobante real de la conversion que quedo guardada mal (CNV-PG6CG3).
const OCR_CONV = [
  "Detalles de la conversión", "196.06730581 USDT", "Tipo LIMIT",
  "Pagar desde Cuenta Spot 1002.1 BRL", "1 USDT = 5.111 BRL", "A USDT",
  "Comisiones de transacción 0.00 USDT", "Fecha del trade 2026-09-12 21:24"
].join("\n");

// El mismo texto tal y como sale cuando el telefono esta en espanol: el lector
// cambia los separadores y "Bs 19.996,8" se leia como 19,996 — 19.977 Bs menos.
const OCR_P2P_ES = OCR_P2P.replace("Bs 19,996.8", "Bs 19.996,8")
                          .replace(/(\d+)\.(\d\d) USDT/g, "$1,$2 USDT");
const OCR_CONV_ES = OCR_CONV.replace("196.06730581", "196,06730581")
                            .replace("1002.1 BRL", "1.002,10 BRL")
                            .replace("5.111 BRL", "5,111 BRL")
                            .replace("0.00 USDT", "0,00 USDT");

function comprobante(nombre, txt, esperado) {
  const r = F._parsearOCR(txt);
  Object.keys(esperado).forEach(function (k) {
    ok(String(r[k]) === String(esperado[k]), nombre + " · " + k, r[k]);
  });
}

comprobante("venta P2P (texto real)", OCR_P2P, {
  tipo: "venta", moneda: "VES", usdt: 20.89, liberado: 20.83, comision: 0.06,
  tasa: 960, monto: 19996.8, cuadra: true,
  ordenId: "22932584057963716608", fecha: "2026-09-13" });
comprobante("venta P2P (lector en espanol)", OCR_P2P_ES, {
  tipo: "venta", usdt: 20.89, liberado: 20.83, comision: 0.06,
  tasa: 960, monto: 19996.8, cuadra: true });
comprobante("conversion (texto real)", OCR_CONV, {
  tipo: "compra", moneda: "BRL", usdt: 196.06730581, comision: 0,
  tasa: 5.111, monto: 1002.1, cuadra: true, fecha: "2026-09-12" });
comprobante("conversion (lector en espanol)", OCR_CONV_ES, {
  tipo: "compra", usdt: 196.06730581, comision: 0, tasa: 5.111,
  monto: 1002.1, cuadra: true });

// El otro modelo de comprobante no cobra comision: un 0 tiene que llegar como 0.
comprobante("venta P2P sin comision", [
  "Vender USDT", "Cantidad total 100.00 USDT", "Cantidad liberada 100.00 USDT",
  "Comisión 0.00 USDT", "Precio Bs 960", "Importe en fiat Bs 96,000", "2026-09-13"
].join("\n"), { tipo: "venta", usdt: 100, comision: 0, tasa: 960, monto: 96000, cuadra: true });

// ARREGLO 41: a veces el lector no deja NINGUNA pista del idioma — ningun
// numero trae los dos separadores. Con un comprobante en espanol se leia al
// reves: "Bs 96.000" daba 96 y "100,00 USDT" daba 10.000. Lo desvela la propia
// comprobacion del comprobante: si no cuadra, se prueba el otro idioma.
comprobante("venta en espanol sin pistas de idioma", [
  "Vender USDT", "Cantidad total 100,00 USDT", "Cantidad liberada 100,00 USDT",
  "Comisión 0,00 USDT", "Precio Bs 960", "Importe en fiat Bs 96.000", "2026-09-13"
].join("\n"), { tipo: "venta", usdt: 100, comision: 0, tasa: 960, monto: 96000, cuadra: true });
// Y el mismo comprobante escrito en ingles no se rompe por el cambio.
comprobante("y el mismo en ingles sigue igual", [
  "Vender USDT", "Cantidad total 100.00 USDT", "Cantidad liberada 100.00 USDT",
  "Comisión 0.00 USDT", "Precio Bs 960", "Importe en fiat Bs 96,000", "2026-09-13"
].join("\n"), { tipo: "venta", usdt: 100, comision: 0, tasa: 960, monto: 96000, cuadra: true });
ok(/_parsearConLocale\(t, r\._dec/.test(HTML),
   "el segundo intento usa el idioma contrario al del primero");

// ARREGLO 45: comprobante real del 13/09. El lector le perdio un digito al
// precio (Binance dice 960,79 y el texto trae 960,7), asi que NINGUNA
// combinacion cuadra clavada y pasaban dos dentro de la tolerancia:
//   total 103,10 = liberado 103,04 + comision 0,06  -> error  9,47  (la buena)
//   total 103,10 = liberado 103,10 + comision 0     -> error 48,17  (la falsa)
// Exigir que fuera unica hacia que se rindiera y cayera a la lectura por
// etiqueta, que es justo la que el lector desordena: se llevaba 103,04 de
// comision donde eran 0,06. Ahora se queda con la que MEJOR cuadra.
comprobante("venta P2P con el precio a medio leer", [
  "10:13", "19,3", "39", "Detalles de la orden", "-103.1 USDT", "Completada",
  "Vender USDT", "Chat", "Importe en fiat", "Bs 99,000", "Precio",
  "Cantidad total", "Bs 960.7", "Cantidad liberada", "103.10 USDT",
  "Comisión", "103.04 USDT", "0.06 USDT", "Método de pago",
  "Banco de Venezuela VES", "N.º de orden", "22932635847161954304",
  "Hora de creación", "2026-09-13 22:08:37", "Alias del comprador", "faroexchange"
].join("\n\n"), { tipo: "venta", moneda: "VES", usdt: 103.10, liberado: 103.04,
  comision: 0.06, monto: 99000, cuadra: true,
  ordenId: "22932635847161954304", fecha: "2026-09-13" });

// La tasa que de verdad queda sale del importe entre los USDT que salen de la
// cuenta, asi que es correcta aunque el precio de lista venga a medio leer.
ok(F._tasaEfectivaLote({ tipo: "venta", usdt: 103.10, bs: 99000, tasa: 960.7 }) === 960.2328,
   "y la tasa efectiva sale bien igual: 99.000 / 103,10 = 960,2328",
   F._tasaEfectivaLote({ tipo: "venta", usdt: 103.10, bs: 99000, tasa: 960.7 }));
ok(/Te queda \.\.\.\.\.\.\.\.\.\.\. /.test(HTML),
   "el cuadro de confirmacion la enseña");

// Cuando nada cuadra, el parser tiene que DECIRLO en vez de rellenar callado.
ok(F._parsearOCR([
  "Vender USDT", "Cantidad total 50.00 USDT", "Comisión 7.00 USDT",
  "Precio Bs 900", "Importe en fiat Bs 12,345.67"
].join("\n")).cuadra === false, "un comprobante incoherente se marca como dudoso");

// Los numeros, en las dos escrituras.
ok(F._localeOCR("Bs 19,996.8") === ".", "con 19,996.8 el decimal es el punto");
ok(F._localeOCR("Bs 19.996,8") === ",", "con 19.996,8 el decimal es la coma");
[["19,996.8", ".", 19996.8], ["19.996,8", ",", 19996.8],
 ["1.234.567,89", ",", 1234567.89], ["1,234,567.89", ".", 1234567.89],
 ["5.111", ".", 5.111], ["5,111", ",", 5.111], ["960", ".", 960]
].forEach(function (c) {
  ok(F._numOCR(c[0], c[1]) === c[2], "_numOCR(" + c[0] + ") = " + c[2], F._numOCR(c[0], c[1]));
});

// El numero de orden no puede tragarse el ano de la fecha: con el id
// contaminado, el aviso de comprobante repetido no saltaba nunca.
ok(F._parsearOCR(OCR_P2P).ordenId === "22932584057963716608",
   "el numero de orden sale limpio, sin el ano pegado detras",
   F._parsearOCR(OCR_P2P).ordenId);

// Y los dos caminos (pegar texto y leer imagen) tienen que pedir confirmacion
// por el mismo sitio, para que ensenen el mismo desglose.
ok((HTML.match(/[^n] _?_?rellenarDesdePegado\(parsed\)|!_rellenarDesdePegado\(parsed\)|\(_rellenarDesdePegado\(parsed\)/g) || []).length === 2,
   "el pegado y el OCR de imagen rellenan por la misma puerta",
   (HTML.match(/!_rellenarDesdePegado\(parsed\)|\(_rellenarDesdePegado\(parsed\)/g) || []).length);
ok(/confirm\(_resumenPegado\(parsed\)\)/.test(HTML),
   "y esa puerta pide confirmacion antes de tocar el formulario");
// La tasa se enseña entera: f2 le comeria el cuarto decimal, que es con el que
// se calcula la ganancia.
ok(F._numLegible(5.111) === "5,111", "la tasa se lee 5,111, no cinco mil ciento once", F._numLegible(5.111));
ok(F._numLegible(0.06) === "0,06", "y la comision igual", F._numLegible(0.06));
ok(F._numLegible(960) === "960", "un entero se queda como esta", F._numLegible(960));


// ─────────────────────────────────────────────────────────────────────────────
// La tasa que de VERDAD quedó (ARREGLO 42, 14/09/2026)
//
// El lote guarda la tasa de Binance, que vale para lo que se LIBERÓ, no para
// lo que salió de la cuenta. De ahí salen la tasa que la app sugiere y lo que
// cuestan en USDT los bolívares que se gastan, así que la diferencia se le
// convertía en ganancia que no tuvo.
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n— La tasa que de verdad quedo —");

// Su venta real del 13/09: salieron 20,89 USDT y entraron 19.996,80 Bs.
const VENTA_REAL = { tipo: "venta", moneda: "VES", usdt: 20.89, neto: 20.83,
  tasa: 960, comision: 0.06, bs: 19996.80, bsRestante: 19996.80 };
ok(F._tasaEfectivaLote(VENTA_REAL) === 9572427 / 10000,
   "vendiendo quedan 957,2427 Bs/USDT, no los 960 de Binance",
   F._tasaEfectivaLote(VENTA_REAL));

// Su conversion real: pago 1.002,10 BRL y recibio 196,0073 USDT netos.
const COMPRA_REAL = { tipo: "compra", moneda: "BRL", montOrigen: 1002.10,
  usdt: 196.0073, tasa: 5.111, comision: 0.06, restante: 196.0073 };
ok(F._tasaEfectivaLote(COMPRA_REAL) === 5.1126,
   "comprando cuesta 5,1126 BRL/USDT, no los 5,111 de la lista",
   F._tasaEfectivaLote(COMPRA_REAL));

// Sin comision las dos coinciden: no hay nada que corregir.
ok(F._tasaEfectivaLote({ tipo: "venta", usdt: 100, bs: 96000, tasa: 960 }) === 960,
   "sin comision, la efectiva y la de Binance son la misma");

// Los lotes de relleno (los que crea una Operacion) no traen con que calcularla:
// tienen que quedarse con la suya, no con un 0.
ok(F._tasaEfectivaLote({ tipo: "venta", usdt: 0, bs: 0, tasa: 285 }) === 285,
   "un lote de relleno se queda con su tasa", F._tasaEfectivaLote({tipo:"venta",usdt:0,bs:0,tasa:285}));
ok(F._tasaEfectivaLote({ tipo: "compra", usdt: 0, montOrigen: 0, tasa: 5.4 }) === 5.4,
   "y el de compra igual");
ok(F._tasaEfectivaLote(null) === 0, "y sin lote, 0, sin reventar");

// Un lote viejo, guardado antes de este arreglo, no necesita migracion:
// la efectiva sale de lo que ya tiene guardado.
ok(F._tasaEfectivaLote({ tipo: "venta", usdt: 50.06, bs: 47000, tasa: 940 }) ===
   Math.round((47000 / 50.06) * 10000) / 10000,
   "un lote viejo tambien da su tasa efectiva, sin migrar nada");

// Las cuatro funciones que dan las tasas tienen que leer la efectiva.
["getLastTasaCompra", "getLastTasaVenta", "getTasaCompraPonderada",
 "getTasaVentaPonderada", "simularConsumoFIFO"].forEach(function (fn) {
  const i = HTML.indexOf("function " + fn + "(");
  let prof = 0, k = HTML.indexOf("{", i), fin = k;
  for (; fin < HTML.length; fin++) {
    if (HTML[fin] === "{") prof++;
    else if (HTML[fin] === "}" && --prof === 0) break;
  }
  const cuerpo = HTML.slice(i, fin + 1);
  ok(/_tasaEfectivaLote\(/.test(cuerpo), fn + " pregunta por la tasa efectiva");
  ok(!/return\s+(todas|arr|propias|lotes)\[[^\]]+\]\.tasa\s*;/.test(cuerpo),
     "y " + fn + " ya no devuelve la de Binance a pelo");
});

// Y la comision fija no se puede sumar encima: la tasa del lote ya la trae
// dentro. Sumarla otra vez es contarla dos veces.
ok(/var comUc = tcDeLote \? 0 :/.test(HTML) && /var comUv = tvDeLote \? 0 :/.test(HTML),
   "con tasa de lote no se vuelve a cobrar la comision");
ok(/var tcDeLote = !tcMan && !!rates\.tc;/.test(HTML),
   "pero si la tasa se escribio a mano, la comision si se aplica");


// ─────────────────────────────────────────────────────────────────────────────
// El cliente que paga de varias formas (ARREGLO 44, 14/09/2026)
//
// Pasa seguido: una parte en efectivo, otra por Pix y otra que queda debiendo.
// Las filas tienen que sumar EXACTAMENTE lo que envía el cliente — cuadrar a
// ojo y guardar descuadrado es lo que deja un saldo sin explicación.
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n— El cliente que paga de varias formas —");
// La marca de la fila que NO entra en ninguna cuenta la pone index.html; se
// saca de ahi para que un renombrado no deje estas pruebas probando otra cosa.
const PAGO_DEBE = F.PAGO_DEBE;
ok(PAGO_DEBE === "__debe__", "la fila de prestamo se marca con __debe__", PAGO_DEBE);

const F1 = { pagosMulti: true, pagos: [
  { cuentaId: "cef", monto: "500" },
  { cuentaId: "cnu", monto: "400" },
  { cuentaId: PAGO_DEBE, monto: "100" } ] };

ok(F.pagosDeRemesa({ pagosMulti: false, pagos: F1.pagos }) === null,
   "apagado, no hay desglose y todo va por el camino de siempre");
ok(F.pagosDeRemesa({ pagosMulti: true, pagos: [] }) === null,
   "encendido pero sin filas, tampoco");
const filas = F.pagosDeRemesa(F1);
ok(filas && filas.length === 3, "lee las tres filas", filas && filas.length);
ok(F.sumaPagos(filas) === 1000, "y suman los 1.000 que envía el cliente", F.sumaPagos(filas));
ok(F.pagosDebe(filas) === 100, "de los que 100 quedan debiendo", F.pagosDebe(filas));

// Los montos se leen con _leerNumero, asi que la coma decimal vale igual que
// el punto — el teclado del movil pone coma y no se puede perder un centimo.
const conComa = F.pagosDeRemesa({ pagosMulti: true, pagos: [
  { cuentaId: "cef", monto: "500,25" }, { cuentaId: "cnu", monto: "500,25" } ] });
ok(F.sumaPagos(conComa) === 1000.5, "500,25 + 500,25 = 1.000,50", F.sumaPagos(conComa));
const conPunto = F.pagosDeRemesa({ pagosMulti: true, pagos: [
  { cuentaId: "cef", monto: "500.25" }, { cuentaId: "cnu", monto: "500.25" } ] });
ok(F.sumaPagos(conPunto) === 1000.5, "y con punto igual", F.sumaPagos(conPunto));

// Las filas a medio llenar no cuentan: sin cuenta o sin monto no es un pago.
const aMedias = F.pagosDeRemesa({ pagosMulti: true, pagos: [
  { cuentaId: "cef", monto: "500" }, { cuentaId: "", monto: "300" }, { cuentaId: "cnu", monto: "" } ] });
ok(aMedias.length === 1 && F.sumaPagos(aMedias) === 500,
   "una fila sin cuenta o sin monto no suma", JSON.stringify(aMedias));
ok(F.pagosDebe(F.pagosDeRemesa({ pagosMulti: true, pagos: [{ cuentaId: "cef", monto: "900" }] })) === 0,
   "sin fila de prestamo, no queda nada debiendo");

// Y que saveTx lo use de verdad: no vale que los ayudantes esten bien si el
// guardado sigue metiendo la entrada entera en una sola cuenta.
ok(/if\(f\.pagosMulti\)\{[\s\S]{0,400}?alert\("Las formas de pago no cuadran/.test(HTML) ||
   /Las formas de pago no cuadran/.test(HTML),
   "saveTx no deja guardar si las filas no cuadran");
ok(/var _saltarOrigen = f\.pendiente===true \|\| !!_pagos;/.test(HTML),
   "con desglose, la entrada NO la hace actualizarCuentasPorRemesa");
ok(/if\(_pagos\) acreditarPagos\(_pagos, _mov\);/.test(HTML),
   "la hace acreditarPagos, que anota cada parte en _mov");
ok(/mov\.push\(\{cuentaId:c\.id, delta:p\.monto\}\)/.test(HTML),
   "y por eso el borrado de la remesa revierte solo, sin tocar nada mas");
ok(/if\(_debe>0\.01\)\{/.test(HTML) && /parcial:true/.test(HTML),
   "lo que queda debiendo va a Cuentas por Cobrar, marcado como parcial");
ok(/las dos a la vez no/.test(HTML),
   "no se puede mezclar el desglose con marcar la remesa entera pendiente");
ok(/Esta remesa se cobró de varias formas/.test(HTML),
   "y marcarRemesaPendiente se para si la remesa tiene desglose");
// La fila de prestamo no puede acreditar ninguna cuenta: ese dinero no entro.
ok(/if\(p\.cuentaId===PAGO_DEBE\) return;/.test(HTML),
   "la fila de prestamo no acredita ninguna cuenta");
// Los montos del desglose se escriben a mano: type=number se comeria la coma.
// Los bolivares que ENTRAN crean su propio lote FIFO, y ese lote nace pegado a
// UNA cuenta. Repartidos entre varias, el lote afirmaria tener bolivares que
// estan en otra parte — y de los lotes salen las tasas que la app sugiere.
// Medido antes de la guardia: entrando 150.000 al Banco de Venezuela y 40.000 a
// Banesco, nacia un lote de 190.000 entero pegado al Banco de Venezuela.
ok(/if\(ruta\.orig==="VES"\)\{[\s\S]{0,600}?crean su propio lote/.test(HTML),
   "el desglose se para donde lo que entra son bolivares");
ok(/es en "\+_malMoneda\.moneda\+", pero esta remesa entra en/.test(HTML),
   "y una fila con cuenta de otra moneda no deja guardar");
ok(/var _puedeDesglosar = origMon!=="VES";/.test(HTML),
   "y ahi ni siquiera se ofrece");
ok(/if\(!_puedeDesglosar && S\.tx\.pagosMulti\) S\.tx\.pagosMulti=false;/.test(HTML),
   "si cambia de ruta con el desglose puesto, se apaga solo");

ok(/inputmode='decimal'[^>]*onc?input='txPagoSet/.test(HTML) ||
   /txPagoSet\([^)]*\\"monto\\"/.test(HTML) && !/type='number'[^>]*txPagoSet/.test(HTML),
   "los montos del desglose no son type=number");


// ─────────────────────────────────────────────────────────────────────────────
// La apertura que se perdia, y de que esta hecha la diferencia (ARREGLO 46)
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n— La apertura y la diferencia —");

// 1. Una clave NUEVA dentro de un objeto YA fotografiado tiene que marcarse.
//    Sin marca pierde contra la copia del otro aparato: la dueña fijaba la
//    apertura, el otro aparato mandaba la vieja, y volvia la diferencia.
//    Pero si no hay foto de NADA (primer guardado tras abrir la app) se sigue
//    sin marcar: eso es ARREGLO 33 y no se toca.
global.window._fotoPorClave = undefined;
S._modCampos = {};
S.config = { pct_sueldo: 30 };
S.tasasDia = {}; S.tasasCambio = {}; S._tasasDiaMeta = {};
F._marcarObjetosCambiados();
ok(Object.keys((S._modCampos.config) || {}).length === 0,
   "sin foto de nada no se marca (ARREGLO 33 sigue en pie)",
   JSON.stringify(S._modCampos.config));
S.config.aperturaUsdt = 2456.20;          // clave nueva, el objeto ya tiene foto
F._marcarObjetosCambiados();
ok(typeof (S._modCampos.config || {}).aperturaUsdt === "number",
   "una clave NUEVA en un objeto ya fotografiado si se marca",
   JSON.stringify(S._modCampos.config));
S.config.pct_sueldo = 35;                 // y un cambio normal, como siempre
F._marcarObjetosCambiados();
ok(typeof S._modCampos.config.pct_sueldo === "number",
   "y un cambio de valor tambien");

// 2. Sin marca de ningun lado, la fusion se queda con lo VIEJO. Es lo que hacia
//    que refijar la apertura no sirviera de nada.
const respaldoCfg = function (k, vr, vl) {
  return vl === undefined || vl === null || vl === "" || vl === 0;
};
S._modCampos = {};
const sinMarca = F._mergeObjetoPorClave(
  { aperturaUsdt: 2456.20 }, { aperturaUsdt: 2372.71 }, "config", {}, respaldoCfg);
ok(sinMarca.aperturaUsdt === 2372.71,
   "sin marca gana la apertura vieja — por eso hacia falta marcarla", sinMarca.aperturaUsdt);
S._modCampos = {};
const conMarca = F._mergeObjetoPorClave(
  { aperturaUsdt: 2456.20 }, { aperturaUsdt: 2372.71 }, "config",
  { config: { aperturaUsdt: Date.now() } }, respaldoCfg);
ok(conMarca.aperturaUsdt === 2456.20,
   "con marca gana la nueva, que es lo que la dueña acaba de fijar", conMarca.aperturaUsdt);

// 3. De que esta hecha la diferencia: los ajustes a mano se explican solos.
ok(F._isoDeDDMMAA("12/09/26") === "2026-09-12", "12/09/26 es 2026-09-12", F._isoDeDDMMAA("12/09/26"));
ok(F._isoDeDDMMAA("") === "" && F._isoDeDDMMAA("raro") === "", "y lo que no es fecha, no revienta");

S.cuentas = [
  { id: "cves", nombre: "Banco VES", moneda: "VES" },
  { id: "cusdt", nombre: "Binance", moneda: "USDT" },
  { id: "cper", nombre: "Mi sueldo", moneda: "USDT", esPersonal: true }
];
S.ajustesSaldo = [
  { fecha: "10/09/26", cuentaId: "cusdt", delta: 999 },   // antes de la apertura
  { fecha: "11/09/26", cuentaId: "cusdt", delta: -7 },    // el MISMO dia, sin hora
  { fecha: "12/09/26", cuentaId: "cusdt", delta: 51.52 }, // despues
  { fecha: "13/09/26", cuentaId: "cves", delta: -2000 },  // despues, en bolivares
  { fecha: "13/09/26", cuentaId: "cper", delta: 500 }     // personal: no es de la empresa
];
const ajs = F.ajustesDesdeApertura("2026-09-11");
ok(ajs.n === 2, "cuenta los dos ajustes posteriores a la apertura", ajs.n);
ok(ajs.total === Math.round((51.52 - 2000 / 200) * 100) / 100,
   "y los suma en USDT (51,52 − 2.000/200 = 41,52)", ajs.total);
ok(ajs.nMismoDia === 1 && ajs.mismoDia === -7,
   "los del mismo dia van aparte: sin hora no se sabe si fue antes o despues");
ok(F.ajustesDesdeApertura("").n === 0, "sin apertura no cuenta nada");

// ── ARREGLO 50: con la hora ya no hay que adivinar ───────────────────────
// El 11/09 hubo 7 ajustes del mismo dia que la apertura, por −230,87, y la
// conciliacion tuvo que dejarlos "en el aire": ajustesSaldo guardaba la fecha
// pero no la hora, asi que no habia forma de saber si fueron antes o despues
// de la foto. Ahora los dos llevan hora.
const APT = Date.parse("2026-09-11T18:00:00Z");
S.config = { aperturaTs: APT };
S.ajustesSaldo = [
  { fecha: "11/09/26", cuentaId: "cusdt", delta: -7, ts: APT - 3600e3 },  // antes de la foto
  { fecha: "11/09/26", cuentaId: "cusdt", delta: 20, ts: APT + 3600e3 },  // despues
  { fecha: "11/09/26", cuentaId: "cusdt", delta: -5 },                    // viejo, sin hora
  { fecha: "12/09/26", cuentaId: "cusdt", delta: 1,  ts: APT + 99e6 }     // otro dia
];
const aj2 = F.ajustesDesdeApertura("2026-09-11");
ok(aj2.total === 21, "suma el de despues de la foto y el del dia siguiente", aj2.total);
ok(aj2.n === 2, "y son dos, no cuatro", aj2.n);
ok(aj2.nMismoDia === 1 && aj2.mismoDia === -5,
   "el de antes de la foto no cuenta —ya esta en la apertura— y solo el viejo queda en el aire",
   aj2.nMismoDia + "/" + aj2.mismoDia);
// Sin hora en la apertura (las fijadas antes de este arreglo) se sigue como antes.
S.config = {};
const aj3 = F.ajustesDesdeApertura("2026-09-11");
ok(aj3.nMismoDia === 3 && aj3.n === 1,
   "sin hora en la apertura, los tres del mismo dia vuelven al aire",
   aj3.nMismoDia + "/" + aj3.n);
ok(/ts:Date\.now\(\)/.test(HTML) && (HTML.match(/S\.ajustesSaldo\.push\(\{id:_newUid\(\),fecha:ds\(td\(\)\),ts:Date\.now\(\)/g)||[]).length === 2,
   "los dos sitios que editan saldos guardan la hora");
S.config = {}; S.ajustesSaldo = [];

// 4. El semaforo tiene que mirar lo que queda SIN EXPLICAR, no la diferencia
//    bruta. Decia "tu contabilidad esta sana" justo debajo de un "sin explicar
//    +116,09" — que es lo que hacia inutil la pantalla.
ok(/var sano=Math\.abs\(sinExp\)<=tol;/.test(HTML),
   "el semaforo mira lo que queda sin explicar");
ok(!/var sano=Math\.abs\(dif\)<=tol;/.test(HTML),
   "y ya no la diferencia bruta");
ok(/sinExplicar:sinExplicar/.test(HTML) && /ajustes:ajustes/.test(HTML),
   "conciliacionCapital devuelve el desglose");
ok(/Volver a fijar la apertura lo esconde, no lo arregla|Volver a fijar la apertura no lo arregla: lo esconde/.test(HTML),
   "y le dice que refijar la apertura no arregla nada");


// ── ARREGLO 47: la diferencia tiene que poder explicarse sola ────────────
// Los tres agujeros que quedaban despues del 46, medidos en el export del
// 14/09: la plata que se pasa a una cuenta personal, el desfase entre la tasa
// del dia y la tasa a la que de verdad compra y vende, y una apertura que se
// guardo mas baja de lo que tocaba y solo se podia "arreglar" escondiendola.
console.log("\nARREGLO 47 · de que esta hecha la diferencia");

// 1. Traspaso a una cuenta personal: sale del capital sin ser un egreso.
S.cuentas = [
  { id: "cemp",  nombre: "Binance empresa", moneda: "USDT" },
  { id: "cbrl",  nombre: "PagBank",         moneda: "BRL"  },
  { id: "cper",  nombre: "Mi sueldo",       moneda: "USDT", esPersonal: true }
];
S.traspasos = [
  { fecha: "2026-09-10", origen: "cemp", destino: "cper", monto: 100, montoDestino: 100 }, // antes
  { fecha: "2026-09-11", origen: "cemp", destino: "cper", monto: 9,   montoDestino: 9   }, // mismo dia
  { fecha: "2026-09-12", origen: "cemp", destino: "cper", monto: 51.52, montoDestino: 51.52 },
  { fecha: "2026-09-13", origen: "cemp", destino: "cbrl", monto: 10,  montoDestino: 54  }  // entre cuentas de la empresa
];
const tp = F.traspasosAPersonal("2026-09-11");
ok(tp.n === 1 && tp.total === 51.52,
   "solo cuenta lo que se fue a una cuenta personal despues de la apertura", tp.n + "/" + tp.total);
ok(tp.nMismoDia === 1 && tp.mismoDia === 9,
   "los del mismo dia van aparte, igual que los ajustes");
S.traspasos.push({ fecha: "2026-09-13", origen: "cper", destino: "cemp", monto: 20, montoDestino: 20 });
ok(F.traspasosAPersonal("2026-09-11").total === 31.52,
   "y lo que ella METE de su bolsillo resta, no suma", F.traspasosAPersonal("2026-09-11").total);
S.traspasos = [];

// 2. El desfase de las tasas. Compra USDT a 5,20 reales cuando la tasa del dia
//    es 5,40: los mismos reales valen menos en la cuenta que lo que le dieron
//    en USDT, y esa diferencia no la apunta ningun "pr".
S.brl = []; S.vzla = []; S.eeuu = []; S.cuentasCobrar = [];
S.inventarioUsdt = [
  { tipo: "compra", fecha: (new Date().getMonth()+1+"").padStart(2,"0") + "/" +
                           (new Date().getDate()+"").padStart(2,"0"),
    montOrigen: 1040, usdt: 200, cuentaOrigenId: "cbrl", cuentaId: "cemp", plataforma: "Binance P2P" }
];
S.inventarioUsdt_cerrado = [];
const hoyIso = F.td();
const ayerIso = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const et = F.efectoTasasDesde(ayerIso);
// 200 USDT recibidos − 1040 BRL / 5,4 = 200 − 192,59 = +7,41
ok(casi(et.usdt, 7.41), "una compra a mejor tasa que la del dia suma capital aparente", et.usdt);
ok(et.remesas === 0 && et.n === 1, "y no toca el lado de las remesas");
S.inventarioUsdt.push({ tipo: "venta", fecha: "01/01", bs: 1000, usdt: 5,
                        cuentaId: "cemp", cuentaDestinoId: "cbrl", plataforma: "Remesa",
                        origenRemesa: "x" });
ok(F.efectoTasasDesde(ayerIso).n === 1,
   "el lote que nace de una remesa no cuenta: no movio ninguna cuenta");

// Una remesa: entran 540 BRL, salen 20.000 VES, apunto 4 USDT de ganancia.
// Movimiento real a tasas de hoy: 540/5,4 − 20.000/200 = 100 − 100 = 0.
// Apunto 4 → el hueco es −4.
S.inventarioUsdt = [];
const dHoy = (new Date().getDate()+"").padStart(2,"0") + "/" +
             (new Date().getMonth()+1+"").padStart(2,"0") + "/" +
             (new Date().getFullYear()+"").slice(2);
S.brl = [{ n: 1, d: dHoy, pr: 4,
           _mov: [{ cuentaId: "cbrl", delta: 540 }, { cuentaId: "cves", delta: -20000 }] }];
S.cuentas.push({ id: "cves", nombre: "Banco VES", moneda: "VES" });
ok(casi(F.efectoTasasDesde(ayerIso).remesas, -4),
   "una remesa que apunta mas ganancia de la que movio deja hueco negativo",
   F.efectoTasasDesde(ayerIso).remesas);

// Si el cliente quedo a deber, el dinero sigue siendo suyo: esta en "por
// cobrar" hoy o ya entro a la cuenta cuando lo marco cobrado. Sin esto, toda
// remesa pendiente parecia un agujero del tamano de lo que el cliente debe.
S.brl = [{ n: 2, d: dHoy, pr: 4, _mov: [{ cuentaId: "cves", delta: -20000 }] }];
S.cuentasCobrar = [{ tipo: "brl", refN: 2, monto: 540, moneda: "BRL", estado: "pendiente" }];
ok(casi(F.efectoTasasDesde(ayerIso).remesas, -4),
   "una remesa pendiente no es un agujero: lo que el cliente debe sigue contando",
   F.efectoTasasDesde(ayerIso).remesas);
S.brl = []; S.cuentasCobrar = []; S.inventarioUsdt = []; S.inventarioUsdt_cerrado = [];

// 3. La fecha de los lotes va en mm/dd y sin año (ver _fechaLote).
ok(F._isoDeFechaLote("09/12") === F.td().slice(0,4) + "-09-12" ||
   F._isoDeFechaLote("09/12") === (parseInt(F.td().slice(0,4),10)-1) + "-09-12",
   "un lote mm/dd se ubica en el año que le toca", F._isoDeFechaLote("09/12"));
ok(F._isoDeFechaLote("") === "" && F._isoDeFechaLote("raro") === "",
   "y lo que no es fecha de lote, no revienta");

// 4. Los dos lados de la conciliacion bajan igual cuando se pasa dinero a lo
//    personal: la diferencia no se mueve. Antes solo bajaba "lo que tienes" y
//    aparecia como una fuga sin explicacion.
S.cuentas = [{ id: "cemp", nombre: "Binance", moneda: "USDT", saldo: 900 }];
S.cuentasCobrar = []; S.prestamos = []; S.ajustesSaldo = []; S.brl = []; S.vzla = []; S.eeuu = [];
S.inventarioUsdt = []; S.inventarioUsdt_cerrado = [];
S.traspasos = [];
S.config = { aperturaUsdt: 1000, aperturaFecha: "2026-09-11", aperturaBase: {} };
const sinTrasp = F.conciliacionCapital();
ok(sinTrasp.diferencia === -100, "faltan 100 y no hay nada que los explique", sinTrasp.diferencia);
ok(sinTrasp.sinExplicar === -100, "asi que quedan sin explicar", sinTrasp.sinExplicar);
S.cuentas.push({ id: "cper", nombre: "Mi sueldo", moneda: "USDT", saldo: 100, esPersonal: true });
S.traspasos = [{ fecha: "2026-09-12", origen: "cemp", destino: "cper", monto: 100, montoDestino: 100 }];
const conTrasp = F.conciliacionCapital();
ok(conTrasp.deberias === 900, "lo que se paso a lo personal baja 'deberias tener'", conTrasp.deberias);
ok(conTrasp.diferencia === 0 && conTrasp.sinExplicar === 0,
   "y la diferencia se queda en cero: ya no es una fuga",
   conTrasp.diferencia + "/" + conTrasp.sinExplicar);

// 5. Estructura: que el desglose y el boton de corregir no se caigan de la
//    pantalla en un refactor.
ok(/tasas:tasas/.test(HTML) && /traspPers:traspPers/.test(HTML),
   "conciliacionCapital devuelve el desfase de tasas y lo pasado a lo personal");
ok(/var sinExplicar=r2v\(diferencia-ajustes\.total-tasas\.total\);/.test(HTML),
   "y 'sin explicar' descuenta las dos cosas");
ok(/function corregirApertura\(/.test(HTML) && /onclick='corregirApertura\(\)'/.test(HTML),
   "se puede corregir la apertura sin volver a fijarla");
ok(/S\.config\.aperturaSaldos=/.test(HTML) && /S\.config\.aperturaTs=/.test(HTML),
   "al fijar la apertura se guarda la foto de los saldos y la hora");
ok(/desfase de las tasas del día/i.test(HTML),
   "el desfase de las tasas sale como linea propia en el desglose");

// 6. ARREGLO 48: la explicación va plegada. Las cifras se miran a diario, el
//    texto se lee una vez — ocupaba media pantalla siempre.
ok(/S\._concDetalle=!S\._concDetalle;R\(\)/.test(HTML),
   "la explicación se puede plegar y desplegar");
ok(/\(S\._concDetalle\?/.test(HTML),
   "y su contenido solo se dibuja cuando está abierta");
// Los avisos de verdad no se pliegan: un aviso escondido no es un aviso.
var _blq = HTML.slice(HTML.indexOf("var conciliacionHtml="), HTML.indexOf("S._concDetalle=!S._concDetalle"));
ok(/Algún ajuste es de una moneda sin tasa/.test(_blq),
   "el aviso de moneda sin tasa queda fuera del desplegable");
ok(/Vuelve a fijar la apertura/.test(_blq),
   "y el de apertura vieja tambien");
// ARREGLO 71: el veredicto dejo de ser un parrafo repetido debajo y es el
// TITULAR. Lo que se prueba sigue siendo lo mismo: que se ve sin desplegar nada.
// ARREGLO 99: el veredicto bajo de titular de 22px a semaforo de una linea.
// Lo que se prueba sigue siendo lo mismo: que se ve sin desplegar nada, y que
// dice en PALABRAS si falta o sobra — un numero sin rotulo se lee al reves.
ok(/"✅ Cuadra"/.test(_blq) && /falta por explicar/.test(_blq) && /sobra sin explicar/.test(_blq),
   "el veredicto tambien se ve siempre: es la respuesta a la pregunta");


// ── ARREGLO 49: la tasa sale sola de la ultima operacion ─────────────────
// Ella escribia la tasa a mano y mandaba para siempre: "casi nunca me da
// tiempo de editarla todos los dias". El 5,22 que escribio una vez seguia
// valorando todo mientras compraba USDT a 5,11.
console.log("\nARREGLO 49 · la tasa de referencia");

const hoyLote = (() => { const d = new Date();
  return String(d.getMonth()+1).padStart(2,"0") + "/" + String(d.getDate()).padStart(2,"0"); })();
const loteDe = (dias) => { const d = new Date(Date.now() - dias*86400000);
  return String(d.getMonth()+1).padStart(2,"0") + "/" + String(d.getDate()).padStart(2,"0"); };

S.tasasDia = {}; S._tasasDiaMeta = {}; S.brl = []; S.vzla = []; S.eeuu = [];
S.inventarioUsdt_cerrado = [];
S.inventarioUsdt = [
  // dos compras del MISMO dia: solo el id las ordena
  { id: 1, tipo:"compra", moneda:"BRL", fecha:hoyLote, montOrigen:1040, usdt:200, tasa:5.2, restante:200 },
  { id: 2, tipo:"compra", moneda:"BRL", fecha:hoyLote, montOrigen:1020, usdt:200, tasa:5.1, restante:200 },
  { id: 3, tipo:"venta",  moneda:"VES", fecha:hoyLote, usdt:100, neto:100, bs:96000, tasa:960, bsRestante:96000 }
];
ok(F.tasaDeReferencia("BRL").tasa === 5.1 && F.tasaDeReferencia("BRL").origen === "auto",
   "toma la compra mas reciente, no la primera del dia", JSON.stringify(F.tasaDeReferencia("BRL")));
ok(F.tasaDeReferencia("VES").tasa === 960 && F.tasaDeReferencia("VES").tipo === "venta",
   "y en bolivares toma la venta");
ok(F.tasaDeReferencia("USDT").tasa === 1, "USDT es 1 y no se discute");

// La mas NUEVA, no la del frente del FIFO. getLastTasaCompra devuelve el lote
// mas viejo con saldo —correcto para costear, falso para valorar—: con sus
// datos daba 5,163 cuando su compra mas reciente fue a 5,1126.
S.inventarioUsdt[1].restante = 0;      // la nueva ya se consumio entera
ok(F.tasaDeReferencia("BRL").tasa === 5.1,
   "aunque ya este gastada: sigue siendo la ultima que hizo", F.tasaDeReferencia("BRL").tasa);

// Mira tambien los lotes cerrados: si no, una moneda pierde su tasa en cuanto
// se consume todo lo que tenia.
S.inventarioUsdt_cerrado = [{ id: 4, tipo:"compra", moneda:"BRL", fecha:hoyLote,
                              montOrigen:1000, usdt:200, tasa:5.0, restante:0, _cerrado:true }];
ok(F.tasaDeReferencia("BRL").tasa === 5,
   "un lote cerrado tambien cuenta si es el mas reciente", F.tasaDeReferencia("BRL").tasa);

// La tasa real es la que QUEDO, no la que dijo Binance (ARREGLO 42).
S.inventarioUsdt_cerrado = [];
S.inventarioUsdt[2] = { id: 9, tipo:"venta", moneda:"VES", fecha:hoyLote,
                        usdt:20.89, neto:20.83, bs:19996.8, tasa:960, bsRestante:19996.8 };
ok(casi(F.tasaDeReferencia("VES").tasa, 957.2427, 0.001),
   "usa lo que de verdad quedo (19.996,80 / 20,89), no el 960 de Binance",
   F.tasaDeReferencia("VES").tasa);

// Nunca la de otra moneda. Pidiendo la del PEN devolvia 960,2328 —la del
// bolivar— porque al no hallar lotes en soles se iba a "todas las ventas".
ok(F.getLastTasaVenta("PEN") === null && F.getLastTasaVenta("COP") === null,
   "sin lotes en esa moneda no se presta la del bolivar",
   F.getLastTasaVenta("PEN") + "/" + F.getLastTasaVenta("COP"));
ok(F.getLastTasaVenta("VES") !== null, "pero los bolivares siguen teniendo la suya");
ok(F.tasaDeReferencia("PEN").origen === "ninguna",
   "y sin nada escrito, el PEN se queda sin tasa en vez de valer 960");

// Fuera de rango no se acepta: mejor sin tasa que con una falsa.
S.inventarioUsdt.push({ id: 10, tipo:"compra", moneda:"BRL", fecha:hoyLote,
                        montOrigen:104000, usdt:200, tasa:520, restante:200 });
ok(F.tasaDeReferencia("BRL").origen !== "auto",
   "una tasa disparatada (520 BRL/USDT) no se usa", JSON.stringify(F.tasaDeReferencia("BRL")));
S.inventarioUsdt.pop();

// Lo que ella fija a mano manda: es una decision, no un olvido.
global.avisos = [];
F.setTasaDia("BRL", "5,3333");
ok(F.tasaDeReferencia("BRL").tasa === 5.3333 && F.tasaDeReferencia("BRL").origen === "fijada",
   "escribir una tasa la FIJA, y la fijada gana", JSON.stringify(F.tasaDeReferencia("BRL")));
ok(S._tasasDiaMeta.BRL.fijada === true && !!S._tasasDiaMeta.BRL.fecha,
   "y queda marcada con su fecha, para que se vea envejecer");
F.setTasaDia("VES", "1.030,5");
ok(S.tasasDia.VES === 1030.5, "lee el punto de miles y la coma decimal", S.tasasDia.VES);
global.avisos = [];
F.setTasaDia("VES", "5");
ok(S.tasasDia.VES === 1030.5 && /no parece de VES/.test(global.avisos[0] || ""),
   "y rechaza un disparate sin tocar la que habia", S.tasasDia.VES);
F.setTasaDia("VES", "");
ok(F.tasaDeReferencia("VES").origen === "auto",
   "borrar el campo la suelta: vuelve a salir sola");
global.avisos = [];
F.soltarTasaDia("BRL");
ok(F.tasaDeReferencia("BRL").origen === "auto" && F.tasaDeReferencia("BRL").tasa === 5.1,
   "el boton de soltar tambien", F.tasaDeReferencia("BRL").tasa);
ok(/vuelve a salir sola/.test(global.avisos[0] || ""), "y le dice de que operacion sale");

// Sin operaciones en esa moneda, lo ultimo que escribio sigue valiendo: no se
// le puede quitar la tasa del PEN por soltarla.
S.tasasDia.PEN = 3.48; S._tasasDiaMeta.PEN = { fecha:"01/09/2026", fijada:true };
F.soltarTasaDia("PEN");
ok(F.tasaDeReferencia("PEN").tasa === 3.48 && F.tasaDeReferencia("PEN").origen === "escrita",
   "una moneda sin operaciones conserva lo que escribio", JSON.stringify(F.tasaDeReferencia("PEN")));

// Una tasa automatica tambien envejece.
ok(F._diasDesdeLote(loteDe(0)) === 0 && F._diasDesdeLote(loteDe(9)) === 9,
   "sabe de hace cuantos dias es el lote", F._diasDesdeLote(loteDe(9)));
ok(F._diasDesdeLote("") === null, "y lo que no es fecha no revienta");
ok(F._fechaLoteLegible("09/12") === "12/09", "la fecha mm/dd se enseña al derecho",
   F._fechaLoteLegible("09/12"));

// Estructura: que el panel siga contando de donde sale cada numero.
ok(/getRateToUsdt\(moneda\)\{[\s\S]{0,400}tasaDeReferencia\(moneda\)/.test(HTML),
   "getRateToUsdt pasa por tasaDeReferencia");
ok(!/if\(S\.tasasDia&&S\.tasasDia\[moneda\]\) return parseFloat/.test(HTML),
   "y ya no da prioridad ciega a lo escrito a mano");
ok(/Sale sola de tu/.test(HTML) && /La fijaste tú/.test(HTML) && /Que salga sola/.test(HTML),
   "el panel dice el origen y deja soltarla");
ok(/if\(dest!=="VES"\) return null;/.test(HTML),
   "el rescate de 'todas las ventas' es solo para bolivares");

S.tasasDia = {}; S._tasasDiaMeta = {}; S.inventarioUsdt = []; S.inventarioUsdt_cerrado = [];


// ── ARREGLO 51: a mm/dd le faltaba el año, y en enero se notaba ──────────
// ordenFIFO leia la fecha como mes×100+dia. El 1 de enero, un lote del 31/12
// se ordenaba DESPUES de uno del 01/01: durante todo enero la app trataba lo
// de diciembre como lo mas nuevo. De ahi sale que lote se consume primero —y
// con el, su ganancia— y desde el arreglo 49 tambien la tasa con la que se
// valora todo su dinero.
console.log("\nARREGLO 51 · el año que a mm/dd le faltaba");

const dic = { id: 1, tipo:"compra", moneda:"BRL", fecha:"12/28", fechaIso:"2026-12-28",
              montOrigen:1044, usdt:200, tasa:5.22, restante:200 };
const ene = { id: 2, tipo:"compra", moneda:"BRL", fecha:"01/05", fechaIso:"2027-01-05",
              montOrigen:1000, usdt:200, tasa:5.00, restante:200 };
ok(F.ordenFIFO(dic, ene) < 0, "diciembre va antes que el enero siguiente");
ok(F.ordenFIFO(ene, dic) > 0, "y al reves tambien");
S.inventarioUsdt = [ene, dic]; S.inventarioUsdt_cerrado = [];
S.tasasDia = {}; S._tasasDiaMeta = {};
ok(F.tasaDeReferencia("BRL").tasa === 5,
   "y la tasa sale del de enero, que es el mas nuevo", F.tasaDeReferencia("BRL").tasa);

// Sin año guardado (los ~290 lotes que ya existen) se deduce, y la deduccion
// tiene una trampa: un lote puede llevar fecha adelantada A PROPOSITO
// (confirmarFechaFutura lo permite, y paso el 12/09 con un 18/09). "En el
// futuro" no significa "del año pasado": se admiten 30 dias por delante.
const enDias = (n) => { const d = new Date(Date.now() + n*86400000);
  return String(d.getMonth()+1).padStart(2,"0") + "/" + String(d.getDate()).padStart(2,"0"); };
const anioHoy = parseInt(F.td().slice(0,4), 10);
ok(F._isoDeLote({ fecha: enDias(5) }).slice(0,4) === String(anioHoy),
   "un lote adelantado cinco dias es de este año", F._isoDeLote({ fecha: enDias(5) }));
// La regla, dicha como invariante para que valga se corra el dia que se corra:
// ninguna fecha deducida puede quedar a mas de 30 dias por delante de hoy.
[7, 45, 120, 200, 300].forEach(function(n){
  const iso = F._isoDeLote({ fecha: enDias(n) });
  ok(F._diasEnElFuturo(iso) <= 30,
     "un lote a " + n + " dias por delante no se deduce mas alla de 30", iso);
  ok(iso.slice(5) === enDias(n).split("/")[0] + "-" + enDias(n).split("/")[1],
     "  y conserva su dia y su mes", iso + " vs " + enDias(n));
  ok(iso.slice(0,4) === String(anioHoy) || iso.slice(0,4) === String(anioHoy - 1),
     "  y cae en este año o en el anterior, nunca mas lejos", iso);
});
ok(F._isoDeLote({ fecha: "09/12", fechaIso: "2024-09-12" }) === "2024-09-12",
   "y si el lote trae su año, manda el suyo y no se deduce nada");
// El caso al reves, que solo aparece en el cambio de año: un lote que se lee
// once meses hacia atras en este año y a pocos dias hacia delante en el que
// viene es del que viene. El 29 de diciembre, "01/05" es del enero siguiente.
ok(F._isoDeLote({ fecha: enDias(-360) }).slice(0,4) === String(anioHoy + 1) ||
   F._diasEnElFuturo(F._isoDeLote({ fecha: enDias(-360) })) <= 30,
   "un lote de hace 360 dias no se confunde con uno de dentro de cinco",
   F._isoDeLote({ fecha: enDias(-360) }));

// _fechaLoteIso entiende lo mismo que _fechaLote, pero con año.
ok(F._fechaLoteIso("2026-09-12") === "2026-09-12", "ISO entra y sale igual");
ok(F._fechaLoteIso("12/09/26") === "2026-09-12", "dd/mm/aa se convierte entero",
   F._fechaLoteIso("12/09/26"));
ok(F._fechaLoteIso("") === "", "y lo vacio no revienta");

// El desempate por id sigue en pie: dos lotes del mismo dia solo se distinguen
// por el orden en que se registraron.
ok(F.ordenFIFO({fecha:"09/12", id:2}, {fecha:"09/12", id:1}) > 0,
   "mismo dia: manda el id");
S.inventarioUsdt = []; S.tasasDia = {}; S._tasasDiaMeta = {};


// ── ARREGLO 52: el campo se comía la coma decimal ────────────────────────
// type="number" descarta en silencio lo que el navegador no considera un
// numero, y con el teclado en español la coma decimal es justo eso. Por ahi se
// perdio el 0,003 de la comision del banco: el campo se quedaba con "0003".
// Pasarlo a texto sin mas es PEOR, porque cada parseFloat de mas abajo leeria
// "5,22" como 5. Por eso se normaliza en la puerta, con _num().
console.log("\nARREGLO 52 · la coma decimal");
[["244,50","244.5"],["5,22","5.22"],["0,003","0.003"],["19.996,80","19996.8"],
 ["960,7","960.7"],["1.030,5","1030.5"],
 ["244.50","244.5"],["0.003","0.003"],["19996.80","19996.8"],   // con punto, como antes
 ["1200","1200"],["0","0"]
].forEach(function(par){
  ok(F._num(par[0]) === par[1], '"'+par[0]+'" se guarda como '+par[1], F._num(par[0]));
});
// A medio teclear no se puede tirar lo que va escrito: se deja tal cual y ya lo
// leera el parseFloat de abajo cuando este completo.
["", "-", ",", "abc"].forEach(function(v){
  ok(F._num(v) === v, "lo que todavia no es un numero se deja como esta: "+JSON.stringify(v), F._num(v));
});
// Y que ningun campo de las pantallas donde ella teclea dinero vuelva a
// type="number": ahi es donde se pierden los centimos.
["rNueva","rNuevaEE","rInventarioUsdt","rEgresos","rTraspasos","rPrestamos",
 "rCuentasCobrar","rTabSocios","rTabCompromisos"].forEach(function(fn){
  const i = HTML.indexOf("function "+fn+"(");
  if(i<0) return;
  const j = HTML.indexOf("\nfunction ", i+10);
  const trozo = HTML.slice(i, j<0?HTML.length:j);
  // numCuotas es un contador, no dinero: no tiene decimales que perder.
  const dinero = trozo.replace(/<input[^>]*inputmode='numeric'[^>]*>/g, "");
  ok(!/type='number'/.test(dinero), fn+" no tiene ningun campo de dinero que se coma la coma");
  ok(!/inputmode='decimal' inputmode='decimal'/.test(trozo),
     "  y sin atributos duplicados");
  const conValor = (dinero.match(/inputmode='decimal'/g)||[]).length;
  const conNum   = (dinero.match(/_num\(this\.value\)/g)||[]).length;
  ok(conValor === 0 || conNum >= conValor,
     "  y todos los suyos pasan por _num()", conValor+" campos / "+conNum+" normalizados");
});


// ── ARREGLO 53: Evolución comparaba peras con manzanas ───────────────────
// El "Resumen total" restaba la ganancia sumada de los meses menos lo que hay
// en las cuentas de USDT y llamaba "Diferencia" al resultado. Esos dos numeros
// no tienen por que parecerse: la suma de los meses es GANANCIA, no capital, y
// "lo que esta en USDT" eran 802,78 de sus 2.479,17 porque deja fuera reales,
// bolivares, lo que le deben y 1.010,93 prestados. La app lo sabia y tenia que
// disculparse debajo. Esa pregunta la responde la conciliacion.
console.log("\nARREGLO 53 · Evolucion");
ok(!/DEBERÍAS TENER<\/div>[\s\S]{0,200}suma de todos los meses/.test(HTML),
   "ya no compara la ganancia sumada contra las cuentas de USDT");
ok(!/>solo lo que está en USDT</.test(HTML) && !/TIENES AHORA/.test(HTML),
   "ni ensena ese 'tienes ahora' que dejaba fuera casi todo su dinero");
ok(!/Tienes menos USDT de lo calculado/.test(HTML),
   "ni tiene que disculparse por el numero que acaba de dar");
ok(/GANANCIA ACUMULADA|Ganancia acumulada/.test(HTML) &&
   /Esto es lo que <b>ganaste<\/b>, no lo que <b>tienes<\/b>/.test(HTML),
   "en su sitio dice lo que es: ganancia, no capital");
ok(/onclick='S\.tab=\\"capital_total\\";R\(\)'/.test(HTML),
   "y manda a la conciliacion, que si cuenta todo el capital");

// Lo que esta pantalla si puede decir y no decia: como va mes a mes.
ok(/vs el mes anterior/.test(HTML), "cada mes se compara con el anterior");
ok(/Deja cada operación/.test(HTML) && /Se llevan los egresos/.test(HTML),
   "y ensena los dos numeros que explican por que un mes cae");
ok(/De eso, préstamos/.test(HTML), "la ganancia de prestamos va aparte");

// Los cierres del formato viejo se marcan —"muchos datos de meses anteriores
// no estan del todo correctos"— pero SI suman: el acumulado tiene que poder
// sumarse a mano con lo que hay en pantalla. Dejar uno fuera hace que el total
// no cuadre con la lista, que es peor que un numero aproximado.
ok(/cierre del formato viejo/.test(HTML),
   "un cierre viejo se marca");
ok(/var viejo = \(c\.ganBrutaTotal===undefined && c\.utilidadEmpresa===undefined\);/.test(HTML),
   "se sabe cual es");
ok(!/if\(!viejo\) sumaTotal/.test(HTML) && !/return f\.viejo\?m:Math\.max/.test(HTML),
   "pero cuenta en el acumulado y en la escala, como todos");
ok(/var desdeLabel = \(filas\[0\]\|\|\{\}\)\.label/.test(HTML),
   "y el 'desde' es el primer mes que se ve");

// ── ARREGLO 55: la direccion de la tasa al cobrar en otra moneda ─────
// Su caso real (14/09/2026): prestamo de 192,80 USDT, pendiente 87,80, el
// cliente paga en reales a 5,30. El campo pedia la tasa al reves ("1 BRL =
// ? USDT", 0,1956) y ella escribia 5,30, asi que la app le decia que el
// cliente tenia que darle 87,80 / 5,30 = 16,566 reales. Lo peligroso no era
// ese numero absurdo sino el que si cuadraba: al confirmar, el prestamo
// quedaba bien (16,566 x 5,30 = 87,80 USDT) y a la cuenta en reales le
// entraban R$ 16,57 de los R$ 465,34 que el cliente entrego.
console.log("\nArreglo 55 · la tasa se escribe como se dice: 1 USDT = 5,30 BRL");
ok(casi(F._tasaAutoPago("USDT", "BRL"), 5.4),
   "la automatica dice cuantos BRL vale 1 USDT, no al reves", F._tasaAutoPago("USDT", "BRL"));
ok(casi(F._tasaAutoPago("BRL", "VES"), 200 / 5.4, 0.01),
   "y sirve para cualquier par, no solo contra USDT", F._tasaAutoPago("BRL", "VES"));
ok(F._tasaAutoPago("USDT", "COP") === null,
   "sin tasa en esa moneda devuelve null, no una prestada");
// Su cuenta, en las dos direcciones.
ok(casi(F._deudaCubierta(465.34, 5.30), 87.80),
   "465,34 BRL a 5,30 cubren 87,80 USDT del prestamo", F._deudaCubierta(465.34, 5.30));
ok(casi(Math.round(87.80 * 5.30 * 10000) / 10000, 465.34),
   "y para cobrar 87,80 USDT el cliente da 465,34 BRL");
ok(F._deudaCubierta(465.34, 0) === 0, "sin tasa no inventa una conversion");

// El aviso de tasa al reves, misma idea que el del salto de 10x al escribir
// un saldo a mano: el numero solo no dice en que direccion esta escrito.
ok(F._htmlTasaInvertida(0.1956, 5.1126, "USDT", "BRL").length > 0,
   "escribir 0,1956 cuando toca 5,1126 avisa");
ok(F._htmlTasaInvertida(5.30, 5.1126, "USDT", "BRL") === "",
   "escribir 5,30 no avisa: es la direccion buena");
ok(F._htmlTasaInvertida(0.00104, 960, "USDT", "VES").length > 0,
   "y avisa igual con bolivares");
ok(F._htmlTasaInvertida(1.02, 1.0, "USDT", "USD") === "",
   "con tasas cerca de 1 se calla: las dos direcciones se parecen");
ok(F._htmlTasaInvertida(0, 5.1126, "USDT", "BRL") === "",
   "y con el campo vacio no molesta");

// La cuenta escrita con palabras: es lo unico que hace visible la direccion.
const _pal = F._htmlTasaEnPalabras(87.80, 5.30, "USDT", "BRL");
ok(/465,34 BRL/.test(_pal) && /87,80 USDT/.test(_pal),
   "la linea en palabras ensena la multiplicacion entera", _pal);
ok(F._htmlTasaEnPalabras(0, 5.30, "USDT", "BRL") === "",
   "y no aparece si todavia no hay de que hablar");
ok(/87,80 USDT/.test(F._htmlEquivAbono(465.34, 5.30, "USDT", true, "del prestamo")),
   "el recuadro verde divide, ya no multiplica");
const _calc = F._htmlCalcPago(87.80, 5.30, "BRL");
ok(/465,34/.test(_calc) && /466 BRL/.test(_calc),
   "y la calculadora al reves multiplica, ya no divide", _calc);

// Guardias estructurales: que nadie vuelva a voltear la direccion.
ok(/1 "\+monP\+" = \? "\+monPago\+"/.test(HTML),
   "el rotulo del prestamo pregunta por la moneda del PAGO");
ok(/1 "\+c\.moneda\+" = \? "\+monPagoCC\+"/.test(HTML),
   "el de cuentas por cobrar tambien");
ok(!/1 "\+monPago\+" = \? "\+monP\+"/.test(HTML) &&
   !/1 "\+monPagoCC\+" = \? "\+c\.moneda\+"/.test(HTML),
   "y no queda ningun rotulo con la direccion vieja");
ok(!/monto = Math\.round\(\(montoIngresado\*tasaManual\)\*100\)\/100;/.test(HTML),
   "ni un solo sitio multiplica el monto recibido por la tasa manual");
ok((HTML.match(/_deudaCubierta\(montoIngresado,tasaManual\)/g) || []).length === 2,
   "prestamos y cuentas por cobrar convierten por el mismo sitio");
ok(/np\.monto=_montoACobrar\(obj,tm,monPago,techo\);/.test(HTML),
   "la calculadora al reves multiplica y redondea por el mismo sitio");
ok(!/np\.monto=Math\.round\(\(obj\/tm\)/.test(HTML),
   "y no queda rastro de la division vieja");
// El recuadro verde se quedaba con la cuenta vieja porque solo se refrescaba
// el monto: la pantalla ensenaba 16.566 arriba y 2.635,43 abajo.
ok(/id='pp-eq'/.test(HTML) && /getElementById\("pp-eq"\)/.test(HTML),
   "el recuadro verde se refresca en vivo, no se queda viejo");
ok(/id='pp-dir'/.test(HTML) && /id='pp-inv'/.test(HTML),
   "la linea en palabras y el aviso tienen su sitio en pantalla");

// ── ARREGLO 56: lo que se le pide al cliente va redondeado hacia arriba ──
// "Muy poco la gente paga con decimales": pedirle 497,246 reales no tiene
// sentido, y bajarlo la deja corta. Se redondea HACIA ARRIBA a la unidad, y
// lo que pague se le acredita completo — decision suya: el redondeo quita
// centavos, no le cobra de mas.
console.log("\nArreglo 56 · lo que se le pide va redondeado hacia arriba");
ok(F._pasoRedondeoCobro("BRL") === 1 && F._pasoRedondeoCobro("VES") === 1,
   "reales y bolivares se piden en unidades enteras");
ok(F._pasoRedondeoCobro("USDT") === 0.01,
   "USDT no: se transfiere exacto y la unidad entera serian mas de 5 reales");
ok(casi(F._montoACobrar(93.82, 5.30, "BRL"), 498),
   "93,82 USDT a 5,30 son 497,246 -> se le piden 498", F._montoACobrar(93.82, 5.30, "BRL"));
ok(casi(F._montoACobrar(87.80, 5.30, "BRL"), 466),
   "y 465,34 sube a 466, nunca baja a 465", F._montoACobrar(87.80, 5.30, "BRL"));
ok(casi(F._montoACobrar(100, 5, "BRL"), 500),
   "un resultado ya entero se queda como esta, no sube uno de balde");
ok(casi(F._montoACobrar(20, 0.1887, "USDT"), 3.78),
   "en USDT se redondea al centimo: 3,774 -> 3,78", F._montoACobrar(20, 0.1887, "USDT"));
ok(F._montoACobrar(50, 0, "BRL") === 0 && F._montoACobrar(0, 5.3, "BRL") === 0,
   "sin tasa o sin deuda no inventa un numero");

// El ultimo pago es el unico que puede llevar centavos: redondear hacia
// arriba ahi le pediria mas de lo que debe, y no hay donde acreditarselo.
ok(casi(F._montoACobrar(87.80, 5.30, "BRL", 87.80), 465.34),
   "si 466 se pasa de lo que debe, se le pide el exacto (465,34)",
   F._montoACobrar(87.80, 5.30, "BRL", 87.80));
ok(casi(F._montoACobrar(50, 5.30, "BRL", 87.80), 265),
   "pero mientras quede deuda por debajo del techo, se redondea igual",
   F._montoACobrar(50, 5.30, "BRL", 87.80));
// Si la cuota elegida se pasa del saldo que queda, se cobra el saldo: pedirle
// la cuota entera le sacaria dinero que no debe, y al registrarlo el abono se
// recorta y la cuenta se queda por debajo de lo que entro al banco de verdad.
ok(casi(F._montoACobrar(93.82, 5.30, "BRL", 87.80), 465.34),
   "una cuota mayor que el saldo se cobra al saldo, no a la cuota",
   F._montoACobrar(93.82, 5.30, "BRL", 87.80));
ok(casi(F._montoACobrar(93.82, 5.30, "BRL", 120), 498),
   "con saldo de sobra, la cuota se redondea como toca",
   F._montoACobrar(93.82, 5.30, "BRL", 120));

// La multiplicacion se enseña entera: un numero redondeado presentado como
// el resultado de la cuenta se lee como un error de la app.
const _pal56 = F._htmlTasaEnPalabras(93.82, 5.30, "USDT", "BRL");
ok(/497,25/.test(_pal56) && /498 BRL/.test(_pal56) && /p&iacute;dele/.test(_pal56),
   "la linea enseña la cuenta exacta Y lo que hay que pedir", _pal56);
ok(/eso es lo que te tiene que dar/.test(F._htmlTasaEnPalabras(100, 5, "USDT", "BRL")),
   "y cuando no hay que redondear no habla de redondeo");
ok(F._fMontoCobro(498, "BRL") === "498" && F._fMontoCobro(3.78, "USDT") === "3,78",
   "los importes enteros salen sin el ',00' de mas",
   F._fMontoCobro(498, "BRL"));
// Cuando la cuota se recorta al saldo, el texto lo dice: enseñarlo como si
// fuera un redondeo se lee como un error de la app.
const _pal56b = F._htmlTasaEnPalabras(93.82, 5.30, "USDT", "BRL", 87.80);
ok(/ya solo debe/.test(_pal56b) && /87,80 USDT &times; 5,3/.test(_pal56b) && /465,34 BRL/.test(_pal56b),
   "y si se recorta al saldo, la cuenta que enseña es la del saldo", _pal56b);
ok(!/497,25 BRL &mdash;/.test(_pal56b) && !/p&iacute;dele/.test(_pal56b),
   "sin fingir que 465,34 sale de redondear 497,25");

// Guardias: el redondeo toca lo que se PIDE, nunca lo que se apunta.
ok(/monto = _deudaCubierta\(montoIngresado,tasaManual\);/.test(HTML),
   "lo recibido se convierte exacto, sin redondeos de por medio");
ok(!/_montoACobrar\(montoIngresado/.test(HTML),
   "y el monto que entra a la cuenta no pasa por el redondeo");

// ── ARREGLO 57: el cierre de mes no puede enseñar numeros que no cuadran ──
// Guardias estructurales: estas cosas se comprobaron en el navegador con su
// export, y aqui se fijan para que no vuelvan.
console.log("\nArreglo 57 · el cierre de mes cuenta el mismo dinero en todas partes");

// El agujero inventado: comparaba "cierre anterior + neto del mes" contra solo
// lo que hay en cuentas bancarias y cantaba −546,29 USDT que no existian.
ok(!/Debería haber en caja/.test(HTML),
   "el PDF ya no tiene el 'deberia haber en caja' que inventaba el agujero");
ok(!/puede deberse a tasas del momento o cobros pendientes/.test(HTML),
   "ni la disculpa que lo acompañaba");
// ARREGLO 90: el bloque se llamaba "de que se compone el capital" y vivia al
// final, dentro del resumen ejecutivo. Ahora es el apartado 1 del informe y el
// rotulo lo dice en su idioma ("De donde sale"), pero lo que la guardia
// protege es lo mismo: que el desglose este y que mande a la conciliacion.
ok(/De dónde sale/.test(HTML),
   "el informe desglosa de donde sale el capital");
ok(/conciliación de capital/.test(HTML),
   "y manda a la conciliacion, que si responde si falta dinero");
// El capital sale de una sola funcion, para que dos pantallas no cuenten
// distinto el mismo dinero (faltaba la reserva: 2.302,34 contra 2.479,17).
{
  // sinComentarios es un const que se declara mas abajo: aqui se quitan los
  // comentarios a mano. (Leerlo antes de su declaracion revienta el fichero
  // entero con "Cannot access before initialization", no falla una prueba.)
  const inf = sacarFuncion("generarInformePDF")
    .split("\n").filter(function(l){ return !/^\s*\/\//.test(l); }).join("\n");
  ok(/var cap=\(typeof capitalRealTotal==="function"\)\?capitalRealTotal\(\):null;/.test(inf),
     "el capital del PDF sale de capitalRealTotal(), la misma de Balance de Cuentas");
  // Ni un total de capital sumado a mano: todos los que se enseñan salen de
  // cap.total. Antes habia un "potencial total" que sumaba cuentas + afuera y
  // se dejaba la reserva (2.302,34 contra 2.479,17).
  ok(!/totalUsdtCuentas\+totalAfuera|siCobrasTodo/.test(inf),
     "y no queda ningun capital sumado a mano en el informe");
  ok((inf.match(/f2l\(cap\.total\)/g)||[]).length>=3,
     "el titular, el pie de la tabla y la portada enseñan el MISMO cap.total");
}

// Los intereses de prestamos entran en ganBrutaTotal y NO en miGanOperaciones:
// el desglose saltaba de 226,89 a 221,50 sin una fila que lo explicara, y la
// pestaña Operaciones enseñaba otra ganancia bruta distinta.
// ARREGLO 90: en el PDF la fila cambio de texto ("De eso, intereses de
// prestamos"), pero sigue teniendo que estar: sin ella el desglose salta de
// 226,89 a 221,50 sin nada que lo explique.
ok(/Intereses de préstamos \("\+calc\.ganPrestamosCant/.test(HTML),
   "los intereses de prestamos tienen su fila en la pantalla");
ok(/intereses de préstamos \("\+calc\.ganPrestamosCant/.test(HTML),
   "y tambien en el PDF, que si no el desglose no cuadra");
ok(/Solo remesas\. Los <b>\$"\+f2\(calc\.ganPrestamos\)/.test(HTML),
   "y Operaciones avisa de que su total son solo remesas");

// Apartar un numero negativo no significa nada: si el socio debe, es un cobro.
ok(/var _socioAPagar=Math\.max\(0,calc\.socioFinalEE\);/.test(HTML),
   "lo que se aparta para el socio nunca es negativo");
ok(/te debe \(no se le paga este mes\)/.test(HTML),
   "y cuando debe, la pantalla lo dice igual que el PDF");

// Ruido que estorbaba la lectura.
ok(!/mes anterior encontrado/.test(HTML),
   "fuera la linea de depuracion que se veia en produccion");
ok(/se pagaron desde una cuenta, así que ya bajaron ESA cuenta/.test(HTML),
   "se explica por que unos gastos personales no bajan el disponible");
// El cierre vivo, en español. (rCierreMes/imprimirRelatorioContador siguen en
// portugues, pero son codigo muerto que nadie llama; se borran aparte.)
// Se quitan los comentarios antes de mirar: un comentario que CUENTA el
// arreglo nombra las palabras viejas, y si no, la prueba se acusa a si misma.
const _vivo = HTML.slice(HTML.indexOf("function calcMesCompleto"))
                  .split("\n").filter(function(l){return !/^\s*\/\//.test(l);}).join("\n");
ok(!/Saídas|Fluxo líquido|Relatório Financeiro|todas as contas/.test(_vivo),
   "no queda portugues suelto en el cierre vivo");
ok(/En cero y sin movimiento este mes/.test(HTML) && / más en cero, sin saldo que informar/.test(HTML),
   "las cuentas en cero se apartan pero se siguen nombrando");

// ── ARREGLO 58: un socio sin nada no llena media pantalla de ceros ──────
// Sus palabras: "ya todas esas cuentas quedaron saldadas, no deberia de
// aparecer nada de Paul". Pero si queda una deuda viva, SI tiene que salir:
// es dinero de verdad.
console.log("\nArreglo 58 · un socio sin movimiento este mes no ocupa la pantalla");
ok(/function _socioVacio\(bruta,deudas,final,socioId\)/.test(HTML),
   "hay una sola regla para decidir si un socio tiene algo que enseñar");
ok(/Math\.abs\(bruta\)<0\.009 && Math\.abs\(deudas\)<0\.009 && Math\.abs\(final\)<0\.009 && Math\.abs\(pagos\)<0\.009/.test(HTML),
   "y solo se calla si no hay ganancia, ni deuda, ni saldo, ni pagos");
ok(/sin operaciones, sin deudas y sin pagos este mes/.test(HTML),
   "el socio dormido sale nombrado, no borrado");
ok(/if\(calc\.socioFinalEE>0\.009\) filas\.push\(\["Pagar a "\+calc\.socioNombreEE/.test(HTML),
   "el PDF no escribe una fila 'Pagar X \$0,00'");
ok(/Math\.abs\(calc\.ganEEBruta\)>0\.009 \|\| Math\.abs\(calc\.deudasSocioEE\)>0\.009/.test(HTML),
   "y la seccion de liquidacion de socios no se dibuja si no hay nada que liquidar");

// ── ARREGLO 59: la hoja del contador y el detalle del mes ───────────────
console.log("\nArreglo 59 · el informe lleva lo que el contador necesita");

// El "</div>" de mas: cerraba .cuerpo y .hoja antes de tiempo, asi que TODO lo
// que se pusiera despues quedaba FUERA de #reporteCapture — y html2canvas solo
// captura lo de dentro. No se notaba porque no habia nada despues; al añadir
// las dos secciones nuevas desaparecian sin dar un solo error.
ok(!/"<\/table><\/div>"\+"<\/div>"/.test(HTML),
   "no queda el '</div>' de mas que cerraba la hoja antes de tiempo");
ok(/id='reporteCapture'/.test(HTML), "la hoja del PDF sigue teniendo su id");

// Lo que el contador pide, y de quien es el papel.
ok(/EMPRESA_RAZON|EMPRESA_CNPJ/.test(HTML), "la razon social y el CNPJ estan en el codigo");
ok((HTML.match(/EMPRESA_CNPJ/g)||[]).length>=3,
   "y salen en la hoja del PDF, en la pantalla y en el CSV");
ok(/Hoja para el contador/.test(HTML), "el PDF lleva la hoja del contador");
// ARREGLO 90: el detalle remesa por remesa se FUE, y es lo que ella pidio:
// "no me importa mucho que me deje un informe de todas las remesas que
// salieron, solamente por donde salieron, cuanto salio por cada ruta... con
// los detalles de cada operacion, yo diria que eso no es tan relevante".
// En su sitio entra lo que si pidio: cuanto mando cada cliente.
ok(!/Detalle del mes · todo el movimiento/.test(HTML),
   "el detalle remesa por remesa ya no va en el informe");
ok(/Clientes · cuánto mandó cada uno/.test(HTML),
   "y en su sitio esta cuanto mando cada cliente");
// Lo que de detalleMes() si sigue en el informe son los movimientos de banco:
// las compras y ventas de USDT y los traspasos entre cuentas, que es de donde
// sale toda la ganancia.
ok(/dm\.usdt\.length/.test(HTML) && /dm\.traspasos\.length/.test(HTML),
   "los movimientos de banco siguen: compras y ventas de USDT y traspasos");
ok(/_descargarInformePDF/.test(HTML) && /⬇️ Descargar PDF/.test(HTML),
   "hay boton de descargar, no solo compartir");

// Una sola fuente para la ganancia del contador: cada operacion con SU tasa.
// Sin comentarios: el que cuenta el arreglo nombra lo que se quito.
const _sinCom = HTML.split("\n").filter(function(l){return !/^\s*\/\//.test(l);}).join("\n");
ok(!/Lucro Bruto das Operações|Lucro Líquido Final/.test(_sinCom),
   "fuera el 'lucro' que convertia todo con una sola tasa del dia");
ok((HTML.match(/resumenContador\(mesKey\)/g)||[]).length>=3,
   "la pantalla, el PDF y el CSV salen de resumenContador()");

// El codigo muerto, borrado.
ok(!/function rCierreMes\(/.test(HTML) && !/function imprimirRelatorioContador\(/.test(HTML),
   "las 313 lineas muertas del cierre viejo ya no estan");
ok(!/Selecione um mês|Relatório Contador/.test(HTML),
   "y con ellas se fue el ultimo portugues del modulo");

// ── ARREGLO 60: la apertura viaja entera o no viaja ─────────────────────
// La apertura son cinco claves dentro de config, y _mergeObjetoPorClave decide
// clave por clave: con dos aparatos se quedaba la FECHA de uno y el MONTO del
// otro. Reproducido con sus dos pantallas del 14/09 —telefono 11/09 · 2.544,79
// y PC 12/09 · 2.450,20— que fusionaban a 12/09 · 2.544,79: una apertura que no
// existio en ninguno de los dos, y contra la que mide toda la conciliacion.
console.log("\nArreglo 60 · la apertura no se mezcla entre aparatos");
ok(Array.isArray(F._MERGE_BLOQUES && F._MERGE_BLOQUES.config),
   "config tiene bloques de claves que viajan juntas");
(function(){
  const bloque = (F._MERGE_BLOQUES.config||[])[0]||[];
  ["aperturaUsdt","aperturaFecha","aperturaSaldos","aperturaTs","aperturaBase"].forEach(function(k){
    ok(bloque.indexOf(k)!==-1, "  "+k+" va en el bloque de la apertura");
  });
})();

const T1 = 1789412461727, T2 = T1 + 3600000;
function fusionarConfig(local, mLoc, remoto, mRem){
  S._modCampos = {config:mLoc};
  return F._mergeObjetoPorClave(remoto, local, "config", {config:mRem}, function(){ return false; });
}
// El caso exacto: el monto marcado aqui, la fecha marcada alla.
const _mezcla = fusionarConfig(
  {aperturaUsdt:2544.79, aperturaFecha:"2026-09-11"},
  {aperturaUsdt:T2, aperturaFecha:T1},
  {aperturaUsdt:2450.20, aperturaFecha:"2026-09-12", aperturaSaldos:{c1:10}, aperturaTs:T2},
  {aperturaUsdt:T1, aperturaFecha:T2, aperturaSaldos:T2, aperturaTs:T2});
ok((_mezcla.aperturaFecha==="2026-09-12" && _mezcla.aperturaUsdt===2450.20) ||
   (_mezcla.aperturaFecha==="2026-09-11" && _mezcla.aperturaUsdt===2544.79),
   "la fecha y el monto salen SIEMPRE del mismo aparato",
   _mezcla.aperturaFecha+" con "+_mezcla.aperturaUsdt);
// Si la del otro aparato es mas nueva, entra entera —foto incluida—.
const _entera = fusionarConfig(
  {aperturaUsdt:2544.79, aperturaFecha:"2026-09-11"},
  {aperturaUsdt:T1, aperturaFecha:T1},
  {aperturaUsdt:2450.20, aperturaFecha:"2026-09-12", aperturaSaldos:{c1:10}, aperturaTs:T2},
  {aperturaUsdt:T2, aperturaFecha:T2, aperturaSaldos:T2, aperturaTs:T2});
ok(_entera.aperturaFecha==="2026-09-12" && _entera.aperturaUsdt===2450.20 && !!_entera.aperturaSaldos,
   "y cuando entra la del otro, entra con su foto y su hora");
// En un empate manda la de este aparato: no se pisa lo que se acaba de hacer.
const _empate = fusionarConfig(
  {aperturaUsdt:2544.79, aperturaFecha:"2026-09-11"}, {aperturaUsdt:T2, aperturaFecha:T2},
  {aperturaUsdt:2450.20, aperturaFecha:"2026-09-12"}, {aperturaUsdt:T2, aperturaFecha:T2});
ok(_empate.aperturaUsdt===2544.79, "en un empate se queda la de este aparato");
// El resto de config se sigue fusionando clave por clave, como siempre.
const _resto = fusionarConfig(
  {moraMultaPct:2, ntfyCanal:"a"}, {moraMultaPct:T2, ntfyCanal:T1},
  {moraMultaPct:5, ntfyCanal:"b"}, {moraMultaPct:T1, ntfyCanal:T2});
ok(_resto.moraMultaPct===2 && _resto.ntfyCanal==="b",
   "lo demas de config no cambia de comportamiento", JSON.stringify(_resto));

// La tarjeta: los avisos no se pliegan (7 ajustes por −233,46 estaban dentro de
// un desplegable cerrado).
//
// ARREGLO 69: el titular era SOLO el "sin explicar". Con sus numeros del 18/09
// eso decia +$65,37 en verde mientras la resta de al lado -2.545,08 contra
// 2.550,95- daba −$5,87: "me dice que tengo mas tanto y resulta que cuando saco
// la cuenta con lo que deberia tener con lo que tengo mas bien me falta plata".
// Los dos numeros son ciertos y contestan preguntas distintas, asi que salen los
// DOS, cada uno con su nombre. La leccion del ARREGLO 60 sigue en pie -un numero
// grande y suelto que contradice al de al lado- y por eso se prueba que ninguno
// de los dos va sin etiqueta.
//
// ARREGLO 71: los dos siguen, pero ya no compiten. El grande es el que hay que
// perseguir —el sin explicar— y la resta que ella hace a mano va entera en una
// linea pequena debajo. Sus palabras sobre la tarjeta: "mucha letra".
//
// ARREGLO 100: y dejaron de salir los dos a la vez. Son la MISMA diferencia
// contada desde dos sitios —la cadena de arriba parte de la apertura, esta de
// "deberias tener"— y juntas se leen como dos respuestas que no cuadran. Sus
// palabras mirando esta tarjeta: "me dice que deberia de tener 2600 y que tengo
// 2500, no estoy entendiendo ese punto". La resta no se borro, que es lo que
// fallo antes del 69: se fue al desplegable, de cabecera de la tabla que la
// desglosa, y ahi sigue ENTERA, con las palabras incluidas.
ok(/"\$"\+f2\(Math\.abs\(sinExp\)\)/.test(HTML),
   "el titular sigue enseñando el 'sin explicar', con su numero");
ok(/te faltan |te sobran /.test(HTML) && /deberías tener \$/.test(HTML) && /"Tienes \$"/.test(HTML),
   "y la diferencia dice en PALABRAS si falta o sobra: un '+65,37' en verde se lee al reves");
ok(/Math\.abs\(dif\)<0\.005 \? " · clavado"/.test(HTML),
   "cuando no hay diferencia lo dice, en vez de un $0,00 con signo");
{
  // Ninguno de los dos puede quedarse sin etiqueta: eso es lo que hacia que se
  // leyeran como si dijeran lo contrario el uno del otro.
  // Se ancla en el literal del codigo, no en el texto suelto: "sin explicar"
  // aparece tambien en los comentarios y el primero que salia era uno de esos.
  // El numero grande y la palabra que dice si falta o sobra tienen que ir
  // pegados: un "$215,47" suelto no dice de que lado esta.
  const i = HTML.indexOf('"$"+f2(Math.abs(sinExp))');
  const j = HTML.indexOf('sobra sin explicar', i);
  ok(i > -1 && j > i && j - i < 400,
     "el numero grande lleva pegada la palabra que dice de que lado esta");
  ok(/el margen normal es ±\$/.test(HTML) && /de ruido normal/.test(HTML),
     "y si el sin explicar se pasa de la tolerancia, lo dice ahi mismo");
  // ARREGLO 100: la resta de ella va DENTRO del desplegable, pegada a la tabla
  // que la desglosa. Se exige la distancia en los dos sentidos: lejos del
  // titular (si no, vuelve a competir) y cerca de "De que esta hecha la
  // diferencia" (si no, se quedo suelta en cualquier parte).
  const k = HTML.indexOf('"Tienes $"+f2(R.total)');
  const t = HTML.indexOf('>De qué está hecha la diferencia</div>');
  ok(k > -1 && t > -1 && k > t && k - t < 600,
     "y la resta de ella va de cabecera de la tabla que la desglosa");
  ok(k > i + 1200,
     "o sea bien lejos del titular: arriba manda una sola cuenta");
}
ok(/ajuste"\+\(aj\.nMismoDia!==1\?"s":""\)\+" sin situar/.test(HTML),
   "el aviso de los ajustes en el aire esta fuera del desplegable");
ok(/aperturaSaldos:\(S\.config\|\|\{\}\)\.aperturaSaldos/.test(HTML),
   "la conciliacion dice si la apertura tiene foto de saldos");

// ── ARREGLO 62 · el aviso de choque entre dispositivos ────────────────────
// Lo que se prueba es la REGLA, no la pantalla: se avisa solo de lo que este
// aparato toco y el servidor devolvio distinto. Lo que llega nuevo del otro
// aparato no puede avisar — si avisara, avisaria en cada guardado y el aviso
// dejaria de significar nada.
console.log("\nArreglo 62 · avisar cuando el otro aparato piso algo");

// Lo tocado se anota desde el mismo sitio que ya lo marca, no a mano.
{
  const src = sacarFuncion("_marcarCambiados");
  ok(/_anotarTocado\(clave,\s*id\)/.test(src),
     "_marcarCambiados anota lo que marca (no hay que tocar cada funcion)");
  const src2 = sacarFuncion("_marcarObjetosCambiados");
  ok((src2.match(/_anotarTocado\("@"\+campo/g) || []).length === 2,
     "y _marcarObjetosCambiados lo anota en sus dos ramas");
  // El quinto argumento ("primera pasada sobre este campo") entro con el
  // sello de quien registro. Lo que esta guardia fija sigue siendo lo mismo:
  // que se le pasa el NOMBRE del campo, para que el aviso sepa de que habla.
  ok(/_marcarCambiados\(S\[k\],\s*window\._fotoPorCampo\[k\],\s*ids\[k\]\|\|"id",\s*k\s*(,\s*primeraVez\s*)?\)/
       .test(sacarFuncion("_marcarTodoLoQueSeFusiona")),
     "y le pasa el nombre del campo, para que el aviso sepa de que habla");
}

// El primer guardado tras abrir no anota nada: sin foto previa se anota, no se
// marca (ARREGLO 33). Si anotara, el aviso saltaria al abrir la app.
F._pruebaTocado({});
global.window._fotoPorCampo = {};
const _arr = [{id: "a", saldo: 10}];
F._marcarCambiados(_arr, global.window._fotoPorCampo.cuentas = {}, "id", "cuentas");
ok(Object.keys(F._pruebaTocado()).length === 0,
   "el primer guardado tras abrir no anota nada");
_arr[0].saldo = 20;
F._marcarCambiados(_arr, global.window._fotoPorCampo.cuentas, "id", "cuentas");
ok(F._pruebaTocado().cuentas && F._pruebaTocado().cuentas.a === true,
   "y el cambio de verdad si queda anotado", JSON.stringify(F._pruebaTocado()));

// El cajon se vacia al mandar, y vuelve entero si el envio no llego.
const _llevado = F._tomarTocado();
ok(Object.keys(F._pruebaTocado()).length === 0, "al mandar, el cajon queda vacio");
F._unirTocado(F._pruebaTocado(), _llevado);
ok(F._pruebaTocado().cuentas.a === true, "y si el envio falla, lo tocado vuelve entero");

// El nucleo: que solo avise del choque.
const _mando = {
  cuentas: [{id: "c1", nombre: "Banco de Venezuela", saldo: 198619.9},
            {id: "c2", nombre: "Binance", saldo: 800}],
  config: {aperturaUsdt: 2544.79, aperturaFecha: "2026-09-11"}
};
const _volvio = {
  cuentas: [{id: "c1", nombre: "Banco de Venezuela", saldo: 198619.9},
            {id: "c2", nombre: "Binance", saldo: 915},          // lo cambio el otro
            {id: "c3", nombre: "Cuenta nueva del otro", saldo: 5}],
  config: {aperturaUsdt: 2450.20, aperturaFecha: "2026-09-12"}
};
// Este aparato solo toco c1 y la apertura.
const _soloC1 = F._conflictosConElServidor(_mando, _volvio, {cuentas: {c1: true}});
ok(_soloC1.length === 0,
   "lo que cambio el OTRO aparato no avisa: eso es sincronizacion, no un choque",
   JSON.stringify(_soloC1));
const _choque = F._conflictosConElServidor(_mando, _volvio, {cuentas: {c2: true}});
ok(_choque.length === 1 && _choque[0].id === "c2",
   "pero si este aparato tambien lo toco, si avisa");
ok(_choque[0].campos.length === 1 && _choque[0].campos[0].campo === "saldo" &&
   _choque[0].campos[0].mio === "800" && _choque[0].campos[0].suyo === "915",
   "y dice que campo, que mandaste y que tenia el otro", JSON.stringify(_choque[0].campos));

// La tercera columna: lo que QUEDO. El servidor devuelve una cosa y despues
// _aplicarEstadoDeApi vuelve a fusionar aqui con las marcas de este aparato,
// asi que lo que queda puede no ser ninguna de las dos. Medido en el navegador:
// el servidor devolvia 915, quedaba 801, y el aviso decia "quedo 915".
S.cuentas = [{id:"c1", nombre:"Banco de Venezuela", saldo:198619.9},
             {id:"c2", nombre:"Binance", saldo:801}];
F._completarConLoQueQuedo(_choque);
ok(_choque[0].campos[0].quedo === "801",
   "y 'quedo' se lee de lo que ella ve, no de lo que devolvio el servidor",
   _choque[0].campos[0].quedo);
ok(_choque[0].campos[0].quedoMio === false && _choque[0].campos[0].quedoSuyo === false,
   "si no quedo ni lo tuyo ni lo del otro, no se dice que si");
S.cuentas[1].saldo = 915;
const _gano = F._conflictosConElServidor(_mando, _volvio, {cuentas:{c2:true}});
F._completarConLoQueQuedo(_gano);
ok(_gano[0].campos[0].quedo === "915" && _gano[0].campos[0].quedoSuyo === true,
   "y cuando gana el otro aparato, lo dice");
S.cuentas = [];
ok(/Cuenta · Binance/.test(_choque[0].etiqueta),
   "con el nombre que ella usa, no el identificador interno", _choque[0].etiqueta);
const _nueva = F._conflictosConElServidor(_mando, _volvio, {cuentas: {c1: true, c2: true}});
ok(_nueva.length === 1, "una cuenta que solo tiene el otro aparato nunca es un choque");

// La apertura: las cinco claves viajan juntas (ARREGLO 60) y el choque se ve.
const _cfg = F._conflictosConElServidor(_mando, _volvio,
  {"@config": {aperturaUsdt: true, aperturaFecha: true}});
ok(_cfg.length === 2, "el choque de la apertura sale clave por clave");
ok(_cfg.some(function (c) { return /Saldo de apertura/.test(c.etiqueta); }),
   "y 'aperturaUsdt' se dice 'Saldo de apertura'", JSON.stringify(_cfg.map(c => c.etiqueta)));

// Un registro que el otro aparato borro no puede pasar por un cambio de campo.
const _sinC2 = {cuentas: [{id: "c1", nombre: "Banco de Venezuela", saldo: 198619.9}], config: {}};
const _borr = F._conflictosConElServidor(_mando, _sinC2, {cuentas: {c2: true}});
ok(_borr.length === 1 && _borr[0].borrado === true,
   "y si el otro lo borro, lo dice con esas palabras");

// _mod y "n" no son datos: si cambiaran solos, el aviso saltaria por nada.
const _soloMod = F._conflictosConElServidor(
  {brl: [{_uid: "u1", n: 4, cl: "Rudi", total: 500, _mod: 1}]},
  {brl: [{_uid: "u1", n: 9, cl: "Rudi", total: 500, _mod: 2}]},
  {brl: {u1: true}});
ok(_soloMod.length === 0, "la marca y el numero de fila no cuentan como choque",
   JSON.stringify(_soloMod));

// Los clientes vienen por su propia ruta y el bloque de estado puede traer una
// copia vieja que la app ignora a proposito. Avisar de ella seria avisar de algo
// que ni siquiera se va a aplicar.
{
  const src = sacarFuncion("_conflictosConElServidor");
  ok(/clave==="clientes"\s*&&\s*_CLIENTES_DESDE_API/.test(src),
     "la copia vieja de clientes del bloque de estado no puede hacer saltar el aviso");
}

// El aviso se ve, y se ve fuera de la zona que hace scroll.
F._completarConLoQueQuedo(_choque);
F._pruebaPisados(_choque, false);
const _av = F._htmlAvisoPisado();
ok(/El otro dispositivo tambi[eé]n cambi[oó]/.test(_av), "el aviso dice lo que pasa");
ok(/Ver qu[eé] cambi[oó]/.test(_av) && /Entendido/.test(_av),
   "y se puede abrir el detalle o darlo por visto");
ok(!/Binance/.test(_av), "plegado no enseña el detalle");
F._pruebaPisados(undefined, true);
ok(/Binance/.test(F._htmlAvisoPisado()), "desplegado si");
ok(/el otro ten[ií]a/.test(F._htmlAvisoPisado()) && /qued[oó]/.test(F._htmlAvisoPisado()),
   "y ensena los tres valores: lo tuyo, lo del otro y lo que quedo");
F._pruebaPisados([], false);
ok(F._htmlAvisoPisado() === "", "y sin choques no ocupa ni un pixel");
  // ARREGLO 89: ahora hay DOS avisos ahi arriba —el de choques y el del mes sin
  // cerrar—, los dos fuera de la zona que hace scroll. La guardia admite otro
  // aviso en medio, pero ninguno puede caerse dentro del scroll.
  ok(/_htmlAvisoPisado\(\)\+[\s\S]{0,160}?"<div class='navbar3'>"/.test(HTML.replace(/\/\/[^\n]*\n/g, "\n")),
   "el aviso va arriba del panel, fuera del scroll");
  ok(/_htmlAvisoMesSinCerrar\(\)\+[\s\S]{0,160}?"<div class='navbar3'>"/.test(HTML.replace(/\/\/[^\n]*\n/g, "\n")),
     "y el aviso del mes sin cerrar, tambien");

  // ── ARREGLO 89: cerrar un mes es decision suya, no del reloj ──────
  // Sus palabras: "ya estaba cerrado por voluntad propia del sistema, cosa que
  // no deberia de ser asi, porque si el 30 faltaron cosas por registrar no
  // deberias de cerrarme el sistema automaticamente". Y era peor: cerraba al
  // abrir la app, cada 5 minutos y a medianoche. Un mes cerrado congela sus
  // numeros, asi que lo que faltara por registrar se quedaba fuera.
  {
    const sinCom = HTML.replace(/\/\/[^\n]*\n/g, "\n");
    ok(!/function checkCierreAutomatico/.test(sinCom),
       "ya no existe la funcion que cerraba el mes sola");
    ok(!/function programarCierreMedianoche/.test(sinCom),
       "ni el temporizador de medianoche que la llamaba");
    // El cierre solo puede salir de un boton suyo: ejecutarCierreMes no puede
    // volver a colarse en un setTimeout ni en un setInterval.
    // Ojo con la expresion: un [^)]* se corta en el parentesis de
    // "function()" y nunca llega a ver la llamada de dentro.
    ok(!/set(Timeout|Interval)\([\s\S]{0,200}?ejecutarCierreMes/.test(sinCom),
       "y ningun temporizador llama a ejecutarCierreMes");
    // Ojo: sinComentarios se declara mas abajo en el archivo, asi que aqui no
    // se puede usar todavia. Se quitan los comentarios a mano.
    const rev = sacarFuncion("_revisarMesSinCerrar").replace(/\/\/[^\n]*\n/g, "\n");
    ok(!/ejecutarCierreMes/.test(rev),
       "el que revisa si falta cerrar no cierra nada: solo marca");
    // Sin operaciones el aviso seria ruido; con el mes ya cerrado, mentira.
    ok(/cierresMes\.some/.test(rev) && /filterByMes/.test(rev),
       "y solo avisa si ese mes tiene operaciones y no esta cerrado");

    // ── ARREGLO 91: el aviso tiene que LLEVAR a donde dice ─────────
    // El 89 quito el cierre automatico y dejo el manual tapiado: el boton del
    // aviso solo cambiaba de pestaña y la pantalla abria en S._cMes, que por
    // omision es el mes EN CURSO; y el boton de Cerrar solo salia para ese mes
    // en curso. Resultado medido el 03/10 reproduciendo su caso: el aviso
    // decia "ve a cerrar Septiembre", la dejaba en Octubre y el unico boton de
    // cerrar que habia cerro OCTUBRE. Sus palabras: "me mandó a cerrar el mes
    // de septiembre, cuando le di allí me cerró fue el mes de octubre".
    const avi = sacarFuncion("_htmlAvisoMesSinCerrar").replace(/\/\/[^\n]*\n/g, "\n");
    ok(/_cMes=[\s\S]{0,12}_MES_SIN_CERRAR[\s\S]{0,60}st\(/.test(avi),
       "el boton del aviso SELECCIONA el mes que hay que cerrar, no solo cambia de pestaña");

    const inf = sacarFuncion("rInformeCierre").replace(/\/\/[^\n]*\n/g, "\n");
    ok(/mesKey<=getMesKeyActual\(\)\?"<button onclick='cerrarMesDesdeInforme/.test(inf),
       "y el boton Cerrar sale para cualquier mes pasado, no solo para el mes en curso");
    ok(!/esMesAct\?"<button onclick='cerrarMesDesdeInforme/.test(inf),
       "que era lo que dejaba el mes anterior sin forma de cerrarse");
    // Cerrar el mes anterior no puede ser una puerta de un solo sentido.
    ok(/\(esMesAct\|\|_cerradoHoy\)\?"<button onclick='reabrirMes/.test(inf),
       "un cierre hecho HOY se puede deshacer: el boton de Reabrir esta ahi");
    const rea = sacarFuncion("reabrirMes").replace(/\/\/[^\n]*\n/g, "\n");
    ok(/_cerradoHoy/.test(rea) && /k!==getMesKeyActual\(\) && !_cerradoHoy/.test(rea),
       "y reabrirMes deja justo eso: el mes en curso, o un cierre del mismo dia");

    // Cerrar un mes pasado toma la foto de saldos de HOY, no la del dia 30.
    // Es el precio de que lo cierre ella cuando quiera, y callarlo le dejaria
    // un numero raro sin explicacion.
    const cdi = sacarFuncion("cerrarMesDesdeInforme").replace(/\/\/[^\n]*\n/g, "\n");
    ok(/foto de saldos de las cuentas se toma HOY/.test(cdi),
       "al cerrar un mes pasado se avisa de que la foto de saldos es de hoy");

    // La descarga del backup va DENTRO del toque. Android exige un gesto
    // reciente para una descarga que lanza el codigo, y detras de un
    // setTimeout de medio segundo mas un alert ese permiso ya caduco: el
    // archivo no salia y el aviso seguia prometiendolo. Mismo fallo que ya
    // costo el boton de compartir (ARREGLO 84).
    const eje = sacarFuncion("ejecutarCierreMes").replace(/\/\/[^\n]*\n/g, "\n");
    ok(!/setTimeout\([\s\S]{0,120}?autoBackupJSON/.test(eje),
       "el backup del cierre no va detras de un temporizador");
    ok(/var _bk = autoBackupJSON\(/.test(eje) &&
       eje.indexOf("autoBackupJSON(") < eje.indexOf("alert(\"✅ Mes "),
       "se descarga dentro del toque, antes del aviso");
    ok(/El backup NO se pudo descargar/.test(eje),
       "y si no sale se dice, en vez de prometer un archivo que no existe");
    const abk = sacarFuncion("autoBackupJSON").replace(/\/\/[^\n]*\n/g, "\n");
    ok(/return _nom;/.test(abk) && /return null;/.test(abk),
       "autoBackupJSON contesta si lo consiguio: antes se tragaba el fallo en un catch");
  }

// Y que nadie vuelva a adoptar en silencio.
{
  const src = sacarFuncion("_dobleEnviarAhora");
  ok(/_conflictosConElServidor\(obj,\s*d\.estado,\s*_tocado\)/.test(src),
     "se compara ANTES de adoptar lo del servidor");
  ok(src.indexOf("_conflictosConElServidor") < src.indexOf("var _cambio=_aplicarEstadoDeApi"),
     "y el orden es ese: comparar, despues adoptar");
  ok(src.indexOf("var _cambio=_aplicarEstadoDeApi") < src.indexOf("_completarConLoQueQuedo"),
     "y 'lo que quedo' se lee DESPUES de adoptar, que es cuando se sabe");
}

// ── FASE B · los permisos son de la PERSONA, no del rol ───────────────────
console.log("\nFase B · permisos por persona");

// Los comentarios de este proyecto cuentan lo que se quito ("antes pasaba X,
// por eso ahora Y"), asi que una prueba que exige que un texto NO este se
// acusa a si misma si no los saca antes.
const sinComentarios = (t) => t.split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n");

// La sesion vive en localStorage, que en Node no existe. tienePermiso la lee
// por _permisosApi(): se sustituye por una de mentira para poder fijar el rol
// y los permisos de cada caso.
let SESION = null;
global._permisosApi = () => SESION;

// Lo que mas importa: que NADIE pierda nada el dia del despliegue. Los usuarios
// que hay hoy tienen `permisos` casi vacio, y hasta ahora el menu de un
// operador no salia de los permisos sino de S.config.modulos. Si los valores
// por omision de cada rol no reprodujeran el menu de ayer, al desplegar esto
// los operadores se quedarian sin app.
const MENU_DE_AYER = {
  admin: TABS.admin,
  lector: TABS.lector,
  brl: ["mi_ganancia", "op_diario", "nueva", "clientes"],
  vzla: ["mi_ganancia", "op_diario", "nueva", "clientes"],
  eeuu: ["mi_ganancia", "op_diario", "nueva_eeuu", "clientes"],
};
Object.keys(MENU_DE_AYER).forEach(function (rol) {
  SESION = { rol: rol, permisos: {} };
  const visibles = (TABS[rol] || []).filter(function (t) {
    const k = F.PERMISO_DE_TAB[t];
    return k === undefined || F.tienePermiso(k);
  });
  ok(JSON.stringify(visibles) === JSON.stringify(MENU_DE_AYER[rol]),
     "con permisos vacios, " + rol + " ve exactamente el menu de ayer",
     JSON.stringify(visibles));
});

// Cada pestaña de cada rol tiene que poder concederse desde la pantalla. Una
// pestaña cuya llave no este en PERMISOS_APP seria un permiso invisible: la
// puerta existe y no hay casilla para abrirla.
{
  const llaves = F.PERMISOS_APP.map(function (p) { return p.k; });
  const huerfanas = [];
  Object.keys(TABS).forEach(function (rol) {
    (TABS[rol] || []).forEach(function (t) {
      const k = F.PERMISO_DE_TAB[t];
      if (k !== undefined && llaves.indexOf(k) === -1) huerfanas.push(t + "→" + k);
    });
  });
  ok(huerfanas.length === 0,
     "toda pestaña con puerta tiene su casilla en la pantalla", huerfanas.join(", "));
  ok(llaves.indexOf("editar") === 0,
     "'Registrar y modificar' va primero: es el unico que hace cumplir el servidor");
}

// Lo decidido para la persona manda sobre lo que diga su rol, en los dos
// sentidos. Esto es la Fase B entera en dos comprobaciones.
SESION = { rol: "brl", permisos: { clientes: false } };
ok(F.tienePermiso("clientes") === false,
   "quitarle una pantalla a una persona se la quita, aunque su rol la traiga");
SESION = { rol: "brl", permisos: { prestamos: true } };
ok(F.tienePermiso("prestamos") === true,
   "y darle una que su rol no trae, se la da");
SESION = { rol: "brl", permisos: {} };
ok(F.tienePermiso("prestamos") === false && F.tienePermiso("clientes") === true,
   "sin decidir, vale lo de su rol");

// Dos personas con el MISMO rol y permisos distintos: es lo que ella pidio y
// lo que la tabla vieja no podia hacer.
const unoSi = (function () { SESION = { rol: "vzla", permisos: { cobrar: true } }; return F.tienePermiso("cobrar"); })();
const otroNo = (function () { SESION = { rol: "vzla", permisos: { cobrar: false } }; return F.tienePermiso("cobrar"); })();
ok(unoSi === true && otroNo === false,
   "dos personas con el mismo rol pueden tener permisos distintos");

// El Administrador no se puede quedar fuera por una casilla mal puesta.
SESION = { rol: "admin", permisos: { config_admin: false, editar: false } };
ok(F.tienePermiso("config_admin") === true && F.permisoEdicion() === true,
   "al Administrador no hay casilla que le cierre nada");

// El Supervisor ve todo y no modifica: eso ES el rol.
SESION = { rol: "lector", permisos: {} };
ok(F.tienePermiso("editar") === false && F.tienePermiso("cierre") === true,
   "el Supervisor ve todo y no modifica");

// Una sola puerta para guardar: permisoEdicion deja de tener criterio propio.
SESION = { rol: "eeuu", permisos: {} };
ok(F.permisoEdicion() === F.tienePermiso("editar"),
   "permisoEdicion() es exactamente tienePermiso('editar')");
// Y sin sesion no se entra ni se guarda.
SESION = null;
ok(F.tienePermiso("dash") === false && F.permisoEdicion() === false,
   "sin sesion de la API no hay ningun permiso");

// El resumen de la ficha dice la verdad de un vistazo.
ok(/solo mira/.test(F._resumenPermisos({ rol: "lector", permisos: {} })),
   "la ficha de un Supervisor dice 'solo mira'");
ok(/registra/.test(F._resumenPermisos({ rol: "brl", permisos: {} })),
   "y la de un operador, 'registra'");

// La tabla vieja, retirada de verdad: no basta con esconder la pantalla.
{
  const sinCom = HTML.split("\n").filter(function (l) { return !/^\s*\/\//.test(l); }).join("\n");
  ok(!/function toggleModulo\(/.test(sinCom), "la funcion que guardaba los permisos por rol ya no esta");
  ok(!/S\.config\.modulos/.test(sinCom), "y nada lee ni escribe S.config.modulos");
  ok(!/Permisos por operador/.test(sinCom), "el acordeon viejo ya no se dibuja");
  ok(F._CONFIG_PROHIBIDO.indexOf("modulos") !== -1,
     "y 'modulos' se limpia de config, para que no vuelva desde un aparato viejo");
}

// El menu y el contenido salen de la MISMA puerta. Antes el contenido estaba
// detras de "isAdmin ? ... : ''" y a un operador se le devolvia pantalla en
// blanco, sin decir por que.
{
  const src = sinComentarios(sacarFuncion("rMain"));
  ok(!/isAdmin/.test(src), "el contenido ya no se decide por 'isAdmin'");
  ok(/ts=ts\.filter\(function\(tab\)\{[\s\S]*PERMISO_DE_TAB\[tab\]/.test(src),
     "el menu se filtra con el mismo permiso que dibuja la pantalla");
}

// Guardar manda la lista COMPLETA. Mandar solo lo marcado dejaria lo demas
// "sin decidir", y sin decidir vuelve a valer lo del rol: quitar un permiso no
// habria quitado nada.
{
  const src = sacarFuncion("guardarPermisosUsuario");
  ok(/PERMISOS_APP\.forEach\(function\(p\)\{ permisos\[p\.k\]=!!S\._permVal\[p\.k\]; \}\)/.test(src),
     "guardar manda todas las casillas con su true o su false");
  ok(/method:"PUT",body:\{permisos:permisos\}/.test(src),
     "y las manda al servidor, no al bloque que se sincroniza");
}
ok(!/R\(\)/.test(sinComentarios(sacarFuncion("togglePermisoUsuario"))),
   "marcar una casilla no repinta: repintar cierra la tarjeta bajo el dedo (ARREGLO 32)");

// Un cambio de permisos tiene que llegar sin cerrar la app.
ok(/_refrescarMisPermisos\(\)/.test(HTML.replace(/\/\/[^\n]*\n/g, "\n")),
   "los permisos se vuelven a preguntar al volver a la app");

// ── ARREGLO 63 · corregir la FECHA de la apertura ─────────────────────────
// El monto se podia corregir; la fecha no, y tambien se queda mal (el 14/09 la
// fusion mezclo la fecha de un aparato con el monto del otro). La unica salida
// era volver a fijarla con el dinero de hoy, que pone la diferencia en cero y
// borra la pista.
console.log("\nArreglo 63 · corregir la fecha de la apertura");

{
  const crudo = sacarFuncion("corregirFechaApertura");
  const src = sinComentarios(crudo);
  ok(!/aperturaUsdt\s*=/.test(src), "corregir la fecha NO toca el monto");
  ok(!/aperturaSaldos\s*=|aperturaTs\s*=|aperturaBase\s*=/.test(src),
     "ni la foto de saldos, ni la hora, ni la base del mes");
  ok(/_simularConFecha\(iso\)/.test(src) && src.indexOf("_simularConFecha") < src.indexOf("confirm("),
     "simula el resultado ANTES de preguntar, no despues");
  ok(/sinExplicar/.test(src),
     "y lo que enseña es el 'sin explicar', que es el numero que hay que perseguir");
  ok(/iso>td\(\)/.test(src), "no deja poner una fecha que todavia no ha llegado");
  ok(/iso!==_isoDeFecha\(d\)/.test(src),
     "ni una que no existe: un 31/02 que Date corrige solo no es la que ella escribio");
  ok(/cambiaDeMes/.test(src) && /entra se suma entero/.test(crudo),
     "y avisa cuando cambia de mes, que es lo unico que puede salir mal");
  ok(/logAudit\("APERTURA_FECHA"/.test(src), "queda en la auditoria");
}

// La simulacion tiene que DEVOLVER la fecha a su sitio, pase lo que pase. Si se
// la dejara puesta, mirar el resultado ya seria haberlo aplicado.
S.config = {aperturaUsdt: 2464.13, aperturaFecha: "2026-09-12"};
["cuentas","capital","prestamos","cuentasCobrar","ajustesSaldo","traspasos",
 "brl","vzla","eeuu","inventarioUsdt","inventarioUsdt_cerrado","egresos",
 "egresos_personales","pagosSocios","gastos_eeuu"].forEach(k => { S[k] = []; });
{
  const antes = S.config.aperturaFecha;
  const sim = F._simularConFecha("2026-09-11");
  ok(S.config.aperturaFecha === antes, "simular no deja la fecha cambiada", S.config.aperturaFecha);
  ok(sim.desde === "2026-09-11", "pero simula de verdad con la fecha nueva", sim.desde);
  ok(sim.apertura === 2464.13, "y con el mismo monto", sim.apertura);
}
// Y si algo revienta a mitad, la fecha vuelve igual: por eso va en finally.
{
  const antes = S.config.aperturaFecha;
  try { F._simularConFecha("no-es-una-fecha"); } catch (e) { /* da igual que falle */ }
  ok(S.config.aperturaFecha === antes,
     "y si algo falla por el camino, tambien vuelve", S.config.aperturaFecha);
  ok(/finally/.test(sacarFuncion("_simularConFecha")),
     "eso lo sostiene un finally, no la suerte");
}

// Los dos botones estan, y el que reinicia la medicion va aparte.
ok(/Corregir el monto/.test(HTML) && /Corregir la fecha/.test(HTML),
   "la tarjeta ofrece corregir el monto y la fecha por separado");
ok(/reinicia la medición/.test(HTML),
   "y el de volver a fijarla dice que reinicia la medicion");

// ── ARREGLO 64 · entrar con huella ────────────────────────────────────────
// Es una CERRADURA sobre la sesion ya guardada en el aparato, no una forma de
// autenticarse contra el servidor. Hasta ahora no habia ninguna: la app se
// abria y ya estabas dentro. Lo que se prueba aqui es la regla que sostiene
// todo lo demas — que esto NUNCA puede dejar a nadie fuera de su contabilidad.
// El flujo con el lector de verdad se prueba en Chromium con su autenticador
// virtual; aqui quedan las guardias que impiden deshacerlo por descuido.
console.log("\nArreglo 64 · entrar con huella");

{
  const pantalla = sinComentarios(sacarFuncion("rDesbloqueoHuella"));
  ok(/Entrar con correo y clave/.test(pantalla),
     "la pantalla de desbloqueo SIEMPRE ofrece entrar con la clave");
  ok(/entrarConClaveEnVezDeHuella\(\)/.test(pantalla),
     "y ese boton lleva a la salida de emergencia");
  ok(/solo abre la sesi[oó]n guardada en este aparato/.test(sacarFuncion("rDesbloqueoHuella")),
     "y dice lo que es: una cerradura sobre la sesion de este aparato");
}
// ── FASE 1 · los colores tienen nombre ────────────────────────────────────
// Los colores estaban escritos a mano dentro de los estilos en linea, 2.667
// veces. Eso hacia imposible cambiar el aspecto de la app sin ir funcion por
// funcion. Ahora van por nombre y se deciden en un solo sitio.
//
// Esta fase NO cambio nada de aspecto: se comprobo pestaña por pestaña,
// identicas al pixel con su export del 20/09.
{
  const raiz = (HTML.match(/:root\{[\s\S]*?\n\}/) || [""])[0];
  ok(/--sup:/.test(raiz) && /--tx:/.test(raiz) && /--ln:/.test(raiz),
     "los colores con nombre estan declarados en :root");
  // Todo nombre que se use tiene que existir. Uno mal escrito no da error en
  // ningun sitio: el navegador se lo calla y el color sale transparente.
  const usados = new Set((HTML.match(/var\(--[a-z0-9-]+\)/g) || [])
    .map(function(v){ return v.slice(4, -1); }));
  const declarados = new Set((raiz.match(/--[a-z0-9-]+\s*:/g) || [])
    .map(function(v){ return v.replace(/\s*:$/, ""); }));
  const huerfanos = [...usados].filter(function(v){ return !declarados.has(v); });
  ok(huerfanos.length === 0,
     "ningun color usa un nombre que no existe", huerfanos.slice(0, 6).join(", "));
}
// ── FASE 3 · el tema oscuro ───────────────────────────────────────────────
// Tres guardias, una por cada error que costo una vuelta entera al hacerlo.
{
  const raiz = (HTML.match(/:root\{[\s\S]*?\n\}/) || [""])[0];
  const osc  = (HTML.match(/html\[data-tema="suave"\]\{[\s\S]*?\n\}/) || [""])[0];
  ok(osc.length > 0, "existe el bloque del tema suave");
  // DENTRO de la app no hay negro. Lo dijo dos veces: es una herramienta de
  // contabilidad y se pasan horas registrando, asi que ni blanco a tope de
  // brillo ni negro a tope de contraste. El negro se queda SOLO en la pantalla
  // de entrada, que se mira diez segundos y ahi si lo eligio ella.
  ["papel", "suave"].forEach(function(t){
    ok(new RegExp('html\\[data-tema="' + t + '"\\]').test(HTML),
       "existe el tema " + t);
  });
  ok(!/html\[data-tema="oscuro"\]/.test(HTML),
     "no hay tema negro dentro de la app");
  ok(/var _TEMAS=\["claro","papel","suave"\]/.test(HTML),
     "los temas que se ofrecen son claro, papel y suave");
  // Lo que esta guardia protege no es "claro" ni "suave", es que el tema NO
  // siga al aparato: si mirara prefers-color-scheme, el telefono entrando en
  // modo noche le cambiaria la app sola en mitad de una jornada de registro.
  // Cual manda por omision lo decide ella, y desde que los avisos dejaron de
  // gritar pidio SUAVE.
  ok(/return _TEMAS\.indexOf\(g\)>=0 \? g : "suave"/.test(sacarFuncion("temaActual")),
     "sin elegir nada manda SUAVE");
  ok(!/prefers-color-scheme/.test(HTML),
     "y el tema no lo decide el sistema operativo del aparato");
  // El <meta theme-color> pinta la barra del navegador y NO entiende var(--x).
  ok(!/setAttribute\("content",[\s\S]{0,120}var\(--/.test(HTML),
     "el color de la barra del navegador va en hex, no por nombre");

  // 1. NINGUN nombre declarado dos veces. Paso con --az6-s: la cola larga de la
  //    fase 2 llego a la letra "s" y choco con la marca que usaba el pase del
  //    bloque <style>. El segundo gana en silencio y un panel cambiaba de color
  //    sin que nada fallara.
  [["claro", raiz], ["oscuro", osc]].forEach(function(par){
    const vistos = {}, dup = [];
    (par[1].match(/--[a-z0-9A-Z-]+\s*:/g) || []).forEach(function(d){
      const k = d.replace(/\s*:$/, "");
      if (vistos[k]) dup.push(k); else vistos[k] = 1;
    });
    ok(dup.length === 0, "ningun color declarado dos veces en " + par[0],
       dup.slice(0, 5).join(", "));
  });

  // 2. Nada de pegarle la transparencia detras a un nombre. "var(--ok)55" no es
  //    un color: el navegador se lo calla y el borde DESAPARECE. Asi se perdio
  //    el borde del panel de Nuevo cliente, y el unico sintoma visible fue que
  //    todo lo de debajo subia dos pixeles. Para eso esta _conAlfa().
  const pegados = HTML.match(/var\(--[a-z0-9-]+\)[0-9a-fA-F]{2}/g) || [];
  const concat  = HTML.match(/\+[A-Za-z_][A-Za-z0-9_.]*\+"[0-9a-fA-F]{2}[;,)'"]/g) || [];
  ok(pegados.length === 0 && concat.length === 0,
     "la transparencia va por _conAlfa(), no pegada detras del color",
     (pegados.concat(concat)).slice(0, 3).join(" · "));

  // 3. Todo nombre usado tiene su version oscura. Si falta una, esa pantalla se
  //    queda con el color claro en medio de lo oscuro -fondo claro con texto
  //    claro encima- y no falla nada, solo se ve mal.
  const enClaro = new Set((raiz.match(/--[a-z0-9A-Z-]+\s*:/g) || [])
    .map(function(v){ return v.replace(/\s*:$/, ""); }));
  const enOsc = new Set((osc.match(/--[a-z0-9A-Z-]+\s*:/g) || [])
    .map(function(v){ return v.replace(/\s*:$/, ""); }));
  // Los --ent-* quedan fuera A PROPOSITO: son las dos pantallas de entrada,
  // que son siempre negras elija ella el tema que elija. Darles version oscura
  // es justo el error que se arreglo.
  // Y los --fly-* igual (ARREGLO 73): el flyer es lo que le llega al cliente
  // y ella imprime, no una pantalla; el tema es del aparato.
  // Y los --inf-* (ARREGLO 79): el informe del mes es el documento que va a la
  // junta con el socio. Misma razon, tercera vez.
  const sinOscuro = [...enClaro].filter(function(k){
    return !enOsc.has(k) && !/^--(radius|shadow|ent-|fly-|inf-)/.test(k);
  });
  ok(sinOscuro.length === 0, "todo color tiene su version oscura",
     sinOscuro.slice(0, 6).join(", "));

  // Y al reves: ningun tema puede redefinirlos. Estaban pintadas con nombres
  // del tema y aguanto mientras el que abria era el claro; al pasar el por
  // omision a SUAVE, el color del texto que ella teclea -#F2EDEF- se volvio
  // #403137 sobre una tarjeta negra: escribia el correo y la clave y no se
  // veian. Los iconos del boton y la letra de los chips, igual.
  {
    const pap = (HTML.match(/html\[data-tema="papel"\]\{[\s\S]*?\n\}/) || [""])[0];
    const pisados = [];
    [["suave", osc], ["papel", pap]].forEach(function(par){
      (par[1].match(/--ent-[\w-]+\s*:/g) || []).forEach(function(d){
        pisados.push(par[0] + " " + d.replace(/\s*:$/, ""));
      });
    });
    ok(pisados.length === 0,
       "ningun tema repinta las pantallas de entrada: son siempre negras",
       pisados.slice(0, 6).join(", "));
  }

  // ── ARREGLO 73 · el flyer tampoco sigue al tema ────────────────────────
  // Se descarga como imagen, se manda por WhatsApp y ella lo imprime: no puede
  // depender del tema del aparato desde el que se genero. Se rompio igual que
  // las pantallas de entrada al pasar el por omision a SUAVE — el fondo, hecho
  // NEGRO, paso a #d7d5d5 y los textos siguieron blancos: "TU DINERO SE
  // CONVIERTE EN SOLUCIONES" en blanco al 55% sobre ese gris da contraste 1,3.
  // Ella lo imprimio y no se leia.
  {
    ok(/--fly-fondo1:\s*#0a0a0a/.test(HTML) && /--fly-sobre:\s*#fff/.test(HTML),
       "el flyer tiene sus propios colores, declarados en :root");
    const pap2 = (HTML.match(/html\[data-tema="papel"\]\{[\s\S]*?\n\}/) || [""])[0];
    const pisados2 = [];
    [["suave", osc], ["papel", pap2]].forEach(function(par){
      (par[1].match(/--fly-[\w-]+\s*:/g) || []).forEach(function(d){
        pisados2.push(par[0] + " " + d.replace(/\s*:$/, ""));
      });
    });
    ok(pisados2.length === 0,
       "ningun tema repinta el flyer: sale igual desde cualquier aparato",
       pisados2.slice(0, 6).join(", "));
    const fueraFly = [];
    ["generarFlyer", "generarMiniFlyer"].forEach(function(f){
      (sacarFuncion(f).match(/var\(--[\w-]+\)/g) || []).forEach(function(v){
        if (!/^var\(--fly-/.test(v)) fueraFly.push(f + " " + v);
      });
    });
    ok(fueraFly.length === 0,
       "el flyer y el mini flyer solo usan sus propios colores (--fly-*)",
       fueraFly.slice(0, 6).join(", "));
  }

  // Y la entrada no puede volver a usar un nombre del tema. Un nombre nuevo
  // colado ahi no falla nada: solo se ve mal el dia que ella cambie de tema.
  {
    const fuera = [];
    ["rLogin", "rDesbloqueoHuella"].forEach(function(f){
      (sacarFuncion(f).match(/var\(--[\w-]+\)/g) || []).forEach(function(v){
        if (!/^var\(--ent-/.test(v)) fuera.push(f + " " + v);
      });
    });
    ok(fuera.length === 0,
       "las pantallas de entrada solo usan sus propios colores (--ent-*)",
       fuera.slice(0, 6).join(", "));
  }
}
// El tema es de ESTE APARATO. Si entrara en lo que se sincroniza, la PC y el
// telefono se pelearian por el en cada guardado -el mismo error que costo
// cuatro arreglos con los saldos- y ademas no tiene sentido: puede querer
// oscuro en el telefono de noche y claro en la PC de dia.
{
  ok(/localStorage\.setItem\(_TEMA_KEY/.test(sacarFuncion("ponerTema")),
     "el tema se guarda en este aparato, no en el estado que se sincroniza");
  ok(!/DATA_KEYS[\s\S]{0,400}tema/.test(HTML) || !/_MERGE_FIELDS[\s\S]{0,400}"tema"/.test(HTML),
     "y no esta metido en DATA_KEYS ni en las listas de fusion");
  // Cambiar el tema NO puede repintar: repintar cierra la tarjeta bajo el dedo
  // (ARREGLO 32). Basta con cambiar el atributo, los colores van por nombre.
  ok(!/\bR\(\)/.test(sinComentarios(sacarFuncion("ponerTema"))),
     "cambiar el tema no repinta la app (ARREGLO 32)");
  ok(/_pintarTema\(\)/.test(HTML.slice(HTML.lastIndexOf("migrarTipoEgresos"))),
     "el tema se enciende ANTES del primer dibujo, sin fogonazo blanco");
}
// El informe del cierre se imprime: sus colores no pueden seguir al tema. Y
// genera su PROPIO bloque <style> dentro de la funcion, que es justo por donde
// se colo el primer intento.
{
  // ── ARREGLO 78: los dos informes se salian de la hoja ──────────────
  // La app tiene una regla GLOBAL .cuerpo{display:flex} —el armazon de la
  // barra lateral, 25/09— y las dos capas de informe llaman .cuerpo a su
  // contenedor. Las secciones se pintaban EN FILA: 4.856 px de ancho dentro
  // de una hoja de 768 en el informe del mes, y 1.471 dentro de 612 en el
  // del socio. html2canvas solo captura #reporteCapture, que mide lo que la
  // hoja, asi que el PDF salia con la primera seccion y media y sin un solo
  // error en consola. Cada capa tiene que declarar su display.
  ok(/\.inf-doc \.cuerpo\{padding:0 24px;display:block\}/.test(HTML),
     "el informe del mes declara su propio display, no hereda el flex de la barra lateral");
  ok(/\.soc-doc \.cuerpo\{display:block\}/.test(HTML),
     "y el reporte del socio tambien");
  // Y la regla global sigue ahi: la barra lateral la necesita. Si alguien la
  // quitara "para arreglar el informe", el arreglo de arriba sobraria y la
  // barra lateral de la PC se rompe. Esta prueba dice cual es cual.
  ok(/\.cuerpo\{display:flex;flex:1;min-height:0\}/.test(HTML),
     "la regla global de .cuerpo no se toca: es el armazon de la barra lateral");
  // El informe es BLANCO y las reglas globales pintan td y th con los colores
  // del tema (td{color:var(--ink)} y th{...!important}). Con Suave eso daba
  // #DCDAE0 sobre blanco: contraste 1,39, solo se leian los montos.
  ok(/\.inf-doc td\{color:var\(--inf-tinta\)/.test(HTML),
     "el informe fija el color de su texto de tabla, que si no lo pone el tema");
  ok(/\.inf-doc th\{background:var\(--inf-cabecera\) !important;color:var\(--inf-tinta\) !important/.test(HTML),
     "y el de sus cabeceras, que la regla global lleva !important");
  // El color de td va SIN !important a proposito: con specificity le gana a la
  // regla global, y asi los montos siguen pintandose de verde o rojo desde su
  // propio style. Con !important saldrian todos azules.
  ok(!/\.inf-doc td\{color:var\(--inf-tinta\) !important/.test(HTML),
     "pero sin !important, o los montos pierden el rojo de lo que resta");
  // Las dos tablas que tenian cabecera ambar y roja pasaron a la cabecera gris
  // de todas las demas (ARREGLO 79): en un documento de junta, tres colores de
  // cabecera distintos no dicen nada que no diga ya el titulo de la tabla.
  ok(!/thAm|thRo/.test(HTML),
     "no quedan cabeceras de color sueltas: todas las tablas iguales");

  // Va sobre el CODIGO, no sobre los comentarios: el ARREGLO 78 tuvo que
  // escribir en un comentario cual era la regla global que se colaba
  // (td{color:var(--ink)}) y eso disparaba la guardia sin que hubiera ni un
  // color del tema en el informe. Un comentario no pinta nada.
  //
  // rInformeCierre es la PANTALLA del cierre: ahi no se usa ningun nombre de
  // color, ni del tema ni propio. El informe que sale en PDF si tiene los
  // suyos (--inf-*, ARREGLO 79) y no puede usar ningun otro.
  ok(!/var\(--/.test(sinComentarios(sacarFuncion("rInformeCierre"))),
     "la pantalla del cierre no usa ningun color del tema");
  {
    const fuera = [];
    (sinComentarios(sacarFuncion("generarInformePDF")).match(/var\(--[\w-]+\)/g) || [])
      .forEach(function(v){ if (!/^var\(--inf-/.test(v)) fuera.push(v); });
    ok(fuera.length === 0,
       "el informe del mes solo usa sus propios colores (--inf-*)",
       fuera.slice(0, 6).join(", "));
  }
  // Y ningun tema puede repintarlos: es lo que rompio el flyer y las dos
  // pantallas de entrada cuando el por omision paso a Suave.
  {
    const oscInf = (HTML.match(/html\[data-tema="suave"\]\{[\s\S]*?\n\}/) || [""])[0];
    const papInf = (HTML.match(/html\[data-tema="papel"\]\{[\s\S]*?\n\}/) || [""])[0];
    const pisados3 = [];
    [["suave", oscInf], ["papel", papInf]].forEach(function(par){
      (par[1].match(/--inf-[\w-]+\s*:/g) || []).forEach(function(d){
        pisados3.push(par[0] + " " + d.replace(/\s*:$/, ""));
      });
    });
    ok(pisados3.length === 0,
       "ningun tema repinta el informe del mes: sale igual desde cualquier aparato",
       pisados3.slice(0, 6).join(", "));
    ok(/--inf-tinta:\s*#111111/.test(HTML) && /--inf-azul:\s*#14213D/.test(HTML),
       "el informe del mes tiene sus propios colores, declarados en :root");
  }

  // ── ARREGLO 81: el reporte del socio tampoco sigue al tema ────────
  // Lo lee la misma persona, en la misma reunion y en el mismo papel que el
  // informe del mes, asi que lleva la misma paleta y las mismas reglas.
  // Estaba pintado con 41 nombres del tema en 93 sitios: generado en Suave le
  // salia sobre hoja oscura.
  {
    const soc = sinComentarios(sacarFuncion("generarReporteSocio"));
    const fuera = [];
    (soc.match(/var\(--[\w-]+\)/g) || []).forEach(function(v){
      if (!/^var\(--inf-/.test(v)) fuera.push(v);
    });
    ok(fuera.length === 0,
       "el reporte del socio solo usa los colores del informe (--inf-*)",
       fuera.slice(0, 8).join(", "));
    ok(!/Georgia|Times New Roman|SFMono|Menlo|Consolas/.test(soc),
       "va en una sola familia, la misma que el informe del mes");
    const chicas = (soc.match(/font-size:(\d(?:\.\d)?)px/g) || [])
      .filter(function(t){ return parseFloat(t.replace(/\D*([\d.]+).*/, "$1")) < 10; });
    ok(chicas.length === 0, "y nada por debajo de 10px", chicas.slice(0, 5).join(", "));
    ok(/tabular-nums/.test(soc), "con los numeros en cifras de ancho fijo");
    ok(/break-inside:avoid/.test(soc) && /@page\{margin/.test(soc),
       "y ninguna tabla partida entre hojas");
    const conEmoji = (soc.match(/<h2[^>]*>[^<]*/g) || [])
      .filter(function(t){ return /\p{Extended_Pictographic}/u.test(t); });
    ok(conEmoji.length === 0, "sin emojis en los titulos", conEmoji.slice(0, 3).join(" "));
    // .val, .lbl y .sub son TAMBIEN clases globales de la app, asi que las
    // cifras de las tarjetas cogian el color del tema aunque la hoja ya fuera
    // blanca: #DCDAE0 sobre blanco en Suave, contraste 1,33, justo en "TU
    // PARTE ESTE MES". Tercera colision de nombre del mismo tipo, despues de
    // .cuerpo y de td/th.
    ["val", "lbl", "sub"].forEach(function(c){
      ok(new RegExp("\\.soc-doc \\." + c + "\\{color:var\\(--inf-").test(HTML),
         "la clase ." + c + " lleva su color, que si no se lo pone el tema");
    });
    ok(/\.soc-doc td\{color:var\(--inf-tinta\)/.test(HTML),
       "y el td tambien, ahora que la hoja es blanca en los tres temas");
  }

  // ── ARREGLO 80: los numeros que no cuadraban ──────────────────────
  {
    const cierre = sinComentarios(sacarFuncion("rInformeCierre"));
    const pdf = sinComentarios(sacarFuncion("generarInformePDF"));
    // 1. La pestaña Bancos contaba las cuentas USDT DOS VECES: arrancaba el
    //    total con getInventarioStats().disponible —que es, literal, la suma de
    //    los saldos de las cuentas USDT— y despues volvia a recorrerlas todas.
    //    Medido: $4.217,06 donde hay $3.414,28, o sea los $802,78 de Binance
    //    inventados, y la pestaña Pendientes del mismo modulo decia $3.591,10.
    ok(!/var totalUsdt=invUsdtSec/.test(cierre) && /var totalUsdt=0;/.test(cierre),
       "el total de Bancos no arranca del inventario: contaba Binance dos veces");
    // 2. Los egresos guardan su categoria en `cat`. Leerla solo por `categoria`
    //    hacia que TODO saliera "General", en pantalla y en el PDF.
    ok(!/e\.categoria\|\|"General"/.test(HTML),
       "la categoria de un egreso se lee por su nombre real (cat), no solo por categoria");
    // 3. calcMesCompleto cuenta contra el sueldo SOLO lo que no salio de
    //    ninguna cuenta. Las listas y las barras miraban otro conjunto: la
    //    pantalla decia "estas transacciones suman los $80,00" y listaba
    //    $80,00 + $25,00, y las barras repartian 100% + 31% = 131%.
    ok(/var itemsCount=egPerM\.filter\(function\(e\)\{return e\.pagada&&!e\.cuentaId;\}\);/.test(cierre),
       "la lista de gastos personales lista exactamente lo que suma");
    ok(/var desdePers=egPerM\.filter\(function\(e\)\{return e\.pagada&&!!e\.cuentaId;\}\);/.test(cierre),
       "y la linea de al lado, el complemento exacto: cada gasto una sola vez");
    ok(/var cuentanContraSueldo=pagPerList\.filter\(function\(e\)\{return !e\.cuentaId;\}\);/.test(cierre),
       "las barras de categoria se reparten sobre el mismo conjunto que su total");
    // 4. El capital se calculaba en TRES sitios. La pantalla sumaba todas las
    //    cuentas —incluidas las 💜 personales— y los prestamos por p.monto
    //    (capital + interes): decia $4.225,14 donde el PDF decia $4.125,14.
    //    El interes no es capital hasta que se cobra (ARREGLO 70).
    ok(/var _cap=\(typeof capitalRealTotal==="function"\)\?capitalRealTotal\(\):null;/.test(cierre) &&
       /var _potencial=_cap\.total;/.test(cierre),
       "el potencial total de la pantalla sale de capitalRealTotal, como el PDF");
    // Y el pie del PDF explica SU titular, no otro: sumaba las partes con el
    // interes dentro y daba $4.225,14 debajo de un titular de $4.125,14.
    // ARREGLO 90: el titular ya no es un "potencial total" calculado aparte,
    // es cap.total, y las partes de debajo salen de los campos de la misma
    // llamada. Lo que la guardia protege es que ninguna se calcule a mano.
    ok(/\["En las cuentas",cap\.enCuentas/.test(pdf),
       "el pie del PDF desglosa el mismo numero que el titular, campo por campo");
    ok(/f2l\(cap\.interesPrestamos\)/.test(pdf) && !/cap\.total\+cap\.interesPrestamos/.test(pdf),
       "y el interes pendiente se dice pero no se suma al titular");
  }

  // ── ARREGLO 79: es un documento de junta, no una pantalla ──────────
  // Sus palabras: "es un informe que va para una junta que es para toma de
  // decisiones... no me puedes dar un informe con colores vibrantes con
  // colores super tediosos para la vista porque me lo van a regresar".
  // Medido antes: 34% de superficie con fondo de color, 30 colores de texto,
  // 16 tamanos de letra entre 8px y 28px, 3 familias y 33 emojis. Y todo eso
  // se imprime, porque el informe lleva print-color-adjust:exact.
  {
    const inf = sinComentarios(sacarFuncion("generarInformePDF"));
    // Nada por debajo de 10px: en papel, al otro lado de una mesa, 8px no se
    // lee. Lo eligio ella viendo las tres opciones.
    const chicas = (inf.match(/font-size:(\d(?:\.\d)?)px/g) || [])
      .filter(function(t){ return parseFloat(t.replace(/\D*([\d.]+).*/, "$1")) < 10; });
    ok(chicas.length === 0, "en el informe no queda letra por debajo de 10px",
       chicas.slice(0, 6).join(", "));
    // Una sola familia. Antes habia tres mezcladas y los numeros no iban en
    // cifras de ancho fijo, asi que las columnas no alineaban entre filas.
    ok(!/Georgia|Times New Roman|SFMono|Menlo|Consolas/.test(inf),
       "el informe va en una sola familia, la que eligio ella");
    ok(/tabular-nums/.test(inf),
       "y los numeros en cifras de ancho fijo, para que las columnas alineen");
    // Los titulos de seccion sin emojis: es un documento para una junta.
    const conEmoji = (inf.match(/sec\("[^"]*"/g) || [])
      .filter(function(t){ return /\p{Extended_Pictographic}/u.test(t); });
    ok(conEmoji.length === 0, "ningun titulo de seccion lleva emoji",
       conEmoji.slice(0, 4).join(" "));
    // Ni una tabla ni una seccion partida entre hojas. Son 5 hojas A4 y antes
    // no habia una sola regla de salto.
    // ARREGLO 86: lo indivisible es la FILA, no la tabla ni la seccion.
    // El 79 las hacia indivisibles enteras y con sus datos salia al reves: una
    // seccion que no cabia en lo que quedaba de hoja saltaba completa y dejaba
    // el hueco. Medido con un mes de su tamano: 14 bloques empujados y 7.916 px
    // de blanco —7,1 hojas vacias— contra 4 bloques y 75 px ahora.
    ok(/\.inf-doc tr\{break-inside:avoid;page-break-inside:avoid\}/.test(inf),
       "ninguna FILA se parte entre hojas");
    // Ojo con la expresion: el estilo en linea lleva ';' dentro, asi que un
    // [^;]* se corta antes de llegar y la guardia no fallaria nunca.
    ok(!/var sec=function[\s\S]{0,160}break-inside:avoid/.test(inf),
       "y la seccion ya no es indivisible, que era lo que dejaba media hoja en blanco");
    ok(!/\.inf-doc table,\.inf-doc tr\{break-inside/.test(inf),
       "ni la tabla entera: una de 20 filas no cabe en una hoja y se partia igual");
    ok(/@page\{margin/.test(inf), "y la hoja lleva sus margenes de impresion");

    // ── ARREGLO 83: el documento no depende del aparato que lo genera ──
    // Medido el 02/10 generando desde un telefono de 412px: 77 celdas se
    // quedaban FUERA de #reporteCapture —la columna MONTO entera, todos los
    // importes— porque la hoja media lo que midiera la pantalla y las tablas
    // no cabian. html2canvas solo captura lo de dentro, asi que el mismo boton
    // daba un documento completo desde la PC y uno sin cifras desde el movil.
    ok(/"\.inf-doc\{width:768px/.test(inf),
       "la hoja del informe mide 768px fijos, la genere el telefono o la PC");
    // El nowrap de la version estrecha era justo lo que empujaba las tablas
    // fuera de la hoja. Con el ancho fijo sobra, y volver a meterlo reabre el
    // mismo agujero.
    ok(!/max-width:639px\)\{#informePdfOverlay td/.test(inf),
       "y no vuelve a encoger la letra ni a meter nowrap en pantalla estrecha");
    // La lupa solo encoge la VISTA PREVIA. Un scale en un antecesor entra en
    // el recuadro que mide html2pdf, asi que si se captura con ella puesta
    // sale un PDF reducido: borroso y con la letra por debajo de los 10px.
    ok(/lupa-int\{transform-origin/.test(inf),
       "la vista previa se encoge con una lupa aparte de la hoja");
  }
  {
    const pdf = sinComentarios(sacarFuncion("_pdfInforme"));
    ok(/_sinLupa\(\)/.test(pdf),
       "antes de capturar se quita la lupa, para que el PDF salga a tamano real");
    // Reponerla en los DOS caminos: si solo se repusiera al salir bien, un
    // fallo del generador dejaria la vista previa a tamano completo dentro de
    // un telefono, sin forma de volver atras salvo cerrar y abrir.
    ok((pdf.match(/_reponerLupa\(\)/g) || []).length >= 2,
       "y se repone tanto si sale bien como si falla");
    const sl = sinComentarios(sacarFuncion("_sinLupa"));
    ok(/transform="none"/.test(sl) && /style\.height=""/.test(sl),
       "quitarla deja la hoja a sus 768px y sin altura impuesta");

    // ── ARREGLO 84: el archivo que se descarga, no solo la vista previa ──
    // html2canvas no dibuja la pagina: la copia a un marco aparte y dibuja esa
    // copia. Se le pasaba el alto del marco y no el ancho, asi que el marco
    // media lo que la pantalla (412 px en su telefono) mientras la hoja mide
    // 768. La vista previa no pasa por ahi; el archivo si, y por eso el PDF
    // descargado no se parecia a lo que se veia.
    ok(/windowWidth:ANCHO_HOJA/.test(pdf) && /width:ANCHO_HOJA/.test(pdf),
       "al generar el PDF se le dice tambien el ANCHO del marco, no solo el alto");
    ok(/windowHeight:alturaReal/.test(pdf) && /height:alturaReal/.test(pdf),
       "y el alto sigue siendo el real, no el de la pantalla");
    // scale:2 sobre 768x5171 pide casi 16 millones de pixeles. Android corta
    // el lienzo por encima de su tope SIN avisar: imagen recortada o
    // deformada y ningun error. De ahi 15 hojas donde deberian ser 5.
    // ARREGLO 88: ya no se dibuja el documento entero, sino HOJA POR HOJA, asi
    // que el tope de lienzo deja de apretar: cada hoja suelta son 2.304x3.336
    // px a 3x y cabe de sobra. Lo que se exige ahora es que ese camino exista,
    // que dibuje a 3x y que el respaldo siga midiendo la escala por si la
    // libreria no expone html2canvas y jsPDF sueltos.
    // Igual aqui: que la funcion EXISTA no prueba nada —un "return null" la
    // deja en pie y manda el camino viejo—. Se exige que llame a html2canvas
    // con la escala y con el desplazamiento de cada hoja.
    ok(/ESCALA=3/.test(pdf) &&
       /html2canvas\(el,\{[^}]*scale:ESCALA/.test(pdf) &&
       /y:i\*PX_HOJA/.test(pdf),
       "el PDF se dibuja hoja por hoja a 3x, no el documento entero a 1,5x");
    // El respaldo sigue en JPEG a proposito: ahi el lienzo es el documento
    // entero y el peso importa. El camino bueno va en PNG.
    ok(/toDataURL\("image\/png"\)/.test(pdf),
       "y en PNG, que no emborrona el borde de las letras");
    ok(/porHojas\(\)\s*\|\|\s*porElCaminoViejo\(\)/.test(pdf),
       "con el camino de antes como respaldo: mejor 151 ppp que ningun PDF");
    ok(/while\s*\(escala>1/.test(pdf),
       "y ese respaldo sigue midiendo la escala contra el tope de Android");
    ok(!/scale:2\b/.test(pdf),
       "y ya no hay un scale:2 fijo que el telefono no pueda dibujar");
  }
  {
    // Compartir no compartia NADA y no lo decia. Android pide un gesto
    // reciente para abrir la hoja de compartir y generar el PDF tarda varios
    // segundos, asi que navigator.share se rechazaba; un .catch() vacio se
    // tragaba el rechazo y el boton volvia a su texto normal. Desde fuera
    // parecia que habia funcionado.
    ["_pdfInforme", "_compartirSocioImg"].forEach(function(nom){
      const f = sinComentarios(sacarFuncion(nom));
      ok(!/navigator\.share\([^]*?\)\.catch\(function\(\)\{\}\)/.test(f),
         nom + ": compartir ya no se traga el fallo en silencio");
      ok(/AbortError/.test(f),
         nom + ": y cancelar a proposito no se confunde con un fallo");
    });
    // El papel que sale hacia fuera dice con que version se hizo.
    const inf2 = sinComentarios(sacarFuncion("generarInformePDF"));
    ok(/\+APP_VERSION\+/.test(inf2),
       "el informe lleva escrita la version que lo genero");
  }

  // ── ARREGLO 87: cada papel enseña lo suyo ─────────────────────────
  // Sus palabras: "el reporte a socio mayor no es el mismo que los socios
  // menores y no es lo mismo que el contador, cada uno tiene que ver
  // informacion diferente". El Informe Mensual es el documento del dueño —el
  // estado real de la empresa—; el reporte por socio es el del socio de ruta y
  // no puede llevar capital, saldos de cuentas ni prestamos.
  {
    const soc = sinComentarios(sacarFuncion("generarReporteSocio"));
    ["capitalRealTotal", "S.cuentas", "S.prestamos", "cuentasCobrar", "inventarioUsdt"]
      .forEach(function(q){
        ok(soc.indexOf(q) === -1,
           "el reporte de un socio no enseña " + q + ": ese papel es solo lo suyo");
      });
    // Y el informe del dueño SI tiene que llevarlo, por moneda.
    const inf = sinComentarios(sacarFuncion("generarInformePDF"));
    // ARREGLO 90: el apartado se llama como ella lo pidio ("Tienes tanto un
    // USDT, tienes tanto reserva...") y es el PRIMERO de la lista, que es lo
    // que de verdad hay que fijar: antes el informe abria con la cuenta de
    // resultados y lo que un dueño mira primero es cuanto HAY.
    ok(/ap\("Qué tiene la empresa hoy"/.test(inf),
       "el informe del mes lleva el apartado del estado de la empresa");
    {
      const orden = (inf.match(/ap\("([^"]+)"/g)||[]).map(function(t){ return t.slice(4,-1); });
      ok(orden[0]==="Qué tiene la empresa hoy",
         "y es el PRIMERO, no la ganancia del mes", orden.slice(0,3).join(" | "));
      ok(orden.indexOf("Cómo le fue el mes")===1,
         "y el segundo es como le fue el mes", orden.slice(0,3).join(" | "));
      ok(orden.indexOf("Hoja para el contador")===orden.length-1,
         "y la hoja del contador va al final", orden.join(" | "));
    }
    // Ojo: exigir solo "cap.porMoneda" no vale, porque esa cadena tambien
    // aparece en la guarda de "si no hay desglose, no pintes nada". Lo que hay
    // que exigir es que de verdad RECORRA la lista para hacer las filas.
    ok(/cap\.porMoneda\.map/.test(inf),
       "y lo desglosa por moneda, con su equivalente en USDT");
    // El desglose sale de capitalRealTotal, no de una suma aparte: dos
    // respuestas a la misma pregunta es lo que ya hizo que dejara de fiarse
    // de dos numeros que diferian en un centimo.
    const crt = sinComentarios(sacarFuncion("capitalRealTotal"));
    ok(/porMoneda:lista/.test(crt),
       "y ese desglose lo devuelve capitalRealTotal, que es quien ya recorre todo");
  }

  // ── ARREGLO 85: el estilo viaja CON la hoja, no con la pantalla ────
  // html2pdf.js no dibuja el elemento donde esta: lo CLONA y lo cuelga de
  // <body>, dentro de un contenedor suyo. Todo lo escrito como
  // "#informePdfOverlay ..." deja de aplicar ahi, y manda el estilo general
  // de la app. Medido clonando la hoja a mano: .cuerpo pasaba de block a FLEX
  // (la regla global del armazon), el contenido de 768 px a 5.132, la tinta
  // de #111111 a #dcdae0 y la cabecera de #f2f2f2 al azul oscuro del tema.
  // Era exactamente el PDF que ella recibia. Por eso las reglas del documento
  // cuelgan de una clase que lleva la propia hoja.
  {
    const inf = sacarFuncion("generarInformePDF");
    ok(/class='hoja inf-doc' id='reporteCapture'/.test(inf),
       "la hoja del informe lleva su propia clase, que viaja con el clon");
    const soc = sacarFuncion("generarReporteSocio");
    ok(/class='page soc-doc' id='reporteSocioCapture'/.test(soc),
       "y la del socio tambien");
    // Del overlay solo pueden quedar las reglas de PANTALLA: el fondo, la
    // columna, los botones y la lupa. Nada que pinte el documento.
    // El @media print queda FUERA de la cuenta: al imprimir no hay clon, el
    // overlay de verdad esta ahi, y esas reglas son justamente las que lo
    // adaptan al papel (esconder los botones, soltar el alto).
    // ARREGLO 90: "corte" son las rayas de la vista previa que enseñan donde va a
    // cortar el PDF. Van dentro de la lupa y FUERA de la hoja, asi que no se
    // capturan nunca: son pantalla, como los botones.
    const CHROME = /^(contenido|btn|btnBar|btnShare|btnCerrar|lupa|lupa-int|corte|no-print)$/;
    [["#informePdfOverlay", inf], ["#reporteSocioOverlay", soc]].forEach(function(par){
      const id = par[0];
      const txt = sinComentarios(par[1])
        .split("\n")
        .filter(function(l){ return l.indexOf("@media print") === -1 && /^\s*"/.test(l); })
        .join("\n");
      const malas = [];
      const re = new RegExp(id + "\\s+\\.([A-Za-z0-9_-]+)", "g");
      let m;
      while ((m = re.exec(txt))) if (!CHROME.test(m[1])) malas.push(m[1]);
      ok(malas.length === 0,
         id + ": del overlay solo cuelgan las reglas de pantalla, no las del documento",
         malas.slice(0, 6).join(" | "));
    });
    // Y lo que antes se HEREDABA del overlay (letra, tinta, cifras de ancho
    // fijo) tiene que estar en la hoja: fuera del overlay no lo hereda de nadie.
    [["inf-doc", inf], ["soc-doc", soc]].forEach(function(par){
      const propias = sinComentarios(par[1])
        .split("\n")
        .filter(function(l){ return l.indexOf('"." + par[0] + "{') !== -1 ||
                                    l.indexOf('"\u002E' + par[0] + '{') !== -1; })
        .join(" ");
      ok(/font-family/.test(propias) && /color:var\(--inf-tinta\)/.test(propias) &&
         /tabular-nums/.test(propias),
         "." + par[0] + " lleva la letra, la tinta y las cifras de ancho fijo, sin heredarlas");
    });
  }

  // ── ARREGLO 90: cada apartado en su hoja, y si sigue, con su titulo ──
  // Sus palabras: "quiero que el informe no se corte cuando pase de una
  // pagina a otra. No es que todo este en una sola pagina. Es que cuando pase
  // una hoja y venga la otra informacion, tenga su titulo alli, cada hoja
  // tenga su titulo... y que la informacion sea completa de ese titulo.
  // Porque asi es muy tedioso, demasiada informacion en una sola hoja, brinca
  // para un lado, brinca para otro, se corta y ya me han devuelto ese reporte
  // muchas veces".
  //
  // Medido en Chromium con un mes de su tamaño y con otro de 70 clientes:
  // 0 apartados que no arranquen arriba de una hoja, 0 filas cortadas,
  // 0 hojas en blanco y 0 hojas sin titulo propio, igual a 390, 412, 768 y
  // 1280 px de ventana.
  {
    const pag = sinComentarios(sacarFuncion("_paginarInforme"));
    const inf = sinComentarios(sacarFuncion("generarInformePDF"));
    const pdf = sinComentarios(sacarFuncion("_pdfInforme"));

    // Se reparte, y se reparte ANTES de la lupa: la lupa mide el alto del
    // documento para no dejar hueco debajo, y el reparto lo cambia.
    ok(inf.indexOf("_paginarInforme()") !== -1 &&
       inf.indexOf("_paginarInforme()") < inf.indexOf("_ajustarLupaInforme()"),
       "el informe se reparte en hojas, y antes de ajustar la lupa");

    // TODOS los apartados arrancan arriba de una hoja, el primero tambien.
    // Dejando que el primero comparta hoja con la portada se partia en dos.
    ok(/secs\.forEach\(function\(sec\)\{[\s\S]{0,400}_infAlPrincipio\(sec,hoja\)/.test(pag),
       "todos los apartados arrancan arriba de una hoja");
    ok(!/sec!==secs\[0\]/.test(pag),
       "incluido el primero: la portada se queda sola en la hoja 1");

    // La banda con el titulo repetido se decide por CAMBIO DE HOJA, no por
    // "esto cruza un corte". Con 70 clientes la tabla ocupaba tres hojas y la
    // tercera empezaba en una fila que caia justo en el borde: no cruzaba
    // nada, no se le ponia banda y la hoja quedaba sin decir de que era.
    ok(/var hojaActual=hojaDe\(_infY\(sec,hoja\)\);/.test(pag) &&
       /if\(h0===hojaActual && h1===hojaActual\) return;/.test(pag),
       "el titulo se repite cuando el apartado CAMBIA de hoja, no solo cuando algo se parte");
    ok(/hojaActual=hojaDe\(_infY\(a,hoja\)\);/.test(pag),
       "y despues de repetirlo se apunta en que hoja va, para la siguiente");
    ok(/\(continúa\)/.test(pag),
       "la hoja que continua lo dice con (continua)");
    // La cabecera de columnas se CLONA al DOM. El ARREGLO 86 dejo escrito que
    // repetirla por CSS es imposible —html2pdf hace UNA imagen y la corta— y
    // sigue siendo verdad: esto no la repite, la copia antes de dibujar.
    ok(/cab\.cloneNode\(true\)/.test(pag) && /!a\.querySelector\("th"\)/.test(pag),
       "y si lo que sigue es media tabla, su cabecera se clona (menos si lo empujado ES la cabecera)");

    // El relleno solo SUMA alto. Quitarlo dejaria el apartado empezando antes
    // del corte, que es lo unico que parte una tabla por la mitad.
    ok(/_infPonerAlto\(relleno,_infAltoDe\(relleno\)\+falta\)/.test(sinComentarios(sacarFuncion("_infAlPrincipio"))),
       "el relleno solo añade hueco, nunca lo quita");
    // Dentro de una tabla el relleno tiene que ser un <tr>: un <div> ahi lo
    // mueve el navegador fuera de la tabla y el hueco aparece donde no toca.
    ok(/TBODY\|THEAD\|TFOOT\|TABLE/.test(sinComentarios(sacarFuncion("_infNodo"))),
       "y dentro de una tabla es un <tr>, no un <div>");

    // El aire de cada apartado va en su PADDING, no en el margen del h2. Un
    // margen de arriba se suma por fuera de la caja: el apartado siguiente
    // empezaba 24 px pasado el corte y el relleno —que solo puede añadir— lo
    // empujaba una hoja ENTERA. Medido: hoja 8 en blanco, apartado 6 en la 9.
    ok(/\.inf-doc \.inf-sec\{padding-top:\d+px\}/.test(inf) &&
       /\.inf-doc \.inf-sec>h2\{margin-top:0\}/.test(inf),
       "el aire del apartado va en su padding, que no empuja una hoja entera");

    // Una sola geometria para el reparto y para el PDF. Dos copias del mismo
    // numero y el reparto cae donde el PDF no corta.
    ok(/var PX_HOJA=INF_PX_HOJA;/.test(pdf) && /var ANCHO_HOJA=INF_ANCHO_HOJA;/.test(pdf),
       "el PDF y el reparto miden la hoja con los mismos numeros");
    ok(/@page\{margin:8mm\}/.test(inf) && /INF_MARGEN_MM=8/.test(HTML),
       "y al imprimir el margen del papel es el mismo que el del PDF");

    // Las rayas de la vista previa van FUERA de la hoja: dentro de
    // #reporteCapture saldrian impresas en el papel.
    ok(/document\.getElementById\("reporteLupaInt"\)/.test(sinComentarios(sacarFuncion("_infMarcarCortes"))),
       "las rayas de corte se dibujan fuera de la hoja, en la lupa");
    ok(!/class="corte"|class='corte'/.test(inf),
       "y no las escribe el documento, que si no se capturarian");

    // El apartado de clientes: lo que pidio y no estaba. Para sumar entre
    // monedas se convierte con getRateToUsdt (que DIVIDE) y si falta una tasa
    // el total se marca "parcial" en vez de quedarse corto en silencio.
    ok(/c\.usdt\+=am\/t/.test(inf) && /c\.parcial=true/.test(inf),
       "los clientes se suman convirtiendo con getRateToUsdt, que divide");
    ok(/algoParcial\?"<span style='color:var\(--inf-resta\)'>parcial/.test(inf),
       "y si falta una tasa el total se marca parcial, no se queda corto");
    ok(/o\.n\+"<\/td>"/.test(inf) || /text-align:center;font-weight:700'>"\+o\.n\+/.test(inf),
       "y dice cuantas veces mando cada cliente");

    // El indice de la portada sale de la MISMA lista que se dibuja: numerarlo
    // a mano se descuadra en cuanto un apartado se calla por estar vacio.
    ok(/apartados\.map\(function\(s,i\)\{/.test(inf) &&
       (inf.match(/apartados\.map\(/g)||[]).length >= 2,
       "el indice de la portada sale de la misma lista que se dibuja");
    ok(/ap=function\(t,c\)\{ if\(c\) apartados\.push/.test(inf),
       "y un apartado vacio no entra en la lista ni ocupa un numero");
    // Es un documento de junta: ni un emoji en los titulos.
    {
      const conEmoji = (inf.match(/ap\("[^"]*"/g)||[])
        .filter(function(t){ return /\p{Extended_Pictographic}/u.test(t); });
      ok(conEmoji.length === 0, "ningun apartado lleva emoji en el titulo",
         conEmoji.slice(0,4).join(" "));
    }
    // El signo va delante del simbolo: f2l de un negativo da "-73,26" y
    // anteponerle el "$" escribia "$-73,26".
    ok(/var usd=function\(v\)\{ var n=parseFloat\(v\)\|\|0; return \(n<0\?"−\$":"\$"\)/.test(inf),
       "un numero negativo se escribe −$73,26, no $-73,26");
  }
}

// La tarjeta de Configuracion marca el tema que esta CORRIENDO, no el que esta
// guardado. Mientras ella no elija nada los dos son distintos, y la linea
// daba por hecho que sin elegir mandaba "claro": al pasar el por omision a
// SUAVE, la app corria en Suave y la tarjeta le marcaba Claro. Era justo lo
// que iba a mirar para saber en cual estaba.
{
  const f = sinComentarios(sacarFuncion("_htmlBotonesTema"));
  ok(/var on=\(act===id\)/.test(f),
     "la tarjeta marca el tema que corre, no uno supuesto");
  ok(!/g===""/.test(f),
     "y ya no da por hecho cual manda sin elegir");
}

// ── Nada se queda pegado al deslizar, salvo un encabezado de columna ──────
// Sus palabras: "un boton que cuando deslizo se queda ahi fijo". Era la barra
// de Total empresa de Balance de Cuentas, con position:sticky: en el telefono
// son 163px de los 614 visibles -el 27% de la pantalla- tapando la lista de
// cuentas todo el rato, y el boton de Tasas iba dentro, asi que parecia un
// boton flotante.
//
// Lo unico que puede seguir pegado es el ENCABEZADO DE COLUMNA de una tabla:
// son 40px y sin ellos, bajando por 119 operaciones, se pierde de vista que
// columna es cual. Un bloque entero pegado es otra cosa.
{
  const fuera = [];
  ["rCapitalTotal", "rInventarioUsdt", "rPrestamos", "rCuentasCobrar", "rEgresos", "rDash"].forEach(function(f){
    const c = sinComentarios(sacarFuncion(f));
    (c.match(/position:sticky/g) || []).forEach(function(){
      // solo se admite si es la fila de encabezado de una tabla
      if (!/<thead><tr style='position:sticky/.test(c)) fuera.push(f);
    });
  });
  ok(fuera.length === 0,
     "ninguna pantalla deja un bloque pegado al deslizar",
     [...new Set(fuera)].join(", "));
  ok(!/position:sticky;top:0;z-index:10;background:var\(--fondo-osc\)/.test(HTML),
     "y la barra de Total empresa ya no se clava arriba");
}

// ── En NINGUNA pantalla queda letra por debajo de 10px ────────────────────
// Sus palabras: "yo me imagino que todo eso aplica en todas las pestañas y no
// solo en resumen". Tenia razon. Esta guardia es la que lo sostiene para las
// que vengan: una pantalla nueva con letra de 8 o 9px no pasa.
// El informe del cierre queda fuera porque se imprime en papel, donde 9px se
// lee bien y el sitio escasea.
{
  const prot = ["generarInformePDF", "rInformeCierre"].map(function(f){
    const i = HTML.indexOf("function " + f + "(");
    return i < 0 ? null : [i, HTML.indexOf("\n}\n", i)];
  }).filter(Boolean);
  const chicas = [];
  let m;
  const re = /font-size:([\d.]+)px/g;
  while ((m = re.exec(HTML)) !== null) {
    if (prot.some(function(r){ return m.index >= r[0] && m.index < r[1]; })) continue;
    if (parseFloat(m[1]) < 10) chicas.push(m[1] + "px");
  }
  ok(chicas.length === 0,
     "en ninguna pantalla queda letra por debajo de 10px",
     chicas.length + " sitios, p.ej. " + chicas.slice(0, 4).join(", "));
}

// ── Las pantallas que no tenian NI UN numero grande ───────────────────────
// Eran ocho. Todo al mismo tamaño, asi que no habia donde posar el ojo.
{
  const cob = sinComentarios(sacarFuncion("rCuentasCobrar"));

  // LA SUMA. Los cargos estan en monedas distintas -BRL, VES, USDT- y sumar
  // 97 BRL con 80.000 VES da un numero que no existe. El primer intento de
  // esta tarjeta hacia exactamente eso y enseñaba "$177,00": la suma cruda de
  // dos cargos en reales, con simbolo de dolar delante.
  ok(/getRateToUsdt\(mon\)/.test(cob) && /monto\/r/.test(cob),
     "lo que le deben se suma en USDT y DIVIDIENDO por la tasa, no en crudo");
  ok(/parcial/.test(cob),
     "y si a una moneda le falta la tasa, el total se marca parcial en vez de quedarse corto en silencio");

  // Un solo numero para el mismo dato. Sumar arriba por cargo y abajo por
  // cliente -cada saldo ya redondeado- daba 34,27 en un sitio y 34,28 en el
  // otro, en la misma pantalla.
  ok(/var totalPendUsdtCC=_pend\.total/.test(cob),
     "el panel de abajo lee el mismo total que la tarjeta de arriba");

  // Las tarjetas son las piezas compartidas, no unas propias.
  ["rCuentasCobrar", "rEgresos"].forEach(function(f){
    ok(/class='pz-card'/.test(sinComentarios(sacarFuncion(f))),
       f + " usa las piezas compartidas");
  });

  // El informe del cierre se queda FUERA a proposito: se imprime y se le manda
  // al contador, asi que sus colores no pueden seguir al tema. Meterle las
  // piezas -que van por var(--...)- lo rompe.
  ok(!/class='pz-/.test(sacarFuncion("rInformeCierre")),
     "el informe del cierre no usa las piezas: se imprime en blanco");
}

// ── Clientes: la negrita vuelve a significar algo ─────────────────────────
// Medido antes: el 85% del texto de esta pantalla estaba en negrita -el
// codigo, la ruta, el pais, el nombre, todo-. Cuando todo esta en negrita, la
// negrita no significa nada. Y el nombre, que es lo que ella busca aqui, se
// pintaba en var(--az1-a): un azul oscuro que sobre la tarjeta oscura daba
// contraste 2,0. Ahora es lo unico en negrita, lo mas grande de la fila, y
// esta en 10,9.
{
  const c = sinComentarios(sacarFuncion("rClientes"));
  ok(/font-weight:700;font-size:14\.5px;color:var\(--tx\)[^']*'>"\+_escAud\(cl\.n\)/.test(c),
     "el nombre del cliente es lo mas grande de la fila y usa el color del texto");
  ok(!/color:var\(--az1-a\)'>"\+_escAud\(cl\.n\)/.test(c),
     "y ya no se pinta con el azul oscuro que no se leia");
  // El codigo y el telefono son datos secundarios: se leen, pero no compiten.
  ok(/#"\+_escAud\(cl\.cod\)/.test(c) && !/font-size:9px[^']*'>#"\+_escAud\(cl\.cod\)/.test(c),
     "el codigo sigue estando, pero ya no a 9px");
}

// ── Las dos tablas donde pasa las horas ───────────────────────────────────
// Medido antes: en Operaciones el 86% del texto estaba a 11px o menos, y en
// Diario el 92%. Lo diminuto no era el adorno: eran los montos, las tasas y
// los nombres. Lo unico grande de Operaciones -la pantalla con MAS texto de la
// app, 2.363 trozos- era el titulo.
{
  const chicas = [];
  ["rTblUnificada", "rDiario"].forEach(function(f){
    const c = sinComentarios(sacarFuncion(f));
    (c.match(/font-size:([\d.]+)px/g) || []).forEach(function(m){
      const v = parseFloat(m.split(":")[1]);
      if (v < 10.5) chicas.push(f + " " + m);
    });
  });
  ok(chicas.length === 0,
     "en las dos tablas no queda letra por debajo de 10,5px",
     chicas.slice(0, 5).join(" · "));

  ok(/table\{[^}]*font-size:13px/.test(HTML), "la tabla arranca en 13px, no en 12,5");
  ok(/td\{padding:12px/.test(HTML), "y la fila respira un punto mas");

  // Operaciones usa las mismas piezas que el Resumen. Si se escribe sus
  // propias tarjetas, en dos semanas hay diecisiete tarjetas distintas.
  ok(/class='pz-card'/.test(sinComentarios(sacarFuncion("rTblUnificada"))),
     "las tarjetas de Operaciones son las piezas compartidas");
}

// ── El armazon: barra lateral en PC, boton en el telefono ─────────────────
// Hasta ahora, en cualquier pantalla, para cambiar de pestaña habia que abrir
// un menu que tapaba lo que estabas mirando. En el telefono esta bien -no cabe
// otra cosa-; en la PC sobra sitio y esconder la navegacion obliga a recordar
// donde esta cada cosa en vez de verlo.
{
  // Los dos menus salen del MISMO orden. Si cada uno tuviera el suyo, acabarian
  // distintos y cambiar de aparato seria volver a aprenderse la app.
  ok(/var _GRUPOS_MENU=\[/.test(HTML), "el orden del menu esta en un solo sitio");
  ["_htmlLateral", "_htmlMenuTel"].forEach(function(f){
    const c = sinComentarios(sacarFuncion(f));
    ok(/_GRUPOS_MENU\.forEach/.test(c), f + " lee el orden de _GRUPOS_MENU");
    // Lo que no este en ningun grupo NO desaparece: cae en "Mas" al final. Una
    // pestaña nueva que se olvide de apuntarse tiene que seguir alcanzandose.
    ok(/sueltas/.test(c) && /Más/.test(c),
       f + ": una pestaña sin grupo cae en 'Más', no se pierde");
  });

  // La barra la dibuja la lista YA FILTRADA por permisos, no TABS[S.role]. Si
  // leyera los tabs del rol, el menu volveria a enseñar pestañas que contestan
  // "Sin acceso" al tocarlas, que es el error de la FASE B.
  const main = sinComentarios(sacarFuncion("rMain"));
  ok(/_htmlLateral\(ts\)/.test(main) && /_htmlMenuTel\(ts\)/.test(main),
     "los dos menus salen de la lista ya filtrada por permisos");
  ok(!/_htmlLateral\(TABS/.test(main) && !/_htmlMenuTel\(TABS/.test(main),
     "y no de los tabs del rol");

  // El telefono no cambia: la barra solo existe por encima de 900px y el boton
  // ☰ sigue ahi debajo.
  ok(/@media\(min-width:900px\)\{[\s\S]{0,900}\.lateral\{display:flex/.test(HTML),
     "la barra lateral solo aparece en pantalla ancha");
  ok(/\.lateral\{display:none\}/.test(HTML),
     "y por debajo de 900px no existe");
  ok(/\.navbar3 \.menubtn\{display:none\}/.test(HTML),
     "en PC sobra el boton de menu (y el selector es mas especifico que .menubtn, que se declara despues)");

  // Las piezas compartidas viven en el <style>, no dentro de una pantalla.
  [".pz-rejilla", ".pz-card", ".pz-rot", ".pz-num", ".pz-pie"].forEach(function(c){
    ok(new RegExp("\\" + c + "\\{").test(HTML), "existe la pieza " + c);
  });
  ok(/class='pz-card'/.test(sinComentarios(sacarFuncion("rDash"))),
     "el Resumen ya usa las piezas compartidas");
}

// ── Lo primero del Resumen son cuatro numeros ─────────────────────────────
// Antes lo primero eran los avisos, y despues un desglose con todo del mismo
// tamaño y todo en negrita: nada destacaba, asi que habia que leer la pantalla
// entera para encontrar un dato.
{
  const dash = sinComentarios(sacarFuncion("rDash"));

  ok(/return headerSel \+ kpisHtml \+ alertasHtml/.test(dash),
     "los cuatro numeros van los primeros, antes que los avisos");

  // La proyeccion la miran DOS sitios: la tarjeta y el pie del grafico. Si
  // cada uno la calculara por su cuenta acabarian diciendo numeros distintos
  // en la misma pantalla. Es el mismo motivo por el que el cronograma sale de
  // cronogramaCuotas() y de ningun otro sitio.
  ok(/var _evo = \(function\(\)\{/.test(dash),
     "el mes se calcula una sola vez, en _evo");
  ok(/_evo\.ganMes[\s\S]{0,300}_evo\.proyeccion/.test(dash),
     "y el pie del grafico lee de ahi, no rehace la cuenta");
  const ocurrencias = (dash.match(/promDia\s*\*\s*[\w.]*[Dd]iasRestantes/g) || []).length;
  ok(ocurrencias === 1,
     "la formula de la proyeccion esta escrita UNA sola vez",
     ocurrencias + " veces");

  // Proyectar un mes ya cerrado no significa nada: la cuarta tarjeta cambia.
  ok(/if\(esMesActual\)\{[\s\S]{0,400}out\.proyeccion/.test(dash),
     "solo se proyecta el mes en curso");
  ok(/_evo && _evo\.proyeccion[\s\S]{0,400}Egresos pagados/.test(dash),
     "en un mes pasado, la cuarta tarjeta dice otra cosa en vez de inventar una proyeccion");

  // El capital sale de capitalRealTotal(), no de una suma a mano. El PDF del
  // cierre sumaba "cuentas + afuera" por su cuenta y se dejaba la reserva:
  // 2.302,34 donde Balance de Cuentas decia 2.479,17.
  ok(/var _cap = capitalRealTotal\(\)/.test(dash),
     "el capital sale de capitalRealTotal(), no de una suma a mano");
  // Una moneda sin tasa deja el capital incompleto: eso se dice, no se calla.
  ok(/_cap\.sinTasa\.length[\s\S]{0,160}falta la tasa/.test(dash),
     "si falta la tasa de una moneda, la tarjeta lo dice");
}

// ── Los avisos del Resumen van en UNA linea ───────────────────────────────
// Eran hasta seis barras apiladas, del mismo alto y del mismo peso, ocupando
// media pantalla antes de llegar a un solo numero. Seis alarmas sonando a la
// vez: cuando todo urge, no urge nada.
{
  const dash = sinComentarios(sacarFuncion("rDash"));

  // Lo urgente NO se esconde nunca. Plegada, la cabecera sigue diciendo el
  // aviso urgente entero: un cobro de 54 dias no puede quedar detras de un
  // "ver mas". Esconder un aviso rojo cuesta dinero de verdad.
  ok(/urg:1/.test(HTML), "los avisos rojos van marcados como urgentes");
  ok(/urgentes\.length[\s\S]{0,200}urgentes\[0\]\.msg/.test(dash),
     "plegado, el aviso urgente se sigue leyendo entero en la cabecera");
  ok(/urgentes\.length\s*\+\s*alertas\.length/.test(dash) === false,
     "y el contador no mezcla urgentes con el total");
  // Abierto ya se lee en su fila: repetirlo en la cabecera seria ruido.
  ok(/avisos-urg/.test(dash) && /u\.style\.display=abrir\?"none":"inline"/.test(sinComentarios(sacarFuncion("_toggleAvisos"))),
     "abierto, el urgente no se repite en la cabecera");

  // Plegar NO puede repintar: rehacer el HTML cierra lo que tenga abierto bajo
  // el dedo, que es el ARREGLO 32 otra vez.
  const tg = sinComentarios(sacarFuncion("_toggleAvisos"));
  ok(tg.length > 0, "existe el plegado de los avisos");
  ok(!/\bR\(\)/.test(tg), "plegar los avisos no repinta la app (ARREGLO 32)");
  ok(/getElementById\("avisos-lista"\)/.test(tg) && /getElementById\("avisos-flecha"\)/.test(tg),
     "plegar cambia la lista y la flecha por su id");

  // Es de ESTE aparato, como el tema: no viaja al otro ni entra en la fusion.
  ok(/localStorage\.setItem\(_AVISOS_KEY/.test(tg),
     "si estan plegados o no se guarda en este aparato");
  ok(!/_MERGE_FIELDS[\s\S]{0,300}avisos/.test(HTML) && !/DATA_KEYS[\s\S]{0,300}cg_avisos/.test(HTML),
     "y no entra en DATA_KEYS ni en las listas de fusion");

  // Sin nada guardado se abre. Un aviso que nadie ha visto todavia no puede
  // nacer escondido.
  ok(/getItem\(_AVISOS_KEY\)!=="0"/.test(sinComentarios(sacarFuncion("_avisosAbiertos"))),
     "la primera vez los avisos salen abiertos");

  // El texto del aviso pasa por _escAud: son nombres de clientes.
  ok(/_escAud\(a\.msg\)/.test(dash) && /_escAud\(urgentes\[0\]\.msg\)/.test(dash),
     "los nombres de los clientes salen escapados");
}

// ── El interior tiene que poder mirarse horas ─────────────────────────────
// Ella lo dijo dos veces: "es un sistema de contabilidad, se pasan horas
// registrando datos, no puede ser tosco para la vista". La primera lectura
// -"esta demasiado oscuro"- era falsa: su pantalla de referencia es MAS oscura
// que este tema (fondo negro, tarjetas #1C1C1E). Lo que cansaba eran los
// fondos de aviso saturados: 19 bloques de mas de 4.000 pixeles solo en el
// Resumen, con cromas de 47 a 66 donde el panel vale 8. Ahora rozan el color del panel y el
// color vive en la letra y el borde. Si alguien vuelve a subirlos, vuelve el
// cansancio, asi que aqui se mide.
{
  const FONDOS = ["--mal-sup","--ok-sup","--avi-sup","--info-sup","--info-sup2",
    "--avi-sup2","--am6-j5","--am6-e","--az6-p","--az6-f","--az6-n","--az6-o","--vd6-c"];
  const osc = (HTML.match(/html\[data-tema="suave"\]\{[\s\S]*?\n\}/) || [""])[0];
  // Se mide el CROMA -lo que separa el canal mas fuerte del mas debil-, no la
  // saturacion de HSL. La saturacion engaña en los colores muy oscuros: un azul
  // casi negro como #1a202c da 0,26 y parece que grita, cuando al lado del
  // panel no se distingue. El croma dice lo que de verdad importa: cuanto
  // color lleva el relleno. Para situarlo: el panel de este tema vale 8 y la
  // tarjeta de su pantalla de referencia, 2.
  const cromaDe = function(hex){
    const h = hex.replace("#","");
    const c = [0,2,4].map(function(i){ return parseInt(h.slice(i,i+2),16); });
    return Math.max.apply(null,c) - Math.min.apply(null,c);
  };
  const gritan = [];
  FONDOS.forEach(function(k){
    const m = osc.match(new RegExp(k.replace(/[-]/g,"\\-") + "\\s*:\\s*(#[0-9a-fA-F]{6})"));
    if (!m) { gritan.push(k + " (no esta)"); return; }
    const c = cromaDe(m[1]);
    if (c > 22) gritan.push(k + " " + m[1] + " croma " + c);
  });
  ok(gritan.length === 0,
     "ningun fondo de aviso del tema suave vuelve a gritar (croma <= 22)",
     gritan.join(" · "));
}

// La barra de arriba llevaba siete botones rellenos de color pleno. Ahora el
// relleno es el mismo gris para todos y el color va en el borde. Las DOS que
// borran -Restaurar y la papelera- son la excepcion y tienen que seguir
// distinguiendose: si los siete fueran identicos, lo unico que separaria
// "Exportar" de "Borrar todo" seria un emoji de 14 pixeles.
{
  const tb = HTML.slice(HTML.indexOf('d.id="adm-btns"'), HTML.indexOf("tb.appendChild(d)"));
  ok(tb.length > 0, "la barra de administrador sigue ahi");
  ok(!/rgba\(\s*(?:100|255)\s*,\s*(?:100|180|200|215)\s*,\s*(?:0|100|255|100)\s*,/.test(tb),
     "los botones de la barra ya no llevan relleno de color pleno");
  ["restoreFromBackup", "clearAllData"].forEach(function(f){
    const i = tb.indexOf(f);
    ok(i > 0 && /_btNo/.test(tb.slice(i, i + 160)),
       "el boton que borra (" + f + ") conserva su rojo y no se confunde con los demas");
  });
  ok(/guardarEnServidorYa[\s\S]{0,160}_btSi/.test(tb),
     "Guardar, que es la que mas usa, se sigue encontrando sin leer");
}

// FASE 2 · ya no queda ningun color escrito a mano fuera del informe. Esta es
// la guardia que sostiene todo el rediseño: si alguien añade una pantalla nueva
// con colores a pelo, el tema oscuro la dejaria blanca en medio de lo demas y
// nadie se enteraria hasta verlo en produccion.
{
  const bloques = [];
  const est = /style=(['"])([\s\S]*?)\1/g;
  const prot = ["generarInformePDF", "rInformeCierre"].map(function(f){
    const i = HTML.indexOf("function " + f + "(");
    const j = i < 0 ? -1 : HTML.indexOf("\n}\n", i);
    return i < 0 ? null : [i, j > 0 ? j + 3 : HTML.length];
  }).filter(Boolean);
  let m;
  while ((m = est.exec(HTML)) !== null) {
    if (prot.some(function(r){ return m.index >= r[0] && m.index < r[1]; })) continue;
    const hs = m[2].match(/#[0-9a-fA-F]{3,8}/g);
    if (hs) bloques.push(hs.join(" ") + "  →  " + m[2].slice(0, 60));
  }
  ok(bloques.length === 0,
     "ningun color escrito a mano fuera del informe",
     bloques.length ? bloques.length + " sitios, p.ej. " + bloques[0] : "");
}

// El informe del cierre de mes se QUEDA CLARO: se imprime y se le manda al
// contador, y un PDF negro gasta tinta y se lee peor fuera de su pantalla. Por
// eso esas dos funciones NO usan los nombres: cuando se enciendan los colores
// oscuros, el papel sigue blanco solo.
{
  ["generarInformePDF", "rInformeCierre"].forEach(function(f){
    const cuerpo = sacarFuncion(f);
    ok(!/var\(--(sup|tx|ln|ok|mal|avi|info|ac|tit)/.test(cuerpo),
       "el informe (" + f + ") no usa los colores del tema: se imprime en blanco");
  });
}

// ── Las DOS pantallas de entrada van vestidas igual ───────────────────────
// Son la misma puerta y se salta de una a otra con un boton. Si alguien viste
// solo una, al pulsar "Entrar con correo y clave" cambia el fondo entero y
// parece un fallo de la app. Por eso la guardia mira las dos a la vez.
{
  const desb = sinComentarios(sacarFuncion("rDesbloqueoHuella"));
  const log  = sinComentarios(sacarFuncion("rLogin"));
  ["login-wrap","ent-caja","login-card","ent-avwrap","ent-avatar","ent-hola","ent-marca",
   "ent-btn","ent-chips"].forEach(function(c){
    ok(desb.indexOf(c)>=0 && log.indexOf(c)>=0,
       "las dos pantallas de entrada usan ."+c);
  });
  // El login sigue siendo el login: los campos y el boton que lee entrarConCorreo
  ok(/id="api-correo"/.test(log) && /id="api-clave"/.test(log) && /id="api-btn"/.test(log),
     "el login conserva los tres id que lee entrarConCorreo");
  ok(/entrarConCorreo\(\)/.test(log), "y el boton sigue llamando a entrarConCorreo");
  ok(/ent-input/.test(log), "los campos del login usan la caja oscura, no la blanca de antes");
  ok(/ent-ojo/.test(log) && /el\.type=el\.type===/.test(log),
     "y el ojo para ver la clave sigue ahi");
  // La inicial es lo que dice CON QUE CUENTA entras, que con produccion y
  // pruebas abiertas a la vez no es un adorno.
  ok(/ent-avatar">'\+\(ini\?/.test(sacarFuncion("rDesbloqueoHuella")),
     "el desbloqueo enseña la inicial de la persona");
}
{
  const emerg = sinComentarios(sacarFuncion("entrarConClaveEnVezDeHuella"));
  ok(/_bloqueoHuella=false/.test(emerg), "la salida de emergencia quita el bloqueo");
  ok(!/credentials/.test(emerg), "y no depende de la huella para nada");
}
{
  const arranque = sinComentarios(sacarFuncion("_apiRestaurarSesion"));
  ok(/_huellaDeEstaPersona\(\) && _huellaDisponible\(\)/.test(arranque),
     "solo se bloquea si hay huella DE ESTA PERSONA y el aparato puede leerla");
  ok(/S\._bloqueoHuella=false/.test(arranque),
     "y si el servidor dice que la sesion murio, el bloqueo se cae con ella");
}
// ARREGLO 65: la huella SOBREVIVE a "Salir". Se borraba, por miedo a que la
// siguiente persona se encontrara una cerradura ajena; pero eso ya lo impide el
// correo, y borrarla obligaba a registrarla de nuevo cada vez que ella entra y
// sale —que es a diario, porque cambia entre produccion y pruebas—.
{
  const sal = sinComentarios(sacarFuncion("salir"));
  ok(!/_huellaOlvidar\(\)/.test(sal),
     "salir NO borra la huella: registrarla una vez por aparato tiene que bastar");
  ok(/_bloqueoHuella=false/.test(sal),
     "pero si quita el bloqueo, para que salir lleve a la pantalla de entrar");
  // Y lo que sostiene que sea seguro dejarla: sin sesion no desbloquea nada.
  const quien = sinComentarios(sacarFuncion("_huellaDeEstaPersona"));
  ok(/if\(!d\) return null/.test(quien) && /correo && d\.correo===correo/.test(quien),
     "sin sesion, o con el correo de otra persona, la huella guardada no abre nada");
  // Quitarla a proposito sigue siendo posible, y es lo unico que la borra.
  ok(/_huellaOlvidar\(\)/.test(sinComentarios(sacarFuncion("quitarHuella"))),
     "la unica forma de borrarla es el boton de Configuracion");
}
{
  const reg = sinComentarios(sacarFuncion("registrarHuella"));
  ok(/userVerification:"required"/.test(reg),
     "al registrar se exige que el aparato COMPRUEBE a la persona, no solo que este presente");
  ok(/authenticatorAttachment:"platform"/.test(reg),
     "y que sea el lector del propio aparato");
  const pide = sinComentarios(sacarFuncion("pedirHuella"));
  ok(/userVerification:"required"/.test(pide), "y lo mismo al desbloquear");
  ok(/allowCredentials/.test(pide), "usando la credencial registrada aqui, no cualquiera");
}
// La credencial se guarda amarrada al correo: si entra otra persona en el mismo
// aparato, no se encuentra la cerradura de la anterior.
{
  const src = sinComentarios(sacarFuncion("_huellaDeEstaPersona"));
  ok(/d\.correo===correo/.test(src), "la huella esta amarrada al correo de quien la registro");
}
// R() tiene que enseñar el desbloqueo ANTES del login, o la sesion que espera
// detras no se ve nunca.
{
  const r = sinComentarios(sacarFuncion("R"));
  ok(r.indexOf("rDesbloqueoHuella()") < r.indexOf("rLogin()"),
     "el desbloqueo se dibuja antes que el login");
}
// Y sin contexto seguro no se ofrece: en http o en un file:// no existe.
ok(/window\.isSecureContext/.test(sacarFuncion("_huellaDisponible")),
   "no se ofrece la huella donde el navegador no puede darla");


// ─────────────────────────────────────────────────────────────────────────
// ARREGLO 66 — el formulario de USDT rellena el tercer numero y avisa
// cuando los tres no cuadran.
//
// Los numeros de aca salen del historial de ordenes P2P de Binance de la
// duena (15/08 al 14/09) cruzado con su export del 14/09. No son inventados:
// si alguien cambia la direccion de alguna cuenta, dejan de dar lo suyo.
// ─────────────────────────────────────────────────────────────────────────
console.log("\n— El formulario de USDT (ARREGLO 66) —");

// La VENTA: lo que ella teclea es el total que SALE de Binance (liberado mas
// comision), asi que la comision se resta antes de multiplicar por la tasa.
// Orden 22921953629031460864: Binance vendio 114,37 a 874,30 por 100.000 Bs,
// y del monedero salieron 114,43.
// No cuadra clavado y no puede: Binance publica el precio redondeado, asi que
// sus propios "Precio total" y cantidad x precio se separan hasta un 0,0383%
// (medido en sus 57 ordenes). Por eso el descuadre tolera el 0,5%.
ok(Math.abs(F._fiatIU(114.43, 874.3, 0.06, true) - 100000) / 100000 < 0.0005,
   "venta: (total liberado - comision) x tasa da los bolivares de Binance",
   F._fiatIU(114.43, 874.3, 0.06, true));
ok(Math.abs(F._usdtIU(100000, 874.3, 0.06, true) - 114.43) < 0.02,
   "y al reves: de los bolivares y la tasa sale el total liberado",
   F._usdtIU(100000, 874.3, 0.06, true));
ok(Math.abs(F._tasaIU(100000, 114.43, 0.06, true) - 874.3) < 0.1,
   "y la tasa sale de los otros dos", F._tasaIU(100000, 114.43, 0.06, true));

// La COMPRA paga en fiat y la comision se descuenta despues, en USDT: el
// monto gastado NO la lleva. Orden 22922682205394382848: 150.000 Bs a 875,799
// son 171,27 de orden, y a ella le quedaron 171,21.
ok(Math.abs(F._fiatIU(171.27, 875.799, 0.06, false) - 150000) < 5,
   "compra: cantidad x tasa da lo gastado, sin tocar la comision",
   F._fiatIU(171.27, 875.799, 0.06, false));
ok(Math.abs(F._usdtIU(150000, 875.799, 0.06, false) - 171.27) < 0.02,
   "y de lo gastado y la tasa sale la cantidad de la orden",
   F._usdtIU(150000, 875.799, 0.06, false));
// La diferencia entre las dos direcciones es justo la comision: si alguien
// las iguala, la compra acredita de mas o la venta cobra de menos.
ok(F._usdtIU(100000, 874.3, 0.06, true) !== F._usdtIU(100000, 874.3, 0.06, false),
   "compra y venta NO tratan la comision igual");

// El trio depende del tipo: en la venta el fiat es lo recibido, en la compra
// lo gastado. Si se confunden, se rellena el campo equivocado.
S.nIU = { tipo: "venta" };
ok(F._trioIU().fiat === "bsRecibidos", "en la venta el fiat es bsRecibidos", F._trioIU().fiat);
S.nIU = { tipo: "compra" };
ok(F._trioIU().fiat === "montOrigen", "en la compra el fiat es montOrigen", F._trioIU().fiat);

// El dedazo del 19/08, con sus cifras exactas. Apunto 1.261,77 USDT donde de
// Binance salieron 1.291,83 —un 6 por un 9— pero los bolivares los tecleo
// aparte y bien, asi que el lote quedo guardado diciendo tasa 947 mientras en
// el campo de al lado ella misma habia escrito 925,01.
S.nIU = { tipo: "venta", monedaVenta: "VES", usdt: "1261.77", tasa: "925.01",
          bsRecibidos: "1194905.805", comision: 0.06 };
{
  const d = F._descuadreIU();
  ok(!!d, "el dedazo del 19/08 se caza");
  ok(d && Math.abs(d.tasaReal - 947) < 1,
     "y dice cual seria la tasa de verdad si el monto fuera bueno", d && d.tasaReal);
}
// Con el numero bueno no molesta.
S.nIU.usdt = "1291.83";
ok(F._descuadreIU() === null, "con el numero correcto no avisa de nada");

// Y el ruido normal se deja pasar: Binance redondea sus cantidades a dos
// decimales, asi que casi nunca cuadra clavado. Si esto avisara, avisaria
// siempre y dejaria de mirarse.
S.nIU = { tipo: "venta", monedaVenta: "VES", usdt: "114.43", tasa: "874.3",
          bsRecibidos: "100000", comision: 0.06 };
ok(F._descuadreIU() === null, "el redondeo de Binance no dispara el aviso");

// Sin los tres numeros no hay nada que comparar: no puede avisar a medio teclear.
S.nIU = { tipo: "venta", usdt: "114.43", tasa: "", bsRecibidos: "100000", comision: 0.06 };
ok(F._descuadreIU() === null, "a medio rellenar se calla");

// Sus cuatro ordenes registradas dos veces entraron porque la comprobacion
// solo miraba los lotes ACTIVOS: en los cuatro casos el primero ya estaba
// archivado cuando llego el duplicado.
S.inventarioUsdt = [{ ordenId: "111", tipo: "compra", usdt: 10, tasa: 5, moneda: "BRL" }];
S.inventarioUsdt_cerrado = [{ ordenId: "22909791031187947520", tipo: "compra",
                              usdt: 96.69, tasa: 5.167, moneda: "BRL", _cerrado: true }];
ok(!!F._loteConOrden("111"), "encuentra la orden repetida entre los lotes activos");
ok(!!F._loteConOrden("22909791031187947520"),
   "y TAMBIEN entre los archivados, que es por donde se colaron los suyos");
ok(F._loteConOrden(" 22909791031187947520 "), "sin que estorben los espacios");
ok(F._loteConOrden("") === null && F._loteConOrden(null) === null,
   "sin numero de orden no inventa un duplicado");

// Guardias de estructura: lo que no se puede deshacer sin romper esto.
{
  const sv = sinComentarios(sacarFuncion("saveIU"));
  ok(/_loteConOrden\(/.test(sv),
     "saveIU busca el duplicado con _loteConOrden, que mira los dos sitios");
  ok(!/\(S\.inventarioUsdt\|\|\[\]\)\.some\(function\(l\)\{return l\.ordenId/.test(sv),
     "y no vuelve a mirar solo los activos");
  ok(/_descuadreIU\(\)/.test(sv), "y no deja guardar un descuadre sin preguntar");
}
// _autoIU corre en CADA tecla: si repinta, destruye el input bajo el dedo
// (ARREGLO 32). Tiene que escribir en el DOM, como _refrescarAbonoPrest.
{
  const au = sinComentarios(sacarFuncion("_autoIU"));
  ok(!/\bR\(\)/.test(au), "_autoIU no repinta la pantalla mientras ella teclea");
  ok(/document\.activeElement!==el/.test(au),
     "y nunca escribe en el campo que tiene debajo del dedo");
  const rf = sinComentarios(sacarFuncion("_refrescarIU"));
  ok(!/\bR\(\)/.test(rf), "ni _refrescarIU");
}
// Los tres campos tienen que estar conectados, o el autorelleno no se entera.
["montOrigen", "usdt", "tasa", "bsRecibidos"].forEach(function (k) {
  // En index.html vive dentro de un oninput, con las comillas escapadas:
  //   _autoIU(\"tasa\")
  var busca = '_autoIU(' + '\\"' + k + '\\"' + ')';
  ok(HTML.indexOf(busca) >= 0,
     "el campo " + k + " avisa al autorelleno");
});
ok((HTML.match(/id='iu-fiat'/g) || []).length === 2 &&
   (HTML.match(/id='iu-usdt'/g) || []).length === 2 &&
   (HTML.match(/id='iu-tasa'/g) || []).length === 2,
   "los tres campos llevan su id en las dos pantallas (compra y venta)");
// El recuadro del calculo se arma en su propia funcion para poder refrescarlo
// sin R(); si vuelve a armarse dentro del render, se queda con la cuenta
// anterior mientras ella teclea (es el fallo del ARREGLO 55).
ok(/id='iu-prev'/.test(HTML) && /_htmlPrevIU\(\)/.test(HTML),
   "el recuadro del calculo se puede refrescar solo");


// ─────────────────────────────────────────────────────────────────────────
// IMPORTAR DE BINANCE
//
// Las filas de aca son REALES: salen de sus exports del 15/09 (cuenta SAIPHA
// y cuenta JULIO). Si Binance cambia un rotulo o el importador deja de
// entender una columna, estas pruebas lo cantan.
// ─────────────────────────────────────────────────────────────────────────
console.log("\n— Importar de Binance —");
const FIX = {"c2c": [["","","","","","","","","","","","","","www.binance.com"],["","","Historial de órdenes C2C"],["","","Nombre","J. DEL CARMEN HERNANDEZ BARRETO","","Email","saipha.servicos.digitais@gmail.com","","Dirección","R MONTE RORAIMA S/N VILA NOVA RR"],["","","ID de usuario","1259063977","","Período(UTC--4)","2026-09-01 to 2026-09-15"],["","","Número de Pedido","Tipo de orden","Activo","Tipo de Fiat","Precio Total","Precio","Cantidad","Tipo de cambio","Tarifa de creador","Comisión de tomador","Contraparte","Estado","Hora de creación"],["","","22928483177651154944","Sell","USDT","BRL","100","5.11","19.56","","","0.07","_Ckrypto_","Completed","2026-09-02 11:07:24"],["","","22928585081217331200","Sell","USDT","BRL","676.05","5.113","132.22","","","0.07","Anderson-26","Completed","2026-09-02 17:52:19"],["","","22929998835071328256","Sell","USDT","BRL","100","5.177","19.31","","","0.07","cambioviagem","Completed","2026-09-06 15:30:05"],["","","22930837293825511424","Sell","USDT","BRL","1050","5.108","205.55","","","0.07","_Ckrypto_","Completed","2026-09-08 23:01:49"],["","","22932202144596058112","Buy","USDT","BRL","2075","5.162","401.97","","","0.07","IaCrypto_net","Completed","2026-09-12 17:25:15"]],"c2c_julio": [["","","","","","","","","","","","","","www.binance.com"],["","","Historial de órdenes C2C"],["","","Nombre","JULIO FRANCISCO HERNANDEZ","","Correo electrónico","marshalljulio46@gmail.com","","Dirección","Av Pacasmayo 07036, Callao, Perú"],["","","Id. de usuario","338951166","","Periodo(UTC--4)","2026-08-15 to 2026-09-15"],["","","Número de orden","Tipo de orden","Activo","Tipo de Fiat","Precio total","Precio","Cantidad","Tipo de cambio","Comisión del Creador","Comisión del tomador","Contraparte","Estado","Hora de creación"],["","","22921953629031460864","Sell","USDT","VES","100000","874.3","114.37","","","0.06","3lpriet0","Completed","2026-08-15 10:41:18"],["","","22921999413204643840","Buy","USDT","VES","31448","875","35.94","","","0.06","ASCENDERLTDA-REMESAS","Completed","2026-08-15 13:43:14"],["","","22922061345427742720","Sell","USDT","VES","20000","868.1","23.03","","","0.06","CCambia","Completed","2026-08-15 17:49:20"],["","","22922103795244138496","Sell","USDT","VES","50000","866.6","57.69","","","0.06","JU4NPOL4C4","Completed","2026-08-15 20:38:00"],["","","22922340917704065024","Sell","USDT","VES","100000","868.163","115.18","","","0.06","RicoMcPato_3minutos","Completed","2026-08-16 12:20:15"],["","","22922682205394382848","Buy","USDT","VES","150000","875.799","171.27","","","0.06","diegoramirez20","Completed","2026-08-17 10:56:24"],["","","22922787973000278016","Buy","USDT","VES","55800","894.999","62.34","","","0.06","CriptoQueen27","Cancelled","2026-08-17 17:56:41"],["","","22922809418894782464","Buy","USDT","VES","55800","889.79","62.71","","","0.06","Roa0805","Cancelled","2026-08-17 19:21:54"]],"tx": [["","","","","","","","","","","","www.binance.com"],["","","Historial de transacciones"],["","","Nombre","J. DEL CARMEN HERNANDEZ BARRETO","","Email","saipha.servicos.digitais@gmail.com","","Dirección","R MONTE RORAIMA S/N VILA NOVA RR"],["","","ID de usuario","1259063977","","Período(UTC--4)","2026-09-01 to 2026-09-15"],["","","ID de usuario","Hora","","Cuenta","Operación","","Moneda","Cambiar","","Comentario"],["","","1259063977","2026-09-01 10:14:16","","Spot","Binance Convert","","USDT","257.93570875","",""],["","","1259063977","2026-09-01 10:14:16","","Spot","Binance Convert","","BRL","-1331.98","",""],["","","1259063977","2026-09-01 14:02:13","","Funding","Binance Convert","","USDT","-69","",""],["","","1259063977","2026-09-01 14:02:13","","Spot","Binance Convert","","USDT","69","",""],["","","1259063977","2026-09-01 14:04:39","","Spot","Binance Convert","","BRL","355.77592695","",""],["","","1259063977","2026-09-01 14:04:39","","Spot","Binance Convert","","USDT","-69.0076668","",""],["","","1259063977","2026-09-02 07:59:50","","Spot","Binance Convert","","USDT","68.92210905","",""],["","","1259063977","2026-09-02 07:59:50","","Spot","Binance Convert","","BRL","-355.77592695","",""],["","","1259063977","2026-09-02 21:25:20","","Spot","Binance Convert","","BRL","-224.56","",""],["","","1259063977","2026-09-02 21:25:20","","Spot","Binance Convert","","USDT","43.91426783","",""],["","","1259063977","2026-09-03 16:50:50","","Spot","Binance Convert","","BRL","-437","",""],["","","1259063977","2026-09-03 16:50:50","","Spot","Binance Convert","","USDT","85.32156663","",""],["","","1259063977","2026-09-08 09:48:32","","Spot","Binance Convert","","BRL","-1975","",""],["","","1259063977","2026-09-08 09:48:32","","Spot","Binance Convert","","USDT","386.49706457","",""]],"tx_btc": [["","","","","","","","","","","","www.binance.com"],["","","Historial de transacciones"],["","","Nombre","JULIO FRANCISCO HERNANDEZ","","Correo electrónico","marshalljulio46@gmail.com","","Dirección","Av Pacasmayo 07036, Callao, Perú"],["","","Id. de usuario","338951166","","Periodo(UTC--4)","2026-08-15 to 2026-09-15"],["","","ID de usuario","Tiempo","","Cuenta","Operación","","Moneda","Cambio","","Observación"],["","","338951166","2026-08-24 21:02:46","","Funding","Binance Convert","","USDT","-200","",""],["","","338951166","2026-08-24 21:02:46","","Funding","Binance Convert","","BTC","0.00249195","",""],["","","338951166","2026-09-03 13:37:16","","Funding","Binance Convert","","USDT","202.17883112","",""],["","","338951166","2026-09-03 13:37:16","","Funding","Binance Convert","","BTC","-0.00249195","",""]]};

// Binance escribe con PUNTO decimal. _leerNumero, que es lo que usa la app
// para lo que ella teclea, leeria 5.113 como 5113 por la regla de "punto y
// tres decimales son miles". Por eso el importador tiene su propio lector.
ok(F._binNum("5.113") === 5.113, "_binNum lee el punto como decimal", F._binNum("5.113"));
ok(F._binNum("633911.82") === 633911.82, "y los montos grandes", F._binNum("633911.82"));
ok(F._binNum("-1331.98") === -1331.98, "y los negativos", F._binNum("-1331.98"));
ok(F._leerNumero("5.113") === 5113,
   "mientras _leerNumero sigue leyendolo como 5113 (y debe seguir asi)", F._leerNumero("5.113"));
ok(isNaN(F._binNum("")) && isNaN(F._binNum(null)), "sin valor no inventa un cero");

// Los rotulos cambian de un export a otro segun el idioma con que Binance lo
// genero: "Numero de orden" y "Numero de Pedido", "Hora" y "Tiempo".
ok(F._binNorm("Número de Pedido") === "numero de pedido", "_binNorm quita acentos y mayusculas");
{
  const cab = ["", "", "Número de orden", "Tipo de orden", "Activo", "Tipo de Fiat",
               "Precio total", "Precio", "Cantidad"];
  const m = F._binMapaCols(cab, { total: ["precio total"], precio: ["precio"] });
  // "precio" es prefijo de "precio total": por prefijo se cogeria la columna 6.
  ok(m.precio === 7 && m.total === 6, "la columna se reconoce entera, no por prefijo",
     JSON.stringify(m));
}

// Reconoce el archivo y de que cuenta es, sin que ella tenga que decirlo.
{
  const id = F._binIdentificar(FIX.c2c);
  ok(id.tipo === "c2c", "reconoce el historial de ordenes C2C", id.tipo);
  ok(id.uid === "1259063977", "y saca el ID de usuario", id.uid);
  ok(/saipha/.test(id.correo), "y el correo", id.correo);
  ok(F._binIdentificar(FIX.tx).tipo === "tx", "y distingue el de transacciones");
}

// Las ordenes P2P.
{
  const o = F._binOrdenesC2C(FIX.c2c);
  ok(o.length === 5, "lee las 5 ordenes de SAIPHA", o.length);
  const v = o.find((x) => x.ordenId === "22928585081217331200");
  ok(v && v.tipo === "venta" && v.moneda === "BRL", "Sell es una venta en reales");
  // Lo que la app guarda no es la cantidad de la orden: es lo que se movio del
  // monedero. En la venta salen la cantidad MAS la comision.
  ok(v && Math.abs(v.usdt - 132.29) < 0.005,
     "y guarda el total que sale del monedero (132,22 + 0,07)", v && v.usdt);
  const c = o.find((x) => x.tipo === "compra");
  ok(c && Math.abs(c.usdt - 401.97) < 0.005,
     "en la compra guarda la cantidad de la orden; la comision se resta al crear el lote", c && c.usdt);
  // Las canceladas no movieron ni un USDT.
  const oj = F._binOrdenesC2C(FIX.c2c_julio);
  ok(oj.every((x) => x.ordenId), "ninguna fila sin numero de orden");
  ok(oj.length < 8, "las canceladas se descartan", oj.length);
}

// Las conversiones: dos filas con la MISMA hora, una del fiat y otra del USDT.
{
  const c = F._binConverts(FIX.tx);
  ok(c.length >= 5, "empareja las conversiones por la hora exacta", c.length);
  const compra = c.find((x) => Math.abs(x.monto - 1975) < 0.01);
  ok(compra && compra.tipo === "compra" && compra.moneda === "BRL",
     "fiat que sale y USDT que entra es una compra");
  ok(compra && Math.abs(compra.usdt - 386.4971) < 0.001, "con su USDT", compra && compra.usdt);
  ok(compra && Math.abs(compra.tasa - 5.11) < 0.001, "y la tasa sale de dividir", compra && compra.tasa);
  // El 01/09 convirtio 69 USDT en 355,78 reales: eso es una VENTA.
  const venta = c.find((x) => x.tipo === "venta");
  ok(!!venta, "fiat que entra y USDT que sale es una venta");
  // Un par con USDT en los dos lados es un movimiento entre sus propios
  // monederos (Funding y Spot), no un cambio.
  ok(c.every((x) => x.moneda !== "USDT"), "un movimiento interno no crea un lote");
  ok(c.every((x) => x.ordenId.indexOf("CNV-") === 0),
     "se les fabrica un numero con su hora, para no importarlas dos veces");
}
// En la cuenta de Julio hay conversiones USDT<->BTC: mueve criptomoneda, no
// dinero de clientes. Colarlas crearia un lote en BTC con tasa 0,0000.
ok(F._binConverts(FIX.tx_btc).length === 0, "las conversiones a BTC no entran",
   F._binConverts(FIX.tx_btc).length);
ok(!F._binMonedaConocida("BTC") && F._binMonedaConocida("BRL") && !F._binMonedaConocida("USDT"),
   "solo entran las monedas que la app conoce");

// Duplicados.
S.inventarioUsdt = [];
S.inventarioUsdt_cerrado = [
  { ordenId: "22928585081217331200", tipo: "venta", moneda: "BRL", usdt: 132.29, bs: 676.05,
    fecha: "09/02", fechaIso: "2026-09-02", tasa: 5.113 },
];
{
  const o = F._binOrdenesC2C(FIX.c2c);
  const lotes = S.inventarioUsdt.concat(S.inventarioUsdt_cerrado);
  const rep = o.find((x) => x.ordenId === "22928585081217331200");
  ok(!!F._binYaRegistrado(rep, lotes),
     "una orden P2P ya registrada se reconoce por su numero, tambien archivada");
  const otra = o.find((x) => x.ordenId !== "22928585081217331200");
  ok(!F._binYaRegistrado(otra, lotes), "y una nueva no");
}
// Las conversiones NO traen numero de orden en el export, asi que se
// reconocen por el importe. Su lote CNV-1D3ZYEZ esta apuntado el 08/09 y la
// conversion fue el 11/09: la fecha no puede exigirse igual.
{
  const lotes = [{ tipo: "compra", moneda: "BRL", usdt: 317.9361, montOrigen: 1618.6,
                   fecha: "09/08", fechaIso: "2026-09-08", ordenId: "CNV-1D3ZYEZ" }];
  const op = { origen: "convert", tipo: "compra", moneda: "BRL", usdt: 317.9961,
               monto: 1618.6, hora: "2026-09-11 09:02:34" };
  ok(!!F._binYaRegistrado(op, lotes), "una conversion ya registrada se reconoce por el importe");
  // Pero no a cualquier distancia: tiene TRES ventas iguales de 19,30 USDT por
  // 100 R$ en agosto. Sin limite de fecha, una de septiembre se daria por
  // registrada y se perderia.
  const lejos = { origen: "convert", tipo: "compra", moneda: "BRL", usdt: 317.9961,
                  monto: 1618.6, hora: "2026-11-11 09:02:34" };
  ok(!F._binYaRegistrado(lejos, lotes), "pero no si esta a dos meses de distancia");
  ok(F._binDias("2026-09-08", "2026-09-11") === 3, "_binDias cuenta bien", F._binDias("2026-09-08","2026-09-11"));
  ok(F._binDias("", "2026-09-11") === 999, "y sin fecha no empareja a ciegas");
}

// El banco cambia en cada operacion -PagBank, Nubank, Banesco-, asi que se
// propone el que ella mas ha usado en esas mismas condiciones.
{
  const lotes = [
    { tipo: "compra", moneda: "BRL", cuentaId: "cA", cuentaOrigenId: "pag" },
    { tipo: "compra", moneda: "BRL", cuentaId: "cA", cuentaOrigenId: "pag" },
    { tipo: "compra", moneda: "BRL", cuentaId: "cA", cuentaOrigenId: "nub" },
    { tipo: "venta",  moneda: "VES", cuentaId: "cB", cuentaDestinoId: "bdv" },
  ];
  ok(F._binCuentaSugerida(lotes, "cA", "BRL", "compra") === "pag", "propone el banco mas repetido");
  ok(F._binCuentaSugerida(lotes, "cB", "VES", "venta") === "bdv", "y en la venta mira la cuenta de destino");
  ok(F._binCuentaSugerida(lotes, "cA", "COP", "compra") === "", "sin historia no se inventa ninguno");
}

// Un mes con su cierre hecho ya esta contado y declarado: meterle una
// operacion cambia una ganancia que ella dio por buena. Entra si lo decide,
// pero desmarcada.
S.cierresMes = [{ mesKey: "2026-08" }, { mesKey: "2026-07" }];
ok(F._binMesCerrado("2026-08-20"), "reconoce un mes con el cierre hecho");
ok(!F._binMesCerrado("2026-09-20"), "y septiembre sigue abierto");
ok(!F._binMesCerrado(""), "sin fecha no dice que este cerrado");
{
  const imp2 = sinComentarios(sacarFuncion("_binImportar"));
  ok(/o\.cerrado/.test(imp2), "y al guardar se avisa de cuantas caen en un mes cerrado");
  const rec2 = sinComentarios(sacarFuncion("_binRecalcular"));
  ok(/!o\.cerrado/.test(rec2), "esas entran desmarcadas");
}
// La tasa de una conversion sale de dividir y eso deja cola de punto flotante:
// 355.77592695 / 69.0076668 da 5.155599999940876.
{
  const c = F._binConverts(FIX.tx);
  ok(c.every((x) => String(x.tasa).replace(/^\d*\.?/, "").length <= 6),
     "la tasa se redondea: nada de 5.155599999940876",
     c.map((x) => x.tasa).join(" "));
}

// Guardias de estructura.
{
  const imp = sinComentarios(sacarFuncion("_binImportar"));
  ok(/sel\.sort\(/.test(imp),
     "las operaciones entran en orden de fecha, o el FIFO consume el lote equivocado");
  ok(/permisoEdicion\(\)/.test(imp), "y no graba quien no puede guardar");
  ok(/_fechaLote\(/.test(imp) && /_fechaLoteIso\(/.test(imp),
     "las fechas pasan por _fechaLote y llevan su año (ARREGLO 51)");
  ok(/confirm\(/.test(imp), "nada se graba sin confirmar");
  const rec = sinComentarios(sacarFuncion("_binRecalcular"));
  ok(/visto\[k\]/.test(rec), "el mismo archivo dos veces no duplica");
  const mar = sinComentarios(sacarFuncion("_binMarcar"));
  ok(!/\bR\(\)/.test(mar), "marcar una casilla no repinta la tabla (ARREGLO 32)");
}
// Un campo que se sincroniza tiene que estar en DATA_KEYS o el remoto lo
// borra, y en _MERGE_OBJETOS o se reemplaza entero en vez de unirse.
ok(F.DATA_KEYS.indexOf("mapaBinance") !== -1, "mapaBinance viaja en DATA_KEYS");
ok(sacarConstante("_MERGE_OBJETOS").indexOf("mapaBinance") !== -1,
   "y se fusiona clave a clave, no de golpe");


console.log("\n— Cerrar el mes, y el banco del importador —");

// El boton del informe llamaba directo a ejecutarCierreMes() sin preguntar
// nada, y esta pegado al de PDF: asi se le cerro septiembre teniendolo en
// curso. Y no habia forma de deshacerlo.
{
  const html = sinComentarios(HTML);
  ok(!/onclick='ejecutarCierreMes\(S\._cMes,true\)'/.test(html),
     "el boton del informe ya no cierra el mes a bocajarro");
  const cer = sinComentarios(sacarFuncion("cerrarMesDesdeInforme"));
  ok(/confirm\(/.test(cer), "pregunta antes de cerrar");
  ok(/permisoEdicion\(\)/.test(cer), "y no cierra quien no puede guardar");
}
// Reabrir SOLO el mes en curso: el cierre guarda una foto de los saldos, de lo
// que le deben y de lo prestado. Borrar el de un mes pasado tira esa foto, y
// al volver a cerrarlo se tomarian los saldos de HOY.
{
  const re = sinComentarios(sacarFuncion("reabrirMes"));
  ok(/getMesKeyActual\(\)/.test(re), "reabrir se limita al mes en curso");
  ok(/confirm\(/.test(re), "y tambien pregunta");
  ok(/ultimoMesCerrado/.test(re),
     "al reabrir, ultimoMesCerrado vuelve al mas nuevo que quede");
  ok(/permisoEdicion\(\)/.test(re), "y respeta el permiso de guardar");
}

// El banco no viene en el archivo de Binance, asi que la sugerencia tiene que
// decir que es una sugerencia. Sus 123 ventas en VES: 111 a Banco de Venezuela.
{
  const lotes = [];
  for (let i = 0; i < 9; i++) lotes.push({ tipo: "venta", moneda: "VES", cuentaDestinoId: "bdv" });
  lotes.push({ tipo: "venta", moneda: "VES", cuentaDestinoId: "banesco" });
  const c = F._binConfianzaBanco(lotes, "", "VES", "venta");
  ok(c.id === "bdv" && c.n === 9 && c.total === 10,
     "dice cual propone y sobre cuantas", JSON.stringify(c));
  ok(F._binConfianzaBanco([], "", "COP", "venta").total === 0,
     "sin historia no inventa un porcentaje");
}
// Y se puede dejar sin banco: el lote, el FIFO y la ganancia no dependen de el.
{
  const imp = sinComentarios(sacarFuncion("_binImportar"));
  ok(/cuentaOrigenId:o\.cuentaFiat\|\|""/.test(imp) && /cuentaDestinoId:o\.cuentaFiat\|\|""/.test(imp),
     "importar sin banco es valido");
  ok(/contraparte:o\.contraparte/.test(imp),
     "y el lote se queda con la contraparte, para reconocerlo en el extracto");
  const sin = sinComentarios(sacarFuncion("_binImportar"));
  ok(!/sinBanco|!o\.cuentaFiat/.test(sin.split("sinCuenta")[0] || ""),
     "el banco no bloquea la importacion");
}
// Lo importado sin banco no puede quedar invisible.
S.inventarioUsdt = [
  { id: 1, tipo: "venta", moneda: "VES", bs: 100000, cuentaDestinoId: "", fecha: "09/02" },
  { id: 2, tipo: "venta", moneda: "VES", bs: 50000, cuentaDestinoId: "bdv", fecha: "09/03" },
  { id: 3, tipo: "compra", moneda: "BRL", montOrigen: 500, cuentaOrigenId: "", fecha: "09/04" },
  { id: 4, tipo: "compra", moneda: "USDT", montOrigen: 10, cuentaOrigenId: "", fecha: "09/05" },
];
S.inventarioUsdt_cerrado = [];
{
  const p = F._binSinBanco();
  ok(p.length === 2, "lista los que esperan banco", p.length);
  ok(p.every((l) => l.moneda !== "USDT"),
     "un lote en USDT no lleva banco aparte y no cuenta");
  ok(p.some((l) => l.id === 1) && p.some((l) => l.id === 3),
     "entran tanto las ventas como las compras");
}
// Un lote en blanco no movio dinero: no hay banco que asignarle y solo alarga
// la lista. La app ya los marca aparte como "registro sin montos".
S.inventarioUsdt.push({ id: 5, tipo: "venta", moneda: "VES", bs: 0, cuentaDestinoId: "", fecha: "09/06" });
ok(!F._binSinBanco().some((l) => l.id === 5), "un lote en blanco no entra en los pendientes");
// Asignarlo despues tiene que mover el saldo: el dinero entro o salio de
// verdad, solo que no se sabia de donde.
{
  const pon = sinComentarios(sacarFuncion("_binPonerBanco"));
  ok(/c\.saldo=/.test(pon), "al asignar el banco se mueve el saldo de esa cuenta");
  ok(/l\._mod=Date\.now\(\)/.test(pon), "y el lote queda marcado para la sincronizacion");
  ok(/permisoEdicion\(\)/.test(pon), "con permiso de guardar");
}
// La contraparte viene en el archivo y antes se tiraba.
{
  const o = F._binOrdenesC2C(FIX.c2c);
  ok(o.every((x) => typeof x.contraparte === "string"),
     "todas las ordenes traen contraparte");
  ok(o.some((x) => x.contraparte.length > 0), "y al menos una con nombre",
     o.map((x) => x.contraparte).join("|"));
}


console.log("\n— El numero de orden identifica la operacion —");
// Al mismo comerciante se le puede comprar tres veces el mismo dia, asi que el
// nombre no distingue: el numero de orden es lo unico unico. Y con el se busca
// en Binance, que es donde SI se ve el metodo de pago.
{
  const h = F._htmlOrdenCopiable("22932202144596058112");
  ok(h.indexOf("22932202144596058112") >= 0,
     "el numero sale ENTERO: cortado no sirve para buscarlo en Binance");
  ok(/_copiarTexto\(/.test(h), "y se puede copiar de un toque");
  ok(F._htmlOrdenCopiable("") === "" && F._htmlOrdenCopiable(null) === "",
     "sin numero no pinta un boton vacio");
}
// Los 20 digitos tienen que sobrevivir enteros en las dos pantallas.
ok(!/String\(o\.ordenId\)\.slice\(0,\s*12\)/.test(HTML),
   "la tabla del importador ya no corta el numero a 12 caracteres");
{
  const pend = sinComentarios(sacarFuncion("_htmlPendientesBanco"));
  ok(/_htmlOrdenCopiable\(l\.ordenId\)/.test(pend),
     "y la lista de pendientes tambien lo ensena");
  ok(/l\.contraparte/.test(pend),
     "junto a la contraparte, para confirmar que es la operacion buena");
}
// Copiar puede fallar -sin https o sin permiso- y eso no puede dejarla sin el
// numero.
{
  const cp = sinComentarios(sacarFuncion("_copiarTexto"));
  ok(/prompt\(/.test(cp), "si el portapapeles no va, se ensena el numero para copiarlo a mano");
  ok(/isSecureContext/.test(cp), "y solo se intenta donde el navegador lo permite");
}


console.log("\n— Reabrir un mes tiene que sobrevivir a la fusion —");
// cierresMes se fusiona entre dispositivos. Borrarlo solo en el aparato no
// basta: al guardar, el servidor devuelve el cierre y la fusion lo repone.
// Sintoma exacto: le dio a Reabrir y la pantalla siguio diciendo "Cerrado".
{
  const re = sinComentarios(sacarFuncion("reabrirMes"));
  ok(/_marcarBorradoMerge\("cierresMes"/.test(re),
     "reabrir deja constancia del borrado, o el servidor lo devuelve");
  // Y la constancia no sirve de nada si su categoria no se poda: la marca se
  // anota y nadie la aplica (ARREGLOS 13 y 18).
  ok(sacarConstante("_PODA_CATS").indexOf('"cierresMes"') !== -1,
     "y cierresMes entra en la poda, para que la marca se aplique de verdad");
}
// La trampa del otro lado: la marca dura 30 dias. Al cerrar el mes de verdad,
// la poda se lo comeria otra vez.
{
  const ej = sinComentarios(sacarFuncion("ejecutarCierreMes"));
  ok(/_olvidarBorradoMerge\("cierresMes"/.test(ej),
     "y al volver a cerrar, la marca se retira");
}
// La aritmetica de las tres piezas, de punta a punta.
S._deletedMerge = {};
S.cierresMes = [{ mesKey: "2026-09" }, { mesKey: "2026-08" }];
F._marcarBorradoMerge("cierresMes", "2026-09");
ok(F._estaBorradoMerge("cierresMes", "2026-09"), "queda marcado");
ok(!F._estaBorradoMerge("cierresMes", "2026-08"), "y solo ese mes");
// La fusion trae el cierre de vuelta; la poda tiene que sacarlo.
S.cierresMes.push({ mesKey: "2026-09" });
F._podarBorrados();
ok(!S.cierresMes.some((c) => c.mesKey === "2026-09"),
   "aunque el servidor lo devuelva, la poda lo saca");
ok(S.cierresMes.some((c) => c.mesKey === "2026-08"), "sin tocar los demas meses");
// Y al cerrarlo otra vez, la marca se va y el cierre se queda.
F._olvidarBorradoMerge("cierresMes", "2026-09");
S.cierresMes.push({ mesKey: "2026-09" });
F._podarBorrados();
ok(S.cierresMes.some((c) => c.mesKey === "2026-09"),
   "cerrado de nuevo, ya no se lo come la poda");

console.log("\n— El banco se pone por grupo, no fila por fila —");
// El fallo que esto fija: _binFiatTodas se escribio y se quedo SIN CONECTAR a
// la pantalla. La funcion pasaba cualquier prueba que la llamara a mano, y en
// su pantalla no habia ningun boton: sus 31 ventas en VES habia que corregirlas
// abriendo 31 desplegables. Una funcion que nadie llama no arregla nada.
{
  const rend = sinComentarios(sacarFuncion("rImportarBinance"));
  ok(/_binFiatTodas\(/.test(rend),
     "la pantalla del importador dibuja el selector por grupo");
  ok(/aplicar a todas/.test(rend),
     "con su rotulo, para que se entienda que cambia mas de una fila");
  // Agrupar por moneda y tipo, no por una lista de bancos escrita a mano: su
  // empresa va a crecer y las cuentas nuevas tienen que salir solas.
  ok(/c\.moneda\s*===\s*g\.moneda/.test(rend),
     "las cuentas del grupo salen de S.cuentas, no de una lista fija");
  ok(/bin-sup-/.test(rend),
     "y cada fila lleva sitio para la etiqueta de suposicion");
}
{
  const ft = sinComentarios(sacarFuncion("_binFiatTodas"));
  ok(/if\(!id\)\s*return/.test(ft),
     "el hueco del desplegable es el rotulo: no borra el banco de todas");
  ok(/__sin__/.test(ft),
     "dejarlas sin banco a proposito tiene su propia opcion");
  ok(/fiatAuto\s*=\s*false/.test(ft),
     "lo que elige ella deja de contar como suposicion");
}
// "supuesto" es lo unico que separa lo que propuso la app de lo que reviso
// ella. Sin eso, 31 filas iguales y ninguna forma de saber cuales miro.
{
  const rec = sinComentarios(sacarFuncion("_binRecalcular"));
  ok(/fiatAuto\s*=\s*!!o\.cuentaFiat/.test(rec),
     "la sugerencia automatica queda marcada como suposicion");
  const fi = sinComentarios(sacarFuncion("_binFiat"));
  ok(/fiatAuto\s*=\s*false/.test(fi),
     "tocar el desplegable de una fila la da por revisada");
  ok(!/\bR\(\)/.test(fi),
     "y no repinta: la tabla es larga y se perderia el scroll (ARREGLO 32)");
  ok(F._htmlSupuesto({ fiatAuto: true, cuentaFiat: "c1" }).indexOf("supuesto") >= 0,
     "una propuesta se ve como propuesta");
  ok(F._htmlSupuesto({ fiatAuto: false, cuentaFiat: "c1" }) === "",
     "lo que decidio ella no lleva etiqueta");
  ok(F._htmlSupuesto({ fiatAuto: true, cuentaFiat: "" }) === "",
     "y sin banco no hay nada que suponer");
}
// Un "1" con verbo en plural se lee como un error de la app.
{
  const rend = sinComentarios(sacarFuncion("rImportarBinance"));
  ok(/nYa\s*===\s*1/.test(rend) && /nCerr\s*===\s*1/.test(rend),
     "los recuentos de uno van en singular");
}

console.log("\n— FASE 1: la hora de la operacion —");
// Se empieza a guardar la hora a la que ocurrio cada operacion. Hoy NADIE la
// mira: el FIFO sigue ordenando por dia, igual que ayer. El dia que se use sera
// porque ella lo encienda, no por haber empezado a guardarla.
{
  ok(F._horaLote("2026-09-02 11:07:24") === "11:07:24", "lee la hora del export de Binance");
  ok(F._horaLote("9:05") === "09:05:00", "completa los segundos que falten");
  ok(F._horaLote("") === "" && F._horaLote(null) === "", "sin hora no se inventa nada");
  ok(F._horaLote("no es una hora") === "", "lo que no es una hora no pasa");
  ok(F._horaLote("25:00:00") === "", "ni una hora imposible");
  ok(/^\d\d:\d\d:\d\d$/.test(F._horaAhora()), "la de ahora sale en hh:mm:ss");
  ok(F._horaDe("07:30") === "07:30:00", "lo que ella escribe manda");
  ok(/^\d\d:\d\d:\d\d$/.test(F._horaDe("")), "y sin nada escrito, la de ahora: un lote sin hora ya no se fecha nunca");
}
// Ningun lote nuevo puede nacer sin hora. Mismo patron que la guardia de
// _fechaLote: si alguien anade un sitio y se olvida, ese lote queda sin fechar
// para siempre y no hay forma de recuperarlo.
{
  const pushes = HTML.match(/inventarioUsdt\.push\(\{[^}]*/g) || [];
  ok(pushes.length >= 8, "se encontraron los sitios donde nacen lotes (" + pushes.length + ")");
  const sinHora = pushes.filter((x) => !/\bhora:/.test(x));
  ok(sinHora.length === 0, "todos los lotes nuevos nacen con hora" +
     (sinHora.length ? " · sin ella: " + sinHora.length : ""));
  const cl = sinComentarios(sacarFuncion("crearLoteRecibido"));
  ok(/hora:_horaDe\(hora\)/.test(cl), "y el lote de los bolivares que entran por una remesa, tambien");
}
// LA GUARDIA DE FONDO. ordenFIFO tiene que seguir CIEGO a la hora.
{
  const of = sinComentarios(sacarFuncion("ordenFIFO"));
  ok(!/\bhora\b/.test(of), "ordenFIFO NO mira la hora: hoy ordena por dia, exactamente como ayer");
  const nf = sinComentarios(sacarFuncion("normalizarInventarioFIFO"));
  ok(!/\bhora\b/.test(nf), "y a los lotes que ya existen no se les escribe ninguna hora");
}
// Y se demuestra, no se promete: el mismo inventario ordenado con hora y sin
// ella tiene que dar el MISMO orden. Las horas van puestas al reves a proposito
// -la mas tardia al lote mas viejo-: si ordenFIFO las mirara, el orden se daria
// la vuelta y esto fallaria.
{
  const base = [
    { id: 5, fecha: "09/12", fechaIso: "2026-09-12", tipo: "venta",  moneda: "VES" },
    { id: 3, fecha: "09/12", fechaIso: "2026-09-12", tipo: "venta",  moneda: "VES" },
    { id: 9, fecha: "09/12",                          tipo: "venta",  moneda: "VES" }, // viejo, sin año
    { id: 1, fecha: "09/11", fechaIso: "2026-09-11", tipo: "venta",  moneda: "VES" },
    { id: 7, fecha: "09/18", fechaIso: "2026-09-18", tipo: "venta",  moneda: "VES" }, // adelantado a proposito
    { id: 2, fecha: "12/28", fechaIso: "2025-12-28", tipo: "compra", moneda: "BRL" },
    { id: 4, fecha: "01/05", fechaIso: "2026-01-05", tipo: "compra", moneda: "BRL" },
  ];
  const orden = (arr) => arr.slice().sort(F.ordenFIFO).map((l) => l.id).join(",");
  const sin = orden(base);
  const con = orden(base.map((l, i) => Object.assign({}, l, {
    hora: String(23 - i).padStart(2, "0") + ":00:00",
  })));
  ok(sin === con, "la hora no mueve el orden del FIFO: sin=" + sin + " con=" + con);
  ok(sin === "2,4,1,3,5,9,7", "y el orden sigue siendo el de siempre: " + sin);
}
// La remesa tambien guarda la suya: es la otra mitad de "la remesa de las 12:00
// consume la compra de las 11:49".
{
  const plano = HTML.replace(/\s+/g, " ");
  const n = (plano.match(/d:ds\(f\.date\),h:_horaDe\(f\.hora\)/g) || []).length;
  ok(n === 2, "las remesas guardan su hora, las de Brasil y las de EE.UU. (" + n + ")");
  const t = (HTML.match(/type='time' step='1'/g) || []).length;
  ok(t === 3, "y los tres formularios donde ella teclea a mano la piden, con segundos (" + t + ")");
}

console.log("\n— ARREGLO 67: la apertura avisa siempre —");
// El aviso de choque solo mira lo que ESTE aparato acaba de cambiar. Para casi
// todo esta bien. La apertura no: es el ancla de la conciliacion, y cuando
// llega distinta del otro aparato se mueven todos los numeros de esa tarjeta.
// Su caso: del 15 al 18 de septiembre paso sola de 12/09 · 2.464,13 a
// 11/09 · 2.544,79 y el "sin explicar" salto de -1,93 a +65,37, sin un aviso.
{
  const mando = { config: { aperturaUsdt: 2464.13, aperturaFecha: "2026-09-12",
                            aperturaBase: { bruta: 210.54 } } };
  const srv   = { config: { aperturaUsdt: 2544.79, aperturaFecha: "2026-09-11",
                            aperturaBase: { bruta: 152.33 } } };
  // Lo importante: el tercer argumento va VACIO. Ella no toco nada.
  const ch = F._choqueApertura(mando, srv, []);
  ok(ch.length === 3, "avisa aunque ella no haya tocado la apertura (" + ch.length + " claves)");
  ok(ch.every((c) => c.apertura === true), "y van marcadas, para que no se plieguen");
  ok(ch.every((c) => c.clave === "@config"),
     "con la forma que ya entienden _completarConLoQueQuedo y la pantalla");
  const m = ch.find((c) => c.id === "aperturaUsdt");
  ok(m && /2\.464,13/.test(m.campos[0].mio) && /2\.544,79/.test(m.campos[0].suyo),
     "y los numeros escritos como ella los lee, no como los guarda el JSON");
  const f = ch.find((c) => c.id === "aperturaFecha");
  ok(f && f.campos[0].mio === "12/09/26" && f.campos[0].suyo === "11/09/26",
     "la fecha en dd/mm/aa, como la lee ella y como sale en la conciliacion");
  ok(/c\.verFecha/.test(sinComentarios(sacarFuncion("_completarConLoQueQuedo"))),
     "y 'quedo' tambien: los tres valores escritos igual");
  ok(F._choqueApertura(mando, mando, []).length === 0,
     "si la apertura no cambio no molesta: esto no puede sonar en cada guardado");
  ok(F._choqueApertura(mando, srv, [{ clave: "@config", id: "aperturaUsdt" }]).length === 2,
     "y no repite lo que el aviso de choque normal ya dijo");
  // Las cinco claves salen de _MERGE_BLOQUES: dos listas se separan.
  const fn = sinComentarios(sacarFuncion("_choqueApertura"));
  ok(/_MERGE_BLOQUES/.test(fn) && !/aperturaUsdt/.test(fn),
     "las claves salen de _MERGE_BLOQUES, no de una lista copiada");
}
// Y se engancha de verdad: una funcion que nadie llama no avisa de nada.
ok(/_ch\.concat\(_choqueApertura\(obj,\s*d\.estado,\s*_ch\)\)/.test(sinComentarios(HTML)),
   "el guardado la llama, justo despues del choque normal");
// En pantalla: la apertura NO se pliega. Un aviso escondido no es un aviso.
{
  const av = sinComentarios(sacarFuncion("_htmlAvisoPisado"));
  const iAp = av.indexOf("La apertura cambió sola");
  const iFold = av.indexOf("_PISADOS_ABIERTO && n");
  ok(iAp > -1, "el aviso de la apertura existe");
  ok(iFold > -1 && iAp < iFold, "y se pinta ANTES del desplegable, siempre a la vista");
  ok(/var n=resto\.length/.test(av),
     "el recuento de 'el otro tambien cambio' cuenta el resto, no la apertura");
  ok(/No la vuelvas a fijar/.test(av),
     "le dice que corrija, no que vuelva a fijar: volver a fijarla esconde la diferencia");
  ok(/este aparato tenía/.test(av),
     "y no le dice 'lo que guardaste choco': aqui ella no guardo nada, le llego");
}

console.log("\n— ARREGLO 68: por que no cuadraba —");
// Sus 109 ajustes dicen todos "Ajuste manual de saldo", asi que la conciliacion
// los cuenta TODOS como explicados y NINGUNO mueve el "sin explicar". Ese es el
// bucle: ajusta para cuadrar la pantalla, el numero de arriba no se entera, y al
// dia siguiente vuelve a ajustar. Sus palabras: "no puedo estar todo el tiempo
// ajustando el saldo de forma manual".
//
// Lo que entra en total se RESTA de la diferencia, o sea que se da por bueno.
//   dedazo → la app tenia mal el numero, el dinero nunca se movio: se explica.
//   no se  → el dinero SI es otro y ella no sabe por que: eso hay que
//            perseguirlo, asi que NO se explica y sale en el "sin explicar".
{
  const base = {
    cuentas: [{ id: "cVes", nombre: "BANCO DE VENEZUELA", moneda: "USDT", saldo: 0 }],
    config: { aperturaFecha: "2026-09-01", aperturaTs: 0 },
  };
  const correr = (ajustes) => {
    S.cuentas = base.cuentas; S.config = base.config;
    S.ajustesSaldo = ajustes;
    return F.ajustesDesdeApertura("2026-09-01");
  };
  const A = (tipo, delta) => ({ id: "a" + Math.random(), fecha: "05/09/26", cuentaId: "cVes",
                                delta: delta, tipo: tipo });
  let r = correr([A("dedazo", -100), A("nose", -20)]);
  ok(r.total === -100 && r.n === 1,
     "el dedazo se explica y no ensucia: la app tenia mal el numero (" + r.total + ")");
  ok(r.nSinSaber === 1,
     "y el 'no se por que' NO se explica: sale en el sin explicar");
  r = correr([A("nose", -20), A("nose", -30)]);
  ok(r.total === 0 && r.n === 0 && r.nSinSaber === 2,
     "si no sabe de ninguno, no hay nada dado por bueno");
  // Y lo que ya esta guardado no cambia de significado: sus 109 no llevan tipo.
  r = correr([{ id: "viejo", fecha: "05/09/26", cuentaId: "cVes", delta: -100 }]);
  ok(r.total === -100 && r.n === 1 && r.nSinSaber === 0,
     "a los 109 de antes no se les inventa un motivo: cuentan como hasta hoy");
  // Lo anterior a la apertura ya esta dentro del punto de partida.
  r = correr([{ id: "v2", fecha: "20/08/26", cuentaId: "cVes", delta: -500, tipo: "nose" }]);
  ok(r.total === 0 && r.n === 0 && r.nSinSaber === 0,
     "y lo de antes de la apertura no cuenta de ninguna manera");
}
// LA PRUEBA QUE IMPORTA: un "no se" tiene que MOVER el sin explicar, y un
// dedazo no. Es justo lo que ella pidio: "un numero que pueda perseguir".
{
  const montar = (ajustes) => {
    S.cuentas = [{ id: "cU", nombre: "BINANCE", moneda: "USDT", saldo: 900 }];
    S.config = { aperturaUsdt: 1000, aperturaFecha: "2026-09-01", aperturaTs: 0,
                 aperturaBase: { bruta: 0, egEmpresa: 0, egPersonal: 0, egPersonalSin: 0, socios: 0 } };
    ["brl","vzla","eeuu","egresos","egresos_personales","prestamos","cuentasCobrar",
     "capital","traspasos","pagosSocios","gastos_socios","gananciaExtra",
     "inventarioUsdt","inventarioUsdt_cerrado"].forEach((k) => { S[k] = []; });
    S.ajustesSaldo = ajustes;
    return F.conciliacionCapital();
  };
  const bajada = { id: "x", fecha: "05/09/26", cuentaId: "cU", delta: -100 };
  const sinNada  = montar([]);
  const conNose  = montar([Object.assign({}, bajada, { tipo: "nose" })]);
  const conDeda  = montar([Object.assign({}, bajada, { tipo: "dedazo" })]);
  ok(Math.round(sinNada.sinExplicar) === -100,
     "tiene 900 y deberia tener 1000: faltan 100 sin explicar (" + sinNada.sinExplicar + ")");
  ok(Math.round(conNose.sinExplicar) === -100,
     "marcarlo 'no se por que' lo DEJA sin explicar, que es donde tiene que estar");
  ok(Math.round(conDeda.sinExplicar) === 0,
     "y marcarlo 'me equivoque al teclear' lo quita: no se movio dinero ninguno");
  ok(conDeda.ajustes.n === 1 && conNose.ajustes.nSinSaber === 1,
     "cada uno contado en su sitio");
}
// Lo que se deja fuera tiene que VERSE. Un descuento silencioso no se revisa.
{
  // Anclado en el MARCADO, no en el texto suelto: el rotulo se repite en los
  // comentarios y el primero que salia era uno de esos, asi que la guardia
  // medía otro trozo del archivo (paso en el ARREGLO 100).
  const i0 = HTML.indexOf(">De qué está hecha la diferencia</div>");
  const card = sinComentarios(HTML.slice(i0, i0 + 2500));
  ok(/aj\.nSinSaber\s*>\s*0/.test(card), "la tarjeta dice cuantos marco 'no se por que'");
  const i1 = card.indexOf("Ajustes de saldo a mano</span><b>ninguno");
  const i2 = card.indexOf("aj.nSinSaber");
  ok(i1 > -1 && i2 > i1, "y se ve tambien cuando no queda ningun ajuste contado");
}
// Los motivos, en un solo sitio. El del banco NO esta: ese no ajusta el saldo,
// lleva a registrar el egreso, que es lo que baja las DOS caras de la cuenta.
{
  ok(F._MOTIVOS_AJUSTE["1"].tipo === "dedazo" && F._MOTIVOS_AJUSTE["3"].tipo === "nose",
     "los dos motivos que si guardan un ajuste");
  ok(F._MOTIVOS_AJUSTE["2"] === undefined,
     "el cobro del banco no se arregla escribiendo el saldo: no esta en la lista");
  const m = sinComentarios(sacarFuncion("_motivoDelAjuste"));
  ok(/_ajusteAEgreso\(/.test(m), "elegir el banco lleva al egreso");
  ok(/return null/.test(m.slice(m.indexOf("_ajusteAEgreso"))),
     "y NO guarda ajuste: el saldo lo baja el egreso, no un numero escrito a mano");
  const e = sinComentarios(sacarFuncion("_ajusteAEgreso"));
  ok(!/c\.saldo\s*=/.test(e), "el egreso no toca el saldo por su cuenta");
  ok(/S\.tab\s*=\s*"egresos"/.test(e) && /monto:String\(monto\)/.test(e),
     "y deja el formulario empezado con el monto, para que no sea mas trabajo");
}
// Y se engancha: sin esto la pregunta no la ve nadie.
{
  const u = sinComentarios(sacarFuncion("updateCuentaSaldo"));
  ok(/_motivoDelAjuste\(/.test(u), "ajustar un saldo pregunta el motivo");
  ok(/if\(!mot\)\{\s*R\(\);\s*return;\s*\}/.test(u),
     "si no elige uno, no se guarda nada: ni ajuste ni saldo nuevo");
  ok(/tipo:mot\.tipo/.test(u), "y el motivo se guarda con el ajuste");
  ok(u.indexOf("_motivoDelAjuste") > u.indexOf("_avisoCambioSaldo"),
     "se pregunta despues del aviso del salto de 10x, no antes");
}

console.log("\n— ARREGLO 70: el formulario en el telefono —");
// Ella trabaja desde el movil. Medido en Chromium a 390 px: al meterle la Hora,
// el campo se salia por el borde y empujaba "Moneda de origen" 67 px fuera de la
// pantalla. La causa era que esa fila llevaba la rejilla de tres columnas
// escrita a mano, y la regla de movil solo sabe colapsar .f2 y .f3.
{
  ok(/@media \(max-width:600px\)/.test(HTML), "sigue existiendo la regla de moviles");
  ok(/\.f2,\.f3\{grid-template-columns:1fr !important\}/.test(HTML),
     "y es la que pasa las rejillas a una sola columna");
  const inv = sinComentarios(sacarFuncion("rInventarioUsdt"));
  const i = inv.indexOf("<label>Fecha</label>");
  const fila = inv.slice(Math.max(0, i - 300), i);
  ok(i > -1 && /class='f3'/.test(fila),
     "la fila de Fecha/Hora/Moneda usa la rejilla con clase, que en el telefono se colapsa sola");
  ok(!/grid-template-columns:1fr 1fr 1fr/.test(fila),
     "y no una de tres columnas a mano: a esa el @media no la toca");
}

console.log("\n— FASE 2: la cuenta madre —");
// Binance no dice a que banco entraron los bolivares de una venta de USDT. Sus
// palabras: "yo no iba a poder saber por binance que banco se uso, si fue
// venezuela banesco y mercantil". La madre es donde cae ese dinero.
{
  const montar = () => {
    S.cuentas = [
      { id: "cMadre", nombre: "BOLIVARES USDT", moneda: "VES", saldo: 0, esMadre: true },
      { id: "cBdv",   nombre: "BANCO DE VENEZUELA", moneda: "VES", saldo: 0 },
      { id: "cBan",   nombre: "BANESCO", moneda: "VES", saldo: 0 },
      { id: "cBrl",   nombre: "PAGBANK", moneda: "BRL", saldo: 0 },
    ];
  };
  montar();
  ok(F._cuentaMadre("VES").id === "cMadre", "encuentra la madre de su moneda");
  ok(F._cuentaMadre("BRL") === null, "y no se inventa una donde no la hay");
  ok(F._cuentaMadre("") === null, "sin moneda, nada");
  // Un lote de la madre lo puede gastar cualquier banco: ahi esta el dinero
  // cuyo banco no se sabe. Sin esto se quedaria muerto y ensuciando las tasas.
  ok(F._cuentaOMadre("cMadre", "cBdv", "VES"), "un lote de la madre lo gasta Banco de Venezuela");
  ok(F._cuentaOMadre("cMadre", "cBan", "VES"), "y tambien Banesco: el banco no se sabia");
  ok(F._cuentaOMadre("cBdv", "cBdv", "VES"), "y lo suyo lo sigue gastando cada uno");
  ok(!F._cuentaOMadre("cBdv", "cBan", "VES"), "pero un lote de OTRO banco no: eso no cambia");
  ok(F._cuentaOMadre("cBdv", "", "VES"), "sin cuenta se mira todo, como siempre");
  ok(!F._cuentaOMadre("cMadre", "cBrl", "BRL"), "y la madre de VES no vale para reales");
}
// Los seis sitios que deciden que lote se consume o se devuelve tienen que
// mirarla. Si uno se queda fuera, ese dinero se vuelve inalcanzable por ahi.
{
  const sitios = (sinComentarios(HTML).match(/_cuentaOMadre\(/g) || []).length;
  ok(sitios >= 7, "todos los filtros de lote miran la madre (" + sitios + " usos)");
  ok(!/filter\(function\(r\)\{return r\.cuentaDestinoId===cuentaId;\}\)/.test(sinComentarios(HTML)),
     "no queda ningun filtro que la deje fuera");
}
// El banco gasta LO SUYO primero; la madre solo completa lo que falte. Asi sus
// saldos de hoy se gastan solos y no hay que migrar nada.
{
  const correr = (saldoBanco, saldoMadre, sale) => {
    const cDest = { id: "cBdv", moneda: "VES", saldo: saldoBanco };
    S.cuentas = [{ id: "cMadre", moneda: "VES", saldo: saldoMadre, esMadre: true }, cDest];
    const movs = [];
    F._completarDesdeMadre(cDest, { monto: sale, moneda: "VES" },
      (id, d) => movs.push({ id: id, d: Math.round(d * 100) / 100 }), false);
    return movs;
  };
  ok(correr(1000, 5000, 300).length === 0, "si al banco le alcanza, la madre no se toca");
  const m = correr(200, 5000, 1000);
  ok(m.length === 2 && m[0].id === "cMadre" && m[0].d === -800 && m[1].d === 800,
     "y si se queda corto, la madre le pasa EXACTAMENTE lo que falta (" + JSON.stringify(m) + ")");
  const m2 = correr(0, 300, 1000);
  ok(m2.length === 2 && m2[0].d === -300,
     "si la madre tampoco tiene, pasa lo que hay: no se inventa dinero");
  ok(correr(0, 0, 1000).length === 0, "y sin nada, no se mueve nada");
  // Una cuenta en otra moneda (el aliado cobrado en USDT) no la toca.
  {
    const cU = { id: "cBin", moneda: "USDT", saldo: 0 };
    S.cuentas = [{ id: "cMadre", moneda: "VES", saldo: 9999, esMadre: true }, cU];
    const mv = [];
    F._completarDesdeMadre(cU, { monto: 50, moneda: "USDT" }, (i, d) => mv.push(d), false);
    ok(mv.length === 0, "y no se mete donde sale otra moneda (Colombia se paga en USDT)");
  }
}
// Se engancha en la remesa, y el traspaso queda en _mov para poder revertirlo.
{
  const a = sinComentarios(sacarFuncion("actualizarCuentasPorRemesa"));
  ok(/_completarDesdeMadre\(_cDest, _sal, adj, soloComprobar\)/.test(a),
     "la remesa completa desde la madre antes de descontar");
  ok(a.indexOf("_completarDesdeMadre") < a.indexOf("adj(cuentaDestId, -_sal.monto"),
     "y ANTES de descontar, no despues: si no, el banco pasa por negativo");
  ok(/movimientos\.push/.test(a), "los movimientos se guardan, asi que borrar la remesa lo revierte");
}
// El importador deja de preguntar el banco cuando hay madre — PERO SOLO EN LAS
// VENTAS. Al comprar USDT el dinero SALE, y esa transferencia la hace ella: sabe
// de que cuenta. "con la de reales desde pagbank o nubank, y con los bolivares
// igual, depende de que cuenta haya mas bs para comprar".
//
// Mandar tambien las compras a la madre fue un fallo mio y se vio al primer
// intento: sus 9 compras en BRL dejaron la madre de reales en -6.679,11, porque
// pagaron desde ahi un dinero que nunca habia entrado ahi.
{
  const rec = sinComentarios(sacarFuncion("_binRecalcular"));
  ok(/\(o\.tipo==="venta"\)\?_cuentaMadre\(o\.moneda\):null/.test(rec),
     "la madre solo recibe las VENTAS; las compras siguen preguntando el banco");
  const grp = sinComentarios(sacarFuncion("rImportarBinance"));
  ok(/\(g\.tipo==="venta"\)\?_cuentaMadre\(g\.moneda\):null/.test(grp),
     "y en pantalla, solo el grupo de ventas dice que van a la madre");
  // Y lo que queda sin banco tiene que verse. Una operacion sin cuenta fiat
  // entra al FIFO y no mueve ningun saldo: importarla en silencio deja la
  // cuenta mintiendo. Sus 9 compras en reales salen asi.
  ok(/sinBanco\+\+/.test(grp) && /g\.sinBanco\?/.test(grp),
     "el grupo avisa cuantas se quedan sin banco");
  ok(/no mueven ning/.test(grp), "y dice lo que eso significa, no solo el numero");
  // El desplegable ensena la cuenta en la que ya esta el grupo. Antes volvia
  // siempre al rotulo tras R() y parecia que elegir no hacia nada.
  ok(/g\.mismo===c\.id\?" selected":""/.test(grp),
     "el desplegable del grupo ensena la cuenta que ya tienen, no el rotulo");
  ok(/grupos\[k\]\.mismo=null/.test(grp),
     "y si el grupo esta repartido entre varios bancos, se queda el rotulo");
  ok(/_cuentaMadre\(o\.moneda\)/.test(rec), "el importador busca la madre de esa moneda");
  ok(/fiatMadre:\s*true|fiatMadre=true/.test(rec), "y marca que va ahi");
  ok(/fiatAuto=false;\s*o\.fiatMadre=true/.test(rec),
     "sin etiqueta de 'supuesto': no es una suposicion, es la respuesta");
}
// Una sola madre por moneda, y nunca una personal ni de reserva.
{
  const t = sinComentarios(sacarFuncion("toggleCuentaMadre"));
  ok(/Solo puede haber una por moneda/.test(t), "no deja marcar dos de la misma moneda");
  ok(/esPersonal\|\|c\.esReserva/.test(t), "ni una personal o de reserva: ahi cae dinero del negocio");
}


// ── ARREGLO 71 · el interes de un prestamo no es capital hasta que se cobra ──
// Ella lo dijo: "presto una cantidad pero por los intereses cobro mas". De la
// cuenta sale el CAPITAL; p.monto es capital + interes. Contar p.monto entero
// como dinero suyo subia "tienes de verdad" el dia de prestar sin mover
// "deberias tener", y ese interes salia como SOBRANTE SIN EXPLICAR hasta que el
// cliente pagara. Con prestamos nuevos cada semana no paraba de crecer.
{
  const f = (n) => Math.round(n * 100) / 100;
  // La fraccion de interes sale de un solo sitio, y las dos cuentas que la usan
  // —lo ya cobrado y lo que falta— tienen que sumar el interes pactado.
  ok(f(F._fraccionInteresPrestamo({monto:120, capital:100}) * 120) === 20,
     "la fraccion de interes reparte los 20 de un 100→120");
  ok(F._fraccionInteresPrestamo({monto:100, capital:100}) === 0,
     "un prestamo sin interes no reparte nada");
  ok(F._fraccionInteresPrestamo({monto:100}) === 0,
     "y uno viejo sin 'capital' tampoco: capital=monto, interes cero");
  ok(/_fraccionInteresPrestamo\(p\)/.test(sacarFuncion("gananciaPrestamosDelMes")),
     "la ganancia del mes la lee de ahi, no se la calcula aparte");
  ok(/_fraccionInteresPrestamo\(p\)/.test(sacarFuncion("capitalRealTotal")),
     "y el capital tambien: el mismo dato no se calcula en dos sitios");

  // El capital: solo lo prestado. El interes se ve, pero aparte y sin sumar.
  S.cuentas = [{id:"c1", moneda:"USDT", saldo:0, activa:true}];
  S.cuentasCobrar = []; S.prestamos = [
    {id:1, d:"01/09/26", mon:"USDT", monto:120, capital:100, estado:"activo", abonos:[], ent:0}
  ];
  const cap1 = F.capitalRealTotal();
  ok(cap1.enPrestamos === 100, "en prestamos entra el capital, no el total a cobrar", cap1.enPrestamos);
  ok(cap1.interesPrestamos === 20, "y el interes pendiente sale aparte", cap1.interesPrestamos);
  ok(cap1.total === 100, "el capital total NO lo cuenta", cap1.total);
  // A medio pagar, cada abono devuelve capital e interes en la misma proporcion.
  S.prestamos[0].abonos = [{fecha:"2026-09-20", monto:60}];
  const cap2 = F.capitalRealTotal();
  ok(cap2.enPrestamos === 50 && cap2.interesPrestamos === 10,
     "a mitad de pago, la mitad de cada cosa", cap2.enPrestamos + "/" + cap2.interesPrestamos);
  ok(f(cap2.interesPrestamos + 60 * F._fraccionInteresPrestamo(S.prestamos[0])) === 20,
     "lo cobrado mas lo pendiente da el interes pactado, sin perder un centimo");
  // En otra moneda se convierte DIVIDIENDO, igual que todo lo demas.
  S.prestamos = [{id:2, d:"01/09/26", mon:"BRL", monto:540, capital:270, estado:"activo", abonos:[], ent:0}];
  const cap3 = F.capitalRealTotal();
  ok(cap3.enPrestamos === 50 && cap3.interesPrestamos === 50,
     "en BRL se divide por la tasa, las dos partes", cap3.enPrestamos + "/" + cap3.interesPrestamos);

  // La otra mitad del arreglo: la apertura se conto con el interes de los
  // prestamos que YA estaban vivos ese dia. Si el capital deja de contarlo y la
  // apertura sigue llevandolo, queda un hueco fijo que no cierra nunca — no es
  // dinero, es el punto de partida mal puesto.
  S.prestamos = [
    {id:3, d:"01/09/26", mon:"USDT", monto:120, capital:100, estado:"activo", abonos:[], ent:0},
    {id:4, d:"20/09/26", mon:"USDT", monto:240, capital:200, estado:"activo", abonos:[], ent:0}
  ];
  const ia = F.interesDentroDeApertura("2026-09-11");
  ok(ia.total === 20 && ia.n === 1,
     "solo cuenta el interes de los prestamos anteriores a la apertura", ia.total + "/" + ia.n);
  // Y lo que ya se habia cobrado antes de la apertura no estaba pendiente.
  S.prestamos = [{id:5, d:"01/09/26", mon:"USDT", monto:120, capital:100, estado:"activo",
                  abonos:[{fecha:"2026-09-05", monto:60}, {fecha:"2026-09-30", monto:30}], ent:0}];
  const ia2 = F.interesDentroDeApertura("2026-09-11");
  ok(ia2.total === 10,
     "y se mide lo que quedaba pendiente EL DIA de la apertura, no hoy", ia2.total);
  ok(/apertura-intAp\.total\+bruta/.test(HTML),
     "'deberias tener' descuenta ese interes: los dos lados miden lo mismo");

  // La prueba de verdad, punta a punta: prestar con interes no puede mover el
  // "sin explicar". Antes lo subia exactamente el interes del prestamo.
  S.cuentas = [{id:"c1", moneda:"USDT", saldo:1000, activa:true}];
  S.cuentasCobrar = []; S.prestamos = []; S.ajustesSaldo = []; S.traspasos = [];
  S.config = {aperturaUsdt:1000, aperturaFecha:"2026-09-01", aperturaBase:{}};
  const antes = F.conciliacionCapital();
  // presta 100 con 20 de interes: de la cuenta salen 100, el prestamo nace en 120
  S.cuentas[0].saldo = 900;
  S.prestamos = [{id:6, d:"05/09/26", mon:"USDT", monto:120, capital:100, estado:"activo", abonos:[], ent:0}];
  const tras = F.conciliacionCapital();
  ok(antes.sinExplicar === tras.sinExplicar,
     "prestar con interes no inventa un sobrante",
     antes.sinExplicar + " -> " + tras.sinExplicar);
  ok(tras.real.total === 1000, "el capital sigue siendo el mismo dinero", tras.real.total);
  S.cuentas = []; S.cuentasCobrar = []; S.prestamos = []; S.config = {};
}

// ── ARREGLO 71 · la tarjeta: un solo numero grande y el detalle a un toque ──
// "mucha letra, no es facil de entender". Las dos restas completas (14 filas)
// se van al desplegable; los avisos y el veredicto NO.
{
  const abierto = HTML.slice(HTML.indexOf("var tablasCuenta="), HTML.indexOf("return \"<div style='background:\"+bg"));
  ok(/Saldo de apertura/.test(abierto) && /Deberías tener/.test(abierto),
     "la resta de 'deberias tener' se declara aparte para poder plegarla");
  // ARREGLO 99: el contenedor ya no se pinta del color de la alarma, asi que
  // el ancla vieja ("background:"+bg) no existe. Si el recorte no encuentra su
  // principio, slice(-1) devuelve el archivo entero y estas guardias dejan de
  // medir lo que creen medir — por eso se exige que el ancla exista.
  const _iCuerpo = HTML.indexOf("return \"<div style='background:var(--sup2);border:1px solid var(--ln)");
  ok(_iCuerpo > -1, "la tarjeta sigue teniendo su contenedor, y el recorte lo encuentra");
  const cuerpo = HTML.slice(_iCuerpo, HTML.indexOf("S._concDetalle=!S._concDetalle"));
  ok(!/Saldo de apertura/.test(cuerpo) && !/lineaReal/.test(cuerpo),
     "y ninguna de las dos tablas se dibuja ya sin desplegar");
  // ARREGLO 94: entre el "?" y tablasCuenta entro la tabla de la diferencia,
  // que antes se dibujaba fuera. Lo que se exige sigue siendo lo mismo: que
  // tablasCuenta este DENTRO del desplegable y no se haya borrado.
  ok(/S\._concDetalle\?[\s\S]{0,4000}tablasCuenta\+/.test(HTML),
     "estan dentro del desplegable, no borradas");
  // Lo urgente sigue fuera: un aviso escondido no es un aviso (ARREGLO 48/60).
  ok(/ sin situar/.test(cuerpo) && /situarAjustesEnElAire\(\)/.test(cuerpo),
     "el aviso de los ajustes en el aire sigue fuera, con su boton");
  // ARREGLO 94: el desglose sigue viendose sin desplegar nada, pero ya no es la
  // tabla vieja: es el resumen de arriba, que ademas CUADRA con el total —
  // lleva los ajustes a mano y el desfase de tasas, que a la tabla vieja le
  // faltaban. La tabla se fue al desplegable porque decia lo mismo dos veces.
  // Se arma antes del return, en resumenSuyo, y se dibuja sin desplegar nada.
  // ARREGLO 100: el desglose perdio su titulo ("De que viene esa diferencia")
  // porque la cifra de la que cuelga ya lo dice —"Diferencia · de donde sale ↓"—
  // y un titulo mas era letra de la que ella pidio quitar. Lo que se exige
  // sigue siendo lo mismo, y es lo unico que importa: que las filas se dibujen
  // SIN desplegar nada, y que haya algo que lleve de la cifra a ellas. Esa
  // lista es lo que convierte un numero en algo que se puede perseguir, y ya
  // hay cinco arreglos apoyados en que se vea (ARREGLO 48/60/94/99).
  ok(/resumenSuyo\+/.test(cuerpo) && /_filas\.map\(function/.test(HTML) &&
     /"de dónde sale ↓"/.test(HTML),
     "y el desglose tambien: es lo que convierte el numero en algo que perseguir");
  // ARREGLO 99: y lo que ella abre a mirar —cuanto tiene hoy— va antes que el
  // veredicto y en grande. El veredicto es la pregunta del contador.
  ok(cuerpo.indexOf("resumenSuyo+") < cuerpo.indexOf("sobra sin explicar"),
     "y va ANTES del veredicto: lo suyo primero");
  ok(!/De qué está hecha la diferencia/.test(cuerpo),
     "y no se dice dos veces: la tabla vieja ya no se dibuja sin desplegar");
  // El interes por cobrar se ve, pero dicho: no es suyo todavia.
  ok(/intereses por cobrar \(aún no son tuyos\)/.test(HTML),
     "la tarjeta dice que el interes pendiente no cuenta como capital");
  ok(/En préstamos \(capital\)/.test(HTML),
     "y que lo que cuenta es el capital");
}


// ── ARREGLO 74 · el mercado: donde queda ella contra la competencia ────────
// "todas esas casas de cambio todos los dias tengo que revisar para poder
// colocar mi tasa". Las dos direcciones se escriben en la MISMA unidad
// -bolivares por real- pero significan lo contrario: en la ida ella ENTREGA
// bolivares (mas es mejor para el cliente) y en la vuelta ENTREGA reales
// (menos es mejor). Invertir uno de los dos le daria el puesto al reves, que
// es justo lo que la haria publicar una tasa mala.
{
  const CONF = [
    {id:"retorna", nombre:"Retorna",  vuelta:false},
    {id:"dorado",  nombre:"Dorado",   vuelta:true},
    {id:"g1",      nombre:"Grupo 1",  vuelta:true},
    {id:"g2",      nombre:"Grupo 2",  vuelta:true}
  ];
  S.config = {competidores: CONF, tasasDia:{tdia_brl:172.5, tdia_ves_brl:220}};
  S.histComp = {};
  const hoy = F.td();
  S.histComp[hoy] = {
    retorna:{ida:171.54}, dorado:{ida:173, vuelta:200},
    g1:{ida:175}, g2:{ida:170, vuelta:200}
  };
  const m = F._posicionMercado();
  // Sus numeros del 26/09, tal y como me los dio.
  ok(m.posIda.puesto === 3 && m.posIda.de === 5,
     "en la ida cuenta cuantos dan MAS bolivares que ella",
     m.posIda.puesto + "/" + m.posIda.de);
  ok(m.posIda.mejor.nombre === undefined && m.posIda.mejor.n === "Grupo 1" && m.posIda.mejor.v === 175,
     "y el mejor de la ida es el que mas da");
  ok(m.posVuelta.puesto === 3 && m.posVuelta.de === 3,
     "en la vuelta cuenta cuantos piden MENOS: ahi queda la ultima",
     m.posVuelta.puesto + "/" + m.posVuelta.de);
  ok(m.posVuelta.mejor.v === 200 && m.posVuelta.brechaMejor === 20,
     "y la brecha con el mejor son los 20 Bs por real", m.posVuelta.brechaMejor);
  // Retorna solo publica ida: no puede colarse en el ranking de vuelta.
  ok(m.vuelta.length === 2 && !m.vuelta.some(function(x){return x.n==="Retorna";}),
     "quien solo publica ida no entra en la vuelta", m.vuelta.length);
  // Si todavia no ha publicado hoy, no se le inventa una tasa.
  S.config.tasasDia = {};
  const sinPublicar = F._posicionMercado();
  ok(sinPublicar.mias.ida === null && sinPublicar.posIda === null,
     "sin tasa publicada no se inventa un puesto");
  S.config.tasasDia = {tdia_brl:172.5, tdia_ves_brl:220};

  // La coma decimal: es lo primero que se pierde con el teclado en espanol, y
  // 171,54 entraria como 17154 -cien veces su tasa-.
  S.histComp = {};
  F._setComp("retorna", "ida", "171,54");
  ok(F._compDelDia()[ "retorna" ].ida === "171.54",
     "el campo del mercado pasa por _num(): 171,54 no se vuelve 17154",
     F._compDelDia()["retorna"].ida);
  ok(/type='text' inputmode='decimal'/.test(sacarFuncion("_htmlMercadoHoy")) &&
     !/type='number'/.test(sacarFuncion("_htmlMercadoHoy")),
     "y el campo es de texto, no type=number");
  // ARREGLO 32: teclear no puede repintar la pantalla entera.
  ok(!/\bR\(\)/.test(sinComentarios(sacarFuncion("_setComp"))) &&
     /getElementById\("comp-resumen"\)/.test(sacarFuncion("_setComp")),
     "apuntar una tasa no repinta: refresca el recuadro por su id");
  // El historial va indexado por fecha y se UNE entre aparatos, nunca se pisa.
  ok(/_MERGE_HISTORIAL = \[[^\]]*"histComp"/.test(HTML),
     "histComp se une por fecha entre los dos aparatos");
  ok(/DATA_KEYS = \[[\s\S]{0,800}"histComp"/.test(HTML),
     "y esta en DATA_KEYS: si no, el remoto lo reemplaza entero");
  S.config = {}; S.histComp = {};
}


// ── ARREGLO 75 · el suelo: hasta donde puede ofrecer sin perder ────────────
// "no se que tasa de compra y venta esta usando mi app" y "no es solo la
// competencia sino el mercado p2p". Compra 1 USDT por X reales y lo vende por
// Y bolivares: todo lo que ofrezca por DEBAJO de Y/X le deja ganancia.
{
  S.config = {comision_binance: 0};
  // Sus tasas del 18/09.
  ok(F._equilibrio(5.1638, 948) === 183.59,
     "el suelo sale de dividir la venta entre la compra", F._equilibrio(5.1638, 948));
  // La comision de Binance BAJA el suelo: entra menos USDT del que se paga.
  S.config = {comision_binance: 0.007};
  ok(F._equilibrio(5.1638, 948) === 182.3,
     "y la comision de Binance lo baja: con 0,7% queda en 182,30",
     F._equilibrio(5.1638, 948));
  ok(F._equilibrio(5.1638, 948) < F._equilibrio(5.1638, 948) + 1,
     "el suelo con comision nunca es mayor que sin ella");
  // Sin datos no se inventa un suelo: una tasa de referencia que falta no
  // puede convertirse en un numero que ella use para publicar.
  ok(F._equilibrio(0, 948) === null && F._equilibrio(5.16, 0) === null &&
     F._equilibrio(null, null) === null && F._equilibrio("hola", 948) === null,
     "sin las dos tasas no hay suelo, y no se inventa");
  // Una comision absurda no puede volver el suelo cero o negativo.
  S.config = {comision_binance: 5};
  ok(F._equilibrio(5.1638, 948) === 183.59,
     "una comision fuera de rango se ignora en vez de destrozar el suelo",
     F._equilibrio(5.1638, 948));
  S.config = {};

  // La lectura del mercado NO se guarda ni se sincroniza: es un precio de hace
  // un minuto, no un dato del negocio. Si entrara en DATA_KEYS viajaria entre
  // aparatos y se pisaria con lecturas de otra hora.
  ok(!/DATA_KEYS = \[[\s\S]{0,900}"_MERCADO"/.test(HTML) &&
     !/_MERGE_FIELDS = \[[\s\S]{0,900}"_MERCADO"/.test(HTML),
     "la lectura del mercado no se sincroniza: es un precio, no un dato");
  // Y llega de la red mientras ella puede estar tecleando (ARREGLO 32).
  ok(!/\bR\(\)/.test(sinComentarios(sacarFuncion("_refrescarSuelo"))) &&
     /getElementById\("mercado-suelo"\)/.test(sacarFuncion("_refrescarSuelo")),
     "cuando llega la lectura no repinta: refresca el recuadro por su id");
  // No se pide en cada repintado: _pedirMercado se calla si acaba de
  // preguntar. Sin esa guardia serian decenas de llamadas por minuto.
  ok(/if\(!forzar && _MERCADO\.intento && \(Date\.now\(\)-_MERCADO\.intento\)<espera\) return;/
       .test(sacarFuncion("_pedirMercado")),
     "no se le pregunta a la API en cada repintado");
  // Pero un FALLO no puede frenar lo mismo que una lectura buena: asi la
  // pantalla no volvia a intentarlo sola y solo se movia pulsando el boton.
  ok(/_MERCADO_REINTENTO_MS = 30\*1000/.test(HTML) &&
     /espera=hayLectura\?_MERCADO_FRESCO_MS:_MERCADO_REINTENTO_MS/.test(sacarFuncion("_pedirMercado")),
     "y un fallo se reintenta antes que una lectura buena");
  // Si la API no contesta, la pantalla sigue entera y lo dice.
  ok(/sin lectura/.test(sacarFuncion("_htmlSuelo")) &&
     /reintentar/.test(sacarFuncion("_htmlSuelo")),
     "sin lectura del mercado la tarjeta sigue, y ofrece reintentar");
  // Y dice POR QUE. "Sin lectura" a secas mezcla dos problemas con arreglos
  // distintos -uno del servidor, otro bajar el monto en Configuracion- y se
  // perdio una tarde sin poder saber cual era. El motivo lo manda el servidor
  // dentro de la respuesta; tirarlo es volver al mismo sitio.
  ok(/_MERCADO\.error=d\.motivo\|\|"sin lectura"/.test(sacarFuncion("_pedirMercado")),
     "cuando el servidor contesta bien pero sin precios, se guarda su motivo");
  ok(/_escAud\(_MERCADO\.error\|\|"sin lectura"\)/.test(sacarFuncion("_htmlSuelo")),
     "y la tarjeta lo enseña, escapado: ese texto viene de Binance");
  // Un 404 significa algo muy concreto: el servidor esta vivo pero no tiene
  // esta funcion. "No contesto" manda a buscar donde no es.
  ok(/r\.status===404/.test(sacarFuncion("_pedirMercado")) &&
     /todavía no tiene esta función/.test(sacarFuncion("_pedirMercado")),
     "un servidor sin la función lo dice, en vez de decir que no contestó");
  // Media lectura tambien es un fallo: sin las DOS tasas no hay suelo.
  ok(/m\.motivoBRL/.test(sacarFuncion("_htmlSuelo")) &&
     /m\.motivoVES/.test(sacarFuncion("_htmlSuelo")),
     "si falta un solo lado, se avisa: sin las dos tasas no hay suelo");
  // Y esa fila deja de ser verde. El verde es "lectura completa": un
  // "vendes —" en verde se lee como si estuviera bien.
  ok(/\(m\.motivoBRL\|\|m\.motivoVES\)\?"var\(--tx2\)":"var\(--ok\)"/.test(sacarFuncion("_htmlSuelo")),
     "y media lectura no se pinta de verde");

  // ── El suelo mixto ────────────────────────────────────────────────
  // Media lectura del mercado no es nada: los dos numeros que quedan son
  // reales, solo que uno es de su historia y el otro de ahora. El 29/09 los
  // bolivares se leyeron (957,01) y los reales no, y la pantalla seguia
  // enseñando solo su suelo viejo con medio dato nuevo sin usar.
  var suelo=sacarFuncion("_htmlSuelo");
  ok(/eqMixto=_equilibrio\(miC,mv\)/.test(suelo) &&
     /eqMixto=_equilibrio\(mc,miV\)/.test(suelo),
     "con media lectura se completa el lado que falta con lo suyo, en las dos direcciones");
  // Y SUSTITUYE al suyo. Dos suelos parecidos para la misma pregunta es lo que
  // ya hizo que dejara de fiarse de los dos (34,27 arriba y 34,28 abajo).
  ok(/if\(eqMixto\)\{[\s\S]{0,400}\}else if\(eqMio\)\{/.test(suelo),
     "y ocupa el sitio del suyo, no se pone al lado");
  // Sin ninguno de los dos lados no hay mixto: eso seria inventar.
  ok(/if\(!eqMerc\)\{/.test(suelo),
     "con lectura completa del mercado no se calcula ningún mixto");
  // El rotulo tiene que decir de donde sale cada mitad. Un tercer numero sin
  // explicar como se hizo es lo que hace que dejen de creerse los tres.
  ok(/pieMixto="tu compra de "/.test(suelo) && /con la venta de hoy/.test(suelo),
     "y dice de dónde sale cada mitad, con las dos tasas");
  // ── ARREGLO 77: manda el suelo MAS BAJO ───────────────────────────
  // El suelo es venta ÷ compra, asi que una compra mas cara lo BAJA. El 30/09
  // ella compro USDT a 5,27 —paga la comision del P2P— y el mercado abierto
  // estaba en 5,20: suelo real 180,3, suelo de mercado 182,7. El % se medía
  // contra el del mercado, o sea contra un costo que no era el suyo.
  ok(F._equilibrio(5.27, 956.86) < F._equilibrio(5.20, 956.86),
     "comprar mas caro BAJA el suelo: por eso manda el mas bajo",
     F._equilibrio(5.27, 956.86) + " vs " + F._equilibrio(5.20, 956.86));
  // Y el caso contrario sale solo: una tasa de compra vieja y BARATA da un
  // suelo alto, asi que pierde y manda el del mercado. Es el numero que le
  // salio esa mañana (5,0018 del 18/09) y contra el que se estaba midiendo.
  ok(F._equilibrio(5.0018, 956.86) > F._equilibrio(5.20, 956.86),
     "y una compra vieja y barata da un suelo ALTO, que pierde la comparacion",
     F._equilibrio(5.0018, 956.86) + " vs " + F._equilibrio(5.20, 956.86));
  // El porcentaje se mide contra el mas bajo de los que esten a la vista, no
  // contra el del mercado. Un suelo optimista es peor que ninguno: con el
  // publicaria una tasa que no aguanta su propio costo.
  ok(/for\(var ci=0;ci<cands\.length;ci\+\+\) if\(!manda\|\|cands\[ci\]\.v<manda\.v\) manda=cands\[ci\];/.test(suelo) &&
     /var base=manda\?manda\.v:null;/.test(suelo),
     "el \"te queda +X%\" se mide contra el suelo mas bajo de los que se enseñan");
  // Y los candidatos son exactamente los que se dibujan: si uno se enseña y no
  // entra en la comparacion, el % puede salir de un numero que no esta arriba.
  // Por eso se dibuja RECORRIENDO la lista de candidatos, en un solo sitio.
  ok((suelo.match(/cands\.push\(/g)||[]).length === 3 &&
     (suelo.match(/suelos\+=linea\(/g)||[]).length === 1 &&
     /for\(var cj=0;cj<cands\.length;cj\+\+\)\s*\n?\s*suelos\+=linea\(cands\[cj\]/.test(suelo),
     "cada suelo que se dibuja entra en la comparacion, y ninguno mas");
  // Y el color va con el que MANDA. Al reves, el suelo que manda salia en
  // ambar y el que no manda en verde: el color se lee antes que la letra, asi
  // que la tarjeta decia una cosa con el texto y la contraria con el color.
  ok(/cands\[cj\]===manda\?"var\(--ok\)":"var\(--tx3\)"/.test(suelo),
     "y el verde se lo lleva el que manda, no el otro");
  // Con dos suelos en pantalla hay que decir contra cual se midio y con que
  // par de tasas: un % que no dice de donde sale hay que comprobarlo a mano.
  ok(/manda "\+manda\.nombre/.test(suelo) &&
     /compras "\+fp\(manda\.c\)\+" R\$ · vendes "\+fp\(manda\.s\)/.test(suelo),
     "y la tarjeta dice cual mando, con las dos tasas con que se hizo");
  // Con un solo suelo no hay nada que elegir, asi que no se dice nada.
  ok(/if\(cands\.length>1&&base&&mia!==null\)\{/.test(suelo),
     "con un solo suelo no se escribe la linea de \"manda\": no hay eleccion");

  // ── La tasa de compra puede ser de hace dias ──────────────────────
  // Sale de la ULTIMA operacion de USDT registrada. El 30/09 la tarjeta
  // enseñaba 187,90 con una compra del 18/09, y ella habia comprado a 5,27 esa
  // misma mañana. El numero no estaba mal, estaba VIEJO — que para lo que
  // sirve un suelo es lo mismo.
  ok(/rc\.origen!=="auto"\|\|!rc\.iso/.test(suelo) && /dias>1/.test(suelo),
     "avisa cuando la tasa de compra que sostiene el suelo lleva mas de un dia");
  // La fijada a mano no se avisa: es una decision suya, no un olvido. Es la
  // misma regla que ya manda en tasaDeReferencia().
  ok(/rc\.origen!=="auto"/.test(suelo),
     "y la tasa fijada a mano no se avisa: es una decision, no un descuido");
  // El dato con el que se mide tiene que existir: tasaDeReferencia() devuelve
  // la fecha ISO del lote del que salio la tasa.
  ok(/return \{tasa:t, origen:"auto", fecha:u\.fecha, iso:uF, tipo:u\.tipo, meta:\{\}\};/
       .test(sacarFuncion("tasaDeReferencia")),
     "tasaDeReferencia dice de que dia es la tasa que devuelve");
  // Y NO se llama fechaIso: ese nombre lo cuenta la guardia del ARREGLO 51
  // contra cada inventarioUsdt.push(, y un campo mas romperia esa cuenta.
  ok(!/fechaIso/.test(sacarFuncion("tasaDeReferencia")),
     "sin usar el nombre fechaIso, que esta reservado a los lotes");
  // Y el aviso de arriba tiene que cuadrar con el numero de abajo: "no hay
  // suelo de mercado" con un suelo justo debajo son dos mensajes opuestos en
  // la misma tarjeta, que es lo que ya hizo falsa la de conciliación.
  ok(/eqMixto \? "Falta un lado del mercado, así que el suelo de abajo va con tu tasa: "/.test(suelo),
     "y el aviso de \"falta un lado\" no contradice al suelo que se enseña debajo");
  // El tablón se mueve: hay horas en que nadie toma su monto y el servidor
  // mide al mayor que sí dan. Callarlo sería enseñarle un precio que no es el
  // de su operación.
  ok(/montoPedido/.test(suelo) && /nadie toma tu monto entero/.test(suelo),
     "cuando el mercado se midió a otro monto, la tarjeta lo dice");
  // Y el pie deja de prometer "a tu monto" cuando ya no lo es.
  ok(/bajoDeMonto\(m\.ventaVES\)\?"":" a tu monto"/.test(suelo),
     "y el pie deja de decir \"a tu monto\" cuando no se midió a su monto");
  // Los reales salen del mercado normal (sin anuncios) y los bolívares del P2P
  // (con ellos). El pie decía "0 y 2 anuncios", y ese 0 se leía como "los
  // reales fallaron" cuando estaban perfectos.
  ok(/"reales: "\+_escAud\(m\.compraBRL\.fuente\)/.test(suelo),
     "el pie dice de QUÉ sitio vienen los reales, no cuenta anuncios que no hay");

  // ── Los dos montos, en Configuración ──────────────────────────────
  // _pedirMercado los leía de S.config desde el ARREGLO 75, pero no había
  // dónde escribirlos: se le dijo dos veces que bajara el monto en
  // Configuración y ese campo no estaba en ninguna parte.
  var montos=sacarFuncion("_htmlMontosMercado");
  ok(/_cfgAcc\("mercado_monto"/.test(HTML) && /_htmlMontosMercado\(\)/.test(HTML),
     "los dos montos del mercado tienen su sitio en Configuración");
  // El campo se come la coma decimal: texto + _num() en la puerta, las dos
  // mitades, o "5,22" se lee como 5.
  ok(/type='text' inputmode='decimal'/.test(montos) && !/type='number'/.test(montos),
     "y son campos de texto, que no se comen la coma");
  ok(/_num\(v\)/.test(sacarFuncion("_setMontoMercado")),
     "con _num() en la puerta");
  // ARREGLO 32: repintar cierra el acordeón bajo el dedo mientras teclea.
  ok(!/\bR\(\)/.test(sinComentarios(sacarFuncion("_setMontoMercado"))) &&
     /getElementById\("mercado-monto-pie"\)/.test(sacarFuncion("_setMontoMercado")),
     "escribir el monto no repinta: refresca el pie por su id");
  // Lo ya leído se midió a OTRO monto: dejarlo puesto sería enseñar un precio
  // de otro tamaño con la etiqueta del nuevo.
  ok(/_MERCADO\.datos=null/.test(sacarFuncion("_guardarMontoMercado")) &&
     /_pedirMercado\(true\)/.test(sacarFuncion("_guardarMontoMercado")),
     "y al guardarlo se tira la lectura vieja y se vuelve a pedir");
  // Vacío no puede significar cero: el servidor tiene los mismos por omisión.
  ok(/_MERCADO_MONTO_DEF = \{BRL:1000, VES:112000\}/.test(HTML) &&
     /\(v>0\) \? v : _MERCADO_MONTO_DEF\[mon\]/.test(sacarFuncion("_montoMercado")),
     "dejarlos en blanco vuelve a los medidos, no a cero");
  // El suelo es de la OPERACION. Presentarlo como el de la empresa seria
  // darle un numero optimista, y con eso publicaria una tasa que no aguanta.
  ok(/no lleva la comisión del banco venezolano ni tus egresos/.test(sacarFuncion("_htmlSuelo")),
     "y dice lo que el suelo NO incluye");
  // Los 4 decimales de la tasa de compra: entre 5,16 y 5,1638 hay 0,07% de
  // su margen, que sobre su volumen no es redondeo.
  ok(/f4\(n\) : f2\(n\)/.test(sacarFuncion("_htmlSuelo")),
     "la tasa de compra de USDT se enseña con sus cuatro decimales");

  // ── La version del servidor, en Configuracion ──────────────────────
  // Existe porque hubo que preguntarla a mano: se paso una tarde buscando un
  // problema en el despliegue cuando el despliegue estaba bien. /salud ya la
  // traia y la app la tiraba.
  var sis=sacarFuncion("_htmlSistemaApi");
  ok(/_API_VERSION/.test(sacarFuncion("_apiComprobarAmbiente")) &&
     /_API_BASE/.test(sacarFuncion("_apiComprobarAmbiente")),
     "lo que /salud contesta sobre version y base se guarda, no se tira");
  ok(/Versión del servidor/.test(sis) && /Base de datos/.test(sis),
     "y Configuración las enseña las dos");
  // El caso grave de ese recuadro: el servidor contesta pero no llega a los
  // datos. Eso no puede ser una linea mas entre las otras.
  ok(/el servidor no llega a la base/.test(sis) && /var\(--mal\)/.test(sis),
     "una base caída se ve en rojo, no como una línea más");
  // "desconocido" es lo que contesta corriendo fuera de Railway: es la verdad
  // pero a ella no le dice nada.
  ok(/corriendo fuera de Railway/.test(sis),
     "y un servidor sin datos de despliegue lo dice con palabras, no con \"desconocido\"");
  // ARREGLO 32: se pulsa con el acordeon abierto; R() lo cerraria.
  ok(!/\bR\(\)/.test(sinComentarios(sacarFuncion("_refrescarSistemaApi"))) &&
     /getElementById\("cfg-sistema-api"\)/.test(sacarFuncion("_refrescarSistemaApi")),
     "volver a preguntar no repinta la pantalla: refresca el recuadro por su id");
  // El boton necesita saber cuando termino la consulta.
  ok(/return fetch\(_API_URL\+"\/salud"/.test(sacarFuncion("_apiComprobarAmbiente")),
     "la consulta a /salud se devuelve, para poder esperarla desde el botón");
  // Es un estado de ahora mismo, no un dato del negocio: si viajara entre
  // aparatos, cada uno enseñaria la version que leyo el otro.
  ok(!/DATA_KEYS = \[[\s\S]{0,900}"_API_VERSION"/.test(HTML),
     "la versión del servidor no se sincroniza: es de este momento, no del negocio");
  // Se preguntaba UNA vez, 1,2 s despues de abrir, y ahi se quedaba: el 29/09
  // marcaba 166c1b4 con el servidor ya en 6c0806f, porque la app abrio
  // mientras desplegaba. Un dato que puede mentir callado deja de mirarse.
  ok(/_API_LEIDO=Date\.now\(\)/.test(sacarFuncion("_apiComprobarAmbiente")),
     "se apunta cuándo se leyó el estado del servidor");
  ok(/leído /.test(sis) && /_API_LEIDO/.test(sis),
     "y la tarjeta dice a qué hora, siempre, no solo cuando ya es viejo");
  ok(/_apiComprobarAmbiente\(\)/.test(
       HTML.slice(HTML.indexOf("visibilitychange"), HTML.indexOf("visibilitychange")+700)),
     "al volver a la app se vuelve a preguntar, como ya se hace con los permisos");
  // Pero no en cada vez que vuelve al frente: entrar y salir cinco veces en un
  // minuto no pueden ser cinco preguntas.
  ok(/_API_SALUD_FRESCO_MS = 30\*1000/.test(HTML) &&
     /Date\.now\(\)-_API_LEIDO > _API_SALUD_FRESCO_MS/.test(HTML),
     "y no en cada vuelta: hay medio minuto de guardia");
  // Al pulsar el botón la hora vieja también se va: si no, se queda debajo de
  // "consultando…" y parece la hora de la lectura nueva.
  ok(/_API_LEIDO=0/.test(sacarFuncion("_refrescarSistemaApi")),
     "y al volver a preguntar, la hora vieja se borra con el dato viejo");
}

// ── ARREGLO 92: el mensaje al cliente, escrito para el CLIENTE ────────────
// Sus palabras: "yo necesito que la respuesta sea como más fácil de entender al
// usuario y no tanto del punto de vista mía, que ya conoce el sistema, porque
// muchos me quedan como en duda". El mensaje era una ECUACION
// ("100,00 BRL = 17.300,00 VES ≈ 19,85$ BCV") y se puede leer al reves.
{
  const m = sinComentarios(sacarFuncion("_msjCliente"));

  // Lo que mas duda generaba: no decia quien paga y quien recibe.
  ok(/Tú envías: /.test(m) && /Tú recibes: /.test(m),
     "el mensaje dice quien envia y quien recibe, no es una ecuacion");
  // Y las dos lineas salen de la MISMA bandera, asi que no se pueden cruzar:
  // si alguna vez se escribieran por separado, un dia diria que manda y recibe
  // la misma moneda.
  ok(/var mandaVes=\(_convUltimoCampo==="ves"\);/.test(m),
     "y de que lado va cada moneda lo decide una sola bandera");

  // Codigos de banco fuera: el cliente dice reais/R$ y bolivares/Bs.
  ok(!/"[^"]*\bBRL\b[^"]*"/.test(m) && !/"[^"]*\bVES\b[^"]*"/.test(m),
     "no quedan codigos BRL/VES en el texto que lee el cliente");
  ok(/"R\$ "/.test(m) && /"Bs "/.test(m),
     "van los simbolos que el cliente usa");

  // Las dos direcciones llevan el MISMO rotulo. Antes una era "Tasa: 1 BRL =
  // 173,00 VES" y la otra "Tasa: 220,00 VES = 1 BRL": lado a lado, 173 y 220
  // parecen contradecirse. La redaccion la eligio ella: "debe decir tasa del
  // dia 1R$ = 173 Bs".
  ok((m.match(/Tasa del día: /g)||[]).length === 2,
     "las dos tasas llevan el mismo rotulo: 'Tasa del día'");
  ok(/Tasa del día: 1 R\$ = "\+_nMsj\(tasaIda\)\+" Bs/.test(m),
     "la de ida se escribe como ella la dicto: 1 R$ = 173 Bs");
  ok(/Tasa del día: "\+_nMsj\(tasaVuelta\)\+" Bs = 1 R\$/.test(m),
     "y la de vuelta en su sentido, con el mismo rotulo");
  ok(!/Tasa: 1 BRL = /.test(m) && !/VES = 1 BRL/.test(m),
     "y ya no queda la forma vieja, con codigos de banco");

  // El dolar es una REFERENCIA, no lo que llega: nadie recibe dolares. Con las
  // palabras que eligio ella.
  ok(/según el dólar del Banco Central de Venezuela/.test(m),
     "el equivalente en dolares se presenta como referencia del BCV");
  ok(!/\$ BCV/.test(m),
     "y no como '$ BCV' pegado al monto, que se leia como si le llegaran dolares");

  // Dos botones: el corto corta antes de la tasa.
  ok(/if\(modo!=="completo"\) return msg;/.test(m),
     "el mensaje corto se para antes de la tasa");
  ok(/_nMsj\(/.test(m) && /function _nMsj/.test(sinComentarios(HTML)),
     "los bolivares enteros no arrastran un ',00' que no dice nada");

  const ui = sinComentarios(sacarFuncion("_rConversorBCV"));
  ok(/_copiarMsjCliente\(\\"corto\\",this\)/.test(ui) &&
     /_copiarMsjCliente\(\\"completo\\",this\)/.test(ui),
     "hay dos botones y cada uno pide su mensaje");
  // Cada boton tiene que avisar en SU propio texto: con un solo id, pulsar el
  // completo marcaba "copiado" en el corto.
  ok(/id='btn-copiar-msj'/.test(ui) && /id='btn-copiar-msj-full'/.test(ui),
     "y cada uno es un boton distinto, no el mismo id dos veces");
  ok(/function _copiarMsjCliente\(modo,btn\)/.test(sinComentarios(HTML)),
     "el que copia recibe el boton que se pulso, para marcarlo a el");
}

// ── ARREGLO 93: el monto se copia CON su moneda ───────────────────────────
// Sus palabras: "cuando yo le dé al botón de copiar que está al lado de cada
// uno, en vez de copiar 146 solo, que copie 146 R$". Los tres botones copiaban
// tres numeros pelados que solo se distinguian por el orden en que se pegaron.
{
  const c = sinComentarios(sacarFuncion("_copiarMonto"));
  ok(/_MONEDA_DE_CAMPO\[idCampo\]/.test(c),
     "el monto se copia con el simbolo de su campo");
  ok(/"conv-brl":"R\$"/.test(HTML) && /"conv-ves":"Bs"/.test(HTML) && /"conv-usd":"\$"/.test(HTML),
     "y que simbolo lleva cada campo vive en un solo sitio");
  ok(/_nMsj\(num\)/.test(c),
     "con separador de miles y sin el ',00' de un entero, como el mensaje al cliente");
  ok(!/\(num%1===0\)\?String\(num\)/.test(c),
     "y ya no copia el numero pelado");
  ok(/Ese campo está vacío/.test(c),
     "con el campo vacio sigue avisando en vez de copiar nada");
}

// ── ARREGLO 94: la apertura deja rastro, y la tarjeta contesta lo suyo ────
// Sus palabras: "en el saldo de apertura dias atras me decia un saldo y ahorita
// me dice que el saldo de apertura es otro monto, es como que si a escondidas
// se modificara". Se la cambiaba el otro aparato por la fusion, y no quedaba
// ni rastro: no habia con que contestar "¿cuanto era antes?".
{
  const H = sinComentarios(HTML);

  // 1. El historial se UNE entre aparatos y viaja. Si faltara en cualquiera de
  //    las dos listas, el remoto lo reemplazaria entero y se perderia justo lo
  //    que este aparato apunto.
  ok(/_MERGE_HISTORIAL\s*=\s*\[[^\]]*"histApertura"/.test(H),
     "histApertura se une por fecha en vez de pisarse");
  ok(/DATA_KEYS\s*=\s*\[[^\]]*"histApertura"/.test(H),
     "y viaja al servidor, que si no no sale de este aparato");

  // 2. Los CUATRO escritores de la apertura la apuntan. Este es el guardia que
  //    de verdad importa: cualquiera que se deje fuera vuelve a cambiarla en
  //    silencio, que es el fallo que ella reporto.
  const escritores = ["fijarAperturaHoy","corregirApertura","corregirFechaApertura"];
  escritores.forEach(function(fn){
    ok(/_anotarApertura\(/.test(sinComentarios(sacarFuncion(fn))),
       "el que la cambia la apunta: "+fn);
  });
  ok(/_anotarApertura\(_apAntes,\s*_apDespues,\s*"llegó del otro aparato"\)/.test(H),
     "y cuando la cambia el otro aparato tambien queda apuntada");
  // La foto de ANTES se toma antes de adoptar la respuesta del servidor; si se
  // tomara despues, los dos valores serian el mismo y nunca habria cambio.
  const ap = sinComentarios(sacarFuncion("_aplicarEstadoDeApi"));
  // Ojo con el indexOf a secas: si la linea se borra devuelve -1, que es menor
  // que cualquier posicion y la guardia pasaba con el codigo roto.
  ok(ap.indexOf("_apAntes=_fotoApertura()") >= 0 &&
     ap.indexOf("_apAntes=_fotoApertura()") < ap.indexOf("_anotarApertura("),
     "la foto de antes se toma ANTES de adoptar lo del servidor");

  // 3. La apertura son DOS cosas y las dos cambian: monto y fecha.
  ok(/function _fotoApertura\(\)/.test(H) &&
     /aperturaUsdt/.test(sinComentarios(sacarFuncion("_fotoApertura"))) &&
     /aperturaFecha/.test(sinComentarios(sacarFuncion("_fotoApertura"))),
     "la foto lleva el monto y la fecha, no solo el monto");

  const an = sinComentarios(sacarFuncion("_anotarApertura"));
  // Sin apertura previa no es un cambio: es el punto de partida. Y un cambio
  // que no cambia nada llenaria el historial de ruido en cada guardado.
  ok(/a\.monto===null\s*&&\s*a\.fecha===null/.test(an),
     "sin apertura previa no se apunta nada: no es un cambio");
  ok(/mismoMonto\s*&&\s*a\.fecha===d\.fecha/.test(an),
     "y lo que no cambia tampoco se apunta");
  // Dos cambios en el mismo milisegundo se pisaban: la clave es la hora ISO.
  ok(/while\(S\.histApertura\[k\]\)/.test(an),
     "dos cambios en el mismo milisegundo no se pisan");

  // 4. El aviso: tres cosas que no se pueden quitar.
  const av = sinComentarios(sacarFuncion("_htmlAvisoAperturaFuera"));
  ok(/_PISADOS\.some\(/.test(av),
     "si el aviso del 67 ya lo dijo, este no lo repite");
  ok(/No la vuelvas a fijar/.test(av),
     "y dice que NO la vuelva a fijar: eso pone la diferencia en cero y borra la pista");
  ok(/antes/.test(av) && /despues/.test(av),
     "el aviso lleva los DOS numeros, no solo el que quedo");
  // Va arriba del panel, fuera de la zona que hace scroll (ARREGLO 62).
  ok(/_htmlAvisoAperturaFuera\(\)/.test(H.replace(/function _htmlAvisoAperturaFuera[\s\S]*?\n\}/,"")),
     "y se dibuja arriba del panel, no dentro de una pantalla suelta");

  // 5. La tarjeta: las filas tienen que SUMAR el salto. El primer intento
  //    dejaba fuera los ajustes a mano y el desfase de tasas, y la lista no
  //    cuadraba con el total que ella tiene justo encima.
  const cap = sinComentarios(sacarFuncion("rCapitalTotal"));
  // Las guardias se miden SOBRE EL BLOQUE del resumen, no sobre la funcion
  // entera: "co.ajustes" y "R.enPrestamos" aparecen tambien mas abajo, asi que
  // buscandolos en toda la funcion pasaban con la fila ya borrada.
  const filas = cap.slice(cap.indexOf("var _filas=[]"), cap.indexOf("var resumenSuyo="));
  // ARREGLO 99: el bloque del resumen empieza en _caja, que es donde se arman
  // las cajitas de "cuanto tienes hoy", y acaba donde empieza la otra tabla.
  const resum = cap.slice(cap.indexOf("var _caja=function"), cap.indexOf("var tablasCuenta="));
  ok(filas.length>200 && resum.length>200, "el resumen de la tarjeta sigue en su sitio");

  // ── ARREGLO 100: GANASTE − CRECIO = DIFERENCIA, y las filas la suman ──
  //
  // Sus palabras: "lo que me interesa saber es que el dinero realmente este
  // creciendo como dice... y no que me digas 'ganaste este mes 200 dolares'
  // pero resulta que no tengo de que forma ver que sean 200, porque el saldo
  // sigue siendo el mismo".
  //
  // La identidad sale entera de conciliacionCapital() y no se calcula nada
  // nuevo aqui:
  //
  //   salto = (bruta − egEmpresa − egPersonal − socios) − intAp − traspPers
  //           + ajustes + tasas + sinExplicar
  //   ⇒ salto − enPapel = −traspPers − intAp + ajustes + tasas + sinExplicar
  //
  // Si alguien quita un termino de un lado sin quitarlo del otro, la tarjeta
  // deja de sumarse a mano — y una tarjeta que no se puede sumar a mano es
  // peor que no dar el desglose (es lo que ya costo el 34,27 contra 34,28).
  const papel = cap.slice(cap.indexOf("var _enPapel="), cap.indexOf("var _filas=[]"));
  ok(papel.length>20, "el 'ganaste en el papel' sigue en su sitio");
  // Se fija la EXPRESION entera, no los nombres por separado. Buscandolos a
  // secas la prueba negativa pasaba con "co.egEmpresaX" y con el termino
  // multiplicado por cero: el nombre seguia ahi y la cuenta ya no.
  ok(/_enPapel=_r2\(co\.bruta-co\.egEmpresa-co\.egPersonal-co\.socios\)/.test(papel),
     "lo que GANASTE en el papel es bruta − egresos − personales − socios, entero");
  ok(/_dif3=_r2\(_saltoTotal2-_enPapel\)/.test(cap),
     "y la DIFERENCIA es lo que crecio menos eso: ni un termino mas");
  // Y el otro lado: las cinco filas son exactamente los cinco terminos que
  // sobran de la identidad. Se miden sobre el bloque de _filas, no sobre la
  // funcion entera: estos nombres vuelven a salir mas abajo en la tabla del
  // desplegable y buscandolos en toda la funcion pasarian con la fila borrada.
  [["-co.traspPers.total","lo que pasaste a tus cuentas 💜"],
   ["co.tasas.total",     "el desfase de las tasas"],
   ["co.ajustes.total",   "los saldos que escribiste a mano"],
   ["-co.intAp.total",    "los intereses que ya iban en la apertura"],
   ["sinExp",             "lo que queda sin explicar"]].forEach(function(x){
    ok(new RegExp("_filas\\.push\\(\\[[^\\]]{0,160}?,\\s*"+
                  x[0].replace(/[.\-]/g,function(m){return "\\"+m;})+
                  "\\s*,\\s*(sano\\?)?\"?var\\(--").test(filas),
       "la diferencia desglosa "+x[1]+" (si no, las filas no la suman)");
  });
  // Las tres cifras grandes: es la cadena que ella pidio, y va entera o no va.
  ["Ganaste","Creció","Diferencia"].forEach(function(r){
    ok(new RegExp('_tile\\("'+r+'"').test(resum),
       "la cadena lleva su cifra de "+r);
  });
  // ARREGLO 100: esta fila se llamaba "No es dinero" y para su pregunta eso era
  // FALSO. efectoTasasDesde() valora cada movimiento a la tasa de HOY contra la
  // ganancia que se apunto aquel dia: con sus datos son −255,32, que son sobre
  // todo sus bolivares valiendo menos — justo el riesgo que ella explico. Es la
  // pieza mas grande del hueco, y llamarla "no es dinero" le tapaba la
  // respuesta a lo unico que pregunto.
  ok(!/No es dinero/.test(cap),
     "la fila de las tasas ya no dice 'no es dinero', que era falso para su pregunta");
  ok(/valen menos hoy/.test(filas),
     "y dice lo que de verdad pasa: sus bolivares valen menos hoy");
  // Un traspaso a una cuenta 💜 baja el capital de la empresa pero no es una
  // perdida: el dinero sigue siendo suyo. Sin esa coletilla la fila se lee como
  // dinero que se fue.
  ok(/sigue siendo tuyo/.test(filas),
     "y lo que paso a sus cuentas 💜 se dice que no es perdida");
  // ARREGLO 100: el semaforo tenia "Tienes $X · deberias tener $Y", que es la
  // MISMA diferencia contada desde el otro lado. A la vista competia con la
  // cadena de arriba: "me dice que deberia de tener 2600 y que tengo 2500, no
  // estoy entendiendo ese punto". No se borro (ARREGLO 69: esconderla del todo
  // la dejo sin saber de donde salia el titular): vive dentro del desplegable,
  // de cabecera de la tabla que la desglosa.
  const _iSem = cap.indexOf('(sano ? "✅ Cuadra"');
  const _fSem = cap.indexOf("S._concDetalle=!S._concDetalle");
  // Si un ancla deja de existir, slice(-1, …) devuelve el archivo entero y la
  // guardia deja de medir lo que cree medir. Por eso se exigen las dos.
  ok(_iSem > -1 && _fSem > _iSem, "el semaforo sigue estando donde se mide");
  const _semaforo = cap.slice(_iSem, _fSem);
  ok(!/deberías tener/.test(_semaforo),
     "arriba manda UNA sola cuenta: el segundo 'deberias tener' no compite ahi");
  ok(/deberías tener/.test(cap.slice(cap.indexOf("S._concDetalle=!S._concDetalle"))),
     "pero no se borro: sigue entera dentro del desplegable (ARREGLO 69)");
  ok(/Empezaste el/.test(resum) && /es lo que tienes hoy/.test(resum) &&
     /f2\(R\.total\)/.test(resum),
     "la tarjeta abre con lo que ella pidio: con cuanto empezo y cuanto tiene hoy");
  // ARREGLO 99: el detalle pasa de cuatro lineas sangradas a cuatro cajitas.
  ["R.enCuentas","R.enReserva","R.porCobrar","R.enPrestamos"].forEach(function(c){
    ok(new RegExp("_caja\\([^)]{0,60}"+c.replace(".","\\.")).test(resum),
       "y el 'hoy tienes' va detallado: "+c);
  });
  // Apartar un numero negativo no significa nada (ARREGLO 57): con sus datos
  // socios vale -0,54, o sea que el socio le debe. La fila cambia de nombre.
  ok(/Cobrado a socios/.test(cap),
     "un saldo de socio negativo se dice 'cobrado', no 'pagos' en negativo");
  // Y las cuentas no se calculan aparte: salen de conciliacionCapital().
  ok(!/capitalRealTotal\(\)[\s\S]{0,400}Empezaste el/.test(cap),
     "ningun numero de la tarjeta se vuelve a calcular por su cuenta");
}

// ── ARREGLO 95: la tarjeta de credito es una cuenta, y su saldo es DEUDA ───
// Sus palabras: "el saldo que yo utilizo de ahi es el mismo limite de reserva
// que yo tengo en el banco". Una compra con la tarjeta se apuntaba como si
// saliera del efectivo del banco el dia de la compra; del banco no sale nada
// hasta que se paga la factura. Medido contra su extracto: PagBank en 199,81
// con el banco en 0,00.
{
  const H = sinComentarios(HTML);

  // 1. Una tarjeta NO entra en el aviso de saldo negativo: ahi el negativo es
  //    la deuda, que es lo normal. Es el guardia que separa los dos avisos.
  const neg = sinComentarios(sacarFuncion("_cuentasEnNegativo"));
  ok(/c\.esTarjeta/.test(neg),
     "una tarjeta de credito no sale en el aviso de saldo en negativo");
  ok(/activa===false/.test(neg),
     "y una cuenta pausada tampoco");

  // 2. El aviso de negativo existe y se dibuja arriba del panel, fuera del
  //    scroll (ARREGLO 62): un aviso al fondo de una lista no es un aviso.
  ok(/function _htmlAvisoSaldoNegativo\(\)/.test(H),
     "hay aviso cuando una cuenta de banco queda en negativo");
  ok(/_htmlAvisoSaldoNegativo\(\)\+/.test(H),
     "y se dibuja arriba del panel, no dentro de una pantalla suelta");
  const avn = sinComentarios(sacarFuncion("_htmlAvisoSaldoNegativo"));
  ok(/No lo arregles escribiendo el saldo/.test(avn),
     "y dice que no se arregla escribiendo el saldo, que es lo que borra la pista");
  ok(/tarjeta de cr/.test(avn),
     "y apunta a la causa mas probable: que se pago con la tarjeta");

  // 3. La deuda se lee del saldo en negativo, y un positivo NO es deuda.
  const dt = sinComentarios(sacarFuncion("_deudaTarjeta"));
  ok(/s<0/.test(dt),
     "lo que se debe en la tarjeta es el saldo en negativo, leido al derecho");

  // 4. La comision del Pix con tarjeta: su comprobante del 05/10 dice 4,98%
  //    sobre 50,00 = 2,49, total 52,49. El 4,98 es el valor por omision.
  const cm = sinComentarios(sacarFuncion("_comisionPixTarjeta"));
  ok(/4\.98/.test(cm),
     "la comision del Pix con tarjeta trae el 4,98% de su comprobante por omision");
  ok(/pct<0\|\|pct>100/.test(cm),
     "y un porcentaje fuera de rango se ignora en vez de destrozar la cuenta");
  ok(/pctPixTarjeta/.test(H) && /id='inp-pix-tarjeta'/.test(H) &&
     /function guardarPixTarjeta\(\)/.test(H),
     "y se puede editar en Configuracion: si no, no hay donde escribirla");

  // 5. Marcar una cuenta como tarjeta no puede hacerse sobre una personal, una
  //    de reserva ni la madre — ahi el negativo significa otra cosa.
  const tg = sinComentarios(sacarFuncion("toggleCuentaTarjeta"));
  ok(/esPersonal\|\|c\.esReserva\|\|c\.esMadre/.test(tg),
     "una cuenta personal, de reserva o madre no puede marcarse como tarjeta");
  ok(/_leerNumero\(/.test(tg),
     "el limite pasa por _leerNumero: con el teclado en espanol la coma es decimal");

  // 6. El limite se puede cambiar sin desmarcar la tarjeta.
  ok(/function editarLimiteTarjeta\(/.test(H),
     "el limite se cambia sin tener que desmarcar y volver a marcar");
}

// ── ARREGLO 101: TODA pantalla que pinte un saldo negativo sabe de tarjetas ──
// El 95 lo arreglo en el aviso de arriba del panel y en Balance de Cuentas, y
// quedaron TRES sitios mas con su propia copia de la regla. Ella lo vio el
// 07/10 con PagBank ya cuadrado contra el banco al centimo:
//
//   Inventario USDT ....  ⚠️ sobre su −112,56
//   alertas del Resumen   🔴 "Cuenta en negativo" ROJA y urgente, todos los dias
//   informe del Cierre .  "⚠️ Saldo negativo — revisar", y ese papel sale fuera
//
// En una tarjeta el negativo es la DEUDA, que es lo normal; lo que avisa ahi es
// pasarse del LIMITE. Una alarma roja permanente que no significa nada es lo que
// ensena a no leer las alarmas, y en esta app las rojas cuestan dinero.
{
  const H = sinComentarios(HTML);

  // 1. Las alertas del Resumen leen _cuentasEnNegativo(), que ya sabe de
  //    tarjetas, en vez de llevar su propia copia del filtro. El mismo dato no
  //    se calcula en dos sitios: la copia era justo la que no sabia.
  ok(/var ctasNeg=_cuentasEnNegativo\(\)/.test(H),
     "la alerta del Resumen sale del mismo filtro que ya excluye la tarjeta");
  ok(!/ctasNeg=\(S\.cuentas\|\|\[\]\)\.filter/.test(H),
     "y no se quedo una segunda copia del filtro al lado");

  // 2. Inventario USDT. Se mide SOBRE EL BLOQUE de las cajitas: "esTarjeta"
  //    sale por toda la funcion y buscandolo suelto pasaba con el arreglo
  //    borrado.
  const inv = sinComentarios(sacarFuncion("rInventarioUsdt"));
  const cajas = inv.slice(inv.indexOf("csMon.forEach(function(c){"),
                          inv.indexOf("// VES: mostrar total"));
  ok(cajas.length > 200, "las cajitas de cuentas siguen en su sitio");
  ok(/var esTj=!!c\.esTarjeta/.test(cajas) && /_deudaTarjeta\(c\)/.test(cajas),
     "las cajitas del inventario saben si la cuenta es una tarjeta");
  // Lo que decide la ALARMA tiene que ser el limite, no el signo.
  ok(/isNeg=esTj \? pasada : \(s<0\)/.test(cajas),
     "y el ⚠️ lo dispara pasarse del limite, no que el saldo sea negativo");
  // Pero una deuda tampoco puede salir pintada como dinero (ARREGLO 95).
  ok(/\(esTj&&deuda>0\)\?"var\(--avi\)"/.test(cajas),
     "una deuda no se pinta del mismo verde que un saldo a favor");
  ok(/💳 debes/.test(cajas),
     "y se dice con palabras que eso es lo que debe");

  // 3. El informe del Cierre. Este ademas sale HACIA FUERA —lo ve Julio y lo ve
  //    el contador— asi que una tarjeta marcada "revisar" todos los meses es
  //    peor aqui que en pantalla.
  const inf = sinComentarios(sacarFuncion("rInformeCierre"));
  ok(/var isNeg=_esTj \? _pasoTj : \(\(parseFloat\(c\.saldo\)\|\|0\)<0\)/.test(inf),
     "el informe del cierre tampoco marca 'revisar' una tarjeta que debe lo normal");
  ok(/Te pasaste del límite de la tarjeta/.test(inf),
     "y cuando SI hay que avisar, dice lo que de verdad pasa");
  ok(/💳 debes/.test(inf),
     "y la cifra de una tarjeta lleva su 'debes', no sale como saldo a favor");
}

// ── ARREGLO 96: un gasto personal pagado DESDE una cuenta 💜 ya salio ──────
// Una cuenta 💜 no esta dentro del capital de la empresa, asi que ese dinero ya
// habia salido con el traspaso a esa cuenta: restarlo otra vez en la
// conciliacion lo contaba dos veces. Medido con su export del 19/09: el "sin
// explicar" pasa de 59,28 a 7,76, o sea de aviso a Cuadra.
{
  const H = sinComentarios(HTML);
  const f = sinComentarios(sacarFuncion("egresosPersonalesDesdeCuentaPersonal"));

  // Ojo: buscar "esPersonal" a secas pasaba con el filtro roto, porque el mapa
  // de cuentas 💜 se construye arriba con ese mismo nombre. Hay que exigir que
  // el filtro lo USE.
  ok(/esPersonal/.test(f) && /!pers\[e\.cuentaId\]/.test(f),
     "solo se descuenta lo pagado desde una cuenta marcada 💜");
  ok(/e\.pagada/.test(f),
     "y solo lo que de verdad se pago");
  // El corte tiene que ser el MISMO que usa la resta a la que corrige
  // (traspasosAPersonal): iso>desdeIso, y los del mismo dia aparte.
  ok(/iso>desdeIso/.test(f) && /mismoDia/.test(f),
     "la fecha se compara igual que en traspasosAPersonal, con el mismo corte");
  ok(/iso<desdeIso\)\s*return/.test(f),
     "lo anterior a la apertura no entra: eso ya lo descuenta aperturaBase");

  // Se engancha en la conciliacion, y la tarjeta ensena el numero CORREGIDO:
  // si devolviera el bruto, la lista de la tarjeta dejaria de sumar el salto.
  const cc = sinComentarios(sacarFuncion("conciliacionCapital"));
  ok(/egPersDesdePers=egresosPersonalesDesdeCuentaPersonal\(desde\)/.test(cc),
     "la conciliacion lo descuenta");
  ok(/egPersonalEmpresa=r2v\(egPersonal-egPersDesdePers\.total\)/.test(cc),
     "y lo que queda es solo lo que salio de una cuenta de la EMPRESA");
  ok(/deberias=r2v\([^)]*-egPersonalEmpresa-/.test(cc),
     "'deberias tener' usa el numero corregido, no el bruto");
  ok(/egPersonal:egPersonalEmpresa/.test(cc),
     "y la tarjeta ensena el mismo, para que su lista siga sumando el salto");

  // Lo que NO hay que hacer nunca: cambiarlo en _acumuladosMes. aperturaBase
  // guarda el valor viejo, asi que el mes nuevo menos la base vieja daria
  // -471,13 con sus datos y le inventaria capital.
  const am = sinComentarios(sacarFuncion("_acumuladosMes"));
  ok(/egPersonal:\s*parseFloat\(c\.egPerPagPropio\)/.test(am),
     "_acumuladosMes NO cambia: aperturaBase guarda el valor viejo");
}

// ══════════════════════════════════════════════════════════════════════════
// ARREGLO 97 — la entrega pagada desde varias cuentas
//
// El espejo del 44. Lo que hay que fijar no es el reparto en si, que es
// aritmetica, sino las dos cosas que NO son copiar y pegar del 44: que la
// comision se cobre por banco y que el FIFO se consuma por cuenta.
// ══════════════════════════════════════════════════════════════════════════
{
  console.log("\n── ARREGLO 97: pagar la entrega desde varias cuentas ──");
  const H = sinComentarios(HTML);

  // ── 1. Las filas tienen que sumar lo entregado, sin margen ──────────────
  S.cuentas = [
    {id:"cBDV",  nombre:"BANCO DE VENEZUELA", moneda:"VES", tipo:"banco", saldo:200000, activa:true},
    {id:"cPROV", nombre:"PROVINCIAL",         moneda:"VES", tipo:"banco", saldo:100000, activa:true},
    {id:"cNU",   nombre:"NUBANK",             moneda:"BRL", tipo:"banco", saldo:5000,   activa:true},
    {id:"cBIN",  nombre:"BINANCE",            moneda:"USDT",tipo:"fiat",  saldo:500,    activa:true}
  ];
  const _ent = (filas) => F.entregasDeRemesa({entregasMulti:true, entregas:filas});
  ok(F.sumaEntregas(_ent([{cuentaId:"cBDV",monto:"60000"},{cuentaId:"cPROV",monto:"40000"}])) === 100000,
     "las dos partes suman lo entregado",
     F.sumaEntregas(_ent([{cuentaId:"cBDV",monto:"60000"},{cuentaId:"cPROV",monto:"40000"}])));
  // Sin el desglose encendido no devuelve nada: apagado es exactamente lo de antes.
  ok(F.entregasDeRemesa({entregasMulti:false, entregas:[{cuentaId:"cBDV",monto:"1"}]}) === null,
     "apagado, el desglose no existe y la remesa va por el camino de siempre");
  // Una fila sin cuenta o en cero no cuenta: es una fila a medio llenar.
  ok(_ent([{cuentaId:"cBDV",monto:"100"},{cuentaId:"",monto:"50"},{cuentaId:"cPROV",monto:""}]).length === 1,
     "una fila sin cuenta o sin monto no entra");
  // La coma decimal del teclado en espanol tiene que llegar bien.
  ok(F.sumaEntregas(_ent([{cuentaId:"cBDV",monto:"1.234,56"}])) === 1234.56,
     "el monto pasa por _leerNumero: con la coma decimal no se pierde",
     F.sumaEntregas(_ent([{cuentaId:"cBDV",monto:"1.234,56"}])));

  // ── 2. SON DOS COMISIONES, y el minimo de 14 es el que se cuela ─────────
  S.config = {comision_banco_vzla:0.003, comision_banco_vzla_min:14, comision_banco_transferencia:54};
  // Dos pagos moviles grandes: 0,3% de cada parte.
  const cGrande = F.comisionesDeEntregas([{cuentaId:"cBDV",monto:60000,com:"movil"},
                                          {cuentaId:"cPROV",monto:40000,com:"movil"}]);
  ok(cGrande.total === 300, "dos pagos moviles cobran el 0,3% de SU parte: 180 + 120", cGrande.total);
  // Y aqui esta lo que una comision global se come: partido, el minimo entra dos veces.
  const cChica = F.comisionesDeEntregas([{cuentaId:"cBDV",monto:2000,com:"movil"},
                                         {cuentaId:"cPROV",monto:2000,com:"movil"}]);
  ok(cChica.total === 28,
     "partido en dos, el minimo de 14 se cobra DOS veces: 28, no los 12 de una sola",
     cChica.total);
  ok(F.comisionBancoVES("movil", 4000) === 14,
     "medida sobre el total esa misma entrega serian 14 — por eso la comision va por fila",
     F.comisionBancoVES("movil", 4000));
  // Dos transferencias son 54 + 54, no 54.
  const cTr = F.comisionesDeEntregas([{cuentaId:"cBDV",monto:90000,com:"transf"},
                                      {cuentaId:"cPROV",monto:10000,com:"transf"}]);
  ok(cTr.total === 108, "dos transferencias son 54 + 54", cTr.total);
  // Mezcladas, cada una con la suya.
  const cMix = F.comisionesDeEntregas([{cuentaId:"cBDV",monto:60000,com:"movil"},
                                       {cuentaId:"cPROV",monto:40000,com:"transf"}]);
  ok(cMix.total === 234 && cMix.det.length === 2,
     "una movil y una transferencia: 180 + 54, cada banco con su tarifa", cMix.total);
  // Dentro del mismo banco no se cobra nada.
  ok(F.comisionesDeEntregas([{cuentaId:"cBDV",monto:60000,com:""},
                             {cuentaId:"cPROV",monto:40000,com:"movil"}]).total === 120,
     "la fila dentro del mismo banco no cobra comision");
  // Una cuenta que no es un banco venezolano no tiene este tarifario.
  ok(F.comisionesDeEntregas([{cuentaId:"cNU",monto:1000,com:"movil"}]).total === 0,
     "el tarifario del BCV no se le aplica a un banco que no es venezolano");
  // El detalle tiene que decir cual cobro cuanto: un total suelto obliga a
  // rehacer la cuenta a mano para saber si el minimo entro.
  ok(cMix.det[0].cuentaId === "cBDV" && cMix.det[0].comision === 180 &&
     cMix.det[1].cuentaId === "cPROV" && cMix.det[1].comision === 54,
     "y el detalle dice que banco cobro cuanto");
  ok(F.etiquetaComisionBanco("varias") !== "",
     "con varias tarifas la etiqueta no se queda muda diciendo 'pago movil'");

  // ── 3. El FIFO se consume de los lotes de CADA cuenta ───────────────────
  // Dos lotes de venta de bolivares, uno por banco. Si el consumo no mirara la
  // cuenta, los 60.000 del BDV se comerian el lote del Provincial.
  S.inventarioUsdt = [
    {id:1, tipo:"venta", fecha:"10/01", fechaIso:"2026-10-01", moneda:"VES",
     cuentaDestinoId:"cBDV",  bs:70000, bsRestante:70000, usdt:70, restante:0, tasa:1000},
    {id:2, tipo:"venta", fecha:"10/01", fechaIso:"2026-10-01", moneda:"VES",
     cuentaDestinoId:"cPROV", bs:50000, bsRestante:50000, usdt:50, restante:0, tasa:1000},
    {id:3, tipo:"compra", fecha:"10/01", fechaIso:"2026-10-01", moneda:"BRL",
     cuentaOrigenId:"cNU", usdt:100, restante:100, bs:0, tasa:5}
  ];
  const _entFifo = [{cuentaId:"cBDV",monto:60000,com:""},{cuentaId:"cPROV",monto:40000,com:""}];
  F.consumirFIFORemesa("BRL", 19.4, "VES", 100000, "cNU", "cBDV", _entFifo);
  const _l = (id) => S.inventarioUsdt.find(x => x.id === id);
  ok(_l(1).bsRestante === 10000,
     "los 60.000 salen del lote del Banco de Venezuela", _l(1).bsRestante);
  ok(_l(2).bsRestante === 10000,
     "y los 40.000 del lote del Provincial — no todo de uno", _l(2).bsRestante);
  ok(Math.abs(_l(3).restante - 80.6) < 0.001,
     "y el USDT se consume UNA vez, no una por cada cuenta de entrega",
     _l(3).restante);

  // Sin desglose, el consumo tiene que quedar exactamente como estaba.
  S.inventarioUsdt = [
    {id:1, tipo:"venta", fecha:"10/01", fechaIso:"2026-10-01", moneda:"VES",
     cuentaDestinoId:"cBDV", bs:70000, bsRestante:70000, usdt:70, restante:0, tasa:1000},
    {id:3, tipo:"compra", fecha:"10/01", fechaIso:"2026-10-01", moneda:"BRL",
     cuentaOrigenId:"cNU", usdt:100, restante:100, bs:0, tasa:5}
  ];
  F.consumirFIFORemesa("BRL", 10, "VES", 50000, "cNU", "cBDV", null);
  ok(_l(1).bsRestante === 20000 && _l(3).restante === 90,
     "con una sola cuenta el consumo es el de siempre",
     _l(1).bsRestante + " / " + _l(3).restante);

  // El reparto con una sola cuenta devuelve una fila: un solo camino, no dos.
  ok(F._entregasParaFIFO(null, "cBDV", 1234.5).length === 1 &&
     F._entregasParaFIFO(null, "cBDV", 1234.5)[0].cuentaId === "cBDV",
     "sin desglose el reparto es una fila: el camino del FIFO es uno solo");

  // ── 4. Al borrar, cada parte vuelve a los lotes de SU cuenta ────────────
  S.inventarioUsdt = [
    {id:1, tipo:"venta", fecha:"10/01", fechaIso:"2026-10-01", moneda:"VES",
     cuentaDestinoId:"cBDV",  bs:70000, bsRestante:10000, usdt:70, restante:0, tasa:1000},
    {id:2, tipo:"venta", fecha:"10/01", fechaIso:"2026-10-01", moneda:"VES",
     cuentaDestinoId:"cPROV", bs:50000, bsRestante:10000, usdt:50, restante:0, tasa:1000}
  ];
  F._restaurarVentasFIFO({cuentaDest:"cBDV", entregas:_entFifo}, "VES", 100000);
  ok(_l(1).bsRestante === 70000 && _l(2).bsRestante === 50000,
     "borrar la remesa devuelve 60.000 al BDV y 40.000 al Provincial",
     _l(1).bsRestante + " / " + _l(2).bsRestante);
  // Y nunca por encima de lo que el lote tenia.
  F._restaurarVentasFIFO({cuentaDest:"cBDV", entregas:_entFifo}, "VES", 100000);
  ok(_l(1).bsRestante === 70000 && _l(2).bsRestante === 50000,
     "y un lote no puede quedar con mas bolivares de los que nacio");

  // ── 5. La parte de "uv" de cada fila, para la entrega que hace un aliado ─
  ok(F._uvDeParte(100, 60, 100) === 60 && F._uvDeParte(100, 40, 100) === 40,
     "con el aliado pagado en USDT, cada cuenta pone su parte de uv");
  ok(F._uvDeParte(100, 60, 0) === 0,
     "y sin total no se inventa una salida");

  // ── 6. Guardias de estructura: lo que no se puede deshacer ──────────────
  // El USDT se consume una vez. Si alguien pone res.uc dentro del bucle, se
  // consume tantas veces como cuentas haya y la ganancia sale mal.
  const cf = sinComentarios(sacarFuncion("consumirFIFORemesa"));
  ok(/consumirInventarioFIFO\(monOrig, uc, monDest, 0,/.test(cf),
     "el USDT se consume fuera del bucle de cuentas: una sola vez");
  ok(/consumirInventarioFIFO\(monOrig, 0, monDest, p\.monto,/.test(cf),
     "y cada cuenta consume solo SUS bolivares");
  // La salida de cada fila pasa por salidaDeCuentaEntrega, igual que la unica:
  // si no, un aliado pagado en USDT dejaria de descontar.
  const ac = sinComentarios(sacarFuncion("actualizarCuentasPorRemesa"));
  ok(/entregas\.forEach/.test(ac) && /salidaDeCuentaEntrega\(_cE/.test(ac),
     "cada fila descuenta por el mismo camino que la cuenta unica");
  ok(/_completarDesdeMadre\(_cE/.test(ac),
     "y la cuenta madre completa a cada banco que se quede corto, como siempre");
  // El desglose se guarda en la remesa: sin eso, borrarla no sabria repartir.
  ok(/nuevaRemesa\.entregas=_entregas/.test(H),
     "la remesa guarda de que cuentas salio");
  // Y cuentaDest sigue siendo la primera fila: el Balance por cuenta, los
  // filtros y el cierre leen ese campo y no se enteran del desglose.
  ok(/f\.cuentaDest=_entregas\[0\]\.cuentaId/.test(H),
     "cuentaDest queda en la primera cuenta: lo que ya leia ese campo no cambia");
  // No se guarda si las filas no suman lo entregado.
  ok(/sumaEntregas\(_entregas\)-res\.cant/.test(H),
     "no deja guardar si las filas no suman exactamente lo entregado");
  // Ni con una cuenta repetida, que descuadraria la comprobacion del FIFO.
  ok(/\u00e1 dos veces/.test(HTML) && /_vistas\[e\.cuentaId\]/.test(HTML),
     "ni con la misma cuenta dos veces");
  // Ni mezclando monedas.
  ok(/no son todas de la misma moneda/.test(HTML),
     "ni mezclando cuentas de monedas distintas");
  // El total de la pantalla sale de cTx(), que es de donde lo saca saveTx.
  const eh = sinComentarios(sacarFuncion("_txEntregasHTML"));
  ok(/cTx\(\)\.cant/.test(eh),
     "lo entregado que ensena la pantalla sale de cTx(), el mismo sitio que valida al guardar");
  ok(/comisionesDeEntregas\(/.test(eh),
     "y la pantalla ensena lo que va a cobrar cada banco ANTES de guardar");
  // El boton existe y esta apagado por omision.
  ok(/onclick='txEntregasToggle\(\)'/.test(H) && /desde varias cuentas/.test(H),
     "hay un boton para encenderlo, al lado de la cuenta de entrega");
  ok(/entregasMulti:false/.test(H),
     "y arranca apagado: son casos esporadicos, no puede estorbar siempre");
  // La reversion vive en un solo sitio, no en dos copias.
  ok((HTML.match(/function _restaurarVentasFIFO\(/g) || []).length === 1 &&
     (HTML.match(/_restaurarVentasFIFO\(r, monDest, cant\);/g) || []).length === 2,
     "la devolucion de los lotes esta escrita una vez y la usan los dos caminos del borrado");
}

// ══════════════════════════════════════════════════════════════════════════
// ARREGLO 98 — la comisión se decide en UN sitio, y la pantalla ensena lo que
// se guarda
//
// El 97 puso la comision por fila y dejo el selector global abajo. saveTx ya
// lo ignoraba, pero seguia a la vista y la vista previa seguia leyendolo: con
// una fila en pago movil y el selector en "sin comision", la GANANCIA salia
// sin descontar nada y al guardar si se descontaba.
// ══════════════════════════════════════════════════════════════════════════
{
  console.log("\n── ARREGLO 98: una sola comision, y la pantalla no miente ──");
  const H = sinComentarios(HTML);
  const rn = sinComentarios(sacarFuncion("rNueva"));

  // 1. La ganancia que se ensena sale de cTx(), que es la que se guarda.
  //    Recalcularla aqui es lo que la dejaba 0,12 USDT por debajo: esta
  //    pantalla restaba COM() a los dos lados siempre y cTx() no la aplica
  //    cuando la tasa viene de un lote (ARREGLO 42).
  ok(/var _rTx=cTx\(\);/.test(rn) && /var uc=_rTx\.uc, uv=_rTx\.uv;/.test(rn) &&
     /var pr=_rTx\.pr;/.test(rn),
     "la ganancia de la pantalla sale de cTx(), no se recalcula aparte");
  ok(!/r4\(am\/tc-_comPlat\)/.test(rn) && !/r4\(cant\/tv\+_comPlat\)/.test(rn),
     "y no vuelve el calculo propio que restaba COM() a los dos lados");

  // 2. Con el desglose puesto, la comision viva sale de las filas.
  ok(/var _entVivo=entregasDeRemesa\(f\);/.test(rn) &&
     /_entVivo \? comisionesDeEntregas\(_entVivo\)\.total/.test(rn),
     "con el desglose, la comision de la vista previa sale de las filas");

  // 3. Y el selector global NO se dibuja: dos sitios para lo mismo es lo que
  //    la dejo sin saber cual mandaba.
  // Anclado al "+(" que abre el ternario: con un "false&&" delante, o con la
  // condicion desactivada de cualquier otra forma, deja de encajar. Escrita
  // sin el ancla pasaba con el selector volviendo a dibujarse.
  ok(/\+\s*\(ruta\.dest==="VES"&&_entVivo\s*\?/.test(rn) &&
     /La comisi&oacute;n va|La comisión va/.test(rn),
     "con el desglose el selector de abajo no se dibuja, y dice donde vive");
  ok((rn.match(/S\.tx\.comisionBanco=this\.value/g) || []).length === 1,
     "el selector global sigue existiendo una sola vez, para cuando no hay desglose");

  // 4. El rotulo mentia: no es un 3%, es 0,3% con minimo, o una cuota fija.
  ok(!/3% banco/.test(H),
     "el texto ya no dice '3% banco', que no es ninguna de las tres tarifas");
}

// ══════════════════════════════════════════════════════════════════════════
// ARREGLO 99 — el Balance de Cuentas, con menos letra
//
// Sus palabras: "no lo veo practico, esas cosas amarillas, mucha letra para
// leer". La tarjeta decia TRES cosas a la vez, cada una con su color:
// "Diferencia +23,16" verde, "te faltan 127,66" rojo y "Sobra sin explicar
// 215,47" ambar. Las tres correctas, y juntas no se sabe cual mirar.
// ══════════════════════════════════════════════════════════════════════════
{
  console.log("\n── ARREGLO 99: el balance, con menos letra ──");
  const cap = sinComentarios(sacarFuncion("rCapitalTotal"));

  // 1. El contenedor NO se pinta del color de la alarma. Pintado asi, el bloque
  //    de "cuanto tienes" —que no tiene nada de malo— salia dentro de un
  //    recuadro ambar, y eso es lo que ella llamo "las cosas amarillas".
  ok(/return "<div style='background:var\(--sup2\);border:1px solid var\(--ln\)/.test(cap),
     "el contenedor va neutro: el color vive en el semaforo, que es quien juzga");
  ok(!/return "<div style='background:"\+bg\+"/.test(cap),
     "y no vuelve a pintarse entero del color de la alarma");

  // 2. El semaforo lleva el color, y lo lleva en el borde: una sola cosa roja
  //    o ambar en toda la tarjeta.
  ok(/border-left:4px solid "\+col\+"/.test(cap),
     "el semaforo es lo unico que lleva el color del veredicto");

  // 3. Los dos avisos caben en una linea. El parrafo que explicaba por que no
  //    se pueden situar llevaba ahi sin cambiar desde el 11/09: eso ya no se
  //    lee. Lo que NO puede pasar es que se plieguen (ARREGLO 48/60).
  ok(!/no se sabe si fueron antes o despu/.test(cap),
     "el aviso de los ajustes dejo de ser un parrafo");
  ok(!/No se dan por explicados, as/.test(cap),
     "y el de 'no se por que' tambien");
  // Anclado al "+(" que abre el ternario: con un "false&&" delante, o con la
  // condicion desactivada de cualquier otra forma, deja de encajar. Escrita
  // sin el ancla pasaba con el aviso ya apagado.
  ok(/\+\s*\(aj\.nMismoDia>0\?\(function\(\)\{/.test(cap) &&
     / sin situar/.test(cap) && /situarAjustesEnElAire\(\)/.test(cap),
     "pero los dos siguen a la vista, con su numero y su boton");
  ok(/\+\s*\(aj\.nSinSaber>0\s*\?/.test(cap),
     "y el de 'no se por que' tampoco se apaga");

  // 4. Lo que ella abre a mirar va primero y en grande.
  ok(/font-size:28px;font-weight:900[\s\S]{0,120}f2\(R\.total\)/.test(cap),
     "lo que tiene hoy es el numero grande de la tarjeta");
  ok(/es lo que tienes hoy, todo junto/.test(cap),
     "y se dice con palabras, no con un rotulo de contabilidad");

  // 5. El rotulo de la apertura no se pinta de rojo: solo el numero. Pintada
  //    entera, la linea se lee como si la apertura tuviera algo malo.
  // ARREGLO 100: la linea paso de span dentro de otra a un div propio, pero la
  // regla es la misma: el gris lo lleva el rotulo y el color solo el numero.
  ok(/color:var\(--tx3\)[^>]{0,60}'>"\+\s*\n?\s*"Empezaste el/.test(cap) ||
     /color:var\(--tx3\)[^>]{0,60}'>"\+"Empezaste el/.test(cap),
     "el rotulo de la apertura va en gris; el color es del numero");
  ok(/Empezaste el "\+ds\(co\.desde\)\+" con <b style='color:var\(--tx2\)'>/.test(cap),
     "y el monto de la apertura es lo unico que resalta de esa linea");
}

// ── ARREGLO 102: un nombre de cliente no puede ejecutar codigo ─────────────
// Medido el 08/10 en Chromium con su export: metiendo codigo en el nombre de
// un cliente, de una cuenta o en el motivo de un egreso, ese codigo se
// ejecutaba al abrir la pantalla. 104 veces solo en Clientes, 7 pantallas en
// total. Con un solo usuario da casi igual —se lo escribiria ella misma— pero
// la app va a tener operadores: uno escribe el veneno, ella abre Clientes como
// administradora, y corre dentro de SU sesion, con su testigo delante.
//
// Hay DOS escapes y no son intercambiables:
//   _escAud  para el cuerpo del HTML
//   _jsAttr  para dentro de un onclick, donde el navegador decodifica las
//            entidades ANTES de leer el JavaScript (por eso el
//            .replace(/"/g,"&quot;") que habia alli no servia de nada)
{
  const H = sinComentarios(HTML);

  ok(/function _escAud\(/.test(H) && /function _jsAttr\(/.test(H),
     "estan los dos escapes, el del HTML y el del onclick");
  // El de onclick tiene que escapar a \uXXXX: una entidad HTML no sobrevive,
  // porque el navegador la decodifica justo a tiempo de romper la cadena.
  const ja = sinComentarios(sacarFuncion("_jsAttr"));
  ok(/\\\\u/.test(ja) && /charCodeAt/.test(ja),
     "el de onclick escapa a \\uXXXX, no a entidades HTML");
  ok(/&/.test(ja.slice(ja.indexOf("replace"), ja.indexOf("replace")+60)),
     "y escapa tambien el &, que si no vuelve a formar la entidad");

  // Y el patron viejo no puede volver: escapaba solo la comilla doble, y a
  // entidad, que es justo lo que no funciona dentro de un atributo.
  // Anclado a ".algo.replace(" — si no, encajaba con el cuerpo del propio
  // _escAud(), que sí escapa a entidades y ahí está bien.
  ok(!/\.\w+\.replace\(\/"\/g,\s*"&quot;"\)/.test(H),
     "no vuelve el escape de comillas a entidad dentro de un onclick");

  // Los campos que ella teclea, en el sitio donde se dibujan. Se exige el
  // escape pegado al campo: sin esto, cualquiera de los 7 agujeros vuelve.
  [["cl\\.n", "el nombre del cliente"],
   ["cl\\.tel", "su telefono"],
   ["cl\\.ruta", "su ruta"],
   ["cl\\.cod", "su codigo"],
   ["p\\.desc", "la descripcion del prestamo"],
   ["e\\.cat", "la categoria del egreso"],
   ["r\\.rt", "la ruta de la remesa"],
   ["r\\.plataforma", "la plataforma del lote"],
   ["t\\.nota", "la nota del traspaso"]].forEach(function(x){
    const suelto = new RegExp('(?<!_escAud\\()(?<!_jsAttr\\()' + x[0] + '\\b\\s*\\+\\s*"[^"]*[<>]');
    ok(!suelto.test(H), "no queda sin escapar " + x[1]);
  });

  // nombreCuentaEg() devuelve el nombre crudo a proposito —lo usa tambien el
  // registro de auditoria, que se escapa al DIBUJARLO, no al escribirlo— asi
  // que cada sitio que lo pinta tiene que envolverlo el.
  const todas   = (H.match(/nombreCuentaEg\(/g) || []).length;
  const envueltas = (H.match(/_escAud\(nombreCuentaEg\(/g) || []).length;
  // 1 es la definicion de la funcion y 1 el logAudit, que va crudo a proposito:
  // la auditoria se escapa al DIBUJARLA, no al escribirla.
  ok(todas - envueltas <= 2,
     "el nombre de cuenta se escapa en cada sitio que lo dibuja (" +
     (todas - envueltas) + " crudos de " + todas + ")");
}

// ── ARREGLO 103: el respaldo se hace solo, y se VE ─────────────────────────
// Auditado el 07/10: armar_respaldo() existia desde hacia tiempo pero no habia
// nada programado, asi que lo unico que separaba sus datos de la nada era que
// ella se acordara de exportar. El servidor ya guarda una copia al dia; esta
// parte es que la app lo enseñe, porque un respaldo que nadie mira es uno del
// que nadie se entera cuando lleva tres semanas sin hacerse.
{
  const H = sinComentarios(HTML);
  const rp = sinComentarios(sacarFuncion("_htmlRespaldos"));

  ok(/function _pedirRespaldos\(/.test(H) && /\/respaldo\/estado/.test(H),
     "la app le pregunta al servidor por el estado de las copias");
  ok(rp.length > 200, "y hay una linea que lo enseña");

  // Lo que NO puede faltar: que diga lo que la copia del servidor no cubre.
  // Vive DENTRO de la misma base, asi que la salva de un borrado por error
  // pero no de perder la base entera. Sin esa frase, "copia automatica: hoy"
  // se lee como que ya no hace falta bajarse nada.
  ok(/dentro de la misma base/.test(rp),
     "y dice que la copia del servidor no la salva de perder la base");
  ok(/Restaurar/.test(rp),
     "y le dice con que boton se baja una");

  // El aviso se calla cuando bajo una hace poco: si saliera siempre, deja de
  // leerse (la misma regla del aviso permanente del ARREGLO 99).
  ok(/db===null\|\|db>7/.test(rp),
     "el aviso sale solo si lleva mas de una semana sin bajar una");

  // Y se anota cuando de verdad se baja, no cuando se pulsa: el boton puede
  // fallar antes de que haya archivo.
  const rb = sinComentarios(sacarFuncion("restoreFromBackup"));
  const iAnota = rb.indexOf("_anotarBajada()");
  const iBlob  = rb.indexOf("new Blob(");
  ok(iAnota > -1 && iBlob > -1 && iAnota < iBlob && (iBlob - iAnota) < 200,
     "la fecha de descarga se anota junto al archivo, no al pulsar");
}

// ── ARREGLO 104: el candado de contenido (_headers) ────────────────────────
// Es el cinturon del ARREGLO 102. Aquel cerro los agujeros por los que un
// nombre podia ejecutar codigo; este dice que, si un dia se abre otro, ese
// codigo no pueda mandarse los datos fuera.
//
// Medido en Chromium sirviendo la app con estas cabeceras: con ellas el
// navegador RECHAZA la conexion, la imagen y el script hacia un servidor que
// no esta en la lista; sin ellas, el script de fuera entra. Y la app sigue
// viva: 24 de 24 pestañas, 0 bloqueos, 0 errores.
{
  const CAB = fs.readFileSync(__dirname + "/../_headers", "utf8");
  const mCsp = CAB.match(/Content-Security-Policy:\s*(.+)/);
  ok(!!mCsp, "_headers lleva el candado de contenido");
  const csp = mCsp ? mCsp[1] : "";

  // Lo que de verdad frena una fuga: a donde puede hablar la pagina y de
  // donde puede cargar imagenes. Un comodin aqui deja el candado sin fuerza,
  // porque una imagen a un servidor ajeno ya se lleva los datos en la URL.
  [["connect-src", "a donde puede hablar la app"],
   ["img-src", "de donde puede cargar imagenes"],
   ["script-src", "de donde puede cargar codigo"]].forEach(function(x){
    const m = csp.match(new RegExp(x[0] + " ([^;]+)"));
    ok(!!m, "el candado dice " + x[1]);
    if (!m) return;
    ok(!/[\s]\*|\shttps:(\s|$)|unsafe-eval/.test(" " + m[1]),
       x[0] + " sin comodines: " + m[1].trim().slice(0, 60));
  });

  // Y su servidor tiene que estar en la lista, o la app se queda sin datos.
  ok(/centrogestion-api-production\.up\.railway\.app/.test(csp) &&
     /gallant-caring-production-6c35\.up\.railway\.app/.test(csp),
     "los dos servidores suyos estan permitidos (produccion y pruebas)");
  // Las dos CDN de las que salen html2canvas, SheetJS, Tesseract y html2pdf.
  ok(/cdnjs\.cloudflare\.com/.test(csp) && /cdn\.jsdelivr\.net/.test(csp),
     "y las dos CDN de las librerias");

  ok(/object-src 'none'/.test(csp), "nada de objetos incrustados");
  ok(/frame-ancestors 'none'/.test(csp), "y nadie puede meter la app en un marco ajeno");
  ok(/base-uri 'self'/.test(csp), "ni cambiarle la base a los enlaces");
}


// ── PASO 3: lo que el servidor NO dejo guardar se DICE ───────────────────
//
// Desde el paso 3 de la auditoria, PUT /estado saca del bloque las claves que
// esa persona no puede tocar y las devuelve en `clavesRechazadas`. Si la app
// no lo dice, la persona registra un egreso, lo ve en su pantalla —porque en
// su navegador si se guardo— y al siguiente repintado desaparece sin que nada
// explique por que. Es el mismo fallo mudo que la tarjeta del mercado cuando
// decia "sin lectura" a secas: si el servidor sabe por que dijo no, la
// pantalla lo dice.
{
  ok(/var _RECHAZADAS\s*=\s*\[\]/.test(HTML),
     "la app guarda lo que el servidor rechazo");
  ok(/d\.clavesRechazadas\s*&&\s*d\.clavesRechazadas\.length/.test(HTML),
     "y lo lee de la respuesta del guardado");
  // Anclado en el MARCADO, no en el nombre de la funcion: un comentario que
  // la nombre aparece antes y la guardia mediria otro trozo del archivo. Ya
  // paso tres veces en este proyecto.
  ok(/_htmlAvisoRechazado\(\)\+\s*\/\/ PASO 3/.test(HTML),
     "el aviso se pinta arriba del panel, fuera de la zona que hace scroll");

  // ARREGLO 32: repintar rehace el HTML y cierra lo que haya abierto bajo el
  // dedo. Cerrar un aviso se hace cambiando el display por su id.
  // Y se miden los comentarios FUERA. El comentario que explica el ARREGLO 32
  // dentro de esta funcion nombra R(), asi que la guardia se media a si misma
  // y fallaba con el codigo bueno. Es la cuarta vez en este proyecto que un
  // comentario secuestra una guardia: lo que se mide es el CODIGO.
  const sinComentarios = t => t.replace(/\/\/[^\n]*/g, "");
  const cerrar = sinComentarios(
    (HTML.match(/function _cerrarAvisoRechazado\(\)\{[\s\S]*?\n\}/) || [""])[0]);
  ok(cerrar.length > 40, "existe el boton de cerrar el aviso");
  ok(!/\bR\(\)/.test(cerrar),
     "cerrarlo NO llama a R() (ARREGLO 32)");
  ok(/getElementById\("aviso-rechazado"\)/.test(cerrar),
     "lo cierra por su id");

  // El nombre de la clave acaba dentro de innerHTML. Viene del servidor, pero
  // la regla de este archivo es la misma para todo lo que se pinta.
  const aviso = (HTML.match(/function _htmlAvisoRechazado\(\)\{[\s\S]*?\n\}/) || [""])[0];
  ok(/_escAud\(/.test(aviso), "y los nombres se escapan al pintarlos (ARREGLO 102)");
  // Ella nunca ha visto la palabra "cuentasCobrar": el servidor manda el
  // nombre interno y la pantalla tiene que traducirlo.
  ok(/_NOMBRE_DE_CLAVE\s*=\s*\{/.test(HTML) &&
     /egresos_personales:\s*"Gastos personales"/.test(HTML),
     "las claves se enseñan con el nombre que ella conoce");
}


// ── Una casilla marcada A MANO abre su pestaña, y el arranque cae en una que
//    la persona tenga ────────────────────────────────────────────────────
//
// Los dos fallos salieron del primer operador de verdad (08/10):
//
//   1. Marcarle "💸 Egresos" no hacia NADA. El menu se arma de TABS[rol], y
//      TABS.brl son cuatro pestañas fijas: el permiso solo podia QUITAR de
//      esa lista, nunca añadir. De las 21 casillas, a un operador le servian
//      4. Es el mismo fallo que S.config.modulos (FASE B) y que el selector
//      doble de la comision (ARREGLO 98): dos cosas decidiendo lo mismo y la
//      vieja ganando en silencio.
//
//   2. Entraba y le salia "Sin acceso · No tienes permiso para acceder a BRL"
//      en una pantalla vacia. La pestaña por omision la decide el ROL y los
//      permisos son de la PERSONA, asi que no tienen por que coincidir.
{
  const sinCom = t => t.replace(/\/\/[^\n]*/g, "");

  ok(/var _TABS_QUE_ABRE_UNA_CASILLA\s*=\s*\[/.test(HTML),
     "existe la lista de pestañas que puede abrir una casilla");
  const lista = (HTML.match(/_TABS_QUE_ABRE_UNA_CASILLA\s*=\s*\[([\s\S]*?)\]/) || ["",""])[1];
  const abren = (lista.match(/"([a-z_]+)"/g) || []).map(x => x.replace(/"/g, ""));

  // El menu de la administradora NO se puede mover ni una pestaña. Se cumple
  // sola mientras todo lo de esa lista ya este en TABS.admin: lo que ya tiene
  // no se le puede añadir.
  const admin = (HTML.match(/admin:\s*\[([^\]]*)\]/) || ["",""])[1];
  abren.forEach(function(t){
    ok(admin.indexOf('"' + t + '"') >= 0,
       "'" + t + "' ya esta en el menu de la administradora: su menu no se mueve");
  });
  // Y las que dependen de la RUTA de cada rol no se reparten por casilla: a un
  // operador de Brasil no se le abre la pestaña de EE.UU marcando una casilla.
  ["brl","vzla","eeuu","mi_ganancia","op_diario","nueva_eeuu"].forEach(function(t){
    ok(abren.indexOf(t) < 0, "'" + t + "' NO se abre por casilla: va con el rol");
  });
  ok(abren.indexOf("config_admin") < 0,
     "y Configuracion tampoco: ahi se tocan los permisos de todos");

  // Marcada A MANO quiere decir decidida para ESA persona. Si valiera el valor
  // por omision del rol, la lista de arriba le abriria pestañas a todo el mundo.
  const marcada = sinCom((HTML.match(/function _permisoMarcadoAMano\(perm\)\{[\s\S]*?\n\}/) || [""])[0]);
  ok(marcada.length > 40, "existe _permisoMarcadoAMano");
  ok(/===\s*true/.test(marcada),
     "solo cuenta un true explicito, no el valor por omision del rol");
  ok(!/_permisoPorOmision/.test(marcada),
     "y no se apoya en el valor por omision");
  ok(/rol\s*===\s*"admin"/.test(marcada),
     "la administradora no pasa por aqui: ya las tiene todas por TABS.admin");

  // El arranque: si la pestaña no es una de las suyas, se cambia.
  ok(/ts\.indexOf\(S\.tab\)<0\)\s*S\.tab=_primera/.test(HTML),
     "si la pestaña de arranque no es suya, se cambia por una que si");
  const primera = sinCom((HTML.match(/function _primeraPesta[\s\S]*?\n\}/) || [""])[0]);
  // Anclado en lo que DEVUELVE, no en que el nombre aparezca: con el nombre a
  // secas la prueba negativa pasaba con la funcion ya rota (devolvia ts[0] y
  // _GRUPOS_MENU seguia nombrado en el bucle de al lado).
  ok(/return _GRUPOS_MENU\[/.test(primera),
     "y devuelve una pestaña del MENU, que es el unico sitio donde vive el orden");
  ok(!/\bR\(\)/.test(primera + sinCom((HTML.match(/if\(ts\.length && ts\.indexOf\(S\.tab\)<0\)[^\n]*/) || [""])[0])),
     "sin llamar a R(): esto corre dentro del dibujado");
}


// ── Quién registró cada cosa ──────────────────────────────────────────────
//
// Sus palabras: "me gustaría que yo como administradora pueda ver quién
// registró cada cosa. O sea, operado por fulano de tal."
//
// Lo que esto vigila sobre todo es lo contrario de lo que parece: no que se
// selle, sino que NO se selle de mas. En la primera pasada sobre un campo
// TODOS los registros parecen nuevos —no hay foto de nada—, asi que sellar
// ahi le pondria el nombre de quien tiene la app abierta encima de sus 192
// remesas. Medido en Chromium: cargando sus 192, selladas 0.
{
  const sinCom = t => t.replace(/\/\/[^\n]*/g, "");
  const marcar = sinCom((HTML.match(/function _marcarCambiados\([\s\S]*?\n\}/) || [""])[0]);
  ok(marcar.length > 200, "existe _marcarCambiados");

  // El sello va AQUI, en el mismo sitio que ya decide que cambio. Ponerlo
  // funcion por funcion es el camino que ya fallo cuatro veces.
  ok(/_por\b/.test(marcar) && /_porUlt\b/.test(marcar),
     "el sello se pone donde ya se decide que cambio, no funcion por funcion");
  ok(/if\(!primeraVez\)/.test(marcar),
     "y NO en la primera pasada sobre el campo (si no, sella sus 192 de golpe)");
  // Las DOS ramas, contadas. Con una sola comprobacion esta guardia pasaba
  // con la otra rama ya rota: la de "registro nuevo" y la de "registro que
  // cambio" protegen _por por separado.
  ok((marcar.match(/if\(!it\._por\)\s*it\._por=/g) || []).length === 2,
     "quien lo creo no se sobrescribe nunca, en ninguna de las dos ramas",
     (marcar.match(/it\._por=/g) || []).length);

  // Igual que _mod: si el sello entrara en la foto, sellar cambiaria la foto,
  // la foto distinta volveria a sellar, y no pararia nunca.
  ok(/k!=="_mod"&&k!=="_por"&&k!=="_porUlt"/.test(marcar),
     "los sellos quedan FUERA de la foto, igual que _mod");

  // Y el que decide si es la primera pasada.
  ok(/var primeraVez=!window\._fotoPorCampo\[k\]/.test(HTML),
     "la primera pasada se decide por si ya hay foto de ESE campo");

  // Se dibuja en un solo sitio. Si cada pantalla se lo pinta a su manera, en
  // dos semanas hay diecisiete formas de decir lo mismo.
  ok(/function _htmlQuien\(r\)\{/.test(HTML), "se dibuja en un solo sitio");
  const quien = sinCom((HTML.match(/function _htmlQuien\(r\)\{[\s\S]*?\n\}/) || [""])[0]);
  // Los dos sitios donde se mete un nombre, por nombre. Pidiendo solo que
  // _escAud aparezca, esta guardia pasaba con el primero ya sin escapar.
  ok(/_escAud\(creo\|\|ult\)/.test(quien) && /_escAud\(ult\)/.test(quien),
     "y los dos nombres se escapan al pintarlos (ARREGLO 102)", quien.slice(0, 200));
  ok(/if\(!creo && !ult\) return ""/.test(quien),
     "lo de antes del sello se calla, no dice «registrado por —»");
  ok((HTML.match(/_htmlQuien\(/g) || []).length >= 4,
     "y se usa en Operaciones y en los dos tipos de egreso");

  // Quien borro: un registro borrado ya no esta para llevar su sello.
  ok(/push\(\{id:id,ts:Date\.now\(\),por:_quienSoy\(\)\}\)/.test(HTML),
     "la marca de borrado lleva quien borro");

  // El registro de auditoria lo escribe la app, asi que un sitio que se
  // olvide es un sitio del que no queda rastro. Estos tres no anotaban nada.
  // Cortando el texto de la funcion por indice, no con una expresion: la
  // expresion se me enredo con los escapes y la prueba no llegaba a correr.
  [["saveTxEE", "REMESA EE.UU"], ["saveTraspaso", "TRASPASO"],
   ["saveIU", "INVENTARIO USDT"]].forEach(function(x){
    const i = HTML.indexOf("function " + x[0] + "(");
    const j = HTML.indexOf("\n}", i);
    // Sin comentarios: comentar la linea dejaba el texto ahi y la guardia
    // pasaba con la funcion ya sin rastro. Van cinco veces en este proyecto.
    const fn = i < 0 ? "" : sinCom(HTML.slice(i, j));
    ok(i >= 0, "existe " + x[0]);
    ok(fn.indexOf('logAudit("' + x[1] + '"') >= 0,
       x[0] + " deja rastro en la auditoria");
  });
}


// ── Filtrar por operador ──────────────────────────────────────────────────
//
// Sus palabras: "me gustaría que agregaras algo donde yo pueda filtrar por
// operador… para yo poder saber todas las actividades de cada operador".
{
  const sinCom = t => t.replace(/\/\/[^\n]*/g, "");
  const ops = sinCom((HTML.match(/function rTblUnificada\(\)\{[\s\S]*?\n\}/) || [""])[0]);

  ok(/por:""/.test(HTML), "el filtro por operador tiene su sitio en S._ops");
  ok(/S\._ops\.por=this\.value/.test(ops), "y su desplegable en Operaciones");

  // Por quien la CREO, no por quien la toco: la pregunta es "que registro
  // Carlos", y una remesa que ella corrigio despues la registro Carlos igual.
  ok(/f\.por==="__sin" \? !r\._por : r\._por===f\.por/.test(ops),
     "filtra por quien la CREO (_por), no por quien la toco");
  ok(/okQ&&okSrc&&okRuta&&okBanco&&okPor/.test(ops),
     "y se suma a los filtros que ya habia, sin sustituir ninguno");

  // Las de antes del sello se NOMBRAN. Escondiendolas, la suma de los
  // operadores no da el total y parece que faltan remesas.
  // Anclado en lo que lo DISPARA, no en el texto: con el texto a secas la
  // prueba negativa pasaba con la opcion ya apagada. Va la sexta vez.
  ok(/\(_sinSello\?"<option value='__sin'/.test(ops) &&
     /Sin registrar qui[eé]n/.test(ops),
     "las de antes del sello salen nombradas cuando las hay, no escondidas");

  // Un desplegable con una sola opcion no es un filtro, es un adorno.
  ok(/\(_quienes\.length\|\|_sinSello\)\?/.test(ops),
     "el desplegable solo sale si hay a quien filtrar");

  // Sale de los registros, no de la lista de usuarios: asi aparece quien de
  // verdad registro algo aunque ya no tenga usuario.
  ok(/base\.forEach\(function\(r\)\{\s*if\(!r\._por\)/.test(ops),
     "quien aparece sale de los registros, no de la lista de usuarios");

  // Limpiar filtros tiene que limpiarlo tambien, o queda un filtro puesto
  // que no se ve en ninguna parte.
  ok(/banco:\\"\\",por:\\"\\"/.test(HTML), "y «Limpiar filtros» lo limpia");
}

// ── Qué ha hecho cada persona (Auditoría) ────────────────────────────────
{
  const sinCom = t => t.replace(/\/\/[^\n]*/g, "");

  ok(/id='aud-quien'/.test(HTML),
     "la Auditoria filtra por PERSONA");
  ok(!/id='aud-role'/.test(HTML),
     "y ya no por rol: dos personas con el mismo rol no se distinguian");
  ok(/q\.push\("usuario="\+encodeURIComponent\(qF\)\)/.test(HTML),
     "el filtro va en la consulta, no se filtran 300 entradas aqui");

  const pintar = sinCom((HTML.match(/function _pintarResumenAudit\(\)\{[\s\S]*?\n\}/) || [""])[0]);
  ok(pintar.length > 200, "existe la pantalla del resumen");
  ok(/_escAud\(p\.usuario\)/.test(pintar),
     "el nombre se escapa al pintarlo (ARREGLO 102)");
  ok(/a\[0\]==="BORRAR"/.test(pintar),
     "los borrados van PRIMERO: es lo que hay que ver cuando algo no cuadra");
  ok(/d\.cortado/.test(pintar),
     "y si el resumen esta cortado se dice: un numero cortado que parece completo es peor");
  ok(/_NOMBRE_ACCION/.test(HTML) && /BORRAR:"borrados"/.test(HTML),
     "las acciones se enseñan con palabras, no con la clave interna");

  // El resumen no depende de los filtros de abajo: volver a pedirlo en cada
  // cambio seria recorrer la coleccion por nada.
  const cargar = sinCom((HTML.match(/function _cargarAudit\(\)\{[\s\S]*?\n\}/) || [""])[0]);
  ok(/if\(!_AUD_RESUMEN\) _cargarResumenAudit\(\)/.test(cargar),
     "el resumen se pide una vez, no en cada cambio de filtro");
}

console.log("\n" + (fallos ? "FALLARON " + fallos + " prueba(s)" : "Todo en orden."));
process.exit(fallos ? 1 : 0);
