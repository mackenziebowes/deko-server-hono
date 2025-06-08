import { Hono } from "hono";
import type { AuthEnv } from "~/library/middleware/auth";
import { GeneralApiResponse, JWTResponse } from "~/types/response";
import { encryptPassword } from "~/library/helpers/crypto";
import { db } from "~/utils/db";
import type { User } from "@ods/db";

const app = new Hono<AuthEnv>();

// async function setPassword(password: string) {
// 	const response = await vona.post("/user/set-password", {
// 		password,
// 	});
// 	return response.data as GeneralApiResponse;
// }

app.post("/set-password", async (c) => {
	const { password } = await c.req.json();
	const user = c.get("user");
	let hashedPassword = encryptPassword(password);
	await db.user.update({
		where: {
			id: user.id,
		},
		data: {
			password: hashedPassword,
		},
	});
	const response: GeneralApiResponse = {
		ok: true,
		msg: "Password set!",
	};
	return c.json(response); // I wonder...
});

// async function setUsername(username: string) {
// 	const response = await vona.post("/user/set-username", {
// 		username,
// 	});
// 	return response.data as GeneralApiResponse;
// }

app.post("/set-username", async (c) => {
	const { username } = await c.req.json();
	const user = c.get("user");
	// need to add a profile to db for this
	return c.json({ message: "Username received" });
});

// async function agreeToTerms() {
// 	// no args bc... yea, are you going to not agree?
// 	const response = await vona.get("/user/agree-to-terms");
// 	return response.data as GeneralApiResponse;
// }

app.get("/agree-to-terms", async (c) => {
	const user = c.get("user");

	return c.json({ message: "Agreement Received" });
});

export default app; // app.use("/user")...
