import { supabase } from './supabase.js' // Importa el cliente de Supabase.

// ============================================================
// FUNCIÓN: obtenerMensajes
// ============================================================
// Obtiene los últimos 50 mensajes de un grupo específico.
// Los mensajes vienen ordenados del más antiguo al más reciente.
// Parámetros:
//   - grupoId: el ID del grupo del cual queremos los mensajes.
// ============================================================
export async function obtenerMensajes(grupoId) {

  // Consulta la tabla "messages" con un JOIN a "users" para obtener el nombre del remitente.
  const { data, error } = await supabase
    .from('messages')              // Tabla de mensajes.
    .select(`
      id,
      content,
      created_at,
      user_id,
      users (
        name,
        role
      )
    `)                             // Trae el mensaje y el perfil del usuario que lo envió.
    .eq('group_id', grupoId)       // Solo mensajes de este grupo.
    .order('created_at', { ascending: true }) // Del más antiguo al más reciente.
    .limit(50)                     // Máximo 50 mensajes.

  // Devuelve los mensajes o el error.
  return { data, error }
}


// ============================================================
// FUNCIÓN: enviarMensaje
// ============================================================
// Inserta un nuevo mensaje en la base de datos.
// Parámetros:
//   - grupoId: ID del grupo donde se envía el mensaje.
//   - userId: ID del usuario que envía el mensaje.
//   - contenido: texto del mensaje.
// ============================================================
export async function enviarMensaje(grupoId, userId, contenido) {

  // Inserta el mensaje en la tabla "messages".
  const { data, error } = await supabase
    .from('messages')       // Tabla de mensajes.
    .insert({
      group_id: grupoId,   // ID del grupo.
      user_id: userId,     // ID del usuario que escribe.
      content: contenido,  // Texto del mensaje.
    })
    .select(`
      id,
      content,
      created_at,
      user_id,
      users (
        name,
        role
      )
    `)                     // Devuelve el mensaje recién creado con datos del usuario.
    .single()              // Un solo resultado.

  // Devuelve el mensaje o el error.
  return { data, error }
}


// ============================================================
// FUNCIÓN: suscribirseAMensajes
// ============================================================
// Crea una suscripción en tiempo real a los mensajes de un grupo.
// Cuando alguien envía un mensaje, se llama automáticamente a "onNuevoMensaje".
// Parámetros:
//   - grupoId: ID del grupo a escuchar.
//   - onNuevoMensaje: función que se ejecuta cuando llega un nuevo mensaje.
// Devuelve: el canal de suscripción (para poder desuscribirse después).
// ============================================================
export function suscribirseAMensajes(grupoId, onNuevoMensaje) {

  // Crea un canal de Supabase Realtime.
  // "channel" es un nombre único para esta suscripción.
  const canal = supabase
    .channel(`mensajes-grupo-${grupoId}`) // Nombre único del canal para este grupo.
    .on(
      'postgres_changes',           // Escucha cambios en la base de datos PostgreSQL.
      {
        event: 'INSERT',            // Solo cuando se inserta un nuevo registro.
        schema: 'public',           // En el schema público.
        table: 'messages',          // En la tabla "messages".
        filter: `group_id=eq.${grupoId}`, // Solo mensajes de este grupo.
      },
      async (payload) => {
        // payload.new contiene el nuevo mensaje insertado.
        // Pero solo tiene los campos de la tabla, no el JOIN con users.
        // Entonces hacemos una consulta extra para obtener el nombre del usuario.
        const { data: mensajeCompleto } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            created_at,
            user_id,
            users (
              name,
              role
            )
          `)
          .eq('id', payload.new.id) // Busca el mensaje recién insertado por su ID.
          .single()

        // Llama a la función del componente con el mensaje completo.
        if (mensajeCompleto) {
          onNuevoMensaje(mensajeCompleto)
        }
      }
    )
    .subscribe() // Activa la suscripción.

  // Devuelve el canal para que el componente pueda cancelar la suscripción
  // cuando el usuario salga de la página.
  return canal
}


// ============================================================
// FUNCIÓN: desuscribirse
// ============================================================
// Cancela una suscripción de Realtime.
// Importante: siempre llamar esto cuando el componente se desmonta.
// Parámetros:
//   - canal: el canal devuelto por suscribirseAMensajes.
// ============================================================
export function desuscribirse(canal) {
  // Elimina el canal de Supabase para liberar recursos.
  supabase.removeChannel(canal)
}
