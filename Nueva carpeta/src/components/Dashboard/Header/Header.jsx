import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // <-- Importar useNavigate
import profilePic from '../../../assets/profilePic.png';
import './Header.css';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [username, setUsername] = useState('');
  const navigate = useNavigate(); // <-- Usar el hook

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('https://api.garageia.com/api/auth/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        if (response.ok) {
          setUsername(data.username);
        } else {
          console.error('Error obteniendo usuario:', data.msg);
        }
      } catch (error) {
        console.error('Error en la petición:', error);
      }
    };

    fetchUser();
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login'); // <-- Redireccionar correctamente
  };

  return (
    <div className="header-container">
      <header className="header">
        <div className="header-left">
          <div className="logo-container">
            <h2 className="header-title">Admin Dashboard</h2>
          </div>
          <nav>
            <a href="/">Inicio</a>
            <Link to="/tickets">Tickets</Link>
            <Link to="/config">Config</Link>
            <a href="https://operador.garageia.com/" target="_blank" rel="noopener noreferrer">
              Operador
            </a>
          </nav>
        </div>
        <div className="header-right">
          <div className="profile-name">
            {username || 'Cargando...'}
          </div>
          <div className="profile-container">
            <div
              className="profile-pic"
              onClick={toggleMenu}
              style={{ backgroundImage: `url(${profilePic})` }}
            ></div>
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
