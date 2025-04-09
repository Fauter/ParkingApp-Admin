import "./Filtros.css";

function Filtros({ filtros, setFiltros, activeTab, limpiarFiltros }) {
  const handleChange = (e) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value,
    });
  };

  const renderFiltrosPorTab = () => {
    if (activeTab === "Caja") {
      return (
        <>
          <div className="filtro-container">
            <label className="filtro-label">Operador</label>
            <select
              name="operador"
              className="filtro-select"
              onChange={handleChange}
              value={filtros.operador || ""}
            >
              <option value="">Todos</option>
              <option value="Carlos">Carlos</option>
              <option value="Diego">Diego</option>
            </select>
          </div>
  
          <div className="filtro-container">
            <label className="filtro-label">Método de Pago</label>
            <select
              name="metodoPago"
              className="filtro-select"
              onChange={handleChange}
              value={filtros.metodoPago || ""}
            >
              <option value="">Todos</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Débito">Débito</option>
              <option value="Crédito">Crédito</option>
              <option value="QR">QR</option>
            </select>
          </div>
  
          <div className="filtro-container">
            <label className="filtro-label">Hora</label>
            <select
              name="hora"
              className="filtro-select"
              onChange={handleChange}
              value={filtros.hora || ""}
            >
              <option value="">Todas</option>
              <option value="0-3">00:00 - 03:00</option>
              <option value="3-6">03:00 - 06:00</option>
              <option value="6-9">06:00 - 09:00</option>
              <option value="9-12">09:00 - 12:00</option>
              <option value="12-15">12:00 - 15:00</option>
              <option value="15-18">15:00 - 18:00</option>
              <option value="18-21">18:00 - 21:00</option>
              <option value="21-24">21:00 - 00:00</option>
            </select>
          </div>
          <div className="filtro-container">
            <label className="filtro-label">Fecha</label>
            <input
              type="date"
              name="fecha"
              className="filtro-input"
              value={filtros.fecha}
              onChange={handleChange}
            />
          </div>
          <div className="filtro-container">
            <label className="filtro-label">Tipo de Vehículo</label>
            <select
              name="tipoVehiculo"
              className="filtro-select"
              onChange={handleChange}
              value={filtros.tipoVehiculo || ""}
            >
              <option value="">Todos</option>
              <option value="auto">Auto</option>
              <option value="camioneta">Camioneta</option>
              <option value="moto">Moto</option>
            </select>
          </div>
  
          <div className="filtro-container">
            <label className="filtro-label">Tipo de Movimiento</label>
            <select
              name="tipoMovimiento"
              className="filtro-select"
              onChange={handleChange}
              value={filtros.tipoMovimiento || ""}
            >
              <option value="">Todos</option>
              <option value="Por Hora">Por Hora</option>
              <option value="Media Estadía">Media Estadía</option>
              <option value="Estadía">Estadía</option>
            </select>
          </div>
  
          <button className="btn-limpiar" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </>
      );
    } else if (activeTab === "Ingresos") {
      return (
        <>
          <div className="filtro-container">
            <label className="filtro-label">Operador</label>
            <select
              name="operador"
              className="filtro-select"
              onChange={handleChange}
              value={filtros.operador || ""}
            >
              <option value="">Todos</option>
              <option value="Carlos">Carlos</option>
              <option value="Diego">Diego</option>
            </select>
          </div>
  
          <div className="filtro-container">
            <label className="filtro-label">Hora de Entrada</label>
            <select
              name="horaEntrada"
              className="filtro-select"
              onChange={handleChange}
              value={filtros.horaEntrada || ""}
            >
              <option value="">Todas</option>
              <option value="0-3">00:00 - 03:00</option>
              <option value="3-6">03:00 - 06:00</option>
              <option value="6-9">06:00 - 09:00</option>
              <option value="9-12">09:00 - 12:00</option>
              <option value="12-15">12:00 - 15:00</option>
              <option value="15-18">15:00 - 18:00</option>
              <option value="18-21">18:00 - 21:00</option>
              <option value="21-24">21:00 - 00:00</option>
            </select>
          </div>
  
          <div className="filtro-container">
            <label className="filtro-label">Tipo de Vehículo</label>
            <select
              name="tipoVehiculo"
              className="filtro-select"
              onChange={handleChange}
              value={filtros.tipoVehiculo || ""}
            >
              <option value="">Todos</option>
              <option value="auto">Auto</option>
              <option value="camioneta">Camioneta</option>
              <option value="moto">Moto</option>
            </select>
          </div>
  
          <button className="btn-limpiar" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </>
      );
    }
  
    return null;
  };

  return (
    <div className="filtros">
      <div className="titleFiltros">Filtros - {activeTab}</div>
      {renderFiltrosPorTab()}
    </div>
  );
}

export default Filtros;