import React, { useEffect, useState } from 'react';
import './TabsAbonos.css';

const TurnoForm = ({ onClose }) => {
  const [patente, setPatente] = useState('');
  const [turnos, setTurnos] = useState([]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [factura, setFactura] = useState('No');
  const [precio, setPrecio] = useState(0);

  useEffect(() => {
    fetch('https://api.garageia.com/api/tarifas/')
      .then(res => res.json())
      .then(data => {
        const turnosFiltrados = data.filter(t => t.tipo === 'turno');
        setTurnos(turnosFiltrados);
      })
      .catch(err => console.error('Error al cargar los turnos:', err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!patente || !turnoSeleccionado) {
      alert('Completá la patente y seleccioná un turno.');
      return;
    }

    const turnoData = turnos.find(t => t._id === turnoSeleccionado);
    if (!turnoData) {
      alert('Error interno: turno no encontrado.');
      return;
    }

    // Obtener tipoVehiculo desde API vehiculos
    let tipoVehiculo;
    try {
      const resVehiculo = await fetch(`https://api.garageia.com/api/vehiculos/${patente}`);
      if (!resVehiculo.ok) {
        alert('Vehículo no encontrado');
        return;
      }
      const dataVehiculo = await resVehiculo.json();
      tipoVehiculo = dataVehiculo.tipoVehiculo;
      if (!tipoVehiculo) {
        alert('Tipo de vehículo no definido');
        return;
      }
    } catch (err) {
      alert('Error al obtener datos del vehículo.');
      return;
    }

    // Calcular duración en horas y fechaFin
    const duracionHoras = (turnoData.dias || 0) * 24 + (turnoData.horas || 0) + ((turnoData.minutos || 0) / 60);
    const ahora = new Date();
    const fechaFin = new Date(ahora);
    fechaFin.setMinutes(fechaFin.getMinutes() + ((turnoData.dias || 0) * 1440) + ((turnoData.horas || 0) * 60) + (turnoData.minutos || 0));

    // Obtener precios para verificar
    try {
      const resPrecio = await fetch('https://api.garageia.com/api/precios/');
      const precios = await resPrecio.json();

      const nombreTarifa = turnoData.nombre.toLowerCase().trim();
      const precioVehiculo = precios[tipoVehiculo]?.[nombreTarifa];
      if (precioVehiculo === undefined) {
        alert(`No se encontró un precio para "${turnoData.nombre}" y vehículo tipo "${tipoVehiculo}"`);
        return;
      }
      setPrecio(precioVehiculo);

      // Preparar payload para backend
      const payload = {
        patente,
        turnoId: turnoSeleccionado,
        metodoPago,
        factura,
        precio: precioVehiculo,
        duracionHoras,
        fechaFin,
        nombreTarifa: turnoData.nombre
      };

      const res = await fetch('https://api.garageia.com/api/turnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        alert('Turno registrado correctamente');
        setPatente('');
        setTurnoSeleccionado('');
        setMetodoPago('Efectivo');
        setFactura('No');
        onClose();
      } else {
        alert('Error del servidor: ' + (data.error || JSON.stringify(data)));
      }
    } catch (err) {
      alert('Error al consultar precios o registrar turno.');
      console.error(err);
    }
  };

  return (
    <form className="turno-form" onSubmit={handleSubmit}>
      <div className="form-section">
        <input
          type="text"
          placeholder="Patente"
          value={patente}
          onChange={(e) => setPatente(e.target.value.toUpperCase().replace(/\s/g, ''))}
          required
          name="patente"
        />
      </div>

      <div className="form-section">
        <select
          value={turnoSeleccionado}
          onChange={(e) => setTurnoSeleccionado(e.target.value)}
          required
          name="turno"
        >
          <option value="" disabled hidden>
            Seleccionar Turno
          </option>
          {turnos.map((t) => (
            <option key={t._id} value={t._id}>
              {t.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="form-section">
        <select
          value={metodoPago}
          onChange={(e) => setMetodoPago(e.target.value)}
          required
          name="metodoPago"
        >
          <option value="Efectivo">Efectivo</option>
          <option value="Débito">Débito</option>
          <option value="Crédito">Crédito</option>
          <option value="QR">QR</option>
        </select>
      </div>

      <div className="form-section">
        <select
          value={factura}
          onChange={(e) => setFactura(e.target.value)}
          required
          name="factura"
        >
          <option value="No">No</option>
          <option value="A">A</option>
          <option value="Final">Consumidor Final</option>
        </select>
      </div>

      <div className="form-actions">
        <button type="submit">Guardar Turno</button>
        <button type="button" onClick={onClose}>Cancelar</button>
      </div>
    </form>
  );
};

export default TurnoForm;
