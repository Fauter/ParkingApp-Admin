import React, { useEffect, useState } from 'react';
import './TiposVehiculo.css';

const TiposVehiculo = () => {
  const [tipos, setTipos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/vehiculos/tipos')
      .then(res => res.json())
      .then(data => {
        setTipos(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al obtener los tipos de vehículo:', err);
        setLoading(false);
      });
  }, []);

  const handleSelect = (tipo) => {
    setSelected(tipo === selected ? null : tipo);
  };

  const capitalize = (text) =>
    text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

  if (loading) return <p className="cargando">Cargando tipos de vehículo...</p>;

  return (
    <div className="layout">
      <div className="tipos-cuadro">
        {tipos.map((tipo, index) => (
          <div
            key={index}
            className={`tipo-item ${selected === tipo ? 'seleccionado' : ''}`}
            onClick={() => handleSelect(tipo)}
          >
            {capitalize(tipo)}
          </div>
        ))}
      </div>

      <div className="acciones">
        <button className="btn accion" disabled={!selected}>Modificar</button>
        <button className="btn accion" disabled={!selected}>Eliminar</button>
        <button className="btn crear">Crear Nuevo</button>
      </div>
    </div>
  );
};

export default TiposVehiculo;