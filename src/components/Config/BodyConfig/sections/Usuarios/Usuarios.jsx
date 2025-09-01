import React, { useEffect, useState } from 'react';
import './Usuarios.css';

const TZ = 'America/Argentina/Buenos_Aires';

function formatearFechaHora(v) {
  if (!v) return '—';
  let d;
  if (typeof v === 'number') d = new Date(v);
  else if (typeof v === 'string') d = new Date(v);
  else if (v?._seconds) d = new Date(v._seconds * 1000);
  else return '—';

  if (Number.isNaN(d.getTime())) return '—';

  // Ej: 01/09/2025 06:12
  return d.toLocaleString('es-AR', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [usuarioEditadoId, setUsuarioEditadoId] = useState(null);
  const [formUsuario, setFormUsuario] = useState({
    nombre: '',
    apellido: '',
    username: '',
    password: '',
    role: 'operador',
  });

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('https://api.garageia.com/api/auth/');
        if (!response.ok) throw new Error('Error al obtener usuarios');
        const data = await response.json();
        setUsuarios(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormUsuario((prev) => ({ ...prev, [name]: value }));
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Seguro que querés eliminar este usuario?')) return;
    try {
      const res = await fetch(`https://api.garageia.com/api/auth/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar el usuario');
      setUsuarios((prev) => prev.filter((u) => u._id !== id));
      alert('Usuario eliminado correctamente');
    } catch (err) {
      console.error(err);
      alert('Hubo un error al eliminar el usuario');
    }
  };

  const handleEditar = (id) => {
    const usuario = usuarios.find((u) => u._id === id);
    if (!usuario) return;
    const { nombre='', apellido='', username='', role='operador' } = usuario;
    setFormUsuario({ nombre, apellido, username, role, password: '' });
    setUsuarioEditadoId(id);
    setEditando(true);
    setModalOpen(true);
  };

  const handleGuardarEdicion = async () => {
    try {
      // No mandes password vacío
      const payload = { ...formUsuario };
      if (!payload.password) delete payload.password;

      const res = await fetch(`https://api.garageia.com/api/auth/${usuarioEditadoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.msg || 'Error al editar usuario');

      setUsuarios((prev) =>
        prev.map((u) => (u._id === usuarioEditadoId ? { ...u, ...data } : u))
      );
      cerrarModal();
      alert('Usuario actualizado correctamente');
    } catch (err) {
      console.error(err);
      alert('Hubo un error al editar el usuario');
    }
  };

  const handleCrearUsuario = async () => {
    try {
      const res = await fetch('https://api.garageia.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formUsuario),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.msg || 'Error al crear usuario');

      // Usá el usuario real que devuelve el backend
      const creado = data?.usuario || data?.user || data;
      setUsuarios((prev) => [...prev, creado]);
      cerrarModal();
      alert(data?.msg || 'Usuario creado');
    } catch (err) {
      console.error('Error al crear usuario:', err);
      alert(err.message || 'Error al crear usuario');
    }
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setEditando(false);
    setUsuarioEditadoId(null);
    setFormUsuario({
      nombre: '',
      apellido: '',
      username: '',
      password: '',
      role: 'operador',
    });
  };

  return (
    <div className="usuarios-container">
      <h2 className="usuarios-titulo">Gestión de Usuarios</h2>

      {loading ? (
        <p>Cargando usuarios...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <>
          <table className="usuarios-table">
            <thead>
              <tr>
                <th className="columna-numero">#</th>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Último acceso</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario, index) => (
                <tr key={usuario._id || usuario.id || index}>
                  <td className="fila-numero">{index + 1}</td>
                  <td>{usuario.nombre || '—'}</td>
                  <td>{usuario.apellido || '—'}</td>
                  <td>{usuario.username || '—'}</td>
                  <td>{usuario.role || '—'}</td>
                  <td>{formatearFechaHora(usuario.ultimoAcceso || usuario.lastLogin || usuario.updatedAt)}</td>
                  <td>
                    <button
                      onClick={() => handleEditar(usuario._id)}
                      className="usuarios-boton boton-editar"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(usuario._id)}
                      className="usuarios-boton boton-eliminar"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={() => {
              setModalOpen(true);
              setEditando(false);
              setFormUsuario({
                nombre: '',
                apellido: '',
                username: '',
                password: '',
                role: 'operador',
              });
            }}
            className="usuarios-boton boton-crear"
          >
            Crear Usuario
          </button>
        </>
      )}

      {modalOpen && (
        <div className="modalUsers">
          <div className="modal-content">
            <h3>{editando ? 'Editar Usuario' : 'Crear Usuario'}</h3>
            <form onSubmit={(e) => e.preventDefault()}>
              <div>
                <label>Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formUsuario.nombre}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label>Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  value={formUsuario.apellido}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label>Usuario</label>
                <input
                  type="text"
                  name="username"
                  value={formUsuario.username}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label>Contraseña</label>
                <input
                  type="password"
                  name="password"
                  value={formUsuario.password}
                  onChange={handleInputChange}
                  placeholder={editando ? '(Dejar en blanco para no cambiar)' : ''}
                />
              </div>
              <div>
                <label>Rol</label>
                <select
                  name="role"
                  value={formUsuario.role}
                  onChange={handleInputChange}
                >
                  <option value="operador">Operador</option>
                  <option value="superAdmin">Super Admin</option>
                  <option value="auditor">Auditor</option>
                </select>
              </div>

              {/* Acciones perfectamente alineadas */}
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="usuarios-boton boton-cancelar"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={editando ? handleGuardarEdicion : handleCrearUsuario}
                  className="usuarios-boton boton-crear"
                >
                  {editando ? 'Guardar Cambios' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
