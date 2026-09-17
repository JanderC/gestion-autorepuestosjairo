import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./Paginacion.css";

export default function Paginacion({ paginaActual, totalPaginas, onCambiar }) {
  if (totalPaginas <= 1) return null;

  // Muestra un rango acotado de páginas alrededor de la actual (máx. 5 botones)
  const rango = [];
  const inicio = Math.max(1, paginaActual - 2);
  const fin = Math.min(totalPaginas, inicio + 4);
  for (let i = inicio; i <= fin; i++) rango.push(i);

  return (
    <nav className="paginacion-jairo">
      <button
        disabled={paginaActual === 1}
        onClick={() => onCambiar(paginaActual - 1)}
        aria-label="Página anterior"
      >
        <FaChevronLeft />
      </button>

      {inicio > 1 && (
        <>
          <button onClick={() => onCambiar(1)}>1</button>
          {inicio > 2 && <span className="paginacion-puntos">...</span>}
        </>
      )}

      {rango.map((p) => (
        <button
          key={p}
          className={p === paginaActual ? "paginacion-activo" : ""}
          onClick={() => onCambiar(p)}
        >
          {p}
        </button>
      ))}

      {fin < totalPaginas && (
        <>
          {fin < totalPaginas - 1 && <span className="paginacion-puntos">...</span>}
          <button onClick={() => onCambiar(totalPaginas)}>{totalPaginas}</button>
        </>
      )}

      <button
        disabled={paginaActual === totalPaginas}
        onClick={() => onCambiar(paginaActual + 1)}
        aria-label="Página siguiente"
      >
        <FaChevronRight />
      </button>
    </nav>
  );
}