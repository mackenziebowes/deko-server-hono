import type { Context } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";

export const error = (
	c: Context<any, any, any>,
	msg: string,
	httpCat?: ContentfulStatusCode
) => {
	if (typeof httpCat !== undefined) {
		return c.json({ ok: false, reason: msg }, httpCat);
	}
	return c.json({ ok: false, reason: msg });
};
