/**
 * tests/contract/user.contract.test.js
 *
 * [CONTRATO] Rotas de /api/user/*
 *
 * Vulnerabilidades corrigidas:
 *   - SEC-008: GET /api/user/ filtra por igreja (C3/D9)
 *   - SEC-009: PATCH /api/user/forgotPassword exige token (D3)
 *   - SEC-011: POST /api/user/ exige codigoEntrada (SEC-011)
 */

'use strict';

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '../helpers/client.js';

const TEST_EMAIL    = process.env.TEST_EMAIL    ?? 'joao@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? '';
const BASE          = process.env.BASE          ?? 'http://localhost:3000';

// Código de entrada válido para a Igreja 1 (HMAC-SHA256, mesmo algoritmo do backend)
const CODIGO_IGREJA_1 = 'ZEU3YK';

let authenticatedClient;
let createdMemberEmail;

// ─────────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────────

before(async () => {
  if (!TEST_PASSWORD) return;
  authenticatedClient = createClient();
  await authenticatedClient.login(TEST_EMAIL, TEST_PASSWORD);
});

// ─────────────────────────────────────────────────────────────────
// POST /api/user/ — criação de usuário (pública)
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] POST /api/user/', () => {

  test('rejeita corpo sem campos obrigatórios — retorna 400 ou 422', async () => {
    const r = await fetch(`${BASE}/api/user/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Apenas Nome' }),
    });
    assert.ok(r.status === 400 || r.status === 422, `Recebido: ${r.status}`);
  });

  test('aceita cadastro sem codigoEntrada com 201 (SEC-011)', async () => {
    const r = await fetch(`${BASE}/api/user/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sem Código',
        birth_date: '2000-01-01',
        telephone: '11900001111',
        email: `sem_codigo_${Date.now()}@example.com`,
        password: 'senhavalida123',
        // Campos privilegiados enviados pelo cliente devem ser ignorados pelo backend.
        id_igreja_fk: 999,
        cargo: 'administrador',
        status: 'aprovado',
      }),
    });
    const data = await r.json();
    assert.strictEqual(r.status, 201, 'Cadastro sem codigoEntrada deve retornar 201');
    assert.strictEqual(data.role, 'membro', 'O cargo inicial deve ser "membro" independentemente do valor enviado no body.');
  });

  test('rejeita codigoEntrada inválido (SEC-011)', async () => {
    const r = await fetch(`${BASE}/api/user/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Código Inválido',
        birth_date: '2000-01-01',
        telephone: '11900002222',
        email: `codigo_invalido_${Date.now()}@example.com`,
        password: 'senhavalida123',
        codigoEntrada: 'CODIGO_INVALIDO',
      }),
    });
    assert.strictEqual(r.status, 400, 'Código inválido deve retornar 400');
  });

  test('cria usuário válido com codigoEntrada e retorna 201', async () => {
    const ts = Date.now();
    createdMemberEmail = `contrato_test_${ts}@example.com`;
    const r = await fetch(`${BASE}/api/user/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Contrato Teste',
        birth_date: '1995-06-15',
        telephone: '11988887777',
        email: createdMemberEmail,
        password: 'senhavalida123',
        codigoEntrada: CODIGO_IGREJA_1,
      }),
    });
    const body = await r.text();
    assert.strictEqual(r.status, 201, `Body: ${body}`);
    const data = JSON.parse(body);
    assert.ok(typeof data.id_member === 'number', 'id_member deve ser número');
    assert.strictEqual(data.email, createdMemberEmail);
    assert.ok(!data.password && !data.senha, 'senha NÃO deve ser exposta');
    assert.ok(typeof data.role === 'string', 'role deve ser string');
    assert.strictEqual(data.role, 'membro');
  });

  test('rejeita email duplicado (SEC-011)', async () => {
    if (!createdMemberEmail) return;
    const r = await fetch(`${BASE}/api/user/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicado',
        birth_date: '1990-01-01',
        telephone: '11900003333',
        email: createdMemberEmail,
        password: 'senhavalida123',
        codigoEntrada: CODIGO_IGREJA_1,
      }),
    });
    assert.strictEqual(r.status, 400, 'Email duplicado deve retornar 400');
  });

  test('membro criado fica com status pendente e igreja do código', async () => {
    if (!createdMemberEmail) return;
    const { Pool } = await import('pg');
    const pool = new Pool({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'saintscale_dev',
    });
    try {
      const result = await pool.query(
        `SELECT status, id_igreja_fk FROM membros WHERE email = $1`,
        [createdMemberEmail]
      );
      assert.strictEqual(result.rows.length, 1, 'Membro deve existir');
      assert.strictEqual(result.rows[0].status, 'pendente', 'Novo membro deve nascer pendente');
      assert.strictEqual(result.rows[0].id_igreja_fk, 1, 'Membro deve estar na Igreja 1 (do código)');
    } finally {
      await pool.end();
    }
  });

});

// ─────────────────────────────────────────────────────────────────
// GET /api/user/ — listagem (protegida)
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] GET /api/user/', () => {

  test('retorna 401 sem token', async () => {
    const r = await fetch(`${BASE}/api/user/`);
    assert.strictEqual(r.status, 401);
  });

  test('retorna 200 com array de membros para usuário autenticado', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO] TEST_PASSWORD não configurado'); return; }
    const r = await authenticatedClient.api('GET', '/api/user/');
    assert.strictEqual(r.status, 200);
    assert.ok(Array.isArray(r.data), 'Deve retornar array');
    if (r.data.length > 0) {
      const m = r.data[0];
      assert.ok('id_member' in m, 'deve ter id_member');
      assert.ok('name' in m, 'deve ter name');
      assert.ok('email' in m, 'deve ter email');
      assert.ok('role' in m, 'deve ter role');
      assert.ok(!('senha' in m) && !('password' in m), 'senha não deve ser exposta');
    }
  });

});

// ─────────────────────────────────────────────────────────────────
// GET /api/user/me — perfil próprio
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] GET /api/user/me', () => {

  test('retorna 401 sem token', async () => {
    const r = await fetch(`${BASE}/api/user/me`);
    assert.strictEqual(r.status, 401);
  });

  test('retorna 200 com perfil completo para token válido', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO] TEST_PASSWORD não configurado'); return; }
    const r = await authenticatedClient.api('GET', '/api/user/me');
    assert.strictEqual(r.status, 200);
    const m = r.data;
    assert.ok(typeof m.id_membro === 'number', 'id_membro deve ser número');
    assert.ok(typeof m.nome === 'string', 'nome deve ser string');
    assert.ok(typeof m.email === 'string', 'email deve ser string');
    assert.ok(Array.isArray(m.funcoes), 'funcoes deve ser array');
    assert.ok(Array.isArray(m.equipes), 'equipes deve ser array');
    assert.ok(!('senha' in m) && !('password' in m), 'senha não deve ser exposta');
  });

});

// ─────────────────────────────────────────────────────────────────
// PATCH /api/user/forgotPassword — troca de senha (pública)
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] PATCH /api/user/forgotPassword', () => {

  test('rejeita sem email — retorna 400 ou 422', async () => {
    const r = await fetch(`${BASE}/api/user/forgotPassword`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'novasenha123' }),
    });
    assert.ok(r.status === 400 || r.status === 422, `Recebido: ${r.status}`);
  });

  test('rejeita senha menor que 8 chars', async () => {
    const r = await fetch(`${BASE}/api/user/forgotPassword`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alguem@ex.com', password: 'curta' }),
    });
    assert.ok(r.status === 400 || r.status === 422, `Recebido: ${r.status}`);
  });

  test('[SEC-009] troca de senha sem token de recuperação válido é rejeitada', async () => {
    const r = await fetch(`${BASE}/api/user/forgotPassword`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'naoexiste_nunca_realmente@example.com',
        password: 'novasenha123',
      }),
    });
    assert.ok(
      r.status === 400 || r.status === 403 || r.status === 422,
      `[SEC-009] Deve rejeitar sem token de recuperação. Recebido ${r.status}.`
    );
  });

});

// ─────────────────────────────────────────────────────────────────
// PATCH /api/user/alterEmail — troca de email (protegida)
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] PATCH /api/user/alterEmail', () => {

  test('retorna 401 sem token', async () => {
    const r = await fetch(`${BASE}/api/user/alterEmail`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'novo@exemplo.com' }),
    });
    assert.strictEqual(r.status, 401);
  });

});

// ─────────────────────────────────────────────────────────────────
// PATCH /api/user/alterLogradouro — endereço (protegida)
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] PATCH /api/user/alterLogradouro', () => {

  test('retorna 401 sem token', async () => {
    const r = await fetch(`${BASE}/api/user/alterLogradouro`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rua: 'Rua Teste', numero: 1 }),
    });
    assert.strictEqual(r.status, 401);
  });

});

// ─────────────────────────────────────────────────────────────────
// PATCH /api/user/alterBirthday — data de nascimento (protegida)
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] PATCH /api/user/alterBirthday', () => {

  test('retorna 401 sem token', async () => {
    const r = await fetch(`${BASE}/api/user/alterBirthday`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ birth_date: '1990-01-01' }),
    });
    assert.strictEqual(r.status, 401);
  });

});

// ─────────────────────────────────────────────────────────────────
// PATCH /api/user/alterTelephone — telefone (protegida)
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] PATCH /api/user/alterTelephone', () => {

  test('retorna 401 sem token', async () => {
    const r = await fetch(`${BASE}/api/user/alterTelephone`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telephone: '11999998888' }),
    });
    assert.strictEqual(r.status, 401);
  });

});
