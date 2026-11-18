# SaintScale

## Objetivo

SaintScale é um aplicativo mobile para gerenciamento de escalas de ministério de louvor em igrejas. Permite que membros visualizem suas escalas, acompanhem o repertório de músicas, recebam alertas e notificações, e gerenciem seu perfil.

---

## Arquitetura

```
Frontend (React Native / Expo)         ←→ HTTP/JSON (REST) ←→  Backend (Hono + Node.js)  ←→  PostgreSQL (Render.com)
```

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | React Native + Expo SDK | 0.85.3 / 56 |
| Roteamento | Expo Router (file-based) | ~56.2.20 |
| Estado assíncrono | TanStack Query | ^5.102.5 |
| HTTP | Axios | ^1.20.0 |
| Validação | Zod | ^4.4.3 |
| Backend | Hono + Node.js (tsx) | ^4.13 |
| ORM/Query | pg (driver puro) | ^8.23.0 |
| Auth | jose (JWT HS256) + argon2id | ^6.2 / ^0.45 |
| Banco | PostgreSQL | 14+ (Render.com) |
| Linter/Formatter | Biome | ^2.5 |

---

## Frontend

### Estrutura de rotas (Expo Router)

```
src/app/
  _layout.tsx             → Root layout: QueryClientProvider + proteção de rotas
  auth/
    index.tsx             → Onboarding (4 slides)
    login.tsx             → Login
    signUp.tsx            → Cadastro (2 etapas)
    forgotPassword.tsx    → Redefinir senha
  (tabs)/
    _layout.tsx           → Tab bar (Início, Avisos, Perfil)
    index.tsx             → Home (calendário + escalas + indisponibilidades)
    warnings.tsx          → Avisos (alertas + notificações)
    user.tsx              → Perfil do usuário
  scale/[id].tsx          → Detalhe de escala (abas: info, músicas, membros)
  music/[id].tsx          → Detalhe de música
  avisos/[id].tsx         → Detalhe de aviso/alerta
```

### Serviços (comunicação com API)

```
src/services/
  api.ts        → Instância Axios com interceptors de auth
  session.ts    → Persistência de JWT (SecureStore nativo / localStorage web)
  auth.ts       → login() / logout()
  users.ts      → getMe() + todos os PATCHes de perfil + createUser() + forgotPassword()
  home.ts       → getMonth() / getUnavailability() / getMyScales() / getScaleDay()
  scales.ts     → getScale() / getScaleMusics() / getScaleInfo() / getScaleMembers() / etc.
  alerts.ts     → getReminder() / getReminderDetail()
```

### Tipos e schemas

```
src/types/api.types.ts     → Tipos alinhados com todos os endpoints da API
src/schemas/
  auth.schemas.ts          → LoginSchema / LoginResponseSchema
  user.schemas.ts          → CreateUserSchema
```

---

## Backend

### Endpoints (23 total)

| Método | Endpoint | Auth | Descrição |
|--------|---------|------|-----------|
| POST | `/api/auth/login` | Público | Login, retorna JWT |
| POST | `/api/user` | Público | Criar usuário |
| GET | `/api/user` | JWT | Listar todos os usuários |
| GET | `/api/user/me` | JWT | Perfil do usuário autenticado |
| PATCH | `/api/user/alterEmail` | JWT | Alterar email |
| PATCH | `/api/user/forgotPassword` | Público | Redefinir senha (identifica por email) |
| PATCH | `/api/user/alterLogradouro` | JWT | Alterar endereço |
| PATCH | `/api/user/alterBirthday` | JWT | Alterar data de nascimento |
| PATCH | `/api/user/alterTelephone` | JWT | Alterar telefone |
| GET | `/api/home/month/{mes}` | JWT | Escalas do mês |
| GET | `/api/home/unavailability/{mes}` | JWT | Indisponibilidades do mês |
| GET | `/api/home/scale/me` | JWT | Minhas escalas (JWT) |
| GET | `/api/home/scale/day/{day}` | JWT | Escalas de um dia (DDMMYYYY) |
| GET | `/api/alert/reminder` | JWT | Alertas + notificações do usuário |
| GET | `/api/alert/reminder/{id}` | JWT | Detalhe de um alerta |
| GET | `/api/scale/{id}` | JWT | Detalhes de uma escala |
| GET | `/api/scale/{id}/musics` | JWT | Músicas de uma escala |
| GET | `/api/scale/{id}/music/{id_me}` | JWT | Detalhe de música com scale_id |
| GET | `/api/scale/{id}/info` | JWT | Info geral (membros, local, indisponibilidades) |
| GET | `/api/scale/{id}/members` | JWT | Membros da escala |
| POST | `/api/scale/sair` | JWT | Sair da escala |
| POST | `/api/scale/substituir` | JWT | Substituir membro |
| GET | `/api/music/{id_music_escalas}` | JWT | Detalhe de música (sem scale_id) |

Documentação interativa disponível em `https://saint-scale-api-1.onrender.com/scalar`.

### Estrutura do backend

```
src/
  index.ts           → Entry point (Hono Node server)
  app.ts             → Configura app e roteamento
  routes/
    auth/            → Login + geração JWT
    user/            → CRUD de membros
    home/            → Escalas por mês/dia + indisponibilidades
    scale/           → Detalhes de escalas + músicas + membros
    alert/           → Alertas e notificações
  schemas/           → Schemas Zod (contrato da API)
  middlewares/
    auth.middleware.ts  → Verifica JWT Bearer
  db/
    index.ts         → Pool de conexão PostgreSQL
    migrate.ts       → Executa tcc.sql no banco
    tcc.sql          → Schema completo + seed de dados
  tools/             → Helpers para criar rotas tipadas
```

---

## Banco de Dados

### Tabelas

```
funcoes              (id_funcao, nome)
logradouros          (id_logradouro, rua, numero) — UNIQUE(rua, numero)
equipes              (id_equipes, img_id, title)
membros              (id_membro, nome, email, senha, img_id, cargo,
                      data_nascimento, telefone, id_logradouro_fk, data_registro)
equipes_membros      (id_equipes_membros, id_membros_fk, id_equipes_fk)
membros_funcoes      (id_membros_funcoes, id_membros_fk, id_funcoes_fk)
escalas              (id_escala, nome_escala, data_hora, descricao, local, data_registro)
musicas              (id_musica, nome, autor, tom VARCHAR(10), bpm SMALLINT,
                      link_spotify, link_youtube, link_cifra, link_letra, duracao, img_id)
musicas_escalas      (id_musica_escala, tom VARCHAR(10), ordem INTEGER,
                      id_escala_fk, id_musica_fk)
ENUM DISPONIBILIDADE ('indisponível', 'confirmado', 'pendente')
membros_escalas      (id_membro_escala, id_escala_fk, id_membro_fk,
                      id_funcao_fk, disponibilidade, data_registro)
lembretes            (id_lembrete, nome, data DATE, tempo TIME, descricao, data_registro)
lembrete_funcoes     (id, id_lembrete_fk, id_funcao_fk)
notificacoes         (id_notificacao, id_membro_fk, titulo, conteudo TEXT,
                      data DATE, data_registro)
```

---

## Autenticação

### Fluxo completo

```
1. Usuário preenche email + senha em /auth/login
2. POST /api/auth/login → { accessToken, tokenType: "Bearer" }
3. session.save(accessToken) → expo-secure-store (nativo) / localStorage (web)
4. _layout.tsx verifica token ao iniciar → redireciona para /(tabs) ou /auth
5. api.ts injeta token em todas as requisições via interceptor de request
6. Em 401 → session.clear() → callback notifica _layout → redirect para /auth
7. Logout → logout() → session.clear() → router.replace("/auth")
```

### Segurança
- Senhas hasheadas com argon2id (custo adaptativo)
- JWT HS256 com expiração de 1 hora
- Token armazenado em SecureStore (criptografado pelo SO)
- ID do usuário extraído do JWT no backend (sem IDOR)

---

## Como executar localmente

### Pré-requisitos
- Node.js (LTS)
- Docker (para banco local) ou acesso ao banco no Render
- npm

### Backend

```bash
cd saint-scale-api

# Instalar dependências
npm install

# Configurar ambiente (copie e edite com suas credenciais)
cp .env.example .env

# Banco local (opcional — se não usar Render)
docker-compose up -d

# Executar em modo desenvolvimento
npm run dev
# → http://localhost:3000
# → http://localhost:3000/scalar (documentação)
```

### Frontend

```bash
cd saint-scale

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm start

# Android direto
npm run android

# Web
npm run web
```

---

## Configuração de ambiente

### Backend — `.env`

```
DATABASE_URL=postgresql://user:password@host:5432/database
PORT=3000
JWT_SECRET=chave_secreta_forte
```

> **Importante:** Nunca exponha o `.env` no repositório. O arquivo está no `.gitignore`.

### Banco de dados

A URL interna do Render (`dpg-xxx-a/banco`) deve ser usada quando o backend está hospedado no Render. Para uso local com Docker, use `postgresql://postgres:postgres@localhost:5432/saintscale`.

O `db/index.ts` detecta automaticamente o ambiente e configura SSL adequadamente.

### Frontend

A URL da API está em `src/services/api.ts`. Para trocar de ambiente, edite diretamente:

```typescript
baseURL: "https://saint-scale-api-1.onrender.com/api"
```

---

## Migrations

> **Atenção:** A migration é destrutiva (DROP + CREATE). Em produção com dados reais, prefira ALTER TABLE incremental.

```bash
# Executar migration (APAGA E RECRIA TODAS AS TABELAS)
cd saint-scale-api
npm run migrate
```

O arquivo `src/db/tcc.sql` contém o schema completo com seed de dados para desenvolvimento.

---

## Linting e Formatação

O projeto usa [Biome](https://biomejs.dev/) como linter e formatter (substitui ESLint + Prettier).

```bash
# Verificar erros
npx biome check src/

# Corrigir automaticamente
npx biome check src/ --write
```

### Comandos do backend

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # biome lint --write ./src
npm run format      # biome format --write ./src
npm run build       # tsc (compila para dist/)
npm run start       # node dist/index.js (produção)
npm run dev         # tsx watch src/index.ts (desenvolvimento)
```

---

## Como gerar o APK

O projeto usa [EAS Build](https://docs.expo.dev/build/introduction/) da Expo.

### Pré-requisitos

```bash
npm install -g eas-cli
eas login  # conta Expo necessária
```

### Build

```bash
cd saint-scale

# APK Android (perfil preview — distribuição interna)
eas build --platform android --profile preview --non-interactive

# APK Android (perfil production)
eas build --platform android --profile production --non-interactive
```

O build é executado nos servidores do Expo. O link para download aparece ao final.

### Último build

- **Build ID:** `b0aec565-a251-40c2-b7b1-080baee46804`
- **URL:** https://expo.dev/accounts/henzo.santos/projects/TCC/builds/b0aec565-a251-40c2-b7b1-080baee46804
- **Perfil:** `preview` (buildType: apk)
- **Plataforma:** Android

### Configuração EAS (`eas.json`)

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    }
  }
}
```

---

## Comandos importantes

| Comando | Diretório | Descrição |
|---------|----------|-----------|
| `npm run dev` | `saint-scale-api/` | Iniciar backend em modo watch |
| `npm run migrate` | `saint-scale-api/` | Executar migration do banco |
| `npm run typecheck` | qualquer | Verificar tipos TypeScript |
| `npm run lint` | qualquer | Lint com Biome |
| `npm start` | `saint-scale/` | Iniciar app Expo |
| `npx biome check src/` | `saint-scale/` | Verificar lint + format |
| `eas build --platform android --profile preview` | `saint-scale/` | Gerar APK |

---

## Estado das funcionalidades

| Funcionalidade | Status |
|----------------|--------|
| Login / Cadastro | ✅ Funcionando |
| Redefinir senha | ✅ Funcionando |
| Persistência de sessão (JWT) | ✅ Funcionando |
| Proteção de rotas | ✅ Funcionando |
| Tela Home (calendário + escalas) | ✅ Integrado com API |
| Tela Avisos (alertas + notificações) | ✅ Integrado com API |
| Tela Perfil do usuário | ✅ Integrado com API |
| Edição de perfil (email, senha, etc.) | ✅ Funcionando |
| Detalhe de escala (3 abas) | ✅ Integrado com API |
| Sair da escala / Substituir membro | ✅ Funcionando |
| Detalhe de música (links externos) | ✅ Integrado com API |
| Detalhe de aviso | ✅ Integrado com API |
| Logout | ✅ Funcionando |

---

## Documentação adicional

- [`docs/FULLSTACK_CONTEXT.md`](docs/FULLSTACK_CONTEXT.md) — Análise completa da arquitetura
- [`docs/FRONTEND_IMPLEMENTATION_REPORT.md`](docs/FRONTEND_IMPLEMENTATION_REPORT.md) — Relatório de implementação do frontend
- [`docs/BACKEND_IMPLEMENTATION_REPORT.md`](docs/BACKEND_IMPLEMENTATION_REPORT.md) — Relatório de implementação do backend
- [`docs/FINAL_SYSTEM_AUDIT.md`](docs/FINAL_SYSTEM_AUDIT.md) — Auditoria final do sistema
