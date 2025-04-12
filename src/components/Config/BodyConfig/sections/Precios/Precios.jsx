import React, { useEffect, useState } from 'react';
import './Precios.css';

const Precios = () => {
  const [tarifas, setTarifas] = useState([]);
  const [tiposVehiculo, setTiposVehiculo] = useState([]);
  const [precios, setPrecios] = useState({});
  const [editing, setEditing] = useState({}); // { vehiculo, tarifa, value }

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const tarifasRes = await fetch('http://localhost:5000/api/tarifas/');
        const tarifasData = await tarifasRes.json();
        setTarifas(tarifasData);

        const tiposRes = await fetch('http://localhost:5000/api/tipos-vehiculo');
        const tiposData = await tiposRes.json();
        setTiposVehiculo(tiposData);

        const preciosRes = await fetch('http://localhost:5000/api/precios');
        const preciosData = await preciosRes.json();
        setPrecios(preciosData);
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    };

    fetchDatos();
  }, []);

  const handleCellClick = (vehiculo, tarifa) => {
    const valorActual = precios[vehiculo]?.[tarifa] ?? '';
    setEditing({ vehiculo, tarifa, value: valorActual });
  };

  const handleInputChange = (e) => {
    setEditing(prev => ({ ...prev, value: e.target.value }));
  };

  const handleInputKeyDown = async (e, vehiculo) => {
    if (e.key === 'Enter') {
      const { tarifa, value } = editing;
      const valorNumerico = parseFloat(value);

      if (isNaN(valorNumerico)) {
        alert('Debe ingresar un número válido.');
        return;
      }

      const nuevosPreciosVehiculo = {
        ...precios[vehiculo],
        [tarifa]: valorNumerico,
      };

      try {
        const res = await fetch(`http://localhost:5000/api/precios/${vehiculo}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevosPreciosVehiculo),
        });

        if (!res.ok) {
          throw new Error('Error al actualizar precio');
        }

        setPrecios(prev => ({
          ...prev,
          [vehiculo]: nuevosPreciosVehiculo,
        }));

        setEditing({});
      } catch (error) {
        console.error('Error al actualizar:', error);
      }
    } else if (e.key === 'Escape') {
      setEditing({});
    }
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
          {tiposVehiculo.map(tipo => {
            const vehiculo = tipo.toLowerCase();

            return (
              <tr key={vehiculo}>
                <th style={{ textAlign: 'left' }}>
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </th>
                {tarifas.map(tarifa => {
                  const nombreTarifa = tarifa.nombre.toLowerCase();
                  const esEditando =
                    editing.vehiculo === vehiculo && editing.tarifa === nombreTarifa;
                  const valor = precios[vehiculo]?.[nombreTarifa] ?? 'N/A';

                  return (
                    <td
                      key={tarifa._id}
                      onClick={() => handleCellClick(vehiculo, nombreTarifa)}
                      style={{ cursor: 'pointer' }}
                    >
                      {esEditando ? (
                        <input
                          type="number"
                          autoFocus
                          value={editing.value}
                          onChange={handleInputChange}
                          onKeyDown={(e) => handleInputKeyDown(e, vehiculo)}
                          onBlur={() => setEditing({})}
                          style={{ width: '70px' }}
                        />
                      ) : (
                        valor
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Precios;
