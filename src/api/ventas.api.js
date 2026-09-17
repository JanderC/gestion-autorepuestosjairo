// src/api/ventas.api.js
import api from "./axios";

export const crearVenta = (data) => api.post("/ventas", data).then((res) => res.data);
export const listarVentas = (params) => api.get("/ventas", { params }).then((res) => res.data);
export const obtenerVentaPorId = (id) => api.get(`/ventas/${id}`).then((res) => res.data);