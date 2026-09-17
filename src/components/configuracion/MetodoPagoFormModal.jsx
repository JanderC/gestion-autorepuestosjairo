import { useState } from "react";
import { toast } from "react-toastify";
import { crearMetodoPago } from "../../api/metodosPago.api";

export default function MetodoPagoFormModal({ onGuardado, onCerrar }) {
  const [form, setForm] = useState({ nombre: "", es_credito: false });
  const [guardando, setGuardando] = useState(false);

  const manejarSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setGuardando(true);
    try {
      await crearMetodoPago(form);
      toast.success("Método de pago creado");
      onGuardado();
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo crear el método de pago");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-jairo modal-pequeño" onClick={(e) => e.stopPropagation()}>
        <h3>Nuevo método de pago</h3>
        <form onSubmit={manejarSubmit} className="formulario">
          <div className="formulario-campo">
            <label>Nombre *</label>
            <input value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Nequi, Zelle, Pago Móvil" required />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem" }}>
            <input type="checkbox" checked={form.es_credito} onChange={(e) => setForm((p) => ({ ...p, es_credito: e.target.checked }))} />
            Es un método de crédito (fiado)
          </label>
          <div className="modal-acciones">
            <button type="button" className="btn-secundario" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="btn-primario" disabled={guardando}>{guardando ? "Guardando..." : "Crear"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
