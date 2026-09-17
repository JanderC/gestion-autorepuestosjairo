import { useState } from "react";
import { toast } from "react-toastify";
import { cerrarConsignacion } from "../../api/consignaciones.api";
import { formatearMoneda } from "../../utils/formatoMoneda";

const MONEDAS = ["USD", "COP", "BS"];

export default function CerrarConsignacionModal({ cliente, pendientes, metodosPago, onGuardado, onCerrar }) {
  const [monedaCierre, setMonedaCierre] = useState("COP");
  const [descuento, setDescuento] = useState("10");
  const [pagaAhora, setPagaAhora] = useState(false);
  const [montoPagado, setMontoPagado] = useState("");
  const [metodoPagoId, setMetodoPagoId] = useState("");
  const [guardando, setGuardando] = useState(false);

  const manejarSubmit = async (e) => {
    e.preventDefault();
    if (pagaAhora && (!montoPagado || !metodoPagoId)) {
      toast.error("Indicá el monto y el método si va a pagar ahora");
      return;
    }
    setGuardando(true);
    try {
      const resultado = await cerrarConsignacion({
        cliente_id: cliente.id,
        moneda_cierre: monedaCierre,
        descuento_porcentaje: Number(descuento),
        monto_pagado: pagaAhora ? Number(montoPagado) : 0,
        metodo_pago_id: pagaAhora ? Number(metodoPagoId) : null,
      });
      toast.success(
        resultado.saldo_pendiente > 0.01
          ? `Cierre registrado — queda fiado ${formatearMoneda(resultado.saldo_pendiente, monedaCierre)}`
          : "Cierre registrado y pagado por completo"
      );
      onGuardado();
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo cerrar la cuenta");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-jairo modal-pequeño" onClick={(e) => e.stopPropagation()}>
        <h3>Cerrar semana — {cliente.nombre}</h3>
        <p className="modal-subtitulo">Se van a cerrar los {pendientes.length} movimiento(s) pendientes con el descuento indicado</p>

        <form onSubmit={manejarSubmit} className="formulario">
          <div className="formulario-fila">
            <div className="formulario-campo">
              <label>Moneda del cierre</label>
              <select value={monedaCierre} onChange={(e) => setMonedaCierre(e.target.value)}>
                {MONEDAS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="formulario-campo">
              <label>Descuento (%)</label>
              <input type="number" step="0.1" value={descuento} onChange={(e) => setDescuento(e.target.value)} />
            </div>
          </div>

          <p className="pagina-subtitulo mt-1">
            Todos los montos, sin importar en qué moneda se registraron durante la semana, se convierten a {monedaCierre} con la tasa vigente para calcular el total.
          </p>

          <label className="mt-2" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input type="checkbox" checked={pagaAhora} onChange={(e) => setPagaAhora(e.target.checked)} />
            Paga algo ahora mismo (el resto queda fiado)
          </label>

          {pagaAhora && (
            <div className="formulario-fila mt-1">
              <div className="formulario-campo">
                <label>Monto pagado ({monedaCierre})</label>
                <input type="number" step="0.01" value={montoPagado} onChange={(e) => setMontoPagado(e.target.value)} />
              </div>
              <div className="formulario-campo">
                <label>Método</label>
                <select value={metodoPagoId} onChange={(e) => setMetodoPagoId(e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {metodosPago.filter((m) => !m.es_credito).map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </div>
            </div>
          )}

          {!pagaAhora && (
            <p className="pagina-subtitulo mt-1 texto-peligro">
              Todo el total del cierre va a quedar como fiado del cliente.
            </p>
          )}

          <div className="modal-acciones">
            <button type="button" className="btn-secundario" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="btn-primario" disabled={guardando}>{guardando ? "Cerrando..." : "Confirmar cierre"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}