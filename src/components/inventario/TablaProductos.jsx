import { FaEdit, FaPlusCircle, FaMinusCircle, FaTrash, FaImage } from "react-icons/fa";
import { formatearMoneda } from "../../utils/formatoMoneda";
import "./TablaProductos.css";

export default function TablaProductos({ productos, onEditar, onAjustarStock, onDesactivar }) {
  if (productos.length === 0) {
    return <div className="tabla-vacia">No hay productos para mostrar.</div>;
  }

  return (
    <div className="tabla-productos-wrapper">
      <table className="tabla-productos">
        <thead>
          <tr>
            <th></th>
            <th>Código</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Stock</th>
            <th>P. compra</th>
            <th>P. venta</th>
            <th>% Ganancia</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.id} className={Number(p.stock) <= 3 ? "fila-stock-bajo" : ""}>
              <td>
                {p.imagen_url ? (
                  <img src={p.imagen_url} alt={p.nombre} className="miniatura-producto" />
                ) : (
                  <div className="miniatura-placeholder">
                    <FaImage />
                  </div>
                )}
              </td>
              <td className="celda-codigo">{p.codigo}</td>
              <td>{p.nombre}</td>
              <td>{p.categoria || "—"}</td>
              <td>
                <span className={`badge-stock ${Number(p.stock) <= 3 ? "badge-stock-bajo" : ""}`}>
                  {p.stock}
                </span>
              </td>
              <td>{formatearMoneda(p.precio_compra, p.moneda_base)}</td>
              <td>{formatearMoneda(p.precio_venta, p.moneda_base)}</td>
              <td>{p.porcentaje_ganancia != null ? `${Number(p.porcentaje_ganancia).toFixed(1)}%` : "—"}</td>
              <td className="celda-acciones">
                <button title="Editar" onClick={() => onEditar(p)}>
                  <FaEdit />
                </button>
                <button title="Sumar stock" onClick={() => onAjustarStock(p, "sumar")}>
                  <FaPlusCircle />
                </button>
                <button title="Restar stock" onClick={() => onAjustarStock(p, "restar")}>
                  <FaMinusCircle />
                </button>
                <button title="Desactivar" className="btn-peligro" onClick={() => onDesactivar(p)}>
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}