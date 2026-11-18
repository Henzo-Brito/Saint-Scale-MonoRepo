import { SignJWT } from "jose";
import "dotenv/config";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length === 0) {
	throw new Error("JWT_SECRET não está configurado");
}

const secret = new TextEncoder().encode(jwtSecret);

export type JWTPayloadInput = {
	sub: string;
	email: string;
	role: string;
};

/** Cria um access token JWT assinado com HS256, expiração de 1 hora. */
export async function createAccessToken(
	payload: JWTPayloadInput,
): Promise<string> {
	return new SignJWT({ email: payload.email, role: payload.role })
		.setProtectedHeader({ alg: "HS256" })
		.setSubject(payload.sub)
		.setIssuedAt()
		.setExpirationTime("1h")
		.sign(secret);
}
