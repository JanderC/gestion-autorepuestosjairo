import { FaCheckCircle } from "react-icons/fa";
import { formatearMoneda } from "../../utils/formatoMoneda";

export default function VentaRegistradaModal({ resultado, onCerrar }) {
  const { venta, vuelto_monto, vuelto_moneda, es_fiado, saldo_fiado, saldo_fiado_moneda, ajuste_usd } = resultado;

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-jairo modal-pequeño texto-centrado" onClick={(e) => e.stopPropagation()}>
        <FaCheckCircle className="icono-exito-grande" />
        <h3 className="mb-1">Venta {venta.numero_venta} registrada</h3>

        {vuelto_monto > 0 && (
          <p className="carrito-resumen-linea">
            <span>Vuelto a entregar (informativo)</span>
            <span>{formatearMoneda(vuelto_monto, vuelto_moneda)}</span>
          </p>
        )}
        {es_fiado && (
          <p className="carrito-resumen-linea ajuste-recargo">
            <span>Fiado</span>
            <span>{formatearMoneda(saldo_fiado, saldo_fiado_moneda)}</span>
          </p>
        )}
        {ajuste_usd !== 0 && (
          <p className={`carrito-resumen-linea ${ajuste_usd > 0 ? "ajuste-descuento" : "ajuste-recargo"}`}>
            <span>{ajuste_usd > 0 ? "Descuento aplicado" : "Recargo aplicado"}</span>
            <span>{formatearMoneda(Math.abs(ajuste_usd), "USD")}</span>
          </p>
        )}

        <button className="btn-primario ancho-completo mt-3" onClick={onCerrar}>
          Cerrar
        </button>
      </div>
    </div>
  );
}