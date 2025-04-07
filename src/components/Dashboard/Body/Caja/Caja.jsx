import React, { useState, useEffect } from 'react';
import './Caja.css';

const Caja = () => {
  const [movimientos, setMovimientos] = useState([]);

  useEffect(() => {
    const fetchMovimientos = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/movimientos');
        const data = await response.json();
        setMovimientos(data);
      } catch (error) {
        console.error('Error al obtener movimientos:', error);
      }
    };

    fetchMovimientos();
    const interval = setInterval(fetchMovimientos, 5000); // Actualiza cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="caja">
      <div className="tab-container">
        <div className="tab-links">
          <a className="tab-link active" href="#">
            <p className="tab-text">Caja</p>
          </a>
          <a className="tab-link" href="#">
            <p className="tab-text">Recibos</p>
          </a>
          <a className="tab-link" href="#">
            <p className="tab-text">Cierres de Caja</p>
          </a>
        </div>
      </div>
      <div className="search-container">
        <label className="search-box">
          <div className="search-input-container">
            <div className="search-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
              </svg>
            </div>
            <input className="search-input" placeholder="Buscar" />
          </div>
        </label>
      </div>
      <div className="table-container">
        <div className="table-wrapper">
          <table className="transaction-table">
            <thead>
              <tr>
                <th className="table-header">Patente</th>
                <th className="table-header">Fecha</th>
                <th className="table-header">Hora</th>
                <th className="table-header">Descripción</th>
                <th className="table-header">Operador</th>
                <th className="table-header">Tipo de Vehículo</th>
                <th className="table-header">M. De Pago</th>
                <th className="table-header">Factura</th>
                <th className="table-header">Monto</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((movimiento) => (
                <tr key={movimiento._id}>
                  <td className="table-data">{movimiento.patente.toUpperCase()}</td>
                  <td className="table-data">{new Date(movimiento.fecha).toLocaleDateString()}</td>
                  <td className="table-data">{new Date(movimiento.fecha).toLocaleTimeString()}</td>
                  <td className="table-data">{movimiento.descripcion}</td>
                  <td className="table-data">{movimiento.operador}</td>
                  <td className="table-data">{movimiento.tipoVehiculo.charAt(0).toUpperCase() + movimiento.tipoVehiculo.slice(1)}</td>
                  <td className="table-data">{movimiento.metodoPago}</td>
                  <td className="table-data">{movimiento.factura}</td>
                  <td className="table-data">${movimiento.monto.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Caja;