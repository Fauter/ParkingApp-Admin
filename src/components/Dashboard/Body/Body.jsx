import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import "./Body.css";
import Filtros from "./Filtros/Filtros.jsx";
import Caja from "./Caja/Caja.jsx";
import CierreDeCajaAdmin from "./CierreDeCajaAdmin/CierreDeCajaAdmin.jsx";
import Auditoria from "./AuditoriaAdmin/AuditoriaAdmin.jsx";
import Tabs from "./Tabs/Tabs.jsx";

function Body() {
  const location = useLocation();
  const auditoriaRef = useRef();

  const [activeTab, setActiveTab] = useState("Caja");
  const [activeCajaTab, setActiveCajaTab] = useState("Caja");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);

  const [movimientos, setMovimientos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [incidentes, setIncidentes] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [cierresDeCaja, setCierresDeCaja] = useState([]);
  const [auditorias, setAuditorias] = useState([]);

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
    if (location.pathname === "/cierresDeCaja") {
      setActiveTab("Cierre");
    } else if (location.pathname === "/auditoria") {
      setActiveTab("Auditoria");
    } else {
      setActiveTab("Caja");
    }
  }, [location.pathname]);

  useEffect(() => {
    if (activeTab === "Caja") {
      setActiveCajaTab("Caja");
    } else if (activeTab === "Cierre") {
      setActiveCajaTab("A Retirar");
    } else if (activeTab === "Auditoria") {
      setActiveCajaTab("Histórico");
    }
    setSearchTerm("");
  }, [activeTab]);

  useEffect(() => {
    const fetchData = async (endpoint, setState) => {
      try {
        const response = await fetch(`https://api.garageia.com/api/${endpoint}`);
        const data = await response.json();
        setState(data);
      } catch (error) {
        console.error(`Error al obtener ${endpoint}:`, error);
      }
    };

    fetchData("movimientos", setMovimientos);
    fetchData("vehiculos", setVehiculos);
    fetchData("incidentes", setIncidentes);
    fetchData("alertas", setAlertas);
    fetchData("cierresdecaja", setCierresDeCaja);
    fetchData("auditorias", setAuditorias);

    const interval = setInterval(() => {
      fetchData("movimientos", setMovimientos);
      fetchData("vehiculos", setVehiculos);
      fetchData("incidentes", setIncidentes);
      fetchData("alertas", setAlertas);
      fetchData("cierresdecaja", setCierresDeCaja);
      fetchData("auditorias", setAuditorias);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const movimientosFiltrados = movimientos.filter(mov => {
    const patenteMatch = !searchTerm || mov.patente.toUpperCase().includes(searchTerm.toUpperCase());
    const horaMovimiento = new Date(mov.fecha).getHours();
    const [desde, hasta] = filtros.hora ? filtros.hora.split("-").map(Number) : [null, null];
    const fechaMovimiento = new Date(mov.fecha);
    const fechaMovimientoStr = fechaMovimiento.toLocaleDateString("sv-SE");
    const fechaDesdeDate = filtros.fechaDesde ? new Date(filtros.fechaDesde) : null;
    const fechaHastaDate = filtros.fechaHasta
      ? new Date(new Date(filtros.fechaHasta).setDate(new Date(filtros.fechaHasta).getDate() + 1))
      : null;

    return (
      patenteMatch &&
      (!filtros.tipoVehiculo || mov.tipoVehiculo === filtros.tipoVehiculo) &&
      (!filtros.metodoPago || mov.metodoPago === filtros.metodoPago) &&
      (!filtros.operador || mov.operador.toLowerCase().includes(filtros.operador.toLowerCase())) &&
      (!filtros.hora || (horaMovimiento >= desde && horaMovimiento < hasta)) &&
      (!filtros.fecha || fechaMovimientoStr === filtros.fecha) &&
      (!filtros.fechaDesde || fechaMovimiento >= fechaDesdeDate) &&
      (!filtros.fechaHasta || fechaMovimiento < fechaHastaDate) &&
      (!filtros.tipoMovimiento || (mov.tipoTarifa && mov.tipoTarifa.toLowerCase() === filtros.tipoMovimiento.toLowerCase()))
    );
  });

  const vehiculosFiltrados = vehiculos
    .filter(veh => veh.estadiaActual?.entrada && !veh.estadiaActual?.salida)
    .filter(veh => {
      const patenteMatch = !searchTerm || veh.patente.toUpperCase().includes(searchTerm.toUpperCase());
      const horaEntrada = new Date(veh.estadiaActual.entrada).getHours();
      const [desde, hasta] = filtros.horaEntrada ? filtros.horaEntrada.split("-").map(Number) : [null, null];
      const fechaDesdeDate = filtros.fechaDesde ? new Date(filtros.fechaDesde) : null;
      const fechaHastaDate = filtros.fechaHasta
        ? new Date(new Date(filtros.fechaHasta).setDate(new Date(filtros.fechaHasta).getDate() + 1))
        : null;
      const operadorMatch = !filtros.operador || veh.estadiaActual.operadorNombre?.toLowerCase().includes(filtros.operador.toLowerCase());

      return (
        patenteMatch &&
        operadorMatch &&
        (!filtros.tipoVehiculo || veh.tipoVehiculo === filtros.tipoVehiculo) &&
        (!filtros.horaEntrada || (horaEntrada >= desde && horaEntrada < hasta)) &&
        (!filtros.fechaDesde || new Date(veh.estadiaActual.entrada) >= fechaDesdeDate) &&
        (!filtros.fechaHasta || new Date(veh.estadiaActual.entrada) < fechaHastaDate)
      );
  });
  const alertasFiltradas = alertas.filter(alerta => {
    const horaAlerta = alerta.hora ? parseInt(alerta.hora.split(':')[0]) : null;
    const fechaAlerta = alerta.fecha ? new Date(alerta.fecha) : null;
    
    const [desdeHora, hastaHora] = filtros.hora ? filtros.hora.split("-").map(Number) : [null, null];
    
    const fechaDesde = filtros.fechaDesde ? new Date(filtros.fechaDesde) : null;
    const fechaHasta = filtros.fechaHasta ? new Date(new Date(filtros.fechaHasta).setDate(new Date(filtros.fechaHasta).getDate() + 1)) : null;
    
    const operadorMatch = !filtros.operador || 
      (alerta.operador && alerta.operador.toLowerCase().includes(filtros.operador.toLowerCase()));
    
    const searchMatch = !searchTerm || 
      (alerta.tipoDeAlerta && alerta.tipoDeAlerta.toUpperCase().includes(searchTerm.toUpperCase())) || 
      (alerta.operador && alerta.operador.toUpperCase().includes(searchTerm.toUpperCase()));

    return (
      searchMatch &&
      operadorMatch &&
      (!filtros.hora || (horaAlerta !== null && horaAlerta >= desdeHora && horaAlerta < hastaHora)) &&
      (!filtros.fecha || (alerta.fecha === filtros.fecha)) &&
      (!filtros.fechaDesde || (fechaAlerta && fechaAlerta >= fechaDesde)) &&
      (!filtros.fechaHasta || (fechaAlerta && fechaAlerta < fechaHasta))
    );
  });
  const incidentesFiltrados = incidentes.filter(incidente => {
    const fechaYHora = incidente.fecha && incidente.hora ? new Date(`${incidente.fecha}T${incidente.hora}:00`) : null;
    const horaIncidente = fechaYHora ? fechaYHora.getHours() : null;
    const [desde, hasta] = filtros.hora ? filtros.hora.split("-").map(Number) : [null, null];
    const fechaDesdeDate = filtros.fechaDesde ? new Date(filtros.fechaDesde) : null;
    const fechaHastaDate = filtros.fechaHasta
      ? new Date(new Date(filtros.fechaHasta).setDate(new Date(filtros.fechaHasta).getDate() + 1))
      : null;
    const operadorMatch = !filtros.operador || (incidente.operador && incidente.operador.toLowerCase().includes(filtros.operador.toLowerCase()));

    return (
      (!searchTerm || 
      (incidente.texto && incidente.texto.toUpperCase().includes(searchTerm.toUpperCase())) ||
      (incidente.operador && incidente.operador.toUpperCase().includes(searchTerm.toUpperCase()))) &&
      operadorMatch &&
      (!filtros.hora || (horaIncidente !== null && horaIncidente >= desde && horaIncidente < hasta)) &&
      (!filtros.fecha || incidente.fecha === filtros.fecha) &&
      (!filtros.fechaDesde || (fechaYHora && fechaYHora >= fechaDesdeDate)) &&
      (!filtros.fechaHasta || (fechaYHora && fechaYHora < fechaHastaDate))
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
    setSearchTerm("");
    if (activeTab === "Caja") {
      setActiveCajaTab("Caja");
    } else if (activeTab === "Cierre") {
      setActiveCajaTab("A Retirar");
    } else if (activeTab === "Auditoria") {
      setActiveCajaTab("Histórico");
    }
  };

  const handleRegisterAuditClick = () => {
    if (auditoriaRef.current) {
      auditoriaRef.current.generarAuditoria();
    }
  };

  const handleAddVehicleClick = () => {
    if (auditoriaRef.current) {
      auditoriaRef.current.abrirModalAgregarVehiculo();
    }
  };

  return (
    <div className="body">
      <div className="filtros-container">
        <Filtros
          filtros={filtros}
          setFiltros={setFiltros}
          activeTab={activeTab}
          activeCajaTab={activeCajaTab}
          limpiarFiltros={limpiarFiltros}
        />
      </div>

      <div className="contenido-derecha">
        <Tabs
          activeTab={activeTab}
          activeCajaTab={activeCajaTab}
          onCajaTabChange={setActiveCajaTab}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSearchBarVisibilityChange={setIsSearchBarVisible}
          onRegisterAuditClick={handleRegisterAuditClick}
          onAddVehicleClick={handleAddVehicleClick}
        />

        {activeTab === "Caja" && (
          <Caja
            activeCajaTab={activeCajaTab}
            movimientos={movimientosFiltrados}
            vehiculos={vehiculosFiltrados}
            alertas={alertasFiltradas}
            incidentes={incidentesFiltrados}
            limpiarFiltros={limpiarFiltros}
            isSearchBarVisible={isSearchBarVisible} 
          />
        )}

        {activeTab === "Cierre" && (
          <CierreDeCajaAdmin
            activeCajaTab={activeCajaTab}
            searchTerm={searchTerm}
            onCajaTabChange={setActiveCajaTab}
            aRetirar={activeCajaTab === "A Retirar" ? movimientosFiltrados.filter(m => m.estadoRetiro === "pendiente") : []}
            retirado={activeCajaTab === "Retirado" ? movimientosFiltrados.filter(m => m.estadoRetiro === "retirado") : []}
            parciales={activeCajaTab === "Parciales" ? movimientosFiltrados.filter(m => m.estadoRetiro === "parcial") : []}
            cierresDeCaja={cierresDeCaja} 
            limpiarFiltros={limpiarFiltros}
            filtros={filtros}
          />
        )}

        {activeTab === "Auditoria" && (
          <Auditoria
            activeCajaTab={activeCajaTab}
            searchTerm={searchTerm}
            onCajaTabChange={setActiveCajaTab}
            limpiarFiltros={limpiarFiltros}
            filtros={filtros}
            auditorias={auditorias} 
            vehiculos={vehiculosFiltrados}
            ref={auditoriaRef}
          />
        )}
      </div>
    </div>
  );
}

export default Body;