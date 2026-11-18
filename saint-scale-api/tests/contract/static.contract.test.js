/**
 * tests/contract/static.contract.test.js
 *
 * [CONTRATO] Serviço de arquivos estáticos (frontend)
 *
 * O frontend legado (ENTREGA/public/) é servido via serveStatic.
 * Rotas /api/*, /doc e /scalar têm prioridade e não são interceptadas.
 */

'use strict';

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.BASE ?? 'http://localhost:3000';

describe('[CONTRATO] Static file serving', () => {

	test('GET / retorna index.html (200, text/html)', async () => {
		const res = await fetch(`${BASE}/`);
		assert.strictEqual(res.status, 200, `GET / deve retornar 200, recebeu ${res.status}`);
		const ct = res.headers.get('content-type') || '';
		assert.ok(ct.includes('text/html'), `Content-Type deve ser text/html, recebeu ${ct}`);
		const body = await res.text();
		assert.ok(body.includes('SaintScale'), 'index.html deve conter "SaintScale"');
	});

	test('GET /entrar.html retorna página de login (200, text/html)', async () => {
		const res = await fetch(`${BASE}/entrar.html`);
		assert.strictEqual(res.status, 200, `GET /entrar.html deve retornar 200, recebeu ${res.status}`);
		const ct = res.headers.get('content-type') || '';
		assert.ok(ct.includes('text/html'), `Content-Type deve ser text/html, recebeu ${ct}`);
	});

	test('GET /estilo.css retorna CSS (200, text/css)', async () => {
		const res = await fetch(`${BASE}/estilo.css`);
		assert.strictEqual(res.status, 200, `GET /estilo.css deve retornar 200, recebeu ${res.status}`);
		const ct = res.headers.get('content-type') || '';
		assert.ok(ct.includes('text/css'), `Content-Type deve ser text/css, recebeu ${ct}`);
	});

	test('GET /src/1.jpeg retorna imagem (200, image/jpeg)', async () => {
		const res = await fetch(`${BASE}/src/1.jpeg`);
		assert.strictEqual(res.status, 200, `GET /src/1.jpeg deve retornar 200, recebeu ${res.status}`);
		const ct = res.headers.get('content-type') || '';
		assert.ok(ct.includes('image/jpeg'), `Content-Type deve ser image/jpeg, recebeu ${ct}`);
	});

	test('GET /painel.js retorna JS (200)', async () => {
		const res = await fetch(`${BASE}/painel.js`);
		assert.strictEqual(res.status, 200, `GET /painel.js deve retornar 200, recebeu ${res.status}`);
	});

	test('GET /contas.js retorna JS (200)', async () => {
		const res = await fetch(`${BASE}/contas.js`);
		assert.strictEqual(res.status, 200, `GET /contas.js deve retornar 200, recebeu ${res.status}`);
	});

	test('GET /banco.sql retorna 403 (bloqueado)', async () => {
		const res = await fetch(`${BASE}/banco.sql`);
		assert.strictEqual(res.status, 403, `GET /banco.sql deve retornar 403, recebeu ${res.status}`);
	});

	test('GET /nonexistent-file retorna 404', async () => {
		const res = await fetch(`${BASE}/nonexistent-file`);
		assert.strictEqual(res.status, 404, `GET /nonexistent-file deve retornar 404, recebeu ${res.status}`);
	});

	test('GET /api/dados retorna 401 (API não interceptada por static)', async () => {
		const res = await fetch(`${BASE}/api/dados`);
		assert.strictEqual(res.status, 401, `GET /api/dados deve retornar 401, recebeu ${res.status}`);
	});

	test('GET /doc retorna 200 (OpenAPI não interceptado por static)', async () => {
		const res = await fetch(`${BASE}/doc`);
		assert.strictEqual(res.status, 200, `GET /doc deve retornar 200, recebeu ${res.status}`);
	});

	test('GET /scalar retorna 200 (Scalar não interceptado por static)', async () => {
		const res = await fetch(`${BASE}/scalar`);
		assert.strictEqual(res.status, 200, `GET /scalar deve retornar 200, recebeu ${res.status}`);
	});

	test('GET /cadastro-igreja.html retorna 404 (cadastro de igreja desativado)', async () => {
		const res = await fetch(`${BASE}/cadastro-igreja.html`);
		assert.strictEqual(res.status, 404, `GET /cadastro-igreja.html deve retornar 404, recebeu ${res.status}`);
	});

	test('GET /painel.html retorna 200', async () => {
		const res = await fetch(`${BASE}/painel.html`);
		assert.strictEqual(res.status, 200, `GET /painel.html deve retornar 200, recebeu ${res.status}`);
		const ct = res.headers.get('content-type') || '';
		assert.ok(ct.includes('text/html'), `Content-Type deve ser text/html, recebeu ${ct}`);
	});

});
