import { useState, useEffect } from "react";
import "./Creador.css";

const Creador = () => {
    const [vehiculos, setVehiculos] = useState([]);
    const [patente, setPatente] = useState("");
    const [tipoVehiculo, setTipoVehiculo] = useState("auto");
    const [abonado, setAbonado] = useState(false);
    const [metodosPago, setMetodosPago] = useState({});

    useEffect(() => {
        fetch("http://localhost:5000/api/vehiculos")
            .then(res => res.json())
            .then(data => setVehiculos(data))
            .catch(err => console.error("Error al obtener vehículos:", err));
    }, []);

    const agregarVehiculo = () => {
        if (!patente) return;
        const nuevoVehiculo = { patente, tipoVehiculo, abonado };
        fetch("http://localhost:5000/api/vehiculos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoVehiculo),
        })
            .then(res => res.json())
            .then(data => {
                if (data.vehiculo) {
                    setVehiculos([...vehiculos, data.vehiculo]);
                    setPatente("");
                    setTipoVehiculo("auto");
                    setAbonado(false);
                } else {
                    console.error("Error al agregar vehículo:", data.msg);
                }
            })
            .catch(err => console.error("Error al agregar vehículo:", err));
    };

    const registrarEntrada = (patente) => {
        fetch(`http://localhost:5000/api/vehiculos/${patente}/registrarEntrada`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                operador: 'Carlos',
                metodoPago: 'Tarjeta',
                monto: 1000, // MONTO POR HORA
            }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.vehiculo) {
                    setVehiculos(vehiculos.map(v => v.patente === patente ? data.vehiculo : v));
                }
            })
            .catch(err => console.error("Error registrando entrada:", err));
    };
    const registrarSalida = (patente, metodoPago) => {
        fetch(`http://localhost:5000/api/vehiculos/${patente}/registrarSalida`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ metodoPago })
        })
            .then(res => res.json())
            .then(data => {
                if (data.vehiculo) {
                    setVehiculos(vehiculos.map(v => v.patente === patente ? data.vehiculo : v));
                }
            })
            .catch(err => console.error("Error registrando salida:", err));
    };

    return (
        <div className="creador-container">
            <h2>Gestor de Vehículos</h2>
            <div className="formulario">
                <input
                    type="text"
                    placeholder="Patente"
                    value={patente}
                    onChange={(e) => setPatente(e.target.value)}
                />
                <select value={tipoVehiculo} onChange={(e) => setTipoVehiculo(e.target.value)}>
                    <option value="auto">Auto</option>
                    <option value="camioneta">Camioneta</option>
                </select>
                <select value={abonado} onChange={(e) => setAbonado(e.target.value === "true")}> 
                    <option value="false">No Abonado</option>
                    <option value="true">Abonado</option>
                </select>
                <button onClick={agregarVehiculo}>Agregar Vehículo</button>
            </div>

            {/* ABAJO */}
            <table>
                <thead>
                    <tr>
                        <th>Patente</th>
                        <th>Tipo</th>
                        <th>Abonado</th>
                        <th>Entrada</th>
                        <th>Salida</th>
                        <th>Acciones</th>
                        <th>Método Pago</th>
                    </tr>
                </thead>
                <tbody>
                    {vehiculos.map((vehiculo, index) => (
                        <tr key={index}>
                            <td>{vehiculo.patente}</td>
                            <td>{vehiculo.tipoVehiculo}</td>
                            <td>{vehiculo.abonado ? "Sí" : "No"}</td>
                            <td>{vehiculo.historialEstadias?.[vehiculo.historialEstadias.length - 1]?.entrada ? new Date(vehiculo.historialEstadias[vehiculo.historialEstadias.length - 1].entrada).toLocaleTimeString() : "-"}</td>
                            <td>{vehiculo.historialEstadias?.[vehiculo.historialEstadias.length - 1]?.salida ? new Date(vehiculo.historialEstadias[vehiculo.historialEstadias.length - 1].salida).toLocaleTimeString() : "-"}</td>
                            <td>
                                <button onClick={() => registrarEntrada(vehiculo.patente)} disabled={vehiculo.abonado}>
                                    Entrada
                                </button>
                                <button
                                    onClick={() => registrarSalida(vehiculo.patente, metodosPago[vehiculo.patente] ?? "Efectivo")}
                                    disabled={vehiculo.abonado}
                                >
                                    Salida
                                </button>
                            </td>
                            <td>
                                <select
                                    value={metodosPago[vehiculo.patente] ?? "Efectivo"}
                                    onChange={(e) => {
                                        setMetodosPago(prev => ({
                                            ...prev,
                                            [vehiculo.patente]: e.target.value
                                        }));
                                    }}
                                >
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Tarjeta">Tarjeta</option>
                                    <option value="QR">QR</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Creador;
