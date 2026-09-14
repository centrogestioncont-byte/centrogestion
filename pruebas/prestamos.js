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
const CONSTANTES = ["MIN_DIAS_PRIMERA_CUOTA", "_MERGE_FIELDS", "_MERGE_ID_FIELD",
                    "_MERGE_OBJETOS", "_MERGE_HISTORIAL", "_RATE_LIMITS",
                    "DATA_KEYS", "_CLAVES_QUE_NO_SON_DATOS", "PAGO_DEBE"];

const NECESARIAS = ["r4", "f2", "td", "ds", "cfgMora", "_diasIso", "detalleMora", "moraPendiente",
                    "congelarMora", "_sumarMeses", "_isoDeFecha", "calcularAmortizacion",
                    "tasaAnualEfectiva", "_periodDaysDe", "perfilRiesgoCliente",
                    "puntoEquilibrio", "tasaSugerida", "_conDiaDelMes",
                    "cronogramaCuotas", "_fechaPrimeraCuota", "diasPrimeraCuota",
                    "ajusteDiasPrimeraCuota", "interesPorAjusteDias",
                    "cuotasRecomendadas", "limiteCredito",
                    "costoOperativoPorPrestamo", "pctCostoOperativo",
                    "capitalRealTotal", "_mesesDesde", "_acumuladosMes",
                    "conciliacionCapital", "getMesKeyActual", "ajustesDesdeApertura", "_isoDeDDMMAA",
                    "traspasosAPersonal", "efectoTasasDesde", "_isoDeFechaLote",
                    "tasaDeReferencia", "_tasaFijadaAMano", "setTasaDia", "soltarTasaDia",
                    "_isoDeLote", "_fechaLoteIso", "_num",
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
                    "COM", "_comIU", "_localeOCR", "_numOCR",
                    "_candUSDT", "_candFiat", "_cuadrarP2P", "_parsearOCR", "_parsearConLocale", "_numLegible",
                    "_tasaAutoPago", "_deudaCubierta", "_htmlTasaInvertida",
                    "_htmlTasaEnPalabras", "_htmlEquivAbono", "_htmlCalcPago",
                    "_pasoRedondeoCobro", "_montoACobrar", "_fMontoCobro",
                    "_deudaACobrar"];
// _refotografiar escribe en window; en Node no existe, se le pone uno vacio.
global.window = global.window || {};
// setTasaDia/soltarTasaDia guardan y repintan, y avisan por alert(). Aqui no
// hay pantalla: se anota lo que habrian dicho para poder comprobarlo.
global.avisos = [];
global.saveData = () => {};
global.R = () => {};
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
  "\nreturn {" + NECESARIAS.concat(CONSTANTES).join(",") + "};")(S, getRateToUsdt, calcMesCompleto);

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

F._marcarCambiados([cobro], memo);
ok(cobro._mod === undefined, "el primer guardado tras abrir no marca nada");

cobro.estado = "cobrado";
F._marcarCambiados([cobro], memo);
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
ok(/tipo:"venta", fecha:_fechaLote\(fecha\), fechaIso:_fechaLoteIso\(fecha\), moneda:moneda,/.test(HTML),
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
ok(_llamadas.every(c => c.indexOf("res.uv)") > -1),
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
ok((HTML.match(/_comIU\(f\.comision\)/g) || []).length === 2,
   "los dos sitios que leen la comision pasan por _comIU",
   (HTML.match(/_comIU\(f\.comision\)/g) || []).length);

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
ok(/volver a fijar la apertura solo lo esconde/.test(HTML),
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
ok(/Cuadra\. Lo que queda sin explicar/.test(_blq),
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
ok(/DE QUÉ SE COMPONE EL CAPITAL|De qué se compone el capital/.test(HTML),
   "en su sitio va de que se compone el capital");
ok(/conciliación de capital/.test(HTML),
   "y manda a la conciliacion, que si responde si falta dinero");
// El capital sale de una sola funcion, para que dos pantallas no cuenten
// distinto el mismo dinero (faltaba la reserva: 2.302,34 contra 2.479,17).
ok(/var _capReal=\(typeof capitalRealTotal==="function"\)\?capitalRealTotal\(\):null;/.test(HTML),
   "el capital del PDF sale de capitalRealTotal(), la misma de Balance de Cuentas");
ok(/var siCobrasTodo=_capReal\?_capReal\.total:/.test(HTML),
   "y el 'potencial total' es ese mismo numero, no una suma a mano");

// Los intereses de prestamos entran en ganBrutaTotal y NO en miGanOperaciones:
// el desglose saltaba de 226,89 a 221,50 sin una fila que lo explicara, y la
// pestaña Operaciones enseñaba otra ganancia bruta distinta.
ok((HTML.match(/Intereses de préstamos \("\+calc\.ganPrestamosCant/g)||[]).length===2,
   "los intereses de prestamos tienen su fila en la pantalla y en el PDF");
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
ok(/salieron de tus cuentas personales/.test(HTML),
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
ok(/calc\.socioFinalEE>0\.009\?"<tr><td>Pagar /.test(HTML),
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
ok(/Detalle del mes · todo el movimiento/.test(HTML), "y el detalle de todo el movimiento");
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

console.log("\n" + (fallos ? "FALLARON " + fallos + " prueba(s)" : "Todo en orden."));
process.exit(fallos ? 1 : 0);
