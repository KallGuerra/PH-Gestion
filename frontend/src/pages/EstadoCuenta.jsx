import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, money } from "../api.js";

export default function EstadoCuenta() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api(`/api/inmuebles/${id}/estado-cuenta`).then(setData).catch((e) => setErr(e.message));
  }, [id]);

  if (err) return <div className="err">{err}</div>;
  if (!data) return <p>Cargando...</p>;

  return (
    <>
      <div className="topbar">
        <h2>Estado de cuenta — Inmueble {data.inmueble.identificacion}</h2>
        <Link to="/inmuebles">← Volver</Link>
      </div>
      <table>
        <thead>
          <tr><th>Periodo</th><th>Vencimiento</th><th>Estado</th><th className="right">Saldo</th><th className="right">Días mora</th><th className="right">Interés mora</th></tr>
        </thead>
        <tbody>
          {data.facturas.map((f) => (
            <tr key={f.id}>
              <td>{f.periodo}</td>
              <td>{String(f.fecha_vencimiento).slice(0, 10)}</td>
              <td><span className={"badge " + f.estado.split(" ")[0]}>{f.estado}</span></td>
              <td className="right">{money(f.saldo)}</td>
              <td className="right">{f.dias_mora}</td>
              <td className="right">{money(f.interes_mora)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="cards" style={{ marginTop: 16 }}>
        <div className="kpi"><div className="label">Saldo capital</div><div className="value">{money(data.total_saldo)}</div></div>
        <div className="kpi"><div className="label">Interés de mora</div><div className="value">{money(data.total_interes)}</div></div>
        <div className="kpi"><div className="label">Total a pagar</div><div className="value">{money(data.total_a_pagar)}</div></div>
      </div>
    </>
  );
}
