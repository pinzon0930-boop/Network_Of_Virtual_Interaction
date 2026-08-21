// Importa useState para manejar carga y la explicación generada
import { useState, useEffect } from 'react'
// Importa la función que llama a la IA para simplificar las instrucciones
import { resumirActividad } from '../services/groq.js'

// ============================================================
// ModalExplicacion — Explica una actividad en lenguaje simple para el estudiante
// Props:
//   actividad → objeto con { titulo, descripcion }
//   onCerrar  → función para cerrar el modal
// ============================================================
export default function ModalExplicacion({ actividad, onCerrar }) {
  const [explicacion, setExplicacion] = useState('')    // Texto con la explicación simplificada
  const [cargando, setCargando] = useState(true)        // true al abrir (genera automáticamente)
  const [error, setError] = useState('')                // Mensaje de error si falla

  // Al abrir el modal, genera la explicación automáticamente (sin que el estudiante presione nada)
  useEffect(() => {
    generarExplicacion()
  }, [])  // El array vacío hace que solo se ejecute una vez al montar el componente

  // Función: llama a la IA para simplificar las instrucciones de la actividad
  async function generarExplicacion() {
    setCargando(true)
    setError('')
    setExplicacion('')
    try {
      const resultado = await resumirActividad(actividad.titulo, actividad.descripcion)
      setExplicacion(resultado)  // Guarda la explicación simplificada
    } catch {
      setError('No se pudo generar la explicación. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    // Fondo oscuro que cubre toda la pantalla
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">

        {/* ── CABECERA ── */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">🔍 ¿De qué trata esta actividad?</h2>
            <p className="text-blue-100 text-sm mt-0.5 line-clamp-1">{actividad.titulo}</p>
          </div>
          <button onClick={onCerrar} className="text-white/80 hover:text-white p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">

          {/* Indicador de carga mientras la IA procesa */}
          {cargando && (
            <div className="flex flex-col items-center py-10 gap-3">
              <span className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">Preparando la explicación...</p>
            </div>
          )}

          {/* Mensaje de error con opción de reintentar */}
          {error && !cargando && (
            <div className="text-center py-8">
              <p className="text-red-600 text-sm mb-4">⚠️ {error}</p>
              <button
                onClick={generarExplicacion}
                className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold"
              >
                Intentar de nuevo
              </button>
            </div>
          )}

          {/* Explicación generada */}
          {explicacion && !cargando && (
            <>
              {/* Ícono decorativo y título de la sección */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">🤖</span>
                </div>
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Educa AI explica</p>
              </div>

              {/* Caja con la explicación simplificada */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
                <p className="text-slate-800 text-sm leading-relaxed">{explicacion}</p>
              </div>

              {/* Botón para regenerar si el estudiante quiere una explicación diferente */}
              <button
                onClick={generarExplicacion}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
              >
                🔄 Explicar de otra manera
              </button>
            </>
          )}
        </div>

        {/* ── PIE DEL MODAL ── */}
        <div className="px-6 pb-5 flex justify-end">
          <button
            onClick={onCerrar}
            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            ¡Entendido!
          </button>
        </div>
      </div>
    </div>
  )
}
