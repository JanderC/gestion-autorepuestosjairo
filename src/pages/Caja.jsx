import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaCashRegister, FaPlus, FaMinus, FaLock, FaArrowLeft, FaEye } from "react-icons/fa";
import {
  obtenerSesionAbierta,
  obtenerResumenSesion,
  obtenerMovimientosDelDia,
  listarHistorialCaja,
} from "../api/caja.api";
import { formatearMoneda } from "../utils/formatoMoneda";
import { formatearFechaCompleta, formatearFechaHora } from "../utils/formatoFecha";
import { useAuth } from "../context/AuthContext";
import AbrirCajaModal from "../components/caja/AbrirCajaModal";
import MovimientoCajaModal from "../components/caja/MovimientoCajaModal";
import CerrarCajaModal from "../components/caja/CerrarCajaModal";

const MONEDAS = ["USD", "COP", "BS"];

function FilaMovimiento({ ev }) {
  const claseColor = ev.tipo === "egreso" ? "texto-peligro" : ev.tipo === "fiado" ? "" : "texto-exito";
  const signo = ev.tipo === "egreso" ? "-" : "+";
  const etiquetas = { ingreso: "INGRESO", egreso: "EGRESO", abono: "ABONO", fiado: "FIADO" };

  if (ev.tipo === "venta") {
    return (
      <tr>
        <td>{formatearFechaHora(ev.fecha)}</td>
        <td>{ev.detalle}</td>
        <td>{ev.usd > 0 ? ev.usd.toFixed(2) : "—"}</td>
        <td>{ev.cop > 0 ? ev.cop.toFixed(2) : "—"}</td>
        <td>{ev.bs > 0 ? ev.bs.toFixed(2) : "—"}</td>
      </tr>
    );
  }

  return (
    <tr>
      <td>{formatearFechaHora(ev.fecha)}</td>
      <td>
        <span className="badge-estado badge-estado-pendiente" style={{ marginRight: "0.4rem" }}>{etiquetas[ev.tipo]}</span>
        {ev.detalle}
      </td>
      <td className={ev.moneda === "USD" ? claseColor : ""}>{ev.moneda === "USD" ? `${signo}${ev.monto.toFixed(2)}` : "—"}</td>
      <td className={ev.moneda === "COP" ? claseColor : ""}>{ev.moneda === "COP" ? `${signo}${ev.monto.toFixed(2)}` : "—"}</td>
      <td className={ev.moneda === "BS" ? claseColor : ""}>{ev.moneda === "BS" ? `${signo}${ev.monto.toFixed(2)}` : "—"}</td>
    </tr>
  );
}

export default function Caja() {
  const { rol } = useAuth();
  const [sesion, setSesion] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [tabActiva, setTabActiva] = useState("resumen");
  const [cargando, setCargando] = useState(true);

  // Sesión cerrada que se está inspeccionando desde el historial
  const [sesionHistorial, setSesionHistorial] = useState(null);
  const [resumenHistorial, setResumenHistorial] = useState(null);
  const [movimientosHistorial, setMovimientosHistorial] = useState([]);

  const [modalAbrir, setModalAbrir] = useState(false);
  const [modalMovimiento, setModalMovimiento] = useState(null);
  const [modalCerrar, setModalCerrar] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const sesionActual = await obtenerSesionAbierta();
      setSesion(sesionActual);

      if (sesionActual) {
        const [r, m] = await Promise.all([
          obtenerResumenSesion(sesionActual.id),
          obtenerMovimientosDelDia(sesionActual.id),
        ]);
        setResumen(r);
        setMovimientos(m);
      } else {
        setResumen(null);
        setMovimientos([]);
        setTabActiva("historial");
      }

      if (rol === "admin") setHistorial(await listarHistorialCaja());
    } catch {
      toast.error("No se pudo cargar la caja");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verSesionHistorial = async (s) => {
    try {
      const [r, m] = await Promise.all([obtenerResumenSesion(s.id), obtenerMovimientosDelDia(s.id)]);
      setSesionHistorial(s);
      setResumenHistorial(r);
      setMovimientosHistorial(m);
    } catch {
      toast.error("No se pudo cargar esa sesión");
    }
  };

  if (cargando) return <div className="estado-caja">Cargando caja...</div>;

  // --- Vista de detalle de una sesión cerrada ---
  if (sesionHistorial) {
    const s = sesionHistorial;
    return (
      <div className="pagina">
        <div className="pagina-header">
          <div>
            <button className="btn-volver" onClick={() => setSesionHistorial(null)}>
              <FaArrowLeft /> Volver al historial
            </button>
            <h1 className="pagina-titulo mt-1">Cierre del {formatearFechaCompleta(s.fecha_cierre)}</h1>
            <p className="pagina-subtitulo">
              Abierta {formatearFechaCompleta(s.fecha_apertura)} por {s.usuario_nombre}
            </p>
          </div>
        </div>

        <div className="stats-grid">
          {MONEDAS.map((m) => {
            const esperado = Number(s[`esperado_final_${m.toLowerCase()}`]) || 0;
            const contado = Number(s[`conteo_final_${m.toLowerCase()}`]) || 0;
            const dif = Number(s[`diferencia_${m.toLowerCase()}`]) || 0;
            if (esperado === 0 && contado === 0) return null;

            return (
              <div key={m} className={`stat-card stat-card-${m.toLowerCase()}`}>
                <div>
                  <span className="stat-valor">{formatearMoneda(contado, m)}</span>
                  <span className="stat-label">Contado · Esperado {formatearMoneda(esperado, m)}</span>
                  <span className={`stat-label ${Math.abs(dif) < 0.01 ? "texto-exito" : "texto-peligro"}`}>
                    {Math.abs(dif) < 0.01 ? "Cuadró ✓" : dif < 0 ? `Faltaron ${formatearMoneda(Math.abs(dif), m)}` : `Sobraron ${formatearMoneda(dif, m)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {s.notas_cierre && (
          <div className="panel">
            <span className="panel-titulo">Notas de cierre</span>
            <p className="pagina-subtitulo mt-1">{s.notas_cierre}</p>
          </div>
        )}

        <div className="panel">
          <div className="panel-header"><span className="panel-titulo">Desglose del turno</span></div>
          {resumenHistorial?.desglose.filter((d) => d.ventas_totales > 0 || d.fondo_inicial > 0).map((d) => (
            <div key={d.moneda} className="mb-1">
              <div className="saldo-linea"><strong>{d.moneda}</strong><span /></div>
              <div className="saldo-linea"><span>Fondo inicial</span><span>{formatearMoneda(d.fondo_inicial, d.moneda)}</span></div>
              <div className="saldo-linea"><span>Ventas en efectivo</span><span>{formatearMoneda(d.ventas_efectivo, d.moneda)}</span></div>
              <div className="saldo-linea"><span>Ventas otros métodos</span><span>{formatearMoneda(d.ventas_otros_metodos, d.moneda)}</span></div>
              <div className="saldo-linea"><span>Ingresos / Egresos</span><span>{formatearMoneda(d.ingresos, d.moneda)} / {formatearMoneda(d.egresos, d.moneda)}</span></div>
              <div className="saldo-linea"><span>Fiado otorgado</span><span>{formatearMoneda(d.fiado_otorgado, d.moneda)}</span></div>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-header"><span className="panel-titulo">Ventas y movimientos del turno</span></div>
          <div className="tabla-datos-wrapper">
            <table className="tabla-datos">
              <thead><tr><th>Fecha</th><th>Detalle</th><th>USD</th><th>COP</th><th>BS</th></tr></thead>
              <tbody>
                {movimientosHistorial.length === 0 && (
                  <tr><td colSpan={5}><div className="estado-vacio">Sin movimientos en este turno</div></td></tr>
                )}
                {movimientosHistorial.map((ev, i) => <FilaMovimiento key={i} ev={ev} />)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // --- Vista principal ---
  return (
    <div className="pagina">
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titulo">Caja</h1>
          <p className="pagina-subtitulo">
            {sesion ? `Turno abierto por ${sesion.usuario_nombre} · ${formatearFechaCompleta(sesion.fecha_apertura)}` : "No hay un turno abierto"}
          </p>
        </div>
        <div className="pagina-acciones">
          {!sesion ? (
            <button className="btn-primario" onClick={() => setModalAbrir(true)}><FaCashRegister /> Abrir caja</button>
          ) : (
            <>
              <button className="btn-secundario" onClick={() => setModalMovimiento("ingreso")}><FaPlus /> Ingreso</button>
              <button className="btn-secundario" onClick={() => setModalMovimiento("egreso")}><FaMinus /> Egreso</button>
              <button className="btn-primario" onClick={() => setModalCerrar(true)}><FaLock /> Cerrar caja</button>
            </>
          )}
        </div>
      </div>

      <div className="tabs">
        {sesion && (
          <>
            <button className={`tab-btn ${tabActiva === "resumen" ? "activo" : ""}`} onClick={() => setTabActiva("resumen")}>Resumen del turno</button>
            <button className={`tab-btn ${tabActiva === "movimientos" ? "activo" : ""}`} onClick={() => setTabActiva("movimientos")}>Movimientos</button>
          </>
        )}
        {rol === "admin" && (
          <button className={`tab-btn ${tabActiva === "historial" ? "activo" : ""}`} onClick={() => setTabActiva("historial")}>Historial de cierres</button>
        )}
      </div>

      {sesion && tabActiva === "resumen" && resumen && (
        <>
          <div className="stats-grid">
            {resumen.desglose.map((d) => (
              <div key={d.moneda} className={`stat-card stat-card-${d.moneda.toLowerCase()}`}>
                <div>
                  <span className="stat-valor">{formatearMoneda(d.esperado_efectivo, d.moneda)}</span>
                  <span className="stat-label">Esperado en efectivo · {d.moneda}</span>
                </div>
              </div>
            ))}
          </div>

          {resumen.desglose.filter((d) => d.ventas_totales > 0 || d.fondo_inicial > 0).map((d) => (
            <div key={d.moneda} className="panel">
              <div className="panel-header"><span className="panel-titulo">{d.moneda}</span></div>
              <div className="saldo-linea"><span>Fondo inicial</span><span>{formatearMoneda(d.fondo_inicial, d.moneda)}</span></div>
              <div className="saldo-linea"><span>+ Ventas en efectivo</span><span>{formatearMoneda(d.ventas_efectivo, d.moneda)}</span></div>
              <div className="saldo-linea"><span>+ Ingresos</span><span>{formatearMoneda(d.ingresos, d.moneda)}</span></div>
              <div className="saldo-linea"><span>+ Abonos en efectivo</span><span>{formatearMoneda(d.abonos_efectivo, d.moneda)}</span></div>
              <div className="saldo-linea texto-peligro"><span>− Egresos</span><span>{formatearMoneda(d.egresos, d.moneda)}</span></div>
              <div className="carrito-resumen-total"><span>Esperado</span><span>{formatearMoneda(d.esperado_efectivo, d.moneda)}</span></div>
              <p className="pagina-subtitulo mt-1">
                Fuera del cajón: {formatearMoneda(d.ventas_otros_metodos, d.moneda)} otros métodos · {formatearMoneda(d.fiado_otorgado, d.moneda)} fiados
              </p>
            </div>
          ))}

          <div className="panel">
            <div className="panel-header"><span className="panel-titulo">Cobrado por método de pago</span></div>
            {resumen.pagos_por_metodo.length === 0 && <div className="estado-vacio">Sin cobros en este turno</div>}
            {resumen.pagos_por_metodo.map((p, i) => (
              <div key={i} className="saldo-linea">
                <span>{p.metodo} ({p.moneda})</span>
                <span>{formatearMoneda(p.total, p.moneda)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {sesion && tabActiva === "movimientos" && (
        <div className="tabla-datos-wrapper">
          <table className="tabla-datos">
            <thead><tr><th>Fecha</th><th>Detalle</th><th>USD</th><th>COP</th><th>BS</th></tr></thead>
            <tbody>
              {movimientos.length === 0 && <tr><td colSpan={5}><div className="estado-vacio">Sin movimientos todavía</div></td></tr>}
              {movimientos.map((ev, i) => <FilaMovimiento key={i} ev={ev} />)}
            </tbody>
          </table>
        </div>
      )}

      {rol === "admin" && tabActiva === "historial" && (
        <div className="tabla-datos-wrapper">
          <table className="tabla-datos">
            <thead>
              <tr><th>Cierre</th><th>Usuario</th><th>Ventas</th><th>USD</th><th>COP</th><th>BS</th><th></th></tr>
            </thead>
            <tbody>
              {historial.length === 0 && <tr><td colSpan={7}><div className="estado-vacio">Todavía no hay cierres registrados</div></td></tr>}
              {historial.map((h) => (
                <tr key={h.id} onClick={() => verSesionHistorial(h)} style={{ cursor: "pointer" }}>
                  <td>{formatearFechaCompleta(h.fecha_cierre)}</td>
                  <td>{h.usuario_nombre}</td>
                  <td>{h.cantidad_ventas}</td>
                  {MONEDAS.map((m) => {
                    const dif = Number(h[`diferencia_${m.toLowerCase()}`]) || 0;
                    const contado = Number(h[`conteo_final_${m.toLowerCase()}`]) || 0;
                    return (
                      <td key={m} className={Math.abs(dif) < 0.01 ? "" : "texto-peligro"}>
                        {contado.toFixed(2)}
                        {Math.abs(dif) >= 0.01 && ` (${dif > 0 ? "+" : ""}${dif.toFixed(2)})`}
                      </td>
                    );
                  })}
                  <td className="celda-acciones"><button title="Ver detalle"><FaEye /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAbrir && <AbrirCajaModal onGuardado={() => { setModalAbrir(false); cargar(); }} onCerrar={() => setModalAbrir(false)} />}
      {modalMovimiento && (
        <MovimientoCajaModal
          sesionCajaId={sesion.id}
          tipo={modalMovimiento}
          onGuardado={() => { setModalMovimiento(null); cargar(); }}
          onCerrar={() => setModalMovimiento(null)}
        />
      )}
      {modalCerrar && (
        <CerrarCajaModal sesion={sesion} onGuardado={() => { setModalCerrar(false); cargar(); }} onCerrar={() => setModalCerrar(false)} />
      )}
    </div>
  );
}