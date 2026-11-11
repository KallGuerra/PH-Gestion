import { Router } from "express";
import { query } from "../lib/db.js";
import { authRequired, condominioDeLaPeticion } from "../lib/auth.js";
import { diasEntre, estaEnMora } from "../lib/finance.js";

const router = Router();
router.use(authRequired);

// Cartera por inmueble (saldos pendientes).
router.get("/", async (req, res) => {
  const condominioId = condominioDeLaPeticion(req);
  const { rows } = await query(
    `SELECT i.id AS inmueble_id, i.identificacion, p.nombres AS propietario,
            COALESCE(SUM(f.saldo),0) AS saldo_total,
            COUNT(f.id) FILTER (WHERE f.saldo > 0) AS facturas_pendientes
       FROM inmueble i
       LEFT JOIN persona p ON p.id = i.propietario_id
       LEFT JOIN factura f ON f.inmueble_id = i.id AND f.estado <> 'Anulada' AND f.saldo > 0
      WHERE i.condominio_id = $1
      GROUP BY i.id, i.identificacion, p.nombres
      ORDER BY saldo_total DESC`,
    [condominioId]
  );
  const total = rows.reduce((a, r) => a + Number(r.saldo_total), 0);
  res.json({ cartera_total: total, inmuebles: rows });
});

// Cartera por edades (aging).
router.get("/edades", async (req, res) => {
  const condominioId = condominioDeLaPeticion(req);
  const { rows } = await query(
    `SELECT f.saldo, f.fecha_vencimiento
       FROM factura f
      WHERE f.condominio_id = $1 AND f.estado <> 'Anulada' AND f.saldo > 0`,
    [condominioId]
  );

  const hoy = new Date();
  const buckets = { corriente: 0, d1_30: 0, d31_60: 0, d61_90: 0, mas_90: 0 };
  for (const f of rows) {
    const saldo = Number(f.saldo);
    const d = diasEntre(f.fecha_vencimiento, hoy);
    if (d <= 0) buckets.corriente += saldo;
    if (d >= 0 && d <= 30) buckets.d1_30 += saldo;
    if (d > 30 && d <= 60) buckets.d31_60 += saldo;
    if (d > 60 && d <= 90) buckets.d61_90 += saldo;
    if (d > 90) buckets.mas_90 += saldo;
  }
  const total = buckets.corriente + buckets.d1_30 + buckets.d31_60 + buckets.d61_90 + buckets.mas_90;
  res.json({ ...buckets, total });
});

// Inmuebles en mora.
router.get("/mora", async (req, res) => {
  const condominioId = condominioDeLaPeticion(req);
  const { rows } = await query(
    `SELECT f.id, f.inmueble_id, i.identificacion, f.periodo,
            f.fecha_vencimiento, f.saldo
       FROM factura f JOIN inmueble i ON i.id = f.inmueble_id
      WHERE f.condominio_id = $1 AND f.estado <> 'Anulada' AND f.saldo > 0`,
    [condominioId]
  );

  const enMora = rows.filter((f) => estaEnMora(f.fecha_vencimiento));
  const porInmueble = {};
  for (const f of enMora) {
    if (!porInmueble[f.inmueble_id]) {
      porInmueble[f.inmueble_id] = { inmueble_id: f.inmueble_id, identificacion: f.identificacion, saldo_mora: 0, facturas: 0 };
    }
    porInmueble[f.inmueble_id].saldo_mora += Number(f.saldo);
    porInmueble[f.inmueble_id].facturas += 1;
  }
  const lista = Object.values(porInmueble);
  res.json({ inmuebles_en_mora: lista.length, detalle: lista });
});

export default router;
