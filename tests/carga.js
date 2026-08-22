/**
 * NOVI — Script de Prueba de Carga
 * Herramienta: k6 (https://k6.io)
 *
 * CÓMO EJECUTAR:
 *   k6 run --out json=docs/mediciones/corrida1.json tests/carga.js
 *   k6 run --out json=docs/mediciones/corrida2.json tests/carga.js
 *   k6 run --out json=docs/mediciones/corrida3.json tests/carga.js
 *
 * Variables de entorno requeridas:
 *   SUPABASE_URL       — URL del proyecto Supabase (sin /rest/v1)
 *   SUPABASE_ANON_KEY  — Clave anon pública de Supabase
 *   GROUP_ID           — UUID de un grupo de prueba existente en la BD
 *   TEST_USER_TOKEN    — JWT de un usuario con acceso al grupo (obtener con signInWithPassword)
 *
 * Ejemplo:
 *   export SUPABASE_URL=https://xxxx.supabase.co
 *   export SUPABASE_ANON_KEY=eyJhb...
 *   export GROUP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 *   export TEST_USER_TOKEN=eyJhb...
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// ─── Variables de entorno ───────────────────────────────────────────────────
const SUPABASE_URL   = __ENV.SUPABASE_URL   || 'https://placeholder.supabase.co'
const ANON_KEY       = __ENV.SUPABASE_ANON_KEY || 'placeholder'
const GROUP_ID       = __ENV.GROUP_ID       || 'placeholder-group-id'
const USER_TOKEN     = __ENV.TEST_USER_TOKEN || ANON_KEY

// ─── Métricas personalizadas ────────────────────────────────────────────────
const errorRate      = new Rate('error_rate')
const insertLatency  = new Trend('insert_latency_ms', true)

// ─── Configuración del escenario ────────────────────────────────────────────
export const options = {
  scenarios: {
    chat_carga: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 10 },  // Ramp-up a 10 usuarios
        { duration: '20s', target: 30 },  // Ramp-up a 30 usuarios
        { duration: '90s', target: 30 },  // Carga sostenida: 30 usuarios, 90 s
        { duration: '10s', target: 0  },  // Ramp-down
      ],
    },
  },
  thresholds: {
    // La prueba PASA si estos umbrales se cumplen
    http_req_duration: ['p(95)<600'],  // Umbral de línea base (hipótesis: esperamos > 600 en sin-optimizar)
    http_req_failed:   ['rate<0.01'],  // Menos del 1% de errores
    error_rate:        ['rate<0.01'],
  },
}

// ─── Headers reutilizables ──────────────────────────────────────────────────
const headers = {
  'Content-Type':  'application/json',
  'apikey':        ANON_KEY,
  'Authorization': `Bearer ${USER_TOKEN}`,
  'Prefer':        'return=minimal',
}

// ─── Función principal ──────────────────────────────────────────────────────
export default function () {
  const vuId = __VU
  const iter = __ITER

  const payload = JSON.stringify({
    group_id: GROUP_ID,
    // Nota: user_id lo pone Supabase desde el JWT, no hace falta enviarlo
    // La política RLS valida que auth.uid() == user_id
    content: `[k6] Mensaje de prueba — VU ${vuId} iter ${iter} — ${Date.now()}`,
    is_announcement: false,
  })

  const start = Date.now()

  const res = http.post(
    `${SUPABASE_URL}/rest/v1/messages`,
    payload,
    { headers }
  )

  const latencia = Date.now() - start
  insertLatency.add(latencia)

  // Verificaciones de salud
  const ok = check(res, {
    'status es 201 (created)': (r) => r.status === 201,
    'sin error 4xx':           (r) => r.status < 400,
    'sin error 5xx':           (r) => r.status < 500,
    'latencia < 1000 ms':      (_) => latencia < 1000,
  })

  errorRate.add(!ok)

  if (!ok) {
    console.error(`VU ${vuId} error: status=${res.status} body=${res.body}`)
  }

  // Cada VU envía ~1 mensaje cada 3 s (simula conversación humana)
  sleep(3)
}

// ─── Resumen final ──────────────────────────────────────────────────────────
export function handleSummary(data) {
  return {
    stdout: JSON.stringify({
      timestamp: new Date().toISOString(),
      escenario: 'chat_carga_30_vus_90s',
      metricas: {
        http_req_duration: {
          p50: data.metrics.http_req_duration?.values?.['p(50)'],
          p90: data.metrics.http_req_duration?.values?.['p(90)'],
          p95: data.metrics.http_req_duration?.values?.['p(95)'],
          p99: data.metrics.http_req_duration?.values?.['p(99)'],
          avg: data.metrics.http_req_duration?.values?.avg,
          max: data.metrics.http_req_duration?.values?.max,
        },
        http_req_failed: {
          rate: data.metrics.http_req_failed?.values?.rate,
        },
        http_reqs: {
          count: data.metrics.http_reqs?.values?.count,
          rate:  data.metrics.http_reqs?.values?.rate,
        },
        vus_max: data.metrics.vus_max?.values?.max,
      },
      thresholds_passed: Object.entries(data.metrics).every(
        ([, m]) => !m.thresholds || Object.values(m.thresholds).every(t => t.ok)
      ),
    }, null, 2) + '\n',
  }
}
