import { useState, useEffect } from "react";
import { FaShoppingCart, FaTrophy, FaCashRegister } from "react-icons/fa";
import { obtenerResumen, obtenerProductosMasVendidos, obtenerVentasPorMoneda } from "../api/reportes.api";
import { obtenerSesionAbierta } from "../api/caja.api";
import { obtenerProductos } from "../api/productos.api";
import { formatearMoneda } from "../utils/formatoMoneda";
import { useAuth } from "../context/AuthContext";

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function Dashboard() {
  const { usuario, rol } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [ventasPorMoneda, setVentasPorMoneda] = useState([]);
  const [masVendido, setMasVendido] = useState(null);
  const [sesionCaja, setSesionCaja] = useState(null);
  const [catalogo, setCatalogo] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      setCargando(true);
      try {
        const hoy = hoyISO();
        const sesion = await obtenerSesionAbierta();
        const productos = await obtenerProductos();
        setSesionCaja(sesion);
        setCatalogo(productos.slice(0, 8));

        if (rol === "admin") {
          const [resumenData, masVendidoData, ventasMonedaData] = await Promise.all([
            obtenerResumen({ desde: hoy, hasta: hoy }),
            obtenerProductosMasVendidos({ desde: hoy, hasta: hoy, limite: 1 }),
            obtenerVentasPorMoneda({ desde: hoy, hasta: hoy }),
          ]);
          setResumen(resumenData);
          setMasVendido(masVendidoData[0] || null);
          setVentasPorMoneda(ventasMonedaData);
        }
      } catch (err) {
        // El dashboard no debe romperse si algún endpoint falla
      } finally {
        setCargando(false);
      }
    })();
  }, [rol]);

  if (cargando) return <div className="estado-caja">Cargando dashboard...</div>;

  const totalPorMoneda = (moneda) => {
    const item = ventasPorMoneda.find((v) => v.moneda === moneda);
    return item ? Number(item.total) : 0;
  };

  return (
    <div className="pagina">
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titulo">Hola, {usuario?.nombre?.split(" ")[0]}</h1>
          <p className="pagina-subtitulo">{sesionCaja ? "Caja abierta" : "No hay una caja abierta"}</p>
        </div>
      </div>

      {rol === "admin" && resumen && (
        <>
          <div className="stats-grid">
            {["USD", "COP", "BS"].map((moneda) => (
              <div key={moneda} className={`stat-card stat-card-${moneda.toLowerCase()}`}>
                <div>
                  <span className="stat-valor">{formatearMoneda(totalPorMoneda(moneda), moneda)}</span>
                  <span className="stat-label">Vendido hoy en {moneda}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="stats-grid">
            <div className="stat-card stat-card-destacada">
              <FaShoppingCart className="stat-icono" />
              <div>
                <span className="stat-valor">{resumen.cantidad_ventas}</span>
                <span className="stat-label">Ventas de hoy</span>
              </div>
            </div>
            <div className="stat-card">
              <FaTrophy className="stat-icono" />
              <div>
                <span className="stat-valor">{masVendido ? masVendido.nombre : "—"}</span>
                <span className="stat-label">Producto más vendido hoy</span>
              </div>
            </div>
            <div className="stat-card">
              <FaCashRegister className="stat-icono" />
              <div>
                <span className="stat-valor">{resumen.productos_stock_bajo}</span>
                <span className="stat-label">Productos con stock bajo</span>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="panel">
        <div className="panel-header">
          <span className="panel-titulo">Catálogo</span>
        </div>
        <div className="grid-tarjetas">
          {catalogo.map((p) => (
            <div key={p.id} className="item-seleccionable" style={{ cursor: "default" }}>
              {p.imagen_url ? (
                <img src={p.imagen_url} alt={p.nombre} className="item-seleccionable-imagen" />
              ) : (
                <div className="item-seleccionable-imagen" />
              )}
              <div className="item-seleccionable-info">
                <div className="item-seleccionable-nombre">{p.nombre}</div>
                <div className="item-seleccionable-meta">{p.categoria || "Sin categoría"}</div>
              </div>
              <span className="item-seleccionable-precio">{formatearMoneda(p.precio_venta, p.moneda_base)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}