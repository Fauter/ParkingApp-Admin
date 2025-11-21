import React, { useEffect, useState } from 'react';
import './TicketsAbiertos.css';
import { FaCalendarAlt, FaRegClock } from 'react-icons/fa';

const TicketsAbiertos = ({ viewMode }) => {
  const [vehiculos, setVehiculos] = useState([]);
  const [abonos, setAbonos] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  // NUEVOS ESTADOS
  const [tiposVehiculo, setTiposVehiculo] = useState([]);
  const [filtroTipoVehiculo, setFiltroTipoVehiculo] = useState('');
  const [filtroTipoTarifa, setFiltroTipoTarifa] = useState('');

  useEffect(() => {
    const fetchData = () => {
      // Vehículos abonados
      fetch('https://apiprueba.garageia.com/api/vehiculos')
        .then((res) => res.json())
        .then((data) => {
          const vehiculosAbonados = data
            .filter((v) => v.abonado === true)
            .map((v) => ({ ...v, tipoTicket: 'vehiculo' }));
          setVehiculos(vehiculosAbonados);
        })
        .catch((err) => console.error('Error al obtener vehículos:', err));

      // Abonos
      fetch('https://apiprueba.garageia.com/api/abonos')
        .then((res) => res.json())
        .then((data) =>
          setAbonos(data.map((abono) => ({ ...abono, tipoTicket: 'abono' })))
        )
        .catch((err) => console.error('Error al obtener abonos:', err));

      // Turnos
      fetch('https://apiprueba.garageia.com/api/turnos')
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

  // Cargar Tipos Vehículo
  useEffect(() => {
    fetch("https://apiprueba.garageia.com/api/tipos-vehiculo")
      .then(res => res.json())
      .then(data => setTiposVehiculo(data))
      .catch(err => console.error("Error al obtener tipos vehiculo:", err));
  }, []);

  const capitalizar = (texto) => {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  };

  const formatearFechaHora = (fechaStr) => {
    if (!fechaStr) return '-';
    const fecha = new Date(fechaStr);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    return `${dia}/${mes} - ${horas}:${minutos}hs`;
  };

  // Unir vehículos y abonos
  const vehiculosConAbono = vehiculos.map((vehiculo) => {
    const abonoRelacionado = abonos.find(
      (a) => a.patente?.toLowerCase() === vehiculo.patente?.toLowerCase()
    );

    return {
      ...vehiculo,
      tipoTicket: 'abono',
      nombreApellido: abonoRelacionado?.nombreApellido || 'N/A',
      fechaCreacion: abonoRelacionado?.fechaCreacion || vehiculo.createdAt,
      fechaExpiracion: abonoRelacionado?.fechaExpiracion || null,
      precio: abonoRelacionado?.precio || 0,
      metodoPago: abonoRelacionado?.metodoPago || '',
      tipoTarifa: abonoRelacionado?.tipoTarifa || 'abono',
    };
  });

  const turnosActivos = turnos.filter((t) => !t.usado && !t.expirado);

  const tickets = [...vehiculosConAbono, ...turnosActivos];

  // =============================
  // 🔍 FILTRADO FINAL
  // =============================

  const ticketsFiltrados = tickets
    .filter((ticket) => {
      const query = busqueda.toLowerCase();

      const patente = ticket.patente?.toLowerCase() || '';
      const nombre =
        ticket.nombreCliente?.toLowerCase() ||
        ticket.nombreApellido?.toLowerCase() ||
        '';
      const tipoVehiculo = ticket.tipoVehiculo?.toLowerCase() || '';
      const tipoTicket = ticket.tipoTicket?.toLowerCase() || '';

      const pasaBusqueda =
        patente.includes(query) ||
        nombre.includes(query) ||
        tipoVehiculo.includes(query) ||
        tipoTicket.includes(query);

      const pasaVehiculo =
        !filtroTipoVehiculo ||
        ticket.tipoVehiculo?.toLowerCase() === filtroTipoVehiculo.toLowerCase();

      const pasaTarifa =
        !filtroTipoTarifa ||
        (filtroTipoTarifa === 'abono' && ticket.tipoTicket === 'abono') ||
        (filtroTipoTarifa === 'anticipado' && ticket.tipoTicket === 'turno');

      return pasaBusqueda && pasaVehiculo && pasaTarifa;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.fechaCreacion) -
        new Date(a.createdAt || a.fechaCreacion)
    );

  // =============================
  // UI
  // =============================

  return (
    <div>
      {/* BUSCADOR + FILTROS */}
      <div className="search-cliente-container-tick" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>

        {/* BUSCADOR */}
        <div className="search-cliente-input-container" style={{ flex: 1 }}>
          <div className="search-cliente-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24px"
              height="24px"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
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

        {/* SELECTOR TIPO VEHICULO */}
        <select
          className="select-filtro"
          value={filtroTipoVehiculo}
          onChange={(e) => setFiltroTipoVehiculo(e.target.value)}
          style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
        >
          <option value="">Tipo Vehículo</option>
          {tiposVehiculo.map((tv) => (
            <option key={tv.nombre} value={tv.nombre}>
              {tv.nombre}
            </option>
          ))}
        </select>

        {/* SELECTOR TIPO TARIFA */}
        <select
          className="select-filtro"
          value={filtroTipoTarifa}
          onChange={(e) => setFiltroTipoTarifa(e.target.value)}
          style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
        >
          <option value="">Tipo Tarifa</option>
          <option value="abono">Abono</option>
          <option value="anticipado">Anticipado</option>
        </select>
      </div>

      {/* SI NO HAY TICKETS */}
      {ticketsFiltrados.length === 0 ? (
        <div className="mensaje-vacio">
          <p>No hay resultados.</p>
        </div>
      ) : viewMode === "list" ? (
        /* MODO LISTA */
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
                <td>{ticket.tipoTicket === 'turno' ? 'Turno' : 'Abono (Vehículo)'}</td>
                <td>{ticket.patente}</td>
                <td>{ticket.nombreCliente || ticket.nombreApellido || 'N/A'}</td>
                <td>{capitalizar(ticket.tipoVehiculo)}</td>
                <td>{formatearFechaHora(ticket.createdAt || ticket.fechaCreacion)}</td>
                <td>{formatearFechaHora(ticket.fechaExpiracion || ticket.fin || null)}</td>
                <td>${ticket.precio ? ticket.precio.toLocaleString('es-AR') : '0'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        /* MODO GRID */
        <div className="tickets-container">
          {ticketsFiltrados.map((ticket) => (
            <div key={ticket._id} className="abono-card">
              <div
                className="abono-header-background"
                style={{
                  backgroundColor:
                    ticket.tipoTicket === 'turno'
                      ? 'rgba(168, 244, 215, 0.4)'
                      : 'rgba(168, 216, 255, 0.4)',
                }}
              >
                <div className="abono-tipo-tarifa">
                  {ticket.tipoTicket === 'turno' ? (
                    <div className="abono-tarifa-info">
                      <FaRegClock size={25} />
                      <p>Turno</p>
                    </div>
                  ) : (
                    <div className="abono-tarifa-info">
                      <FaCalendarAlt size={30} />
                      <p>Abono</p>
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
                    <p className="fecha-info">
                      {formatearFechaHora(ticket.createdAt || ticket.fechaCreacion)}
                    </p>
                  </div>
                  <div className="fecha-item">
                    <p className="fecha-titulo">Expiración:</p>
                    <p className="fecha-info">
                      {formatearFechaHora(ticket.fechaExpiracion || ticket.fin || null)}
                    </p>
                  </div>
                </div>
                <div className="abono-precio">
                  <p className="importe-titulo">Importe Actual</p>
                  <p className="importe-monto">
                    ${ticket.precio ? ticket.precio.toLocaleString('es-AR') : '0'}
                  </p>
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
