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

const NECESARIAS = ["td", "cfgMora", "_diasIso", "detalleMora", "moraPendiente",
                    "congelarMora", "_sumarMeses", "_isoDeFecha", "calcularAmortizacion",
                    "tasaAnualEfectiva", "_periodDaysDe", "perfilRiesgoCliente",
                    "puntoEquilibrio", "tasaSugerida"];
// S es el estado global de la app; aca solo hace falta S.config.
const S = { config: {}, prestamos: [] };
const F = new Function("S", NECESARIAS.map(sacarFuncion).join("\n") +
  "\nreturn {" + NECESARIAS.join(",") + "};")(S);

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

console.log("\n" + (fallos ? "FALLARON " + fallos + " prueba(s)" : "Todo en orden."));
process.exit(fallos ? 1 : 0);
