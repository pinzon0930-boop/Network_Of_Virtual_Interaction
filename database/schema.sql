-- ============================================================
-- ESQUEMA DE BASE DE DATOS - EDUCA AI
-- ============================================================
-- Este archivo crea todas las tablas necesarias para la plataforma.
-- Se ejecuta una sola vez en el SQL Editor de Supabase.
-- ============================================================


-- ============================================================
-- TABLA: users
-- ============================================================
-- Guarda la información adicional de cada usuario.
-- Supabase Auth ya guarda el email y contraseña en auth.users.
-- Esta tabla guarda datos extra como nombre y rol.
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    -- id: identificador único del usuario. 
    -- UUID es un número único generado automáticamente (ej: "a1b2c3d4-...").
    -- REFERENCES auth.users(id) conecta esta tabla con la tabla de autenticación de Supabase.
    -- ON DELETE CASCADE: si se elimina el usuario de auth, se elimina también de aquí.

    name TEXT NOT NULL,
    -- name: nombre completo del usuario. TEXT permite cualquier texto. NOT NULL significa que es obligatorio.

    email TEXT NOT NULL UNIQUE,
    -- email: correo electrónico. UNIQUE significa que no puede repetirse.

    role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
    -- role: el tipo de usuario. Solo puede ser 'teacher' (profesor) o 'student' (estudiante).
    -- CHECK valida que el valor sea uno de los permitidos.

    created_at TIMESTAMPTZ DEFAULT NOW()
    -- created_at: fecha y hora en que se creó el registro.
    -- DEFAULT NOW() pone automáticamente la fecha y hora actual.
);


-- ============================================================
-- TABLA: groups
-- ============================================================
-- Guarda los grupos creados por los profesores.
-- Cada grupo tiene un código único que los estudiantes usan para unirse.
-- ============================================================

CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- id: identificador único del grupo generado automáticamente.

    name TEXT NOT NULL,
    -- name: nombre del grupo (ej: "Matemáticas 10A").

    description TEXT,
    -- description: descripción opcional del grupo.

    subject TEXT NOT NULL,
    -- subject: nombre de la asignatura (ej: "Álgebra", "Historia").

    access_code TEXT NOT NULL UNIQUE,
    -- access_code: código que los estudiantes ingresan para unirse (ej: "MAT-2026-8F42").
    -- UNIQUE garantiza que no haya dos grupos con el mismo código.

    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- teacher_id: ID del profesor que creó el grupo.
    -- REFERENCES users(id) indica que debe existir un usuario con ese ID.

    is_active BOOLEAN DEFAULT TRUE,
    -- is_active: indica si el grupo está activo. Por defecto es verdadero (TRUE).

    created_at TIMESTAMPTZ DEFAULT NOW()
    -- created_at: fecha y hora de creación del grupo.
);


-- ============================================================
-- TABLA: group_members
-- ============================================================
-- Relaciona estudiantes con grupos.
-- Un estudiante puede estar en varios grupos y un grupo puede tener varios estudiantes.
-- ============================================================

CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- id: identificador único de esta relación.

    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    -- group_id: ID del grupo al que pertenece el estudiante.

    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- student_id: ID del estudiante que pertenece al grupo.

    joined_at TIMESTAMPTZ DEFAULT NOW(),
    -- joined_at: fecha y hora en que el estudiante se unió al grupo.

    UNIQUE(group_id, student_id)
    -- UNIQUE(group_id, student_id): evita que un estudiante se una al mismo grupo dos veces.
);


-- ============================================================
-- TABLA: messages
-- ============================================================
-- Guarda los mensajes del chat de cada grupo.
-- ============================================================

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- id: identificador único del mensaje.

    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    -- group_id: ID del grupo donde se envió el mensaje.

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- user_id: ID del usuario que envió el mensaje.

    content TEXT NOT NULL,
    -- content: el texto del mensaje.

    is_announcement BOOLEAN DEFAULT FALSE,
    -- is_announcement: indica si el mensaje es un anuncio del profesor. Por defecto es falso.

    created_at TIMESTAMPTZ DEFAULT NOW()
    -- created_at: fecha y hora en que se envió el mensaje.
);


-- ============================================================
-- TABLA: activities
-- ============================================================
-- Guarda las actividades académicas creadas por los profesores.
-- ============================================================

CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- id: identificador único de la actividad.

    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    -- group_id: ID del grupo al que pertenece la actividad.

    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- teacher_id: ID del profesor que creó la actividad.

    title TEXT NOT NULL,
    -- title: título de la actividad (ej: "Taller de ecuaciones").

    description TEXT,
    -- description: descripción detallada de la actividad.

    type TEXT NOT NULL CHECK (type IN ('tarea', 'quiz', 'parcial', 'exposicion', 'trabajo')),
    -- type: tipo de actividad. Solo puede ser uno de los valores permitidos.

    due_date DATE NOT NULL,
    -- due_date: fecha de entrega de la actividad (solo la fecha, sin hora).

    due_time TIME,
    -- due_time: hora de entrega (opcional).

    created_at TIMESTAMPTZ DEFAULT NOW()
    -- created_at: fecha y hora de creación de la actividad.
);


-- ============================================================
-- TABLA: ai_config
-- ============================================================
-- Guarda la configuración del asistente de IA para cada grupo.
-- El profesor puede escribir información de la asignatura para que la IA la use.
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- id: identificador único de la configuración.

    group_id UUID NOT NULL UNIQUE REFERENCES groups(id) ON DELETE CASCADE,
    -- group_id: ID del grupo al que pertenece esta configuración.
    -- UNIQUE: cada grupo solo puede tener una configuración de IA.

    assistant_name TEXT DEFAULT 'Asistente IA',
    -- assistant_name: nombre del asistente (el profesor puede personalizarlo).

    subject_info TEXT,
    -- subject_info: información de la asignatura que la IA usará como contexto.
    -- Ejemplo: "Asignatura: Bases de Datos. Temas: SQL, SELECT, INSERT, UPDATE..."

    welcome_message TEXT DEFAULT '¡Hola! Soy tu asistente de IA. ¿En qué te puedo ayudar?',
    -- welcome_message: mensaje de bienvenida que muestra el asistente al inicio.

    updated_at TIMESTAMPTZ DEFAULT NOW()
    -- updated_at: fecha y hora de la última actualización.
);


-- ============================================================
-- POLÍTICAS DE SEGURIDAD (Row Level Security - RLS)
-- ============================================================
-- RLS controla quién puede ver o modificar cada fila de las tablas.
-- Sin RLS, cualquier usuario podría ver datos de otros usuarios.
-- ============================================================

-- Activa RLS en todas las tablas.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;


-- POLÍTICAS PARA: users
-- Un usuario solo puede ver y modificar su propia información.

CREATE POLICY "Usuario puede ver su propio perfil"
ON users FOR SELECT
USING (auth.uid() = id);
-- auth.uid() devuelve el ID del usuario que está haciendo la consulta.
-- Solo permite ver la fila donde el ID coincide con el usuario actual.

CREATE POLICY "Usuario puede actualizar su propio perfil"
ON users FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Usuario puede insertar su perfil"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);


-- POLÍTICAS PARA: groups
-- Los profesores pueden crear y ver sus grupos.
-- Los estudiantes pueden ver los grupos a los que pertenecen.

CREATE POLICY "Profesores pueden crear grupos"
ON groups FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Profesores pueden actualizar sus grupos"
ON groups FOR UPDATE
USING (auth.uid() = teacher_id);

CREATE POLICY "Usuarios pueden ver grupos donde son miembros o profesores"
ON groups FOR SELECT
USING (
    auth.uid() = teacher_id  -- Es el profesor del grupo.
    OR
    EXISTS (  -- O es un estudiante que pertenece al grupo.
        SELECT 1 FROM group_members
        WHERE group_members.group_id = groups.id
        AND group_members.student_id = auth.uid()
    )
);

-- Política para buscar grupo por código (necesaria para unirse a un grupo).
CREATE POLICY "Cualquier usuario autenticado puede buscar grupos por código"
ON groups FOR SELECT
USING (auth.role() = 'authenticated');


-- POLÍTICAS PARA: group_members
-- Los estudiantes pueden unirse a grupos y ver sus membresías.
-- Los profesores pueden ver los miembros de sus grupos.

CREATE POLICY "Estudiantes pueden unirse a grupos"
ON group_members FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Usuarios pueden ver membresías de sus grupos"
ON group_members FOR SELECT
USING (
    auth.uid() = student_id  -- Es el estudiante de esta membresía.
    OR
    EXISTS (  -- O es el profesor del grupo.
        SELECT 1 FROM groups
        WHERE groups.id = group_members.group_id
        AND groups.teacher_id = auth.uid()
    )
);


-- POLÍTICAS PARA: messages
-- Los miembros del grupo (estudiantes y profesor) pueden ver y enviar mensajes.

CREATE POLICY "Miembros del grupo pueden ver mensajes"
ON messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM groups
        WHERE groups.id = messages.group_id
        AND (
            groups.teacher_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM group_members
                WHERE group_members.group_id = messages.group_id
                AND group_members.student_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Miembros del grupo pueden enviar mensajes"
ON messages FOR INSERT
WITH CHECK (
    auth.uid() = user_id  -- Solo puede enviar mensajes como tú mismo.
    AND EXISTS (
        SELECT 1 FROM groups
        WHERE groups.id = messages.group_id
        AND (
            groups.teacher_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM group_members
                WHERE group_members.group_id = messages.group_id
                AND group_members.student_id = auth.uid()
            )
        )
    )
);


-- POLÍTICAS PARA: activities
-- Los profesores pueden crear actividades. Los miembros pueden verlas.

CREATE POLICY "Profesores pueden crear actividades"
ON activities FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Profesores pueden actualizar sus actividades"
ON activities FOR UPDATE
USING (auth.uid() = teacher_id);

CREATE POLICY "Miembros del grupo pueden ver actividades"
ON activities FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM groups
        WHERE groups.id = activities.group_id
        AND (
            groups.teacher_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM group_members
                WHERE group_members.group_id = activities.group_id
                AND group_members.student_id = auth.uid()
            )
        )
    )
);


-- POLÍTICAS PARA: ai_config
-- Solo el profesor puede configurar la IA. Los miembros pueden verla.

CREATE POLICY "Profesores pueden gestionar configuración de IA"
ON ai_config FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM groups
        WHERE groups.id = ai_config.group_id
        AND groups.teacher_id = auth.uid()
    )
);

CREATE POLICY "Miembros del grupo pueden ver configuración de IA"
ON ai_config FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM groups
        WHERE groups.id = ai_config.group_id
        AND (
            groups.teacher_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM group_members
                WHERE group_members.group_id = ai_config.group_id
                AND group_members.student_id = auth.uid()
            )
        )
    )
);


-- ============================================================
-- HABILITAR REALTIME (para el chat en tiempo real)
-- ============================================================
-- Esto permite que Supabase envíe actualizaciones automáticas
-- cuando se inserta un nuevo mensaje en la tabla messages.
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- Agrega la tabla messages a la publicación de Supabase Realtime.
-- Así, cuando llegue un nuevo mensaje, todos los usuarios del chat lo recibirán automáticamente.

