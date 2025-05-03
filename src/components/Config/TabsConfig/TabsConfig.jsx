import React, { useState, useEffect } from 'react';
import './TabsConfig.css';

const TabsConfig = ({ activeTab, onTabChange, fraccionarDesde }) => {
  const tabs = ['Tipos de Vehículo', 'Tarifas', 'Precios', 'Usuarios'];
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState({
    tipoTarifa: 'hora',
    tipoVehiculo: 'auto',
    inicio: '',  // Este valor se va a actualizar a la fecha actual
    dias: '',
    hora: '00:00'
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

  useEffect(() => {
    fetch('https://parkingapp-back.onrender.com/api/tarifas')
    .then(res => res.json())
    .then(data => {
      const tarifasFiltradas = data.filter(t => t.tipo === 'hora');
      setTarifas(tarifasFiltradas);
    });

    fetch('https://parkingapp-back.onrender.com/api/precios')
      .then(res => res.json())
      .then(data => setPrecios(data));

    fetch('https://parkingapp-back.onrender.com/api/tipos-vehiculo')
      .then(res => res.json())
      .then(data => setTiposVehiculo(data));

    fetch('https://parkingapp-back.onrender.com/api/parametros')
      .then(res => res.json())
      .then(data => setParametros(data))
      .catch(error => console.error('Error al obtener parámetros:', error));
  }, []);

  // Función para obtener la fecha y hora local actual en el formato correcto
  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
  };

  // Actualizar la fecha y hora actual cuando el modal se abre
  useEffect(() => {
    if (modalAbierto) {
      setForm((prevForm) => ({
        ...prevForm,
        inicio: getCurrentDateTimeLocal()  // Establece la fecha y hora actual al abrir el modal
      }));
    }
  }, [modalAbierto]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value
    });
  };

  const actualizarDetalle = async () => {
    const { tipoVehiculo, inicio, dias, hora } = form;
    
    try {
      const res = await fetch('https://parkingapp-back.onrender.com/api/calcular-tarifa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          detalle: {
            tipoVehiculo,
            inicio,
            dias: Number(dias || 0),
            hora
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
                  <option value="estadia">x Estadía</option>
                  <option value="turno">x Turno</option>
                  <option value="mensual">x Mensual</option>
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

              <div className="modal-simulador-field">
                <label>Inicio</label>
                <input 
                  type="datetime-local" 
                  name="inicio" 
                  value={form.inicio} 
                  onChange={handleChange} 
                  placeholder={form.inicio}  // Usamos form.inicio como placeholder
                />
              </div>

              <div className="modal-simulador-field">
                <label>Días</label>
                <input type="number" name="dias" value={form.dias} onChange={handleChange} />
              </div>

              <div className="modal-simulador-field">
                <label>Permanencia</label>
                <input type="time" name="hora" value={form.hora} onChange={handleChange} />
              </div>

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
