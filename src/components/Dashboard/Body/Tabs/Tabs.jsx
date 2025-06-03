import React from 'react';
import './Tabs.css';

const Tabs = ({ activeTab, onTabChange, searchTerm, setSearchTerm }) => {
  const tabs = ['Caja', 'Ingresos'];

  return (
    <div className="tab-container">
      <div className="tab-links">
        {tabs.map((tab) => (
          <a
            key={tab}
            className={`tab-link ${activeTab === tab ? 'active' : ''}`}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onTabChange(tab);
            }}
          >
            <p className="tab-text">{tab}</p>
          </a>
        ))}
      </div>
      <div className="search-container">
        <label className="search-box">
          <div className="search-input-container">
            <div className="search-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
              </svg>
            </div>
            <input
              className="search-input"
              placeholder="Buscar por Patente"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
            />
          </div>
        </label>
      </div>
    </div>
  );
};

export default Tabs;