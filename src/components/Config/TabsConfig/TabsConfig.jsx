import React from 'react';
import './TabsConfig.css';

const TabsConfig = ({ activeTab, onTabChange }) => {
  const tabs = ['Tipos de Vehículo', 'Tarifas', 'Precios'];

  return (
    <div className="configTab-container">
      <div className="configTab-links">
        {tabs.map((tab) => (
          <a
            key={tab}
            className={`configTab-link ${activeTab === tab ? 'active' : ''}`}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onTabChange(tab);
            }}
          >
            <p className="configTab-text">{tab}</p>
          </a>
        ))}
      </div>
    </div>
  );
};

export default TabsConfig;