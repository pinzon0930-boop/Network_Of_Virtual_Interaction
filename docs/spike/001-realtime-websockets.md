# Spike 001: ¿Escala Supabase Realtime para un chat educativo con 30+ usuarios?

**Tipo:** Investigación técnica (Spike)  
**Fecha:** 2026-08-22  
**Autor:** Nixson Pinzón  
**Duración:** ~4 horas  
**Pregunta a responder:** ¿Puede Supabase Realtime manejar 30 usuarios simultáneos enviando mensajes en el mismo canal sin degradar la experiencia de chat?

---

## Motivación

Antes de comprometer NOVI con Supabase Realtime como mecanismo de entrega de mensajes en tiempo real, necesitábamos saber si el servicio aguantaría la carga típica de un grupo de clase (20–40 estudiantes conectados simultáneamente). Si no aguantaba, la alternativa era Socket.io con un servidor propio.

---

## Investigación realizada

### 1. Revisión de la documentación oficial de Supabase

Supabase Realtime usa el servidor [Phoenix Channels](https://hexdocs.pm/phoenix/channels.html) escrito en Elixir, reconocido por su alta concurrencia (el modelo actor de BEAM/OTP). La documentación indica:

- **Plan gratuito:** máximo 200 conexiones simultáneas por proyecto
- **Plan Pro:** hasta 500 conexiones, con opción de escalar más
- **Latencia típica documentada:** < 100 ms en condiciones normales de red

Para un grupo de 40 estudiantes, necesitamos máximo 40 conexiones WebSocket activas — dentro del límite gratuito.

### 2. Prueba empírica con usuario real

Se creó un grupo de prueba en el proyecto Supabase de NOVI y se abrió la aplicación en 5 pestañas del navegador simultáneamente (simulando 5 usuarios). Observaciones:

| Acción | Tiempo observado |
|--------|-----------------|
| Mensaje aparece en la pestaña que lo envió | < 50 ms (optimistic update) |
| Mensaje aparece en las otras 4 pestañas | 150–320 ms |
| Con carga de red normal (WiFi doméstica) | Consistentemente < 400 ms |

### 3. Revisión de benchmarks de la comunidad

Artículo de referencia: *"Supabase Realtime vs Firebase — 2024 benchmark"* (blog de Supabase):
- Supabase Realtime: P99 < 300 ms bajo 100 usuarios simultáneos en el mismo canal
- Firebase: P99 < 200 ms bajo condiciones similares (ventaja de Firebase por arquitectura más madura)

### 4. Limitaciones identificadas

- **No hay garantía de orden de mensajes** si dos usuarios envían exactamente al mismo tiempo (PostgreSQL maneja esto con timestamps, se resuelve ordenando en el cliente)
- **Reconexión automática:** el cliente JS de Supabase reconecta automáticamente si se cae el WebSocket, pero hay un delay de 1–5 s
- **Sin particionamiento de canales:** todos los mensajes de un `group_id` van al mismo canal, lo que podría ser un cuello de botella con grupos de >200 personas (fuera del alcance de NOVI)

---

## Decisión tomada

**Continuar con Supabase Realtime.** Para grupos de 20–40 estudiantes (caso de uso de NOVI), la solución es adecuada. El límite de 200 conexiones del plan gratuito cubre al menos 5 grupos activos simultáneamente con 40 estudiantes cada uno.

Si NOVI escalara a cientos de grupos simultáneos, se consideraría migrar a:
1. Supabase Plan Pro (500 conexiones)
2. Socket.io con servidor Express propio
3. Redis Pub/Sub con un gateway WebSocket

---

## Artefactos de la investigación

- Script de prueba manual: `tests/carga.js` (k6)
- Resultados empíricos: `docs/mediciones/`
- Diagrama de flujo de mensajes: `docs/arquitectura/c4-nivel2-contenedores.md`

---

*Spike completado. La incertidumbre fue resuelta con evidencia suficiente para tomar la decisión de arquitectura.*
