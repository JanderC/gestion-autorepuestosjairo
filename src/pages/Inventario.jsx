import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { FaBoxOpen, FaLayerGroup, FaThLarge, FaSearch, FaArrowLeft, FaPlus } from "react-icons/fa";
import {
  obtenerProductos,
  obtenerCategorias,
  ajustarStock as ajustarStockApi,
  desactivarProducto as desactivarProductoApi,
} from "../api/productos.api";
import { obtenerTasaActual } from "../api/tasas.api";
import { formatearMoneda } from "../utils/formatoMoneda";
import { convertirAUSD, convertirDesdeUSD } from "../utils/monedaHelpers";
import TarjetaCategoria from "../components/inventario/TarjetaCategoria";
import TablaProductos from "../components/inventario/TablaProductos";
import ProductoFormModal from "../components/inventario/ProductoFormModal";
import AjusteStockModal from "../components/inventario/AjusteStockModal";
import Paginacion from "../components/comunes/Paginacion";
import "./Inventario.css";

const POR_PAGINA = 10;
const MONEDAS = ["USD", "COP", "BS"];

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [tasa, setTasa] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [vista, setVista] = useState("categorias"); // 'categorias' | 'general' | 'categoria-detalle'
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);

  const [modalProducto, setModalProducto] = useState(null);
  const [ajusteStock, setAjusteStock] = useState(null);

  const cargarDatos = async () => {
    setCargando(true);
    setError(null);
    try {
      const [listaProductos, listaCategorias, tasaActual] = await Promise.all([
        obtenerProductos(),
        obtenerCategorias(),
        obtenerTasaActual(),
      ]);
      setProductos(listaProductos);
      setCategorias(listaCategorias);
      setTasa(tasaActual);
    } catch (err) {
      setError("No se pudo cargar el inventario");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const totalProductos = productos.length;

  // Capital invertido: cada producto se convierte a USD (sin importar en qué moneda esté
  // cargado), se suma todo, y ese único total se muestra convertido a las 3 monedas —
  // así "cuánto capital hay invertido" es el MISMO número real, visto en 3 formatos, y no
  // tres sumas distintas según en qué moneda cargaron cada producto.
  const capitalTotalUSD = useMemo(() => {
    if (!tasa) return 0;
    return productos.reduce(
      (acc, p) => acc + convertirAUSD(Number(p.precio_compra) || 0, p.moneda_base, tasa) * Number(p.stock || 0),
      0
    );
  }, [productos, tasa]);

  const capitalPorMoneda = useMemo(() => {
    if (!tasa) return { USD: 0, COP: 0, BS: 0 };
    const resultado = {};
    MONEDAS.forEach((m) => { resultado[m] = convertirDesdeUSD(capitalTotalUSD, m, tasa); });
    return resultado;
  }, [capitalTotalUSD, tasa]);

  const productosPorCategoria = useMemo(
    () =>
      productos.reduce((acc, p) => {
        const cat = p.categoria || "Sin categoría";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(p);
        return acc;
      }, {}),
    [productos]
  );

  const nombresCategorias = Object.keys(productosPorCategoria).sort();

  const productosFiltrados = useMemo(() => {
    let base = categoriaActiva ? productosPorCategoria[categoriaActiva] || [] : productos;

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      base = base.filter(
        (p) => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)
      );
    }
    return base;
  }, [categoriaActiva, productos, productosPorCategoria, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / POR_PAGINA));
  const productosPagina = productosFiltrados.slice(
    (pagina - 1) * POR_PAGINA,
    pagina * POR_PAGINA
  );

  useEffect(() => {
    setPagina(1);
  }, [categoriaActiva, busqueda, vista]);

  const abrirCategoria = (categoria) => {
    setCategoriaActiva(categoria);
    setVista("categoria-detalle");
  };

  const volverACategorias = () => {
    setCategoriaActiva(null);
    setVista("categorias");
    setBusqueda("");
  };

  const confirmarAjusteStock = async (id, cantidad) => {
    try {
      await ajustarStockApi(id, cantidad);
      toast.success("Stock actualizado");
      setAjusteStock(null);
      cargarDatos();
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo ajustar el stock");
    }
  };

  const confirmarDesactivar = async (producto) => {
    if (!window.confirm(`¿Desactivar "${producto.nombre}"? Dejará de aparecer en ventas.`)) return;
    try {
      await desactivarProductoApi(producto.id);
      toast.success("Producto desactivado");
      cargarDatos();
    } catch (err) {
      toast.error("No se pudo desactivar el producto");
    }
  };

  if (cargando) return <div className="inventario-estado">Cargando inventario...</div>;
  if (error) return <div className="inventario-estado inventario-error">{error}</div>;

  return (
    <div className="inventario-pagina">
      <div className="inventario-resumen">
        <div className="tarjeta-resumen tarjeta-resumen-destacada">
          <FaBoxOpen className="tarjeta-resumen-icono" />
          <div>
            <span className="tarjeta-resumen-valor">{totalProductos}</span>
            <span className="tarjeta-resumen-label">Productos activos</span>
          </div>
        </div>

        {MONEDAS.map((moneda) => (
          <div key={moneda} className={`tarjeta-resumen tarjeta-resumen-${moneda.toLowerCase()}`}>
            <div>
              <span className="tarjeta-resumen-valor">
                {formatearMoneda(capitalPorMoneda[moneda] || 0, moneda)}
              </span>
              <span className="tarjeta-resumen-label">Capital invertido en {moneda}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="inventario-controles">
        {vista === "categoria-detalle" ? (
          <button className="btn-volver" onClick={volverACategorias}>
            <FaArrowLeft /> Todas las categorías
          </button>
        ) : (
          <div className="selector-vista">
            <button
              className={vista === "categorias" ? "activo" : ""}
              onClick={() => setVista("categorias")}
            >
              <FaLayerGroup /> Por pasillo
            </button>
            <button
              className={vista === "general" ? "activo" : ""}
              onClick={() => setVista("general")}
            >
              <FaThLarge /> Vista general
            </button>
          </div>
        )}

        <div className="inventario-controles-derecha">
          {(vista === "general" || vista === "categoria-detalle") && (
            <div className="buscador-inventario">
              <FaSearch />
              <input
                placeholder="Buscar por nombre o código..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          )}
          <button
            className="btn-primario"
            onClick={() =>
              setModalProducto({
                producto: null,
                categoriaSugerida: categoriaActiva && categoriaActiva !== "Sin categoría" ? categoriaActiva : "",
              })
            }
          >
            <FaPlus /> Nuevo producto
          </button>
        </div>
      </div>

      {vista === "categorias" && (
        <div className="grid-categorias">
          {nombresCategorias.map((cat) => (
            <TarjetaCategoria
              key={cat}
              categoria={cat === "Sin categoría" ? null : cat}
              productos={productosPorCategoria[cat]}
              tasa={tasa}
              onAbrir={() => abrirCategoria(cat)}
            />
          ))}
        </div>
      )}

      {(vista === "general" || vista === "categoria-detalle") && (
        <>
          {vista === "categoria-detalle" && <h2 className="titulo-categoria-activa">{categoriaActiva}</h2>}

          <TablaProductos
            productos={productosPagina}
            onEditar={(p) => setModalProducto({ producto: p, categoriaSugerida: "" })}
            onAjustarStock={(p, tipo) => setAjusteStock({ producto: p, tipo })}
            onDesactivar={confirmarDesactivar}
          />

          <Paginacion paginaActual={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
        </>
      )}

      {modalProducto && (
        <ProductoFormModal
          producto={modalProducto.producto}
          categorias={nombresCategorias.filter((c) => c !== "Sin categoría")}
          categoriaSugerida={modalProducto.categoriaSugerida}
          onGuardado={() => {
            setModalProducto(null);
            cargarDatos();
          }}
          onCerrar={() => setModalProducto(null)}
        />
      )}

      {ajusteStock && (
        <AjusteStockModal
          producto={ajusteStock.producto}
          tipo={ajusteStock.tipo}
          onConfirmar={confirmarAjusteStock}
          onCerrar={() => setAjusteStock(null)}
        />
      )}
    </div>
  );
}