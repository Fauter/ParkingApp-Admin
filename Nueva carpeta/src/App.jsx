import './App.css';
import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Login from './components/Login/Login.jsx';
import Dashboard from './components/Dashboard/Dashboard.jsx';

const AppWrapper = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');

    if (!token) {
      if (window.location.pathname !== '/login') {
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        navigate('/login');
      }
    } else if (window.location.pathname === '/login') {
      navigate(redirectAfterLogin || '/', { replace: true });
    }
  }, [navigate]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<Dashboard />} />
    </Routes>
  );
};

function App() {
  return <AppWrapper />;
}

export default App;
