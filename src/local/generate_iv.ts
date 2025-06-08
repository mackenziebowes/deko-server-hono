import crypto from "node:crypto";

/**
 * Generates a random initialization vector (IV) for AES encryption.
 * @returns A base64 encoded IV string.
 */
export function generateIV(): string {
	const iv = crypto.randomBytes(16); // AES block size is 16 bytes
	return iv.toString("base64");
}

// // Example usage to generate an IV:
// console.log(generateIV());
