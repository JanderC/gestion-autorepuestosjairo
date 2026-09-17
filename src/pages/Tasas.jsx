import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaSync, FaPlus, FaUndo } from "react-icons/fa";
import { obtenerTasaActual, listarHistorialTasas, actualizarTasaAutomatica, actualizarBsCopManual, restablecerBsCop } from "../api/tasas.api";
import TasaManualModal from "../components/tasas/TasaManualModal";

const TABS = [
  { key: "actual", label: "Tasa actual" },
  { key: "historial", label: "Historial" },
];

export default function Tasas() {
  const [tasa, setTasa] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [tabActiva, setTabActiva] = useState("actual");
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [modalManual, setModalManual] = useState(false);
  const [bsCopInput, setBsCopInput] = useState("");

  const cargar = async () => {
    setCargando(true);
    try {
      const [tasaActual, historialData] = await Promise.all([obtenerTasaActual(), listarHistorialTasas()]);
      setTasa(tasaActual);
      setBsCopInput(tasaActual.bs_cop);
      setHistorial(historialData);
    } catch {
      toast.error("No se pudo cargar la tasa");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const actualizarAutomatica = async () => {
    setActualizando(true);
    try {
      await actualizarTasaAutomatica();
      toast.success("Tasa actualizada");
      cargar();
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo actualizar la tasa");
    } finally {
      setActualizando(false);
    }
  };

  const guardarBsCopManual = async () => {
    try {
      await actualizarBsCopManual(Number(bsCopInput));
      toast.success("Cruce BS/COP actualizado");
      cargar();
    } catch {
      toast.error("No se pudo actualizar el cruce");
    }
  };

  const restablecer = async () => {
    try {
      await restablecerBsCop();
      toast.success("Cruce BS/COP restablecido");
      cargar();
    } catch {
      toast.error("No se pudo restablecer el cruce");
    }
  };

  if (cargando) return <div className="estado-caja">Cargando tasas...</div>;

  return (
    <div className="pagina">
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titulo">Tasas de cambio</h1>
          <p className="pagina-subtitulo">Fuente: {tasa.fuente} · {new Date(tasa.fecha).toLocaleDateString()}</p>
        </div>
        <div className="pagina-acciones">
          <button className="btn-secundario" onClick={actualizarAutomatica} disabled={actualizando}>
            <FaSync /> {actualizando ? "Actualizando..." : "Actualizar automática"}
          </button>
          <button className="btn-primario" onClick={() => setModalManual(true)}>
            <FaPlus /> Registrar manual
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-card-bs">
          <div><span className="stat-valor">{Number(tasa.usd_bs).toFixed(4)}</span><span className="stat-label">USD / BS</span></div>
        </div>
        <div className="stat-card stat-card-cop">
          <div><span className="stat-valor">{Number(tasa.usd_cop).toFixed(2)}</span><span className="stat-label">USD / COP</span></div>
        </div>
        <div className="stat-card">
          <div>
            <span className="stat-valor">{Number(tasa.bs_cop).toFixed(4)}</span>
            <span className="stat-label">BS / COP {tasa.bs_cop_manual ? "(manual)" : "(automático)"}</span>
          </div>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`tab-btn ${tabActiva === t.key ? "activo" : ""}`} onClick={() => setTabActiva(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tabActiva === "actual" && (
        <div className="panel">
          <div className="panel-header"><span className="panel-titulo">Ajustar cruce BS/COP manualmente</span></div>
          <div className="formulario-fila" style={{ alignItems: "flex-end" }}>
            <div className="formulario-campo">
              <label>Valor BS/COP</label>
              <input type="number" step="0.0001" className="input-jairo" value={bsCopInput} onChange={(e) => setBsCopInput(e.target.value)} />
            </div>
            <button className="btn-secundario" onClick={guardarBsCopManual}>Guardar</button>
            {tasa.bs_cop_manual && (
              <button className="btn-secundario" onClick={restablecer}><FaUndo /> Restablecer automático</button>
            )}
          </div>
        </div>
      )}

      {tabActiva === "historial" && (
        <div className="tabla-datos-wrapper">
          <table className="tabla-datos">
            <thead>
              <tr><th>Fecha</th><th>USD/BS</th><th>USD/COP</th><th>BS/COP</th><th>Fuente</th></tr>
            </thead>
            <tbody>
              {historial.map((h) => (
                <tr key={h.id}>
                  <td>{new Date(h.fecha).toLocaleDateString()}</td>
                  <td>{Number(h.usd_bs).toFixed(4)}</td>
                  <td>{Number(h.usd_cop).toFixed(2)}</td>
                  <td>{Number(h.bs_cop).toFixed(4)}</td>
                  <td>{h.fuente}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalManual && (
        <TasaManualModal onGuardado={() => { setModalManual(false); cargar(); }} onCerrar={() => setModalManual(false)} />
      )}
    </div>
  );
}
