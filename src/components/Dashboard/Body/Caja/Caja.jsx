import React, { useState, useEffect, useRef, useCallback } from 'react';
import Tabs from '../Tabs/Tabs';
import './Caja.css';

const ITEMS_POR_PAGINA = 50;

// 👉 Base de API (puede venir por Vite): VITE_API_BASE=https://apiprueba.garageia.com
const API_BASE = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_BASE
  ? import.meta.env.VITE_API_BASE
  : 'https://apiprueba.garageia.com'
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

// 👉 Helper: elegir operador priorizando el nombre humano del inner.movimiento
function elegirOperador(rawOp, innerOp) {
  const str = (v) => (v == null ? '' : String(v).trim());
  const isObjId = (s) => /^[0-9a-fA-F]{24}$/.test(s);
  const r = str(rawOp);
  const i = str(innerOp);

  if (i && !isObjId(i) && i !== '[object Object]') return i;
  if (r && !isObjId(r) && r !== '[object Object]') return r;

  return i || r || null;
}

function canonizarMovimiento(raw) {
  const inner = raw?.movimiento || {};
  const pick = (k) => (raw?.[k] != null ? raw[k] : inner?.[k]);

  const createdAt = pick('createdAt') || pick('fecha') || null;
  const operador = elegirOperador(raw?.operador, inner?.operador);
  const fotoUrl = inner?.fotoUrl ?? raw?.fotoUrl ?? null;

  return {
    _id: raw?._id || inner?._id || `${pick('patente') || ''}-${createdAt || Math.random()}`,
    patente: pick('patente') || null,
    descripcion: pick('descripcion') || null,
    operador,
    tipoVehiculo: pick('tipoVehiculo') || null,
    metodoPago: pick('metodoPago') || null,
    factura: pick('factura') || null,
    monto: pick('monto'),
    promo: pick('promo'),
    tipoTarifa: pick('tipoTarifa') || null,
    ticket: pick('ticket') ?? null,
    fotoUrl,
    createdAt,
    fecha: createdAt
  };
}

const BA_TZ = 'America/Argentina/Buenos_Aires';

function fmtMovimientoFecha(mov) {
  const src = mov?.createdAt || mov?.fecha || mov?.movimiento?.createdAt || mov?.movimiento?.fecha;
  if (!src) return '---';
  const d = new Date(src);
  if (isNaN(d)) return '---';

  const ddmm = new Intl.DateTimeFormat('es-AR', {
    timeZone: BA_TZ,
    day: '2-digit',
    month: '2-digit',
  }).format(d);

  const hhmm = new Intl.DateTimeFormat('es-AR', {
    timeZone: BA_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);

  return `${ddmm} ${hhmm}`;
}

function fmtDDMM(date) {
  if (!date) return '---';
  const d = new Date(date);
  if (isNaN(d)) return '---';
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: BA_TZ,
    day: '2-digit',
    month: '2-digit',
  }).format(d);
}

function fmtHHmm(date) {
  if (!date) return '---';
  const d = new Date(date);
  if (isNaN(d)) return '---';
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: BA_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
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

function resolverFotoUrl(raw) {
  if (!raw) return null;
  let url = String(raw).trim();

  if (/^https?:\/\//i.test(url)) return url;
  if (/^data:image\//i.test(url)) return url;

  if (url.startsWith('/')) {
  } else if (url.startsWith('uploads')) {
    url = '/' + url;
  } else if (!url.includes('/')) {
    url = '/uploads/fotos/entradas/' + url;
  } else {
    url = '/' + url.replace(/^\/+/, '');
  }

  const [pathOnly, query] = url.split('?');
  const encodedPath = pathOnly
    .split('/')
    .map((seg, idx) => (idx === 0 ? seg : encodeURIComponent(seg)))
    .join('/');

  const rebuilt = encodedPath + (query ? `?${query}` : '');
  return `${API_BASE}${rebuilt}`.replace(/([^:])\/{2,}/g, '$1/');
}

function StackFechaHora({ date, placeholder = '---' }) {
  if (!date) return <>{placeholder}</>;
  const d = new Date(date);
  if (isNaN(d)) return <>{placeholder}</>;
  return (
    <div style={{ lineHeight: 1.1 }}>
      <div style={{ fontSize: '12px' }}>{fmtDDMM(d)}</div>
      <div style={{ fontSize: '12px', opacity: 0.9 }}>{fmtHHmm(d)}</div>
    </div>
  );
}

function StackDescripcionPago({ descripcion }) {
  if (!descripcion) return <>---</>;
  const m = /pago\s+por\s+(\d+)\s+horas?/i.exec(descripcion);
  if (!m) return <>{descripcion}</>;
  const n = parseInt(m[1], 10);
  const linea2 = `${n} ${n === 1 ? 'hora' : 'horas'}`;
  return (
    <div style={{ lineHeight: 1.1 }}>
      <div style={{ fontSize: '12px' }}>Pago por</div>
      <div style={{ fontSize: '12px' }}>{linea2}</div>
    </div>
  );
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

  const [modalFotoUrl, setModalFotoUrl] = useState(null);
  const [modalAlternativas, setModalAlternativas] = useState([]);

  const [estadiaCache, setEstadiaCache] = useState({});
  const fetchingTickets = useRef({});

  const [fotoDisponible, setFotoDisponible] = useState({});

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

  const verificarFoto = useCallback((rawUrl) => {
    if (!rawUrl) return;
    if (Object.prototype.hasOwnProperty.call(fotoDisponible, rawUrl)) return;

    const abs = resolverFotoUrl(rawUrl);
    const testUrl = `${abs}${abs.includes('?') ? '&' : '?'}t=${Date.now()}`;

    const img = new Image();
    try {
      img.referrerPolicy = 'no-referrer';
    } catch {}
    try {
      img.crossOrigin = 'anonymous';
    } catch {}
    img.onload = () => {
      setFotoDisponible((prev) => ({ ...prev, [rawUrl]: true }));
    };
    img.onerror = () => {
      setFotoDisponible((prev) => ({ ...prev, [rawUrl]: false }));
    };
    img.src = testUrl;
  }, [fotoDisponible]);

  const abrirFoto = useCallback((rawUrl) => {
    if (!rawUrl) return;

    const primary = resolverFotoUrl(rawUrl);

    const candidatos = new Set();
    const add = (u) => { if (u) candidatos.add(u); };

    add(`${primary}${primary.includes('?') ? '&' : '?'}t=${Date.now()}`);

    try {
      const u = new URL(primary);
      const path = u.pathname;
      const filename = path.split('/').pop();
      const bust = `t=${Date.now()}`;

      add(`${u.origin}/api/fotos/entradas/${encodeURIComponent(filename)}?${bust}`);
      add((`${u.origin}${path}?${bust}`).replace(/([^:])\/{2,}/g, '$1/'));
    } catch {}

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

  useEffect(() => {
    if (activeCajaTab !== 'Caja') return;

    if (!filtros?.horaEntradaMov && !filtros?.horaSalidaMov) {
      const term = searchTerm.toUpperCase();

      const preliminares = movimientos
        .map(canonizarMovimiento)
        .filter(mov => (mov.patente || '').toUpperCase().includes(term))
        .sort((a, b) => movCreatedTs(b) - movCreatedTs(a));

      const paginados = paginar(preliminares, paginaActual);

      paginados.forEach(mov => {
        if (mov.ticket != null) fetchEstadiaByTicket(mov.ticket);
        if (mov.fotoUrl) verificarFoto(mov.fotoUrl);
      });
    }
  }, [activeCajaTab, movimientos, paginaActual, searchTerm, filtros?.horaEntradaMov, filtros?.horaSalidaMov, verificarFoto]);

  useEffect(() => {
    if (activeCajaTab !== 'Caja') return;
    const needsEntrada = Boolean(filtros?.horaEntradaMov);
    const needsSalida = Boolean(filtros?.horaSalidaMov);
    if (!needsEntrada && !needsSalida) return;

    const term = searchTerm.toUpperCase();
    const objetivos = movimientos
      .map(canonizarMovimiento)
      .filter(mov => (mov.patente || '').toUpperCase().includes(term));

    objetivos.forEach(mov => {
      if (mov.ticket != null) fetchEstadiaByTicket(mov.ticket);
      if (mov.fotoUrl) verificarFoto(mov.fotoUrl);
    });
  }, [activeCajaTab, movimientos, searchTerm, filtros?.horaEntradaMov, filtros?.horaSalidaMov, verificarFoto]);

  //-----------------------------------------------------------------------
  // ★★★★★  TABLA CAJA  ★★★★★
  //-----------------------------------------------------------------------
  const renderTablaCaja = () => {
    const term = searchTerm.toUpperCase();

    let filtrados = movimientos
      .map(canonizarMovimiento)
      .filter(mov => (mov.patente || '').toUpperCase().includes(term));

    if (filtros?.horaEntradaMov || filtros?.horaSalidaMov) {
      filtrados = filtrados.filter(mov => {
        if (!mov.ticket) return false;
        const info = estadiaCache[mov.ticket];
        const est = info?.data;
        if (!est) return false;

        const okEntrada = !filtros.horaEntradaMov || (est.entrada && hourRangeMatches(new Date(est.entrada), filtros.horaEntradaMov));
        const okSalida = !filtros.horaSalidaMov || (est.salida && hourRangeMatches(new Date(est.salida), filtros.horaSalidaMov));
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

                {/* ★ NUEVA COLUMNA TICKET ★ */}
                <th style={{ width: "55px" }}>Ticket</th>
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

                const fotoUrlRaw = estadia?.fotoUrl || movimiento?.fotoUrl || null;
                if (fotoUrlRaw) verificarFoto(fotoUrlRaw);
                const puedeMostrarBotonFoto = !!fotoUrlRaw && fotoDisponible[fotoUrlRaw] === true;

                const patenteKey = movimiento.patente ? movimiento.patente.toUpperCase() : null;
                const montoSeguro = typeof movimiento.monto === 'number' ? movimiento.monto : 0;

                return (
                  <tr key={movimiento._id}>
                    <td>{patenteKey || '---'}</td>
                    <td>{fmtMovimientoFecha(movimiento) || '---'}</td>
                    <td>{loading || error ? '---' : entrada ? <StackFechaHora date={entrada} /> : '---'}</td>
                    <td>{loading || error ? '---' : salida ? <StackFechaHora date={salida} /> : '---'}</td>
                    <td><StackDescripcionPago descripcion={movimiento.descripcion} /></td>
                    <td>{normalizarOperador(movimiento.operador)}</td>
                    <td>{movimiento.tipoVehiculo ? movimiento.tipoVehiculo[0].toUpperCase() + movimiento.tipoVehiculo.slice(1) : '---'}</td>
                    <td>{movimiento.metodoPago || '---'}</td>
                    <td>{movimiento.factura || '---'}</td>
                    <td>{montoSeguro === 0 ? '---' : `$${montoSeguro.toLocaleString('es-AR')}`}</td>

                    <td>
                      {puedeMostrarBotonFoto ? (
                        <button onClick={() => abrirFoto(fotoUrlRaw)} title="Ver foto" className="btn-ver-foto">Foto</button>
                      ) : '---'}
                    </td>

                    {/* ★ NUEVA CELDA TICKET ★ */}
                    <td>{movimiento.ticket ?? '---'}</td>
                  </tr>
                );
              })}

              {renderFilasVacias(ITEMS_POR_PAGINA - paginados.length, 12)}
            </tbody>
          </table>

          {renderPaginado(total)}
        </div>
      </div>
    );
  };

  //-----------------------------------------------------------------------
  // ★★★★★  TABLA INGRESOS  ★★★★★
  //-----------------------------------------------------------------------
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
                <th>Abonado/Anticipado</th>
                <th>Foto</th>

                {/* ★ NUEVA COLUMNA TICKET ★ */}
                <th style={{ width: "55px" }}>Ticket</th>
              </tr>
            </thead>

            <tbody>
              {paginados.map(veh => {
                const entrada = veh.estadiaActual?.entrada ? new Date(veh.estadiaActual.entrada) : null;

                let abonadoTurnoTexto = 'No';
                if (veh.abonado) abonadoTurnoTexto = 'Abonado';
                else if (veh.turno) abonadoTurnoTexto = 'Anticipado';

                const rawFoto = veh.estadiaActual?.fotoUrl;
                if (rawFoto) verificarFoto(rawFoto);
                const puedeMostrarBotonFoto = !!rawFoto && fotoDisponible[rawFoto] === true;

                return (
                  <tr key={veh._id}>
                    <td>{veh.patente?.toUpperCase() || '---'}</td>
                    <td>{entrada?.toLocaleDateString() || '---'}</td>
                    <td>{entrada?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '---'}</td>
                    <td>{normalizarOperador(veh.estadiaActual?.operadorNombre)}</td>
                    <td>{veh.tipoVehiculo ? veh.tipoVehiculo[0].toUpperCase() + veh.tipoVehiculo.slice(1) : '---'}</td>
                    <td>{abonadoTurnoTexto}</td>

                    <td>
                      {puedeMostrarBotonFoto ? (
                        <button onClick={() => abrirFoto(rawFoto)} title="Ver foto" className="btn-ver-foto">Foto</button>
                      ) : '---'}
                    </td>

                    {/* ★ NUEVA CELDA TICKET ★ */}
                    <td>{veh.estadiaActual?.ticket ?? '---'}</td>
                  </tr>
                );
              })}

              {renderFilasVacias(ITEMS_POR_PAGINA - paginados.length, 8)}
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
