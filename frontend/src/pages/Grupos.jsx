import { useState, useEffect } from 'react'              // Hooks de React.
import { useNavigate } from 'react-router-dom'           // Para navegar entre páginas.
import { useAuth } from '../context/AuthContext.jsx'     // Para saber quién es el usuario.
import { obtenerMisGrupos, unirseAGrupo } from '../services/grupos.js' // Funciones de grupos.
import CrearGrupo from '../components/CrearGrupo.jsx'   // Modal para crear grupos.
import { cerrarSesion } from '../services/auth.js'       // Para cerrar sesión.

// ============================================================
// COMPONENTE: Grupos
// ============================================================
// Página principal de grupos.
// - Los profesores ven sus grupos y pueden crear nuevos.
// - Los estudiantes ven sus grupos y pueden unirse con un código.
// ============================================================
export default function Grupos() {

  // Lista de grupos del usuario (empieza vacía).
  const [grupos, setGrupos] = useState([])

  // Controla si el modal de "Crear grupo" está visible.
  const [mostrarModal, setMostrarModal] = useState(false)

  // Código que escribe el estudiante para unirse a un grupo.
  const [codigoIngreso, setCodigoIngreso] = useState('')

  // Mensaje de error general de la página.
  const [error, setError] = useState('')

  // Mensaje de éxito (por ejemplo, cuando se une a un grupo).
  const [exito, setExito] = useState('')

  // Estado de carga mientras se buscan los grupos.
  const [cargando, setCargando] = useState(true)

  // Estado de carga para el botón de unirse.
  const [uniendose, setUniendose] = useState(false)

  // Obtenemos la información del usuario actual.
  const { perfil } = useAuth()

  // Para navegar a otras páginas.
  const navigate = useNavigate()

  // ============================================================
  // EFECTO: Cargar los grupos al abrir la página
  // ============================================================
  useEffect(() => {
    // Solo cargamos si ya tenemos el perfil del usuario.
    if (perfil) {
      cargarGrupos()
    }
  }, [perfil]) // Se ejecuta cuando "perfil" cambia (cuando el usuario carga).

  // ============================================================
  // FUNCIÓN: cargarGrupos
  // ============================================================
  // Obtiene los grupos del usuario desde Supabase.
  // ============================================================
  async function cargarGrupos() {
    setCargando(true) // Muestra el spinner de carga.

    // Llama a la función que consulta Supabase según el rol.
    const { data, error: errorCarga } = await obtenerMisGrupos(perfil.id, perfil.role)

    setCargando(false) // Oculta el spinner.

    // Si hay error, lo mostramos.
    if (errorCarga) {
      setError('Error al cargar los grupos.')
      return
    }

    // Guardamos los grupos en el estado.
    setGrupos(data || [])
  }

  // ============================================================
  // FUNCIÓN: handleGrupoCreado
  // ============================================================
  // Se llama cuando el modal crea un grupo exitosamente.
  // Agrega el nuevo grupo a la lista sin recargar todo.
  // ============================================================
  function handleGrupoCreado(nuevoGrupo) {
    setMostrarModal(false)                   // Cierra el modal.
    setGrupos(prev => [nuevoGrupo, ...prev]) // Agrega el grupo al inicio de la lista.
    setExito('¡Grupo creado exitosamente!')  // Muestra mensaje de éxito.
    setTimeout(() => setExito(''), 4000)     // Oculta el mensaje después de 4 segundos.
  }

  // ============================================================
  // FUNCIÓN: handleUnirse
  // ============================================================
  // Se llama cuando el estudiante hace clic en "Unirse".
  // Busca el grupo por código y lo agrega como miembro.
  // ============================================================
  async function handleUnirse(e) {
    e.preventDefault() // Evita que la página se recargue.

    // Valida que el código no esté vacío.
    if (!codigoIngreso.trim()) {
      setError('Escribe el código de acceso del grupo.')
      return
    }

    setUniendose(true) // Muestra spinner en el botón.
    setError('')       // Limpia errores anteriores.

    // Intenta unirse al grupo con ese código.
    const { grupo, error: errorUnirse } = await unirseAGrupo(codigoIngreso.trim(), perfil.id)

    setUniendose(false) // Oculta spinner.

    // Si hubo error, lo mostramos.
    if (errorUnirse) {
      setError(errorUnirse.message || 'Error al unirse al grupo.')
      return
    }

    // Si se unió correctamente, actualizamos la lista y mostramos éxito.
    setCodigoIngreso('')                       // Limpia el campo de código.
    setExito(`¡Te uniste a "${grupo.name}" exitosamente!`) // Mensaje de éxito.
    setTimeout(() => setExito(''), 4000)       // Oculta el mensaje después de 4 segundos.
    cargarGrupos()                             // Recarga la lista de grupos.
  }

  // ============================================================
  // FUNCIÓN: handleLogout
  // ============================================================
  // Cierra la sesión y redirige al login.
  // ============================================================
  async function handleLogout() {
    await cerrarSesion() // Cierra la sesión en Supabase.
    navigate('/login')   // Redirige a la página de login.
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    // Contenedor principal de la página.
    <div className="min-h-screen bg-gray-50">

      {/* ---- NAVBAR ---- */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">

          {/* Logo — al hacer clic va al dashboard */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-primary font-bold text-xl"
          >
            🎓 Educa AI
          </button>

          {/* Información del usuario y botón de logout */}
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium">{perfil?.name}</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              perfil?.role === 'teacher'
                ? 'bg-purple-100 text-purple-700' // Color morado para profesores.
                : 'bg-blue-100 text-blue-700'     // Color azul para estudiantes.
            }`}>
              {/* Muestra "Profesor" o "Estudiante" según el rol */}
              {perfil?.role === 'teacher' ? 'Profesor' : 'Estudiante'}
            </span>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 text-sm transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      {/* ---- CONTENIDO PRINCIPAL ---- */}
      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Encabezado de la sección */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {/* Título diferente según el rol */}
            {perfil?.role === 'teacher' ? 'Mis grupos' : 'Mis clases'}
          </h1>

          {/* Botón "Crear grupo" solo visible para profesores */}
          {perfil?.role === 'teacher' && (
            <button
              onClick={() => setMostrarModal(true)} // Abre el modal.
              className="bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary/90 transition font-medium flex items-center gap-2"
            >
              + Crear grupo
            </button>
          )}
        </div>

        {/* ---- SECCIÓN PARA ESTUDIANTES: Unirse con código ---- */}
        {perfil?.role === 'student' && (
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Unirte a un grupo
            </h2>
            <form onSubmit={handleUnirse} className="flex gap-3">
              <input
                type="text"
                value={codigoIngreso}
                onChange={e => setCodigoIngreso(e.target.value.toUpperCase())} // Convierte a mayúsculas automáticamente.
                placeholder="Ingresa el código de acceso (ej: K7PQMZ)"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary font-mono tracking-widest"
                maxLength={6} // El código tiene exactamente 6 caracteres.
              />
              <button
                type="submit"
                disabled={uniendose} // Desactiva mientras carga.
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition font-medium disabled:opacity-50"
              >
                {uniendose ? 'Uniéndose...' : 'Unirse'}
              </button>
            </form>
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Mensaje de éxito */}
        {exito && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {exito}
          </div>
        )}

        {/* ---- LISTA DE GRUPOS ---- */}
        {cargando ? (
          // Spinner de carga.
          <div className="text-center py-12 text-gray-400">
            Cargando grupos...
          </div>
        ) : grupos.length === 0 ? (
          // Mensaje cuando no hay grupos.
          <div className="text-center py-16">
            <div className="text-6xl mb-4">
              {perfil?.role === 'teacher' ? '📚' : '🎒'}
            </div>
            <p className="text-gray-500 text-lg">
              {perfil?.role === 'teacher'
                ? 'Aún no has creado ningún grupo. ¡Crea el primero!'
                : 'Aún no perteneces a ningún grupo. Pide el código a tu profesor.'}
            </p>
          </div>
        ) : (
          // Grid de tarjetas de grupos.
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {grupos.map(grupo => (
              // Tarjeta de cada grupo.
              <div
                key={grupo.id}  // Key única para React.
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100"
                onClick={() => navigate(`/grupos/${grupo.id}`)} // Al hacer clic, va al grupo.
              >
                {/* Ícono y nombre del grupo */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg leading-tight">
                      {grupo.name}
                    </h3>
                    {grupo.description && (
                      <p className="text-gray-500 text-sm mt-1">
                        {grupo.description}
                      </p>
                    )}
                  </div>
                  <span className="text-2xl">📖</span>
                </div>

                {/* Código de acceso — solo visible para profesores */}
                {perfil?.role === 'teacher' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">Código de acceso</p>
                    <p className="font-mono font-bold text-primary text-lg tracking-widest">
                      {grupo.access_code}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ---- MODAL: Crear grupo (solo se muestra si mostrarModal es true) ---- */}
      {mostrarModal && (
        <CrearGrupo
          onGrupoCreado={handleGrupoCreado}      // Cuando se crea, actualiza la lista.
          onCancelar={() => setMostrarModal(false)} // Cuando cancela, cierra el modal.
        />
      )}
    </div>
  )
}
