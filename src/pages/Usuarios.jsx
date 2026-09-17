import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaPlus, FaEdit } from "react-icons/fa";
import { listarUsuarios, cambiarEstadoUsuario } from "../api/usuarios.api";
import UsuarioFormModal from "../components/usuarios/UsuarioFormModal";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalUsuario, setModalUsuario] = useState(null);

  const cargar = async () => {
    setCargando(true);
    try {
      setUsuarios(await listarUsuarios());
    } catch {
      toast.error("No se pudieron cargar los usuarios");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const alternarEstado = async (usuario) => {
    try {
      await cambiarEstadoUsuario(usuario.id, !usuario.activo);
      toast.success(usuario.activo ? "Usuario desactivado" : "Usuario activado");
      cargar();
    } catch {
      toast.error("No se pudo cambiar el estado");
    }
  };

  if (cargando) return <div className="estado-caja">Cargando usuarios...</div>;

  return (
    <div className="pagina">
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titulo">Usuarios</h1>
          <p className="pagina-subtitulo">Administradores y cajeros del sistema</p>
        </div>
        <button className="btn-primario" onClick={() => setModalUsuario("nuevo")}>
          <FaPlus /> Nuevo usuario
        </button>
      </div>

      <div className="tabla-datos-wrapper">
        <table className="tabla-datos">
          <thead>
            <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.nombre}</td>
                <td>{u.email}</td>
                <td style={{ textTransform: "capitalize" }}>{u.rol}</td>
                <td>
                  <button className={`toggle-activo ${u.activo ? "si" : "no"}`} onClick={() => alternarEstado(u)} style={{ border: "none", cursor: "pointer" }}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </button>
                </td>
                <td className="celda-acciones">
                  <button title="Editar" onClick={() => setModalUsuario(u)}><FaEdit /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalUsuario && (
        <UsuarioFormModal
          usuario={modalUsuario === "nuevo" ? null : modalUsuario}
          onGuardado={() => { setModalUsuario(null); cargar(); }}
          onCerrar={() => setModalUsuario(null)}
        />
      )}
    </div>
  );
}
