import React, { useState, useEffect, useRef } from 'react';
import '../Caja/Caja.css';

const ITEMS_POR_PAGINA = 10;

// 🔒 Defensa: normaliza cualquier variante de "operador" a texto legible
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

const CierreDeCajaAdmin = ({
  activeCajaTab,
  searchTerm,
  onCajaTabChange,
  cierresDeCaja = [],
  aRetirar = [],
  retirado = [],
  parciales: parcialesProp = [],
  limpiarFiltros,
  onActualizar,
  filtros // Añadimos filtros como prop
}) => {
  const [paginaActual, setPaginaActual] = useState(1);
  const [retiradosLocales, setRetiradosLocales] = useState(new Set());
  const [parciales, setParciales] = useState([]);
  const [dataARetirar, setDataARetirar] = useState([]);
  const [dataRetirado, setDataRetirado] = useState([]);

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

      const searchMatch = opNombre?.toUpperCase().includes(searchTerm.trim().toUpperCase());

      const operadorMatch = !filtros.operador || 
        opNombre?.toLowerCase().includes(filtros.operador.toLowerCase());
      
      let horaMatch = true;
      if (filtros.hora) {
        const [desde, hasta] = filtros.hora.split('-').map(Number);
        const horaItem = parseInt(item.hora?.split(':')[0], 10);
        horaMatch = horaItem >= desde && horaItem < hasta;
      }
      
      let fechaMatch = true;
      if (filtros.fecha) {
        const fechaItem = new Date(item.fecha).toISOString().split('T')[0];
        fechaMatch = fechaItem === filtros.fecha;
      }
      
      let rangoFechaMatch = true;
      if (filtros.fechaDesde || filtros.fechaHasta) {
        const fechaItem = new Date(item.fecha);
        const fechaDesde = filtros.fechaDesde ? new Date(filtros.fechaDesde) : null;
        const fechaHasta = filtros.fechaHasta
          ? new Date(new Date(filtros.fechaHasta).setDate(new Date(filtros.fechaHasta).getDate() + 1))
          : null;
        
        if (fechaDesde) rangoFechaMatch = fechaItem >= fechaDesde;
        if (fechaHasta) rangoFechaMatch = rangoFechaMatch && fechaItem < fechaHasta;
      }
      
      return searchMatch && operadorMatch && horaMatch && fechaMatch && rangoFechaMatch;
    });
  };

  useEffect(() => {
    const fetchCierresDeCaja = async () => {
      try {
        const res = await fetch('https://api.garageia.com/api/cierresdecaja/');
        if (!res.ok) throw new Error('Error al obtener cierres de caja');
        const data = await res.json();
        
        const aRetirarData = data.filter(item => !item.retirado);
        setDataARetirar(aRetirarData);
        
        const retiradoData = data.filter(item => item.retirado);
        setDataRetirado(retiradoData);
      } catch (error) {
        console.error('Error al cargar cierres de caja:', error);
        setDataARetirar([]);
        setDataRetirado([]);
      }
    };

    fetchCierresDeCaja();
  }, []);

  const fetchParciales = async () => {
    try {
      const res = await fetch('https://api.garageia.com/api/cierresdecaja/parcial');
      if (!res.ok) throw new Error('Error al obtener parciales');
      const data = await res.json();
      setParciales(data);
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

    const fetchData = async () => {
      try {
        const res = await fetch('https://api.garageia.com/api/cierresdecaja/');
        if (!res.ok) throw new Error('Error al obtener cierres de caja');
        const data = await res.json();
        
        const aRetirarData = data.filter(item => !item.retirado);
        setDataARetirar(aRetirarData);
        
        const retiradoData = data.filter(item => item.retirado);
        setDataRetirado(retiradoData);
      } catch (error) {
        console.error('Error al actualizar cierres de caja:', error);
      }
    };

    if (activeCajaTab === 'Parciales') {
      fetchParciales();
      intervaloRef.current = setInterval(() => {
        fetchParciales();
      }, 5000);
    } else if (activeCajaTab === 'A Retirar' || activeCajaTab === 'Retirado') {
      fetchData();
      intervaloRef.current = setInterval(() => {
        fetchData();
      }, 5000);
    }

    return () => {
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
        intervaloRef.current = null;
      }
    };
  }, [activeCajaTab]);

  const paginar = (array, pagina) => {
    const startIndex = (pagina - 1) * ITEMS_POR_PAGINA;
    return array.slice(startIndex, startIndex + ITEMS_POR_PAGINA);
  };

  const totalPaginas = (array) => Math.ceil(array.length / ITEMS_POR_PAGINA);

  const renderPaginado = (total) => (
    <div className="paginado">
      <button disabled={paginaActual === 1} onClick={() => setPaginaActual(paginaActual - 1)}>Anterior</button>
      <span>Página {paginaActual} de {total}</span>
      <button disabled={paginaActual === total} onClick={() => setPaginaActual(paginaActual + 1)}>Siguiente</button>
    </div>
  );

  const renderFilasVacias = (cantidad, columnas) =>
    Array.from({ length: cantidad }, (_, i) => (
      <tr key={`empty-${i}`}>
        {Array.from({ length: columnas }, (_, j) => <td key={j}>---</td>)}
      </tr>
    ));

  const handleRetiradoClick = async (id) => {
    const confirmado = window.confirm('¿Estás seguro de que querés marcar este cierre como retirado?');
    if (!confirmado) return;

    setRetiradosLocales(prev => new Set(prev).add(id));

    try {
      const res = await fetch(`https://api.garageia.com/api/cierresdecaja/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retirado: true }),
      });

      if (!res.ok) throw new Error('Error al actualizar');

      const data = await res.json();
      const updatedARetirar = dataARetirar.filter(item => item._id !== id);
      setDataARetirar(updatedARetirar);
      
      const updatedRetirado = [...dataRetirado, data];
      setDataRetirado(updatedRetirado);
    } catch (error) {
      console.error('Error al marcar como retirado:', error);
      setRetiradosLocales(prev => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
    }
  };

  const renderTablaCierres = (datos) => {
    const filtrados = aplicarFiltros(datos).filter(item => !retiradosLocales.has(item._id)).reverse();
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
                  <td>${item.totalRecaudado?.toLocaleString('es-AR') || '---'}</td>
                  <td>${item.dejoEnCaja?.toLocaleString('es-AR') || '---'}</td>
                  <td>${item.totalRendido?.toLocaleString('es-AR') || '---'}</td>
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
                <th>Fecha</th>
                <th>Hora</th>
                <th>Operador</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {paginados.map((item) => (
                <tr key={item._id}>
                  <td>{item.fecha || '---'}</td>
                  <td>{item.hora || '---'}</td>
                  <td>{normalizarOperador(item.operador)}</td>
                  <td>${item.monto?.toLocaleString('es-AR') || '---'}</td>
                </tr>
              ))}
              {renderFilasVacias(ITEMS_POR_PAGINA - paginados.length, 4)}
            </tbody>
          </table>
          {renderPaginado(total)}
        </div>
      </div>
    );
  };

  return (
    <div className="caja">
      {activeCajaTab === 'A Retirar' && renderTablaCierres(dataARetirar)}
      {activeCajaTab === 'Retirado' && renderTablaCierres(dataRetirado)}
      {activeCajaTab === 'Parciales' && renderTablaParciales(parciales)}
    </div>
  );
};

export default CierreDeCajaAdmin;
