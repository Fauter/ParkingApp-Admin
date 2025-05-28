import React, { useEffect, useState } from 'react';
import './TabsAbonos.css';

const AbonoForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    nombreApellido: '',
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
    tarifaSeleccionada: '',
  });

  const [tarifas, setTarifas] = useState([]);
  const [fotoSeguro, setFotoSeguro] = useState(null);
  const [fotoDNI, setFotoDNI] = useState(null);
  const [fotoCedulaVerde, setFotoCedulaVerde] = useState(null);
  const [fotoCedulaAzul, setFotoCedulaAzul] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tiposVehiculo, setTiposVehiculo] = useState([]);


  // Carga tarifas abono
  useEffect(() => {
    fetch('https://api.garageia.com/api/tarifas')
      .then(res => res.json())
      .then(data => {
        const abonos = data.filter(tarifa => tarifa.tipo === 'abono');
        setTarifas(abonos);
      })
      .catch(err => {
        console.error('Error al cargar tarifas', err);
      });
  }, []);

  useEffect(() => {
    fetch('https://api.garageia.com/api/tipos-vehiculo')
      .then(res => res.json())
      .then(data => setTiposVehiculo(data))
      .catch(err => console.error('Error al cargar tipos de vehículo', err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    fotoSeguro,
    fotoDNI,
    fotoCedulaVerde,
    fotoCedulaAzul,
  };

  const renderFileInput = (label, name) => (
    <div className="file-input-wrapper">
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.tarifaSeleccionada) throw new Error('Debe seleccionar una tarifa');

      const tarifaObj = JSON.parse(formData.tarifaSeleccionada);

      const resPrecios = await fetch('https://api.garageia.com/api/precios');
      if (!resPrecios.ok) throw new Error('No se pudieron obtener los precios');

      const precios = await resPrecios.json();

      const tipoVehiculo = formData.tipoVehiculo;
      if (!tipoVehiculo) throw new Error('Debe seleccionar tipo de vehículo');

      let nombreTarifa = tarifaObj.nombre.toLowerCase();

      if (nombreTarifa.includes('mensual')) nombreTarifa = 'mensual';
      else if (nombreTarifa.includes('quincena')) nombreTarifa = 'quincena';
      else if (nombreTarifa.includes('semanal')) nombreTarifa = 'semanal';
      else if (nombreTarifa.includes('abono')) nombreTarifa = 'abono';
      else if (nombreTarifa.includes('día')) nombreTarifa = 'dia';

      const precioCalculado = precios[tipoVehiculo]?.[nombreTarifa];

      if (!precioCalculado) throw new Error(`No se encontró precio para ${tipoVehiculo} con tarifa ${nombreTarifa}`);

      const data = new FormData();

      for (const key in formData) {
        if (formData[key]) {
          if (key === 'tarifaSeleccionada') {
            data.append('tarifaSeleccionada', tarifaObj._id || JSON.stringify(tarifaObj));
          } else {
            data.append(key, formData[key]);
          }
        }
      }

      data.append('precio', precioCalculado);

      if (fotoSeguro) data.append('fotoSeguro', fotoSeguro);
      if (fotoDNI) data.append('fotoDNI', fotoDNI);
      if (fotoCedulaVerde) data.append('fotoCedulaVerde', fotoCedulaVerde);
      if (fotoCedulaAzul) data.append('fotoCedulaAzul', fotoCedulaAzul);

      const res = await fetch('https://api.garageia.com/api/abonos/registrar-abono', {
        method: 'POST',
        body: data,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Error desconocido al guardar abono');
      } else {
        // Crear movimiento (sin mostrar mensajes)
        try {
          await fetch('https://api.garageia.com/api/movimientos/registrar', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              patente: formData.patente,
              operador: 'Carlos',
              tipoVehiculo: formData.tipoVehiculo,
              metodoPago: formData.metodoPago,
              factura: formData.factura || 'Sin factura',
              monto: precioCalculado,
              descripcion: `Pago Por Abono (${tarifaObj.nombre})`,
              tipoTarifa: tarifaObj.nombre,
            }),
          });
        } catch (error) {
          console.error('Error al registrar movimiento:', error);
        }

        setFormData({
          nombreApellido: '',
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
          tarifaSeleccionada: '',
        });
        setFotoSeguro(null);
        setFotoDNI(null);
        setFotoCedulaVerde(null);
        setFotoCedulaAzul(null);
      }
    } catch (err) {
      console.error(err.message || 'Error al enviar datos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="abono-form">
      <div className="form-section">
        <label>Tipo de Abono:</label>
        <select
            name="tarifaSeleccionada"
            value={formData.tarifaSeleccionada}
            onChange={handleChange}
            required
        >
            <option value="" disabled hidden>Seleccioná una opción</option>
            {tarifas.map((tarifa) => (
            <option key={tarifa._id} value={JSON.stringify(tarifa)}>
                {tarifa.nombre} ({tarifa.dias} Días)
            </option>
            ))}
        </select>
      </div>

      <div className="form-section grid-2">
        <input name="nombreApellido" placeholder="Nombre y Apellido" value={formData.nombreApellido} onChange={handleChange} required />
        <input name="domicilio" placeholder="Domicilio" value={formData.domicilio} onChange={handleChange} required />
        <input name="localidad" placeholder="Localidad" value={formData.localidad} onChange={handleChange} required />
        <input name="domicilioTrabajo" placeholder="Domicilio Trabajo" value={formData.domicilioTrabajo} onChange={handleChange} />
        <input name="telefonoParticular" placeholder="Tel. Particular" value={formData.telefonoParticular} onChange={handleChange} />
        <input name="telefonoEmergencia" placeholder="Tel. Emergencia" value={formData.telefonoEmergencia} onChange={handleChange} />
        <input name="telefonoTrabajo" placeholder="Tel. Trabajo" value={formData.telefonoTrabajo} onChange={handleChange} />
        <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
      </div>

      <div className="form-section image-row">
        {renderFileInput("Foto Seguro", "fotoSeguro")}
        {renderFileInput("Foto DNI", "fotoDNI")}
        {renderFileInput("Foto Céd. Verde", "fotoCedulaVerde")}
        {renderFileInput("Foto Céd. Azul", "fotoCedulaAzul")}
      </div>

      <div className="form-section grid-2">
        <input name="patente" placeholder="Patente" value={formData.patente} onChange={handleChange} required />
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
                <option value="No">No</option>
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
