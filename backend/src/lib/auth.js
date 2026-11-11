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

export function requireRol(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: "No autorizado para esta acción" });
    }
    next();
  };
}
