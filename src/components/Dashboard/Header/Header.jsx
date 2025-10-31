// src/components/Header/Header.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import profilePic from '../../../assets/profilePic.png';
import './Header.css';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  // ✅ Inicializar el usuario con lo que haya en localStorage para evitar "undefined"
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const navigate = useNavigate();

  // ✅ Sincronizar estado con el backend y con cambios en otras pestañas
  useEffect(() => {
    let aborted = false;

    const ensureAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        // Si no hay token, aseguramos logout local y mandamos a login
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login', { replace: true });
        return;
      }

      try {
        const response = await fetch('https://apiprueba.garageia.com/api/auth/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        // Si la respuesta es OK, refrescamos user y persistimos
        if (response.ok) {
          const data = await response.json();
          if (!aborted) {
            setUser(data);
            try {
              localStorage.setItem('user', JSON.stringify(data));
            } catch {
              /* ignore storage errors */
            }
          }
          return;
        }

        // Si el token es inválido/expirado
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (!aborted) {
            setUser(null);
            navigate('/login', { replace: true });
          }
          return;
        }

        // Otros errores: no tumbamos sesión local, solo log
        console.warn('Error al obtener perfil:', response.status);

      } catch (error) {
        console.error('Error fetching user:', error);
        // Si hay error de red, mantenemos lo que haya localmente para no romper la UI.
      }
    };

    ensureAuth();

    // ✅ Escuchar cambios en otras pestañas/ventanas (logout/login)
    const onStorage = (e) => {
      if (e.key === 'token' || e.key === 'user') {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            setUser(null);
            navigate('/login', { replace: true });
            return;
          }
          const raw = localStorage.getItem('user');
          setUser(raw ? JSON.parse(raw) : null);
        } catch {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', onStorage);
    return () => {
      aborted = true;
      window.removeEventListener('storage', onStorage);
    };
  }, [navigate]);

  const toggleMenu = () => {
    setMenuOpen(prev => !prev);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user'); // ✅ limpiar user también
    } catch { /* ignore */ }
    setUser(null);
    setMenuOpen(false);
    navigate('/login', { replace: true });
  };

  // Nombre seguro (evita "undefined")
  const displayName =
    (user && (user.nombre || user.username || user.email)) || 'Usuario';

  return (
    <div className="header-container">
      <header className="header">
        <div className="header-left">
          <div className="logo-container">
            <h2 className="header-title">Admin Dashboard</h2>
          </div>
          <nav>
            <NavLink to="/" end>Inicio</NavLink>
            <NavLink to="/cierresDeCaja">Cierres de Caja</NavLink>
            <NavLink to="/auditoria">Auditoría</NavLink>
            <NavLink to="/tickets">Anticipados/Abonos</NavLink>
            <NavLink to="/config">Config</NavLink>
          </nav>
        </div>
        <div className="header-right">
          <div className="profile-name">
            {displayName}
          </div>
          <div className="profile-container">
            <div
              className="profile-pic"
              onClick={toggleMenu}
              style={{ backgroundImage: `url(${profilePic})` }}
              role="button"
              aria-label="Abrir menú de usuario"
            />
            {menuOpen && (
              <div className="dropdown-menu">
                <button onClick={handleLogout}>Cerrar sesión</button>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
