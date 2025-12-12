// CierreDeCajaAdmin.jsx
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import '../Caja/Caja.css';

const ITEMS_POR_PAGINA = 10;

// 🔒 Defensa: normaliza cualquier variante de "operador" a texto legible (igual que en Caja.jsx)
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

// 🔎 Descripción según reglas: nombre/texto
const buildDescripcion = (item) => {
  const nombre = (item?.nombre || '').toString().trim();
  const texto  = (item?.texto  || '').toString().trim();
  if (nombre && texto) return `${nombre} - ${texto}`;
  if (nombre) return `Nombre: ${nombre}`;
  if (texto)  return texto;
  return '---';
};

// 🕒 Timestamp robusto para ordenar DESC por “últimos creados”
const tsCierre = (item) => {
  const src = item?.createdAt || (item?.fecha && (item.hora ? `${item.fecha}T${item.hora}` : `${item.fecha}T00:00`));
  const t = src ? new Date(src).getTime() : NaN;
  return Number.isFinite(t) ? t : -Infinity;
};

const CierreDeCajaAdmin = forwardRef(({
  activeCajaTab,
  searchTerm,
  onCajaTabChange,
  cierresDeCaja = [],
  aRetirar = [],
  retirado = [],
  parciales: parcialesProp = [],
  limpiarFiltros,
  onActualizar,
  filtros = {}
}, ref) => {

  const [paginaActual, setPaginaActual] = useState(1);
  const [retiradosLocales, setRetiradosLocales] = useState(new Set());
  const [parciales, setParciales] = useState([]);
  const [dataARetirar, setDataARetirar] = useState([]);
  const [dataRetirado, setDataRetirado] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const intervaloRef = useRef(null);

  useEffect(() => {
    setPaginaActual(1);
  }, [activeCajaTab, searchTerm]);

  useEffect(() => {
    setRetiradosLocales(new Set());
  }, [cierresDeCaja]);

  const aplicarFiltros = (datos) => {
    return datos.filter(item => {
      const opNombre = normalizarOperador(item.operador);
      const search = (searchTerm || '').trim().toUpperCase();

      const searchMatch =
        opNombre?.toUpperCase().includes(search) ||
        (item?.descripcion || '').toUpperCase().includes(search) ||
        (item?.nombre || '').toUpperCase().includes(search);

      const operadorMatch =
        !filtros.operador ||
        opNombre?.toLowerCase().includes((filtros.operador || '').toLowerCase());

      let horaMatch = true;
      if (filtros.hora) {
        const [desde, hasta] = filtros.hora.split('-').map(Number);
        const horaItem = parseInt(item.hora?.split(':')[0], 10);
        if (!Number.isNaN(desde) && !Number.isNaN(hasta) && !Number.isNaN(horaItem)) {
          horaMatch = horaItem >= desde && horaItem < hasta;
        }
      }

      let fechaMatch = true;
      if (filtros.fecha) {
        const fechaItem = new Date(item.fecha);
        const ymd = !isNaN(fechaItem)
          ? fechaItem.toISOString().split('T')[0]
          : (item.fecha || '');
        fechaMatch = ymd === filtros.fecha;
      }

      let rangoFechaMatch = true;
      if (filtros.fechaDesde || filtros.fechaHasta) {
        const fechaItem = new Date(item.fecha);
        const fechaDesde = filtros.fechaDesde ? new Date(filtros.fechaDesde) : null;
        const fechaHasta = filtros.fechaHasta
          ? new Date(new Date(filtros.fechaHasta).setDate(new Date(filtros.fechaHasta).getDate() + 1))
          : null;

        if (fechaDesde && !isNaN(fechaItem)) rangoFechaMatch = fechaItem >= fechaDesde;
        if (fechaHasta && !isNaN(fechaItem)) rangoFechaMatch = rangoFechaMatch && fechaItem < fechaHasta;
      }

      return searchMatch && operadorMatch && horaMatch && fechaMatch && rangoFechaMatch;
    });
  };

  useEffect(() => {
    // === CIERRES DE CAJA ===
    const fetchCierresDeCaja = async () => {
      try {
        const res = await fetch("https://apiprueba.garageia.com/api/cierresdecaja/");
        if (!res.ok) throw new Error("Error al obtener cierres de caja");
        const data = await res.json();

        setDataARetirar(data.filter((item) => !item.retirado));
        setDataRetirado(data.filter((item) => item.retirado));
      } catch (error) {
        console.error("Error al cargar cierres de caja:", error);
        setDataARetirar([]);
        setDataRetirado([]);
      }
    };

    // === MOVIMIENTOS ===
    const fetchMovimientos = async () => {
      try {
        const res = await fetch("https://apiprueba.garageia.com/api/movimientos");
        if (!res.ok) throw new Error("Error al cargar movimientos");
        const data = await res.json();

        // Homogeneizar formato: algunos vienen como {movimiento:{...}}
        const list = Array.isArray(data)
          ? data.map((m) => m.movimiento || m)
          : [];

        setMovimientos(list);
      } catch (error) {
        console.error("Error al cargar movimientos:", error);
        setMovimientos([]);
      }
    };

    // Ejecutar ambos fetch en paralelo
    fetchCierresDeCaja();
    fetchMovimientos();
  }, []);

  const fetchParciales = async () => {
    try {
      const res = await fetch('https://apiprueba.garageia.com/api/cierresdecaja/parcial');
      if (!res.ok) throw new Error('Error al obtener parciales');
      const data = await res.json();
      setParciales(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar parciales:', error);
      setParciales([]);
    }
  };

  useEffect(() => {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }

    const fetchCierres = async () => {
      try {
        const res = await fetch('https://apiprueba.garageia.com/api/cierresdecaja/');
        if (!res.ok) throw new Error('Error al obtener cierres');
        const data = await res.json();
        setDataARetirar(data.filter(i => !i.retirado));
        setDataRetirado(data.filter(i => i.retirado));
      } catch (error) {
        console.error('Error al actualizar cierres:', error);
      }
    };

    if (activeCajaTab === 'Parciales') {
      fetchParciales();
      intervaloRef.current = setInterval(fetchParciales, 5000);
    } else if (activeCajaTab === 'A Retirar' || activeCajaTab === 'Retirado') {
      fetchCierres();
      intervaloRef.current = setInterval(fetchCierres, 5000);
    }

    return () => {
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
        intervaloRef.current = null;
      }
    };
  }, [activeCajaTab]);

  // Helpers de tabla
  const paginar = (array, pagina) => {
    const startIndex = (pagina - 1) * ITEMS_POR_PAGINA;
    return array.slice(startIndex, startIndex + ITEMS_POR_PAGINA);
  };

  const totalPaginas = (array) =>
    Math.ceil((array?.length || 0) / ITEMS_POR_PAGINA);

  const renderPaginado = (total) => (
    <div className="paginado">
      <button disabled={paginaActual === 1} onClick={() => setPaginaActual(paginaActual - 1)}>Anterior</button>
      <span>Página {paginaActual} de {Math.max(total, 1)}</span>
      <button disabled={paginaActual === total || total === 0} onClick={() => setPaginaActual(paginaActual + 1)}>Siguiente</button>
    </div>
  );

  const renderFilasVacias = (cantidad, columnas) =>
    Array.from({ length: Math.max(0, cantidad) }, (_, i) => (
      <tr key={`empty-${i}`}>
        {Array.from({ length: columnas }, (_, j) => <td key={j}>---</td>)}
      </tr>
    ));

  // Acción “Retirado”
  const handleRetiradoClick = async (id) => {
    const confirmado = window.confirm('¿Estás seguro de que querés marcar este cierre como retirado?');
    if (!confirmado) return;

    setRetiradosLocales(prev => new Set(prev).add(id));

    try {
      const res = await fetch(`https://apiprueba.garageia.com/api/cierresdecaja/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retirado: true }),
      });

      if (!res.ok) throw new Error('Error al actualizar');

      const data = await res.json();
      setDataARetirar(prev => prev.filter(item => item._id !== id));
      setDataRetirado(prev => [...prev, data]);
    } catch (error) {
      console.error('Error al marcar como retirado:', error);
      setRetiradosLocales(prev => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
    }
  };

  // ========================================================
  // CÓMPUTOS (funcional)
  // ========================================================

  // Helper limpio: extraer YYYY-MM-DD de un ISO real
  const fechaYMD = (iso) => {
    if (!iso) return null;
    const s = String(iso);
    return s.length >= 10 ? s.slice(0, 10) : null;
  };

  // Timestamp robusto para movimientos (usa fecha o createdAt)
  const tsMovimiento = (mov) => {
    if (!mov) return -Infinity;
    const src = mov.fecha || mov.createdAt;
    if (!src) return -Infinity;
    const t = new Date(src).getTime();
    return Number.isFinite(t) ? t : -Infinity;
  };

  // Construir cómputos por cierre
  const buildComputos = () => {
    if (!Array.isArray(cierresDeCaja) || cierresDeCaja.length === 0) return [];

    // ordenar cierres por fecha-hora ascendente (los más viejos primero)
    const cierresOrdenados = [...cierresDeCaja].sort((a, b) => {
      const t1 = tsCierre(a);
      const t2 = tsCierre(b);
      return t1 - t2;
    });

    const result = [];

    for (let i = 0; i < cierresOrdenados.length; i++) {
      const cierre = cierresOrdenados[i];

      const opCierre = normalizarOperador(cierre.operador);
      const ymdCierre = cierre.fecha || null;         // p.ej. "2025-12-11"
      const tCierre = tsCierre(cierre);               // timestamp del cierre actual

      if (!Number.isFinite(tCierre)) {
        // si por algún motivo no tenemos timestamp válido, salteamos
        continue;
      }

      // 🔎 Buscar el cierre anterior DEL MISMO OPERADOR
      const anteriorMismoOperador =
        cierresOrdenados
          .slice(0, i)              // sólo cierres anteriores en el tiempo
          .reverse()                // buscamos del más cercano hacia atrás
          .find((c) => normalizarOperador(c.operador) === opCierre) || null;

      const tAnterior = anteriorMismoOperador ? tsCierre(anteriorMismoOperador) : null;

      // === 1. Filtrar movimientos del mismo operador, mismo día (si hay fecha)
      //       y dentro de la ventana (tAnterior, tCierre] ===
      const movs = movimientos.filter((m) => {
        const opMov = normalizarOperador(m.operador);
        if (opMov !== opCierre) return false;

        const tMov = tsMovimiento(m);
        if (!Number.isFinite(tMov)) return false;

        // dentro de la ventana de tiempo: > cierre anterior y <= cierre actual
        if (tMov > tCierre) return false;
        if (tAnterior && Number.isFinite(tAnterior) && tMov <= tAnterior) return false;

        // opcional: aseguramos mismo día si cierre tiene fecha
        if (ymdCierre) {
          const ymdMov = fechaYMD(m.fecha || m.createdAt);
          if (ymdMov && ymdMov !== ymdCierre) return false;
        }

        return true;
      });

      // === 2. Facturación Bank (NO efectivo) ===
      const facturacionBank = movs
        .filter((m) => m.metodoPago && m.metodoPago !== "Efectivo")
        .reduce((acc, m) => {
          const montoBase =
            Number(m.totalFinal != null ? m.totalFinal : m.monto) || 0;
          return acc + montoBase;
        }, 0);

      // === 3. Cobro EFT (solo efectivo) ===
      const cobroEFT = movs
        .filter((m) => m.metodoPago === "Efectivo")
        .reduce((acc, m) => {
          const montoBase =
            Number(m.totalFinal != null ? m.totalFinal : m.monto) || 0;
          return acc + montoBase;
        }, 0);

      // === 4. Parciales del mismo operador, mismo día y dentro del rango (tAnterior, tCierre] ===
      const parcialesFiltrados = parciales
        .filter((p) => {
          const opP = normalizarOperador(p.operador);
          if (opP !== opCierre) return false;

          const tParc = tsCierre(p);
          if (!Number.isFinite(tParc)) return false;

          if (tParc > tCierre) return false;
          if (tAnterior && Number.isFinite(tAnterior) && tParc <= tAnterior)
            return false;

          // opcional: mismo día
          if (ymdCierre) {
            const ymdP = fechaYMD(p.fecha || p.createdAt);
            if (ymdP && ymdP !== ymdCierre) return false;
          }

          return true;
        })
        .reduce((acc, p) => acc + (Number(p.monto) || 0), 0);

      // === 5. Abre Caja Con (viene del cierre anterior GLOBAL, sin importar operador) ===
      // cierre anterior por orden de fecha/createdAt
      const cierreAnterior = i > 0 ? cierresOrdenados[i - 1] : null;

      let abreCajaCon = 0;
      if (cierreAnterior) {
        abreCajaCon = Number(cierreAnterior.dejoEnCaja) || 0;
      }

      const dejaEnCaja = Number(cierre.dejoEnCaja) || 0;


      // === 6. Total Rendido (nuevo Excel-style)
      // Total Rendido = AbreCajaCon - DejaEnCaja + totalRecaudado + parcialesDelOperador
      const totalRecaudado = Number(cierre.totalRecaudado) || 0;

      const totalRendido = abreCajaCon - dejaEnCaja + totalRecaudado + parcialesFiltrados;

      // === 7. Total Calculado
      // Total Calculado = AbreCajaCon - DejaEnCaja + Cobro EFT
      const totalCalculado = abreCajaCon - dejaEnCaja + cobroEFT;

      // === 8. Resultado
      const resultado = totalRendido - totalCalculado;

      result.push({
        _id: cierre._id,
        fecha: cierre.fecha,               // viene del cierre
        hora: cierre.hora || "",           // HORA explícita del cierre
        operador: cierre.operador,
        facturacionBank,
        cobroEFT,
        abreCajaCon,
        dejoEnCaja: Number(cierre.dejoEnCaja) || 0,
        totalRendido,
        totalCalculado,
        resultado,
      });
    }

    return result;
  };

  const formatFechaCierre = (fecha, hora) => {
    if (!fecha) return '---';
    const d = new Date(fecha);
    if (isNaN(d)) return '---';

    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');

    const f = `${dd}/${mm}`;
    const h = hora || '';

    return `${f} - ${h}`;
  };

  const renderTablaComputos = () => {
    const columnas = [
      'Fecha', 'Operador', 'Facturación Bank', 'Cobro EFT', 'Abre Caja Con',
      'Deja en Caja', 'Total Rendido', 'Total Calculado', 'Resultado'
    ];

    // ORDEN DESCENDENTE (último cierre arriba)
    const computos = [...buildComputos()].sort((a, b) => {
      const t1 = tsCierre(a);
      const t2 = tsCierre(b);
      return t2 - t1; // DESC
    });

    const paginados = paginar(computos, paginaActual);
    const total = totalPaginas(computos);

    return (
      <div className="table-container">
        <div className="table-wrapper">
          <table className="transaction-table">
            <thead>
              <tr>
                {columnas.map(c => <th key={c}>{c}</th>)}
              </tr>
            </thead>

            <tbody>
              {paginados.map(item => (
                <tr key={item._id}>
                  <td>{formatFechaCierre(item.fecha, item.hora)}</td>
                  <td>{normalizarOperador(item.operador)}</td>
                  <td>${item.facturacionBank.toLocaleString('es-AR')}</td>
                  <td>${item.cobroEFT.toLocaleString('es-AR')}</td>
                  <td>${item.abreCajaCon.toLocaleString('es-AR')}</td>
                  <td>${item.dejoEnCaja.toLocaleString('es-AR')}</td>
                  <td>${item.totalRendido.toLocaleString('es-AR')}</td>
                  <td>${item.totalCalculado.toLocaleString('es-AR')}</td>
                  <td>${item.resultado.toLocaleString('es-AR')}</td>
                </tr>
              ))}

              {renderFilasVacias(ITEMS_POR_PAGINA - paginados.length, columnas.length)}
            </tbody>
          </table>

          {renderPaginado(total)}
        </div>
      </div>
    );
  };


  // ================================
  // Tablas existentes
  // ================================
  const renderTablaCierres = (datos) => {
    const filtrados = aplicarFiltros(datos)
      .filter(item => !retiradosLocales.has(item._id))
      .sort((a, b) => tsCierre(b) - tsCierre(a));

    const paginados = paginar(filtrados, paginaActual);
    const total = totalPaginas(filtrados);
    const isARetirar = activeCajaTab === 'A Retirar';

    return (
      <div className="table-container">
        <div className="table-wrapper">
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Operador</th>
                <th>Total Recaudado</th>
                <th>Dejó en Caja</th>
                <th>Total Rendido</th>
                {isARetirar && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {paginados.map((item) => (
                <tr key={item._id}>
                  <td>{item.fecha || '---'}</td>
                  <td>{item.hora || '---'}</td>
                  <td>{normalizarOperador(item.operador)}</td>
                  <td>${item.totalRecaudado != null ? Number(item.totalRecaudado).toLocaleString('es-AR') : '---'}</td>
                  <td>${item.dejoEnCaja != null ? Number(item.dejoEnCaja).toLocaleString('es-AR') : '---'}</td>
                  <td>${item.totalRendido != null ? Number(item.totalRendido).toLocaleString('es-AR') : '---'}</td>
                  {isARetirar && (
                    <td className="td-retirado">
                      <button className="btn-retirado" onClick={() => handleRetiradoClick(item._id)}>
                        Retirado
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {renderFilasVacias(ITEMS_POR_PAGINA - paginados.length, isARetirar ? 7 : 6)}
            </tbody>
          </table>
          {renderPaginado(total)}
        </div>
      </div>
    );
  };

  const renderTablaParciales = (datos) => {
    const filtrados = aplicarFiltros(datos)
      .sort((a, b) => tsCierre(b) - tsCierre(a));

    const paginados = paginar(filtrados, paginaActual);
    const total = totalPaginas(filtrados);

    return (
      <div className="table-container">
        <div className="table-wrapper">
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Operador</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {paginados.map((item) => (
                <tr key={item._id}>
                  <td>{buildDescripcion(item)}</td>
                  <td>{item.fecha || '---'}</td>
                  <td>{item.hora || '---'}</td>
                  <td>{normalizarOperador(item.operador)}</td>
                  <td>${item.monto != null ? Number(item.monto).toLocaleString('es-AR') : '---'}</td>
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

  // ================================
  // Impresión (expuesto vía ref)
  // ================================
  const estilosPrint = `
    <style>
      body { font-family: Arial, Helvetica, sans-serif; padding: 16px; }
      h1,h2,h3 { margin: 0; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; }
      th { background: #f5f5f5; text-align: left; }
      tr:nth-child(even) { background: #fafafa; }
      @page { size: A4 portrait; margin: 12mm; }
      @media print { .no-print { display: none !important; } }
    </style>
  `;

  const abrirVentanaImpresion = (titulo, encabezados, filasHtml) => {
    const win = window.open('', '_blank', 'width=1024,height=768');
    if (!win) {
      alert('El bloqueador impidió abrir la vista de impresión.');
      return;
    }
    const fecha = new Date();

    const header = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div>
          <div style="font-size:18px;font-weight:700;">${titulo}</div>
          <div style="font-size:12px;color:#555">Generado: ${fecha.toLocaleDateString('es-AR')} ${fecha.toLocaleTimeString('es-AR')}</div>
        </div>
      </div>
    `;

    const html = `
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${titulo}</title>
        ${estilosPrint}
      </head>
      <body>
        ${header}
        <table>
          <thead>
            <tr>${encabezados.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${filasHtml || `<tr><td colspan="${encabezados.length}">Sin datos</td></tr>`}
          </tbody>
        </table>
        <div class="no-print" style="margin-top:12px;text-align:right;">
          <button onclick="window.print()">Imprimir</button>
        </div>
      </body>
      </html>
    `;

    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  const imprimirListadoCierre = () => {
    if (activeCajaTab === 'Parciales') {
      const datos = aplicarFiltros(parciales)
        .sort((a, b) => tsCierre(b) - tsCierre(a));

      const encabezados = ['Descripción', 'Fecha', 'Hora', 'Operador', 'Monto'];
      const filas = datos
        .map(item => `
            <tr>
              <td>${buildDescripcion(item)}</td>
              <td>${item.fecha || '---'}</td>
              <td>${item.hora || '---'}</td>
              <td>${normalizarOperador(item.operador)}</td>
              <td>${item.monto != null ? ('$' + Number(item.monto).toLocaleString('es-AR')) : '---'}</td>
            </tr>
        `).join('');

      abrirVentanaImpresion('Parciales - Cierre de Caja', encabezados, filas);
      return;
    }

    const isARetirar = activeCajaTab === 'A Retirar';
    const base = isARetirar ? dataARetirar : dataRetirado;

    const datos = aplicarFiltros(base)
      .filter(item => !retiradosLocales.has(item._id))
      .sort((a, b) => tsCierre(b) - tsCierre(a));

    const encabezados = ['Fecha', 'Hora', 'Operador', 'Total Recaudado', 'Dejó en Caja', 'Total Rendido'];

    const filas = datos.map(item => `
      <tr>
        <td>${item.fecha || '---'}</td>
        <td>${item.hora || '---'}</td>
        <td>${normalizarOperador(item.operador)}</td>
        <td>${item.totalRecaudado != null ? ('$' + Number(item.totalRecaudado).toLocaleString('es-AR')) : '---'}</td>
        <td>${item.dejoEnCaja != null ? ('$' + Number(item.dejoEnCaja).toLocaleString('es-AR')) : '---'}</td>
        <td>${item.totalRendido != null ? ('$' + Number(item.totalRendido).toLocaleString('es-AR')) : '---'}</td>
      </tr>
    `).join('');

    abrirVentanaImpresion('Cierre de Caja', encabezados, filas);
  };

  useImperativeHandle(ref, () => ({
    imprimirListadoCierre
  }));

  // ================================
  // RENDER PRINCIPAL
  // ================================
  return (
    <div className="caja">
      {activeCajaTab === 'A Retirar' && renderTablaCierres(dataARetirar)}
      {activeCajaTab === 'Retirado' && renderTablaCierres(dataRetirado)}
      {activeCajaTab === 'Parciales' && renderTablaParciales(parciales)}
      {activeCajaTab === 'Cómputos' && renderTablaComputos()}
    </div>
  );
});

export default CierreDeCajaAdmin;
