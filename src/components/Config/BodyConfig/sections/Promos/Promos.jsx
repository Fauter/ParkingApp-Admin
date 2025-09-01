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
    fetch('https://api.garageia.com/api/promos')
      .then(res => res.json())
      .then(data => setPromos(data))
      .catch(err => console.error('Error al cargar promos:', err));
  };

  const abrirModalCrear = () => {
    setPromoForm({ nombre: '', descuento: '' });
    setShowModal(true);
  };

  // --- Helpers numéricos para descuento (solo dígitos) ---
  const soloDigitos = (str) => (str || '').replace(/[^\d]/g, '');
  const bloquearNoNumericos = (e) => {
    const invalid = ['e', 'E', '+', '-', '.', ',', ' '];
    if (invalid.includes(e.key)) e.preventDefault();
  };

  // Form modal: sanitiza descuento a solo dígitos
  const manejarCambioForm = (e) => {
    const { name, value } = e.target;
    if (name === 'descuento') {
      const limpio = soloDigitos(value);
      setPromoForm(prev => ({ ...prev, [name]: limpio }));
    } else {
      setPromoForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const guardarPromo = async () => {
    try {
      const body = {
        ...promoForm,
        descuento: Number(soloDigitos(promoForm.descuento || '0')),
      };
      await fetch('https://api.garageia.com/api/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
      await fetch(`https://api.garageia.com/api/promos/${id}`, { method: 'DELETE' });
      setPromos(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      console.error('Error eliminando promo:', err);
    }
  };

  // Editar inline
  const comenzarEdicion = (id, field) => setEditing({ id, field });

  const manejarCambioInline = (e, id, field) => {
    let value = e.target.value;
    if (field === 'descuento') {
      value = soloDigitos(value);
      setPromos(prev => prev.map(p => (p._id === id ? { ...p, [field]: Number(value) } : p)));
    } else {
      setPromos(prev => prev.map(p => (p._id === id ? { ...p, [field]: value } : p)));
    }
  };

  const guardarInline = async (id, promo) => {
    try {
      const body = { ...promo, descuento: Number(soloDigitos(String(promo.descuento ?? '0'))) };
      await fetch(`https://api.garageia.com/api/promos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setEditing({ id: null, field: null });
      cargarPromos();
    } catch (err) {
      console.error('Error actualizando promo:', err);
    }
  };

  const manejarKeyDown = (e, id, promo) => {
    if (e.key === 'Enter') guardarInline(id, promo);
    if (e.key === 'Escape') {
      cargarPromos();
      setEditing({ id: null, field: null });
    }
  };

  const manejarBlur = () => {
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
                        type="text"
                        inputMode="numeric"
                        pattern="\d*"
                        value={String(promo.descuento ?? '')}
                        onChange={e => manejarCambioInline(e, promo._id, 'descuento')}
                        onKeyDown={bloquearNoNumericos}
                        onBlur={manejarBlur}
                        className="promo-input"
                      />
                      <span className="porcentaje">% </span>
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

      <button className="promos-boton boton-crear" onClick={abrirModalCrear}>
        Crear Promo
      </button>

      {showModal && (
        <div className="modal-promo">
          <div className="modal-contenido-promo">
            <h3>Crear Promo</h3>

            {/* Nombre con wrapper para igualar medidas */}
            <div className="input-wrapper input-wrapper--modal">
              <input
                type="text"
                name="nombre"
                placeholder="Nombre"
                value={promoForm.nombre}
                onChange={manejarCambioForm}
                className="promo-input promo-input--boxed"
              />
            </div>

            {/* Descuento con % dentro y mismas medidas */}
            <div className="input-con-porcentaje input-con-porcentaje--modal">
              <input
                type="text"
                name="descuento"
                placeholder="Descuento"
                inputMode="numeric"
                pattern="\d*"
                min={0}
                max={100}
                step={1}
                value={promoForm.descuento}
                onChange={manejarCambioForm}
                onKeyDown={bloquearNoNumericos}
                className="promo-input promo-input--con-sufijo"
              />
              <span className="porcentaje porcentaje--modal">%</span>
            </div>

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
