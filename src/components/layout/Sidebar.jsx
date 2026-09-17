import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaCashRegister,
  FaBoxOpen,
  FaWarehouse,
  FaUsers,
  FaChartBar,
  FaMoneyBillWave,
  FaUserShield,
  FaGift,
  FaFileInvoiceDollar,
  FaCog,
  FaTimes,
  FaHandHoldingUsd,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

// Módulos definidos una sola vez; el filtro por rol se hace abajo
const MODULOS = [
  { path: "/", label: "Dashboard", icon: FaTachometerAlt, roles: ["admin", "cajero"] },
  { path: "/ventas", label: "Punto de Venta", icon: FaCashRegister, roles: ["admin", "cajero"] },
  { path: "/caja", label: "Caja", icon: FaMoneyBillWave, roles: ["admin", "cajero"] },
  { path: "/clientes", label: "Clientes", icon: FaUsers, roles: ["admin", "cajero"] },
  { path: "/productos", label: "Productos", icon: FaBoxOpen, roles: ["admin", "cajero"] },
  { path: "/inventario", label: "Inventario", icon: FaWarehouse, roles: ["admin"] },
  { path: "/reportes", label: "Reportes", icon: FaChartBar, roles: ["admin"] },
  { path: "/tasas", label: "Tasas", icon: FaMoneyBillWave, roles: ["admin"] },
  { path: "/facturas", label: "Facturas", icon: FaFileInvoiceDollar, roles: ["admin"] },
  { path: "/usuarios", label: "Usuarios", icon: FaUserShield, roles: ["admin"] },
  { path: "/colaboraciones", label: "Colaboraciones", icon: FaGift, roles: ["admin"] },
  { path: "/configuracion", label: "Configuración", icon: FaCog, roles: ["admin"] },
  { path: "/fiados", label: "Fiados", icon: FaHandHoldingUsd, roles: ["admin", "cajero"] },
];

export default function Sidebar({ abierto, colapsado, onCerrar }) {
  const { rol } = useAuth();
  const modulosVisibles = MODULOS.filter((m) => m.roles.includes(rol));

  return (
    <>
      {/* Overlay solo visible en móvil cuando el sidebar está abierto */}
      {abierto && <div className="sidebar-overlay" onClick={onCerrar} />}

      <aside
        className={`sidebar ${abierto ? "sidebar-abierto" : ""} ${
          colapsado ? "sidebar-colapsado" : ""
        }`}
      >
        <div className="sidebar-header">
          <img src="/logo-jairo.png" alt="Auto Repuestos Jairo" className="sidebar-logo" />
          <div className="sidebar-logo-mini">AJ</div>

          <button className="sidebar-cerrar-movil" onClick={onCerrar} aria-label="Cerrar menú">
            <FaTimes />
          </button>
        </div>

        <nav className="sidebar-nav">
          {modulosVisibles.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? "sidebar-item-activo" : ""}`
              }
              onClick={onCerrar} // en móvil, al elegir un módulo se cierra el menú
              title={colapsado ? label : undefined}
            >
              <Icon className="sidebar-icon" />
              <span className="sidebar-label">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}