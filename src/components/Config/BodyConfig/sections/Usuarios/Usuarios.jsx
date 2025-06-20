import React, { useEffect, useState } from 'react';
import './Usuarios.css';

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
    const obtenerUsuarios = async () => {
      try {
        const response = await fetch('https://api.garageia.com/api/auth/');
        if (!response.ok) throw new Error('Error al obtener usuarios');
        const data = await response.json();
        setUsuarios(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    obtenerUsuarios();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormUsuario((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿Seguro que querés eliminar este usuario?")) {
      try {
        const res = await fetch(`https://api.garageia.com/api/auth/${id}`, {
          method: 'DELETE',
        });

        if (!res.ok) throw new Error('Error al eliminar el usuario');

        setUsuarios(usuarios.filter((u) => u._id !== id));
        alert("Usuario eliminado correctamente");
      } catch (err) {
        console.error(err);
        alert("Hubo un error al eliminar el usuario");
      }
    }
  };

  const handleEditar = (id) => {
    const usuario = usuarios.find((u) => u._id === id);
    if (usuario) {
      setFormUsuario({ ...usuario, password: '' }); // No mostramos contraseña
      setUsuarioEditadoId(id);
      setEditando(true);
      setModalOpen(true);
    }
  };

  const handleGuardarEdicion = async () => {
    try {
      const res = await fetch(`https://api.garageia.com/api/auth/${usuarioEditadoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formUsuario),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.msg || 'Error al editar usuario');

      setUsuarios(usuarios.map((u) =>
        u._id === usuarioEditadoId ? { ...u, ...formUsuario } : u
      ));
      setModalOpen(false);
      setEditando(false);
      setUsuarioEditadoId(null);
      alert("Usuario actualizado correctamente");
    } catch (err) {
      console.error(err);
      alert("Hubo un error al editar el usuario");
    }
  };

  const handleCrearUsuario = async () => {
    try {
      const res = await fetch('https://api.garageia.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formUsuario),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.msg);
        setUsuarios([...usuarios, formUsuario]);
        setModalOpen(false);
      } else {
        alert(data.msg || 'Error al crear usuario');
      }
    } catch (err) {
      console.error('Error al crear usuario:', err);
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
      <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px" }}>
        Gestión de Usuarios
      </h2>

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
                <tr key={usuario._id}>
                  <td className="fila-numero">{index + 1}</td>
                  <td>{usuario.nombre}</td>
                  <td>{usuario.apellido}</td>
                  <td>{usuario.username}</td>
                  <td>{usuario.role}</td>
                  <td>{usuario.ultimoAcceso}</td>
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
            <form>
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
                  placeholder={editando ? "(Dejar en blanco para no cambiar)" : ""}
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
                </select>
              </div>
              <button
                type="button"
                onClick={editando ? handleGuardarEdicion : handleCrearUsuario}
                className="usuarios-boton boton-crear"
              >
                {editando ? 'Guardar Cambios' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={cerrarModal}
                className="usuarios-boton boton-cancelar"
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
