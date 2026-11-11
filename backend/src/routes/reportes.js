import { Router } from "express";
import { query } from "../lib/db.js";
import { authRequired, condominioDeLaPeticion } from "../lib/auth.js";

const router = Router();
router.use(authRequired);

// Totales de facturación por periodo.
router.get("/totales-facturacion", async (req, res) => {
  const condominioId = condominioDeLaPeticion(req);
  const { rows } = await query(
    `SELECT periodo,
            SUM(total)::numeric AS facturado,
            SUM(saldo)::numeric AS cartera
       FROM factura
      WHERE condominio_id = $1
      GROUP BY periodo
      ORDER BY periodo`,
    [condominioId]
  );
  res.json({ totales: rows });
});

// Totales de recaudo por periodo (mes del pago).
router.get("/totales-recaudo", async (req, res) => {
  const condominioId = condominioDeLaPeticion(req);
  const { rows } = await query(
    `SELECT to_char(fecha,'YYYY-MM') AS periodo,
            SUM(valor)::numeric AS recaudado
       FROM pago
      WHERE condominio_id = $1 AND anulado = FALSE
      GROUP BY to_char(fecha,'YYYY-MM')
      ORDER BY periodo`,
    [condominioId]
  );
  res.json({ totales: rows });
});

// Balance por concepto (lo facturado por cada concepto).
router.get("/balance-concepto", async (req, res) => {
  const condominioId = condominioDeLaPeticion(req);
  const { rows } = await query(
    `SELECT c.nombre AS concepto, SUM(d.valor)::numeric AS total
       FROM factura_detalle d
       JOIN factura f ON f.id = d.factura_id
       JOIN concepto c ON c.id = d.concepto_id
      WHERE f.condominio_id = $1 AND f.estado <> 'Anulada'
      GROUP BY c.nombre
      ORDER BY total DESC`,
    [condominioId]
  );
  res.json({ balance: rows });
});

// Valores mensuales: facturado vs recaudado.
router.get("/valores-mensuales", async (req, res) => {
  const condominioId = condominioDeLaPeticion(req);
  const fact = await query(
    `SELECT periodo, SUM(total)::numeric AS facturado
       FROM factura WHERE condominio_id = $1 AND estado <> 'Anulada'
      GROUP BY periodo`,
    [condominioId]
  );
  const rec = await query(
    `SELECT to_char(fecha,'YYYY-MM') AS periodo, SUM(valor)::numeric AS recaudado
       FROM pago WHERE condominio_id = $1 AND anulado = FALSE
      GROUP BY to_char(fecha,'YYYY-MM')`,
    [condominioId]
  );
  const mapa = {};
  for (const r of fact.rows) mapa[r.periodo] = { periodo: r.periodo, facturado: Number(r.facturado), recaudado: 0 };
  for (const r of rec.rows) {
    mapa[r.periodo] = mapa[r.periodo] || { periodo: r.periodo, facturado: 0, recaudado: 0 };
    mapa[r.periodo].recaudado = Number(r.recaudado);
  }
  const valores = Object.values(mapa).sort((a, b) => a.periodo.localeCompare(b.periodo));
  res.json({ valores });
});

export default router;
