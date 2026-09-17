import { formatearMoneda } from "../../utils/formatoMoneda";

export default function EstadoCuentaModal({ estadoCuenta, onAbonar, onCerrar }) {
  const { cliente, saldos_pendientes, movimientos } = estadoCuenta;

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-jairo modal-grande" onClick={(e) => e.stopPropagation()}>
        <h3>{cliente.nombre}</h3>
        <p className="modal-subtitulo">{cliente.telefono || "Sin teléfono"}</p>

        <div className="panel-header mt-1">
          <span className="panel-titulo">Saldo</span>
          <button className="btn-primario" onClick={onAbonar}>Registrar abono</button>
        </div>
        {saldos_pendientes.length === 0 && <div className="estado-vacio">Sin saldo pendiente ni a favor</div>}
        {saldos_pendientes.map((s) => {
          const saldo = Number(s.saldo_pendiente);
          const esFavor = saldo < 0;
          return (
            <div key={s.moneda} className={`saldo-linea ${esFavor ? "texto-exito" : ""}`}>
              <span>{s.moneda} {esFavor ? "— Saldo a favor" : "— Debe"}</span>
              <span>{formatearMoneda(Math.abs(saldo), s.moneda)}</span>
            </div>
          );
        })}

        <div className="panel-header mt-2">
          <span className="panel-titulo">Historial de movimientos</span>
        </div>
        <div className="tabla-datos-wrapper">
          <table className="tabla-datos">
            <thead>
              <tr><th>Tipo</th><th>Monto</th><th>Venta</th><th>Nota</th><th>Fecha</th></tr>
            </thead>
            <tbody>
              {movimientos.length === 0 && <tr><td colSpan={5}><div className="estado-vacio">Sin movimientos</div></td></tr>}
              {movimientos.map((m) => (
                <tr key={m.id}>
                  <td style={{ textTransform: "capitalize" }}>{m.tipo}</td>
                  <td>{formatearMoneda(m.monto, m.moneda)}</td>
                  <td>{m.numero_venta || "—"}</td>
                  <td>{m.referencia || "—"}</td>
                  <td>{new Date(m.fecha).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="modal-acciones">
          <button className="btn-secundario" onClick={onCerrar}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}