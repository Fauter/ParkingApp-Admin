import React, { useState, useEffect } from "react";
import { useTarifasData, calcularTarifaAPI } from "../../../hooks/tarifasService";
import "./TabsConfig.css";

const TabsConfig = ({ activeTab, onTabChange }) => {
  const tabs = ["Tipos de Vehículo", "Tarifas", "Precios", "Promos", "Usuarios", ];
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState({
    tipoTarifa: "hora",
    tipoVehiculo: "auto",
    inicio: "",
    dias: "",
    hora: "00:00",
    tarifaAbono: "",
  });
  const [detalle, setDetalle] = useState("");

  const { tarifas, precios, tiposVehiculo, parametros } = useTarifasData();

  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (modalAbierto) {
      setForm((prevForm) => ({
        ...prevForm,
        inicio: getCurrentDateTimeLocal(),
      }));
    }
  }, [modalAbierto]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const actualizarDetalle = async () => {
    try {
      const data = await calcularTarifaAPI({
        ...form,
        dias: Number(form.dias || 0),
        tarifas,
        precios,
        parametros,
      });

      if (data.detalle && data.detalle.trim() !== "") {
        setDetalle(data.detalle);
      } else {
        setDetalle("");
      }
    } catch (error) {
      setDetalle(error.message || "Error al calcular tarifa.");
    }
  };

  useEffect(() => {
    if (modalAbierto) {
      actualizarDetalle();
    }
  }, [modalAbierto, form, tarifas, precios, parametros]);

  return (
    <div className="configTab-container">
      <div className="configTab-header">
        <div className="configTab-links">
          {tabs.map((tab) => (
            <a
              key={tab}
              className={`configTab-link ${activeTab === tab ? 'active' : ''}`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onTabChange(tab);
              }}
            >
              <p className="configTab-text">{tab}</p>
            </a>
          ))}
        </div>
        <button className="simulador-btn" onClick={() => setModalAbierto(true)}>⚙️ Simulador de Tarifas</button>
      </div>

      {modalAbierto && (
        <div className="modal-overlay" onClick={() => setModalAbierto(false)}>
          <div className="modal modal-simulador" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Simulador de Tarifas</h3>
              <button className="modal-close" onClick={() => setModalAbierto(false)}>✖</button>
            </div>
            <div className="modal-body modal-simulador-body">
              <div className="modal-simulador-field">
                {/* <label>Tipo de Tarifa</label>
                <select name="tipoTarifa" value={form.tipoTarifa} onChange={handleChange}>
                  <option value="hora">x Hora</option>
                  <option value="turno">x Turno</option>
                  <option value="abono">x Abono</option> 
                </select> */}
              </div>

              <div className="modal-simulador-field">
                <label>Tipo de Vehículo</label>
                <select name="tipoVehiculo" value={form.tipoVehiculo} onChange={handleChange}>
                  {tiposVehiculo.map((tv) => {
                    const nombre = typeof tv === "string" 
                      ? tv 
                      : tv?.nombre || "";
                    return (
                      <option key={nombre.toLowerCase()} value={nombre.toLowerCase()}>
                        {nombre.charAt(0).toUpperCase() + nombre.slice(1)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Días siempre presente */}
              <div className="modal-simulador-field">
                <label>Días</label>
                <input type="number" name="dias" value={form.dias} onChange={handleChange} />
              </div>

              {/* Permanencia SIEMPRE visible */}
              <div className="modal-simulador-field">
                <label>Permanencia</label>
                <input type="time" name="hora" value={form.hora} onChange={handleChange} />
              </div>

              {/* Si es 'abono' mostramos selector 'Tarifa' con tarifas filtradas */}
              {form.tipoTarifa === 'abono' && (
                <div className="modal-simulador-field">
                  <label>Tarifa</label>
                  <select name="tarifaAbono" value={form.tarifaAbono} onChange={handleChange}>
                    {tarifas.map((t) => (
                      <option key={t.id || t.nombre} value={t.id || t.nombre}>
                        {t.nombre || `Tarifa ${t.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="modal-simulador-detalle">
                <strong>Detalle para el Cliente:</strong>
                <pre>{detalle}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabsConfig;
