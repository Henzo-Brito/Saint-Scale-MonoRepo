import "dotenv/config";
import mysql from "mysql2/promise";

const DB_HOST = process.env.DB_HOST ?? "127.0.0.1";
const DB_PORT = Number(process.env.DB_PORT ?? 3306);
const DB_USER = process.env.DB_USER ?? "saintscale";
const DB_PASSWORD = process.env.DB_PASSWORD ?? "";
const DB_NAME = process.env.DB_NAME ?? "saintscale_dev";

export const pool = mysql.createPool({
	host: DB_HOST,
	port: DB_PORT,
	user: DB_USER,
	password: DB_PASSWORD,
	database: DB_NAME,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
	charset: "utf8mb4",
	timezone: "+00:00",
	// Converte tipos MySQL para JS automaticamente
	supportBigNumbers: true,
	bigNumberStrings: false,
	dateStrings: false,
});

// Verifica a conexão ao iniciar
pool.getConnection()
	.then((conn) => {
		console.log(`[DB] Conectado ao MySQL em ${DB_HOST}:${DB_PORT} — banco: ${DB_NAME}`);
		conn.release();
	})
	.catch((err: Error) => {
		console.error("[DB] Erro ao conectar ao MySQL:", err.message);
		console.error("[DB] Verifique: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME no .env");
	});
