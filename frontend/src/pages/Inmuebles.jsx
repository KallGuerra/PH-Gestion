import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function Inmuebles() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [err, setErr] = useState("");

  const cargar = async () => {
    setErr("");
    try {
      setData(await api(`/api/inmuebles?page=${page}&limit=${limit}`));
    } catch (e) { setErr(e.message); }
  };
  useEffect(() => { cargar(); }, [page]);

  if (err) return <div className="err">{err}</div>;
  if (!data) return <p>Cargando...</p>;
  const totalPaginas = Math.max(1, Math.ceil(data.total / limit));

  return (
    <>
      <div className="topbar"><h2>Inmuebles</h2><div className="who">{data.total} inmuebles</div></div>
      <table>
        <thead>
          <tr><th>#</th><th>Identificación</th><th>Torre</th><th>Piso</th><th>Tipo</th><th>Coef.</th><th>Propietario</th><th>Residente</th><th></th></tr>
        </thead>
        <tbody>
          {data.inmuebles.map((i) => (
            <tr key={i.id}>
              <td>{i.id}</td><td>{i.identificacion}</td><td>{i.torre}</td><td>{i.piso}</td>
              <td>{i.tipo}</td><td>{i.coeficiente}</td><td>{i.propietario}</td><td>{i.residente || "—"}</td>
              <td><Link to={`/inmuebles/${i.id}/estado-cuenta`}>Estado de cuenta</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pager">
        <button className="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</button>
        <span>Página {page} de {totalPaginas}</span>
        <button className="secondary" disabled={page >= totalPaginas} onClick={() => setPage(page + 1)}>Siguiente</button>
      </div>
    </>
  );
}
