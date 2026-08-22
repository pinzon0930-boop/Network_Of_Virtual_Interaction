# ADR-001: Supabase como Backend-as-a-Service

**Estado:** Aceptado  
**Fecha:** 2026-08-22  
**Autor:** Nixson Pinzón  

---

## Contexto

NOVI necesitaba un backend capaz de:
- Persistir mensajes, grupos, actividades y usuarios en una base de datos relacional
- Autenticar usuarios con email/contraseña
- Entregar mensajes de chat a todos los clientes conectados **en tiempo real** (< 500 ms)
- Exponer una API para que el frontend React pueda consultar y mutar datos con control de acceso por fila (Row Level Security)

El equipo era de un solo desarrollador con tiempo limitado. Construir un backend propio en Node.js + Express + PostgreSQL + Socket.io habría requerido semanas adicionales de infraestructura.

---

## Decisión

Usar **Supabase** como Backend-as-a-Service (BaaS) completo.

Supabase provee en un único servicio:

| Capa backend | Tecnología Supabase |
|-------------|---------------------|
| Base de datos | PostgreSQL 15 gestionado |
| API REST | PostgREST (autogenerado desde el esquema) |
| Autenticación | GoTrue (JWT, OAuth, email+password) |
| Tiempo real | Phoenix Channels sobre WebSockets |
| Seguridad a nivel de fila | Row Level Security (RLS) nativo de PostgreSQL |
| Almacenamiento | Supabase Storage (no usado en v1) |

---

## Alternativas consideradas

| Opción | Pros | Contras | Decisión |
|--------|------|---------|----------|
| Node.js + Express + PostgreSQL | Control total, sin dependencias externas | 3–4 semanas extra, sin Realtime nativo | Descartada |
| Firebase (Google) | Maduro, Realtime nativo | NoSQL (sin relaciones), vendor lock-in Google, caro a escala | Descartada |
| PocketBase | Open source, self-hosted | Sin Realtime estable, comunidad pequeña | Descartada |
| **Supabase** | PostgreSQL real, RLS, Realtime, Auth, API REST todo incluido | Dependencia de tercero, límites en plan gratuito | **Elegida** |

---

## Consecuencias

**Positivas:**
- Reducción del tiempo de desarrollo en ~3 semanas
- PostgreSQL real permite queries complejas, JOINs y RLS
- Realtime listo para usar sin configurar Socket.io
- Panel de administración visual (Supabase Dashboard)

**Negativas / Riesgos:**
- Dependencia de un proveedor externo (riesgo de downtime ajeno)
- El plan gratuito tiene límite de 50.000 filas y 500 MB de almacenamiento
- Si Supabase cambia sus precios o cierra, migrar requeriría un backend propio

**Mitigación del riesgo:** Todo el esquema SQL está versionado en `database/schema.sql`. Migrar a un PostgreSQL propio con PostgREST sería posible en < 1 semana.

---

*Ver también: [ADR-002 — Groq como proveedor de IA](002-groq-como-proveedor-ia.md)*
