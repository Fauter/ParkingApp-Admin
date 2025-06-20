import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { saveAs } from 'file-saver';
import '../Caja/Caja.css';

const ITEMS_POR_PAGINA = 10;

const AuditoriaAdmin = forwardRef(({
  activeCajaTab,
  searchTerm,
  onCajaTabChange,
  limpiarFiltros,
  filtros,
  auditorias = [],
  vehiculos = []
}, ref) => {
  const [paginaActual, setPaginaActual] = useState(1);
  const [vehiculosSeleccionados, setVehiculosSeleccionados] = useState([]);
  const [generandoAuditoria, setGenerandoAuditoria] = useState(false);

  useEffect(() => {
    setPaginaActual(1);
  }, [activeCajaTab, searchTerm]);

  // Exponer funciones al padre mediante ref
  useImperativeHandle(ref, () => ({
    generarAuditoria: async () => {
      if (vehiculosSeleccionados.length === 0) {
        alert('Por favor seleccione al menos un vehículo para auditar');
        return;
      }

      setGenerandoAuditoria(true);
      
      try {
        const operador = localStorage.getItem('userName') || 'Operador Desconocido';

        const response = await fetch('https://api.garageia.com/api/auditorias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            vehiculos: vehiculosSeleccionados,
            operador 
          }),
        });

        if (!response.ok) throw new Error('Error al generar auditoría');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `auditoria-vehiculos-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        // Limpiar selección después de generar la auditoría
        setVehiculosSeleccionados([]);
      } catch (error) {
        console.error('Error:', error);
        alert('Error al generar el reporte de auditoría');
      } finally {
        setGenerandoAuditoria(false);
      }
    }
  }));

  const aplicarFiltros = (datos) => {
    if (!Array.isArray(datos)) return [];
    
    return datos.filter(item => {
      if (!item) return false;
      
      const searchMatch = item.operador?.toUpperCase().includes(searchTerm.trim().toUpperCase());
      const operadorMatch = !filtros.operador || 
        item.operador?.toLowerCase().includes(filtros.operador.toLowerCase());
      
      const estadoMatch = !filtros.estado || 
        item.estado?.toLowerCase() === filtros.estado.toLowerCase();
      
      let horaMatch = true;
      if (filtros.hora && item.fechaHora) {
        const [desde, hasta] = filtros.hora.split('-').map(Number);
        const horaItem = new Date(item.fechaHora).getHours();
        horaMatch = horaItem >= desde && horaItem < hasta;
      }
      
      let fechaMatch = true;
      if (filtros.fecha && item.fechaHora) {
        const fechaItem = new Date(item.fechaHora).toISOString().split('T')[0];
        fechaMatch = fechaItem === filtros.fecha;
      }
      
      let rangoFechaMatch = true;
      if ((filtros.fechaDesde || filtros.fechaHasta) && item.fechaHora) {
        const fechaItem = new Date(item.fechaHora);
        const fechaDesde = filtros.fechaDesde ? new Date(filtros.fechaDesde) : null;
        const fechaHasta = filtros.fechaHasta
          ? new Date(new Date(filtros.fechaHasta).setDate(new Date(filtros.fechaHasta).getDate() + 1))
          : null;
        
        if (fechaDesde) rangoFechaMatch = fechaItem >= fechaDesde;
        if (fechaHasta) rangoFechaMatch = rangoFechaMatch && fechaItem < fechaHasta;
      }
      
      return searchMatch && operadorMatch && estadoMatch && horaMatch && fechaMatch && rangoFechaMatch;
    });
  };

  const formatFecha = (fechaHora) => {
    if (!fechaHora) return '---';
    try {
      const fecha = new Date(fechaHora);
      return fecha.toLocaleDateString('es-AR');
    } catch {
      return '---';
    }
  };

  const formatHora = (fechaHora) => {
    if (!fechaHora) return '---';
    try {
      const fecha = new Date(fechaHora);
      return fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '---';
    }
  };

  const formatNombreArchivo = (nombreArchivo) => {
    if (!nombreArchivo) return '---';
    return nombreArchivo;
  };

  const paginar = (array, pagina) => {
    if (!Array.isArray(array)) return [];
    const startIndex = (pagina - 1) * ITEMS_POR_PAGINA;
    return array.slice(startIndex, startIndex + ITEMS_POR_PAGINA);
  };

  const totalPaginas = (array) => {
    if (!Array.isArray(array)) return 1;
    return Math.ceil(array.length / ITEMS_POR_PAGINA);
  };

  const renderPaginado = (total) => (
    <div className="paginado">
      <button disabled={paginaActual === 1} onClick={() => setPaginaActual(paginaActual - 1)}>Anterior</button>
      <span>Página {paginaActual} de {total}</span>
      <button disabled={paginaActual === total || total === 0} onClick={() => setPaginaActual(paginaActual + 1)}>Siguiente</button>
    </div>
  );

  const renderFilasVacias = (cantidad, columnas) =>
    Array.from({ length: cantidad }, (_, i) => (
      <tr key={`empty-${i}`}>
        {Array.from({ length: columnas }, (_, j) => <td key={j}>---</td>)}
      </tr>
    ));

  const handleCheckboxChange = (vehiculoId) => {
    setVehiculosSeleccionados(prev => {
      if (prev.includes(vehiculoId)) {
        return prev.filter(id => id !== vehiculoId);
      } else {
        return [...prev, vehiculoId];
      }
    });
  };

  const descargarAuditoria = async (auditoria, e) => {
    e.preventDefault();
    try {
      if (!auditoria._id) {
        throw new Error('No hay ID de auditoría disponible');
      }
      
      const response = await fetch(`https://api.garageia.com/api/auditorias/descargar/${auditoria._id}`);
      if (!response.ok) throw new Error('Error al descargar el archivo');
      
      const blob = await response.blob();
      saveAs(blob, auditoria.auditoria.nombreArchivo || `auditoria-${auditoria._id}.pdf`);
    } catch (error) {
      console.error('Error al descargar auditoría:', error);
      alert(error.message || 'Error al descargar el archivo de auditoría');
    }
  };

  const renderTablaHistorico = () => {
    const datosAuditorias = Array.isArray(auditorias) ? auditorias : [];
    const filtrados = aplicarFiltros(datosAuditorias).sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora));
    const paginados = paginar(filtrados, paginaActual);
    const total = totalPaginas(filtrados);

    return (
      <div className="table-container">
        <div className="table-wrapper">
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Operador</th>
                <th>Auditoría</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {paginados.map((item) => (
                <tr key={item._id || Math.random()}>
                  <td>{formatFecha(item.fechaHora)}</td>
                  <td>{formatHora(item.fechaHora)}</td>
                  <td>{item.operador || '---'}</td>
                  <td className="celda-archivo">
                    {item.auditoria?.path ? (
                      <a 
                        href="#"
                        onClick={(e) => descargarAuditoria(item, e)}
                        className="enlace-auditoria"
                        title={item.auditoria.nombreArchivo || 'Descargar auditoría'}
                      >
                        {formatNombreArchivo(item.auditoria.nombreArchivo || 'Auditoria.pdf')}
                      </a>
                    ) : '---'}
                  </td>
                  <td>
                    <span className={`estado-badge estado-${item.estado || 'pendiente'}`}>
                      {item.estado || '---'}
                    </span>
                  </td>
                </tr>
              ))}
              {renderFilasVacias(ITEMS_POR_PAGINA - paginados.length, 5)}
            </tbody>
          </table>
          {renderPaginado(total)}
        </div>
      </div>
    );
  };

  const renderTablaNuevaAuditoria = () => {
    const term = searchTerm.toUpperCase();
    const filtrados = vehiculos
      .filter(veh => veh.estadiaActual?.entrada && !veh.estadiaActual?.salida)
      .filter(veh => {
        const patenteMatch = !searchTerm || veh.patente?.toUpperCase().includes(term);
        const horaEntrada = new Date(veh.estadiaActual.entrada).getHours();
        const [desde, hasta] = filtros.horaEntrada ? filtros.horaEntrada.split("-").map(Number) : [null, null];
        const fechaDesdeDate = filtros.fechaDesde ? new Date(filtros.fechaDesde) : null;
        const fechaHastaDate = filtros.fechaHasta
          ? new Date(new Date(filtros.fechaHasta).setDate(new Date(filtros.fechaHasta).getDate() + 1))
          : null;
        const operadorMatch = !filtros.operador || veh.estadiaActual.operadorNombre?.toLowerCase().includes(filtros.operador.toLowerCase());

        return (
          patenteMatch &&
          operadorMatch &&
          (!filtros.tipoVehiculo || veh.tipoVehiculo === filtros.tipoVehiculo) &&
          (!filtros.horaEntrada || (horaEntrada >= desde && horaEntrada < hasta)) &&
          (!filtros.fechaDesde || new Date(veh.estadiaActual.entrada) >= fechaDesdeDate) &&
          (!filtros.fechaHasta || new Date(veh.estadiaActual.entrada) < fechaHastaDate)
        )
      })
      .reverse();
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
                <th className="td-check"></th>
              </tr>
            </thead>
            <tbody>
              {paginados.map(veh => {
                const entrada = veh.estadiaActual?.entrada ? new Date(veh.estadiaActual.entrada) : null;
                let abonadoTurnoTexto = 'No';
                if (veh.abonado) abonadoTurnoTexto = 'Abonado';
                else if (veh.turno) abonadoTurnoTexto = 'Turno';

                return (
                  <tr key={veh._id} className={vehiculosSeleccionados.includes(veh._id) ? 'checked' : ''}>
                    <td>{veh.patente?.toUpperCase() || '---'}</td>
                    <td>{entrada?.toLocaleDateString() || '---'}</td>
                    <td>{entrada?.toLocaleTimeString() || '---'}</td>
                    <td>{veh.estadiaActual.operadorNombre || '---'}</td>
                    <td>{veh.tipoVehiculo ? veh.tipoVehiculo[0].toUpperCase() + veh.tipoVehiculo.slice(1) : '---'}</td>
                    <td>{abonadoTurnoTexto}</td>
                    <td className="td-checkbox">
                      <label className="checkbox-container">
                        <input
                          type="checkbox"
                          checked={vehiculosSeleccionados.includes(veh._id)}
                          onChange={() => handleCheckboxChange(veh._id)}
                        />
                        <span className="checkmark"></span>
                      </label>
                    </td>
                  </tr>
                );
              })}
              {renderFilasVacias(ITEMS_POR_PAGINA - paginados.length, 7)}
            </tbody>
          </table>
          {renderPaginado(total)}
        </div>
      </div>
    );
  };

  return (
    <div className="caja">
      {activeCajaTab === 'Histórico' && renderTablaHistorico()}
      {activeCajaTab === 'Nueva Auditoría' && renderTablaNuevaAuditoria()}
    </div>
  );
});

export default AuditoriaAdmin;