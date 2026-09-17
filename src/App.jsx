import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/layout/Layout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PuntoDeVenta from "./pages/PuntoDeVenta";
import Productos from "./pages/Productos";
import Inventario from "./pages/Inventario";
import Caja from "./pages/Caja";
import Clientes from "./pages/Clientes";
import Reportes from "./pages/Reportes";
import Tasas from "./pages/Tasas";
import Facturas from "./pages/Facturas";
import Usuarios from "./pages/Usuarios";
import Colaboraciones from "./pages/Colaboraciones";
import Configuracion from "./pages/Configuracion";
import Fiados from "./pages/Fiados";

// Protege una ruta: exige sesión y, opcionalmente, uno o varios roles permitidos
function RutaProtegida({ children, rolesPermitidos }) {
  const { estaAutenticado, rol, cargando } = useAuth();

  if (cargando) return null; // o un spinner global

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  const { estaAutenticado } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={estaAutenticado ? <Navigate to="/" replace /> : <Login />}
      />

      <Route
        path="/"
        element={
          <RutaProtegida>
            <Layout />
          </RutaProtegida>
        }
      >
        {/* Rutas para admin y cajero */}
        <Route index element={<Dashboard />} />
        <Route path="ventas" element={<PuntoDeVenta />} />
        <Route path="caja" element={<Caja />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="productos" element={<Productos />} />

        {/* Rutas exclusivas admin */}
        <Route
          path="inventario"
          element={
            <RutaProtegida rolesPermitidos={["admin"]}>
              <Inventario />
            </RutaProtegida>
          }
        />
        <Route
          path="reportes"
          element={
            <RutaProtegida rolesPermitidos={["admin"]}>
              <Reportes />
            </RutaProtegida>
          }
        />
        <Route
          path="tasas"
          element={
            <RutaProtegida rolesPermitidos={["admin"]}>
              <Tasas />
            </RutaProtegida>
          }
        />
        <Route
          path="facturas"
          element={
            <RutaProtegida rolesPermitidos={["admin"]}>
              <Facturas />
            </RutaProtegida>
          }
        />
        <Route
          path="usuarios"
          element={
            <RutaProtegida rolesPermitidos={["admin"]}>
              <Usuarios />
            </RutaProtegida>
          }
        />
        <Route
          path="colaboraciones"
          element={
            <RutaProtegida rolesPermitidos={["admin"]}>
              <Colaboraciones />
            </RutaProtegida>
          }
        />
        <Route
          path="configuracion"
          element={
            <RutaProtegida rolesPermitidos={["admin"]}>
              <Configuracion />
            </RutaProtegida>
          }
        />
        <Route path="fiados" element={
          <RutaProtegida rolesPermitidos={["admin"]}>
            <Fiados />
          </RutaProtegida>
        } />
      </Route>

      {/* Cualquier ruta no encontrada */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      </AuthProvider>
    </BrowserRouter>
  );
}