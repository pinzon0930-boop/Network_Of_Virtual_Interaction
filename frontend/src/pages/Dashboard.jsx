import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { cerrarSesion } from '../services/auth.js'
import { obtenerMisGrupos } from '../services/grupos.js'
import { supabase } from '../services/supabase.js'

export default function Dashboard() {

  const { perfil } = useAuth()
  const navigate   = useNavigate()

  const [grupos,           setGrupos]           = useState([])
  const [pendientes,       setPendientes]       = useState(0)
  const [totalActividades, setTotalActividades] = useState(0)
  const [cargando,         setCargando]         = useState(true)

  useEffect(() => {
    if (!perfil) return
    cargarDatos()
  }, [perfil])

  async function cargarDatos() {
    setCargando(true)
    const { data: misGrupos } = await obtenerMisGrupos(perfil.id, perfil.role)
    const listaGrupos = misGrupos || []
    setGrupos(listaGrupos)
    if (perfil.role === 'student' && listaGrupos.length > 0) {
      await contarPendientes(listaGrupos)
    }
    setCargando(false)
  }

  async function contarPendientes(listaGrupos) {
    const grupoIds = listaGrupos.map(g => g.id)
    const { data: todasActividades } = await supabase
      .from('activities')
      .select('id')
      .in('group_id', grupoIds)
    const actividades = todasActividades || []
    setTotalActividades(actividades.length)
    if (actividades.length === 0) return
    const { data: misEntregas } = await supabase
      .from('activity_submissions')
      .select('activity_id')
      .eq('student_id', perfil.id)
    const idsEntregados = (misEntregas || []).map(e => e.activity_id)
    const sinEntregar = actividades.filter(a => !idsEntregados.includes(a.id))
    setPendientes(sinEntregar.length)
  }

  async function handleLogout() {
    await cerrarSesion()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎓</span>
            <span className="text-xl font-bold text-primary">Educa AI</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium text-sm">{perfil?.name}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              perfil?.role === 'teacher'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {perfil?.role === 'teacher' ? 'Profesor' : 'Estudiante'}
            </span>
            <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 transition">
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            ¡Hola, {perfil?.name}! {perfil?.role === 'teacher' ? '👨‍🏫' : '📚'}
          </h1>
          <p className="text-gray-500 mt-1">
            {perfil?.role === 'teacher'
              ? 'Aquí tienes un resumen de tus grupos y actividades.'
              : 'Aquí tienes un resumen de tus clases y tareas pendientes.'}
          </p>
        </div>

        {cargando ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3 animate-pulse">⏳</div>
            Cargando tu información...
          </div>
        ) : (
          <>
            <div className={`grid gap-4 mb-8 ${
              perfil?.role === 'student' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'
            }`}>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-500 text-sm font-medium">
                    {perfil?.role === 'teacher' ? 'Mis grupos' : 'Mis clases'}
                  </span>
                  <span className="text-2xl">👥</span>
                </div>
                <div className="text-4xl font-bold text-gray-800">{grupos.length}</div>
                <p className="text-gray-400 text-xs mt-1">
                  {grupos.length === 1 ? 'grupo activo' : 'grupos activos'}
                </p>
              </div>

              {perfil?.role === 'student' && (
                <div className={`rounded-2xl p-6 shadow-sm border ${
                  pendientes > 0 ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-medium ${pendientes > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      Actividades pendientes
                    </span>
                    <span className="text-2xl">{pendientes > 0 ? '📌' : '✅'}</span>
                  </div>
                  <div className={`text-4xl font-bold ${pendientes > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {pendientes}
                  </div>
                  <p className={`text-xs mt-1 ${pendientes > 0 ? 'text-orange-400' : 'text-green-500'}`}>
                    {pendientes === 0 ? '¡Al día con todas!' : `de ${totalActividades} actividades`}
                  </p>
                </div>
              )}

              <button
                onClick={() => navigate('/grupos')}
                className="bg-primary text-white rounded-2xl p-6 shadow-sm hover:bg-primary/90 transition text-left"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/80 text-sm font-medium">Acceso rápido</span>
                  <span className="text-2xl">→</span>
                </div>
                <div className="text-xl font-bold">
                  {perfil?.role === 'teacher' ? 'Ver mis grupos' : 'Ver mis clases'}
                </div>
                <p className="text-white/70 text-xs mt-1">
                  {perfil?.role === 'teacher'
                    ? 'Administra tus grupos y crea actividades'
                    : 'Entra al chat y entrega tus tareas'}
                </p>
              </button>
            </div>

            {grupos.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">
                    {perfil?.role === 'teacher' ? 'Mis grupos' : 'Mis clases'}
                  </h2>
                  {grupos.length > 3 && (
                    <button onClick={() => navigate('/grupos')} className="text-primary text-sm hover:underline">
                      Ver todos ({grupos.length}) →
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grupos.slice(0, 3).map(grupo => (
                    <div
                      key={grupo.id}
                      onClick={() => navigate(`/grupos/${grupo.id}`)}
                      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/30 transition cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
                          📖
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-800 truncate">{grupo.name}</h3>
                          {grupo.description && (
                            <p className="text-gray-500 text-xs mt-0.5 truncate">{grupo.description}</p>
                          )}
                        </div>
                      </div>
                      {perfil?.role === 'teacher' && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-xs text-gray-400">Código:</span>
                          <span className="font-mono font-bold text-primary text-sm tracking-widest">
                            {grupo.access_code}
                          </span>
                        </div>
                      )}
                      {perfil?.role === 'student' && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <span className="text-primary text-xs font-medium">Entrar al grupo →</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {grupos.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                <div className="text-6xl mb-4">{perfil?.role === 'teacher' ? '📚' : '🎒'}</div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">
                  {perfil?.role === 'teacher' ? '¡Crea tu primer grupo!' : 'Aún no tienes clases'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {perfil?.role === 'teacher'
                    ? 'Crea un grupo y comparte el código con tus estudiantes.'
                    : 'Pide el código de acceso a tu profesor y únete.'}
                </p>
                <button
                  onClick={() => navigate('/grupos')}
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition font-medium"
                >
                  {perfil?.role === 'teacher' ? 'Crear grupo' : 'Unirme a un grupo'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}