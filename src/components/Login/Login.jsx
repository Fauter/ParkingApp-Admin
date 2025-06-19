import "./Login.css";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Obtenemos el token recibido
        const token = data.token;

        // Ahora fetch para obtener perfil con ese token
        const profileResponse = await fetch('http://localhost:5000/api/auth/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const profileData = await profileResponse.json();

        if (!profileResponse.ok) {
          setError('No se pudo obtener el perfil del usuario');
          setLoading(false);
          return;
        }

        if (profileData.role !== 'superAdmin') {
          alert('No tienes permisos para acceder a esta aplicación');
          setLoading(false);
          return; // No guardar token ni navegar
        }

        // Si es superAdmin, guardamos token y navegamos
        localStorage.setItem('token', token);
        const redirectTo = localStorage.getItem('redirectAfterLogin') || '/';
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectTo, { replace: true });
      } else {
        setError(data.msg || 'Error en el login');
      }
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

export default Login;
