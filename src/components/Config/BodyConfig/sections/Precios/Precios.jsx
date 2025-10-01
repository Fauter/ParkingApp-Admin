// Precios.jsx
import React, { useEffect, useState, useCallback } from 'react';
import './Precios.css';

const API_BASE = 'https://api.garageia.com/api';

const Precios = () => {
  const [tarifas, setTarifas] = useState([]);
  const [tiposVehiculo, setTiposVehiculo] = useState([]);
  const [precios, setPrecios] = useState({});
  const [preciosCache, setPreciosCache] = useState({ efectivo: null, otros: null });
  const [editing, setEditing] = useState({});
  const [paymentMode, setPaymentMode] = useState('efectivo'); // 'efectivo' | 'otros'
  const [loading, setLoading] = useState(false);

  // ============ CATALOGOS ============
  const fetchCatalogos = useCallback(async () => {
    const [tarifasRes, tiposRes] = await Promise.all([
      fetch(`${API_BASE}/tarifas/`),
      fetch(`${API_BASE}/tipos-vehiculo`)
    ]);
    const [tarifasData, tiposData] = await Promise.all([
      tarifasRes.json(),
      tiposRes.json()
    ]);
    setTarifas(tarifasData);
    setTiposVehiculo(tiposData);
  }, []);

  // ============ PRECARGA DE PRECIOS (AMBOS MODOS) ============
  const prefetchPrecios = useCallback(async () => {
    try {
      setLoading(true);
      const [efRes, otRes] = await Promise.all([
        fetch(`${API_BASE}/precios?metodo=efectivo`),
        fetch(`${API_BASE}/precios?metodo=otros`)
      ]);

      const [efData, otData] = await Promise.all([
        efRes.ok ? efRes.json() : {},
        otRes.ok ? otRes.json() : {}
      ]);

      const cache = { efectivo: efData || {}, otros: otData || {} };
      setPreciosCache(cache);
      // Muestra por defecto efectivo ya precargado (sin flicker)
      setPrecios(cache.efectivo || {});
    } catch (e) {
      console.error('Error prefetch precios:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Montaje: catálogos + prefetch de ambos modos
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

  // Cambiar modo: siempre instantáneo con cache (sin mostrar loading)
  useEffect(() => {
    const cached = preciosCache[paymentMode];
    if (cached) setPrecios(cached);
    // Si quisieras refrescar silenciosamente en background, podrías hacerlo aquí:
    // (async () => {
    //   try {
    //     const res = await fetch(`${API_BASE}/precios?metodo=${paymentMode}`);
    //     const fresh = await res.json();
    //     setPreciosCache(prev => ({ ...prev, [paymentMode]: fresh || {} }));
    //     setPrecios(fresh || {});
    //   } catch {}
    // })();
  }, [paymentMode, preciosCache]);

  // ============ EDICION ============
  const handleCellClick = (vehiculo, tarifa) => {
    const valorActual = precios[vehiculo]?.[tarifa] ?? '';
    setEditing({ vehiculo, tarifa, value: valorActual.toString() });
  };

  const formatPrecioLive = (value) => {
    const soloNumeros = value.replace(/\D/g, '');
    return soloNumeros
      ? new Intl.NumberFormat('es-AR').format(parseInt(soloNumeros))
      : '';
  };

  const handleInputChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setEditing(prev => ({ ...prev, value: rawValue }));
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
        ...precios[vehiculo],
        [tarifa]: valorNumerico,
      };

      try {
        const res = await fetch(`${API_BASE}/precios/${vehiculo}?metodo=${paymentMode}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevosPreciosVehiculo),
        });

        if (!res.ok) throw new Error('Error al actualizar precio');

        // Estado visible
        setPrecios(prev => ({ ...prev, [vehiculo]: nuevosPreciosVehiculo }));
        // Cache coherente por modo actual
        setPreciosCache(prev => ({
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

  // ============ RENDER ============
  const normalizar = (str) =>
    typeof str === 'string'
      ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      : '';

  const tiposTarifa = ['hora', 'turno', 'estadia', 'abono'];

  const formatPrecio = (precio) => {
    if (precio !== 'N/A' && precio !== undefined && precio !== null && precio !== '') {
      return new Intl.NumberFormat('es-AR', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(precio);
    }
    return 'N/A';
  };

  const renderTablaPorTipo = (tipoTarifa) => {
    const tarifasFiltradas =
      normalizar(tipoTarifa) === 'abono'
        ? [{ _id: 'virtual-abono-mensual', nombre: 'Mensual', tipo: 'abono' }]
        : (tarifas || []).filter(t => normalizar(t.tipo) === normalizar(tipoTarifa));

    if (tarifasFiltradas.length === 0) return null;

    const tituloTipo =
      normalizar(tipoTarifa) === 'turno'
        ? 'Anticipado'
        : tipoTarifa.charAt(0).toUpperCase() + tipoTarifa.slice(1);

    return (
      <div key={tipoTarifa} style={{ margin: '20px 0' }}>
        <h3 style={{ textAlign: 'center', fontWeight: 400 }}>
          Tarifas x {tituloTipo}
        </h3>
        <table className="precios-table" border="1" cellPadding="8">
          <thead>
            <tr>
              <th></th>
              {tiposVehiculo.map(tipo => (
                <th key={tipo._id}>
                  {tipo.nombre
                    ? tipo.nombre.charAt(0).toUpperCase() + tipo.nombre.slice(1)
                    : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tarifasFiltradas.map(tarifa => {
              const nombreTarifa = tarifa.nombre ? tarifa.nombre.toLowerCase() : '';
              return (
                <tr key={tarifa._id}>
                  <th style={{ textAlign: 'left' }}>{tarifa.nombre}</th>
                  {tiposVehiculo.map(tipo => {
                    const vehiculo = tipo.nombre ? tipo.nombre.toLowerCase() : '';
                    const esEditando =
                      editing.vehiculo === vehiculo && editing.tarifa === nombreTarifa;
                    const valor = precios[vehiculo]?.[nombreTarifa];

                    return (
                      <td
                        key={tipo._id}
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

  return (
    <div className="precios-container">
      {/* Header: título centrado. El switch vive "pegado" al título sin afectarlo */}
      <div className="precios-header">
        <div />{/* izquierda vacía */}
        <div className="title-wrap">
          <h2 className="precios-title">Configuración de Precios</h2>

          {/* Switch “tecla de luz” pegado al h2 */}
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
        <div />{/* derecha vacía */}
      </div>

      {/* No mostramos spinner al alternar modo para evitar parpadeo visual */}
      {loading && !(preciosCache.efectivo && preciosCache.otros) ? (
        <p style={{ marginTop: 16 }}>Cargando configuración…</p>
      ) : (
        tiposTarifa.map(renderTablaPorTipo)
      )}
    </div>
  );
};

export default Precios;
