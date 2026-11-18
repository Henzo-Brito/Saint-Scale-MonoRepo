import apiRoute from "./routes/api.js";
import { createApp } from "./tools/createAppRoute.js";
import { serveStatic } from "hono/serve-static";
import { readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const app = createApp();

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Pasta admin-web: relativa ao arquivo compilado (dist/app.js → ../src/admin-web)
const ADMIN_WEB_ROOT = join(__dirname, "..", "src", "admin-web");

// Pasta ENTREGA: configurável via variável de ambiente para funcionar tanto em
// desenvolvimento (caminho relativo ao projeto) quanto no Docker (volume montado).
// ENTREGA_PATH pode ser absoluto ou relativo ao CWD do processo.
const ENTREGA_ROOT = resolve(
	process.env.ENTREGA_PATH ?? join(__dirname, "..", "..", "ENTREGA", "public"),
);

async function serveAdminFile(c: any, fileName: string) {
	try {
		const content = await readFile(join(ADMIN_WEB_ROOT, fileName));
		const ext = fileName.split(".").pop();
		const contentType =
			ext === "html" ? "text/html" :
			ext === "css" ? "text/css" :
			ext === "js" ? "application/javascript" :
			ext === "json" ? "application/json" :
			"application/octet-stream";
		return c.body(content, 200, { "Content-Type": contentType });
	} catch {
		return c.json({ erro: "Não encontrado" }, 404);
	}
}

app.route("/api/", apiRoute);

// Bloqueia arquivos privados (.sql, .env) antes de qualquer outro middleware.
app.use("*", async (c, next) => {
	const pathname = new URL(c.req.url).pathname.toLowerCase();
	if (pathname.endsWith(".sql") || pathname.endsWith(".env")) {
		return c.json({ erro: "Acesso negado" }, 403);
	}
	await next();
});

// ──────────────────────────────────────────────────────────────────
// Interface administrativa (servida em http://localhost:3000/admin/*)
// ──────────────────────────────────────────────────────────────────
const adminPages = [
	"index.html",
	"dashboard.html",
	"membros.html",
	"ministerios.html",
	"equipes.html",
	"locais.html",
	"musicas.html",
	"escalas.html",
	"lembretes.html",
	"cargos.html",
	"funcoes.html",
	"css/style.css",
	"js/app.js",
];

for (const page of adminPages) {
	app.get(`/admin/${page}`, (c) => serveAdminFile(c, page));
}

// Fallback: /admin/ or /admin without trailing file → serve login
app.get("/admin", (c) => serveAdminFile(c, "index.html"));
app.get("/admin/", (c) => serveAdminFile(c, "index.html"));
app.get("/admin/login", (c) => serveAdminFile(c, "index.html"));

// Redireciona raiz para o dashboard administrativo.
app.get("/", (c) => {
	return c.redirect("/admin/dashboard.html");
});

// Unificação: /painel.html aponta para o portal administrativo atual.
app.get("/painel.html", (c) => c.redirect("/admin/dashboard.html"));

// ──────────────────────────────────────────────────────────────────
// Caminhos legados de cadastro de igreja — desativados.
// O SaintScale utiliza uma única igreja padrão definida pelo backend.
// Não há fluxo público de criação de igrejas.
// ──────────────────────────────────────────────────────────────────
app.get("/cadastro-igreja", (c) =>
	c.json({ erro: "Cadastro de igreja desativado." }, 404),
);
app.get("/cadastro-igreja.html", (c) =>
	c.json({ erro: "Cadastro de igreja desativado." }, 404),
);

// ──────────────────────────────────────────────────────────────────
// Arquivos estáticos do frontend (ENTREGA/public/).
// Rotas /api/* e /admin/* já foram registradas acima e têm prioridade.
// ENTREGA_ROOT é resolvido a partir da variável ENTREGA_PATH (Docker)
// ou do caminho relativo padrão (desenvolvimento local).
// ──────────────────────────────────────────────────────────────────
app.use(
	"*",
	serveStatic({
		root: ENTREGA_ROOT,
		getContent: async (path) => {
			try {
				const content = await readFile(path);
				return content;
			} catch {
				return null;
			}
		},
		join: (...paths) => join(...paths.filter((p) => p !== "")),
		isDir: async (path) => {
			try {
				const s = await stat(path);
				return s.isDirectory();
			} catch {
				return false;
			}
		},
	}),
);

export default app;
