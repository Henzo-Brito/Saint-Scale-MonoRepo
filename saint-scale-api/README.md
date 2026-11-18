# SaintScale API

## Pré-requisitos

- Node.js instalado
- PostgreSQL local em execução (container `saintscale-postgres` na porta 5432)
- Banco de dados `saintscale_dev` já criado e preparado (migrations aplicadas)
- Arquivo `.env` configurado a partir de `.env.example` (não comite este arquivo)

## Instalação

```
npm install . --force
```

## Configuração de ambiente

Copie `.env.example` para `.env` e ajuste os valores:

- `DATABASE_URL`: deve apontar exclusivamente para o PostgreSQL local `saintscale_dev` (localhost:5432).
- `PORT`: porta da API (padrão 3000).
- `JWT_SECRET`: segredo para assinatura de tokens JWT (não expor).
- `CORS_ORIGIN`: origem permitida para CORS.
- `NODE_ENV`: ambiente de execução (`development` | `production` | `test`).

**Atenção:** nunca utilize a URL do banco de produção (Render) durante o desenvolvimento ou testes locais. Use sempre o banco local `saintscale_dev`.

## Execução local

```
npm run dev
```

A API estará disponível em:

```
http://localhost:3000
```

Documentação interativa (Scalar):

```
http://localhost:3000/Scalar
```

## Verificação de tipos

```
npm run typecheck
```

Executa `tsc --noEmit` e deve finalizar com exit code 0.

## Testes

Os testes em `tests/` (contratos e segurança) exigem:

1. API em execução (`npm run dev`).
2. Banco de dados `saintscale_dev` preparado com o schema aplicado.
3. Credenciais de teste definidas nas variáveis `TEST_EMAIL` e `TEST_password`.

**Atenção:** os testes podem criar registros no banco local `saintscale_dev` (ex.: `POST /api/user/` cria membros de teste). Alguns testes de segurança podem falhar intencionalmente, pois documentam vulnerabilidades conhecidas (`SEC-XXX`) que serão corrigidas em fases futuras.

Execute com:

```
node --test tests/**/*.test.js
```

Nunca execute os testes contra o banco de produção (Render). Use exclusivamente o banco local `saintscale_dev`.
