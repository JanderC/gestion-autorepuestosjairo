import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { FaPlus, FaLock } from "react-icons/fa";
import {
  listarPendientesConsignacion,
  registrarMovimientoConsignacion,
  listarHistorialConsignacion,
} from "../../api/consignaciones.api";
import { obtenerProductos } from "../../api/productos.api";
import { listarMetodosPago } from "../../api/metodosPago.api";
import { formatearMoneda } from "../../utils/formatoMoneda";
import { formatearFechaHora } from "../../utils/formatoFecha";
import CerrarConsignacionModal from "./CerrarConsignacionModal";

const MONEDAS = ["USD", "COP", "BS"];

export default function CuentaCorrienteModal({ cliente, onCerrar }) {
  const [tab, setTab] = useState("pendientes");
  const [pendientes, setPendientes] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [productos, setProductos] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [formMov, setFormMov] = useState({ producto_id: "", cantidad: "", tipo: "salida", moneda: "USD" });
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [guardandoMov, setGuardandoMov] = useState(false);
  const [modalCerrar, setModalCerrar] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const [p, h, prods, metodos] = await Promise.all([
        listarPendientesConsignacion(cliente.id),
        listarHistorialConsignacion(cliente.id),
        obtenerProductos(),
        listarMetodosPago(),
      ]);
      setPendientes(p);
      setHistorial(h);
      setProductos(prods);
      setMetodosPago(metodos);
    } catch {
      toast.error("No se pudo cargar la cuenta corriente");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente.id]);

  const productosFiltrados = useMemo(() => {
    if (!busquedaProducto.trim()) return [];
    const q = busquedaProducto.toLowerCase();
    return productos.filter((p) => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)).slice(0, 6);
  }, [busquedaProducto, productos]);

  const productoElegido = productos.find((p) => p.id === formMov.producto_id);

  const registrarMovimiento = async (e) => {
    e.preventDefault();
    if (!formMov.producto_id || !formMov.cantidad) {
      toast.error("Elegí un producto y una cantidad");
      return;
    }
    setGuardandoMov(true);
    try {
      await registrarMovimientoConsignacion({
        cliente_id: cliente.id,
        producto_id: formMov.producto_id,
        cantidad: Number(formMov.cantidad),
        tipo: formMov.tipo,
        moneda: formMov.moneda,
      });
      toast.success(formMov.tipo === "salida" ? "Salida registrada" : "Devolución registrada");
      setFormMov({ producto_id: "", cantidad: "", tipo: formMov.tipo, moneda: formMov.moneda });
      setBusquedaProducto("");
      cargar();
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo registrar el movimiento");
    } finally {
      setGuardandoMov(false);
    }
  };

  const totalesPorMoneda = useMemo(() => {
    const acc = {};
    pendientes.forEach((m) => {
      const signo = m.tipo === "salida" ? 1 : -1;
      const monto = Number(m.precio_unitario_original) * m.cantidad * signo;
      acc[m.moneda_original] = (acc[m.moneda_original] || 0) + monto;
    });
    return acc;
  }, [pendientes]);

  if (cargando) {
    return (
      <div className="modal-overlay" onClick={onCerrar}>
        <div className="modal-jairo modal-pequeño" onClick={(e) => e.stopPropagation()}>
          <div className="estado-caja">Cargando cuenta corriente...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-jairo modal-grande" onClick={(e) => e.stopPropagation()}>
        <h3>Cuenta corriente — {cliente.nombre}</h3>
        <p className="modal-subtitulo">Salidas y devoluciones que no cuentan como venta ni afectan la caja del día</p>

        <div className="tabs mt-1">
          <button className={`tab-btn ${tab === "pendientes" ? "activo" : ""}`} onClick={() => setTab("pendientes")}>Semana actual</button>
          <button className={`tab-btn ${tab === "historial" ? "activo" : ""}`} onClick={() => setTab("historial")}>Historial de cierres</button>
        </div>

        {tab === "pendientes" && (
          <>
            <div className="panel mt-1">
              <div className="panel-header"><span className="panel-titulo">Registrar movimiento</span></div>
              <form onSubmit={registrarMovimiento} className="formulario">
                <div className="formulario-campo">
                  <label>Producto</label>
                  {productoElegido ? (
                    <div className="item-seleccionable" style={{ cursor: "default" }}>
                      <div className="item-seleccionable-info">
                        <div className="item-seleccionable-nombre">{productoElegido.nombre}</div>
                        <div className="item-seleccionable-meta">{productoElegido.codigo} · Stock: {productoElegido.stock}</div>
                      </div>
                      <button type="button" className="btn-secundario" onClick={() => setFormMov((f) => ({ ...f, producto_id: "" }))}>Cambiar</button>
                    </div>
                  ) : (
                    <input placeholder="Buscar por nombre o código..." value={busquedaProducto} onChange={(e) => setBusquedaProducto(e.target.value)} />
                  )}
                  {busquedaProducto.trim() && !formMov.producto_id && (
                    <div className="lista-seleccionable mt-1">
                      {productosFiltrados.length === 0 && <div className="estado-vacio">Sin resultados</div>}
                      {productosFiltrados.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="item-seleccionable"
                          onClick={() => { setFormMov((f) => ({ ...f, producto_id: p.id })); setBusquedaProducto(""); }}
                        >
                          <div className="item-seleccionable-info">
                            <div className="item-seleccionable-nombre">{p.nombre}</div>
                            <div className="item-seleccionable-meta">{p.codigo} · Stock: {p.stock}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="formulario-fila">
                  <div className="formulario-campo">
                    <label>Cantidad</label>
                    <input type="number" min="1" value={formMov.cantidad} onChange={(e) => setFormMov((f) => ({ ...f, cantidad: e.target.value }))} />
                  </div>
                  <div className="formulario-campo">
                    <label>Moneda</label>
                    <select value={formMov.moneda} onChange={(e) => setFormMov((f) => ({ ...f, moneda: e.target.value }))}>
                      {MONEDAS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div className="selector-pill">
                  <button type="button" className={formMov.tipo === "salida" ? "activo" : ""} onClick={() => setFormMov((f) => ({ ...f, tipo: "salida" }))}>Salida</button>
                  <button type="button" className={formMov.tipo === "devolucion" ? "activo" : ""} onClick={() => setFormMov((f) => ({ ...f, tipo: "devolucion" }))}>Devolución</button>
                </div>

                <div className="modal-acciones">
                  <button type="submit" className="btn-primario" disabled={guardandoMov}>
                    <FaPlus /> {guardandoMov ? "Guardando..." : "Registrar"}
                  </button>
                </div>
              </form>
            </div>

            <div className="panel mt-1">
              <div className="panel-header">
                <span className="panel-titulo">Pendientes de cierre</span>
                {pendientes.length > 0 && (
                  <button className="btn-primario" onClick={() => setModalCerrar(true)}><FaLock /> Cerrar semana</button>
                )}
              </div>
              {Object.keys(totalesPorMoneda).length > 0 && (
                <div className="chip-selector mb-1">
                  {Object.entries(totalesPorMoneda).map(([m, v]) => (
                    <span key={m} className={`chip-moneda chip-${m.toLowerCase()}`}>{formatearMoneda(v, m)}</span>
                  ))}
                </div>
              )}
              <div className="tabla-datos-wrapper">
                <table className="tabla-datos">
                  <thead><tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Monto</th></tr></thead>
                  <tbody>
                    {pendientes.length === 0 && <tr><td colSpan={5}><div className="estado-vacio">Sin movimientos pendientes</div></td></tr>}
                    {pendientes.map((m) => (
                      <tr key={m.id}>
                        <td>{formatearFechaHora(m.fecha)}</td>
                        <td>{m.producto_nombre}</td>
                        <td className={m.tipo === "devolucion" ? "texto-exito" : ""}>{m.tipo === "salida" ? "Salida" : "Devolución"}</td>
                        <td>{m.cantidad}</td>
                        <td>{formatearMoneda(m.precio_unitario_original * m.cantidad, m.moneda_original)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === "historial" && (
          <div className="tabla-datos-wrapper mt-1">
            <table className="tabla-datos">
              <thead><tr><th>Cierre</th><th>Subtotal</th><th>Dto.</th><th>Total</th><th>Pagado</th><th>Saldo</th></tr></thead>
              <tbody>
                {historial.length === 0 && <tr><td colSpan={6}><div className="estado-vacio">Sin cierres registrados</div></td></tr>}
                {historial.map((h) => {
                  const saldo = Number(h.total_original) - Number(h.monto_pagado);
                  return (
                    <tr key={h.id}>
                      <td>{formatearFechaHora(h.fecha_cierre)}</td>
                      <td>{formatearMoneda(h.subtotal_original, h.moneda_original)}</td>
                      <td>{Number(h.descuento_porcentaje)}%</td>
                      <td>{formatearMoneda(h.total_original, h.moneda_original)}</td>
                      <td>{formatearMoneda(h.monto_pagado, h.moneda_original)}</td>
                      <td className={saldo > 0.01 ? "texto-peligro" : "texto-exito"}>{formatearMoneda(saldo, h.moneda_original)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="modal-acciones">
          <button className="btn-secundario" onClick={onCerrar}>Cerrar</button>
        </div>

        {modalCerrar && (
          <CerrarConsignacionModal
            cliente={cliente}
            pendientes={pendientes}
            metodosPago={metodosPago}
            onGuardado={() => { setModalCerrar(false); cargar(); }}
            onCerrar={() => setModalCerrar(false)}
          />
        )}
      </div>
    </div>
  );
}