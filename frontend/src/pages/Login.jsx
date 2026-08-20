import React, { useState } from 'react'           // Importa React y useState para manejar el estado del formulario.
import { Link, useNavigate } from 'react-router-dom' // Link crea enlaces. useNavigate permite redirigir a otra página.
import { iniciarSesion } from '../services/auth.js'  // Importa la función de inicio de sesión.

// ============================================================
// PÁGINA: Login
// ============================================================
// Muestra el formulario de inicio de sesión.
// Cuando el usuario envía el formulario, llama a iniciarSesion().
// Si es exitoso, redirige al dashboard.
// ============================================================
function Login() {

  const navigate = useNavigate() // Hook para redirigir al usuario después del login.

  // Estado del formulario: guarda lo que el usuario escribe.
  const [email, setEmail] = useState('')       // Almacena el email.
  const [password, setPassword] = useState('') // Almacena la contraseña.
  const [error, setError] = useState('')       // Almacena el mensaje de error si falla el login.
  const [cargando, setCargando] = useState(false) // Indica si se está procesando el formulario.

  // ============================================================
  // FUNCIÓN: handleSubmit
  // Maneja el envío del formulario de login.
  // ============================================================
  async function handleSubmit(e) {
    e.preventDefault() // Evita que el formulario recargue la página (comportamiento HTML por defecto).

    setError('')        // Limpia cualquier error anterior.
    setCargando(true)   // Activa el estado de carga para deshabilitar el botón.

    // Llama a la función de inicio de sesión con los datos del formulario.
    const { error } = await iniciarSesion(email, password)

    if (error) {
      // Si hay error, muestra el mensaje al usuario.
      setError('Correo o contraseña incorrectos. Intenta de nuevo.')
      setCargando(false) // Desactiva el estado de carga.
    } else {
      // Si el login fue exitoso, redirige al dashboard.
      navigate('/dashboard')
    }
  }

  return (
    // Contenedor principal: fondo gris, centrado vertical y horizontalmente.
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">

      {/* Caja del formulario: fondo blanco, sombra, bordes redondeados. */}
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">

        {/* Encabezado: ícono y título. */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎓</div>
          <h1 className="text-2xl font-bold text-gray-800">Educa AI</h1>
          <p className="text-gray-500 mt-1">Inicia sesión en tu cuenta</p>
        </div>

        {/* Formulario de login. onSubmit llama a handleSubmit cuando se envía. */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Campo de email. */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"                          // Valida que sea un formato de email.
              value={email}                         // El valor viene del estado.
              onChange={(e) => setEmail(e.target.value)} // Actualiza el estado cuando el usuario escribe.
              placeholder="tu@correo.com"
              required                              // Hace que el campo sea obligatorio.
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Campo de contraseña. */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"                           // Oculta el texto mientras se escribe.
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Mensaje de error (solo se muestra si hay un error). */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Botón de envío. Se deshabilita mientras se procesa el formulario. */}
          <button
            type="submit"
            disabled={cargando} // Deshabilita el botón mientras carga.
            className="w-full bg-indigo-600 text-white rounded-lg py-2.5 font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {/* Muestra "Iniciando sesión..." mientras carga, o "Iniciar sesión" normalmente. */}
            {cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>

        </form>

        {/* Enlace para ir a la página de registro. */}
        <p className="text-center text-gray-500 mt-6 text-sm">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-indigo-600 font-medium hover:underline">
            Regístrate aquí
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Login // Exporta el componente para usarlo en las rutas de App.jsx.
