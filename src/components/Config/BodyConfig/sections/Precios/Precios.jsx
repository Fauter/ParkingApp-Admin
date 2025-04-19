import React, { useEffect, useState } from 'react';
import './Precios.css';

const Precios = () => {
  const [tarifas, setTarifas] = useState([]);
  const [tiposVehiculo, setTiposVehiculo] = useState([]);
  const [precios, setPrecios] = useState({});
  const [editing, setEditing] = useState({});

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const tarifasRes = await fetch('https://parkingapp-back.onrender.com/api/tarifas/');
        const tarifasData = await tarifasRes.json();
        setTarifas(tarifasData);

        const tiposRes = await fetch('https://parkingapp-back.onrender.com/api/tipos-vehiculo');
        const tiposData = await tiposRes.json();
        setTiposVehiculo(tiposData);

        const preciosRes = await fetch('https://parkingapp-back.onrender.com/api/precios');
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
    setEditing({ vehiculo, tarifa, value: valorActual.toString() });
  };

  const formatPrecioLive = (value) => {
    const soloNumeros = value.replace(/\D/g, '');
    return soloNumeros
      ? new Intl.NumberFormat('es-AR').format(parseInt(soloNumeros))
      : '';
  };

  const handleInputChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setEditing(prev => ({ ...prev, value: rawValue }));
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
        const res = await fetch(`https://parkingapp-back.onrender.com/api/precios/${vehiculo}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevosPreciosVehiculo),
        });

        if (!res.ok) throw new Error('Error al actualizar precio');

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

  const normalizar = (str) => str?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const tiposTarifa = ['hora', 'turno', 'estadia', 'mensual'];

  const formatPrecio = (precio) => {
    if (precio !== 'N/A') {
      return new Intl.NumberFormat('es-AR', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(precio);
    }
    return precio;
  };

  const renderTablaPorTipo = (tipoTarifa) => {
    const tarifasFiltradas = tarifas.filter(t => normalizar(t.tipo) === normalizar(tipoTarifa));

    if (tarifasFiltradas.length === 0) return null;

    return (
      <div key={tipoTarifa} style={{ margin: '20px 0' }}>
        <h3 style={{ textAlign: 'center' }}>Tarifas x {tipoTarifa.charAt(0).toUpperCase() + tipoTarifa.slice(1)}</h3>
        <table className="precios-table" border="1" cellPadding="8">
          <thead>
            <tr>
              <th></th>
              {tiposVehiculo.map(tipo => (
                <th key={tipo}>{tipo.charAt(0).toUpperCase() + tipo.slice(1)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tarifasFiltradas.map(tarifa => {
              const nombreTarifa = tarifa.nombre.toLowerCase();
              return (
                <tr key={tarifa._id}>
                  <th style={{ textAlign: 'left' }}>
                    {tarifa.nombre}
                  </th>
                  {tiposVehiculo.map(tipo => {
                    const vehiculo = tipo.toLowerCase();
                    const esEditando =
                      editing.vehiculo === vehiculo && editing.tarifa === nombreTarifa;
                    const valor = precios[vehiculo]?.[nombreTarifa] ?? 'N/A';

                    return (
                      <td
                        key={vehiculo}
                        onClick={() => handleCellClick(vehiculo, nombreTarifa)}
                        className={esEditando ? 'editing' : ''}
                      >
                        {esEditando ? (
                          <div style={{ position: 'relative' }}>
                            <span className="input-prefix">$</span>
                            <input
                              type="text"
                              autoFocus
                              value={formatPrecioLive(editing.value)}
                              onChange={handleInputChange}
                              onKeyDown={(e) => handleInputKeyDown(e, vehiculo)}
                              onBlur={() => setEditing({})}
                              className="precio-input with-prefix"
                            />
                          </div>
                        ) : (
                          <span className="precio-format">{`$${formatPrecio(valor)}`}</span>
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

  return (
    <div className="precios-container">
      <h2>Configuración de Precios</h2>
      {tiposTarifa.map(renderTablaPorTipo)}
    </div>
  );
};

export default Precios;
