// AbonosSection.jsx (antes Abonoes.jsx)
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AbonosSection.css'; // cambia el css si querés, o mantenelo igual

const AbonosSection = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await fetch('https://api.garageia.com/api/clientes');
        const data = await res.json();
        setClientes(data);
      } catch (error) {
        console.error('Error al obtener los clientes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, []);

  const handleRowClick = (cliente) => {
    localStorage.setItem('clienteSeleccionado', JSON.stringify(cliente));
    navigate('/detalle');
  };

  if (loading) return <p>Cargando clientes...</p>;

  return (
    <div className="abonos-container">
      <table className="abonos-table">
        <thead>
          <tr>
            <th>Nombre y Apellido</th>
            <th>Vehículos</th>
            <th>Patentes</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente) => (
            <tr
              key={cliente._id}
              onClick={() => handleRowClick(cliente)}
              style={{ cursor: 'pointer' }}
            >
              <td>{cliente.nombreApellido}</td>
              <td>{cliente.vehiculos?.length || 0}</td>
              <td>
                {cliente.vehiculos?.length > 0
                  ? cliente.vehiculos.map((v) => v.patente).join(', ')
                  : '—'}
              </td>
              <td style={{ color: cliente.balance < 0 ? 'red' : 'green' }}>
                ${cliente.balance.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AbonosSection;
