import { useState, useEffect, useRef } from 'react'          // useState: estado local. useEffect: efectos secundarios. useRef: referencia al DOM.
import { useParams, useNavigate } from 'react-router-dom'    // useParams: lee el :id de la URL. useNavigate: redirige a otras páginas.
import { useAuth } from '../context/AuthContext.jsx'          // Para obtener el perfil del usuario autenticado.
import { cerrarSesion } from '../services/auth.js'            // Para cerrar la sesión del usuario.
import {
  obtenerMensajes,        // Carga los mensajes históricos del chat.
  enviarMensaje,          // Envía un nuevo mensaje al grupo.
  suscribirseAMensajes,   // Escucha mensajes nuevos en tiempo real.
  desuscribirse           // Cancela la escucha en tiempo real al salir.
} from '../services/mensajes.js'
import {
  obtenerActividades,     // Carga la lista de actividades del grupo.
  entregarActividad,      // Registra que el estudiante entregó una actividad.
  obtenerMisEntregas      // Obtiene los IDs de actividades que el estudiante ya entregó.
} from '../services/actividades.js'
import CrearActividad from '../components/CrearActividad.jsx' // Modal para que el profesor cree actividades.

// ============================================================
// PÁGINA: GrupoDetalle
// ============================================================
// Muestra el interior de un grupo con dos pestañas:
//   - Chat: mensajes en tiempo real entre los miembros.
//   - Actividades: tareas que el profesor publica y los estudiantes entregan.
// El diseño es responsive: funciona en móvil y escritorio.
// ============================================================
export default function GrupoDetalle() {

  // Lee el parámetro :id de la URL. Ejemplo: /grupos/abc123 → grupoId = "abc123"
  const { id: grupoId } = useParams()

  // Controla cuál pestaña está activa: 'chat' o 'actividades'.
  const [pestañaActiva, setPestañaActiva] = useState('chat')

  // Perfil del usuario actual (id, name, role).
  const { perfil } = useAuth()

  // Para redirigir a otras páginas.
  const navigate = useNavigate()

  // ---- Estado: Chat ----
  const [mensajes,      setMensajes]      = useState([])    // Lista de mensajes del chat.
  const [nuevoMensaje,  setNuevoMensaje]  = useState('')    // Texto que el usuario está escribiendo.
  const [enviando,      setEnviando]      = useState(false) // true mientras se envía un mensaje.
  const [cargandoChat,  setCargandoChat]  = useState(true)  // true mientras se cargan los mensajes iniciales.
  const [errorChat,     setErrorChat]     = useState('')    // Mensaje de error si algo falla en el chat.
  const finalMensajesRef = useRef(null)                     // Referencia al div al final del chat (para el scroll automático).

  // ---- Estado: Actividades ----
  const [actividades,            setActividades]            = useState([])   // Lista de actividades del grupo.
  const [cargandoActividades,    setCargandoActividades]    = useState(false) // true mientras se cargan actividades.
  const [misEntregas,            setMisEntregas]            = useState([])   // IDs de actividades que ya entregué.
  const [mostrarCrearActividad,  setMostrarCrearActividad]  = useState(false) // true para mostrar el modal de nueva actividad.
  const [entregando,             setEntregando]             = useState(null)  // ID de la actividad que se está entregando.
  const [errorActividades,       setErrorActividades]       = useState('')    // Mensaje de error en la pestaña de actividades.
  const [exitoActividades,       setExitoActividades]       = useState('')    // Mensaje de éxito al crear/entregar actividad.

  // ============================================================
  // EFECTO 1: Cargar chat y suscribirse a mensajes en tiempo real
  // ============================================================
  // Se ejecuta cuando el componente se monta o cuando cambia grupoId/perfil.
  // ============================================================
  useEffect(() => {
    if (!grupoId || !perfil) return // Esperar a tener grupo y perfil.

    cargarMensajes() // Carga los mensajes históricos.

    // Suscribirse a nuevos mensajes en tiempo real.
    const canal = suscribirseAMensajes(grupoId, (mensajeNuevo) => {
      setMensajes(prev => {
        // Evita duplicar mensajes (pueden llegar por el realtime y por la carga inicial).
        const yaExiste = prev.some(m => m.id === mensajeNuevo.id)
        if (yaExiste) return prev           // Si ya existe, no lo agrega.
        return [...prev, mensajeNuevo]      // Si es nuevo, lo agrega al final.
      })
    })

    // Cleanup: cancelar la suscripción cuando el usuario sale del grupo.
    return () => { desuscribirse(canal) }
  }, [grupoId, perfil]) // Se re-ejecuta si cambia el grupo o el perfil.

  // ============================================================
  // EFECTO 2: Scroll automático al último mensaje
  // ============================================================
  // Cada vez que la lista de mensajes cambia, baja automáticamente al fondo.
  // ============================================================
  useEffect(() => {
    finalMensajesRef.current?.scrollIntoView({ behavior: 'smooth' }) // Scroll suave al div final.
  }, [mensajes]) // Se ejecuta cuando llega un nuevo mensaje.

  // ============================================================
  // EFECTO 3: Cargar actividades al cambiar a esa pestaña
  // ============================================================
  // Solo carga las actividades cuando el usuario hace clic en "Actividades".
  // ============================================================
  useEffect(() => {
    if (!grupoId || !perfil || pestañaActiva !== 'actividades') return // Solo si está en la pestaña correcta.
    cargarActividades() // Carga las actividades del grupo.
  }, [grupoId, perfil, pestañaActiva]) // Se ejecuta cuando cambia la pestaña activa.

  // ============================================================
  // FUNCIÓN: cargarMensajes
  // ============================================================
  // Obtiene los 50 mensajes más recientes del grupo desde Supabase.
  // ============================================================
  async function cargarMensajes() {
    setCargandoChat(true)                                        // Muestra el spinner de carga.
    const { data, error } = await obtenerMensajes(grupoId)      // Consulta a Supabase.
    setCargandoChat(false)                                       // Oculta el spinner.
    if (error) { setErrorChat('Error al cargar el chat.'); return } // Si hay error, lo muestra.
    setMensajes(data || [])                                      // Guarda los mensajes en el estado.
  }

  // ============================================================
  // FUNCIÓN: handleEnviar
  // ============================================================
  // Se ejecuta cuando el usuario envía un mensaje (submit del formulario).
  // ============================================================
  async function handleEnviar(e) {
    e.preventDefault()                                           // Evita que el formulario recargue la página.
    if (!nuevoMensaje.trim() || enviando) return                 // Valida que el mensaje no esté vacío y no esté ya enviando.

    setEnviando(true)                                            // Deshabilita el botón de envío.
    const textoAEnviar = nuevoMensaje.trim()                     // Guarda el texto antes de limpiar el campo.
    setNuevoMensaje('')                                          // Limpia el campo de texto inmediatamente.

    const { error } = await enviarMensaje(grupoId, perfil.id, textoAEnviar) // Envía a Supabase.

    setEnviando(false)                                           // Reactiva el botón.
    if (error) {
      setNuevoMensaje(textoAEnviar)                              // Si falló, restaura el texto en el campo.
      setErrorChat('Error al enviar el mensaje.')                 // Muestra el error.
    }
    // Nota: el mensaje aparecerá automáticamente por la suscripción en tiempo real.
  }

  // ============================================================
  // FUNCIÓN: cargarActividades
  // ============================================================
  // Obtiene las actividades del grupo y, si el usuario es estudiante,
  // también carga cuáles ya entregó.
  // ============================================================
  async function cargarActividades() {
    setCargandoActividades(true)                                  // Muestra el spinner.
    setErrorActividades('')                                        // Limpia errores anteriores.

    const { data, error } = await obtenerActividades(grupoId)    // Obtiene las actividades de Supabase.

    if (error) {
      setErrorActividades('Error al cargar las actividades.')     // Muestra el error.
      setCargandoActividades(false)
      return
    }

    setActividades(data || [])                                    // Guarda las actividades.

    // Si el usuario es estudiante, también carga sus entregas para saber cuáles ya hizo.
    if (perfil.role === 'student') {
      const { data: entregas } = await obtenerMisEntregas(perfil.id) // Consulta las entregas del estudiante.
      setMisEntregas((entregas || []).map(e => e.activity_id))    // Guarda solo los IDs de las actividades entregadas.
    }

    setCargandoActividades(false)                                 // Oculta el spinner.
  }

  // ============================================================
  // FUNCIÓN: handleEntregar
  // ============================================================
  // Registra que el estudiante entregó una actividad.
  // Parámetros:
  //   - actividadId: ID de la actividad a entregar.
  // ============================================================
  async function handleEntregar(actividadId) {
    setEntregando(actividadId)                                    // Muestra "..." en el botón de esa actividad.

    const { error } = await entregarActividad(actividadId, perfil.id) // Registra la entrega en Supabase.

    setEntregando(null)                                           // Oculta el spinner del botón.

    if (error) { setErrorActividades('Error al entregar la actividad.'); return } // Muestra error si falló.

    setMisEntregas(prev => [...prev, actividadId])                // Agrega el ID a la lista local de entregas.
    setExitoActividades('¡Actividad marcada como entregada!')     // Muestra mensaje de éxito.
    setTimeout(() => setExitoActividades(''), 3000)              // Oculta el mensaje después de 3 segundos.
  }

  // ============================================================
  // FUNCIÓN: handleActividadCreada
  // ============================================================
  // Se llama cuando el profesor crea una nueva actividad en el modal.
  // Actualiza la lista local sin recargar desde Supabase.
  // ============================================================
  function handleActividadCreada(nuevaActividad) {
    setMostrarCrearActividad(false)                               // Cierra el modal.
    setActividades(prev => [nuevaActividad, ...prev])             // Agrega la nueva actividad al inicio de la lista.
    setExitoActividades('¡Actividad creada exitosamente!')        // Muestra mensaje de éxito.
    setTimeout(() => setExitoActividades(''), 3000)              // Oculta el mensaje después de 3 segundos.
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
  // FUNCIÓN: formatearHora
  // ============================================================
  // Convierte una fecha ISO 8601 a formato de hora local.
  // Ejemplo: "2024-01-15T14:30:00Z" → "9:30 AM"
  // ============================================================
  function formatearHora(fechaISO) {
    return new Date(fechaISO).toLocaleTimeString('es-CO', {
      hour: '2-digit',   // Muestra la hora con 2 dígitos.
      minute: '2-digit', // Muestra los minutos con 2 dígitos.
    })
  }

  // ============================================================
  // FUNCIÓN: formatearFecha
  // ============================================================
  // Convierte una fecha ISO 8601 a formato legible completo.
  // Ejemplo: "2024-01-15T14:30:00Z" → "15 de enero de 2024, 9:30 AM"
  // ============================================================
  function formatearFecha(fechaISO) {
    if (!fechaISO) return null // Si no hay fecha, no muestra nada.
    return new Date(fechaISO).toLocaleDateString('es-CO', {
      day:    'numeric', // Día del mes.
      month:  'long',    // Nombre completo del mes.
      year:   'numeric', // Año con 4 dígitos.
      hour:   '2-digit', // Hora.
      minute: '2-digit', // Minutos.
    })
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    // h-screen: ocupa exactamente la altura de la pantalla.
    // flex flex-col: organiza los hijos en columna (navbar arriba, contenido abajo).
    // overflow-hidden: evita scroll en el contenedor principal (el scroll está dentro del chat).
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">

      {/* ---- NAVBAR ---- */}
      {/* flex-shrink-0: el navbar no se encoge aunque el contenido sea grande. */}
      <nav className="bg-white shadow-sm flex-shrink-0">
        <div className="max-w-6xl mx-auto px-3 py-3 flex items-center justify-between">

          {/* Izquierda: botón volver + logo */}
          <div className="flex items-center gap-2">
            {/* Botón para volver a la lista de grupos. */}
            <button
              onClick={() => navigate('/grupos')}
              className="text-gray-400 hover:text-gray-600 transition text-xl p-1"
            >
              ←
            </button>
            {/* Logo que lleva al dashboard. hidden sm:inline oculta el texto "Educa AI" en móvil. */}
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 text-primary font-bold text-base sm:text-xl"
            >
              🎓 <span className="hidden sm:inline">Educa AI</span>
            </button>
          </div>

          {/* Derecha: nombre (oculto en móvil) + badge de rol + botón de logout */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* hidden sm:block: el nombre solo aparece en pantallas medianas o grandes. */}
            <span className="hidden sm:block text-gray-700 font-medium text-sm">
              {perfil?.name}
            </span>
            {/* Badge de color según el rol: morado para profesor, azul para estudiante. */}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              perfil?.role === 'teacher'
                ? 'bg-purple-100 text-purple-700' // Estilo para profesor.
                : 'bg-blue-100 text-blue-700'     // Estilo para estudiante.
            }`}>
              {perfil?.role === 'teacher' ? 'Profesor' : 'Estudiante'}
            </span>
            {/* En desktop muestra "Cerrar sesión", en móvil muestra "✕". */}
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 transition text-sm"
              title="Cerrar sesión"
            >
              <span className="hidden sm:inline">Cerrar sesión</span> {/* Solo en desktop. */}
              <span className="sm:hidden text-base">✕</span>          {/* Solo en móvil. */}
            </button>
          </div>
        </div>
      </nav>

      {/* ---- ÁREA PRINCIPAL ---- */}
      {/* flex-1: ocupa todo el espacio restante debajo del navbar. */}
      {/* min-h-0: permite que flex-1 funcione correctamente con overflow. */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-2 sm:px-4 py-3 sm:py-6 flex flex-col min-h-0">

        {/* ---- CABECERA CON PESTAÑAS ---- */}
        {/* flex-shrink-0: la cabecera no se encoge. */}
        <div className="bg-white rounded-t-xl px-4 pt-3 pb-0 shadow-sm flex-shrink-0">
          {/* Título: diferente para profesor y estudiante. */}
          <h1 className="font-bold text-gray-800 text-sm sm:text-lg mb-2 sm:mb-3">
            {perfil?.role === 'teacher' ? '👨‍🏫 Mi grupo' : '📚 Mi clase'}
          </h1>
          {/* Pestañas de navegación. */}
          <div className="flex gap-1 border-b border-gray-100">
            {/* Pestaña Chat. */}
            <button
              onClick={() => setPestañaActiva('chat')}
              className={`px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium transition border-b-2 -mb-px ${
                pestañaActiva === 'chat'
                  ? 'border-primary text-primary'              // Estilo activo: borde e texto en color primario.
                  : 'border-transparent text-gray-500 hover:text-gray-700' // Estilo inactivo.
              }`}
            >
              💬 Chat
            </button>
            {/* Pestaña Actividades. */}
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
        {/* Solo se renderiza cuando pestañaActiva === 'chat'.           */}
        {/* ============================================================ */}
        {pestañaActiva === 'chat' && (
          // flex-col + flex-1 + min-h-0: patrón para que el chat ocupe el espacio restante
          // y el scroll funcione correctamente en móvil.
          <div className="flex-1 flex flex-col min-h-0">

            {/* Mensaje de error del chat (si hay). */}
            {errorChat && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-xs">
                {errorChat}
              </div>
            )}

            {/* Área de mensajes: overflow-y-auto activa el scroll vertical cuando hay muchos mensajes. */}
            <div className="flex-1 bg-white px-3 sm:px-6 py-4 overflow-y-auto shadow-sm min-h-0">
              {cargandoChat ? (
                // Spinner mientras se cargan los mensajes.
                <div className="text-center text-gray-400 py-8 text-sm">
                  Cargando mensajes...
                </div>
              ) : mensajes.length === 0 ? (
                // Estado vacío: no hay mensajes aún.
                <div className="text-center text-gray-400 py-12">
                  <div className="text-4xl mb-2">💬</div>
                  <p className="text-sm">Sé el primero en escribir algo</p>
                </div>
              ) : (
                // Lista de mensajes.
                <div className="space-y-3 sm:space-y-4">
                  {mensajes.map(mensaje => {
                    const esMio = mensaje.user_id === perfil?.id // true si este mensaje es del usuario actual.
                    return (
                      // Alinea el mensaje a la derecha si es mío, a la izquierda si es de otro.
                      <div key={mensaje.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
                        {/* Burbuja de mensaje. max-w-[80%] en móvil, max-w-md en desktop. */}
                        <div className={`max-w-[80%] sm:max-w-md ${esMio ? 'items-end' : 'items-start'} flex flex-col`}>
                          {/* Nombre del remitente (solo para mensajes de otros). */}
                          {!esMio && (
                            <span className="text-xs text-gray-500 mb-1 ml-1">
                              {mensaje.users?.name}
                              {/* Si el remitente es el profesor, muestra "· Profesor". */}
                              {mensaje.users?.role === 'teacher' && (
                                <span className="ml-1 text-purple-500">· Profesor</span>
                              )}
                            </span>
                          )}
                          {/* Burbuja: azul si es mío, gris si es de otro. */}
                          <div className={`px-3 py-2 sm:px-4 rounded-2xl text-sm ${
                            esMio
                              ? 'bg-primary text-white rounded-br-none'   // Burbuja azul a la derecha.
                              : 'bg-gray-100 text-gray-800 rounded-bl-none' // Burbuja gris a la izquierda.
                          }`}>
                            {mensaje.content} {/* Texto del mensaje. */}
                          </div>
                          {/* Hora del mensaje. */}
                          <span className="text-xs text-gray-400 mt-1 mx-1">
                            {formatearHora(mensaje.created_at)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {/* Div invisible al que hacemos scroll para bajar al último mensaje. */}
                  <div ref={finalMensajesRef} />
                </div>
              )}
            </div>

            {/* Input de mensaje: siempre visible en la parte inferior. */}
            {/* flex-shrink-0: no se encoge. */}
            <div className="bg-white rounded-b-xl px-3 sm:px-4 py-3 shadow-sm border-t border-gray-100 flex-shrink-0">
              <form onSubmit={handleEnviar} className="flex gap-2 items-center">
                {/* Campo de texto con bordes redondeados (estilo chat). */}
                <input
                  type="text"
                  value={nuevoMensaje}
                  onChange={e => setNuevoMensaje(e.target.value)} // Actualiza el estado al escribir.
                  placeholder="Escribe un mensaje..."
                  className="flex-1 border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  maxLength={1000}  // Máximo 1000 caracteres por mensaje.
                  disabled={enviando} // Deshabilita mientras se envía.
                />
                {/* Botón de envío circular. */}
                <button
                  type="submit"
                  disabled={enviando || !nuevoMensaje.trim()} // Deshabilita si está enviando o el campo está vacío.
                  className="bg-primary text-white w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-primary/90 transition disabled:opacity-40 flex-shrink-0 text-sm"
                >
                  ➤ {/* Ícono de enviar. */}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PESTAÑA: ACTIVIDADES                                          */}
        {/* Solo se renderiza cuando pestañaActiva === 'actividades'.    */}
        {/* ============================================================ */}
        {pestañaActiva === 'actividades' && (
          <div className="flex-1 bg-white rounded-b-xl shadow-sm flex flex-col min-h-0">

            {/* Cabecera: descripción + botón "Nueva actividad" (solo profesores). */}
            <div className="px-4 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0 gap-2">
              <p className="text-gray-500 text-xs sm:text-sm">
                {perfil?.role === 'teacher'
                  ? 'Crea y gestiona las actividades.'  // Mensaje para profesores.
                  : 'Actividades de tu profesor.'}       // Mensaje para estudiantes.
              </p>
              {/* El botón "+ Nueva" solo aparece si el usuario es profesor. */}
              {perfil?.role === 'teacher' && (
                <button
                  onClick={() => setMostrarCrearActividad(true)} // Abre el modal de creación.
                  className="bg-primary text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-primary/90 transition text-xs sm:text-sm font-medium flex-shrink-0"
                >
                  + Nueva {/* Texto compacto en móvil. */}
                </button>
              )}
            </div>

            {/* Mensaje de error en la pestaña de actividades. */}
            {errorActividades && (
              <div className="mx-4 mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-xs">
                {errorActividades}
              </div>
            )}
            {/* Mensaje de éxito (crear actividad o entregar). */}
            {exitoActividades && (
              <div className="mx-4 mt-3 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-xs">
                {exitoActividades}
              </div>
            )}

            {/* Lista de actividades con scroll. */}
            <div className="flex-1 px-4 py-4 overflow-y-auto min-h-0">
              {cargandoActividades ? (
                // Spinner de carga.
                <div className="text-center text-gray-400 py-12 text-sm">
                  Cargando actividades...
                </div>
              ) : actividades.length === 0 ? (
                // Estado vacío: no hay actividades.
                <div className="text-center py-16">
                  <div className="text-5xl sm:text-6xl mb-4">📋</div>
                  <p className="text-gray-500 text-sm sm:text-lg">
                    {perfil?.role === 'teacher'
                      ? '¡Crea la primera actividad!'                     // Para profesores.
                      : 'Tu profesor aún no ha publicado actividades.'}    // Para estudiantes.
                  </p>
                </div>
              ) : (
                // Lista de tarjetas de actividades.
                <div className="space-y-3 sm:space-y-4">
                  {actividades.map(actividad => {
                    const yaEntregada = misEntregas.includes(actividad.id) // Verifica si ya entregué esta actividad.
                    return (
                      // Tarjeta de cada actividad.
                      <div
                        key={actividad.id}
                        className="border border-gray-100 rounded-xl p-4 sm:p-5 hover:shadow-sm transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Columna izquierda: título, descripción, fecha. */}
                          <div className="flex-1 min-w-0">
                            {/* Título de la actividad. */}
                            <h3 className="font-bold text-gray-800 text-sm sm:text-base">
                              {actividad.title}
                            </h3>
                            {/* Descripción (solo si existe). */}
                            {actividad.description && (
                              <p className="text-gray-500 text-xs sm:text-sm mt-1">
                                {actividad.description}
                              </p>
                            )}
                            {/* Fecha de entrega (solo si el profesor la definió). */}
                            {actividad.due_date && (
                              <p className="text-xs text-orange-500 mt-2 font-medium">
                                📅 {formatearFecha(actividad.due_date)}
                              </p>
                            )}
                            {/* Fecha de creación de la actividad. */}
                            <p className="text-xs text-gray-400 mt-1">
                              {formatearFecha(actividad.created_at)}
                            </p>
                          </div>

                          {/* Columna derecha: botón de entrega (solo estudiantes). */}
                          {perfil?.role === 'student' && (
                            <div className="flex-shrink-0">
                              {yaEntregada ? (
                                // Si ya entregó, muestra el badge verde "✓ Entregada".
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                  ✓ Entregada
                                </span>
                              ) : (
                                // Si aún no entregó, muestra el botón "Entregar".
                                <button
                                  onClick={() => handleEntregar(actividad.id)} // Registra la entrega.
                                  disabled={entregando === actividad.id}       // Deshabilita mientras procesa.
                                  className="bg-primary text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm hover:bg-primary/90 transition disabled:opacity-50"
                                >
                                  {/* Muestra "..." mientras procesa, o "Entregar" normalmente. */}
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

      {/* Modal de creación de actividad (solo visible cuando mostrarCrearActividad es true). */}
      {mostrarCrearActividad && (
        <CrearActividad
          grupoId={grupoId}                                        // ID del grupo donde se crea la actividad.
          onActividadCreada={handleActividadCreada}                // Callback al crear exitosamente.
          onCancelar={() => setMostrarCrearActividad(false)}       // Callback al cancelar.
        />
      )}
    </div>
  )
}
