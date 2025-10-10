// CierreDeCajaAdmin.jsx
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import '../Caja/Caja.css';

const ITEMS_POR_PAGINA = 10;

// 🔒 Normaliza cualquier variante de "operador" a texto legible
const normalizarOperador = (op) => {
  if (!op) return '---';
  if (typeof op === 'string') {
    if (op === '[object Object]') return '---';
    if (/^[0-9a-fA-F]{24}$/.test(op)) return '---';
    return op;
  }
  if (typeof op === 'object') {
    return op.nombre || op.name || op.username || op.email || op._id || '---';
  }
  return String(op);
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
  const intervaloRef = useRef(null);

  // Reset de página al cambiar subpestaña o búsqueda
  useEffect(() => {
    setPaginaActual(1);
  }, [activeCajaTab, searchTerm]);

  // Reset de cache de retirados locales si cambia dataset externo
  useEffect(() => {
    setRetiradosLocales(new Set());
  }, [cierresDeCaja]);

  // Filtro común para las tres vistas
  const aplicarFiltros = (datos) => {
    return datos.filter(item => {
      const opNombre = normalizarOperador(item.operador);

      const search = (searchTerm || '').trim().toUpperCase();
      const searchMatch =
        opNombre?.toUpperCase().includes(search) ||
        (item?.descripcion || '').toUpperCase().includes(search) ||
        (item?.nombre || '').toUpperCase().includes(search);

      const operadorMatch = !filtros.operador ||
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
        // item.fecha puede venir como YYYY-MM-DD
        const fechaItem = new Date(item.fecha);
        const ymd = !isNaN(fechaItem) ? fechaItem.toISOString().split('T')[0] : (item.fecha || '');
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

  // Cargas iniciales de Cierres (A Retirar/Retirado)
  useEffect(() => {
    const fetchCierresDeCaja = async () => {
      try {
        const res = await fetch('https://apiprueba.garageia.com/api/cierresdecaja/');
        if (!res.ok) throw new Error('Error al obtener cierres de caja');
        const data = await res.json();

        setDataARetirar(data.filter(item => !item.retirado));
        setDataRetirado(data.filter(item => item.retirado));
      } catch (error) {
        console.error('Error al cargar cierres de caja:', error);
        setDataARetirar([]);
        setDataRetirado([]);
      }
    };

    fetchCierresDeCaja();
  }, []);

  // Carga de Parciales
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

  // Auto-refresh según subpestaña
  useEffect(() => {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }

    const fetchCierres = async () => {
      try {
        const res = await fetch('https://apiprueba.garageia.com/api/cierresdecaja/');
        if (!res.ok) throw new Error('Error al obtener cierres de caja');
        const data = await res.json();
        setDataARetirar(data.filter(i => !i.retirado));
        setDataRetirado(data.filter(i => i.retirado));
      } catch (error) {
        console.error('Error al actualizar cierres de caja:', error);
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

  // Helpers de tabla/paginado
  const paginar = (array, pagina) => {
    const startIndex = (pagina - 1) * ITEMS_POR_PAGINA;
    return array.slice(startIndex, startIndex + ITEMS_POR_PAGINA);
  };

  const totalPaginas = (array) => Math.ceil((array?.length || 0) / ITEMS_POR_PAGINA);

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

  // Tablas
  const renderTablaCierres = (datos) => {
    const filtrados = aplicarFiltros(datos)
      .filter(item => !retiradosLocales.has(item._id))
      .reverse();

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
    const filtrados = aplicarFiltros(datos).reverse();
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
      alert('El bloqueador de ventanas emergentes impidió abrir la vista de impresión.');
      return;
    }
    const fecha = new Date();
    const header = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div>
          <div style="font-size:18px;font-weight:700;">${titulo}</div>
          <div style="font-size:12px;color:#555">Generado: ${fecha.toLocaleDateString('es-AR')} ${fecha.toLocaleTimeString('es-AR')}</div>
        </div>
        <div style="font-size:12px;color:#555"></div>
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
              ${filasHtml || '<tr><td colspan="${encabezados.length}">Sin datos</td></tr>'}
            </tbody>
          </table>
          <div class="no-print" style="margin-top:12px;text-align:right;">
            <button onclick="window.print()">Imprimir</button>
          </div>
          <script>window.addEventListener('load', () => { setTimeout(() => { window.print(); }, 200); });</script>
        </body>
      </html>
    `;
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  const imprimirListadoCierre = () => {
    // 1) PARCIALES
    if (activeCajaTab === 'Parciales') {
      const datos = aplicarFiltros(parciales).reverse();
      const encabezados = ['Descripción', 'Fecha', 'Hora', 'Operador', 'Monto'];
      const filas = datos.map(item => `
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

    // 2) A RETIRAR / RETIRADO
    const isARetirar = activeCajaTab === 'A Retirar';
    const base = isARetirar ? dataARetirar : dataRetirado;
    const datos = aplicarFiltros(base)
      .filter(item => !retiradosLocales.has(item._id))
      .reverse();

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

  // Exponer método de impresión al padre (Body.jsx)
  useImperativeHandle(ref, () => ({
    imprimirListadoCierre
  }));

  // Render principal
  return (
    <div className="caja">
      {activeCajaTab === 'A Retirar' && renderTablaCierres(dataARetirar)}
      {activeCajaTab === 'Retirado' && renderTablaCierres(dataRetirado)}
      {activeCajaTab === 'Parciales' && renderTablaParciales(parciales)}
    </div>
  );
});

export default CierreDeCajaAdmin;
