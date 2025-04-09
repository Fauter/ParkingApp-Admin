import React, { useState } from 'react';
import './Config.css';
import TabsConfig from './TabsConfig/TabsConfig';
import BodyConfig from './BodyConfig/BodyConfig';

const Config = () => {
  const [activeTab, setActiveTab] = useState('Tipos de Vehículo');

  return (
    <div className="config-container">
      <TabsConfig activeTab={activeTab} onTabChange={setActiveTab} />
      <BodyConfig activeTab={activeTab} />
    </div>
  );
};

export default Config;