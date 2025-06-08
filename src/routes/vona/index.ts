import { Hono } from "hono";
import { auth as AMW, type AuthEnv } from "~/library/middleware/auth";
import user from "./user";
import cms from "./cms";
// import auth from "./auth";

const app = new Hono();

app.route("/user", user);
app.use(AMW);
app.route("/cms", cms);

export default app;
