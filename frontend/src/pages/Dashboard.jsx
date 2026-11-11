import { useEffect, useState } from "react";
import { api, money } from "../api.js";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [periodo, setPeriodo] = useState("2026-10");
  const [err, setErr] = useState("");

  const cargar = async (p) => {
    setErr("");
    try {
      setData(await api(`/api/dashboard?periodo=${p}`));
    } catch (e) {
      setErr(e.message);
    }
  };
  useEffect(() => { cargar(periodo); }, [periodo]);

  if (err) return <div className="err">{err}</div>;
  if (!data) return <p>Cargando...</p>;

  // Total de ingresos facturados del periodo (suma de los conceptos).
  const totalIngresos = data.ingresos_por_concepto.reduce((acc, c) => acc + c.valor, 0);

  return (
    <>
      <div className="topbar">
        <h2>Dashboard</h2>
        <div className="row">
          <div className="field">
            <label>Periodo</label>
            <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
              {["2026-06","2026-07","2026-08","2026-09","2026-10","2026-11"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="cards">
        <div className="kpi"><div className="label">Inmuebles</div><div className="value">{data.total_inmuebles}</div></div>
        <div className="kpi"><div className="label">Propietarios</div><div className="value">{data.total_propietarios}</div></div>
        <div className="kpi"><div className="label">Residentes</div><div className="value">{data.total_residentes}</div></div>
        <div className="kpi"><div className="label">Cartera total</div><div className="value">{money(data.cartera_total)}</div></div>
        <div className="kpi"><div className="label">Facturación periodo</div><div className="value">{money(data.facturacion_periodo)}</div></div>
        <div className="kpi"><div className="label">Recaudo periodo</div><div className="value">{money(data.recaudo_periodo)}</div></div>
        <div className="kpi">
          <div className="label">% recuperación cartera</div>
          <div className="value">{data.porcentaje_recuperacion == null ? "—" : data.porcentaje_recuperacion + "%"}</div>
        </div>
        <div className="kpi">
          <div className="label">Total ingresos del periodo</div>
          <div className="value">{"$ " + totalIngresos}</div>
        </div>
      </div>

      <div className="panel">
        <h3>Ingresos facturados por concepto — {data.periodo}</h3>
        <table>
          <thead><tr><th>Concepto</th><th className="right">Valor</th></tr></thead>
          <tbody>
            {data.ingresos_por_concepto.map((c, i) => (
              <tr key={i}><td>{c.concepto}</td><td className="right">{money(c.valor)}</td></tr>
            ))}
            {data.ingresos_por_concepto.length === 0 && (
              <tr><td colSpan={2} style={{ color: "#6b7f90" }}>Sin facturación en este periodo.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
