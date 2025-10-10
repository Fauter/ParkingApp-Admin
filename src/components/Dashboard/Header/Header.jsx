import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import profilePic from '../../../assets/profilePic.png';
import './Header.css';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
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

        const data = await response.json();

        if (response.ok) {
          setUser(data);
        } else if (response.status === 401) {
          localStorage.removeItem('token');
          setUser(null);
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, [navigate]);

  const toggleMenu = () => {
    setMenuOpen(prev => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setMenuOpen(false);
    navigate('/login');
  };

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
            {user ? `${user.nombre}` : 'Cargando...'}
          </div>
          <div className="profile-container">
            <div
              className="profile-pic"
              onClick={toggleMenu}
              style={{ backgroundImage: `url(${profilePic})` }}
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
