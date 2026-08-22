# Hipótesis de Rendimiento — NOVI

> **⚠️ DOCUMENTO SELLADO**  
> Registrado el: **22 de agosto de 2026, 01:10 UTC**  
> Autor: Nixson Pinzón  
> Curso: Ingeniería de Rendimiento  
> Este documento NO puede modificarse después de correr las pruebas.

---

## 1. Contexto del sistema

**NOVI** (Network Of Virtual Interaction) es una plataforma educativa SPA (React 18 + Vite) que utiliza Supabase como Backend-as-a-Service. El componente crítico de rendimiento es el **chat grupal en tiempo real**, que usa Supabase Realtime (WebSockets sobre PostgreSQL) para entregar mensajes a todos los miembros conectados de un grupo.

El escenario de uso pico ocurre cuando un profesor publica un anuncio en un grupo numeroso y todos los estudiantes reaccionan simultáneamente con mensajes de respuesta.

---

## 2. Hipótesis (preregistrada antes de medir)

> **"Bajo una carga de 30 usuarios simultáneos enviando mensajes al mismo canal de Supabase Realtime durante 2 minutos, el percentil 95 (P95) de latencia de entrega de mensajes superará los 600 ms, lo cual representa una experiencia de chat degradada. Esperamos que, sin optimización, el P50 se ubique entre 200–350 ms y el P99 supere los 1000 ms."**

---

## 3. Driver de carga

| Parámetro | Valor |
|-----------|-------|
| Número de usuarios virtuales (VUs) | 30 usuarios simultáneos |
| Duración de la prueba | 2 minutos (120 s) |
| Acción por VU | Insertar 1 mensaje cada 3 segundos via `supabase.from('messages').insert(...)` |
| Canal monitoreado | Supabase Realtime — tabla `messages`, filtro por `group_id` |
| Ramp-up | 10 s para llegar a 30 VUs |

---

## 4. Métrica principal

| Métrica | Descripción | Umbral de referencia |
|---------|-------------|----------------------|
| **P95 de latencia** | Tiempo desde `insert()` hasta recepción en cliente suscrito | Esperado > 600 ms (sin optimizar) |
| **P50 de latencia** | Mediana de latencia | Esperado 200–350 ms |
| **Tasa de éxito** | % de inserciones con código 201 | Esperado > 99% |
| **Throughput** | Mensajes por segundo procesados | Esperado ~8–10 msg/s a 30 VUs |

---

## 5. Fitness function (objetivo de optimización)

El sistema **pasa** la prueba de rendimiento si:

```
P95 de latencia de inserción < 400 ms
Tasa de éxito HTTP ≥ 99%
Sin errores 5xx en ninguna corrida
```

Este umbral se basa en la recomendación de Nielsen Norman Group de que respuestas < 400 ms se perciben como "inmediatas" en interfaces de chat.

---

## 6. Sistema bajo prueba

| Componente | Tecnología | Versión |
|------------|------------|---------|
| Frontend | React + Vite | 18 / 5 |
| Base de datos | PostgreSQL (Supabase) | 15.x |
| Realtime | Supabase Realtime (Phoenix Channels) | v2 |
| IA | Groq API (`openai/gpt-oss-20b`) | — |
| Deploy | Render Static Site | — |

---

## 7. Qué NO se mide en esta hipótesis

- Latencia de las funciones de IA (Groq) — se medirá en una hipótesis futura
- Tiempo de carga inicial de la SPA (Lighthouse metric)
- Latencia de autenticación (Supabase Auth)

---

*Documento sellado y commiteado antes de ejecutar cualquier prueba. Ver `docs/mediciones/` para los resultados.*
