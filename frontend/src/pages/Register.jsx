import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registrarUsuario } from '../services/auth.js'

// ============================================================
// PÁGINA: Register — Diseño moderno con panel lateral
// ============================================================
function Register() {

  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setError('')
    setCargando(true)
    const { error } = await registrarUsuario(email, password, name, role)
    if (error) {
      if (error.message.includes('already registered')) {
        setError('Este correo ya está registrado. Intenta iniciar sesión.')
      } else {
        setError('Error al registrarse. Intenta de nuevo.')
      }
      setCargando(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ---- PANEL IZQUIERDO: Decorativo (oculto en móvil) ---- */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 flex-col items-center justify-center p-12 relative overflow-hidden">

        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-700/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

        <div className="relative z-10 text-center">
          <div className="text-7xl mb-6">🎓</div>
          <h1 className="text-4xl font-bold text-white mb-4">Únete a Educa AI</h1>
          <p className="text-blue-200 text-lg max-w-xs leading-relaxed">
            Crea tu cuenta en segundos y comienza a aprender o enseñar hoy mismo.
          </p>

          <div className="mt-10 space-y-4 text-left">
            {[
              { icon: '👨‍🏫', text: 'Profesores: crea grupos y gestiona clases' },
              { icon: '📚', text: 'Estudiantes: únete con un código simple' },
              { icon: '⚡', text: 'Comunicación instantánea y actividades' },
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

          {/* Logo móvil */}
          <div className="lg:hidden text-center mb-8">
            <div className="text-5xl mb-2">🎓</div>
            <h1 className="text-2xl font-bold text-slate-800">Educa AI</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-900">Crear cuenta</h2>
              <p className="text-slate-500 mt-1 text-sm">Es gratis y solo toma un minuto</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Campo: Nombre */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors text-sm"
                />
              </div>

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
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors text-sm"
                />
              </div>

              {/* Selector de rol */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Soy...
                </label>
                <div className="grid grid-cols-2 gap-3">

                  {/* Estudiante */}
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      role === 'student'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-slate-50'
                    }`}
                  >
                    <div className="text-2xl mb-1">📚</div>
                    <div className="text-sm font-semibold">Estudiante</div>
                  </button>

                  {/* Profesor */}
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      role === 'teacher'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-slate-50'
                    }`}
                  >
                    <div className="text-2xl mb-1">👨‍🏫</div>
                    <div className="text-sm font-semibold">Profesor</div>
                  </button>

                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2">
                  <span className="text-red-500 text-sm mt-0.5">⚠️</span>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Botón */}
              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
              >
                {cargando ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creando cuenta...
                  </span>
                ) : 'Crear cuenta'}
              </button>

            </form>

            <p className="text-center text-slate-500 mt-6 text-sm">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
