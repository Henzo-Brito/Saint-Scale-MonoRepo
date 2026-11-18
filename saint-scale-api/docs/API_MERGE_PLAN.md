# API_MERGE_PLAN.md

> **Versão:** 1.7  
> **Data:** 2026-10-18  
> **Status:** Fase 1 — migrations 001–004 aplicadas em `saintscale_dev`; Fase 0 alinhada com evidências reais; migration 005 criada e aguardando autorização para execução  
> **Escopo:** Consolidação de `entrega/` → `saint-scale-api/`

---

## 1. Visão geral

O objetivo é unir as funcionalidades das duas APIs em `saint-scale-api/`, sem perda de rota, regra de negócio, validação, middleware ou integração. O projeto `saint-scale-api/` é o destino definitivo; `entrega/` é somente fonte de leitura durante todo o processo.

### APIs analisadas

| Projeto | Stack | Banco | Auth | Arquivo principal |
|---|---|---|---|---|
| `entrega/` | Node.js + Express 5 (CJS) | MySQL/MariaDB 3307 | Session cookie | `server.js` (monolito) |
| `saint-scale-api/` | Node.js + Hono + TypeScript | PostgreSQL 5432 | JWT Bearer | `src/index.ts` |

---

## 2. Decisões arquiteturais aprovadas

### C1 — Separação semântica de `cargos` vs. `funcoes`

**Problema:** Ambas as APIs possuem uma tabela chamada `funcoes`, mas com semânticas radicalmente diferentes.

- **Entrega/`funcoes`** = cargos administrativos (Administrador, Líder, Membro) com coluna `permissoes` para controle de acesso ao painel.
- **Scale/`funcoes`** = papéis musicais/instrumentos (guitarrista, baterista, vocalista etc.) sem controle de acesso.

**Decisão aprovada:**
- A tabela de cargos administrativos será chamada `cargos` no schema consolidado.
- A tabela de papéis musicais manterá o nome `funcoes`.
- Todas as FKs, queries, schemas Zod e rotas que hoje referenciam `funcoes` com semântica administrativa passarão a referenciar `cargos`.

**Impacto imediato:**
- Schema do banco: renomear/criar `cargos` com colunas `id_cargo`, `nome`, `permissoes`, `id_igreja_fk`.
- `membros.cargo` (VARCHAR) se torna `membros.id_cargo_fk` (FK → `cargos`).
- `membros_escalas.id_funcao_fk` permanece como FK → `funcoes` (instrumento musical).
- `lembrete_funcoes.id_funcao_fk` permanece como FK → `funcoes` (instrumento musical).

---

### C2 — Hashing de senhas: Argon2id + fallback bcrypt

**Decisão aprovada:**
- Novas senhas: Argon2id via `argon2` (`argon2id`, salt automático).
- Autenticação com hash bcrypt existente: verificar com `bcryptjs`, e se válido, regravar com Argon2id na mesma requisição de login.
- Nunca converter hashes sem a senha original em texto claro.
- `bcrypt` e `bcryptjs` permanecem como dependências até confirmação de que não há mais hashes bcrypt em produção.

**Identificação dos hashes existentes:**
- Hashes bcrypt começam com `$2a$`, `$2b$` ou `$2y$`.
- Hashes Argon2id começam com `$argon2id$`.
- O campo `membros.senha` deve ser consultado durante a migração para mapear a distribuição atual.

**Fluxo de login com migração transparente:**
```
1. Recebe email/username + senha
2. Busca membro no banco
3. Detecta o prefixo do hash:
   - $2b$ / $2a$ / $2y$ → verifica com bcrypt
     → Se válido: regrava com argon2id, retorna token/sessão
     → Se inválido: retorna 401
   - $argon2id$ → verifica com argon2
     → resultado direto
4. Verifica status (pendente/bloqueado) após validação da senha
5. Gera JWT ou cria sessão
```

**Arquivos afetados:**
- `src/routes/auth/auth.service.ts` — adicionar lógica de detecção e reescrita
- `src/routes/auth/auth.dao.ts` — adicionar `updatePasswordHash(id, hash)`
- `src/routes/user/user.dao.ts` — `createUser` já usa argon2id (correto)
- `src/routes/user/user.dao.ts` — `forgotPassword` já usa argon2id (correto)

---

### C3 — Isolamento multi-tenant por igreja

**Problema:** Todas as queries da Scale (`escalas`, `musicas`, `membros`, `lembretes`, `equipes` etc.) ignoram `id_igreja_fk`. Um usuário autenticado poderia acessar dados de outra igreja manipulando IDs.

**Decisão aprovada:**
- A `id_igreja` do usuário autenticado é extraída do JWT/sessão — nunca do corpo da requisição ou de parâmetros de URL.
- Todas as queries de dados pertencentes a igrejas incluirão filtro `WHERE ... AND id_igreja_fk = $id_igreja_autenticada`.
- O middleware de auth passará `igreja_id` via `c.set('jwtPayload', ...)` ou variável equivalente.
- Registros sem `id_igreja_fk` devem ser inventariados antes de qualquer migração.

**Tabelas que exigem isolamento no banco consolidado:**
`ministerios`, `equipes`, `membros`, `escalas`, `musicas`, `logradouro`, `cargos`, `lembretes`, `notificacoes`, `avisos`

**Rotas que precisam de filtro de isolamento (Scale atual — sem filtro):**
Todas as rotas de `home`, `alert`, `scale`, e `user/` (exceto cadastro público).
Ver inventário completo em `API_ROUTE_INVENTORY.md`.

---

### C4 — Dual auth: Session cookie (web) + JWT Bearer (mobile)

**Decisão aprovada:**
- Uma única API suporta ambos os mecanismos.
- O middleware de autenticação detecta automaticamente: se `Authorization: Bearer` presente → valida JWT; se cookie de sessão presente → valida sessão.
- A lógica de verificação de status (`pendente/bloqueado`) e permissões é compartilhada entre os dois fluxos.

**Configurações de cookie (produção):**
- `HttpOnly: true` — inacessível via JavaScript
- `Secure: true` — apenas HTTPS
- `SameSite: Lax` — proteção CSRF adequada para SPAs same-origin
- `Path: /api` — escopo restrito

**Proteção CSRF:**
- Para requisições com cookie, adicionar verificação de header `X-Requested-With` ou token CSRF duplo-submit.
- Requisições JWT não precisam de proteção CSRF (não usam cookie automaticamente).

**Arquivos a criar/modificar:**
- `src/middlewares/auth.middleware.ts` — estender para dual auth
- `src/middlewares/session.middleware.ts` — novo, configuração do express-session ou equivalente Hono
- `src/routes/auth/auth.handler.ts` — dois handlers: `loginJwt` e `loginSession`
- `src/routes/auth/auth.route.ts` — manter `/login` (JWT) + adicionar `/login/session`

**Nota:** Hono não tem suporte nativo a sessões no `@hono/node-server`. Será necessário usar `hono/cookie` + store externo (memória para dev, banco/Redis para prod) ou integrar `express-session` via middleware compatível.

---

### C5 — Status do membro: `pendente`, `aprovado`, `bloqueado`

**Decisão aprovada:**
- Adicionar coluna `status ENUM('pendente', 'aprovado', 'bloqueado') DEFAULT 'pendente'` na tabela `membros` do banco consolidado.
- Novos cadastros nascem como `pendente` — exceto o admin criador da igreja, que nasce `aprovado`.
- O middleware de auth verifica o status **a cada requisição** — não apenas no login.
- Uma conta `bloqueado` invalida imediatamente qualquer sessão ou JWT em uso.

**Para JWT (stateless):** O status deve ser verificado contra o banco a cada requisição protegida (não apenas no login), pois o token não pode ser revogado. O middleware buscará `SELECT status FROM membros WHERE id_membro = $sub`.

**Para sessão:** A verificação já ocorre na Entrega (`req.session.destroy()` se status != `aprovado`). O mesmo padrão deve ser replicado.

**Migração de dados existentes:**
- Membros da Scale atual: não possuem campo `status`. Todos os registros existentes serão migrados como `aprovado` (pois foram cadastrados diretamente via API sem fluxo de aprovação).
- Registrar essa decisão como `MIGRATION-001`.

---

### D1 — Login por username

**Decisão aprovada:**
- Manter coluna `usuario VARCHAR(30) UNIQUE` na tabela `membros`.
- O campo `login` aceita email ou username (validar no handler qual formato foi enviado).
- Regras da Entrega: `^[a-z0-9._-]{3,30}$` — manter essa regex de validação.
- Se não fornecido no cadastro, gerar automaticamente a partir do email (parte antes do `@`), com sufixo numérico para evitar colisão.

**Schema de login:**
```typescript
// Adicionar ao SignInSchema
loginSchema = z.object({
  login: z.string().min(3).max(255), // email ou username
  password: z.string().min(8).max(255),
})
```

---

### D2 — Dashboard dual: `GET /api/dados` + rotas granulares

**Decisão aprovada:**
- Manter `GET /api/dados` para o frontend HTML, com autenticação por sessão.
- Manter todas as rotas granulares da Scale para o mobile, com autenticação JWT.
- Ambas devem consumir **serviços compartilhados** — a lógica de negócio não será duplicada.
- Ambas devem respeitar `id_igreja` do usuário autenticado.

**Estratégia de implementação:**
- Criar camada de serviço em `src/services/` com funções puras (sem dependência de framework).
- Handlers da Scale chamam os serviços diretamente.
- Handler de `/api/dados` agrega chamadas aos mesmos serviços.

---

### D3 — Recuperação de senha com token persistido

**Decisão aprovada:**
- Substituir o `Map` em memória por tabela `password_reset_tokens` no banco.
- Campos: `id`, `id_membro_fk`, `token_hash` (hash do token, nunca o token em claro), `expires_at`, `used_at`, `created_at`.
- Token: 32 bytes aleatórios (`crypto.randomBytes(32)`), exibido ao cliente em base64url uma única vez.
- Expiração: 10 minutos (configurável via variável de ambiente).
- Uso único: marcar `used_at` na verificação; rejeitar tokens já usados.
- Não logar o token em nenhuma circunstância.
- Envio por email: fora do escopo desta fase — o endpoint retornará `{ ok: true }` sem revelar o token (que será implementado via integração de email futuramente).

**Rotas:**
- `POST /api/auth/recuperar/pedir` — cria token, retorna `{ ok: true }`
- `POST /api/auth/recuperar/trocar` — valida token, atualiza senha

---

### D4 — Cadastro de igreja em transação

**Decisão aprovada:**
- Preservar `POST /api/cadastro-igreja` → migrar para `POST /api/auth/cadastro-igreja` ou `POST /api/church`.
- A transação deve criar: (1) igreja, (2) cargos padrão (`Administrador`, `Líder de ministério`, `Membro`), (3) conta do admin com status `aprovado`.
- Usar `BEGIN/COMMIT/ROLLBACK` explícito com `pool.connect()` no PostgreSQL.
- Validar unicidade de email antes de iniciar a transação.
- O admin criador recebe JWT ou sessão imediatamente após a criação (já logado).

---

### D5 — Local da escala: FK para tabela `logradouro`

**Decisão aprovada:**
- Modelo canônico: tabela `logradouro` com FK `id_local_fk` em `escalas`.
- O campo `escalas.local` (VARCHAR livre da Scale) deve ser migrado: valores existentes viram registros em `logradouro` com `nome = local` e campos de endereço como `NULL`.
- Respostas HTTP: manter um campo `local` (string) nas respostas, resolvido via JOIN com `logradouro.nome`.
- Inventariar todos os valores distintos de `escalas.local` antes da migration.

**Estratégia de migration do campo `local`:**
```sql
-- 1. Criar registros em logradouro para valores únicos de escalas.local
INSERT INTO logradouro (nome, rua, ...)
  SELECT DISTINCT local, local, ...
  FROM escalas WHERE local IS NOT NULL;

-- 2. Atualizar FK em escalas
UPDATE escalas e
  SET id_local_fk = l.id_logradouro
  FROM logradouro l
  WHERE l.nome = e.local;

-- 3. (após validação) DROP COLUMN escalas.local
```

---

### D6 — Data/hora: `TIMESTAMPTZ`

**Decisão aprovada:**
- Tipo canônico: `TIMESTAMPTZ` (timestamp with time zone) no PostgreSQL.
- Fuso horário da aplicação: `America/Sao_Paulo` (UTC-3), explicitamente definido via `SET timezone = 'America/Sao_Paulo'` na conexão ou via configuração do pool.
- Conversão dos campos da Entrega: `DATE + CHAR(5)` → combinar como `YYYY-MM-DD HH:MM:00` + assumir fuso `America/Sao_Paulo`.
- O campo `data_hora TIMESTAMP` da Scale atual será alterado para `TIMESTAMPTZ` (sem mudança de valor, apenas de tipo).
- Contratos HTTP: manter formatos atuais (`DD/MM/YYYY`, `DD/MM/YYYY HH:MM:SS`) via adaptadores no DAO — não quebrar clientes existentes.

---

### D7 — Dependências bcrypt: manter até auditoria

**Decisão aprovada:**
- `bcrypt` e `bcryptjs` permanecem em `package.json` até confirmação de que não há mais hashes bcrypt no banco de produção.
- A remoção deve ser documentada como tarefa futura com critério explícito: "zero registros com `senha LIKE '$2%'` no banco de produção".

---

### D8 — Preservar tabelas `avisos` e `funcoes_avisos`

**Decisão aprovada:**
- Incluir `avisos` e `funcoes_avisos` no schema consolidado sem implementar rotas novas.
- Mapear as relações: `avisos` tem FK para `musicas`; `funcoes_avisos` tem FKs para `avisos` e `funcoes`.
- Não descartar sem justificativa documentada.
- Manter como estruturas de dados "reservadas" até que o produto defina o comportamento.

---

### D9 — Isolamento em todas as rotas Scale

**Decisão aprovada:**
- Nenhuma rota que retorna dados de uma igreja pode operar sem filtro `id_igreja_fk`.
- A `id_igreja` do membro autenticado deve estar disponível no contexto da request (JWT payload ou sessão), não recebida como parâmetro do cliente.
- Rotas de leitura: `WHERE tabela.id_igreja_fk = $igreja_do_token`.
- Rotas que recebem IDs na URL (ex.: `GET /scale/{id}`): verificar que o recurso pertence à mesma igreja antes de retornar.

---

### D10 — Frontend estático: planejar servir de `saint-scale-api/`

**Decisão aprovada:**
- Planejar como Hono servirá os arquivos de `entrega/public/` sem modificá-los ou movê-los.
- Estratégia: middleware `serveStatic` do `@hono/node-server` apontando para o path absoluto de `entrega/public/`.
- Os paths de assets (`/estilo.css`, `/painel.js` etc.) e de navegação (`/entrar.html`) devem ser preservados.
- Quando `entrega/public/` for copiada para dentro de `saint-scale-api/public/`, documentar a operação e garantir que os originais em `entrega/` permaneçam intactos.

---

## 3. Fases de implementação

### Fase 0 — Preparação (pré-condição para todas as demais)
> Sem alterar comportamento. Apenas infraestrutura e testes de segurança.  
> **Concluída em 2026-10-18 (sessão 5 de auditoria), com pendências operacionais mapeadas para a Fase 2.**

- [x] Criar suite de testes de contrato para todas as rotas existentes da Scale  
  → `tests/contract/`: `auth.contract.test.js`, `user.contract.test.js`, `home.contract.test.js`, `alert.contract.test.js`, `scale.contract.test.js` — 5 arquivos criados em 2026-10-18
- [x] Criar testes de segurança  
  → `tests/security/`: `idor.test.js` (SEC-001–SEC-008), `data_leak.test.js`, `auth_bypass.test.js` — 3 arquivos criados em 2026-10-18
- [x] Auditoria completa do código-fonte  
  → `auth.dao.ts`, `auth.service.ts`, `user.dao.ts`, `scale.dao.ts`, `home.dao.ts`, `alert.dao.ts`, `auth.middleware.ts` — todos lidos e verificados
- [x] Confirmação de INS-CODE-01 a INS-CODE-06 via leitura direta do código  
  → Ver API_MERGE_STATUS.md §"Log de inspeções"
- [x] Confirmação de INS-FRONT-01 a INS-FRONT-03 via leitura de `painel.js` e `recuperar-senha.html`
- [x] Confirmação de INS-DB-04 parcial: Scale usa `CHAR(8)`, Entrega usa `CHAR(6)` — ver CONFLITO-003
- [x] Verificação de dependências: `bcryptjs` **ausente** do `package.json`; `bcrypt` presente mas sem imports; `argon2` em uso ativo (instalação de `bcryptjs` alocada para o início da Fase 2)
- [x] Typecheck: `tsc --noEmit` passa sem erros (reconfirmado com exit code 0 na retomada)
- [x] Atualização do `API_MERGE_STATUS.md` (v1.1 a v1.9) com evidências concretas de todas as verificações
- [x] Documentar valores atuais de `escalas.local` (INS-DB-01)  
  → Executado em `saintscale_dev`: 1 valor distinto (`local IS NULL`, 8 registros)
- [x] Documentar distribuição de tipos de hash em `membros.senha` (INS-DB-02)  
  → Executado em `saintscale_dev`: 3 registros, todos `$argon2id$`. Na Entrega (`banco.sql`): 8 registros com `$2b$10$` (bcrypt)
- [x] Criar branch de trabalho isolada (`feat/merge-phase1`)  
  → Criada e ativa a partir do commit `e9180b0`
- [x] Adicionar `CORS_ORIGIN` e `NODE_ENV` ao `.env.example`  
  → Variáveis e documentação incluídas em `.env.example` em 18/10/2026

**Status dos pré-requisitos pré-Fase 1:**
1. Decisão P1 confirmada (nome da tabela `equipes_membros` — CONFLITO-001) ✅
2. Decisão P2 confirmada (colunas adicionais de `logradouros` — CONFLITO-002) ✅
3. Decisão P3 confirmada (formato de `duracao` `VARCHAR(8)` — CONFLITO-003) ✅
4. Inspeções INS-DB-01 e INS-DB-02 executadas no banco `saintscale_dev` ✅
5. Branch de trabalho isolada `feat/merge-phase1` ativa ✅
6. Autorização do usuário (P5) concedida e em andamento ✅

**Pendências residuais da Fase 0 (transição para a Fase 2):**
- Instalação de `bcryptjs` e `@types/bcryptjs` no `package.json` (necessária no início da Fase 2 para suporte a login de membros legados).
- Adição de script `"test"` no `package.json` (`node --test tests/**/*.test.js`).

### Fase 1 — Schema do banco (migrations incrementais)

**Ordem de execução obrigatória (dependências entre migrations):**

| Ordem | Migration | Reversível? |
|---|---|---|
| 1 | Criar tabela `igrejas` | Sim |
| 2 | Criar tabela `cargos` (nova, baseada em `funcoes` da Entrega) | Sim |
| 3 | Adicionar `id_igreja_fk` em `membros`, `escalas`, `equipes`, `musicas`, `logradouros`, `lembretes`, `notificacoes` | Sim (DROP COLUMN) |
| 4 | Adicionar `status ENUM` em `membros` | Sim |
| 5 | Adicionar `usuario VARCHAR(30) UNIQUE` em `membros` | Sim |
| 6 | Criar tabela `ministerios` | Sim |
| 7 | Adicionar `id_cargo_fk` em `membros` (substitui `cargo` VARCHAR) | Sim, em 2 passos |
| 8 | Adicionar `id_ministerio_fk` em `equipes` e `musicas` | Sim |
| 9 | Criar tabela `membros_ministerios` | Sim |
| 10 | Adicionar constraint `UNIQUE(id_membros_fk, id_equipes_fk)` em `equipes_membros` (P1) | Sim |
| 11 | Criar tabela `password_reset_tokens` | Sim |
| 12 | Criar tabelas `avisos` e `funcoes_avisos` | Sim |
| 13 | Alterar `escalas.data_hora` de TIMESTAMP para TIMESTAMPTZ | Atenção: requer validação de fuso |
| 14 | Adicionar `id_local_fk` em `escalas` + migrar `escalas.local` + incorporar colunas da Entrega em `logradouros` (P2) | Condicional |
| 15 | Adicionar `id_ministerio_fk` em `escalas` | Sim |
| 16 | Adicionar `descricao VARCHAR(100)` em `musicas_escalas` e converter `musicas.duracao` para `VARCHAR(8)` (P3 + CONFLITO-005) | Sim |

**Cada migration deve:**
- Ser um arquivo separado em `src/db/migrations/`
- Ter comentário de rollback
- Ser executada dentro de uma transação quando possível
- Ser testada em banco de desenvolvimento antes de qualquer outro ambiente

### Fase 2 — Autenticação

- [ ] Estender `auth.service.ts`: detecção bcrypt/argon2, reescrita transparente de hash
- [ ] Estender `auth.dao.ts`: `updatePasswordHash`, `findUserByEmailOrUsername`
- [ ] Estender middleware `auth.middleware.ts`: dual auth (JWT + cookie)
- [ ] Adicionar verificação de status do membro no middleware
- [ ] Implementar `POST /api/auth/recuperar/pedir` e `POST /api/auth/recuperar/trocar`
- [ ] Implementar `POST /api/auth/cadastro-igreja`
- [ ] Estender `POST /api/user/` para aceitar `codigoEntrada`
- [ ] Estender schema `SignInSchema` para aceitar `login` (email ou username)

### Fase 3 — Isolamento multi-tenant

- [ ] Adicionar `id_igreja` ao payload JWT e ao contexto de sessão
- [ ] Aplicar filtro de igreja em todos os DAOs da Scale
- [ ] Implementar helper `assertSameChurch(resourceIgreja, tokenIgreja)` para rotas por ID
- [ ] Auditar e corrigir: `scale.dao.ts`, `home.dao.ts`, `alert.dao.ts`, `user.dao.ts`

### Fase 4 — Rotas administrativas (da Entrega)

- [ ] Implementar CRUD para `cargos`, `ministerios`, `equipes`, `locais`, `musicas`, `escalas`, `membros`
- [ ] Implementar `POST/DELETE /api/equipes/:id/membros`
- [ ] Implementar `POST/DELETE /api/ministerios/:id/membros`
- [ ] Implementar `POST /api/escolher-ministerio`
- [ ] Implementar `GET /api/dados` (dashboard consolidado)

### Fase 5 — Frontend estático

- [ ] Configurar `serveStatic` no Hono
- [ ] Validar que todos os caminhos de assets funcionam
- [ ] Testar fluxos completos: cadastro, login, painel, recuperação de senha

### Fase 6 — Limpeza e auditoria final

- [ ] Confirmar zero hashes bcrypt no banco → remover dependências
- [ ] Remover código morto
- [ ] Audit de segurança: SQL injection, IDOR, CSRF, exposição de dados

---

## 4. Matriz de impacto completa

| ID | Decisão | Arquivos afetados | Tabelas afetadas | Rotas afetadas | Risco | Testes necessários | Ordem |
|---|---|---|---|---|---|---|---|
| C1 | Separação cargos/funcoes | `user.dao.ts`, `auth.dao.ts`, `auth.service.ts`, `user.schemas.ts`, `auth.schemas.ts`, todos os DAOs que usam `funcoes` | `funcoes` (split em `cargos` + `funcoes`), `membros`, `membros_escalas`, `lembrete_funcoes` | `POST /api/user/`, `GET /api/user/`, `GET /api/user/me`, `GET /api/scale/{id}/members`, `GET /api/alert/reminder` | **ALTO** — renomear tabela em uso; FKs em cascata | Testes de regressão de todas as rotas; verificar dados de produção | Fase 1 |
| C2 | Hash bcrypt → argon2id | `auth.service.ts`, `auth.dao.ts` | `membros.senha` | `POST /api/auth/login` | **MÉDIO** — migração silenciosa; risco de lock-out se bcrypt não detectado | Testar login com hash bcrypt; verificar reescrita; testar com hash argon2id | Fase 2 |
| C3 | Isolamento multi-tenant | `scale.dao.ts`, `home.dao.ts`, `alert.dao.ts`, `user.dao.ts`, `auth.middleware.ts` | Todas as tabelas com dados de igreja | Todas as rotas autenticadas | **ALTO** — queries sem filtro expõem dados de outras igrejas | Testar que usuário da igreja A não acessa dados da igreja B via ID manipulation | Fase 3 |
| C4 | Dual auth | `auth.middleware.ts`, `auth.handler.ts`, `auth.route.ts`, `app.ts` | `membros` (sessão), nenhuma (JWT) | Todas as rotas protegidas | **MÉDIO** — conflito de contexto entre sessão e JWT | Testar ambos os fluxos separadamente e em simultâneo | Fase 2 |
| C5 | Status do membro | `auth.middleware.ts`, `auth.service.ts`, todos os DAOs | `membros.status` | Todas as rotas protegidas | **MÉDIO** — usuários existentes sem status podem perder acesso se valor default errado | Testar: pendente→bloqueado→aprovado; login com cada status; middleware interceptando requests com token válido mas status bloqueado | Fase 1+2 |
| D1 | Login por username | `auth.service.ts`, `auth.dao.ts`, `auth.schemas.ts` | `membros.usuario` | `POST /api/auth/login` | **BAIXO** | Testar login com email; login com username; colisão de username com email | Fase 2 |
| D2 | Dashboard dual | `src/routes/dados/` (novo), todos os serviços | Nenhuma nova | `GET /api/dados` (nova) | **MÉDIO** — agregar chamadas sem overhead excessivo | Comparar resposta de `/api/dados` com chamadas granulares equivalentes | Fase 4 |
| D3 | Token persistido | `src/routes/auth/auth.dao.ts`, novo arquivo de recovery | `password_reset_tokens` (nova) | `POST /api/auth/recuperar/pedir`, `POST /api/auth/recuperar/trocar` | **MÉDIO** — race condition em tokens simultâneos | Testar expiração, uso duplo, token inválido | Fase 2 |
| D4 | Cadastro de igreja | `src/routes/auth/` | `igrejas`, `cargos`, `membros` | `POST /api/auth/cadastro-igreja` | **MÉDIO** — rollback de transação em falha parcial | Testar: transação completa; falha no meio; email duplicado | Fase 2 |
| D5 | FK local de escala | `scale.dao.ts`, `home.dao.ts`, migration script | `logradouro` (nova), `escalas.id_local_fk` | `GET /api/scale/{id}/info`, `GET /api/dados` | **MÉDIO** — valores `local` sem mapeamento ficam NULL | Inventariar todos os valores; verificar que nenhum escala perde o local | Fase 1 |
| D6 | TIMESTAMPTZ | `scale.dao.ts`, `home.dao.ts`, formatters | `escalas.data_hora` | Todas as rotas de escala e home | **MÉDIO** — shift de timezone pode alterar datas exibidas | Verificar que datas não mudam após conversão; testar em UTC e UTC-3 | Fase 1 |
| D7 | Manter bcrypt | `package.json` | — | — | **BAIXO** | — | — |
| D8 | Preservar avisos | Schema consolidado | `avisos`, `funcoes_avisos` | Nenhuma rota nova | **BAIXO** | Verificar integridade referencial após merge | Fase 1 |
| D9 | Isolamento rotas Scale | Todos os DAOs | Todas as tabelas com dados de igreja | Todas as rotas autenticadas | **ALTO** (igual C3) | IDOR tests; testes de penetração básicos | Fase 3 |
| D10 | Frontend estático | `src/app.ts`, `src/index.ts` | — | `/` (static files) | **BAIXO** — apenas path de servir arquivos | Verificar que todos os assets carregam; testar navegação completa | Fase 5 |

---

## 5. Migrations incrementais propostas

Cada migration é um arquivo TypeScript em `src/db/migrations/` com nome `NNN_descricao.ts` executado via script dedicado.

### Migration 001 — Criar tabela `igrejas`
```sql
-- UP
CREATE TABLE IF NOT EXISTS igrejas (
    id_igreja   INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    nome        VARCHAR(150) NOT NULL,
    criado_em   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ROLLBACK
-- DROP TABLE IF EXISTS igrejas;
```

### Migration 002 — Criar tabela `cargos`
```sql
-- UP
CREATE TABLE IF NOT EXISTS cargos (
    id_cargo     INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    nome         VARCHAR(150) NOT NULL,
    permissoes   VARCHAR(255),           -- vírgula separada: 'equipes,musicas,escalas,...'
    id_igreja_fk INTEGER REFERENCES igrejas(id_igreja) ON DELETE CASCADE,
    criado_em    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Cargo Administrador é global (id_igreja_fk NULL)
INSERT INTO cargos (id_cargo, nome, permissoes) VALUES
    (1, 'Administrador', 'equipes,membros,aprovar,locais,musicas,escalas,ministerios,cargos,codigo');

-- ROLLBACK
-- DROP TABLE IF EXISTS cargos;
```

### Migration 003 — Adicionar `id_igreja_fk` em tabelas de domínio
```sql
-- UP (executar em transação)
ALTER TABLE membros       ADD COLUMN IF NOT EXISTS id_igreja_fk INTEGER REFERENCES igrejas(id_igreja);
ALTER TABLE escalas       ADD COLUMN IF NOT EXISTS id_igreja_fk INTEGER REFERENCES igrejas(id_igreja);
ALTER TABLE equipes       ADD COLUMN IF NOT EXISTS id_igreja_fk INTEGER REFERENCES igrejas(id_igreja);
ALTER TABLE musicas       ADD COLUMN IF NOT EXISTS id_igreja_fk INTEGER REFERENCES igrejas(id_igreja);
ALTER TABLE logradouros   ADD COLUMN IF NOT EXISTS id_igreja_fk INTEGER REFERENCES igrejas(id_igreja);
ALTER TABLE lembretes     ADD COLUMN IF NOT EXISTS id_igreja_fk INTEGER REFERENCES igrejas(id_igreja);
ALTER TABLE notificacoes  ADD COLUMN IF NOT EXISTS id_igreja_fk INTEGER REFERENCES igrejas(id_igreja);
-- Nota: NOT NULL será adicionado após migração de dados

-- ROLLBACK
-- ALTER TABLE membros DROP COLUMN IF EXISTS id_igreja_fk; (repetir para cada tabela)
```

### Migration 004 — Adicionar `status` em `membros`

> **Nota:** A Migration 004 foi executada em `saintscale_dev` em 18/10/2026 com criação inicial e povoamento de 'aprovado' para os 3 membros preexistentes. O script físico `004_add_status_membros.sql` foi subsequentemente endurecido com verificações de consistência de metadados para evitar que eventuais reexecuções sobrescrevam membros pendentes ou bloqueados. O snippet abaixo reflete o comportamento do arquivo físico revisado:

```sql
-- UP
DO $$
DECLARE
    v_col_exists BOOLEAN;
    v_type_exists BOOLEAN;
    v_udt_name TEXT;
BEGIN
    SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_membro') INTO v_type_exists;
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'membros' AND column_name = 'status'
    ) INTO v_col_exists;

    -- Validação de consistência de estado parcial:
    IF v_col_exists THEN
        SELECT udt_name INTO v_udt_name
        FROM information_schema.columns
        WHERE table_name = 'membros' AND column_name = 'status';

        IF v_udt_name <> 'status_membro' THEN
            RAISE EXCEPTION 'Coluna membros.status ja existe mas possui tipo incompativel (udt_name: %)', v_udt_name;
        END IF;

        -- Reexecução segura: não executa UPDATE incondicional
        RAISE NOTICE 'Migration 004 ja aplicada anteriormente. Nenhuma alteracao realizada.';
        RETURN;
    END IF;

    IF NOT v_type_exists THEN
        CREATE TYPE status_membro AS ENUM ('pendente', 'aprovado', 'bloqueado');
    END IF;

    -- Criação inicial: membros preexistentes recebem 'aprovado' de forma atômica
    ALTER TABLE membros ADD COLUMN status status_membro NOT NULL DEFAULT 'aprovado';
    -- Redefinição do default para 'pendente' para cadastros futuros (STATUS-C5)
    ALTER TABLE membros ALTER COLUMN status SET DEFAULT 'pendente'::status_membro;
END$$;

-- ROLLBACK
-- 1. ALTER TABLE membros DROP COLUMN IF EXISTS status;
-- 2. DROP TYPE IF EXISTS status_membro;
```

### Migration 005 — Adicionar `usuario` em `membros`
```sql
-- UP
ALTER TABLE membros ADD COLUMN IF NOT EXISTS usuario VARCHAR(30);
ALTER TABLE membros ADD CONSTRAINT IF NOT EXISTS membros_usuario_unique UNIQUE (usuario);

-- ROLLBACK
-- ALTER TABLE membros DROP CONSTRAINT IF EXISTS membros_usuario_unique;
-- ALTER TABLE membros DROP COLUMN IF EXISTS usuario;
```

### Migration 006 — Criar tabela `ministerios`
```sql
-- UP
CREATE TABLE IF NOT EXISTS ministerios (
    id_ministerio INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    nome          VARCHAR(150) NOT NULL,
    id_igreja_fk  INTEGER NOT NULL REFERENCES igrejas(id_igreja) ON DELETE CASCADE,
    criado_em     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ROLLBACK
-- DROP TABLE IF EXISTS ministerios;
```

### Migration 007 — Adicionar `id_cargo_fk` em `membros`
```sql
-- UP (2 passos para não perder o campo VARCHAR existente)
-- Decisão C1: membros.cargo VARCHAR é substituído por id_cargo_fk → cargos.
-- A coluna VARCHAR é mantida até que todos os registros sejam mapeados e validados.
-- Dependência: Migration 002 (cargos) deve existir.
ALTER TABLE membros ADD COLUMN IF NOT EXISTS id_cargo_fk INTEGER REFERENCES cargos(id_cargo);

-- Mapear cargo VARCHAR → id_cargo (após cargos estarem populados com Administrador, Líder, Membro)
-- UPDATE membros SET id_cargo_fk = c.id_cargo
--   FROM cargos c WHERE c.nome = membros.cargo;

-- ROLLBACK
-- ALTER TABLE membros DROP COLUMN IF EXISTS id_cargo_fk;
```

### Migration 008 — Adicionar FKs de ministério em `equipes` e `musicas`
```sql
-- UP
-- Dependência: Migration 006 (ministerios) deve existir.
ALTER TABLE equipes ADD COLUMN IF NOT EXISTS id_ministerio_fk INTEGER REFERENCES ministerios(id_ministerio);
ALTER TABLE musicas ADD COLUMN IF NOT EXISTS id_ministerio_fk INTEGER REFERENCES ministerios(id_ministerio);

-- ROLLBACK
-- ALTER TABLE equipes DROP COLUMN IF EXISTS id_ministerio_fk;
-- ALTER TABLE musicas DROP COLUMN IF EXISTS id_ministerio_fk;
```

### Migration 009 — Tabela de vínculo `membros_ministerios`
```sql
-- UP
-- Dependência: Migration 006 (ministerios) deve existir.
CREATE TABLE IF NOT EXISTS membros_ministerios (
    id                INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    id_membro_fk      INTEGER NOT NULL REFERENCES membros(id_membro)             ON DELETE CASCADE,
    id_ministerio_fk  INTEGER NOT NULL REFERENCES ministerios(id_ministerio)     ON DELETE CASCADE,
    UNIQUE (id_membro_fk, id_ministerio_fk)
);

-- ROLLBACK
-- DROP TABLE IF EXISTS membros_ministerios;
```

### Migration 010 — Constraint de unicidade em `equipes_membros` (Decisão P1)
```sql
-- UP
-- DECISÃO P1: O nome canônico é equipes_membros (tabela existente da Scale).
-- Não criar tabela duplicada membros_equipes.
-- Adiciona constraint UNIQUE para garantir que um membro não seja adicionado duas vezes à mesma equipe.
ALTER TABLE equipes_membros ADD CONSTRAINT IF NOT EXISTS equipes_membros_unique UNIQUE (id_membros_fk, id_equipes_fk);

-- ROLLBACK
-- ALTER TABLE equipes_membros DROP CONSTRAINT IF EXISTS equipes_membros_unique;
```

### Migration 011 — Tabela `password_reset_tokens`
```sql
-- UP
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id           INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    id_membro_fk INTEGER NOT NULL REFERENCES membros(id_membro) ON DELETE CASCADE,
    token_hash   VARCHAR(255) NOT NULL,    -- SHA-256 do token em base64url
    expires_at   TIMESTAMPTZ NOT NULL,
    used_at      TIMESTAMPTZ,
    created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_prt_membro ON password_reset_tokens(id_membro_fk);

-- ROLLBACK
-- DROP TABLE IF EXISTS password_reset_tokens;
```

### Migration 012 — Tabelas `avisos` e `funcoes_avisos`
```sql
-- UP
CREATE TABLE IF NOT EXISTS avisos (
    id_avisos     INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    titulo        VARCHAR(100),
    descricao     VARCHAR(255),
    id_musica_fk  INTEGER REFERENCES musicas(id_musica) ON DELETE CASCADE,
    criado_em     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS funcoes_avisos (
    id             INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    id_aviso_fk    INTEGER NOT NULL REFERENCES avisos(id_avisos)  ON DELETE CASCADE,
    id_funcao_fk   INTEGER NOT NULL REFERENCES funcoes(id_funcao) ON DELETE CASCADE
);

-- ROLLBACK
-- DROP TABLE IF EXISTS funcoes_avisos;
-- DROP TABLE IF EXISTS avisos;
```

### Migration 013 — `escalas.data_hora` → `TIMESTAMPTZ`
```sql
-- UP
-- Assumindo que todos os valores são America/Sao_Paulo (UTC-3)
ALTER TABLE escalas ALTER COLUMN data_hora TYPE TIMESTAMPTZ
    USING data_hora AT TIME ZONE 'America/Sao_Paulo';

-- ROLLBACK
-- ALTER TABLE escalas ALTER COLUMN data_hora TYPE TIMESTAMP
--     USING data_hora AT TIME ZONE 'America/Sao_Paulo';
```

### Migration 014 — Incorporar colunas da Entrega em `logradouros` (P2) e FK `id_local_fk` em `escalas`
```sql
-- UP
-- DECISÃO P2: Incorporar campos úteis da Entrega na tabela logradouros existente da Scale.
-- 1. Adicionar colunas complementares em logradouros
ALTER TABLE logradouros ADD COLUMN IF NOT EXISTS nome             VARCHAR(150);
ALTER TABLE logradouros ADD COLUMN IF NOT EXISTS complemento      VARCHAR(100);
ALTER TABLE logradouros ADD COLUMN IF NOT EXISTS cidade           VARCHAR(100);
ALTER TABLE logradouros ADD COLUMN IF NOT EXISTS estado           VARCHAR(100);
ALTER TABLE logradouros ADD COLUMN IF NOT EXISTS cep              VARCHAR(10);
ALTER TABLE logradouros ADD COLUMN IF NOT EXISTS ponto_referencia VARCHAR(255);
ALTER TABLE logradouros ADD COLUMN IF NOT EXISTS status           VARCHAR(10) DEFAULT 'ATIVO';

-- 2. Alargar numero para VARCHAR para aceitar formatos como 'S/N' ou '100-A' da Entrega
ALTER TABLE logradouros ALTER COLUMN numero TYPE VARCHAR(20) USING numero::VARCHAR;

-- 3. Adicionar coluna FK em escalas
ALTER TABLE escalas ADD COLUMN IF NOT EXISTS id_local_fk INTEGER REFERENCES logradouros(id_logradouro);

-- 4. Migração de dados de escalas.local:
-- Nota INS-DB-01: No banco saintscale_dev, todos os 8 registros de escalas possuem local IS NULL.
-- Caso existam registros com texto livre em escalas.local:
INSERT INTO logradouros (nome, rua, numero)
    SELECT DISTINCT local, local, '0'
    FROM escalas
    WHERE local IS NOT NULL AND local <> ''
ON CONFLICT DO NOTHING;

UPDATE escalas e
    SET id_local_fk = l.id_logradouro
    FROM logradouros l
    WHERE l.nome = e.local AND e.local IS NOT NULL;

-- ROLLBACK
-- ALTER TABLE escalas DROP COLUMN IF EXISTS id_local_fk;
-- ALTER TABLE logradouros DROP COLUMN IF EXISTS nome, DROP COLUMN IF EXISTS complemento, ...
```

### Migration 015 — Adicionar `id_ministerio_fk` em `escalas`
```sql
-- UP
-- Dependência: Migration 006 (ministerios) deve existir.
ALTER TABLE escalas ADD COLUMN IF NOT EXISTS id_ministerio_fk INTEGER REFERENCES ministerios(id_ministerio);

-- ROLLBACK
-- ALTER TABLE escalas DROP COLUMN IF EXISTS id_ministerio_fk;
```

### Migration 016 — `musicas.duracao` para `VARCHAR(8)` (P3) e `musicas_escalas.descricao` (CONFLITO-005)
```sql
-- UP
-- DECISÃO P3: musicas.duracao passa de CHAR(8) para VARCHAR(8) removendo trailing spaces via TRIM.
-- A API representará MM:SS para durações < 1 hora com validação Zod rigorosa.
ALTER TABLE musicas ALTER COLUMN duracao TYPE VARCHAR(8) USING TRIM(duracao);

-- CONFLITO-005: Campo descricao presente na Entrega (NOT NULL), adicionado como nullable na Scale.
ALTER TABLE musicas_escalas ADD COLUMN IF NOT EXISTS descricao VARCHAR(100);

-- ROLLBACK
-- ALTER TABLE musicas_escalas DROP COLUMN IF EXISTS descricao;
-- ALTER TABLE musicas ALTER COLUMN duracao TYPE CHAR(8);
```

---

## 6. Pontos que exigem inspeção adicional

### Banco de dados
- **INS-DB-01:** Verificar todos os valores distintos de `escalas.local` antes da Migration 014. Consulta: `SELECT DISTINCT local, COUNT(*) FROM escalas GROUP BY local ORDER BY 2 DESC`
- **INS-DB-02:** Verificar distribuição de tipos de hash em `membros.senha`. Consulta: `SELECT SUBSTRING(senha, 1, 7) AS prefixo, COUNT(*) FROM membros GROUP BY 1`
- **INS-DB-03:** Identificar membros sem `id_igreja_fk` após adição da coluna (que serão NULL e precisarão de tratamento)
- **INS-DB-04:** Verificar se `musicas.duracao` usa formato `CHAR(8)` (`HH:MM:SS`) uniformemente — a Entrega usa `CHAR(6)` (`MM:SS`)

### Código
- **INS-CODE-01:** `src/routes/auth/auth.dao.ts` — query busca `cargo AS role` na tabela `membros` (coluna VARCHAR). Após migration, precisará fazer JOIN com `cargos`
- **INS-CODE-02:** `src/routes/user/user.dao.ts` — `getMe` faz JOIN com `membros_funcoes` e `equipes_membros`. Os nomes das tabelas de relacionamento diferem entre as APIs (`membros_funcoes` vs. nenhuma equivalente na Entrega; `equipes_membros` vs. `membros_equipes`). Verificar qual nome será canônico
- **INS-CODE-03:** `src/routes/scale/scale.dao.ts` — `getScaleInfo` usa `escalas.local` (VARCHAR). Após D5, precisará usar `JOIN logradouros`
- **INS-CODE-04:** `argon2` está em `dependencies` mas `bcrypt` também está. Verificar se existe algum uso de `bcrypt` (não `bcryptjs`) que não foi identificado na análise
- **INS-CODE-05:** `src/db/migrate.ts` executa o arquivo `tcc.sql` inteiro via `readFile` + `pool.query`. Esse padrão precisará ser substituído por migrations incrementais numeradas
- **INS-CODE-06:** O `createUser` em `user.dao.ts` insere `cargo = 'membro'` hardcoded. Após C1, precisará inserir `id_cargo_fk` com o cargo padrão via FK

### Frontend
- **INS-FRONT-01:** `entrega/public/contas.js` e `entrega/public/painel.js` fazem chamadas para `/api/*`. Verificar se todos os paths batem com as rotas da Entrega que serão migradas
- **INS-FRONT-02:** `entrega/public/recuperar-senha.html` depende de `POST /api/recuperar/pedir` e `POST /api/recuperar/trocar` — confirmar que os novos caminhos serão compatíveis ou se haverá redirect
- **INS-FRONT-03:** O painel usa `VERSAO_SERVIDOR = 'igrejas-4'` para detectar servidor desatualizado — esse mecanismo precisará ser preservado ou atualizado

---

## 7. Riscos e mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Lock-out de usuários com hash bcrypt não detectado | Média | Alto | Testar detecção de prefixo antes de deploy; manter fallback por 30 dias |
| Shift de timezone em escalas após TIMESTAMPTZ | Média | Alto | Executar Migration 013 somente após confirmar o fuso original dos dados |
| Perda de dados de `escalas.local` sem mapeamento | Baixa | Médio | Inventariar (INS-DB-01) antes de Migration 014 |
| IDOR em rotas Scale sem filtro de igreja | Alta (vulnerabilidade atual) | Alto | Implementar Fase 3 antes de qualquer deploy de novas funcionalidades |
| Conflito de nomes de tabelas durante merge | Média | Médio | C1 resolve; executar em branch isolada com banco de dev separado |
| Quebra de contrato HTTP com frontend HTML | Baixa | Alto | Testes de integração do frontend antes de alterar rotas existentes |
| Transação de `cadastro-igreja` parcial em PostgreSQL | Baixa | Alto | Testar rollback explícito em cenários de falha |

---

## 8. Conflitos resolvidos e decisões consolidadas (2026-10-18)

Esta seção consolida as divergências identificadas entre `tcc.sql` e `banco.sql`, com as decisões canônicas confirmadas pelo usuário.

---

### CONFLITO-001 — Nome da tabela de relacionamento equipes-membros
- **Decisão P1 (Confirmada pelo usuário em 2026-10-18):** Nome canônico é `equipes_membros`.
- **Justificativa:** Menor impacto na implementação atual da Scale (onde `user.dao.ts` já usa `equipes_membros`).
- **Comparação estrutural:**
  - Scale: `equipes_membros (id_equipes_membros PK, id_membros_fk FK, id_equipes_fk FK)` — sem constraint UNIQUE explícita.
  - Entrega: `membros_equipes (id_membro_equipe PK, ID_membro_FK FK, ID_equipe_FK FK)` com `UNIQUE (ID_membro_FK, ID_equipe_FK)`.
- **Ação na Migration 010:** Não criar tabela duplicada `membros_equipes`. Apenas adicionar `CONSTRAINT equipes_membros_unique UNIQUE (id_membros_fk, id_equipes_fk)`.

---

### CONFLITO-002 — Nome e estrutura da tabela de endereços e locais
- **Decisão P2 (Confirmada pelo usuário em 2026-10-18):** Nome canônico é `logradouros` (plural).
- **Esclarecimento da contagem de campos (11 colunas no total):**
  - O schema original de `logradouro` em `ENTREGA/public/banco.sql` contém exatamente 11 colunas:
    1. `ID_logradouro` (PK)
    2. `nome` (VARCHAR(150))
    3. `rua` (VARCHAR(500))
    4. `numero` (VARCHAR(10))
    5. `complemento` (VARCHAR(100))
    6. `cidade` (VARCHAR(100))
    7. `estado` (VARCHAR(100))
    8. `cep` (VARCHAR(10))
    9. `ponto_referencia` (VARCHAR(255))
    10. `status` (ENUM('ATIVO', 'INATIVO') DEFAULT 'ATIVO')
    11. `ID_igreja_FK` (INT NOT NULL)
  - A Scale atualmente possui: `id_logradouro`, `rua VARCHAR(255)`, `numero INTEGER`.
  - O relatório anterior mencionou 9 campos adicionais mas enumerou 7 (`nome`, `complemento`, `cidade`, `estado`, `cep`, `ponto_referencia`, `status`). Os outros 2 campos no schema da Entrega são `id_igreja_fk` (chave estrangeira do tenant) e a ampliação de formato dos campos existentes (`rua` de 255 para 500 chars e `numero` de INTEGER para VARCHAR(10) para comportar 'S/N' e complementos).
- **Ação:** Preservar todas as colunas e dados existentes. Incorporar via Migration 003 (`id_igreja_fk`) e Migration 014 (`nome`, `complemento`, `cidade`, `estado`, `cep`, `ponto_referencia`, `status`), alterando `numero` para `VARCHAR(20)`.

---

### CONFLITO-003 — Duração de músicas (`musicas.duracao`)
- **Decisão P3 (Confirmada pelo usuário em 2026-10-18):**
  - **Na API:** representação canônica `MM:SS` para durações inferiores a 1 hora.
  - **No banco:** tipo `VARCHAR(8)` (eliminando o padding com espaços em branco gerado por `CHAR(8)` no PostgreSQL).
  - **Validação:** regex Zod rigorosa `^([0-5][0-9]):([0-5][0-9])$` para < 1h. Valores ambíguos serão rejeitados sem inferência automática.
  - **Preservação de dados:** Os 8 registros do seed da Scale usam formato `MM:SS` (ex.: `'05:30'`, `'04:15'`). Serão convertidos via `TRIM(duracao)` preservando exatamente seus valores textuais. `banco.sql` da Entrega define `duracao CHAR(6)` mas todos os registros de seed são `NULL` e não são usados nas rotas de `server.js`.

---

### CONFLITO-004 — Tom das músicas (`musicas.tom`)
- **Decisão:** Manter `VARCHAR(10)` em `musicas` e `musicas_escalas`. Evita truncamento de tons enarmônicos como "Re#/Mib".

---

### CONFLITO-005 — Campo `musicas_escalas.descricao`
- **Decisão:** Adicionar `descricao VARCHAR(100)` como coluna nullable em `musicas_escalas` (Migration 016).

---

## 9. Status das decisões pré-Fase 1 (P1–P5)

| # | Decisão | Status | Resolução |
|---|---|---|---|
| **P1** | Nome da tabela equipes-membros | ✅ Confirmada | `equipes_membros` canônico; adicionar constraint UNIQUE; Migration 010 ajustada |
| **P2** | Estrutura de `logradouros` | ✅ Confirmada | `logradouros` canônico; incorporar 9 campos da Entrega; schema de 11 colunas detalhado |
| **P3** | Formato de `duracao` | ✅ Confirmada | `MM:SS` na API; `VARCHAR(8)` no banco; validação Zod rigorosa |
| **P4** | Branch de trabalho | ✅ Confirmada | Branch `feat/merge-phase1` ativa e validada a partir de `main` (`e9180b0`) |
| **P5** | Autorização da Fase 1 | ✅ Confirmada | Preparação autorizada e executada. Execução de migrations e alterações de schema **bloqueadas até autorização explícita** |

---

## 10. Histórico de revisões do plano

| Versão | Data | Alterações |
|---|---|---|
| 1.0 | 2026-10-18 | Criação inicial (sessão 1) |
| 1.1 | 2026-10-18 | Adicionadas decisões D1–D10, matriz de impacto, inspeções INS-* |
| 1.2 | 2026-10-18 | Seções 8 e 9 adicionadas com conflitos CONFLITO-001 a CONFLITO-005 e pendências P1–P5 |
| 1.3 | 2026-10-18 | Decisões P1–P5 consolidadas e aprovadas pelo usuário; revisão das Migrations 010, 014 e 016; elucidação das 11 colunas de `logradouro` e mistério dos 9 campos; resultados dos 123 testes ao vivo em `saintscale_dev` incorporados |
| 1.4 | 2026-10-18 | INC-003 corrigida: typo `id_iglesia_fk` → `id_igreja_fk` removido do corpo do documento; status do cabeçalho atualizado |
| 1.5 | 2026-10-18 | Revisão de consistência documental (sessão 9): seção 3 e seção 5 alinhadas — migration 007 passa a ser `id_cargo_fk` (C1), migration 008 passa a ser FKs de ministério em equipes/musicas, migration 009 passa a ser `membros_ministerios`, migration 010 passa a ser UNIQUE `equipes_membros` (P1), migration 015 passa a ser `id_ministerio_fk` em escalas; tabela de ordem em seção 3 corrigida (linha 10 = UNIQUE equipes_membros, não `membros_equipes`); ON DELETE documentado; status dos membros padronizado; CONFLITO-002 obsoleto removido do STATUS |
| 1.6 | 2026-10-18 | Migration 004 executada em `saintscale_dev`; snippet da migration 004 corrigido (alinhado a `status_membro`, `DEFAULT 'pendente'` e `STATUS-C5`); cabeçalho atualizado |
| 1.7 | 2026-10-18 | Alinhamento da Fase 0 com evidências da auditoria: checklists de INS-DB-01/02, branch e pré-requisitos P1–P5 marcados como concluídos; pendências residuais mapeadas (bcryptjs, script test); variáveis CORS_ORIGIN e NODE_ENV incluídas em .env.example |

---

*Aguardando autorização explícita do usuário para executar as migrations da Fase 1.*

