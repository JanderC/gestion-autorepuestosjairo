import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  obtenerResumen,
  obtenerProductosMasVendidos,
  obtenerVentasPorMetodoPago,
  obtenerVentasPorMoneda,
  obtenerVentasDiarias,
  obtenerMenorRotacion,
} from "../api/reportes.api";
import { formatearMoneda } from "../utils/formatoMoneda";

const MONEDAS = ["USD", "COP", "BS"];

function haceDias(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function Reportes() {
  const [desde, setDesde] = useState(haceDias(30));
  const [hasta, setHasta] = useState(hoyISO());
  const [resumen, setResumen] = useState(null);
  const [masVendidos, setMasVendidos] = useState([]);
  const [porMetodo, setPorMetodo] = useState([]);
  const [porMoneda, setPorMoneda] = useState([]);
  const [diarias, setDiarias] = useState([]);
  const [menorRotacion, setMenorRotacion] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    try {
      const params = { desde, hasta };
      const [r, mv, pm, pmo, vd, mr] = await Promise.all([
        obtenerResumen(params),
        obtenerProductosMasVendidos({ ...params, limite: 5 }),
        obtenerVentasPorMetodoPago(params),
        obtenerVentasPorMoneda(params),
        obtenerVentasDiarias(params),
        obtenerMenorRotacion({ limite: 5 }),
      ]);
      setResumen(r);
      setMasVendidos(mv);
      setPorMetodo(pm);
      setPorMoneda(pmo);
      setDiarias(vd.slice().reverse());
      setMenorRotacion(mr);
    } catch {
      toast.error("No se pudieron cargar los reportes");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Total vendido por moneda (usa lo que realmente se cobró, no una conversión a USD)
  const totalPorMoneda = (moneda) => {
    const item = porMoneda.find((p) => p.moneda === moneda);
    return item ? Number(item.total) : 0;
  };

  // Agrupa "ventas por método" (que viene una fila por método+moneda) en una tarjeta por método,
  // con los montos de cada moneda que ese método cobró
  const metodosAgrupados = useMemo(() => {
    const mapa = new Map();
    porMetodo.forEach((p) => {
      if (!mapa.has(p.metodo)) mapa.set(p.metodo, []);
      mapa.get(p.metodo).push({ moneda: p.moneda, total: Number(p.total) });
    });
    return Array.from(mapa.entries()).map(([metodo, montos]) => ({ metodo, montos }));
  }, [porMetodo]);

  if (cargando || !resumen) return <div className="estado-caja">Cargando reportes...</div>;

  return (
    <div className="pagina">
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titulo">Reportes</h1>
          <p className="pagina-subtitulo">Análisis de ventas e inventario</p>
        </div>
        <div className="filtro-fechas">
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          <span>a</span>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          <button className="btn-secundario" onClick={cargar}>Aplicar</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-card-destacada">
          <div><span className="stat-valor">{resumen.cantidad_ventas}</span><span className="stat-label">Cantidad de ventas</span></div>
        </div>
        {MONEDAS.map((m) => (
          <div key={m} className={`stat-card stat-card-${m.toLowerCase()}`}>
            <div>
              <span className="stat-valor">{formatearMoneda(totalPorMoneda(m), m)}</span>
              <span className="stat-label">Vendido en {m}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-header"><span className="panel-titulo">Ventas diarias (equivalente en USD)</span></div>
        <div className="grafico-contenedor">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={diarias}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--jairo-gris-borde)" />
              <XAxis dataKey="dia" tick={{ fill: "var(--jairo-texto-secundario)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--jairo-texto-secundario)", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "var(--jairo-negro-card)", border: "1px solid var(--jairo-gris-borde)" }} />
              <Line type="monotone" dataKey="total_usd" stroke="var(--jairo-rojo)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><span className="panel-titulo">Cobrado por método de pago</span></div>
        {metodosAgrupados.length === 0 && <div className="estado-vacio">Sin cobros en este rango de fechas</div>}
        <div className="grid-tarjetas">
          {metodosAgrupados.map(({ metodo, montos }) => (
            <div key={metodo} className="panel">
              <span className="panel-titulo">{metodo}</span>
              <div className="chip-selector mt-1">
                {montos.map((m) => (
                  <span key={m.moneda} className={`chip-moneda chip-${m.moneda.toLowerCase()}`}>
                    {formatearMoneda(m.total, m.moneda)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="split-layout">
        <div className="panel">
          <div className="panel-header"><span className="panel-titulo">Productos más vendidos</span></div>
          <div className="tabla-datos-wrapper">
            <table className="tabla-datos">
              <thead><tr><th>Producto</th><th>Unidades</th><th>Total</th></tr></thead>
              <tbody>
                {masVendidos.length === 0 && <tr><td colSpan={3}><div className="estado-vacio">Sin ventas en este rango</div></td></tr>}
                {masVendidos.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nombre}</td>
                    <td>{p.unidades_vendidas}</td>
                    <td>{formatearMoneda(p.total_usd, "USD")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><span className="panel-titulo">Menor rotación</span></div>
          <div className="tabla-datos-wrapper">
            <table className="tabla-datos">
              <thead><tr><th>Producto</th><th>Stock</th><th>Vendidos</th></tr></thead>
              <tbody>
                {menorRotacion.length === 0 && <tr><td colSpan={3}><div className="estado-vacio">Sin productos</div></td></tr>}
                {menorRotacion.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nombre}</td>
                    <td>{p.stock}</td>
                    <td>{p.unidades_vendidas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div><span className="stat-valor">{resumen.productos_stock_bajo}</span><span className="stat-label">Productos con stock bajo</span></div>
        </div>
      </div>
    </div>
  );
}