import { Router } from "express";
import { query, pool } from "../lib/db.js";
import { authRequired, condominioDeLaPeticion, requireRol } from "../lib/auth.js";

const router = Router();
router.use(authRequired);

// Fecha de vencimiento: día 10 del mes siguiente al periodo (YYYY-MM).
function vencimientoDe(periodo) {
  const [y, m] = periodo.split("-").map(Number);
  const siguiente = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return `${siguiente}-10`;
}

// Valida los datos de la facturación masiva y devuelve un mensaje por campo
// indicando qué debe corregirse. Objeto vacío = datos válidos.
function validarMasiva({ periodo, concepto_id }) {
  const errores = {};

  const cid = String(concepto_id ?? "").trim();
  if (cid === "" || concepto_id === null) {
    errores.concepto_id = "Concepto (id): el campo es obligatorio. Ingrese el id numérico del concepto (ej. 3).";
  } else if (!/^\d+$/.test(cid) || Number(cid) < 1) {
    errores.concepto_id = `Concepto (id): "${cid}" no es válido. Debe ser un número entero mayor que 0, sin letras ni símbolos (ej. 3).`;
  }

  const per = String(periodo ?? "").trim();
  if (per === "") {
    errores.periodo = "Periodo: el campo es obligatorio. Ingrese año y mes con el formato AAAA-MM (ej. 2026-12).";
  } else if (!/^\d{4}-\d{2}$/.test(per)) {
    errores.periodo = `Periodo: "${per}" no tiene el formato correcto. Use AAAA-MM, con guion y mes de dos dígitos (ej. 2026-12).`;
  } else {
    const mes = Number(per.slice(5, 7));
    if (mes < 1 || mes > 12) {
      errores.periodo = `Periodo: el mes "${per.slice(5, 7)}" no existe. Debe estar entre 01 y 12 (ej. 2026-12).`;
    }
  }

  return errores;
}

// Listado de facturas de un periodo.
router.get("/", async (req, res) => {
  const condominioId = condominioDeLaPeticion(req);
  const periodo = req.query.periodo;
  const params = [condominioId];
  let sql = `SELECT f.id, f.inmueble_id, i.identificacion, f.periodo,
                    f.fecha_emision, f.fecha_vencimiento, f.total, f.saldo, f.estado
               FROM factura f JOIN inmueble i ON i.id = f.inmueble_id
              WHERE f.condominio_id = $1`;
  if (periodo) {
    params.push(periodo);
    sql += ` AND f.periodo = $2`;
  }
  sql += " ORDER BY i.identificacion, f.periodo";
  const { rows } = await query(sql, params);
  res.json({ facturas: rows });
});

// Facturación masiva de una cuota extraordinaria repartida por coeficiente.
router.post(
  "/masiva",
  requireRol("admin_copropiedad", "contador", "superadmin"),
  async (req, res) => {
    const condominioId = condominioDeLaPeticion(req);
    const { periodo, concepto_id } = req.body || {};
    const errores = validarMasiva({ periodo, concepto_id });
    if (Object.keys(errores).length) {
      return res.status(400).json({ error: Object.values(errores).join(" "), errores });
    }

    const cpt = await query(
      "SELECT * FROM concepto WHERE id = $1 AND condominio_id = $2",
      [Number(concepto_id), condominioId]
    );
    if (!cpt.rows[0]) {
      const msg = `Concepto (id): no existe un concepto con id ${concepto_id} en esta copropiedad. Verifique el id del concepto.`;
      return res.status(404).json({ error: msg, errores: { concepto_id: msg } });
    }
    const concepto = cpt.rows[0];
    const totalARepartir = Number(concepto.valor_base);

    const inms = await query(
      "SELECT id, coeficiente FROM inmueble WHERE condominio_id = $1 AND estado = 'activo' ORDER BY id",
      [condominioId]
    );

    const vencimiento = vencimientoDe(String(periodo).trim());
    const client = await pool.connect();
    const creadas = [];
    try {
      await client.query("BEGIN");
      for (const inm of inms.rows) {
        // Redondeo comercial de la cuota a la centena.
        const valor = Math.round((totalARepartir * Number(inm.coeficiente)) / 100) * 100;
        const f = await client.query(
          `INSERT INTO factura (condominio_id, inmueble_id, periodo, fecha_emision,
                                fecha_vencimiento, subtotal, total, saldo, estado)
           VALUES ($1,$2,$3, CURRENT_DATE, $4, $5, $5, $5, 'Pendiente')
           RETURNING id, inmueble_id, total`,
          [condominioId, inm.id, String(periodo).trim(), vencimiento, valor]
        );
        await client.query(
          `INSERT INTO factura_detalle (factura_id, concepto_id, descripcion, valor)
           VALUES ($1, $2, $3, $4)`,
          [f.rows[0].id, concepto.id, concepto.nombre, valor]
        );
        creadas.push(f.rows[0]);
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      return res.status(500).json({ error: "Error generando la facturación", detalle: e.message });
    } finally {
      client.release();
    }

    const sumaFacturada = creadas.reduce((acc, f) => acc + Number(f.total), 0);
    res.status(201).json({
      concepto: concepto.nombre,
      total_a_repartir: totalARepartir,
      suma_facturada: sumaFacturada,
      facturas_generadas: creadas.length,
      facturas: creadas,
    });
  }
);

// Anular una factura.
router.post("/:id/anular", requireRol("admin_copropiedad", "contador", "superadmin"), async (req, res) => {
  const condominioId = condominioDeLaPeticion(req);
  const { rows } = await query(
    "UPDATE factura SET estado = 'Anulada', saldo = 0 WHERE id = $1 AND condominio_id = $2 RETURNING id, estado",
    [req.params.id, condominioId]
  );
  if (!rows[0]) return res.status(404).json({ error: "Factura no encontrada" });
  res.json(rows[0]);
});

export default router;
