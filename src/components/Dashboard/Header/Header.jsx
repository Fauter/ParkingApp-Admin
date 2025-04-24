import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import profilePic from '../../../assets/profilePic.png'
import './Header.css'; 

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
  
      try {
        const response = await fetch('http://localhost:5000/api/auth/profile', { 
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // <-- Asegúrate de incluir "Bearer "
            'Content-Type': 'application/json'
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
              <a href="/">Inicio</a>
              <a href="#">Mensajes</a>
              <Link to="/config">Config</Link>
              <a href="https://prueba.ofiflex.com.ar">Operador</a>
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

