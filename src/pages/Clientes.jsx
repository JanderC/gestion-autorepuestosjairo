import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaSearch, FaPlus, FaFileInvoice, FaExchangeAlt } from "react-icons/fa";
import { listarClientes, buscarClientes, obtenerEstadoCuenta } from "../api/clientes.api";
import { listarMetodosPago } from "../api/metodosPago.api";
import ClienteFormModal from "../components/clientes/ClienteFormModal";
import AbonoModal from "../components/clientes/AbonoModal";
import EstadoCuentaModal from "../components/clientes/EstadoCuentaModal";
import CuentaCorrienteModal from "../components/clientes/CuentaCorrienteModal";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  const [modalNuevo, setModalNuevo] = useState(false);
  const [estadoCuenta, setEstadoCuenta] = useState(null);
  const [modalAbono, setModalAbono] = useState(null);
  const [clienteCuentaCorriente, setClienteCuentaCorriente] = useState(null);

  const cargarClientes = async () => {
    setCargando(true);
    try {
      const [lista, metodos] = await Promise.all([listarClientes(), listarMetodosPago()]);
      setClientes(lista);
      setMetodosPago(metodos);
    } catch {
      toast.error("No se pudieron cargar los clientes");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const buscar = async (q) => {
    setBusqueda(q);
    if (q.trim().length < 2) {
      cargarClientes();
      return;
    }
    try {
      setClientes(await buscarClientes(q));
    } catch {
      // sin resultados
    }
  };

  const verEstadoCuenta = async (cliente) => {
    try {
      setEstadoCuenta(await obtenerEstadoCuenta(cliente.id));
    } catch {
      toast.error("No se pudo cargar el estado de cuenta");
    }
  };

  if (cargando) return <div className="estado-caja">Cargando clientes...</div>;

  return (
    <div className="pagina">
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titulo">Clientes</h1>
          <p className="pagina-subtitulo">Gestión de clientes y cuentas por cobrar</p>
        </div>
        <button className="btn-primario" onClick={() => setModalNuevo(true)}>
          <FaPlus /> Nuevo cliente
        </button>
      </div>

      <div className="buscador">
        <FaSearch />
        <input placeholder="Buscar por nombre o teléfono..." value={busqueda} onChange={(e) => buscar(e.target.value)} />
      </div>

      <div className="tabla-datos-wrapper">
        <table className="tabla-datos">
          <thead>
            <tr><th>Nombre</th><th>Teléfono</th><th>Identificación</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {clientes.length === 0 && <tr><td colSpan={4}><div className="estado-vacio">Sin clientes</div></td></tr>}
            {clientes.map((c) => (
              <tr key={c.id}>
                <td>{c.nombre}</td>
                <td>{c.telefono || "—"}</td>
                <td>{c.identificacion || "—"}</td>
                <td className="celda-acciones">
                  <button title="Ver estado de cuenta" onClick={() => verEstadoCuenta(c)}>
                    <FaFileInvoice />
                  </button>
                  <button title="Cuenta corriente / consignación" onClick={() => setClienteCuentaCorriente(c)}>
                    <FaExchangeAlt />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalNuevo && (
        <ClienteFormModal onGuardado={() => { setModalNuevo(false); cargarClientes(); }} onCerrar={() => setModalNuevo(false)} />
      )}

      {estadoCuenta && !modalAbono && (
        <EstadoCuentaModal
          estadoCuenta={estadoCuenta}
          onAbonar={() => setModalAbono(estadoCuenta.cliente)}
          onCerrar={() => setEstadoCuenta(null)}
        />
      )}

      {modalAbono && (
        <AbonoModal
          cliente={modalAbono}
          metodosPago={metodosPago}
          onGuardado={async () => {
            setEstadoCuenta(await obtenerEstadoCuenta(modalAbono.id));
            setModalAbono(null);
          }}
          onCerrar={() => setModalAbono(null)}
        />
      )}

      {clienteCuentaCorriente && (
        <CuentaCorrienteModal cliente={clienteCuentaCorriente} onCerrar={() => setClienteCuentaCorriente(null)} />
      )}
    </div>
  );
}