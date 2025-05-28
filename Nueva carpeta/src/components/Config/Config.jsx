import React, { useState } from 'react';
import './Config.css';
import TabsConfig from './TabsConfig/TabsConfig';
import BodyConfig from './BodyConfig/BodyConfig';

const Config = () => {
  const [activeTab, setActiveTab] = useState('Tipos de Vehículo');
  const [fraccionarDesde, setFraccionarDesde] = useState('0'); // Define aquí el estado

  return (
    <div className="config-container">
      <TabsConfig 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        fraccionarDesde={fraccionarDesde} // Pásalo como prop aquí
        setFraccionarDesde={setFraccionarDesde} // También necesitas pasar la función para actualizarlo
      />
      <BodyConfig activeTab={activeTab} />
    </div>
  );
};

export default Config;
