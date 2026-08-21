// Importa hooks de React para manejo de estado y efectos secundarios
import { useState } from 'react'

// Importa la función que llama a Groq para generar la rúbrica de evaluación
import { generarRubrica } from '../services/groq.js'

// ============================================================
// ModalRubrica — Modal para que el profesor genere una rúbrica con IA
// Props:
//   actividad → objeto { titulo, descripcion } de la actividad seleccionada
//   onCerrar  → función que cierra el modal
// ============================================================
export default function ModalRubrica({ actividad, onCerrar }) {

  // Estado: texto de la rúbrica generada por la IA (vacío hasta que se genera)
  const [rubrica, setRubrica] = useState('')

  // Estado: true mientras la IA está procesando — muestra spinner y deshabilita botón
  const [cargando, setCargando] = useState(false)

  // Estado: mensaje de error si falla la generación
  const [error, setError] = useState('')

  // Estado: true después de copiar al portapapeles — cambia el texto del botón a "¡Copiado!"
  const [copiado, setCopiado] = useState(false)

  // Función: solicita a la IA que genere la rúbrica para esta actividad
  async function handleGenerar() {
    setCargando(true)                                       // Activa el spinner de carga
    setError('')                                            // Limpia errores previos
    setRubrica('')                                          // Limpia la rúbrica anterior si hay

    try {
      // Llama a la IA pasando el título y la descripción de la actividad
      const resultado = await generarRubrica(actividad.titulo, actividad.descripcion)
      setRubrica(resultado)                                 // Guarda la rúbrica generada en el estado
    } catch {
      // Si hay error de red o de la API, muestra mensaje al usuario
      setError('No se pudo generar la rúbrica. Intenta de nuevo.')
    } finally {
      setCargando(false)                                    // Siempre desactiva el spinner al terminar
    }
  }

  // Función: copia el texto de la rúbrica al portapapeles y muestra confirmación brevemente
  async function handleCopiar() {
    await navigator.clipboard.writeText(rubrica)           // Copia el texto al portapapeles del sistema
    setCopiado(true)                                       // Cambia el botón a "¡Copiado!"
    setTimeout(() => setCopiado(false), 2000)              // Vuelve al texto original después de 2 segundos
  }

  return (
    // Fondo oscuro que cubre toda la pantalla detrás del modal
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      {/* Contenedor del modal — máximo 500px, scroll interno para rúbricas largas */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── CABECERA ── */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">📊 Rúbrica de Evaluación</h2>    {/* Título del modal */}
            {/* Nombre de la actividad como subtítulo — muestra contexto al profesor */}
            <p className="text-emerald-100 text-sm mt-0.5 truncate max-w-xs">{actividad.titulo}</p>
          </div>
          {/* Botón X para cerrar el modal */}
          <button onClick={onCerrar} className="text-white/80 hover:text-white p-1 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── CUERPO DEL MODAL (scrollable) ── */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── ESTADO INICIAL: muestra la tarjeta de la actividad y el botón generar ── */}
          {!rubrica && !cargando && (
            <div className="text-center">

              {/* Ícono decorativo */}
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                📊
              </div>

              {/* Texto explicativo */}
              <p className="text-gray-600 text-sm mb-4">
                La IA generará una rúbrica con criterios de evaluación para:
              </p>

              {/* Tarjeta que muestra el título y descripción de la actividad */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left mb-6">
                <p className="font-semibold text-gray-800 text-sm">{actividad.titulo}</p>           {/* Título de la actividad */}
                {actividad.descripcion && (
                  <p className="text-gray-500 text-xs mt-1 leading-relaxed">{actividad.descripcion}</p> {/* Descripción si existe */}
                )}
              </div>

              {/* Botón principal para iniciar la generación */}
              <button
                onClick={handleGenerar}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 mx-auto"
              >
                ✨ Generar Rúbrica
              </button>
            </div>
          )}

          {/* ── ESTADO DE CARGA: spinner mientras la IA procesa ── */}
          {cargando && (
            <div className="flex flex-col items-center py-12 gap-3">
              {/* Spinner circular animado con colores del tema esmeralda */}
              <span className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-gray-500 text-sm">Generando rúbrica...</p>
            </div>
          )}

          {/* ── ESTADO CON RÚBRICA: muestra el resultado generado ── */}
          {rubrica && !cargando && (
            <div>
              {/* Encabezado con título y botones de acción */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-700">Rúbrica generada</p>
                <div className="flex gap-2">
                  {/* Botón regenerar — llama de nuevo a la IA para obtener una versión diferente */}
                  <button
                    onClick={handleGenerar}
                    className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    🔄 Regenerar
                  </button>
                  {/* Botón copiar — copia el texto de la rúbrica al portapapeles */}
                  <button
                    onClick={handleCopiar}
                    className="text-xs text-emerald-600 hover:text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    {copiado ? '✅ ¡Copiado!' : '📋 Copiar'}    {/* Cambia el texto al copiar */}
                  </button>
                </div>
              </div>

              {/* Área de texto con la rúbrica generada — scroll si es larga */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                {rubrica}                                       {/* Texto completo de la rúbrica */}
              </div>
            </div>
          )}

          {/* Mensaje de error — solo visible si hubo un problema */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mt-4">
              ⚠️ {error}
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
