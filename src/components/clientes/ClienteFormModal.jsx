import { useState } from "react";
import { toast } from "react-toastify";
import { crearCliente } from "../../api/clientes.api";

export default function ClienteFormModal({ onGuardado, onCerrar }) {
  const [form, setForm] = useState({ nombre: "", telefono: "", identificacion: "", nota: "" });
  const [guardando, setGuardando] = useState(false);

  const actualizar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const manejarSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setGuardando(true);
    try {
      const clienteCreado = await crearCliente(form);
      toast.success("Cliente creado");
      onGuardado(clienteCreado);
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo crear el cliente");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-jairo modal-pequeño" onClick={(e) => e.stopPropagation()}>
        <h3>Nuevo cliente</h3>
        <form onSubmit={manejarSubmit} className="formulario">
          <div className="formulario-campo">
            <label>Nombre *</label>
            <input value={form.nombre} onChange={(e) => actualizar("nombre", e.target.value)} required autoFocus />
          </div>
          <div className="formulario-campo">
            <label>Teléfono (opcional)</label>
            <input value={form.telefono} onChange={(e) => actualizar("telefono", e.target.value)} />
          </div>
          <div className="formulario-campo">
            <label>Identificación (opcional)</label>
            <input value={form.identificacion} onChange={(e) => actualizar("identificacion", e.target.value)} />
          </div>
          <div className="formulario-campo">
            <label>Nota (opcional)</label>
            <textarea rows={2} value={form.nota} onChange={(e) => actualizar("nota", e.target.value)} />
          </div>
          <div className="modal-acciones">
            <button type="button" className="btn-secundario" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="btn-primario" disabled={guardando}>{guardando ? "Guardando..." : "Crear cliente"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}