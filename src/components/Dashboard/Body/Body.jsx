import "./Body.css"
import Filtros from "./Filtros/Filtros.jsx";
import Caja from "./Caja/Caja.jsx";

function Body() {

    return (
        <div className="body">
            <div className="filtros-container">
                <Filtros />
            </div>
            <div className="caja-container">
                <Caja />
            </div>
        </div>
    )
}

export default Body

