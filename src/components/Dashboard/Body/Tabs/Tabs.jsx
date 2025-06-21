import React from 'react';
import './Tabs.css';
import { FiPlus } from 'react-icons/fi';

const Tabs = ({
  activeTab,
  activeCajaTab,
  onCajaTabChange,
  searchTerm,
  setSearchTerm,
  onSearchBarVisibilityChange,
  onRegisterAuditClick,
  onAddVehicleClick
}) => {
  const tabs =
    activeTab === 'Cierre'
      ? ['A Retirar', 'Retirado', 'Parciales']
      : activeTab === 'Auditoria'
      ? ['Histórico', 'Nueva Auditoría']
      : ['Caja', 'Ingresos', 'Alertas', 'Incidentes'];

  // Determinar si debemos mostrar el searchbar
  const showSearchBar = 
    (activeTab !== 'Cierre') && 
    (activeTab !== 'Auditoria' || activeCajaTab === 'Nueva Auditoría');

  // Mostrar botones de auditoría solo en pestaña Auditoria y en Nueva Auditoría
  const showAuditButtons = activeTab === 'Auditoria' && activeCajaTab === 'Nueva Auditoría';

  // Notificar al padre cuando cambia la visibilidad
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

        {showAuditButtons && (
          <div className="audit-buttons-container">
            <button 
              className="register-audit-button add-button"
              onClick={onAddVehicleClick}
              title="Agregar vehículo temporal"
            >
              <FiPlus className="plus-icon" />
            </button>
            <button 
              className="register-audit-button"
              onClick={onRegisterAuditClick}
            >
              Registrar Auditoría
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