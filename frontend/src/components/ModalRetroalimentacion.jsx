// Importa useState para manejar la respuesta del estudiante, carga y el feedback generado
import { useState } from 'react'
// Importa la función que llama a la IA para generar retroalimentación
import { generarRetroalimentacion } from '../services/groq.js'

// ============================================================
// ModalRetroalimentacion — El profesor pega la respuesta del estudiante
//                          y la IA genera un comentario de feedback constructivo
// Props:
//   actividad → objeto con { titulo } de la actividad que se evalúa
//   onCerrar  → función para cerrar el modal
// ============================================================
export default function ModalRetroalimentacion({ actividad, onCerrar }) {
  const [respuesta, setRespuesta] = useState('')      // Texto de la respuesta del estudiante pegada por el profesor
  const [feedback, setFeedback] = useState('')        // Comentario de retroalimentación generado por la IA
  const [cargando, setCargando] = useState(false)     // true mientras la IA genera el feedback
  const [error, setError] = useState('')              // Mensaje de error si falla la generación
  const [copiado, setCopiado] = useState(false)       // true brevemente al copiar al portapapeles

  // Función: envía la respuesta del estudiante a la IA y guarda el feedback
  async function handleGenerar() {
    if (!respuesta.trim()) { setError('Pega la respuesta del estudiante antes de continuar.'); return }
    setCargando(true)
    setError('')
    setFeedback('')  // Limpia feedback anterior
    try {
      const resultado = await generarRetroalimentacion(actividad.titulo, respuesta.trim())
      setFeedback(resultado)  // Guarda el texto de retroalimentación
    } catch {
      setError('Error al generar la retroalimentación. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  // Función: copia el feedback al portapapeles para pegarlo en el sistema de notas
  function handleCopiar() {
    navigator.clipboard.writeText(feedback)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    // Fondo oscuro que cubre toda la pantalla
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── CABECERA ── */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">💬 Retroalimentación IA</h2>
            <p className="text-orange-100 text-sm mt-0.5 line-clamp-1">{actividad.titulo}</p>
          </div>
          <button onClick={onCerrar} className="text-white/80 hover:text-white p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">

          {/* ── ENTRADA: respuesta del estudiante ── */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Respuesta del estudiante
            </label>
            {/* Área de texto donde el profesor pega o escribe la respuesta del estudiante */}
            <textarea
              value={respuesta}
              onChange={e => { setRespuesta(e.target.value); setError('') }}
              placeholder="Pega aquí la respuesta del estudiante..."
              rows={5}                                        // 5 líneas de alto por defecto
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none text-sm"
            />
          </div>

          {/* Mensaje de error */}
          {error && <p className="text-red-600 text-sm">⚠️ {error}</p>}

          {/* Botón para generar la retroalimentación */}
          <button
            onClick={handleGenerar}
            disabled={cargando || !respuesta.trim()}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {cargando ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generando retroalimentación...
              </>
            ) : '✨ Generar Retroalimentación'}
          </button>

          {/* ── RESULTADO: feedback generado ── */}
          {feedback && !cargando && (
            <div>
              {/* Encabezado del resultado con botones de acción */}
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold text-slate-700">Retroalimentación sugerida</p>
                <div className="flex gap-2">
                  {/* Regenerar para obtener una versión diferente */}
                  <button
                    onClick={handleGenerar}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    🔄 Regenerar
                  </button>
                  {/* Copiar para pegar en otro sistema */}
                  <button
                    onClick={handleCopiar}
                    className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    {copiado ? '✅ ¡Copiado!' : '📋 Copiar'}
                  </button>
                </div>
              </div>
              {/* Caja con el texto del feedback */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-slate-800 text-sm leading-relaxed">{feedback}</p>
              </div>
              <p className="text-slate-400 text-xs mt-2 text-center">
                💡 Puedes editar este texto antes de enviárselo al estudiante
              </p>
            </div>
          )}
        </div>

        {/* ── PIE DEL MODAL ── */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onCerrar}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}