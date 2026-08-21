// URL base de la API de Groq — endpoint principal para todas las peticiones de IA
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Modelo de lenguaje utilizado — openai/gpt-oss-20b disponible gratuitamente en Groq
const MODELO = 'openai/gpt-oss-20b'

// Clave de API leída desde las variables de entorno de Vite (archivo .env)
// IMPORTANTE: nunca escribir la clave directamente aquí — solo en el .env
const API_KEY = import.meta.env.VITE_GROQ_API_KEY

// ============================================================
// FUNCIÓN INTERNA: llamarGroq
// Centraliza todas las llamadas HTTP a la API de Groq.
// Todas las funciones exportadas la usan en lugar de hacer
// fetch directamente — así si cambia la API, solo se modifica aquí.
//
// Parámetros:
//   mensajes    → array de { role, content } — el historial/contexto del chat
//   maxTokens   → límite de tokens en la respuesta (controla la longitud)
//   temperatura → creatividad de la respuesta (0 = exacto, 1 = muy creativo)
// ============================================================
async function llamarGroq(mensajes, maxTokens = 500, temperatura = 0.7) {

  // Realiza la petición POST a la API de Groq con los datos del modelo
  const respuesta = await fetch(GROQ_URL, {
    method: 'POST',                                          // Método HTTP para enviar datos al servidor
    headers: {
      'Content-Type': 'application/json',                    // Indica que el cuerpo es JSON
      'Authorization': `Bearer ${API_KEY}`,                  // Autenticación con el token de Groq
    },
    body: JSON.stringify({                                   // Serializa el objeto JavaScript a string JSON
      model: MODELO,                                         // Especifica qué modelo de IA procesa la petición
      messages: mensajes,                                    // Historial de mensajes que forman el contexto
      max_tokens: maxTokens,                                 // Número máximo de tokens en la respuesta generada
      temperature: temperatura,                              // Controla aleatoriedad: 0 es determinista, 1 es creativo
    }),
  })

  // Si el servidor devuelve un código de error HTTP (4xx, 5xx), lanza una excepción
  if (!respuesta.ok) throw new Error(`Error Groq: ${respuesta.status}`)

  // Convierte la respuesta JSON del servidor a un objeto JavaScript
  const datos = await respuesta.json()

  // Extrae el texto del primer mensaje generado por la IA y elimina espacios sobrantes
  return datos.choices[0].message.content.trim()
}

// ============================================================
// 1. preguntarIA — Tutor académico general para estudiantes
//    Recibe cualquier pregunta y responde de forma pedagógica.
//    Usado en el panel lateral AsistenteIA del chat.
// ============================================================
export async function preguntarIA(pregunta) {
  return llamarGroq([
    {
      role: 'system',                                        // Mensaje del sistema: define la personalidad/rol de la IA
      content: 'Eres NOVI, un tutor académico amigable para estudiantes de secundaria y universidad. Explicas conceptos de forma clara, concisa y motivadora. Usas ejemplos cotidianos cuando es posible.',
    },
    {
      role: 'user',                                          // Mensaje del usuario con la pregunta real del estudiante
      content: pregunta,
    },
  ], 600, 0.7)                                              // Hasta 600 tokens, creatividad media para respuestas naturales
}

// ============================================================
// 2. generarActividad — Crea una actividad educativa completa
//    Recibe el tema y devuelve título + descripción para el profesor.
//    Usado en el componente CrearActividad con asistencia de IA.
// ============================================================
export async function generarActividad(tema) {
  return llamarGroq([
    {
      role: 'system',
      content: 'Eres un asistente educativo. Generas actividades pedagógicas completas con título y descripción detallada para profesores.',
    },
    {
      role: 'user',
      content: `Genera una actividad educativa sobre el tema: "${tema}". Incluye un título creativo y una descripción de 2-3 oraciones con el objetivo, desarrollo y producto final.`,
    },
  ], 300, 0.8)                                              // 300 tokens suficientes, alta creatividad para ideas variadas
}

// ============================================================
// 3. generarQuiz — Crea preguntas de opción múltiple con respuestas
//    Recibe el tema y la cantidad de preguntas.
//    Devuelve JSON con estructura { preguntas: [...] }.
//    Usado en ModalQuiz.jsx — el profesor elige tema y cantidad.
// ============================================================
export async function generarQuiz(tema, cantidad = 5) {
  return llamarGroq([
    {
      role: 'system',
      // Se le pide responder SOLO JSON para facilitar el parseo en el componente
      content: 'Eres un generador de quizzes educativos. Siempre respondes con un JSON válido que contiene un array de preguntas de opción múltiple con sus respuestas correctas. No incluyas texto fuera del JSON.',
    },
    {
      role: 'user',
      // Formato exacto que el componente ModalQuiz espera al hacer JSON.parse()
      content: `Genera ${cantidad} preguntas de opción múltiple sobre "${tema}". Responde SOLO con JSON en este formato exacto:
{"preguntas": [{"pregunta": "...", "opciones": ["a) ...", "b) ...", "c) ...", "d) ..."], "correcta": "d) ..."}]}`,
    },
  ], 1200, 0.5)                                             // Más tokens para múltiples preguntas; baja temp. para respuestas precisas
}

// ============================================================
// 4. generarRubrica — Crea criterios de evaluación para una actividad
//    Recibe título y descripción de la actividad.
//    Devuelve texto con tabla de niveles: Excelente / Bueno / Regular / Insuficiente.
//    Usado en ModalRubrica.jsx — el profesor la ve y puede copiarla.
// ============================================================
export async function generarRubrica(titulo, descripcion) {
  return llamarGroq([
    {
      role: 'system',
      content: 'Eres un experto en evaluación educativa. Generas rúbricas detalladas con criterios claros en niveles: Excelente, Bueno, Regular e Insuficiente. Usas formato de tabla Markdown.',
    },
    {
      role: 'user',
      // Incluye título y descripción para que la rúbrica sea específica a esa actividad
      content: `Genera una rúbrica de evaluación para la siguiente actividad:\n\nTítulo: ${titulo}\nDescripción: ${descripcion}\n\nIncluye al menos 4 criterios de evaluación con sus niveles.`,
    },
  ], 800, 0.4)                                              // 800 tokens para una rúbrica completa; baja temp. para consistencia
}

// ============================================================
// 5. generarRetroalimentacion — Da feedback sobre la respuesta de un estudiante
//    Recibe el título de la actividad y lo que escribió el estudiante.
//    Devuelve comentarios constructivos con fortalezas y sugerencias.
//    Usado en ModalRetroalimentacion.jsx — el profesor pega la respuesta.
// ============================================================
export async function generarRetroalimentacion(tituloActividad, respuestaEstudiante) {
  return llamarGroq([
    {
      role: 'system',
      content: 'Eres un profesor que da retroalimentación constructiva y empática. Señalas fortalezas primero, luego áreas de mejora con sugerencias concretas. Tu tono es motivador y respetuoso.',
    },
    {
      role: 'user',
      // Proporciona el contexto de la actividad y la respuesta real del estudiante
      content: `Actividad: "${tituloActividad}"\n\nRespuesta del estudiante:\n${respuestaEstudiante}\n\nDa retroalimentación constructiva señalando qué hizo bien, qué puede mejorar y cómo lograrlo.`,
    },
  ], 500, 0.6)                                              // 500 tokens para feedback completo; temp. media para ser natural
}

// ============================================================
// 6. resumirActividad — Explica una actividad en lenguaje simple
//    Para estudiantes que no comprenden el enunciado formal.
//    Devuelve una explicación de 2-3 oraciones sin términos técnicos.
//    Usado en ModalExplicacion.jsx — se llama automáticamente al abrir.
// ============================================================
export async function resumirActividad(titulo, descripcion) {
  return llamarGroq([
    {
      role: 'system',
      // Tono muy simple, como si le explicaras a un niño de 12 años
      content: 'Eres un tutor que explica actividades escolares de forma muy simple y amigable, como si le hablaras a un estudiante de 12 años. Usas un lenguaje claro, directo y motivador. Evitas términos académicos complejos.',
    },
    {
      role: 'user',
      content: `Explica esta actividad escolar de forma simple:\n\nTítulo: ${titulo}\nDescripción: ${descripcion}\n\nExplica en 2-3 oraciones qué tiene que hacer el estudiante, sin términos técnicos.`,
    },
  ], 200, 0.6)                                              // 200 tokens para una explicación breve y directa
}

// ============================================================
// 7. generarResumenGrupo — Resume el estado del grupo para el profesor
//    Recibe el array completo de actividades del grupo.
//    Devuelve un párrafo con análisis y recomendaciones.
//    Usado en GrupoDetalle.jsx — botón "📈 Resumen" en la cabecera.
// ============================================================
export async function generarResumenGrupo(actividades) {

  // Transforma el array de actividades en texto numerado legible para la IA
  // IMPORTANTE: usa a.title (campo real de Supabase), no a.titulo
  const listaActividades = actividades
    .map((a, i) => `${i + 1}. "${a.title}" — creada el ${new Date(a.created_at).toLocaleDateString('es-CO')}`)
    .join('\n')                                              // Une cada línea con salto de línea

  return llamarGroq([
    {
      role: 'system',
      content: 'Eres un asistente para profesores. Generas resúmenes breves y útiles del estado de un grupo de clase basándote en sus actividades registradas. Eres analítico y das recomendaciones prácticas.',
    },
    {
      role: 'user',
      // Inyecta la lista de actividades en el prompt para que la IA las analice
      content: `El grupo tiene las siguientes actividades registradas:\n${listaActividades}\n\nGenera un resumen breve del estado del grupo y recomendaciones para el profesor.`,
    },
  ], 400, 0.6)                                              // 400 tokens para un resumen conciso con recomendaciones
}