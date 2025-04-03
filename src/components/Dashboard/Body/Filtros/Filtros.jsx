import "./Filtros.css";

function Filtros() {
    return (
        <div className="filtros">
            <div className="titleFiltros">Filtros</div>
            
            <div className="filtro-container">
                <label className="filtro-label">Operador</label>
                <select className="filtro-select">
                    <option value="">Seleccionar Operador</option>
                    <option value="Diego">Diego</option>
                    <option value="Carlos">Carlos</option>
                    <option value="María">María</option>
                </select>
            </div>
            <div className="filtro-container">
                <label className="filtro-label">Método de Pago</label>
                <select className="filtro-select">
                    <option value="">Seleccionar Método</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="Débito">Débito</option>
                    <option value="Crédito">Crédito</option>
                    <option value="qr">QR</option>
                </select>
            </div>
            <div className="filtro-container">
                <label className="filtro-label">Fecha</label>
                <select className="filtro-select">
                    <option value="">Seleccionar Fecha</option>
                    <option value="2023-10-01">2023-10-01</option>
                    <option value="2023-10-02">2023-10-02</option>
                    <option value="2023-10-03">2023-10-03</option>
                </select>
            </div>
            <div className="filtro-container">
                <label className="filtro-label">Hora</label>
                <select className="filtro-select">
                    <option value="">Seleccionar Hora</option>
                    <option value="12:00">12:00</option>
                    <option value="12:30">12:30</option>
                    <option value="13:00">13:00</option>
                </select>
            </div>
            <div className="filtro-container">
                <label className="filtro-label">Tipo de Vehículo</label>
                <select className="filtro-select">
                    <option value="">Seleccionar Tipo</option>
                    <option value="auto">Auto</option>
                    <option value="camioneta">Camioneta</option>
                    <option value="moto">Moto</option>
                </select>
            </div>
            <div className="filtro-container">
                <label className="filtro-label">Tipo de Movimiento</label>
                <select className="filtro-select">
                    <option value="">Seleccionar Tipo</option>
                    <option value="movil">Pago Móvil</option>
                    <option value="abono">Abono</option>
                    <option value="alertas">Alertas</option>
                </select>
            </div>
        </div>
    );
}

export default Filtros;
