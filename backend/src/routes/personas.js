import { Router } from "express";
import { query } from "../lib/db.js";
import { authRequired, condominioDeLaPeticion } from "../lib/auth.js";

const router = Router();
router.use(authRequired);

// Listado de personas (propietarios, residentes, contactos).
router.get("/", async (req, res) => {
  const condominioId = condominioDeLaPeticion(req);
  const { rows } = await query(
    `SELECT id, tipo_persona, nombres, documento, email, telefono
       FROM persona WHERE condominio_id = $1 ORDER BY nombres`,
    [condominioId]
  );
  res.json({ personas: rows });
});

// Analítica del censo.
router.get("/censo", async (req, res) => {
  const condominioId = condominioDeLaPeticion(req);
  const prop = await query(
    `SELECT COUNT(DISTINCT propietario_id)::int AS n FROM inmueble
      WHERE condominio_id = $1 AND propietario_id IS NOT NULL`,
    [condominioId]
  );
  const resid = await query(
    `SELECT COUNT(DISTINCT residente_id)::int AS n FROM inmueble
      WHERE condominio_id = $1 AND residente_id IS NOT NULL`,
    [condominioId]
  );
  const porTipo = await query(
    `SELECT tipo, COUNT(*)::int AS n FROM inmueble
      WHERE condominio_id = $1 GROUP BY tipo ORDER BY tipo`,
    [condominioId]
  );
  res.json({
    total_propietarios: prop.rows[0].n,
    total_residentes: resid.rows[0].n,
    distribucion_inmuebles: porTipo.rows,
  });
});

// Contactos por inmueble.
router.get("/contactos", async (req, res) => {
  const condominioId = condominioDeLaPeticion(req);
  const { rows } = await query(
    `SELECT i.identificacion,
            p.nombres AS propietario, p.email AS email_propietario, p.telefono AS tel_propietario,
            r.nombres AS residente, r.email AS email_residente, r.telefono AS tel_residente
       FROM inmueble i
       LEFT JOIN persona p ON p.id = i.propietario_id
       LEFT JOIN persona r ON r.id = i.residente_id
      WHERE i.condominio_id = $1
      ORDER BY i.identificacion`,
    [condominioId]
  );
  res.json({ contactos: rows });
});

export default router;
