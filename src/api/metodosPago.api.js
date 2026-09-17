// src/api/metodosPago.api.js
import api from "./axios";

export const listarMetodosPago = () => api.get("/metodos-pago").then((res) => res.data);
export const crearMetodoPago = (data) => api.post("/metodos-pago", data).then((res) => res.data);
export const desactivarMetodoPago = (id) => api.patch(`/metodos-pago/${id}/desactivar`).then((res) => res.data);