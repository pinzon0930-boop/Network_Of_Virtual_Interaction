# ADR-002: Groq como proveedor de IA

**Estado:** Aceptado  
**Fecha:** 2026-08-22  
**Autor:** Nixson Pinzón  

---

## Contexto

NOVI necesita generar contenido educativo de forma dinámica: actividades, quizzes, rúbricas, retroalimentación y resúmenes. Se requiere una API de lenguaje natural que:

- Sea de acceso gratuito o muy económico para un proyecto académico
- Tenga latencia baja (< 3 s por request) para uso interactivo
- No requiera desplegar ningún modelo localmente
- Sea compatible con el estándar OpenAI (facilita migración futura)

---

## Decisión

Usar **Groq API** con el modelo `openai/gpt-oss-20b`.

Groq usa hardware LPU (Language Processing Unit) propietario que reduce la latencia de inferencia significativamente respecto a GPU convencionales. La API es compatible con el estándar de OpenAI (mismo formato de mensajes y respuestas).

---

## Alternativas consideradas

| Opción | Latencia típica | Costo | Decisión |
|--------|----------------|-------|----------|
| OpenAI GPT-4o | 2–8 s | ~$5/M tokens input | Descartada (costo) |
| Anthropic Claude (API) | 2–6 s | ~$3/M tokens | Descartada (costo) |
| Ollama (local) | Variable | Gratis | Descartada (requiere GPU local) |
| **Groq** | **0.5–2 s** | **Gratis (plan dev)** | **Elegida** |

---

## Implementación

Las 7 funciones de IA están centralizadas en `frontend/src/services/groq.js`:

```
preguntarIA(pregunta)           → Tutor para estudiantes
generarActividad(tema)          → Actividad educativa completa
generarQuiz(tema, cantidad)     → Preguntas de opción múltiple en JSON
generarRubrica(titulo, desc)    → Rúbrica con 4 niveles
generarRetroalimentacion(...)   → Feedback sobre respuestas
resumirActividad(titulo, desc)  → Explicación simple para estudiantes
generarResumenGrupo(actividades)→ Análisis del grupo para el profesor
```

Todas usan `fetch` al endpoint `https://api.groq.com/openai/v1/chat/completions`.

---

## Consecuencias

**Positivas:**
- Latencia muy baja (las respuestas llegan en ~1–2 s)
- Plan gratuito suficiente para uso académico
- Compatibilidad OpenAI facilita migración a otro modelo sin reescribir código

**Negativas / Riesgos:**
- La API key viaja en el cliente (VITE_GROQ_API_KEY expuesta en el bundle)
- Groq puede cambiar modelos disponibles o deprecar `openai/gpt-oss-20b`
- Sin control sobre el modelo: no se puede hacer fine-tuning

**Mitigación del riesgo de la API key:** Para producción real, las llamadas a Groq deberían pasar por un edge function de Supabase o un serverless function en Vercel/Netlify que mantenga la key en el servidor. En el contexto académico actual, el riesgo es aceptado.

---

*Ver también: [ADR-001 — Supabase como backend](001-supabase-como-backend.md)*
