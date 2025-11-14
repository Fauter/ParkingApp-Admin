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
  const cierreRef = useRef(); // <-- NUEVO

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
    hora: "",              // hora del movimiento (createdAt/fecha)
    tipoMovimiento: "",
    horaEntrada: "",       // hora de entrada (para Ingresos / Nueva Auditoría)
    fecha: "",
    fechaDesde: "",
    fechaHasta: "",
    // NUEVOS (para tabla Movimientos):
    horaEntradaMov: "",    // hora de entrada de la estadía asociada al movimiento
    horaSalidaMov: ""      // hora de salida de la estadía asociada al movimiento
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
        const response = await fetch(`https://apiprueba.garageia.com/api/${endpoint}`);
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

  // ============================
  // Helpers de filtrado (MOVS)
  // ============================
  const getMovDate = (mov) => {
    const src = mov?.createdAt || mov?.fecha;
    return src ? new Date(src) : null;
  };

  const operadorTexto = (op) => {
    if (!op) return '';
    if (typeof op === 'string') return op;
    if (typeof op === 'object') {
      return op.nombre || op.name || op.username || op.email || '';
    }
    return String(op);
  };

  // ⚠️ Filtrado de movimientos por campos del movimiento
  const movimientosFiltrados = movimientos.filter(mov => {
    const patenteMatch = !searchTerm ||
      (mov?.patente ||
      mov?.movimiento?.patente ||
      '').toUpperCase().includes(searchTerm.toUpperCase());

    const d = getMovDate(mov);
    const horaMovimiento = d ? d.getHours() : null;

    const [desdeH, hastaH] = filtros.hora ? filtros.hora.split("-").map(Number) : [null, null];

    // Fecha exacta (YYYY-MM-DD local, usamos sv-SE para ISO local)
    const fechaMovimientoStr = d ? d.toLocaleDateString("sv-SE") : null;

    // Rango de fechas
    const fechaDesdeDate = filtros.fechaDesde ? new Date(filtros.fechaDesde) : null;
    const fechaHastaDate = filtros.fechaHasta
      ? new Date(new Date(filtros.fechaHasta).setDate(new Date(filtros.fechaHasta).getDate() + 1))
      : null;

    const opTxt = operadorTexto(mov.operador).toLowerCase();
    const filtroOp = (filtros.operador || '').toLowerCase();

    return (
      patenteMatch &&
      (!filtros.tipoVehiculo || mov.tipoVehiculo === filtros.tipoVehiculo) &&
      (!filtros.metodoPago || mov.metodoPago === filtros.metodoPago) &&
      (!filtros.operador || (opTxt && opTxt.includes(filtroOp))) &&
      (!filtros.hora || (horaMovimiento !== null && horaMovimiento >= desdeH && horaMovimiento < hastaH)) &&
      (!filtros.fecha || (fechaMovimientoStr && fechaMovimientoStr === filtros.fecha)) &&
      (!filtros.fechaDesde || (d && d >= fechaDesdeDate)) &&
      (!filtros.fechaHasta || (d && d < fechaHastaDate)) &&
      (!filtros.tipoMovimiento || (mov.tipoTarifa && mov.tipoTarifa.toLowerCase() === filtros.tipoMovimiento.toLowerCase()))
    );
  });

  const vehiculosFiltrados = vehiculos
    .filter(veh => veh.estadiaActual?.entrada && !veh.estadiaActual?.salida)
    .filter(veh => {
      const patenteMatch = !searchTerm || (veh.patente || '').toUpperCase().includes(searchTerm.toUpperCase());
      const horaEntrada = veh.estadiaActual?.entrada ? new Date(veh.estadiaActual.entrada).getHours() : null;
      const [desde, hasta] = filtros.horaEntrada ? filtros.horaEntrada.split("-").map(Number) : [null, null];
      const fechaDesdeDate = filtros.fechaDesde ? new Date(filtros.fechaDesde) : null;
      const fechaHastaDate = filtros.fechaHasta
        ? new Date(new Date(filtros.fechaHasta).setDate(new Date(filtros.fechaHasta).getDate() + 1))
        : null;
      const operadorMatch = !filtros.operador || (veh.estadiaActual?.operadorNombre || '').toLowerCase().includes((filtros.operador || '').toLowerCase());

      return (
        patenteMatch &&
        operadorMatch &&
        (!filtros.tipoVehiculo || veh.tipoVehiculo === filtros.tipoVehiculo) &&
        (!filtros.horaEntrada || (horaEntrada !== null && horaEntrada >= desde && horaEntrada < hasta)) &&
        (!filtros.fechaDesde || (veh.estadiaActual?.entrada && new Date(veh.estadiaActual.entrada) >= fechaDesdeDate)) &&
        (!filtros.fechaHasta || (veh.estadiaActual?.entrada && new Date(veh.estadiaActual.entrada) < fechaHastaDate))
      );
    });

  const alertasFiltradas = alertas.filter(alerta => {
    const horaAlerta = alerta.hora ? parseInt(alerta.hora.split(':')[0]) : null;
    const fechaAlerta = alerta.fecha ? new Date(alerta.fecha) : null;

    const [desdeHora, hastaHora] = filtros.hora ? filtros.hora.split("-").map(Number) : [null, null];

    const fechaDesde = filtros.fechaDesde ? new Date(filtros.fechaDesde) : null;
    const fechaHasta = filtros.fechaHasta ? new Date(new Date(filtros.fechaHasta).setDate(new Date(filtros.fechaHasta).getDate() + 1)) : null;

    const operadorMatch = !filtros.operador ||
      ((alerta.operador || '').toLowerCase().includes((filtros.operador || '').toLowerCase()));

    const searchMatch = !searchTerm ||
      ((alerta.tipoDeAlerta || '').toUpperCase().includes(searchTerm.toUpperCase())) ||
      ((alerta.operador || '').toUpperCase().includes(searchTerm.toUpperCase()));

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
    const fechaYHora = (incidente.fecha && incidente.hora) ? new Date(`${incidente.fecha}T${incidente.hora}:00`) : null;
    const horaIncidente = fechaYHora ? fechaYHora.getHours() : null;
    const [desde, hasta] = filtros.hora ? filtros.hora.split("-").map(Number) : [null, null];
    const fechaDesdeDate = filtros.fechaDesde ? new Date(filtros.fechaDesde) : null;
    const fechaHastaDate = filtros.fechaHasta
      ? new Date(new Date(filtros.fechaHasta).setDate(new Date(filtros.fechaHasta).getDate() + 1))
      : null;
    const operadorMatch = !filtros.operador || ((incidente.operador || '').toLowerCase().includes((filtros.operador || '').toLowerCase()));

    return (
      (!searchTerm ||
        ((incidente.texto || '').toUpperCase().includes(searchTerm.toUpperCase())) ||
        ((incidente.operador || '').toUpperCase().includes(searchTerm.toUpperCase()))) &&
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
      fechaHasta: "",
      horaEntradaMov: "",
      horaSalidaMov: ""
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

  // Imprimir listado de "Nueva Auditoría"
  const handlePrintAuditClick = () => {
    if (auditoriaRef.current && typeof auditoriaRef.current.imprimirListadoAuditoria === 'function') {
      auditoriaRef.current.imprimirListadoAuditoria();
    }
  };

  // NUEVO: Imprimir en Cierre (A Retirar / Retirado / Parciales)
  const handlePrintCierreClick = () => {
    if (cierreRef.current && typeof cierreRef.current.imprimirListadoCierre === 'function') {
      cierreRef.current.imprimirListadoCierre();
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
          onPrintAuditClick={handlePrintAuditClick}
          onPrintCierreClick={handlePrintCierreClick} // <-- NUEVO
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
            // ➕ Pasamos filtros para aplicar horaEntradaMov/horaSalidaMov dentro de Caja
            filtros={filtros}
          />
        )}

        {activeTab === "Cierre" && (
          <CierreDeCajaAdmin
            ref={cierreRef} // <-- NUEVO
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
