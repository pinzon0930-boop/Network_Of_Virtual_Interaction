import { createClient } from '@supabase/supabase-js' // Importa la función para crear el cliente de Supabase.

// Lee las variables de entorno del archivo .env.
// import.meta.env es la forma en que Vite lee las variables de entorno.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL       // La URL del proyecto de Supabase.
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY // La clave pública de Supabase.

// Crea y exporta el cliente de Supabase.
// Este cliente se importará en todos los archivos que necesiten comunicarse con Supabase.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
