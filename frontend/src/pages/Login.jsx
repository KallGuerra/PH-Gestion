import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setSession } from "../api.js";

export default function Login() {
  const [email, setEmail] = useState("admin1@laspalmas.co");
  const [password, setPassword] = useState("Examen2026*");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setSession(data.token, data.user);
      navigate("/");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="login-box" onSubmit={submit}>
        <h1>PH Gestión</h1>
        <p className="sub">Plataforma de administración de propiedad horizontal</p>
        <div className="field">
          <label>Correo electrónico</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {err && <div className="err">{err}</div>}
        <button type="submit" disabled={loading}>{loading ? "Ingresando..." : "Iniciar sesión"}</button>
        <div className="hint">
          Usuarios de prueba (clave <code>Examen2026*</code>):<br />
          admin1@laspalmas.co · contador1@laspalmas.co · juan.perez@correo.co · admin2@miradordelrio.co
        </div>
      </form>
    </div>
  );
}
