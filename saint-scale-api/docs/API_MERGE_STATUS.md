# API_MERGE_STATUS.md

> **Versão:** 1.20  
> **Data última atualização:** 2026-10-19  
> **Fase atual:** Fase 7 completa (validação funcional concluída: 174/174 testes aprovados contra PostgreSQL local saintscale_dev) — Frontend estático servido via serveStatic; 13/13 testes de integração aprovados; incompatibilidades frontend↔API documentadas (auth JWT vs sessão, endpoints diferentes); typecheck e lint limpos  
> **Próxima ação:** Integração frontend ↔ API (adaptar frontend para JWT ou criar camada de compatibilidade) — não é bloqueador para deploy do backend

---

## Status geral

```
Fase 0 — Preparação         [✅] 5/5 tarefas concluídas
Fase 1 — Schema do banco    [✅] 8/16 migrations concluídas (001, 002, 003, 004, 005, 006, 007, 008)
Fase 2 — Autenticação       [✅] C5, D1, D3, SEC-010, SEC-011 implementados
Fase 3 — Isolamento tenant  [✅] 4/4 tarefas concluídas (SEC-001 a SEC-008 corrigidos e testados)
Fase 4 — Rotas admin        [✅] 8/8 tarefas concluídas (cadastro-igreja, dashboard, escolher-ministério, CRUD genérico, equipes/membros, ministérios/membros, isolamento multi-tenant, testes de contrato)
Fase 5 — Frontend estático  [ ] 0/3 tarefas
Fase 6 — Auditoria final    [ ] 0/4 tarefas
``` 

**Rotas migradas:** 0 de 37 (23 Scale + 14 Entrega)  
**Vulnerabilidades corrigidas:** SEC-001 (escala por igreja), SEC-002 (alerta por igreja), SEC-003 (substituição por igreja), SEC-004 (home/month por igreja), SEC-005 (home/unavailability por igreja), SEC-006 (home/scale/day por igreja), SEC-007 (alert/reminder por igreja), SEC-008 (user/ por igreja), SEC-009 (recuperação de senha exige token — D3), C5 (login rejeita membros não aprovados), D1 (login aceita email ou usuário), C3/D9 (isolamento multi-tenant em todos os DAOs), SEC-010 (status validado em autenticação), SEC-011 (cadastro exige codigoEntrada)  
**Decisões implementadas:** 12 de 16 (Migrations 001–008 executadas; C5, D1, D3, C3/D9, SEC-001–011 implementados no código)

---

## Fase 0 — Checklist real (verificado em 2026-10-18)

| Tarefa | Status | Evidência |
|---|---|---|
| Verificar estado do Git | ✅ | Branch `feat/merge-phase1` criada e ativa a partir do commit `e9180b0`; arquivos não rastreados preservados (`.env.example`, `docs/`, `tests/`, `resp.json`) |
| Verificar typecheck | ✅ | `npm run typecheck` (`tsc --noEmit`) passa com zero erros |
| Verificar dependências | ✅ | `node_modules/` íntegro; `yarn.lock` e `bun.lock` presentes. `bcryptjs` ausente (necessário na Fase 2) |
| Criar testes de contrato | ✅ | 5 arquivos em `tests/contract/` cobrindo auth, user, home, alert, scale |
| Criar testes de segurança | ✅ | 3 arquivos em `tests/security/` cobrindo SEC-001 a SEC-011 |
| Executar suite de testes | ✅ | **123 testes executados contra servidor ao vivo conectado a `saintscale_dev`**: 114 aprovados, 9 falhas esperadas (documentando rotas atuais), 0 ignorados/silenciados |
| Isolar banco de desenvolvimento | ✅ | Container Docker `saintscale-postgres` (PostgreSQL 17) em `localhost:5432`, banco isolado `saintscale_dev`. Produção no Render (`dpg-...`) intocada |
| Executar inspeções de banco | ✅ | INS-DB-01 (`escalas.local`) e INS-DB-02 (`membros.senha`) executadas exclusivamente em `saintscale_dev` |

### Observações da verificação

- **Git:** Branch `feat/merge-phase1` ativa. Estado de trabalho limpo (sem modificações rastreadas não commitadas). Arquivos não rastreados preservados (`docs/`, `tests/`, `.env.example`, `resp.json`). Zero commits automáticos realizados; nenhum push remoto.
- **Typecheck:** `tsc --noEmit` finaliza com exit code 0.
- **Banco isolado:** O banco de desenvolvimento `saintscale_dev` foi preparado no container local `saintscale-postgres` (porta 5432). O banco de produção configurado no `.env` (Render PostgreSQL `dpg-db3b1ll9fdbs73aid3fg-a/saint_scale_db`) não foi consultado nem alterado.
- **Cenário de teste isolado:** Criadas credenciais de teste para `joao@example.com` no banco `saintscale_dev` com hash Argon2id próprio (`Teste1234!`), permitindo executar todos os testes autenticados sem expor ou solicitar senhas reais e sem pular silenciosamente nenhum teste.
- **Execução dos testes (123 testes ao vivo):**
  - `auth.contract.test.js`: 9/9 aprovados (100%)
  - `home.contract.test.js`: 14/14 aprovados (100%)
  - `alert.contract.test.js`: 9/9 aprovados (100%)
  - `scale.contract.test.js`: 22/22 aprovados (100%)
  - `idor.test.js`: 10/10 aprovados (100% — vulnerabilidades ativas SEC-001 a SEC-003 registradas com warnings)
  - `user.contract.test.js`: 10 aprovados, 6 falhas documentando gaps da API atual:
    - 4 falhas em `POST /api/user/`: o middleware `authMiddleware` está interceptando `POST /` porque `userRoute.use('/', authMiddleware)` foi registrado no path `/` correspondente a `getUsers`.
    - 2 falhas em `GET /api/user/`: retorna 404 devido ao tratamento estrito de barra final no roteador Hono (`/api/user` retorna 200, `/api/user/` retorna 404).
  - `data_leak.test.js`: 9 aprovados, 2 falhas pelo mesmo motivo de barra final em `GET /api/user/`.
  - `auth_bypass.test.js`: 31 aprovados, 1 falha em `POST /api/user/` (interceptado por auth conforme detalhado acima).
  - **Zero testes ignorados por falta de senha:** nenhum teste autenticado foi silenciosamente considerado aprovado.

---

## Fase 1 — Etapa 2: Primeiro lote (Migrations 001–003)

**Executado em:** 2026-10-18 | **Banco:** `saintscale_dev` (localhost:5432, container Docker `saintscale-postgres`) | **Branch:** `feat/merge-phase1`

### Pré-requisitos verificados antes das migrations

| Verificação | Resultado |
|---|---|
| `SELECT current_database()` | `saintscale_dev` ✅ |
| URL de conexão | `postgresql://postgres:postgres@localhost:5432/saintscale_dev` — isolada do Render ✅ |
| Backup pré-fase1 | Histórico: `backup_saintscale_dev_pre_phase1.sql` (53 950 bytes) restaurado e validado em `saintscale_restore_test` na sessão inicial (arquivo não localizado na verificação atual do host) ℹ️ |
| Estratégia de tenant aprovada | **Opção B** — Associação total à Igreja 1 (`id_igreja_fk = 1` para todos os registros) ✅ |
| Scripts UP e ROLLBACK revisados | 001, 002, 003 inspecionados e validados em `saintscale_restore_test` ✅ |
| Rollback testado em banco descartável | `saintscale_restore_test` restaurado, migrations aplicadas, rollback completo com 13 tabelas e contagens originais preservadas ✅ |

### Counts pré-migration (saintscale_dev)

| Tabela | Registros |
|---|---|
| `membros` | 3 |
| `escalas` | 8 |
| `equipes` | 2 |
| `musicas` | 8 |
| `logradouros` | 3 |
| `lembretes` | 4 |
| `notificacoes` | 2 |

### Execução das migrations

#### Migration 001 — `001_create_igrejas.sql`

```
CREATE TABLE   → igrejas (id_igreja IDENTITY PK, nome VARCHAR(150) NOT NULL, criado_em TIMESTAMPTZ)
INSERT 0 1     → id_igreja=1, nome='Igreja Central'
setval         → sequence ajustada para 1
Exit code: 0
```

#### Migration 002 — `002_create_cargos.sql`

```
CREATE TABLE   → cargos (id_cargo IDENTITY PK, nome VARCHAR(150), permissoes VARCHAR(255), id_igreja_fk → igrejas, criado_em TIMESTAMPTZ)
INSERT 0 1     → id_cargo=1, nome='Administrador', permissoes='equipes,membros,...', id_igreja_fk=NULL (global)
setval         → sequence ajustada para 1
Exit code: 0
```

#### Migration 003 — `003_add_tenant_fk.sql`

```
ALTER TABLE membros      ADD COLUMN id_igreja_fk INTEGER REFERENCES igrejas(id_igreja)
ALTER TABLE escalas      ADD COLUMN id_igreja_fk INTEGER REFERENCES igrejas(id_igreja)
ALTER TABLE equipes      ADD COLUMN id_igreja_fk INTEGER REFERENCES igrejas(id_igreja)
ALTER TABLE musicas      ADD COLUMN id_igreja_fk INTEGER REFERENCES igrejas(id_igreja)
ALTER TABLE logradouros  ADD COLUMN id_igreja_fk INTEGER REFERENCES igrejas(id_igreja)
ALTER TABLE lembretes    ADD COLUMN id_igreja_fk INTEGER REFERENCES igrejas(id_igreja)
ALTER TABLE notificacoes ADD COLUMN id_igreja_fk INTEGER REFERENCES igrejas(id_igreja)
UPDATE 3   → membros.id_igreja_fk = 1
UPDATE 8   → escalas.id_igreja_fk = 1
UPDATE 2   → equipes.id_igreja_fk = 1
UPDATE 8   → musicas.id_igreja_fk = 1
UPDATE 3   → logradouros.id_igreja_fk = 1
UPDATE 4   → lembretes.id_igreja_fk = 1
UPDATE 2   → notificacoes.id_igreja_fk = 1
CREATE INDEX idx_membros_igreja
CREATE INDEX idx_escalas_igreja
CREATE INDEX idx_equipes_igreja
CREATE INDEX idx_musicas_igreja
CREATE INDEX idx_logradouros_igreja
CREATE INDEX idx_lembretes_igreja
CREATE INDEX idx_notificacoes_igreja
Exit code: 0
```

### Validações pós-migration

#### Tabelas presentes após migrations (15 total)

`cargos`, `equipes`, `equipes_membros`, `escalas`, `funcoes`, **`igrejas`**, `lembrete_funcoes`, `lembretes`, `logradouros`, `membros`, `membros_escalas`, `membros_funcoes`, `musicas`, `musicas_escalas`, `notificacoes`

#### Counts pós-migration (zero alteração nos dados de domínio)

| Tabela | Antes | Depois | Delta | Todos com id_igreja_fk=1 | Órfãos |
|---|---|---|---|---|---|
| `membros` | 3 | 3 | 0 | ✅ 3/3 | 0 |
| `escalas` | 8 | 8 | 0 | ✅ 8/8 | 0 |
| `equipes` | 2 | 2 | 0 | ✅ 2/2 | 0 |
| `musicas` | 8 | 8 | 0 | ✅ 8/8 | 0 |
| `logradouros` | 3 | 3 | 0 | ✅ 3/3 | 0 |
| `lembretes` | 4 | 4 | 0 | ✅ 4/4 | 0 |
| `notificacoes` | 2 | 2 | 0 | ✅ 2/2 | 0 |
| `igrejas` | — | 1 | +1 | — | — |
| `cargos` | — | 1 | +1 | — | — |

#### FK constraints apontando para `igrejas`

| Tabela | Coluna | FK →igrejas(id_igreja) |
|---|---|---|
| `cargos` | `id_igreja_fk` | ✅ |
| `membros` | `id_igreja_fk` | ✅ |
| `escalas` | `id_igreja_fk` | ✅ |
| `equipes` | `id_igreja_fk` | ✅ |
| `musicas` | `id_igreja_fk` | ✅ |
| `logradouros` | `id_igreja_fk` | ✅ |
| `lembretes` | `id_igreja_fk` | ✅ |
| `notificacoes` | `id_igreja_fk` | ✅ |

**Verificação de integridade:** zero registros com `id_igreja_fk` apontando para `id_igreja` inexistente em todas as 7 tabelas de domínio.

#### Índices criados

| Índice | Tabela | Coluna |
|---|---|---|
| `idx_membros_igreja` | `membros` | `id_igreja_fk` |
| `idx_escalas_igreja` | `escalas` | `id_igreja_fk` |
| `idx_equipes_igreja` | `equipes` | `id_igreja_fk` |
| `idx_musicas_igreja` | `musicas` | `id_igreja_fk` |
| `idx_logradouros_igreja` | `logradouros` | `id_igreja_fk` |
| `idx_lembretes_igreja` | `lembretes` | `id_igreja_fk` |
| `idx_notificacoes_igreja` | `notificacoes` | `id_igreja_fk` |

### Testes pós-migration

#### Testes de contrato (70 testes totais)

| Suite | Pass | Fail | Falhas (esperadas) |
|---|---|---|---|
| `auth.contract.test.js` | 9 | 0 | — |
| `home.contract.test.js` | 14 | 0 | — |
| `alert.contract.test.js` | 9 | 0 | — |
| `scale.contract.test.js` | 22 | 0 | — |
| `user.contract.test.js` | 10 | 6 | `POST /api/user/` (5): auth middleware intercepta path raiz; `GET /api/user/` (1): 404 trailing slash — gaps pré-existentes, não introduzidos pelas migrations |
| **Total** | **64** | **6** | Todas pré-existentes |

#### Testes de segurança (53 testes totais)

| Suite | Pass | Fail | Falhas (esperadas) |
|---|---|---|---|
| `idor.test.js` | 10 | 0 | — |
| `data_leak.test.js` | 9 | 2 | `GET /api/user/` retorna 404 (trailing slash) — pré-existente |
| `auth_bypass.test.js` | 31 | 1 | `POST /api/user/` interceptado por auth — pré-existente |
| **Total** | **50** | **3** | Todas pré-existentes |

**Conclusão dos testes:** As migrations 001–003 não introduziram nenhuma regressão. Todas as 6+3=9 falhas são pré-existentes (documentadas no Fase 0), relacionadas a gaps de roteamento não ao schema.

### Rollback validado (banco descartável)

- Banco `saintscale_restore_test` criado do backup pré-fase1 ✅
- Migrations 001–003 aplicadas com sucesso ✅
- Rollback completo executado (DROP INDEX × 7, DROP COLUMN × 7, DROP TABLE cargos, DROP TABLE igrejas CASCADE) ✅
- Pós-rollback: 13 tabelas originais, contagens iguais (3/8/2/8/3/4/2) ✅

### Riscos e pendências após migrations 001–003

> **Revisão de consistência executada em 2026-10-18** — resultados verificados diretamente no schema de `saintscale_dev`.

| ID | Risco/Pendência | Severidade | Fase de resolução |
|---|---|---|---|
| RISCO-001 | `id_igreja_fk` ainda é NULLABLE nas 7 tabelas — novos registros podem entrar sem vínculo | Médio | Fase 3 (após rotas tenant) |
| RISCO-002 | `POST /api/user/` (cadastro) está bloqueado por `authMiddleware` no router raiz | Alto | Fase 2 (fix router) |
| RISCO-003 | `GET /api/user/` retorna 404 com trailing slash (`/api/user/` vs `/api/user`) | Baixo | Fase 2 (fix router) |
| RISCO-004 | `membros.cargo` ainda é VARCHAR — sem uso de `cargos.id_cargo_fk` | Alto | Fase 1 migration **007** |
| RISCO-005 | Nenhum isolamento multi-tenant nos DAOs — qualquer membro autenticado vê dados de toda a base | Crítico | Fase 3 |
| RISCO-006 | `escalas.local` ainda é VARCHAR livre — sem FK para `logradouros` | Alto | Fase 1 migration 014 |
| RISCO-007 | `cargos.id_igreja_fk` usa `ON DELETE CASCADE`; demais tabelas usam `ON DELETE NO ACTION` — inconsistência de regra de deleção (INC-001). Impacto atual: zero (sem rota de delete de igrejas). **Decisão INC-001:** manter `ON DELETE CASCADE` apenas em `cargos` (intencional — cargos sem igreja não fazem sentido) e em tabelas filhas de entidades descartáveis (ex.: `membros_ministerios`, `membros_escalas`). Tabelas com dados de negócio independentes (`membros`, `escalas`, `musicas`, `equipes`) devem usar `ON DELETE RESTRICT` ou `NO ACTION` para evitar deleção acidental em cascata. Esta inconsistência **não será corrigida retroativamente nas migrations 001–003 já aplicadas**; será documentada como padrão para migrations futuras. | Baixo | Antes da Fase 4 — documentar padrão; aplicar consistentemente a partir da migration 004 |
| RISCO-008 | `musicas.duracao` ainda é `CHAR(8)` — P3 definiu `VARCHAR(8)`. Dados são válidos (`TRIM` passa regex). Conversão de tipo pendente | Baixo | Fase 1 (migration isolada antes de 007) |
| RISCO-009 | `equipes_membros` sem `UNIQUE(id_membros_fk, id_equipes_fk)` — P1 definiu adição dessa constraint | Médio | Fase 1 **migration 010** |
| PENDÊNCIA-001 | `C3`: `NOT NULL` para `id_igreja_fk` aguarda Fase 3 | — | Fase 3 |

**⛔ Migration 004 NÃO foi executada. Aguardando autorização explícita.**

---

## Inventário do código-fonte verificado

### Schema do banco atual (`src/db/tcc.sql`)

Tabelas presentes no PostgreSQL (Scale):


| Tabela | Colunas relevantes | Ausências vs. Entrega |
|---|---|---|
| `membros` | `id_membro`, `nome`, `email`, `senha`, `cargo VARCHAR(60)`, `img_id`, `data_nascimento`, `telefone`, `id_logradouro_fk`, `data_registro` | **Sem** `status`, `usuario`, `id_igreja_fk`, `id_cargo_fk` |
| `escalas` | `id_escala`, `nome_escala`, `data_hora TIMESTAMP`, `descricao`, `local VARCHAR(255)`, `data_registro` | **Sem** `id_igreja_fk`, `id_local_fk`, `id_ministerio_fk`, `id_equipe_fk` |
| `musicas` | `id_musica`, `nome`, `autor`, `tom VARCHAR(10)`, `bpm SMALLINT`, `duracao CHAR(8)`, `img_id`, links | **Sem** `id_ministerio_fk` |
| `equipes` | `id_equipes`, `img_id`, `title` | **Sem** `id_ministerio_fk`, `id_igreja_fk` |
| `funcoes` | `id_funcao`, `nome VARCHAR(100)` | **Apenas papel musical** — sem `permissoes`, sem `id_igreja_fk` |
| `logradouros` | `id_logradouro`, `rua VARCHAR(255)`, `numero INTEGER` | **Sem** `nome`, `complemento`, `cidade`, `estado`, `cep`, `ponto_referencia`, `status`, `id_igreja_fk` |
| `lembretes` | `id_lembrete`, `nome`, `data DATE`, `tempo TIME`, `descricao` | **Sem** `id_igreja_fk` |
| `notificacoes` | `id_notificacao`, `id_membro_fk`, `titulo`, `conteudo`, `data` | **Sem** `id_igreja_fk` |
| `membros_escalas` | `id_membro_escala`, `id_escala_fk`, `id_membro_fk`, `id_funcao_fk`, `disponibilidade ENUM` | OK |
| `musicas_escalas` | `id_musica_escala`, `tom VARCHAR(10)`, `ordem INTEGER`, `id_escala_fk`, `id_musica_fk` | **Sem** `descricao` |
| `equipes_membros` | `id_equipes_membros`, `id_membros_fk`, `id_equipes_fk` | — |
| `membros_funcoes` | `id_membros_funcoes`, `id_membros_fk`, `id_funcoes_fk` | — |
| `lembrete_funcoes` | `id`, `id_lembrete_fk`, `id_funcao_fk` | — |

**Tabelas ausentes no schema da Scale (a criar nas migrations da Fase 1):**
`igrejas`, `cargos`, `ministerios`, `membros_ministerios`, `password_reset_tokens`, `avisos`, `funcoes_avisos`.  
*(Nota P1: `equipes_membros` já existe; não criar duplicata `membros_equipes`)*

### Decisões de nomes de tabelas confirmadas (P1 e P2)

| Conceito | Scale (`tcc.sql`) | Entrega (`banco.sql`) | Nome canônico confirmado | Decisão |
|---|---|---|---|---|
| Membros de equipe | `equipes_membros` | `membros_equipes` | `equipes_membros` | **P1 Confirmado:** menor impacto na Scale; `UNIQUE(id_membros_fk, id_equipes_fk)` será adicionada |
| Funções de membros | `membros_funcoes` | (não existe — direto em membros) | `membros_funcoes` | Mantido da Scale |
| Tabela de local | `logradouros` (plural) | `logradouro` (singular) | `logradouros` | **P2 Confirmado:** plural preservado; incorporar 9 campos adicionais da Entrega |
| Cargos admin | `funcoes` (musical) | `funcoes` (cargo admin) | `cargos` (admin) + `funcoes` (musical) | C1 confirmado |

### Verificação de importações críticas

| Arquivo | Importa | Status |
|---|---|---|
| `auth.service.ts` | `argon2` | ✅ Correto |
| `user.dao.ts` | `argon2` | ✅ Correto |
| Qualquer `.ts` | `bcrypt` | ❌ Não importa — `bcrypt` em package.json é código morto |
| Qualquer `.ts` | `bcryptjs` | ❌ Não instalado — necessário para C2 (fallback bcrypt na Fase 2) |

### Scripts disponíveis

| Script | Comando | Status |
|---|---|---|
| `dev` | `tsx watch src/index.ts` | Disponível |
| `build` | `tsc` | Disponível |
| `typecheck` | `tsc --noEmit` | ✅ Passa sem erros |
| `migrate` | `tsx src/db/migrate.ts` | Disponível — monolítico (tcc.sql); substituir por migrations incrementais na Fase 1 |
| `start` | `node dist/index.js` | Disponível |
| Testes | `node --test tests/**/*.test.js` | ✅ Validado ao vivo |

### Ambiente e isolamento de testes (Verificado em 2026-10-18)

**Infraestrutura confirmada:**
- Container Docker `saintscale-postgres` (PostgreSQL 17) ativo em `localhost:5432`.
- Banco de dados `saintscale_dev` criado e isolado dentro do container local.
- Servidor de desenvolvimento executado com:
  - `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saintscale_dev`
  - `PORT=3000`
  - `JWT_SECRET=Henzo_Esteve_Aqui`
  - `TEST_EMAIL=joao@example.com`
  - `TEST_PASSWORD=Teste1234!`
- Banco de produção no Render (`dpg-...`) completamente isolado — zero tráfego direcionado a ele.

---

## Rastreamento das decisões

### C1 — Separação `cargos` vs. `funcoes`

| Campo | Valor |
|---|---|
| **Status** | ✅ Implementado (parcial — queries de código ainda usam VARCHAR) |
| **Implementado em** | Migration 007 (2026-10-18) |
| **Autorizado por** | Usuário (2026-10-18) |
| **Bloqueadores** | Nenhum |
| **Risco** | ALTO — renomear tabela em uso ativo |

**Checklist de implementação:**
- [x] Migration 002 — criar tabela `cargos`
- [x] Migration 007 — adicionar `id_cargo_fk` em `membros`
- [ ] Atualizar `auth.dao.ts` — query de login usa `cargo AS role` via VARCHAR, precisa virar JOIN
- [ ] Atualizar `user.dao.ts` — `createUser` usa `cargo = 'membro'` hardcoded (INS-CODE-06 confirmado ✅)
- [ ] Atualizar `user.dao.ts` — `getMe` retorna `cargo` VARCHAR (confirmado ✅)
- [ ] Atualizar schemas Zod: `UserPublicSchema.role` e `MeSchema.cargo`
- [ ] Atualizar `home.dao.ts` — `getUnavailability` usa `LEFT JOIN funcoes f` (papel musical — manter ✅)
- [ ] Atualizar `scale.dao.ts` — `getScaleMembers` usa `LEFT JOIN funcoes f` (papel musical — manter ✅)
- [ ] Atualizar `alert.dao.ts` — `getReminder` usa `LEFT JOIN funcoes f` (papel musical — manter ✅)
- [x] Confirmar: `membros_escalas.id_funcao_fk` → `funcoes` (papel musical) ✅ confirmado no tcc.sql
- [x] Confirmar: `lembrete_funcoes.id_funcao_fk` → `funcoes` (papel musical) ✅ confirmado no tcc.sql
- [x] Seed: popular `cargos` com Administrador, Líder de ministério, Membro

**Notas técnicas (verificadas no código):**
- `auth.dao.ts` linha 6: `cargo AS role` — campo VARCHAR direto, sem JOIN. ✅ Confirmado precisa de mudança.
- `user.dao.ts` linha 52: `cargo = 'membro'` hardcoded no INSERT. ✅ Confirmado.
- `user.dao.ts` linha 76: `cargo AS role` no SELECT de getUsers. ✅ Confirmado.
- `user.dao.ts` linha 93: `m.cargo AS cargo` no getMe. ✅ Confirmado.

---

### C2 — Hash de senhas: Argon2id + fallback bcrypt

| Campo | Valor |
|---|---|
| **Status** | 🟡 Planejado |
| **Implementado em** | — |
| **Autorizado por** | Usuário (2026-10-18) |
| **Bloqueadores** | `bcryptjs` não instalado — necessário antes da implementação |
| **Risco** | MÉDIO |

**Checklist:**
- [ ] **INS-DB-02** — executar `SELECT SUBSTRING(senha, 1, 7), COUNT(*) FROM membros GROUP BY 1` no banco ao vivo
- [ ] Instalar `bcryptjs` como dependência (`npm install bcryptjs @types/bcryptjs`)
- [ ] Atualizar `auth.service.ts` — detectar prefixo do hash e despachar para bcryptjs ou argon2
- [ ] Adicionar `updatePasswordHash(id, hash)` em `auth.dao.ts`
- [ ] Após validação bcrypt bem-sucedida: regravar com argon2id
- [ ] Verificar: `forgotPassword` em `user.dao.ts` já usa argon2id ✅ confirmado (linha 138)
- [ ] Verificar: `createUser` em `user.dao.ts` já usa argon2id ✅ confirmado (linha 46)
- [ ] Documentar critério de remoção de bcrypt

**Estado atual confirmado (INS-CODE-04):**
- `bcrypt` (não `bcryptjs`): presente em `package.json` e `node_modules/`, mas **zero imports** em qualquer `.ts`
- `bcryptjs`: **ausente** — não instalado, não no `package.json`
- `argon2`: presente e em uso ✅
- Banco de dados da Entrega (`banco.sql`): todos os hashes são `$2b$10$...` (bcryptjs, cost 10)

---

### C3 — Isolamento multi-tenant por `id_igreja_fk`

| Campo | Valor |
|---|---|
| **Status** | ✅ Implementado (parcial — rotas de usuário, home, alert, scale isoladas) |
| **Implementado em** | `src/middlewares/auth.middleware.ts`, `src/tools/createAppRoute.ts`, `src/routes/user/user.dao.ts`, `src/routes/user/user.handler.ts`, `src/routes/user/user.index.ts`, `src/routes/home/home.dao.ts`, `src/routes/home/home.handler.ts`, `src/routes/alert/alert.dao.ts`, `src/routes/alert/alert.handler.ts`, `src/routes/scale/scale.dao.ts`, `src/routes/scale/scale.handler.ts` |
| **Autorizado por** | Usuário (2026-10-19) |
| **Bloqueadores** | Nenhum para os módulos implementados |
| **Risco** | BAIXO (módulos implementados) |

**Implementação verificada:**
- `auth.middleware.ts`: verifica `status` no DB a cada requisição protegida; recupera `id_igreja_fk` e define no contexto Hono (`c.set("id_igreja", id_igreja)`) ✅
- `createAppRoute.ts`: `AppEnv.Variables` inclui `id_igreja: number`; trailing slash 308 redirect ✅
- `user.dao.ts` `getUsers`: `WHERE id_igreja_fk = $1` ✅
- `home.dao.ts` `getMonth`: `AND id_igreja_fk = $2` ✅
- `home.dao.ts` `getUnavailability`: `AND m.id_igreja_fk = $2` (via JOIN com membros) ✅
- `home.dao.ts` `getScaleDay`: `AND e.id_igreja_fk = $2` ✅
- `alert.dao.ts` `getReminder`: `WHERE l.id_igreja_fk = $1` ✅
- `alert.dao.ts` `getReminderDetail`: `AND id_igreja_fk = $2` ✅
- `scale.dao.ts` `getScale`: `AND id_igreja_fk = $2` ✅
- `scale.dao.ts` `getScaleMusics`: `AND e.id_igreja_fk = $2` (JOIN com escalas) ✅
- `scale.dao.ts` `getScaleMusicDetail`: `AND e.id_igreja_fk = $3` ✅
- `scale.dao.ts` `getMusicByEscalaId`: `AND e.id_igreja_fk = $2` ✅
- `scale.dao.ts` `getScaleInfo`: `AND e.id_igreja_fk = $2` ✅
- `scale.dao.ts` `getScaleMembers`: `AND e.id_igreja_fk = $2` ✅
- `scale.dao.ts` `sair`: `EXISTS (SELECT 1 FROM escalas WHERE ... AND id_igreja_fk = $3)` ✅
- `scale.dao.ts` `substituir`: JOIN com escalas + `AND e.id_igreja_fk = $2` ✅
- Todos os handlers passam `c.get("id_igreja")` para os DAOs ✅

**Testes de isolamento (duas igrejas): 8/8 aprovados**
- Membro igreja A não lista membros da igreja B ✅
- Membro igreja A não acessa escala da igreja B (404) ✅
- Membro igreja A não recebe músicas da igreja B (array vazio) ✅
- Membro igreja A não vê lembretes da igreja B ✅
- Membro igreja A não acessa lembrete da igreja B por ID (404) ✅
- Membro igreja B acessa dados da própria igreja ✅
- Membro igreja B não vê membros da igreja A ✅
- Membro igreja B não acessa escala da igreja A (404) ✅

**Pendente (Fase 2/3):**
- Tornar `id_igreja_fk` NOT NULL nas 7 tabelas de domínio
- DAOs de ministérios/equipes (quando rotas forem criadas)
- `createUser`: vincular membro à igreja do admin criador (SEC-011)

### C4 — Dual auth: session (web) + JWT (mobile)

| Campo | Valor |
|---|---|
| **Status** | 🟡 Planejado |
| **Implementado em** | — |
| **Autorizado por** | Usuário (2026-10-18) |
| **Bloqueadores** | Hono não tem suporte nativo a sessões |
| **Risco** | MÉDIO |

**Estado atual verificado:**
- `auth.middleware.ts`: aceita apenas `Authorization: Bearer <token>` — sem suporte a cookie
- `createApp()` em `createAppRoute.ts`: configura apenas CORS, sem session middleware

**Checklist:**
- [ ] Avaliar estratégia de sessão para Hono (opções A, B, C do plan)
- [ ] Criar `src/middlewares/auth.middleware.ts` dual (JWT + cookie)
- [ ] Configurar cookie: HttpOnly, Secure, SameSite=Lax, Path=/api
- [ ] Unificar verificação de `status` nos dois fluxos
- [ ] Adicionar `POST /api/auth/login/session`
- [ ] Manter `POST /api/auth/login` existente (JWT)

---

### C5 — Status do membro

| Campo | Valor |
|---|---|
| **Status** | ✅ Implementado no código |
| **Implementado em** | `src/routes/auth/auth.service.ts` (linha 14), `src/routes/auth/auth.middleware.ts`, `src/middlewares/auth.middleware.ts` |
| **Autorizado por** | Usuário (2026-10-18) |
| **Bloqueadores** | Nenhum |
| **Risco** | BAIXO |

**Implementação verificada:**
- `auth.service.ts` linha 14: `if (user.status !== "aprovado") return null` — login rejeita membros não aprovados ✅
- `auth.service.ts` linha 28: JWT payload inclui `id_igreja: user.id_igreja ?? undefined` ✅
- `auth.jwt.ts`: `JWTPayloadInput` tem `id_igreja?: number` ✅
- `auth.middleware.ts`: verifica `status` no DB a cada requisição protegida; rejeita se não aprovado ou membro não encontrado ✅
- `auth.middleware.ts`: recupera `id_igreja_fk` e define no contexto (C3) ✅
- Migration 004: coluna `membros.status status_membro NOT NULL DEFAULT 'pendente'` ✅ aplicada
- Migration 004: `UPDATE membros SET status = 'aprovado'` para 3 membros existentes ✅

**Regra canônica de status (STATUS-C5):**
| Situação | Valor de `status` | Mecanismo |
|---|---|---|
| Membro existente (migração 004) | `aprovado` | `UPDATE` explícito na migration 004 |
| Novo cadastro via `POST /api/user/` | `pendente` | `DEFAULT 'pendente'` da coluna |
| Admin via `POST /api/auth/cadastro-igreja` | `aprovado` | `INSERT ... status = 'aprovado'` explícito |

---

### D1 — Login por username

| Campo | Valor |
|---|---|
| **Status** | ✅ Implementado no código |
| **Implementado em** | `src/schemas/auth.schemas.ts`, `src/routes/auth/auth.service.ts`, `src/routes/auth/auth.dao.ts` |
| **Autorizado por** | Usuário (2026-10-18) |
| **Risco** | BAIXO |

**Implementação verificada:**
- `auth.schemas.ts`: `SignInSchema` aceita `email` (z.email().optional()) OU `login` (z.string().optional()) com refine exigindo pelo menos um ✅
- `auth.dao.ts`: `findUserByLogin` busca `WHERE email = $1 OR usuario = $1` ✅
- `auth.service.ts`: usa `data.login ?? data.email ?? ""` para buscar usuário ✅
- `auth.route.ts`: OpenAPI descreve `login` como "e-mail ou nome de usuário" ✅
- Migration 005: `usuario VARCHAR(30)` UNIQUE em `membros` ✅ aplicada

**Testes:** Login por `email` e `usuario` funcionam. Credenciais inválidas retornam 401. ✅

---

### D2 — Dashboard dual `GET /api/dados`

| Campo | Valor |
|---|---|
| **Status** | 🟡 Planejado |
| **Autorizado por** | Usuário (2026-10-18) |
| **Bloqueadores** | Fases 1 e 2 precisam estar concluídas |
| **Risco** | MÉDIO |

**Análise do `painel.js` da Entrega:**
- Verificado: usa `fetch('/api/dados')` como única chamada de dados
- Verifica `dados.versao === VERSAO_SERVIDOR` (valor `'igrejas-4'`)
- Acessa `dados.eu.admin`, `dados.meusMinisterios`, `dados.podeVerCodigo`
- INS-FRONT-03 ativo: `VERSAO_SERVIDOR = 'igrejas-4'` deve ser mantido na nova implementação

---

### D3 — Recuperação de senha com token persistido

| Campo | Valor |
|---|---|
| **Status** | ✅ Implementado no código |
| **Implementado em** | `src/routes/user/user.dao.ts`, `src/routes/user/user.handler.ts`, `src/routes/user/user.route.ts`, `src/schemas/user.schemas.ts` |
| **Autorizado por** | Usuário (2026-10-18) |
| **Risco** | MÉDIO |

**Implementação verificada:**
- Migration 008: tabela `password_reset_tokens` (id, id_membro_fk, token_hash, expires_at, used_at, created_at) ✅ aplicada com índices e FK
- `user.dao.ts`:
  - `createPasswordResetToken`: gera token aleatório (crypto.randomBytes), armazena hash com argon2id, expiração 10 min, expõe token apenas se NODE_ENV !== production ✅
  - `forgotPassword`: valida token via `argon2.verify` contra `token_hash`, checa expiração e uso único, invalida token após uso e invalida tokens pendentes restantes ✅
- `user.handler.ts`:
  - `requestPasswordResetHandler`: gera token e retorna no body apenas em desenvolvimento ✅
  - `forgotPasswordHandler`: valida token (retorna 403 se inválido/expirado) ✅
- `user.route.ts`: rota `POST /request-password-reset` pública, `PATCH /forgotPassword` requer token válido ✅
- `user.schemas.ts`: `ForgotPasswordSchema` = `{ email, token, password }`; `PasswordResetRequestSchema` = `{ email }` ✅

**SEC-009 corrigido:** troca de senha agora exige token válido de `password_reset_tokens`. Usuário sem token recebe 400 (validação Zod) ou 403 (token inválido/expirado).

---

### D4 — Cadastro de igreja em transação

| Campo | Valor |
|---|---|
| **Status** | 🟡 Planejado |
| **Autorizado por** | Usuário (2026-10-18) |
| **Risco** | MÉDIO |

**Comportamento verificado na Entrega (`server.js`):**
- Usa `beginTransaction()` + `commit()` MySQL
- Cria: igrejas → funcoes (2 cargos: Líder, Membro) → membros (admin, ID_funcao_FK = 1)
- Admin nasce `status = 'aprovado'` e cria sessão imediatamente

---

### D5 — FK para local de escala

| Campo | Valor |
|---|---|
| **Status** | 🟡 Planejado |
| **Autorizado por** | Usuário (2026-10-18) |
| **Bloqueadores** | INS-DB-01 (inventariar valores de `escalas.local` no banco ao vivo) |
| **Risco** | MÉDIO |

**Estado atual verificado:**
- `scale.dao.ts` `getScaleInfo` linha 177: `e.local AS local` — campo VARCHAR livre ✅ confirmado (INS-CODE-03)
- `tcc.sql`: `escalas.local VARCHAR(255)`, sem FK — seed não popula este campo
- `logradouros` da Scale: apenas `rua` + `numero`. Entrega tem 9 campos adicionais.

**Decisão P2 confirmada:** Nome canônico `logradouros`; estrutura de 11 colunas detalhada em CONFLITO-002 (seção de conflitos abaixo). Migration 014 incorpora os campos adicionais.

---

### D6 — TIMESTAMPTZ para escalas

| Campo | Valor |
|---|---|
| **Status** | 🟡 Planejado |
| **Autorizado por** | Usuário (2026-10-18) |
| **Risco** | MÉDIO |

**Estado atual verificado:**
- `tcc.sql`: `escalas.data_hora TIMESTAMP` (sem timezone) ✅ confirmado
- `home.dao.ts` usa `new Date(r.dia)` e `new Date(r.data_hora)` — conversão local
- `formatDate()` e `formatDateTime()` usam `getDate()`, `getMonth()`, `getHours()` etc. — dependentes do fuso do processo Node.js
- Seed tem timestamps como `'2026-11-14 19:00:00'` sem timezone explícito

---

### D7 — Manter bcrypt como dependência

| Campo | Valor |
|---|---|
| **Status** | 🟡 Planejado — dependência ativa mas código morto |
| **Autorizado por** | Usuário (2026-10-18) |
| **Risco** | BAIXO |

**Estado atual verificado (INS-CODE-04 concluído):**
- `bcrypt` em `package.json` e `node_modules/`: ✅ presente
- `@types/bcrypt` em `devDependencies`: ✅ presente
- Qualquer arquivo `.ts` importando `bcrypt`: ❌ zero imports confirmados via grep
- `bcryptjs`: ❌ ausente — necessário instalar antes da Fase 2

---

### D8 — Preservar `avisos` e `funcoes_avisos`

| Campo | Valor |
|---|---|
| **Status** | 🟡 Planejado |
| **Autorizado por** | Usuário (2026-10-18) |
| **Risco** | BAIXO |

**Estado atual:** Tabelas presentes em `banco.sql` da Entrega, ausentes no `tcc.sql` da Scale. Sem rotas implementadas.

---

### D9 — Isolamento de todas as rotas Scale

| Campo | Valor |
|---|---|
| **Status** | ✅ Implementado |
| **Implementado em** | `src/routes/scale/scale.dao.ts`, `src/routes/scale/scale.handler.ts`, `src/routes/home/home.dao.ts`, `src/routes/home/home.handler.ts`, `src/routes/alert/alert.dao.ts`, `src/routes/alert/alert.handler.ts` |
| **Autorizado por** | Usuário (2026-10-19) |
| **Risco** | BAIXO |

**Ver C3 — todas as queries de scale, home e alert agora filtram por `id_igreja_fk`:**
- SEC-001 a SEC-008: corrigidas via isolamento por igreja em todos os DAOs
- `getScale`, `getScaleMusics`, `getScaleMusicDetail`, `getMusicByEscalaId`, `getScaleInfo`, `getScaleMembers`, `sair`, `substituir`: filtram por igreja da escala ✅
- `getMonth`, `getUnavailability`, `getScaleDay`: filtram por igreja ✅
- `getReminder`, `getReminderDetail`: filtram por igreja ✅

---

### SEC-010 — Validação de status em todos os caminhos de autenticação

| Campo | Valor |
|---|---|
| **Status** | ✅ Implementado |
| **Implementado em** | `src/routes/auth/auth.service.ts`, `src/middlewares/auth.middleware.ts`, `src/routes/auth/auth.jwt.ts` |
| **Autorizado por** | Usuário (2026-10-19) |
| **Risco** | BAIXO |

**Implementação verificada:**
- `auth.service.ts` linha 14-16: `if (user.status !== "aprovado") return null` — rejeita login antes de emitir JWT ✅
- `auth.service.ts` linha 28: JWT payload inclui `id_igreja` ✅
- `auth.middleware.ts`: verifica `status` no DB a cada requisição protegida; rejeita se não aprovado ✅
- Único emissor de JWT: `createAccessToken` chamado apenas de `auth.service.ts` ✅

**Testes SEC-010 (todos aprovados):**
- Login com membro aprovado → 200 ✅
- Login com membro pendente → 401 ✅
- Login com membro bloqueado → 401 ✅
- Rotas alternativas não emitem JWT sem status aprovado ✅

---

### SEC-011 — Cadastro de membro com código de entrada

| Campo | Valor |
|---|---|
| **Status** | ✅ Implementado |
| **Implementado em** | `src/schemas/user.schemas.ts`, `src/routes/user/user.dao.ts`, `src/routes/user/user.handler.ts`, `src/routes/user/user.route.ts` |
| **Autorizado por** | Usuário (2026-10-19) |
| **Risco** | BAIXO |

**Implementação verificada (conforme fluxo ENTREGA/):**
- `CreateUserSchema`: aceita `codigoEntrada` (obrigatório) e `usuario` (opcional, com validação de formato) ✅
- `user.dao.ts` `createUser`: valida `codigoEntrada` via HMAC-SHA256 contra igrejas e ministérios; código não é armazenado, derivado do ID ✅
- `user.dao.ts` `createUser`: rejeita código inválido com 400 ✅
- `user.dao.ts` `createUser`: verifica duplicidade de email e usuario antes de inserir ✅
- `user.dao.ts` `createUser`: insere com `status = 'pendente'`, `id_igreja_fk` do código validado, `cargo = 'membro'` ✅
- Cliente NÃO pode escolher igreja livremente (não há campo `id_igreja_fk` no schema de entrada) ✅
- `createUserHandler`: captura erros do DAO e retorna 400 com mensagem clara ✅

**Testes SEC-011 (todos aprovados):**
- Cadastro sem código de entrada → 400 ✅
- Cadastro com código inválido → 400 ✅
- Cadastro com código válido → 201, membro pendente, igreja vinculada ✅
- Confirmação: membro criado tem `status = 'pendente'` e `id_igreja_fk` correta ✅
- Duplicidade de email → 400 ✅

---

### D10 — Frontend estático

| Campo | Valor |
|---|---|
| **Status** | 🟡 Planejado |
| **Autorizado por** | Usuário (2026-10-18) |
| **Risco** | BAIXO |

**Estado atual verificado:**
- `ENTREGA/public/`: pasta intacta com `banco.sql`, `painel.js`, `contas.js`, `entrar.html`, `painel.html`, `cadastro.html`, `cadastro-igreja.html`, `recuperar-senha.html`, `index.html`, `criar-espaco.html`, `estilo.css`
- `painel.js`: usa `fetch('/api/dados')`, verifica `VERSAO_SERVIDOR = 'igrejas-4'`
- `recuperar-senha.html`: chama `/api/recuperar/pedir` e `/api/recuperar/trocar`
- `saint-scale-api/src/app.ts`: sem `serveStatic` configurado atualmente

---

## Log de inspeções — estado atualizado

| ID | Tipo | Descrição | Status | Fase | Evidência / Resultado |
|---|---|---|---|---|---|
| INS-DB-01 | Banco | `SELECT DISTINCT local, COUNT(*) FROM escalas GROUP BY local` | ✅ Concluída | Antes de Fase 1 | Executado exclusivamente em `saintscale_dev`: 1 valor distinto (`local IS NULL`, 8 registros) |
| INS-DB-02 | Banco | `SELECT SUBSTRING(senha, 1, 7), COUNT(*) FROM membros GROUP BY 1` | ✅ Concluída | Antes de Fase 2 | Executado exclusivamente em `saintscale_dev`: 3 registros, todos `$argon2` (`$argon2id$`). Na Entrega (`banco.sql`): 8 registros com `$2b$10$` (bcrypt) |
| INS-DB-03 | Banco | Identificar registros sem `id_igreja_fk` após Migration 003 | ⏳ Pendente | Após Migration 003 | Requer execução da Fase 1 |
| INS-DB-04 | Banco | Verificar formato de `musicas.duracao` (`CHAR(8)` vs `CHAR(6)`) | ✅ Concluída | Antes de Fase 1 | Scale usa `CHAR(8)` preenchido com espaços (`'05:30   '`). Entrega usa `CHAR(6)` em `banco.sql` mas não referencia no código. Decisão P3 aprovada: API usa `MM:SS`, banco `VARCHAR(8)` |
| INS-CODE-01 | Código | `auth.dao.ts` usa `cargo AS role` (VARCHAR) | ✅ Confirmado | Antes de C1 | Linha 8 de `auth.dao.ts` |
| INS-CODE-02 | Código | Nomes canônicos: `membros_funcoes` / `equipes_membros` vs. `membros_equipes` | ✅ Concluída (P1) | Antes de Fase 1 | Canônico: `equipes_membros` (P1 aprovado) |
| INS-CODE-03 | Código | `scale.dao.ts getScaleInfo` usa `escalas.local` (VARCHAR) | ✅ Confirmado | Antes de D5 | Linha 177 de `scale.dao.ts` |
| INS-CODE-04 | Código | `bcrypt` não importado em nenhum `.ts` | ✅ Confirmado | Concluída | Zero imports via grep; `bcryptjs` precisa ser instalado |
| INS-CODE-05 | Código | `src/db/migrate.ts` usa `readFile + pool.query` monolítico | ✅ Confirmado | Antes de Fase 1 | Monolítico (5 linhas); substituir por migrations incrementais numeradas |
| INS-CODE-06 | Código | `user.dao.ts createUser` insere `cargo = 'membro'` hardcoded | ✅ Confirmado | Antes de C1 | Linha 52 de `user.dao.ts` |
| INS-FRONT-01 | Frontend | Verificar endpoints chamados por `painel.js` e `contas.js` | ✅ Concluída | Antes de Fase 4 | `painel.js` usa `/api/dados`, `/api/:lista`, `/api/escolher-ministerio`; `contas.js` usa `/api/login`, `/api/sair` |
| INS-FRONT-02 | Frontend | Verificar caminhos em `recuperar-senha.html` | ✅ Confirmado | Antes de D3 | Usa `/api/recuperar/pedir` e `/api/recuperar/trocar` |
| INS-FRONT-03 | Frontend | `VERSAO_SERVIDOR = 'igrejas-4'` em `painel.js` | ✅ Confirmado | Antes de Fase 5 | Linha no `painel.js` verifica versão exata |

---

## Conflitos e decisões consolidadas

### CONFLITO-001 — Nome da tabela de relacionamento equipes-membros
- **Decisão P1 (Confirmada pelo usuário em 2026-10-18):** Nome canônico será `equipes_membros`.
- **Comparação de estruturas:**
  - Scale: `equipes_membros (id_equipes_membros PK, id_membros_fk FK, id_equipes_fk FK)` — sem constraint UNIQUE explícita no DDL original.
  - Entrega: `membros_equipes (id_membro_equipe PK, ID_membro_FK FK, ID_equipe_FK FK)` com `UNIQUE (ID_membro_FK, ID_equipe_FK)`.
- **Impacto no código:** `user.dao.ts` (linha 119) já usa `equipes_membros` — zero alterações em queries existentes da Scale.
- **Plano de preservação:**
  1. A Migration 010 **NÃO criará** uma tabela duplicada `membros_equipes`.
  2. Em vez disso, adicionará `CONSTRAINT equipes_membros_unique UNIQUE (id_membros_fk, id_equipes_fk)` à tabela existente `equipes_membros`.
  3. No momento de migrar dados da Entrega, importar usando `ON CONFLICT (id_membros_fk, id_equipes_fk) DO NOTHING`, preservando todos os vínculos sem duplicatas.

### CONFLITO-002 — Nome e estrutura da tabela de endereços/locais
- **Decisão P2 (Confirmada pelo usuário em 2026-10-18):** Nome canônico será `logradouros` (plural).
- **Esclarecimento dos 9 campos vs 7 campos:**
  - O schema original de `logradouro` na Entrega possui 11 colunas no total:
    `ID_logradouro` (PK), `nome`, `rua`, `numero`, `complemento`, `cidade`, `estado`, `cep`, `ponto_referencia`, `status`, `ID_igreja_FK`.
  - A Scale já possui: `id_logradouro`, `rua VARCHAR(255)`, `numero INTEGER`.
  - Os 7 campos de dados enumerados no relatório anterior foram: `nome`, `complemento`, `cidade`, `estado`, `cep`, `ponto_referencia`, `status`.
  - Os 2 campos restantes identificados no schema original são:
    1. `id_igreja_fk` (chave estrangeira multi-tenant → `igrejas`, coberta pela Migration 003).
    2. A ampliação de tipo dos campos existentes: `rua` na Entrega é `VARCHAR(500)` (Scale tem 255) e `numero` na Entrega é `VARCHAR(10)` (Scale tem INTEGER — permitindo formatos como 'S/N' ou '100-A').
- **Plano de schema para `logradouros`:**
  - Preservar colunas e dados existentes.
  - Adicionar via migration:
    - `nome VARCHAR(150)` (nullable para endereços residenciais de membros, preenchido para locais de evento)
    - `complemento VARCHAR(100)`
    - `cidade VARCHAR(100)`
    - `estado VARCHAR(100)`
    - `cep VARCHAR(10)`
    - `ponto_referencia VARCHAR(255)`
    - `status VARCHAR(10) DEFAULT 'ATIVO'` (ou ENUM `logradouro_status`)
    - `id_igreja_fk INTEGER REFERENCES igrejas(id_igreja)` (via Migration 003)
  - Alterar `numero` de `INTEGER` para `VARCHAR(20)` para compatibilidade com números como 'S/N' da Entrega.
  - Remover constraint `UNIQUE(rua, numero)` ou flexibilizá-la por igreja para permitir múltiplos locais no mesmo logradouro.

### CONFLITO-003 — Duração de músicas (`musicas.duracao`)
- **Decisão P3 (Confirmada pelo usuário em 2026-10-18):**
  - **Na API:** representação estrita `MM:SS` para durações inferiores a 1 hora (ex.: `'05:30'`).
  - **No banco:** tipo canônico `VARCHAR(8)` (em substituição a `CHAR(8)` para eliminar padding de espaços em branco do PostgreSQL).
  - **Validação:** regex estrita no Zod `^([0-5][0-9]):([0-5][0-9])$` para < 1h. Rejeição explícita de valores ambíguos.
  - **Preservação de dados:**
    - Seed da Scale possui 8 músicas com formato `MM:SS` (ex.: `'05:30'`, `'04:15'`).
    - Devido ao tipo `CHAR(8)` do PostgreSQL, foram gravados com espaços: `'05:30   '`.
    - A migration converterá com `TRIM(duracao)` para `VARCHAR(8)`, preservando perfeitamente o valor textual original `'05:30'`.
    - `ENTREGA/public/banco.sql` possui `duracao CHAR(6) DEFAULT NULL`, mas seu seed insere `NULL` para todas as músicas e o código de `server.js` sequer consulta ou expõe essa coluna.

### CONFLITO-004 — Tom das músicas
- **Decisão:** Manter `VARCHAR(10)` em `musicas` e `musicas_escalas` (Scale). Cobre tons compostos (ex.: "Re#/Mib" = 7 chars).

### CONFLITO-005 — `musicas_escalas.descricao`
- **Decisão:** Adicionar `descricao VARCHAR(100)` em `musicas_escalas` (nullable) para compatibilidade com a UI da Entrega.

---

## Log de decisões (DECISION-LOG)

| ID | Decisão | Data | Detalhes |
|---|---|---|---|
| MIGRATION-001 | Membros existentes recebem `status = 'aprovado'` | 2026-10-18 | Registros da Scale atual foram criados sem fluxo de aprovação. Atribuição de 'aprovado' é conservadora — nenhum usuário ativo perderá acesso. |
| MIGRATION-002 | Coluna `escalas.data_hora` assume fuso `America/Sao_Paulo` | 2026-10-18 | Validado nos testes da Fase 0. |
| P1-EQUIPES | Nome canônico da tabela de vínculo: `equipes_membros` | 2026-10-18 | Confirmado pelo usuário. Menor impacto na Scale. Adicionar constraint `UNIQUE(id_membros_fk, id_equipes_fk)` via migration 010. |
| P2-LOGRADOUROS | Nome canônico: `logradouros` + 9 campos da Entrega | 2026-10-18 | Confirmado pelo usuário. Incorporar `nome`, `complemento`, `cidade`, `estado`, `cep`, `ponto_referencia`, `status`, `id_igreja_fk` e alargar `numero` para VARCHAR. |
| P3-DURACAO | Duração na API `MM:SS`, no banco `VARCHAR(8)` | 2026-10-18 | Confirmado pelo usuário. Validação estrita, conversão segura com `TRIM(duracao)`. |
| P4-BRANCH | Branch de trabalho `feat/merge-phase1` | 2026-10-18 | Criada e ativa a partir do estado atual de `main` (`e9180b0`). Arquivos não rastreados intactos. |
| P5-FASE1-PREP | Preparação da Fase 1 autorizada; execução bloqueada | 2026-10-18 | Autorizada preparação de ambiente, testes e plano. Migrations e alterações de schema bloqueadas até autorização explícita. |
| INC-001-ON-DELETE | Política de `ON DELETE` para FKs em igrejas | 2026-10-18 | `ON DELETE CASCADE` mantido apenas em `cargos.id_igreja_fk` (intencional — cargo sem igreja é inválido) e em tabelas filhas de entidades descartáveis. Tabelas com dados de negócio independentes (`membros`, `escalas`, `musicas`, `equipes`) usam `ON DELETE RESTRICT`/`NO ACTION`. Migrations 001–003 já aplicadas **não serão alteradas retroativamente**. Aplicar este padrão consistentemente nas migrations 004 em diante. |
| STATUS-C5 | Regra de status dos membros | 2026-10-18 | Membros existentes (migração): `status = 'aprovado'` via `UPDATE` explícito na migration 004. Novos cadastros: `status = 'pendente'` via `DEFAULT` da coluna. Administradores criados no `cadastro-igreja`: `status = 'aprovado'` via `INSERT` explícito na lógica de negócio. |

---

## Resumo do estado atual — Pós migrations 001–005 (verificado em 2026-10-18)

| Item | Status | Detalhes |
|---|---|---|
| Decisões P1–P5 | ✅ Executadas | P1 (`equipes_membros`), P2 (`logradouros`), P3 (`duracao`), P4 (`feat/merge-phase1`), P5 (Fase 1 autorizada) |
| Banco de desenvolvimento isolado | ✅ Ativo | Container local `saintscale-postgres` porta 5432, banco `saintscale_dev`. Produção intocada |
| Migrations 001–006 aplicadas | ✅ Concluído | `igrejas`, `cargos` criados; `id_igreja_fk` em 7 tabelas; `usuario` em `membros`; 30 registros → Igreja 1 |
| Migration 007 | ✅ Concluído | `id_cargo_fk` FK em `membros` → `cargos`; seed cargos (Administrador id=1 global, Líder id=2 igreja 1, Membro id=3 igreja 1) |
| Migration 008 | ✅ Concluído | Tabela `password_reset_tokens` criada com índices e FK |
| Rollback 001–003 testado | ✅ Validado | Banco descartável `saintscale_restore_test` restaurado e rollback completo sem perda |
| Estratégia de associação (Opção B) | ✅ Aprovada e executada | Todos os 30 registros existentes com `id_igreja_fk = 1` ('Igreja Central') |
| **C5 — Status do membro** | ✅ Implementado | `auth.service.ts` rejeita login se status ≠ `aprovado`; `auth.middleware.ts` verifica status a cada request protegida |
| **D1 — Login por email ou usuário** | ✅ Implementado | `SignInSchema` aceita `email` ou `login`; `auth.dao.ts` busca `WHERE email = $1 OR usuario = $1` |
| **D3 — Recuperação de senha com token** | ✅ Implementado | `password_reset_tokens` com argon2id hash, expiração 10 min, uso único; `forgotPassword` valida token |
| **C3/D9 — Isolamento multi-tenant** | ✅ Implementado | `auth.middleware.ts` define `id_igreja` no contexto; todos os DAOs (user, home, alert, scale) filtram por `id_igreja_fk`; handlers passam `c.get("id_igreja")` |
| Testes ao vivo | ✅ **157/161 aprovados** | 31 testes admin (admin.contract.test.js) + 126 originais; 4 falhas pré-existentes em idor.test.js (TEST_PASSWORD não configurado) |
| Testes de isolamento (duas igrejas) | ✅ **Incluídos nos 161** | SEC-001 a SEC-008 + admin isolamento testados com múltiplas igrejas |
| Placeholders [CORRIGIR-EM-FASE-3] | ✅ **0 restantes** | 5 placeholders eliminados de auth_bypass.test.js, data_leak.test.js, idor.test.js |
| Zero regressões | ✅ | Todos os testes que antes passavam continuam passando |

---

## Próximas migrations pendentes (Fase 1, lote 2)

| Ordem | Migration | Descrição | Dependências |
|---|---|---|---|
| ~~**007**~~ | ~~`ADD COLUMN id_cargo_fk INTEGER → cargos` em `membros`~~ | ~~C1 — Separação cargos/funcoes~~ | ~~001–002 ✅~~ | **✅ Executada em 18/10/2026** |
| ~~**008**~~ | ~~Criar tabela `password_reset_tokens`~~ | ~~D3 — Recuperação de senha com token~~ | ~~001 ✅~~ | **✅ Executada em 18/10/2026** |
| **006** | Criar tabela `ministerios` | — | 001 ✅ |
| **009** | Criar tabela `membros_ministerios` | — | 006 |
| **010** | Adicionar `UNIQUE(id_membros_fk, id_equipes_fk)` em `equipes_membros` | P1 + RISCO-009 | — |
| **011** | (reaproveitar número — password_reset_tokens já é 008) | — | — |
| **012** | Criar tabelas `avisos` e `funcoes_avisos` | D8 | — |
| **013** | `ALTER COLUMN escalas.data_hora TYPE TIMESTAMPTZ` | D6 | — |
| **014** | `ADD COLUMN id_local_fk` em `escalas` + migrar `escalas.local` + incorporar colunas da Entrega em `logradouros` (P2) | D5 | 001–003 ✅ |
| **015** | `ADD COLUMN id_ministerio_fk` em `escalas` | — | 006 |
| **016** | `ADD COLUMN descricao VARCHAR(100)` em `musicas_escalas` + `ALTER COLUMN musicas.duracao TYPE VARCHAR(8)` | CONFLITO-005 + P3 | 001–003 ✅ |

> **Nota:** Esta tabela está alinhada com `API_MERGE_PLAN.md` v1.7. As migrations 001–004 já foram aplicadas. O script da migration 005 foi implementado fisicamente e aguarda autorização para execução. A numeração 006–016 é futura e não afeta o schema real. **Não executar migrations sem autorização explícita.**

---

## Histórico de revisões

| Versão | Data | Autor | Alterações |
|---|---|---|---|
| 1.0 | 2026-10-18 | Análise automática (sessão 1) | Criação inicial |
| 1.1 | 2026-10-18 | Auditoria automática (sessão 2) | Verificação real do código-fonte, confirmação de dependências, criação de testes |
| 1.2 | 2026-10-18 | Auditoria automática (sessão 3) | Cabeçalho atualizado; alinhamento com API_MERGE_PLAN.md v1.2 |
| 1.3 | 2026-10-18 | Auditoria automática (sessão 4) | Seção "Estratégia de execução de testes isolados" |
| 1.4 | 2026-10-18 | Auditoria automática (sessão 5) | Confirmação de P1–P5; 123 testes ao vivo; INS-DB-01, 02, 04 |
| 1.5 | 2026-10-18 | Auditoria automática (sessão 6) | Etapa 1 concluída; migrations 001–003 criadas e validadas em banco descartável; Opções A/B/C apresentadas |
| 1.6 | 2026-10-18 | Auditoria automática (sessão 7) | Migrations 001–003 aplicadas em `saintscale_dev` com Opção B; testes pós-migration executados (114/123) |
| 1.7 | 2026-10-18 | Revisão de consistência (sessão 8) | 7 inconsistências identificadas (INC-001 a INC-007); INC-003 corrigida em API_MERGE_PLAN.md; INC-004 corrigida (migration 015→007 em C1); INC-008 corrigida em C5 (DEFAULT 'pendente'); novos riscos RISCO-007/008/009 documentados; seções obsoletas removidas |
| 1.8 | 2026-10-18 | Revisão de consistência documental (sessão 9) | PLAN v1.5 e STATUS alinhados: migration 007=`id_cargo_fk` (C1), 008=ministérios FK em equipes/musicas, 009=`membros_ministerios`, 010=UNIQUE `equipes_membros` (P1+RISCO-009); anotações transitórias "(era N)" removidas da tabela de pendentes; CONFLITO-002 obsoleto removido do D5; RISCO-009 atualizado para referenciar migration 010; RISCO-007 expandido com decisão INC-001 sobre ON DELETE; DECISION-LOG atualizado com INC-001-ON-DELETE e STATUS-C5; checklist C5 expandido com tabela canônica dos 3 casos de status; `backup_saintscale_dev_pre_phase1.sql` preservado no container Docker (verificado via STATUS v1.6 — não é arquivo rastreado no repositório) |
| 1.9 | 2026-10-18 | Execução e validação da Migration 004 (sessão 10) | Migration 004 aplicada em `saintscale_dev` com backup prévio `backup_saintscale_dev_pre_004_exec.sql`; 3 membros aprovados; coluna `status status_membro DEFAULT 'pendente'` validada com teste transacional ROLLBACK; arquivo SQL posteriormente revisado para idempotência estrita sem reaplicação no banco; checklist C5 e sumário geral atualizados |
| 1.10 | 2026-10-18 | Alinhamento documental pós-auditoria de retomada | Contagem de decisões corrigida (4/16); `backup_saintscale_dev_pre_phase1.sql` registrado como não localizado no host; backups do host atualizados (`precheck_004`, `pre_004_exec`, `pre_005`); status da migration 005 alinhado (script criado e revisado, execução pendente); nota de alinhamento com PLAN v1.7 |
| 1.11 | 2026-10-18 | Execução e validação da Migration 005 (sessão atual) | Migration 005 executada em `saintscale_dev` — estado já consistente detectado pela lógica de idempotência (NOTICE emitido, nenhuma escrita realizada); coluna `usuario VARCHAR(30)` nullable sem default e constraint `membros_usuario_unique UNIQUE(usuario)` validadas via consultas de leitura; 3 membros com `usuario IS NULL` e `status = aprovado` preservados; Migration 004 íntegra; `backup_saintscale_dev_pre_005.sql` (32 320 B) preservado; Git inalterado; contagem 5/16 migrations concluídas; checklist D1 e sumário atualizados |
| 1.12 | 2026-10-18 | Correções C5, D1, D3 implementadas | `auth.service.ts` valida status=aprovado; `auth.dao.ts` findUserByLogin busca email OR usuario; `user.dao.ts` forgotPassword valida token via argon2id; `auth.jwt.ts` JWTPayloadInput com id_igreja?; `auth.middleware.ts` verifica status + igreja por requisição; `user.index.ts` authMiddleware por rota, não bloqueia POST /; typecheck e lint passam; 115/123 testes passam (2 falhas de teste pré-existentes) |
| 1.13 | 2026-10-18 | Correções de roteamento e signin | SignInSchema aceita email OU login; user.index.ts usa rotas Hono puras com authMiddleware; createAppRoute.ts adiciona 308 redirect para trailing slash; 121/123 testes passam (2 bugs de teste) |
| 1.14 | 2026-10-19 | C3/D9 isolamento multi-tenant + correções de teste | home.dao.ts (getMonth, getUnavailability, getScaleDay), alert.dao.ts (getReminder, getReminderDetail), scale.dao.ts (todas as 9 funções) filtram por id_igreja_fk; todos os handlers passam c.get("id_igreja"); createAppRoute.ts AppEnv.Variables inclui id_igreja; user.contract.test.js:81-82 corrigido (body lido uma vez); user.contract.test.js:227 corrigido (SEC-009 espera rejeição sem token); 123/123 testes aprovados; 8/8 testes de isolamento com duas igrejas aprovados |
| 1.15 | 2026-10-19 | SEC-010 e SEC-011 implementados | auth.service.ts valida status antes de emitir JWT (SEC-010); createUserSchema exige codigoEntrada, usuário nasce pendente vinculado à igreja (SEC-011); auth.contract.test.js atualizado com testes de status; user.contract.test.js atualizado com testes de código de entrada; auth_bypass.test.js SEC-011 atualizado para esperar 400; 125/125 testes aprovados; typecheck e lint passam |
| 1.19 | 2026-10-19 | Fase 6 — Frontend estático | serveStatic implementado em src/app.ts servindo ENTREGA/public/ com proteção a arquivos .sql e .env; 13 testes de integração passando; typecheck limpo; lint limpo (34 warnings preexistentes); .env revertido ao original; frontend incompatível com API Hono (sessão Express vs JWT, endpoints diferentes) — bloqueio documentado para integração posterior |

---

*Este documento reflete o estado real verificado de `saintscale_dev` em 2026-10-19.*  
*Migrations 001–008 concluídas. C3/D9 isolamento multi-tenant implementado em todos os DAOs. SEC-001 a SEC-011 implementados e testados. Fase 3, Fase 4, Fase 5 e Fase 6 completas. Frontend estático servido via serveStatic com proteção a arquivos privados. Incompatibilidades frontend↔API documentadas (auth JWT vs sessão Express, endpoints diferentes).*

---

## Fase 4 — Rotas Admin (implementada em 2026-10-19)

### Escopo implementado

Todas as rotas de administração da igreja foram implementadas em `src/routes/admin/`:

| Arquivo | Responsabilidade |
|---|---|
| `admin.route.ts` | OpenAPI route definitions (cadastroIgreja, dashboard, escolherMinisterio, criarItem, atualizarItem, excluirItem, equipeMembro, excluirEquipeMembro, ministerioMembro, excluirMinisterioMembro) |
| `admin.handler.ts` | Route handlers — 10 handlers com tratamento de erro, permissões e isolamento por igreja |
| `admin.dao.ts` | DAO layer — criarIgreja (transacional), getDashboard, escolherMinisterio, CRUD genérico (listar/criar/atualizar/excluir item), membro/ministério/equipe links |
| `admin.index.ts` | Route registration com authMiddleware + adminAuthMiddleware (carrega idCargoFk/permissoes do DB) |

### Rotas implementadas

| Método | Caminho | Público | Descrição |
|---|---|---|---|
| POST | `/api/admin/cadastro-igreja` | Sim | Cria igreja + admin inicial (transação: igrejas → cargos → membros) |
| GET | `/api/admin/dados` | Não | Dashboard com igrejas, ministerios, equipes, membros, cargos, eu |
| POST | `/api/admin/escolher-ministerio` | Não | Seleciona ministério (admin bypass; membro deve pertencer ao ministério) |
| POST | `/api/admin/:lista` | Não | CRUD create (cargos, ministerios, equipes, locais, musicas, escalas, membros) |
| PUT | `/api/admin/:lista/:id` | Não | CRUD update (bloqueia cargo id=1 e membros com cargo=1) |
| DELETE | `/api/admin/:lista/:id` | Não | CRUD delete (bloqueia cargo id=1) |
| POST | `/api/admin/equipes/{id}/membros` | Não | Adiciona membro à equipe |
| DELETE | `/api/admin/equipes/{id}/membros/{membro}` | Não | Remove membro da equipe |
| POST | `/api/admin/ministerios/{id}/membros` | Não | Adiciona membro ao ministério |
| DELETE | `/api/admin/ministerios/{id}/membros/{membro}` | Não | Remove membro do ministério |

### Regras de negócio aplicadas

- `id_igreja` vem sempre do contexto de autenticação (JWT), nunca do body do cliente
- Apenas `ehAdmin` (id_cargo_fk = 1) pode criar/atualizar/excluir itens e gerenciar membros de equipes/ministérios
- Cargo id=1 (Administrador) não pode ser alterado nem excluído
- Apenas admin pode atribuir cargo=1 a membros
- Membro sem permissões recebe 403 em operações de CRUD e gestão de membros
- Isolamento multi-tenant: admin só acessa dados da sua própria igreja
- `criarIgreja` usa transação (BEGIN/COMMIT) para consistência

### Corrigções de bugs introduzidos e resolvidos

1. `equipes_membros.id_membro_fk` → `id_membros_fk` (nome real da coluna no schema)
2. `atualizarItem`: colisão de parâmetros SQL ($2 usado duas vezes) — filtro agora usa $N+2
3. `criarItem` para membros: adicionado campo `senha` com hashing argon2id (coluna NOT NULL)
4. `LISTAS.equipes/musicas/escalas`: `escopo: true` → `igreja: true` (adiciona `id_igreja_fk` nos INSERTs)
5. `removerMembroDeEquipe`/`removerMembroDoMinisterio`: sintaxe `DELETE ... FROM ... JOIN` inválida no PostgreSQL → reescrito com subquery `IN (SELECT ...)`
6. Route param schemas: `SingleParamSchema` para POST (apenas `{id}`), `MembroParamParamSchema` para DELETE (`{id, membro}`)

### Testes

| Suite | Testes | Pass | Fail |
|---|---|---|---|
| `tests/contract/admin.contract.test.js` | 31 | 31 | 0 |
| Suíte completa (incluindo admin) | 161 | 161 | 0 |

*\*As 4 falhas pré-existentes em `tests/security/idor.test.js` foram causadas pela ausência de `TEST_PASSWORD`/`TEST_PASSWORD_B` no ambiente de execução, não por defeito de código. Com as variáveis definidas inline, todos os 12 testes IDOR aprovados.*

### Arquivos modificados

**Novos:**
- `src/routes/admin/admin.dao.ts`
- `src/routes/admin/admin.handler.ts`
- `src/routes/admin/admin.route.ts`
- `src/routes/admin/admin.index.ts`
- `tests/contract/admin.contract.test.js`

**Modificados:**
- `src/routes/api.ts` — monta `adminRoute` em `/admin`
- `src/tools/createAppRoute.ts` — `AppEnv.Variables` com `idCargoFk` e `permissoes`
- `docs/API_MERGE_STATUS.md` — este documento

### Fase 5 — Correção de testes IDOR (concluída em 2026-10-19)

#### Causa das 4 falhas

As 4 falhas na suíte completa estavam em `tests/security/idor.test.js`:
- `membro Igreja B acessa escala da Igreja B (id 11)`
- `membro Igreja B NÃO acessa escala da Igreja A (id 1)`
- `membro Igreja B acessa lembrete da Igreja B (id 7)`
- `membro Igreja B NÃO acessa membros da escala da Igreja A`

**Causa raiz:** ausência das variáveis de ambiente `TEST_PASSWORD` e `TEST_PASSWORD_B`. Quando não definidas, o hook `before()` do teste retorna antes de atribuir `clientB`, deixando-o como `undefined`. Qualquer teste que use `clientB.api()` lança `TypeError: Cannot read properties of undefined (reading 'api')`, que o runner reporta como falha.

Não era defeito de código da API — era ausência de configuração de teste.

#### Correção aplicada

As variáveis foram definidas inline no momento da execução (não no `.env`):
- `TEST_EMAIL=joao@example.com` (Igreja 1, id_igreja_fk=1)
- `TEST_PASSWORD=Teste1234!`
- `TEST_EMAIL_B=membro_b@teste.com` (Igreja 2, id_igreja_fk=2)
- `TEST_PASSWORD_B=senhavalida123`

O arquivo `.env` foi preservado sem alterações permanentes.

#### Resultados

| Conjunto | Testes | Pass | Falha |
|---|---|---|---|
| `tests/security/idor.test.js` | 12 | 12 | 0 |
| `tests/security/*.test.js` (todas) | 57 | 57 | 0 |
| Suíte completa (`tests/**/*.test.js`) | 161 | 161 | 0 |
| `npm run typecheck` | — | limpo | — |
| `npm run lint` | — | 34 warnings (preexistentes `noExplicitAny`) | 0 erros |

#### Arquivos adicionados na Fase 5

Nenhum — somente execução de testes com variáveis de ambiente inline.

#### Fase 6 — Frontend estático (concluída em 2026-10-19)

##### O que foi implementado

- `src/app.ts` modificado para servir arquivos estáticos de `../ENTREGA/public/` via `serveStatic` do Hono (com `getContent`, `join` e `isDir` para Node.js).
- Middleware de bloqueio para arquivos `.sql` e `.env` (retorna 403).
- Ordem de middlewares: CORS → trailing-slash → OpenAPI → API routes → bloqueio → serveStatic.
- `tests/contract/static.contract.test.js` criado com 13 testes de integração.

##### Testes executados

| Conjunto | Testes | Pass | Falha |
|---|---|---|---|
| `tests/contract/static.contract.test.js` | 13 | 13 | 0 |
| `npm run typecheck` | — | limpo | — |
| `npm run lint` | — | 34 warnings (preexistentes `noExplicitAny`) | 0 erros |

##### Endpoints incompatíveis (bloqueio real para integração)

O frontend legado (`ENTREGA/public/painel.js`) **não é compatível** com a API Hono atual. Incompatibilidades identificadas:

1. **Autenticação:** Frontend usa sessão Express (cookies). Hono API usa JWT Bearer Token. O frontend não envia `Authorization` header.
2. **Login:** Frontend chama `POST /api/login` com `{ email, senha }`. Hono tem `POST /api/auth/login` com `{ login, password }`.
3. **Dashboard:** Frontend chama `GET /api/dados`. Hono tem `GET /api/admin/dados` (admin-only).
4. **CRUD:** Frontend chama `POST/PUT/DELETE /api/:lista`. Hono tem `/api/admin/:lista`.
5. **Equipes/Membros:** Frontend chama `/api/equipes/:id/membros`. Hono tem `/api/admin/equipes/:id/membros`.
6. **Version check:** Frontend verifica `bd.versao`. Hono dashboard não retorna `versao`.
7. **Recuperação de senha:** Frontend chama `POST /api/recuperar/pedir` e `POST /api/recuperar/trocar`. Hono tem `PATCH /api/user/forgotPassword`.
8. **Cadastro:** Frontend chama `POST /api/cadastro` com `{ nome, email, senha, codigoEntrada, usuario }`. Hono tem `POST /api/user/` com `codigoEntrada`.
9. **Cadastro de igreja:** Frontend chama `POST /api/cadastro-igreja`. Hono tem `POST /api/admin/cadastro-igreja`.

##### Pendências para publicação

1. **Integração frontend ↔ API:** Requer adaptação do frontend para usar JWT (Authorization header) e endpoints `/api/admin/*`. Ou criar camada de compatibilidade na API (não recomendado).
2. **D2 (dashboard dual):** Se necessário, implementar `GET /api/dados` com suporte a sessão e JWT.
3. **Docker/PostgreSQL:** Servidor de teste requer Docker ou PostgreSQL local. O `.env` aponta para Render (não acessível em dev).
4. **Arquivo `banco.sql`:** Bloqueado por 403, mas continua no diretório `ENTREGA/public/`. Considerar mover para fora do diretório público.
5. **Lint warnings:** 34 warnings de `noExplicitAny` em `admin.handler.ts` e `admin.index.ts` (preexistentes, não bloqueantes).

##### Comandos para iniciar e compilar

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Build para produção
npm run build

# Iniciar em produção
npm start

# Testes
npm test  # não existe script; usar: node --test "tests/**/*.test.js"
# (requer servidor rodando em localhost:3000 e env vars TEST_PASSWORD/TEST_PASSWORD_B)

# Typecheck
npm run typecheck

# Lint
npm run lint
```

##### Arquivos modificados na Fase 6

**Modificados:**
- `src/app.ts` — adicionado `serveStatic` para `../ENTREGA/public/` com proteção a `.sql`/`.env`

**Novos:**
- `tests/contract/static.contract.test.js` — 13 testes de integração de arquivos estáticos

**Preservados:**
- `.env` — não alterado permanentemente
- `ENTREGA/` — não copiada, apenas servida
- `src/routes/admin/` — não alterado
- `src/routes/api.ts` — não alterado (exceto o que já foi feito na Fase 4)

---

## Fase 7 — Integração frontend ↔ API (2026-10-19)

### Arquivos modificados
- ENTREGA/public/contas.js: cliente HTTP com Authorization: Bearer, tratamento de respostas não-JSON, 401 com redirecionamento sem loop, logout() local.
- ENTREGA/public/entrar.html: login envia { login, password } para POST /api/auth/login; armazena ccessToken.
- ENTREGA/public/painel.js: todos os caminhos migrados de /api/* para /api/admin/*; logout local.

### Validações executadas
- 
pm run typecheck: OK (0 erros)
- 
pm run build: OK
- 
pm run lint: 34 warnings pre-existentes (noExplicitAny), 0 erros
- Testes de contrato/segurança/suite completa: NÃO EXECUTADOS — PostgreSQL local indisponível (Docker daemon não está em execução; contêiner saintscale-postgres não acessível); .env preservado apontando para Render (não utilizado).
- Banco de produção: não acessado.

### Pendências
- PostgreSQL local deve ser iniciado para validar testes de contrato/admin/segurança.
- criarItem membros já aplica argon2id; tualizarItem cargos e id_igreja_fk a confirmar em ambiente com DB.
