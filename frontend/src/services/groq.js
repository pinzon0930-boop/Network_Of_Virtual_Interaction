// URL base de la API de Groq (compatible con el formato de OpenAI)
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Lee la clave API desde las variables de entorno de Vite (definida en Render)
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

// Modelo de texto a usar en todas las funciones (definido una sola vez para fácil cambio)
const MODELO = 'openai/gpt-oss-20b'

// ─── Función auxiliar ────────────────────────────────────────────────────────
// Hace un POST a Groq con los mensajes dados y devuelve el texto de la respuesta
async function llamarGroq(mensajes, maxTokens = 600, temperature = 0.7) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODELO, messages: mensajes, max_tokens: maxTokens, temperature }),
  })
  if (!response.ok) throw new Error(`Error Groq: ${response.status}`)
  const data = await response.json()
  return data.choices[0].message.content
}

// ============================================================
// 1. preguntarIA — Tutor para estudiantes
//    Recibe una pregunta y devuelve la respuesta educativa
// ============================================================
export async function preguntarIA(pregunta) {
  return llamarGroq([
    {
      role: 'system',
      content: 'Eres un asistente educativo amigable llamado "Educa AI". Ayudas a estudiantes con sus dudas académicas de forma clara, motivadora y en español. Tus respuestas son concisas (máximo 3 párrafos) y fáciles de entender.',
    },
    { role: 'user', content: pregunta },
  ], 600, 0.7)
}

// ============================================================
// 2. generarActividad — Genera título + descripción para el modal de nueva actividad
//    Recibe el tema y devuelve { titulo, descripcion }
// ============================================================
export async function generarActividad(descripcion) {
  const texto = await llamarGroq([
    {
      role: 'system',
      content: 'Eres un asistente para profesores. Generas actividades educativas creativas. Responde ÚNICAMENTE con un JSON válido sin texto adicional, con exactamente estos campos: {"titulo": "...", "descripcion": "..."}. El título debe ser corto (máximo 8 palabras). La descripción debe ser clara e instructiva (2-3 oraciones).',
    },
    { role: 'user', content: `Genera una actividad educativa sobre: ${descripcion}` },
  ], 300, 0.8)

  const match = texto.trim().match(/\{[\s\S]*\}/)
  if (!match) throw new Error('La IA no devolvió un formato válido')
  return JSON.parse(match[0])
}

// ============================================================
// 3. generarQuiz — Genera preguntas de opción múltiple
//    Recibe el tema y la cantidad, devuelve array de preguntas
//    Cada pregunta: { pregunta, opciones: [a,b,c,d], respuesta }
// ============================================================
export async function generarQuiz(tema, cantidad = 5) {
  const texto = await llamarGroq([
    {
      role: 'system',
      content: `Eres un experto en educación. Genera exactamente ${cantidad} preguntas de opción múltiple. Responde ÚNICAMENTE con un JSON array válido, sin texto adicional, con este formato exacto: [{"pregunta":"...","opciones":["a) ...","b) ...","c) ...","d) ..."],"respuesta":"a"}]. La "respuesta" es solo la letra (a, b, c o d).`,
    },
    { role: 'user', content: `Genera ${cantidad} preguntas de opción múltiple sobre: ${tema}` },
  ], 1200, 0.8)

  const match = texto.trim().match(/\[[\s\S]*\]/)
  if (!match) throw new Error('La IA no devolvió un formato válido')
  return JSON.parse(match[0])
}

// ============================================================
// 4. generarRubrica — Genera criterios de evaluación
//    Recibe título y descripción de la actividad, devuelve texto con la rúbrica
// ============================================================
export async function generarRubrica(titulo, descripcion) {
  return llamarGroq([
    {
      role: 'system',
      content: 'Eres un experto en evaluación educativa. Genera rúbricas de evaluación claras y detalladas en español. Usa formato con criterios, niveles (Excelente, Bueno, Regular, Insuficiente) y descripción de cada nivel.',
    },
    {
      role: 'user',
      content: `Genera una rúbrica de evaluación para la siguiente actividad:\nTítulo: ${titulo}\nDescripción: ${descripcion || 'Sin descripción adicional.'}`,
    },
  ], 800, 0.6)
}

// ============================================================
// 5. generarRetroalimentacion — Genera feedback para la respuesta de un estudiante
//    Recibe el nombre de la actividad y la respuesta del estudiante
//    Devuelve un comentario de retroalimentación constructivo
// ============================================================
export async function generarRetroalimentacion(nombreActividad, respuestaEstudiante) {
  return llamarGroq([
    {
      role: 'system',
      content: 'Eres un profesor experto. Genera retroalimentación constructiva, motivadora y específica para la respuesta de un estudiante. Señala lo que hizo bien, lo que puede mejorar y cómo mejorarlo. Máximo 4 oraciones. En español.',
    },
    {
      role: 'user',
      content: `Actividad: "${nombreActividad}"\n\nRespuesta del estudiante:\n${respuestaEstudiante}\n\nGenera retroalimentación constructiva para esta respuesta.`,
    },
  ], 400, 0.7)
}

// ============================================================
// 6. resumirActividad — Simplifica las instrucciones de una actividad para el estudiante
//    Recibe título y descripción, devuelve una explicación sencilla
// ============================================================
export async function resumirActividad(titulo, descripcion) {
  return llamarGroq([
    {
      role: 'system',
      content: 'Eres un tutor amigable. Explica actividades escolares en lenguaje simple y claro para estudiantes. Usa palabras fáciles de entender, ejemplos cortos si ayudan, y un tono motivador. Máximo 3 oraciones.',
    },
    {
      role: 'user',
      content: `Explícame de forma simple esta actividad:\nTítulo: ${titulo}\nDescripción: ${descripcion || 'Sin descripción adicional.'}`,
    },
  ], 300, 0.7)
}

// ============================================================
// 7. generarResumenGrupo — Resume el estado del grupo para el profesor
//    Recibe array de actividades y devuelve un párrafo de resumen
// ============================================================
export async function generarResumenGrupo(actividades) {
  // Convierte las actividades a texto para enviarlas a la IA
  const listaActividades = actividades
    .map((a, i) => `${i + 1}. "${a.titulo}" — creada el ${new Date(a.created_at).toLocaleDateString('es-CO')}`)
    .join('\n')

  return llamarGroq([
    {
      role: 'system',
      content: 'Eres un asistente para profesores. Generas resúmenes breves y útiles del estado de un grupo escolar. El tono es profesional pero amigable. Máximo 4 oraciones en español.',
    },
    {
      role: 'user',
      content: `El grupo tiene las siguientes actividades registradas:\n${listaActividades}\n\nGenera un resumen breve del estado del grupo y sugerencias de seguimiento para el profesor.`,
    },
  ], 400, 0.6)
}