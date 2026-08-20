import { useState } from 'react'
import { crearGrupo } from '../services/grupos.js'
import { useAuth } from '../context/AuthContext.jsx'

// ============================================================
// COMPONENTE: CrearGrupo — Modal para crear un nuevo grupo
// ============================================================
export default function CrearGrupo({ onGrupoCreado, onCancelar }) {

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const { perfil } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nombre.trim()) { setError('El nombre del grupo es obligatorio.'); return }
    setCargando(true)
    setError('')
    const { data, error: errorCrear } = await crearGrupo(nombre.trim(), descripcion.trim(), perfil.id)
    setCargando(false)
    if (errorCrear) { setError('Error al crear el grupo. Intenta de nuevo.'); return }
    onGrupoCreado(data)
  }

  return (
    // Overlay con blur sutil
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">

        {/* Cabecera del modal */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
          <h2 className="text-xl font-bold text-white">Crear nuevo grupo</h2>
          <p className="text-blue-100 text-sm mt-0.5">El código de acceso se generará automáticamente</p>
        </div>

        <div className="p-6">

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Nombre */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Nombre del grupo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Matemáticas 10°, Física General..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                maxLength={100}
                autoFocus
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
                placeholder="Describe brevemente el grupo..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                rows={3}
                maxLength={500}
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
                ) : 'Crear grupo'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}
