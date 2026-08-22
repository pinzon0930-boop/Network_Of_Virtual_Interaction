# Resultados de medición — NOVI

## Protocolo

| Paso | Descripción |
|------|-------------|
| Corrida 1 | Warm-up — **descartada** (cold start PostgreSQL + Realtime) |
| Corrida 2 | Sistema caliente — **incluida** en el análisis |
| Corrida 3 | Sistema caliente — **incluida** en el análisis |

## Promedios finales (corridas 2 y 3)

| Métrica | Corrida 2 | Corrida 3 | **Promedio** |
|---------|-----------|-----------|-------------|
| P50 latencia | 241.88 ms | 253.41 ms | **247.6 ms** |
| P90 latencia | 498.33 ms | 511.88 ms | **505.1 ms** |
| P95 latencia | 591.72 ms | 608.44 ms | **600.1 ms** |
| P99 latencia | 874.19 ms | 901.27 ms | **887.7 ms** |
| Tasa de error | 0.4% | 0.6% | **0.5%** |
| Throughput | 3.84 req/s | 3.82 req/s | **3.83 req/s** |

## Conclusión

- **Hipótesis confirmada:** El P95 de ~600 ms bajo 30 usuarios simultáneos supera la experiencia óptima de chat (< 400 ms).
- **Umbral de línea base:** El sistema opera justo en el límite de 600 ms — cualquier pico de red puede degradar la experiencia.
- **Objetivo de la fitness function:** Reducir P95 a < 400 ms mediante optimización de queries o implementación de caché.

## Cómo reproducir

```bash
export SUPABASE_URL=https://tu-proyecto.supabase.co
export SUPABASE_ANON_KEY=eyJhb...
export GROUP_ID=uuid-del-grupo-de-prueba
export TEST_USER_TOKEN=eyJhb...   # JWT de un usuario con acceso al grupo

k6 run --out json=docs/mediciones/corrida1.json tests/carga.js
k6 run --out json=docs/mediciones/corrida2.json tests/carga.js
k6 run --out json=docs/mediciones/corrida3.json tests/carga.js
```
