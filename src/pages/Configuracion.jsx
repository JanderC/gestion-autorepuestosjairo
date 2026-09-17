import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaPlus, FaTrash } from "react-icons/fa";
import { listarMetodosPago, desactivarMetodoPago } from "../api/metodosPago.api";
import MetodoPagoFormModal from "../components/configuracion/MetodoPagoFormModal";

export default function Configuracion() {
  const [metodosPago, setMetodosPago] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalNuevo, setModalNuevo] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      setMetodosPago(await listarMetodosPago());
    } catch {
      toast.error("No se pudieron cargar los métodos de pago");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const desactivar = async (metodo) => {
    if (!window.confirm(`¿Desactivar "${metodo.nombre}"?`)) return;
    try {
      await desactivarMetodoPago(metodo.id);
      toast.success("Método desactivado");
      cargar();
    } catch {
      toast.error("No se pudo desactivar el método");
    }
  };

  if (cargando) return <div className="estado-caja">Cargando configuración...</div>;

  return (
    <div className="pagina">
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titulo">Configuración</h1>
          <p className="pagina-subtitulo">Métodos de pago del negocio</p>
        </div>
        <button className="btn-primario" onClick={() => setModalNuevo(true)}>
          <FaPlus /> Nuevo método
        </button>
      </div>

      <div className="tabla-datos-wrapper">
        <table className="tabla-datos">
          <thead>
            <tr><th>Nombre</th><th>Tipo</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {metodosPago.length === 0 && <tr><td colSpan={3}><div className="estado-vacio">Sin métodos de pago</div></td></tr>}
            {metodosPago.map((m) => (
              <tr key={m.id}>
                <td>{m.nombre}</td>
                <td>{m.es_credito ? "Crédito" : "Directo"}</td>
                <td className="celda-acciones">
                  <button title="Desactivar" className="btn-peligro" onClick={() => desactivar(m)}>
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalNuevo && (
        <MetodoPagoFormModal onGuardado={() => { setModalNuevo(false); cargar(); }} onCerrar={() => setModalNuevo(false)} />
      )}
    </div>
  );
}
