// tarifasService.js
import { useState, useEffect } from "react";

export function useTarifasData() {
  const [tarifas, setTarifas] = useState([]);
  const [precios, setPrecios] = useState({});
  const [tiposVehiculo, setTiposVehiculo] = useState([]);
  const [parametros, setParametros] = useState({
    fraccionarDesde: 0,
    toleranciaInicial: 0,
    permitirCobroAnticipado: false,
  });

  useEffect(() => {
    fetch("https://api.garageia.com/api/precios")
      .then((res) => res.json())
      .then((data) => setPrecios(data))
      .catch(() => setPrecios({}));

    fetch("https://api.garageia.com/api/tipos-vehiculo")
      .then((res) => res.json())
      .then((data) => setTiposVehiculo(data))
      .catch(() => setTiposVehiculo([]));

    fetch("https://api.garageia.com/api/parametros")
      .then((res) => res.json())
      .then((data) => setParametros(data))
      .catch(() => setParametros({}));
  }, []);

  useEffect(() => {
    fetch("https://api.garageia.com/api/tarifas")
      .then((res) => res.json())
      .then((data) => setTarifas(data))
      .catch(() => setTarifas([]));
  }, []);

  return { tarifas, precios, tiposVehiculo, parametros };
}

export async function calcularTarifaAPI({
  tipoVehiculo,
  inicio,
  dias,
  hora,
  tarifaAbono,
  tipoTarifa,
  tarifas,
  precios,
  parametros,
}) {
  try {
    const response = await fetch("https://api.garageia.com/api/calcular-tarifa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        detalle: {
          tipoVehiculo,
          inicio,
          dias,
          hora,
          tarifaAbono,
          tipoTarifa,
        },
        tarifas,
        precios,
        parametros,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Error al calcular tarifa");
    }

    return await response.json(); // data con data.detalle
  } catch (err) {
    throw err;
  }
}
