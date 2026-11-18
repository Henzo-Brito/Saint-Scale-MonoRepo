import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";
import "dotenv/config";

const DB_HOST = process.env.DB_HOST ?? "127.0.0.1";
const DB_PORT = Number(process.env.DB_PORT ?? 3306);
const DB_USER = process.env.DB_USER ?? "saintscale";
const DB_PASSWORD = process.env.DB_PASSWORD ?? "";
const DB_NAME = process.env.DB_NAME ?? "saintscale_dev";

// Lê o schema SQL
const sql = await readFile(new URL("./tcc.sql", import.meta.url), "utf8");

// Conecta sem especificar banco (para poder criá-lo se não existir)
const adminConn = await mysql.createConnection({
	host: DB_HOST,
	port: DB_PORT,
	user: DB_USER,
	password: DB_PASSWORD,
	charset: "utf8mb4",
	multipleStatements: true,
});

try {
	// Garante que o banco existe
	await adminConn.query(
		`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
	);
	await adminConn.query(`USE \`${DB_NAME}\``);

	// Executa o schema (que inclui DROPs e CREATEs)
	await adminConn.query(sql);

	console.log("Migrations executadas com sucesso.");
} finally {
	await adminConn.end();
}
