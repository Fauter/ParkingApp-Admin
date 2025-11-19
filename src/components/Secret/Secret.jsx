// Secret.jsx
import React, { useState } from "react";

const Secret = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

  const handleDelete = async (path, all = false) => {
    setLoading(true);
    setMessage(all ? "💣 Eliminando TODO..." : "");

    const urls = [
      `${LOCAL_BASE}/api/${path}`,
      `${REMOTE_BASE}/api/${path}`,
    ];

    let results = [];

    for (let url of urls) {
      try {
        const res = await fetch(url, { method: "DELETE" });
        if (res.ok) {
          results.push(`✔️ Éxito en ${url}`);
        } else {
          results.push(`⚠️ Error (${res.status}) en ${url}`);
        }
      } catch (err) {
        results.push(`❌ No se pudo conectar a ${url}`);
      }
    }

    setMessage((prev) => (prev ? prev + "\n" : "") + results.join("\n"));
    setLoading(false);
  };

  // === NUEVO: helpers para "Borrar Todo" con orden estricto (remoto -> local)
  const deleteAtBase = async (baseUrl, path) => {
    const url = `${baseUrl}/api/${path}`;
    try {
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        setMessage((prev) => (prev ? prev + "\n" : "") + `✔️ Éxito en ${url}`);
      } else {
        setMessage(
          (prev) =>
            (prev ? prev + "\n" : "") + `⚠️ Error (${res.status}) en ${url}`
        );
      }
    } catch {
      setMessage(
        (prev) => (prev ? prev + "\n" : "") + `❌ No se pudo conectar a ${url}`
      );
    }
  };

  const handleDeleteAll = async () => {
    if (
      !window.confirm(
        "⚠️ Esto va a borrar absolutamente todo en local y producción. ¿Seguro?"
      )
    )
      return;

    setLoading(true);
    setMessage("💣 Iniciando eliminación total...\n➡️ Primero REMOTO, luego LOCAL");

    // 1) REMOTO primero (todos los endpoints)
    setMessage((prev) => prev + "\n\n🌐 Eliminando en REMOTO:");
    for (let api of endpoints) {
      await deleteAtBase(REMOTE_BASE, api.path);
    }

    // 2) LOCAL después (todos los endpoints)
    setMessage((prev) => prev + "\n\n🖥️ Eliminando en LOCAL:");
    for (let api of endpoints) {
      await deleteAtBase(LOCAL_BASE, api.path);
    }

    setMessage((prev) => prev + "\n\n☠️ Todo borrado (o al menos intentado)");
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🧨 Panel Secreto — Borrado de APIs</h2>
      <p style={styles.subtitle}>
        Usá con cuidado. Esto borra los datos en producción y local. No hay
        vuelta atrás 😬
      </p>

      <div style={styles.buttonsContainer}>
        {endpoints.map((api) => (
          <button
            key={api.path}
            onClick={() => handleDelete(api.path)}
            style={styles.button}
            disabled={loading}
          >
            {loading ? "Borrando..." : `Borrar ${api.label}`}
          </button>
        ))}
      </div>

      <button
        onClick={handleDeleteAll}
        style={{
          ...styles.button,
          ...styles.deleteAllButton,
        }}
        disabled={loading}
      >
        {loading ? "💣 Borrando Todo..." : "💣☠️ BORRAR TODO ☠️💣"}
      </button>

      {message && <pre style={styles.resultBox}>{message}</pre>}
    </div>
  );
};

// Estilos caseros, sin Tailwind
const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    maxWidth: "550px",
    margin: "40px auto",
    padding: "25px",
    border: "2px dashed #b33",
    borderRadius: "14px",
    backgroundColor: "#fff8f8",
    textAlign: "center",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  },
  title: {
    marginBottom: "10px",
    color: "#a00",
  },
  subtitle: {
    marginBottom: "20px",
    color: "#555",
    fontSize: "14px",
  },
  buttonsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "25px",
  },
  button: {
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#d9534f",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  deleteAllButton: {
    backgroundColor: "#000",
    color: "#fff",
    fontSize: "16px",
    marginTop: "10px",
    border: "3px solid red",
    textShadow: "0 0 3px red",
    transform: "scale(1)",
  },
  resultBox: {
    textAlign: "left",
    backgroundColor: "#fefefe",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "13px",
    whiteSpace: "pre-wrap",
    marginTop: "20px",
  },
};

// Hover manual (simple simulación, no funciona con inline styles pero lo dejo como tenías)
styles.button[":hover"] = {
  backgroundColor: "#c9302c",
};

export default Secret;
