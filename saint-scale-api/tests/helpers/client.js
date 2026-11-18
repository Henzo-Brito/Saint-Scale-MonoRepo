/**
 * helpers/client.js
 * Cliente HTTP compartilhado para os testes da saint-scale-api.
 *
 * Gerencia automaticamente o Bearer token após login.
 * Não usa cookies — a API atual usa apenas JWT.
 *
 * Uso:
 *   const { api, login } = createClient();
 *   await login('joao@example.com', 'senha123');
 *   const r = await api('GET', '/api/user/me');
 */

'use strict';

const BASE = process.env.BASE ?? 'http://localhost:3000';

/**
 * Cria um cliente isolado com token próprio.
 * Chame `login()` antes de usar rotas protegidas.
 */
export function createClient() {
  let token = null;

  async function api(method, path, body = undefined) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    return { status: res.status, headers: res.headers, data };
  }

  async function login(email, password) {
    const r = await api('POST', '/api/auth/login', { login: email, password });
    if (r.status !== 200 || !r.data?.accessToken) {
      throw new Error(
        `Login falhou para ${email}: status=${r.status} body=${JSON.stringify(r.data)}`
      );
    }
    token = r.data.accessToken;
    return r;
  }

  function setToken(t) {
    token = t;
  }

  function clearToken() {
    token = null;
  }

  return { api, login, setToken, clearToken };
}

/**
 * Instância global sem token — para rotas públicas.
 */
export const publicClient = createClient();
