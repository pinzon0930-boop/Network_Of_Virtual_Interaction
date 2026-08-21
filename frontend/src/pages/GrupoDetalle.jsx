// Importa hooks de React: estado, efectos secundarios y referencias DOM
import { useState, useEffect, useRef } from 'react'

// Importa el hook de rutas: useParams obtiene el ID del grupo desde la URL, useNavigate permite navegar
import { useParams, useNavigate } from 'react-router-dom'

// Importa el contexto de autenticación para acceder al perfil del usuario actual
import { useAuth } from '../context/AuthContext.jsx'

// Importa la función para cerrar sesión en Supabase
import { cerrarSesion } from '../services/auth.js'

// Importa las funciones del servicio de mensajes del chat en tiempo real
import {
  obtenerMensajes,          // Carga el historial de mensajes del grupo
  enviarMensaje,            // Envía un nuevo mensaje al chat del grupo
  suscribirseAMensajes,     // Activa la suscripción Realtime de Supabase para recibir mensajes nuevos
  desuscribirse             // Cancela la suscripción cuando el componente se desmonta
} from '../services/mensajes.js'

// Importa las funciones del servicio de actividades educativas
import {
  obtenerActividades,       // Carga las actividades del grupo desde Supabase
  entregarActividad,        // Registra la entrega de una actividad por parte del estudiante
  obtenerMisEntregas        // Obtiene las actividades ya entregadas por el estudiante actual
} from '../services/actividades.js'

// Importa el componente modal para crear una nueva actividad (solo profesores)
import CrearActividad from '../components/CrearActividad.jsx'

// Importa el panel lateral del tutor IA para estudiantes
import AsistenteIA from '../components/AsistenteIA.jsx'

// Importa los 4 modales de funciones IA — nuevos en esta versión
import ModalQuiz from '../components/ModalQuiz.jsx'                         // Genera quiz de opción múltiple (profesor)
import ModalRubrica from '../components/ModalRubrica.jsx'                   // Genera rúbrica de evaluación (profesor)
import ModalRetroalimentacion from '../components/ModalRetroalimentacion.jsx' // Feedback sobre respuesta del estudiante (profesor)
import ModalExplicacion from '../components/ModalExplicacion.jsx'           // Explicación simple de la actividad (estudiante)

// Importa la función que genera el resumen del grupo (usada inline, sin componente separado)
import { generarResumenGrupo } from '../services/groq.js'

// ============================================================
// PÁGINA: GrupoDetalle — Vista principal de un grupo educativo
// Contiene: chat en tiempo real, actividades y herramientas IA
// ============================================================
export default function GrupoDetalle() {

  // Obtiene el ID del grupo desde la URL (ej: /grupos/abc123 → grupoId = 'abc123')
  const { id: grupoId } = useParams()

  // Estado: cuál pestaña está activa — 'chat' o 'actividades'
  const [pestañaActiva, setPestañaActiva] = useState('chat')

  // Obtiene el perfil del usuario autenticado desde el contexto global
  const { perfil } = useAuth()

  // Hook para navegar entre rutas programáticamente (ej: redirigir al login al cerrar sesión)
  const navigate = useNavigate()

  // ── ESTADO DEL CHAT ──────────────────────────────────────
  const [mensajes,      setMensajes]      = useState([])    // Array con todos los mensajes del chat
  const [nuevoMensaje,  setNuevoMensaje]  = useState('')    // Texto que el usuario está escribiendo
  const [enviando,      setEnviando]      = useState(false) // true mientras se envía un mensaje (evita doble envío)
  const [cargandoChat,  setCargandoChat]  = useState(true)  // true mientras carga el historial inicial
  const [errorChat,     setErrorChat]     = useState('')    // Mensaje de error si falla algo en el chat

  // Referencia al div invisible al final de la lista de mensajes — para scroll automático
  const finalMensajesRef = useRef(null)

  // ── ESTADO DE ACTIVIDADES ─────────────────────────────────
  const [actividades,            setActividades]            = useState([])    // Array de actividades del grupo
  const [cargandoActividades,    setCargandoActividades]    = useState(false) // true mientras carga las actividades
  const [misEntregas,            setMisEntregas]            = useState([])    // IDs de actividades ya entregadas por el estudiante
  const [mostrarCrearActividad,  setMostrarCrearActividad]  = useState(false) // true para mostrar el modal de creación
  const [entregando,             setEntregando]             = useState(null)  // ID de la actividad que se está entregando ahora
  const [errorActividades,       setErrorActividades]       = useState('')    // Mensaje de error en la sección de actividades
  const [exitoActividades,       setExitoActividades]       = useState('')    // Mensaje de éxito temporal (3 segundos)

  // ── ESTADO DEL ASISTENTE IA (panel lateral, solo estudiantes) ──
  const [mostrarAsistente, setMostrarAsistente] = useState(false)             // true para abrir el panel lateral de la IA

  // ── ESTADO DE LOS MODALES IA ─────────────────────────────
  // Cada modal guarda null (cerrado) o el objeto de la actividad seleccionada
  const [modalQuiz,        setModalQuiz]        = useState(false) // Quiz no necesita actividad — booleano
  const [modalRubrica,     setModalRubrica]     = useState(null)  // { titulo, descripcion } de la actividad
  const [modalRetro,       setModalRetro]        = useState(null)  // { titulo } de la actividad
  const [modalExplicacion, setModalExplicacion] = useState(null)  // { titulo, descripcion } de la actividad

  // ── ESTADO DEL RESUMEN SEMANAL (modal inline, sin componente separado) ──
  const [mostrarResumen,  setMostrarResumen]  = useState(false) // true para mostrar el modal de resumen
  const [resumenGrupo,    setResumenGrupo]    = useState('')    // Texto del resumen generado por la IA
  const [cargandoResumen, setCargandoResumen] = useState(false) // true mientras la IA procesa el resumen

  // ============================================================
  // EFECTOS
  // ============================================================

  // Efecto: carga los mensajes y activa Realtime cuando el grupo y el perfil están listos
  useEffect(() => {
    if (!grupoId || !perfil) return                         // Espera a que ambos estén disponibles

    cargarMensajes()                                        // Carga el historial inicial del chat

    // Activa la suscripción Realtime de Supabase — recibe mensajes nuevos sin recargar la página
    const canal = suscribirseAMensajes(grupoId, (mensajeNuevo) => {
      setMensajes(prev => {
        const yaExiste = prev.some(m => m.id === mensajeNuevo.id) // Verifica si el mensaje ya está en la lista
        if (yaExiste) return prev                           // Si ya existe (ej: el propio mensaje), no lo duplica
        return [...prev, mensajeNuevo]                      // Si es nuevo, lo agrega al final
      })
    })

    // Función de limpieza: cancela la suscripción cuando el componente se desmonta o cambia el grupo
    return () => { desuscribirse(canal) }
  }, [grupoId, perfil])                                     // Re-ejecuta si cambia el grupo o el usuario

  // Efecto: hace scroll automático al último mensaje cada vez que llega uno nuevo
  useEffect(() => {
    finalMensajesRef.current?.scrollIntoView({ behavior: 'smooth' }) // Desplazamiento suave hacia abajo
  }, [mensajes])                                            // Se ejecuta cuando cambia la lista de mensajes

  // Efecto: carga las actividades cuando el usuario cambia a la pestaña "Actividades"
  useEffect(() => {
    if (!grupoId || !perfil || pestañaActiva !== 'actividades') return // Solo si está en la pestaña correcta
    cargarActividades()                                     // Carga actividades desde Supabase
  }, [grupoId, perfil, pestañaActiva])                      // Re-ejecuta al cambiar de pestaña

  // ============================================================
  // FUNCIONES
  // ============================================================

  // Carga el historial completo de mensajes del chat desde Supabase
  async function cargarMensajes() {
    setCargandoChat(true)                                   // Muestra el spinner de carga del chat
    const { data, error } = await obtenerMensajes(grupoId) // Petición a Supabase
    setCargandoChat(false)                                  // Oculta el spinner
    if (error) { setErrorChat('Error al cargar el chat.'); return } // Manejo de error
    setMensajes(data || [])                                 // Guarda los mensajes (o array vacío si no hay)
  }

  // Maneja el envío de un nuevo mensaje en el chat
  async function handleEnviar(e) {
    e.preventDefault()                                      // Evita que el formulario recargue la página
    if (!nuevoMensaje.trim() || enviando) return            // No envía si el input está vacío o ya está procesando

    setEnviando(true)                                       // Deshabilita el botón para evitar doble envío
    const textoAEnviar = nuevoMensaje.trim()               // Guarda el texto antes de limpiar el input
    setNuevoMensaje('')                                     // Limpia el input inmediatamente (UX responsiva)

    const { data, error } = await enviarMensaje(grupoId, perfil.id, textoAEnviar) // Envía a Supabase
    setEnviando(false)                                      // Reactiva el botón

    if (error) {
      setNuevoMensaje(textoAEnviar)                         // Si falla, restaura el texto para que no se pierda
      setErrorChat('Error al enviar el mensaje.')           // Muestra el error
    } else if (data) {
      // Agrega el mensaje propio inmediatamente sin esperar a Realtime
      // Realtime también lo enviará, pero el check 'yaExiste' evita duplicados
      setMensajes(prev => {
        const yaExiste = prev.some(m => m.id === data.id)  // Verifica si Realtime ya lo insertó
        if (yaExiste) return prev                           // Si ya está, no lo duplica
        return [...prev, data]                              // Si no, lo agrega al estado local
      })
    }
  }

  // Carga las actividades del grupo y, si el usuario es estudiante, también sus entregas
  async function cargarActividades() {
    setCargandoActividades(true)                            // Muestra el spinner de actividades
    setErrorActividades('')                                 // Limpia errores previos

    const { data, error } = await obtenerActividades(grupoId) // Obtiene actividades de Supabase
    if (error) { setErrorActividades('Error al cargar las actividades.'); setCargandoActividades(false); return }

    setActividades(data || [])                              // Guarda las actividades en el estado

    // Si el usuario es estudiante, también carga cuáles actividades ya entregó
    if (perfil.role === 'student') {
      const { data: entregas } = await obtenerMisEntregas(perfil.id)
      setMisEntregas((entregas || []).map(e => e.activity_id)) // Guarda solo los IDs para comparación fácil
    }

    setCargandoActividades(false)                           // Oculta el spinner
  }

  // Registra la entrega de una actividad por parte del estudiante
  async function handleEntregar(actividadId) {
    setEntregando(actividadId)                              // Muestra el spinner en el botón de esa actividad
    const { error } = await entregarActividad(actividadId, perfil.id) // Registra en Supabase
    setEntregando(null)                                     // Oculta el spinner del botón

    if (error) { setErrorActividades('Error al entregar la actividad.'); return }

    setMisEntregas(prev => [...prev, actividadId])          // Agrega el ID al estado local (evita recarga)
    setExitoActividades('¡Actividad marcada como entregada!')
    setTimeout(() => setExitoActividades(''), 3000)         // Oculta el mensaje de éxito después de 3 segundos
  }

  // Se llama cuando el modal CrearActividad confirma que se creó una actividad nueva
  function handleActividadCreada(nuevaActividad) {
    setMostrarCrearActividad(false)                         // Cierra el modal de creación
    setActividades(prev => [nuevaActividad, ...prev])       // Agrega la nueva actividad al inicio de la lista
    setExitoActividades('¡Actividad creada exitosamente!')
    setTimeout(() => setExitoActividades(''), 3000)         // Oculta el mensaje después de 3 segundos
  }

  // Genera el resumen del estado del grupo usando la IA (botón 📈 Resumen)
  async function handleResumenGrupo() {
    setMostrarResumen(true)                                 // Abre el modal del resumen
    setCargandoResumen(true)                                // Activa el spinner dentro del modal
    setResumenGrupo('')                                     // Limpia el resumen anterior si había

    try {
      const resultado = await generarResumenGrupo(actividades) // Llama a la IA con las actividades del grupo
      setResumenGrupo(resultado)                            // Guarda el resumen generado
    } catch {
      setResumenGrupo('No se pudo generar el resumen. Intenta de nuevo.') // Mensaje de error dentro del modal
    } finally {
      setCargandoResumen(false)                             // Siempre desactiva el spinner
    }
  }

  // Cierra la sesión del usuario y lo redirige a la página de login
  async function handleLogout() {
    await cerrarSesion()                                    // Llama a la función de cierre de sesión en Supabase
    navigate('/login')                                      // Redirige al login
  }

  // Formatea una fecha ISO a hora local en formato HH:MM (para los mensajes del chat)
  function formatearHora(fechaISO) {
    return new Date(fechaISO).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  }

  // Formatea una fecha ISO a fecha completa legible en español colombiano (para actividades)
  function formatearFecha(fechaISO) {
    if (!fechaISO) return null                              // Si no hay fecha, no renderiza nada
    return new Date(fechaISO).toLocaleDateString('es-CO', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  // Asigna un color de avatar determinista basado en la primera letra del nombre del usuario
  function colorAvatar(nombre) {
    if (!nombre) return 'bg-slate-500'                      // Color neutro si el nombre es null/undefined
    const colores = [
      'bg-blue-500', 'bg-indigo-500', 'bg-violet-500',
      'bg-sky-500', 'bg-teal-500', 'bg-emerald-500',
      'bg-rose-500', 'bg-orange-500',
    ]
    const idx = (nombre?.charCodeAt(0) || 0) % colores.length // Usa el código ASCII de la primera letra
    return colores[idx]                                     // Devuelve el color correspondiente
  }

  // Atajo: true si el usuario actual es profesor, false si es estudiante
  const esProfesor = perfil?.role === 'teacher'

  // ============================================================
  // RENDER
  // ============================================================
  return (
    // Contenedor raíz — ocupa toda la pantalla, columna vertical, sin scroll externo
    <div className="h-screen bg-white flex flex-col overflow-hidden">

      {/* ── NAVBAR ── */}
      <nav className="bg-slate-900 border-b border-slate-700/60 flex-shrink-0">
        <div className="max-w-5xl mx-auto px-3 py-3 flex items-center justify-between">

          <div className="flex items-center gap-2.5">
            {/* Botón para volver a la lista de grupos */}
            <button
              onClick={() => navigate('/grupos')}
              className="text-slate-400 hover:text-white transition-colors p-1"
              title="Volver a grupos"
            >
              ←
            </button>
            {/* Logo y nombre de la app — lleva al dashboard */}
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-white font-bold"
            >
              <span className="text-xl">🎓</span>
              <span className="hidden sm:inline text-base">Educa AI</span>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Nombre del usuario logueado (oculto en móvil) */}
            <span className="hidden sm:block text-slate-300 text-sm">{perfil?.name}</span>
            {/* Badge de rol: morado para profesor, azul para estudiante */}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              esProfesor
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
            }`}>
              {esProfesor ? 'Profesor' : 'Estudiante'}
            </span>
            {/* Botón de cerrar sesión */}
            <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors text-sm">
              <span className="hidden sm:inline">Salir</span>
              <span className="sm:hidden">✕</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── ÁREA PRINCIPAL ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-2 sm:px-4 py-3 flex flex-col min-h-0">

        {/* ── CABECERA DE LAS PESTAÑAS ── */}
        <div className="bg-slate-800 rounded-t-2xl border border-slate-700 border-b-0 px-4 pt-4 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {/* Punto indicador animado — verde en chat, azul en actividades */}
              <div className={`w-2 h-2 rounded-full animate-pulse ${pestañaActiva === 'chat' ? 'bg-green-400' : 'bg-blue-400'}`} />
              {/* Título dinámico según el rol del usuario */}
              <h1 className="font-bold text-white text-sm sm:text-base">
                {esProfesor ? '👨‍🏫 Mi grupo' : '📚 Mi clase'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Botón Asistente IA — solo visible para estudiantes en la pestaña chat */}
              {!esProfesor && pestañaActiva === 'chat' && (
                <button
                  onClick={() => setMostrarAsistente(true)} // Abre el panel lateral del tutor IA
                  className="flex items-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 hover:text-indigo-100 px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                  title="Abrir tutor IA"
                >
                  <span>🤖</span>
                  <span className="hidden sm:inline">Preguntar a la IA</span>
                  <span className="sm:hidden">IA</span>
                </button>
              )}
              {/* Contador de mensajes o actividades según la pestaña activa */}
              <span className="text-slate-500 text-xs">
                {pestañaActiva === 'chat' ? `${mensajes.length} mensajes` : `${actividades.length} actividades`}
              </span>
            </div>
          </div>

          {/* Pestañas de navegación — Chat y Actividades */}
          <div className="flex gap-1">
            {[
              { id: 'chat', label: 'Chat', icon: '💬' },
              { id: 'actividades', label: 'Actividades', icon: '📋' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPestañaActiva(tab.id)}   // Cambia la pestaña activa
                className={`px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-all border-b-2 -mb-px ${
                  pestañaActiva === tab.id
                    ? 'border-blue-400 text-blue-300 bg-slate-700/50'          // Pestaña activa: subrayada en azul
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-700/30' // Inactiva
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/* PESTAÑA: CHAT                                                  */}
        {/* ============================================================ */}
        {pestañaActiva === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 border border-slate-700 border-t-0 rounded-b-2xl overflow-hidden">

            {/* Banner de error del chat — visible si falla algo */}
            {errorChat && (
              <div className="bg-red-900/40 border-b border-red-700 text-red-300 px-4 py-2 text-xs flex items-center gap-2 flex-shrink-0">
                ⚠️ {errorChat}
              </div>
            )}

            {/* ── ÁREA DE MENSAJES — scrollable, crece para llenar el espacio disponible ── */}
            <div
              className="flex-1 overflow-y-auto min-h-0 px-4 py-5"
              style={{
                // Fondo con gradiente animado tipo constelación — visual para el chat
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                backgroundSize: '400% 400%',
              }}
            >
              {/* Estado de carga inicial del chat */}
              {cargandoChat ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin mb-3" />
                  <p className="text-sm">Cargando mensajes...</p>
                </div>
              ) : mensajes.length === 0 ? (
                // Estado vacío — no hay mensajes aún
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-3xl mb-4 border border-slate-700">
                    💬
                  </div>
                  <p className="text-slate-300 font-semibold text-base">¡Empieza la conversación!</p>
                  <p className="text-slate-500 text-sm mt-1">Sé el primero en escribir algo</p>
                  {/* Acceso directo a la IA cuando el chat está vacío (solo estudiantes) */}
                  {!esProfesor && (
                    <button
                      onClick={() => setMostrarAsistente(true)}
                      className="mt-4 flex items-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    >
                      🤖 ¿Tienes dudas? Pregunta a la IA
                    </button>
                  )}
                </div>
              ) : (
                // Lista de mensajes del chat
                <div className="space-y-4">
                  {mensajes.map((mensaje, index) => {
                    const esMio = mensaje.user_id === perfil?.id           // true si el mensaje es del usuario actual
                    const nombreUsuario = esMio ? perfil?.name : mensaje.users?.name // Nombre del autor
                    const inicial = nombreUsuario?.charAt(0)?.toUpperCase() || '?'  // Inicial para el avatar
                    const esProfesorMensaje = mensaje.users?.role === 'teacher'     // true si el autor es profesor

                    const mensajeAnterior = mensajes[index - 1]            // Mensaje previo para agrupar
                    const mismoDueno = mensajeAnterior?.user_id === mensaje.user_id // true si es el mismo autor
                    const mostrarAvatar = !esMio && !mismoDueno            // Solo muestra avatar en el primer mensaje consecutivo

                    return (
                      <div key={mensaje.id} className={`flex items-end gap-2 ${esMio ? 'justify-end' : 'justify-start'}`}>

                        {/* Avatar del autor — solo para mensajes de otros, invisible en mensajes consecutivos */}
                        {!esMio && (
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-1 ${
                            mostrarAvatar ? colorAvatar(nombreUsuario) : 'invisible' // invisible mantiene el espacio
                          }`}>
                            {inicial}
                          </div>
                        )}

                        <div className={`max-w-[72%] sm:max-w-md flex flex-col ${esMio ? 'items-end' : 'items-start'}`}>

                          {/* Nombre del autor — solo en el primer mensaje de cada grupo */}
                          {!esMio && !mismoDueno && (
                            <span className="text-xs text-slate-400 mb-1 ml-1 font-medium">
                              {nombreUsuario}
                              {/* Badge "· Profesor" si el autor es docente */}
                              {esProfesorMensaje && (
                                <span className="ml-1.5 text-purple-400 font-semibold">· Profesor</span>
                              )}
                            </span>
                          )}

                          {/* Burbuja del mensaje — azul para mensajes propios, gris para los demás */}
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-md ${
                            esMio
                              ? 'bg-blue-600 text-white rounded-br-md'                           // Burbuja propia: azul, esquina inferior derecha recta
                              : 'bg-slate-700 text-slate-100 rounded-bl-md border border-slate-600' // Burbuja ajena: gris, esquina inferior izquierda recta
                          }`}>
                            {mensaje.content}                               {/* Texto del mensaje */}
                          </div>

                          {/* Hora del mensaje en formato HH:MM */}
                          <span className="text-xs text-slate-500 mt-1 mx-1">
                            {formatearHora(mensaje.created_at)}
                          </span>
                        </div>

                        {/* Avatar del usuario actual — aparece a la derecha de sus propios mensajes */}
                        {esMio && (
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-1 ${colorAvatar(perfil?.name)}`}>
                            {perfil?.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {/* Div invisible al final — el scroll automático apunta aquí */}
                  <div ref={finalMensajesRef} />
                </div>
              )}
            </div>

            {/* ── INPUT PARA ESCRIBIR Y ENVIAR MENSAJES ── */}
            <div className="bg-slate-800 px-4 py-3 border-t border-slate-700 flex-shrink-0">
              <form onSubmit={handleEnviar} className="flex gap-2 items-center">
                {/* Campo de texto del chat */}
                <input
                  type="text"
                  value={nuevoMensaje}                      // Valor controlado por el estado
                  onChange={e => setNuevoMensaje(e.target.value)} // Actualiza el estado con cada tecla
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-full px-4 py-2.5 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                  maxLength={1000}                          // Límite de 1000 caracteres por mensaje
                  disabled={enviando}                       // Deshabilitado mientras se envía
                />
                {/* Botón de enviar */}
                <button
                  type="submit"
                  disabled={enviando || !nuevoMensaje.trim()} // Deshabilitado si está vacío o enviando
                  className="bg-blue-600 hover:bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 flex-shrink-0 shadow-md"
                >
                  ➤
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PESTAÑA: ACTIVIDADES                                           */}
        {/* ============================================================ */}
        {pestañaActiva === 'actividades' && (
          <div className="flex-1 flex flex-col min-h-0 border border-slate-700 border-t-0 rounded-b-2xl overflow-hidden bg-slate-800">

            {/* ── BARRA DE HERRAMIENTAS — descripción + botones de acción ── */}
            <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
              {/* Texto descriptivo según el rol */}
              <p className="text-slate-400 text-xs sm:text-sm">
                {esProfesor ? 'Gestiona las actividades de tu grupo.' : 'Actividades publicadas por tu profesor.'}
              </p>
              {/* Botones de acción — solo visibles para el profesor */}
              {esProfesor && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Botón 📈 Resumen — solo aparece si ya hay actividades creadas */}
                  {actividades.length > 0 && (
                    <button
                      onClick={handleResumenGrupo}          // Genera el resumen con la IA
                      className="bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-300 hover:text-purple-100 px-3 py-2 rounded-xl transition-all text-xs font-semibold flex items-center gap-1.5"
                      title="Generar resumen del grupo con IA"
                    >
                      📈 <span className="hidden sm:inline">Resumen</span>
                    </button>
                  )}
                  {/* Botón + Nueva actividad — abre el modal de creación */}
                  <button
                    onClick={() => setMostrarCrearActividad(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-colors text-xs sm:text-sm font-semibold shadow-sm flex items-center gap-1.5"
                  >
                    <span className="text-base leading-none">+</span> Nueva actividad
                  </button>
                  {/* Botón 🎯 Quiz — genera preguntas de opción múltiple sobre cualquier tema */}
                  <button
                    onClick={() => setModalQuiz(true)}      // Abre el modal de quiz
                    className="bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/40 text-violet-300 hover:text-violet-100 px-3 py-2 rounded-xl transition-all text-xs font-semibold flex items-center gap-1.5"
                    title="Generar quiz con IA"
                  >
                    🎯 <span className="hidden sm:inline">Quiz</span>
                  </button>
                </div>
              )}
            </div>

            {/* Banner de error en actividades — visible si falla la carga o la entrega */}
            {errorActividades && (
              <div className="mx-4 mt-3 bg-red-900/40 border border-red-700 text-red-300 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 flex-shrink-0">
                ⚠️ {errorActividades}
              </div>
            )}

            {/* Banner de éxito temporal — visible 3 segundos después de crear o entregar */}
            {exitoActividades && (
              <div className="mx-4 mt-3 bg-green-900/40 border border-green-700 text-green-300 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 flex-shrink-0">
                ✅ {exitoActividades}
              </div>
            )}

            {/* ── LISTA DE ACTIVIDADES (scrollable) ── */}
            <div className="flex-1 px-4 py-4 overflow-y-auto min-h-0">
              {/* Estado de carga */}
              {cargandoActividades ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin mb-3" />
                  <p className="text-sm">Cargando actividades...</p>
                </div>
              ) : actividades.length === 0 ? (
                // Estado vacío — no hay actividades creadas aún
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
                  {/* Acceso directo al modal de creación desde el estado vacío (solo profesor) */}
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
                // Lista de tarjetas de actividades
                <div className="space-y-3">
                  {actividades.map((actividad, index) => {
                    const yaEntregada = misEntregas.includes(actividad.id) // true si el estudiante ya entregó esta actividad
                    // Cicla entre 5 colores de borde izquierdo para distinguir las tarjetas visualmente
                    const bordes = ['border-blue-500', 'border-indigo-500', 'border-violet-500', 'border-sky-500', 'border-teal-500']
                    const colorBorde = bordes[index % bordes.length]

                    return (
                      <div
                        key={actividad.id}
                        className={`bg-slate-700/60 border border-slate-600 border-l-4 ${colorBorde} rounded-2xl p-4 sm:p-5 hover:bg-slate-700 transition-colors`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">

                            {/* Número de actividad + título */}
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs text-slate-500 font-mono font-bold">
                                #{String(index + 1).padStart(2, '0')}        {/* Número formateado: #01, #02... */}
                              </span>
                              <h3 className="font-bold text-slate-100 text-sm sm:text-base leading-tight">
                                {actividad.title}                             {/* Título de la actividad */}
                              </h3>
                            </div>

                            {/* Descripción de la actividad (opcional) */}
                            {actividad.description && (
                              <p className="text-slate-400 text-xs sm:text-sm mt-1 leading-relaxed">
                                {actividad.description}
                              </p>
                            )}

                            {/* Fecha de entrega — solo visible si la actividad tiene fecha límite */}
                            {actividad.due_date && (
                              <div className="mt-2.5 inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-300 px-3 py-1 rounded-full text-xs font-medium">
                                📅 Entrega: {formatearFecha(actividad.due_date)}
                              </div>
                            )}

                            {/* Fecha de publicación */}
                            <p className="text-xs text-slate-500 mt-2">
                              Publicada: {formatearFecha(actividad.created_at)}
                            </p>

                            {/* ── BOTONES IA DEL PROFESOR — Rúbrica y Retroalimentación por actividad ── */}
                            {esProfesor && (
                              <div className="mt-3 flex gap-2 flex-wrap">
                                {/* Botón 📊 Rúbrica — abre el modal con esta actividad como contexto */}
                                <button
                                  onClick={() => setModalRubrica({ titulo: actividad.title, descripcion: actividad.description })}
                                  className="flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-emerald-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                >
                                  📊 Rúbrica
                                </button>
                                {/* Botón 💬 Retroalimentación — abre el modal con el título de la actividad */}
                                <button
                                  onClick={() => setModalRetro({ titulo: actividad.title })}
                                  className="flex items-center gap-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-300 hover:text-orange-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                >
                                  💬 Retroalimentación
                                </button>
                              </div>
                            )}

                            {/* ── BOTÓN IA DEL ESTUDIANTE — Explícame esta actividad ── */}
                            {!esProfesor && (
                              <button
                                onClick={() => setModalExplicacion({ titulo: actividad.title, descripcion: actividad.description })}
                                className="mt-3 flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:text-blue-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                              >
                                🔍 Explícame esta actividad
                              </button>
                            )}
                          </div>

                          {/* ── BOTÓN DE ENTREGA (solo estudiantes) ── */}
                          {perfil?.role === 'student' && (
                            <div className="flex-shrink-0 mt-1">
                              {yaEntregada ? (
                                // Badge verde si ya fue entregada
                                <span className="flex items-center gap-1.5 bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-1.5 rounded-full text-xs font-semibold">
                                  ✓ Entregada
                                </span>
                              ) : (
                                // Botón para marcar como entregada
                                <button
                                  onClick={() => handleEntregar(actividad.id)}
                                  disabled={entregando === actividad.id}  // Deshabilitado mientras se procesa
                                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                                >
                                  {entregando === actividad.id ? (
                                    // Mini spinner dentro del botón mientras se registra la entrega
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

      {/* ── MODAL: Crear nueva actividad (solo profesores) ── */}
      {mostrarCrearActividad && (
        <CrearActividad
          grupoId={grupoId}                               // Pasa el ID del grupo para asociar la actividad
          onActividadCreada={handleActividadCreada}        // Callback al confirmar la creación
          onCancelar={() => setMostrarCrearActividad(false)} // Callback al cancelar
        />
      )}

      {/* ── PANEL LATERAL: Asistente IA (solo estudiantes) ── */}
      {/* El componente siempre existe pero se muestra/oculta con la prop visible */}
      {!esProfesor && (
        <AsistenteIA
          visible={mostrarAsistente}                      // Controla si el panel está abierto
          onClose={() => setMostrarAsistente(false)}      // Cierra el panel al presionar X o el overlay
        />
      )}

      {/* ── MODALES IA ── */}

      {/* Modal Quiz — el profesor genera preguntas de opción múltiple sobre cualquier tema */}
      {modalQuiz && (
        <ModalQuiz onCerrar={() => setModalQuiz(false)} />
      )}

      {/* Modal Rúbrica — genera criterios de evaluación para la actividad seleccionada */}
      {modalRubrica && (
        <ModalRubrica
          actividad={modalRubrica}                        // { titulo, descripcion } de la actividad
          onCerrar={() => setModalRubrica(null)}           // Cierra el modal limpiando el estado
        />
      )}

      {/* Modal Retroalimentación — el profesor pega la respuesta del estudiante y recibe feedback */}
      {modalRetro && (
        <ModalRetroalimentacion
          actividad={modalRetro}                          // { titulo } de la actividad
          onCerrar={() => setModalRetro(null)}             // Cierra el modal
        />
      )}

      {/* Modal Explicación — el estudiante recibe una explicación simple de la actividad */}
      {modalExplicacion && (
        <ModalExplicacion
          actividad={modalExplicacion}                    // { titulo, descripcion } de la actividad
          onCerrar={() => setModalExplicacion(null)}       // Cierra el modal
        />
      )}

      {/* ── MODAL RESUMEN SEMANAL — inline, sin componente separado ── */}
      {mostrarResumen && (
        // Fondo oscuro que cubre toda la pantalla
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">

            {/* Cabecera del modal resumen */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">📈 Resumen del Grupo</h2>
                <p className="text-purple-100 text-sm mt-0.5">{actividades.length} actividades registradas</p>
              </div>
              {/* Botón X para cerrar el modal de resumen */}
              <button onClick={() => setMostrarResumen(false)} className="text-white/80 hover:text-white p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Spinner mientras la IA genera el resumen */}
              {cargandoResumen && (
                <div className="flex flex-col items-center py-10 gap-3">
                  <span className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                  <p className="text-slate-500 text-sm">Analizando el grupo...</p>
                </div>
              )}

              {/* Resumen generado por la IA — visible cuando terminó de procesar */}
              {resumenGrupo && !cargandoResumen && (
                <>
                  {/* Identificador del asistente */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">🤖</span>
                    </div>
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Educa AI Resume</p>
                  </div>
                  {/* Caja con el texto del resumen */}
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-4">
                    <p className="text-slate-800 text-sm leading-relaxed">{resumenGrupo}</p>
                  </div>
                  {/* Botón para regenerar el resumen con otro enfoque */}
                  <button
                    onClick={handleResumenGrupo}
                    className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors py-1 flex items-center justify-center gap-1"
                  >
                    🔄 Generar otro resumen
                  </button>
                </>
              )}
            </div>

            {/* Pie del modal resumen con botón de cierre */}
            <div className="px-6 pb-6 flex justify-end">
              <button
                onClick={() => setMostrarResumen(false)}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
