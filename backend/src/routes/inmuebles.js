import { Router } from "express";
import { query } from "../lib/db.js";
import { authRequired, condominioDeLaPeticion } from "../lib/auth.js";
import { diasEntre, calcularInteresMora } from "../lib/finance.js";

const router = Router();
router.use(authRequired);

// Listado de inmuebles de la copropiedad (paginado).
router.get("/", async (req, res) => {
  const condominioId = condominioDeLaPeticion(req);
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const offset = page * limit;

  const { rows } = await query(
    `SELECT i.id, i.identificacion, i.torre, i.piso, i.tipo, i.area,
            i.coeficiente, i.estado, i.condominio_id,
            p.nombres AS propietario, r.nombres AS residente
       FROM inmueble i
       LEFT JOIN persona p ON p.id = i.propietario_id
       LEFT JOIN persona r ON r.id = i.residente_id
      ORDER BY i.id
      LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const total = await query("SELECT COUNT(*)::int AS n FROM inmueble WHERE condominio_id = $1", [condominioId]);
  res.json({ page, limit, total: total.rows[0].n, inmuebles: rows });
});

// Detalle de un inmueble.
router.get("/:id", async (req, res) => {
  const condominioId = condominioDeLaPeticion(req);
  const { rows } = await query(
    `SELECT i.*, p.nombres AS propietario, r.nombres AS residente
       FROM inmueble i
       LEFT JOIN persona p ON p.id = i.propietario_id
       LEFT JOIN persona r ON r.id = i.residente_id
      WHERE i.id = $1 AND i.condominio_id = $2`,
    [req.params.id, condominioId]
  );
  if (!rows[0]) return res.status(404).json({ error: "Inmueble no encontrado" });
  res.json(rows[0]);
});

// Estado de cuenta de un inmueble (facturas con saldo + interés de mora).
router.get("/:id/estado-cuenta", async (req, res) => {
  const inmuebleId = Number(req.params.id);

  const inm = await query(
    `SELECT i.*, c.tasa_mora_mensual, c.dias_gracia
       FROM inmueble i JOIN condominio c ON c.id = i.condominio_id
      WHERE i.id = $1`,
    [inmuebleId]
  );
  if (!inm.rows[0]) return res.status(404).json({ error: "Inmueble no encontrado" });
  const tasa = inm.rows[0].tasa_mora_mensual;

  const { rows } = await query(
    `SELECT id, periodo, fecha_emision, fecha_vencimiento, total, saldo, estado
       FROM factura
      WHERE inmueble_id = $1 AND estado <> 'Anulada'
      ORDER BY fecha_vencimiento`,
    [inmuebleId]
  );

  const hoy = new Date();
  let totalSaldo = 0;
  let totalInteres = 0;
  const facturas = rows.map((f) => {
    const diasMora = diasEntre(f.fecha_vencimiento, hoy);
    const interes = calcularInteresMora(f.saldo, diasMora, tasa);
    totalSaldo += Number(f.saldo);
    totalInteres += interes;
    return { ...f, dias_mora: diasMora > 0 ? diasMora : 0, interes_mora: interes };
  });

  res.json({
    inmueble: { id: inm.rows[0].id, identificacion: inm.rows[0].identificacion },
    facturas,
    total_saldo: totalSaldo,
    total_interes: totalInteres,
    total_a_pagar: totalSaldo + totalInteres,
  });
});

export default router;
