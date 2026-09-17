import api from "./axios";

export const listarClientes = () => api.get("/clientes").then((res) => res.data);
export const buscarClientes = (q) => api.get("/clientes/buscar", { params: { q } }).then((res) => res.data);
export const crearCliente = (data) => api.post("/clientes", data).then((res) => res.data);
export const obtenerEstadoCuenta = (id) => api.get(`/clientes/${id}/estado-cuenta`).then((res) => res.data);
export const registrarAbono = (data) => api.post("/clientes/abono", data).then((res) => res.data);
export const listarFiadosPendientes = () => api.get("/clientes/fiados/pendientes").then((res) => res.data);
export const obtenerResumenFiados = () => api.get("/clientes/fiados/resumen").then((res) => res.data);