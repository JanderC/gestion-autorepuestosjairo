import { formatearMoneda } from "../../utils/formatoMoneda";

export default function DetalleVentaModal({ venta, onCerrar, onDevolver }) {
  const { venta: v, detalles, pagos, cliente, fiado } = venta;

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-jairo modal-grande" onClick={(e) => e.stopPropagation()}>
        <h3>
          {v.numero_venta}
          {v.estado === "fiado" && (
            <span className="badge-estado badge-estado-pendiente" style={{ marginLeft: "0.5rem" }}>FIADO</span>
          )}
        </h3>

        {cliente && (
          <p className="modal-subtitulo">
            Cliente: <strong>{cliente.nombre}</strong>
            {fiado && ` · Saldo pendiente: ${formatearMoneda(fiado.saldo_pendiente_original, fiado.moneda)}`}
          </p>
        )}

        <div className="panel-header mt-1"><span className="panel-titulo">Productos</span></div>
        {detalles.map((d) => (
          <div key={d.id} className="saldo-linea">
            <span>{d.cantidad}x {d.nombre}</span>
            <span>{formatearMoneda(d.subtotal_original, d.moneda_original)}</span>
          </div>
        ))}

        {Number(v.ajuste_usd) !== 0 && (
          <div className={`saldo-linea ${Number(v.ajuste_usd) > 0 ? "ajuste-descuento" : "ajuste-recargo"}`}>
            <span>{Number(v.ajuste_usd) > 0 ? "Descuento aplicado" : "Recargo aplicado"}</span>
            <span>{formatearMoneda(Math.abs(v.ajuste_usd), "USD")}</span>
          </div>
        )}

        <div className="panel-header mt-2"><span className="panel-titulo">Desglose de pago</span></div>
        {pagos.length === 0 && <div className="estado-vacio">Sin pagos registrados (venta 100% fiada)</div>}
        {pagos.map((p) => (
          <div key={p.id} className="saldo-linea">
            <span>{p.metodo_nombre} ({p.moneda})</span>
            <span>{formatearMoneda(p.monto, p.moneda)}</span>
          </div>
        ))}

        {v.vuelto_monto > 0 && (
          <p className="pagina-subtitulo mt-1">
            Vuelto entregado (informativo): <strong>{formatearMoneda(v.vuelto_monto, v.vuelto_moneda)}</strong>
          </p>
        )}

        <div className="modal-acciones">
          <button className="btn-secundario" onClick={onCerrar}>Cerrar</button>
          {onDevolver && v.estado !== "anulada" && (
            <button className="btn-primario" onClick={onDevolver}>Registrar devolución</button>
          )}
        </div>
      </div>
    </div>
  );
}