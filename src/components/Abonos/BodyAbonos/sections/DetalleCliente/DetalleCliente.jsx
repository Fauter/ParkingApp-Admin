import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPrint, FaUpload, FaArrowLeft } from 'react-icons/fa';
import './DetalleCliente.css';

const DetalleCliente = () => {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [tab, setTab] = useState('cuenta');
  const [movimientos, setMovimientos] = useState([]);

  useEffect(() => {
    const clienteGuardado = localStorage.getItem('clienteSeleccionado');
    if (clienteGuardado) {
      const clienteParseado = JSON.parse(clienteGuardado);
      setCliente(clienteParseado);

      if (clienteParseado.movimientos && clienteParseado.movimientos.length > 0) {
        setMovimientos(clienteParseado.movimientos);
      } else {
        setMovimientos([]);
      }
    }
  }, []);

  if (!cliente) {
    return (
      <div className="detalle-cliente-padding">
        <p>No se encontró la información del cliente.</p>
        <button onClick={() => navigate('/')}>← Volver</button>
      </div>
    );
  }

  return (
    <div className="clienteTab-container">
      <div className="clienteTab-header">
        <div className="clienteTab-links">
          <button
            onClick={() => navigate('/tickets?tab=Abonos')}
            className="detalle-cliente-back-button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
            aria-label="Volver"
          >
            <FaArrowLeft />
          </button>
          <span className="clienteTab-link">{cliente.nombreApellido}</span>
        </div>
      </div>

      <div className="detalle-cliente-tabs-container">
        <nav className="detalle-cliente-tabs">
          <button
            className={`detalle-cliente-tab-button ${tab === 'cuenta' ? 'active' : ''}`}
            onClick={() => setTab('cuenta')}
          >
            Cuenta Corriente
          </button>
          <button
            className={`detalle-cliente-tab-button ${tab === 'vehiculos' ? 'active' : ''}`}
            onClick={() => setTab('vehiculos')}
          >
            Vehículos ({cliente.abonos?.length || 0})
          </button>
        </nav>

        <div className="detalle-cliente-tab-content split-tab-content">
          {tab === 'cuenta' && (
            <>
              <div className="detalle-left">
                <div className="detalle-info-box">
                  <h4>Detalle del Cliente</h4>
                  <p><strong>Nombre:</strong> {cliente.nombreApellido}</p>
                  <p><strong>Domicilio:</strong> {cliente.domicilio}</p>
                  <p><strong>Localidad:</strong> {cliente.localidad}</p>
                  <p><strong>Domicilio Trabajo:</strong> {cliente.domicilioTrabajo}</p>
                  <p><strong>Tel. Particular:</strong> {cliente.telefonoParticular}</p>
                  <p><strong>Tel. Emergencia:</strong> {cliente.telefonoEmergencia}</p>
                  <p><strong>Tel. Trabajo:</strong> {cliente.telefonoTrabajo}</p>
                  <p><strong>Email:</strong> {cliente.email}</p>
                </div>
              </div>

              <div className="detalle-right">
                <div className="balance-section">
                  <h4>Balance de la cuenta</h4>
                  <p className={`balance-amount ${cliente.balance < 0 ? 'negativo' : ''}`}>
                    ${cliente.balance.toFixed(2)}
                  </p>
                </div>

                <div className="botones-acciones">
                  <button>Crear Cargo</button>
                  <button>Ingresar Pago</button>
                  <button>Pago Adelantado</button>
                  <button>Ajustar</button>
                  <button title="Imprimir"><FaPrint /></button>
                  <button title="Subir"><FaUpload /></button>
                </div>

                <div className="movimientos-section">
                  <h4>Movimientos</h4>
                  {movimientos.length > 0 ? (
                    <table className="tabla-movimientos">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Tipo Movimiento</th>
                          <th>Descripción</th>
                          <th>Monto</th>
                        </tr>
                      </thead>
                      <tbody className="tbodyBalance">
                        {movimientos.map((mov, index) => {
                          const montoFormateado = new Intl.NumberFormat('es-AR', {
                            style: 'currency',
                            currency: 'ARS',
                            minimumFractionDigits: 2
                          }).format(mov.monto);

                          const tipoClase = mov.monto < 0 ? 'monto-negativo' : 'monto-positivo';
                          const signo = mov.monto > 0 ? '+' : '';

                          // TipoMovimiento: Podés decidir según descripción o monto
                          // Por ejemplo, si la descripción incluye "Pago" lo mostramos como "Pago"
                          // sino asumimos que es un abono u otro movimiento.

                          let tipoMovimiento = 'Movimiento';
                          if (mov.descripcion?.toLowerCase().includes('pago')) {
                            tipoMovimiento = 'Pago';
                          } else if (mov.tipoVehiculo) {
                            tipoMovimiento = `Abono (${mov.tipoVehiculo})`;
                          }

                          return (
                            <tr key={index}>
                              <td>{new Date(mov.fecha).toLocaleDateString('es-AR')}</td>
                              <td>{tipoMovimiento}</td>
                              <td>{mov.descripcion || '-'}</td>
                              <td className={tipoClase}>
                                {signo}{montoFormateado}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p>No hay movimientos registrados.</p>
                  )}
                </div>
              </div>
            </>
          )}

          {tab === 'vehiculos' && (
            <div className="vehiculos-section">
              {cliente.abonos && cliente.abonos.length > 0 ? (
                <table className="tabla-vehiculos">
                  <thead>
                    <tr>
                      <th>Patente</th>
                      <th>Marca</th>
                      <th>Modelo</th>
                      <th>Año</th>
                      <th>Color</th>
                      <th>Fecha Expiración</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cliente.abonos.map((abono) => (
                      <tr key={abono._id}>
                        <td>{abono.patente?.toUpperCase() || '---'}</td>
                        <td>{abono.marca || '---'}</td>
                        <td>{abono.modelo || '---'}</td>
                        <td>{abono.anio || '---'}</td>
                        <td>{abono.color || '---'}</td>
                        <td>{new Date(abono.fechaExpiracion).toLocaleDateString('es-AR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No hay abonos registrados para este cliente.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetalleCliente;
