import * as crypto from "crypto";
import { env } from "~/library/helpers/env";
import { SignJWT, jwtVerify } from "jose";

/**
 * Encrypts a password using AES-256-CBC.
 * @param password - The password to encrypt.
 * @returns The encrypted password as a base64 string.
 */
export function encryptPassword(password: string): string {
	const algorithm = "aes-256-cbc";
	const key = Buffer.from(env.HASH_KEY(), "base64");
	const iv = Buffer.from(env.HASH_IV(), "base64"); // Convert iv to BinaryLike
	const cipher = crypto.createCipheriv(algorithm, key, iv);
	let encrypted = cipher.update(password, "utf8", "base64");
	encrypted += cipher.final("base64");
	return encrypted;
}

/**
 * Decrypts an encrypted password using AES-256-CBC.
 * @param encryptedPassword - The encrypted password to decrypt.
 * @returns The original password as a string.
 */
export function decryptPassword(encryptedPassword: string): string {
	const algorithm = "aes-256-cbc";
	const key = Buffer.from(env.HASH_KEY(), "base64");
	const iv = Buffer.from(env.HASH_IV(), "base64"); // Initialization vector
	const decipher = crypto.createDecipheriv(algorithm, key, iv);
	let decrypted = decipher.update(encryptedPassword, "base64", "utf8");
	decrypted += decipher.final("utf8");
	return decrypted;
}

export async function sign_jwt(payload: { [key: string]: unknown }) {
	const TOKEN_EXPIRATION = "30d";
	const alg = "HS256";
	const secret = new TextEncoder().encode(env.JWT_SECRET());
	const jwt = await new SignJWT(payload)
		.setProtectedHeader({ alg })
		.setIssuedAt()
		.setIssuer("urn:example:issuer")
		.setAudience("urn:example:audience")
		.setExpirationTime(TOKEN_EXPIRATION)
		.sign(secret);
	return jwt;
}

export async function verify_jwt(jwt: string) {
	const secret = new TextEncoder().encode(env.JWT_SECRET());
	const { payload } = await jwtVerify(jwt, secret);
	return payload;
}

/**
 * Generates a random 6-digit string.
 * @returns A string composed of 6 digits.
 */
export function makeOTP(length: number): string {
	const nums = Array.from({ length }, () => Math.floor(Math.random() * 10));
	return nums.join("");
}
