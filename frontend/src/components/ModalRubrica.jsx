// Importa useState para manejar el estado de carga y la rúbrica generada
import { useState } from 'react'
// Importa la función que llama a la IA para generar la rúbrica
import { generarRubrica } from '../services/groq.js'

// ============================================================
// ModalRubrica — Modal para generar rúbricas de evaluación con IA
// Props:
//   actividad → objeto con { titulo, descripcion } de la actividad seleccionada
//   onCerrar  → función para cerrar el modal
// ============================================================
export default function ModalRubrica({ actividad, onCerrar }) {
  const [rubrica, setRubrica] = useState('')        // Texto de la rúbrica generada por la IA
  const [cargando, setCargando] = useState(false)   // true mientras la IA genera la rúbrica
  const [error, setError] = useState('')            // Mensaje de error si falla la generación
  const [copiado, setCopiado] = useState(false)     // true brevemente al copiar al portapapeles

  // Función: llama a la IA con el título y descripción de la actividad para generar la rúbrica
  async function handleGenerar() {
    setCargando(true)
    setError('')
    try {
      const resultado = await generarRubrica(actividad.titulo, actividad.descripcion)
      setRubrica(resultado)  // Guarda el texto de la rúbrica
    } catch {
      setError('Error al generar la rúbrica. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  // Función: copia el texto de la rúbrica al portapapeles
  function handleCopiar() {
    navigator.clipboard.writeText(rubrica)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)  // Vuelve al estado normal después de 2 segundos
  }

  return (
    // Fondo oscuro que cubre toda la pantalla
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── CABECERA ── */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">📊 Rúbrica de Evaluación</h2>
            <p className="text-emerald-100 text-sm mt-0.5 line-clamp-1">
              {actividad.titulo}  {/* Muestra el título de la actividad en la cabecera */}
            </p>
          </div>
          {/* Botón cerrar */}
          <button onClick={onCerrar} className="text-white/80 hover:text-white p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">

          {/* Estado inicial — antes de generar */}
          {!rubrica && !cargando && (
            <div className="text-center py-10">
              <p className="text-4xl mb-4">📊</p>
              <p className="text-slate-600 text-sm mb-2">
                La IA generará una rúbrica con criterios de evaluación para:
              </p>
              {/* Muestra título y descripción de la actividad como contexto */}
              <div className="bg-slate-50 rounded-xl p-4 text-left mb-6 border border-slate-200">
                <p className="font-semibold text-slate-800 text-sm">{actividad.titulo}</p>
                {actividad.descripcion && (
                  <p className="text-slate-500 text-xs mt-1">{actividad.descripcion}</p>
                )}
              </div>
              {/* Botón principal para generar la rúbrica */}
              <button
                onClick={handleGenerar}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                ✨ Generar Rúbrica
              </button>
            </div>
          )}

          {/* Indicador de carga mientras la IA procesa */}
          {cargando && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <span className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">Generando rúbrica de evaluación...</p>
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="text-center py-10">
              <p className="text-red-600 text-sm mb-4">⚠️ {error}</p>
              <button onClick={handleGenerar} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                Intentar de nuevo
              </button>
            </div>
          )}

          {/* Rúbrica generada — se muestra como texto formateado */}
          {rubrica && !cargando && (
            <>
              {/* Barra de acciones: copiar y regenerar */}
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-semibold text-slate-700">Rúbrica generada</p>
                <div className="flex gap-2">
                  {/* Botón regenerar para obtener una rúbrica diferente */}
                  <button
                    onClick={handleGenerar}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    🔄 Regenerar
                  </button>
                  {/* Botón copiar al portapapeles */}
                  <button
                    onClick={handleCopiar}
                    className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    {copiado ? '✅ ¡Copiado!' : '📋 Copiar'}
                  </button>
                </div>
              </div>

              {/* Contenedor del texto de la rúbrica con scroll si es muy larga */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                {/* Renderiza el texto preservando saltos de línea y espacios */}
                <pre className="whitespace-pre-wrap text-slate-800 text-sm font-sans leading-relaxed">
                  {rubrica}
                </pre>
              </div>
            </>
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
