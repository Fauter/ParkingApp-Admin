import React, { useState, useEffect } from "react";
import "./ModalVehiculo.css";

const ModalVehiculo = ({
  visible,
  onClose,
  onGuardarExitoso,
  formData,
  setFormData,
  handleChange,
  loading,
  cliente,
  user,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tiposVehiculo, setTiposVehiculo] = useState([]);
  const [tiposLoading, setTiposLoading] = useState(false);
  const [tiposError, setTiposError] = useState(null);

  useEffect(() => {
    if (!visible) return;

    const fetchTiposVehiculo = async () => {
      setTiposLoading(true);
      setTiposError(null);
      try {
        const res = await fetch("http://localhost:5000/api/tipos-vehiculo");
        if (!res.ok) throw new Error("Error al obtener tipos de vehículo");
        const data = await res.json();
        setTiposVehiculo(data);
      } catch (error) {
        console.error("Error fetch tipos vehículo:", error);
        setTiposError("No se pudieron cargar los tipos de vehículo");
      } finally {
        setTiposLoading(false);
      }
    };

    fetchTiposVehiculo();
  }, [visible]);

  if (!visible) return null;

  const onInputChange = (e) => {
    const { name, type, files, value } = e.target;
    if (type === "file") {
      setFormData({
        ...formData,
        [name]: files[0] || null,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const renderFileInput = (label, name) => {
    const archivoCargado = formData[name] != null;

    return (
      <div className="modal-vehiculo-file-input">
        <label className="file-visible-label">{label}</label>
        <label className="file-label">
          <div className="icon-wrapper">📷</div>
          {archivoCargado ? (
            <div className="file-uploaded">✅</div>
          ) : (
            <div className="file-text">
              <span>Seleccionar</span>
              <span>Imagen</span>
            </div>
          )}
          <input
            type="file"
            name={name}
            accept="image/*"
            onChange={onInputChange}
            style={{ display: "none" }}
          />
        </label>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const patente = formData.patente?.toUpperCase() || "";
    const patenteRegex = /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/;
    if (!patenteRegex.test(patente)) {
      alert("Patente Inválida");
      console.log("Patente inválida:", patente);
      return;
    }
    console.log("Patente válida:", patente);

    setIsSubmitting(true);

    try {
      // Verificar si el vehículo ya existe
      const vehiculosRes = await fetch("http://localhost:5000/api/vehiculos");
      if (!vehiculosRes.ok)
        throw new Error("No se pudieron obtener los vehículos");
      const vehiculos = await vehiculosRes.json();

      const vehiculoExistente = vehiculos.find(
        (v) => v.patente.toUpperCase() === patente
      );

      if (!vehiculoExistente) {
        console.log("Vehículo no existe, creando...");
        const tipoVehiculo = formData.tipoVehiculo;
        if (!tipoVehiculo) {
          alert("Debe seleccionar tipo de vehículo");
          setIsSubmitting(false);
          return;
        }

        const crearVehiculoRes = await fetch(
          "http://localhost:5000/api/vehiculos/sin-entrada",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ patente, tipoVehiculo }),
          }
        );

        if (!crearVehiculoRes.ok) {
          let errorMsg = "Error al crear vehículo";
          try {
            const errorData = await crearVehiculoRes.json();
            console.error("Error al crear vehículo:", errorData);
            errorMsg = errorData.message || errorMsg;
          } catch {
            console.error("Respuesta no JSON al crear vehículo");
          }
          alert(errorMsg);
          setIsSubmitting(false);
          return;
        }
        const nuevoVehiculo = await crearVehiculoRes.json();
        console.log("Vehículo creado:", nuevoVehiculo);
      } else {
        console.log("Vehículo ya existe:", vehiculoExistente);
      }

      const abonoFormData = new FormData();

      // Agregamos campos cliente
      abonoFormData.append("nombreApellido", cliente?.nombreApellido || "");
      abonoFormData.append("domicilio", cliente?.domicilio || "");
      abonoFormData.append("localidad", cliente?.localidad || "");
      abonoFormData.append("telefonoParticular", cliente?.telefonoParticular || "");
      abonoFormData.append("telefonoEmergencia", cliente?.telefonoEmergencia || "");
      abonoFormData.append("domicilioTrabajo", cliente?.domicilioTrabajo || "");
      abonoFormData.append("telefonoTrabajo", cliente?.telefonoTrabajo || "");
      abonoFormData.append("email", cliente?.email || "");
      abonoFormData.append("dniCuitCuil", cliente?.dniCuitCuil || "");

      // Agregamos campos vehículo
      abonoFormData.append("patente", patente);
      abonoFormData.append("marca", formData.marca || "");
      abonoFormData.append("modelo", formData.modelo || "");
      abonoFormData.append("color", formData.color || "");
      abonoFormData.append("anio", formData.anio || "");
      abonoFormData.append("companiaSeguro", formData.companiaSeguro || "");
      abonoFormData.append("tipoVehiculo", formData.tipoVehiculo || "");

      // Otros datos
      abonoFormData.append("metodoPago", formData.metodoPago || "");
      abonoFormData.append("factura", formData.factura || "Sin factura");

      // Archivos - sólo agregamos si hay archivo cargado
      if (formData.fotoSeguro) {
        abonoFormData.append("fotoSeguro", formData.fotoSeguro);
      }
      if (formData.fotoDNI) {
        abonoFormData.append("fotoDNI", formData.fotoDNI);
      }
      if (formData.fotoCedulaVerde) {
        abonoFormData.append("fotoCedulaVerde", formData.fotoCedulaVerde);
      }
      if (formData.fotoCedulaAzul) {
        abonoFormData.append("fotoCedulaAzul", formData.fotoCedulaAzul);
      }

      console.log("Enviando FormData para registrar abono");

      const abonoRes = await fetch(
        "http://localhost:5000/api/abonos/registrar-abono",
        {
          method: "POST",
          body: abonoFormData,
        }
      );

      if (!abonoRes.ok) {
        let errorMsg = "Error al registrar abono";
        try {
          const errorData = await abonoRes.json();
          console.error("Error al registrar abono:", errorData);
          errorMsg = errorData.message || errorMsg;
        } catch {
          console.error("Respuesta no JSON al registrar abono");
        }
        alert(errorMsg);
        setIsSubmitting(false);
        return;
      }

      const abonoJson = await abonoRes.json();
      alert("¡Abono registrado correctamente!");
      console.log("Respuesta abono:", abonoJson);
      
      // Resetear formulario
      setFormData({
        patente: "",
        marca: "",
        modelo: "",
        color: "",
        anio: "",
        companiaSeguro: "",
        tipoVehiculo: "",
        metodoPago: "",
        factura: "",
        fotoSeguro: null,
        fotoDNI: null,
        fotoCedulaVerde: null,
        fotoCedulaAzul: null,
      });

      // Llamar a onGuardarExitoso para notificar a DetalleCliente
      if (onGuardarExitoso) {
        onGuardarExitoso();
      }
      
      onClose();
    } catch (err) {
      console.error("Error en handleSubmit ModalVehiculo:", err.message);
      alert("Error al registrar el abono. Por favor, intentá nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-vehiculo-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-vehiculo-content" onClick={(e) => e.stopPropagation()}>
        <form className="modal-vehiculo-form" onSubmit={handleSubmit}>
          <div className="modal-vehiculo-image-row">
            {renderFileInput("Foto Seguro", "fotoSeguro")}
            {renderFileInput("Foto DNI", "fotoDNI")}
            {renderFileInput("Foto Céd. Verde", "fotoCedulaVerde")}
            {renderFileInput("Foto Céd. Azul", "fotoCedulaAzul")}
          </div>

          <div className="modal-vehiculo-form-group grid-2">
            <input
              className="modal-vehiculo-input"
              name="patente"
              placeholder="Patente"
              value={formData.patente || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  patente: e.target.value.toUpperCase(),
                })
              }
              maxLength={7}
              required
            />
            <input
              className="modal-vehiculo-input"
              name="marca"
              placeholder="Marca"
              value={formData.marca || ""}
              onChange={onInputChange}
            />
            <input
              className="modal-vehiculo-input"
              name="modelo"
              placeholder="Modelo"
              value={formData.modelo || ""}
              onChange={onInputChange}
            />
            <input
              className="modal-vehiculo-input"
              name="color"
              placeholder="Color"
              value={formData.color || ""}
              onChange={onInputChange}
            />
            <input
              className="modal-vehiculo-input"
              name="anio"
              placeholder="Año"
              type="number"
              value={formData.anio || ""}
              onChange={onInputChange}
            />
            <input
              className="modal-vehiculo-input"
              name="companiaSeguro"
              placeholder="Compañía de Seguro"
              value={formData.companiaSeguro || ""}
              onChange={onInputChange}
            />
            <select
              id="tipoVehiculo"
              name="tipoVehiculo"
              value={formData.tipoVehiculo || ""}
              onChange={onInputChange}
              required
              className="modal-vehiculo-input"
              disabled={tiposLoading || !!tiposError}
            >
              <option value="" disabled>
                {tiposLoading
                  ? "Cargando tipos de vehículo..."
                  : tiposError
                  ? "Error cargando tipos"
                  : "Seleccioná un tipo"}
              </option>
              {!tiposLoading &&
                !tiposError &&
                tiposVehiculo.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                  </option>
                ))}
            </select>
          </div>

          <div className="modal-vehiculo-buttons">
            <button type="submit" disabled={loading || isSubmitting}>
              {loading || isSubmitting ? "Guardando..." : "Guardar"}
            </button>
            <button type="button" onClick={onClose} disabled={loading || isSubmitting}>
              Cerrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalVehiculo;