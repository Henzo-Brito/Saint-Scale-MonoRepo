# SaintScale — Guia de Instalação Local (Windows / ETEC)

Instruções para executar o SaintScale no Windows sem Docker e sem WSL.

---

## Requisitos

| Requisito | Versão | Como verificar |
|-----------|--------|----------------|
| Node.js | 18 ou superior | `node --version` |
| npm | 9 ou superior | `npm --version` |
| MySQL | 8.0 ou 8.4 | ver seção abaixo |

**Não é necessário** Docker, WSL, PostgreSQL ou qualquer ferramenta de container.

---

## 1. Instalação do Node.js

Acesse [nodejs.org](https://nodejs.org) e baixe o instalador LTS para Windows.

Após instalar, verifique:
```
node --version
npm --version
```

---

## 2. Configuração do MySQL

O SaintScale usa MySQL na porta **3308**.

### Opção A — MySQL Server (já instalado)

Se o MySQL Server 8.0 ou 8.4 já está instalado no computador:

1. Localize o `mysqld.exe` em `C:\Program Files\MySQL\MySQL Server 8.4\bin\`
2. Execute o script `iniciar_mysql.bat` (na raiz do projeto) para inicializar o banco e iniciar o servidor

### Opção B — Instalar MySQL Community Server

Baixe em [dev.mysql.com/downloads/mysql/](https://dev.mysql.com/downloads/mysql/)

Instale com as configurações padrão. Durante a instalação, **defina uma senha para o root**.

---

## 3. Inicialização do MySQL (primeira vez)

Execute o script de inicialização do banco:

```
iniciar_mysql.bat
```

Este script:
- Inicializa o datadir do MySQL 8.4 em `C:\Users\Aluno\mysql84data` (se ainda não foi feito)
- Inicia o servidor MySQL na porta **3308**
- Cria o banco `saintscale_dev` e o usuário `saintscale`

> Na primeira execução, aguarde até ver a mensagem `MySQL iniciado na porta 3308`.

---

## 4. Configuração do .env

### Backend (`saint-scale-api/.env`)

```env
PORT=3000
JWT_SECRET=Henzo_Esteve_Aqui
CODIGO_ENTRADA_SECRET=saint-scale-codigo-entrada-secreto
NODE_ENV=development
CORS_ORIGIN=http://localhost:8081

DB_HOST=127.0.0.1
DB_PORT=3308
DB_USER=saintscale
DB_PASSWORD=saintscale123
DB_NAME=saintscale_dev
```

> Já configurado. Não altere sem necessidade.

### Frontend (`saint-scale/.env`)

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

> Já configurado.

---

## 5. Instalação das dependências

```bash
cd saint-scale-api
npm install

cd ../saint-scale
npm install
```

---

## 6. Execução das migrations

Execute uma vez antes de iniciar o backend pela primeira vez (ou após reiniciar o banco):

```bash
cd saint-scale-api
npm run migrate
```

Saída esperada: `Migrations executadas com sucesso.`

---

## 7. Iniciar o backend

```bash
cd saint-scale-api
npm run dev
```

Saídas esperadas:
```
Server is running on http://localhost:3000
[DB] Conectado ao MySQL em 127.0.0.1:3308 — banco: saintscale_dev
```

---

## 8. Iniciar o frontend

Em outro terminal:

```bash
cd saint-scale
npm run web
```

Acesse: [http://localhost:8081](http://localhost:8081)

---

## 9. Painel administrativo (admin web)

Acesse via navegador: [http://localhost:3000/admin/](http://localhost:3000/admin/)

---

## 10. Script de inicialização rápida

Para iniciar tudo de uma vez, execute na raiz do projeto:

```
iniciar_saintscale.bat
```

Este script inicia o MySQL, executa as migrations e inicia o backend.

---

## Portas utilizadas

| Serviço | Porta |
|---------|-------|
| Backend (API) | 3000 |
| Frontend (Expo Web) | 8081 |
| MySQL | 3308 |

---

## Acesso ao banco de dados

Você pode acessar o banco `saintscale_dev` pelo MySQL Workbench:

- Host: `127.0.0.1`
- Porta: `3308`
- Usuário: `saintscale`
- Senha: `saintscale123`
- Banco: `saintscale_dev`

Ou pelo MySQL CLI:
```
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u saintscale -psaintscale123 -P 3308 --protocol=TCP saintscale_dev
```

---

## Como verificar se a conexão com o banco está funcionando

Execute no terminal:
```bash
cd saint-scale-api
npm run migrate
```

Se aparecer `Migrations executadas com sucesso.`, o banco está conectado.

---

## Problemas comuns

### "Access denied for user 'saintscale'"
O usuário do banco não foi criado. Execute:
```
iniciar_mysql.bat
```

### "Cannot connect to MySQL port 3308"
O MySQL não está iniciado. Execute:
```
iniciar_mysql.bat
```

### "JWT_SECRET não está configurado"
Verifique se o arquivo `saint-scale-api/.env` existe e tem o campo `JWT_SECRET`.

### Backend inicia mas não conecta ao banco
Verifique as variáveis `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` no `.env`.

### "EXPO_PUBLIC_API_URL não está configurada"
Verifique se o arquivo `saint-scale/.env` existe com `EXPO_PUBLIC_API_URL=http://localhost:3000/api`.

### Porta 3000 ou 8081 ocupada
Mude `PORT=3001` no `saint-scale-api/.env` e atualize `EXPO_PUBLIC_API_URL` no `saint-scale/.env`.

---

## Como parar os serviços

- **Backend**: `Ctrl+C` no terminal onde `npm run dev` está rodando
- **Frontend**: `Ctrl+C` no terminal onde `npm run web` está rodando
- **MySQL**: O MySQL 8.4 iniciado pelo script continua rodando. Para parar, encerre o processo `mysqld.exe` no Gerenciador de Tarefas

---

## Notas de infraestrutura

| Item | Configuração |
|------|-------------|
| Banco de dados | MySQL 8.4 |
| Porta MySQL | 3308 |
| Datadir MySQL | `C:\Users\Aluno\mysql84data` |
| Config MySQL | `C:\Users\Aluno\mysql84.ini` |
| Driver Node.js | mysql2 |
| Framework backend | Hono (Node.js) |
| Framework frontend | Expo / React Native Web |
| Sem Docker | ✓ |
| Sem WSL | ✓ |
| Sem PostgreSQL | ✓ |
