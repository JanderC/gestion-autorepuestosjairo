import { useState } from "react";
import { toast } from "react-toastify";
import { registrarPagoFactura } from "../../api/facturasProveedor.api";
import { formatearMoneda } from "../../utils/formatoMoneda";

const MONEDAS = ["USD", "COP", "BS"];

export default function PagoFacturaModal({ factura, metodosPago, onGuardado, onCerrar }) {
  const [form, setForm] = useState({ monto: "", moneda: factura.moneda_original, metodo_pago_id: "", referencia: "" });
  const [guardando, setGuardando] = useState(false);

  const actualizar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const manejarSubmit = async (e) => {
    e.preventDefault();
    if (!form.monto || !form.metodo_pago_id) {
      toast.error("Monto y método de pago son obligatorios");
      return;
    }

    setGuardando(true);
    try {
      await registrarPagoFactura({
        factura_id: factura.id,
        monto: Number(form.monto),
        moneda: form.moneda,
        metodo_pago_id: Number(form.metodo_pago_id),
        referencia: form.referencia || null,
      });
      toast.success("Pago registrado");
      onGuardado();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al registrar el pago");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-jairo modal-pequeño" onClick={(e) => e.stopPropagation()}>
        <h3>Registrar pago</h3>
        <p className="modal-subtitulo">
          {factura.proveedor_nombre} — saldo pendiente: {formatearMoneda(factura.saldo_pendiente_original, factura.moneda_original)}
        </p>

        <form onSubmit={manejarSubmit} className="formulario">
          <div className="formulario-fila">
            <div className="formulario-campo">
              <label>Monto *</label>
              <input type="number" step="0.01" value={form.monto} onChange={(e) => actualizar("monto", e.target.value)} required />
            </div>
            <div className="formulario-campo">
              <label>Moneda</label>
              <select value={form.moneda} onChange={(e) => actualizar("moneda", e.target.value)}>
                {MONEDAS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="formulario-campo">
            <label>Método de pago *</label>
            <select value={form.metodo_pago_id} onChange={(e) => actualizar("metodo_pago_id", e.target.value)} required>
              <option value="">Seleccionar...</option>
              {metodosPago.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>

          <div className="formulario-campo">
            <label>Referencia (opcional)</label>
            <input value={form.referencia} onChange={(e) => actualizar("referencia", e.target.value)} />
          </div>

          <div className="modal-acciones">
            <button type="button" className="btn-secundario" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="btn-primario" disabled={guardando}>
              {guardando ? "Guardando..." : "Registrar pago"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}