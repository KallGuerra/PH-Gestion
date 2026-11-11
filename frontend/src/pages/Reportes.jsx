import { useEffect, useState } from "react";
import { api, money } from "../api.js";

export default function Reportes() {
  const [fact, setFact] = useState([]);
  const [rec, setRec] = useState([]);
  const [balance, setBalance] = useState([]);
  const [valores, setValores] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    Promise.all([
      api("/api/reportes/totales-facturacion"),
      api("/api/reportes/totales-recaudo"),
      api("/api/reportes/balance-concepto"),
      api("/api/reportes/valores-mensuales"),
    ]).then(([f, r, b, v]) => {
      setFact(f.totales); setRec(r.totales); setBalance(b.balance); setValores(v.valores);
    }).catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="err">{err}</div>;

  return (
    <>
      <div className="topbar"><h2>Reportes</h2></div>

      <div className="panel">
        <h3>Totales de facturación por periodo</h3>
        <table>
          <thead><tr><th>Periodo</th><th className="right">Facturado</th><th className="right">Cartera</th></tr></thead>
          <tbody>{fact.map((t) => (
            <tr key={t.periodo}><td>{t.periodo}</td><td className="right">{money(t.facturado)}</td><td className="right">{money(t.cartera)}</td></tr>
          ))}</tbody>
        </table>
      </div>

      <div className="panel">
        <h3>Valores mensuales (facturado vs recaudado)</h3>
        <table>
          <thead><tr><th>Periodo</th><th className="right">Facturado</th><th className="right">Recaudado</th></tr></thead>
          <tbody>{valores.map((v) => (
            <tr key={v.periodo}><td>{v.periodo}</td><td className="right">{money(v.facturado)}</td><td className="right">{money(v.recaudado)}</td></tr>
          ))}</tbody>
        </table>
      </div>

      <div className="panel">
        <h3>Balance por concepto</h3>
        <table>
          <thead><tr><th>Concepto</th><th className="right">Total</th></tr></thead>
          <tbody>{balance.map((b, i) => (
            <tr key={i}><td>{b.concepto}</td><td className="right">{money(b.total)}</td></tr>
          ))}</tbody>
        </table>
      </div>

      <div className="panel">
        <h3>Totales de recaudo por periodo</h3>
        <table>
          <thead><tr><th>Periodo</th><th className="right">Recaudado</th></tr></thead>
          <tbody>{rec.map((t) => (
            <tr key={t.periodo}><td>{t.periodo}</td><td className="right">{money(t.recaudado)}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
}
