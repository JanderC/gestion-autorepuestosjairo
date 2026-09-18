import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { FaSearch, FaTimes } from "react-icons/fa";
import { obtenerVentaDevolvible, crearDevolucion } from "../../api/devoluciones.api";
import { obtenerProductos } from "../../api/productos.api";
import { obtenerTasaActual } from "../../api/tasas.api";
import { buscarClientes } from "../../api/clientes.api";
import { precioListaEnMoneda, convertirEntreMonedas } from "../../utils/monedaHelpers";
import { formatearMoneda } from "../../utils/formatoMoneda";

const MONEDAS = ["USD", "COP", "BS"];

function redondear2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export default function DevolucionFormModal({ ventaId, metodosPago, onGuardado, onCerrar }) {
  const [datos, setDatos] = useState(null);
  const [productos, setProductos] = useState([]);
  const [tasa, setTasa] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cantidades, setCantidades] = useState({});

  const [esCambio, setEsCambio] = useState(false);
  const [busquedaProductoCambio, setBusquedaProductoCambio] = useState("");
  const [itemsCambio, setItemsCambio] = useState([]); // [{ producto, cantidad }]

  const [tipoReembolso, setTipoReembolso] = useState("ninguno");
  const [monedaReembolso, setMonedaReembolso] = useState("USD");
  const [montoManual, setMontoManual] = useState("");
  const [montoTocado, setMontoTocado] = useState(false);
  const [metodoPagoId, setMetodoPagoId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [resultadosCliente, setResultadosCliente] = useState([]);
  const [clienteElegido, setClienteElegido] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [data, listaProductos, tasaActual] = await Promise.all([
          obtenerVentaDevolvible(ventaId),
          obtenerProductos(),
          obtenerTasaActual(),
        ]);
        setDatos(data);
        setProductos(listaProductos);
        setTasa(tasaActual);
        if (data.venta.vuelto_moneda) setMonedaReembolso(data.venta.vuelto_moneda);
      } catch (error) {
        toast.error(error.response?.data?.message || "No se pudo cargar la venta");
        onCerrar();
      } finally {
        setCargando(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ventaId]);

  const items = datos?.items || [];
  const hayFiado = !!datos?.fiado && Number(datos.fiado.saldo_pendiente_original) > 0;
  const ventaTieneCliente = !!datos?.venta.cliente_id;

  const cambiarCantidad = (productoId, disponible, valor) => {
    const cantidad = Math.max(0, Math.min(disponible, Number(valor) || 0));
    setCantidades((prev) => ({ ...prev, [productoId]: cantidad }));
  };

  const itemsSeleccionados = useMemo(
    () => items.filter((i) => (cantidades[i.producto_id] || 0) > 0),
    [items, cantidades]
  );

  const montoEstimado = useMemo(
    () => itemsSeleccionados.reduce((acc, i) => acc + Number(i.precio_unitario_original) * cantidades[i.producto_id], 0),
    [itemsSeleccionados, cantidades]
  );

  const monedaOriginal = items[0]?.moneda_original;

  // --- Producto de cambio ---
  const productosFiltradosCambio = useMemo(() => {
    if (!busquedaProductoCambio.trim()) return [];
    const q = busquedaProductoCambio.toLowerCase();
    return productos
      .filter((p) => (p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)) && !itemsCambio.some((i) => i.producto.id === p.id))
      .slice(0, 6);
  }, [busquedaProductoCambio, productos, itemsCambio]);

  const agregarItemCambio = (producto) => {
    setItemsCambio((prev) => [...prev, { producto, cantidad: 1 }]);
    setBusquedaProductoCambio("");
  };
  const cambiarCantidadCambio = (productoId, valor) => {
    setItemsCambio((prev) =>
      prev.map((i) => (i.producto.id === productoId ? { ...i, cantidad: Math.max(1, Math.min(i.producto.stock, Number(valor) || 1)) } : i))
    );
  };
  const quitarItemCambio = (productoId) => setItemsCambio((prev) => prev.filter((i) => i.producto.id !== productoId));

  const valorCambioEnLiquidacion = useMemo(() => {
    if (!tasa) return 0;
    return itemsCambio.reduce((acc, i) => acc + precioListaEnMoneda(i.producto, monedaReembolso, tasa) * i.cantidad, 0);
  }, [itemsCambio, tasa, monedaReembolso]);

  const valorDevueltoEnLiquidacion = useMemo(() => {
    if (!tasa || !monedaOriginal) return montoEstimado;
    return convertirEntreMonedas(montoEstimado, monedaOriginal, monedaReembolso, tasa);
  }, [montoEstimado, monedaOriginal, monedaReembolso, tasa]);

  // Diferencia "de base": positiva = se le debe al cliente; negativa = el cliente debe pagar
  const diferenciaBase = redondear2(valorDevueltoEnLiquidacion - valorCambioEnLiquidacion);

  // El monto se autocompleta con la diferencia calculada, pero se puede ajustar a mano
  useEffect(() => {
    if (!montoTocado) setMontoManual(Math.abs(diferenciaBase) > 0.01 ? Math.abs(diferenciaBase).toFixed(2) : "");
  }, [diferenciaBase, montoTocado]);

  const necesitaClienteManual =
    !ventaTieneCliente && (tipoReembolso === "credito" || (tipoReembolso === "fiado" && diferenciaBase < 0));

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

  const manejarSubmit = async (e) => {
    e.preventDefault();
    if (itemsSeleccionados.length === 0) {
      toast.error("Seleccioná al menos un producto a devolver");
      return;
    }
    if (tipoReembolso === "efectivo" && !metodoPagoId) {
      toast.error("Indicá con qué método se movió el dinero");
      return;
    }
    if (necesitaClienteManual && !clienteElegido) {
      toast.error(tipoReembolso === "credito" ? "Elegí a qué cliente guardarle el saldo a favor" : "Elegí a qué cliente se le fía la diferencia");
      return;
    }

    setGuardando(true);
    try {
      const resultado = await crearDevolucion({
        venta_id: ventaId,
        items: itemsSeleccionados.map((i) => ({ producto_id: i.producto_id, cantidad: cantidades[i.producto_id] })),
        items_cambio: esCambio && itemsCambio.length > 0 ? itemsCambio.map((i) => ({ producto_id: i.producto.id, cantidad: i.cantidad })) : undefined,
        tipo_reembolso: tipoReembolso,
        moneda_reembolso: monedaReembolso,
        monto_manual: montoManual !== "" ? montoManual : undefined,
        metodo_pago_id: tipoReembolso === "efectivo" ? Number(metodoPagoId) : null,
        cliente_id: necesitaClienteManual ? clienteElegido?.id : undefined,
        motivo: motivo || null,
      });

      if (Math.abs(resultado.diferencia) > 0.01) {
        toast.success(
          resultado.diferencia > 0
            ? `Devolución registrada — a favor del cliente ${formatearMoneda(resultado.diferencia, resultado.moneda_liquidacion)}`
            : `Devolución registrada — el cliente pagó ${formatearMoneda(Math.abs(resultado.diferencia), resultado.moneda_liquidacion)}`
        );
      } else {
        toast.success("Devolución registrada");
      }
      onGuardado();
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo registrar la devolución");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="modal-overlay" onClick={onCerrar}>
        <div className="modal-jairo modal-pequeño" onClick={(e) => e.stopPropagation()}>
          <div className="estado-caja">Cargando venta...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-jairo modal-grande" onClick={(e) => e.stopPropagation()}>
        <h3>Devolución — {datos.venta.numero_venta}</h3>
        <p className="modal-subtitulo">Elegí qué productos vuelven al inventario</p>

        <form onSubmit={manejarSubmit} className="formulario">
          <div className="tabla-datos-wrapper mt-1">
            <table className="tabla-datos">
              <thead>
                <tr><th>Producto</th><th>Vendido</th><th>Ya devuelto</th><th>Disponible</th><th>Devolver</th></tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.producto_id}>
                    <td>{i.nombre}</td>
                    <td>{i.cantidad}</td>
                    <td>{i.cantidad_devuelta}</td>
                    <td>{i.cantidad_disponible}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max={i.cantidad_disponible}
                        className="input-jairo"
                        style={{ width: "80px" }}
                        value={cantidades[i.producto_id] || ""}
                        onChange={(e) => cambiarCantidad(i.producto_id, i.cantidad_disponible, e.target.value)}
                        disabled={i.cantidad_disponible === 0}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <label className="mt-2" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input type="checkbox" checked={esCambio} onChange={(e) => setEsCambio(e.target.checked)} />
            Es un cambio — el cliente se lleva otro producto
          </label>

          {esCambio && (
            <div className="panel mt-1">
              <div className="panel-header"><span className="panel-titulo">Producto que se lleva a cambio</span></div>
              <div className="buscador">
                <FaSearch />
                <input placeholder="Buscar por nombre o código..." value={busquedaProductoCambio} onChange={(e) => setBusquedaProductoCambio(e.target.value)} />
              </div>
              {busquedaProductoCambio.trim() && (
                <div className="lista-seleccionable mt-1">
                  {productosFiltradosCambio.length === 0 && <div className="estado-vacio">Sin resultados</div>}
                  {productosFiltradosCambio.map((p) => (
                    <button key={p.id} type="button" className="item-seleccionable" onClick={() => agregarItemCambio(p)} disabled={p.stock <= 0}>
                      <div className="item-seleccionable-info">
                        <div className="item-seleccionable-nombre">{p.nombre}</div>
                        <div className="item-seleccionable-meta">{p.codigo} · Stock: {p.stock}</div>
                      </div>
                      <span className="item-seleccionable-precio">
                        {tasa && formatearMoneda(precioListaEnMoneda(p, monedaReembolso, tasa), monedaReembolso)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {itemsCambio.length > 0 && (
                <div className="tabla-datos-wrapper mt-1">
                  <table className="tabla-datos">
                    <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th></th></tr></thead>
                    <tbody>
                      {itemsCambio.map((i) => (
                        <tr key={i.producto.id}>
                          <td>{i.producto.nombre}</td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              max={i.producto.stock}
                              className="input-jairo"
                              style={{ width: "70px" }}
                              value={i.cantidad}
                              onChange={(e) => cambiarCantidadCambio(i.producto.id, e.target.value)}
                            />
                          </td>
                          <td>{tasa && formatearMoneda(precioListaEnMoneda(i.producto, monedaReembolso, tasa) * i.cantidad, monedaReembolso)}</td>
                          <td><button type="button" className="btn-peligro" onClick={() => quitarItemCambio(i.producto.id)}><FaTimes /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {itemsSeleccionados.length > 0 && (
            <div className="carrito-resumen mt-1">
              <div className="carrito-resumen-linea">
                <span>Valor devuelto</span>
                <span>{formatearMoneda(montoEstimado, monedaOriginal)}</span>
              </div>
              {esCambio && itemsCambio.length > 0 && (
                <div className="carrito-resumen-linea">
                  <span>Valor entregado a cambio</span>
                  <span>{formatearMoneda(valorCambioEnLiquidacion, monedaReembolso)}</span>
                </div>
              )}
              <div className={`carrito-resumen-total ${diferenciaBase < 0 ? "ajuste-recargo" : "ajuste-descuento"}`}>
                <span>{diferenciaBase >= 0 ? "A favor del cliente" : "El cliente debe pagar"}</span>
                <span>{formatearMoneda(Math.abs(diferenciaBase), monedaReembolso)}</span>
              </div>
            </div>
          )}

          <div className="formulario-fila mt-2">
            <div className="formulario-campo" style={{ flex: "0 0 90px" }}>
              <label>Moneda</label>
              <select value={monedaReembolso} onChange={(e) => setMonedaReembolso(e.target.value)}>
                {MONEDAS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <label className="mt-1">¿Qué pasa con la diferencia?</label>
          <div className="selector-pill">
            <button type="button" className={tipoReembolso === "ninguno" ? "activo" : ""} onClick={() => setTipoReembolso("ninguno")}>
              Solo cambio
            </button>
            <button type="button" className={tipoReembolso === "efectivo" ? "activo" : ""} onClick={() => setTipoReembolso("efectivo")}>
              Mover efectivo
            </button>
            {(hayFiado || diferenciaBase < 0) && (
              <button type="button" className={tipoReembolso === "fiado" ? "activo" : ""} onClick={() => setTipoReembolso("fiado")}>
                {diferenciaBase < 0 ? "Fiar la diferencia" : "Reducir fiado"}
              </button>
            )}
            {diferenciaBase >= 0 && (
              <button type="button" className={tipoReembolso === "credito" ? "activo" : ""} onClick={() => setTipoReembolso("credito")}>
                Saldo a favor
              </button>
            )}
          </div>

          {necesitaClienteManual && (
            <div className="mt-1">
              {clienteElegido ? (
                <div className="item-seleccionable" style={{ cursor: "default" }}>
                  <div className="item-seleccionable-info">
                    <div className="item-seleccionable-nombre">{clienteElegido.nombre}</div>
                    <div className="item-seleccionable-meta">{clienteElegido.telefono || "Sin teléfono"}</div>
                  </div>
                  <button type="button" className="btn-secundario" onClick={() => setClienteElegido(null)}>Cambiar</button>
                </div>
              ) : (
                <>
                  <div className="buscador">
                    <FaSearch />
                    <input placeholder="Buscar cliente por nombre o teléfono..." value={busquedaCliente} onChange={(e) => buscarCliente(e.target.value)} />
                  </div>
                  {resultadosCliente.length > 0 && (
                    <div className="lista-seleccionable mt-1">
                      {resultadosCliente.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="item-seleccionable"
                          onClick={() => { setClienteElegido(c); setResultadosCliente([]); setBusquedaCliente(""); }}
                        >
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
          )}

          {tipoReembolso !== "ninguno" && (
            <div className="formulario-fila mt-1">
              <div className="formulario-campo">
                <label>Monto de la diferencia ({monedaReembolso})</label>
                <input
                  type="number"
                  step="0.01"
                  value={montoManual}
                  onChange={(e) => { setMontoTocado(true); setMontoManual(e.target.value); }}
                />
              </div>
              {tipoReembolso === "efectivo" && (
                <div className="formulario-campo">
                  <label>Método de pago</label>
                  <select value={metodoPagoId} onChange={(e) => setMetodoPagoId(e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {metodosPago.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {tipoReembolso === "efectivo" && (
            <p className="pagina-subtitulo mt-1">
              {diferenciaBase >= 0
                ? "Sale de caja como egreso — se refleja en Punto de Venta y resta del cuadre."
                : "Entra a caja como ingreso — se refleja en Punto de Venta y suma al cuadre."}
            </p>
          )}
          {tipoReembolso === "fiado" && diferenciaBase < 0 && (
            <p className="pagina-subtitulo mt-1">El cliente queda debiendo esta diferencia, sin mover efectivo.</p>
          )}
          {tipoReembolso === "fiado" && diferenciaBase >= 0 && (
            <p className="pagina-subtitulo mt-1">Se reduce la deuda pendiente del cliente, sin mover efectivo.</p>
          )}
          {tipoReembolso === "credito" && (
            <p className="pagina-subtitulo mt-1">
              Queda anotado como saldo a favor del cliente — no mueve la caja. Se lo podés descontar la próxima vez que compre.
            </p>
          )}

          <div className="formulario-campo mt-1">
            <label>Motivo (opcional)</label>
            <textarea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </div>

          <div className="modal-acciones">
            <button type="button" className="btn-secundario" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="btn-primario" disabled={guardando}>{guardando ? "Registrando..." : "Registrar devolución"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}