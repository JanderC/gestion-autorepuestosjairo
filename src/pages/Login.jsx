import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaSpinner } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [mostrarContraseña, setMostrarContraseña] = useState(false);
  const [recordarme, setRecordarme] = useState(true);
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const manejarSubmit = async (e) => {
    e.preventDefault();

    if (!email || !contraseña) {
      toast.error("Completá email y contraseña");
      return;
    }

    setCargando(true);
    try {
      await login(email, contraseña);
      navigate("/", { replace: true });
    } catch (error) {
      const mensaje = error.response?.data?.mensaje || "Credenciales incorrectas";
      toast.error(mensaje);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-pagina">
      {/* Panel de marca — solo visible en desktop */}
      <div className="login-panel-marca">
        <div className="login-marca-brillo" />
        <div className="login-marca-contenido">
          <img src="/logo-jairo.png" alt="Auto Repuestos Jairo" className="login-marca-logo" />
          <p className="login-marca-frase">Repuestos de confianza, gestión sin fricción.</p>
        </div>
      </div>

      {/* Panel de formulario */}
      <div className="login-panel-formulario">
        <form onSubmit={manejarSubmit} className="login-form">
          <img src="/logo-jairo.png" alt="Auto Repuestos Jairo" className="login-logo-movil" />

          <h1 className="login-titulo">Bienvenido de nuevo</h1>
          <p className="login-subtitulo">Ingresá con tu cuenta para continuar</p>

          <div className="login-campo">
            <FaEnvelope className="login-icono-campo" />
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="login-campo">
            <FaLock className="login-icono-campo" />
            <input
              type={mostrarContraseña ? "text" : "password"}
              placeholder="Contraseña"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="login-toggle-clave"
              onClick={() => setMostrarContraseña((v) => !v)}
              tabIndex={-1}
              aria-label={mostrarContraseña ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {mostrarContraseña ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <label className="login-recordarme">
            <input
              type="checkbox"
              checked={recordarme}
              onChange={(e) => setRecordarme(e.target.checked)}
            />
            Mantener sesión iniciada
          </label>

          <button type="submit" className="login-boton" disabled={cargando}>
            {cargando ? (
              <>
                <FaSpinner className="login-spinner" /> Ingresando...
              </>
            ) : (
              "Ingresar"
            )}
          </button>

          <p className="login-pie">Auto Repuestos Jairo © {new Date().getFullYear()}</p>
        </form>
      </div>
    </div>
  );
}