import React from 'react';
import './Caja.css';

const Caja = () => {
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
                <th className="table-header">ID</th>
                <th className="table-header">Fecha</th>
                <th className="table-header">Hora</th>
                <th className="table-header">Descripción</th>
                <th className="table-header">Operador</th>
                <th className="table-header">Origen</th>
                <th className="table-header">Comprobante</th>
                <th className="table-header">Monto</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="table-data">1</td>
                <td className="table-data">2023-10-01</td>
                <td className="table-data">12:00</td>
                <td className="table-data">Transaction details here</td>
                <td className="table-data">Diego</td>
                <td className="table-data">Origin A</td>
                <td className="table-data">Receipt A</td>
                <td className="table-data">$10.000</td>
              </tr>
              <tr>
                <td className="table-data">2</td>
                <td className="table-data">2023-10-01</td>
                <td className="table-data">12:30</td>
                <td className="table-data">Transaction details here</td>
                <td className="table-data">Carlos</td>
                <td className="table-data">Origin B</td>
                <td className="table-data">Receipt B</td>
                <td className="table-data">$20.000</td>
              </tr>
              <tr>
                <td className="table-data">3</td>
                <td className="table-data">2023-10-01</td>
                <td className="table-data">13:00</td>
                <td className="table-data">Transaction details here</td>
                <td className="table-data">Carlos</td>
                <td className="table-data">Origin C</td>
                <td className="table-data">Receipt B</td>
                <td className="table-data">$25.000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Caja;