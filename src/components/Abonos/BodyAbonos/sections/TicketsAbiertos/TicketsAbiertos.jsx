import React, { useEffect, useState } from 'react';
import './TicketsAbiertos.css';
import { FaCalendarAlt, FaRegClock } from 'react-icons/fa';

const TicketsAbiertos = ({ viewMode }) => {
  const [abonos, setAbonos] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const fetchData = () => {
      fetch('https://api.garageia.com/api/abonos')
        .then((res) => res.json())
        .then((data) =>
          setAbonos(data.map((abono) => ({ ...abono, tipoTicket: 'abono' })))
        )
        .catch((err) => console.error('Error al obtener abonos:', err));

      fetch('https://api.garageia.com/api/turnos')
        .then((res) => res.json())
        .then((data) =>
          setTurnos(data.map((turno) => ({ ...turno, tipoTicket: 'turno' })))
        )
        .catch((err) => console.error('Error al obtener turnos:', err));
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
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

  const tickets = [...abonosActivos, ...turnosActivos];

  // Filtrado por búsqueda
  const ticketsFiltrados = tickets
    .filter((ticket) => {
      const query = busqueda.toLowerCase();

      const patente = ticket.patente?.toLowerCase() || '';
      const nombre = ticket.nombreCliente?.toLowerCase() || ticket.nombreApellido?.toLowerCase() || '';
      const tipoVehiculo = ticket.tipoVehiculo?.toLowerCase() || '';
      const tipoTicket = ticket.tipoTicket?.toLowerCase() || '';

      return (
        patente.includes(query) ||
        nombre.includes(query) ||
        tipoVehiculo.includes(query) ||
        tipoTicket.includes(query)
      );
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.fechaCreacion) -
        new Date(a.createdAt || a.fechaCreacion)
    );

  if (ticketsFiltrados.length === 0) {
    return (
      <div>
        {/* Buscador */}
        <div className="search-cliente-container">
          <div className="search-cliente-input-container">
            <div className="search-cliente-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
              </svg>
            </div>
            <input
              type="text"
              className="search-cliente-input"
              placeholder="Buscar por nombre o patente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>
        {/* Mensaje vacío */}
        <div className="mensaje-vacio">
          <p>No hay abonos ni turnos activos en este momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Buscador */}
      <div className="search-cliente-container">
        <div className="search-cliente-input-container">
          <div className="search-cliente-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
            </svg>
          </div>
          <input
            type="text"
            className="search-cliente-input"
            placeholder="Buscar por nombre o patente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {viewMode === 'list' ? (
        <table className="tickets-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Patente</th>
              <th>Cliente</th>
              <th>Vehículo</th>
              <th>Creación</th>
              <th>Expiración</th>
              <th>Importe</th>
            </tr>
          </thead>
          <tbody>
            {ticketsFiltrados.map((ticket) => (
              <tr key={ticket._id}>
                <td>{ticket.tipoTicket === 'abono' ? 'Abono' : 'Turno'}</td>
                <td>{ticket.patente}</td>
                <td>{ticket.nombreCliente || ticket.nombreApellido || 'N/A'}</td>
                <td>{capitalizar(ticket.tipoVehiculo)}</td>
                <td>{formatearFechaHora(ticket.createdAt || ticket.fechaCreacion)}</td>
                <td>{formatearFechaHora(ticket.fechaExpiracion || ticket.fin)}</td>
                <td>${ticket.precio.toLocaleString('es-AR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="tickets-container">
          {ticketsFiltrados.map((ticket) => (
            <div key={ticket._id} className="abono-card">
              <div
                className="abono-header-background"
                style={{
                  backgroundColor:
                    ticket.tipoTicket === 'abono'
                      ? 'rgba(168, 216, 255, 0.4)'
                      : 'rgba(168, 244, 215, 0.4)',
                }}
              >
                <div className="abono-tipo-tarifa">
                  {ticket.tipoTarifa === 'abono' ? (
                    <div className="abono-tarifa-info">
                      <FaCalendarAlt size={30} />
                      <p>Abono</p>
                    </div>
                  ) : (
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
                    <p className="fecha-info">{formatearFechaHora(ticket.fechaExpiracion || ticket.fin)}</p>
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
      )}
    </div>
  );
};

export default TicketsAbiertos;
