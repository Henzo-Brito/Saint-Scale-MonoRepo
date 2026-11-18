# SaintScale — Setup Local com WAMP / XAMPP e phpMyAdmin

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior (ou [Bun](https://bun.sh/))
- [WAMP](https://www.wampserver.com/) **ou** [XAMPP](https://www.apachefriends.org/) instalado e rodando
- MySQL 8.x disponível via WAMP/XAMPP (porta padrão **3306**)
- phpMyAdmin acessível em `http://localhost/phpmyadmin`

---

## Passo 1 — Criar o banco de dados no phpMyAdmin

1. Abra o phpMyAdmin em **http://localhost/phpmyadmin**
2. No painel lateral esquerdo, clique em **"Novo"**
3. No campo **"Nome do banco de dados"**, digite:
   ```
   saintscale_dev
   ```
4. No campo **"Collation"** (ordenação), selecione:
   ```
   utf8mb4_unicode_ci
   ```
5. Clique em **"Criar"**

---

## Passo 2 — Importar o dump do banco

1. No painel lateral, clique no banco **saintscale_dev** para selecioná-lo
2. Clique na aba **"Importar"** no menu superior
3. Clique em **"Escolher arquivo"** e selecione o arquivo:
   ```
   saintscale_dev.sql
   ```
   (localizado na raiz do projeto)
4. Certifique-se de que o **Charset** está como `utf8mb4`
5. Clique em **"Executar"** (ou **"Go"**)

Após a importação você terá todas as tabelas e os dados de exemplo prontos.

**Credenciais do administrador geradas no seed:**

| Campo  | Valor             |
|--------|-------------------|
| Login  | `admin` ou `admin@admin.com` |
| Senha  | `admin123`        |

---

## Passo 3 — Configurar a conexão da API

Abra o arquivo `saint-scale-api/.env` e confirme as configurações:

```dotenv
PORT=3000
JWT_SECRET=Henzo_Esteve_Aqui
CODIGO_ENTRADA_SECRET=saint-scale-codigo-entrada-secreto
NODE_ENV=development
CORS_ORIGIN=http://localhost:8082

# MySQL — padrão WAMP/XAMPP
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=saintscale_dev
```

> **Nota:** o padrão do WAMP/XAMPP é usuário `root` sem senha.
> Se o seu MySQL exigir senha ou você criou um usuário dedicado, ajuste `DB_USER` e `DB_PASSWORD`.

### Usuário dedicado (opcional)

Se preferir criar um usuário específico para o projeto (mais seguro), execute no phpMyAdmin
(**Contas de usuário → Adicionar conta de usuário**):

```sql
CREATE USER 'saintscale'@'localhost' IDENTIFIED BY 'saintscale123';
GRANT ALL PRIVILEGES ON `saintscale_dev`.* TO 'saintscale'@'localhost';
FLUSH PRIVILEGES;
```

E então no `.env`, substitua:
```dotenv
DB_USER=saintscale
DB_PASSWORD=saintscale123
```

---

## Passo 4 — Instalar dependências e rodar a API

```bash
cd saint-scale-api
npm install        # ou: bun install
npm run dev        # ou: bun run dev
```

A API estará disponível em **http://localhost:3000**

### Verificação rápida

Abra no navegador:
- **http://localhost:3000/admin** → painel administrativo
- **http://localhost:3000/doc** → documentação OpenAPI (Scalar)

---

## Passo 5 — Rodar o aplicativo mobile (Expo)

```bash
cd saint-scale
npm install
npx expo start
```

No arquivo `saint-scale/.env` (ou variáveis de ambiente do Expo), configure:
```dotenv
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

> Se estiver usando o Expo Go em um celular físico na mesma rede Wi-Fi,
> substitua `localhost` pelo IP local da sua máquina (ex.: `192.168.1.10`).

---

## Alternativa — Migrate automático (cria tabelas via código)

Em vez de importar o SQL pelo phpMyAdmin, você pode usar o script de migração
que cria o banco e as tabelas automaticamente:

```bash
cd saint-scale-api
npm run migrate    # cria o banco saintscale_dev e executa tcc.sql
```

> **Atenção:** o migrate usa `DROP TABLE IF EXISTS` antes de recriar as tabelas.
> Execute-o apenas em ambiente de desenvolvimento ou em banco vazio.

---

## Estrutura dos arquivos relevantes

```
Saint-Scale-MonoRepo/
├── saintscale_dev.sql              ← dump completo para importar no phpMyAdmin
├── SETUP_LOCAL.md                  ← este arquivo
├── saint-scale-api/
│   ├── .env                        ← configurações locais (não commitar com senha real)
│   ├── .env.example                ← modelo de configuração
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.ts            ← pool de conexão MySQL (centralizado)
│   │   │   ├── migrate.ts          ← script de migração automática
│   │   │   └── tcc.sql             ← schema + seed para o migrate
│   │   └── routes/
│   │       ├── admin/admin.dao.ts  ← queries do painel admin
│   │       ├── auth/auth.dao.ts    ← queries de autenticação
│   │       ├── user/user.dao.ts    ← queries de usuário
│   │       ├── home/home.dao.ts    ← queries da tela home
│   │       ├── scale/scale.dao.ts  ← queries de escalas
│   │       └── alert/alert.dao.ts  ← queries de alertas/lembretes
└── saint-scale/                    ← app mobile (Expo / React Native)
```

---

## Solução de problemas

### "Access denied for user 'root'@'localhost'"
O WAMP/XAMPP tem senha no root. Verifique em **phpMyAdmin → Contas de usuário**
e atualize `DB_PASSWORD` no `.env`.

### "Unknown database 'saintscale_dev'"
O banco ainda não foi criado. Execute o Passo 1 e 2 acima,
ou rode `npm run migrate` para criá-lo automaticamente.

### "ECONNREFUSED 127.0.0.1:3306"
O serviço MySQL não está rodando. Certifique-se de que o WAMP/XAMPP está iniciado
e que a bolinha do MySQL está verde.

### Porta 3306 ocupada
Outro processo pode estar usando a porta 3306.
Verifique em `DB_PORT` qual porta o seu MySQL está usando
(no WAMP, pode aparecer a porta na bandeja do sistema).

### Caracteres especiais exibidos com problemas
Confirme que o phpMyAdmin está conectado com charset `utf8mb4`.
Na importação, selecione `utf8mb4` no campo de charset.
