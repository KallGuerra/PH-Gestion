// Utilidades financieras compartidas (cálculo de mora, estados, edades de cartera).

// Días calendario entre dos fechas (fecha de vencimiento -> hoy).
export function diasEntre(desde, hasta) {
  const a = new Date(desde);
  const b = new Date(hasta);
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// Interés de mora sobre un saldo vencido.
// tasaMensual viene de la copropiedad (ej. 0.02 = 2% mensual).
export function calcularInteresMora(saldo, diasMora, tasaMensual) {
  const s = Number(saldo);
  const t = Number(tasaMensual);
  if (diasMora <= 0 || s <= 0) return 0;
  const interes = s * t * diasMora;
  return Math.round(interes);
}

// Determina el estado de una factura a partir de su saldo.
export function estadoPorSaldo(total, saldo, estadoActual) {
  if (estadoActual === "Anulada") return "Anulada";
  if (saldo === 0) return "Pagada";
  if (saldo < total) return "Parcialmente pagada";
  return "Pendiente";
}

// ¿La factura está en mora a la fecha indicada?
export function estaEnMora(fechaVencimiento, hoy = new Date()) {
  return new Date(fechaVencimiento) < hoy;
}
