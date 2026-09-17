import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { cerrarCaja, obtenerResumenSesion } from "../../api/caja.api";
import { formatearMoneda } from "../../utils/formatoMoneda";

const MONEDAS = ["USD", "COP", "BS"];

function redondear2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export default function CerrarCajaModal({ sesion, onGuardado, onCerrar }) {
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [conteo, setConteo] = useState({ USD: "", COP: "", BS: "" });
  const [notasCierre, setNotasCierre] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setResumen(await obtenerResumenSesion(sesion.id));
      } catch {
        toast.error("No se pudo cargar el resumen del turno");
      } finally {
        setCargando(false);
      }
    })();
  }, [sesion.id]);

  const desgloseDe = (moneda) => resumen?.desglose.find((d) => d.moneda === moneda);

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await cerrarCaja(sesion.id, {
        conteo_final_usd: Number(conteo.USD) || 0,
        conteo_final_cop: Number(conteo.COP) || 0,
        conteo_final_bs: Number(conteo.BS) || 0,
        notas_cierre: notasCierre || null,
      });
      toast.success("Caja cerrada");
      onGuardado();
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo cerrar la caja");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="modal-overlay" onClick={onCerrar}>
        <div className="modal-jairo modal-pequeño" onClick={(e) => e.stopPropagation()}>
          <div className="estado-caja">Calculando el cuadre del turno...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-jairo modal-grande" onClick={(e) => e.stopPropagation()}>
        <h3>Cerrar caja</h3>
        <p className="modal-subtitulo">
          Turno de {sesion.usuario_nombre} · {resumen?.cantidad_ventas || 0} venta{resumen?.cantidad_ventas !== 1 ? "s" : ""}
        </p>

        <div className="panel mt-1 mb-2">
          <span className="panel-titulo">Cómo cerrar bien</span>
          <ol className="lista-instructivo">
            <li>Contá el efectivo que tenés físicamente, separado por moneda.</li>
            <li>Escribí ese número real en cada campo — no copies el esperado.</li>
            <li>Mirá el mensaje que aparece debajo: te dice si cuadra, falta o sobra.</li>
            <li>Si hay diferencia, revisá si faltó cargar alguna venta, ingreso o egreso.</li>
            <li>Si la diferencia es real, explicá el motivo en las notas antes de confirmar.</li>
          </ol>
          <p className="pagina-subtitulo mt-1">
            Lo cobrado por transferencia, punto o Nequi no entra en el conteo físico: no está en el cajón.
            Lo fiado tampoco, porque todavía no se cobró.
          </p>
        </div>

        <form onSubmit={manejarSubmit} className="formulario">
          {MONEDAS.map((m) => {
            const d = desgloseDe(m);
            if (!d) return null;

            const sinMovimiento = d.esperado_efectivo === 0 && d.ventas_totales === 0 && d.fondo_inicial === 0;
            if (sinMovimiento) return null;

            const contado = conteo[m];
            const contadoNum = contado === "" ? null : Number(contado);
            const diferencia = contadoNum === null ? null : redondear2(contadoNum - d.esperado_efectivo);

            return (
              <div key={m} className="panel mb-1">
                <div className="panel-header">
                  <span className="panel-titulo">{m}</span>
                </div>

                <div className="saldo-linea"><span>Fondo inicial</span><span>{formatearMoneda(d.fondo_inicial, m)}</span></div>
                <div className="saldo-linea"><span>+ Ventas en efectivo</span><span>{formatearMoneda(d.ventas_efectivo, m)}</span></div>
                {d.ingresos > 0 && <div className="saldo-linea"><span>+ Ingresos manuales</span><span>{formatearMoneda(d.ingresos, m)}</span></div>}
                {d.abonos_efectivo > 0 && <div className="saldo-linea"><span>+ Abonos en efectivo</span><span>{formatearMoneda(d.abonos_efectivo, m)}</span></div>}
                {d.egresos > 0 && <div className="saldo-linea texto-peligro"><span>− Egresos</span><span>{formatearMoneda(d.egresos, m)}</span></div>}

                <div className="carrito-resumen-total">
                  <span>Esperado en efectivo</span>
                  <span>{formatearMoneda(d.esperado_efectivo, m)}</span>
                </div>

                {(d.ventas_otros_metodos > 0 || d.fiado_otorgado > 0) && (
                  <p className="pagina-subtitulo mt-1">
                    No entra al cuadre:
                    {d.ventas_otros_metodos > 0 && ` ${formatearMoneda(d.ventas_otros_metodos, m)} por otros métodos`}
                    {d.ventas_otros_metodos > 0 && d.fiado_otorgado > 0 && " ·"}
                    {d.fiado_otorgado > 0 && ` ${formatearMoneda(d.fiado_otorgado, m)} fiados`}
                  </p>
                )}

                <div className="formulario-campo">
                  <label>¿Cuánto tenés contado en {m}?</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={contado}
                    onChange={(e) => setConteo((prev) => ({ ...prev, [m]: e.target.value }))}
                  />
                </div>

                {diferencia !== null && Math.abs(diferencia) < 0.01 && (
                  <p className="carrito-resumen-linea ajuste-descuento">Cuadra perfecto ✓</p>
                )}
                {diferencia !== null && diferencia <= -0.01 && (
                  <p className="carrito-resumen-linea ajuste-recargo">Faltan {formatearMoneda(Math.abs(diferencia), m)}</p>
                )}
                {diferencia !== null && diferencia >= 0.01 && (
                  <p className="carrito-resumen-linea ajuste-recargo">Sobran {formatearMoneda(diferencia, m)}</p>
                )}
              </div>
            );
          })}

          <div className="formulario-campo">
            <label>Notas de cierre (explicá acá cualquier diferencia)</label>
            <textarea rows={2} value={notasCierre} onChange={(e) => setNotasCierre(e.target.value)} />
          </div>

          <div className="modal-acciones">
            <button type="button" className="btn-secundario" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="btn-primario" disabled={guardando}>
              {guardando ? "Cerrando..." : "Confirmar cierre"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}