import React, { useEffect, useState } from "react";
import "./Body.css";
import Filtros from "./Filtros/Filtros.jsx";
import Caja from "./Caja/Caja.jsx";

function Body() {
  const [activeTab, setActiveTab] = useState("Caja");
  const [movimientos, setMovimientos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [filtros, setFiltros] = useState({
    patente: "",
    tipoVehiculo: "",
    metodoPago: "",
    operador: "",
    hora: "",
    tipoMovimiento: "",
    horaEntrada: "",
    fecha: "",
    fechaDesde: "",
    fechaHasta: ""
  });

  useEffect(() => {
    const fetchMovimientos = async () => {
      try {
        const response = await fetch("https://parkingapp-back.onrender.com/api/movimientos");
        const data = await response.json();
        setMovimientos(data);
      } catch (error) {
        console.error("Error al obtener movimientos:", error);
      }
    };

    fetchMovimientos();
    const interval = setInterval(fetchMovimientos, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchVehiculos = async () => {
      try {
        const response = await fetch("https://parkingapp-back.onrender.com/api/vehiculos");
        const data = await response.json();
        setVehiculos(data);
      } catch (error) {
        console.error("Error al obtener vehículos:", error);
      }
    };

    fetchVehiculos();
    const interval = setInterval(fetchVehiculos, 5000);
    return () => clearInterval(interval);
  }, []);

  // FILTRAR MOVIMIENTOS
  const movimientosFiltrados = movimientos.filter((mov) => {
    const horaMovimiento = new Date(mov.fecha).getHours();
    const [desde, hasta] = filtros.hora ? filtros.hora.split("-").map(Number) : [null, null];
  
    const fechaMovimiento = new Date(mov.fecha);
    const fechaMovimientoStr = fechaMovimiento.toLocaleDateString("sv-SE");
  
    const fechaDesdeDate = filtros.fechaDesde ? new Date(filtros.fechaDesde) : null;
    const fechaHastaDate = filtros.fechaHasta
      ? new Date(new Date(filtros.fechaHasta).setDate(new Date(filtros.fechaHasta).getDate() + 1))
      : null;
  
    return (
      (!filtros.patente || mov.patente.toLowerCase().includes(filtros.patente.toLowerCase())) &&
      (!filtros.tipoVehiculo || mov.tipoVehiculo === filtros.tipoVehiculo) &&
      (!filtros.metodoPago || mov.metodoPago === filtros.metodoPago) &&
      (!filtros.operador || mov.operador.toLowerCase().includes(filtros.operador.toLowerCase())) &&
      (!filtros.hora || (horaMovimiento >= desde && horaMovimiento < hasta)) &&
      (!filtros.fecha || fechaMovimientoStr === filtros.fecha) &&
      (!filtros.fechaDesde || fechaMovimiento >= fechaDesdeDate) &&
      (!filtros.fechaHasta || fechaMovimiento < fechaHastaDate) &&
      (!filtros.tipoMovimiento || mov.tipoTarifa?.toLowerCase() === filtros.tipoMovimiento.toLowerCase())
    );
  });
  const vehiculosFiltrados = vehiculos
    .filter((veh) => veh.estadiaActual && veh.estadiaActual.entrada !== null)
    .filter((veh) => {
      const entradaDate = new Date(veh.estadiaActual.entrada);
      const salidaDate = veh.estadiaActual.salida ? new Date(veh.estadiaActual.salida) : null;
      const horaEntrada = entradaDate.getHours();
      const [desde, hasta] = filtros.horaEntrada ? filtros.horaEntrada.split("-").map(Number) : [null, null];
  
      const fechaDesdeDate = filtros.fechaDesde ? new Date(filtros.fechaDesde) : null;
      const fechaHastaDate = filtros.fechaHasta
        ? new Date(new Date(filtros.fechaHasta).setDate(new Date(filtros.fechaHasta).getDate() + 1))
        : null;
  
      return (
        (!filtros.operador || veh.estadiaActual.operador?.toLowerCase().includes(filtros.operador.toLowerCase())) &&
        (!filtros.horaEntrada || (horaEntrada >= desde && horaEntrada < hasta)) &&
        (!filtros.tipoVehiculo || veh.tipoVehiculo === filtros.tipoVehiculo) &&
        (!filtros.fechaDesde || entradaDate >= fechaDesdeDate) &&
        (!filtros.fechaHasta || (salidaDate ? salidaDate < fechaHastaDate : entradaDate < fechaHastaDate))
      );
  });

  const limpiarFiltros = () => {
    setFiltros({
      patente: "",
      tipoVehiculo: "",
      metodoPago: "",
      operador: "",
      hora: "",
      tipoMovimiento: "",
      horaEntrada: "",
      fecha: "",
      fechaDesde: "",
      fechaHasta: ""
    });
  };

  return (
    <div className="body">
      <div className="filtros-container">
        <Filtros
          filtros={filtros}
          setFiltros={setFiltros}
          activeTab={activeTab}
          limpiarFiltros={limpiarFiltros}
        />
      </div>
      <div className="caja-container">
        <Caja
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          movimientos={movimientosFiltrados}
          vehiculos={vehiculosFiltrados}
          limpiarFiltros={limpiarFiltros}
        />
      </div>
    </div>
  );
}

export default Body;
