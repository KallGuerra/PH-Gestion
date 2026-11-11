import { useEffect, useState } from "react";
import { api, money } from "../api.js";

export default function Recaudos() {
  const [recaudos, setRecaudos] = useState([]);
  const [inmuebleId, setInmuebleId] = useState("");
  const [valor, setValor] = useState("");
  const [medio, setMedio] = useState("Transferencia");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const cargar = async () => {
    try { setRecaudos((await api("/api/recaudos")).recaudos); } catch (e) { setErr(e.message); }
  };
  useEffect(() => { cargar(); }, []);

  const registrar = async (e) => {
    e.preventDefault();
    setErr(""); setMsg("");
    try {
      const r = await api("/api/recaudos", {
        method: "POST",
        body: JSON.stringify({ inmueble_id: Number(inmuebleId), valor: Number(valor), medio }),
      });
      setMsg(`Recaudo registrado. Aplicado a ${r.aplicaciones.length} factura(s). No aplicado: ${money(r.no_aplicado)}`);
      setValor("");
      cargar();
    } catch (e) { setErr(e.message); }
  };

  const anular = async (id) => {
    setErr(""); setMsg("");
    try { await api(`/api/recaudos/${id}/anular`, { method: "POST" }); setMsg(`Recaudo ${id} anulado.`); cargar(); }
    catch (e) { setErr(e.message); }
  };

  return (
    <>
      <div className="topbar"><h2>Recaudos</h2></div>

      <div className="panel">
        <h3>Registrar recaudo</h3>
        <form className="row" onSubmit={registrar}>
          <div className="field"><label>ID inmueble</label><input value={inmuebleId} onChange={(e) => setInmuebleId(e.target.value)} placeholder="ej. 4" /></div>
          <div className="field"><label>Valor</label><input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="ej. 250000" /></div>
          <div className="field"><label>Medio</label>
            <select value={medio} onChange={(e) => setMedio(e.target.value)}>
              <option>Transferencia</option><option>Consignación</option><option>Efectivo</option><option>PSE</option>
            </select>
          </div>
          <button type="submit">Registrar</button>
        </form>
        {msg && <p style={{ color: "#2e9e5b", fontSize: 13 }}>{msg}</p>}
        {err && <div className="err">{err}</div>}
      </div>

      <div className="panel">
        <h3>Historial de recaudos</h3>
        <table>
          <thead><tr><th>#</th><th>Fecha</th><th>Inmueble</th><th>Medio</th><th className="right">Valor</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {recaudos.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td><td>{String(r.fecha).slice(0, 10)}</td><td>{r.identificacion}</td>
                <td>{r.medio}</td><td className="right">{money(r.valor)}</td>
                <td>{r.anulado ? "Anulado" : "Vigente"}</td>
                <td>{!r.anulado && <button className="danger" onClick={() => anular(r.id)}>Anular</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
