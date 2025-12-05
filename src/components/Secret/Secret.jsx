// Secret.jsx
import React, { useState, useEffect } from "react";
import "./Secret.css";

const Secret = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState("delete");

  // Buscar ticket
  const [ticketInput, setTicketInput] = useState("");
  const [ticketResult, setTicketResult] = useState(null);
  const [ticketError, setTicketError] = useState("");

  // 🔥 RESET AUTOMÁTICO CUANDO CAMBIO DE PESTAÑA
  useEffect(() => {
    if (tab !== "ticket") {
      setTicketInput("");
      setTicketResult(null);
      setTicketError("");
    }
  }, [tab]);

  const endpoints = [
    { label: "Movimientos", path: "movimientos" },
    { label: "Vehículos", path: "vehiculos" },
    { label: "Clientes", path: "clientes" },
    { label: "Abonos", path: "abonos" },
    { label: "Turnos", path: "turnos" },
    { label: "Cierres de Caja", path: "cierresdecaja" },
    { label: "Cierres Parciales", path: "cierresdecaja/parcial" },
    { label: "Alertas", path: "alertas" },
    { label: "Incidentes", path: "incidentes" },
    { label: "Cocheras", path: "cocheras" },
  ];

  const REMOTE_BASE = "https://apiprueba.garageia.com";
  const LOCAL_BASE = "http://localhost:5000";

  const fmt = (dateString) => {
    if (!dateString) return null;
    const d = new Date(dateString);
    return isNaN(d) ? null : d.toLocaleString();
  };

  const capitalize = (s) =>
    !s ? "" : s.charAt(0).toUpperCase() + s.slice(1);

  const Item = ({ label, value }) =>
    value ? (
      <p className="itemRow">
        <span className="itemLabel">{label}</span>
        <span className="itemValue">{value}</span>
      </p>
    ) : null;

  // =====================================================
  // DELETE ENDPOINTS
  // =====================================================
  const handleDelete = async (path) => {
    setLoading(true);
    setMessage("");

    const urls = [
      `${LOCAL_BASE}/api/${path}`,
      `${REMOTE_BASE}/api/${path}`,
    ];

    let results = [];

    for (let url of urls) {
      try {
        const res = await fetch(url, { method: "DELETE" });
        results.push(
          res.ok ? `✔️ Éxito en ${url}` : `⚠️ Error (${res.status}) en ${url}`
        );
      } catch {
        results.push(`❌ No se pudo conectar a ${url}`);
      }
    }

    setMessage(results.join("\n"));
    setLoading(false);
  };

  const deleteAtBase = async (baseUrl, path) => {
    const url = `${baseUrl}/api/${path}`;
    try {
      const res = await fetch(url, { method: "DELETE" });
      setMessage((prev) =>
        prev + "\n" + (res.ok ? `✔️ ${url}` : `⚠️ Error ${url}`)
      );
    } catch {
      setMessage((prev) => prev + `\n❌ No se pudo conectar a ${url}`);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("⚠️ Esto borra TODO en local y producción. ¿Seguro?"))
      return;

    setLoading(true);
    setMessage("Iniciando eliminación total...");

    setMessage((prev) => prev + "\n\n🌐 Eliminando en REMOTO:");
    for (let api of endpoints) await deleteAtBase(REMOTE_BASE, api.path);

    setMessage((prev) => prev + "\n\n🖥️ Eliminando en LOCAL:");
    for (let api of endpoints) await deleteAtBase(LOCAL_BASE, api.path);

    setMessage((prev) => prev + "\n\n☠️ Finalizado.");
    setLoading(false);
  };

  // =====================================================
  // BUSCAR POR TICKET
  // =====================================================
  const buscarPorTicket = async () => {
    setLoading(true);
    setTicketError("");
    setTicketResult(null);

    if (!ticketInput.trim()) {
      setTicketError("Ingresá un ticket válido.");
      setLoading(false);
      return;
    }

    try {
      const url = `https://apiprueba.garageia.com/api/vehiculos/ticket-admin/${ticketInput}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTicketResult(data);
    } catch {
      setTicketError("❌ Ticket no encontrado.");
    }

    setLoading(false);
  };

  const onEnter = (e) => {
    if (e.key === "Enter") buscarPorTicket();
  };

  // =====================================================
  // RENDER RESULTADO
  // =====================================================

  const renderTicketResult = () => {
    if (!ticketResult) return null;

    const v = ticketResult.vehiculo;
    if (!v) return null;

    const ultima = ticketResult.estadia;
    const actual = v.estadiaActual;
    const historial = v.historialEstadias || [];

    return (
      <div className="ticketCard">
        <h3 className="sectionTitle">Datos del Vehículo</h3>

        <div className="infoGrid">
          <Item label="Patente" value={v.patente} />
          <Item label="Tipo" value={capitalize(v.tipoVehiculo)} />
          <Item label="Operador" value={v.operador} />
          <Item label="Abonado" value={v.abonado ? "Sí" : "No"} />
        </div>

        {ultima && (
          <>
            <h4 className="sectionTitle">Última Estadía</h4>
            <div className="infoGrid">
              <Item label="Entrada" value={fmt(ultima.entrada)} />
              {ultima.salida && <Item label="Salida" value={fmt(ultima.salida)} />}
              {ultima.salida && ultima.costoTotal != null && (
                <Item label="Costo Total" value={`$${ultima.costoTotal}`} />
              )}
              {ultima.salida && ultima.metodoPago && (
                <Item label="Método Pago" value={ultima.metodoPago} />
              )}
              {ultima.salida && ultima.ticket && (
                <Item label="Ticket" value={ultima.ticket} />
              )}
            </div>
          </>
        )}

        {actual && Object.keys(actual).length > 0 && (
          <>
            <h4 className="sectionTitle">Estadía Actual</h4>
            <div className="infoGrid">
              <Item label="Entrada" value={fmt(actual.entrada)} />
              {actual.costoTotal != null && (
                <Item label="Costo Total" value={`$${actual.costoTotal}`} />
              )}
              {actual.ticket && <Item label="Ticket" value={actual.ticket} />}
              {actual.operadorNombre && (
                <Item label="Operador" value={actual.operadorNombre} />
              )}
            </div>
          </>
        )}

        {historial.length > 0 && (
          <>
            <h4 className="sectionTitle">Historial</h4>
            {historial.map((h, i) => (
              <div key={i} className="histCard">
                <Item label="Entrada" value={fmt(h.entrada)} />
                <Item label="Salida" value={fmt(h.salida)} />
                <Item label="Operador" value={h.operadorNombre} />
                <Item label="Ticket" value={h.ticket} />
                <Item label="Costo Total" value={`$${h.costoTotal}`} />
              </div>
            ))}
          </>
        )}
      </div>
    );
  };

  // =====================================================
  return (
    <div className="secret-container">
      <h2 className="secret-title">🧨 Panel Secreto</h2>

      <div className="tabs">
        <button
          onClick={() => setTab("delete")}
          className={tab === "delete" ? "tabActive" : "tab"}
        >
          🗑️ Eliminación
        </button>

        <button
          onClick={() => setTab("ticket")}
          className={tab === "ticket" ? "tabActive" : "tab"}
        >
          🎫 Buscar por Ticket
        </button>
      </div>

      {tab === "delete" && (
        <>
          <div className="buttonsContainer">
            {endpoints.map((api) => (
              <button
                key={api.path}
                onClick={() => handleDelete(api.path)}
                disabled={loading}
                className="secret-btn"
              >
                {loading ? "Borrando..." : `Borrar ${api.label}`}
              </button>
            ))}
          </div>

          <button
            onClick={handleDeleteAll}
            disabled={loading}
            className="secret-btn deleteAllButton"
          >
            {loading ? "Borrando..." : "💣 BORRAR TODO"}
          </button>

          {message && <pre className="resultBox">{message}</pre>}
        </>
      )}

      {tab === "ticket" && (
        <div>
          <input
            type="number"
            placeholder="Ingresá ticket..."
            value={ticketInput}
            onChange={(e) => setTicketInput(e.target.value)}
            onKeyDown={onEnter}
            className="secret-input"
          />

          <button
            onClick={buscarPorTicket}
            disabled={loading}
            className="secret-btn ticket-btn"
          >
            Buscar
          </button>

          {ticketError && <p className="error">{ticketError}</p>}

          {renderTicketResult()}
        </div>
      )}
    </div>
  );
};

export default Secret;
