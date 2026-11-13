import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "examen-pruebas-2026";

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      rol: user.rol,
      condominio_id: user.condominio_id,
      persona_id: user.persona_id,
      nombres: user.nombres,
    },
    SECRET,
    { expiresIn: "8h" }
  );
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No autenticado" });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

// Copropiedad sobre la que opera la petición.
// El superadmin puede indicar ?condominio_id=; los demás usan el suyo.
export function condominioDeLaPeticion(req) {
  if (req.user.rol === "superadmin" && req.query.condominio_id) {
    return Number(req.query.condominio_id);
  }
  return req.user.condominio_id;
}

// Roles con acceso a la información global de la copropiedad.
export const ROLES_GESTION = ["superadmin", "admin_copropiedad", "contador"];

// Propietarios y residentes solo pueden ver los inmuebles a los que están vinculados.
export function esUsuarioFinal(req) {
  return req.user.rol === "propietario" || req.user.rol === "residente";
}

// Fragmento SQL que restringe los inmuebles (alias `alias`) a los del usuario final.
// Agrega el parámetro a `params` y devuelve "" para los roles de gestión.
export function filtroInmueblesDelUsuario(req, alias, params) {
  if (!esUsuarioFinal(req)) return "";
  params.push(req.user.persona_id ?? -1);
  const col = req.user.rol === "propietario" ? "propietario_id" : "residente_id";
  return ` AND ${alias}.${col} = $${params.length}`;
}

export function requireRol(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: "No autorizado para esta acción" });
    }
    next();
  };
}
