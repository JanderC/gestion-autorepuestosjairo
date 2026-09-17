// src/api/tasas.api.js
import api from "./axios";

export const obtenerTasaActual = () => api.get("/tasas/actual").then((res) => res.data);
export const listarHistorialTasas = () => api.get("/tasas/historial").then((res) => res.data);
export const registrarTasaManual = (data) => api.post("/tasas/manual", data).then((res) => res.data);
export const actualizarTasaAutomatica = () => api.post("/tasas/actualizar").then((res) => res.data);
export const actualizarBsCopManual = (bs_cop) => api.patch("/tasas/actual/bs-cop", { bs_cop }).then((res) => res.data);
export const restablecerBsCop = () => api.patch("/tasas/actual/bs-cop/restablecer").then((res) => res.data);