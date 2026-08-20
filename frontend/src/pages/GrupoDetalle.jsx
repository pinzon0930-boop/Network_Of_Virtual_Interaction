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
// PÁGINA: GrupoDetalle — Chat y Actividades del grupo
// ============================================================
export default function GrupoDetalle() {

  const { id: grupoId } = useParams()
  const [pestañaActiva, setPestañaActiva] = useState('chat')
  const { perfil } = useAuth()
  const navigate = useNavigate()

  // Estado: Chat
  const [mensajes,      setMensajes]      = useState([])
  const [nuevoMensaje,  setNuevoMensaje]  = useState('')
  const [enviando,      setEnviando]      = useState(false)
  const [cargandoChat,  setCargandoChat]  = useState(true)
  const [errorChat,     setErrorChat]     = useState('')
  const finalMensajesRef = useRef(null)

  // Estado: Actividades
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
    if (error) { setNuevoMensaje(textoAEnviar); setErrorChat('Error al enviar el mensaje.') }
  }

  async function cargarActividades() {
    setCargandoActividades(true)
    setErrorActividades('')
    const { data, error } = await obtenerActividades(grupoId)
    if (error) { setErrorActividades('Error al cargar las actividades.'); setCargandoActividades(false); return }
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
    return new Date(fechaISO).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  }

  function formatearFecha(fechaISO) {
    if (!fechaISO) return null
    return new Date(fechaISO).toLocaleDateString('es-CO', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  // Genera un color de avatar consistente según el nombre
  function colorAvatar(nombre) {
    const colores = [
      'bg-blue-500', 'bg-indigo-500', 'bg-violet-500',
      'bg-sky-500', 'bg-teal-500', 'bg-emerald-500',
      'bg-rose-500', 'bg-orange-500',
    ]
    const idx = (nombre?.charCodeAt(0) || 0) % colores.length
    return colores[idx]
  }

  const esProfesor = perfil?.role === 'teacher'

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">

      {/* ---- NAVBAR ---- */}
      <nav className="bg-slate-900 border-b border-slate-700/60 flex-shrink-0">
        <div className="max-w-5xl mx-auto px-3 py-3 flex items-center justify-between">

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/grupos')}
              className="text-slate-400 hover:text-white transition-colors p-1"
              title="Volver a grupos"
            >
              ←
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-white font-bold"
            >
              <span className="text-xl">🎓</span>
              <span className="hidden sm:inline text-base">Educa AI</span>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:block text-slate-300 text-sm">{perfil?.name}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              esProfesor
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
            }`}>
              {esProfesor ? 'Profesor' : 'Estudiante'}
            </span>
            <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors text-sm">
              <span className="hidden sm:inline">Salir</span>
              <span className="sm:hidden">✕</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ---- ÁREA PRINCIPAL ---- */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-2 sm:px-4 py-3 flex flex-col min-h-0">

        {/* ---- TABS HEADER ---- */}
        <div className="bg-slate-800 rounded-t-2xl border border-slate-700 border-b-0 px-4 pt-4 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${pestañaActiva === 'chat' ? 'bg-green-400' : 'bg-blue-400'}`} />
              <h1 className="font-bold text-white text-sm sm:text-base">
                {esProfesor ? '👨‍🏫 Mi grupo' : '📚 Mi clase'}
              </h1>
            </div>
            <span className="text-slate-500 text-xs">
              {pestañaActiva === 'chat' ? `${mensajes.length} mensajes` : `${actividades.length} actividades`}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {[
              { id: 'chat', label: 'Chat', icon: '💬' },
              { id: 'actividades', label: 'Actividades', icon: '📋' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPestañaActiva(tab.id)}
                className={`px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-all border-b-2 -mb-px ${
                  pestañaActiva === tab.id
                    ? 'border-blue-400 text-blue-300 bg-slate-700/50'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/* PESTAÑA: CHAT                                                 */}
        {/* ============================================================ */}
        {pestañaActiva === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 border border-slate-700 border-t-0 rounded-b-2xl overflow-hidden">

            {errorChat && (
              <div className="bg-red-900/40 border-b border-red-700 text-red-300 px-4 py-2 text-xs flex items-center gap-2 flex-shrink-0">
                ⚠️ {errorChat}
              </div>
            )}

            {/* Lista de mensajes — fondo oscuro con patrón sutil */}
            <div
              className="flex-1 overflow-y-auto min-h-0 px-4 py-5"
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                backgroundSize: '400% 400%',
              }}
            >
              {cargandoChat ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin mb-3" />
                  <p className="text-sm">Cargando mensajes...</p>
                </div>
              ) : mensajes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-3xl mb-4 border border-slate-700">
                    💬
                  </div>
                  <p className="text-slate-300 font-semibold text-base">¡Empieza la conversación!</p>
                  <p className="text-slate-500 text-sm mt-1">Sé el primero en escribir algo</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mensajes.map((mensaje, index) => {
                    const esMio = mensaje.user_id === perfil?.id
                    const nombreUsuario = esMio ? perfil?.name : mensaje.users?.name
                    const inicial = nombreUsuario?.charAt(0)?.toUpperCase() || '?'
                    const esProfesorMensaje = mensaje.users?.role === 'teacher'

                    // Agrupar mensajes consecutivos del mismo usuario
                    const mensajeAnterior = mensajes[index - 1]
                    const mismoDueno = mensajeAnterior?.user_id === mensaje.user_id
                    const mostrarAvatar = !esMio && !mismoDueno

                    return (
                      <div key={mensaje.id} className={`flex items-end gap-2 ${esMio ? 'justify-end' : 'justify-start'}`}>

                        {/* Avatar del otro usuario */}
                        {!esMio && (
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-1 ${
                            mostrarAvatar ? colorAvatar(nombreUsuario) : 'invisible'
                          }`}>
                            {inicial}
                          </div>
                        )}

                        <div className={`max-w-[72%] sm:max-w-md flex flex-col ${esMio ? 'items-end' : 'items-start'}`}>

                          {/* Nombre (solo primer mensaje del grupo) */}
                          {!esMio && !mismoDueno && (
                            <span className="text-xs text-slate-400 mb-1 ml-1 font-medium">
                              {nombreUsuario}
                              {esProfesorMensaje && (
                                <span className="ml-1.5 text-purple-400 font-semibold">· Profesor</span>
                              )}
                            </span>
                          )}

                          {/* Burbuja */}
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-md ${
                            esMio
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-slate-700 text-slate-100 rounded-bl-md border border-slate-600'
                          }`}>
                            {mensaje.content}
                          </div>

                          {/* Hora */}
                          <span className="text-xs text-slate-500 mt-1 mx-1">
                            {formatearHora(mensaje.created_at)}
                          </span>
                        </div>

                        {/* Avatar propio (a la derecha) */}
                        {esMio && (
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-1 ${colorAvatar(perfil?.name)}`}>
                            {perfil?.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  <div ref={finalMensajesRef} />
                </div>
              )}
            </div>

            {/* Input de mensaje */}
            <div className="bg-slate-800 px-4 py-3 border-t border-slate-700 flex-shrink-0">
              <form onSubmit={handleEnviar} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={nuevoMensaje}
                  onChange={e => setNuevoMensaje(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-full px-4 py-2.5 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                  maxLength={1000}
                  disabled={enviando}
                />
                <button
                  type="submit"
                  disabled={enviando || !nuevoMensaje.trim()}
                  className="bg-blue-600 hover:bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 flex-shrink-0 shadow-md"
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
          <div className="flex-1 flex flex-col min-h-0 border border-slate-700 border-t-0 rounded-b-2xl overflow-hidden bg-slate-800">

            {/* Cabecera */}
            <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
              <p className="text-slate-400 text-xs sm:text-sm">
                {esProfesor ? 'Gestiona las actividades de tu grupo.' : 'Actividades publicadas por tu profesor.'}
              </p>
              {esProfesor && (
                <button
                  onClick={() => setMostrarCrearActividad(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-colors text-xs sm:text-sm font-semibold flex-shrink-0 shadow-sm flex items-center gap-1.5"
                >
                  <span className="text-base leading-none">+</span> Nueva actividad
                </button>
              )}
            </div>

            {/* Alertas */}
            {errorActividades && (
              <div className="mx-4 mt-3 bg-red-900/40 border border-red-700 text-red-300 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 flex-shrink-0">
                ⚠️ {errorActividades}
              </div>
            )}
            {exitoActividades && (
              <div className="mx-4 mt-3 bg-green-900/40 border border-green-700 text-green-300 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 flex-shrink-0">
                ✅ {exitoActividades}
              </div>
            )}

            {/* Lista de actividades */}
            <div className="flex-1 px-4 py-4 overflow-y-auto min-h-0">
              {cargandoActividades ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin mb-3" />
                  <p className="text-sm">Cargando actividades...</p>
                </div>
              ) : actividades.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center text-3xl mb-4 border border-slate-600">
                    📋
                  </div>
                  <p className="text-slate-300 font-semibold text-base">
                    {esProfesor ? '¡Crea la primera actividad!' : 'Sin actividades aún'}
                  </p>
                  <p className="text-slate-500 text-sm mt-1 max-w-xs">
                    {esProfesor
                      ? 'Haz clic en "Nueva actividad" para publicar una tarea a tus estudiantes.'
                      : 'Tu profesor aún no ha publicado ninguna actividad.'}
                  </p>
                  {esProfesor && (
                    <button
                      onClick={() => setMostrarCrearActividad(true)}
                      className="mt-5 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
                    >
                      + Nueva actividad
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {actividades.map((actividad, index) => {
                    const yaEntregada = misEntregas.includes(actividad.id)
                    // Colores rotativos para el borde izquierdo
                    const bordes = ['border-blue-500', 'border-indigo-500', 'border-violet-500', 'border-sky-500', 'border-teal-500']
                    const colorBorde = bordes[index % bordes.length]

                    return (
                      <div
                        key={actividad.id}
                        className={`bg-slate-700/60 border border-slate-600 border-l-4 ${colorBorde} rounded-2xl p-4 sm:p-5 hover:bg-slate-700 transition-colors`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">

                            {/* Número + Título */}
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs text-slate-500 font-mono font-bold">
                                #{String(index + 1).padStart(2, '0')}
                              </span>
                              <h3 className="font-bold text-slate-100 text-sm sm:text-base leading-tight">
                                {actividad.title}
                              </h3>
                            </div>

                            {/* Descripción */}
                            {actividad.description && (
                              <p className="text-slate-400 text-xs sm:text-sm mt-1 leading-relaxed">
                                {actividad.description}
                              </p>
                            )}

                            {/* Fecha de entrega */}
                            {actividad.due_date && (
                              <div className="mt-2.5 inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-300 px-3 py-1 rounded-full text-xs font-medium">
                                📅 Entrega: {formatearFecha(actividad.due_date)}
                              </div>
                            )}

                            {/* Fecha publicación */}
                            <p className="text-xs text-slate-500 mt-2">
                              Publicada: {formatearFecha(actividad.created_at)}
                            </p>
                          </div>

                          {/* Botón de entrega (estudiantes) */}
                          {perfil?.role === 'student' && (
                            <div className="flex-shrink-0 mt-1">
                              {yaEntregada ? (
                                <span className="flex items-center gap-1.5 bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-1.5 rounded-full text-xs font-semibold">
                                  ✓ Entregada
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleEntregar(actividad.id)}
                                  disabled={entregando === actividad.id}
                                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                                >
                                  {entregando === actividad.id ? (
                                    <span className="flex items-center gap-1">
                                      <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                                    </span>
                                  ) : 'Entregar'}
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

      {/* Modal */}
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