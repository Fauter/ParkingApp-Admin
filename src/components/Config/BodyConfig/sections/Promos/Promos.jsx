import React, { useState, useEffect, useRef } from 'react';
import './Promos.css';

const Promos = () => {
  const [promos, setPromos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [promoForm, setPromoForm] = useState({ nombre: '', descuento: '' });
  const [editing, setEditing] = useState({ id: null, field: null });
  const inputRef = useRef(null);

  useEffect(() => {
    cargarPromos();
  }, []);

  useEffect(() => {
    if (editing.id !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const cargarPromos = () => {
    fetch('http://localhost:5000/api/promos')
      .then(res => res.json())
      .then(data => setPromos(data))
      .catch(err => console.error('Error al cargar promos:', err));
  };

  const abrirModalCrear = () => {
    setPromoForm({ nombre: '', descuento: '' });
    setShowModal(true);
  };

  const manejarCambioForm = (e) => {
    const { name, value } = e.target;
    setPromoForm(prev => ({ ...prev, [name]: value }));
  };

  const guardarPromo = async () => {
    try {
      await fetch('http://localhost:5000/api/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promoForm),
      });
      cargarPromos();
      setShowModal(false);
    } catch (err) {
      console.error('Error guardando promo:', err);
    }
  };

  const eliminarPromo = async (id) => {
    const seguro = window.confirm('¿Seguro que querés borrar esta promo?');
    if (!seguro) return;

    try {
      await fetch(`http://localhost:5000/api/promos/${id}`, { method: 'DELETE' });
      setPromos(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      console.error('Error eliminando promo:', err);
    }
  };

  // Editar inline
  const comenzarEdicion = (id, field) => {
    setEditing({ id, field });
  };

  const manejarCambioInline = (e, id, field) => {
    const value = e.target.value;
    setPromos(prev =>
      prev.map(p => (p._id === id ? { ...p, [field]: field === 'descuento' ? Number(value) : value } : p))
    );
  };

  const guardarInline = async (id, promo) => {
    try {
      await fetch(`http://localhost:5000/api/promos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promo),
      });
      setEditing({ id: null, field: null });
      cargarPromos();
    } catch (err) {
      console.error('Error actualizando promo:', err);
    }
  };

  const manejarKeyDown = (e, id, promo) => {
    if (e.key === 'Enter') {
      guardarInline(id, promo);
    }
    if (e.key === 'Escape') {
      cargarPromos(); // revertir cambios
      setEditing({ id: null, field: null });
    }
  };

  const manejarBlur = () => {
    // Al perder foco cancelamos la edición (podrías cambiar por guardar si querés)
    setEditing({ id: null, field: null });
    cargarPromos();
  };

  return (
    <div className="promos-container">
      <h2 className="promos-title">Configuración de Promos</h2>
      <table className="promos-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descuento</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {promos.length === 0 ? (
            <tr><td colSpan={3}>No hay promociones</td></tr>
          ) : (
            promos.map(promo => (
              <tr key={promo._id}>
                <td
                  className={editing.id === promo._id && editing.field === 'nombre' ? 'editing' : ''}
                  onClick={() => comenzarEdicion(promo._id, 'nombre')}
                >
                  {editing.id === promo._id && editing.field === 'nombre' ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={promo.nombre}
                      onChange={e => manejarCambioInline(e, promo._id, 'nombre')}
                      onKeyDown={e => manejarKeyDown(e, promo._id, promo)}
                      onBlur={manejarBlur}
                      className="promo-input"
                    />
                  ) : (
                    promo.nombre
                  )}
                </td>
                <td
                  className={editing.id === promo._id && editing.field === 'descuento' ? 'editing' : ''}
                  onClick={() => comenzarEdicion(promo._id, 'descuento')}
                >
                  {editing.id === promo._id && editing.field === 'descuento' ? (
                    <div className="input-con-porcentaje">
                      <input
                        ref={inputRef}
                        type="number"
                        value={promo.descuento}
                        onChange={e => manejarCambioInline(e, promo._id, 'descuento')}
                        onKeyDown={e => manejarKeyDown(e, promo._id, promo)}
                        onBlur={manejarBlur}
                        className="promo-input"
                      />
                      <span className="porcentaje">%</span>
                    </div>
                  ) : (
                    `${promo.descuento}%`
                  )}
                </td>
                <td>
                  <button className="eliminar-promo-btn" onClick={() => eliminarPromo(promo._id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Botón Crear Promo abajo de la tabla */}
      <button className="promos-boton boton-crear" onClick={abrirModalCrear}>
        Crear Promo
      </button>

      {showModal && (
        <div className="modal-promo">
          <div className="modal-contenido-promo">
            <h3>Crear Promo</h3>
            <input
              type="text"
              name="nombre"
              placeholder="Nombre"
              value={promoForm.nombre}
              onChange={manejarCambioForm}
              className="promo-input"
            />
            <input
              type="number"
              name="descuento"
              placeholder="Descuento"
              value={promoForm.descuento}
              onChange={manejarCambioForm}
              className="promo-input"
            />
            <div className="modal-promo-botones">
              <button className="creacionBoton" onClick={guardarPromo}>
                Guardar
              </button>
              <button className="cancelarCreacionBoton" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Promos;
