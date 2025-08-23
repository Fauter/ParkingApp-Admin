import React, { useEffect, useState } from 'react';
import './TabsAbonos.css';

const TurnoForm = ({ onClose, user }) => {
  const [patente, setPatente] = useState('');
  const [turnos, setTurnos] = useState([]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [factura, setFactura] = useState('CC');
  const [precio, setPrecio] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('https://api.garageia.com/api/tarifas/')
      .then(res => res.json())
      .then(data => {
        const turnosFiltrados = data.filter(t => t.tipo === 'turno');
        setTurnos(turnosFiltrados);
      })
      .catch(err => {
        console.error('Error al cargar los turnos:', err);
        setError('Error al cargar los turnos disponibles');
      });
  }, []);

  const handlePatenteChange = (e) => {
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length > 8) val = val.slice(0, 8);
    setPatente(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!patente || !turnoSeleccionado) {
      setError('Completá la patente y seleccioná un turno.');
      return;
    }

    const turnoData = turnos.find(t => t._id === turnoSeleccionado);
    if (!turnoData) {
      setError('Error interno: turno no encontrado.');
      return;
    }

    try {
      // Obtener tipoVehiculo
      const resVehiculo = await fetch(`https://api.garageia.com/api/vehiculos/${patente}`);
      if (!resVehiculo.ok) {
        setError('Vehículo no encontrado');
        return;
      }
      const dataVehiculo = await resVehiculo.json();
      const tipoVehiculo = dataVehiculo.tipoVehiculo;
      if (!tipoVehiculo) {
        setError('Tipo de vehículo no definido');
        return;
      }

      // Calcular duración y fecha fin
      const duracionHoras = (turnoData.dias || 0) * 24 + (turnoData.horas || 0) + ((turnoData.minutos || 0) / 60);
      const ahora = new Date();
      const fin = new Date(ahora);
      fin.setMinutes(fin.getMinutes() + ((turnoData.dias || 0) * 1440) + ((turnoData.horas || 0) * 60) + (turnoData.minutos || 0));

      // Obtener precio
      const resPrecio = await fetch('https://api.garageia.com/api/precios/');
      const precios = await resPrecio.json();
      const nombreTarifa = turnoData.nombre.toLowerCase().trim();
      const precioVehiculo = precios[tipoVehiculo]?.[nombreTarifa];
      
      if (precioVehiculo === undefined) {
        setError(`No se encontró precio para "${turnoData.nombre}" y vehículo tipo "${tipoVehiculo}"`);
        return;
      }
      setPrecio(precioVehiculo);

      // Registrar turno
      const payloadTurno = {
        patente,
        turnoId: turnoSeleccionado,
        metodoPago,
        factura,
        precio: precioVehiculo,
        duracionHoras,
        fin,
        nombreTarifa: turnoData.nombre
      };

      const resTurno = await fetch('https://api.garageia.com/api/turnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadTurno),
      });

      if (!resTurno.ok) {
        const errorData = await resTurno.json();
        setError(errorData.error || 'Error al registrar turno');
        return;
      }

      // Registrar movimiento
      const payloadMovimiento = {
        patente,
        operador: user.nombre,
        tipoVehiculo,
        metodoPago,
        factura: factura || 'Sin factura',
        monto: precioVehiculo,
        descripcion: `Pago por Turno: ${turnoData.nombre}`,
        tipoTarifa: 'turno'  // Cambiado de 'abono' a 'turno'
      };

      const movimientoRes = await fetch('https://api.garageia.com/api/movimientos/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadMovimiento),
      });

      if (!movimientoRes.ok) {
        const errorData = await movimientoRes.json();
        setError('Turno registrado pero error al registrar movimiento: ' + (errorData.error || ''));
        return;
      }

      // Éxito
      setPatente('');
      setTurnoSeleccionado('');
      setMetodoPago('Efectivo');
      setFactura('CC');
      onClose();

    } catch (err) {
      console.error('Error:', err);
      setError('Error al procesar la solicitud');
    }
  };

  return (
    <form className="turno-form" onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-section">
        <input
          type="text"
          placeholder="Patente"
          value={patente}
          onChange={handlePatenteChange}
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
          <option value="CC">CC</option>
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