# API_ROUTE_INVENTORY.md

> **Versão:** 1.2  
> **Data:** 2026-10-25  
> **Fonte de dados:** Análise direta de `saint-scale-api/src/routes/**` e especificação OpenAPI gerada em `/doc`  
> **Status:** Documento consolidado com as rotas efetivamente implementadas no backend `saint-scale-api/`  
> **Aviso:** Não executar mudanças sem autorização explícita

---

## Legenda

| Símbolo | Significado |
|---|---|
| ✅ | Rota implementada e registrada no backend |
| ⚠️ | Rota implementada com pendências documentadas (isolamento, validação) |
| ❌ | Rota do legado `entrega/` não implementada (não existe no destino) |
| 🔒 | Rota protegida por autenticação JWT Bearer |
| 🌐 | Rota pública (sem autenticação) |

---

## Parte 1 — API `entrega/` (legado, não implementada)

As rotas abaixo pertenciam ao legado `entrega/server.js` (Express, cookie-session, MySQL) e **não existem** no backend `saint-scale-api/`. Não foram reimplementadas.

| Rota | Status | Motivo |
|---|---|---|
| `POST /api/cadastro` | ❌ | Substituída por `POST /api/user/` (JWT, argon2id) |
| `POST /api/cadastro-igreja` | ❌ | Desativada — não há fluxo público de criação de igrejas |
| `POST /api/login` | ❌ | Substituída por `POST /api/auth/login` (JWT, apenas email) |
| `POST /api/sair` | ❌ | JWT não requer logout server-side |
| `POST /api/recuperar/pedir` | ❌ | Substituída por `POST /api/user/request-password-reset` |
| `POST /api/recuperar/trocar` | ❌ | Substituída por `PATCH /api/user/forgotPassword` |
| `GET /api/dados` | ❌ | Não implementada |
| `POST /api/escolher-ministerio` | ❌ | Implementada como `POST /api/admin/escolher-ministerio` |
| `POST /api/equipes/:id/membros` | ❌ | Implementada como `POST /api/admin/equipes/{id}/membros` |
| `DELETE /api/equipes/:id/membros/:membro` | ❌ | Implementada como `DELETE /api/admin/equipes/{id}/membros/{membro}` |
| `POST /api/ministerios/:id/membros` | ❌ | Implementada como `POST /api/admin/ministerios/{id}/membros` |
| `DELETE /api/ministerios/:id/membros/:membro` | ❌ | Implementada como `DELETE /api/admin/ministerios/{id}/membros/{membro}` |
| `POST /api/:lista` (CRUD genérico) | ❌ | Implementada como `POST /api/admin/{lista}` |
| `PUT /api/:lista/:id` | ❌ | Implementada como `PUT /api/admin/{lista}/{id}` |
| `DELETE /api/:lista/:id` | ❌ | Implementada como `DELETE /api/admin/{lista}/{id}` |

#### `/cadastro-igreja.html` e `/cadastro-igreja`

- **Status:** ❌ Desativada — retorna `404` com corpo `{ erro: "Cadastro de igreja desativado." }`
- **Motivo:** O SaintScale utiliza uma única igreja padrão definida pelo backend. Não há fluxo público de criação de igrejas.
- **Pasta `ENTREGA/`:** preservada, não alterada.

---

## Parte 2 — API `saint-scale-api/` (implementada)

Base URL: `http://localhost:3000/api`  
Autenticação: JWT Bearer (`Authorization: Bearer <token>`)  
Banco: PostgreSQL porta 5432, banco `saintscale_dev`  
OpenAPI: gerado automaticamente em `/doc` (Zod-OpenAPI) e UI em `/scalar`

---

### 2.1 Auth (`/api/auth`)

| Rota | Método | Auth | Status | Descrição |
|---|---|---|---|---|
| `/api/auth/login` | POST | 🌐 | ✅ | Login com email + senha, retorna JWT `{ accessToken, tokenType: "Bearer" }` |

Arquivos: `src/routes/auth/auth.route.ts`, `auth.handler.ts`, `auth.service.ts`, `auth.dao.ts`

---

### 2.2 User (`/api/user`)

| Rota | Método | Auth | Status | Descrição |
|---|---|---|---|---|
| `/api/user/` | POST | 🌐 | ✅ | Cadastro público de membro (`codigoEntrada` opcional, igreja definida pelo backend) |
| `/api/user/` | GET | 🔒 | ✅ | Lista membros da igreja autenticada |
| `/api/user/me` | GET | 🔒 | ✅ | Perfil do membro autenticado (via `payload.sub`) |
| `/api/user/request-password-reset` | POST | 🌐 | ✅ | Solicita token de recuperação de senha por email |
| `/api/user/forgotPassword` | PATCH | 🌐 | ✅ | Redefine senha com email + token + nova senha |
| `/api/user/alterEmail` | PATCH | 🔒 | ✅ | Atualiza email do membro autenticado |
| `/api/user/alterLogradouro` | PATCH | 🔒 | ✅ | Atualiza endereço (rua + número) |
| `/api/user/alterBirthday` | PATCH | 🔒 | ✅ | Atualiza data de nascimento |
| `/api/user/alterTelephone` | PATCH | 🔒 | ✅ | Atualiza telefone |

Arquivos: `src/routes/user/user.route.ts`, `user.handler.ts`, `user.dao.ts`, `user.index.ts`

---

### 2.3 Home (`/api/home`)

| Rota | Método | Auth | Status | Descrição |
|---|---|---|---|---|
| `/api/home/month/{mes}` | GET | 🔒 | ✅ | Escalas do mês |
| `/api/home/unavailability/{mes}` | GET | 🔒 | ✅ | Membros indisponíveis no mês |
| `/api/home/scale/me` | GET | 🔒 | ✅ | Escalas do membro autenticado |
| `/api/home/scale/day/{day}` | GET | 🔒 | ✅ | Escalas de um dia específico (DDMMYYYY) |

Arquivos: `src/routes/home/home.route.ts`

---

### 2.4 Alert (`/api/alert`)

| Rota | Método | Auth | Status | Descrição |
|---|---|---|---|---|
| `/api/alert/reminder` | GET | 🔒 | ✅ | Alertas (todos da igreja) + notificações (do membro) |
| `/api/alert/reminder/{id_reminder}` | GET | 🔒 | ✅ | Detalhe de um lembrete |

Arquivos: `src/routes/alert/alert.route.ts`, `alert.handler.ts`, `alert.dao.ts`, `alert.index.ts`

---

### 2.5 Scale (`/api/scale`, `/api/music`)

| Rota | Método | Auth | Status | Descrição |
|---|---|---|---|---|
| `/api/scale/{id}` | GET | 🔒 | ✅ | Detalhes de uma escala |
| `/api/scale/{id}/musics` | GET | 🔒 | ✅ | Músicas de uma escala |
| `/api/scale/{id}/music/{id_music_escalas}` | GET | 🔒 | ✅ | Detalhe de uma música na escala |
| `/api/scale/{id}/info` | GET | 🔒 | ✅ | Informações detalhadas de uma escala |
| `/api/scale/{id}/members` | GET | 🔒 | ✅ | Membros de uma escala |
| `/api/scale/sair` | POST | 🔒 | ✅ | Marca membro como indisponível na escala |
| `/api/scale/substituir` | POST | 🔒 | ✅ | Substitui membro em uma escala |
| `/api/music/{id_music_escalas}` | GET | 🔒 | ✅ | Detalhe de música pelo ID da associação |

Arquivos: `src/routes/scale/scale.route.ts`, `scale.handler.ts`, `scale.dao.ts`, `scale.index.ts`

---

### 2.6 Admin (`/api/admin`)

| Rota | Método | Auth | Status | Descrição |
|---|---|---|---|---|
| `/api/admin/dados` | GET | 🔒 | ✅ | Dashboard da igreja |
| `/api/admin/escolher-ministerio` | POST | 🔒 | ✅ | Seleciona ministério ativo |
| `/api/admin/{lista}` | GET | 🔒 | ✅ | Lista itens genérica (cargos, ministerios, equipes, locais, musicas, escalas, membros) |
| `/api/admin/{lista}` | POST | 🔒 | ✅ | Cria item genérico |
| `/api/admin/{lista}/{id}` | PUT | 🔒 | ✅ | Atualiza item genérico |
| `/api/admin/{lista}/{id}` | DELETE | 🔒 | ✅ | Exclui item genérico |
| `/api/admin/equipes/{id}/membros` | POST | 🔒 | ✅ | Adiciona membro à equipe |
| `/api/admin/equipes/{id}/membros` | GET | 🔒 | ✅ | Lista membros da equipe |
| `/api/admin/equipes/{id}/membros/{membro}` | DELETE | 🔒 | ✅ | Remove membro da equipe |
| `/api/admin/ministerios/{id}/membros` | POST | 🔒 | ✅ | Adiciona membro ao ministério |
| `/api/admin/ministerios/{id}/membros` | GET | 🔒 | ✅ | Lista membros do ministério |
| `/api/admin/ministerios/{id}/membros/{membro}` | DELETE | 🔒 | ✅ | Remove membro do ministério |
| `/api/admin/escalas/{id}/membros` | GET | 🔒 | ✅ | Lista membros da escala |
| `/api/admin/escalas/{id}/membros` | POST | 🔒 | ✅ | Adiciona membro à escala |
| `/api/admin/escalas/{id}/membros/{membro}` | DELETE | 🔒 | ✅ | Remove membro da escala |
| `/api/admin/escalas/funcoes` | GET | 🔒 | ✅ | Lista funções ministeriais disponíveis |
| `/api/admin/escalas/{id}/membros/{membro}/funcao` | PATCH | 🔒 | ✅ | Atribui/altera/remove função ministerial |
| `/api/admin/escalas/{id}/musicas` | GET | 🔒 | ✅ | Lista músicas da escala |
| `/api/admin/escalas/{id}/musicas` | POST | 🔒 | ✅ | Adiciona música à escala |
| `/api/admin/escalas/{id}/musicas/{id_musica_escala}` | DELETE | 🔒 | ✅ | Remove música da escala |
| `/api/admin/lembretes` | GET | 🔒 | ✅ | Lista lembretes (avisos) da igreja |
| `/api/admin/lembretes` | POST | 🔒 | ✅ | Cria lembrete (com vínculos a funções) |
| `/api/admin/lembretes/{id}` | PUT | 🔒 | ✅ | Edita lembrete (atualiza vínculos a funções) |
| `/api/admin/lembretes/{id}` | DELETE | 🔒 | ✅ | Remove lembrete |

Arquivos: `src/routes/admin/admin.route.ts`, `admin.handler.ts`, `admin.dao.ts`, `admin.index.ts`, `schemas/admin.schemas.ts`

---

## Parte 3 — Páginas administrativas (servidas em `/admin/*`)

| Página | Caminho | Status | Descrição |
|---|---|---|---|
| Dashboard | `/admin/dashboard.html` | ✅ | Servida |
| Membros | `/admin/membros.html` | ✅ | Servida |
| Ministérios | `/admin/ministerios.html` | ✅ | Servida |
| Equipes | `/admin/equipes.html` | ✅ | Servida |
| Locais | `/admin/locais.html` | ✅ | Servida |
| Músicas | `/admin/musicas.html` | ✅ | Servida |
| Escalas | `/admin/escalas.html` | ✅ | Servida |
| Lembretes/Avisos | `/admin/lembretes.html` | ✅ | Servida (adicionada no Prompt 22/29) |
| CSS | `/admin/css/style.css` | ✅ | Servida |
| JS | `/admin/js/app.js` | ✅ | Servida |

Arquivo de configuração: `src/app.ts` (array `adminPages`)

---

## Parte 4 — Arquivos estáticos do frontend (ENTREGA/public/)

Servidos em `http://localhost:3000/` via `serveStatic`. Arquivos `.sql` e `.env` são bloqueados (403).

---

## Parte 5 — Decisões de segurança documentadas

| ID | Rota | Tipo | Decisão |
|---|---|---|---|
| SEC-001 | `GET /api/scale/{id}` | IDOR | Pendente (D9) — verificar pertencimento à igreja |
| SEC-002 | `GET /api/alert/reminder/{id_reminder}` | IDOR | Pendente (D9) |
| SEC-003 | `POST /api/scale/substituir` | IDOR | Pendente (D9) |
| SEC-004 | `GET /api/home/month/{mes}` | Vazamento | Pendente (C3) — filtrar por igreja |
| SEC-005 | `GET /api/home/unavailability/{mes}` | Vazamento | Pendente (C3) |
| SEC-006 | `GET /api/home/scale/day/{day}` | Vazamento | Pendente (C3) |
| SEC-007 | `GET /api/alert/reminder` | Vazamento | Pendente (C3) — lembretes não filtrados por igreja |
| SEC-008 | `GET /api/user/` | Vazamento | Pendente (C3) — lista membros sem filtro de igreja |
| SEC-009 | `PATCH /api/user/forgotPassword` | Auth bypass | Pendente (D3) — deve exigir token válido |
| SEC-010 | `POST /api/auth/login` | Auth bypass | Pendente (C5) — não verifica status do membro |
| SEC-011 | `POST /api/user/` | Cadastro | ✅ Corrigido — `codigoEntrada` validado quando informado |

---

*Documento gerado em 2026-10-25. Atualizar quando novas rotas forem implementadas.*
