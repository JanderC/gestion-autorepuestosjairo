import { useState, useMemo, useEffect } from "react";
import { toast } from "react-toastify";
import { crearColaboracion } from "../../api/colaboraciones.api";
import { obtenerTasaActual } from "../../api/tasas.api";
import { convertirEntreMonedas } from "../../utils/monedaHelpers";
import { formatearMoneda } from "../../utils/formatoMoneda";

const MONEDAS = ["USD", "COP", "BS"];

export default function ColaboracionFormModal({ productos, onGuardado, onCerrar }) {
  const [form, setForm] = useState({ producto_id: "", cantidad: "", moneda: "USD", receptor: "", motivo: "" });
  const [tasa, setTasa] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    obtenerTasaActual().then(setTasa).catch(() => setTasa(null));
  }, []);

  const actualizar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const productoSeleccionado = useMemo(
    () => productos.find((p) => p.id === Number(form.producto_id)),
    [productos, form.producto_id]
  );

  // Costo del producto convertido a las 3 monedas, con la tasa vigente, para que el admin
  // vea de una vez cuánto representa la colaboración en cada una antes de elegir con cuál queda registrada.
  const costosPorMoneda = useMemo(() => {
    if (!productoSeleccionado || !tasa) return null;
    const cantidad = Number(form.cantidad) || 1;
    const resultado = {};
    MONEDAS.forEach((m) => {
      const unitario = convertirEntreMonedas(productoSeleccionado.precio_compra, productoSeleccionado.moneda_base, m, tasa);
      resultado[m] = unitario * cantidad;
    });
    return resultado;
  }, [productoSeleccionado, tasa, form.cantidad]);

  const manejarSubmit = async (e) => {
    e.preventDefault();
    if (!form.producto_id || !form.cantidad) {
      toast.error("Producto y cantidad son obligatorios");
      return;
    }
    setGuardando(true);
    try {
      await crearColaboracion({
        producto_id: Number(form.producto_id),
        cantidad: Number(form.cantidad),
        moneda: form.moneda,
        receptor: form.receptor || null,
        motivo: form.motivo || null,
      });
      toast.success("Colaboración registrada");
      onGuardado();
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo registrar la colaboración");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-jairo modal-pequeño" onClick={(e) => e.stopPropagation()}>
        <h3>Nueva colaboración</h3>
        <form onSubmit={manejarSubmit} className="formulario">
          <div className="formulario-campo">
            <label>Producto *</label>
            <select value={form.producto_id} onChange={(e) => actualizar("producto_id", e.target.value)} required>
              <option value="">Seleccionar...</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre} (stock: {p.stock})</option>
              ))}
            </select>
          </div>

          <div className="formulario-campo">
            <label>Cantidad *</label>
            <input
              type="number"
              min="1"
              max={productoSeleccionado?.stock || undefined}
              value={form.cantidad}
              onChange={(e) => actualizar("cantidad", e.target.value)}
              required
            />
          </div>

          {costosPorMoneda && (
            <div className="formulario-campo">
              <label>Costo de esta colaboración</label>
              <div className="chip-selector">
                {MONEDAS.map((m) => (
                  <span key={m} className={`chip-moneda chip-${m.toLowerCase()}`}>
                    {formatearMoneda(costosPorMoneda[m], m)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="formulario-campo">
            <label>¿En qué moneda registrar el costo? *</label>
            <div className="selector-pill">
              {MONEDAS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={form.moneda === m ? "activo" : ""}
                  onClick={() => actualizar("moneda", m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="formulario-campo">
            <label>Receptor (opcional)</label>
            <input value={form.receptor} onChange={(e) => actualizar("receptor", e.target.value)} />
          </div>
          <div className="formulario-campo">
            <label>Motivo (opcional)</label>
            <textarea rows={2} value={form.motivo} onChange={(e) => actualizar("motivo", e.target.value)} />
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