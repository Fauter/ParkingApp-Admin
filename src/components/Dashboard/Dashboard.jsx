import { Routes, Route } from "react-router-dom";
import Header from "./Header/Header.jsx";
import Body from "./Body/Body.jsx"
import Config from "../Config/Config.jsx";
import "./Dashboard.css"

function Dashboard() {

    return (
        <div className="dashboard-container">
            <Header />
            <div className="dashboard-content">
            <Routes>
                <Route path="/" element={<Body />} />
                <Route path="/config" element={<Config />} />
            </Routes>
            </div>
        </div>
    )
}

export default Dashboard

