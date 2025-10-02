// Precios.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import './Precios.css';

const API_BASE = 'https://api.garageia.com/api';
const ABONO_NOMBRES = ['Móvil', 'Fija', 'Exclusiva'];

/* ====== Persistencia local (NO backend) ====== */
const LS_KEY = 'precios_ui_order_v1';

/* ======================= Utils ======================= */
const normalizar = (str) =>
  typeof str === 'string'
    ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    : '';

const arraysEqual = (a = [], b = []) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

const arrayMove = (arr, from, to) => {
  if (from === to) return arr;
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

// ---- Orden por índices (para columnas) ----
const syncIndexOrder = (prev = [], length = 0) => {
  const filtered = prev.filter((i) => Number.isInteger(i) && i >= 0 && i < length);
  const set = new Set(filtered);
  const added = [];
  for (let i = 0; i < length; i++) if (!set.has(i)) added.push(i);
  return [...filtered, ...added];
};

// ---- Clave estable por fila (evita depender de _id) ----
const rowKeyForTarifa = (tarifa, tipoNorm) =>
  `${tipoNorm}|${tarifa?.nombre || 'sin-nombre'}`;

/* ======================= Componente ======================= */
const Precios = () => {
  const [tarifas, setTarifas] = useState([]);
  const [tiposVehiculo, setTiposVehiculo] = useState([]);
  const [precios, setPrecios] = useState({});
  const [preciosCache, setPreciosCache] = useState({ efectivo: null, otros: null });
  const [editing, setEditing] = useState({});
  const [paymentMode, setPaymentMode] = useState('efectivo'); // 'efectivo' | 'otros'
  const [loading, setLoading] = useState(false);

  // ---------- Orden visual (solo UI) ----------
  // columnas por índice
  const [colOrder, setColOrder] = useState([]); // p.ej. [0,2,1]
  // filas por clave derivada del nombre dentro de cada tipo
  const [rowOrder, setRowOrder] = useState({ hora: [], turno: [], abono: [] });

  const dragRef = useRef(null); // { kind:'col'|'row', fromIndex:number, table?:'hora'|'turno'|'abono' }
  const ordersLoadedRef = useRef(false); // para cargar desde LS una sola vez

  /* ============ CATALOGOS ============ */
  const fetchCatalogos = useCallback(async () => {
    const [tarifasRes, tiposRes] = await Promise.all([
      fetch(`${API_BASE}/tarifas/`),
      fetch(`${API_BASE}/tipos-vehiculo`)
    ]);
    const [tarifasData, tiposData] = await Promise.all([
      tarifasRes.json(),
      tiposRes.json()
    ]);
    setTarifas(Array.isArray(tarifasData) ? tarifasData : []);
    setTiposVehiculo(Array.isArray(tiposData) ? tiposData : []);
  }, []);

  /* ============ PRECARGA DE PRECIOS (AMBOS MODOS) ============ */
  const prefetchPrecios = useCallback(async () => {
    try {
      setLoading(true);
      const [efRes, otRes] = await Promise.all([
        fetch(`${API_BASE}/precios?metodo=efectivo`),
        fetch(`${API_BASE}/precios?metodo=otros`)
      ]);

      const efData = efRes.ok ? await efRes.json() : {};
      const otData = otRes.ok ? await otRes.json() : {};

      const cache = { efectivo: efData || {}, otros: otData || {} };
      setPreciosCache(cache);
      setPrecios(cache.efectivo || {}); // mostrar efectivo de arranque
    } catch (e) {
      console.error('Error prefetch precios:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ============ Montaje ============ */
  useEffect(() => {
    (async () => {
      try {
        await fetchCatalogos();
      } catch (e) {
        console.error('Error catálogos:', e);
      }
      await prefetchPrecios();
    })();
  }, [fetchCatalogos, prefetchPrecios]);

  /* ============ Cambiar modo ============ */
  useEffect(() => {
    const cached = preciosCache[paymentMode];
    if (cached) setPrecios(cached);
  }, [paymentMode, preciosCache]);

  /* ============ Cargar orden desde LocalStorage (una vez) ============ */
  useEffect(() => {
    if (ordersLoadedRef.current) return;
    // esperamos a tener catálogos para poder validar índices/filas
    if (!(tiposVehiculo && tiposVehiculo.length)) return;

    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.colOrder)) {
          setColOrder(syncIndexOrder(parsed.colOrder, tiposVehiculo.length));
        }
        if (parsed.rowOrder && typeof parsed.rowOrder === 'object') {
          setRowOrder((prev) => ({
            hora: Array.isArray(parsed.rowOrder.hora) ? parsed.rowOrder.hora : (prev.hora || []),
            turno: Array.isArray(parsed.rowOrder.turno) ? parsed.rowOrder.turno : (prev.turno || []),
            abono: Array.isArray(parsed.rowOrder.abono) ? parsed.rowOrder.abono : (prev.abono || []),
          }));
        }
      }
    } catch (e) {
      console.warn('No se pudo leer orden de LocalStorage:', e);
    } finally {
      ordersLoadedRef.current = true;
    }
  }, [tiposVehiculo]);

  /* ============ Guardar orden en LocalStorage al cambiar ============ */
  useEffect(() => {
    if (!ordersLoadedRef.current) return;
    if (!tiposVehiculo.length) return;
    try {
      const payload = { colOrder, rowOrder };
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('No se pudo guardar orden en LocalStorage:', e);
    }
  }, [colOrder, rowOrder, tiposVehiculo.length]);

  /* ============ Sync orden columnas por índices (ante cambios de catálogo) ============ */
  useEffect(() => {
    setColOrder((prev) => {
      const next = syncIndexOrder(prev, (tiposVehiculo || []).length);
      return arraysEqual(prev, next) ? prev : next;
    });
  }, [tiposVehiculo]);

  /* Helpers para armar filas por tipoTarifa (incluye caso especial Abono) */
  const buildTarifasPorTipo = (tipoNorm) => {
    let list = (tarifas || []).filter((t) => normalizar(t.tipo) === tipoNorm);

    if (tipoNorm === 'abono') {
      const setNombres = new Set(ABONO_NOMBRES);
      const reales = list.filter((t) => setNombres.has(t.nombre));
      if (reales.length > 0) {
        list = ABONO_NOMBRES
          .map((n) => reales.find((r) => r.nombre === n))
          .filter(Boolean);
      } else {
        list = ABONO_NOMBRES.map((n) => ({
          _id: `virtual-abono-${n}`,
          nombre: n,
          tipo: 'abono'
        }));
      }
    }
    return list;
  };

  /* ============ Sync orden filas por tabla (ante cambios de tarifas) ============ */
  useEffect(() => {
    const tipos = ['hora', 'turno', 'abono'];
    const keysPorTipo = {};
    tipos.forEach((tipo) => {
      const list = buildTarifasPorTipo(tipo);
      const keys = list.map((t) => rowKeyForTarifa(t, tipo));
      keysPorTipo[tipo] = keys;
    });

    setRowOrder((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const tipo of tipos) {
        const prevList = prev[tipo] || [];
        // Mantener orden previo, eliminar no presentes, añadir nuevos al final
        const setKeys = new Set(keysPorTipo[tipo]);
        const filtered = prevList.filter((k) => setKeys.has(k));
        const setFiltered = new Set(filtered);
        const added = keysPorTipo[tipo].filter((k) => !setFiltered.has(k));
        const merged = [...filtered, ...added];
        if (!arraysEqual(prevList, merged)) {
          next[tipo] = merged;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tarifas]);

  /* ============ EDICION ============ */
  const handleCellClick = (vehiculo, tarifa) => {
    const valorActual = precios[vehiculo]?.[tarifa] ?? '';
    setEditing({ vehiculo, tarifa, value: valorActual === '' ? '' : String(valorActual) });
  };

  const formatPrecioLive = (value = '') => {
    const soloNumeros = String(value).replace(/\D/g, '');
    return soloNumeros
      ? new Intl.NumberFormat('es-AR').format(parseInt(soloNumeros, 10))
      : '';
  };

  const handleInputChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setEditing((prev) => ({ ...prev, value: rawValue }));
  };

  const handleInputKeyDown = async (e, vehiculo) => {
    if (e.key === 'Enter') {
      const { tarifa, value } = editing;
      const valorNumerico = parseFloat(value);

      if (isNaN(valorNumerico)) {
        alert('Debe ingresar un número válido.');
        return;
      }

      const nuevosPreciosVehiculo = {
        ...(precios[vehiculo] || {}),
        [tarifa]: valorNumerico
      };

      try {
        const res = await fetch(`${API_BASE}/precios/${vehiculo}?metodo=${paymentMode}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevosPreciosVehiculo)
        });

        if (!res.ok) throw new Error('Error al actualizar precio');

        setPrecios((prev) => ({ ...prev, [vehiculo]: nuevosPreciosVehiculo }));
        setPreciosCache((prev) => ({
          ...prev,
          [paymentMode]: { ...(prev[paymentMode] || {}), [vehiculo]: nuevosPreciosVehiculo }
        }));

        setEditing({});
      } catch (error) {
        console.error('Error al actualizar:', error);
      }
    } else if (e.key === 'Escape') {
      setEditing({});
    }
  };

  const formatPrecio = (precio) => {
    if (precio !== 'N/A' && precio !== undefined && precio !== null && precio !== '') {
      return new Intl.NumberFormat('es-AR', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(precio);
    }
    return 'N/A';
  };

  /* ============ RENDER TABLA ============ */
  const renderTablaPorTipo = (tipoTarifa) => {
    const tipoNorm = normalizar(tipoTarifa);
    let filas = buildTarifasPorTipo(tipoNorm);
    if (filas.length === 0) return null;

    // Ordenar filas según rowOrder[tipo]
    const currentRowOrder = rowOrder[tipoNorm] || [];
    const keyOf = (t) => rowKeyForTarifa(t, tipoNorm);
    const idxMap = new Map(currentRowOrder.map((id, i) => [id, i]));
    filas = filas
      .slice()
      .sort((a, b) => (idxMap.get(keyOf(a)) ?? 9999) - (idxMap.get(keyOf(b)) ?? 9999));

    // Ordenar columnas por índices
    const length = (tiposVehiculo || []).length;
    const order = colOrder.length ? colOrder : Array.from({ length }, (_, i) => i);
    const orderedTiposVehiculo = order
      .map((i) => tiposVehiculo[i])
      .filter(Boolean);

    const tituloTipo =
      tipoNorm === 'turno'
        ? 'Anticipado'
        : tipoTarifa.charAt(0).toUpperCase() + tipoTarifa.slice(1);

    const makeRowDragHandlers = (rowIndex, orderedKeysForView) => ({
      onDragStart: (e) => {
        dragRef.current = { kind: 'row', table: tipoNorm, fromIndex: rowIndex };
        try { e.dataTransfer.effectAllowed = 'move'; } catch {}
      },
      onDragOver: (e) => { e.preventDefault(); },
      onDrop: (e) => {
        e.preventDefault();
        const info = dragRef.current;
        dragRef.current = null;
        if (!info || info.kind !== 'row' || info.table !== tipoNorm) return;
        const toIndex = rowIndex;
        if (info.fromIndex === toIndex) return;
        setRowOrder((prev) => {
          const base = (prev[tipoNorm] && prev[tipoNorm].length) ? prev[tipoNorm] : orderedKeysForView;
          const next = arrayMove(base, info.fromIndex, toIndex);
          if (arraysEqual(prev[tipoNorm] || [], next)) return prev;
          return { ...prev, [tipoNorm]: next };
        });
      }
    });

    const columnDragHandlers = (colIndex) => ({
      onDragStart: (e) => {
        dragRef.current = { kind: 'col', fromIndex: colIndex };
        try { e.dataTransfer.effectAllowed = 'move'; } catch {}
      },
      onDragOver: (e) => { e.preventDefault(); },
      onDrop: (e) => {
        e.preventDefault();
        const info = dragRef.current;
        dragRef.current = null;
        if (!info || info.kind !== 'col') return;
        const toIndex = colIndex;
        if (info.fromIndex === toIndex) return;
        setColOrder((prev) => {
          const base = prev.length ? prev : Array.from({ length }, (_, i) => i);
          const next = arrayMove(base, info.fromIndex, toIndex);
          return arraysEqual(prev, next) ? prev : next;
        });
      }
    });

    const orderedRowKeys = filas.map((t) => keyOf(t));

    return (
      <div key={tipoTarifa} style={{ margin: '20px 0' }}>
        <h3 style={{ textAlign: 'center', fontWeight: 400 }}>Tarifas x {tituloTipo}</h3>
        <table className="precios-table" border="1" cellPadding="8">
          <thead>
            <tr>
              <th></th>
              {orderedTiposVehiculo.map((tipo, colIdx) => (
                <th
                  key={tipo?._id ?? colIdx}
                  draggable
                  {...columnDragHandlers(colIdx)}
                  title={`Arrastrar para reordenar columnas: ${tipo?.nombre || ''}`}
                  style={{ cursor: 'grab' }}
                >
                  {tipo?.nombre
                    ? tipo.nombre.charAt(0).toUpperCase() + tipo.nombre.slice(1)
                    : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((tarifa, rowIdx) => {
              const nombreTarifa = tarifa.nombre ? tarifa.nombre.toLowerCase() : '';
              const rowHandlers = makeRowDragHandlers(rowIdx, orderedRowKeys);

              return (
                <tr key={rowKeyForTarifa(tarifa, tipoNorm)}>
                  <th
                    style={{ textAlign: 'left', cursor: 'grab' }}
                    draggable
                    {...rowHandlers}
                    title={`Arrastrar para reordenar filas: ${tarifa.nombre || ''}`}
                  >
                    {tarifa.nombre}
                  </th>
                  {orderedTiposVehiculo.map((tipo, cIdx) => {
                    const vehiculo = tipo?.nombre ? tipo.nombre.toLowerCase() : '';
                    const esEditando =
                      editing.vehiculo === vehiculo && editing.tarifa === nombreTarifa;
                    const valor = precios[vehiculo]?.[nombreTarifa];

                    return (
                      <td
                        key={`${(tipo?._id ?? cIdx)}-${rowKeyForTarifa(tarifa, tipoNorm)}`}
                        onClick={() => handleCellClick(vehiculo, nombreTarifa)}
                        className={esEditando ? 'editing' : ''}
                        style={{ cursor: 'pointer' }}
                        title={`${vehiculo} · ${nombreTarifa} · ${paymentMode}`}
                      >
                        {esEditando ? (
                          <div style={{ position: 'relative' }}>
                            <span className="input-prefix">$</span>
                            <input
                              type="text"
                              autoFocus
                              value={formatPrecioLive(editing.value)}
                              onChange={handleInputChange}
                              onKeyDown={(e) => handleInputKeyDown(e, vehiculo)}
                              onBlur={() => setEditing({})}
                              className="precio-input with-prefix"
                            />
                          </div>
                        ) : (
                          <span className="precio-format">
                            {valor === undefined || valor === null || valor === ''
                              ? '—'
                              : `$${formatPrecio(valor)}`}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const tiposTarifa = ['hora', 'turno', 'abono'];

  return (
    <div className="precios-container">
      {/* Header */}
      <div className="precios-header">
        <div />
        <div className="title-wrap">
          <h2 className="precios-title">Configuración de Precios</h2>
          <div className="light-switch" role="group" aria-label="Modo de pago">
            <button
              type="button"
              onClick={() => setPaymentMode('efectivo')}
              className={paymentMode === 'efectivo' ? 'switch-seg active' : 'switch-seg'}
              aria-pressed={paymentMode === 'efectivo'}
              title="Efectivo"
            >
              Efectivo
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode('otros')}
              className={paymentMode === 'otros' ? 'switch-seg active' : 'switch-seg'}
              aria-pressed={paymentMode === 'otros'}
              title="Otros métodos"
            >
              Otros
            </button>
          </div>
        </div>
        <div />
      </div>

      {loading && !(preciosCache.efectivo && preciosCache.otros) ? (
        <p style={{ marginTop: 16 }}>Cargando configuración…</p>
      ) : (
        tiposTarifa.map(renderTablaPorTipo)
      )}
    </div>
  );
};

export default Precios;
