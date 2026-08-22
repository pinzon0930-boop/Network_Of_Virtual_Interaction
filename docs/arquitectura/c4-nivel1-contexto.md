# C4 — Nivel 1: Diagrama de Contexto

> Muestra NOVI como sistema y cómo interactúa con los actores externos.

```mermaid
C4Context
  title NOVI — Diagrama de Contexto (Nivel 1)

  Person(profesor, "Profesor", "Crea grupos, genera actividades con IA, monitorea el chat y retroalimenta a estudiantes.")
  Person(estudiante, "Estudiante", "Se une a grupos con un código, participa en el chat y consulta al tutor IA.")

  System(novi, "NOVI", "Plataforma educativa SPA que conecta profesores y estudiantes en tiempo real con soporte de IA generativa.")

  System_Ext(supabase, "Supabase", "Backend-as-a-Service: PostgreSQL, Auth, Realtime WebSockets y API REST autogenerada.")
  System_Ext(groq, "Groq API", "Proveedor de modelos de lenguaje (LLM) con LPU de baja latencia para generación de contenido educativo.")
  System_Ext(render, "Render", "Plataforma de hosting que sirve la SPA como Static Site.")

  Rel(profesor, novi, "Crea grupos, publica actividades y anuncios, consulta asistente IA")
  Rel(estudiante, novi, "Se une a grupos, envía mensajes, consulta tutor IA")
  Rel(novi, supabase, "Lee y escribe datos, recibe mensajes Realtime vía WebSocket", "HTTPS / WSS")
  Rel(novi, groq, "Envía prompts y recibe respuestas generadas por IA", "HTTPS REST")
  Rel(render, novi, "Sirve los archivos estáticos del frontend", "CDN / HTTPS")
```

---

## Descripción de los actores

| Actor / Sistema | Rol |
|----------------|-----|
| **Profesor** | Usuario primario que administra el grupo y usa las herramientas de IA |
| **Estudiante** | Usuario secundario que consume el chat y el tutor académico |
| **NOVI** | SPA React — toda la lógica de UI y llamadas a servicios externos |
| **Supabase** | Único backend: base de datos, auth, Realtime y API REST |
| **Groq API** | Proveedor externo de LLM para las 7 funciones de IA |
| **Render** | CDN que sirve el bundle Vite compilado |
