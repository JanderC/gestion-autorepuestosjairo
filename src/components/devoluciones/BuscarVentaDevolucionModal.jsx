import { useState, useEffect, useMemo } from "react";
import { FaSearch } from "react-icons/fa";
import { listarVentas } from "../../api/ventas.api";
import { formatearFechaHora } from "../../utils/formatoFecha";

export default function BuscarVentaDevolucionModal({ onSeleccionar, onCerrar }) {
  const [ventas, setVentas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    listarVentas().then(setVentas).catch(() => {}).finally(() => setCargando(false));
  }, []);

  const resultados = useMemo(() => {
    if (!busqueda.trim()) return ventas.slice(0, 10);
    const q = busqueda.toLowerCase();
    return ventas
      .filter((v) => v.numero_venta.toLowerCase().includes(q) || (v.cliente_nombre || "").toLowerCase().includes(q))
      .slice(0, 10);
  }, [ventas, busqueda]);

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-jairo modal-grande" onClick={(e) => e.stopPropagation()}>
        <h3>Buscar venta a devolver</h3>
        <div className="buscador mt-1">
          <FaSearch />
          <input placeholder="Buscar por folio o cliente..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} autoFocus />
        </div>

        {cargando ? (
          <div className="estado-caja">Cargando ventas...</div>
        ) : (
          <div className="lista-seleccionable mt-1">
            {resultados.length === 0 && <div className="estado-vacio">Sin resultados</div>}
            {resultados.map((v) => (
              <button key={v.id} className="item-seleccionable" onClick={() => onSeleccionar(v.id)}>
                <div className="item-seleccionable-info">
                  <div className="item-seleccionable-nombre">
                    {v.numero_venta}{v.cliente_nombre ? ` — ${v.cliente_nombre}` : ""}
                  </div>
                  <div className="item-seleccionable-meta">{formatearFechaHora(v.fecha)} · {v.vendedor}</div>
                </div>
                {v.estado === "fiado" && <span className="badge-estado badge-estado-pendiente">FIADO</span>}
              </button>
            ))}
          </div>
        )}

        <div className="modal-acciones">
          <button className="btn-secundario" onClick={onCerrar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}