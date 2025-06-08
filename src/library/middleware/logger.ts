import { createMiddleware } from "hono/factory";
import type { User } from "~/types/user";

export const logger = createMiddleware(async (c, next) => {
	if (c.get("user")) {
		const user: User = c.get("user");
		console.log(`VONA: [${c.req.method}] ${c.req.url} | ${user.id}`);
		await next();
	} else {
		console.log(`SONA: [${c.req.method}] ${c.req.url}`);
		await next();
	}
});
