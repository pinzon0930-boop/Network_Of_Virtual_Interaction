# ============================================================
# DOCKERFILE — Educa AI Frontend
# ============================================================
# Construcción en dos etapas (multi-stage build):
#   Etapa 1 (builder): compila la app React con Node.js.
#   Etapa 2 (nginx):   sirve los archivos estáticos con Nginx.
# Resultado: imagen pequeña y lista para producción.
# ============================================================

# ---- ETAPA 1: Compilar la app React ----
FROM node:18-alpine AS builder
# node:18-alpine: imagen oficial de Node.js versión 18 sobre Alpine Linux (muy liviana).
# AS builder: le da el nombre "builder" a esta etapa para referenciarlo después.

WORKDIR /app
# WORKDIR: define /app como el directorio de trabajo dentro del contenedor.
# Todos los comandos siguientes se ejecutarán desde /app.

# Declarar argumentos de build — se pasan con --build-arg al construir la imagen.
ARG VITE_SUPABASE_URL
# ARG VITE_SUPABASE_URL: declara el argumento con la URL del proyecto Supabase.

ARG VITE_SUPABASE_ANON_KEY
# ARG VITE_SUPABASE_ANON_KEY: declara el argumento con la clave pública de Supabase.

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
# ENV: convierte el ARG en variable de entorno para que Vite pueda leerla durante el build.

ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
# ENV: lo mismo para la clave anon. Vite lee variables que empiezan con VITE_ automáticamente.

COPY package*.json ./
# Copia package.json y package-lock.json al contenedor.
# Se hace antes del resto del código para aprovechar el caché de Docker:
# si los archivos de dependencias no cambian, Docker no re-instala los paquetes.

RUN npm install
# Instala todas las dependencias del proyecto definidas en package.json.

COPY . .
# Copia todo el código fuente del proyecto al contenedor (respetando .dockerignore).

RUN npm run build
# Ejecuta el build de producción de Vite.
# Genera la carpeta /app/dist con HTML, CSS y JS optimizados y minificados.

# ---- ETAPA 2: Servir los archivos con Nginx ----
FROM nginx:alpine
# nginx:alpine: imagen oficial de Nginx sobre Alpine Linux.
# Esta etapa DESCARTA todo lo de la etapa builder — solo toma los archivos compilados.
# Resultado: imagen final muy pequeña (sin Node.js, sin node_modules).

COPY --from=builder /app/dist /usr/share/nginx/html
# Copia los archivos compilados (dist/) desde la etapa "builder" al directorio de Nginx.
# /usr/share/nginx/html es donde Nginx sirve los archivos estáticos por defecto.

COPY nginx.conf /etc/nginx/conf.d/default.conf
# Reemplaza la configuración por defecto de Nginx con nuestra configuración personalizada.
# La configuración personalizada permite que React Router funcione correctamente.

EXPOSE 80
# Documenta que el contenedor escucha en el puerto 80 (HTTP).
# No abre el puerto por sí solo — eso lo hace "docker run -p 8080:80".

CMD ["nginx", "-g", "daemon off;"]
# Comando que se ejecuta cuando el contenedor inicia.
# "daemon off;" hace que Nginx corra en primer plano (foreground),
# necesario para que Docker sepa que el proceso está activo.
