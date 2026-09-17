import { useState } from "react";
import { toast } from "react-toastify";
import { registrarTasaManual } from "../../api/tasas.api";

export default function TasaManualModal({ onGuardado, onCerrar }) {
  const [bsCop, setBsCop] = useState("");
  const [mostrarAvanzado, setMostrarAvanzado] = useState(false);
  const [usdBs, setUsdBs] = useState("");
  const [usdCop, setUsdCop] = useState("");
  const [guardando, setGuardando] = useState(false);

  const manejarSubmit = async (e) => {
    e.preventDefault();
    if (!bsCop) {
      toast.error("Indicá el cruce peso-bolívar");
      return;
    }

    setGuardando(true);
    try {
      await registrarTasaManual({
        usd_bs: usdBs || undefined,
        usd_cop: usdCop || undefined,
        bs_cop: bsCop,
      });
      toast.success("Tasa actualizada");
      onGuardado();
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo registrar la tasa");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-jairo modal-pequeño" onClick={(e) => e.stopPropagation()}>
        <h3>Actualizar tasa</h3>
        <p className="modal-subtitulo">
          Indicá cuántos pesos (COP) equivalen a 1 bolívar (BS). Ej: si 1.000 BS = 3.000 COP, poné 3.
        </p>

        <form onSubmit={manejarSubmit} className="formulario">
          <div className="formulario-campo">
            <label>1 BS = ¿cuántos COP? *</label>
            <input
              type="number"
              step="0.0001"
              placeholder="Ej: 3"
              value={bsCop}
              onChange={(e) => setBsCop(e.target.value)}
              autoFocus
            />
          </div>

          <button
            type="button"
            className="btn-secundario mt-1"
            onClick={() => setMostrarAvanzado((v) => !v)}
          >
            {mostrarAvanzado ? "Ocultar" : "Mostrar"} tasas en dólares (opcional)
          </button>

          {mostrarAvanzado && (
            <>
              <div className="formulario-campo">
                <label>USD / BS</label>
                <input type="number" step="0.0001" value={usdBs} onChange={(e) => setUsdBs(e.target.value)} placeholder="Vacío = mantiene el actual" />
              </div>
              <div className="formulario-campo">
                <label>USD / COP</label>
                <input type="number" step="0.0001" value={usdCop} onChange={(e) => setUsdCop(e.target.value)} placeholder="Vacío = mantiene el actual" />
              </div>
              <p className="pagina-subtitulo">
                Son solo de referencia — el precio de tus productos en pesos y bolívares se calcula
                directo con el cruce de arriba, no depende de estos dos valores.
              </p>
            </>
          )}

          <div className="modal-acciones">
            <button type="button" className="btn-secundario" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="btn-primario" disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}