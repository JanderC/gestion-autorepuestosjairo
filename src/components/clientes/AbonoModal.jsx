import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { registrarAbono } from "../../api/clientes.api";
import { obtenerSesionAbierta } from "../../api/caja.api";

const MONEDAS = ["USD", "COP", "BS"];

export default function AbonoModal({ cliente, metodosPago, onGuardado, onCerrar }) {
  const [form, setForm] = useState({ monto: "", moneda: "USD", metodo_pago_id: "", referencia: "" });
  const [guardando, setGuardando] = useState(false);
  const [sesionCajaId, setSesionCajaId] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  // Consulta la sesión de caja recién al abrir el modal, para que nunca quede desactualizada
  useEffect(() => {
    (async () => {
      try {
        const sesion = await obtenerSesionAbierta();
        setSesionCajaId(sesion?.id || null);
      } catch {
        setSesionCajaId(null);
      } finally {
        setCargandoSesion(false);
      }
    })();
  }, []);

  const actualizar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const manejarSubmit = async (e) => {
    e.preventDefault();
    if (!form.monto) {
      toast.error("El monto es obligatorio");
      return;
    }
    setGuardando(true);
    try {
      await registrarAbono({
        cliente_id: cliente.id,
        moneda: form.moneda,
        monto: Number(form.monto),
        metodo_pago_id: form.metodo_pago_id ? Number(form.metodo_pago_id) : null,
        referencia: form.referencia || null,
        sesion_caja_id: sesionCajaId,
      });
      toast.success("Abono registrado");
      onGuardado();
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo registrar el abono");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-jairo modal-pequeño" onClick={(e) => e.stopPropagation()}>
        <h3>Registrar abono</h3>
        <p className="modal-subtitulo">{cliente.nombre}</p>
        {!cargandoSesion && !sesionCajaId && (
          <p className="pagina-subtitulo" style={{ color: "var(--jairo-advertencia)" }}>
            No hay caja abierta — este abono no va a sumar en el cuadre de ningún turno.
          </p>
        )}
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
            <label>Método de pago</label>
            <select value={form.metodo_pago_id} onChange={(e) => actualizar("metodo_pago_id", e.target.value)}>
              <option value="">Sin especificar</option>
              {metodosPago.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
          <div className="formulario-campo">
            <label>Referencia (opcional)</label>
            <input value={form.referencia} onChange={(e) => actualizar("referencia", e.target.value)} />
          </div>
          <div className="modal-acciones">
            <button type="button" className="btn-secundario" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="btn-primario" disabled={guardando || cargandoSesion}>
              {guardando ? "Guardando..." : "Registrar abono"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}