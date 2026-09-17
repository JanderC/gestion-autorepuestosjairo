import { useState } from "react";
import { toast } from "react-toastify";
import { abrirCaja } from "../../api/caja.api";

export default function AbrirCajaModal({ onGuardado, onCerrar }) {
  const [form, setForm] = useState({ fondo_inicial_usd: "", fondo_inicial_cop: "", fondo_inicial_bs: "" });
  const [guardando, setGuardando] = useState(false);

  const actualizar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await abrirCaja({
        fondo_inicial_usd: Number(form.fondo_inicial_usd) || 0,
        fondo_inicial_cop: Number(form.fondo_inicial_cop) || 0,
        fondo_inicial_bs: Number(form.fondo_inicial_bs) || 0,
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
        <p className="modal-subtitulo">Indicá el fondo inicial en cada moneda (podés dejar en 0 las que no uses)</p>
        <form onSubmit={manejarSubmit} className="formulario">
          <div className="formulario-campo">
            <label>Fondo inicial USD</label>
            <input type="number" step="0.01" value={form.fondo_inicial_usd} onChange={(e) => actualizar("fondo_inicial_usd", e.target.value)} />
          </div>
          <div className="formulario-campo">
            <label>Fondo inicial COP</label>
            <input type="number" step="0.01" value={form.fondo_inicial_cop} onChange={(e) => actualizar("fondo_inicial_cop", e.target.value)} />
          </div>
          <div className="formulario-campo">
            <label>Fondo inicial BS</label>
            <input type="number" step="0.01" value={form.fondo_inicial_bs} onChange={(e) => actualizar("fondo_inicial_bs", e.target.value)} />
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
