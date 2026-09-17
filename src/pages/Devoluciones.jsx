import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaPlus } from "react-icons/fa";
import { listarDevoluciones } from "../api/devoluciones.api";
import { listarMetodosPago } from "../api/metodosPago.api";
import { formatearMoneda } from "../utils/formatoMoneda";
import { formatearFechaHora } from "../utils/formatoFecha";
import BuscarVentaDevolucionModal from "../components/devoluciones/BuscarVentaDevolucionModal";
import DevolucionFormModal from "../components/devoluciones/DevolucionFormModal";

export default function Devoluciones() {
  const [devoluciones, setDevoluciones] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalBuscar, setModalBuscar] = useState(false);
  const [ventaSeleccionadaId, setVentaSeleccionadaId] = useState(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const [lista, metodos] = await Promise.all([listarDevoluciones(), listarMetodosPago()]);
      setDevoluciones(lista);
      setMetodosPago(metodos);
    } catch {
      toast.error("No se pudieron cargar las devoluciones");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  if (cargando) return <div className="estado-caja">Cargando devoluciones...</div>;

  return (
    <div className="pagina">
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titulo">Devoluciones</h1>
          <p className="pagina-subtitulo">Historial de productos devueltos y su reembolso</p>
        </div>
        <button className="btn-primario" onClick={() => setModalBuscar(true)}>
          <FaPlus /> Nueva devolución
        </button>
      </div>

      <div className="tabla-datos-wrapper">
        <table className="tabla-datos">
          <thead>
            <tr><th>Fecha</th><th>Venta</th><th>Productos</th><th>Reembolso</th><th>Usuario</th></tr>
          </thead>
          <tbody>
            {devoluciones.length === 0 && <tr><td colSpan={5}><div className="estado-vacio">Sin devoluciones registradas</div></td></tr>}
            {devoluciones.map((d) => (
              <tr key={d.id}>
                <td>{formatearFechaHora(d.fecha)}</td>
                <td>{d.numero_venta}</td>
                <td>{(d.items || []).map((i) => `${i.cantidad}x ${i.producto_nombre}`).join(", ")}</td>
                <td>
                  {d.tipo_reembolso === "ninguno" ? (
                    <span className="badge-estado badge-estado-anulada">Solo cambio</span>
                  ) : (
                    <span className={`badge-estado ${d.tipo_reembolso === "efectivo" ? "badge-estado-pagada" : "badge-estado-pendiente"}`}>
                      {d.tipo_reembolso === "efectivo" ? "Efectivo" : "Redujo fiado"} · {formatearMoneda(d.monto_reembolsado, d.moneda_reembolso)}
                    </span>
                  )}
                </td>
                <td>{d.usuario_nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalBuscar && (
        <BuscarVentaDevolucionModal
          onSeleccionar={(ventaId) => { setVentaSeleccionadaId(ventaId); setModalBuscar(false); }}
          onCerrar={() => setModalBuscar(false)}
        />
      )}

      {ventaSeleccionadaId && (
        <DevolucionFormModal
          ventaId={ventaSeleccionadaId}
          metodosPago={metodosPago}
          onGuardado={() => { setVentaSeleccionadaId(null); cargar(); }}
          onCerrar={() => setVentaSeleccionadaId(null)}
        />
      )}
    </div>
  );
}