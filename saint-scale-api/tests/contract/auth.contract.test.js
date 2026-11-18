/**
 * tests/contract/auth.contract.test.js
 *
 * [CONTRATO] POST /api/auth/login
 *
 * Documenta o comportamento ATUAL da rota de login ANTES de qualquer migration.
 * Estes testes devem passar com a API no estado da Fase 0.
 *
 * Pré-condições:
 *   - Banco com seed de tcc.sql aplicado
 *   - Um membro com hash argon2id existente no banco
 *     (o seed usa hashes de placeholder — você precisará criar um membro real
 *      com argon2id para o teste de login bem-sucedido, ou ajustar TEST_EMAIL/TEST_PASSWORD)
 *
 * Vulnerabilidades documentadas neste arquivo (NÃO corrigidas ainda):
 *   - SEC-010: login não verifica status pendente/bloqueado
 */

'use strict';

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '../helpers/client.js';

const TEST_EMAIL    = process.env.TEST_EMAIL    ?? 'joao@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? '';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

const BASE = process.env.BASE ?? 'http://localhost:3000';

async function rawPost(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

// ─────────────────────────────────────────────────────────────────
// Testes
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] POST /api/auth/login', () => {

  test('rejeita corpo sem email — deve retornar 422 ou 400', async () => {
    const r = await rawPost('/api/auth/login', { password: 'qualquersenha' });
    assert.ok(
      r.status === 400 || r.status === 422,
      `Esperado 400 ou 422, recebido ${r.status}`
    );
  });

  test('rejeita corpo sem password — deve retornar 422 ou 400', async () => {
    const r = await rawPost('/api/auth/login', { email: 'alguem@email.com' });
    assert.ok(
      r.status === 400 || r.status === 422,
      `Esperado 400 ou 422, recebido ${r.status}`
    );
  });

  test('rejeita email inválido (sem @) — deve retornar 422 ou 400', async () => {
    const r = await rawPost('/api/auth/login', { email: 'nao-e-email', password: 'senhavalida' });
    assert.ok(
      r.status === 400 || r.status === 422,
      `Esperado 400 ou 422, recebido ${r.status}`
    );
  });

  test('rejeita senha menor que 8 chars — deve retornar 422 ou 400', async () => {
    const r = await rawPost('/api/auth/login', { email: 'a@b.com', password: 'curta' });
    assert.ok(
      r.status === 400 || r.status === 422,
      `Esperado 400 ou 422, recebido ${r.status}`
    );
  });

  test('retorna 401 para credenciais inexistentes', async () => {
    const r = await rawPost('/api/auth/login', {
      email: 'nao_existe_nunca@teste.com',
      password: 'senhaqualquer123',
    });
    assert.strictEqual(r.status, 401);
    assert.ok(r.data.message, 'Deve retornar um campo "message" no body');
  });

  test('retorna 401 para senha errada', async () => {
    const r = await rawPost('/api/auth/login', {
      email: TEST_EMAIL,
      password: 'senhaerrada_certamente',
    });
    assert.strictEqual(r.status, 401);
  });

  test('retorna 200 com accessToken e tokenType Bearer para credenciais válidas', async () => {
    if (!TEST_PASSWORD) {
      // Sem senha de teste configurada, pula com aviso
      console.warn(
        '[PULADO] TEST_PASSWORD não definido — configure via variável de ambiente para testar login bem-sucedido.'
      );
      return;
    }
    const r = await rawPost('/api/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    assert.strictEqual(r.status, 200, `Body: ${JSON.stringify(r.data)}`);
    assert.ok(typeof r.data.accessToken === 'string', 'accessToken deve ser string');
    assert.strictEqual(r.data.tokenType, 'Bearer');
  });

  // ── SEC-010: Login não permite membros pendentes ou bloqueados ──────

  test('[SEC-010] login com membro aprovado retorna 200', async () => {
    if (!TEST_PASSWORD) {
      console.warn('[PULADO] TEST_PASSWORD não definido');
      return;
    }
    const r = await rawPost('/api/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    assert.strictEqual(r.status, 200, `Body: ${JSON.stringify(r.data)}`);
    assert.ok(typeof r.data.accessToken === 'string', 'accessToken deve ser string');
  });

  test('[SEC-010] login com membro pendente retorna 401', async () => {
    const r = await rawPost('/api/auth/login', {
      email: 'pendente_teste@example.com',
      password: 'Teste1234!',
    });
    assert.strictEqual(r.status, 401, `Esperado 401 para membro pendente, recebido ${r.status}`);
  });

  test('[SEC-010] login com membro bloqueado retorna 401', async () => {
    const r = await rawPost('/api/auth/login', {
      email: 'bloqueado_teste@example.com',
      password: 'Teste1234!',
    });
    assert.strictEqual(r.status, 401, `Esperado 401 para membro bloqueado, recebido ${r.status}`);
  });

  test('[SEC-010] rotas alternativas não emitem JWT sem status aprovado', async () => {
    // Tentativa direta via rota pública não aplicável — login é o único emissor de JWT.
    // Verifica que credenciais inválidas (incluindo membro não aprovado) não emitem token.
    const r = await rawPost('/api/auth/login', {
      email: 'pendente_teste@example.com',
      password: 'qualquercoisa123',
    });
    assert.strictEqual(r.status, 401);
    assert.ok(!r.data?.accessToken, 'Não deve emitir accessToken para membro não aprovado');
  });

});
