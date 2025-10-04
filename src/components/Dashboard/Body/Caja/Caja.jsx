import React, { useState, useEffect, useRef, useCallback } from 'react';
import Tabs from '../Tabs/Tabs';
import './Caja.css';

const ITEMS_POR_PAGINA = 10;

// 👉 Base de API (puede venir por Vite): VITE_API_BASE=https://api.garageia.com
const API_BASE = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_BASE
  ? import.meta.env.VITE_API_BASE
  : 'https://api.garageia.com'
).replace(/\/+$/, '');

// 🔒 Defensa: normaliza cualquier variante de "operador" a texto legible
const normalizarOperador = (op) => {
  if (!op) return '---';
  if (typeof op === 'string') {
    const s = op.trim();
    if (!s) return '---';
    if (s === '[object Object]') return '---';
    if (/^[0-9a-fA-F]{24}$/.test(s)) return '---';
    if (s.toLowerCase() === 'operador desconocido') return '---';
    return s;
  }
  if (typeof op === 'object') {
    const cand = op.nombre || op.name || op.username || op.email || op._id || '';
    return normalizarOperador(String(cand || '').trim());
  }
  return normalizarOperador(String(op || '').trim());
};

/** =========================================
 *  CANONIZADOR DE MOVIMIENTOS (aplana anidados)
 *  =========================================
 *  Soporta:
 *  - Plano: { patente, descripcion, ... createdAt/fecha, ticket, fotoUrl }
 *  - Envuelto: { msg, createdAt/fecha, movimiento: { ...props... } }
 */
function canonizarMovimiento(raw) {
  const inner = raw?.movimiento || {};
  const pick = (k) => (raw?.[k] != null ? raw[k] : inner?.[k]);

  // Fecha/createdAt robusto (prefiere top-level si existe)
  const createdAt = pick('createdAt') || pick('fecha') || null;

  return {
    _id: raw?._id || inner?._id || `${pick('patente') || ''}-${createdAt || Math.random()}`,
    patente: pick('patente') || null,
    descripcion: pick('descripcion') || null,
    operador: pick('operador') || null,
    tipoVehiculo: pick('tipoVehiculo') || null,
    metodoPago: pick('metodoPago') || null,
    factura: pick('factura') || null,
    monto: pick('monto'),
    promo: pick('promo'),
    tipoTarifa: pick('tipoTarifa') || null,
    ticket: pick('ticket') ?? null,
    fotoUrl: pick('fotoUrl') || null,
    // guardo ambas por compat
    createdAt,
    fecha: createdAt
  };
}

/** ================================
 *  FECHAS (CREACIÓN DEL MOVIMIENTO)
 *  ================================
 */
function fmtMovimientoFecha(mov) {
  // mov ya puede venir canonizado; igual hacemos fallback robusto
  const src = mov?.createdAt || mov?.fecha || mov?.movimiento?.createdAt || mov?.movimiento?.fecha;
  if (!src) return '---';
  const d = new Date(src);
  if (isNaN(d)) return '---';
  const tz = 'America/Argentina/Buenos_Aires';

  const ddmm = new Intl.DateTimeFormat('es-AR', {
    timeZone: tz,
    day: '2-digit',
    month: '2-digit',
  }).format(d);

  const hhmm = new Intl.DateTimeFormat('es-AR', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);

  return `${ddmm} ${hhmm}`;
}

function movCreatedTs(mov) {
  const src = mov?.createdAt || mov?.fecha || mov?.movimiento?.createdAt || mov?.movimiento?.fecha;
  const t = src ? new Date(src).getTime() : NaN;
  return Number.isFinite(t) ? t : -Infinity;
}

function entradaTs(veh) {
  const src = veh?.estadiaActual?.entrada;
  const t = src ? new Date(src).getTime() : NaN;
  return Number.isFinite(t) ? t : -Infinity;
}

function hourRangeMatches(dateObj, rangeStr) {
  if (!dateObj || !rangeStr) return true;
  const h = dateObj.getHours();
  const [a, b] = rangeStr.split('-').map(Number);
  return h >= a && h < b;
}

/** =========================================
 *  RESOLUCIÓN ROBUSTA DE URL DE FOTO (uploads)
 *  =========================================
 */
function resolverFotoUrl(raw) {
  if (!raw) return null;

  let url = String(raw).trim();

  // Ya absoluta
  if (/^https?:\/\//i.test(url)) return url;

  // Si es data URL
  if (/^data:image\//i.test(url)) return url;

  // Normalizar separadores y asegurar que empiece con /
  if (url.startsWith('/')) {
    // ok
  } else if (url.startsWith('uploads')) {
    url = '/' + url;
  } else if (!url.includes('/')) {
    // Sólo nombre de archivo
    url = '/uploads/fotos/entradas/' + url;
  } else {
    url = '/' + url.replace(/^\/+/, '');
  }

  // Encodear cada segmento (sin romper slashes)
  const [pathOnly, query] = url.split('?');
  const encodedPath = pathOnly
    .split('/')
    .map((seg, idx) => (idx === 0 ? seg : encodeURIComponent(seg)))
    .join('/');

  const rebuilt = encodedPath + (query ? `?${query}` : '');
  return `${API_BASE}${rebuilt}`.replace(/([^:])\/{2,}/g, '$1/');
}

const Caja = ({
  movimientos = [],
  vehiculos = [],
  alertas = [],
  incidentes = [],
  limpiarFiltros,
  activeCajaTab = 'Caja',
  isSearchBarVisible = true,
  filtros = {}
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);

  // Modal foto
  const [modalFotoUrl, setModalFotoUrl] = useState(null);
  const [modalAlternativas, setModalAlternativas] = useState([]);

  // Cache de estadías por ticket para mostrar entrada/salida, etc.
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
      const res = await fetch(`${API_BASE}/api/vehiculos/ticket-admin/${ticket}`);
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

  // Construye lista de candidatos (para fallback) y abre el modal
  const abrirFoto = useCallback((rawUrl) => {
    if (!rawUrl) return;

    // Principal (resuelto a /uploads/... absoluto)
    const primary = resolverFotoUrl(rawUrl);

    const candidatos = new Set();
    const add = (u) => { if (u) candidatos.add(u); };

    // 1) principal con cache-buster
    add(`${primary}${primary.includes('?') ? '&' : '?'}t=${Date.now()}`);

    try {
      const u = new URL(primary);
      const path = u.pathname; // /uploads/fotos/entradas/XXXX.jpg
      const filename = path.split('/').pop();
      const bust = `t=${Date.now()}`;

      // 2) API explícita que sí monta tu router (lee del mismo lugar real)
      //    /api/fotos/entradas/:filename
      add(`${u.origin}/api/fotos/entradas/${encodeURIComponent(filename)}?${bust}`);

      // 3) Variante /uploads (por si el host reescribe encabezados entre mounts)
      add((`${u.origin}${path}?${bust}`).replace(/([^:])\/{2,}/g, '$1/'));
    } catch {
      // si falla URL(), nos quedamos con primary+timestamp
    }

    const lista = Array.from(candidatos);
    setModalAlternativas(lista);
    setModalFotoUrl(lista[0] || primary);
  }, []);

  const cerrarModal = useCallback(() => {
    setModalFotoUrl(null);
    setModalAlternativas([]);
  }, []);

  const siguienteFallback = useCallback(() => {
    if (!modalAlternativas.length) return;
    const idx = modalAlternativas.indexOf(modalFotoUrl);
    const next = modalAlternativas[idx + 1];
    if (next) setModalFotoUrl(next);
    else {
      alert('No se pudo cargar la imagen desde ninguna variante.');
      cerrarModal();
    }
  }, [modalAlternativas, modalFotoUrl, cerrarModal]);

  // Cerrar modal con ESC y click fuera
  useEffect(() => {
    if (!modalFotoUrl) return;
    const onKey = (e) => {
      if (e.key === 'Escape') cerrarModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalFotoUrl, cerrarModal]);

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

  // === Prefetch de estadías para página visible (sin filtros de hora)
  useEffect(() => {
    if (activeCajaTab !== 'Caja') return;

    if (!filtros?.horaEntradaMov && !filtros?.horaSalidaMov) {
      const term = searchTerm.toUpperCase();

      // Canonizamos antes de filtrar/sortear
      const preliminares = movimientos
        .map(canonizarMovimiento)
        .filter(mov => (mov.patente || '').toUpperCase().includes(term))
        .sort((a, b) => movCreatedTs(b) - movCreatedTs(a));

      const paginados = paginar(preliminares, paginaActual);

      paginados.forEach(mov => {
        if (mov.ticket != null) fetchEstadiaByTicket(mov.ticket);
      });
    }
  }, [activeCajaTab, movimientos, paginaActual, searchTerm, filtros?.horaEntradaMov, filtros?.horaSalidaMov]);

  // === Prefetch cuando hay filtros por hora (necesitamos info de la estadía)
  useEffect(() => {
    if (activeCajaTab !== 'Caja') return;
    const needsEntrada = Boolean(filtros?.horaEntradaMov);
    const needsSalida  = Boolean(filtros?.horaSalidaMov);
    if (!needsEntrada && !needsSalida) return;

    const term = searchTerm.toUpperCase();
    const objetivos = movimientos
      .map(canonizarMovimiento)
      .filter(mov => (mov.patente || '').toUpperCase().includes(term));

    objetivos.forEach(mov => {
      if (mov.ticket != null) fetchEstadiaByTicket(mov.ticket);
    });
  }, [activeCajaTab, movimientos, searchTerm, filtros?.horaEntradaMov, filtros?.horaSalidaMov]);

  const renderTablaCaja = () => {
    const term = searchTerm.toUpperCase();

    // Siempre trabajar sobre movimientos canonizados
    let filtrados = movimientos
      .map(canonizarMovimiento)
      .filter(mov => (mov.patente || '').toUpperCase().includes(term));

    if (filtros?.horaEntradaMov || filtros?.horaSalidaMov) {
      filtrados = filtrados.filter(mov => {
        if (!mov.ticket) return false;
        const info = estadiaCache[mov.ticket];
        const est  = info?.data;
        if (!est) return false;

        const okEntrada = !filtros.horaEntradaMov || (est.entrada && hourRangeMatches(new Date(est.entrada), filtros.horaEntradaMov));
        const okSalida  = !filtros.horaSalidaMov  || (est.salida  && hourRangeMatches(new Date(est.salida),  filtros.horaSalidaMov));
        return okEntrada && okSalida;
      });
    }

    filtrados.sort((a, b) => movCreatedTs(b) - movCreatedTs(a));

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
                <th>Foto</th>
              </tr>
            </thead>
            <tbody>
              {paginados.map(movimiento => {
                const estadiaInfo = movimiento.ticket ? estadiaCache[movimiento.ticket] : null;
                const estadia = estadiaInfo?.data || null;
                const loading = estadiaInfo?.loading || false;
                const error = estadiaInfo?.error || null;

                const entrada = estadia?.entrada ? new Date(estadia.entrada) : null;
                const salida = estadia?.salida ? new Date(estadia.salida) : null;

                // ✅ FOTO: preferí la de la estadía; si no hay, usá la del movimiento canonizado
                const fotoUrl = estadia?.fotoUrl || movimiento?.fotoUrl || null;

                const patenteKey = movimiento.patente ? movimiento.patente.toUpperCase() : null;
                const montoSeguro = typeof movimiento.monto === 'number' ? movimiento.monto : 0;

                return (
                  <tr key={movimiento._id}>
                    <td>{patenteKey || '---'}</td>
                    <td>{fmtMovimientoFecha(movimiento)}</td>
                    <td>{loading ? 'Cargando...' : error ? 'Error' : (entrada?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '---')}</td>
                    <td>{loading ? 'Cargando...' : error ? 'Error' : (salida?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '---')}</td>
                    <td>{movimiento.descripcion || '---'}</td>
                    <td>{normalizarOperador(movimiento.operador)}</td>
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
      .sort((a, b) => entradaTs(b) - entradaTs(a));
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
                <th>Foto</th>
              </tr>
            </thead>
            <tbody>
              {paginados.map(veh => {
                const entrada = veh.estadiaActual?.entrada ? new Date(veh.estadiaActual.entrada) : null;
                let abonadoTurnoTexto = 'No';
                if (veh.abonado) abonadoTurnoTexto = 'Abonado';
                else if (veh.turno) abonadoTurnoTexto = 'Turno';

                const rawFoto = veh.estadiaActual?.fotoUrl;

                return (
                  <tr key={veh._id}>
                    <td>{veh.patente?.toUpperCase() || '---'}</td>
                    <td>{entrada?.toLocaleDateString() || '---'}</td>
                    <td>{entrada?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '---'}</td>
                    <td>{normalizarOperador(veh.estadiaActual?.operadorNombre)}</td>
                    <td>{veh.tipoVehiculo ? veh.tipoVehiculo[0].toUpperCase() + veh.tipoVehiculo.slice(1) : '---'}</td>
                    <td>{abonadoTurnoTexto}</td>
                    <td>
                      {rawFoto ? (
                        <button
                          onClick={() => abrirFoto(rawFoto)}
                          title="Ver foto"
                          className="btn-ver-foto"
                        >
                          Foto
                        </button>
                      ) : '---'}
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
            <button className="modal-close-btn" onClick={cerrarModal} aria-label="Cerrar">×</button>
            <img
              src={modalFotoUrl}
              alt="Foto del vehículo"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={(e) => {
                e.currentTarget.onerror = null;
                siguienteFallback();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Caja;
