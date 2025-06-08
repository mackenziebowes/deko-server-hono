import { createMiddleware } from "hono/factory";
import type { User } from "~/types/user";
import { error } from "~/library/helpers/error/panic";
import { db } from "~/utils/db";
import { verify_jwt } from "~/library/helpers/crypto";

export type AuthEnv = {
	Variables: {
		user: User;
	};
};

export const auth = createMiddleware<AuthEnv>(async (c, next) => {
	const authHeader = c.req.header("Authorization");
	const user_token = authHeader ? authHeader.replace("Bearer ", "") : null;
	if (!user_token) {
		return error(c, "No Bearer token provided", 401);
	}
	try {
		const user = (await verify_jwt(user_token)) as User; // user data inside jwt
		c.set("user", user);
		await next();
	} catch (err) {
		return error(c, "Invalid Bearer token provided", 401);
	}
});
