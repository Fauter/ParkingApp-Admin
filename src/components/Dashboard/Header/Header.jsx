import React from 'react';
import './Header.css'; // Importamos los estilos

const Header = () => {
  return (
    <div className="header-container">
        <header className="header">
          <div className="header-left">
            <div className="logo-container">
              <h2 className="header-title">Admin Dashboard</h2>
            </div>
            <nav>
              <a href="#">Tickets</a>
              <a href="#">Mensajes</a>
              <a href="#">Caja</a>
              <a href="#">Config</a>
            </nav>
          </div>
          <div className="header-right">
            <label className="search-bar">
              <div className="search-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                  <path
                    d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"
                  ></path>
                </svg>
              </div>
              <input placeholder="Search" />
            </label>
            <div
              className="profile-pic"
              style={{ backgroundImage: 'url("https://cdn.usegalileo.ai/sdxl10/3626cf3a-8bcf-4b43-999a-f401d2f88b55.png")' }}
            ></div>
          </div>
        </header>
    </div>
  );
};

export default Header;

