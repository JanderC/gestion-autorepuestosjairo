import api from "./axios";

export const obtenerProductos = () =>
  api.get("/productos").then((res) => res.data);

export const obtenerCategorias = () =>
  api.get("/productos/categorias").then((res) => res.data);

export const obtenerProductoPorCodigo = (codigo) =>
  api.get(`/productos/codigo/${codigo}`).then((res) => res.data);

export const crearProducto = (data) =>
  api.post("/productos", data).then((res) => res.data);

export const editarProducto = (id, data) =>
  api.put(`/productos/${id}`, data).then((res) => res.data);

export const desactivarProducto = (id) =>
  api.patch(`/productos/${id}/desactivar`).then((res) => res.data);

export const ajustarStock = (id, cantidad) =>
  api.patch(`/productos/${id}/stock`, { cantidad }).then((res) => res.data);

export const subirImagenProducto = (formData) =>
  api
    .post("/productos/subir-imagen", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);