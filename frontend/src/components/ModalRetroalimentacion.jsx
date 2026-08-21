// Importa el hook useState para manejar los datos del formulario y la respuesta de la IA
import { useState } from 'react'

// Importa la función que llama a Groq para generar retroalimentación sobre la respuesta del estudiante
import { generarRetroalimentacion } from '../services/groq.js'

// ============================================================
// ModalRetroalimentacion — Modal para que el profesor obtenga
// feedback constructivo sobre la respuesta de un estudiante.
//
// Flujo:
//   1. El profesor pega la respuesta del estudiante en el textarea
//   2. Presiona "Generar Retroalimentación"
//   3. La IA analiza la respuesta en contexto de la actividad
//   4. Se muestra el feedback con fortalezas y sugerencias
//
// Props:
//   actividad → objeto { titulo } de la actividad seleccionada
//   onCerrar  → función que cierra el modal
// ============================================================
export default function ModalRetroalimentacion({ actividad, onCerrar }) {

  // Estado: texto que el profesor pega — la respuesta escrita por el estudiante
  const [respuestaEstudiante, setRespuestaEstudiante] = useState('')

  // Estado: retroalimentación generada por la IA (vacío hasta que se genera)
  const [feedback, setFeedback] = useState('')

  // Estado: true mientras la IA procesa — muestra spinner y deshabilita el botón
  const [cargando, setCargando] = useState(false)

  // Estado: mensaje de error si la petición a la IA falla
  const [error, setError] = useState('')

  // Función principal: envía el contexto de la actividad y la respuesta del estudiante a la IA
  async function handleGenerar() {
    // No hace nada si el textarea está vacío o ya hay una petición en curso
    if (!respuestaEstudiante.trim() || cargando) return

    setCargando(true)                                       // Activa el spinner de carga
    setError('')                                            // Limpia errores anteriores
    setFeedback('')                                         // Limpia el feedback anterior si hay

    try {
      // Llama a la IA con el título de la actividad (contexto) y la respuesta del estudiante
      const resultado = await generarRetroalimentacion(actividad.titulo, respuestaEstudiante)
      setFeedback(resultado)                                // Guarda la retroalimentación generada
    } catch {
      // Si hay fallo de red o error de la API, informa al usuario
      setError('Error al generar la retroalimentación. Intenta de nuevo.')
    } finally {
      setCargando(false)                                    // Siempre desactiva el spinner
    }
  }

  // Función: reinicia el modal al estado inicial para analizar otro estudiante
  function handleNuevo() {
    setRespuestaEstudiante('')                              // Vacía el textarea
    setFeedback('')                                         // Limpia el feedback mostrado
    setError('')                                            // Limpia cualquier error
  }

  return (
    // Fondo oscuro que cubre toda la pantalla detrás del modal
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      {/* Contenedor del modal — máximo 500px de ancho, scroll si el contenido es largo */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── CABECERA ── */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">💬 Retroalimentación IA</h2>        {/* Título del modal */}
            {/* Muestra el nombre de la actividad como contexto para el profesor */}
            <p className="text-orange-100 text-sm mt-0.5 truncate max-w-xs">{actividad.titulo}</p>
          </div>
          {/* Botón X para cerrar el modal sin guardar nada */}
          <button onClick={onCerrar} className="text-white/80 hover:text-white p-1 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── CUERPO DEL MODAL (scrollable) ── */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── FORMULARIO: visible siempre que no haya feedback generado ── */}
          {!feedback && (
            <div>
              {/* Etiqueta del textarea */}
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Respuesta del estudiante
              </label>

              {/* Textarea donde el profesor pega o escribe la respuesta del estudiante */}
              <textarea
                value={respuestaEstudiante}                   // Valor controlado por el estado
                onChange={e => setRespuestaEstudiante(e.target.value)} // Actualiza el estado con cada cambio
                placeholder="Pega aquí la respuesta del estudiante..."
                rows={6}                                      // Altura inicial de 6 líneas
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none leading-relaxed"
              />

              {/* Mensaje de error — solo visible si hubo un problema */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mt-3">
                  ⚠️ {error}
                </div>
              )}

              {/* Botón para generar la retroalimentación */}
              <button
                onClick={handleGenerar}
                disabled={!respuestaEstudiante.trim() || cargando} // Deshabilitado si el textarea está vacío
                className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {cargando ? (
                  // Spinner animado mientras la IA procesa
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analizando...
                  </>
                ) : (
                  '✨ Generar Retroalimentación'              // Texto normal cuando no está cargando
                )}
              </button>
            </div>
          )}

          {/* ── RESULTADO: muestra la retroalimentación generada ── */}
          {feedback && (
            <div>
              {/* Identificador de quién generó la respuesta */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">🤖</span>
                </div>
                <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">NOVI Retroalimenta</p>
              </div>

              {/* Caja con el texto del feedback generado */}
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-4">
                <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {feedback}                                  {/* Texto de retroalimentación de la IA */}
                </p>
              </div>

              {/* Botón para analizar otro estudiante — reinicia el formulario */}
              <button
                onClick={handleNuevo}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-1 flex items-center justify-center gap-1"
              >
                🔄 Analizar otro estudiante
              </button>
            </div>
          )}
        </div>

        {/* ── PIE DEL MODAL ── */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end flex-shrink-0">
          {/* Botón para cerrar el modal */}
          <button
            onClick={onCerrar}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
