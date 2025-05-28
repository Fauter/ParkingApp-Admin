import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AbonoForm from './AbonoForm.jsx'; 
import TurnoForm from './TurnoForm.jsx';
import './TabsAbonos.css';


import TicketsAbiertos from '../BodyAbonos/sections/TicketsAbiertos/TicketsAbiertos';
import AbonosSection from '../BodyAbonos/sections/AbonosSection/AbonosSection';
import Turno from '../BodyAbonos/sections/Turnos/Turnos';

const TabsAbonos = () => {
  const tabs = ['Tickets Abiertos', 'Abonos'];
  const location = useLocation();

  const getTabFromQuery = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tabs.includes(tab)) return tab;
    return 'Tickets Abiertos';
  };

  const [activeTab, setActiveTab] = useState(getTabFromQuery());
  const [modalOpen, setModalOpen] = useState(null); // null | 'abono' | 'turno'

  useEffect(() => {
    setActiveTab(getTabFromQuery());
  }, [location.search]);

  const renderSection = () => {
    switch (activeTab) {
      case 'Tickets Abiertos':
        return <TicketsAbiertos />;
      case 'Abonos':
        return <AbonosSection />;
      case 'Turno':
        return <Turno />;
      default:
        return null;
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(location.search);
    params.set('tab', tab);
    window.history.replaceState(null, '', `${location.pathname}?${params.toString()}`);
  };

  const openModal = (type) => {
    setModalOpen(type);
  };

  const closeModal = () => {
    setModalOpen(null);
  };

  const handleAddAbono = () => {
    openModal('abono');
  };

  const handleAddTurno = () => {
    openModal('turno');
  };

  return (
    <div className="abonoTab-container">
      <div className="abonoTab-header">
        <div className="abonoTab-links">
          {tabs.map((tab) => (
            <a
              key={tab}
              className={`abonoTab-link ${activeTab === tab ? 'active' : ''}`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleTabClick(tab);
              }}
            >
              {tab}
            </a>
          ))}
        </div>
        <div className="abonoTab-buttons">
          <button
            className="simuladorabono-btn btn-abono"
            onClick={handleAddAbono}
            type="button"
            title="Registrar Abono"
          >
            + Abono
          </button>
          <button
            className="simuladorabono-btn btn-turno"
            onClick={handleAddTurno}
            type="button"
            title="Registrar Turno"
          >
            + Turno
          </button>
        </div>
      </div>

      <div className="abonoTab-content">{renderSection()}</div>

      {/* Modal */}
      {modalOpen && (
        <div className="modalabono-overlay" onClick={closeModal}>
          <div className={`modalabono ${modalOpen === 'turno' ? 'modal-turno' : 'modal-abono'}`} onClick={(e) => e.stopPropagation()}>
            <div className="modalabono-header">
              <h3>{modalOpen === 'abono' ? 'Nuevo Abono' : 'Nuevo Turno'}</h3>
              <button className="modalabono-close" onClick={closeModal} aria-label="Cerrar modal">
                &times;
              </button>
            </div>
            <div>
              {/* Aquí podés agregar el formulario o contenido que quieras para cada modal */}
              {modalOpen === 'abono' ? (
                <AbonoForm onClose={closeModal} />
              ) : (
                <TurnoForm onClose={closeModal} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabsAbonos;
