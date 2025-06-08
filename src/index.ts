import { Hono } from "hono";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { init, env } from "~/library/helpers/env";
import sona from "~/routes/sona";
import vona from "~/routes/vona";
import { logger } from "~/library/middleware/logger";

init();

const app = new Hono();

app.use(prettyJSON());
app.use("/*", logger);

function getOrigin() {
	if (env.MODE() == "prod") {
		return env.CORS_ORIGIN();
	}
	return "http://localhost:3000";
}

app.use(
	"/*",
	cors({
		origin: getOrigin(),
		allowHeaders: [
			"ui-access-token",
			"Content-Type",
			"Authorization",
			"Accept",
		],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	})
);

// tbqh I'm learning Hono too, idfk how this works.
// We'll have to test and check /thing vs /thing/*
app.route("/vona/*", vona);
app.route("/sona/", sona);

export default {
	port: 3050,
	fetch: app.fetch,
};
