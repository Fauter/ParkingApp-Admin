import React, { useEffect, useState } from "react";
import "./Body.css"
import Filtros from "./Filtros/Filtros.jsx";
import Caja from "./Caja/Caja.jsx";

function Body() {
    const [activeTab, setActiveTab] = useState("Caja");
    const [movimientos, setMovimientos] = useState([]);
    const [filtros, setFiltros] = useState({
        patente: "",
        tipoVehiculo: "",
        metodoPago: "",
        operador: "",
        hora: "",
        tipoMovimiento: ""
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

    const movimientosFiltrados = movimientos.filter((mov) => {
        const horaMovimiento = new Date(mov.fecha).getHours();
        const [desde, hasta] = filtros.hora ? filtros.hora.split("-").map(Number) : [null, null];
    
        return (
          (!filtros.patente || mov.patente.toLowerCase().includes(filtros.patente.toLowerCase())) &&
          (!filtros.tipoVehiculo || mov.tipoVehiculo === filtros.tipoVehiculo) &&
          (!filtros.metodoPago || mov.metodoPago === filtros.metodoPago) &&
          (!filtros.operador || mov.operador.toLowerCase().includes(filtros.operador.toLowerCase())) &&
          (!filtros.hora || (horaMovimiento >= desde && horaMovimiento < hasta)) &&
          (!filtros.tipoMovimiento ||
            (filtros.tipoMovimiento === "Por Hora" && (!mov.tipoMovimiento || mov.tipoMovimiento.toLowerCase() === "por hora")) ||
            (mov.tipoMovimiento && mov.tipoMovimiento.toLowerCase() === filtros.tipoMovimiento.toLowerCase()))        );
    });
    
    const limpiarFiltros = () => {
        setFiltros({
            patente: "",
            tipoVehiculo: "",
            metodoPago: "",
            operador: "",
            hora: "",
            tipoMovimiento: ""
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
                />
            </div>
        </div>
    )
}

export default Body

