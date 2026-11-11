import { Router } from "express";
import { query, pool } from "../lib/db.js";
import { authRequired, condominioDeLaPeticion, requireRol } from "../lib/auth.js";
import { estadoPorSaldo } from "../lib/finance.js";

const router = Router();
router.use(authRequired);

// Listado de recaudos.
router.get("/", async (req, res) => {
  const condominioId = condominioDeLaPeticion(req);
  const { rows } = await query(
    `SELECT p.id, p.fecha, p.medio, p.valor, p.no_aplicado, p.anulado,
            i.identificacion
       FROM pago p JOIN inmueble i ON i.id = p.inmueble_id
      WHERE p.condominio_id = $1
      ORDER BY p.fecha DESC, p.id DESC`,
    [condominioId]
  );
  res.json({ recaudos: rows });
});

// Detalle de derrame: cómo se repartió cada pago entre las facturas.
router.get("/derrame", async (req, res) => {
  const condominioId = condominioDeLaPeticion(req);
  const { rows } = await query(
    `SELECT p.id AS pago_id, p.fecha, i.identificacion, p.valor AS valor_pago,
            f.periodo, f.id AS factura_id, pa.valor_aplicado
       FROM pago_aplicacion pa
       JOIN pago p ON p.id = pa.pago_id
       JOIN factura f ON f.id = pa.factura_id
       JOIN inmueble i ON i.id = p.inmueble_id
      WHERE p.condominio_id = $1 AND p.anulado = FALSE
      ORDER BY p.fecha DESC, p.id DESC`,
    [condominioId]
  );
  res.json({ derrame: rows });
});

// Registrar un recaudo y aplicarlo (derrame) sobre las facturas pendientes del inmueble.
router.post("/", requireRol("admin_copropiedad", "contador", "superadmin"), async (req, res) => {
  const condominioId = condominioDeLaPeticion(req);
  const { inmueble_id, fecha, medio, valor } = req.body || {};
  if (!inmueble_id || !valor) {
    return res.status(400).json({ error: "inmueble_id y valor son obligatorios" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const pago = await client.query(
      `INSERT INTO pago (condominio_id, inmueble_id, fecha, medio, valor)
       VALUES ($1, $2, COALESCE($3, CURRENT_DATE), COALESCE($4,'Transferencia'), $5)
       RETURNING id`,
      [condominioId, inmueble_id, fecha || null, medio || null, valor]
    );
    const pagoId = pago.rows[0].id;

    const facturas = await client.query(
      `SELECT id, total, saldo, estado
         FROM factura
        WHERE inmueble_id = $1 AND saldo > 0 AND estado <> 'Anulada'
        ORDER BY fecha_vencimiento DESC`,
      [inmueble_id]
    );

    let restante = Number(valor);
    const aplicaciones = [];
    for (const f of facturas.rows) {
      if (restante <= 0) break;
      const saldo = Number(f.saldo);
      const aplicado = Math.min(restante, saldo);

      const upd = await client.query(
        "UPDATE factura SET saldo = saldo - $1 WHERE id = $2 RETURNING total, saldo",
        [aplicado, f.id]
      );
      const nuevo = upd.rows[0];
      const nuevoEstado = estadoPorSaldo(nuevo.total, nuevo.saldo, f.estado);
      await client.query("UPDATE factura SET estado = $1 WHERE id = $2", [nuevoEstado, f.id]);

      await client.query(
        "INSERT INTO pago_aplicacion (pago_id, factura_id, valor_aplicado) VALUES ($1,$2,$3)",
        [pagoId, f.id, aplicado]
      );
      aplicaciones.push({ factura_id: f.id, valor_aplicado: aplicado, estado: nuevoEstado });
      restante -= aplicado;
    }

    await client.query("UPDATE pago SET no_aplicado = $1 WHERE id = $2", [restante, pagoId]);
    await client.query("COMMIT");
    res.status(201).json({ pago_id: pagoId, aplicaciones, no_aplicado: restante });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Error registrando el recaudo", detalle: e.message });
  } finally {
    client.release();
  }
});

// Anular (reversar) un recaudo.
router.post("/:id/anular", requireRol("admin_copropiedad", "contador", "superadmin"), async (req, res) => {
  const condominioId = condominioDeLaPeticion(req);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const pago = await client.query(
      "SELECT id FROM pago WHERE id = $1 AND condominio_id = $2 AND anulado = FALSE",
      [req.params.id, condominioId]
    );
    if (!pago.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Recaudo no encontrado o ya anulado" });
    }

    await client.query("DELETE FROM pago_aplicacion WHERE pago_id = $1", [req.params.id]);
    await client.query("UPDATE pago SET anulado = TRUE WHERE id = $1", [req.params.id]);

    await client.query("COMMIT");
    res.json({ pago_id: Number(req.params.id), anulado: true });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Error anulando el recaudo", detalle: e.message });
  } finally {
    client.release();
  }
});

export default router;
