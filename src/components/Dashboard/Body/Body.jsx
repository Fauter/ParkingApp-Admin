import React, { useEffect, useState } from "react";
import "./Body.css"
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
        fecha: ""
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
    
      // Crear fechaHasta +1 día (para incluir todo el día seleccionado)
      const fechaHastaPlusOne = filtros.fechaHasta
        ? new Date(new Date(filtros.fechaHasta).setDate(new Date(filtros.fechaHasta).getDate() + 1))
        : null;
    
      return (
        (!filtros.patente || mov.patente.toLowerCase().includes(filtros.patente.toLowerCase())) &&
        (!filtros.tipoVehiculo || mov.tipoVehiculo === filtros.tipoVehiculo) &&
        (!filtros.metodoPago || mov.metodoPago === filtros.metodoPago) &&
        (!filtros.operador || mov.operador.toLowerCase().includes(filtros.operador.toLowerCase())) &&
        (!filtros.hora || (horaMovimiento >= desde && horaMovimiento < hasta)) &&
        (
          (!filtros.fecha || new Date(mov.fecha).toLocaleDateString("sv-SE") === filtros.fecha) &&
          (!filtros.fechaDesde || new Date(mov.fecha) >= new Date(filtros.fechaDesde)) &&
          (!filtros.fechaHasta || new Date(mov.fecha) < fechaHastaPlusOne)
        ) &&
        (
          !filtros.tipoMovimiento ||
          (filtros.tipoMovimiento === "Por Hora" && (!mov.tipoMovimiento || mov.tipoMovimiento.toLowerCase() === "por hora")) ||
          (filtros.tipoMovimiento === "Media Estadía" && mov.tipoMovimiento && mov.tipoMovimiento.toLowerCase() === "media estadía") ||
          (filtros.tipoMovimiento === "Estadía" && mov.tipoMovimiento && mov.tipoMovimiento.toLowerCase() === "estadía")
        )
      );
    });
    // FILTRAR VEHICULOS DENTRO
    const vehiculosFiltrados = vehiculos.filter((veh) => {
      const historial = veh.historialEstadias;
      if (!historial || historial.length === 0) return false;
    
      const ultimaEstadia = historial[historial.length - 1];
      if (!ultimaEstadia.entrada || ultimaEstadia.salida) return false;
    
      const entradaDate = new Date(ultimaEstadia.entrada);
      const salidaDate = ultimaEstadia.salida ? new Date(ultimaEstadia.salida) : null;
      const horaEntrada = entradaDate.getHours();
      const [desde, hasta] = filtros.horaEntrada ? filtros.horaEntrada.split("-").map(Number) : [null, null];
    
      // Filtrar por fecha desde
      const pasaFechaDesde = !filtros.fechaDesde || entradaDate >= new Date(filtros.fechaDesde);
    
      // Crear fechaHasta +1 día (para incluir todo el día seleccionado)
      const fechaHastaPlusOne = filtros.fechaHasta
        ? new Date(new Date(filtros.fechaHasta).setDate(new Date(filtros.fechaHasta).getDate() + 1))
        : null;
    
      // Filtrar por fecha hasta (considerando si la salida existe y usando fechaHastaPlusOne)
      const pasaFechaHasta =
        !filtros.fechaHasta ||
        (salidaDate ? salidaDate <= fechaHastaPlusOne : entradaDate <= fechaHastaPlusOne);
    
      const pasaOperador = !filtros.operador || ultimaEstadia.operador?.toLowerCase().includes(filtros.operador.toLowerCase());
      const pasaHora = !filtros.horaEntrada || (horaEntrada >= desde && horaEntrada < hasta);
      const pasaTipoVehiculo = !filtros.tipoVehiculo || veh.tipoVehiculo === filtros.tipoVehiculo;
    
      return pasaOperador && pasaHora && pasaTipoVehiculo && pasaFechaDesde && pasaFechaHasta;
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
            fecha: ""
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
    )
}

export default Body

