import { FaBars, FaSignOutAlt, FaAngleDoubleLeft } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

export default function Navbar({ onAbrirSidebar, onColapsarSidebar, colapsado }) {
  const { usuario, logout } = useAuth();

  return (
    <header className="navbar-jairo">
      <div className="navbar-izquierda">
        {/* Botón hamburguesa: solo visible en móvil */}
        <button className="btn-icono btn-hamburguesa" onClick={onAbrirSidebar} aria-label="Abrir menú">
          <FaBars />
        </button>

        {/* Botón colapsar: solo visible en desktop */}
        <button className="btn-icono btn-colapsar" onClick={onColapsarSidebar} aria-label="Colapsar menú">
          <FaAngleDoubleLeft className={colapsado ? "icono-rotado" : ""} />
        </button>
      </div>

      <div className="navbar-derecha">
        <span className="navbar-usuario">
          {usuario?.nombre} <span className="navbar-rol">({usuario?.rol})</span>
        </span>
        <button className="btn-icono" onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión">
          <FaSignOutAlt />
        </button>
      </div>
    </header>
  );
}