import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaPlus } from "react-icons/fa";
import { listarColaboraciones, obtenerResumenColaboraciones } from "../api/colaboraciones.api";
import { obtenerProductos } from "../api/productos.api";
import { obtenerTasaActual } from "../api/tasas.api";
import { convertirEntreMonedas } from "../utils/monedaHelpers";
import { formatearMoneda } from "../utils/formatoMoneda";
import ColaboracionFormModal from "../components/colaboraciones/ColaboracionFormModal";

const MONEDAS = ["USD", "COP", "BS"];

export default function Colaboraciones() {
  const [colaboraciones, setColaboraciones] = useState([]);
  const [resumen, setResumen] = useState([]);
  const [productos, setProductos] = useState([]);
  const [tasa, setTasa] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [modalNueva, setModalNueva] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const [lista, resumenData, listaProductos, tasaActual] = await Promise.all([
        listarColaboraciones(),
        obtenerResumenColaboraciones(),
        obtenerProductos(),
        obtenerTasaActual(),
      ]);
      setColaboraciones(lista);
      setResumen(resumenData);
      setProductos(listaProductos);
      setTasa(tasaActual);
    } catch {
      toast.error("No se pudieron cargar las colaboraciones");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  if (cargando) return <div className="estado-caja">Cargando colaboraciones...</div>;

  return (
    <div className="pagina">
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titulo">Colaboraciones</h1>
          <p className="pagina-subtitulo">Salidas de inventario que no son ventas (regalos, muestras, canjes)</p>
        </div>
        <button className="btn-primario" onClick={() => setModalNueva(true)}>
          <FaPlus /> Nueva colaboración
        </button>
      </div>

      <div className="stats-grid">
        {MONEDAS.map((m) => {
          const r = resumen.find((x) => x.moneda === m);
          return (
            <div key={m} className={`stat-card stat-card-${m.toLowerCase()}`}>
              <div>
                <span className="stat-valor">{formatearMoneda(r?.costo_total || 0, m)}</span>
                <span className="stat-label">Costo en {m} ({r?.unidades_totales || 0} unid.)</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="tabla-datos-wrapper">
        <table className="tabla-datos">
          <thead>
            <tr><th>Producto</th><th>Cantidad</th><th>Costo registrado</th><th>Equivalente hoy</th><th>Receptor</th><th>Motivo</th><th>Fecha</th></tr>
          </thead>
          <tbody>
            {colaboraciones.length === 0 && <tr><td colSpan={7}><div className="estado-vacio">Sin colaboraciones registradas</div></td></tr>}
            {colaboraciones.map((c) => {
              const costoTotal = c.costo_unitario_original * c.cantidad;
              const otras = MONEDAS.filter((m) => m !== c.moneda_original);
              return (
                <tr key={c.id}>
                  <td>{c.producto_nombre}</td>
                  <td>{c.cantidad}</td>
                  <td>{formatearMoneda(costoTotal, c.moneda_original)}</td>
                  <td>
                    {tasa ? (
                      <div className="chip-selector">
                        {otras.map((m) => (
                          <span key={m} className={`chip-moneda chip-${m.toLowerCase()}`}>
                            {formatearMoneda(convertirEntreMonedas(costoTotal, c.moneda_original, m, tasa), m)}
                          </span>
                        ))}
                      </div>
                    ) : "—"}
                  </td>
                  <td>{c.receptor || "—"}</td>
                  <td>{c.motivo || "—"}</td>
                  <td>{new Date(c.fecha).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalNueva && (
        <ColaboracionFormModal productos={productos} onGuardado={() => { setModalNueva(false); cargar(); }} onCerrar={() => setModalNueva(false)} />
      )}
    </div>
  );
}