import React, { useState } from 'react';
import '../../Config/TabsConfig/TabsConfig.css';

import TicketsAbiertos from '../BodyAbonos/sections/TicketsAbiertos/TicketsAbiertos';
import MensualesSection from '../BodyAbonos/sections/Mensuales/Mensuales';
import Turno from '../BodyAbonos/sections/Turnos/Turnos';

const TabsAbonos = () => {
  const tabs = ['Tickets Abiertos', 'Mensuales', 'Turno'];
  const [activeTab, setActiveTab] = useState('Tickets Abiertos');

  const renderSection = () => {
    switch (activeTab) {
      case 'Tickets Abiertos':
        return <TicketsAbiertos />;
      case 'Mensuales':
        return <MensualesSection />;
      case 'Turno':
        return <Turno />;
      default:
        return null;
    }
  };

  return (
    <div className="configTab-container">
      <div className="configTab-header">
        <div className="configTab-links">
          {tabs.map((tab) => (
            <a
              key={tab}
              className={`configTab-link ${activeTab === tab ? 'active' : ''}`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(tab);
              }}
            >
              {tab}
            </a>
          ))}
        </div>
      </div>
      <div className="configTab-content">
        {renderSection()}
      </div>
    </div>
  );
};

export default TabsAbonos;
