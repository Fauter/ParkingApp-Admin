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
  ];

  const handleDelete = async (path, all = false) => {
    setLoading(true);
    setMessage(all ? "💣 Eliminando TODO..." : "");

    const urls = [
      `http://localhost:5000/api/${path}`,
      `https://apiprueba.garageia.com/api/${path}`,
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

  const handleDeleteAll = async () => {
    if (
      !window.confirm(
        "⚠️ Esto va a borrar absolutamente todo en local y producción. ¿Seguro?"
      )
    )
      return;

    setMessage("💣 Iniciando eliminación total...");
    for (let api of endpoints) {
      await handleDelete(api.path, true);
    }
    setMessage((prev) => prev + "\n☠️ Todo borrado (o al menos intentado)");
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

// Hover manual (simple simulación)
styles.button[":hover"] = {
  backgroundColor: "#c9302c",
};

export default Secret;
