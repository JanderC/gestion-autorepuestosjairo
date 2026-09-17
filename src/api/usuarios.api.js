import api from "./axios";

export const listarUsuarios = () => api.get("/usuarios").then((res) => res.data);
export const crearUsuario = (data) => api.post("/usuarios", data).then((res) => res.data);
export const editarUsuario = (id, data) => api.put(`/usuarios/${id}`, data).then((res) => res.data);
export const cambiarEstadoUsuario = (id, activo) => api.patch(`/usuarios/${id}/estado`, { activo }).then((res) => res.data);
