import { FaWarehouse, FaBoxes } from "react-icons/fa";
import { formatearMoneda } from "../../utils/formatoMoneda";
import { convertirAUSD, convertirDesdeUSD } from "../../utils/monedaHelpers";
import "./TarjetaCategoria.css";

const MONEDAS = ["USD", "COP", "BS"];

export default function TarjetaCategoria({ categoria, productos, tasa, onAbrir }) {
  const cantidad = productos.length;
  const stockTotal = productos.reduce((acc, p) => acc + Number(p.stock || 0), 0);

  // Mismo criterio que el resumen general: se convierte todo a USD, se suma, y ese total
  // se muestra en las 3 monedas — no una suma separada por cada moneda base distinta.ss
  const capitalUSD = tasa
    ? productos.reduce(
        (acc, p) => acc + convertirAUSD(Number(p.precio_compra) || 0, p.moneda_base, tasa) * Number(p.stock || 0),
        0
      )
    : 0;

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
          {tasa &&
            MONEDAS.map((m) => (
              <span key={m} className={`chip-moneda chip-${m.toLowerCase()}`}>
                {formatearMoneda(convertirDesdeUSD(capitalUSD, m, tasa), m)}
              </span>
            ))}
        </div>
      </div>
    </button>
  );
}