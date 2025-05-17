import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../../Config/TabsConfig/TabsConfig.css';

import TicketsAbiertos from '../BodyAbonos/sections/TicketsAbiertos/TicketsAbiertos';
import AbonosSection from '../BodyAbonos/sections/AbonosSection/AbonosSection';
import Turno from '../BodyAbonos/sections/Turnos/Turnos';

const TabsAbonos = () => {
  const tabs = ['Tickets Abiertos', 'Abonos', 'Turno'];
  const location = useLocation();

  // Función para leer el query param tab
  const getTabFromQuery = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tabs.includes(tab)) return tab;
    return 'Tickets Abiertos'; // default
  };

  const [activeTab, setActiveTab] = useState(getTabFromQuery());

  // Cuando cambia la URL, actualizar el activeTab
  useEffect(() => {
    setActiveTab(getTabFromQuery());
  }, [location.search]);

  const renderSection = () => {
    switch (activeTab) {
      case 'Tickets Abiertos':
        return <TicketsAbiertos />;
      case 'Abonos':
        return <AbonosSection />;
      case 'Turno':
        return <Turno />;
      default:
        return null;
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    // Cambiar URL para que quede guardado el tab actual
    const params = new URLSearchParams(location.search);
    params.set('tab', tab);
    window.history.replaceState(null, '', `${location.pathname}?${params.toString()}`);
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
                handleTabClick(tab);
              }}
            >
              {tab}
            </a>
          ))}
        </div>
      </div>
      <div className="configTab-content">{renderSection()}</div>
    </div>
  );
};

export default TabsAbonos;
