import React, { useState, useEffect } from 'react';
import './TabsConfig.css';

const TabsConfig = ({ activeTab, onTabChange }) => {
  const tabs = ['Tipos de Vehículo', 'Tarifas', 'Precios', 'Usuarios'];
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState({
    tipoTarifa: 'hora',    // puede ser 'hora', 'turno' o 'abono'
    tipoVehiculo: 'auto',
    inicio: '',
    dias: '',
    hora: '00:00',
    tarifaAbono: ''        // NUEVO: tarifa seleccionada cuando tipoTarifa === 'abono'
  });

  const [detalle, setDetalle] = useState('');
  const [tarifas, setTarifas] = useState([]);
  const [precios, setPrecios] = useState({});
  const [tiposVehiculo, setTiposVehiculo] = useState([]);
  const [parametros, setParametros] = useState({
    fraccionarDesde: 0,
    toleranciaInicial: 0,
    permitirCobroAnticipado: false
  });

  // Fetch iniciales de precios, tiposVehiculo y parámetros
  useEffect(() => {
    fetch('http://localhost:5000/api/precios')
      .then(res => res.json())
      .then(data => setPrecios(data));

    fetch('http://localhost:5000/api/tipos-vehiculo')
      .then(res => res.json())
      .then(data => setTiposVehiculo(data));

    fetch('http://localhost:5000/api/parametros')
      .then(res => res.json())
      .then(data => setParametros(data))
      .catch(error => console.error('Error al obtener parámetros:', error));
  }, []);

  // Cuando cambia el tipo de tarifa, actualizamos la lista de tarifas para 'abono'
  useEffect(() => {
    if (!form.tipoTarifa) return;
    fetch('http://localhost:5000/api/tarifas')
      .then(res => res.json())
      .then(data => {
        const tipo = form.tipoTarifa.toLowerCase(); // 'hora', 'abono', 'turno'
        const tarifasFiltradas = data.filter(t => t.tipo === tipo);
        setTarifas(tarifasFiltradas);

        // Si el tipoTarifa es 'abono' seteamos tarifaAbono al primero disponible
        if (tipo === 'abono' && tarifasFiltradas.length > 0) {
          setForm(prev => ({
            ...prev,
            tarifaAbono: tarifasFiltradas[0].id || tarifasFiltradas[0].nombre || ''
          }));
        } else {
          setForm(prev => ({
            ...prev,
            tarifaAbono: ''
          }));
        }
      });
  }, [form.tipoTarifa]);

  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (modalAbierto) {
      setForm(prevForm => ({
        ...prevForm,
        inicio: getCurrentDateTimeLocal()
      }));
    }
  }, [modalAbierto]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const actualizarDetalle = async () => {
    const { tipoVehiculo, inicio, dias, hora, tarifaAbono, tipoTarifa } = form;
    try {
      const res = await fetch('http://localhost:5000/api/calcular-tarifa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          detalle: {
            tipoVehiculo,
            inicio,
            dias: Number(dias || 0),
            hora,
            tarifaAbono,   // nuevo, solo para abonos
            tipoTarifa
          },
          tarifas,
          precios,
          parametros
        })
      });

      const data = await res.json();

      if (res.ok) {
        if (data.detalle && data.detalle.trim() !== '') {
          setDetalle(data.detalle);
        } else {
          setDetalle('');
        }
      } else {
        setDetalle(data.error || 'Error al calcular tarifa.');
      }
    } catch (err) {
      console.error('Error en fetch:', err);
      setDetalle('Error de conexión con el servidor.');
    }
  };

  useEffect(() => {
    if (modalAbierto) {
      actualizarDetalle();
    }
  }, [modalAbierto, form, tarifas, precios, parametros]);

  return (
    <div className="configTab-container">
      <div className="configTab-header">
        <div className="configTab-links">
          {tabs.map((tab) => (
            <a
              key={tab}
              className={`configTab-link ${activeTab === tab ? 'active' : ''}`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onTabChange(tab);
              }}
            >
              <p className="configTab-text">{tab}</p>
            </a>
          ))}
        </div>
        <button className="simulador-btn" onClick={() => setModalAbierto(true)}>⚙️</button>
      </div>

      {modalAbierto && (
        <div className="modal-overlay" onClick={() => setModalAbierto(false)}>
          <div className="modal modal-simulador" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Simulador de Tarifas</h3>
              <button className="modal-close" onClick={() => setModalAbierto(false)}>✖</button>
            </div>
            <div className="modal-body modal-simulador-body">
              <div className="modal-simulador-field">
                <label>Tipo de Tarifa</label>
                <select name="tipoTarifa" value={form.tipoTarifa} onChange={handleChange}>
                  <option value="hora">x Hora</option>
                  <option value="turno">x Turno</option>
                  <option value="abono">x Abono</option>
                </select>
              </div>

              <div className="modal-simulador-field">
                <label>Tipo de Vehículo</label>
                <select name="tipoVehiculo" value={form.tipoVehiculo} onChange={handleChange}>
                  {tiposVehiculo.map((tv) => (
                    <option key={tv.toLowerCase()} value={tv.toLowerCase()}>
                      {tv.charAt(0).toUpperCase() + tv.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Días siempre presente */}
              <div className="modal-simulador-field">
                <label>Días</label>
                <input type="number" name="dias" value={form.dias} onChange={handleChange} />
              </div>

              {/* Permanencia SIEMPRE visible */}
              <div className="modal-simulador-field">
                <label>Permanencia</label>
                <input type="time" name="hora" value={form.hora} onChange={handleChange} />
              </div>

              {/* Si es 'abono' mostramos selector 'Tarifa' con tarifas filtradas */}
              {form.tipoTarifa === 'abono' && (
                <div className="modal-simulador-field">
                  <label>Tarifa</label>
                  <select name="tarifaAbono" value={form.tarifaAbono} onChange={handleChange}>
                    {tarifas.map((t) => (
                      <option key={t.id || t.nombre} value={t.id || t.nombre}>
                        {t.nombre || `Tarifa ${t.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="modal-simulador-detalle">
                <strong>Detalle para el Cliente:</strong>
                <pre>{detalle}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabsConfig;
