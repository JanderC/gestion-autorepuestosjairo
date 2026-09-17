// src/api/caja.api.js
import api from "./axios";

export const obtenerSesionAbierta = () => api.get("/caja/abierta").then((res) => res.data);
export const abrirCaja = (data) => api.post("/caja/abrir", data).then((res) => res.data);
export const registrarMovimientoCaja = (data) => api.post("/caja/movimiento", data).then((res) => res.data);
export const obtenerResumenSesion = (id) => api.get(`/caja/${id}/resumen`).then((res) => res.data);
export const cerrarCaja = (id, data) => api.post(`/caja/${id}/cerrar`, data).then((res) => res.data);
export const listarHistorialCaja = () => api.get("/caja/historial").then((res) => res.data);
export const obtenerMovimientosDelDia = (id) => api.get(`/caja/${id}/movimientos-dia`).then((res) => res.data);