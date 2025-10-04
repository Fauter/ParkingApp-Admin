// /admin/src/App.jsx 
import './App.css';
import React, { useEffect, useState, useMemo } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login/Login.jsx';
import Dashboard from './components/Dashboard/Dashboard.jsx';
import Auditor from './components/Auditor/Auditor.jsx';
import Secret from './components/Secret/Secret.jsx'; // ✅ agregado

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

function getCurrentRole() {
  const token = localStorage.getItem('token');
  const decoded = decodeJWT(token);
  return (decoded && decoded.role) ? decoded.role : 'unknown';
}

function hasHostPermission(hostname, role) {
  if (!role) return false;

  if (hostname === 'admin.garageia.com') {
    return role === 'admin' || role === 'superAdmin' || role === 'auditor';
  }
  if (hostname === 'operador.garageia.com') {
    return role === 'operador' || role === 'admin' || role === 'superAdmin' || role === 'auditor';
  }
  return true; // localhost/dev
}

function homePathByRole(role) {
  if (role === 'auditor') return '/auditor';
  return '/';
}

/** ✅ helper: match exact segmento (/auditor o /auditor/...) */
function isAtRoute(pathname, base) {
  return pathname === base || pathname.startsWith(base + '/');
}

function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  const decoded = decodeJWT(token);
  const location = useLocation();

  if (!token || !decoded) {
    localStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RequireRole({ allowed = [], children }) {
  const role = getCurrentRole();
  if (!allowed.includes(role)) {
    return <Navigate to={homePathByRole(role)} replace />;
  }
  return children;
}

const AppWrapper = () => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const location = useLocation();

  const hostname = useMemo(() => window.location.hostname, []);
  const pathname = location.pathname;

  useEffect(() => {
    const validarAcceso = () => {
      const token = localStorage.getItem('token');
      const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');

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

      const role = decoded.role || 'unknown';
      console.log("Role del usuario:", role);

      if (!hasHostPermission(hostname, role)) {
        alert("No tienes permisos para acceder a esta aplicación");
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
        return false;
      }

      if (pathname === '/login') {
        const target = redirectAfterLogin || homePathByRole(role);
        console.log("Usuario autenticado, redirigiendo a:", target);
        navigate(target, { replace: true });
        return true;
      }

      // ✅ Redirección sólo para AUDITOR usando match por segmento
      const desiredHome = homePathByRole(role);
      const onAuditor = isAtRoute(pathname, '/auditor');
      const isAuditor = role === 'auditor';

      if (isAuditor && !onAuditor) {
        console.log("Forzando auditor → /auditor");
        navigate('/auditor', { replace: true });
        return true;
      }

      // ⚠️ Importante: NO tocar /auditoria (Dashboard) — sólo /auditor
      if (!isAuditor && onAuditor) {
        console.log("Usuario sin rol auditor intentando /auditor → redirigiendo a", desiredHome);
        navigate(desiredHome, { replace: true });
        return true;
      }

      return true;
    };

    setTimeout(() => {
      validarAcceso();
      setCheckingAuth(false);
    }, 100);
  }, [navigate, hostname, pathname]);

  if (checkingAuth) {
    return <div>Cargando...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/auditor/*"
        element={
          <RequireAuth>
            <RequireRole allowed={['auditor']}>
              <Auditor />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/secretito"
        element={
          <RequireAuth>
            <Secret /> 
          </RequireAuth>
        }
      />

      <Route
        path="/*"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return <AppWrapper />;
}

export default App;
