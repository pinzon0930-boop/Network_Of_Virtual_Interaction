import { supabase } from './supabase.js'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

// ============================================================
// FUNCIÓN: preguntarIA
// Para estudiantes — responde preguntas educativas
// ============================================================
export async function preguntarIA(pregunta) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente educativo amigable llamado "Educa AI". Ayudas a estudiantes con sus dudas académicas de forma clara, motivadora y en español. Tus respuestas son concisas (máximo 3 párrafos) y fáciles de entender.',
        },
        {
          role: 'user',
          content: pregunta,
        },
      ],
      max_tokens: 600,
      temperature: 0.7,
    }),
  })

  if (!response.ok) throw new Error('Error al conectar con la IA')
  const data = await response.json()
  return data.choices[0].message.content
}

// ============================================================
// FUNCIÓN: generarActividad
// Para profesores — genera título y descripción de actividad
// ============================================================
export async function generarActividad(descripcion) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente para profesores. Generas actividades educativas creativas. Responde ÚNICAMENTE con un JSON válido sin texto adicional, con exactamente estos campos: {"titulo": "...", "descripcion": "..."}. El título debe ser corto (máximo 8 palabras). La descripción debe ser clara e instructiva (2-3 oraciones).',
        },
        {
          role: 'user',
          content: `Genera una actividad educativa sobre: ${descripcion}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.8,
    }),
  })

  if (!response.ok) throw new Error('Error al generar la actividad')
  const data = await response.json()
  const texto = data.choices[0].message.content.trim()

  // Extrae el JSON de la respuesta
  const match = texto.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('La IA no devolvió un formato válido')
  return JSON.parse(match[0])
}