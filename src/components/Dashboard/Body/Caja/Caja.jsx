import React, { useState } from 'react';
import Tabs from '../Tabs/Tabs';
import './Caja.css';

const Caja = ({ activeTab, setActiveTab, movimientos, vehiculos, limpiarFiltros }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 10;

  const paginar = (array, pagina) => {
    const startIndex = (pagina - 1) * ITEMS_POR_PAGINA;
    return array.slice(startIndex, startIndex + ITEMS_POR_PAGINA);
  };

  const totalPaginas = (arrayFiltrada) => {
    return Math.ceil(arrayFiltrada.length / ITEMS_POR_PAGINA);
  };

  const handleCambioDePestania = (tab) => {
    setActiveTab(tab);
    setSearchTerm('');
    limpiarFiltros();
    setPaginaActual(1); // reiniciar al cambiar pestaña
  };

  const renderPaginado = (total, onPageChange) => (
    <div className="paginado">
      <button
        disabled={paginaActual === 1}
        onClick={() => onPageChange(paginaActual - 1)}
      >
        Anterior
      </button>
      <span>Página {paginaActual} de {total}</span>
      <button
        disabled={paginaActual === total}
        onClick={() => onPageChange(paginaActual + 1)}
      >
        Siguiente
      </button>
    </div>
  );

  const renderContent = () => {
    const term = searchTerm.trim().toUpperCase();

    if (activeTab === 'Caja') {
      const movimientosFiltrados = movimientos.filter((mov) =>
        mov.patente.toUpperCase().startsWith(term)
      );

      const movimientosPaginados = paginar(movimientosFiltrados, paginaActual);
      const total = totalPaginas(movimientosFiltrados);

      // Asegurarse de que siempre haya 10 elementos, añadiendo filas vacías si es necesario
      const espaciosVacios = Array.from({ length: ITEMS_POR_PAGINA - movimientosPaginados.length }, (_, i) => ({
        _id: `empty-${i}`,
        patente: '',
        fecha: '',
        hora: '',
        descripcion: '',
        operador: '',
        tipoVehiculo: '',
        metodoPago: '',
        factura: '',
        monto: 0,
      }));

      const movimientosConEspacios = [...movimientosPaginados, ...espaciosVacios];

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
                {movimientosConEspacios.map((movimiento) => (
                  <tr key={movimiento._id}>
                    <td>{movimiento.patente.toUpperCase() || '---'}</td>
                    <td>{movimiento.fecha ? new Date(movimiento.fecha).toLocaleDateString() : '---'}</td>
                    <td>{movimiento.fecha ? new Date(movimiento.fecha).toLocaleTimeString() : '---'}</td>
                    <td>{movimiento.descripcion || '---'}</td>
                    <td>{movimiento.operador || '---'}</td>
                    <td>{movimiento.tipoVehiculo ? movimiento.tipoVehiculo.charAt(0).toUpperCase() + movimiento.tipoVehiculo.slice(1) : '---'}</td>
                    <td>{movimiento.metodoPago || '---'}</td>
                    <td>{movimiento.factura || '---'}</td>
                    <td>{movimiento.monto === 0 ? '---' : `$${movimiento.monto.toLocaleString()}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {renderPaginado(total, setPaginaActual)}
          </div>
        </div>
      );
    }

    else if (activeTab === 'Ingresos') {
      const vehiculosEnCurso = [...vehiculos]
        .filter((veh) => {
          const tieneEstadia = veh.estadiaActual !== null && veh.estadiaActual !== undefined;
          const entradaValida = tieneEstadia && veh.estadiaActual.entrada !== null;
          return tieneEstadia && entradaValida;
        })
        .sort((a, b) => new Date(b.estadiaActual.entrada) - new Date(a.estadiaActual.entrada))
        .filter((veh) => veh.patente.toUpperCase().startsWith(term));

      const vehiculosPaginados = paginar(vehiculosEnCurso, paginaActual);
      const total = totalPaginas(vehiculosEnCurso);

      // Asegurarse de que siempre haya 10 elementos, añadiendo filas vacías si es necesario
      const espaciosVacios = Array.from({ length: ITEMS_POR_PAGINA - vehiculosPaginados.length }, (_, i) => ({
        _id: `empty-vehiculo-${i}`,
        patente: '',
        estadiaActual: { entrada: '' },
        tipoVehiculo: '',
        operador: '',
      }));

      const vehiculosConEspacios = [...vehiculosPaginados, ...espaciosVacios];

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
                {vehiculosConEspacios.map((veh) => {
                  const entrada = veh.estadiaActual && veh.estadiaActual.entrada
                    ? new Date(veh.estadiaActual.entrada)
                    : null;
                  return (
                    <tr key={veh._id}>
                      <td>{veh.patente.toUpperCase() || '---'}</td>
                      <td>{entrada ? entrada.toLocaleDateString() : '---'}</td>
                      <td>{entrada ? entrada.toLocaleTimeString() : '---'}</td>
                      <td>{veh.operador || '---'}</td>
                      <td>{veh.tipoVehiculo ? veh.tipoVehiculo.charAt(0).toUpperCase() + veh.tipoVehiculo.slice(1) : '---'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {renderPaginado(total, setPaginaActual)}
          </div>
        </div>
      );
    }

    else {
      return <p style={{ padding: '1rem' }}>Contenido para la pestaña "{activeTab}" próximamente...</p>;
    }
  };

  return (
    <div className="caja">
      <Tabs
        activeTab={activeTab}
        onTabChange={handleCambioDePestania}
        searchTerm={searchTerm}
        setSearchTerm={(term) => {
          setSearchTerm(term);
          setPaginaActual(1); // reiniciar paginación al buscar
        }}
      />
      {renderContent()}
    </div>
  );
};

export default Caja;
