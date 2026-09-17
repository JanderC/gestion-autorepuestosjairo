import { useState } from "react";
import { toast } from "react-toastify";
import { abrirCaja } from "../../api/caja.api";

export default function AbrirCajaModal({ onGuardado, onCerrar }) {
  const [fondoInicial, setFondoInicial] = useState("");
  const [guardando, setGuardando] = useState(false);

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await abrirCaja({
        fondo_inicial_cop: Number(fondoInicial) || 0,
        fondo_inicial_usd: 0,
        fondo_inicial_bs: 0,
      });
      toast.success("Caja abierta");
      onGuardado();
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo abrir la caja");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-jairo modal-pequeño" onClick={(e) => e.stopPropagation()}>
        <h3>Abrir caja</h3>
        <p className="modal-subtitulo">La caja física maneja efectivo únicamente en pesos (COP)</p>
        <form onSubmit={manejarSubmit} className="formulario">
          <div className="formulario-campo">
            <label>Fondo inicial (COP)</label>
            <input type="number" step="0.01" value={fondoInicial} onChange={(e) => setFondoInicial(e.target.value)} autoFocus />
          </div>
          <div className="modal-acciones">
            <button type="button" className="btn-secundario" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="btn-primario" disabled={guardando}>{guardando ? "Abriendo..." : "Abrir caja"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}