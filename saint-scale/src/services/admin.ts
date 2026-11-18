import { api } from "./api";

/**
 * Payload de resposta de cadastro de igreja (POST /admin/cadastro-igreja).
 * O endpoint é público e retorna apenas { ok: true } — não retorna token.
 * O usuário deve fazer login separadamente após cadastrar a igreja.
 */
export interface CadastroIgrejaResponse {
	ok: boolean;
}

/**
 * Item genérico de lista do dashboard (id + nome).
 */
export interface DashboardItem {
	id: number;
	nome: string;
}

/**
 * Dados do usuário logado no dashboard administrativo.
 */
export interface DashboardEu {
	id: number;
	nome: string;
	usuario: string | null;
	admin: boolean;
}

/**
 * Dados da igreja do usuário logado.
 */
export interface DashboardIgreja {
	id: number;
	nome: string;
}

/**
 * Resposta de GET /admin/dados (dashboard da igreja).
 * Alinhado ao DashboardSchema do backend.
 *
 * Observação: o handler real também retorna `meusMinisterios` e `vinculos`,
 * embora o schema Zod oficial liste apenas `ministerios`.
 */
export interface AdminDashboardResponse {
	versao: string;
	igrejas: DashboardItem[];
	ministerios: DashboardItem[];
	equipes: DashboardItem[];
	locais: DashboardItem[];
	musicas: DashboardItem[];
	escalas: DashboardItem[];
	membros: DashboardItem[];
	cargos: DashboardItem[];
	eu: DashboardEu;
	igreja: DashboardIgreja;
	podeVerCodigo: boolean;
	/** Ministérios acessíveis pelo usuário (todos se admin, vinculados se membro). */
	meusMinisterios?: DashboardItem[];
}

/**
 * Dados de um ministério retornados pela API.
 */
export interface MinisterioItem {
	id: number;
	nome: string;
}

/**
 * Dados de um membro retornados pela API.
 */
export interface MembroItem {
	id: number;
	nome: string;
	email: string;
	cargo: string;
	status: string;
}

/**
 * Dados de um cargo retornados pela API.
 */
export interface CargoItem {
	id: number;
	nome: string;
	permissoes: string[];
}

/**
 * Dados de um local (logradouro) retornados pela API.
 */
export interface LocalItem {
	id: number;
	nome: string;
	endereco?: string | null;
}

/**
 * Dados de uma música retornados pela API.
 */
export interface MusicaItem {
	id: number;
	nome: string;
	artista?: string | null;
	tom?: string | null;
}

/**
 * Dados para criar um ministério (POST /admin/ministerios).
 * O backend aceita apenas o campo "nome".
 */
export interface CriarMinisterioBody {
	nome: string;
}

/**
 * Dados para criar um membro (POST /admin/membros).
 * Campos alinhados ao LISTAS.membros do backend: nome, email, cargo, status, senha.
 */
export interface CriarMembroBody {
	nome: string;
	email: string;
	cargo: number;
	status?: string;
	senha?: string;
}

/**
 * Dados para atualizar um item genérico (PUT /admin/{lista}/{id}).
 * O corpo é um Record de campos permitidos pela lista.
 */
export interface AtualizarItemBody {
	[key: string]: unknown;
}

/**
 * Resposta genérica de criação/atualização/exclusão de item.
 */
export interface ItemResponse {
	ok: boolean;
}

/**
 * Vinculo membro → ministério retornado pelo dashboard.
 */
export interface MembroMinisterioVinculo {
	membro: number;
	ministerio: number;
}

/**
 * Dados de uma equipe retornados pela API.
 */
export interface EquipeItem {
	id: number;
	nome: string;
	imagem?: string | null;
}

/**
 * Dados de uma escala retornados pela API.
 */
export interface EscalaItem {
	id: number;
	nome: string;
	data?: string | null;
	local?: string | null;
	descricao?: string | null;
}

/**
 * Dados para criar uma equipe (POST /admin/equipes).
 * Campos alinhados ao LISTAS.equipes do backend: nome (title), imagem (img_id).
 */
export interface CriarEquipeBody {
	nome: string;
	imagem?: string | null;
}

/**
 * Dados para atualizar uma equipe (PUT /admin/equipes/{id}).
 */
export interface AtualizarEquipeBody {
	nome?: string;
	imagem?: string | null;
}

/**
 * Dados para criar uma escala (POST /admin/escalas).
 * Campos alinhados ao LISTAS.escalas do backend: nome (nome_escala), data (data_hora), local, descricao.
 */
export interface CriarEscalaBody {
	nome: string;
	data?: string | null;
	local?: string | null;
	descricao?: string | null;
}

/**
 * Dados para atualizar uma escala (PUT /admin/escalas/{id}).
 */
export interface AtualizarEscalaBody {
	nome?: string;
	data?: string | null;
	local?: string | null;
	descricao?: string | null;
}

/**
 * Resposta do dashboard estendida com vínculos e meus ministérios.
 * Estende AdminDashboardResponse com campos que o backend realmente retorna
 * mas o schema Zod oficial não lista.
 */
export interface AdminDashboardResponseExt extends AdminDashboardResponse {
	vinculos?: MembroMinisterioVinculo[];
	meusMinisterios: MinisterioItem[];
	membrosEquipes?: { membro: number; equipe: number }[];
	cargos: CargoItem[];
	membros: MembroItem[];
}

/**
 * Seleciona um ministério como acesso válido para o usuário logado.
 *
 * Regras do backend:
 * - Administrador (cargo 1): pode selecionar qualquer ministério da sua igreja.
 * - Membro comum: só pode selecionar ministérios aos quais já está vinculado.
 * - Não persiste um "ministério ativo" na sessão nem no JWT; valida apenas o acesso.
 *
 * @throws Erro com mensagem amigável em português (via getErrorMessage)
 */
export async function escolherMinisterio(id: number): Promise<{ ok: boolean }> {
	const response = await api.post<{ ok: boolean }>(
		"/admin/escolher-ministerio",
		{
			id,
		},
	);
	return response.data;
}

/**
 * Busca os dados do dashboard administrativo da igreja do usuário logado.
 * Exige token JWT válido (interceptor injeta automaticamente).
 *
 * @throws Erro com mensagem amigável em português (via getErrorMessage)
 */
export async function getAdminDashboard(): Promise<AdminDashboardResponseExt> {
	const response = await api.get<AdminDashboardResponseExt>("/admin/dados");
	return response.data;
}

/* ──────────────────────────────────────────────────────────────────
   CRUD genérico de listas (POST/PUT/DELETE /admin/{lista}[/{id}])
   ────────────────────────────────────────────────────────────────── */

/**
 * Lista itens de uma lista administrativa (ex.: "ministerios", "membros").
 * Reutiliza o endpoint genérico GET implícito via dashboard quando disponível;
 * para listas dedicadas, chama POST /admin/{lista} com corpo vazio não é suportado.
 * Use getAdminDashboard para obter listas já carregadas.
 */

/**
 * Cria um item em uma lista administrativa (ex.: "ministerios", "membros").
 * Endpoint: POST /admin/{lista}.
 * Requer permissão para a lista (verificado pelo backend).
 */
export async function criarItemLista(
	lista: string,
	corpo: Record<string, unknown>,
): Promise<ItemResponse> {
	const response = await api.post<ItemResponse>(`/admin/${lista}`, corpo);
	return response.data;
}

/**
 * Atualiza um item de uma lista administrativa.
 * Endpoint: PUT /admin/{lista}/{id}.
 */
export async function atualizarItemLista(
	lista: string,
	id: string | number,
	corpo: Record<string, unknown>,
): Promise<ItemResponse> {
	const response = await api.put<ItemResponse>(`/admin/${lista}/${id}`, corpo);
	return response.data;
}

/**
 * Exclui um item de uma lista administrativa.
 * Endpoint: DELETE /admin/{lista}/{id}.
 */
export async function excluirItemLista(
	lista: string,
	id: string | number,
): Promise<ItemResponse> {
	const response = await api.delete<ItemResponse>(`/admin/${lista}/${id}`);
	return response.data;
}

/* ──────────────────────────────────────────────────────────────────
   Ministérios (endpoints específicos)
   ────────────────────────────────────────────────────────────────── */

/**
 * Cria um ministério. Endpoint: POST /admin/ministerios.
 * Apenas o campo "nome" é enviado ao backend.
 */
export async function criarMinisterio(
	data: CriarMinisterioBody,
): Promise<ItemResponse> {
	return criarItemLista("ministerios", { nome: data.nome });
}

/**
 * Atualiza um ministério. Endpoint: PUT /admin/ministerios/{id}.
 */
export async function atualizarMinisterio(
	id: string | number,
	data: CriarMinisterioBody,
): Promise<ItemResponse> {
	return atualizarItemLista("ministerios", id, { nome: data.nome });
}

/**
 * Exclui um ministério. Endpoint: DELETE /admin/ministerios/{id}.
 */
export async function excluirMinisterio(
	id: string | number,
): Promise<ItemResponse> {
	return excluirItemLista("ministerios", id);
}

/* ──────────────────────────────────────────────────────────────────
   Membros (endpoints específicos)
   ────────────────────────────────────────────────────────────────── */

/**
 * Cria um membro. Endpoint: POST /admin/membros.
 * Campos: nome, email, cargo (id do cargo), status?, senha?.
 */
export async function criarMembro(
	data: CriarMembroBody,
): Promise<ItemResponse> {
	return criarItemLista("membros", {
		nome: data.nome,
		email: data.email,
		cargo: data.cargo,
		status: data.status ?? "pendente",
		...(data.senha ? { senha: data.senha } : {}),
	});
}

/**
 * Atualiza um membro. Endpoint: PUT /admin/membros/{id}.
 */
export async function atualizarMembro(
	id: string | number,
	data: Partial<CriarMembroBody>,
): Promise<ItemResponse> {
	const corpo: Record<string, unknown> = {};
	if (data.nome !== undefined) corpo.nome = data.nome;
	if (data.email !== undefined) corpo.email = data.email;
	if (data.cargo !== undefined) corpo.cargo = data.cargo;
	if (data.status !== undefined) corpo.status = data.status;
	if (data.senha !== undefined) corpo.senha = data.senha;
	return atualizarItemLista("membros", id, corpo);
}

/**
 * Exclui um membro. Endpoint: DELETE /admin/membros/{id}.
 */
export async function excluirMembro(
	id: string | number,
): Promise<ItemResponse> {
	return excluirItemLista("membros", id);
}

/* ──────────────────────────────────────────────────────────────────
   Vínculos membro → ministério
   ────────────────────────────────────────────────────────────────── */

/**
 * Adiciona um membro a um ministério.
 * Endpoint: POST /admin/ministerios/{ministerioId}/membros.
 * Body: { membro: number }.
 */
export async function adicionarMembroAoMinisterio(
	ministerioId: string | number,
	membroId: number,
): Promise<ItemResponse> {
	const response = await api.post<ItemResponse>(
		`/admin/ministerios/${ministerioId}/membros`,
		{ membro: membroId },
	);
	return response.data;
}

/**
 * Remove um membro de um ministério.
 * Endpoint: DELETE /admin/ministerios/{ministerioId}/membros/{membroId}.
 */
export async function removerMembroDoMinisterio(
	ministerioId: string | number,
	membroId: number,
): Promise<ItemResponse> {
	const response = await api.delete<ItemResponse>(
		`/admin/ministerios/${ministerioId}/membros/${membroId}`,
	);
	return response.data;
}

/* ──────────────────────────────────────────────────────────────────
   Equipes (endpoints específicos)
   ────────────────────────────────────────────────────────────────── */

/**
 * Cria uma equipe. Endpoint: POST /admin/equipes.
 * Campos: nome (title), imagem? (img_id).
 */
export async function criarEquipe(
	data: CriarEquipeBody,
): Promise<ItemResponse> {
	return criarItemLista("equipes", {
		nome: data.nome,
		...(data.imagem !== undefined ? { imagem: data.imagem } : {}),
	});
}

/**
 * Atualiza uma equipe. Endpoint: PUT /admin/equipes/{id}.
 */
export async function atualizarEquipe(
	id: string | number,
	data: AtualizarEquipeBody,
): Promise<ItemResponse> {
	const corpo: Record<string, unknown> = {};
	if (data.nome !== undefined) corpo.nome = data.nome;
	if (data.imagem !== undefined) corpo.imagem = data.imagem;
	return atualizarItemLista("equipes", id, corpo);
}

/**
 * Exclui uma equipe. Endpoint: DELETE /admin/equipes/{id}.
 */
export async function excluirEquipe(
	id: string | number,
): Promise<ItemResponse> {
	return excluirItemLista("equipes", id);
}

/**
 * Adiciona um membro a uma equipe.
 * Endpoint: POST /admin/equipes/{equipeId}/membros.
 * Body: { membro: number }.
 */
export async function adicionarMembroAEquipe(
	equipeId: string | number,
	membroId: number,
): Promise<ItemResponse> {
	const response = await api.post<ItemResponse>(
		`/admin/equipes/${equipeId}/membros`,
		{ membro: membroId },
	);
	return response.data;
}

/**
 * Remove um membro de uma equipe.
 * Endpoint: DELETE /admin/equipes/{equipeId}/membros/{membroId}.
 */
export async function removerMembroDeEquipe(
	equipeId: string | number,
	membroId: number,
): Promise<ItemResponse> {
	const response = await api.delete<ItemResponse>(
		`/admin/equipes/${equipeId}/membros/${membroId}`,
	);
	return response.data;
}

/* ──────────────────────────────────────────────────────────────────
   Cargos (endpoints específicos)
   ────────────────────────────────────────────────────────────────── */

/**
 * Dados para criar um cargo (POST /admin/cargos).
 * Campos: nome, permissoes (string separada por vírgulas).
 * O cargo de Administrador (id 1) é protegido pelo backend.
 */
export interface CriarCargoBody {
	nome: string;
	permissoes?: string;
}

/**
 * Dados para atualizar um cargo (PUT /admin/cargos/{id}).
 */
export interface AtualizarCargoBody {
	nome?: string;
	permissoes?: string;
}

/**
 * Cria um cargo. Endpoint: POST /admin/cargos.
 * Requer permissão "cargos" (verificada pelo backend).
 */
export async function criarCargo(data: CriarCargoBody): Promise<ItemResponse> {
	return criarItemLista("cargos", {
		nome: data.nome,
		...(data.permissoes !== undefined ? { permissoes: data.permissoes } : {}),
	});
}

/**
 * Atualiza um cargo. Endpoint: PUT /admin/cargos/{id}.
 * O cargo de Administrador (id 1) não pode ser alterado pelo backend.
 */
export async function atualizarCargo(
	id: string | number,
	data: AtualizarCargoBody,
): Promise<ItemResponse> {
	const corpo: Record<string, unknown> = {};
	if (data.nome !== undefined) corpo.nome = data.nome;
	if (data.permissoes !== undefined) corpo.permissoes = data.permissoes;
	return atualizarItemLista("cargos", id, corpo);
}

/**
 * Exclui um cargo. Endpoint: DELETE /admin/cargos/{id}.
 * O cargo de Administrador (id 1) não pode ser excluído pelo backend.
 */
export async function excluirCargo(id: string | number): Promise<ItemResponse> {
	return excluirItemLista("cargos", id);
}

/* ──────────────────────────────────────────────────────────────────
   Locais (endpoints específicos)
   ────────────────────────────────────────────────────────────────── */

/**
 * Dados para criar um local (POST /admin/locais).
 * Campos: nome (rua), endereco? (numero).
 */
export interface CriarLocalBody {
	nome: string;
	endereco?: string | null;
}

/**
 * Dados para atualizar um local (PUT /admin/locais/{id}).
 */
export interface AtualizarLocalBody {
	nome?: string;
	endereco?: string | null;
}

/**
 * Cria um local. Endpoint: POST /admin/locais.
 * Requer permissão "locais" (verificada pelo backend).
 */
export async function criarLocal(data: CriarLocalBody): Promise<ItemResponse> {
	return criarItemLista("locais", {
		nome: data.nome,
		...(data.endereco !== undefined ? { endereco: data.endereco } : {}),
	});
}

/**
 * Atualiza um local. Endpoint: PUT /admin/locais/{id}.
 */
export async function atualizarLocal(
	id: string | number,
	data: AtualizarLocalBody,
): Promise<ItemResponse> {
	const corpo: Record<string, unknown> = {};
	if (data.nome !== undefined) corpo.nome = data.nome;
	if (data.endereco !== undefined) corpo.endereco = data.endereco;
	return atualizarItemLista("locais", id, corpo);
}

/**
 * Exclui um local. Endpoint: DELETE /admin/locais/{id}.
 */
export async function excluirLocal(id: string | number): Promise<ItemResponse> {
	return excluirItemLista("locais", id);
}

/* ──────────────────────────────────────────────────────────────────
   Músicas (endpoints específicos)
   ────────────────────────────────────────────────────────────────── */

/**
 * Dados para criar uma música (POST /admin/musicas).
 * Campos: nome, artista? (autor), tom?.
 */
export interface CriarMusicaBody {
	nome: string;
	artista?: string | null;
	tom?: string | null;
}

/**
 * Dados para atualizar uma música (PUT /admin/musicas/{id}).
 */
export interface AtualizarMusicaBody {
	nome?: string;
	artista?: string | null;
	tom?: string | null;
}

/**
 * Cria uma música. Endpoint: POST /admin/musicas.
 * Requer permissão "musicas" (verificada pelo backend).
 */
export async function criarMusica(
	data: CriarMusicaBody,
): Promise<ItemResponse> {
	return criarItemLista("musicas", {
		nome: data.nome,
		...(data.artista !== undefined ? { artista: data.artista } : {}),
		...(data.tom !== undefined ? { tom: data.tom } : {}),
	});
}

/**
 * Atualiza uma música. Endpoint: PUT /admin/musicas/{id}.
 */
export async function atualizarMusica(
	id: string | number,
	data: AtualizarMusicaBody,
): Promise<ItemResponse> {
	const corpo: Record<string, unknown> = {};
	if (data.nome !== undefined) corpo.nome = data.nome;
	if (data.artista !== undefined) corpo.artista = data.artista;
	if (data.tom !== undefined) corpo.tom = data.tom;
	return atualizarItemLista("musicas", id, corpo);
}

/**
 * Exclui uma música. Endpoint: DELETE /admin/musicas/{id}.
 */
export async function excluirMusica(
	id: string | number,
): Promise<ItemResponse> {
	return excluirItemLista("musicas", id);
}

/* ──────────────────────────────────────────────────────────────────
   Escalas (endpoints específicos)
   ────────────────────────────────────────────────────────────────── */

/**
 * Cria uma escala. Endpoint: POST /admin/escalas.
 * Campos: nome (nome_escala), data? (data_hora), local?, descricao?.
 */
export async function criarEscala(
	data: CriarEscalaBody,
): Promise<ItemResponse> {
	return criarItemLista("escalas", {
		nome: data.nome,
		...(data.data !== undefined ? { data: data.data } : {}),
		...(data.local !== undefined ? { local: data.local } : {}),
		...(data.descricao !== undefined ? { descricao: data.descricao } : {}),
	});
}

/**
 * Atualiza uma escala. Endpoint: PUT /admin/escalas/{id}.
 */
export async function atualizarEscala(
	id: string | number,
	data: AtualizarEscalaBody,
): Promise<ItemResponse> {
	const corpo: Record<string, unknown> = {};
	if (data.nome !== undefined) corpo.nome = data.nome;
	if (data.data !== undefined) corpo.data = data.data;
	if (data.local !== undefined) corpo.local = data.local;
	if (data.descricao !== undefined) corpo.descricao = data.descricao;
	return atualizarItemLista("escalas", id, corpo);
}

/**
 * Exclui uma escala. Endpoint: DELETE /admin/escalas/{id}.
 */
export async function excluirEscala(
	id: string | number,
): Promise<ItemResponse> {
	return excluirItemLista("escalas", id);
}
