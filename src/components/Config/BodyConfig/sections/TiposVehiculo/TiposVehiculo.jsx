import React, { useEffect, useState } from 'react';
import './TiposVehiculo.css';

const TiposVehiculo = () => {
  const [tipos, setTipos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editando, setEditando] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTipos = () => {
    fetch('http://localhost:5000/api/tipos-vehiculo')
      .then(res => res.json())
      .then(data => {
        setTipos(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al obtener los tipos de vehículo:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTipos();
  }, []);

  const handleSelect = (tipo) => {
    setSelected(tipo === selected ? null : tipo);
  };

  const capitalize = (text) =>
    text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

  const handleEliminar = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`http://localhost:5000/api/tipos-vehiculo/${selected}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTipos(tipos.filter(t => t !== selected));
        setSelected(null);
      } else {
        const data = await res.json();
        alert(data.msg || 'Error al eliminar');
      }
    } catch (err) {
      console.error('Error al eliminar tipo:', err);
    }
  };

  const handleCrear = async () => {
    const nuevoNombre = 'NuevoTipo';
    try {
      const res = await fetch(`http://localhost:5000/api/tipos-vehiculo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre: nuevoNombre }),
      });

      const data = await res.json();
      if (res.status === 201 || res.status === 200) {
        setTipos([...tipos, nuevoNombre]);
      } else {
        alert(data.msg || 'Error al crear tipo');
      }
    } catch (err) {
      console.error('Error al crear tipo:', err);
    }
  };

  const handleModificar = () => {
    if (!selected) return;
    setEditando(selected);
  };

  const guardarModificacion = async (nuevoNombre) => {
    if (!editando || nuevoNombre.trim() === '' || nuevoNombre === editando) {
      setEditando(null);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/tipos-vehiculo/${editando}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nuevoNombre }),
      });

      const data = await res.json();

      if (res.ok) {
        setTipos(tipos.map(t => (t === editando ? nuevoNombre : t)));
        setSelected(null);
      } else {
        alert(data.msg || 'Error al modificar tipo');
      }
    } catch (err) {
      console.error('Error al modificar tipo:', err);
    } finally {
      setEditando(null);
    }
  };

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
            {editando === tipo ? (
              <input
                type="text"
                autoFocus
                defaultValue={tipo}
                onBlur={(e) => guardarModificacion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') guardarModificacion(e.target.value);
                  else if (e.key === 'Escape') setEditando(null);
                }}
              />
            ) : (
              capitalize(tipo)
            )}
          </div>
        ))}
      </div>

      <div className="acciones">
        <button className="btn accion" disabled={!selected} onClick={handleModificar}>Modificar</button>
        <button className="btn accion" disabled={!selected} onClick={handleEliminar}>Eliminar</button>
        <button className="btn crear" onClick={handleCrear}>Crear Nuevo</button>
      </div>
    </div>
  );
};

export default TiposVehiculo;
