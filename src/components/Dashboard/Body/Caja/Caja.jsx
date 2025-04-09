import React, { useState } from 'react';
import Tabs from '../Tabs/Tabs';
import './Caja.css';

const Caja = ({ activeTab, setActiveTab, movimientos, vehiculos, limpiarFiltros }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const renderContent = () => {
    const term = searchTerm.trim().toUpperCase();

    if (activeTab === 'Caja') {
      const movimientosFiltrados = movimientos.filter((mov) =>
        mov.patente.toUpperCase().startsWith(term)
      );

      return (
        <div className="table-container">
          <div className="table-wrapper">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Patente</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Descripción</th>
                  <th>Operador</th>
                  <th>Tipo de Vehículo</th>
                  <th>Método de Pago</th>
                  <th>Factura</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {movimientosFiltrados.map((movimiento) => (
                  <tr key={movimiento._id}>
                    <td>{movimiento.patente.toUpperCase()}</td>
                    <td>{new Date(movimiento.fecha).toLocaleDateString()}</td>
                    <td>{new Date(movimiento.fecha).toLocaleTimeString()}</td>
                    <td>{movimiento.descripcion}</td>
                    <td>{movimiento.operador}</td>
                    <td>{movimiento.tipoVehiculo.charAt(0).toUpperCase() + movimiento.tipoVehiculo.slice(1)}</td>
                    <td>{movimiento.metodoPago}</td>
                    <td>{movimiento.factura}</td>
                    <td>${movimiento.monto.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else if (activeTab === 'Ingresos') {
      const vehiculosOrdenados = [...vehiculos]
        .sort((a, b) => {
          const entradaA = new Date(a.historialEstadias[a.historialEstadias.length - 1].entrada);
          const entradaB = new Date(b.historialEstadias[b.historialEstadias.length - 1].entrada);
          return entradaB - entradaA;
        })
        .filter((veh) =>
          veh.patente.toUpperCase().startsWith(term)
        );

      return (
        <div className="table-container">
          <div className="table-wrapper">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Patente</th>
                  <th>Fecha</th>
                  <th>Hora Entrada</th>
                  <th>Operador</th>
                  <th>Tipo de Vehículo</th>
                </tr>
              </thead>
              <tbody>
                {vehiculosOrdenados.map((veh) => {
                  const ultimaEstadia = veh.historialEstadias[veh.historialEstadias.length - 1];
                  const entrada = new Date(ultimaEstadia.entrada);
                  return (
                    <tr key={veh._id}>
                      <td>{veh.patente.toUpperCase()}</td>
                      <td>{entrada.toLocaleDateString()}</td>
                      <td>{entrada.toLocaleTimeString()}</td>
                      <td>Carlos</td>
                      <td>{veh.tipoVehiculo.charAt(0).toUpperCase() + veh.tipoVehiculo.slice(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else {
      return <p style={{ padding: '1rem' }}>Contenido para la pestaña "{activeTab}" próximamente...</p>;
    }
  };

  return (
    <div className="caja">
      <Tabs
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearchTerm('');   
          limpiarFiltros();      
        }}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      {renderContent()}
    </div>
  );
};

export default Caja;