import { Hono } from "hono";
import type { AuthEnv } from "~/library/middleware/auth";
import contentTypes from "./content-types";
import contentItems from "./content-items";

const app = new Hono<AuthEnv>();

app.get("/", async (c) => {
  return c.json({
    ok: true,
    msg: "CMS API is running"
  });
});

app.route("/content-types", contentTypes);
app.route("/content-items", contentItems);

export default app;
