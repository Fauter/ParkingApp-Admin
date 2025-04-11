import React, { useEffect, useState } from 'react';
import './Precios.css';

const Precios = () => {
  const [tarifas, setTarifas] = useState([]);
  const [tiposVehiculo, setTiposVehiculo] = useState([]);
  const [precios, setPrecios] = useState({}); 

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const tarifasRes = await fetch('http://localhost:5000/api/tarifas/');
        const tarifasData = await tarifasRes.json();
        setTarifas(tarifasData);

        const tiposRes = await fetch('http://localhost:5000/api/tipos-vehiculo');
        const tiposData = await tiposRes.json();
        setTiposVehiculo(tiposData);

        // Inicializar precios vacíos
        const preciosIniciales = {};
        tiposData.forEach(tipo => {
          preciosIniciales[tipo] = {};
          tarifasData.forEach(tarifa => {
            preciosIniciales[tipo][tarifa._id] = '';
          });
        });
        setPrecios(preciosIniciales);
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    };
    fetchDatos();
  }, []);

  const handleChange = (tipo, tarifaId, valor) => {
    setPrecios(prev => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        [tarifaId]: valor
      }
    }));
  };

  return (
    <div className="precios-container">
      <h2>Configuración de Precios</h2>
      <table className="precios-table" border="1" cellPadding="8">
        <thead>
          <tr>
            <th></th>
            {tarifas.map(tarifa => (
              <th key={tarifa._id}>{tarifa.nombre}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tiposVehiculo.map(tipo => (
            <tr key={tipo}>
              <th style={{ textAlign: 'left' }}>
                {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
              </th>
              {tarifas.map(tarifa => (
                <td key={tarifa._id}>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Precios;