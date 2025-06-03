import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // agrego useNavigate para redirigir si no hay user
import AbonoForm from './AbonoForm.jsx'; 
import TurnoForm from './TurnoForm.jsx';
import './TabsAbonos.css';

import TicketsAbiertos from '../BodyAbonos/sections/TicketsAbiertos/TicketsAbiertos';
import AbonosSection from '../BodyAbonos/sections/AbonosSection/AbonosSection';
import Turno from '../BodyAbonos/sections/Turnos/Turnos';

const TabsAbonos = () => {
  const tabs = ['Abonos y Turnos Activos', 'Clientes Abonados'];
  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromQuery = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tabs.includes(tab)) return tab;
    return 'Abonos y Turnos Activos';
  };

  const [activeTab, setActiveTab] = useState(getTabFromQuery());
  const [modalOpen, setModalOpen] = useState(null); // null | 'abono' | 'turno'
  const [user, setUser] = useState(null);

  useEffect(() => {
    setActiveTab(getTabFromQuery());
  }, [location.search]);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch('https://api.garageia.com/api/auth/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          setUser(data);
        } else {
          if (response.status === 401) {
            localStorage.removeItem('token');
            setUser(null);
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        // Opcional: manejar error
      }
    };

    fetchUser();
  }, [navigate]);

  console.log("user en TabsAbonos.jsx", user);

  const renderSection = () => {
    switch (activeTab) {
      case 'Abonos y Turnos Activos':
        return <TicketsAbiertos />;
      case 'Clientes Abonados':
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
              {modalOpen === 'abono' ? (
                <AbonoForm onClose={closeModal} user={user} />
              ) : (
                <TurnoForm onClose={closeModal} user={user} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabsAbonos;
