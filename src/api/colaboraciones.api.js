import api from "./axios";

export const listarColaboraciones = () => api.get("/colaboraciones").then((res) => res.data);
export const obtenerResumenColaboraciones = () => api.get("/colaboraciones/resumen").then((res) => res.data);
export const crearColaboracion = (data) => api.post("/colaboraciones", data).then((res) => res.data);
