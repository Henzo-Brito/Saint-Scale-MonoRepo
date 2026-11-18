/**
 * Cliente de API compartilhado para o painel administrativo do frontend saint-scale.
 * Usa JWT armazenado em localStorage para autenticação.
 * Espelha a identidade visual e os contratos de saint-scale-api/src/admin-web/js/app.js.
 */
const API_BASE = "";

let token = localStorage.getItem("saint_scale_token") || "";

function setToken(newToken) {
	token = newToken;
	if (newToken) {
		localStorage.setItem("saint_scale_token", newToken);
	} else {
		localStorage.removeItem("saint_scale_token");
	}
}

function isAuthenticated() {
	return !!token;
}

function logout() {
	setToken("");
	window.location.href = "/admin/index.html";
}

async function apiRequest(path, options = {}) {
	const headers = {
		"Content-Type": "application/json",
		...(options.headers || {}),
	};

	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const response = await fetch(`${API_BASE}${path}`, {
		...options,
		headers,
	});

	if (response.status === 401 || response.status === 403) {
		logout();
		throw new Error("Não autorizado");
	}

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.erro || `Erro ${response.status}`);
	}

	return response.json();
}

// ── Rotas de auth (públicas) ──
const authApi = {
	login: (data) =>
		apiRequest("/api/auth/login", {
			method: "POST",
			body: JSON.stringify(data),
		}),
};

// ── Rotas de admin ──
const adminApi = {
	// Dashboard
	getDashboard: () => apiRequest("/api/admin/dados"),

	// Membros (via lista genérica)
	listarMembros: () => apiRequest("/api/admin/membros"),
	criarMembro: (data) =>
		apiRequest("/api/admin/membros", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	atualizarMembro: (id, data) =>
		apiRequest(`/api/admin/membros/${id}`, {
			method: "PUT",
			body: JSON.stringify(data),
		}),
	excluirMembro: (id) =>
		apiRequest(`/api/admin/membros/${id}`, { method: "DELETE" }),

	// Ministérios
	listarMinisterios: () => apiRequest("/api/admin/ministerios"),
	criarMinisterio: (data) =>
		apiRequest("/api/admin/ministerios", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	atualizarMinisterio: (id, data) =>
		apiRequest(`/api/admin/ministerios/${id}`, {
			method: "PUT",
			body: JSON.stringify(data),
		}),
	excluirMinisterio: (id) =>
		apiRequest(`/api/admin/ministerios/${id}`, { method: "DELETE" }),

	// Equipes
	listarEquipes: () => apiRequest("/api/admin/equipes"),
	criarEquipe: (data) =>
		apiRequest("/api/admin/equipes", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	atualizarEquipe: (id, data) =>
		apiRequest(`/api/admin/equipes/${id}`, {
			method: "PUT",
			body: JSON.stringify(data),
		}),
	excluirEquipe: (id) =>
		apiRequest(`/api/admin/equipes/${id}`, { method: "DELETE" }),

	// Locais
	listarLocais: () => apiRequest("/api/admin/locais"),
	criarLocal: (data) =>
		apiRequest("/api/admin/locais", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	atualizarLocal: (id, data) =>
		apiRequest(`/api/admin/locais/${id}`, {
			method: "PUT",
			body: JSON.stringify(data),
		}),
	excluirLocal: (id) =>
		apiRequest(`/api/admin/locais/${id}`, { method: "DELETE" }),

	// Músicas
	listarMusicas: () => apiRequest("/api/admin/musicas"),
	criarMusica: (data) =>
		apiRequest("/api/admin/musicas", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	atualizarMusica: (id, data) =>
		apiRequest(`/api/admin/musicas/${id}`, {
			method: "PUT",
			body: JSON.stringify(data),
		}),
	excluirMusica: (id) =>
		apiRequest(`/api/admin/musicas/${id}`, { method: "DELETE" }),

	// Escalas
	listarEscalas: () => apiRequest("/api/admin/escalas"),
	criarEscala: (data) =>
		apiRequest("/api/admin/escalas", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	atualizarEscala: (id, data) =>
		apiRequest(`/api/admin/escalas/${id}`, {
			method: "PUT",
			body: JSON.stringify(data),
		}),
	excluirEscala: (id) =>
		apiRequest(`/api/admin/escalas/${id}`, { method: "DELETE" }),

	// Membros de equipe
	listarMembrosEquipe: (idEquipe) =>
		apiRequest(`/api/admin/equipes/${idEquipe}/membros`),
	adicionarMembroEquipe: (idEquipe, idMembro) =>
		apiRequest(`/api/admin/equipes/${idEquipe}/membros`, {
			method: "POST",
			body: JSON.stringify({ membro: idMembro }),
		}),
	removerMembroEquipe: (idEquipe, idMembro) =>
		apiRequest(`/api/admin/equipes/${idEquipe}/membros/${idMembro}`, {
			method: "DELETE",
		}),

	// Membros de ministério
	listarMembrosMinisterio: (idMinisterio) =>
		apiRequest(`/api/admin/ministerios/${idMinisterio}/membros`),
	adicionarMembroMinisterio: (idMinisterio, idMembro) =>
		apiRequest(`/api/admin/ministerios/${idMinisterio}/membros`, {
			method: "POST",
			body: JSON.stringify({ membro: idMembro }),
		}),
	removerMembroMinisterio: (idMinisterio, idMembro) =>
		apiRequest(`/api/admin/ministerios/${idMinisterio}/membros/${idMembro}`, {
			method: "DELETE",
		}),

	// Membros de escala
	listarMembrosEscala: (idEscala) =>
		apiRequest(`/api/admin/escalas/${idEscala}/membros`),
	adicionarMembroEscala: (idEscala, idMembro) =>
		apiRequest(`/api/admin/escalas/${idEscala}/membros`, {
			method: "POST",
			body: JSON.stringify({ membro: idMembro }),
		}),
	removerMembroEscala: (idEscala, idMembro) =>
		apiRequest(`/api/admin/escalas/${idEscala}/membros/${idMembro}`, {
			method: "DELETE",
		}),

	// Funções ministeriais na escala
	listarFuncoes: () => apiRequest("/api/admin/escalas/funcoes"),
	atribuirFuncaoMembroEscala: (idEscala, idMembro, idFuncao) =>
		apiRequest(`/api/admin/escalas/${idEscala}/membros/${idMembro}/funcao`, {
			method: "PATCH",
			body: JSON.stringify({ funcao: idFuncao }),
		}),

	// Músicas da escala
	listarMusicasEscala: (idEscala) =>
		apiRequest(`/api/admin/escalas/${idEscala}/musicas`),
	adicionarMusicaEscala: (idEscala, idMusica) =>
		apiRequest(`/api/admin/escalas/${idEscala}/musicas`, {
			method: "POST",
			body: JSON.stringify({ id_musica: idMusica }),
		}),
	atualizarTomMusicaEscala: (idEscala, idMusicaEscala, tom) =>
		apiRequest(`/api/admin/escalas/${idEscala}/musicas/${idMusicaEscala}/tom`, {
			method: "PATCH",
			body: JSON.stringify({ tom: tom || null }),
		}),
	removerMusicaEscala: (idEscala, idMusicEscalas) =>
		apiRequest(`/api/admin/escalas/${idEscala}/musicas/${idMusicEscalas}`, {
			method: "DELETE",
		}),

	// Avisos / lembretes
	listarLembretes: () => apiRequest("/api/admin/lembretes"),
	criarLembrete: (dados) =>
		apiRequest("/api/admin/lembretes", {
			method: "POST",
			body: JSON.stringify(dados),
		}),
	atualizarLembrete: (id, dados) =>
		apiRequest(`/api/admin/lembretes/${id}`, {
			method: "PUT",
			body: JSON.stringify(dados),
		}),
	removerLembrete: (id) =>
		apiRequest(`/api/admin/lembretes/${id}`, { method: "DELETE" }),

	// Cargos
	listarCargos: () => apiRequest("/api/admin/cargos"),
	criarCargo: (data) =>
		apiRequest("/api/admin/cargos", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	atualizarCargo: (id, data) =>
		apiRequest(`/api/admin/cargos/${id}`, {
			method: "PUT",
			body: JSON.stringify(data),
		}),
	excluirCargo: (id) =>
		apiRequest(`/api/admin/cargos/${id}`, { method: "DELETE" }),

	// Funções da Igreja (CRUD pelo admin)
	listarFuncoesIgreja: () => apiRequest("/api/admin/funcoes"),
	criarFuncaoIgreja: (data) =>
		apiRequest("/api/admin/funcoes", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	atualizarFuncaoIgreja: (id, data) =>
		apiRequest(`/api/admin/funcoes/${id}`, {
			method: "PUT",
			body: JSON.stringify(data),
		}),
	excluirFuncaoIgreja: (id) =>
		apiRequest(`/api/admin/funcoes/${id}`, { method: "DELETE" }),
};

// ── Utilitários de UI ──
function showAlert(containerId, message, type = "error") {
	const container = document.getElementById(containerId);
	if (!container) return;
	container.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
	setTimeout(() => {
		container.innerHTML = "";
	}, 5000);
}

function clearAlert(containerId) {
	const container = document.getElementById(containerId);
	if (container) container.innerHTML = "";
}

function escapeHtml(text) {
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

function formatDate(isoDate) {
	if (!isoDate) return "—";
	const d = new Date(isoDate);
	return d.toLocaleDateString("pt-BR");
}

function badgeForStatus(status) {
	const classes = {
		pendente: "badge-pendente",
		aprovado: "badge-aprovado",
	};
	return `<span class="badge ${classes[status] || ""}">${escapeHtml(status || "—")}</span>`;
}

function badgeForRole(role) {
	let nome = role;
	if (typeof role === "number") {
		nome = role === 1 ? "Administrador" : "Membro";
	} else if (role == null) {
		nome = "Membro";
	}
	const classes = {
		membro: "badge-membro",
		administrador: "badge-admin",
	};
	const chave = nome === "Administrador" ? "administrador" : "membro";
	return `<span class="badge ${classes[chave] || ""}">${escapeHtml(nome || "—")}</span>`;
}

// Export for use in page scripts
window.saintScaleAdmin = {
	setToken,
	isAuthenticated,
	logout,
	auth: authApi,
	api: adminApi,
	showAlert,
	clearAlert,
	escapeHtml,
	formatDate,
	badgeForStatus,
	badgeForRole,
};
