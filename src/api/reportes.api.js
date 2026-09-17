import api from "./axios";

export const obtenerResumen = (params) => api.get("/reportes/resumen", { params }).then((res) => res.data);
export const obtenerProductosMasVendidos = (params) => api.get("/reportes/productos-mas-vendidos", { params }).then((res) => res.data);
export const obtenerVentasPorMetodoPago = (params) => api.get("/reportes/ventas-por-metodo-pago", { params }).then((res) => res.data);
export const obtenerVentasPorMoneda = (params) => api.get("/reportes/ventas-por-moneda", { params }).then((res) => res.data);
export const obtenerVentasDiarias = (params) => api.get("/reportes/ventas-diarias", { params }).then((res) => res.data);
export const obtenerMenorRotacion = (params) => api.get("/reportes/menor-rotacion", { params }).then((res) => res.data);
