import { useState } from "react";
import { toast } from "react-toastify";
import { registrarMovimientoCaja } from "../../api/caja.api";

const MONEDAS = ["USD", "COP", "BS"];

export default function MovimientoCajaModal({ sesionCajaId, tipo, onGuardado, onCerrar }) {
  const [form, setForm] = useState({ concepto: "", moneda: "USD", monto: "" });
  const [guardando, setGuardando] = useState(false);

  const actualizar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const manejarSubmit = async (e) => {
    e.preventDefault();
    if (!form.concepto || !form.monto) {
      toast.error("Concepto y monto son obligatorios");
      return;
    }
    setGuardando(true);
    try {
      await registrarMovimientoCaja({
        sesion_caja_id: sesionCajaId,
        tipo,
        concepto: form.concepto,
        moneda: form.moneda,
        monto: Number(form.monto),
      });
      toast.success(tipo === "ingreso" ? "Ingreso registrado" : "Egreso registrado");
      onGuardado();
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo registrar el movimiento");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-jairo modal-pequeño" onClick={(e) => e.stopPropagation()}>
        <h3>{tipo === "ingreso" ? "Registrar ingreso" : "Registrar egreso"}</h3>
        <form onSubmit={manejarSubmit} className="formulario">
          <div className="formulario-campo">
            <label>Concepto *</label>
            <input value={form.concepto} onChange={(e) => actualizar("concepto", e.target.value)} required />
          </div>
          <div className="formulario-fila">
            <div className="formulario-campo">
              <label>Moneda</label>
              <select value={form.moneda} onChange={(e) => actualizar("moneda", e.target.value)}>
                {MONEDAS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="formulario-campo">
              <label>Monto *</label>
              <input type="number" step="0.01" value={form.monto} onChange={(e) => actualizar("monto", e.target.value)} required />
            </div>
          </div>
          <div className="modal-acciones">
            <button type="button" className="btn-secundario" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="btn-primario" disabled={guardando}>{guardando ? "Guardando..." : "Registrar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
