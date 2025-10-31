// src/components/Login/Login.jsx
import "./Login.css";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ============================
   Host/Role Guards (estrictos)
============================= */
function resolveHostContext(hostname) {
  // Producción
  if (hostname === 'admin.garageia.com') return 'admin';
  if (hostname === 'operador.garageia.com') return 'operador';

  // Dev (localhost/127.0.0.1): configurable por .env
  // VITE_DEV_HOST puede ser: 'admin' | 'operador' | 'auditor'
  const dev = (import.meta?.env?.VITE_DEV_HOST || '').toLowerCase();
  if (dev === 'admin' || dev === 'operador' || dev === 'auditor') return dev;

  // default dev: admin
  return 'admin';
}

function hasHostPermission(hostname, role) {
  if (!role) return false;
  const ctx = resolveHostContext(hostname);

  // Qué roles pueden entrar según contexto
  const ALLOWED_BY_CTX = {
    admin: new Set(['admin', 'superAdmin', 'auditor']),
    operador: new Set(['operador', 'admin', 'superAdmin', 'auditor']),
    auditor: new Set(['auditor'])
  };

  const allowed = ALLOWED_BY_CTX[ctx] || ALLOWED_BY_CTX.admin;
  return allowed.has(role);
}

function homePathByRole(role) {
  if (role === 'auditor') return '/auditor';
  return '/';
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1) Login → token
      const response = await fetch('https://apiprueba.garageia.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.msg || 'Error en el login');
        setLoading(false);
        return;
      }

      const token = data?.token;
      if (!token) {
        setError('No se recibió token');
        setLoading(false);
        return;
      }

      // 2) Perfil con rol
      const profileResponse = await fetch('https://apiprueba.garageia.com/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const profileData = await profileResponse.json().catch(() => ({}));

      if (!profileResponse.ok) {
        setError(profileData?.msg || 'No se pudo obtener el perfil del usuario');
        setLoading(false);
        return;
      }

      const role = profileData?.role;
      if (!role) {
        setError('Perfil sin rol');
        setLoading(false);
        return;
      }

      // 3) Permiso por host/contexto (estricto también en localhost)
      const hostname = window.location.hostname;
      if (!hasHostPermission(hostname, role)) {
        setError('No tienes permisos para acceder desde este entorno.');
        setLoading(false);
        return;
      }

      // 4) Guardar sesión de forma atómica
      try {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(profileData));
      } catch (storageErr) {
        console.error('Error guardando en localStorage:', storageErr);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setError('No se pudo guardar la sesión en este navegador');
        setLoading(false);
        return;
      }

      // 5) Redirección por rol (o redirectAfterLogin)
      const redirectTo =
        localStorage.getItem('redirectAfterLogin') || homePathByRole(role);
      localStorage.removeItem('redirectAfterLogin');
      navigate(redirectTo, { replace: true });

    } catch (err) {
      console.error(err);
      setError('Hubo un problema con la conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="containerLogin">
        <div className="login-container">
          <h1>DASHBOARD DE ADMIN</h1>
          <form onSubmit={handleSubmit}>
            <label className="input-label">
              <p>Usuario</p>
              <input
                type="text"
                placeholder="Ingresa tu usuario"
                className="input-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </label>
            <label className="input-label">
              <p>Contraseña</p>
              <input
                type="password"
                placeholder="Ingresa tu contraseña"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Cargando..." : "Iniciar Sesión"}
            </button>
          </form>
          {error && <p className="error-message">{error}</p>}
          <p className="forgot-password">¿Olvidaste tu contraseña?</p>
        </div>
      </div>
    </div>
  );
}
