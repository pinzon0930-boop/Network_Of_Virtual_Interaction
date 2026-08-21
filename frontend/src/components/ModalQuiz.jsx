// Importa hooks de React necesarios para manejar estado y efectos
import { useState } from 'react'

// Importa la función que llama a la API de Groq para generar preguntas de quiz
import { generarQuiz } from '../services/groq.js'

// ============================================================
// ModalQuiz — Modal para que el profesor genere un quiz con IA
// Props:
//   onCerrar → función que cierra el modal (llamada al presionar X o Cerrar)
// ============================================================
export default function ModalQuiz({ onCerrar }) {

  // Estado: tema sobre el que se generarán las preguntas (escrito por el profesor)
  const [tema, setTema] = useState('')

  // Estado: cantidad de preguntas a generar (el profesor elige en el select)
  const [cantidad, setCantidad] = useState(5)

  // Estado: array de preguntas generadas por la IA — cada elemento tiene { pregunta, opciones, correcta }
  const [preguntas, setPreguntas] = useState([])

  // Estado: true mientras la IA está procesando (muestra el spinner y deshabilita el botón)
  const [cargando, setCargando] = useState(false)

  // Estado: mensaje de error si falla la generación del quiz
  const [error, setError] = useState('')

  // Función: envía el tema y la cantidad a la IA y procesa el JSON devuelto
  async function handleGenerar() {
    if (!tema.trim() || cargando) return                    // No hace nada si no hay tema o ya hay una petición activa

    setCargando(true)                                       // Activa el indicador de carga
    setError('')                                            // Limpia cualquier error previo
    setPreguntas([])                                        // Limpia las preguntas anteriores

    try {
      const resultado = await generarQuiz(tema, cantidad)   // Llama a la IA con el tema y la cantidad elegida
      const parsed = JSON.parse(resultado)                  // Parsea el JSON devuelto por la IA
      setPreguntas(parsed.preguntas || [])                  // Guarda las preguntas en el estado (o array vacío si falla)
    } catch {
      // Si el parseo falla o hay error de red, muestra mensaje de error
      setError('Error al generar el quiz. Intenta de nuevo.')
    } finally {
      setCargando(false)                                    // Siempre desactiva el spinner al terminar
    }
  }

  // Función: copia todas las preguntas y respuestas al portapapeles como texto plano
  function handleCopiarTodo() {
    const texto = preguntas.map((p, i) =>
      `${i + 1}. ${p.pregunta}\n${p.opciones.join('\n')}\nRespuesta: ${p.correcta}`
    ).join('\n\n')                                          // Separa cada pregunta con doble salto de línea
    navigator.clipboard.writeText(texto)                   // Copia al portapapeles del navegador
  }

  return (
    // Fondo oscuro semitransparente que cubre toda la pantalla (overlay del modal)
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      {/* Contenedor del modal — ancho máximo 500px, scroll vertical si hay muchas preguntas */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── CABECERA ── */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">🎯 Generar Quiz con IA</h2>        {/* Título del modal */}
            <p className="text-violet-200 text-sm mt-0.5">Crea preguntas de opción múltiple al instante</p>  {/* Subtítulo */}
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

          {/* ── CONTROLES: tema + cantidad + botón generar ── */}
          <div className="flex gap-2 mb-6">

            {/* Campo de texto para que el profesor escriba el tema del quiz */}
            <input
              type="text"
              value={tema}                                  // Valor controlado por el estado 'tema'
              onChange={e => setTema(e.target.value)}       // Actualiza el estado con cada tecla
              onKeyDown={e => e.key === 'Enter' && handleGenerar()} // Enter también dispara la generación
              placeholder="Tema del quiz (ej: Fotosíntesis)"
              className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />

            {/* Select para elegir cuántas preguntas generar */}
            <select
              value={cantidad}                              // Valor controlado por el estado 'cantidad'
              onChange={e => setCantidad(Number(e.target.value))} // Convierte el string a número
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {/* Opciones de cantidad — de 3 a 10 preguntas */}
              <option value={3}>3 preguntas</option>
              <option value={5}>5 preguntas</option>
              <option value={7}>7 preguntas</option>
              <option value={10}>10 preguntas</option>
            </select>

            {/* Botón para disparar la generación del quiz */}
            <button
              onClick={handleGenerar}
              disabled={!tema.trim() || cargando}           // Deshabilitado si no hay tema o está cargando
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {cargando ? (
                // Spinner animado mientras la IA procesa
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                '✨'                                        // Ícono de estrella cuando no está cargando
              )}
              Generar
            </button>
          </div>

          {/* Mensaje de error — solo visible si hubo un problema */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
              ⚠️ {error}
            </div>
          )}

          {/* ── LISTA DE PREGUNTAS GENERADAS ── */}
          {preguntas.length > 0 && (
            <div>
              {/* Encabezado con contador y botón para copiar todo */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-700">
                  {preguntas.length} preguntas generadas                    {/* Muestra cuántas preguntas hay */}
                </p>
                {/* Botón para copiar todas las preguntas al portapapeles */}
                <button
                  onClick={handleCopiarTodo}
                  className="text-xs text-violet-600 hover:text-violet-800 border border-violet-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  📋 Copiar todo
                </button>
              </div>

              {/* Renderiza cada pregunta como una tarjeta */}
              <div className="space-y-4">
                {preguntas.map((p, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-4">

                    {/* Texto de la pregunta con su número */}
                    <p className="font-medium text-gray-800 text-sm mb-3">
                      <span className="text-violet-600 font-bold mr-1">{i + 1}.</span>
                      {p.pregunta}
                    </p>

                    {/* Lista de opciones de respuesta */}
                    <div className="space-y-1.5">
                      {p.opciones.map((opcion, j) => (
                        <div
                          key={j}
                          className={`px-3 py-2 rounded-lg text-sm ${
                            opcion === p.correcta
                              ? 'bg-green-50 border border-green-200 text-green-800 font-medium' // Respuesta correcta: fondo verde
                              : 'bg-gray-50 border border-gray-200 text-gray-700'               // Incorrectas: fondo gris
                          }`}
                        >
                          {/* Checkmark solo en la respuesta correcta */}
                          {opcion === p.correcta && <span className="mr-1">✅</span>}
                          {opcion}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
