import React, { createContext, useContext, useEffect, useState } from 'react' // Importa las herramientas de React para crear contexto y estado.
import { supabase } from '../services/supabase.js' // Importa el cliente de Supabase.
import { obtenerPerfil } from '../services/auth.js' // Importa la función para obtener el perfil del usuario.

// ============================================================
// CONTEXTO DE AUTENTICACIÓN
// ============================================================
// Un "contexto" en React es una forma de compartir información
// con todos los componentes de la aplicación sin tener que
// pasarla manualmente de componente a componente.
//
// AuthContext guardará: el usuario actual, su perfil (nombre y rol),
// y si la aplicación todavía está cargando.
// ============================================================

// Crea el contexto. Por ahora está vacío; se llenará con el Provider.
const AuthContext = createContext(null)

// ============================================================
// COMPONENTE: AuthProvider
// ============================================================
// Este componente envuelve toda la aplicación y provee la información
// del usuario a todos los componentes que la necesiten.
// ============================================================
export function AuthProvider({ children }) {

  // "usuario" guarda los datos de autenticación de Supabase (email, id, etc.).
  const [usuario, setUsuario] = useState(null)

  // "perfil" guarda los datos de nuestra tabla "users" (name, role).
  const [perfil, setPerfil] = useState(null)

  // "cargando" indica si la aplicación todavía está verificando si hay sesión activa.
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    // useEffect se ejecuta cuando el componente se monta (aparece en pantalla).
    // Aquí verificamos si ya hay un usuario con sesión activa.

    // Obtiene la sesión actual de Supabase (si el usuario ya había iniciado sesión antes).
    supabase.auth.getSession().then(async ({ data: { session } }) => {

      if (session?.user) {
        // Si hay sesión activa, guarda el usuario y obtiene su perfil.
        setUsuario(session.user)
        const { data } = await obtenerPerfil(session.user.id) // Busca nombre y rol en la tabla "users".
        setPerfil(data)
      }

      setCargando(false) // Termina el estado de carga cuando ya verificamos la sesión.
    })

    // Escucha cambios en la autenticación (login, logout, refresh de token).
    // onAuthStateChange se ejecuta automáticamente cuando el estado de autenticación cambia.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {

      if (session?.user) {
        // Si hay un usuario en la nueva sesión, actualiza el estado.
        setUsuario(session.user)
        const { data } = await obtenerPerfil(session.user.id)
        setPerfil(data)
      } else {
        // Si no hay usuario (logout), limpia el estado.
        setUsuario(null)
        setPerfil(null)
      }

      setCargando(false) // Termina la carga.
    })

    // Limpia la suscripción cuando el componente se desmonta.
    // Esto evita errores de memoria cuando el componente deja de existir.
    return () => subscription.unsubscribe()
  }, []) // El [] significa que este efecto solo se ejecuta una vez al montar el componente.

  // El valor que se comparte con todos los componentes de la aplicación.
  const valor = {
    usuario,  // Datos de autenticación (id, email).
    perfil,   // Datos del perfil (name, role).
    cargando, // Si todavía se está cargando la sesión.
  }

  // Si todavía está cargando, muestra una pantalla de espera.
  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {/* Spinner de carga simple. */}
        <div className="text-center">
          <div className="text-4xl mb-4">🎓</div>
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    // AuthContext.Provider hace disponible el "valor" para todos los componentes dentro de él.
    <AuthContext.Provider value={valor}>
      {children} {/* Renderiza todos los componentes hijos de la aplicación. */}
    </AuthContext.Provider>
  )
}

// ============================================================
// HOOK: useAuth
// ============================================================
// Un "hook" personalizado que permite a cualquier componente
// acceder fácilmente al contexto de autenticación.
// En lugar de escribir useContext(AuthContext), se escribe useAuth().
// ============================================================
export function useAuth() {
  return useContext(AuthContext) // Devuelve el valor del contexto (usuario, perfil, cargando).
}
