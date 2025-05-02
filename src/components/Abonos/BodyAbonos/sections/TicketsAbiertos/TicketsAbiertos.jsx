import React, { useEffect, useState } from 'react';
import './TicketsAbiertos.css';
import { FaCalendarAlt, FaRegClock } from 'react-icons/fa';

const TicketsAbiertos = () => {
  const [abonos, setAbonos] = useState([]);

  useEffect(() => {
    fetch('https://parkingapp-back.onrender.com/api/abonos')
      .then((res) => res.json())
      .then((data) => setAbonos(data))
      .catch((err) => console.error('Error al obtener abonos:', err));
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

  return (
    <div className="tickets-container">
      {abonos.map((abono) => (
        <div key={abono._id} className="abono-card">
          <div className="abono-header-background">
            <div className="abono-tipo-tarifa">
              {abono.tipoTarifa === 'mensual' ? (
                <div className="abono-tarifa-info">
                  <FaCalendarAlt size={30} />
                  <p>Mensual</p>
                </div>
              ) : abono.tipoTarifa === 'turno' ? (
                <div className="abono-tarifa-info">
                  <FaRegClock size={25} />
                  <p>Turno</p>
                </div>
              ) : null}
            </div>

            <div className="abono-header">
              <h2 className="abono-patente">{abono.patente}</h2>
              <p className="abono-vehiculo">{capitalizar(abono.tipoVehiculo)}</p>
            </div>
          </div>

          <div className="abono-body">
            <div className="abono-fechas">
              <div className="fecha-item">
                <p className="fecha-titulo">Creación:</p>
                <p className="fecha-info">{formatearFechaHora(abono.fechaCreacion)}</p>
              </div>
              <div className="fecha-item">
                <p className="fecha-titulo">Expiración:</p>
                <p className="fecha-info">{formatearFechaHora(abono.fechaExpiracion)}</p>
              </div>
            </div>
            <div className="abono-precio">
              <p className="importe-titulo">Importe Actual</p>
              <p className="importe-monto">${abono.precio.toLocaleString('es-AR')}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TicketsAbiertos;
