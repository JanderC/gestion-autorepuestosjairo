import api from "./axios";

export const listarFacturas = (params) => api.get("/facturas-proveedor", { params }).then((res) => res.data);
export const obtenerResumenFacturas = () => api.get("/facturas-proveedor/resumen").then((res) => res.data);
export const obtenerFacturaPorId = (id) => api.get(`/facturas-proveedor/${id}`).then((res) => res.data);
export const crearFactura = (data) => api.post("/facturas-proveedor", data).then((res) => res.data);
export const registrarPagoFactura = (data) => api.post("/facturas-proveedor/pago", data).then((res) => res.data);
export const anularFactura = (id) => api.patch(`/facturas-proveedor/${id}/anular`).then((res) => res.data);