// src/components/Login/Login.jsx
import "./Login.css";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function homePathByRole(role) {
  if (role === 'auditor') return '/auditor';
  return '/';
}

function hasHostPermission(hostname, role) {
  if (!role) return false;
  if (hostname === 'admin.garageia.com') {
    return role === 'admin' || role === 'superAdmin' || role === 'auditor';
  }
  if (hostname === 'operador.garageia.com') {
    return role === 'operador' || role === 'admin' || role === 'superAdmin' || role === 'auditor';
  }
  return true; // localhost/dev
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
      const response = await fetch('https://api.garageia.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.msg || 'Error en el login');
        setLoading(false);
        return;
      }

      const token = data.token;
      if (!token) {
        setError('No se recibió token');
        setLoading(false);
        return;
      }

      // 2) Perfil con rol
      const profileResponse = await fetch('https://api.garageia.com/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const profileData = await profileResponse.json();

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

      // 3) Permiso por host (igual criterio que App.jsx)
      const hostname = window.location.hostname;
      if (!hasHostPermission(hostname, role)) {
        setError('No tienes permisos para acceder a esta aplicación');
        setLoading(false);
        return;
      }

      // 4) OK → guardar token y enviar a home por rol (auditor → /auditor)
      localStorage.setItem('token', token);
      const redirectTo =
        localStorage.getItem('redirectAfterLogin') || homePathByRole(role);
      localStorage.removeItem('redirectAfterLogin');
      navigate(redirectTo, { replace: true });
    } catch (err) {
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
