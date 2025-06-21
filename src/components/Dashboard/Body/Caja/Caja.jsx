import React, { useState, useEffect } from 'react';
import Tabs from '../Tabs/Tabs';
import './Caja.css';

const ITEMS_POR_PAGINA = 10;

const Caja = ({
  movimientos = [],
  vehiculos = [],
  alertas = [],
  incidentes = [],
  limpiarFiltros,
  activeCajaTab = 'Caja',
  isSearchBarVisible = true 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    setPaginaActual(1);
  }, [searchTerm, activeCajaTab]);

  const paginar = (array, pagina) => {
    const startIndex = (pagina - 1) * ITEMS_POR_PAGINA;
    return array.slice(startIndex, startIndex + ITEMS_POR_PAGINA);
  };

  const totalPaginas = (array) => Math.ceil(array.length / ITEMS_POR_PAGINA);

  const handleTabChange = (tab) => {
    setSearchTerm('');
    limpiarFiltros?.();
    setActiveTab(tab);
    setPaginaActual(1);
  };

  const renderPaginado = (total) => (
    <div className="paginado">
      <button disabled={paginaActual === 1} onClick={() => setPaginaActual(paginaActual - 1)}>Anterior</button>
      <span>Página {paginaActual} de {total || 1}</span>
      <button disabled={paginaActual === total || total === 0} onClick={() => setPaginaActual(paginaActual + 1)}>Siguiente</button>
    </div>
  );

  const renderFilasVacias = (cantidad, columnas) =>
    Array.from({ length: cantidad }, (_, i) => (
      <tr key={`empty-${i}`}>{Array.from({ length: columnas }, (_, j) => <td key={j}>---</td>)}</tr>
    ));

  const renderTablaCaja = () => {
    const term = searchTerm.toUpperCase();
    const filtrados = movimientos.filter(mov => mov.patente?.toUpperCase().includes(term));
    const paginados = paginar(filtrados, paginaActual);
    const total = totalPaginas(filtrados);

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
              {paginados.map(movimiento => {
                const fecha = movimiento.fecha ? new Date(movimiento.fecha) : null;
                const montoSeguro = typeof movimiento.monto === 'number' ? movimiento.monto : 0;
                return (
                  <tr key={movimiento._id}>
                    <td>{movimiento.patente?.toUpperCase() || '---'}</td>
                    <td>{fecha?.toLocaleDateString() || '---'}</td>
                    <td>{fecha?.toLocaleTimeString() || '---'}</td>
                    <td>{movimiento.descripcion || '---'}</td>
                    <td>{movimiento.operador || '---'}</td>
                    <td>{movimiento.tipoVehiculo ? movimiento.tipoVehiculo[0].toUpperCase() + movimiento.tipoVehiculo.slice(1) : '---'}</td>
                    <td>{movimiento.metodoPago || '---'}</td>
                    <td>{movimiento.factura || '---'}</td>
                    <td>{montoSeguro === 0 ? '---' : `$${montoSeguro.toLocaleString('es-AR')}`}</td>
                  </tr>
                );
              })}
              {renderFilasVacias(ITEMS_POR_PAGINA - paginados.length, 9)}
            </tbody>
          </table>
          {renderPaginado(total)}
        </div>
      </div>
    );
  };

  const renderTablaIngresos = () => {
    const term = searchTerm.toUpperCase();
    const filtrados = vehiculos
      .filter(veh => veh.estadiaActual?.entrada && !veh.estadiaActual?.salida)
      .filter(veh => veh.patente?.toUpperCase().includes(term))
      .reverse(); // Mostramos los últimos primero
    const paginados = paginar(filtrados, paginaActual);
    const total = totalPaginas(filtrados);

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
                <th>Abonado/Turno</th>
              </tr>
            </thead>
            <tbody>
              {paginados.map(veh => {
                const entrada = veh.estadiaActual?.entrada ? new Date(veh.estadiaActual.entrada) : null;
                let abonadoTurnoTexto = 'No';
                if (veh.abonado) abonadoTurnoTexto = 'Abonado';
                else if (veh.turno) abonadoTurnoTexto = 'Turno';

                return (
                  <tr key={veh._id}>
                    <td>{veh.patente?.toUpperCase() || '---'}</td>
                    <td>{entrada?.toLocaleDateString() || '---'}</td>
                    <td>{entrada?.toLocaleTimeString() || '---'}</td>
                    <td>{veh.estadiaActual.operadorNombre || '---'}</td>
                    <td>{veh.tipoVehiculo ? veh.tipoVehiculo[0].toUpperCase() + veh.tipoVehiculo.slice(1) : '---'}</td>
                    <td>{abonadoTurnoTexto}</td>
                  </tr>
                );
              })}
              {renderFilasVacias(ITEMS_POR_PAGINA - paginados.length, 6)}
            </tbody>
          </table>
          {renderPaginado(total)}
        </div>
      </div>
    );
  };

  const renderTablaAlertas = () => {
    const term = searchTerm.toUpperCase();
    const filtradas = alertas
      .filter(a => 
        a.tipoDeAlerta?.toUpperCase().includes(term) || 
        a.operador?.toUpperCase().includes(term)
      )
      .reverse();
    const paginadas = paginar(filtradas, paginaActual);
    const total = totalPaginas(filtradas);

    return (
      <div className="table-container">
        <div className="table-wrapper">
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Tipo de Alerta</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Operador</th>
              </tr>
            </thead>
            <tbody>
              {paginadas.map(alerta => {
                const fechaYHora = alerta.fecha && alerta.hora ? new Date(`${alerta.fecha}T${alerta.hora}:00`) : null;
                return (
                  <tr key={alerta._id}>
                    <td>{alerta.tipoDeAlerta || '---'}</td>
                    <td>{alerta.fecha || '---'}</td>
                    <td>{alerta.hora || '---'}</td>
                    <td>{alerta.operador || '---'}</td>
                  </tr>
                );
              })}
              {renderFilasVacias(ITEMS_POR_PAGINA - paginadas.length, 4)}
            </tbody>
          </table>
          {renderPaginado(total)}
        </div>
      </div>
    );
  };

  const renderTablaIncidentes = () => {
    const term = searchTerm.toUpperCase();
    const filtrados = incidentes
      .filter(i => 
        i.texto?.toUpperCase().includes(term) || 
        i.operador?.toUpperCase().includes(term)
      )
      .reverse();
    const paginados = paginar(filtrados, paginaActual);
    const total = totalPaginas(filtrados);

    return (
      <div className="table-container">
        <div className="table-wrapper incidentes-table-wrapper">
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Operador</th>
              </tr>
            </thead>
            <tbody>
              {paginados.map(inc => {
                const fechaYHora = inc.fecha && inc.hora ? new Date(`${inc.fecha}T${inc.hora}:00`) : null;
                return (
                  <tr key={inc._id}>
                    <td>{inc.texto || '---'}</td>
                    <td>{fechaYHora?.toLocaleDateString() || '---'}</td>
                    <td>{fechaYHora?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '---'}</td>
                    <td>{inc.operador || '---'}</td>
                  </tr>
                );
              })}
              {renderFilasVacias(ITEMS_POR_PAGINA - paginados.length, 4)}
            </tbody>
          </table>
          {renderPaginado(total)}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeCajaTab) {
      case 'Caja':
        return renderTablaCaja();
      case 'Ingresos':
        return renderTablaIngresos();
      case 'Alertas':
        return renderTablaAlertas();
      case 'Incidentes':
        return renderTablaIncidentes();
      default:
        return <p style={{ padding: '1rem' }}>Contenido para la pestaña "{activeCajaTab}" próximamente...</p>;
    }
  };

  return (
    <div className="caja">
      {renderContent()}
    </div>
  );
};

export default Caja;
