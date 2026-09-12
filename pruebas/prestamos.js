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
                    "_MERGE_OBJETOS", "_MERGE_HISTORIAL",
                    "DATA_KEYS", "_CLAVES_QUE_NO_SON_DATOS"];

const NECESARIAS = ["r4", "f2", "td", "cfgMora", "_diasIso", "detalleMora", "moraPendiente",
                    "congelarMora", "_sumarMeses", "_isoDeFecha", "calcularAmortizacion",
                    "tasaAnualEfectiva", "_periodDaysDe", "perfilRiesgoCliente",
                    "puntoEquilibrio", "tasaSugerida", "_conDiaDelMes",
                    "cronogramaCuotas", "_fechaPrimeraCuota", "diasPrimeraCuota",
                    "ajusteDiasPrimeraCuota", "interesPorAjusteDias",
                    "cuotasRecomendadas", "limiteCredito",
                    "costoOperativoPorPrestamo", "pctCostoOperativo",
                    "capitalRealTotal", "_mesesDesde", "_acumuladosMes",
                    "conciliacionCapital", "getMesKeyActual",
                    "montoAUsdt", "montoConMoneda", "_unicos",
                    "_marcarCambiados", "_refotografiar", "_mergeArrayById",
                    "_marcarTodoLoQueSeFusiona", "_marcarObjetosCambiados",
                    "_mergeObjetoPorClave", "_unirHistorial", "_unirMarcasCampos",
                    "_huellaCompleta", "_conteoRapido",
                    "crearLoteRecibido", "quitarLoteDeRemesa", "_loteAlCobrar",
                    "ordenFIFO", "normalizarInventarioFIFO", "simularConsumoFIFO",
                    "f4", "f0", "_leerNumero", "_avisoCambioSaldo", "_fechaLote"];
// _refotografiar escribe en window; en Node no existe, se le pone uno vacio.
global.window = global.window || {};
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
// Sin normalizar, el de la remesa se iba al final aunque fuera el primero.
ok([{fecha:"12/09/26",id:1},{fecha:"09/12",id:2}].sort(F.ordenFIFO)[0].id === 2,
   "(asi era antes: la venta de USDT se colaba delante)");

console.log("\nEl caso del 12/09, con sus numeros");
S.inventarioUsdt = [];
// Por la manana entran bolivares de dos remesas VZLA→BRL
F.crearLoteRecibido("VES", 11000, 11.4631, "bdv", "12/09/26", "kayrelis");
F.crearLoteRecibido("VES", 33000, 34.3893, "bdv", "12/09/26", "julio");
// Por la tarde vende USDT por 300.000 Bs
S.inventarioUsdt.push({ id: Date.now()+5000, tipo:"venta", fecha:"09/12", moneda:"VES",
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

// Y que los tres sitios de index.html usen la funcion: el fallo estaba en la
// llamada, no en el orden.
ok(/var fecha=_fechaLote\(f\.fecha\);/.test(HTML),
   "saveIU pone la fecha del lote con _fechaLote");
ok(/tipo:"venta", fecha:_fechaLote\(fecha\), moneda:moneda,/.test(HTML),
   "crearLoteRecibido la normaliza dentro, para quien la llame manana");
ok(/if\(r\.fecha\)\{ var fn=_fechaLote\(r\.fecha\); if\(fn!==r\.fecha\) r\.fecha=fn; \}/.test(HTML),
   "y los lotes ya guardados se corrigen al leer el inventario");
ok(!/f\.fecha\.slice\(5\)\.replace\("-","\/"\)/.test(HTML),
   "ya no queda el recorte a mano que se desincronizaba");

console.log("\n" + (fallos ? "FALLARON " + fallos + " prueba(s)" : "Todo en orden."));
process.exit(fallos ? 1 : 0);
