import './App.css';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'; 
import Login from "./components/Login/Login.jsx";
import Dashboard from './components/Dashboard/Dashboard.jsx';
import Config from './components/Config/Config.jsx';

function App() {
  const navigate = useNavigate();
  const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');

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
      <Route path="*" element={<Dashboard />} />
    </Routes>
  )
}

export default App
