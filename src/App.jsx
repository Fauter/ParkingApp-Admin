import './App.css';
import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Login from './components/Login/Login.jsx';
import Dashboard from './components/Dashboard/Dashboard.jsx';

function decodeJWT(token) {
  if (!token) return null;
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}

const AppWrapper = () => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const validarAcceso = () => {
      const token = localStorage.getItem('token');
      const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');
      const pathname = window.location.pathname;
      const hostname = window.location.hostname;

      console.log("Hostname:", hostname);
      console.log("Current Path:", pathname);
      console.log("Token:", token);

      if (!token) {
        console.log("No token found, redirigiendo a login");
        if (pathname !== '/login') {
          localStorage.setItem('redirectAfterLogin', pathname);
          navigate('/login', { replace: true });
        }
        return false;
      }

      const decoded = decodeJWT(token);
      console.log("Decoded token payload:", decoded);

      if (!decoded) {
        alert("Token inválido, por favor inicia sesión nuevamente.");
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
        return false;
      }

      const role = decoded.role;
      console.log("Role del usuario:", role);

      if (hostname === "admin.garageia.com" && role !== "superAdmin") {
        alert("No tienes permisos para acceder a esta aplicación");
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
        return false;
      }

      if (hostname === "operador.garageia.com" && role !== "operador") {
        alert("No tienes permisos para acceder a esta aplicación");
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
        return false;
      }

      if (pathname === '/login') {
        console.log("Usuario ya autenticado, redirigiendo...");
        navigate(redirectAfterLogin || '/', { replace: true });
      }

      return true;
    };

    const accesoValido = validarAcceso();
    setCheckingAuth(false);
  }, [navigate]);

  if (checkingAuth) {
    return <div>Cargando...</div>;
  }

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
