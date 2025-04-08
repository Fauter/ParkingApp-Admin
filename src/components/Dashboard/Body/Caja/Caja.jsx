import React from 'react';
import Tabs from '../Tabs/Tabs';
import './Caja.css';

const Caja = ({ activeTab, setActiveTab, movimientos }) => {
  const renderContent = () => {
    if (activeTab === 'Caja') {
      return (
        <>
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
                  {movimientos.map((movimiento) => (
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
        </>
      );
    } else {
      return <p style={{ padding: '1rem' }}>Contenido para la pestaña "{activeTab}" próximamente...</p>;
    }
  };

  return (
    <div className="caja">
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      {renderContent()}
    </div>
  );
}

export default Caja;