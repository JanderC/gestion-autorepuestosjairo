import { useState, useEffect, useMemo } from "react";
import { FaSearch } from "react-icons/fa";
import { obtenerProductos, obtenerCategorias } from "../api/productos.api";
import { obtenerTasaActual } from "../api/tasas.api";
import { precioListaEnMoneda } from "../utils/monedaHelpers";
import { formatearMoneda } from "../utils/formatoMoneda";

const MONEDAS = ["USD", "COP", "BS"];

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [tasa, setTasa] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("todas");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      setCargando(true);
      try {
        const [listaProductos, listaCategorias, tasaActual] = await Promise.all([
          obtenerProductos(),
          obtenerCategorias(),
          obtenerTasaActual(),
        ]);
        setProductos(listaProductos);
        // Recorta espacios y elimina duplicados casi idénticos (ej. "Frenos" y "Frenos ")
        // que hacían que el filtro exacto nunca encontrara coincidencia.
        setCategorias([...new Set(listaCategorias.map((c) => (c || "").trim()).filter(Boolean))]);
        setTasa(tasaActual);
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const productosFiltrados = useMemo(() => {
    let base = productos;
    if (categoriaActiva !== "todas") {
      const objetivo = categoriaActiva.trim().toLowerCase();
      base = base.filter((p) => (p.categoria || "").trim().toLowerCase() === objetivo);
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      base = base.filter((p) => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q));
    }
    return base;
  }, [productos, categoriaActiva, busqueda]);

  if (cargando) return <div className="estado-caja">Cargando productos...</div>;

  return (
    <div className="pagina">
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titulo">Productos</h1>
          <p className="pagina-subtitulo">Catálogo de consulta — para editar inventario, ingresá a Inventario</p>
        </div>
      </div>

      <div className="buscador">
        <FaSearch />
        <input placeholder="Buscar por nombre o código..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </div>

      <div className="chip-selector mt-1">
        <button
          type="button"
          className={`chip-opcion ${categoriaActiva === "todas" ? "activo" : ""}`}
          onClick={() => setCategoriaActiva("todas")}
        >
          Todas
        </button>
        {categorias.map((c) => (
          <button
            type="button"
            key={c}
            className={`chip-opcion ${categoriaActiva === c ? "activo" : ""}`}
            onClick={() => setCategoriaActiva(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid-tarjetas mt-2">
        {productosFiltrados.map((p) => (
          <div key={p.id} className="item-seleccionable" style={{ cursor: "default", alignItems: "flex-start" }}>
            {p.imagen_url ? (
              <img src={p.imagen_url} alt={p.nombre} className="item-seleccionable-imagen" />
            ) : (
              <div className="item-seleccionable-imagen" />
            )}
            <div className="item-seleccionable-info">
              <div className="item-seleccionable-nombre">{p.nombre}</div>
              <div className="item-seleccionable-meta">{p.codigo} · Stock: {p.stock}</div>
              <div className="chip-selector mt-1">
                {MONEDAS.map((m) => (
                  <span key={m} className={`chip-moneda chip-${m.toLowerCase()}`}>
                    {tasa ? formatearMoneda(precioListaEnMoneda(p, m, tasa), m) : "—"}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
        {productosFiltrados.length === 0 && <div className="estado-vacio">Sin resultados</div>}
      </div>
    </div>
  );
}