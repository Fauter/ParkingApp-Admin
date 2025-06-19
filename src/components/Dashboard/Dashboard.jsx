import { Routes, Route } from "react-router-dom";
import Header from "./Header/Header.jsx";
import Body from "./Body/Body.jsx";
import Config from "../Config/Config.jsx";
import Abonos from "../Abonos/Abonos.jsx";
import DetalleCliente from "../Abonos/BodyAbonos/sections/DetalleCliente/DetalleCliente.jsx";
import "./Dashboard.css";

function Dashboard() {
    return (
        <div className="dashboard-container">
            <Header />
            <div className="dashboard-content">
                <Routes>
                    <Route path="/" element={<Body />} />
                    <Route path="/config" element={<Config />} />
                    <Route path="/tickets" element={<Abonos />} />
                    <Route path="/detalle" element={<DetalleCliente />} />
                    <Route path="/cierresDeCaja" element={<Body />} />
                </Routes>
            </div>
        </div>
    );
}

export default Dashboard;
