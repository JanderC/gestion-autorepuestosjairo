import { useState } from "react";
import { toast } from "react-toastify";
import { crearUsuario, editarUsuario } from "../../api/usuarios.api";

export default function UsuarioFormModal({ usuario, onGuardado, onCerrar }) {
  const esEdicion = !!usuario;
  const [form, setForm] = useState({
    nombre: usuario?.nombre || "",
    email: usuario?.email || "",
    contraseña: "",
    rol: usuario?.rol || "cajero",
  });
  const [guardando, setGuardando] = useState(false);

  const actualizar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const manejarSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.email || (!esEdicion && !form.contraseña)) {
      toast.error("Completá todos los campos obligatorios");
      return;
    }
    setGuardando(true);
    try {
      if (esEdicion) {
        await editarUsuario(usuario.id, { ...form, contraseña: form.contraseña || undefined });
        toast.success("Usuario actualizado");
      } else {
        await crearUsuario(form);
        toast.success("Usuario creado");
      }
      onGuardado();
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo guardar el usuario");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-jairo modal-pequeño" onClick={(e) => e.stopPropagation()}>
        <h3>{esEdicion ? "Editar usuario" : "Nuevo usuario"}</h3>
        <form onSubmit={manejarSubmit} className="formulario">
          <div className="formulario-campo">
            <label>Nombre *</label>
            <input value={form.nombre} onChange={(e) => actualizar("nombre", e.target.value)} required />
          </div>
          <div className="formulario-campo">
            <label>Email *</label>
            <input type="email" value={form.email} onChange={(e) => actualizar("email", e.target.value)} required />
          </div>
          <div className="formulario-campo">
            <label>{esEdicion ? "Nueva contraseña (opcional)" : "Contraseña *"}</label>
            <input type="password" value={form.contraseña} onChange={(e) => actualizar("contraseña", e.target.value)} required={!esEdicion} />
          </div>
          <div className="formulario-campo">
            <label>Rol *</label>
            <select value={form.rol} onChange={(e) => actualizar("rol", e.target.value)}>
              <option value="cajero">Cajero</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="modal-acciones">
            <button type="button" className="btn-secundario" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="btn-primario" disabled={guardando}>{guardando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear usuario"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
