import { supabase } from './supabase.js' // Importa el cliente de Supabase.

// ============================================================
// FUNCIÓN: obtenerActividades
// ============================================================
// Obtiene todas las actividades de un grupo específico.
// Incluye el nombre del profesor que las creó.
// Parámetros:
//   - grupoId: el ID del grupo.
// ============================================================
export async function obtenerActividades(grupoId) {

  const { data, error } = await supabase
    .from('activities')              // Tabla de actividades.
    .select('*')                     // Trae todos los campos.
    .eq('group_id', grupoId)         // Solo actividades de este grupo.
    .order('created_at', { ascending: false }) // Las más recientes primero.

  return { data, error }
}


// ============================================================
// FUNCIÓN: crearActividad
// ============================================================
// Inserta una nueva actividad en la base de datos.
// Parámetros:
//   - grupoId: ID del grupo donde se publica la actividad.
//   - titulo: título de la actividad.
//   - descripcion: instrucciones (puede ser vacío).
//   - fechaEntrega: fecha límite (puede ser null).
//   - profesorId: ID del profesor que la crea.
// ============================================================
export async function crearActividad(grupoId, titulo, descripcion, fechaEntrega, profesorId) {

  // Log para depurar — ver qué valores se están enviando.
  console.log('Creando actividad con:', { grupoId, titulo, descripcion, fechaEntrega, profesorId })

  // Insertar la actividad.
  const { error } = await supabase
    .from('activities')              // Tabla de actividades.
    .insert({
      group_id:    grupoId,          // Grupo al que pertenece.
      title:       titulo,           // Título de la actividad.
      description: descripcion || null, // Descripción (null si está vacía).
      // Convertir la fecha a ISO 8601 completo con zona horaria.
      due_date: fechaEntrega ? new Date(fechaEntrega).toISOString() : null,
      created_by:  profesorId,       // ID del profesor que la crea.
    })

  if (error) {
    console.error('Error INSERT activities:', error) // Log del error real de Supabase.
    return { data: null, error }
  }

  // Construimos el objeto localmente para no hacer otro SELECT.
  const data = {
    id:          crypto.randomUUID(), // ID temporal para la lista local.
    title:       titulo,
    description: descripcion || null,
    due_date:    fechaEntrega || null,
    created_at:  new Date().toISOString(),
    created_by:  profesorId,
  }

  return { data, error: null }
}


// ============================================================
// FUNCIÓN: entregarActividad
// ============================================================
// Registra que un estudiante entregó una actividad.
// Parámetros:
//   - actividadId: ID de la actividad a entregar.
//   - estudianteId: ID del estudiante que entrega.
// ============================================================
export async function entregarActividad(actividadId, estudianteId) {

  const { data, error } = await supabase
    .from('activity_submissions')    // Tabla de entregas.
    .insert({
      activity_id: actividadId,      // Actividad que se entrega.
      student_id:  estudianteId,     // Estudiante que entrega.
    })
    .select()                        // Devuelve el registro creado.
    .single()

  return { data, error }
}


// ============================================================
// FUNCIÓN: obtenerMisEntregas
// ============================================================
// Obtiene todos los IDs de actividades que un estudiante ya entregó.
// Parámetros:
//   - estudianteId: ID del estudiante.
// ============================================================
export async function obtenerMisEntregas(estudianteId) {

  const { data, error } = await supabase
    .from('activity_submissions')    // Tabla de entregas.
    .select('activity_id')           // Solo necesitamos el ID de la actividad.
    .eq('student_id', estudianteId)  // Solo las entregas de este estudiante.

  return { data, error }
}
