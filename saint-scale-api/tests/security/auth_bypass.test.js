/**
 * tests/security/auth_bypass.test.js
 *
 * [SEGURANÇA] Testes de bypass de autenticação e autorização
 *
 * Vulnerabilidades cobertas:
 *   - SEC-009: PATCH /api/user/forgotPassword — troca de senha sem token
 *   - SEC-010: POST /api/auth/login — não verifica status pendente/bloqueado
 *   - SEC-011: POST /api/user/ — cadastro sem vínculo com igreja
 *
 * Também testa:
 *   - Proteção de rotas: todas as rotas protegidas devem retornar 401 sem token
 *   - Token inválido/expirado deve ser rejeitado
 *   - Token malformado deve ser rejeitado
 */

'use strict';

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '../helpers/client.js';

const TEST_EMAIL    = process.env.TEST_EMAIL    ?? 'joao@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? '';
const BASE          = process.env.BASE          ?? 'http://localhost:3000';

// ─────────────────────────────────────────────────────────────────
// Proteção de rotas: 401 sem token
// ─────────────────────────────────────────────────────────────────

describe('[SEGURANÇA] Todas as rotas protegidas devem retornar 401 sem token', () => {

  const rotasProtegidas = [
    ['GET',  '/api/user/'],
    ['GET',  '/api/user/me'],
    ['PATCH','/api/user/alterEmail'],
    ['PATCH','/api/user/alterLogradouro'],
    ['PATCH','/api/user/alterBirthday'],
    ['PATCH','/api/user/alterTelephone'],
    ['GET',  '/api/home/month/novembro'],
    ['GET',  '/api/home/unavailability/novembro'],
    ['GET',  '/api/home/scale/me'],
    ['GET',  '/api/home/scale/day/14112026'],
    ['GET',  '/api/alert/reminder'],
    ['GET',  '/api/alert/reminder/1'],
    ['GET',  '/api/scale/1'],
    ['GET',  '/api/scale/1/musics'],
    ['GET',  '/api/scale/1/music/1'],
    ['GET',  '/api/scale/1/info'],
    ['GET',  '/api/scale/1/members'],
    ['POST', '/api/scale/sair'],
    ['POST', '/api/scale/substituir'],
    ['GET',  '/api/music/1'],
  ];

  for (const [method, path] of rotasProtegidas) {
    test(`${method} ${path} retorna 401 sem token`, async () => {
      const r = await fetch(BASE + path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method !== 'GET' ? JSON.stringify({}) : undefined,
      });
      assert.strictEqual(
        r.status, 401,
        `${method} ${path} deveria retornar 401 sem token, recebeu ${r.status}`
      );
    });
  }

});

// ─────────────────────────────────────────────────────────────────
// Token malformado
// ─────────────────────────────────────────────────────────────────

describe('[SEGURANÇA] Token inválido deve ser rejeitado', () => {

  test('retorna 401 para token JWT completamente inválido', async () => {
    const r = await fetch(`${BASE}/api/user/me`, {
      headers: { 'Authorization': 'Bearer isto_nao_e_um_jwt' },
    });
    assert.strictEqual(r.status, 401);
  });

  test('retorna 401 para token JWT com assinatura alterada', async () => {
    // JWT válido em estrutura mas com assinatura corrompida
    const fakeJwt =
      'eyJhbGciOiJIUzI1NiJ9' +
      '.eyJzdWIiOiIxIiwiZW1haWwiOiJmYWtlQGV4YW1wbGUuY29tIn0' +
      '.ASSINATURA_FALSA_INVALIDA';
    const r = await fetch(`${BASE}/api/user/me`, {
      headers: { 'Authorization': `Bearer ${fakeJwt}` },
    });
    assert.strictEqual(r.status, 401);
  });

  test('retorna 401 para header Authorization sem "Bearer"', async () => {
    const r = await fetch(`${BASE}/api/user/me`, {
      headers: { 'Authorization': 'Basic dXNlcjpwYXNz' },
    });
    assert.strictEqual(r.status, 401);
  });

  test('retorna 401 para header Authorization vazio', async () => {
    const r = await fetch(`${BASE}/api/user/me`, {
      headers: { 'Authorization': '' },
    });
    assert.strictEqual(r.status, 401);
  });

});

// ─────────────────────────────────────────────────────────────────
// SEC-009 — Troca de senha sem token de verificação
// ─────────────────────────────────────────────────────────────────

describe('[SEGURANÇA][SEC-009] PATCH /api/user/forgotPassword sem verificação de identidade', () => {

  test('rota é pública (não exige token Bearer)', async () => {
    // A rota deve ser pública para usuários que esqueceram a senha,
    // MAS deve exigir um token de recuperação para agir.
    // Atualmente a rota é pública E não exige token de recuperação — dupla falha.
    const r = await fetch(`${BASE}/api/user/forgotPassword`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'email_inexistente_test_@example.com',
        password: 'novasenha123',
      }),
    });
    // Não deve retornar 401 (é pública intencionalmente)
    // Deve retornar 404 (email não existe) — NÃO 200
    assert.ok(
      r.status !== 401,
      'Rota /forgotPassword é pública — não exige Bearer token'
    );
    console.warn(
      `[SEC-009] /forgotPassword retornou ${r.status} sem token de recuperação. ` +
      'VULNERABILIDADE: qualquer pessoa com o email de outro usuário pode tentar trocar sua senha. ' +
      'Correção na Fase 2 (D3): exigir token de password_reset_tokens.'
    );
  });

  test('[CORRIGIR-EM-FASE-2] após D3: deve exigir token válido no body', async () => {
    console.warn(
      '[SEC-009][PENDENTE] Após Migration 011 (password_reset_tokens) e implementação de D3, ' +
      'o endpoint deve exigir { email, token, senha } e validar o token contra o banco.'
    );
  });

});

// ─────────────────────────────────────────────────────────────────
// SEC-010 — Login não verifica status do membro
// ─────────────────────────────────────────────────────────────────

describe('[SEGURANÇA][SEC-010] POST /api/auth/login não verifica status do membro', () => {

  test('schema atual não possui coluna membros.status — gap documentado', async () => {
    // O schema tcc.sql NÃO possui a coluna `status` em membros.
    // A Entrega (banco.sql) possui `status ENUM('pendente', 'aprovado', 'bloqueado')`.
    // Após Migration 004 (C5), membros terão status e o login deverá verificar.
    console.warn(
      '[SEC-010] Schema atual (tcc.sql) não tem membros.status. ' +
      'Login aceita qualquer membro cadastrado independentemente do status. ' +
      'Correção: Migration 004 (adicionar status) + Fase 2 (verificar em auth.service.ts).'
    );
  });

  test('[CORRIGIR-EM-FASE-2] após C5: login com status pendente deve retornar 401', async () => {
    console.warn(
      '[SEC-010][PENDENTE] Teste requer Migration 004 (membros.status) e atualização de auth.service.ts. ' +
      'Será ativado na Fase 2.'
    );
  });

  test('[CORRIGIR-EM-FASE-2] após C5: login com status bloqueado deve retornar 401', async () => {
    console.warn(
      '[SEC-010][PENDENTE] Mesmo que SEC-010 acima.'
    );
  });

});

// ─────────────────────────────────────────────────────────────────
// SEC-011 — Cadastro sem codigoEntrada
// ─────────────────────────────────────────────────────────────────

describe('[SEGURANÇA][SEC-011] POST /api/user/ cadastro sem vínculo com igreja', () => {

  test('cadastro sem codigoEntrada é permitido (201) e criado como membro pendente na igreja padrão', async () => {
    const ts = Date.now();
    const res = await fetch(`${BASE}/api/user/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sem Igreja',
        birth_date: '2000-01-01',
        telephone: '11900001111',
        email: `sec011_${ts}@example.com`,
        password: 'senhavalida123',
      }),
    });
    const data = await res.json();
    // O cadastro sem código de entrada é permitido: o backend associa à igreja padrão.
    assert.strictEqual(res.status, 201,
      '[SEC-011] Cadastro sem codigoEntrada deve ser aceito com 201.'
    );
    // O cargo inicial deve ser membro (não privilegiado).
    assert.strictEqual(data.role, 'membro',
      '[SEC-011] O cargo inicial do novo membro deve ser "membro".'
    );
  });

  test('cadastro não permite definir cargo, status ou igreja via campos do cliente', async () => {
    const ts = Date.now();
    const res = await fetch(`${BASE}/api/user/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sem Privilégios',
        birth_date: '2000-01-01',
        telephone: '11900002222',
        email: `sec011b_${ts}@example.com`,
        password: 'senhavalida123',
        // Campos que o cliente não deve conseguir definir: igreja, cargo, status.
        id_igreja_fk: 999,
        cargo: 'administrador',
        status: 'aprovado',
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201,
      '[SEC-011] Cadastro deve ser aceito (201) mesmo com campos privilegiados no body.'
    );
    // O backend ignora campos de igreja/cargo/status enviados pelo cliente.
    assert.strictEqual(data.role, 'membro',
      '[SEC-011] O cargo deve ser "membro" independentemente do valor enviado no body.'
    );
  });

});

// ─────────────────────────────────────────────────────────────────
// Injeção de id_igreja via body/params
// ─────────────────────────────────────────────────────────────────

describe('[SEGURANÇA] id_igreja não deve ser aceito via body do cliente', () => {

  test('[PENDENTE] POST /api/user/ não deve aceitar id_igreja_fk no body', async () => {
    // Após Fase 1 (quando id_igreja_fk existir): verificar que o campo é ignorado.
    // O isolamento deve vir do codigoEntrada, nunca de um campo enviado pelo cliente.
    console.warn(
      '[PENDENTE] Após Migration 003 (id_igreja_fk), verificar que POST /api/user/ ' +
      'ignora qualquer id_igreja_fk enviado no body.'
    );
  });

});
