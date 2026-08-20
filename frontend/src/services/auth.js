import { supabase } from './supabase.js' // Importa el cliente de Supabase que creamos.

// ============================================================
// FUNCIÓN: registrarUsuario
// ============================================================
// Registra un nuevo usuario con email, contraseña, nombre y rol.
// El nombre y rol se pasan como "metadata" a Supabase Auth.
// Un trigger en la base de datos crea automáticamente el perfil
// en la tabla "users" usando esa metadata.
// ============================================================
export async function registrarUsuario(email, password, name, role) {

  // Crea el usuario en Supabase Auth.
  // "options.data" guarda información extra (nombre y rol) dentro del usuario de Auth.
  // El trigger de la base de datos leerá estos datos para crear el perfil.
  const { data, error } = await supabase.auth.signUp({
    email,    // El correo del usuario.
    password, // La contraseña del usuario.
    options: {
      data: {
        name, // Nombre del usuario — el trigger lo leerá como raw_user_meta_data->>'name'
        role, // Rol del usuario — el trigger lo leerá como raw_user_meta_data->>'role'
      }
    }
  })

  // Si hay un error en el registro, lo devolvemos para manejarlo en la pantalla.
  if (error) return { error }

  // Si todo salió bien, devolvemos el usuario creado.
  // El trigger ya se encargó de crear el perfil en la tabla "users".
  return { data }
}


// ============================================================
// FUNCIÓN: iniciarSesion
// ============================================================
// Inicia sesión con email y contraseña usando Supabase Auth.
// ============================================================
export async function iniciarSesion(email, password) {

  // signInWithPassword verifica el email y contraseña en Supabase Auth.
  const { data, error } = await supabase.auth.signInWithPassword({
    email,    // El correo del usuario.
    password, // La contraseña del usuario.
  })

  // Devuelve el resultado (con datos si fue exitoso, o con error si falló).
  return { data, error }
}


// ============================================================
// FUNCIÓN: cerrarSesion
// ============================================================
// Cierra la sesión del usuario actual.
// ============================================================
export async function cerrarSesion() {

  // signOut elimina la sesión activa del usuario.
  const { error } = await supabase.auth.signOut()

  // Devuelve el resultado.
  return { error }
}


// ============================================================
// FUNCIÓN: obtenerPerfil
// ============================================================
// Obtiene la información del perfil del usuario desde la tabla "users".
// Se usa para saber el nombre y el rol del usuario después de iniciar sesión.
// ============================================================
export async function obtenerPerfil(userId) {

  // Consulta la tabla "users" buscando el registro con el ID del usuario.
  const { data, error } = await supabase
    .from('users')       // Selecciona la tabla "users".
    .select('*')         // Trae todos los campos (id, name, email, role, created_at).
    .eq('id', userId)    // Filtra por el ID del usuario (.eq significa "equal" = igual).
    .single()            // Espera un solo resultado (no una lista).

  // Devuelve el perfil o el error.
  return { data, error }
}
