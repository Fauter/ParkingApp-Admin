import React, { useEffect, useState } from 'react';
import './Config.css';

const Config = () => {
  const [precios, setPrecios] = useState({
    auto: { hora: '', media: '', estadia: '' },
    camioneta: { hora: '', media: '', estadia: '' },
    moto: { hora: '', media: '', estadia: '' }
  });

  useEffect(() => {
    fetch('http://localhost:5000/api/precios')
      .then(res => res.json())
      .then(data => setPrecios(data))
      .catch(err => {
        console.error("❌ Error al cargar precios:", err);
      });
  }, []);

  const handleChange = (vehiculo, campo, valor) => {
    setPrecios(prev => ({
      ...prev,
      [vehiculo]: {
        ...prev[vehiculo],
        [campo]: valor
      }
    }));
  };

  const handleSave = (vehiculo) => {
    fetch(`http://localhost:5000/api/precios/${vehiculo}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(precios[vehiculo])
    })
      .then(res => res.json())
      .then(() => {
        alert(`✅ Precios actualizados para ${vehiculo}`);
      })
      .catch(err => {
        console.error(`❌ Error al actualizar precios de ${vehiculo}:`, err);
        alert('Hubo un error al guardar los precios.');
      });
  };

  const renderInputs = (vehiculo) => (
    <div className="vehiculo-config" key={vehiculo}>
      <h3>{vehiculo.charAt(0).toUpperCase() + vehiculo.slice(1)}</h3>
      <div className="config-field">
        <label>Por Hora ($)</label>
        <input
          type="number"
          value={precios[vehiculo].hora}
          onChange={(e) => handleChange(vehiculo, 'hora', Number(e.target.value))}
        />
      </div>
      <div className="config-field">
        <label>Media Estadía ($)</label>
        <input
          type="number"
          value={precios[vehiculo].media}
          onChange={(e) => handleChange(vehiculo, 'media', Number(e.target.value))}
        />
      </div>
      <div className="config-field">
        <label>Estadía Completa ($)</label>
        <input
          type="number"
          value={precios[vehiculo].estadia}
          onChange={(e) => handleChange(vehiculo, 'estadia', Number(e.target.value))}
        />
      </div>

      <button className="save-button" onClick={() => handleSave(vehiculo)}>
        Guardar Cambios
      </button>
    </div>
  );

  return (
    <div className="config-container">
      <h2 className="config-title">Configuración de Precios</h2>

      <div className="config-form">
        {['auto', 'camioneta', 'moto'].map(renderInputs)}
      </div>
    </div>
  );
};

export default Config;