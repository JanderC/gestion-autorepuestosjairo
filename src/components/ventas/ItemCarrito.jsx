import { FaMinus, FaPlus, FaTimes } from "react-icons/fa";

export default function ItemCarrito({ item, onCambiarCantidad, onCambiarPrecio, onQuitar }) {
  const precioListaRedondeado = Number(item.precioLista.toFixed(2));
  const esAjustado = item.precioManual != null && Number(item.precioManual) !== precioListaRedondeado;

  return (
    <div className="carrito-item">
      <div>
        <div className="carrito-item-nombre">{item.nombre}</div>
        <span className="badge-stock">{item.codigo}</span>
      </div>

      <div className="carrito-item-cantidad">
        <button type="button" onClick={() => onCambiarCantidad(item.producto_id, item.cantidad - 1)}>
          <FaMinus />
        </button>
        <span>{item.cantidad}</span>
        <button type="button" onClick={() => onCambiarCantidad(item.producto_id, item.cantidad + 1)}>
          <FaPlus />
        </button>
      </div>

      <div className="carrito-item-precio">
        <input
          type="number"
          step="0.01"
          className={esAjustado ? "precio-ajustado" : ""}
          value={item.precioManual != null ? item.precioManual : precioListaRedondeado}
          onChange={(e) => onCambiarPrecio(item.producto_id, e.target.value)}
        />
      </div>

      <button type="button" className="carrito-item-quitar" onClick={() => onQuitar(item.producto_id)}>
        <FaTimes />
      </button>
    </div>
  );
}