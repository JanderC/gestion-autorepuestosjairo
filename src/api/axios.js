import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://autorepuestosjairo-production.up.railway.app/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Adjunta el token JWT en cada petición si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Maneja 401 (token vencido/inválido) y 403 (sin permiso por rol)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    if (status === 403) {
      // El componente que hizo la llamada puede mostrar un toast con el mensaje del backend
      console.warn("Acceso denegado:", error.response?.data?.mensaje);
    }

    return Promise.reject(error);
  }
);

export default api;