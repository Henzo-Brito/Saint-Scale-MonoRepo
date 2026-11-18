/**
 * tests/contract/home.contract.test.js
 *
 * [CONTRATO] Rotas de /api/home/*
 *
 * Documenta o comportamento ATUAL das rotas de home ANTES de migrations.
 *
 * Vulnerabilidades documentadas (não corrigidas):
 *   - SEC-004: GET /api/home/month/{mes} retorna escalas de todas as igrejas
 *   - SEC-005: GET /api/home/unavailability/{mes} retorna membros de todas as igrejas
 *   - SEC-006: GET /api/home/scale/day/{day} retorna escalas de todas as igrejas
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
// GET /api/home/month/{mes}
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] GET /api/home/month/{mes}', () => {

  test('retorna 401 sem token', async () => {
    const r = await fetch(`${BASE}/api/home/month/novembro`);
    assert.strictEqual(r.status, 401);
  });

  test('retorna 404 ou 400 para mês inválido', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    const r = await client.api('GET', '/api/home/month/mesqueNaoExiste');
    assert.ok(
      r.status === 404 || r.status === 400 || r.status === 422,
      `Esperado 400/404/422, recebido ${r.status}`
    );
  });

  test('retorna 200 com array para mês válido (novembro)', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    const r = await client.api('GET', '/api/home/month/novembro');
    assert.strictEqual(r.status, 200);
    assert.ok(Array.isArray(r.data), 'Deve retornar array');
    if (r.data.length > 0) {
      const item = r.data[0];
      assert.ok('id_escala' in item, 'deve ter id_escala');
      assert.ok('dia' in item, 'deve ter dia');
      // dia deve ser no formato DD/MM/YYYY
      assert.match(item.dia, /^\d{2}\/\d{2}\/\d{4}$/, 'dia deve ser DD/MM/YYYY');
    }
  });

  test('aceita "marco" (sem acento) para março', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    const r = await client.api('GET', '/api/home/month/marco');
    assert.strictEqual(r.status, 200);
    assert.ok(Array.isArray(r.data));
  });

  /**
   * [SEC-004] Rota retorna escalas de TODAS as igrejas — sem filtro por id_igreja_fk.
   * Correção na Fase 3 (C3/D9).
   */
  test('[SEC-004] retorna escalas sem filtro de igreja — documenta gap de isolamento', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    const r = await client.api('GET', '/api/home/month/novembro');
    assert.strictEqual(r.status, 200);
    console.warn(
      `[SEC-004] /home/month retornou ${r.data?.length ?? '?'} escalas sem filtro de igreja. ` +
      'Corrigir na Fase 3 (C3/D9).'
    );
  });

});

// ─────────────────────────────────────────────────────────────────
// GET /api/home/unavailability/{mes}
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] GET /api/home/unavailability/{mes}', () => {

  test('retorna 401 sem token', async () => {
    const r = await fetch(`${BASE}/api/home/unavailability/novembro`);
    assert.strictEqual(r.status, 401);
  });

  test('retorna 200 com array para mês válido', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    const r = await client.api('GET', '/api/home/unavailability/novembro');
    assert.strictEqual(r.status, 200);
    assert.ok(Array.isArray(r.data), 'Deve retornar array');
    if (r.data.length > 0) {
      const item = r.data[0];
      assert.ok('id_escala' in item);
      assert.ok('nome' in item);
      assert.ok('funcao' in item);
      assert.ok('img_id' in item);
      assert.ok('dia' in item);
    }
  });

  /**
   * [SEC-005] Retorna membros de todas as igrejas sem filtro.
   * Correção na Fase 3 (C3/D9).
   */
  test('[SEC-005] retorna indisponibilidades sem filtro de igreja — documenta gap', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    const r = await client.api('GET', '/api/home/unavailability/novembro');
    console.warn(
      `[SEC-005] /home/unavailability retornou ${r.data?.length ?? '?'} itens sem filtro de igreja. ` +
      'Corrigir na Fase 3.'
    );
  });

});

// ─────────────────────────────────────────────────────────────────
// GET /api/home/scale/me
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] GET /api/home/scale/me', () => {

  test('retorna 401 sem token', async () => {
    const r = await fetch(`${BASE}/api/home/scale/me`);
    assert.strictEqual(r.status, 401);
  });

  test('retorna 200 com escalas do membro autenticado', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    const r = await client.api('GET', '/api/home/scale/me');
    assert.strictEqual(r.status, 200);
    assert.ok(Array.isArray(r.data), 'Deve retornar array');
    if (r.data.length > 0) {
      const item = r.data[0];
      assert.ok('id_escala' in item);
      assert.ok('title_scale' in item);
      assert.ok('data_hora' in item);
      assert.ok('confirmados' in item);
      assert.ok('quant_music' in item);
      // data_hora deve ser DD/MM/YYYY HH:MM:SS
      assert.match(item.data_hora, /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/);
    }
  });

});

// ─────────────────────────────────────────────────────────────────
// GET /api/home/scale/day/{day}
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] GET /api/home/scale/day/{day}', () => {

  test('retorna 401 sem token', async () => {
    const r = await fetch(`${BASE}/api/home/scale/day/14112026`);
    assert.strictEqual(r.status, 401);
  });

  test('retorna 200 com array para dia no formato DDMMYYYY', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    // 14/11/2026 — há escalas nesta data no seed
    const r = await client.api('GET', '/api/home/scale/day/14112026');
    assert.strictEqual(r.status, 200);
    assert.ok(Array.isArray(r.data), 'Deve retornar array');
    if (r.data.length > 0) {
      const item = r.data[0];
      assert.ok('id_escala' in item);
      assert.ok('nome_escala' in item);
      assert.ok('confirmados' in item);
      assert.ok('quant_music' in item);
      assert.ok('data_hora' in item);
      assert.ok('dia' in item);
    }
  });

  test('retorna array vazio para dia sem escalas', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    // 01/01/2000 — sem escalas no seed
    const r = await client.api('GET', '/api/home/scale/day/01012000');
    assert.strictEqual(r.status, 200);
    assert.ok(Array.isArray(r.data));
    assert.strictEqual(r.data.length, 0);
  });

  /**
   * [SEC-006] Retorna escalas de todas as igrejas sem filtro.
   * Correção na Fase 3 (C3/D9).
   */
  test('[SEC-006] retorna escalas do dia sem filtro de igreja — documenta gap', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    const r = await client.api('GET', '/api/home/scale/day/14112026');
    console.warn(
      `[SEC-006] /home/scale/day retornou ${r.data?.length ?? '?'} escalas sem filtro de igreja. ` +
      'Corrigir na Fase 3.'
    );
  });

});
