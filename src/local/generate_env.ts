import crypto from "node:crypto";
import fs from "node:fs/promises";
import { generateIV } from "./generate_iv";

async function generateENV() {
	const hash_iv = generateIV();
	let partial = "ODS/AUTH" + hash_iv;
	let hash_key = crypto.hash("sha256", partial);
	const hash_buffer = Buffer.from(hash_key, "utf8");
	const padded_hash = Buffer.alloc(32);
	hash_buffer.copy(padded_hash);
	partial = "ODS/JWT" + hash_iv;
	let jwt_secret = crypto.hash("sha256", partial);
	const jwt_buffer = Buffer.from(jwt_secret, "utf8");
	const padded_jwt = Buffer.alloc(32);
	jwt_buffer.copy(padded_jwt);
	hash_key = hash_buffer.toBase64();
	hash_key = crypto.createHash("sha256").update(hash_key).digest().toBase64();
	jwt_secret = jwt_buffer.toBase64();
	const mode = "DEVELOPMENT";
	const cors_origin = "http://localhost:3000";
	const email_host = "mail.mackenziebowes.com";
	const email_user = "mackenzie";
	const email_password = "null";

	const envContent = `
HASH_KEY="${hash_key}"
HASH_IV="${hash_iv}"
JWT_SECRET="${jwt_secret}"
MODE="${mode}"
CORS_ORIGIN="${cors_origin}"
EMAIL_HOST="${email_host}"
EMAIL_USER="${email_user}"
EMAIL_PASSWORD="${email_password}"
`.trim();

	await fs.writeFile(".env.generated", envContent, "utf8");
}

generateENV();
