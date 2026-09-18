import api from "./axios";

export const obtenerVentaDevolvible = (ventaId) => api.get(`/devoluciones/venta/${ventaId}`).then((res) => res.data);
export const crearDevolucion = (data) => api.post("/devoluciones", data).then((res) => res.data);
export const listarDevoluciones = () => api.get("/devoluciones").then((res) => res.data);
export const buscarVentasPorProducto = (q) => api.get("/devoluciones/buscar-por-producto", { params: { q } }).then((res) => res.data);