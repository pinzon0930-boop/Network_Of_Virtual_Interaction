import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { iniciarSesion } from '../services/auth.js'

// ============================================================
// PÁGINA: Login — Diseño moderno con panel lateral decorativo
// ============================================================
function Login() {

  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setCargando(true)
    const { error } = await iniciarSesion(email, password)
    if (error) {
      setError('Correo o contraseña incorrectos. Intenta de nuevo.')
      setCargando(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    // Layout de dos paneles: panel decorativo azul a la izquierda, formulario a la derecha.
    <div className="min-h-screen flex">

      {/* ---- PANEL IZQUIERDO: Decorativo (oculto en móvil) ---- */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 flex-col items-center justify-center p-12 relative overflow-hidden">

        {/* Círculos decorativos de fondo */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-700/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

        {/* Contenido del panel */}
        <div className="relative z-10 text-center">
          <div className="text-7xl mb-6">🎓</div>
          <h1 className="text-4xl font-bold text-white mb-2">NOVI</h1>
          <p className="text-blue-400 text-sm tracking-widest uppercase mb-4">Network Of Virtual Interaction</p>
          <p className="text-blue-200 text-lg max-w-xs leading-relaxed">
            La plataforma educativa que conecta profesores y estudiantes en tiempo real.
          </p>

          {/* Características destacadas */}
          <div className="mt-10 space-y-4 text-left">
            {[
              { icon: '💬', text: 'Chat en tiempo real con tu clase' },
              { icon: '📋', text: 'Gestión de actividades y entregas' },
              { icon: '🔑', text: 'Acceso con código único por grupo' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-700/40 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                  {item.icon}
                </div>
                <span className="text-blue-100 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---- PANEL DERECHO: Formulario ---- */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">

          {/* Logo en móvil (el panel izquierdo está oculto) */}
          <div className="lg:hidden text-center mb-8">
            <div className="text-5xl mb-2">🎓</div>
            <h1 className="text-2xl font-bold text-slate-800">NOVI</h1>
          </div>

          {/* Tarjeta del formulario */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-900">Bienvenido de vuelta</h2>
              <p className="text-slate-500 mt-1 text-sm">Inicia sesión en tu cuenta</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Campo: Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors text-sm"
                />
              </div>

              {/* Campo: Contraseña */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors text-sm"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2">
                  <span className="text-red-500 text-sm mt-0.5">⚠️</span>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Botón principal */}
              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
              >
                {cargando ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Iniciando sesión...
                  </span>
                ) : 'Iniciar sesión'}
              </button>

            </form>

            {/* Enlace al registro */}
            <p className="text-center text-slate-500 mt-6 text-sm">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-blue-600 font-semibold hover:text-blue-700">
                Regístrate gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login