import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { obtenerMisGrupos, unirseAGrupo } from '../services/grupos.js'
import CrearGrupo from '../components/CrearGrupo.jsx'
import { cerrarSesion } from '../services/auth.js'

// ============================================================
// COMPONENTE: Grupos — Lista de grupos del usuario
// ============================================================
export default function Grupos() {

  const [grupos, setGrupos] = useState([])
  const [mostrarModal, setMostrarModal] = useState(false)
  const [codigoIngreso, setCodigoIngreso] = useState('')
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [cargando, setCargando] = useState(true)
  const [uniendose, setUniendose] = useState(false)

  const { perfil } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (perfil) cargarGrupos()
  }, [perfil])

  async function cargarGrupos() {
    setCargando(true)
    const { data, error: errorCarga } = await obtenerMisGrupos(perfil.id, perfil.role)
    setCargando(false)
    if (errorCarga) { setError('Error al cargar los grupos.'); return }
    setGrupos(data || [])
  }

  function handleGrupoCreado(nuevoGrupo) {
    setMostrarModal(false)
    setGrupos(prev => [nuevoGrupo, ...prev])
    setExito('¡Grupo creado exitosamente!')
    setTimeout(() => setExito(''), 4000)
  }

  async function handleUnirse(e) {
    e.preventDefault()
    if (!codigoIngreso.trim()) { setError('Escribe el código de acceso del grupo.'); return }
    setUniendose(true)
    setError('')
    const { grupo, error: errorUnirse } = await unirseAGrupo(codigoIngreso.trim(), perfil.id)
    setUniendose(false)
    if (errorUnirse) { setError(errorUnirse.message || 'Error al unirse al grupo.'); return }
    setCodigoIngreso('')
    setExito(`¡Te uniste a "${grupo.name}" exitosamente!`)
    setTimeout(() => setExito(''), 4000)
    cargarGrupos()
  }

  async function handleLogout() {
    await cerrarSesion()
    navigate('/login')
  }

  const esProfesor = perfil?.role === 'teacher'

  // Colores por índice para las tarjetas de grupos
  const colores = [
    'from-blue-500 to-blue-700',
    'from-indigo-500 to-indigo-700',
    'from-violet-500 to-violet-700',
    'from-sky-500 to-sky-700',
    'from-cyan-500 to-cyan-700',
    'from-teal-500 to-teal-700',
  ]

  return (
    <div className="min-h-screen bg-slate-100">

      {/* ---- NAVBAR OSCURO ---- */}
      <nav className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">

          {/* Logo + volver */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-slate-400 hover:text-white transition-colors text-lg"
              title="Volver al dashboard"
            >
              ←
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-white font-bold text-base"
            >
              <span className="text-xl">🎓</span>
              <span className="hidden sm:inline">NOVI</span>
            </button>
          </div>

          {/* Usuario */}
          <div className="flex items-center gap-3">
            <span className="text-slate-300 text-sm hidden sm:block">{perfil?.name}</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              esProfesor
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}>
              {esProfesor ? 'Profesor' : 'Estudiante'}
            </span>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      {/* ---- CONTENIDO PRINCIPAL ---- */}
      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Encabezado de sección */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {esProfesor ? 'Mis grupos' : 'Mis clases'}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {esProfesor
                ? `${grupos.length} grupo${grupos.length !== 1 ? 's' : ''} creado${grupos.length !== 1 ? 's' : ''}`
                : `Inscrito en ${grupos.length} grupo${grupos.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Botón crear grupo (solo profesores) */}
          {esProfesor && (
            <button
              onClick={() => setMostrarModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-colors font-semibold flex items-center gap-2 shadow-sm text-sm"
            >
              <span>+</span> Crear grupo
            </button>
          )}
        </div>

        {/* ---- SECCIÓN UNIRSE (solo estudiantes) ---- */}
        {!esProfesor && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                🔑
              </div>
              <h2 className="font-bold text-slate-800">Unirte a un grupo</h2>
            </div>
            <form onSubmit={handleUnirse} className="flex gap-3">
              <input
                type="text"
                value={codigoIngreso}
                onChange={e => setCodigoIngreso(e.target.value.toUpperCase())}
                placeholder="Código de acceso (ej: K7PQMZ)"
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 font-mono tracking-widest text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                maxLength={6}
              />
              <button
                type="submit"
                disabled={uniendose}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl transition-colors font-semibold disabled:opacity-50 text-sm flex-shrink-0"
              >
                {uniendose ? '...' : 'Unirse'}
              </button>
            </form>
          </div>
        )}

        {/* Alertas */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}
        {exito && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2">
            <span>✅</span> {exito}
          </div>
        )}

        {/* ---- LISTA DE GRUPOS ---- */}
        {cargando ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-sm">Cargando grupos...</p>
          </div>
        ) : grupos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
            <div className="text-7xl mb-4">{esProfesor ? '📚' : '🎒'}</div>
            <h3 className="font-bold text-slate-800 text-lg mb-2">
              {esProfesor ? 'Aún no has creado grupos' : 'Aún no perteneces a grupos'}
            </h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              {esProfesor
                ? 'Crea tu primer grupo y comparte el código con tus estudiantes.'
                : 'Pide el código de acceso a tu profesor para unirte a una clase.'}
            </p>
            {esProfesor && (
              <button
                onClick={() => setMostrarModal(true)}
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
              >
                + Crear mi primer grupo
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {grupos.map((grupo, index) => (
              <div
                key={grupo.id}
                onClick={() => navigate(`/grupos/${grupo.id}`)}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer overflow-hidden group"
              >
                {/* Franja de color superior */}
                <div className={`h-2 bg-gradient-to-r ${colores[index % colores.length]}`} />

                <div className="p-6">
                  {/* Nombre y descripción */}
                  <div className="mb-4">
                    <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">
                      {grupo.name}
                    </h3>
                    {grupo.description && (
                      <p className="text-slate-500 text-sm line-clamp-2">
                        {grupo.description}
                      </p>
                    )}
                  </div>

                  {/* Código de acceso (solo profesores) */}
                  {esProfesor && (
                    <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                      <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">Código de acceso</p>
                      <p className="font-mono font-bold text-blue-600 text-xl tracking-widest">
                        {grupo.access_code}
                      </p>
                    </div>
                  )}

                  {/* Botón de acceso */}
                  <div className="mt-4 text-blue-600 text-sm font-semibold flex items-center gap-1">
                    Entrar al grupo
                    <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {mostrarModal && (
        <CrearGrupo
          onGrupoCreado={handleGrupoCreado}
          onCancelar={() => setMostrarModal(false)}
        />
      )}
    </div>
  )
}
