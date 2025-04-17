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

  const tarifasHora = tarifas.filter(t => t.tipo === 'hora');
  const tarifasTurno = tarifas.filter(t => t.tipo === 'turno');
  const tarifasEstadia = tarifas.filter(t => t.tipo === 'estadia');
  const tarifasMensual = tarifas.filter(t => t.tipo === 'mensual');

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


  return (
    <div className="tarifas-container">
      <div className="tarifas-title">
        <h1>Bloques de tiempo</h1>
        <button className="crear-tarifa-btn" onClick={() => setShowModal(true)}>+ Nueva Tarifa</button>
      </div>
      {showModal && (
        <div className="modal-overlay">
          <div className="modalTarifas">
            <h2>Crear nueva tarifa</h2>
            <div className="botones-tarifa">
              <button onClick={() => crearTarifa('hora')}>
                <strong>Hora</strong>
                <span className="subtitulo-tarifa">Estacionamiento x hora</span>
              </button>
              <button onClick={() => crearTarifa('turno')}>
                <strong>Turno</strong>
                <span className="subtitulo-tarifa">Estacionamiento x turno</span>
              </button>
              <button onClick={() => crearTarifa('estadia')}>
                <strong>Estadía</strong>
                <span className="subtitulo-tarifa">Estacionamiento diario</span>
              </button>
              <button onClick={() => crearTarifa('mensual')}>
                <strong>Mensual</strong>
                <span className="subtitulo-tarifa">Estacionamiento mensual</span>
              </button>
            </div>
            <button className="cerrar-modal" onClick={() => setShowModal(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Tipo Hora */}
      <div className="tarifa-section">
        <h2>Tipo Hora</h2>
        <table className="tarifa-table">
          <thead>
            <tr>
              <th></th>
              <th>Días</th>
              <th>Horas</th>
              <th>Minutos</th>
              <th>Tolerancia (mins)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tarifasHora.length === 0 ? (
              <tr><td colSpan="6" className="empty-row">Sin tarifas de tipo hora</td></tr>
            ) : (
              tarifasHora.map(tarifa => (
                <tr key={tarifa._id}>
                  {renderCelda(tarifa, 'nombre')}
                  {renderCelda(tarifa, 'dias')}
                  {renderCelda(tarifa, 'horas')}
                  {renderCelda(tarifa, 'minutos')}
                  {renderCelda(tarifa, 'tolerancia')}
                  <td>
                    <button className="eliminar-tarifa-btn" onClick={() => eliminarTarifa(tarifa._id)}>Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Tipo Turno */}
      <div className="tarifa-section">
        <h2>Tipo Turno</h2>
        <table className="tarifa-table">
          <thead>
            <tr>
              <th></th>
              <th>Días</th>
              <th>Horas</th>
              <th>Minutos</th>
              <th>Tolerancia (mins)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tarifasTurno.length === 0 ? (
              <tr><td colSpan="6" className="empty-row">Sin tarifas de tipo turno</td></tr>
            ) : (
              tarifasTurno.map(tarifa => (
                <tr key={tarifa._id}>
                  {renderCelda(tarifa, 'nombre')}
                  {renderCelda(tarifa, 'dias')}
                  {renderCelda(tarifa, 'horas')}
                  {renderCelda(tarifa, 'minutos')}
                  {renderCelda(tarifa, 'tolerancia')}
                  <td>
                    <button className="eliminar-tarifa-btn" onClick={() => eliminarTarifa(tarifa._id)}>Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Tipo Estadía */}
      <div className="tarifa-section">
        <h2>Tipo Estadía</h2>
        <table className="tarifa-table">
          <thead>
            <tr>
              <th></th>
              <th>Días</th>
              <th>Tolerancia (mins)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tarifasEstadia.length === 0 ? (
              <tr><td colSpan="4" className="empty-row">Sin tarifas de tipo estadía</td></tr>
            ) : (
              tarifasEstadia.map(tarifa => (
                <tr key={tarifa._id}>
                  {renderCelda(tarifa, 'nombre')}
                  {renderCelda(tarifa, 'dias')}
                  {renderCelda(tarifa, 'tolerancia')}
                  <td>
                    <button className="eliminar-tarifa-btn" onClick={() => eliminarTarifa(tarifa._id)}>Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Tipo Mensual */}
      <div className="tarifa-section">
        <h2>Tipo Mensual</h2>
        <table className="tarifa-table">
        <thead>
          <tr>
            <th className="col-nombre-mensual"></th>
            <th className="col-acciones-mensual">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tarifasMensual.map(tarifa => (
            <tr key={tarifa._id}>
              <td className="col-nombre-mensual primera-columna">{tarifa.nombre}</td>
              <td className="col-acciones-mensual">
                <button className="eliminar-tarifa-btn" onClick={() => eliminarTarifa(tarifa._id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
};

export default Tarifas;
