// Importa useState para manejar el tema, estado de carga y las preguntas generadas
import { useState } from 'react'
// Importa la función que llama a la IA para generar preguntas de quiz
import { generarQuiz } from '../services/groq.js'

// ============================================================
// ModalQuiz — Modal para generar preguntas de opción múltiple con IA
// Props:
//   onCerrar → función para cerrar el modal
// ============================================================
export default function ModalQuiz({ onCerrar }) {
  const [tema, setTema] = useState('')               // Tema ingresado por el profesor
  const [cantidad, setCantidad] = useState(5)        // Cantidad de preguntas a generar (default 5)
  const [preguntas, setPreguntas] = useState([])     // Array de preguntas generadas por la IA
  const [cargando, setCargando] = useState(false)    // true mientras la IA genera las preguntas
  const [error, setError] = useState('')             // Mensaje de error si algo falla
  const [copiado, setCopiado] = useState(false)      // true brevemente al copiar al portapapeles

  // Función: llama a la IA con el tema y cantidad, actualiza el estado con las preguntas generadas
  async function handleGenerar() {
    if (!tema.trim()) { setError('Escribe un tema para generar el quiz.'); return }
    setCargando(true)
    setError('')
    setPreguntas([])  // Limpia preguntas anteriores antes de generar nuevas
    try {
      const resultado = await generarQuiz(tema.trim(), cantidad)  // Llama a la API de Groq
      setPreguntas(resultado)                                       // Guarda las preguntas en el estado
    } catch {
      setError('Error al generar el quiz. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  // Función: convierte las preguntas a texto plano y las copia al portapapeles
  function handleCopiar() {
    const texto = preguntas.map((p, i) =>
      `${i + 1}. ${p.pregunta}\n${p.opciones.join('\n')}\n✅ Respuesta: ${p.respuesta.toUpperCase()}`
    ).join('\n\n')  // Cada pregunta separada por línea en blanco

    navigator.clipboard.writeText(texto)   // Copia el texto al portapapeles del sistema
    setCopiado(true)                        // Activa el estado "Copiado" brevemente
    setTimeout(() => setCopiado(false), 2000)  // Vuelve al estado normal después de 2 segundos
  }

  return (
    // Fondo oscuro que cubre toda la pantalla
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── CABECERA ── */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">🎯 Generar Quiz con IA</h2>
            <p className="text-violet-100 text-sm mt-0.5">Crea preguntas de opción múltiple al instante</p>
          </div>
          {/* Botón cerrar */}
          <button onClick={onCerrar} className="text-white/80 hover:text-white p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">

          {/* ── CONTROLES: tema y cantidad ── */}
          <div className="flex gap-3 mb-4">
            {/* Campo: tema del quiz */}
            <input
              type="text"
              value={tema}
              onChange={e => { setTema(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleGenerar()}  // Enter también genera
              placeholder="Ej: Sistema solar, Revolución Francesa, Fracciones..."
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
              disabled={cargando}
            />

            {/* Selector: cantidad de preguntas */}
            <select
              value={cantidad}
              onChange={e => setCantidad(Number(e.target.value))}  // Convierte el valor a número
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
              disabled={cargando}
            >
              <option value={3}>3 preguntas</option>
              <option value={5}>5 preguntas</option>
              <option value={8}>8 preguntas</option>
              <option value={10}>10 preguntas</option>
            </select>

            {/* Botón generar */}
            <button
              onClick={handleGenerar}
              disabled={cargando || !tema.trim()}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 flex-shrink-0"
            >
              {cargando ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generando...
                </>
              ) : '✨ Generar'}
            </button>
          </div>

          {/* Mensaje de error */}
          {error && <p className="text-red-600 text-sm mb-4">⚠️ {error}</p>}

          {/* ── LISTA DE PREGUNTAS GENERADAS ── */}
          {preguntas.length > 0 && (
            <>
              {/* Botón copiar todo al portapapeles */}
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-semibold text-slate-700">{preguntas.length} preguntas generadas</p>
                <button
                  onClick={handleCopiar}
                  className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  {copiado ? '✅ ¡Copiado!' : '📋 Copiar todo'}
                </button>
              </div>

              {/* Renderiza cada pregunta como una tarjeta */}
              <div className="space-y-4">
                {preguntas.map((p, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    {/* Número y texto de la pregunta */}
                    <p className="font-semibold text-slate-800 text-sm mb-3">
                      <span className="text-violet-600 mr-1">{i + 1}.</span> {p.pregunta}
                    </p>

                    {/* Opciones de respuesta */}
                    <div className="space-y-1.5">
                      {p.opciones.map((opcion, j) => {
                        // Determina si esta opción es la respuesta correcta comparando la letra
                        const letra = ['a', 'b', 'c', 'd'][j]
                        const esCorrecta = p.respuesta.toLowerCase() === letra
                        return (
                          <div
                            key={j}
                            className={`text-xs px-3 py-1.5 rounded-lg ${
                              esCorrecta
                                ? 'bg-green-100 text-green-800 font-semibold border border-green-200'  // Opción correcta en verde
                                : 'bg-white text-slate-600 border border-slate-200'                     // Opciones incorrectas en blanco
                            }`}
                          >
                            {esCorrecta && '✅ '}{opcion}   {/* Muestra ✅ solo en la respuesta correcta */}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Estado vacío — antes de generar */}
          {preguntas.length === 0 && !cargando && !error && (
            <div className="text-center py-12 text-slate-400">
              <p className="text-4xl mb-3">🎯</p>
              <p className="text-sm">Escribe un tema y presiona Generar para crear el quiz</p>
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