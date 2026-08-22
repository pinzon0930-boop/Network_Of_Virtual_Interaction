# C4 — Nivel 2: Diagrama de Contenedores

> Muestra los contenedores técnicos que componen NOVI y sus interacciones.

```mermaid
C4Container
  title NOVI — Diagrama de Contenedores (Nivel 2)

  Person(profesor, "Profesor")
  Person(estudiante, "Estudiante")

  System_Boundary(novi_boundary, "NOVI") {
    Container(spa, "SPA React", "React 18 + Vite + Tailwind CSS", "Interfaz de usuario. Gestiona rutas, estado global (AuthContext) y llama a Supabase y Groq.")
    Container(auth_ctx, "AuthContext", "React Context", "Mantiene la sesión activa del usuario (usuario, perfil, cargando). Maneja refresh de tokens y SIGNED_OUT.")
    Container(groq_svc, "groq.js", "JavaScript / fetch", "7 funciones de IA que llaman a Groq API: tutor, actividades, quiz, rúbricas, retroalimentación, resumen.")
    Container(supabase_svc, "supabase.js / services/", "Supabase JS Client v2", "Clientes de auth, grupos, mensajes y actividades hacia Supabase.")
  }

  System_Boundary(supabase_boundary, "Supabase (BaaS)") {
    ContainerDb(db, "PostgreSQL 15", "Base de datos relacional", "Tablas: users, groups, group_members, messages, activities, ai_config. RLS habilitado.")
    Container(auth, "Supabase Auth", "GoTrue", "Maneja registro, login y refresh tokens con JWT.")
    Container(realtime, "Supabase Realtime", "Phoenix Channels / WebSocket", "Publica cambios de la tabla messages a los clientes suscritos en < 200 ms típicamente.")
    Container(rest, "PostgREST", "REST API autogenerada", "Genera automáticamente endpoints REST desde el esquema PostgreSQL.")
  }

  System_Ext(groq_api, "Groq API", "LLM con LPU — modelo openai/gpt-oss-20b")
  System_Ext(render, "Render CDN", "Sirve el bundle estático")

  Rel(profesor, spa, "Usa la aplicación", "HTTPS / Browser")
  Rel(estudiante, spa, "Usa la aplicación", "HTTPS / Browser")

  Rel(spa, auth_ctx, "Lee usuario y perfil")
  Rel(spa, groq_svc, "Llama funciones de IA")
  Rel(spa, supabase_svc, "Lee/escribe datos y suscribe Realtime")

  Rel(auth_ctx, auth, "getSession / onAuthStateChange", "HTTPS")
  Rel(supabase_svc, rest, "CRUD grupos, mensajes, actividades", "HTTPS")
  Rel(supabase_svc, realtime, "Suscripción a mensajes nuevos", "WSS")
  Rel(groq_svc, groq_api, "chat/completions", "HTTPS")
  Rel(auth, db, "Lee/escribe auth.users")
  Rel(rest, db, "SQL via PostgREST")
  Rel(realtime, db, "Escucha WAL (Write-Ahead Log) de PostgreSQL")
  Rel(render, spa, "Sirve index.html + assets", "CDN")
```

---

## Flujo crítico: envío de mensaje en tiempo real

```
Estudiante → SPA → supabase.from('messages').insert(...)
                 → PostgREST → PostgreSQL (INSERT)
                             → WAL → Supabase Realtime
                                   → WebSocket → SPA de todos los miembros
                                               → re-render del chat
```

Tiempo total esperado: **P50 ~250 ms, P95 ~580 ms** (medido en corridas 2 y 3).
