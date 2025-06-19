import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlus } from 'react-icons/fa';
import './DetalleCliente.css';
import ModalVehiculo from './ModalVehiculo'; 


const DetalleCliente = () => {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [tab, setTab] = useState('cuenta');
  const [movimientos, setMovimientos] = useState([]);
  const [vehiculoExpandido, setVehiculoExpandido] = useState(null);

  // Estados para modales y formulario vehículo
  const [modalFotoUrl, setModalFotoUrl] = useState(null);
  const [modalAgregarVisible, setModalAgregarVisible] = useState(false);
  
  // Estado para el formulario del vehículo dentro del modal
  const [formData, setFormData] = useState({
    patente: '',
    marca: '',
    modelo: '',
    anio: '',
    color: '',
    tipoVehiculo: '',
    fotoDNI: null,
    fotoSeguro: null,
    fotoCedulaVerde: null,
    fotoCedulaAzul: null,
  });

  // Tipos de vehículos para select (ejemplo)
  const tiposVehiculo = ['Auto', 'Moto', 'Camioneta', 'Camión', 'Otro'];

  useEffect(() => {
    const clienteGuardado = localStorage.getItem('clienteSeleccionado');
    if (clienteGuardado) {
      const clienteParseado = JSON.parse(clienteGuardado);
      setCliente(clienteParseado);
      setMovimientos(clienteParseado.movimientos || []);
    }
  }, []);

  useEffect(() => {
    // Función para actualizar cliente y vehículos
    const actualizarCliente = () => {
      const clienteGuardado = localStorage.getItem('clienteSeleccionado');
      if (clienteGuardado) {
        const clienteParseado = JSON.parse(clienteGuardado);

        // Si hay algún cambio en los vehículos, actualizamos el estado
        // Para evitar re-render innecesario, podrías comparar la longitud o algún ID
        setCliente((prev) => {
          if (!prev) return clienteParseado;
          const prevAbonos = prev.abonos || [];
          const nuevoAbonos = clienteParseado.abonos || [];
          if (prevAbonos.length !== nuevoAbonos.length) {
            // Si cambió la cantidad, actualizamos cliente
            return clienteParseado;
          }
          // Si quieres puedes hacer una comparación más profunda acá (por patente, _id, etc)
          return prev; // no cambia nada
        });
      }
    };

    // Llama una vez al montar el componente
    actualizarCliente();

    // Configura un intervalo cada 15 segundos para actualizar
    const intervalo = setInterval(() => {
      if (tab === 'vehiculos') {
        actualizarCliente();
      }
    }, 15000); // 15 segundos (ajustá a lo que necesites)

    // Limpia el intervalo al desmontar
    return () => clearInterval(intervalo);
  }, [tab]);

  useEffect(() => {
    const clienteGuardado = localStorage.getItem('clienteSeleccionado');
    if (clienteGuardado) {
      const clienteParseado = JSON.parse(clienteGuardado);
      setCliente(clienteParseado);
      setMovimientos(clienteParseado.movimientos || []);
    }
  }, []);

  // Maneja cambios en inputs del formulario vehículo
  const handleChange = (e) => {
    const { name, value, files, type } = e.target;
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const renderFileInput = (label, name) => {
    const archivoCargado = formData[name] != null;

    return (
      <div className="file-input-wrapper">
        <label className="file-visible-label">{label}</label>
        <label className="file-label">
          <div className="icon-wrapper">📷</div>
          {archivoCargado ? (
            <div className="file-uploaded">✅</div>
          ) : (
            <div className="file-text">
              <span>Seleccionar</span>
              <span>Imagen</span>
            </div>
          )}
          <input
            type="file"
            name={name}
            accept="image/*"
            onChange={handleChange} // tu función ya definida
            style={{ display: 'none' }}
          />
        </label>
      </div>
    );
  };


  const formatearFechaCorta = (fechaISO) => {
    const fecha = new Date(fechaISO);
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    return `${dia}/${mes}`;
  };

  const capitalizeFirstLetter = (str) => {
    if (!str) return '---';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const formatearDniCuitCuil = (valor) => {
    if (!valor) return '---';
    const limpio = valor.replace(/\D/g, '');
    
    if (limpio.length === 7) {
      return limpio.replace(/(\d{1})(\d{3})(\d{3})/, '$1.$2.$3');
    } else if (limpio.length === 8) {
      return limpio.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3');
    } else if (limpio.length === 11) {
      return limpio.replace(/(\d{2})(\d{8})(\d{1})/, '$1-$2-$3');
    } else {
      return valor;
    }
  };

  const formatearTelefono = (telefono) => {
    if (!telefono) return '---';
    const limpio = telefono.replace(/\D/g, '');

    if (limpio.length === 10) {
      return `${limpio.slice(0, 2)} ${limpio.slice(2, 6)}-${limpio.slice(6)}`;
    } else if (limpio.length === 11 && limpio.startsWith('54')) {
      const numero = limpio.slice(2);
      return `${numero.slice(0, 2)} ${numero.slice(2, 6)}-${numero.slice(6)}`;
    } else {
      return telefono;
    }
  };

  const abrirFoto = (abono, tipoFoto) => {
    if (!abono) return;

    let fotoNombre = '';
    switch (tipoFoto) {
      case 'dni':
        fotoNombre = abono.fotoDNI;
        break;
      case 'seguro':
        fotoNombre = abono.fotoSeguro;
        break;
      case 'cedulaVerde':
        fotoNombre = abono.fotoCedulaVerde;
        break;
      case 'cedulaAzul':
        fotoNombre = abono.fotoCedulaAzul;
        break;
      default:
        fotoNombre = '';
    }

    if (!fotoNombre) {
      alert('No hay foto disponible para este documento.');
      return;
    }

    const urlBase = 'http://localhost:5000/uploads/';
    const urlCompleta = urlBase + fotoNombre;

    setModalFotoUrl(urlCompleta);
  };

  const cerrarModal = () => {
    setModalFotoUrl(null);
  };

  const fetchClienteActualizado = async () => {
    try {
      const clienteGuardado = localStorage.getItem('clienteSeleccionado');
      if (!clienteGuardado) return;

      const clienteParseado = JSON.parse(clienteGuardado);

      const res = await fetch(`http://localhost:5000/api/clientes/${clienteParseado._id}`);
      if (!res.ok) throw new Error("Error al obtener cliente actualizado");
      const data = await res.json();

      // Guardar en localStorage para mantener sincronizado
      localStorage.setItem('clienteSeleccionado', JSON.stringify(data));
      setCliente(data);
    } catch (error) {
      console.error("Error al recargar cliente:", error);
    }
  };
  // Función para guardar vehículo nuevo recibido desde ModalVehiculo
  const handleGuardarVehiculo = async () => {
    await fetchClienteActualizado();
    setModalAgregarVisible(false);

    // Resetear formulario
    setFormData({
      patente: '',
      marca: '',
      modelo: '',
      anio: '',
      color: '',
      tipoVehiculo: '',
      fotoDNI: null,
      fotoSeguro: null,
      fotoCedulaVerde: null,
      fotoCedulaAzul: null,
    });
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
            onClick={() => navigate('/tickets?tab=Clientes+Abonados')}
            className="detalle-cliente-back-button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
            aria-label="Volver"
          >
            <FaArrowLeft />
          </button>
          <span className="clienteTab-link">{cliente.nombreApellido}</span>
        </div>
      </div>

      <div className="detalle-cliente-tabs-container" style={{ position: 'relative' }}>
        <div className="detalle-cliente-tabs-wrapper">
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
        </div>

        {/* Botón + para abrir modal en tab vehículos */}
        {tab === 'vehiculos' && (
          <button
            className="boton-plus"
            aria-label="Agregar"
            onClick={() => setModalAgregarVisible(true)}
          >
            <FaPlus />
          </button>
        )}

        <div className="detalle-cliente-tab-content split-tab-content">
          {tab === 'cuenta' && (
            <>
              {/* Información cuenta */}
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

              {/* Balance y movimientos */}
              <div className="detalle-right">
                <div className="balance-section">
                  <div className="balance-info-container">
                    <div className="balance-main">
                      <h4>Balance de la cuenta</h4>
                      <p className={`balance-amount ${cliente.balance < 0 ? 'negativo' : ''}`}>
                        ${cliente.balance.toFixed(2)}
                      </p>
                    </div>
                    <div className={`abonado-status-container ${cliente.abonado ? 'abonado' : 'no-abonado'}`}>
                      <h4>{cliente.abonado ? 'Abonado' : 'Abono Expirado'}</h4>
                      {cliente.abonado && (
                        <p className="abonado-fecha">Hasta {formatearFechaCorta(cliente.finAbono)}</p>
                      )}
                    </div>
                  </div>
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
                      <th>Tipo de Vehiculo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cliente.abonos.map((abono) => {
                      const estaExpandido = vehiculoExpandido === abono._id;
                      return (
                        <React.Fragment key={abono._id}>
                          <tr
                            onClick={() =>
                              setVehiculoExpandido((prev) => (prev === abono._id ? null : abono._id))
                            }
                            className="vehiculo-row"
                            style={{ cursor: 'pointer' }}
                          >
                            <td>{abono.patente?.toUpperCase() || '---'}</td>
                            <td>{capitalizeFirstLetter(abono.marca) || '---'}</td>
                            <td>{capitalizeFirstLetter(abono.modelo) || '---'}</td>
                            <td>{abono.anio || '---'}</td>
                            <td>{capitalizeFirstLetter(abono.color) || '---'}</td>
                            <td>{capitalizeFirstLetter(abono.tipoVehiculo) || '---'}</td>
                          </tr>
                          {estaExpandido && (
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
              ) : (
                <p>No hay abonos registrados para este cliente.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal para agregar vehículo */}
      {modalAgregarVisible && (
        <ModalVehiculo
          visible={modalAgregarVisible}
          onClose={() => setModalAgregarVisible(false)}
          formData={formData}
          setFormData={setFormData}
          handleChange={handleChange}
          tiposVehiculo={tiposVehiculo}
          renderFileInput={renderFileInput}
          onGuardar={handleGuardarVehiculo}
          onGuardarExitoso={handleGuardarVehiculo} 
          cliente={cliente}
        />
      )}

      {/* Modal foto */}
      {modalFotoUrl && (
        <div className="modal-foto-overlay" onClick={cerrarModal} aria-modal="true" role="dialog">
          <div className="modal-foto-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={cerrarModal} aria-label="Cerrar modal">&times;</button>
            <img src={modalFotoUrl} alt="Documento del cliente" />
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleCliente;
