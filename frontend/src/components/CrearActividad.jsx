// Importa el hook useState de React para manejar los estados del formulario
import { useState } from 'react'

// Importa la función que guarda la actividad en la base de datos Supabase
import { crearActividad } from '../services/actividades.js'

// Importa la función que usa la IA de Groq para generar título y descripción
import { generarActividad } from '../services/groq.js'

// Importa el contexto de autenticación para obtener los datos del usuario logueado
import { useAuth } from '../context/AuthContext.jsx'

// ============================================================
// COMPONENTE: CrearActividad — Modal para nueva actividad
// Props:
//   grupoId          → ID del grupo donde se creará la actividad
//   onActividadCreada → función que se llama con la nueva actividad al guardar exitosamente
//   onCancelar       → función que se llama al presionar el botón Cancelar
// ============================================================
export default function CrearActividad({ grupoId, onActividadCreada, onCancelar }) {

  // ── ESTADOS DEL FORMULARIO MANUAL ──
  const [titulo, setTitulo] = useState('')           // Texto del campo "Título" de la actividad
  const [descripcion, setDescripcion] = useState('') // Texto del campo "Descripción" de la actividad
  const [fechaEntrega, setFechaEntrega] = useState('') // Fecha y hora límite de entrega (opcional)
  const [cargando, setCargando] = useState(false)    // true mientras se guarda la actividad en Supabase
  const [error, setError] = useState('')             // Mensaje de error del formulario principal (vacío = sin error)

  // Obtiene el perfil del usuario logueado (se usa su ID como creador de la actividad)
  const { perfil } = useAuth()

  // ── ESTADOS DEL GENERADOR CON IA ──
  const [temaIA, setTemaIA] = useState('')           // Texto que el profesor escribe como tema para la IA
  const [generandoIA, setGenerandoIA] = useState(false) // true mientras la IA está generando título y descripción
  const [errorIA, setErrorIA] = useState('')         // Mensaje de error del generador IA (vacío = sin error)

  // Función: llama a la IA con el tema ingresado y rellena automáticamente título y descripción
  async function handleGenerarConIA() {
    if (!temaIA.trim()) { setErrorIA('Escribe un tema para generar la actividad.'); return } // Valida que no esté vacío
    setGenerandoIA(true)                             // Activa el spinner del botón "Generar"
    setErrorIA('')                                   // Limpia cualquier error previo de la IA
    try {
      const resultado = await generarActividad(temaIA.trim()) // Llama a la API de Groq con el tema
      setTitulo(resultado.titulo)                    // Rellena el campo Título con el texto generado por la IA
      setDescripcion(resultado.descripcion)          // Rellena el campo Descripción con el texto generado por la IA
      setErrorIA('')                                 // Confirma que no hay error (limpieza redundante por claridad)
    } catch {
      setErrorIA('Error al generar con IA. Intenta de nuevo.') // Muestra error si la IA falla
    } finally {
      setGenerandoIA(false)                          // Siempre desactiva el spinner al terminar (éxito o error)
    }
  }

  // Función: maneja el envío del formulario para guardar la actividad en Supabase
  async function handleSubmit(e) {
    e.preventDefault()                               // Evita que el formulario recargue la página
    if (!titulo.trim()) { setError('El título es obligatorio.'); return } // Valida que el título no esté vacío
    setCargando(true)                                // Activa el estado de carga en el botón "Crear actividad"
    setError('')                                     // Limpia errores previos del formulario

    // Llama al servicio de Supabase para insertar la actividad en la base de datos
    const { data, error: errorCrear } = await crearActividad(
      grupoId,          // ID del grupo al que pertenece la actividad
      titulo.trim(),    // Título sin espacios extra
      descripcion.trim(), // Descripción sin espacios extra
      fechaEntrega || null, // Fecha de entrega o null si no se ingresó ninguna
      perfil.id         // ID del profesor creador (del contexto de autenticación)
    )

    setCargando(false)                               // Desactiva el estado de carga

    // Si Supabase devolvió un error, muestra el mensaje y detiene la ejecución
    if (errorCrear) { setError('Error al crear la actividad. Intenta de nuevo.'); return }

    // Si todo salió bien, notifica al componente padre con la nueva actividad para actualizar la lista
    onActividadCreada(data)
  }

  return (
    // Fondo oscuro semitransparente que cubre toda la pantalla (overlay del modal)
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      {/* Contenedor blanco del modal */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">

        {/* ── CABECERA DEL MODAL ── */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
          <h2 className="text-xl font-bold text-white">📋 Nueva actividad</h2>   {/* Título del modal */}
          <p className="text-blue-100 text-sm mt-0.5">Crea una tarea para tus estudiantes</p> {/* Subtítulo */}
        </div>

        <div className="p-6">

          {/* ── SECCIÓN: GENERADOR CON IA ── */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-5">

            {/* Etiqueta de la sección */}
            <p className="text-xs font-semibold text-indigo-700 mb-2 flex items-center gap-1.5">
              <span>✨</span> Generar con IA
            </p>

            {/* Fila con input de tema + botón generar */}
            <div className="flex gap-2">

              {/* Campo donde el profesor escribe el tema (ej: "fracciones", "fotosíntesis") */}
              <input
                type="text"
                value={temaIA}                                     // Valor controlado por el estado temaIA
                onChange={e => { setTemaIA(e.target.value); setErrorIA('') }} // Actualiza el tema y limpia el error al escribir
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleGenerarConIA())} // Enter en este campo también genera
                placeholder="Ej: fracciones, células, Segunda Guerra Mundial..."
                className="flex-1 bg-white border border-indigo-300 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                disabled={generandoIA}                             // Se desactiva mientras la IA está generando
              />

              {/* Botón para disparar la generación con IA */}
              <button
                type="button"                                      // type="button" evita que envíe el formulario principal
                onClick={handleGenerarConIA}                       // Llama a la función de generación
                disabled={generandoIA || !temaIA.trim()}           // Deshabilitado si ya genera o si el campo está vacío
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 flex-shrink-0"
              >
                {/* Muestra spinner mientras genera, o el texto normal si está listo */}
                {generandoIA ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {/* Spinner giratorio */}
                    Generando...
                  </>
                ) : (
                  <>✨ Generar</>                                  // Estado normal del botón
                )}
              </button>
            </div>

            {/* Mensaje de error del generador IA (solo visible si hay error) */}
            {errorIA && (
              <p className="text-red-600 text-xs mt-1.5">⚠️ {errorIA}</p>
            )}

            {/* Texto de ayuda — solo aparece si no hay error activo */}
            {!errorIA && (
              <p className="text-indigo-500 text-xs mt-1.5">
                La IA completará el título y la descripción automáticamente.
              </p>
            )}
          </div>

          {/* Mensaje de error del formulario principal (solo visible si hay error al guardar) */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* ── FORMULARIO PRINCIPAL ── */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Campo: Título (obligatorio) */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Título <span className="text-red-500">*</span>     {/* Asterisco rojo indica campo obligatorio */}
              </label>
              <input
                type="text"
                value={titulo}                                       // Controlado por el estado titulo (puede ser llenado por la IA)
                onChange={e => setTitulo(e.target.value)}           // Actualiza el estado al editar manualmente
                placeholder="Ej: Taller de matemáticas #1"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                maxLength={200}                                      // Límite de 200 caracteres para el título
              />
            </div>

            {/* Campo: Descripción (opcional) */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Descripción <span className="text-slate-400 font-normal text-xs">(opcional)</span>
              </label>
              <textarea
                value={descripcion}                                  // Controlado por el estado descripcion (puede ser llenado por la IA)
                onChange={e => setDescripcion(e.target.value)}      // Actualiza el estado al editar manualmente
                placeholder="Instrucciones de la actividad..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                rows={3}                                             // Muestra 3 líneas de alto por defecto
                maxLength={1000}                                     // Límite de 1000 caracteres para la descripción
              />
            </div>

            {/* Campo: Fecha de entrega (opcional) */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Fecha de entrega <span className="text-slate-400 font-normal text-xs">(opcional)</span>
              </label>
              <input
                type="datetime-local"                                // Permite seleccionar fecha Y hora exacta
                value={fechaEntrega}                                 // Controlado por el estado fechaEntrega
                onChange={e => setFechaEntrega(e.target.value)}     // Actualiza el estado al cambiar la fecha
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* ── BOTONES DE ACCIÓN ── */}
            <div className="flex gap-3 pt-2">

              {/* Botón Cancelar — cierra el modal sin guardar */}
              <button
                type="button"                                        // type="button" evita que envíe el formulario
                onClick={onCancelar}                                 // Llama a la función de cierre pasada como prop
                className="flex-1 border-2 border-slate-200 text-slate-700 py-2.5 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition font-semibold text-sm"
              >
                Cancelar
              </button>

              {/* Botón Crear actividad — envía el formulario */}
              <button
                type="submit"                                        // type="submit" activa el onSubmit del formulario
                disabled={cargando}                                  // Deshabilitado mientras se guarda en Supabase
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl transition font-semibold disabled:opacity-50 text-sm shadow-sm"
              >
                {/* Muestra spinner mientras guarda, o el texto normal si está listo */}
                {cargando ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {/* Spinner giratorio */}
                    Creando...
                  </span>
                ) : 'Crear actividad'}                              {/* Texto normal del botón */}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}