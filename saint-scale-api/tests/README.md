# Testes da saint-scale-api

> **Fase 0 — Auditoria e preparação do merge**  
> Estes testes foram criados para documentar o comportamento atual da API **antes** de qualquer migration ou implementação nova. Servem como rede de segurança de regressão.

---

## Estrutura

```
tests/
├── README.md                  ← este arquivo
├── helpers/
│   └── client.js              ← cliente HTTP compartilhado (fetch + token cache)
├── contract/
│   ├── auth.contract.test.js  ← contratos de POST /api/auth/login
│   ├── user.contract.test.js  ← contratos de GET /api/user/, /me, PATCH /api/user/*
│   ├── home.contract.test.js  ← contratos de GET /api/home/*
│   ├── alert.contract.test.js ← contratos de GET /api/alert/*
│   └── scale.contract.test.js ← contratos de GET /api/scale/*, POST /api/scale/*
└── security/
    ├── idor.test.js           ← testes de IDOR (SEC-001 a SEC-003)
    ├── data_leak.test.js      ← testes de vazamento de dados (SEC-004 a SEC-008)
    └── auth_bypass.test.js    ← testes de bypass de autenticação (SEC-009 a SEC-011)
```

---

## Como executar

### Pré-requisitos

1. Servidor `saint-scale-api` rodando:
   ```
   npm run dev
   ```
2. Banco PostgreSQL com o schema de `src/db/tcc.sql` aplicado (`npm run migrate`).
3. Node.js 18 ou mais recente (usa `node:test` nativo).

### Executar todos os testes

```
node --test tests/**/*.test.js
```

### Executar por categoria

```
# Apenas contratos de rotas
node --test tests/contract/*.test.js

# Apenas testes de segurança
node --test tests/security/*.test.js

# Um arquivo específico
node --test tests/contract/auth.contract.test.js
```

---

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `BASE` | `http://localhost:3000` | URL base da API |
| `TEST_EMAIL` | `joao@example.com` | Email do usuário de teste (seed do tcc.sql) |
| `TEST_PASSWORD` | (definir) | Senha do usuário de teste |

> **Atenção:** Os testes de segurança esperarão **falhar intencionalmente** nas verificações que documentam vulnerabilidades conhecidas. Isso é correto — os testes marcam as vulnerabilidades como `SEC-XXX` e usam `assert.fail()` com mensagem descritiva para registrar o estado atual. Quando as vulnerabilidades forem corrigidas, os testes devem ser invertidos.

---

## Convenção de nomenclatura de testes

- `[CONTRATO]` — teste de contrato: verifica shape e status HTTP esperados
- `[SEGURANÇA][SEC-XXX]` — teste de segurança referenciado pelo ID da vulnerabilidade
- `[REGRESSÃO]` — teste que verifica que uma correção permanece ativa

---

## Estado atual (Fase 0)

Os testes de contrato devem **passar** com a API atual.  
Os testes de segurança documentam vulnerabilidades que **existem** e devem **falhar** até serem corrigidos nas Fases 2 e 3.

> **Não executar migrations antes de rodar os testes de contrato.**  
> Os testes de contrato foram escritos para o schema atual (sem `igrejas`, sem `status`, sem `usuario`).
