/**
 * NOVI — Fitness Function de Rendimiento
 * Herramienta: k6 (https://k6.io)
 *
 * PROPÓSITO:
 *   Esta prueba es la "fitness function" del sistema. Verifica que el
 *   sistema cumpla el objetivo de rendimiento definido en docs/hipotesis.md.
 *   Si el P95 supera 400 ms o hay más del 1% de errores, la prueba FALLA
 *   y el CI lo reporta como un build rojo.
 *
 * CÓMO EJECUTAR (manualmente):
 *   k6 run tests/fitness.js
 *
 * UMBRALES (fitness function):
 *   - P95 latencia de inserción < 400 ms  ← objetivo de optimización
 *   - Tasa de errores HTTP < 1%
 *   - Sin errores 5xx
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

const SUPABASE_URL = __ENV.SUPABASE_URL   || 'https://placeholder.supabase.co'
const ANON_KEY     = __ENV.SUPABASE_ANON_KEY || 'placeholder'
const GROUP_ID     = __ENV.GROUP_ID       || 'placeholder-group-id'
const USER_TOKEN   = __ENV.TEST_USER_TOKEN || ANON_KEY

const errorRate = new Rate('error_rate')

export const options = {
  // Prueba corta: 15 usuarios durante 60 s
  // (menos agresiva que la prueba de carga, pero suficiente para verificar el umbral)
  vus:      15,
  duration: '60s',

  thresholds: {
    // ══════════════════════════════════════════════
    // UMBRAL PRINCIPAL DE LA FITNESS FUNCTION
    // Si P95 ≥ 400 ms → build FALLA → CI rojo
    // ══════════════════════════════════════════════
    'http_req_duration': ['p(95)<400'],

    // Sin más del 1% de errores
    'http_req_failed': ['rate<0.01'],
    'error_rate':      ['rate<0.01'],
  },
}

const headers = {
  'Content-Type':  'application/json',
  'apikey':        ANON_KEY,
  'Authorization': `Bearer ${USER_TOKEN}`,
  'Prefer':        'return=minimal',
}

export default function () {
  const payload = JSON.stringify({
    group_id:        GROUP_ID,
    content:         `[fitness] VU ${__VU} iter ${__ITER}`,
    is_announcement: false,
  })

  const res = http.post(
    `${SUPABASE_URL}/rest/v1/messages`,
    payload,
    { headers }
  )

  const ok = check(res, {
    'HTTP 201': (r) => r.status === 201,
    'sin 5xx':  (r) => r.status < 500,
  })

  errorRate.add(!ok)
  sleep(2)
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'] ?? '?'
  const errRate = ((data.metrics.http_req_failed?.values?.rate ?? 0) * 100).toFixed(2)
  const passed = p95 !== '?' && p95 < 400

  console.log(`\n${'='.repeat(50)}`)
  console.log(`FITNESS FUNCTION — NOVI`)
  console.log(`${'='.repeat(50)}`)
  console.log(`P95 latencia: ${typeof p95 === 'number' ? p95.toFixed(1) : p95} ms  (umbral: < 400 ms)`)
  console.log(`Tasa errores: ${errRate}%  (umbral: < 1%)`)
  console.log(`Resultado:    ${passed ? '✅ PASA' : '❌ FALLA'}`)
  console.log(`${'='.repeat(50)}\n`)
}
