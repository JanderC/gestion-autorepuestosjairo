import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { FaUsers, FaEye } from "react-icons/fa";
import { listarFiadosPendientes, obtenerResumenFiados, obtenerEstadoCuenta } from "../api/clientes.api";
import { listarMetodosPago } from "../api/metodosPago.api";
import { formatearMoneda } from "../utils/formatoMoneda";
import EstadoCuentaModal from "../components/clientes/EstadoCuentaModal";
import AbonoModal from "../components/clientes/AbonoModal";

export default function Fiados() {
  const [fiados, setFiados] = useState([]);
  const [resumen, setResumen] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [estadoCuenta, setEstadoCuenta] = useState(null);
  const [modalAbono, setModalAbono] = useState(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const [listaFiados, resumenData, metodos] = await Promise.all([
        listarFiadosPendientes(),
        obtenerResumenFiados(),
        listarMetodosPago(),
      ]);
      setFiados(listaFiados);
      setResumen(resumenData);
      setMetodosPago(metodos);
    } catch {
      toast.error("No se pudieron cargar los fiados");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const clientesAgrupados = useMemo(() => {
    const mapa = new Map();
    fiados.forEach((f) => {
      if (!mapa.has(f.cliente_id)) {
        mapa.set(f.cliente_id, { cliente_id: f.cliente_id, nombre: f.nombre, telefono: f.telefono, saldos: [] });
      }
      mapa.get(f.cliente_id).saldos.push({ moneda: f.moneda, saldo_pendiente: f.saldo_pendiente });
    });
    return Array.from(mapa.values());
  }, [fiados]);

  const verEstadoCuenta = async (clienteId) => {
    try {
      setEstadoCuenta(await obtenerEstadoCuenta(clienteId));
    } catch {
      toast.error("No se pudo cargar el estado de cuenta");
    }
  };

  if (cargando) return <div className="estado-caja">Cargando fiados...</div>;

  return (
    <div className="pagina">
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titulo">Fiados</h1>
          <p className="pagina-subtitulo">Cuentas por cobrar a clientes</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-card-destacada">
          <FaUsers className="stat-icono" />
          <div>
            <span className="stat-valor">{clientesAgrupados.length}</span>
            <span className="stat-label">Clientes con deuda</span>
          </div>
        </div>
        {["USD", "COP", "BS"].map((moneda) => {
          const item = resumen.find((r) => r.moneda === moneda);
          return (
            <div key={moneda} className={`stat-card stat-card-${moneda.toLowerCase()}`}>
              <div>
                <span className="stat-valor">{formatearMoneda(item?.total_pendiente || 0, moneda)}</span>
                <span className="stat-label">Pendiente en {moneda}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="tabla-datos-wrapper">
        <table className="tabla-datos">
          <thead>
            <tr><th>Cliente</th><th>Teléfono</th><th>Saldo pendiente</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {clientesAgrupados.length === 0 && (
              <tr><td colSpan={4}><div className="estado-vacio">No hay clientes con saldo pendiente</div></td></tr>
            )}
            {clientesAgrupados.map((c) => (
              <tr key={c.cliente_id}>
                <td>{c.nombre}</td>
                <td>{c.telefono || "—"}</td>
                <td>
                  <div className="chip-selector">
                    {c.saldos.map((s) => (
                      <span key={s.moneda} className={`chip-moneda chip-${s.moneda.toLowerCase()}`}>
                        {formatearMoneda(s.saldo_pendiente, s.moneda)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="celda-acciones">
                  <button title="Ver detalle" onClick={() => verEstadoCuenta(c.cliente_id)}>
                    <FaEye />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {estadoCuenta && !modalAbono && (
        <EstadoCuentaModal
          estadoCuenta={estadoCuenta}
          onAbonar={() => setModalAbono(estadoCuenta.cliente)}
          onCerrar={() => setEstadoCuenta(null)}
        />
      )}

      {modalAbono && (
        <AbonoModal
          cliente={modalAbono}
          metodosPago={metodosPago}
          onGuardado={() => {
            setModalAbono(null);
            setEstadoCuenta(null);
            cargar();
          }}
          onCerrar={() => setModalAbono(null)}
        />
      )}
    </div>
  );
}