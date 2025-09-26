import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaPlus } from 'react-icons/fa';
import './DetalleCliente.css';
import ModalVehiculo from './ModalVehiculo'; 

const DetalleCliente = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [cliente, setCliente] = useState(null);
  const [tab, setTab] = useState('cuenta');
  const [vehiculoExpandido, setVehiculoExpandido] = useState(null);
  const [modalFotoUrl, setModalFotoUrl] = useState(null);
  const [modalAgregarVisible, setModalAgregarVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalRenovarVisible, setModalRenovarVisible] = useState(false);
  const [precioRenovacion, setPrecioRenovacion] = useState(0);
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [factura, setFactura] = useState('CC');
  const [diasRestantes, setDiasRestantes] = useState(0);

  const [formData, setFormData] = useState({
    patente: '',
    marca: '',
    modelo: '',
    anio: '',
    color: '',
    tipoVehiculo: '',
    companiaSeguro: '',
    metodoPago: '',
    factura: '',
    fotoDNI: null,
    fotoSeguro: null,
    fotoCedulaVerde: null,
    fotoCedulaAzul: null,
  });

  const fetchCliente = async () => {
    try {
      const res = await fetch(`https://api.garageia.com/api/clientes/id/${id}`);
      if (!res.ok) throw new Error("Error al obtener cliente");
      const data = await res.json();
      setCliente(data);
    } catch (err) {
      console.error("Error al obtener cliente:", err);
      setCliente(null);
    }
  };

  const calcularPrecioProporcional = (precioMensual) => {
    const hoy = new Date();
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    const totalDiasMes = ultimoDiaMes.getDate();
    const diaActual = hoy.getDate();
    const diasRestantesCalculados = totalDiasMes - diaActual + 1;
    
    setDiasRestantes(diasRestantesCalculados);
    
    // Si es el primer día del mes, cobrar el precio completo
    if (diaActual === 1) {
      return precioMensual;
    }
    
    // Calcular precio proporcional
    return Math.round((precioMensual / totalDiasMes) * diasRestantesCalculados);
  };

  const calcularPrecioRenovacion = async () => {
    try {
      if (!cliente) return;

      // Obtener precios actuales
      const response = await fetch('https://api.garageia.com/api/precios', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener precios');
      }
      
      const precios = await response.json();
      const precioMensual = precios[cliente.precioAbono]?.mensual || 0;
      const precioProporcional = calcularPrecioProporcional(precioMensual);
      
      setPrecioRenovacion(precioProporcional);
      setModalRenovarVisible(true);
      
    } catch (error) {
      console.error('Error al calcular precio:', error);
      alert('Error al calcular precio de renovación');
    }
  };

  const handleRenovarAbono = async () => {
    try {
      // Verificar que el cliente tenga al menos un vehículo/abono
      if (!cliente.abonos || cliente.abonos.length === 0) {
        alert('El cliente no tiene vehículos registrados. Agregue un vehículo primero.');
        setTab('vehiculos'); // Redirigir a la pestaña de vehículos
        setModalAgregarVisible(true); // Abrir modal para agregar vehículo
        setModalRenovarVisible(false);
        return;
      }

      setLoading(true);
      
      const operador = localStorage.getItem('nombreUsuario') || 'Admin';
      // Tomar la patente del primer vehículo (asegurarse que existe)
      const patente = cliente.abonos[0].patente;
      
      const response = await fetch(`https://api.garageia.com/api/clientes/${id}/renovar-abono`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          precio: precioRenovacion,
          metodoPago,
          factura,
          operador,
          patente,
          tipoVehiculo: cliente.precioAbono,
          diasRestantes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al renovar abono');
      }

      await fetchCliente();
      setModalRenovarVisible(false);
      alert('Abono renovado exitosamente');
      
    } catch (error) {
      console.error('Error al renovar abono:', error);
      alert(error.message || 'Error al renovar abono');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCliente();
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (tab === 'vehiculos') {
        fetchCliente();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [tab]);

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'file' ? files[0] : value }));
  };

  const formatearFechaCorta = (fechaISO) => {
    const fecha = new Date(fechaISO);
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    return `${dia}/${mes}`;
  };

  const capitalizeFirstLetter = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '---';

  const formatearDniCuitCuil = (valor) => {
    if (!valor) return '---';
    const limpio = valor.replace(/\D/g, '');
    if (limpio.length === 7) return limpio.replace(/(\d{1})(\d{3})(\d{3})/, '$1.$2.$3');
    if (limpio.length === 8) return limpio.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3');
    if (limpio.length === 11) return limpio.replace(/(\d{2})(\d{8})(\d{1})/, '$1-$2-$3');
    return valor;
  };

  const formatearTelefono = (tel) => {
    if (!tel) return '---';
    const limpio = tel.replace(/\D/g, '');
    if (limpio.length === 10) return `${limpio.slice(0, 2)} ${limpio.slice(2, 6)}-${limpio.slice(6)}`;
    if (limpio.length === 11 && limpio.startsWith('54')) {
      const numero = limpio.slice(2);
      return `${numero.slice(0, 2)} ${numero.slice(2, 6)}-${numero.slice(6)}`;
    }
    return tel;
  };

  const abrirFoto = (abono, tipoFoto) => {
    const camposValidos = {
      dni: 'fotoDNI',
      seguro: 'fotoSeguro',
      cedulaVerde: 'fotoCedulaVerde',
      cedulaAzul: 'fotoCedulaAzul'
    };

    const campo = camposValidos[tipoFoto];

    if (!campo) {
      alert('Tipo de foto desconocido.');
      return;
    }

    const nombre = abono[campo];

    if (!nombre || nombre === '') {
      return alert('No hay foto disponible');
    }

    const nombreDecodificado = decodeURIComponent(nombre);

    let rutaFoto;
    if (nombreDecodificado.startsWith('/fotos/')) {
      rutaFoto = `https://api.garageia.com/uploads${nombreDecodificado}`;
    } else {
      rutaFoto = `https://api.garageia.com/uploads/fotos/${nombreDecodificado}`;
    }

    const urlConTimestamp = `${rutaFoto}?t=${Date.now()}`;

    console.log(`Intentando abrir foto: ${urlConTimestamp}`);
    setModalFotoUrl(urlConTimestamp);
  };

  const cerrarModal = () => setModalFotoUrl(null);

  const handleGuardarExitoso = async () => {
    setLoading(true);
    try {
      await fetchCliente();
    } finally {
      setLoading(false);
      setModalAgregarVisible(false);
      setFormData({
        patente: '', 
        marca: '', 
        modelo: '', 
        anio: '', 
        color: '',
        tipoVehiculo: '', 
        companiaSeguro: '',
        metodoPago: '',
        factura: '',
        fotoDNI: null, 
        fotoSeguro: null,
        fotoCedulaVerde: null, 
        fotoCedulaAzul: null,
      });
    }
  };

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
            onClick={() => navigate('/tickets?tab=Clientes+Abonados', { state: { recargar: true } })}
            className="detalle-cliente-back-button"
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

        {/* {tab === 'vehiculos' && (
          <button
            className="boton-plus"
            onClick={() => setModalAgregarVisible(true)}
            aria-label="Agregar"
          >
            <FaPlus />
          </button>
        )} */}

        <div className="detalle-cliente-tab-content split-tab-content">
          {tab === 'cuenta' ? (
            <>
              {/* Info Cliente */}
              <div className="detalle-left">
                <div className="detalle-info-box">
                  <h4>Detalle del Cliente</h4>
                  <p><strong>DNI/CUIT/CUIL:</strong> {formatearDniCuitCuil(cliente.dniCuitCuil)}</p>
                  <p><strong>Nombre:</strong> {cliente.nombreApellido}</p>
                  <p><strong>Domicilio:</strong> {cliente.domicilio}</p>
                  <p><strong>Localidad:</strong> {cliente.localidad}</p>
                  <p><strong>Domicilio Trabajo:</strong> {cliente.domicilioTrabajo}</p>
                  <p><strong>Tel. Particular:</strong> {formatearTelefono(cliente.telefonoParticular)}</p>
                  <p><strong>Tel. Emergencia:</strong> {formatearTelefono(cliente.telefonoEmergencia)}</p>
                  <p><strong>Tel. Trabajo:</strong> {formatearTelefono(cliente.telefonoTrabajo)}</p>
                  <p><strong>Email:</strong> {cliente.email}</p>
                </div>
              </div>

              <div className="detalle-right">
                <div className="balance-section">
                  <div className="balance-info-container">
                    <div className="balance-main">
                      <h4>Balance</h4>
                      <p className={`balance-amount ${cliente.balance < 0 ? 'negativo' : ''}`}>
                        ${cliente.balance.toFixed(2)}
                      </p>
                    </div>
                    <div className={`abonado-status-container ${cliente.abonado ? 'abonado' : 'no-abonado'}`}>
                      <h4>{cliente.abonado ? 'Abonado' : 'Abono Expirado'}</h4>
                      {cliente.abonado && <p className="abonado-fecha">Hasta {formatearFechaCorta(cliente.finAbono)}</p>}
                      {!cliente.abonado && (
                        <button 
                          className="btn-renovar"
                          onClick={() => {
                            if (cliente.abonos?.length > 0) {
                              calcularPrecioRenovacion();
                            } else {
                              alert('Agregue al menos un vehículo antes de renovar');
                              setTab('vehiculos');
                              setModalAgregarVisible(true);
                            }
                          }}
                          disabled={!cliente.precioAbono}
                        >
                          RENOVAR
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="movimientos-section">
                  <h4>Movimientos</h4>
                  {cliente.movimientos?.length > 0 ? (
                    <table className="tabla-movimientos">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Tipo</th>
                          <th>Descripción</th>
                          <th>Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cliente.movimientos.slice().reverse().map((mov, i) => {
                          const tipo = mov.descripcion?.toLowerCase().includes('pago')
                            ? 'Pago'
                            : mov.tipoVehiculo
                            ? `Abono (${mov.tipoVehiculo})`
                            : 'Movimiento';
                          const monto = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(mov.monto);
                          return (
                            <tr key={i}>
                              <td>{new Date(mov.fecha).toLocaleDateString('es-AR')}</td>
                              <td>{tipo}</td>
                              <td>{mov.descripcion || '-'}</td>
                              <td className={mov.monto < 0 ? 'monto-negativo' : 'monto-positivo'}>
                                {mov.monto > 0 ? '+' : ''}{monto}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p>No hay movimientos.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="vehiculos-section">
              {cliente.abonos?.length > 0 ? (
                <table className="tabla-vehiculos">
                  <thead>
                    <tr>
                      <th>Patente</th><th>Marca</th><th>Modelo</th><th>Año</th><th>Color</th><th>Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cliente.abonos.map((abono) => {
                      const expandido = vehiculoExpandido === abono._id;
                      return (
                        <React.Fragment key={abono._id}>
                          <tr
                            onClick={() => setVehiculoExpandido(prev => prev === abono._id ? null : abono._id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td>{abono.patente?.toUpperCase() || '---'}</td>
                            <td>{capitalizeFirstLetter(abono.marca)}</td>
                            <td>{capitalizeFirstLetter(abono.modelo)}</td>
                            <td>{abono.anio || '---'}</td>
                            <td>{capitalizeFirstLetter(abono.color)}</td>
                            <td>{capitalizeFirstLetter(abono.tipoVehiculo)}</td>
                          </tr>
                          {expandido && (
                            <tr className="fila-expandida">
                              <td colSpan="6">
                                <div className="expandido-botones-container">
                                  <div className="botones-documentos">
                                    <button onClick={() => abrirFoto(abono, 'dni')}>DNI</button>
                                    <button onClick={() => abrirFoto(abono, 'seguro')}>Seguro</button>
                                    <button onClick={() => abrirFoto(abono, 'cedulaVerde')}>Céd. Verde</button>
                                    <button onClick={() => abrirFoto(abono, 'cedulaAzul')}>Céd. Azul</button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              ) : <p>No hay abonos registrados para este cliente.</p>}
            </div>
          )}
        </div>
      </div>

      {modalAgregarVisible && (
        <ModalVehiculo
          visible={modalAgregarVisible}
          onClose={() => setModalAgregarVisible(false)}
          onGuardarExitoso={handleGuardarExitoso}
          formData={formData}
          setFormData={setFormData}
          handleChange={handleChange}
          loading={loading}
          cliente={cliente}
        />
      )}

      {modalRenovarVisible && (
        <div className="modal-renovar-overlay" onClick={() => setModalRenovarVisible(false)}>
            <div className="modal-renovar-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setModalRenovarVisible(false)}>
                &times;
            </button>
            
            <div className="modal-renovar-header">
                <h3>Renovar Abono</h3>
            </div>
            
            <div className="detalles-renovacion">
                <p><strong>Tipo de vehículo:</strong> {cliente.precioAbono}</p>
                <p><strong>Días restantes del mes:</strong> {diasRestantes}</p>
                <p><strong>Precio a cobrar:</strong> ${precioRenovacion}</p>
                
                <div className="form-group">
                <label>Método de pago:</label>
                <select 
                    value={metodoPago} 
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="form-control"
                    required
                >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Débito">Débito</option>
                    <option value="Crédito">Crédito</option>
                    <option value="QR">QR</option>
                </select>
                </div>
                
                <div className="form-group">
                <label>Tipo de factura:</label>
                <select 
                    value={factura} 
                    onChange={(e) => setFactura(e.target.value)}
                    className="form-control"
                    required
                >
                    <option value="CC">CC</option>
                    <option value="A">A</option>
                    <option value="Final">Final</option>
                </select>
                </div>
            </div>
            
            <button 
                onClick={handleRenovarAbono}
                className="btn-confirmar"
                disabled={loading}
            >
                {loading ? 'Procesando...' : 'Confirmar Renovación'}
            </button>
            </div>
        </div>
      )}

      {modalFotoUrl && (
        <div className="modal-foto-overlay" onClick={cerrarModal}>
          <div className="modal-foto-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={cerrarModal}>&times;</button>
            <img 
              src={modalFotoUrl} 
              alt="Documento del cliente" 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = ''; // Limpiar src para evitar bucles
                alert('No se pudo cargar la imagen. Por favor intente nuevamente.');
                cerrarModal();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleCliente;