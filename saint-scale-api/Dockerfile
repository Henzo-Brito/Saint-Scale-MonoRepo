# ─── SaintScale API — Dockerfile (multi-stage) ───────────────────────────────
# Stage 1: build  — compila TypeScript para JavaScript
# Stage 2: runner — imagem mínima de produção sem devDependencies
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Instala dependências (usa cache do layer quando package.json não muda)
COPY package.json yarn.lock* package-lock.json* ./
RUN npm install --include=dev --force

# Copia todo o código-fonte e compila
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: runner ───────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Apenas dependências de produção
COPY package.json ./
RUN npm install --omit=dev --force

# Arquivos compilados
COPY --from=builder /app/dist ./dist

# Interface administrativa (HTMLs/CSS/JS lidos em runtime por serveAdminFile)
# O app.ts compilado resolve: join(__dirname, "..", "src", "admin-web")
# __dirname em dist/app.js = /app/dist → "../src/admin-web" = /app/src/admin-web
COPY src/admin-web ./src/admin-web

# ENTREGA/public é montado como volume pelo docker-compose (./ENTREGA → /app/ENTREGA)
# O app.ts resolve "../ENTREGA/public" a partir de /app/dist → /app/ENTREGA/public ✓

# Variáveis de ambiente (sem valores sensíveis — definidas via compose/.env)
ENV PORT=3000
ENV NODE_ENV=production

# O servidor precisa ouvir em 0.0.0.0 para ser acessível fora do container.
# O @hono/node-server usa process.env.PORT; o host padrão já é 0.0.0.0.
EXPOSE 3000

# Usuário não-root para segurança
USER node

CMD ["node", "dist/index.js"]
