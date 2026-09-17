import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { FaFileInvoiceDollar, FaPlus, FaMoneyCheckAlt, FaBan } from "react-icons/fa";
import { listarFacturas, obtenerResumenFacturas, anularFactura as anularFacturaApi } from "../api/facturasProveedor.api";
import { listarMetodosPago } from "../api/metodosPago.api";
import { formatearMoneda } from "../utils/formatoMoneda";
import FacturaFormModal from "../components/facturas/FacturaFormModal";
import PagoFacturaModal from "../components/facturas/PagoFacturaModal";

const TABS = [
  { key: "todas", label: "Todas" },
  { key: "pendiente", label: "Pendientes" },
  { key: "vencida", label: "Vencidas" },
  { key: "pagada", label: "Pagadas" },
  { key: "anulada", label: "Anuladas" },
];

export default function Facturas() {
  const [facturas, setFacturas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [metodosPago, setMetodosPago] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [tabActiva, setTabActiva] = useState("todas");

  const [modalNuevaFactura, setModalNuevaFactura] = useState(false);
  const [facturaPagando, setFacturaPagando] = useState(null);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [listaFacturas, resumenData, listaMetodos] = await Promise.all([
        listarFacturas(),
        obtenerResumenFacturas(),
        listarMetodosPago(),
      ]);
      setFacturas(listaFacturas);
      setResumen(resumenData);
      setMetodosPago(listaMetodos);
    } catch (err) {
      toast.error("No se pudieron cargar las facturas");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const facturasFiltradas = useMemo(() => {
    if (tabActiva === "todas") return facturas;
    return facturas.filter((f) => f.estado_efectivo === tabActiva);
  }, [facturas, tabActiva]);

  const confirmarAnular = async (factura) => {
    if (!window.confirm(`¿Anular la factura de "${factura.proveedor_nombre}"?`)) return;
    try {
      await anularFacturaApi(factura.id);
      toast.success("Factura anulada");
      cargarDatos();
    } catch (err) {
      toast.error("No se pudo anular la factura");
    }
  };

  const claseBadge = (estado) => `badge-estado badge-estado-${estado}`;

  if (cargando) return <div className="estado-caja">Cargando facturas...</div>;

  return (
    <div className="pagina">
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titulo">Facturas por Pagar</h1>
          <p className="pagina-subtitulo">Control de cuentas por pagar a proveedores</p>
        </div>
        <button className="btn-primario" onClick={() => setModalNuevaFactura(true)}>
          <FaPlus /> Nueva factura
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-card-destacada">
          <FaFileInvoiceDollar className="stat-icono" />
          <div>
            <span className="stat-valor">{resumen?.facturas_vencidas ?? 0}</span>
            <span className="stat-label">Facturas vencidas</span>
          </div>
        </div>
        {["USD", "COP", "BS"].map((moneda) => {
          const item = resumen?.pendientes_por_moneda.find((p) => p.moneda === moneda);
          return (
            <div key={moneda} className={`stat-card stat-card-${moneda.toLowerCase()}`}>
              <div>
                <span className="stat-valor">{formatearMoneda(item?.total_pendiente || 0, moneda)}</span>
                <span className="stat-label">Pendiente en {moneda}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`tab-btn ${tabActiva === t.key ? "activo" : ""}`} onClick={() => setTabActiva(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="tabla-datos-wrapper">
        <table className="tabla-datos">
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>N° Factura</th>
              <th>Monto</th>
              <th>Saldo pendiente</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {facturasFiltradas.length === 0 && (
              <tr><td colSpan={7}><div className="estado-vacio">No hay facturas para mostrar</div></td></tr>
            )}
            {facturasFiltradas.map((f) => (
              <tr key={f.id}>
                <td>{f.proveedor_nombre}</td>
                <td>{f.numero_factura || "—"}</td>
                <td>{formatearMoneda(f.monto_original, f.moneda_original)}</td>
                <td>{formatearMoneda(f.saldo_pendiente_original, f.moneda_original)}</td>
                <td>{f.fecha_vencimiento ? new Date(f.fecha_vencimiento).toLocaleDateString() : "—"}</td>
                <td><span className={claseBadge(f.estado_efectivo)}>{f.estado_efectivo}</span></td>
                <td className="celda-acciones">
                  {f.estado_efectivo !== "pagada" && f.estado_efectivo !== "anulada" && (
                    <>
                      <button title="Registrar pago" onClick={() => setFacturaPagando(f)}>
                        <FaMoneyCheckAlt />
                      </button>
                      <button title="Anular" className="btn-peligro" onClick={() => confirmarAnular(f)}>
                        <FaBan />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalNuevaFactura && (
        <FacturaFormModal onGuardado={() => { setModalNuevaFactura(false); cargarDatos(); }} onCerrar={() => setModalNuevaFactura(false)} />
      )}

      {facturaPagando && (
        <PagoFacturaModal factura={facturaPagando} metodosPago={metodosPago} onGuardado={() => { setFacturaPagando(null); cargarDatos(); }} onCerrar={() => setFacturaPagando(null)} />
      )}
    </div>
  );
}