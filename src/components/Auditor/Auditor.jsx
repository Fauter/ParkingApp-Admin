import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveAs } from 'file-saver';
import { FiPlus } from 'react-icons/fi';
import './Auditor.css';

const ITEMS_POR_PAGINA = 10;

/* =========================
   Utils
========================= */
function decodeJWT(token) {
  if (!token) return null;
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function formatFecha(fechaHora) {
  if (!fechaHora) return '---';
  try {
    const fecha = new Date(fechaHora);
    return fecha.toLocaleDateString('es-AR');
  } catch {
    return '---';
  }
}

function formatHora(fechaHora) {
  if (!fechaHora) return '---';
  try {
    const fecha = new Date(fechaHora);
    return fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '---';
  }
}

/* =========================
   Modal
========================= */
function ModalAudit({ titulo, onClose, children }) {
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
}

/* =========================
   Main Component
========================= */
export default function Auditor() {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem('token'), []);
  const decoded = useMemo(() => decodeJWT(token) || {}, [token]);
  const email = decoded?.email || decoded?.user || 'auditor';

  const [activeTab, setActiveTab] = useState('Histórico'); // 'Histórico' | 'Nueva Auditoría'
  const [loading, setLoading] = useState(false);

  // filtros compactos (según pedido)
  const [searchTerm, setSearchTerm] = useState(''); // SOLO para "Nueva Auditoría" (patente)
  const [filtros, setFiltros] = useState({
    // Histórico
    fecha: '',     // exacta
    hora: '',      // rango
    estado: '',    // OK | Conflicto | Pendiente
    // Nueva Auditoría
    fechaNA: '',       // exacta
    horaEntrada: '',   // rango
    tipoVehiculo: '',  // string
  });

  // dropdown perfil
  const [openMenu, setOpenMenu] = useState(false);

  // data
  const [user, setUser] = useState(null);
  const [tiposVehiculo, setTiposVehiculo] = useState([]);
  const [auditorias, setAuditorias] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);

  // estado Nueva Auditoría
  const [paginaActual, setPaginaActual] = useState(1);
  const [vehiculosSeleccionados, setVehiculosSeleccionados] = useState([]);
  const [vehiculosTemporales, setVehiculosTemporales] = useState([]);
  const [generandoAuditoria, setGenerandoAuditoria] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevoVehiculo, setNuevoVehiculo] = useState({
    patente: '',
    marca: '',
    modelo: '',
    color: '',
    tipoVehiculo: 'auto'
  });

  /* =========================
     Effects: fetch básicos
  ========================= */
  useEffect(() => {
    const fetchUser = async () => {
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
        if (response.ok) setUser(data);
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };

    const cargarTiposVehiculo = async () => {
      try {
        const response = await fetch('https://api.garageia.com/api/tipos-vehiculo');
        const data = await response.json();
        setTiposVehiculo(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error al cargar tipos de vehículo:', err);
      }
    };

    const cargarAuditorias = async () => {
      try {
        const response = await fetch('https://api.garageia.com/api/auditorias', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setAuditorias(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error al cargar auditorías:', err);
      }
    };

    const cargarVehiculos = async () => {
      try {
        // Si tu API tiene un endpoint específico para "en playa", reemplazalo aquí
        const response = await fetch('https://api.garageia.com/api/vehiculos', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setVehiculos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error al cargar vehículos:', err);
      }
    };

    setLoading(true);
    Promise.all([fetchUser(), cargarTiposVehiculo(), cargarAuditorias(), cargarVehiculos()])
      .finally(() => setLoading(false));
  }, [token]);

  // reset paginado al cambiar de tab o filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [activeTab, searchTerm, filtros.fecha, filtros.hora, filtros.estado, filtros.fechaNA, filtros.horaEntrada, filtros.tipoVehiculo]);

  /* =========================
     Helpers core (idéntica lógica)
  ========================= */
  const crearAlertaConflicto = async (tipoConflicto) => {
    const fecha = new Date().toISOString().split('T')[0];
    const hora = new Date().toLocaleTimeString('es-AR');

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
          Authorization: `Bearer ${token}`,
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
          'Authorization': `Bearer ${token}`
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

      // Reset selección y temporales
      setVehiculosSeleccionados([]);
      setVehiculosTemporales([]);
      // Refrescar histórico
      try {
        const histRes = await fetch('https://api.garageia.com/api/auditorias', { headers: { Authorization: `Bearer ${token}` }});
        const histData = await histRes.json();
        setAuditorias(Array.isArray(histData) ? histData : []);
      } catch {}
      setActiveTab('Histórico');
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

  const aplicarFiltrosHistorico = (datos) => {
    if (!Array.isArray(datos)) return [];
    return datos.filter(item => {
      if (!item) return false;

      // Fecha exacta
      let fechaMatch = true;
      if (filtros.fecha && item.fechaHora) {
        const fechaItem = new Date(item.fechaHora).toISOString().split('T')[0];
        fechaMatch = fechaItem === filtros.fecha;
      }

      // Rango de hora
      let horaMatch = true;
      if (filtros.hora && item.fechaHora) {
        const [desde, hasta] = filtros.hora.split('-').map(Number);
        const horaItem = new Date(item.fechaHora).getHours();
        horaMatch = horaItem >= desde && horaItem < hasta;
      }

      // Estado
      const estadoMatch = !filtros.estado || (item.estado?.toLowerCase() === filtros.estado.toLowerCase());

      return fechaMatch && horaMatch && estadoMatch;
    });
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
      if (!auditoria._id) throw new Error('No hay ID de auditoría disponible');
      const response = await fetch(`https://api.garageia.com/api/auditorias/descargar/${auditoria._id}`);
      if (!response.ok) throw new Error('Error al descargar el archivo');
      const blob = await response.blob();
      const nombre = auditoria.auditoria?.nombreArchivo || `auditoria-${auditoria._id}.pdf`;
      saveAs(blob, nombre);
    } catch (error) {
      console.error('Error al descargar auditoría:', error);
      alert(error.message || 'Error al descargar el archivo de auditoría');
    }
  };

  /* =========================
     Vistas
  ========================= */
  const VistaHistorico = () => {
    const datos = Array.isArray(auditorias) ? auditorias : [];
    const filtrados = aplicarFiltrosHistorico(datos).sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora));
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
                        title={item.auditoria?.nombreArchivo || 'Descargar auditoría'}
                      >
                        {item.auditoria?.nombreArchivo || 'Auditoria.pdf'}
                      </a>
                    ) : '---'}
                  </td>
                  <td>
                    <span className={`estado-badge estado-${(item.estado || 'pendiente').toLowerCase()}`}>
                      {item.estado === 'OK' ? 'OK' : item.estado === 'Conflicto' ? 'Conflicto' : 'Pendiente'}
                    </span>
                  </td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, ITEMS_POR_PAGINA - paginados.length) }, (_, i) => (
                <tr key={`empty-h-${i}`}>
                  {Array.from({ length: 5 }, (_, j) => <td key={j}>---</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {renderPaginado(total)}
        </div>
      </div>
    );
  };

  const VistaNuevaAuditoria = () => {
    const term = searchTerm.toUpperCase();
    const vehiculosCombinados = [...vehiculos, ...vehiculosTemporales];

    const filtrados = vehiculosCombinados
      .filter(veh => veh.estadiaActual?.entrada && !veh.estadiaActual?.salida)
      .filter(veh => {
        const patenteMatch = !searchTerm || veh.patente?.toUpperCase().includes(term);

        // fecha exacta
        let fechaMatch = true;
        if (filtros.fechaNA) {
          const fechaItem = veh.estadiaActual?.entrada
            ? new Date(veh.estadiaActual.entrada).toISOString().split('T')[0]
            : null;
          fechaMatch = !filtros.fechaNA || (fechaItem === filtros.fechaNA);
        }

        // rango hora entrada
        const horaEntrada = veh.estadiaActual?.entrada ? new Date(veh.estadiaActual.entrada).getHours() : null;
        const [desde, hasta] = filtros.horaEntrada ? filtros.horaEntrada.split("-").map(Number) : [null, null];
        const horaMatch = !filtros.horaEntrada || (horaEntrada && horaEntrada >= desde && horaEntrada < hasta);

        // tipo
        const tipoMatch = !filtros.tipoVehiculo || veh.tipoVehiculo === filtros.tipoVehiculo;

        return patenteMatch && fechaMatch && horaMatch && tipoMatch;
      })
      .reverse();

    const paginados = paginar(filtrados, paginaActual);
    const total = totalPaginas(filtrados);

    const logout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('redirectAfterLogin');
      navigate('/login', { replace: true });
    };

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
                {tiposVehiculo.map((tipo, idx) => {
                  const label = (typeof tipo === 'string' ? tipo : tipo?.nombre) || 'auto';
                  const value = (typeof tipo === 'string' ? tipo : tipo?.nombre) || 'auto';
                  return <option key={idx} value={value}>{label.charAt(0).toUpperCase() + label.slice(1)}</option>;
                })}
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

        <div className="audit-toolbar">
          <div className="toolbar-left">
            <button className="register-audit-button" onClick={generarAuditoria} disabled={generandoAuditoria}>
              {generandoAuditoria ? 'Generando...' : 'Generar Auditoría'}
            </button>
            <button className="register-audit-button add-button" title="Agregar vehículo temporal" onClick={() => setModalAbierto(true)}>
              <FiPlus className="plus-icon" />
            </button>
          </div>
        </div>

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
                  const esTemporal = veh._id?.toString().startsWith('temp-');
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
                {Array.from({ length: Math.max(0, ITEMS_POR_PAGINA - paginados.length) }, (_, i) => (
                  <tr key={`empty-n-${i}`}>
                    {Array.from({ length: 8 }, (_, j) => <td key={j}>---</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            {renderPaginado(total)}
          </div>
        </div>
      </>
    );
  };

  /* =========================
     Header + Filtros + Tabs
  ========================= */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('redirectAfterLogin');
    navigate('/login', { replace: true });
  };

  const limpiarFiltros = () => {
    setFiltros({
      fecha: '',
      hora: '',
      estado: '',
      fechaNA: '',
      horaEntrada: '',
      tipoVehiculo: '',
    });
    setSearchTerm('');
  };

  return (
    <div className="auditor-wrap">
      {/* Header que respeta Header.css */}
      <div className="header-container">
        <div className="header">
          <div className="header-left">
            <div className="logo-container">
              <span className="header-title">Auditoría</span>
            </div>
            <nav>
              <a
                href="#!"
                className={activeTab === 'Histórico' ? 'active' : ''}
                onClick={() => setActiveTab('Histórico')}
              >
                Histórico
              </a>
              <a
                href="#!"
                className={activeTab === 'Nueva Auditoría' ? 'active' : ''}
                onClick={() => setActiveTab('Nueva Auditoría')}
              >
                Nueva Auditoría
              </a>
            </nav>
          </div>

          <div className="header-right">
            {/* (Opcional) Search del header si quisieras activarlo */}
            {/* <div className="search-bar">
              <span className="search-icon">🔎</span>
              <input placeholder="Buscar..." />
            </div> */}
            <div className="profile-container" onClick={() => setOpenMenu(v => !v)}>
              <div
                className="profile-pic"
                title={email}
                style={{ backgroundImage: 'url(https://ui-avatars.com/api/?name=AU&background=497b97&color=fff)' }}
              />
              {openMenu && (
                <div className="dropdown-menu" onMouseLeave={() => setOpenMenu(false)}>
                  <button onClick={logout}>Salir</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="aud-main">
        {/* Barra de filtros (solo lo necesario) */}
        <div className="aud-topbar">
          <div className="filters">
            {activeTab === 'Histórico' ? (
              <>
                <input
                  className="filter-input"
                  type="date"
                  value={filtros.fecha}
                  onChange={e => setFiltros(s => ({ ...s, fecha: e.target.value }))}
                />
                <select
                  className="filter-input"
                  value={filtros.hora}
                  onChange={e => setFiltros(s => ({ ...s, hora: e.target.value }))}
                >
                  <option value="">Hora (rango)</option>
                  <option value="0-6">00-06</option>
                  <option value="6-12">06-12</option>
                  <option value="12-18">12-18</option>
                  <option value="18-24">18-24</option>
                </select>
                <select
                  className="filter-input"
                  value={filtros.estado}
                  onChange={e => setFiltros(s => ({ ...s, estado: e.target.value }))}
                >
                  <option value="">Estado</option>
                  <option value="OK">OK</option>
                  <option value="Conflicto">Conflicto</option>
                  <option value="Pendiente">Pendiente</option>
                </select>
                <button className="filter-clear" onClick={limpiarFiltros}>Limpiar</button>
              </>
            ) : (
              <>
                <input
                  className="filter-input"
                  placeholder="Buscar por Patente"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <input
                  className="filter-input"
                  type="date"
                  value={filtros.fechaNA}
                  onChange={e => setFiltros(s => ({ ...s, fechaNA: e.target.value }))}
                />
                <select
                  className="filter-input"
                  value={filtros.horaEntrada}
                  onChange={e => setFiltros(s => ({ ...s, horaEntrada: e.target.value }))}
                >
                  <option value="">Hora Entrada</option>
                  <option value="0-6">00-06</option>
                  <option value="6-12">06-12</option>
                  <option value="12-18">12-18</option>
                  <option value="18-24">18-24</option>
                </select>
                <select
                  className="filter-input"
                  value={filtros.tipoVehiculo}
                  onChange={e => setFiltros(s => ({ ...s, tipoVehiculo: e.target.value }))}
                >
                  <option value="">Tipo</option>
                  {tiposVehiculo.map((tipo, idx) => {
                    const label = (typeof tipo === 'string' ? tipo : tipo?.nombre) || 'auto';
                    const value = (typeof tipo === 'string' ? tipo : tipo?.nombre) || 'auto';
                    return <option key={idx} value={value}>{label.charAt(0).toUpperCase() + label.slice(1)}</option>;
                  })}
                </select>
                <button className="filter-clear" onClick={limpiarFiltros}>Limpiar</button>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading">Cargando…</div>
        ) : activeTab === 'Histórico' ? (
          <VistaHistorico />
        ) : (
          <VistaNuevaAuditoria />
        )}
      </main>
    </div>
  );
}
