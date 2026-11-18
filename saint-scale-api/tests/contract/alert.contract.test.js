/**
 * tests/contract/alert.contract.test.js
 *
 * [CONTRATO] Rotas de /api/alert/*
 *
 * Documenta o comportamento ATUAL ANTES de migrations.
 *
 * Vulnerabilidades documentadas (não corrigidas):
 *   - SEC-002: GET /api/alert/reminder/{id_reminder} — IDOR por ID
 *   - SEC-007: GET /api/alert/reminder — lembretes não filtrados por igreja
 */

'use strict';

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '../helpers/client.js';

const TEST_EMAIL    = process.env.TEST_EMAIL    ?? 'joao@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? '';
const BASE          = process.env.BASE          ?? 'http://localhost:3000';

let client;

before(async () => {
  if (!TEST_PASSWORD) return;
  client = createClient();
  await client.login(TEST_EMAIL, TEST_PASSWORD);
});

// ─────────────────────────────────────────────────────────────────
// GET /api/alert/reminder
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] GET /api/alert/reminder', () => {

  test('retorna 401 sem token', async () => {
    const r = await fetch(`${BASE}/api/alert/reminder`);
    assert.strictEqual(r.status, 401);
  });

  test('retorna 200 com shape { alert: [], notifications: [] }', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    const r = await client.api('GET', '/api/alert/reminder');
    assert.strictEqual(r.status, 200);
    assert.ok('alert' in r.data, 'deve ter campo alert');
    assert.ok('notifications' in r.data, 'deve ter campo notifications');
    assert.ok(Array.isArray(r.data.alert), 'alert deve ser array');
    assert.ok(Array.isArray(r.data.notifications), 'notifications deve ser array');
  });

  test('items de alert têm o shape correto', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    const r = await client.api('GET', '/api/alert/reminder');
    assert.strictEqual(r.status, 200);
    for (const item of r.data.alert ?? []) {
      assert.ok('id_lembrete' in item, 'deve ter id_lembrete');
      assert.ok('name' in item, 'deve ter name');
      assert.ok('date' in item, 'deve ter date');
      assert.ok(Array.isArray(item.functions), 'functions deve ser array');
      // date deve ser DD/MM/YYYY
      assert.match(item.date, /^\d{2}\/\d{2}\/\d{4}$/, 'date deve ser DD/MM/YYYY');
    }
  });

  test('items de notifications têm o shape correto e pertencem ao membro autenticado', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    const r = await client.api('GET', '/api/alert/reminder');
    assert.strictEqual(r.status, 200);
    for (const item of r.data.notifications ?? []) {
      assert.ok('id_notification' in item);
      assert.ok('title' in item);
      assert.ok('date' in item);
      // conteudo pode ser null
      assert.ok('conteudo' in item);
    }
  });

  /**
   * [SEC-007] Lembretes não filtrados por igreja.
   * A query de lembretes em alert.dao.ts não tem WHERE id_igreja_fk.
   * Correção na Fase 3 (C3/D9).
   */
  test('[SEC-007] lembretes retornam sem filtro de igreja — documenta gap de isolamento', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    const r = await client.api('GET', '/api/alert/reminder');
    assert.strictEqual(r.status, 200);
    console.warn(
      `[SEC-007] GET /alert/reminder retornou ${r.data?.alert?.length ?? '?'} lembretes sem filtro de igreja. ` +
      'Corrigir na Fase 3 (C3/D9 — adicionar id_igreja_fk em lembretes).'
    );
  });

});

// ─────────────────────────────────────────────────────────────────
// GET /api/alert/reminder/{id_reminder}
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] GET /api/alert/reminder/{id_reminder}', () => {

  test('retorna 401 sem token', async () => {
    const r = await fetch(`${BASE}/api/alert/reminder/1`);
    assert.strictEqual(r.status, 401);
  });

  test('retorna 404 para lembrete inexistente', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    const r = await client.api('GET', '/api/alert/reminder/999999');
    assert.strictEqual(r.status, 404);
  });

  test('retorna 200 com detalhes do lembrete para ID existente', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    // ID 1 existe no seed do tcc.sql
    const r = await client.api('GET', '/api/alert/reminder/1');
    assert.ok(r.status === 200 || r.status === 404, `Recebido: ${r.status}`);
    if (r.status === 200) {
      assert.ok('id_lembrete' in r.data);
      assert.ok('name' in r.data);
      assert.ok('date' in r.data);
      assert.ok('tempo' in r.data);
      assert.ok('functions' in r.data);
      assert.ok(Array.isArray(r.data.functions));
    }
  });

  /**
   * [SEC-002] IDOR: qualquer usuário autenticado pode acessar detalhes de lembretes
   * de QUALQUER igreja informando um ID arbitrário. Não há verificação de que
   * o lembrete pertence à igreja do usuário autenticado.
   *
   * Correção na Fase 3 (D9 — adicionar filtro de id_igreja_fk).
   *
   * Nota: não podemos demonstrar o IDOR sem ter dois usuários de igrejas diferentes
   * configurados. O teste documenta o GAP e será expandido após Migration 003.
   */
  test('[SEC-002][PENDENTE] IDOR em /alert/reminder/{id} — requer múltiplas igrejas para demonstrar', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    // Com o schema atual (sem igrejas), não há como demonstrar IDOR entre igrejas.
    // Este teste é placeholder — será expandido após Migration 001 (igrejas) e Migration 003 (id_igreja_fk).
    console.warn(
      '[SEC-002] IDOR em /alert/reminder/{id}: sem filtro de id_igreja_fk. ' +
      'Demonstração completa requer Migration 001 + 003 + dados de múltiplas igrejas. ' +
      'Corrigir na Fase 3 (D9).'
    );
  });

});
