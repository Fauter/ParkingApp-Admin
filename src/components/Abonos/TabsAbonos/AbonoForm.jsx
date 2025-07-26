import React, { useEffect, useState } from 'react';
import './TabsAbonos.css';

const AbonoForm = ({ onClose, user }) => {
  const [formData, setFormData] = useState({
    nombreApellido: '',
    dniCuitCuil: '',
    domicilio: '',
    localidad: '',
    telefonoParticular: '',
    telefonoEmergencia: '',
    domicilioTrabajo: '',
    telefonoTrabajo: '',
    email: '',
    patente: '',
    marca: '',
    modelo: '',
    color: '',
    anio: '',
    companiaSeguro: '',
    metodoPago: '',
    factura: '',
    tipoVehiculo: '',
  });

  const [tarifas, setTarifas] = useState([]);
  const [fotoSeguro, setFotoSeguro] = useState(null);
  const [fotoDNI, setFotoDNI] = useState(null);
  const [fotoCedulaVerde, setFotoCedulaVerde] = useState(null);
  const [fotoCedulaAzul, setFotoCedulaAzul] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tiposVehiculo, setTiposVehiculo] = useState([]);
  const [precios, setPrecios] = useState({});
  const [clientes, setClientes] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [nombreTemporal, setNombreTemporal] = useState('');

  useEffect(() => {
    setFormData({
      nombreApellido: '',
      dniCuitCuil: '',
      domicilio: '',
      localidad: '',
      telefonoParticular: '',
      telefonoEmergencia: '',
      domicilioTrabajo: '',
      telefonoTrabajo: '',
      email: '',
      patente: '',
      marca: '',
      modelo: '',
      color: '',
      anio: '',
      companiaSeguro: '',
      metodoPago: '',
      factura: '',
      tipoVehiculo: '',
    });
    setFotoSeguro(null);
    setFotoDNI(null);
    setFotoCedulaVerde(null);
    setFotoCedulaAzul(null);
    setNombreTemporal('');
  }, []);

  // Cargar tarifas de tipo "abono" desde API
  useEffect(() => {
    fetch('http://localhost:5000/api/tarifas')
      .then(res => res.json())
      .then(data => {
        const abonos = data.filter(tarifa => tarifa.tipo === 'abono');
        setTarifas(abonos);
      })
      .catch(err => {
        console.error('Error al cargar tarifas', err);
      });
  }, []);

  // Cargar tipos de vehículo
  useEffect(() => {
    fetch('http://localhost:5000/api/tipos-vehiculo')
      .then(res => res.json())
      .then(data => setTiposVehiculo(data))
      .catch(err => console.error('Error al cargar tipos de vehículo', err));

    fetch('http://localhost:5000/api/precios')
      .then(res => res.json())
      .then(data => setPrecios(data))
      .catch(err => console.error('Error al cargar precios', err));
  }, []);

  // Cargar clientes
  useEffect(() => {
    fetch('http://localhost:5000/api/clientes')
      .then(res => res.json())
      .then(data => setClientes(data))
      .catch(err => console.error('Error al cargar clientes', err));
  }, []);

  // Buscar sugerencias de clientes
  useEffect(() => {
    if (nombreTemporal.trim().length >= 3) {
      const coincidencias = clientes.filter((c) =>
        c.nombreApellido.toLowerCase().includes(nombreTemporal.trim().toLowerCase())
      );
      setSugerencias(coincidencias);
    } else {
      setSugerencias([]);
    }
  }, [nombreTemporal, clientes]);

  const buscarClientePorNombre = async (nombre) => {
    try {
      const res = await fetch(`http://localhost:5000/api/clientes/nombre/${encodeURIComponent(nombre)}`);
      if (res.ok) {
        const cliente = await res.json();
        if (cliente) {
          setFormData(prev => ({
            ...prev,
            domicilio: cliente.domicilio || "",
            localidad: cliente.localidad || "",
            telefonoParticular: cliente.telefonoParticular || "",
            telefonoEmergencia: cliente.telefonoEmergencia || "",
            domicilioTrabajo: cliente.domicilioTrabajo || "",
            telefonoTrabajo: cliente.telefonoTrabajo || "",
            email: cliente.email || "",
            marca: cliente.marca || "",
            modelo: cliente.modelo || "",
            color: cliente.color || "",
            anio: cliente.anio || "",
            companiaSeguro: cliente.companiaSeguro || "",
            metodoPago: cliente.metodoPago || "",
            factura: cliente.factura || "",
            dniCuitCuil: cliente.dniCuitCuil || "",
            precioAbono: cliente.precioAbono || ""
          }));
        }
      }
    } catch (error) {
      console.error("Error buscando cliente:", error);
    }
  };

  const seleccionarCliente = (cliente) => {
    setFormData({
      ...formData,
      nombreApellido: cliente.nombreApellido,
      domicilio: cliente.domicilio || "",
      localidad: cliente.localidad || "",
      telefonoParticular: cliente.telefonoParticular || "",
      telefonoEmergencia: cliente.telefonoEmergencia || "",
      domicilioTrabajo: cliente.domicilioTrabajo || "",
      telefonoTrabajo: cliente.telefonoTrabajo || "",
      email: cliente.email || "",
      dniCuitCuil: cliente.dniCuitCuil || "",
      precioAbono: cliente.precioAbono || ""
    });
    setNombreTemporal(cliente.nombreApellido);
    setSugerencias([]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNombreChange = (e) => {
    const { value } = e.target;
    setNombreTemporal(value);
    setFormData(prev => ({ ...prev, nombreApellido: value }));
    
    // Búsqueda con debounce
    const delayDebounce = setTimeout(() => {
      if (value.trim().length >= 3) {
        buscarClientePorNombre(value);
      }
    }, 800);

    return () => clearTimeout(delayDebounce);
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (name === 'fotoSeguro') setFotoSeguro(file);
    if (name === 'fotoDNI') setFotoDNI(file);
    if (name === 'fotoCedulaVerde') setFotoCedulaVerde(file);
    if (name === 'fotoCedulaAzul') setFotoCedulaAzul(file);
  };

  const fileUploaded = {
    fotoSeguro: !!fotoSeguro,
    fotoDNI: !!fotoDNI,
    fotoCedulaVerde: !!fotoCedulaVerde,
    fotoCedulaAzul: !!fotoCedulaAzul,
  };

  const renderFileInput = (label, name) => (
    <div className="file-inputt-wrapper">
      <label className="file-visible-label">{label}</label>
      <label className="file-label">
        <div className="icon-wrapper">📷</div>
        {fileUploaded[name] ? (
          <div className="file-uploaded">✅</div>
        ) : (
          <div className="file-text">
            <span>Seleccionar</span>
            <span>Imagen</span>
          </div>
        )}
        <input type="file" name={name} accept="image/*" onChange={handleFileChange} />
      </label>
    </div>
  );

  const validarPatente = (patente) => {
    const formatoViejo = /^[A-Z]{3}\d{3}$/;
    const formatoNuevo = /^[A-Z]{2}\d{3}[A-Z]{2}$/;
    return formatoViejo.test(patente) || formatoNuevo.test(patente);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validación patente (mayúsculas y formato)
      const patente = formData.patente.toUpperCase();
      if (!validarPatente(patente)) {
        alert('❌ Patente no válida. Debe ser en formato ABC123 (viejo) o AB123CD (nuevo).');
        setLoading(false);
        return;
      }
      formData.patente = patente;

      // Verificamos tipo de vehículo
      const tipoVehiculo = formData.tipoVehiculo;
      if (!tipoVehiculo) {
        alert('Debe seleccionar tipo de vehículo');
        setLoading(false);
        return;
      }

      // Paso 1: Obtener precio mensual del tipo de vehículo
      const precioMensual = precios[tipoVehiculo]?.mensual || 0;

      // Paso 2: Buscar vehículo por patente
      const vehiculoRes = await fetch(`http://localhost:5000/api/vehiculos/${encodeURIComponent(formData.patente)}`);
      let vehiculo = null;
      let vehiculoData = null;

      if (!vehiculoRes.ok) {
        vehiculoData = null;
      } else {
        vehiculoData = await vehiculoRes.json();
      }

      if (!vehiculoRes.ok || (vehiculoData && vehiculoData.msg === "Vehículo no encontrado")) {
        // Crear vehículo si no existe
        const nuevoVehiculoRes = await fetch('http://localhost:5000/api/vehiculos/sin-entrada', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patente: formData.patente,
            tipoVehiculo: formData.tipoVehiculo,
            abonado: false,
            turno: false
          }),
        });

        let nuevoVehiculoJson = null;
        try {
          nuevoVehiculoJson = await nuevoVehiculoRes.json();
        } catch {
          alert('❌ No se pudo interpretar la respuesta al crear el vehículo.');
          setLoading(false);
          return;
        }

        if (!nuevoVehiculoJson || !nuevoVehiculoJson._id) {
          // Retry para ver si ya está creado
          await new Promise(resolve => setTimeout(resolve, 500));
          const retryVehiculoRes = await fetch(`http://localhost:5000/api/vehiculos/${encodeURIComponent(formData.patente)}`);
          if (!retryVehiculoRes.ok) {
            alert('❌ El vehículo no se creó correctamente y no se encontró en el retry. No se continuará con el proceso.');
            setLoading(false);
            return;
          }
          const retryVehiculoJson = await retryVehiculoRes.json();
          if (!retryVehiculoJson || !retryVehiculoJson._id) {
            alert('❌ El vehículo no se creó correctamente y no se encontró en el retry. No se continuará con el proceso.');
            setLoading(false);
            return;
          }
          vehiculo = retryVehiculoJson;
        } else {
          vehiculo = nuevoVehiculoJson;
        }
      } else {
        vehiculo = vehiculoData;
      }

      // Paso 3: Buscar cliente
      const clientesRes = await fetch('http://localhost:5000/api/clientes');
      if (!clientesRes.ok) throw new Error('Error al obtener clientes');
      const clientes = await clientesRes.json();
      const clienteExistente = clientes.find(
        c => c.nombreApellido.trim().toLowerCase() === formData.nombreApellido.trim().toLowerCase()
      );

      let clienteId;
      if (clienteExistente) {
        clienteId = clienteExistente._id;
        
        // Actualizar cliente existente con los nuevos datos
        await fetch(`http://localhost:5000/api/clientes/${clienteExistente._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            nombreApellido: formData.nombreApellido,
            dniCuitCuil: formData.dniCuitCuil,
            domicilio: formData.domicilio,
            localidad: formData.localidad,
            telefonoParticular: formData.telefonoParticular,
            telefonoEmergencia: formData.telefonoEmergencia,
            domicilioTrabajo: formData.domicilioTrabajo,
            telefonoTrabajo: formData.telefonoTrabajo,
            email: formData.email,
            tipoVehiculo: formData.tipoVehiculo,
            precioAbono: formData.tipoVehiculo
          }),
        });
      } else {
        // Crear nuevo cliente
        const nuevoClienteRes = await fetch('http://localhost:5000/api/clientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombreApellido: formData.nombreApellido,
            dniCuitCuil: formData.dniCuitCuil,
            domicilio: formData.domicilio,
            localidad: formData.localidad,
            telefonoParticular: formData.telefonoParticular,
            telefonoEmergencia: formData.telefonoEmergencia,
            domicilioTrabajo: formData.domicilioTrabajo,
            telefonoTrabajo: formData.telefonoTrabajo,
            email: formData.email,
            precioAbono: formData.tipoVehiculo
          }),
        });
        if (!nuevoClienteRes.ok) throw new Error('Error al crear cliente');
        const nuevoCliente = await nuevoClienteRes.json();
        if (!nuevoCliente._id) throw new Error('No se pudo crear cliente');
        clienteId = nuevoCliente._id;
      }

      // Paso 4: Registrar abono
      const abonoFormData = new FormData();

      for (const key in formData) {
        if (formData[key]) {
          abonoFormData.append(key, formData[key]);
        }
      }
      abonoFormData.set('patente', formData.patente.toUpperCase());
      abonoFormData.set('tipoVehiculo', formData.tipoVehiculo);
      abonoFormData.append('cliente', clienteId); // Asegurar que el clienteId se envía

      // Archivos fotos si existen
      if (fotoSeguro) abonoFormData.append('fotoSeguro', fotoSeguro);
      if (fotoDNI) abonoFormData.append('fotoDNI', fotoDNI);
      if (fotoCedulaVerde) abonoFormData.append('fotoCedulaVerde', fotoCedulaVerde);
      if (fotoCedulaAzul) abonoFormData.append('fotoCedulaAzul', fotoCedulaAzul);

      // Mandar el abono
      const abonoRes = await fetch('http://localhost:5000/api/abonos/registrar-abono', {
        method: 'POST',
        body: abonoFormData,
      });
      if (!abonoRes.ok) throw new Error('Error al registrar abono');

      // Obtener el precio desde el backend
      const abonoJson = await abonoRes.json();
      const precioCalculadoBackend = abonoJson.abono.precio;

      // Registrar movimiento
      const movimientoRes = await fetch('http://localhost:5000/api/movimientos/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patente: formData.patente,
          operador: user.nombre,
          tipoVehiculo: formData.tipoVehiculo,
          metodoPago: formData.metodoPago,
          factura: formData.factura || 'Sin factura',
          monto: precioCalculadoBackend,
          descripcion: `Pago Por Abono`,
          tipoTarifa: `abono`
        }),
      });
      if (!movimientoRes.ok) throw new Error('Error al registrar movimiento');

      // Registrar movimiento del cliente
      const movimientoClientePayload = {
        nombreApellido: formData.nombreApellido,
        email: formData.email,
        descripcion: `Abono`,
        monto: precioCalculadoBackend,
        tipoVehiculo: formData.tipoVehiculo,
        operador: user.nombre,
        patente: formData.patente,
      };
      const movimientoClienteRes = await fetch('http://localhost:5000/api/movimientosclientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movimientoClientePayload),
      });
      if (!movimientoClienteRes.ok) {
        const err = await movimientoClienteRes.json();
        throw new Error(`Error al registrar MovimientoCliente: ${err.message}`);
      }

      alert('✅ Abono registrado correctamente');

      // Resetear formulario y fotos
      setFormData({
        nombreApellido: '',
        dniCuitCuil: '',
        domicilio: '',
        localidad: '',
        telefonoParticular: '',
        telefonoEmergencia: '',
        domicilioTrabajo: '',
        telefonoTrabajo: '',
        email: '',
        patente: '',
        marca: '',
        modelo: '',
        color: '',
        anio: '',
        companiaSeguro: '',
        metodoPago: '',
        factura: '',
        tipoVehiculo: '',
      });
      setFotoSeguro(null);
      setFotoDNI(null);
      setFotoCedulaVerde(null);
      setFotoCedulaAzul(null);
      setNombreTemporal('');
      if (onClose) onClose();

    } catch (error) {
      console.error(error);
      alert('❌ ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="abono-form">
      <div className="form-section grid-2">
        <input 
            name="nombreApellido" 
            placeholder="Nombre y Apellido" 
            value={nombreTemporal} 
            onChange={handleNombreChange} 
            required 
        />
        <input name="dniCuitCuil" type="dniCuitCuil" placeholder="DNI/CUIT/CUIL" value={formData.dniCuitCuil} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
        <input name="domicilio" placeholder="Domicilio" value={formData.domicilio} onChange={handleChange} required />
        <input name="localidad" placeholder="Localidad" value={formData.localidad} onChange={handleChange} required />
        <input name="domicilioTrabajo" placeholder="Domicilio Trabajo" value={formData.domicilioTrabajo} onChange={handleChange} />
        <input name="telefonoParticular" placeholder="Tel. Particular" value={formData.telefonoParticular} onChange={handleChange} />
        <input name="telefonoEmergencia" placeholder="Tel. Emergencia" value={formData.telefonoEmergencia} onChange={handleChange} />
        <input name="telefonoTrabajo" placeholder="Tel. Trabajo" value={formData.telefonoTrabajo} onChange={handleChange} />
      </div>

      <div className="form-section image-row">
        {renderFileInput("Foto Seguro", "fotoSeguro")}
        {renderFileInput("Foto DNI", "fotoDNI")}
        {renderFileInput("Foto Céd. Verde", "fotoCedulaVerde")}
        {renderFileInput("Foto Céd. Azul", "fotoCedulaAzul")}
      </div>

      <div className="form-section grid-2">
        <input name="patente" placeholder="Patente" value={formData.patente} onChange={(e) => {const val = e.target.value.toUpperCase(); setFormData({...formData, patente: val}); }} required />
        <input name="marca" placeholder="Marca" value={formData.marca} onChange={handleChange} />
        <input name="modelo" placeholder="Modelo" value={formData.modelo} onChange={handleChange} />
        <input name="color" placeholder="Color" value={formData.color} onChange={handleChange} />
        <input name="anio" placeholder="Año" value={formData.anio} onChange={handleChange} />
        <input name="companiaSeguro" placeholder="Compañía de Seguro" value={formData.companiaSeguro} onChange={handleChange} />
      </div>

      <div className="form-section grid-3 compact-form">
        <div>
            <label className="sr-only">Tipo de Vehículo</label>
            <select
                name="tipoVehiculo"
                value={formData.tipoVehiculo}
                onChange={handleChange}
                required
                className="select-input"
            >
                <option value="" disabled hidden>Seleccionar...</option>
                {tiposVehiculo.map(tipo => (
                <option key={tipo} value={tipo}>
                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </option>
                ))}
            </select>
        </div>

        <div>
            <label className="sr-only">Método de Pago</label>
            <select
                name="metodoPago"
                value={formData.metodoPago}
                onChange={handleChange}
                required
                className="select-input"
            >
                <option value="" disabled hidden>Seleccione</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Débito">Débito</option>
                <option value="Crédito">Crédito</option>
                <option value="QR">QR</option>
            </select>
        </div>

        <div>
            <label className="sr-only">Factura</label>
            <select
                name="factura"
                value={formData.factura}
                onChange={handleChange}
                className="select-input"
            >
                <option value="" disabled hidden>Seleccionar...</option>
                <option value="CC">CC</option>
                <option value="A">A</option>
                <option value="Final">Final</option>
            </select>
        </div>
      </div>

      <div className="form-section">
        <button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Abono'}
        </button>
        <button type="button" onClick={onClose}>Cerrar</button>
      </div>
    </form>
  );
};

export default AbonoForm;