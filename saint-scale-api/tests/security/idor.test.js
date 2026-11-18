/**
 * tests/security/idor.test.js
 *
 * [SEGURANÇA] Testes de IDOR (Insecure Direct Object Reference)
 *
 * Vulnerabilidades cobertas:
 *   - SEC-001: GET /api/scale/{id} — acesso a escalas de outras igrejas
 *   - SEC-002: GET /api/alert/reminder/{id} — acesso a lembretes de outras igrejas
 *   - SEC-003: POST /api/scale/substituir — inserção em posição de outra igreja
 *
 * ESTADO ATUAL (Fase 0):
 *   Estes testes verificam que as vulnerabilidades EXISTEM.
 *   O schema atual não tem igrejas — os testes de demonstração completa de IDOR
 *   entre usuários de igrejas diferentes ficam como PENDENTES até a Fase 1
 *   (Migration 001 + 003 + criação de dados de teste multi-tenant).
 *
 *   Os testes que podem ser executados agora verificam a AUSÊNCIA de controle
 *   (ou seja, confirmam que qualquer ID é aceito sem verificação de ownership).
 *
 * AÇÃO APÓS CORREÇÃO (Fase 3):
 *   Inverta as asserções dos testes marcados com [CORRIGIR-EM-FASE-3]:
 *   o comportamento esperado passa a ser 403 (ou 404 anti-enumeração).
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

let clientA; // Usuário Igreja 1
let clientB; // Usuário Igreja 2

before(async () => {
  // Inicializa cada cliente de forma independente, com base nas credenciais
  // disponíveis. Não interrompe a criação do cliente A por falta de B (e vice-versa).
  if (TEST_PASSWORD) {
    clientA = createClient();
    const rA = await clientA.login(TEST_EMAIL, TEST_PASSWORD);
    if (rA.status !== 200 || !rA.data?.accessToken) {
      throw new Error(
        `Login falhou para ${TEST_EMAIL}: status=${rA.status} body=${JSON.stringify(rA.data)}`
      );
    }
  }
  if (TEST_PASSWORD_B) {
    clientB = createClient();
    const rB = await clientB.login(TEST_EMAIL_B, TEST_PASSWORD_B);
    if (rB.status !== 200 || !rB.data?.accessToken) {
      throw new Error(
        `Login falhou para ${TEST_EMAIL_B}: status=${rB.status} body=${JSON.stringify(rB.data)}`
      );
    }
  }
});

// ─────────────────────────────────────────────────────────────────
// SEC-001 — IDOR em GET /api/scale/{id}
// ─────────────────────────────────────────────────────────────────

describe('[SEGURANÇA][SEC-001] IDOR em GET /api/scale/{id}', () => {

  test('membro Igreja A acessa escala da Igreja A', async (t) => {
    if (!TEST_PASSWORD) { t.skip('TEST_PASSWORD não configurado'); return; }
    const r = await clientA.api('GET', '/api/scale/1');
    assert.ok(r.status === 200 || r.status === 404, `Recebido: ${r.status}`);
    if (r.status === 200) {
      assert.strictEqual(r.data.id_escala, '1');
    }
  });

  test('membro Igreja A NÃO acessa escala da Igreja B (id 11)', async (t) => {
    if (!TEST_PASSWORD) { t.skip('TEST_PASSWORD não configurado'); return; }
    const r = await clientA.api('GET', '/api/scale/11');
    assert.ok(r.status === 403 || r.status === 404,
      `Esperado 403/404 para escala de outra igreja, recebido ${r.status}`);
  });

  test('membro Igreja B acessa escala da Igreja B (id 11)', async (t) => {
    if (!TEST_PASSWORD_B) { t.skip('TEST_PASSWORD_B não configurado'); return; }
    const r = await clientB.api('GET', '/api/scale/11');
    assert.ok(r.status === 200 || r.status === 404, `Recebido: ${r.status}`);
  });

  test('membro Igreja B NÃO acessa escala da Igreja A (id 1)', async (t) => {
    if (!TEST_PASSWORD_B) { t.skip('TEST_PASSWORD_B não configurado'); return; }
    const r = await clientB.api('GET', '/api/scale/1');
    assert.ok(r.status === 403 || r.status === 404,
      `Esperado 403/404 para escala de outra igreja, recebido ${r.status}`);
  });

});

// ─────────────────────────────────────────────────────────────────
// SEC-002 — IDOR em GET /api/alert/reminder/{id_reminder}
// ─────────────────────────────────────────────────────────────────

describe('[SEGURANÇA][SEC-002] IDOR em GET /api/alert/reminder/{id_reminder}', () => {

  test('membro Igreja A acessa lembrete da Igreja A (id 1)', async (t) => {
    if (!TEST_PASSWORD) { t.skip('TEST_PASSWORD não configurado'); return; }
    const r = await clientA.api('GET', '/api/alert/reminder/1');
    assert.ok(r.status === 200 || r.status === 404, `Recebido: ${r.status}`);
  });

  test('membro Igreja A NÃO acessa lembrete da Igreja B (id 7)', async (t) => {
    if (!TEST_PASSWORD) { t.skip('TEST_PASSWORD não configurado'); return; }
    const r = await clientA.api('GET', '/api/alert/reminder/7');
    assert.ok(r.status === 403 || r.status === 404,
      `Esperado 403/404 para lembrete de outra igreja, recebido ${r.status}`);
  });

  test('membro Igreja B acessa lembrete da Igreja B (id 7)', async (t) => {
    if (!TEST_PASSWORD_B) { t.skip('TEST_PASSWORD_B não configurado'); return; }
    const r = await clientB.api('GET', '/api/alert/reminder/7');
    assert.ok(r.status === 200 || r.status === 404, `Recebido: ${r.status}`);
  });

});

// ─────────────────────────────────────────────────────────────────
// SEC-003 — IDOR em POST /api/scale/substituir
// ─────────────────────────────────────────────────────────────────

describe('[SEGURANÇA][SEC-003] IDOR em POST /api/scale/substituir', () => {

  test('ID inexistente retorna 404', async (t) => {
    if (!TEST_PASSWORD) { t.skip('TEST_PASSWORD não configurado'); return; }
    const r = await clientA.api('POST', '/api/scale/substituir', { id_membro_escala: '999999' });
    assert.ok(r.status === 404 || r.status === 400,
      `Recebido ${r.status} para ID inexistente. Esperado 404/400.`);
  });

});

// ─────────────────────────────────────────────────────────────────
// IDOR — Acesso a músicas por id_music_escalas
// ─────────────────────────────────────────────────────────────────

describe('[SEGURANÇA] IDOR em GET /api/music/{id_music_escalas}', () => {

  test('membro Igreja A acessa música da Igreja A (id_music_escalas 1)', async (t) => {
    if (!TEST_PASSWORD) { t.skip('TEST_PASSWORD não configurado'); return; }
    const r = await clientA.api('GET', '/api/music/1');
    assert.ok(r.status === 200 || r.status === 404, `Recebido: ${r.status}`);
  });

  test('membro Igreja A NÃO acessa música da Igreja B', async (t) => {
    // id_music_escala 22 pertence à escala 7 (Igreja A). Música da escala 11 (Igreja B)
    // não tem id_musica_escala preexistente, então testamos com uma escala da Igreja A
    // mas acessada por membro da Igreja B.
    if (!TEST_PASSWORD || !TEST_PASSWORD_B) { t.skip('TEST_PASSWORD ou TEST_PASSWORD_B não configurado'); return; }
    const r = await clientB.api('GET', '/api/music/1');
    assert.ok(r.status === 403 || r.status === 404,
      `Esperado 403/404 para música de escala de outra igreja, recebido ${r.status}`);
  });

});

// ─────────────────────────────────────────────────────────────────
// IDOR — Acesso a membros de escala por ID
// ─────────────────────────────────────────────────────────────────

describe('[SEGURANÇA] IDOR em GET /api/scale/{id}/members', () => {

  test('membro Igreja A acessa membros da escala da Igreja A', async (t) => {
    if (!TEST_PASSWORD) { t.skip('TEST_PASSWORD não configurado'); return; }
    const r = await clientA.api('GET', '/api/scale/1/members');
    assert.ok(r.status === 200 || r.status === 404, `Recebido: ${r.status}`);
  });

  test('membro Igreja B NÃO acessa membros da escala da Igreja A', async (t) => {
    if (!TEST_PASSWORD_B) { t.skip('TEST_PASSWORD_B não configurado'); return; }
    const r = await clientB.api('GET', '/api/scale/1/members');
    assert.ok(r.status === 200 || r.status === 403 || r.status === 404,
      `Esperado 200 (vazio)/403/404 para membros de escala de outra igreja, recebido ${r.status}`);
    if (r.status === 200) {
      assert.ok(Array.isArray(r.data), 'deve retornar array');
      assert.strictEqual(r.data.length, 0, 'não deve retornar membros de outra igreja');
    }
  });

});
;
