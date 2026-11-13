import { useEffect, useState } from "react";
import { api, money } from "../api.js";

// Misma regla que el backend: devuelve un mensaje por campo con la corrección necesaria.
function validarMasiva(conceptoId, periodo) {
  const errores = {};
  const cid = conceptoId.trim();
  if (!cid) {
    errores.concepto_id = "Campo obligatorio. Ingrese el id numérico del concepto (ej. 3).";
  } else if (!/^\d+$/.test(cid) || Number(cid) < 1) {
    errores.concepto_id = `"${cid}" no es válido. Use solo números enteros mayores que 0, sin letras ni símbolos (ej. 3).`;
  }

  const per = periodo.trim();
  if (!per) {
    errores.periodo = "Campo obligatorio. Ingrese año y mes con el formato AAAA-MM (ej. 2026-12).";
  } else if (!/^\d{4}-\d{2}$/.test(per)) {
    errores.periodo = `"${per}" no tiene el formato correcto. Use AAAA-MM, con guion y mes de dos dígitos (ej. 2026-12).`;
  } else {
    const mes = Number(per.slice(5, 7));
    if (mes < 1 || mes > 12) errores.periodo = `El mes "${per.slice(5, 7)}" no existe. Debe estar entre 01 y 12.`;
  }
  return errores;
}

export default function Facturacion() {
  const [facturas, setFacturas] = useState([]);
  const [periodo, setPeriodo] = useState("2026-10");
  const [conceptoId, setConceptoId] = useState("3");
  const [periodoMasiva, setPeriodoMasiva] = useState("2026-12");
  const [resultado, setResultado] = useState(null);
  const [err, setErr] = useState("");
  const [errCampos, setErrCampos] = useState({});
  const [periodosLista, setPeriodosLista] = useState(["2026-07", "2026-08", "2026-09", "2026-10"]);

  const cargar = async (p) => {
    try { setFacturas((await api(`/api/facturacion?periodo=${p}`)).facturas); } catch (e) { setErr(e.message); }
  };
  useEffect(() => { cargar(periodo); }, [periodo]);

  const generarMasiva = async (e) => {
    e.preventDefault();
    setErr(""); setErrCampos({}); setResultado(null);

    const errores = validarMasiva(conceptoId, periodoMasiva);
    if (Object.keys(errores).length) {
      setErrCampos(errores);
      setErr("Corrija los campos marcados para generar la facturación.");
      return;
    }

    try {
      const r = await api("/api/facturacion/masiva", {
        method: "POST",
        body: JSON.stringify({ periodo: periodoMasiva.trim(), concepto_id: Number(conceptoId.trim()) }),
      });
      setResultado(r);
      if (r.facturas_generadas > 0) {
        const p = periodoMasiva.trim();
        setPeriodosLista((lst) => (lst.includes(p) ? lst : [...lst, p].sort()));
        setPeriodo(p); // mostrar las facturas recién generadas
      }
    } catch (e) {
      setErr(e.message);
      setErrCampos(e.errores || {});
    }
  };

  return (
    <>
      <div className="topbar"><h2>Facturación</h2></div>

      <div className="panel">
        <h3>Facturación masiva (cuota extraordinaria por coeficiente)</h3>
        <form className="row" onSubmit={generarMasiva}>
          <div className="field">
            <label htmlFor="concepto-id">Concepto (id)</label>
            <input
              id="concepto-id"
              inputMode="numeric"
              placeholder="ej. 3"
              value={conceptoId}
              aria-invalid={!!errCampos.concepto_id}
              className={errCampos.concepto_id ? "invalid" : undefined}
              onChange={(e) => { setConceptoId(e.target.value); setErrCampos(({ concepto_id, ...r }) => r); }}
            />
            {errCampos.concepto_id && <span className="field-err">{errCampos.concepto_id}</span>}
          </div>
          <div className="field">
            <label htmlFor="periodo-masiva">Periodo (AAAA-MM)</label>
            <input
              id="periodo-masiva"
              placeholder="ej. 2026-12"
              value={periodoMasiva}
              aria-invalid={!!errCampos.periodo}
              className={errCampos.periodo ? "invalid" : undefined}
              onChange={(e) => { setPeriodoMasiva(e.target.value); setErrCampos(({ periodo, ...r }) => r); }}
            />
            {errCampos.periodo && <span className="field-err">{errCampos.periodo}</span>}
          </div>
          <button type="submit" style={{ alignSelf: "flex-start", marginTop: 18 }}>Generar</button>
        </form>
        {err && <div className="err">{err}</div>}
        {resultado && (
          <div className="cards" style={{ marginTop: 14 }}>
            <div className="kpi"><div className="label">Total a repartir</div><div className="value">{money(resultado.total_a_repartir)}</div></div>
            <div className="kpi"><div className="label">Suma facturada</div><div className="value">{money(resultado.suma_facturada)}</div></div>
            <div className="kpi"><div className="label">Facturas generadas</div><div className="value">{resultado.facturas_generadas}</div></div>
          </div>
        )}
      </div>

      <div className="panel">
        <h3>Facturas del periodo</h3>
        <div className="row" style={{ marginBottom: 12 }}>
          <div className="field"><label>Periodo</label>
            <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
              {periodosLista.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Inmueble</th><th>Vence</th><th className="right">Total</th><th className="right">Saldo</th><th>Estado</th></tr></thead>
          <tbody>
            {facturas.map((f) => (
              <tr key={f.id}>
                <td>{f.id}</td><td>{f.identificacion}</td><td>{String(f.fecha_vencimiento).slice(0, 10)}</td>
                <td className="right">{money(f.total)}</td><td className="right">{money(f.saldo)}</td>
                <td><span className={"badge " + f.estado.split(" ")[0]}>{f.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
