// /admin/src/App.jsx 
import './App.css';
import React, { useEffect, useState, useMemo } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login/Login.jsx';
import Dashboard from './components/Dashboard/Dashboard.jsx';
import Auditor from './components/Auditor/Auditor.jsx';
import Secret from './components/Secret/Secret.jsx';

/* ============================
   JWT helpers
============================= */
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

function isTokenValid(decoded) {
  if (!decoded) return false;
  // validar exp (segundos desde epoch)
  if (typeof decoded.exp === 'number') {
    const nowSec = Math.floor(Date.now() / 1000);
    if (decoded.exp <= nowSec) return false;
  }
  return true;
}

function getCurrentRole() {
  const token = localStorage.getItem('token');
  const decoded = decodeJWT(token);
  return (decoded && decoded.role) ? decoded.role : 'unknown';
}

/* ============================
   Host/Role Guards (estrictos)
============================= */
function resolveHostContext(hostname) {
  if (hostname === 'admin.garageia.com') return 'admin';
  if (hostname === 'operador.garageia.com') return 'operador';

  const dev = (import.meta?.env?.VITE_DEV_HOST || '').toLowerCase();
  if (dev === 'admin' || dev === 'operador' || dev === 'auditor') return dev;
  return 'admin'; // default dev
}

function hasHostPermission(hostname, role) {
  if (!role) return false;
  const ctx = resolveHostContext(hostname);

  const ALLOWED_BY_CTX = {
    admin: new Set(['admin', 'superAdmin', 'auditor']),
    operador: new Set(['operador', 'admin', 'superAdmin', 'auditor']),
    auditor: new Set(['auditor'])
  };

  const allowed = ALLOWED_BY_CTX[ctx] || ALLOWED_BY_CTX.admin;
  return allowed.has(role);
}

function homePathByRole(role) {
  if (role === 'auditor') return '/auditor';
  return '/';
}

/** exact match helper */
function isAtRoute(pathname, base) {
  return pathname === base || pathname.startsWith(base + '/');
}

/* ============================
   Route Guards
============================= */
function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  const decoded = decodeJWT(token);
  const location = useLocation();

  if (!token || !decoded || !isTokenValid(decoded)) {
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

/* ============================
   App Wrapper
============================= */
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

      const decoded = decodeJWT(token);

      // 1) sin token o token inválido/expirado → login
      if (!token || !decoded || !isTokenValid(decoded)) {
        if (pathname !== '/login') {
          localStorage.setItem('redirectAfterLogin', pathname);
          navigate('/login', { replace: true });
        }
        return false;
      }

      const role = decoded.role || 'unknown';

      // 2) Guard por host/contexto: si no tiene permiso, forzar logout + mensaje
      if (!hasHostPermission(hostname, role)) {
        alert('No tienes permisos para acceder desde este entorno.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login', { replace: true });
        return false;
      }

      // 3) Si ya está autenticado y está en /login, redirigir
      if (pathname === '/login') {
        const target = redirectAfterLogin || homePathByRole(role);
        navigate(target, { replace: true });
        return true;
      }

      // 4) Regla específica de auditor
      const desiredHome = homePathByRole(role);
      const onAuditor = isAtRoute(pathname, '/auditor');
      const isAuditor = role === 'auditor';

      if (isAuditor && !onAuditor) {
        navigate('/auditor', { replace: true });
        return true;
      }

      // No tocar /auditoria (Dashboard) — sólo /auditor
      if (!isAuditor && onAuditor) {
        navigate(desiredHome, { replace: true });
        return true;
      }

      return true;
    };

    // ejecutar sincrónico; el setTimeout no es necesario
    validarAcceso();
    setCheckingAuth(false);
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
