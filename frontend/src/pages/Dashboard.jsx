import React from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { cerrarSesion } from '../services/auth.js'
import { useNavigate } from 'react-router-dom'

// ============================================================
// PÁGINA: Dashboard — Pantalla principal post-login
// ============================================================
function Dashboard() {

  const { perfil } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await cerrarSesion()
    navigate('/login')
  }

  const esProfesor = perfil?.role === 'teacher'

  return (
    <div className="min-h-screen bg-slate-100">

      {/* ---- NAVBAR OSCURO ---- */}
      <nav className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🎓</span>
            <span className="text-lg font-bold text-white">Educa AI</span>
          </div>

          {/* Usuario y acciones */}
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
              className="text-slate-400 hover:text-white transition-colors text-sm ml-1"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      {/* ---- CONTENIDO ---- */}
      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Banner de bienvenida */}
        <div className={`rounded-2xl p-8 mb-6 relative overflow-hidden ${
          esProfesor
            ? 'bg-gradient-to-r from-blue-600 to-blue-800'
            : 'bg-gradient-to-r from-slate-700 to-blue-800'
        }`}>
          {/* Decoración */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3" />
          <div className="absolute right-16 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />

          <div className="relative z-10">
            <div className="text-5xl mb-3">{esProfesor ? '👨‍🏫' : '📚'}</div>
            <h2 className="text-2xl font-bold text-white mb-1">
              ¡Bienvenido, {perfil?.name}!
            </h2>
            <p className="text-blue-100 text-sm">
              {esProfesor
                ? 'Gestiona tus grupos y comunícate con tus estudiantes desde aquí.'
                : 'Accede a tus clases, chatea con tu profesor y entrega tus actividades.'
              }
            </p>
          </div>
        </div>

        {/* Cards de acceso rápido */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Card: Ir a grupos */}
          <button
            onClick={() => navigate('/grupos')}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 transition-all text-left group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:bg-blue-200 transition-colors">
              {esProfesor ? '📖' : '🎒'}
            </div>
            <h3 className="font-bold text-slate-900 mb-1">
              {esProfesor ? 'Mis grupos' : 'Mis clases'}
            </h3>
            <p className="text-slate-500 text-sm">
              {esProfesor
                ? 'Crea y administra tus grupos de clase'
                : 'Accede a tus grupos y chatea con tu profesor'}
            </p>
            <div className="mt-4 text-blue-600 text-sm font-semibold flex items-center gap-1">
              Ir ahora <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </div>
          </button>

          {/* Card: Estado del sistema */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl mb-4">
              ✅
            </div>
            <h3 className="font-bold text-slate-900 mb-1">Sistema activo</h3>
            <p className="text-slate-500 text-sm">
              Autenticación, grupos, chat y actividades funcionando correctamente.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-600 text-sm font-medium">Conectado a Supabase</span>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

export default Dashboard
