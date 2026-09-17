import { useState } from "react";
import { toast } from "react-toastify";
import { crearFactura } from "../../api/facturasProveedor.api";

const MONEDAS = ["USD", "COP", "BS"];

export default function FacturaFormModal({ onGuardado, onCerrar }) {
  const [form, setForm] = useState({
    proveedor_nombre: "",
    numero_factura: "",
    descripcion: "",
    monto_original: "",
    moneda_original: "USD",
    fecha_emision: new Date().toISOString().slice(0, 10),
    fecha_vencimiento: "",
  });
  const [guardando, setGuardando] = useState(false);

  const actualizar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const manejarSubmit = async (e) => {
    e.preventDefault();
    if (!form.proveedor_nombre || !form.monto_original) {
      toast.error("Proveedor y monto son obligatorios");
      return;
    }

    setGuardando(true);
    try {
      await crearFactura({ ...form, monto_original: Number(form.monto_original), fecha_vencimiento: form.fecha_vencimiento || null });
      toast.success("Factura cargada");
      onGuardado();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al cargar la factura");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-jairo modal-grande" onClick={(e) => e.stopPropagation()}>
        <h3>Nueva factura de proveedor</h3>

        <form onSubmit={manejarSubmit} className="formulario">
          <div className="formulario-fila">
            <div className="formulario-campo">
              <label>Proveedor *</label>
              <input value={form.proveedor_nombre} onChange={(e) => actualizar("proveedor_nombre", e.target.value)} required />
            </div>
            <div className="formulario-campo">
              <label>N° de factura</label>
              <input value={form.numero_factura} onChange={(e) => actualizar("numero_factura", e.target.value)} />
            </div>
          </div>

          <div className="formulario-campo">
            <label>Descripción</label>
            <textarea rows={2} value={form.descripcion} onChange={(e) => actualizar("descripcion", e.target.value)} />
          </div>

          <div className="formulario-fila">
            <div className="formulario-campo">
              <label>Monto *</label>
              <input type="number" step="0.01" value={form.monto_original} onChange={(e) => actualizar("monto_original", e.target.value)} required />
            </div>
            <div className="formulario-campo">
              <label>Moneda *</label>
              <select value={form.moneda_original} onChange={(e) => actualizar("moneda_original", e.target.value)}>
                {MONEDAS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="formulario-fila">
            <div className="formulario-campo">
              <label>Fecha de emisión</label>
              <input type="date" value={form.fecha_emision} onChange={(e) => actualizar("fecha_emision", e.target.value)} />
            </div>
            <div className="formulario-campo">
              <label>Fecha de vencimiento</label>
              <input type="date" value={form.fecha_vencimiento} onChange={(e) => actualizar("fecha_vencimiento", e.target.value)} />
            </div>
          </div>

          <div className="modal-acciones">
            <button type="button" className="btn-secundario" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="btn-primario" disabled={guardando}>
              {guardando ? "Guardando..." : "Cargar factura"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}