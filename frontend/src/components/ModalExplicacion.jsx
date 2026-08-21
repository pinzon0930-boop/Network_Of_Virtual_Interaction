// Importa hooks de React: useState para manejar datos, useEffect para acciones automáticas al montar
import { useState, useEffect } from 'react'

// Importa la función que llama a Groq para generar una explicación simple de la actividad
import { resumirActividad } from '../services/groq.js'

// ============================================================
// ModalExplicacion — Modal para que el ESTUDIANTE entienda una actividad
// La IA genera una explicación simplificada automáticamente al abrirse.
//
// Flujo automático:
//   1. El estudiante presiona "🔍 Explícame esta actividad"
//   2. El modal se abre y de inmediato llama a la IA (sin botón extra)
//   3. Mientras genera, muestra un spinner
//   4. Al terminar muestra la explicación en lenguaje sencillo
//   5. El estudiante puede pedir otra explicación o cerrar
//
// Props:
//   actividad → objeto { titulo, descripcion } de la actividad seleccionada
//   onCerrar  → función que cierra el modal
// ============================================================
export default function ModalExplicacion({ actividad, onCerrar }) {

  // Estado: texto de la explicación generada por la IA (vacío hasta que responde)
  const [explicacion, setExplicacion] = useState('')

  // Estado: true mientras la IA procesa — muestra spinner
  const [cargando, setCargando] = useState(true)            // Empieza en true porque genera automáticamente

  // Estado: mensaje de error si la petición a la IA falla
  const [error, setError] = useState('')

  // Efecto: se ejecuta automáticamente cuando el modal se monta (abre)
  // No espera que el estudiante presione ningún botón — genera de inmediato
  useEffect(() => {
    generarExplicacion()                                    // Llama a la función de generación al montar
  }, [])                                                    // Array vacío = solo se ejecuta una vez al montar

  // Función: solicita a la IA una explicación simple de la actividad
  async function generarExplicacion() {
    setCargando(true)                                       // Activa el spinner de carga
    setError('')                                            // Limpia errores anteriores
    setExplicacion('')                                      // Limpia la explicación anterior

    try {
      // Llama a la IA con el título y la descripción de la actividad para contexto completo
      const resultado = await resumirActividad(actividad.titulo, actividad.descripcion)
      setExplicacion(resultado)                             // Guarda la explicación generada
    } catch {
      // Si hay error de red o de la API, muestra mensaje amigable al estudiante
      setError('No se pudo cargar la explicación. Intenta de nuevo.')
    } finally {
      setCargando(false)                                    // Siempre desactiva el spinner al terminar
    }
  }

  return (
    // Fondo oscuro semitransparente que cubre toda la pantalla detrás del modal
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      {/* Contenedor del modal — máximo 420px de ancho, compacto para estudiantes */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* ── CABECERA ── */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">🔍 ¿De qué trata esta actividad?</h2>   {/* Título del modal */}
            {/* Nombre de la actividad como subtítulo — el estudiante sabe de cuál se trata */}
            <p className="text-blue-100 text-xs mt-0.5 truncate max-w-xs">{actividad.titulo}</p>
          </div>
          {/* Botón X para cerrar el modal */}
          <button onClick={onCerrar} className="text-white/80 hover:text-white p-1 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── CUERPO DEL MODAL ── */}
        <div className="p-6">

          {/* ── ESTADO DE CARGA: spinner animado mientras la IA genera la explicación ── */}
          {cargando && (
            <div className="flex flex-col items-center py-8 gap-3">
              {/* Spinner con colores del tema azul/cyan */}
              <span className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-gray-500 text-sm">Preparando tu explicación...</p>
            </div>
          )}

          {/* ── ESTADO CON EXPLICACIÓN: muestra la respuesta de la IA ── */}
          {explicacion && !cargando && (
            <div>
              {/* Identificador del asistente — similar al diseño de AsistenteIA */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">🤖</span>
                </div>
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Educa AI Explica</p>
              </div>

              {/* Caja con la explicación simplificada — lenguaje para estudiantes de 12 años */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
                <p className="text-gray-800 text-sm leading-relaxed">
                  {explicacion}                             {/* Texto de la explicación generada por la IA */}
                </p>
              </div>

              {/* Enlace para pedir una explicación diferente — regenera llamando a la IA de nuevo */}
              <button
                onClick={generarExplicacion}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-1 flex items-center justify-center gap-1"
              >
                🔄 Explicar de otra manera
              </button>
            </div>
          )}

          {/* ── ESTADO DE ERROR: algo salió mal al contactar la IA ── */}
          {error && !cargando && (
            <div className="text-center py-4">
              {/* Mensaje de error con emoji para no asustar al estudiante */}
              <p className="text-red-600 text-sm mb-4">⚠️ {error}</p>
              {/* Botón para reintentar la generación */}
              <button
                onClick={generarExplicacion}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                Reintentar
              </button>
            </div>
          )}
        </div>

        {/* ── PIE DEL MODAL ── */}
        <div className="px-6 pb-6 flex justify-end">
          {/* Botón principal de cierre — texto amigable "¡Entendido!" para los estudiantes */}
          <button
            onClick={onCerrar}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            ¡Entendido!
          </button>
        </div>
      </div>
    </div>
  )
}
