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
        const tarifasRes = await fetch('https://api.garageia.com/api/tarifas/');
        const tarifasData = await tarifasRes.json();
        setTarifas(tarifasData);

        const tiposRes = await fetch('https://api.garageia.com/api/tipos-vehiculo');
        const tiposData = await tiposRes.json();
        setTiposVehiculo(tiposData);

        const preciosRes = await fetch('https://api.garageia.com/api/precios');
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
        const res = await fetch(`https://api.garageia.com/api/precios/${vehiculo}`, {
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

  const normalizar = (str) =>
    typeof str === 'string'
      ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      : '';

  const tiposTarifa = ['hora', 'turno', 'estadia', 'abono'];

  const formatPrecio = (precio) => {
    if (precio !== 'N/A' && precio !== undefined && precio !== null && precio !== '') {
      return new Intl.NumberFormat('es-AR', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(precio);
    }
    return 'N/A';
  };

  const renderTablaPorTipo = (tipoTarifa) => {
    // Para "abono", generamos una fila virtual "Mensual" sin depender de /api/tarifas
    const tarifasFiltradas =
      normalizar(tipoTarifa) === 'abono'
        ? [{ _id: 'virtual-abono-mensual', nombre: 'Mensual', tipo: 'abono' }]
        : tarifas.filter(t => normalizar(t.tipo) === normalizar(tipoTarifa));

    if (tarifasFiltradas.length === 0) return null;

    return (
      <div key={tipoTarifa} style={{ margin: '20px 0' }}>
        <h3 style={{ textAlign: 'center', fontWeight: 400 }}>
          Tarifas x {tipoTarifa.charAt(0).toUpperCase() + tipoTarifa.slice(1)}
        </h3>
        <table className="precios-table" border="1" cellPadding="8">
          <thead>
            <tr>
              <th></th>
              {tiposVehiculo.map(tipo => (
                <th key={tipo._id}>
                  {tipo.nombre
                    ? tipo.nombre.charAt(0).toUpperCase() + tipo.nombre.slice(1)
                    : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tarifasFiltradas.map(tarifa => {
              // El nombre de la tarifa (e.g. 'Hora', '4 Horas', 'Día', 'Mensual') define la clave en /precios (lowercase)
              const nombreTarifa = tarifa.nombre ? tarifa.nombre.toLowerCase() : '';
              return (
                <tr key={tarifa._id}>
                  <th style={{ textAlign: 'left' }}>{tarifa.nombre}</th>
                  {tiposVehiculo.map(tipo => {
                    const vehiculo = tipo.nombre ? tipo.nombre.toLowerCase() : '';
                    const esEditando =
                      editing.vehiculo === vehiculo && editing.tarifa === nombreTarifa;
                    const valor = precios[vehiculo]?.[nombreTarifa];

                    return (
                      <td
                        key={tipo._id}
                        onClick={() => handleCellClick(vehiculo, nombreTarifa)}
                        className={esEditando ? 'editing' : ''}
                        style={{ cursor: 'pointer' }}
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
                          <span className="precio-format">
                            {valor === undefined || valor === null || valor === ''
                              ? '—'
                              : `$${formatPrecio(valor)}`}
                          </span>
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
