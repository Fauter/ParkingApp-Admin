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

  // 🔹 Abonos reales del cliente (NO vienen en /clientes)
  const [abonosCliente, setAbonosCliente] = useState([]);

  const [vehiculoExpandido, setVehiculoExpandido] = useState(null);
  const [modalFotoUrl, setModalFotoUrl] = useState(null);
  const [modalAgregarVisible, setModalAgregarVisible] = useState(false);
  const [loading, setLoading] = useState(false);

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

  // 🔹 Cocheras agrupadas con vehículos/abonos (como en DetalleClienteCajero)
  const [cocherasConVehiculos, setCocherasConVehiculos] = useState([]);
  const [cocherasLoading, setCocherasLoading] = useState(false);

  const abonos = Array.isArray(abonosCliente) ? abonosCliente : [];

  const fetchCliente = async () => {
    try {
      const res = await fetch(`https://apiprueba.garageia.com/api/clientes/id/${id}`);
      if (!res.ok) throw new Error("Error al obtener cliente");
      const data = await res.json();

      setCliente(prev => {
        if (!prev) return data;
        if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
        return data;
      });
    } catch (err) {
      console.error("Error al obtener cliente:", err);
    }
  };

  useEffect(() => {
    const fetchAbonosCliente = async () => {
      if (!id) {
        setAbonosCliente([]);
        return;
      }

      try {
        const res = await fetch(
          `https://apiprueba.garageia.com/api/abonos?cliente=${id}`
        );
        if (!res.ok) throw new Error('Error cargando abonos');

        const data = await res.json();
        setAbonosCliente(prev => {
          const next = Array.isArray(data) ? data : [];
          if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
          return next;
        });
      } catch (err) {
        console.error('Error cargando abonos del cliente:', err);
        setAbonosCliente([]);
      }
    };

    fetchAbonosCliente();
  }, [id]);

  useEffect(() => {
    fetchCliente();
  }, [id]);

  // 🔁 Poll cada 15s cuando estás en pestaña Vehículos: refresca cliente (y por rebote, cocheras/vehículos)
  useEffect(() => {
    if (tab !== 'vehiculos') return;

    const interval = setInterval(() => {
      if (!modalAgregarVisible && !vehiculoExpandido) {
        fetchCliente();
        fetch(`https://apiprueba.garageia.com/api/abonos?cliente=${id}`)
          .then(r => r.json())
          .then(d => {
            setAbonosCliente(prev => {
              const next = Array.isArray(d) ? d : [];
              if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
              return next;
            });
          })
          .catch(() => {});
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [tab, modalAgregarVisible, vehiculoExpandido, id]);

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'file' ? files[0] : value }));
  };

  const formatearFechaCorta = (fechaISO) => {
    if (!fechaISO) return '---';
    const fecha = new Date(fechaISO);
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    return `${dia}/${mes}`;
  };

  const capitalizeFirstLetter = (str) => 
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '---';

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
    if (!campo) return alert('Tipo de foto desconocido.');

    const nombre = abono[campo];
    if (!nombre || nombre === '') return alert('No hay foto disponible');

    const nombreDecodificado = decodeURIComponent(nombre);

    let rutaFoto;
    if (nombreDecodificado.startsWith('/fotos/')) {
      rutaFoto = `https://apiprueba.garageia.com/uploads${nombreDecodificado}`;
    } else {
      rutaFoto = `https://apiprueba.garageia.com/uploads/fotos/${nombreDecodificado}`;
    }

    const urlConTimestamp = `${rutaFoto}?t=${Date.now()}`;

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
        patente: '', marca: '', modelo: '', anio: '', color: '',
        tipoVehiculo: '', companiaSeguro: '',
        metodoPago: '', factura: '',
        fotoDNI: null, fotoSeguro: null, fotoCedulaVerde: null, fotoCedulaAzul: null,
      });
    }
  };

  // ================== LÓGICA NUEVA: vehículos + cocheras ==================

  // 2) Elegir el abono correcto por patente (igual a Cajero)
  const elegirAbonoPorPatente = (abonosCliente, patenteUpper) => {
    if (!Array.isArray(abonosCliente) || !patenteUpper) return null;

    const mismos = abonosCliente.filter(a =>
      a && String(a.patente || '').toUpperCase() === patenteUpper
    );
    if (!mismos.length) return null;

    const ordenarPorFecha = (x, y) => {
      const fx = new Date(x.fechaExpiracion || x.fechaCreacion || 0);
      const fy = new Date(y.fechaExpiracion || y.fechaCreacion || 0);
      return fy - fx; // más nuevo primero
    };

    const activos = mismos.filter(a => a.activo !== false);
    if (activos.length) return [...activos].sort(ordenarPorFecha)[0];

    return [...mismos].sort(ordenarPorFecha)[0];
  };

  const enriquecerAbonoDesdeCliente = (abono) => {
    if (!abono || !cliente?.abonos?.length) return abono;

    const match = cliente.abonos.find(
      a => String(a.patente || '').toUpperCase() === String(abono.patente || '').toUpperCase()
    );

    if (!match) return abono;

    return {
      ...abono,
      companiaSeguro: abono.companiaSeguro ?? match.companiaSeguro,
      fotoSeguro: abono.fotoSeguro ?? match.fotoSeguro,
      fotoDNI: abono.fotoDNI ?? match.fotoDNI,
      fotoCedulaVerde: abono.fotoCedulaVerde ?? match.fotoCedulaVerde,
      fotoCedulaAzul: abono.fotoCedulaAzul ?? match.fotoCedulaAzul,
    };
  };

  // ✅ En DetalleCliente la fila del vehículo se construye desde el ABONO.
  // La cochera solo aporta el “listado de patentes existentes” (cochera.vehiculos[])
  // y el abono aporta todos los campos ricos (marca/modelo/fotos/fechas/etc).
  // No se necesita merge.

  // 4) Helpers de estado de abono por conjunto de abonos (cochera)
  const obtenerFinAbonoDeAbonos = (abonos) => {
    if (!Array.isArray(abonos) || !abonos.length) return null;
    let fin = null;
    for (const a of abonos) {
      if (!a || !a.fechaExpiracion) continue;
      const f = new Date(a.fechaExpiracion);
      if (!isNaN(f) && (!fin || f > fin)) fin = f;
    }
    return fin;
  };

  const esAbonoActivoDeAbonos = (abonos) => {
    const fin = obtenerFinAbonoDeAbonos(abonos);
    if (!fin) return false;
    const ahora = new Date();
    return fin >= ahora;
  };

  // 5) Cargar cocheras del cliente y agrupar vehículos/abonos por cochera
  useEffect(() => {
    const fetchCocherasCliente = async () => {
      if (!cliente || !Array.isArray(cliente.cocheras) || cliente.cocheras.length === 0) {
        setCocherasConVehiculos([]);
        return;
      }

      try {
        setCocherasLoading(true);

        const abonos = Array.isArray(abonosCliente) ? abonosCliente : [];

        const resultado = [];

        for (const c of cliente.cocheras) {
          if (!c?.cocheraId) continue;

          const res = await fetch(`https://apiprueba.garageia.com/api/cocheras/${c.cocheraId}`);
          if (!res.ok) continue;

          const cocheraData = await res.json();

          const vehiculosCochera = Array.isArray(cocheraData.vehiculos) ? cocheraData.vehiculos : [];

          // ✅ Cada “vehículo mostrado” sale del ABONO (no del /vehiculos)
          const abonosDeEstaCochera = vehiculosCochera
            .map(v =>
              elegirAbonoPorPatente(
                abonos,
                String(v?.patente || '').toUpperCase()
              )
            )
            .filter(Boolean);

          resultado.push({
            cocheraId: cocheraData._id || c.cocheraId,
            tipo: cocheraData.tipo ?? c.cochera,
            piso: cocheraData.piso ?? c.piso,
            exclusiva: typeof cocheraData.exclusiva === 'boolean'
              ? cocheraData.exclusiva
              : !!c.exclusiva,
            vehiculos: abonosDeEstaCochera.map(enriquecerAbonoDesdeCliente),
          });
        }

        setCocherasConVehiculos(resultado);
      } catch (err) {
        console.error('Error cargando cocheras del cliente:', err);
        setCocherasConVehiculos([]);
      } finally {
        setCocherasLoading(false);
      }
    };

    fetchCocherasCliente();
  }, [cliente, abonosCliente]);

  if (!cliente) {
    return (
      <div className="detalle-cliente-padding">
        <p>No se encontró la información del cliente.</p>
        <button onClick={() => navigate('/')}>← Volver</button>
      </div>
    );
  }

  const calcularCantidadVehiculosMostrados = () => {
    if (!Array.isArray(cocherasConVehiculos)) return 0;
    const patentesEnCocheras = new Set();
    cocherasConVehiculos.forEach(c =>
      (c.vehiculos || []).forEach(a =>
        a?.patente && patentesEnCocheras.add(a.patente.toUpperCase())
      )
    );

    const sinCochera = abonos.filter(a =>
      a?.activo !== false &&
      a?.patente &&
      !patentesEnCocheras.has(a.patente.toUpperCase())
    );

    return (
      cocherasConVehiculos.reduce(
        (acc, c) => acc + (Array.isArray(c.vehiculos) ? c.vehiculos.length : 0),
        0
      ) + sinCochera.length
    );
  };

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
            Vehículos ({calcularCantidadVehiculosMostrados()})
          </button>
        </nav>

        <div className="detalle-cliente-tab-content split-tab-content">
          {tab === 'cuenta' ? (
            <>
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

                          const monto = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })
                            .format(mov.monto);

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
              {cocherasLoading && (
                <div className="cocheras-loading">Cargando cocheras...</div>
              )}

              {(() => {
                const clienteCocherasArr = Array.isArray(cliente.cocheras) ? cliente.cocheras : [];
                const abonosActivos = abonos.filter(a => a && a.activo !== false);

                // Abonos activos que ya están asignados a alguna cochera
                const patentesEnCocheras = new Set();
                cocherasConVehiculos.forEach(c => {
                  (c.vehiculos || []).forEach(a => {
                    const p = String(a?.patente || '').toUpperCase();
                    if (p) patentesEnCocheras.add(p);
                  });
                });

                const abonosSinCochera = abonosActivos
                  .filter(a => {
                    const p = String(a?.patente || '').toUpperCase();
                    return p && !patentesEnCocheras.has(p);
                  })
                  .map(enriquecerAbonoDesdeCliente);

                // ========= CASO CON COCHERAS =========
                if (clienteCocherasArr.length > 0) {
                  return (
                    <>
                      {cocherasConVehiculos.map((coch) => {
                        const vehiculos = coch.vehiculos || [];
                        const vehiculosActivos = vehiculos.filter(a => a && a.activo !== false);
                        const fin = obtenerFinAbonoDeAbonos(vehiculosActivos);
                        const activo =
                          vehiculosActivos.length > 0 && esAbonoActivoDeAbonos(vehiculosActivos);

                        const tipoNorm = (coch.tipo || '').toString().trim().toLowerCase();
                        let cochLabel = 'Cochera';
                        if (tipoNorm === 'móvil' || tipoNorm === 'movil') cochLabel = 'Cochera Móvil';
                        else if (tipoNorm === 'fija')
                          cochLabel = coch.exclusiva ? 'Cochera Exclusiva' : 'Cochera Fija';
                        if (coch.piso !== undefined && coch.piso !== null && coch.piso !== '') {
                          cochLabel += ` • N° ${coch.piso}`;
                        }

                        return (
                          <div key={coch.cocheraId} className="cochera-group">
                            {/* Header de cochera + estado abono */}
                            <div className="status-abono-container cochera-status">
                              <div className={`status-abono ${activo ? 'activo' : 'inactivo'}`}>
                                <div className="cochera-header-left">
                                  <span className="cochera-piso-label">{cochLabel}</span>
                                </div>
                                <div className="cochera-header-right">
                                  {activo && fin ? (
                                    <>
                                      <span className="status-text">ABONADO HASTA</span>
                                      <span className="status-fecha">
                                        {formatearFechaCorta(fin)}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="status-text">ABONO EXPIRADO</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {vehiculos.length > 0 ? (
                              <table className="tabla-vehiculos">
                                <thead>
                                  <tr>
                                    <th>Patente</th>
                                    <th>Marca</th>
                                    <th>Modelo</th>
                                    <th>Año</th>
                                    <th>Color</th>
                                    <th>Tipo</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {vehiculos.map((abono) => {
                                    const expandido = vehiculoExpandido === abono._id;
                                    return (
                                      <React.Fragment key={abono._id}>
                                        <tr
                                          onClick={() =>
                                            setVehiculoExpandido(prev =>
                                              prev === abono._id ? null : abono._id
                                            )
                                          }
                                          className="fila-vehiculo"
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
                                              <div className="expandido-contenido">
                                                <div className="expandido-left">
                                                  <div className="detalles-adicionales">
                                                    <p>
                                                      <strong>Color:</strong>{' '}
                                                      {capitalizeFirstLetter(abono.color)}
                                                    </p>
                                                    <p>
                                                      <strong>Seguro:</strong>{' '}
                                                      {capitalizeFirstLetter(abono.companiaSeguro)}
                                                    </p>
                                                  </div>
                                                  <div className="botones-documentos">
                                                    <button onClick={() => abrirFoto(abono, 'dni')}>
                                                      DNI
                                                    </button>
                                                    <button onClick={() => abrirFoto(abono, 'seguro')}>
                                                      Seguro
                                                    </button>
                                                    <button
                                                      onClick={() => abrirFoto(abono, 'cedulaVerde')}
                                                    >
                                                      Céd. Verde
                                                    </button>
                                                  </div>
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
                              <div className="sin-vehiculos">
                                <p>No hay vehículos registrados para esta cochera.</p>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Vehículos activos sin cochera asignada */}
                      {abonosSinCochera.length > 0 && (
                        <div className="cochera-group cochera-sin-asignar">
                          <div className="cochera-group-header">
                            <h4>Vehículos sin cochera asignada</h4>
                          </div>
                          <table className="tabla-vehiculos">
                            <thead>
                              <tr>
                                <th>Patente</th>
                                <th>Marca</th>
                                <th>Modelo</th>
                                <th>Año</th>
                                <th>Color</th>
                                <th>Tipo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {abonosSinCochera.map((abono) => {
                                const expandido = vehiculoExpandido === abono._id;
                                return (
                                  <React.Fragment key={abono._id}>
                                    <tr
                                      onClick={() =>
                                        setVehiculoExpandido(prev =>
                                          prev === abono._id ? null : abono._id
                                        )
                                      }
                                      className="fila-vehiculo"
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
                                          <div className="expandido-contenido">
                                            <div className="expandido-left">
                                              <div className="detalles-adicionales">
                                                <p>
                                                  <strong>Color:</strong>{' '}
                                                  {capitalizeFirstLetter(abono.color)}
                                                </p>
                                                <p>
                                                  <strong>Seguro:</strong>{' '}
                                                  {capitalizeFirstLetter(abono.companiaSeguro)}
                                                </p>
                                              </div>
                                              <div className="botones-documentos">
                                                <button onClick={() => abrirFoto(abono, 'dni')}>
                                                  DNI
                                                </button>
                                                <button onClick={() => abrirFoto(abono, 'seguro')}>
                                                  Seguro
                                                </button>
                                                <button
                                                  onClick={() => abrirFoto(abono, 'cedulaVerde')}
                                                >
                                                  Céd. Verde
                                                </button>
                                              </div>
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
                        </div>
                      )}

                      {cocherasConVehiculos.length === 0 && abonosActivos.length === 0 && (
                        <div className="sin-vehiculos">
                          <p>No hay vehículos registrados para este cliente.</p>
                        </div>
                      )}
                    </>
                  );
                }

                // ========= CASO LEGACY: sin cocheras =========
                if (abonosActivos.length > 0) {
                  return (
                    <table className="tabla-vehiculos">
                      <thead>
                        <tr>
                          <th>Patente</th>
                          <th>Marca</th>
                          <th>Modelo</th>
                          <th>Año</th>
                          <th>Color</th>
                          <th>Tipo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {abonosActivos.map((abono) => {
                          const expandido = vehiculoExpandido === abono._id;
                          return (
                            <React.Fragment key={abono._id}>
                              <tr
                                onClick={() =>
                                  setVehiculoExpandido(prev =>
                                    prev === abono._id ? null : abono._id
                                  )
                                }
                                className="fila-vehiculo"
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
                                    <div className="expandido-contenido">
                                      <div className="expandido-left">
                                        <div className="detalles-adicionales">
                                          <p>
                                            <strong>Color:</strong>{' '}
                                            {capitalizeFirstLetter(abono.color)}
                                          </p>
                                          <p>
                                            <strong>Seguro:</strong>{' '}
                                            {capitalizeFirstLetter(abono.companiaSeguro)}
                                          </p>
                                        </div>
                                        <div className="botones-documentos">
                                          <button onClick={() => abrirFoto(abono, 'dni')}>
                                            DNI
                                          </button>
                                          <button onClick={() => abrirFoto(abono, 'seguro')}>
                                            Seguro
                                          </button>
                                          <button
                                            onClick={() => abrirFoto(abono, 'cedulaVerde')}
                                          >
                                            Céd. Verde
                                          </button>
                                        </div>
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
                  );
                }

                // Sin abonos
                return (
                  <div className="sin-vehiculos">
                    <p>No hay vehículos registrados para este cliente.</p>
                  </div>
                );
              })()}
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

      {modalFotoUrl && (
        <div className="modal-foto-overlay" onClick={cerrarModal}>
          <div className="modal-foto-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={cerrarModal}>&times;</button>
            <img 
              src={modalFotoUrl} 
              alt="Documento del cliente" 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '';
                alert('No se pudo cargar la imagen.');
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
