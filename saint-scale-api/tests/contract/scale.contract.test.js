/**
 * tests/contract/scale.contract.test.js
 *
 * [CONTRATO] Rotas de /api/scale/* e /api/music/*
 *
 * Documenta o comportamento ATUAL ANTES de migrations.
 *
 * Vulnerabilidades documentadas (não corrigidas):
 *   - SEC-001: GET /api/scale/{id} — IDOR por ID de escala
 *   - SEC-003: POST /api/scale/substituir — IDOR por id_membro_escala
 *   - SEC-006: (coberto em home.contract — /home/scale/day)
 */

'use strict';

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '../helpers/client.js';

const TEST_EMAIL    = process.env.TEST_EMAIL    ?? 'joao@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? '';
const BASE          = process.env.BASE          ?? 'http://localhost:3000';

// IDs do seed do tcc.sql
const ESCALA_EXISTENTE = '1';    // Escala "Mavi" — 14/11/2026
const MUSICA_ESCALA_1  = '1';   // primeira musica_escala do seed

let client;

before(async () => {
  if (!TEST_PASSWORD) return;
  client = createClient();
  await client.login(TEST_EMAIL, TEST_PASSWORD);
});

// ─────────────────────────────────────────────────────────────────
// GET /api/scale/{id}
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] GET /api/scale/{id}', () => {

  test('retorna 401 sem token', async () => {
    const r = await fetch(`${BASE}/api/scale/1`);
    assert.strictEqual(r.status, 401);
  });

  test('retorna 404 para escala inexistente', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    const r = await client.api('GET', '/api/scale/999999');
    assert.strictEqual(r.status, 404);
  });

  test('retorna 200 com shape correto para escala existente', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    const r = await client.api('GET', `/api/scale/${ESCALA_EXISTENTE}`);
    assert.ok(r.status === 200 || r.status === 404, `Recebido: ${r.status}`);
    if (r.status === 200) {
      assert.ok('id_escala' in r.data, 'deve ter id_escala');
      assert.ok('nome' in r.data, 'deve ter nome');
      assert.ok('dia' in r.data, 'deve ter dia — string DD');
      assert.ok('dia_da_semana' in r.data, 'deve ter dia_da_semana');
      assert.ok('data' in r.data, 'deve ter data — string DD/MM/YYYY');
      // dia deve ser string de 2 dígitos
      assert.match(r.data.dia, /^\d{2}$/);
      // data deve ser DD/MM/YYYY
      assert.match(r.data.data, /^\d{2}\/\d{2}\/\d{4}$/);
    }
  });

  /**
   * [SEC-001] IDOR: GET /api/scale/{id} retorna dados de qualquer escala
   * sem verificar se pertence à igreja do usuário autenticado.
   * Correção na Fase 3 (D9).
   */
  test('[SEC-001][PENDENTE] IDOR em /scale/{id} — verificação de pertencimento ausente', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    // Com schema atual (sem igrejas), não há como demonstrar IDOR entre igrejas.
    // Placeholder para demonstração completa após Migration 001 + 003.
    console.warn(
      '[SEC-001] GET /api/scale/{id} sem filtro de id_igreja_fk. ' +
      'Corrigir na Fase 3 (D9 — verificar que escala pertence à igreja do token).'
    );
  });

});

// ─────────────────────────────────────────────────────────────────
// GET /api/scale/{id}/musics
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] GET /api/scale/{id}/musics', () => {

  test('retorna 401 sem token', async () => {
    const r = await fetch(`${BASE}/api/scale/1/musics`);
    assert.strictEqual(r.status, 401);
  });

  test('retorna 200 com array de músicas', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    const r = await client.api('GET', `/api/scale/${ESCALA_EXISTENTE}/musics`);
    assert.strictEqual(r.status, 200);
    assert.ok(Array.isArray(r.data));
    if (r.data.length > 0) {
      const m = r.data[0];
      assert.ok('id_music_escalas' in m);
      assert.ok('nome' in m);
      assert.ok('banda' in m);
      assert.ok('ordem' in m);
      assert.ok('tom' in m);
      assert.ok('image_id' in m);
    }
  });

});

// ─────────────────────────────────────────────────────────────────
// GET /api/scale/{id}/music/{id_music_escalas}
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] GET /api/scale/{id}/music/{id_music_escalas}', () => {

  test('retorna 401 sem token', async () => {
    const r = await fetch(`${BASE}/api/scale/1/music/1`);
    assert.strictEqual(r.status, 401);
  });

  test('retorna 200 com detalhe completo da música na escala', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    const r = await client.api('GET', `/api/scale/${ESCALA_EXISTENTE}/music/${MUSICA_ESCALA_1}`);
    assert.ok(r.status === 200 || r.status === 404, `Recebido: ${r.status}`);
    if (r.status === 200) {
      const m = r.data;
      assert.ok('id_musica' in m);
      assert.ok('nome' in m);
      assert.ok('tom_atual' in m);
      assert.ok('tom_original' in m);
      assert.ok('link_spotify' in m);
      assert.ok('link_youtube' in m);
      assert.ok('link_cifra' in m);
      assert.ok('link_letra' in m);
      assert.ok('duracao' in m);
    }
  });

  test('retorna 404 para combinação inválida de escala/música', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    const r = await client.api('GET', '/api/scale/999999/music/999999');
    assert.strictEqual(r.status, 404);
  });

});

// ─────────────────────────────────────────────────────────────────
// GET /api/scale/{id}/info
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] GET /api/scale/{id}/info', () => {

  test('retorna 401 sem token', async () => {
    const r = await fetch(`${BASE}/api/scale/1/info`);
    assert.strictEqual(r.status, 401);
  });

  test('retorna 200 com shape correto para escala existente', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    const r = await client.api('GET', `/api/scale/${ESCALA_EXISTENTE}/info`);
    assert.ok(r.status === 200 || r.status === 404);
    if (r.status === 200) {
      assert.ok('id_escala' in r.data);
      assert.ok('membros_confirmados' in r.data);
      assert.ok('local' in r.data); // string|null — vem de escalas.local (VARCHAR)
      assert.ok('indisponibilidades' in r.data);
      assert.ok(Array.isArray(r.data.indisponibilidades));
      // Nota D5: local vem de escalas.local (VARCHAR livre) — após D5 virá de JOIN com logradouro
    }
  });

});

// ─────────────────────────────────────────────────────────────────
// GET /api/scale/{id}/members
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] GET /api/scale/{id}/members', () => {

  test('retorna 401 sem token', async () => {
    const r = await fetch(`${BASE}/api/scale/1/members`);
    assert.strictEqual(r.status, 401);
  });

  test('retorna 200 com array de membros da escala', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    const r = await client.api('GET', `/api/scale/${ESCALA_EXISTENTE}/members`);
    assert.ok(r.status === 200 || r.status === 404);
    if (r.status === 200) {
      assert.ok(Array.isArray(r.data));
      for (const m of r.data) {
        assert.ok('id_membro_escala' in m);
        assert.ok('nome' in m);
        assert.ok('funcao' in m);      // papel musical (funcoes)
        assert.ok('disponibilidade' in m);
        assert.ok('image_id' in m);
        // disponibilidade deve ser um dos valores do ENUM
        assert.ok(
          ['confirmado', 'indisponível', 'pendente'].includes(m.disponibilidade),
          `disponibilidade inválida: ${m.disponibilidade}`
        );
      }
    }
  });

});

// ─────────────────────────────────────────────────────────────────
// POST /api/scale/sair
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] POST /api/scale/sair', () => {

  test('retorna 401 sem token', async () => {
    const r = await fetch(`${BASE}/api/scale/sair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_escala: '1' }),
    });
    assert.strictEqual(r.status, 401);
  });

  test('rejeita corpo sem id_escala — retorna 400 ou 422', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    const r = await client.api('POST', '/api/scale/sair', {});
    assert.ok(r.status === 400 || r.status === 422, `Recebido: ${r.status}`);
  });

});

// ─────────────────────────────────────────────────────────────────
// POST /api/scale/substituir
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] POST /api/scale/substituir', () => {

  test('retorna 401 sem token', async () => {
    const r = await fetch(`${BASE}/api/scale/substituir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_membro_escala: '1' }),
    });
    assert.strictEqual(r.status, 401);
  });

  test('rejeita corpo sem id_membro_escala — retorna 400 ou 422', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    const r = await client.api('POST', '/api/scale/substituir', {});
    assert.ok(r.status === 400 || r.status === 422, `Recebido: ${r.status}`);
  });

  test('retorna 404 para id_membro_escala inexistente', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    const r = await client.api('POST', '/api/scale/substituir', { id_membro_escala: '999999' });
    assert.ok(r.status === 404 || r.status === 400, `Recebido: ${r.status}`);
  });

  /**
   * [SEC-003] IDOR em POST /api/scale/substituir.
   * Um usuário pode informar qualquer id_membro_escala (mesmo de outra igreja)
   * e se inserir naquela posição. Não há verificação de que o registro pertence
   * à mesma igreja do usuário autenticado.
   * Correção na Fase 3 (D9).
   */
  test('[SEC-003][PENDENTE] IDOR em substituir — verificação de pertencimento ausente', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    console.warn(
      '[SEC-003] POST /api/scale/substituir não verifica se id_membro_escala pertence ' +
      'à mesma igreja do usuário autenticado. Corrigir na Fase 3 (D9).'
    );
  });

});

// ─────────────────────────────────────────────────────────────────
// GET /api/music/{id_music_escalas}
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] GET /api/music/{id_music_escalas}', () => {

  test('retorna 401 sem token', async () => {
    const r = await fetch(`${BASE}/api/music/1`);
    assert.strictEqual(r.status, 401);
  });

  test('retorna 200 com detalhe da música escalada pelo ID de musica_escala', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    const r = await client.api('GET', `/api/music/${MUSICA_ESCALA_1}`);
    assert.ok(r.status === 200 || r.status === 404, `Recebido: ${r.status}`);
    if (r.status === 200) {
      // mesmo shape de /scale/{id}/music/{id_music_escalas}
      assert.ok('id_musica' in r.data);
      assert.ok('nome' in r.data);
      assert.ok('duracao' in r.data);
    }
  });

  test('retorna 404 para id_music_escalas inexistente', async () => {
    if (!TEST_PASSWORD) { console.warn('[PULADO]'); return; }
    const r = await client.api('GET', '/api/music/999999');
    assert.strictEqual(r.status, 404);
  });

});
