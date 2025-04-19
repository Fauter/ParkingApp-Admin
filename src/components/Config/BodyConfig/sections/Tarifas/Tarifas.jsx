import React, { useEffect, useState } from 'react';
import './Tarifas.css';

const Tarifas = () => {
  const [tarifas, setTarifas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editandoCampo, setEditandoCampo] = useState({ id: null, campo: null });
  const [valorTemporal, setValorTemporal] = useState('');

  useEffect(() => {
    fetch('https://parkingapp-back.onrender.com/api/tarifas')
      .then(res => res.json())
      .then(data => setTarifas(data))
      .catch(err => console.error('Error cargando tarifas:', err));
  }, []);

  const tarifasPorTipo = {
    hora: tarifas.filter(t => t.tipo === 'hora'),
    turno: tarifas.filter(t => t.tipo === 'turno'),
    estadia: tarifas.filter(t => t.tipo === 'estadia'),
    mensual: tarifas.filter(t => t.tipo === 'mensual'),
  };

  const crearTarifa = async (tipo) => {
    let data;

    switch (tipo) {
      case 'hora':
        data = { nombre: 'Hora', tipo: 'hora', horas: 1, tolerancia: 5 };
        break;
      case 'turno':
        data = { nombre: 'Turno', tipo: 'turno', horas: 6, tolerancia: 10 };
        break;
      case 'estadia':
        data = { nombre: 'Día', tipo: 'estadia', dias: 1, tolerancia: 60 };
        break;
      case 'mensual':
        data = { nombre: 'Mensual', tipo: 'mensual', dias: 30, tolerancia: 1440 };
        break;
      default:
        return;
    }

    try {
      const res = await fetch('https://parkingapp-back.onrender.com/api/tarifas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const nueva = await res.json();
      setTarifas(prev => [...prev, nueva]);
      setShowModal(false);
    } catch (err) {
      console.error('Error creando tarifa:', err);
    }
  };

  const eliminarTarifa = async (id) => {
    if (!window.confirm("¿Estás seguro de que querés eliminar esta tarifa?")) return;

    try {
      await fetch(`https://parkingapp-back.onrender.com/api/tarifas/${id}`, {
        method: 'DELETE',
      });
      setTarifas(prev => prev.filter(t => t._id !== id));
    } catch (err) {
      console.error('Error eliminando tarifa:', err);
    }
  };

  const activarEdicion = (id, campo, valorActual) => {
    setEditandoCampo({ id, campo });
    setValorTemporal(valorActual);
  };

  const manejarCambio = (e) => {
    setValorTemporal(e.target.value);
  };

  const manejarTecla = async (e, tarifa) => {
    if (e.key === 'Enter') {
      const actualizada = { ...tarifa, [editandoCampo.campo]: valorTemporal };

      try {
        const res = await fetch(`https://parkingapp-back.onrender.com/api/tarifas/${tarifa._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(actualizada),
        });
        const nueva = await res.json();
        setTarifas(prev => prev.map(t => (t._id === tarifa._id ? nueva : t)));
        setEditandoCampo({ id: null, campo: null });
        setValorTemporal('');
      } catch (err) {
        console.error('Error actualizando tarifa:', err);
      }
    } else if (e.key === 'Escape') {
      setEditandoCampo({ id: null, campo: null });
      setValorTemporal('');
    }
  };

  const renderCelda = (tarifa, campo) => {
    const valor = tarifa[campo] ?? '';
    const esEditando = editandoCampo.id === tarifa._id && editandoCampo.campo === campo;
    const esPrimeraColumna = campo === 'nombre';

    return (
      <td
        onClick={() => activarEdicion(tarifa._id, campo, valor)}
        style={{ cursor: 'pointer' }}
        className={`${esEditando ? 'editando-td' : ''} ${esPrimeraColumna ? 'primera-columna' : ''}`}
      >
        {esEditando ? (
          <input
            value={valorTemporal}
            onChange={manejarCambio}
            onKeyDown={(e) => manejarTecla(e, tarifa)}
            autoFocus
          />
        ) : (
          valor || '-'
        )}
      </td>
    );
  };

  const renderTabla = (tipo, headers, campos) => {
    const tarifasFiltradas = tarifasPorTipo[tipo];

    return (
      <div className="tarifa-section">
        <h2>{`Tipo ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`}</h2>
        <table className="tarifa-table">
          <thead>
            <tr>
              {headers.map((header, idx) => (
                <th key={idx}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tarifasFiltradas.length === 0 ? (
              <tr><td colSpan={headers.length} className="empty-row">Sin tarifas de tipo {tipo}</td></tr>
            ) : (
              tarifasFiltradas.map(tarifa => (
                <tr key={tarifa._id}>
                  {campos.map((campo, idx) => renderCelda(tarifa, campo))}
                  <td>
                    <button className="eliminar-tarifa-btn" onClick={() => eliminarTarifa(tarifa._id)}>Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="tarifas-container">
      <div className="tarifas-title">
        <h1>Bloques de tiempo</h1>
        <button className="crear-tarifa-btn" onClick={() => setShowModal(true)}>+ Nueva Tarifa</button>
      </div>
      {showModal && (
        <div className="tarifasModal-overlay">
          <div className="tarifasModal-contenido">
            <h2>Crear nueva tarifa</h2>
            <div className="tarifasModal-botones">
              <button onClick={() => crearTarifa('hora')}>
                <strong>Hora</strong>
                <span className="tarifasModal-subtitulo">Estacionamiento x hora</span>
              </button>
              <button onClick={() => crearTarifa('turno')}>
                <strong>Turno</strong>
                <span className="tarifasModal-subtitulo">Estacionamiento x turno</span>
              </button>
              <button onClick={() => crearTarifa('estadia')}>
                <strong>Estadía</strong>
                <span className="tarifasModal-subtitulo">Estacionamiento diario</span>
              </button>
              <button onClick={() => crearTarifa('mensual')}>
                <strong>Mensual</strong>
                <span className="tarifasModal-subtitulo">Estacionamiento mensual</span>
              </button>
            </div>
            <button className="tarifasModal-cerrar" onClick={() => setShowModal(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}


      {renderTabla('hora', ['', 'Días', 'Horas', 'Minutos', 'Tolerancia (mins)', 'Acciones'], ['nombre', 'dias', 'horas', 'minutos', 'tolerancia'])}
      {renderTabla('turno', ['', 'Días', 'Horas', 'Minutos', 'Tolerancia (mins)', 'Acciones'], ['nombre', 'dias', 'horas', 'minutos', 'tolerancia'])}
      {renderTabla('estadia', ['', 'Días', 'Tolerancia (mins)', 'Acciones'], ['nombre', 'dias', 'tolerancia'])}
      {renderTabla('mensual', ['', 'Acciones'], ['nombre'])}
    </div>
  );
};

export default Tarifas;
