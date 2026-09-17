import { FaTrash } from "react-icons/fa";

const MONEDAS = ["USD", "COP", "BS"];

export default function LineaPago({ pago, metodosPago, onCambiar, onQuitar }) {
  return (
    <div className="linea-pago">
      <select className="input-jairo" value={pago.metodo_pago_id} onChange={(e) => onCambiar({ ...pago, metodo_pago_id: e.target.value })}>
        <option value="">Método...</option>
        {metodosPago.map((m) => (
          <option key={m.id} value={m.id}>{m.nombre}</option>
        ))}
      </select>

      <select className="input-jairo" value={pago.moneda} onChange={(e) => onCambiar({ ...pago, moneda: e.target.value })}>
        {MONEDAS.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      <input
        className="input-jairo"
        type="number"
        step="0.01"
        placeholder="Monto"
        value={pago.monto}
        onChange={(e) => onCambiar({ ...pago, monto: e.target.value })}
      />

      <button type="button" className="carrito-item-quitar" onClick={() => onQuitar(pago.id)}>
        <FaTrash />
      </button>
    </div>
  );
}