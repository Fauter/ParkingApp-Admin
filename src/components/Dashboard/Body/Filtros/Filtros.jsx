import { useEffect, useState } from "react";
import "./Filtros.css";

function Filtros({
  filtros,
  setFiltros,
  activeTab,
  activeCajaTab,
  limpiarFiltros,
  onPrintList,
  onCalcularTotal, // callback que viene de Body.jsx
}) {
  const [tiposVehiculo, setTiposVehiculo] = useState([]);
  const [tiposTarifa, setTiposTarifa] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [totalCalculado, setTotalCalculado] = useState("");

  useEffect(() => {
    const fetchTiposVehiculo = async () => {
      try {
        const response = await fetch(
          "https://apiprueba.garageia.com/api/tipos-vehiculo"
        );
        const data = await response.json();
        setTiposVehiculo(data);
      } catch (error) {
        console.error("Error al obtener tipos de vehículo:", error);
      }
    };

    const fetchTiposTarifa = async () => {
      try {
        const response = await fetch(
          "https://apiprueba.garageia.com/api/tarifas"
        );
        const data = await response.json();
        const tiposUnicos = [...new Set(data.map((tarifa) => tarifa.tipo))];
        setTiposTarifa(tiposUnicos);
      } catch (error) {
        console.error("Error al obtener tipos de tarifa:", error);
      }
    };

    const fetchOperadores = async () => {
      try {
        const response = await fetch("https://apiprueba.garageia.com/api/auth");
        const data = await response.json();
        const nombresOperadores = [
          ...new Set(data.map((user) => user.nombre).filter(Boolean)),
        ];
        setOperadores(nombresOperadores);
      } catch (error) {
        console.error("Error al obtener operadores:", error);
      }
    };

    fetchTiposVehiculo();
    fetchTiposTarifa();
    fetchOperadores();
  }, []);

  // ==========================================
  // 🔥 RESET AUTOMÁTICO DEL TOTAL CUANDO CAMBIAN FILTROS
  // ==========================================
  useEffect(() => {
    setTotalCalculado(""); // limpia cuando cambia cualquier filtro
  }, [filtros]);

  const handleChange = (e) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value,
    });
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

  const formatCurrency = (value) => {
    const num = Number.isFinite(value) ? value : 0;
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleVerTotalClick = () => {
    if (typeof onCalcularTotal === "function") {
      const total = onCalcularTotal();
      if (total === null || total === undefined) {
        setTotalCalculado("");
      } else {
        setTotalCalculado(formatCurrency(total));
      }
    }
  };

  const renderSelectOperador = () => (
    <div className="filtro-container">
      <label className="filtro-label">Operador</label>
      <select
        name="operador"
        className="filtro-select"
        onChange={handleChange}
        value={filtros.operador || ""}
      >
        <option value="">Todos</option>
        {operadores.map((operador, i) => (
          <option key={i} value={operador}>
            {operador}
          </option>
        ))}
      </select>
    </div>
  );

  const rangoFecha = (
    <div className="filtro-fechas">
      <div className="fecha-item">
        <label className="filtro-label">Desde</label>
        <input
          type="date"
          name="fechaDesde"
          className="filtro-input"
          value={filtros.fechaDesde || ""}
          onChange={handleChange}
        />
      </div>
      <div className="fecha-item">
        <label className="filtro-label">Hasta</label>
        <input
          type="date"
          name="fechaHasta"
          className="filtro-input"
          value={filtros.fechaHasta || ""}
          onChange={handleChange}
        />
      </div>
    </div>
  );

  // ==========================================
  // BLOQUE EXCLUSIVO PARA Movimientos (Caja)
  // ==========================================
  const bloqueAccionesCaja = (
    <div className="bloque-acciones-caja">
      <div className="fila-acciones">
        <button className="btn-accion" onClick={handleVerTotalClick}>
          Ver Total
        </button>

        <button className="btn-accion" onClick={onPrintList}>
          Imprimir Lista
        </button>
      </div>

      <div className="total-texto">
        {totalCalculado ? `Total: ${totalCalculado}` : "Total: —"}
      </div>
    </div>
  );

  // ==========================================
  // LIMPIAR FILTROS → TAMBIÉN LIMPIA EL TOTAL
  // ==========================================
  const handleLimpiar = () => {
    limpiarFiltros();
    setTotalCalculado(""); // 🔥 resetea total
  };

  const renderFiltrosPorTab = () => {
    if (activeTab === "Caja" && activeCajaTab === "Caja") {
      return (
        <>
          {renderSelectOperador()}

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
              <option value="Transferencia">Transferencia</option>
              <option value="Débito">Débito</option>
              <option value="Crédito">Crédito</option>
              <option value="QR">QR</option>
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
              {tiposVehiculo.map((tipo, i) => (
                <option key={i} value={tipo?.nombre || ""}>
                  {(tipo?.nombre || "").charAt(0).toUpperCase() +
                    (tipo?.nombre || "").slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="filtro-container">
            <label className="filtro-label">Tipo de Tarifa</label>
            <select
              name="tipoMovimiento"
              className="filtro-select"
              onChange={handleChange}
              value={filtros.tipoMovimiento || ""}
            >
              <option value="">Todos</option>
              {tiposTarifa.map((tipo, i) => (
                <option key={i} value={tipo}>
                  {formatTipoTarifa(tipo)}
                </option>
              ))}
            </select>
          </div>

          <div className="filtro-container">
            <label className="filtro-label">Fecha exacta</label>
            <input
              type="date"
              name="fecha"
              className="filtro-input"
              value={filtros.fecha || ""}
              onChange={handleChange}
            />
          </div>

          {rangoFecha}

          {bloqueAccionesCaja}

          <button className="btn-limpiar" onClick={handleLimpiar}>
            Limpiar filtros
          </button>
        </>
      );
    }

    // (El resto de secciones sigue igual, solo cambio el botón de limpiar)

    // AUDITORÍA – HISTÓRICO
    if (activeTab === "Auditoria" && activeCajaTab === "Histórico") {
      return (
        <>
          {renderSelectOperador()}

          <div className="filtro-container">
            <label className="filtro-label">Estado</label>
            <select
              name="estado"
              className="filtro-select"
              onChange={handleChange}
              value={filtros.estado || ""}
            >
              <option value="">Todos</option>
              <option value="OK">OK</option>
              <option value="Conflicto">Conflicto</option>
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
            <label className="filtro-label">Fecha exacta</label>
            <input
              type="date"
              name="fecha"
              className="filtro-input"
              value={filtros.fecha || ""}
              onChange={handleChange}
            />
          </div>

          {rangoFecha}

          <button className="btn-limpiar" onClick={handleLimpiar}>
            Limpiar filtros
          </button>
        </>
      );
    }

    // INGRESOS / NUEVA AUDITORÍA
    if (
      activeCajaTab === "Ingresos" ||
      (activeTab === "Auditoria" && activeCajaTab === "Nueva Auditoría")
    ) {
      return (
        <>
          {renderSelectOperador()}

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
              {tiposVehiculo.map((tipo, i) => (
                <option key={i} value={tipo?.nombre || ""}>
                  {(tipo?.nombre || "").charAt(0).toUpperCase() +
                    (tipo?.nombre || "").slice(1)}
                </option>
              ))}
            </select>
          </div>

          {rangoFecha}

          <button className="btn-limpiar" onClick={handleLimpiar}>
            Limpiar filtros
          </button>
        </>
      );
    }

    // ALERTAS / INCIDENTES
    if (activeCajaTab === "Alertas" || activeCajaTab === "Incidentes") {
      return (
        <>
          {renderSelectOperador()}

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
            <label className="filtro-label">Fecha exacta</label>
            <input
              type="date"
              name="fecha"
              className="filtro-input"
              value={filtros.fecha || ""}
              onChange={handleChange}
            />
          </div>

          {rangoFecha}

          <button className="btn-limpiar" onClick={handleLimpiar}>
            Limpiar filtros
          </button>
        </>
      );
    }

    // CIERRES DE CAJA + CÓMPUTOS
    if (
      activeCajaTab === "A Retirar" ||
      activeCajaTab === "Retirado" ||
      activeCajaTab === "Parciales" ||
      activeCajaTab === "Cómputos"
    ) {
      return (
        <>
          {renderSelectOperador()}

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
            <label className="filtro-label">Fecha exacta</label>
            <input
              type="date"
              name="fecha"
              className="filtro-input"
              value={filtros.fecha || ""}
              onChange={handleChange}
            />
          </div>

          {rangoFecha}

          <button className="btn-limpiar" onClick={handleLimpiar}>
            Limpiar filtros
          </button>
        </>
      );
    }

    return null;
  };

  return (
    <div className="filtros">
      <div className="titleFiltros">Filtros - {activeCajaTab}</div>
      {renderFiltrosPorTab()}
    </div>
  );
}

export default Filtros;
