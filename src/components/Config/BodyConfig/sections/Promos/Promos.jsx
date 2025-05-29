import React from 'react';
import './Promos.css';

const Promos = () => {
  // Datos dummy para mostrar ejemplo
  const promos = [
    { id: 1, nombre: 'Promo Verano', descuento: 15 },
    { id: 2, nombre: 'Promo Fin de Año', descuento: 20 },
    { id: 3, nombre: 'Promo Black Friday', descuento: 25 },
  ];

  return (
    <div className="promos-container">
      <h2>Promociones</h2>
      <table className="promos-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descuento (%)</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {promos.map(({ id, nombre, descuento }) => (
            <tr key={id}>
              <td>{nombre}</td>
              <td>{descuento}</td>
              <td>
                <button className="promos-boton boton-editar">Editar</button>
                <button className="promos-boton boton-eliminar">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="promos-boton boton-crear">Crear Promo</button>
    </div>
  );
};

export default Promos;
