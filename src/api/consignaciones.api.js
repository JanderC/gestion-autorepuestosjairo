import api from "./axios";

export const listarPendientesConsignacion = (clienteId) => api.get(`/consignaciones/cliente/${clienteId}/pendientes`).then((res) => res.data);
export const registrarMovimientoConsignacion = (data) => api.post("/consignaciones/movimiento", data).then((res) => res.data);
export const cerrarConsignacion = (data) => api.post("/consignaciones/cerrar", data).then((res) => res.data);
export const listarHistorialConsignacion = (clienteId) => api.get(`/consignaciones/cliente/${clienteId}/historial`).then((res) => res.data);