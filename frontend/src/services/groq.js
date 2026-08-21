// URL base de la API de Groq (compatible con el formato de OpenAI)
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Lee la clave API desde las variables de entorno de Vite (definida en Render)
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

// Modelo de texto a usar en ambas funciones (definido una sola vez para fácil cambio)
const MODELO = 'openai/gpt-oss-20b'

// ============================================================
// FUNCIÓN: preguntarIA
// Para estudiantes — responde preguntas educativas
// ============================================================
export async function preguntarIA(pregunta) {
  // Hace una petición POST a la API de Groq con la pregunta del estudiante
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',                                        // Método HTTP requerido por la API
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,          // Autenticación con la clave API
      'Content-Type': 'application/json',                 // Le dice a Groq que enviamos JSON
    },
    body: JSON.stringify({
      model: MODELO,                                       // Modelo de IA que procesará la pregunta
      messages: [
        {
          role: 'system',                                  // Mensaje de sistema: define el comportamiento del asistente
          content: 'Eres un asistente educativo amigable llamado "Educa AI". Ayudas a estudiantes con sus dudas académicas de forma clara, motivadora y en español. Tus respuestas son concisas (máximo 3 párrafos) y fáciles de entender.',
        },
        {
          role: 'user',                                    // Mensaje del usuario: la pregunta real del estudiante
          content: pregunta,
        },
      ],
      max_tokens: 600,                                     // Límite de longitud de la respuesta (evita respuestas muy largas)
      temperature: 0.7,                                    // Creatividad de la IA (0 = muy literal, 1 = muy creativo)
    }),
  })

  // Si la API devuelve error (ej: 401, 404, 500), lanza una excepción para manejarla en el componente
  if (!response.ok) throw new Error('Error al conectar con la IA')

  // Convierte la respuesta de la API de JSON a objeto JavaScript
  const data = await response.json()

  // Extrae y devuelve solo el texto de la respuesta generada por la IA
  return data.choices[0].message.content
}

// ============================================================
// FUNCIÓN: generarActividad
// Para profesores — genera título y descripción de actividad
// ============================================================
export async function generarActividad(descripcion) {
  // Hace una petición POST a la API de Groq con el tema ingresado por el profesor
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',                                        // Método HTTP requerido por la API
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,          // Autenticación con la clave API
      'Content-Type': 'application/json',                 // Le dice a Groq que enviamos JSON
    },
    body: JSON.stringify({
      model: MODELO,                                       // Mismo modelo que usa el asistente estudiantil
      messages: [
        {
          role: 'system',                                  // Instrucción estricta: la IA DEBE responder solo con JSON válido
          content: 'Eres un asistente para profesores. Generas actividades educativas creativas. Responde ÚNICAMENTE con un JSON válido sin texto adicional, con exactamente estos campos: {"titulo": "...", "descripcion": "..."}. El título debe ser corto (máximo 8 palabras). La descripción debe ser clara e instructiva (2-3 oraciones).',
        },
        {
          role: 'user',                                    // El tema que el profesor escribió en el input
          content: `Genera una actividad educativa sobre: ${descripcion}`,
        },
      ],
      max_tokens: 300,                                     // Respuesta más corta porque solo necesitamos JSON con título y descripción
      temperature: 0.8,                                    // Un poco más de creatividad para generar actividades variadas
    }),
  })

  // Si la API devuelve error, lanza una excepción para mostrar el error en el modal
  if (!response.ok) throw new Error('Error al generar la actividad')

  // Convierte la respuesta de la API de JSON a objeto JavaScript
  const data = await response.json()

  // Obtiene el texto plano de la respuesta y elimina espacios al inicio/final
  const texto = data.choices[0].message.content.trim()

  // Busca dentro del texto el primer bloque que tenga forma de objeto JSON { ... }
  // (por si la IA incluye texto adicional antes o después del JSON)
  const match = texto.match(/\{[\s\S]*\}/)

  // Si no encontró un JSON válido en la respuesta, lanza error
  if (!match) throw new Error('La IA no devolvió un formato válido')

  // Convierte el JSON encontrado (string) a un objeto JavaScript con .titulo y .descripcion
  return JSON.parse(match[0])
}