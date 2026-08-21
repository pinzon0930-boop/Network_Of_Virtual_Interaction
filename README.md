<div align="center">

# 🎓 NOVI
### Network Of Virtual Interaction

**Plataforma educativa de comunicación en tiempo real asistida por IA**

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20Realtime-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Groq](https://img.shields.io/badge/Groq-AI-F55036?logo=groq&logoColor=white)](https://groq.com/)
[![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render&logoColor=white)](https://render.com/)

</div>

---

## ¿Qué es NOVI?

NOVI es una SPA (Single Page Application) que conecta profesores y estudiantes en un entorno de comunicación en tiempo real. Los profesores crean grupos de clase, generan actividades con ayuda de IA y monitorean el progreso. Los estudiantes se unen con un código, participan en el chat grupal y acceden a herramientas de apoyo académico impulsadas por inteligencia artificial.

---

## ✨ Funcionalidades

### Para profesores 👨‍🏫
- **Gestión de grupos** — Crea grupos de clase con código de invitación único
- **Chat en tiempo real** — Comunicación instantánea con todos los miembros del grupo (Supabase Realtime)
- **Creación de actividades** — Genera títulos y descripciones de actividades con IA
- **Generador de quiz** — Crea preguntas de opción múltiple sobre cualquier tema en segundos
- **Rúbricas automáticas** — Genera rúbricas de evaluación con niveles detallados
- **Retroalimentación con IA** — Analiza respuestas de estudiantes y genera feedback constructivo
- **Resumen del grupo** — Panorama del estado del grupo con recomendaciones pedagógicas

### Para estudiantes 📚
- **Unirse por código** — Acceso instantáneo a grupos con un código de 6 caracteres
- **Chat grupal** — Participación en la conversación del grupo en tiempo real
- **Tutor NOVI** — Asistente académico disponible en el panel lateral para resolver dudas
- **Explicaciones simplificadas** — Las actividades se explican en lenguaje simple al instante

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite |
| Estilos | Tailwind CSS |
| Base de datos | Supabase (PostgreSQL) |
| Tiempo real | Supabase Realtime (WebSockets) |
| Autenticación | Supabase Auth |
| IA | Groq API — modelo `openai/gpt-oss-20b` |
| Deploy | Render (Static Site) |

---

## 📸 Capturas de pantalla

| Login | Dashboard |
|-------|-----------|
| ![Login](docs/screenshots/login.png) | ![Dashboard](docs/screenshots/dashboard.png) |

| Chat grupal | Tutor NOVI |
|-------------|-----------|
| ![Chat](docs/screenshots/chat.png) | ![Tutor](docs/screenshots/tutor.png) |

| Generador de quiz | Rúbrica automática |
|-------------------|--------------------|
| ![Quiz](docs/screenshots/quiz.png) | ![Rubrica](docs/screenshots/rubrica.png) |

---

## 📁 Estructura del proyecto

```
educa-ai/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AsistenteIA.jsx        # Panel tutor académico con Groq
│   │   │   ├── ModalQuiz.jsx          # Generador de quiz IA
│   │   │   ├── ModalRubrica.jsx       # Generador de rúbricas IA
│   │   │   ├── ModalRetroalimentacion.jsx  # Feedback automático
│   │   │   ├── ModalExplicacion.jsx   # Explicación simple para estudiantes
│   │   │   └── CrearActividad.jsx     # Creación de actividades con IA
│   │   ├── pages/
│   │   │   ├── Login.jsx              # Autenticación
│   │   │   ├── Register.jsx           # Registro (estudiante / profesor)
│   │   │   ├── Dashboard.jsx          # Mis grupos
│   │   │   ├── Grupos.jsx             # Vista de grupos
│   │   │   └── GrupoDetalle.jsx       # Chat + actividades del grupo
│   │   ├── services/
│   │   │   ├── auth.js                # Registro, login, logout con Supabase
│   │   │   ├── grupos.js              # CRUD de grupos y membresías
│   │   │   ├── mensajes.js            # Mensajes + suscripción Realtime
│   │   │   ├── actividades.js         # CRUD de actividades
│   │   │   └── groq.js                # 7 funciones de IA con Groq
│   │   ├── App.jsx                    # Rutas (React Router)
│   │   └── main.jsx                   # Entry point
│   ├── index.html
│   └── vite.config.js
├── backend/                           # (Reservado para futuras extensiones)
├── database/                          # Scripts SQL de inicialización
└── .gitignore
```

---

## 🚀 Instalación local

### Prerrequisitos
- Node.js 18+
- npm 9+
- Una cuenta en [Supabase](https://supabase.com/) (gratuita)
- Una clave de API de [Groq](https://console.groq.com/) (gratuita)

### 1. Clonar el repositorio

```bash
git clone https://github.com/pinzon0930-boop/educa-ai.git
cd educa-ai/frontend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `frontend/`:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GROQ_API_KEY=gsk_...
```

> ⚠️ **Importante:** Nunca compartas ni subas tus claves al repositorio. El archivo `.env` ya está incluido en `.gitignore`.

### 4. Inicializar la base de datos

Ejecuta los scripts SQL de la carpeta `database/` en el Editor SQL de tu proyecto Supabase en el siguiente orden:

```
database/
├── 01_schema.sql    # Tablas: profiles, groups, group_members, messages, activities
├── 02_rls.sql       # Políticas Row Level Security
└── 03_seed.sql      # (Opcional) Datos de prueba
```

### 5. Levantar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

---

## 🌐 Deploy en Render

NOVI está configurado para desplegarse como **Static Site** en Render.

| Parámetro | Valor |
|-----------|-------|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

Recuerda agregar las tres variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GROQ_API_KEY`) en la sección **Environment** de tu servicio en Render.

---

## 🔑 Variables de entorno

| Variable | Descripción | Dónde obtenerla |
|----------|-------------|-----------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Clave anon pública de Supabase | Supabase → Project Settings → API |
| `VITE_GROQ_API_KEY` | Clave de API de Groq | [console.groq.com](https://console.groq.com/) |

---

## 🤖 Integración con IA (Groq)

NOVI usa la API de Groq con el modelo `openai/gpt-oss-20b` a través de siete funciones especializadas en `services/groq.js`:

| Función | Propósito |
|---------|-----------|
| `preguntarIA(pregunta)` | Tutor académico para estudiantes |
| `generarActividad(tema)` | Crea actividades educativas completas |
| `generarQuiz(tema, cantidad)` | Genera preguntas de opción múltiple en JSON |
| `generarRubrica(titulo, descripcion)` | Rúbrica con niveles Excelente / Bueno / Regular / Insuficiente |
| `generarRetroalimentacion(titulo, respuesta)` | Feedback constructivo sobre respuestas |
| `resumirActividad(titulo, descripcion)` | Explica actividades en lenguaje simple |
| `generarResumenGrupo(actividades)` | Análisis del estado del grupo para el profesor |

---

## 🗄️ Modelo de datos

```
profiles          groups            group_members
──────────        ──────────        ──────────────
id (FK auth)      id                id
name              name              group_id → groups
role              description       user_id  → profiles
email             code (unique)     joined_at
                  teacher_id → profiles

messages          activities
──────────        ──────────
id                id
group_id          group_id → groups
user_id           title
content           description
created_at        created_at
```

---

## 👨‍💻 Autores

- **Nixson Pinzón**
- **Roberto Hernández**
- **Camilo Flórez**
- **Michael Lopez**

Proyecto académico — Ingeniería de Sistemas

---

<div align="center">
Hecho con ❤️ usando React · Supabase · Groq
</div>
