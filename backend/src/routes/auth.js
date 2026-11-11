import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../lib/db.js";
import { signToken, authRequired } from "../lib/auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son obligatorios" });
  }
  const { rows } = await query(
    "SELECT * FROM usuario WHERE email = $1 AND activo = TRUE",
    [email]
  );
  const user = rows[0];
  if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

  const token = signToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      nombres: user.nombres,
      rol: user.rol,
      condominio_id: user.condominio_id,
      persona_id: user.persona_id,
    },
  });
});

router.get("/me", authRequired, (req, res) => {
  res.json({ user: req.user });
});

export default router;
