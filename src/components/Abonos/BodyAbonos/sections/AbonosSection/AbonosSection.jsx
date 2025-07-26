import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AbonosSection.css';

const AbonosSection = ({ viewMode }) => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const fetchClientes = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/clientes');
      if (!res.ok) throw new Error("Error al cargar clientes");
      const data = await res.json();
      setClientes(data);
    } catch (error) {
      console.error('Error al obtener los clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  // Si venimos con location.state.recargar, recargamos la lista
  useEffect(() => {
    if (location.state?.recargar) {
      fetchClientes();
      // Para evitar recarga infinita
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // También refrescar cada 5 segundos para datos actualizados
  useEffect(() => {
    const interval = setInterval(() => {
      fetchClientes();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRowClick = (cliente) => {
    navigate(`/detalle/${cliente._id}`);
  };

  const clientesFiltrados = clientes
    // .filter((cliente) => cliente.abonos && cliente.abonos.length > 0)
    .filter((cliente) => {
      const termino = busqueda.toLowerCase();
      return (
        cliente.nombreApellido.toLowerCase().includes(termino) ||
        cliente.vehiculos?.some((v) => v.patente.toLowerCase().includes(termino))
      );
  });

  return (
    <div className="abonos-container">
      <div className="search-cliente-container">
        <div className="search-cliente-input-container">
          <div className="search-cliente-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
            </svg>
          </div>
          <input
            type="text"
            className="search-cliente-input"
            placeholder="Buscar por nombre o patente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p>Cargando clientes...</p>
      ) : (
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
            {clientesFiltrados.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', fontStyle: 'italic' }}>
                  No existen clientes abonados.
                </td>
              </tr>
            ) : (
              clientesFiltrados.map((cliente) => (
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
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AbonosSection;