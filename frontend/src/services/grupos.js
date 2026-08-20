import { supabase } from './supabase.js' // Importa el cliente de Supabase.

// ============================================================
// FUNCIÓN: generarCodigo
// ============================================================
// Genera un código aleatorio de 6 caracteres en mayúsculas.
// Ejemplo: "A3F9KL", "BX72MQ"
// Este código es el que los estudiantes usarán para unirse al grupo.
// ============================================================
function generarCodigo() {
  // Los caracteres posibles para el código (sin letras confusas como O, 0, I, l).
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

  // Variable donde vamos acumulando el código.
  let codigo = ''

  // Repetimos 6 veces para construir un código de 6 caracteres.
  for (let i = 0; i < 6; i++) {
    // Math.random() da un número entre 0 y 1.
    // Multiplicado por la longitud del string y redondeado hacia abajo,
    // da un índice aleatorio entre 0 y la última posición.
    const indice = Math.floor(Math.random() * caracteres.length)

    // Agrega el carácter en esa posición al código.
    codigo += caracteres[indice]
  }

  return codigo // Devuelve el código generado. Ejemplo: "K7PQMZ"
}


// ============================================================
// FUNCIÓN: crearGrupo
// ============================================================
// Crea un nuevo grupo en la base de datos.
// Solo los profesores pueden crear grupos.
// Parámetros:
//   - nombre: nombre del grupo. Ejemplo: "Matemáticas 10°"
//   - descripcion: descripción opcional del grupo.
//   - teacherId: el ID del profesor que crea el grupo.
// ============================================================
export async function crearGrupo(nombre, descripcion, teacherId) {

  // Genera un código de acceso único para este grupo.
  const codigo = generarCodigo()

  // Inserta el nuevo grupo en la tabla "groups".
  const { data, error } = await supabase
    .from('groups')       // Tabla de grupos.
    .insert({             // Inserta un nuevo registro.
      name: nombre,             // Nombre del grupo.
      description: descripcion, // Descripción del grupo.
      teacher_id: teacherId,    // ID del profesor que lo creó.
      access_code: codigo,      // Código de acceso generado.
    })
    .select()             // Pide que devuelva el registro recién creado.
    .single()             // Espera un solo resultado.

  // Devuelve el grupo creado o el error.
  return { data, error }
}


// ============================================================
// FUNCIÓN: obtenerMisGrupos
// ============================================================
// Obtiene todos los grupos relacionados con el usuario.
// - Si es profesor: obtiene los grupos que él creó.
// - Si es estudiante: obtiene los grupos a los que está unido.
// Parámetros:
//   - userId: el ID del usuario.
//   - rol: 'teacher' o 'student'.
// ============================================================
export async function obtenerMisGrupos(userId, rol) {

  // Si el usuario es profesor, busca los grupos donde él es el teacher_id.
  if (rol === 'teacher') {
    const { data, error } = await supabase
      .from('groups')               // Tabla de grupos.
      .select('*')                  // Trae todos los campos.
      .eq('teacher_id', userId)     // Solo los grupos de este profesor.
      .order('created_at', { ascending: false }) // Más recientes primero.

    return { data, error }
  }

  // Si el usuario es estudiante, busca en group_members los grupos a los que pertenece.
  // Usamos una consulta con JOIN: group_members → groups.
  const { data, error } = await supabase
    .from('group_members')          // Tabla de miembros de grupos.
    .select('groups(*)')            // Trae los datos del grupo relacionado.
    .eq('student_id', userId)       // Solo los registros de este estudiante.

  // data es un array de objetos con formato { groups: { id, name, ... } }.
  // Lo transformamos para que sea un array directo de grupos.
  const grupos = data ? data.map(item => item.groups) : []

  return { data: grupos, error }
}


// ============================================================
// FUNCIÓN: unirseAGrupo
// ============================================================
// Permite a un estudiante unirse a un grupo usando su código de acceso.
// Parámetros:
//   - codigo: el código de 6 caracteres del grupo.
//   - studentId: el ID del estudiante.
// ============================================================
export async function unirseAGrupo(codigo, studentId) {

  // Paso 1: Buscar el grupo con ese código de acceso.
  const { data: grupo, error: errorBusqueda } = await supabase
    .from('groups')                         // Tabla de grupos.
    .select('*')                            // Trae todos los campos.
    .eq('access_code', codigo.toUpperCase()) // Busca por código (en mayúsculas).
    .single()                               // Espera un solo resultado.

  // Si no encontró ningún grupo con ese código, devuelve error.
  if (errorBusqueda || !grupo) {
    return { error: { message: 'Código de acceso inválido. Verifica e intenta de nuevo.' } }
  }

  // Paso 2: Verificar si el estudiante ya está en el grupo.
  const { data: yaExiste } = await supabase
    .from('group_members')           // Tabla de miembros.
    .select('id')                    // Solo necesitamos saber si existe.
    .eq('group_id', grupo.id)        // Del mismo grupo.
    .eq('student_id', studentId)     // Del mismo estudiante.
    .single()                        // Un solo resultado.

  // Si ya existe la membresía, avisamos al usuario.
  if (yaExiste) {
    return { error: { message: 'Ya eres miembro de este grupo.' } }
  }

  // Paso 3: Insertar al estudiante en el grupo.
  const { data, error } = await supabase
    .from('group_members')   // Tabla de miembros.
    .insert({
      group_id: grupo.id,    // ID del grupo encontrado.
      student_id: studentId, // ID del estudiante.
    })
    .select()
    .single()

  // Si hubo error al unirse, lo devolvemos.
  if (error) return { error }

  // Si todo salió bien, devolvemos también el grupo al que se unió.
  return { data, grupo }
}
