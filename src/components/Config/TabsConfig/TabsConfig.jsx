import React, { useState, useEffect } from 'react';
import './TabsConfig.css';

const TabsConfig = ({ activeTab, onTabChange }) => {
  const tabs = ['Tipos de Vehículo', 'Tarifas', 'Precios', 'Usuarios'];
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState({
    tipoTarifa: 'hora',
    tipoVehiculo: 'auto',
    inicio: '',
    dias: '',
    hora: '00:00'
  });
  const [detalle, setDetalle] = useState('');
  const [tarifas, setTarifas] = useState([]);
  const [precios, setPrecios] = useState({});
  const [tiposVehiculo, setTiposVehiculo] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/tarifas')
      .then(res => res.json())
      .then(data => {
        const tarifasFiltradas = data.filter(t => t.tipo !== 'mensual' && t.tipo !== 'turno');
        setTarifas(tarifasFiltradas);
      });

    fetch('http://localhost:5000/api/precios')
      .then(res => res.json())
      .then(data => setPrecios(data));

    fetch('http://localhost:5000/api/tipos-vehiculo')
      .then(res => res.json())
      .then(data => setTiposVehiculo(data));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const obtenerDetalleCliente = () => {
    const { tipoVehiculo, inicio, dias, hora } = form;
    if (!tipoVehiculo || !hora || !inicio) return 'Complete todos los campos.';
  
    const entrada = new Date(inicio);
    if (isNaN(entrada)) return 'Fecha de inicio inválida';
  
    const tiempoTotal = new Date(inicio);
    tiempoTotal.setDate(tiempoTotal.getDate() + Number(dias || 0));
  
    const [h, m] = hora.split(':').map(Number);
    tiempoTotal.setHours(tiempoTotal.getHours() + h);
    tiempoTotal.setMinutes(tiempoTotal.getMinutes() + m);
  
    const msTotal = tiempoTotal - entrada;
    const minutosTotales = Math.ceil(msTotal / 1000 / 60);
    if (minutosTotales <= 0) return 'Duración inválida';
  
    // Ordenar tarifas por duración total (minutos) ASCENDENTE
    const tarifasOrdenadas = tarifas
      .map(t => {
        const totalMin = t.dias * 1440 + t.horas * 60 + t.minutos;
        return { ...t, totalMin };
      })
      .sort((a, b) => a.totalMin - b.totalMin);
  
    let tiempoRestante = minutosTotales;
    const tipoVehiculoKey = tipoVehiculo.toLowerCase();
    let resumen = '';
    let costoTotal = 0;
    const tarifasUsadas = {};
  
    for (let i = tarifasOrdenadas.length - 1; i >= 0; i--) {
      const tarifa = tarifasOrdenadas[i];
      const { totalMin, tolerancia } = tarifa;
      const nombre = tarifa.nombre.toLowerCase();
      const precio = precios[tipoVehiculoKey]?.[nombre] ?? 0;
  
      // Verificar si el tiempo restante supera el tiempo total de la tarifa + tolerancia
      while (
        tiempoRestante >= totalMin + tolerancia ||
        (tiempoRestante >= totalMin && tolerancia === 0)
      ) {
        if (!tarifasUsadas[nombre]) {
          tarifasUsadas[nombre] = { cantidad: 0, precio };
        }
        tarifasUsadas[nombre].cantidad += 1;
        costoTotal += precio;
        tiempoRestante -= totalMin;
      }
  
      // Agregar al siguiente ciclo la tolerancia
      if (tiempoRestante >= totalMin) {
        const diferencia = tiempoRestante - totalMin;
        // Si la diferencia es menor o igual a la tolerancia, no cobramos la tarifa adicional
        if (diferencia <= tolerancia) {
          // No cobrar tarifa adicional, pero reducir el tiempo restante
          tiempoRestante = 0;
        } else {
          // Si la diferencia supera la tolerancia, cobrar la tarifa adicional
          if (!tarifasUsadas[nombre]) {
            tarifasUsadas[nombre] = { cantidad: 0, precio };
          }
          tarifasUsadas[nombre].cantidad += 1;
          costoTotal += precio;
          tiempoRestante -= totalMin;
        }
      }
    }
  
    // Intentar cobrar lo que quede con la menor tarifa disponible
    if (tiempoRestante > 0) {
      const tarifaMin = tarifasOrdenadas[0];
      const nombre = tarifaMin.nombre.toLowerCase();
      const precio = precios[tipoVehiculoKey]?.[nombre] ?? 0;
  
      const cantidad = Math.ceil((tiempoRestante - tarifaMin.tolerancia) / tarifaMin.totalMin);
      if (cantidad > 0) {
        if (!tarifasUsadas[nombre]) {
          tarifasUsadas[nombre] = { cantidad: 0, precio };
        }
        tarifasUsadas[nombre].cantidad += cantidad;
        costoTotal += precio * cantidad;
      }
    }
  
    // Generar el resumen de tarifas usadas
    for (let nombre in tarifasUsadas) {
      const { cantidad, precio } = tarifasUsadas[nombre];
      resumen += `${cantidad} x ${nombre.charAt(0).toUpperCase() + nombre.slice(1)} = $${precio * cantidad}\n`;
    }
  
    return resumen.trim() + `\n\nTotal: $${costoTotal}`;
  };  

  useEffect(() => {
    if (modalAbierto) {
      const ahora = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const fechaLocal = `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}T${pad(ahora.getHours())}:${pad(ahora.getMinutes())}`;

      setForm(prev => ({
        ...prev,
        inicio: fechaLocal,
        hora: '00:00'
      }));

      setDetalle(obtenerDetalleCliente());
    }
  }, [modalAbierto]);

  useEffect(() => {
    if (modalAbierto) {
      setDetalle(obtenerDetalleCliente());
    }
  }, [form, tarifas, precios]);

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
                <input type="datetime-local" name="inicio" value={form.inicio} onChange={handleChange} />
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
