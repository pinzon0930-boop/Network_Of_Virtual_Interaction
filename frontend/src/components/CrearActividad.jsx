import { useState } from 'react'
import { crearActividad } from '../services/actividades.js'
import { generarActividad } from '../services/groq.js'
import { useAuth } from '../context/AuthContext.jsx'

// ============================================================
// COMPONENTE: CrearActividad — Modal para nueva actividad
// ============================================================
export default function CrearActividad({ grupoId, onActividadCreada, onCancelar }) {

  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const { perfil } = useAuth()

  // Estado: generador IA
  const [temaIA, setTemaIA] = useState('')
  const [generandoIA, setGenerandoIA] = useState(false)
  const [errorIA, setErrorIA] = useState('')

  async function handleGenerarConIA() {
    if (!temaIA.trim()) { setErrorIA('Escribe un tema para generar la actividad.'); return }
    setGenerandoIA(true)
    setErrorIA('')
    try {
      const resultado = await generarActividad(temaIA.trim())
      setTitulo(resultado.titulo)
      setDescripcion(resultado.descripcion)
      setErrorIA('')
    } catch {
      setErrorIA('Error al generar con IA. Intenta de nuevo.')
    } finally {
      setGenerandoIA(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!titulo.trim()) { setError('El título es obligatorio.'); return }
    setCargando(true)
    setError('')
    const { data, error: errorCrear } = await crearActividad(
      grupoId, titulo.trim(), descripcion.trim(), fechaEntrega || null, perfil.id
    )
    setCargando(false)
    if (errorCrear) { setError('Error al crear la actividad. Intenta de nuevo.'); return }
    onActividadCreada(data)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">

        {/* Cabecera */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
          <h2 className="text-xl font-bold text-white">📋 Nueva actividad</h2>
          <p className="text-blue-100 text-sm mt-0.5">Crea una tarea para tus estudiantes</p>
        </div>

        <div className="p-6">

          {/* ---- SECCIÓN: Generar con IA ---- */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-5">
            <p className="text-xs font-semibold text-indigo-700 mb-2 flex items-center gap-1.5">
              <span>✨</span> Generar con IA
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={temaIA}
                onChange={e => { setTemaIA(e.target.value); setErrorIA('') }}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleGenerarConIA())}
                placeholder="Ej: fracciones, células, Segunda Guerra Mundial..."
                className="flex-1 bg-white border border-indigo-300 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                disabled={generandoIA}
              />
              <button
                type="button"
                onClick={handleGenerarConIA}
                disabled={generandoIA || !temaIA.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 flex-shrink-0"
              >
                {generandoIA ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>✨ Generar</>
                )}
              </button>
            </div>
            {errorIA && (
              <p className="text-red-600 text-xs mt-1.5">⚠️ {errorIA}</p>
            )}
            {!errorIA && (
              <p className="text-indigo-500 text-xs mt-1.5">
                La IA completará el título y la descripción automáticamente.
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Título */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ej: Taller de matemáticas #1"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                maxLength={200}
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Descripción <span className="text-slate-400 font-normal text-xs">(opcional)</span>
              </label>
              <textarea
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Instrucciones de la actividad..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                rows={3}
                maxLength={1000}
              />
            </div>

            {/* Fecha de entrega */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Fecha de entrega <span className="text-slate-400 font-normal text-xs">(opcional)</span>
              </label>
              <input
                type="datetime-local"
                value={fechaEntrega}
                onChange={e => setFechaEntrega(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onCancelar}
                className="flex-1 border-2 border-slate-200 text-slate-700 py-2.5 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={cargando}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl transition font-semibold disabled:opacity-50 text-sm shadow-sm"
              >
                {cargando ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creando...
                  </span>
                ) : 'Crear actividad'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}
