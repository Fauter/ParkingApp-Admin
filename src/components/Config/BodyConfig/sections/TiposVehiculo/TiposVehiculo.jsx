import React, { useEffect, useState } from 'react';
import './TiposVehiculo.css';

const API = 'https://apiprueba.garageia.com/api/tipos-vehiculo';

const TiposVehiculo = () => {
  const [tipos, setTipos] = useState([]);     // [{ nombre, hora, mensual }]
  const [selected, setSelected] = useState(null);
  const [editando, setEditando] = useState(null);
  const [nombreDraft, setNombreDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [nuevoTemporal, setNuevoTemporal] = useState(false);
  const [saving, setSaving] = useState(false);

  const normalizar = (t) => {
    if (typeof t === 'string') return { nombre: t, hora: false, mensual: false };
    return {
      nombre: t?.nombre ?? '',
      hora: !!t?.hora,
      mensual: !!t?.mensual,
    };
  };

  const fetchTipos = () => {
    fetch(API)
      .then(res => res.json())
      .then(data => {
        const lista = Array.isArray(data) ? data.map(normalizar) : [];
        setTipos(lista);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al obtener los tipos de vehículo:', err);
        setLoading(false);
      });
  };

  useEffect(() => { fetchTipos(); }, []);

  const handleSelect = (nombre) => {
    setSelected(nombre === selected ? null : nombre);
  };

  const capitalize = (text) => {
    if (typeof text !== 'string') return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const handleEliminar = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      const res = await fetch(`${API}/${encodeURIComponent(selected)}`, { method: 'DELETE' });
      setSaving(false);
      if (res.ok) {
        setTipos(prev => prev.filter(t => t.nombre !== selected));
        setSelected(null);
      } else {
        const data = await res.json();
        alert(data.msg || 'Error al eliminar');
      }
    } catch (err) {
      setSaving(false);
      console.error('Error al eliminar tipo:', err);
    }
  };

  const handleCrear = () => {
    const nombreTemporal = '---temp---' + Date.now();
    const nuevo = { nombre: nombreTemporal, hora: false, mensual: false };
    setTipos(prev => [...prev, nuevo]);
    setSelected(nombreTemporal);
    setEditando(nombreTemporal);
    setNombreDraft('');
    setNuevoTemporal(true);
  };

  const handleModificar = () => {
    if (!selected) return;
    setEditando(selected);
    const obj = tipos.find(t => t.nombre === selected);
    setNombreDraft(obj?.nombre || '');
  };

  const guardarModificacion = async () => {
    const nuevoNombre = nombreDraft.trim();
    const obj = tipos.find(t => t.nombre === editando);
    if (!obj) { setEditando(null); setNuevoTemporal(false); return; }

    if (nuevoNombre === '') {
      if (nuevoTemporal) setTipos(prev => prev.filter(t => t.nombre !== editando));
      setEditando(null);
      setNuevoTemporal(false);
      return;
    }

    try {
      setSaving(true);
      if (nuevoTemporal) {
        // Crear
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: nuevoNombre, hora: obj.hora, mensual: obj.mensual }),
        });
        const data = await res.json();
        setSaving(false);
        if (res.status === 201 || res.status === 200) {
          setTipos(prev => prev.map(t => (t.nombre === editando ? { ...t, nombre: nuevoNombre } : t)));
          setSelected(nuevoNombre);
        } else {
          alert(data.msg || 'Error al crear tipo');
          setTipos(prev => prev.filter(t => t.nombre !== editando));
        }
      } else {
        // Renombrar (también enviamos flags actuales para mantener coherencia)
        const res = await fetch(`${API}/${encodeURIComponent(editando)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nuevoNombre, hora: obj.hora, mensual: obj.mensual }),
        });
        const data = await res.json();
        setSaving(false);
        if (res.ok) {
          setTipos(prev => prev.map(t => (t.nombre === editando ? { ...t, nombre: nuevoNombre } : t)));
          setSelected(nuevoNombre);
        } else {
          alert(data.msg || 'Error al modificar tipo');
        }
      }
    } catch (err) {
      setSaving(false);
      console.error('Error al guardar tipo:', err);
    }

    setEditando(null);
    setNuevoTemporal(false);
  };

  const cancelarEdicion = () => {
    if (nuevoTemporal) setTipos(prev => prev.filter(t => t.nombre !== editando));
    setEditando(null);
    setNuevoTemporal(false);
  };

  // ✅ Toggle inmediato + persistencia (solo flags)
  const toggleFlag = async (nombre, key) => {
    const idx = tipos.findIndex(t => t.nombre === nombre);
    if (idx < 0) return;

    const current = tipos[idx];
    const updated = { ...current, [key]: !current[key] };
    setTipos(prev => prev.map((t, i) => (i === idx ? updated : t)));

    try {
      const res = await fetch(`${API}/${encodeURIComponent(nombre)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hora: updated.hora, mensual: updated.mensual }),
      });
      if (!res.ok) {
        // rollback
        setTipos(prev => prev.map((t, i) => (i === idx ? current : t)));
        const data = await res.json().catch(() => ({}));
        alert(data.msg || 'No se pudo guardar el cambio');
      }
    } catch (e) {
      console.error('No se pudo persistir el cambio de flag:', e);
      setTipos(prev => prev.map((t, i) => (i === idx ? current : t)));
    }
  };

  if (loading) return <p className="cargando">Cargando tipos de vehículo...</p>;

  return (
    <div className="layout">
      <div className="tipos-cuadro">
        {tipos.map((tipo) => {
          const seleccionado = selected === tipo.nombre;
          const enEdicion   = editando === tipo.nombre;

          return (
            <div
              key={tipo.nombre}
              className={`tipo-item ${seleccionado ? 'seleccionado' : ''}`}
              onClick={() => handleSelect(tipo.nombre)}
            >
              <div className="tipo-nombre">
                {enEdicion ? (
                  <input
                    type="text"
                    autoFocus
                    placeholder={nuevoTemporal ? 'Nuevo Tipo' : ''}
                    value={nombreDraft}
                    onChange={(e) => setNombreDraft(e.target.value)}
                    onBlur={guardarModificacion}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') guardarModificacion();
                      else if (e.key === 'Escape') cancelarEdicion();
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="nombre">{capitalize(tipo.nombre)}</span>
                )}
              </div>

              <div className="tipo-flags" onClick={(e) => e.stopPropagation()}>
                <label className="flag">
                  <input
                    type="checkbox"
                    checked={!!tipo.hora}
                    onChange={() => toggleFlag(tipo.nombre, 'hora')}
                  />
                  <span>Hora</span>
                </label>
                <label className="flag">
                  <input
                    type="checkbox"
                    checked={!!tipo.mensual}
                    onChange={() => toggleFlag(tipo.nombre, 'mensual')}
                  />
                  <span>Mensual</span>
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div className="acciones">
        <button className="btn accion" disabled={!selected || saving} onClick={handleModificar}>Modificar</button>
        <button className="btn accion" disabled={!selected || saving} onClick={handleEliminar}>Eliminar</button>
        <button className="btn crear"  disabled={saving} onClick={handleCrear}>Crear Nuevo</button>
      </div>
    </div>
  );
};

export default TiposVehiculo;
