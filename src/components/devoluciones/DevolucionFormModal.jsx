import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { obtenerVentaDevolvible, crearDevolucion } from "../../api/devoluciones.api";
import { formatearMoneda } from "../../utils/formatoMoneda";

const MONEDAS = ["USD", "COP", "BS"];

export default function DevolucionFormModal({ ventaId, metodosPago, onGuardado, onCerrar }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cantidades, setCantidades] = useState({});
  const [tipoReembolso, setTipoReembolso] = useState("ninguno");
  const [monedaReembolso, setMonedaReembolso] = useState("USD");
  const [metodoPagoId, setMetodoPagoId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await obtenerVentaDevolvible(ventaId);
        setDatos(data);
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

  const manejarSubmit = async (e) => {
    e.preventDefault();
    if (itemsSeleccionados.length === 0) {
      toast.error("Seleccioná al menos un producto a devolver");
      return;
    }
    if (tipoReembolso === "efectivo" && !metodoPagoId) {
      toast.error("Indicá con qué método se le devolvió el dinero");
      return;
    }

    setGuardando(true);
    try {
      await crearDevolucion({
        venta_id: ventaId,
        items: itemsSeleccionados.map((i) => ({ producto_id: i.producto_id, cantidad: cantidades[i.producto_id] })),
        tipo_reembolso: tipoReembolso,
        moneda_reembolso: tipoReembolso !== "ninguno" ? monedaReembolso : null,
        metodo_pago_id: tipoReembolso === "efectivo" ? Number(metodoPagoId) : null,
        motivo: motivo || null,
      });
      toast.success("Devolución registrada");
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

          {itemsSeleccionados.length > 0 && (
            <div className="carrito-resumen mt-1">
              <div className="carrito-resumen-total">
                <span>Valor a devolver</span>
                <span>{formatearMoneda(montoEstimado, monedaOriginal)}</span>
              </div>
            </div>
          )}

          <label className="mt-2">¿Qué pasa con el dinero?</label>
          <div className="selector-pill">
            <button type="button" className={tipoReembolso === "ninguno" ? "activo" : ""} onClick={() => setTipoReembolso("ninguno")}>
              Solo cambio
            </button>
            <button type="button" className={tipoReembolso === "efectivo" ? "activo" : ""} onClick={() => setTipoReembolso("efectivo")}>
              Reembolsar efectivo
            </button>
            {hayFiado && (
              <button type="button" className={tipoReembolso === "fiado" ? "activo" : ""} onClick={() => setTipoReembolso("fiado")}>
                Reducir fiado
              </button>
            )}
          </div>

          {tipoReembolso !== "ninguno" && (
            <div className="formulario-fila mt-1">
              <div className="formulario-campo" style={{ flex: "0 0 90px" }}>
                <label>Moneda</label>
                <select value={monedaReembolso} onChange={(e) => setMonedaReembolso(e.target.value)}>
                  {MONEDAS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
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
              Esto se registra como un egreso del turno actual — se refleja en Punto de Venta y resta del cuadre de caja.
            </p>
          )}
          {tipoReembolso === "fiado" && (
            <p className="pagina-subtitulo mt-1">
              Esto reduce directamente la deuda pendiente del cliente, sin mover efectivo.
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