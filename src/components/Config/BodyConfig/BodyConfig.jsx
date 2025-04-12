import React from 'react';
import TiposVehiculo from './sections/TiposVehiculo/TiposVehiculo';
import Tarifas from './sections/Tarifas/Tarifas';
import Precios from './sections/Precios/Precios';
import Usuarios from './sections/Usuarios/Usuarios';

const BodyConfig = ({ activeTab }) => {
    switch (activeTab) {
      case 'Tipos de Vehículo':
        return <TiposVehiculo />;
      case 'Tarifas':
        return <Tarifas />;
      case 'Precios':
        return <Precios />;
      case 'Usuarios':
        return <Usuarios />;
      default:
        return <p>Seleccioná una pestaña.</p>;
    }
};

export default BodyConfig;