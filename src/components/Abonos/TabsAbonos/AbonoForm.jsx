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

  // ===== Helpers =====
  const formatARS = (n) => {
    if (typeof n !== 'number') return null;
    try {
      return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(n);
    } catch {
      return n?.toString() ?? '';
    }
  };

  // ===== Efectos de inicialización =====
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
    setFotoSeguro(null); setFotoDNI(null); setFotoCedulaVerde(null); setFotoCedulaAzul(null);
    setNombreTemporal('');
  }, []);

  useEffect(() => {
    fetch('https://api.garageia.com/api/tarifas')
      .then(res => res.json())
      .then(data => setTarifas((Array.isArray(data) ? data : []).filter(t => t.tipo === 'abono')))
      .catch(err => console.error('Error al cargar tarifas', err));
  }, []);

  useEffect(() => {
    // Tipos + Precios (para armar label "Tipo - $Precio")
    fetch('https://api.garageia.com/api/tipos-vehiculo')
      .then(res => res.json())
      .then(data => setTiposVehiculo(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error al cargar tipos de vehículo', err));

    fetch('https://api.garageia.com/api/precios')
      .then(res => res.json())
      .then(data => setPrecios(data || {}))
      .catch(err => console.error('Error al cargar precios', err));
  }, []);

  useEffect(() => {
    fetch('https://api.garageia.com/api/clientes')
      .then(res => res.json())
      .then(data => setClientes(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error al cargar clientes', err));
  }, []);

  useEffect(() => {
    if (nombreTemporal.trim().length >= 3) {
      const coincidencias = clientes.filter((c) =>
        (c.nombreApellido || "").toLowerCase().includes(nombreTemporal.trim().toLowerCase())
      );
      setSugerencias(coincidencias);
    } else {
      setSugerencias([]);
    }
  }, [nombreTemporal, clientes]);

  const buscarClientePorNombre = async (nombre) => {
    try {
      const res = await fetch(`https://api.garageia.com/api/clientes/nombre/${encodeURIComponent(nombre)}`);
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

  // ===== Handlers =====
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNombreChange = (e) => {
    const { value } = e.target;
    setNombreTemporal(value);
    setFormData(prev => ({ ...prev, nombreApellido: value }));
    const t = setTimeout(() => { if (value.trim().length >= 3) buscarClientePorNombre(value); }, 800);
    return () => clearTimeout(t);
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

  // ===== Submit =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const patente = (formData.patente || '').toUpperCase();
      if (!validarPatente(patente)) {
        alert('❌ Patente inválida. ABC123 o AB123CD.');
        setLoading(false);
        return;
      }
      if (!formData.tipoVehiculo) {
        alert('Debe seleccionar tipo de vehículo');
        setLoading(false);
        return;
      }

      // 1) Vehículo
      const vRes = await fetch(`https://api.garageia.com/api/vehiculos/${encodeURIComponent(patente)}`);
      let vehiculo = vRes.ok ? await vRes.json() : null;
      if (!vehiculo || vehiculo.msg === 'Vehículo no encontrado') {
        const nv = await fetch('https://api.garageia.com/api/vehiculos/sin-entrada', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patente,
            tipoVehiculo: formData.tipoVehiculo,
            abonado: false,
            turno: false
          }),
        });
        const nvJson = await nv.json().catch(() => null);
        if (!nv.ok || !nvJson?._id) {
          await new Promise(r => setTimeout(r, 300));
          const retry = await fetch(`https://api.garageia.com/api/vehiculos/${encodeURIComponent(patente)}`);
          if (!retry.ok) throw new Error('El vehículo no se creó correctamente.');
          vehiculo = await retry.json();
        } else {
          vehiculo = nvJson;
        }
      }

      // 2) Cliente
      const clientesRes = await fetch('https://api.garageia.com/api/clientes');
      if (!clientesRes.ok) throw new Error('Error al obtener clientes');
      const lista = await clientesRes.json();
      const clienteExistente = (Array.isArray(lista) ? lista : []).find(
        c => (c.nombreApellido || '').trim().toLowerCase() === (formData.nombreApellido || '').trim().toLowerCase()
      );

      let clienteId;
      if (clienteExistente) {
        clienteId = clienteExistente._id;
        // opcional: update básico
        await fetch(`https://api.garageia.com/api/clientes/${clienteId}`, {
          method: 'PUT',
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
            email: formData.email
          })
        }).catch(() => {});
      } else {
        const nuevoClienteRes = await fetch('https://api.garageia.com/api/clientes', {
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

      // 3) Registrar abono (ATÓMICO: incluye movimientos)
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => { if (v) fd.append(k, v); });
      fd.set('patente', patente);
      fd.set('tipoVehiculo', formData.tipoVehiculo);
      fd.append('cliente', clienteId);
      fd.append('operador', user?.nombre || 'Sistema');
      if (fotoSeguro) fd.append('fotoSeguro', fotoSeguro);
      if (fotoDNI) fd.append('fotoDNI', fotoDNI);
      if (fotoCedulaVerde) fd.append('fotoCedulaVerde', fotoCedulaVerde);
      if (fotoCedulaAzul) fd.append('fotoCedulaAzul', fotoCedulaAzul);

      const abonoRes = await fetch('https://api.garageia.com/api/abonos/registrar-abono', {
        method: 'POST',
        body: fd
      });
      if (!abonoRes.ok) throw new Error('Error al registrar abono');

      alert('✅ Abono registrado correctamente');

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
      setFotoSeguro(null); setFotoDNI(null); setFotoCedulaVerde(null); setFotoCedulaAzul(null);
      setNombreTemporal('');
      onClose && onClose();

    } catch (error) {
      console.error(error);
      alert('❌ ' + (error?.message || 'Error inesperado'));
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
          autoComplete="off"
        />
        {sugerencias.length > 0 && (
          <ul className="sugerencias-lista">
            {sugerencias.map((cliente) => (
              <li
                key={cliente._id}
                onClick={(e) => {
                  e.preventDefault();
                  seleccionarCliente(cliente);
                }}
                className="sugerencia-item"
              >
                {cliente.nombreApellido}
              </li>
            ))}
          </ul>
        )}

        <input name="dniCuitCuil" placeholder="DNI/CUIT/CUIL" value={formData.dniCuitCuil} onChange={handleChange} required />
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
        <input
          name="patente"
          placeholder="Patente"
          value={formData.patente}
          onChange={(e) => setFormData({...formData, patente: (e.target.value || '').toUpperCase()})}
          required
          maxLength={8}
        />
        <input name="marca" placeholder="Marca" value={formData.marca} onChange={handleChange} />
        <input name="modelo" placeholder="Modelo" value={formData.modelo} onChange={handleChange} />
        <input name="color" placeholder="Color" value={formData.color} onChange={handleChange} />
        <input name="anio" placeholder="Año" value={formData.anio} onChange={handleChange} />
        <input name="companiaSeguro" placeholder="Compañía de Seguro" value={formData.companiaSeguro} onChange={handleChange} />
      </div>

      {/* <<< AQUÍ van vertical: label arriba, select abajo >>> */}
      <div className="form-section grid-3 compact-form">
        <div className="field-vertical">
          <label>Tipo de Vehículo</label>
          <select
            name="tipoVehiculo"
            value={formData.tipoVehiculo}
            onChange={handleChange}
            required
            className="select-input"
          >
            <option value="" disabled hidden>Seleccionar...</option>
            {tiposVehiculo.map((tipo) => {
              const key = (tipo?.nombre || '').toLowerCase();
              const mensual = precios?.[key]?.mensual;
              const labelPrecio = typeof mensual === 'number' ? `$${formatARS(mensual)}` : 'N/A';
              const capitalized = tipo?.nombre ? (tipo.nombre.charAt(0).toUpperCase() + tipo.nombre.slice(1)) : '';
              return (
                <option key={tipo?.nombre || key} value={tipo?.nombre || ''}>
                  {capitalized} - {labelPrecio}
                </option>
              );
            })}
          </select>
        </div>

        <div className="field-vertical">
          <label>Método de Pago</label>
          <select
            name="metodoPago"
            value={formData.metodoPago}
            onChange={handleChange}
            required
            className="select-input"
          >
            <option value="" disabled hidden>Seleccione</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Débito">Débito</option>
            <option value="Crédito">Crédito</option>
            <option value="QR">QR</option>
          </select>
        </div>

        <div className="field-vertical">
          <label>Factura</label>
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
