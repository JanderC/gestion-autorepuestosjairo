import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaSearch, FaShoppingCart, FaUserPlus, FaPlus, FaMinus, FaCashRegister, FaLock, FaUndo } from "react-icons/fa";
import { obtenerProductos } from "../api/productos.api";
import { obtenerTasaActual } from "../api/tasas.api";
import { listarMetodosPago } from "../api/metodosPago.api";
import { buscarClientes, obtenerEstadoCuenta } from "../api/clientes.api";
import { crearVenta, obtenerVentaPorId } from "../api/ventas.api";
import { obtenerSesionAbierta, obtenerMovimientosDelDia } from "../api/caja.api";
import { precioListaEnMoneda, convertirAUSD, convertirDesdeUSD } from "../utils/monedaHelpers";
import { formatearMoneda } from "../utils/formatoMoneda";
import { formatearFechaHora } from "../utils/formatoFecha";
import ItemCarrito from "../components/ventas/ItemCarrito";
import LineaPago from "../components/ventas/LineaPago";
import DetalleVentaModal from "../components/ventas/DetalleVentaModal";
import VentaRegistradaModal from "../components/ventas/VentaRegistradaModal";
import MovimientoCajaModal from "../components/caja/MovimientoCajaModal";
import CerrarCajaModal from "../components/caja/CerrarCajaModal";
import BuscarVentaDevolucionModal from "../components/devoluciones/BuscarVentaDevolucionModal";
import DevolucionFormModal from "../components/devoluciones/DevolucionFormModal";
import Paginacion from "../components/comunes/Paginacion";

const MONEDAS = ["USD", "COP", "BS"];
const VENTAS_POR_PAGINA = 5;
let contadorPagoId = 0;

function redondear2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export default function PuntoDeVenta() {
  const navigate = useNavigate();

  const [productos, setProductos] = useState([]);
  const [tasa, setTasa] = useState(null);
  const [metodosPago, setMetodosPago] = useState([]);
  const [sesionCaja, setSesionCaja] = useState(null);
  const [movimientosSesion, setMovimientosSesion] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [monedaVenta, setMonedaVenta] = useState("USD");
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState([]);
  const [pagos, setPagos] = useState([]);

  const [modoFiado, setModoFiado] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [resultadosCliente, setResultadosCliente] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [estadoCuentaCliente, setEstadoCuentaCliente] = useState(null);
  const [creditoAplicado, setCreditoAplicado] = useState("");

  const [busquedaVentas, setBusquedaVentas] = useState("");
  const [paginaVentas, setPaginaVentas] = useState(1);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [modalMovimiento, setModalMovimiento] = useState(null);
  const [modalCerrarCaja, setModalCerrarCaja] = useState(false);

  const [modalBuscarDevolucion, setModalBuscarDevolucion] = useState(false);
  const [ventaDevolucionId, setVentaDevolucionId] = useState(null);

  const [procesando, setProcesando] = useState(false);
  const [ventaRegistrada, setVentaRegistrada] = useState(null);

  const metodosPagoDirectos = useMemo(() => metodosPago.filter((m) => !m.es_credito), [metodosPago]);
  const metodoEfectivo = useMemo(
    () => metodosPagoDirectos.find((m) => /efectivo/i.test(m.nombre)) || metodosPagoDirectos[0],
    [metodosPagoDirectos]
  );

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [listaProductos, tasaActual, listaMetodos, sesion] = await Promise.all([
        obtenerProductos(),
        obtenerTasaActual(),
        listarMetodosPago(),
        obtenerSesionAbierta(),
      ]);
      setProductos(listaProductos);
      setTasa(tasaActual);
      setMetodosPago(listaMetodos);
      setSesionCaja(sesion);

      if (sesion) {
        setMovimientosSesion(await obtenerMovimientosDelDia(sesion.id));
      } else {
        setMovimientosSesion([]);
      }
    } catch (err) {
      toast.error("No se pudo cargar el punto de venta");
    } finally {
      setCargando(false);
    }
  };

  const recargarMovimientosSesion = async () => {
    if (!sesionCaja) return;
    try {
      setMovimientosSesion(await obtenerMovimientosDelDia(sesionCaja.id));
    } catch {
      // silencioso
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (metodoEfectivo && pagos.length === 0) {
      setPagos([{ id: contadorPagoId++, metodo_pago_id: metodoEfectivo.id, moneda: monedaVenta, monto: "", autoCalculado: true }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metodoEfectivo]);

  const productosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return [];
    const q = busqueda.toLowerCase();
    return productos
      .filter((p) => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q))
      .slice(0, 8);
  }, [busqueda, productos]);

  const agregarAlCarrito = (producto) => {
    if (!tasa) return;
    if (producto.stock <= 0) {
      toast.error("Sin stock disponible");
      return;
    }
    const precioLista = precioListaEnMoneda(producto, monedaVenta, tasa);

    setCarrito((prev) => {
      const existente = prev.find((i) => i.producto_id === producto.id);
      if (existente) {
        return prev.map((i) => (i.producto_id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i));
      }
      return [
        ...prev,
        { producto_id: producto.id, nombre: producto.nombre, codigo: producto.codigo, cantidad: 1, precioLista, precioManual: null },
      ];
    });
    setBusqueda("");
  };

  useEffect(() => {
    if (!tasa) return;
    setCarrito((prev) =>
      prev.map((item) => {
        const producto = productos.find((p) => p.id === item.producto_id);
        if (!producto) return item;
        return { ...item, precioLista: precioListaEnMoneda(producto, monedaVenta, tasa), precioManual: null };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monedaVenta]);

  const cambiarCantidad = (producto_id, cantidad) => {
    if (cantidad <= 0) return quitarDelCarrito(producto_id);
    setCarrito((prev) => prev.map((i) => (i.producto_id === producto_id ? { ...i, cantidad } : i)));
  };

  const cambiarPrecio = (producto_id, valor) => {
    setCarrito((prev) => prev.map((i) => (i.producto_id === producto_id ? { ...i, precioManual: valor === "" ? null : valor } : i)));
  };

  const quitarDelCarrito = (producto_id) => setCarrito((prev) => prev.filter((i) => i.producto_id !== producto_id));

  const totalListaUSD = tasa
    ? carrito.reduce((acc, i) => acc + convertirAUSD(i.precioLista, monedaVenta, tasa) * i.cantidad, 0)
    : 0;
  const totalFinalUSD = tasa
    ? carrito.reduce((acc, i) => {
        const precio = i.precioManual != null ? Number(i.precioManual) : i.precioLista;
        return acc + convertirAUSD(precio, monedaVenta, tasa) * i.cantidad;
      }, 0)
    : 0;
  const ajusteUSD = totalListaUSD - totalFinalUSD;

  const totalListaMonedaVenta = tasa ? convertirDesdeUSD(totalListaUSD, monedaVenta, tasa) : 0;
  const totalFinalMonedaVenta = tasa ? convertirDesdeUSD(totalFinalUSD, monedaVenta, tasa) : 0;
  const ajusteMonedaVenta = tasa ? convertirDesdeUSD(ajusteUSD, monedaVenta, tasa) : 0;

  // Saldo a favor disponible del cliente seleccionado, en la moneda en la que se está vendiendo
  const creditoDisponibleEnMonedaVenta = useMemo(() => {
    const fila = estadoCuentaCliente?.saldos_pendientes.find((s) => s.moneda === monedaVenta);
    const saldo = fila ? Number(fila.saldo_pendiente) : 0;
    return saldo < 0 ? Math.abs(saldo) : 0;
  }, [estadoCuentaCliente, monedaVenta]);

  const creditoAplicadoUSD = tasa && creditoAplicado ? convertirAUSD(Number(creditoAplicado), monedaVenta, tasa) : 0;

  const totalPagadoUSD = tasa
    ? pagos.reduce((acc, p) => acc + (p.monto ? convertirAUSD(Number(p.monto), p.moneda, tasa) : 0), 0) + creditoAplicadoUSD
    : 0;

  // No se redondea en USD antes de convertir: redondear centavos de dólar y después multiplicar
  // por la tasa (ej. x4000 en COP) amplifica el error hasta decenas en la moneda final.
  const restanteUSD = totalFinalUSD - totalPagadoUSD;
  const hayFaltante = restanteUSD > 0.01;
  const hayVuelto = restanteUSD < -0.01;
  const restanteMonedaVenta = tasa ? redondear2(convertirDesdeUSD(Math.abs(restanteUSD), monedaVenta, tasa)) : 0;

  // Mientras haya una sola línea de pago sin tocar, se autocompleta al total MENOS el
  // saldo a favor que se esté aplicando — así el efectivo solo cubre lo que realmente falta.
  useEffect(() => {
    if (modoFiado) return;
    setPagos((prev) => {
      if (prev.length !== 1 || !prev[0].autoCalculado) return prev;
      const objetivo = Math.max(0, totalFinalMonedaVenta - (Number(creditoAplicado) || 0));
      const nuevoMonto = objetivo > 0 ? objetivo.toFixed(2) : "";
      if (prev[0].monto === nuevoMonto && prev[0].moneda === monedaVenta) return prev;
      return [{ ...prev[0], moneda: monedaVenta, monto: nuevoMonto }];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalFinalMonedaVenta, monedaVenta, modoFiado, creditoAplicado]);

  const activarPagoCompleto = () => {
    setModoFiado(false);
    setPagos([
      {
        id: contadorPagoId++,
        metodo_pago_id: metodoEfectivo?.id || "",
        moneda: monedaVenta,
        monto: totalFinalMonedaVenta > 0 ? totalFinalMonedaVenta.toFixed(2) : "",
        autoCalculado: true,
      },
    ]);
  };

  const activarFiado = () => {
    setModoFiado(true);
    setPagos([{ id: contadorPagoId++, metodo_pago_id: metodoEfectivo?.id || "", moneda: monedaVenta, monto: "", autoCalculado: false }]);
  };

  const agregarLineaPago = () => {
    const pagosCongelados = pagos.map((p) => ({ ...p, autoCalculado: false }));
    const totalPagadoUSDActual = tasa
      ? pagosCongelados.reduce((acc, p) => acc + (p.monto ? convertirAUSD(Number(p.monto), p.moneda, tasa) : 0), 0) + creditoAplicadoUSD
      : 0;
    const restanteUSDActual = Math.max(0, totalFinalUSD - totalPagadoUSDActual);
    const montoSugerido = tasa ? redondear2(convertirDesdeUSD(restanteUSDActual, monedaVenta, tasa)) : 0;

    setPagos([
      ...pagosCongelados,
      {
        id: contadorPagoId++,
        metodo_pago_id: metodoEfectivo?.id || "",
        moneda: monedaVenta,
        monto: montoSugerido > 0 ? montoSugerido.toFixed(2) : "",
        autoCalculado: false,
      },
    ]);
  };

  const actualizarPago = (id, pagoActualizado) => {
    setPagos((prev) => prev.map((p) => (p.id === id ? { ...pagoActualizado, autoCalculado: false } : p)));
  };

  const quitarPago = (id) => setPagos((prev) => prev.filter((p) => p.id !== id));

  const buscarCliente = async (q) => {
    setBusquedaCliente(q);
    if (q.trim().length < 2) {
      setResultadosCliente([]);
      return;
    }
    try {
      setResultadosCliente(await buscarClientes(q));
    } catch {
      setResultadosCliente([]);
    }
  };

  const seleccionarCliente = async (c) => {
    setClienteSeleccionado(c);
    setResultadosCliente([]);
    setBusquedaCliente("");
    try {
      setEstadoCuentaCliente(await obtenerEstadoCuenta(c.id));
    } catch {
      setEstadoCuentaCliente(null);
    }
  };

  const quitarCliente = () => {
    setClienteSeleccionado(null);
    setEstadoCuentaCliente(null);
    setCreditoAplicado("");
  };

  const confirmarVenta = async () => {
    if (carrito.length === 0) {
      toast.error("Agregá al menos un producto");
      return;
    }
    if (modoFiado && !clienteSeleccionado) {
      toast.error("Seleccioná un cliente para fiar la venta");
      return;
    }
    if (modoFiado && Number(pagos[0]?.monto) > 0 && !pagos[0]?.metodo_pago_id) {
      toast.error("Seleccioná el método de pago del abono");
      return;
    }
    if (!modoFiado && hayFaltante) {
      toast.error("Falta completar el pago — si el cliente no va a pagar todo, activá \"Fiar venta\"");
      return;
    }

    const payload = {
      productos: carrito.map((i) => ({
        producto_id: i.producto_id,
        cantidad: i.cantidad,
        precio_unitario_manual: i.precioManual != null ? Number(i.precioManual) : undefined,
      })),
      pagos: pagos
        .filter((p) => p.metodo_pago_id && p.monto && Number(p.monto) > 0)
        .map((p) => ({ metodo_pago_id: Number(p.metodo_pago_id), moneda: p.moneda, monto: Number(p.monto) })),
      cliente_id: clienteSeleccionado?.id || null,
      moneda_venta: monedaVenta,
      aplicar_credito: creditoAplicado ? Number(creditoAplicado) : undefined,
    };

    setProcesando(true);
    try {
      const resultado = await crearVenta(payload);
      setVentaRegistrada(resultado);
      setCarrito([]);
      quitarCliente();
      setModoFiado(false);
      setPagos(
        metodoEfectivo
          ? [{ id: contadorPagoId++, metodo_pago_id: metodoEfectivo.id, moneda: monedaVenta, monto: "", autoCalculado: true }]
          : []
      );
      cargarDatos();
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo registrar la venta");
    } finally {
      setProcesando(false);
    }
  };

  const verDetalleVenta = async (ventaId) => {
    try {
      setVentaSeleccionada(await obtenerVentaPorId(ventaId));
    } catch {
      toast.error("No se pudo cargar el detalle de la venta");
    }
  };

  const feedItems = useMemo(() => {
    if (!sesionCaja) return [];
    return movimientosSesion;
  }, [sesionCaja, movimientosSesion]);

  const totalesPorMoneda = useMemo(() => {
    const acc = { cantidad: 0, usd: 0, cop: 0, bs: 0 };
    feedItems.forEach((f) => {
      if (f.tipo === "venta") {
        acc.cantidad += 1;
        acc.usd += f.usd;
        acc.cop += f.cop;
        acc.bs += f.bs;
      } else if (f.tipo === "ingreso" || f.tipo === "abono") {
        acc[f.moneda.toLowerCase()] += f.monto;
      } else if (f.tipo === "egreso") {
        acc[f.moneda.toLowerCase()] -= f.monto;
      }
    });
    return acc;
  }, [feedItems]);

  const feedFiltrado = useMemo(() => {
    if (!busquedaVentas.trim()) return feedItems;
    const q = busquedaVentas.toLowerCase();
    return feedItems.filter((f) => f.detalle.toLowerCase().includes(q));
  }, [feedItems, busquedaVentas]);

  const totalPaginasVentas = Math.max(1, Math.ceil(feedFiltrado.length / VENTAS_POR_PAGINA));
  const feedPagina = feedFiltrado.slice((paginaVentas - 1) * VENTAS_POR_PAGINA, paginaVentas * VENTAS_POR_PAGINA);

  if (cargando) return <div className="estado-caja">Cargando punto de venta...</div>;

  const abono = pagos[0];

  return (
    <div className="pagina">
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titulo">Punto de Venta</h1>
          {!sesionCaja && (
            <p className="pagina-subtitulo" style={{ color: "var(--jairo-advertencia)" }}>
              No hay una caja abierta — la venta se registrará sin asociarse a ningún turno.
            </p>
          )}
        </div>
        <div className="selector-pill">
          {MONEDAS.map((m) => (
            <button key={m} className={monedaVenta === m ? "activo" : ""} onClick={() => setMonedaVenta(m)}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="split-layout">
        <div>
          <div className="panel">
            <div className="panel-header"><span className="panel-titulo">Productos</span></div>
            <div className="buscador">
              <FaSearch />
              <input placeholder="Buscar por nombre o código..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
            {busqueda.trim() && (
              <div className="lista-seleccionable mt-2">
                {productosFiltrados.length === 0 && <div className="estado-vacio">Sin resultados</div>}
                {productosFiltrados.map((p) => (
                  <button key={p.id} className="item-seleccionable" onClick={() => agregarAlCarrito(p)} disabled={p.stock <= 0}>
                    {p.imagen_url ? (
                      <img src={p.imagen_url} alt={p.nombre} className="item-seleccionable-imagen" />
                    ) : (
                      <div className="item-seleccionable-imagen" />
                    )}
                    <div className="item-seleccionable-info">
                      <div className="item-seleccionable-nombre">{p.nombre}</div>
                      <div className="item-seleccionable-meta">{p.codigo} · Stock: {p.stock}</div>
                    </div>
                    <span className="item-seleccionable-precio">{tasa && formatearMoneda(precioListaEnMoneda(p, monedaVenta, tasa), monedaVenta)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="panel mt-2">
            <div className="panel-header"><span className="panel-titulo"><FaShoppingCart /> Carrito</span></div>
            {carrito.length === 0 ? (
              <div className="carrito-vacio">Agregá productos para iniciar la venta</div>
            ) : (
              <div className="carrito">
                {carrito.map((item) => (
                  <ItemCarrito key={item.producto_id} item={item} onCambiarCantidad={cambiarCantidad} onCambiarPrecio={cambiarPrecio} onQuitar={quitarDelCarrito} />
                ))}
              </div>
            )}
            {carrito.length > 0 && (
              <div className="carrito-resumen">
                <div className="carrito-resumen-linea">
                  <span>Precio de lista</span>
                  <span>{formatearMoneda(totalListaMonedaVenta, monedaVenta)}</span>
                </div>
                {Math.abs(ajusteMonedaVenta) > 0.01 && (
                  <div className={`carrito-resumen-linea ${ajusteMonedaVenta > 0 ? "ajuste-descuento" : "ajuste-recargo"}`}>
                    <span>{ajusteMonedaVenta > 0 ? "Descuento aplicado" : "Recargo aplicado"}</span>
                    <span>{formatearMoneda(Math.abs(ajusteMonedaVenta), monedaVenta)}</span>
                  </div>
                )}
                <div className="carrito-resumen-total">
                  <span>Total</span>
                  <span>{formatearMoneda(totalFinalMonedaVenta, monedaVenta)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="panel mt-2">
            <div className="panel-header">
              <span className="panel-titulo">Movimientos del turno</span>
              {sesionCaja ? (
                <div className="pagina-acciones">
                  <button className="btn-secundario" onClick={() => setModalMovimiento("egreso")}><FaMinus /> Egreso</button>
                  <button className="btn-secundario" onClick={() => setModalMovimiento("ingreso")}><FaPlus /> Ingreso</button>
                  <button className="btn-secundario" onClick={() => setModalBuscarDevolucion(true)}><FaUndo /> Devolución</button>
                  <button className="btn-primario" onClick={() => setModalCerrarCaja(true)}><FaLock /> Cerrar caja</button>
                </div>
              ) : (
                <div className="pagina-acciones">
                  <button className="btn-secundario" onClick={() => setModalBuscarDevolucion(true)}><FaUndo /> Devolución</button>
                  <button className="btn-secundario" onClick={() => navigate("/caja")}><FaCashRegister /> Abrir caja</button>
                </div>
              )}
            </div>

            {sesionCaja && (
              <div className="stats-grid mb-1">
                <div className="stat-card stat-card-destacada">
                  <div><span className="stat-valor">{totalesPorMoneda.cantidad}</span><span className="stat-label">Ventas</span></div>
                </div>
                <div className="stat-card stat-card-usd">
                  <div><span className="stat-valor">{formatearMoneda(totalesPorMoneda.usd, "USD")}</span><span className="stat-label">Total USD</span></div>
                </div>
                <div className="stat-card stat-card-cop">
                  <div><span className="stat-valor">{formatearMoneda(totalesPorMoneda.cop, "COP")}</span><span className="stat-label">Total COP</span></div>
                </div>
                <div className="stat-card stat-card-bs">
                  <div><span className="stat-valor">{formatearMoneda(totalesPorMoneda.bs, "BS")}</span><span className="stat-label">Total BS</span></div>
                </div>
              </div>
            )}

            {feedItems.length > 5 && (
              <div className="buscador mb-1">
                <FaSearch />
                <input
                  placeholder="Buscar por folio, vendedor o concepto..."
                  value={busquedaVentas}
                  onChange={(e) => { setBusquedaVentas(e.target.value); setPaginaVentas(1); }}
                />
              </div>
            )}

            {feedItems.length === 0 && (
              <div className="estado-vacio">
                {sesionCaja
                  ? "Todavía no hay movimientos en este turno"
                  : "No hay un turno abierto — abrí la caja para empezar a registrar"}
              </div>
            )}
            {feedItems.length > 0 && feedPagina.length === 0 && <div className="estado-vacio">Sin resultados para esa búsqueda</div>}

            {feedPagina.length > 0 && (
              <>
                <div className="tabla-datos-wrapper">
                  <table className="tabla-datos">
                    <thead>
                      <tr><th>Fecha</th><th>Detalle</th><th>USD</th><th>COP</th><th>BS</th></tr>
                    </thead>
                    <tbody>
                      {feedPagina.map((f, i) => {
                        if (f.tipo === "venta") {
                          return (
                            <tr key={`venta-${f.id}`} onClick={() => verDetalleVenta(f.id)} style={{ cursor: "pointer" }}>
                              <td>{formatearFechaHora(f.fecha)}</td>
                              <td>
                                {f.detalle}
                                {f.estado === "fiado" && <span className="badge-estado badge-estado-pendiente" style={{ marginLeft: "0.4rem" }}>FIADO</span>}
                              </td>
                              <td>{f.usd > 0 ? f.usd.toFixed(2) : "—"}</td>
                              <td>{f.cop > 0 ? f.cop.toFixed(2) : "—"}</td>
                              <td>{f.bs > 0 ? f.bs.toFixed(2) : "—"}</td>
                            </tr>
                          );
                        }

                        const claseColor = f.tipo === "egreso" ? "texto-peligro" : f.tipo === "fiado" ? "" : "texto-exito";
                        const signo = f.tipo === "egreso" ? "-" : "+";
                        const etiquetas = { ingreso: "INGRESO", egreso: "EGRESO", abono: "ABONO", fiado: "FIADO" };

                        return (
                          <tr key={`mov-${i}`}>
                            <td>{formatearFechaHora(f.fecha)}</td>
                            <td>
                              <span className="badge-estado badge-estado-pendiente" style={{ marginRight: "0.4rem" }}>{etiquetas[f.tipo]}</span>
                              {f.detalle}
                            </td>
                            <td className={f.moneda === "USD" ? claseColor : ""}>{f.moneda === "USD" ? `${signo}${f.monto.toFixed(2)}` : "—"}</td>
                            <td className={f.moneda === "COP" ? claseColor : ""}>{f.moneda === "COP" ? `${signo}${f.monto.toFixed(2)}` : "—"}</td>
                            <td className={f.moneda === "BS" ? claseColor : ""}>{f.moneda === "BS" ? `${signo}${f.monto.toFixed(2)}` : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Paginacion paginaActual={paginaVentas} totalPaginas={totalPaginasVentas} onCambiar={setPaginaVentas} />
              </>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><span className="panel-titulo">Pago</span></div>

          {tasa && (
            <p className="pagina-subtitulo mb-1">
              Tasa vigente: 1 USD = {Number(tasa.usd_bs).toFixed(2)} BS · {Number(tasa.usd_cop).toFixed(2)} COP
            </p>
          )}

          <div className="selector-pill mb-2">
            <button className={!modoFiado ? "activo" : ""} onClick={activarPagoCompleto}>Pago completo</button>
            <button className={modoFiado ? "activo" : ""} onClick={activarFiado}>Fiar venta</button>
          </div>

          {!modoFiado && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {pagos.map((p) => (
                  <LineaPago key={p.id} pago={p} metodosPago={metodosPagoDirectos} onCambiar={(actualizado) => actualizarPago(p.id, actualizado)} onQuitar={quitarPago} />
                ))}
              </div>
              <button className="btn-secundario mt-1" onClick={agregarLineaPago}>
                <FaPlus /> Agregar otra forma de pago
              </button>
            </>
          )}

          {/* Cliente: siempre visible — sirve para aplicar saldo a favor en cualquier venta,
              y es obligatorio cuando se está fiando. */}
          <div className="formulario mt-2">
            <div className="panel-header" style={{ marginBottom: "0.5rem" }}>
              <span className="panel-titulo">
                <FaUserPlus /> Cliente {!modoFiado && "(opcional — para usar saldo a favor)"}
              </span>
            </div>

            {clienteSeleccionado ? (
              <>
                <div className="item-seleccionable" style={{ cursor: "default" }}>
                  <div className="item-seleccionable-info">
                    <div className="item-seleccionable-nombre">{clienteSeleccionado.nombre}</div>
                    <div className="item-seleccionable-meta">{clienteSeleccionado.telefono || "Sin teléfono"}</div>
                  </div>
                  <button className="btn-secundario" onClick={quitarCliente}>Quitar</button>
                </div>

                {creditoDisponibleEnMonedaVenta > 0 && (
                  <div className="mt-1">
                    <p className="carrito-resumen-linea ajuste-descuento">
                      <span>Saldo a favor disponible ({monedaVenta})</span>
                      <span>{formatearMoneda(creditoDisponibleEnMonedaVenta, monedaVenta)}</span>
                    </p>
                    <div className="formulario-fila">
                      <input
                        type="number"
                        step="0.01"
                        className="input-jairo"
                        placeholder="Aplicar del saldo a favor"
                        value={creditoAplicado}
                        onChange={(e) => {
                          const tope = Math.min(creditoDisponibleEnMonedaVenta, totalFinalMonedaVenta);
                          setCreditoAplicado(Math.max(0, Math.min(Number(e.target.value) || 0, tope)).toString());
                        }}
                      />
                      <button
                        type="button"
                        className="btn-secundario"
                        onClick={() => setCreditoAplicado(Math.min(creditoDisponibleEnMonedaVenta, totalFinalMonedaVenta).toString())}
                      >
                        Usar todo
                      </button>
                    </div>
                  </div>
                )}

                {modoFiado && (
                  <>
                    <label className="mt-2">Abona ahora (opcional — dejalo vacío si fía todo)</label>
                    <div className="formulario-fila">
                      <div className="formulario-campo" style={{ flex: "0 0 90px" }}>
                        <select value={abono?.moneda || monedaVenta} onChange={(e) => actualizarPago(abono.id, { ...abono, moneda: e.target.value })}>
                          {MONEDAS.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div className="formulario-campo">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Monto del abono"
                          value={abono?.monto || ""}
                          onChange={(e) => actualizarPago(abono.id, { ...abono, monto: e.target.value })}
                        />
                      </div>
                    </div>

                    {Number(abono?.monto) > 0 && (
                      <div className="formulario-campo">
                        <label>Método del abono</label>
                        <select value={abono?.metodo_pago_id || ""} onChange={(e) => actualizarPago(abono.id, { ...abono, metodo_pago_id: e.target.value })}>
                          <option value="">Seleccionar...</option>
                          {metodosPagoDirectos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                        </select>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <div className="buscador">
                  <FaSearch />
                  <input placeholder="Buscar cliente por nombre o teléfono..." value={busquedaCliente} onChange={(e) => buscarCliente(e.target.value)} />
                </div>
                {resultadosCliente.length > 0 && (
                  <div className="lista-seleccionable mt-1">
                    {resultadosCliente.map((c) => (
                      <button key={c.id} className="item-seleccionable" onClick={() => seleccionarCliente(c)}>
                        <div className="item-seleccionable-info">
                          <div className="item-seleccionable-nombre">{c.nombre}</div>
                          <div className="item-seleccionable-meta">{c.telefono || "Sin teléfono"}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="carrito-resumen mt-2">
            <div className="carrito-resumen-total">
              <span>Cuenta a pagar</span>
              <span>{formatearMoneda(totalFinalMonedaVenta, monedaVenta)}</span>
            </div>

            {creditoAplicado && Number(creditoAplicado) > 0 && (
              <div className="carrito-resumen-linea ajuste-descuento">
                <span>Saldo a favor aplicado</span>
                <span>{formatearMoneda(Number(creditoAplicado), monedaVenta)}</span>
              </div>
            )}

            {!modoFiado && hayFaltante && (
              <div className="carrito-resumen-linea ajuste-recargo">
                <span>Falta pagar</span>
                <span>{formatearMoneda(restanteMonedaVenta, monedaVenta)}</span>
              </div>
            )}
            {modoFiado && hayFaltante && (
              <div className="carrito-resumen-linea ajuste-recargo">
                <span>Se fía{clienteSeleccionado ? ` a ${clienteSeleccionado.nombre}` : ""}</span>
                <span>{formatearMoneda(restanteMonedaVenta, monedaVenta)}</span>
              </div>
            )}
            {hayVuelto && (
              <div className="carrito-resumen-linea">
                <span>Vuelto (informativo)</span>
                <span>{formatearMoneda(restanteMonedaVenta, monedaVenta)}</span>
              </div>
            )}
          </div>

          <button
            className="btn-primario ancho-completo mt-3"
            onClick={confirmarVenta}
            disabled={procesando || carrito.length === 0 || (modoFiado && !clienteSeleccionado)}
          >
            {procesando ? "Procesando..." : modoFiado ? "Registrar venta y fiar" : "Registrar venta"}
          </button>
        </div>
      </div>

      {ventaSeleccionada && (
        <DetalleVentaModal
          venta={ventaSeleccionada}
          onCerrar={() => setVentaSeleccionada(null)}
          onDevolver={() => {
            setVentaDevolucionId(ventaSeleccionada.venta.id);
            setVentaSeleccionada(null);
          }}
        />
      )}
      {ventaRegistrada && <VentaRegistradaModal resultado={ventaRegistrada} onCerrar={() => setVentaRegistrada(null)} />}

      {modalMovimiento && sesionCaja && (
        <MovimientoCajaModal
          sesionCajaId={sesionCaja.id}
          tipo={modalMovimiento}
          onGuardado={() => { setModalMovimiento(null); recargarMovimientosSesion(); }}
          onCerrar={() => setModalMovimiento(null)}
        />
      )}

      {modalCerrarCaja && sesionCaja && (
        <CerrarCajaModal
          sesion={sesionCaja}
          onGuardado={() => { setModalCerrarCaja(false); cargarDatos(); }}
          onCerrar={() => setModalCerrarCaja(false)}
        />
      )}

      {modalBuscarDevolucion && (
        <BuscarVentaDevolucionModal
          onSeleccionar={(ventaId) => { setVentaDevolucionId(ventaId); setModalBuscarDevolucion(false); }}
          onCerrar={() => setModalBuscarDevolucion(false)}
        />
      )}

      {ventaDevolucionId && (
        <DevolucionFormModal
          ventaId={ventaDevolucionId}
          metodosPago={metodosPagoDirectos}
          onGuardado={() => { setVentaDevolucionId(null); cargarDatos(); }}
          onCerrar={() => setVentaDevolucionId(null)}
        />
      )}
    </div>
  );
}