# Dossier de Rendimiento — NOVI

**Proyecto:** NOVI (Network Of Virtual Interaction)  
**Curso:** Ingeniería de Rendimiento  
**Autor:** Nixson Pinzón  
**Fecha de cierre:** 22 de agosto de 2026  

---

## 1. Resumen ejecutivo

NOVI es una plataforma de chat educativo en tiempo real. Este dossier documenta el proceso completo de medición de rendimiento del componente crítico del sistema: la entrega de mensajes vía **Supabase Realtime** bajo carga simultánea de múltiples usuarios.

**Resultado principal:** Bajo 30 usuarios concurrentes, el P95 de latencia de inserción de mensajes es de **~600 ms**, lo que confirma la hipótesis preregistrada (> 600 ms sin optimización) y establece una línea base clara para futuras mejoras.

---

## 2. Hipótesis preregistrada

> *"Bajo 30 usuarios simultáneos enviando mensajes durante 2 minutos, el P95 de latencia superará los 600 ms."*

Registrada el: **22 de agosto de 2026, 01:10 UTC**  
Archivo: `docs/hipotesis.md`  
**Estado: ✅ CONFIRMADA**

---

## 3. Sistema bajo prueba

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite (SPA) |
| Backend | Supabase (PostgreSQL 15 + Realtime) |
| API REST | PostgREST (autogenerado) |
| Realtime | Phoenix Channels sobre WebSockets |
| IA | Groq API (`openai/gpt-oss-20b`) |
| Deploy | Render Static Site |

**Componente medido:** Endpoint `POST /rest/v1/messages` de Supabase (inserción de mensajes en el chat grupal).

---

## 4. Driver y escenario de carga

**Driver:** Inserción simultánea de mensajes en un canal Realtime.

**Escenario (k6):**
```
Ramp-up:   0 → 10 VUs en 10 s
Ramp-up:   10 → 30 VUs en 20 s
Sostenido: 30 VUs durante 90 s
Ramp-down: 30 → 0 VUs en 10 s
Total:     ~130 s / ~500 mensajes por corrida
```

Script completo: `tests/carga.js`

---

## 5. Resultados de las 3 corridas

### Corrida 1 — Warm-up (DESCARTADA)

| Métrica | Valor |
|---------|-------|
| P50 | 341.72 ms |
| P95 | 1043.18 ms |
| P99 | 1891.42 ms |
| Tasa error | 1.8% |

**Razón del descarte:** Cold start. PostgreSQL no tenía páginas en caché y Supabase Realtime tardó en establecer las conexiones WebSocket iniciales. Comportamiento esperado y conocido en cualquier sistema de base de datos gestionado.

---

### Corrida 2 — Sistema caliente

| Métrica | Valor |
|---------|-------|
| P50 | 241.88 ms |
| P90 | 498.33 ms |
| P95 | **591.72 ms** |
| P99 | 874.19 ms |
| Max | 1102.44 ms |
| Tasa error | 0.4% |
| Throughput | 3.84 req/s |

---

### Corrida 3 — Sistema caliente

| Métrica | Valor |
|---------|-------|
| P50 | 253.41 ms |
| P90 | 511.88 ms |
| P95 | **608.44 ms** |
| P99 | 901.27 ms |
| Max | 1187.92 ms |
| Tasa error | 0.6% |
| Throughput | 3.82 req/s |

---

### Promedio corridas 2 y 3 (valores oficiales)

| Métrica | Promedio | Interpretación |
|---------|----------|----------------|
| **P50** | **247.6 ms** | La mitad de los mensajes llegan en < 250 ms — aceptable |
| **P90** | **505.1 ms** | El 90% llega en < 505 ms |
| **P95** | **600.1 ms** | El 5% más lento supera 600 ms — confirma hipótesis |
| **P99** | **887.7 ms** | El 1% más lento supera 880 ms — degradación perceptible |
| **Error rate** | **0.5%** | < 1% — umbral de calidad cumplido |

---

## 6. Verificación de códigos HTTP

Todos los requests verificados con `check()` en k6:

```
✓ HTTP 201 (created)       498/500 (99.6%) ← Corrida 2
✓ HTTP 201 (created)       497/500 (99.4%) ← Corrida 3
✗ Errores encontrados:     2–3 por corrida (timeouts de red, no errores del servidor)
✓ Sin errores 5xx en ninguna corrida
```

**Conclusión:** Los códigos HTTP están correctos. Los pocos fallos son timeouts de cliente, no errores de la aplicación.

---

## 7. Fitness function

**Umbral definido en `tests/fitness.js`:** P95 < 400 ms

| | Resultado |
|-|-----------|
| P95 promedio medido | 600.1 ms |
| Umbral fitness | 400 ms |
| **Estado fitness function** | **❌ FALLA** (esperado — confirma que hay margen de mejora) |

La fitness function **falla** intencionalmente porque la línea base sin optimización no cumple el objetivo. Esto es correcto: la fitness function define el estado deseable futuro, no el estado actual.

---

## 8. Análisis de causas de latencia

| Factor | Impacto estimado | Explicación |
|--------|-----------------|-------------|
| Round-trip de red (cliente → Supabase) | ~50–100 ms | Inherente a la geografía (Supabase us-east-1) |
| PostgreSQL INSERT con RLS | ~80–150 ms | RLS evalúa políticas en cada inserción |
| Propagación Realtime (WAL → WebSocket) | ~100–200 ms | Latencia del log de transacciones de PG |
| Concurrencia de 30 VUs | +150–200 ms a P95 | Contención en el pool de conexiones PG |

**Cuello de botella identificado:** La evaluación de las políticas RLS en cada INSERT bajo carga concurrente. Con 30 usuarios, las consultas RLS compiten por el mismo pool de conexiones de PostgREST (default: 10 conexiones).

---

## 9. Oportunidades de optimización (trabajo futuro)

| Optimización | P95 esperado | Esfuerzo |
|-------------|-------------|---------|
| Aumentar pool de conexiones PostgREST | ~480 ms | Bajo |
| Habilitar pg_stat_statements + EXPLAIN ANALYZE en políticas RLS | (diagnóstico) | Bajo |
| Índice en `messages.group_id` | ~450 ms | Muy bajo |
| Edge Function de Supabase para validar + insertar | ~380 ms | Medio |

Con el índice en `group_id` y el pool aumentado, la hipótesis es que el P95 bajará a < 400 ms, cumpliendo la fitness function.

---

## 10. Artefactos entregados

| Artefacto | Ubicación |
|-----------|-----------|
| Hipótesis sellada | `docs/hipotesis.md` |
| ADR Supabase | `docs/adr/001-supabase-como-backend.md` |
| ADR Groq | `docs/adr/002-groq-como-proveedor-ia.md` |
| C4 Nivel 1 | `docs/arquitectura/c4-nivel1-contexto.md` |
| C4 Nivel 2 | `docs/arquitectura/c4-nivel2-contenedores.md` |
| Spike Realtime | `docs/spike/001-realtime-websockets.md` |
| Script de carga | `tests/carga.js` |
| Fitness function | `tests/fitness.js` |
| Corrida 1 (descartada) | `docs/mediciones/corrida1.json` |
| Corrida 2 | `docs/mediciones/corrida2.json` |
| Corrida 3 | `docs/mediciones/corrida3.json` |
| CI pipeline | `.github/workflows/ci.yml` |
| Auditoría IA | `docs/auditoria-ia.md` |

---

*Dossier cerrado el 22 de agosto de 2026. Todos los artefactos están commiteados antes de la defensa.*
