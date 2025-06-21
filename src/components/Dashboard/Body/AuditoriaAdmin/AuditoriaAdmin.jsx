import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { saveAs } from 'file-saver';
import { FiPlus } from 'react-icons/fi';
import '../Caja/Caja.css';
import './AuditoriaAdmin.css';

const ITEMS_POR_PAGINA = 10;

const ModalAudit = ({ titulo, onClose, children }) => {
  return (
    <div className="modal-backdrop-audit">
      <div className="modal-contenedor-audit">
        <div className="modal-header-audit">
          <h2>{titulo}</h2>
          <button className="modal-cerrar-audit" onClick={onClose}>X</button>
        </div>
        <div className="modal-body-audit">
          {children}
        </div>
      </div>
    </div>
  );
};

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
  const [vehiculosTemporales, setVehiculosTemporales] = useState([]);
  const [generandoAuditoria, setGenerandoAuditoria] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tiposVehiculo, setTiposVehiculo] = useState([]);
  const [nuevoVehiculo, setNuevoVehiculo] = useState({
    patente: '',
    marca: '',
    modelo: '',
    color: '',
    tipoVehiculo: 'auto'
  });
  const [user, setUser] = useState(null);

  // Función para abrir el modal que será expuesta al padre
  const abrirModalAgregarVehiculo = () => {
    setModalAbierto(true);
  };

  // Exponer funciones al padre mediante ref
  useImperativeHandle(ref, () => ({
    generarAuditoria,
    abrirModalAgregarVehiculo
  }));

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('https://api.garageia.com/api/auth/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        if (response.ok) {
          setUser(data);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    const cargarTiposVehiculo = async () => {
      try {
        const response = await fetch('https://api.garageia.com/api/tipos-vehiculo');
        const data = await response.json();
        setTiposVehiculo(data);
      } catch (err) {
        console.error('Error al cargar tipos de vehículo:', err);
      }
    };

    fetchUser();
    cargarTiposVehiculo();
    setPaginaActual(1);
  }, [activeCajaTab, searchTerm]);

  const crearAlertaConflicto = async (tipoConflicto) => {
    const fecha = new Date().toISOString().split('T')[0];
    const hora = new Date().toLocaleTimeString();
    
    const dataAlerta = {
      fecha,
      hora,
      tipoDeAlerta: `Conflicto Auditoría: ${tipoConflicto}`,
      operador: user?.nombre || 'Operador Desconocido',
    };

    try {
      const resAlerta = await fetch('https://api.garageia.com/api/alertas/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(dataAlerta),
      });

      if (!resAlerta.ok) {
        console.error('Error al crear la alerta de conflicto');
      }
    } catch (err) {
      console.error('Error al enviar la alerta:', err);
    }
  };

  const generarAuditoria = async () => {
    if (vehiculosSeleccionados.length === 0 && vehiculosTemporales.length === 0) {
      alert('Por favor seleccione al menos un vehículo para auditar o agregue vehículos temporales');
      return;
    }

    setGenerandoAuditoria(true);
    
    try {
      const operador = user?.nombre || 'Operador Desconocido';

      const idsNormales = vehiculosSeleccionados.filter(id => !id.toString().startsWith('temp-'));
      const vehiculosTemporalesAuditados = vehiculosTemporales;

      const response = await fetch('https://api.garageia.com/api/auditorias', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          vehiculos: idsNormales,
          vehiculosTemporales: vehiculosTemporalesAuditados,
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

      // Detección de conflictos
      const todosLosVehiculosEnSistema = vehiculos.length;
      const vehiculosNoVerificados = todosLosVehiculosEnSistema - idsNormales.length;
      const hayVehiculosTemporales = vehiculosTemporales.length > 0;
      
      if (vehiculosNoVerificados > 0 && hayVehiculosTemporales) {
        alert('Atención: Auditoría generada con CONFLICTO. Hay vehículos no verificados y vehículos temporales.');
        await crearAlertaConflicto('Vehículos no verificados y vehículos temporales agregados');
      } else if (vehiculosNoVerificados > 0) {
        alert('Atención: Auditoría generada con CONFLICTO. Hay vehículos no verificados.');
        await crearAlertaConflicto('Vehículos no verificados');
      } else if (hayVehiculosTemporales) {
        alert('Atención: Auditoría generada con CONFLICTO. Hay vehículos temporales agregados.');
        await crearAlertaConflicto('Vehículos temporales agregados');
      }

      setVehiculosSeleccionados([]);
      setVehiculosTemporales([]);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al generar el reporte de auditoría');
    } finally {
      setGenerandoAuditoria(false);
    }
  };

  const agregarVehiculoTemporal = () => {
    if (!nuevoVehiculo.patente) {
      alert('La patente es obligatoria');
      return;
    }

    const vehiculoTemporal = {
      ...nuevoVehiculo,
      _id: `temp-${Date.now()}`,
      esTemporal: true,
      estadiaActual: {
        entrada: new Date().toISOString(),
        operadorNombre: user?.nombre || 'Operador Temporal'
      }
    };

    setVehiculosTemporales(prev => [...prev, vehiculoTemporal]);
    setVehiculosSeleccionados(prev => [...prev, vehiculoTemporal._id]);
    
    setNuevoVehiculo({
      patente: '',
      marca: '',
      modelo: '',
      color: '',
      tipoVehiculo: 'auto'
    });
    setModalAbierto(false);
  };

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
                    <span className={`estado-badge estado-${item.estado?.toLowerCase() || 'pendiente'}`}>
                      {item.estado === 'OK' ? 'OK' : item.estado === 'Conflicto' ? 'Conflicto' : 'Pendiente'}
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
    const vehiculosCombinados = [...vehiculos, ...vehiculosTemporales];
    
    const filtrados = vehiculosCombinados
      .filter(veh => veh.estadiaActual?.entrada && !veh.estadiaActual?.salida)
      .filter(veh => {
        const patenteMatch = !searchTerm || veh.patente?.toUpperCase().includes(term);
        const horaEntrada = veh.estadiaActual?.entrada ? new Date(veh.estadiaActual.entrada).getHours() : null;
        const [desde, hasta] = filtros.horaEntrada ? filtros.horaEntrada.split("-").map(Number) : [null, null];
        const fechaDesdeDate = filtros.fechaDesde ? new Date(filtros.fechaDesde) : null;
        const fechaHastaDate = filtros.fechaHasta
          ? new Date(new Date(filtros.fechaHasta).setDate(new Date(filtros.fechaHasta).getDate() + 1))
          : null;
        const operadorMatch = !filtros.operador || 
          (veh.estadiaActual?.operadorNombre?.toLowerCase().includes(filtros.operador.toLowerCase()) ||
          (veh.esTemporal && user?.nombre.toLowerCase().includes(filtros.operador.toLowerCase())));

        return (
          patenteMatch &&
          operadorMatch &&
          (!filtros.tipoVehiculo || veh.tipoVehiculo === filtros.tipoVehiculo) &&
          (!filtros.horaEntrada || (horaEntrada && horaEntrada >= desde && horaEntrada < hasta)) &&
          (!filtros.fechaDesde || (veh.estadiaActual?.entrada && new Date(veh.estadiaActual.entrada) >= fechaDesdeDate)) &&
          (!filtros.fechaHasta || (veh.estadiaActual?.entrada && new Date(veh.estadiaActual.entrada) < fechaHastaDate))
        );
      })
      .reverse();
      
    const paginados = paginar(filtrados, paginaActual);
    const total = totalPaginas(filtrados);

    return (
      <>
        {modalAbierto && (
          <ModalAudit titulo="Agregar Vehículo Temporal" onClose={() => setModalAbierto(false)}>
            <div className="form-group-audit">
              <label>Patente*</label>
              <input
                type="text"
                value={nuevoVehiculo.patente}
                onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, patente: e.target.value})}
                placeholder="Ej: ABC123"
                required
                className="modal-input-audit"
              />
            </div>
            <div className="form-group-audit">
              <label>Marca</label>
              <input
                type="text"
                value={nuevoVehiculo.marca}
                onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, marca: e.target.value})}
                placeholder="Ej: Ford"
                className="modal-input-audit"
              />
            </div>
            <div className="form-group-audit">
              <label>Modelo</label>
              <input
                type="text"
                value={nuevoVehiculo.modelo}
                onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, modelo: e.target.value})}
                placeholder="Ej: Fiesta"
                className="modal-input-audit"
              />
            </div>
            <div className="form-group-audit">
              <label>Color</label>
              <input
                type="text"
                value={nuevoVehiculo.color}
                onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, color: e.target.value})}
                placeholder="Ej: Rojo"
                className="modal-input-audit"
              />
            </div>
            <div className="form-group-audit">
              <label>Tipo de Vehículo</label>
              <select
                value={nuevoVehiculo.tipoVehiculo}
                onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, tipoVehiculo: e.target.value})}
                className="modal-input-audit"
              >
                {tiposVehiculo.map(tipo => (
                  <option key={tipo} value={tipo}>
                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-botones-audit">
              <button onClick={() => setModalAbierto(false)} className="boton-cancelar-audit">
                Cancelar
              </button>
              <button onClick={agregarVehiculoTemporal} className="boton-confirmar-audit">
                Agregar
              </button>
            </div>
          </ModalAudit>
        )}

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
                  <th>Estado</th>
                  <th className="td-check"></th>
                </tr>
              </thead>
              <tbody>
                {paginados.map(veh => {
                  const entrada = veh.estadiaActual?.entrada ? new Date(veh.estadiaActual.entrada) : null;
                  let abonadoTurnoTexto = 'No';
                  if (veh.abonado) abonadoTurnoTexto = 'Abonado';
                  else if (veh.turno) abonadoTurnoTexto = 'Turno';
                  const esTemporal = veh._id.toString().startsWith('temp-');
                  const estaChequeado = vehiculosSeleccionados.includes(veh._id);

                  return (
                    <tr 
                      key={veh._id} 
                      className={`${estaChequeado ? 'checked' : ''} ${esTemporal ? 'vehiculo-temporal' : ''}`}
                    >
                      <td>{veh.patente?.toUpperCase() || '---'}</td>
                      <td>{entrada?.toLocaleDateString() || '---'}</td>
                      <td>{entrada?.toLocaleTimeString() || '---'}</td>
                      <td>{veh.estadiaActual?.operadorNombre || (esTemporal ? user?.nombre : '---')}</td>
                      <td>{veh.tipoVehiculo ? veh.tipoVehiculo[0].toUpperCase() + veh.tipoVehiculo.slice(1) : '---'}</td>
                      <td>{abonadoTurnoTexto}</td>
                      <td>{esTemporal ? 'Temporal' : 'Sistema'}</td>
                      <td className="td-checkbox">
                        <label className="checkbox-container">
                          <input
                            type="checkbox"
                            checked={esTemporal || estaChequeado}
                            onChange={() => !esTemporal && handleCheckboxChange(veh._id)}
                            disabled={esTemporal}
                          />
                          <span className="checkmark"></span>
                        </label>
                      </td>
                    </tr>
                  );
                })}
                {renderFilasVacias(ITEMS_POR_PAGINA - paginados.length, 8)}
              </tbody>
            </table>
            {renderPaginado(total)}
          </div>
        </div>
      </>
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