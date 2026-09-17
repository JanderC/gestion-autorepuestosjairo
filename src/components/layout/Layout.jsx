import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import "./Layout.css";

export default function Layout() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false); // control móvil
  const [sidebarColapsado, setSidebarColapsado] = useState(false); // control desktop

  return (
    <div className="layout-jairo">
      <Sidebar
        abierto={sidebarAbierto}
        colapsado={sidebarColapsado}
        onCerrar={() => setSidebarAbierto(false)}
      />

      <div className="layout-contenido">
        <Navbar
          onAbrirSidebar={() => setSidebarAbierto(true)}
          onColapsarSidebar={() => setSidebarColapsado((prev) => !prev)}
          colapsado={sidebarColapsado}
        />

        <main className="layout-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}