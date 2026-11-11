import { Router } from "express";
import { query } from "../lib/db.js";
import { authRequired, condominioDeLaPeticion } from "../lib/auth.js";

const router = Router();
router.use(authRequired);

router.get("/", async (req, res) => {
  const condominioId = condominioDeLaPeticion(req);

  // Periodo de análisis (por defecto, el más reciente facturado).
  let periodo = req.query.periodo;
  if (!periodo) {
    const p = await query(
      "SELECT MAX(periodo) AS p FROM factura WHERE condominio_id = $1",
      [condominioId]
    );
    periodo = p.rows[0].p;
  }

  const inm = await query("SELECT COUNT(*)::int AS n FROM inmueble WHERE condominio_id = $1", [condominioId]);
  const prop = await query(
    "SELECT COUNT(DISTINCT propietario_id)::int AS n FROM inmueble WHERE condominio_id = $1 AND propietario_id IS NOT NULL",
    [condominioId]
  );
  const resid = await query(
    "SELECT COUNT(DISTINCT residente_id)::int AS n FROM inmueble WHERE condominio_id = $1 AND residente_id IS NOT NULL",
    [condominioId]
  );
  const cartera = await query(
    "SELECT COALESCE(SUM(saldo),0)::numeric AS s FROM factura WHERE condominio_id = $1 AND estado <> 'Anulada'",
    [condominioId]
  );
  const facturado = await query(
    "SELECT COALESCE(SUM(total),0)::numeric AS s FROM factura WHERE condominio_id = $1 AND periodo = $2 AND estado <> 'Anulada'",
    [condominioId, periodo]
  );
  const recaudo = await query(
    "SELECT COALESCE(SUM(valor),0)::numeric AS s FROM pago WHERE condominio_id = $1 AND to_char(fecha,'YYYY-MM') = $2 AND anulado = FALSE",
    [condominioId, periodo]
  );
  const ingresosConcepto = await query(
    `SELECT c.nombre AS concepto, SUM(d.valor)::numeric AS valor
       FROM factura_detalle d
       JOIN factura f ON f.id = d.factura_id
       JOIN concepto c ON c.id = d.concepto_id
      WHERE f.condominio_id = $1 AND f.periodo = $2 AND f.estado <> 'Anulada'
      GROUP BY c.nombre ORDER BY valor DESC`,
    [condominioId, periodo]
  );

  const facturadoPeriodo = Number(facturado.rows[0].s);
  const recaudadoPeriodo = Number(recaudo.rows[0].s);
  const porcentajeRecuperacion = (recaudadoPeriodo / facturadoPeriodo) * 100;

  res.json({
    periodo,
    total_inmuebles: inm.rows[0].n,
    total_propietarios: prop.rows[0].n,
    total_residentes: resid.rows[0].n,
    cartera_total: Number(cartera.rows[0].s),
    facturacion_periodo: facturadoPeriodo,
    recaudo_periodo: recaudadoPeriodo,
    porcentaje_recuperacion: Math.round(porcentajeRecuperacion * 100) / 100,
    ingresos_por_concepto: ingresosConcepto.rows,
  });
});

export default router;
