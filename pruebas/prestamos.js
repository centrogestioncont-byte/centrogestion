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
const CONSTANTES = ["_APROX_LS", "_COLCHON_DEF", "_SIN_APROX", "_UMBRAL_BS_DEF", "_SIN_BS", "_UMBRAL_BRL_DEF", "_SIN_BRL", "_RUTA_DE", "CG_BASE", "_PODA_CATS", "_MOTIVOS_AJUSTE", "_MERCADO", "_AVISO_UMBRAL", "_MERCADO_MONTO_DEF", "_VIZ", "_INM_AVISO_DIAS", "_DIAS_NORMAL_BS",
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
                    "_misTasasPublicadas",
                    "_equilibrio", "sueloQueManda",
                    // ARREGLO 128 - la tasa recomendada y la aproximada de hoy
                    "_aproxTodas", "_tasaAprox", "_guardarTasaAprox", "_diasDeRef",
                    "_colchon", "_tasasRecomendadas", "_tasaCorta", "_tasasConLoMio",
                    "_tsUltimaOpUSDT", "_aproxManda", "_toggleProbar", "_volverAMiTasa",
                    // ARREGLO 130
                    "_ultimaOpUSDT", "_origenLado",
                    // ARREGLO 132
                    "_inventarioBs", "_umbralBsReales", "_colchonIdaAhora", "_tasasSinBs",
                    // ARREGLO 133
                    "_inventarioBrl", "_umbralBrlReales", "_colchonVueltaAhora", "_tasasSinBrl",
                    "_saldoCtaUsdt", "_otrasCtasUsdt", "_cubrirUsdtParaVenta", "_setAprox", "publicarRecomendadas",
                    "_campoAprox", "_htmlPublicaHoy", "guardarColchones", "_htmlCalceCuerpo", "_botonTasaUsdt",
                    "_calceK", "_calceGan", "_calceVuelta", "_calceIda", "_cg", "_cgSet", "_cgFraccion",
                    "_htmlPalancaVenta", "_permutaSugerida", "_prConPermuta", "_htmlPermutaFuera", "_usarPermutaSugerida", "txMetodo", "esCalceDirecto", "esRutaCalce", "getAutoRates", "_cgBase", "_cgGanUsdt", "_htmlComparaTasa", "_htmlPiePub", "_htmlDifPub", "_motivoPub", "_htmlCalceRes", "_htmlCalceCuerpo", "_cgModo", "_cgFuente",
                    "margenSobreSuelo", "_calcTasas", "_misTasasPublicadas", "_fpTasa",
                    "avisoTasa", "_umbralAviso", "_refSuelo", "_sueloDeFecha", "guardarTasaCalcHoy",
                    "_cgSoltar", "_montoMercado",
                    "_inmResumen", "_inmCuotasDe", "_inmDe", "_inmDias", "_avisosInmueble",
                    "_motivoPub",
                    "_apuntarAvisoParaPush", "_htmlAvisosTelefono", "_pushSoportado",
                    "_cgPublicar", "_pieFlyer", "_refrescarTasasTodo",
                    "_origenTasaCotiza", "_rotuloPublicada", "_getTasaClienteBRL",
                    "_getTasaVueltaVESaBRL", "_convOtraTasa", "_convVolverPublicada",
                    "_convSetOtra", "_refrescarConversor", "_htmlTasaCotiza", "_reconvertirBCV", "_htmlFilasTasas",
                    "_htmlAvisoCalce",
                    "_saldoConProblema", "_notaSaldoCuenta", "_cuentaDeFoto",
                    "_deudaTarjeta", "_cuentasEnNegativo", "_ruta",
                    "_cgTasaResultado", "_htmlPublicarRes", "_cgPublicarRes",
                    "_cgPublicarPar", "_cgSoltarTrasPublicar", "_cgModo", "_cgFuente",
                    "_msjCliente", "_comaCab",
                    "_refrescarAvisosTasa", "_htmlFilasTasas", "_cgRedibujar",
                    "esRutaCalce", "esCalceDirecto",
                    "_loteYaEnApertura", "_fiatDeLote", "_deltaDeLote",
                    "f2n", "f0", "f4",
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
                    "_repartoFIFO", "getTasaVentaPonderada", "_bsPorReal", "_htmlDeDondeSalen",
                    "_claveLoteVieja", "_indiceLotesComidos", "_comieronEsteLote", "_filaComieron", "toggleComieron",
                    "_revivirLote", "_loteDelEspejo", "_restaurarVentasFIFO", "_restaurarComprasFIFO",
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
                    "_marcarBorradoMerge", "_estaBorradoMerge", "_levantarBorradoMerge",
                    "_unirMarcasBorrado", "_tsMarca", "_revivirLote", "_huecoDeLote",
                    "_origenBsRemesa", "_loteEsDeRemesa", "_autoMetodoTx", "_ponerMetodoTx",
                    "_faltanBs", "_diaNormalBs", "_umbralFaltanBs", "_p2pBolivaresDelMes",
                    "_repartoFIFO", "esRutaCalce",
                    "sincronizarFIFOconCuentas", "normalizarInventarioFIFO",
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
// ARREGLO 106: y los reales SOLO con el metodo de calce, nunca sin el.
S.inventarioUsdt = [];
var _lcCalce = F.crearLoteRecibido("BRL", 1000, 193.5958, "pagbank", "12/09", "c1", "", true);
ok(_lcCalce !== null, "en calce directo los reales SI crean lote");
ok(_lcCalce && _lcCalce.permuta === true && _lcCalce.plataforma === "Permuta",
   "marcado como permuta, para que no lo mire la tasa de referencia");
ok(F.crearLoteRecibido("USD", 100, 100, "zelle", "12/09", "c2", "", true) === null,
   "y ni en calce se abre a otra moneda");
S.inventarioUsdt = [];
ok(F._loteAlCobrar({ monto:500, moneda:"BRL", usdtValor:98, refUid:"z" }, 500, "pagbank") === null,
   "y al cobrar un pendiente en reales, tampoco");
ok(S.inventarioUsdt.length === 0, "sigue sin quedar nada");
S.inventarioUsdt = [];
// Y que saveTx solo lo llame con bolivares — o en CALCE DIRECTO, donde los
// reales que entran tampoco se convierten en USDT (ARREGLO 106). Fuera del
// calce la regla del 12/09 sigue intacta: un lote de reales de una remesa
// normal es una venta que nunca ocurrio.
ok(/if\(\(ruta\.orig==="VES" \|\| _calceTx\) && !f\.pendiente\)/.test(HTML),
   "saveTx crea el lote con bolivares, o con reales si es calce directo");
ok(/crearLoteRecibido\(ruta\.orig, res\.am, res\.uc, f\.cuentaBanco\|\|"", ds\(f\.date\), nuevaRemesa\._uid, f\.hora, _calceTx\)/.test(HTML),
   "y le pasa el metodo, que es lo unico que abre la puerta a los reales");
// La puerta se abre SOLO para BRL en calce: ni USD ni ninguna otra.
ok(/if\(moneda!=="VES" && !\(calce && moneda==="BRL"\)\) return null;/.test(HTML),
   "crearLoteRecibido sigue cerrado a todo lo demas");

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
// ARREGLO 125: getTasaVentaPonderada ya no recorre los lotes, delega en
// _repartoFIFO. Vale igual mientras sea ESE el que pregunta por la tasa
// efectiva, así que _repartoFIFO entra en la misma lista y la delegación
// cuenta. Lo que no puede pasar es que ninguno de los dos la use.
["getLastTasaCompra", "getLastTasaVenta", "getTasaCompraPonderada",
 "getTasaVentaPonderada", "simularConsumoFIFO", "_repartoFIFO"].forEach(function (fn) {
  const i = HTML.indexOf("function " + fn + "(");
  let prof = 0, k = HTML.indexOf("{", i), fin = k;
  for (; fin < HTML.length; fin++) {
    if (HTML[fin] === "{") prof++;
    else if (HTML[fin] === "}" && --prof === 0) break;
  }
  const cuerpo = HTML.slice(i, fin + 1);
  ok(/_tasaEfectivaLote\(/.test(cuerpo) || /_repartoFIFO\(/.test(cuerpo),
     fn + " pregunta por la tasa efectiva (o delega en quien lo hace)");
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
// ARREGLO 131: el rotulo pasa de "La fijaste tu" a "La escribiste tu", porque
// lo escrito ya no manda para siempre. El boton de soltarla se queda: es la
// unica forma de volver a lo automatico sin registrar una operacion.
ok(/Sale sola de tu/.test(HTML) && /La escribiste tú/.test(HTML) && /Que salga sola/.test(HTML),
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
// ARREGLO 115: la segunda clave era "ntfyCanal", que ahora esta prohibida.
// Una prueba que fusiona una clave que la app borra al llegar no prueba lo
// que dice probar: se cambia por otra viva.
const _resto = fusionarConfig(
  {moraMultaPct:2, pct_sueldo:"a"}, {moraMultaPct:T2, pct_sueldo:T1},
  {moraMultaPct:5, pct_sueldo:"b"}, {moraMultaPct:T1, pct_sueldo:T2});
ok(_resto.moraMultaPct===2 && _resto.pct_sueldo==="b",
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
  // ARREGLO 89: ahora hay varios avisos ahi arriba —choques, rechazo,
  // apertura, saldo negativo, mes sin cerrar y la tasa bajo el suelo
  // (ARREGLO 112)—, todos fuera de la zona que hace scroll. El margen es un
  // presupuesto: admite que entre otro aviso, pero no que la lista crezca
  // sin control ni que alguno se caiga dentro del scroll.
  ok(/_htmlAvisoPisado\(\)\+[\s\S]{0,260}?"<div class='navbar3'>"/.test(HTML.replace(/\/\/[^\n]*\n/g, "\n")),
   "el aviso va arriba del panel, fuera del scroll");
  ok(/_htmlAvisoMesSinCerrar\(\)\+[\s\S]{0,260}?"<div class='navbar3'>"/.test(HTML.replace(/\/\/[^\n]*\n/g, "\n")),
     "y el aviso del mes sin cerrar, tambien");
  // ARREGLO 112: y el de la tasa por debajo del suelo, que es el unico de los
  // nuevos que cuesta dinero en CADA remesa que registre.
  ok(/_htmlAvisoTasaFijo\(\)\+[\s\S]{0,260}?"<div class='navbar3'>"/.test(HTML.replace(/\/\/[^\n]*\n/g, "\n")),
     "y el de la tasa bajo el suelo, tambien");

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
  // Y los --ec-*: el estado de cuenta que ella le manda al cliente por
  // WhatsApp y el cliente imprime. Cuarta vez con la misma forma.
  // Y los --per-* (ARREGLO 142): la cabecera 🏢 TOTAL EMPRESA de Balance de
  // Cuentas va sobre --fondo-osc, que es siempre oscura elija el tema que
  // elija. Darles version oscura es exactamente el fallo que se arreglo —
  // medido, el numero salia a 1,04 de contraste en Suave. Quinta vez.
  const sinOscuro = [...enClaro].filter(function(k){
    return !enOsc.has(k) && !/^--(radius|shadow|ent-|fly-|inf-|ec-|per-)/.test(k);
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

  // ── El estado de cuenta del cliente (--ec-*) ──────────────────────────
  //
  // Cuarta vez con la misma forma: sale de la app HACIA FUERA -ella se lo
  // manda al cliente por WhatsApp y el cliente lo imprime-, asi que sus
  // colores son suyos. El tema es del aparato de quien lo genera; esto ya
  // no esta en ese aparato.
  {
    ok(/--ec-papel:\s*#ffffff/.test(HTML) && /--ec-tinta:\s*#111111/.test(HTML),
       "el estado de cuenta tiene sus propios colores, declarados en :root");
    const pap3 = (HTML.match(/html\[data-tema="papel"\]\{[\s\S]*?\n\}/) || [""])[0];
    const pisEc = [];
    [["suave", osc], ["papel", pap3]].forEach(function(par){
      (par[1].match(/--ec-[\w-]+\s*:/g) || []).forEach(function(d){
        pisEc.push(par[0] + " " + d.replace(/\s*:$/, ""));
      });
    });
    ok(pisEc.length === 0,
       "ningun tema lo repinta: sale igual desde la PC y desde el telefono",
       pisEc.slice(0, 6).join(", "));
    const fueraEc = [];
    (sacarFuncion("_htmlEstadoCuenta").match(/var\(--[\w-]+\)/g) || []).forEach(function(v){
      if (!/^var\(--ec-/.test(v)) fueraEc.push(v);
    });
    ok(fueraEc.length === 0,
       "y solo usa sus propios colores (--ec-*)", fueraEc.slice(0, 6).join(", "));
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
// ── ARREGLO 107 · poner el banco NO mueve el saldo ──────────────────────
//
// Sus palabras: "pense que era solo colocar el nombre a esos lotes viejos
// pero resulta que me altero todos los saldos de la cuenta PAGBANK y banco
// vzla". Medido en su export: ocho lotes de JUNIO, tres meses antes de su
// apertura del 11/09, le movieron PAGBANK de 1.077,00 a −1.213,00 y el Banco
// de Venezuela de 20.904,48 a 620.905,48. Ese dinero ya estaba dentro de la
// foto de saldos de la apertura: se conto dos veces.
{
  const pon = sinComentarios(sacarFuncion("_binPonerBanco"));
  ok(!/c\.saldo\s*=/.test(pon), "poner el banco NO toca ningun saldo");
  ok(/l\._mod=Date\.now\(\)/.test(pon), "y el lote queda marcado para la sincronizacion");
  ok(/permisoEdicion\(\)/.test(pon), "con permiso de guardar");

  // El movimiento existe, pero aparte y diciendo lo que va a pasar.
  const mov = sinComentarios(sacarFuncion("_binMoverSaldoLote"));
  ok(/c\.saldo=despues;/.test(mov), "mover el saldo es otra funcion");
  ok(/if\(!confirm\(/.test(mov) && /quedaría/.test(mov),
     "que pregunta antes, con el antes y el despues");
  ok(/if\(_loteYaEnApertura\(l\)\)\{/.test(mov),
     "y se niega en un lote anterior a la apertura");
  ok(/c\._mod=Date\.now\(\)/.test(mov),
     "la cuenta queda marcada, o la fusion la pisa (ARREGLO 22)");
  ok(/logAudit\("LOTE_BANCO_SALDO"/.test(mov), "y queda en la auditoria");

  // El desplegable ya no HACE nada: elige. Lo que se haga se decide debajo.
  ok(/onchange='_binElegirBanco\(/.test(HTML) && !/onchange='_binPonerBanco\(/.test(HTML),
     "el desplegable solo elige, no aplica");
  // Y la pantalla lo dice, que es lo que leyo al reves.
  ok(/Elegir el banco solo pone la etiqueta: no mueve ningún saldo/.test(HTML),
     "la pantalla dice que elegir el banco no mueve nada");

  // La regla que no falla: antes de la apertura, ese dinero ya esta contado.
  S.config = S.config || {}; S.config.aperturaFecha = "2026-09-11";
  ok(F._loteYaEnApertura({fecha:"06/02", fechaIso:"2026-06-02"}) === true,
     "un lote de junio esta dentro de la apertura del 11/09");
  ok(F._loteYaEnApertura({fecha:"09/20", fechaIso:"2026-09-20"}) === false,
     "y uno de despues, no");
  // Sin apertura fijada no se puede afirmar nada, asi que no se bloquea.
  S.config.aperturaFecha = "";
  ok(F._loteYaEnApertura({fecha:"06/02", fechaIso:"2026-06-02"}) === false,
     "sin apertura fijada no se da por contado");
  S.config.aperturaFecha = "2026-09-11";
  // Lo que movio cada lote sale de un solo sitio.
  ok(F._fiatDeLote({tipo:"compra", montOrigen:1047}) === 1047 &&
     F._fiatDeLote({tipo:"venta", bs:200000}) === 200000,
     "el monto fiat del lote sale de donde toca segun el tipo");
  ok(F._deltaDeLote({tipo:"compra", montOrigen:1047}) === -1047 &&
     F._deltaDeLote({tipo:"venta", bs:200000}) === 200000,
     "la compra resta de la cuenta y la venta suma");
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
  ok(/_levantarBorradoMerge\("cierresMes"/.test(ej),
     "y al volver a cerrar, la marca se LEVANTA (ARREGLO 137: quitarla a secas la devolvia el servidor)");
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
F._levantarBorradoMerge("cierresMes", "2026-09");
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
  // ── ARREGLO 141 · esta guardia REVIERTE lo que pedia, y lo revierte ella
  //
  // Desde el ARREGLO 48/60/94/99/100 exigia que el desglose se dibujara SIN
  // desplegar nada, porque "es lo que convierte un numero en algo que se puede
  // perseguir". Sigue siendo verdad y por eso no se borra; lo que cambia es
  // donde empieza. Sus palabras del 15/10: "dalance de cuenta ocupa mucho la
  // pnatalla". Medido, la pestaña eran 2.053 px —2,9 pantallas de su
  // telefono— y esta lista 246 de ellos.
  //
  // Lo que se exige ahora son las tres mitades, y faltando cualquiera vuelve
  // el fallo que las cinco versiones anteriores evitaban:
  //   1. las filas siguen dibujandose (no se borraron);
  //   2. la cifra de la que cuelgan las ABRE, y lo dice;
  //   3. abrirlas no llama a R() (ARREGLO 32).
  // Lo que NUNCA se pliega son los avisos, y eso lo fija la guardia de abajo.
  ok(/resumenSuyo\+/.test(cuerpo) && /_filas\.map\(function/.test(HTML),
     "el desglose sigue dibujandose: es lo que convierte el numero en algo que perseguir");
  ok(/id='conc-filas'/.test(HTML) && /_verFilasConc\(\)/.test(HTML) &&
     /"de dónde sale ▾"/.test(HTML),
     "y la cifra de la que cuelga lo abre, diciendolo");
  const vfc = sacarFuncion("_verFilasConc").replace(/\/\/[^\n]*/g, "");
  ok(!/\bR\(\)/.test(vfc) && /getElementById\("conc-filas"\)/.test(vfc),
     "abrirlo no llama a R() (ARREGLO 32)");
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


// ── ARREGLO 110 · fuera la competencia, y su tasa publicada se queda ───────
// El ARREGLO 74 pedia apuntar a mano lo que cobraban cuatro sitios. Sus
// palabras del 11/10: "yo quiero que me quites esos botones porque ya no los
// estoy usando - eso asi ya no me es funcional". Se fueron las filas, los
// campos y el recuadro del puesto; lo apuntado NO se borra.
{
  // Nada de la competencia puede volver a dibujarse. Si alguien la reintroduce
  // sin los avisos, esto falla.
  const muertas = ["_competidores","_compDelDia","_setComp","_posicionMercado",
                   "_htmlCompResumen","_renombrarComp","_COMPETIDORES_POR_OMISION"];
  muertas.forEach(function(nom){
    ok(HTML.indexOf(nom) < 0, "no queda nada de " + nom + " en el archivo");
  });
  // Y el contenedor del recuadro tampoco: era lo que _setComp refrescaba.
  ok(HTML.indexOf("comp-resumen") < 0, "ni el recuadro del puesto");
  // El suelo sigue dibujandose, ahora desde su fila (ARREGLO 111: la tarjeta
  // _htmlMercadoHoy se fue con la calculadora vieja). Anclado al marcado, que
  // existe una vez sola: un comentario puede repetir el rotulo (ARREGLO 100).
  const tarjeta = sacarFuncion("_htmlFilasTasas");
  ok(/_htmlSuelo\(\)/.test(tarjeta), "el suelo se sigue dibujando");
  ok(/id='mercado-suelo'/.test(tarjeta),
     "y conserva el id por el que _refrescarSuelo lo rehace sin R()");

  // Lo apuntado en septiembre SIGUE viajando. Quitar la pantalla no puede
  // borrarle datos: si histComp se cae de estas dos listas, el remoto lo
  // reemplaza entero y se pierde lo que tenga el otro aparato.
  ok(/_MERGE_HISTORIAL = \[[^\]]*"histComp"/.test(HTML),
     "histComp se sigue uniendo por fecha entre los dos aparatos");
  ok(/DATA_KEYS = \[[\s\S]{0,800}"histComp"/.test(HTML),
     "y sigue en DATA_KEYS: lo apuntado no se borra al quitar la pantalla");

  // Lo UNICO que se rescato de ahi, porque lo lee el suelo: su tasa
  // publicada. Las dos direcciones van en la MISMA unidad -bolivares por
  // real- y significan lo contrario: en la ida ella ENTREGA bolivares (mas es
  // mejor para el cliente) y en la vuelta ENTREGA reales (menos es mejor).
  // Invertir una de las dos le daria el puesto al reves en los flyers.
  S.config = {tasasDia:{tdia_brl:172.5, tdia_ves_brl:220}};
  const pub = F._misTasasPublicadas();
  ok(pub.ida === 172.5 && pub.vuelta === 220,
     "su tasa publicada sale de tasasDia, ida y vuelta en bolivares por real",
     pub.ida + " / " + pub.vuelta);
  // Sin publicar no se le inventa una.
  S.config.tasasDia = {};
  const vacia = F._misTasasPublicadas();
  ok(vacia.ida === null && vacia.vuelta === null,
     "si no ha publicado hoy no se inventa una tasa");
  S.config = {};
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
  // ARREGLO 110: la cuenta vive en sueloQueManda() y _htmlSuelo() solo dibuja.
  // La calculadora de abajo lee el mismo numero de ahi.
  var sManda=sacarFuncion("sueloQueManda");
  ok(/eqMixto=_equilibrio\(miC,mv\)/.test(sManda) &&
     /eqMixto=_equilibrio\(mc,miV\)/.test(sManda),
     "con media lectura se completa el lado que falta con lo suyo, en las dos direcciones");
  // Y SUSTITUYE al suyo. Dos suelos parecidos para la misma pregunta es lo que
  // ya hizo que dejara de fiarse de los dos (34,27 arriba y 34,28 abajo).
  ok(/if\(eqMixto\)\{[\s\S]{0,400}\}else if\(eqMio\)\{/.test(sManda),
     "y ocupa el sitio del suyo, no se pone al lado");
  // Sin ninguno de los dos lados no hay mixto: eso seria inventar.
  ok(/if\(!eqMerc\)\{/.test(sManda),
     "con lectura completa del mercado no se calcula ningún mixto");
  // El rotulo tiene que decir de donde sale cada mitad. Un tercer numero sin
  // explicar como se hizo es lo que hace que dejen de creerse los tres.
  ok(/pieMixto="tu compra de "/.test(sManda) && /con la venta de hoy/.test(sManda),
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
  ok(/for\(var ci=0;ci<cands\.length;ci\+\+\) if\(!manda\|\|cands\[ci\]\.v<manda\.v\) manda=cands\[ci\];/.test(sManda) &&
     /var cands=Q\.cands, manda=Q\.manda, base=Q\.v;/.test(suelo),
     "el \"te queda +X%\" se mide contra el suelo mas bajo de los que se enseñan");
  // Y los candidatos son exactamente los que se dibujan: si uno se enseña y no
  // entra en la comparacion, el % puede salir de un numero que no esta arriba.
  // Por eso se dibuja RECORRIENDO la lista de candidatos, en un solo sitio.
  ok((sManda.match(/cands\.push\(/g)||[]).length === 3 &&
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
  ok(/f4\(n\) : f2\(n\)/.test(sacarFuncion("_fpTasa")) &&
     /var fp=_fpTasa;/.test(sacarFuncion("_htmlSuelo")),
     "la tasa de compra de USDT se enseña con sus cuatro decimales");
  // ── ARREGLO 110: el suelo se calcula en UN sitio ───────────────────
  // _htmlSuelo() dibuja; la cuenta la hace sueloQueManda(), y de ahi la lee
  // tambien la calculadora. Si _htmlSuelo volviera a calcular por su cuenta,
  // la tarjeta y la calculadora podrian decir dos suelos distintos — que es el
  // 34,27 arriba y 34,28 abajo de Por cobrar.
  ok(/var Q=sueloQueManda\(\);/.test(suelo) &&
     !/_equilibrio\(/.test(suelo) &&
     !/tasaDeReferencia\(/.test(suelo),
     "_htmlSuelo no recalcula el suelo: lo lee de sueloQueManda()");
  ok(/tasaDeReferencia\("BRL"\)/.test(sManda) && /tasaDeReferencia\("VES"\)/.test(sManda),
     "y sueloQueManda sale de tasaDeReferencia, la misma que valora su dinero");

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
  //           − sueldoPendiente + ajustes + tasas + sinExplicar
  //   ⇒ salto − enPapel = −traspPers − intAp − sueldoPendiente
  //                       + ajustes + tasas + sinExplicar
  //
  // Si alguien quita un termino de un lado sin quitarlo del otro, la tarjeta
  // deja de sumarse a mano — y una tarjeta que no se puede sumar a mano es
  // peor que no dar el desglose (es lo que ya costo el 34,27 contra 34,28).
  // ── ARREGLO 141 · la guardia que faltaba ────────────────────────────
  // Las de arriba exigen las filas que HAY. Ninguna cazaba una fila que
  // FALTARA, y por eso el sueldo estuvo descuadrando la lista sin que nadie lo
  // viera: el texto decia lo que debia decir.
  //
  // Esta compara los dos lados de la identidad: cada termino que
  // conciliacionCapital() le resta a `deberias` tiene que aparecer en el bloque
  // de _filas, salvo los cuatro que ya viven dentro de _enPapel. El dia que
  // alguien añada un termino nuevo, falla hasta que tenga su fila.
  (function(){
    const cc = sacarFuncion("conciliacionCapital");
    const m = cc.match(/var deberias=r2v\(([^;]+)\);/);
    ok(!!m, "conciliacionCapital sigue teniendo su expresion de 'deberias'");
    if(!m) return;
    // los nombres que participan, sin los que ya cuenta _enPapel
    const dentroDePapel = ["apertura","bruta","egEmpresa","egPersonalEmpresa","socios"];
    const terminos = (m[1].match(/[A-Za-z_][A-Za-z0-9_.]*/g)||[])
      .filter(function(t){ return t.indexOf(".")<0 || /^real\./.test(t); })
      .map(function(t){ return t.replace(/\.total$/,"").replace(/^real\./,""); })
      .filter(function(t,i,a){ return a.indexOf(t)===i && dentroDePapel.indexOf(t)<0 && t!=="r2v"; });
    terminos.forEach(function(t){
      ok(filas.indexOf(t)>=0,
         "el desglose tiene fila para '"+t+"', que 'deberias' resta (si no, la lista no suma)");
    });
  })();

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
   // ARREGLO 141: esta fila FALTABA y la lista no sumaba — con su export, por
   // 91,67 exactos, que es su sueldo sin apartar.
   ["-co.real.sueldoPendiente","tu sueldo todavia sin apartar"],
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
  ok(/isNeg=_saldoConProblema\(c\)/.test(cajas),
     "y el ⚠️ lo decide _saldoConProblema (ARREGLO 119), no un saldo<0 propio");
  // Pero una deuda tampoco puede salir pintada como dinero (ARREGLO 95).
  ok(/\(esTj&&deuda>0\)\?"var\(--avi\)"/.test(cajas),
     "una deuda no se pinta del mismo verde que un saldo a favor");
  ok(/💳 debes/.test(cajas),
     "y se dice con palabras que eso es lo que debe");

  // 3. El informe del Cierre. Este ademas sale HACIA FUERA —lo ve Julio y lo ve
  //    el contador— asi que una tarjeta marcada "revisar" todos los meses es
  //    peor aqui que en pantalla.
  const inf = sinComentarios(sacarFuncion("rInformeCierre"));
  ok(/var isNeg=_saldoConProblema\(c\)/.test(inf),
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
  // ARREGLO 137: el `ts` ya no es Date.now() a secas — se fuerza por encima de
  // lo que hubiera, para que enterrar y levantar en el mismo milisegundo no
  // deje un empate. Lo que esta guardia protege sigue siendo el sello.
  ok(/push\(\{id:id,ts:Math\.max\(Date\.now\(\),previa\+1\),por:_quienSoy\(\)\}\)/.test(HTML),
     "la marca de borrado lleva quien borro");
  ok(/push\(\{id:id,ts:0,revive:Date\.now\(\),por:_quienSoy\(\)\}\)/.test(HTML),
     "y el levantamiento tambien, que es un cambio igual de suyo");

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


// ── Los pagos de un préstamo saldado ─────────────────────────────────────
//
// Sus palabras: "no hay forma de revisar los pagos ya realizados de cada
// cliente y que se ordenen según el tiempo que pagaron… tampoco sale la
// información completa, la mora, en qué moneda, cuenta, cuánto pagó".
//
// Nada hubo que empezar a guardarlo: ya estaba todo. Lo que faltaba era
// enseñarlo.
{
  const sinCom = t => t.replace(/\/\/[^\n]*/g, "");
  const pr = sinCom((HTML.match(/function rPrestamos\(\)\{[\s\S]*?\n\}/) || [""])[0]);

  // LA HORA NUNCA SE PERDIO: `fecha` es solo el dia, pero el id de cada pago
  // es Date.now(). Sin esto, los tres pagos que haga un cliente el mismo dia
  // salen en un orden cualquiera — que es justo lo que no podia revisar.
  ok(/function _tsDePago\(x\)\{/.test(pr), "la hora de un pago sale de su id");
  const ts = sinCom((pr.match(/function _tsDePago\(x\)\{[\s\S]*?\n  \}/) || [""])[0]);
  // El mismo rango que _tsDeUid: un id que no sea una hora creible se
  // descarta en vez de inventarse una fecha de 1970.
  ok(/1\.4e12/.test(ts) && /2\.5e12/.test(ts),
     "y un id que no es una hora creible se descarta, no se inventa");

  const pagos = sinCom((pr.match(/function _pagosDe\(p\)\{[\s\S]*?\n  \}/) || [""])[0]);
  ok(pagos.length > 100, "existe la lista de pagos");
  ok(/p\.abonos/.test(pagos) && /mora\|\|\{\}\)\.historial/.test(pagos),
     "junta los abonos y la MORA en una sola lista");
  ok(/return tb-ta/.test(pagos), "ordenada por cuando se pago, lo mas reciente arriba");

  const html = sinCom((pr.match(/function _htmlPagosDe\(p\)\{[\s\S]*?\n  \}/) || [""])[0]);
  // Anclado en lo que se PINTA, no en la variable: quitando solo la salida,
  // la asignacion seguia ahi y la guardia pasaba con la cuenta ya invisible.
  ok(/_escAud\(nombreCuentaEg\(x\.cuentaId\)\)/.test(html) &&
     /🏦 "\+cta\+"/.test(html),
     "dice a que CUENTA entro, escapada ahi mismo (ARREGLO 102) y pintada");
  // Igual: x.monedaPago y x.montoPago viven en dos asignaciones que la
  // sabotaje no tocaba. Lo que importa es que SALGA.
  ok(/f2\(cash\)\+" "\+_escAud\(monPago\)/.test(html),
     "y pinta cuanto pago de verdad, en que MONEDA");
  ok(/var distinta=/.test(html),
     "solo cuando pago en OTRA moneda: repetirlo en cada fila es ruido");
  ok(/_escAud\(/.test(html), "con el texto escapado (ARREGLO 102)");

  // La mora NO se suma al abonado. Sumarlas en un solo numero diria que la
  // deuda bajo mas de lo que bajo — es la razon por la que la mora vive en
  // p.mora y no en p.abonos, y aqui se rompe igual de facil.
  // Anclado en lo que lo DISPARA. Con el texto a secas, apagar el ternario
  // dejaba la frase ahi muerta y la guardia pasaba. Va la septima vez en
  // este proyecto: lo que se mide es el codigo, no el texto.
  ok(/Abonado a la deuda/.test(html) &&
     /if\(totMo>0\.009\) h\+=/.test(html) && /Mora cobrada aparte/.test(html),
     "la mora se totaliza APARTE cuando la hay, no sumada al abonado");
  const totales = html.slice(html.indexOf("var totAb"));
  ok(/totAb=\(p\.abonos\|\|\[\]\)/.test(totales.replace(/\s/g, "")),
     "el abonado sale solo de p.abonos");
  ok(!/totAb\s*\+\s*totMo/.test(totales), "y en ningun sitio se suman los dos");
}

// ── Los saldados: agrupados por cliente y ordenados por cuando pagaron ───
{
  const sinCom = t => t.replace(/\/\/[^\n]*/g, "");
  const pr = sinCom((HTML.match(/function rPrestamos\(\)\{[\s\S]*?\n\}/) || [""])[0]);

  ok(/var gruposPag=bkAgrupar\(pagados/.test(pr),
     "los saldados se agrupan por cliente, como los activos");
  // El grupo plegable de saldados se fue con los paneles: ahora los saldados
  // de un cliente salen dentro de SU ficha. Lo que sigue teniendo que
  // abrirse por su cuenta es la lista de pagos de cada prestamo.
  ok(/_prPagosOpen/.test(pr), "cada tarjeta abre sus pagos por su cuenta");
  ok(/gS\.items\.map\(cardPagado\)/.test(pr),
     "y los saldados del cliente salen en su ficha");
  // Antes se recorria la lista al reves, o sea por el orden en que estan
  // guardados: con dos clientes eso ya puede salir al reves de lo que paso.
  ok(!/pagados\.slice\(\)\.reverse\(\)/.test(pr),
     "ya no se ordenan por el orden en que estan guardados");
  ok(/function _ordenSaldado\(a,b\)\{/.test(pr), "hay un orden propio");
  ok(/g\.items\.sort\(_ordenSaldado\)/.test(pr), "y se aplica");
}

// ── UNA PANTALLA A LA VEZ ────────────────────────────────────────────────
//
// Sus palabras: "todo asi como en linea, con una lista desplegable hacia
// abajo, yo siento que asi es muy borroso trabajar en esa pestaña". Medido
// con 4 clientes sobre la version anterior: el primer cliente empezaba en el
// pixel 794 y entraban CERO sin bajar, detras de 4 paneles apilados.
//
// Lo que estas guardias impiden es volver a apilar: que el formulario, la
// ficha y la lista compartan pantalla otra vez.
{
  const sinCom = t => t.replace(/\/\/[^\n]*/g, "");
  const pr = sinCom((HTML.match(/function rPrestamos\(\)\{[\s\S]*?\n\}/) || [""])[0]);

  // El reparto esta en UN sitio y es excluyente: tres `return`, no tres
  // trozos concatenados. Si alguien los suma, vuelven los paneles apilados.
  ok(/if\(S\._prVista==="nuevo"\) return [^\n]*formHtml;/.test(pr),
     "el formulario se dibuja SOLO en su pantalla");
  ok(/if\(S\._prVista==="ficha"\) return [^\n]*fichaHtml\(\);/.test(pr),
     "la ficha del cliente, SOLO en la suya");
  ok(/\n  return modalCaptura\+entradaCaptura\+listaHtml\(\);/.test(pr),
     "y la lista es lo que queda");
  ok(!/_togglePrForm/.test(HTML) && !/_prFormAbierto/.test(HTML),
     "el plegado viejo del formulario ya no existe");
  // Los cuatro paneles que habia que abrir y cerrar se fueron: ni se
  // reconstruyen aqui ni quedan sus interruptores.
  ok(!/activosHtml/.test(HTML) && !/pagadosHtml/.test(HTML),
     "no quedan los paneles de activos y saldados");
  ok(!/S\._verPagados/.test(HTML) && !/_prCliOpen/.test(HTML),
     "ni los interruptores que los abrian");
  ok(!/_mostrarResumenClientes/.test(HTML),
     "ni el panel de estado de cuenta por cliente, que repetia la lista");

  // Se entra y se sale. Sin la vuelta, la ficha es un callejon.
  const cuerpoFicha = (pr.match(/function fichaHtml\(\)\{[\s\S]*?\n  \}/) || [""])[0];
  const cuerpoForm  = (pr.match(/var formHtml =[\s\S]*?\n    "<\/div>";/) || [""])[0];
  const cabFicha = (cuerpoFicha.match(/"<div class='pr-ftop'>"\+[\s\S]{0,260}/) || [""])[0];
  ok(/pr-vuelta' onclick='_prIrA\(\\"\\"\)/.test(cabFicha),
     "de la ficha se vuelve a la lista, desde su cabecera");
  ok(cuerpoForm.length > 100 && /_prIrA\(\\"\\"\)/.test(cuerpoForm),
     "y del formulario tambien");
  ok(/function _prIrA\(vista,clave\)\{/.test(HTML), "y la navegacion vive en un solo sitio");
  // Volver desde una ficha larga dejaba la lista a la altura de la ficha.
  ok(/if\(pn\) pn\.scrollTop=0;/.test(HTML),
     "y al cambiar de pantalla se sube arriba");
  // Guardado el prestamo se vuelve a la lista: quedarse en el formulario
  // vacio no dice si se guardo.
  const sp = sinCom((HTML.match(/function savePr\(\)\{[\s\S]*?\n\}/) || [""])[0]);
  ok(/S\._prVista="";/.test(sp), "y al guardar un prestamo se vuelve a la lista");
}

// ── El bloque rojo y los filtros leen la MISMA ventana ───────────────────
//
// Con dos numeros, un cliente salia en el bloque de arriba y no en el filtro
// "Esta semana", o al reves. Es la regla de siempre: el mismo dato no se
// calcula en dos sitios.
{
  const sinCom = t => t.replace(/\/\/[^\n]*/g, "");
  const pr = sinCom((HTML.match(/function rPrestamos\(\)\{[\s\S]*?\n\}/) || [""])[0]);

  ok(/var PR_DIAS_AGENDA=\d+;/.test(pr), "la ventana de cobranza es una constante");
  ok(!/setDate\(_limite\.getDate\(\)\+\d+\)/.test(pr),
     "y el limite de la agenda no lleva su propio numero");
  ok(/_limite\.setDate\(_limite\.getDate\(\)\+PR_DIAS_AGENDA\)/.test(pr),
     "la agenda la lee");
  ok(/g\.diasProx<=PR_DIAS_AGENDA\)\?"semana"/.test(pr), "y el filtro tambien");

  // El bloque rojo NO se pliega: lo urgente no se esconde nunca.
  ok(/function bloqueUrgente\(\)\{/.test(pr), "hay un bloque de lo urgente");
  const blo = sinCom((pr.match(/function bloqueUrgente\(\)\{[\s\S]*?\n  \}/) || [""])[0]);
  ok(blo.length > 100 && !/bkAbierto|_verUrg|display:none/.test(blo),
     "y no se pliega de ninguna manera");
  ok(/agendaItems\.forEach/.test(blo),
     "sale de agendaItems, el mismo calculo que ya habia");

  // Las cuotas vencidas se cuentan UNA vez. Antes la lista miraba solo
  // proximaCuotaPendiente() -una por prestamo- y decia "1 cuota vencida" de
  // un cliente que debia tres, mientras el bloque decia 3.
  ok(/if\(x\.cuota\.iso<hoyIso\) vencidas\+\+;/.test(pr),
     "las vencidas se cuentan cuota por cuota");
  ok(!/proximaCuotaPendiente\(p\);\s*\n\s*if\(cuG&&cuG\.iso&&cuG\.iso<td\(\)\) g\.vencidos\+\+/.test(pr),
     "y ya no hay una segunda cuenta por prestamo");
  // Ordenar antes de contarlas era ordenar por un cero.
  const iCuenta = pr.indexOf("g.vencidos=vencidas;");
  const iOrden  = pr.indexOf("gruposPr.sort(function(a,b){return (b.vencidos");
  ok(iCuenta >= 0 && iOrden >= 0 && iCuenta < iOrden,
     "y el orden va DESPUES de contarlas",
     "cuenta en " + iCuenta + ", orden en " + iOrden);
}

// ── Un grupo que se abre solo tiene que poder cerrarse ───────────────────
//
// Sus palabras: "si abro uno, despues no se cierra". Con `if(unico) return
// true` a secas, el grupo de un cliente unico se quedaba abierto hiciera lo
// que hiciera: lo que se VE es abierto y lo guardado es undefined, asi que
// negar lo guardado volvia a dar abierto.
{
  const fn = (HTML.match(/function bkAbierto\([\s\S]*?\n\}/) || [""])[0];
  ok(!/if\(unico\) return true;/.test(fn), "el automatico ya no manda siempre");
  ok(/hasOwnProperty\.call\(mapaAbiertos,clave\)/.test(fn),
     "solo manda MIENTRAS ella no haya decidido");
  const tg = (HTML.match(/function bkToggleCli\([\s\S]*?\n\}/) || [""])[0];
  ok(/function bkToggleCli\(mapa,clave,abiertoAhora\)/.test(tg),
     "y el toggle recibe el estado que se esta viendo");
  ok(/\(abiertoAhora===undefined\)\?/.test(tg), "sin romper a quien no se lo pase");
  // Y quien lo llama se lo pasa, o el arreglo no llega a la pantalla.
  const llamadas = HTML.match(/bkToggleCli\(\\"[a-zA-Z_]+\\"[\s\S]{0,200}?\+"\)'/g) || [];
  ok(llamadas.length > 0 && llamadas.every(function(l){ return /ab\?"true":"false"/.test(l); }),
     "y cada sitio que lo llama le pasa el estado",
     llamadas.filter(function(l){ return !/ab\?/.test(l); }).join(" · "));
}


// ── TANDA 1: que los números no mientan ──────────────────────────────────
//
// Los tres salieron de una lectura ciega de la pestaña por otro agente, y
// los tres se verificaron contra el código antes de tocar nada.
{
  const sinCom = t => t.replace(/\/\/[^\n]*/g, "");
  const pr = sinCom((HTML.match(/function rPrestamos\(\)\{[\s\S]*?\n\}/) || [""])[0]);

  // 1. La cartera NO puede quedarse corta en silencio. Sumaba 0 cuando a una
  //    moneda le faltaba la tasa y la tarjeta grande lo pintaba como total
  //    completo. Medido: $2.149 con 586,67 USD fuera.
  ok(/_carteraSinTasa\.push\(mon\)/.test(pr),
     "la cartera APUNTA la moneda que no pudo convertir");
  ok(/_carteraParcial\?"<span[^"]*>parcial/.test(pr),
     "y la tarjeta grande dice «parcial», no solo el panel de abajo");
  ok(/Falta la tasa de "\+_escAud\(_carteraSinTasa\.join/.test(pr),
     "diciendo QUE moneda falta, no solo que falta algo");

  // 2. La agenda contaba PRESTAMOS, no cuotas: un cliente con tres cuotas
  //    vencidas salia una vez y por el monto de una. Medido: 240 de 720.
  const cp = sinCom((HTML.match(/function cuotasPendientesDe\(p\)\{[\s\S]*?\n\}/) || [""])[0]);
  ok(cp.length > 150, "existe la lista de TODAS las cuotas pendientes");
  ok(/salida\.push\(\{cuota:c,falta:/.test(cp),
     "y cada una dice lo que le FALTA, no la cuota entera");
  // El mismo dato no se calcula en dos sitios: proximaCuotaPendiente lee de
  // aqui, o un dia dicen cosas distintas sobre la misma deuda.
  const pcp = sinCom((HTML.match(/function proximaCuotaPendiente\(p\)\{[\s\S]*?\n\}/) || [""])[0]);
  ok(/cuotasPendientesDe\(p\)/.test(pcp),
     "proximaCuotaPendiente lee de ahi, no tiene su propia cuenta");
  ok(/cuotasPendientesDe\(p\)\.forEach/.test(pr),
     "y la agenda mete una linea por CUOTA, no por prestamo");
  ok(/Vencido: "\+bkPorMoneda\(pares\)/.test(pr),
     "la agenda dice CUANTO suma lo vencido, por moneda y sin convertir");

  // 3. El premio por adelantar se guarda como un abono mas. La contabilidad
  //    esta bien (no cuenta como ganancia), pero la pantalla decia "Abonado
  //    241" de un cliente que entrego 236.
  // Acotado a rPrestamos: en Por Cobrar sigue diciendo "Abonado" y ahi es
  // correcto, porque esos abonos no llevan premio y no se infla nada.
  // Prohibirlo en TODO el archivo era pasarse, y la guardia fallaba con el
  // codigo bueno.
  ok(/Cubierto: <b>/.test(pr), "la tarjeta del prestamo dice «cubierto»");
  ok(!/Abonado: <b>/.test(pr), "y no llama «abonado» a lo que no se pago");
  ok(/es descuento por pagar adelantado/.test(HTML) &&
     /Pag[oó] "\+f2\(totalAbonado-_premio\)/.test(HTML),
     "y se dice cuanto entro de verdad a la cuenta");
}

// ── EL ESTADO DE CUENTA QUE SE MANDA AL CLIENTE ──────────────────────────
//
// Sus palabras: "quiero que agregues como un pequeño descargable de lo que ya
// pago cada cliente y tambien lo que debe cada cliente, que se pueda hacer
// como una descarga para enviar por WhatsApp".
//
// Es un documento que sale de la app, asi que le aplican las tres reglas que
// ya costaron cuatro arreglos: sus colores son suyos (arriba), su ancho es
// fijo, y su estilo tiene que viajar CON la hoja.
{
  const sinCom = t => t.replace(/\/\/[^\n]*/g, "");
  const hoja = sinCom(sacarFuncion("_htmlEstadoCuenta"));
  const lienzo = sinCom(sacarFuncion("_ecCanvas"));
  const datos = sinCom(sacarFuncion("estadoCuentaDe"));

  // 1. ARREGLO 85: html2canvas no dibuja el elemento donde esta, lo CLONA y
  //    lo cuelga de <body>. Todo lo escrito como "#_ecHoja ..." dejaria de
  //    aplicar en ese clon y mandaria el estilo general de la app. Medido
  //    antes de ponerle la clase: tinta #dcdae0 y cabecera azul oscuro del
  //    tema, sobre papel blanco.
  ok(/id='_ecHoja' class='ec-doc'/.test(hoja),
     "la hoja lleva su clase encima, que viaja con el clon");
  const reglasPorId = (HTML.match(/#_ecHoja[\s>.,:[]/g) || []).length;
  ok(reglasPorId === 0,
     "y ninguna regla de estilo cuelga del id del contenedor", reglasPorId + " reglas");
  ok(/\.ec-doc td,\.ec-doc th\{/.test(HTML), "las reglas cuelgan de .ec-doc");
  // Hay un tema que pinta th y td con !important, asi que una clase a secas
  // PIERDE aunque sea mas especifica.
  ok(/\.ec-doc td,\.ec-doc th\{color:var\(--ec-tinta\)!important/.test(HTML),
     "y ganan al !important que el tema pone sobre td y th");

  // 2. Ancho FIJO. Con el de la pantalla, el documento mide una cosa desde la
  //    PC y otra desde el telefono (ARREGLO 83: 77 celdas fuera de la hoja).
  ok(/var EC_ANCHO=\d+;/.test(HTML), "el ancho de la hoja es una constante");
  ok(/width:"\+EC_ANCHO\+"px/.test(hoja), "y la hoja la usa");
  ok(!/window\.innerWidth|document\.body\.clientWidth/.test(hoja),
     "y en ningun sitio mide la pantalla");

  // 3. ARREGLO 84: al marco del clon hay que darle los CUATRO numeros. Sin
  //    windowWidth, html2canvas usa el ancho de la pantalla: 412 en su
  //    telefono con la hoja en 1080.
  ["width", "height", "windowWidth", "windowHeight"].forEach(function(k){
    ok(new RegExp(k + ":").test(lienzo), "al lienzo se le pasa " + k);
  });
  // Y la escala se MIDE contra un presupuesto: Android corta por encima de su
  // tope sin un solo error y devuelve una imagen recortada.
  ok(/var EC_PRESUPUESTO=\d+;/.test(HTML), "hay un presupuesto de pixeles");
  ok(/EC_PRESUPUESTO\/\(EC_ANCHO\*alto\)/.test(lienzo),
     "y la escala sale de medir contra el, no de darla por hecha");
  ok(!/scale:\s*[23]\s*,/.test(lienzo), "la escala no esta escrita a mano");

  // 4. Compartir tiene que DECIR la verdad. Android pide un gesto reciente y
  //    dibujar tarda, asi que share() se rechaza a menudo; un catch vacio se
  //    tragaba el rechazo y desde fuera parecia que se habia mandado.
  const comp = sinCom(sacarFuncion("compartirEstadoCuenta"));
  ok(/err&&err\.name==="AbortError"/.test(comp),
     "cancelar a proposito no se trata como un fallo");
  ok(/catch\(function\(err\)\{[\s\S]*?bajar\(\);[\s\S]*?alert\(/.test(comp),
     "y un rechazo de verdad descarga Y lo dice");
  ok(!/catch\(function\(\)\{\}\)/.test(comp) && !/catch\(\(\)=>\{\}\)/.test(comp),
     "no queda ningun catch vacio");

  // 5. Los numeros no se calculan aparte. Un estado de cuenta que diga un
  //    numero distinto al de la app es peor que no darlo.
  ok(/cuotasPendientesDe\(p\)/.test(datos),
     "las cuotas salen de cuotasPendientesDe(), como la pantalla");
  ok(/moraPendiente\(p\)/.test(datos), "y la mora de moraPendiente()");
  // La mora vive en p.mora y NUNCA baja el saldo: sumarla al pendiente
  // descuadraria los ~25 sitios que calculan el saldo con p.abonos.
  ok(/_ecSuma\(out\.mora,mon,mora\)/.test(datos) && !/pend\s*\+\s*mora/.test(datos),
     "la mora va aparte, no sumada al pendiente");
  // Sumar reales con bolivares da un numero que no existe.
  const suma = sinCom(sacarFuncion("_ecSuma"));
  ok(/lista\[i\]\.mon===mon/.test(suma) && !/getRateToUsdt|bkUsdt/.test(suma),
     "cada moneda se suma con la suya y no se convierte");
  ok(/no se suman entre monedas/.test(hoja), "y el papel lo dice");
  // El premio baja la deuda pero no entro a la cuenta: decir "pago" sin
  // separarlo le cobra al cliente un dinero que no dio.
  ok(/descuento por pagar adelantado/.test(hoja) &&
     /f2\(g\.premio\)/.test(hoja),
     "el descuento por adelantar se separa, y se dice en el pago donde fue");
  // Y la version va DENTRO del papel: dos veces el mismo dia hubo que
  // adivinar que copia de la app habia hecho un documento que salia mal.
  ok(/APP_VERSION/.test(hoja), "la version de la app va escrita en la hoja");
}

// ── Dos detalles que ella caza y la app no ───────────────────────────────
{
  const sinCom = t => t.replace(/\/\/[^\n]*/g, "");
  const pr = sinCom((HTML.match(/function rPrestamos\(\)\{[\s\S]*?\n\}/) || [""])[0]);

  // Buscar "jose" tiene que encontrar a "JOSÉ": si no, parece que el
  // prestamo no existe.
  ok(/function _sinTildes\(t\)\{/.test(HTML), "hay una forma de comparar sin tildes");
  ok(/normalize\("NFD"\)/.test(sacarFuncion("_sinTildes")), "y quita la tilde de verdad");
  ok(/var q=_sinTildes\(S\._filtroCliente/.test(sinCom(sacarFuncion("_prPintarFiltro"))),
     "lo tecleado se compara sin tildes");
  ok(/data-nom='"\+_escAud\(_sinTildes\(g\.nombre\)\)/.test(pr),
     "y el nombre de la fila tambien, o la comparacion falla por un lado");

  // "mensual" + "s" daba "mensuals". Las tres frecuencias acaban en -l.
  ok(/function _plFrec\(f\)\{/.test(HTML), "el plural de la frecuencia esta en un sitio");
  ok(!/frecuencia\+"s"/.test(HTML) && !/\|\|"mensual"\)\+"s\)"/.test(HTML),
     "y ya no queda ningun «mensuals»");
}

// ── LO QUE SALIO DE PROBARLA CON SUS DATOS ───────────────────────────────
{
  const sinCom = t => t.replace(/\/\/[^\n]*/g, "");
  const pr = sinCom((HTML.match(/function rPrestamos\(\)\{[\s\S]*?\n\}/) || [""])[0]);

  // 1. Buscar sin tildes en los CINCO buscadores de cliente, no solo en el
  //    que salto. Escribia "maria" y no le salia MARIA PEREZ, asi que
  //    parecia que no estaba dada de alta y escribia el nombre a mano —
  //    que es lo que rompe la relacion prestamo↔ficha (ARREGLO 20).
  ["buscarClienteTx", "buscarClientePr", "buscarClienteEditPr",
   "buscarClienteEditCC", "buscarClienteEE"].forEach(function(f){
    const c = sinCom(sacarFuncion(f));
    ok(/_sinTildes\(val\)/.test(c) && !/val\.toLowerCase\(\)/.test(c),
       f + " compara sin tildes");
  });

  // 2. Al tocar Abonar, el formulario tiene que quedar A LA VISTA. Nace
  //    debajo del cronograma: medido a 412px, el boton en 615 y el
  //    formulario en 786, asi que en el telefono lo unico que ella veia
  //    cambiar era el boton pasando a "Cancelar".
  const tg = sinCom(sacarFuncion("togglePagarPrest"));
  ok(/if\(S\._pagarPrestId\) _irAlFormularioDeAbono\(\);/.test(tg),
     "al abrir el abono se va hasta el formulario");
  const ir = sinCom(sacarFuncion("_irAlFormularioDeAbono"));
  ok(/setTimeout\(/.test(ir), "despues del repintado, no antes (R() rehace el HTML)");
  ok(/block:"center"/.test(ir), "y lo centra, no lo pega al borde de abajo");
  ok(/id='pp-abono'/.test(pr), "y el formulario tiene a donde ir");

  // 3. "Rango" significaba DOS cosas en la misma tarjeta: arriba sg.min–sg.max
  //    y en el veredicto sg.piso–sg.max. Con piso 6,3 y rango 9,3–12,3, un 7%
  //    salia en VERDE y "en el rango adecuado".
  ok(/_pctActual<sg\.min\?"flojo"/.test(pr),
     "hay un estado entre el piso y el rango sugerido");
  ok(/flojo:"var\(--am3-k\)"/.test(pr), "y es ambar, no verde");
  ok(/dentro del "\+sg\.min\+"–"\+sg\.max\+"% sugerido/.test(pr),
     "y el ✅ dice dentro de QUE rango esta");
  ok(!/:"✅ El "\+_pctActual\+"% que tienes puesto está en el rango adecuado/.test(pr),
     "ya no queda el veredicto de tres estados");

  // 4. Buscar filtra MIENTRAS teclea, y sin repintar: R() en cada letra
  //    rehace el HTML y se lleva el foco y el cursor (ARREGLO 32).
  ok(/oninput='_prBuscar\(this\.value\)'/.test(pr), "el buscador filtra al teclear");
  const bu = sinCom(sacarFuncion("_prBuscar"));
  const pi = sinCom(sacarFuncion("_prPintarFiltro"));
  const pint = pi;
  ok(!/\bR\(\)/.test(bu) && !/\bR\(\)/.test(pi),
     "y no repinta: el campo conserva el foco y el cursor");
  ok(/f\.style\.display=ver\?"":"none"/.test(pi), "esconde filas, no las rehace");
  const fi = sinCom(sacarFuncion("_prFiltro"));
  ok(!/\bR\(\)/.test(fi), "cambiar de chip tampoco repinta");
  // Y si R() cae en medio por otra razon (el aviso de arranque a los 2s, una
  // respuesta del servidor, el repaso de cada 5 minutos), el cursor vuelve a
  // su sitio: el texto se redibuja desde el estado, pero el sitio donde
  // estaba escribiendo no.
  const rr = sinCom(sacarFuncion("R"));
  ok(/_ae\.id==="pr-buscador"/.test(rr), "R() anota si estaba escribiendo en el buscador");
  ok(/setSelectionRange\(_focoBusca,_focoBusca\)/.test(rr),
     "y le devuelve el cursor donde lo tenia");
  // Y la barra de arriba deja de cambiar con la busqueda: antes filtraba
  // `activos` ANTES de sumar, asi que buscar "JOSE" dejaba la cartera en
  // $99,00 cuando son $2.149. El titular no puede moverlo un buscador.
  ok(!/_sinTildes\(S\._filtroCliente/.test(pr),
     "rPrestamos no compara lo tecleado: eso vive en _prPintarFiltro");
  ok((pint.match(/_sinTildes\(S\._filtroCliente/g) || []).length === 1,
     "y alli se compara una sola vez");
  ok(!/activos=activos\.filter/.test(pr) && !/pagados=pagados\.filter/.test(pr),
     "y ninguna lista se recorta antes de sumar la cartera");

  // 5. Con un chip puesto, la lista vacia decia "sin saldados" y el chip
  //    estaba fuera de pantalla a la derecha: parecia que el cliente no
  //    tenia nada.
  ok(/dentro del filtro <b>/.test(pi), "el mensaje de vacio dice QUE filtro esta puesto");
  ok(/Buscar en todos|Ver todos/.test(pi), "y da el botón para quitarlo");

  // 6. Tocar el nombre en el bloque rojo no hacia nada.
  ok(/class='pr-urg-fila' style='cursor:pointer' onclick='_prIrA/.test(pr),
     "la fila entera del bloque rojo lleva a la ficha");
  ok(/pr-cobrar' onclick='event\.stopPropagation\(\)/.test(pr),
     "y el boton no dispara las dos cosas");

  // 7. El boton flotante tapaba la ultima fila. Mide 50 y vive a 16 del
  //    borde, asi que el hueco tiene que pasar de 66.
  const hueco = (HTML.match(/\.pr-pant\{padding-bottom:(\d+)px\}/) || [0, 0])[1];
  ok(parseInt(hueco, 10) > 66, "el hueco de abajo deja ver la ultima fila", hueco + "px");
}

// ── EL PAPEL QUE VE EL CLIENTE ───────────────────────────────────────────
{
  const sinCom = t => t.replace(/\/\/[^\n]*/g, "");
  const hoja = sinCom(sacarFuncion("_htmlEstadoCuenta"));
  const datos = sinCom(sacarFuncion("estadoCuentaDe"));

  // El cliente la conoce como RemesasYA, que es el nombre del flyer que
  // recibe. EMPRESA_RAZON es la razon social, la que ve el contador.
  ok(/var EC_MARCA="RemesasYA";/.test(HTML), "el papel lleva el nombre que el cliente conoce");
  ok((hoja.match(/P\(EC_MARCA\)/g) || []).length >= 2,
     "y la hoja lo lleva arriba y en el pie");
  ok(/Documento emitido por <b>"\+P\(EC_MARCA\)/.test(hoja),
     "el pie dice que lo emite ella, con el nombre que el cliente conoce");
  // El CNPJ NO va en el papel del cliente: decision suya.
  ok(!/EMPRESA_CNPJ/.test(hoja), "y el CNPJ no sale en el papel del cliente");
  // La version se queda: es lo unico que dice que copia de la app hizo un
  // papel que salio mal, y eso ya costo dos diagnosticos a ciegas.
  ok(/APP_VERSION/.test(hoja), "la version sigue dentro del papel");

  // "Ya pago" suma TODOS sus prestamos, incluido el saldado, mientras la
  // ficha enseña el % de los activos. Los dos son correctos; lo que faltaba
  // era que dijeran de que hablan.
  ok(/TODOS SUS PRÉSTAMOS/.test(hoja), "el papel dice que suma todos sus prestamos");
  ok(/incluye "\+\s*\n?\s*ec\.saldados\+" ya saldado/.test(hoja.replace(/\s+/g, " ")) ||
     /incluye "\+ec\.saldados\+" ya saldado/.test(hoja.replace(/\s+/g, "")),
     "y cuantos de ellos ya estan saldados");
  ok(/out\.saldados\+\+/.test(datos), "y se cuentan");
  const pr2 = sinCom((HTML.match(/function rPrestamos\(\)\{[\s\S]*?\n\}/) || [""])[0]);
  ok(/% cubierto de "\+\(gA\.items\.length===1\?"este préstamo":"sus préstamos activos"\)/.test(pr2),
     "y la ficha dice de que prestamo es su porcentaje");

  // Dentro conviven tres formatos de fecha y en el papel salian mezcladas.
  ok(/function _ecFechaPago\(a\)\{/.test(HTML), "las fechas de los pagos se normalizan");
  ok(/fecha:_ecFechaPago\(\{fecha:\(a&&a\.fecha\)\|\|"",id:a&&a\.id\}\)/
       .test(sinCom(sacarFuncion("_ecPago"))),
     "y la usa cada pago");
  ok(/fecha:_ecFecha\(c\.iso\)\|\|c\.fecha/.test(datos),
     "las de las cuotas salen del ISO, que si lleva el año");

  // El nombre del archivo se comia las tildes: EstadoCuenta_JOS_RODR_GUEZ.
  const nom = sinCom(sacarFuncion("_ecNombreArchivo"));
  ok(/_sinTildes\(ec\.nombre/.test(nom),
     "el nombre del archivo quita la tilde antes de limpiar, no despues");
}

// ── EL PAPEL NO PUEDE CRECER SIN LIMITE ──────────────────────────────────
//
// Su archivo real salio 1188 x 9974 px: una tira que por WhatsApp llega como
// miniatura y que ni en la PC se lee. Reproducido con un cliente de 12
// prestamos: hoja de 7.834 px, escala 1,1. Casi todo ese alto era el detalle
// cuota a cuota de prestamos YA PAGADOS, que al cliente no le sirve.
//
//    prestamos   antes            ahora
//      1         1.020 px  1:0,9   1.020 px  1:0,9
//     12         7.834 px  1:7,3   2.180 px  1:2,0
//     25        16.066 px  1:14,9  2.879 px  1:2,7
//
// Y es la misma leccion del ARREGLO 88: lo que sale hacia fuera no puede
// depender de las circunstancias —alli del aparato, aqui de cuantos
// prestamos tenga el cliente.
{
  const sinCom = t => t.replace(/\/\/[^\n]*/g, "");
  const hoja = sinCom(sacarFuncion("_htmlEstadoCuenta"));

  const tope = parseInt((HTML.match(/var EC_MAX_DETALLE=(\d+);/) || [0, 0])[1], 10);
  ok(tope >= 1 && tope <= 6,
     "el tope de prestamos con detalle es un numero chico", "vale " + tope);
  ok(/var saldados=ec\.prestamos\.filter\(function\(x\)\{return x\.saldado;\}\)/.test(hoja),
     "los saldados se separan");
  ok(/var conDetalle=vivos\.length<=EC_MAX_DETALLE\?vivos:\[\]/.test(hoja),
     "y con muchos vivos tampoco se dibuja el detalle de todos");
  ok(/var bloques=conDetalle\.map/.test(hoja),
     "el detalle cuota a cuota sale SOLO de los que caben");
  ok(!/var bloques=ec\.prestamos\.map/.test(hoja) && !/var bloques=vivos\.map/.test(hoja),
     "y nunca de la lista entera");
  // Una sola tabla de prestamos, con PARA QUE era cada uno: es por donde el
  // cliente los distingue ("el de la moto", no "el del 15/08").
  ok((hoja.match(/<th>PRESTADO EL<\/th>/g) || []).length === 1,
     "la tabla de prestamos esta escrita una sola vez");
  ok(/<th>PARA QUÉ<\/th>/.test(hoja) && /pr\.nota\?P\(pr\.nota\)/.test(hoja),
     "y lleva la descripcion que ella escribio al registrarlo");
  ok(/\+tablaPagos\+tablaPrestamos\+bloques\+/.test(hoja),
     "el papel va: pagos primero, luego los prestamos, luego el detalle");
  // La fecha del prestamo saca el año de su id, igual que la de los abonos.
  const datos = sinCom(sacarFuncion("estadoCuentaDe"));
  ok(/fecha:_ecFechaPago\(\{fecha:p\.d\|\|"",id:p\.id\}\)/.test(datos),
     "la fecha del prestamo tambien se normaliza");
}

// ── EL PAPEL SE ORGANIZA POR PAGOS, NO POR PRÉSTAMOS ─────────────────────
//
// Sus palabras: "él necesita saber a qué corresponde cada pago, cuándo se
// creó el préstamo, cuándo lo pagó él... ese resumen solamente me dice la
// fecha en que se creó el préstamo, la cantidad y ya".
//
// Y la distincion que ella subrayo: "una cosa es la fecha de creacion del
// prestamo y otra la fecha que el pago".
{
  const sinCom = t => t.replace(/\/\/[^\n]*/g, "");
  const hoja = sinCom(sacarFuncion("_htmlEstadoCuenta"));
  const datos = sinCom(sacarFuncion("estadoCuentaDe"));
  const pago = sinCom(sacarFuncion("_ecPago"));

  // Los pagos salen sueltos, con a QUE prestamo pertenece cada uno.
  ok(/out\.pagos\.push\(_ecPago\(p,a,mon,_etiqueta,"cuota",m\)\)/.test(datos),
     "cada abono entra en la lista de pagos");
  ok(/out\.pagos\.push\(_ecPago\(p,h,mon,_etiqueta,"mora",m\)\)/.test(datos),
     "y la mora cobrada tambien, que es dinero que el entrego");
  ok(/p\.notaDesc/.test(datos) && /_etiqueta=/.test(datos),
     "y cada pago se lleva para que era el prestamo");

  // ORDENADOS POR CUANDO PAGO. Es lo que ella pidio con todas las letras.
  const orden = (datos.match(/out\.pagos\.sort\([\s\S]*?\}\);/) || [""])[0];
  ok(/a\.iso!==b\.iso/.test(orden) && /a\.ts-b\.ts/.test(orden),
     "ordenados por el dia del pago y, dentro del dia, por la hora");
  ok(!/\.fecha<b\.fecha/.test(orden) && !/p\.d/.test(orden),
     "y NUNCA por la fecha en que se creo el prestamo");

  // La hora exacta vive dentro del id y nunca se perdio.
  ok(/ts>=1\.4e12&&ts<=2\.5e12/.test(pago), "la hora sale del id, con su rango");
  ok(/getHours\(\)/.test(pago), "y se enseña");

  // Si pago tarde se dice, y cuanto: es la mitad de lo que el viene a
  // comprobar. Sale de comparar el dia del pago con el de SU cuota.
  ok(/_diasIso\(cu\.iso,iso\)/.test(pago), "se mide el atraso de cada pago");
  ok(/días? tarde|día"\+\(g\.tarde!==1\?"s":""\)\+" tarde/.test(hoja) &&
     /al día/.test(hoja), "y el papel lo dice, tarde o al dia");

  // Agrupados por dia y con subtotal: asi "lo del dia de ayer" es un bloque.
  ok(/_ecDiaLargo\(d\.iso\)/.test(hoja), "los pagos van agrupados por dia");
  ok(/_ecSuma\(mapa\[g\.iso\]\.tot,g\.mon,g\.monto\)/.test(hoja),
     "cada dia lleva su subtotal, por moneda");

  // La mora pagada se dice en el resumen: si no, el cliente suma los pagos
  // de abajo y no le cuadra con el "ya pago" de arriba. Medido: 1.200 arriba
  // contra 1.221,50 de pagos listados.
  ok(/y además "\+_ecMon\(ec\.moraCobrada\)\+" de mora/.test(hoja),
     "el resumen dice la mora cobrada aparte, para que los pagos cuadren");
  ok(/_ecSuma\(out\.moraCobrada,mon,/.test(datos), "y se calcula");

  // El papel no puede volver a ser una tira: cada pago es UNA linea.
  ok(/var EC_MAX_PAGOS=\d+;/.test(HTML), "hay un tope de pagos en el papel");
  const topeP = parseInt((HTML.match(/var EC_MAX_PAGOS=(\d+);/) || [0, 0])[1], 10);
  ok(topeP >= 10 && topeP <= 30, "y es un numero chico", "vale " + topeP);
  ok(/out\.pagos=out\.pagos\.slice\(-EC_MAX_PAGOS\)/.test(datos),
     "se enseñan los ULTIMOS, no los primeros");
  ok(/Aquí van los últimos /.test(hoja) && /no caben en esta hoja/.test(hoja),
     "y se dice cuantos quedaron fuera");
  // Con tres renglones por pago, 40 pagos eran 4.500 px y volvia la tira.
  ok(!/<br><span style='font-size:19px;color:"\+\(g\.tarde/.test(hoja),
     "cada pago cabe en una linea");

  // Las cuotas ya pagadas no se repiten abajo: estan arriba con su hora.
  ok(/var _pend=pr\.cuotas\.filter\(function\(c\)\{return c\.falta!==null;\}\)/.test(hoja),
     "el cronograma solo enseña las cuotas que le faltan");
  ok(/CUOTAS QUE LE FALTAN/.test(hoja), "y lo dice en el titulo");

  // Una cuota ya vencida no se anuncia como "proxima".
  ok(/venció el "\+P\(prox\.fecha\)/.test(hoja),
     "una cuota pasada se dice vencida, no «proxima»");
}

// ── EL ORDEN DE LA PANTALLA NUEVA ────────────────────────────────────────
//
// Sus palabras: "donde me ponga a colocar qué paga cada uno y después que me
// ponga a seleccionar en qué cuenta entró cada dinero. Porque siento que el
// orden no es el correcto".
//
// Las cuentas estaban ANTES del paso 1, o sea que pedían la cuenta antes de
// saber de cuánto era la remesa. Y el desglose de "Pagó de varias formas"
// valida contra el total recibido: puesto arriba, enseñaba "Envía el cliente
// 0,00" y "Falta" sobre un campo que ella todavía no había rellenado.
{
  const sinCom = t => t.replace(/\/\/[^\n]*/g, "");

  // El orden se mide por DÓNDE aparece cada título dentro de la función, no
  // buscándolos sueltos: lo que se arregló es el orden.
  [["rNueva", "Monto recibido en "], ["rNuevaEE", "Monto USD"]].forEach(function(par){
    const fn = sinCom(sacarFuncion(par[0]));
    const iMonto = fn.indexOf("1️⃣ " + par[1]);
    const iCtas  = fn.indexOf("2️⃣ Cuentas afectadas");
    // El titulo del paso 3 cambia con el metodo desde el ARREGLO 106
    // ("3️⃣ Permuta" en calce), asi que se ancla al numero del paso.
    const iTasas = fn.indexOf("3️⃣ ");
    ok(iMonto > 0 && iCtas > 0 && iTasas > 0 && iMonto < iCtas && iCtas < iTasas,
       par[0] + ": primero el monto, luego las cuentas, luego las tasas",
       "monto " + iMonto + " · cuentas " + iCtas + " · tasas " + iTasas);
  });
  // Y no queda ninguna sección sin numerar entre las numeradas: la secuencia
  // se leía 1 → (nada) → 2.
  ok(!/>🏦 Cuentas afectadas</.test(HTML) && !/>\\'🏦 Cuentas afectadas/.test(HTML),
     "la sección de cuentas lleva su número");

  // En cada fila del desglose, el MONTO va antes que la cuenta.
  ["_txPagosHTML", "_txEntregasHTML"].forEach(function(f){
    const c = sinCom(sacarFuncion(f));
    const iInp = c.indexOf("<input type='text' inputmode='decimal'");
    const iSel = c.indexOf("<select onchange=");
    ok(iInp > 0 && iSel > 0 && iInp < iSel,
       f + ": el monto va antes que la cuenta", "monto " + iInp + " · cuenta " + iSel);
  });
}

// ── ARREGLO 105 · EL SUELDO SE DESCUENTA DEL CAPITAL ─────────────────────
//
// Sus palabras (11/10/2026): "yo quiero que en el capital final, en el monto
// de 'tienes tanto', 'deberias tener tanto', 'tienes tanto', ya este
// descontado mi sueldo", y "una pestaña al lado asi como los demas cuadros".
//
// Antes el sueldo era un numero que vivia en una sola pantalla. Medido sobre
// la v186: capitalRealTotal() daba 800 con el sueldo al 30 % y 800 con el
// 50 %, y la palabra "sueldo" salia 0 veces en Balance de Cuentas, 0 en
// Inventario USDT y 0 en Resumen y Diario.
{
  const sinCom = t => t.replace(/\/\/[^\n]*/g, "");

  // 1. El numero sale de calcMesCompleto, no se recalcula aqui. Es el mismo
  //    que ella ve en Egresos; dos cuentas para lo mismo es el 34,27 arriba
  //    y 34,28 abajo.
  const sa = sinCom(sacarFuncion("sueldoApartado"));
  ok(/calc\.disponiblePer/.test(sa),
     "sueldoApartado lee disponiblePer de calcMesCompleto");
  ok(!/saldoPersonalAcumulado\s*=/.test(sa) && !/cierresMes/.test(sa),
     "y no se arma su propio acumulado");
  ok(/sinTasa\.push|sinTasa\.indexOf/.test(sa),
     "una cuenta 💜 sin tasa se dice, no se cuenta como cero");
  ok(/activa!==false&&c\.esPersonal/.test(sa),
     "lo apartado son las cuentas 💜 activas");

  // 2. EL CAPITAL YA VA SIN EL SUELDO. Es lo que pidio ella.
  const crt = sinCom(sacarFuncion("capitalRealTotal"));
  ok(/var total=r2v\(enCuentas\+enReserva\+porCobrar\+enPrestamos-sueldoPendiente\);/.test(crt),
     "capitalRealTotal descuenta el sueldo del total");
  ok(/sueldoPendiente:r2v\(sueldoPendiente\)/.test(crt),
     "y lo devuelve aparte, para que el otro lado reste EL MISMO numero");

  // 3. Y LA CONCILIACION LO RESTA TAMBIEN, leyendolo de ahi. Esto es lo que
  //    impide que se abra un hueco fijo contra la apertura del 11/09, que se
  //    fijo con el sueldo dentro — el ARREGLO 71 calcado. Se exige la
  //    EXPRESION ENTERA: buscar "sueldoPendiente" suelto pasaria con el
  //    termino multiplicado por cero o renombrado (ARREGLO 100).
  const cc = sinCom(sacarFuncion("conciliacionCapital"));
  ok(/var deberias=r2v\(apertura-intAp\.total\+bruta-egEmpresa-egPersonalEmpresa-socios-traspPers\.total-\(real\.sueldoPendiente\|\|0\)\);/.test(cc),
     "«deberias tener» resta el MISMO sueldo que «tienes»");
  ok(!/sueldoApartado\(/.test(cc),
     "y no lo vuelve a calcular por su cuenta");

  // 4. Su caja, al lado de las otras, y con el signo delante: estas cajas
  //    tienen que SUMAR el numero grande, que ya va sin el sueldo.
  ok(/_cajas\.push\(_caja\("− Tu sueldo", R\.sueldoPendiente/.test(HTML),
     "la caja «− Tu sueldo» va con las demas");
  ok(/if\(R\.sueldoPendiente>0\.005\)\s*\n\s*_cajas\.push\(_caja\("− Tu sueldo"/.test(HTML),
     "y solo sale cuando queda algo por apartar");

  // 5. El mensaje de fijar la apertura imprime la resta: sin eso los numeros
  //    de arriba no suman el TOTAL de abajo.
  const fa = sinCom(sacarFuncion("fijarAperturaHoy"));
  ok(/cap\.sueldoPendiente/.test(fa),
     "al fijar la apertura se ve la resta del sueldo");

  // 6. ARREGLO 141 · el sueldo se escribe UNA vez, y donde se escribe hay un
  //    BOTON. Sus palabras del 15/10: "quiero que en todos lados el sueldo que
  //    saca la empresa para mi este con su tarjeta y apartado, y no solo
  //    letricas escritas".
  //
  //    _htmlSueldoSinApartar() se retiro: decia lo mismo que el bloque pero sin
  //    boton, asi que con los dos puestos la pantalla lo contaba dos veces.
  ok(!/function _htmlSueldoSinApartar\(/.test(HTML),
     "la linea vieja sin boton se retiro, no se quedo al lado (ARREGLO 98)");
  const nBloq = (HTML.match(/_htmlBloqueSueldo\(/g) || []).length;
  ok(nBloq === 3, "dos pantallas lo leen, y nada mas", "aparece " + nBloq + " veces");
  //    Cada una anclada a SU marcado: buscarlo dentro de rCapitalTotal no vale,
  //    porque la tarjeta de conciliacion vive en esa misma funcion y la guardia
  //    pasaba con el bloque del Balance borrado.
  //    El ancla es el TITULO de esa cabecera, que existe una sola vez.
  //    `f2(totalUsdt)+"</div>"` sale tres veces en el archivo, asi que la
  //    guardia podia medir desde otro trozo — el mismo agujero del ARREGLO 100.
  ok(/🏢 Total empresa \(USDT equiv\.\)[\s\S]{0,3000}?_htmlBloqueSueldo\(true, totalUsdt\+_sueldoCab\)/.test(HTML),
     "Balance de Cuentas lo lleva debajo del total de la empresa, ya descontado");
  //    Y ese total TIENE que llevarlo descontado: esa cabecera suma las
  //    cuentas por su cuenta, no sale de capitalRealTotal(). Con el bloque
  //    puesto sobre un total sin descontar, el numero miente.
  ok(/totalUsdt=Math\.round\(\(totalUsdt-_sueldoCab\)\*100\)\/100;/.test(sinCom(sacarFuncion("rCapitalTotal"))),
     "y ese total lo lleva descontado de verdad");
  //    En Inventario esas cuatro cifras son saldos en crudo: el sueldo sigue
  //    dentro. Decir alli "ya descontado" seria mentir al lado del numero que
  //    lo desmiente, asi que va con la otra cola.
  ok(/_htmlBloqueSueldo\(false\)/.test(sinCom(sacarFuncion("rInventarioUsdt"))),
     "Inventario USDT lo dice sin prometer que esta descontado");
  const bloq = sinCom(sacarFuncion("_htmlBloqueSueldo"));
  //    ARREGLO 141 · maqueta 3, la que eligio ella: debajo del monto va el
  //    CAMINO, "de que cuenta de la empresa sale" → "a que cuenta suya va".
  //    Sus palabras del 15/10: "en apartar mi sueldo debe de salir de una
  //    cuenta empresa a mi cuenta sueldo".
  //
  //    Y el nombre que se escribe tiene que ser el que el boton va a usar de
  //    verdad: los dos salen de _ctasOrigenSueldo()[0], que es tambien lo que
  //    el <select> deja marcado. Escrito aparte, la linea diria una cuenta y
  //    el dinero saldria de otra.
  ok(/_rutaSueldoTxt\(ctas\[0\],dest\)/.test(bloq),
     "el bloque escribe el camino, y con la misma cuenta que usara el boton");
  const ruta = sinCom(sacarFuncion("_rutaSueldoTxt"));
  ok(/org\.nombre/.test(ruta) && /dest\.nombre/.test(ruta) && /→/.test(ruta),
     "y ese camino nombra las dos cuentas");
  ok(/if\(!org\|\|!dest\)/.test(ruta),
     "sin origen o sin destino no se inventa un camino");
  //    Cambiar la cuenta en el desplegable refresca la linea por su id: ni R()
  //    (ARREGLO 32, cerraria el selector bajo el dedo) ni nada (ARREGLO 55,
  //    dejaria arriba el nombre de la cuenta anterior).
  const prs = sinCom(sacarFuncion("_pintarRutaSueldo"));
  ok(!/\bR\(\)/.test(prs) && /getElementById\("sueldo-ruta"\)/.test(prs) &&
     /_rutaSueldoTxt\(/.test(prs),
     "y cambiar la cuenta refresca la linea, por su id y con la misma funcion");
  ok(/onchange='_pintarRutaSueldo\(\)'/.test(sinCom(sacarFuncion("_htmlDetalleSueldo"))),
     "el selector avisa al cambiar");
  //    Y su pregunta del 15/10 ("en un lado dice 1.239,98 y en otro 1.148,31")
  //    se contesta dentro del plegable, que es donde la maqueta 3 dejo sitio.
  //    Escrita ADEMAS fuera, el sueldo saldria CUATRO veces en la pantalla
  //    (ARREGLO 125) y dos de esas cuatro son aritmetica que no se puede
  //    quitar: la cajita que suma el total y la fila que suma el salto.
  ok(/Ya está descontado del total de arriba/.test(sinCom(sacarFuncion("_htmlDetalleSueldo"))),
     "y dice de que monto sale, que es lo que ella preguntó");
  ok(!/que hay en cuentas/.test(bloq),
     "y no lo repite fuera: un numero se escribe UNA vez (ARREGLO 125)");
  //    El boton y el desplegable, que son lo que lo separa de una "letrica".
  //    El boton entero, no solo la llamada: cambiando el <button> por un <span>
  //    la guardia pasaba con el boton convertido en texto — y texto es justo lo
  //    que ella NO quiere ("no solo letricas escritas").
  ok(/irAApartarSueldo\(/.test(bloq) && /<button/.test(bloq) && /📤 Apartar<\/button>/.test(bloq),
     "el bloque lleva el boton de apartar, y es un boton de verdad");
  const vdet0 = sacarFuncion("_verDetalleSueldo").replace(/\/\/[^\n]*/g, "");
  ok(/_verDetalleSueldo\(\)/.test(bloq) && /id='sueldo-det'/.test(bloq),
     "y el detalle plegado, que es la forma que ella eligio (B)");
  //    Y su rotulo se escribe en UN sitio: el dibujado lo ponia como "cambiar
  //    de donde sale" y el plegado volvia a escribir "ver detalle", asi que el
  //    enlace cambiaba de nombre al cerrarlo. Lo cazo pulsarlo (ARREGLO 121).
  ok(/_rotDetalleSueldo\(abierto\)/.test(bloq) &&
     /_rotDetalleSueldo\(S\._sueldoDet\)/.test(vdet0),
     "el rotulo del plegable sale del mismo sitio al dibujar y al cerrar");
  //    Desplegar NO repinta (ARREGLO 32): repintar cierra lo que tenga abierto
  //    bajo el dedo, y aqui hay un <select> debajo.
  const vdet = sinCom(sacarFuncion("_verDetalleSueldo"));
  ok(!/\bR\(\)/.test(vdet) && /getElementById\("sueldo-det"\)/.test(vdet),
     "abrir el detalle no llama a R()");
  //    Las dos listas de cuentas salen de la puerta unica: calculadas aparte,
  //    la tarjeta de Egresos y el bloque ofrecerian cuentas distintas.
  ["_htmlBloqueSueldo","_htmlDetalleSueldo"].forEach(function(f){
    const c = sinCom(sacarFuncion(f));
    ok(!/S\.cuentas\|\|\[\]\)\.filter/.test(c),
       f+" no se arma su propia lista de cuentas");
  });
  //    Y una cuenta en CERO no se ofrece como origen: antes la primera opcion
  //    era BINANCE JULIO ($0,00) y el boton contestaba "no tiene saldo, elige
  //    otra" — hacerle perder el viaje con un dato que la app ya tiene.
  const orig = sinCom(sacarFuncion("_ctasOrigenSueldo"));
  ok(/>0\.005/.test(orig), "el origen del sueldo deja fuera las cuentas en cero");
  ok(/\.sort\(/.test(orig), "y van ordenadas por saldo, la de mas dinero primero");
  ok(/_ctasOrigenSueldo\(\)/.test(sinCom(sacarFuncion("rEgresos"))),
     "la tarjeta de Egresos lee la misma puerta");

  const rct0 = sacarFuncion("rCapitalTotal").replace(/\/\/[^\n]*/g, "");
  // 6a-bis. ARREGLO 141 · los tres recortes de la pestaña. Sus palabras del
  //     15/10: "dalance de cuenta ocupa mucho la pnatalla". Medido, eran
  //     2.053 px — 2,9 pantallas de su telefono.
  //
  //     Salud de cartera se pliega (264 px). Es un panorama que se mira una
  //     vez al mes, no un aviso — y por eso lo que NO puede plegarse es lo que
  //     avisa: una cuenta en negativo o una moneda sin tasa tienen que verse en
  //     la linea cerrada. Un aviso escondido no es un aviso (ARREGLO 48/60).
  const vsa = sacarFuncion("_verSalud").replace(/\/\/[^\n]*/g, "");
  ok(!/\bR\(\)/.test(vsa) && /getElementById\("salud-cuerpo"\)/.test(vsa),
     "plegar Salud de cartera no llama a R() (ARREGLO 32)");
  ok(/id='salud-cuerpo'/.test(rct0) && /_verSalud\(\)/.test(rct0),
     "y el panel se pliega por su id");
  //     El aviso va en la linea que lo abre, y tiene que mirar las dos cosas:
  //     con solo una, la otra se queda dentro del plegable sin que nada lo diga.
  const cab = (rct0.match(/var _avisoSalud[\s\S]{0,700}?;\n/) || [""])[0];
  ok(/negCuentas\.length/.test(cab) && /sinTasaCount/.test(cab),
     "y el aviso de cuenta en negativo y el de moneda sin tasa se ven plegado");
  //     Los totales por moneda vivian en una rejilla al final de la pestaña,
  //     126 px por debajo de la distribucion que habla de lo mismo. Ahora es
  //     una fila con las DOS cifras. Una pantalla nueva QUITA la vieja
  //     (ARREGLO 98): si vuelve, hay dos sitios para la misma pregunta.
  ok(/var natMon=\{\}/.test(rct0) && /monsCartera\.map\(function/.test(rct0),
     "los totales nativos por moneda viven dentro de Salud de cartera");
  ok(!/var totM=\{\}/.test(rct0),
     "y la rejilla vieja del final no esta al lado (ARREGLO 98)");
  //     El nativo se recorre aparte de distMon a proposito: distMon solo suma
  //     los saldos POSITIVOS —es un reparto de riesgo— y el total nativo tiene
  //     que llevar lo que de verdad hay, negativos incluidos. Mezclarlos daria
  //     un "tienes" que no es el que suman las cuentas de abajo.
  ok(/natMon\[c\.moneda\]=\(natMon\[c\.moneda\]\|\|0\)\+\(parseFloat\(c\.saldo\)\|\|0\)/.test(rct0),
     "y el nativo cuenta tambien los negativos, no solo lo que reparte la barra");
  //     Y el aviso permanente "Solo lectura" se fue (46 px). No avisaba de
  //     nada: ninguna fila ofrece crear ni borrar. Un aviso que nunca cambia
  //     deja de leerse (ARREGLO 99).
  ok(!/Solo lectura\.<\/b> Para agregar/.test(HTML),
     "el aviso permanente de 'solo lectura' se fue de Balance de Cuentas");

  // 6a-ter. ARREGLO 142 · la cabecera 🏢 TOTAL EMPRESA va sobre --fondo-osc,
  //     que es SIEMPRE oscura elija el tema que elija. El 💜 TOTAL PERSONAL de
  //     al lado estaba con nombres del tema y en SUAVE —el que abre— el numero
  //     salia en #391a5a sobre #1f2833: contraste 1,04, invisible. En Claro y
  //     en Papel se leia, asi que desde la PC no se veia nunca.
  //
  //     Misma regla que las pantallas de entrada y el flyer, tercera vez: lo
  //     que no sigue al tema no se pinta con nombres del tema. Las tres
  //     guardias son las mismas que alli.
  ["--per-rot","--per-num"].forEach(function(n){
    const def = HTML.split(n+":").length - 1;
    ok(def === 1, n+" se declara UNA vez, en :root — ningun tema lo repinta",
       "aparece definido "+def+" veces");
  });
  const _bloquesTema = HTML.split(/html\[data-tema="[a-z]+"\]\s*\{/).slice(1).join("\n");
  ok(!/--per-(rot|num)\s*:/.test(_bloquesTema),
     "y ningun bloque de tema los vuelve a definir");
  const _cabPers = (rct0.match(/[^+]*💜 Total personal[\s\S]{0,260}?No cuenta como dinero/) || [""])[0];
  ok(_cabPers.length > 0, "la cabecera 💜 sigue ahi, y el recorte la encuentra");
  ok(/var\(--per-rot\)/.test(_cabPers) && /var\(--per-num\)/.test(_cabPers) &&
     !/--az5-g|--mo6-c/.test(_cabPers),
     "y la cabecera 💜 usa solo esos dos, ningun nombre del tema");

  // 6b. ARREGLO 141 · las cuentas en CERO se pliegan. Medido en su export: 15
  //     de sus 23 cuentas estan en cero, y de las que ve son 9 de 17 — mas de
  //     media lista. Sus palabras del 15/10: "las cuentas que esten en 0
  //     deberian de no estar ahi visibles".
  const vcc = sinCom(sacarFuncion("_verCuentasCero"));
  ok(!/\bR\(\)/.test(vcc) && /getElementById\("ctas-cero"\)/.test(vcc),
     "desplegar las cuentas en cero no llama a R() (ARREGLO 32)");
  const rct = sinCom(sacarFuncion("rCapitalTotal"));
  ok(/_ctasCero\s*=\s*capOrdenado\.filter\(_ctaSinDinero\)/.test(rct),
     "la lista se parte por la puerta unica, _ctaSinDinero");
  ok(/id='ctas-cero'/.test(rct) && /capRowsCero/.test(rct),
     "y las filas siguen dibujadas, solo plegadas — un cero puede ser el dato");
  //     Se PLIEGAN, no se borran: una tarjeta en 0 significa que no debes nada
  //     y MI SUELDO BINANCE en 0 dice que el sueldo no se aparto. Es la misma
  //     regla que el Cierre de Mes ya aplica.
  ok(/_filaCuenta\(it,i,_ctasCero\)/.test(rct),
     "las de cero se dibujan con la MISMA fila, no con una version recortada");

  // 6c. ARREGLO 141 · los porcentajes de la cartera suman 100. Redondeando
  //     cada uno por su cuenta el resto se pierde (medido: 99%), y una
  //     distribucion que no llega a 100 se lee como que falta dinero por
  //     clasificar. El sobrante va al mayor, que es el unico al que un punto
  //     no le cambia la lectura.
  const pc = sinCom(sacarFuncion("_pctCartera"));
  ok(/suma!==100/.test(pc) && /_PCT_CARTERA\[mayor\]\+=\(100-suma\)/.test(pc),
     "los % de la cartera suman 100: el resto va al mayor");
  //     Dos llamadas: la barra y la etiqueta. Se cuentan con el "= " delante
  //     para no contar la definicion, que escrita a secas hacia tres.
  ok((rct.match(/=\s*_pctCartera\(mon\)/g)||[]).length===2,
     "y la barra y su rotulo leen el MISMO %, no uno cada uno");

  // 6d. ARREGLO 141 · el aviso del Resumen tenia su propia cuenta y sumaba
  //     `p.monto`, o sea capital + interes. Medido en su export del 13/10: el
  //     Resumen decia 1.166,48 y el Balance 1.159,94 — los 6,54 del interes.
  //     Dos numeros para lo mismo en dos pantallas es el 34,27 contra el 34,28.
  const avs = sinCom(sacarFuncion("rDash"));
  ok(/prestUsdtPend=_cr\?\(_cr\.enPrestamos\|\|0\):0/.test(avs),
     "el aviso de prestamos lee el capital de capitalRealTotal()");
  ok(/_intPend/.test(avs) && /de interés/.test(avs),
     "y el interes se nombra aparte, no se cuela dentro (ARREGLO 71)");

  // 7. ARREGLO 141: el bloque ya NO va sobre una cabecera de color —tiene su
  //    propio fondo, porque lleva un boton y un <select> dentro— asi que lo del
  //    "hereda el color" dejo de aplicar. Lo que SI sigue mandando es que
  //    desaparezca solo: un bloque permanente que no dice nada es lo que enseña
  //    a no mirar la pantalla (ARREGLO 101).
  ok(/if\(!s \|\| s\.falta<=0\.005\) return "";/.test(bloq),
     "y desaparece solo cuando ya esta apartado");

  // 8. El boton NO mueve dinero: deja el traspaso escrito y lleva al
  //    formulario de siempre (ARREGLO 98: un segundo camino es un segundo
  //    sitio donde cuadrar las cuentas).
  const ir = sinCom(sacarFuncion("irAApartarSueldo"));
  ok(/S\.nTraspaso=\{/.test(ir) && /st\("traspasos"\)/.test(ir),
     "el boton deja el traspaso escrito y lleva a Traspasos");
  ok(!/S\.traspasos\.push/.test(ir) && !/\.saldo\s*=/.test(ir) && !/saveData\(\)/.test(ir),
     "y no mueve ni un centavo por su cuenta");
  ok(/Math\.min\(s\.falta/.test(ir),
     "nunca pide mas de lo que hay en la cuenta de origen");

  // 9. La tarjeta de Egresos compara las dos cifras y nombra la que falta.
  const eg = sinCom(sacarFuncion("rEgresos"));
  ok(/💜 TU SUELDO, APARTADO/.test(eg), "la tarjeta esta en Egresos → Personal");
  ok(/Tuyo acumulado \(gastable hoy\)/.test(eg) &&
     /Apartado en tus cuentas 💜/.test(eg) &&
     /Te falta apartar/.test(eg),
     "y dice las tres cifras: lo tuyo, lo apartado y lo que falta");
  ok(/var sa=sueldoApartado\(\);/.test(eg),
     "que salen del mismo sitio que el capital");
  //    Y ya no puede decir que el capital lo cuenta como suyo: desde el 105
  //    no lo cuenta.
  ok(!/el capital lo cuenta como suyo/.test(eg),
     "y no dice que el capital lo siga contando");
}

// ── ARREGLO 106 · CALCE DIRECTO (permuta BRL <-> VES, sin USDT) ──────────
//
// Sus palabras: "se elimina la intermediacion de USDT... G_VES = M_BRL ×
// (T_Mercado − T_Cliente)", y "de donde salen los bolivares que recibe tu
// cliente: de tu cuenta en Venezuela".
//
// Lo medido en Chromium, que es lo que estas guardias protegen:
//
//   su formula  M × (T_Mercado − T_Cliente) ...  11.590,00 Bs
//   la app      pr × tv .....................    11.589,96 Bs   (redondeo)
//
//   IDA  BRL→VES   PAGBANK 1000→2000 · BDV 300.000→128.000
//                  lote de compra BRL 100 → 100   <- NO se toca
//                  lote de venta VES  189.600 → 17.600
//                  nace 1 lote de reales a 5,1637, marcado permuta
//   VUELTA VES→BRL consume ese mismo lote de reales: 1000 → 500
//   Al borrar, las dos vuelven exactas.
{
  const sinCom = t => t.replace(/\/\/[^\n]*/g, "");

  // 1. Solo el par BRL <-> VES. En Colombia y Peru la permuta no se escribe
  //    en bolivares por real y la cuenta de arriba no valdria.
  ok(F.esRutaCalce({orig:"BRL",dest:"VES"}) && F.esRutaCalce({orig:"VES",dest:"BRL"}),
     "el calce vale en los dos sentidos de BRL <-> VES");
  ok(!F.esRutaCalce({orig:"BRL",dest:"COP"}) && !F.esRutaCalce({orig:"BRL",dest:"PEN"}) &&
     !F.esRutaCalce({orig:"USD",dest:"VES"}) && !F.esRutaCalce(null),
     "y en ninguna otra ruta");
  // Y hace falta LAS DOS cosas: el metodo y la ruta.
  ok(F.esCalceDirecto({metodo:"calce"}, {orig:"BRL",dest:"VES"}) === true,
     "es calce con el metodo puesto y la ruta buena");
  ok(F.esCalceDirecto({metodo:"calce"}, {orig:"BRL",dest:"COP"}) === false &&
     F.esCalceDirecto({metodo:"p2p"},   {orig:"BRL",dest:"VES"}) === false &&
     F.esCalceDirecto({},               {orig:"BRL",dest:"VES"}) === false,
     "y nunca con una sola de las dos");

  // 2. cTx: sin Binance no hay comision, y la tasa de compra sale de la
  //    permuta — en cada sentido la suya. Se exige la EXPRESION ENTERA:
  //    buscar "permuta" suelto pasaria con el termino renombrado o a cero
  //    (ARREGLO 100).
  const ct = sinCom(sacarFuncion("cTx"));
  ok(/comUc = 0; comUv = 0;/.test(ct),
     "en calce no se descuenta comision de Binance");
  ok(/tc = \(_permuta>0 && tv>0\) \? \(isVzla \? _permuta\*tv : tv\/_permuta\) : 0;/.test(ct),
     "la tasa de compra sale de la permuta, con su sentido");
  // Los DOS returns, no uno: cTx sale por el de arriba cuando falta la tasa,
  // y la guardia escrita sin contar pasaba con el de abajo vaciado.
  const nRet = (ct.match(/calce:_calce,permuta:_permuta/g) || []).length;
  ok(nRet === 2, "cTx devuelve las dos por sus dos salidas", "sale " + nRet + " de 2");
  // Sin permuta, pr queda en 0 y no se inventa nada.
  ok(/if\(!tc\|\|!tv\) return\{[^}]*pr:0/.test(ct),
     "sin permuta no hay ganancia inventada");

  // 3. El FIFO: lo que ENTRA no consume. Es lo que impide comerse lotes de
  //    compra de USDT que esta operacion nunca uso — y de esos lotes salen
  //    las tasas que la app sugiere (el fallo del 12/09, por el otro lado).
  ok(/if\(!calce\) consumirInventarioFIFO\(monOrig, uc, monDest, 0, ctaOrig, ctaDest\);/.test(HTML),
     "en calce no se consume el lado de la moneda que entra");
  ok(/var r=calce\?\{compras:\[\]\}:simularConsumoFIFO\(/.test(HTML),
     "y el simulador dice lo mismo que el consumo");
  // El lado que SALE se consume siempre, calce o no.
  const cf = sinCom(sacarFuncion("consumirFIFORemesa"));
  ok(/_entregasParaFIFO\(entregas, ctaDest, cant\)\.forEach/.test(cf) &&
     !/if\(!calce\)[\s\S]*_entregasParaFIFO/.test(cf.replace(/if\(!calce\) consumirInventarioFIFO[^\n]*\n/,"")),
     "lo que sale si consume, siempre");

  // 4. El lote de entrada: solo BRL y solo en calce, y marcado.
  ok(/if\(moneda!=="VES" && !\(calce && moneda==="BRL"\)\) return null;/.test(HTML),
     "crearLoteRecibido abre la puerta solo a los reales en calce");
  ok(/lote\.permuta=true;\s*\n\s*lote\.plataforma="Permuta";/.test(HTML),
     "y lo marca, para que no lo miren las tasas");

  // 5. LO MAS IMPORTANTE: ese lote no puede alimentar la tasa con la que se
  //    valora TODO el dinero parado. Su tasa sale de un cruce BRL/VES, no de
  //    Binance.
  ok(/if\(l\.permuta\) continue;/.test(sinCom(sacarFuncion("tasaDeReferencia"))),
     "tasaDeReferencia no mira los lotes de permuta");

  // 6. Al borrar no se devuelve lo que nunca se consumio. Eran DOS caminos
  //    (con _mov y sin el) y cada uno llevaba su copia del chequeo; desde el
  //    ARREGLO 127 los dos llaman a _restaurarComprasFIFO, asi que el chequeo
  //    vive ahi, UNA vez. Lo que se exige sigue siendo lo mismo: que ningun
  //    camino devuelva USDT que un calce nunca consumio.
  const rv = sinCom(sacarFuncion("revertirSaldosRemesa"));
  const rc = sinCom(sacarFuncion("_restaurarComprasFIFO"));
  ok((rv.match(/_restaurarComprasFIFO\(/g) || []).length === 2,
     "los dos caminos del borrado pasan por la misma funcion de compras");
  ok(/r\.metodo==="calce"/.test(rc), "que es donde vive el chequeo del calce");
  ok(/if\(!\(uc>0\) \|\| r\.metodo==="calce"\) return;/.test(rc),
     "y corta antes de devolver nada");
  ok(!/if\(uc>0\)\s*\{/.test(rv) && !/comprasTodas/.test(rv),
     "y no queda ninguna copia suelta sin guardia");

  // 7. saveTx: ni lotes en blanco, ni el aviso de FIFO del lado que no
  //    consume, y el metodo viaja CON la remesa (el borrado lo lee de ahi).
  const sv = sinCom(sacarFuncion("saveTx"));
  ok(/if\(!rates\.hasRates && !_calceTx\)\{/.test(sv),
     "en calce no nacen los dos lotes en blanco de «Operación»");
  ok(/var _faltaU=_calceTx\?0:/.test(sv),
     "ni salta el aviso de «falta saldo FIFO» por el lado que no consume");
  ok(/nuevaRemesa\.metodo="calce"; nuevaRemesa\.permuta=parseFloat\(f\.permuta\)\|\|0;/.test(sv),
     "el metodo y la permuta se guardan en la remesa");
  const nPasa = (sv.match(/_entregas,_calceTx\)|_entregas, _calceTx\)/g) || []).length;
  ok(nPasa === 3, "y se pasa a la simulacion, al consumo y a la foto de lotes",
     "sale " + nPasa + " de 3");
  ok(/crearLoteRecibido\(ruta\.orig, res\.am, res\.uc, f\.cuentaBanco\|\|"", ds\(f\.date\), nuevaRemesa\._uid, f\.hora, _calceTx\)/.test(sv),
     "y al lote de entrada tambien");

  // 8. PENDIENTE. En calce la remesa tampoco crea lote al guardarse —el
  //    dinero no entro—, pero al COBRARSE si tiene que nacer, y puede ser en
  //    reales. Reproducido antes de arreglarlo: se cobraban los 1.000 R$ y el
  //    lote no nacia, asi que esos reales se gastaban despues sin saber a que
  //    valor habian entrado.
  const lc = sinCom(sacarFuncion("_loteAlCobrar"));
  ok(/if\(c\.moneda!=="VES" && c\.metodo!=="calce"\) return null;/.test(lc),
     "al cobrar un pendiente de calce, los reales SI llevan lote");
  ok(/c\.refUid\|\|"", "", c\.metodo==="calce"\)/.test(lc),
     "y se le pasa el metodo a crearLoteRecibido");
  // Los TRES sitios que crean la cuenta por cobrar tienen que guardarlo: uno
  // que se olvide deja ese cobro sin lote y no hay forma de saberlo despues.
  const nMet = (HTML.match(/metodo:_calceTx\?"calce":""|metodo:r\.metodo\|\|""/g) || []).length;
  ok(nMet === 3, "los tres sitios que crean la cuenta por cobrar guardan el metodo",
     "salen " + nMet + " de 3");

  // 9. En el inventario, una permuta no se puede leer como una venta de USDT.
  //    Sin esto la fila decia "⬆️ VENTA · BRL · −193,66 USDT" de unos USDT que
  //    nunca salieron — el "vendi 30 BRL que nadie hizo" del 12/09, otra vez.
  ok(/r\.permuta\?"🤝 PERMUTA":isComp\?"⬇️ COMPRA":"⬆️ VENTA"/.test(HTML),
     "el inventario la llama permuta, no venta");
  ok(/r\.permuta\?"≈ "\+f4\(r\.usdt\)\+" USDT"/.test(HTML),
     "y su USDT va sin signo: ahi no se movio ninguno");

  // 10. La pantalla. El selector solo donde la cuenta vale, y cambiar de
  //    metodo limpia lo del otro: una tasa escrita a mano que ya no manda se
  //    lee como que sigue mandando (ARREGLO 98).
  const rn = sinCom(sacarFuncion("rNueva"));
  ok(/\(esRutaCalce\(ruta\)\?/.test(rn), "el selector solo sale en la ruta BRL <-> VES");
  ok(/if\(_rTx\.calce\) tc=parseFloat\(_rTx\.tc\)\|\|0;/.test(rn),
     "el recuadro «am ÷ tc» usa la tasa derivada, no la del inventario");
  const tm = sinCom(sacarFuncion("_ponerMetodoTx"));
  ok(/S\.tx\.tc_manual=""/.test(tm) && /S\.tx\.permuta=""/.test(tm),
     "cambiar de metodo limpia lo que ya no aplica");
  // Y se dice que ahi no hay comision de Binance: es la diferencia entera
  // entre los dos metodos y no se puede dejar implicita.
  // ARREGLO 120: ese recuadro se mudo a _htmlAvisoCalce() para poder
  // refrescarlo al teclear. Lo que prueba esta guardia no cambia.
  ok(/sin comisión de Binance/.test(sinCom(sacarFuncion("_htmlAvisoCalce"))),
     "la pantalla dice que no hay comision de Binance");
  ok(/_htmlAvisoCalce\(_rTx, ruta\)/.test(rn),
     "y rNueva lo dibuja desde ahi");
}

// ── ARREGLO 108 · «lo movió la app por error» ────────────────────────────
//
// Sus palabras: "¿que hago yo despues? mas adelante me van a salir errores
// por estar editando el saldo a mano". Tenia razon. Medido con su export,
// deshaciendo los dos saldos que el boton del banco le movio:
//
//    ahora, con los saldos rotos ...  sin explicar  1.057,98
//    corregir y poner "dedazo" .....                1.057,97  <- el error se
//                                                               queda dentro
//    corregir y poner "no se" ......                  918,58
//    corregir y poner "lo movio la app"               918,58  <- y sin aviso
//    el VERDADERO (sin apuntar nada)                  918,58
{
  const sinCom = t => t.replace(/\/\/[^\n]*/g, "");

  // El motivo existe y es un tipo propio: reusar "nose" daria el numero bueno
  // pero le dejaria un ⚠️ permanente, y ella SI sabe por que.
  ok(/"4": \{tipo:"appError",\s*txt:"Lo movió la app por error"\}/.test(HTML),
     "existe el motivo «lo movió la app por error»");
  ok(/"Escribe 1, 2, 3 o 4:"/.test(HTML), "y la pregunta lo ofrece");
  ok(/escribe 1, 2, 3 o 4\./.test(HTML), "y el aviso de «no entendí» tambien");

  // Ni cuenta como explicado (eso arrastraria el error dentro) ni avisa.
  const aj = sinCom(sacarFuncion("ajustesDesdeApertura"));
  ok(/if\(a\.tipo==="appError"\) return;/.test(aj),
     "no se da por explicado y no suma al aviso");
  // Y va ANTES del de "nose": detras, caeria en el contador del ⚠️.
  const iApp = aj.indexOf('a.tipo==="appError"'), iNose = aj.indexOf('a.tipo==="nose"');
  ok(iApp >= 0 && iNose >= 0 && iApp < iNose,
     "y se mira antes que «no sé por qué», o caeria en su aviso",
     "app " + iApp + " · nose " + iNose);

  // La aritmetica, con los tres tipos, sobre la misma cuenta.
  S.config = S.config || {};
  S.config.aperturaFecha = "2026-09-11"; S.config.aperturaTs = 0;
  S.cuentas = [{id:"c1", nombre:"BDV", moneda:"USDT", saldo:100, activa:true}];
  const unAjuste = (tipo) => {
    S.ajustesSaldo = [{id:"a1", fecha:"20/09/26", ts:Date.parse("2026-09-20"),
                       cuentaId:"c1", delta:-50, tipo:tipo, motivo:"x"}];
    return F.ajustesDesdeApertura("2026-09-11");
  };
  const d = unAjuste("dedazo"), nn = unAjuste("nose"), ap = unAjuste("appError");
  ok(d.total === -50 && d.nSinSaber === 0, "«dedazo» se da por explicado", d.total);
  ok(nn.total === 0 && nn.nSinSaber === 1, "«no sé» no se explica y avisa", nn.nSinSaber);
  ok(ap.total === 0 && ap.nSinSaber === 0, "«lo movió la app» ni se explica ni avisa",
     ap.total + " / " + ap.nSinSaber);
  // Que es lo mismo que si no se hubiera apuntado nada: ese es el punto.
  S.ajustesSaldo = [];
  const nada = F.ajustesDesdeApertura("2026-09-11");
  ok(ap.total === nada.total && ap.nSinSaber === nada.nSinSaber,
     "o sea: deja la conciliacion igual que si no se hubiera apuntado");
}

// ── ARREGLO 109 · una funcion de formato que NO EXISTE ───────────────────
//
// Sus palabras: "le doy a pegar el texto que extraigo de la imagen y le doy
// registrar y se queda como que no se registra nada".
//
// No era el pegado: saveIU() se caia con "f2n is not defined" en su ULTIMA
// linea —la del registro de auditoria— DESPUES de meter el lote y mover los
// saldos, y ANTES de saveData() y R(). Desde fuera no pasa nada: ni aviso,
// ni lote en la lista, ni error a la vista. Reproducido pegando un
// comprobante y pulsando Registrar:
//
//   ReferenceError: f2n is not defined   at saveIU (index.html:12172)
//   lotes creados: NINGUNO
//
// Habia 24 llamadas: 1 en saveIU y 23 en rTblUnificada (la pestaña
// Operaciones), que es la misma bomba sin estallar.
{
  // f2n existe y se porta como sus tres hermanas.
  ok(typeof F.f2n === "function", "f2n existe");
  // Con decimales las cuatro dan lo mismo y la comprobacion no discrimina:
  // hace falta un numero REDONDO, que es donde se ve el minimo de decimales.
  ok(F.f2n(1000) === F.f2(1000) && F.f2n(1234.5678) === F.f2(1234.5678),
     "f2n(x) formatea como f2", F.f2n(1000) + " / " + F.f2n(1234.5678));
  ok(F.f2n(1000, 0) === F.f0(1000) && F.f2n(1234.5678, 0) === F.f0(1234.5678),
     "f2n(x,0) como f0", F.f2n(1000,0) + " / " + F.f2n(1234.5678,0));
  ok(F.f2n(1000, 4) === F.f4(1000) && F.f2n(5.1636, 4) === F.f4(5.1636),
     "f2n(x,4) como f4", F.f2n(1000,4) + " / " + F.f2n(5.1636,4));

  // LA DE VERDAD: ninguna funcion de formato llamada en el archivo puede
  // faltar. Es la guardia que habria cazado esto sola — una llamada a algo
  // que no existe no se ve hasta que alguien pulsa el boton, y entonces se
  // lleva por delante media funcion sin decir nada.
  const sinCom = HTML.replace(/\/\/[^\n]*/g, "");
  const usadas = new Set();
  const re = /(^|[^.\w$])(f\d[A-Za-z0-9_]*)\s*\(/g;
  let m;
  while ((m = re.exec(sinCom)) !== null) usadas.add(m[2]);
  const faltan = [...usadas].filter(nom =>
    !new RegExp("function\\s+" + nom + "\\s*\\(").test(sinCom) &&
    !new RegExp("(?:var|let|const)\\s+" + nom + "\\s*=").test(sinCom));
  ok(faltan.length === 0,
     "todas las funciones de formato que se llaman existen",
     faltan.length ? "faltan: " + faltan.join(", ") : "revisadas " + usadas.size);
}


// ── ARREGLO 110 · la calculadora: cruce, P2P o mitad y mitad ───────────────
// Sus palabras del 11/10: "quiero que tambien me ayudes a saber cuanto es mi
// tope piso para yo cambiar de reais a bolivares, porque tengo que tomar en
// cuenta si en algun momento me toca hacer un P2P. No toda mi ganancia va a
// ser nada mas asi como eso. Entonces tiene que hacer mi sistema hibrido".
//
// Todas las tasas van en BOLIVARES POR REAL (ARREGLO 74). Lo unico que cambia
// entre cruzar y hacer P2P es el precio al que recupera el real, asi que los
// seis casos salen de UNA cuenta y los otros dos modos son esa misma igualdad
// despejada. Escribirlos como tres formulas sueltas es lo que hace que un modo
// diga una cosa y otro la contraria (34,27 arriba y 34,28 abajo en Por cobrar).
{
  // Sus numeros de la captura del 11/10.
  const M = 1000, ida = 188, V = 210, P = 201.49, USD = 5;
  const Kc = F._calceK(V, P, 1), Kp = F._calceK(V, P, 0), Km = F._calceK(V, P, 0.5);
  const gc = F._calceGan(M, ida, Kc), gp = F._calceGan(M, ida, Kp), gm = F._calceGan(M, ida, Km);

  ok(Math.abs(gc.brl - M*(V-ida)/V) < 1e-9,
     "cruzando, la ganancia en reales es M x (vuelta - ida) / vuelta",
     gc.brl.toFixed(4));
  // Su formula, tal y como la dio: G_VES = M_BRL x (T_Mercado - T_Cliente).
  ok(Math.abs(gc.ves - M*(V-ida)) < 1e-9,
     "y en bolivares es M x (vuelta - ida), su formula",
     gc.ves.toFixed(2));
  ok(Math.abs(gp.brl - M*(P-ida)/P) < 1e-9,
     "con P2P es la misma cuenta con el SUELO en el sitio de la vuelta",
     gp.brl.toFixed(4));
  // Cruzar no toca Binance, asi que se queda la brecha entera. Es justo lo que
  // ella explico: "si mas adelante tengo mas movimiento eso puede cambiar... y
  // no hacer el p2p".
  ok(gc.brl > gp.brl, "con estas tasas cruzar deja mas que el P2P",
     gc.brl.toFixed(2) + " vs " + gp.brl.toFixed(2));
  ok(gm.brl > gp.brl && gm.brl < gc.brl,
     "y el mixto queda entre los dos, nunca fuera", gm.brl.toFixed(2));

  // ── Los despejes son el INVERSO EXACTO del primer modo ─────────────
  // Si no lo fueran, la tasa que la app le diga no daria la ganancia que la
  // app le prometio en la pantalla anterior.
  [[1,"cruce"],[0,"P2P"],[0.5,"mitad y mitad"],[0.3,"cruzando 30%"]].forEach(function(par){
    const f = par[0], K = F._calceK(V, P, f), g = F._calceGan(M, ida, K).brl;
    ok(Math.abs(F._calceIda(M, g, K) - ida) < 1e-9,
       "despejar la ida devuelve la de partida (" + par[1] + ")");
    if (f > 0)
      ok(Math.abs(F._calceVuelta(M, ida, g, P, f) - V) < 1e-9,
         "y despejar la vuelta tambien (" + par[1] + ")");
  });
  // Y al reves: la tasa que saca cumple la meta al centimo.
  const meta = 20 * USD;
  const Vn = F._calceVuelta(M, ida, meta, P, 1);
  ok(Math.abs(F._calceGan(M, ida, F._calceK(Vn, P, 1)).brl - meta) < 1e-9,
     "la vuelta que calcula da exactamente la meta", Vn.toFixed(2));
  const In = F._calceIda(M, meta, F._calceK(V, P, 1));
  ok(Math.abs(F._calceGan(M, In, F._calceK(V, P, 1)).brl - meta) < 1e-9,
     "y la ida que calcula, tambien", In.toFixed(2));

  // ── El tope sale de la MISMA cuenta, con meta cero ─────────────────
  // "cuanto es mi tope piso para yo cambiar de reais a bolivares". Calcularlo
  // aparte seria una segunda respuesta a la misma pregunta.
  ok(Math.abs(F._calceIda(M, 0, Kc) - 1/Kc) < 1e-9 &&
     Math.abs(F._calceIda(M, 0, Kp) - P) < 1e-9,
     "el tope es la ida con meta cero: 1/K, y en P2P es su suelo",
     F._calceIda(M, 0, Kp));
  ok(F._calceGan(M, V, Kc).brl < 0,
     "ofreciendo justo el tope en la ida ya no gana nada, por encima pierde");

  // ── Lo que NO se puede inventar ────────────────────────────────────
  // Sin las dos tasas no hay suelo y no se inventa: un suelo optimista es peor
  // que ninguno, porque con el publica una tasa que no aguanta.
  ok(F._calceK(V, null, 0) === null, "sin suelo, el modo P2P no da numero");
  ok(F._calceK(null, P, 1) === null, "sin vuelta, el modo cruce no da numero");
  ok(F._calceK(null, P, 0.5) === null, "y al mixto le hacen falta LAS DOS");
  ok(F._calceK(V, P, 1.5) === null && F._calceK(V, P, -0.2) === null,
     "un % de cruce fuera de 0..100 no da numero");
  // La ganancia sale de los reales que entran, asi que no puede ser el monto
  // entero. Antes de esto el despeje devolvia 0 o un negativo con cara de tasa.
  ok(F._calceIda(M, M, Kc) === null && F._calceIda(M, M*2, Kc) === null,
     "no se puede ganar el monto entero, ni mas");
  ok(F._calceVuelta(M, ida, M, P, 1) === null,
     "una meta imposible no devuelve una tasa rara: devuelve nada");
  // El caso que solo aparece en el mixto: la parte que va por P2P ya se lleva
  // mas que la meta, asi que no hay vuelta que la salve aunque la meta sea
  // menor que el monto.
  ok(F._calceVuelta(M, ida, 900, P, 0.5) === null,
     "si la mitad en P2P ya se come la meta, no hay vuelta que valga");

  // ── El suelo lo lee de UN sitio ────────────────────────────────────
  const res = sacarFuncion("_htmlCalceRes");
  ok(/sueloQueManda\(\)/.test(res) && !/_equilibrio\(/.test(res),
     "la calculadora lee el suelo de sueloQueManda(), no lo recalcula");
  // Y cuando el suelo falta, lo dice: no cae a cero ni a un numero de ejemplo.
  ok(/No hay suelo todavía/.test(res),
     "y si no hay suelo lo dice, en vez de inventarse uno");

  // ── ARREGLO 32: teclear no puede repintar la pantalla ──────────────
  const cgSet = sinComentarios(sacarFuncion("_cgSet"));
  ok(!/\bR\(\)/.test(cgSet) && /getElementById\("cg-res"\)/.test(cgSet),
     "teclear refresca el resultado por su id, nunca con R()");
  ok(/_num\(val\)/.test(cgSet),
     "y el campo pasa por _num(): con el teclado en español 5,16 no se vuelve 516");
  // Un boton si cambia que campos se dibujan, pero tampoco usa R(): con R() se
  // pierde donde estaba mirando.
  const redib = sinComentarios(sacarFuncion("_cgRedibujar"));
  ok(!/\bR\(\)/.test(redib) && /getElementById\("cg-card"\)/.test(redib),
     "cambiar de modo rehace solo la tarjeta, por su id");
  ["_cgModo","_cgFuente"].forEach(function(nom){
    const f = sinComentarios(sacarFuncion(nom));
    ok(!/\bR\(\)/.test(f) && /_cgRedibujar\(\)/.test(f),
     nom + " rehace la tarjeta y no la pantalla entera");
  });

  // ── Los campos son de texto, que es lo que acepta la coma ──────────
  const cuerpo = sacarFuncion("_htmlCalceCuerpo");
  ok(/type='text' inputmode='decimal'/.test(cuerpo) && !/type='number'/.test(cuerpo),
     "ningun campo de la calculadora es type=number");
  ok((cuerpo.match(/oninput='_cgSet\(/g)||[]).length ===
     (cuerpo.match(/<input /g)||[]).length,
     "y todos los campos escriben con _cgSet, ninguno se lee con getElementById");

  // ── En P2P no hay vuelta que ajustar ──────────────────────────────
  // El retorno es su suelo y ella no lo pone. Un boton que no puede contestar
  // nada es peor que no tenerlo: es el mismo fallo del ARREGLO 98, dos sitios
  // para lo mismo con dos respuestas distintas.
  ok(/esP2P\?"":btn\("_cgModo","vuelta"/.test(cuerpo),
     "en P2P el boton de la tasa de vuelta no se dibuja");
  ok(/if\(v==="p2p" && g\.modo==="vuelta"\) g\.modo="ida";/.test(sacarFuncion("_cgFuente")),
     "y si estaba en ese modo, pasar a P2P la deja en uno que si contesta");

  // ── Lo que se puede rellenar solo, se rellena solo ────────────────
  // Su "USD/BRL 5,00" por omision es la tasa con la que la app YA valora todo
  // su dinero, no un numero de ejemplo: con un 5,00 inventado la meta en
  // dolares se convertiria mal a reales.
  const cg = sacarFuncion("_cg");
  // Anclado en la ASIGNACION, no en que tasaDeReferencia aparezca por ahi: la
  // prueba negativa pasaba poniendo usdbrl:"5" y dejando la linea de rc viva
  // pero sin usar. El nombre seguia ahi y la cuenta ya no — el mismo agujero
  // que el ARREGLO 100 tuvo que cerrar con la expresion entera.
  ok(/tasaDeReferencia\("BRL"\)/.test(cg) &&
     /usdbrl:\(\(rc&&rc\.tasa>0\)/.test(cg),
     "el USD/BRL arranca de su tasa de compra real, no de un 5,00 de ejemplo");
  ok(/_misTasasPublicadas\(\)/.test(cg),
     "y la ida y la vuelta arrancan de lo que publico");
  // Son valores de trabajo de ESTE aparato. Sincronizarlos haria que el monto
  // que teclea en el telefono le cambiara la pantalla de la PC a media cuenta
  // — y es un precio de hace un minuto, como la lectura del mercado.
  ok(!/DATA_KEYS = \[[^\]]*"calc"/.test(HTML),
     "y no viajan entre aparatos: calc no esta en DATA_KEYS");
}


// ── ARREGLO 111 · la pestaña de Tasas, sin lo repetido ────────────────────
// Sus palabras del 12/10: "quiero que la pestaña tasa no esté saturada".
// Medido antes de tocar: 2.493 px a 390 px (tres pantallas de teléfono), y el
// 53% era una SEGUNDA calculadora —los dos bloques de ruta mas la comision de
// Binance que solo existia para alimentarlos— que pedia teclear a mano lo que
// la app ya sabe. Es el ARREGLO 98 otra vez: una pantalla nueva que convive
// con el control viejo tiene que QUITARLO, no ponerse al lado.
{
  // Nada de la calculadora vieja puede volver. Se busca en el archivo SIN
  // comentarios: el comentario de este mismo arreglo nombra los campos que
  // quito, y buscandolos a secas la guardia fallaba por su propia explicacion.
  // Es el agujero del ARREGLO 100 al reves.
  const sinCom111 = HTML.replace(/\/\/[^\n]*/g, "");
  ["_calcResHTML","calcUpdate(","calcSet(","calcSetMargen(","calcObjetivoIda",
   "calcObjetivoVuelta","calcSetModoCalc","_htmlMercadoHoy","modoCalc",
   "tcCompraVuelta","tvVentaIda","margenVuelta"].forEach(function(nom){
    ok(sinCom111.indexOf(nom) < 0, "no queda nada de " + nom);
  });

  // ── La trampa que casi se cuela ───────────────────────────────────
  // El boton "Guardar como tasa de hoy" vivia DENTRO de esa calculadora y era
  // uno de los dos unicos sitios que escriben su tasa publicada —la que leen
  // el suelo, el conversor y el flyer—. Y _calcTasas() sacaba la tasa del
  // flyer de esos campos: quitando la pantalla y dejando la lectura, el flyer
  // habria impreso lo que ella tecleo en SEPTIEMBRE, sin decir nada. Un dato
  // que ya nadie actualiza no es un respaldo, es una trampa (ARREGLO 49).
  const ct = sacarFuncion("_calcTasas");
  ok(/_misTasasPublicadas\(\)/.test(ct),
     "_calcTasas sale de la tasa publicada, la misma que el suelo y la cabecera");
  ok(!/c\.tcCompra|c\.tvVenta|c\.margen|objetivoIda|objetivoVuelta/.test(ct),
     "y NO lee los campos viejos: el flyer no puede imprimir la tasa de septiembre");
  S.config = {tasasDia:{tdia_brl:188, tdia_ves_brl:210}};
  const tt = F._calcTasas();
  ok(tt.ida.ok && tt.ida.cliente===188 && tt.vuelta.ok && tt.vuelta.cliente===210,
     "lo que imprimiria el flyer es lo que ella publico", tt.ida.cliente+" / "+tt.vuelta.cliente);
  S.config = {};
  const tv = F._calcTasas();
  ok(!tv.ida.ok && !tv.vuelta.ok,
     "y sin tasa publicada no se inventa ninguna");

  // ── El % se calcula UNA vez ───────────────────────────────────────
  // Lo enseñan la cabecera y la tarjeta del suelo. Calculado dos veces, un
  // dia diferirian en una decima y no habria forma de saber cual mirar: es el
  // 34,27 arriba y 34,28 abajo de Por cobrar.
  const cab = sacarFuncion("_htmlPiePub");
  const sue = sacarFuncion("_htmlSuelo");
  ok(/margenSobreSuelo\(\)/.test(cab) && /margenSobreSuelo\(\)/.test(sue),
     "el pie de la tarjeta y el detalle leen el % de margenSobreSuelo()");
  const ms = sacarFuncion("margenSobreSuelo");
  ok(/\(Q\.v-mia\)\/Q\.v/.test(ms),
     "y la resta vive ahi");
  ok(!/-mia\)\/|mia\)\s*\/\s*base/.test(cab) && !/\(base-mia\)/.test(sue),
     "ninguno de los dos la vuelve a hacer por su cuenta");
  // Sin tasa publicada o sin suelo no hay porcentaje, y no se inventa: uno
  // inventado es justo el que la haria publicar mal.
  S.config = {}; S.inventarioUsdt = []; S.inventarioUsdt_cerrado = [];
  ok(F.margenSobreSuelo() === null, "sin suelo ni tasa publicada no hay %");

  // ── Una sola fila abierta a la vez ────────────────────────────────
  // Si se pudieran abrir todas, en dos semanas esta otra vez en tres
  // pantallas, que es de donde venimos.
  const ab = sinComentarios(sacarFuncion("_tasasAbrir"));
  ok(/S\._tasasAbierto\s*=\s*\(S\._tasasAbierto===id\)\s*\?\s*null\s*:\s*id;/.test(ab),
     "abrir una fila cierra la que estuviera abierta");
  // ARREGLO 32: con R() se rehace la pantalla y se pierde donde estaba mirando.
  ok(!/\bR\(\)/.test(ab) && /getElementById\("tasas-filas"\)/.test(ab),
     "y se rehacen solo las filas, por su id, nunca con R()");

  // ── La tasa publicada se escribe en la cabecera ───────────────────
  const st = sinComentarios(sacarFuncion("_setTasaPub"));
  ok(/_num\(val\)/.test(st),
     "la tasa pasa por _num(): con el teclado en español 188,5 no se vuelve 1885");
  ok(!/\bR\(\)/.test(st),
     "teclear no repinta la pantalla (ARREGLO 32)");
  // ARREGLO 136: y tampoco repinta el trozo DONDE VIVE EL CAMPO. Esto rehacia
  // "tasas-cab" entero con el input dentro, asi que el campo moria en el primer
  // caracter: medido contra la version desplegada, escribir "185" sobre un 187
  // dejaba 1817 y el foco en el BODY — y ese numero es el que leen el flyer, la
  // cotizacion y cada remesa nueva. Se refrescan solo las dos piezas que
  // dependen de la tecla, y el input no esta en ninguna.
  ok(/getElementById\("tpub-dif"\)/.test(st) && /getElementById\("tpub-pie"\)/.test(st),
     "teclear refresca la diferencia y el pie por su id");
  ok(!/getElementById\("tasas-publica"\)/.test(st) && !/getElementById\("tasas-cab"\)/.test(st),
     "y NO repinta el contenedor del campo, que es lo que lo mataba");
  const tabla = sacarFuncion("_htmlPublicaHoy");
  ok(/type='text' inputmode='decimal'/.test(tabla) && !/type='number'/.test(tabla),
     "y los campos son de texto, que es lo que acepta la coma");
  // Una sola puerta para guardar: la que tambien limpia el override del
  // conversor. Dos sitios escribiendo la tasa publicada acabarian divergiendo.
  ok(/guardarTasaCalcHoy\(dir, v, true\)/.test(sacarFuncion("_guardarTasaPub")),
     "y al soltar el campo se guarda por la puerta de siempre");
  // El suelo NO se escribe a mano: sale de sus lotes y del mercado, y
  // escribirlo seria "registra la operacion, no escribas el saldo" otra vez.
  // Anclado en QUIEN dibuja cada uno, no en contar "<input" en el codigo: el
  // campo es una plantilla que se usa dos veces, asi que contarla daba 1 y la
  // guardia fallaba midiendo otra cosa.
  ok(/_filaPub\("ida"/.test(tabla) && /_filaPub\("vuelta"/.test(tabla),
     "la ida y la vuelta son campos que se escriben");
  // ARREGLO 136: el suelo bajo al pie, pero la regla no cambia — sale de sus
  // lotes y del mercado, y escribirlo seria "registra la operacion, no
  // escribas el saldo" otra vez.
  const pie136 = sacarFuncion("_htmlPiePub");
  ok(/tu suelo/.test(pie136) && !/_filaPub\("suelo"/.test(tabla) && !/<input/.test(pie136),
     "y el suelo se dibuja, no se escribe");

  // ── La lectura del mercado refresca TAMBIEN la cabecera ───────────
  // Si no, el detalle se actualizaba y el numero grande de arriba se quedaba
  // con el viejo: dos suelos distintos en la misma pantalla. Y la fila del
  // detalle puede estar cerrada, con lo que la cabecera es lo unico que se ve.
  const rs = sacarFuncion("_refrescarSuelo");
  ok(/getElementById\("mercado-suelo"\)/.test(rs) && /getElementById\("tasas-publica"\)/.test(rs),
     "al llegar la lectura del mercado se refrescan el detalle Y la tarjeta");

  // ── Y no se perdio nada por el camino ─────────────────────────────
  const filas = sacarFuncion("_htmlFilasTasas");
  [["gan","_htmlCalceGan"],["suelo","_htmlSuelo"],["conv","_rConversorBCV"],
   ["flyer","generarFlyer"],["exo","_htmlRutasExoticas"]].forEach(function(par){
    ok(new RegExp('_tasasFila\\("'+par[0]+'"').test(filas) && filas.indexOf(par[1])>=0,
       "la fila «"+par[0]+"» sigue ahi y dibuja "+par[1]);
  });
  // El contenedor por el que _refrescarSuelo rehace el detalle tiene que
  // seguir existiendo dentro de su fila.
  ok(/id='mercado-suelo'/.test(filas),
     "y el detalle conserva el id por el que se refresca solo");
  S.config = {}; S.inventarioUsdt = []; S.inventarioUsdt_cerrado = [];
}


// ── ARREGLO 112 · los avisos de mover la tasa ─────────────────────────────
// Sus palabras del 11/10: "crees que me puedes dar un aviso cuando deba
// modificar las tasas, bien sea porque me llene de muchos Bs o me llene de
// muchos reales o la tasa del mercado cambio".
{
  // ── EL ERROR QUE CASI SE PUBLICA, y por eso esta guardia va primero ──
  // El primer intento sumo porMoneda[].enCuentas tal cual para sacar el
  // porcentaje. Pero enCuentas va en la moneda NATIVA: con su export sumo
  // 620.949 bolivares junto a 953 USDT y le dijo que tenia el 99,61% en
  // bolivares. El numero de verdad es 32,78%. Es el "$177,00" de Por cobrar
  // otra vez — la suma cruda de monedas distintas no es un numero.
  const av = sacarFuncion("avisoTasa");
  ok(/x\.usdtCuentas/.test(av) && !/x\.enCuentas/.test(av),
     "la concentracion se mide en USDT (usdtCuentas), nunca sumando monedas nativas");
  ok(/usdtCuentas:r2v\(x\.usdtCuentas\)/.test(sacarFuncion("capitalRealTotal")),
     "y usdtCuentas sale de capitalRealTotal, donde ya se hizo la conversion");
  // La RESERVA no cuenta: son bolivares que tampoco puede gastar en pagar una
  // ida, igual que lo prestado. Metida dentro, el porcentaje habla de dinero
  // que no se puede mover — y el aviso dice justo "para gastarlos".
  S.config={}; S.cuentasCobrar=[]; S.prestamos=[]; S.inventarioUsdt=[]; S.inventarioUsdt_cerrado=[];
  S.cuentas=[{id:"r",nombre:"RESERVA",moneda:"VES",saldo:900*TASAS.VES,activa:true,esReserva:true},
             {id:"u",nombre:"BIN",moneda:"USDT",saldo:100,activa:true}];
  const conRes = F.capitalRealTotal().porMoneda.find(x=>x.moneda==="VES");
  ok(conRes && conRes.usdtCuentas === 0 && conRes.enReserva > 0,
     "lo que esta en reserva no entra en usdtCuentas", conRes && conRes.usdtCuentas);
  ok(F.avisoTasa().filter(a=>a.id==="conc_ves").length === 0,
     "asi que 900 USDT en bolivares de RESERVA no disparan el aviso");

  // ── Los tres avisos, con sus numeros ──────────────────────────────
  // Lotes que dan un suelo de 200 exacto: 1.000 Bs de venta / 5 R$ de compra,
  // sin comision, para que los umbrales se puedan comprobar a mano.
  // El USDT va en el banco de pruebas a proposito: su reparto real es USDT
  // 62% / VES 33%, asi que una prueba con solo dos monedas al 50% hace que
  // las dos pasen de cualquier umbral y no prueba nada. El primer intento lo
  // tenia asi y fallaba por el fixture, no por el codigo.
  const montar = (saldoVes, saldoBrl, ida, saldoUsdt) => {
    S.config = {comision_binance:0, tasasDia:{tdia_brl:ida, tdia_ves_brl:210}};
    S.inventarioUsdt = [
      {id:"1760000000000",tipo:"compra",moneda:"BRL",montOrigen:5000,usdt:1000,restante:1000,fecha:"10/10",fechaIso:"2026-10-10",tasa:5},
      {id:"1760000001000",tipo:"venta",moneda:"VES",bs:1000000,usdt:1000,bsRestante:1000000,fecha:"10/10",fechaIso:"2026-10-10",tasa:1000}];
    S.inventarioUsdt_cerrado = [];
    // 1 USDT = 1.000 Bs y 5 R$, asi que estos saldos son USDT directos x mil / x5
    // Los saldos se escriben en USDT y se convierten con las tasas FALSAS del
    // banco de pruebas (TASAS: VES 200, BRL 5,4), no con las de los lotes de
    // arriba: capitalRealTotal usa el getRateToUsdt inyectado, mientras que el
    // suelo sale de tasaDeReferencia, que si mira los lotes. Son dos fuentes y
    // la prueba tiene que respetar cada una — convertir con 1.000 daba un 35,9%
    // donde el fixture queria un 10%.
    S.cuentas = [{id:"v",nombre:"VZLA",moneda:"VES",saldo:saldoVes*TASAS.VES,activa:true},
                 {id:"b",nombre:"PAG", moneda:"BRL",saldo:saldoBrl*TASAS.BRL,activa:true},
                 {id:"u",nombre:"BIN", moneda:"USDT",saldo:(saldoUsdt===undefined?800:saldoUsdt),activa:true}];
    S.cuentasCobrar=[]; S.prestamos=[]; S.histTasas={}; S.histSaldos={};
    // tasaDeReferencia mira PRIMERO la tasa fijada a mano y solo despues los
    // lotes (ARREGLO 49). Un resto de otra prueba aqui y los lotes de arriba
    // no se miran: medido, VES salia a 200 en vez de 1.000 y el porcentaje
    // era otro. Montar lotes sin limpiar esto es medir otra cosa.
    S.tasasDia={}; S._tasasDiaMeta={};
    // ARREGLO 132: este fixture aparca 100 USDT en bolivares, que con el umbral
    // real (200 R$) son ~500 y harian saltar el aviso del monto parado — y
    // estaria BIEN que saltara. Estas pruebas son de la regla del PORCENTAJE,
    // asi que aqui se sube el umbral a proposito para medir solo eso. La regla
    // nueva tiene su propio bloque, con sus dos lados.
    S.config.umbralBsReales=1e6;
  };
  const ids = () => F.avisoTasa().map(a=>a.id);

  // Suelo 200 y ofrece 188: +6% — dentro de lo normal, no dice nada. Y mitad
  // y mitad en cuentas, por debajo del 25%.
  montar(100, 100, 188);   // VES 10%, BRL 10% de 1.000 USDT en cuentas
  ok(ids().length === 0, "con todo en orden no sale ni un aviso", JSON.stringify(ids()));

  // Medido en sus 21 dias de histSaldos: su mediana en bolivares es 4,5% y su
  // maximo historico 32,6%. Con el umbral en 25 esto habria saltado UNA vez.
  ok(F._umbralAviso("conc") === 25, "el umbral de concentracion es 25%");
  montar(400, 100, 188, 100);   // 400 de 600: el 66% en bolivares
  ok(ids().indexOf("conc_ves") >= 0, "con dos tercios en bolivares avisa", JSON.stringify(ids()));
  const aVes = F.avisoTasa().find(a=>a.id==="conc_ves");
  // Las dos tasas SUBEN, y cada una por su motivo (ARREGLO 74: significan lo
  // contrario). Si alguna vez esto dice "baja", le esta diciendo que haga
  // entrar MAS bolivares teniendo de sobra.
  ok(/SUBE la ida/.test(aVes.texto) && /SUBE la vuelta/.test(aVes.texto),
     "y dice subir las DOS: la ida para gastarlos, la vuelta para frenarlos");
  // Reales de sobra NO es alarma: ella lo dijo, "tener reales parados no me
  // perjudica". Es que puede BAJAR la vuelta, porque no tiene que hacer P2P.
  montar(100, 400, 188, 100);
  const aBrl = F.avisoTasa().find(a=>a.id==="conc_brl");
  ok(aBrl && aBrl.nivel === "info" && /BAJAR la vuelta/.test(aBrl.texto),
     "sobrar reales no es alarma: es que puede bajar la vuelta");

  // El unico que cuesta dinero en cada remesa.
  montar(100, 100, 210);   // ofrece 210 con suelo 200
  const rojo = F.avisoTasa().find(a=>a.id==="bajo_suelo");
  ok(rojo && rojo.nivel === "rojo" && rojo.fijo === true,
     "ofrecer por encima del suelo es ROJO y va fijo arriba del panel");
  montar(100, 100, 197);   // +1,5%
  ok(ids().indexOf("margen_flojo") >= 0, "con +1,5% de margen avisa que queda poco");
  montar(100, 100, 175);   // +12,5%
  const ancho = F.avisoTasa().find(a=>a.id==="margen_ancho");
  ok(ancho && ancho.nivel === "info" && /SUBIR la ida/.test(ancho.texto),
     "con +12,5% dice que puede ofrecer mejor tasa");

  // ── El suelo se movio y su tasa se quedo ──────────────────────────
  // Medido en su export: de 182,23 el 15/09 a 199,16 el 11/10, +9,3%, con su
  // ida clavada en 188 todo el mes. El 15/09 estaba REGALANDO y no habia nada
  // que se lo dijera.
  montar(100, 100, 188);
  S.histTasas = {"2026-09-15":{BRL:5.1574, VES:946.44}};
  S.config.tasasDia.tdia_fecha = "2026-09-15";
  const ref = F._refSuelo();
  ok(ref && Math.abs(ref.suelo - 183.51) < 0.02 && /publicaste/.test(ref.txt),
     "se compara contra el suelo del dia en que publico", ref && ref.suelo);
  ok(ids().indexOf("mercado_movio") >= 0,
     "y si se movio mas del 5% lo dice", JSON.stringify(ids()));
  // Sin el sello no se calla: se compara contra el dia mas viejo de los 14
  // ultimos y se DICE que es eso. Un "se movio un 8%" sin decir desde cuando
  // no se puede perseguir.
  delete S.config.tasasDia.tdia_fecha;
  S.histTasas = {}; S.histTasas[F._diasIso ? F.td() : F.td()] = null;
  S.histTasas = {}; 
  const hace3 = new Date(new Date(F.td()+"T00:00:00").getTime()-3*86400000).toISOString().slice(0,10);
  S.histTasas[hace3] = {BRL:5.1574, VES:946.44};
  const ref2 = F._refSuelo();
  ok(ref2 && /hace 3 días/.test(ref2.txt),
     "sin el sello se compara contra el dia mas viejo de los 14 y se dice cual", ref2 && ref2.txt);
  // Y el sello se escribe al publicar: sin el, ese aviso no existe.
  ok(/S\.config\.tasasDia\.tdia_fecha=td\(\);/.test(sacarFuncion("guardarTasaCalcHoy")),
     "publicar una tasa apunta la fecha");

  // ── La clave: una notificacion por aviso DISTINTO ─────────────────
  // Lleva los numeros redondeados, asi que mientras la situacion siga siendo
  // la misma no vuelve a sonar. Una alarma que suena todos los dias en la
  // pantalla de bloqueo enseña a no leerlas (ARREGLO 101).
  montar(400, 100, 188, 100);
  const c1 = F.avisoTasa().find(a=>a.id==="conc_ves").clave;
  S.cuentas[0].saldo = 401*TASAS.VES;     // un pelin mas de bolivares
  const c2 = F.avisoTasa().find(a=>a.id==="conc_ves").clave;
  ok(c1 === c2, "un cambio pequeño NO cambia la clave: no vuelve a sonar", c1+" / "+c2);
  S.cuentas[0].saldo = 100*TASAS.VES; S.cuentas[1].saldo = 100*TASAS.BRL; S.cuentas[2].saldo = 800;
  ok(F.avisoTasa().length === 0, "y cuando se arregla, el aviso desaparece");

  // ── Donde se ven ──────────────────────────────────────────────────
  // El rojo arriba del panel, fuera del scroll (ARREGLO 62), y NO repetido
  // en la pestaña: dos avisos del mismo suceso se leen como dos sucesos.
  ok(/_htmlAvisoTasaFijo\(\)/.test(HTML), "el rojo se dibuja arriba del panel");
  ok(/nivel==="rojo"/.test(sacarFuncion("_htmlAvisoTasaFijo")),
     "y arriba solo va el rojo");
  ok(/nivel!=="rojo"/.test(sacarFuncion("_htmlAvisosTasa")),
     "y el bloque de Tasas no lo repite");
  // ARREGLO 32: teclear la tasa cambia el aviso, y se rehace por su id.
  const ra = sinComentarios(sacarFuncion("_refrescarAvisosTasa"));
  ok(!/\bR\(\)/.test(ra) && /getElementById\("tasas-avisos"\)/.test(ra),
     "los avisos se rehacen por su id, nunca con R()");
  ["_setTasaPub","_refrescarSuelo"].forEach(function(nom){
    ok(/_refrescarAvisosTasa\(\)/.test(sacarFuncion(nom)),
       nom + " rehace los avisos: si no, hablarian de la tasa anterior");
  });
  // Lo que escribe un nombre de cuenta no puede ejecutarse (ARREGLO 102).
  ok(/_escAud\(a\.titulo\)/.test(sacarFuncion("_htmlAvisosTasa")) &&
     /_escAud\(a\.texto\)/.test(sacarFuncion("_htmlAvisosTasa")),
     "el texto del aviso se escapa al dibujarlo");

  S.config={}; S.cuentas=[]; S.inventarioUsdt=[]; S.inventarioUsdt_cerrado=[]; S.histTasas={};
}


// ── ARREGLO 113 · lo que cazó ella en su teléfono el 12/10 ────────────────
// Su captura: arriba "TU IDA 188" y cuatro dedos mas abajo, en la misma
// pantalla, "Tasa de ida 188.86". Tres cosas en una foto.
{
  const cg = sacarFuncion("_cg");
  // 1 · La ida y la vuelta SIGUEN a la publicada. Se copiaban UNA vez, al
  // abrir la calculadora por primera vez, y ahi se quedaban congeladas.
  // Dos numeros para la misma cosa en la MISMA pantalla es el 34,27 contra
  // 34,28 de Por cobrar — y aqui el de abajo es con el que decide si le
  // conviene la tasa.
  ok(/if\(!g\.idaTocada\)/.test(cg) && /if\(!g\.vueltaTocada\)/.test(cg),
     "la ida y la vuelta siguen a la publicada mientras ella no las toque");
  ok(!/ida:\(pub\.ida/.test(cg) && !/vuelta:\(pub\.vuelta/.test(cg),
     "y ya no se copian una sola vez al crear el estado");
  // Tocarla la hace suya: probar una tasa que todavia no publica es para lo
  // que sirve esta calculadora.
  ok(/g\[campo\+"Tocada"\]=true;/.test(sacarFuncion("_cgSet")),
     "escribirla la hace suya y deja de seguir a la publicada");
  ok(/g\[campo\+"Tocada"\]=false;/.test(sacarFuncion("_cgSoltar")),
     "y hay como volver a la publicada");
  // Funcional: la sigue, deja de seguirla, y vuelve.
  S.calc = {}; S.config = {tasasDia:{tdia_brl:188, tdia_ves_brl:210}};
  ok(F._cg().ida === "188", "arranca en la publicada", F._cg().ida);
  S.config.tasasDia.tdia_brl = 193.5;
  ok(F._cg().ida === "193.5", "y la sigue cuando ella la cambia arriba", F._cg().ida);
  F._cgSet("ida", "188,86");
  S.config.tasasDia.tdia_brl = 200;
  ok(F._cg().ida === "188.86", "una vez tocada, ya no la sigue", F._cg().ida);
  F._cg().idaTocada = false;
  ok(F._cg().ida === "200", "y al soltarla vuelve a seguirla", F._cg().ida);

  // 2 · Y cuando no coinciden, se DICE. Una tasa distinta de la de arriba sin
  // explicacion es justo lo que la hizo preguntar cual mandaba.
  const cuerpo = sacarFuncion("_htmlCalceCuerpo");
  ok(/distinta de tu "\+clave\+" publicada/.test(cuerpo),
     "si la tocó y no coincide con la publicada, la pantalla lo dice");
  ok(/_cgSoltar\(/.test(cuerpo), "y ofrece volver a la publicada");

  // 3 · La coma decimal. _num() guarda "188.86" con punto a proposito
  // —detras hay cien parseFloat— pero ensenarselo asi en un campo donde ella
  // escribe con coma es pedirle que lea en dos idiomas.
  ok(/_escAud\(_coma\(g\[clave\]\)\)/.test(cuerpo) && /_escAud\(_coma\(g\.usdbrl\)\)/.test(cuerpo),
     "los campos de la calculadora se enseñan con coma");
  ok(/_escAud\(_comaCab\(val\)\)/.test(sacarFuncion("_htmlPublicaHoy")),
     "y los de la cabecera también: son los mismos números");
  // Lo que se guarda NO cambia: con punto, que es lo que lee parseFloat.
  ok(/_num\(val\)/.test(sacarFuncion("_cgSet")),
     "pero lo guardado sigue pasando por _num(), con punto");

  // 4 · El titulo, una sola vez. La fila que se abre ya dice "Cuanto gano con
  // esta tasa"; la tarjeta repetia "Cuanto ganas con esta tasa" justo debajo.
  // Las dos formas, la tilde literal y el escape: la prueba negativa metio el
  // titulo con \u00e1 y esta guardia, que solo miraba la tilde, lo dejo pasar.
  // Sin comentarios: el comentario de este mismo arreglo nombra el rotulo que
  // quito, y la guardia fallaba por su propia explicacion. Es el agujero del
  // ARREGLO 100, y ya van dos veces en esta sesion.
  ok(!/Cu(\u00e1|\\u00e1)nto gan\w+ con esta tasa/.test(sinComentarios(cuerpo)),
     "la tarjeta no repite el título que ya dice su fila");
  // La fila lo escribe con el escape \u00e1, no con la tilde literal, asi que
  // la guardia admite las dos formas: buscando solo una, pasaba con el rotulo
  // borrado.
  ok(/Cu(\u00e1|\\u00e1)nto gano con esta tasa/.test(sacarFuncion("_htmlFilasTasas")),
     "que lo sigue diciendo la fila");
  S.calc = {}; S.config = {};
}


// ── ARREGLO 114 · la notificación al teléfono ─────────────────────────────
// "quiero que esta notificación me llegue al teléfono no solo cuando yo abra
// la app". El service worker se prueba de verdad en Chromium servido por
// localhost; aqui van las guardias de lo que el navegador no puede enseñar.
{
  const SW = require("fs").readFileSync(__dirname + "/../sw.js", "utf8");

  // El service worker tiene que escuchar las dos cosas: la que la dibuja y
  // la que la abre. Sin notificationclick, tocarla no lleva a ningun lado.
  ok(/addEventListener\("push"/.test(SW), "el service worker escucha el push");
  ok(/addEventListener\("notificationclick"/.test(SW),
     "y tocarla abre la app");
  ok(/showNotification\(/.test(SW), "y la dibuja");
  // El contenido viaja CIFRADO de extremo a extremo por el propio protocolo,
  // asi que el texto va dentro del push. Un push vacio obligaria al service
  // worker a salir a buscar el texto a la API — justo lo que falla cuando no
  // hay cobertura, que es cuando mas falta hace.
  ok(/event\.data\.json\(\)/.test(SW), "lee el contenido que viene dentro");
  ok(/d\.titulo \|\| "Centro de Gestión"/.test(SW) && /d\.texto  \|\| /.test(SW),
     "y si viene roto no deja la pantalla de bloqueo en blanco");
  // La clave como tag: dos del mismo aviso se reemplazan en vez de apilarse.
  ok(/tag: d\.clave/.test(SW), "usa la clave como tag: no se apilan dos iguales");
  // El rojo cuesta dinero en CADA remesa, asi que ese no se va solo.
  ok(/requireInteraction: \(d\.nivel === "rojo"\)/.test(SW),
     "y el aviso rojo se queda en la pantalla hasta que lo toque");
  // No cachear sigue siendo obligatorio: un cache agresivo taparia el aviso
  // de version nueva, que es lo unico que saca a un aparato de su copia vieja.
  ok(/event\.respondWith\(fetch\(event\.request\)\)/.test(SW),
     "y el service worker sigue sin cachear nada");

  // ── Lo que se guarda para que el servidor lo reparta ──────────────
  // En el MISMO punto central que marca lo que se fusiona. Apuntarlo funcion
  // por funcion es el camino que ya fallo cuatro veces.
  const sd = sinComentarios(sacarFuncion("saveData"));
  ok(/_apuntarAvisoParaPush\(\);/.test(sd),
     "el aviso se apunta al guardar, en el punto central");
  const ap = sacarFuncion("_apuntarAvisoParaPush");
  ok(/avisoTasa\(\)/.test(ap) && !/_equilibrio\(/.test(ap),
     "y sale de avisoTasa(), no de una segunda cuenta");
  ok(/S\.avisoPush=null/.test(ap),
     "cuando no hay nada que decir, se borra: si no, el servidor repetiria el ultimo para siempre");
  ok(/clave:a\.clave/.test(ap) && /ts:Date\.now\(\)/.test(ap),
     "lleva su clave —para no sonar dos veces— y su hora —para que no suene algo viejo");
  // Sin esto no viaja y el servidor no lo ve nunca.
  ok(/DATA_KEYS = \[[\s\S]{0,1400}"avisoPush"/.test(HTML),
     "avisoPush esta en DATA_KEYS");
  // Y NO va en ninguna lista de fusion, a proposito: es dato derivado que se
  // recalcula en cada guardado, asi que gana el ultimo que lo calculo.
  ["_MERGE_FIELDS","_MERGE_OBJETOS","_MERGE_HISTORIAL","_MERGE_BLOQUES"].forEach(function(lista){
    ok(!new RegExp(lista+" = \\\\[[^\\\\]]*\"avisoPush\"").test(HTML),
       "avisoPush no va en " + lista + ": es derivado, gana el ultimo que lo calculo");
  });

  // ── El permiso se pide DENTRO del toque ───────────────────────────
  // Android exige un gesto reciente. Es el mismo fallo que ya costo el boton
  // de compartir (ARREGLO 84) y el respaldo del cierre (ARREGLO 91): medio
  // segundo despues, el permiso del toque ya caduco.
  const act = sinComentarios(sacarFuncion("activarAvisos"));
  ok(/^[\s\S]{0,400}Notification\.requestPermission\(\)/.test(act),
     "el permiso se pide nada mas tocar, sin nada lento por delante");
  ok(!/setTimeout/.test(act), "y sin un setTimeout por el medio");
  // Un fallo mudo obliga a adivinar, y adivinar ya costo tres diagnosticos
  // equivocados en una sesion.
  ok(/alert\("No se pudo activar: "\+/.test(act),
     "si falla, dice por que");
  ok(/denied/.test(act) && /Información de la aplicación/.test(act),
     "y si esta bloqueado dice donde se desbloquea, que no es desde aqui");

  // ── La tarjeta dice si PUEDEN llegarle, no solo si estan activadas ──
  // Un permiso que parece concedido y no entrega nada es peor que no tenerlo.
  const tar = sacarFuncion("_htmlAvisosTelefono");
  ok(/_pushSoportado\(\)/.test(tar) && /denied/.test(tar) && /_appInstalada\(\)/.test(tar),
     "la tarjeta distingue: no se puede, esta bloqueado, o falta activarlo");
  ok(/El de \\u201cel mercado se movió\\u201d no/.test(tar) ||
     /mercado se movió/.test(tar),
     "y dice cual de los avisos NO va a llegarle con la app cerrada");
}


// ── ARREGLO 115 · un solo sitio para los avisos al telefono ───────────────
// Habia DOS sistemas de notificacion, cada uno con su tarjeta de campana en
// Configuracion: ntfy y el del ARREGLO 114. Es el ARREGLO 98 otra vez. Y el
// canal de ntfy era PUBLICO —en ntfy.sh un canal no lleva contrasena— asi que
// por ahi salia, remesa por remesa, la ruta, el nombre del cliente y la
// ganancia.
{
  const sinCom115 = HTML.replace(/\/\/[^\n]*/g, "");
  // Nada de ntfy puede volver a ejecutarse. Se busca sin comentarios: los de
  // este arreglo lo nombran para explicar por que se fue.
  ["notificarNtfy","guardarCanalNtfy","ntfy-canal-inp","ntfy.sh",'_cfgAcc("ntfy"'].forEach(function(nom){
    ok(sinCom115.indexOf(nom) < 0, "no queda nada de " + nom);
  });
  // Y el dominio sale del candado de contenido: dejarlo abierto es dejar una
  // puerta por la que ya no pasa nadie (ARREGLO 104).
  const CAB = require("fs").readFileSync(__dirname + "/../_headers", "utf8");
  ok(CAB.indexOf("ntfy.sh") < 0, "ni el dominio en la cabecera de seguridad");
  // El canal no puede volver desde un aparato viejo. Mientras siga guardado,
  // sigue siendo un nombre que alguien puede usar para escuchar sus remesas.
  ok(/_CONFIG_PROHIBIDO = \[[^\]]*"ntfyCanal"/.test(HTML),
     "y el canal guardado se borra al llegar, como paso con modulos");

  // El aviso de remesa NO se pierde: cambia de via.
  const av = sacarFuncion("avisarAlTelefono");
  ok(/apiFetch\("\/push\/ahora"/.test(av),
     "la remesa registrada avisa por la via nueva, cifrada");
  ok(/excluir:excluir/.test(av) && /_PUSH_ESTADO\.sus&&_PUSH_ESTADO\.sus\.endpoint/.test(av),
     "y no le vuelve al aparato que la acaba de registrar");
  // Fire-and-forget: la remesa ya esta guardada y esto no puede estorbarlo.
  ok(/\.catch\(function\(\)\{\}\)/.test(av) && /try\{/.test(av),
     "si falla el aviso, el guardado no se entera");
  // Los dos sitios que avisaban siguen avisando.
  // Los dos sitios que avisaban siguen avisando, y la llamada tiene que ser
  // una INSTRUCCION suelta: contar cuantas veces aparece el nombre dejaba
  // pasar un "0&&avisarAlTelefono(...)", que la apaga sin quitarla.
  const sueltas = sinCom115.match(/\n  avisarAlTelefono\("/g) || [];
  ok(sueltas.length === 2,
     "siguen los dos avisos de remesa, y ninguno esta apagado con un &&",
     sueltas.length);
  ok(/\n  avisarAlTelefono\("\u{1F4B8} Remesa registrada"/u.test(sinCom115),
     "el de las remesas normales");
  ok(/\n  avisarAlTelefono\("\u{1F4B8} Remesa EE\.UU registrada"/u.test(sinCom115),
     "y el de las de EE.UU.");
}


// ── ARREGLO 116 · publicar desde donde la decide ─────────────────────────
// Sus palabras del 12/10: "al descargar el flayer la tasas no se cambian".
// No era el flyer. Reproducido: cambiando la tasa en la CABECERA el flyer
// sale con la nueva; cambiandola en la CALCULADORA sale con la anterior.
// Es correcto —el flyer imprime lo PUBLICADO— pero ella la teclea abajo, que
// es donde ve cuanto gana. El sitio donde decide y el sitio donde publica
// quedaron separados en el ARREGLO 111, cuando se fue el boton de "guardar
// como tasa de hoy" que vivia justo donde tecleaba.
{
  const pub = sinComentarios(sacarFuncion("_cgPublicar"));
  // Una sola puerta para escribir la tasa publicada: la de siempre, que es la
  // que tambien limpia el override del conversor.
  ok(/guardarTasaCalcHoy\(campo, v, true\)/.test(pub),
     "publicar pasa por guardarTasaCalcHoy, la puerta de siempre");
  ok(/g\[campo\+"Tocada"\]=false;/.test(pub),
     "y la tasa deja de ser 'suya': vuelve a seguir a la publicada, que ya es la misma");
  ok(/if\(!\(v>0\)\)/.test(pub), "no se publica una tasa vacia o cero");
  // ARREGLO 32: publicar cambia cuatro cosas de la pantalla y ninguna se
  // rehace con R(), que destruiria el campo bajo el dedo.
  const todo = sinComentarios(sacarFuncion("_refrescarTasasTodo"));
  ok(!/\bR\(\)/.test(pub) && !/\bR\(\)/.test(todo),
     "y no se repinta la pantalla entera");
  ["tasas-publica","tasas-filas"].forEach(function(id){
    ok(new RegExp('getElementById\\("'+id+'"\\)').test(todo),
       "se rehace " + id + " por su id");
  });
  ok(/_refrescarAvisosTasa\(\)/.test(todo) && /_cgRedibujar\(\)/.test(todo),
     "y tambien los avisos y la calculadora: publicar los cambia a los cuatro");

  // El enlace esta donde ya decia "volver", que es donde ella ve que no
  // coinciden.
  const cuerpo = sacarFuncion("_htmlCalceCuerpo");
  ok(/_cgPublicar\(/.test(cuerpo) && /publicar esta/.test(cuerpo),
     "el enlace de publicar sale al lado del de volver");

  // La fila del flyer dice CON QUE TASAS va a salir, y lo saca de la MISMA
  // fuente que el flyer: si se calculara aparte, la fila podria prometer una
  // tasa y el papel llevar otra.
  const pie = sacarFuncion("_pieFlyer");
  ok(/_misTasasPublicadas\(\)/.test(pie),
     "el pie del flyer sale de la misma fuente que el flyer");
  ok(/_calcTasas/.test(HTML) && /_misTasasPublicadas\(\)/.test(sacarFuncion("_calcTasas")),
     "y el flyer lee de ahi tambien");
  ok(/_pieFlyer\(\)/.test(sacarFuncion("_htmlFilasTasas")),
     "y la fila lo usa");
  // El rotulo va con el escape \u00ed en el archivo, no con la tilde literal:
  // buscando solo la tilde, la guardia pasaba con el texto borrado.
  ok(/todav(\u00ed|\\u00ed)a no has publicado ninguna tasa/.test(pie),
     "y si no hay ninguna publicada, lo dice en vez de prometer un papel vacio");

  // Funcional: teclear abajo, publicar, y el flyer cambia.
  S.calc = {}; S.config = {tasasDia:{tdia_brl:188, tdia_ves_brl:210}};
  ok(F._calcTasas().ida.cliente === 188, "el flyer saldria con 188");
  F._cgSet("ida", "201");
  ok(F._calcTasas().ida.cliente === 188 && F._cg().idaTocada === true,
     "tecleando abajo el flyer NO cambia todavia: eso es lo que ella vio");
  F._cgPublicar("ida");
  ok(F._calcTasas().ida.cliente === 201 && !F._cg().idaTocada,
     "y al publicar, si", F._calcTasas().ida.cliente);
  ok(/201/.test(F._pieFlyer()), "y la fila lo dice antes de pulsarlo", F._pieFlyer());
  S.calc = {}; S.config = {};
}


// ── ARREGLO 117 · la cotización lee la tasa que ella elige, y lo DICE ────
// Sus palabras: "tienes que hacer que también la parte de cotización al cliente
// lea también la tasa que yo elija".
//
// El numero ya la leia —medido: publica 201 y el conversor pasa de 188 a 201—.
// Lo que fallaba era lo de alrededor: el rotulo decia SIEMPRE "la que pusiste
// en Configuracion", el override tecleado en el propio conversor se quedaba
// puesto sin decirlo y sin vuelta, y habia que tocar dos veces para abrirlo.
{
  const org = sinComentarios(sacarFuncion("_origenTasaCotiza"));
  const fila = sinComentarios(sacarFuncion("_htmlTasaCotiza"));

  // 1) El numero y su rotulo salen del MISMO sitio. Antes el numero lo daba
  //    _getTasaClienteBRL() con su propia cadena de decision y el rotulo se
  //    escribia aparte en la pantalla: dos copias de la misma regla, y por eso
  //    el texto podia hablar de Configuracion mientras el numero venia de un
  //    override.
  ["_getTasaClienteBRL","_getTasaVueltaVESaBRL"].forEach(function(f){
    const c = sinComentarios(sacarFuncion(f));
    ok(/_origenTasaCotiza\("(ida|vuelta)"\)\.tasa/.test(c),
       f+" lee de _origenTasaCotiza, no de su propia cadena");
    ok(!/tdia_brl|tdia_ves_brl/.test(c),
       "y no vuelve a mirar tasasDia por su cuenta: " + f);
  });
  ok(/rotulo:/.test(org), "el rotulo sale de ahi tambien, con el numero");
  ok(/o\.rotulo/.test(fila), "y la fila lo pinta, no se escribe uno propio");

  // 2) El rotulo viejo mentia: la mandaba a Configuracion, donde ya no la pone.
  //    Anclado al marcado del conversor para que un comentario no lo salve.
  ok(!/la que pusiste en Configuraci(ó|\\u00f3)n/.test(sinComentarios(HTML)),
     "fuera el rotulo que la mandaba a Configuracion a buscar la tasa");

  // 3) Salirse de la publicada es una DECISION: no se teclea sin pedirlo, se
  //    ve mientras este puesta, y hay vuelta. Son los TRES valores del
  //    ARREGLO 67: a que cotiza, cual es la publicada y como se vuelve.
  ok(/_convOtraTasa\(/.test(fila), "para salirse de la publicada hay que pedirlo");
  ok(/_convVolverPublicada\(/.test(fila) && /volver a tu /.test(fila),
     "y hay boton para volver a la publicada");
  ok(/o\.pub/.test(fila), "que dice cual es esa publicada, no solo 'volver'");
  ok(/tasa suelta/.test(org), "y mientras este puesta, la pantalla lo dice");
  ["_convOtraTasa","_convVolverPublicada","_convSetOtra","_refrescarConversor"].forEach(function(f){
    ok(!/\bR\(\)/.test(sinComentarios(sacarFuncion(f))),
       "ARREGLO 32: " + f + " no repinta la pantalla entera");
  });
  // ARREGLO 55: la cifra grande tiene que seguir al campo mientras teclea. Si
  // solo se recalculan los montos, arriba se queda la tasa anterior y la
  // pantalla ensena dos numeros que no cuadran entre si.
  ok(/getElementById\("tasa-cotiza-"\+dir\)/.test(sinComentarios(sacarFuncion("_convSetOtra"))),
     "y la cifra grande se refresca en vivo, por su id");

  // 4) Un solo toque. El ARREGLO 111 ya puso la fila que se abre y se cierra;
  //    el acordeon viejo de dentro era un segundo control para lo mismo.
  ok(!/_convBcvAbierto/.test(HTML),
     "fuera el acordeon interno: la fila de Tasas ya es el acordeon (ARREGLO 98)");

  // 5) La VUELTA no se presta de la IDA. Las dos se escriben en Bs por real y
  //    significan lo contrario (ARREGLO 74): con la ida de 188 puesta de
  //    vuelta le entregaria mas reales de los que toca —su vuelta es 210— y
  //    perderia en cada operacion.
  ok(!/return _getTasaClienteBRL\(\);/.test(sinComentarios(HTML)),
     "sin vuelta publicada no se usa la de ida como respaldo");
  // Y entonces el mensaje al cliente no se arma: medido, decia "Tu recibes:
  // R$ 0,00", que un cliente lee como que no recibe nada.
  ok(/falta:"vuelta"/.test(sinComentarios(sacarFuncion("_msjCliente"))) &&
     /falta:"ida"/.test(sinComentarios(sacarFuncion("_msjCliente"))),
     "sin la tasa de ese sentido no se arma la cotizacion");
  ok(/msg\.falta/.test(sinComentarios(sacarFuncion("_copiarMsjCliente"))),
     "y el boton de copiar dice que falta, en vez de copiar un cero");

  // 6) UNA puerta para publicar la tasa. Habia cinco sitios escribiendo
  //    tdia_brl/tdia_ves_brl y solo dos pasaban por guardarTasaCalcHoy, que es
  //    quien sella tdia_fecha —de donde sale el aviso "tu suelo se movio un X%
  //    desde que publicaste" (ARREGLO 112)— y limpia el override.
  ["saveTasasConfig","guardarTasaHoyDirecto"].forEach(function(f){
    const c = sinComentarios(sacarFuncion(f));
    ok(/guardarTasaCalcHoy\(/.test(c), f + " publica por la puerta unica");
    ok(!/tasasDia\.tdia_brl\s*=/.test(c) && !/tasasDia\[k\]\s*=\s*[^;]*tdia_brl/.test(c),
       "y no escribe tdia_brl a pelo: " + f);
  });
  // Quien si puede escribirla directo: la puerta, y la cabecera mientras ella
  // teclea (el % de arriba depende de lo que acaba de escribir).
  {
    const sin = sinComentarios(HTML);
    const esc = (sin.match(/tasasDia(\.tdia_brl|\.tdia_ves_brl|\[dir==="ida"\?"tdia_brl":"tdia_ves_brl"\])\s*=/g)||[]);
    // Son TRES escrituras y ni una mas: las dos claves de guardarTasaCalcHoy
    // (ida y vuelta) y la del ternario de _setTasaPub, que es la cabecera
    // escribiendo mientras ella teclea —el % de arriba depende de eso—.
    ok(esc.length === 3,
       "solo la puerta y la cabecera escriben la tasa publicada",
       esc.length + " -> " + esc.join(" | "));
    ok(/tasasDia\.tdia_brl\s*=/.test(sinComentarios(sacarFuncion("guardarTasaCalcHoy"))) &&
       /tasasDia\.tdia_ves_brl\s*=/.test(sinComentarios(sacarFuncion("guardarTasaCalcHoy"))),
       "dos de ellas son las de la puerta");
    ok(/tasasDia\[dir==="ida"\?"tdia_brl":"tdia_ves_brl"\]\s*=/.test(sinComentarios(sacarFuncion("_setTasaPub"))),
       "y la tercera es la cabecera mientras teclea");
  }

  // 7) Los campos de dinero del conversor se comian la coma decimal, y su
  //    lector es la mitad que no se puede dejar a medias: en texto con un
  //    parseFloat detras, "1.500,50" se lee 1,5.
  ["conv-brl","conv-ves","conv-usd"].forEach(function(id){
    ok(new RegExp("<input id='"+id+"' type='text' inputmode='decimal'").test(HTML),
       id + " acepta la coma");
  });
  ["tdia_brl","tdia_vzla","tdia_usd","tdia_ves_brl","tdia_usd_brl"].forEach(function(k){
    ok(new RegExp("<input type='text' inputmode='decimal' id='tasa-"+k+"'").test(HTML),
       "tasa-" + k + " acepta la coma");
  });
  ["_convDesde","_msjCliente","_copiarMonto","saveTasasConfig","guardarTasaHoyDirecto"].forEach(function(f){
    const c = sinComentarios(sacarFuncion(f));
    ok(!/parseFloat\((el|elBrl|elVes|elUsd)\.value\)/.test(c) &&
       !/parseFloat\(\(document\.getElementById\("conv-/.test(c),
       "y su lector pasa por _leerNumero: " + f);
  });

  // Funcional, con el arnes: publica, se sale, vuelve.
  S.config = {tasasDia:{tdia_brl:188, tdia_ves_brl:210, tdia_fecha:F.td()}};
  S._convTasaOverride = null; S._convTasaOverrideVuelta = null;
  ok(F._getTasaClienteBRL() === 188 && F._getTasaVueltaVESaBRL() === 210,
     "cotiza con las dos publicadas");
  ok(/publicada hoy/.test(F._origenTasaCotiza("ida").rotulo),
     "y dice que son las de hoy", F._origenTasaCotiza("ida").rotulo);
  F.guardarTasaCalcHoy("ida", 201, true);
  ok(F._getTasaClienteBRL() === 201, "publica 201 y la cotizacion la sigue");
  F._convOtraTasa("ida"); F._convSetOtra("ida", "150");
  const o150 = F._origenTasaCotiza("ida");
  ok(F._getTasaClienteBRL() === 150 && o150.otra === true && o150.pub === 201,
     "una tasa suelta de 150 con la publicada de 201 al lado");
  ok(F._calcTasas().ida.cliente === 201,
     "y el flyer sigue con la publicada: lo que sale HACIA FUERA no es una cotizacion suelta");
  F._convVolverPublicada("ida");
  ok(F._getTasaClienteBRL() === 201 && S._convTasaOverride === null,
     "volver la devuelve a la publicada");
  // Sin vuelta publicada no hay vuelta, y no se presta la de ida.
  delete S.config.tasasDia.tdia_ves_brl;
  ok(F._getTasaVueltaVESaBRL() === 0 && F._origenTasaCotiza("vuelta").tasa === null,
     "sin vuelta publicada no hay vuelta", F._getTasaVueltaVESaBRL());
  S.config = {}; S._convTasaOverride = null; S._convTasaOverrideVuelta = null;
}


// ── ARREGLO 118 · la RESPUESTA de la calculadora tambien se publica ─────
// Sus palabras del 12/10: "por mas que edite los numeros en la parte de abajo
// para cuadrar la tasa, en la pestana principal de arriba, que es la que lee el
// flyer, nada que cambia - sigue estatico 188 210".
//
// Reproducido con sus numeros (500 / ida 189 / meta 20 / cruce): la calculadora
// contesta "COBRALE AL MENOS 236,64" y no habia NINGUN boton para publicarlo.
// El ARREGLO 116 solo puso "publicar esta" en los campos que ella ESCRIBE.
{
  const r   = sinComentarios(sacarFuncion("_cgTasaResultado"));
  const htm = sinComentarios(sacarFuncion("_htmlPublicarRes"));
  const res = sinComentarios(sacarFuncion("_htmlCalceRes"));

  // 1) El boton cuelga del numero grande, en los DOS modos que despejan tasa.
  ok((res.match(/_htmlPublicarRes\(\)/g)||[]).length === 2,
     "el boton sale en los dos modos que despejan una tasa",
     (res.match(/_htmlPublicarRes\(\)/g)||[]).length);

  // 2) La respuesta se calcula en UN sitio y la leen la pantalla y el boton.
  //    Calculada aparte en el boton, un redondeo distinto publicaria un numero
  //    que no es el que ella esta viendo (la regla del 34,27 contra 34,28).
  ["_cgPublicarRes","_cgPublicarPar","_htmlPublicarRes"].forEach(function(f){
    ok(/_cgTasaResultado\(\)/.test(sinComentarios(sacarFuncion(f))),
       f + " lee la respuesta de _cgTasaResultado");
    ok(!/_calceVuelta\(|_calceIda\(/.test(sinComentarios(sacarFuncion(f))),
       "y no la vuelve a despejar por su cuenta: " + f);
  });

  // 3) Publicar pasa por la puerta unica (ARREGLO 117): sella la fecha y
  //    limpia la tasa suelta del conversor.
  ["_cgPublicarRes","_cgPublicarPar"].forEach(function(f){
    const c = sinComentarios(sacarFuncion(f));
    ok(/guardarTasaCalcHoy\(/.test(c), f + " publica por la puerta unica");
    ok(!/tasasDia\./.test(c), "y no escribe la tasa a pelo: " + f);
    ok(!/\bR\(\)/.test(c), "ARREGLO 32: " + f + " no repinta la pantalla entera");
  });
  ok(/_refrescarTasasTodo\(\)/.test(sinComentarios(sacarFuncion("_cgSoltarTrasPublicar"))),
     "y se refresca la cabecera, los avisos, las filas y la calculadora");

  // 4) El modo "Ganancia" no despeja ninguna tasa: ahi no hay nada que publicar.
  ok(/modo!=="vuelta" && g\.modo!=="ida"/.test(r) || /g\.modo!=="vuelta"[\s\S]{0,40}g\.modo!=="ida"/.test(r),
     "en modo Ganancia no hay respuesta que publicar");

  // 5) Publicar SOLO la respuesta deja un par que no da la cuenta: la vuelta se
  //    despejo con la ida que ella TECLEO. Se dice, y se ofrece publicar las dos.
  ok(/desfase/.test(htm) && /_cgPublicarPar\(\)/.test(htm),
     "cuando la otra tasa no es la publicada, sale el boton de publicar las dos");
  ok(/sin casar/.test(htm),
     "y se explica por que, en vez de dejarle una pareja que no gana lo que dice");

  // 6) El tope es de IDA. Escrito "tu tope" a secas debajo de una vuelta de
  //    236,64 se lee como que esa vuelta pierde — y en la vuelta es al reves
  //    (ARREGLO 74). Anclado al marcado, que un comentario no repite.
  // ARREGLO 119: el tope sigue diciendo de que direccion habla, pero ahora con
  // la RUTA, que es como ella la lee. Anclado al marcado, no al texto suelto.
  // El tope se contradecia solo: "Tu tope en Brasil → Venezuela es 220 — la
  // vuelta que te dan", dos rutas en una frase sin decir que hace cada una.
  // Ahora dice LO QUE ES (lo mas que puede dar) y DE DONDE SALE.
  ok(/Lo m\\u00e1s que puedes dar en <b style='color:var\(--tit\)'>"\+_ruta\("ida"\)\.flechas/.test(HTML),
     "el tope dice en que ruta manda");
  ok(/que te dan en "\+_ruta\("vuelta"\)\.flechas/.test(HTML),
     "y de donde sale, que es la otra ruta");
  ok(!/en la ida y cobrando/.test(sinComentarios(HTML)),
     "y la frase de la cuenta ya no dice 'en la ida'");

  // Funcional, con el arnes: su caso exacto.
  S.calc = {}; S.config = {tasasDia:{tdia_brl:188, tdia_ves_brl:210}};
  F._cgModo("vuelta"); F._cgFuente("cruce");
  F._cgSet("monto","500"); F._cgSet("ida","189"); F._cgSet("meta","20"); F._cgSet("usdbrl","5.0327");
  const sol = F._cgTasaResultado();
  ok(sol && sol.dir === "vuelta" && Math.abs(sol.v - 236.64) < 0.01,
     "despeja la vuelta de su caso: 236,64", sol && sol.v);
  ok(F._misTasasPublicadas().vuelta === 210,
     "y la cabecera NO se mueve sola mientras teclea");
  F._cgPublicarPar();
  ok(F._misTasasPublicadas().ida === 189 && F._misTasasPublicadas().vuelta === 236.64,
     "publicar las dos las lleva a la cabecera",
     JSON.stringify(F._misTasasPublicadas()));
  ok(/189/.test(F._pieFlyer()) && /236,64/.test(F._pieFlyer()),
     "y el flyer saldria con las dos", F._pieFlyer());
  ok(F._getTasaClienteBRL() === 189 && F._getTasaVueltaVESaBRL() === 236.64,
     "y el conversor cotiza con ellas");
  ok(S.config.tasasDia.tdia_fecha === F.td(),
     "con su fecha sellada (ARREGLO 112)");
  ok(F._cg().idaTocada === false && F._cg().vueltaTocada === false,
     "y los campos dejan de ser 'suyos': ya son la publicada");
  // Sin meta no hay numero, y el boton no publica nada.
  F._cgSet("meta","");
  ok(F._cgTasaResultado() === null, "sin meta no hay respuesta que publicar");
  ok(F._htmlPublicarRes() === "", "y el boton no se dibuja");
  S.calc = {}; S.config = {};
}


// ── ARREGLO 119 · una puerta para el negativo, y la calculadora dice la RUTA ─
//
// a) El ARREGLO 101 dejo escrito "hay que buscar TODAS las copias" y se
//    buscaron cuatro. Quedaban NUEVE, y una era la lista de Balance de Cuentas:
//    ella vio un ⚠️ rojo sobre una tarjeta que debia 113 de un limite de 1.004,
//    con PagBank ya cuadrado contra el banco al centimo.
{
  const sin = sinComentarios(HTML);

  // LA guardia: nadie decide por su cuenta si un saldo esta mal. Si alguien
  // vuelve a escribirlo suelto, esto falla y le dice donde.
  {
    const permitidas = ["_saldoConProblema", "_deudaTarjeta"];
    const malas = [];
    [/saldo\s*\)\s*\|\|\s*0\s*\)\s*<\s*-?0/g, /\bsaldo\s*<\s*0/g, /\bs\s*<\s*0\b/g].forEach(function(re){
      let m;
      while ((m = re.exec(sin)) !== null) {
        // en que funcion cae
        let fn = "?";
        const fre = /^function ([A-Za-z_0-9]+)\(/gm;
        let f;
        while ((f = fre.exec(sin)) !== null) { if (f.index < m.index) fn = f[1]; else break; }
        if (permitidas.indexOf(fn) === -1) malas.push(fn + " @" + m.index);
      }
    });
    ok(malas.length === 0,
       "nadie decide por su cuenta si un saldo esta mal: solo _saldoConProblema",
       malas.join(", "));
  }

  // Y los sitios que lo preguntan, lo preguntan AHI.
  ["rCapitalTotal","rHistorialMeses","rConfigAdmin","rInformeCierre","rInventarioUsdt","_cuentasEnNegativo"]
    .forEach(function(f){
      ok(/_saldoConProblema\(/.test(sinComentarios(sacarFuncion(f))),
         f + " pregunta por la puerta unica");
    });
  // Los seis selectores de "de que cuenta sale el dinero".
  ok((sin.match(/_notaSaldoCuenta\(/g)||[]).length >= 7,
     "los selectores de cuenta leen _notaSaldoCuenta",
     (sin.match(/_notaSaldoCuenta\(/g)||[]).length);
  ok(!/\(s<0\?" \\u26a0\\ufe0f/.test(sin) && !/\(s<0\?" ⚠️/.test(sin),
     "y ninguno se escribe su propio ⚠️");

  // ARREGLO 95 por TERCERA vez: quitarle el ⚠️ a la tarjeta la dejaba pintada
  // en el MISMO verde que el dinero. Medido en Chromium: su -113,48 salia en
  // #31db7e, el verde de un saldo a favor. Una deuda no se puede gastar.
  {
    const fila = sinComentarios(sacarFuncion("rCapitalTotal"));
    ok(/item\.esTarjeta&&_deudaTarjeta\(item\)>0\)\?"var\(--avi\)"/.test(fila),
       "una deuda de tarjeta va en ambar, no en el verde del dinero");
    ok(/\\ud83d\\udcb3 debes/.test(fila),
       "y se dice con palabras que eso es lo que debe");
  }

  // Funcional, por los dos lados (la regla del ARREGLO 95 y 101).
  const tarj = {id:"t1", nombre:"TARJETA PAGBANK", moneda:"BRL", esTarjeta:true, limiteTarjeta:1004, saldo:-113.48};
  const banco= {id:"b1", nombre:"PAGBANK EMPRESA", moneda:"BRL", saldo:-113.48};
  ok(F._saldoConProblema(tarj) === false,
     "debiendo 113,48 de 1.004 la tarjeta NO avisa");
  ok(F._saldoConProblema(banco) === true,
     "pero un banco en -113,48 si avisa: eso no existe");
  ok(F._saldoConProblema(Object.assign({}, tarj, {saldo:-1200})) === true,
     "y pasada del limite, la tarjeta vuelve a avisar");
  ok(/debes/.test(F._notaSaldoCuenta(tarj)) && !/\u26a0/.test(F._notaSaldoCuenta(tarj)),
     "en el selector una tarjeta dice lo que debe, sin alarma", F._notaSaldoCuenta(tarj));
  ok(/d\u00e9ficit|déficit/.test(F._notaSaldoCuenta(banco, " \u26a0\ufe0f d\u00e9ficit")),
     "y un banco en negativo si sale marcado");
  ok(F._notaSaldoCuenta({saldo:500, moneda:"BRL"}) === "",
     "una cuenta sana no escribe nada");
  // Y la tarjeta se queda fuera del aviso de "una cuenta en negativo".
  S.cuentas = [tarj, {id:"b2", nombre:"BANCO", moneda:"BRL", saldo:-5}];
  ok(F._cuentasEnNegativo().length === 1 && F._cuentasEnNegativo()[0].id === "b2",
     "el aviso de arriba del panel sigue sin contar la tarjeta");
  // La foto de un mes cerrado no guarda si era tarjeta: se mira por su id.
  ok(F._saldoConProblema(F._cuentaDeFoto({cuentaId:"t1", saldo:-113.48})) === false,
     "un mes ya cerrado tampoco marca la tarjeta");
  S.cuentas = [];
}

// b) "ida" y "vuelta" eran MI vocabulario. Sus palabras: "lo que quiero saber
//    es cual es la que me esta sugiriendo de Brasil a Vzla y cual de Vzla a
//    Brasil".
{
  const sin = sinComentarios(HTML);
  ok(/Brasil \u2192 Venezuela|Brasil → Venezuela/.test(JSON.stringify(F._RUTA_DE.ida)),
     "la ida es Brasil → Venezuela", F._RUTA_DE.ida.corto);
  ok(/Venezuela \u2192 Brasil|Venezuela → Brasil/.test(JSON.stringify(F._RUTA_DE.vuelta)),
     "la vuelta es Venezuela → Brasil", F._RUTA_DE.vuelta.corto);
  // Quien da que, que es lo que no se podia deducir de "ida"/"vuelta".
  ok(/da reales/.test(F._ruta("ida").quien) && /entregas bol/.test(F._ruta("ida").quien),
     "y se dice quien da y quien recibe en la ida", F._ruta("ida").quien);
  ok(/da bol/.test(F._ruta("vuelta").quien) && /entregas reales/.test(F._ruta("vuelta").quien),
     "y en la vuelta", F._ruta("vuelta").quien);
  // La ruta vive en UN sitio: el resultado, el boton, los campos y el tope la leen.
  ["_htmlCalceRes","_htmlPublicarRes","_htmlCalceCuerpo"].forEach(function(f){
    ok(/_ruta\(/.test(sinComentarios(sacarFuncion(f))), f + " lee la ruta de _ruta()");
  });
  ok(!/Bs por real en la (ida|vuelta)/.test(sin),
     "no queda ningun 'Bs por real en la ida/vuelta' suelto");
  ok(!/"Tasa de ida"|"Tasa de vuelta"/.test(sin),
     "ni rotulos de campo escritos a mano");
  // El boton de publicar nombra la ruta, no "ida".
  ok(/Publicar "\+f2\(r\.v\)\+" en "\+rot/.test(sinComentarios(sacarFuncion("_htmlPublicarRes"))),
     "el boton de publicar nombra la ruta");
}


// ── ARREGLO 120 · el aviso del calce decia que no podia, calculando ──────
// Lo vio ella el 12/10 registrando una vuelta de 147.000 Bs: "⚠️ Sin la permuta
// y la tasa de venta no hay ganancia que calcular" con las dos escritas y con
// los USDT ya calculados justo debajo. upC() refrescaba los montos por su id y
// ese recuadro no tenia id, asi que se quedaba del ultimo repintado.
{
  const av = sinComentarios(sacarFuncion("_htmlAvisoCalce"));
  const up = sinComentarios(sacarFuncion("upC"));
  const rn2 = sinComentarios(sacarFuncion("rNueva"));

  // 1) Sale de UN sitio, y lo refrescan la pantalla y upC.
  ok(/_htmlAvisoCalce\(/.test(rn2), "rNueva dibuja el aviso desde la funcion");
  ok(/_htmlAvisoCalce\(res, ruta\)/.test(up), "y upC lo vuelve a dibujar al teclear");
  ok(/getElementById\("calce-nota-"\+key\)/.test(up),
     "por su id, como los montos (ARREGLO 55)");
  ok(/id='calce-nota-tx'/.test(HTML), "y el hueco existe en la pantalla");

  // 2) Lee de cTx(), no de variables sueltas de la pantalla (ARREGLO 98).
  ok(/res\.permuta>0 && res\.tv>0/.test(av),
     "decide con lo que devuelve cTx, no con las variables de la pantalla");
  ok(!/\btvAuto\b|\btcAuto\b/.test(av), "sin releer las de rNueva");

  // 3) Y dice CUAL falta. "Sin la permuta y la tasa de venta" con una puesta
  //    manda a revisar la que ya esta bien.
  ok(/la tasa de permuta y la de venta/.test(av) && /\bFalta \"\+falta/.test(av.replace(/\\u[0-9a-f]{4}/g,"")) || /Falta "\+falta/.test(av),
     "dice cual de las dos falta");

  // Funcional: los tres estados, con sus numeros del 12/10.
  // ARREGLO 124: esto se mide en la IDA. En la vuelta la permuta ya no se
  // teclea —es la tasa de la propia remesa— y el aviso dice otra cosa.
  const ruta = {orig:"BRL", dest:"VES"};
  const vacio = F._htmlAvisoCalce({calce:true, permuta:0, tv:0, tc:0}, ruta);
  const media = F._htmlAvisoCalce({calce:true, permuta:188.88, tv:0, tc:0}, ruta);
  const lleno = F._htmlAvisoCalce({calce:true, permuta:188.88, tv:5.09, tc:961.3992}, ruta);
  ok(/Falta/.test(vacio) && /permuta/.test(vacio) && /venta/.test(vacio),
     "sin nada escrito, pide las dos");
  ok(/Falta/.test(media) && /venta/.test(media) && !/permuta y/.test(media),
     "con la permuta puesta, pide solo la de venta", media.slice(0,120));
  ok(!/Falta/.test(lleno) && /961,3992|961\.3992/.test(lleno),
     "y con las dos, el aviso se va y sale el costo implicito", lleno.slice(0,160));
  ok(F._htmlAvisoCalce({calce:false, permuta:0, tv:0}, ruta) === "",
     "en P2P no se dibuja nada");

  // ── ARREGLO 124 · en la VUELTA el mismo aviso dice que es una COMPRA ──
  const vta = {orig:"VES", dest:"BRL"};
  const compra = F._htmlAvisoCalce(
    {calce:true, permuta:210, tv:5.09, tc:1068.9, am:147000, cant:700, tdia:210}, vta);
  ok(/COMPRA/.test(compra), "en la vuelta dice que es una compra, no una venta");
  ok(/210,00 Bs por real/.test(compra), "con la tasa de la propia remesa",
     (compra.match(/a <b>[^<]+<\/b>/)||[""])[0]);
  ok(/0,00/.test(compra) && /Ganar\u00e1s|Ganarás/.test(compra),
     "y explica por qué la ganancia sale 0,00");
  ok(!/permuta/i.test(compra), "sin hablar de permuta: ahí ya no hay campo");
  const vacia = F._htmlAvisoCalce({calce:true, permuta:0, tv:0, tc:0, am:0, tdia:0}, vta);
  ok(/Escribe el monto y la tasa/.test(vacia), "sin monto ni tasa, pide los dos");
  // Funcional + estructural: la funcional sola pasaba con la salida borrada,
  // porque sin lotes en la caja la sugerida sale null y devuelve "" igual.
  ok(F._htmlPermutaFuera({calce:true, permuta:999, tv:5, tc:1}, vta) === "",
     "y en la vuelta no sale el aviso de permuta fuera de rango");
  ok(/if\(ruta && ruta\.orig==="VES"\) return "";/
       .test(sinComentarios(sacarFuncion("_htmlPermutaFuera"))),
     "y la salida está escrita, no es que no haya lotes");
}

// ═══════════════════════════════════════════════════════════════════════
// ARREGLO 121 · por cada 500 reales, un solo numero, y la otra palanca
// ═══════════════════════════════════════════════════════════════════════
// Sus palabras del 12/10: "por cada 500 reales" y "no quiero que me satures la
// pantalla con tantas cosas, lo que no sirva o sea redundante quitalo".
{
  const cg   = sinComentarios(sacarFuncion("_cg"));
  const res  = sinComentarios(sacarFuncion("_htmlCalceRes"));
  const cue  = sinComentarios(sacarFuncion("_htmlCalceCuerpo"));
  const tres = sinComentarios(sacarFuncion("_cgTasaResultado"));
  const pal  = sinComentarios(sacarFuncion("_htmlPalancaVenta"));

  // 1) El por omision deja de ser el MAS OPTIMISTA de los tres.
  ok(/fuente:"p2p"/.test(cg), "la calculadora abre en P2P, no en cruce");
  ok(!/fuente:"cruce"/.test(cg), "y no queda ningun cruce por omision");
  ok(F._cg().fuente === "p2p", "medido: el estado nuevo nace en p2p", F._cg().fuente);

  // 2) La base vive en UN sitio (ARREGLO 122: el monto volvió, con 500 puesto).
  ok(F.CG_BASE === 500, "la medida por omisión son 500 reales", F.CG_BASE);
  ok(/campo\("monto","Por cada"/.test(cue), "el campo del monto se dibuja, y dice 'Por cada'");
  ok(/var M=_cgBase\(\)/.test(res) && /var M=_cgBase\(\)/.test(tres),
     "el resultado y el despeje leen la MISMA base, no cada uno la suya");
  ok(!/parseFloat\(g\.monto\)/.test(res) && !/parseFloat\(g\.monto\)/.test(tres),
     "y ninguno se lo lee del campo por su cuenta");
  {
    const gm=F._cg(), antesM=gm.monto;
    gm.monto="";    ok(F._cgBase()===500, "en blanco vuelve a 500, no a cero", F._cgBase());
    gm.monto="0";   ok(F._cgBase()===500, "y un cero tampoco lo deja en cero", F._cgBase());
    gm.monto="9000";ok(F._cgBase()===9000, "escribiendo 9.000 mide sobre 9.000", F._cgBase());
    gm.monto=antesM;
  }

  // 3) UN numero, en la unidad de la app. Los otros tres se fueron.
  ok(/USDT por cada "\+f0\(M\)\+" R\$/.test(res), "la respuesta va en USDT por cada 500 R$");
  ok(!/margen "\+f2\(mg\)/.test(res), "fuera el 'margen %', que se parecia al +X% de la cabecera");
  ok(!/En bolívares la ganancia son|En bolívares la ganancia son/.test(res),
     "fuera la ganancia repetida en bolivares");
  ok(!/"R\$ "\+f2\(Math\.abs\(r\.brl\)\)/.test(res), "y el numero grande ya no va en reales");
  ok(/du\(Math\.abs\(gu\)\)/.test(res), "el numero grande es el de USDT");

  // 4) La meta esta en su unidad.
  ok(/USDT por cada "\+f0\(_cgBase\(\)\)\+" R\$/.test(cue),
     "la meta se pide por cada tantos R$, y sigue al monto");
  ok(!/"en dólares"|"en dólares"/.test(cue), "ya no dice 'en dolares'");

  // 5) La otra palanca: vender mas caro en vez de bajarle al cliente.
  ok(/_htmlPalancaVenta\(I, K, f, vta, Q\)/.test(res), "el modo Tasa 🇧🇷→🇻🇪 dibuja la palanca");
  ok(/I\*K\/idaPub/.test(pal), "y sale de la MISMA K, no de una formula aparte");
  ok(/Q\.manda\.s\*sueloNec\/Q\.v/.test(pal),
     "la venta se escala con el suelo, sin volver a aplicar la comision");
  ok(/_misTasasPublicadas\(\)\.ida/.test(pal), "compara contra la ida que tiene PUBLICADA");
  ok(/!\(f<1\)/.test(pal), "y en cruce puro no se dibuja: ahi no hay venta que subir");

  // ── Funcional, con sus numeros del 12/10 ──
  const antes = JSON.stringify(S.calc || null);
  // Sus tasas del 12/10, puestas a mano: compra 5,0327 R$ y venta 1.013 Bs
  // fijada. De ahi sale el suelo de 199,87 que ensena su pantalla.
  const invPrev = S.inventarioUsdt, tdPrev = S._tasasDiaMeta, tdiaPrev = S.tasasDia;
  const cfgPrev = JSON.stringify(S.config || {});
  S.config = S.config || {};
  S.config.comision_binance = 0.007;
  S.config.tasasDia = {tdia_brl:189, tdia_ves_brl:220};
  S.inventarioUsdt = [
    {id:1, tipo:"compra", moneda:"BRL", fecha:"10/10", fechaIso:"2026-10-10",
     tasa:5.0327, usdt:100, neto:100, restante:100, montOrigen:503.27, comision:0}
  ];
  S._tasasDiaMeta = {VES:{fijada:true, iso:"2026-10-10", fecha:"10/10/2026"}};
  S.tasasDia = {VES:1013};
  const sueloV = F.sueloQueManda();
  ok(sueloV && Math.abs(sueloV.v - 199.87) < 0.02,
     "el suelo de sus numeros del 12/10 sale 199,87", sueloV && sueloV.v);
  {
    const g = F._cg();
    g.modo="gan"; g.fuente="p2p"; g.usdbrl="5.0327"; g.meta="";
    // ARREGLO 113: la ida sigue a la publicada mientras no se marque como suya.
    g.ida="189"; g.idaTocada=true; g.vuelta="220"; g.vueltaTocada=true;
    const salida = F._htmlCalceRes();
    ok(/Ganas/.test(salida), "con 189 en P2P dice que gana");
    ok(/USDT por cada 500 R\$/.test(salida), "y lo dice por cada 500 R$", 
       (salida.match(/>[^<]*USDT por cada[^<]*</)||[""])[0]);
    ok(!/margen/.test(salida), "sin el margen repetido");
    // El cruce es otro numero, y mas alto: por eso no puede ser el por omision.
    g.fuente="cruce"; g.vuelta="220";
    const cruz = F._htmlCalceRes();
    const num = t => { const m=t.match(/font-size:28px[^>]*>([^<]+)</); return m?m[1]:""; };
    ok(num(cruz) !== num(salida),
       "cruzando sale otro numero, que es justo lo que confundia", num(salida)+" vs "+num(cruz));
    g.fuente="p2p";
    // La palanca: pidiendo mas de lo que da su ida publicada, dice a cuanto
    // tendria que vender el USDT para no bajarsela al cliente.
    g.modo="ida"; g.meta="20";
    const ida20 = F._htmlCalceRes();
    ok(/O sin bajarle al cliente/.test(ida20),
       "y ofrece la otra palanca: vender mas caro en vez de bajar la tasa",
       (ida20.match(/O sin bajarle al cliente[^<]*(<[^>]+>)?[^<]*/)||[""])[0].slice(0,140));
  }
  S.inventarioUsdt = invPrev; S._tasasDiaMeta = tdPrev; S.tasasDia = tdiaPrev;
  S.config = JSON.parse(cfgPrev);
  if(antes !== null) S.calc = JSON.parse(antes); else delete S.calc;
}

// ═══════════════════════════════════════════════════════════════════════
// ARREGLO 121 · una variable que no existe se lee igual que una que si
// ═══════════════════════════════════════════════════════════════════════
// El 119 dejo "pasada" escrita en DOS sitios y declarada en ninguno, y llego a
// produccion: Inventario USDT y Configuracion tiraban un ReferenceError y se
// quedaban EN BLANCO para cualquiera que tenga una tarjeta. Ella la tiene.
//
// No lo cazo ninguna guardia porque todas miran que el texto diga lo que debe
// decir, y el texto lo decia. Lo cazo el barrido de las pestanas en Chromium —
// la misma leccion del ARREGLO 91: una guardia estructural comprueba el codigo,
// no que el camino funcione.
//
// Esto es lo que si se puede fijar desde aqui: que las cuatro variables de la
// tarjeta esten DECLARADAS en la funcion que las usa. Vale para la siguiente
// que alguien anada, no solo para "pasada".
{
  const DE_TARJETA = ["esTj", "deuda", "isNeg", "limTj"];
  ["rConfigAdmin", "rInventarioUsdt", "rCapitalTotal"].forEach(function(fn){
    const cuerpo = sinComentarios(sacarFuncion(fn));
    DE_TARJETA.forEach(function(v){
      const usa = new RegExp("[^\\w.\"']" + v + "\\b").test(cuerpo);
      if(!usa) return;
      const declarada = new RegExp("(var|let|const)\\s[^;\\n]*\\b" + v + "\\s*=").test(cuerpo);
      ok(declarada, fn + " declara '" + v + "' antes de usarla");
    });
  });
  // Y que no vuelva el nombre concreto que se colo.
  ["rConfigAdmin", "rInventarioUsdt"].forEach(function(fn){
    ok(!/[^\w.]pasada\b/.test(sinComentarios(sacarFuncion(fn))),
       fn + ": no queda ninguna 'pasada' suelta");
  });
}

// ═══════════════════════════════════════════════════════════════════════
// ARREGLO 122 · la cabecera habla su idioma, y el precio de cada tasa
// ═══════════════════════════════════════════════════════════════════════
// Sus palabras del 12/10, con las dos pantallas delante: "revisa el tema de las
// banderas en ambas direcciones, no sé si está correctamente expresada de Brasil
// a Venezuela, de Venezuela a Brasil con respecto a lo que yo coloco abajo y las
// banderas que están arriba".
//
// Los números estaban bien. Lo que no: la cabecera seguía diciendo "TU IDA" y
// "TU VUELTA" —las dos palabras que el 119 sacó de la calculadora por ser mi
// vocabulario y no el suyo— así que arriba se leía una cosa y abajo otra.
{
  const cab = sinComentarios(sacarFuncion("_htmlPublicaHoy"));
  const res2 = sinComentarios(sacarFuncion("_htmlCalceRes"));
  const cmp = sinComentarios(sacarFuncion("_htmlComparaTasa"));

  // 1) La cabecera nombra la RUTA, y por la misma tabla que la calculadora.
  ok(!/"Tu ida"|"Tu vuelta"/.test(cab), "la cabecera ya no dice 'Tu ida' ni 'Tu vuelta'");
  ok(/_ruta\(dir\)\.flechas/.test(cab), "el rótulo sale de _ruta(), la misma tabla del 119");
  // ARREGLO 136: y la tabla dice cuál columna es cuál, que es lo que faltaba.
  ok(/>TIENES</.test(cab) && /TE RECOMIENDO/.test(cab),
     "la tabla rotula las dos columnas: lo publicado y lo recomendado");
  ok(/_filaPub\("ida","le das"/.test(cab) && /_filaPub\("vuelta","te dan"/.test(cab),
     "y debajo dice quién da qué, que es lo que el símbolo no dice");
  ok(!/Escribe tu ida arriba/.test(cab), "ni el pie manda a 'escribir tu ida'");

  // 2) El precio de dar otra tasa. Las dos líneas salen de la MISMA cuenta.
  ok(/_cgGanUsdt\(/.test(cmp)===false, "_htmlComparaTasa solo dibuja: la ganancia se la dan hecha");
  ok(/_calceGan\(M, ida, K\)/.test(sinComentarios(sacarFuncion("_cgGanUsdt"))),
     "_cgGanUsdt sale de _calceGan, no de una fórmula propia");
  const vecesCmp=(res2.match(/_htmlComparaTasa\(/g)||[]).length;
  ok(vecesCmp===3, "la comparación sale en los tres modos", vecesCmp);
  ok(/g:_cgGanUsdt\(M, ida, _calceK\(pubV, suelo, f\), usd\)/.test(res2) &&
     /g:_cgGanUsdt\(M, ida, _calceK\(V, suelo, f\), usd\)/.test(res2),
     "en el modo de la vuelta cada lado entra con SU K, también el de la respuesta");
  ok(!/\{t:V, g:_cgGanUsdt\(M, ida, K, usd\)/.test(res2),
     "y no con la K de la vuelta tecleada, que es otra tasa");

  // 3) Funcional, con sus números del 12/10 (publica 171, teclea 189).
  const invP = S.inventarioUsdt, tdP = S._tasasDiaMeta, tdiaP = S.tasasDia;
  const cfgP = JSON.stringify(S.config || {});
  const calcP = JSON.stringify(S.calc || null);
  S.config = S.config || {};
  S.config.comision_binance = 0.007;
  S.config.tasasDia = {tdia_brl:171, tdia_ves_brl:220};
  S.inventarioUsdt = [{id:1, tipo:"compra", moneda:"BRL", fecha:"10/10", fechaIso:"2026-10-10",
    tasa:5.0327, usdt:100, neto:100, restante:100, montOrigen:503.27, comision:0}];
  S._tasasDiaMeta = {VES:{fijada:true, iso:"2026-10-10"}};
  S.tasasDia = {VES:1013};
  {
    const g=F._cg();
    g.modo="gan"; g.fuente="p2p"; g.usdbrl="5.0327"; g.meta=""; g.monto="9000";
    g.ida="189"; g.idaTocada=true; g.vuelta="220"; g.vueltaTocada=true;
    const t=F._htmlCalceRes();
    ok(/por cada 9\.000 R\$/.test(t), "con 9.000 en el campo, mide sobre 9.000 R$",
       (t.match(/por cada [\d.]+ R\$/)||[""])[0]);
    ok(/publicada\)/.test(t) && /(MÁS|MENOS)/.test(t),
       "y dice cuánto gana contra la que tiene publicada",
       (t.match(/A <b[^>]*>[^<]+<\/b>[^|]{0,120}/)||[""])[0].replace(/<[^>]+>/g,""));
    // 189 da MÁS bolívares por real que 171, así que gana MENOS — y esto es
    // justo el ARREGLO 74: en la 🇧🇷→🇻🇪 ella ENTREGA bolívares, cuantos más dé
    // peor para ella. Escrito al revés, esta línea le diría que suba la tasa.
    ok(/MENOS/.test(t) && !/MÁS<\/b>/.test(t),
       "dando 189 en vez de su 171 publicada, gana MENOS: más bolívares por real");
    // Y con la publicada escrita, no hay nada que comparar.
    g.ida="171";
    ok(!/publicada\)/.test(F._htmlCalceRes()),
       "escribiendo la misma que publica, la línea no sale");
  }
  S.inventarioUsdt=invP; S._tasasDiaMeta=tdP; S.tasasDia=tdiaP;
  S.config=JSON.parse(cfgP);
  if(calcP!==null) S.calc=JSON.parse(calcP); else delete S.calc;
}

// ═══════════════════════════════════════════════════════════════════════
// ARREGLO 123 · la permuta sale de los lotes, y el margen se cuenta UNA vez
// ═══════════════════════════════════════════════════════════════════════
// Sus palabras del 13/10: "¿cómo yo me voy a acordar a qué tasa me entraron esos
// bolívares? Eso me lo debería dar el mismo sistema, según por el orden FIFO".
{
  const sug  = sinComentarios(sacarFuncion("_permutaSugerida"));
  const pcp  = sinComentarios(sacarFuncion("_prConPermuta"));
  const met  = sinComentarios(sacarFuncion("_ponerMetodoTx"));
  const fuera= sinComentarios(sacarFuncion("_htmlPermutaFuera"));
  const av   = sinComentarios(sacarFuncion("_htmlAvisoCalce"));

  // 1) Sale de las dos funciones que YA valoran su dinero, no de una cuenta propia.
  ok(/getAutoRates\(/.test(sug), "_permutaSugerida lee las tasas de getAutoRates");
  ok(/tasaDeReferencia\("VES"\)/.test(sug) && /tasaDeReferencia\("BRL"\)/.test(sug),
     "y cae en tasaDeReferencia cuando un lado no tiene lotes");
  ok(/ves\/brl/.test(sug), "la permuta es Bs por USDT entre reales por USDT");
  ok(/isVzla \? null : rates\.tv/.test(sug) && /isVzla \? rates\.tv : rates\.tc/.test(sug),
     "cada lado sale de donde de verdad viene: lo que entrega, de sus lotes");

  // 2) La simulación devuelve el campo pase lo que pase.
  ok(/finally\{\s*S\.tx\.permuta=antes;/.test(pcp),
     "_prConPermuta devuelve la permuta en un finally: mirar no es aplicar");
  ok(/return cTx\(\)\.pr/.test(pcp), "y la ganancia sale de cTx(), la que se guarda");

  // 3) Se rellena sola, pero no pisa lo que ella escribió.
  ok(/_permutaSugerida\(S\.tx, ruta\)/.test(met), "al elegir calce el campo sale relleno");
  ok(/if\(!\(parseFloat\(S\.tx\.permuta\)>0\)\)/.test(met),
     "y solo si está vacío: si ella escribió una, manda la suya");

  // 4) El aviso, con los tres valores.
  ok(/_htmlPermutaFuera\(res, ruta\)/.test(av), "el aviso del calce lo dibuja");
  ok(/_prConPermuta\(sug\)/.test(fuera), "y compara contra la ganancia de la sugerida");
  ok(/_usarPermutaSugerida\(\)/.test(fuera), "con un botón para usarla");
  ok(!/\bR\(\)/.test(sinComentarios(sacarFuncion("_usarPermutaSugerida"))),
     "que no repinta la pantalla (ARREGLO 32)");

  // El CRUCE CERRADO —que es la prueba de que el margen se cuenta una sola vez—
  // se mide en Chromium, con la app entera cargada: aqui cTx() necesita getRUTAS
  // y media docena de constantes mas, y una caja que hay que rellenar a medias
  // prueba menos que el navegador. Lo que si se fija aqui es la FORMA de la
  // cuenta, que es por donde se rompe: si cTx deja de despejar tc desde la
  // permuta, los numeros del navegador dejan de significar lo que se midio.
  {
    const ct = sinComentarios(sacarFuncion("cTx"));
    ok(/tc = \(_permuta>0 && tv>0\) \? \(isVzla \? _permuta\*tv : tv\/_permuta\) : 0/.test(ct),
       "en calce la tasa de compra se despeja de la permuta, cada ruta por su lado");
    ok(/comUc = 0; comUv = 0;/.test(ct), "y sin comisión de Binance, que en un calce no se paga");
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ARREGLO 124 · en la VUELTA no se gana: se COMPRA
// ═══════════════════════════════════════════════════════════════════════
// Sus palabras del 13/10: "apuntar la ganancia por adelantado es como también
// inflar la ganancia". Cuando entran bolívares y salen reales no ha ganado
// nada: ha cambiado una cosa por otra. Gana al soltar esos bolívares.
{
  const ct  = sinComentarios(sacarFuncion("cTx"));
  const met = sinComentarios(sacarFuncion("_ponerMetodoTx"));
  const rn  = sinComentarios(sacarFuncion("rNueva"));

  // 1) La permuta de la vuelta sale de la propia remesa, no de un campo.
  ok(/var _permuta = _calce \? \(isVzla \? td2 : \(parseFloat\(f\.permuta\)\|\|0\)\) : 0;/.test(ct),
     "en la vuelta la permuta ES la tasa de la remesa; en la ida se teclea");
  ok(!/_permuta = _calce \? \(parseFloat\(f\.permuta\)\|\|0\)/.test(ct),
     "y ya no se lee el campo en los dos sentidos");

  // 2) El campo no se dibuja en la vuelta, y no se rellena uno que no existe.
  ok(/\(ruta\.orig==="VES" \? "" :/.test(rn),
     "el campo de la permuta no se dibuja en la vuelta");
  ok(/if\(ruta && ruta\.orig==="VES"\)\{ S\.tx\.permuta=""; \}/.test(met),
     "y al elegir calce en la vuelta se deja vacío, no se rellena");

  // 3) La cuenta: con permuta = tdia, lo que entra vale lo que costó lo que
  //    salió, así que la ganancia es 0. Eso es la DEFINICIÓN de comprar.
  //    Comprobado con la fórmula del propio cTx, sin tocar nada:
  //      uc = am/(tdia*tv)   uv = (am/tdia)/tv   →   uc = uv
  {
    const am=147000, tdia=210, tv=5.09;
    const uc = am/(tdia*tv), uv = (am/tdia)/tv;
    ok(Math.abs(uc-uv) < 1e-9,
       "con la tasa de la remesa, lo que entra vale lo que costó lo que sale",
       uc.toFixed(4)+" vs "+uv.toFixed(4));
    // Y el lote de bolívares nace valiendo esos reales: su costo de verdad.
    ok(Math.abs((am/uc) - tdia*tv) < 1e-6,
       "el lote nace a tdia×tv Bs/USDT, que son los reales que salieron",
       (am/uc).toFixed(2));
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ARREGLO 125 · de dónde salen los bolívares, y las tasas en SU unidad
// ═══════════════════════════════════════════════════════════════════════
// Sus palabras del 13/10: "de qué forma lo podemos trabajar cuando haya dinero
// de ambos lados, o sea allá en bolívares por ventas de USDT o porque yo compré
// bolívares" y "tienen unas tasas raras ahí, a mí eso me crea confusión".
//
// El FIFO ya mezclaba bien. Lo que faltaba era PODER VERLO. Y el peligro de
// enseñarlo es que la lista y la tasa de arriba se calculen por separado: con
// el primer redondeo dirían cosas distintas (el 34,27 contra el 34,28). Por eso
// el recorrido se escribe UNA vez, en _repartoFIFO, y las dos lo leen.
console.log("\nARREGLO 125 · de dónde salen los bolívares");
{
  const inv = S.inventarioUsdt, tx = S.tx, mon = S.monedas;
  S.inventarioUsdt = [
    { id:1, tipo:"venta", moneda:"VES", fecha:"10/10", usdt:100, bs:95000,  bsRestante:95000,  tasa:950, cuentaDestinoId:"bdv" },
    { id:2, tipo:"venta", moneda:"VES", fecha:"11/10", usdt:100, bs:101000, bsRestante:101000, tasa:1010, cuentaDestinoId:"bdv" }
  ];

  // 1) Reparte en orden FIFO: primero el viejo, y el nuevo solo lo que falte.
  const r = F._repartoFIFO("VES", 147000, "bdv");
  ok(r.filas.length === 2, "con dos lotes el reparto son dos filas", r.filas.length);
  ok(r.filas[0].tasa === 950 && r.filas[0].usa === 95000,
     "el lote viejo entero primero (FIFO)", r.filas[0].usa);
  ok(r.filas[1].tasa === 1010 && r.filas[1].usa === 52000,
     "y del nuevo solo lo que falta", r.filas[1].usa);
  ok(Math.abs(r.filas.reduce((a,f)=>a+f.usa,0) + r.rest - 147000) < 1e-6,
     "lo repartido más lo que falta es exactamente lo pedido");
  ok(r.rest < 0.01, "y con lotes de sobra no falta nada", r.rest);

  // 2) LA GUARDIA QUE IMPORTA: la lista y la tasa de arriba no se pueden
  //    separar. La tasa ponderada tiene que salir de esta misma suma.
  const tp = F.getTasaVentaPonderada("VES", 147000, "bdv");
  const dePartes = Math.round((147000 / r.filas.reduce((a,f)=>a+f.usdt,0)) * 10000) / 10000;
  ok(tp === dePartes,
     "la tasa ponderada es exactamente la que sale de las filas que se enseñan",
     tp + " vs " + dePartes);

  // 3) Cuando NO alcanza, se dice. Registrar una entrega sin lotes que la
  //    cubran deja la ganancia calculada contra una tasa prestada.
  const corto = F._repartoFIFO("VES", 300000, "bdv");
  const pres = corto.filas.filter(f => f.prestada);
  ok(pres.length === 1 && Math.abs(pres[0].usa - 104000) < 1e-6,
     "con 196.000 en lotes y 300.000 pedidos, los 104.000 que faltan son una fila",
     pres.length ? pres[0].usa : "(ninguna)");
  ok(pres.length === 1 && pres[0].tasa === 1010,
     "valorada a la tasa de la última operación, que es lo que hacía siempre",
     pres.length ? pres[0].tasa : "-");
  ok(corto.rest < 0.01,
     "y así no queda nada fuera de la lista: lo que se valora, se enseña", corto.rest);
  // Y la tasa sigue saliendo de la MISMA suma, tambien cuando no alcanza. Esto
  // es lo que se separaba: la lista decia 1.010,36 y la cuenta usaba otra cosa.
  const tpCorto = F.getTasaVentaPonderada("VES", 300000, "bdv");
  const dePartesCorto = Math.round((300000 / corto.filas.reduce((a,f)=>a+f.usdt,0)) * 10000) / 10000;
  ok(tpCorto === dePartesCorto,
     "cuando no alcanza, la tasa también es la de las filas que se enseñan",
     tpCorto + " vs " + dePartesCorto);
  const htmlCorto = F._htmlDeDondeSalen({ cant:300000, tdia:189 }, { orig:"BRL", dest:"VES" });
  ok(/sin lote/.test(htmlCorto), "y la pantalla lo avisa antes de guardar");
  ok(/104\.000/.test(htmlCorto), "con el número que no sale de ningún lote");
  ok(/tasa prestada/.test(htmlCorto), "y diciendo que esa tasa es prestada");
  // Y el aviso de abajo, que es el que dice QUÉ HACER. La fila sola no basta:
  // enseña el número, no que hay algo que registrar.
  ok(/Registra la compra o venta de USDT/.test(htmlCorto),
     "y el aviso dice qué hacer, no solo que falta");
  // La tasa con la que se valora esa parte sigue estando a la vista, en su
  // fila. No se repite en el aviso: decírla dos veces es lo que saturaba.
  ok(/1\.010,00/.test(htmlCorto) || /1010/.test(htmlCorto),
     "y la tasa prestada se ve en la fila");
  ok(!/se están valorando a/.test(htmlCorto),
     "sin repetirla también en el aviso");

  // 4) La traducción a Bs/real es una DIVISIÓN por su tasa de compra de reales.
  //    Multiplicarla daría un número 26 veces más grande y creíble.
  S.inventarioUsdt.push({ id:3, tipo:"compra", moneda:"BRL", fecha:"11/10", usdt:100, monto:509, restante:509, tasa:5.09, cuentaDestinoId:"bin" });
  const bpr = F._bsPorReal(1010);
  ok(bpr !== null && Math.abs(bpr - 198.43) < 0.01,
     "1.010 Bs/USDT con reales a 5,09 son 198,43 Bs por real", bpr);

  // 5) Sin tasa de reales no se inventa un número: no se escribe nada.
  S.inventarioUsdt = S.inventarioUsdt.filter(x => x.moneda !== "BRL");
  if (S.tasasDia) S.tasasDia.BRL = "";
  ok(F._bsPorReal(1010) === null, "sin tasa de reales no hay traducción, y no se inventa");

  // 6) Un lote de REALES no se traduce a Bs/real: ya está en reales. Dividirlo
  //    por la tasa de compra de reales daría un "≈ 1,01 Bs/real" sin sentido.
  S.inventarioUsdt = [
    { id:1, tipo:"venta", moneda:"BRL", fecha:"10/10", usdt:100, bs:509, bsRestante:509, tasa:5.09, cuentaDestinoId:"pag" }
  ];
  const htmlBrl = F._htmlDeDondeSalen({ cant:400, tdia:0 }, { orig:"VES", dest:"BRL" });
  ok(htmlBrl !== "" && !/Bs\/real/.test(htmlBrl),
     "en los lotes de reales no se escribe ningún Bs/real");

  // ── No saturar: un número una vez ──────────────────────────────────────
  // Sus palabras del 13/10: "no saturar ninguna pestaña". Con un solo origen
  // la traducción por fila no compara nada y el pie ya la dice: medido, el
  // mismo 200,76 salía cuatro veces en 166 px.
  // Hace falta tasa de reales: sin ella no hay traducción que contar.
  // Y el lote se arma aquí: `L` ya es `_leerNumero` en este archivo, así que
  // reusar ese nombre dejó un número donde debía haber un lote — una prueba
  // que pasaba sin probar nada, y sin dar error.
  const LOTE = function(id,fecha,tasa,bs){ return {id:id,tipo:"venta",moneda:"VES",fecha:fecha,usdt:bs/tasa,bs:bs,bsRestante:bs,tasa:tasa,cuentaDestinoId:"bdv"}; };
  S.inventarioUsdt = [ LOTE(1,"10/11",1000,100000), { id:77, tipo:"compra", moneda:"BRL", fecha:"10/11", usdt:100, monto:509, restante:509, tasa:5.09, cuentaDestinoId:"bin" } ];
  const unaSola = F._htmlDeDondeSalen({ cant:50000, tdia:189 }, { orig:"BRL", dest:"VES" });
  ok((unaSola.match(/Bs\/real/g)||[]).length === 0 &&
     (unaSola.match(/Bs por real/g)||[]).length === 1,
     "con un solo origen el número se escribe UNA vez, en el pie",
     "filas " + (unaSola.match(/Bs\/real/g)||[]).length +
     " / pie " + (unaSola.match(/Bs por real/g)||[]).length);
  // Pero con dos orígenes sí: ahí la fila existe para poder compararlos.
  S.inventarioUsdt = [ LOTE(1,"10/11",1000,20000), LOTE(2,"10/12",950,95000), { id:77, tipo:"compra", moneda:"BRL", fecha:"10/11", usdt:100, monto:509, restante:509, tasa:5.09, cuentaDestinoId:"bin" } ];
  const dos = F._htmlDeDondeSalen({ cant:50000, tdia:189 }, { orig:"BRL", dest:"VES" });
  ok((dos.match(/Bs\/real/g)||[]).length === 2 &&
     (dos.match(/Bs por real/g)||[]).length === 1,
     "con dos tasas distintas sale en cada fila, para poder compararlas",
     "filas " + (dos.match(/Bs\/real/g)||[]).length +
     " / pie " + (dos.match(/Bs por real/g)||[]).length);

  S.inventarioUsdt = inv; S.tx = tx; S.monedas = mon;
}
{
  const rep = sinComentarios(sacarFuncion("_repartoFIFO"));
  const pon = sinComentarios(sacarFuncion("getTasaVentaPonderada"));
  const dds = sinComentarios(sacarFuncion("_htmlDeDondeSalen"));
  const up  = sinComentarios(sacarFuncion("upC"));
  const rn  = sinComentarios(sacarFuncion("rNueva"));

  // El recorrido vive en UN sitio. Si la ponderada se vuelve a escribir su
  // propio bucle, la lista y el número se separan con el primer redondeo.
  ok(/var rep=_repartoFIFO\(dest,m,cuentaDestinoId\);/.test(pon),
     "getTasaVentaPonderada lee el reparto, no lo repite");
  ok(!/bsRestante/.test(pon),
     "y ya no recorre los lotes por su cuenta");
  ok(/_repartoFIFO\(dest, cant, S\.tx && S\.tx\.cuentaDest\)/.test(dds),
     "y la pantalla sale del MISMO reparto");
  ok(!/bsRestante/.test(dds),
     "tampoco se escribe su propio recorrido");

  // Es de solo lectura: mirar de dónde sale el dinero no puede gastarlo.
  ok(!/bsRestante\s*=[^=]|\brestante\s*=[^=]|S\.inventarioUsdt\s*(=[^=]|\.push\(|\.splice\()/.test(rep),
     "_repartoFIFO solo mira: no descuenta ni escribe en el inventario");

  // ARREGLO 55: lo que se recalcula al teclear se refresca al teclear.
  ok(/id='fifo-tx'/.test(rn), "el reparto se dibuja con su id");
  ok(/document\.getElementById\("fifo-"\+key\)/.test(up) &&
     /fi\.innerHTML=_htmlDeDondeSalen\(res, ruta\)/.test(up),
     "y upC lo rehace al teclear, no se queda del último repintado");

  // La traducción divide. Multiplicar daría un número creíble y falso.
  ok(/return Math\.round\(\(t\/brl\)\*100\)\/100;/.test(sinComentarios(sacarFuncion("_bsPorReal"))),
     "_bsPorReal DIVIDE por la tasa de compra de reales");
  ok(/if\(!\(brl>0\)\) return null;/.test(sinComentarios(sacarFuncion("_bsPorReal"))),
     "y sin esa tasa devuelve null en vez de un número inventado");
}

// ═══════════════════════════════════════════════════════════════════════
// ARREGLO 126 · quién se comió cada lote
// ═══════════════════════════════════════════════════════════════════════
// Sus palabras del 13/10: "en la parte de inventario, cuando yo hago de
// bolívares arriba aparece ahí la adquisición de los bolívares, mas no cuando
// es de reales allá a bolívar". Una vuelta CREA un lote y se ve; una ida lo
// GASTA y no se veía. El dato ya estaba en cada remesa (_lotesConsumidos);
// faltaba poder leerlo del lado del lote.
console.log("\nARREGLO 126 · quién se comió cada lote");
{
  const inv = S.inventarioUsdt, brl = S.brl, vz = S.vzla, ee = S.eeuu, cer = S.inventarioUsdt_cerrado;
  const L = (id,fecha,tasa,bs) => ({id:id,tipo:"venta",moneda:"VES",fecha:fecha,usdt:bs/tasa,bs:bs,bsRestante:bs,tasa:tasa,cuentaDestinoId:"bdv"});
  S.inventarioUsdt_cerrado = [];
  S.vzla = []; S.eeuu = [];
  S.inventarioUsdt = [ L(1,"10/11",1000,100000), L(2,"10/12",950,95000) ];

  // 1) Lo NUEVO se casa por id, que es exacto.
  S.brl = [
    { n:501, cl:"ANA", d:"11/10/26", _lotesConsumidos:{ ventas:[{id:1, fecha:"10/11", tasa:1000, bs:40000}] } },
    { n:502, cl:"LUIS", d:"11/10/26", _lotesConsumidos:{ ventas:[{id:1, fecha:"10/11", tasa:1000, bs:25000},
                                                                 {id:2, fecha:"10/12", tasa:950,  bs:10000}] } }
  ];
  let idx = F._indiceLotesComidos();
  let c1 = F._comieronEsteLote(idx, S.inventarioUsdt[0]);
  ok(c1.regs.length === 2, "el lote 1 lo gastaron dos remesas", c1.regs.length);
  ok(c1.exacto === true && c1.ambiguo === false, "casadas por id: exacto y sin ambigüedad");
  ok(c1.regs[0].n === 501 && c1.regs[1].n === 502, "y son las suyas, con su número");
  ok(F._comieronEsteLote(idx, S.inventarioUsdt[1]).regs.length === 1,
     "y el lote 2 solo lo tocó una");

  // 2) Lo VIEJO no lleva id: se casa por fecha+tasa, y eso se DICE.
  S.brl = [ { n:601, cl:"PEDRO", d:"02/10/26", _lotesConsumidos:{ ventas:[{fecha:"10/11", tasa:1000, bs:30000}] } } ];
  idx = F._indiceLotesComidos();
  let c2 = F._comieronEsteLote(idx, S.inventarioUsdt[0]);
  ok(c2.regs.length === 1 && c2.exacto === false,
     "sin id se casa por fecha y tasa, y queda marcado como no exacto");
  let h2 = F._filaComieron(idx, S.inventarioUsdt[0], 12).fila;
  ok(/Casado por fecha y tasa/.test(h2), "y la fila lo dice en vez de darlo por seguro");

  // 3) Y si DOS lotes comparten fecha y tasa, eso no se puede repartir: se
  //    avisa. En su export son 63 de 367 lotes, el 17%.
  S.inventarioUsdt = [ L(1,"10/11",1000,100000), L(3,"10/11",1000,50000) ];
  idx = F._indiceLotesComidos();
  let c3 = F._comieronEsteLote(idx, S.inventarioUsdt[0]);
  ok(c3.ambiguo === true, "dos lotes con la misma fecha y tasa salen marcados como ambiguos");
  let h3 = F._filaComieron(idx, S.inventarioUsdt[0], 12).fila;
  ok(/más de un lote/.test(h3), "y la fila avisa de que no se sabe de cuál salieron");
  ok(/var\(--mal\)/.test(h3), "en rojo, porque es un dato que no consta");
  // El id manda: con id, el mismo par de lotes deja de ser ambiguo.
  S.brl = [ { n:701, cl:"EVA", d:"11/10/26", _lotesConsumidos:{ ventas:[{id:1, fecha:"10/11", tasa:1000, bs:30000}] } } ];
  idx = F._indiceLotesComidos();
  ok(F._comieronEsteLote(idx, S.inventarioUsdt[0]).ambiguo === false,
     "pero con el id guardado deja de serlo: por eso se guarda");

  // 4) Un lote que nadie tocó no dibuja botón ni fila: la pantalla no se llena
  //    de desplegables vacíos.
  const vacia = F._filaComieron(idx, S.inventarioUsdt[1], 12);
  ok(vacia.btn === "" && vacia.fila === "", "un lote que nadie gastó no dibuja nada");

  // 5) La fila tapa la tabla entera.
  ok(/colspan='12'/.test(h3), "la fila cubre las 12 columnas de la tabla");

  S.inventarioUsdt = inv; S.brl = brl; S.vzla = vz; S.eeuu = ee; S.inventarioUsdt_cerrado = cer;
}
{
  const sim = sinComentarios(sacarFuncion("simularConsumoFIFO"));
  const tog = sinComentarios(sacarFuncion("toggleComieron"));
  const inv = sinComentarios(sacarFuncion("rInventarioUsdt"));

  // El id se guarda en los DOS lados, o la mitad del inventario sigue a ciegas.
  ok(/resCompras\.push\(\{id:compras\[i\]\.id,/.test(sim),
     "el espejo guarda el id del lote de compra");
  ok(/resVentas\.push\(\{id:ventas\[k\]\.id,/.test(sim),
     "y el del lote de venta");

  // ARREGLO 32: desplegar no puede repintar la tabla bajo el dedo.
  ok(!/\bR\(\)/.test(tog) && /style\.display=/.test(tog),
     "desplegar cambia el display por su id, no llama a R()");

  // El índice se arma UNA vez por dibujo. Lote por lote son 200.000
  // comparaciones en cada repintado, que es el coste que ya hubo que quitar
  // de getRateToUsdt.
  ok((inv.match(/_indiceLotesComidos\(\)/g)||[]).length === 1,
     "el índice se arma una sola vez por dibujo");
  ok(/var _idxCom=_indiceLotesComidos\(\);/.test(inv) &&
     inv.indexOf("var _idxCom=") < inv.indexOf(".map(function(r){"),
     "y fuera del bucle de lotes, no dentro");

  // El colspan tiene que seguir a la TABLA, no a un número escrito a mano.
  // Si algún día se añade una columna y esto se queda en 12, la fila deja de
  // taparla y la tabla sale torcida. Se cuentan las <th> de la cabecera que
  // lleva estas filas y se exige que la llamada pase esa misma cifra.
  {
    const i = inv.indexOf("<tbody>\"+rows");
    const ini = inv.lastIndexOf("<thead>", i);
    const cols = (inv.slice(ini, i).match(/<th[ >]/g) || []).length;
    const m = inv.match(/_filaComieron\(_idxCom, r, (\d+)\)/);
    ok(cols > 0 && m && Number(m[1]) === cols,
       "el colspan de la fila es el número de columnas de la tabla",
       "columnas " + cols + " / colspan " + (m ? m[1] : "(no se llama)"));
  }
}

// ══════════════════════════════════════════════════════════════════════
// ARREGLO 127 · al borrar, el dinero vuelve al lote QUE SE GASTÓ
// ══════════════════════════════════════════════════════════════════════
console.log("\nARREGLO 127 · al borrar, el dinero vuelve al lote que se gastó");
{
  const inv=S.inventarioUsdt, cer=S.inventarioUsdt_cerrado, del=S._deletedMerge;
  const L=(id,bs,rest,tasa)=>({id:id,tipo:"venta",moneda:"VES",fecha:"10/11",fechaIso:"2026-10-11",
    usdt:bs/tasa,bs:bs,bsRestante:rest,tasa:tasa,cuentaDestinoId:"bdv"});

  // 1) Un lote ARCHIVADO recupera lo suyo y vuelve a la lista viva.
  S.inventarioUsdt=[]; S.inventarioUsdt_cerrado=[Object.assign(L(11,10000,0,1000),{_cerrado:true})];
  S._deletedMerge={inventarioUsdt:[{id:11,ts:Date.now(),por:"x"}]};
  F._restaurarVentasFIFO({cuentaDest:"bdv", _lotesConsumidos:{ventas:[{id:11,fecha:"10/11",tasa:1000,bs:10000}]}}, "VES", 10000);
  ok(S.inventarioUsdt.length===1 && S.inventarioUsdt[0].id===11,
     "el lote archivado vuelve a la lista viva");
  ok(S.inventarioUsdt[0].bsRestante===10000, "con su dinero", S.inventarioUsdt[0].bsRestante);
  ok(!S.inventarioUsdt[0]._cerrado, "y sin la marca de cerrado");
  // ARREGLO 137: la marca NO desaparece — se LEVANTA. Quitarla a secas es lo
  // que hacia el 127, y lo que no esta no le gana a la marca que el servidor
  // todavia tiene: volvia en la respuesta y el lote se moria otra vez.
  ok(!F._estaBorradoMerge("inventarioUsdt", 11),
     "y deja de contar como borrado, o el otro aparato lo borra otra vez");
  ok((S._deletedMerge.inventarioUsdt||[]).some(x=>x.id===11 && x.revive>x.ts),
     "pero la marca sigue ahi, LEVANTADA: es lo unico que le gana a la del servidor");
  ok(F._estaBorradoMerge("inventarioUsdt_cerrado", 11),
     "y la copia archivada queda enterrada, o el servidor la devuelve y el lote vuelve a cero");

  // 2) Cada lote recibe LO SUYO, no el primero todo. Es el fallo que se midió
  //    al borrar su #818: los 200.000 se metían enteros en el lote vivo.
  S.inventarioUsdt=[L(21,150000,100000,1000), L(22,60000,0,900)];
  S.inventarioUsdt_cerrado=[]; S._deletedMerge={};
  F._restaurarVentasFIFO({cuentaDest:"bdv", _lotesConsumidos:{ventas:[
      {id:21,fecha:"10/11",tasa:1000,bs:20000},{id:22,fecha:"10/11",tasa:900,bs:30000}]}}, "VES", 50000);
  ok(S.inventarioUsdt[0].bsRestante===120000, "al primero vuelven sus 20.000", S.inventarioUsdt[0].bsRestante);
  ok(S.inventarioUsdt[1].bsRestante===30000,  "y al segundo los suyos",        S.inventarioUsdt[1].bsRestante);

  // 3) Nunca se devuelve más de lo que el lote puede llevar ni más que el total.
  S.inventarioUsdt=[L(31,10000,9000,1000)]; S.inventarioUsdt_cerrado=[];
  F._restaurarVentasFIFO({cuentaDest:"bdv", _lotesConsumidos:{ventas:[{id:31,fecha:"10/11",tasa:1000,bs:99999}]}}, "VES", 99999);
  ok(S.inventarioUsdt[0].bsRestante===10000, "un lote nunca pasa de su monto original", S.inventarioUsdt[0].bsRestante);

  // 4) Sin espejo (remesas viejas) se cae al camino de siempre.
  S.inventarioUsdt=[L(41,10000,2000,1000)]; S.inventarioUsdt_cerrado=[];
  F._restaurarVentasFIFO({cuentaDest:"bdv"}, "VES", 5000);
  ok(S.inventarioUsdt[0].bsRestante===7000, "sin espejo se reparte como antes", S.inventarioUsdt[0].bsRestante);

  // 5) El id manda sobre fecha+tasa. Dos lotes iguales de fecha y tasa: el
  //    espejo nombra el segundo por su id y ahí tiene que ir el dinero. Con la
  //    guardia escrita como texto esto pasaba con el `if` del id desactivado.
  S.inventarioUsdt=[L(51,10000,0,1000), L(52,10000,0,1000)]; S.inventarioUsdt_cerrado=[];
  F._restaurarVentasFIFO({cuentaDest:"bdv", _lotesConsumidos:{ventas:[{id:52,fecha:"10/11",tasa:1000,bs:4000}]}}, "VES", 4000);
  ok(S.inventarioUsdt[0].bsRestante===0 && S.inventarioUsdt[1].bsRestante===4000,
     "con dos lotes idénticos, el dinero va al que dice el id",
     S.inventarioUsdt[0].bsRestante+" / "+S.inventarioUsdt[1].bsRestante);

  S.inventarioUsdt=inv; S.inventarioUsdt_cerrado=cer; S._deletedMerge=del;
}
{
  const ven=sinComentarios(sacarFuncion("_restaurarVentasFIFO"));
  const com=sinComentarios(sacarFuncion("_restaurarComprasFIFO"));
  const esp=sinComentarios(sacarFuncion("_loteDelEspejo"));
  const rev=sinComentarios(sacarFuncion("_revivirLote"));
  const vol=sinComentarios(sacarFuncion("revertirSaldosRemesa"));

  // Lo exacto primero: lo que la remesa dice haber gastado.
  ok(/_lotesConsumidos\|\|\{\}\)\.ventas/.test(ven), "las ventas se devuelven por el espejo");
  ok(/_lotesConsumidos\|\|\{\}\)\.compras/.test(com), "y las compras también");

  // El ARREGLO 127 midió que meter los archivados en el reparto "del más nuevo
  // al más viejo" es PEOR que el fallo: todos están en cero y el primero se
  // traga la devolución entera. El camino de respaldo mira solo los vivos.
  ok(!/inventarioUsdt_cerrado/.test(ven.split("_lotesConsumidos")[1]||""),
     "el respaldo de ventas NO reparte entre los archivados");
  ok(/S\.inventarioUsdt\.filter/.test(ven), "sino solo entre los vivos");

  // Revivir no basta con moverlo: la marca de borrado tiene que irse.
  ok(/inventarioUsdt_cerrado=\(S\.inventarioUsdt_cerrado\|\|\[\]\)\.filter/.test(rev) &&
     /S\.inventarioUsdt=\(S\.inventarioUsdt\|\|\[\]\)\.concat/.test(rev),
     "_revivirLote lo saca del archivo y lo mete en los vivos");
  // ARREGLO 137 · las DOS mitades, y faltando cualquiera la cuenta vuelve y
  // el FIFO no. Exigidas por separado: pidiendo solo una, la otra se podia
  // quitar y la prueba pasaba.
  ok(/_levantarBorradoMerge\("inventarioUsdt",/.test(rev),
     "_revivirLote LEVANTA la marca del vivo (quitarla a secas la devolvia el servidor)");
  ok(/_marcarBorradoMerge\("inventarioUsdt_cerrado",/.test(rev),
     "y ENTIERRA la copia archivada, o la del servidor vuelve y lo deja en cero");
  ok(!/_deletedMerge\[.inventarioUsdt.\]=m\.filter/.test(rev),
     "y ya no borra la entrada a mano: eso es justo lo que se perdia al sincronizar");


  // Una sola copia del lado de compras: estaba escrito dos veces.
  ok((vol.match(/_restaurarComprasFIFO\(/g)||[]).length===2,
     "los dos caminos del borrado llaman a la MISMA función de compras");
  ok(!/comprasTodas/.test(vol), "y ya no queda ninguna copia suelta");

  // Consumir descuenta a 4 decimales; devolver tiene que hacerlo igual.
  // Los DOS caminos de la devolución (el del espejo y el de respaldo). Pedir
  // uno solo dejaba pasar que el otro perdiera decimales.
  ok((com.match(/restante=Math\.round\(\(act\+dev\)\*10000\)\/10000/g)||[]).length===2,
     "las compras se devuelven con los mismos 4 decimales con que se gastan, por los dos caminos",
     (com.match(/restante=Math\.round/g)||[]).length+" sitios");
}


// ══════════════════════════════════════════════════════════════════════
// ARREGLO 128 · la tasa recomendada y la aproximada de hoy
// ══════════════════════════════════════════════════════════════════════
console.log("\nARREGLO 128 · la tasa que publica, recomendada sola");
{
  const rec = sacarFuncion("_tasasRecomendadas");
  const pub = sacarFuncion("publicarRecomendadas");
  const apx = sacarFuncion("_setAprox");
  const col = sacarFuncion("_colchon");
  const tar = sacarFuncion("_htmlPublicaHoy");

  // ── La cuenta vive en UN sitio ──────────────────────────────────────
  // Si el botón recalculara por su cuenta, bastaría un redondeo distinto
  // para publicar un número que no es el que ella está mirando. Es el
  // 34,27 arriba y 34,28 abajo de Por cobrar.
  ok(/_tasasRecomendadas\(\)/.test(pub),
     "publicar LEE las tasas recomendadas, no las recalcula");
  ok(!/_colchon\(/.test(pub) && !/sueloQueManda\(/.test(pub),
     "y no vuelve a tocar ni el colchón ni el suelo por su cuenta");

  // ── La puerta única del ARREGLO 117 ─────────────────────────────────
  // Escribir tdia_brl a pelo deja tdia_fecha con la del último día que usó
  // la cabecera, y entonces el aviso del 112 mide desde una fecha que no es
  // la de esa tasa.
  ok((pub.match(/guardarTasaCalcHoy\(/g)||[]).length===2,
     "publica las dos por guardarTasaCalcHoy, que sella la fecha");
  ok(!/tdia_brl/.test(pub) && !/tdia_ves_brl/.test(pub),
     "y no escribe las claves publicadas a pelo");

  // ── ARREGLO 32 + 140: escribir no puede repintar NI la pantalla NI la
  // tarjeta. Esta guardia decía "se rehace la tarjeta por su id" y pasaba
  // con el fallo puesto: los dos campos de la tasa aproximada están DENTRO
  // de `tasas-publica`, así que rehacerla mataba el input en la primera
  // tecla. Medido en Chromium contra v221: escribía "1010" y quedaba "1",
  // con el suelo cayendo a 0,20. Es el ARREGLO 136 en otro campo.
  ok(!/\bR\(\)/.test(apx),
     "escribir la tasa aproximada NO llama a R()");
  ok(!/tasas-publica/.test(apx),
     "y NO repinta la tarjeta, que lleva el campo dentro (ARREGLO 140)");
  ok(/_refrescarAprox\(\)/.test(apx),
     "refresca por la puerta única, _refrescarAprox()");

  // Y esa puerta tiene que cubrir TODO lo que cambia al teclear. Pidiendo
  // solo que existiera, se podía quedar refrescando la mitad y la tarjeta
  // diría dos cosas distintas a la vez (ARREGLO 55).
  const refA = sacarFuncion("_refrescarAprox");
  ok(!/tasas-publica/.test(refA),
     "_refrescarAprox no toca el contenedor del campo");
  ok(!/\bR\(\)/.test(refA),
     "_refrescarAprox no llama a R()");
  // Las DOS celdas por nombre: pidiendo solo que `_pintarRecPub` apareciera,
  // quitar la de la ida pasaba la prueba con la de la vuelta puesta. Lo cazó
  // la prueba negativa — es el mismo agujero que el rótulo del ARREGLO 129.
  ok(/_pintarRecPub\("ida"/.test(refA) && /_pintarRecPub\("vuelta"/.test(refA),
     "_refrescarAprox repinta las DOS celdas TE RECOMIENDO");
  [["tpub-dif","la línea de si coincide con lo publicado"],
   ["tpub-apx-txt","el texto de encima de los campos"],
   ["tpub-apx-tres","los TRES valores"],
   ["tpub-pie","el pie con el suelo"],
   ["_refrescarAvisosTasa","los avisos de abajo"]].forEach(function(x){
    ok(refA.indexOf(x[0])>=0, "_refrescarAprox refresca "+x[1]);
  });
  // Los ids tienen que existir donde se dibuja, o el refresco no encuentra
  // nada y falla en silencio.
  const pubHoy = sacarFuncion("_htmlPublicaHoy");
  ["tpub-apx-txt","tpub-apx-tres"].forEach(function(id){
    ok(pubHoy.indexOf("id='"+id+"'")>=0, "la tarjeta dibuja "+id);
  });
  ok(/id='tpub-fila-"\+dir\+"'/.test(pubHoy) && /id='tpub-rec-"\+dir\+"'/.test(pubHoy),
     "y cada fila lleva su id y el de su celda recomendada");
  // La celda se repinta por textContent y style, nunca con innerHTML: el
  // <tr> lleva dentro el input de TIENES y rehacerlo se lo llevaría.
  const pint = sacarFuncion("_pintarRecPub");
  ok(/textContent/.test(pint) && !/innerHTML/.test(pint),
     "_pintarRecPub escribe el número sin rehacer el HTML de la fila");
  // Y la diferencia se pregunta en UN sitio: si la fila y el refresco la
  // calcularan aparte, una saldría marcada y la otra con el color de
  // "coinciden" — el 34,27 contra el 34,28 en forma de color.
  ok(/_difPubFila\(/.test(pubHoy) && /_difPubFila\(/.test(pint),
     "la fila y el repintado preguntan la diferencia por _difPubFila");

  // La lectura del mercado llega SOLA y también repinta la tarjeta. Con un
  // campo bajo el dedo tiene que irse por el refresco parcial.
  const rs = sacarFuncion("_refrescarSuelo");
  ok(/_tecleandoEnLaTarjeta\(\)/.test(rs) && /_refrescarAprox\(\)/.test(rs),
     "_refrescarSuelo no repinta la tarjeta con un campo bajo el dedo");

  // ── Los colchones por omisión ───────────────────────────────────────
  // Medidos: 61 operaciones de octubre, margen medio 6,8%. Si alguien los
  // toca sin querer, la tasa que publica cambia sin que nada lo diga.
  ok(F._COLCHON_DEF.ida===0.07 && F._COLCHON_DEF.vuelta===0.05,
     "los colchones por omisión son 7% en la ida y 5% en la vuelta");
  S.config={};
  ok(F._colchon("ida")===0.07 && F._colchon("vuelta")===0.05,
     "sin nada escrito, mandan los de por omisión");
  S.config={colchonIda:-0.1, colchonVuelta:0.8};
  ok(F._colchon("ida")===0.07 && F._colchon("vuelta")===0.05,
     "un colchón fuera de rango se ignora, no publica una tasa en pérdida");
  S.config={colchonIda:0.1, colchonVuelta:0.03};
  ok(F._colchon("ida")===0.1 && F._colchon("vuelta")===0.03,
     "y uno razonable se respeta");

  // ── La aproximada NO revalora su contabilidad ───────────────────────
  // Esta es la que de verdad importa: un número mirado a ojo no puede mover
  // el capital, la conciliación, el cierre ni la ganancia de una remesa.
  ok(!/_tasaAprox\(/.test(sacarFuncion("tasaDeReferencia")),
     "tasaDeReferencia NO mira la tasa aproximada");
  ok(/_tasaAprox\(/.test(sacarFuncion("sueloQueManda")),
     "pero el suelo sí la mira");

  // ── Y no se fija ni se sincroniza ───────────────────────────────────
  const gua = sacarFuncion("_guardarTasaAprox");
  ok(!/fijada/.test(gua) && !/_tasasDiaMeta/.test(gua),
     "guardar la aproximada NO la fija (lo fijado manda para siempre)");
  ok(/localStorage/.test(gua) && !/saveData\(/.test(gua),
     "vive en el aparato y no se sincroniza");
  ok(F.DATA_KEYS.indexOf("tasaAprox")===-1 && F.DATA_KEYS.indexOf("_APROX_LS")===-1,
     "y no entra en DATA_KEYS");

  // ── La situación sale de avisoTasa(), no de una segunda copia ───────
  // Escrita aquí otra vez, un día la tarjeta diría "sube la ida" y el aviso
  // de abajo "baja la ida", y no habría forma de saber cuál mirar.
  // ARREGLO 136: el motivo se mudó a _motivoPub(), que es lo que la tarjeta
  // pliega detrás de "por qué". La regla no cambia: sale de avisoTasa() y de
  // ninguna segunda copia.
  const mot136 = sacarFuncion("_motivoPub");
  ok(/avisoTasa\(\)/.test(mot136),
     "la línea de qué hacer sale de avisoTasa()");
  ok(!/porMoneda/.test(mot136) && !/capitalRealTotal/.test(mot136) &&
     !/porMoneda/.test(tar) && !/capitalRealTotal/.test(tar),
     "y la tarjeta no vuelve a decidir por su cuenta de qué moneda va llena");

  // ── Sin suelo no se inventa un número ───────────────────────────────
  ok(/if\(!r\)\{/.test(tar) && /falta saber a c/.test(tar),
     "sin suelo la tarjeta dice qué falta en vez de inventar una tasa");

  // ARREGLO 129b: los campos NUNCA se abren solos. Sus palabras: "no me lo
  // pongas allí afuera para que de una vez coloque la nueva tasa de USDT,
  // sino como un botón". Lo que sale solo es el AVISO de que su tasa
  // envejeció; escribirla es decisión suya.
  ok(!/if\(pideC\|\|pideV\)\{/.test(tar),
     "los campos no se abren por que la app no tenga dato fresco");
  ok((tar.match(/_campoAprox\(/g)||[]).length===4,
     "los cuatro campos cuelgan de que ella lo pida",
     (tar.match(/_campoAprox\(/g)||[]).length+" llamadas");
  ok(/_botonTasaUsdt\(/.test(tar) && /S\._probarTasa/.test(tar),
     "y la puerta es el botón, en los dos caminos");
  ok((tar.match(/_botonTasaUsdt\(/g)||[]).length===3,
     "el botón se dibuja desde UN sitio, en los tres estados",
     (tar.match(/_botonTasaUsdt\(/g)||[]).length+" llamadas");

  // ── Funcional: la aproximada caduca y solo entra si la suya es vieja ─
  const guardado = {};
  global.localStorage = {
    getItem:function(k){ return guardado[k]||null; },
    setItem:function(k,v){ guardado[k]=v; },
    removeItem:function(k){ delete guardado[k]; }
  };
  const hoy = F.td();
  const ayer = (function(){ const d=new Date(hoy+"T12:00:00"); d.setDate(d.getDate()-1);
    return d.toISOString().slice(0,10); })();

  guardado["cgTasaAprox"]=JSON.stringify({VES:{v:1020, iso:ayer}});
  ok(F._tasaAprox("VES")===null,
     "una aproximada de ayer no vale hoy");
  guardado["cgTasaAprox"]=JSON.stringify({VES:{v:1020, iso:hoy}});
  ok(F._tasaAprox("VES")===1020,
     "la de hoy sí");

  // ── ARREGLO 129: manda la MÁS NUEVA ────────────────────────────────
  // El id de un lote es Date.now(), así que se puede comparar con la hora en
  // que ella escribió la suya. Antes la operación ganaba por ser de hoy, y
  // eso dejaba el campo de "probar con otra tasa" sin poder hacer nada.
  S.config={comision_binance:0.007};
  S.tasasDia={}; S._tasasDiaMeta={};
  const T0 = Date.now();
  S.inventarioUsdt=[
    {id:T0-60000,tipo:"compra",moneda:"BRL",fecha:"10/10",fechaIso:hoy,tasa:5.0327,usdt:400,restante:400},
    {id:T0-60000,tipo:"venta", moneda:"VES",fecha:"10/11",fechaIso:hoy,tasa:1010.66,usdt:150,bs:151599,bsRestante:0}
  ];
  S.inventarioUsdt_cerrado=[];

  // Escrita DESPUÉS de la operación → manda la suya.
  guardado["cgTasaAprox"]=JSON.stringify({VES:{v:1020, iso:hoy, ts:T0}});
  let Q=F.sueloQueManda();
  ok(Q.apxV===true && Q.miV===1020,
     "una tasa escrita DESPUÉS de la última operación manda");

  // Escrita ANTES y luego registra la operación → manda la medida.
  guardado["cgTasaAprox"]=JSON.stringify({VES:{v:1020, iso:hoy, ts:T0-120000}});
  Q=F.sueloQueManda();
  ok(Q.apxV===false && Math.abs(Q.miV-1010.66)<0.01,
     "y si después registra la operación de verdad, manda la medida");

  // Sin ninguna operación de esa moneda, la suya vale igual.
  S.inventarioUsdt=[S.inventarioUsdt[0]];
  Q=F.sueloQueManda();
  ok(Q.apxV===true && Q.miV===1020,
     "sin operación de esa moneda, vale lo que ella escribió aunque sea vieja del día");

  // Y aun así no movió la contabilidad.
  S.inventarioUsdt=[
    {id:T0-60000,tipo:"compra",moneda:"BRL",fecha:"10/10",fechaIso:hoy,tasa:5.0327,usdt:400,restante:400},
    {id:T0-60000,tipo:"venta", moneda:"VES",fecha:"10/11",fechaIso:hoy,tasa:1010.66,usdt:150,bs:151599,bsRestante:0}
  ];
  guardado["cgTasaAprox"]=JSON.stringify({VES:{v:1020, iso:hoy, ts:T0}});
  ok(F.tasaDeReferencia("VES").tasa===1010.66,
     "pero tasaDeReferencia sigue devolviendo la de su operación");

  // ── La comparación de los tres valores sale de la MISMA cuenta ─────
  const conOtra=F._tasasRecomendadas(), conLoMio=F._tasasConLoMio();
  ok(conOtra && conLoMio && conOtra.suelo!==conLoMio.suelo,
     "_tasasConLoMio da el suelo SIN la tasa escrita, para poder compararlos");
  ok(F._tasasRecomendadas().suelo===conOtra.suelo,
     "y deja la bandera como estaba: mirar el resultado no es aplicarlo");
  ok(/finally/.test(F._tasasConLoMio.toString()),
     "la bandera se devuelve en un finally");

  // ── Probar y volver no repintan (ARREGLO 32) ──────────────────────
  ok(!/\bR\(\)/.test(sacarFuncion("_toggleProbar")) &&
     !/\bR\(\)/.test(sacarFuncion("_volverAMiTasa")),
     "abrir y cerrar 'probar con otra tasa' no llama a R()");
  ok(/_guardarTasaAprox\("BRL",""\)/.test(sacarFuncion("_volverAMiTasa")) &&
     /_guardarTasaAprox\("VES",""\)/.test(sacarFuncion("_volverAMiTasa")),
     "volver borra las DOS, no deja media mezcla puesta");

  // ── El botón de arriba y el campo de abajo ya no se escriben igual ─
  ok(F._RUTA_DE.ida.campoRot!==F._RUTA_DE.ida.boton &&
     F._RUTA_DE.vuelta.campoRot!==F._RUTA_DE.vuelta.boton,
     "el rótulo del campo no es el mismo texto que el botón del modo");
  // Las DOS, no una: cambiando solo la de la ida, "campoRot" seguía
  // apareciendo y la guardia pasaba con el rótulo viejo puesto en la vuelta.
  ok((sacarFuncion("_htmlCalceCuerpo").match(/\.campoRot/g)||[]).length===2,
     "y la calculadora usa ese rótulo en los DOS campos, no el del botón",
     (sacarFuncion("_htmlCalceCuerpo").match(/\.campoRot/g)||[]).length+" sitios");

  // Guardar tiene que dejar la HORA escrita. Las pruebas de arriba la meten a
  // mano en localStorage, así que sin esto se podía quitar del escritor y la
  // regla "manda la más nueva" quedaba muerta sin que nada fallara.
  guardado["cgTasaAprox"]="{}";
  F._guardarTasaAprox("VES","1.030");
  const esc=JSON.parse(guardado["cgTasaAprox"]).VES||{};
  ok(esc.v===1030 && esc.iso===hoy && (parseFloat(esc.ts)||0)>1.5e12,
     "guardar la aproximada deja el valor, el día Y la hora",
     JSON.stringify(esc));

  // Un lote de permuta NO es una operación de USDT (ARREGLO 106), así que no
  // puede ganarle a lo que ella escribió.
  S.inventarioUsdt=[{id:Date.now()+90000,tipo:"venta",moneda:"VES",fecha:"10/13",
                     fechaIso:hoy,tasa:999,usdt:150,bs:149850,bsRestante:0,permuta:true}];
  S.inventarioUsdt_cerrado=[];
  ok(F._tsUltimaOpUSDT("VES")===0,
     "un lote de permuta no cuenta como operación de USDT");
  guardado["cgTasaAprox"]=JSON.stringify({VES:{v:1020, iso:hoy, ts:Date.now()}});
  ok(F._aproxManda("VES")===true,
     "así que una permuta posterior no le gana a la tasa que ella escribió");

  delete global.localStorage;
}


// ══════════════════════════════════════════════════════════════════════
// ARREGLO 130 · de dónde sale cada mitad, y el traspaso de la venta
// ══════════════════════════════════════════════════════════════════════
console.log("\nARREGLO 130 · el origen de cada mitad y el traspaso que falta");
{
  const hoy=F.td();
  const T0=Date.now();
  S.config={comision_binance:0.007};
  S.inventarioUsdt=[
    {id:T0-6e4,tipo:"compra",moneda:"BRL",fecha:"10/10",fechaIso:hoy,tasa:5.0327,usdt:400,restante:400},
    {id:T0-6e4,tipo:"venta", moneda:"VES",fecha:"10/13",fechaIso:hoy,tasa:1010.50,usdt:168,bs:169764,bsRestante:0}
  ];
  S.inventarioUsdt_cerrado=[];
  S.tasasDia={}; S._tasasDiaMeta={};

  // ── El origen se dice por LADO ─────────────────────────────────────
  let Q=F.sueloQueManda();
  ok(/tu compra del/.test(F._origenLado("BRL",Q).txt),
     "sin nada fijado, el lado de los reales dice de qué operación sale");
  ok(/tu venta del/.test(F._origenLado("VES",Q).txt),
     "y el de los bolívares, de la suya");

  // ── ARREGLO 131: lo escrito a mano YA NO gana a una operación ──────
  // Esto es lo que mordía: su VES llevaba desde el 10/10 valorando todo a
  // 1.013 que escribió una vez, con ventas reales a 1.008,72 y 1.010,50.
  S.tasasDia={VES:1013};
  S._tasasDiaMeta={VES:{fijada:true, fecha:"10/10/2026", iso:"2026-10-10", ts:T0-120000}};
  ok(F._tasaFijadaAMano("VES")===null,
     "una tasa escrita ANTES de la última operación deja de mandar");
  ok(Math.abs(F.tasaDeReferencia("VES").tasa-1010.50)<0.5 &&
     F.tasaDeReferencia("VES").origen==="auto",
     "y la referencia pasa a ser la de su operación",
     JSON.stringify(F.tasaDeReferencia("VES")));

  // Escrita DESPUÉS sí manda, hasta que registre otra.
  S._tasasDiaMeta={VES:{fijada:true, fecha:"13/10/2026", iso:"2026-10-13", ts:T0}};
  ok(F._tasaFijadaAMano("VES")===1013,
     "escrita después de la última operación, sí manda");
  Q=F.sueloQueManda();
  const oV=F._origenLado("VES",Q);
  ok(/la escribiste t/.test(oV.txt) && oV.escrita===true,
     "y la tarjeta dice que la escribió ella, no que salga de una operación");
  ok(/manda hasta que registres/.test(oV.txt),
     "diciendo hasta cuándo vale");

  // Una de las viejas, sin hora, pierde contra cualquier operación.
  S._tasasDiaMeta={VES:{fijada:true, fecha:"10/10/2026", iso:"2026-10-10"}};
  ok(F._tasaFijadaAMano("VES")===null,
     "las fijadas de antes de este arreglo (sin hora) dejan de ganar solas");

  // Y escribirla guarda la hora, o la regla no se puede aplicar.
  ok(/ts:Date\.now\(\)/.test(sacarFuncion("setTasaDia")),
     "escribir una tasa guarda su hora");
  // La comparación tiene que estar en la puerta, no en quien la llama: por ahí
  // pasan la conciliación, el cierre y cada remesa.
  ok(/_tsUltimaOpUSDT\(moneda\)/.test(sacarFuncion("_tasaFijadaAMano")),
     "y la puerta compara contra la última operación de esa moneda");
  // ARREGLO 98: la pantalla de Tasas prometía que lo escrito duraba "hasta que
  // la sueltes". Con el 131 eso es falso y un texto que miente se deja de leer.
  ok(!/hasta que la sueltes/.test(HTML),
     "la pantalla de Tasas ya no promete que lo escrito dure hasta soltarlo");
  ok(!/La fijaste t\u00fa/.test(HTML) && !/La fijaste tú/.test(HTML),
     "ni lo llama \"la fijaste tú\"");
  ok(!/\u00faltima operaci\u00f3n de USDT tiene/.test(sacarFuncion("_htmlPublicaHoy")) ||
     /_origenLado\(/.test(sacarFuncion("_htmlPublicaHoy")),
     "la tarjeta ya no afirma que el suelo sale de una operación sin mirarlo");
  ok((sacarFuncion("_htmlPublicaHoy").match(/_origenLado\(/g)||[]).length===2,
     "y pregunta por los DOS lados, no por uno");

  // El botón del ARREGLO 130 ("usar la de tu venta") se QUITÓ: con el 131 la
  // app ya lo hace sola, y un botón que no puede cambiar nada enseña a no
  // pulsar los botones (ARREGLO 98).
  ok(!/_usarLaDeMiOperacion/.test(HTML),
     "el botón de usar la de la operación se quitó, no se dejó al lado");
  ok(!/o\.mejor/.test(sacarFuncion("_htmlPublicaHoy")),
     "y la tarjeta ya no lo dibuja");

  // ── El traspaso que falta ──────────────────────────────────────────
  // Un solo origen posible: sale solo, porque no hay nada que decidir.
  S.cuentas=[
    {id:"julio",nombre:"BINANCE JULIO",moneda:"USDT",saldo:0,activa:true},
    {id:"saipa",nombre:"BINANCE SAIPA",moneda:"USDT",saldo:100,activa:true}
  ];
  S.traspasos=[];
  let txt=F._cubrirUsdtParaVenta({cuentaId:"julio"}, 100);
  ok(/100,00 USDT desde BINANCE SAIPA/.test(txt),
     "con un solo origen posible, el traspaso sale solo y lo dice", txt);
  ok(S.traspasos.length===1 && Math.abs(S.traspasos[0].monto-100)<0.001 &&
     S.traspasos[0].origen==="saipa" && S.traspasos[0].destino==="julio" &&
     S.traspasos[0].moneda==="USDT",
     "queda como un traspaso normal, con su origen y su destino");
  ok(Math.abs(F._saldoCtaUsdt("saipa"))<0.001 && Math.abs(F._saldoCtaUsdt("julio")-100)<0.001,
     "y los dos saldos se mueven por el monto exacto de la venta");

  // Lo que sobra no se toca.
  S.cuentas=[{id:"julio",nombre:"BINANCE JULIO",moneda:"USDT",saldo:300,activa:true},
             {id:"saipa",nombre:"BINANCE SAIPA",moneda:"USDT",saldo:100,activa:true}];
  S.traspasos=[];
  ok(F._cubrirUsdtParaVenta({cuentaId:"julio"}, 100)==="" && S.traspasos.length===0,
     "si ya hay bastante, no se traspasa nada");

  // Una cuenta PERSONAL no es un origen: ese dinero ya salió de la empresa.
  S.cuentas=[{id:"julio",nombre:"BINANCE JULIO",moneda:"USDT",saldo:0,activa:true},
             {id:"mio",nombre:"MI SUELDO",moneda:"USDT",saldo:500,activa:true,esPersonal:true}];
  ok(F._otrasCtasUsdt("julio").length===0,
     "una cuenta personal 💜 no se usa para cubrir una venta de la empresa");

  // Y una apagada tampoco.
  S.cuentas=[{id:"julio",nombre:"BINANCE JULIO",moneda:"USDT",saldo:0,activa:true},
             {id:"off",nombre:"VIEJA",moneda:"USDT",saldo:500,activa:false}];
  ok(F._otrasCtasUsdt("julio").length===0, "ni una cuenta desactivada");

  // ── El traspaso se dice, no se hace en silencio ────────────────────
  const sv=sacarFuncion("saveIU");
  ok(/_cubrirUsdtParaVenta\(/.test(sv) && /Traspas/.test(sv),
     "saveIU avisa de lo que traspasó");
  ok(sv.indexOf("_cubrirUsdtParaVenta(") > sv.indexOf("VENTA de "),
     "y lo hace DESPUÉS de que ella confirme la venta, no antes");
}

// ══════════════════════════════════════════════════════════════════════
console.log("\nARREGLO 132 · la ida sube sola cuando hay bolívares parados");
{
  const inv=sacarFuncion("_inventarioBs");
  const cia=sacarFuncion("_colchonIdaAhora");
  const tr =sacarFuncion("_tasasRecomendadas");
  const av =sacarFuncion("avisoTasa");
  const sbs=sacarFuncion("_tasasSinBs");

  // ── Un solo sitio mide el inventario ────────────────────────────────
  // Calculado aparte, un día la tarjeta subiría la ida mientras el aviso de
  // abajo dice que todo va bien. Es la regla del 34,27 contra el 34,28.
  ok(/_colchonIdaAhora\(\)/.test(tr) && !/_colchon\("ida"\)/.test(tr),
     "la ida recomendada sale del colchón que manda AHORA, no del guardado");
  ok(/_inventarioBs\(\)/.test(cia), "y ese mira el inventario de bolívares");
  ok(/_inventarioBs\(\)/.test(av),
     "el aviso lee el MISMO inventario, no una segunda cuenta");

  // ── La conversión MULTIPLICA ────────────────────────────────────────
  // usdtCuentas ya está en USDT: para pasarlo a reales se multiplica por los
  // reales que vale un USDT. Dividiendo daría 33 R$ donde hay 850 y el
  // umbral no saltaría nunca.
  ok(/ves\s*\*\s*tB/.test(inv), "los bolívares se pasan a reales multiplicando");
  ok(!/ves\s*\/\s*tB/.test(inv), "no dividiendo");

  // ── Sin tasa de reales no se inventa el umbral ──────────────────────
  ok(/if\(tB>0\)/.test(inv), "sin tasa de reales no se decide nada");

  // ── Mirar el resultado no puede ser ya haberlo aplicado ─────────────
  ok(/finally\s*\{\s*_SIN_BS=false;\s*\}/.test(sbs),
     "_tasasSinBs devuelve la bandera en un finally");

  // ── Los valores por omisión ─────────────────────────────────────────
  ok(F._COLCHON_DEF.idaBs===0.05, "el colchón con bolívares por omisión es 5%");
  ok(F._UMBRAL_BS_DEF===200, "y el umbral, 200 reales");
  S.config={};
  ok(F._colchon("idaBs")===0.05 && F._umbralBsReales()===200,
     "sin nada escrito, mandan los de por omisión");
  S.config={colchonIdaBs:0.9, umbralBsReales:-5};
  ok(F._colchon("idaBs")===0.05 && F._umbralBsReales()===200,
     "y uno fuera de rango se ignora, no publica una tasa en pérdida");

  // ── El comportamiento, con sus números del 13/10 ────────────────────
  // 170.604 Bs a 1.010,14 son 168,89 USDT, que a 5,035 son 850 R$.
  const TB132=Date.now();               // nombre propio: T0 es del bloque del 130
  const _cuentasBs=(bs)=>[{id:"bdv",nombre:"BDV",moneda:"VES",saldo:bs,tipo:"banco",activa:true}];
  const _lotes=()=>[
    {id:TB132-864e5, tipo:"compra", moneda:"BRL", fecha:"10/12", fechaIso:"2026-10-12",
     usdt:100, tasa:5.035, comision:0, restante:100, cuentaId:"saipa"},
    {id:TB132-6e4,  tipo:"venta",  moneda:"VES", fecha:"10/13", fechaIso:"2026-10-13",
     usdt:168.81, tasa:1010.14, comision:0, bs:170521, bsRestante:0, cuentaId:"julio"}];
  const _poner=(bs,cfg)=>{
    S.config=Object.assign({comision_binance:0.007}, cfg||{});
    S.cuentas=_cuentasBs(bs);
    S.inventarioUsdt=_lotes(); S.inventarioUsdt_cerrado=[];
    S.prestamos=[]; S.cuentasCobrar=[]; S.brl=[]; S.vzla=[]; S.eeuu=[];
    S.tasasDia={}; S._tasasDiaMeta={};
  };
  _poner(40000, {colchonIda:0.07, colchonIdaBs:0.05, umbralBsReales:200});
  const q1=F._inventarioBs();
  ok(q1 && q1.reales>900 && q1.reales<1100 && q1.pasa===true,
     "con bolívares de sobra, el equivalente en reales pasa el umbral", q1 && Math.round(q1.reales));
  ok(Math.abs(F._colchonIdaAhora()-0.05)<1e-9,
     "y entonces manda el colchón con bolívares (5%)");

  // Por debajo del umbral manda el de siempre.
  _poner(2000, {colchonIda:0.07, colchonIdaBs:0.05, umbralBsReales:200});
  const q2=F._inventarioBs();
  ok(q2 && q2.pasa===false && q2.reales<200, "con pocos bolívares no pasa el umbral",
     q2 && Math.round(q2.reales));
  ok(Math.abs(F._colchonIdaAhora()-0.07)<1e-9, "y manda el colchón normal (7%)");

  // Y mirar el de siempre no deja la bandera puesta.
  _poner(40000, {colchonIda:0.07, colchonIdaBs:0.05, umbralBsReales:200});
  F._tasasSinBs();
  ok(Math.abs(F._colchonIdaAhora()-0.05)<1e-9,
     "después de mirar 'sin bolívares', sigue mandando el de bolívares");

  // ── El porqué dice POR QUÉ, con los tres valores ────────────────────
  // ARREGLO 136: esto vivía dentro de _htmlPublicaHoy y se mudó a _motivoPub(),
  // que es lo que la tarjeta pliega detrás de "por qué". Lo que fija la guardia
  // no cambia: los tres valores, por su FUENTE y no por el texto de alrededor
  // —pidiendo solo la palabra "umbral", quitar f2(invT.reales) pasaba.
  const hp=sacarFuncion("_motivoPub");
  ok(/_tasasSinBs\(\)/.test(hp), "la tarjeta compara con la de siempre");
  ok(/f2\(invT\.reales\)/.test(hp) && /f2\(invT\.umbral\)/.test(hp),
     "dice cuánto hay parado y cuál es el umbral, con sus dos números");
  ok(/_tasaCorta\(sinBs\.ida\)/.test(hp) && /_tasaCorta\(r\.ida\)/.test(hp),
     "y de cuánto a cuánto sube, con los dos");
  // ARREGLO 125: un número se escribe UNA vez.
  ok((hp.match(/_inventarioBs\(\)/g)||[]).length===1,
     "el inventario se pregunta una sola vez en la tarjeta");
  // ARREGLO 136: y ahora NO puede haber dos recuadros, porque _motivoPub
  // devuelve UN objeto —título y cuerpo— y quien lo dibuja es uno solo. Antes
  // eran dos ramas con la misma pinta y había que exigir el if/else.
  ok(/return \{/.test(hp) && /titulo:/.test(hp) && /cuerpo:/.test(hp),
     "el motivo sale como UN solo bloque, no como dos ramas que se parecen");
  const dif136=sacarFuncion("_htmlDifPub");
  ok((dif136.match(/background:var\(--avi-sup\);border-left/g)||[]).length===1,
     "y se dibuja en un único recuadro");
  ok(/lineas\.join\("<br>"\)/.test(hp),
     "la comparación va dentro de ese bloque, una línea por lado");

  // ── Guardar escribe las dos claves nuevas ───────────────────────────
  const gc=sacarFuncion("guardarColchones");
  ok(/colchonIdaBs\s*=/.test(gc) && /umbralBsReales\s*=/.test(gc),
     "Configuración guarda el colchón con bolívares y el umbral");
  ok(/inp-colchon-ida-bs/.test(HTML) && /inp-umbral-bs/.test(HTML),
     "y los dos campos existen en la pantalla");
  ok(!/_INV_BS/.test(HTML),
     "el inventario no se guarda en un memo: el número que decide la tasa no puede depender de cuándo se preguntó");
}

// ══════════════════════════════════════════════════════════════════════
console.log("\nARREGLO 139 · la vuelta baja cuando FALTAN bolivares, no cuando sobran reales");
{
  const invR=sacarFuncion("_inventarioBrl");
  const cva =sinComentarios(sacarFuncion("_colchonVueltaAhora"));
  const tr  =sacarFuncion("_tasasRecomendadas");
  const av  =sacarFuncion("avisoTasa");
  const sbr =sacarFuncion("_tasasSinBrl");
  const dn  =sinComentarios(sacarFuncion("_diaNormalBs"));

  ok(/_colchonVueltaAhora\(\)/.test(tr) && !/_colchon\("vuelta"\)/.test(tr),
     "la vuelta recomendada sale del colchón que manda AHORA");
  // El motivo es que FALTEN bolivares; los reales son la CONDICION de poder
  // atender las vueltas que entren. Al reves le daba una razon que no es suya.
  ok(/_faltanBs\(\)/.test(cva), "el colchón mira si FALTAN bolívares");
  ok(/_inventarioBrl\(\)/.test(cva), "y que haya reales para atender las vueltas");
  ok(/_faltanBs\(\)/.test(av), "el aviso lee la MISMA cuenta, no una segunda");
  // Los reales NO se convierten: enCuentas de BRL ya esta en reales.
  ok(/enCuentas/.test(invR) && !/usdtCuentas/.test(invR),
     "los reales se leen ya en reales, sin convertir");
  // Y los bolivares tampoco: el umbral esta EN bolivares, que es como ella los
  // mira. usdtCuentas obligaria a una tasa que puede faltar.
  ok(/enCuentas/.test(sinComentarios(sacarFuncion("_faltanBs"))),
     "y los bolívares se leen en bolívares, sin depender de ninguna tasa");
  ok(/finally\s*\{\s*_SIN_BRL=false;\s*\}/.test(sbr),
     "_tasasSinBrl devuelve la bandera en un finally");

  // ── El umbral sale de SUS dias, no de un numero fijo ────────────────
  // Sus palabras: "damelo tu porque eso realmente es relativo, todos los dias
  // son diferentes". Un numero puesto a ojo hoy estaria viejo en un mes: su
  // mediana diaria paso de 91.744 (90 dias) a 132.090 (15 dias).
  ok(/porDia/.test(dn) && /orig!=="BRL"/.test(dn) && /dest!=="VES"/.test(dn),
     "_diaNormalBs agrupa por día SOLO las idas, que son las que gastan bolívares");
  ok(!/\/ *n *\)/.test(dn) && /sort/.test(dn),
     "y usa la MEDIANA, no la media: la media sale inflada por los días de 600.000");
  ok(F._DIAS_NORMAL_BS===30, "mira los últimos 30 días CON operaciones");

  const _dia=(bs)=>({d:"13/10/26",orig:"BRL",dest:"VES",cant:bs,am:1,_uid:"x"+Math.random()});
  S.brl=[]; S.vzla=[]; S.eeuu=[];
  ok(F._diaNormalBs()===null, "sin una sola ida no hay día normal, y no se inventa");
  // Tres dias de 10.000, 20.000 y 90.000: la mediana son 20.000, la media 40.000.
  S.brl=[Object.assign(_dia(10000),{d:"01/10/26"}),
         Object.assign(_dia(20000),{d:"02/10/26"}),
         Object.assign(_dia(90000),{d:"03/10/26"})];
  ok(F._diaNormalBs().bs===20000,
     "la mediana de 10.000/20.000/90.000 son 20.000, no los 40.000 de la media", F._diaNormalBs().bs);
  // Lo del mismo dia se SUMA: es un dia, no dos operaciones.
  S.brl=[Object.assign(_dia(10000),{d:"01/10/26"}),
         Object.assign(_dia(10000),{d:"01/10/26"}),
         Object.assign(_dia(90000),{d:"03/10/26"})];
  // Quedan DOS dias (20.000 y 90.000) y la mediana de dos es su promedio: 55.000.
  ok(F._diaNormalBs().bs===55000 && F._diaNormalBs().dias===2,
     "dos idas del mismo día cuentan como UN día", JSON.stringify(F._diaNormalBs()));

  // El suyo manda; en blanco vuelve al medido, NUNCA a cero.
  S.config={umbralFaltanBs:77000};
  ok(F._umbralFaltanBs().bs===77000 && F._umbralFaltanBs().suyo===true,
     "si escribe un umbral, manda el suyo");
  S.config={};
  ok(F._umbralFaltanBs().bs===55000 && F._umbralFaltanBs().suyo===false,
     "en blanco vuelve al medido");
  S.config={umbralFaltanBs:0};
  ok(F._umbralFaltanBs().suyo===false,
     "y un cero NO se acepta: dejaría la regla muerta sin decirlo");

  // ── El comportamiento, con sus numeros ──────────────────────────────
  const TB139=Date.now();
  const _poner3=(brl,bs,cfg,conIdas)=>{
    S.config=Object.assign({comision_binance:0.007}, cfg||{});
    S.cuentas=[{id:"pag",nombre:"PAGBANK",moneda:"BRL",saldo:brl,tipo:"banco",activa:true},
               {id:"bdv",nombre:"BDV",moneda:"VES",saldo:bs,tipo:"banco",activa:true}];
    S.inventarioUsdt=[
      {id:TB139-864e5,tipo:"compra",moneda:"BRL",fecha:"10/12",fechaIso:"2026-10-12",
       usdt:100,tasa:5.035,comision:0,restante:100,cuentaId:"x"},
      {id:TB139-6e4,tipo:"venta",moneda:"VES",fecha:"10/13",fechaIso:"2026-10-13",
       usdt:168.81,tasa:1010.14,comision:0,bs:170521,bsRestante:0,cuentaId:"y"}];
    S.inventarioUsdt_cerrado=[];S.prestamos=[];S.cuentasCobrar=[];S.vzla=[];S.eeuu=[];
    // Su dia normal: 100.000 Bs (tres dias, el de en medio)
    S.brl = (conIdas===false) ? [] :
      [Object.assign(_dia(50000),{d:"01/10/26"}),
       Object.assign(_dia(100000),{d:"02/10/26"}),
       Object.assign(_dia(300000),{d:"03/10/26"})];
    S.tasasDia={};S._tasasDiaMeta={};
  };
  const CFG={colchonIda:0.07, colchonIdaBs:0.05, umbralBsReales:200,
             colchonVuelta:0.05, colchonVueltaBrl:0.03, umbralBrlReales:1000};

  // 1) Le FALTAN bolivares y tiene reales -> baja la vuelta. Es su caso real:
  //    el 13/10 acabo con 14,58 Bs y 3.118 R$ tras tres idas seguidas.
  _poner3(3252, 14, CFG);
  const f1=F._faltanBs();
  ok(f1 && f1.umbral===100000 && f1.tiene===14 && f1.pasa===true,
     "con 14 Bs y un día normal de 100.000, le faltan", JSON.stringify(f1));
  ok(Math.abs(F._colchonVueltaAhora()-0.03)<1e-9,
     "y manda el colchón que baja la vuelta (3%)");

  // 2) Le faltan bolivares pero NO tiene reales -> no baja: no podria
  //    atender las vueltas que entraran. Esa es la condicion, no el motivo.
  _poner3(346, 14, CFG);
  ok(F._faltanBs().pasa===true && F._inventarioBrl().pasa===false,
     "le faltan bolívares pero no tiene reales");
  ok(Math.abs(F._colchonVueltaAhora()-0.05)<1e-9,
     "y entonces la vuelta NO baja: sin reales no puede atender vueltas");

  // 3) NO le faltan bolivares -> no baja, aunque le sobren reales. Esto es lo
  //    que el 133 hacia mal: bajaba por los reales, con bolivares de sobra.
  _poner3(3252, 500000, CFG);
  ok(F._faltanBs().pasa===false, "con 500.000 Bs no le faltan");
  ok(Math.abs(F._colchonVueltaAhora()-0.05)<1e-9,
     "y la vuelta NO baja aunque tenga 3.252 R$: ese era el fallo del 133");

  // 4) Sin historico de idas no se decide nada. Un umbral adivinado moveria
  //    la tasa que publica.
  _poner3(3252, 14, CFG, false);
  ok(F._faltanBs()===null, "sin idas registradas no hay día normal");
  ok(Math.abs(F._colchonVueltaAhora()-0.05)<1e-9, "y manda el colchón de siempre");

  // 5) El 135 ya no hace falta, y eso es lo que simplifica este arreglo: no se
  //    puede estar lleno y vacio de bolivares a la vez, asi que las dos reglas
  //    no pueden volver a pelearse. Con los dos lados cargados la ida sube y la
  //    vuelta se queda quieta, igual que antes, pero por una sola regla.
  _poner3(3252, 500000, CFG);
  ok(Math.abs(F._colchonIdaAhora()-0.05)<1e-9, "con bolívares de sobra la ida sube");
  ok(Math.abs(F._colchonVueltaAhora()-0.05)<1e-9, "y la vuelta no baja");
  ok(!/_inventarioBs\(\)/.test(cva),
     "y _colchonVueltaAhora ya no necesita preguntar por bolívares parados: el disparador los excluye");
  ok(/_SIN_BS/.test(cva),
     "pero sigue respetando _SIN_BS, para que la comparación conteste el escenario entero");

  // ── La tarjeta dice el motivo DE VERDAD ─────────────────────────────
  const hp=sacarFuncion("_motivoPub");
  ok(/_tasasSinBrl\(\)/.test(hp), "la tarjeta compara también la vuelta");
  ok(/f0\(fal\.tiene\)/.test(hp) && /f0\(fal\.umbral\)/.test(hp),
     "y dice los DOS números: lo que tiene y lo que es un día normal suyo");
  ok(/_tasaCorta\(sinBrl\.vuelta\)/.test(hp) && /_tasaCorta\(r\.vuelta\)/.test(hp),
     "y de cuánto a cuánto baja");
  ok(/_p2pBolivaresDelMes\(\)/.test(hp),
     "y cuántas veces ha comprado bolívares en Binance: sin ese número hay que creérselo");
  ok(!/no tienes que hacer el P2P que esa vuelta alta cubre/.test(HTML),
     "y ya no dice el motivo viejo, que es el P2P que casi no hace (18 contra 2 en octubre)");
  ok(/lineas\.join\("<br>"\)/.test(hp),
     "los dos lados van en el MISMO recuadro, uno por línea");
  ok((hp.match(/_faltanBs\(\)/g)||[]).length===1,
     "y la cuenta se pregunta una sola vez");

  // Un lote de venta nacido de una remesa no es una compra en Binance.
  S.inventarioUsdt=[{id:1,tipo:"venta",moneda:"VES",fechaIso:new Date().toISOString().slice(0,10),bs:1,bsRestante:0},
                    {id:2,tipo:"venta",moneda:"VES",fechaIso:new Date().toISOString().slice(0,10),bs:1,bsRestante:0,origenRemesa:"r1"}];
  S.inventarioUsdt_cerrado=[];
  ok(F._p2pBolivaresDelMes()===1,
     "las ventas nacidas de una remesa no cuentan como compra en Binance", F._p2pBolivaresDelMes());

  const gc=sacarFuncion("guardarColchones");
  ok(/umbralFaltanBs\s*=/.test(gc) && /delete S\.config\.umbralFaltanBs/.test(gc),
     "Configuración guarda el umbral, y el campo vacío lo BORRA en vez de escribir 0");
  ok(/inp-colchon-vuelta-brl/.test(HTML) && /inp-umbral-faltan-bs/.test(HTML),
     "y los campos existen en la pantalla");
  ok(!/_DIA_NORMAL_MEMO|_FALTAN_BS_MEMO/.test(HTML),
     "sin memo: el número que decide la tasa no puede depender de cuándo se preguntó");
}

// ══════════════════════════════════════════════════════════════════════
console.log("\nARREGLO 134 · el apartamento y su cronograma");
{
  // ── NO va en S.prestamos, y eso es lo primero ──────────────────────
  // S.prestamos alimenta el limite de credito de SUS clientes, el perfil de
  // riesgo y la ganancia por prestamos del Cierre. Una deuda suya metida ahi
  // entraria en las tres cuentas.
  const res = sinComentarios(sacarFuncion("_inmResumen"));
  const pag = sinComentarios(sacarFuncion("pagarCuotaInm"));
  ok(!/S\.prestamos/.test(res) && !/S\.prestamos/.test(pag),
     "el inmueble no toca S.prestamos");
  ok(/S\.inmCuotas/.test(sinComentarios(sacarFuncion("_inmCuotasDe"))),
     "las cuotas viven en su propia lista");

  // ── Las DOS listas se fusionan y viajan ────────────────────────────
  // Sin esto el remoto las reemplaza enteras y se pierde lo que se marco aqui.
  ["inmuebles","inmCuotas"].forEach(function(k){
    ok(new RegExp('"'+k+'"').test(sacarConstante("_MERGE_FIELDS")),
       k+" esta en _MERGE_FIELDS");
    ok(new RegExp('"'+k+'"').test(sacarConstante("DATA_KEYS")),
       k+" esta en DATA_KEYS");
  });
  // Y SEPARADAS: con las cuotas dentro del contrato, marcar una en el telefono
  // y otra en la PC haria que una pisara a la otra, porque lo que viaja es el
  // registro entero.
  ok(!/cuotas:\s*\[/.test(sinComentarios(sacarFuncion("saveInmueble"))),
     "el contrato no guarda sus cuotas dentro");

  // ── El resumen sale de UN sitio ────────────────────────────────────
  // Lo leen la tarjeta, los avisos del Resumen y el pie de la lista. Calculado
  // aparte, bastaria un redondeo distinto para que la tarjeta diga una cosa y
  // el aviso de al lado otra.
  const avi = sinComentarios(sacarFuncion("_avisosInmueble"));
  const tar = sinComentarios(sacarFuncion("_inmTarjeta"));
  ok(/_inmResumen\(/.test(avi) && /_inmResumen\(/.test(tar),
     "la tarjeta y los avisos leen el MISMO _inmResumen()");
  ok(!/parseFloat\(c\.monto\)/.test(avi),
     "y el aviso no vuelve a sumar las cuotas por su cuenta");

  // ── Las tres bolsas NO se mezclan ──────────────────────────────────
  // propio sale de su cuenta; banco lo paga el banco; condonable se perdona.
  // Sumarlas diria que debe 354.224 cuando de ella salen 30.614.
  ok(/out\.banco\+=m/.test(res) && /out\.condonable\+=m/.test(res) && /out\.propio\+=m/.test(res),
     "el resumen separa lo propio, lo del banco y lo condonable");
  ok(/if\(c\.banco\)/.test(res) && res.indexOf("if(c.banco)")<res.indexOf("out.propio+=m"),
     "y la del banco se aparta ANTES de sumar a lo propio");

  // ── Pagar REGISTRA LA OPERACION, no escribe el saldo ───────────────
  ok(/ajusteCuentaEgreso\(/.test(pag) && /descontarFIFOEgreso\(/.test(pag) && /S\.egresos\.push\(/.test(pag),
     "pagar crea un egreso, baja la cuenta y baja el lote FIFO");
  ok(/restaurarFIFOEgreso\(/.test(sinComentarios(sacarFuncion("deshacerCuotaInm"))) &&
     /_marcarBorradoMerge\("egresos"/.test(sinComentarios(sacarFuncion("deshacerCuotaInm"))),
     "y deshacer lo devuelve todo, borrando el egreso");
  // La del banco NO es un pago suyo: crear un egreso ahi seria inventarse una
  // salida de dinero que nunca ocurrio.
  ok(/if\(c\.banco\)\{/.test(pag) && pag.indexOf("if(c.banco){")<pag.indexOf("ajusteCuentaEgreso("),
     "la cuota del banco se resuelve ANTES, sin tocar ninguna cuenta");

  // ── ARREGLO 32: desplegar no repinta ───────────────────────────────
  const tog = sinComentarios(sacarFuncion("_toggleInmCuotas"));
  ok(!/\bR\(\)/.test(tog) && /getElementById\("inm-cuotas-"/.test(tog),
     "desplegar las cuotas no llama a R(): se cambia por su id");
  // Y el rotulo del boton sale de SU id, no del `event` global: leerlo del
  // evento funciona hasta que alguien llama a esto desde otro sitio.
  ok(/getElementById\("inm-btn-"/.test(tog) && !/\bevent\b/.test(tog),
     "y el rótulo del botón también, sin depender del event global");

  // ── Las fechas de las mensuales usan _sumarMeses ───────────────────
  // setMonth() convierte el 31/01 + 1 mes en 03/03. Aqui el dia es el 10 y no
  // muerde, pero una copia de este codigo con otra fecha si.
  const viz = sinComentarios(sacarFuncion("cargarContratoViz"));
  ok(/_sumarMeses\(/.test(viz) && !/setMonth\(/.test(viz),
     "las 24 mensuales salen de _sumarMeses(), nunca de setMonth()");

  // ── Los montos son los del CONTRATO, no los de la propuesta ────────
  // La hoja "Proposta" lista la mensual en 1.000,00 (el principal sin
  // intereses) y la clausula 4.2.2 (c.1) en 1.152,44 con Tabla Price. Igual la
  // anual: 2.136,18 contra 2.455,42. Poner los de la propuesta le diria que
  // paga 3.977,84 menos de lo que va a pagar.
  const V = F._VIZ;
  ok(V && V.mensual && Math.abs(V.mensual.monto-1152.44)<1e-9,
     "la mensual es la del contrato (1.152,44), no la de la propuesta (1.000)");
  ok(V && (V.cuotas||[]).some(function(c){return Math.abs(c.monto-2455.42)<1e-9;}),
     "y la anual es 2.455,42, no 2.136,18");
  ok(V && V.mensual.n===24, "son 24 mensuales");
  // El precio y las piezas del contrato, por si alguien los toca sin leerlo.
  ok(V && Math.abs(V.precio-350246.29)<1e-9, "el precio es el de la cláusula 3.1");
  const fin = (V.cuotas||[]).find(function(c){return c.banco;});
  ok(fin && Math.abs(fin.monto-280197.03)<1e-9 && fin.iso==="2026-12-31",
     "el financiamiento son 280.197,03 el 31/12/2026");
  const bp = (V.cuotas||[]).find(function(c){return c.condonable;});
  ok(bp && Math.abs(bp.monto-43413.08)<1e-9,
     "y la Bom Pagador son 43.413,08, marcada como condonable");

  // ── El resumen, con el contrato de verdad ──────────────────────────
  S.inmuebles=[{id:"i1",nombre:"Apto",moneda:"BRL",precio:350246.29,tipo:"personal",cuentaId:""}];
  S.inmCuotas=[];
  var mete=function(c,i){
    S.inmCuotas.push({id:"c"+i,inmId:"i1",concepto:c.concepto,iso:c.iso,monto:c.monto,
      banco:!!c.banco,condonable:!!c.condonable,pagado:!!c.pagado,montoPagado:null});
  };
  V.cuotas.forEach(mete);
  for(var i=0;i<24;i++) mete({concepto:"Mensual "+(i+1),iso:"2027-01-10",monto:V.mensual.monto},100+i);
  var R1=F._inmResumen(S.inmuebles[0]);
  ok(R1.nCuotas===28, "28 cuotas en total", R1.nCuotas);
  ok(Math.abs(R1.propio-30613.98)<0.005,
     "de ella salen 30.613,98: la señal, las 24 mensuales y la anual", R1.propio);
  ok(Math.abs(R1.banco-280197.03)<0.005, "el banco pone 280.197,03", R1.banco);
  ok(Math.abs(R1.condonable-43413.08)<0.005, "y 43.413,08 se perdonan", R1.condonable);
  ok(Math.abs(R1.propio-R1.falta)<0.005 && R1.pagado===0,
     "sin nada pagado, falta todo lo propio");
  // Pagada una, falta baja y pagado sube, y la suma se conserva.
  S.inmCuotas[0].pagado=true; S.inmCuotas[0].montoPagado=500;
  var R2=F._inmResumen(S.inmuebles[0]);
  ok(Math.abs(R2.pagado-500)<0.005 && Math.abs(R2.falta-(R1.propio-500))<0.005,
     "al pagar la señal, lo pagado sube 500 y lo que falta baja 500");
  ok(Math.abs((R2.pagado+R2.falta)-R1.propio)<0.005,
     "y pagado + falta sigue siendo lo propio");
}

// ══════════════════════════════════════════════════════════════════════
// ARREGLO 137 · una marca de borrado se puede LEVANTAR, y el levantamiento viaja
// ══════════════════════════════════════════════════════════════════════
console.log("\nARREGLO 137 · la marca se levanta, y el levantamiento viaja");
{
  const inv=S.inventarioUsdt, cer=S.inventarioUsdt_cerrado, del=S._deletedMerge;

  // ── La aritmetica de la marca ────────────────────────────────────────
  S._deletedMerge={};
  F._marcarBorradoMerge("inventarioUsdt", 7);
  ok(F._estaBorradoMerge("inventarioUsdt", 7), "enterrada: cuenta como borrado");
  F._levantarBorradoMerge("inventarioUsdt", 7);
  ok(!F._estaBorradoMerge("inventarioUsdt", 7), "levantada: deja de contar");
  ok((S._deletedMerge.inventarioUsdt||[]).length===1,
     "y sigue habiendo UNA entrada, no dos: con dos, `some` encuentra la enterrada y manda ella");
  F._marcarBorradoMerge("inventarioUsdt", 7);
  ok(F._estaBorradoMerge("inventarioUsdt", 7), "y se puede volver a enterrar");
  ok((S._deletedMerge.inventarioUsdt||[]).length===1, "tampoco ahi se duplica");

  // ── La union: manda la MAS NUEVA, no la primera ──────────────────────
  // Esto es el fallo de verdad. El aparato levanta la marca; el servidor
  // contesta con la suya todavia enterrada. Si gana la del servidor, el lote
  // que acaba de revivir se muere en la respuesta del mismo guardado.
  {
    const local ={inventarioUsdt:[{id:9,ts:1000,revive:2000}]};
    const remoto={inventarioUsdt:[{id:9,ts:1000}]};
    const u=F._unirMarcasBorrado(local,remoto);
    ok(u.inventarioUsdt.length===1, "una sola entrada por id");
    ok(u.inventarioUsdt[0].revive===2000,
       "gana el levantamiento del aparato, no la marca vieja del servidor");
    // Y al reves: si el servidor trae un entierro MAS NUEVO que mi
    // levantamiento, manda el servidor. Lo ultimo que paso gana, siempre.
    const u2=F._unirMarcasBorrado({inventarioUsdt:[{id:9,ts:1000,revive:2000}]},
                                  {inventarioUsdt:[{id:9,ts:3000}]});
    ok(u2.inventarioUsdt[0].ts===3000 && !u2.inventarioUsdt[0].revive,
       "y un entierro mas nuevo le gana al levantamiento viejo");
  }
  // Y se escribe UNA vez: los dos sitios que unian marcas la llaman.
  ok(/_unirMarcasBorrado\(/.test(sinComentarios(HTML.split("_aplicarEstadoDeApi")[1]||"").slice(0,20000)),
     "la respuesta de la API une con _unirMarcasBorrado");
  ok((HTML.match(/_unirMarcasBorrado\(/g)||[]).length>=3,
     "y la importacion de archivo tambien, en vez de su propia copia");
  // Ninguno de los dos puede volver a deduplicar quedandose con la primera:
  // asi es como se perdia un levantamiento, decidiendolo el orden.
  ok(!/var kk=String\(x&&x\.id\); if\(vistos\[kk\]\)return false/.test(HTML),
     "y ya no queda ningun dedupe que se quede con la primera que encuentra");

  // ── Las DOS mitades de revivir, ejecutadas ───────────────────────────
  S.inventarioUsdt=[]; S.inventarioUsdt_cerrado=[];
  const lote={id:21,tipo:"venta",moneda:"VES",fecha:"10/11",fechaIso:"2026-10-11",
              usdt:10,bs:10000,bsRestante:5000,tasa:1000,_cerrado:true,_fechaCierre:"2026-10-12"};
  S.inventarioUsdt_cerrado=[lote];
  S._deletedMerge={inventarioUsdt:[{id:21,ts:Date.now(),por:"x"}]};
  F._revivirLote(lote);
  ok(S.inventarioUsdt.length===1 && !S.inventarioUsdt_cerrado.length,
     "revivir lo pasa del archivo a los vivos");
  ok(!F._estaBorradoMerge("inventarioUsdt",21),
     "deja de contar como borrado en los vivos");
  ok(F._estaBorradoMerge("inventarioUsdt_cerrado",21),
     "y la copia archivada queda ENTERRADA, o la del servidor lo devuelve a cero");
  // El camino de vuelta: se gasta del todo y tiene que poder volver al archivo.
  S.inventarioUsdt[0].bsRestante=0;
  S.cuentas=S.cuentas||[];
  F.sincronizarFIFOconCuentas();
  ok(!S.inventarioUsdt.length && S.inventarioUsdt_cerrado.length===1,
     "gastado del todo, vuelve al archivo");
  ok(F._estaBorradoMerge("inventarioUsdt",21) && !F._estaBorradoMerge("inventarioUsdt_cerrado",21),
     "y las dos marcas se dan la vuelta: sin esto no podria archivarse nunca mas");

  // ── El boton de devolver (B) ─────────────────────────────────────────
  // La huella que decide si hay que guardar tiene que VER el levantamiento.
  // Mirando solo el id, levantar una marca no cambiaba nada y el guardado no
  // salia: el arreglo se quedaba en el aparato.
  {
    const hu=sinComentarios(sacarFuncion("_huellaCompleta"));
    ok(/x&&x\.revive/.test(hu) && /x&&x\.ts/.test(hu),
       "_huellaCompleta distingue una marca levantada de una enterrada");
  }
  ok(F._huecoDeLote({tipo:"venta",bs:10000,bsRestante:2500})===7500,
     "el hueco de una venta sale de bs - bsRestante");
  ok(F._huecoDeLote({tipo:"compra",usdt:100,restante:40})===60,
     "y el de una compra, de usdt - restante");
  ok(F._huecoDeLote({tipo:"venta",bs:10000,bsRestante:10000})===0,
     "un lote entero no tiene hueco: su boton no se dibuja");
  {
    const dev=sinComentarios(sacarFuncion("devolverLoteArchivado"));
    ok(/_huecoDeLote\(l\)/.test(dev),
       "devolver lee el hueco de _huecoDeLote, el mismo que decide si el boton sale");
    ok(/v>hueco/.test(dev),
       "y no deja pasar mas de lo que el lote fue: inventarle saldo le cambia la tasa");
    ok(/_revivirLote\(l\)/.test(dev),
       "y pasa por _revivirLote, que es quien sabe mover las dos marcas");
    ok(!/ajusteCuenta|c\.saldo|S\.cuentas\[/.test(dev),
       "y NO toca ninguna cuenta: el banco ya devolvio ese dinero al borrar la remesa");
    ok(/permisoEdicion\(\)/.test(dev), "y respeta el permiso de editar");
    ok(/logAudit\(/.test(dev), "y queda en el registro de auditoria");
    // El boton sale SOLO si hay donde devolver, y llama a esta funcion.
    ok(/_huecoDeLote\(r\)>0[\s\S]{0,300}devolverLoteArchivado\(/.test(HTML),
       "en la tabla de archivados el boton solo se dibuja si el lote tiene hueco");
  }
  // La tabla de archivados: tantas <th> como <td> en su fila.
  {
    const t=(HTML.match(/📦 LOTES ARCHIVADOS[\s\S]*?<\/thead>/)||[""])[0];
    const ths=(t.match(/<th /g)||[]).length;
    const fila=(HTML.match(/var arows=arch\.map\(function\(r\)\{[\s\S]*?\}\)\.join\(""\);/)||[""])[0];
    const tds=(fila.match(/<td /g)||[]).length;
    ok(ths===tds && ths===8,
       "la cabecera de archivados y su fila llevan las mismas columnas", ths+" th / "+tds+" td");
    // Y el boton va en la PRIMERA columna. Esta tabla mide 560 px de ancho
    // minimo y hace scroll horizontal; en su telefono son 412, asi que al
    // final quedaba fuera de pantalla. Medido en Chromium: habia que arrastrar
    // la tabla para verlo, y es el unico camino para reparar un lote.
    ok(/^[\s\S]{0,120}devolverLoteArchivado\(/.test(fila.split("<td ").slice(1).join("<td ")),
       "el boton de devolver va en la primera columna, no detras del scroll");
    ok(/<thead><tr[^>]*>"\+\s*\n?\s*"<th [^>]*><\/th>/.test(t),
       "y su cabecera tambien es la primera");
  }

  S.inventarioUsdt=inv; S.inventarioUsdt_cerrado=cer; S._deletedMerge=del;
}

// ══════════════════════════════════════════════════════════════════════
// ARREGLO 138 · el método se marca solo, según de dónde salgan los bolívares
// ══════════════════════════════════════════════════════════════════════
console.log("\nARREGLO 138 · el metodo sale del origen de los bolivares");
{
  const inv=S.inventarioUsdt, tx=S.tx;
  // De donde vino un lote lo dice `origenRemesa`, NO la marca `permuta`.
  // Medido en sus 174 lotes de VES: 24 nacieron de una remesa y solo UNO lleva
  // `permuta`, asi que mirando la marca se acertaria en 1 de 24.
  ok(F._loteEsDeRemesa({origenRemesa:"mX"}) === true,
     "un lote con origenRemesa vino de una remesa");
  ok(F._loteEsDeRemesa({permuta:true}) === false,
     "y la marca `permuta` sola NO basta: en sus datos es 1 de los 24");
  ok(F._loteEsDeRemesa({plataforma:"Binance P2P"}) === false,
     "un lote de Binance salio de vender USDT");
  {
    const dev=sinComentarios(sacarFuncion("_origenBsRemesa"));
    ok(/_loteEsDeRemesa\(/.test(dev),
       "y _origenBsRemesa pregunta por ahi, no por `permuta` suelta");
    ok(!/\.permuta/.test(dev),
       "y no vuelve a mirar la marca por su cuenta");
  }

  const L=(id,bs,origen)=>({id:id,tipo:"venta",moneda:"VES",fecha:"10/01",fechaIso:"2026-10-01",
    usdt:bs/1000,bs:bs,bsRestante:bs,tasa:1000,cuentaDestinoId:"bdv",
    origenRemesa:origen||"", plataforma:origen?"Remesa":"Binance P2P"});

  // Solo ventas de USDT -> P2P
  S.inventarioUsdt=[L(1,50000,null)];
  let o=F._origenBsRemesa("VES",10000,"bdv");
  ok(o.metodo==="p2p" && !o.mixto, "solo de ventas de USDT -> Con USDT (P2P)");
  // Solo bolivares que le pagaron -> calce
  S.inventarioUsdt=[L(2,50000,"mA")];
  o=F._origenBsRemesa("VES",10000,"bdv");
  ok(o.metodo==="calce" && !o.mixto, "solo de bolivares que le pagaron -> Calce directo");
  // Mixto: manda la mayoria, y se dice que es mixto
  S.inventarioUsdt=[L(3,3000,"mA"), L(4,50000,null)];
  o=F._origenBsRemesa("VES",10000,"bdv");
  ok(o.mixto===true, "mixto se reconoce como mixto");
  ok(Math.round(o.deRemesa)===3000 && Math.round(o.deVenta)===7000,
     "y se reparte por el ORDEN FIFO, no a ojo", o.deRemesa+" / "+o.deVenta);
  ok(o.metodo==="p2p", "con 3.000 contra 7.000 manda P2P");
  S.inventarioUsdt=[L(5,8000,"mA"), L(6,50000,null)];
  o=F._origenBsRemesa("VES",10000,"bdv");
  ok(o.metodo==="calce", "con 8.000 contra 2.000 manda el calce");
  // Sin lote detras NO decide, y cae del lado que no infla la ganancia.
  S.inventarioUsdt=[L(7,1000,"mA")];
  o=F._origenBsRemesa("VES",10000,"bdv");
  ok(o.sinLote>0 && o.metodo==="p2p",
     "lo que no sale de ningun lote no decide: manda P2P, que es el que SI paga comision");

  // Lo que ella pulsa queda anotado, y desde ahi la app no se lo mueve.
  {
    const tm=sinComentarios(sacarFuncion("txMetodo"));
    ok(/_metodoTocado\s*=\s*true/.test(tm), "pulsar el metodo lo marca como suyo");
    ok(/_ponerMetodoTx\(/.test(tm), "y usa la MISMA funcion que la app, no una copia");
    const au=sinComentarios(sacarFuncion("_autoMetodoTx"));
    ok(/_metodoTocado/.test(au) && /return/.test(au.split("_metodoTocado")[1].slice(0,40)),
       "y la app se para en seco si lo eligio ella");
    ok(/_origenBsRemesa\(/.test(au),
       "la app decide con _origenBsRemesa, la misma que escribe la linea de abajo");
    ok(/esRutaCalce\(/.test(au),
       "y solo en las rutas donde el calce existe");
  }
  // El bloque que lo explica usa la MISMA funcion. Calculado aparte, un dia la
  // app marcaria calce con la linea de debajo diciendo venta de USDT.
  ok(/_origenBsRemesa\(/.test(sinComentarios(sacarFuncion("_htmlDeDondeSalen"))),
     "la linea de la pantalla sale de _origenBsRemesa, no de una cuenta propia");

  // ── El atributo bien formado. ─────────────────────────────────────────
  // Esto esta aqui por un error real: al anadir el onchange me comi la comilla
  // que cerraba el oninput, y el HTML quedo `upC("tx") onchange='...'>` dentro
  // del mismo atributo. El archivo seguia siendo JavaScript valido, asi que
  // revisar.py pasaba y las guardias de texto tambien — el monto dejaba de
  // guardarse y solo se veia TECLEANDO en el navegador.
  ok(!/upC\(\\"tx\\"\)\s+onchange=/.test(HTML),
     "ningun oninput se queda sin cerrar antes de su onchange");
  ok((HTML.match(/upC\(\\"tx\\"\)' onchange='_autoMetodoTx\(\)'/g)||[]).length===2,
     "el monto y la tasa del dia marcan el metodo al SALIR del campo (ARREGLO 32: en cada tecla mataria el campo)");
  ok(/S\.tx\.cuentaDest=this\.value;_autoMetodoTx\(\)/.test(HTML),
     "y cambiar la cuenta de entrega tambien, que cambia de que lotes sale");

  S.inventarioUsdt=inv; S.tx=tx;
}

console.log("\n" + (fallos ? "FALLARON " + fallos + " prueba(s)" : "Todo en orden."));
process.exit(fallos ? 1 : 0);
