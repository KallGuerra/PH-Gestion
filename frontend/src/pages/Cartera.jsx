import { useEffect, useState } from "react";
import { api, money } from "../api.js";

export default function Cartera() {
  const [cartera, setCartera] = useState(null);
  const [edades, setEdades] = useState(null);
  const [mora, setMora] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    Promise.all([api("/api/cartera"), api("/api/cartera/edades"), api("/api/cartera/mora")])
      .then(([c, e, m]) => { setCartera(c); setEdades(e); setMora(m); })
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="err">{err}</div>;
  if (!cartera || !edades || !mora) return <p>Cargando...</p>;

  return (
    <>
      <div className="topbar"><h2>Cartera</h2><div className="who">Total: {money(cartera.cartera_total)}</div></div>

      <div className="panel">
        <h3>Cartera por edades</h3>
        <div className="cards">
          <div className="kpi"><div className="label">Corriente</div><div className="value">{money(edades.corriente)}</div></div>
          <div className="kpi"><div className="label">1–30 días</div><div className="value">{money(edades.d1_30)}</div></div>
          <div className="kpi"><div className="label">31–60 días</div><div className="value">{money(edades.d31_60)}</div></div>
          <div className="kpi"><div className="label">61–90 días</div><div className="value">{money(edades.d61_90)}</div></div>
          <div className="kpi"><div className="label">Más de 90</div><div className="value">{money(edades.mas_90)}</div></div>
          <div className="kpi"><div className="label">Total edades</div><div className="value">{money(edades.total)}</div></div>
        </div>
      </div>

      <div className="panel">
        <h3>Inmuebles en mora ({mora.inmuebles_en_mora})</h3>
        <table>
          <thead><tr><th>Inmueble</th><th className="right">Facturas</th><th className="right">Saldo en mora</th></tr></thead>
          <tbody>
            {mora.detalle.map((m) => (
              <tr key={m.inmueble_id}><td>{m.identificacion}</td><td className="right">{m.facturas}</td><td className="right">{money(m.saldo_mora)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h3>Cartera por inmueble</h3>
        <table>
          <thead><tr><th>Inmueble</th><th>Propietario</th><th className="right">Facturas pend.</th><th className="right">Saldo</th></tr></thead>
          <tbody>
            {cartera.inmuebles.map((i) => (
              <tr key={i.inmueble_id}><td>{i.identificacion}</td><td>{i.propietario}</td><td className="right">{i.facturas_pendientes}</td><td className="right">{money(i.saldo_total)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
