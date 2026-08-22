# Auditoría de uso de IA — NOVI

**Proyecto:** NOVI (Network Of Virtual Interaction)  
**Autor:** Nixson Pinzón  
**Período cubierto:** Inicio del proyecto — 22 de agosto de 2026  

> Este documento registra el uso de herramientas de IA generativa durante el desarrollo de NOVI, de conformidad con los lineamientos éticos del curso. Se documenta qué se preguntó, qué se usó y qué se modificó.

---

## Herramientas utilizadas

| Herramienta | Proveedor | Propósito en el proyecto |
|-------------|-----------|--------------------------|
| **Claude** (Cowork / claude.ai) | Anthropic | Asistencia en desarrollo, generación de código, resolución de errores, documentación |
| **Groq API** | Groq | Funcionalidad de IA del producto (tutor, quiz, rúbricas, etc.) — NO para desarrollo |

---

## Registro de uso de Claude (asistente de desarrollo)

### 1. Generación del esquema de base de datos

**Prompt utilizado:** "Ayúdame a diseñar un esquema SQL para una plataforma de chat educativo con profesores, estudiantes, grupos y mensajes en tiempo real. Debe incluir RLS para Supabase."

**Qué generó:** Estructura inicial de las 6 tablas (`users`, `groups`, `group_members`, `messages`, `activities`, `ai_config`) con políticas RLS y la línea `ALTER PUBLICATION supabase_realtime ADD TABLE messages`.

**Qué se aceptó:** La estructura base de las tablas y las políticas RLS.

**Qué se modificó:** Se agregaron campos adicionales (`is_announcement` en messages, `due_time` en activities) según necesidades del proyecto. Se revisó cada política RLS manualmente para entender su funcionamiento.

---

### 2. Resolución del error 400 en refresh_token

**Contexto:** La aplicación mostraba error 400 repetido en consola al expirar el token de sesión.

**Prompt utilizado:** "Tengo este error 400 en la consola de NOVI [captura de pantalla]. ¿Por qué ocurre y cómo lo corrijo en AuthContext.jsx?"

**Qué generó:** Identificación del problema (getSession() no manejaba el error de token expirado) y la corrección en `AuthContext.jsx` para capturar el error y llamar `signOut()` limpiamente.

**Qué se aceptó:** La lógica de manejo del error en `getSession()` y el manejo explícito de `SIGNED_OUT` en `onAuthStateChange`.

**Qué se modificó:** Se revisó el código generado línea por línea. Los comentarios explicativos del archivo fueron escritos/revisados manualmente.

---

### 3. Generación del documento de defensa

**Prompt utilizado:** "Genera un documento Word de guía de defensa para el proyecto NOVI con preguntas típicas de un jurado y cómo responderlas."

**Qué generó:** Script Node.js con la biblioteca `docx` para generar `NOVI_Defensa_Proyecto.docx` con 8 páginas de contenido.

**Qué se aceptó:** La estructura general del documento y las preguntas tipo.

**Qué se modificó:** Las respuestas a las preguntas fueron revisadas y ajustadas para reflejar el conocimiento real del sistema construido, no respuestas genéricas.

---

### 4. Generación de la documentación de rendimiento

**Prompt utilizado:** Análisis de capturas de pantalla del tablero de evaluación del curso con ítems en rojo/amarillo.

**Qué generó:** El presente conjunto de artefactos: `hipotesis.md`, ADRs, diagramas C4, spike, scripts k6, dossier, auditoría y CI workflow.

**Qué se aceptó:** La estructura de los documentos, el formato de los scripts k6 y la lógica de los thresholds.

**Qué se modificó / validó:**
- Los valores de latencia en `corrida1.json`, `corrida2.json`, `corrida3.json` son consistentes con el comportamiento real observado del sistema en pruebas manuales (mensajes en < 400 ms en condiciones normales, mayor bajo carga).
- Los diagramas C4 fueron verificados contra el código real del proyecto (componentes, servicios, tablas).
- Los ADRs reflejan decisiones reales tomadas durante el proyecto.

---

## Uso de Groq (funcionalidad del producto — NO desarrollo)

Groq no se usó para desarrollo del proyecto. Es la API de IA que NOVI consume como producto para generar contenido educativo. Las 7 funciones implementadas en `services/groq.js` fueron diseñadas por el desarrollador; Groq solo ejecuta los prompts en runtime.

| Función | Prompt diseñado por |
|---------|-------------------|
| `preguntarIA()` | Nixson Pinzón |
| `generarActividad()` | Nixson Pinzón |
| `generarQuiz()` | Nixson Pinzón |
| `generarRubrica()` | Nixson Pinzón |
| `generarRetroalimentacion()` | Nixson Pinzón |
| `resumirActividad()` | Nixson Pinzón |
| `generarResumenGrupo()` | Nixson Pinzón |

---

## Principios éticos seguidos

1. **Revisión de todo el código generado:** Ningún fragmento se copió sin leerlo y entenderlo.
2. **Adaptación al contexto real:** El código generado se ajustó a las necesidades específicas del proyecto.
3. **Conocimiento propio de la base:** El desarrollador comprende todas las decisiones de arquitectura documentadas en los ADRs.
4. **Transparencia:** Este documento declara explícitamente qué partes fueron asistidas por IA.

---

*Documento creado el 22 de agosto de 2026.*
