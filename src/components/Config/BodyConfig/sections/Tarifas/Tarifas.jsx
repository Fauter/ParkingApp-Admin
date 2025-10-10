import React, { useEffect, useState } from 'react';
import './Tarifas.css';

const NUMERIC_FIELDS = ['dias', 'horas', 'minutos', 'tolerancia'];
const isNumericCampo = (c) => NUMERIC_FIELDS.includes(c);
const sanitizeDigits = (v) => (v ?? '').toString().replace(/\D+/g, '');

// Bloquea teclas no numéricas en inputs "numéricos"
const handleNumericKeyDown = (e) => {
  const allow = ['Backspace','Delete','ArrowLeft','ArrowRight','Home','End','Tab'];
  if (allow.includes(e.key)) return;
  if (['e','E','+','-','.',',',' '].includes(e.key)) { e.preventDefault(); return; }
  if (!/^\d$/.test(e.key)) { e.preventDefault(); }
};

// Evita inserciones no numéricas a nivel beforeinput
const handleNumericBeforeInput = (e) => {
  if (e.data && /\D/.test(e.data)) e.preventDefault();
};

// Sanitiza el pegado
const handleNumericPaste = (e, onSanitizedValue) => {
  const text = (e.clipboardData || window.clipboardData).getData('text');
  const clean = sanitizeDigits(text);
  if (clean !== text) e.preventDefault();
  if (clean !== text && typeof onSanitizedValue === 'function') onSanitizedValue(clean);
};

const prettyTipo = (tipo) => {
  if (typeof tipo !== 'string') return '';
  if (tipo === 'turno') return 'Anticipado';
  return tipo.charAt(0).toUpperCase() + tipo.slice(1);
};

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
    fetch('https://apiprueba.garageia.com/api/tarifas')
      .then(res => res.json())
      .then(data => setTarifas(data))
      .catch(err => console.error('Error cargando tarifas:', err));

    // Cargar los parámetros por defecto
    fetch('https://apiprueba.garageia.com/api/parametros')
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
    if (!cargandoParametros) {
      guardarParametros();
    }
  }, [parametros, cargandoParametros]);

  const tarifasPorTipo = {
    hora: tarifas.filter(t => t.tipo === 'hora'),
    turno: tarifas.filter(t => t.tipo === 'turno'),
    abono: tarifas.filter(t => t.tipo === 'abono'),
    // estadia: tarifas.filter(t => t.tipo === 'estadia'),
  };

  const handleTipoSeleccionado = (tipo) => {
    setSelectedTipo(tipo);
    setNuevoInput({});
  };

  const crearTarifaFinal = async () => {
    const defaults = {
      hora: { nombre: 'Hora', tipo: 'hora' },
      turno: { nombre: 'Anticipado', tipo: 'turno' }, // <-- corregido
      abono: { nombre: 'Abono', tipo: 'abono' },
      // estadia: { nombre: 'Día', tipo: 'estadia' },
    };

    // Aseguramos que los numéricos vayan como enteros
    const payload = { ...nuevoInput };
    NUMERIC_FIELDS.forEach(f => {
      if (payload[f] !== undefined) payload[f] = parseInt(payload[f], 10) || 0;
    });

    const data = { ...defaults[selectedTipo], ...payload };

    try {
      const res = await fetch('https://apiprueba.garageia.com/api/tarifas', {
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
      await fetch(`https://apiprueba.garageia.com/api/tarifas/${id}`, {
        method: 'DELETE',
      });
      setTarifas(prev => prev.filter(t => t._id !== id));
    } catch (err) {
      console.error('Error eliminando tarifa:', err);
    }
  };

  const guardarParametros = () => {
    fetch('https://apiprueba.garageia.com/api/parametros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parametros),
    })
      .then(res => res.json())
      .catch(err => console.error('Error guardando parámetros:', err));
  };

  const activarEdicion = (id, campo, valorActual) => {
    const numeric = isNumericCampo(campo);

    let initial = valorActual;
    // Si es numérico y viene 0 / null / '' => dejar el input vacío al editar
    if (numeric && (initial === 0 || initial === null || initial === undefined || initial === '0' || initial === '')) {
      initial = '';
    } else if (initial !== null && initial !== undefined) {
      initial = String(initial);
    } else {
      initial = '';
    }

    setEditandoCampo({ id, campo });
    setValorTemporal(initial);
  };

  const manejarCambio = (e) => {
    setValorTemporal(e.target.value);
  };

  const manejarTecla = async (e, tarifa) => {
    if (e.key === 'Enter') {
      const campo = editandoCampo.campo;
      const actualizado = {
        ...tarifa,
        [campo]: campo === 'nombre'
          ? valorTemporal
          : (parseInt(valorTemporal, 10) || 0)
      };

      try {
        const res = await fetch(`https://apiprueba.garageia.com/api/tarifas/${tarifa._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(actualizado),
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

  // ---- INPUT DEL MODAL (con validación numérica estricta en campos requeridos)
  const renderInputField = (label, field) => {
    const numeric = isNumericCampo(field);

    const value = nuevoInput[field] ?? (numeric ? '' : '');
    const setSanitized = (raw) => {
      const v = numeric ? sanitizeDigits(raw) : raw;
      setNuevoInput(prev => ({
        ...prev,
        [field]: v
      }));
    };

    return (
      <div className="input-group">
        <label>{label}</label>
        <input
          type="text"
          inputMode={numeric ? 'numeric' : 'text'}
          pattern={numeric ? '[0-9]*' : undefined}
          value={value}
          onChange={(e) => setSanitized(e.target.value)}
          onKeyDown={numeric ? handleNumericKeyDown : undefined}
          onBeforeInput={numeric ? handleNumericBeforeInput : undefined}
          onPaste={numeric ? (e) => handleNumericPaste(e, (clean) => setSanitized(clean)) : undefined}
        />
      </div>
    );
  };

  // ---- CELDA DE TABLA (extiendo defensa cuando edites números en línea)
  const renderCelda = (tarifa, campo) => {
    const valor = tarifa[campo] ?? '';
    const esEditando = editandoCampo.id === tarifa._id && editandoCampo.campo === campo;
    const esPrimeraColumna = campo === 'nombre';
    const numeric = isNumericCampo(campo);

    return (
      <td
        onClick={() => activarEdicion(tarifa._id, campo, valor)}
        style={{ cursor: 'pointer' }}
        className={`${esEditando ? 'editando-td' : ''} ${esPrimeraColumna ? 'primera-columna' : ''}`}
      >
        {esEditando ? (
          <input
            type="text"
            inputMode={numeric ? 'numeric' : 'text'}
            pattern={numeric ? '[0-9]*' : undefined}
            value={valorTemporal}
            onChange={(e) => {
              const v = numeric ? sanitizeDigits(e.target.value) : e.target.value;
              setValorTemporal(v);
            }}
            onKeyDown={(e) => {
              if (numeric) handleNumericKeyDown(e);
              manejarTecla(e, tarifa);
            }}
            onBeforeInput={numeric ? handleNumericBeforeInput : undefined}
            onPaste={numeric ? (e) => handleNumericPaste(e, (clean) => setValorTemporal(clean)) : undefined}
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
        <h2>{`Tipo ${prettyTipo(tipo)}`}</h2>
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
                value={parametros.toleranciaInicial ?? ""}
                onChange={(e) => setParametros(prev => ({ ...prev, toleranciaInicial: Number(e.target.value || 0) }))}
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
      </div>
    );
  };

  const renderNuevoModal = () => {
    const campos = {
      hora: ['nombre', 'dias', 'horas', 'minutos', 'tolerancia'],
      turno: ['nombre', 'dias', 'horas', 'minutos', 'tolerancia'],
      abono: ['nombre', 'dias'],
      // estadia: ['nombre', 'dias', 'tolerancia'],
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
                <strong>Anticipado</strong>
                <span className="tarifasModal-subtitulo">Estacionamiento x turno</span>
              </button>
              {/* <button onClick={() => handleTipoSeleccionado('estadia')}>
                <strong>Estadía</strong>
                <span className="tarifasModal-subtitulo">Estacionamiento diario</span>
              </button> */}
              {/* <button onClick={() => handleTipoSeleccionado('abono')}>
                <strong>Abono</strong>
                <span className="tarifasModal-subtitulo">Estacionamiento abono</span>
              </button> */}
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
      {/* {renderTabla('abono', ['Etiqueta', 'Días', 'Acciones'], ['nombre', 'dias'])} */}
    </div>
  );
};

export default Tarifas;
