import React, { useState, useEffect, useRef } from 'react';
import Tabs from '../Tabs/Tabs';
import './Caja.css';

const ITEMS_POR_PAGINA = 10;

// 🔒 Defensa: normaliza cualquier variante de "operador" a texto legible
const normalizarOperador = (op) => {
  if (!op) return '---';
  if (typeof op === 'string') {
    if (op === '[object Object]') return '---';
    // Si quedó un ObjectId porque el backend viejo no normalizó
    if (/^[0-9a-fA-F]{24}$/.test(op)) return '---';
    return op;
  }
  if (typeof op === 'object') {
    return op.nombre || op.name || op.username || op.email || op._id || '---';
  }
  return String(op);
};

/** ================================
 *  FECHAS (CREACIÓN DEL MOVIMIENTO)
 *  ================================
 *  ⚠️ SOLO usamos createdAt; si no hay, usamos fecha.
 *  ❌ Nunca usamos updatedAt para evitar “hora actual”.
 */

// 🕒 Helper: Fecha/hora de creación del movimiento en AR, sin año
function fmtMovimientoFecha(mov) {
  const src = mov?.createdAt || mov?.fecha; // ← sin updatedAt
  if (!src) return '---';
  const d = new Date(src);
  if (isNaN(d)) return '---';
  const tz = 'America/Argentina/Buenos_Aires';

  const ddmm = new Intl.DateTimeFormat('es-AR', {
    timeZone: tz,
    day: '2-digit',
    month: '2-digit',
  }).format(d); // ej: 29/08

  const hhmm = new Intl.DateTimeFormat('es-AR', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d); // ej: 17:51

  return `${ddmm} ${hhmm}`; // "29/08 17:51"
}

// ⏱️ Helper: timestamp (ms) de creación del movimiento
function movCreatedTs(mov) {
  const src = mov?.createdAt || mov?.fecha; // ← sin updatedAt
  const t = src ? new Date(src).getTime() : NaN;
  return Number.isFinite(t) ? t : -Infinity;
}

// ⏱️ Helper: timestamp (ms) de entrada de estadía
function entradaTs(veh) {
  const src = veh?.estadiaActual?.entrada;
  const t = src ? new Date(src).getTime() : NaN;
  return Number.isFinite(t) ? t : -Infinity;
}

// 🧮 rango horario "a-b" vs Date
function hourRangeMatches(dateObj, rangeStr) {
  if (!dateObj || !rangeStr) return true;
  const h = dateObj.getHours();
  const [a, b] = rangeStr.split('-').map(Number);
  return h >= a && h < b;
}

const Caja = ({
  movimientos = [],
  vehiculos = [],
  alertas = [],
  incidentes = [],
  limpiarFiltros,
  activeCajaTab = 'Caja',
  isSearchBarVisible = true,
  // ➕ Recibimos filtros para aplicar horaEntradaMov/horaSalidaMov
  filtros = {}
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [modalFotoUrl, setModalFotoUrl] = useState(null);
  const [estadiaCache, setEstadiaCache] = useState({});
  const fetchingTickets = useRef({});

  useEffect(() => {
    setPaginaActual(1);
  }, [searchTerm, activeCajaTab, filtros.horaEntradaMov, filtros.horaSalidaMov]);

  const fetchEstadiaByTicket = async (ticket) => {
    if (!ticket || fetchingTickets.current[ticket] || estadiaCache[ticket]) return;

    fetchingTickets.current[ticket] = true;
    setEstadiaCache((prev) => ({
      ...prev,
      [ticket]: { data: null, loading: true, error: null }
    }));

    try {
      const res = await fetch(`https://api.garageia.com/api/vehiculos/ticket-admin/${ticket}`);
      if (!res.ok) throw new Error(`Error al obtener estadía ticket ${ticket}`);
      const json = await res.json();

      setEstadiaCache((prev) => ({
        ...prev,
        [ticket]: { data: json.estadia, loading: false, error: null }
      }));
    } catch (error) {
      setEstadiaCache((prev) => ({
        ...prev,
        [ticket]: { data: null, loading: false, error: error.message }
      }));
    } finally {
      fetchingTickets.current[ticket] = false;
    }
  };

  const abrirFoto = (url) => {
    if (!url) return;
    const baseBackendUrl = 'https://api.garageia.com';
    const urlCompleta = url.startsWith('/') ? baseBackendUrl + url : url;
    const urlConTimestamp = `${urlCompleta}?t=${Date.now()}`;
    setModalFotoUrl(urlConTimestamp);
  };

  const cerrarModal = () => setModalFotoUrl(null);

  const paginar = (array, pagina) => {
    const startIndex = (pagina - 1) * ITEMS_POR_PAGINA;
    return array.slice(startIndex, startIndex + ITEMS_POR_PAGINA);
  };

  const totalPaginas = (array) => Math.ceil(array.length / ITEMS_POR_PAGINA);

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

  // Pre-carga de estadías PARA LA PÁGINA ACTUAL ya ordenada por fecha de movimiento
  useEffect(() => {
    if (activeCajaTab !== 'Caja') return;

    // Si NO hay filtros por entrada/salida (movimientos), prefetch sólo la página
    if (!filtros?.horaEntradaMov && !filtros?.horaSalidaMov) {
      const term = searchTerm.toUpperCase();
      // Filtramos por patente y ORDENAMOS por fecha de movimiento DESC
      const preliminares = movimientos
        .filter(mov => (mov.patente || '').toUpperCase().includes(term))
        .sort((a, b) => movCreatedTs(b) - movCreatedTs(a));

      const paginados = paginar(preliminares, paginaActual);

      paginados.forEach(mov => {
        if (mov.ticket != null) fetchEstadiaByTicket(mov.ticket);
      });
    }
  }, [activeCajaTab, movimientos, paginaActual, searchTerm, filtros?.horaEntradaMov, filtros?.horaSalidaMov]);

  // Si hay filtros de hora de ENTRADA/SALIDA (en movimientos), necesitamos la estadía de todos los movimientos visibles (post filtro básico + search)
  useEffect(() => {
    if (activeCajaTab !== 'Caja') return;
    const needsEntrada = Boolean(filtros?.horaEntradaMov);
    const needsSalida  = Boolean(filtros?.horaSalidaMov);
    if (!needsEntrada && !needsSalida) return;

    const term = searchTerm.toUpperCase();
    const objetivos = movimientos
      .filter(mov => (mov.patente || '').toUpperCase().includes(term));

    objetivos.forEach(mov => {
      if (mov.ticket != null) fetchEstadiaByTicket(mov.ticket);
    });
  }, [activeCajaTab, movimientos, searchTerm, filtros?.horaEntradaMov, filtros?.horaSalidaMov]);

  const renderTablaCaja = () => {
    const term = searchTerm.toUpperCase();

    // 1) filtro por patente
    let filtrados = movimientos
      .filter(mov => (mov.patente || '').toUpperCase().includes(term));

    // 2) si hay filtros de horaEntradaMov / horaSalidaMov, aplicarlos usando estadía
    if (filtros?.horaEntradaMov || filtros?.horaSalidaMov) {
      filtrados = filtrados.filter(mov => {
        if (!mov.ticket) return false; // sin ticket no hay entrada/salida asociada
        const info = estadiaCache[mov.ticket];
        const est  = info?.data;

        // si aún no cargó la estadía, por ahora NO lo mostramos (filtro estricto)
        if (!est) return false;

        const okEntrada = !filtros.horaEntradaMov || (est.entrada && hourRangeMatches(new Date(est.entrada), filtros.horaEntradaMov));
        const okSalida  = !filtros.horaSalidaMov  || (est.salida  && hourRangeMatches(new Date(est.salida),  filtros.horaSalidaMov));
        return okEntrada && okSalida;
      });
    }

    // 3) ORDENAR SIEMPRE POR FECHA DEL MOVIMIENTO DESC (más nuevos arriba)
    filtrados.sort((a, b) => movCreatedTs(b) - movCreatedTs(a));

    // 4) paginar
    const paginados = paginar(filtrados, paginaActual);
    const total = totalPaginas(filtrados);

    return (
      <div className="table-container">
        <div className="table-wrapper">
          <table className="transaction-table caja-table">
            <thead>
              <tr>
                <th>Patente</th>
                <th>Fecha</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Descripción</th>
                <th>Operador</th>
                <th>Tipo de Vehículo</th>
                <th>Método de Pago</th>
                <th>Factura</th>
                <th>Monto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginados.map(movimiento => {
                // ⬇️ Fechas para la estadía (solo para mostrar Entrada/Salida si hay ticket)
                const estadiaInfo = movimiento.ticket ? estadiaCache[movimiento.ticket] : null;
                const estadia = estadiaInfo?.data || null;
                const loading = estadiaInfo?.loading || false;
                const error = estadiaInfo?.error || null;

                const entrada = estadia?.entrada ? new Date(estadia.entrada) : null;
                const salida = estadia?.salida ? new Date(estadia.salida) : null;
                const fotoUrl = estadia?.fotoUrl;

                // ⬇️ Patente y monto con defensas
                const patenteKey = movimiento.patente ? movimiento.patente.toUpperCase() : null;
                const montoSeguro = typeof movimiento.monto === 'number' ? movimiento.monto : 0;

                return (
                  <tr key={movimiento._id}>
                    <td>{patenteKey || '---'}</td>

                    {/* ✅ Fecha de creación del movimiento (sin año) */}
                    <td>{fmtMovimientoFecha(movimiento)}</td>

                    {/* ℹ️ Entrada/Salida (solo referencia visual de la estadía) */}
                    <td>{loading ? 'Cargando...' : error ? 'Error' : (entrada?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '---')}</td>
                    <td>{loading ? 'Cargando...' : error ? 'Error' : (salida?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '---')}</td>

                    <td>{movimiento.descripcion || '---'}</td>
                    <td>{movimiento.operador || '---'}</td>
                    <td>{movimiento.tipoVehiculo ? movimiento.tipoVehiculo[0].toUpperCase() + movimiento.tipoVehiculo.slice(1) : '---'}</td>
                    <td>{movimiento.metodoPago || '---'}</td>
                    <td>{movimiento.factura || '---'}</td>
                    <td>{montoSeguro === 0 ? '---' : `$${montoSeguro.toLocaleString('es-AR')}`}</td>
                    <td>
                      {loading && '...'}
                      {!loading && fotoUrl && (
                        <button 
                          onClick={() => abrirFoto(fotoUrl)} 
                          title="Ver foto"
                          className="btn-ver-foto"
                        >
                          Foto
                        </button>
                      )}
                      {!loading && !fotoUrl && '---'}
                      {!loading && error && '⚠️'}
                    </td>
                  </tr>
                );
              })}
              {renderFilasVacias(ITEMS_POR_PAGINA - paginados.length, 11)}
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
      .filter(veh => (veh.patente || '').toUpperCase().includes(term))
      .sort((a, b) => entradaTs(b) - entradaTs(a)); // ⬅️ más reciente por hora de entrada
    const paginados = paginar(filtrados, paginaActual);
    const total = totalPaginas(filtrados);

    return (
      <div className="table-container">
        <div className="table-wrapper">
          <table className="transaction-table ingresos-table">
            <thead>
              <tr>
                <th>Patente</th>
                <th>Fecha</th>
                <th>Hora Entrada</th>
                <th>Operador</th>
                <th>Tipo de Vehículo</th>
                <th>Abonado/Turno</th>
                <th></th>
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
                    <td>{entrada?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '---'}</td>
                    <td>{veh.estadiaActual?.operadorNombre || '---'}</td>
                    <td>{veh.tipoVehiculo ? veh.tipoVehiculo[0].toUpperCase() + veh.tipoVehiculo.slice(1) : '---'}</td>
                    <td>{abonadoTurnoTexto}</td>
                    <td>
                      {veh.estadiaActual?.fotoUrl && (
                        <button 
                          onClick={() => abrirFoto(veh.estadiaActual.fotoUrl)} 
                          title="Ver foto"
                          className="btn-ver-foto"
                        >
                          Foto
                        </button>
                      )}
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

  const renderTablaAlertas = () => {
    const term = searchTerm.toUpperCase();
    const filtradas = alertas
      .filter(a =>
        (a.tipoDeAlerta || '').toUpperCase().includes(term) ||
        normalizarOperador(a.operador)?.toUpperCase().includes(term)
      )
      .reverse(); // si luego tenés createdAt, podemos ordenarlas también
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
              {paginadas.map(alerta => (
                <tr key={alerta._id}>
                  <td>{alerta.tipoDeAlerta || '---'}</td>
                  <td>{alerta.fecha || '---'}</td>
                  <td>{alerta.hora || '---'}</td>
                  <td>{normalizarOperador(alerta.operador)}</td>
                </tr>
              ))}
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
        (i.texto || '').toUpperCase().includes(term) ||
        normalizarOperador(i.operador)?.toUpperCase().includes(term)
      )
      .reverse(); // idem
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
                const fechaYHora = (inc.fecha && inc.hora) ? new Date(`${inc.fecha}T${inc.hora}`) : null;
                return (
                  <tr key={inc._id}>
                    <td>{inc.texto || '---'}</td>
                    <td>{fechaYHora?.toLocaleDateString() || '---'}</td>
                    <td>{fechaYHora?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '---'}</td>
                    <td>{normalizarOperador(inc.operador)}</td>
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
      case 'Caja': return renderTablaCaja();
      case 'Ingresos': return renderTablaIngresos();
      case 'Alertas': return renderTablaAlertas();
      case 'Incidentes': return renderTablaIncidentes();
      default: return <p style={{ padding: '1rem' }}>Contenido para la pestaña "{activeCajaTab}" próximamente...</p>;
    }
  };

  return (
    <div className="caja">
      {renderContent()}
      
      {modalFotoUrl && (
        <div className="modal-foto-overlay" onClick={cerrarModal}>
          <div className="modal-foto-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={cerrarModal}>&times;</button>
            <img 
              src={modalFotoUrl} 
              alt="Foto del vehículo" 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '';
                alert('No se pudo cargar la imagen. Por favor intente nuevamente.');
                cerrarModal();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Caja;
