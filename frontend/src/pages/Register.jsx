import React, { useState } from 'react'              // Importa React y useState para manejar el formulario.
import { Link, useNavigate } from 'react-router-dom'  // Link y useNavigate para navegar entre páginas.
import { registrarUsuario } from '../services/auth.js' // Importa la función de registro.

// ============================================================
// PÁGINA: Register
// ============================================================
// Muestra el formulario de registro con campos para:
// nombre, correo, contraseña y rol (profesor o estudiante).
// ============================================================
function Register() {

  const navigate = useNavigate() // Hook para redirigir al usuario después del registro.

  // Estado del formulario.
  const [name, setName] = useState('')           // Nombre del usuario.
  const [email, setEmail] = useState('')         // Correo electrónico.
  const [password, setPassword] = useState('')   // Contraseña.
  const [role, setRole] = useState('student')    // Rol: 'student' por defecto.
  const [error, setError] = useState('')         // Mensaje de error.
  const [cargando, setCargando] = useState(false) // Estado de carga.

  // ============================================================
  // FUNCIÓN: handleSubmit
  // Maneja el envío del formulario de registro.
  // ============================================================
  async function handleSubmit(e) {
    e.preventDefault() // Evita que el formulario recargue la página.

    // Validación básica: la contraseña debe tener al menos 6 caracteres.
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return // Detiene la función si la validación falla.
    }

    setError('')
    setCargando(true)

    // Llama a la función de registro con todos los datos del formulario.
    const { error } = await registrarUsuario(email, password, name, role)

    if (error) {
      // Muestra el mensaje de error en español.
      if (error.message.includes('already registered')) {
        setError('Este correo ya está registrado. Intenta iniciar sesión.')
      } else {
        setError('Error al registrarse. Intenta de nuevo.')
      }
      setCargando(false)
    } else {
      // Registro exitoso. Redirige al dashboard.
      navigate('/dashboard')
    }
  }

  return (
    // Contenedor principal centrado.
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">

      {/* Caja del formulario. */}
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">

        {/* Encabezado. */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎓</div>
          <h1 className="text-2xl font-bold text-gray-800">Educa AI</h1>
          <p className="text-gray-500 mt-1">Crea tu cuenta</p>
        </div>

        {/* Formulario de registro. */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Campo de nombre. */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Campo de email. */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Campo de contraseña. */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Selector de rol: profesor o estudiante. */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Soy...
            </label>
            {/* Dos botones para elegir el rol, como un toggle visual. */}
            <div className="grid grid-cols-2 gap-3">

              {/* Botón de Estudiante. */}
              <button
                type="button" // type="button" evita que este botón envíe el formulario.
                onClick={() => setRole('student')} // Cambia el rol a 'student'.
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  role === 'student'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' // Estilo activo.
                    : 'border-gray-200 text-gray-500 hover:border-gray-300' // Estilo inactivo.
                }`}
              >
                <div className="text-2xl mb-1">📚</div>
                <div className="text-sm font-medium">Estudiante</div>
              </button>

              {/* Botón de Profesor. */}
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  role === 'teacher'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">👨‍🏫</div>
                <div className="text-sm font-medium">Profesor</div>
              </button>

            </div>
          </div>

          {/* Mensaje de error. */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Botón de envío. */}
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-indigo-600 text-white rounded-lg py-2.5 font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>

        </form>

        {/* Enlace para ir al login. */}
        <p className="text-center text-gray-500 mt-6 text-sm">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">
            Inicia sesión
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Register // Exporta el componente.
