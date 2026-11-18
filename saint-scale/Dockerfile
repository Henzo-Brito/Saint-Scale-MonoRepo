# ─── SaintScale Frontend (Expo Web) — Dockerfile (multi-stage) ───────────────
# Stage 1: build  — constrói o bundle estático com Expo
# Stage 2: runner — Nginx serve os arquivos estáticos
# ─────────────────────────────────────────────────────────────────────────────
# EXPO_PUBLIC_API_URL é passada em build-time via --build-arg no docker-compose.
# Ela é embutida no bundle pelo Expo durante o export — não muda em runtime.
# Para apontar para um backend diferente, reconstrua a imagem.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# ARG é o mecanismo correto para variáveis de build-time do Expo
ARG EXPO_PUBLIC_API_URL=http://localhost:3000/api
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}

# Instala dependências
COPY package.json package-lock.json* yarn.lock* ./
RUN npm install --force

# Copia todo o projeto
COPY . .

# Gera build estático web (output: dist/)
RUN npx expo export --platform web

# ── Stage 2: runner (Nginx) ───────────────────────────────────────────────────
FROM nginx:stable-alpine AS runner

# Remove configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Configuração customizada para Expo Router (SPA com rotas client-side)
COPY --from=builder /app/docker/nginx.conf /etc/nginx/conf.d/default.conf

# Arquivos estáticos compilados
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
