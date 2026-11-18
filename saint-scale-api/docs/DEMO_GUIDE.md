# DEMO_GUIDE.md — Roteiro de demonstração do SaintScale

## Pré-requisitos
- Node.js instalado (versão compatível com o projeto).
- PostgreSQL local disponível (contêiner Docker `saintscale-postgres` ou instância local), banco `saintscale_dev`.
- Dependências instaladas: `npm install` (dentro de `saint-scale-api/`).

## Instalação e build
```bash
cd saint-scale-api
npm install
npm run typecheck
npm run build
```

## Configuração local segura
- O arquivo `.env` original pode apontar para o Render (produção). **Não use essa URL para testes.**
- Para testes locais, defina temporariamente (sem alterar `.env`):
  - `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saintscale_dev`
  - `PORT=3000`
  - `JWT_SECRET=<valor de teste>`
- Confirme o banco ativo com `SELECT current_database();` (deve retornar `saintscale_dev`).

## Inicialização
```bash
npm start
```
Ou, em desenvolvimento: `npm run dev`.

## Verificações já comprovadas
- Build: aprovado.
- Typecheck: aprovado.
- Lint: 34 avisos preexistentes (`noExplicitAny`), zero erros.
- Testes estáticos: 13/13 aprovados (serviço de arquivos estáticos, `/doc`, `/scalar`).

## Fluxo previsto de demonstração
1. Abrir `http://localhost:3000/entrar.html`.
2. Login com credenciais válidas via `POST /api/auth/login` (`{ login, password }`).
3. Carregar dashboard via `GET /api/admin/dados`.
4. Executar uma operação administrativa autorizada (ex.: criar/editar membro ou cargo em `/api/admin/*`).
5. Confirmar que usuário sem permissão recebe 403.
6. Logout (remoção local do token) e redirecionamento para login.
7. Tentar acessar rota protegida sem token → 401.

## Isolamento entre igrejas
- Confirmar que `id_igreja_fk` é derivado do JWT (não do cliente).
- Verificar que dados de uma igreja não aparecem para outra.

## Limitações conhecidas (não testadas de ponta a ponta)
- Testes de autenticação, operações administrativas e isolamento multi-tenant não foram executados por indisponibilidade do PostgreSQL local.
- Docker não estava em execução na última verificação.
- Criação de membros com Argon2id, atualização de cargos e associação de equipes/ministérios não foram validados funcionalmente.
- A integração frontend↔API não foi validada ponta a ponta.
- O diretório não é um repositório Git (sem histórico de versão).
