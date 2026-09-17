import { FaWarehouse, FaBoxes } from "react-icons/fa";
import { formatearMoneda } from "../../utils/formatoMoneda";
import "./TarjetaCategoria.css";

export default function TarjetaCategoria({ categoria, productos, onAbrir }) {
  const cantidad = productos.length;
  const stockTotal = productos.reduce((acc, p) => acc + Number(p.stock || 0), 0);

  const capitalPorMoneda = productos.reduce((acc, p) => {
    const capital = Number(p.precio_compra || 0) * Number(p.stock || 0);
    acc[p.moneda_base] = (acc[p.moneda_base] || 0) + capital;
    return acc;
  }, {});

  return (
    <button className="tarjeta-categoria" onClick={onAbrir}>
      <div className="tarjeta-categoria-icono">
        <FaWarehouse />
      </div>

      <div className="tarjeta-categoria-info">
        <h3>{categoria || "Sin categoría"}</h3>
        <p className="tarjeta-categoria-meta">
          <FaBoxes /> {cantidad} producto{cantidad !== 1 ? "s" : ""} · {stockTotal} unid. en stock
        </p>

        <div className="tarjeta-categoria-capital">
          {Object.entries(capitalPorMoneda).map(([moneda, valor]) => (
            <span key={moneda} className={`chip-moneda chip-${moneda.toLowerCase()}`}>
              {formatearMoneda(valor, moneda)}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}