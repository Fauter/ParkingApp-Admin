import React, { useEffect, useState } from 'react';
import './Tarifas.css';

const Tarifas = () => {
  const [tarifas, setTarifas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState(null);
  const [nuevoInput, setNuevoInput] = useState({});
  const [editandoCampo, setEditandoCampo] = useState({ id: null, campo: null });
  const [valorTemporal, setValorTemporal] = useState('');
  const [cargandoParametros, setCargandoParametros] = useState(true);
  const [parametros, setParametros] = useState({
    // Para tipo "hora"
    fraccionarDesde: "0",
    toleranciaInicial: 0,
    permitirCobroAnticipadoHora: false,
    // Para tipo "turno"
    calcularExcedenteTurno: false,
    permitirReservaTurno: false,
    permitirCobroAnticipadoTurno: false,
    // Para tipo "estadia"
    horarioFinalizacionEstadia: {
      habilitado: false,
      hora: "10:00"
    },
    registrarPresencia: false,
    calcularExcedentePorHoraEstadia: false,
    permitirCobroAnticipadoEstadia: false
  });

  useEffect(() => {
    // Cargar las tarifas desde la API
    fetch('http://localhost:5000/api/tarifas')
      .then(res => res.json())
      .then(data => setTarifas(data))
      .catch(err => console.error('Error cargando tarifas:', err));

    // Cargar los parámetros por defecto desde el servidor o archivo JSON
    fetch('http://localhost:5000/api/parametros')
      .then(res => res.json())
      .then(data => {
        const newParametros = {
          fraccionarDesde: data.fraccionarDesde || "0",
          toleranciaInicial: data.toleranciaInicial || 0,
          permitirCobroAnticipado: data.permitirCobroAnticipado || false
        };
        setParametros(newParametros);
        setCargandoParametros(false);
      })
      .catch(err => console.error('Error cargando parámetros:', err));
  }, []);
  useEffect(() => {
    // Solo guardar los parámetros cuando se haya terminado de cargar los parámetros
    if (!cargandoParametros) {
      guardarParametros();
    }
  }, [parametros, cargandoParametros]);

  const tarifasPorTipo = {
    hora: tarifas.filter(t => t.tipo === 'hora'),
    turno: tarifas.filter(t => t.tipo === 'turno'),
    estadia: tarifas.filter(t => t.tipo === 'estadia'),
    mensual: tarifas.filter(t => t.tipo === 'mensual'),
  };

  const handleTipoSeleccionado = (tipo) => {
    setSelectedTipo(tipo);
    setNuevoInput({});
  };

  const crearTarifaFinal = async () => {
    const defaults = {
      hora: { nombre: 'Hora', tipo: 'hora' },
      turno: { nombre: 'Turno', tipo: 'turno' },
      estadia: { nombre: 'Día', tipo: 'estadia' },
      mensual: { nombre: 'Mensual', tipo: 'mensual' }
    };

    const data = { ...defaults[selectedTipo], ...nuevoInput };

    try {
      const res = await fetch('http://localhost:5000/api/tarifas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const nueva = await res.json();
      setTarifas(prev => [...prev, nueva]);
      setShowModal(false);
      setSelectedTipo(null);
    } catch (err) {
      console.error('Error creando tarifa:', err);
    }
  };

  const eliminarTarifa = async (id) => {
    if (!window.confirm("¿Estás seguro de que querés eliminar esta tarifa?")) return;

    try {
      await fetch(`http://localhost:5000/api/tarifas/${id}`, {
        method: 'DELETE',
      });
      setTarifas(prev => prev.filter(t => t._id !== id));
    } catch (err) {
      console.error('Error eliminando tarifa:', err);
    }
  };

  const guardarParametros = () => {
    fetch('http://localhost:5000/api/parametros', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parametros),
    })
      .then(res => res.json())
      .catch(err => console.error('Error guardando parámetros:', err));
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
      const actualizada = { ...tarifa, [editandoCampo.campo]: editandoCampo.campo === 'nombre' ? valorTemporal : parseInt(valorTemporal) || 0 };

      try {
        const res = await fetch(`http://localhost:5000/api/tarifas/${tarifa._id}`, {
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

  const renderInputField = (label, field) => (
    <div className="input-group">
      <label>{label}</label>
      <input
        type={field === 'nombre' ? 'text' : 'number'}
        value={nuevoInput[field] || ''}
        onChange={(e) =>
          setNuevoInput(prev => ({
            ...prev,
            [field]: field === 'nombre' ? e.target.value : parseInt(e.target.value) || 0
          }))
        }
      />
    </div>
  );

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
        {/* TIPO HORA */}
        {tipo === 'hora' && (
          <div className="configuracion-hora-extra">
            <div className="config-item">
              <label>Fraccionar a partir de:</label>
              <select
                value={parametros.fraccionarDesde || "0"}
                onChange={(e) => setParametros(prev => ({ ...prev, fraccionarDesde: e.target.value }))}
              >
                <option value="0">Sin Fracción</option>
                <option value="60">60 Minutos</option>
                <option value="720">720 minutos</option>
                <option value="1440">1440 minutos</option>
              </select>
            </div>
            <div className="config-item">
              <label>Tolerancia Inicial:</label>
              <input
                type="number"
                value={parametros.toleranciaInicial || ""}
                onChange={(e) => setParametros(prev => ({ ...prev, toleranciaInicial: Number(e.target.value) }))}
              />
            </div>
            <div className="config-item checkbox-item">
              <label>
                <input
                  type="checkbox"
                  checked={parametros.permitirCobroAnticipadoHora || false}
                  onChange={(e) => setParametros(prev => ({ ...prev, permitirCobroAnticipadoHora: e.target.checked }))}
                />
                Permitir cobro anticipado
              </label>
            </div>
          </div>
        )}
        {tipo === 'turno' && (
          <div className="configuracion-turno">
            <div className="config-wrapper-turno">
              <div className="lado-izquierdo-turno">
                <div className="config-item-turno">
                  <label>
                    <input
                      type="checkbox"
                      checked={parametros.calcularExcedenteTurno || false}
                      onChange={(e) => setParametros(prev => ({ ...prev, calcularExcedenteTurno: e.target.checked }))}
                    />
                    Calcular excedente por hora
                  </label>
                </div>
              </div>
              <div className="lado-derecho-turno">
                <div className="config-item-turno">
                  <label>
                    <input
                      type="checkbox"
                      checked={parametros.permitirReservaTurno || false}
                      onChange={(e) => setParametros(prev => ({ ...prev, permitirReservaTurno: e.target.checked }))}
                    />
                    Permitir reserva
                  </label>
                </div>
                <div className="config-item-turno">
                  <label>
                    <input
                      type="checkbox"
                      checked={parametros.permitirCobroAnticipadoTurno || false}
                      onChange={(e) => setParametros(prev => ({ ...prev, permitirCobroAnticipadoTurno: e.target.checked }))}
                    />
                    Permitir cobro anticipado
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
        {tipo === 'estadia' && (
          <div className="configuracion-estadia">
            <div className="config-wrapper">
              <div className="config-item-estadia">
                <label>
                  <input
                    type="checkbox"
                    checked={parametros.horarioFinalizacionEstadia?.habilitado || false}
                    onChange={(e) =>
                      setParametros(prev => ({
                        ...prev,
                        horarioFinalizacionEstadia: {
                          ...prev.horarioFinalizacionEstadia,
                          habilitado: e.target.checked,
                        },
                      }))
                    }
                  />
                  Horario de finalización de estadía
                </label>
                <div className="input-hora-wrapper">
                  {parametros.horarioFinalizacionEstadia?.habilitado && (
                    <input
                      type="time"
                      value={parametros.horarioFinalizacionEstadia?.hora || "10:00"}
                      onChange={(e) =>
                        setParametros(prev => ({
                          ...prev,
                          horarioFinalizacionEstadia: {
                            ...prev.horarioFinalizacionEstadia,
                            hora: e.target.value,
                            habilitado: true,
                          },
                        }))
                      }
                    />
                  )}
                </div>
              </div>
              <div className="config-item-estadia">
                <label>
                  <input
                    type="checkbox"
                    checked={parametros.registrarPresencia || false}
                    onChange={(e) => setParametros(prev => ({ ...prev, registrarPresencia: e.target.checked }))}
                  />
                  Registrar presencia
                </label>
              </div>
              <div className="config-item-estadia">
                <label>
                  <input
                    type="checkbox"
                    checked={parametros.calcularExcedentePorHoraEstadia || false}
                    onChange={(e) => setParametros(prev => ({ ...prev, calcularExcedentePorHoraEstadia: e.target.checked }))}
                  />
                  Calcular excedente por hora
                </label>
              </div>
              <div className="config-item-estadia">
                <label>
                  <input
                    type="checkbox"
                    checked={parametros.permitirCobroAnticipadoEstadia || false}
                    onChange={(e) => setParametros(prev => ({ ...prev, permitirCobroAnticipadoEstadia: e.target.checked }))}
                  />
                  Permitir cobro anticipado
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  

  const renderNuevoModal = () => {
    const campos = {
      hora: ['nombre', 'dias', 'horas', 'minutos', 'tolerancia'],
      turno: ['nombre', 'dias', 'horas', 'minutos', 'tolerancia'],
      estadia: ['nombre', 'dias', 'tolerancia'],
      mensual: ['nombre'],
    };

    return (
      <div className="tarifasModal-overlay">
        <div className="crear-tarifa-modal">
          <h2>Crear tarifa tipo {selectedTipo}</h2>
          {campos[selectedTipo].map(campo =>
            renderInputField(
              campo === 'nombre'
                ? 'Etiqueta'
                : campo.charAt(0).toUpperCase() + campo.slice(1) + (campo === 'tolerancia' ? ' (mins)' : ''),
              campo
            )
          )}
          <button onClick={crearTarifaFinal}>Crear</button>
          <button onClick={() => setSelectedTipo(null)}>Cancelar</button>
        </div>
      </div>
    );
  };

  return (
    <div className="tarifas-container">
      <div className="tarifas-title">
        <h1>Bloques de tiempo</h1>
        <button className="crear-tarifa-btn" onClick={() => setShowModal(true)}>+ Nueva Tarifa</button>
      </div>

      {showModal && !selectedTipo && (
        <div className="tarifasModal-overlay">
          <div className="tarifasModal-contenido">
            <h2>Seleccioná el tipo de tarifa</h2>
            <div className="tarifasModal-botones">
              <button onClick={() => handleTipoSeleccionado('hora')}>
                <strong>Hora</strong>
                <span className="tarifasModal-subtitulo">Estacionamiento x hora</span>
              </button>
              <button onClick={() => handleTipoSeleccionado('turno')}>
                <strong>Turno</strong>
                <span className="tarifasModal-subtitulo">Estacionamiento x turno</span>
              </button>
              <button onClick={() => handleTipoSeleccionado('estadia')}>
                <strong>Estadía</strong>
                <span className="tarifasModal-subtitulo">Estacionamiento diario</span>
              </button>
              <button onClick={() => handleTipoSeleccionado('mensual')}>
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

      {selectedTipo && renderNuevoModal()}

      {renderTabla('hora', ['Etiqueta', 'Días', 'Horas', 'Minutos', 'Tolerancia (mins)', 'Acciones'], ['nombre', 'dias', 'horas', 'minutos', 'tolerancia'])}
      {renderTabla('turno', ['Etiqueta', 'Días', 'Horas', 'Minutos', 'Tolerancia (mins)', 'Acciones'], ['nombre', 'dias', 'horas', 'minutos', 'tolerancia'])}
      {renderTabla('estadia', ['Etiqueta', 'Días', 'Tolerancia (mins)', 'Acciones'], ['nombre', 'dias', 'tolerancia'])}
      {renderTabla('mensual', ['Etiqueta', 'Acciones'], ['nombre'])}
    </div>
  );
};

export default Tarifas;
