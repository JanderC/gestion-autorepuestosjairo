import { useState, useEffect, useMemo } from "react";
import { FaSearch } from "react-icons/fa";
import { listarVentas } from "../../api/ventas.api";
import { buscarVentasPorProducto } from "../../api/devoluciones.api";
import { formatearFechaHora } from "../../utils/formatoFecha";

export default function BuscarVentaDevolucionModal({ onSeleccionar, onCerrar }) {
  const [ventasRecientes, setVentasRecientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [resultadosProducto, setResultadosProducto] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    listarVentas()
      .then((v) => setVentasRecientes(v.slice(0, 15)))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (busqueda.trim().length < 2) {
      setResultadosProducto([]);
      return;
    }
    setBuscando(true);
    const timeoutId = setTimeout(() => {
      buscarVentasPorProducto(busqueda.trim())
        .then(setResultadosProducto)
        .catch(() => setResultadosProducto([]))
        .finally(() => setBuscando(false));
    }, 350);
    return () => clearTimeout(timeoutId);
  }, [busqueda]);

  const resultadosFolio = useMemo(() => {
    if (!busqueda.trim()) return ventasRecientes;
    const q = busqueda.toLowerCase();
    return ventasRecientes.filter(
      (v) => v.numero_venta.toLowerCase().includes(q) || (v.cliente_nombre || "").toLowerCase().includes(q)
    );
  }, [ventasRecientes, busqueda]);

  // Une coincidencias por producto (del backend) con coincidencias por folio/cliente (locales),
  // sin repetir la misma venta dos veces.
  const resultados = useMemo(() => {
    const mapa = new Map();
    resultadosProducto.forEach((r) => mapa.set(r.id, { ...r, coincidencia: r.producto_nombre }));
    resultadosFolio.forEach((v) => {
      if (!mapa.has(v.id)) mapa.set(v.id, { ...v, coincidencia: null });
    });
    return Array.from(mapa.values())
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 15);
  }, [resultadosProducto, resultadosFolio]);

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-jairo modal-grande" onClick={(e) => e.stopPropagation()}>
        <h3>Buscar venta a devolver</h3>
        <p className="modal-subtitulo">Buscá por el nombre del producto vendido, el folio, o el cliente</p>

        <div className="buscador mt-1">
          <FaSearch />
          <input
            placeholder="Ej: estopera, VTA-123, o nombre del cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            autoFocus
          />
        </div>

        {cargando || buscando ? (
          <div className="estado-caja">Buscando...</div>
        ) : (
          <div className="lista-seleccionable mt-1">
            {resultados.length === 0 && <div className="estado-vacio">Sin resultados</div>}
            {resultados.map((v) => (
              <button key={v.id} className="item-seleccionable" onClick={() => onSeleccionar(v.id)}>
                <div className="item-seleccionable-info">
                  <div className="item-seleccionable-nombre">
                    {v.numero_venta}{v.cliente_nombre ? ` — ${v.cliente_nombre}` : ""}
                  </div>
                  <div className="item-seleccionable-meta">
                    {formatearFechaHora(v.fecha)} · {v.vendedor}
                    {v.coincidencia && ` · Coincide con: ${v.coincidencia}`}
                  </div>
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