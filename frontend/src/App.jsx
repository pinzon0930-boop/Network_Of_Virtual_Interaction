import React from 'react'                                    // Importa React.
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom' // Herramientas de navegación.
import { AuthProvider, useAuth } from './context/AuthContext.jsx' // El proveedor de autenticación.
import Login from './pages/Login.jsx'         // Página de inicio de sesión.
import Register from './pages/Register.jsx'   // Página de registro.
import Dashboard from './pages/Dashboard.jsx' // Página principal.
import Grupos from './pages/Grupos.jsx'       // Página de grupos.
import GrupoDetalle from './pages/GrupoDetalle.jsx' // Página de chat de un grupo.

// ============================================================
// COMPONENTE: RutaProtegida
// ============================================================
// Protege rutas que solo deben ser accesibles para usuarios autenticados.
// Si el usuario no ha iniciado sesión, lo redirige al login.
// ============================================================
function RutaProtegida({ children }) {
  const { usuario } = useAuth() // Obtiene el usuario del contexto de autenticación.

  if (!usuario) {
    // Si no hay usuario autenticado, redirige al login.
    // "replace" reemplaza la entrada en el historial (no agrega una nueva).
    return <Navigate to="/login" replace />
  }

  // Si hay usuario, muestra el contenido protegido.
  return children
}

// ============================================================
// COMPONENTE: RutaPublica
// ============================================================
// Rutas que solo deben ser accesibles para usuarios NO autenticados.
// Si el usuario ya inició sesión, lo redirige al dashboard.
// Evita que un usuario autenticado vea el login o registro.
// ============================================================
function RutaPublica({ children }) {
  const { usuario } = useAuth() // Obtiene el usuario del contexto.

  if (usuario) {
    // Si ya hay usuario autenticado, redirige al dashboard.
    return <Navigate to="/dashboard" replace />
  }

  // Si no hay usuario, muestra el contenido público (login/register).
  return children
}

// ============================================================
// COMPONENTE: App
// ============================================================
// Componente principal que configura todas las rutas de la aplicación.
// BrowserRouter habilita la navegación en el navegador.
// AuthProvider envuelve todo para que el contexto esté disponible.
// ============================================================
function App() {
  return (
    // BrowserRouter: habilita el enrutamiento basado en la URL del navegador.
    <BrowserRouter>

      {/* AuthProvider: hace disponible la información del usuario en toda la app. */}
      <AuthProvider>

        {/* Routes: contenedor de todas las rutas. Solo renderiza la ruta que coincide con la URL actual. */}
        <Routes>

          {/* Ruta raíz: redirige al login si no hay sesión, o al dashboard si la hay. */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Ruta de login: solo accesible si NO hay sesión activa. */}
          <Route
            path="/login"
            element={
              <RutaPublica>
                <Login />
              </RutaPublica>
            }
          />

          {/* Ruta de registro: solo accesible si NO hay sesión activa. */}
          <Route
            path="/register"
            element={
              <RutaPublica>
                <Register />
              </RutaPublica>
            }
          />

          {/* Ruta del dashboard: solo accesible si HAY sesión activa. */}
          <Route
            path="/dashboard"
            element={
              <RutaProtegida>
                <Dashboard />
              </RutaProtegida>
            }
          />

          {/* Ruta de grupos: lista de grupos del usuario. */}
          <Route
            path="/grupos"
            element={
              <RutaProtegida>
                <Grupos />
              </RutaProtegida>
            }
          />

          {/* Ruta del detalle de un grupo: muestra el chat. :id es el ID del grupo. */}
          <Route
            path="/grupos/:id"
            element={
              <RutaProtegida>
                <GrupoDetalle />
              </RutaProtegida>
            }
          />

          {/* Ruta por defecto: si la URL no existe, redirige al dashboard. */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App // Exporta App para que main.jsx pueda usarlo.
