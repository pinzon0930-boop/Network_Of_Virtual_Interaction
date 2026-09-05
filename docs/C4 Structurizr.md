**Contexto N1 - C4**
<img width="1236" height="528" alt="{496F6EE3-6727-4343-A7BA-5D5FB63A3AD3}" src="https://github.com/user-attachments/assets/97076e7d-2fc6-4d14-9bcc-4e3bf03791bf" />

**Contenedores N2 - C4**
<img width="981" height="666" alt="{EC5A6AAE-7664-4FA1-BE1F-671639E22159}" src="https://github.com/user-attachments/assets/03263001-9262-4aad-9499-835db3869514" />

**Componentes N3 - C4**
<img width="1336" height="256" alt="{AE4BE5C7-BE75-4E2E-B00F-4C97B24D1D12}" src="https://github.com/user-attachments/assets/edcd1a4a-86cd-4599-b19a-84db3b86b020" />

**Código utilizado**


    workspace "NOVI" "Plataforma educativa para gestión académica, comunicación grupal y herramientas de IA" {

    !identifiers hierarchical

    model {

        estudiante = person "Estudiante" "Consulta actividades, participa en grupos y utiliza herramientas de IA"

        profesor = person "Profesor" "a grupos, crea actividades y genera quizzes y rúbricas"


        novi = softwareSystem "NOVI" "Plataforma educativa para gestión académica, comunicación grupal y herramientas de IA" {

            web = container "Aplicación Web" "Interfaz de usuario, Gestión de grupos, Gestión de actividades, Comunicación grupal" {

                authc = component "Autenticación" "Registro de usuarios, Inicio de sesión, Cierre de sesión, Control de acceso"

                group = component "Gestión de Grupos" "Creación y consulta de grupos, Gestión de membresías, Relación usuarios-grupos"

                msg = component "Gestión de Mensajes" "Envío y consulta de mensajes, Comunicación grupal, Actualizaciones en tiempo real"

                act = component "Gestión de Actividades" "Creación y consulta de actividades, Información de actividades, Asociación con grupos"


                tutor = component "Asistencia Académica" "Tutor NOVI, Consultas académicas, Apoyo a estudiantes" {
                    tags "AI"
                }

                genact = component "Generación de Actividades" "Generación de títulos, Generación de descripciones, Basado en un tema" {
                    tags "AI"
                }

                quiz = component "Generación de Quizzes" "Generación de preguntas, Opción múltiple, Evaluación estructurada" {
                    tags "AI"
                }

                rubric = component "Generación de Rúbricas" "Criterios de evaluación, Niveles de evaluación, Instrumentos de evaluación" {
                    tags "AI"
                }

                feedback = component "Retroalimentación" "Análisis de respuestas, Generación de observaciones, Seguimiento académico" {
                    tags "AI"
                }

                explain = component "Explicación Simplificada" "Transformación de instrucciones, Lenguaje sencillo, Facilita la comprensión" {
                    tags "AI"
                }

                summary = component "Resumen del Grupo" "Estado de actividades, Recomendaciones pedagógicas, Seguimiento del grupo" {
                    tags "AI"
                }
            }
        }


        auth = softwareSystem "Supabase Auth" "Servicio externo de autenticación"

        db = softwareSystem "PostgreSQL — Supabase" "Persistencia de datos, Usuarios, Grupos y membresías, Mensajes, Actividades, Row Level Security" {
            tags "Database"
        }

        rt = softwareSystem "Supabase Realtime" "Comunicación en tiempo real, Suscripción a cambios"

        groq = softwareSystem "Groq API" "Servicio externo de Inteligencia Artificial"


        estudiante -> novi "Utiliza"

        profesor -> novi "Administra"

        novi -> groq "Solicita servicios de IA"

        groq -> novi "Devuelve respuestas generadas"


        estudiante -> novi.web "Utiliza"

        profesor -> novi.web "Administra"

        novi.web -> auth "Autentica usuarios"

        novi.web -> db "Consulta y almacena datos"

        novi.web -> rt "Gestiona comunicación"

        novi.web -> groq "Solicita servicios de IA"

        groq -> novi.web "Devuelve respuestas generadas"


        novi.web.authc -> auth "Autentica"

        novi.web.group -> db "Consulta y gestiona"

        novi.web.msg -> db "Almacena y consulta"

        novi.web.act -> db "Almacena y consulta"

        novi.web.msg -> rt "Gestiona cambios en tiempo real"


        novi.web.tutor -> groq "Solicita generación de contenido"

        novi.web.genact -> groq "Solicita generación de contenido"

        novi.web.quiz -> groq "Solicita generación de contenido"

        novi.web.rubric -> groq "Solicita generación de contenido"

        novi.web.feedback -> groq "Solicita análisis"

        novi.web.explain -> groq "Solicita transformación"

        novi.web.summary -> groq "Solicita análisis"
    }


    views {

        systemContext novi "Diagrama1" {
            include estudiante
            include profesor
            include novi
            include groq
            autolayout lr
        }


        container novi "Diagrama2" {
            include estudiante
            include profesor
            include novi.web
            include auth
            include db
            include rt
            include groq
            autolayout lr
        }


        component novi.web "Diagrama3" {
            include *
            autolayout tb
        }


        styles {

            element "Element" {
                color #f8289c
                stroke #f8289c
                strokeWidth 7
                shape roundedbox
            }

            element "Person" {
                shape person
            }

            element "Software System" {
                shape roundedbox
            }

            element "Container" {
                shape roundedbox
            }

            element "Component" {
                shape roundedbox
            }

            element "Database" {
                shape cylinder
            }

            element "AI" {
                color #1565C0
                stroke #64B5F6
                strokeWidth 2
            }

            relationship "Relationship" {
                thickness 4
            }
        }
    }


    configuration {
        scope softwaresystem
    }
}
