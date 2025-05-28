import React, { useEffect, useState } from 'react';
import './TicketsAbiertos.css';
import { FaCalendarAlt, FaRegClock } from 'react-icons/fa';

const TicketsAbiertos = () => {
  const [abonos, setAbonos] = useState([]);
  const [turnos, setTurnos] = useState([]);

  useEffect(() => {
    // Fetch para obtener los abonos
    const fetchData = () => {
      fetch('https://api.garageia.com/api/abonos')
        .then((res) => res.json())
        .then((data) => setAbonos(data))
        .catch((err) => console.error('Error al obtener abonos:', err));

      // Fetch para obtener los turnos
      fetch('https://api.garageia.com/api/turnos')
        .then((res) => res.json())
        .then((data) => setTurnos(data))
        .catch((err) => console.error('Error al obtener turnos:', err));
    };

    fetchData(); // Llamamos inmediatamente al principio

    const interval = setInterval(fetchData, 5000); // Llamar cada 5 segundos

    return () => clearInterval(interval); // Limpiar el intervalo cuando el componente se desmonte
  }, []);

  const capitalizar = (texto) => {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  };

  const formatearFechaHora = (fechaStr) => {
    const fecha = new Date(fechaStr);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    return `${dia}/${mes} - ${horas}:${minutos}hs`;
  };

  const abonosActivos = abonos.filter((abono) => new Date(abono.fechaExpiracion) > new Date());
  const turnosActivos = turnos.filter((turno) => !turno.usado && !turno.expirado);

  // Unimos los abonos y turnos en un solo array
  const tickets = [...abonosActivos, ...turnosActivos];

  // Ordenamos los tickets por fecha de creación (de más reciente a más antiguo)
  tickets.sort((a, b) => new Date(b.createdAt || b.fechaCreacion) - new Date(a.createdAt || a.fechaCreacion));

  return (
    <div className="tickets-container">
      {tickets.map((ticket) => (
        <div key={ticket._id} className="abono-card">
          <div className="abono-header-background" style={{ backgroundColor: ticket.tipoTarifa === 'abono' ? 'rgba(168, 216, 255, 0.4)' : 'rgba(168, 244, 215, 0.4)' }}>
            <div className="abono-tipo-tarifa">
              {ticket.tipoTarifa ? (
                // Si es Abono
                ticket.tipoTarifa === 'abono' ? (
                  <div className="abono-tarifa-info">
                    <FaCalendarAlt size={30} />
                    <p>Abono</p>
                  </div>
                ) : (
                  // Si es Turno
                  <div className="abono-tarifa-info">
                    <FaRegClock size={25} />
                    <p>Turno</p>
                  </div>
                )
              ) : (
                // Si no tiene tipoTarifa, es un turno
                <div className="abono-tarifa-info">
                  <FaRegClock size={25} />
                  <p>Turno</p>
                </div>
              )}
            </div>

            <div className="abono-header">
              <h2 className="abono-patente">{ticket.patente}</h2>
              <p className="abono-vehiculo">{capitalizar(ticket.tipoVehiculo)}</p>
            </div>
          </div>

          <div className="abono-body">
            <div className="abono-fechas">
              <div className="fecha-item">
                <p className="fecha-titulo">Creación:</p>
                <p className="fecha-info">{formatearFechaHora(ticket.createdAt || ticket.fechaCreacion)}</p>
              </div>
              <div className="fecha-item">
                <p className="fecha-titulo">Expiración:</p>
                <p className="fecha-info">
                  {formatearFechaHora(ticket.fechaExpiracion || ticket.fin)}
                </p>
              </div>
            </div>
            <div className="abono-precio">
              <p className="importe-titulo">Importe Actual</p>
              <p className="importe-monto">${ticket.precio.toLocaleString('es-AR')}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TicketsAbiertos;
