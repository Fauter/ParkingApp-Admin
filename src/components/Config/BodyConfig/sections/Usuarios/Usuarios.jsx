import React, { useEffect, useState } from 'react';
import './Usuarios.css';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false); // Estado para controlar el modal
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '',
    apellido: '',
    username: '',
    password: '',
    role: 'operador',
  });

  // Para simular datos mientras tanto
  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        const response = await fetch('https://parkingapp-back.onrender.com/api/auth/');
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

  const handleEditar = (id) => {
    console.log("Editar usuario:", id);
    // abrir modal o redirigir a formulario
  };

  const handleEliminar = (id) => {
    if (window.confirm("¿Seguro que querés eliminar este usuario?")) {
      setUsuarios(usuarios.filter(u => u.id !== id));
    }
  };

  const handleCrearUsuario = async () => {
    try {
      const res = await fetch('https://parkingapp-back.onrender.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nuevoUsuario),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.msg);
        setUsuarios([...usuarios, nuevoUsuario]); // Añadir el nuevo usuario a la lista
        setModalOpen(false); // Cerrar el modal después de crear el usuario
      } else {
        alert(data.msg || 'Error al crear usuario');
      }
    } catch (err) {
      console.error('Error al crear usuario:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoUsuario((prevState) => ({
      ...prevState,
      [name]: value,
    }));
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
                <tr key={usuario.id}>
                  <td className="fila-numero">{index + 1}</td>
                  <td>{usuario.nombre}</td>
                  <td>{usuario.apellido}</td>
                  <td>{usuario.username}</td>
                  <td>{usuario.role}</td>
                  <td>{usuario.ultimoAcceso}</td>
                  <td>
                    <button
                      onClick={() => handleEditar(usuario.id)}
                      className="usuarios-boton boton-editar"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(usuario.id)}
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
            onClick={() => setModalOpen(true)} // Abrir el modal
            className="usuarios-boton boton-crear"
          >
            Crear Usuario
          </button>
        </>
      )}

      {/* Modal para Crear Usuario */}
      {modalOpen && (
        <div className="modalUsers">
          <div className="modal-content">
            <h3>Crear Usuario</h3>
            <form>
              <div>
                <label>Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={nuevoUsuario.nombre}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label>Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  value={nuevoUsuario.apellido}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label>Usuario</label>
                <input
                  type="text"
                  name="username"
                  value={nuevoUsuario.username}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label>Contraseña</label>
                <input
                  type="password"
                  name="password"
                  value={nuevoUsuario.password}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label>Rol</label>
                <select
                  name="role"
                  value={nuevoUsuario.role}
                  onChange={handleInputChange}
                >
                  <option value="operador">Operador</option>
                  <option value="admin">Admin</option>
                  <option value="superAdmin">Super Admin</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleCrearUsuario}
                className="usuarios-boton boton-crear"
              >
                Crear
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)} // Cerrar el modal
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
