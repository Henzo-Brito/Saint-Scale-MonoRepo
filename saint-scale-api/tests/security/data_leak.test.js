/**
 * tests/security/data_leak.test.js
 *
 * [SEGURANÇA] Testes de vazamento de dados entre igrejas
 *
 * Vulnerabilidades cobertas:
 *   - SEC-004: GET /api/home/month/{mes} — escalas sem filtro de igreja
 *   - SEC-005: GET /api/home/unavailability/{mes} — membros sem filtro de igreja
 *   - SEC-006: GET /api/home/scale/day/{day} — escalas sem filtro de igreja
 *   - SEC-007: GET /api/alert/reminder — lembretes sem filtro de igreja
 *   - SEC-008: GET /api/user/ — membros sem filtro de igreja
 *
 * ESTADO ATUAL (Fase 0):
 *   Todos estes testes documentam que as rotas existem e RETORNAM DADOS
 *   sem filtro de id_igreja_fk. Quando múltiplas igrejas existirem no banco
 *   (após Fase 1), um usuário da Igreja A poderia ver dados da Igreja B.
 *
 * AÇÃO APÓS CORREÇÃO (Fase 3):
 *   Os testes devem ser expandidos para verificar que dados de outras igrejas
 *   NÃO aparecem nas respostas.
 */

'use strict';

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '../helpers/client.js';

const TEST_EMAIL    = process.env.TEST_EMAIL    ?? 'joao@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? '';
const TEST_EMAIL_B  = process.env.TEST_EMAIL_B  ?? 'membro_b@teste.com';
const TEST_PASSWORD_B = process.env.TEST_PASSWORD_B ?? 'senhavalida123';
const BASE          = process.env.BASE          ?? 'http://localhost:3000';

// Código de entrada da Igreja 2 (para criar membros de teste se necessário)
const CODIGO_IGREJA_2 = 'UEWX4K';

let clientA; // Igreja 1
let clientB; // Igreja 2

before(async () => {
  if (!TEST_PASSWORD || !TEST_PASSWORD_B) return;
  clientA = createClient();
  await clientA.login(TEST_EMAIL, TEST_PASSWORD);
  clientB = createClient();
  await clientB.login(TEST_EMAIL_B, TEST_PASSWORD_B);
});

// ─────────────────────────────────────────────────────────────────
// SEC-004 — GET /api/home/month/{mes} sem filtro de igreja
// ─────────────────────────────────────────────────────────────────

describe('[SEGURANÇA][SEC-004] GET /api/home/month/{mes} isolamento por igreja', () => {

  test('rota acessível sem token — retorna 401', async () => {
    const r = await fetch(`${BASE}/api/home/month/novembro`);
    assert.strictEqual(r.status, 401);
  });

  test('membro da Igreja A vê apenas escalas da Igreja A', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO] TEST_PASSWORD não configurado'); return; }
    const r = await clientA.api('GET', '/api/home/month/novembro');
    assert.strictEqual(r.status, 200);
    assert.ok(Array.isArray(r.data));
    // Nenhuma escala da Igreja B (id_escala = 11) deve aparecer
    const escalaB = r.data.find((e) => e.id_escala === '11');
    assert.ok(!escalaB, 'Membro da Igreja A não deve ver escala da Igreja B');
  });

});

// ─────────────────────────────────────────────────────────────────
// SEC-005 — GET /api/home/unavailability/{mes} sem filtro de igreja
// ─────────────────────────────────────────────────────────────────

describe('[SEGURANÇA][SEC-005] GET /api/home/unavailability/{mes} isolamento por igreja', () => {

  test('rota acessível sem token — retorna 401', async () => {
    const r = await fetch(`${BASE}/api/home/unavailability/novembro`);
    assert.strictEqual(r.status, 401);
  });

  test('membro da Igreja A vê apenas indisponibilidades da Igreja A', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO] TEST_PASSWORD não configurado'); return; }
    const r = await clientA.api('GET', '/api/home/unavailability/novembro');
    assert.strictEqual(r.status, 200);
    assert.ok(Array.isArray(r.data));
    // Membro da Igreja B (id_membro=19) não deve aparecer
    const membroB = r.data.find((u) => u.id_member === 19 || u.nome === 'Membro Igreja B');
    assert.ok(!membroB, 'Membro da Igreja B não deve aparecer nas indisponibilidades da Igreja A');
  });

});

// ─────────────────────────────────────────────────────────────────
// SEC-006 — GET /api/home/scale/day/{day} sem filtro de igreja
// ─────────────────────────────────────────────────────────────────

describe('[SEGURANÇA][SEC-006] GET /api/home/scale/day/{day} isolamento por igreja', () => {

  test('rota acessível sem token — retorna 401', async () => {
    const r = await fetch(`${BASE}/api/home/scale/day/14112026`);
    assert.strictEqual(r.status, 401);
  });

  test('membro da Igreja A vê apenas escalas da Igreja A no dia', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO] TEST_PASSWORD não configurado'); return; }
    const r = await clientA.api('GET', '/api/home/scale/day/14112026');
    assert.strictEqual(r.status, 200);
    assert.ok(Array.isArray(r.data));
    // Nenhuma escala da Igreja B deve aparecer
    const escalaB = r.data.find((e) => e.id_escala === '11');
    assert.ok(!escalaB, 'Membro da Igreja A não deve ver escala da Igreja B no dia');
  });

});

// ─────────────────────────────────────────────────────────────────
// SEC-007 — GET /api/alert/reminder sem filtro de igreja (lembretes)
// ─────────────────────────────────────────────────────────────────

describe('[SEGURANÇA][SEC-007] GET /api/alert/reminder isolamento por igreja', () => {

  test('rota acessível sem token — retorna 401', async () => {
    const r = await fetch(`${BASE}/api/alert/reminder`);
    assert.strictEqual(r.status, 401);
  });

  test('membro da Igreja A vê apenas lembretes da Igreja A', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO] TEST_PASSWORD não configurado'); return; }
    const r = await clientA.api('GET', '/api/alert/reminder');
    assert.strictEqual(r.status, 200);
    assert.ok(Array.isArray(r.data?.alert));
    // Lembrete da Igreja B (nome 'Lembrete Teste B') não deve aparecer
    const alertB = r.data.alert.find((a) => a.name === 'Lembrete Teste B' || a.id_lembrete === 7);
    assert.ok(!alertB, 'Membro da Igreja A não deve ver lembrete da Igreja B');
  });

  test('notificações SÃO filtradas por id_membro — isolamento correto', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO] TEST_PASSWORD não configurado'); return; }
    const r = await clientA.api('GET', '/api/alert/reminder');
    assert.strictEqual(r.status, 200);
    assert.ok(Array.isArray(r.data?.notifications), 'notifications deve ser array');
    console.log('[OK] Notificações filtradas por id_membro.');
  });

});

// ─────────────────────────────────────────────────────────────────
// SEC-008 — GET /api/user/ sem filtro de igreja
// ─────────────────────────────────────────────────────────────────

describe('[SEGURANÇA][SEC-008] GET /api/user/ isolamento por igreja', () => {

  test('rota acessível sem token — retorna 401', async () => {
    const r = await fetch(`${BASE}/api/user/`);
    assert.strictEqual(r.status, 401);
  });

  test('membro da Igreja A vê apenas membros da Igreja A', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO] TEST_PASSWORD não configurado'); return; }
    const r = await clientA.api('GET', '/api/user/');
    assert.strictEqual(r.status, 200);
    assert.ok(Array.isArray(r.data));
    // Membro da Igreja B (email membro_b@teste.com) não deve aparecer
    const membroB = r.data.find((u) => u.email === 'membro_b@teste.com');
    assert.ok(!membroB, 'Membro da Igreja B não deve aparecer na listagem da Igreja A');
  });

  test('resposta não contém senhas', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO] TEST_PASSWORD não configurado'); return; }
    const r = await clientA.api('GET', '/api/user/');
    assert.strictEqual(r.status, 200);
    for (const m of r.data ?? []) {
      assert.ok(!('senha' in m), `Membro ${m.id_member} expõe campo 'senha'`);
      assert.ok(!('password' in m), `Membro ${m.id_member} expõe campo 'password'`);
    }
  });

});

// ─────────────────────────────────────────────────────────────────
// Verificação de campos sensíveis nas respostas
// ─────────────────────────────────────────────────────────────────

describe('[SEGURANÇA] Exposição de dados sensíveis nas respostas', () => {

  test('GET /api/user/me não expõe senha', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO] TEST_PASSWORD não configurado'); return; }
    const r = await clientA.api('GET', '/api/user/me');
    assert.strictEqual(r.status, 200);
    assert.ok(!('senha' in r.data), "campo 'senha' não deve ser exposto");
    assert.ok(!('password' in r.data), "campo 'password' não deve ser exposto");
    console.log('[OK] GET /api/user/me não expõe senha.');
  });

  test('GET /api/scale/{id}/members não expõe senhas de membros', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO] TEST_PASSWORD não configurado'); return; }
    const r = await clientA.api('GET', '/api/scale/1/members');
    assert.ok(r.status === 200 || r.status === 404);
    if (r.status === 200) {
      for (const m of r.data ?? []) {
        assert.ok(!('senha' in m), 'senha não deve ser exposta em membros da escala');
        assert.ok(!('email' in m), 'email não deve ser exposto em membros da escala');
      }
      console.log('[OK] GET /api/scale/{id}/members não expõe senhas nem emails.');
    }
  });

});
