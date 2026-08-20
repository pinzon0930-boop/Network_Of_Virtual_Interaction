import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { cerrarSesion } from '../services/auth.js'
import {
  obtenerMensajes,
  enviarMensaje,
  suscribirseAMensajes,
  desuscribirse
} from '../services/mensajes.js'
import {
  obtenerActividades,
  entregarActividad,
  obtenerMisEntregas
} from '../services/actividades.js'
import CrearActividad from '../components/CrearActividad.jsx'

// ============================================================
// PÁGINA: GrupoDetalle (con diseño responsive para móvil)
// ============================================================
export default function GrupoDetalle() {

  const { id: grupoId } = useParams()
  const [pestañaActiva, setPestañaActiva] = useState('chat')
  const { perfil } = useAuth()
  const navigate = useNavigate()

  // ---- Estado: Chat ----
  const [mensajes,      setMensajes]      = useState([])
  const [nuevoMensaje,  setNuevoMensaje]  = useState('')
  const [enviando,      setEnviando]      = useState(false)
  const [cargandoChat,  setCargandoChat]  = useState(true)
  const [errorChat,     setErrorChat]     = useState('')
  const finalMensajesRef = useRef(null)

  // ---- Estado: Actividades ----
  const [actividades,            setActividades]            = useState([])
  const [cargandoActividades,    setCargandoActividades]    = useState(false)
  const [misEntregas,            setMisEntregas]            = useState([])
  const [mostrarCrearActividad,  setMostrarCrearActividad]  = useState(false)
  const [entregando,             setEntregando]             = useState(null)
  const [errorActividades,       setErrorActividades]       = useState('')
  const [exitoActividades,       setExitoActividades]       = useState('')

  // ============================================================
  // EFECTOS
  // ============================================================
  useEffect(() => {
    if (!grupoId || !perfil) return
    cargarMensajes()
    const canal = suscribirseAMensajes(grupoId, (mensajeNuevo) => {
      setMensajes(prev => {
        const yaExiste = prev.some(m => m.id === mensajeNuevo.id)
        if (yaExiste) return prev
        return [...prev, mensajeNuevo]
      })
    })
    return () => { desuscribirse(canal) }
  }, [grupoId, perfil])

  useEffect(() => {
    finalMensajesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  useEffect(() => {
    if (!grupoId || !perfil || pestañaActiva !== 'actividades') return
    cargarActividades()
  }, [grupoId, perfil, pestañaActiva])

  // ============================================================
  // FUNCIONES
  // ============================================================
  async function cargarMensajes() {
    setCargandoChat(true)
    const { data, error } = await obtenerMensajes(grupoId)
    setCargandoChat(false)
    if (error) { setErrorChat('Error al cargar el chat.'); return }
    setMensajes(data || [])
  }

  async function handleEnviar(e) {
    e.preventDefault()
    if (!nuevoMensaje.trim() || enviando) return
    setEnviando(true)
    const textoAEnviar = nuevoMensaje.trim()
    setNuevoMensaje('')
    const { error } = await enviarMensaje(grupoId, perfil.id, textoAEnviar)
    setEnviando(false)
    if (error) {
      setNuevoMensaje(textoAEnviar)
      setErrorChat('Error al enviar el mensaje.')
    }
  }

  async function cargarActividades() {
    setCargandoActividades(true)
    setErrorActividades('')
    const { data, error } = await obtenerActividades(grupoId)
    if (error) {
      setErrorActividades('Error al cargar las actividades.')
      setCargandoActividades(false)
      return
    }
    setActividades(data || [])
    if (perfil.role === 'student') {
      const { data: entregas } = await obtenerMisEntregas(perfil.id)
      setMisEntregas((entregas || []).map(e => e.activity_id))
    }
    setCargandoActividades(false)
  }

  async function handleEntregar(actividadId) {
    setEntregando(actividadId)
    const { error } = await entregarActividad(actividadId, perfil.id)
    setEntregando(null)
    if (error) { setErrorActividades('Error al entregar la actividad.'); return }
    setMisEntregas(prev => [...prev, actividadId])
    setExitoActividades('¡Actividad marcada como entregada!')
    setTimeout(() => setExitoActividades(''), 3000)
  }

  function handleActividadCreada(nuevaActividad) {
    setMostrarCrearActividad(false)
    setActividades(prev => [nuevaActividad, ...prev])
    setExitoActividades('¡Actividad creada exitosamente!')
    setTimeout(() => setExitoActividades(''), 3000)
  }

  async function handleLogout() {
    await cerrarSesion()
    navigate('/login')
  }

  function formatearHora(fechaISO) {
    return new Date(fechaISO).toLocaleTimeString('es-CO', {
      hour: '2-digit', minute: '2-digit',
    })
  }

  function formatearFecha(fechaISO) {
    if (!fechaISO) return null
    return new Date(fechaISO).toLocaleDateString('es-CO', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    // h-screen + flex-col para que ocupe exactamente la pantalla en móvil.
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">

      {/* ---- NAVBAR ---- */}
      <nav className="bg-white shadow-sm flex-shrink-0">
        <div className="max-w-6xl mx-auto px-3 py-3 flex items-center justify-between">

          {/* Izquierda: volver + logo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/grupos')}
              className="text-gray-400 hover:text-gray-600 transition text-xl p-1"
            >
              ←
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 text-primary font-bold text-base sm:text-xl"
            >
              🎓 <span className="hidden sm:inline">Educa AI</span>
            </button>
          </div>

          {/* Derecha: nombre (oculto en móvil) + rol + logout */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Nombre — solo en pantallas medianas+ */}
            <span className="hidden sm:block text-gray-700 font-medium text-sm">
              {perfil?.name}
            </span>
            {/* Badge de rol */}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              perfil?.role === 'teacher'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {perfil?.role === 'teacher' ? 'Profesor' : 'Estudiante'}
            </span>
            {/* Botón logout — texto completo en desktop, ícono en móvil */}
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 transition text-sm"
              title="Cerrar sesión"
            >
              <span className="hidden sm:inline">Cerrar sesión</span>
              <span className="sm:hidden text-base">✕</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ---- ÁREA PRINCIPAL: ocupa el espacio restante ---- */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-2 sm:px-4 py-3 sm:py-6 flex flex-col min-h-0">

        {/* ---- CABECERA CON PESTAÑAS ---- */}
        <div className="bg-white rounded-t-xl px-4 pt-3 pb-0 shadow-sm flex-shrink-0">
          <h1 className="font-bold text-gray-800 text-sm sm:text-lg mb-2 sm:mb-3">
            {perfil?.role === 'teacher' ? '👨‍🏫 Mi grupo' : '📚 Mi clase'}
          </h1>
          <div className="flex gap-1 border-b border-gray-100">
            <button
              onClick={() => setPestañaActiva('chat')}
              className={`px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium transition border-b-2 -mb-px ${
                pestañaActiva === 'chat'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              💬 Chat
            </button>
            <button
              onClick={() => setPestañaActiva('actividades')}
              className={`px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium transition border-b-2 -mb-px ${
                pestañaActiva === 'actividades'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📋 Actividades
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* PESTAÑA: CHAT                                                 */}
        {/* ============================================================ */}
        {pestañaActiva === 'chat' && (
          // flex-col + flex-1 + min-h-0 para que el chat ocupe el espacio restante.
          <div className="flex-1 flex flex-col min-h-0">

            {errorChat && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-xs">
                {errorChat}
              </div>
            )}

            {/* Lista de mensajes — overflow-y-auto para scroll */}
            <div className="flex-1 bg-white px-3 sm:px-6 py-4 overflow-y-auto shadow-sm min-h-0">
              {cargandoChat ? (
                <div className="text-center text-gray-400 py-8 text-sm">
                  Cargando mensajes...
                </div>
              ) : mensajes.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <div className="text-4xl mb-2">💬</div>
                  <p className="text-sm">Sé el primero en escribir algo</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {mensajes.map(mensaje => {
                    const esMio = mensaje.user_id === perfil?.id
                    return (
                      <div key={mensaje.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] sm:max-w-md ${esMio ? 'items-end' : 'items-start'} flex flex-col`}>
                          {!esMio && (
                            <span className="text-xs text-gray-500 mb-1 ml-1">
                              {mensaje.users?.name}
                              {mensaje.users?.role === 'teacher' && (
                                <span className="ml-1 text-purple-500">· Profesor</span>
                              )}
                            </span>
                          )}
                          <div className={`px-3 py-2 sm:px-4 rounded-2xl text-sm ${
                            esMio
                              ? 'bg-primary text-white rounded-br-none'
                              : 'bg-gray-100 text-gray-800 rounded-bl-none'
                          }`}>
                            {mensaje.content}
                          </div>
                          <span className="text-xs text-gray-400 mt-1 mx-1">
                            {formatearHora(mensaje.created_at)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={finalMensajesRef} />
                </div>
              )}
            </div>

            {/* Input de mensaje — siempre visible en la parte de abajo */}
            <div className="bg-white rounded-b-xl px-3 sm:px-4 py-3 shadow-sm border-t border-gray-100 flex-shrink-0">
              <form onSubmit={handleEnviar} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={nuevoMensaje}
                  onChange={e => setNuevoMensaje(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  maxLength={1000}
                  disabled={enviando}
                />
                <button
                  type="submit"
                  disabled={enviando || !nuevoMensaje.trim()}
                  className="bg-primary text-white w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-primary/90 transition disabled:opacity-40 flex-shrink-0 text-sm"
                >
                  ➤
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PESTAÑA: ACTIVIDADES                                          */}
        {/* ============================================================ */}
        {pestañaActiva === 'actividades' && (
          <div className="flex-1 bg-white rounded-b-xl shadow-sm flex flex-col min-h-0">

            {/* Cabecera: descripción + botón crear */}
            <div className="px-4 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0 gap-2">
              <p className="text-gray-500 text-xs sm:text-sm">
                {perfil?.role === 'teacher'
                  ? 'Crea y gestiona las actividades.'
                  : 'Actividades de tu profesor.'}
              </p>
              {perfil?.role === 'teacher' && (
                <button
                  onClick={() => setMostrarCrearActividad(true)}
                  className="bg-primary text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-primary/90 transition text-xs sm:text-sm font-medium flex-shrink-0"
                >
                  + Nueva
                </button>
              )}
            </div>

            {/* Mensajes de error y éxito */}
            {errorActividades && (
              <div className="mx-4 mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-xs">
                {errorActividades}
              </div>
            )}
            {exitoActividades && (
              <div className="mx-4 mt-3 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-xs">
                {exitoActividades}
              </div>
            )}

            {/* Lista de actividades con scroll */}
            <div className="flex-1 px-4 py-4 overflow-y-auto min-h-0">
              {cargandoActividades ? (
                <div className="text-center text-gray-400 py-12 text-sm">
                  Cargando actividades...
                </div>
              ) : actividades.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl sm:text-6xl mb-4">📋</div>
                  <p className="text-gray-500 text-sm sm:text-lg">
                    {perfil?.role === 'teacher'
                      ? '¡Crea la primera actividad!'
                      : 'Tu profesor aún no ha publicado actividades.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {actividades.map(actividad => {
                    const yaEntregada = misEntregas.includes(actividad.id)
                    return (
                      <div
                        key={actividad.id}
                        className="border border-gray-100 rounded-xl p-4 sm:p-5 hover:shadow-sm transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-800 text-sm sm:text-base">
                              {actividad.title}
                            </h3>
                            {actividad.description && (
                              <p className="text-gray-500 text-xs sm:text-sm mt-1">
                                {actividad.description}
                              </p>
                            )}
                            {actividad.due_date && (
                              <p className="text-xs text-orange-500 mt-2 font-medium">
                                📅 {formatearFecha(actividad.due_date)}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {formatearFecha(actividad.created_at)}
                            </p>
                          </div>

                          {/* Botón de entrega (estudiantes) */}
                          {perfil?.role === 'student' && (
                            <div className="flex-shrink-0">
                              {yaEntregada ? (
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                  ✓ Entregada
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleEntregar(actividad.id)}
                                  disabled={entregando === actividad.id}
                                  className="bg-primary text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm hover:bg-primary/90 transition disabled:opacity-50"
                                >
                                  {entregando === actividad.id ? '...' : 'Entregar'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Modal: Crear actividad */}
      {mostrarCrearActividad && (
        <CrearActividad
          grupoId={grupoId}
          onActividadCreada={handleActividadCreada}
          onCancelar={() => setMostrarCrearActividad(false)}
        />
      )}
    </div>
  )
}
