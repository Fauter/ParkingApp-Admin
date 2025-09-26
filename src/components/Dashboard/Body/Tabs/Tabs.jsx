import React from 'react';
import './Tabs.css';
import { FiPlus, FiPrinter } from 'react-icons/fi';

const Tabs = ({
  activeTab,
  activeCajaTab,
  onCajaTabChange,
  searchTerm,
  setSearchTerm,
  onSearchBarVisibilityChange,
  onRegisterAuditClick,
  onAddVehicleClick,
  onPrintAuditClick,     // Auditoría -> Nueva Auditoría
  onPrintCierreClick     // Cierre -> imprime la subpestaña activa
}) => {
  const tabs =
    activeTab === 'Cierre'
      ? ['A Retirar', 'Retirado', 'Parciales']
      : activeTab === 'Auditoria'
      ? ['Histórico', 'Nueva Auditoría']
      : ['Caja', 'Ingresos', 'Alertas', 'Incidentes'];

  // Mostrar searchbar solo donde corresponde
  const showSearchBar =
    (activeTab !== 'Cierre') &&
    (activeTab !== 'Auditoria' || activeCajaTab === 'Nueva Auditoría');

  // Botones de auditoría solo en Auditoria -> Nueva Auditoría
  const showAuditButtons = activeTab === 'Auditoria' && activeCajaTab === 'Nueva Auditoría';

  // Botón de imprimir para Cierre (cualquier subpestaña)
  const showCierrePrint = activeTab === 'Cierre';

  React.useEffect(() => {
    if (onSearchBarVisibilityChange) {
      onSearchBarVisibilityChange(showSearchBar);
    }
  }, [showSearchBar, onSearchBarVisibilityChange]);

  return (
    <div className="tab-container">
      <div className="tab-header">
        <div className="tab-links">
          {tabs.map(tab => (
            <a
              key={tab}
              href="#"
              className={`tab-link ${activeCajaTab === tab ? 'active' : ''}`}
              onClick={e => {
                e.preventDefault();
                onCajaTabChange(tab);
              }}
            >
              <p className="tab-text">{tab}</p>
            </a>
          ))}
        </div>

        {/* Botonera a la derecha */}
        {showAuditButtons && (
          <div className="audit-buttons-container">
            {/* Imprimir listado (Auditoría / Nueva Auditoría) */}
            <button
              className="register-audit-button print"
              onClick={onPrintAuditClick}
              title="Imprimir listado (PDF)"
            >
              <FiPrinter style={{ marginRight: 6 }} />
              Imprimir
            </button>

            {/* Registrar auditoría */}
            <button
              className="register-audit-button primary"
              onClick={onRegisterAuditClick}
              title="Registrar Auditoría"
            >
              Registrar Auditoría
            </button>

            {/* Agregar vehículo temporal */}
            <button
              className="register-audit-button add-button primary"
              onClick={onAddVehicleClick}
              title="Agregar vehículo temporal"
              aria-label="Agregar vehículo temporal"
            >
              <FiPlus className="plus-icon" />
            </button>
          </div>
        )}

        {showCierrePrint && (
          <div className="audit-buttons-container">
            <button
              className="register-audit-button print"
              onClick={onPrintCierreClick}
              title="Imprimir"
              style={{ marginLeft: 10 }}
            >
              <FiPrinter style={{ marginRight: 6 }} />
              Imprimir
            </button>
          </div>
        )}
      </div>

      <div className={`search-container ${!showSearchBar ? 'no-search' : ''}`}>
        {showSearchBar && (
          <label className="search-box">
            <div className="search-input-container">
              <div className="search-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24px"
                  height="24px"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                </svg>
              </div>
              <input
                className="search-input"
                placeholder="Buscar por Patente"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value.toUpperCase())}
              />
            </div>
          </label>
        )}
      </div>
    </div>
  );
};

export default Tabs;
