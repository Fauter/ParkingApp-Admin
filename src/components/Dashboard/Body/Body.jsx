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
    hora: "", // hora del movimiento (createdAt/fecha)
    tipoMovimiento: "",
    horaEntrada: "", // hora de entrada (para Ingresos / Nueva Auditoría)
    fecha: "",
    fechaDesde: "",
    fechaHasta: "",
    // NUEVOS (para tabla Movimientos):
    horaEntradaMov: "", // hora de entrada de la estadía asociada al movimiento
    horaSalidaMov: "", // hora de salida de la estadía asociada al movimiento
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
    if (!op) return "";
    if (typeof op === "string") return op;
    if (typeof op === "object") {
      return op.nombre || op.name || op.username || op.email || "";
    }
    return String(op);
  };

  // ⚠️ Filtrado de movimientos por campos del movimiento
  const movimientosFiltrados = movimientos.filter((mov) => {
    const base = mov.movimiento || mov; // <-- fallback inteligente

    const patente = base.patente || "";
    const tipoVehiculo = base.tipoVehiculo || "";
    const metodoPago = base.metodoPago || "";
    const tipoTarifa = base.tipoTarifa || "";

    const patenteMatch =
      !searchTerm || patente.toUpperCase().includes(searchTerm.toUpperCase());

    const d = getMovDate(mov);
    const horaMovimiento = d ? d.getHours() : null;

    const [desdeH, hastaH] = filtros.hora
      ? filtros.hora.split("-").map(Number)
      : [null, null];

    const fechaMovimientoStr = d ? d.toLocaleDateString("sv-SE") : null;

    const fechaDesdeDate = filtros.fechaDesde ? new Date(filtros.fechaDesde) : null;

    const fechaHastaDate = filtros.fechaHasta
      ? new Date(
          new Date(filtros.fechaHasta).setDate(
            new Date(filtros.fechaHasta).getDate() + 1
          )
        )
      : null;

    const opTxt = operadorTexto(base.operador).toLowerCase();
    const filtroOp = (filtros.operador || "").toLowerCase();

    return (
      // Patente
      patenteMatch &&
      // Tipo de Vehículo
      (!filtros.tipoVehiculo ||
        tipoVehiculo.toLowerCase() === filtros.tipoVehiculo.toLowerCase()) &&
      // Método de Pago
      (!filtros.metodoPago ||
        metodoPago.toLowerCase() === filtros.metodoPago.toLowerCase()) &&
      // Operador
      (!filtros.operador || (opTxt && opTxt.includes(filtroOp))) &&
      // Hora
      (!filtros.hora ||
        (horaMovimiento !== null &&
          horaMovimiento >= desdeH &&
          horaMovimiento < hastaH)) &&
      // Fecha exacta
      (!filtros.fecha ||
        (fechaMovimientoStr && fechaMovimientoStr === filtros.fecha)) &&
      // Rango desde
      (!filtros.fechaDesde || (d && d >= fechaDesdeDate)) &&
      // Rango hasta
      (!filtros.fechaHasta || (d && d < fechaHastaDate)) &&
      // Tipo de Tarifa (Tipo de Movimiento)
      (!filtros.tipoMovimiento ||
        (tipoTarifa &&
          tipoTarifa.toLowerCase() === filtros.tipoMovimiento.toLowerCase()))
    );
  });

  const vehiculosFiltrados = vehiculos
    .filter((veh) => veh.estadiaActual?.entrada && !veh.estadiaActual?.salida)
    .filter((veh) => {
      const patenteMatch =
        !searchTerm ||
        (veh.patente || "").toUpperCase().includes(searchTerm.toUpperCase());
      const horaEntrada = veh.estadiaActual?.entrada
        ? new Date(veh.estadiaActual.entrada).getHours()
        : null;
      const [desde, hasta] = filtros.horaEntrada
        ? filtros.horaEntrada.split("-").map(Number)
        : [null, null];
      const fechaDesdeDate = filtros.fechaDesde
        ? new Date(filtros.fechaDesde)
        : null;
      const fechaHastaDate = filtros.fechaHasta
        ? new Date(
            new Date(filtros.fechaHasta).setDate(
              new Date(filtros.fechaHasta).getDate() + 1
            )
          )
        : null;
      const operadorMatch =
        !filtros.operador ||
        (veh.estadiaActual?.operadorNombre || "")
          .toLowerCase()
          .includes((filtros.operador || "").toLowerCase());

      return (
        patenteMatch &&
        operadorMatch &&
        (!filtros.tipoVehiculo || veh.tipoVehiculo === filtros.tipoVehiculo) &&
        (!filtros.horaEntrada ||
          (horaEntrada !== null && horaEntrada >= desde && horaEntrada < hasta)) &&
        (!filtros.fechaDesde ||
          (veh.estadiaActual?.entrada &&
            new Date(veh.estadiaActual.entrada) >= fechaDesdeDate)) &&
        (!filtros.fechaHasta ||
          (veh.estadiaActual?.entrada &&
            new Date(veh.estadiaActual.entrada) < fechaHastaDate))
      );
    });

  const alertasFiltradas = alertas.filter((alerta) => {
    const horaAlerta = alerta.hora ? parseInt(alerta.hora.split(":")[0]) : null;
    const fechaAlerta = alerta.fecha ? new Date(alerta.fecha) : null;

    const [desdeHora, hastaHora] = filtros.hora
      ? filtros.hora.split("-").map(Number)
      : [null, null];

    const fechaDesde = filtros.fechaDesde ? new Date(filtros.fechaDesde) : null;
    const fechaHasta = filtros.fechaHasta
      ? new Date(
          new Date(filtros.fechaHasta).setDate(
            new Date(filtros.fechaHasta).getDate() + 1
          )
        )
      : null;

    const operadorMatch =
      !filtros.operador ||
      (alerta.operador || "")
        .toLowerCase()
        .includes((filtros.operador || "").toLowerCase());

    const searchMatch =
      !searchTerm ||
      (alerta.tipoDeAlerta || "")
        .toUpperCase()
        .includes(searchTerm.toUpperCase()) ||
      (alerta.operador || "")
        .toUpperCase()
        .includes(searchTerm.toUpperCase());

    return (
      searchMatch &&
      operadorMatch &&
      (!filtros.hora ||
        (horaAlerta !== null &&
          horaAlerta >= desdeHora &&
          horaAlerta < hastaHora)) &&
      (!filtros.fecha || alerta.fecha === filtros.fecha) &&
      (!filtros.fechaDesde ||
        (fechaAlerta && fechaAlerta >= fechaDesde)) &&
      (!filtros.fechaHasta ||
        (fechaAlerta && fechaAlerta < fechaHasta))
    );
  });

  const incidentesFiltrados = incidentes.filter((incidente) => {
    const fechaYHora =
      incidente.fecha && incidente.hora
        ? new Date(`${incidente.fecha}T${incidente.hora}:00`)
        : null;
    const horaIncidente = fechaYHora ? fechaYHora.getHours() : null;
    const [desde, hasta] = filtros.hora
      ? filtros.hora.split("-").map(Number)
      : [null, null];
    const fechaDesdeDate = filtros.fechaDesde
      ? new Date(filtros.fechaDesde)
      : null;
    const fechaHastaDate = filtros.fechaHasta
      ? new Date(
          new Date(filtros.fechaHasta).setDate(
            new Date(filtros.fechaHasta).getDate() + 1
          )
        )
      : null;
    const operadorMatch =
      !filtros.operador ||
      (incidente.operador || "")
        .toLowerCase()
        .includes((filtros.operador || "").toLowerCase());

    return (
      (!searchTerm ||
        (incidente.texto || "")
          .toUpperCase()
          .includes(searchTerm.toUpperCase()) ||
        (incidente.operador || "")
          .toUpperCase()
          .includes(searchTerm.toUpperCase())) &&
      operadorMatch &&
      (!filtros.hora ||
        (horaIncidente !== null &&
          horaIncidente >= desde &&
          horaIncidente < hasta)) &&
      (!filtros.fecha || incidente.fecha === filtros.fecha) &&
      (!filtros.fechaDesde ||
        (fechaYHora && fechaYHora >= fechaDesdeDate)) &&
      (!filtros.fechaHasta ||
        (fechaYHora && fechaYHora < fechaHastaDate))
    );
  });

  const limpiarFiltrosFn = () => {
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
      horaSalidaMov: "",
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
    if (
      auditoriaRef.current &&
      typeof auditoriaRef.current.imprimirListadoAuditoria === "function"
    ) {
      auditoriaRef.current.imprimirListadoAuditoria();
    }
  };

  // NUEVO: Imprimir en Cierre (A Retirar / Retirado / Parciales)
  const handlePrintCierreClick = () => {
    if (
      cierreRef.current &&
      typeof cierreRef.current.imprimirListadoCierre === "function"
    ) {
      cierreRef.current.imprimirListadoCierre();
    }
  };

  // ============================
  // NUEVO: TOTAL DE MOVIMIENTOS
  // ============================
  const calcularTotalMovimientos = () => {
    // Siempre sobre movimientosFiltrados (lo que ve el usuario en "Caja / Movimientos" + filtros + búsqueda)
    return movimientosFiltrados.reduce((acc, mov) => {
      const base = mov.movimiento || mov;
      const monto = typeof base.monto === "number" ? base.monto : 0;
      return acc + monto;
    }, 0);
  };

  const formatCurrency = (value) => {
    const num = Number.isFinite(value) ? value : 0;
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const descripcionRangoHora = (r) => {
    if (!r) return "";
    const mapa = {
      "0-3": "00:00 - 03:00",
      "3-6": "03:00 - 06:00",
      "6-9": "06:00 - 09:00",
      "9-12": "09:00 - 12:00",
      "12-15": "12:00 - 15:00",
      "15-18": "15:00 - 18:00",
      "18-21": "18:00 - 21:00",
      "21-24": "21:00 - 00:00",
    };
    return mapa[r] || r;
  };

  const formatFechaCampo = (yyyyMMdd) => {
    if (!yyyyMMdd) return "";
    const [y, m, d] = yyyyMMdd.split("-");
    if (!y || !m || !d) return yyyyMMdd;
    return `${d}/${m}/${y}`;
  };

  const formatTipoTarifa = (tipo) => {
    switch ((tipo || "").toLowerCase()) {
      case "hora":
        return "Hora";
      case "estadia":
        return "Estadía";
      case "turno":
        return "Anticipado";
      case "abono":
        return "Abono";
      default:
        return tipo;
    }
  };

  // ============================
  // NUEVO: IMPRIMIR LISTA MOVS
  // ============================
  const handlePrintMovimientosClick = () => {
    const lista = [...movimientosFiltrados].sort((a, b) => {
      const da = getMovDate(a)?.getTime() || 0;
      const db = getMovDate(b)?.getTime() || 0;
      return db - da; // descendente
    });

    const total = lista.reduce((acc, mov) => {
      const base = mov.movimiento || mov;
      const monto = typeof base.monto === "number" ? base.monto : 0;
      return acc + monto;
    }, 0);

    const filtrosActivos = [];

    if (searchTerm) {
      filtrosActivos.push(`Patente contiene: "${searchTerm.toUpperCase()}"`);
    }
    if (filtros.operador) {
      filtrosActivos.push(`Operador: ${filtros.operador}`);
    }
    if (filtros.metodoPago) {
      filtrosActivos.push(`Método de pago: ${filtros.metodoPago}`);
    }
    if (filtros.tipoVehiculo) {
      filtrosActivos.push(`Tipo de vehículo: ${filtros.tipoVehiculo}`);
    }
    if (filtros.tipoMovimiento) {
      filtrosActivos.push(
        `Tipo de tarifa: ${formatTipoTarifa(filtros.tipoMovimiento)}`
      );
    }
    if (filtros.hora) {
      filtrosActivos.push(
        `Hora del movimiento: ${descripcionRangoHora(filtros.hora)}`
      );
    }
    if (filtros.horaEntrada) {
      filtrosActivos.push(
        `Hora de entrada (Ingresos/Auditoría): ${descripcionRangoHora(
          filtros.horaEntrada
        )}`
      );
    }
    if (filtros.horaEntradaMov) {
      filtrosActivos.push(
        `Hora de entrada de estadía (Movimientos): ${descripcionRangoHora(
          filtros.horaEntradaMov
        )}`
      );
    }
    if (filtros.horaSalidaMov) {
      filtrosActivos.push(
        `Hora de salida de estadía (Movimientos): ${descripcionRangoHora(
          filtros.horaSalidaMov
        )}`
      );
    }
    if (filtros.fecha) {
      filtrosActivos.push(
        `Fecha exacta: ${formatFechaCampo(filtros.fecha)}`
      );
    }
    if (filtros.fechaDesde || filtros.fechaHasta) {
      const desde = filtros.fechaDesde
        ? formatFechaCampo(filtros.fechaDesde)
        : "inicio";
      const hasta = filtros.fechaHasta
        ? formatFechaCampo(filtros.fechaHasta)
        : "hoy";
      filtrosActivos.push(`Rango de fechas: ${desde} → ${hasta}`);
    }

    const filtrosHtml =
      filtrosActivos.length === 0
        ? `<p class="small"><strong>Filtros activos:</strong> Sin filtros activos (mostrando todos los movimientos).</p>`
        : `<div class="filters">
            <strong>Filtros activos:</strong>
            <ul>
              ${filtrosActivos.map((f) => `<li>${f}</li>`).join("")}
            </ul>
          </div>`;

    const rowsHtml =
      lista.length === 0
        ? `<tr><td colspan="8" style="text-align:center;padding:8px;">No hay movimientos para los filtros seleccionados.</td></tr>`
        : lista
            .map((mov) => {
              const base = mov.movimiento || mov;
              const fecha = getMovDate(mov);
              const fechaStr = fecha
                ? fecha.toLocaleString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "---";

              const monto = typeof base.monto === "number" ? base.monto : 0;

              return `
              <tr>
                <td>${(base.patente || "").toUpperCase() || "---"}</td>
                <td>${fechaStr}</td>
                <td>${operadorTexto(base.operador) || "---"}</td>
                <td>${base.tipoVehiculo || "---"}</td>
                <td>${base.metodoPago || "---"}</td>
                <td>${base.factura || "---"}</td>
                <td>${formatTipoTarifa(base.tipoTarifa) || "---"}</td>
                <td style="text-align:right;">${
                  monto === 0 ? "---" : formatCurrency(monto)
                }</td>
              </tr>
            `;
            })
            .join("");

    const totalHtml = formatCurrency(total);

    const styles = `
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        h1 {
          margin-bottom: 0;
        }
        .small {
          font-size: 11px;
          color: #666;
        }
        .filters {
          margin: 8px 0 16px 0;
          font-size: 12px;
        }
        .filters ul {
          margin: 4px 0 0 18px;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          font-size: 12px;
        }
        th, td {
          border: 1px solid #ccc;
          padding: 4px 6px;
          text-align: left;
        }
        th {
          background: #f0f0f0;
        }
        tfoot td {
          font-weight: bold;
        }
      </style>
    `;

    const now = new Date();
    const ahoraStr = now.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charSet="utf-8" />
          <title>Listado de movimientos</title>
          ${styles}
        </head>
        <body>
          <h1>Listado de movimientos - Caja</h1>
          <p class="small">Generado: ${ahoraStr}</p>
          ${filtrosHtml}
          <table>
            <thead>
              <tr>
                <th>Patente</th>
                <th>Fecha / Hora</th>
                <th>Operador</th>
                <th>Tipo de Vehículo</th>
                <th>Método de Pago</th>
                <th>Factura</th>
                <th>Tipo de Tarifa</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="7" style="text-align:right;">Total:</td>
                <td style="text-align:right;">${totalHtml}</td>
              </tr>
            </tfoot>
          </table>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `;

    const win = window.open("", "_blank");
    if (!win) return; // popup bloqueado
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="body">
      <div className="filtros-container">
        <Filtros
          filtros={filtros}
          setFiltros={setFiltros}
          activeTab={activeTab}
          activeCajaTab={activeCajaTab}
          limpiarFiltros={limpiarFiltrosFn}
          // 👉 para Movimientos (Caja):
          onPrintList={handlePrintMovimientosClick}
          onCalcularTotal={calcularTotalMovimientos}
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
            limpiarFiltros={limpiarFiltrosFn}
            isSearchBarVisible={isSearchBarVisible}
            // ➕ Pasamos filtros para aplicar horaEntradaMov/horaSalidaMov dentro de Caja
            filtros={filtros}
          />
        )}

        {activeTab === "Cierre" && (
          <CierreDeCajaAdmin
            ref={cierreRef}
            activeCajaTab={activeCajaTab}
            searchTerm={searchTerm}
            onCajaTabChange={setActiveCajaTab}
            aRetirar={
              activeCajaTab === "A Retirar"
                ? movimientosFiltrados.filter((m) => m.estadoRetiro === "pendiente")
                : []
            }
            retirado={
              activeCajaTab === "Retirado"
                ? movimientosFiltrados.filter((m) => m.estadoRetiro === "retirado")
                : []
            }
            parciales={
              activeCajaTab === "Parciales"
                ? movimientosFiltrados.filter((m) => m.estadoRetiro === "parcial")
                : []
            }
            cierresDeCaja={cierresDeCaja}
            limpiarFiltros={limpiarFiltrosFn}
            filtros={filtros}
          />
        )}

        {activeTab === "Auditoria" && (
          <Auditoria
            activeCajaTab={activeCajaTab}
            searchTerm={searchTerm}
            onCajaTabChange={setActiveCajaTab}
            limpiarFiltros={limpiarFiltrosFn}
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
