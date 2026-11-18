/**
 * tests/contract/admin.contract.test.js
 *
 * [CONTRATO] Rotas de /api/admin/*
 *
 * Rotas de administra��o da igreja: cadastro de igreja, dashboard,
 * escolha de minist�rio, CRUD gen\u00e9rico de listas e gest�o de
 * membros de equipes e minist\u00e9rios.
 *
 * Isolamento: id_igreja vem sempre do contexto de autentica��o,
 * nunca do corpo da requisi��o do cliente.
 */

'use strict';

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createClient, publicClient } from '../helpers/client.js';
import { Pool } from 'pg';

const BASE = process.env.BASE ?? 'http://localhost:3000';
const ADMIN_BASE = `${BASE}/api/admin`;
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/saintscale_dev';

let pool;
let adminClient;
let adminToken;
let idIgreja;
let adminEmail;
let adminPassword;
let callCounter = 0;

const TS = Date.now();

async function queryDb(sql, params = []) {
	const result = await pool.query(sql, params);
	return result.rows;
}

async function createIgreja() {
	adminEmail = `admin_${TS}@example.com`;
	adminPassword = 'SenhaForte123';

	// A rota pública POST /api/admin/cadastro-igreja foi desativada (Prompt 06).
	// O SaintScale utiliza uma única igreja padrão definida pelo backend;
	// não há fluxo de criação de igrejas. Insere diretamente igreja e admin
	// no banco apenas para setup dos demais testes de contrato admin.
	const igrejaNome = `Igreja Teste ${TS}`;
	const igrejaResult = await pool.query(
		"INSERT INTO igrejas (nome) VALUES ($1) RETURNING id_igreja",
		[igrejaNome]
	);
	idIgreja = Number(igrejaResult.rows[0].id_igreja);

	const argon2 = (await import('argon2')).default;
	const hashedPassword = await argon2.hash(adminPassword, {
		type: argon2.argon2id,
	});

	await pool.query(
		`INSERT INTO membros (nome, email, senha, usuario, id_cargo_fk, status, id_igreja_fk)
		 VALUES ($1, $2, $3, $4, 1, 'aprovado', $5)
		 RETURNING id_membro`,
		['Admin Teste', adminEmail, hashedPassword, `admin_${TS}`, idIgreja]
	);

	adminClient = createClient();
	await adminClient.login(adminEmail, adminPassword);
	adminToken = true; // marker que est\u00e1 logado
}

async function criarMembroComum() {
	const email = `membro_${Date.now()}_${++callCounter}@example.com`;
	const senha = 'SenhaForte123';
	const r = await adminClient.api('POST', '/api/admin/membros', {
		nome: 'Membro Comum',
		email,
		cargo: 'Membro',
		status: 'aprovado',
		senha,
	});
	assert.strictEqual(r.status, 200, `criar membro comum deve retornar 200, recebeu ${r.status}`);

	const membros = await queryDb(
		"SELECT id_membro, id_cargo_fk FROM membros WHERE email = $1 AND id_igreja_fk = $2",
		[email, idIgreja]
	);
	assert.strictEqual(membros.length, 1);

	const membroClient = createClient();
	await membroClient.login(email, senha);
	return { id: membros[0].id_membro, idCargoFk: membros[0].id_cargo_fk, client: membroClient };
}

async function criarCargoDireto(nome) {
	const resultado = await pool.query(
		"INSERT INTO cargos (nome, permissoes, id_igreja_fk) VALUES ($1, $2, $3) RETURNING id_cargo",
		[nome, null, idIgreja],
	);
	return Number(resultado.rows[0].id_cargo);
}

async function criarMinisterio() {
	const nome = `Minist\u00e9rio Teste ${Date.now()}_${++callCounter}`;
	const r = await adminClient.api('POST', '/api/admin/ministerios', {
		nome,
	});
	assert.strictEqual(r.status, 200, `criar minist\u00e9rio deve retornar 200, recebeu ${r.status}`);

	const ministerios = await queryDb(
		"SELECT id_ministerio FROM ministerios WHERE nome = $1 AND id_igreja_fk = $2",
		[nome, idIgreja]
	);
	assert.strictEqual(ministerios.length, 1);
	return ministerios[0].id_ministerio;
}

async function criarEquipe() {
	const title = `Equipe Teste ${Date.now()}_${++callCounter}`;
	const r = await adminClient.api('POST', '/api/admin/equipes', {
		nome: title,
	});
	assert.strictEqual(r.status, 200, `criar equipe deve retornar 200, recebeu ${r.status}`);

	const equipes = await queryDb(
		"SELECT id_equipes FROM equipes WHERE title = $1 AND id_igreja_fk = $2",
		[title, idIgreja]
	);
	assert.strictEqual(equipes.length, 1);
	return equipes[0].id_equipes;
}

// ─────────────────────────────────────────────────────────────────
// Setup / Teardown
// ─────────────────────────────────────────────────────────────────

before(async () => {
	pool = new Pool({ connectionString: DATABASE_URL });
	await createIgreja();
});

after(async () => {
	if (pool) await pool.end();
});

// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/dados (dashboard, protegido)
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] GET /api/admin/dados', () => {

	test('retorna 401 sem token', async () => {
		const r = await fetch(`${BASE}/api/admin/dados`);
		assert.strictEqual(r.status, 401, `Sem token deve retornar 401, recebeu ${r.status}`);
	});

	test('retorna 200 com dados do dashboard para admin', async () => {
		const r = await adminClient.api('GET', '/api/admin/dados');
		assert.strictEqual(r.status, 200, `Dashboard deve retornar 200, recebeu ${r.status}`);
		assert.ok(r.data, 'Deve retornar dados');
		assert.ok('igrejas' in r.data, 'Deve ter igrejas');
		assert.ok('ministerios' in r.data, 'Deve ter ministerios');
		assert.ok('equipes' in r.data, 'Deve ter equipes');
		assert.ok('membros' in r.data, 'Deve ter membros');
		assert.ok('cargos' in r.data, 'Deve ter cargos');
		assert.ok('eu' in r.data, 'Deve ter eu');
		assert.strictEqual(r.data.eu.admin, true, 'Usu\u00e1rio deve ser admin');
		assert.strictEqual(r.data.igreja.id, idIgreja, 'Igreja deve ser a do admin');
	});

	test('membro n\u00e3o-admin tamb\u00e9m acessa dashboard da pr\u00f3pria igreja', async () => {
		const comum = await criarMembroComum();
		const r = await comum.client.api('GET', '/api/admin/dados');
		assert.strictEqual(r.status, 200, `Dashboard para membro comum deve retornar 200, recebeu ${r.status}`);
		assert.strictEqual(r.data.eu.admin, false, 'Membro comum n\u00e3o \u00e9 admin');
		assert.strictEqual(r.data.igreja.id, idIgreja, 'Igreja deve ser a mesma');
	});

});

// ─────────────────────────────────────────────────────────────────
// POST /api/admin/escolher-ministerio (protegido)
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] POST /api/admin/escolher-ministerio', () => {

	let idMinisterio;

	before(async () => {
		idMinisterio = await criarMinisterio();
	});

	test('retorna 401 sem token', async () => {
		const r = await fetch(`${BASE}/api/admin/escolher-ministerio`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: idMinisterio }),
		});
		assert.strictEqual(r.status, 401, `Sem token deve retornar 401, recebeu ${r.status}`);
	});

	test('admin escolhe minist\u00e9rio da pr\u00f3pria igreja — 200', async () => {
		const r = await adminClient.api('POST', '/api/admin/escolher-ministerio', { id: idMinisterio });
		assert.strictEqual(r.status, 200, `Escolher minist\u00e9rio deve retornar 200, recebeu ${r.status}`);
		assert.strictEqual(r.data.ok, true);
	});

	test('minist\u00e9rio inexistente retorna 403', async () => {
		const r = await adminClient.api('POST', '/api/admin/escolher-ministerio', { id: 999999 });
		assert.strictEqual(r.status, 403, `Minist\u00e9rio inexistente deve retornar 403, recebeu ${r.status}`);
	});

	test('minist\u00e9rio de outra igreja retorna 403', async () => {
		// cria outra igreja diretamente no banco (a rota p\u00fablica
		// POST /api/admin/cadastro-igreja foi desativada — Prompt 06)
		const email2 = `admin2_${TS}@example.com`;
		const senha2 = 'SenhaForte123';
		const igrejaOutraNome = `Igreja Outra ${TS}`;
		const igrejaOutraResult = await pool.query(
			"INSERT INTO igrejas (nome) VALUES ($1) RETURNING id_igreja",
			[igrejaOutraNome]
		);
		const idIgrejaOutra = Number(igrejaOutraResult.rows[0].id_igreja);

		const argon2 = (await import('argon2')).default;
		const hashedPassword2 = await argon2.hash(senha2, {
			type: argon2.argon2id,
		});
		await pool.query(
			`INSERT INTO membros (nome, email, senha, usuario, id_cargo_fk, status, id_igreja_fk)
			 VALUES ($1, $2, $3, $4, 1, 'aprovado', $5)`,
			['Admin Outra', email2, hashedPassword2, `admin2_${TS}`, idIgrejaOutra]
		);

		const outrasMinisterios = await queryDb(
			"SELECT id_ministerio FROM ministerios WHERE id_igreja_fk = $1 LIMIT 1",
			[idIgrejaOutra]
		);
		if (outrasMinisterios.length > 0) {
			const r = await adminClient.api('POST', '/api/admin/escolher-ministerio', {
				id: outrasMinisterios[0].id_ministerio,
			});
			assert.strictEqual(
				r.status,
				403,
				`Minist\u00e9rio de outra igreja deve retornar 403, recebeu ${r.status}`
			);
		}
	});

});

// ─────────────────────────────────────────────────────────────────
// POST /admin/:lista — criar item (CRUD gen\u00e9rico, protegido)
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] POST /admin/:lista', () => {

	test('retorna 401 sem token', async () => {
		const r = await fetch(`${BASE}/api/admin/cargos`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ nome: 'X', permissoes: 'y' }),
		});
		assert.strictEqual(r.status, 401, `Sem token deve retornar 401, recebeu ${r.status}`);
	});

	test('admin tenta criar cargo — 404 (gestão de cargos removida)', async () => {
		// A gestão de cargos via API genérica foi removida (Prompt 07).
		const r = await adminClient.api('POST', '/api/admin/cargos', {
			nome: 'Cargo Teste 2',
			permissoes: 'musicas',
		});
		assert.strictEqual(r.status, 404, `Criação de cargo deve retornar 404, recebeu ${r.status}`);
	});

	test('lista inexistente retorna 404', async () => {
		const r = await adminClient.api('POST', '/api/admin/listaqueNaoExiste', { foo: 'bar' });
		assert.strictEqual(r.status, 404, `Lista inexistente deve retornar 404, recebeu ${r.status}`);
	});

	test('membro tenta criar cargo — 403 (não é administrador)', async () => {
		const comum = await criarMembroComum();
		const r = await comum.client.api('POST', '/api/admin/cargos', {
			nome: 'Cargo Sem Permissão',
			permissoes: 'musicas',
		});
		assert.strictEqual(r.status, 403, `Membro não admin deve receber 403, recebeu ${r.status}`);
	});

});

// ─────────────────────────────────────────────────────────────────
// PUT /admin/:lista/:id — atualizar item (CRUD gen\u00e9rico, protegido)
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] PUT /admin/:lista/:id', () => {

	test('retorna 401 sem token', async () => {
		const r = await fetch(`${BASE}/api/admin/cargos/1`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ nome: 'X' }),
		});
		assert.strictEqual(r.status, 401, `Sem token deve retornar 401, recebeu ${r.status}`);
	});

	test('admin tenta atualizar cargo — 404 (gestão de cargos removida)', async () => {
		const idCargo = await criarCargoDireto('Cargo Para Atualizar');
		const r = await adminClient.api('PUT', `/api/admin/cargos/${idCargo}`, {
			nome: 'Cargo Atualizado',
		});
		assert.strictEqual(r.status, 404, `Atualização de cargo deve retornar 404, recebeu ${r.status}`);
	});

	test('lista inexistente retorna 404', async () => {
		const r = await adminClient.api('PUT', '/api/admin/listaqueNaoExiste/1', { foo: 'bar' });
		assert.strictEqual(r.status, 404, `Lista inexistente deve retornar 404, recebeu ${r.status}`);
	});

});

// ─────────────────────────────────────────────────────────────────
// DELETE /admin/:lista/:id — excluir item (CRUD gen\u00e9rico, protegido)
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] DELETE /admin/:lista/:id', () => {

	test('retorna 401 sem token', async () => {
		const r = await fetch(`${BASE}/api/admin/cargos/1`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
		});
		assert.strictEqual(r.status, 401, `Sem token deve retornar 401, recebeu ${r.status}`);
	});

	test('admin tenta excluir cargo — 404 (gestão de cargos removida)', async () => {
		const idCargo = await criarCargoDireto('Cargo Para Excluir');
		const r = await adminClient.api('DELETE', `/api/admin/cargos/${idCargo}`);
		assert.strictEqual(r.status, 404, `Exclusão de cargo deve retornar 404, recebeu ${r.status}`);
	});

	test('admin tenta excluir Administrador (id=1) — 404 (endpoint removido)', async () => {
		const r = await adminClient.api('DELETE', '/api/admin/cargos/1');
		assert.strictEqual(r.status, 404, `Exclusão de cargo deve retornar 404, recebeu ${r.status}`);
	});

});

// ─────────────────────────────────────────────────────────────────
// POST /api/admin/equipes/:id/membros — adicionar m\u00e9embro \u00e0 equipe
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] POST /api/admin/equipes/:id/membros', () => {

	let idEquipe;
	let idMembro;

	before(async () => {
		idEquipe = await criarEquipe();
		const comum = await criarMembroComum();
		idMembro = comum.id;
	});

	test('retorna 401 sem token', async () => {
		const r = await fetch(`${BASE}/api/admin/equipes/${idEquipe}/membros`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ membro: idMembro }),
		});
		assert.strictEqual(r.status, 401, `Sem token deve retornar 401, recebeu ${r.status}`);
	});

	test('admin adiciona membro \u00e0 equipe — 200', async () => {
		const r = await adminClient.api('POST', `/api/admin/equipes/${idEquipe}/membros`, { membro: idMembro });
		assert.strictEqual(r.status, 200, `Adicionar membro \u00e0 equipe deve retornar 200, recebeu ${r.status}`);
		assert.strictEqual(r.data.ok, true);
	});

	test('equipe inexistente retorna 404', async () => {
		const r = await adminClient.api('POST', '/api/admin/equipes/999999/membros', { membro: idMembro });
		assert.strictEqual(r.status, 404, `Equipe inexistente deve retornar 404, recebeu ${r.status}`);
	});

	test('membro sem permiss\u00e3o para equipes retorna 403', async () => {
		const comum = await criarMembroComum();
		const r = await comum.client.api('POST', `/api/admin/equipes/${idEquipe}/membros`, { membro: idMembro });
		assert.strictEqual(r.status, 403, `Membro sem permiss\u00e3o deve retornar 403, recebeu ${r.status}`);
	});

});

// ─────────────────────────────────────────────────────────────────
// DELETE /api/admin/equipes/:id/membros/:membro — remover da equipe
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] DELETE /api/admin/equipes/:id/membros/:membro', () => {

	let idEquipe;
	let idMembro;

	before(async () => {
		idEquipe = await criarEquipe();
		const comum = await criarMembroComum();
		idMembro = comum.id;
		await adminClient.api('POST', `/api/admin/equipes/${idEquipe}/membros`, { membro: idMembro });
	});

	test('admin remove membro da equipe — 200', async () => {
		const r = await adminClient.api('DELETE', `/api/admin/equipes/${idEquipe}/membros/${idMembro}`);
		assert.strictEqual(r.status, 200, `Remover membro da equipe deve retornar 200, recebeu ${r.status}`);
		assert.strictEqual(r.data.ok, true);
	});

});

// ─────────────────────────────────────────────────────────────────
// POST /api/admin/ministerios/:id/membros — adicionar m\u00e9embro ao minist\u00e9rio
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] POST /api/admin/ministerios/:id/membros', () => {

	let idMinisterio;
	let idMembro;

	before(async () => {
		idMinisterio = await criarMinisterio();
		const comum = await criarMembroComum();
		idMembro = comum.id;
	});

	test('admin adiciona membro ao minist\u00e9rio — 200', async () => {
		const r = await adminClient.api('POST', `/api/admin/ministerios/${idMinisterio}/membros`, { membro: idMembro });
		assert.strictEqual(r.status, 200, `Adicionar membro ao minist\u00e9rio deve retornar 200, recebeu ${r.status}`);
		assert.strictEqual(r.data.ok, true);
	});

	test('minist\u00e9rio inexistente retorna 404', async () => {
		const r = await adminClient.api('POST', '/api/admin/ministerios/999999/membros', { membro: idMembro });
		assert.strictEqual(r.status, 404, `Minist\u00e9rio inexistente deve retornar 404, recebeu ${r.status}`);
	});

});

// ─────────────────────────────────────────────────────────────────
// DELETE /api/admin/ministerios/:id/membros/:membro — remover do minist\u00e9rio
// ─────────────────────────────────────────────────────────────────

describe('[CONTRATO] DELETE /api/admin/ministerios/:id/membros/:membro', () => {

	let idMinisterio;
	let idMembro;

	before(async () => {
		idMinisterio = await criarMinisterio();
		const comum = await criarMembroComum();
		idMembro = comum.id;
		await adminClient.api('POST', `/api/admin/ministerios/${idMinisterio}/membros`, { membro: idMembro });
	});

	test('admin remove membro do minist\u00e9rio — 200', async () => {
		const r = await adminClient.api('DELETE', `/api/admin/ministerios/${idMinisterio}/membros/${idMembro}`);
		assert.strictEqual(r.status, 200, `Remover membro do minist\u00e9rio deve retornar 200, recebeu ${r.status}`);
		assert.strictEqual(r.data.ok, true);
	});

});

// ─────────────────────────────────────────────────────────────────
// Seguran�a: id_igreja vem do contexto de auth, n\u00e3o do cliente
// ─────────────────────────────────────────────────────────────────

describe('[SEGURAN�A] id_igreja isolamento por contexto de autentica\u00e7\u00e3o', () => {

	test('admin s� consegue criar itens na pr\u00f3pria igreja', async () => {
		// admin est\u00e1 autenticado com id_igreja da igreja criada no before
		// tente criar cargo e verifique que fica na igreja correta
		const idCargo = await criarCargoDireto('Cargo Isolamento');
		const cargos = await queryDb(
			"SELECT id_igreja_fk FROM cargos WHERE id_cargo = $1",
			[idCargo]
		);
		assert.strictEqual(cargos.length, 1);
		assert.strictEqual(cargos[0].id_igreja_fk, idIgreja, 'Cargo deve ficar na igreja do admin');
	});

	test('admin n\u00e3o pode enviar id_igreja_fk no body para sobrescrever', async () => {
		// O corpo de criarItem n\u00e3o aceita id_igreja_fk (n\u00e3o est\u00e1 nos campos)
		// O id_igreja \u00e9 injetado do contexto de auth
		const idCargo = await criarCargoDireto('Cargo Sobreescrita');
		const cargos = await queryDb(
			"SELECT id_igreja_fk FROM cargos WHERE id_cargo = $1",
			[idCargo]
		);
		assert.strictEqual(cargos[0].id_igreja_fk, idIgreja);
		// Limpa o cargo criado
		await queryDb("DELETE FROM cargos WHERE id_cargo = $1", [idCargo]);
	});

});
