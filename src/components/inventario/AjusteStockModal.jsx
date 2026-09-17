import { useState } from "react";

export default function AjusteStockModal({ producto, tipo, onConfirmar, onCerrar }) {
  const [cantidad, setCantidad] = useState(1);

  const confirmar = () => {
    if (!cantidad || cantidad <= 0) return;
    const valor = tipo === "restar" ? -Math.abs(cantidad) : Math.abs(cantidad);
    onConfirmar(producto.id, valor);
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-jairo modal-pequeño" onClick={(e) => e.stopPropagation()}>
        <h3>{tipo === "restar" ? "Restar stock" : "Sumar stock"}</h3>
        <p className="modal-subtitulo">
          {producto.nombre} — stock actual: <strong>{producto.stock}</strong>
        </p>

        <input
          type="number"
          min="1"
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value))}
          className="input-jairo"
          autoFocus
        />

        <div className="modal-acciones">
          <button className="btn-secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button className="btn-primario" onClick={confirmar}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}